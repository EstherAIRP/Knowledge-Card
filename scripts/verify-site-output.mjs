import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { loadCards } from './lib/knowledge.mjs';
import { projectGraph, readRequiredJson } from './lib/graph-projection.mjs';

const root = process.cwd();
const contentRoot = path.join(root, 'content/knowledge');
const conceptPath = path.join(root, 'data/concepts.json');
const relationPath = path.join(root, 'data/relations.json');
const embeddingPath = path.join(root, 'data/embeddings.json');
const layoutPath = path.join(root, 'data/graph-layout.json');
const distRoot = path.join(root, 'docs/.vitepress/dist');
const errors = [];

function requireFile(relativePath) {
  const fullPath = path.join(distRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing built file: ${relativePath}`);
    return;
  }

  const stat = fs.statSync(fullPath);
  if (!stat.isFile() || stat.size === 0) {
    errors.push(`Built file is empty or invalid: ${relativePath}`);
  }
}

function edgeKey(edge) {
  const direction = edge.kind === 'card-card' ? edge.direction ?? 'undirected' : '';
  return [edge.kind, edge.source, edge.target, edge.type, direction].join('|');
}

function verifyGraphProjection(graph, cards, concepts, relations, embeddings, layout) {
  const conceptList = concepts.concepts ?? [];
  const cardConcepts = concepts.card_concepts ?? [];
  const conceptRelations = concepts.concept_relations ?? [];
  const cardRelations = relations.edges ?? [];

  const expectedNodeIds = new Set([
    ...cards.map((card) => `card:${card.data.id}`),
    ...conceptList.map((concept) => `concept:${concept.id}`)
  ]);
  const actualNodeIds = new Set(graph.nodes.map((node) => node.id));

  if (graph.nodes.length !== expectedNodeIds.size) {
    errors.push(
      `Graph node count mismatch: expected ${expectedNodeIds.size}, got ${graph.nodes.length}.`
    );
  }
  for (const id of expectedNodeIds) {
    if (!actualNodeIds.has(id)) errors.push(`Graph projection is missing node: ${id}`);
  }

  const expectedEdges = [
    ...cardConcepts.map((edge) => ({
      kind: 'card-concept',
      source: `card:${edge.card_id}`,
      target: `concept:${edge.concept_id}`,
      type: 'has_concept'
    })),
    ...conceptRelations.map((edge) => ({
      kind: 'concept-concept',
      source: `concept:${edge.source}`,
      target: `concept:${edge.target}`,
      type: edge.type
    })),
    ...cardRelations.map((edge) => ({
      kind: 'card-card',
      source: `card:${edge.source}`,
      target: `card:${edge.target}`,
      type: edge.type,
      direction: edge.direction ?? 'undirected'
    }))
  ];
  const actualEdgeKeys = new Set(graph.edges.map(edgeKey));

  if (graph.edges.length !== expectedEdges.length) {
    errors.push(
      `Graph edge count mismatch: expected ${expectedEdges.length}, got ${graph.edges.length}.`
    );
  }
  for (const edge of expectedEdges) {
    const key = edgeKey(edge);
    if (!actualEdgeKeys.has(key)) {
      errors.push(`Graph projection is missing edge: ${key}`);
    }
  }

  for (const edge of graph.edges) {
    if (!actualNodeIds.has(edge.source)) {
      errors.push(`Graph edge source is not a projected node: ${edge.source}`);
    }
    if (!actualNodeIds.has(edge.target)) {
      errors.push(`Graph edge target is not a projected node: ${edge.target}`);
    }
  }

  const expectedStats = {
    cards: cards.length,
    concepts: conceptList.length,
    cardConceptEdges: cardConcepts.length,
    conceptRelations: conceptRelations.length,
    cardRelations: cardRelations.length
  };
  for (const [key, expected] of Object.entries(expectedStats)) {
    if (graph.stats?.[key] !== expected) {
      errors.push(`Graph stats.${key} mismatch: expected ${expected}, got ${graph.stats?.[key]}.`);
    }
  }

  if (cards.length > 0 && !graph.nodes.some((node) => node.kind === 'card')) {
    errors.push('Graph projection contains no Card nodes.');
  }
  if (conceptList.length > 0 && !graph.nodes.some((node) => node.kind === 'concept')) {
    errors.push('Graph projection contains no Concept nodes.');
  }

  if (graph.layout?.method !== layout.method) {
    errors.push(`Graph layout method mismatch: expected ${layout.method}, got ${graph.layout?.method}.`);
  }
  if (graph.layout?.metric !== layout.metric) {
    errors.push(`Graph layout metric mismatch: expected ${layout.metric}, got ${graph.layout?.metric}.`);
  }
  if (graph.layout?.embeddingInputHash !== layout.embedding_input_hash) {
    errors.push('Graph projection embedding input hash does not match graph layout.');
  }

  for (const card of cards) {
    const node = graph.nodes.find((item) => item.id === `card:${card.data.id}`);
    const point = layout.nodes?.[card.data.id];
    if (!node || !point) continue;
    if (node.x !== point.x || node.y !== point.y) {
      errors.push(`Graph Card position mismatch for ${card.data.id}.`);
    }
  }

  const semantic = graph.semantic;
  if (semantic?.metric !== 'cosine-distance') {
    errors.push(`Graph semantic metric mismatch: expected cosine-distance, got ${semantic?.metric}.`);
  }
  if (semantic?.embeddingModel !== embeddings.model) {
    errors.push('Graph semantic embedding model does not match embedding index.');
  }
  for (const card of cards) {
    const neighbors = semantic?.neighborsByCard?.[card.data.id];
    if (!Array.isArray(neighbors)) {
      errors.push(`Graph semantic neighbors are missing for ${card.data.id}.`);
      continue;
    }
    const expectedNeighborCount = Math.min(Number(semantic.neighborLimit) || 0, Math.max(0, cards.length - 1));
    if (neighbors.length !== expectedNeighborCount) {
      errors.push(
        `Graph semantic neighbor count mismatch for ${card.data.id}: expected ${expectedNeighborCount}, got ${neighbors.length}.`
      );
    }
    for (const neighbor of neighbors) {
      if (!Number.isFinite(Number(neighbor.similarity)) || !Number.isFinite(Number(neighbor.distance))) {
        errors.push(`Graph semantic neighbor metrics are invalid for ${card.data.id} -> ${neighbor.cardId}.`);
      }
      if (Object.prototype.hasOwnProperty.call(neighbor, 'embedding')) {
        errors.push(`Graph semantic neighbor leaks embedding vector for ${card.data.id} -> ${neighbor.cardId}.`);
      }
    }
  }
}

if (!fs.existsSync(distRoot)) {
  console.error('Site output verification failed: docs/.vitepress/dist does not exist. Run npm run docs:build first.');
  process.exit(1);
}

requireFile('index.html');
requireFile('graph.html');

const cards = loadCards(contentRoot);
for (const card of cards) {
  requireFile(path.join('knowledge', `${card.data.id}.html`));
}

let concepts;
let relations;
let embeddings;
let layout;
try {
  concepts = readRequiredJson(conceptPath, { label: 'data/concepts.json' });
} catch (error) {
  errors.push(error.message);
}
try {
  relations = readRequiredJson(relationPath, { label: 'data/relations.json' });
} catch (error) {
  errors.push(error.message);
}
try {
  embeddings = readRequiredJson(embeddingPath, { label: 'data/embeddings.json' });
} catch (error) {
  errors.push(error.message);
}
try {
  layout = readRequiredJson(layoutPath, { label: 'data/graph-layout.json' });
} catch (error) {
  errors.push(error.message);
}

if (concepts) {
  if (!Array.isArray(concepts.concepts)) {
    errors.push('data/concepts.json concepts must be an array.');
  } else {
    for (const concept of concepts.concepts) {
      requireFile(path.join('concepts', `${concept.id}.html`));
    }
  }
}

if (concepts && relations && embeddings && layout) {
  try {
    const graph = projectGraph({ cards, concepts, relations, embeddings, layout });
    verifyGraphProjection(graph, cards, concepts, relations, embeddings, layout);
  } catch (error) {
    errors.push(`Graph projection failed: ${error.message}`);
  }
}

const assetsRoot = path.join(distRoot, 'assets');
if (!fs.existsSync(assetsRoot)) {
  errors.push('Missing built assets directory: assets/');
} else {
  const assets = fs.readdirSync(assetsRoot);
  if (!assets.some((name) => name.endsWith('.js'))) {
    errors.push('No JavaScript bundle found in assets/.');
  }
  if (!assets.some((name) => name.endsWith('.css'))) {
    errors.push('No CSS bundle found in assets/.');
  }
}

if (errors.length) {
  console.error(`Site output verification failed (${errors.length} error${errors.length === 1 ? '' : 's'}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Site output verified: homepage + graph + ${cards.length} Knowledge Card pages + ${concepts.concepts.length} Concept pages + semantic graph projection + JS/CSS assets.`
);
