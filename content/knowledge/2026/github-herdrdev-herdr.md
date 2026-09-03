---
schema_version: 1
id: github-herdrdev-herdr
title: Herdr
canonical_url: https://github.com/herdrdev/herdr
source:
  type: github
  url: https://github.com/herdrdev/herdr
  identity: github:herdrdev/herdr
resource_kind:
  ai: project
  user: null
created_at: 2026-09-03
updated_at: 2026-09-03
last_checked_at: 2026-09-03
summary: Herdr 是面向 AI coding agents 的持久化終端工作區與執行環境。它以背景伺服器持有終端工作階段，支援重新連線、Agent 狀態辨識、CLI／socket 控制、遠端附加與外掛，讓多個 coding agents 能在既有終端工具鏈中持續執行與協作。
classification:
  categories:
    ai:
      - Agent
      - AI Coding / DevTools
      - Infrastructure / Deployment
    user: null
  tags:
    ai:
      - coding-agent-runtime
      - terminal-multiplexer
      - agent-orchestration
      - agent-state-detection
      - persistent-session
      - terminal-ui
      - Rust
      - PTY
      - IPC
      - remote-session
      - plugin-system
    user: null
relevance:
  ai:
    overall: 5
    ai_rd: 4
    aoi_ai: 2
    llm_agent: 5
    sillytavern_ai_rpg: 2
    image_gen: 1
  user: {}
actions:
  ai:
    - TRY
    - INTEGRATE
    - LEARN
  user: null
status:
  ai: active
  user: null
---

# Herdr

## 一句話介紹

Herdr 是專為 AI coding agents 設計的持久化終端工作區與執行環境：它不是取代 Claude Code、Codex、Cursor、OpenCode 等 Agent，而是接管它們所在的終端、工作階段與操作介面，讓 Agent 可以持續執行、被重新連線、被辨識狀態，並由人或其他 Agent 透過 CLI 與 socket API 控制。

## 它解決什麼問題

長時間執行 coding agent 時，問題往往不只在模型能力，而在執行環境本身：終端視窗關閉、網路中斷、主機重新連線、多個 Agent 分散在不同 pane、某個 Agent 卡在確認畫面卻沒被注意，以及不同 Agent 之間缺少穩定的協調介面。

Herdr 把這些問題放到「終端 runtime」層處理。背景伺服器持有 terminal session，使用者可以 detach 後再 attach；同一個工作區中的 pane 會被持續管理，而 Herdr 也會辨識其中的 coding agent 是否為 `working`、`blocked`、`idle`、`done` 或 `unknown`。這使它同時具有 terminal multiplexer 與 Agent control plane 的性質。

## 核心概念

- **終端與前端分離**：工作階段由背景伺服器持有，不依賴目前開啟的某個終端視窗。關閉客戶端、暫時斷線或重新附加時，pane 內程序仍可持續存在。
- **Agent-aware terminal multiplexer**：Herdr 不只管理 workspace、tab、pane，也會辨識 pane 內正在執行的 coding agent 與生命週期狀態。
- **不包裝模型本身**：它刻意不取代既有 Agent CLI，而是讓 Claude Code、Codex、Cursor、OpenCode、Grok 等既有工具繼續在原生終端中運作。
- **可程式化控制面**：CLI 與 socket API 可建立 pane、啟動 Agent、送出 prompt、讀取輸出、等待狀態變化，讓其他 Agent 也能操作 Herdr。
- **人機共用同一個工作區**：tmux 類型的鍵盤操作、滑鼠拖曳與分割，以及 Agent 專用 CLI 都是同一套 runtime 的不同入口。

## 架構與技術

Herdr 的主要交付物是一個 Rust 專案，而不是單獨的 Agent Skill。專案目前使用 Rust 2021 edition，核心依賴包含 `ratatui`、`crossterm`、`portable-pty`、`tokio` 與 `interprocess`，對應到終端介面、PTY、非同步執行與跨程序通訊等需求。

從公開程式結構與文件可看出幾個主要層次：

- **背景 server／session 層**：持有 pane 與終端程序，讓工作階段可以脫離目前的互動式客戶端持續存在。
- **TUI／client 層**：提供 workspace、tab、pane 的互動式介面，支援鍵盤與滑鼠操作。
- **CLI／socket API 層**：提供機器可讀取與可控制的介面，讓腳本或 Agent 能操作目前 session。
- **Agent detection／integration 層**：辨識不同 coding agent、判斷生命週期狀態，並處理原生 session restore 等整合。
- **PTY 與輸入輸出層**：保存實際終端程序、畫面與 recent output，讓 CLI 可以讀取 pane 內容或等待特定輸出。
- **外掛與整合層**：提供 plugin marketplace 與 integrations，擴充 pane 與工作流程。

Repository 也內附 `skills/herdr/SKILL.md`，讓支援 Agent Skill 的 runtime 學會如何安全操作 Herdr。不過這個 Skill 是控制 Herdr 的附屬介面；整個 Repository 的主要產品仍是 terminal runtime／workspace manager，因此 `resource_kind` 判定為 `project`。

## 主要功能

