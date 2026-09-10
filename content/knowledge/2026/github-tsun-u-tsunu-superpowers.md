---
schema_version: 1
id: github-tsun-u-tsunu-superpowers
title: Tsunu Superpowers
canonical_url: https://github.com/Tsun-u/tsunu-superpowers
source:
  type: github
  url: https://github.com/Tsun-u/tsunu-superpowers
  identity: github:tsun-u/tsunu-superpowers
resource_kind:
  ai: skill
  user: null
created_at: 2026-09-10
updated_at: 2026-09-10
last_checked_at: 2026-09-10
summary: Tsunu Superpowers 是一套面向 Codex 與 Claude Code 的正體中文流程紀律框架，以 13 個可組合 skill 把任務分流、思考整理、規劃、驗收標準、執行、驗證、審查與交付串成自適應工作流，並依宿主能力支援本 session、子代理、跨 session 通道與混合並行。
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
      - Codex
      - Claude Code
      - workflow-orchestration
      - task-triage
      - acceptance-criteria
      - TDD
      - subagent
      - cross-session
      - git-worktree
      - plugin
      - zh-TW
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
    - INTEGRATE
    - LEARN
    - REFERENCE
  user: null
status:
  ai: active
  user: null
---

# Tsunu Superpowers

## 一句話介紹

Tsunu Superpowers 是一套供 Codex 與 Claude Code 載入的正體中文 Agent Skill／流程框架，把「先判斷任務需要多嚴謹，再決定要走多完整的流程」做成可重用的工作流骨架，而不是要求所有任務都套同一套重流程。

## 它解決什麼問題

Coding Agent 與通用 Agent 常見的問題不是缺少生成能力，而是缺少穩定的工作紀律：簡單任務可能被過度規劃，複雜任務又可能直接動手；執行途中容易跳步、沒有明確驗收標準，或把子代理回報直接當成已驗證結果。

Tsunu Superpowers 的切入點是先做任務分流，再按風險與任務性質調整流程強度。它把程式開發、研究、內容製作、AI 算圖與日常互動分成「嚴謹、混合、創意」三類，嚴謹任務走完整流程，混合任務只保留必要的需求確認與品質驗證，創意任務則避免被工程流程綁死。

## 核心概念

1. **任務分流先於流程選擇**：`triage` 先判斷是否已有特化 skill，再依任務性質決定流程深度。這讓框架成為安全網，而不是每次都強制完整流程。
2. **先定義完成條件再執行**：`acceptance` 把測試驅動開發（TDD）的 Red-Green 思路泛化成「先定義怎樣算做好，再開始做」，適用範圍不只程式碼，也涵蓋研究、部署、內容與圖像任務。
3. **流程骨架與特化 skill 分離**：框架負責 `brainstorm`、`plan`、`execute`、`verify` 等通用階段；既有專用 skill 可以透過 frontmatter 標注任務性質、模組與依賴關係後接入，不必重寫。
4. **執行模式依宿主能力降級**：`execute` 定義本 session、原生子代理、跨 session 通道與混合並行四種模式；跨 session 能力不存在時，明確退回本 session 或子代理，不假設不存在的工具。
5. **代理產出仍需獨立驗證**：子代理或其他 session 的回報不是完成證據，主 session 必須重新檢查結果、驗證與整合衝突。

## 架構與技術

Repository 主要由 Markdown 型 `SKILL.md`、Codex／Claude Code plugin manifest，以及 SessionStart hook 組成。官方 README 列出 13 個 skill，分成流程骨架、通用流程、協作與審查、收尾與工具等模組。

流程大致可理解為：

```text
entry
  ↓
triage
  ├─ 特化 skill 已存在且任務明確 → 直接交給特化 skill
  ├─ 任務模糊 → brainstorm
  └─ 無特化 skill
       ├─ 嚴謹 → brainstorm → plan → acceptance → execute → verify
       ├─ 混合 → 簡化需求確認 → 執行 → 品質驗證
       └─ 創意 → 輕量規則下直接執行
```

`execute` 再把實作分為四種執行模式：

```text
本 session 逐步
原生子代理
跨 session 通道委派
混合並行
```

Codex 端透過 `.codex-plugin/plugin.json` 宣告 plugin metadata、skills 目錄與互動／寫入能力；Claude Code 端有對應 `.claude-plugin/plugin.json`。Claude SessionStart hook 會讀入 `skills/entry/SKILL.md`，將入口規則注入 session context；README 也明確指出 Codex 不使用這個 Claude hook，而是依 Codex plugin 與 skill 機制觸發。

專案目前版本為 `0.2.0`，採 MIT License；GitHub Repository 於 2026-06-02 建立，2026-09-10 仍有更新。

## 主要功能

