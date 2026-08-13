import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { prepareExternalIngestion } from '../scripts/lib/source-ingestion.mjs';
import {
  buildThreadsSourceSnapshot,
  compareThreadsSourceSnapshots,
  defaultThreadsSnapshotRoot,
  readThreadsSourceSnapshot,
  writeThreadsSourceSnapshot
} from '../scripts/lib/sources/threads/source-state.mjs';

function source(parts, identity = 'threads:ROOT6') {
  const rootId = parts[0]?.id || '600';
  return {
    provider: 'threads',
    source_identity: identity,
    canonical_url: 'https://threads.com/@alice/post/ROOT6',
    root_post_id: rootId,
    root_shortcode: 'ROOT6',
    author: 'alice',
    thread: { status: parts.length === 1 ? 'SINGLE_POST' : 'COMPLETE_THREAD', total: parts.length, complete: true },
    extraction: { conversation_complete: true },
    parts: parts.map((part, index) => ({
      index: index + 1,
      id: part.id || String(600 + index),
      shortcode: part.shortcode || (index === 0 ? 'ROOT6' : `PART${index + 1}P6`),
      canonical_url: `https://threads.com/@alice/post/${part.shortcode || (index === 0 ? 'ROOT6' : `PART${index + 1}P6`)}`,
      username: 'alice',
      text: part.text,
      media: part.media || [],
      reply_to: index === 0 ? null : (parts[index - 1].id || String(599 + index)),
      root_post: index === 0 ? null : rootId,
      has_replies: index < parts.length - 1
    }))
  };
}

test('Threads source snapshots are deterministic and do not store raw source text', () => {
  const first = buildThreadsSourceSnapshot(source([{ text: '第一篇不應原文寫入 snapshot' }, { text: '第二篇' }]), {
    capturedAt: '2026-08-13T00:00:00.000Z'
  });
  const second = buildThreadsSourceSnapshot(source([{ text: '第一篇不應原文寫入 snapshot' }, { text: '第二篇' }]), {
    capturedAt: '2026-08-13T01:00:00.000Z'
  });

  assert.equal(first.source_hash, second.source_hash);
  assert.equal(compareThreadsSourceSnapshots(first, second).status, 'UNCHANGED');
  assert.equal(JSON.stringify(first).includes('第一篇不應原文寫入 snapshot'), false);
});

test('signed media query changes do not create a false source change', () => {
  const previous = buildThreadsSourceSnapshot(source([{ text: 'same', media: [{ id: 'm1', type: 'image', url: 'https://cdn.example/img.jpg?sig=old', width: 100, height: 100 }] }]));
  const current = buildThreadsSourceSnapshot(source([{ text: 'same', media: [{ id: 'm1', type: 'image', url: 'https://cdn.example/img.jpg?sig=new', width: 100, height: 100 }] }]));
  assert.equal(compareThreadsSourceSnapshots(previous, current).status, 'UNCHANGED');
});

test('append-only same-author continuation is classified as THREAD_EXTENDED', () => {
  const previous = buildThreadsSourceSnapshot(source([
    { id: '600', shortcode: 'ROOT6', text: 'one' },
    { id: '601', shortcode: 'PART2P6', text: 'two' }
  ]));
  const current = buildThreadsSourceSnapshot(source([
    { id: '600', shortcode: 'ROOT6', text: 'one' },
    { id: '601', shortcode: 'PART2P6', text: 'two' },
    { id: '602', shortcode: 'PART3P6', text: 'three' }
  ]));
  const change = compareThreadsSourceSnapshots(previous, current);
  assert.equal(change.status, 'THREAD_EXTENDED');
  assert.equal(change.previous_total, 2);
  assert.equal(change.current_total, 3);
  assert.deepEqual(change.added_parts.map((part) => part.shortcode), ['PART3P6']);
});

