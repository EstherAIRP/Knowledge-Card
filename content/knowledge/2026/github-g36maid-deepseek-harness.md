---
schema_version: 1
id: github-g36maid-deepseek-harness
title: DeepSeek Harness 繁體中文版
canonical_url: https://github.com/G36maid/deepseek-harness
source:
  type: github
  url: https://github.com/G36maid/deepseek-harness
  identity: github:g36maid/deepseek-harness
resource_kind:
  ai: project
  user: null
created_at: 2026-08-15
updated_at: 2026-08-21
last_checked_at: 2026-08-21
summary: DeepSeek Harness 是 DeepSeek AI 的開源 agent harness，以 Cordis 實作「Everything is a Plugin」架構，把 agent loop、模型介面、工具、session、權限與執行能力拆成可替換的 plugin／service seam；此 fork 另維護繁體中文文件、Web UI locale 與 zh-TW 轉換驗證管線，適合作為可組合 Agent Runtime 與在地化工程的架構參考。
classification:
  categories:
    ai:
      - LLM
      - Agent
      - AI Coding / DevTools
      - Infrastructure / Deployment
    user: null
  tags:
    ai:
      - agent-harness
      - agent-runtime
      - Cordis
      - plugin-architecture
      - agent-loop
      - event-sourcing
      - session-log
      - tool-registry
      - capability-seams
      - user-approval
      - sandbox
      - TypeScript
      - Web UI
      - headless
      - zh-TW
      - i18n
    user: null
relevance:
  ai:
    overall: 5
    ai_rd: 4
    aoi_ai: 2
    llm_agent: 5
    sillytavern_ai_rpg: 4
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

# DeepSeek Harness 繁體中文版

## 一句話介紹

DeepSeek Harness（`dsh`）是 DeepSeek AI 開源的 agent harness：它不是把模型、工具、記憶、迴圈與 UI 固定寫死在一個核心裡，而是以 Cordis 建立「Everything is a Plugin」的可組合 runtime。`G36maid/deepseek-harness` 則是在官方專案基礎上持續維護繁體中文（zh-TW）文件、Web UI locale 與自動轉換／驗證流程的 fork。

## 它解決什麼問題

建立 Agent 系統時，真正難維護的通常不是單次 LLM request，而是 surrounding runtime：模型 provider、system prompt、tool registry、agent loop、session、權限、shell／filesystem、subagent、background job、UI 與持久化往往彼此耦合。當其中一層需要替換時，如果所有行為都寫進同一個主迴圈，系統很快會變成只能 fork core 才能修改的架構。

DeepSeek Harness 的切入點是把這些能力拆成 Cordis plugin、service 與 event seam。模型 adapter、tool registry、session log，甚至預設 agent loop 本身都只是 composition 中的一部分；新的能力優先透過註冊 service、event listener 或 plugin row 加入，而不是直接修改特權核心。

這個 fork 又多處理了一個實務問題：大型技術專案的繁體中文在地化很容易退化成一次性的 README 翻譯。它把 zh-TW 視為可驗證的工程產物，加入文件三語切換、Web UI locale、術語表、轉換腳本與 CI gate，降低簡繁轉換錯詞、文件不同步與台灣用語漂移。

## 核心概念

第一個核心是 **Everything is a Plugin**。DeepSeek Harness 建立在 Cordis 上，plugin 可以向共享 context 提供 service、typed event 與 reversible effect。官方架構文件明確指出 model adapter、tool registry、session log、agent loop 都是 plugin，因此沒有一個必須靠 patch core 才能擴充的永久特權層。

第二個核心是 **Profile、Bundle 與 Patch 的分層 composition**。執行中的 `dsh` 是一棵啟動時組合出的 plugin tree。Profile 定義要堆疊哪些 bundles 與額外 plugin；bundle 則分發 Cordis config rows 與對應程式碼。上層 patch 可以針對 row id 替換設定或插入新 row，因此 runtime configuration 本身就是可覆寫的 composition layer。官方提供 `web` 與 `headless` profile，`dsh-base` 則提供模型 adapter、工具、持久化、sandbox、approval、credentials、telemetry 等基礎能力。

第三個核心是 **event-sourced session log**。Session 是 append-only `SessionEvent` log，模型看到的 history 不是另外維護的一份聊天陣列，而是從 log 投影產生。架構文件把「Model-visible means logged」當成 invariant：任何送進模型 request 的資訊都應可由 log 重建。這讓 replay、fork、resume、transcript、telemetry 與 persistence 都可以從同一事件流派生。

