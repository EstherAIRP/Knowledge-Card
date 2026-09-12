import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCosineDistanceMatrix,
  calculateStress,
  classicalMds,
  cosineSimilarity,
  normalizeCoordinates
} from '../scripts/lib/graph-layout.mjs';

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
