---
prompt_version: 1.12.1
updated_at: 2026-08-18
repository: EstherAIRP/Knowledge-Card
---

# Knowledge Card Runtime Prompt

> **Role:** Normative runtime orchestration contract  
> **Documentation router:** [`../docs/DOCUMENTATION.md`](../docs/DOCUMENTATION.md)  
> **Authority map:** [`../docs/AUTHORITY_MAP.md`](../docs/AUTHORITY_MAP.md)

本文件定義 Knowledge Card 任務「收到輸入後要做什麼」。來源專用演算法、Remote Ingest 實作、模型權限與判定門檻由對應 domain spec、workflow 與程式碼維護，不在本文件重複定義。

## 1. 任務觸發

以下輸入預設視為 Knowledge Card 收錄／更新任務，不需再次確認：

- 技術文章 URL
- GitHub Repository URL
- 論文 / arXiv / DOI URL
- 官方文件、工具、產品、技術介紹 URL
- 使用者要求重新分析、更新評分、修改 Action、Category、Tag 或補充內容

若使用者只貼 URL，預設執行完整 ingestion flow。

若使用者明確要求的是說明、審查、規劃或其他不寫入 Repository 的工作，依使用者要求處理，不應把它誤當成 ingestion write。

## 2. Mandatory Preflight

處理收錄、更新、重新分析或人工修正前，依序讀取最新版：

1. `prompts/RUNTIME.md`
2. `AGENTS.md`
3. `profile/public-profile.yaml`
4. `config/taxonomy.yaml`
5. 需要驗證或編輯 Card 結構時讀取 `schema/knowledge-card.schema.json`

接著依任務載入 domain contract：

- 一般 URL / GitHub / paper / documentation / tool：`docs/INGESTION.md`
- Threads：`docs/INGESTION.md` + `docs/THREADS_INGESTION.md`
- Repository 文件導航：`docs/DOCUMENTATION.md`
- 權威來源判定：`docs/AUTHORITY_MAP.md`

`docs/DOCUMENTATION.md` 與 `docs/AUTHORITY_MAP.md` 是導航／治理索引，不會覆蓋其所連結的 normative contract。

Repository 內容是本專案最新規則來源。

## 3. URL Ingestion Orchestration

### 3.1 Provider route 是 hard gate

在 extraction、browser fallback 或 semantic recovery 前，先確定 primary resource 的 provider route。

核心不變量：

```text
Threads source     → Threads source contract
Non-Threads source → generic/provider contract
```

- `threads.com` / `threads.net` 與解析後落在 Threads 的 transient URL 必須走 `docs/THREADS_INGESTION.md`。
- GitHub 與其他非 Threads URL 走 `docs/INGESTION.md` 定義的一般流程。
- route 一旦確定，不得混用另一條 route 的 completeness 規則或工具。
- 不得因正文提到 Threads、含 Threads 連結、或模型認為內容「像串文」而自行切換 route。

來源 family、canonicalization、Threads Phase 1–7、Browser evidence、semantic recovery 與 snapshot 細節，均以 domain spec 與 resolver implementation 為準，不在本文件複製。

### 3.2 Execution backend 與 source failure 必須分離

一般 ingestion 的高階入口是：

```bash
npm run ingest:dispatch -- <URL>
```

所有 approved backend 最終使用 Repository 定義的 resolver contract。`npm run ingest:resolve -- <URL>` 是 backend 內部的低階 resolver／debug 入口。

核心不變量：

```text
execution/runtime failure != source unavailable
```

執行策略維持：

```text
LocalBackend
↓ 若目前 runtime 無法執行
Repository-defined RemoteBackend
↓
accepted result 或 fail closed
```

既有 Card、alias 或 accepted snapshot 可以協助識別 identity/history，但不能取代 current live completeness / freshness validation。

