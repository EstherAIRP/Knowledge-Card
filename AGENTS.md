# AGENTS.md — Knowledge Card operating contract

This file defines how Codex or any AI agent must work inside this repository. It applies to the entire repository unless a deeper `AGENTS.md` explicitly overrides it.

## 1. Repository purpose

This repository is a public-oriented personal technology knowledge radar. The primary workflow is:

```text
User supplies URL
→ read the source
→ canonicalize source identity
→ detect an existing Knowledge Card
→ create or update structured analysis
→ preserve user-owned overrides
→ validate
→ commit/push
→ report the result
```

The user should not need to manually author Markdown for normal ingestion.

## 2. Authoritative contracts

Before creating or updating a Knowledge Card, read these files:

1. `schema/knowledge-card.schema.json` — normative frontmatter schema.
2. `config/taxonomy.yaml` — allowed categories, actions, statuses, source types, and relevance dimensions.
3. `profile/public-profile.yaml` — the only personal context allowed in public personalized analysis.
4. `templates/knowledge-card.example.md` — canonical authoring structure and section order.

If these files disagree, use this precedence:

```text
JSON Schema
> taxonomy.yaml
> public-profile.yaml for personalization/public-safety questions
> example/template
> existing generated content
```

Do not silently expand controlled enums. If a new top-level category, action, relevance dimension, status, or source type is genuinely needed, modify the contract deliberately rather than inventing a value inside one card.

## 3. Ingestion trigger and default behavior

When the user supplies a URL for collection, the default behavior is automatic ingestion:

```text
URL → analyze → create/update → validate → commit/push → tell the user what changed
```

Do not ask for confirmation before writing unless the requested operation is ambiguous, unsafe, or conflicts with repository rules.

A bare URL in the knowledge-collection context should be treated as an ingestion request.

## 4. Source-reading rule

Never create substantive analysis from a URL slug, search-result snippet, repository name, or prior model memory alone.

Before writing a card:

- Open and read the primary source.
- For GitHub repositories, inspect at minimum the repository description and README; inspect relevant docs/config/source files when needed to support architectural claims.
- For papers, prefer the paper/abstract and official project material.
- For articles/documentation, read the actual page or authoritative source.
- Separate verified facts from inference.
- Do not invent features, architecture, maturity, licenses, compatibility, benchmarks, or maintenance status.

If the source cannot be accessed well enough to produce a reliable card, do not fabricate a card. Report `SOURCE_UNAVAILABLE` or the concrete access limitation.

## 5. Canonicalization and deduplication

Every source must have a stable identity.

For a GitHub repository:

```text
source.identity = github:{owner}/{repo}
canonical_url   = https://github.com/{owner}/{repo}
```

Normalize away irrelevant URL variants such as:

- trailing `/`
- README anchors
- `?tab=readme-*`
- tracking parameters
- `www` differences where the source is otherwise identical

For non-GitHub sources, use a stable canonical URL identity:

```text
source.identity = url:{canonical_url}
```

Before creating a new card, search existing cards under `content/knowledge/` for:

1. exact `source.identity`
2. exact normalized `canonical_url`
3. obvious equivalent source identity

If an existing card is found, update it instead of creating a duplicate.

## 6. Stable IDs and paths

For GitHub repositories, prefer:

```text
id = github-{owner}-{repo}
```

Convert to lowercase and normalize unsupported punctuation to hyphens while satisfying the JSON Schema.

For other sources, derive a stable lowercase slug from the domain/source title and avoid date-dependent IDs unless required for uniqueness.

New real cards belong under:

```text
content/knowledge/{YYYY}/{slug}.md
```

`YYYY` is the card's original creation year. Once created, keep `id`, `created_at`, and file path stable during routine updates.

## 7. Frontmatter ownership model

AI-generated values and user-owned overrides are separate.

Fields with ownership wrappers include:

- `classification.categories`
- `classification.tags`
- `relevance`
- `actions`
- `status`

Rules:

- AI may freely refresh `ai` values when re-analyzing a source.
- AI must preserve `user` values exactly unless the user explicitly asks to change or remove them.
- For `relevance.user`, preserve every existing key/value; it is a partial per-dimension override map.
- `null` means no user override for wrapper fields that use nullable overrides.
- The effective value used by later UI code is `user ?? ai`; for partial relevance, resolve each dimension independently.

