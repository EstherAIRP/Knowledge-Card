---
schema_version: 1
id: github-mattpocock-skills
title: Skills For Real Engineers
canonical_url: https://github.com/mattpocock/skills
source:
  type: github
  url: https://github.com/mattpocock/skills
  identity: github:mattpocock/skills
resource_kind:
  ai: skill
  user: null
created_at: 2026-08-15
updated_at: 2026-08-21
last_checked_at: 2026-08-21
summary: Skills For Real Engineers 是 Matt Pocock 維護的一組可組合 Agent Skills，把需求澄清、TDD、除錯、domain modeling、spec／ticket 拆解、code review、研究與大型工作規劃等工程實務封裝成可重複使用的工作流程；它不是新的 agent runtime，而是疊加在 Claude Code、Codex 等 coding agent 之上的行為與工程紀律層。
classification:
  categories:
    ai:
      - Agent
      - AI Coding / DevTools
      - General Tools
    user: null
  tags:
    ai:
      - agent-skills
      - Claude Code
      - Codex
      - skills.sh
      - SKILL.md
      - AI coding
      - TDD
      - debugging
      - code review
      - domain modeling
      - ADR
      - issue tracker
      - workflow composition
      - engineering discipline
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
    - REFERENCE
  user: null
status:
  ai: active
  user: null
---

# Skills For Real Engineers

## 一句話介紹

Skills For Real Engineers 是 Matt Pocock 維護的一組 **Agent Skills 工作流程庫**，把需求澄清、TDD、除錯、domain modeling、spec／ticket 拆解、code review、研究與大型工作規劃等軟體工程實務，整理成 Claude Code、Codex 與其他支援 Skills 的 coding agent 可重複載入與組合的行為模組。

## 它解決什麼問題

這個專案針對的不是「模型不會寫程式」，而是 **coding agent 即使能快速產生程式碼，也很容易在需求理解、回饋迴圈、架構控制與長任務分解上失控**。

README 把常見失敗模式整理成幾類：Agent 沒真正理解要做什麼、輸出冗長且缺乏共享術語、程式碼缺少可驗證 feedback loop，以及隨著 AI 加速開發而更快累積 codebase entropy。專案的做法不是建立一套接管整個開發流程的 framework，而是把工程習慣拆成小型、可調整、可組合的 Skill，讓使用者保留流程控制權。

因此它比較接近 **工程方法論的 executable prompt layer**：不是替代 Git、issue tracker、測試框架或 Agent runtime，而是規範 agent 在這些既有工具上應該如何工作。

## 核心概念

第一個核心是 **small, adaptable, composable skills**。專案刻意避免把所有開發流程包成單一大框架；每個 Skill 聚焦一個明確問題，例如 `/tdd` 管 red-green-refactor、`/diagnosing-bugs` 管除錯迴圈、`/code-review` 管 diff review、`/domain-modeling` 管共享語言與 domain model。這讓使用者可以只取需要的能力，而不是接受一整套封閉流程。

第二個核心是 **User-invoked 與 Model-invoked 的權限分層**。User-invoked Skill 只能由使用者明確叫用，主要負責 orchestration；Model-invoked Skill 則可以由使用者或模型依任務情境自動觸發，承載可重複使用的工程 discipline。Engineering README 甚至分別使用 Claude Code 的 `disable-model-invocation: true` 與 Codex 的 `policy.allow_implicit_invocation: false` 來表達這個邊界。

第三個核心是 **先建立 shared language，再讓 agent 工作**。`grill-with-docs`、`domain-modeling` 與 setup 流程會把專案術語、`CONTEXT.md`、ADR 與 domain 文件視為長期共享語境。這不只是減少模型 verbosity，而是讓命名、模組邊界與後續決策都沿用同一套 domain vocabulary。

第四個核心是 **feedback loop 優先**。`tdd` 要求 red-green-refactor；`diagnosing-bugs` 要先建立能重現問題的紅燈，再做最小化、假設、instrumentation、修正與 regression test；`code-review` 則把 standards 與 spec fidelity 分成兩個 review axis。共同思路是：不要讓 agent 靠一次性推理猜正確答案，而是建立可觀測、可反駁的工程迴圈。

第五個核心是 **把長任務顯式化成可管理的工作圖**。`to-spec`、`to-tickets`、`implement` 與 `wayfinder` 分別處理規格整理、blocking edge、實作與跨 session 的大型決策；這使 Skills 不只處理單次 prompt，也開始形成一層輕量的工作 orchestration。

## 架構與技術

Repository 的主要資產是 `skills/**/SKILL.md` 與其附屬 template／reference 文件，而不是大型 runtime。GitHub 將主要語言標示為 Shell，但實際核心價值主要存在於 Markdown-based Skill instructions、少量 scripts、plugin metadata 與配置文件。

目前主要分成 **Engineering** 與 **Productivity** 兩大方向，另外保留 deprecated、in-progress 與 misc 區域。Engineering skills 再區分 user-invoked 與 model-invoked：

