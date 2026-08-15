# Threads Source Ingestion

This document defines the source-adapter contract for **Threads-only ingestion**.

## Scope

Use this pipeline only when the primary resource is on `threads.com` / `threads.net`, including `/share/<token>`, `/t/<token>`, `/@user/post/<shortcode>`, or a transient URL that resolves to one of those resources.

```text
Threads primary resource → Phase 1–7 source pipeline
anything else             → docs/INGESTION.md generic flow
```

A non-Threads page does not become a Threads source because its text mentions or links to Threads. Phase 8A/8B/8C are execution/harness capabilities around the same Phase 1–7 source semantics; they are not alternate extraction rules.

## Phase 1 — URL resolution

Accepted URL families include `/share/*`, `/t/*`, canonical `/@user/post/*`, and threads.net variants. Transient URLs resolve through HTTP redirect / canonical metadata / embedded URLs, with browser fallback when JavaScript navigation is required.

The final source identity is never the share token. A complete source canonicalizes to its root post.

## Phase 2 — exact post extraction

The extractor selects the exact requested shortcode from public HTML/hydration evidence and normalizes:

- id / shortcode / canonical URL;
- author and timestamp;
- text and media;
- reply/root metadata;
- quoted/reposted references;
- extraction provenance.

API/browser fallback adapters must return the requested post identity or fail closed.

## Phase 3 — complete self-thread reconstruction

Strict reconstruction follows only structural evidence:

```text
same author
AND reply_to == previous post
AND same root when root metadata exists
```

Timestamp proximity alone is not structural proof. Same-author branching that cannot be resolved uniquely is `AMBIGUOUS_THREAD`.

When `n/N` is known, all invariants must agree:

```text
parts.length == N
input index == n
known total/order is consistent
```

Missing parts are `INCOMPLETE_THREAD` and fail closed.

Successful structural reconstruction preserves ordered `parts[]`, `combined_text`, root/input metadata, media, thread status, and extraction provenance. Root identity is `threads:{root_shortcode}`.

## Phase 4 — mandatory Knowledge Card integration

Ordinary agents enter through:

```bash
npm run ingest:dispatch -- <threads-url>
```

Every approved backend ultimately runs the mandatory resolver:

```bash
npm run ingest:resolve -- <threads-url>
```

For Threads the resolver performs:

```text
Phase 1 URL resolution
→ Phase 2 exact post
→ Phase 3 strict graph reconstruction
→ Phase 5 browser evidence when required
→ Phase 7 semantic recovery when eligible
→ require thread.complete + conversation_complete
→ verify root canonical URL ↔ source_identity
→ dedup/create-update
→ Phase 6 accepted-source change comparison
```

Accepted output includes:

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
  thread_verification: structural | llm_assisted
