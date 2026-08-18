---
prompt_version: 1.12.2
updated_at: 2026-08-18
repository: EstherAIRP/Knowledge-Card
---

# Knowledge Card Runtime Prompt

> **角色：** 規範性的執行流程契約  
> **文件導航：** [`../docs/DOCUMENTATION.md`](../docs/DOCUMENTATION.md)  
> **權威來源索引：** [`../docs/AUTHORITY_MAP.md`](../docs/AUTHORITY_MAP.md)

本文件定義 Knowledge Card 任務「收到輸入後要做什麼」。來源專用演算法、Remote Ingest 實作、模型權限與判定門檻由對應領域規格、工作流程與程式碼維護，不在本文件重複定義。

## 語言與術語

- 一般中文回覆、Knowledge Card 正文與任務完成回報，以自然繁體中文為主。
- 已有成熟中文譯名的一般技術概念優先使用中文，不因來源文件使用英文就直接沿用英文。
- 官方專案／產品名稱、程式碼、指令、API、函式／參數／欄位名稱、識別字、檔案路徑、縮寫、錯誤碼、狀態值，以及翻譯後會降低精確度的專門術語保留原文。
- 重要術語需要中英對照時，首次可使用「中文（English）」格式，後續優先使用中文。
- 本文件中的英文契約字串、程式識別字與來源欄位是精確規格，不代表一般中文回覆應仿照其混寫風格。

## 1. 任務觸發

以下輸入預設視為 Knowledge Card 收錄／更新任務，不需再次確認：

- 技術文章 URL
- GitHub Repository URL
- 論文 / arXiv / DOI URL
- 官方文件、工具、產品、技術介紹 URL
- 使用者要求重新分析、更新評分、修改 `Action`、`Category`、`Tag` 或補充內容

若使用者只貼 URL，預設執行完整收錄流程。

若使用者明確要求的是說明、審查、規劃或其他不寫入 Repository 的工作，依使用者要求處理，不應把它誤當成收錄寫入。

## 2. 必要前置檢查

處理收錄、更新、重新分析或人工修正前，依序讀取最新版：

1. `prompts/RUNTIME.md`
2. `AGENTS.md`
3. `profile/public-profile.yaml`
4. `config/taxonomy.yaml`
5. 需要驗證或編輯 Card 結構時讀取 `schema/knowledge-card.schema.json`

接著依任務載入適用的領域契約：

- 一般 URL / GitHub / paper / documentation / tool：`docs/INGESTION.md`
- Threads：`docs/INGESTION.md` + `docs/THREADS_INGESTION.md`
- Repository 文件導航：`docs/DOCUMENTATION.md`
- 權威來源判定：`docs/AUTHORITY_MAP.md`

`docs/DOCUMENTATION.md` 與 `docs/AUTHORITY_MAP.md` 是導航／治理索引，不會覆蓋其所連結的規範性契約。

Repository 內容是本專案最新規則來源。

## 3. URL 收錄流程

### 3.1 來源路由是硬性關卡

在來源擷取、瀏覽器備援或語意恢復前，先確定主要資源的來源路由。

核心不變量：

```text
Threads 來源     → Threads 來源契約
非 Threads 來源 → 通用／來源供應者契約
```

- `threads.com` / `threads.net` 與解析後落在 Threads 的暫時性 URL 必須走 `docs/THREADS_INGESTION.md`。
- GitHub 與其他非 Threads URL 走 `docs/INGESTION.md` 定義的一般流程。
- 來源路由一旦確定，不得混用另一條路由的完整性規則或工具。
- 不得因正文提到 Threads、含 Threads 連結、或模型認為內容「像串文」而自行切換路由。

來源族群、正規化、Threads Phase 1–7、瀏覽器證據、語意恢復與快照細節，均以領域規格與 resolver 實作為準，不在本文件複製。

### 3.2 執行後端失敗與來源失敗必須分開判定

一般收錄的高階入口是：

```bash
npm run ingest:dispatch -- <URL>
```

所有核准的執行後端最終使用 Repository 定義的 resolver 契約。`npm run ingest:resolve -- <URL>` 是執行後端內部的低階 resolver／除錯入口。

