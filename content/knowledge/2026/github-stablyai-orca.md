---
schema_version: 1
id: github-stablyai-orca
title: Orca
canonical_url: https://github.com/stablyai/orca
source:
  type: github
  url: https://github.com/stablyai/orca
  identity: github:stablyai/orca
created_at: 2026-08-13
updated_at: 2026-08-13
last_checked_at: 2026-08-13
summary: Orca 是面向平行 coding agents 的 Agent Development Environment，以 Git worktree 隔離多個 CLI agent，整合 durable orchestration、終端、Git／PR review、SSH／headless runtime、Mobile Companion、Design Mode 與可程式化 CLI，讓 Codex、Claude Code、OpenCode、Pi 等代理能在同一工作環境中平行執行、追蹤、比較與交接。
classification:
  categories:
    ai:
      - Agent
      - AI Coding / DevTools
      - Infrastructure / Deployment
    user: null
  tags:
    ai:
      - parallel coding agents
      - agent orchestration
      - git worktree
      - Electron
      - TypeScript
      - CLI agents
      - Codex
      - Claude Code
      - OpenCode
      - agent IDE
      - SSH workspaces
      - headless runtime
      - mobile companion
      - durable orchestration
      - task DAG
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
    - TRY
    - LEARN
    - REFERENCE
    - WATCH
  user: null
status:
  ai: active
  user: null
---

# Orca

## 一句話介紹

Orca 是一套為「同時管理多個 coding agent」設計的 Agent Development Environment（ADE）：它把 Codex、Claude Code、OpenCode、Pi 等 CLI agent 放進各自隔離的 Git worktree／workspace，並在同一個 Electron 桌面環境中提供終端、程式碼瀏覽、diff review、Git／Linear 整合、SSH、Mobile Companion 與可程式化 CLI。

## 它解決什麼問題

coding agent 的瓶頸逐漸從「單一模型能不能寫程式」轉向「如何安全地讓多個 agent 同時工作、保留上下文、比較結果、處理衝突，並讓人可以持續監督」。如果多個 agent 共用同一 working tree，很容易互相覆蓋檔案、污染 Git 狀態，或讓使用者失去哪一個 agent 正在修改什麼的可觀測性。

Orca 的切入點是把 **worktree isolation、terminal session、agent identity、task dispatch、review 與 remote runtime** 組成同一個開發環境。README 的典型工作流是把同一個 prompt fan-out 給多個 agent，各自在獨立 worktree 產生方案，再比較結果、選擇並 merge；這使「平行 agent」不只是同時開很多 terminal，而是變成有工作區邊界與可追蹤生命週期的工程流程。

## 核心概念

Orca 可以分成兩個層次理解。

第一層是 **Agent IDE / worktree workspace**。每個 coding agent 仍是原本的 CLI 工具；Orca 不要求它們改成同一個模型 API，而是把「任何能在 terminal 執行的 agent」視為可管理單位。Git worktree 讓不同 agent 擁有隔離的檔案狀態，folder workspace 則提供非 Git 專案的替代路徑。這種設計避免把 orchestrator 與特定模型供應商綁死。

第二層是 **durable orchestration**。官方 orchestration guide 定義 Run、Task、Dispatch 三個核心物件：Run 是 coordinator 的持久 namespace／inbox，Task 表示工作項目與 DAG dependency，Dispatch 則把某次 Task attempt 指派給具體 agent terminal。系統還有 persistent message、blocking ask/reply、`worker_done`、`escalation`、heartbeat、decision gate 與 coordinator loop，讓多 agent 協作具有明確 provenance，而不是只靠 prompt 約定。

這個 orchestration state 不是暫存 UI 狀態。原始碼中的 `OrchestrationDb` 使用 SQLite、WAL、schema migration、delivery／mutation receipts 與 dispatch capability 等機制保存 Runs、Messages、Deliveries、Tasks 與 Dispatch lifecycle，顯示 Orca 正把 agent coordination 當作需要 durability、idempotency 與 authority model 的系統問題處理。

## 架構與技術

Repository 以 **TypeScript** 為主，桌面端採 **Electron + React**。`src/` 明確拆成 `main`、`preload`、`renderer`、`cli`、`relay`、`shared` 與 `types`；相依套件包含 Electron 43、React 19、Xterm、`node-pty`、`ssh2`、WebSocket、Monaco、Zustand、Playwright 等。這組技術棧對應到它的主要角色：桌面 IDE、pseudo-terminal、遠端 SSH runtime、編輯器／diff view、WebSocket 配對與跨裝置控制。

Agent 執行核心仍是 terminal process。Orca 以 `node-pty` 與 Xterm 管理互動式 CLI，並把不同 agent 放入 worktree／folder workspace。對遠端使用情境，專案不只提供一般 SSH worktree，也能在 Linux VPS 上執行 `orca serve`；headless 文件說明 packaged Electron runtime 在無桌面環境時會搭配 Xvfb，並透過 WebSocket endpoint 與 pairing URL 提供 client 連線。

