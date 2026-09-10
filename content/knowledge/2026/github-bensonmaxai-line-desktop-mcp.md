---
schema_version: 1
id: github-bensonmaxai-line-desktop-mcp
title: LINE Desktop MCP（Windows Community Edition）
canonical_url: https://github.com/bensonmaxai/line-desktop-mcp
source:
  type: github
  url: https://github.com/bensonmaxai/line-desktop-mcp
  identity: github:bensonmaxai/line-desktop-mcp
resource_kind:
  ai: project
  user: null
created_at: 2026-09-11
updated_at: 2026-09-11
last_checked_at: 2026-09-11
summary: 將已登入的 LINE Desktop 透過 MCP 接給 Codex 等本機 AI 客戶端的 Windows 社群擴充版。啟用擴充後提供 24 個工具，涵蓋聊天讀取與搜尋、草稿與訊息發送、紀錄匯出及介面操作，底層結合 AutoHotkey、CUA Driver 與 Windows 本機 OCR，並加入聊天室確認、操作鎖與遠端 HTTP 驗證等保護。
classification:
  categories:
    ai:
      - Agent
      - AI Coding / DevTools
      - General Tools
    user: null
  tags:
    ai:
      - MCP
      - LINE Desktop
      - Codex
      - desktop-automation
      - GUI-automation
      - AutoHotkey
      - CUA Driver
      - Windows OCR
      - local-agent
      - guarded-actions
    user: null
relevance:
  ai:
    overall: 4
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
  user: null
status:
  ai: active
  user: null
---

# LINE Desktop MCP（Windows Community Edition）

## 一句話介紹

LINE Desktop MCP 是把一般已登入的 LINE Desktop 變成 MCP 工具端點的桌面代理橋接器；這個 Windows 社群版由 bensonmaxai 維護，在原始 dtwang/line-desktop-mcp 基礎上擴充成可供 Codex 等本機 MCP 客戶端讀取聊天、搜尋訊息、管理草稿、發送文字、匯出紀錄與操作部分 LINE 介面的工具組。

## 它解決什麼問題

LINE 官方 Messaging API 面向 Bot 與 Channel，不等同於讓個人 AI Agent 操作使用者目前登入的桌面 LINE。若希望 Codex 或其他本機 Agent 讀取某個聊天室最近內容、整理待辦、先寫好回覆草稿，甚至在明確授權下送出訊息，通常需要另外處理桌面介面、自動化、文字擷取與操作驗證。

此專案把這些能力包成 MCP 工具，讓上層 Agent 不必直接理解 AutoHotkey 腳本、Windows 視窗控制或 OCR 細節。更重要的是，它沒有把所有 GUI 行為都當成「呼叫成功就算完成」，而是加入聊天室身分確認、草稿舊值保護、操作鎖、讀回驗證與不確定結果回報等機制，降低桌面自動化常見的誤操作風險。

## 核心概念

- **本機 MCP 橋接**：MCP Server 連接已登入的 LINE Desktop，讓 Codex 等支援 MCP 的客戶端以工具呼叫方式使用桌面 LINE。
- **Windows 擴充採明確啟用**：預設保留原專案 5 個工具；Windows 設定 LINE_MCP_EXTENSIONS=1 後才切換成 24 個擴充工具，macOS 仍維持原有工具組。
- **讀取與介面操作分層**：聊天紀錄主要沿用 AutoHotkey 流程；需要辨識與操作介面的功能可使用 CUA Driver，必要時再配合 Windows 本機 OCR。
- **受限範圍而非完整帳號匯出**：讀取的是 LINE 客戶端目前可載入的聊天範圍，messageLimit 與日期條件只限制回傳結果，不代表取得 LINE 伺服器端完整歷史。
- **副作用操作採防護式設計**：草稿、發送、附件與轉傳等會改變外部狀態的功能，盡量要求確認目標、保護既有內容，並避免在結果不明時自動重送。
- **失敗時偏向拒絕而不是猜測**：自繪控制項、OCR 或介面定位無法可靠確認時，擴充工具會回報原因，而不是任意點擊看似可能的目標。

## 架構與技術

專案主要以 JavaScript／Node.js 實作，package.json 版本為 1.2.0，使用 @modelcontextprotocol/sdk 建立 MCP Server，並提供 STDIO 與 Streamable HTTP 兩種傳輸方式。

