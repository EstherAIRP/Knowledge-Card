import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { loadCards } from './lib/knowledge.mjs';
import {
  DEFAULT_RELATION_CONFIG,
  applyRelationOverrides,
  buildGeneratedRelations,
  effectiveRelevance,
  effectiveValue,
  validateRelationOverrides
} from './lib/relations.mjs';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const contentRoot = path.join(repoRoot, 'content', 'knowledge');
const overridePath = path.join(repoRoot, 'config', 'relation-overrides.yaml');
const outputPath = path.join(repoRoot, 'data', 'relations.json');
const relationLibPath = path.join(repoRoot, 'scripts', 'lib', 'relations.mjs');
const scriptPath = fileURLToPath(import.meta.url);

function readOverrides() {
  if (!fs.existsSync(overridePath)) return { pinned: [], blocked: [], overrides: [] };
  return parseYaml(fs.readFileSync(overridePath, 'utf8')) ?? {};
}

function stableCardInput(card) {
  const data = card.data;
  return {
    id: data.id,
    categories: [...(effectiveValue(data.classification?.categories) ?? [])].sort(),
    tags: [...(effectiveValue(data.classification?.tags) ?? [])].sort(),
    relevance: effectiveRelevance(data.relevance),
    actions: [...(effectiveValue(data.actions) ?? [])].sort(),
    source_type: data.source?.type ?? null
  };
}

function calculateInputHash(cards, overrides) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(cards.map(stableCardInput).sort((a, b) => a.id.localeCompare(b.id))));
  hash.update(JSON.stringify(overrides));
  hash.update(fs.readFileSync(relationLibPath));
  hash.update(fs.readFileSync(scriptPath));
  return hash.digest('hex');
}

const cards = loadCards(contentRoot);
const cardIds = new Set(cards.map((card) => card.data.id));
const overrides = readOverrides();
const overrideErrors = validateRelationOverrides(overrides, cardIds);
if (overrideErrors.length) {
  console.error('Relation override validation failed:');
  for (const error of overrideErrors) console.error(`- ${error}`);
  process.exit(1);
}

const inputHash = calculateInputHash(cards, overrides);
let existing = null;
if (fs.existsSync(outputPath)) {
  try {
    existing = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  } catch {
    existing = null;
  }
}

if (existing?.input_hash === inputHash) {
  console.log(`Relation index unchanged (${existing.edges?.length ?? 0} edges).`);
  process.exit(0);
}

const generated = buildGeneratedRelations(cards, DEFAULT_RELATION_CONFIG);
const edges = applyRelationOverrides(generated, overrides);
const index = {
  schema_version: 1,
  generated_at: new Date().toISOString(),
  input_hash: inputHash,
  card_count: cards.length,
  config: {
    min_score: DEFAULT_RELATION_CONFIG.minScore,
    similar_to_min_score: DEFAULT_RELATION_CONFIG.similarToMinScore,
    top_k: DEFAULT_RELATION_CONFIG.topK,
    weights: DEFAULT_RELATION_CONFIG.weights
  },
  edges
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
console.log(`Relation index generated: ${edges.length} edges across ${cards.length} cards.`);
