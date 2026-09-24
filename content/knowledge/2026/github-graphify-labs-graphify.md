---
schema_version: 1
id: github-graphify-labs-graphify
title: Graphify
canonical_url: https://github.com/Graphify-Labs/graphify
source:
  type: github
  url: https://github.com/Graphify-Labs/graphify
  identity: github:graphify-labs/graphify
resource_kind:
  ai: project
  user: null
navigation:
  categories:
    ai:
      - AI Coding / DevTools
      - Memory / RAG / Knowledge
    user: null
created_at: 2026-09-12
updated_at: 2026-09-25
last_checked_at: 2026-09-25
summary: Graphify 是本機優先的程式碼與多模態知識圖工具，以 tree-sitter AST 確定性抽取程式結構並用 NetworkX 建圖，提供查詢、路徑、概念解釋、MCP、多平台 Agent Skill、增量更新與工作記憶；0.9.67 進一步強化可重現輸出、語言抽取與專案層級整合。
classification:
  categories:
    ai:
      - RAG / Memory / Knowledge
      - AI Coding / DevTools
      - Agent
    user: null
  tags:
    ai:
      - knowledge-graph
      - code-intelligence
      - tree-sitter
      - NetworkX
      - graph-retrieval
      - static-analysis
      - agent-skill
      - MCP
      - local-first
      - Leiden
      - work-memory
      - deterministic-graph
    user: null
relevance:
  ai:
    overall: 5
    ai_rd: 5
    aoi_ai: 3
    llm_agent: 5
    sillytavern_ai_rpg: 3
    image_gen: 1
  user: {}
actions:
  ai:
    - TRY
    - LEARN
    - REFERENCE
  user: null
status:
  ai: active
  user: null
---

# Graphify

## 一句話介紹

Graphify 是一套本機優先的知識圖與程式碼理解工具：它能把程式碼、文件、PDF、圖片與影音整理成可查詢的圖結構，讓 AI coding assistant 先透過圖理解元件與關係，再決定需要讀哪些原始檔案。

## 它解決什麼問題

大型專案的 Agent 常以全文搜尋、逐檔閱讀或一般檢索尋找脈絡，但這些方式不容易直接回答「兩個元件怎麼連起來」、「哪個概念是核心節點」、「某個模組跨哪些檔案被呼叫」等關係型問題，也容易在大型程式庫中反覆讀取相同內容。

Graphify 的切入點是先把來源轉成節點與邊，再用圖遍歷回答查詢。對程式碼而言，核心抽取由 tree-sitter AST 完成，可取得 `calls`、`imports`、`inherits` 等結構關係；文件與媒體則可選擇使用 AI assistant 或設定的模型後端做語意擷取。圖建立後可持續以 `query`、`path`、`explain`、MCP 或 Agent Skill 重用，不必每次重新掃完整專案。

## 核心概念

- **圖優先，而非以向量索引作為核心資料結構**：主要產物是具有節點、關係與來源位置的知識圖，可直接做鄰接、路徑與子圖查詢。
- **關係來源可追蹤**：官方輸出會區分 `EXTRACTED` 與 `INFERRED`，讓使用者知道連線是直接由來源抽出，還是由解析／關係解決階段推導而來。
- **程式碼結構可確定性重建**：程式碼以 tree-sitter 解析 AST，核心程式碼建圖不需要 LLM，也不必把原始碼送到遠端模型。
- **讓 Agent 查圖後再讀檔**：安裝 Skill 後，可引導支援的 AI coding assistant 先查 Graphify，再縮小需要閱讀的原始碼範圍；Claude Code 另提供 project-scoped strict mode，在每個 session 首次直接讀原始碼前導向圖查詢。
- **圖與經驗都可持續累積**：除了 `graph.json`，近期版本還加入 `save-result`／`reflect`，可把問答結果整理成工作記憶與 `LESSONS.md`，並產生 `.graphify_learning.json` 作為後續查詢提示。
- **支援跨專案與團隊工作流**：可建立 global graph，也提供 PR dashboard／triage 與 worktree、圖社群衝突等檢視能力。

## 架構與技術

官方架構將主要處理流程拆成：

```text
detect()
→ extract()
→ build()
→ cluster()
→ analyze helpers
→ report.generate()
→ export.to_*()
```

主要技術與執行組成包括：

