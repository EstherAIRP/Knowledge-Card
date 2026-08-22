import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  classifyIngestionFailure,
  createRemoteIngestRequest,
  parseRemoteIngestRequest
} from '../scripts/lib/execution/backend-contract.mjs';
import { runLocalIngestion } from '../scripts/lib/execution/local-backend.mjs';
import {
  createRemoteIngestPlan,
  REMOTE_INGEST_RUN_POINTER,
  validateRemoteExecutionEnvelope
} from '../scripts/lib/execution/remote-backend.mjs';

test('remote request contract accepts only resolve over HTTP(S)', () => {
  const request = createRemoteIngestRequest({
    requestId: '20260815-abcdef12',
    url: 'https://www.threads.com/share/BAhr4lFBi8/'
  });
  assert.equal(request.schema_version, 1);
  assert.equal(request.operation, 'resolve');
  assert.equal(request.request_id, '20260815-abcdef12');
  assert.equal(request.url, 'https://www.threads.com/share/BAhr4lFBi8/');
  assert.deepEqual(parseRemoteIngestRequest(JSON.stringify(request)), request);
  assert.throws(() => createRemoteIngestRequest({ requestId: '20260815-abcdef12', url: 'file:///tmp/a' }), /HTTP or HTTPS/);
  assert.throws(() => createRemoteIngestRequest({ requestId: '20260815-abcdef12', url: 'https://example.com', operation: 'shell' }), /Unsupported/);
});

test('remote resolve request may carry a digest-bound agent semantic judgement', () => {
  const semanticHandoff = {
    schema_version: 1,
    producer: 'knowledge_card_agent',
    evidence_digest: `sha256:${'a'.repeat(64)}`,
    judgement: {
      selected_shortcodes: ['PART2'],
      root_only: false,
      confidence: 0.98,
      complete: true,
      rationale: 'direct continuation',
      candidate_labels: [
        { shortcode: 'PART2', label: 'continuation', confidence: 0.99 }
      ]
    }
  };
  const request = createRemoteIngestRequest({
    requestId: '20260815-handoff1',
    url: 'https://www.threads.com/share/BAhr4lFBi8/',
    semanticHandoff
  });
  assert.equal(request.operation, 'resolve');
  assert.equal(request.semantic_handoff.producer, 'knowledge_card_agent');
  assert.equal(request.semantic_handoff.evidence_digest, semanticHandoff.evidence_digest);
  assert.deepEqual(parseRemoteIngestRequest(JSON.stringify(request)), request);
});

test('remote plan uses isolated request branch, run pointer, and one-day artifact identity', () => {
  const plan = createRemoteIngestPlan('https://example.com/article', { requestId: '20260815-1234abcd' });
  assert.equal(plan.backend, 'github_actions');
  assert.equal(plan.protocol, 'request_branch_v1');
  assert.equal(plan.branch, 'runtime/ingest/20260815-1234abcd');
  assert.equal(plan.request_path, '.runtime/requests/20260815-1234abcd.json');
  assert.equal(plan.artifact_name, 'remote-ingest-20260815-1234abcd');
  assert.deepEqual(plan.run_pointer, REMOTE_INGEST_RUN_POINTER);
  assert.equal(plan.run_pointer.mechanism, 'commit_status_v1');
  assert.equal(plan.run_pointer.context, 'remote-ingest/run');
  assert.equal(plan.run_pointer.target, 'request_commit');
  assert.equal(plan.run_pointer.target_url_kind, 'github_actions_run');
});

test('remote workflow publishes a request-commit status pointing at the Actions run', () => {
  const workflow = fs.readFileSync(new URL('../.github/workflows/remote-ingest.yml', import.meta.url), 'utf8');
  assert.match(workflow, /statuses: write/);
  assert.match(workflow, /context='remote-ingest\/run'/);
  assert.match(workflow, /github\.run_id/);
  assert.match(workflow, /statuses\/\$\{REQUEST_SHA\}/);
  assert.match(workflow, /Publish remote ingestion final status/);
  assert.match(workflow, /status_published/);
});

test('remote workflow exposes a trusted PR fallback when push correlation is unavailable', () => {
  const workflow = fs.readFileSync(new URL('../.github/workflows/remote-ingest.yml', import.meta.url), 'utf8');
  assert.match(workflow, /pull_request_target:/);
  assert.match(workflow, /runtime\/ingest\/\*/);
  assert.match(workflow, /head\.repo\.full_name/);
  assert.match(workflow, /compare\/main\.\.\.\$\{REQUEST_SHA\}/);
  assert.match(workflow, /differs from main by exactly one request JSON file/);
  assert.match(workflow, /Preserve undiscoverable push request for PR fallback/);
  assert.match(workflow, /Close transport PR/);
});

