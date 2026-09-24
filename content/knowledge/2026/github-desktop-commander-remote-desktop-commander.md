---
schema_version: 1
id: github-desktop-commander-remote-desktop-commander
title: Remote Desktop Commander
canonical_url: https://github.com/desktop-commander/remote-desktop-commander
source:
  type: github
  url: https://github.com/desktop-commander/remote-desktop-commander
  identity: github:desktop-commander/remote-desktop-commander
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
created_at: 2026-09-25
updated_at: 2026-09-25
last_checked_at: 2026-09-25
summary: Remote Desktop Commander 是託管式遠端 MCP 服務，讓 ChatGPT、Claude、Cursor 等支援遠端 MCP 的 AI 客戶端，透過雲端中繼連回使用者自己電腦上的 device agent，取得檔案、終端機、程序與多裝置操作能力。專案目前為 beta；公開 GitHub 倉庫只提供文件與 manifest，實際 hosted service 為專有軟體。
classification:
  categories:
    ai:
      - Agent
      - AI Coding / DevTools
      - Infrastructure / Deployment
      - General Tools
    user: null
  tags:
    ai:
      - MCP
      - remote-agent
      - desktop-automation
      - filesystem
      - terminal
      - process-management
      - OAuth 2.0
      - PKCE
      - device-authorization-flow
      - multi-device
      - remote-computer-use
    user: null
relevance:
  ai:
    overall: 5
    ai_rd: 4
    aoi_ai: 2
    llm_agent: 5
    sillytavern_ai_rpg: 1
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

# Remote Desktop Commander

## 一句話介紹

Remote Desktop Commander 是一個託管式遠端 MCP 橋接服務：AI 客戶端連到 `mcp.desktopcommander.app`，再由服務把工具呼叫轉送到使用者電腦上執行中的 Desktop Commander device agent，讓遠端 AI 能讀寫檔案、執行終端機命令、管理程序與操作多台已配對電腦。

## 它解決什麼問題

一般本機 MCP Server 很適合讓桌面上的 AI 客戶端直接操作同一台電腦，但如果 AI 介面運行在瀏覽器、手機、另一台裝置或雲端環境，本機 `stdio` MCP 並不能直接跨網路連到使用者的檔案系統與 shell。

Remote Desktop Commander 把這層連線問題拆成兩端：

- AI 應用只需要連到一個支援 Streamable HTTP 的遠端 MCP endpoint。
- 使用者電腦執行 device agent，完成配對後持續與 hosted service 保持可用連線。
- 工具呼叫由 hosted service 中繼到指定裝置執行，再把結果送回 AI。

因此上層 AI 不需要直接理解遠端連線、裝置配對或每台機器的本機 MCP 啟動方式，就能以相同工具介面存取已授權的電腦。

## 核心概念

- **遠端 MCP 中繼**：服務端提供 `https://mcp.desktopcommander.app/mcp`，採 Streamable HTTP，讓支援遠端 MCP connector 的客戶端直接連線。
- **本機 device agent**：目標電腦執行 `npx @wonderwhy-er/desktop-commander@latest remote`，由這個程序實際執行檔案、shell 與程序工具。
- **OAuth 配對**：AI 客戶端使用 OAuth 2.0；裝置則透過 OAuth device authorization flow 顯示配對碼，使用者在瀏覽器確認後完成綁定。
- **多裝置抽象**：同一帳號可以配對多台電腦，Agent 可依裝置名稱指定操作目標。
- **能力來自本機使用者權限**：工具不是在隔離沙箱中執行，而是繼承 device agent 所在作業系統帳號的實際權限。

## 架構與技術

來源文件描述的資料流可概括為：

```text
AI app
  ↓ MCP + OAuth 2.0 bearer token
mcp.desktopcommander.app
  ↓ hosted relay
paired device agent
  ↓
filesystem / terminal / processes
  ↑
tool result
```

主要技術與部署特性包括：

- **MCP transport**：遠端端點使用 Streamable HTTP。
- **認證**：OAuth 2.0 with PKCE；裝置配對採 OAuth device authorization flow。
- **本機 Runtime**：每台被控制的電腦需要 Node.js 18 以上，並保持 device agent 程序執行。
- **作業系統**：文件列出 macOS、Windows、Linux。
- **多客戶端整合**：README 提供 Claude、ChatGPT、Cursor、VS Code／GitHub Copilot、Gemini CLI 等設定方式。
- **公開倉庫角色**：此 GitHub repository 主要保存 `server.json`、`.mcp.json`、`plugin.json`、文件、品牌資產與 issue tracker；實際 hosted service 原始碼不在此倉庫。
- **版本資訊**：目前公開的 MCP server manifest 與 VS Code plugin manifest 標示版本為 `1.0.22`。

## 主要功能

README 列出的 MCP 工具大致分為：

- **讀取與探索**：讀取單一或多個檔案、列目錄、查檔案資訊。
- **搜尋**：啟動搜尋、分頁取得結果、停止搜尋與列出進行中的搜尋。
- **寫入與編輯**：寫檔、區塊式修改、移動／重新命名、建立目錄與修改 PDF。
- **終端機與程序**：啟動程序、傳送輸入、讀取程序輸出、列出工作階段與系統程序、終止工作階段或程序。
- **裝置與帳號**：列出已配對電腦、查詢目前帳號、ping 裝置與關閉 device agent。
- **設定與診斷**：讀寫設定、查詢 prompt library、近期工具活動與使用統計。
- **多機操作**：同一會話可以針對不同已配對裝置執行工具。

