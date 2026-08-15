import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createThreadsSemanticHandoff,
  createThreadsSemanticHandoffCaptureRanker,
  createThreadsSemanticHandoffRanker,
  digestThreadsSemanticHandoffEvidence,
  normalizeThreadsSemanticHandoffRequest
} from '../scripts/lib/execution/semantic-handoff.mjs';

const root = {
  id: 'root-id',
  shortcode: 'ROOT',
  username: 'ExampleUser',
  timestamp: '2026-08-15T00:00:00.000Z',
  is_reply: false,
  has_replies: true,
  text: 'Original article. Continuation is in the replies.'
};

const candidates = [
  {
    post: {
      id: 'part-2',
      shortcode: 'PART2',
      username: 'exampleuser',
      timestamp: '2026-08-15T00:02:00.000Z',
      is_reply: true,
      has_replies: false,
      text: 'Continuation of the original article.'
    },
    delta_seconds: 120,
    metadata_score: 0.88
  }
];

function acceptedRequest() {
  return {
    schema_version: 1,
    producer: 'knowledge_card_agent',
    evidence_digest: digestThreadsSemanticHandoffEvidence(root, candidates),
    judgement: {
      selected_shortcodes: ['PART2'],
      root_only: false,
      confidence: 0.98,
      complete: true,
      rationale: 'PART2 directly continues the promised article body.',
      candidate_labels: [
        { shortcode: 'PART2', label: 'continuation', confidence: 0.99 }
      ]
    }
  };
}

test('semantic handoff publishes bounded public evidence plus a stable digest', () => {
  const handoff = createThreadsSemanticHandoff(root, candidates);
  assert.equal(handoff.schema_version, 1);
  assert.equal(handoff.kind, 'threads_continuation_judgement');
  assert.equal(handoff.producer_required, 'knowledge_card_agent');
  assert.match(handoff.evidence_digest, /^sha256:[a-f0-9]{64}$/);
  assert.equal(handoff.evidence.root.shortcode, 'ROOT');
  assert.equal(handoff.evidence.root.username, 'exampleuser');
  assert.equal(handoff.evidence.candidates[0].shortcode, 'PART2');
  assert.equal(handoff.evidence.candidates[0].metadata_score, 0.88);
});

test('handoff request accepts only the trusted producer and structured judgement', () => {
  const normalized = normalizeThreadsSemanticHandoffRequest(acceptedRequest());
  assert.equal(normalized.producer, 'knowledge_card_agent');
  assert.deepEqual(normalized.judgement.selected_shortcodes, ['PART2']);

  assert.throws(
    () => normalizeThreadsSemanticHandoffRequest({ ...acceptedRequest(), producer: 'request_branch' }),
    /producer must be knowledge_card_agent/
  );
  assert.throws(
    () => normalizeThreadsSemanticHandoffRequest({ ...acceptedRequest(), evidence_digest: 'sha256:bad' }),
    /sha256 digest/
  );
});

test('capture ranker never returns a judgement and exposes only semantic handoff evidence', async () => {
  const ranker = createThreadsSemanticHandoffCaptureRanker();
  await assert.rejects(
    () => ranker({ rootPost: root, candidates }),
    (error) => {
      assert.equal(error.code, 'THREADS_CONTINUATION_HANDOFF_CAPTURED');
      assert.equal(error.semantic_handoff.evidence.root.shortcode, 'ROOT');
      return true;
    }
  );
});

test('agent handoff ranker is bound to freshly extracted evidence digest', async () => {
  const ranker = createThreadsSemanticHandoffRanker(acceptedRequest());
  const judgement = await ranker({ rootPost: root, candidates });
  assert.deepEqual(judgement.selected_shortcodes, ['PART2']);
  assert.equal(judgement._ranker.method, 'agent_semantic_handoff');
  assert.equal(judgement._ranker.provider, 'knowledge_card_agent');
  assert.equal(judgement._ranker.evidence_digest, acceptedRequest().evidence_digest);

  await assert.rejects(
    () => ranker({
      rootPost: { ...root, text: 'The source changed.' },
      candidates
    }),
    (error) => error.code === 'THREADS_CONTINUATION_HANDOFF_EVIDENCE_MISMATCH'
  );
});