第四個核心是 **Turn／Step 與 live interception 分離**。一個 turn 可以包含多個 model steps；每個 step 包含一次 model request 與後續 tool calls。`turn/*`、`step/*`、user／assistant／tool events 屬於 durable session facts，而 `agent/pre-step`、`agent/request`、`llm/stream`、`tools/*` 等則是 runtime extension points。這個分離讓「要留下可重播事實的事件」與「只在執行中攔截／改寫的 hook」具有不同責任。

第五個核心是 **Capability Seam**。一個完整 capability 通常有 Service Definition、Service Provider 與 Consumer 三個角色。例如 filesystem、subprocess、subagent 都可以在共同介面後切換 provider；因此把 filesystem 與 subprocess provider 指向 remote sandbox，可以連帶搬動 Bash、PTY、LSP 等依賴同一 execution world 的功能，而不需要每個工具各自做 remote fork。

對此 fork 而言，另一個值得保留的概念是 **在地化也要有 machine-checkable contract**。近期提交不是只修改文字，而是在修正繁中術語表、OpenCC／zhtw-js 轉換陷阱、三語切換、translation pairing 與 `verify-zh-tw` gate，顯示維護者把 zh-TW corpus 當成需要持續驗證的正式子系統。

## 架構與技術

Repository 主要以 **TypeScript** 實作，採 pnpm workspace monorepo。當前 `package.json` 為 `0.1.0-rc.5`，要求 Node.js `^22.19.0 || >=24.0.0`，workspace 包含 `packages/*/*`、`apps/*`、native sandbox 相關元件與 website。Build／test／docs／translation／release 都由同一組 scripts 管理。

核心 runtime 可以從幾個 package 看出邊界：

- `core/session`：append-only SessionEvent log 與 session store。
- `core/system-prompt`：prompt section 與 tool schema 組裝。
- `core/tools`：scoped tool registry 與受控 execution pipeline。
- `core/agent`：Agent interface、registry 與 `agent/*` events。
- `core/agent-loop`：預設的 concrete driver；extension plugin 應依賴 `agent` contract，而不是直接依賴 loop implementation。
- `core/scope`：per-agent scoped registration primitive。
- `llm/llm`：message／stream vocabulary 與 provider adapter seam。

典型 turn flow 是：從 inbox claim 輸入 → 組合 prompt 與 tool schemas → `agent/pre-step` → model request／stream → assistant events → tool call → `tools/pre-execute`／`execute`／`post-execute` → 若仍有工具或 steering 欠下一步則繼續 step，否則關閉 turn。這個流程同時提供 durable log 與可攔截的 live waterfall events。

執行層除了 Web UI，也有 headless composition。README 提供 `npx @deepseek-ai/dsh web` 啟動官方套件的快速路徑；從 source 開發則使用 pnpm install／build，再透過 `dsh` CLI 啟動。架構文件也列出 shell、terminal、background jobs、filesystem、sandbox、subagent、goals、session fork 與 UI integration 等可插拔 seam。

權限方面，`dsh-user-approval` 把 approval 也做成 service seam。Outcome 只有 `allowed-once`、`rejected`、`cancelled`、`unavailable`，而 `unavailable` 會 fail closed；session policy 可設為 `ask` 或 `never`。這表示 approval 不是 UI 上的一顆按鈕，而是可記錄、可 replay policy、可由工具執行管線消費的 runtime contract。

這個 fork 的 zh-TW 工程則包含 `convert-zh-tw`、`verify-zh-tw`、translation pairing 與相關 scripts；近期提交也持續修正「驅動／驅動程式」、「過程／程序」、本地化／在地化等語境差異，以及避免 protected span、語言切換列在自動轉換中被破壞。

## 主要功能