- Python 3.10+；PyPI 套件名稱為 `graphifyy`，CLI 指令為 `graphify`。
- tree-sitter：負責多種程式語言 AST 抽取與跨檔關係。README 目前描述約 40 種語言；0.9.66 又加入 COBOL、VB.NET、R、Solidity、Erlang 等抽取器。
- NetworkX：承載主要知識圖資料結構。
- Leiden／相關社群偵測：把圖切分成較具凝聚性的子系統；部分後端以 optional dependency 提供。
- MCP：安裝 `mcp` extra 後可啟動 stdio server，亦有選配 HTTP transport。
- 語意後端：文件、PDF、圖片與影音可使用 assistant 本身，或 Claude、OpenAI 相容服務、Gemini、Kimi、DeepSeek、Ollama、Bedrock、Azure OpenAI、Claude CLI 等後端。
- 外部資料來源：除資料夾掃描外，也支援 PostgreSQL schema introspection、Rust Cargo workspace 與 Google Workspace 匯出等流程。
- 整合層：提供 Claude Code、Codex、Cursor、Gemini CLI、GitHub Copilot、OpenCode、OpenClaw、Aider、Pi 等多種 Agent／coding assistant 安裝路徑，也支援 generic Agent Skills 位置。

預設輸出為：

```text
graphify-out/
├── graph.html
├── GRAPH_REPORT.md
└── graph.json
```

並可輸出 Obsidian、Markdown wiki、SVG、GraphML、Neo4j／FalkorDB Cypher 等格式。

## 主要功能

- **程式碼知識圖建構**：抽取函式、類別、匯入、呼叫、繼承、介面／協定要求等結構，再解析跨檔連結。
- **`query` / `path` / `explain`**：以自然語言縮小子圖、追蹤兩節點間路徑，或解釋指定概念與鄰接關係。
- **多模態來源**：文件、PDF、Office 文件、圖片與影音可納入同一張圖；需要語意理解的格式會使用設定的模型後端。
- **多平台 Agent Skill**：支援 user-global 與 project-scoped 安裝；部分平台另有 hook 或 always-on instruction，讓 Agent 在原始檔閱讀前優先利用圖。
- **Strict mode**：Claude Code 的 project install 可選 `--strict`，在每個 session 首次 raw source read 時阻擋並導向 Graphify，之後回到較柔性的提示模式。
- **增量更新與 Git hooks**：可使用 `update`、`watch` 與 post-commit／post-checkout hook 維持圖同步；pull／merge 後仍建議顯式執行更新。
- **工作記憶與反思**：`save-result` 記錄 useful／dead_end／corrected 的問答結果，`reflect` 再彙整成可重用 lessons 與學習 overlay。
- **全域圖與 PR 工作流**：可把多個專案註冊到 global graph，並使用 `graphify prs` 檢視 CI、review、worktree、圖影響與社群衝突。
- **MCP 與資料庫／圖資料庫整合**：可把查圖能力提供給 MCP client，也能產生或推送 Neo4j、FalkorDB 資料。
- **安全處理外部輸入**：URL 擷取含 SSRF 防護、redirect 重新驗證與大小限制；圖路徑、HTML 標籤、YAML frontmatter 與模型輸入亦有對應消毒或界線處理。

## 技術亮點

1. **把靜態程式分析直接轉成 Agent 可用的查詢介面**  
   Graphify 不只產生視覺圖，而是保留來源位置、關係與可查詢結構，讓 Agent 能先以圖定位，再進一步閱讀程式碼。

2. **確定性 AST 與語意層分工清楚**  
   程式碼關係以 tree-sitter 為主，文件／媒體才交由模型做語意抽取，能把「可重建的程式結構」與「模型推論」分開處理。

3. **近期強化輸出的可重現性**  
   0.9.66 會固定 `PYTHONHASHSEED` 後重新執行，使 `extract`、`update`、`cluster-only`、`label` 等路徑的 `graph.json` 在相同輸入下更穩定；同關係衝突時也會保留較高可信度的邊，例如 `EXTRACTED` 優先於 `INFERRED`。

4. **抽取器持續補足真實語言語意**  
   0.9.67 加入 PHP anonymous function／arrow function 與 route closure 的節點化，並改善 Python absolute package import、package／module collision 等解析；這些修正直接提升框架型專案的跨檔圖品質。

5. **Agent 整合不再只是單一 Skill 檔**  
   專案提供 project-scoped install、平台專用 hook、generic Agent Skills、MCP，以及 Claude Code strict mode；這使 Graphify 更接近 Agent harness 的 context-routing 層，而不是單純離線圖產生器。

6. **開始把使用經驗寫回檢索層**  
   `save-result`／`reflect` 與 learning overlay 讓「這條查詢是否有用」成為後續提示訊號，形成圖結構之外的工作記憶層。

## 限制與風險

