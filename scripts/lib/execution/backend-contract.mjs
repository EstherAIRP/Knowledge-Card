import crypto from 'node:crypto';

export const EXECUTION_RESULT_SCHEMA_VERSION = 1;
export const REMOTE_INGEST_REQUEST_SCHEMA_VERSION = 1;
export const REMOTE_INGEST_OPERATION = 'resolve';

const REQUEST_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{5,79}$/;

export function normalizeIngestUrl(value) {
  let parsed;
  try {
    parsed = new URL(String(value || '').trim());
  } catch {
    const error = new Error('Remote ingestion URL must be an absolute HTTP(S) URL.');
    error.code = 'REMOTE_INGEST_REQUEST_INVALID_URL';
    throw error;
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    const error = new Error('Remote ingestion URL must use HTTP or HTTPS.');
    error.code = 'REMOTE_INGEST_REQUEST_INVALID_URL';
    throw error;
  }
  return parsed.toString();
}

export function createRequestId(now = new Date(), randomBytes = crypto.randomBytes) {
  const stamp = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14).toLowerCase();
  const suffix = randomBytes(4).toString('hex');
  return `${stamp}-${suffix}`;
}

export function assertRequestId(value) {
  const requestId = String(value || '').trim().toLowerCase();
  if (!REQUEST_ID_PATTERN.test(requestId)) {
    const error = new Error('Remote ingestion request_id must be 6-80 lowercase URL-safe characters.');
    error.code = 'REMOTE_INGEST_REQUEST_INVALID_ID';
    throw error;
  }
  return requestId;
}

export function createRemoteIngestRequest({ requestId, url, operation = REMOTE_INGEST_OPERATION } = {}) {
  if (operation !== REMOTE_INGEST_OPERATION) {
    const error = new Error(`Unsupported remote ingestion operation: ${operation}`);
    error.code = 'REMOTE_INGEST_REQUEST_UNSUPPORTED_OPERATION';
    throw error;
  }
  return {
    schema_version: REMOTE_INGEST_REQUEST_SCHEMA_VERSION,
    request_id: assertRequestId(requestId || createRequestId()),
    operation,
    url: normalizeIngestUrl(url)
  };
}

export function parseRemoteIngestRequest(value) {
  const request = typeof value === 'string' ? JSON.parse(value) : value;
  if (!request || request.schema_version !== REMOTE_INGEST_REQUEST_SCHEMA_VERSION) {
    const error = new Error(`Unsupported remote ingestion request schema_version: ${request?.schema_version ?? 'missing'}`);
    error.code = 'REMOTE_INGEST_REQUEST_INVALID_SCHEMA';
    throw error;
  }
  return createRemoteIngestRequest({
    requestId: request.request_id,
    operation: request.operation,
    url: request.url
  });
}

function errorCode(error) {
  return error?.code || error?.cause?.code || null;
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error || 'Unknown ingestion failure');
}

function directCause(error) {
  const cause = error?.cause;
  if (!cause || cause === error) return null;
  return {
    code: cause?.code || null,
    message: errorMessage(cause)
  };
}

const SOURCE_INCOMPLETE_CODES = new Set([
  'THREADS_CONVERSATION_INCOMPLETE',
  'THREADS_CONVERSATION_AMBIGUOUS',
  'THREADS_PRIMARY_SOURCE_INCOMPLETE',
  'THREADS_PRIMARY_SOURCE_INVALID',
  'EXTRACTED_SOURCE_IDENTITY_MISMATCH'
]);

const LOCAL_CAPABILITY_CODES = new Set([
  'THREADS_BROWSER_UNAVAILABLE',
  'THREADS_BROWSER_LAUNCH_FAILED',
  'ERR_MODULE_NOT_FOUND',
  'ENOTFOUND',
  'EAI_AGAIN',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT'
]);

const REMOTE_CAPABILITY_CODES = new Set([
  'THREADS_BROWSER_UNAVAILABLE',
  'THREADS_BROWSER_LAUNCH_FAILED',
  'ERR_MODULE_NOT_FOUND',
  'THREADS_CONTINUATION_COPILOT_UNAVAILABLE',
  'THREADS_CONTINUATION_COPILOT_POLICY_DENIED',
  'THREADS_CONTINUATION_COPILOT_FAILED',
  'THREADS_CONTINUATION_COPILOT_TIMEOUT',
  'THREADS_CONTINUATION_COPILOT_OUTPUT_LIMIT',
  'THREADS_CONTINUATION_COPILOT_INVALID_RESPONSE'
]);

export function classifyIngestionFailure(error, { backend = 'local' } = {}) {
  const code = errorCode(error);
  const cause = directCause(error);
  let classification = 'SOURCE_EXTRACTION_FAILED';

  if (backend === 'remote' && (REMOTE_CAPABILITY_CODES.has(code) || REMOTE_CAPABILITY_CODES.has(cause?.code))) {
    classification = 'REMOTE_EXECUTION_UNAVAILABLE';
  } else if (SOURCE_INCOMPLETE_CODES.has(code)) {
    classification = 'SOURCE_INCOMPLETE';
  } else if (backend === 'local' && LOCAL_CAPABILITY_CODES.has(code)) {
    classification = 'LOCAL_EXECUTION_UNAVAILABLE';
  }

  return {
    classification,
    code: code || 'SOURCE_RESOLUTION_FAILED',
    message: errorMessage(error),
    ...(cause ? {
      cause_code: cause.code,
      cause_message: cause.message
    } : {}),
    retry_remote: backend === 'local' && classification === 'LOCAL_EXECUTION_UNAVAILABLE'
  };
}

export function createExecutionEnvelope({
  backend,
  requestId = null,
  status,
  result = null,
  failure = null,
  startedAt = null,
  finishedAt = new Date().toISOString(),
  metadata = null
}) {
  if (!['local', 'github_actions'].includes(backend)) {
    throw new Error(`Unsupported execution backend: ${backend}`);
  }
  if (!['success', 'failure'].includes(status)) {
    throw new Error(`Unsupported execution status: ${status}`);
  }
  return {
    schema_version: EXECUTION_RESULT_SCHEMA_VERSION,
    request_id: requestId,
    execution: {
      backend,
      status,
      started_at: startedAt,
      finished_at: finishedAt,
      ...(metadata ? { metadata } : {})
    },
    result: status === 'success' ? result : null,
    failure: status === 'failure' ? failure : null
  };
}
