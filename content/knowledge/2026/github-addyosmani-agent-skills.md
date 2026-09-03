---
schema_version: 1
id: github-addyosmani-agent-skills
title: Agent Skills
canonical_url: https://github.com/addyosmani/agent-skills
source:
  type: github
  url: https://github.com/addyosmani/agent-skills
  identity: github:addyosmani/agent-skills
resource_kind:
  ai: skill
  user: null
created_at: 2026-09-03
updated_at: 2026-09-03
last_checked_at: 2026-09-03
summary: Agent Skills 是 Addy Osmani 維護的軟體工程 Agent Skill 套件，把規格、規劃、增量實作、TDD、除錯、審查、安全、效能、CI/CD、文件與發布等資深工程流程封裝成可重用工作流，並提供 Claude Code、Codex、Cursor、Gemini CLI、OpenCode 等多種 Coding Agent 的整合方式。
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
      - coding-agent
      - SKILL.md
      - Claude Code
      - Codex
      - Cursor
      - Gemini CLI
      - OpenCode
      - spec-driven development
      - test-driven development
      - code review
      - software lifecycle
      - engineering workflow
      - workflow orchestration
      - quality gates
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

# Agent Skills

## 一句話介紹

Agent Skills 是 Addy Osmani 維護的一套 **AI Coding Agent 工程工作流技能庫**，把從需求定義、規格、規劃、實作、測試、除錯、審查到發布的軟體工程方法，整理成 Agent 可發現、載入與遵循的 `SKILL.md` 工作流程。

它不是另一個 Coding Agent、模型或執行框架，而是疊加在 Claude Code、Codex、Cursor、Gemini CLI、OpenCode 等 Agent Host 上方的 **工程行為與品質治理層**。

## 它解決什麼問題

Coding Agent 的主要風險通常不是「完全不會寫程式」，而是會在缺少規格、驗證與品質關卡時快速產生大量看似合理、實際難以維護或沒有被證明正確的變更。Agent Skills 的切入點，是把資深工程師常用的工作節奏與檢查點寫成可重複執行的能力，降低每次都靠臨時提示詞提醒模型的成本。

Repository 將完整開發生命週期整理成 `DEFINE → PLAN → BUILD → VERIFY → REVIEW → SHIP`，並提供 `/spec`、`/plan`、`/build`、`/test`、`/constraints`、`/review`、`/webperf`、`/code-simplify`、`/ship` 等入口。背後不是單一巨大 prompt，而是依任務切換到對應 Skill。

因此它實際解決的是 **Agent 工程流程不一致** 的問題：需求沒有先釐清、任務拆得太大、沒有測試證據、錯誤處理靠猜、review 缺乏固定軸線、效能未量測就最佳化，或發布前沒有明確回滾與觀測條件。

## 核心概念

第一個核心是 **把軟體工程生命週期拆成獨立 Skill**。目前 README 將內容整理成 24 個生命週期 Skill，再加上 `using-agent-skills` 這個負責 discovery 的 meta-skill，共 25 個 Skill。每個能力都有自己的適用條件、流程與驗證關卡，而不是把整套方法塞進一份全域系統提示詞。

第二個核心是 **Skill discovery 與意圖路由**。`using-agent-skills` 會先判斷任務落在哪個開發階段，再導向 `spec-driven-development`、`planning-and-task-breakdown`、`incremental-implementation`、`test-driven-development`、`debugging-and-error-recovery`、`code-review-and-quality` 等對應流程。多個 Skill 也能依任務串接成完整生命週期。

第三個核心是 **驗證優先於「感覺完成」**。Meta-skill 明確要求每個 Skill 都必須有 verification，並把 tests、build、runtime evidence 與 Definition of Done 視為完成條件。這使 Skill 不只告訴 Agent「怎麼產生答案」，也規定「如何證明這次工作成立」。

第四個核心是 **反合理化（anti-rationalization）**。Repository 會直接列出 Agent 常見的逃避模式，例如「這個改動太小不用流程」、「看起來沒問題所以不用測」、「順手把附近程式碼一起整理」。這些規則本質上是在對抗 LLM 為了快速完成任務而自行降低工程標準的傾向。

第五個核心是 **把角色、流程與入口分層**。Repository 自己明確區分：`skills/` 定義「怎麼做」、`agents/` 定義「以什麼角色／觀點做」、slash commands 定義「什麼時候啟動」。這種分層避免把 persona、workflow 與 orchestration 混成單一巨型 Agent。

## 架構與技術

這個 Repository 的主要交付物是文字化 Skill，而不是大型 Runtime，因此 `resource_kind` 判定為 `skill`。主要結構包括：

