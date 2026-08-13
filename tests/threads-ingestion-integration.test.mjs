import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  prepareExternalIngestion,
  resolveExtractedSourceIngestion
} from '../scripts/lib/source-ingestion.mjs';

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

function makeContentRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'threads-phase4-'));
}

function completeThreadFixture() {
  const shareUrl = 'https://www.threads.com/share/phase4token';
  const targetUrl = 'https://threads.com/@alice/post/PART2P4';
  const rootUrl = 'https://threads.com/@alice/post/ROOTP4';
  const html = jsonHtml({
    posts: [
      post({ id: '700', code: 'ROOTP4', text: '第一篇完整內容', hasReplies: true }),
      post({ id: '701', code: 'PART2P4', text: '第二篇完整內容', replyTo: '700', root: '700', hasReplies: true }),
      post({ id: '702', code: 'PART3P4', text: '第三篇完整內容', replyTo: '701', root: '700', hasReplies: false })
    ]
  }, '<div>2 / 3</div>');
  const fetchImpl = async (url) => {
    if (url.includes('/share/')) return response({ status: 302, url, location: targetUrl });
    if (url === targetUrl) return response({ status: 200, url, body: html });
    throw new Error(`Unexpected URL: ${url}`);
  };
  return { shareUrl, targetUrl, rootUrl, fetchImpl };
}

test('mandatory ingestion preparation resolves a Threads middle-part share URL to root identity and full text', async () => {
  const contentRoot = makeContentRoot();
  try {
    const fixture = completeThreadFixture();
    const result = await prepareExternalIngestion(fixture.shareUrl, contentRoot, {
      fetchImpl: fixture.fetchImpl,
      year: 2026
    });

    assert.equal(result.canonical_url, fixture.rootUrl);
    assert.equal(result.source_identity, 'threads:ROOTP4');
    assert.equal(result.mode, 'create');
    assert.equal(result.resolved_input_url, fixture.targetUrl);
    assert.equal(result.source_document.thread.status, 'COMPLETE_THREAD');
    assert.equal(result.source_document.thread.complete, true);
    assert.equal(result.source_document.thread.input_index, 2);
    assert.equal(result.source_document.parts.length, 3);
    assert.equal(result.source_document.combined_text, '第一篇完整內容\n\n第二篇完整內容\n\n第三篇完整內容');
    assert.deepEqual(result.analysis_input, {
      provider: 'threads',
      text_field: 'source_document.combined_text',
      media_field: 'source_document.parts[].media',
      complete: true
    });
  } finally {
    fs.rmSync(contentRoot, { recursive: true, force: true });
  }
});

test('root-level Threads identity detects an existing Knowledge Card even when input points to a middle part', async () => {
  const contentRoot = makeContentRoot();
  try {
    const yearDir = path.join(contentRoot, '2026');
    fs.mkdirSync(yearDir, { recursive: true });
    fs.writeFileSync(path.join(yearDir, 'existing-thread.md'), `---\nid: existing-thread\ncanonical_url: https://threads.com/@alice/post/ROOTP4\nsource:\n  identity: threads:ROOTP4\n---\n# Existing\n`, 'utf8');

    const fixture = completeThreadFixture();
    const result = await prepareExternalIngestion(fixture.shareUrl, contentRoot, {
      fetchImpl: fixture.fetchImpl,
      year: 2026
    });

    assert.equal(result.mode, 'update');
    assert.equal(result.id, 'existing-thread');
    assert.ok(result.existing_path.endsWith('existing-thread.md'));
    assert.equal(result.source_identity, 'threads:ROOTP4');
  } finally {
    fs.rmSync(contentRoot, { recursive: true, force: true });
  }
});

test('incomplete Threads conversation fails before create/update resolution', async () => {
  const contentRoot = makeContentRoot();
  try {
    const targetUrl = 'https://threads.com/@alice/post/PART2MISS4';
    const html = jsonHtml({
      posts: [
        post({ id: '800', code: 'ROOTMISS4', text: 'one', hasReplies: true }),
        post({ id: '801', code: 'PART2MISS4', text: 'two', replyTo: '800', root: '800', hasReplies: true })
      ]
    }, '<div>2 / 3</div>');

    await assert.rejects(
      () => prepareExternalIngestion(targetUrl, contentRoot, {
        fetchImpl: async (url) => response({ status: 200, url, body: html }),
        year: 2026
      }),
      (error) => error?.code === 'THREADS_CONVERSATION_INCOMPLETE'
        || error?.code === 'THREADS_PRIMARY_SOURCE_INCOMPLETE'
    );
  } finally {
    fs.rmSync(contentRoot, { recursive: true, force: true });
  }
});

test('extracted source identity must match canonical root identity before deduplication', () => {
  const contentRoot = makeContentRoot();
  try {
    assert.throws(
      () => resolveExtractedSourceIngestion({
        canonical_url: 'https://threads.com/@alice/post/ROOTMATCH4',
        source_identity: 'threads:WRONG4'
      }, contentRoot, 2026),
      (error) => error?.code === 'EXTRACTED_SOURCE_IDENTITY_MISMATCH'
    );
  } finally {
    fs.rmSync(contentRoot, { recursive: true, force: true });
  }
});

test('non-Threads mandatory resolver remains URL-only and does not require a source extractor', async () => {
  const contentRoot = makeContentRoot();
  try {
    const result = await prepareExternalIngestion('https://example.com/article?utm_source=threads&id=7', contentRoot, { year: 2026 });
    assert.equal(result.canonical_url, 'https://example.com/article?id=7');
    assert.match(result.source_identity, /^url:/);
    assert.equal(result.mode, 'create');
    assert.equal('source_document' in result, false);
  } finally {
    fs.rmSync(contentRoot, { recursive: true, force: true });
  }
});
