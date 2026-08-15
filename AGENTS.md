# AGENTS.md — Knowledge Card operating contract

This file defines how Codex or any AI agent must work inside this repository. It applies to the entire repository unless a deeper `AGENTS.md` explicitly overrides it.

## 1. Repository purpose

Knowledge Card is a public-oriented personal technology knowledge radar. The normal workflow is:

```text
User supplies URL
→ route by source provider
→ dispatch to an allowed execution backend
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
5. `docs/INGESTION.md` — executable ingestion workflow.
6. `docs/THREADS_INGESTION.md` — Threads-only source adapter contract.

Precedence:

```text
JSON Schema
> taxonomy.yaml
> public-profile.yaml for personalization/public safety
> RUNTIME.md / AGENTS.md / ingestion workflow
> example/template
> existing AI-generated content
```

Do not silently invent new controlled enum values. Change the repository contract deliberately if a new category/action/status/source type/relevance dimension is genuinely required.

## 3. Mandatory preflight and URL routing

For normal URL ingestion, use the execution dispatcher when the current runtime can run repository commands:

```bash
npm run ingest:dispatch -- <URL>
```

`ingest:dispatch` uses the local backend first. A successful local envelope contains the normal resolver result under `result`. The resolver result remains the mechanical source identity contract:

- `canonical_url`
- `source_identity`
- stable `id`
- `mode`: `create` or `update`
- `existing_path`
- `suggested_path`

`npm run ingest:resolve -- <URL>` remains the low-level mandatory resolver executed inside an approved backend and may still be used directly for debugging/tests. Ordinary agents should prefer `ingest:dispatch` so execution routing is explicit.

Do not create a second card when the accepted resolver result identifies an existing source.

### 3.1 Provider routing is a hard gate

The ingestion route must be selected mechanically from the source URL. **Threads and non-Threads flows are mutually exclusive.**

| Source | Required route |
| --- | --- |
| `threads.com` / `threads.net`, including `www`, subdomains, `/share/*`, `/t/*`, and `/@user/post/*` | Threads Phase 1–7 route defined in `docs/THREADS_INGESTION.md` |
| A transient/short URL whose resolved primary resource is on `threads.com` / `threads.net` | Switch to the Threads Phase 1–7 route after URL resolution |
| GitHub Repository URL | Generic ingestion with GitHub canonical identity; read repository metadata + README at minimum |
| Paper / arXiv / DOI / article / documentation / tool / product / any other non-Threads URL | Generic ingestion route defined in `docs/INGESTION.md` |

Hard rules:

- A Threads URL must not be treated as a generic article whose currently shared post is sufficient evidence.
- A non-Threads URL must not invoke Threads Playwright navigation, Threads conversation reconstruction, Threads continuation candidate collection, Threads LLM ranker, or Threads source snapshots.
- Do not switch a non-Threads source to the Threads route merely because its body mentions Threads or contains a Threads hyperlink.
- Once provider routing is established for the primary resource, do not mix provider-specific completeness contracts in the same ingestion.

If dependencies are not installed in the current environment, install them from `package.json` before using the repository scripts when the runtime permits package installation.

### 3.2 Execution backend policy — runtime failure is not source failure

Provider routing answers **what source pipeline is required**. Execution routing answers **where that pipeline can run**. These are separate decisions.

Core invariant:

```text
execution/runtime failure != source unavailable
```

An agent must not classify a public source as unavailable merely because the current ChatGPT/Codex runtime lacks shell access, Node/npm, outbound network, Playwright/Chromium, a required model endpoint, or another execution capability.

Execution backends are attempted in this order when applicable:

1. **Local execution backend** — the current runtime executes `ingest:dispatch` / resolver code directly. If dependencies or browser binaries are missing and installation is permitted, install them from the repository contract first.
2. **Repository-defined remote execution backend** — when local execution is unavailable and GitHub repository write + Actions read access are available, use the permanent `Remote Ingest` request-branch protocol below.
3. **Existing alias / accepted snapshot lookup** — may identify a previously accepted source, existing Card or prior source state, but is only an identity/history aid. It never substitutes for current live completeness or freshness validation.

Required failure vocabulary:

- `LOCAL_EXECUTION_UNAVAILABLE` — current runtime cannot execute the required repository pipeline.
- `REMOTE_EXECUTION_UNAVAILABLE` — the repository-defined remote backend is inaccessible or cannot execute the request.
- `SOURCE_EXTRACTION_FAILED` — a viable backend reached the source pipeline, but extraction failed for a source/evidence reason rather than merely missing local runtime capability.
- `SOURCE_INCOMPLETE` — evidence was extracted, but provider completeness/ambiguity gates did not pass.
- `INGESTION_BLOCKED` — no allowed backend can produce an accepted source for this ingestion attempt.
- `SOURCE_UNAVAILABLE` — reserve for a source-level condition supported by an actually viable backend, not for a missing local execution capability.

Rules:

- A local `THREADS_BROWSER_UNAVAILABLE` / `THREADS_BROWSER_LAUNCH_FAILED` caused by missing browser capability is an execution-backend failure first; it is not proof that the Threads source is unavailable.
- A local network/DNS restriction is an execution-backend limitation unless the same source-level failure is established through another viable backend.
- If a previous Card or accepted snapshot exists but live execution is blocked, the agent may report the known existing identity/state and that revalidation is blocked. It must not rewrite analysis or advance source state as though the current source had been verified.
- No `INGESTION_BLOCKED`, execution-backend failure, incomplete source or ambiguous source may create/update a formal Card or advance a Threads snapshot.
- Session-to-session tool differences must not weaken source-completeness requirements or change provider routing.

### 3.3 Phase 8B permanent Remote Ingest protocol

The repository-defined remote backend is `.github/workflows/remote-ingest.yml`. Do **not** create ad-hoc workflow files for ordinary ingestion.

When local execution cannot run and GitHub write/Actions access is available:

1. Re-read current `main` and create a temporary branch named `runtime/ingest/{request_id}` from that exact current `main` commit.
2. Add exactly one request file at `.runtime/requests/{request_id}.json` on that branch. Do not modify source code, workflow code, Cards or state on the request branch.
3. The request schema is:

```json
{
  "schema_version": 1,
  "request_id": "20260815-example01",
  "operation": "resolve",
  "url": "https://example.com/source"
}
```

`request_id` must be 6–80 lowercase URL-safe characters; `operation` is currently only `resolve`; `url` must be absolute HTTP(S).
4. Push/commit the request file. The permanent `Remote Ingest` workflow is triggered by `runtime/ingest/**` + `.runtime/requests/*.json`.
5. Find the matching `Remote Ingest` workflow run by branch/request identity and wait for completion.
6. Fetch the artifact named `remote-ingest-{request_id}`. It contains `remote-ingest-result.json` for one day.
7. Verify all of the following before using it:
   - `schema_version === 1`
   - `request_id` exactly matches the submitted request
   - `execution.backend === "github_actions"`
   - `execution.status === "success"`
8. Use `result` as the accepted resolver/preflight output. If the envelope status is `failure`, honor its failure classification and do not author a Card.
9. The workflow cleanup job attempts to delete the temporary `runtime/ingest/**` branch after execution. Request files/results are operational transport and must never be merged to `main`.

Remote runner security/behavior:

- the workflow checks out **trusted harness code from `main`** into `app/`;
- the request branch is checked out separately as **data only**;
- Node 24 + repository dependencies are installed;
- Chromium is installed for provider flows that may require Playwright;
- the URL is parsed as request data and is never interpreted as a shell command;
- the full execution result is stored in the short-lived Actions artifact, not committed to repository state and not dumped into logs;
- the same resolver/provider completeness gates apply remotely as locally.

### 3.4 Phase 8C managed Threads continuation ranker

Remote Ingest has a repository-managed Phase 7 ranker implemented with **GitHub Copilot CLI**. The trusted `main` harness injects this ranker only when the Threads pipeline reaches semantic continuation/root-only recovery.

Managed configuration:

```text
provider: github_copilot
adapter: copilot_cli
agent: threads-continuation-ranker
model: gpt-5.2
resolve permissions: contents: read + copilot-requests: write
auth: workflow GITHUB_TOKEN → child COPILOT_GITHUB_TOKEN
runner: remote-ingest-v3
```

Rules:

- request branches must never carry model credentials, endpoint overrides, prompts, tool policy, agent definitions or executable ranker code;
- the model-running `resolve` job does not have contents-write permission; request-branch deletion runs in a separate `cleanup` job with `contents: write` and no Copilot request permission;
- `GITHUB_TOKEN` is exposed only to the remote preflight step. The Copilot child receives it as `COPILOT_GITHUB_TOKEN` through an explicit environment whitelist; arbitrary workflow secrets/environment variables are not forwarded;
- the Copilot process runs in an ephemeral workspace with isolated `HOME` / `COPILOT_HOME`; only the trusted `.github/agents/threads-continuation-ranker.agent.md` is copied into that workspace;
- the trusted agent defines `tools: []`, so shell, file, URL, GitHub, MCP, memory and other tools are unavailable during semantic classification;
- root/candidate source text is sent through stdin as untrusted quoted data and can never be treated as executable instructions;
- Copilot only supplies the semantic judgement. Existing Phase 7 candidate filtering, structural conflict checks, confidence thresholds, metadata gates, chronology checks, root-only complete-label coverage, and fail-closed behavior remain authoritative;
- accepted inferred sources preserve `thread.verification = llm_assisted` and ranker provenance: `github_copilot_cli` / `github_copilot` / model / agent;
- CLI/auth/policy/quota/model failure, timeout, output-limit violation, invalid JSON, low-confidence judgement or deterministic-gate rejection remains fail closed and must never be replaced with timestamp-only guessing;
- execution failure envelopes may expose safe direct nested `cause_code` / bounded redacted `cause_message`, but never provider tokens, raw provider payloads or full source dumps;
- local execution remains provider-neutral and may still inject a custom `continuationRanker` or use the OpenAI-compatible environment configuration defined by the Threads adapter.

## 4. Source-reading rule

Never produce substantive analysis from a URL slug, search snippet, repository name, or model memory alone.

Before writing a card:

- open and read the primary source;
- for GitHub repositories, inspect repository metadata and README at minimum;
- inspect architecture/security/docs/config/source files when needed to support technical claims;
- for papers, prefer the paper/abstract and official project material;
- for articles/documentation, read the actual authoritative page;
- for Threads, use the complete `source_document` returned by the Threads route rather than only the originally shared part;
- separate verified facts from inference;
- do not invent features, architecture, maturity, licenses, compatibility, benchmarks, or maintenance status.

If the source cannot be read sufficiently after applying the execution-backend policy, do not fabricate a card. Report the concrete source-level extraction/completeness failure, or `INGESTION_BLOCKED` when execution backends themselves are unavailable. Do not use `SOURCE_UNAVAILABLE` as a synonym for local runtime incapability.

## 5. Canonicalization and deduplication

The resolver in `scripts/resolve-source.mjs` is the mechanical authority for routine URL normalization.

GitHub repository identity:

```text
source.identity = github:{owner-lowercase}/{repo-lowercase}
canonical_url   = https://github.com/{owner}/{repo}
```

Repository URL variants such as trailing slashes, `.git`, README/repository subpaths, query parameters, or fragments must not create duplicate cards.

For normal non-Threads web sources, use the resolver's stable canonical URL and `url:{canonical_url}` identity. Known tracking parameters are removed conservatively while meaningful query parameters are preserved.

For Threads, root-level canonicalization and deduplication are defined by the Threads adapter: the complete self-thread resolves to the root permalink and `threads:{root_shortcode}` identity before create/update lookup.

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
2. Read current primary evidence using the already-selected provider route.
3. Read `profile/public-profile.yaml` for personalized relevance only.
4. Produce valid frontmatter and the canonical body sections.
5. Write to resolver `suggested_path`.
6. Run `npm run validate`.
7. For Threads only, after Card validation succeeds, advance accepted source state with `npm run ingest:snapshot -- <Threads URL>` when the snapshot changes.
8. Commit only after validation succeeds.

## 8. Existing-card update protocol

When resolver `mode` is `update`:

1. Read the existing card completely.
2. Re-read the current primary source using the same provider route.
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

9. For Threads only, after successful Card/ownership validation, run `npm run ingest:snapshot -- <Threads URL>` if the accepted source baseline must advance.

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

When ingestion/source tooling itself changes, also run:

```bash
npm test
```

Documentation-only routing/execution-contract clarifications do not require source-tooling tests, but repository validation / CI must still pass before promoting the branch to `main`.

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

For Threads, also report inferred-vs-structural verification when relevant. Do not claim success until the repository write has actually succeeded.
