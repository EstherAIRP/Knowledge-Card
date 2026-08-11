# Phase 2 — Ingestion Pipeline

This document defines the executable ingestion flow for Knowledge Card. The AI agent performs source reading and analysis; repository scripts enforce deterministic identity, deduplication, schema validity, and user-owned state preservation.

## Design boundary

Phase 2 deliberately does **not** call a separate LLM API. Codex/AI is the reasoning and source-analysis layer. Repository tooling is responsible for the mechanical invariants that should not depend on model judgment.

```text
AI / Codex
  ├─ read source
  ├─ understand architecture
  ├─ classify / tag / score
  └─ write analysis

Repository scripts
  ├─ canonicalize URL
  ├─ derive stable source identity
  ├─ detect create vs update
  ├─ validate schema/contracts
  ├─ detect duplicates
  └─ protect user-owned state
```

## 1. Resolve the source

Run before authoring:

```bash
npm run ingest:resolve -- <URL>
```

Example:

```bash
npm run ingest:resolve -- https://github.com/Intuition-Lab/personal-model?tab=readme-ov-file
```

Representative output:

```json
{
  "source_type": "github",
  "canonical_url": "https://github.com/Intuition-Lab/personal-model",
  "source_identity": "github:intuition-lab/personal-model",
  "id": "github-intuition-lab-personal-model",
  "mode": "update",
  "existing_path": "content/knowledge/2026/github-intuition-lab-personal-model.md",
  "suggested_path": "content/knowledge/2026/github-intuition-lab-personal-model.md"
}
```

For GitHub repository URLs, repository subpaths, query strings, fragments, trailing slashes, and `.git` variants resolve to the repository identity.

For normal web URLs, the resolver removes fragments and known tracking parameters such as `utm_*`, `fbclid`, and `gclid`, while preserving query parameters that may affect the actual resource.

The resolver is intentionally conservative. The AI still owns semantic source classification and may correct an inferred non-GitHub `source.type` if the actual source is, for example, a paper rather than a general article.

## 2. Read primary evidence

Before writing substantive analysis:

- open the primary URL;
- for GitHub, read the repository metadata and README at minimum;
- open architecture/security/docs/source files when a technical claim requires them;
- distinguish verified facts from inference;
- do not use a search snippet or remembered description as the source of truth.

If primary evidence cannot be read sufficiently, stop with `SOURCE_UNAVAILABLE` rather than fabricating a card.

## 3. Create or update

### Create mode

Use `templates/knowledge-card.example.md` and write the result to the resolver's `suggested_path`.

Stable fields are established at creation:

- `id`
- `created_at`
- file path
- `source.identity`

### Update mode

Read the existing card completely before editing it. Preserve:

- stable `id`;
- `created_at`;
- file path;
- every `user` override;
- `## 使用者備註` verbatim;
- previous changelog history.

Refresh AI-owned analysis from current source evidence. Set `last_checked_at` on every real re-check. Change `updated_at` and append a changelog entry only for substantive knowledge changes.

## 4. Validate user ownership on updates

Before committing an edited existing card:

```bash
npm run validate:ownership -- content/knowledge/2026/<card>.md
```

The command compares the working-tree card with `HEAD:<path>` and fails if an update changed:

- `id`;
- `created_at`;
- `classification.categories.user`;
- `classification.tags.user`;
- `relevance.user`;
- `actions.user`;
- `status.user`;
- `## 使用者備註`.

New files are skipped because there is no previous user-owned state to preserve.

## 5. Validate repository content

Run:

```bash
npm run validate
```

Validation covers:

- JSON Schema compliance;
- taxonomy/schema contract drift;
- required body sections and order;
- H1/frontmatter title agreement;
- canonical source identity consistency;
- duplicate `id`;
- duplicate `source.identity`;
- duplicate `canonical_url`;
- date ordering.

A known-invalid card must not be committed as a successful ingestion.

## 6. Tests

Run:

```bash
npm test
```

Phase 2 tests cover:

- equivalent GitHub URL variants;
- tracking-parameter cleanup;
- existing-card detection;
- user-owned override/note protection.

## 7. Commit and report

Preferred commit messages:

```text
knowledge: add <Title>
knowledge: update <Title>
```

After the push succeeds, report:

- added or updated;
- title;
- effective categories;
- overall relevance;
- actions;
- important change for updates;
- repository path.

Do not claim a repository write succeeded before the write actually completes.

## First end-to-end fixture

Phase 2 was bootstrapped using:

```text
https://github.com/Intuition-Lab/personal-model
```

The resulting real card is:

```text
content/knowledge/2026/github-intuition-lab-personal-model.md
```

It validates the intended multi-category, free-tag, relevance-vector, public-profile, action, and source-identity data model before Phase 3 builds the visual website around it.
