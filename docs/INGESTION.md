# Ingestion Pipeline

Knowledge Card separates semantic analysis from deterministic repository invariants. AI/Codex reads and analyzes primary evidence; repository scripts resolve identities, deduplicate, validate schema/taxonomy and protect user-owned state.

## 1. Route the URL before source-specific extraction

Every ingestion begins with a provider routing decision. The routing rule is intentionally simple and mutually exclusive.

| URL / resolved primary resource | Route |
| --- | --- |
| `threads.com` / `threads.net` (including `www`, subdomains, `/share/*`, `/t/*`, `/@user/post/*`) | Threads-specific ingestion in `docs/THREADS_INGESTION.md` |
| A transient / short URL that resolves to a Threads primary resource | Switch to the Threads-specific route after resolution |
| GitHub Repository | Generic ingestion with GitHub repository identity and repository primary evidence |
| Paper / arXiv / DOI / normal article / documentation / tool / product / any other non-Threads source | Generic ingestion described below |

Hard boundary:

```text
Threads source
→ Threads Phase 1–7 only

Non-Threads source
→ generic provider flow only
```

Do not invoke Threads Playwright navigation, conversation reconstruction, continuation candidate extraction, LLM continuation/root-only ranking or Threads snapshots for a non-Threads source. Conversely, do not downgrade a Threads source to a generic article and analyze only the currently shared post.

The source route is determined from the raw URL hostname or, for a transient/short URL, from the resolved primary resource. A normal article that merely mentions or links to Threads remains a normal article.

## 2. Mandatory preflight and dispatcher

For ordinary ingestion, prefer the execution dispatcher:

```bash
npm run ingest:dispatch -- <URL>
```

The dispatcher runs the same repository resolver on the local execution backend first. When local execution succeeds, the normal resolver contract is returned under the execution envelope's `result` field.

`npm run ingest:resolve -- <URL>` remains the low-level mandatory resolver used inside every approved backend and for debugging/tests. Its `canonical_url`, `source_identity`, stable `id`, `mode`, `existing_path` and `suggested_path` remain the mechanical create/update contract.

Dispatcher outcomes:

```text
local success
→ execution.status=success
→ use result as resolver contract

local capability unavailable
→ status=REMOTE_EXECUTION_REQUIRED
→ submit the returned remote plan through Phase 8B Remote Ingest

source/completeness failure
→ fail closed
```

The CLI uses exit code `75` for `REMOTE_EXECUTION_REQUIRED`. That is a handoff signal, not a source failure.

### Generic and GitHub sources

GitHub repository variants resolve to one `github:{owner}/{repo}` identity. Normal web URLs remove fragments and known tracking parameters while preserving meaningful query parameters. The agent then opens and reads the authoritative primary source.

For non-Threads sources the normal flow is:

```text
input URL
→ execution dispatcher
→ canonicalize / resolve primary resource
→ derive provider-specific or generic source identity
→ dedup/create-update resolution
→ read authoritative primary evidence
→ analyze
→ validate
```

No Threads conversation-completeness or source-snapshot requirement applies to this route unless a future provider contract explicitly adds one.

### Threads sources

Threads is source-aware. The mandatory resolver does not stop after expanding `/share/*` or `/t/*`. Before create/update resolution it must obtain a complete accepted source under the Threads contract:

```text
share / arbitrary part
→ canonical target post
→ exact post extraction
→ strict conversation graph
→ root + author-chain reconstruction
→ n/N completeness check
→ browser evidence when required
→ LLM-assisted continuation or root-only recovery only when structural relationships are unavailable and acceptance gates pass
→ root canonical URL + threads:{root_shortcode}
→ dedup/create-update resolution
→ source change comparison
```

A successful Threads result includes `source_document.parts[]` and `source_document.combined_text`. Use `combined_text` as the primary article text. If the conversation is incomplete or ambiguous, stop rather than authoring from a partial post.

See `docs/THREADS_INGESTION.md` for the full Phase 1–7 contract.

## 3. Execution backend policy

Provider routing and execution routing are separate. Provider routing selects the required source pipeline; execution routing selects where that exact pipeline can run.

Core rule:

```text
runtime unavailable != source unavailable
```

Do not turn a missing local shell, Node/npm runtime, outbound network path, Playwright/Chromium installation, LLM endpoint or similar execution capability into a source-level conclusion.

Execution order:

```text
Local execution backend
↓ if unavailable
Repository-defined Remote Ingest backend
↓ if unavailable / blocked
Existing alias or accepted snapshot lookup for identity/history only
↓
INGESTION_BLOCKED if no allowed backend can produce an accepted current source
```

### Local backend

Use the current runtime first when it can execute the repository contract. If dependencies or browser binaries are missing and installation is allowed, install them before declaring the local backend unavailable.

Local capability failures should be reported as `LOCAL_EXECUTION_UNAVAILABLE`, not `SOURCE_UNAVAILABLE`.

### Phase 8B Remote Ingest backend

The permanent remote backend is:

```text
.github/workflows/remote-ingest.yml
```

Ordinary ingestion must not create a new ad-hoc workflow. The transport protocol uses an isolated temporary request branch.

#### Request branch protocol

1. Re-read the latest `main` commit.
2. Create `runtime/ingest/{request_id}` from that exact `main` commit.
3. Add **exactly one** file:

```text
.runtime/requests/{request_id}.json
```

4. The request body is:

```json
{
  "schema_version": 1,
  "request_id": "20260815-example01",
  "operation": "resolve",
  "url": "https://example.com/source"
}
```

