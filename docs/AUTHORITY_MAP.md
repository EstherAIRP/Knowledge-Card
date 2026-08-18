# Knowledge Card Document Authority Map

> **Role:** Documentation governance inventory / authority map  
> **Authority:** Descriptive map of repository ownership; it does not override linked normative contracts.  
> **Last audited:** 2026-08-18  
> **Documentation router:** [`DOCUMENTATION.md`](./DOCUMENTATION.md)

This document answers one question: **which file owns each rule?**

The goal is to keep every detailed rule in one primary authority and let other documents provide only the summary needed for their own scope plus a direct link.

> Because this file is rendered by VitePress from `docs/`, links to repository files outside `docs/` use absolute GitHub URLs so the website dead-link checker does not treat them as VitePress routes.

## Current refactor status

```text
Phase 1 — inventory + documentation router       COMPLETE
Phase 2 — global RUNTIME / AGENTS slimming       COMPLETE
Phase 3 — ingestion documentation consolidation NEXT
Phase 4 — shared Threads judgement schema        PLANNED
Phase 5 — documentation guardrails / README      PLANNED
```

Phase 2 changes documentation ownership only. It does not change ingestion algorithms, source-completeness gates, model behavior, Knowledge Card schema, taxonomy, generated data, source snapshots, or user-owned state.

## Authority classes

| Class | Meaning |
| --- | --- |
| **Normative contract** | Defines repository behavior or data rules that agents/automation must follow. |
| **Scoped contract** | Adds rules inside one directory while root rules still apply. |
| **Executable authority** | Code/workflow that actually performs behavior. Documentation describes it and must not contradict it. |
| **Operational documentation** | Explains how an executable subsystem is operated. |
| **Explanatory documentation** | Explains architecture/design and must not create a competing normative rule. |
| **Historical record** | Records prior behavior/changes and never overrides current contracts. |
| **Generated state** | Rebuildable output, never the sole source of truth for user intent or repository policy. |
| **Presentation entry** | Website presentation/runtime file, not repository governance documentation. |

## Current authority map

