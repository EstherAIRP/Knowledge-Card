# Ingestion Pipeline

Knowledge Card separates provider/source semantics from execution location. AI/Codex reads and analyzes primary evidence; repository scripts resolve identities, enforce provider completeness, deduplicate, validate schema/taxonomy, and protect user-owned state.

## 1. Route the source first

Every ingestion starts with a mutually exclusive provider route.

| URL / resolved primary resource | Route |
| --- | --- |
| `threads.com` / `threads.net` including `/share/*`, `/t/*`, `/@user/post/*` | Threads Phase 1–7 in `docs/THREADS_INGESTION.md` |
| transient/short URL resolving to Threads | switch to Threads route after resolution |
| GitHub Repository | generic ingestion with GitHub repository identity; read metadata + README at minimum |
| paper / DOI / article / docs / tool / product / other non-Threads source | generic ingestion |

Hard boundary:

```text
Threads source → Threads Phase 1–7
Non-Threads source → generic/provider flow
```

Do not invoke Threads browser/reconstruction/ranker/snapshot logic for non-Threads sources. Do not downgrade a Threads source to a generic single article merely because one post is immediately visible.

## 2. Mandatory dispatcher and resolver

Ordinary ingestion enters through:

```bash
npm run ingest:dispatch -- <URL>
```

The dispatcher tries LocalBackend first. A successful execution envelope contains the normal resolver contract under `result`.

Every approved backend ultimately executes the same low-level mandatory resolver:

```bash
npm run ingest:resolve -- <URL>
```

The resolver's fields remain the mechanical create/update contract:

- `canonical_url`
- `source_identity`
- stable `id`
- `mode`
- `existing_path`
- `suggested_path`

Dispatcher outcomes:

```text
local success
→ use envelope.result

local execution capability unavailable
→ REMOTE_EXECUTION_REQUIRED
→ use Phase 8B/8C Remote Ingest

source/completeness failure
→ fail closed
```

The dispatcher uses exit code `75` for `REMOTE_EXECUTION_REQUIRED`; this is a handoff signal, not a source-level failure.

### Generic and GitHub flow

```text
input URL
→ execution dispatcher
→ canonicalize / resolve primary resource
→ derive source identity
→ dedup/create-update resolution
→ read authoritative primary evidence
→ analyze
→ validate
```

For GitHub, URL variants resolve to one `github:{owner}/{repo}` identity. Normal web URLs remove fragments and known tracking parameters while preserving meaningful query parameters.

### Threads flow

Before create/update resolution, Threads must produce a complete accepted source:

```text
share / arbitrary part
→ canonical target
→ exact post extraction
→ strict conversation graph
→ root + same-author chain
→ n/N completeness
→ browser evidence when needed
→ Phase 7 semantic continuation/root-only recovery only when eligible
→ root canonical URL + threads:{root_shortcode}
→ dedup/create-update
→ source-change comparison
```

Successful output includes `source_document.parts[]` and `source_document.combined_text`. Formal analysis uses `combined_text`, never just the originally shared part.

## 3. Execution backend policy

Provider routing answers **what pipeline must run**. Execution routing answers **where it runs**.

Core invariant:

```text
execution/runtime failure != source unavailable
```

Do not classify a public source as unavailable merely because the current session lacks shell, Node/npm, outbound network, Playwright/Chromium, or an LLM endpoint.

Execution order:

```text
LocalBackend
↓ if unavailable
Repository-defined Remote Ingest
↓ if unavailable / blocked
Existing Card / accepted snapshot only for identity/history
↓
INGESTION_BLOCKED if no approved backend can produce accepted current evidence
```

Use these failure classes consistently:

- `LOCAL_EXECUTION_UNAVAILABLE`
- `REMOTE_EXECUTION_UNAVAILABLE`
- `SOURCE_EXTRACTION_FAILED`
- `SOURCE_INCOMPLETE`
- `INGESTION_BLOCKED`
- `SOURCE_UNAVAILABLE` only for source-level unavailability established by a viable backend

A managed Copilot policy/auth/CLI/timeout/output/invalid-response failure is a remote execution capability failure, even when the Threads orchestrator wraps it inside an incomplete-conversation error. It must be reported as `REMOTE_EXECUTION_UNAVAILABLE`, not as evidence that the public source itself is incomplete. A semantic judgement that actually runs but then fails the deterministic Phase 7 gate may remain `SOURCE_INCOMPLETE`.

No backend failure, blocked ingestion, incomplete/ambiguous source, or identity mismatch may create/update a Card or advance accepted source state.

## 4. Phase 8B Remote Ingest

The permanent remote backend is:

```text
.github/workflows/remote-ingest.yml
```

Ordinary ingestion must not invent ad-hoc workflows.

### Request branch protocol

1. Re-read latest `main`.
2. Create `runtime/ingest/{request_id}` from that exact `main` commit.
3. Add exactly one request file:

```text
.runtime/requests/{request_id}.json
```

with:

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
- operation: only `resolve`;
- URL: absolute HTTP(S);
- request branch must not modify source code, workflow code, Cards, or machine-owned state.

The workflow executes trusted code from `main` and sparse-checks the request branch separately as data. It installs Node 24, repository dependencies, and Chromium.

### Result artifact

Each validated request produces:

