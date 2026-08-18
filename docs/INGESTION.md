# Ingestion Pipeline

> **Role:** Normative cross-provider ingestion and execution contract  
> **Threads source semantics:** [`THREADS_INGESTION.md`](./THREADS_INGESTION.md)  
> **Runtime orchestration:** [Runtime Prompt](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/RUNTIME.md)  
> **Repository write rules:** [AGENTS.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md)  
> **Documentation router:** [`DOCUMENTATION.md`](./DOCUMENTATION.md)

This document owns the **cross-provider ingestion boundary**: provider routing, dispatcher/resolver behavior, generic/GitHub ingestion, execution backends, Remote Ingest transport, failure classification, and the handoff from an accepted source into repository authoring.

It intentionally does **not** define Threads reconstruction, continuation/root-only judgement, managed Threads ranker semantics, or Threads snapshot algorithms. Those belong to [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) and the trusted implementation.

## 1. Provider routing

Every ingestion begins by selecting one mutually exclusive provider route from the input URL or resolved primary resource.

| Primary resource | Route |
| --- | --- |
| `threads.com` / `threads.net`, including `/share/*`, `/t/*`, `/@user/post/*` | Threads source contract in [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) |
| transient/short URL that resolves to Threads | switch to the Threads route after resolution |
| GitHub Repository | generic ingestion with GitHub repository identity |
| paper / DOI / article / documentation / tool / product / other non-Threads source | generic/provider flow |

Hard boundary:

```text
Threads source     → THREADS_INGESTION.md
Non-Threads source → generic/provider flow in this document
```

Do not invoke Threads-only browser reconstruction, semantic continuation recovery, or Threads snapshots for non-Threads sources. Do not downgrade a Threads source to a generic single article merely because one post is immediately visible.

## 2. Dispatcher and resolver

Ordinary ingestion enters through:

```bash
npm run ingest:dispatch -- <URL>
```

The dispatcher selects an approved execution backend. A successful execution envelope exposes the normal resolver result under `result`.

Every approved backend ultimately executes the same low-level resolver contract:

```bash
npm run ingest:resolve -- <URL>
```

The resolver remains the mechanical authority for routine create/update identity:

- `canonical_url`
- `source_identity`
- stable `id`
- `mode`
- `existing_path`
- `suggested_path`

Typical dispatcher outcomes:

```text
local success
→ use envelope.result

local execution capability unavailable
→ REMOTE_EXECUTION_REQUIRED
→ use Repository-defined Remote Ingest

source extraction/completeness failure
→ fail closed
```

Exit code `75` with `REMOTE_EXECUTION_REQUIRED` is an execution handoff signal, not a source-level failure.

## 3. Generic and GitHub ingestion

The generic flow is:

```text
input URL
→ execution dispatcher
→ resolve/canonicalize primary resource
→ derive stable source identity
→ create/update lookup
→ read authoritative primary evidence
→ analyze
→ repository write protocol
→ validation
```

### GitHub

GitHub URL variants must converge to one repository identity:

```text
source.identity = github:{owner-lowercase}/{repo-lowercase}
canonical_url   = https://github.com/{owner}/{repo}
```

At minimum, read repository metadata and README. Inspect architecture, source, configuration, security, release, or documentation files when needed to support technical claims.

### Other web sources

For normal non-Threads web URLs, canonicalization removes fragments and known tracking parameters conservatively while preserving meaningful query parameters. The accepted resolver result, not manual guesswork, determines routine identity and create/update mode.

## 4. Execution backend policy

Provider routing answers **what source pipeline must run**. Execution routing answers **where that pipeline can run**.

Core invariant:

```text
execution/runtime failure != source unavailable
```

A public source must not be classified as unavailable merely because the current session lacks shell access, Node/npm, outbound network, browser capability, or a required model/provider capability.

Execution order:

```text
LocalBackend
↓ if unavailable
Repository-defined Remote Ingest
↓ if unavailable / blocked
Existing Card / accepted source state only for identity/history
↓
INGESTION_BLOCKED if no approved backend can produce accepted current evidence
```

Existing Cards, aliases, or accepted snapshots may help identify previously accepted state. They never replace current live completeness/freshness validation.

## 5. Failure classification

Use these top-level classes consistently:

- `LOCAL_EXECUTION_UNAVAILABLE` — the current runtime cannot execute the required Repository pipeline;
- `REMOTE_EXECUTION_UNAVAILABLE` — the Repository-defined remote backend or a required managed execution capability is unavailable or blocked;
- `SOURCE_EXTRACTION_FAILED` — a viable backend reached the source pipeline, but extraction failed for a source/evidence reason;
- `SOURCE_INCOMPLETE` — evidence exists and required capabilities ran, but provider completeness/ambiguity gates did not pass;
- `INGESTION_BLOCKED` — no allowed backend can produce an accepted current source;
- `SOURCE_UNAVAILABLE` — reserve for source-level unavailability established by a viable backend.

Provider-specific errors may appear as nested causes. The outer classification must still distinguish execution capability failure from actual source incompleteness.

Hard rules:

