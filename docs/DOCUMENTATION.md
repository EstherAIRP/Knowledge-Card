# Knowledge Card 文件導航

> **角色：** 文件導航／索引  
> **權威性：** 僅負責導航；本文件不會覆蓋規範契約。  
> **最近盤點：** 2026-08-18  
> **權威來源索引：** [`AUTHORITY_MAP.md`](./AUTHORITY_MAP.md)

本頁回答的是「**要去哪裡找規則**」。連結指向的契約、Schema、設定檔、workflow 或實作，仍各自對其責任範圍具有權威性。

`docs/index.md` 是 VitePress 公開首頁，因此本儲存庫刻意使用 `docs/DOCUMENTATION.md` 作為文件索引，而不是建立只有大小寫不同的 `docs/INDEX.md`。

> VitePress 會建置 `docs/` 下的檔案。因此本頁連到 `docs/` 外部儲存庫檔案時使用 GitHub 絕對 URL，避免網站的死連結驗證把它們誤判成 VitePress 路由。

## 依任務開始閱讀

| 我想要…… | 先讀 | 接著查看 |
| --- | --- | --- |
| 了解 Knowledge Card 是什麼 | [Repository README](https://github.com/EstherAIRP/Knowledge-Card/blob/main/README.md) | [`WEBSITE.md`](./WEBSITE.md)、[`CONCEPTS.md`](./CONCEPTS.md) |
| 執行 Knowledge Card 任務 | [Runtime Prompt](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/RUNTIME.md) | [儲存庫規則](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md)、適用的來源契約 |
| 安全修改儲存庫內容 | [儲存庫規則](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md) | `config/`、`data/` 或 `state/` 下對應的 `AGENTS.md` |
| 處理一般 URL 或 GitHub Repository | [`INGESTION.md`](./INGESTION.md) | [儲存庫 scripts](https://github.com/EstherAIRP/Knowledge-Card/tree/main/scripts) |
| 處理 Threads URL | [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) | [`INGESTION.md`](./INGESTION.md) 的執行傳輸規則、[Threads 來源程式碼](https://github.com/EstherAIRP/Knowledge-Card/tree/main/scripts/lib/sources/threads) |
| 了解本機與遠端收錄執行方式 | [`INGESTION.md`](./INGESTION.md) | [Remote Ingest workflow](https://github.com/EstherAIRP/Knowledge-Card/blob/main/.github/workflows/remote-ingest.yml) |
| 了解 Threads Phase 7／僅根貼文復原 | [`THREADS_INGESTION.md`](./THREADS_INGESTION.md#8-phase-7--semantic-continuation--root-only-recovery) | [判定 Schema](https://github.com/EstherAIRP/Knowledge-Card/blob/main/schema/threads-continuation-judgement.schema.json)、[續篇驗證程式碼](https://github.com/EstherAIRP/Knowledge-Card/blob/main/scripts/lib/sources/threads/continuation-recovery.mjs) |
| 修改 Threads 語意判定欄位／標籤 | [Threads 判定 Schema](https://github.com/EstherAIRP/Knowledge-Card/blob/main/schema/threads-continuation-judgement.schema.json) | [`THREADS_INGESTION.md`](./THREADS_INGESTION.md)、[共用驗證器](https://github.com/EstherAIRP/Knowledge-Card/blob/main/scripts/lib/contracts/threads-continuation-judgement.mjs)、[受管理提示詞](https://github.com/EstherAIRP/Knowledge-Card/blob/main/.github/agents/threads-continuation-ranker.agent.md) |
| 修改 Knowledge Card YAML 前置欄位 | [Knowledge Card Schema](https://github.com/EstherAIRP/Knowledge-Card/blob/main/schema/knowledge-card.schema.json) | [Taxonomy](https://github.com/EstherAIRP/Knowledge-Card/blob/main/config/taxonomy.yaml)、[Card 範例](https://github.com/EstherAIRP/Knowledge-Card/blob/main/templates/knowledge-card.example.md) |
| 修改分類／Action／Status／Source Type／Relevance 維度 | [Taxonomy](https://github.com/EstherAIRP/Knowledge-Card/blob/main/config/taxonomy.yaml) | [Knowledge Card Schema](https://github.com/EstherAIRP/Knowledge-Card/blob/main/schema/knowledge-card.schema.json) |
| 修改公開個人化內容 | [Public Profile](https://github.com/EstherAIRP/Knowledge-Card/blob/main/profile/public-profile.yaml) | [儲存庫規則](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md) 的公開安全規則 |
| 了解 GitHub Actions／部署 | [`AUTOMATION.md`](./AUTOMATION.md) | [實際 workflows](https://github.com/EstherAIRP/Knowledge-Card/tree/main/.github/workflows) |
| 了解 Card-to-Card 關聯 | [`RELATIONS.md`](./RELATIONS.md) | [設定所有權](https://github.com/EstherAIRP/Knowledge-Card/blob/main/config/AGENTS.md)、產生資料所有權 |
| 了解 Concept Graph | [`CONCEPTS.md`](./CONCEPTS.md) | [設定所有權](https://github.com/EstherAIRP/Knowledge-Card/blob/main/config/AGENTS.md)、[產生資料所有權](https://github.com/EstherAIRP/Knowledge-Card/blob/main/data/AGENTS.md) |
| 了解網站架構 | [`WEBSITE.md`](./WEBSITE.md) | [VitePress 實作](https://github.com/EstherAIRP/Knowledge-Card/tree/main/docs/.vitepress) |
| 了解產生的索引 | [產生資料所有權](https://github.com/EstherAIRP/Knowledge-Card/blob/main/data/AGENTS.md) | [`RELATIONS.md`](./RELATIONS.md)、[`CONCEPTS.md`](./CONCEPTS.md) |
| 了解已接受來源快照 | [來源狀態所有權](https://github.com/EstherAIRP/Knowledge-Card/blob/main/state/AGENTS.md) | [`THREADS_INGESTION.md`](./THREADS_INGESTION.md#7-phase-6--accepted-source-snapshots-and-change-detection) |
| 修改文件治理／檢查 | [文件治理檢查](https://github.com/EstherAIRP/Knowledge-Card/blob/main/scripts/check-documentation.mjs) | [`AUTHORITY_MAP.md`](./AUTHORITY_MAP.md)、[`AUTOMATION.md`](./AUTOMATION.md) |
| 查看 Runtime 行為歷史 | [Runtime Changelog](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/CHANGELOG.md) | 目前行為仍以 [Runtime Prompt](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/RUNTIME.md) 為準 |
| 判斷某條規則由哪份文件負責 | [`AUTHORITY_MAP.md`](./AUTHORITY_MAP.md) | 依其中列出的主要權威來源連結繼續閱讀 |

## 文件層級

```text
README.md
  專案入口與公開概覽
        ↓
docs/DOCUMENTATION.md
  僅負責導航／索引
        ↓
RUNTIME / AGENTS / 領域文件
  行為與儲存庫契約
        ↓
Schema / config / 範圍所有權規則
  機器可讀與領域專用硬性限制
        ↓
程式碼 / workflows / 產生資料
  可執行實作與可重建輸出
```

### 1. 專案入口

- [Repository README](https://github.com/EstherAIRP/Knowledge-Card/blob/main/README.md) — 目前的專案概覽、架構、指令與端到端流程。

### 2. Agent 契約

- [Runtime Prompt](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/RUNTIME.md) — 目前 Knowledge Card 任務／執行流程規則。
- [儲存庫規則](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md) — 全儲存庫修改、所有權、驗證與 commit 契約。
- [設定所有權](https://github.com/EstherAIRP/Knowledge-Card/blob/main/config/AGENTS.md) — 設定檔所有權規則。
- [產生資料所有權](https://github.com/EstherAIRP/Knowledge-Card/blob/main/data/AGENTS.md) — 產生索引的所有權規則。
- [來源狀態所有權](https://github.com/EstherAIRP/Knowledge-Card/blob/main/state/AGENTS.md) — 運作來源快照的所有權規則。

較深層的 `AGENTS.md` 會在其目錄範圍內與根目錄規則同時適用。

### 3. 來源與系統文件

- [`INGESTION.md`](./INGESTION.md) — 跨來源路由、一般來源／GitHub 收錄、執行後端、Remote Ingest 傳輸與頂層失敗分類。
- [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) — 唯一的詳細 Threads 來源／完整性規格，包含 Phase 1–7、快照、受管理排序器與語意轉交。
- [`AUTOMATION.md`](./AUTOMATION.md) — CI/CD、Remote Ingest 概覽、文件治理檢查、產生索引維護與 Pages workflow 說明。
- [`RELATIONS.md`](./RELATIONS.md) — Card-to-Card 語意關聯架構。
- [`CONCEPTS.md`](./CONCEPTS.md) — Concept Graph 架構。
- [`WEBSITE.md`](./WEBSITE.md) — VitePress 呈現層架構。

### 4. 機器可讀／儲存庫設定

- [Knowledge Card Schema](https://github.com/EstherAIRP/Knowledge-Card/blob/main/schema/knowledge-card.schema.json) — Knowledge Card YAML 前置欄位的規範 Schema。
- [Threads 判定 Schema](https://github.com/EstherAIRP/Knowledge-Card/blob/main/schema/threads-continuation-judgement.schema.json) — Phase 7 語意分類器輸出格式與標籤詞彙的標準定義。
- [Taxonomy](https://github.com/EstherAIRP/Knowledge-Card/blob/main/config/taxonomy.yaml) — 受控分類、Action、Status、Source Type 與 Relevance 維度。
- [Public Profile](https://github.com/EstherAIRP/Knowledge-Card/blob/main/profile/public-profile.yaml) — 完整的公開個人化邊界。
- [Knowledge Card 範例](https://github.com/EstherAIRP/Knowledge-Card/blob/main/templates/knowledge-card.example.md) — 撰寫範例；權威性低於 Schema／契約。

### 5. 可執行／歷史資料

- [GitHub Actions workflows](https://github.com/EstherAIRP/Knowledge-Card/tree/main/.github/workflows) — 實際執行定義。
- [文件治理檢查](https://github.com/EstherAIRP/Knowledge-Card/blob/main/scripts/check-documentation.mjs) — Phase 5 防護，檢查必要文件、已淘汰路徑、儲存庫／本機連結與 README／權威來源不變量。
- [Threads 續篇排序器提示詞](https://github.com/EstherAIRP/Knowledge-Card/blob/main/.github/agents/threads-continuation-ranker.agent.md) — 綁定共用判定 Schema 的受管理分類器提示詞。
- [Threads 判定驗證器](https://github.com/EstherAIRP/Knowledge-Card/blob/main/scripts/lib/contracts/threads-continuation-judgement.mjs) — 共用執行期 JSON Schema 驗證器與契約詞彙輸出。
- [Threads 續篇驗證程式碼](https://github.com/EstherAIRP/Knowledge-Card/blob/main/scripts/lib/sources/threads/continuation-recovery.mjs) — Phase 7 依證據決定接受結果的確定性實作。
- [儲存庫 scripts](https://github.com/EstherAIRP/Knowledge-Card/tree/main/scripts) — 可執行的收錄、驗證、關聯、Concept 與網站支援邏輯。
- [Runtime Changelog](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/CHANGELOG.md) — Runtime 歷史；歷史紀錄永遠不覆蓋目前契約。

舊的 `THREADS_PHASE7_RECOVERY.md` 已在 Phase 3 合併進 `THREADS_INGESTION.md` 並移除，不再是競爭規格。

## 文件治理防護

執行：

```bash
npm run docs:check
```

這項檢查會驗證穩定的儲存庫文件不變量，並補充 VitePress 的死連結／建置驗證。它刻意不解析或複製每一條領域規則。

## 目前權威順序

依 `AGENTS.md` 宣告的優先順序：

```text
JSON Schema
> taxonomy.yaml
> public-profile.yaml for personalization/public safety
> RUNTIME.md / AGENTS.md / applicable ingestion contract
> example/template
> existing AI-generated content
```

## 交叉引用規則

> 一條規範規則只在一個主要權威來源中完整定義。其他文件可以簡短摘要，但應連回主要權威來源，不要複製完整規則。

VitePress 頁面若要連到 `docs/` 以外的儲存庫檔案，應使用 GitHub 絕對 URL；`docs/` 內文件互連可以使用相對路徑。

## 相關文件

- [文件權威來源索引](./AUTHORITY_MAP.md)
- [收錄流程](./INGESTION.md)
- [Threads 收錄](./THREADS_INGESTION.md)
- [自動化](./AUTOMATION.md)
- [關聯](./RELATIONS.md)
- [Concept Graph](./CONCEPTS.md)
- [網站](./WEBSITE.md)
