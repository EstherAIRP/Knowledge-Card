import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';

const workflowPath = path.join(process.cwd(), '.github/workflows/deploy-pages.yml');

function loadWorkflow() {
  return parseYaml(fs.readFileSync(workflowPath, 'utf8'));
}

test('release workflow ignores pure generated-index pushes to prevent recursive deployment', () => {
  const workflow = loadWorkflow();
  const ignored = workflow.on?.push?.['paths-ignore'];

  assert.deepEqual(ignored, [
    'data/embeddings.json',
    'data/relations.json',
    'data/concepts.json'
  ]);
});

test('release workflow exposes S, P, release id, and build mode from the build job', () => {
  const workflow = loadWorkflow();
  const outputs = workflow.jobs?.build?.outputs ?? {};

  assert.equal(outputs.source_sha, '${{ steps.release_identity.outputs.source_sha }}');
  assert.equal(outputs.index_commit_sha, '${{ steps.persist_indexes.outputs.index_commit_sha }}');
  assert.equal(outputs.release_id, '${{ steps.release_identity.outputs.release_id }}');
  assert.equal(outputs.build_mode, '${{ steps.release_identity.outputs.build_mode }}');
});

test('release workflow freezes indexes, verifies persisted Git bytes, and writes release metadata', () => {
  const workflow = loadWorkflow();
  const steps = workflow.jobs?.build?.steps ?? [];
  const names = steps.map((step) => step.name);

  assert.ok(names.includes('Freeze release index manifest'));
  assert.ok(names.includes('Verify frozen indexes after site build'));
  assert.ok(names.includes('Persist generated indexes'));
  assert.ok(names.includes('Verify persisted release indexes'));
  assert.ok(names.includes('Write release metadata'));

  const persist = steps.find((step) => step.name === 'Persist generated indexes');
  assert.equal(persist.id, 'persist_indexes');
  assert.match(persist.run, /git add data\/embeddings\.json data\/relations\.json data\/concepts\.json/);
  assert.match(persist.run, /git push origin HEAD:main/);

  const verify = steps.find((step) => step.name === 'Verify persisted release indexes');
  assert.match(verify.run, /release-manifest\.mjs verify-git/);

  const meta = steps.find((step) => step.name === 'Write release metadata');
  assert.match(meta.run, /docs\/\.vitepress\/dist\/release-meta\.json/);
});

test('deploy job refuses to deploy when main no longer equals P', () => {
  const workflow = loadWorkflow();
  assert.equal(workflow.jobs?.deploy?.needs, 'build');

  const guard = (workflow.jobs?.deploy?.steps ?? []).find(
    (step) => step.name === 'Guard against stale deployment'
  );

  assert.ok(guard);
  assert.match(guard.run, /needs\.build\.outputs\.index_commit_sha/);
  assert.match(guard.run, /verify-release-source\.mjs remote/);
  assert.match(guard.run, /--fetch/);
});

test('deploy job verifies the live release metadata after Pages deployment', () => {
  const workflow = loadWorkflow();
  const steps = workflow.jobs?.deploy?.steps ?? [];
  const deployIndex = steps.findIndex((step) => step.name === 'Deploy GitHub Pages');
  const verifyIndex = steps.findIndex((step) => step.name === 'Verify live release provenance');

  assert.ok(deployIndex >= 0);
  assert.ok(verifyIndex > deployIndex);

  const verify = steps[verifyIndex];
  assert.match(verify.run, /verify-live-release\.mjs/);
  assert.match(verify.run, /steps\.deployment\.outputs\.page_url/);
  assert.match(verify.run, /needs\.build\.outputs\.release_id/);
  assert.match(verify.run, /needs\.build\.outputs\.source_sha/);
  assert.match(verify.run, /needs\.build\.outputs\.index_commit_sha/);
  assert.match(verify.run, /needs\.build\.outputs\.build_mode/);
});
