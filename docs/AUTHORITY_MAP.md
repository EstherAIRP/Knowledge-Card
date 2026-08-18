# Knowledge Card Document Authority Map

> **Role:** Documentation governance inventory / authority map  
> **Authority:** Descriptive map of current repository ownership; it does not override the linked normative contracts.  
> **Last audited:** 2026-08-18  
> **Documentation router:** [`DOCUMENTATION.md`](./DOCUMENTATION.md)

This document records which file should be treated as the **primary authority** for each concern, which files currently duplicate or explain that concern, and what later documentation-refactor phases should do about the overlap.

Phase 1 is intentionally non-behavioral: no ingestion algorithm, schema, prompt semantics, generated data, Knowledge Card content, or user-owned state is changed here.

## Authority classes

| Class | Meaning |
| --- | --- |
| **Normative contract** | Defines repository behavior or data rules that agents/automation must follow. |
| **Scoped contract** | Adds ownership/behavior rules inside one directory while repository-level rules still apply. |
| **Executable authority** | Code or workflow that actually performs behavior. Documentation should describe it, not contradict it. |
| **Operational documentation** | Explains how an executable subsystem works or is operated. |
| **Explanatory documentation** | Explains architecture/design; should not create a competing normative rule. |
| **Historical record** | Records previous behavior/changes; never overrides the current contract. |
| **Generated state** | Rebuildable output; never the sole source of truth for user intent or repository policy. |
| **Presentation entry** | Website/runtime presentation file, not repository governance documentation. |

## Current authority map

