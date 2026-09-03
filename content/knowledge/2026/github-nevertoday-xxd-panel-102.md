---
schema_version: 1
id: github-nevertoday-xxd-panel-102
title: XXD Panel 102
canonical_url: https://github.com/nevertoday/xxd-panel-102
source:
  type: github
  url: https://github.com/nevertoday/xxd-panel-102
  identity: github:nevertoday/xxd-panel-102
resource_kind:
  ai: skill
  user: null
created_at: 2026-09-03
updated_at: 2026-09-03
last_checked_at: 2026-09-03
summary: XXD Panel 102 是供 Codex、Claude Code 等 Agent 使用的影像生成 Skill，將照片轉譯為幾何化、留白導向的編輯海報。它把原始美學提示詞設為唯一創作權威，再由 Skill 負責輸出模式、尺寸、文字、批次、偏好與生圖通道等執行層變數，形成可重用的風格工作流程。
classification:
  categories:
    ai:
      - Image Generation
      - Agent
    user: null
  tags:
    ai:
      - image-generation-skill
      - codex-skill
      - claude-code-skill
      - GPT-Image-2
      - prompt-architecture
      - style-brief
      - geometric-abstraction
      - batch-image-generation
      - capability-adaptive-ui
      - preference-memory
      - bitmap-workflow
    user: null
relevance:
  ai:
    overall: 4
    ai_rd: 3
    aoi_ai: 1
    llm_agent: 4
    sillytavern_ai_rpg: 2
    image_gen: 5
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

# XXD Panel 102

## 一句話介紹

XXD Panel 102 是一個以 `SKILL.md` 為執行契約的影像生成 Skill：它不把風格邏輯散落在工作流程裡，而是把 `references/original-prompt/zh-CN.md` 保留為唯一美學權威，再由 Agent 處理輸出模式、畫幅、文字、批次與生圖執行。

## 它解決什麼問題

一般「風格提示詞」很容易在實際使用時遇到兩種問題：一是每次都要重新描述尺寸、排版、文字與輸出形式；二是為了支援更多交付方式，不斷改寫原始提示詞，最後讓核心風格逐漸漂移。

XXD Panel 102 的切入點是把這兩件事拆開。原始提示詞只負責照片如何被轉譯成幾何色塊、清晰輪廓、正負形、大量留白與編輯海報語言；Skill 則只負責本次任務的交付變數。這使同一套美學能被套用到上下對照、左右對照、純設計圖與多裝置壁紙，而不需要重新發明一套風格描述。

它同時把單張圖片、圖片目錄批次、多尺寸輸出、文字語言、準確文案與偏好沿用納入同一套 Agent 工作流程，降低重複問答與手動整理成本。

## 核心概念

### 1. 美學權威與執行契約分離

`references/original-prompt/zh-CN.md` 被指定為唯一創作與美學權威，Skill 明確禁止自行摘要、潤飾、擴寫或重新詮釋其內容。這是一種很清楚的 Prompt ownership 設計：風格來源負責「作品應該長什麼樣」，Runtime 只負責「這次要怎麼交付」。

### 2. 用 mode-specific override 替換容器，而不是重寫風格

原始提示詞本來描述固定的 3:4 上下雙區構圖。Skill 在執行時以選定模式的 delivery block 取代舊的容器規則，但保留色彩、材質、主體轉譯、留白、文字氣質等美學要求。

這讓風格核心與輸出容器解耦，是本專案最值得參考的設計之一。

### 3. 每個輸出資產只收到一份明確契約

每次生成只附加一個選定模式，不把四種模式一起丟給模型自行猜測。多模式、多比例會拆成獨立完整畫布生成，降低互相干擾，也避免把一張結果機械裁切成不同交付尺寸。

### 4. 宿主能力自適應

Skill 會依 Agent Runtime 真正提供的互動能力調整問詢方式：有真正多選工具時使用多選；只有互斥單選工具時，不把它假裝成多選；沒有互動工具時則退回清楚的文字組合輸入。

這個設計重點不是 UI 本身，而是 Skill 不假設宿主一定具有某種工具能力。

## 架構與技術

Repository 的主要組成包括：

- `SKILL.md`：主要 Runtime 契約，定義觸發、參數解析、批次、能力適配、生成 prompt 組裝、輸出與驗證流程。
- `references/original-prompt/zh-CN.md`：唯一創作與美學權威；其他語言版本主要供閱讀，不反向修改執行時的原始風格來源。
- `references/`：包含 Runtime adapter、偏好規範與多語言風格資料。
- `scripts/configured_imagegen.py`：使用既有 Codex provider 設定呼叫相容的影像生成端點，預設模型為 `gpt-image-2`，並刻意避免把 provider、endpoint、header、credential、prompt 或 response body 輸出到一般結果中。
- `scripts/panel_preferences.py`：管理可安全沿用的交付偏好，不保存原圖、準確文案、生成結果、模型路由或憑據等敏感資料。
- `scripts/compose_panel.py`：保留給特定情境下的確定性拼合、尺寸校準與只讀稽核，不作為每次生成的主要美學引擎。
- `agents/openai.yaml`：提供 OpenAI Agent 介面資訊與預設使用描述，允許隱式觸發。

主要實作語言標示為 Python，但 Repository 的核心價值不在 Python 函式庫本身，而在 Skill 契約、提示詞治理與影像生成工作流程的組合。

## 主要功能

