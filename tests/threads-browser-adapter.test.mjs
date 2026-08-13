import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractThreadsViaBrowser,
  resolveThreadsUrlViaBrowser
} from '../scripts/lib/sources/threads/browser-adapter.mjs';
import { extractExternalSource } from '../scripts/lib/source-extraction.mjs';
import { resolveExternalSourceUrl } from '../scripts/lib/source-resolution.mjs';

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

function httpResponse({ status = 200, url, body = '', location = null }) {
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

function browserSessionFactory({ finalUrl, html, payloads = [] }) {
  return async () => {
    let currentUrl = finalUrl;
    const listeners = new Map();
    const page = {
      on(event, handler) { listeners.set(event, handler); },
      off(event) { listeners.delete(event); },
      async goto(url) {
        currentUrl = finalUrl || url;
        const handler = listeners.get('response');
        if (handler) {
          for (const payload of payloads) {
            handler({
              url: () => 'https://www.threads.com/api/graphql',
              headerValue: async () => 'application/json; charset=utf-8',
              json: async () => payload
            });
          }
        }
      },
      async waitForLoadState() {},
      async evaluate() {},
      async waitForTimeout() {},
      url() { return currentUrl; },
      async content() { return html || '<html><body></body></html>'; }
    };
    return {
      page,
      context: { async close() {} },
      browser: { async close() {} },
      launch_method: 'fake'
    };
  };
}

const root = post({ id: '1000', code: 'BROOT', text: '第一段', hasReplies: true });
const middle = post({ id: '1001', code: 'BMID', text: '第二段', replyTo: '1000', root: '1000', hasReplies: true });
const last = post({ id: '1002', code: 'BLAST', text: '第三段', replyTo: '1001', root: '1000', hasReplies: false });

test('browser adapter captures Threads GraphQL JSON and rendered n/N indicator', async () => {
  const result = await extractThreadsViaBrowser('https://threads.com/@alice/post/BMID', {
    browserSessionFactory: browserSessionFactory({
      finalUrl: 'https://threads.com/@alice/post/BMID',
      html: '<html><body><div>2 / 3</div></body></html>',
      payloads: [{ data: { conversation: [root, middle, last] } }]
    }),
    scrollRounds: 0
  });

  assert.deepEqual(result.posts.map((item) => item.shortcode), ['BROOT', 'BMID', 'BLAST']);
  assert.deepEqual(result.thread_indicator, { index: 2, total: 3, source: 'html_ui_text' });
  assert.equal(result.complete, false);
  assert.equal(result.browser.network_payload_count, 1);
  assert.equal(result.browser.launch_method, 'fake');
});

test('browser URL resolver follows rendered navigation to canonical post', async () => {
  const result = await resolveThreadsUrlViaBrowser('https://threads.com/share/browser-token', {
    browserSessionFactory: browserSessionFactory({
      finalUrl: 'https://www.threads.com/@alice/post/BMID?x=1',
      html: '<html><body></body></html>'
    }),
    scrollRounds: 0
  });
  assert.equal(result.canonical_url, 'https://threads.com/@alice/post/BMID');
  assert.equal(result.method, 'browser_navigation');
});

test('external URL resolution automatically uses browser fallback when an explicit browser session is configured', async () => {
  const shareUrl = 'https://threads.com/share/js-only-token';
  const result = await resolveExternalSourceUrl(shareUrl, {
    fetchImpl: async (url) => httpResponse({ status: 200, url, body: '<html><body>SPA shell</body></html>' }),
    browserSessionFactory: browserSessionFactory({
      finalUrl: 'https://threads.com/@alice/post/BMID',
      html: '<html><body></body></html>'
    }),
    scrollRounds: 0
  });
  assert.equal(result.canonical_url, 'https://threads.com/@alice/post/BMID');
  assert.equal(result.method, 'browser');
});

test('browser conversation fallback completes a sparse HTML middle-part source', async () => {
  const targetUrl = 'https://threads.com/@alice/post/BMID';
  const sparseHtml = `<!doctype html><html><body><script type="application/json">${JSON.stringify({ post: middle })}</script></body></html>`;
  const result = await extractExternalSource(targetUrl, {
    fetchImpl: async (url) => httpResponse({ status: 200, url, body: sparseHtml }),
    browserFallback: true,
    browserSessionFactory: browserSessionFactory({
      finalUrl: targetUrl,
      html: '<html><body><div>2 / 3</div></body></html>',
      payloads: [{ data: { thread: [root, middle, last] } }]
    }),
    scrollRounds: 0
  });

  assert.equal(result.source.thread.status, 'COMPLETE_THREAD');
  assert.equal(result.source.thread.complete, true);
  assert.equal(result.source.source_identity, 'threads:BROOT');
  assert.equal(result.source.canonical_url, 'https://threads.com/@alice/post/BROOT');
  assert.equal(result.source.combined_text, '第一段\n\n第二段\n\n第三段');
  assert.equal(result.source.extraction.method, 'browser_conversation');
});

test('browser adapter rejects navigation that leaves Threads hosts', async () => {
  await assert.rejects(
    () => resolveThreadsUrlViaBrowser('https://threads.com/share/bad', {
      browserSessionFactory: browserSessionFactory({
        finalUrl: 'https://example.com/phishing',
        html: '<html></html>'
      }),
      scrollRounds: 0
    }),
    (error) => error?.code === 'THREADS_BROWSER_UNSAFE_REDIRECT'
  );
});
