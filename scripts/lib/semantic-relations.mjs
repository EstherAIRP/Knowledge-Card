import crypto from 'node:crypto';
import { extractSection } from './knowledge.mjs';
import {
  effectiveRelevance,
  effectiveValue,
  relationPairKey,
  scoreCardPair
} from './relations.mjs';

export const PHASE2_RELATION_TYPES = Object.freeze([
  'similar_to',
  'alternative_to',
  'complements',
  'integrates_with',
  'depends_on',
  'extends',
  'contrasts_with'
]);

export const PHASE2_RELATION_TYPE_SET = new Set(PHASE2_RELATION_TYPES);

export const RELATION_CLASSIFIER_SCHEMA = Object.freeze({
  type: 'object',
  additionalProperties: false,
  required: ['related', 'type', 'confidence', 'reason'],
  properties: {
    related: { type: 'boolean' },
    type: { type: 'string', enum: PHASE2_RELATION_TYPES },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    reason: { type: 'string', minLength: 1, maxLength: 600 }
  }
});

const EMBEDDING_SECTIONS = [
  '一句話介紹',
  '核心概念',
  '架構與技術',
  '技術亮點'
];

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function compactWhitespace(value) {
  return String(value ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildEmbeddingText(card, { maxChars = 12000 } = {}) {
  const data = card?.data ?? {};
  const categories = effectiveValue(data.classification?.categories) ?? [];
  const tags = effectiveValue(data.classification?.tags) ?? [];
  const relevance = effectiveRelevance(data.relevance);
  const actions = effectiveValue(data.actions) ?? [];
  const sections = EMBEDDING_SECTIONS
    .map((heading) => {
      const content = extractSection(card?.body ?? '', heading);
      return content ? `${heading}: ${compactWhitespace(content)}` : null;
    })
    .filter(Boolean);

  const text = [
    `Title: ${data.title ?? data.id ?? ''}`,
    `Summary: ${data.summary ?? ''}`,
    `Categories: ${asArray(categories).join(', ')}`,
    `Tags: ${asArray(tags).join(', ')}`,
    `Actions: ${asArray(actions).join(', ')}`,
    `Relevance: ${Object.entries(relevance).map(([key, value]) => `${key}=${value}`).join(', ')}`,
    ...sections
  ]
    .map(compactWhitespace)
    .filter(Boolean)
    .join('\n');

  return text.slice(0, maxChars);
}

export function embeddingContentHash(text, { provider, model } = {}) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify({ provider: provider ?? null, model: model ?? null, text }))
    .digest('hex');
}

export function cosineSimilarity(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length === 0 || left.length !== right.length) {
    return null;
  }

  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) {
    const a = Number(left[index]);
    const b = Number(right[index]);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    dot += a * b;
    leftNorm += a * a;
    rightNorm += b * b;
  }

  if (leftNorm === 0 || rightNorm === 0) return null;
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

function embeddingMap(index) {
  return new Map(
    asArray(index?.entries)
      .filter((entry) => entry?.card_id && Array.isArray(entry.embedding))
      .map((entry) => [entry.card_id, entry])
  );
}

function resolveScoring(config = {}) {
  const scoring = config.scoring ?? {};
  return {
    taxonomyWeight: Number(scoring.taxonomy_weight ?? 0.4),
    semanticWeight: Number(scoring.semantic_weight ?? 0.6),
    llmWeight: Number(scoring.llm_weight ?? 0.35),
    minCombinedScore: Number(scoring.min_combined_score ?? 0.3)
  };
}

export function combineTaxonomySemantic(taxonomyScore, semanticScore, config = {}) {
  const { taxonomyWeight, semanticWeight } = resolveScoring(config);
  const taxonomy = Number(taxonomyScore ?? 0);
  if (!Number.isFinite(semanticScore)) return Number(taxonomy.toFixed(4));

  const semantic = Number(semanticScore);
  const weightSum = taxonomyWeight + semanticWeight;
  if (weightSum <= 0) return Number(((taxonomy + semantic) / 2).toFixed(4));
  return Number(((taxonomy * taxonomyWeight + semantic * semanticWeight) / weightSum).toFixed(4));
}

