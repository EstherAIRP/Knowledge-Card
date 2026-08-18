# Knowledge Card 文件權威來源索引

> **角色：** 文件治理盤點／權威來源索引  
> **權威性：** 描述儲存庫中的責任歸屬；不會覆蓋連結指向的規範契約。  
> **最近盤點：** 2026-08-18  
> **文件導航：** [`DOCUMENTATION.md`](./DOCUMENTATION.md)

本文件回答一個問題：**每一條規則由哪個檔案負責？**

治理目標很單純：每一項詳細規則只放在一個主要權威來源，其他文件只保留自身範圍需要的摘要，並直接連回主要來源。

> 本文件由 VitePress 從 `docs/` 建置，因此連到 `docs/` 外部儲存庫檔案時使用 GitHub 絕對 URL。

## 重構狀態

```text
Phase 1 — 文件盤點與導航                         COMPLETE
Phase 2 — 全域 RUNTIME / AGENTS 精簡             COMPLETE
Phase 3 — 收錄文件整併                            COMPLETE
Phase 4 — 共用 Threads 判定 Schema                COMPLETE
Phase 5 — 文件治理防護與 README                   COMPLETE
```

五階段文件重構已完成。Phase 5 更新儲存庫入口並加入可執行的治理檢查；不改變收錄演算法、來源完整性門檻、Knowledge Card 內容、taxonomy、public profile、產生索引、來源快照或使用者擁有狀態。

## 權威來源類型

| 類型 | 意義 |
| --- | --- |
| **規範契約** | 定義 Agent／自動化必須遵守的儲存庫行為或資料規則。 |
| **範圍契約** | 在特定目錄中增加規則，同時仍遵守根目錄規則。 |
| **可執行權威來源** | 實際執行行為的程式碼／workflow。 |
| **操作文件** | 說明如何操作某個可執行子系統。 |
| **說明文件** | 說明架構／設計，但不建立競爭的規範規則。 |
| **歷史紀錄** | 記錄過去行為／變更，永遠不覆蓋目前契約。 |
| **產生狀態** | 可重建輸出，不得成為使用者意圖或儲存庫規則的唯一權威來源。 |
| **呈現入口** | 網站呈現／執行檔案，不屬於儲存庫治理文件。 |

## 目前權威來源對照