- **13 個可組合 skill**：涵蓋 `entry`、`triage`、`brainstorm`、`plan`、`execute`、`acceptance`、`verify`、`debug`、`collaborate`、`review`、`deliver`、`worktree`、`write-skill`。
- **三段式任務分流**：依「嚴謹／混合／創意」調整流程強度，避免簡單任務也被完整軟體工程流程拖慢。
- **驗收標準前置**：要求在動手前先定義完成條件；對程式開發採強 TDD 立場，對研究、部署、圖像與內容任務則使用對應的品質清單。
- **多模式執行**：可在目前 session 逐步做，也可派原生子代理；只有環境真的提供 Switchboard、wake-cc 等通道時才啟用跨 session 委派。
- **執行中審查與整合**：本 session 每 2–3 個任務設 review 檢查點；子代理與跨 session 結果回來後要求主代理獨立驗證。
- **特化 skill 接入**：可在既有 `SKILL.md` frontmatter 使用 `tsunu-superpowers` 區塊描述任務性質、模組與依賴，讓框架知道何時應直接路由或拆模組執行。
- **Codex／Claude Code plugin 封裝**：提供 Codex marketplace 與 Claude Code local marketplace 的安裝方式。

## 技術亮點

最大的價值是把「Agent 應該怎麼工作」從單一巨大 system prompt 拆成可路由的 skill graph。`entry`／`triage` 負責決定要不要進入完整流程，後續模組各自承擔規劃、驗收、執行、驗證等責任，這種分離比把所有規則永久塞進上下文更容易維護與替換。

第二個亮點是它沒有把「多代理」當成必須條件。`execute` 先看宿主有沒有原生子代理或跨 session 通道，再選擇執行模式；這讓同一套流程可以在不同 Agent Runtime 上使用，而不是綁死特定通訊工具。

第三個值得參考的是把驗收條件抽象成跨任務型別的通用品質閘門。雖然 TDD 是程式工程概念，但專案將其核心重新表述為「定義成功 → 確認基線尚未成功 → 執行 → 驗證成功」，這對研究、文件、部署與生成式工作也能成立。

## 限制與風險

目前仍屬早期專案：版本為 `0.2.0`，截至 2026-09-10 GitHub 顯示 0 stars、0 forks，尚缺乏廣泛採用訊號。Repository tree 主要是 skill 文件、plugin manifest 與 hook，未見自動化測試或 CI workflow，因此流程規則本身的品質目前較依賴人工維護與實際使用回饋。

框架多數約束是提示詞層級的行為規範，而不是 Runtime 強制執行機制。像「一定先寫驗收標準」、「每 2–3 個任務 review」、「子代理結果必須重新驗證」等，最終仍取決於宿主 Agent 是否遵循 skill 指令。

部分規則採相當強的工程立場，例如 `acceptance` 對程式開發要求嚴格 TDD，甚至主張先寫產品程式碼時應刪除後重來。這可提升紀律，但在原型探索、遺留系統修改或一次性腳本等情境，可能需要另外設計例外策略。

跨 session 協作不是內建 Runtime；它只在環境已有 Switchboard、wake-cc 或其他可驗證通道時使用。因此這部分能力取決於外部宿主，不能把 Repository 本身視為完整的多代理編排系統。

## 與你的相關性

依公開技術背景來看，這個專案與 **LLM／Agent** 與 **AI R&D** 的相關性很高。它不是模型、RAG 或推理演算法，而是 Agent 執行層的流程治理：如何路由任務、控制流程深度、定義完成條件、使用子代理、驗證結果，以及讓既有 skill 接到共同骨架上。

對 AOI × AI 的價值較間接，主要可用於把資料處理、模型實驗、評估、部署等工作建立一致的驗收與審查流程。對 SillyTavern／AI RPG 也有一定參考價值，尤其是任務分流、角色／代理工作模組化與跨 session 協作概念；但它本身不是角色記憶或敘事系統。

## 建議怎麼使用

- **INTEGRATE**：如果目前已有 Codex 或 Claude Code 的自訂 skill，可先挑一兩個高風險工程工作流接上 `triage`、`acceptance`、`verify`，觀察流程成本與穩定性，而不是一次全面套用。
- **LEARN**：值得研究它如何把大型 Agent 工作規則拆成入口路由、流程階段與特化模組，尤其適合作為自建 Agent harness 或 skill framework 的設計參考。
- **REFERENCE**：可用來和其他 Agent Skills／Codex 工程工作流比較「流程強度調整、驗收閘門、子代理委派、Runtime 相依性」等設計差異。

## 與其他收藏的關聯

- [Agent Skills](./github-addyosmani-agent-skills.md)：同樣把資深工程工作法封裝成 Agent Skills；Tsunu Superpowers 更強調三類任務分流與通用流程骨架。
- [Codex Engineering System 繁體中文版](./github-ai72dope-codex-engineering-system-zh-tw.md)：同樣重視依任務複雜度調整工程流程與驗證；可比較兩者在路由粒度、TDD 強度與 skill 模組化上的取捨。
- [DeepSeek Harness 繁體中文版](./github-g36maid-deepseek-harness.md)：後者更偏完整 Agent Runtime／plugin 架構；Tsunu Superpowers 則是建立在宿主之上的流程與行為層，兩者可用來區分「Runtime harness」與「workflow discipline layer」。

## 使用者備註



## 更新紀錄

### 2026-09-10

- 建立 Knowledge Card。