test('edited and removed parts are classified without guessing', () => {
  const baseline = buildThreadsSourceSnapshot(source([
    { id: '600', shortcode: 'ROOT6', text: 'one' },
    { id: '601', shortcode: 'PART2P6', text: 'two' }
  ]));
  const edited = buildThreadsSourceSnapshot(source([
    { id: '600', shortcode: 'ROOT6', text: 'ONE edited' },
    { id: '601', shortcode: 'PART2P6', text: 'two' }
  ]));
  const removed = buildThreadsSourceSnapshot(source([
    { id: '600', shortcode: 'ROOT6', text: 'one' }
  ]));

  const changed = compareThreadsSourceSnapshots(baseline, edited);
  assert.equal(changed.status, 'PART_CHANGED');
  assert.deepEqual(changed.changed_parts[0].fields, ['text']);
  assert.equal(compareThreadsSourceSnapshots(baseline, removed).status, 'PART_REMOVED');
});

test('snapshot writer persists a baseline once and does not rewrite unchanged state', () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'threads-phase6-state-'));
  try {
    const contentRoot = path.join(repoRoot, 'content', 'knowledge');
    fs.mkdirSync(contentRoot, { recursive: true });
    const stateRoot = defaultThreadsSnapshotRoot(contentRoot);
    assert.equal(stateRoot, path.join(repoRoot, 'state', 'source-snapshots', 'threads'));

    const complete = source([{ text: 'one' }, { text: 'two' }]);
    const first = writeThreadsSourceSnapshot(complete, stateRoot, { capturedAt: '2026-08-13T00:00:00.000Z' });
    const second = writeThreadsSourceSnapshot(complete, stateRoot, { capturedAt: '2026-08-13T01:00:00.000Z' });
    assert.equal(first.written, true);
    assert.equal(second.written, false);

    const stored = readThreadsSourceSnapshot(stateRoot, complete.source_identity).snapshot;
    assert.equal(stored.captured_at, '2026-08-13T00:00:00.000Z');
    assert.equal(stored.source_hash, first.snapshot.source_hash);
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
});

function rawPost({ id, code, text, replyTo = null, root = null, hasReplies = null }) {
  return {
    pk: id,
    code,
    user: { username: 'alice' },
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

function response({ url, body }) {
  return {
    status: 200,
    url,
    headers: { get() { return null; } },
    async text() { return body; }
  };
}

test('mandatory Threads preflight reports THREAD_EXTENDED against the committed source baseline', async () => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'threads-phase6-ingestion-'));
  try {
    const contentRoot = path.join(repoRoot, 'content', 'knowledge');
    const yearDir = path.join(contentRoot, '2026');
    fs.mkdirSync(yearDir, { recursive: true });
    fs.writeFileSync(path.join(yearDir, 'existing-thread.md'), `---\nid: existing-thread\ncanonical_url: https://threads.com/@alice/post/ROOT6\nsource:\n  identity: threads:ROOT6\n---\n# Existing\n`, 'utf8');

    const baseline = source([
      { id: '600', shortcode: 'ROOT6', text: 'one' },
      { id: '601', shortcode: 'PART2P6', text: 'two' }
    ]);
    writeThreadsSourceSnapshot(baseline, defaultThreadsSnapshotRoot(contentRoot), {
      capturedAt: '2026-08-12T00:00:00.000Z'
    });

    const targetUrl = 'https://threads.com/@alice/post/PART2P6';
    const payload = {
      posts: [
        rawPost({ id: '600', code: 'ROOT6', text: 'one', hasReplies: true }),
        rawPost({ id: '601', code: 'PART2P6', text: 'two', replyTo: '600', root: '600', hasReplies: true }),
        rawPost({ id: '602', code: 'PART3P6', text: 'three', replyTo: '601', root: '600', hasReplies: false })
      ]
    };
    const html = `<!doctype html><html><body><div>2 / 3</div><script type="application/json">${JSON.stringify(payload)}</script></body></html>`;
    const result = await prepareExternalIngestion(targetUrl, contentRoot, {
      fetchImpl: async (url) => response({ url, body: html }),
      year: 2026
    });

    assert.equal(result.mode, 'update');
    assert.equal(result.source_identity, 'threads:ROOT6');
    assert.equal(result.source_change.status, 'THREAD_EXTENDED');
    assert.equal(result.source_change.baseline_exists, true);
    assert.deepEqual(result.source_change.added_parts.map((part) => part.shortcode), ['PART3P6']);
    assert.equal(result.source_document.combined_text, 'one\n\ntwo\n\nthree');
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
});
