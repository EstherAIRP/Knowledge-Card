import assert from 'node:assert/strict';
import test from 'node:test';
import {
  THREADS_CONTINUATION_JUDGEMENT_ALLOWED_LABELS,
  THREADS_CONTINUATION_JUDGEMENT_REQUIRED_FIELDS,
  THREADS_CONTINUATION_JUDGEMENT_SCHEMA_PATH,
  validateThreadsContinuationJudgementShape
} from '../scripts/lib/contracts/threads-continuation-judgement.mjs';
import {
  buildThreadsContinuationPrompt,
  validateThreadsContinuationJudgement
} from '../scripts/lib/sources/threads/continuation-recovery.mjs';

const validJudgement = {
  selected_shortcodes: ['PART2'],
  root_only: false,
  confidence: 0.98,
  complete: true,
  rationale: 'PART2 continues the original body.',
  candidate_labels: [
    { shortcode: 'PART2', label: 'continuation', confidence: 0.99 }
  ]
};

const rootPost = {
  id: 'root',
  shortcode: 'ROOT',
  username: 'example',
  timestamp: '2026-08-18T00:00:00.000Z',
  is_reply: false,
  has_replies: true,
  text: 'Root text.'
};

const candidate = {
  post: {
    id: 'part2',
    shortcode: 'PART2',
    username: 'example',
    timestamp: '2026-08-18T00:01:00.000Z',
    is_reply: true,
    has_replies: false,
    text: 'Continuation.'
  },
  shortcode: 'PART2',
  username: 'example',
  timestamp: '2026-08-18T00:01:00.000Z',
  is_reply: true,
  delta_seconds: 60,
  metadata_score: 0.9
};

test('shared Threads judgement schema accepts the canonical shape', () => {
  const result = validateThreadsContinuationJudgementShape(validJudgement);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(THREADS_CONTINUATION_JUDGEMENT_REQUIRED_FIELDS, [
    'selected_shortcodes',
    'root_only',
    'confidence',
    'complete',
    'rationale',
    'candidate_labels'
  ]);
  assert.deepEqual(THREADS_CONTINUATION_JUDGEMENT_ALLOWED_LABELS, [
    'continuation',
    'followup',
    'unrelated',
    'uncertain'
  ]);
});

test('shared Threads judgement schema rejects missing fields, invalid labels, and extra model output', () => {
  assert.equal(
    validateThreadsContinuationJudgementShape({ ...validJudgement, rationale: undefined }).valid,
    false
  );
  assert.equal(
    validateThreadsContinuationJudgementShape({
      ...validJudgement,
      candidate_labels: [{ shortcode: 'PART2', label: 'maybe', confidence: 0.99 }]
    }).valid,
    false
  );
  assert.equal(
    validateThreadsContinuationJudgementShape({ ...validJudgement, extra: 'not allowed' }).valid,
    false
  );
});

test('ranker provenance may be attached outside the canonical model-output contract', () => {
  const result = validateThreadsContinuationJudgementShape(
    {
      ...validJudgement,
      _ranker: { method: 'fixture' }
    },
    { allowRankerMetadata: true }
  );
  assert.equal(result.valid, true);
});

test('Phase 7 acceptance rejects high-confidence judgement with an invalid schema shape before evidence gates', () => {
  const result = validateThreadsContinuationJudgement(
    rootPost,
    [candidate],
    {
      selected_shortcodes: ['PART2'],
      root_only: false,
      confidence: 0.98,
      complete: true,
      rationale: 'Missing candidate_labels.'
    }
  );

  assert.equal(result.accepted, false);
  assert.equal(result.reason, 'judgement_schema_invalid');
  assert.ok(result.schema_errors.length > 0);
});

test('local continuation prompt derives its structural contract from the shared schema', () => {
  const prompt = buildThreadsContinuationPrompt(rootPost, []);

  assert.match(prompt.system, new RegExp(THREADS_CONTINUATION_JUDGEMENT_SCHEMA_PATH.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  for (const field of THREADS_CONTINUATION_JUDGEMENT_REQUIRED_FIELDS) {
    assert.match(prompt.system, new RegExp(`\\b${field}\\b`));
  }
  for (const label of THREADS_CONTINUATION_JUDGEMENT_ALLOWED_LABELS) {
    assert.match(prompt.system, new RegExp(`\\b${label}\\b`));
  }
});
