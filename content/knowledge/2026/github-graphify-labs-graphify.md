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
      - Memory / RAG / Knowledge
      - Agent / Harness
      - AI Coding / DevTools
    user: null
created_at: 2026-09-12
updated_at: 2026-09-26
last_checked_at: 2026-09-26
summary: Graphify 是一套本機優先的知識圖譜工具與 Agent Skill，將程式碼、文件、PDF、影像與影音整理成可查詢圖譜；程式碼以 tree-sitter AST 做確定性抽取，非結構化內容可由模型補充語意關係，並提供圖遍歷查詢、社群分群、MCP 與多種匯出介面。
classification:
  categories:
    ai:
      - RAG / Memory / Knowledge
      - Agent
      - AI Coding / DevTools
      - LLM
    user: null
  tags:
    ai:
      - knowledge-graph
      - code-intelligence
      - tree-sitter
      - NetworkX
      - Leiden
      - agent-skill
      - MCP
      - local-first
      - incremental-indexing
      - graph-traversal
      - multimodal-extraction
    user: null
relevance:
  ai:
    overall: 5
    ai_rd: 5
    aoi_ai: 2
    llm_agent: 5
    sillytavern_ai_rpg: 3
    image_gen: 2
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

Graphify 是一套面向 AI coding assistant 的本機優先知識圖譜工具：它把專案中的程式碼、文件、PDF、影像與影音轉成持久化圖譜，讓 Agent 以「找節點 → 沿關係展開」的方式查詢結構，而不是每次重新 grep、逐檔閱讀或把大量原始內容塞進上下文。

截至 2026-09-26，官方預設分支為 `v8`，`pyproject.toml` 版本為 `0.9.69`。目前仍屬 0.9.x 快速演進階段，但已有完整 CLI、Agent Skill、MCP、快取、查詢、視覺化、匯出與測試體系。

## 它解決什麼問題

大型程式庫或混合知識資料夾對 Agent 有兩個典型成本：一是每次問題都重新搜尋與閱讀大量原始檔案；二是即使找到局部文字，也很難穩定保留「誰呼叫誰、誰匯入誰、哪些概念跨文件相連、哪些區塊屬於同一子系統」這類結構資訊。

Graphify 的切入點不是先建立向量索引，而是把來源轉成可持久化、可遍歷、可更新的圖。程式碼優先用 AST 產生確定性的符號與關係；文件、PDF、圖片、影音等非結構化內容則可交由模型做語意抽取。Agent 最後取得的是與問題相關的一小塊子圖，而不是整個原始資料集。

## 核心概念

1. **知識圖譜是主要中介表示。** 節點代表函式、類別、模組、概念等實體；邊表示 `calls`、`imports`、`inherits`、`references` 等關係，主要查詢不要求部署向量資料庫。
2. **程式碼與語意內容分層抽取。** 程式碼主要由 tree-sitter AST 做本機、確定性抽取；文件與多媒體才進入選配的語意模型流程。
3. **關係保留證據強度。** 邊可標成 `EXTRACTED`、`INFERRED` 或 `AMBIGUOUS`，區分直接來源事實、合理推論與仍需人工檢查的關係。
4. **查詢採種子節點加圖遍歷。** 現行程式會先依節點標籤、來源路徑、rationale 與屬性等訊號排序候選，再用 BFS／DFS 沿圖展開，並受深度與 token budget 限制。
5. **圖是可增量更新的長期資產。** manifest 與抽取快取讓重新執行只處理變更內容；AST 快取會跟隨 extractor 版本／schema 失效，語意快取則納入抽取 prompt 指紋。
6. **Agent 整合是核心產品面。** 除 Python 函式庫外，專案也提供不同 AI coding assistant 的 Skill／安裝流程與 MCP 介面。

## 架構與技術

官方架構主流程是：

```text
detect()
→ extract()
→ build()
→ cluster()
→ analyze helpers
→ report.generate()
→ export.to_*()
```

主要組成包括：

- **偵測與分類**：掃描 corpus，依程式碼、文件、論文、圖片、影音等類型分類。
- **抽取**：程式碼透過 tree-sitter 系列 parser 建立符號與結構邊；非結構化內容可由 Agent 或設定的模型後端補充節點、關係與 rationale。
- **建圖**：以 NetworkX 建立圖，處理重複節點、外部 import stub、跨語言解析與關係可信度。
- **社群分群**：優先使用 Leiden；不可用時退回 NetworkX Louvain，用來辨識子系統與高層結構。
- **查詢**：提供 `query`、`path`、`explain`，先找到種子節點，再遍歷相關子圖。
- **輸出**：預設產生 `graph.html`、`GRAPH_REPORT.md`、`graph.json`；另可匯出 Obsidian、SVG、GraphML、Neo4j／FalkorDB 等格式。
- **MCP**：可啟動本機 stdio server；HTTP transport 為選配，預設綁定 localhost。
- **執行環境**：Python 3.10+；目前專案 metadata 宣告 Apache-2.0 授權。

現行版本也提供多個 AI coding assistant 的安裝適配，包括 Claude Code、Codex、Cursor、Gemini CLI、GitHub Copilot、OpenCode、Aider、OpenClaw、Pi 等。

## 主要功能