Orchestration layer 則位於 `src/main/runtime/orchestration/`，以 SQLite 保存 Run／Task／Dispatch／message state。官方 guide 顯示 CLI 可建立 Run、Task、DAG dependency，啟動 worker、注入 dispatch preamble、等待 `worker_done`／`escalation`，並支援 coordinator takeover、legacy compatibility 與 mixed-version migration。這代表 Orca 已超過「terminal multiplexer」層級，而是在做 agent runtime control plane。

另外，Orca CLI 提供 `worktree create`、`snapshot`、`click`、`fill` 等 automation surface；Design Mode 可從真實 Chromium 頁面擷取 DOM／CSS 與 cropped screenshot 放進 agent prompt；GitHub／Linear、annotated AI diff、Mobile Companion 則把 task selection、執行、review 與 remote steering 接在同一條 workflow 上。

## 主要功能

- **Parallel Worktrees**：將同一需求交給多個 agent，各自在隔離 Git worktree 中執行，方便比較與 merge。
- **Agent-agnostic terminal runtime**：官方列出 Codex、Claude Code、OpenCode、Pi、Cursor CLI、GitHub Copilot CLI、Qwen Code 等，並宣稱任何可在 terminal 執行的 CLI agent 都可使用。
- **Durable Orchestration**：Run／Task／Dispatch、task DAG、persistent messages、ask/reply、worker completion、escalation、decision gate 與 coordinator lifecycle。
- **Terminal / Editor**：Xterm WebGL terminal、split panes、restart-persistent scrollback、Monaco／VS Code-style editing 與 rich repo preview。
- **Git / Review Workflow**：GitHub、Linear、PR／issue browsing、worktree-from-task、AI diff annotation、review、edit 與 commit。
- **SSH / Headless**：支援 remote worktree、port forwarding、reconnect，以及 Linux VPS 上的 `orca serve` headless runtime。
- **Mobile Companion**：iOS／Android 可查看 agent 狀態、接收完成通知並傳送 follow-up。
- **Design Mode**：點選 Chromium 中的 UI element，把相關 HTML、CSS 與 screenshot 直接交給 agent。
- **Orca CLI / Computer Use**：讓 agent 或自動化腳本反過來操作 Orca 的 workspace、terminal、browser 與部分 desktop workflow。

## 技術亮點

第一個亮點是 **用 Git worktree 把 parallel agent 的衝突模型工程化**。很多 multi-agent coding 工具先解決「怎麼同時呼叫多個模型」，Orca 更重視「這些 agent 改同一個 repository 時如何隔離 filesystem state」。worktree 因此不是附加功能，而是 parallel coding 的核心 concurrency primitive。

第二個亮點是 **把 agent 協作做成有 durable state 的 control plane**。Run／Task／Dispatch、delivery acknowledgement、mutation receipt、dispatch capability、schema migration與 worker lifecycle，使 multi-agent collaboration 可以處理 crash recovery、重試、版本升級與 coordinator takeover。這比只靠「主 agent 再 prompt 子 agent」更接近 distributed systems 的設計。

第三個亮點是 **不綁特定 agent provider**。Orca 把 CLI／PTY 當最低共同介面，因此可以讓 Codex、Claude Code、OpenCode、Pi 或其他 terminal agent 並存。這降低模型與訂閱綁定，並允許使用者把不同 agent 的能力、成本與 quota 當成可編排資源。

第四個亮點是 **把 human-in-the-loop review 與 agent execution 放在同一個 workspace**。AI diff annotation、PR／issue、terminal、editor、worktree 與 task orchestration 都在同一環境中，重點不是自動化程度最高，而是縮短「派工 → 觀察 → 修正 → review → merge」之間的 context switch。

第五個亮點是 **desktop、SSH、headless server、mobile client 使用同一 runtime 思維**。官方對 remote wire compatibility、Git 版本、Windows shell、Linux glibc 與 SSH 都有明確工程契約，表示跨裝置不是單純 remote terminal，而是需要維持 runtime capability 與 protocol compatibility 的正式場景。

## 限制與風險

最大的風險是 **權限面很大**。Orca 管理 shell、Git、檔案編輯、browser／computer-use、自動化與遠端 SSH；一旦 agent prompt、第三方 repository、惡意網頁或外部 tool 被錯誤信任，影響範圍可能直接到本機或 remote host。實務上應把工作區、credentials、SSH key、Git provider token 與可執行指令視為高權限資源，不要因為有 worktree 隔離就把它等同於 sandbox。

