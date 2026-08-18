# Knowledge Card

AI-curated personal technology knowledge radar built on GitHub.

Knowledge Card turns a technical source URL into a structured, versioned Knowledge Card, preserves explicit user overrides, derives Card-to-Card and Concept relationships, and renders the repository as a searchable VitePress knowledge radar. The repository is the source of truth; AI/Codex performs ingestion and maintenance; VitePress is the presentation layer.

Public site: https://estherairp.github.io/Knowledge-Card/

## Documentation

Use the documentation router instead of guessing which file owns a rule:

- [Documentation router](docs/DOCUMENTATION.md) — task-oriented entry point across Runtime, repository rules, ingestion, schemas, automation, graphs, and website documentation.
- [Document Authority Map](docs/AUTHORITY_MAP.md) — records the primary authority for each rule and the boundary between documentation, configuration, and executable code.

`docs/index.md` is the VitePress public homepage. It is intentionally not the repository documentation index.

## What the system does

```text
technical URL
   ↓
runtime + source preflight
   ↓
npm run ingest:dispatch -- <URL>
   ↓
provider route
   ├─ generic / GitHub / paper / docs / tool
   └─ Threads → complete-source contract
   ↓
LocalBackend → RemoteBackend when required
   ↓
accepted source + stable resolver identity
   ↓
create / update Knowledge Card
   ↓
preserve user-owned state
   ↓
validation + commit/push
   ↓
GitHub Actions
   ├─ semantic Card relations
   ├─ Concept Graph
   └─ VitePress build / Pages deployment
```

The high-level ingestion entry is `ingest:dispatch`. `ingest:resolve` remains the lower-level resolver/debug entry used by approved execution backends.

## Core capabilities

- URL canonicalization, stable source identity, and duplicate prevention.
- Provider-aware ingestion with a strict Threads completeness path.
- Local execution with Repository-defined Remote Ingest fallback.
- Structured Knowledge Card analysis with controlled taxonomy and relevance scoring.
- AI-owned state separated from explicit user overrides.
- Accepted Threads source snapshots and change detection.
- Card-to-Card semantic relations using local embeddings plus optional relation classification.
- Concept Graph generation from the Knowledge Card collection.
- Searchable VitePress Knowledge Radar with Card, graph, and Concept views.
- CI/CD validation, generated-index maintenance, and GitHub Pages deployment.
- Documentation governance checks that prevent known contract/index drift from returning.

## Repository structure

The tree below is intentionally high-level; use [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md) for detailed navigation.

```text
Knowledge-Card/
├── .github/
│   ├── agents/
│   │   └── threads-continuation-ranker.agent.md
│   └── workflows/
│       ├── validate.yml
│       ├── deploy-pages.yml
│       ├── remote-ingest.yml
│       ├── update-relations.yml
│       └── rebuild-relations.yml
├── AGENTS.md
├── README.md
├── package.json
├── config/
│   ├── AGENTS.md
│   ├── taxonomy.yaml
│   ├── relation-config.yaml
│   ├── relation-overrides.yaml
│   └── concept-config.yaml
├── content/
│   └── knowledge/
├── data/
│   ├── AGENTS.md
│   ├── embeddings.json
│   ├── relations.json
│   └── concepts.json
├── docs/
│   ├── index.md
│   ├── DOCUMENTATION.md
│   ├── AUTHORITY_MAP.md
│   ├── INGESTION.md
│   ├── THREADS_INGESTION.md
│   ├── AUTOMATION.md
│   ├── RELATIONS.md
│   ├── CONCEPTS.md
│   ├── WEBSITE.md
│   └── .vitepress/
├── profile/
│   └── public-profile.yaml
├── prompts/
│   ├── RUNTIME.md
│   └── CHANGELOG.md
├── schema/
│   ├── knowledge-card.schema.json
│   └── threads-continuation-judgement.schema.json
├── scripts/
│   ├── ingest-dispatch.mjs
│   ├── resolve-source.mjs
│   ├── check-documentation.mjs
│   ├── validate-content.mjs
│   ├── check-ownership.mjs
│   └── lib/
├── state/
│   ├── AGENTS.md
│   └── source-snapshots/
├── templates/
│   └── knowledge-card.example.md
└── tests/
```

## Install

```bash
npm install
```

Node.js 20+ is supported; GitHub Actions currently uses Node.js 24.

