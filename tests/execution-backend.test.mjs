import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyIngestionFailure,
  createRemoteIngestRequest,
  parseRemoteIngestRequest
} from '../scripts/lib/execution/backend-contract.mjs';
import { runLocalIngestion } from '../scripts/lib/execution/local-backend.mjs';
import { createRemoteIngestPlan, validateRemoteExecutionEnvelope } from '../scripts/lib/execution/remote-backend.mjs';

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

test('remote plan uses isolated request branch and one-day artifact identity', () => {
  const plan = createRemoteIngestPlan('https://example.com/article', { requestId: '20260815-1234abcd' });
  assert.equal(plan.backend, 'github_actions');
  assert.equal(plan.protocol, 'request_branch_v1');
  assert.equal(plan.branch, 'runtime/ingest/20260815-1234abcd');
  assert.equal(plan.request_path, '.runtime/requests/20260815-1234abcd.json');
  assert.equal(plan.artifact_name, 'remote-ingest-20260815-1234abcd');
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
