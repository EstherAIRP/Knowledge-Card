---
schema_version: 1
id: github-intuition-lab-personal-model
title: Personal Model
canonical_url: https://github.com/Intuition-Lab/personal-model
source:
  type: github
  url: https://github.com/Intuition-Lab/personal-model
  identity: github:intuition-lab/personal-model
created_at: 2026-08-11
updated_at: 2026-08-11
last_checked_at: 2026-08-11
summary: Personal Model 是一套 local-first、以證據來源為核心的長期記憶 Runtime，將 macOS 上經授權的工作活動整理成可檢查、修正與匯出的個人模型，並透過 MCP 供 Codex、Claude Code、Cursor Agent 等可信任 AI client 共用。
classification:
  categories:
    ai:
      - Agent
      - RAG / Memory / Knowledge
      - AI Coding / DevTools
    user: null
  tags:
    ai:
      - local-first
      - agent-memory
      - personal-ai
      - mcp
      - provenance
      - long-term-memory
      - human-md
      - coding-agent
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

# Personal Model

## 一句話介紹

Personal Model 是 Intuition Lab 開源的 local-first 個人 AI 長期記憶 Runtime。它將使用者在 macOS 上經授權蒐集到的工作活動轉換成具證據鏈的個人模型，並透過 MCP 提供給 Codex、Claude Code、Cursor Agent 等可信任 client 使用。

## 它解決什麼問題

Coding Agent 通常各自擁有 session context，跨工具或跨工作階段後，很難維持「這個人現在在做什麼、偏好如何決策、先前工作留下哪些未完成線索」等長期脈絡。單純保存聊天紀錄又容易把摘要與事實混在一起，缺乏可追溯的證據。

Personal Model 的切入點不是建立另一套聊天歷史，而是建立一個由使用者持有的 context layer：從實際活動形成記憶，保留來源 receipt，允許後續證據修正早期推論，再讓多個 Agent 共用同一份模型。

## 核心概念

專案把個人模型描述成一個逐層形成的結構：`Point → Line → Face → Volume → Root`。

- **Point**：具有來源的觀察或事件。
- **Line**：事件之間的關係或時間變化。
- **Face**：由多個相關證據支持的模式。
- **Volume**：跨專案或生活領域的高階結構。
- **Root**：目前整合後的個人模型。

`HUMAN.md` 是這份模型的人類可讀投影，但真正的 machine contract 仍是版本化 JSON snapshot。這個區分值得注意：人類閱讀格式不直接成為唯一資料真相，降低 Markdown 表述格式綁死底層模型的風險。

另一個核心是 **evidence-linked memory**。重要模型物件可以回溯 receipt；新證據可以加強、修改或推翻較早的 inference，而不是讓 AI 產生的舊摘要永久變成不可追查的事實。

## 架構與技術

專案主要以 Python 實作，採 owner-local macOS Runtime。來源架構文件描述的主要資料流為：

```text
macOS AX watcher / optional local OCR / trusted ingest / mobile bridge
                              ↓
                       capture buffer
                              ↓
                    one-minute timeline blocks
                              ↓
                           sessions
                              ↓
                    five-minute reducer
                              ↓
                        event memory
                              ↓
                 incremental memory delta
                              ↓
              Points / Lines / Faces / Volumes / Root
                              ↓
                 snapshot / MCP / local viewer
```

Daemon mode 以 macOS Accessibility 為主要訊號；當應用程式沒有足夠 AX text 時，可依政策使用隔離的本機 OCR fallback。另一種 ingest mode 則允許可信任且經 bearer authentication 的 producer 提供 capture，兩種路徑在後續 state formation 前匯合。

儲存預設位於 `~/.persome`。架構文件列出的主要 artifact 包括 Markdown memory、`index.db`、model build manifest、`HUMAN.md` 與 redacted export。`index.db` 使用 SQLite WAL，涵蓋 FTS5、model/provenance、session 與 vector 資料。Markdown 仍是預設 write authority，`HUMAN.md` 則是由有效模型 deterministic render 出來的人類閱讀版本。

模型建構由 `ModelBuildCoordinator` 協調，依序處理 state formation、baseline/backfill、entity/relation enrichment、不同層級的 schema synthesis，以及 vector backfill。缺少模型幾何結構時會標記 degraded，而不是以空結果覆蓋既有有效 Root。

LLM 對基本 collection 與 BM25 recall 並非必需，但 semantic modeling 需要模型能力。專案允許設定 hosted/local provider，也提供顯式授權 coding-agent subscription 給背景 Runtime 使用的路徑。

## 主要功能

- 建立跨 Coding Agent 共用的 owner-local 長期記憶。
- 支援 Codex CLI／IDE、Claude Code、Cursor Agent、Claude Desktop、opencode 與其他相容 MCP client。
- 從經授權的 macOS 工作活動建立 context，而非只依賴聊天紀錄。
- 以 receipt 與 provenance 支援 evidence-grounded retrieval。
- 允許檢查、修正、匯出與刪除個人模型資料。
- 提供 CLI、MCP、local REST/viewer 與版本化 snapshot 等多種介面。
- 以 BM25／FTS5 與 semantic modeling 支援不同層次的 retrieval 與模型建構。

