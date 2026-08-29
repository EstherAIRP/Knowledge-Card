---
schema_version: 1
id: github-twinklestars1029-sillytavern-regex
title: Regex Tavern
canonical_url: https://github.com/TwinkleStars1029/Sillytavern_Regex
source:
  type: github
  url: https://github.com/TwinkleStars1029/Sillytavern_Regex
  identity: github:twinklestars1029/sillytavern_regex
resource_kind:
  ai: project
  user: null
created_at: 2026-08-29
updated_at: 2026-08-29
last_checked_at: 2026-08-29
summary: Regex Tavern 是一個面向 SillyTavern 使用者的繁體中文 Regex 互動學習網站，以 15 課、77 題行為式評分練習、安全 Playground、錯題複習、速查模板與案例，把角色扮演介面常見的文字匹配與替換需求轉成可直接操作的教材；前端以 TypeScript、React、Vinext 建構並部署於 GitHub Pages。
classification:
  categories:
    ai:
      - SillyTavern / AI RPG
      - General Tools
    user: null
  tags:
    ai:
      - Regex
      - SillyTavern
      - interactive learning
      - behavioral grading
      - Web Worker
      - sandboxed iframe
      - Content Security Policy
      - TypeScript
      - React
      - Vinext
      - GitHub Pages
    user: null
relevance:
  ai:
    overall: 5
    ai_rd: 2
    aoi_ai: 1
    llm_agent: 2
    sillytavern_ai_rpg: 5
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

# Regex Tavern

## 一句話介紹

Regex Tavern 是一個專為 **SillyTavern 使用者學習實用正規表示式（Regex）** 設計的繁體中文互動教材網站，把傳統文件裡較抽象的語法說明，改造成「讀概念、立即修改 Pattern、看匹配與 Capture Group、跑行為測試、理解結果」的學習流程。

它不是 SillyTavern 官方擴充套件，也不會直接執行 SillyTavern slash command；它的定位是獨立、非官方的學習工具與安全實驗環境。

## 它解決什麼問題

SillyTavern 的角色扮演與文字處理情境常需要 Regex 做搜尋、擷取、替換或格式整理，但一般 Regex 文件通常以語法表與零散範例為主。對不熟悉 Regex 的使用者而言，真正困難的往往不是背語法，而是理解「這個 Pattern 為什麼匹配到這裡、哪個群組抓到了什麼、替換後會變成什麼」。

Regex Tavern 把這段學習成本拆成結構化課程與可立即操作的練習。來源目前提供 15 課、77 題互動題、34 個速查 Pattern、12 個完整案例與 15 個術語，並另外提供 Playground、錯題重練與挑戰流程。

另一個重要問題是安全性。任意 Regex 可能因災難性回溯造成瀏覽器長時間卡住；如果教材還允許產生 HTML 預覽，也會衍生腳本或標記注入風險。這個專案因此把 Regex 執行與 HTML 顯示都設計成明確的安全邊界，而不是直接在主要頁面執行不受控輸入。

## 核心概念

第一個核心是 **情境化學習**。教材不是單純介紹 Regex 規格，而是把 SillyTavern 使用者會遇到的文字處理需求放進課程、案例與速查表中，讓 Regex 被視為一個可解決具體問題的工具。

第二個核心是 **行為式評分（behavioral grading）**。77 題練習不要求學習者輸入唯一的參考答案，而是檢查輸出、匹配數量、Capture Group、必要 flags、規則順序等可觀察結果。只要另一個 Regex 能產生符合題目要求的行為，也可以通過。這比字串比對答案更接近真正的程式練習評測。

第三個核心是 **隔離不可信執行**。使用者輸入的 Regex 放在獨立 Web Worker 內執行，設定 400 ms timeout、100,000 字元輸入上限與 5,000 筆匹配上限；逾時時終止並重建 Worker，避免主介面被長時間阻塞。

