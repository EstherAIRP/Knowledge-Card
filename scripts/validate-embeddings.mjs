import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCards } from './lib/knowledge.mjs';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const contentRoot = path.join(repoRoot, 'content', 'knowledge');
const indexPath = path.join(repoRoot, 'data', 'embeddings.json');

const errors = [];
if (!fs.existsSync(indexPath)) {
  errors.push('data/embeddings.json does not exist. Run npm run embeddings:build.');
} else {
  let index = null;
  try {
    index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } catch (error) {
    errors.push(`data/embeddings.json is invalid JSON: ${error.message}`);
  }

  if (index) {
    if (index.schema_version !== 1) errors.push('embedding schema_version must equal 1.');
    if (!index.provider || typeof index.provider !== 'string') errors.push('embedding provider is required.');
    if (!index.model || typeof index.model !== 'string') errors.push('embedding model is required.');
    if (!Array.isArray(index.entries)) {
      errors.push('embedding entries must be an array.');
    } else {
      const cards = loadCards(contentRoot);
      const cardIds = new Set(cards.map((card) => card.data.id));
      const seen = new Set();
      let dimensions = null;

      for (const [position, entry] of index.entries.entries()) {
        const label = `entries[${position}]`;
        if (!entry?.card_id) {
          errors.push(`${label} card_id is required.`);
          continue;
        }
        if (seen.has(entry.card_id)) errors.push(`${label} duplicates card_id ${entry.card_id}.`);
        seen.add(entry.card_id);
        if (!cardIds.has(entry.card_id)) errors.push(`${label} references missing card ${entry.card_id}.`);
        if (!entry.content_hash || typeof entry.content_hash !== 'string') errors.push(`${label} content_hash is required.`);
        if (entry.provider !== index.provider) errors.push(`${label} provider does not match index provider.`);
        if (entry.model !== index.model) errors.push(`${label} model does not match index model.`);
        if (!Array.isArray(entry.embedding) || entry.embedding.length === 0) {
          errors.push(`${label} embedding must be a non-empty array.`);
          continue;
        }
        if (entry.embedding.some((value) => !Number.isFinite(Number(value)))) {
          errors.push(`${label} embedding contains non-finite values.`);
        }
        if (Number(entry.dimensions) !== entry.embedding.length) errors.push(`${label} dimensions does not match embedding length.`);
        dimensions ??= entry.embedding.length;
        if (entry.embedding.length !== dimensions) errors.push(`${label} embedding dimensions differ from the index.`);
      }

      for (const id of cardIds) {
        if (!seen.has(id)) errors.push(`missing embedding for card ${id}.`);
      }
      if (Number(index.card_count) !== cards.length) errors.push(`card_count ${index.card_count} does not match ${cards.length} Knowledge Cards.`);
    }
  }
}

if (errors.length) {
  console.error('Embedding validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Embedding index validation passed.');
