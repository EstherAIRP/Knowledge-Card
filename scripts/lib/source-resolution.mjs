import { classifyThreadsUrl, resolveThreadsUrl } from './sources/threads/resolve-url.mjs';

function mergedThreadsOptions(options) {
  return options.threads ? { ...options, ...options.threads } : options;
}

export async function resolveExternalSourceUrl(rawUrl, options = {}) {
  const threads = classifyThreadsUrl(rawUrl);
  if (threads.isThreads) {
    return resolveThreadsUrl(rawUrl, mergedThreadsOptions(options));
  }

  return {
    provider: null,
    input_url: rawUrl,
    input_kind: 'direct',
    canonical_url: rawUrl,
    method: 'direct',
    transient: false,
    redirect_count: 0
  };
}
