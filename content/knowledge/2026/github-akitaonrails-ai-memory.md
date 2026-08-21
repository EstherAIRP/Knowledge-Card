---
schema_version: 1
id: github-akitaonrails-ai-memory
title: ai-memory
canonical_url: https://github.com/akitaonrails/ai-memory
source:
  type: github
  url: https://github.com/akitaonrails/ai-memory
  identity: github:akitaonrails/ai-memory
resource_kind:
  ai: project
  user: null
created_at: 2026-08-16
updated_at: 2026-08-21
last_checked_at: 2026-08-21
summary: ai-memory 是以 Rust 實作的 Coding Agent 長期記憶與跨 Agent handoff 系統，透過 lifecycle hooks 蒐集經清理的工作觀察，編譯成 Git 版本化 Markdown wiki，並以 SQLite／FTS5／entity／graph／可選 vector retrieval 提供召回；同時支援 Claude Code、Codex、OpenCode、OpenClaw 等多種 Agent CLI 之間延續同一工作脈絡。
classification:
  categories:
    ai:
      - LLM
      - Agent
      - RAG / Memory / Knowledge
      - AI Coding / DevTools
    user: null
  tags:
    ai:
      - long-term-memory
      - agent-memory
      - cross-agent-handoff
      - coding-agent
      - MCP
      - lifecycle-hooks
      - managed-workstreams
      - Markdown-wiki
      - git-versioned-memory
      - SQLite
      - FTS5
      - RRF
      - entity-retrieval
      - graph-retrieval
      - vector-retrieval
      - memory-consolidation
      - Rust
    user: null
relevance:
  ai:
    overall: 5
    ai_rd: 4
    aoi_ai: 1
    llm_agent: 5
    sillytavern_ai_rpg: 4
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

# ai-memory

## 一句話介紹

`ai-memory` 是一套專為 AI Coding Agent 設計的長期記憶與跨 Agent handoff Runtime：它從 Claude Code、Codex、OpenCode、OpenClaw 等工具的 lifecycle hooks 擷取經過清理的工作觀察，逐步編譯成 Git 版本化 Markdown wiki，再用 SQLite 衍生索引與混合檢索讓不同 Agent 在切換工具或跨 session 後繼續同一份工程脈絡。

## 它解決什麼問題

Coding Agent 的 session context 通常只能在單一工具、單一 conversation 或有限 context window 內成立。當使用者中途關閉 Claude Code、改用 Codex，或隔天重新開啟同一個 repository，先前的架構決策、踩過的錯誤路徑、未完成工作與 open questions 很容易消失；即使某個 Agent 自己能 resume，也不代表另一個 vendor 的 Agent 能理解同一段歷史。

`ai-memory` 的切入點是把「Agent 記憶」移到 Agent 之外，建立一層跨 CLI、跨 session、可自行持有的 project memory。它不要求每次工作都手動呼叫 `write_note`，而是透過 lifecycle hooks 自動捕捉 bounded observations；session 結束時形成 summary／handoff，後續再把有價值的內容整理成 wiki pages，讓下一個 Agent 透過 MCP、hook injection 或 managed workstream 取得有限且有來源的歷史脈絡。

另一個重要問題是：**歷史記憶不能取代現在的程式碼真相**。專案明確把 prior decisions、rationale、failed attempts、procedures 與 handoffs 視為 memory 的責任，而 symbol、caller、dependency、impact analysis 則應交給目前 checkout、LSP 或 structural code intelligence。也就是說，這是一個「歷史工程脈絡層」，不是企圖用舊摘要覆蓋 live code state 的萬能知識庫。

## 核心概念

第一個核心是 **Markdown wiki 是 source of truth，SQLite 是衍生索引**。`ai-memory` 不把向量資料庫當成記憶本體；真正累積下來的是可以 grep、用 Obsidian 打開、由 Git 版本控制的 Markdown tree。SQLite 則保存 FTS5、entity index、links、sessions、observations、handoffs、audit、embeddings 與 managed workstream state。這讓資料的可讀性、可攜性與檢索效率分層，而不是綁死在單一 retrieval engine。