| Concern | Primary authority | Supporting / executable sources | Phase 2 state |
| --- | --- | --- | --- |
| Knowledge Card task trigger and runtime orchestration | [Runtime Prompt](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/RUNTIME.md) | `AGENTS.md`, applicable domain docs | **Slimmed.** Runtime keeps orchestration and hard invariants only. |
| Repository-wide writes, ownership, validation, commit/push | [Repository Rules](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md) | scoped `AGENTS.md` files | **Slimmed.** Root contract no longer carries provider implementation details. |
| Configuration ownership | [config/AGENTS.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/config/AGENTS.md) | `config/*.yaml` | Stable; keep scoped. |
| Generated index ownership | [data/AGENTS.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/data/AGENTS.md) | generated `data/*.json` | Stable; keep scoped. |
| Operational source snapshots | [state/AGENTS.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/state/AGENTS.md) | snapshot tooling | Stable; keep scoped. |
| Knowledge Card frontmatter structure | [Knowledge Card Schema](https://github.com/EstherAIRP/Knowledge-Card/blob/main/schema/knowledge-card.schema.json) | validation code, template | Stable machine contract. |
| Controlled categories/actions/status/source types/relevance dimensions | [Taxonomy](https://github.com/EstherAIRP/Knowledge-Card/blob/main/config/taxonomy.yaml) | JSON Schema validation | Global docs now link to taxonomy instead of maintaining human-readable enum copies. |
| Public personalization boundary | [Public Profile](https://github.com/EstherAIRP/Knowledge-Card/blob/main/profile/public-profile.yaml) | Runtime/AGENTS safety invariant | Global docs reference the profile rather than duplicating its full forbidden-context list. |
| Knowledge Card body example | [Knowledge Card example](https://github.com/EstherAIRP/Knowledge-Card/blob/main/templates/knowledge-card.example.md) | Runtime analysis standard, validator | Remains lower-priority authoring example. |
| Generic / GitHub ingestion and execution backend | [`INGESTION.md`](./INGESTION.md) | dispatcher/resolver, Remote Ingest workflow | Global docs now link here for detailed routing/backend/failure behavior. Phase 3 will tighten this domain spec further. |
| Threads source semantics and completeness | [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) | Threads source code | Global docs now link here instead of repeating Phase 1–7 details. |
| Threads Phase 7 semantic recovery | [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) as current domain authority | local continuation code, managed prompt | `THREADS_PHASE7_RECOVERY.md` remains a stale competing document and is the main Phase 3 P0 item. |
| Threads semantic judgement output | Currently distributed between Threads spec, local code, and managed prompt | [Managed prompt](https://github.com/EstherAIRP/Knowledge-Card/blob/main/.github/agents/threads-continuation-ranker.agent.md) | Phase 4 will add one machine-readable judgement schema. |
| Remote Ingest executable behavior | [remote-ingest.yml](https://github.com/EstherAIRP/Knowledge-Card/blob/main/.github/workflows/remote-ingest.yml) + trusted execution code | `INGESTION.md`, `AUTOMATION.md` | Runtime/AGENTS no longer duplicate request payloads, permissions, runner profile, or provider internals. |
| Managed Threads Copilot classifier prompt | [threads-continuation-ranker.agent.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/.github/agents/threads-continuation-ranker.agent.md) | Remote workflow, continuation code | Global contracts now reference it only conceptually. |
| Runtime version history | [Runtime Changelog](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/CHANGELOG.md) | Git history | Historical only; current behavior always comes from Runtime/domain contracts. |
| CI/CD and generated-index automation | [Workflow YAML](https://github.com/EstherAIRP/Knowledge-Card/tree/main/.github/workflows) | [`AUTOMATION.md`](./AUTOMATION.md) | Workflow YAML is executable authority; docs are operational explanation. |
| Card-to-Card semantic relations | relation config + generator/validator code | [`RELATIONS.md`](./RELATIONS.md), config/data scoped rules | Separation is already healthy. |
| Concept Graph | concept config + generator/validator code | [`CONCEPTS.md`](./CONCEPTS.md), config/data scoped rules | Separation is already healthy. |
| Website architecture/rendering | VitePress/site projection implementation | [`WEBSITE.md`](./WEBSITE.md) | `docs/` remains both technical-doc and VitePress source area; no move yet. |
| Public VitePress homepage | [`index.md`](./index.md) | VitePress theme/components | Remains presentation entry; documentation router is `DOCUMENTATION.md`. |

## Global contract boundaries after Phase 2

### `prompts/RUNTIME.md`

Owns:

- task triggering;
- mandatory preflight;
- high-level provider-route hard gate;
- `execution/runtime failure != source unavailable` invariant;
- accepted-source requirement;
- analysis/update/public-safety orchestration;
- validation/push/report expectations;
- links to the detailed authorities.

Does **not** own:

- Threads Phase 1–7 algorithms;
- continuation/root-only thresholds or judgement shape;
- Remote Ingest request JSON/artifact details;
- Copilot permissions/model selector/runner internals;
- taxonomy enum copies.

### `AGENTS.md`

Owns:

- repository-wide modification rules;
- source-evidence requirement;
- stable identity/path handling;
- create/update write protocol;
- user-owned state preservation;
- scoped ownership discovery;
- validation, commit/history, completion reporting;
- documentation-governance rule.

Does **not** own:

- provider extraction algorithms;
- Remote Ingest implementation details;
- Threads semantic gates;
- model credentials/permissions/settings;
- controlled-value lists already owned by taxonomy.

### Domain documents and executable implementation

```text
docs/INGESTION.md
  detailed generic ingestion + execution contract

docs/THREADS_INGESTION.md
  detailed Threads source/completeness contract

.github/workflows/*.yml + scripts/
  executable implementation
```

Global docs may summarize only the invariant required to decide which authority to invoke.

## Duplication / drift hotspots

### P0 — stale `THREADS_PHASE7_RECOVERY.md`

This remains the highest immediate documentation risk. It reflects an older Phase 7 judgement/runtime design and does not fully represent the current `root_only` path and complete-label coverage.

**Phase 3 action:** merge useful rationale into `THREADS_INGESTION.md`, then remove or explicitly archive the stale document so it cannot compete as a normative spec.

### Resolved in Phase 2 — Runtime / AGENTS / Ingestion triple-definition

Before Phase 2, provider routing, backend policy, Remote Ingest, managed ranker, semantic handoff, failure handling, and Threads gates were repeated across three global/domain documents.

Phase 2 removed the low-level copies from `RUNTIME.md` and root `AGENTS.md`. `INGESTION.md` / `THREADS_INGESTION.md` now remain the detailed documentation layer pending Phase 3 consolidation.

### P1 — prompt contract duplication

Threads continuation semantics still exist in both:

- [`.github/agents/threads-continuation-ranker.agent.md`](https://github.com/EstherAIRP/Knowledge-Card/blob/main/.github/agents/threads-continuation-ranker.agent.md);
- local/provider-neutral prompt logic in `scripts/lib/sources/threads/continuation-recovery.mjs`.

They are currently aligned but do not yet share a machine-readable judgement schema.

**Phase 4 action:** add `schema/threads-continuation-judgement.schema.json` and make both prompt paths conform to it.

### P1 — taxonomy/schema vocabulary synchronization

`config/taxonomy.yaml` is the named controlled-vocabulary authority, while JSON Schema must also contain compatible enums for machine validation.

Phase 2 removed unnecessary human-readable enum copies from global rule files. A later documentation/contract guard should automatically detect taxonomy/schema mismatch.

### P1 — README architecture drift

The README still contains an older repository tree and earlier `ingest:resolve`-first description. Phase 1 added the documentation-router entry, but the full README refresh remains deferred to Phase 5.

## Document inventory

### Global contracts

| File | Class | Current role | Status |
| --- | --- | --- | --- |
| [README.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/README.md) | Project entry | High-level repository overview | Keep; Phase 5 refresh pending. |
| [prompts/RUNTIME.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/RUNTIME.md) | Normative contract | Runtime orchestration | **Phase 2 slimmed.** |
| [AGENTS.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md) | Normative contract | Repository engineering/write safety | **Phase 2 slimmed.** |
| [prompts/CHANGELOG.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/CHANGELOG.md) | Historical record | Runtime version history | Keep historical-only. |

### Data and ownership contracts

| File | Class | Current role |
| --- | --- | --- |
| [schema/knowledge-card.schema.json](https://github.com/EstherAIRP/Knowledge-Card/blob/main/schema/knowledge-card.schema.json) | Normative machine contract | Knowledge Card frontmatter |
| [config/taxonomy.yaml](https://github.com/EstherAIRP/Knowledge-Card/blob/main/config/taxonomy.yaml) | Normative configuration | Controlled vocabulary |
| [profile/public-profile.yaml](https://github.com/EstherAIRP/Knowledge-Card/blob/main/profile/public-profile.yaml) | Normative public boundary | Allowed personalization context |
| [templates/knowledge-card.example.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/templates/knowledge-card.example.md) | Example | Authoring/body example |
| [config/AGENTS.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/config/AGENTS.md) | Scoped contract | Config ownership |
| [data/AGENTS.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/data/AGENTS.md) | Scoped contract | Generated-index ownership |
| [state/AGENTS.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/state/AGENTS.md) | Scoped contract | Source-snapshot ownership |

### Source / execution documentation

| File | Class | Current role | Next action |
| --- | --- | --- | --- |
| [`INGESTION.md`](./INGESTION.md) | Operational + domain contract | Generic ingestion/execution | Phase 3 consolidation. |
| [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) | Domain contract | Threads source semantics | Become sole detailed Threads spec in Phase 3. |
| [`THREADS_PHASE7_RECOVERY.md`](./THREADS_PHASE7_RECOVERY.md) | Legacy mixed spec/explanation | Older Phase 7 design | **P0 merge/remove in Phase 3.** |
| [`AUTOMATION.md`](./AUTOMATION.md) | Operational documentation | GitHub Actions / generated indexes / Pages | Keep. |
| [threads-continuation-ranker.agent.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/.github/agents/threads-continuation-ranker.agent.md) | Executable prompt contract | Managed classifier prompt | Phase 4 schema binding. |

### Architecture / presentation documentation

| File | Class | Current role |
| --- | --- | --- |
| [`RELATIONS.md`](./RELATIONS.md) | Explanatory/operational | Card-to-Card relation architecture |
| [`CONCEPTS.md`](./CONCEPTS.md) | Explanatory/operational | Concept Graph architecture |
| [`WEBSITE.md`](./WEBSITE.md) | Explanatory/operational | VitePress website architecture |
| [`index.md`](./index.md) | Presentation entry | Public Knowledge Radar homepage |

## Documentation governance rule

When one document needs a rule owned elsewhere:

1. state only the invariant required by the current document;
2. link directly to the primary authority;
3. do not copy detailed thresholds, payload schemas, provider settings, permissions, or algorithms into a global file;
4. if two authorities conflict, fix the conflict deliberately rather than inventing a third copy.

Target navigation:

```text
README.md
   ↓
docs/DOCUMENTATION.md
   ├─ Runtime task behavior → prompts/RUNTIME.md
   ├─ Repository writes    → AGENTS.md
   ├─ Generic ingestion    → docs/INGESTION.md
   ├─ Threads ingestion    → docs/THREADS_INGESTION.md
   ├─ Data contract        → schema/ + config/
   ├─ Automation           → docs/AUTOMATION.md → .github/workflows/
   └─ Authority ownership  → docs/AUTHORITY_MAP.md
```

## Related documents

- [Documentation Router](./DOCUMENTATION.md)
- [Runtime Prompt](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/RUNTIME.md)
- [Repository Rules](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md)
- [Ingestion Pipeline](./INGESTION.md)
- [Threads Ingestion](./THREADS_INGESTION.md)
