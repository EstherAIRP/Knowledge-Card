---
schema_version: 1
id: threads-db-fphwgfos-7d09e0
title: DeepSeek Harness：Everything is a Plugin 的 Agent Runtime
canonical_url: https://threads.com/@aiposthub/post/Db_FPHwgfOS
source:
  type: article
  url: https://threads.com/@aiposthub/post/Db_FPHwgfOS
  identity: threads:Db_FPHwgfOS
created_at: 2026-08-14
updated_at: 2026-08-14
last_checked_at: 2026-08-14
summary: 這篇 Threads 串文介紹 DeepSeek Harness v0.1：一套以「Everything is a plugin」為核心的開源 Agent Runtime，將模型介面、Tools、Skills、Session、Sandbox、檔案系統、Agent Loop 與 UI 都視為可替換能力。官方架構以 Cordis 組合 plugin tree，並提供 Web UI；目前仍屬 Developer Preview，適合研究 Agent 架構、做 POC、比較多模型與 Sandbox／權限設計，尚不宜直接視為穩定 production runtime。
classification:
  categories:
    ai:
      - Agent
      - AI Coding / DevTools
      - Infrastructure / Deployment
    user: null
  tags:
    ai:
      - DeepSeek Harness
      - agent-runtime
      - agent-framework
      - plugin-architecture
      - Cordis
      - agent-loop
      - model-adapter
      - tool-registry
      - session-log
      - sandbox
      - multi-model
      - Web UI
      - developer-preview
    user: null
relevance:
  ai:
    overall: 5
    ai_rd: 5
    aoi_ai: 2
    llm_agent: 5
    sillytavern_ai_rpg: 3
    image_gen: 1
  user: {}
actions:
  ai:
    - LEARN
    - BUILD
    - WATCH
    - REFERENCE
  user: null
status:
  ai: watch
  user: null
---

# DeepSeek Harness：Everything is a Plugin 的 Agent Runtime

## 一句話介紹

DeepSeek Harness 是 DeepSeek AI 開源的 Agent Harness／Runtime；這篇串文抓住它最重要的設計：**不是把模型、工具與執行環境寫死在一個 Agent Framework 裡，而是把幾乎整套 Agent Runtime 都拆成可組合、可替換的 plugin。**

## 它解決什麼問題

Agent 系統真正進入工程階段後，瓶頸通常不只在模型本身。模型要完成工作，還需要模型 adapter、工具註冊與權限、Session 記錄、檔案系統、Shell／Sandbox、Agent Loop、狀態管理，以及給人操作與觀察的 UI。若這些能力彼此高度耦合，換模型、換 Sandbox 或替換某個工具層時，往往需要改動整個 Runtime。

串文將 DeepSeek Harness 的價值概括為「Everything is a plugin」：模型、Tools、Skills、Session、Sandbox、檔案系統、Agent Loop 與 UI 都能替換。官方架構文件也進一步確認，model adapter、tool registry、session log、agent loop 本身都掛在 Cordis 的 plugin tree 上，不存在一個必須被直接 patch 的特權核心。

因此它真正想解決的是 **Agent Runtime 的組合性與可替換性**：讓「模型」、「能力」、「執行環境」、「持久化」與「介面」成為可獨立演進的 seam，而不是一個綁死的單體 Agent 應用。

## 核心概念

### 1. Everything is a plugin

DeepSeek Harness 最核心的抽象不是某個特定 Agent Loop，而是 plugin composition。官方架構中，Cordis plugin 可向共享 context 註冊 service、typed event 與 reversible effect；plugin 卸載時，相關註冊也能一併撤銷。

這讓 Harness 更接近一個 **Agent Runtime 組裝層**：同一套高階工作流程下，可以替換模型 adapter、Tools、Sandbox、Session persistence，甚至整個 Agent Loop。

### 2. Profile、Bundle 與可覆寫配置

官方架構把執行中的 `dsh` 視為開機時組合出的 plugin tree。Profile 是一組具名配置，Bundle 則封裝 Cordis config rows 與對應程式碼；多層 patch 依序疊加，讓上層配置能替換下層註冊。

這種設計的重點是：Runtime 不只「支援 plugin」，而是連預設功能本身也用相同機制組裝，因此客製能力與內建能力位於相同抽象層級。

### 3. Session event log 是 Runtime 的事實來源

官方文件將 SessionEvent log 定義成 append-only 的 durable stream。模型真正看到的歷史由 log 投影而來，而 fork、resume、transcript、telemetry 與 persistence 也從同一事件流衍生。

