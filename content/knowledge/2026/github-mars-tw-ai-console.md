---
schema_version: 1
id: github-mars-tw-ai-console
title: AI 控制台 · AI Console
canonical_url: https://github.com/mars-tw/ai-console
source:
  type: github
  url: https://github.com/mars-tw/ai-console
  identity: github:mars-tw/ai-console
resource_kind:
  ai: project
  user: null
navigation:
  categories:
    ai:
      - Agent / Harness
      - AI Coding / DevTools
      - Automation / Productivity
      - Memory / RAG / Knowledge
    user: null
created_at: 2026-09-18
updated_at: 2026-09-18
last_checked_at: 2026-09-18
summary: AI 控制台（AI Console）是一個本機優先的 AI CLI 控制與工作整合中心，集中索引多種 AI 對話，提供地端／相容 API 問答、多工具派工、技能管理、排程與 Tailscale 手機遙控，並以像素辦公室與單機 RPG 視覺化工作狀態。
classification:
  categories:
    ai:
      - AI Coding / DevTools
      - Agent
      - RAG / Memory / Knowledge
      - Infrastructure / Deployment
    user: null
  tags:
    ai:
      - ai-cli-hub
      - agent-orchestration
      - task-dispatch
      - conversation-indexing
      - local-first
      - LM-Studio
      - OpenAI-compatible
      - Electron
      - React
      - TypeScript
      - Python
      - Tailscale
      - skill-management
      - scheduler
      - pixel-office
    user: null
relevance:
  ai:
    overall: 5
    ai_rd: 4
    aoi_ai: 2
    llm_agent: 5
    sillytavern_ai_rpg: 2
    image_gen: 3
  user: {}
actions:
  ai:
    - TRY
    - INTEGRATE
    - LEARN
  user: null
status:
  ai: active
  user: null
---

# AI 控制台 · AI Console

## 一句話介紹

AI 控制台（AI Console）是一個本機優先的 AI 工作控制台：它把 Codex、Claude、Qwen、Kimi 等既有 AI 工具的對話搜尋、續接、文字問答、技能管理、派工、排程與執行狀態集中到同一個桌面介面，並用像素辦公室與單機 MMORPG 把原本抽象的工具狀態轉成可視化互動。

它的定位不是再造一個新的基礎模型或單一 Agent，而是建立在既有 AI CLI、LM Studio 與相容 API 之上的「本機控制面」。使用者仍可保留原工具與原資料格式，再由控制台統一發現、索引、調度與觀察。

## 它解決什麼問題

當一台電腦同時使用多個 AI CLI 或桌面工具時，工作狀態很容易分散：

- 舊對話散落在不同工具自己的資料夾與資料庫，使用者記得內容，卻未必記得標題或是哪個工具。
- 不同 CLI 各自有 session、resume、額度與工作目錄，切換成本高。
- 多個 Agent 可以執行同一類工作，但工具成本、限流狀態與擅長領域不同，人工分派與重試容易變得繁瑣。
- Agent 派工若只傳一段工作文字，可能遺漏本機規範、技能與安全邊界。
- 長時間派工需要排程、狀態、日誌與失敗原因，而不只是「程序退出碼為 0」。
- 一般使用者若直接面對多套 CLI、Python、模型服務與設定檔，導入門檻很高。

AI 控制台把這些問題集中在本機工作台處理。它一方面維持各 AI 工具原本的資料與執行方式，另一方面新增統一索引、派工佇列、規範／技能前置、失敗分類、排程與手機遙控等共用能力。

## 核心概念

### 1. 本機控制面，而不是新的模型層

控制台本身主要負責索引、搜尋、技能預覽、UI 與派工協調。文字問答可以走 LM Studio，也可以接使用者明確設定的 OpenAI 相容服務；派工則交給既有 AI CLI。

因此「本機優先」描述的是控制面與資料管理方式，不代表所有推論必然離線。只要使用者選擇雲端問答或雲端 AI CLI，問題、上下文或工單仍會依該服務的規則送往外部供應商並可能產生費用。

### 2. 對話索引與工具本體分離