第二個限制是 **worktree isolation 不等於完整 process／secret isolation**。多個 agent 雖然檔案工作區分離，仍可能共享同一使用者帳號、環境變數、credential helper、network 與主機能力；需要更嚴格安全邊界時，仍應搭配 container、VM、專用 remote user 或受限 execution environment。

第三個限制是 **remote／headless deployment 需要自行處理網路暴露面**。官方 headless 文件示例的 runtime 可綁到 `0.0.0.0`，並建議私有 server 優先使用 Tailscale；同一文件也要求使用專用 service user、保持 AppImage root-owned，讓 Chromium sandbox 能正常運作。若改成公開 reverse proxy，應額外檢查 pairing、TLS、存取控制與 firewall，而不是直接把 WebSocket runtime 暴露到 Internet。

第四個限制是 **功能與 protocol 變動非常快**。Repository 建立於 2026-03-17，README 明確表示 daily shipping；截至 2026-08-13，GitHub 最新 stable release 為 `v1.4.181`，同時 orchestration guide 仍把部分能力標為 Experimental，且原始碼投入大量 mixed-version／legacy migration compatibility。這代表功能成熟度高於一般 prototype，但 CLI contract、orchestration semantics 與 remote protocol 仍可能快速演進。

第五個限制是 **大型桌面整合層的維護成本高**。Electron、PTY、SSH、Git、browser、mobile、remote protocol、native modules 與多 OS packaging 同時存在，任何一層升級都可能帶來相容性問題。專案已有大量 E2E、performance benchmark 與 cross-platform rules，但高複雜度本身仍是採用與自建 fork 時的重要成本。

另外，README 明確指出 Orca 會收集匿名使用資料並提供 opt-out 說明；若使用在敏感 repository 或受管制環境，導入前仍應先檢查目前 telemetry policy 與組織內部資料治理要求。

## 與你的相關性

依公開技術 Profile，Orca 對 **LLM / Agent** 幾乎是核心相關，因此 `llm_agent` 評為 5。它最值得研究的部分不是單一 coding agent，而是如何把 parallel agents、worktree、terminal、durable task state、remote runtime 與 human review 組合成完整 agent engineering environment。

對 **AI R&D** 也有高價值，因此 `ai_rd` 評為 4。若研究 agent harness、multi-agent evaluation、tool-use reliability、task decomposition、handoff／supervision、crash recovery 或 human-in-the-loop workflow，Orca 提供了大量可以直接閱讀的 production-grade implementation，而不只是一個概念 demo。

對 **AOI × AI** 幾乎沒有直接領域能力，因此評為 1；它可能作為開發 AI／Computer Vision 專案的 coding environment，但不提供 inspection、vision training 或 deployment pipeline 本身。對 **SillyTavern / AI RPG** 的直接關聯也有限，評為 2；可借鑑的主要是 persistent message、task ownership、multi-agent coordination 與 remote steering，而不是角色扮演或 narrative memory。Image Generation 則沒有直接技術關聯。

## 建議怎麼使用

- `TRY`：先以一個可丟棄或容易復原的 repository 測試「同一 issue → 2–3 個不同 coding agents／worktrees → 比較 diff → 選擇 merge」完整流程，觀察 parallelism 是否真的降低總 lead time。
- `LEARN`：優先閱讀 `skill-guides/orchestration.md`、`src/main/runtime/orchestration/`、headless server 與 remote compatibility 文件；這些內容最能代表 Orca 的核心系統設計，而不只是 UI 功能。
- `REFERENCE`：把它當作 Agent IDE / multi-agent control plane 的架構參考，尤其是 Run／Task／Dispatch data model、durable delivery、capability、migration 與 worktree ownership。
- `WATCH`：專案目前 release 節奏非常高，且 orchestration contract 仍快速演進；若要導入長期 workflow，應持續追蹤 breaking changes、remote protocol 與 security／telemetry 更新。

若要做較客觀的採用評估，可固定 5–10 個真實 coding tasks，比較「單一 agent」、「同模型多 worktree」與「異質 agent 並行」三種流程的完成時間、人工 review 時間、merge conflict、失敗重試率與最終 diff 品質。這會比單純觀察 agent 是否同時運作，更能判斷 orchestration 的實際收益。

## 與其他收藏的關聯

- [Hallmark](./github-nutlope-hallmark.md)：Hallmark 是可由 Codex、Claude Code 等 coding agent 載入的設計 Skill；Orca 則位於更外層，負責管理這些 agent 的 workspace、terminal 與協作 lifecycle。兩者可視為「Agent capability packaging」與「Agent execution/orchestration environment」兩個互補層次。

## 使用者備註


## 更新紀錄

### 2026-08-13

- 首次收錄 Orca，整理其 parallel worktree、agent-agnostic terminal、durable orchestration、SSH／headless runtime、Mobile Companion、Design Mode 與 Agent IDE 架構。