這比單純保存聊天文字更重要：它讓 Agent 執行過程中的 user message、assistant output、tool call／result 等事件具有可重播、可追蹤的基礎。從 Agent 工程角度看，這是 debugging、replay、fork 與 observability 的重要底座。

### 4. Capability seam

官方將可替換能力描述成 seam：由 service definition、provider 與 consumer 三個角色構成。例如 Filesystem、subprocess、Sandbox、LLM adapter 都可以透過介面替換 provider，而上層流程維持不變。

這也是串文所說「保留同一套 Agent 流程，只換模型、工具或 Sandbox 再比較結果」能成立的架構前提。

## 架構與技術

依 Threads 五段正文與 DeepSeek 官方架構文件，可將 DeepSeek Harness 抽象為：

```text
Profile / Bundle / Patch
        ↓
Cordis plugin tree
        ↓
┌──────────────────────────────────────┐
│ Model Adapter / LLM seam             │
│ Tool Registry + Execution Pipeline   │
│ Agent Interface + Agent Loop         │
│ Session Event Log / Persistence      │
│ Filesystem / Shell / Sandbox         │
│ Commands / Jobs / Subagents          │
│ Web UI / Headless runtime            │
└──────────────────────────────────────┘
        ↓
Agent turn / step lifecycle
```

官方文件把一個 `step` 定義為一次模型請求加上該次觸發的工具呼叫；一個 `turn` 可以包含多個 step。流程中會組裝 system prompt 與 tool schema，經過 `agent/pre-step`、模型 streaming、tool execution pipeline，再把 durable event 寫回 Session log。

串文提到可接 DeepSeek、OpenAI、Anthropic 或自訂 Model Gateway；這與官方的 model adapter seam 思路一致，但具體 provider 可用範圍仍應以各版本實際 plugin／文件為準。

Web UI 可透過官方 README 的：

```sh
npx @deepseek-ai/dsh web
```

啟動。串文中的 `npx deepseek-ai/dsh web` 少了 npm scoped package 的 `@`，因此正式使用時應以官方 README 指令為準。

## 主要功能

- **可替換模型層**：透過 LLM adapter seam 更換模型 provider 或自訂 gateway，而不必重寫 Agent Runtime。
- **可組合 Tools／Skills**：模型可用能力經 registry 與 plugin 組合，Tool schema 再進入 prompt assembly。
- **Session 與事件記錄**：以 durable SessionEvent stream 保留模型可見內容與工具執行歷史，支援 resume、fork、transcript 與 replay 類能力的基礎。
- **Sandbox／Filesystem／Shell 抽象**：執行世界可以替換 provider，讓檔案與 subprocess 能一起切換到不同隔離環境。
- **Agent Loop 可替換**：預設 driver 只是某個實作，不是不可修改的核心。
- **Web 與 Headless profile**：官方提供 Web UI，也有 headless runtime 組合方式。
- **可觀察的執行流程**：Agent、Tool、Session、capability 都有事件 extension point，便於攔截、驗證、記錄與擴充。

## 技術亮點

第一個亮點是 **把 Harness 從「Agent 外殼」提升為可組合 Runtime**。不少 Agent Framework 可以換模型或新增 Tools，但 DeepSeek Harness 的設計更進一步：session log、loop、sandbox、UI 也落在 plugin model 中。這讓它適合研究 Agent infrastructure，而不只是拿來做單一聊天 Agent。

第二個亮點是 **event-sourced Session 思路**。官方明確要求 model-visible input 必須可由 log 重建，讓執行歷史成為可以 replay、fork 與驗證的 durable state。這對長任務 Agent 很重要，因為單靠目前 prompt 很難回答「Agent 為什麼走到這一步」。

第三個亮點是 **Capability seam 與 execution world 的解耦**。例如 Filesystem 與 subprocess 可以共享同一執行世界，當 provider 指向 remote sandbox 時，Bash、PTY、LSP 等能力可一起搬移，而不需要在每個 consumer 各自實作一套 remote 版本。

第四個亮點是 **plugin lifecycle 本身具可逆性**。Cordis 把註冊視為 effect，plugin 卸載時可以 unwind，對動態組合、測試不同 runtime configuration，以及長時間運行的 Agent 系統都比一次性初始化更有工程彈性。

## 限制與風險

目前最重要的限制是成熟度。DeepSeek 官方 README 明確標示 **Developer Preview**，並警告後續會有 compatibility-breaking changes。因此這張 Card 的狀態設為 `watch`：架構非常值得研究，但不應把目前 API／configuration 視為穩定長期介面。

