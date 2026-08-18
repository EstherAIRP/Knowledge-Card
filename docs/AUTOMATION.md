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
→ npm run docs:check
→ VitePress production build
→ built-output verification
```

This workflow has read-only repository permission and does not commit or deploy. Branch CI does not require an external LLM credential.

### `.github/workflows/update-relations.yml`

The historical filename remains `update-relations.yml`, while the workflow name is **Update Knowledge Graph Indexes**.

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

The historical filename remains `rebuild-relations.yml`, while the workflow name is **Full Knowledge Graph Rebuild**.

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

### `.github/workflows/remote-ingest.yml`

Provides Repository-defined Remote Ingest execution when the current local runtime cannot satisfy an approved ingestion capability. Cross-provider transport and failure classification are defined by [`INGESTION.md`](./INGESTION.md); Threads-specific managed semantic behavior remains defined by [`THREADS_INGESTION.md`](./THREADS_INGESTION.md).

The workflow now has an explicit request-to-run correlation path:

```text
request commit SHA
→ commit status context: remote-ingest/run
→ target_url points to the matching Actions run
→ run ID
→ remote-ingest-{request_id} artifact
→ remote-ingest-result.json
```

The pointer is published before source processing and finalized after the resolve job completes. This lets an Agent recover a push-triggered Remote Ingest run from the request commit it already knows, without depending on a generic workflow-run listing API.

Permissions remain separated by job:

```text
announce/finalize → statuses: write
resolve           → contents: read + copilot-requests: write
cleanup           → contents: write
```

The model-running `resolve` job therefore does not gain repository contents-write permission from this fix.

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
→ npm run docs:check
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

## Documentation governance check

Phase 5 adds:

```bash
npm run docs:check
```

implemented by `scripts/check-documentation.mjs`.

The guard intentionally focuses on stable governance invariants rather than duplicating VitePress's parser. It checks that:

- required authority and contract files exist;
- deprecated/conflicting paths such as `docs/THREADS_PHASE7_RECOVERY.md` do not return;
- `docs/` has one lowercase `index.md` and no case-only `INDEX.md` collision;
- README uses `ingest:dispatch` as the normal ingestion entry;
- the documentation router and Authority Map retain critical authority references;
- local Markdown links in the governance document set resolve;
- VitePress documents do not use relative links to files outside `docs/`;
- both branch validation and the `main` Pages build run the guard;
- Remote Ingest keeps its request-commit status pointer, fixed `remote-ingest/run` context, Actions run URL, and final status publication.

VitePress production build remains responsible for its own route/dead-link validation. The two checks are complementary: `docs:check` protects repository governance conventions while VitePress validates the rendered documentation/site graph.

## Model credentials

The default semantic embedding provider is local and needs no API credential. Concept extraction is also deterministic and requires no external API.

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
6. documentation governance validation with `npm run docs:check`;
7. VitePress production compilation;
8. homepage, graph, Card-route and Concept-route smoke verification.

If any stage fails, the Pages artifact must not deploy.

## Dependency installation

The repository currently has exact direct dependency versions in `package.json` but no committed `package-lock.json`, so workflows use `npm install` rather than `npm ci`. Once a lockfile is committed, workflows can move to `npm ci`.
