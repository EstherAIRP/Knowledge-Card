import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assembleThreadsConversation,
  buildThreadsConversationGraph,
  extractResolvedThreadsConversation,
  extractThreadsConversationRecordsFromHtml,
  extractThreadsUiThreadIndicator
} from '../scripts/lib/sources/threads/conversation.mjs';
import { extractExternalSource } from '../scripts/lib/source-extraction.mjs';
import { canonicalizeSource } from '../scripts/lib/knowledge.mjs';

function jsonHtml(payload, visible = '') {
  return `<!doctype html><html><body>${visible}<script type="application/json">${JSON.stringify(payload)}</script></body></html>`;
}

function post({ id, code, username = 'alice', text, replyTo = null, root = null, hasReplies = null }) {
  return {
    pk: id,
    code,
    user: { username },
    caption: { text },
    ...(hasReplies === null ? {} : { has_replies: hasReplies }),
    ...(replyTo || root ? {
      text_post_app_info: {
        is_reply: Boolean(replyTo),
        ...(replyTo ? { replied_to_post: { pk: replyTo } } : {}),
        ...(root ? { root_post: { pk: root } } : {})
      }
    } : {})
  };
}

function response({ status = 200, url, location = null, body = '' }) {
  return {
    status,
    url,
    headers: {
      get(name) {
        return name.toLowerCase() === 'location' ? location : null;
      }
    },
    async text() { return body; }
  };
}

test('reconstructs a three-part author self-thread while excluding reader replies', async () => {
  const canonicalUrl = 'https://threads.com/@alice/post/PART2';
  const payload = {
    thread: [
      post({ id: '100', code: 'ROOT1', text: '第一段', hasReplies: true }),
      post({ id: '900', code: 'READER1', username: 'reader', text: '讀者留言', replyTo: '100', root: '100', hasReplies: false }),
      post({ id: '101', code: 'PART2', text: '第二段', replyTo: '100', root: '100', hasReplies: true }),
      post({ id: '102', code: 'PART3', text: '第三段', replyTo: '101', root: '100', hasReplies: false })
    ]
  };
  const html = jsonHtml(payload, '<div>2 / 3</div>');
  const source = await extractResolvedThreadsConversation(canonicalUrl, { html });

  assert.equal(source.canonical_url, 'https://threads.com/@alice/post/ROOT1');
  assert.equal(source.source_identity, 'threads:ROOT1');
  assert.equal(source.thread.status, 'COMPLETE_THREAD');
  assert.equal(source.thread.complete, true);
  assert.equal(source.thread.total, 3);
  assert.equal(source.thread.input_index, 2);
  assert.deepEqual(source.parts.map((item) => item.shortcode), ['ROOT1', 'PART2', 'PART3']);
  assert.equal(source.combined_text, '第一段\n\n第二段\n\n第三段');
});

test('UI n/N indicator is parsed only when the page exposes one unambiguous ratio', () => {
  assert.deepEqual(extractThreadsUiThreadIndicator('<div>2 / 2</div>'), {
    index: 2,
    total: 2,
    source: 'html_ui_text'
  });
  assert.equal(extractThreadsUiThreadIndicator('<div>2 / 2</div><div>1 / 5</div>'), null);
});

test('a root post with only reader replies remains a single post', async () => {
  const canonicalUrl = 'https://threads.com/@alice/post/SINGLE1';
  const html = jsonHtml({
    posts: [
      post({ id: '200', code: 'SINGLE1', text: '單篇正文', hasReplies: true }),
      post({ id: '201', code: 'REPLY1', username: 'reader', text: '一般留言', replyTo: '200', root: '200', hasReplies: false })
    ]
  });
  const source = await extractResolvedThreadsConversation(canonicalUrl, { html });
  assert.equal(source.thread.status, 'SINGLE_POST');
  assert.equal(source.thread.complete, true);
  assert.equal(source.parts.length, 1);
  assert.equal(source.parts[0].text, '單篇正文');
});

