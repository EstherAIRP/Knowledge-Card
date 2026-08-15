---
schema_version: 1
id: github-mayocream-koharu
title: Koharu
canonical_url: https://github.com/mayocream/koharu
source:
  type: github
  url: https://github.com/mayocream/koharu
  identity: github:mayocream/koharu
created_at: 2026-08-16
updated_at: 2026-08-16
last_checked_at: 2026-08-16
summary: Koharu 是以 Rust 開發的 local-first 漫畫翻譯工具，將文字區域與氣泡偵測、OCR、inpainting、LLM／機器翻譯與 CJK／RTL 文字排版串成完整工作流，並支援多種 GPU 後端與可編輯 PSD 匯出。
classification:
  categories:
    ai:
      - AI / ML
      - AOI × AI
      - LLM
      - Image Generation
    user: null
  tags:
    ai:
      - manga-translation
      - rust
      - local-first
      - computer-vision
      - object-detection
      - ocr
      - inpainting
      - llm
      - tauri
      - gpu-acceleration
      - cuda
      - rocm
      - metal
      - vulkan
      - text-rendering
      - psd-export
      - openai-compatible-api
      - local-llm
    user: null
relevance:
  ai:
    overall: 4
    ai_rd: 5
    aoi_ai: 4
    llm_agent: 3
    sillytavern_ai_rpg: 2
    image_gen: 4
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

# Koharu

## 一句話介紹

Koharu 是一套以 Rust 開發的 local-first 漫畫翻譯桌面工具，將版面／文字偵測、OCR、原文字去除、翻譯與重新排版整合成一條可在本機執行的 ML 工作流。

## 它解決什麼問題

漫畫翻譯不是單純把一句文字送進翻譯模型。實際流程通常還包含定位文字與對話框、辨識日文或其他來源文字、清除原字、理解上下文、產生譯文，再把文字以正確方向與版面重新放回圖片。這些步驟若分散在不同工具中，會產生大量人工切換、格式轉換與修圖成本。

Koharu 的切入點是把這些工作整合在同一套應用程式中，並優先讓 vision models 與 LLM 在本機執行，以降低漫畫頁面與文字內容送往外部服務的需求。同時它保留 remote LLM 與機器翻譯 provider，讓使用者可以在隱私、速度、硬體成本與翻譯品質之間選擇。

## 核心概念

- **Staged ML pipeline**：不是用單一端到端模型處理整頁，而是把 detection/layout、OCR、inpainting、translation 與 rendering 拆成專門階段，各自使用適合的模型或引擎。
- **Local-first inference**：官方明確主打 vision models 與 LLM 可在本機執行；雲端 API 是可選後端，而不是唯一執行路徑。
- **Backend abstraction**：同一翻譯工作流可以接本機 LLM、OpenAI-compatible API、特定雲端 LLM provider，或 DeepL、Google Cloud Translation、Caiyun 等傳統機器翻譯服務。
- **Translation as document editing**：輸出不只是一張燒死文字的圖片，Koharu 支援 layered PSD 與 editable text，讓 AI 處理結果可以繼續進入人工校稿與排版流程。

## 架構與技術

Koharu 是 Rust 2024 edition 的 multi-crate workspace，目前 workspace version 為 `0.69.0`。Repository 將功能拆成多個 crate，例如 `koharu-pipeline`、`koharu-translator`、`koharu-renderer`、`koharu-ml`、`koharu-llama`、`koharu-diffusion`、`koharu-torch`、`koharu-psd`、`koharu-runtime` 與 desktop/application 層，反映出模型 runtime、pipeline、翻譯、渲染與輸出格式彼此分離的模組化設計。

桌面層使用 Tauri 生態，ML 與影像處理則同時整合自有 Rust crate、Torch／Llama／diffusion native bindings 與影像處理依賴。官方列出的 vision stack 包含：

- Detection / layout：Koharu Layout RF-DETR Seg 2XL。
- OCR：PaddleOCR VL 1.6、Manga OCR、Baberu OCR。
- Inpainting：FLUX.2 Klein、RORem mixed、LaMa、AOT GAN。
- LLM：支援多種本機 GGUF 模型，以及 OpenAI、Gemini、Claude、DeepSeek、OpenRouter、Atlas Cloud 等 hosted APIs；亦支援任意 OpenAI-compatible provider。

硬體執行層支援 NVIDIA CUDA、AMD ROCm/HIP、Apple Metal、Vulkan，並提供 CPU fallback。這使同一套 pipeline 能跨 Windows、macOS 與 Linux 部署，而不完全綁定單一 GPU 生態。

## 主要功能

