import assert from 'node:assert/strict';
import test from 'node:test';
import { validateThreadsContinuationJudgement } from '../scripts/lib/sources/threads/continuation-recovery.mjs';

test('root-only recovery fails closed when any filtered candidate lacks a shortcode identity', () => {
  const root = {
    username: 'author',
    shortcode: 'ROOT'
  };
  const candidates = [
    {
      id: 'id-only-candidate',
      shortcode: null,
      post: {
        id: 'id-only-candidate',
        shortcode: null,
        username: 'author',
        is_reply: true
      },
      username: 'author',
      is_reply: true,
      metadata_score: 0.7,
      delta_seconds: 60
    }
  ];

  const result = validateThreadsContinuationJudgement(root, candidates, {
    selected_shortcodes: [],
    root_only: true,
    confidence: 0.99,
    complete: true,
    rationale: 'No continuation.',
    candidate_labels: []
  });

  assert.equal(result.accepted, false);
  assert.equal(result.reason, 'root_only_candidate_identity_missing');
});
