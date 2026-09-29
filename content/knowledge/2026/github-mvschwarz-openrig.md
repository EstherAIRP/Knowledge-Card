---
schema_version: 1
id: github-mvschwarz-openrig
title: OpenRig
canonical_url: https://github.com/mvschwarz/openrig
source:
  type: github
  url: https://github.com/mvschwarz/openrig
  identity: github:mvschwarz/openrig
resource_kind:
  ai: project
  user: null
navigation:
  categories:
    ai:
      - Agent / Harness
      - AI Coding / DevTools
    user: null
created_at: 2026-09-29
updated_at: 2026-09-29
last_checked_at: 2026-09-29
summary: OpenRig 是一套本地執行的多代理程式開發 Harness，將 Claude Code、Codex 等工作階段組成可宣告、可觀察、可通訊與可恢復的團隊拓樸，並以 tmux、CLI／TUI、MCP、SQLite 與本地 daemon 管理代理生命週期、角色身分、權限策略與工作空間。
classification:
  categories:
    ai:
      - Agent
      - AI Coding / DevTools
      - Infrastructure / Deployment
    user: null
  tags:
    ai:
      - OpenRig
      - multi-agent-harness
      - coding-agent-orchestration
      - Claude-Code
      - Codex
      - tmux
      - RigSpec
      - AgentSpec
      - MCP
      - SQLite
      - Hono
      - agent-topology
      - session-recovery
      - permission-policy
    user: null
relevance:
  ai:
    overall: 5
    ai_rd: 4
    aoi_ai: 1
    llm_agent: 5
    sillytavern_ai_rpg: 2
    image_gen: 1
  user: {}
actions:
  ai:
    - LEARN
    - TRY
    - REFERENCE
  user: null
status:
  ai: active
  user: null
---

# OpenRig

## 一句話介紹

OpenRig 是一套開源、本地執行的多代理 Harness：它不取代 Claude Code、Codex 等程式開發代理（Coding Agent），而是管理這些代理組成的「團隊系統」，把工作階段、角色、拓樸、通訊、恢復、權限與工作空間納入同一個控制層。

## 它解決什麼問題

同時開多個程式開發代理時，真正困難的往往不是「再啟動一個代理」，而是如何知道每個工作階段在做什麼、彼此如何協作、哪個角色應該接手、重新開機後如何恢復，以及如何避免大量終端機逐漸失控。

OpenRig 將這些問題抽象成可管理的 Harness。使用者可以用 YAML 宣告團隊拓樸，由 OpenRig 建立與維護 tmux 工作階段、穩定角色身分與代理間連線，再透過 CLI、TUI 或 MCP 觀察與操作整個系統。這使它更接近「程式開發代理的本地控制平面」，而不是單一 Agent 的外掛。

## 核心概念

### 1. RigSpec：把多代理團隊變成可宣告拓樸

`RigSpec` 使用 YAML 描述一個 Rig 的 Pods、成員、連線與延續策略。團隊配置因此不再只是人工開出的多個終端機，而是可重建、可版本化的結構。

### 2. Seat：角色身分與對話工作階段分離

`Seat` 是穩定角色與位址，例如某個開發、審查或研究角色。實際佔據 Seat 的對話工作階段可以更換，但角色身分與被投射進去的指引仍可維持。這個抽象讓「誰負責什麼」不必綁死在單一模型會話。

### 3. Pod：共享任務脈絡，但不共享上下文視窗

相關 Seat 可以被組成 Pod，共享團隊層級的指引與脈絡；每個代理仍然保有自己的上下文視窗（Context Window）。這種設計把「團隊共享背景」與「個別模型上下文」拆開管理。

### 4. Snapshot／Restore：把代理拓樸視為可恢復狀態

`rig down --snapshot` 可以保存拓樸狀態，之後再由 `rig up <name>` 恢復。恢復結果會區分 resumed、fresh 或 failed，而不是把所有節點都假設成能完整接續。

### 5. Discovery／Adoption：既有工作階段也能納管

OpenRig 可以辨識已存在於 tmux 中的 Claude Code／Codex 工作階段，再透過 `rig adopt` 納入管理，降低「只有由 OpenRig 啟動才算 Harness」的限制。