- User-invoked：`ask-matt`、`grill-with-docs`、`triage`、`improve-codebase-architecture`、`setup-matt-pocock-skills`、`to-spec`、`to-tickets`、`implement`、`wayfinder` 等。
- Model-invoked：`prototype`、`diagnosing-bugs`、`research`、`tdd`、`domain-modeling`、`codebase-design`、`code-review`、`resolving-merge-conflicts`、`wizard` 等。
- Productivity 區則提供 `grill-me`、`handoff`、`teach`、`to-questionnaire`、`wait-what` 與底層 reusable primitives。

安裝有兩條主要路線。Claude Code 可以直接透過官方 plugin marketplace 安裝整套 `mattpocock-skills`，採 managed、read-only、隨作者更新的訂閱模式；Codex 與其他 agent 則可以使用 `npx skills@latest add mattpocock/skills`，把選定 Skill 複製進自己的 repository，之後可自行修改並用 `npx skills update` 更新。README 明確提醒兩種方式不要同時安裝，否則會得到重複 Skill。

初始化則由 `/setup-matt-pocock-skills` 處理。它會檢查 Git remote、`AGENTS.md`／`CLAUDE.md`、`CONTEXT.md`、ADR、issue tracker 與 monorepo signals，然後建立 `docs/agents/issue-tracker.md`、domain docs 與必要的 triage label 設定。這個 setup 本身也明確被描述為 **prompt-driven skill，而不是 deterministic script**。

## 主要功能

- **需求澄清與設計訪談**：`grill-me`、`grill-with-docs` 透過高密度追問把模糊需求轉成較清楚的 design tree。
- **共享語言與 Domain Modeling**：建立或更新 `CONTEXT.md`、ADR 與 domain vocabulary，讓後續 agent session 使用同一套術語。
- **Spec／Ticket／Implementation Flow**：從既有對話整理 spec，再拆成帶 blocking edge 的 ticket，最後由 `implement` 驅動實作與 review。
- **TDD**：把 red-green-refactor 與 vertical slice 變成可重複執行的 Agent workflow。
- **除錯**：建立可重現 feedback loop，再依 minimise → hypothesise → instrument → fix → regression-test 推進。
- **Code Review**：分開檢查 coding standards／code smell 與是否忠實符合原始 spec。
- **Codebase Design / Architecture**：以 deep module、clean seam 與可測試介面作為架構 vocabulary，並可掃描 codebase 找出深化模組的候選點。
- **Research**：要求以高可信 primary sources 做研究並把結果寫成有引用的 repository 文件。
- **Issue Tracker Integration**：setup 可設定 GitHub、GitLab、local markdown 或其他 tracker，讓 triage、spec 與 tickets 沿用同一工作來源。
- **跨 Session 大型工作規劃**：`wayfinder` 用 decision tickets 保存超過單一 context window 的規劃狀態。
- **Human-only 操作引導**：`wizard` 可生成互動式 Bash wizard，協助完成 provisioning、credentials、dashboard 操作或 migration 等 agent 無法代做的步驟。

## 技術亮點

最值得保留的不是某一個 Skill，而是它對 **Agent Skill 應該承載什麼** 的設計：把「好工程師平常會做的檢查與節奏」變成可顯式載入的 behavioral module。這比單純把 prompt 寫得更長更具可維護性，因為每個 Skill 有明確任務邊界、觸發方式與輸出責任。

第二個亮點是 **orchestration 與 discipline 分離**。User-invoked Skill 像入口與流程控制器，Model-invoked Skill 則是底層可重用 discipline；這讓高階流程可以組合 TDD、review、domain modeling 等能力，而不需要每個入口 Skill 都複製完整規則。

第三個亮點是 **把 repository 文件當成 Agent 的 persistent engineering context**。`CONTEXT.md`、ADR、issue tracker 設定與 `docs/agents/*.md` 不只是人類文件，而是未來 session 的 shared contract。這與單純依賴聊天記憶不同：狀態被放回 version-controlled repository，能被 review、修改與追蹤。

第四個亮點是 **刻意保留人類控制權**。README 明確把這套 Skills 與會「own the process」的完整方法論框架做區隔；例如 user-invoked skill 不允許模型自行觸發，setup 也會先探索、呈現發現、確認後再寫入。這讓 workflow automation 不必等於 workflow autonomy。

第五個亮點是它適合拿來理解 **Skill layer 與 Harness layer 的差異**。這個 repository 本身沒有提供 session runtime、model adapter、tool execution engine 或 sandbox；它主要定義「agent 應該怎麼工作」。換句話說，它更像可插在 Claude Code、Codex 或其他 Agent Harness 上方的工程 SOP／policy layer，而不是 Harness 本身。

## 限制與風險

第一個限制是 **大多數 Skill 仍是 prompt-driven，而非 deterministic automation**。例如 setup 文件直接說明自身不是 deterministic script；因此輸出品質與流程一致性仍取決於 host agent 是否正確理解 instructions、是否具備需要的工具，以及當下 context 是否完整。

