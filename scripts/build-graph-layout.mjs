import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGraphLayoutIndex } from './lib/graph-layout.mjs';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const embeddingPath = path.join(repoRoot, 'data', 'embeddings.json');
const outputPath = path.join(repoRoot, 'data', 'graph-layout.json');

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function stableMaterial(index) {
  if (!index) return null;
  const copy = structuredClone(index);
  delete copy.generated_at;
  return copy;
}

const embeddings = readJson(embeddingPath);
if (!embeddings) {
  throw new Error('Missing or invalid data/embeddings.json. Run npm run embeddings:build first.');
}

const existing = readJson(outputPath);
const next = buildGraphLayoutIndex(embeddings, {
  generatedAt: existing?.generated_at ?? new Date().toISOString()
});

if (JSON.stringify(stableMaterial(existing)) === JSON.stringify(stableMaterial(next))) {
  console.log(`Graph layout unchanged (${next.card_count} cards, stress=${next.quality.stress}).`);
  process.exit(0);
}

next.generated_at = new Date().toISOString();
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
console.log(
  `Graph layout generated: ${next.card_count} cards using ${next.method} ` +
  `(stress=${next.quality.stress}, iterations=${next.quality.iterations}).`
);
