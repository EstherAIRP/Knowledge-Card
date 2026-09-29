---
schema_version: 1
id: github-hazelnutparadise-syralit
title: Syralit
canonical_url: https://github.com/HazelnutParadise/syralit
source:
  type: github
  url: https://github.com/HazelnutParadise/syralit
  identity: github:hazelnutparadise/syralit
resource_kind:
  ai: project
  user: null
navigation:
  categories:
    ai:
      - AI Coding / DevTools
      - Agent / Harness
      - Automation / Productivity
    user: null
created_at: 2026-09-30
updated_at: 2026-09-30
last_checked_at: 2026-09-30
summary: Syralit 是一套以 Go 原生實作、受 Streamlit 啟發的資料應用框架，讓開發者用 Go 函式快速建立互動式儀表板、資料工具與 AI 應用，並提供 WebSocket／SSE 即時更新、單一執行檔部署、桌面應用、Insyra 資料分析整合，以及可由 Agent 安全更新的 Artifact Canvas。
classification:
  categories:
    ai:
      - AI Coding / DevTools
      - Agent
      - General Tools
      - Infrastructure / Deployment
    user: null
  tags:
    ai:
      - Syralit
      - Go
      - Streamlit
      - data-app-framework
      - dashboard
      - WebSocket
      - SSE
      - single-binary
      - Artifact-Canvas
      - artifact-DSL
      - agent-api
      - Insyra
      - Wails
      - OIDC
      - hot-reload
      - offline-deployment
      - AppTest
    user: null
relevance:
  ai:
    overall: 4
    ai_rd: 4
    aoi_ai: 3
    llm_agent: 4
    sillytavern_ai_rpg: 2
    image_gen: 1
  user: {}
actions:
  ai:
    - TRY
    - BUILD
    - REFERENCE
  user: null
status:
  ai: active
  user: null
---

# Syralit

## 一句話介紹

Syralit 是一套以 Go 寫成、受 Streamlit 啟發的互動式資料應用框架：開發者主要撰寫 Go 函式與元件呼叫，由框架負責工作階段、狀態、重新執行、瀏覽器即時同步與前端渲染，不必自行建立傳統 JavaScript 前端專案。

它的定位不只是在 Go 裡重做 Streamlit。Syralit 另外加入 Go 特有的並行能力、型別化狀態、單一執行檔部署、原生桌面模式，以及面向 Agent 的 Artifact Canvas，因此同時可以視為資料 App 框架、快速內部工具框架與 Agent UI 執行介面。

## 它解決什麼問題

Python 生態中，Streamlit 讓資料科學家能用少量程式碼把資料處理結果變成互動式網頁；Go 則較常需要自行處理 HTTP handler、前端狀態、JavaScript、WebSocket、建置與部署。

Syralit 的目標是把這段落差縮小。使用者用 Go 描述畫面與資料互動，框架維持工作階段狀態，當 widget 發生事件時重新執行應用函式並更新瀏覽器 UI。對偏後端、資料處理或系統程式的 Go 開發者而言，這是一種比傳統 SPA 更接近「以程式流程直接描述 UI」的開發模型。

它也進一步處理兩類 Streamlit 不一定優先解決的問題：

1. **部署與本地工具**：`syralit build` 可以把前端資產、後端與 `public/` 靜態檔一起編譯成單一執行檔，另可透過 Wails v3 包裝成原生桌面視窗。
2. **Agent 操作 UI**：Artifact Canvas 提供受限 JSON DSL、bearer token API、版本衝突控制與視覺 readiness 狀態，讓 Agent 能修改一塊可視化畫布，而不必取得任意 HTML／JavaScript 執行權。

## 核心概念

### 1. Rerun 模型：用 Go 函式描述整個畫面

Syralit 延續 Streamlit 的核心思路：應用畫面是一段可重新執行的程式。widget 改變後，框架重新跑頁面函式，依新的 session state 建立 UI 樹，再把變化同步到瀏覽器。

這使開發者不需要手動維護前後端雙份狀態；互動邏輯可以直接留在 Go 程式流程中。

### 2. Session state 與 Go 型別系統結合

框架提供 `State`／`Session`、快取、query parameters、fragment rerun 等機制，並另外利用 Go 泛型提供 `Task[T]` 與 `Shared[T]`。

`Task[T]` 可把工作放進 goroutine，工作完成後由伺服器主動喚醒畫面更新；`Shared[T]` 則是跨 session 的應用級共享狀態，可在值改變時推送到所有連線客戶端。這是 Syralit 相較純粹 Streamlit 相容層更值得注意的部分。

### 3. WebSocket 優先、SSE 自動備援

互動更新預設走 WebSocket。當 WebSocket 無法建立時，前端可自動改用 Server-Sent Events（SSE）下行與 HTTP POST 上行，讓受限代理、企業網路或反向代理環境仍有備援傳輸路徑。

