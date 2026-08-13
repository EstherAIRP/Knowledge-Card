import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractResolvedThreadsPost,
  extractThreadsJsonPayloads,
  extractThreadsPostFromHtml,
  findThreadsPostCandidate
} from '../scripts/lib/sources/threads/extract-post.mjs';
import { extractExternalSource } from '../scripts/lib/source-extraction.mjs';

function jsonHtml(payload) {
  return `<!doctype html><html><head></head><body><script type="application/json">${JSON.stringify(payload)}</script></body></html>`;
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
    async text() {
      return body;
    }
  };
}

test('extracts a normalized Threads post from nested embedded JSON', () => {
  const canonicalUrl = 'https://threads.com/@esther1000/post/AbC_123';
  const html = jsonHtml({
    data: {
      thread_items: [{
        post: {
          pk: '200',
          code: 'AbC_123',
          user: { username: 'esther1000' },
          caption: { text: '第二段完整文字' },
          taken_at: 1760000000,
          text_post_app_info: {
            is_reply: true,
            root_post: { pk: '100' },
            replied_to_post: { pk: '100' },
            direct_reply_count: 2
          },
          image_versions2: {
            candidates: [{ url: 'https://cdn.example/image.jpg', width: 1080, height: 1350 }]
          }
        }
      }]
    }
  });

  const post = extractThreadsPostFromHtml(html, canonicalUrl);
  assert.equal(post.provider, 'threads');
  assert.equal(post.id, '200');
  assert.equal(post.shortcode, 'AbC_123');
  assert.equal(post.username, 'esther1000');
  assert.equal(post.text, '第二段完整文字');
  assert.equal(post.is_reply, true);
  assert.equal(post.root_post, '100');
  assert.equal(post.reply_to, '100');
  assert.equal(post.has_replies, true);
  assert.equal(post.media.length, 1);
  assert.equal(post.media[0].type, 'image');
  assert.equal(post.extraction.method, 'html_embedded_json');
  assert.equal(post.extraction.single_post_complete, true);
  assert.equal(post.extraction.conversation_complete, false);
});

test('selects the exact shortcode instead of another post in the same hydration payload', () => {
  const canonicalUrl = 'https://threads.com/@alice/post/TARGET1';
  const payload = {
    quoted: {
      pk: '9',
      code: 'OTHER1',
      user: { username: 'bob' },
      caption: { text: 'quoted content' }
    },
    thread: {
      pk: '10',
      code: 'TARGET1',
      user: { username: 'alice' },
      caption: { text: 'target content' }
    }
  };

  const payloads = extractThreadsJsonPayloads(jsonHtml(payload));
  const candidate = findThreadsPostCandidate(payloads, {
    expectedShortcode: 'TARGET1',
    canonicalUrl
  });
  assert.equal(candidate.code, 'TARGET1');
  assert.equal(extractThreadsPostFromHtml(jsonHtml(payload), canonicalUrl).text, 'target content');
});

test('normalizes carousel image and video children without keeping video poster as a separate item', () => {
  const canonicalUrl = 'https://threads.com/@alice/post/CAROUSEL1';
  const html = jsonHtml({
    post: {
      id: '50',
      code: 'CAROUSEL1',
      user: { username: 'alice' },
      caption: { text: 'carousel' },
      image_versions2: { candidates: [{ url: 'https://cdn.example/preview.jpg' }] },
      carousel_media: [
        {
          id: '51',
          image_versions2: { candidates: [{ url: 'https://cdn.example/one.jpg', width: 1000, height: 1000 }] }
        },
        {
          id: '52',
          video_versions: [{ url: 'https://cdn.example/two.mp4', width: 720, height: 1280 }],
          image_versions2: { candidates: [{ url: 'https://cdn.example/two-cover.jpg' }] }
        }
      ]
    }
  });

  const post = extractThreadsPostFromHtml(html, canonicalUrl);
  assert.deepEqual(post.media.map((item) => item.url), [
    'https://cdn.example/one.jpg',
    'https://cdn.example/two.mp4'
  ]);
  assert.equal(post.media[1].type, 'video');
  assert.equal(post.media[1].thumbnail_url, 'https://cdn.example/two-cover.jpg');
});

