import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  createIndexManifest,
  verifyIndexManifest
} from '../scripts/release-manifest.mjs';
import {
  verifyCheckoutAtSource,
  verifyIndexCommit,
  verifyRemoteRef
} from '../scripts/verify-release-source.mjs';

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeIndexes(root) {
  writeJson(path.join(root, 'data/embeddings.json'), { schema_version: 1, embeddings: [] });
  writeJson(path.join(root, 'data/relations.json'), { schema_version: 1, edges: [] });
  writeJson(path.join(root, 'data/concepts.json'), { schema_version: 1, concepts: [] });
}

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function initGitRepo() {
  const root = makeTempDir('knowledge-card-release-git-');
  git(root, ['init', '--initial-branch=main']);
  git(root, ['config', 'user.name', 'Release Test']);
  git(root, ['config', 'user.email', 'release-test@example.invalid']);
  fs.writeFileSync(path.join(root, 'README.md'), '# fixture\n', 'utf8');
  writeIndexes(root);
  git(root, ['add', '.']);
  git(root, ['commit', '-m', 'fixture: source']);
  return root;
}

function commitAll(root, message) {
  git(root, ['add', '.']);
  git(root, ['commit', '-m', message]);
  return git(root, ['rev-parse', 'HEAD']);
}

test('release manifest records and verifies the three fixed indexes', () => {
  const root = makeTempDir('knowledge-card-release-manifest-');
  writeIndexes(root);

  const manifest = createIndexManifest({ root });

  assert.equal(manifest.schema_version, 1);
  assert.deepEqual(Object.keys(manifest.indexes), [
    'data/embeddings.json',
    'data/relations.json',
    'data/concepts.json'
  ]);
  assert.match(manifest.indexes['data/embeddings.json'].sha256, /^[0-9a-f]{64}$/);
  assert.ok(manifest.indexes['data/embeddings.json'].bytes > 0);
  assert.equal(verifyIndexManifest(manifest, { root }), true);
});

test('release manifest fails closed when an index is missing', () => {
  const root = makeTempDir('knowledge-card-release-missing-');
  writeIndexes(root);
  fs.unlinkSync(path.join(root, 'data/relations.json'));

  assert.throws(
    () => createIndexManifest({ root }),
    /Missing release index: data\/relations\.json/
  );
});

test('release manifest rejects malformed JSON', () => {
  const root = makeTempDir('knowledge-card-release-json-');
  writeIndexes(root);
  fs.writeFileSync(path.join(root, 'data/concepts.json'), '{broken', 'utf8');

  assert.throws(
    () => createIndexManifest({ root }),
    /Cannot parse release index data\/concepts\.json/
  );
});

test('release manifest detects any later index byte change', () => {
  const root = makeTempDir('knowledge-card-release-mutated-');
  writeIndexes(root);
  const manifest = createIndexManifest({ root });

  writeJson(path.join(root, 'data/relations.json'), { schema_version: 1, edges: [{ id: 'changed' }] });

  assert.throws(
    () => verifyIndexManifest(manifest, { root }),
    /SHA-256 mismatch for data\/relations\.json/
  );
});

test('release source verifier accepts checkout at the exact source SHA', () => {
  const root = initGitRepo();
  const sourceSha = git(root, ['rev-parse', 'HEAD']);

  const result = verifyCheckoutAtSource({ cwd: root, sourceSha });
  assert.equal(result.source_sha, sourceSha);
  assert.equal(result.head_sha, sourceSha);
});

test('release source verifier accepts P = S when indexes did not change', () => {
  const root = initGitRepo();
  const sourceSha = git(root, ['rev-parse', 'HEAD']);

  const result = verifyIndexCommit({
    cwd: root,
    sourceSha,
    indexCommitSha: sourceSha
  });

  assert.equal(result.mode, 'no-index-change');
  assert.deepEqual(result.changed_files, []);
});

test('release source verifier accepts a direct index-only commit P on source S', () => {
  const root = initGitRepo();
  const sourceSha = git(root, ['rev-parse', 'HEAD']);
  writeJson(path.join(root, 'data/relations.json'), {
    schema_version: 1,
    edges: [{ source: 'a', target: 'b' }]
  });
  const indexCommitSha = commitAll(root, 'fixture: refresh indexes');

  const result = verifyIndexCommit({ cwd: root, sourceSha, indexCommitSha });
  assert.equal(result.mode, 'index-commit');
  assert.deepEqual(result.changed_files, ['data/relations.json']);
});

test('release source verifier rejects an index commit that also changes a non-index file', () => {
  const root = initGitRepo();
  const sourceSha = git(root, ['rev-parse', 'HEAD']);
  writeJson(path.join(root, 'data/relations.json'), { schema_version: 1, edges: [{ id: 1 }] });
  fs.writeFileSync(path.join(root, 'README.md'), '# forbidden side effect\n', 'utf8');
  const indexCommitSha = commitAll(root, 'fixture: invalid index commit');

  assert.throws(
    () => verifyIndexCommit({ cwd: root, sourceSha, indexCommitSha }),
    /outside the release index allowlist: README\.md/
  );
});

test('release source verifier rejects P when its parent is not the declared source S', () => {
  const root = initGitRepo();
  const sourceSha = git(root, ['rev-parse', 'HEAD']);

  fs.writeFileSync(path.join(root, 'README.md'), '# intermediate\n', 'utf8');
  commitAll(root, 'fixture: intermediate');

  writeJson(path.join(root, 'data/concepts.json'), {
    schema_version: 1,
    concepts: [{ id: 'later' }]
  });
  const indexCommitSha = commitAll(root, 'fixture: refresh after intermediate');

  assert.throws(
    () => verifyIndexCommit({ cwd: root, sourceSha, indexCommitSha }),
    /Index commit parent mismatch/
  );
});

test('release source verifier detects a remote main that advanced past the expected SHA', () => {
  const root = initGitRepo();
  const sourceSha = git(root, ['rev-parse', 'HEAD']);
  const bare = makeTempDir('knowledge-card-release-origin-');
  git(bare, ['init', '--bare']);
  git(root, ['remote', 'add', 'origin', bare]);
  git(root, ['push', '-u', 'origin', 'main']);

  assert.equal(
    verifyRemoteRef({ cwd: root, expectedSha: sourceSha }).remote_sha,
    sourceSha
  );

  writeJson(path.join(root, 'data/embeddings.json'), {
    schema_version: 1,
    embeddings: [{ id: 'new' }]
  });
  commitAll(root, 'fixture: advance main');
  git(root, ['push', 'origin', 'main']);

  assert.throws(
    () => verifyRemoteRef({ cwd: root, expectedSha: sourceSha }),
    /origin\/main mismatch/
  );
});