Never infer that a user override is obsolete merely because the source changed.

## 8. Fixed multi-category classification

Cards may belong to multiple categories. Use only categories defined in `config/taxonomy.yaml`.

Categories are broad navigation concepts. Tags are fine-grained technical descriptors.

Good example:

```yaml
classification:
  categories:
    ai:
      - LLM
      - Agent
      - RAG / Memory / Knowledge
    user: null
  tags:
    ai:
      - long-term-memory
      - personal-ai
      - tool-calling
    user: null
```

Do not create a new category just because a precise free-form tag would be useful.

## 9. Relevance scoring

Score all six AI relevance values from 1 to 5:

- `overall`
- `ai_rd`
- `aoi_ai`
- `llm_agent`
- `sillytavern_ai_rpg`
- `image_gen`

Use the definitions in `config/taxonomy.yaml` and the public technical profile only.

`overall` is a holistic judgment, not an arithmetic average of the five dimensions.

When uncertain, score conservatively and explain the practical reasoning in the card body.

## 10. Action labels

Use one or more fixed labels from `config/taxonomy.yaml`:

- `TRY`
- `BUILD`
- `INTEGRATE`
- `LEARN`
- `WATCH`
- `REFERENCE`
- `ARCHIVE`

Actions should express what the user can reasonably do with the item, not merely whether the source is interesting.

## 11. Public-safety boundary

This repository is designed for public publishing.

Personalized sections may use only:

- `profile/public-profile.yaml`
- public source material being analyzed
- existing public Knowledge Cards in this repository

Do not write facts derived from private chat memory or hidden personal context into repository content.

In particular, never introduce private employer/internal information, salary/financial information, personal relationships, family information, private project details, or other non-public identity details unless they have first been explicitly added to the public profile or the user explicitly instructs that specific information to be published.

Core rule:

> The agent knowing something does not make it publishable.

## 12. Card body structure

Use Traditional Chinese (`zh-TW`) for explanatory prose by default while retaining official project names and technical terms when clearer in English.

Follow this section order:

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

The body should provide real analysis rather than restating README marketing copy.

### User notes

`## 使用者備註` is user-owned content. Preserve it verbatim during AI refreshes unless the user explicitly asks to edit it.

## 13. Existing-card update protocol

When a source already exists:

1. Read the current card completely.
2. Re-read the current primary source.
3. Preserve:
   - `id`
   - `created_at`
   - file path
   - all `user` override values
   - `## 使用者備註`
   - prior `## 更新紀錄`
4. Refresh AI-owned metadata and analysis based on current evidence.
5. Set `last_checked_at` to the current date.
6. Set `updated_at` only when the Knowledge Card itself changes materially.
7. Append a changelog entry only for meaningful changes.

Examples of meaningful changes:

- major new feature or architecture
- supported provider/runtime changed
- project archived or revived
- significant maturity/status change
- relevance/action recommendation changed for a substantive reason

If no substantive knowledge changed, update only `last_checked_at`; do not add noisy changelog entries.

## 14. Related Knowledge

When useful, search existing cards for related items using shared categories, tags, architecture, purpose, or direct conceptual relationships.

Only link to cards that actually exist. Do not invent future cards.

## 15. Validation before write completion

Until an automated validator exists, manually verify at least:

- frontmatter parses as YAML
- required fields exist
- `schema_version` is `1`
- `id` obeys the schema and is unique
- `source.identity` and `canonical_url` do not duplicate another card unless updating it
- categories belong to the fixed taxonomy
- relevance values are integers from 1 through 5
- actions/status/source type belong to fixed enums
- date values use `YYYY-MM-DD`
- `updated_at >= created_at`
- user overrides and user notes were preserved
- public-safety rules were followed

Do not push knowingly invalid content.

## 16. Commit behavior

For a new card, prefer:

```text
knowledge: add <title>
```

For an updated card, prefer:

```text
knowledge: update <title>
```

For repository infrastructure, use conventional prefixes such as `chore:`, `docs:`, `feat:`, `fix:`.

Keep commits scoped and understandable. Do not rewrite repository history as part of normal ingestion.

## 17. Completion report to the user

After a successful ingestion, report concisely:

- whether the card was added or updated
- title
- effective categories
- overall relevance
- actions
- important change if updating
- repository path

Do not claim success until the repository write has actually succeeded.