第二個核心是 **從 lifecycle observation 編譯記憶，而不是保存完整 transcript**。Agent 的 `SessionStart`、`UserPromptSubmit`、tool events、compaction、Stop、SessionEnd 等事件先經過 bounded capture 與 sanitizer，再進入 storage。SessionEnd 會先產生 rule-based session summary 與下一個 Agent 可用的 handoff；有設定 LLM provider 時，才進一步把材料 consolidation 成 `concepts/`、`decisions/`、`gotchas/`、`procedures/` 或 `_rules/` 等較長期的頁面。

第三個核心是 **跨 Agent handoff 與 managed workstream 是兩個層次**。基本 handoff 處理「上一個 Agent 做到哪裡」；opt-in 的 `ai-memory run` 則維護跨 harness 的 logical workstream，除了共享 bounded packet，還會記錄 portable visible-event ledger、各 harness 的 native-session identity 與 delivery cursor，並盡可能使用各工具原生的 resume 能力。因此它不是只把一段 summary 貼到下一個 prompt，而是在不同 Agent CLI 之間維護一個可追蹤的連續工作流。

第四個核心是 **Hybrid recall + authority-aware ranking**。查詢候選可以由 FTS5、entity matching、wikilink graph neighbor 與可選 vector similarity 產生，再透過 RRF 融合。之後還會根據 page kind、tier、`pinned` 與 `canonical`／`active`／`source-of-truth` 或 `superseded`／`historical` 等 metadata 做 bounded authority adjustment。這個設計不是把某個 namespace 直接當成絕對真理，而是在相近候選中提高 maintained rules、decisions、procedures、gotchas 的優先度，同時保留 episodic evidence 的可搜尋性。

第五個核心是 **記憶內容始終是 untrusted historical evidence**。專案明確要求 retrieved text、repository text、observations 與 auto-improvement proposals 都不能因為被放進 `_rules/`、被 pin、或排名較高，就自動取得 instruction authority。這個 boundary 很重要，因為長期記憶一旦能反覆注入 Agent prompt，就必須防止歷史內容、工具輸出或被污染文字轉化成永久 prompt injection。

## 架構與技術

Repository 主要以 **Rust** 實作，README 要求 Rust 1.95+；截至 2026-08-16，GitHub 最新正式 release 為 `v1.27.0`，專案採 MIT License，且仍在持續更新。它可以作為單一 binary 運行，server 同時承載 MCP 與 `/web` read-only wiki UI；文件指出 Web server 使用 Axum。

核心儲存分成幾層：

- `<data_dir>/wiki/`：Git 管理的 Markdown source of truth。Wiki page 可 supersede 舊版本，也能透過 Git checkpoints／restore 回看歷史。
- `<data_dir>/db/memory.sqlite`：WAL mode 的衍生索引與 operational state，包含 pages、FTS5、sessions、observations、handoffs、links、embeddings、workstreams、pending writes 等。
- `<data_dir>/raw/`：managed workstream 的 immutable sanitized JSONL segments。
- `<data_dir>/logs/`：rolling tracing logs。

寫入路徑採 single-writer actor：hook router 清理 payload、正規化 observation kind 後，把 `WriteCmd` 送給唯一 writer；native hook event 具有 idempotency key，重試時可避免重複 observation，並在下游 wiki／handoff effect 完成後才標記完成。對 Agent hot path，native hook 會先 local spool，再由 detached drain helper 傳送，避免把網路延遲直接加到 coding loop；server 飽和時以 HTTP 429 拒絕，而不是無限制排隊。

檢索路徑則以 **FTS5 + entity-match + link-neighbor RRF** 為基礎，設定 embedder 後再加入 vector cosine candidate stream。Entity 來自 wiki frontmatter 中最多 10 個 specific nouns；graph stream 來自 page links。查詢完成後可以再做 authority adjustment，亦可選擇 `AI_MEMORY_RERANKER=llm` 進行 bounded rerank；若 provider 失敗、timeout、格式不合法或飽和，會保留 local ranking，不讓外部 reranker 成為單點故障。

