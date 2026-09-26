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
navigation:
  categories:
    ai:
      - Agent / Harness
      - AI Coding / DevTools
    user: null
created_at: 2026-08-21
updated_at: 2026-09-26
last_checked_at: 2026-09-26
summary: Pi 是以 TypeScript 為主的開源 Agent harness 與 Coding Agent 工具組，將多供應商模型介面、Agent Runtime、持久化對話／任務／文件、應用組合與 RPC、互動式 Coding Agent CLI、終端介面及遙測拆成可組合套件；適合作為 Agent 平台、Coding Agent 與模型供應商抽象層的工程參考。
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
      - agent-harness
      - agent-runtime
      - tool-calling
      - durable-runtime
      - multi-provider-llm
      - rpc
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

Pi 是一套開源 Agent harness 與 Coding Agent 工具組，把多供應商模型介面、Agent 執行核心、持久化執行資料、應用組合／RPC、互動式 Coding Agent CLI、終端介面與遙測拆成可組合套件；既可以直接使用 Coding Agent，也能抽取底層元件建立自己的 Agent 系統。

## 它解決什麼問題

建立 Agent 或 Coding Agent 時，工程團隊通常要分別處理模型供應商差異、串流回應、工具呼叫、狀態與工作階段管理、持久化資料、終端互動、服務組合與可觀測性。Pi 將這些能力集中在同一個 monorepo，降低從模型介接一路搭到可長時間運作 Agent 的重複工程成本。

它不是只提供單一聊天 CLI。Repository 同時提供較底層的模型 API、Agent Runtime、持久化儲存與應用組合元件，因此可以把完整 Coding Agent 當成成品使用，也能只採用其中一層。

## 核心概念

Pi 的主要設計是分層組合，而不是把所有能力綁在單一應用程式中：

- `pi-ai` 統一 OpenAI、Anthropic、Google 等多家模型供應商，並把 provider、模型目錄、驗證與串流行為封裝成一致介面。
- `pi-agent-core` 提供一般用途 Agent Runtime，涵蓋工具呼叫、狀態管理、附件、harness context、session 與 runtime reducer 等能力。
- `pi-durable` 提供持久化對話、任務與文件 Runtime，內建記憶體、JSONL 與 SQLite 儲存實作。
- `chord` 是獨立的應用組合 Runtime，用於服務、複寫狀態、RPC 與外掛。
- `pi-coding-agent` 在上述基礎上提供互動式 Coding Agent CLI。
- `pi-tui` 提供差異化渲染的終端使用者介面元件。
- `pi-telemetry` 提供供應商中立的遙測契約、參考 Adapter、一致性測試與型別化 Schema。

這種結構使 Pi 從「Coding Agent 成品」延伸成一套可拆解的 Agent 平台元件集合：模型層、執行層、持久化層、應用組合層與使用者介面層可以各自採用。

## 架構與技術

Repository 主要以 TypeScript 開發，採多套件 monorepo。核心套件目前包含 `packages/ai`、`packages/agent`、`packages/durable`、`packages/chord`、`packages/coding-agent`、`packages/tui` 與 `packages/telemetry`。

`pi-ai` 採 provider 導向設計：每個 provider 負責模型目錄、驗證與串流行為，底層再共用 OpenAI Responses、OpenAI Completions、Anthropic Messages 等 API 實作。這讓應用程式可以用統一集合查詢模型與切換供應商，同時保留供應商特有的驗證與 API 能力。

`pi-durable` 把可持久化的對話、任務與文件資料拆成儲存契約，提供 Memory、JSONL 與 SQLite 後端；JSONL 與 SQLite 也有各自的持久化與一致性限制，方便第三方後端依同一契約實作。

開發流程提供 `npm run build`、`npm run build:offline`、`npm run check` 與測試腳本；Coding Agent 也支援以 Bun 編譯獨立執行檔。專案對供應鏈風險有明確工程措施，包括直接外部相依套件鎖定精確版本、以 `package-lock.json` 作為相依關係基準、發布 CLI 時使用 `npm-shrinkwrap.json` 固定間接相依套件，以及在 CI 執行 npm audit 與簽章檢查。

## 主要功能

- 多供應商模型介面：透過 `pi-ai` 統一大量模型供應商、模型目錄、驗證與串流操作。
- Agent Runtime：透過 `pi-agent-core` 處理工具呼叫、狀態、附件、工作階段與 harness 執行流程。
- 持久化 Runtime：`pi-durable` 提供對話、任務、文件的 durable record 與 Memory／JSONL／SQLite 儲存。
- 應用組合與 RPC：`chord` 提供服務、複寫狀態、RPC 與外掛組合能力。
- Coding Agent CLI：提供 `read`、`bash`、`edit`、`write` 等工具與工作階段管理，可直接在終端進行程式開發。
- 終端介面：`pi-tui` 提供差異化渲染能力，可支撐互動式終端應用。
- 遙測：提供供應商中立的遙測契約、Adapter、一致性測試與型別化 Schema。
- 隔離部署指引：文件提供 Plain Docker、Docker Sandboxes、OpenShell 與 Gondolin 等模式，對應不同的程序、工具與憑證隔離需求。

