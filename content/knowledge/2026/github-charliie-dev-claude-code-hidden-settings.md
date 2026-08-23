---
schema_version: 1
id: github-charliie-dev-claude-code-hidden-settings
title: Claude Code Hidden Settings
canonical_url: https://github.com/charliie-dev/claude-code-hidden-settings
source:
  type: github
  url: https://github.com/charliie-dev/claude-code-hidden-settings
  identity: github:charliie-dev/claude-code-hidden-settings
resource_kind:
  ai: project
  user: null
created_at: 2026-08-23
updated_at: 2026-08-23
last_checked_at: 2026-08-23
summary: 針對 Claude Code v2.1.239 的設定與環境變數研究，交叉比對官方文件、Schema、changelog 與固定版本執行檔，整理已文件化設定、文件落差及高信心度隱藏控制項，並透過直接 runtime read 與差分測試區分真正行為與僅出現在字串表中的候選名稱。
classification:
  categories:
    ai:
      - AI Coding / DevTools
      - LLM
      - Agent
    user: null
  tags:
    ai:
      - claude-code
      - hidden-settings
      - settings-json
      - environment-variables
      - binary-analysis
      - reverse-engineering
      - agent-configuration
    user: null
relevance:
  ai:
    overall: 5
    ai_rd: 5
    aoi_ai: 1
    llm_agent: 5
    sillytavern_ai_rpg: 2
    image_gen: 1
  user: {}
actions:
  ai:
    - LEARN
    - REFERENCE
    - WATCH
  user: null
status:
  ai: active
  user: null
---

# Claude Code Hidden Settings

## 一句話介紹

這是一份針對 Claude Code `v2.1.239` 的設定面研究：先建立官方文件基準，再將 Schema、changelog 與固定版本執行檔交叉比對，找出文件落差與可被 runtime 實際讀取的隱藏控制項，並盡量驗證它們對提示詞、工具、Agent、記憶與工作流程的實際影響。

## 它解決什麼問題

Claude Code 的設定面並不只存在於 `settings.json`。官方設定參考、環境變數文件、Schema、release changelog 與執行檔內部實作之間可能存在時間差或用途差異，因此「搜尋到某個變數名稱」不等於它目前受支援，也不等於它適合由使用者設定。

這個 Repository 的價值在於把幾種容易混淆的證據拆開：目前官方文件明確支援的設定、只在 changelog 出現的歷史名稱、Schema 與文件不一致的項目，以及固定版本 binary 內確實存在直接 runtime read、但未出現在公開來源基準中的候選控制項。這讓研究者能更精確地判斷某個設定究竟是正式介面、文件漂移、內部實驗開關，還是單純的實作細節。

## 核心概念

1. **先建立公開基準，再談 hidden。** 文件以 Claude Code `v2.1.239` 為快照，整理官方設定參考中的 145 個 canonical top-level behavioral keys，以及環境變數參考中的 339 個具名表格列，避免把已公開但不熟悉的選項誤標成隱藏功能。
2. **Schema 不是絕對真相。** 來源指出 docs-linked JSON Schema 可能落後 CLI，因此以目前官方 reference 作為「已文件化／受支援」判定基準，再分析 Schema 與文件間的差異。
3. **changelog 證據不等於目前支援契約。** 某個名稱曾出現在 release history，只能證明它曾被提及，不能直接推論目前仍是正常使用者設定介面。
4. **binary 字串存在也不夠。** 後段方法要求候選名稱不只存在於產生式環境變數表，還要找到 `G.NAME` 或 `process.env.NAME` 形式的直接 runtime read，降低純字串表、測試資料或未使用 schema 欄位造成的假陽性。
5. **真正重要的是布林語意與呼叫路徑。** 文件特別區分 `triBool`、直接 `bool`、`env || model || remoteGate` 等不同模式；同樣寫成 `...=0`，有些是可靠關閉，有些只能 force-on、無法覆蓋模型 bundle 或遠端 gate。

## 架構與技術

這個 Repository 本身不是 Claude Code 外掛或執行工具，而是一份版本化研究文件。目前主分支主要包含 `claude-code-hidden-settings-2.1.239.md` 與 MIT `LICENSE`，沒有 README；主要交付物就是該版本分析。

研究方法可以視為一條證據管線：

```text
官方 settings / env reference
→ docs-linked JSON Schema
→ pinned Claude Code repository / changelog
→ 固定版本 executable 的環境變數 schema 與直接 runtime read
→ 呼叫路徑追蹤
→ loopback fake Messages API 差分測試
→ 行為與風險分類
```

來源固定到 Claude Code `v2.1.239`，並在 binary-analysis 章節列出分析執行檔的大小、SHA-256 與 embedded build revision。它先從 executable 匯出的 `CLAUDE_CODE_*` 型別化環境變數表找候選，再要求程式碼中存在直接讀取；在 405 個具有直接 runtime read 的名稱中，對照公開來源基準後留下 234 個未出現在所檢查公開來源中的候選。文件明確警告，這 234 個名稱並不等於 234 個值得使用的旗標，其中包含 host protocol、測試、憑證、telemetry 與內部 handshake。

對提示詞相關項目，來源使用隔離的臨時 profile 搭配 loopback fake Messages API，比較序列化的 `/v1/messages` request，藉此觀察開關前後 prompt 是否真的改變；這比單純反編譯搜尋更接近行為層驗證。

