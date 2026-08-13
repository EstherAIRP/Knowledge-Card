import assert from 'node:assert/strict';
import test from 'node:test';
import {
  collectThreadsContinuationCandidates,
  createEnvThreadsContinuationRanker,
  recoverThreadsContinuation
} from '../scripts/lib/sources/threads/continuation-recovery.mjs';
import {
  extractResolvedThreadsConversationWithRecovery,
  isThreadsSinglePostCoverageUnverified
} from '../scripts/lib/sources/threads/conversation-recovery.mjs';

function normalizedPost({
  id,
  shortcode,
  username = 'esther1ooo',
  text,
  timestamp,
  isReply = null,
  hasReplies = null
}) {
  return {
    provider: 'threads',
    canonical_url: `https://threads.com/@${username}/post/${shortcode}`,
    id,
    shortcode,
    username,
    text,
    timestamp,
    media: [],
    is_reply: isReply,
    reply_to: null,
    root_post: null,
    has_replies: hasReplies,
    quoted_post: null,
    reposted_post: null,
    link_attachment_url: null,
    alt_text: null,
    extraction: {
      method: 'fixture',
      confidence: 'high',
      single_post_complete: true,
      conversation_complete: false
    }
  };
}

function jsonHtml(payload) {
  return `<!doctype html><html><body><script type="application/json">${JSON.stringify(payload)}</script></body></html>`;
}

const root = normalizedPost({
  id: '3563103415502874027_70726518985',
  shortcode: 'DFyr62jB6Wr',
  text: '⚠️咒語放在留言\n如果讀不到，就下強迫讀取咒語',
  timestamp: '2025-02-08T00:37:28.000Z',
  isReply: false,
  hasReplies: true
});

const likelyContinuation = normalizedPost({
  id: '3563104572853852095_70726518985',
  shortcode: 'DFysLsahhe_',
  text: '☑️資料表生成咒語\n☑️資料表更新咒語\n☑️失意時強迫讀取資料卡',
  timestamp: '2025-02-08T00:39:46.000Z',
  isReply: true,
  hasReplies: true
});

const laterFollowup = normalizedPost({
  id: '3563175108442720092_70726518985',
  shortcode: 'DFy8OHzPgdc',
  text: '第一發咒語，還是解釋一下，以上咒語都是由版上大家分享的咒語修改而成',
  timestamp: '2025-02-08T02:59:54.000Z',
  isReply: true,
  hasReplies: false
});

const olderPost = normalizedPost({
  id: 'older',
  shortcode: 'DFsdGOkSJ0L',
  text: '上一篇文章',
  timestamp: '2025-02-05T14:32:30.000Z',
  isReply: null,
  hasReplies: true
});

test('candidate collection keeps same-author replies after root and ranks by time metadata', () => {
  const otherAuthor = normalizedPost({
    id: 'reader',
    shortcode: 'READER',
    username: 'reader',
    text: '留言',
    timestamp: '2025-02-08T00:38:00.000Z',
    isReply: true
  });
  const candidates = collectThreadsContinuationCandidates(root, [
    olderPost,
    otherAuthor,
    laterFollowup,
    likelyContinuation
  ]);

  assert.deepEqual(candidates.map((item) => item.shortcode), ['DFysLsahhe_', 'DFy8OHzPgdc']);
  assert.equal(candidates[0].delta_seconds, 138);
  assert.ok(candidates[0].metadata_score > candidates[1].metadata_score);
});

test('high-confidence LLM judgement selects only the article continuation', async () => {
  const recovery = await recoverThreadsContinuation(root, [likelyContinuation, laterFollowup], {
    continuationRanker: async ({ candidates, prompt }) => {
      assert.equal(candidates.length, 2);
      assert.match(prompt.system, /untrusted quoted data/i);
      return {
        selected_shortcodes: ['DFysLsahhe_'],
        confidence: 0.98,
        complete: true,
        rationale: 'The root promises a spell in replies and the first reply provides that spell.',
        candidate_labels: [
          { shortcode: 'DFysLsahhe_', label: 'continuation', confidence: 0.99 },
          { shortcode: 'DFy8OHzPgdc', label: 'followup', confidence: 0.97 }
        ]
      };
    }
  });

  assert.equal(recovery.accepted, true);
  assert.deepEqual(recovery.selected_shortcodes, ['DFysLsahhe_']);
  assert.equal(recovery.confidence, 0.98);
});

