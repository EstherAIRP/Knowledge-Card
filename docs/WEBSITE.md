# Website Architecture

## Goal

Render the repository's Knowledge Cards and generated Concept Graph as a public, searchable technology radar without creating a second content database.

Content source of truth remains:

```text
content/knowledge/**/*.md
```

Generated graph indexes remain rebuildable presentation/query data:

```text
data/relations.json
data/concepts.json
```

The `docs/` directory is the VitePress presentation layer.

## Runtime model

```text
content/knowledge/**/*.md
        │
        ├─ docs/knowledge.data.js
        │      └─ homepage metadata projection
        │
        ├─ docs/knowledge/[id].paths.js
        │      └─ Knowledge Card detail + semantic relations + Concepts
        │
        ├─ data/concepts.json
        │      ├─ docs/concepts/[id].paths.js
        │      └─ docs/graph.data.js
        │
        └─ data/relations.json
               └─ docs/graph.data.js

                         ↓
                    VitePress
                         ↓
                  static website
```

No generated Markdown copy of Knowledge Cards is committed under `docs/knowledge/`.

## Homepage — Knowledge Radar

`docs/index.md` mounts `KnowledgeRadar.vue`.

The radar provides metadata filtering over title, summary, source type, categories, tags and actions; relevance dimension selection; minimum score filtering; sorting; automatically calculated statistics; and a responsive Card grid.

The selected relevance dimension changes both filtering and the score displayed on each Card.

## Effective user overrides

The data projection layer resolves user-owned fields before sending metadata to the UI.

```text
effective wrapper value = user ?? ai
```

Relevance is resolved independently per dimension. A manual correction therefore appears on the website without overwriting AI-owned values.

## Knowledge Card detail routes

`docs/knowledge/[id].paths.js` creates:

```text
/knowledge/{card.id}
```

Each route projects:

- Card metadata and full Markdown body;
- Phase 2 typed Card↔Card semantic relations;
- Phase 3 Card↔Concept mappings with strength/evidence;
- source/edit/navigation links.

`KnowledgeConcepts.vue` provides the Concept neighborhood and links each node to its Concept detail page or the full graph.

## Concept detail routes

`docs/concepts/[id].paths.js` creates:

```text
/concepts/{concept.id}
```

A Concept page exposes:

- stable Concept ID, type and origin;
- description;
- supporting Knowledge Cards;
- mapping strength and Category/Tag evidence;
- Concept↔Concept neighbors derived from cross-Card co-occurrence;
- navigation back to `/graph`.

The route is generated directly from `data/concepts.json`; Concept pages do not create a second manually maintained Concept article store.

## Knowledge Graph

`docs/graph.md` mounts `KnowledgeGraph.vue`, backed by `docs/graph.data.js`.

The graph data loader unifies three edge families:

```text
Card ↔ Concept       has_concept
Concept ↔ Concept    co_occurs_with
Card ↔ Card          Phase 2 semantic relation
```

The default visualization uses deterministic concentric layout:

```text
outer ring = Knowledge Cards
inner ring = Concepts
center     = Knowledge Radar
```

This geometry is a presentation layout and does not claim that visual distance equals embedding distance.

The graph supports:

- Concept/Card keyword search;
- node-kind filtering;
- optional Card↔Card semantic edge display;
- direct navigation from graph nodes to Card/Concept detail routes;
- responsive horizontal scrolling on narrow screens.

The visualization is implemented with Vue + SVG and adds no D3/Cytoscape runtime dependency.

## Search

Three navigation/search surfaces exist:

1. Homepage Radar metadata filtering.
2. `/graph` Concept/Card graph filtering.
3. VitePress local search over static page content.

No server-side search service is required for site operation.

## GitHub Pages base path

The repository is a project Pages site, therefore VitePress uses:

```js
base: '/Knowledge-Card/'
```

Custom links use `withBase()` so routes work under the repository sub-path. `cleanUrls` remains enabled.

## Theme components

Custom presentation code lives under:

```text
docs/.vitepress/theme/components/
├── KnowledgeRadar.vue
├── KnowledgeMeta.vue
├── KnowledgeRelations.vue
├── KnowledgeConcepts.vue
├── ConceptPage.vue
└── KnowledgeGraph.vue
```

The site still extends VitePress DefaultTheme, retaining navigation, local search, outline, dark mode and Markdown rendering.

## Build commands

Graph data must exist before static generation:

```bash
npm run concepts:build
npm run concepts:validate
npm run docs:build
npm run verify:site
```

`verify:site` requires homepage, `/graph`, every Knowledge Card page, every Concept page, and JS/CSS assets to exist in the final VitePress output.
