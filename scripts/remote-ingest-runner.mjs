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
import {
  createThreadsSemanticHandoffCaptureRanker,
  createThreadsSemanticHandoffRanker
} from './lib/execution/semantic-handoff.mjs';

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
const copilotRanker = createCopilotCliThreadsContinuationRanker({
  model: continuationModel
});
const continuationRanker = request.semantic_handoff
  ? createThreadsSemanticHandoffRanker(request.semantic_handoff)
  : copilotRanker;
const contentRoot = fileURLToPath(new URL('../content/knowledge/', import.meta.url));

function executionMetadata({ handoffAvailable = false } = {}) {
  const handoffMode = Boolean(request.semantic_handoff);
  return {
    operation: request.operation,
    runner: 'remote-ingest-v4',
    managed_ranker: handoffMode
      ? 'agent_semantic_handoff'
      : continuationRanker ? 'github_copilot_cli' : 'unavailable',
    managed_ranker_model: handoffMode
      ? null
      : continuationRanker ? continuationModel : null,
    semantic_handoff_submitted: handoffMode,
    semantic_handoff_available: handoffAvailable
  };
}

function findSemanticHandoff(error) {
  let current = error;
  for (let depth = 0; current && depth < 5; depth += 1) {
    if (current.semantic_handoff) return current.semantic_handoff;
    if (!current.cause || current.cause === current) break;
    current = current.cause;
  }
  return null;
}

async function captureSemanticHandoff() {
  const captureRanker = createThreadsSemanticHandoffCaptureRanker();
  try {
    await prepareExternalIngestion(request.url, contentRoot, {
      continuationRanker: captureRanker
    });
  } catch (error) {
    return findSemanticHandoff(error);
  }
  return null;
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
  const failure = classifyIngestionFailure(error, { backend: 'remote' });
  let semanticHandoff = null;

  if (!request.semantic_handoff && failure.classification === 'REMOTE_EXECUTION_UNAVAILABLE') {
    semanticHandoff = await captureSemanticHandoff();
    if (semanticHandoff) failure.semantic_handoff = semanticHandoff;
  }

  envelope = createExecutionEnvelope({
    backend: 'github_actions',
    requestId: request.request_id,
    status: 'failure',
    failure,
    startedAt,
    metadata: executionMetadata({ handoffAvailable: Boolean(semanticHandoff) })
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
  semantic_handoff_available: envelope.execution.metadata?.semantic_handoff_available || false,
  result_path: resultPath
}));
