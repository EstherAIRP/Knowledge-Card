# Ingestion Pipeline

Knowledge Card separates semantic analysis from deterministic repository invariants. AI/Codex reads and analyzes primary evidence; repository scripts resolve identities, deduplicate, validate schema/taxonomy and protect user-owned state.

## 1. Mandatory preflight

Before authoring any Card, run:

```bash
npm run ingest:resolve -- <URL>
```

Use its `canonical_url`, `source_identity`, stable `id`, `mode`, `existing_path` and `suggested_path` as the mechanical create/update contract.

### Generic and GitHub sources

GitHub repository variants resolve to one `github:{owner}/{repo}` identity. Normal web URLs remove fragments and known tracking parameters while preserving meaningful query parameters. The agent then opens and reads the authoritative primary source.

### Threads sources

Threads is source-aware. The mandatory resolver does not stop after expanding `/share/*` or `/t/*`. Before create/update resolution it must obtain a verified complete source:

```text
share / arbitrary part
→ canonical target post
→ exact post extraction
→ conversation graph
→ root + author-chain reconstruction
→ n/N completeness check
→ root canonical URL + threads:{root_shortcode}
→ dedup/create-update resolution
```

A successful Threads result includes `source_document.parts[]` and `source_document.combined_text`. Use `combined_text` as the primary article text. If the conversation is incomplete or ambiguous, stop rather than authoring from a partial post.

## 2. Read primary evidence

Never write substantive analysis from a slug, search snippet or model memory. For GitHub read repository metadata and README at minimum; inspect architecture/security/docs/source when needed. For papers/articles read the actual authoritative source. Separate verified facts from inference.

For Threads, the verified `source_document` returned by the mandatory resolver is the primary text/provenance contract. Do not downgrade it to only the originally shared part.

If primary evidence cannot be read sufficiently, report `SOURCE_UNAVAILABLE` or the concrete extraction failure.

## 3. Create or update

Create mode uses `templates/knowledge-card.example.md` at `suggested_path`. Update mode reads the existing card completely and preserves stable `id`, `created_at`, file path, all user overrides, `## 使用者備註` and prior changelog history.

Refresh only AI-owned analysis from current evidence. Set `last_checked_at` on real re-checks; change `updated_at` / changelog only for substantive knowledge changes.

## 4. Ownership validation

Before committing an existing-card update:

```bash
npm run validate:ownership -- <existing_path>
```

The check protects stable fields, user overrides and `## 使用者備註`.

## 5. Repository validation

Run:

```bash
npm run validate
```

Validation covers schema/taxonomy contract drift, body structure, title consistency, source identity normalization, duplicate id/identity/canonical URL and date ordering.

When ingestion/source tooling changes, also run:

```bash
npm test
```

## 6. Commit and report

Preferred Card commits are `knowledge: add <Title>` / `knowledge: update <Title>`. Infrastructure uses `feat:`, `fix:`, `test:`, `docs:` or `chore:`. Do not report success until repository writes and required validation have succeeded.
