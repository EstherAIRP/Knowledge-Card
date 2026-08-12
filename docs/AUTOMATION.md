# Automation and GitHub Pages

Knowledge-Card uses GitHub Actions both as a CI/CD system and as the maintenance engine for generated semantic indexes. Repository content remains authoritative; Actions may rebuild generated data but must not rewrite human-owned Knowledge Card state or relation overrides.

## Workflows

### `.github/workflows/validate.yml`

Runs for pull requests, pushes to non-`main` branches, and manual dispatch.

Pipeline:

```text
checkout
→ setup Node.js 24
→ restore/cache local embedding model
→ npm install
→ build embedding index
→ validate embeddings
→ build semantic relation index without requiring paid API
→ npm test
→ Knowledge Card validation
→ relation validation
→ VitePress production build
→ built-output smoke verification
```

This workflow has read-only repository permission and does not commit or deploy. The local embedding path makes semantic CI deterministic with respect to repository inputs without requiring `OPENAI_API_KEY`.

### `.github/workflows/update-relations.yml`

Runs on relevant `main` changes, including Knowledge Cards, relation config/overrides, relation scripts, and package configuration.

Pipeline:

```text
changed source/config/generator
→ incremental embeddings
→ embedding validation
→ semantic candidate build
→ LLM relation classification when OPENAI_API_KEY exists
→ conservative fallback when unavailable
→ relation validation
→ unit tests
→ commit generated embeddings.json / relations.json only when changed
```

The workflow has `contents: write` because it owns generated-index commits. Its trigger intentionally excludes `data/embeddings.json` and `data/relations.json`, so the bot's own generated commit does not recursively trigger another index rebuild.

### `.github/workflows/rebuild-relations.yml`

Runs every Sunday and via manual dispatch.

It forces a full semantic rebuild:

```text
all Cards
→ rebuild every embedding
→ recalculate every candidate
→ reclassify when API credential is available
→ preserve valid cached LLM decisions when classifier service is unavailable
→ remove stale generated state
→ validate
→ commit only material generated-data changes
```

The full rebuild repairs incremental drift and refreshes embeddings after model/runtime changes that may not alter a Card content hash.

### `.github/workflows/deploy-pages.yml`

Runs for pushes to `main` and manual dispatch.

Build gate:

```text
checkout
→ setup Node.js 24
→ restore/cache local embedding model
→ npm install
→ build + validate embeddings
→ build + validate relations
→ unit tests
→ Knowledge Card validation
→ VitePress production build
→ built-output smoke verification
→ upload Pages artifact
```

Only after the complete build gate succeeds does the deployment job run:

```text
uploaded github-pages artifact
→ actions/deploy-pages
→ github-pages environment
```

The workflow uses the minimum deployment permissions required by GitHub Pages:

```yaml
contents: read
pages: write
id-token: write
```

## Model credentials

The default semantic embedding provider is local and needs no API credential.

LLM relation classification uses the environment variable configured by `config/relation-config.yaml`, currently:

```text
OPENAI_API_KEY
```

For GitHub Actions, configure this as a repository secret. Never commit API keys into YAML, Markdown, generated indexes, or workflow source.

Absence of the secret is a supported state: semantic relation generation falls back to conservative deterministic classification, while previously cached valid LLM classifications are preserved when their evidence is unchanged.

## Embedding-model cache

Workflows set:

```text
TRANSFORMERS_CACHE_DIR=.cache/transformers
```

and cache that directory with `actions/cache`. The cache key includes relation config and package configuration so embedding-model changes invalidate the appropriate cache while ordinary runs avoid repeated model downloads.

## Built-output verification

`scripts/verify-site-output.mjs` verifies the production output after VitePress finishes.

It requires:

- `docs/.vitepress/dist/index.html`
- one generated HTML page for every Knowledge Card ID under `knowledge/`
- at least one JavaScript bundle
- at least one CSS bundle

This catches failures where VitePress exits successfully but dynamic Knowledge Card projection is incomplete.

Run locally after a build:

```bash
npm run docs:build
npm run verify:site
```

## Deployment URL

The VitePress project base is configured as:

```text
/Knowledge-Card/
```

For the repository `EstherAIRP/Knowledge-Card`, the expected GitHub Pages project URL is:

```text
https://estherairp.github.io/Knowledge-Card/
```

unless a custom domain is configured later.

## First-time GitHub Pages enablement

The repository must have GitHub Pages configured to use **GitHub Actions** as its publishing source. This is a repository setting, not Knowledge Card content.

If Pages has not been enabled yet:

1. Open repository **Settings**.
2. Open **Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**.
4. Re-run the `Deploy Knowledge Radar` workflow, or push another commit to `main`.

## Deployment invariants

A broken Knowledge Card or generated relation index must never be deployed merely because Markdown renders.

Deployment requires all of the following to pass:

1. embedding generation and coverage validation;
2. relation generation and relation-contract validation;
3. ingestion/site/relation unit tests;
4. JSON Schema and Knowledge Card repository-contract validation;
5. VitePress production compilation;
6. generated-page smoke verification.

If any stage fails, the Pages artifact is not deployed.

## Dependency installation

The repository currently has exact direct dependency versions in `package.json` but no committed `package-lock.json`, so workflows use `npm install` rather than `npm ci`.

Once a lockfile is generated and committed from a normal Node/npm environment, change workflows to `npm ci` for fully deterministic dependency installation.