## 技術亮點

最值得參考的是 Pi 把模型抽象層、Agent 執行核心、持久化資料與 Coding Agent 應用層清楚分離。對自行打造 Agent 平台的人而言，可以研究從 Provider abstraction、tool calling、session、durable storage、RPC 到 CLI/TUI 的完整垂直切面，而不必把某個完整 Coding Agent 當成不可拆解的黑盒。

`pi-durable` 也讓架構重點從「單次 Agent loop」往「長時間存在的對話、任務與文件狀態」移動。它不是只在應用層把聊天紀錄寫檔，而是把儲存後端與一致性測試抽象成可替換契約，對需要 durable agent workflow 的系統設計具有參考價值。

另一個亮點是供應鏈安全工程。專案把版本鎖定、lockfile 檢查、shrinkwrap、生命週期腳本 allowlist、release smoke test 與 audit 納入實際開發／發布流程；對通常具高本機權限的 Agent 工具而言，這些措施比單純的安全宣告更具工程價值。

## 限制與風險

Pi 明確表示本身沒有內建檔案系統、程序、網路或憑證存取的權限限制機制；預設會繼承啟動它的使用者與程序權限。若讓 Coding Agent 執行不受信任的指令或工具，這是最重要的安全邊界。

隔離方式也不是等價的。整個 Pi 程序放入 Docker、Docker Sandboxes 或 OpenShell，可以限制 Pi 與 extension 的執行環境；Gondolin 模式則主要把內建工具與 `!` 指令導向 micro-VM，其他未委派的 extension tool 仍可能在主機執行，而且主機環境變數可能被帶入 VM。採用工具級隔離時，不能把它誤認成完整程序或憑證隔離。

`pi-durable` 目前也有明確的儲存邊界：JSONL 與 SQLite 後端都要求單一 owner 序列化寫入，不提供跨程序鎖定或 ID 配置；Node SQLite 使用 WAL 與 `synchronous = NORMAL`，程序崩潰後已確認提交可保留，但主機或電源故障時最新提交仍可能遺失。若要做多程序或高耐久工作流，需要自行評估後端策略。

此外，統一多模型供應商介面雖能降低整合成本，各家模型 API 的能力與語意仍不完全相同；實際整合時仍應驗證特定模型、工具呼叫、串流與驗證流程，而不能假設所有 Provider 完全等價。

## 與你的相關性

依公開技術背景，Pi 對 AI R&D、LLM 與 Agent 工作具有高度直接價值。它不只涵蓋模型供應商抽象與工具呼叫，現在也包含工作階段、持久化 Runtime、RPC／服務組合、遙測與 Coding Agent，可以作為研究或建立 Agent 基礎架構時的完整工程參考。

對 AOI × AI 的直接關聯較低，但若工業 AI 工作流程需要 Agent 編排模型、操作開發工具、保存長期任務狀態或串接服務，Pi 的 Runtime、durable storage 與多供應商模型介面仍可作為底層參考。對 AI RPG／角色型 Agent 則有間接價值，尤其是 Agent loop、session 與持久化對話資料；但 Repository 本身不是角色扮演、世界觀或角色記憶產品。

## 建議怎麼使用

建議先 `TRY` Coding Agent CLI，實際觀察終端互動、工具使用、工作階段與模型切換體驗；再以 `LEARN` 角度分別閱讀 `pi-ai`、`pi-agent-core`、`pi-durable` 與 `chord`，理解模型供應商、Agent Runtime、持久化與應用組合如何解耦。

同時值得列為 `REFERENCE`：若要自行設計 Coding Agent、Agent SDK、durable agent workflow 或模型供應商抽象層，可用 Pi 比較 API 邊界、session／storage 契約、RPC、工具呼叫、TUI、遙測與安全隔離策略。

## 與其他收藏的關聯

目前不建立未經驗證的具體 Card 連結。概念上可與 Coding Agent、Agent Runtime、多模型供應商 API、durable workflow、工具呼叫與 Agent 基礎架構類收藏一起比較。

## 使用者備註


## 更新紀錄

### 2026-09-26

- 重新檢查目前 `main` 與核心套件；補入 `chord` 應用組合 Runtime 與 `pi-durable` 持久化對話／任務／文件 Runtime。
- 更新 Agent Runtime、Provider abstraction 與隔離部署說明，補充 Gondolin 工具級隔離與 durable storage 的一致性／耐久性限制。
- 保留既有使用者擁有欄位與備註；Relevance 與 Action 維持不變。

### 2026-08-21

- 建立 Pi Agent Harness Knowledge Card。