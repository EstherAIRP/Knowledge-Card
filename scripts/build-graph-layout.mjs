import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildCosineDistanceMatrix,
  calculateStress,
  classicalMds,
  normalizeCoordinates
} from './lib/graph-layout.mjs';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const embeddingPath = path.join(repoRoot, 'data', 'embeddings.json');
const outputPath = path.join(repoRoot, 'data', 'graph-layout.json');

function readEmbeddings() {
  if (!fs.existsSync(embeddingPath)) throw new Error('Missing data/embeddings.json. Run npm run embeddings:build first.');
  const data = JSON.parse(fs.readFileSync(embeddingPath, 'utf8'));
  if (data.schema_version !== 1 || !Array.isArray(data.entries)) {
    throw new Error('data/embeddings.json is not a supported embedding index.');
  }
  return data;
}

function stableMaterial(index) {
  if (!index) return null;
  const copy = structuredClone(index);
  delete copy.generated_at;
  return copy;
}

const embeddings = readEmbeddings();
const entries = [...embeddings.entries].sort((a, b) => a.card_id.localeCompare(b.card_id));

for (const entry of entries) {
  if (!entry.card_id || !Array.isArray(entry.embedding) || entry.embedding.length === 0) {
    throw new Error(`Invalid embedding entry: ${entry.card_id ?? '<missing card_id>'}.`);
  }
}

const distances = buildCosineDistanceMatrix(entries);
const rawCoordinates = classicalMds(distances, 2);
const normalizedCoordinates = normalizeCoordinates(rawCoordinates);
const nodes = Object.fromEntries(entries.map((entry, index) => [entry.card_id, {
  x: Number(normalizedCoordinates[index]?.[0] ?? 0),
  y: Number(normalizedCoordinates[index]?.[1] ?? 0)
}]));

const existing = fs.existsSync(outputPath)
  ? JSON.parse(fs.readFileSync(outputPath, 'utf8'))
  : null;

const next = {
  schema_version: 1,
  generated_at: existing?.generated_at ?? new Date().toISOString(),
  method: 'classical-mds',
  metric: 'cosine-distance',
  embedding_provider: embeddings.provider ?? null,
  embedding_model: embeddings.model ?? null,
  embedding_input_hash: embeddings.input_hash ?? null,
  card_count: entries.length,
  quality: {
    stress: Number(calculateStress(distances, rawCoordinates).toFixed(8))
  },
  nodes
};

if (JSON.stringify(stableMaterial(existing)) === JSON.stringify(stableMaterial(next))) {
  console.log(`Graph layout unchanged (${entries.length} cards, stress ${next.quality.stress}).`);
  process.exit(0);
}

next.generated_at = new Date().toISOString();
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
console.log(`Graph layout written: ${entries.length} cards, stress ${next.quality.stress}.`);
