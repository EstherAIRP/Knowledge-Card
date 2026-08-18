# AGENTS.md — Knowledge Card repository contract

> **Role:** Repository-wide engineering, ownership, write, validation, and commit contract  
> **Runtime orchestration:** [`prompts/RUNTIME.md`](prompts/RUNTIME.md)  
> **Documentation router:** [`docs/DOCUMENTATION.md`](docs/DOCUMENTATION.md)  
> **Authority map:** [`docs/AUTHORITY_MAP.md`](docs/AUTHORITY_MAP.md)

This file defines how Codex or any AI agent may modify this repository. It applies everywhere unless a deeper `AGENTS.md` adds stricter or directory-specific rules.

This file intentionally does **not** duplicate provider-specific extraction algorithms, Threads recovery gates, Remote Ingest request internals, or managed-model implementation details. Those belong to their domain contracts and executable implementation.

## 1. Repository purpose

Knowledge Card is a public-oriented technology knowledge radar. The normal write workflow is:

```text
User request
→ runtime/source preflight
→ accepted source identity
→ create or update
→ preserve user-owned state
→ validate
→ commit/push
→ report verified status
```

A bare technical URL is normally an ingestion request according to `prompts/RUNTIME.md`. A user request that explicitly asks only for review, explanation, planning, or analysis must not be converted into an unsolicited repository write.

## 2. Authoritative contracts

Use the narrowest applicable authority instead of copying rules between documents.

### Data and public-safety contracts

1. `schema/knowledge-card.schema.json` — normative Knowledge Card frontmatter schema.
2. `config/taxonomy.yaml` — controlled categories, actions, statuses, source types, and relevance dimensions.
3. `profile/public-profile.yaml` — complete allowed public personalization context.
4. `templates/knowledge-card.example.md` — canonical authoring example; lower authority than schema/contracts.

### Runtime and source contracts

- `prompts/RUNTIME.md` — task/runtime orchestration.
- `docs/INGESTION.md` — detailed generic ingestion and execution-backend contract.
- `docs/THREADS_INGESTION.md` — Threads-only source semantics and completeness contract.
- `.github/workflows/*.yml` and trusted scripts — executable automation authority for what they actually run.

### Scoped ownership contracts

- `config/AGENTS.md` — configuration ownership.
- `data/AGENTS.md` — generated-index ownership.
- `state/AGENTS.md` — operational source-state ownership.

Precedence remains:

```text
JSON Schema
> taxonomy.yaml
> public-profile.yaml for personalization/public safety
> RUNTIME.md / AGENTS.md / applicable ingestion contract
> example/template
> existing AI-generated content
```

Do not silently invent controlled values or weaken a hard contract because another document is stale. If documentation and executable behavior diverge, identify the mismatch and update the appropriate authority deliberately.

## 3. Ingestion boundary

For ordinary URL ingestion, the high-level repository entry is:

```bash
npm run ingest:dispatch -- <URL>
```

Every approved backend ultimately uses the repository resolver contract. The accepted resolver result is the mechanical authority for routine source identity and create/update resolution, including:

- canonical URL;
- stable source identity;
- stable Card ID;
- `create` vs `update` mode;
- existing/suggested path.

`npm run ingest:resolve -- <URL>` remains a lower-level resolver/debug entry.

Hard engineering rules:

- do not create a second Card when the accepted resolver identifies an existing source;
- do not write a Card from an incomplete, ambiguous, identity-mismatched, blocked, or otherwise unaccepted source;
- do not weaken provider completeness because the current session lacks local tools;
- do not advance accepted source state when the corresponding Card write/validation did not succeed.

Detailed provider routing, execution backend policy, Remote Ingest protocol, Threads Phase 1–7, managed semantic ranking, semantic handoff, failure vocabulary, thresholds, and provenance are owned by `docs/INGESTION.md`, `docs/THREADS_INGESTION.md`, the managed agent prompt, workflows, and trusted implementation. **Do not reproduce those details in this file.**

