---
schema_version: 1
id: github-hankhuang0516-simulator-manager
title: simulator-manager
canonical_url: https://github.com/HankHuang0516/simulator-manager
source:
  type: github
  url: https://github.com/HankHuang0516/simulator-manager
  identity: github:hankhuang0516/simulator-manager
resource_kind:
  ai: project
  user: null
navigation:
  categories:
    ai:
      - Agent / Harness
      - AI Coding / DevTools
    user: null
created_at: 2026-09-15
updated_at: 2026-09-15
last_checked_at: 2026-09-15
summary: simulator-manager 是面向多個 Codex 工作階段的 macOS 共享測試資源協調器，將 iOS Simulator、Android Emulator 與 GUI 測試納入 FIFO 排隊、租約、期限、公平讓出與壓力感知降級機制，並附帶可直接啟用的 Codex Skill。它強調精確資源身分、失敗時保守拒絕與安全回收，適合作為 Agent 共用稀缺本機資源的架構參考。
classification:
  categories:
    ai:
      - Agent
      - AI Coding / DevTools
      - Infrastructure / Deployment
    user: null
  tags:
    ai:
      - Codex Skill
      - simulator scheduler
      - iOS Simulator
      - Android Emulator
      - FIFO scheduling
      - resource lease
      - GUI testing
      - macOS
      - SQLite
      - pressure-aware fallback
    user: null
relevance:
  ai:
    overall: 4
    ai_rd: 4
    aoi_ai: 2
    llm_agent: 4
    sillytavern_ai_rpg: 1
    image_gen: 1
  user: {}
actions:
  ai:
    - LEARN
    - REFERENCE
  user: null
status:
  ai: active
  user: null
---

# simulator-manager

## 一句話介紹

simulator-manager 是一套給 macOS 上多個 Codex 工作階段共用測試資源的協調器。它以 Python CLI 管理 iOS Simulator、Android Emulator 與前景 GUI 測試的排隊、租約、期限與釋放，並提供 Codex Skill，讓 Agent 在單一工作階段中採用同一套資源治理規則。

新安裝預設使用 Dynamic Simulator Pool：依「工作階段 + 專案 + 平台」建立持久但非永久占用的私人測試環境；主機資源壓力升高時，逐步降低並行度並退回 Traditional Mode 的共享 FIFO 排程。

## 它解決什麼問題

多個 Agent 或 Codex 工作階段若同時在同一台 Mac 執行裝置測試，容易出現模擬器搶占、Android 隱式裝置選擇、前景 GUI 互相干擾、逾時後資源未釋放，以及單一長任務長時間獨占有限主機資源等問題。

simulator-manager 把這些問題抽象成「稀缺測試資源的租約與排程」：工作階段先排隊，再取得被明確指派的裝置或 GUI 槽位；任務在固定總期限內完成、續租或公平讓出，最後只回收可驗證屬於管理器的資源。

## 核心概念

- **協作式治理**：所有參與工作階段必須採用同一套 Skill／專案規則與共享狀態；它不攔截任意外部 SDK 呼叫。
- **私人環境與使用權分離**：Dynamic Simulator Pool 維持穩定的私人裝置身分，但 idle 時仍可安全關閉，不等於永久占用執行資源。
- **FIFO 租約**：排隊等待發生在占用時鐘之前，取得資源後才開始計算工作期限。
- **單一總占用時鐘**：creation、boot、validation 共用 `max_hold_seconds`，避免分階段重設逾時。
- **公平讓出**：若已有其他工作階段等待，目前借用者在切片邊界釋放，剩餘工作重新排到佇列尾端。
- **壓力感知降級**：依記憶體壓力、正規化負載與可用磁碟，在 Dynamic、Constrained、Draining、Traditional 間漸進切換。
- **可追溯回收**：只對能證明所有權的精確 UDID、serial、AVD 或工作群組做停止；身分不明時採保守拒絕。

## 架構與技術

主要執行層是 Python 3.9+，專案宣稱執行時僅使用標準函式庫。`sim-manager` CLI 負責工作階段啟用、租約、裝置啟動、壓力監看、清理與狀態查詢。

共享狀態使用 SQLite，README 明確說明以 `BEGIN IMMEDIATE`、WAL 與 `FULL` synchronous 保護跨行程的排程、佇列與所有權。iOS 透過 `xcrun simctl` 管理 Simulator；Android 使用 `adb`、`emulator` 與 `avdmanager`，Dynamic 模式為私人 Android 環境建立獨立可寫 AVD 目錄並交易式保留 console／ADB port。

Agent 整合由 `skill/simulator-manager/SKILL.md`、`SESSION_START.md` 與 bootstrap／installer 組成。專案另有原生 SwiftUI 浮動面板，顯示租約、倒數、主機壓力與模式狀態。

