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
created_at: 2026-09-12
updated_at: 2026-09-12
last_checked_at: 2026-09-12
summary: Graphify 是本機優先的程式碼與多模態內容知識圖工具，以 tree-sitter 解析程式碼結構、NetworkX 建圖並提供查詢、路徑與概念解釋，也能安裝為多種 AI coding assistant 的 Skill，並選配 MCP、文件／媒體語意擷取與多種圖形匯出。
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

Graphify 是一套本機優先的知識圖與程式碼理解工具：它能把程式碼、文件、PDF、圖片與影音整理成可查詢的圖結構，讓 AI coding assistant 先透過圖查詢專案，再決定需要讀哪些原始檔案。

## 它解決什麼問題

大型專案的 Agent 常以全文搜尋、逐檔閱讀或向量檢索尋找脈絡，但這些方式不容易直接回答「兩個元件怎麼連起來」、「哪個概念是核心節點」、「某個模組跨哪些檔案被呼叫」等關係型問題。

Graphify 的切入點是先把來源轉成節點與邊，再用圖遍歷回答查詢。對程式碼而言，核心抽取由 tree-sitter AST 完成，可取得 `calls`、`imports`、`inherits` 等結構關係；文件與媒體則可選擇使用 AI assistant 或設定的模型後端做語意擷取。輸出後不必每次重新讀完整專案，即可透過既有 `graph.json` 執行查詢與路徑追蹤。

## 核心概念

- **圖優先，而非以向量索引作為主要資料結構**：核心產物是具有節點、關係與來源位置的知識圖，可直接做路徑與鄰接查詢。
- **明確區分關係可信度**：邊可標記為 `EXTRACTED`、`INFERRED` 或 `AMBIGUOUS`，把來源明示關係與推論關係分開。
- **程式碼結構可確定性重建**：程式碼以 tree-sitter 解析 AST，不需要為建圖本身支付 LLM token。
- **讓 Agent 查圖後再讀檔**：安裝 Skill 後，可引導支援的 AI coding assistant 先執行 Graphify 查詢，再縮小原始碼閱讀範圍。
- **圖可持續重用**：主要輸出 `graph.json` 可供 CLI、HTML 視覺化、MCP 與其他匯出器重複使用。

## 架構與技術

官方架構將處理流程拆成：

```text
detect()
→ extract()
→ build()
→ cluster()
→ analyze helpers
→ report.generate()
→ export.to_*()
```

主要技術與模組包括：

- Python 3.10+，核心套件名稱為 `graphifyy`，CLI 指令為 `graphify`。
- tree-sitter：解析約 40 種程式語言的 AST 與跨檔關係。
- NetworkX：承載知識圖資料結構。
- Leiden／相關社群偵測：將圖分成較具凝聚性的子系統；部分能力為選配相依套件。
- `detect.py`、`extract.py`、`build.py`、`cluster.py`、`analyze.py`、`report.py` 與 `export.py` 對應主要處理階段。
- `serve.py` 可選配 MCP stdio／HTTP 服務；`watch.py` 可監看檔案變動並重建。
- `security.py` 集中處理 URL、下載大小、圖檔路徑與輸出標籤等外部輸入。
- 文件、PDF、圖片與影音的語意擷取可使用 assistant 本身或 OpenAI、Anthropic、Gemini、Ollama、Bedrock、Azure OpenAI 等選配後端。

專案的三個主要預設輸出為：

```text
graphify-out/
├── graph.html
├── GRAPH_REPORT.md
└── graph.json
```

此外也支援 Obsidian、SVG、GraphML、Canvas、Cypher 等輸出形式。

## 主要功能

- **程式碼知識圖建構**：抽取函式、類別、匯入、呼叫、繼承等結構，並解析跨檔連結。
- **`query` / `path` / `explain`**：以自然語言縮小子圖、尋找兩個節點間最短路徑，或解釋指定概念及其連線。
- **核心節點與社群分析**：找出高連結節點、子系統與跨社群關係。
- **多模態來源**：除程式碼外，也能處理一般文件、PDF、Office 文件、圖片與影音；不同格式需要不同選配依賴。
- **Agent Skill 安裝**：可安裝到 Claude Code、Codex、Cursor、Gemini CLI、OpenClaw、GitHub Copilot 等多種環境。
- **MCP 介面**：安裝 `mcp` extra 後可作為本機 MCP server 提供圖查詢能力。
- **監看與增量工作流**：提供 watch、語意快取與圖差異等能力，降低重複處理成本。
- **安全處理外部輸入**：URL 擷取包含 SSRF 防護、下載大小限制、重新驗證 redirect、路徑限制與輸出消毒。

## 技術亮點

1. **把靜態程式分析直接轉成 Agent 可用的查詢介面**  
   Graphify 不只產生視覺圖，而是保留來源位置與關係類型，讓 Agent 能先用圖做定位，再進一步閱讀程式碼。