Windows 社群版可概括成以下幾層：

- **MCP Server**：src/server.js 註冊工具與處理請求，預設透過 STDIO 啟動，也可使用 Streamable HTTP。
- **LINE Automation**：既有 AutoHotkey 流程負責聊天紀錄讀取與部分文字操作。
- **Windows Extensions**：在 LINE_MCP_EXTENSIONS=1 時替換重疊的 5 個 handler 並加入 19 個工具，合計 24 個。
- **CUA Driver**：介面相依功能透過獨立安裝的 CUA Driver 操作與觀察 Windows UI；文件記錄曾以 Driver 0.23.2 驗證互通。
- **本機 OCR**：使用 Windows PowerShell 5.1／Windows.Media.Ocr，不把截圖上傳到雲端 OCR。
- **操作同步**：Windows facade 與 UI 操作共用 ~/.line-desktop-mcp/operation.lock，遇到競爭時回傳 LINE_BUSY，不自動搶走可能仍有效的鎖。
- **HTTP 安全邊界**：HTTP 模式預設綁定 127.0.0.1；若指定非 loopback 位址，啟動時強制要求 --token，MCP 端點使用 Bearer Token 驗證。

這個架構的重點不是建立新的 LINE 協定，而是把現有桌面 GUI 自動化包成一組可被 Agent 呼叫、且具有明確失敗語意的 MCP 工具。

## 主要功能

啟用 Windows 擴充後共有 24 個工具，主要分成幾組：

- **聊天讀取**：短／一般／長範圍的既有歷史讀取，以及可指定日期與筆數的結構化訊息讀取。
- **搜尋與核對**：依文字、日期、發話者等條件搜尋近期取得的訊息，或核對完全相同文字是否存在。
- **草稿與發送**：讀取、寫入、清除 LINE 輸入框草稿；send_message_manual 可先保留在輸入框，send_message_auto 則直接發送。
- **紀錄匯出**：將指定範圍輸出成 TXT、JSON 或 CSV，要求新檔路徑並做讀回與 SHA-256 驗證。
- **聊天室觀察與導覽**：查詢 LINE 執行狀態、開啟聊天室、取得 UI 狀態、確認目前聊天室，以及導向搜尋、記事本、相簿、投票、媒體、檔案、連結等入口。
- **訊息介面操作**：準備引用回覆、複製訊息、翻譯、轉傳，以及將附件填入 LINE 原生檔案選擇器。

get_line_capabilities 可查詢目前工具清單與能力，get_line_workflow 則提供視覺流程指引，本身不會執行 GUI 操作。

## 技術亮點

### 1. 把「桌面自動化」做成有安全語意的 Agent 工具

這個專案最值得參考的地方，不只是 LINE 可以被 MCP 操作，而是它試圖把桌面 GUI 常見的不確定性顯式化。工具不只回傳「已派發操作」，還區分能否確認聊天室、介面是否可辨識，以及失敗後動作是否可能已經完成。

對 Agent 系統而言，這比單純封裝滑鼠鍵盤更重要：如果外部動作可能有副作用，就必須知道何時可以重試、何時不能重送，以及什麼證據才足以視為完成。

### 2. 聊天室身分不是只靠焦點視窗猜測

介面操作會綁定特定 LINE PID／window，並可利用可存取的標題、截圖觀察與短效確認 token 建立聊天室確認。後續動作還會比較新的標題畫面，避免 Agent 在視窗切換後仍沿用舊確認。

這種「先觀察 → 確認目標 → 短效授權 → 再執行」的模式，可泛化到其他高風險桌面 Agent。

### 3. 草稿與匯出都有資料完整性保護

set_line_draft 在覆蓋既有草稿時要求核對舊值，避免把使用者剛手動修改的內容直接蓋掉。匯出功能則拒絕覆寫既有檔案、網路路徑、reparse parent 與 Windows alternate data streams，CSV 也會處理可能觸發試算表公式的儲存格，最後再用讀回與 SHA-256 確認輸出。

### 4. 保留舊介面，再以 opt-in 方式加入新能力

Windows 擴充不是直接破壞原本五工具契約，而是以環境變數明確切換。這對正在使用既有 MCP automation 的人很重要，也是一種值得參考的工具介面演進方式。

## 限制與風險

