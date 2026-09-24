---
schema_version: 1
id: github-pottokao-dotcom-comfyui-qwenimage-photostyles
title: "ComfyUI-QwenImage-PhotoStyles：Qwen-Image-2.1 攝影風格提示詞重寫節點"
canonical_url: https://github.com/pottokao-dotcom/ComfyUI-QwenImage-PhotoStyles
source:
  type: github
  url: https://github.com/pottokao-dotcom/ComfyUI-QwenImage-PhotoStyles
  identity: github:pottokao-dotcom/comfyui-qwenimage-photostyles
resource_kind:
  ai: project
  user: null
navigation:
  categories:
    ai:
      - Image Creation / Design
    user: null
created_at: 2026-09-25
updated_at: 2026-09-25
last_checked_at: 2026-09-25
summary: "一個面向 Qwen-Image-2.1 的 ComfyUI 自訂節點，將短提示詞、攝影風格規格與 seed 對應的情緒子預設交給外部 PE-T2I 重寫器，產生較完整的英文提示詞、負向提示詞與建議尺寸。它不是模型載入器，而是把風格控制與提示詞擴寫整理成可重用工作流元件。"
classification:
  categories:
    ai:
      - Image Generation
      - LLM
    user: null
  tags:
    ai:
      - ComfyUI
      - Qwen-Image-2.1
      - PE-T2I
      - prompt-rewriter
      - photographic-style
      - OpenAI-compatible-API
    user: null
relevance:
  ai:
    overall: 5
    ai_rd: 4
    aoi_ai: 1
    llm_agent: 3
    sillytavern_ai_rpg: 2
    image_gen: 5
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

# ComfyUI-QwenImage-PhotoStyles：Qwen-Image-2.1 攝影風格提示詞重寫節點

## 一句話介紹

ComfyUI-QwenImage-PhotoStyles 是一個給 **Qwen-Image-2.1** 工作流使用的提示詞重寫節點：使用者輸入簡短提示詞並選擇攝影風格後，節點會把風格規格與情緒子預設送到 **Qwen-Image-2.1-PE-T2I** 類型的重寫模型，再輸出可直接接到生圖流程的長提示詞、負向提示詞、寬高與長寬比。

它的定位不是模型載入器，也不是單純把固定風格字串附加到提示詞後方；真正有價值的部分，是把「風格規格」交給提示詞重寫模型理解後重新組織成完整描述。

## 它解決什麼問題

Qwen-Image-2.1 可以接受自然語言提示詞，但要穩定得到具有明確鏡頭語言、光線、色彩、情緒與構圖傾向的攝影畫面，通常仍需要寫出相當完整的描述。手動維護長提示詞有幾個問題：

- 同一套視覺風格很難在不同主題上維持一致結構。
- 固定前綴或後綴容易和使用者已指定的內容互相衝突。
- 要同時管理正向提示詞、負向提示詞、顆粒感、長寬比與尺寸，工作流會快速變得零散。
- 想保留「同一風格、不同情緒」時，往往又需要再維護多組 prompt。

這個專案把這些工作拆成「使用者意圖」「風格表」「情緒子預設」「PE-T2I 重寫」幾層。風格表描述鏡頭、光線、人物、場景、色彩等方向，重寫器再依照原始提示詞補足未指定內容，因此比單純字串拼接更接近一個小型的提示詞編譯流程。

## 核心概念

### 1. 風格是規格，不是固定 prompt