詳細 backend request protocol、Remote Ingest artifact、managed semantic backend、failure vocabulary 與安全限制以 `docs/INGESTION.md`、`.github/workflows/remote-ingest.yml` 及 trusted execution code 為準。

Runtime 必須遵守以下硬規則：

- local tool、network、browser 或 model capability 缺失，不得直接宣稱 public source unavailable；
- execution backend failure 與 source extraction/completeness failure必須分開回報；
- `INGESTION_BLOCKED`、incomplete、ambiguous、identity mismatch 或其他未 accepted 狀態不得建立／更新正式 Card；
- live revalidation 未完成時，不得刷新 analysis、`last_checked_at` 或 accepted source snapshot；
- session/tool 差異不得降低 provider completeness、安全或 identity gate。

### 3.3 Provider-specific completeness

Card authoring 只能使用已通過對應 provider contract 的 accepted source。

Threads 特別遵守：

- 完整來源與 root identity 由 `docs/THREADS_INGESTION.md` 定義；
- formal analysis 使用 accepted `source_document.combined_text`，而不是只分析原始分享的單篇；
- structural 與 `llm_assisted` verification 必須保留其實際 provenance，不得把推論描述成 Threads 原生 graph 已驗證；
- snapshot 只能在 Card create/update 成功驗證後推進。

Phase 7 semantic judgement、`root_only`、candidate labels、confidence / metadata thresholds、Phase 8 managed ranker 與 semantic handoff 的完整 contract 不在 Runtime 重複維護；請直接遵循 Threads domain spec、managed agent prompt 與 validation code。

### 3.4 Source-reading rule

不得只根據 URL slug、搜尋摘要、Repository 名稱或模型記憶產生實質分析。

寫入前至少應：

- 打開並閱讀 primary source；
- GitHub Repository 至少查看 repository metadata 與 README；需要支撐技術判斷時再查看 architecture/security/docs/config/source；
- paper 優先閱讀論文／摘要與官方 project material；
- article / documentation 使用實際 authoritative page；
- 區分來源已驗證事實與分析推論；
- 不得臆造功能、架構、授權、相容性、成熟度、benchmark 或維護狀態。

來源不足且無法通過 allowed backend / provider contract 時，fail closed，不得自行補完 Card。

## 4. Analysis Standard

Knowledge Card 應回答：

- 這是什麼、解決什麼問題
- 核心概念
- 架構與主要技術
- 主要功能
- 技術亮點
- 限制、風險與成熟度
- 與公開技術背景的相關性
- 建議怎麼使用
- 與其他收藏的可能關聯

分析應重視技術實質，不只改寫專案 README 或宣傳文字。

## 5. Classification & Recommendation

### Controlled vocabulary

Category、Action、Status、Source Type 與 Relevance dimensions 的唯一人類可讀 vocabulary authority 是 `config/taxonomy.yaml`；不得在 Runtime 維護第二份 enum 清單或臨時新增 controlled value。

### Tags

可自由生成細粒度技術 Tag，但應避免無辨識度的泛用詞。

### Relevance

依 `config/taxonomy.yaml` 的維度與 1–5 scale 評估。`overall` 是整體實務／研究價值判斷，不要求等於各維度算術平均。

個人化 relevance 與 recommendation 只能使用 `profile/public-profile.yaml` 允許的公開脈絡。

### Actions

只能選擇 taxonomy 已定義的 Action，且每個 Action 都必須可由正文分析與來源 evidence 支持。

## 6. Create / Update Policy

正式寫入必須以 accepted resolver identity 判定 create 或 update；不得因 URL 變體建立重複 Card。

### Create

- 使用 resolver 建議 identity/path；
- 依 Schema、Taxonomy 與 `templates/knowledge-card.example.md` 建立 Card；
- 只使用 accepted source 與 public profile；
- validation 成功後才可視為完成。

### Update

既有 Card 再次被提交時：