Contract:

- `request_id`: 6–80 lowercase URL-safe characters;
- `operation`: currently only `resolve`;
- `url`: absolute HTTP(S) only;
- the request branch must not modify source code, workflows, Cards or machine-owned state.

Pushing the request triggers `Remote Ingest` because the branch matches `runtime/ingest/**` and the changed path matches `.runtime/requests/*.json`.

#### Trusted execution model

The workflow deliberately separates executable code from request data:

```text
main
→ checkout trusted harness into app/

runtime/ingest/{request_id}
→ sparse-checkout only .runtime/requests into request/
```

The runner executes scripts from trusted `main`, not from the request branch. It installs Node 24, repository dependencies and Playwright Chromium, then runs the same mandatory resolver contract.

The URL remains JSON data; it is not evaluated as a command or inserted into a shell command string.

#### Result artifact

Every validated request produces an execution envelope at:

```text
remote-ingest-result.json
```

inside artifact:

```text
remote-ingest-{request_id}
```

Artifact retention is one day. The complete resolver/source result is transport data only: it is not committed to repository state and must not be dumped into public workflow logs.

Before consuming the result, verify:

```text
schema_version == 1
request_id == submitted request_id
execution.backend == github_actions
execution.status == success
```

When successful, use envelope `result` exactly as the accepted resolver/preflight output. When `execution.status=failure`, use its `classification`, `code` and `message` and fail closed.

The workflow attempts to delete the temporary `runtime/ingest/**` branch after execution. Request files must never be merged into `main`.

#### Current Phase 8B boundary

The runner is browser-capable because Chromium is installed. Managed Phase 7 LLM credentials/provider configuration is **not** part of Phase 8B; that belongs to Phase 8C. A Threads case requiring semantic continuation/root-only recovery may therefore remain `SOURCE_INCOMPLETE` until a ranker is configured. Phase 8B must not replace that missing ranker with timestamp-only inference.

### Alias / snapshot lookup

Existing aliases, Cards and accepted snapshots may help identify a known source or explain prior accepted state. They do not prove that the source is currently unchanged or complete.

If live revalidation cannot run:

- it is acceptable to report the known existing identity/Card/snapshot;
- do not refresh analysis, dates or source state as if current evidence had been verified;
- do not advance a Threads snapshot;
- do not use prior accepted state to bypass current provider completeness requirements.

### Failure vocabulary

Use these distinctions consistently:

- `LOCAL_EXECUTION_UNAVAILABLE` — current runtime cannot execute the required repository pipeline.
- `REMOTE_EXECUTION_UNAVAILABLE` — approved remote execution is inaccessible or unable to execute the request.
- `SOURCE_EXTRACTION_FAILED` — a viable backend ran the source pipeline, but source/evidence extraction failed.
- `SOURCE_INCOMPLETE` — evidence exists but provider completeness or ambiguity gates do not pass.
- `INGESTION_BLOCKED` — no allowed backend can produce an accepted source for the attempt.
- `SOURCE_UNAVAILABLE` — source-level unavailability established by a viable execution path; never a synonym for missing local capabilities.

No execution-backend failure, blocked ingestion, incomplete source or ambiguous source may create/update a formal Card or advance accepted source state.

## 4. Read primary evidence

Never write substantive analysis from a slug, search snippet or model memory. For GitHub read repository metadata and README at minimum; inspect architecture/security/docs/source when needed. For papers/articles read the actual authoritative source. Separate verified facts from inference.

For Threads, the complete `source_document` returned by the mandatory resolver is the primary text/provenance contract. Do not downgrade it to only the originally shared part. When recovery is LLM-assisted, preserve `thread.verification = llm_assisted` and the exact inferred status (`INFERRED_THREAD_HIGH_CONFIDENCE` or `INFERRED_SINGLE_POST_HIGH_CONFIDENCE`) rather than describing the graph as natively verified.

If primary evidence cannot be read sufficiently after execution routing is exhausted, report the concrete source-level failure or `INGESTION_BLOCKED` for backend unavailability. Do not fabricate a Card and do not use `SOURCE_UNAVAILABLE` for a local runtime limitation.

## 5. Create or update

Create mode uses `templates/knowledge-card.example.md` at `suggested_path`. Update mode reads the existing card completely and preserves stable `id`, `created_at`, file path, all user overrides, `## 使用者備註` and prior changelog history.

Refresh only AI-owned analysis from current evidence. Set `last_checked_at` on real re-checks; change `updated_at` / changelog only for substantive knowledge changes.

For Threads only, after a successful create/update and validation, advance the accepted source snapshot with:

```bash
npm run ingest:snapshot -- <Threads URL>
```

Do not run the Threads snapshot command for non-Threads sources.

## 6. Ownership validation

Before committing an existing-card update:

```bash
npm run validate:ownership -- <existing_path>
```

The check protects stable fields, user overrides and `## 使用者備註`.

## 7. Repository validation

Run:

```bash
npm run validate
```

Validation covers schema/taxonomy contract drift, body structure, title consistency, source identity normalization, duplicate id/identity/canonical URL and date ordering.

When ingestion/source tooling changes, also run:

```bash
npm test
```

Phase 8B changes source/execution tooling, so unit tests and repository validation are mandatory before promotion to `main`.

## 8. Commit and report

Preferred Card commits are `knowledge: add <Title>` / `knowledge: update <Title>`. Infrastructure uses `feat:`, `fix:`, `test:`, `docs:` or `chore:`. Do not report success until repository writes and required validation have succeeded.