### 4. 單一執行檔部署

`syralit build` 會把框架前端、應用程式與靜態資產整合進 Go binary。對需要攜帶式工具、內網系統或離線環境而言，部署模型接近「帶一個執行檔即可運行」，不需要另外準備 Python runtime 或前端建置產物。

### 5. Artifact Canvas：把 Agent UI 限制在可驗證 DSL

Artifact Canvas 不是讓 Agent 直接寫任意 HTML，而是使用固定的 `ArtifactSpec`／`ArtifactNode` JSON 結構。內建元件包含文字、Markdown、指標、表格、dataframe、圖表、圖片、進度與容器；只有註冊過的元件才能出現在畫布中。

更新 API 要求 bearer token，full replace 需要 `expected_revision`，競爭寫入會回傳 `409 Conflict`。畫布還提供 `transitioning`／`settled` 與 `complete`／`partial`／`timeout` readiness，讓 Agent 在擷取預覽前可以知道視覺輸出是否真的穩定。

## 架構與技術

Syralit 主體以 Go 實作，根模組目前要求 Go `1.25.12`。主要依賴包含：

- `github.com/coder/websocket`：即時瀏覽器通訊。
- `fsnotify`：`syralit dev` 的檔案監控與熱重載。
- `goldmark`：Markdown 渲染。
- `excelize`：Excel 資料處理。
- `BurntSushi/toml`：`syralit.toml` 設定。
- Insyra：資料表、統計、DSL 與圖表整合所使用的資料分析套件。

高階資料流可概括為：

```text
Go page function
      ↓
Session / State / Fragment / Task
      ↓
Internal UI node tree
      ↓
WebSocket
  or SSE + POST
      ↓
Browser renderer
```

框架同時提供 `sy.Handler`，可把 Syralit 掛進既有 Go HTTP server，而不一定要讓框架接管整個服務。

### Insyra 整合

`integrations/insyra` 提供 DataTable／DataList 顯示、統計、回歸、相關矩陣、篩選、可編輯資料、CSV／Excel／JSON 載入，以及 go-echarts 的擴充圖表。

專案刻意把較重的能力拆成選用 subpackage。例如原生 go-echarts 介面放在 `integrations/insyra/eplot`；Insyra DSL 則放在 `integrations/insyra/insyradsl`。DSL 預設採安全模式，以 allowlist 僅允許純記憶體計算命令。

### 桌面與身分驗證

`integrations/desktop` 是獨立 Go module，使用 Wails v3 把同一套 Syralit app 放入原生桌面視窗；`integrations/oidc` 則提供 OIDC 登入保護。這些能力不強迫所有 Web App 一起承擔對應依賴。

## 主要功能

- **Streamlit 類開發模型**：輸入元件、文字、Markdown、資料表、資料編輯器、圖表、地圖、媒體、多頁導覽、sidebar、form、dialog、toast、progress 等。
- **狀態與控制流程**：session state、cache、query parameters、fragment、rerun、stop、secrets、connection。
- **資料視覺化**：內建 Chart.js，並提供 Vega-Lite、Plotly、Bokeh、PyDeck 等外部圖表介面。
- **互動資料處理**：可選取資料列／欄位與圖表資料點，並與 Insyra 的篩選、聚合、統計與公式計算串接。
- **測試**：`sy.AppTest` 可無伺服器渲染，模擬 widget 輸入與按鈕；Repository 另有以 headless Chrome 驗證真實瀏覽器行為的 UI 測試。
- **CLI**：`syralit new`、`syralit dev`、`syralit run`、`syralit build`。
- **離線與單檔部署**：前端與靜態資產可嵌入 binary，也可把第三方資源改指向自架版本。
- **桌面模式**：透過 Wails v3 建立原生視窗，並支援與 `syralit dev` 搭配的熱重載。
- **Artifact API**：Agent 可以探索已公開的 artifact store、提交受限 DSL，並取得 revision、placement 與 preview readiness。
- **Agent 擴充技能**：Repository 另附 `skills/syralit-artifact-dsl`，協助 Agent 產生符合 Artifact DSL 的 payload。

## 技術亮點

### Go 不只是換語言，而是改變執行模型

Syralit 最有意思的地方不是 API 名稱與 Streamlit 相似，而是把 Go 的 goroutine、泛型、`net/http` 與單一 binary 優勢整合進同一個 rerun 模型。`Task[T]` 與 `Shared[T]` 特別能看出它沒有只追求語法相容。

### Agent Artifact 有清楚的安全邊界

Artifact Canvas 採「允許元件清單」而不是任意 UI 生成。Agent 只送 declarative spec，由框架轉換成已知安全元件；再加上 bearer auth、revision 控制與 readiness 狀態，整體更接近可被自動化系統操作的 UI protocol，而不是單純讓模型生成前端程式碼。

### 同一套程式碼可跨 Web、單檔與 Desktop

