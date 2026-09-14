---
schema_version: 1
id: github-totec448-spec-chat-on-steroids
title: Chat On Steroids
canonical_url: https://github.com/totec448-spec/chat-on-steroids
source:
  type: github
  url: https://github.com/totec448-spec/chat-on-steroids
  identity: github:totec448-spec/chat-on-steroids
resource_kind:
  ai: project
  user: null
navigation:
  categories:
    ai:
      - Agent / Harness
      - AI Coding / DevTools
    user: null
created_at: 2026-09-14
updated_at: 2026-09-14
last_checked_at: 2026-09-14
summary: Chat On Steroids 是一套把既有 ChatGPT 對話擴充成可操作本機專案的桌面 Agent harness；以 Electron 應用、MCP 連接器與 Chrome companion bridge 提供檔案、終端、桌面控制、持久化 session、多 worker、Goal／Loop、Compact & Resume 與外部 MCP plugins。它直接使用使用者的 ChatGPT 會話與帳號可用模型，而不是自行呼叫 Codex，目前仍是快速演進且具有高權限本機能力的 beta。
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
      - ChatGPT
      - MCP
      - agent-harness
      - coding-agent
      - local-first
      - multi-agent
      - browser-automation
      - Chrome-extension
      - Electron
      - persistent-session
      - Compact-and-Resume
      - Goal
      - Loop
      - desktop-control
      - tool-permissions
      - MCP-tunnel
      - plugin-system
      - TypeScript
    user: null
relevance:
  ai:
    overall: 5
    ai_rd: 4
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
    - WATCH
  user: null
status:
  ai: active
  user: null
---

# Chat On Steroids

## 一句話介紹

Chat On Steroids（CoS）是一套把一般 ChatGPT 網頁對話延伸成「可操作本機專案的 Agent 執行環境」的桌面應用：它透過 MCP、Chrome companion extension 與本機 Electron 程式，把檔案、終端、桌面操作、持久化工作階段、多個 worker、任務續跑與外部 MCP 工具接到既有 ChatGPT 對話上，而不是另外建立一套只靠 API 驅動的 Coding Agent。

## 它解決什麼問題

一般 ChatGPT 對話很適合推理與協作，但若要長時間處理真實程式專案，還會遇到幾個「模型之外」的工程問題：模型如何安全地讀寫本機檔案、如何保留終端程序、如何把真實工具結果帶回對話、如何在瀏覽器分頁或上下文重整後繼續同一件事，以及多個子任務如何拆給不同 Agent 後再收斂。

CoS 的做法不是重新實作另一個模型供應商或 Coding Agent 核心，而是把**既有 ChatGPT 對話當成推理與互動層**，再在本機補上一層能力橋接與持久化 runtime。README 明確說明它使用使用者的 ChatGPT conversation，而不是直接呼叫 Codex；可用模型、用量與上下文限制仍受登入帳號本身影響。

第二個問題是長任務的連續性。瀏覽器對話可能因分頁重載、上下文壓縮、工具等待或工作拆分而失去工作狀態。CoS 因此把 session 與單一 ChatGPT tab 分離，記錄訊息與實際本機工具結果，再以 Compact & Resume 把同一個 session 重新綁到新的 provider conversation；worker 也保留自己的歷史，讓後續任務能繼續使用，而不是每次重建上下文。

第三個問題是「能做很多事」同時意味著高權限。檔案寫入、shell、螢幕、鍵鼠、剪貼簿與第三方 MCP 都可能影響真實電腦，因此 CoS 另外建立 approved folders、read-only mode、分離 connector、tokenized loopback endpoint 與 OS secure storage 等控制面。不過這些機制是應用層權限邊界，不等於作業系統沙箱。

## 核心概念

第一個核心是 **ChatGPT 作為既有的 Agent 對話層，本機能力作為外接 runtime**。CoS 不要求把工作搬到另一個專用 CLI 對話；模型與使用者仍在 ChatGPT 中互動，本機 Electron 應用透過 MCP 暴露工具，Chrome companion 則負責識別與協調瀏覽器中的實際 conversation。這使「模型供應」與「本機執行能力」被拆成兩個可獨立演進的層次。

