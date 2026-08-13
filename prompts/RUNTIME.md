---
prompt_version: 1.3.0
updated_at: 2026-08-13
repository: EstherAIRP/Knowledge-Card
---

# Knowledge Card Runtime Prompt

本文件定義 Knowledge Card 專案目前的執行行為。每次處理收錄、更新、重新分析或人工修正任務前，都應讀取本文件最新版。

## 1. 任務觸發

以下輸入預設視為 Knowledge Card 任務，不需再次確認：

- 技術文章 URL
- GitHub Repository URL
- 論文 / arXiv / DOI URL
- 官方文件、工具、產品、技術介紹 URL
- 使用者要求重新分析、更新評分、修改 Action、Category、Tag 或補充內容

若使用者只貼 URL，預設執行完整 ingestion flow。

## 2. 執行前必讀

依序讀取：

1. `prompts/RUNTIME.md`
2. `AGENTS.md`
3. `profile/public-profile.yaml`
4. `config/taxonomy.yaml`
5. 必要時讀取 `schema/knowledge-card.schema.json`

Repository 內容是本專案最新規則來源。

## 3. URL Ingestion

收到 URL 後：

1. 若輸入是 transient / share / short URL，先解析成實際 primary resource URL，再執行 canonicalization / identity resolution。不得把分享層 URL 本身當作正式來源 identity。
2. Threads 的 `/share/*` 與 `/t/*` 必須先解析成 `@user/post/*` canonical post URL；解析器依序使用 HTTP redirect、HTML canonical / embedded URL，必要時可接 browser resolver fallback。
3. 對 Threads 使用 `npm run ingest:extract -- <URL>` 執行完整 source extraction。Phase 2 single-post extractor 先取得目標 post；Phase 3 再從 HTML hydration / conversation adapter 建立 reply graph、回溯 root、重建同作者 self-thread。
4. Self-thread 只能沿 `same author + replied_to === previous post + same root` 的結構關係前進。不得只靠時間接近推測正文。若同一層出現多個無法由 thread index 唯一判定的同作者 branch，標記 `AMBIGUOUS_THREAD` 並停止正式 ingestion。
5. 若 Threads UI / adapter 提供 `n/N`，必須拿來驗證 `input_index`、`thread.total` 與實際 `parts.length`。已知總篇數但缺篇時標記 `INCOMPLETE_THREAD`；不得把部分內容當完整來源。
6. 完整 Threads source 以 root post 為 canonical source。`canonical_url` 必須指向 root post，`source.identity` 使用 `threads:{root_shortcode}`；因此使用者貼 root、middle part、last part、share URL 或 threads.net variant，都應在完整重建後落到同一 source identity。
7. Threads normalized conversation 必須保存 `parts[]` 原始分段與 `combined_text`。Knowledge Card 分析使用完整 `combined_text`，但 provenance / 更新檢查保留每個 part 的 id、shortcode、reply_to、timestamp、media 與 permalink。
8. `thread.complete` 必須為 `true` 才可把 Threads 內容當正式 Knowledge Card primary source。`INCOMPLETE_THREAD`、`AMBIGUOUS_THREAD` 或 source extraction error 都應 fail closed。
9. 執行 canonicalization / identity resolution，並檢查是否已有相同 `source.identity` 或 `canonical_url`。Threads 的最終 create/update 判定以 Phase 3 root canonical URL 為準，不以前置 share/middle-post URL 為準。
10. 新來源建立 Card；既有來源更新原 Card，不得建立重複 Card。
11. 優先讀取 primary source；GitHub 專案至少讀 README，若架構或限制需要更多證據，再讀官方 docs / architecture / release 等來源。
12. 不得只根據搜尋摘要或第三方介紹建立正式 Card。

Threads source adapter 分工：Phase 1 = URL resolution；Phase 2 = exact single-post extraction；Phase 3 = root traversal、conversation graph、author-chain reconstruction、`n/N` completeness validation 與 root-level identity。

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

分析應重視技術實質，不只改寫專案 README。

## 5. Classification

### Category

只能使用 `config/taxonomy.yaml` 中既有 Category，可多選，不得臨時新增頂層分類。

### Tags

可自由生成細粒度技術 Tag；避免無辨識度的泛用詞。

### Relevance

使用 1–5 分評估：

- `overall`
- `ai_rd`
- `aoi_ai`
- `llm_agent`
- `sillytavern_ai_rpg`
- `image_gen`

`overall` 是整體價值判斷，不必等於各維度平均值。

### Action

只能使用 taxonomy 定義的 Action：

- `TRY`
- `BUILD`
- `INTEGRATE`
- `LEARN`
- `WATCH`
- `REFERENCE`
- `ARCHIVE`

允許多選，但每個 Action 都要能由正文分析支持。

## 6. Update Policy

既有 Card 再次被提交時：

- 保留 `id` 與 `created_at`
- 更新來源 metadata、摘要、AI-owned classification / relevance / actions、正文分析與日期
- 保留所有 user-owned state
- 保留 `## 使用者備註`
- 有實質變化才新增 Update Log
- 只有重新檢查但沒有實質變化時，可只更新 `last_checked_at`

## 7. User-owned State

任何人工設定都高於 AI 產生值：

`effective_value = user_override ?? ai_value`

AI refresh 不得覆蓋：

- user category override
- user tag override
- user relevance override
- user action override
- user status override
- `## 使用者備註`

更新既有 Card 時必須執行 ownership validation。

## 8. Public Safety

公開 Knowledge Card 的個人化內容，只能使用：

- `profile/public-profile.yaml`
- 本 Repository 既有公開 Knowledge Cards
- 正在分析的公開來源

不得把私人聊天記憶、公司內部資訊、薪資、私人關係、未公開專案或其他未列入 public profile 的個人資料寫入 Repository。

## 9. Validation & Push

寫入後至少完成：

1. `npm run validate`
2. 更新既有 Card 時執行 `npm run validate:ownership -- <card-path>`
3. source tooling 改動時執行 `npm test`
4. Commit 並 Push 到 `main`
5. GitHub Actions 負責 production build 與 Pages deployment

若 validation 失敗，不得把失敗內容當作完成品回報。

## 10. 回覆格式

完成 ingestion 後，回覆應簡潔包含：

- 新增或更新
- Knowledge Card 名稱
- Category
- Relevance Overall
- Action
- 主要技術價值 / 更新重點
- Push / CI / Pages 狀態

不要把整張 Knowledge Card 再完整貼回聊天。

## 11. 規則優先級

本文件負責產品與執行行為；`AGENTS.md` 負責 Repository 工程契約；Schema / Taxonomy 是硬性資料契約。

若規則衝突：

- 不得違反 Schema
- 不得違反 Taxonomy enum
- 不得破壞 user-owned state
- 不得突破 public safety boundary

行為策略的調整優先修改本文件，並同步記錄至 `prompts/CHANGELOG.md`。
