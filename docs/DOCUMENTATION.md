# Knowledge Card Documentation

> **Role:** Documentation router / index  
> **Authority:** Navigation only; this file does not override normative contracts.  
> **Last audited:** 2026-08-18  
> **Authority map:** [`AUTHORITY_MAP.md`](./AUTHORITY_MAP.md)

This page is the entry point for repository documentation. It answers **where to look**; the linked contract or implementation remains authoritative for its own scope.

`docs/index.md` is the VitePress public homepage, so this repository intentionally uses `docs/DOCUMENTATION.md` rather than a case-only `docs/INDEX.md` documentation index.

## Start here by task

| I want to... | Read first | Then follow |
| --- | --- | --- |
| Understand what Knowledge Card is | [`../README.md`](../README.md) | [`WEBSITE.md`](./WEBSITE.md), [`CONCEPTS.md`](./CONCEPTS.md) |
| Execute a Knowledge Card task | [`../prompts/RUNTIME.md`](../prompts/RUNTIME.md) | [`../AGENTS.md`](../AGENTS.md), source-specific ingestion docs |
| Modify repository content safely | [`../AGENTS.md`](../AGENTS.md) | Scoped `AGENTS.md` files when entering `config/`, `data/`, or `state/` |
| Process a normal URL or GitHub repository | [`INGESTION.md`](./INGESTION.md) | Repository scripts under `../scripts/` |
| Process a Threads URL | [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) | [`INGESTION.md`](./INGESTION.md), Threads source code under `../scripts/lib/sources/threads/` |
| Change Knowledge Card frontmatter | [`../schema/knowledge-card.schema.json`](../schema/knowledge-card.schema.json) | [`../config/taxonomy.yaml`](../config/taxonomy.yaml), [`../templates/knowledge-card.example.md`](../templates/knowledge-card.example.md) |
| Change categories, actions, statuses, source types, or relevance dimensions | [`../config/taxonomy.yaml`](../config/taxonomy.yaml) | [`../schema/knowledge-card.schema.json`](../schema/knowledge-card.schema.json) |
| Change public personalization | [`../profile/public-profile.yaml`](../profile/public-profile.yaml) | [`../AGENTS.md`](../AGENTS.md) public-safety rules |
| Understand GitHub Actions / deployment | [`AUTOMATION.md`](./AUTOMATION.md) | Actual workflows under [`../.github/workflows/`](../.github/workflows/) |
| Understand Card-to-Card relations | [`RELATIONS.md`](./RELATIONS.md) | [`../config/AGENTS.md`](../config/AGENTS.md), relation config, generated-data ownership |
| Understand the Concept Graph | [`CONCEPTS.md`](./CONCEPTS.md) | [`../config/AGENTS.md`](../config/AGENTS.md), [`../data/AGENTS.md`](../data/AGENTS.md) |
| Understand website architecture | [`WEBSITE.md`](./WEBSITE.md) | VitePress implementation under [`./.vitepress/`](./.vitepress/) |
| Understand generated indexes | [`../data/AGENTS.md`](../data/AGENTS.md) | [`RELATIONS.md`](./RELATIONS.md), [`CONCEPTS.md`](./CONCEPTS.md) |
| Understand accepted source snapshots | [`../state/AGENTS.md`](../state/AGENTS.md) | Threads ingestion / snapshot tooling |
| Review Runtime behavior history | [`../prompts/CHANGELOG.md`](../prompts/CHANGELOG.md) | Current behavior remains [`../prompts/RUNTIME.md`](../prompts/RUNTIME.md) |
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

- [`../README.md`](../README.md) — project overview and high-level repository entry.

### 2. Agent contracts

- [`../prompts/RUNTIME.md`](../prompts/RUNTIME.md) — current Knowledge Card task/runtime behavior.
- [`../AGENTS.md`](../AGENTS.md) — repository-wide agent modification contract.
- [`../config/AGENTS.md`](../config/AGENTS.md) — configuration ownership rules.
- [`../data/AGENTS.md`](../data/AGENTS.md) — generated-index ownership rules.
- [`../state/AGENTS.md`](../state/AGENTS.md) — operational source-snapshot ownership rules.

A deeper `AGENTS.md` applies within its directory in addition to the repository-level contract.

### 3. Source and system documentation

- [`INGESTION.md`](./INGESTION.md) — generic ingestion and execution-backend flow.
- [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) — Threads-only source-adapter contract.
- [`AUTOMATION.md`](./AUTOMATION.md) — CI/CD, generated-index maintenance, and Pages workflow documentation.
- [`RELATIONS.md`](./RELATIONS.md) — Card-to-Card semantic relation architecture.
- [`CONCEPTS.md`](./CONCEPTS.md) — Concept Graph architecture.
- [`WEBSITE.md`](./WEBSITE.md) — VitePress presentation architecture.

### 4. Machine-readable / repository configuration

- [`../schema/knowledge-card.schema.json`](../schema/knowledge-card.schema.json) — normative Knowledge Card frontmatter schema.
- [`../config/taxonomy.yaml`](../config/taxonomy.yaml) — controlled categories, actions, statuses, source types, and relevance dimensions.
- [`../profile/public-profile.yaml`](../profile/public-profile.yaml) — complete public personalization boundary.
- [`../templates/knowledge-card.example.md`](../templates/knowledge-card.example.md) — authoring example; not a higher-priority contract.

Relation and Concept behavior also use repository configuration under [`../config/`](../config/); ownership rules are defined by [`../config/AGENTS.md`](../config/AGENTS.md).

### 5. Executable / historical material

- [`../.github/workflows/`](../.github/workflows/) — actual GitHub Actions execution definitions.
- [`../.github/agents/threads-continuation-ranker.agent.md`](../.github/agents/threads-continuation-ranker.agent.md) — managed Threads semantic-classifier prompt.
- [`../scripts/`](../scripts/) — executable ingestion, validation, relation, Concept, and website-support logic.
- [`../prompts/CHANGELOG.md`](../prompts/CHANGELOG.md) — Runtime history; historical entries must not override the current Runtime.
- [`THREADS_PHASE7_RECOVERY.md`](./THREADS_PHASE7_RECOVERY.md) — legacy Phase 7 explanatory/specification document scheduled for consolidation; do not treat it as a stronger authority than `THREADS_INGESTION.md`.

## Current authority chain

For the current repository, follow the precedence already declared by `AGENTS.md` rather than inventing a new one here:

```text
JSON Schema
> taxonomy.yaml
> public-profile.yaml for personalization/public safety
> RUNTIME.md / AGENTS.md / ingestion workflow
> example/template
> existing AI-generated content
```

Within the `RUNTIME.md / AGENTS.md / ingestion workflow` layer, responsibilities currently overlap. [`AUTHORITY_MAP.md`](./AUTHORITY_MAP.md) records the intended owner for each topic and the overlaps that later refactor phases must remove.

## Cross-reference rule for future refactors

Phase 1 introduces the navigation baseline only. Later phases should follow this rule:

> Define a normative rule once. Other documents may summarize it briefly, but should link to the primary authority instead of copying the full rule.

When a document explains implementation rather than defining policy, link both to the normative contract and to the actual code/workflow when useful.

## Related documents

- [Document Authority Map](./AUTHORITY_MAP.md)
- [Repository Rules](../AGENTS.md)
- [Runtime Prompt](../prompts/RUNTIME.md)
- [Ingestion Pipeline](./INGESTION.md)
- [Threads Ingestion](./THREADS_INGESTION.md)