- **Web UI 與 Headless Runtime**：可用 browser UI 操作，也能以無 UI profile 組合 one-shot／server-side agent runtime。
- **可替換 LLM Adapter**：模型 provider 透過 `ctx.llm` seam 註冊，不把 agent loop 綁死在單一供應商。
- **Scoped Tool Registry**：工具 schema 會加入 prompt assembly，執行時經過 pre／execute／post pipeline，並可依 agent scope 隔離註冊。
- **Durable Session**：以 event log 支援 history derivation、fork、resume、transcript、persistence 與 replay。
- **Agent Inbox 與 Steering**：區分 next-turn、next-step，並提供 followup、steer、inject、cancel、whenIdle 等明確生命週期介面。
- **Capability Plugins**：可擴充 filesystem、shell、terminal、sandbox、subagent、background jobs、goals、session title、UI node 等能力。
- **Human-in-the-loop Approval**：高權限 tool operation 可走 fail-closed approval seam，並把 policy 與 audit facts 納入 session contract。
- **Profile／Bundle／Patch Composition**：可用 bundle 建立可分發配置，再由 profile 與 local patch 疊加不同 runtime 組合。
- **繁體中文在地化**：此 fork 提供 zh-TW README／技術文件、Web UI locale，以及自動轉換、術語修正與驗證流程。

## 技術亮點

最值得研究的是它對 **harness 邊界** 的定義。DeepSeek Harness 並不把 harness 簡化成「while loop + tools」；它把 session truth、prompt assembly、LLM adapter、tool execution、agent lifecycle、policy 與 deployment composition 都視為 runtime contract。這使 agent 的可替換性不只存在於模型層，而延伸到整個 surrounding system。

第二個亮點是 **以 event sourcing 約束模型上下文**。許多 agent 系統同時維護 UI state、聊天 history、tool state 與 persistence state，容易出現「模型看到了但 log 沒記」、「replay 後與當時執行不同」的分歧。DeepSeek Harness 直接要求 model-visible information 可從 durable log 重建，這對除錯、replay、fork 與 reproducibility 很有價值。

第三個亮點是 **reversible plugin effects**。Plugin unload 時，其註冊與 effects 可以 unwind，讓 extension lifecycle 不只是「啟動時註冊一次」。對需要動態 profile、agent-local capability 或測試隔離的系統，這比全域 singleton registry 更容易維持邊界。

第四個亮點是 **安全策略被做成可組合 seam，而不是散落在每個工具內**。Approval service 先套用 session policy，再由 answerer 決策；沒有 answerer、answerer failure 或不合法結果都會落到 `unavailable` 並拒絕。這種 fail-closed contract 很適合作為 autonomous tool-use 系統的設計參考。

第五個亮點屬於此 fork：**把 zh-TW localization 當作 CI 可驗證的 software subsystem**。它不只批次轉成繁體，而是透過 terminology corrections、source alignment、translation pairing、residual-Simplified 檢查與語言 switcher 保護來降低自動轉換錯誤。對大型技術文件的繁中維護而言，這比人工維護數百份副本更有可持續性。

## 限制與風險

最直接的限制是 **仍處於 developer preview**。README 明確警告會有 compatibility-breaking changes；`package.json` 也仍是 RC 版本。現在很適合研究架構、做實驗或小型 prototype，但若要把 plugin API、Cordis config row 或 agent lifecycle contract 當成長期穩定依賴，應先接受升級時需要跟著調整的成本。

第二個限制是 **學習曲線高於一般 Agent SDK**。要真正理解 extension point，除了 agent loop 還需要理解 Cordis context、plugin effect、profile／bundle／patch、scope、event waterfall、durable session event 與 capability seam。它提供的是更完整的 runtime abstraction，代價就是概念面與 package 數量都較大。

第三個風險是 **能力越可插拔，權限面也越需要治理**。Shell、filesystem、subprocess、terminal、remote sandbox 與 subagent 都可能成為高權限執行入口。Approval 的 fail-closed 設計是重要防線，但 approval 不等於 sandbox；部署時仍應分開管理 filesystem boundary、process isolation、credentials、network 與 unattended policy。

第四個限制是 **fork 與 upstream 的同步成本**。此 repository 是 `deepseek-ai/deepseek-harness` 的 fork，繁中功能由 fork 自行維護。上游快速變動時，zh-TW 文件、UI locale、conversion rules 與 runtime code 都可能產生 merge／pairing 工作；近期 commit history 顯示維護者正在積極處理這些同步與語意修正，但這同時說明在地化不是零成本。

第五個實務注意點是 **README 的 `npx @deepseek-ai/dsh web` 指向官方 npm package**。若目標是體驗此 fork 尚未進入上游／官方套件的 zh-TW 修改，僅執行官方 npm 套件不一定等同於執行 fork 內容；較可靠的方式是確認改動是否已上游合併，或直接從這個 fork 的 source build。