```text
remote-ingest-{request_id}
└── remote-ingest-result.json
```

with one-day retention. Before consumption require:

```text
schema_version == 1
request_id == submitted request_id
execution.backend == github_actions
execution.status == success
```

On success, use envelope `result` as the formal resolver/preflight output. Failure envelopes remain fail closed. The workflow attempts to delete the temporary request branch; request transport must never merge into `main`.

## 5. Phase 8C Managed Threads ranker

Remote Ingest includes a repository-managed Phase 7 semantic ranker using **GitHub Copilot CLI**. The managed path is intentionally separate from local provider-neutral rankers.

Managed profile:

```text
provider: github_copilot
adapter: copilot_cli
agent: threads-continuation-ranker
model_selector: auto
auth: workflow GITHUB_TOKEN → child COPILOT_GITHUB_TOKEN
permission: copilot-requests: write
```

`auto` is a trusted repository-controlled Copilot CLI selector. It allows the CLI to choose a model that is currently available and allowed by the organization instead of pinning ingestion to a model that may later be deprecated or disabled. Current provenance records the selector as `auto`; it does not claim knowledge of the underlying model selected internally by Copilot.

The workflow installs `@github/copilot`, then invokes the ranker non-interactively with the trusted selector and custom agent. The request branch cannot choose model selector, agent, prompt, token, executable code, or tool permissions.

### Least-privilege execution

The `resolve` job that performs browser extraction and semantic ranking receives only:

```text
contents: read
copilot-requests: write
```

It does **not** receive Repository contents-write permission. Temporary-branch deletion is a separate `cleanup` job with `contents: write` and no model request permission.

`GITHUB_TOKEN` is injected only into the mandatory-preflight step. The ranker child receives it as `COPILOT_GITHUB_TOKEN` through a deliberately whitelisted environment. Arbitrary workflow secrets/environment variables are not forwarded.

### Ranker isolation

The Copilot child process runs in a newly created temporary directory with:

- an isolated `HOME` and `COPILOT_HOME`;
- only the trusted `.github/agents/threads-continuation-ranker.agent.md` profile copied into the temporary workspace;
- custom-agent `tools: []`, so shell, file, URL, MCP, memory, GitHub and other tools are unavailable to the semantic classifier;
- source evidence passed through stdin, not interpolated into a shell command;
- bounded stdout, timeout, and temporary-directory cleanup.

Threads source text remains untrusted quoted data. The custom agent may classify only the supplied root/candidates and must return one JSON judgement object.

### Acceptance authority and provenance

Copilot supplies only semantic judgement. Existing Phase 7 deterministic candidate filtering and acceptance gates remain authoritative. `n/N` conflicts, known missing parts, structural ambiguity, low confidence, weak metadata evidence, invalid chronology, incomplete root-only labels, invalid JSON, timeout, CLI failure, policy/auth failure, or model failure all remain fail closed.

Accepted inferred sources preserve:

```text
thread.verification = llm_assisted
thread.recovery.ranker.method = github_copilot_cli
thread.recovery.ranker.provider = github_copilot
thread.recovery.ranker.model = auto
thread.recovery.ranker.agent = threads-continuation-ranker
```

Remote execution metadata reports:

```text
runner = remote-ingest-v3
managed_ranker = github_copilot_cli
managed_ranker_model = auto
```

If organization policy blocks Copilot CLI, the safe nested cause is `THREADS_CONTINUATION_COPILOT_POLICY_DENIED` and the remote result is `REMOTE_EXECUTION_UNAVAILABLE`. This is an execution activation problem, not source incompleteness.

No credential is stored in the result artifact. Failure envelopes may expose safe nested `cause_code` / redacted bounded `cause_message` diagnostics without exposing tokens or raw provider payloads.

Local execution remains provider-neutral. It may inject `continuationRanker` or use the existing OpenAI-compatible environment contract; Phase 8C does not force local callers onto Copilot CLI.

## 6. Read primary evidence

Never write substantive analysis from a slug, search snippet, or model memory. Read authoritative source material.

For Threads, use the complete accepted `source_document`. When recovery is LLM-assisted, preserve the exact inferred status and `thread.verification = llm_assisted`; do not describe it as a native Threads graph verification.

If current primary evidence cannot be read after execution routing is exhausted, do not fabricate a Card.

## 7. Create/update, ownership, snapshot

Create mode uses the resolver `suggested_path` and the canonical template. Update mode preserves stable `id`, `created_at`, path, all user overrides, `## 使用者備註`, and prior changelog history.

For existing Cards run:

```bash
npm run validate:ownership -- <existing_path>
```

All writes require:

```bash
npm run validate
```

Source/execution tooling changes additionally require:

```bash
npm test
```

For Threads only, after Card create/update and validation succeed, advance accepted state when appropriate:

```bash
npm run ingest:snapshot -- <Threads URL>
```

Preflight itself remains read-only. Failed/incomplete/ambiguous ingestion never advances the snapshot.

## 8. Commit and report

Knowledge commits use `knowledge: add ...` / `knowledge: update ...`; infrastructure uses conventional `feat:`, `fix:`, `test:`, `docs:`, or `chore:` prefixes.

Do not report completion until required repository writes, tests/validation, push, and production workflow checks have actually succeeded.