## 4. Source evidence rule

Never author substantive Knowledge Card claims from a URL slug, search snippet, repository name, or model memory alone.

Before writing:

- read the accepted primary source;
- for GitHub repositories, inspect repository metadata and README at minimum;
- inspect architecture/security/docs/config/source files when needed to support technical claims;
- for papers, prefer the paper/abstract and official project material;
- for articles/documentation, read the actual authoritative page;
- for Threads, use the accepted complete source returned by the Threads contract;
- distinguish verified facts from inference;
- do not invent features, architecture, maturity, license, compatibility, benchmarks, or maintenance status.

If evidence is insufficient under the applicable source contract, fail closed rather than fabricating a Card.

## 5. Identity, canonicalization, and paths

The repository resolver is the mechanical authority for routine URL normalization, canonical identity, stable ID, and create/update lookup.

Do not hand-normalize a source into a conflicting identity when resolver output is available.

Stable write rules:

- new Cards live under `content/knowledge/{YYYY}/{id}.md` using the resolver-selected identity/path;
- once created, routine updates preserve `id`, `created_at`, and file path;
- URL variants, tracking differences, GitHub repository subpaths, share aliases, or arbitrary Threads parts must not produce duplicate Cards when the provider contract resolves them to the same source;
- `npm run validate` remains a final duplicate/schema/identity guard.

Do not rename historical Cards merely because a title, recommendation, or source presentation changed.

## 6. Create protocol

When the accepted resolver mode is `create`:

1. Read `templates/knowledge-card.example.md`.
2. Use the accepted current source from the already-selected provider route.
3. Use `profile/public-profile.yaml` only for allowed public personalization.
4. Produce frontmatter that conforms to `schema/knowledge-card.schema.json` and `config/taxonomy.yaml`.
5. Write to the resolver-selected path.
6. Run repository validation.
7. For source types with accepted operational snapshots, advance state only after the Card write validates successfully and only through repository tooling.
8. Commit only after the applicable validation succeeds.

## 7. Update protocol

When the accepted resolver mode is `update`:

1. Read the existing Card completely.
2. Re-read the current accepted primary source using the same provider route.
3. Preserve stable identity and all user-owned state.
4. Refresh only AI-owned metadata/analysis from current evidence.
5. Update `last_checked_at` only after a real current-source re-check succeeds.
6. Update `updated_at` only when the Card changes materially.
7. Add an Update Log entry only for meaningful changes.
8. Run ownership validation and repository validation before commit.
9. Advance any accepted source snapshot only after the corresponding Card update validates successfully.

If live execution/revalidation is blocked, do not rewrite analysis, refresh dates, or advance source state as though the source had been verified.

## 8. AI/User ownership model

AI-generated state and user-owned overrides are intentionally separate.

Ownership wrappers include classification, relevance, actions, and status fields defined by the schema. Rules:

- AI may refresh only AI-owned values during re-analysis;
- user-owned values must be preserved exactly unless the user explicitly asks to change or remove them;
- relevance overrides are resolved per dimension;
- effective wrapper values follow the repository's `user ?? ai` model;
- `## 使用者備註` is user-owned and must be preserved verbatim unless explicitly edited by the user.

For an existing Card update, run:

```bash
npm run validate:ownership -- <path>
```

The ownership checker is an executable guard against accidental stable/user-state changes.

## 9. Classification, relevance, actions, and body structure

Do not maintain a second enum list in this file.