- **持久化工作階段**：Herdr 以背景伺服器持有終端。使用者可 detach，再從另一個 terminal 或透過 SSH 重新 attach。
- **多 pane 工作區管理**：提供 workspace、tab、pane，以及分割、移動、重新命名、resize、copy mode 等 terminal multiplexer 能力。
- **Agent 狀態辨識**：針對支援的 coding agents 判斷 `working`、`blocked`、`idle`、`done`、`unknown` 等狀態，協助找出真正需要人工回應的 pane。
- **Agent 控制介面**：可從 CLI 啟動 Agent、傳送 prompt、讀取結果、送出按鍵並等待生命週期狀態變化。
- **一般程序控制**：即使 pane 內不是 Agent，也能執行命令、讀取輸出與等待特定文字或正規表示式出現。
- **遠端使用**：支援遠端附加；0.8.2 也已把 Windows 支援推進到穩定發布，並支援 Windows client 連線到 Linux／macOS server。
- **外掛系統**：可擴充 pane 與 workflow，並提供 plugin marketplace。
- **多 Agent 相容**：官方文件與變更紀錄持續加入 Claude Code、Codex、OpenCode、Qwen Code、Grok CLI 等 Agent 的狀態偵測或 session 整合。

## 技術亮點

### 1. 把 Agent orchestration 下沉到終端 runtime

Herdr 最有辨識度的地方不是再做一層高階 Agent framework，而是利用「每個 coding agent 最終都活在 terminal／PTY 裡」這件事，把協調層建立在終端之上。這讓它能保留各 Agent 原生 UI、原生參數與既有工作流程，同時提供共同的管理介面。

### 2. 生命週期狀態是可操作資訊

`blocked`、`working`、`idle`、`done`、`unknown` 不只是視覺標記。CLI 可以等待指定狀態，Agent Skill 也把「先確認是否 blocked，再決定是否送 input」寫成操作規則。這使 terminal 狀態從純顯示資訊變成可被 workflow 使用的同步原語。

### 3. 同時服務人與 Agent

一般 terminal multiplexer 主要是給人操作；Herdr 另外提供 JSON CLI、socket API、穩定 ID 與 Agent Skill，使 Agent 可以理解 workspace topology、控制其他 pane，甚至啟動另一個 Agent。這種「人類 TUI + Agent control surface」的雙介面設計很值得研究。

### 4. 不綁定單一模型供應商

Herdr 的抽象層是 terminal、process 與 agent lifecycle，而不是特定模型 API。這降低了對單一 coding agent 的綁定，也讓它可以隨不同 Agent CLI 演進逐步新增偵測器與整合。

## 限制與風險

- **仍是 0.x 版本**：目前 Cargo 版本為 0.8.2。專案更新非常活躍，但 CLI、偵測行為、設定與整合仍可能快速變動，導入自動化前應鎖定版本並閱讀 changelog。
- **Agent 狀態偵測需要持續維護**：不同 Agent 的 TUI、終端標題、確認畫面與 process tree 都可能改版，因此 `blocked`／`idle` 等狀態並非通用協定，而需要針對各 Agent 維護偵測邏輯。`unknown` 也不能被當成「已完成」。
- **它不是安全沙箱**：Herdr 管理的是終端與程序，不會自動降低底層 coding agent 的檔案、shell、網路或憑證權限。多 Agent 協作仍需要另外處理工作目錄、worktree、權限與審核邊界。
- **自動送入終端的控制面需要謹慎使用**：CLI／socket API 能操作 pane、送出文字與按鍵，因此自動化時必須明確指定目標 pane／Agent，避免依賴另一個 client 的 focus 狀態。官方 Skill 也特別要求使用 `--current`、明確 pane ID 或唯一 Agent 名稱。
- **不是模型層的 Agent framework**：Herdr 不負責規劃、記憶、工具選擇或模型路由。若需要完整 multi-agent workflow，仍要由上層 Agent 系統負責；Herdr 更接近可靠的執行與協調基礎設施。

## 與你的相關性

依公開技術背景來看，Herdr 對 **LLM／Agent** 與 **AI R&D** 的相關性很高。它直接處理 coding agents 的執行生命週期、可觀測性與多 Agent 協調，適合作為研究 Agent runtime、tool use 與 orchestration 時的實作參考。

對 **AOI × AI** 的直接關聯較弱，但如果 AI 工程工作包含長時間執行的 coding agent、測試、資料處理或多終端開發流程，Herdr 可作為工程環境層的輔助工具。它與 SillyTavern／AI RPG 或影像生成本身沒有直接功能重疊，因此這些面向的分數較低。

## 建議怎麼使用

- **TRY**：先以一個實際 coding agent session 體驗 detach／reattach、pane 狀態與 `agent list`／`agent prompt` 等操作，最容易判斷它是否比一般 tmux 流程更適合 Agent 工作。
- **INTEGRATE**：如果已有以 CLI coding agents 為核心的工作流程，可評估把 Herdr 當成持久化執行層與共用 control plane，而不是重新包裝每個 Agent。
- **LEARN**：特別值得研究它如何從 PTY／process／terminal UI 推導 Agent lifecycle，以及如何設計能同時給人與 Agent 操作的 terminal runtime。

若要正式導入自動化，建議先把「pane／Agent 身分解析、blocked 狀態、權限邊界、失敗恢復」當成主要驗證項目，而不是只測試能否啟動多個 Agent。

## 與其他收藏的關聯

目前未建立直接關聯連結。後續若收藏其他 coding agent orchestration、terminal multiplexer、Agent runtime 或多 Agent execution 專案，可把 Herdr 作為「終端執行層」進行比較。

## 使用者備註


## 更新紀錄

### 2026-09-03

- 建立 Herdr Knowledge Card；依目前 Repository、README、Cargo 設定、Agent Skill 與 changelog 分析其 terminal runtime、Agent 狀態偵測與協調架構。
