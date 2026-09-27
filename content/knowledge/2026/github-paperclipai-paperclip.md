---
schema_version: 1
id: github-paperclipai-paperclip
title: Paperclip
canonical_url: https://github.com/paperclipai/paperclip
source:
  type: github
  url: https://github.com/paperclipai/paperclip
  identity: github:paperclipai/paperclip
resource_kind:
  ai: project
  user: null
navigation:
  categories:
    ai:
      - Agent / Harness
      - Automation / Productivity
      - Infrastructure / Security
    user: null
created_at: 2026-09-27
updated_at: 2026-09-27
last_checked_at: 2026-09-27
summary: Paperclip 是面向多 Agent 團隊的開源控制平面，把公司目標、組織角色、任務、心跳執行、預算、審批、成本與稽核集中到同一套系統，並透過多種 Agent adapter、外掛與 MCP 擴充不同執行環境。
classification:
  categories:
    ai:
      - Agent
      - LLM
      - AI Coding / DevTools
      - Infrastructure / Deployment
    user: null
  tags:
    ai:
      - multi-agent-orchestration
      - agent-control-plane
      - heartbeat-runtime
      - task-orchestration
      - agent-governance
      - budget-control
      - agent-adapter
      - plugin-system
      - MCP
      - PostgreSQL
      - React
      - TypeScript
      - self-hosted
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
    - TRY
    - LEARN
    - REFERENCE
  user: null
status:
  ai: active
  user: null
---

# Paperclip

## 一句話介紹

Paperclip 是一套給多 Agent 團隊使用的開源控制平面（control plane）：它把「要達成什麼目標、誰負責、何時喚醒 Agent、花了多少成本、哪些動作需要核准、執行結果如何追蹤」整合成可操作的組織與任務系統，而不是只提供另一個聊天介面。

## 它解決什麼問題

當同時使用多個 Claude Code、Codex、OpenClaw、Cursor 或其他 Agent 時，真正困難的通常不是再多啟動一個模型，而是如何管理持續運作的工作：

- 誰正在做哪件事，任務是否重複執行。
- Agent 是否知道任務與上層目標的關係，而不只看到孤立提示詞。
- 執行中斷、重新啟動或下一次喚醒後，是否能延續工作狀態。
- 如何限制預算與 token 成本，避免失控循環。
- 哪些動作需要人工核准，以及事後如何追溯誰做了什麼。
- 不同供應商、CLI、HTTP Agent 與工具如何放進同一個營運模型。

Paperclip 的切入點是把這些問題視為「組織運作」而非「對話管理」：用公司、目標、專案、任務、角色、回報關係、預算與審批來描述 Agent 團隊。

## 核心概念

### 1. Agent 是組織中的工作者

Paperclip 將 Agent 放進組織圖，賦予角色、職責、回報關係、權限與預算。這讓協作模型從「多個獨立終端機」變成可管理的組織結構。

### 2. 心跳式執行

Agent 不必常駐無限循環，而是透過心跳（heartbeat）在短執行窗口內工作。官方 runtime 文件列出四種喚醒來源：

- `timer`
- `assignment`
- `on_demand`
- `automation`

若 Agent 已經執行中，新的喚醒會合併，而不是直接啟動重複工作。

### 3. 持久任務與工作階段

對支援續接的 adapter，Paperclip 會保存 session ID，下一次 heartbeat 可沿用既有工作階段。任務本身也保留公司、專案、目標與父任務脈絡，減少每次執行都重新拼裝背景資訊的需求。

### 4. 治理與成本是一等公民

預算、審批、權限、活動紀錄與取消／暫停 Agent 都不是外掛式補丁，而是控制平面的核心概念。README 也特別強調任務 checkout 與預算限制的原子性，目標是避免重複領取工作與失控花費。

### 5. 自帶 Agent，而不是綁單一模型

Paperclip 將執行環境抽象成 adapter。官方文件目前涵蓋 Claude Code、Codex、OpenCode、Cursor、Pi、Hermes、OpenClaw，以及一般 process／HTTP 類型；程式碼也將多個 adapter 拆成獨立 workspace package。