- **文件／媒體語意擷取仍會依賴模型**：程式碼 AST 建圖可以完全本機執行，但需要語意理解的文件、多媒體與部分社群命名流程，仍可能帶來 API 成本、資料外送、模型差異與可重現性問題。
- **Prompt injection 只能降低風險，不能完全消除**：官方安全文件會用不可信來源區塊、hash 標記與已知 sentinel neutralization 隔離來源內容，但文件也明確指出這不代表注入不可能成功。
- **第一方 benchmark 應視為專案方測試結果**：README 公布 LOCOMO、LongMemEval-S 等數據與重現方法，但跨系統比較仍應獨立驗證資料集、預算、judge 與設定是否符合自己的場景。
- **「不是向量索引」描述的是核心圖式檢索定位**：Graphify 的主要查詢資料結構確實是 graph，而非 vector store；但文件／媒體語意抽取仍可能使用外部 LLM，因此不應把「本機程式碼建圖不需要模型」擴大解讀為所有處理流程都不會使用模型。
- **版本迭代非常快**：目前 `pyproject.toml` 與最新正式 release 都是 0.9.67，且 0.9.65～0.9.67 在數日內連續加入安全修正、語言抽取與解析器修正；CLI、Skill、hook 與輸出行為仍可能快速變動。
- **安全文件存在版本資訊落差**：目前 `SECURITY.md` 的 Supported Versions 表仍標示 0.3.x，但套件已是 0.9.67，表示至少這部分治理文件未完全跟上實際發布節奏。
- **平台整合能力不完全等價**：部分平台沒有 `PreToolUse` hook；README 也指出 OpenClaw、Aider 等環境的平行 Agent 支援較早期，因此同一個 `graphify install` 概念在不同 assistant 上的約束力與抽取方式並不相同。
- **大型圖仍受靜態分析邊界影響**：反射、動態 dispatch、runtime code generation、框架魔法與模糊名稱解析仍可能產生缺邊或推論邊；即使 0.9.66 起提高輸出可重現性，也不等於圖內容天然完整。

## 與你的相關性

依公開技術背景，Graphify 與 AI R&D、LLM／Agent 的關聯很高。

- **AI R&D：5/5** — 它把程式分析、知識圖、檢索、benchmark、工作記憶與 Agent context routing 放在同一套工具中，適合研究如何讓 Agent 降低原始碼閱讀量，同時保留結構脈絡。
- **AOI × AI：3/5** — 不是影像檢測工具，但可用來整理大型 AI／電腦視覺專案的程式碼、設計文件、資料流程與跨模組依賴。
- **LLM / Agent：5/5** — Skill、hook、strict mode、MCP、工作記憶、全域圖與多平台 coding assistant 整合都直接屬於 Agent infrastructure。
- **SillyTavern / AI RPG：3/5** — 專案目標不是角色互動，但圖式記憶、關係檢索與工作記憶 overlay 對長期記憶系統設計具有參考價值。
- **Image Gen：1/5** — 可把圖片納入知識圖，但不是影像生成模型或創作工作流。

## 建議怎麼使用

- **TRY**：以一個中型、結構熟悉的程式庫執行 `graphify .`，先比較 `graphify query`／`path` 與原本全文搜尋在跨檔追蹤上的差異，再判斷圖是否足以成為日常 Agent context 入口。
- **LEARN**：優先研究 AST 抽取、跨檔 resolver、confidence／edge merge、deterministic graph、Skill／hook 與 `save-result`／`reflect`，這些比單純的 `graph.html` 視覺化更能代表它目前的架構價值。
- **REFERENCE**：可把它作為「Agent 如何在讀檔前先經過結構化 context layer」的實作參考，並比較 project-scoped instruction、strict hook、MCP 與圖式工作記憶的邊界。

若要正式導入，建議先以純程式碼與本機 AST 模式驗證圖品質、更新穩定性及 hook 行為，再逐步加入文件／媒體語意後端與 `reflect` 工作記憶；這樣較容易區分錯誤是來自靜態抽取、關係解決，還是模型語意層。

## 與其他收藏的關聯

目前不手動建立具名連結；後續可由 Knowledge Card 的分類、Tag 與關係索引自動評估它與其他 Agent、記憶／知識、AI Coding 類收藏的距離。

## 使用者備註

## 更新紀錄

### 2026-09-25

- 重新驗證 Graphify 官方 Repository、README、`pyproject.toml`、`SECURITY.md` 與近期 releases，將版本資訊由 0.9.58 更新為 0.9.67。
- 補充 0.9.66～0.9.67 的可重現 `graph.json`、高可信度 edge merge、新增 COBOL／VB.NET／R／Solidity／Erlang 抽取器、PHP closure 與 Python import resolver 等更新。
- 補充 project-scoped Skill、Claude Code strict mode、generic Agent Skills、工作記憶／`reflect`、global graph 與 PR dashboard 等目前能力。
- 保留既有 user-owned state；分類、整體相關性與建議 Action 維持不變。

### 2026-09-12

- 首次收錄 Graphify。
- 依 v8 分支 README、`ARCHITECTURE.md`、`pyproject.toml`、`SECURITY.md` 與 `BENCHMARKS.md` 整理其知識圖、程式碼理解、Agent Skill、MCP 與 benchmark 設計。
