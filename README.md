# Knowledge Card

建立在 GitHub 上、由 AI 協助維護的個人技術知識雷達。

Knowledge Card 會把技術來源 URL 轉成結構化、可版本控制的知識卡，保留使用者明確覆寫的狀態，建立卡片間與概念間的關聯，並透過 VitePress 將儲存庫呈現為可搜尋的技術知識雷達。儲存庫是內容的主要權威來源；AI／Codex 負責收錄與維護；VitePress 負責網站呈現。

公開網站：https://estherairp.github.io/Knowledge-Card/

## 文件

請先使用文件導航，不要猜測某條規則由哪個檔案負責：

- [文件導航](docs/DOCUMENTATION.md) — 依任務導向 Runtime、儲存庫規則、收錄規格、Schema、自動化、圖譜與網站文件。
- [文件權威來源索引](docs/AUTHORITY_MAP.md) — 記錄每項規則的主要權威來源，以及文件、設定與可執行程式碼之間的責任邊界。

`docs/index.md` 是 VitePress 公開首頁，刻意不作為儲存庫文件索引。

## 系統流程

```text
技術 URL
   ↓
執行流程 + 來源前置檢查
   ↓
npm run ingest:dispatch -- <URL>
   ↓
來源路由
   ├─ 一般來源 / GitHub / 論文 / 文件 / 工具
   └─ Threads → 完整來源契約
   ↓
LocalBackend → 必要時切換 RemoteBackend
   ↓
已接受來源 + 穩定解析器識別
   ↓
建立 / 更新 Knowledge Card
   ↓
保留使用者擁有狀態
   ↓
驗證 + commit/push
   ↓
GitHub Actions
   ├─ 卡片語意關聯
   ├─ 概念圖譜
   └─ VitePress 建置 / Pages 部署
```

一般收錄的高階入口是 `ingest:dispatch`。`ingest:resolve` 仍是核准執行後端使用的低階解析器／除錯入口。

## 核心能力

- URL 正規化、穩定來源識別與重複資料防護。
- 依來源供應商選擇收錄流程，Threads 使用嚴格的完整性路徑。
- 本機執行能力不足時，可使用儲存庫定義的 Remote Ingest 備援。
- 使用受控分類詞彙與相關性評分產生結構化 Knowledge Card 分析。
- AI 擁有狀態與使用者明確覆寫狀態分離。
- 已接受 Threads 來源快照與變更偵測。
- 使用本機向量嵌入與可選的關聯分類，建立 Card↔Card 語意關聯。
- 從 Knowledge Card 集合產生概念圖譜。
- 透過 VitePress 提供可搜尋的 Knowledge Radar、卡片、圖譜與概念頁面。
- CI/CD 驗證、產生索引維護與 GitHub Pages 部署。
- 文件治理檢查，避免已知的契約／索引漂移再次出現。

## 儲存庫結構

下列目錄樹只保留高階結構；詳細導航請見 [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md)。

```text
Knowledge-Card/
├── .github/
│   ├── agents/
│   │   └── threads-continuation-ranker.agent.md
│   └── workflows/
│       ├── validate.yml
│       ├── deploy-pages.yml
│       ├── remote-ingest.yml
│       ├── update-relations.yml
│       └── rebuild-relations.yml
├── AGENTS.md
├── README.md
├── package.json
├── config/
│   ├── AGENTS.md
│   ├── taxonomy.yaml
│   ├── relation-config.yaml
│   ├── relation-overrides.yaml
│   └── concept-config.yaml
├── content/
│   └── knowledge/
├── data/
│   ├── AGENTS.md
│   ├── embeddings.json
│   ├── relations.json
│   └── concepts.json
├── docs/
│   ├── index.md
│   ├── DOCUMENTATION.md
│   ├── AUTHORITY_MAP.md
│   ├── INGESTION.md
│   ├── THREADS_INGESTION.md
│   ├── AUTOMATION.md
│   ├── RELATIONS.md
│   ├── CONCEPTS.md
│   ├── WEBSITE.md
│   └── .vitepress/
├── profile/
│   └── public-profile.yaml
├── prompts/
│   ├── RUNTIME.md
│   └── CHANGELOG.md
├── schema/
│   ├── knowledge-card.schema.json
│   └── threads-continuation-judgement.schema.json
├── scripts/
│   ├── ingest-dispatch.mjs
│   ├── resolve-source.mjs
│   ├── check-documentation.mjs
│   ├── validate-content.mjs
│   ├── check-ownership.mjs
│   └── lib/
├── state/
│   ├── AGENTS.md
│   └── source-snapshots/
├── templates/
│   └── knowledge-card.example.md
└── tests/
```

## 安裝

```bash
npm install
```

