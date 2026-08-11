# Knowledge Card

AI-curated personal technology knowledge radar built on GitHub.

Knowledge Card turns a source URL into a structured, versioned knowledge artifact that can later be rendered as a public visual website. The repository is the source of truth; AI/Codex performs ingestion and maintenance; a later VitePress phase will provide the presentation layer.

## Product goals

- Accept a URL as the primary ingestion input.
- Store `URL + metadata + summary + detailed analysis + personalized recommendations` rather than copying the full source.
- Support multi-category classification and free-form tags.
- Score relevance using an overall score plus five fixed dimensions.
- Attach explicit action labels such as `TRY`, `BUILD`, or `WATCH`.
- Update an existing Knowledge Card when the same canonical source is submitted again.
- Preserve user-owned overrides when AI re-analyzes a card.
- Keep all published personalization within the boundaries of `profile/public-profile.yaml`.

## Phase status

### Phase 1 — Repository foundation

- [x] Repository structure
- [x] AI operating contract (`AGENTS.md`)
- [x] Public personalization profile
- [x] Knowledge Card JSON Schema
- [x] Taxonomy definition
- [x] Example Knowledge Card

### Phase 2 — Ingestion

- [ ] URL canonicalization and deduplication
- [ ] Source analysis workflow
- [ ] Existing-card merge/update workflow
- [ ] Validation command
- [ ] Commit/push workflow

### Phase 3 — Website

- [ ] VitePress application
- [ ] Knowledge cards and detail pages
- [ ] Category / tag / relevance / action filters
- [ ] Search

### Phase 4 — Automation

- [ ] GitHub Actions validation
- [ ] GitHub Pages deployment

## Repository structure

```text
Knowledge-Card/
├── AGENTS.md
├── README.md
├── config/
│   └── taxonomy.yaml
├── content/
│   └── knowledge/
│       └── README.md
├── profile/
│   └── public-profile.yaml
├── schema/
│   └── knowledge-card.schema.json
└── templates/
    └── knowledge-card.example.md
```

## Core data-governance rule

AI-generated state and user-owned state are intentionally separate.

For fields that support overrides, the effective value is:

```text
effective_value = user_override ?? ai_value
```

A later AI refresh may update `ai` values, but it must never silently overwrite an existing `user` override.

## Public-safety boundary

The site is designed for public publishing. Personalized analysis may use only the information explicitly listed in `profile/public-profile.yaml`. Private chat history, employer/internal information, personal relationships, salary, private projects, or other non-public memory must not be inferred into repository content.

## Canonical taxonomy

See `config/taxonomy.yaml` for the fixed categories, relevance dimensions, action labels, and status values. AI may generate free-form tags, but it may not invent new top-level categories or action labels during ingestion.

## Knowledge Card schema

Every card uses YAML frontmatter followed by Markdown analysis. The normative machine-readable contract is `schema/knowledge-card.schema.json`; the authoring example is `templates/knowledge-card.example.md`.

## Planned ingestion experience

```text
URL
 → read source
 → canonicalize identity
 → find existing card
 → analyze
 → classify / tag / score / recommend action
 → merge user overrides
 → validate
 → create or update Markdown
 → commit and push
 → later: rebuild public website
```
