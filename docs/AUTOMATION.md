# Automation and GitHub Pages

Knowledge-Card uses GitHub Actions as CI/CD and as the maintenance engine for generated semantic/Concept indexes. Knowledge Cards and repository-owned configuration remain authoritative; Actions may rebuild generated data but must not rewrite user-owned Knowledge Card state or human relation overrides.

## Workflows

### `.github/workflows/validate.yml`

Runs for pull requests, pushes to non-`main` branches, and manual dispatch.

```text
checkout
→ Node.js 24
→ restore/cache local embedding model
→ npm install
→ build + validate embeddings
→ build semantic relation index
→ relation diagnostics
→ build + validate Concept Graph
→ unit tests
→ Knowledge Card validation
→ relation validation
→ VitePress production build
→ built-output verification
```

This workflow has read-only repository permission and does not commit or deploy. Branch CI does not require an external LLM credential.

### `.github/workflows/update-relations.yml`

The historical filename remains `update-relations.yml`, but Phase 3 changes the workflow name to **Update Knowledge Graph Indexes**.

It runs on relevant `main` changes, including Knowledge Cards, relation config, Concept config, generator libraries and package configuration.

```text
changed Card/config/generator
→ incremental embeddings
→ embedding validation
→ semantic candidates
→ LLM relation classification when OPENAI_API_KEY exists
→ deterministic fallback when unavailable
→ relation diagnostics
→ Concept Graph rebuild
→ relation + Concept validation
→ unit tests
→ commit embeddings.json / relations.json / concepts.json when changed
```

Generated `data/*.json` paths are not workflow triggers, so the bot's own generated commit does not recursively rebuild the indexes.

### `.github/workflows/rebuild-relations.yml`

The historical filename remains `rebuild-relations.yml`, while the Phase 3 workflow is named **Full Knowledge Graph Rebuild**.

It runs every Sunday and via manual dispatch.

```text
all Cards
→ rebuild every embedding
→ recalculate semantic candidates
→ reclassify when API credential exists
→ preserve valid cached LLM decisions when classifier is unavailable
→ rebuild Concept Graph
→ remove stale generated state
→ validate embeddings / relations / concepts
→ unit tests
→ commit material generated-data changes
```

The full rebuild repairs incremental drift and refreshes all three generated indexes.

### `.github/workflows/deploy-pages.yml`

Runs on pushes to `main` and manual dispatch.

```text
checkout
→ Node.js 24
→ npm install
→ build + validate embeddings
→ build relations
→ build Concept Graph
→ unit tests
→ validate Cards / relations / concepts
→ VitePress production build
→ verify homepage + graph + Card pages + Concept pages
→ upload Pages artifact
→ deploy
```

Deployment permissions remain minimal:

```yaml
contents: read
pages: write
id-token: write
```

## Model credentials

The default semantic embedding provider is local and needs no API credential. Phase 3 Concept extraction is also deterministic and requires no external API.

LLM Card↔Card relation classification uses the environment variable configured by `config/relation-config.yaml`, currently:

```text
OPENAI_API_KEY
```

Configure it as a repository secret when desired. Its absence is supported: new semantic relations use conservative fallback and Concept generation continues normally.

## Embedding-model cache

Workflows set:

```text
TRANSFORMERS_CACHE_DIR=.cache/transformers
```

and cache that directory with `actions/cache`. The cache key includes relation config and package configuration.

## Generated data ownership

Automation may commit only generated indexes:

```text
data/embeddings.json
data/relations.json
data/concepts.json
```

It must not modify:

```text
content/knowledge/**
config/relation-overrides.yaml
config/relation-config.yaml
config/concept-config.yaml
```

as a side effect of index maintenance.

## Built-output verification

`scripts/verify-site-output.mjs` runs after VitePress and requires:

- `docs/.vitepress/dist/index.html`;
- `docs/.vitepress/dist/graph.html`;
- one Knowledge Card HTML page for every Card ID;
- one Concept HTML page for every generated Concept ID;
- at least one JavaScript bundle;
- at least one CSS bundle.

This catches failures where VitePress itself exits successfully while a dynamic route family is missing.

## Deployment URL

VitePress project base remains:

```text
/Knowledge-Card/
```

Expected GitHub Pages project URL:

```text
https://estherairp.github.io/Knowledge-Card/
```

unless a custom domain is configured.

## Deployment invariants

A deployment requires all of the following:

1. embedding generation and coverage validation;
2. semantic relation generation and validation;
3. Concept Graph generation and validation;
4. unit/site tests;
5. JSON Schema and Knowledge Card validation;
6. VitePress production compilation;
7. homepage, graph, Card-route and Concept-route smoke verification.

If any stage fails, the Pages artifact must not deploy.

## Dependency installation

The repository currently has exact direct dependency versions in `package.json` but no committed `package-lock.json`, so workflows use `npm install` rather than `npm ci`. Once a lockfile is committed, workflows can move to `npm ci`.
