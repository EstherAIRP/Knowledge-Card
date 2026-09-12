import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCosineDistanceMatrix,
  buildGraphLayoutIndex,
  metricMds
} from '../scripts/lib/graph-layout.mjs';

function distance(left, right) {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

test('cosine distance matrix is symmetric and uses 1 - cosine similarity', () => {
  const entries = [
    { card_id: 'a', embedding: [1, 0] },
    { card_id: 'b', embedding: [1, 0] },
    { card_id: 'c', embedding: [0, 1] }
  ];
  const matrix = buildCosineDistanceMatrix(entries);
  assert.equal(matrix[0][0], 0);
  assert.equal(matrix[0][1], 0);
  assert.equal(matrix[0][2], 1);
  assert.equal(matrix[2][0], 1);
});

test('metric MDS keeps a semantically closer pair closer in 2D', () => {
  const entries = [
    { card_id: 'a', embedding: [1, 0, 0] },
    { card_id: 'b', embedding: [0.98, 0.2, 0] },
    { card_id: 'c', embedding: [0, 1, 0] },
    { card_id: 'd', embedding: [0, 0, 1] }
  ];
  const matrix = buildCosineDistanceMatrix(entries);
  const result = metricMds(matrix);
  assert.ok(Number.isFinite(result.stress));
  assert.ok(result.stress >= 0);
  const [a, b, c] = result.coordinates;
  assert.ok(
    Math.hypot(a[0] - b[0], a[1] - b[1]) <
    Math.hypot(a[0] - c[0], a[1] - c[1])
  );
  for (const [x, y] of result.coordinates) {
    assert.ok(x >= -1 && x <= 1);
    assert.ok(y >= -1 && y <= 1);
  }
});

test('graph layout index is deterministic apart from generated_at and keeps stable card ids', () => {
  const embeddingIndex = {
    schema_version: 1,
    provider: 'fixture',
    model: 'fixture-model',
    input_hash: 'abc123',
    card_count: 3,
    entries: [
      { card_id: 'c', embedding: [0, 1] },
      { card_id: 'a', embedding: [1, 0] },
      { card_id: 'b', embedding: [0.8, 0.2] }
    ]
  };
  const first = buildGraphLayoutIndex(embeddingIndex, {
    generatedAt: '2026-09-12T00:00:00.000Z'
  });
  const second = buildGraphLayoutIndex(embeddingIndex, {
    generatedAt: '2026-09-12T01:00:00.000Z'
  });

  assert.deepEqual(Object.keys(first.nodes), ['a', 'b', 'c']);
  assert.deepEqual(first.nodes, second.nodes);
  assert.equal(first.embedding_input_hash, 'abc123');
  assert.equal(first.method, 'metric_mds_smacof');
  assert.ok(distance(first.nodes.a, first.nodes.b) < distance(first.nodes.a, first.nodes.c));
});

test('graph layout rejects inconsistent embedding dimensions', () => {
  assert.throws(
    () =>
      buildCosineDistanceMatrix([
        { card_id: 'a', embedding: [1, 0] },
        { card_id: 'b', embedding: [1, 0, 0] }
      ]),
    /Embedding dimensions differ for b/
  );
});