export function buildSemanticCandidates(cards, embeddingIndex, config = {}) {
  const embeddings = embeddingMap(embeddingIndex);
  const candidateConfig = config.candidate ?? {};
  const semanticConfig = config.semantic ?? {};
  const minTaxonomy = Number(candidateConfig.min_taxonomy_score ?? 0.08);
  const minSemantic = Number(semanticConfig.min_score ?? 0.3);
  const topK = Number(candidateConfig.top_k ?? 12);
  const { minCombinedScore } = resolveScoring(config);

  const candidates = [];
  for (let left = 0; left < cards.length; left += 1) {
    for (let right = left + 1; right < cards.length; right += 1) {
      const taxonomy = scoreCardPair(cards[left], cards[right]);
      if (!taxonomy) continue;

      const source = taxonomy.source;
      const target = taxonomy.target;
      const leftEmbedding = embeddings.get(source)?.embedding;
      const rightEmbedding = embeddings.get(target)?.embedding;
      const semanticRaw = cosineSimilarity(leftEmbedding, rightEmbedding);
      const semantic = Number.isFinite(semanticRaw)
        ? Number(Math.max(0, Math.min(1, semanticRaw)).toFixed(4))
        : null;
      const combined = combineTaxonomySemantic(taxonomy.score, semantic, config);

      const passesSignalGate = taxonomy.score >= minTaxonomy || (semantic !== null && semantic >= minSemantic);
      if (!passesSignalGate || combined < minCombinedScore) continue;

      candidates.push({
        source,
        target,
        taxonomy_score: taxonomy.score,
        semantic_score: semantic,
        combined_score: combined,
        signals: taxonomy.signals
      });
    }
  }

  candidates.sort((a, b) =>
    b.combined_score - a.combined_score || relationPairKey(a.source, a.target).localeCompare(relationPairKey(b.source, b.target))
  );

  const degree = new Map();
  const accepted = [];
  for (const candidate of candidates) {
    const sourceDegree = degree.get(candidate.source) ?? 0;
    const targetDegree = degree.get(candidate.target) ?? 0;
    if (sourceDegree >= topK || targetDegree >= topK) continue;
    accepted.push(candidate);
    degree.set(candidate.source, sourceDegree + 1);
    degree.set(candidate.target, targetDegree + 1);
  }

  return accepted.sort((a, b) =>
    a.source.localeCompare(b.source) || a.target.localeCompare(b.target)
  );
}

export function validateClassifierOutput(value) {
  const errors = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return ['classifier output must be an object.'];
  }

  for (const key of ['related', 'type', 'confidence', 'reason']) {
    if (!(key in value)) errors.push(`classifier output missing ${key}.`);
  }
  if (typeof value.related !== 'boolean') errors.push('classifier related must be boolean.');
  if (!PHASE2_RELATION_TYPE_SET.has(value.type)) errors.push(`classifier type is unsupported: ${value.type}`);
  if (!Number.isFinite(Number(value.confidence)) || Number(value.confidence) < 0 || Number(value.confidence) > 1) {
    errors.push('classifier confidence must be between 0 and 1.');
  }
  if (typeof value.reason !== 'string' || value.reason.trim().length === 0 || value.reason.length > 600) {
    errors.push('classifier reason must be a non-empty string up to 600 characters.');
  }
  return errors;
}

export function fallbackClassifyCandidate(candidate) {
  const semantic = Number(candidate.semantic_score ?? 0);
  const taxonomy = Number(candidate.taxonomy_score ?? 0);
  const type = semantic >= 0.82 && taxonomy >= 0.32 ? 'similar_to' : 'complements';
  const confidence = Number(Math.max(0.35, Math.min(0.78, candidate.combined_score)).toFixed(4));
  const reason = type === 'similar_to'
    ? 'Metadata 與語意向量都顯示兩張 Card 聚焦高度相近的技術主題；目前未經 LLM 語義分類，先以 similar_to 作為保守 fallback。'
    : '兩張 Card 具有足夠的 metadata／語意相近度，但無法僅靠 deterministic signals 判斷更細的方向性關係；目前以 complements 作為保守 fallback。';

  return {
    related: true,
    type,
    confidence,
    reason,
    classifier: 'heuristic-fallback'
  };
}

export function materializeClassifiedRelation(candidate, classification, config = {}) {
  const errors = validateClassifierOutput(classification);
  if (errors.length) throw new Error(errors.join(' '));
  if (!classification.related) return null;

  const { llmWeight } = resolveScoring(config);
  const base = Number(candidate.combined_score ?? 0);
  const confidence = Number(classification.confidence ?? 0);
  const score = Number((base * (1 - llmWeight) + confidence * llmWeight).toFixed(4));

  return {
    source: candidate.source,
    target: candidate.target,
    type: classification.type,
    score,
    scores: {
      taxonomy: Number(candidate.taxonomy_score ?? 0),
      semantic: Number.isFinite(candidate.semantic_score) ? Number(candidate.semantic_score) : null,
      llm: classification.classifier === 'llm' ? confidence : null,
      combined: base
    },
    reason: classification.reason.trim(),
    confidence,
    classifier: classification.classifier ?? 'llm',
    signals: candidate.signals ?? []
  };
}
