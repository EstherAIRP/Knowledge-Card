# Threads Source Ingestion

This document records the source-adapter contract for Threads ingestion.

## Phase 1 — URL resolution

Accepted URL families include `/share/<token>`, `/t/<token>`, `/@user/post/<shortcode>` and threads.net variants. Transient URLs are resolved through HTTP redirect / HTML canonical or embedded URLs, with an injectable browser resolver fallback.

## Phase 2 — exact single-post extraction

The extractor reads public HTML hydration JSON and selects the exact requested shortcode. It normalizes author, text, timestamp, media, reply/root metadata, quoted/reposted information and extraction provenance. API/browser post adapters are optional fallbacks and must return the requested shortcode or fail closed.

## Phase 3 — complete self-thread reconstruction

`npm run ingest:extract -- <threads-url>` builds a conversation graph, resolves the root and reconstructs only the deterministic author chain:

```text
same author
AND reply_to == previous post
AND same root (when root metadata exists)
```

Reader replies are excluded. Timestamp proximity is not evidence. Same-author branching without a unique part index yields `AMBIGUOUS_THREAD`.

When `n/N` is available from rendered text, structured hints or an API/browser conversation adapter, `parts.length == N` and the input part position must match `n`. Missing parts yield `INCOMPLETE_THREAD`. The extractor fails closed by default unless `thread.complete: true`.

Successful output preserves `parts[]`, ordered `combined_text`, root/input metadata, media and extraction provenance. Root identity is `threads:{root_shortcode}`.

## Phase 4 — Knowledge Card integration

`npm run ingest:resolve -- <threads-url>` is now the mandatory end-to-end preflight, not only a URL normalizer.

For Threads it performs:

```text
input/share/middle post
→ Phase 1 URL resolution
→ Phase 2 exact post extraction
→ Phase 3 complete conversation reconstruction
→ verify thread.complete + conversation_complete
→ verify root canonical URL ↔ source_identity consistency
→ Knowledge Card dedup/create-update resolution
```

The returned contract contains the normal Knowledge Card resolver fields plus:

```text
source_document
  canonical_url
  source_identity
  thread
  parts[]
  combined_text
  extraction

analysis_input
  provider: threads
  text_field: source_document.combined_text
  media_field: source_document.parts[].media
  complete: true
```

The agent must analyze `source_document.combined_text`, not the originally shared single post. `parts[]` remains the provenance record.

### Root-level deduplication

A share link or any part of the same self-thread is resolved before deduplication. Existing-card lookup therefore uses the root canonical URL / `threads:{root_shortcode}` and preserves the original Card id/path on updates.

### Fail-closed conditions

Formal Knowledge Card ingestion stops on:

- `THREADS_CONVERSATION_INCOMPLETE`
- `THREADS_CONVERSATION_AMBIGUOUS`
- `THREADS_PRIMARY_SOURCE_INCOMPLETE`
- `THREADS_PRIMARY_SOURCE_INVALID`
- `EXTRACTED_SOURCE_IDENTITY_MISMATCH`

No incomplete source may reach create/update resolution.

## Fallback boundary

Core code remains credential- and browser-library-neutral. Optional API/browser conversation adapters can supply authoritative conversation coverage. A later browser/GraphQL implementation can plug into the existing adapter contract without changing Knowledge Card identity/dedup logic.

## Test strategy

CI fixtures cover URL variants, exact-post selection, root/middle/last input, reader reply exclusion, same-author branches, `n/N`, missing-part rejection, adapter fallback, root identity, Phase 2 backward compatibility, mandatory resolver root dedup and non-Threads compatibility.
