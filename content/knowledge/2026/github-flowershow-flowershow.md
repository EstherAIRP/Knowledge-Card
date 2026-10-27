---
schema_version: 1
id: github-flowershow-flowershow
title: Flowershow
canonical_url: https://github.com/flowershow/flowershow
source:
  type: github
  url: https://github.com/flowershow/flowershow
  identity: github:flowershow/flowershow
resource_kind:
  ai: project
  user: null
navigation:
  categories:
    ai:
      - Writing / Documentation
      - Memory / RAG / Knowledge
    user: null
created_at: 2026-10-27
updated_at: 2026-10-27
last_checked_at: 2026-10-27
summary: >-
  Flowershow 是將 Markdown 文件、Obsidian 筆記與 GitHub 儲存庫內容發布為網站的開源平台，提供雲端發布、Go 命令列工具及供 Agent 使用的發布流程。其 Next.js 應用搭配 Cloudflare R2、Workflows 與佇列實作檔案同步、處理及搜尋索引，適合作為文件網站與知識庫發布方案的評估對象。
classification:
  categories:
    ai:
      - General Tools
      - RAG / Memory / Knowledge
      - Infrastructure / Deployment
    user: null
  tags:
    ai:
      - Markdown
      - Obsidian
      - knowledge-publishing
      - documentation-website
      - GitHub-sync
      - Next.js
      - Go-CLI
      - Cloudflare-R2
      - Cloudflare-Workflows
      - Typesense
      - wiki-links
      - OpenAPI
    user: null
relevance:
  ai:
    overall: 3
    ai_rd: 2
    aoi_ai: 1
    llm_agent: 3
    sillytavern_ai_rpg: 2
    image_gen: 1
  user: {}
actions:
  ai:
    - TRY
    - REFERENCE
  user: null
status:
  ai: active
  user: null
---

# Flowershow

## 一句話介紹

Flowershow 是一個將 Markdown 文件與筆記快速發布為網站的平台，可從 GitHub、檔案上傳或命令列發布內容；除了方便使用的雲端服務，也公開了網站、發布工具與後端處理管線的程式碼。

## 它解決什麼問題

Markdown 與 Obsidian 適合撰寫和維護知識，但把筆記提供給其他人閱讀，往往還需要自行處理網站框架、部署、更新同步、連結解析與搜尋。Flowershow 將這些工作整合成發布服務：作者保留原本的 Markdown 編輯方式，平台負責把內容轉為可瀏覽的網站。

它的主要用途是**文件與知識內容的對外呈現**，而不是直接提供向量檢索、RAG 問答或 Agent 記憶推理。這個定位差異在評估知識庫系統時尤其重要。

## 核心概念

1. **內容與發布入口分離**：內容可以來自 GitHub 儲存庫，也可以透過命令列或上傳途徑送至平台；不同入口共同使用發布生命週期。
2. **以 Markdown 為主要內容格式**：網站層接手呈現與瀏覽，並透過 `remark-wiki-link` 支援 `[[頁面]]`、別名、標題錨點及部分嵌入語法，降低 Obsidian 文件轉站的障礙。
3. **增量同步而非每次重新建站**：GitHub 路徑會比對檔案樹；命令列在資料夾已有 `.flowershow` 關聯檔時，也能同步後續新增、修改與刪除的內容。
4. **把發布完成與逐檔處理解耦**：每次發布保留 `Publish` 與 `PublishFile` 狀態，由背景佇列處理個別檔案，再由完成流程彙整結果並刷新網站快取。
5. **讓 Agent 使用一般發布介面**：`fl` 提供便於腳本處理的 `--json`、`--yes` 等參數；官方另有獨立的 Flowershow Skill 指引 Agent 操作工具。這不是內建文件理解或自動寫作模型。

## 架構與技術

專案是使用 pnpm workspaces 與 Turborepo 管理的單一儲存庫，主要組成如下：

- `apps/flowershow`：Next.js、React 與 TypeScript 的多租戶網站；以 GitHub OAuth／NextAuth 管理登入，PostgreSQL 儲存帳號與網站中繼資料。
- `apps/cli`：以 Go 實作的 `fl` 命令列工具，供使用者、腳本及 Agent 發布檔案或資料夾。
- `packages/api-contract`：以 Zod schema 定義 API 契約，產生 TypeScript 型別與 OpenAPI 3.1 文件，供網站及其他客戶端對齊介面。
- `packages/cloudflare-worker`：負責 GitHub 同步、背景發布流程與佇列中的逐檔處理。
- `packages/remark-wiki-link`：將 Obsidian 風格的 Wiki 連結及圖片、音訊、影片、PDF 嵌入語法轉成 Markdown 處理流程可使用的節點。
- **基礎設施**：Cloudflare R2 儲存內容，Cloudflare Workflows 協調同步與完成狀態，Queues 處理檔案事件；Typesense 建立內容搜尋索引；網站部署採 Vercel。

官方描述的發布路徑可概括為：

```text
GitHub webhook / CLI / 檔案上傳
→ 建立 Publish 與 PublishFile 狀態
→ 檔案同步至 Cloudflare R2
→ Queue consumer 更新檔案紀錄與 Typesense
→ PublishFinalizerWorkflow 等待終態
→ 標記發布完成並刷新網站快取
```

## 主要功能

