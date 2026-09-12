import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCosineDistanceMatrix,
  calculateStress,
  classicalMds,
  cosineSimilarity,
  normalizeCoordinates
} from '../scripts/lib/graph-layout.mjs';
import { buildSemanticNeighbors, projectGraph } from '../scripts/lib/graph-projection.mjs';
import { validateGraphLayoutIndex } from '../scripts/validate-graph-layout.mjs';

test('cosine similarity and distance matrix preserve semantic closeness', () => {
  const entries = [
    { embedding: [1, 0] },
    { embedding: [0.99, 0.1] },
    { embedding: [0, 1] }
  ];

  assert.ok(cosineSimilarity(entries[0].embedding, entries[1].embedding) > 0.99);
  const matrix = buildCosineDistanceMatrix(entries);
  assert.equal(matrix[0][0], 0);
  assert.equal(matrix[0][1], matrix[1][0]);
  assert.ok(matrix[0][1] < matrix[0][2]);
});

test('classical MDS returns deterministic finite 2D coordinates', () => {
  const distances = [
    [0, 1, 2],
    [1, 0, 1],
    [2, 1, 0]
  ];

  const first = normalizeCoordinates(classicalMds(distances));
  const second = normalizeCoordinates(classicalMds(distances));
  assert.deepEqual(first, second);
  assert.equal(first.length, 3);
  for (const point of first) {
    assert.equal(point.length, 2);
    assert.ok(point.every(Number.isFinite));
  }
  assert.ok(calculateStress(distances, classicalMds(distances)) < 1e-6);
});

test('graph projection uses card layout and weighted concept centroid', () => {
  const cards = [
    { data: { id: 'a', title: 'A', summary: 'A' } },
    { data: { id: 'b', title: 'B', summary: 'B' } }
  ];
  const concepts = {
    generated_at: '2026-09-12T00:00:00Z',
    concepts: [{ id: 'agent', type: 'promoted', label: 'Agent', description: 'Agent', card_count: 2 }],
    card_concepts: [
      { card_id: 'a', concept_id: 'agent', strength: 1, evidence: [] },
      { card_id: 'b', concept_id: 'agent', strength: 3, evidence: [] }
    ],
    concept_relations: []
  };
  const relations = { edges: [] };
  const layout = {
    generated_at: '2026-09-12T00:00:00Z',
    method: 'classical-mds',
    metric: 'cosine-distance',
    nodes: {
      a: { x: 0, y: 0 },
      b: { x: 1, y: 1 }
    }
  };

  const graph = projectGraph({ cards, concepts, relations, layout });
  const cardA = graph.nodes.find((node) => node.id === 'card:a');
  const concept = graph.nodes.find((node) => node.id === 'concept:agent');

  assert.deepEqual({ x: cardA.x, y: cardA.y }, { x: 0, y: 0 });
  assert.deepEqual({ x: concept.x, y: concept.y }, { x: 0.75, y: 0.75 });
});


test('semantic neighbors use raw cosine similarity and preserve relation metadata', () => {
  const cards = [
    { data: { id: 'a', title: 'A', summary: 'A' } },
    { data: { id: 'b', title: 'B', summary: 'B' } },
    { data: { id: 'c', title: 'C', summary: 'C' } }
  ];
  const embeddings = {
    provider: 'test',
    model: 'test-model',
    entries: [
      { card_id: 'a', embedding: [1, 0] },
      { card_id: 'b', embedding: [0.99, 0.1] },
      { card_id: 'c', embedding: [0, 1] }
    ]
  };
  const cardRelations = [
    { source: 'a', target: 'b', type: 'similar_to', direction: 'undirected', score: 0.8, confidence: 0.9 }
  ];

  const semantic = buildSemanticNeighbors({ cards, embeddings, cardRelations, limit: 2 });
  const nearest = semantic.neighborsByCard.a[0];

  assert.equal(semantic.metric, 'cosine-distance');
  assert.equal(semantic.embeddingModel, 'test-model');
  assert.equal(nearest.cardId, 'b');
  assert.ok(nearest.similarity > 0.99);
  assert.equal(nearest.distance, Number((1 - nearest.similarity).toFixed(6)));
  assert.equal(nearest.relation.type, 'similar_to');
  assert.equal(nearest.relation.direction, 'undirected');
  assert.equal('embedding' in nearest, false);
  assert.equal(semantic.distancesByCard.a.length, 2);
  assert.deepEqual(
    Object.keys(semantic.distancesByCard.a[0]).sort(),
    ['cardId', 'distance', 'similarity']
  );
});


test('graph layout validator accepts matching embedding provenance and normalized coverage', () => {
  const embeddings = {
    schema_version: 1,
    provider: 'local-transformers',
    model: 'test-model',
    input_hash: 'abc123',
    card_count: 2,
    entries: [
      { card_id: 'a', embedding: [1, 0] },
      { card_id: 'b', embedding: [0, 1] }
    ]
  };
  const layout = {
    schema_version: 1,
    generated_at: '2026-09-12T00:00:00.000Z',
    method: 'classical-mds',
    metric: 'cosine-distance',
    embedding_provider: 'local-transformers',
    embedding_model: 'test-model',
    embedding_input_hash: 'abc123',
    card_count: 2,
    quality: { stress: 0.04 },
    nodes: {
      a: { x: -1, y: 0.25 },
      b: { x: 1, y: -0.25 }
    }
  };

  assert.deepEqual(validateGraphLayoutIndex(layout, embeddings), []);
});

test('graph layout validator rejects stale provenance, missing cards, extras, and invalid coordinates', () => {
  const embeddings = {
    schema_version: 1,
    provider: 'local-transformers',
    model: 'test-model',
    input_hash: 'current-hash',
    card_count: 2,
    entries: [
      { card_id: 'a', embedding: [1, 0] },
      { card_id: 'b', embedding: [0, 1] }
    ]
  };
  const layout = {
    schema_version: 1,
    generated_at: 'not-a-date',
    method: 'classical-mds',
    metric: 'cosine-distance',
    embedding_provider: 'local-transformers',
    embedding_model: 'old-model',
    embedding_input_hash: 'stale-hash',
    card_count: 2,
    quality: { stress: -1 },
    nodes: {
      a: { x: 1.5, y: 0 },
      stale: { x: 0, y: 0 }
    }
  };

  const errors = validateGraphLayoutIndex(layout, embeddings);
  assert.ok(errors.some((message) => message.includes('embedding model does not match')));
  assert.ok(errors.some((message) => message.includes('embedding input hash does not match')));
  assert.ok(errors.some((message) => message.includes('missing card b')));
  assert.ok(errors.some((message) => message.includes('not present in embeddings: stale')));
  assert.ok(errors.some((message) => message.includes('normalized range')));
  assert.ok(errors.some((message) => message.includes('quality.stress')));
  assert.ok(errors.some((message) => message.includes('generated_at')));
});
