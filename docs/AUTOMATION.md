# Phase 4 — Automation and GitHub Pages

Phase 4 turns the Knowledge Radar repository into a CI/CD pipeline. Repository content remains authoritative; GitHub Actions only validates, builds, and deploys the static VitePress projection.

## Workflows

### `.github/workflows/validate.yml`

Runs for pull requests, pushes to non-`main` branches, and manual dispatch.

Pipeline:

```text
checkout
→ setup Node.js 24
→ npm install
→ npm test
→ npm run validate
→ npm run docs:build
→ npm run verify:site
```

This workflow has read-only repository permission and does not deploy.

### `.github/workflows/deploy-pages.yml`

Runs for pushes to `main` and manual dispatch.

Build gate:

```text
checkout
→ setup Node.js 24
→ configure GitHub Pages
→ npm install
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

`actions/configure-pages` can inspect/configure an existing Pages site, but first-time enablement with the normal workflow `GITHUB_TOKEN` is not relied on by this repository.

## Deployment invariants

A broken Knowledge Card must never be deployed merely because its Markdown renders.

Deployment requires all of the following to pass:

1. ingestion/site unit tests;
2. JSON Schema and repository-contract validation;
3. VitePress production compilation;
4. generated-page smoke verification.

If any stage fails, the Pages artifact is not deployed.

## Dependency installation

The repository currently has exact direct dependency versions in `package.json` but no committed `package-lock.json`, so workflows use `npm install` rather than `npm ci`.

Once a lockfile is generated and committed from a normal Node/npm environment, change both workflows to `npm ci` for fully deterministic dependency installation.