## 主要功能

- 一則訊息啟用 Codex 工作階段並註冊穩定 session label。
- Dynamic Simulator Pool 為工作階段／專案／平台懶建立私人 iOS Simulator 或 Android AVD。
- Traditional Mode 使用固定共享池與 FIFO／權重容量排程。
- `sim-manager run` 將工作負載綁定租約與 process group，負責期限、終止與釋放。
- `--foreground` 與 `gui` pool 序列化需要可見桌面的操作。
- 等待者出現時可回傳 exit code `75`；只有明確可 restart 的命令才允許自動重新排隊。
- 壓力控制器以 hysteresis 避免模式頻繁震盪，低磁碟或高壓力時暫停新的私人環境建立。
- CLI `status`、watcher 與 SwiftUI dashboard 提供租約、佇列、環境與主機狀態。

## 技術亮點

1. **把 Agent 共用本機資源視為排程問題**：不是只包裝 `simctl`／`adb`，而是建立 admission、租約、deadline、yield、requeue 與 recovery 的完整狀態機。
2. **環境身分與即時占用解耦**：私人裝置可以保留資料與 session 綁定，但 idle 時可停止，降低長期主機成本。
3. **期限涵蓋建立與啟動成本**：creation、boot、validation 共用總時鐘，避免透過分階段操作繞過全局上限。
4. **公平性不假設任務可安全重跑**：一般命令只回報 `requeue_required`，避免排程器擅自重放帶副作用的工作。
5. **壓力降級主要控制新 admission**：不把另一個 session 的私人環境借出，也不直接停止既有工作。
6. **以 provenance 做安全邊界**：對裝置、PID／process group、重開機與舊版身分都採保守判斷，無法證明所有權時寧可保留資源。

## 限制與風險

- 僅針對單一 Mac 帳號與本機共享 state；官方文件明確不建議把資料庫放在 NFS 或 iCloud。
- 它提供的是裝置資料隔離與協作式排程，不是 Docker／VM 等級的主機隔離；工作階段仍共用 SDK、ADB server、Simulator UI、CPU、記憶體與桌面。
- 所有參與者都必須採用同一套協調規則，任意外部 `simctl`、`adb`、GUI 自動化或自行啟動的 emulator 仍可能繞過排程器。
- 嚴格時間政策主要依賴受監督的 `run`；手動租約若 owner 存活且工作狀態不明，管理器會傾向保護而不是強制回收，因此可能形成阻塞。
- 專案列出的邊界包含 process-group escape、外部 automation worker、罕見 PID 重用與部分建立／關閉狀態；這些情況以 fail-closed 為主。
- `VALIDATION.md` 記錄了本機與 CI 測試，以及 Android 36.1 target 問題的修正；但 Repository 建立於 2026-09-15，仍非常新，缺少長期社群採用與跨環境實戰證據。
- 授權為 MIT License。

## 與你的相關性

對公開技術背景中的 AI R&D 與 Agent 領域，這個專案的價值主要不在 iOS／Android 本身，而在「多個 Agent 如何安全共用稀缺執行資源」的工程模式。租約、FIFO、公平讓出、期限、provenance 與壓力降級，都是 Agent harness 從「能呼叫工具」走向「能穩定長時間執行」時會遇到的基礎設施問題。

對 AOI × AI／Computer Vision 的直接關聯較弱，但若未來需要多個自動化流程共用相機、GPU、測試機或其他硬體資源，這套資源治理思路仍有參考價值。它與 SillyTavern／AI RPG、影像生成的功能關聯則很低。

## 建議怎麼使用

目前建議以 `LEARN` 與 `REFERENCE` 為主。

優先研究 scheduler／lease 狀態模型、Dynamic 與 Traditional 的切換條件、公平讓出，以及「只回收可證明屬於自己的資源」這個安全原則。若實際有同一台 Mac 上多個 Codex 工作階段同時執行 iOS／Android／GUI 測試的需求，再考慮實際導入；導入前應確認所有工作階段共用同一 state/config，且既有 SDK／自動化流程不會繞過管理器。

## 與其他收藏的關聯

目前沒有建立具高度直接對應的現有 Knowledge Card 連結。概念上它位於 Agent／Harness 與 AI Coding／DevTools 的交界，適合作為「Agent 執行資源治理」的基礎設施案例。

## 使用者備註


## 更新紀錄

### 2026-09-15

- 建立 Knowledge Card。
- 依 README、Codex Skill、核心排程／provider 實作與 `VALIDATION.md` 整理 Dynamic Simulator Pool、Traditional Mode、租約／公平讓出、壓力降級與安全回收設計。