## 架構與技術

OpenRig 採本地控制平面架構：

```text
CLI / TUI / MCP
      |
Hono HTTP daemon
      |
  Domain services
      |
  SQLite + tmux + runtime adapters
```

專案本身是 TypeScript monorepo，主要 workspace 包含 daemon、CLI、TUI 與舊版 Web UI。daemon 使用 Hono、`better-sqlite3`、YAML／TOML 等元件；CLI 另外整合 Model Context Protocol（MCP）SDK，讓 Agent 也能透過工具呼叫管理 Rig。

執行層目前主要支援原生 Claude Code、Codex 工作階段，以及透過終端 RPC runner 連接的 Pi adapter。tmux 是底層工作階段基礎；herdr 與 cmux 可作為選用的多終端工作空間介面。舊版 React Web UI 仍保留，但官方已標示為維護模式。

截至 2026-09-29，根目錄套件版本與最新 GitHub Release 都是 `0.6.1`。目前支援 Node.js 22／24、macOS 與 Linux；原生 Windows 尚未支援，WSL2 也尚未經官方測試。

## 主要功能

- **宣告式多代理拓樸**：以 RigSpec 定義 Pods、Seats、連線與延續策略。
- **一次啟動整個團隊**：`rig up` 建立 tmux 工作階段、Harness、啟動檔與就緒檢查。
- **觀察與操作**：TUI 提供拓樸表格、圖形、Seat 詳情、專案、Specs、Feed 與系統健康狀態。
- **代理間通訊**：`rig send`、`rig broadcast`、`rig chatroom` 支援定向、廣播與聊天室式訊息交換。
- **工作階段納管**：可發現既有 Claude Code／Codex tmux 工作階段，再加入 Rig。
- **拓樸動態調整**：`rig grow`、`rig shrink`、`rig launch`、`rig remove` 可修改正在運作的團隊。
- **Snapshot／Restore**：保存並重新建立代理拓樸與個別節點狀態。
- **MCP 控制介面**：讓代理自己呼叫 `rig_up`、`rig_ps`、`rig_send` 等工具管理團隊。
- **權限與輸入保護**：可設定 Seat 的權限模式；`typing guard` 可避免自動訊息直接打進人工正在操作的 Seat。
- **外部協作與服務型 Rig**：提供 Slack 連接能力，並示範由專門代理管理 HashiCorp Vault 等服務。

## 技術亮點

### Harness 與代理明確分層

OpenRig 最重要的設計不是「更多代理」，而是把代理執行環境上方再加一層可觀察、可恢復、可尋址的協作系統。這讓多代理工程問題從提示詞設計延伸到生命週期、拓樸、權限、訊息路由與持久化。

### 穩定 Seat 身分降低工作階段耦合

將角色身分從實際聊天工作階段抽離，是一個很值得參考的 Harness 設計。對上層流程而言，訊息可以送往穩定 Seat，而不必把整個系統綁死在某一個 Claude Code 或 Codex 原生工作階段 ID。

### Claude Code 與 Codex 可以存在於同一個團隊

OpenRig 將不同程式開發代理執行環境（Runtime）放在同一個拓樸與控制平面中。這比「同一模型開很多子代理（Sub-agent）」更接近異質代理編排：角色、執行環境與權限可以分開選擇。

### 將權限策略納入 Harness

OpenRig 不只負責啟動工作階段，也管理 Claude Code／Codex 的信任設定、hooks、工作空間權限與不同 Seat 的 `permission mode`。這代表 Harness 的責任範圍已從「程序管理」延伸到「代理執行邊界管理」。

### 上下文與操作事件可被集中觀察

OpenRig 會收集工作階段身分、上下文／Token 使用量與部分供應商用量資訊，並透過本地 daemon 整合成可觀察狀態。這讓多代理系統不再只剩「每個終端機自己看自己」。

## 限制與風險

### 仍處於早期版本

截至 2026-09-29 最新版本為 `0.6.1`。專案更新活躍，但版本仍早，部分功能也明確標為實驗性，例如 Slack app manifest／setup assistance 與 Rig Stream classification。正式導入前應以實際版本文件與 Release Notes 為準。