第二個風險來自 Agent 的實際執行能力。串文提到 Workspace 內可讀檔、改檔與執行命令；官方架構也包含 filesystem、subprocess、shell、sandbox 與 guarded tool execution。這類 Runtime 若接上高權限本機環境，錯誤 tool call、prompt injection、權限配置不當都可能造成實際副作用。Production 使用時應採最小權限、Sandbox、approval policy、audit log 與明確的 credential boundary。

第三，plugin 化降低耦合，但同時把複雜度轉移到 configuration、dependency lifecycle 與 extension contract。當 plugin 數量變多，debugging 的問題可能從「哪段程式錯了」變成「哪一層 bundle／patch／provider 組合造成行為」。因此可觀察性與配置檢查會成為重要能力。

最後，Threads 串文屬二次技術整理。這張 Card 以完整五段串文作為收錄來源，但對 CLI、Developer Preview、MIT License 與 Cordis 架構等關鍵技術事實，另以 DeepSeek 官方 repository 文件交叉確認；後續版本變化仍應回到官方文件重新檢查。

## 與你的相關性

依公開技術 Profile，這個來源對 **AI R&D** 與 **LLM / Agent** 都是核心相關。它提供的不是單一模型技巧，而是 Agent 系統工程中更上層的 Runtime 設計：模型 adapter、tool execution、session state、sandbox、事件生命週期與 UI 如何被拆成可替換的組件。

對 **AOI × AI** 的直接相關性較低，但若未來把具 Tool-use 能力的 Agent 放入資料分析、模型測試或自動化工程流程，Harness 類架構可作為「如何把模型、腳本、檔案系統與隔離執行環境組合起來」的基礎參考，因此不是完全無關。

對 **SillyTavern / AI RPG** 則有中度架構價值：它不是角色扮演產品，但可替換 Session、Agent Loop、Tools 與 persistence 的模式，對長期角色 Runtime、外部工具與多模型 orchestrator 的設計具有借鑑意義。

Image Generation 並非此專案重點，因此該維度維持低分。

## 建議怎麼使用

- **LEARN**：優先讀官方 `architecture.md`，尤其是 Cordis plugin tree、Session log、capability seam 與 turn／step lifecycle。這些比單純跑起 Web UI 更有長期技術價值。
- **BUILD**：適合用小型 POC 測試「同一工作流程只替換 model adapter、tool provider 或 sandbox」是否真的能降低 Agent 實驗成本。
- **WATCH**：Developer Preview 階段仍可能頻繁 breaking change，應追蹤架構與 configuration contract 穩定度，再決定是否放進長期 production dependency。
- **REFERENCE**：把它與其他 coding-agent workspace、memory runtime、tool orchestration framework 比較，特別觀察它把 session log 與 execution seam 放在 Runtime 核心的做法。

若要實際試用，建議先在低權限、可丟棄的 Workspace／Sandbox 內跑，不要一開始就讓 Agent 接觸重要 repository、credential 或正式環境。

## 與其他收藏的關聯

- [Orca](./github-stablyai-orca.md)：Orca 比較偏「多個 coding agents 如何在同一 Agent Development Environment 中平行工作與管理 Git worktree」；DeepSeek Harness 則更底層，關注一個 Agent Runtime 的 model、tool、session、loop、sandbox 如何被組裝與替換。兩者可以分別視為 workspace orchestration 與 runtime composition 的不同層次。
- [Personal Model](./github-intuition-lab-personal-model.md)：Personal Model 聚焦跨 Agent 的長期記憶、provenance 與可修正 state；DeepSeek Harness 的 SessionEvent log 聚焦執行中的 durable runtime history。兩者共同指向 Agent 系統需要把「模型當下 prompt」之外的狀態做成正式基礎設施。

## 使用者備註


## 更新紀錄

### 2026-08-14

- 首次收錄。
- Threads share URL 解析至 root `Db_FPHwgfOS`，source identity 為 `threads:Db_FPHwgfOS`。
- Phase 7 以 `INFERRED_THREAD_HIGH_CONFIDENCE` / `llm_assisted` recovery 重建完整五段正文，納入四則發布後 4、7、10、14 秒的同作者 continuation replies，未將較早的同作者獨立貼文或其他作者推薦內容混入正文。
- 正式分析以完整五段 `source_document.combined_text` 為主要 Threads 證據，並以 DeepSeek 官方 README／architecture 文件交叉確認 Developer Preview、MIT License、Cordis 與正確 Web UI 啟動指令。