這使它比較接近「把完整 Desktop Commander 能力遠端化」，而不是只暴露單一檔案 API 或有限命令集合。

## 技術亮點

### 1. 把本機 Computer Use 能力做成遠端 MCP

它將「AI 客戶端」、「遠端 MCP 服務」與「真正執行工具的本機代理」分開。這個架構讓網頁版或行動端 AI 也能沿用 MCP 工具介面操作自己的電腦，對 Agent／Harness 設計很有參考價值。

### 2. 裝置配對與 MCP 客戶端認證分成兩個信任環節

AI 客戶端透過 OAuth 2.0 與 hosted MCP 建立身分，電腦端則使用 device authorization flow 完成配對。這比把固定 token 或 shell endpoint 直接暴露在網路上更容易建立可撤銷的裝置管理流程。

### 3. 以「裝置在線」控制暴露時間

來源文件明確指出：只有 device agent 持續執行時，該電腦才可被遠端存取；關閉程序後連線即停止，也可以從 dashboard 撤銷單一或全部裝置。這提供了一個簡單但重要的操作層安全開關。

### 4. MCP 客戶端相容性做得直接

倉庫同時提供標準 MCP server manifest、`.mcp.json`、VS Code plugin manifest 與各客戶端安裝方式，降低同一遠端工具在不同 Agent 客戶端間重複設定的成本。

## 限制與風險

- **高權限遠端操作面**：Security Policy 明確指出，工具以使用者帳號權限執行；若該帳號能讀寫檔案、啟動程序或執行系統命令，連上的 AI 原則上也能要求這些操作。
- **guardrail 不是 sandbox**：允許目錄、命令封鎖等設定只是降低誤操作的保護機制，官方文件明確不把它們視為能對抗惡意或遭入侵客戶端的安全邊界。
- **AI 帳號本身成為遠端電腦憑證的一部分**：能操作已連線 AI assistant 或 Remote Desktop Commander 帳號的人，可能進一步存取已配對電腦，因此 MFA 與帳號保護是實際威脅模型的一部分。
- **託管服務不可自行審計完整實作**：公開 repository 不是 hosted service 的原始碼；其 LICENSE 也明確指出服務為 proprietary software。因此 relay、帳號服務與後端執行細節主要依賴供應商文件與服務信任。
- **資料會經 hosted relay 傳輸**：Security Policy 表示傳輸使用 HTTPS/TLS，工具呼叫與結果在送達後不保留，另收集不含檔案內容的操作事件 telemetry；實際導入仍應依資料敏感度評估是否接受第三方中繼。
- **目前仍為 beta**：README 明確標記服務狀態為 beta，適合先做受控測試，而不是直接把高風險主機或敏感工作流程全面交給自動 Agent。
- **device agent 必須常駐**：終端關閉後遠端能力即停止，這同時是安全優點也是可用性限制。
- **授權範圍有限**：此 repository 的文件、manifest 與品牌資產採保留權利的自訂授權；只允許檢視、連結及為回饋貢獻而 fork。另行開源的 DesktopCommanderMCP local server 才是 MIT License。

## 與你的相關性

依公開技術背景，這個專案與 **LLM／Agent** 高度相關。它直接處理 Agent 如何跨裝置取得實際檔案系統、shell 與程序控制能力，也提供一個可以觀察 MCP 遠端傳輸、OAuth、裝置配對與電腦端代理分工的完整案例。

對 **AI R&D** 而言，重點不在模型本身，而在工具執行基礎設施與安全邊界：當 Agent 從「讀資料」進一步變成可以在真實電腦上寫檔、啟動程序與修改環境時，帳號信任、權限、撤銷、隔離與可觀測性會成為系統設計的核心。

它與 AOI × AI、SillyTavern／AI RPG 或影像生成沒有直接領域耦合，因此這些維度的評分較低；價值主要集中在 Agent／Harness 與遠端自動化架構。

## 建議怎麼使用

- **TRY**：適合先在 VM、容器或低風險測試機器配對，從唯讀檔案查詢、目錄探索與非破壞性 shell 操作開始，確認權限與撤銷流程後再提高自動化程度。
- **LEARN**：可研究它如何把遠端 MCP、OAuth 2.0、device flow、裝置管理與本機工具執行拆成不同信任區域。
- **REFERENCE**：適合作為「讓雲端／網頁 Agent 安全地操作使用者自有電腦」的架構參考，尤其可與純本機 MCP、Computer Use 或 GUI automation 方案比較。

若要用於敏感環境，建議把「哪一台機器可被配對、Agent 帳號遭接管時的影響、允許目錄與命令、是否使用 VM／容器隔離、如何撤銷裝置」視為導入前必要的威脅模型，而不是只依賴工具本身的設定開關。

## 與其他收藏的關聯

- [LINE Desktop MCP（Windows Community Edition）](./github-bensonmaxai-line-desktop-mcp.md)：兩者都把真實桌面環境包裝成 MCP 工具；LINE Desktop MCP 聚焦單一 GUI 應用與副作用防護，Remote Desktop Commander 則提供跨檔案系統、終端機與程序的通用遠端電腦操作能力。

其餘語意關聯交由知識庫的 Relation／Concept 圖譜流程計算。

## 使用者備註


## 更新紀錄

### 2026-09-25

- 建立 Remote Desktop Commander Knowledge Card。
- 依 README、SECURITY.md、LICENSE、`server.json`、`plugin.json` 與 `.mcp.json` 核對遠端 MCP 架構、OAuth／device flow、工具能力、beta 狀態、授權與安全信任模型。