## 技術亮點

第一個值得研究的是 **記憶與證據分離**。模型不是只儲存「AI 認為使用者是怎樣的人」，而是保留形成該結論的 evidence provenance，讓個人模型具備可追查與可修正能力。對長期 Agent memory 而言，這比無限累積聊天摘要更可靠。

第二個亮點是 **跨 Agent 的 owner-owned context layer**。Codex、Claude Code 或其他 MCP client 不需要各自維護完全獨立的使用者模型，而可以共享同一個本機 Runtime；Agent 本身負責任務選擇與執行，Personal Model 專注提供 context，職責邊界相對清楚。

第三個亮點是 **分層 state formation**。從 capture、timeline、session、event memory 到 Point／Line／Face／Volume／Root，將原始觀察與高階推論分成多個 stage，也為重跑、降級、證據更新與未來 evaluation 留下較清楚的觀測點。

第四個亮點是 public human view 與 machine representation 的分離。`HUMAN.md` 很適合 Agent／人類閱讀，但 JSON snapshot 才是 machine contract，可以避免知識系統完全受自然語言文件格式支配。

## 限制與風險

目前原生 activity capture 的主要平台是 macOS；架構文件指出 storage、model projection 與部分 offline tests 可以在 Linux 執行，但若希望直接取得相同的桌面活動捕捉體驗，平台限制需要先接受。

這套系統本質上處理高度敏感的個人活動資料。即使採 local-first，MCP client 一旦獲得 Personal Model 存取能力，就相當於取得個人資料 capability，因此 client trust、macOS permission、localhost 暴露方式與 export policy 都需要被視為安全邊界，而不是單純的安裝設定。

Semantic model quality 仍依賴 LLM provider、累積資料品質與模型形成流程。專案本身也明確區分 operational expectation 與 benchmark claim，因此不應把「能建立 Root」直接解讀成已證明個人化品質或長期記憶準確率。

此外，它是一套完整 Runtime，而不是輕量 memory library。若只需要為單一聊天角色保存數十條記憶，直接導入完整 capture、state formation、SQLite／vector、MCP 與模型建構鏈可能過重；更適合研究其架構，或用在需要跨 Agent、跨工作階段且重視 provenance 的情境。

## 與你的相關性

依公開技術 Profile，此專案與 **LLM / Agent** 的相關性最高。它直接提供 Agent memory、MCP context sharing、provenance、retrieval 與持續 state formation 的完整案例，適合作為 Agent infrastructure 的實作參考。

對 **AI R&D** 也具有高研究價值，尤其是 evidence-linked memory、分層個人模型、增量更新、degraded state 防護與 deterministic projection 等設計，都可以拆成獨立研究問題與工程 pattern。

對 **SillyTavern / AI RPG** 的相關性屬高但不是直接整合。Personal Model 是為個人工作 context 與 Coding Agent 設計，而不是角色扮演記憶系統；不過「Observation → evidence → pattern → higher-order model」以及可修正推論的概念，很適合拿來比較角色長期記憶應該如何避免摘要漂移與錯誤自我強化。

對 **AOI × AI** 與 **Image Generation** 則沒有直接應用價值，主要仍是 Agent／memory infrastructure 層面的參考。

## 建議怎麼使用

- **TRY**：若使用 macOS 且已有 Codex、Claude Code 或其他 MCP client，可直接體驗它如何把同一份個人 context 暴露給不同 Agent，實際觀察 retrieval 與 evidence receipt 的使用方式。
- **LEARN**：優先研究 `ARCHITECTURE.md` 的 state formation pipeline、Point／Line／Face／Volume／Root 模型，以及 correction/provenance 邊界。這些設計比單純安裝工具更有長期價值。
- **REFERENCE**：把它當成「Personal Agent Memory」架構基準。未來評估其他 memory framework 時，可以比較是否具備 source identity、evidence、correction、ownership、cross-agent access 與 machine/human projection 分離。

目前不直接標記 `INTEGRATE`：公開 Profile 雖顯示高度 Agent 興趣，但沒有足夠公開資訊證明現有系統需要直接導入這套 macOS Runtime；先試用與拆解架構較合理。

## 與其他收藏的關聯

目前 Knowledge Base 尚未有其他正式 Knowledge Card，因此暫不建立不存在的關聯連結。後續若收錄其他 Agent memory、personal AI、RAG 或 knowledge lifecycle 專案，再由共同 Tag 與架構關係補上連結。

## 使用者備註


## 更新紀錄

### 2026-08-11

- 首次收錄。
- 依 repository README、Runtime architecture 與公開 repository metadata 建立第一張正式 Knowledge Card。
