import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCosineDistanceMatrix,
  calculateStress,
  classicalMds,
  cosineSimilarity,
  normalizeCoordinates
} from '../scripts/lib/graph-layout.mjs';
import { projectGraph } from '../scripts/lib/graph-projection.mjs';

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
  assert.equal(graph.stats.positionedCards, 2);
});
