# Relation Index — Phase 1

Knowledge-Card Phase 1 adds a deterministic, rebuildable Card-to-Card relation layer without changing `content/knowledge/**/*.md` into a graph database.

## Ownership model

```text
content/knowledge/**/*.md
        │
        │ source knowledge
        ▼
scripts/build-relations.mjs
        │
        ├─ effective categories
        ├─ effective tags
        ├─ high relevance dimensions
        └─ effective actions
        │
        ▼
data/relations.json          generated / disposable
        ▲
        │
config/relation-overrides.yaml   human-owned
```

`content/knowledge/` remains the source of truth for Knowledge Cards. `data/relations.json` is a derived index and must be reproducible from Cards, generator code, and human overrides.

## Relation scoring

Phase 1 uses deterministic metadata similarity only. No embeddings, vector database, or external LLM API is required.

Default weights:

| Signal | Weight |
| --- | ---: |
| Category Jaccard similarity | 0.45 |
| Tag Jaccard similarity | 0.30 |
| Shared high-relevance dimensions | 0.20 |
| Action Jaccard similarity | 0.05 |

A relevance dimension is considered high when its effective score is at least 4. `overall` is intentionally excluded from relation matching because it measures general usefulness rather than domain similarity.

Relations with score below `0.28` are discarded. Each Card participates in at most eight generated edges. A relation is classified as `similar_to` only when it has a high final score plus meaningful category/tag overlap; all other retained Phase 1 relations use `related`.

## Human overrides

`config/relation-overrides.yaml` supports three lists:

- `blocked`: removes a relation even if the generator finds it.
- `overrides`: replaces the generated type/score for a pair or creates the pair manually.
- `pinned`: guarantees a relation exists unless the same pair is blocked.

Precedence:

```text
blocked
> overrides / pinned
> generated relation
```

Phase 1 supports only `related` and `similar_to`. More semantic relation types are reserved for Phase 2.

## Commands

Build or refresh the index:

```bash
npm run relations:build
```

Validate card references, relation types, scores, duplicates, self-links, and override references:

```bash
npm run relations:validate
```

The generator stores an `input_hash`. If effective Card metadata, overrides, and generator source code are unchanged, a rebuild leaves `data/relations.json` untouched to avoid timestamp-only Git churn.

## Website projection

The dynamic Knowledge Card route reads `data/relations.json` at build time and injects the current Card's neighboring Cards into page params. `KnowledgeRelations.vue` renders a Related Knowledge section after the Card article with relation type, confidence score, summary, and matching signals.

The relation index stores edges only. Titles, summaries, routes, and other Card metadata continue to come from the Knowledge Card files.

## Automation

`.github/workflows/update-relations.yml` runs on relevant `main` changes:

```text
Knowledge Card / override / generator changed
        ↓
npm run relations:build
        ↓
npm run relations:validate
        ↓
npm test
        ↓
relations.json changed?
   ├─ no  → stop
   └─ yes → commit generated index
```

The workflow trigger excludes `data/relations.json`, so its own generated commit cannot create an update loop.

Both validation and GitHub Pages deployment also build and validate relations before building VitePress. This ensures a stale committed index cannot produce a stale deployment.

## Phase boundary

Phase 1 intentionally does not include:

- embeddings;
- vector databases;
- LLM relation classification;
- semantic types such as `depends_on` or `complements`;
- Concept nodes;
- graph visualization.

Those belong to Phase 2 and Phase 3.
