import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveExternalSourceUrl } from '../scripts/lib/source-resolution.mjs';
import {
  classifyThreadsUrl,
  extractThreadsCanonicalUrlFromHtml,
  normalizeThreadsPostUrl,
  resolveThreadsUrl
} from '../scripts/lib/sources/threads/resolve-url.mjs';

function fakeResponse({ status = 200, url = '', location = null, body = '' } = {}) {
  return {
    status,
    url,
    headers: {
      get(name) {
        return name.toLowerCase() === 'location' ? location : null;
      }
    },
    async text() {
      return body;
    }
  };
}

test('Threads URL recognizer distinguishes share, short and canonical post URLs', () => {
  assert.equal(classifyThreadsUrl('https://www.threads.com/share/_qgqDMSsx/').kind, 'share');
  assert.equal(classifyThreadsUrl('https://threads.net/t/AbCd123/').kind, 'short');
  assert.equal(classifyThreadsUrl('https://www.threads.com/@Alice/post/AbCd123/?xmt=abc').kind, 'post');
  assert.equal(classifyThreadsUrl('https://example.com/@Alice/post/AbCd123').isThreads, false);
});

test('canonical Threads post URLs normalize host, query, fragment and trailing slash without network access', async () => {
  let fetchCalls = 0;
  const result = await resolveThreadsUrl('https://www.threads.net/@Alice/post/AbCd123/?xmt=abc#fragment', {
    fetchImpl: async () => {
      fetchCalls += 1;
      throw new Error('fetch should not run');
    }
  });

  assert.equal(result.canonical_url, 'https://threads.com/@Alice/post/AbCd123');
  assert.equal(result.method, 'direct');
  assert.equal(result.transient, false);
  assert.equal(fetchCalls, 0);
});

test('share URLs resolve through an HTTP redirect to one canonical post URL', async () => {
  const calls = [];
  const result = await resolveThreadsUrl('https://www.threads.com/share/_qgqDMSsx/', {
    fetchImpl: async (url) => {
      calls.push(url);
      return fakeResponse({
        status: 302,
        url,
        location: 'https://www.threads.net/@esther1000/post/DExample123/?xmt=AQF123#reply'
      });
    }
  });

  assert.equal(result.canonical_url, 'https://threads.com/@esther1000/post/DExample123');
  assert.equal(result.method, 'http_redirect');
  assert.equal(result.redirect_count, 1);
  assert.equal(calls.length, 1);
});

test('Threads canonical metadata can resolve a transient URL when the response does not redirect', async () => {
  const html = '<html><head><link href="https://www.threads.com/@alice/post/POST42/?xmt=foo&amp;bar=baz" rel="canonical"></head></html>';
  assert.equal(
    extractThreadsCanonicalUrlFromHtml(html, 'https://threads.com/share/token'),
    'https://threads.com/@alice/post/POST42'
  );

  const result = await resolveThreadsUrl('https://threads.com/share/token', {
    fetchImpl: async (url) => fakeResponse({ status: 200, url, body: html })
  });
  assert.equal(result.method, 'html_metadata');
  assert.equal(result.canonical_url, 'https://threads.com/@alice/post/POST42');
});

test('browser resolver is a fallback interface when HTTP resolution is unavailable', async () => {
  const result = await resolveThreadsUrl('https://threads.com/t/opaque-token', {
    fetchImpl: async () => {
      throw new Error('network blocked');
    },
    browserResolver: async () => 'https://www.threads.com/@alice/post/BROWSER123/?xmt=foo'
  });

  assert.equal(result.method, 'browser');
  assert.equal(result.canonical_url, 'https://threads.com/@alice/post/BROWSER123');
});

test('redirects outside Threads hosts are rejected', async () => {
  await assert.rejects(
    resolveThreadsUrl('https://threads.com/share/token', {
      fetchImpl: async (url) => fakeResponse({
        status: 302,
        url,
        location: 'https://example.com/not-threads'
      })
    }),
    (error) => error.code === 'THREADS_RESOLUTION_FAILED' && /allowed Threads hosts/.test(error.message)
  );
});

test('generic source URLs pass through the external resolution layer unchanged', async () => {
  const input = 'https://example.com/article?id=42';
  const result = await resolveExternalSourceUrl(input);
  assert.equal(result.provider, null);
  assert.equal(result.canonical_url, input);
});

test('normalizeThreadsPostUrl rejects non-post Threads paths', () => {
  assert.throws(() => normalizeThreadsPostUrl('https://threads.com/share/token'));
});