第二個核心是 **能力面分離**。目前至少分成三個主要 connector：

- **Core**：本機檔案、patch、終端、產生檔下載、session history、plan 與 worker。
- **Desktop**：螢幕觀察、滑鼠、鍵盤與剪貼簿；Windows 與 macOS 的權限與 OS 授權方式不同。
- **Plugins**：外部 MCP 工具與伺服器，包含 reviewed recipes 與自訂 local／remote MCP。

Chrome companion bridge 又是另一個 loopback 服務，安全文件特別指出它不暴露 filesystem、command 或 settings mutation route。這種拆分可以讓不同權限面採用不同 token、tunnel 與啟用策略，而不是把所有工具塞進一個巨大 connector。

第三個核心是 **session 不等於瀏覽器分頁**。CoS 會把訊息與實際本機 tool results 記錄成持久 session history；即使某個 ChatGPT 分頁被替換，Compact & Resume 仍能要求 handoff、開啟新的 provider conversation，再把它綁回原 session。這使「長任務的真實狀態」不只存在於某個網頁 DOM 或單次模型 context 裡。

第四個核心是 **Goal、Loop 與 finish boundary**。Goal 用來判斷目前工作是否已完成，未完成時可繼續推進；Loop 則在 brief 範圍內持續進行後續回合，直到被關閉。文件也描述 Astra finish boundary 可在同一工作 turn 中接收 queued instructions、plan checkpoints 與自動 follow-up。這些能力的共同方向，是把「回答一次」延伸成能持續維持工作目標的執行生命週期。

第五個核心是 **可重用 worker**。獨立工作可被拆給不同 worker，worker 完成後不一定被銷毀，而是保留其 conversation 與 durable history；預設每個 family 同時兩個 worker，設定上可提高到八個。這和一次性的 subagent 不同，更接近具有持久身份與上下文的工作槽。

## 架構與技術

Repository 主要以 **TypeScript** 實作，桌面端使用 **Electron 44**、`electron-vite`、Vite 與 Vitest。MCP 層直接依賴 `@modelcontextprotocol/client`、`server` 與 `node` 套件，另包含 `node-pty`、Tree-sitter、QuickJS、Sharp、WebSocket 與 Zod 等元件，對應終端、程式碼解析、受控腳本執行、影像處理、通訊與 schema 驗證等需求。

從公開文件可把整體分成幾個主要層次：

1. **ChatGPT／瀏覽器層**：使用者維持正常 ChatGPT conversation；companion extension 觀察與協調瀏覽器 UI、模型選擇、訊息交付、worker 分頁與 continuation identity。專案明確提醒，這種 companion 行為不是公開的 ChatGPT automation API。
2. **Electron 控制層**：管理 workspace、session、worker、plan、Goal／Loop、權限、設定、歷史與 connector 狀態。
3. **MCP 工具層**：Core、Desktop 與 Plugins 各自提供工具 surface；MCP server 綁在 loopback，使用 secret tokenized path，若需要讓 ChatGPT 存取則透過使用者設定的 tunnel 暴露。
4. **本機執行層**：檔案工具受 approved folders 限制；terminal／command 以登入使用者的一般 OS 權限執行；桌面控制則使用平台原生能力與 OS 權限。
5. **持久化與安全儲存**：一般 session recording 是本機持久歷史；API／bridge credentials 則使用 Electron `safeStorage`，在 Windows 對應 DPAPI、macOS 對應 Keychain，Linux 需要安全桌面 secret store。

Tunnel 方面，官方 setup 支援 OpenAI Secure MCP Tunnel，也可使用 Cloudflare quick tunnel 或自行提供 HTTPS tunnel。若使用自訂公開 URL，文件要求把 secret path 視同密碼保護，因為本來只綁在 loopback 的工具面會因此具備外部可達性。

