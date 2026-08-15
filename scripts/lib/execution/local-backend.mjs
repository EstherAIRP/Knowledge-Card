import path from 'node:path';
import { prepareExternalIngestion } from '../source-ingestion.mjs';
import { classifyIngestionFailure, createExecutionEnvelope } from './backend-contract.mjs';

export async function runLocalIngestion(rawUrl, options = {}) {
  const startedAt = new Date().toISOString();
  const prepareImpl = options.prepareImpl || prepareExternalIngestion;
  const contentRoot = options.contentRoot || path.resolve('content/knowledge');

  try {
    const result = await prepareImpl(rawUrl, contentRoot, options.ingestionOptions || {});
    return createExecutionEnvelope({
      backend: 'local',
      status: 'success',
      result,
      startedAt
    });
  } catch (error) {
    return createExecutionEnvelope({
      backend: 'local',
      status: 'failure',
      failure: classifyIngestionFailure(error, { backend: 'local' }),
      startedAt
    });
  }
}