| 關注事項 | 主要權威來源 | 輔助／可執行來源 |
| --- | --- | --- |
| Knowledge Card 任務觸發與執行流程 | [Runtime Prompt](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/RUNTIME.md) | `AGENTS.md`、適用的領域契約 |
| 全儲存庫寫入、所有權、驗證、commit／push | [儲存庫規則](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md) | 各範圍 `AGENTS.md` |
| 文件導航 | [`DOCUMENTATION.md`](./DOCUMENTATION.md) | README、本權威來源索引 |
| 文件治理不變量 | [check-documentation.mjs](https://github.com/EstherAIRP/Knowledge-Card/blob/main/scripts/check-documentation.mjs) | `npm run docs:check`、驗證／Pages workflows |
| 來源路由、一般來源／GitHub 收錄、執行後端、Remote Ingest 傳輸、頂層失敗分類 | [`INGESTION.md`](./INGESTION.md) | 調度器／解析器、[remote-ingest.yml](https://github.com/EstherAIRP/Knowledge-Card/blob/main/.github/workflows/remote-ingest.yml) |
| Threads URL／擷取／重建／完整性 | [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) | Threads 來源實作 |
| Threads Phase 7 續篇／僅根貼文語意與依證據決定的關卡 | [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) | [continuation-recovery.mjs](https://github.com/EstherAIRP/Knowledge-Card/blob/main/scripts/lib/sources/threads/continuation-recovery.mjs) |
| Threads 語意判定輸出格式／標籤詞彙 | [Threads 判定 Schema](https://github.com/EstherAIRP/Knowledge-Card/blob/main/schema/threads-continuation-judgement.schema.json) | [共用驗證器](https://github.com/EstherAIRP/Knowledge-Card/blob/main/scripts/lib/contracts/threads-continuation-judgement.mjs)、本機／受管理排序器 |
| Threads 受管理分類器提示詞 | [threads-continuation-ranker.agent.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/.github/agents/threads-continuation-ranker.agent.md) | 共用 Schema + Copilot adapter |
| Knowledge Card YAML 前置欄位結構 | [Knowledge Card Schema](https://github.com/EstherAIRP/Knowledge-Card/blob/main/schema/knowledge-card.schema.json) | 驗證程式碼、範本 |
| 受控分類／Action／Status／Source Type／Relevance 維度 | [Taxonomy](https://github.com/EstherAIRP/Knowledge-Card/blob/main/config/taxonomy.yaml) | Knowledge Card Schema 漂移驗證 |
| 公開個人化邊界 | [Public Profile](https://github.com/EstherAIRP/Knowledge-Card/blob/main/profile/public-profile.yaml) | Runtime／AGENTS 公開安全不變量 |
| Knowledge Card 正文範例 | [Knowledge Card 範例](https://github.com/EstherAIRP/Knowledge-Card/blob/main/templates/knowledge-card.example.md) | Runtime 分析標準 |
| 設定所有權 | [config/AGENTS.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/config/AGENTS.md) | `config/*.yaml` |
| 產生索引所有權 | [data/AGENTS.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/data/AGENTS.md) | 產生的 `data/*.json` |
| 運作來源快照 | [state/AGENTS.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/state/AGENTS.md) | 來源狀態工具 |
| CI/CD 與產生索引自動化 | [Workflow YAML](https://github.com/EstherAIRP/Knowledge-Card/tree/main/.github/workflows) | [`AUTOMATION.md`](./AUTOMATION.md) |
| Card-to-Card 語意關聯 | 關聯設定 + 產生器／驗證器程式碼 | [`RELATIONS.md`](./RELATIONS.md)、config/data 範圍規則 |
| Concept Graph | Concept 設定 + 產生器／驗證器程式碼 | [`CONCEPTS.md`](./CONCEPTS.md)、config/data 範圍規則 |
| 網站架構／渲染 | VitePress／網站投影實作 | [`WEBSITE.md`](./WEBSITE.md) |
| 公開 VitePress 首頁 | [`index.md`](./index.md) | VitePress theme／components |
| Runtime 歷史 | [Runtime Changelog](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/CHANGELOG.md) | Git 歷史；僅供歷史查閱 |

## 穩定責任邊界

### `prompts/RUNTIME.md`

負責「**任務／執行流程要做什麼**」：任務觸發、必要前置檢查、來源路由硬性關卡、已接受來源要求、高階執行備援不變量、分析／更新／公開安全流程、驗證／Push／回報要求，以及詳細權威來源連結。

它不負責來源專用演算法、來源供應商憑證／設定、Remote Ingest 內部細節或 Threads 接受門檻。

### `AGENTS.md`

負責「**如何安全修改儲存庫**」：儲存庫寫入規則、來源證據、穩定識別／路徑處理、建立／更新規則、使用者擁有狀態保留、範圍所有權探索、驗證、歷史與完成回報。

### `docs/INGESTION.md`

負責「**跨來源收錄／執行**」：來源路由、調度器／解析器關係、一般來源／GitHub 收錄、LocalBackend／RemoteBackend 順序、頂層失敗分類、Remote Ingest 基本傳輸，以及已接受來源的後續銜接。

### `docs/THREADS_INGESTION.md`

負責「**詳細 Threads 來源語意**」：URL 解析、精確貼文擷取、自串文重建、瀏覽器證據、已接受快照、Phase 7 復原語意、依證據決定的確定性關卡、來源紀錄、受管理排序器行為與語意轉交語意。

### `schema/threads-continuation-judgement.schema.json`

只負責「**Threads Phase 7 模型輸出結構**」：必要欄位、資料型別／範圍、候選標籤物件格式與允許標籤。信心接受門檻、中繼資料證據、精確候選涵蓋、時間順序、同作者檢查、`n/N` 與結構歧義，仍由受信任 Phase 7／來源程式碼負責。

### `scripts/check-documentation.mjs`

負責「**穩定的文件治理檢查**」，不負責領域語意。它檢查必要檔案、已淘汰／衝突路徑、小寫 `docs/index.md`、重要 README／導航／權威來源引用、指定的本機 Markdown 連結、VitePress 相對連結邊界，以及 CI 整合。

VitePress 仍負責渲染網站的編譯與自身死連結檢查。

## 已解決的規則漂移熱點

### Phase 2 — 全域規則三重定義

來源供應商實作細節、Remote Ingest 內部規則、受管理排序器細節與 Threads 關卡，已從兩份全域契約移除並交由領域權威來源負責。

### Phase 3 — 互相競爭的 Threads 文件

舊的 `docs/THREADS_PHASE7_RECOVERY.md` 已合併進 [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) 並移除。`INGESTION.md` 現在負責跨來源執行，而 `THREADS_INGESTION.md` 負責 Threads 專用來源語意。

### Phase 4 — 判定格式重複定義

共用 [Threads 判定 Schema](https://github.com/EstherAIRP/Knowledge-Card/blob/main/schema/threads-continuation-judgement.schema.json) 現在提供本機排序器、Copilot 排序器、語意轉交與 Phase 7 驗證共同使用的驗證契約。

### Phase 5 — README 與治理漂移

README 已反映目前以 `ingest:dispatch` 為優先的架構、Remote Ingest、Knowledge Graph workflows、共用 Threads Schema 與目前儲存庫配置。`npm run docs:check` 同時在分支驗證與 `main` Pages 建置關卡中強制執行。

## 持續維護風險

重構計畫已完成，但日常維護仍可能重新產生漂移。主要持續檢查為：

- `npm run docs:check`：治理／索引／連結不變量；
- `npm run validate`：Knowledge Card Schema、來源識別、重複與 taxonomy／Schema 漂移；
- `npm test`：可執行行為；
- `npm run docs:build`：VitePress 編譯／死連結；
- `npm run verify:site`：產生網站輸出涵蓋率。

未來若某條規則需要新的權威來源，應明確更新本索引，而不是把完整規則複製到多份文件。

## 文件治理規則

當一份文件需要引用由其他地方負責的規則時：

1. 只陳述目前文件需要的不變量；
2. 直接連到主要權威來源；
3. 不要在非權威文件中複製詳細門檻、payload Schema、來源供應商設定、權限或演算法；
4. 若兩個權威來源衝突，應明確修正衝突，而不是發明第三份規則。

目前導航：

```text
README.md
   ↓
docs/DOCUMENTATION.md
   ├─ Runtime 任務行為       → prompts/RUNTIME.md
   ├─ 儲存庫寫入             → AGENTS.md
   ├─ 跨來源收錄             → docs/INGESTION.md
   │                           └─ Threads → docs/THREADS_INGESTION.md
   │                                └─ 判定格式 → schema/threads-continuation-judgement.schema.json
   ├─ 資料／設定契約         → schema/ + config/
   ├─ 自動化                 → docs/AUTOMATION.md → .github/workflows/
   ├─ 治理檢查               → scripts/check-documentation.mjs
   └─ 權威來源歸屬           → docs/AUTHORITY_MAP.md
```

## 相關文件

- [文件導航](./DOCUMENTATION.md)
- [收錄流程](./INGESTION.md)
- [Threads 收錄](./THREADS_INGESTION.md)
- [自動化](./AUTOMATION.md)
- [關聯](./RELATIONS.md)
- [Concept Graph](./CONCEPTS.md)
- [網站](./WEBSITE.md)
