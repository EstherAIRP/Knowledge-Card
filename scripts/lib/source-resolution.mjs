import { classifyThreadsUrl, resolveThreadsUrl } from './sources/threads/resolve-url.mjs';
import {
  resolveThreadsUrlViaBrowser,
  shouldAutoThreadsBrowserFallback
} from './sources/threads/browser-adapter.mjs';

function mergedThreadsOptions(options) {
  return options.threads ? { ...options, ...options.threads } : { ...options };
}

function withDefaultThreadsBrowserResolver(options) {
  const threadsOptions = { ...options };
  if (typeof threadsOptions.browserResolver === 'function') return threadsOptions;
  if (!shouldAutoThreadsBrowserFallback(threadsOptions)) return threadsOptions;
  threadsOptions.browserResolver = async (rawUrl) => resolveThreadsUrlViaBrowser(rawUrl, threadsOptions);
  return threadsOptions;
}

export async function resolveExternalSourceUrl(rawUrl, options = {}) {
  const threads = classifyThreadsUrl(rawUrl);
  if (threads.isThreads) {
    const threadsOptions = withDefaultThreadsBrowserResolver(mergedThreadsOptions(options));
    return resolveThreadsUrl(rawUrl, threadsOptions);
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