- **快速發布**：在 Flowershow 網站登入後，從 GitHub 或上傳途徑建立 Markdown 網站。
- **命令列發布**：`fl login` 進行驗證，`fl ./my-notes` 發布資料夾；之後重複執行可同步變更。
- **自動化輸出**：`fl --json` 回傳機器可讀結果，並可搭配 `--yes` 用於自動化；`--overwrite` 則須明確指定，避免無意覆寫名稱相同的網站。
- **匿名試用發布**：`fl --anon` 可免登入建立臨時網站；官方文件記載未領取的匿名網站有期限與檔案容量限制。
- **Obsidian 風格連結**：支援 Wiki 連結、標題錨點，以及圖片／媒體檔案嵌入；並非所有筆記嵌入語法均已支援。
- **同步與檢索**：GitHub 更新觸發同步，背景流程處理資料並維護 Typesense 搜尋索引。
- **API 文件**：從共同 Zod 契約產生 OpenAPI 3.1 規格及 Swagger UI。

## 技術亮點

### 1. 不同來源共用一套發布狀態機

GitHub 同步和 CLI／上傳來源的入口不同，但最終都落到檔案級別的 `PublishFile` 狀態與共同完成流程。這有助於避免每種發布介面都各自實作一套索引與完成判定。

### 2. 以完成流程處理非同步協作

逐檔佇列只更新處理結果，不直接通知完成流程；`PublishFinalizerWorkflow` 週期性檢查是否仍有處理中的檔案，再更新完成時間並刷新快取。這是多檔案非同步發布的具體架構案例，但也意味發布完成時間受背景佇列與輪詢週期影響。

### 3. API 契約作為跨語言介面的共用基準

網站端維護 Zod 驗證與 OpenAPI 文件，Go CLI 依相同契約設計呼叫介面。對需要同時支援網頁、命令列與自動化代理的服務，這種單一契約來源比各入口各自維護資料格式更容易追蹤變更。

### 4. 區分「知識整理」與「知識發布」

Flowershow 的重點在網頁化、同步與分享；知識的產生、編修、分類與語意檢索可以由外部工具完成。這種邊界適合用來思考知識系統中「內容管理」與「對外展示」是否應拆成獨立元件。

## 限制與風險

- **託管服務依賴**：直接使用 Flowershow Cloud 需要評估服務可用性、資料上傳範圍、帳號權限、訂閱限制及平台持續營運風險；不要把開源程式碼等同於無條件自行部署的託管服務。
- **自行部署成本不低**：官方開發環境依賴 Node.js、pnpm、Docker，完整平台涉及 PostgreSQL、物件儲存、Cloudflare 事件處理、搜尋與身分驗證，並非單一靜態網站產生器。
- **授權義務**：儲存庫根目錄提供 AGPL-3.0 授權文本；若修改後透過網路提供服務，應先評估授權條件及相關原始碼提供義務。
- **資料公開與存取權**：發布私人筆記前，需先確認網站隱私設定、分享權限與是否含敏感內容；匿名網站的領取連結與權杖尤其不可公開。
- **命令列版本轉換**：目前文件以 Go 的 `fl` 為主要命令列工具，並明確將舊的 `flowershow`、`@flowershow/publish` npm CLI 標為已棄用；舊教學不可直接沿用。
- **部分功能仍在演進**：`remark-wiki-link` 尚未實作筆記嵌入；API 契約文件把 Obsidian 外掛標記為規劃中，與其他文件對 Obsidian 上傳入口的敘述有落差，正式採用前應確認目前可用的發布方式。
- **發布資料格式錯誤**：CLI 文件指出無效的 YAML 前置欄位可能造成個別檔案處理失敗；即使其餘檔案已發布，也應檢查逐檔錯誤回報。

## 與你的相關性

依公開技術背景，Flowershow 對 **AI R&D** 與 **LLM／Agent** 的價值主要是文件與研究成果的發布及工程架構參考，而不是模型研發本身。它的 `fl --json`、Skill 與共同 API 契約，可以作為 Agent 完成內容生成後的**交付出口**；但寫作、來源查證和內容安全仍需由外部流程負責。

它對 **AOI × AI** 的直接技術關聯低，但可用於整理公開說明文件。對 **SillyTavern／AI RPG** 可作為世界觀或角色設定文件的發布工具，屬延伸用途而非產品原生功能。影像生成方面沒有直接模型或工作流價值。

因此整體相關性評為 **3/5**：適合收藏並試用的發布工具，並非核心 AI 系統元件。

## 建議怎麼使用

- **TRY**：先使用一份不含私人資料的 Markdown 文件或小型 Obsidian 筆記資料夾測試發布。可依官方 CLI 文件執行 `fl login`、`fl ./my-notes`，確認連結、圖片、更新同步與移除文件的結果。
- **REFERENCE**：若要設計知識庫網站、文件發布服務或 Agent 產出交付流程，可研究 `Publish`／`PublishFile` 狀態、Cloudflare Worker 佇列與 `PublishFinalizerWorkflow`，特別注意同步失敗、覆寫與公開權限的處理。
- 不建議只因它支援 Markdown 就直接取代既有網站系統；應先比較自訂網址、存取控制、搜尋需求、資料可攜性與長期維運成本。

## 與其他收藏的關聯

- [Vault Curate](https://github.com/EstherAIRP/Knowledge-Card/blob/main/content/knowledge/2026/github-notoriouslab-vault-curate.md)：同樣涉及 Obsidian 知識內容，但 Vault Curate 著重本機搜尋與語意關聯，Flowershow 著重對外發布與網站呈現；兩者可作為知識管理流程不同階段的比較案例。

## 使用者備註

## 更新紀錄

### 2026-10-27

- 首次收錄 Flowershow，依官方 README、網站架構、Go CLI、API 契約、Wiki 連結套件及授權文件整理發布能力與技術限制。