記憶維護還包含 forget／decay 與 auto-improvement。頁面可依 `expires_at` TTL 刪除，低 retention 頁面可被 eviction 並留下 tombstone；另外，LLM provider 可用時，scheduler 會針對新完成 sessions 產生改進 proposal，預設經 validation 後走正常 wiki write path，也可以設定 `require_approval = true` 改成人工審核，或為 `_rules/`、`procedures/` 等重要寫入加入自訂 executable eval gate。

Agent 整合面主要透過 **MCP + lifecycle hooks + generated plugins/extensions**。支援矩陣目前涵蓋 Claude Code、Codex、Command Code、Devin CLI、OpenCode、Cursor、Gemini CLI、OpenClaw、Kimi Code、Kiro CLI、Grok Build CLI、Antigravity CLI、OMP、Pi 等；不同工具的 hook 語意不完全相同，因此專案為各 client 定義對應 capture／handoff 行為，而不是假設所有 Agent 都有同樣的 SessionEnd contract。

## 主要功能

- **跨 Coding Agent 長期記憶**：讓不同 Agent CLI 共用同一份 project wiki 與歷史工程脈絡。
- **自動 lifecycle capture**：從 prompt、tool lifecycle、compaction 與 session boundary 擷取 bounded、sanitized observations，不要求手動寫筆記。
- **Cross-agent handoff**：SessionEnd 形成 bounded handoff，下一個 Agent 啟動時可取得「上次做到哪裡」的 context。
- **Managed workstreams**：`ai-memory run <harness>` 維持跨 harness 的 logical workstream、visible-event ledger、native session linkage 與 full-ledger search。
- **Hybrid memory query**：以 FTS5、entity、link-neighbor、可選 vector 進行 RRF 融合，並加入 authority-aware adjustment。
- **LLM memory consolidation**：可把 session observation 重新整理成 concepts、decisions、gotchas、procedures、rules 等較穩定的知識頁。
- **Git 版本化 wiki**：支援 checkpoint、restore、手動編輯與 Obsidian／grep 等一般檔案工具。
- **Memory decay／forget sweep**：支援 TTL、retention、tombstone 與清理策略，避免長期記憶只增不減。
- **MCP + Web UI + CLI**：MCP 提供 Agent access，`/web` 提供 read-only wiki browser，CLI 則負責安裝、查詢、backup、lint、consolidation、finalize session 等操作。
- **多機／共享部署**：可本機 loopback 運行，也可用 bearer token 放到 LAN／VPN／cloud；另有 per-operator slots 與 usage activity 等 shared-server 能力。

## 技術亮點

最值得參考的是 **「可讀知識本體」與「高效 retrieval index」分離**。很多 Agent memory 系統一開始就把 embedding store 當成真相，久了之後很難知道模型到底記住了什麼、如何人工修正或搬家。`ai-memory` 反過來讓 Markdown／Git 成為 durable knowledge artifact，再把 SQLite、FTS、vector、graph 都視為可以重建的 acceleration layer。這是一種很適合長期 Agent infrastructure 的資料治理方式。

第二個亮點是 **記憶生命週期比單純 RAG 完整**。Capture、session summary、handoff、consolidation、authority ranking、reinforcement、decay、TTL、supersession、restore 都有各自的位置。這表示「記憶」被當成會產生、提升、衰減、修正與過期的系統，而不是單次 `embed → top-k → inject`。

第三個亮點是 **跨 harness continuity 不只共享一個 vector DB**。Managed workstream 會維護 native source/delivery cursors、session linkage、visible-event ledger 與 startup packet delivery claim，並避免已注入的 packet 被 Claude transcript 再次讀回後遞迴污染 ledger。這些細節直接處理了 cross-agent continuity 中最容易被忽略的重複注入、session attribution 與 replay 問題。

