---
schema_version: 1
id: github-kevintsai1202-humanizer-zh-tw
title: Humanizer-zh-TW
canonical_url: https://github.com/kevintsai1202/Humanizer-zh-TW
source:
  type: github
  url: https://github.com/kevintsai1202/Humanizer-zh-TW
  identity: github:kevintsai1202/humanizer-zh-tw
resource_kind:
  ai: skill
  user: null
created_at: 2026-08-26
updated_at: 2026-08-26
last_checked_at: 2026-08-26
summary: Humanizer-zh-TW 是面向繁體中文的 Agent Skill，透過一組寫作規則辨識並改寫常見 AI 寫作痕跡，並另附文字浮水印清理 Skill，將語氣人性化、不可見 Unicode 清理與文字 provenance 處理明確分工。可透過 npx skills 安裝到多種 Agent 環境。
classification:
  categories:
    ai:
      - LLM
      - Agent
      - General Tools
    user: null
  tags:
    ai:
      - agent-skill
      - ai-writing
      - zh-TW
      - text-humanization
      - prompt-engineering
      - text-provenance
      - unicode-cleaning
      - zero-width
    user: null
relevance:
  ai:
    overall: 4
    ai_rd: 3
    aoi_ai: 1
    llm_agent: 5
    sillytavern_ai_rpg: 3
    image_gen: 1
  user: {}
actions:
  ai:
    - TRY
    - INTEGRATE
    - REFERENCE
  user: null
status:
  ai: active
  user: null
---

# Humanizer-zh-TW

## 一句話介紹

Humanizer-zh-TW 是一組以繁體中文為主要語境的 Agent Skill：主 Skill 負責辨識與改寫常見 AI 寫作痕跡，另外搭配獨立的 `text-watermark-cleaner-zh-tw`，處理不可見 Unicode、zero-width 字元與文字型 provenance 等不同問題。

## 它解決什麼問題

LLM 產生的文字常出現固定句型、過度宣傳、空泛總結、模糊歸因、過多轉折詞或過度整齊的段落節奏。Humanizer-zh-TW 把這些現象整理成可讓 Agent 遵循的編輯規則，目標不是單純「換幾個同義詞」，而是在保留原意、事實與語氣的前提下，降低制式的 AI 寫作感。

專案也把另一類容易混淆的需求拆開：語氣與文風改寫不等於文字浮水印清理。主 Skill 處理寫作模式；附加 Skill 則處理不可見字元與文字 provenance，避免把自然改寫誤稱成「已移除浮水印」。

## 核心概念

- **規則導向的人性化編輯**：以可讀的寫作規則辨識宣傳式語言、過度強調意義、三段式結構、填充短語、同義詞循環、過度限定等常見模式。
- **保留資訊邊界**：要求保護程式碼、URL、路徑、API 名稱、引用、數字與必要揭露，不為了製造「人味」而虛構第一人稱經驗、資料或背景故事。
- **兩種問題分層處理**：`humanizer-zh-tw` 處理語氣、結構與寫作模式；`text-watermark-cleaner-zh-tw` 處理可檢查的文字載體與不可見 Unicode。
- **可驗證與 best-effort 分離**：附加 Skill 將確定性的文字衛生處理與統計式改寫分開，並明確要求不能把後者宣稱為已破解或驗證某家模型的私有 watermark。

## 架構與技術

這個 Repository 的主要交付物是 Skill，而不是獨立應用程式或函式庫。

- 根目錄 `SKILL.md` 定義 `humanizer-zh-tw` 的觸發條件、允許工具與完整編輯規則。它允許 Agent 使用 `Read`、`Write`、`Edit` 與 `AskUserQuestion`。
- README 提供 `npx skills add kevintsai1202/Humanizer-zh-TW` 的安裝方式，並列出 Claude Code、Antigravity、Cursor、Codex、Roo Code、Gemini CLI、GitHub Copilot 與 Windsurf 等 Agent 環境。
- `text-watermark-cleaner-zh-tw/` 是第二個獨立 Skill，內含 `SKILL.md`、`references/`、`agents/` 與 `scripts/`。
- 文字浮水印清理 Skill 的確定性處理可使用內附 Python 腳本與 PowerShell 包裝入口，來源說明指出這些腳本取自 `guillaumemeyer/watermarks-remover` 的相關實作並保留其 MIT 授權副本。
- Repository 本身採 MIT License；它是 `op7418/Humanizer-zh` 的 fork，README 亦說明核心內容源自 `blader/humanizer`，並參考 `hardikpandya/stop-slop`。

## 主要功能

