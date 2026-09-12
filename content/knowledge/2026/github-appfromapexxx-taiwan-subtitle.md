---
schema_version: 1
id: github-appfromapexxx-taiwan-subtitle
title: taiwan-subtitle
canonical_url: https://github.com/appfromapexxx/taiwan-subtitle
source:
  type: github
  url: https://github.com/appfromapexxx/taiwan-subtitle
  identity: github:appfromapexxx/taiwan-subtitle
resource_kind:
  ai: project
  user: null
created_at: 2026-09-12
updated_at: 2026-09-12
last_checked_at: 2026-09-12
summary: 在 Apple Silicon Mac 本機執行的繁體中文字幕產生工具，以 TEA-ASR 為主要語音辨識模型、Qwen3-ASR 作備援，再用 Qwen3 Forced Aligner 對齊時間戳，最後透過 OpenCC 轉為台灣繁體中文並輸出 SRT、TXT、JSON。
classification:
  categories:
    ai:
      - AI / ML
      - General Tools
    user: null
  tags:
    ai:
      - ASR
      - speech-to-text
      - subtitle
      - SRT
      - TEA-ASR
      - Qwen3
      - Forced Aligner
      - MLX
      - Apple Silicon
      - OpenCC
      - ffmpeg
      - Traditional Chinese
    user: null
relevance:
  ai:
    overall: 3
    ai_rd: 4
    aoi_ai: 1
    llm_agent: 2
    sillytavern_ai_rpg: 2
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

# taiwan-subtitle

## 一句話介紹

`taiwan-subtitle` 是一個針對 Apple Silicon Mac 的本機語音轉字幕工具，將影片或音訊經由 ASR、強制時間對齊與繁簡轉換流程，輸出可直接使用的繁體中文 SRT 字幕、TXT 逐字稿與 JSON 時間戳資料。

## 它解決什麼問題

一般語音辨識模型雖然能產生逐字稿，但要得到「可用的字幕」還需要處理影音解碼、長音訊切段、時間戳對齊、繁體中文轉換、標點與字幕分段等工程細節。此專案把這些步驟整合成單一 Python CLI，並特別鎖定台灣繁體中文字幕與 Apple Silicon 的本機推論情境。

它的重點不是提供新的 ASR 模型，而是把既有模型組成一條可落地的字幕處理管線，降低使用者自行串接模型與後處理工具的成本。

## 核心概念

核心流程可以整理為：

```text
本機影音
→ ffmpeg 抽取並正規化 16 kHz 單聲道音訊
→ 依音訊能量切成重疊區段
→ TEA-ASR 辨識
→ 失敗時依序改用 Qwen3-ASR 1.7B / 0.6B
→ Qwen3 Forced Aligner 對齊字詞時間戳
→ OpenCC s2twp 轉為台灣繁體中文
→ 字幕分段與時間戳驗證
→ SRT / TXT / JSON
```

專案把「辨識文字」與「精細時間對齊」拆成兩階段。ASR 先取得內容，再由 Forced Aligner 把文字映射回音訊時間軸；若對齊器無法載入或單一區段對齊失敗，會退回較粗的 segment timestamp，而不是讓整個轉錄工作直接失敗。

## 架構與技術

- **執行平台**：明確限制在 Apple Silicon arm64，主要利用 Apple MLX 生態系執行本機模型。
- **主要語言**：Python。
- **影音前處理**：以 `ffmpeg` 將輸入影音轉為 16 kHz、單聲道 WAV，再進行後續處理。
- **長音訊切段**：預設每段約 240 秒、重疊 1.5 秒，並使用音訊能量尋找較適合的切點，避免單純固定時間硬切。
- **主要 ASR**：`Alkd/TEA-ASR-1.1-MLX-4bit`。
- **ASR 備援**：`mlx-community/Qwen3-ASR-1.7B-8bit` 與 `mlx-community/Qwen3-ASR-0.6B-8bit`。
- **時間對齊**：`mlx-community/Qwen3-ForcedAligner-0.6B-8bit`。
- **繁體中文轉換**：`opencc-python-reimplemented`，使用 `s2twp` 設定轉成台灣繁體中文。
- **模型快取**：預設將 Hugging Face 模型快取放在專案內 `models/huggingface`，但仍尊重既有的 `HF_HOME` / `HF_HUB_CACHE`。
- **輸出格式**：SRT、TXT、JSON；JSON 另外保留模型資訊、segments、words、characters、處理時間、RTF 與 warnings。

## 主要功能