- 將專案或資料夾建立為可重複查詢的知識圖譜。
- 對多種程式語言做 AST 級別的符號、import、呼叫與繼承等結構抽取。
- 把 Markdown、PDF、圖片、影音等非結構化內容接入同一張圖。
- 以 `graphify query` 取得與自然語言問題相關的子圖。
- 以 `graphify path` 追蹤兩個實體之間的連接路徑。
- 以 `graphify explain` 查看單一節點及其鄰接關係。
- 使用 `--update`、watch mode 或 Git hook 維持圖與專案變更同步。
- 透過 HTML、報告、MCP 與多種匯出格式讓人或 Agent 繼續消費圖資料。

## 技術亮點

### AST 與語意抽取明確分層

能從語法直接取得的函式、類別、import、call 等關係不必交給模型猜；模型集中處理 AST 不擅長的非結構化語意。這比所有來源都走 LLM 抽取更容易控制成本、重現性與隱私邊界。

### 圖查詢同時是一層 context 壓縮

Graphify 不只建立圖，而是把查詢裁成有限深度、有限 token 的相關子圖。Agent 後續不必重掃完整 corpus，能直接取得結構鄰域與路徑。

### 快取失效條件設計細緻

AST 快取納入 extractor 版本／schema，語意快取與抽取 prompt 指紋綁定，避免來源檔未變但抽取器或 prompt 已改時，仍持續使用舊結果。

### 不確定性寫進圖資料

`EXTRACTED`、`INFERRED`、`AMBIGUOUS` 讓下游查詢與人工檢查能辨認推論程度，比無來源的關係集合更適合需要可追溯性的 Agent 工作流。

### 已從單一 Skill 擴展成圖式 code intelligence 基礎設施

現行版本把多 Agent 安裝、MCP、查詢、跨專案圖與多種輸出都視為正式能力，定位已明顯超過早期單一 Claude Code 指令。

## 限制與風險

- **本機優先不等於所有內容都留在本機。** 程式碼 AST 可完全本機執行；文件、圖片、影音等語意抽取若使用外部模型後端，內容可能送往該服務。
- **推論邊仍可能錯。** 信心標籤能揭露不確定性，但不能保證語意抽取或跨檔案解析完全正確；高風險判斷仍應回到來源檔驗證。
- **圖品質直接決定查詢品質。** 缺失邊、錯誤邊、命名碰撞或高連接度 hub 都可能影響 seed selection 與 traversal。
- **0.9.x 仍快速變動。** 2026-09-26 已發布 `0.9.69`，同一天仍有 extractor、快取、路徑與文件治理變更；活躍度高，但 1.0 前仍需預期介面與行為調整。
- **多語言、多格式支援帶來依賴複雜度。** PDF、影音、資料庫、MCP、Neo4j 等能力另有 optional extras，完整環境比單純搜尋工具更重。
- **非結構化來源需要防範內容型攻擊。** 專案已對模型輸入加入不可信來源隔離與輸出清理，但官方安全文件也明確表示這類防護不能視為絕對安全。
- **官方 benchmark 是專案自行量測。** 專案在 LOCOMO 報告 recall@10 0.497、QA 45.3%，LongMemEval-S 報告 76% QA；code-intelligence 測試題數則很少。適合當方向性證據，不宜直接當成跨場景的外部獨立驗證。

## 與你的相關性

依公開技術 profile，Graphify 對 **AI R&D** 與 **LLM／Agent** 的相關性最高。它提供可直接研究的「圖式外部記憶＋程式碼知識層」實作，涵蓋資料抽取、結構化表示、增量更新、查詢裁切、Agent 工具化與 MCP 介面，適合比較傳統 RAG、向量檢索與 graph-first retrieval 的工程取捨。

對 **AOI × AI** 的關聯較間接：它不是視覺模型、檢測或 OCR 工具，但可以作為大型 AI 專案的程式碼／文件知識層。

對 **SillyTavern／AI RPG**，較有參考價值的是知識圖譜、長期記憶與「只取回相關子圖」的設計思想，而不是直接把 Graphify 當成角色記憶系統。

對 **Image Generation** 則主要是能把圖片納入知識抽取；它本身不是生成模型或圖片工作流工具。

## 建議怎麼使用

目前建議的 Action 是 **TRY / LEARN / REFERENCE**。

先選一個同時有程式碼與文件的中型公開專案做 A/B 測試：

1. 建立 Graphify 圖譜。
2. 準備 10～20 個需要跨檔案理解的問題。
3. 比較 `graphify query/path/explain` 與傳統 grep／逐檔閱讀在正確性、token 消耗與來源追蹤上的差異。
4. 修改部分檔案後再執行 `--update`，確認快取與圖更新是否符合預期。
5. 若查詢品質穩定，再考慮以 project-scoped Skill 或 MCP 接到主要 Agent 工作流。

研究時最值得拆解的是 **AST／語意雙層抽取、query seed + graph traversal、快取失效策略**；這三者比視覺化介面本身更能代表 Graphify 的技術價值。

## 與其他收藏的關聯

Graphify 與「Memory / RAG / Knowledge」、「Agent / Harness」及「AI Coding / DevTools」類收藏有明顯交集。本次不手動綁定特定卡片，實際 Card↔Card 關係交由 Knowledge Card 的 Relation／Concept 索引依現行內容重新計算。

## 使用者備註

## 更新紀錄

### 2026-09-26

- 依 Graphify 目前預設分支 `v8` 的 README、架構文件、原始碼、安全文件、benchmark 與最新版本資訊重新獨立分析。
- 更新到 `0.9.69` 現況，補入多 Agent 安裝、AST／語意雙層抽取、圖遍歷查詢、增量快取、MCP 與多格式匯出等現行設計。
- 重新評估技術亮點、限制、風險、相關性與建議 Action。