| Concern | Primary authority today | Supporting / executable sources | Current overlap or risk | Planned refactor direction |
| --- | --- | --- | --- | --- |
| Knowledge Card task trigger and orchestration | [`../prompts/RUNTIME.md`](../prompts/RUNTIME.md) | [`../AGENTS.md`](../AGENTS.md), ingestion docs | Runtime currently contains detailed provider/backend implementation rules also repeated elsewhere. | Phase 2: keep orchestration, fail-closed invariants, mandatory reads, analysis/update/report flow; replace low-level source/backend details with links. |
| Repository-wide agent behavior, write safety, ownership, validation, commit/push | [`../AGENTS.md`](../AGENTS.md) | Scoped `AGENTS.md` files | Root contract also repeats source-routing, Remote Ingest, Copilot ranker, and Threads details. | Phase 2: narrow root `AGENTS.md` to repository engineering/ownership/write contract and link to domain specs. |
| Configuration ownership | [`../config/AGENTS.md`](../config/AGENTS.md) | `config/*.yaml` | Clear scope today. | Keep scoped; only add navigation links if needed. |
| Generated index ownership | [`../data/AGENTS.md`](../data/AGENTS.md) | `data/embeddings.json`, `data/relations.json`, `data/concepts.json` | Clear scope today. | Keep scoped; generated data must remain rebuildable. |
| Operational source snapshot ownership | [`../state/AGENTS.md`](../state/AGENTS.md) | `state/source-snapshots/**`, snapshot tooling | Clear scope today. | Keep scoped; do not merge into root rules. |
| Knowledge Card frontmatter structure and machine validation | [`../schema/knowledge-card.schema.json`](../schema/knowledge-card.schema.json) | validation scripts, example template | Schema also repeats controlled enum values that are separately listed in taxonomy. | Later: add a synchronization guard or generated/shared contract so schema/taxonomy cannot silently drift. |
| Categories, actions, statuses, source types, relevance dimensions | [`../config/taxonomy.yaml`](../config/taxonomy.yaml) | Schema, Runtime, AGENTS, template | Controlled vocabulary is repeated in several human-readable files and partially duplicated in JSON Schema. | Phase 2+: human-readable docs should link to taxonomy instead of re-listing enums; preserve current declared precedence until contract is deliberately changed. |
| Public personalization boundary | [`../profile/public-profile.yaml`](../profile/public-profile.yaml) | Runtime/AGENTS public-safety text | Boundary is already explicit and narrow; repetition mostly reinforces safety. | Keep profile as the complete allowed personal context; other docs should reference it rather than restating private-context lists in full. |
| Knowledge Card body example | [`../templates/knowledge-card.example.md`](../templates/knowledge-card.example.md) as an authoring example | Runtime/AGENTS body-section rules | Template is intentionally lower authority than schema/contracts. | Keep as example; do not promote it above normative contracts. |
| Generic / GitHub ingestion process | [`INGESTION.md`](./INGESTION.md) for detailed workflow | Runtime, AGENTS, dispatcher/resolver scripts | Routing, backend policy, failure vocabulary, Remote Ingest and create/update flow are repeated across three global documents. | Phase 2–3: make ingestion documentation the detailed domain spec; Runtime/AGENTS retain only entry/invariants + links. |
| Threads source semantics and completeness | [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) | Threads source code, Runtime, AGENTS | Detailed Threads rules are duplicated globally; Phase 8 wording also appears in multiple places. | Phase 3: make one Threads document the sole detailed source-adapter spec and link to it elsewhere. |
| Threads Phase 7 semantic recovery | [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) should be treated as current domain authority | [`../.github/agents/threads-continuation-ranker.agent.md`](../.github/agents/threads-continuation-ranker.agent.md), `scripts/lib/sources/threads/continuation-recovery.mjs`, [`THREADS_PHASE7_RECOVERY.md`](./THREADS_PHASE7_RECOVERY.md) | `THREADS_PHASE7_RECOVERY.md` reflects an older contract and does not fully represent the current `root_only` judgement path, so it is a competing/stale spec risk. | **P0:** merge useful rationale into `THREADS_INGESTION.md`, then remove or explicitly archive the old Phase 7 document. |
| Threads semantic judgement output contract | Current contract is distributed between Threads docs, managed prompt, and validation code | Copilot agent prompt and local continuation-recovery code | Two prompt paths currently encode essentially the same labels/fields; future drift is possible. | Phase 4: add `schema/threads-continuation-judgement.schema.json` and make both prompt paths conform to it. |
| Provider route selection | Runtime + ingestion contract currently share responsibility | dispatcher/resolver code | Same hard gate is repeated in Runtime, AGENTS, and `INGESTION.md`. | Phase 2–3: Runtime keeps the orchestration invariant; ingestion docs own detailed routing semantics; executable scripts remain implementation authority. |
| Execution backend policy | [`INGESTION.md`](./INGESTION.md) as detailed operational/domain spec | dispatcher, Remote Ingest workflow, Runtime/AGENTS | Local/Remote policy and failure vocabulary are repeated extensively. | Phase 2–3: centralize detailed backend contract and link from Runtime/AGENTS. |
| Remote Ingest implementation | [`../.github/workflows/remote-ingest.yml`](../.github/workflows/remote-ingest.yml) + trusted execution scripts are executable authority | `INGESTION.md`, `AUTOMATION.md`, Runtime, AGENTS | Request protocol, permissions, runner behavior and failure handling are described repeatedly. | Keep implementation facts close to workflow/ingestion docs; remove duplicated low-level details from global contracts. |
| Managed Threads Copilot classifier | [`../.github/agents/threads-continuation-ranker.agent.md`](../.github/agents/threads-continuation-ranker.agent.md) is the actual managed prompt | Remote Ingest workflow, continuation-recovery code, Threads docs | Prompt is focused, but semantics are separately encoded in local code prompt. | Phase 4: shared judgement schema; keep actual prompt short and tool-isolated. |
| Runtime behavior history | [`../prompts/CHANGELOG.md`](../prompts/CHANGELOG.md) | Git history | Long historical entries contain obsolete providers/models by design and can be mistaken for current instructions if read out of context. | Clearly keep as historical record; always link back to current `RUNTIME.md`. |
| CI/CD and generated-index automation | Workflow YAML files under [`../.github/workflows/`](../.github/workflows/) are executable authority | [`AUTOMATION.md`](./AUTOMATION.md) | README currently lists an older subset of workflows. | Phase 5/README refresh: README becomes high-level; `AUTOMATION.md` describes all current workflows and links to YAML. |
| Card-to-Card semantic relation behavior | Repository relation config + relation generator/validator code | [`RELATIONS.md`](./RELATIONS.md), [`../config/AGENTS.md`](../config/AGENTS.md), [`../data/AGENTS.md`](../data/AGENTS.md) | Architecture documentation and config responsibilities are reasonably separated. | Preserve separation; mark `RELATIONS.md` explanatory/operational, not a user-state store. |
| Concept Graph behavior | `config/concept-config.yaml` + Concept generator/validator code | [`CONCEPTS.md`](./CONCEPTS.md), [`../config/AGENTS.md`](../config/AGENTS.md), [`../data/AGENTS.md`](../data/AGENTS.md) | Architecture documentation and generated-data ownership are reasonably separated. | Preserve separation and stable Concept-ID rules. |
| Website architecture / rendering | VitePress implementation under [`./.vitepress/`](./.vitepress/) and site projection code | [`WEBSITE.md`](./WEBSITE.md) | `docs/` contains both repository technical docs and the public VitePress application, which can blur document purpose. | No move in Phase 1. Later consider metadata/structure that distinguishes internal specs from public presentation files. |
| Public VitePress homepage | [`index.md`](./index.md) | VitePress theme/components | Name collides conceptually with a desired documentation index; case-only `INDEX.md` would be unsafe on case-insensitive filesystems. | Documentation router is therefore [`DOCUMENTATION.md`](./DOCUMENTATION.md), not `docs/INDEX.md`. |

