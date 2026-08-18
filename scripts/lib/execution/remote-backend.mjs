import { createRemoteIngestRequest } from './backend-contract.mjs';

export const REMOTE_INGEST_RUN_POINTER = Object.freeze({
  mechanism: 'commit_status_v1',
  context: 'remote-ingest/run',
  target: 'request_commit',
  target_url_kind: 'github_actions_run'
});

export function createRemoteIngestPlan(rawUrl, options = {}) {
  const request = createRemoteIngestRequest({
    requestId: options.requestId,
    url: rawUrl,
    operation: options.operation
  });
  return {
    backend: 'github_actions',
    protocol: 'request_branch_v1',
    workflow: '.github/workflows/remote-ingest.yml',
    branch: `runtime/ingest/${request.request_id}`,
    request_path: `.runtime/requests/${request.request_id}.json`,
    artifact_name: `remote-ingest-${request.request_id}`,
    run_pointer: { ...REMOTE_INGEST_RUN_POINTER },
    request
  };
}

export function validateRemoteExecutionEnvelope(envelope, request) {
  if (!envelope || envelope.schema_version !== 1) {
    throw new Error('Remote ingestion result has an unsupported schema_version.');
  }
  if (envelope.request_id !== request.request_id) {
    throw new Error(`Remote ingestion result request_id mismatch: expected ${request.request_id}, received ${envelope.request_id || 'missing'}.`);
  }
  if (envelope.execution?.backend !== 'github_actions') {
    throw new Error('Remote ingestion result did not come from github_actions backend.');
  }
  if (!['success', 'failure'].includes(envelope.execution?.status)) {
    throw new Error('Remote ingestion result has an invalid execution status.');
  }
  return envelope;
}
