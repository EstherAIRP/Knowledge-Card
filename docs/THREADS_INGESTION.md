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

## Phase 6 — source snapshots and change detection

Phase 6 adds persistent, machine-owned source state so a later submission of the same root thread can distinguish a re-check from a material source change.

`npm run ingest:resolve -- <threads-url>` still performs the full Phase 1–5 source reconstruction first. Only after a complete normalized source exists does it build an in-memory fingerprint and compare it with the last accepted snapshot under `state/source-snapshots/threads/`.

The resolver exposes a `source_change` contract when repository source state is available:

```text
FIRST_SEEN
UNCHANGED
THREAD_EXTENDED
PART_CHANGED
PART_REMOVED
STRUCTURE_CHANGED
MULTIPLE_CHANGES
```

`FIRST_SEEN` means no baseline exists yet; it is not evidence that the public source changed. `UNCHANGED` means the normalized accepted source fingerprint matches. All other statuses are material and include structured `added_parts`, `removed_parts`, `changed_parts`, totals and order-change evidence.

### Fingerprint policy

Snapshots deliberately do **not** archive raw Threads body text or raw GraphQL payloads. They persist public provenance plus SHA-256 fingerprints:

```text
source identity / root canonical URL
root post id / shortcode / author
part order, ids, shortcodes, canonical URLs
reply/root structure
text hash
media hash
reference/link/alt-text hash
source hash
```

Media CDN query signatures are excluded from the media identity fingerprint because they are volatile and should not trigger false updates.

### Update semantics

An unchanged prefix with one or more new suffix parts is `THREAD_EXTENDED`. A text/media/reference/structure fingerprint change on an existing part is `PART_CHANGED`. Missing previously accepted parts are `PART_REMOVED`. Reordering/insertion without a simple append is `STRUCTURE_CHANGED`; combined signals are `MULTIPLE_CHANGES`.

This status is advisory for Knowledge Card refresh policy, but it never weakens source completeness. A current source must still pass the Phase 3/4 completeness and identity gates before comparison.

### Advancing the accepted baseline

Preflight is read-only. It must never advance source state automatically.

After the corresponding Knowledge Card create/update has been written and repository validation succeeds, run:

```bash
npm run ingest:snapshot -- <threads-url>
```

The snapshot command reruns the complete source preflight, requires that a matching Knowledge Card already exists, and only then writes the accepted fingerprint. If the source hash is unchanged it performs a no-op and preserves the prior `captured_at` value.

Therefore the normal Threads update sequence is:

```text
ingest:resolve
→ inspect source_change
→ create/update Knowledge Card if needed
→ validate Card / ownership
→ ingest:snapshot
→ commit Card + changed snapshot
```

Failed, incomplete, ambiguous or identity-mismatched source extraction never overwrites the last accepted snapshot.

## Test strategy

CI fixtures cover URL variants, exact-post selection, root/middle/last input, reader reply exclusion, same-author branches, `n/N`, missing-part rejection, root identity, mandatory resolver root dedup, non-Threads compatibility, browser GraphQL capture, JS-only share navigation, sparse-HTML recovery, unsafe browser redirects, deterministic source hashing, volatile media-signature suppression, append-only extension detection, edited/removed parts, snapshot no-op behavior and mandatory-preflight change reporting. Browser fixture tests use an injected session factory, so CI does not require downloading Chromium merely to validate adapter logic.
