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

## 3. Read primary evidence

Never write substantive analysis from a slug, search snippet or model memory. For GitHub read repository metadata and README at minimum; inspect architecture/security/docs/source when needed. For papers/articles read the actual authoritative source. Separate verified facts from inference.

For Threads, the complete `source_document` returned by the mandatory resolver is the primary text/provenance contract. Do not downgrade it to only the originally shared part. When recovery is LLM-assisted, preserve `thread.verification = llm_assisted` and the exact inferred status (`INFERRED_THREAD_HIGH_CONFIDENCE` or `INFERRED_SINGLE_POST_HIGH_CONFIDENCE`) rather than describing the graph as natively verified.

If primary evidence cannot be read sufficiently, report `SOURCE_UNAVAILABLE` or the concrete extraction failure.

## 4. Create or update

Create mode uses `templates/knowledge-card.example.md` at `suggested_path`. Update mode reads the existing card completely and preserves stable `id`, `created_at`, file path, all user overrides, `## 使用者備註` and prior changelog history.

Refresh only AI-owned analysis from current evidence. Set `last_checked_at` on real re-checks; change `updated_at` / changelog only for substantive knowledge changes.

For Threads only, after a successful create/update and validation, advance the accepted source snapshot with:

```bash
npm run ingest:snapshot -- <Threads URL>
```

Do not run the Threads snapshot command for non-Threads sources.

## 5. Ownership validation

Before committing an existing-card update:

```bash
npm run validate:ownership -- <existing_path>
```

The check protects stable fields, user overrides and `## 使用者備註`.

## 6. Repository validation

Run:

```bash
npm run validate
```

Validation covers schema/taxonomy contract drift, body structure, title consistency, source identity normalization, duplicate id/identity/canonical URL and date ordering.

When ingestion/source tooling changes, also run:

```bash
npm test
```

## 7. Commit and report

Preferred Card commits are `knowledge: add <Title>` / `knowledge: update <Title>`. Infrastructure uses `feat:`, `fix:`, `test:`, `docs:` or `chore:`. Do not report success until repository writes and required validation have succeeded.