### 6. 擴充能力分層

除了 adapter，專案還提供外掛系統與 MCP server。這讓「Agent 執行環境」、「Paperclip 功能擴充」與「工具協定」可以分開演進，而不是全部塞進核心伺服器。

## 架構與技術

Paperclip 是 TypeScript 為主的 monorepo，使用 pnpm 管理 workspace，目前根專案要求 Node.js 24.11 以上。

主要組成包括：

- **Server**：Node.js + Express 5，使用 Drizzle ORM；資料庫可直接啟動內嵌 PostgreSQL，也可接外部 PostgreSQL。
- **Web UI**：React 19 + Vite 8，搭配 TanStack Query、React Router 等前端工具。
- **Agent runtime**：heartbeat queue、session resume、執行紀錄、成本事件、adapter 啟動與喚醒合併。
- **Adapter packages**：將不同 Agent runtime 與 Paperclip 的工作模型接起來。
- **MCP server**：獨立 package 使用 Model Context Protocol SDK，提供 MCP 介面。
- **Plugin system**：已有早期 runtime 與管理介面，同時保留較完整的目標規格；核心治理仍由 Paperclip 本身掌握。
- **資料層**：Drizzle schema 與 migration，開發／快速安裝可使用內嵌 PostgreSQL，正式環境可切換一般 PostgreSQL。
- **即時更新**：runtime 文件描述瀏覽器端會接收 Agent 狀態、heartbeat、任務與成本等即時變化。

快速體驗路徑目前是：

```sh
npx paperclipai onboard --yes
```

預設會使用本機 loopback 的 trusted local 模式，並以內嵌 PostgreSQL 降低初次安裝門檻。

## 主要功能

- **組織與角色管理**：建立公司、Agent、職稱、回報關係與責任邊界。
- **目標與任務系統**：讓任務保留從公司目標往下的脈絡，支援指派、父子任務與阻塞關係。
- **Heartbeat 執行**：依排程、指派、人工觸發或自動化事件喚醒 Agent。
- **預算與成本控制**：追蹤 Agent 花費，並可設定預算與停止條件。
- **治理與審批**：對人員、策略與工作結果保留人工介入與核准節點。
- **持久 session**：支援的 adapter 可跨多次 heartbeat 續接工作上下文。
- **多種 Agent adapter**：將不同 CLI、gateway、HTTP 或其他執行方式納入同一控制平面。
- **Skills / Evals / Plugins**：專案已把技能管理、Agent 評估與功能擴充納入產品架構。
- **多組織管理**：同一部署可管理多個 company，資料物件以 company scope 隔離。
- **活動與稽核**：保留執行紀錄、動作歸屬與工作歷程，方便追查 Agent 行為。

## 技術亮點

### 把「多 Agent」問題上移到控制平面

Paperclip 最有價值的地方不是「讓 Agent 可以互相聊天」，而是把多 Agent 系統常見的營運問題提升成控制平面能力：任務歸屬、喚醒、續接、預算、審批、權限與可觀測性都具有明確資料模型。

### Heartbeat 比永久迴圈更容易治理

以短執行窗口配合排程與事件喚醒，可以在每次執行之間重新做預算、狀態與權限檢查。對長時間自主 Agent 而言，這種模型通常比單一無限 loop 更容易停止、稽核與恢復。

### 持久狀態不等於只保存聊天記錄

Paperclip 同時保存任務結構、目標祖先、session、run、成本與活動紀錄。這種設計把「上下文延續」拆成多個可檢查的狀態，而不是把全部責任丟給模型上下文視窗。

### Adapter、Plugin、MCP 分工清楚

不同 Agent runtime 使用 adapter；產品層擴充使用 plugin；標準化工具介面則可經 MCP。這三種擴充面向沒有被混成單一萬能介面，對大型 Agent 平台的演進比較有利。

### 本機啟動門檻低，但仍保留正式部署路徑

快速安裝可直接使用內嵌 PostgreSQL；需要正式環境時再切換外部 PostgreSQL、驗證模式與不同 bind／曝光策略。這讓開發體驗與部署治理可以使用同一套資料模型。