## 主要功能

- **正式設定盤點：** 整理目前官方 settings 與 environment-variable reference 的範圍，並區分 `settings.json`、`~/.claude.json`、managed-only、user/managed 等不同作用域。
- **Schema reconciliation：** 比較官方文件與 docs-linked JSON Schema 的時間差，列出文件中已有但 Schema 尚未涵蓋，以及 Schema-only 但目前 reference 未收錄的名稱。
- **環境變數行為圖：** 將與提示詞、工具與權限、Agent／session、context／memory、thinking、output 等相關的變數按實際用途整理，而不只是列清單。
- **隱藏控制項驗證：** 對高信心度候選追蹤 parser、gate 與最終作用位置，部分項目再以差分 request 驗證。
- **未索引的 top-level settings：** 文件從 executable root settings object 找出一批目前 canonical index 未列出的 accepted keys，並逐項說明形狀、嵌入行為與風險，例如 `breakReminder`、`quietHours`、`autoDreamEnabled`、`autoUploadSessions`、`policyHelpers` 等。
- **實務結論：** 特別整理哪些 hidden control 具有較可靠的 off 語意，哪些是一方向 force-on gate，並建議只要有正式 top-level setting 就優先使用官方設定，而不是依賴內部環境變數別名。

## 技術亮點

最值得參考的是它對「證據強度」的處理。許多隱藏功能清單只做字串搜尋，容易把 dead code、telemetry 欄位或 host 注入值當成使用者旗標；這份研究把公開 reference、Schema、changelog、binary schema、直接 runtime read、呼叫路徑與差分測試分層，讓每個結論能標示到不同可信度。

另一個亮點是它沒有把 boolean 當成單純的 on/off。對 Agent 系統來說，真正的控制面常由本地環境、模型 bundle、組織政策與遠端 feature gate 疊加；來源明確展示某些 `bool` 實際是 `env || model || remoteGate`，所以設定 `0` 並不能保證關閉。這個觀察對分析其他 AI coding agent 的實驗功能、提示詞注入與企業策略層也很有參考價值。

文件也把「控制模型可見 prompt」和「改變 UI／session／process lifecycle」分開，避免把所有 hidden settings 都當成 prompt hacking。這使它更接近 Claude Code runtime 的設定面逆向工程，而不是單純的技巧清單。

## 限制與風險

最大的限制是**版本綁定**。來源自己要求每次 Claude Code 更新都重新分析；binary offsets、internal codename、parser 語意與 remote gate 都可能在下一版改變，因此這張卡應視為 `v2.1.239` 的研究快照，而不是永久 API 文件。

隱藏控制項也不具官方相容性承諾。部分變數涉及 approval、policy、authentication、remote session、telemetry、host protocol 或安全 guardrail；來源明確建議不要隨意實驗，尤其像會弱化 caution wording、影響資料上傳、執行 helper 或改變同意流程的設定。

來源文件本身還有一個需要注意的一致性問題：開頭 Scope 寫著沒有檢查 locally installed executable，但後段又有完整的 `Local binary analysis`，列出本機 Claude Code binary 路徑、SHA-256 與差分測試方法。後段內容顯然提供了實際 binary-analysis 證據，但前言敘述可能未同步更新；引用這份研究時應以具體章節與證據為準，不要把整份文件當成無內部矛盾的單一敘述。

Repository 採 MIT License，但這只涵蓋該 Repository 的內容與授權條款，並不代表 Anthropic 對這些內部設定提供支援、穩定性或使用保證。

## 與你的相關性

對公開技術背景中的 AI R&D、LLM 與 Agent 領域，這份資料的價值很高。它提供一個可重用的方法論：如何把官方設定契約、文件漂移、執行檔行為、feature gate 與實際 request 差分拆開驗證，這類方法可延伸到其他 AI Agent runtime、coding agent 與模型工具鏈的設定面研究。

它與 AOI × AI 或影像生成本身沒有直接功能關係；主要價值在 Agent 工程、模型行為控制、工具權限與 runtime 可觀測性，而不是視覺模型或生成流程。

## 建議怎麼使用

- `LEARN`：研究它的證據分層、runtime-read 驗證與差分測試方法，這比直接照抄 hidden flags 更有長期價值。
- `REFERENCE`：需要追查 Claude Code 某個設定、環境變數或文件／Schema 落差時，可先用這份版本快照作索引，再回到當前官方文件確認。
- `WATCH`：Claude Code 更新頻繁，這類 hidden control 很容易失效或改變語意；值得持續觀察是否出現新版分析，而不是把 `v2.1.239` 的結果永久固化到工作流程。

不建議把這張卡的主要 Action 設成 `TRY` 或 `INTEGRATE`。若某項需求已有官方 top-level setting，應優先使用正式設定；只有在隔離測試環境、理解作用域與風險後，才適合研究 internal flag。

## 與其他收藏的關聯

目前未確認 Knowledge Card 中已有可直接建立連結的同來源或 Claude Code hidden-settings 卡片，因此不建立推測性關聯。

## 使用者備註

## 更新紀錄

### 2026-08-23

- 新增 Knowledge Card，收錄 `charliie-dev/claude-code-hidden-settings`。
- 以 `v2.1.239` 版本分析為主要證據，整理官方設定基準、Schema／changelog 差異、binary runtime read、差分測試方法與 hidden-control 風險。