索引器掃描常見 AI 對話來源，將可辨識的 JSONL、NDJSON、JSON 訊息陣列與部分 SQLite 訊息表正規化成可搜尋資料。搜尋同時比對標題與訊息正文，並保留工作目錄與 session 身分，以便回到原工具或建立後續工單。

來源掃描採只讀設計；索引則寫入控制台自己的資料區。這使它可以建立跨工具搜尋層，而不需要直接修改原始對話檔。

### 3. 把派工做成可觀測的工作佇列

主控台可將一句需求拆成多張工單，依可用工具、使用者指名、成本與限流狀態選擇執行者。工作採序列佇列，前一件真正結束後才派下一件，降低多個 Agent 同時修改同一批檔案互相覆蓋的風險。

派工結果也不只看 exit code。系統會區分已完成、沒有實際修改、依規範停止、執行失敗、人工停止等狀態，並保留重派與接力紀錄。

### 4. 規範與技能在派工前掛載

server/rules.py 會在工單前加入「執行前置」，要求執行者先讀指定規範檔，再依技能 frontmatter 判斷是否啟用相關 Skill。規範以檔案路徑引用，而不是複製全文進工單，避免規則更新後工單仍固定帶著舊副本。

技能比對則採保守設計，使用中英文 token、n-gram、負向條款與最低命中門檻，避免只因長工單出現泛用詞就錯掛技能。

### 5. 把工具狀態轉成一般使用者可理解的介面

專案一方面保留進階控制台與終端能力，另一方面刻意提供白話入口、安裝檢查、狀態說明、手機遙控、系統通知、像素辦公室與單機 RPG。這不是核心 Agent 演算法，但它反映出一個明確產品方向：讓多工具 AI 工作流不只可執行，也要讓非 CLI 導向的使用者看得懂現在發生什麼事。

## 架構與技術

專案前端以 React 19、TypeScript、Vite 與 Tailwind CSS 建置，桌面封裝使用 Electron；終端相關能力使用 xterm 與 node-pty。package.json 目前版本為 1.4.1。

後端與工具層主要由 Python 組成，而且作者刻意維持 Python 標準庫實作，不要求額外 pip 相依套件。主要模組包括：

- tools/indexer.py：掃描、正規化、去重與建立本機對話索引。
- server/api.py：提供靜態網站、本機資料與控制 API 的整合伺服器。
- server/planner.py：使用地端模型把一句需求拆成派工計畫；失敗時保留可執行的單工單退路。
- server/rules.py：在派工前掛上規範與技能資訊。
- server/schedule.py：以 JSON 儲存排程，並由背景執行緒觸發工作。
- src/components/ConversationSync.tsx：整合多種 AI 對話來源與同步狀態。
- src/components/SkillCenter.tsx：處理技能盤點、預覽、衝突與原子匯入。
- src/pixel/：像素辦公室的尋路、狀態機與渲染。
- src/rpg/：單機 RPG 的資料模型、戰鬥、內容與存檔。

地端問答預設整合 LM Studio 的 chat/completions 介面，也允許使用者自行加入 OpenAI 相容服務。派工端則支援多種 AI CLI，README 目前描述的工具包含 Claude、Codex、Qwen、Kimi、Grok 與 Gemini／Antigravity 等。

手機遙控採 Tailscale 路徑：開啟後只在 Tailscale 網卡額外提供遙控埠，並使用配對 token 保護；手機端只開放派工相關路徑，而不直接暴露對話、檔案、技能與設定 API。

## 主要功能

- 統一搜尋多種 AI 工具的歷史對話，支援正文搜尋、工作目錄分組、去重與來源狀態回報。
- 從原工作目錄續接既有工具，或把近期對話背景轉成新的後續工單。
- 使用 LM Studio 或自行設定的 OpenAI 相容服務進行文字問答。
- 一句話拆解成多張工單，依工具能力、成本、限流與使用者指名進行派工。
- 工單序列執行、進度與日誌顯示、中途補充指令、停止、重派與額度型接力。
- 技能中心提供 ZIP、資料夾與既有技能的預覽與匯入；匯入內容視為不受信任資料，不直接執行其中腳本。
- 排程支援每隔 N 分鐘、每日與每週執行，刻意避免以 cron 語法作為一般使用者入口。
- Tailscale 手機遙控可查看與操作派工、補充指令、停止與重派。
- 系統通知在派工完成時提醒使用者。
- 像素辦公室以角色行為視覺化 AI 工具的 active、idle、rate_limited 等狀態。
- 內建單機 MMORPG，讓等待工作完成的時間可以轉成低干擾的遊戲互動。
- 提供影像／影片生成相關工具探測與 Kimi media 路徑，並有素材生成與 sprite 正規化工具鏈。