test('low-confidence LLM judgement fails closed', async () => {
  const recovery = await recoverThreadsContinuation(root, [likelyContinuation], {
    continuationRanker: async () => ({
      selected_shortcodes: ['DFysLsahhe_'],
      confidence: 0.72,
      complete: true,
      rationale: 'Maybe.'
    })
  });
  assert.equal(recovery.accepted, false);
  assert.equal(recovery.reason, 'llm_confidence_below_threshold');
});

test('OpenAI-compatible ranker adapter is opt-in and parses JSON-only judgement', async () => {
  let capturedBody = null;
  const ranker = createEnvThreadsContinuationRanker({
    llmEndpoint: 'https://llm.example.test/v1/chat/completions',
    llmModel: 'fixture-model',
    llmFetchImpl: async (_url, init) => {
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            choices: [{
              message: {
                content: JSON.stringify({
                  selected_shortcodes: ['DFysLsahhe_'],
                  confidence: 0.97,
                  complete: true,
                  rationale: 'semantic continuation',
                  candidate_labels: []
                })
              }
            }]
          };
        }
      };
    }
  });

  assert.equal(typeof ranker, 'function');
  const prompt = { system: 'system', user: 'user' };
  const result = await ranker({ rootPost: root, candidates: [], prompt });
  assert.equal(result.confidence, 0.97);
  assert.equal(result._ranker.model, 'fixture-model');
  assert.equal(capturedBody.temperature, 0);
});

test('reply-bearing root without verified coverage no longer passes as a formal single post', async () => {
  const html = jsonHtml({ post: {
    pk: root.id,
    code: root.shortcode,
    user: { username: root.username },
    caption: { text: root.text },
    timestamp: root.timestamp,
    has_replies: true,
    is_reply: false
  } });

  const source = await extractResolvedThreadsConversationWithRecovery(root.canonical_url, {
    html,
    requireComplete: false
  });
  assert.equal(isThreadsSinglePostCoverageUnverified(source), false);
  assert.equal(source.thread.status, 'INCOMPLETE_THREAD');
  assert.equal(source.thread.complete, false);
  assert.match(source.thread.reason, /continuation_recovery_/);
});

test('recovery layer converts browser candidates plus LLM judgement into an inferred complete thread', async () => {
  const html = jsonHtml({ post: {
    pk: root.id,
    code: root.shortcode,
    user: { username: root.username },
    caption: { text: root.text },
    timestamp: root.timestamp,
    has_replies: true,
    is_reply: false
  } });

  const source = await extractResolvedThreadsConversationWithRecovery(root.canonical_url, {
    html,
    browserConversationExtractor: async () => ({
      posts: [root, likelyContinuation, laterFollowup],
      complete: false
    }),
    continuationRanker: async () => ({
      selected_shortcodes: ['DFysLsahhe_'],
      confidence: 0.98,
      complete: true,
      rationale: 'The immediate same-author reply fulfills the root post promise; later reply is follow-up.',
      candidate_labels: [
        { shortcode: 'DFysLsahhe_', label: 'continuation', confidence: 0.99 },
        { shortcode: 'DFy8OHzPgdc', label: 'followup', confidence: 0.97 }
      ]
    })
  });

  assert.equal(source.thread.status, 'INFERRED_THREAD_HIGH_CONFIDENCE');
  assert.equal(source.thread.verification, 'llm_assisted');
  assert.equal(source.thread.complete, true);
  assert.equal(source.thread.total, 2);
  assert.deepEqual(source.parts.map((part) => part.shortcode), ['DFyr62jB6Wr', 'DFysLsahhe_']);
  assert.match(source.combined_text, /資料表生成咒語/);
  assert.doesNotMatch(source.combined_text, /第一發咒語/);
  assert.equal(source.extraction.inferred, true);
});