## Document inventory

### Repository entry and global contracts

| File | Class | Current role | Phase 1 status |
| --- | --- | --- | --- |
| [`../README.md`](../README.md) | Project entry | High-level project/repository overview | Keep; add documentation-router link. Full architecture refresh belongs to a later phase. |
| [`../AGENTS.md`](../AGENTS.md) | Normative contract | Repository-wide agent rules | Keep unchanged in Phase 1; marked for slimming in Phase 2. |
| [`../prompts/RUNTIME.md`](../prompts/RUNTIME.md) | Normative contract | Runtime/task behavior | Keep unchanged in Phase 1; marked for slimming in Phase 2. |
| [`../prompts/CHANGELOG.md`](../prompts/CHANGELOG.md) | Historical record | Runtime version history | Keep; never use historical entries to override current Runtime. |

### Data contracts and ownership

| File | Class | Current role | Phase 1 status |
| --- | --- | --- | --- |
| [`../schema/knowledge-card.schema.json`](../schema/knowledge-card.schema.json) | Normative machine contract | Knowledge Card frontmatter validation | Keep. |
| [`../config/taxonomy.yaml`](../config/taxonomy.yaml) | Normative configuration | Controlled vocabulary and relevance dimensions | Keep. |
| [`../profile/public-profile.yaml`](../profile/public-profile.yaml) | Normative public-safety/personalization boundary | Only allowed public personal context | Keep. |
| [`../templates/knowledge-card.example.md`](../templates/knowledge-card.example.md) | Example | Canonical authoring example | Keep as lower-priority example. |
| [`../config/AGENTS.md`](../config/AGENTS.md) | Scoped contract | Config ownership | Keep. |
| [`../data/AGENTS.md`](../data/AGENTS.md) | Scoped contract | Generated-index ownership | Keep. |
| [`../state/AGENTS.md`](../state/AGENTS.md) | Scoped contract | Source-snapshot ownership | Keep. |

### Source / execution documentation

| File | Class | Current role | Phase 1 status |
| --- | --- | --- | --- |
| [`INGESTION.md`](./INGESTION.md) | Operational + domain contract | Generic ingestion and execution routing | Keep; planned consolidation target. |
| [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) | Domain contract | Threads-only source semantics | Keep; planned sole detailed Threads spec. |
| [`THREADS_PHASE7_RECOVERY.md`](./THREADS_PHASE7_RECOVERY.md) | Legacy mixed spec/explanation | Older Phase 7 recovery design | **P0 consolidation candidate** because current contract has drifted. |
| [`AUTOMATION.md`](./AUTOMATION.md) | Operational documentation | GitHub Actions, generated indexes, Pages | Keep. |
| [`../.github/agents/threads-continuation-ranker.agent.md`](../.github/agents/threads-continuation-ranker.agent.md) | Executable prompt contract | Managed semantic classifier | Keep focused; later bind to shared schema. |