- **具有真實帳號副作用**：它直接操作使用者已登入的 LINE Desktop，可讀取私人聊天，也可能發送訊息、準備附件或轉傳。因此 MCP Client、Agent prompt 與本機程序都應視為具有 LINE 帳號操作權限的受信任元件。
- **GUI 自動化仍受版本影響**：LINE 的語言、版本、縮放、自繪控制項與 CUA 可存取性都可能改變。文件明確記錄部分記事本、投票與訊息動作無法在所有客戶端穩定自動確認。
- **本輪實機驗證不是完整功能認證**：文件記錄曾在 Windows LINE 26.4.2.3957 上測試歷史、搜尋、精確文字核對、匯出、草稿循環與部分導覽，但該輪沒有實際執行 outbound send、附件上傳、投票或共用內容修改。
- **聊天讀取不是完整備份**：能取得的是當下客戶端載入範圍，不能把它視為 LINE 帳號的完整伺服器端 archive，也不能用匯出檔還原帳號。
- **CUA Driver 是外部相依**：專案不自行安裝或常駐啟動 CUA Driver；不同版本是否完全相容需要另外驗證。
- **本機 OCR 受系統語言與字體影響**：Windows OCR 的語言套件、小字辨識與自繪介面會直接影響可用性。
- **不確定結果不可盲目重試**：若程序崩潰留下 operation lock，必須先確認原 PID 與 LINE 狀態，再人工處理；某些 cleanup failure 也代表前一個動作可能已完成。
- **發行來源容易混淆**：這個 Windows 社群版 v1.2.0 從 bensonmaxai/line-desktop-mcp 的 GitHub Release 發布，沒有同步成 upstream npm registry 的 latest。直接執行 npx line-desktop-mcp@latest 取得的是原專案版本，不等於這個 fork。
- **不是 LINE 官方專案**：專案是社群維護的桌面自動化橋接器，並非 LINE Messaging API 或 LINE 官方支援的整合方案。
- 授權為 MIT；原始專案著作權聲明保留給 Geoffrey Wang。

## 與你的相關性

依公開技術背景，此專案與 **LLM／Agent** 的相關性很高。它是一個很具體的 MCP 工具設計案例：上層模型負責理解意圖與選工具，下層則把 Windows GUI、自動化腳本、OCR、狀態確認與副作用保護包成較穩定的操作介面。

對 **AI R&D** 也有明顯參考價值，尤其適合研究「Agent 如何安全操作傳統桌面軟體」這類不具正式 API、狀態又難以直接觀察的環境。聊天室確認、短效 token、operation lock、readback、uncertain outcome 與 no replay 等設計，都比 LINE 本身更值得抽象成通用模式。

它雖然使用本機 OCR，但目的主要是 GUI 輔助辨識，不屬於 AOI × AI 或電腦視覺模型研發，因此 AOI 與影像生成面的直接相關性低。

## 建議怎麼使用

- **TRY**：若要實測，先用低風險測試聊天室，優先從讀取、搜尋與 send_message_manual／草稿模式開始，不要一開始就讓 Agent 自動發送。
- **LEARN**：重點閱讀 docs/windows-extensions.md，特別觀察它如何處理聊天室身分確認、失敗後是否可重試、operation lock、輸出驗證與 GUI 無法確認時的拒絕策略。
- **REFERENCE**：可把它視為「傳統 Windows 應用程式如何包成 Agent Tool」的參考實作，而不只是 LINE 專用工具。

實際使用時建議固定 v1.2.0 或明確 commit，HTTP 盡量維持 loopback；若真的需要跨機器連線，再啟用 Bearer Token、限制網路暴露範圍，並把 auto-send 視為必須明確授權的高副作用操作。

## 與其他收藏的關聯

目前未建立直接關聯連結。概念上它與 MCP、Agent 工具鏈、桌面自動化、Computer Use 與受保護副作用操作等資源接近；實際關聯交由知識庫的語意索引與關係圖流程計算。

## 使用者備註


## 更新紀錄

### 2026-09-11

- 建立 LINE Desktop MCP（Windows Community Edition）Knowledge Card。
- 依 v1.2.0 README、功能文件、Windows 擴充技術文件、package.json 與 src/server.js 核對 24 工具、AutoHotkey／CUA Driver／本機 OCR 架構，以及 HTTP 與副作用操作的保護機制。
