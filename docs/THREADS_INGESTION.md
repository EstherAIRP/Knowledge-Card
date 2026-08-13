# Threads Source Ingestion

This document records the source-adapter contract for Threads ingestion.

## Phase 1 — URL resolution

Accepted URL families include:

```text
https://threads.com/share/<token>
https://threads.com/t/<token>
https://threads.com/@user/post/<shortcode>
https://threads.net/...
```

Transient share/short URLs are resolved before Knowledge Card canonicalization. Resolution uses HTTP redirects and Threads HTML canonical/embedded post URLs, with an injectable browser resolver as fallback.

```bash
npm run ingest:resolve -- <threads-url>
```

The output must point to a canonical `https://threads.com/@user/post/<shortcode>` URL before later source processing.

## Phase 2 — single-post extraction

Run:

```bash
npm run ingest:extract -- <threads-url>
```

The command first performs Phase 1 URL resolution, then extracts the canonical post into a provider-neutral normalized record. The primary path reads Threads public HTML and recursively inspects JSON hydration payloads for the exact requested shortcode. The extractor does not trust the first post-like object because the page may contain quoted, recommended, or related posts.

Normalized fields include:

```text
provider
canonical_url
id
shortcode
username
text
timestamp
media[]
is_reply
reply_to
root_post
has_replies
quoted_post
reposted_post
link_attachment_url
alt_text
extraction.method
extraction.single_post_complete
extraction.conversation_complete
```

Media normalization handles image, video, and carousel children. A video poster image is retained as `thumbnail_url`, not emitted as a separate media item.

## Extraction fallback contract

The extractor supports injected adapters without adding credentials or browser dependencies to the core repository:

```text
public HTML embedded JSON
  → API adapter (optional)
  → browser extractor (optional)
```

Fallback adapters must return the requested shortcode. A mismatched post fails closed rather than silently ingesting another post from the same page or conversation.

## Completeness boundary

Phase 2 only establishes that the requested **single post** was extracted. It deliberately returns:

```json
{
  "single_post_complete": true,
  "conversation_complete": false
}
```

This is not evidence that an author self-thread is complete. `1/N → N/N` reconstruction, root traversal, conversation graph handling, UI `n/N` cross-checking, and root-level deduplication belong to Phase 3. Until those checks exist, a suspected multi-post Threads article must not be treated as a complete primary source for formal Knowledge Card analysis.

## Test strategy

Unit tests use deterministic HTML/JSON fixtures and injected fetch/API/browser functions. CI must not depend on Threads being reachable at test time. Covered cases include exact-shortcode selection, nested hydration JSON, reply metadata, image/video/carousel normalization, malformed JSON tolerance, API fallback, browser fallback, fail-closed behavior, and share-URL-to-extraction end-to-end flow.
