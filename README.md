# Knowledge Card

AI-curated personal technology knowledge radar built on GitHub.

Knowledge Card turns a source URL into a structured, versioned knowledge artifact and renders the repository as a searchable VitePress technology radar. The repository is the source of truth; AI/Codex performs ingestion and maintenance; VitePress is only the presentation layer.

## Product goals

- Accept a URL as the primary ingestion input.
- Store `URL + metadata + summary + detailed analysis + personalized recommendations` rather than copying the full source.
- Support multi-category classification and free-form tags.
- Score relevance using an overall score plus five fixed dimensions.
- Attach explicit action labels such as `TRY`, `BUILD`, or `WATCH`.
- Update an existing Knowledge Card when the same canonical source is submitted again.
- Preserve user-owned overrides when AI re-analyzes a card.
- Keep all published personalization within the boundaries of `profile/public-profile.yaml`.
- Project all Knowledge Cards into a public searchable visual website without duplicating source content.

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

- [x] VitePress application
- [x] Build-time Knowledge Card data projection
- [x] Dynamic Knowledge Card detail pages
- [x] Category filter
- [x] Tag filter
- [x] Relevance dimension / score filter
- [x] Action filter
- [x] Metadata search and sorting
- [x] VitePress local full-page search
- [x] Effective user-override rendering
- [x] Responsive custom theme
- [x] Website projection / route tests

### Phase 4 — Automation

- [x] Pull request / branch validation workflow
- [x] Main-branch validation and production build gate
- [x] Built-site output smoke verification
- [x] GitHub Pages artifact/deployment workflow
- [ ] First-time repository Pages source enablement and confirmed live deployment

The remaining unchecked item is a GitHub repository setting: **Settings → Pages → Build and deployment → Source → GitHub Actions**. After that one-time enablement, the existing `Deploy Knowledge Radar` workflow publishes every successful `main` build.

## Repository structure

```text
Knowledge-Card/
├── .github/
│   └── workflows/
│       ├── validate.yml
│       └── deploy-pages.yml
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
│   ├── index.md
│   ├── INGESTION.md
│   ├── WEBSITE.md
│   ├── AUTOMATION.md
│   ├── knowledge.data.js
│   ├── knowledge/
│   │   ├── [id].md
│   │   └── [id].paths.js
│   └── .vitepress/
│       ├── config.mjs
│       └── theme/
│           ├── index.js
│           ├── custom.css
│           └── components/
│               ├── KnowledgeRadar.vue
│               └── KnowledgeMeta.vue
├── profile/
│   └── public-profile.yaml
├── schema/
│   └── knowledge-card.schema.json
├── scripts/
│   ├── lib/knowledge.mjs
│   ├── resolve-source.mjs
│   ├── validate-content.mjs
│   ├── check-ownership.mjs
│   └── verify-site-output.mjs
├── templates/
│   └── knowledge-card.example.md
└── tests/
    ├── ingestion.test.mjs
    └── site.test.mjs
```

## Install

```bash
npm install
```

## Ingestion commands

Resolve a URL before ingestion:

```bash
npm run ingest:resolve -- https://github.com/Intuition-Lab/personal-model
```

Validate every Knowledge Card and repository contract:

```bash
npm run validate
```

Before committing an update to an existing card, verify that AI did not overwrite user-owned state:

```bash
npm run validate:ownership -- content/knowledge/2026/<card>.md
```

Run ingestion and website projection tests:

```bash
npm test
```

See `docs/INGESTION.md` for the complete Phase 2 operating flow.

## Website commands

Start the local VitePress development server:

```bash
npm run docs:dev
```

Build the static website:

```bash
npm run docs:build
```

Verify the generated homepage, Knowledge Card detail pages, and asset bundles:

```bash
npm run verify:site
```

Preview the production build:

```bash
npm run docs:preview
```

See `docs/WEBSITE.md` for the Phase 3 website architecture and `docs/AUTOMATION.md` for CI/CD and Pages deployment.

## Website model

```text
content/knowledge/**/*.md
        │
        ├─ metadata projection → Knowledge Radar homepage
        └─ Markdown body       → dynamic detail pages
                              ↓
                           VitePress
                              ↓
                    static public website
```

`content/knowledge/` remains the only content source of truth. New or updated Cards appear in the site automatically at the next VitePress build; no generated article copy is committed under `docs/`.

## CI/CD model

```text
PR / non-main push
       ↓
Tests → Knowledge validation → VitePress build → output smoke check

main push
       ↓
Tests → Knowledge validation → VitePress build → output smoke check
       ↓
GitHub Pages artifact
       ↓
Deploy to github-pages environment
```

A failed test, invalid Knowledge Card, failed VitePress build, or missing generated detail page blocks deployment.

## Core data-governance rule

AI-generated state and user-owned state are intentionally separate.

For fields that support overrides, the effective value is:

```text
effective_value = user_override ?? ai_value
```

For relevance, that resolution occurs independently for every dimension. The website consumes the effective values, so manual user corrections take precedence without destroying the AI-generated score.

## Public-safety boundary

The site is designed for public publishing. Personalized analysis may use only the information explicitly listed in `profile/public-profile.yaml`. Private chat history, employer/internal information, personal relationships, salary, private projects, or other non-public memory must not be inferred into repository content.

## Canonical taxonomy

See `config/taxonomy.yaml` for the fixed categories, relevance dimensions, action labels, and status values. AI may generate free-form tags, but it may not invent new top-level categories or action labels during ingestion.

## Knowledge Card schema

Every card uses YAML frontmatter followed by Markdown analysis. The normative machine-readable contract is `schema/knowledge-card.schema.json`; the authoring example is `templates/knowledge-card.example.md`.

## Current end-to-end flow

```text
URL
 → npm run ingest:resolve
 → read primary source
 → create/update analysis
 → preserve user-owned state
 → npm run validate
 → for updates: npm run validate:ownership
 → commit and push
 → GitHub Actions runs tests / validation / build
 → built-output smoke check
 → GitHub Pages artifact
 → deploy public Knowledge Radar
```

The first real ingestion and UI fixture is `content/knowledge/2026/github-intuition-lab-personal-model.md`.