- an execution failure must not be relabeled as source unavailability;
- an incomplete, ambiguous, identity-mismatched, blocked, or otherwise unaccepted source must not create/update a formal Card;
- blocked live revalidation must not refresh analysis, `last_checked_at`, or accepted source state;
- session/tool differences must not weaken provider completeness, identity, ownership, or public-safety gates.

## 6. Remote Ingest transport

The permanent remote backend is:

[`.github/workflows/remote-ingest.yml`](https://github.com/EstherAIRP/Knowledge-Card/blob/main/.github/workflows/remote-ingest.yml)

Ordinary ingestion must not invent ad-hoc workflow files.

### Request branch protocol

1. Re-read the latest `main`.
2. Create `runtime/ingest/{request_id}` from that exact `main` commit.
3. Add exactly one request file at `.runtime/requests/{request_id}.json`.
4. Keep the request branch data-only; it must not modify trusted source code, workflow code, Cards, or machine-owned state.

Base request shape:

```json
{
  "schema_version": 1,
  "request_id": "20260818-example01",
  "operation": "resolve",
  "url": "https://example.com/source"
}
```

Current base constraints:

- `request_id`: 6–80 lowercase URL-safe characters;
- `operation`: `resolve`;
- `url`: absolute HTTP(S).

Provider-specific optional request fields, when supported, remain controlled by trusted validation code and the corresponding provider contract. Request data cannot redefine workflow code, prompts, credentials, model policy, or acceptance gates.

### Trusted execution boundary

Remote Ingest executes trusted harness code from `main`; the request branch is consumed separately as data. Remote execution may install Repository dependencies and provider-required runtime capabilities, but moving execution to GitHub Actions must not lower source completeness or Repository safety rules.

### Result artifact

A validated request uses the short-lived artifact identity:

```text
remote-ingest-{request_id}
└── remote-ingest-result.json
```

Before consuming a successful result, verify at minimum:

```text
schema_version == 1
request_id == submitted request_id
execution.backend == github_actions
execution.status == success
```

Use envelope `result` as the resolver/preflight output only after request/result correlation succeeds. Failure envelopes remain fail closed. Temporary request transport must never merge into `main`.

Provider-specific managed execution details belong to the relevant provider document. For Threads semantic recovery and handoff, see [`THREADS_INGESTION.md`](./THREADS_INGESTION.md).

## 7. Primary evidence requirement

Never write substantive analysis from a URL slug, search snippet, repository name, or model memory alone.

Before authoring a Card:

- read the accepted authoritative primary source;
- for GitHub, inspect repository metadata and README at minimum;
- for papers, prefer the paper/abstract and official project material;
- for articles/documentation, read the actual authoritative page;
- distinguish verified facts from inference;
- do not invent features, architecture, maturity, license, compatibility, benchmarks, or maintenance state.

Threads formal analysis must use the complete accepted source defined by [`THREADS_INGESTION.md`](./THREADS_INGESTION.md), not merely the originally shared post.

If current primary evidence cannot be accepted after allowed execution routing is exhausted, do not fabricate a Card.

## 8. Accepted-source handoff to Repository writes

Once the source pipeline returns an accepted resolver result, Repository authoring rules move to [AGENTS.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md).

In particular:

- create vs update comes from accepted resolver identity;
- stable IDs/paths and user-owned state must be preserved;
- Card frontmatter must satisfy the Schema and Taxonomy;
- existing-card updates require ownership validation;
- provider-owned operational state may advance only after the corresponding Card write validates successfully.

Do not duplicate the full create/update ownership contract here.

## 9. Validation and reporting

Card writes require:

```bash
npm run validate
```

Existing Card updates also require:

```bash
npm run validate:ownership -- <existing_path>
```

Source/execution implementation changes additionally require:

```bash
npm test
```

Documentation-only changes follow the validation/CI requirements in [AGENTS.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md).

Do not report completion until the required Repository write, validation, push, CI, and deployment states have actually been verified.

## 10. Document boundary

This document owns:

- provider route selection;
- dispatcher/resolver relationship;
- generic/GitHub ingestion;
- execution backend ordering;
- cross-provider failure classification;
- Remote Ingest transport and trust boundary;
- accepted-source handoff into Repository authoring.

This document does **not** own:

- Threads Phase 1–7 algorithms;
- Threads continuation/root-only thresholds or judgement semantics;
- managed Threads classifier prompt semantics;
- Threads semantic handoff evidence/digest rules;
- Threads accepted-snapshot/change-detection algorithm;
- Knowledge Card ownership/write details already defined by `AGENTS.md`.

## Related documents

- [Documentation Router](./DOCUMENTATION.md)
- [Document Authority Map](./AUTHORITY_MAP.md)
- [Threads Ingestion](./THREADS_INGESTION.md)
- [Automation](./AUTOMATION.md)
- [Runtime Prompt](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/RUNTIME.md)
- [Repository Rules](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md)
- [Remote Ingest Workflow](https://github.com/EstherAIRP/Knowledge-Card/blob/main/.github/workflows/remote-ingest.yml)