## 技術亮點

### 1. 不要求所有 AI 工具遵守同一個 SDK

AI 控制台選擇包在既有 CLI 外層，而不是要求使用者把工作流全部搬到一個新 Agent framework。這讓各工具仍保留原生 session、認證、額度與工作目錄，控制台則專注在共同的控制與可觀測介面。

這種設計與典型「中央模型路由器」不同，更接近桌面端的 Agent control plane。

### 2. 派工的失敗語意比單純程序狀態更細

來源特別指出曾遇到雲端 API 失敗但行程仍回傳 0 的案例，因此後端會掃描完整日誌來辨識 429、529、額度耗盡、BLOCKED、沒有修改檔案等狀態。

這種「程序結束不等於任務成功」的設計對 Agent automation 很重要，因為模型／CLI 的成功條件通常比傳統 shell process 更複雜。

### 3. 成本與限流被納入派工策略

server/planner.py 的預設路由不是固定把工作交給最強或最昂貴的工具，而是把可用工具、使用者指名與成本順序納入調度。額度型失敗時也可以把同一工單與既有進度交給下一個可用工具。

這使「模型選擇」從單次聊天設定變成工作佇列的一部分。

### 4. 把 Prompt Injection 與本機控制面風險當成工程問題

專案沒有把 127.0.0.1 視為天然安全邊界。README 明確說明瀏覽器中的其他網頁仍可能向 loopback 發送請求，因此副作用端點加入 Origin 檢查，工具名稱採白名單，使用者工單不直接拼進命令列，請求大小與批次數量也有限制。

server/rules.py 另外對工單中的控制標記做中和，避免工作資料偽裝成派工系統前置規則。

### 5. 對話、技能、遊戲與視覺化共享同一個本機狀態層

像素辦公室與 RPG 並非獨立展示頁，而是可讀取工具是否工作、限流或正在執行工單。這提供一個有趣的人機介面設計案例：把可觀測性資料轉譯成角色動畫與遊戲狀態，而不是只放在傳統 dashboard。

## 限制與風險

- **「本機優先」不等於「所有資料永不出機」。** 索引、搜尋與控制介面可以留在本機，但只要選擇雲端問答或雲端 AI CLI，對話、問題或工單仍可能送往外部服務。使用者需要分清楚控制台的本機邊界與各執行工具自己的資料政策。
- **控制面具有高權限性。** 派工可以啟動 AI CLI，而這些 CLI 可能讀寫專案檔、執行命令或使用既有登入狀態。Origin、工具白名單與命令列隔離能降低風險，但不能把底層工具本身變成沙箱。
- **技能預覽不等於技能執行安全。** 控制台匯入時不執行技能內容並做路徑、大小、壓縮與敏感字串檢查，這是重要保護；但技能日後被 Agent 實際使用時，仍必須受底層 Agent 權限與規範約束。
- **依賴多個第三方工具的本機資料格式。** 對話掃描、原生名稱、resume 與狀態判定都可能受 Codex、Claude、Qwen、Kimi 等工具更新影響。專案已對未知或不支援 schema 採保守回報，但上游格式變動仍是長期維護成本。
- **目前成熟度仍偏早期。** Repository 建立於 2026-08-19，最新正式版 v1.4.1 發布於 2026-09-08。發行說明記錄 714 項網頁測試與 594 項 Python 測試通過，測試量可觀，但專案本身仍在短時間內快速增加手機遙控、技能中心、派工與新手流程，介面與契約仍可能持續變動。
- **打包體驗以 Windows 為主。** v1.4.1 明確提供 Windows x64 免安裝包，並內含 Python runtime；原始碼可自行建置，但目前公開發行證據主要集中在 Windows 套件，不宜直接假設其他桌面平台具有同等驗證程度。
- **本機模型路徑帶有具體 runtime 假設。** README 對 LM Studio 的 CPU llama.cpp runtime 有明確版本與安全檢查要求；對一般使用者而言較可控，但也增加模型與桌面環境更新後的相容性維護成本。
- **部分媒體整合與桌面應用設定耦合。** 例如 Kimi media 會讀取桌面版設定中的憑證與正式端點；即使金鑰不寫入日誌，這種整合仍依賴上游桌面程式的設定格式與行為穩定。