- controlled categories/actions/status/source types/relevance dimensions come from `config/taxonomy.yaml`;
- frontmatter shape comes from `schema/knowledge-card.schema.json`;
- the expected analysis body and section order come from `templates/knowledge-card.example.md` and repository validation;
- explanatory prose, completion reports, and user-facing repository summaries default to natural Traditional Chinese (`zh-TW`);
- use established Chinese translations for general concepts when they are clear and natural; do not preserve English merely because source material uses it;
- retain English for official project/product names, code, commands, APIs, function/parameter/field names, identifiers, file paths, acronyms, and terms whose Chinese translation would reduce precision;
- when an important technical term benefits from bilingual disambiguation, use `中文（English）` at first occurrence, then prefer Chinese thereafter;
- avoid unnecessary Chinese-English code-switching, especially sentence-level English nouns or verbs that have natural Chinese equivalents;
- quoted source text, schema/config controlled values, executable literals, and required metadata values are exempt and must remain exact;
- free-form tags may be generated, but should be specific and technically useful;
- related-card links may reference only Cards that actually exist.

Do not let generated content, examples, or an older Card override the current schema/taxonomy contracts.

## 10. Scoped ownership rules

When modifying scoped areas, read and obey their deeper `AGENTS.md` files in addition to this root contract.

### `config/`

Repository/human configuration ownership is defined in `config/AGENTS.md`. Do not replace manual overrides with generated output or store credentials in repository config.

### `data/`

Generated indexes are rebuildable state governed by `data/AGENTS.md`. Do not hand-edit generated indexes to express user intent.

### `state/`

Operational source snapshots are machine-owned fingerprints governed by `state/AGENTS.md`. They are not Cards and are not user override storage.

## 11. Public-safety boundary

This repository is intended for public publishing.

`profile/public-profile.yaml` is the complete allowed personal context for public personalization. The repository may additionally use the public source currently being analyzed and existing public Knowledge Cards only where the profile policy permits.

Core rule:

> The agent knowing something does not make it publishable.

Do not enrich public content from private chat memory, hidden personal context, employer/internal details, finances, relationships/family information, non-public projects, or any other personal detail that is not explicitly allowed by the public profile.

When uncertain whether a personal detail is public-safe, omit it.

## 12. Mandatory validation

Do not substitute casual manual inspection for repository validation.

For any Card create/update:

```bash
npm run validate
```

For an existing Card update, also run:

```bash
npm run validate:ownership -- <path>
```

When ingestion/source tooling or executable behavior changes, also run:

```bash
npm test
```

Apply additional validators required by deeper `AGENTS.md` files when modifying generated relations, concepts, config, or source state.

Documentation-only contract/navigation refactors do not require source-tooling tests when no executable behavior changes, but they must still pass the repository's applicable CI/validation before being promoted to `main`.

Do not knowingly merge or report a failed validation as successful.

## 13. Commit and history behavior

Preferred Knowledge Card commits:

```text
knowledge: add <Title>
knowledge: update <Title>
```

Repository infrastructure/documentation uses conventional prefixes such as `feat:`, `fix:`, `test:`, `docs:`, or `chore:`.

Keep commits understandable. Do not rewrite repository history as part of normal maintenance unless the user explicitly requests and the repository policy permits it.

## 14. Completion report

After a successful repository task, report only states actually verified.

For ingestion/update, include as relevant:

- added or updated;
- title;
- effective categories;
- overall relevance;
- actions;
- important change;
- repository path;
- Push / CI / Pages status.

For documentation/infrastructure work, report changed files, behavior impact, commit/PR/merge state, validation/CI state, and website/deployment state when verified.

Do not claim a successful write, CI run, merge, deployment, or source verification until it has actually happened.

## 15. Documentation governance

Use [`docs/DOCUMENTATION.md`](docs/DOCUMENTATION.md) to locate the current contract and [`docs/AUTHORITY_MAP.md`](docs/AUTHORITY_MAP.md) to understand responsibility boundaries.

Global rule files should contain only the invariants needed at their level:

```text
RUNTIME.md     → what the task/runtime must do
AGENTS.md      → how repository modifications are performed safely
INGESTION.md   → detailed generic ingestion/execution contract
THREADS_INGESTION.md → detailed Threads source contract
Schema/config  → hard data/config contracts
Code/workflows → executable implementation
```

**Do not duplicate source-specific algorithms, provider credentials/permissions, model settings, thresholds, request payloads, or execution internals in this root file.** Link to the primary authority instead.