核心不變量：

```text
執行／執行環境失敗 != 來源不可用
```

執行策略維持：

```text
LocalBackend
↓ 若目前執行環境無法執行
Repository-defined RemoteBackend
↓
已接受結果，否則保守失敗（fail closed）
```

既有 Card、別名或已接受快照可以協助識別來源身分與歷史，但不能取代目前線上來源的完整性／新鮮度驗證。

詳細的執行後端請求協定、Remote Ingest 成品、受管語意後端、失敗詞彙與安全限制，以 `docs/INGESTION.md`、`.github/workflows/remote-ingest.yml` 及受信任執行程式碼為準。

Runtime 必須遵守以下硬規則：

- 本機工具、網路、瀏覽器或模型能力缺失，不得直接宣稱公開來源不可用；
- 執行後端失敗與來源擷取／完整性失敗必須分開回報；
- `INGESTION_BLOCKED`、來源不完整、來源有歧義、來源識別不一致或其他未被接受的狀態，不得建立／更新正式 Card；
- 即時重新驗證未完成時，不得刷新分析、`last_checked_at` 或已接受來源快照；
- 不同 session／工具能力不得降低來源供應者完整性、安全性或來源識別關卡。

### 3.3 來源專屬完整性規則

Knowledge Card 只能使用已通過對應來源契約且被接受的來源撰寫。

Threads 特別遵守：

- 完整來源與根來源識別由 `docs/THREADS_INGESTION.md` 定義；
- 正式分析使用已接受的 `source_document.combined_text`，而不是只分析原始分享的單篇；
- 結構式驗證與 `llm_assisted` 驗證必須保留其實際來源紀錄（provenance），不得把推論描述成 Threads 原生 graph 已驗證；
- 快照只能在 Card 建立／更新成功驗證後推進。

Phase 7 語意判定、`root_only`、候選標籤、信心度／metadata 門檻、Phase 8 受管排序器與語意交接的完整契約，不在 Runtime 重複維護；請直接遵循 Threads 領域規格、受管 Agent prompt 與驗證程式碼。

### 3.4 來源閱讀規則

不得只根據 URL slug、搜尋摘要、Repository 名稱或模型記憶產生實質分析。

寫入前至少應：

- 打開並閱讀主要來源；
- GitHub Repository 至少查看儲存庫中繼資料與 README；需要支撐技術判斷時再查看架構、安全、文件、設定或原始碼；
- 論文優先閱讀論文／摘要與官方專案資料；
- 文章／文件使用實際的權威來源頁面；
- 區分來源已驗證事實與分析推論；
- 不得臆造功能、架構、授權、相容性、成熟度、基準測試或維護狀態。

來源不足且無法通過核准的執行後端／來源契約時，採保守失敗，不得自行補完 Card。

## 4. 分析標準

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

## 5. 分類與建議

### 受控詞彙

`Category`、`Action`、`Status`、`Source Type` 與 `Relevance` 維度的唯一人類可讀詞彙權威來源是 `config/taxonomy.yaml`；不得在 Runtime 維護第二份列舉清單或臨時新增受控值。

### Tags

可自由生成細粒度技術 Tag，但應避免無辨識度的泛用詞。

### Relevance

依 `config/taxonomy.yaml` 的維度與 1–5 分制評估。`overall` 是整體實務／研究價值判斷，不要求等於各維度算術平均。

個人化的 relevance 與 recommendation 只能使用 `profile/public-profile.yaml` 允許的公開脈絡。

### Actions

只能選擇 taxonomy 已定義的 Action，且每個 Action 都必須可由正文分析與來源證據支持。

## 6. 建立／更新規則

正式寫入必須以已接受的 resolver 來源識別判定 `create` 或 `update`；不得因 URL 變體建立重複 Card。

### 建立

- 使用 resolver 建議的來源識別／路徑；
- 依 Schema、Taxonomy 與 `templates/knowledge-card.example.md` 建立 Card；
- 只使用已接受來源與 public profile；
- 驗證成功後才可視為完成。

### 更新

既有 Card 再次被提交時：