- `skills/<name>/SKILL.md`：每個 Skill 的主要入口，以 Markdown 與 YAML frontmatter 描述名稱、觸發條件與完整工作流程。
- `skills/using-agent-skills/SKILL.md`：meta-skill，負責依任務意圖選擇適用 Skill，並定義跨 Skill 的共同操作原則。
- `agents/`：可被支援平台使用的工程角色，例如 code reviewer、security auditor、test engineer；角色可以使用 Skill，但不負責任意路由其他 persona。
- `commands/` 與平台專用 command 設定：提供 `/spec`、`/plan`、`/build` 等較短的使用者入口。
- `references/`：放置跨 Skill 共用的 Definition of Done、檢查表與 orchestration 參考資料。
- Skill 內可選的 `scripts/`：只有需要可執行輔助工具時才加入；專案本身強調多數 Skill 為 Markdown-first。
- `.codex-plugin/`、`.claude-plugin/`、`.gemini/`、`.opencode/` 等平台整合資料：把相同核心 Skill 接到不同 Agent Host。

Codex plugin manifest 目前標示版本 `0.6.8`、MIT 授權，並直接指定 `./skills/` 為技能來源。通用安裝可使用開放的 skills CLI：

```bash
npx skills add addyosmani/agent-skills
```

README 表示這條路線可安裝到 70+ 種 Agent；Claude Code、Codex、Gemini CLI、OpenCode、Cursor 等則另有各自的原生或半原生整合方式。

## 主要功能

- **需求與規格**：`interview-me`、`idea-refine`、`spec-driven-development` 用於釐清需求、探索方案與先建立規格。
- **品質約束**：`constraint-driven-development` 把測試、覆蓋率、安全、效能、可及性等品質門檻變成明確約束，而不是開發完成後才補救。
- **任務規劃**：`planning-and-task-breakdown` 將規格拆成小型、可驗證、具有依賴順序的實作單位。
- **增量實作與 TDD**：`incremental-implementation` 與 `test-driven-development` 強調垂直切片、red-green-refactor 與每一步都要可驗證。
- **上下文與來源工程**：`context-engineering` 管理 Agent 需要的專案資訊；`source-driven-development` 要求框架／套件決策回到官方文件驗證。
- **懷疑式驗證**：`doubt-driven-development` 針對高風險或不熟悉的決策做對抗式重新檢查，避免單一路徑推理過度自信。
- **前端、API、安全與效能**：分別提供 UI、介面契約、安全強化與量測優先的效能工作流。
- **除錯與瀏覽器驗證**：將 reproduce、localize、reduce、fix、guard 等步驟固定化，並可搭配 DevTools 做實際 runtime evidence。
- **審查與簡化**：在 merge 前進行多軸 code review，再用 code simplification 降低不必要複雜度。
- **Git、CI/CD、文件、觀測與發布**：涵蓋 atomic commit、持續整合、自動品質關卡、ADR、telemetry、deprecation／migration 與 production launch。
- **跨平台安裝**：同一組 Skill 可透過不同 adapter 被多種 Coding Agent 使用，降低方法論綁定單一供應商的程度。

## 技術亮點

最值得參考的設計，是它把 **Agent 的工程品質問題視為 workflow 問題，而不是只靠換更強模型解決**。模型能力提升可以讓程式碼生成更快，但 spec、feedback loop、review、rollback 與 observability 仍需要顯式流程；Agent Skills 將這些工程約束包成可以版本控制與重複套用的能力。

第二個亮點是 **Meta-skill 作為輕量路由層**。與建立一個大型 orchestrator Agent 相比，`using-agent-skills` 先做意圖分類，再載入必要 Skill；真正的工作規則留在各 Skill 中。這種方式較容易維護，也降低所有規則長期佔用 context 的成本。

第三個亮點是 **品質關卡本身成為 Agent instruction 的第一級內容**。例如先 spec 再 code、測試要提供證據、效能要先量測、安全要看 trust boundary、修改範圍要受控。這些不是補充建議，而是被寫進工作流程與退出條件。

第四個亮點是 **平台適配層與核心方法分離**。核心 Skill 主要仍是 Markdown；不同 Agent Host 的 plugin、rules、commands 或 skill discovery 機制則放在平台專用目錄。這讓同一套工程方法可以跨宿主遷移，而不必為每個 Coding Agent 重寫完整內容。

第五個亮點是 **明確區分 Skill、Persona 與 Command**。這個分層非常適合拿來設計較大型 Agent Harness：Persona 不應同時承擔工作流路由、工具規則與輸出格式；把「誰做」、「怎麼做」、「何時做」拆開，可以減少 Agent configuration 隨功能成長而失控。

## 限制與風險

第一個限制是 **這些流程主要仍由 LLM 解讀與遵循，不是 deterministic workflow engine**。即使 Skill 寫得非常明確，不同模型、不同 Agent Host 與不同工具權限仍可能造成遵循程度差異；Skill 不能取代真正的測試、CI、權限控制或 sandbox。

