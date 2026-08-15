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

## 2. Mandatory preflight

Before authoring any Card, run:

```bash
npm run ingest:resolve -- <URL>
```

Use its `canonical_url`, `source_identity`, stable `id`, `mode`, `existing_path` and `suggested_path` as the mechanical create/update contract.

### Generic and GitHub sources

GitHub repository variants resolve to one `github:{owner}/{repo}` identity. Normal web URLs remove fragments and known tracking parameters while preserving meaningful query parameters. The agent then opens and reads the authoritative primary source.

For non-Threads sources the normal flow is:

```text
input URL
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
Repository-defined remote execution backend
↓ if unavailable / blocked
Existing alias or accepted snapshot lookup for identity/history only
↓
INGESTION_BLOCKED if no allowed backend can produce an accepted current source
```

### Local backend

Use the current runtime first when it can execute the repository contract. If dependencies or browser binaries are missing and installation is allowed, install them before declaring the local backend unavailable.

Local capability failures should be reported as `LOCAL_EXECUTION_UNAVAILABLE`, not `SOURCE_UNAVAILABLE`.

### Remote backend

If local execution is unavailable and the repository defines an approved remote execution backend, use it when the agent has the required repository/Actions access. A remote backend must execute the same provider route and completeness contract; it is not permission to weaken ingestion rules.

Phase 8A defines the backend contract only. Until the permanent remote execution harness is implemented in a later phase, do not silently invent an ad-hoc workflow and present it as repository-standard behavior. If no repository-defined remote backend is available, report `REMOTE_EXECUTION_UNAVAILABLE` and then `INGESTION_BLOCKED` when no other allowed backend can complete the request.

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
- `REMOTE_EXECUTION_UNAVAILABLE` — approved remote execution is absent, inaccessible or unable to execute the request.
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

Documentation-only execution-contract changes do not require source-tooling tests, but repository CI/validation must still pass.

## 8. Commit and report

Preferred Card commits are `knowledge: add <Title>` / `knowledge: update <Title>`. Infrastructure uses `feat:`, `fix:`, `test:`, `docs:` or `chore:`. Do not report success until repository writes and required validation have succeeded.