- 保留穩定的 `id`、`created_at` 與既有檔案路徑；
- 只刷新 AI 擁有的中繼資料、分析、分類、relevance、actions 與必要日期；
- 完整保留使用者擁有狀態與 `## 使用者備註`，除非使用者明確要求修改；
- 有實質變化才更新 `updated_at` 與新增 Update Log；
- 真正完成目前來源重新檢查後，才能更新 `last_checked_at`；
- Threads 的 `source_change`／快照行為依 Threads 契約與來源狀態工具執行；
- 即時執行／重新驗證遭阻擋時，不得假裝已完成更新。

更完整的建立／更新工程規則由 `AGENTS.md` 定義。

## 7. 使用者擁有狀態

任何人工覆寫值（override）都高於對應 AI 值：

```text
effective_value = user_override ?? ai_value
```

AI 重新分析不得覆蓋使用者擁有的 `category`／`tag`／`relevance`／`action`／`status` 覆寫值或 `## 使用者備註`。既有 Card 更新必須通過 ownership validation。

## 8. 公開安全

公開 Knowledge Card 的個人化內容只能使用 `profile/public-profile.yaml` 定義的 `publication_policy`，以及其中允許的公開來源。

核心規則：

```text
Agent 知道某件事 ≠ 可以公開寫入 Repository
```

不得使用私人聊天記憶或其他未列入 public profile 的個人資料補強公開 Card；不確定是否可公開時應省略。

## 9. 驗證與推送

寫入後依 Repository 契約完成對應驗證：

1. Card 建立／更新：`npm run validate`
2. 既有 Card 更新：另執行 `npm run validate:ownership -- <card-path>`
3. 來源工具／收錄實作改動：另執行 `npm test`
4. Threads 已接受的建立／更新：Card 驗證成功後，依來源狀態工具推進實際變更的快照
5. Commit / Push 依 `AGENTS.md` 執行
6. GitHub Actions 負責對應 CI、正式環境建置、產生式索引與 Pages 部署

驗證失敗、收錄遭阻擋或來源未被接受時，不得把結果回報成完成品，也不得推進已接受來源狀態。

## 10. 完成回報

成功的收錄／更新回覆應簡潔包含：

- 新增或更新
- Knowledge Card 名稱
- 有效 `Category`
- `Relevance Overall`
- `Action`
- 主要技術價值／更新重點
- Repository 路徑
- Push / CI / Pages 狀態（只回報已實際驗證的狀態）

Threads 在有助於理解時，補充 `source_change` 與結構式／`llm_assisted` 驗證；不得誇大驗證層級。

未完成時必須清楚區分執行後端失敗、來源擷取／完整性失敗與 `INGESTION_BLOCKED`，不可用模糊的「來源不可用」代替實際原因。

## 11. 文件權威與變更規則

本文件只負責 **執行流程編排**。詳細責任分工如下：

- 儲存庫工程、所有權與寫入安全：`AGENTS.md`
- 一般收錄／執行後端：`docs/INGESTION.md`
- Threads 來源語意／完整性：`docs/THREADS_INGESTION.md`
- 自動化總覽：`docs/AUTOMATION.md`
- 可執行工作流程：`.github/workflows/*.yml`
- Knowledge Card 資料結構：`schema/knowledge-card.schema.json`
- 受控詞彙：`config/taxonomy.yaml`
- 公開個人化邊界：`profile/public-profile.yaml`
- 撰寫範例：`templates/knowledge-card.example.md`

**不要在本文件重複來源專屬演算法或來源供應者實作細節。** 使用連結指向權威文件，必要時只保留能支撐 Runtime 決策的摘要與硬性不變量。

規則優先級維持：

```text
JSON Schema
> taxonomy.yaml
> public-profile.yaml（個人化／公開安全）
> RUNTIME.md / AGENTS.md / 適用領域契約
> 範例／模板
> 既有 AI 產生內容
```

若規則衝突，不得違反 Schema、Taxonomy 受控值、使用者擁有狀態或公開安全邊界。Runtime 行為策略調整必須更新本文件並記錄到 `prompts/CHANGELOG.md`；領域專屬行為則應修改其領域契約與對應實作／測試，而不是把完整規則再次複製回 Runtime。