Plugins 是獨立的 MCP connector。Reviewed catalog 目前包含 Blender MCP、Knowledge Memory、Playwright Browser、Web Fetch 與 Unity Editor 等 recipe，也能安裝明確指定 executable／arguments 的本機 server、HTTPS Streamable HTTP MCP、MCPB bundle 或支援 OAuth 的遠端服務。Plugin discovery 另有最多 64 個公開工具與 250 KB schema 的界線，以限制宣告規模。

## 主要功能

- **真實專案檔案操作**：讓 ChatGPT 讀取、修改 approved workspace 內的檔案與 patch，並可下載 Agent 產生的檔案。
- **終端與測試執行**：以本機 shell／PTY 執行命令、測試與長時間工作，實際 tool result 可回到 conversation 與 session history。
- **桌面控制**：在支援平台提供螢幕觀察、滑鼠、鍵盤與剪貼簿能力；macOS 另需要 Screen Recording、Accessibility 等系統權限。
- **持久化 session**：conversation、工具結果與工作狀態不只依附某一個瀏覽器 tab，支援重新綁定與恢復。
- **Compact & Resume**：在上下文需要重整時建立 handoff，開新 ChatGPT conversation 後繼續使用同一個 session 與 worker history。
- **多 worker 協作**：把獨立工作拆給不同 worker，保留它們的上下文並可再次呼叫。
- **Goal／Loop**：把一次回合延伸成可根據目標判斷是否繼續、或持續在 brief 範圍內工作的任務驅動模式。
- **模型與 reasoning 選擇**：picker 反映目前登入 ChatGPT 帳號可見的模型與推理選項，而不是自行維護一份固定模型清單。
- **外部 MCP Plugins**：將瀏覽器、自動化、3D、記憶或自訂 MCP server 接入同一工作環境。
- **跨平台桌面應用**：提供 Windows、macOS 與 Linux 發布資產；`v2.1.11` 已於 2026-09-14 發布。

## 技術亮點

最有辨識度的是它選擇了和一般 Coding Agent 不同的**整合邊界**。Pi、Claude Code 或其他 Agent runtime 通常自己掌握模型 request、tool loop 與 CLI；CoS 則保留 ChatGPT 作為 provider conversation，把本機工具、durable state、worker 與恢復機制包在外圍。這個方向對研究「如何把既有聊天產品變成 Agent harness」很有參考價值。

第二個亮點是 **session continuity 被當成第一級功能，而不是單純摘要聊天紀錄**。Compact & Resume 不只是把一段 summary 貼到新對話，而是讓新的 provider conversation 接回同一個 local session，連同 worker history、task state 與實際工具結果一起延續。對長任務而言，這比只依賴單一模型 context 更接近 durable workflow runtime。

第三個亮點是 **worker 有持久生命週期**。worker 完成後仍能保留 conversation，再被後續工作喚回；加上 queue、tab recovery、identity、waiting state 與錯誤恢復，專案處理的已不是單純「spawn 多個 prompt」，而是瀏覽器型 multi-agent runtime 的資源管理問題。

第四個亮點是 **把高權限能力拆成不同安全面**。Core、Desktop、Plugins 與 companion bridge 並非共享完全相同權限，read-only mode 也能統一阻擋有效檔案寫入、command、desktop control 與 clipboard write。Plugins 因外部程序不繼承 approved-folder boundary，CoS 甚至在 read-only 時直接拒絕 external plugin call，避免把第三方 annotation 誤當成可靠的不可變更保證。

第五個亮點是它大量處理 **browser-driven Agent 的可靠性工程**。Changelog 持續處理 queued messages、分頁重用、worker recovery、Compact & Resume、message delivery、Goal／Loop recovery、connector refresh 與長 session 記憶體成長。這些問題通常不會出現在純 API Agent SDK，但對「把現有 WebChat 變成可長跑 harness」卻是核心難題。

## 限制與風險