第四個亮點是 **明確區分 memory authority 與 instruction authority**。即使某頁被標成 canonical 或 source-of-truth，它也只是 retrieval ranking signal；歷史文字不會因排名或 namespace 自動變成更高優先級的指令。對需要長期注入記憶的 Agent 系統而言，這是一個比「把 memory 放進 system prompt」更成熟的安全模型。

第五個亮點是 **Agent hot path 的工程化處理**。Local spool、bounded payload、detached drain、429 backpressure、idempotency key、single-writer SQLite actor 與 replay handling，讓 lifecycle capture 不是一組容易阻塞主流程的 shell hooks，而是有可靠性邊界的 ingestion subsystem。

## 限制與風險

第一個限制是 **hook capture 並不是完整原生 transcript**。專案自己明確把 observations 定位為 sanitized、bounded lifecycle projections；如果需要重建某個 Agent 的每一個 token、完整 reasoning 或所有 native UI event，這套資料並不保證完整。Managed workstream 可以提高 continuity fidelity，但也不等於所有 harness 都有同樣完整的 native session API。

第二個限制是 **不同 Agent 的 lifecycle contract 不一致**。例如 Codex、Antigravity CLI、Command Code 等沒有可直接等同於 true SessionEnd 的 hook 時，需要 `finalize-session` 才能形成最終 summary／handoff；有些工具可以 capture 但不能從 SessionStart stdout 注入 handoff，只能改走 MCP。整合品質因此取決於各 vendor 暴露的 hook／resume 能力。

第三個限制是 **Native Windows 目前仍標示 Experimental**；Windows via WSL2 則走 Linux 支援路徑。Linux 是主要 Docker／server target，macOS 有正式 native release。若部署環境跨平台，應依 support matrix 驗證對應 binary、hook command schema 與 client 行為，而不是假設所有平台完全對等。

第四個風險是 **記憶系統本身會接觸高敏感度工程內容**。預設 quick-start 綁定 `127.0.0.1` 且無 authentication，適合單機使用；一旦暴露到 LAN／VPN／cloud，就應啟用 bearer token、管理 client trust，並審視 capture exclusions、logs、backup 與 LLM／embedding provider 的資料流。Per-operator slots 主要是 context-injection isolation，文件也明確說它不是完整 RBAC；project-wide wiki read/search 仍需另外考慮授權邊界。

第五個限制是 **LLM／embedding 能力越多，外部 provider 依賴越高**。基本 Markdown wiki、FTS 與部分 session flow 可以不依賴 LLM，但 richer consolidation、auto-improvement、optional reranking、semantic vector retrieval 會增加 provider cost、latency、privacy surface 與模型品質變異。專案已有 fail-open-to-local-ranking、approval／eval gate 等防護，但這些功能仍需要營運治理。

第六個風險是 **歷史記憶可能過時或被錯誤 consolidation**。專案已明確要求 current checkout、tests、builds、runtime behavior 才是 operational truth，memory 只提供歷史 evidence。實際使用時仍應避免讓舊 decision page 或高權重 wiki page覆蓋現在程式碼與當前任務指令。

成熟度方面，Repository 在 2026-05 建立後持續快速演進，到 2026-08-16 已發布 `v1.27.0`，GitHub 顯示約 1.5k stars、160+ forks，且有 Linux／macOS／Windows binaries 與多 client support matrix。這顯示專案已超過概念原型，但快速 release cadence 與廣泛 integration surface 也代表升級時仍應仔細閱讀 release notes 與 client compatibility。

## 與你的相關性

依公開技術 Profile，這個專案與 **LLM / Agent** 屬核心相關，因此 `llm_agent` 評為 5。它直接涵蓋 Agent memory、MCP、tool lifecycle、cross-agent handoff、retrieval、memory consolidation 與 runtime reliability，很適合作為長期 Agent infrastructure 的完整案例。

對 **AI R&D** 評為 4。Hybrid retrieval、authority ranking、memory consolidation、decay、session handoff、replay/idempotency 與 prompt-injection boundary 都可以獨立拆成研究或工程評估題目；尤其適合比較「怎樣的記憶才算可靠、可修正、可跨 Agent 使用」。