### 會修改本機代理設定與信任狀態

OpenRig 不只是旁路監控工具。daemon 與受管啟動流程（managed startup）會寫入 `~/.claude`、`~/.codex`、工作空間設定、trust records、hooks，也可能修改 `~/.tmux.conf`；選用資源還可能加入 MCP 設定。這些變更會直接影響程式開發代理的執行行為。

README 也明確提醒，部分寫入器在遇到無法解析的設定時可能以空物件恢復，並不保證能完整回復。第一次使用前應備份相關設定檔。

### 權限選擇不等於原生執行環境已被完整驗證

OpenRig 可以記錄與套用 Seat 的 `permission mode`，但官方文件明確區分「期望的選擇」與「最後一次啟動參數」；這些狀態本身不能證明底層代理執行環境已按預期強制執行所有權限限制。

此外，雖然 YOLO／full bypass 預設關閉，但使用者仍可以明確選擇 Claude 的 `--dangerously-skip-permissions` 或 Codex 的 full-access 模式。Harness 能提供控制入口，並不能消除高權限模式本身的風險。

### 平台與部署範圍有限

目前主要面向可信任的本地／私人環境，不宣稱適合經安全強化的公開網路部署。原生 Windows 尚未支援，WSL2 未經官方測試；部分服務型 Rig 另需要 Docker。

### Harness 會增加系統複雜度

若只使用一到兩個短生命週期代理，OpenRig 的 daemon、tmux、SQLite、拓樸、hooks 與策略可能比直接使用原生 CLI 更複雜。它的價值主要在「多工作階段開始需要協調、持久化與觀察」之後才會顯著出現。

## 與你的相關性

依公開技術 Profile，OpenRig 對 **LLM／Agent** 與 **AI R&D** 的相關性很高。

對代理領域而言，它提供一個相當完整的 Harness 實例，可直接研究多代理拓樸、角色身分、生命週期、工作階段恢復、訊息路由、權限策略與可觀察性如何被放進同一個本地控制平面。這些設計比單純的提示詞／子代理編排更接近「代理系統工程」。

對 AI R&D 而言，它也適合作為管理多個實驗型程式開發代理工作階段的架構參考，尤其是異質執行環境、上下文使用監測與可恢復工作流程。相較之下，它與 AOI × AI、影像生成沒有直接技術耦合，因此這兩個維度的分數較低。

## 建議怎麼使用

### LEARN：優先研究它如何定義 Harness 邊界

最值得先看的不是指令清單，而是 RigSpec、AgentSpec、Seat／Pod、Snapshot／Restore、權限策略與上下文蒐集。這些元件共同回答「多個程式開發代理何時從一堆工作階段變成一個可管理系統」。

### TRY：用最小入門 Rig 實際觀察多代理生命週期

若要體驗，建議先從官方 `first-project` 或較小型的 `conveyor` 入門範例開始，而不是直接啟動大型 `product-team` 範例。先觀察 Seat 身分、訊息傳遞、Snapshot／Restore 與 TUI，再決定是否需要更複雜的拓樸。

第一次測試宜放在可回復的開發環境，先備份 `~/.claude`、`~/.codex` 與相關工作空間設定，並優先使用較保守的 `permission mode`。`rig setup --dry-run` 可以預覽安裝設定階段的部分動作，但官方也明確說明它不會涵蓋所有後續 daemon／啟動流程寫入，因此仍不能視為完整變更預覽。

### REFERENCE：作為代理 Harness 設計案例

即使不直接採用 OpenRig，它的 Seat、RigSpec、跨執行環境、權限模式與本地控制平面都適合作為代理 Harness 架構比較基準。尤其值得用來區分「代理本身的能力」與「Harness 提供的環境、治理、恢復與協作能力」。

## 與其他收藏的關聯

目前不建立具名 Knowledge Card 連結；只有在 Repository 中確認存在對應卡片後才應新增實際關聯，避免引用不存在的收藏。

## 使用者備註


## 更新紀錄

### 2026-09-29

- 建立 OpenRig Knowledge Card。
- 依 `v0.6.1`、README、套件設定與安全政策整理 Harness 架構、權限寫入風險與平台限制。