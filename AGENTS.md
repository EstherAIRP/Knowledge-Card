# AGENTS.md — Knowledge Card operating contract

This file defines how Codex or any AI agent must work inside this repository. It applies to the entire repository unless a deeper `AGENTS.md` explicitly overrides it.

## 1. Repository purpose

Knowledge Card is a public-oriented personal technology knowledge radar. The normal workflow is:

```text
User supplies URL
→ resolve/canonicalize source
→ read primary evidence
→ detect create vs update
→ create or refresh structured analysis
→ preserve user-owned state
→ validate
→ commit/push
→ report the result
```

The user should not need to manually author Markdown for ordinary ingestion. In this knowledge-collection repository, a bare URL is an ingestion request unless the surrounding request clearly says otherwise.

## 2. Authoritative contracts

Before creating or updating a Knowledge Card, use these contracts:

1. `schema/knowledge-card.schema.json` — normative frontmatter schema.
2. `config/taxonomy.yaml` — controlled categories, actions, statuses, source types, and relevance dimensions.
3. `profile/public-profile.yaml` — the only personal context allowed in public personalized analysis.
4. `templates/knowledge-card.example.md` — canonical body structure.
5. `docs/INGESTION.md` — Phase 2 executable workflow.

Precedence:

```text
JSON Schema
> taxonomy.yaml
> public-profile.yaml for personalization/public safety
> AGENTS.md / ingestion workflow
> example/template
> existing AI-generated content
```

Do not silently invent new controlled enum values. Change the repository contract deliberately if a new category/action/status/source type/relevance dimension is genuinely required.

## 3. Mandatory Phase 2 preflight

Before authoring from a URL, run:

```bash
npm run ingest:resolve -- <URL>
```

Use the resolver output as the mechanical source identity contract:

- `canonical_url`
- `source_identity`
- stable `id`
- `mode`: `create` or `update`
- `existing_path`
- `suggested_path`

Do not create a second card when the resolver identifies an existing source.

If dependencies are not installed in the current environment, install them from `package.json` before using the repository scripts.

## 4. Source-reading rule

Never produce substantive analysis from a URL slug, search snippet, repository name, or model memory alone.

Before writing a card:

- open and read the primary source;
- for GitHub repositories, inspect repository metadata and README at minimum;
- inspect architecture/security/docs/config/source files when needed to support technical claims;
- for papers, prefer the paper/abstract and official project material;
- for articles/documentation, read the actual authoritative page;
- separate verified facts from inference;
- do not invent features, architecture, maturity, licenses, compatibility, benchmarks, or maintenance status.

If the source cannot be read sufficiently, do not fabricate a card. Report `SOURCE_UNAVAILABLE` or the concrete access limitation.

## 5. Canonicalization and deduplication

The resolver in `scripts/resolve-source.mjs` is the mechanical authority for routine URL normalization.

GitHub repository identity:

```text
source.identity = github:{owner-lowercase}/{repo-lowercase}
canonical_url   = https://github.com/{owner}/{repo}
```

Repository URL variants such as trailing slashes, `.git`, README/repository subpaths, query parameters, or fragments must not create duplicate cards.

For normal web sources, use the resolver's stable canonical URL and `url:{canonical_url}` identity. Known tracking parameters are removed conservatively while meaningful query parameters are preserved.

Before a new write completes, duplicate `id`, `source.identity`, and `canonical_url` are also checked by `npm run validate`.

## 6. Stable IDs and paths

For GitHub repositories, prefer the resolver-derived ID:

```text
id = github-{owner}-{repo}
```

New cards live under:

```text
content/knowledge/{YYYY}/{id}.md
```

Once created, routine updates must preserve:

- `id`
- `created_at`
- file path

Do not rename historical cards merely because a title or recommendation changes.

## 7. Create protocol

When resolver `mode` is `create`:

1. Read `templates/knowledge-card.example.md`.
2. Read current primary evidence.
3. Read `profile/public-profile.yaml` for personalized relevance only.
4. Produce valid frontmatter and the canonical body sections.
5. Write to resolver `suggested_path`.
6. Run `npm run validate`.
7. Commit only after validation succeeds.

## 8. Existing-card update protocol

When resolver `mode` is `update`:

1. Read the existing card completely.
2. Re-read the current primary source.
3. Preserve stable and user-owned state.
4. Refresh only AI-owned metadata/analysis from current evidence.
5. Set `last_checked_at` to the current date for a real re-check.
6. Set `updated_at` only when the Knowledge Card changes materially.
7. Append a changelog entry only for meaningful changes.
8. Before commit, run:

```bash
npm run validate:ownership -- <existing_path>
npm run validate
```

Meaningful changes include major features/architecture, provider/runtime support, project lifecycle changes, or relevance/action changes backed by substantive evidence. If no substantive knowledge changed, update only `last_checked_at` and avoid a noisy changelog entry.

## 9. AI/User ownership model

AI-generated state and user-owned overrides are separate.

Ownership wrappers include:

- `classification.categories`
- `classification.tags`
- `relevance`
- `actions`
- `status`

Rules:

- AI may refresh `ai` values during re-analysis.
- AI must preserve `user` values exactly unless the user explicitly asks to change/remove them.
- `relevance.user` is a partial per-dimension override map.
- effective wrapper value is `user ?? ai`;
- effective relevance is resolved dimension-by-dimension.
- `## 使用者備註` is user-owned and must be preserved verbatim.

The executable ownership check compares an edited existing card against `HEAD:<path>` and rejects accidental changes to stable/user-owned state.

## 10. Fixed multi-category classification and tags

Cards may have multiple categories, but every category must come from `config/taxonomy.yaml`.

Categories are broad navigation concepts; tags are fine-grained technical descriptors. AI may create free-form tags but must not create ad-hoc top-level categories.

## 11. Relevance scoring

Score all AI relevance fields from 1 to 5:

- `overall`
- `ai_rd`
- `aoi_ai`
- `llm_agent`
- `sillytavern_ai_rpg`
- `image_gen`

Use `config/taxonomy.yaml` definitions and only the public technical profile for personalization.

`overall` is a holistic practical/research judgment, not the arithmetic mean of the five dimensions. When uncertain, score conservatively and explain the reasoning in the body.

## 12. Action labels

Use one or more fixed actions only:

- `TRY`
- `BUILD`
- `INTEGRATE`
- `LEARN`
- `WATCH`
- `REFERENCE`
- `ARCHIVE`

Actions express what the user can reasonably do with the item, not merely whether it is interesting.

## 13. Public-safety boundary

This repository is intended for public publishing.

Personalized sections may use only:

- `profile/public-profile.yaml`
- public source material being analyzed
- existing public Knowledge Cards in this repository

Do not publish facts from private chat memory or hidden personal context. In particular, never introduce private employer/internal information, salary/financial information, personal relationships/family information, private project details, or other non-public identity details unless that exact information has been explicitly approved for publication.

Core rule:

> The agent knowing something does not make it publishable.

## 14. Canonical body structure

Use Traditional Chinese (`zh-TW`) for explanatory prose by default while retaining official project names and technical terms when clearer in English.

Required section order:

1. `# Title`
2. `## 一句話介紹`
3. `## 它解決什麼問題`
4. `## 核心概念`
5. `## 架構與技術`
6. `## 主要功能`
7. `## 技術亮點`
8. `## 限制與風險`
9. `## 與你的相關性`
10. `## 建議怎麼使用`
11. `## 與其他收藏的關聯`
12. `## 使用者備註`
13. `## 更新紀錄`

The body must provide actual analysis rather than simply paraphrasing marketing copy.

## 15. Related Knowledge

Only link to Knowledge Cards that actually exist. Search existing cards for shared categories, tags, architecture, purpose, or direct conceptual relationships when useful. Do not invent future cards.

## 16. Mandatory validation

Automated validation now exists. Do not substitute a casual manual inspection for it.

Before committing any card creation/update, run:

```bash
npm run validate
```

For an existing-card update, also run before commit:

```bash
npm run validate:ownership -- <path>
```

When Phase 2 tooling itself changes, also run:

```bash
npm test
```

`npm run validate` checks JSON Schema compliance, taxonomy/schema drift, body section order, title consistency, source identity normalization, duplicate IDs/identities/canonical URLs, and date ordering.

Do not knowingly commit a failed ingestion as successful.

## 17. Commit behavior

Preferred knowledge commits:

```text
knowledge: add <Title>
knowledge: update <Title>
```

Repository infrastructure uses conventional prefixes such as `feat:`, `fix:`, `test:`, `docs:`, or `chore:`.

Keep commits understandable and do not rewrite repository history as part of normal ingestion.

## 18. Completion report

After successful ingestion, report concisely:

- added or updated;
- title;
- effective categories;
- overall relevance;
- actions;
- important change if updating;
- repository path.

Do not claim success until the repository write has actually succeeded.
