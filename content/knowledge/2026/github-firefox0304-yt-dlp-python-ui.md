---
schema_version: 1
id: github-firefox0304-yt-dlp-python-ui
title: yt-dlp-Python-UI
canonical_url: https://github.com/Firefox0304/yt-dlp-Python-UI
source:
  type: github
  url: https://github.com/Firefox0304/yt-dlp-Python-UI
  identity: github:firefox0304/yt-dlp-python-ui
resource_kind:
  ai: project
  user: null
navigation:
  categories:
    ai:
      - Automation / Productivity
      - Video Creation
    user: null
created_at: 2026-11-24
updated_at: 2026-11-24
last_checked_at: 2026-11-24
summary: 以 yt-dlp 為核心的 Windows 影音下載桌面應用程式，透過 pywebview 整合 HTML、CSS、JavaScript 介面與 Python 後端，支援批次下載、格式選擇、字幕擷取、進度管理及相依套件維護。
classification:
  categories:
    ai:
      - General Tools
    user: null
  tags:
    ai:
      - yt-dlp
      - Python
      - pywebview
      - FFmpeg
      - WebView2
      - Desktop GUI
      - Batch Download
      - Media Processing
    user: null
relevance:
  ai:
    overall: 3
    ai_rd: 3
    aoi_ai: 2
    llm_agent: 2
    sillytavern_ai_rpg: 1
    image_gen: 2
  user: {}
actions:
  ai:
    - TRY
    - REFERENCE
  user: null
status:
  ai: active
  user: null
---

# yt-dlp-Python-UI

## 一句話介紹

將 yt-dlp 命令列影音下載能力包裝成圖形化桌面應用程式，兼具批次下載與本機工具維護功能。從 v6.0 起改用網頁介面與 Python 後端的架構。

## 它解決什麼問題

降低使用 yt-dlp 時查找命令列參數、管理影音格式、處理播放清單及安裝外部依賴的操作負擔，讓不熟悉終端機的使用者也能管理下載工作。

## 核心概念

- 使用既有影音下載引擎，而非重新實作各平台的影音解析。
- 將網頁介面與本機 Python 功能分離，透過 pywebview 在桌面視窗中互動。
- 將下載進度、系統診斷、套件更新及錯誤訊息納入使用者操作流程。

## 架構與技術

- 前端：`web/index.html`、`web/style.css`、`web/app.js`。
- 桌面視窗：pywebview 與 Windows WebView2。
- 後端：Python；`modules/webui.py` 負責網頁與 Python 的橋接，`progress.py` 解析進度，`check.py` 管理啟動檢查與安裝，`diagnostics.py` 匯出診斷資訊。
- 影音處理：yt-dlp 負責擷取與下載，FFmpeg 支援影音合併和轉檔；新版亦檢查 yt-dlp-ejs 與 Deno 等依賴。
- 國際化：`locales/` 分開管理介面、錯誤與日誌文字。
- 截至 2026-11-24，主分支版本與 GitHub 最新發布均為 v7.1.2（發布於 2026-11-20）。

## 主要功能

- 單一網址、批次清單與播放清單下載，支援從文字整理網址。
- 選擇影音格式及畫質，擷取字幕、縮圖和影片資訊。
- 匯入瀏覽器 Cookie 或 Cookies.txt。
- 顯示進度、取消下載、保存最近 50 筆下載歷史。
- 支援分片串流的並行下載設定、套件更新檢查、系統診斷及多語系介面。

## 技術亮點

此專案值得參考的重點是既有命令列工具的桌面化，而不只是影音下載。網頁前端能提供較彈性的視覺設計，Python 則保留本機檔案處理、子行程管理及工具整合能力。啟動檢查、進度解析、取消工作與診斷資訊是其他工程工具也能借鑑的設計。專案提供單元測試與語系一致性檢查；本卡未實際執行其測試。

## 限制與風險

- v6.0 以上僅支援 Windows，舊版 v5.6 使用 Tk 介面並支援其他作業系統。
- 功能受 yt-dlp、影音平台變更及外部程式版本影響；分片並行不代表一般影片一定會加速。
- Cookie 可能含有敏感登入資訊，執行檔與自動安裝流程也需在信任來源、權限及套件供應鏈方面進行審查。勿將 Cookie 或含敏感資料的診斷檔公開。
- GitHub 中繼資料未標示專案授權；不可將公開程式碼視為已授權商用或重新散布。
- 僅處理有權使用的影音素材，遵守來源平台條款與著作權。
- 尚未進行實機驗證，不保證所有平台、格式與下載情境皆可正常使用。

## 與你的相關性

- AI RD（3/5）：可作為合法影音資料集蒐集的輔助工具，以及 Python 工程工具桌面化參考。
- AOI × AI（2/5）：介面橋接、進度管理、診斷及環境檢查設計有間接工程價值，但不具備瑕疵檢測能力。
- LLM / Agent（2/5）：可參考既有命令列工具的封裝方式，但本身不是 Agent 或模型框架。
- SillyTavern / AI RPG（1/5）：與角色扮演系統無直接關聯。
- Image Gen（2/5）：可輔助取得有權使用的影音素材，但不提供影像生成模型。

## 建議怎麼使用

- TRY：在可信的 Windows 測試環境中，以有權下載的素材測試格式選擇、字幕與批次下載。
- REFERENCE：研究 pywebview 的橋接、工作進度、相依套件檢查、多語系及診斷設計，作為 Python 桌面工程工具的架構參考。

主要來源：[README](https://github.com/Firefox0304/yt-dlp-Python-UI/blob/master/README.md)、[最新發布](https://github.com/Firefox0304/yt-dlp-Python-UI/releases/tag/UI-v7.1.2)、[更新紀錄](https://github.com/Firefox0304/yt-dlp-Python-UI/blob/master/CHANGELOG.md)。

## 與其他收藏的關聯

可從影音資料前處理、桌面工具介面設計、批次工作管理等主題探索相關收藏；目前不指定尚未驗證的卡片關聯。

## 使用者備註

## 更新紀錄

### 2026-11-24

- 首次收錄；完成 GitHub 來源識別與重複性檢查，整理架構、功能、限制及公開技術背景相關性。