## 限制與風險

### 本機 CLI Agent 可能直接取得主機權限

官方 runtime 文件明確指出，本機 CLI adapter 是未沙箱化執行。若 Agent 的工作目錄、環境變數或憑證權限過大，Paperclip 的任務治理並不能取代作業系統層級的隔離。實際使用仍應採最小權限、限制工作目錄，必要時使用 sandbox／遠端執行環境。

### 外掛系統仍有明確的單機假設

目前外掛實作仍偏向 self-hosted、單節點、持久檔案系統：

- 外掛 UI 是同源 JavaScript，應視為受信任程式碼，而不是前端安全沙箱。
- capability 主要限制 worker 端 host RPC，不能把同源 UI 視為完整安全邊界。
- 安裝依賴可寫入的本機檔案系統、npm 與套件 registry。
- 尚未完整處理多節點／暫態主機的外掛分發與同步。

因此外掛規格中描述的完整目標架構，不應全部視為目前已完成能力。

### 專案變動速度高

ROADMAP 明確說明優先級會調整。這類快速成長的 Agent 平台在 API、adapter、部署模型與文件上都可能持續變化，導入前應固定版本並驗證升級策略。

### Memory / Knowledge 仍在 roadmap

專案雖已有 session、任務脈絡與活動歷史，但 roadmap 中更完整的 Memory / Knowledge 仍是待辦方向。若需求是成熟的長期語意記憶或知識庫，不應直接假設 Paperclip 已經提供完整解法。

### 治理不等於結果正確

預算、審批、session persistence 與 audit log 可以降低失控風險，但不能保證 Agent 的程式碼、研究結論或業務決策正確。高風險輸出仍需要獨立驗證。

## 與你的相關性

依公開技術背景，Paperclip 對 **LLM／Agent** 與 **AI R&D** 的關聯非常高。它可作為研究多 Agent orchestration、agent runtime、任務狀態、治理、成本控制與 adapter 架構的完整工程案例，而不只是一個 Agent UI。

對 **AOI × AI** 的直接關聯較低，因為它不處理視覺模型、檢測或製造資料本身；但如果未來要讓多個 Agent 分工處理資料準備、分析、驗證、文件與部署流程，它的控制平面思路具有參考價值。

對 **SillyTavern／AI RPG** 而言，角色職責、持久 session、工具接入與多 Agent 協作可以作為架構參考，但 Paperclip 的核心目標是工作與組織治理，不是角色扮演體驗。

對 **Image Generation** 的價值同樣偏間接：比較適合用來編排多個生成／審核／後處理 Agent，而不是處理影像生成模型本身。

## 建議怎麼使用

1. **先 TRY 本機版**：用 `npx paperclipai onboard --yes` 建立隔離的測試環境，不要一開始就接真實敏感憑證。
2. **用小型 Agent 團隊驗證控制模型**：先配置 2～3 個 Agent、一個明確目標與低預算，觀察 heartbeat、任務接手、session 續接與成本停止是否符合預期。
3. **重點 LEARN runtime 與治理設計**：即使最後不採用 Paperclip，本專案在 heartbeat、task checkout、budget、approval、adapter、plugin 與 audit 方面都很值得拆解。
4. **作為 REFERENCE 比較其他 Agent harness**：評估多 Agent 系統時，可用 Paperclip 當作「完整控制平面」基準，檢查其他方案是否只有 prompt routing，還是真的處理執行、成本、權限與狀態。

## 與其他收藏的關聯

目前不建立人工硬連結；待 Knowledge Card 的 Relation／Concept 索引重建後，再由既有公開收藏中的 Agent harness、MCP、Agent Skills 與 orchestration 類資源自動形成語意關聯，避免在未確認實際 Card 路徑前建立錯誤連結。

## 使用者備註

## 更新紀錄

### 2026-09-27

- 建立 Knowledge Card。
- 依目前 README、runtime、部署、資料庫、外掛規格與 roadmap 整理 Agent 控制平面、heartbeat、adapter、治理與部署限制。