- 保留 stable `id`、`created_at` 與既有檔案路徑；
- 只刷新 AI-owned metadata、analysis、classification、relevance、actions 與必要日期；
- 完整保留 user-owned state 與 `## 使用者備註`，除非使用者明確要求修改；
- 有實質變化才更新 `updated_at` 與新增 Update Log；
- 真正完成 current-source re-check 才能更新 `last_checked_at`；
- Threads source change / snapshot 行為依 Threads contract 與 source-state tooling 執行；
- live execution / revalidation blocked 時不得假裝已完成更新。

更完整的 create/update engineering protocol 由 `AGENTS.md` 定義。

## 7. User-owned State

任何人工 override 都高於對應 AI 值：

```text
effective_value = user_override ?? ai_value
```

AI refresh 不得覆蓋 user-owned category/tag/relevance/action/status override 或 `## 使用者備註`。既有 Card 更新必須通過 ownership validation。

## 8. Public Safety

公開 Knowledge Card 的個人化內容只能使用 `profile/public-profile.yaml` 定義的 publication policy，以及其中允許的公開來源。

核心規則：

```text
Agent 知道某件事 ≠ 可以公開寫入 Repository
```

不得使用私人聊天記憶或其他未列入 public profile 的個人資料補強公開 Card；不確定是否可公開時應省略。

## 9. Validation & Push

寫入後依 Repository contract 完成對應 validation：

1. Card create/update：`npm run validate`
2. 既有 Card update：另執行 `npm run validate:ownership -- <card-path>`
3. source tooling / ingestion implementation 改動：另執行 `npm test`
4. Threads accepted create/update：Card validation 成功後，依 source-state tooling 推進實際變更的 snapshot
5. Commit / Push 依 `AGENTS.md` 執行
6. GitHub Actions 負責對應 CI、production build、generated indexes 與 Pages deployment

Validation 失敗、ingestion blocked 或 source 未 accepted 時，不得把結果回報成完成品，也不得推進 accepted source state。

## 10. Completion Report

成功的 ingestion／update 回覆應簡潔包含：

- 新增或更新
- Knowledge Card 名稱
- effective Category
- Relevance Overall
- Action
- 主要技術價值／更新重點
- Repository path
- Push / CI / Pages 狀態（只回報已實際驗證的狀態）

Threads 在有助於理解時，補充 source change 與 structural / `llm_assisted` verification；不得誇大 verification level。

未完成時必須清楚區分 execution-backend failure、source extraction/completeness failure 與 `INGESTION_BLOCKED`，不可用模糊的「來源不可用」代替實際原因。

## 11. Documentation Authority & Change Policy

本文件只負責 **runtime orchestration**。詳細責任分工如下：

- Repository engineering / ownership / write safety：`AGENTS.md`
- Generic ingestion / execution backend：`docs/INGESTION.md`
- Threads source semantics / completeness：`docs/THREADS_INGESTION.md`
- Automation overview：`docs/AUTOMATION.md`
- Executable workflows：`.github/workflows/*.yml`
- Knowledge Card data shape：`schema/knowledge-card.schema.json`
- Controlled vocabulary：`config/taxonomy.yaml`
- Public personalization boundary：`profile/public-profile.yaml`
- Authoring example：`templates/knowledge-card.example.md`

**Do not duplicate source-specific algorithms or provider implementation details in this file.** 使用連結指向權威文件，必要時只保留能支撐 runtime decision 的摘要與 hard invariant。

規則優先級維持：

```text
JSON Schema
> taxonomy.yaml
> public-profile.yaml for personalization/public safety
> RUNTIME.md / AGENTS.md / applicable domain contract
> example/template
> existing AI-generated content
```

若規則衝突，不得違反 Schema、Taxonomy controlled values、user-owned state 或 public-safety boundary。Runtime 行為策略調整必須更新本文件並記錄到 `prompts/CHANGELOG.md`；domain-specific 行為則應修改其 domain contract 與對應 implementation/tests，而不是把完整規則再次複製回 Runtime。