```

Formal analysis uses `source_document.combined_text`, not merely the shared post.

### Root-level deduplication

Any share token or arbitrary thread part must converge to the root canonical URL and `threads:{root_shortcode}` before create/update lookup. Existing Card id/path remain stable.

### Fail-closed conditions

Examples include:

- `THREADS_CONVERSATION_INCOMPLETE`
- `THREADS_CONVERSATION_AMBIGUOUS`
- `THREADS_PRIMARY_SOURCE_INCOMPLETE`
- `THREADS_PRIMARY_SOURCE_INVALID`
- `EXTRACTED_SOURCE_IDENTITY_MISMATCH`
- failed Phase 7 judgement/acceptance gate

No incomplete source may reach formal Card authoring or snapshot advancement.

## Phase 5 — Playwright browser / web-data fallback

When HTTP/hydration evidence is insufficient, an isolated no-login browser may collect:

1. rendered DOM/hydration;
2. same-origin Threads JSON/GraphQL-like responses;
3. rendered `n/N` evidence when unambiguous.

Captured records are normalized and passed back into the same Phase 3/7 logic. Browser navigation success by itself is never completeness proof.

Local browser installation:

```bash
npm run threads:browser:install
```

Optional local overrides:

```text
THREADS_BROWSER_EXECUTABLE=/absolute/path
THREADS_BROWSER_CHANNEL=chrome
```

The browser adapter does not load private cookies, persistent user profiles, or login sessions.

Important failures include:

- `THREADS_BROWSER_UNAVAILABLE`
- `THREADS_BROWSER_LAUNCH_FAILED`
- `THREADS_BROWSER_NAVIGATION_FAILED`
- `THREADS_BROWSER_UNSAFE_REDIRECT`
- `THREADS_BROWSER_CANONICAL_NOT_FOUND`
- `THREADS_BROWSER_NO_POSTS`

Missing local browser capability is an execution-backend problem first; it is not evidence the source itself is unavailable.

## Phase 6 — accepted source snapshots and change detection

Only a complete accepted source may be compared with state under:

```text
state/source-snapshots/threads/
```

Resolver change states:

```text
FIRST_SEEN
UNCHANGED
THREAD_EXTENDED
PART_CHANGED
PART_REMOVED
STRUCTURE_CHANGED
MULTIPLE_CHANGES
```

Snapshots store public provenance and stable SHA-256 fingerprints, not raw Threads text, raw GraphQL payloads, cookies, or sessions. Volatile media query signatures do not define media identity.

Preflight is read-only. After a corresponding Card create/update succeeds and repository validation passes, accepted state may advance with:

```bash
npm run ingest:snapshot -- <threads-url>
```

The command requires a matching Card. Unchanged hashes are a no-op. Failed, incomplete, ambiguous, or identity-mismatched extraction never overwrites the last accepted snapshot.

## Phase 7 — LLM-assisted continuation / root-only recovery

Phase 7 exists for live Threads evidence where the root and same-author reply candidates are visible but native `reply_to` / `root_post` relationships are missing.

It may run only when strict structural evidence does not already prove or disprove completeness and there is no `n/N` conflict, known missing-part condition, or structural same-author branch ambiguity.

### Deterministic candidate filter

Defaults:

```text
same author as root
exclude root
not before root when timestamp is known
exclude explicit is_reply=false
within 24 hours when timestamp is known
max 8 candidates
```

Time distance is only metadata evidence; it can never directly declare a continuation.

### Semantic judgement contract

The ranker receives only the root plus filtered candidates. Threads text is untrusted quoted data: instructions contained inside posts must not be followed.

Allowed labels:

```text
continuation
followup
unrelated
uncertain
```

Structured judgement includes:

```text
selected_shortcodes
root_only
confidence
complete
rationale
candidate_labels
```

### Continuation acceptance gate

Defaults require all of:

```text
complete == true
root_only != true
confidence >= 0.90
selected_shortcodes non-empty + unique
first selected metadata_score >= 0.60
all selected identities exist in captured evidence
same author
no explicit non-reply selected
time order does not regress
```

### Root-only acceptance gate

Defaults require:

```text
complete == true
root_only == true
confidence >= 0.90
selected_shortcodes == []
at least one filtered candidate
candidate_labels covers every candidate exactly once
all labels are followup or unrelated
no continuation / uncertain labels
every label confidence >= 0.90
```

“No continuation found” is not sufficient evidence for root-only acceptance.

### Verification provenance

Accepted inferred multi-part source:

```text
thread.status = INFERRED_THREAD_HIGH_CONFIDENCE
thread.verification = llm_assisted
extraction.method = llm_assisted_continuation
extraction.inferred = true
```

Accepted inferred standalone source:

```text
thread.status = INFERRED_SINGLE_POST_HIGH_CONFIDENCE
thread.verification = llm_assisted
thread.recovery.root_only = true
extraction.method = llm_assisted_root_only
extraction.inferred = true
```

Neither may be described as native Threads parent/root graph verification.

### Local ranker contract

Phase 7 core is provider-neutral. Local callers can inject `continuationRanker` or configure an OpenAI-compatible endpoint:

```text
THREADS_CONTINUATION_LLM_ENDPOINT
# or THREADS_CONTINUATION_LLM_BASE_URL
THREADS_CONTINUATION_LLM_MODEL
THREADS_CONTINUATION_LLM_API_KEY   # optional
```

No usable ranker means fail closed for that backend.

## Phase 8A/8B — execution routing and permanent Remote Ingest

Threads source failure and execution-backend failure are distinct:

```text
current runtime cannot run pipeline != source unavailable
```

Execution order:

1. LocalBackend when viable;
2. permanent `Remote Ingest` when local execution is unavailable and GitHub write/Actions access exists;
3. existing Card/snapshot only for identity/history;
4. `INGESTION_BLOCKED` if no approved backend can produce accepted current evidence.

The permanent runner is:

```text
.github/workflows/remote-ingest.yml
```

Transport uses an isolated branch:

```text
runtime/ingest/{request_id}
└── .runtime/requests/{request_id}.json
```

created from current `main`. The branch carries request data only. The workflow executes trusted harness code from `main`, installs Node 24, repository dependencies, and Chromium, uploads one-day artifact `remote-ingest-{request_id}`, and attempts to delete the request branch.

Before consuming a result require matching schema/request identity plus:

```text
execution.backend == github_actions
execution.status == success
```

Remote transport never weakens source completeness.

## Phase 8C — managed GitHub Models ranker

Remote Ingest now has a standard Phase 7 ranker, so semantic recovery no longer depends on whichever LLM endpoint happens to exist in the current chat/runtime.

Managed profile:

```text
provider: github_models
endpoint: https://models.github.ai/inference/chat/completions
model: openai/gpt-4.1
permission: models: read
auth: workflow GITHUB_TOKEN
response_format: json_object
temperature: 0
```

The workflow injects `GITHUB_TOKEN` only into the mandatory preflight step. The token must never appear in request branches, artifacts, Cards, snapshots, or logs.

The request branch cannot control endpoint, model, token, prompt, or executable ranker code. These come exclusively from the trusted `main` harness/workflow.

The managed adapter is injected into `prepareExternalIngestion(..., { continuationRanker })`. When Phase 7 is actually used, accepted provenance includes:

```text
thread.recovery.ranker.method = github_models_chat
thread.recovery.ranker.provider = github_models
thread.recovery.ranker.model = openai/gpt-4.1
```

Remote execution metadata additionally identifies:

```text
runner = remote-ingest-v2
managed_ranker = github_models
managed_ranker_model = openai/gpt-4.1
```

GitHub Models supplies semantic judgement only. Structural conflicts and every deterministic Phase 7 acceptance gate remain authoritative. Authentication, quota, service/model errors, invalid JSON, low confidence, or rejected judgement all fail closed; they never trigger timestamp-only inference.

## Test and live-acceptance strategy

CI fixtures cover:

- URL variants and exact target selection;
- root/middle/last self-thread inputs;
- reader-reply exclusion and same-author ambiguity;
- `n/N` and missing-part rejection;
- browser JSON/DOM fallback and unsafe redirects;
- root identity/dedup integration;
- source snapshot hashing/change detection;
- Phase 7 continuation and root-only accept/reject gates;
- execution request/result correlation;
- Phase 8C managed GitHub Models token gate, endpoint/auth, JSON mode, model, and provenance.

Browser fixture tests use injected sessions; ordinary unit CI does not need live Chromium navigation. Permanent Remote Ingest and Phase 8C are live-tested after landing on `main`, because the workflow intentionally executes trusted harness code from `main`.

Live acceptance tests must use temporary `runtime/ingest/**` requests only and must not create/update production Cards or advance snapshots unless the user is explicitly performing a real ingestion.
