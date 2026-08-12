import assert from 'node:assert/strict';
import test from 'node:test';
import { applyRelationOverrides } from '../scripts/lib/relations.mjs';

test('directional manual edge keeps author intent after pair canonicalization', () => {
  const [edge] = applyRelationOverrides([], {
    pinned: [
      {
        source: 'z-card',
        target: 'a-card',
        type: 'depends_on',
        direction: 'source_to_target',
        score: 1,
        reason: 'z-card depends on a-card'
      }
    ],
    blocked: [],
    overrides: []
  });

  assert.equal(edge.source, 'a-card');
  assert.equal(edge.target, 'z-card');
  assert.equal(edge.direction, 'target_to_source');
});
