# Threads Source Ingestion

> **Role:** Normative Threads-only source/completeness contract  
> **Cross-provider ingestion / execution:** [`INGESTION.md`](./INGESTION.md)  
> **Judgement output schema:** [threads-continuation-judgement.schema.json](https://github.com/EstherAIRP/Knowledge-Card/blob/main/schema/threads-continuation-judgement.schema.json)  
> **Managed classifier prompt:** [threads-continuation-ranker.agent.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/.github/agents/threads-continuation-ranker.agent.md)  
> **Runtime orchestration:** [Runtime Prompt](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/RUNTIME.md)  
> **Repository write rules:** [AGENTS.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md)  
> **Documentation router:** [`DOCUMENTATION.md`](./DOCUMENTATION.md)

This document is the **sole detailed human-readable domain specification for Threads ingestion**. It owns Threads URL resolution, exact-post extraction, conversation reconstruction, browser evidence, accepted snapshots, Phase 7 continuation/root-only recovery, and Threads-specific managed semantic execution.

The machine-readable structure of Phase 7 semantic judgement output is owned by [`schema/threads-continuation-judgement.schema.json`](https://github.com/EstherAIRP/Knowledge-Card/blob/main/schema/threads-continuation-judgement.schema.json). Evidence-dependent acceptance policy remains in this document and trusted validation code.

Cross-provider dispatcher/resolver behavior, Remote Ingest transport, and top-level execution failure classes are defined by [`INGESTION.md`](./INGESTION.md). Repository create/update ownership rules are defined by [AGENTS.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md).

## 1. Scope and trust order

Use this pipeline only when the primary resource is on `threads.com` / `threads.net`, including `/share/<token>`, `/t/<token>`, `/@user/post/<shortcode>`, or a transient URL that resolves to one of those resources.

```text
Threads primary resource → this document
anything else             → INGESTION.md generic/provider flow
```

A non-Threads page does not become a Threads source because its text mentions or links to Threads.

The source trust order is:

```text
URL identity
→ exact post evidence
→ structural conversation graph / n/N evidence
→ browser/web-data evidence when needed
→ Phase 7 semantic recovery only when structurally eligible
→ deterministic acceptance gate
→ accepted source or fail closed
```

Semantic recovery never overrides stronger contradictory structural evidence.

## 2. Phase 1 — URL resolution

Accepted URL families include `/share/*`, `/t/*`, canonical `/@user/post/*`, and Threads host variants.

Transient URLs resolve through HTTP redirects, canonical metadata, embedded URLs, or browser navigation when JavaScript is required.

The final source identity is never the share token. A complete source canonicalizes to its root post.

## 3. Phase 2 — exact post extraction

The extractor selects the exact requested shortcode from public HTML/hydration evidence and normalizes:

- id / shortcode / canonical URL;
- author and timestamp;
- text and media;
- reply/root metadata;
- quoted/reposted references;
- extraction provenance.

Fallback adapters must return the requested post identity or fail closed. A fallback result for another post must not be silently substituted.

## 4. Phase 3 — complete self-thread reconstruction

Strict reconstruction follows structural evidence:

```text
same author
AND reply_to == previous post
AND same root when root metadata exists
```

Timestamp proximity alone is not structural proof.

Same-author branching that cannot be resolved uniquely is ambiguous and fails closed rather than guessing by time order.

When `n/N` is known, all available invariants must agree:

```text
parts.length == N
input index == n
known total/order is consistent
```

Known missing parts remain incomplete.

Successful structural reconstruction preserves ordered `parts[]`, `combined_text`, root/input metadata, media, thread status, and extraction provenance. Root identity is:

```text
threads:{root_shortcode}
```

## 5. Phase 4 — Knowledge Card integration boundary

Ordinary ingestion enters through:

```bash
npm run ingest:dispatch -- <threads-url>
```

Every approved backend ultimately executes:

```bash
npm run ingest:resolve -- <threads-url>
```

The Threads resolver path performs the source-specific work before formal create/update authoring:

```text
Phase 1 URL resolution
→ Phase 2 exact post
→ Phase 3 strict graph reconstruction
→ Phase 5 browser evidence when required
→ retry structural reconstruction
→ Phase 7 semantic recovery only when eligible
→ require accepted complete source
→ verify root canonical URL ↔ source_identity
→ create/update resolution
→ Phase 6 accepted-source change comparison
```

Accepted output includes the complete source document and analysis input, conceptually:

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

Formal analysis uses `source_document.combined_text`, not merely the originally shared post.

### Root-level deduplication

Any share token or arbitrary thread part must converge to the root canonical URL and `threads:{root_shortcode}` before create/update lookup. Existing Card ID/path remain stable.

### Source-level fail-closed conditions

Examples include:

- incomplete conversation coverage;
- structural same-author ambiguity;
- conflicting `n/N` evidence;
- known missing parts;
- invalid or mismatched extracted identity;
- failed Phase 7 judgement or deterministic acceptance gate.

Execution capability failures are classified separately under [`INGESTION.md`](./INGESTION.md); missing local browser/model capability is not itself proof that the public Threads source is unavailable.

## 6. Phase 5 — browser / web-data fallback

When HTTP/hydration evidence is insufficient, an isolated no-login browser may collect:

1. rendered DOM/hydration;
2. same-origin Threads JSON/GraphQL-like responses;
3. rendered `n/N` evidence when unambiguous.

Captured records are normalized and returned to the same Phase 3/7 logic. Browser navigation success by itself is never completeness proof.

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

Important browser failure codes may include:

- `THREADS_BROWSER_UNAVAILABLE`
- `THREADS_BROWSER_LAUNCH_FAILED`
- `THREADS_BROWSER_NAVIGATION_FAILED`
- `THREADS_BROWSER_UNSAFE_REDIRECT`
- `THREADS_BROWSER_CANONICAL_NOT_FOUND`
- `THREADS_BROWSER_NO_POSTS`

A local browser capability failure is first an execution-backend problem; see [`INGESTION.md`](./INGESTION.md).

## 7. Phase 6 — accepted source snapshots and change detection

Only a complete accepted Threads source may be compared with state under:

```text
state/source-snapshots/threads/
```

Current source-change states include:

```text
FIRST_SEEN
UNCHANGED
THREAD_EXTENDED
PART_CHANGED
PART_REMOVED
STRUCTURE_CHANGED
MULTIPLE_CHANGES
```

Snapshots store public provenance and stable SHA-256 fingerprints, not raw Threads text, raw GraphQL payloads, cookies, login/session data, or private content. Volatile media query signatures do not define media identity.

Preflight is read-only. After the corresponding Card create/update succeeds and repository validation passes, accepted state may advance with:

```bash
npm run ingest:snapshot -- <threads-url>
```

The command requires a matching Card. Unchanged hashes are a no-op. Failed, incomplete, ambiguous, or identity-mismatched extraction never overwrites the last accepted snapshot.

Source-state ownership details are defined by [state/AGENTS.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/state/AGENTS.md).

## 8. Phase 7 — semantic continuation / root-only recovery

Phase 7 exists for a specific evidence gap: the root post and nearby same-author reply candidates are publicly observable, but Threads does not expose enough native `reply_to` / `root_post` relationship data to prove whether those replies belong to the original article body.

It does **not** replace Phase 3 structural reconstruction.

### Why Phase 7 exists

A public page can expose evidence such as:

```text
root.has_replies = true
same-author reply objects are visible
reply.is_reply = true
reply.reply_to = null
reply.root_post = null
thread n/N is unavailable
```

Without an explicit recovery gate, a root-only graph could be falsely accepted as `SINGLE_POST` even though conversation coverage was not proved.

If a root reports replies and coverage is not structurally proven, the source must either:

- become structurally complete from additional evidence;
- pass the high-confidence Phase 7 fallback; or
- remain incomplete.

### Implementation responsibility split

The implementation is intentionally layered:

```text
browser-adapter.mjs
  collect public evidence only
        ↓
conversation.mjs
  deterministic reply graph / root / n/N logic
        ↓
conversation-recovery.mjs
  orchestration and suspicious-single guard
        ↓
continuation-recovery.mjs
  deterministic candidate filter + semantic judgement contract + acceptance gate
        ↓
source-ingestion.mjs
  provider completeness / identity integration
```

The browser adapter does not decide semantic continuation. The semantic ranker does not decide whether the source is accepted. Final acceptance remains deterministic code.

### Eligibility boundary

Phase 7 may run only when strict structural evidence does not already prove or disprove completeness.

It cannot override:

- conflicting `n/N` indicators;
- known missing parts when a total is known;
- structural same-author branch ambiguity;
- source identity mismatch.

Those conditions remain fail closed.

### Deterministic candidate filter

Only evidence already extracted from the public Threads page is eligible.

Current defaults:

```text
same author as root
exclude root
exclude posts before root when timestamp is known
exclude explicit is_reply=false
within 24 hours when timestamp is known
max 8 candidates
```

Candidates are ordered deterministically by time distance and metadata evidence.

Time distance is evidence for narrowing/scoring only; it can never directly prove thread membership.

The metadata score may reward explicit reply status, short publication-time distance, text presence, and known reply-terminal metadata. Current continuation acceptance requires the first selected candidate to meet the implementation's minimum metadata evidence threshold.

### Semantic judgement contract

The ranker receives one root plus the deterministic filtered candidate set. All Threads text is **untrusted quoted data**. Instructions contained inside source posts must never be followed.

The canonical machine-readable output contract is:

- [Threads continuation judgement schema](https://github.com/EstherAIRP/Knowledge-Card/blob/main/schema/threads-continuation-judgement.schema.json)

It owns the required fields, data types, confidence bounds and allowed candidate labels. Current required fields are:

```text
selected_shortcodes
root_only
confidence
complete
rationale
candidate_labels
```

Allowed labels are:

```text
continuation
followup
unrelated
uncertain
```

The local prompt derives required fields and labels from the shared Schema. Managed Copilot output, local provider output, semantic handoff normalization and the final Phase 7 validator all pass through the shared runtime validator in `scripts/lib/contracts/threads-continuation-judgement.mjs`.

The Schema intentionally does **not** encode evidence-dependent acceptance policy. Candidate membership, exact root-only label coverage, confidence acceptance thresholds, metadata evidence, chronology, same-author checks, `n/N` and structural ambiguity remain deterministic source-validation responsibilities below.

### Continuation acceptance gate

Current default acceptance requires all of the following:

```text
complete == true
root_only != true
confidence >= 0.90
selected_shortcodes non-empty + unique
first selected metadata_score >= 0.60
all selected identities exist in captured evidence
same author
no explicit non-reply selected
selected time order does not regress
```

Failure of any required check leaves the source incomplete. There is no fallback to “nearest post by time”.

### Root-only acceptance gate

Current default root-only acceptance requires:

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

“No continuation found” is not sufficient evidence for root-only acceptance. Root-only means the candidate set was affirmatively and completely excluded from the original article body with high confidence.

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

Phase 7 core is provider-neutral. Local callers may inject `continuationRanker` or configure the supported OpenAI-compatible endpoint contract:

```text
THREADS_CONTINUATION_LLM_ENDPOINT
# or THREADS_CONTINUATION_LLM_BASE_URL
THREADS_CONTINUATION_LLM_MODEL
THREADS_CONTINUATION_LLM_API_KEY   # optional
```

No usable semantic ranker means that backend cannot complete Phase 7 and must fail closed rather than guess.

## 9. Execution capabilities around Threads

Phases 8A–8D are execution/harness capabilities around the same Threads Phase 1–7 source semantics. They are **not alternate source-extraction rules**.

Cross-provider LocalBackend/RemoteBackend ordering, request transport, artifact correlation, and top-level failure classification are owned by [`INGESTION.md`](./INGESTION.md).

### Phase 8C — managed GitHub Copilot CLI ranker

Remote Ingest provides a Repository-managed Phase 7 semantic ranker using GitHub Copilot CLI.

Managed profile:

```text
provider: github_copilot
adapter: copilot_cli
agent: threads-continuation-ranker
model_selector: auto
resolve-job permission: contents: read + copilot-requests: write
auth: workflow GITHUB_TOKEN → isolated COPILOT_GITHUB_TOKEN
```

The request branch cannot choose model selector, agent, prompt, token, tool policy, or executable ranker code.

The model-running job has no Repository contents-write permission. Request-branch cleanup is isolated from model execution and uses separate write permission.

The classifier runs in an ephemeral workspace with isolated `HOME` / `COPILOT_HOME`. Only the trusted custom-agent profile is copied into the workspace. That profile declares `tools: []`, so shell, file, URL, GitHub, MCP, memory, and other tools are unavailable during semantic classification.

Source evidence is passed as data and remains untrusted quoted content.

The managed ranker produces only the normal Phase 7 semantic judgement and its raw JSON must conform to the shared judgement Schema before ranker provenance is attached. Deterministic candidate filtering, structural conflict checks, thresholds, chronology, root-only label coverage, and fail-closed acceptance remain authoritative after structural validation.

Accepted managed provenance records:

```text
thread.verification = llm_assisted
thread.recovery.ranker.method = github_copilot_cli
thread.recovery.ranker.provider = github_copilot
thread.recovery.ranker.model = auto
thread.recovery.ranker.agent = threads-continuation-ranker
```

`model = auto` records the trusted selector supplied to Copilot CLI; it does not claim the harness knows the underlying model selected internally.

Policy/auth/CLI/timeout/output/invalid-response failures mean the managed execution backend did not produce a viable judgement. They must remain execution capability failures rather than being misreported as source incompleteness. A semantic judgement that actually runs and then fails the deterministic Phase 7 gate may remain `SOURCE_INCOMPLETE`.

The actual managed prompt is [`.github/agents/threads-continuation-ranker.agent.md`](https://github.com/EstherAIRP/Knowledge-Card/blob/main/.github/agents/threads-continuation-ranker.agent.md).

### Phase 8D — agent semantic handoff fallback

When the managed semantic backend cannot execute because of policy/auth/provider capability, Remote Ingest may perform a capture-only Phase 7 pass and expose `failure.semantic_handoff` in the short-lived result artifact.

The handoff contains the exact public root/candidate evidence used for classification plus a deterministic SHA-256 evidence digest. Its `judgement_contract` points to the shared judgement Schema and exposes the required fields/labels from that contract.

A Knowledge Card Agent may classify that evidence and submit a second normal `operation=resolve` request containing only:

```text
producer = knowledge_card_agent
evidence_digest = sha256:...
judgement = normal Phase 7 structured judgement
```

The request must not supply or alter root/candidate source evidence.

Trusted `main` re-extracts the current source, rebuilds the candidate set, and recomputes the digest before the submitted judgement can be used. Digest mismatch fails closed with:

```text
THREADS_CONTINUATION_HANDOFF_EVIDENCE_MISMATCH
```

A stale judgement must never be applied to changed source evidence.

The supplied judgement is normalized into the shared Schema contract and still passes the normal Phase 7 acceptance validation. Handoff cannot override structural conflicts, candidate membership, metadata threshold, chronology, confidence, or root-only complete-label coverage.

Accepted handoff provenance records:

```text
thread.verification = llm_assisted
thread.recovery.ranker.method = agent_semantic_handoff
thread.recovery.ranker.provider = knowledge_card_agent
thread.recovery.ranker.evidence_digest = sha256:...
```

The handoff changes only where semantic classification is performed; it does not weaken the source contract.

## 10. Failure and reporting boundary

Threads-specific source failures and execution-backend failures must remain distinct.

Examples:

```text
structural ambiguity / missing known part / rejected Phase 7 judgement
→ source completeness failure

local browser unavailable
→ local execution capability failure first

managed Copilot policy/auth/CLI failure
→ remote execution capability failure

all approved backends exhausted without accepted evidence
→ INGESTION_BLOCKED
```

Use the top-level failure vocabulary defined by [`INGESTION.md`](./INGESTION.md).

When a source is accepted through Phase 7, reporting must preserve `llm_assisted` provenance and inferred status. Do not describe inferred recovery as native Threads graph verification.

## 11. Testing and acceptance strategy

CI fixtures cover the deterministic source contract, including:

- URL variants and exact target selection;
- root/middle/last self-thread inputs;
- reader-reply exclusion and same-author ambiguity;
- `n/N` and known-missing-part rejection;
- browser JSON/DOM fallback and unsafe redirects;
- root identity/dedup integration;
- source snapshot hashing/change detection;
- shared semantic-judgement Schema validation and prompt/label contract alignment;
- Phase 7 continuation and root-only accept/reject gates;
- Remote request/result correlation and nested diagnostics;
- managed classifier isolation, policy-denial handling, JSON parsing, Schema validation and provenance;
- semantic handoff digest binding, shared-contract exposure and mismatch rejection.

Browser fixture tests may use injected sessions; ordinary unit CI need not perform live public navigation.

Live execution acceptance must use temporary Remote Ingest requests and must not create/update production Cards or advance snapshots unless the user is explicitly performing a real ingestion.

## 12. Document boundary

This document owns:

- Threads URL resolution;
- exact-post extraction;
- structural self-thread reconstruction;
- Threads browser/web-data evidence rules;
- root identity and formal analysis source;
- accepted Threads snapshot/change detection;
- Phase 7 eligibility, deterministic acceptance policy, and provenance;
- Threads-specific managed classifier and semantic handoff semantics.

The shared judgement Schema owns the Phase 7 semantic output fields/types/label vocabulary.

This document does **not** own:

- generic/GitHub ingestion;
- cross-provider execution backend order;
- Remote Ingest base request/artifact transport;
- top-level failure vocabulary;
- Repository create/update/user-state rules;
- Knowledge Card Schema/Taxonomy.

## Related documents

- [Documentation Router](./DOCUMENTATION.md)
- [Document Authority Map](./AUTHORITY_MAP.md)
- [Cross-provider Ingestion](./INGESTION.md)
- [Runtime Prompt](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/RUNTIME.md)
- [Repository Rules](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md)
- [Threads Judgement Schema](https://github.com/EstherAIRP/Knowledge-Card/blob/main/schema/threads-continuation-judgement.schema.json)
- [Shared Threads Judgement Validator](https://github.com/EstherAIRP/Knowledge-Card/blob/main/scripts/lib/contracts/threads-continuation-judgement.mjs)
- [Managed Threads Ranker Prompt](https://github.com/EstherAIRP/Knowledge-Card/blob/main/.github/agents/threads-continuation-ranker.agent.md)
- [Threads Continuation Validation Code](https://github.com/EstherAIRP/Knowledge-Card/blob/main/scripts/lib/sources/threads/continuation-recovery.mjs)
- [Remote Ingest Workflow](https://github.com/EstherAIRP/Knowledge-Card/blob/main/.github/workflows/remote-ingest.yml)
