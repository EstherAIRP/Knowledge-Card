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

- [x] URL canonicalization and deduplication
- [x] Source analysis workflow
- [x] Existing-card merge/update ownership rules
- [x] Automated schema/content validation command
- [x] User-owned state protection command
- [x] Ingestion resolver tests
- [x] First real end-to-end Knowledge Card
- [x] Commit/push workflow through Codex/GitHub

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
├── package.json
├── config/
│   └── taxonomy.yaml
├── content/
│   └── knowledge/
│       ├── README.md
│       └── 2026/
│           └── github-intuition-lab-personal-model.md
├── docs/
│   └── INGESTION.md
├── profile/
│   └── public-profile.yaml
├── schema/
│   └── knowledge-card.schema.json
├── scripts/
│   ├── lib/knowledge.mjs
│   ├── resolve-source.mjs
│   ├── validate-content.mjs
│   └── check-ownership.mjs
├── templates/
│   └── knowledge-card.example.md
└── tests/
    └── ingestion.test.mjs
```

## Phase 2 commands

Install dependencies once:

```bash
npm install
```

Resolve a URL before ingestion:

```bash
npm run ingest:resolve -- https://github.com/Intuition-Lab/personal-model
```

The resolver returns a machine-readable plan containing `canonical_url`, `source_identity`, stable `id`, `mode` (`create` or `update`), and the target path.

Validate every Knowledge Card and repository contract:

```bash
npm run validate
```

Before committing an update to an existing card, verify that AI did not overwrite user-owned state:

```bash
npm run validate:ownership -- content/knowledge/2026/<card>.md
```

Run resolver/ownership unit tests:

```bash
npm test
```

See `docs/INGESTION.md` for the complete Phase 2 operating flow.

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

## Current ingestion experience

```text
URL
 → npm run ingest:resolve
 → read primary source
 → create/update analysis
 → preserve user-owned state
 → npm run validate
 → for updates: npm run validate:ownership
 → commit and push
 → report the result
 → Phase 3: render on public website
```

The first real ingestion fixture is `content/knowledge/2026/github-intuition-lab-personal-model.md`.
