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

Transient share/short URLs are resolved before source extraction. Resolution uses HTTP redirects and Threads HTML canonical/embedded post URLs, with an injectable browser resolver as fallback.

## Phase 2 — exact single-post extraction

The single-post extractor reads Threads public HTML hydration JSON and selects the exact requested shortcode. It normalizes author, text, timestamp, media, reply/root metadata, quoted/reposted post information, and extraction provenance. API/browser post adapters are optional fallbacks and must return the requested shortcode or fail closed.

## Phase 3 — complete self-thread reconstruction

Run:

```bash
npm run ingest:extract -- <threads-url>
```

The command now performs Phase 1 URL resolution, Phase 2 exact-post extraction, then Phase 3 conversation reconstruction.

### Conversation graph

All post-like objects found in hydration JSON are normalized and indexed by post ID / shortcode. Reply edges are created from `reply_to`. If the shared post is a reply, the resolver uses `root_post` when available or walks `reply_to` parents until the root is found.

### Author-chain rule

The article body is not "all replies by the same username". The self-thread chain advances only when a candidate:

```text
same author
AND reply_to == previous post
AND same root (when root metadata exists)
```

Reader replies are excluded. Timestamp proximity is not sufficient evidence. If one post has multiple same-author direct continuations and a unique structured part index cannot disambiguate them, the result is `AMBIGUOUS_THREAD`.

### n/N completeness check

The adapter may obtain `n/N` from rendered HTML text, structured payload hints, or an injected API/browser conversation adapter. When `N` is known:

```text
parts.length must equal N
input part position must equal n
```

Missing parts produce `INCOMPLETE_THREAD`; conflicts produce `AMBIGUOUS_THREAD`. The extractor fails closed by default when `thread.complete` is false.

### Fallback adapters

Core repository code remains credential- and browser-library-neutral. Optional adapters can provide the full conversation:

```text
public HTML hydration
  → API conversation adapter
  → browser / GraphQL conversation adapter
```

A conversation adapter may return:

```json
{
  "posts": [],
  "thread_indicator": { "index": 2, "total": 3 },
  "complete": true
}
```

`complete: true` means the adapter has authoritative coverage of the relevant conversation, not merely that one HTTP request succeeded.

### Normalized complete source

Successful multi-part output contains:

```text
provider
canonical_url              # root permalink
source_identity            # threads:{root_shortcode}
root_post_id
root_shortcode
author
input_post.index
thread.status
thread.total
thread.detected_parts
thread.complete
thread.confidence
parts[]
combined_text
extraction.conversation_complete
```

`parts[]` preserves each original post and its media/provenance. `combined_text` is the ordered full article text used by Knowledge Card analysis.

### Root-level identity and deduplication

Threads canonical post URLs now canonicalize to:

```text
source.identity = threads:{shortcode}
```

After Phase 3, the final `canonical_url` is the root post URL. Therefore a share link or any middle/last part of the same self-thread resolves to the root shortcode before create/update detection. `npm run ingest:extract` outputs an `ingestion` object based on that root URL.

### Status model

```text
SINGLE_POST          confirmed single post
COMPLETE_THREAD      complete deterministic self-thread
INCOMPLETE_THREAD    root/parts/coverage missing
AMBIGUOUS_THREAD     author branch or indicator conflict
```

Only `SINGLE_POST` and `COMPLETE_THREAD` with `thread.complete: true` are eligible as formal Knowledge Card primary sources.

## Test strategy

CI fixtures cover root/middle-part input, reader-reply exclusion, same-author branching, UI `n/N`, missing-part rejection, browser conversation fallback, share-link-to-root resolution, and root-level Threads identity canonicalization. Live Threads availability is not required for deterministic tests.
