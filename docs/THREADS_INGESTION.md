# Threads Source Ingestion

This document records the source-adapter contract for Threads ingestion.

## Phase 1 — URL resolution

Accepted URL families include `/share/<token>`, `/t/<token>`, `/@user/post/<shortcode>` and threads.net variants. Transient URLs are resolved through HTTP redirect / HTML canonical or embedded URLs, with browser fallback when the share layer only resolves after JavaScript navigation.

## Phase 2 — exact single-post extraction

The extractor reads public HTML hydration JSON and selects the exact requested shortcode. It normalizes author, text, timestamp, media, reply/root metadata, quoted/reposted information and extraction provenance. API/browser post adapters must return the requested shortcode or fail closed.

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

`npm run ingest:resolve -- <threads-url>` is the mandatory end-to-end preflight, not only a URL normalizer.

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

## Phase 5 — Playwright browser / Threads web-data fallback

Phase 5 closes the JS-only source gap. The core ingestion path still tries HTTP and public hydration first; when normal live ingestion cannot resolve or reconstruct the source, it can launch an isolated Playwright browser and reuse the same Phase 2–4 contracts.

### Installation

The JavaScript dependency is installed by normal `npm install`. Playwright browser binaries are installed separately:

```bash
npm run threads:browser:install
```

The default launcher first tries Playwright's bundled Chromium. If that browser binary is unavailable it also tries the installed Chrome channel. Explicit configuration is available through:

```text
THREADS_BROWSER_EXECUTABLE=/absolute/path/to/browser
THREADS_BROWSER_CHANNEL=chrome
```

The browser context is anonymous and isolated: the adapter does not load a persistent user profile, login cookies or private session state.

### URL fallback

For a JS-only `/share/*` or `/t/*` URL:

```text
HTTP redirect / metadata fails
→ launch browser
→ navigate share URL
→ inspect final page URL
→ inspect rendered canonical / og:url metadata
→ require a Threads /@user/post/<shortcode> result
```

Navigation that leaves threads.com / threads.net fails with `THREADS_BROWSER_UNSAFE_REDIRECT`.

### Web-data extraction

For a canonical post whose initial HTML is sparse, the browser adapter observes two evidence channels:

1. rendered DOM / hydration scripts after navigation;
2. same-origin Threads JSON responses, including GraphQL-like endpoints.

Captured JSON is not coupled to a hard-coded GraphQL operation name. It is passed through the existing recursive Threads post candidate parser and normalizer, then merged with DOM-derived records. Payload count and payload size are bounded to avoid unbounded memory growth.

The adapter returns normalized posts and a rendered `n/N` indicator when unambiguous. It deliberately reports `complete: false`: browser navigation success is **not** completeness evidence by itself. Phase 3 must still prove completeness using the reply graph, root traversal, terminal reply state or `n/N` agreement.

### Automatic fallback policy

Normal live CLI ingestion has browser fallback available automatically when no custom fixture transport is supplied. Tests or callers that inject `fetchImpl` / static HTML remain deterministic by default. They can explicitly enable the browser path with:

```js
{ browserFallback: true }
```

or inject a deterministic browser implementation through `browserSessionFactory`.

### Browser failure modes

- `THREADS_BROWSER_UNAVAILABLE` — Playwright package cannot be loaded.
- `THREADS_BROWSER_LAUNCH_FAILED` — neither configured/bundled Chromium nor Chrome can launch.
- `THREADS_BROWSER_NAVIGATION_FAILED` — page navigation failed.
- `THREADS_BROWSER_UNSAFE_REDIRECT` — navigation left an allowed Threads host.
- `THREADS_BROWSER_CANONICAL_NOT_FOUND` — rendered share page still exposes no canonical post.
- `THREADS_BROWSER_NO_POSTS` — page rendered but DOM/captured JSON exposed no verifiable post objects.

All browser failures remain fail closed. They never downgrade the primary-source completeness requirement.

## Test strategy

CI fixtures cover URL variants, exact-post selection, root/middle/last input, reader reply exclusion, same-author branches, `n/N`, missing-part rejection, root identity, mandatory resolver root dedup, non-Threads compatibility, browser GraphQL capture, JS-only share navigation, sparse-HTML recovery and unsafe browser redirects. Browser fixture tests use an injected session factory, so CI does not require downloading Chromium merely to validate adapter logic.