### Architecture / presentation documentation

| File | Class | Current role | Phase 1 status |
| --- | --- | --- | --- |
| [`RELATIONS.md`](./RELATIONS.md) | Explanatory/operational | Card-to-Card relation architecture | Keep. |
| [`CONCEPTS.md`](./CONCEPTS.md) | Explanatory/operational | Concept Graph architecture | Keep. |
| [`WEBSITE.md`](./WEBSITE.md) | Explanatory/operational | VitePress website architecture | Keep. |
| [`index.md`](./index.md) | Presentation entry | Public Knowledge Radar homepage | Keep; not a documentation router. |

## Duplication / drift hotspots

### P0 — stale competing Threads Phase 7 specification

`THREADS_PHASE7_RECOVERY.md` documents an older structured judgement shape and older runtime configuration. Current Threads behavior has evolved to include a `root_only` path and stricter complete-label coverage. Keeping both documents as if they are equally normative creates the highest immediate drift risk.

**Phase 1 decision:** mark `THREADS_INGESTION.md` as the current domain authority in the documentation router and this map. Do not change the algorithm yet.

### P0 — Runtime / AGENTS / Ingestion triple-definition

The following concerns are currently repeated across `RUNTIME.md`, root `AGENTS.md`, and `INGESTION.md`:

- provider routing;
- LocalBackend / RemoteBackend policy;
- failure vocabulary;
- Remote Ingest request protocol;
- managed Copilot ranker behavior;
- semantic handoff behavior;
- fail-closed acceptance rules.

**Phase 1 decision:** record ownership only. Phase 2/3 will remove duplicates without changing behavior.

### P1 — prompt contract duplication

Threads continuation semantics exist in both:

- `.github/agents/threads-continuation-ranker.agent.md`;
- local/provider-neutral prompt code in `scripts/lib/sources/threads/continuation-recovery.mjs`.

They are currently aligned but have no shared machine-readable judgement schema.

**Phase 1 decision:** record the future shared-schema requirement; no prompt/code change yet.

### P1 — taxonomy/schema vocabulary duplication

Controlled values are maintained in `config/taxonomy.yaml`, while the Knowledge Card JSON Schema also contains corresponding enums for validation. Human-readable documents additionally re-list some values.

**Phase 1 decision:** taxonomy remains the vocabulary source named by repository rules, and the existing schema precedence remains unchanged. A later guard should detect mismatch rather than relying on manual synchronization.

### P1 — README architecture drift

The current README still shows an older repository tree, workflow list, and `ingest:resolve`-first end-to-end flow, while the repository now contains `ingest:dispatch`, Remote Ingest, relation/Concept automation, `prompts/`, `data/`, and `state/`.

**Phase 1 decision:** add a link to the documentation router only. Full README rewrite belongs to the later README/guardrail phase so Phase 1 remains an inventory/governance change.

## Phase 1 decisions

1. `docs/DOCUMENTATION.md` becomes the documentation navigation entry.
2. `docs/AUTHORITY_MAP.md` records current ownership, overlap, and planned consolidation.
3. `docs/index.md` remains the VitePress public homepage and is not reused as a documentation index.
4. No existing normative document is rewritten in Phase 1.
5. No existing ingestion/code behavior changes in Phase 1.
6. No Knowledge Card content, generated indexes, source snapshots, taxonomy, public profile, or user-owned state changes in Phase 1.
7. Later refactors should define each normative rule once and replace duplicates with concise summaries plus links.

## Target navigation model

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
- [Runtime Prompt](../prompts/RUNTIME.md)
- [Repository Rules](../AGENTS.md)
- [Ingestion Pipeline](./INGESTION.md)
- [Threads Ingestion](./THREADS_INGESTION.md)
