import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { loadCards } from './lib/knowledge.mjs';
import { buildConceptIndex } from './lib/concepts.mjs';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const contentRoot = path.join(repoRoot, 'content', 'knowledge');
const configPath = path.join(repoRoot, 'config', 'concept-config.yaml');
const outputPath = path.join(repoRoot, 'data', 'concepts.json');

function hashJson(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function stableMaterial(index) {
  if (!index) return null;
  const copy = structuredClone(index);
  delete copy.generated_at;
  return copy;
}

if (!fs.existsSync(configPath)) {
  console.error('config/concept-config.yaml does not exist.');
  process.exit(1);
}

const config = parseYaml(fs.readFileSync(configPath, 'utf8')) ?? {};
if (config.schema_version !== 1) {
  console.error('concept-config schema_version must equal 1.');
  process.exit(1);
}

const cards = loadCards(contentRoot).sort((a, b) => a.data.id.localeCompare(b.data.id));
const generated = buildConceptIndex(cards, config);
const inputHash = hashJson({
  config,
  cards: cards.map((card) => ({
    id: card.data.id,
    title: card.data.title,
    summary: card.data.summary,
    categories: card.data.classification?.categories,
    tags: card.data.classification?.tags
  }))
});

let existing = null;
if (fs.existsSync(outputPath)) {
  try {
    existing = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  } catch {
    existing = null;
  }
}

const index = {
  schema_version: 1,
  generated_at: existing?.generated_at ?? new Date().toISOString(),
  input_hash: inputHash,
  ...generated
};

if (JSON.stringify(stableMaterial(existing)) === JSON.stringify(stableMaterial(index))) {
  console.log(`Concept index unchanged (${generated.stats.concept_count} concepts).`);
  process.exit(0);
}

index.generated_at = new Date().toISOString();
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
console.log(`Concept index generated: ${generated.stats.concept_count} concepts, ${generated.stats.card_concept_edge_count} Card↔Concept edges, ${generated.stats.concept_relation_edge_count} Concept↔Concept edges across ${generated.stats.card_count} cards.`);