支援 Node.js 20+；GitHub Actions 目前使用 Node.js 24。

## 收錄指令

一般收錄請使用調度器：

```bash
npm run ingest:dispatch -- <URL>
```

只有需要低階來源識別／除錯時才直接使用解析器：

```bash
npm run ingest:resolve -- <URL>
```

需要時可在本機安裝 Threads 瀏覽器支援：

```bash
npm run threads:browser:install
```

跨來源執行契約請見 [docs/INGESTION.md](docs/INGESTION.md)；Threads 專用完整性契約請見 [docs/THREADS_INGESTION.md](docs/THREADS_INGESTION.md)。

## 驗證指令

驗證 Knowledge Card、Schema／Taxonomy 對齊、來源識別與重複資料：

```bash
npm run validate
```

提交既有 Card 更新前，確認 AI 沒有覆蓋使用者擁有狀態：

```bash
npm run validate:ownership -- content/knowledge/2026/<card>.md
```

執行來源工具與儲存庫單元測試：

```bash
npm test
```

檢查文件治理、必要權威連結、廢棄檔名、README 收錄入口與本機治理連結：

```bash
npm run docs:check
```

`docs:check` 會在 pull request 驗證與 `main` 的 Pages 建置關卡中執行。

## 知識圖譜指令

儲存庫在 `data/` 下維護可重建的語意索引。

```bash
npm run embeddings:build
npm run embeddings:validate
npm run relations:build
npm run relations:validate
npm run concepts:build
npm run concepts:validate
```

完整重建可使用：

```bash
npm run relations:rebuild
```

兩個圖譜層的詳細說明請見 [docs/RELATIONS.md](docs/RELATIONS.md) 與 [docs/CONCEPTS.md](docs/CONCEPTS.md)。

## 網站指令

啟動本機 VitePress 開發伺服器：

```bash
npm run docs:dev
```

建置並驗證正式網站：

```bash
npm run docs:build
npm run verify:site
```

預覽正式建置結果：

```bash
npm run docs:preview
```

網站呈現架構請見 [docs/WEBSITE.md](docs/WEBSITE.md)；CI/CD 與 Pages 行為請見 [docs/AUTOMATION.md](docs/AUTOMATION.md)。

## CI/CD 與自動化

目前工作流程包含：

- [validate.yml](.github/workflows/validate.yml) — PR／非 `main` 分支測試、驗證、文件治理檢查、VitePress 建置與輸出驗證。
- [deploy-pages.yml](.github/workflows/deploy-pages.yml) — `main` 驗證／建置關卡與 GitHub Pages 部署。
- [remote-ingest.yml](.github/workflows/remote-ingest.yml) — 本機執行環境缺少必要能力時，執行受信任的 Remote Ingest。
- [update-relations.yml](.github/workflows/update-relations.yml) — 增量維護向量嵌入、關聯與概念索引。
- [rebuild-relations.yml](.github/workflows/rebuild-relations.yml) — 排程或手動完整重建知識圖譜。

實際執行內容以 workflow YAML 為權威來源；[docs/AUTOMATION.md](docs/AUTOMATION.md) 說明操作模型。

## 資料與所有權模型

`content/knowledge/` 下的 Knowledge Card 是正式撰寫的知識內容。`data/` 下的產生索引與 `state/` 下的來源快照各自有範圍所有權契約。

支援使用者覆寫的欄位遵循：

```text
effective_value = user_override ?? ai_value
```

AI 更新可以修改 AI 擁有值，但必須保留使用者明確覆寫值與 `## 使用者備註`，除非使用者明確要求變更。

## 公開安全邊界

本儲存庫用於公開發布。個人化相關性與建議只能使用 `profile/public-profile.yaml` 允許的脈絡、規則允許時的既有公開 Knowledge Card，以及目前分析的公開來源。

不得把私人聊天記錄、雇主／內部資訊、非公開專案、財務資訊、關係／家庭資訊或其他記憶中的私人事實推入公開儲存庫內容。

## 契約速查

```text
prompts/RUNTIME.md
→ 任務／執行流程

AGENTS.md
→ 儲存庫寫入／所有權／驗證契約

docs/INGESTION.md
→ 跨來源收錄與執行

docs/THREADS_INGESTION.md
→ Threads 來源／完整性語意

schema/knowledge-card.schema.json
→ Knowledge Card 機器可讀結構

schema/threads-continuation-judgement.schema.json
→ Threads Phase 7 模型輸出結構

config/taxonomy.yaml
→ 受控詞彙

profile/public-profile.yaml
→ 公開個人化邊界
```

當一份文件需要引用其他文件負責的規則時，只摘要目前範圍需要的不變量，並連回主要權威來源，不要複製完整規則。