- 四種可組合輸出模式：`top-bottom`、`left-right`、`design-only`、`wallpaper-pack`。
- 支援多個常見比例、自訂比例與準確像素；不同長寬比以獨立完整構圖生成。
- 文字可選模型依風格提示詞生成、使用者提供準確文案，或完全不使用文字。
- 可指定文字語言／地區，不依人物外觀、檔名或場景自行猜測語言市場。
- 圖片目錄會自動進入批次模式，統一解析共用設定，但每張來源仍保持內容與生成上下文隔離。
- `wallpaper-pack` 可選連貫套裝或四張獨立重構，而不是從同一張圖片裁切。
- 可透過 `--prefs` 沿用、修改、重設或停用先前交付偏好。
- README 提供 Codex 與 Claude Code 的安裝方式，也支援透過 `npx skills` 安裝。

## 技術亮點

### Prompt governance 比風格本身更值得研究

這個 Repository 最有工程價值的地方，不只是幾何治癒風格，而是它把長提示詞當成需要治理的資產。Skill 明確規定哪些欄位可以被 Runtime 改寫、哪些內容必須逐字保留，能降低「Agent 為了幫忙而重新創作 Prompt」造成的風格漂移。

### 批次處理仍維持來源隔離

批次任務共用模式、尺寸與文字設定，但每個來源都重新讀取原始風格 brief、獨立建 prompt，禁止跨圖片沿用推論、文案或生成結果。對多模態 Agent 而言，這是一個實用的資料污染防線。

### 對 Agent 工具能力採能力偵測，而非固定介面假設

`SKILL.md` 對 Claude Code、Codex 與無問詢工具環境分別設計互動降級路徑。這種 capability-adaptive Skill 比只針對單一宿主寫死操作流程更具移植參考價值。

### 生圖憑據與一般輸出刻意分離

`configured_imagegen.py` 從既有 Codex provider 設定取得路由與認證資訊，但一般輸出只暴露脫敏後的能力／結果紀錄。這不是完整的安全沙箱，但至少把「工作流需要秘密」與「Agent 回覆不應顯示秘密」清楚分層。

## 限制與風險

- **授權限制明確：** Repository 使用 PolyForm Noncommercial License 1.0.0，只授權非商業目的使用。若要放進商業設計、客戶交付或企業產品流程，不能把公開 Repository 的授權直接視為可商用授權，需另行確認權利。
- **專案非常新：** Repository 建立於 2026-08-31，2026-09-03 仍持續更新。功能範圍已經很完整，但長期相容性、API 穩定度與社群驗證仍有限。
- **高度依賴生圖模型能力：** 風格一致性、文字正確率、主體保真與複雜構圖最終仍受影像模型影響；Skill 能治理 prompt 與流程，但不能消除生成模型本身的不確定性。
- **宿主與路由依賴：** 完整體驗依賴 Agent 能載入 Skill、讀取本地檔案、執行 Python、提供影像生成工具或可用的相容 provider。不同宿主的能力差異會影響互動方式與可用功能。
- **預設工作流有環境假設：** 例如偏好儲存、`~/Desktop/xxd/` 任務目錄、Codex provider 設定與本機圖片路徑，都需要在其他平台或受限環境中重新驗證。
- **Prompt 很長且規範密集：** 嚴格規則有助一致性，但也增加維護成本；未來若原始風格 brief、Runtime adapter 與模型行為不同步，可能出現契約衝突。

## 與你的相關性

依公開技術背景來看，這個 Skill 對 **Image Generation** 的相關性最高：它不只提供風格，而是展示如何把生成影像的 Prompt、輸出規格、文字控制、批次與多模型執行整理成可重用工作流程。

對 **LLM／Agent** 也有很高的參考價值，尤其是 Skill 的權威來源分層、能力自適應問詢、批次來源隔離，以及「Runtime 不得擅自重寫創作 brief」等契約設計。

它對一般 AI R&D 可作為 Prompt system 與 Agent workflow 設計案例；但與 AOI／Computer Vision 的直接關聯較弱，因為目標是創意影像轉譯，不是檢測、分類、分割或量測流程。

## 建議怎麼使用

- `TRY`：如果已有 Codex、Claude Code 或相容 Skills Runtime 與影像生成能力，可以直接用幾張不同類型照片測試 `design-only`、`left-right` 與多尺寸輸出，觀察風格穩定性與文字品質。
- `LEARN`：重點閱讀 `SKILL.md` 的 authority boundary、mode-specific delivery block、batch isolation 與 capability-adaptive preflight。這些設計比特定海報風格更容易移植到其他 Skill。
- `REFERENCE`：可作為「長 Prompt 如何與 Agent Runtime 解耦」的參考範本，尤其適合需要保護既有創作規格、又要擴充多種交付模式的生成式工作流。

若打算實際整合到工作流程，應先確認用途符合非商業授權，並實測目前使用的影像模型與宿主是否支援必要的圖片輸入、多圖參考、比例與文字能力。

## 與其他收藏的關聯

目前不手動指定尚未驗證的卡片連結。它與「Agent Skill 設計」、「Prompt／工作流治理」及「影像生成工具鏈」類型的收藏具有明顯語意關聯，可由 Knowledge Graph 的 embedding、relation 與 concept index 在重建時建立實際關係。

## 使用者備註


## 更新紀錄

### 2026-09-03

- 建立 Knowledge Card。
- 確認主要交付物為 Agent Skill，而不是一般 Python 應用。
- 記錄原始美學權威與 Runtime delivery override 的分層設計、批次隔離、宿主能力適配與非商業授權限制。
