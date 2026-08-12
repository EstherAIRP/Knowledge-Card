import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { loadCards } from './lib/knowledge.mjs';
import {
  applyRelationOverrides,
  buildGeneratedRelations,
  relationPairKey,
  validateRelationOverrides
} from './lib/relations.mjs';
import {
  buildEmbeddingText,
  buildSemanticCandidates,
  fallbackClassifyCandidate,
  materializeClassifiedRelation,
  validateClassifierOutput
} from './lib/semantic-relations.mjs';
import { classifyRelationWithOpenAICompatible } from './lib/model-clients.mjs';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const contentRoot = path.join(repoRoot, 'content', 'knowledge');
const overridePath = path.join(repoRoot, 'config', 'relation-overrides.yaml');
const configPath = path.join(repoRoot, 'config', 'relation-config.yaml');
const embeddingPath = path.join(repoRoot, 'data', 'embeddings.json');
const outputPath = path.join(repoRoot, 'data', 'relations.json');

const semanticRequested = process.argv.includes('--semantic');
const classifyRequested = process.argv.includes('--classify');
const fullRebuild = process.argv.includes('--full');

function readYaml(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) return fallback;
  return parseYaml(fs.readFileSync(filePath, 'utf8')) ?? fallback;
}

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function hashJson(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function classificationCandidateHash(candidate, embeddings, config) {
  const embeddingEntries = new Map((embeddings?.entries ?? []).map((entry) => [entry.card_id, entry]));
  return hashJson({
    source: candidate.source,
    target: candidate.target,
    source_hash: embeddingEntries.get(candidate.source)?.content_hash ?? null,
    target_hash: embeddingEntries.get(candidate.target)?.content_hash ?? null,
    taxonomy_score: candidate.taxonomy_score,
    semantic_score: candidate.semantic_score,
    combined_score: candidate.combined_score,
    classifier_model: config.classifier?.model ?? null,
    relation_types: config.relations?.allowed_types ?? []
  });
}

function classifierEligibility(candidates, maxPerCard) {
  const degree = new Map();
  const allowed = new Set();
  const sorted = [...candidates].sort((a, b) =>
    b.combined_score - a.combined_score || relationPairKey(a.source, a.target).localeCompare(relationPairKey(b.source, b.target))
  );

  for (const candidate of sorted) {
    const sourceDegree = degree.get(candidate.source) ?? 0;
    const targetDegree = degree.get(candidate.target) ?? 0;
    if (sourceDegree >= maxPerCard || targetDegree >= maxPerCard) continue;
    allowed.add(relationPairKey(candidate.source, candidate.target));
    degree.set(candidate.source, sourceDegree + 1);
    degree.set(candidate.target, targetDegree + 1);
  }
  return allowed;
}

function normalizePhase1Edges(cards) {
  return buildGeneratedRelations(cards).map((edge) => ({
    ...edge,
    direction: 'undirected',
    scores: {
      taxonomy: edge.score,
      semantic: null,
      semantic_raw: null,
      llm: null,
      combined: edge.score
    },
    reason: 'Phase 1 metadata signals 產生的關聯；目前沒有可用的 semantic embedding。',
    confidence: edge.score,
    classifier: 'metadata-fallback'
  }));
}

function stableMaterial(index) {
  if (!index) return null;
  const copy = structuredClone(index);
  delete copy.generated_at;
  return copy;
}

function actualClassifierMode(classifications) {
  const values = Object.values(classifications);
  const llmCount = values.filter((item) => item?.classifier === 'llm').length;
  const fallbackCount = values.filter((item) => item?.classifier !== 'llm').length;
  if (llmCount && fallbackCount) return 'llm-with-fallback';
  if (llmCount) return 'llm';
  return 'semantic-fallback';
}

const cards = loadCards(contentRoot).sort((a, b) => a.data.id.localeCompare(b.data.id));
const cardIds = new Set(cards.map((card) => card.data.id));
const cardMap = new Map(cards.map((card) => [card.data.id, card]));
const overrides = readYaml(overridePath, { pinned: [], blocked: [], overrides: [] });
const config = readYaml(configPath, {});
const existing = readJson(outputPath, null);
const embeddings = readJson(embeddingPath, null);

const overrideErrors = validateRelationOverrides(overrides, cardIds);
if (overrideErrors.length) {
  console.error('Relation override validation failed:');
  for (const error of overrideErrors) console.error(`- ${error}`);
  process.exit(1);
}

const semanticAvailable = embeddings?.schema_version === 1 && Array.isArray(embeddings.entries) && embeddings.entries.length === cards.length;
const useSemantic = config.semantic?.enabled !== false && (semanticRequested || semanticAvailable) && semanticAvailable;
const classifierConfig = config.classifier ?? {};
const classifierKeyEnv = classifierConfig.api_key_env ?? 'OPENAI_API_KEY';
const classifierApiKey = process.env[classifierKeyEnv] ?? '';
const canUseLlm = classifyRequested && classifierConfig.enabled !== false && classifierConfig.provider === 'openai-compatible' && Boolean(classifierApiKey);

let generatedEdges = [];
let classifications = {};
let candidateCount = 0;
let classifierMode = 'metadata-fallback';

if (!useSemantic) {
  generatedEdges = normalizePhase1Edges(cards);
} else {
  const candidates = buildSemanticCandidates(cards, embeddings, config);
  candidateCount = candidates.length;
  const eligibleForLlm = classifierEligibility(candidates, Math.max(1, Number(classifierConfig.max_candidates_per_card ?? 6)));
  const existingClassifications = existing?.classifications ?? {};

  for (const candidate of candidates) {
    const pairKey = relationPairKey(candidate.source, candidate.target);
    const wantsLlm = canUseLlm && eligibleForLlm.has(pairKey);
    const candidateHash = classificationCandidateHash(candidate, embeddings, config);
    const cached = existingClassifications[pairKey];
    const cachedValid = cached?.candidate_hash === candidateHash && validateClassifierOutput(cached).length === 0;
    const preserveLlmWithoutApi = fullRebuild && !canUseLlm && cachedValid && cached.classifier === 'llm';
    const cacheMatches = cachedValid && ((!fullRebuild || preserveLlmWithoutApi) && (!wantsLlm || cached.classifier === 'llm'));

    let decision = null;
    if (cacheMatches) {
      decision = cached;
    } else if (wantsLlm) {
      try {
        const left = buildEmbeddingText(cardMap.get(candidate.source));
        const right = buildEmbeddingText(cardMap.get(candidate.target));
        decision = await classifyRelationWithOpenAICompatible({
          left,
          right,
          candidate,
          baseUrl: classifierConfig.base_url,
          model: classifierConfig.model,
          apiKey: classifierApiKey,
          timeoutMs: Number(classifierConfig.timeout_ms ?? 45000),
          retries: Number(classifierConfig.retries ?? 2)
        });
        const errors = validateClassifierOutput(decision);
        if (errors.length) throw new Error(errors.join(' '));
      } catch (error) {
        console.warn(`LLM relation classification failed for ${pairKey}: ${error.message}`);
        if (cachedValid && cached.classifier === 'llm') {
          console.warn(`Preserving previous LLM classification for ${pairKey}.`);
          decision = cached;
        } else {
          decision = fallbackClassifyCandidate(candidate);
        }
      }
    } else {
      decision = fallbackClassifyCandidate(candidate);
    }

    classifications[pairKey] = {
      candidate_hash: candidateHash,
      related: decision.related,
      type: decision.type,
      direction: decision.direction,
      confidence: Number(decision.confidence),
      reason: decision.reason,
      classifier: decision.classifier ?? 'heuristic-fallback'
    };

    const edge = materializeClassifiedRelation(candidate, classifications[pairKey], config);
    if (edge) generatedEdges.push({ ...edge, candidate_hash: candidateHash });
  }

  classifierMode = actualClassifierMode(classifications);
}

const hasLlmClassifications = Object.values(classifications).some((item) => item?.classifier === 'llm');
const edges = applyRelationOverrides(generatedEdges, overrides);
const newIndex = {
  schema_version: 2,
  generated_at: existing?.generated_at ?? new Date().toISOString(),
  card_count: cards.length,
  input_hash: hashJson({
    embedding_input_hash: embeddings?.input_hash ?? null,
    use_semantic: useSemantic,
    classifier_mode: classifierMode,
    config,
    overrides,
    candidates: Object.entries(classifications).map(([key, value]) => [key, value.candidate_hash]).sort((a, b) => a[0].localeCompare(b[0]))
  }),
  pipeline: {
    semantic: useSemantic,
    semantic_provider: useSemantic ? embeddings.provider : null,
    semantic_model: useSemantic ? embeddings.model : null,
    classifier_mode: classifierMode,
    classifier_model: hasLlmClassifications ? classifierConfig.model : null,
    candidate_count: candidateCount
  },
  config: {
    candidate: config.candidate ?? null,
    semantic: useSemantic ? {
      normalization_floor: config.semantic?.normalization_floor ?? null,
      normalization_ceiling: config.semantic?.normalization_ceiling ?? null,
      min_score: config.semantic?.min_score ?? null
    } : null,
    scoring: config.scoring ?? null,
    relation_types: config.relations?.allowed_types ?? []
  },
  classifications,
  edges
};

if (JSON.stringify(stableMaterial(existing)) === JSON.stringify(stableMaterial(newIndex))) {
  console.log(`Relation index unchanged (${edges.length} edges).`);
  process.exit(0);
}

newIndex.generated_at = new Date().toISOString();
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(newIndex, null, 2)}\n`, 'utf8');
console.log(`Relation index generated: ${edges.length} edges from ${candidateCount || generatedEdges.length} candidates across ${cards.length} cards (${classifierMode}).`);
if (classifyRequested && !canUseLlm) {
  console.log(`LLM classifier not activated because ${classifierKeyEnv} is unavailable or provider is disabled; cached LLM decisions are preserved and new candidates use semantic fallback.`);
}