test('remote workflow installs trusted dependencies before request metadata validation', () => {
  const workflow = fs.readFileSync(new URL('../.github/workflows/remote-ingest.yml', import.meta.url), 'utf8');
  const installIndex = workflow.indexOf('- name: Install trusted dependencies');
  const validateIndex = workflow.indexOf('- name: Validate request metadata');
  assert.ok(installIndex >= 0, 'trusted dependency install step must exist');
  assert.ok(validateIndex > installIndex, 'request metadata validation must run after trusted dependencies are installed');
});

test('local backend preserves normal resolver result envelope', async () => {
  const envelope = await runLocalIngestion('https://example.com', {
    prepareImpl: async (url) => ({ canonical_url: url, source_identity: `url:${url}`, mode: 'create' })
  });
  assert.equal(envelope.execution.backend, 'local');
  assert.equal(envelope.execution.status, 'success');
  assert.equal(envelope.result.canonical_url, 'https://example.com');
});

test('missing local browser capability is routed as local execution unavailable', async () => {
  const envelope = await runLocalIngestion('https://www.threads.com/share/test/', {
    prepareImpl: async () => {
      const error = new Error('Chromium is unavailable');
      error.code = 'THREADS_BROWSER_UNAVAILABLE';
      throw error;
    }
  });
  assert.equal(envelope.execution.status, 'failure');
  assert.equal(envelope.failure.classification, 'LOCAL_EXECUTION_UNAVAILABLE');
  assert.equal(envelope.failure.retry_remote, true);
});

test('provider completeness failure remains source incomplete instead of runtime failure', () => {
  const error = new Error('thread incomplete');
  error.code = 'THREADS_PRIMARY_SOURCE_INCOMPLETE';
  const failure = classifyIngestionFailure(error, { backend: 'local' });
  assert.equal(failure.classification, 'SOURCE_INCOMPLETE');
  assert.equal(failure.retry_remote, false);
});

test('nested generic ranker failure remains observable without replacing provider classification', () => {
  const rankerError = new Error('Threads continuation LLM returned HTTP 403.');
  rankerError.code = 'THREADS_CONTINUATION_LLM_HTTP_ERROR';
  const error = new Error('Threads conversation is not complete: INCOMPLETE_THREAD (continuation_ranker_failed).');
  error.code = 'THREADS_CONVERSATION_INCOMPLETE';
  error.cause = rankerError;

  const failure = classifyIngestionFailure(error, { backend: 'remote' });
  assert.equal(failure.classification, 'SOURCE_INCOMPLETE');
  assert.equal(failure.code, 'THREADS_CONVERSATION_INCOMPLETE');
  assert.equal(failure.cause_code, 'THREADS_CONTINUATION_LLM_HTTP_ERROR');
  assert.equal(failure.cause_message, 'Threads continuation LLM returned HTTP 403.');
});

test('managed Copilot policy denial is a remote execution failure, not source incompleteness', () => {
  const rankerError = new Error('GitHub Copilot CLI access denied by organization policy.');
  rankerError.code = 'THREADS_CONTINUATION_COPILOT_POLICY_DENIED';
  const error = new Error('Threads conversation is not complete: INCOMPLETE_THREAD (continuation_ranker_failed).');
  error.code = 'THREADS_CONVERSATION_INCOMPLETE';
  error.cause = rankerError;

  const failure = classifyIngestionFailure(error, { backend: 'remote' });
  assert.equal(failure.classification, 'REMOTE_EXECUTION_UNAVAILABLE');
  assert.equal(failure.code, 'THREADS_CONVERSATION_INCOMPLETE');
  assert.equal(failure.cause_code, 'THREADS_CONTINUATION_COPILOT_POLICY_DENIED');
  assert.equal(failure.retry_remote, false);
});

test('remote result validator rejects mismatched request identity', () => {
  const request = createRemoteIngestRequest({ requestId: '20260815-abcdef12', url: 'https://example.com' });
  const envelope = {
    schema_version: 1,
    request_id: '20260815-deadbeef',
    execution: { backend: 'github_actions', status: 'success' },
    result: {}
  };
  assert.throws(() => validateRemoteExecutionEnvelope(envelope, request), /request_id mismatch/);
});