test('same-author branching is marked ambiguous instead of guessed by timestamp', () => {
  const html = jsonHtml({
    posts: [
      post({ id: '300', code: 'ROOTB', text: 'root', hasReplies: true }),
      post({ id: '301', code: 'BR1', text: 'branch 1', replyTo: '300', root: '300' }),
      post({ id: '302', code: 'BR2', text: 'branch 2', replyTo: '300', root: '300' })
    ]
  });
  const records = extractThreadsConversationRecordsFromHtml(html);
  const graph = buildThreadsConversationGraph(records);
  const target = graph.byKey.get('300').post;
  const source = assembleThreadsConversation({ targetPost: target, records });
  assert.equal(source.thread.status, 'AMBIGUOUS_THREAD');
  assert.equal(source.thread.complete, false);
  assert.equal(source.thread.reason, 'same_author_branch');
});

test('known total prevents incomplete two-of-three content from being accepted', async () => {
  const canonicalUrl = 'https://threads.com/@alice/post/P2MISS';
  const html = jsonHtml({
    posts: [
      post({ id: '400', code: 'ROOTM', text: 'one', hasReplies: true }),
      post({ id: '401', code: 'P2MISS', text: 'two', replyTo: '400', root: '400', hasReplies: true })
    ]
  }, '<span>2/3</span>');
  const source = await extractResolvedThreadsConversation(canonicalUrl, { html, requireComplete: false });
  assert.equal(source.thread.status, 'INCOMPLETE_THREAD');
  assert.equal(source.thread.complete, false);
  assert.equal(source.thread.total, 3);
  assert.equal(source.thread.detected_parts, 2);
  await assert.rejects(
    () => extractResolvedThreadsConversation(canonicalUrl, { html }),
    (error) => error?.code === 'THREADS_CONVERSATION_INCOMPLETE'
  );
});

test('browser conversation adapter can supply missing root and continuation with n/N verification', async () => {
  const canonicalUrl = 'https://threads.com/@alice/post/MIDDLE2';
  const html = jsonHtml({
    post: post({ id: '501', code: 'MIDDLE2', text: 'two', replyTo: '500', root: '500', hasReplies: true })
  });
  const source = await extractResolvedThreadsConversation(canonicalUrl, {
    html,
    browserConversationExtractor: async () => ({
      posts: [
        post({ id: '500', code: 'ROOT5', text: 'one', hasReplies: true }),
        post({ id: '501', code: 'MIDDLE2', text: 'two', replyTo: '500', root: '500', hasReplies: true }),
        post({ id: '502', code: 'LAST3', text: 'three', replyTo: '501', root: '500', hasReplies: false })
      ],
      thread_indicator: { index: 2, total: 3 },
      complete: true
    })
  });
  assert.equal(source.thread.status, 'COMPLETE_THREAD');
  assert.equal(source.thread.confidence, 'high');
  assert.equal(source.root_shortcode, 'ROOT5');
  assert.equal(source.input_post.index, 2);
});

test('share URL extraction returns the root post as final canonical source identity', async () => {
  const shareUrl = 'https://www.threads.com/share/token123';
  const targetUrl = 'https://threads.com/@alice/post/PART2E';
  const html = jsonHtml({
    posts: [
      post({ id: '600', code: 'ROOTEND', text: 'first', hasReplies: true }),
      post({ id: '601', code: 'PART2E', text: 'second', replyTo: '600', root: '600', hasReplies: false })
    ]
  }, '<div>2 / 2</div>');
  const fetchImpl = async (url) => {
    if (url.includes('/share/')) return response({ status: 302, url, location: targetUrl });
    if (url === targetUrl) return response({ status: 200, url, body: html });
    throw new Error(`Unexpected URL: ${url}`);
  };
  const result = await extractExternalSource(shareUrl, { fetchImpl });
  assert.equal(result.source.canonical_url, 'https://threads.com/@alice/post/ROOTEND');
  assert.equal(result.source.source_identity, 'threads:ROOTEND');
  const canonical = canonicalizeSource(result.source.canonical_url);
  assert.equal(canonical.identity, 'threads:ROOTEND');
});

test('Threads canonical post host/query variants share one shortcode identity', () => {
  const variants = [
    'https://www.threads.com/@alice/post/AbC123/?utm_source=share#x',
    'https://threads.net/@alice/post/AbC123',
    'https://threads.com/@alice/post/AbC123'
  ].map(canonicalizeSource);
  for (const item of variants) {
    assert.equal(item.canonicalUrl, 'https://threads.com/@alice/post/AbC123');
    assert.equal(item.identity, 'threads:AbC123');
    assert.equal(item.sourceType, 'article');
  }
});