每個 styles/*.txt 風格檔不是一條最終提示詞，而是描述該風格應如何處理：

- Look
- Lens language
- Light
- Emotion
- People
- Scene & props
- Colour

這些內容會附加到使用者訊息，交由 PE-T2I 重寫器整合。專案實作特別強調，風格應主要補足使用者沒有明確指定的部分，而不是粗暴覆蓋原始意圖。

### 2. seed 同時控制情緒子預設

presets.json 為不同風格準備多個 mood 子預設。節點以 seed 對子預設數量取餘數，選出其中一個情緒描述，再以 Mood for this image: 附加到重寫輸入。

這讓重新抽 seed 不只改變後續圖像生成的隨機性，也能讓提示詞本身產生有方向性的情緒變化。

### 3. 把模型擅長與不擅長的控制拆開

專案沒有把所有控制都交給 PE-T2I。像負向提示詞，以及部分底片風格需要強化的顆粒描述，會先從 style sheet 中分離，待模型重寫完成後再由節點固定套回結果。

這是一個值得參考的設計：語意整合交給模型，必須可靠保留的硬性控制則留在程式層。

## 架構與技術

主要實作集中在單一 Python 自訂節點 QwenImagePhotoStylePrompt，不需要額外 Python 套件；HTTP 呼叫直接使用標準函式庫 urllib.request。

資料流可整理為：

~~~text
使用者 prompt
+ 選擇的 style sheet
+ seed 對應 mood preset
        ↓
OpenAI-compatible /v1/chat/completions
        ↓
Qwen-Image-2.1-PE-T2I rewriter
        ↓
解析 rewritten_prompt + wh_ratio
        ↓
程式層補回 negative / grain directives
        ↓
依 wh_ratio 計算約 1MP、32 像素對齊的 width / height
        ↓
輸出 prompt / negative / width / height / wh_ratio
~~~

主要輸入包括：

- prompt
- style
- endpoint
- seed
- temperature
- 選填的 model
- timeout_s
- system_prompt_path

主要輸出包括：

- prompt
- negative
- width
- height
- wh_ratio

重寫結果必須能解析出提示詞，而且長度至少 200 個字元；若結果不可用，節點最多會重試 3 次，並在每次重試時遞增 seed。

## 主要功能

- **17 組攝影風格**：包含 Black Fury、Geometry of Light、Warm Documentary、Private Diary、Frozen Film Still、Vivid Garden 等不同攝影／視覺語言。
- **提示詞自動擴寫**：把簡短輸入重寫成更完整的英文生圖提示詞。
- **情緒子預設**：同一風格可因 seed 切換不同 mood，避免每次都維持完全相同的情緒傾向。
- **風格專屬負向提示詞**：在共用負向提示詞之外，可加入個別風格需要排除的內容。
- **底片顆粒強化**：對需要明顯 grain 的風格，在模型重寫後再次以程式層包覆，避免長段文字稀釋顆粒描述。
- **自動尺寸建議**：依模型回傳的 wh_ratio 計算接近 1024×1024 總像素量、並以 32 像素對齊的尺寸。
- **外部推論後端解耦**：只要求 OpenAI-compatible chat/completions 介面，可搭配 vLLM、llama-server、LM Studio 等後端。
- **可替換 system prompt**：可透過 system_prompt_path 指定自己的系統提示詞。

## 技術亮點

### 把 prompt engineering 做成可維護的資料層

最值得參考的不是 17 個風格名稱本身，而是風格資料與執行程式分離。新增或微調攝影風格時，主要修改 styles/*.txt 與 presets.json，不必把大量風格文字硬編碼進節點邏輯。

這種設計也更適合之後做版本控制、風格 A/B 測試，或建立自己的風格資料庫。

### 軟控制與硬控制分層

PE-T2I 適合把大量語意重新組織成自然且完整的提示詞，但「必須出現」的顆粒描述與負向條件若完全交給模型，可能在長段落中被弱化。專案因此把 Negative:、Grain lead:、Grain closer: 視為節點端 directive，模型只處理其餘風格語意。

這比把所有要求都塞進 system prompt 更容易除錯，也能明確知道哪一層負責哪一種控制。

### API 與模型解耦

節點只依賴 OpenAI-compatible HTTP 介面，不綁死特定推論框架。這讓 PE-T2I 可以獨立部署在不同硬體或環境，而 ComfyUI 只負責呼叫結果。

對想把「文字提示詞處理」與「圖像生成」拆到不同 GPU、不同程序甚至不同主機的工作流，這個架構具有實際參考價值。

## 限制與風險

### 不是獨立可用的完整生圖套件

它只負責提示詞重寫。實際使用前仍需要：

1. 已能執行 Qwen-Image-2.1 的 ComfyUI 環境。
2. 另外啟動 Qwen/Qwen-Image-2.1-PE-T2I 或相容重寫模型的服務。
3. 把節點輸出的 prompt、negative 與尺寸接回自己的 Qwen-Image-2.1 graph。

因此安裝節點本身不代表整套流程就能直接工作。

### 服務端點與隱私

節點會把使用者提示詞送到設定的 endpoint。現在的程式介面沒有 API key 欄位，HTTP request 也只設定 Content-Type，顯示它主要偏向本機或內網的 OpenAI-compatible 服務。

若改接外部端點，需要額外考慮認證、傳輸安全與提示詞內容是否能傳給第三方。

### 回傳格式仍依賴模型遵循

解析器會從回覆中擷取第一個左大括號到最後一個右大括號範圍，再嘗試解析 JSON；若沒有 rewritten_prompt，還會退回使用最長的字串欄位。這提高了容錯性，但不是嚴格的結構化輸出驗證。

當模型版本、system prompt 或服務端行為改變時，仍可能出現格式漂移。三次重試可以緩解，但不能完全消除這類風險。

### 尺寸是推導值，不是模型保證

wh_ratio 若缺失或格式不符，尺寸計算會回到 1:1。輸出的 width / height 是節點依約一百萬像素面積推導出的建議值，不代表 Qwen-Image-2.1 在所有尺寸都具有相同品質。

### 混合授權需要特別注意

專案的節點程式碼、風格表、presets.json 與文件採 MIT License；但預設的 style_sp_plus.txt 改寫自 Qwen 官方 Qwen-Image-2.1-PE-T2I system prompt，仍受 **Qwen Research License** 約束。

因此不能只看到專案主體是 MIT 就直接推論整套預設配置可自由商用；若涉及商業使用，應另外檢視 Qwen Research License 對該衍生 system prompt 的限制。

### 專案仍非常早期

GitHub 儲存庫建立於 2026-09-23，目前版本標示為 1.0.0。現有程式結構簡潔，但專案歷史仍短，應把目前風格品質、與未來 Qwen-Image-2.1／PE-T2I 版本的相容性視為需要實測與持續觀察的項目。

## 與你的相關性

依公開技術背景來看，這個專案對 **AI Image Generation** 的相關性非常高。它不是再提供一個生圖模型，而是示範如何把風格規格、提示詞重寫模型與 ComfyUI 工作流整理成可重用工具，適合拿來實際試用，也適合作為影像生成工具設計的參考。

對 AI R&D 也有明顯價值，尤其是以下幾點：

- 如何把生成工作流中的自然語言控制資料化。
- 如何區分模型應負責的語意處理與程式應保證的硬性約束。
- 如何以 OpenAI-compatible API 將文字模型推論與 ComfyUI 解耦。
- 如何用 seed 同時驅動生成隨機性與高階風格變體。

它與 AOI × AI 沒有直接關係；與 LLM／Agent 的交集則主要落在「使用語言模型作為提示詞重寫服務」，而不是 Agent orchestration。

## 建議怎麼使用

### TRY

如果已有可執行 Qwen-Image-2.1 的 ComfyUI 環境，可以直接挑幾個差異大的風格做小型比較，例如同一主題固定主要生成 seed，只改 style 與 mood seed，觀察：

- 人物與場景描述是否仍忠於原 prompt。
- 鏡頭、光線、色彩是否真的形成可辨識風格。
- Grain lead / closer 這種程式層強化是否比純文字重寫穩定。
- 不同 PE-T2I 後端或量化版本是否會造成風格漂移。

### REFERENCE

更值得保留的是它的「風格資料層」設計。未來若要製作自己的生圖提示詞收藏、風格管理器或批次提示詞工具，可以參考這種拆法：

~~~text
基礎意圖
+ 可版本控制的 style specification
+ 可抽換的 mood preset
+ LLM rewrite
+ deterministic post-processing
~~~

這比單純收藏大量完整 prompt 更容易重用、組合與維護。

## 與其他收藏的關聯

本次檢索未找到已存在且可明確建立直接連結的同源或 ComfyUI 專用 Knowledge Card，因此暫不建立實體關聯連結。

## 使用者備註


## 更新紀錄

### 2026-09-25

- 建立 Knowledge Card。
- 記錄 17 組攝影風格、PE-T2I 提示詞重寫流程、seed 情緒子預設、negative／grain 程式層控制與尺寸推導機制。
- 補充外部 endpoint、回傳格式依賴、混合授權與早期專案成熟度風險。
