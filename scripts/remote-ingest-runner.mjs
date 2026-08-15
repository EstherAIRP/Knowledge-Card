import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { prepareExternalIngestion } from './lib/source-ingestion.mjs';
import {
  classifyIngestionFailure,
  createExecutionEnvelope,
  parseRemoteIngestRequest
} from './lib/execution/backend-contract.mjs';
import {
  createCopilotCliThreadsContinuationRanker,
  DEFAULT_THREADS_CONTINUATION_COPILOT_MODEL
} from './lib/execution/copilot-cli-ranker.mjs';

const requestPath = process.argv[2];
const resultPath = process.argv[3] || process.env.REMOTE_INGEST_RESULT_PATH;

if (!requestPath || !resultPath) {
  console.error('Usage: node scripts/remote-ingest-runner.mjs <request.json> <result.json>');
  process.exit(2);
}

const startedAt = new Date().toISOString();
let request;
try {
  request = parseRemoteIngestRequest(await fs.readFile(requestPath, 'utf8'));
} catch (error) {
  console.error(JSON.stringify({
    error: error?.code || 'REMOTE_INGEST_REQUEST_INVALID',
    message: error instanceof Error ? error.message : String(error)
  }));
  process.exit(2);
}

const continuationModel = process.env.THREADS_CONTINUATION_COPILOT_MODEL
  || DEFAULT_THREADS_CONTINUATION_COPILOT_MODEL;
const continuationRanker = createCopilotCliThreadsContinuationRanker({
  model: continuationModel
});
const contentRoot = fileURLToPath(new URL('../content/knowledge/', import.meta.url));

function executionMetadata() {
  return {
    operation: request.operation,
    runner: 'remote-ingest-v3',
    managed_ranker: continuationRanker ? 'github_copilot_cli' : 'unavailable',
    managed_ranker_model: continuationRanker ? continuationModel : null
  };
}

let envelope;
try {
  const result = await prepareExternalIngestion(request.url, contentRoot, {
    continuationRanker
  });
  envelope = createExecutionEnvelope({
    backend: 'github_actions',
    requestId: request.request_id,
    status: 'success',
    result,
    startedAt,
    metadata: executionMetadata()
  });
} catch (error) {
  envelope = createExecutionEnvelope({
    backend: 'github_actions',
    requestId: request.request_id,
    status: 'failure',
    failure: classifyIngestionFailure(error, { backend: 'remote' }),
    startedAt,
    metadata: executionMetadata()
  });
}

await fs.mkdir(path.dirname(resultPath), { recursive: true });
await fs.writeFile(resultPath, `${JSON.stringify(envelope, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  request_id: request.request_id,
  backend: envelope.execution.backend,
  status: envelope.execution.status,
  failure_classification: envelope.failure?.classification || null,
  failure_code: envelope.failure?.code || null,
  cause_code: envelope.failure?.cause_code || null,
  managed_ranker: envelope.execution.metadata?.managed_ranker || null,
  result_path: resultPath
}));