另外，較新的 Node.js 與大型 monorepo build／test matrix 也提高了本機開發與 CI 成本。這不是功能缺陷，但若只需要很薄的「單一 Agent + 幾個 tools」runtime，DeepSeek Harness 可能比極簡 SDK 更重。

## 與你的相關性

依公開技術 Profile，這個專案對 **LLM / Agent** 屬於核心相關，因此 `llm_agent` 評為 5。它最有價值的地方不是提供另一個聊天 UI，而是直接展示一套 agent harness 如何把 loop、tool、session、policy、subagent、sandbox 與 runtime composition 拆成可以被替換與觀察的工程邊界。

對 **AI R&D** 評為 4。若研究 agent reliability、tool-use、memory／session semantics、replay、evaluation、human approval 或不同 model provider 的抽象層，它提供的 event contract 與 package decomposition 都具有直接參考價值。

對 **AOI × AI** 評為 2。它本身不是 computer vision 或 inspection framework，但若未來要把 LLM agent 放進自動化流程，這種 tool registry、approval、sandbox、durable event 與 headless runtime 設計可作為控制層參考，而不是模型演算法本身的解法。

對 **SillyTavern / AI RPG** 評為 4。它不是角色扮演前端，也沒有以角色世界觀為主的資料模型，但 agent-local context、session log、inject／steer、goals、subagent 與 plugin composition，都可以轉化成長期角色 runtime、旁白／工具 agent、世界狀態或可插拔能力的設計靈感。

對 **Image Generation** 的直接關聯低，因此評為 1；除非將圖片模型與工作流包裝成 agent tool／provider，否則核心價值仍在 agent runtime 而非生成模型本身。

## 建議怎麼使用

- `TRY`：先用官方 `dsh web` 快速理解產品形態；若重點是此 fork 的 zh-TW 差異，則應從 fork source build，並確認 locale／文件是否與官方套件一致。
- `LEARN`：優先讀 `docs/architecture.md`、Core／Session／Tools／Approval 等 subsystem 文件。比起先讀所有 package，先理解 plugin tree、turn flow、durable vs live event、capability seam，會更快掌握整體架構。
- `REFERENCE`：把它當作「Agent Harness 內部 runtime」的設計基準，尤其適合比較 agent loop 是否應可替換、模型可見資訊如何被記錄、工具權限如何 fail closed、以及 per-agent scope 如何管理。
- `WATCH`：持續觀察 developer preview 的 breaking changes、Cordis contract、上游 release，以及此 zh-TW fork 與 upstream 的同步狀態。現在的架構值得研究，但不宜假設目前所有 plugin surface 已經長期凍結。

若要做小型驗證，可以挑一個簡單 agent，分別替換 model adapter、加入自訂 tool、注入一段 agent-local context，再觀察 session log 是否足以重建模型看到的內容。這會比只啟動 Web UI 更能驗證「Everything is a Plugin」是否真的符合你的使用需求。

## 與其他收藏的關聯

- [Orca](./github-stablyai-orca.md)：Orca 位於 agent 外層，重點是以 worktree、terminal、durable orchestration 與 review 管理多個既有 coding agents；DeepSeek Harness 則位於 agent 內層，定義單一／多個 agent 的 model、tool、session、loop 與 capability runtime。兩者可視為「Agent execution environment」與「Agent runtime harness」的互補層。
- [Personal Model](./github-intuition-lab-personal-model.md)：Personal Model 專注跨 Agent 共用的 local-first 長期記憶與 provenance；DeepSeek Harness 的 session log 則處理單一 runtime 內的 durable execution truth。前者偏 external memory layer，後者偏 execution／session layer。
- [Project AIRI](./github-moeru-ai-airi.md)：AIRI 是面向 AI VTuber／數位生命的完整 multimodal character runtime；DeepSeek Harness 提供的 scoped plugin、agent events、session、goals、subagent 與 tool seams，可作為理解「角色產品底下的 Agent Runtime 應如何模組化」的對照案例。

## 使用者備註

## 更新紀錄

### 2026-08-21

- 重新檢查目前 Repository，依主要交付物正式將 `resource_kind` 分類為 `project`。

### 2026-08-15

- 建立 Knowledge Card；收錄 DeepSeek Harness 的 Cordis plugin architecture、event-sourced session、agent／tool／approval runtime，以及此 fork 的 zh-TW localization／validation pipeline。
