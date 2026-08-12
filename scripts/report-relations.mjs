import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const relationPath = path.join(repoRoot, 'data', 'relations.json');

if (!fs.existsSync(relationPath)) {
  console.log('No relation index available.');
  process.exit(0);
}

const index = JSON.parse(fs.readFileSync(relationPath, 'utf8'));
const edges = Array.isArray(index.edges) ? [...index.edges] : [];
edges.sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0));

console.log(`Relation diagnostics: ${edges.length} effective edges / ${index.pipeline?.candidate_count ?? '?'} candidates`);
for (const edge of edges.slice(0, 30)) {
  const scores = edge.scores ?? {};
  console.log([
    `${edge.source} <> ${edge.target}`,
    `type=${edge.type}`,
    `score=${edge.score}`,
    `taxonomy=${scores.taxonomy ?? '-'}`,
    `semantic=${scores.semantic ?? '-'}`,
    `semantic_raw=${scores.semantic_raw ?? '-'}`,
    `combined=${scores.combined ?? '-'}`,
    `llm=${scores.llm ?? '-'}`,
    `classifier=${edge.classifier ?? '-'}`
  ].join(' | '));
}