- 自動偵測文字區域、對話框與 cleanup masks。
- OCR 漫畫對話、旁白與頁面其他文字。
- 使用 inpainting 移除來源文字，為譯文重新排版保留背景。
- 透過本機或遠端 LLM 進行翻譯，也可使用專門的 machine translation provider。
- 支援直排 CJK 與 RTL 等較複雜文字方向與排版需求。
- 匯出具有 editable text 的 layered PSD，方便後續人工修正。
- 提供 Windows、macOS、Linux 預編譯版本；Windows 亦可透過 WinGet、macOS 可透過 Homebrew 安裝。

## 技術亮點

第一個值得保留的點，是它把漫畫翻譯視為「多階段視覺文件處理系統」，而不是單一 LLM 任務。Detection、OCR、inpainting、translation、rendering 的拆分方式，與許多 AOI／Document AI pipeline 的工程思路相似：每一階段都有清楚輸入輸出，也可以獨立替換模型與評估錯誤來源。

第二個亮點是 local-first 與多 backend 的組合。Koharu 不只是把雲端 API 包進 GUI，而是同時處理本機 vision、local LLM、GPU runtime 與 remote provider。這使它成為研究「桌面 AI 應用如何管理異質模型 runtime」的實際案例。

第三個亮點是輸出仍保有可編輯性。Layered PSD 與 editable text 代表系統沒有把 AI 結果視為不可逆的最終答案，而是把模型輸出放入可由人類繼續修訂的 production workflow；這對需要人工 QA 的影像處理工具特別有參考價值。

截至 2026-08-16，Repository 約有 5.2k stars、341 forks，最新正式 release 為 `0.69.0`，發布於 2026-08-15，顯示專案目前仍處於活躍開發與發布狀態。

## 限制與風險

- **硬體與模型成本**：完整 local pipeline 涵蓋 detection、OCR、inpainting 與 LLM，多模型同時存在會帶來模型下載容量、VRAM／RAM 與啟動時間成本；CPU fallback 雖可用，但不代表所有工作負載都有相同實用速度。
- **誤差會沿 pipeline 傳遞**：文字框偵測錯誤會影響 OCR，OCR 錯誤又會污染翻譯；inpainting 或文字排版失敗也可能需要人工修正。多階段設計提高可控性，但同時需要階段化 QA。
- **跨 GPU backend 的環境差異**：CUDA、ROCm/HIP、Metal、Vulkan 的驅動、模型支援與效能條件不同，實際跨平台體驗仍需要個別驗證。
- **Remote provider 會改變隱私邊界**：local-first 的隱私優勢只成立於本機模型路徑；若切換到 hosted LLM 或 machine translation API，資料處理政策應以該 provider 為準。
- **仍在快速演進**：目前版本為 `0.69.0`，且模型清單、Tauri revision 與多個 native runtime 都持續更新。作為 end-user 工具已具完整功能，但若要嵌入長期 production workflow，仍應鎖定版本並驗證升級影響。

## 與你的相關性

依公開技術 Profile，Koharu 對 **AI R&D** 與 **AOI × AI** 的價值高於單純的漫畫用途本身。它提供了一個實際可運作的 multi-stage Computer Vision 應用案例：從 object detection、OCR、image restoration 到 downstream LLM，再接文字 rendering 與可編輯輸出，適合拿來觀察複合式 AI pipeline 如何拆模組、管理 runtime 與設計人工修訂介面。

對 **LLM / Agent** 而言，它的價值主要在 LLM backend abstraction 與 local/remote model orchestration，而不是 Agent autonomous loop，因此相關性屬中等。對 **Image Generation** 則因 inpainting、image restoration 與渲染流程具有直接技術關聯，值得作為實作參考。

## 建議怎麼使用

- `TRY`：若想快速理解整條漫畫翻譯 pipeline 的實際使用體驗，可直接使用官方預編譯版本，觀察 detection、OCR、inpainting、translation 與 rendering 在單一 GUI 中如何協作。
- `LEARN`：優先閱讀 `koharu-pipeline`、`koharu-ml`、`koharu-translator`、`koharu-renderer` 與各 native runtime crate 的邊界設計，研究多模型桌面應用如何拆分責任。
- `REFERENCE`：可把它當作 AOI／Document AI 類 multi-stage pipeline 的參考案例，特別是「模型結果仍可人工修訂」、「多 GPU backend fallback」與「local-first + cloud optional」三種產品設計。

若未來要借鑑其架構，不建議直接照搬整套模型清單；更值得抽取的是 pipeline contract、backend abstraction、可編輯輸出與人機協作的設計方式。

## 與其他收藏的關聯

目前沒有從 Repository 搜尋結果中確認到足夠直接、且可安全建立實際連結的既有 Knowledge Card，因此本次先不建立關聯連結。後續若收錄 OCR、Document AI、inpainting 或 local multimodal desktop runtime 類專案，可再建立概念關聯。

## 使用者備註


## 更新紀錄

### 2026-08-16

- 建立 Knowledge Card，整理 Koharu 的 staged manga translation pipeline、local-first 模型執行、多 GPU backend、LLM provider abstraction、文字渲染與 PSD 可編輯輸出設計。