第一個限制是 **專案仍明確標示為 beta**，即使版本號已進入 2.x。CHANGELOG 直接指出行為仍可能在 release 間改變；而 Repository 從 2026-08-22 建立到 2026-09-14 已快速演進至 `v2.1.11`，目前更適合積極試用與研究，而不是假設 connector protocol、UI automation 或 workflow surface 已長期穩定。

第二個風險是 **本機權限很高，而且 approved folders 不是完整 sandbox**。安全文件明確說明 `exec_command` 並不被限制在 approved folders；它只從核准 working directory 啟動，之後以目前 OS 使用者權限執行。Application path checks 也不是 kernel／VM isolation，因此不能把它視為隔離惡意本機程序或不可信命令的安全邊界。

第三個風險是 **Desktop 與 external plugins 會擴大攻擊面**。螢幕、鍵鼠、剪貼簿是桌面級能力；外部 plugin process 也不繼承 CoS 的 approved-folder 限制，而是使用目前 OS 使用者權限。導入自動化時應把 connector 啟用、tool allowlist、plugin 來源與系統帳號權限分開治理。

第四個風險是 **session recording 的隱私模型和 credential storage 不同**。憑證使用 `safeStorage`，但安全文件指出 durable session recording 不會由 `safeStorage` 加密；新安裝預設開啟記錄，setup 文件目前描述預設保留 30 天。因此同一個 OS 帳號下能讀取 session files 的人，也可能讀到對話與工具活動內容。

第五個限制是 **發布二進位目前未做 publisher signing／macOS notarization**。Windows 與 macOS 可能出現 SmartScreen、Gatekeeper 或瀏覽器警告，官方要求依 release checksum 驗證下載檔。Linux AppImage 在主機停用 unprivileged user namespaces 時，launcher 可能退回 `--no-sandbox`；若不接受這個行為，官方建議優先使用 DEB。

第六個限制是 **瀏覽器 companion 依賴 ChatGPT UI，而不是公開自動化 API**。這帶來很強的產品整合能力，也意味著 UI、模型 picker、分頁生命週期或 connector 行為改動都可能造成相容性工作。README 因此要求更新 app 後重新載入 extension，必要時也要 refresh ChatGPT 內的 CoS apps。

第七個限制是 **仍受 ChatGPT 帳號與產品能力約束**。CoS 不是繞過 provider 使用限制的代理層；來源明確表示帳號可用模型、usage 與 context limits 仍然適用，而且需要 ChatGPT Developer mode 與 custom MCP apps 可用。專案文件也提醒不得用 companion 規避使用限制或安全控制。

最後，`SECURITY.md` 將它描述為 solo-maintained beta，沒有 bug bounty 或保證的回應時限。對高權限桌面工具而言，採用者應把 release verification、最小權限、測試 workspace 與升級前驗證視為必要操作，而不是附加選項。

## 與你的相關性

依公開技術 Profile，這個專案對 **LLM／Agent** 屬於核心相關，因此 `llm_agent` 評為 5。它直接展示 MCP、本機工具、瀏覽器 conversation、multi-agent worker、durable session、長任務恢復與權限治理如何組成一個完整 harness，而且設計焦點正是模型之外的 Agent runtime。

對 **AI R&D** 評為 4。它不是模型訓練或推論研究框架，但很適合研究 Agent reliability、tool-use、session semantics、multi-agent orchestration、computer use、安全邊界與 browser-driven workflow；尤其能補足只看 API Agent SDK 時較少遇到的恢復與身分問題。

對 **AOI × AI** 評為 2。Repository 本身沒有電腦視覺或工業檢測演算法，不過 Core／Desktop／Plugins 可以成為 AI 工程開發、測試與電腦操作自動化的執行層參考；這屬於工程工具價值，而不是 AOI 模型能力。

對 **SillyTavern／AI RPG** 評為 3。CoS 不是角色聊天或敘事系統，但 durable session、可重用 worker、Goal／Loop、跨 conversation continuation 與 plugin 權限分層，對長期角色 Agent 或多角色協作 runtime 有可轉用的架構概念。