## 與你的相關性

依公開技術背景，這個專案與 **LLM／Agent** 的相關性最高。它直接處理多 AI 工具派工、Agent lifecycle、技能掛載、限流接力、日誌判定與本機控制面，適合用來研究 Agent orchestration 與 harness 不同層級應該負責什麼。

對 **AI R&D** 也很有參考價值，尤其是「模型路由不只看能力，還要看成本、限流、可執行性與失敗語意」這類工程取捨。它不是模型訓練框架，但很接近 AI 工具實際落地時需要的執行環境與可觀測層。

對 **影像生成** 有中度關聯：專案內含多後端影像生成探測、Kimi media 與像素素材處理管線，但影像生成不是整個控制台的主核心。

對 **AOI × AI** 的直接功能關聯較弱；若把它視為通用 AI 工程工作台，可輔助日常開發與 Agent 自動化，但它並沒有針對電腦視覺檢測或製造場景提供專用模組。

它雖然內建 RPG 與像素角色，但這部分主要是單機遊戲與工具狀態視覺化，不是角色型 LLM 或長期敘事 Agent，因此與 SillyTavern／AI RPG 的技術關聯不宜高估。

## 建議怎麼使用

- **TRY**：先用 Windows 免安裝版體驗「搜尋舊對話、接入一個 AI、問 AI、派一張工單」這條最短路徑，再決定是否需要技能中心、排程與手機遙控。
- **INTEGRATE**：如果日常工作已同時使用多個 AI CLI，可把它評估為統一的本機 control plane；整合時應先盤點每個工具的登入方式、工作目錄、可寫權限、限流與對話資料格式。
- **LEARN**：值得深入閱讀 server/planner.py、server/rules.py、對話索引器與派工 API，尤其可研究成本導向路由、Prompt Injection 防護、失敗語意與技能前置如何落在實際程式碼，而不只是提示詞。

若要長期採用，建議把「上游 CLI 格式變更、雲端資料邊界、技能執行權限、loopback API、防止同時修改檔案」列為主要回歸測試項目。

## 與其他收藏的關聯

- [Herdr](./github-herdrdev-herdr.md)：兩者都建立在既有 AI coding CLI 之上。Herdr 更偏向持久化 PTY／terminal runtime 與 Agent 狀態控制；AI Console 則更偏向桌面控制台、對話索引、任務派工、技能、排程與一般使用者介面。兩者可用來比較「終端執行層」與「桌面控制面」的分工。
- [DeepSeek Harness 繁體中文版](./github-g36maid-deepseek-harness.md)：DeepSeek Harness 關注較完整的 Agent runtime／harness 結構；AI Console 則保留多個既有 CLI，從外層做統一調度與可觀測性。適合比較「自己擁有 Agent runtime」與「協調既有 Agent 工具」兩種架構。
- [kairo](./github-yanjiye-hareno-kairo.md)：kairo 聚焦 Claude Code 長 session 的 context rollover 與交接；AI Console 則把多工具對話搜尋、resume 與「以近期內容建立新工單」放進統一介面。兩者共同碰到 session continuity，但處理層級不同。

## 使用者備註


## 更新紀錄

### 2026-09-18

- 建立 AI 控制台 · AI Console Knowledge Card。
- 依 Repository metadata、README、v1.4.1 發行資訊、package.json、server/planner.py 與 server/rules.py 分析其本機控制面、對話索引、多工具派工、技能治理與安全邊界。