test('ignores malformed JSON script blocks when a later valid hydration block exists', () => {
  const canonicalUrl = 'https://threads.com/@alice/post/GOOD1';
  const html = `
    <script type="application/json">{bad json</script>
    <script type="application/json">${JSON.stringify({
      post: { id: '77', code: 'GOOD1', user: { username: 'alice' }, text: 'good' }
    })}</script>`;

  const post = extractThreadsPostFromHtml(html, canonicalUrl);
  assert.equal(post.id, '77');
  assert.equal(post.text, 'good');
});

test('uses API adapter fallback when primary HTML fetch is unavailable', async () => {
  const canonicalUrl = 'https://threads.com/@alice/post/API123';
  const post = await extractResolvedThreadsPost(canonicalUrl, {
    fetchImpl: async (url) => response({ status: 403, url }),
    apiExtractor: async ({ shortcode }) => ({
      id: '901',
      shortcode,
      username: 'alice',
      text: 'api result',
      timestamp: '2026-08-13T01:00:00Z',
      media_type: 'IMAGE',
      media_url: 'https://cdn.example/api.jpg'
    })
  });

  assert.equal(post.id, '901');
  assert.equal(post.text, 'api result');
  assert.equal(post.media[0].type, 'image');
  assert.equal(post.extraction.method, 'api');
});

test('uses browser extractor fallback after embedded JSON extraction returns no target post', async () => {
  const canonicalUrl = 'https://threads.com/@alice/post/BROWSER1';
  const post = await extractResolvedThreadsPost(canonicalUrl, {
    html: '<html><body>SPA shell</body></html>',
    browserExtractor: async ({ shortcode }) => ({
      pk: '300',
      code: shortcode,
      user: { username: 'alice' },
      caption: { text: 'browser result' }
    })
  });

  assert.equal(post.id, '300');
  assert.equal(post.text, 'browser result');
  assert.equal(post.extraction.method, 'browser');
});

test('fails closed when no extractor can produce the requested Threads post', async () => {
  await assert.rejects(
    () => extractResolvedThreadsPost('https://threads.com/@alice/post/MISSING1', {
      html: '<script type="application/json">{"post":{"code":"OTHER"}}</script>'
    }),
    (error) => error?.code === 'THREADS_POST_EXTRACTION_FAILED'
  );
});

test('share URL resolves first and then extracts the canonical post through the source adapter', async () => {
  const shareUrl = 'https://www.threads.com/share/shareToken';
  const canonicalUrl = 'https://threads.com/@alice/post/END2END';
  const html = jsonHtml({
    data: {
      post: {
        id: '808',
        code: 'END2END',
        user: { username: 'alice' },
        text: 'resolved and extracted'
      }
    }
  });

  const fetchImpl = async (url) => {
    if (url.includes('/share/')) {
      return response({ status: 302, url, location: canonicalUrl });
    }
    if (url === canonicalUrl) {
      return response({ status: 200, url, body: html });
    }
    throw new Error(`Unexpected URL: ${url}`);
  };

  const result = await extractExternalSource(shareUrl, { fetchImpl });
  assert.equal(result.resolution.canonical_url, canonicalUrl);
  assert.equal(result.source.id, '808');
  assert.equal(result.source.shortcode, 'END2END');
  assert.equal(result.source.text, 'resolved and extracted');
});

test('fallback adapters cannot silently return a different Threads post', async () => {
  await assert.rejects(
    () => extractResolvedThreadsPost('https://threads.com/@alice/post/EXPECTED', {
      html: '',
      apiExtractor: async () => ({
        id: '1',
        shortcode: 'WRONG',
        username: 'alice',
        text: 'wrong post'
      })
    }),
    (error) => error?.code === 'THREADS_POST_EXTRACTION_FAILED' || error?.code === 'THREADS_POST_MISMATCH'
  );
});
