import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { prepareExternalIngestion } from '../scripts/lib/source-ingestion.mjs';

function jsonHtml(payload) {
  return `<!doctype html><html><body><script type="application/json">${JSON.stringify(payload)}</script></body></html>`;
}

function rawPost({ id, code, text, timestamp, isReply = false, hasReplies = null, username = 'esther1ooo' }) {
  return {
    pk: id,
    code,
    user: { username },
    caption: { text },
    timestamp,
    is_reply: isReply,
    ...(hasReplies === null ? {} : { has_replies: hasReplies })
  };
}

test('mandatory ingestion exposes llm_assisted verification for a recovered Threads source', async () => {
  const contentRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'threads-phase7-ingestion-'));
  const canonicalUrl = 'https://threads.com/@esther1ooo/post/DFyr62jB6Wr';
  const root = rawPost({
    id: '3563103415502874027_70726518985',
    code: 'DFyr62jB6Wr',
    text: '⚠️咒語放在留言\n如果讀不到，就下強迫讀取咒語',
    timestamp: '2025-02-08T00:37:28.000Z',
    isReply: false,
    hasReplies: true
  });
  const continuation = rawPost({
    id: '3563104572853852095_70726518985',
    code: 'DFysLsahhe_',
    text: '☑️資料表生成咒語\n☑️失意時強迫讀取資料卡',
    timestamp: '2025-02-08T00:39:46.000Z',
    isReply: true,
    hasReplies: true
  });
  const followup = rawPost({
    id: '3563175108442720092_70726518985',
    code: 'DFy8OHzPgdc',
    text: '第一發咒語，還是解釋一下',
    timestamp: '2025-02-08T02:59:54.000Z',
    isReply: true,
    hasReplies: false
  });

  try {
    const result = await prepareExternalIngestion(canonicalUrl, contentRoot, {
      year: 2026,
      sourceState: false,
      resolution: {
        provider: 'threads',
        input_kind: 'post',
        method: 'fixture',
        transient: false,
        redirect_count: 0,
        canonical_url: canonicalUrl
      },
      html: jsonHtml({ post: root }),
      browserConversationExtractor: async () => ({
        posts: [root, continuation, followup],
        complete: false
      }),
      continuationRanker: async () => ({
        selected_shortcodes: ['DFysLsahhe_'],
        root_only: false,
        confidence: 0.98,
        complete: true,
        rationale: 'Immediate same-author reply supplies the spell promised by the root.',
        candidate_labels: [
          { shortcode: 'DFysLsahhe_', label: 'continuation', confidence: 0.99 },
          { shortcode: 'DFy8OHzPgdc', label: 'followup', confidence: 0.97 }
        ]
      })
    });

    assert.equal(result.source_identity, 'threads:DFyr62jB6Wr');
    assert.equal(result.source_document.thread.status, 'INFERRED_THREAD_HIGH_CONFIDENCE');
    assert.equal(result.source_document.thread.verification, 'llm_assisted');
    assert.equal(result.source_document.extraction.inferred, true);
    assert.deepEqual(result.source_document.parts.map((part) => part.shortcode), [
      'DFyr62jB6Wr',
      'DFysLsahhe_'
    ]);
    assert.equal(result.analysis_input.thread_verification, 'llm_assisted');
    assert.match(result.source_document.combined_text, /資料表生成咒語/);
    assert.doesNotMatch(result.source_document.combined_text, /第一發咒語/);
  } finally {
    fs.rmSync(contentRoot, { recursive: true, force: true });
  }
});

test('mandatory ingestion accepts a high-confidence inferred root-only Threads source', async () => {
  const contentRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'threads-root-only-ingestion-'));
  const canonicalUrl = 'https://threads.com/@junyan5400/post/DZM-GSYlLXj';
  const root = rawPost({
    id: 'vox-root',
    code: 'DZM-GSYlLXj',
    username: 'junyan5400',
    text: 'VoxCPM 提供 Voice Design、Controllable Cloning、Ultimate Cloning 三種模式。',
    timestamp: '2026-06-05T11:33:03.000Z',
    isReply: false,
    hasReplies: true
  });
  const followupOne = rawPost({
    id: 'vox-followup-1',
    code: 'DZOJXoUk04Y',
    username: 'junyan5400',
    text: 'VibeVoice 核心語音識別模組支援 50+ 種語言。',
    timestamp: '2026-06-05T22:30:47.000Z',
    isReply: true,
    hasReplies: true
  });
  const followupTwo = rawPost({
    id: 'vox-followup-2',
    code: 'DZOe_OXD3QV',
    username: 'junyan5400',
    text: '這個是台灣專用的模型。',
    timestamp: '2026-06-06T01:39:42.000Z',
    isReply: true,
    hasReplies: true
  });

  try {
    const result = await prepareExternalIngestion(canonicalUrl, contentRoot, {
      year: 2026,
      sourceState: false,
      resolution: {
        provider: 'threads',
        input_kind: 'post',
        method: 'fixture',
        transient: false,
        redirect_count: 0,
        canonical_url: canonicalUrl
      },
      html: jsonHtml({ post: root }),
      browserConversationExtractor: async () => ({
        posts: [root, followupOne, followupTwo],
        complete: false
      }),
      continuationRanker: async () => ({
        selected_shortcodes: [],
        root_only: true,
        confidence: 0.97,
        complete: true,
        rationale: 'The VoxCPM root is complete; later replies discuss other systems or follow-up topics.',
        candidate_labels: [
          { shortcode: 'DZOJXoUk04Y', label: 'followup', confidence: 0.98 },
          { shortcode: 'DZOe_OXD3QV', label: 'followup', confidence: 0.96 }
        ]
      })
    });

    assert.equal(result.source_identity, 'threads:DZM-GSYlLXj');
    assert.equal(result.source_document.thread.status, 'INFERRED_SINGLE_POST_HIGH_CONFIDENCE');
    assert.equal(result.source_document.thread.verification, 'llm_assisted');
    assert.equal(result.source_document.thread.recovery.root_only, true);
    assert.equal(result.source_document.thread.total, 1);
    assert.deepEqual(result.source_document.parts.map((part) => part.shortcode), ['DZM-GSYlLXj']);
    assert.equal(result.source_document.extraction.method, 'llm_assisted_root_only');
    assert.equal(result.source_document.extraction.inferred, true);
    assert.equal(result.analysis_input.thread_verification, 'llm_assisted');
    assert.match(result.source_document.combined_text, /VoxCPM/);
    assert.doesNotMatch(result.source_document.combined_text, /VibeVoice/);
  } finally {
    fs.rmSync(contentRoot, { recursive: true, force: true });
  }
});