## Ingestion commands

Use the dispatcher for normal ingestion:

```bash
npm run ingest:dispatch -- <URL>
```

Use the resolver directly only for lower-level identity/debug work:

```bash
npm run ingest:resolve -- <URL>
```

Threads browser support can be installed locally when needed:

```bash
npm run threads:browser:install
```

See [docs/INGESTION.md](docs/INGESTION.md) for the cross-provider execution contract and [docs/THREADS_INGESTION.md](docs/THREADS_INGESTION.md) for the Threads-only completeness contract.

## Validation commands

Validate Knowledge Cards, schema/taxonomy alignment, source identities, and duplicates:

```bash
npm run validate
```

Before committing an update to an existing Card, verify that AI did not overwrite user-owned state:

```bash
npm run validate:ownership -- content/knowledge/2026/<card>.md
```

Run source/tooling and repository unit tests:

```bash
npm test
```

Check documentation governance, required authority links, deprecated filenames, README ingestion entry, and local governance links:

```bash
npm run docs:check
```

`docs:check` runs in both pull-request validation and the `main` Pages build gate.

## Knowledge Graph commands

The repository maintains generated semantic indexes under `data/`.

```bash
npm run embeddings:build
npm run embeddings:validate
npm run relations:build
npm run relations:validate
npm run concepts:build
npm run concepts:validate
```

A complete rebuild is available through:

```bash
npm run relations:rebuild
```

See [docs/RELATIONS.md](docs/RELATIONS.md) and [docs/CONCEPTS.md](docs/CONCEPTS.md) for the two graph layers.

## Website commands

Start the local VitePress server:

```bash
npm run docs:dev
```

Build and verify the production site:

```bash
npm run docs:build
npm run verify:site
```

Preview the production build:

```bash
npm run docs:preview
```

See [docs/WEBSITE.md](docs/WEBSITE.md) for presentation architecture and [docs/AUTOMATION.md](docs/AUTOMATION.md) for CI/CD and Pages behavior.

## CI/CD and automation

Current workflows are:

- [validate.yml](.github/workflows/validate.yml) — PR/non-main test, validation, documentation guardrail, VitePress build, and output verification.
- [deploy-pages.yml](.github/workflows/deploy-pages.yml) — `main` validation/build gate and GitHub Pages deployment.
- [remote-ingest.yml](.github/workflows/remote-ingest.yml) — trusted Remote Ingest execution when the local runtime lacks required capability.
- [update-relations.yml](.github/workflows/update-relations.yml) — incremental embedding/relation/Concept index maintenance.
- [rebuild-relations.yml](.github/workflows/rebuild-relations.yml) — scheduled/manual full Knowledge Graph rebuild.

Executable workflow YAML is authoritative for what actually runs; [docs/AUTOMATION.md](docs/AUTOMATION.md) explains the operating model.

## Data and ownership model

Knowledge Cards under `content/knowledge/` are the canonical authored knowledge artifacts. Generated indexes under `data/` and source snapshots under `state/` have their own scoped ownership contracts.

For fields that support user overrides:

```text
effective_value = user_override ?? ai_value
```

AI refreshes may update AI-owned values but must preserve explicit user-owned overrides and `## 使用者備註` unless the user explicitly asks to change them.

## Public-safety boundary

This repository is intended for public publishing. Personalized relevance and recommendations may use only the context allowed by `profile/public-profile.yaml`, existing public Knowledge Cards where permitted, and the public source being analyzed.

Private chat history, employer/internal information, non-public projects, financial information, relationships/family information, or remembered private facts must not be inferred into public repository content.

## Contracts at a glance

```text
prompts/RUNTIME.md
→ runtime/task orchestration

AGENTS.md
→ repository write/ownership/validation contract

docs/INGESTION.md
→ cross-provider ingestion and execution

docs/THREADS_INGESTION.md
→ Threads source/completeness semantics

schema/knowledge-card.schema.json
→ Knowledge Card machine shape

schema/threads-continuation-judgement.schema.json
→ Threads Phase 7 model-output shape

config/taxonomy.yaml
→ controlled vocabulary

profile/public-profile.yaml
→ public personalization boundary
```

When one document needs a rule owned elsewhere, it should summarize only the invariant it needs and link to the primary authority rather than copy the complete rule.
