# Phase 3 — Website Architecture

## Goal

Render the repository's Knowledge Cards as a public, searchable technology radar without creating a second content database.

The source of truth remains:

```text
content/knowledge/**/*.md
```

The `docs/` directory is only the VitePress presentation layer.

## Runtime model

```text
content/knowledge/**/*.md
        │
        ├─ docs/knowledge.data.js
        │      └─ homepage metadata projection
        │
        └─ docs/knowledge/[id].paths.js
               └─ dynamic detail routes + raw Markdown content

                         ↓
                    VitePress
                         ↓
                  static website
```

No generated Markdown copy is committed under `docs/knowledge/`.

## Homepage

`docs/index.md` mounts `KnowledgeRadar.vue`.

The radar provides:

- full-text client-side filtering over title, summary, source type, categories, tags and actions
- fixed multi-category navigation
- dedicated Tag filter
- Action filter
- relevance dimension selector
- minimum relevance score from 1 through 5
- sorting by relevance, update date or title
- automatically calculated summary statistics
- responsive card grid

The selected relevance dimension changes both filtering and the score displayed on each card.

## Relevance dimensions

The UI consumes the effective relevance values from the Knowledge Card ownership model:

```text
effective dimension = user override ?? AI score
```

Available dimensions:

- Overall
- AI RD
- AOI × AI
- LLM / Agent
- SillyTavern / AI RPG
- Image Gen

## Effective user overrides

The data projection layer resolves user-owned fields before sending metadata to the UI.

For wrapper values:

```text
effective = user ?? ai
```

For relevance, resolution happens independently per dimension.

This means a manual user correction is reflected on the website without changing the AI-owned score.

## Dynamic detail pages

`docs/knowledge/[id].paths.js` reads each real Knowledge Card and generates:

```text
/knowledge/{card.id}
```

The route params contain only lightweight metadata used by the detail header. The full Markdown body is supplied using VitePress dynamic route `content`, so the source article is not serialized into route params.

`docs/knowledge/[id].md` contains the common page template:

1. structured metadata panel
2. raw Knowledge Card Markdown content

The detail panel exposes:

- status/source type
- categories
- actions
- all six relevance scores
- tags
- created / updated / checked dates
- original source link
- exact GitHub edit link to the source Knowledge Card

## Search

Two search surfaces exist:

1. Radar filtering on the homepage, optimized for metadata and quick narrowing.
2. VitePress local search in the navigation bar, intended for full static page content.

No server-side or vector search is used in Phase 3.

## GitHub Pages base path

The current repository is a project Pages site, therefore VitePress is configured with:

```js
base: '/Knowledge-Card/'
```

Internal custom links use VitePress `withBase()` so the same components work under the repository sub-path.

`cleanUrls` is enabled because GitHub Pages supports mapping extensionless paths to generated `.html` pages.

## Theme

The site extends VitePress DefaultTheme rather than replacing it completely.

Custom code lives under:

```text
docs/.vitepress/theme/
├── index.js
├── custom.css
└── components/
    ├── KnowledgeRadar.vue
    └── KnowledgeMeta.vue
```

This retains VitePress navigation, local search, outline, dark mode and Markdown rendering while allowing a dedicated radar interface.

## Commands

```bash
npm install
npm run docs:dev
npm run docs:build
npm run docs:preview
```

Repository tests also cover the site data projection and route generation:

```bash
npm test
```

## Phase boundary

Phase 3 builds the website application and static-generation model.

Phase 4 is responsible for automated validation/build/deployment with GitHub Actions and enabling GitHub Pages deployment.
