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
Phase 3 — ingestion documentation consolidation COMPLETE
Phase 4 — shared Threads judgement schema        NEXT
Phase 5 — documentation guardrails / README      PLANNED
```

Phases 1–3 change documentation ownership and navigation only. They do not change ingestion algorithms, source-completeness gates, model behavior, Knowledge Card schema, taxonomy, generated data, source snapshots, or user-owned state.

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

| Concern | Primary authority | Supporting / executable sources | Current state |
| --- | --- | --- | --- |
| Knowledge Card task trigger and runtime orchestration | [Runtime Prompt](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/RUNTIME.md) | `AGENTS.md`, applicable domain docs | Phase 2 slimmed; orchestration/invariants only. |
| Repository-wide writes, ownership, validation, commit/push | [Repository Rules](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md) | scoped `AGENTS.md` files | Phase 2 slimmed; repository engineering/write contract only. |
| Configuration ownership | [config/AGENTS.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/config/AGENTS.md) | `config/*.yaml` | Stable; keep scoped. |
| Generated index ownership | [data/AGENTS.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/data/AGENTS.md) | generated `data/*.json` | Stable; keep scoped. |
| Operational source snapshots | [state/AGENTS.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/state/AGENTS.md) | snapshot tooling | Stable; keep scoped. |
| Knowledge Card frontmatter structure | [Knowledge Card Schema](https://github.com/EstherAIRP/Knowledge-Card/blob/main/schema/knowledge-card.schema.json) | validation code, template | Stable machine contract. |
| Controlled categories/actions/status/source types/relevance dimensions | [Taxonomy](https://github.com/EstherAIRP/Knowledge-Card/blob/main/config/taxonomy.yaml) | JSON Schema validation | Human-readable global copies removed. |
| Public personalization boundary | [Public Profile](https://github.com/EstherAIRP/Knowledge-Card/blob/main/profile/public-profile.yaml) | Runtime/AGENTS safety invariant | Complete allowed public personalization context. |
| Knowledge Card body example | [Knowledge Card example](https://github.com/EstherAIRP/Knowledge-Card/blob/main/templates/knowledge-card.example.md) | Runtime analysis standard, validator | Lower-priority authoring example. |
| Provider routing, generic/GitHub ingestion, execution backend, Remote Ingest transport, top-level failure classification | [`INGESTION.md`](./INGESTION.md) | dispatcher/resolver, [remote-ingest.yml](https://github.com/EstherAIRP/Knowledge-Card/blob/main/.github/workflows/remote-ingest.yml) | **Phase 3 consolidated.** Cross-provider domain boundary only. |
| Threads URL/extraction/reconstruction/completeness | [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) | Threads source implementation | **Phase 3 consolidated.** Sole detailed Threads spec. |
| Threads Phase 7 continuation/root-only recovery | [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) | [continuation-recovery.mjs](https://github.com/EstherAIRP/Knowledge-Card/blob/main/scripts/lib/sources/threads/continuation-recovery.mjs), managed prompt | Legacy standalone Phase 7 document removed; one human-readable spec remains. |
| Threads managed Copilot ranker and semantic handoff semantics | [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) | [managed prompt](https://github.com/EstherAIRP/Knowledge-Card/blob/main/.github/agents/threads-continuation-ranker.agent.md), Remote Ingest workflow, trusted execution code | Threads-specific execution semantics live with the provider spec; base Remote transport stays in `INGESTION.md`. |
| Threads semantic judgement output shape | Currently documented in [`THREADS_INGESTION.md`](./THREADS_INGESTION.md), enforced by code/prompt | managed prompt + local continuation code | Phase 4 will add one machine-readable shared judgement schema. |
| Runtime version history | [Runtime Changelog](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/CHANGELOG.md) | Git history | Historical only; current behavior comes from Runtime/domain contracts. |
| CI/CD and generated-index automation | [Workflow YAML](https://github.com/EstherAIRP/Knowledge-Card/tree/main/.github/workflows) | [`AUTOMATION.md`](./AUTOMATION.md) | Workflow YAML is executable authority; docs are operational explanation. |
| Card-to-Card semantic relations | relation config + generator/validator code | [`RELATIONS.md`](./RELATIONS.md), config/data scoped rules | Separation is healthy. |
| Concept Graph | concept config + generator/validator code | [`CONCEPTS.md`](./CONCEPTS.md), config/data scoped rules | Separation is healthy. |
| Website architecture/rendering | VitePress/site projection implementation | [`WEBSITE.md`](./WEBSITE.md) | `docs/` remains both technical-doc and VitePress source area. |
| Public VitePress homepage | [`index.md`](./index.md) | VitePress theme/components | Presentation entry; documentation router remains `DOCUMENTATION.md`. |

## Responsibility boundaries after Phase 3

### `prompts/RUNTIME.md`

Owns **what the task/runtime must do**:

- task triggering and mandatory preflight;
- high-level provider-route hard gate;
- `execution/runtime failure != source unavailable` invariant;
- accepted-source requirement;
- analysis/update/public-safety orchestration;
- validation/push/report expectations;
- links to detailed authorities.

Does not own source-specific algorithms or provider implementation internals.

### `AGENTS.md`

Owns **how repository modifications are performed safely**:

- repository-wide write rules;
- source-evidence requirement;
- stable identity/path handling;
- create/update protocol;
- user-owned state preservation;
- scoped ownership discovery;
- validation, commit/history, completion reporting.

Does not own provider extraction, semantic gates, model settings, or Remote transport internals.

### `docs/INGESTION.md`

Owns **cross-provider ingestion/execution**:

- mutually exclusive provider routing;
- dispatcher/resolver relationship;
- generic/GitHub ingestion;
- LocalBackend / RemoteBackend ordering;
- top-level failure classification;
- Remote Ingest base request/artifact transport and trusted-main boundary;
- accepted-source handoff to `AGENTS.md`.

Does not own Threads reconstruction, semantic judgement, Threads managed ranker semantics, or Threads snapshot algorithms.

### `docs/THREADS_INGESTION.md`

Owns **all detailed Threads source semantics**:

- Phase 1 URL resolution;
- Phase 2 exact-post extraction;
- Phase 3 self-thread reconstruction;
- Phase 4 Knowledge Card/source integration boundary;
- Phase 5 browser/web-data evidence;
- Phase 6 accepted snapshots/change detection;
- Phase 7 continuation/root-only recovery, rationale, judgement, deterministic gates, provenance;
- Threads-specific managed ranker and semantic handoff semantics.

It is now the only detailed human-readable Threads specification.

### Executable implementation

```text
.github/workflows/*.yml
scripts/
.github/agents/*.agent.md
```

Executable code/workflow remains the authority for what actually runs. Documentation must describe it accurately without creating a second implementation contract.

## Resolved duplication / drift hotspots

### Resolved in Phase 2 — Runtime / AGENTS / Ingestion triple-definition

Provider implementation details, Remote Ingest internals, managed-ranker details, and Threads gates were removed from the two global contracts. They now link to domain authorities.

### Resolved in Phase 3 — stale `THREADS_PHASE7_RECOVERY.md`

The former standalone Phase 7 document reflected an older judgement design and lacked the full current root-only path.

Phase 3 merged its still-useful rationale and implementation-layer explanation into [`THREADS_INGESTION.md`](./THREADS_INGESTION.md), updated the current root-only contract, and removed the stale file. There is no longer a second Phase 7 human-readable spec competing with the Threads domain contract.

### Resolved in Phase 3 — Ingestion / Threads execution overlap

Before Phase 3, both `INGESTION.md` and `THREADS_INGESTION.md` repeated substantial Remote Ingest and managed semantic details.

Phase 3 split the responsibility:

```text
INGESTION.md
→ cross-provider execution transport + failure classes

THREADS_INGESTION.md
→ Threads semantic source logic + provider-specific managed ranker/handoff
```

The two documents cross-link instead of restating each other's full contract.

## Remaining drift risks

### P0 for Phase 4 — prompt / judgement contract duplication

Threads continuation semantics still exist in both:

- [`.github/agents/threads-continuation-ranker.agent.md`](https://github.com/EstherAIRP/Knowledge-Card/blob/main/.github/agents/threads-continuation-ranker.agent.md);
- local/provider-neutral prompt and validation logic in [`continuation-recovery.mjs`](https://github.com/EstherAIRP/Knowledge-Card/blob/main/scripts/lib/sources/threads/continuation-recovery.mjs).

They are currently aligned but do not share a machine-readable judgement schema.

**Phase 4 action:** add `schema/threads-continuation-judgement.schema.json` and make both paths conform to it.

### P1 — taxonomy/schema vocabulary synchronization

`config/taxonomy.yaml` is the named controlled-vocabulary authority, while JSON Schema also contains compatible enums for machine validation.

A later guard should automatically detect taxonomy/schema mismatch.

### P1 — README architecture drift

The README still contains an older repository tree and earlier `ingest:resolve`-first description. Phase 5 should refresh it after the contract structure stabilizes.

## Document inventory

### Global contracts

| File | Class | Current role | Status |
| --- | --- | --- | --- |
| [README.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/README.md) | Project entry | High-level repository overview | Phase 5 refresh pending. |
| [prompts/RUNTIME.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/RUNTIME.md) | Normative contract | Runtime orchestration | Phase 2 slimmed. |
| [AGENTS.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md) | Normative contract | Repository engineering/write safety | Phase 2 slimmed. |
| [prompts/CHANGELOG.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/CHANGELOG.md) | Historical record | Runtime version history | Historical-only. |

### Source / execution documentation

| File | Class | Current role | Status |
| --- | --- | --- | --- |
| [`INGESTION.md`](./INGESTION.md) | Normative cross-provider domain contract | Routing, generic/GitHub ingestion, execution/Remote transport | **Phase 3 consolidated.** |
| [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) | Normative provider domain contract | Sole detailed Threads source/completeness spec | **Phase 3 consolidated.** |
| [`AUTOMATION.md`](./AUTOMATION.md) | Operational documentation | GitHub Actions / generated indexes / Pages | Keep. |
| [threads-continuation-ranker.agent.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/.github/agents/threads-continuation-ranker.agent.md) | Executable prompt contract | Managed classifier prompt | Phase 4 schema binding pending. |

The former `docs/THREADS_PHASE7_RECOVERY.md` was removed in Phase 3 after its useful rationale was merged into `THREADS_INGESTION.md`.

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

## Documentation governance rule

When one document needs a rule owned elsewhere:

1. state only the invariant required by the current document;
2. link directly to the primary authority;
3. do not copy detailed thresholds, payload schemas, provider settings, permissions, or algorithms outside the document that owns them;
4. if two authorities conflict, fix the conflict deliberately rather than inventing a third copy.

Current navigation:

```text
README.md
   ↓
docs/DOCUMENTATION.md
   ├─ Runtime task behavior → prompts/RUNTIME.md
   ├─ Repository writes    → AGENTS.md
   ├─ Cross-provider ingest→ docs/INGESTION.md
   │                           └─ Threads route → docs/THREADS_INGESTION.md
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
