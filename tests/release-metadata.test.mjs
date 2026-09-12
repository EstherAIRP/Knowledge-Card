import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  createIndexManifest,
  verifyIndexManifestAtGitCommit
} from '../scripts/release-manifest.mjs';
import { createReleaseMeta } from '../scripts/release-meta.mjs';

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeIndexes(root) {
  writeJson(path.join(root, 'data/embeddings.json'), { schema_version: 1, embeddings: [] });
  writeJson(path.join(root, 'data/graph-layout.json'), { schema_version: 1, nodes: {} });
  writeJson(path.join(root, 'data/relations.json'), { schema_version: 1, edges: [] });
  writeJson(path.join(root, 'data/concepts.json'), { schema_version: 1, concepts: [] });
}

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function initGitRepo() {
  const root = makeTempDir('knowledge-card-release-meta-');
  git(root, ['init', '--initial-branch=main']);
  git(root, ['config', 'user.name', 'Release Test']);
  git(root, ['config', 'user.email', 'release-test@example.invalid']);
  writeIndexes(root);
  git(root, ['add', '.']);
  git(root, ['commit', '-m', 'fixture: indexes']);
  return root;
}

test('release manifest can verify the exact index bytes stored in a Git commit', () => {
  const root = initGitRepo();
  const commit = git(root, ['rev-parse', 'HEAD']);
  const manifest = createIndexManifest({ root });

  const result = verifyIndexManifestAtGitCommit(manifest, { cwd: root, commit });
  assert.equal(result.commit, commit);
  assert.equal(result.indexes, 4);

  writeJson(path.join(root, 'data/relations.json'), {
    schema_version: 1,
    edges: [{ source: 'later', target: 'change' }]
  });

  assert.equal(
    verifyIndexManifestAtGitCommit(manifest, { cwd: root, commit }).commit,
    commit
  );
});

test('release manifest detects when a persisted Git commit has different index bytes', () => {
  const root = initGitRepo();
  const manifest = createIndexManifest({ root });

  writeJson(path.join(root, 'data/concepts.json'), {
    schema_version: 1,
    concepts: [{ id: 'changed' }]
  });
  git(root, ['add', 'data/concepts.json']);
  git(root, ['commit', '-m', 'fixture: changed index']);
  const changedCommit = git(root, ['rev-parse', 'HEAD']);

  assert.throws(
    () => verifyIndexManifestAtGitCommit(manifest, { cwd: root, commit: changedCommit }),
    /SHA-256 mismatch for data\/concepts\.json/
  );
});

test('release metadata binds release id, S, P, build mode, and frozen index hashes', () => {
  const root = initGitRepo();
  const sourceSha = git(root, ['rev-parse', 'HEAD']);
  const manifest = createIndexManifest({ root });

  const meta = createReleaseMeta({
    manifest,
    sourceSha,
    indexCommitSha: sourceSha,
    releaseId: '12345-1-deadbeefcafe',
    buildMode: 'incremental',
    generatedAt: '2026-09-11T00:00:00.000Z'
  });

  assert.equal(meta.schema_version, 1);
  assert.equal(meta.release_id, '12345-1-deadbeefcafe');
  assert.equal(meta.source_sha, sourceSha);
  assert.equal(meta.index_commit_sha, sourceSha);
  assert.equal(meta.build_mode, 'incremental');
  assert.equal(meta.generated_at, '2026-09-11T00:00:00.000Z');
  assert.deepEqual(Object.keys(meta.indexes), [
    'data/embeddings.json',
    'data/graph-layout.json',
    'data/relations.json',
    'data/concepts.json'
  ]);
  assert.equal(
    meta.indexes['data/relations.json'].sha256,
    manifest.indexes['data/relations.json'].sha256
  );
});

test('release metadata rejects abbreviated SHAs and unsupported build modes', () => {
  const root = initGitRepo();
  const manifest = createIndexManifest({ root });
  const sha = git(root, ['rev-parse', 'HEAD']);

  assert.throws(
    () =>
      createReleaseMeta({
        manifest,
        sourceSha: sha.slice(0, 12),
        indexCommitSha: sha,
        releaseId: 'release',
        buildMode: 'incremental'
      }),
    /source_sha must be a full 40-character Git SHA/
  );

  assert.throws(
    () =>
      createReleaseMeta({
        manifest,
        sourceSha: sha,
        indexCommitSha: sha,
        releaseId: 'release',
        buildMode: 'partial'
      }),
    /build_mode must be incremental or full/
  );
});
