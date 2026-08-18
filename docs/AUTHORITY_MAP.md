# Knowledge Card Document Authority Map

> **Role:** Documentation governance inventory / authority map  
> **Authority:** Descriptive map of repository ownership; it does not override linked normative contracts.  
> **Last audited:** 2026-08-18  
> **Documentation router:** [`DOCUMENTATION.md`](./DOCUMENTATION.md)

This document answers one question: **which file owns each rule?**

The governance goal is simple: keep each detailed rule in one primary authority and let other documents provide only the summary needed for their own scope plus a direct link.

> Because this file is rendered by VitePress from `docs/`, links to repository files outside `docs/` use absolute GitHub URLs.

## Refactor status

```text
Phase 1 — inventory + documentation router       COMPLETE
Phase 2 — global RUNTIME / AGENTS slimming       COMPLETE
Phase 3 — ingestion documentation consolidation COMPLETE
Phase 4 — shared Threads judgement schema        COMPLETE
Phase 5 — documentation guardrails / README      COMPLETE
```

The five-phase documentation refactor is complete. Phase 5 refreshes the repository entry point and adds executable governance checks; it does not change ingestion algorithms, source-completeness thresholds, Knowledge Card content, taxonomy, public profile, generated indexes, source snapshots, or user-owned state.

## Authority classes

| Class | Meaning |
| --- | --- |
| **Normative contract** | Defines repository behavior or data rules that agents/automation must follow. |
| **Scoped contract** | Adds rules inside one directory while root rules still apply. |
| **Executable authority** | Code/workflow that actually performs behavior. |
| **Operational documentation** | Explains how an executable subsystem is operated. |
| **Explanatory documentation** | Explains architecture/design without creating a competing normative rule. |
| **Historical record** | Records prior behavior/changes and never overrides current contracts. |
| **Generated state** | Rebuildable output, never the sole source of truth for user intent or repository policy. |
| **Presentation entry** | Website presentation/runtime file, not repository governance documentation. |

## Current authority map