對 **SillyTavern / AI RPG** 評為 4，但屬架構轉用而非直接整合。`ai-memory` 是 Coding Agent memory，不處理角色卡、世界書或劇情狀態；不過它的 observation → consolidation → wiki、handoff、authority-aware recall、decay 與 untrusted-memory boundary，可以作為長期角色記憶與多 Agent 角色系統的重要對照。

對 **AOI × AI** 評為 1，因為它不處理 computer vision、inspection 或 model inference pipeline；其價值主要位於 Agent coordination 與 knowledge infrastructure。對 **Image Generation** 也評為 1，除非把生成模型包成 Agent tool，否則沒有直接影像生成能力。

整體 `overall` 評為 5，原因不是它對所有公開領域都平均相關，而是它在公開 Profile 中最核心的 LLM／Agent 與 memory infrastructure 交集上，提供了非常完整且可實際運行的系統設計。

## 建議怎麼使用

- `TRY`：先以單一 repository、兩種支援的 Coding Agent 做最小測試。實際完成一段工作、形成 handoff，再切換另一個 Agent，觀察它能否在不重述背景的情況下繼續，這比單看 query demo 更能驗證核心價值。
- `LEARN`：優先閱讀 `docs/ARCHITECTURE.md` 與 managed workstreams、capture policy、security／users、usage 文件。特別值得拆解 source-of-truth 分層、RRF candidate fusion、authority adjustment、SessionEnd/handoff transaction 與 injection trust boundary。
- `REFERENCE`：把它當成「跨 Coding Agent memory Runtime」的架構基準。之後評估其他 Agent memory 專案時，可以比較是否處理了 capture、provenance、handoff、cross-harness identity、retrieval、decay、versioning、current-code authority 與 security，而不只比較向量搜尋品質。

如果只想借用思想而不導入整套 runtime，最值得先抽出的 pattern 是：**Markdown／Git 做 durable knowledge、SQLite 做 derived retrieval index、memory 與 live code intelligence 分流、以及 handoff packet 有明確 delivery／replay semantics**。這四點都可以獨立應用到其他 Agent 系統。

## 與其他收藏的關聯

- [Personal Model](./github-intuition-lab-personal-model.md)：兩者都把長期記憶放到單一 Agent 之外，讓多個 Agent 共用；Personal Model 偏向 owner-level 個人工作活動與 evidence-linked personal context，`ai-memory` 則偏向 repository／workstream 級的 Coding Agent lifecycle、工程決策、handoff 與跨 harness continuity。兩者可視為「個人 context layer」與「專案 execution memory layer」的不同切面。
- [DeepSeek Harness 繁體中文版](./github-g36maid-deepseek-harness.md)：DeepSeek Harness 定義 Agent 內部的 model／tool／session／loop／capability runtime；`ai-memory` 更像可以掛在不同 harness 外側的 durable memory／handoff layer。前者回答「Agent 怎麼執行」，後者回答「換了一個 Agent 之後，歷史工程脈絡怎麼繼續」。
- [A Simple Nest](./github-cynthianani-a-simple-nest.md)：A Simple Nest 從 AI companion 角度整理 memory write／recall／consolidation／decay 與 hybrid retrieval 的設計原則；`ai-memory` 則提供一個面向 Coding Agent、具 lifecycle hooks、Git wiki、SQLite index、handoff 與 multi-harness support 的完整實作。兩張卡很適合拿來比較「角色長期記憶」與「工程 Agent 長期記憶」哪些原理共通、哪些 operational contract 不同。

## 使用者備註

## 更新紀錄

### 2026-08-21

- 重新檢查目前 Repository，依主要交付物正式將 `resource_kind` 分類為 `project`。

### 2026-08-16

- 首次收錄；依 repository metadata、README、Architecture 文件與最新 release 狀態整理跨 Agent handoff、Git wiki source-of-truth、SQLite hybrid retrieval、managed workstreams、memory lifecycle 與安全邊界。
