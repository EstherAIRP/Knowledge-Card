# Knowledge Card Documentation

> **Role:** Documentation router / index  
> **Authority:** Navigation only; this file does not override normative contracts.  
> **Last audited:** 2026-08-18  
> **Authority map:** [`AUTHORITY_MAP.md`](./AUTHORITY_MAP.md)

This page answers **where to look**. The linked contract, schema, configuration file, workflow, or implementation remains authoritative for its own scope.

`docs/index.md` is the VitePress public homepage, so this repository intentionally uses `docs/DOCUMENTATION.md` rather than a case-only `docs/INDEX.md` documentation index.

> VitePress builds files under `docs/`. Links from this page to repository files outside `docs/` therefore use absolute GitHub URLs so website dead-link validation does not interpret them as VitePress routes.

## Start here by task

| I want to... | Read first | Then follow |
| --- | --- | --- |
| Understand what Knowledge Card is | [Repository README](https://github.com/EstherAIRP/Knowledge-Card/blob/main/README.md) | [`WEBSITE.md`](./WEBSITE.md), [`CONCEPTS.md`](./CONCEPTS.md) |
| Execute a Knowledge Card task | [Runtime Prompt](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/RUNTIME.md) | [Repository Rules](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md), applicable source contract |
| Modify repository content safely | [Repository Rules](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md) | Scoped `AGENTS.md` files for `config/`, `data/`, or `state/` |
| Process a normal URL or GitHub repository | [`INGESTION.md`](./INGESTION.md) | [Repository scripts](https://github.com/EstherAIRP/Knowledge-Card/tree/main/scripts) |
| Process a Threads URL | [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) | [`INGESTION.md`](./INGESTION.md) for execution transport, [Threads source code](https://github.com/EstherAIRP/Knowledge-Card/tree/main/scripts/lib/sources/threads) for implementation |
| Understand Local vs Remote ingestion execution | [`INGESTION.md`](./INGESTION.md) | [Remote Ingest workflow](https://github.com/EstherAIRP/Knowledge-Card/blob/main/.github/workflows/remote-ingest.yml) |
| Understand Threads Phase 7 / root-only recovery | [`THREADS_INGESTION.md`](./THREADS_INGESTION.md#8-phase-7--semantic-continuation--root-only-recovery) | [Judgement Schema](https://github.com/EstherAIRP/Knowledge-Card/blob/main/schema/threads-continuation-judgement.schema.json), [continuation validation code](https://github.com/EstherAIRP/Knowledge-Card/blob/main/scripts/lib/sources/threads/continuation-recovery.mjs) |
| Change Threads semantic judgement fields / labels | [Threads Judgement Schema](https://github.com/EstherAIRP/Knowledge-Card/blob/main/schema/threads-continuation-judgement.schema.json) | [`THREADS_INGESTION.md`](./THREADS_INGESTION.md), [shared validator](https://github.com/EstherAIRP/Knowledge-Card/blob/main/scripts/lib/contracts/threads-continuation-judgement.mjs), [managed prompt](https://github.com/EstherAIRP/Knowledge-Card/blob/main/.github/agents/threads-continuation-ranker.agent.md) |
| Change Knowledge Card frontmatter | [Knowledge Card Schema](https://github.com/EstherAIRP/Knowledge-Card/blob/main/schema/knowledge-card.schema.json) | [Taxonomy](https://github.com/EstherAIRP/Knowledge-Card/blob/main/config/taxonomy.yaml), [Card example](https://github.com/EstherAIRP/Knowledge-Card/blob/main/templates/knowledge-card.example.md) |
| Change categories/actions/statuses/source types/relevance dimensions | [Taxonomy](https://github.com/EstherAIRP/Knowledge-Card/blob/main/config/taxonomy.yaml) | [Knowledge Card Schema](https://github.com/EstherAIRP/Knowledge-Card/blob/main/schema/knowledge-card.schema.json) |
| Change public personalization | [Public Profile](https://github.com/EstherAIRP/Knowledge-Card/blob/main/profile/public-profile.yaml) | [Repository Rules](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md) public-safety rules |
| Understand GitHub Actions / deployment | [`AUTOMATION.md`](./AUTOMATION.md) | [Actual workflows](https://github.com/EstherAIRP/Knowledge-Card/tree/main/.github/workflows) |
| Understand Card-to-Card relations | [`RELATIONS.md`](./RELATIONS.md) | [Config ownership](https://github.com/EstherAIRP/Knowledge-Card/blob/main/config/AGENTS.md), generated-data ownership |
| Understand the Concept Graph | [`CONCEPTS.md`](./CONCEPTS.md) | [Config ownership](https://github.com/EstherAIRP/Knowledge-Card/blob/main/config/AGENTS.md), [Generated-data ownership](https://github.com/EstherAIRP/Knowledge-Card/blob/main/data/AGENTS.md) |
| Understand website architecture | [`WEBSITE.md`](./WEBSITE.md) | [VitePress implementation](https://github.com/EstherAIRP/Knowledge-Card/tree/main/docs/.vitepress) |
| Understand generated indexes | [Generated-data ownership](https://github.com/EstherAIRP/Knowledge-Card/blob/main/data/AGENTS.md) | [`RELATIONS.md`](./RELATIONS.md), [`CONCEPTS.md`](./CONCEPTS.md) |
| Understand accepted source snapshots | [Source-state ownership](https://github.com/EstherAIRP/Knowledge-Card/blob/main/state/AGENTS.md) | [`THREADS_INGESTION.md`](./THREADS_INGESTION.md#7-phase-6--accepted-source-snapshots-and-change-detection) |
| Change documentation governance / checks | [Documentation guard](https://github.com/EstherAIRP/Knowledge-Card/blob/main/scripts/check-documentation.mjs) | [`AUTHORITY_MAP.md`](./AUTHORITY_MAP.md), [`AUTOMATION.md`](./AUTOMATION.md) |
| Review Runtime behavior history | [Runtime Changelog](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/CHANGELOG.md) | Current behavior remains [Runtime Prompt](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/RUNTIME.md) |
| Determine which document owns a rule | [`AUTHORITY_MAP.md`](./AUTHORITY_MAP.md) | Follow the primary-authority link listed there |

## Documentation layers

```text
README.md
  project entry and public overview
        ↓
docs/DOCUMENTATION.md
  navigation/router only
        ↓
RUNTIME / AGENTS / domain documentation
  behavioral and repository contracts
        ↓
Schema / config / scoped ownership rules
  machine-readable and domain-specific hard constraints
        ↓
Code / workflows / generated data
  executable implementation and rebuildable outputs
```

### 1. Project entry

- [Repository README](https://github.com/EstherAIRP/Knowledge-Card/blob/main/README.md) — current project overview, architecture, commands, and end-to-end flow.

### 2. Agent contracts

- [Runtime Prompt](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/RUNTIME.md) — current Knowledge Card task/runtime orchestration.
- [Repository Rules](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md) — repository-wide modification, ownership, validation, and commit contract.
- [Config ownership](https://github.com/EstherAIRP/Knowledge-Card/blob/main/config/AGENTS.md) — configuration ownership rules.
- [Generated-data ownership](https://github.com/EstherAIRP/Knowledge-Card/blob/main/data/AGENTS.md) — generated-index ownership rules.
- [Source-state ownership](https://github.com/EstherAIRP/Knowledge-Card/blob/main/state/AGENTS.md) — operational source-snapshot ownership rules.

A deeper `AGENTS.md` applies within its directory in addition to the repository-level contract.

### 3. Source and system documentation

- [`INGESTION.md`](./INGESTION.md) — cross-provider routing, generic/GitHub ingestion, execution backends, Remote Ingest transport, and top-level failure classification.
- [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) — sole detailed Threads source/completeness specification, including Phase 1–7, snapshots, managed ranker, and semantic handoff.
- [`AUTOMATION.md`](./AUTOMATION.md) — CI/CD, Remote Ingest overview, documentation guard, generated-index maintenance, and Pages workflow documentation.
- [`RELATIONS.md`](./RELATIONS.md) — Card-to-Card semantic relation architecture.
- [`CONCEPTS.md`](./CONCEPTS.md) — Concept Graph architecture.
- [`WEBSITE.md`](./WEBSITE.md) — VitePress presentation architecture.

### 4. Machine-readable / repository configuration

- [Knowledge Card Schema](https://github.com/EstherAIRP/Knowledge-Card/blob/main/schema/knowledge-card.schema.json) — normative Knowledge Card frontmatter schema.
- [Threads Judgement Schema](https://github.com/EstherAIRP/Knowledge-Card/blob/main/schema/threads-continuation-judgement.schema.json) — canonical Phase 7 semantic-classifier output shape and label vocabulary.
- [Taxonomy](https://github.com/EstherAIRP/Knowledge-Card/blob/main/config/taxonomy.yaml) — controlled categories, actions, statuses, source types, and relevance dimensions.
- [Public Profile](https://github.com/EstherAIRP/Knowledge-Card/blob/main/profile/public-profile.yaml) — complete public personalization boundary.
- [Knowledge Card example](https://github.com/EstherAIRP/Knowledge-Card/blob/main/templates/knowledge-card.example.md) — authoring example; not a higher-priority contract.

### 5. Executable / historical material

- [GitHub Actions workflows](https://github.com/EstherAIRP/Knowledge-Card/tree/main/.github/workflows) — actual execution definitions.
- [Documentation governance check](https://github.com/EstherAIRP/Knowledge-Card/blob/main/scripts/check-documentation.mjs) — Phase 5 guard for required documents, deprecated paths, repository/local links, and README/authority invariants.
- [Threads continuation ranker prompt](https://github.com/EstherAIRP/Knowledge-Card/blob/main/.github/agents/threads-continuation-ranker.agent.md) — managed classifier prompt bound to the shared judgement schema.
- [Threads judgement validator](https://github.com/EstherAIRP/Knowledge-Card/blob/main/scripts/lib/contracts/threads-continuation-judgement.mjs) — shared runtime JSON Schema validator and exported contract vocabulary.
- [Threads continuation validation code](https://github.com/EstherAIRP/Knowledge-Card/blob/main/scripts/lib/sources/threads/continuation-recovery.mjs) — deterministic Phase 7 evidence-dependent acceptance implementation.
- [Repository scripts](https://github.com/EstherAIRP/Knowledge-Card/tree/main/scripts) — executable ingestion, validation, relation, Concept, and website-support logic.
- [Runtime Changelog](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/CHANGELOG.md) — Runtime history; historical entries never override current contracts.

The former `THREADS_PHASE7_RECOVERY.md` was consolidated into `THREADS_INGESTION.md` during Phase 3 and is no longer a competing specification.

## Documentation guardrails

Run:

```bash
npm run docs:check
```

The guard verifies stable repository-documentation invariants and complements VitePress dead-link/build validation. It intentionally does not parse or duplicate every domain rule.

## Current authority chain

Follow the precedence declared by `AGENTS.md`:

```text
JSON Schema
> taxonomy.yaml
> public-profile.yaml for personalization/public safety
> RUNTIME.md / AGENTS.md / applicable ingestion contract
> example/template
> existing AI-generated content
```

## Cross-reference rule

> Define a normative rule once. Other documents may summarize it briefly, but should link to the primary authority instead of copying the full rule.

For VitePress pages, repository files outside `docs/` should be linked through absolute GitHub URLs; docs-to-docs links may remain relative.

## Related documents

- [Document Authority Map](./AUTHORITY_MAP.md)
- [Ingestion Pipeline](./INGESTION.md)
- [Threads Ingestion](./THREADS_INGESTION.md)
- [Automation](./AUTOMATION.md)
- [Relations](./RELATIONS.md)
- [Concept Graph](./CONCEPTS.md)
- [Website](./WEBSITE.md)
