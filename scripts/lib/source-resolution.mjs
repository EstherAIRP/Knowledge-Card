import { classifyThreadsUrl, resolveThreadsUrl } from './sources/threads/resolve-url.mjs';

export async function resolveExternalSourceUrl(rawUrl, options = {}) {
  const threads = classifyThreadsUrl(rawUrl);
  if (threads.isThreads) {
    return resolveThreadsUrl(rawUrl, options.threads || options);
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