- 支援 `mp4`、`mov`、`mkv`、`mp3`、`wav`、`m4a` 等 `ffmpeg` 可解碼的本機影音。
- 自動下載主要 ASR、備援 ASR 與 Forced Aligner 模型，不要求使用者手動建立模型目錄。
- 支援 hotword，可透過 `--hotword` 追加產品名、專有名詞等詞彙提示。
- `--no-punctuation` 只移除 SRT 顯示文字中的標點，不改變 TXT、JSON 或時間戳。
- 可指定 `--asr-model`、`--aligner-model`、`--chunk-seconds`、`--overlap-seconds` 等參數。
- 會驗證字幕 cue 不超出音訊長度、結束時間大於開始時間，且相鄰字幕不重疊。
- 模型或對齊階段失敗時會記錄 warnings，並在可行時採用備援模型或粗粒度時間戳繼續完成輸出。

## 技術亮點

第一個值得參考的地方是**分層容錯**。它不是只做「模型載入失敗就換模型」，而是在 ASR 與時間對齊兩層都設計降級策略：ASR 有候選模型序列，Forced Aligner 則能針對整體載入失敗或單一 chunk 失敗回退到 segment timestamp。這比單一路徑批次轉錄更適合處理長影音。

第二個亮點是**針對字幕而不是逐字稿設計後處理**。程式會補回 Forced Aligner 可能省略的標點、處理零長度 token、去除重疊切段造成的重複內容，再將 token 組成可讀且不重疊的字幕 cue。測試也覆蓋時間格式、OpenCC 轉換、標點補回、cue 分組與重疊驗證。

第三個亮點是**Apple Silicon 本機化**。相依套件固定在 MLX 路線，不依賴 PyTorch、CUDA 或 NVIDIA runtime，適合希望在 Mac 本機處理影音、避免把原始影音送到雲端 API 的情境。

## 限制與風險

- **平台限制明確**：程式會拒絕非 arm64 / Apple Silicon 環境，因此不是跨平台字幕工具。
- **模型首次下載成本**：README 估計主要 ASR 與 aligner 約各 1.2–1.3 GB，備援模型可能再增加空間與下載量。
- **精度仍需人工校對**：來源明確提醒辨識與時間對齊結果需要人工檢查；對齊失敗時使用較粗時間戳，字幕品質可能下降。
- **環境可重現性有限**：直接相依套件有固定版本，但間接相依與 Hugging Face 遠端模型 snapshot 並未全部鎖定，因此未來重新安裝不保證完全一致。
- **專案成熟度仍早期**：目前 Repository 建立於 2026-09-05，公開 commit 歷史只有一次 `first commit`，雖然已有單元測試，但還缺少較長期的版本演進與實際案例驗證。
- **授權需特別確認**：GitHub Repository 目前沒有宣告專案層級 license；README 只說模型與第三方套件依各自授權條款使用。若要修改、再散布或整合進其他產品，應先確認作者授權。
- **不直接處理線上影片 URL**：工具只接受本機影音檔，YouTube 等來源必須先由其他流程下載。

## 與你的相關性

依公開技術背景來看，此專案對 **AI R&D** 的價值高於其他面向。它示範了如何把 ASR、Forced Aligner、模型備援、長音訊切段與文字後處理整合成一條具容錯能力的本機推論管線，可作為多階段 AI 處理流程的實作參考。

它與 **AOI × AI**、**LLM / Agent**、**SillyTavern / AI RPG**、**Image Generation** 沒有直接核心關係；但若未來需要把語音或影片內容轉成可檢索文本，這類本機轉錄元件仍可作為資料前處理層。

## 建議怎麼使用

建議先以 `LEARN` 與 `REFERENCE` 為主。

- `LEARN`：研究它如何處理長音訊切段、ASR 模型備援、Forced Aligner 降級與字幕 cue 驗證，這些模式可以延伸到其他本機 AI 管線。
- `REFERENCE`：若之後要做影音轉錄、會議逐字稿、影片字幕或語音資料前處理，可把此專案當作 Apple Silicon / MLX 路線的實作基準。

若實際環境就是 Apple Silicon Mac，再進一步實測 TEA-ASR 與 Qwen3 備援路徑會更有價值；在未確認授權前，不建議直接把程式碼整合進需要再散布的產品。

## 與其他收藏的關聯

目前未找到已收錄且可直接建立實際連結的 ASR / MLX 字幕工具卡片。後續可由 Knowledge Graph 的語意關係自動建立與其他本機 AI、模型推論或資料前處理工具的關聯。

## 使用者備註

## 更新紀錄

### 2026-09-12

- 建立 Knowledge Card。
- 收錄 TEA-ASR → Qwen3-ASR 備援、Qwen3 Forced Aligner、OpenCC 與 SRT/TXT/JSON 輸出流程。
- 記錄 Apple Silicon 平台限制、早期成熟度與尚未宣告專案層級授權等風險。