2. **來源關係與推論關係分層**  
   `EXTRACTED` / `INFERRED` / `AMBIGUOUS` 的設計能降低「圖上有邊就等於來源已證實」的混淆，適合作為可稽核的 Agent context。

3. **核心程式碼建圖不依賴 LLM**  
   tree-sitter AST 讓程式碼索引可重建、可測試，也降低 API 成本與模型漂移對基礎圖結構的影響。

4. **與多種 Agent 執行環境整合**  
   專案同時提供 CLI、Skill 與 MCP 路徑，比單純的圖資料庫更接近 AI coding assistant 的實際工作流。

5. **模組邊界清楚**  
   `detect → extract → build → cluster → analyze → report/export` 的流程以普通 Python dict 與 NetworkX graph 交換資料，降低階段間耦合，也方便替換抽取器與匯出器。

## 限制與風險

- **多模態語意擷取仍會依賴模型**：雖然程式碼 AST 建圖可完全本機執行，但文件／媒體的語意層若啟用模型後端，仍會帶來成本、隱私與模型差異問題。
- **Prompt injection 只能降低風險，不能完全消除**：專案會把來源內容包在不可信資料區塊、處理常見注入標記，但官方安全文件也明確承認這不代表注入攻擊不可能成功。
- **第一方 benchmark 需獨立驗證**：LOCOMO、LongMemEval-S 與 ERPNext 數據由專案自己的 harness 產生；雖然有公開方法與重現指令，但跨系統結論仍應視為專案方測試結果。
- **「非向量索引」的定位需精確理解**：核心資料結構確實是圖，不是 vector store；但 benchmark 與部分混合檢索路徑仍提到本機 embedder，因此不能把它解讀成整個專案在所有情境完全不使用 embedding。
- **版本迭代快**：目前套件版本為 0.9.58，近期仍有密集修正與新增語言支援，CLI、Skill 或輸出格式仍可能變動。
- **文件有局部版本落差**：`SECURITY.md` 的 Supported Versions 表仍寫 0.3.x，但 `pyproject.toml` 已是 0.9.58，顯示部分文件可能落後於實際版本。
- **大型圖的品質取決於抽取與解析準確度**：靜態分析能提供穩定結構，但動態呼叫、反射、框架魔法或語意關係仍可能需要推論，應注意 `INFERRED`／`AMBIGUOUS` 邊。

## 與你的相關性

依公開技術背景，Graphify 與 AI R&D、LLM／Agent 的關聯很高。

- **AI R&D：5/5** — 它把程式分析、知識圖、檢索、benchmark 與 Agent context 結合在同一專案中，適合研究「如何讓 Agent 少讀檔、但保留結構脈絡」。
- **AOI × AI：3/5** — 不是影像檢測工具，但可用來整理大型 AI／視覺專案的程式碼、設計文件與模型相關資料。
- **LLM / Agent：5/5** — Skill、MCP、圖查詢與多平台 AI coding assistant 整合都是核心能力。
- **SillyTavern / AI RPG：3/5** — 專案目標並非角色互動，但其圖式長期記憶與關係檢索 benchmark 對記憶系統設計有參考價值。
- **Image Gen：1/5** — 可把圖片納入知識圖，但不是影像生成工作流或模型工具。

## 建議怎麼使用

- **TRY**：選一個中型公開程式庫執行 `graphify .`，先觀察 `graph.html`、`GRAPH_REPORT.md` 與 `graphify query` 是否真的能比全文搜尋更快找到跨檔關係。
- **LEARN**：重點閱讀 `ARCHITECTURE.md`、抽取器、`build.py`、`cluster.py`、`query/path/explain` 與 benchmark harness，理解它如何把確定性 AST 圖與語意檢索接起來。
- **REFERENCE**：把它當成「Agent 如何利用程式碼知識圖」的實作參考，尤其值得比較關係可信度標記、Skill 安裝方式、MCP 介面與安全邊界。

若要進一步導入，建議先以純程式碼、本機 AST 模式驗證圖品質，再逐步啟用文件／媒體語意擷取與遠端模型後端，這樣較容易分辨錯誤來自靜態抽取還是模型推論。

## 與其他收藏的關聯

目前不手動建立具名連結；後續可由 Knowledge Card 的分類、Tag 與關係索引自動評估它與其他 Agent、記憶／知識、AI Coding 類收藏的距離。

## 使用者備註

## 更新紀錄

### 2026-09-12

- 首次收錄 Graphify。
- 依 v8 分支 README、`ARCHITECTURE.md`、`pyproject.toml`、`SECURITY.md` 與 `BENCHMARKS.md` 整理其知識圖、程式碼理解、Agent Skill、MCP 與 benchmark 設計。
