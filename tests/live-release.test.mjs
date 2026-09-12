import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createIndexManifest } from '../scripts/release-manifest.mjs';
import { verifyLiveRelease } from '../scripts/verify-live-release.mjs';

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function initFixture() {
  const root = makeTempDir('knowledge-card-live-release-');
  git(root, ['init', '--initial-branch=main']);
  git(root, ['config', 'user.name', 'Release Test']);
  git(root, ['config', 'user.email', 'release-test@example.invalid']);

  writeJson(path.join(root, 'data/embeddings.json'), { schema_version: 1, embeddings: [] });
  writeJson(path.join(root, 'data/graph-layout.json'), { schema_version: 1, nodes: {} });
  writeJson(path.join(root, 'data/relations.json'), { schema_version: 1, edges: [] });
  writeJson(path.join(root, 'data/concepts.json'), { schema_version: 1, concepts: [] });

  git(root, ['add', '.']);
  git(root, ['commit', '-m', 'fixture: release']);
  const sha = git(root, ['rev-parse', 'HEAD']);
  const manifest = createIndexManifest({ root });

  return { root, sha, manifest };
}

function response(meta, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() {
      return typeof meta === 'string' ? meta : JSON.stringify(meta);
    }
  };
}

function liveMeta({ manifest, sha, releaseId = 'release-1', buildMode = 'incremental' }) {
  return {
    schema_version: 1,
    release_id: releaseId,
    source_sha: sha,
    index_commit_sha: sha,
    build_mode: buildMode,
    generated_at: '2026-09-11T00:00:00.000Z',
    indexes: manifest.indexes
  };
}

test('live verifier accepts metadata whose identity and Git index bytes match', async () => {
  const { root, sha, manifest } = initFixture();
  const meta = liveMeta({ manifest, sha });
  const calls = [];

  const result = await verifyLiveRelease({
    siteUrl: 'https://example.invalid/Knowledge-Card/',
    releaseId: 'release-1',
    sourceSha: sha,
    indexCommitSha: sha,
    buildMode: 'incremental',
    cwd: root,
    attempts: 1,
    delayMs: 0,
    fetchImpl: async (url) => {
      calls.push(url.toString());
      return response(meta);
    }
  });

  assert.equal(result.release_id, 'release-1');
  assert.equal(result.attempts_used, 1);
  assert.match(calls[0], /release-meta\.json\?release_id=release-1&attempt=1/);
});

test('live verifier retries stale metadata and succeeds when the expected release appears', async () => {
  const { root, sha, manifest } = initFixture();
  const stale = liveMeta({ manifest, sha, releaseId: 'older-release' });
  const current = liveMeta({ manifest, sha });
  let calls = 0;

  const result = await verifyLiveRelease({
    siteUrl: 'https://example.invalid/Knowledge-Card/',
    releaseId: 'release-1',
    sourceSha: sha,
    indexCommitSha: sha,
    buildMode: 'incremental',
    cwd: root,
    attempts: 2,
    delayMs: 0,
    fetchImpl: async () => {
      calls += 1;
      return response(calls === 1 ? stale : current);
    }
  });

  assert.equal(calls, 2);
  assert.equal(result.attempts_used, 2);
});

test('live verifier fails closed when the online index hashes do not match P', async () => {
  const { root, sha, manifest } = initFixture();
  const meta = liveMeta({ manifest, sha });
  meta.indexes['data/relations.json'] = {
    ...meta.indexes['data/relations.json'],
    sha256: '0'.repeat(64)
  };

  await assert.rejects(
    verifyLiveRelease({
      siteUrl: 'https://example.invalid/Knowledge-Card/',
      releaseId: 'release-1',
      sourceSha: sha,
      indexCommitSha: sha,
      buildMode: 'incremental',
      cwd: root,
      attempts: 1,
      delayMs: 0,
      fetchImpl: async () => response(meta)
    }),
    /SHA-256 mismatch for data\/relations\.json/
  );
});

test('live verifier reports repeated HTTP failure as verification failure', async () => {
  const { root, sha } = initFixture();

  await assert.rejects(
    verifyLiveRelease({
      siteUrl: 'https://example.invalid/Knowledge-Card/',
      releaseId: 'release-1',
      sourceSha: sha,
      indexCommitSha: sha,
      buildMode: 'incremental',
      cwd: root,
      attempts: 2,
      delayMs: 0,
      fetchImpl: async () => response('', 503)
    }),
    /Live release verification failed after 2 attempt\(s\): HTTP 503/
  );
});