第二個限制是 **方法論相當有立場，而且偏嚴格**。Spec-first、TDD、原子化任務、固定 review gate、反對未授權重構等原則很適合需要品質控制的工程，但對小型實驗、一次性 prototype 或高度探索性的工作可能帶來額外流程成本。導入時應先決定哪些規則是強制、哪些只在特定風險等級啟動。

第三個限制是 **不同 Host 的能力並不完全等價**。例如 slash command、subagent、plugin、skill auto-discovery、rules file 與權限模型在各平台實作不同；Repository 雖提供多種整合指南，但「同一個 Skill」不代表在每個 Agent 上都具有完全相同的執行語意。

第四個限制是 **單獨安裝某一 Skill 有共享參考資料的可攜性缺口**。README 明確提醒，使用 skills CLI 只安裝單一 Skill 時，可能只複製 `skills/<name>/`，不會帶入 Repository 根層的 `references/`；Skill 本身仍可運作，但部分補充檢查表路徑會失效，專案目前以 issue #361 追蹤此問題。

第五個風險是 **Skill 本身就是 Agent 的行為供應鏈**。安裝第三方 Skill 等於允許外部維護者影響 Agent 的讀寫、命令執行與工程決策方式，因此即使 Repository 採 MIT 授權，也仍應像審查 CI action、IDE plugin 或 automation script 一樣，先閱讀重要 Skill 與權限需求，再決定是否在具有寫入／執行權限的環境啟用。

## 與你的相關性

依公開技術背景，這個專案對 **LLM／Agent** 最直接，因為它提供的不是單點工具，而是一整套 Coding Agent 行為治理與工作流組合方式，可作為設計 Agent workflow、Skill 層與 Harness 規則時的高價值參考。

對 **AI R&D** 也具有高度實務價值。模型實驗、資料處理、推論服務與研究原型同樣需要規格、測試、來源查證、除錯、版本控制與可重現的品質關卡；其中 `source-driven-development`、`context-engineering`、`doubt-driven-development`、TDD 與 observability 特別值得拆解。

對 **AOI × AI／Computer Vision** 的關聯較間接：它沒有提供檢測、分類、分割、OCR 或產線視覺演算法，但可改善相關專案的軟體工程流程、測試與發布紀律。因此這一維度適合視為工程基礎設施價值，而不是 AOI 專用能力。

對 SillyTavern／AI RPG 與影像生成則不是主要定位；只有在這些專案本身需要 Coding Agent 協助開發時，才會透過一般工程流程產生間接價值。

## 建議怎麼使用

建議先 **小範圍試用，而不是一次把 25 個 Skill 全部變成強制規則**。可先挑三到五個最容易驗證價值的能力，例如：

1. `spec-driven-development`：先確認需求與接受條件。
2. `planning-and-task-breakdown`：把大型改動拆小。
3. `test-driven-development`：建立可反駁的 feedback loop。
4. `code-review-and-quality`：固定 merge 前的審查軸線。
5. `source-driven-development` 或 `doubt-driven-development`：處理高風險、陌生技術或需要官方文件支撐的任務。

若目前使用的 Agent Host 已有自己的 `AGENTS.md`、rules 或專案工作流，應先處理規則優先順序與重疊問題，避免同一任務同時被多套互相衝突的 Skill／policy 約束。

因此給予 `TRY` 與 `INTEGRATE`：它可以直接選擇部分 Skill 放入既有 Coding Agent 流程，而且跨多種 Host。也給予 `LEARN` 與 `REFERENCE`，因為即使不採用整套內容，它對 lifecycle routing、verification gate、anti-rationalization，以及 Skill／Persona／Command 分層的設計都很值得作為 Agent 系統工程參考。

## 與其他收藏的關聯

- [Skills For Real Engineers](./github-mattpocock-skills.md)：同樣是通用軟體工程 Agent Skill 庫。兩者都把 TDD、除錯、規格與 review 等工程方法轉成可重用能力；Agent Skills 更強調完整 `DEFINE → PLAN → BUILD → VERIFY → REVIEW → SHIP` 生命週期與跨 Host adapter，而 Skills For Real Engineers 更突出可組合的小型 discipline、共享 domain context 與使用者／模型觸發邊界。兩者適合並列比較 Skill library 的治理方式。
- [Scientific Agent Skills](./github-k-dense-ai-scientific-agent-skills.md)：兩者都把可重用能力從 Agent Runtime 分離，但定位不同。Agent Skills 封裝的是通用軟體工程方法與品質關卡；Scientific Agent Skills 則把科學資料庫、研究工具與領域工作流程封裝成能力。前者適合建立「Agent 怎麼工程化工作」，後者適合研究「Agent 如何取得專業領域能力」。

## 使用者備註

## 更新紀錄

### 2026-09-03

- 建立 Knowledge Card，依 Repository README、`AGENTS.md`、`using-agent-skills` meta-skill 與 Codex plugin manifest 整理目前架構、工作流程與跨平台整合方式。
