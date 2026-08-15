import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { prepareExternalIngestion } from './lib/source-ingestion.mjs';
import {
  classifyIngestionFailure,
  createExecutionEnvelope,
  parseRemoteIngestRequest
} from './lib/execution/backend-contract.mjs';

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

let envelope;
try {
  const contentRoot = path.resolve('content/knowledge');
  const result = await prepareExternalIngestion(request.url, contentRoot);
  envelope = createExecutionEnvelope({
    backend: 'github_actions',
    requestId: request.request_id,
    status: 'success',
    result,
    startedAt,
    metadata: {
      operation: request.operation,
      runner: 'remote-ingest-v1'
    }
  });
} catch (error) {
  envelope = createExecutionEnvelope({
    backend: 'github_actions',
    requestId: request.request_id,
    status: 'failure',
    failure: classifyIngestionFailure(error, { backend: 'remote' }),
    startedAt,
    metadata: {
      operation: request.operation,
      runner: 'remote-ingest-v1'
    }
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
  result_path: resultPath
}));