| Concern | Primary authority | Supporting / executable sources |
| --- | --- | --- |
| Knowledge Card task trigger and runtime orchestration | [Runtime Prompt](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/RUNTIME.md) | `AGENTS.md`, applicable domain contract |
| Repository-wide writes, ownership, validation, commit/push | [Repository Rules](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md) | scoped `AGENTS.md` files |
| Documentation navigation | [`DOCUMENTATION.md`](./DOCUMENTATION.md) | README, this Authority Map |
| Documentation governance invariants | [check-documentation.mjs](https://github.com/EstherAIRP/Knowledge-Card/blob/main/scripts/check-documentation.mjs) | `npm run docs:check`, validation/Pages workflows |
| Provider routing, generic/GitHub ingestion, execution backend, Remote Ingest transport, top-level failure classification | [`INGESTION.md`](./INGESTION.md) | dispatcher/resolver, [remote-ingest.yml](https://github.com/EstherAIRP/Knowledge-Card/blob/main/.github/workflows/remote-ingest.yml) |
| Threads URL/extraction/reconstruction/completeness | [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) | Threads source implementation |
| Threads Phase 7 continuation/root-only semantics and evidence-dependent gates | [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) | [continuation-recovery.mjs](https://github.com/EstherAIRP/Knowledge-Card/blob/main/scripts/lib/sources/threads/continuation-recovery.mjs) |
| Threads semantic judgement output shape / label vocabulary | [Threads Judgement Schema](https://github.com/EstherAIRP/Knowledge-Card/blob/main/schema/threads-continuation-judgement.schema.json) | [shared validator](https://github.com/EstherAIRP/Knowledge-Card/blob/main/scripts/lib/contracts/threads-continuation-judgement.mjs), local/managed rankers |
| Threads managed classifier prompt | [threads-continuation-ranker.agent.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/.github/agents/threads-continuation-ranker.agent.md) | shared schema + Copilot adapter |
| Knowledge Card frontmatter structure | [Knowledge Card Schema](https://github.com/EstherAIRP/Knowledge-Card/blob/main/schema/knowledge-card.schema.json) | validation code, template |
| Controlled categories/actions/status/source types/relevance dimensions | [Taxonomy](https://github.com/EstherAIRP/Knowledge-Card/blob/main/config/taxonomy.yaml) | Knowledge Card Schema drift validation |
| Public personalization boundary | [Public Profile](https://github.com/EstherAIRP/Knowledge-Card/blob/main/profile/public-profile.yaml) | Runtime/AGENTS public-safety invariant |
| Knowledge Card body example | [Knowledge Card example](https://github.com/EstherAIRP/Knowledge-Card/blob/main/templates/knowledge-card.example.md) | Runtime analysis standard |
| Configuration ownership | [config/AGENTS.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/config/AGENTS.md) | `config/*.yaml` |
| Generated index ownership | [data/AGENTS.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/data/AGENTS.md) | generated `data/*.json` |
| Operational source snapshots | [state/AGENTS.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/state/AGENTS.md) | source-state tooling |
| CI/CD and generated-index automation | [Workflow YAML](https://github.com/EstherAIRP/Knowledge-Card/tree/main/.github/workflows) | [`AUTOMATION.md`](./AUTOMATION.md) |
| Card-to-Card semantic relations | relation config + generator/validator code | [`RELATIONS.md`](./RELATIONS.md), config/data scoped rules |
| Concept Graph | concept config + generator/validator code | [`CONCEPTS.md`](./CONCEPTS.md), config/data scoped rules |
| Website architecture/rendering | VitePress/site projection implementation | [`WEBSITE.md`](./WEBSITE.md) |
| Public VitePress homepage | [`index.md`](./index.md) | VitePress theme/components |
| Runtime history | [Runtime Changelog](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/CHANGELOG.md) | Git history; historical only |

## Stable responsibility boundaries

### `prompts/RUNTIME.md`

Owns **what the task/runtime must do**: task triggering, mandatory preflight, provider-route hard gate, accepted-source requirement, high-level execution fallback invariant, analysis/update/public-safety orchestration, validation/push/report expectations, and links to detailed authorities.

It does not own source-specific algorithms, provider credentials/settings, Remote Ingest internals, or Threads acceptance thresholds.

### `AGENTS.md`

Owns **how repository modifications are performed safely**: repository write rules, source evidence, stable identity/path handling, create/update protocol, user-owned state preservation, scoped ownership discovery, validation, history, and completion reporting.

### `docs/INGESTION.md`

Owns **cross-provider ingestion/execution**: provider routing, dispatcher/resolver relationship, generic/GitHub ingestion, LocalBackend/RemoteBackend ordering, top-level failure classification, Remote Ingest base transport, and accepted-source handoff.

### `docs/THREADS_INGESTION.md`

Owns **detailed Threads source semantics**: URL resolution, exact-post extraction, self-thread reconstruction, browser evidence, accepted snapshots, Phase 7 recovery semantics, deterministic evidence-dependent gates, provenance, managed ranker behavior, and semantic handoff semantics.

### `schema/threads-continuation-judgement.schema.json`

Owns **Threads Phase 7 model-output structure only**: required fields, data types/bounds, candidate-label object shape, and allowed labels. Confidence acceptance thresholds, metadata evidence, exact candidate coverage, chronology, same-author checks, `n/N`, and structural ambiguity remain in trusted Phase 7/source code.

### `scripts/check-documentation.mjs`

Owns **stable documentation-governance checks**, not domain semantics. It verifies required files, deprecated/conflicting paths, lowercase `docs/index.md`, critical README/router/authority references, selected local Markdown links, VitePress relative-link boundaries, and CI integration.

VitePress remains responsible for rendered-site compilation and its own dead-link checks.

## Resolved drift hotspots

### Phase 2 — global triple-definition

Provider implementation details, Remote Ingest internals, managed-ranker details, and Threads gates were removed from the two global contracts and delegated to domain authorities.

### Phase 3 — competing Threads documentation

The obsolete `docs/THREADS_PHASE7_RECOVERY.md` was merged into [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) and removed. `INGESTION.md` now owns cross-provider execution while `THREADS_INGESTION.md` owns Threads-specific source semantics.

### Phase 4 — judgement shape duplication

The shared [Threads Judgement Schema](https://github.com/EstherAIRP/Knowledge-Card/blob/main/schema/threads-continuation-judgement.schema.json) now feeds the common validator used by local ranker, Copilot ranker, semantic handoff, and Phase 7 validation.

### Phase 5 — README and governance drift

README now reflects the current `ingest:dispatch`-first architecture, Remote Ingest, Knowledge Graph workflows, shared Threads schema, and current repository layout. `npm run docs:check` is enforced in both branch validation and the `main` Pages build gate.

## Ongoing maintenance risks

The refactor program is complete, but normal maintenance can still introduce drift. The principal ongoing checks are:

- `npm run docs:check` for governance/index/link invariants;
- `npm run validate` for Knowledge Card schema, identity, duplicate, and taxonomy/schema drift checks;
- `npm test` for executable behavior;
- `npm run docs:build` for VitePress compilation/dead links;
- `npm run verify:site` for generated site-output coverage.

If a future rule needs a new authority, update this map deliberately rather than copying the full rule into several documents.

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
   ├─ Repository writes     → AGENTS.md
   ├─ Cross-provider ingest → docs/INGESTION.md
   │                           └─ Threads → docs/THREADS_INGESTION.md
   │                                └─ judgement shape → schema/threads-continuation-judgement.schema.json
   ├─ Data/config contracts → schema/ + config/
   ├─ Automation            → docs/AUTOMATION.md → .github/workflows/
   ├─ Governance guard      → scripts/check-documentation.mjs
   └─ Authority ownership   → docs/AUTHORITY_MAP.md
```

## Related documents

- [Documentation Router](./DOCUMENTATION.md)
- [Ingestion Pipeline](./INGESTION.md)
- [Threads Ingestion](./THREADS_INGESTION.md)
- [Automation](./AUTOMATION.md)
- [Relations](./RELATIONS.md)
- [Concept Graph](./CONCEPTS.md)
- [Website](./WEBSITE.md)
