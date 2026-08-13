import { resolveExternalSourceUrl } from './source-resolution.mjs';
import { extractResolvedThreadsPost } from './sources/threads/extract-post.mjs';
import { extractResolvedThreadsConversation } from './sources/threads/conversation.mjs';
import {
  extractThreadsViaBrowser,
  shouldAutoThreadsBrowserFallback
} from './sources/threads/browser-adapter.mjs';

function mergedThreadsOptions(options) {
  return options.threads ? { ...options, ...options.threads } : { ...options };
}

function withDefaultThreadsBrowserExtractors(canonicalUrl, options) {
  const threadsOptions = { ...options };
  const needsPostAdapter = typeof threadsOptions.browserExtractor !== 'function';
  const needsConversationAdapter = typeof threadsOptions.browserConversationExtractor !== 'function';
  if ((!needsPostAdapter && !needsConversationAdapter) || !shouldAutoThreadsBrowserFallback(threadsOptions)) {
    return threadsOptions;
  }

  let browserResultPromise = null;
  const getBrowserResult = () => {
    browserResultPromise ||= extractThreadsViaBrowser(canonicalUrl, threadsOptions);
    return browserResultPromise;
  };

  if (needsPostAdapter) {
    threadsOptions.browserExtractor = async ({ shortcode }) => {
      const result = await getBrowserResult();
      return result.posts.find((post) => post?.shortcode === shortcode) || null;
    };
  }
  if (needsConversationAdapter) {
    threadsOptions.browserConversationExtractor = async () => getBrowserResult();
  }

  return threadsOptions;
}

export async function extractExternalSource(rawUrl, options = {}) {
  const resolution = options.resolution || await resolveExternalSourceUrl(rawUrl, options);

  if (resolution.provider === 'threads') {
    const merged = mergedThreadsOptions(options);
    const threadsOptions = withDefaultThreadsBrowserExtractors(resolution.canonical_url, merged);
    const source = threadsOptions.singlePostOnly
      ? await extractResolvedThreadsPost(resolution.canonical_url, threadsOptions)
      : await extractResolvedThreadsConversation(resolution.canonical_url, threadsOptions);
    return { resolution, source };
  }

  const error = new Error(`No source extractor is registered for ${resolution.provider || 'generic web'} URLs.`);
  error.code = 'SOURCE_EXTRACTOR_UNAVAILABLE';
  throw error;
}