相同的頁面函式可以在 Web server、單一執行檔與 Wails 桌面殼中重用。對內部資料工具或需要直接讀取本機檔案的應用，這會比另外維護 Web 與桌面兩套 UI 更有吸引力。

### 測試能力不是後補功能

除了 `AppTest`，專案另有瀏覽器層 UI suite，測試 WebSocket 往返、圖表點擊、多檔上傳、sub-path mounting 等真實互動。對這類以 rerun 與前端同步為核心的框架，能測「瀏覽器真的看到什麼」比只測 Go 函式更重要。

## 限制與風險

### 專案仍很新，外部採用訊號有限

Repository 建立於 2026-06-16，目前最新 release 是 2026-08-25 的 `v0.11.0`。截至 2026-09-30，GitHub 顯示 2 stars、0 forks、0 open issues。這些數字不能直接代表品質，但代表可觀察到的外部使用案例與社群驗證仍相當有限。

版本仍未到 `1.0`，而且 6 月到 8 月間功能增加速度很快。若要放進長期維護的正式系統，應預期 API、設定與行為仍可能調整。

### `sy.Embed`、`HeadHTML` 與原始 HTML 需要視為信任邊界

`sy.Embed` 會執行第三方 markup 中的 `<script>`；`HeadHTML` 也會原樣插入 `<head>`。官方文件明確要求，不應把未轉義的使用者輸入直接帶入這些介面，否則可能形成 XSS。

這些介面是有意提供的低階能力，不是框架自動保證安全的 sandbox。

### Artifact 安全仍取決於應用如何管理 Agent 金鑰

Artifact API 提供 bearer token 與可插拔 `AgentAuthenticator`／`AgentKeyStore`，但框架本身不負責替應用持久化金鑰。若應用錯誤配置 endpoint、權限或金鑰生命週期，仍可能把可修改 UI 的能力暴露給不該有權限的客戶端。

### Insyra DSL 的安全模式可以被明確關閉

`RunDSL` 預設使用 allowlist 安全模式，但 `Unrestricted()` 會解除限制。這適合可信任、由應用作者控制的腳本；不應用來執行未受信任的 Agent 或使用者輸入。

### 桌面模式增加平台依賴

Wails 桌面模組在 Windows 依賴 WebView2，在 macOS 需要 Xcode command-line tools，在 Linux 需要 webkit2gtk。它仍比 Electron 類方案輕量，但不等於真正零依賴的跨平台 GUI。

## 與你的相關性

依公開技術 Profile，Syralit 對 **AI R&D**、**LLM／Agent** 與 **AOI × AI** 都有實務參考價值。

對 AI R&D 而言，它提供一條以 Go 快速製作模型工具、評估介面、資料探索頁與內部 dashboard 的路線，並把測試、部署、離線執行與桌面模式一起考慮進框架。

對 LLM／Agent 而言，Artifact Canvas 特別值得研究。它示範如何讓 Agent 改變畫面，又不直接授予任意 HTML／JavaScript 能力；revision、discovery、placement 與 readiness 也都是建立「Agent 可操作 UI」時很實際的協定設計。

對 AOI × AI 而言，Syralit 沒有直接提供影像辨識或 AOI 演算法，因此不是核心模型技術；但資料表、圖表、檔案匯入、單檔／桌面部署與本機資料存取，很適合拿來評估檢測結果檢視、模型比較或工程診斷工具的 UI 層。

## 建議怎麼使用

### TRY：先跑 `hello` 與 `data-explorer`

先確認 rerun、session state、表格與圖表互動是否符合預期，再測 `syralit build` 的單一執行檔流程。這能快速判斷它是否真的能取代部分 Streamlit 或自建前端工具。

### BUILD：做一個小型資料／AI 工具原型

最適合的驗證題目不是大型正式網站，而是一個需要資料表、圖表、篩選、檔案載入與本機部署的小型工具。若還想測 Agent 介面，可再加入一個 Artifact Canvas，讓 Agent 更新報表或診斷面板。

### REFERENCE：研究 Agent UI 與 Go-native data app 的設計

即使最後不採用 Syralit，它仍值得作為兩類架構參考：

1. Streamlit 式 rerun 模型如何在 Go 裡結合 goroutine、型別與單檔部署。
2. Agent 如何透過受限 DSL、版本控制與視覺 readiness 操作動態 UI，而不是直接生成任意前端程式碼。

## 與其他收藏的關聯

目前 Repository 中未確認存在 Insyra 或其他直接對應的 Syralit 生態 Knowledge Card，因此暫不建立具名連結。

## 使用者備註


## 更新紀錄

### 2026-09-30

- 建立 Syralit Knowledge Card。
- 依 `v0.11.0`、README、Changelog、Artifact DSL、Streamlit parity、Go module 與 GitHub Repository metadata 整理框架架構、Agent Artifact 設計、部署模式與安全邊界。
