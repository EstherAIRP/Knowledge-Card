import { createEnvThreadsContinuationRanker } from '../sources/threads/continuation-recovery.mjs';

export const GITHUB_MODELS_CHAT_ENDPOINT = 'https://models.github.ai/inference/chat/completions';
export const DEFAULT_THREADS_CONTINUATION_GITHUB_MODEL = 'openai/gpt-4.1';

function managedFetch(fetchImpl) {
  return async (url, init = {}) => {
    const body = JSON.parse(init.body || '{}');
    return fetchImpl(url, {
      ...init,
      headers: {
        accept: 'application/vnd.github+json',
        ...(init.headers || {})
      },
      body: JSON.stringify({
        ...body,
        response_format: { type: 'json_object' }
      })
    });
  };
}

export function createGitHubModelsThreadsContinuationRanker(options = {}) {
  const token = options.token ?? process.env.GITHUB_TOKEN ?? null;
  const model = options.model
    || process.env.THREADS_CONTINUATION_GITHUB_MODEL
    || DEFAULT_THREADS_CONTINUATION_GITHUB_MODEL;
  const fetchImpl = options.fetchImpl || globalThis.fetch;

  if (!token || typeof fetchImpl !== 'function') return null;

  const baseRanker = createEnvThreadsContinuationRanker({
    llmEndpoint: GITHUB_MODELS_CHAT_ENDPOINT,
    llmModel: model,
    llmApiKey: token,
    llmFetchImpl: managedFetch(fetchImpl)
  });
  if (typeof baseRanker !== 'function') return null;

  return async (input) => {
    const judgement = await baseRanker(input);
    return {
      ...judgement,
      _ranker: {
        method: 'github_models_chat',
        provider: 'github_models',
        model
      }
    };
  };
}