第四個核心是 **本機優先的學習狀態**。課程進度與顯示偏好只保存在瀏覽器 localStorage，Playground 案例載入資料則使用一次性的 sessionStorage。專案明確表示不收集聊天內容、角色卡、API key 或帳號資料。

## 架構與技術

主要技術棧是 TypeScript、React 與 Vinext。`package.json` 顯示 React 19、Next 16 與 Vinext 0.0.50 等依賴；正式版本採靜態輸出，並透過 GitHub Actions 部署到 GitHub Pages，因此使用者不需要帳號、後端資料庫或 API key 就能使用主要功能。

內容層把課程 Markdown 正規化成可驗證資料，互動題、案例、速查表與術語則使用具型別的資料目錄。這讓內容不只是散落在頁面元件內，而是可以透過驗證腳本檢查數量、格式、連結與結構完整性。

Regex 執行流程可概括為：

```text
使用者輸入
→ 請求限制檢查
→ 獨立 Web Worker 執行 Regex
→ timeout 時終止並重建 Worker
→ 回傳結構化 match / capture / replacement 結果
→ 需要 HTML 預覽時先做白名單清理
→ 放入無權限 sandbox iframe
→ 套用獨立 Content Security Policy
```

安全預覽另外使用 HTML sanitization 與 sandboxed iframe。Repository 的相依套件包含 `sanitize-html`、`rehype-sanitize` 等工具；README 與 `SECURITY.md` 都明確把「先清理、再進 sandbox iframe、再套 CSP」列為安全邊界。

專案也把品質檢查集中到 `npm run quality`，涵蓋格式、lint、typecheck、內容與無障礙稽核、課程與題庫驗證、內部連結、單元測試、安全測試、production build、bundle budget、production audit、smoke test 與端到端學習流程。

## 主要功能

- 15 課、三階段的繁體中文 Regex 課程。
- 77 題依實際行為評分的互動練習。
- Playground：即時標示匹配、顯示編號與命名 Capture Group、Find/Replace 結果與安全 HTML 預覽。
- 錯題與已揭曉答案的 review queue，可重新組成針對性練習。
- 練習篩選、隨機 session、階段挑戰與總挑戰。
- 34 個速查 Pattern、12 個完整案例與 15 個術語。
- SillyTavern 專用的完整非官方設定附錄。
- 學習進度保存在使用者自己的瀏覽器，不需要帳號或雲端同步。
- 靜態 GitHub Pages 部署，桌面與行動瀏覽器皆可使用。

## 技術亮點

最值得參考的是 **行為式 Regex 題目評測器**。對 Regex 教學而言，正確答案通常不只一種；若只比對 Pattern 字串，會把等價解誤判成錯誤。Regex Tavern 改成驗證實際匹配結果、Capture Group、flags 與規則條件，讓評分從「重現標準答案」轉成「滿足可觀察需求」。這個設計也可延伸到其他具多種等價解的程式教學工具。

第二個亮點是 **針對 Regex ReDoS／災難性回溯的瀏覽器隔離策略**。把執行放進 Worker、設定硬 timeout，並在逾時後直接重建執行環境，搭配輸入長度與匹配數量上限，比單純依賴「提醒使用者不要寫危險 Pattern」可靠得多。

第三個亮點是 **HTML 預覽的多層防線**。先做 allowlist sanitization，再放入沒有權限的 sandbox iframe，並額外設定 CSP。這種作法把內容清理、瀏覽器隔離與資源／腳本政策分層處理，具有通用的前端安全設計參考價值。

第四個亮點是 **內容工程與產品工程一起驗證**。它不只測元件與程式邏輯，還把課程資料、練習目錄、案例、術語、內部連結、無障礙、bundle 與 production route 納入 release gate。對教材型產品而言，這比只有一般 unit test 更完整。

## 限制與風險

