# Knowledge Card Documentation

> **Role:** Documentation router / index  
> **Authority:** Navigation only; this file does not override normative contracts.  
> **Last audited:** 2026-08-18  
> **Authority map:** [`AUTHORITY_MAP.md`](./AUTHORITY_MAP.md)

This page is the entry point for repository documentation. It answers **where to look**; the linked contract or implementation remains authoritative for its own scope.

`docs/index.md` is the VitePress public homepage, so this repository intentionally uses `docs/DOCUMENTATION.md` rather than a case-only `docs/INDEX.md` documentation index.

> VitePress only builds files under `docs/`. Links from this page to repository files outside `docs/` therefore use absolute GitHub links so website dead-link validation remains correct.

## Start here by task

| I want to... | Read first | Then follow |
| --- | --- | --- |
| Understand what Knowledge Card is | [Repository README](https://github.com/EstherAIRP/Knowledge-Card/blob/main/README.md) | [`WEBSITE.md`](./WEBSITE.md), [`CONCEPTS.md`](./CONCEPTS.md) |
| Execute a Knowledge Card task | [Runtime Prompt](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/RUNTIME.md) | [Repository Rules](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md), source-specific ingestion docs |
| Modify repository content safely | [Repository Rules](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md) | Scoped `AGENTS.md` files for `config/`, `data/`, or `state/` |
| Process a normal URL or GitHub repository | [`INGESTION.md`](./INGESTION.md) | [Repository scripts](https://github.com/EstherAIRP/Knowledge-Card/tree/main/scripts) |
| Process a Threads URL | [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) | [`INGESTION.md`](./INGESTION.md), [Threads source code](https://github.com/EstherAIRP/Knowledge-Card/tree/main/scripts/lib/sources/threads) |
| Change Knowledge Card frontmatter | [Knowledge Card Schema](https://github.com/EstherAIRP/Knowledge-Card/blob/main/schema/knowledge-card.schema.json) | [Taxonomy](https://github.com/EstherAIRP/Knowledge-Card/blob/main/config/taxonomy.yaml), [Card example](https://github.com/EstherAIRP/Knowledge-Card/blob/main/templates/knowledge-card.example.md) |
| Change categories, actions, statuses, source types, or relevance dimensions | [Taxonomy](https://github.com/EstherAIRP/Knowledge-Card/blob/main/config/taxonomy.yaml) | [Knowledge Card Schema](https://github.com/EstherAIRP/Knowledge-Card/blob/main/schema/knowledge-card.schema.json) |
| Change public personalization | [Public Profile](https://github.com/EstherAIRP/Knowledge-Card/blob/main/profile/public-profile.yaml) | [Repository Rules](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md) public-safety rules |
| Understand GitHub Actions / deployment | [`AUTOMATION.md`](./AUTOMATION.md) | [Actual workflows](https://github.com/EstherAIRP/Knowledge-Card/tree/main/.github/workflows) |
| Understand Card-to-Card relations | [`RELATIONS.md`](./RELATIONS.md) | [Config ownership](https://github.com/EstherAIRP/Knowledge-Card/blob/main/config/AGENTS.md), relation config, generated-data ownership |
| Understand the Concept Graph | [`CONCEPTS.md`](./CONCEPTS.md) | [Config ownership](https://github.com/EstherAIRP/Knowledge-Card/blob/main/config/AGENTS.md), [Generated-data ownership](https://github.com/EstherAIRP/Knowledge-Card/blob/main/data/AGENTS.md) |
| Understand website architecture | [`WEBSITE.md`](./WEBSITE.md) | [VitePress implementation](https://github.com/EstherAIRP/Knowledge-Card/tree/main/docs/.vitepress) |
| Understand generated indexes | [Generated-data ownership](https://github.com/EstherAIRP/Knowledge-Card/blob/main/data/AGENTS.md) | [`RELATIONS.md`](./RELATIONS.md), [`CONCEPTS.md`](./CONCEPTS.md) |
| Understand accepted source snapshots | [Source-state ownership](https://github.com/EstherAIRP/Knowledge-Card/blob/main/state/AGENTS.md) | Threads ingestion / snapshot tooling |
| Review Runtime behavior history | [Runtime Changelog](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/CHANGELOG.md) | Current behavior remains [Runtime Prompt](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/RUNTIME.md) |
| Determine which document owns a rule | [`AUTHORITY_MAP.md`](./AUTHORITY_MAP.md) | Follow the primary-authority link listed there |

## Documentation layers

The repository documentation is easiest to navigate as five layers:

```text
README.md
  Project entry and public overview
        ↓
docs/DOCUMENTATION.md
  Documentation router
        ↓
RUNTIME / AGENTS / domain documentation
  Behavioral and repository contracts
        ↓
Schema / config / scoped ownership rules
  Machine-readable and domain-specific hard constraints
        ↓
Code / workflows / generated data
  Executable implementation and rebuildable outputs
```

### 1. Project entry

- [Repository README](https://github.com/EstherAIRP/Knowledge-Card/blob/main/README.md) — project overview and high-level repository entry.

### 2. Agent contracts

- [Runtime Prompt](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/RUNTIME.md) — current Knowledge Card task/runtime behavior.
- [Repository Rules](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md) — repository-wide agent modification contract.
- [Config ownership](https://github.com/EstherAIRP/Knowledge-Card/blob/main/config/AGENTS.md) — configuration ownership rules.
- [Generated-data ownership](https://github.com/EstherAIRP/Knowledge-Card/blob/main/data/AGENTS.md) — generated-index ownership rules.
- [Source-state ownership](https://github.com/EstherAIRP/Knowledge-Card/blob/main/state/AGENTS.md) — operational source-snapshot ownership rules.

A deeper `AGENTS.md` applies within its directory in addition to the repository-level contract.

### 3. Source and system documentation

- [`INGESTION.md`](./INGESTION.md) — generic ingestion and execution-backend flow.
- [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) — Threads-only source-adapter contract.
- [`AUTOMATION.md`](./AUTOMATION.md) — CI/CD, generated-index maintenance, and Pages workflow documentation.
- [`RELATIONS.md`](./RELATIONS.md) — Card-to-Card semantic relation architecture.
- [`CONCEPTS.md`](./CONCEPTS.md) — Concept Graph architecture.
- [`WEBSITE.md`](./WEBSITE.md) — VitePress presentation architecture.

### 4. Machine-readable / repository configuration

- [Knowledge Card Schema](https://github.com/EstherAIRP/Knowledge-Card/blob/main/schema/knowledge-card.schema.json) — normative Knowledge Card frontmatter schema.
- [Taxonomy](https://github.com/EstherAIRP/Knowledge-Card/blob/main/config/taxonomy.yaml) — controlled categories, actions, statuses, source types, and relevance dimensions.
- [Public Profile](https://github.com/EstherAIRP/Knowledge-Card/blob/main/profile/public-profile.yaml) — complete public personalization boundary.
- [Knowledge Card example](https://github.com/EstherAIRP/Knowledge-Card/blob/main/templates/knowledge-card.example.md) — authoring example; not a higher-priority contract.

Relation and Concept behavior also use repository configuration under [config/](https://github.com/EstherAIRP/Knowledge-Card/tree/main/config); ownership rules are defined by [config/AGENTS.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/config/AGENTS.md).

### 5. Executable / historical material

- [GitHub Actions workflows](https://github.com/EstherAIRP/Knowledge-Card/tree/main/.github/workflows) — actual execution definitions.
- [Threads continuation ranker prompt](https://github.com/EstherAIRP/Knowledge-Card/blob/main/.github/agents/threads-continuation-ranker.agent.md) — managed Threads semantic-classifier prompt.
- [Repository scripts](https://github.com/EstherAIRP/Knowledge-Card/tree/main/scripts) — executable ingestion, validation, relation, Concept, and website-support logic.
- [Runtime Changelog](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/CHANGELOG.md) — Runtime history; historical entries must not override the current Runtime.
- [`THREADS_PHASE7_RECOVERY.md`](./THREADS_PHASE7_RECOVERY.md) — legacy Phase 7 explanatory/specification document scheduled for consolidation; do not treat it as a stronger authority than `THREADS_INGESTION.md`.

## Current authority chain

For the current repository, follow the precedence declared by `AGENTS.md` rather than inventing a new one here:

```text
JSON Schema
> taxonomy.yaml
> public-profile.yaml for personalization/public safety
> RUNTIME.md / AGENTS.md / applicable ingestion contract
> example/template
> existing AI-generated content
```

Within the runtime/repository/domain layer, responsibilities are now separated by Phase 2. [`AUTHORITY_MAP.md`](./AUTHORITY_MAP.md) records the owner for each topic and the remaining Phase 3/4 drift risks.

## Cross-reference rule

> Define a normative rule once. Other documents may summarize it briefly, but should link to the primary authority instead of copying the full rule.

When a document explains implementation rather than defining policy, link both to the normative contract and to the actual code/workflow when useful.

For VitePress pages, repository files outside `docs/` should be linked through absolute GitHub URLs; docs-to-docs links may remain relative.

## Related documents

- [Document Authority Map](./AUTHORITY_MAP.md)
- [Repository Rules](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md)
- [Runtime Prompt](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/RUNTIME.md)
- [Ingestion Pipeline](./INGESTION.md)
- [Threads Ingestion](./THREADS_INGESTION.md)