對 **Image Generation** 的直接相關性低，因此評為 1；外部 MCP plugin 理論上可以接影像工具，但這不是 Repository 的核心能力。

整體 `overall` 評為 5，主要原因是它提供了一條和自建 Agent SDK 明顯不同的 harness 路線：直接把既有 ChatGPT WebChat、MCP、本機 runtime 與 durable orchestration 組合成可實際工作的 Agent 環境，具有很高的比較與實驗價值。

## 建議怎麼使用

- `TRY`：先用非敏感、可重建的測試 Repository 體驗 Core connector，從少量 approved folders 與 read-only mode 開始，再逐步開啟 command、Desktop 或 Plugins。重點不是先追求最大自動化，而是驗證「ChatGPT conversation + local tools + session continuity」是否真的符合自己的工作節奏。
- `LEARN`：優先閱讀 README、`docs/setup.md`、`SECURITY.md` 與 `docs/plugins.md`，再搭配 changelog 觀察 worker、Goal／Loop、Compact & Resume 與 recovery 的演進。這能看出一個 browser-driven harness 真正需要補哪些 runtime 能力。
- `REFERENCE`：把它作為「利用既有 WebChat 建立 Agent harness」的架構樣本，特別比較 provider conversation、MCP capability、browser companion、durable session 與 OS permission boundary 應該怎麼拆層。
- `WATCH`：持續關注 beta 階段的 protocol／UI automation 變化、binary signing、安全修正、ChatGPT connector 相容性與多 worker reliability。專案更新速度很快，目前不宜把未文件化行為當成穩定契約。

若要做一個最小技術驗證，可以固定同一個小型 Repository，依序測試：讀檔 → 修改檔案 → 執行測試 → 分派一個 worker → 觸發 Compact & Resume → 確認新 conversation 是否仍能正確取得 session 與 worker 歷史。這組測試比單純確認「工具叫得動」更能驗證 CoS 真正有辨識度的價值。

## 與其他收藏的關聯

- [DeepSeek Harness 繁體中文版](./github-g36maid-deepseek-harness.md)：兩者都屬 Agent harness，但切入層次不同。DeepSeek Harness 自己掌握 agent loop、model adapter、tool registry、session 與 plugin composition；Chat On Steroids 則保留 ChatGPT 作為既有 provider conversation，在外圍補 MCP、本機工具、browser companion、worker 與 durable session。兩者很適合比較「自建 runtime」與「擴充既有 WebChat」兩種 harness 路線。
- [Pi Agent Harness](./earendil-works-pi.md)：Pi 提供自己的多供應商 LLM API、Agent Runtime、Coding Agent CLI 與 TUI，是可以直接嵌入產品的 Agent 基礎元件；Chat On Steroids 不重新包辦模型 request，而是使用帳號中現有 ChatGPT conversation。兩者可用來比較模型介接權在 runtime 內部或外部時，tool loop、session 與 UI 架構會如何改變。
- [Herdr](./github-herdrdev-herdr.md)：Herdr 把 orchestration 下沉到 terminal／PTY runtime，管理各種既有 Coding Agent 的持久終端與狀態；Chat On Steroids 則以 ChatGPT browser conversation 為中心，向下連接本機 terminal、desktop 與 plugins。若把 Agent 系統分層，Herdr 更接近執行／終端 control plane，CoS 更接近 provider conversation 與本機能力之間的 harness。

## 使用者備註

## 更新紀錄

### 2026-09-14

- 建立 Chat On Steroids Knowledge Card。
- 依 Repository metadata、README、`docs/setup.md`、`SECURITY.md`、`docs/plugins.md`、`package.json`、CHANGELOG 與 `v2.1.11` release 分析其 ChatGPT／MCP 本機橋接、持久 session、多 worker、Goal／Loop、Compact & Resume、權限邊界與 beta 風險。