第一，它是 **獨立、非官方的 SillyTavern 教學資源**。專案本身不執行 SillyTavern slash command，也不代表 SillyTavern 官方行為；遇到與特定 SillyTavern 版本、擴充或實際 Regex 處理順序相關的細節，仍應回到實際環境驗證。

第二，這是一個瀏覽器中的 Regex 學習與實驗環境。從技術棧判斷，它主要依賴 JavaScript 瀏覽器 Regex 能力；如果目標平台使用不同 Regex 引擎或額外處理規則，語法與行為未必完全等價。這是從執行環境得出的工程推論，不是來源聲稱的跨引擎相容保證。

第三，學習進度只保存在 localStorage，因此換裝置、清除瀏覽器資料或更換瀏覽器後，不會自動同步。這符合專案的隱私與無帳號設計，但也限制了跨裝置學習體驗。

第四，GitHub metadata 目前沒有偵測到 License，README 也明確寫過應由專案擁有者選擇授權條款。Repository 雖已公開，但在正式重用、修改或再散布原始碼前，仍應先確認授權狀態，不能把「公開可讀」等同於「已授權任意重用」。

第五，README 列出的完整 release gate 成績是 2026-07-16 的本機驗證紀錄；Repository 之後仍有更新，最新可見提交到 2026-08-10。這次收錄已重新驗證目前公開來源與 Repository 狀態，但沒有替來源專案重新執行它自己的 `npm run quality`，因此不把 README 的舊測試數字延伸宣稱為目前最新測試結果。

## 與你的相關性

依公開技術 Profile，這個專案對 **SillyTavern / AI RPG** 的相關性非常高。它不是模型、Agent framework 或記憶系統，而是更基礎但實用的文字處理能力教材：透過具體的匹配、Capture Group 與替換練習，降低在角色扮演介面中使用 Regex 的門檻。

對 AI R&D、LLM／Agent 而言，直接技術相關性較低，但仍有兩個可參考點：一是行為式評分器如何接受多種等價解；二是如何在瀏覽器安全執行潛在高成本的使用者輸入。這兩者都可延伸到互動式程式教育、提示詞工具或 Agent 輔助編輯器。

對 AOI × AI 與影像生成則幾乎沒有直接關聯，因此這張 Card 的高 overall 分數主要來自公開 Profile 對 SillyTavern／AI RPG 的明確興趣，而不是泛化成所有 AI 技術方向都高度相關。

## 建議怎麼使用

建議先 `TRY`：直接使用 GitHub Pages 線上版本，從入門課與 Playground 開始，不需要安裝任何後端或設定 API key。若平常在 SillyTavern 裡會遇到 Regex 規則看得懂但不敢改的情況，這個工具很適合用來建立操作直覺。

同時給予 `LEARN`，因為它不只是內容教材；行為式題目評測、Worker timeout、HTML sanitizer + iframe + CSP、以及完整內容驗證流程，都值得從產品工程角度拆解。

最後給予 `REFERENCE`，主要是保留它作為「安全互動式 Regex 教材」的設計樣本。若未來要製作其他教學網站、程式練習系統或可執行使用者輸入的前端工具，可以直接參考它的評分與隔離策略。

## 與其他收藏的關聯

本 Card 先透過 `SillyTavern / AI RPG` 分類，以及 `Regex`、`behavioral grading`、`Web Worker`、`Content Security Policy` 等 Tag 交由 Knowledge Graph 的關係索引建立相近項目。這次不手動加入未驗證的 Card 連結，避免建立不存在或錯誤的關聯。

## 使用者備註

## 更新紀錄

### 2026-08-29

- 建立 Regex Tavern Knowledge Card。
- 以 Repository Remote Ingest 重新確認 canonical URL、穩定 source identity、create 模式與寫入路徑。
- 重新閱讀 Repository metadata、英文／繁體中文 README、`package.json`、`SECURITY.md` 與近期提交紀錄，補充行為式評分、安全執行與授權狀態分析。