第二個限制是 **不同 Agent Host 的能力並不完全等價**。專案雖然宣稱 skills 可跨模型使用，並提供 Claude Code 與 Codex 的 invocation policy 表達方式，但某些流程會依賴 sub-agent、background work、shell、browser、GitHub／GitLab CLI 或 issue tracker 能力。移植到其他 agent 時，可能需要調整 Skill 內容或降低部分功能。

第三個限制是 **這是一套具有作者工程觀點的 workflow library，不是中立標準**。例如 TDD、deep modules、ADR、domain modeling、grilling 與 ticket graph 都反映特定軟體工程方法論。它們很值得參考，但不代表每個團隊、每個 legacy codebase 或每種任務都應完整照搬。

第四個限制是 **managed plugin 與 editable copy 的更新模型不同**。Claude Code plugin 會隨作者發版更新；`skills.sh` 複製出的檔案則屬於自己的 repository，可自由修改，但之後更新時也需要自行處理 local customization 與 upstream changes 的差異。README 也提醒不要同時安裝兩種來源，以避免重複 Skill。

第五個限制是 **快速演化本身會造成 workflow drift**。Repository 建立於 2026 年 2 月，至 2026-08-15 仍高度活躍；GitHub metadata 顯示規模已達非常高的 star／fork 數量並採 MIT License。高採用度代表值得觀察，但 Skill 內容頻繁演進時，實際行為仍應以當前版本為準，而不能把某次使用經驗視為永久契約。

## 與你的相關性

依公開技術 Profile，這個專案對 **LLM / Agent** 的相關性最高。它直接提供 coding agent 的 workflow、invocation policy、engineering context、issue flow 與 review discipline，可作為設計 Agent Skill、工具調用策略與工作流程控制時的參考，因此 `llm_agent` 評為 5。

對 **AI R&D** 也有高價值。模型研究本身不是它的主題，但 research、TDD、debugging、code review、domain modeling 與長任務拆解，可以直接改善 AI 系統原型與工程實作的可靠度，因此 `ai_rd` 評為 4。

對 **AOI × AI** 的關聯主要是間接工程價值。它沒有影像檢測、資料前處理或 CV-specific 技術，但可以用來規範 AOI 軟體的需求澄清、bug diagnosis、測試與架構 review，因此評為 2。

對 **SillyTavern / AI RPG** 也不是直接功能型收藏；不過 Skill composition、shared context 與 long-running work decomposition 的想法可以轉用於複雜 Agent／角色系統開發，因此保留 2。Image Generation 幾乎沒有直接關聯，評為 1。

整體評為 5，原因不是它涵蓋最多 AI 技術，而是它很接近「如何讓 coding agent 從會寫 code，進一步遵守可維護的工程流程」這個核心問題，具有立即試用與長期架構參考價值。

## 建議怎麼使用

建議先採 **小範圍導入**，不要一次把所有 Skill 裝進工作流程。最值得先試的組合是：

1. `grill-with-docs`：用在功能開始前，把需求與 domain vocabulary 釐清。
2. `tdd`：用在具有可測試 seam 的新功能或 bug fix。
3. `diagnosing-bugs`：用在複雜、難以一次定位的錯誤。
4. `code-review`：在完成實作後，把 standards 與 spec fidelity 分開檢查。
5. `handoff` 或 `wayfinder`：在任務會跨越多個 session 時保存狀態。

因此給予 `TRY` 與 `INTEGRATE`：它可以直接安裝並選擇少數 Skill 放進既有 coding-agent workflow。也給 `LEARN` 與 `REFERENCE`，因為即使不採用整套 Skills，它對 invocation boundary、shared context、feedback loop 與 orchestration／discipline 分層的設計仍很值得拆解。

若要自行客製，`skills.sh` 路線比 managed Claude Code plugin 更適合，因為 Skill 會成為 repository 中可編輯的普通檔案；但修改後應把 upstream 更新視為需要人工 review 的依賴更新，而不是無條件同步。

## 與其他收藏的關聯

- [ISO 24495 Skill](./github-danyuchn-iso-24495-skill.md)：兩者都把人類專業方法轉成 Agent Skill，但 ISO 24495 Skill 聚焦單一寫作 domain；Skills For Real Engineers 則示範如何把多個工程 discipline 拆成可組合的 Skill library。前者適合看「單一 Skill 如何把 domain rules 分層」，後者適合看「多 Skill 如何形成工作流生態」。
- [DeepSeek Harness 繁體中文版](./github-g36maid-deepseek-harness.md)：兩者位於 Agent stack 的不同層。DeepSeek Harness 處理 session、agent loop、tool execution、model adapter、sandbox 與 capability seam；Skills For Real Engineers 則主要規範 agent 在 runtime 之上應採取的工程流程。若把 Harness 視為 Agent 的 execution substrate，這個 repository 比較接近 behavioral policy / workflow layer。

## 使用者備註


## 更新紀錄

### 2026-08-21

- 重新檢查目前 Repository，依主要交付物正式將 `resource_kind` 分類為 `skill`。

### 2026-08-15

- 建立 Knowledge Card，整理 Skills For Real Engineers 的 Skill composition、invocation boundary、engineering workflow、安裝方式與 Agent stack 定位。