- 辨識並改寫 README 所列的 24 類常見 AI 寫作模式，涵蓋內容、語言／語法、風格與交流填充等面向。
- 依使用者指定的正式、隨意或技術語氣改寫，同時要求保留原文中的核心資訊與不確定性。
- 保護程式碼、引用、URL、技術識別字與數值，降低文字編輯時誤傷技術內容的風險。
- 可直接作為 Agent Skill 安裝，而不是要求使用者自行把一大段提示詞複製到每次對話。
- 另附文字浮水印檢查／清理流程，區分只檢查、確定性 Unicode 清理與選擇性的統計式改寫。

## 技術亮點

第一個亮點是**把「去 AI 味」寫成可重複執行的編輯契約**。它不只列出禁用詞，而是要求 Agent 先分類需求、保護非 prose 區段、辨識模式、改寫問題片段，再檢查是否保留原意，這比單純提示「寫得自然一點」更可控。

第二個亮點是**把文字風格與 provenance 問題拆成兩個 Skill**。尤其附加 Skill 明確區分可驗證的不可見 Unicode 清理與無法證明的統計式 watermark 降低，這種證據層級分離對 Agent 工具設計很有參考價值。

第三個亮點是**繁體中文本地化不只是字詞翻譯**。專案明確要求保留繁體字、全形標點、中文引號與 CJK 排版特性，也提醒不要拿英文 token 數或英文文體指標直接判斷中文文字，較符合 zh-TW 實際使用情境。

## 限制與風險

- 「更像人寫」本質上是文風判斷，沒有客觀指標能保證改寫結果一定比原文自然；使用者仍需要人工審閱。
- 規則過度套用可能抹平作者原本的個人語氣，尤其技術文件、學術文字或有意採用固定結構的內容，不應只因符合某個模式就全部重寫。
- 文字浮水印 Skill 已自行聲明：確定性 Unicode 清理可以前後驗證，但統計式改寫只是 best-effort，沒有相同 detector／key／設定時不能證明某家模型的私有 watermark 已被移除，也不能因此證明內容由人類撰寫。
- Skill 具備讀寫檔案能力；處理重要文件時應保留原檔並檢查 diff。附加 Skill 的設計本身也偏向輸出 `.cleaned` 副本而非直接覆寫。
- Repository 是上游專案的 fork，後續規則可能與上游分歧；導入前應確認目前版本是否仍符合自己的文字規範與 Agent Runtime。
- 來源在 2026-08-26 仍有新的主分支提交，顯示目前持續維護中，但這不等於已有完整測試、長期相容性或穩定版本保證。

## 與你的相關性

依公開技術背景來看，這個 Skill 對 **LLM／Agent** 最直接。它展示了如何把模糊的「改善輸出品質」需求轉換成 Agent 可遵循的具體編輯步驟、邊界與證據層級，適合作為提示工程與 Agent Skill 設計的參考。

對 **AI R&D** 而言，它也適合拿來觀察「生成後處理」的工程化方式：哪些規則可以明確化、哪些只能做 best-effort、哪些結果需要額外驗證。它與 AOI × AI、影像生成沒有直接技術關聯。

對 **SillyTavern／AI RPG** 則有中度延伸價值：若需要整理角色敘事、長文或對話輸出，可以借用其避免制式 AI 文風的規則；但專案本身不是為角色扮演或敘事引擎設計，因此不屬核心用途。

## 建議怎麼使用

- `TRY`：安裝成本低，可先用少量繁體中文技術文字、文章或 Agent 輸出做前後比較，確認規則是否符合自己的文風偏好。
- `INTEGRATE`：若已有 Claude Code、Codex、Gemini CLI 等 Agent 工作流，可把它作為文字交付前的可選後處理步驟，而不是每次臨時貼提示詞。
- `REFERENCE`：最值得參考的是它對「文風改寫」與「文字 provenance／Unicode 清理」的分工，以及可驗證結果與 best-effort 結果的界線。

不建議把它當成「AI 偵測規避保證器」；較合理的定位是文字品質與格式衛生工具，改寫後仍應由作者確認事實、語氣與必要揭露是否完整。

## 與其他收藏的關聯

目前不手動建立未驗證的 Card 連結。後續可由 Repository 的分類、Tag 與關係索引，與其他 Agent Skill、提示工程或文字處理類收藏建立關聯。

## 使用者備註


## 更新紀錄

### 2026-08-26

- 建立 Knowledge Card；來源經 Repository Remote Ingest resolver 驗證為新來源。
- 收錄主 `humanizer-zh-tw` Skill 與附加 `text-watermark-cleaner-zh-tw` Skill 的分工、安裝方式、技術邊界與風險。
