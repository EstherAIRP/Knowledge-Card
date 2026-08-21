---
schema_version: 1
id: earendil-works-pi
title: Pi Agent Harness
canonical_url: https://github.com/earendil-works/pi
source:
  type: github
  url: https://github.com/earendil-works/pi
  identity: github:earendil-works/pi
resource_kind:
  ai: project
  user: null
created_at: 2026-08-21
updated_at: 2026-08-21
last_checked_at: 2026-08-21
summary: Pi 是以 TypeScript 為主的開源 AI Agent 工具組，將多供應商 LLM API、工具呼叫與狀態管理的 Agent Runtime、互動式 Coding Agent CLI、終端介面與遙測契約整合在同一套 monorepo；適合作為 Agent 基礎架構、Coding Agent 與模型供應商抽象層的實作參考。
classification:
  categories:
    ai:
      - Agent
      - LLM
      - AI Coding / DevTools
    user: null
  tags:
    ai:
      - coding-agent
      - agent-runtime
      - tool-calling
      - multi-provider-llm
      - terminal-ui
      - telemetry
      - TypeScript
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
    - TRY
    - LEARN
    - REFERENCE
  user: null
status:
  ai: active
  user: null
---

# Pi Agent Harness

## 一句話介紹

Pi 是一套開源 AI Agent 工具組，把統一的多供應商 LLM API、Agent Runtime、互動式 Coding Agent CLI、終端使用者介面與遙測契約拆成可組合套件，讓開發者可以直接使用 Coding Agent，也能把底層元件拿來建立自己的 Agent 系統。

## 它解決什麼問題

建立 Agent 或 Coding Agent 時，工程團隊通常要分別處理不同模型供應商 API、串流回應、工具呼叫、狀態管理、終端互動與執行流程。Pi 將這些常見能力整理成同一個 monorepo，降低從模型介接一路搭到可互動 Agent 的重複工程成本。

它不是只提供單一聊天 CLI：Repository 同時暴露較底層的模型 API 與 Agent Runtime，因此可把完整 Coding Agent 當成成品使用，也能只採用其中的基礎套件。

## 核心概念

Pi 的主要設計是分層而非把所有能力綁在單一應用程式中：

- `pi-ai` 統一 OpenAI、Anthropic、Google 等多家模型供應商的 LLM 介面。
- `pi-agent-core` 提供工具呼叫與狀態管理所需的 Agent Runtime。
- `pi-coding-agent` 在上述基礎上提供互動式 Coding Agent CLI。
- `pi-tui` 提供差異化渲染的終端使用者介面元件。
- `pi-telemetry` 提供供應商中立的遙測契約、型別化 Schema、參考 Adapter 與一致性測試。

這種拆分讓 Pi 同時具備「可直接使用的 Agent」與「可嵌入其他產品的 Agent 基礎元件」兩種價值。

## 架構與技術

Repository 主要以 TypeScript 開發，採多套件 monorepo 結構。核心套件包含 `packages/ai`、`packages/agent`、`packages/coding-agent`、`packages/tui` 與 `packages/telemetry`。

開發流程提供 `npm run build`、`npm run build:offline`、`npm run check` 與測試腳本；正式發布也支援從 release source 建置獨立執行檔，建置流程會編譯 Bun executable 並打包執行所需資產。

專案對供應鏈風險有明確工程措施，包括直接外部相依套件鎖定精確版本、以 `package-lock.json` 作為相依關係基準、發布 CLI 時使用 `npm-shrinkwrap.json` 固定間接相依套件，以及在 CI 執行 npm audit 與簽章檢查。

## 主要功能

- 多供應商 LLM API：透過 `pi-ai` 統一不同模型供應商的呼叫介面。
- Agent Runtime：透過 `pi-agent-core` 處理工具呼叫與狀態管理。
- Coding Agent CLI：提供可直接在終端使用的互動式程式開發 Agent。
- 終端介面：`pi-tui` 提供差異化渲染能力，可支撐互動式終端應用。
- 遙測：提供供應商中立的遙測契約、Adapter 與型別化 Schema。
- 容器化／沙箱部署指引：文件提供 Gondolin extension、Docker 與 OpenShell 三種隔離模式。

## 技術亮點

最值得參考的是 Pi 把模型抽象層、Agent 執行核心與 Coding Agent 應用層清楚分離。對需要自行打造 Agent 平台的人而言，可以直接研究從 LLM Provider abstraction、tool calling、state management 到 CLI/TUI 的完整垂直切面，而不必把某個完整 Coding Agent 當成不可拆解的黑盒。

另一個亮點是供應鏈安全工程。專案不只在文件上提醒風險，而是把版本鎖定、lockfile 檢查、shrinkwrap、生命週期腳本 allowlist、release smoke test 與 audit 納入實際開發／發布流程，對 Agent 類工具尤其值得參考，因為這類工具通常具有較高的本機執行權限。

## 限制與風險

Pi 明確表示本身沒有內建檔案系統、程序、網路或憑證存取的權限限制機制；預設會繼承啟動它的使用者與程序權限。若讓 Coding Agent 執行不受信任的指令或工具，這是重要的安全邊界。

因此，需要較強隔離時應搭配容器或沙箱。專案文件提出多種部署模式，但隔離強度與操作複雜度仍由採用者自行取捨。

此外，統一多模型供應商介面雖能降低整合成本，各家模型 API 的能力與語意仍可能不同；實際整合時仍應驗證特定模型、工具呼叫與串流行為，而不能假設所有 Provider 完全等價。

## 與你的相關性

依公開技術背景，Pi 對 AI R&D、LLM 與 Agent 工作具有高度直接價值。它同時涵蓋模型供應商抽象、Agent Runtime、工具呼叫、狀態管理、Coding Agent 與終端互動，可作為研究或建立 Agent 基礎架構時的完整工程參考。

對 AOI × AI 的直接關聯較低，但若工業 AI 工作流程需要 Agent 操作開發工具、分析程式碼或編排模型／工具，Pi 的 Runtime 與多供應商模型介面仍可作為底層元件。對 AI RPG／角色型 Agent 則有間接價值，尤其是 Agent loop、狀態管理與工具架構；但 Repository 本身不是角色扮演或長期角色記憶框架。

## 建議怎麼使用

建議先 `TRY` Coding Agent CLI，實際觀察它的終端互動、工具使用與模型切換體驗；再以 `LEARN` 角度閱讀 `pi-ai` 與 `pi-agent-core` 的分層方式，理解多供應商模型抽象與 Agent Runtime 如何解耦。

同時值得列為 `REFERENCE`：若未來需要自行設計 Coding Agent、Agent SDK 或模型供應商抽象層，可用 Pi 比較 API 邊界、工具呼叫、狀態管理、TUI 與安全隔離策略。

## 與其他收藏的關聯

目前不建立未經驗證的具體 Card 連結。概念上可與 Coding Agent、Agent Runtime、多模型供應商 API、工具呼叫與 Agent 基礎架構類收藏一起比較。

## 使用者備註


## 更新紀錄

### 2026-08-21

- 建立 Pi Agent Harness Knowledge Card。
