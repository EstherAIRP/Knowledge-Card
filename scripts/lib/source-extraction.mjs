import { resolveExternalSourceUrl } from './source-resolution.mjs';
import { extractResolvedThreadsPost } from './sources/threads/extract-post.mjs';
import { extractResolvedThreadsConversation } from './sources/threads/conversation.mjs';

function mergedThreadsOptions(options) {
  return options.threads ? { ...options, ...options.threads } : options;
}

export async function extractExternalSource(rawUrl, options = {}) {
  const resolution = options.resolution || await resolveExternalSourceUrl(rawUrl, options);

  if (resolution.provider === 'threads') {
    const threadsOptions = mergedThreadsOptions(options);
    const source = threadsOptions.singlePostOnly
      ? await extractResolvedThreadsPost(resolution.canonical_url, threadsOptions)
      : await extractResolvedThreadsConversation(resolution.canonical_url, threadsOptions);
    return { resolution, source };
  }

  const error = new Error(`No source extractor is registered for ${resolution.provider || 'generic web'} URLs.`);
  error.code = 'SOURCE_EXTRACTOR_UNAVAILABLE';
  throw error;
}
