import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

export function validateGraphLayoutIndex(layout, embeddings) {
  const errors = [];

  if (!isObject(layout)) {
    return ['graph layout index must be an object.'];
  }
  if (!isObject(embeddings)) {
    return ['embedding index must be an object.'];
  }

  if (layout.schema_version !== 1) errors.push('graph layout schema_version must equal 1.');
  if (layout.method !== 'classical-mds') errors.push(`graph layout method must equal classical-mds; got ${layout.method ?? '(missing)'}.`);
  if (layout.metric !== 'cosine-distance') errors.push(`graph layout metric must equal cosine-distance; got ${layout.metric ?? '(missing)'}.`);

  if (!isNonEmptyString(layout.generated_at) || Number.isNaN(Date.parse(layout.generated_at))) {
    errors.push('graph layout generated_at must be a valid timestamp.');
  }

  for (const [layoutKey, embeddingKey, label] of [
    ['embedding_provider', 'provider', 'embedding provider'],
    ['embedding_model', 'model', 'embedding model'],
    ['embedding_input_hash', 'input_hash', 'embedding input hash']
  ]) {
    if (layout[layoutKey] !== embeddings[embeddingKey]) {
      errors.push(`graph layout ${label} does not match data/embeddings.json.`);
    }
  }

  if (!Array.isArray(embeddings.entries)) {
    errors.push('embedding entries must be an array.');
    return errors;
  }

  const embeddingIds = [];
  const embeddingIdSet = new Set();
  for (const [index, entry] of embeddings.entries.entries()) {
    const cardId = entry?.card_id;
    if (!isNonEmptyString(cardId)) {
      errors.push(`embeddings.entries[${index}].card_id is required.`);
      continue;
    }
    if (embeddingIdSet.has(cardId)) {
      errors.push(`embedding index duplicates card_id ${cardId}.`);
      continue;
    }
    embeddingIdSet.add(cardId);
    embeddingIds.push(cardId);
  }

  if (Number(layout.card_count) !== embeddingIds.length) {
    errors.push(`graph layout card_count ${layout.card_count} does not match ${embeddingIds.length} embedding entries.`);
  }
  if (Number(embeddings.card_count) !== embeddingIds.length) {
    errors.push(`embedding card_count ${embeddings.card_count} does not match ${embeddingIds.length} embedding entries.`);
  }

  if (!isObject(layout.quality)) {
    errors.push('graph layout quality must be an object.');
  } else if (!isFiniteNumber(layout.quality.stress) || Number(layout.quality.stress) < 0) {
    errors.push('graph layout quality.stress must be a finite non-negative number.');
  }

  if (!isObject(layout.nodes)) {
    errors.push('graph layout nodes must be an object.');
    return errors;
  }

  const layoutIds = Object.keys(layout.nodes);
  for (const cardId of embeddingIds) {
    if (!Object.prototype.hasOwnProperty.call(layout.nodes, cardId)) {
      errors.push(`graph layout is missing card ${cardId}.`);
      continue;
    }

    const point = layout.nodes[cardId];
    if (!isObject(point)) {
      errors.push(`graph layout node ${cardId} must be an object.`);
      continue;
    }

    for (const axis of ['x', 'y']) {
      const value = Number(point[axis]);
      if (!Number.isFinite(value)) {
        errors.push(`graph layout node ${cardId}.${axis} must be a finite number.`);
      } else if (value < -1.000001 || value > 1.000001) {
        errors.push(`graph layout node ${cardId}.${axis} must stay within normalized range [-1, 1].`);
      }
    }
  }

  for (const cardId of layoutIds) {
    if (!embeddingIdSet.has(cardId)) {
      errors.push(`graph layout references card not present in embeddings: ${cardId}.`);
    }
  }

  if (layoutIds.length !== embeddingIds.length) {
    errors.push(`graph layout node count ${layoutIds.length} does not match ${embeddingIds.length} embedding entries.`);
  }

  return errors;
}

export function validateGraphLayoutFiles({
  embeddingPath,
  layoutPath
}) {
  const errors = [];

  if (!fs.existsSync(embeddingPath)) {
    errors.push('data/embeddings.json does not exist. Run npm run embeddings:build first.');
  }
  if (!fs.existsSync(layoutPath)) {
    errors.push('data/graph-layout.json does not exist. Run npm run graph-layout:build first.');
  }
  if (errors.length) return errors;

  let embeddings;
  let layout;

  try {
    embeddings = JSON.parse(fs.readFileSync(embeddingPath, 'utf8'));
  } catch (error) {
    errors.push(`data/embeddings.json is invalid JSON: ${error.message}`);
  }

  try {
    layout = JSON.parse(fs.readFileSync(layoutPath, 'utf8'));
  } catch (error) {
    errors.push(`data/graph-layout.json is invalid JSON: ${error.message}`);
  }

  if (!errors.length) {
    errors.push(...validateGraphLayoutIndex(layout, embeddings));
  }
  return errors;
}

function main() {
  const repoRoot = fileURLToPath(new URL('../', import.meta.url));
  const embeddingPath = path.join(repoRoot, 'data', 'embeddings.json');
  const layoutPath = path.join(repoRoot, 'data', 'graph-layout.json');
  const errors = validateGraphLayoutFiles({ embeddingPath, layoutPath });

  if (errors.length) {
    console.error('Graph layout validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  const layout = JSON.parse(fs.readFileSync(layoutPath, 'utf8'));
  console.log(`Graph layout validation passed for ${layout.card_count} cards (stress ${layout.quality.stress}).`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  main();
}
