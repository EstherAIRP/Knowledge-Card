---
schema_version: 1
id: github-openbmb-voxcpm
title: VoxCPM
canonical_url: https://github.com/OpenBMB/VoxCPM
source:
  type: github
  url: https://github.com/OpenBMB/VoxCPM
  identity: github:openbmb/voxcpm
resource_kind:
  ai: project
  user: null
created_at: 2026-08-21
updated_at: 2026-08-21
last_checked_at: 2026-08-21
summary: VoxCPM 是 OpenBMB 開源的無離散語音 tokenizer 文字轉語音系統；目前主版本 VoxCPM2 為 2B 參數模型，支援 30 種語言、語音設計、可控聲音複製、48kHz 輸出、串流生成與 LoRA／全量微調，並可透過 vLLM-Omni、Nano-vLLM 與 llama.cpp-omni 等後端部署。
classification:
  categories:
    ai:
      - AI / ML
    user: null
  tags:
    ai:
      - voxcpm2
      - text-to-speech
      - tokenizer-free-tts
      - voice-cloning
      - voice-design
      - multilingual-speech
      - diffusion-autoregressive
      - audiovae
      - streaming-tts
      - lora-finetuning
    user: null
relevance:
  ai:
    overall: 4
    ai_rd: 4
    aoi_ai: 1
    llm_agent: 2
    sillytavern_ai_rpg: 4
    image_gen: 1
  user: {}
actions:
  ai:
    - TRY
    - LEARN
    - INTEGRATE
  user: null
status:
  ai: active
  user: null
---

# VoxCPM

## 一句話介紹

VoxCPM 是 OpenBMB 開源的文字轉語音（Text-to-Speech, TTS）模型與工具鏈；目前主版本 VoxCPM2 以無離散語音 tokenizer 的擴散自回歸架構直接生成連續語音表徵，主打多語言語音生成、語音設計、可控聲音複製與高品質串流輸出。

## 它解決什麼問題

許多現代 TTS 系統會先把語音轉成離散 token，再由語言模型或聲學模型生成 token 並解碼回音訊。VoxCPM 改走連續潛在表徵路線，希望減少離散量化造成的資訊損失，並提升自然度、情緒表現與聲音細節保存能力。

VoxCPM2 進一步把這套方法擴展到 30 種語言，並整合三類常見需求：直接文字轉語音、以自然語言描述創造新聲線，以及從短參考音訊複製說話者音色並控制情緒、速度與表達方式。

## 核心概念

- **無離散語音 tokenizer**：模型不先把語音壓成離散語音 token，而是在 AudioVAE V2 的連續潛在空間中建模與生成。
- **擴散自回歸（diffusion autoregressive）**：以自回歸語言建模結合擴散式聲學生成，兼顧上下文建模與連續語音細節。
- **多模式聲音控制**：同一套模型支援純文字 TTS、自然語言語音設計、參考音訊聲音複製與帶逐字稿的延續式高保真複製。
- **可部署與可微調**：官方套件提供 Python API、CLI、Web Demo、串流生成、SFT 與 LoRA；生產環境可接 vLLM-Omni 或 Nano-vLLM，邊緣端則有 llama.cpp-omni 等生態系方案。

## 架構與技術

VoxCPM2 為約 2B 參數模型，README 表示訓練資料超過 200 萬小時多語言語音，語言模型骨幹建立在 MiniCPM-4 上。其主要語音流程在 AudioVAE V2 潛在空間中運作，官方文件將模型拆成 `LocEnc → TSLM → RALM → LocDiT` 四個階段。

AudioVAE V2 使用非對稱編碼／解碼設計：參考音訊可使用 16kHz 輸入，而輸出端直接產生 48kHz 音訊並包含超解析能力。相較把語音離散化後再生成 token 的方法，VoxCPM2 的關鍵設計是在連續潛在空間中保留聲學細節，再利用擴散模組完成高品質音訊重建。

工程層面以 Python／PyTorch 為主，套件要求 Python 3.10 以上與 PyTorch 2.5 以上；官方 README 對 CUDA 環境建議 CUDA 12.0 以上。Repository 同時提供 `voxcpm` CLI、Gradio Web Demo、訓練腳本、測試與模型設定。

## 主要功能

- **多語言 TTS**：VoxCPM2 官方支援 30 種語言，輸入文字不需另外加語言標籤。
- **語音設計（Voice Design）**：只用自然語言描述年齡、性別、語氣、情緒或速度，即可合成新的聲線，不需要參考音訊。
- **可控聲音複製**：使用短參考音訊複製音色，同時用文字指令調整速度、情緒與表達風格。
- **高保真延續式複製**：提供參考音訊與逐字稿時，模型可用延續式生成保留音色、節奏、情緒與風格細節。
- **48kHz 音訊與串流生成**：支援高取樣率輸出與 `generate_streaming()` 串流 API。
- **微調**：支援全量 SFT 與 LoRA，官方表示少量音訊即可進行特定說話者、語言或領域調整。
- **多種部署後端**：標準 PyTorch 推論外，生態系已有 Nano-vLLM、vLLM-Omni、llama.cpp-omni、GGUF、ONNX 與多種社群實作。

## 技術亮點

第一個值得研究的部分是「連續潛在語音生成」本身。VoxCPM 不把語音生成問題完全轉成離散 token 預測，而是將語言上下文建模與連續聲學生成分開處理，對高保真聲音複製與情緒細節保留特別有參考價值。

第二個亮點是 VoxCPM2 把語音設計與聲音複製統一在同一個生成介面中。這讓它不只是傳統 TTS，而更像可由文字與音訊條件共同控制的生成式語音模型。

第三個亮點是部署生態完整。README 同時提供標準 PyTorch、vLLM-Omni 的 OpenAI 相容 `/v1/audio/speech` 介面、Nano-vLLM 高吞吐部署與 llama.cpp-omni 邊緣推論路徑，對原型、服務化與本機應用都有實際價值。

## 限制與風險

- **聲音複製可被濫用**：官方明確警告，不得用於冒充、詐欺或假訊息；實務導入需要加入授權、內容標示、濫用偵測與稽核機制。
- **可控生成仍有波動**：官方指出語音設計與可控聲音複製在不同生成次數間可能有差異，控制穩定性仍在改善。
- **多語言品質不完全一致**：公開基準顯示不同語言的 WER／CER 表現差距明顯，因此「支援 30 種語言」不代表每種語言都達到相同品質。
- **硬體需求仍高**：VoxCPM2 README 列出的標準版本約需 8 GB VRAM；雖然有 CPU／Metal／GGUF 路線，但即時性與品質會受硬體與量化設定影響。
- **成熟度需保守看待**：Repository 活躍且社群規模大，但 `pyproject.toml` 的 Python 套件分類仍標示為 Alpha，正式產品導入前仍應做壓力測試、品質驗證與版本鎖定。
- **授權**：程式碼與模型權重以 Apache-2.0 釋出，商業使用條件相對寬鬆，但使用者仍需自行承擔合規與生成內容風險。

## 與你的相關性

依公開技術背景來看，VoxCPM 對 **AI R&D** 的價值高：它提供一套與離散語音 token 路線不同的 TTS 架構，可用來研究連續潛在生成、擴散自回歸、聲音條件控制、微調與高吞吐推論。

對 **LLM／Agent** 的直接相關性中等偏低，因為 VoxCPM 本身不是 Agent 框架；但它可作為語音輸出層，特別是透過 OpenAI 相容 TTS 介面接入語音 Agent 或多模態系統。

對 **SillyTavern／AI RPG** 的相關性較高。語音設計、角色聲線複製、情緒控制與本機／服務端部署都適合拿來打造角色語音、NPC 對話或敘事語音層。對 AOI × AI 與影像生成則沒有明顯直接關聯。

## 建議怎麼使用

- `TRY`：先用官方 `pip install voxcpm` 與 VoxCPM2 權重測試中文、英文及常用角色語音情境，實際確認延遲、穩定度與聲音一致性。
- `LEARN`：值得研究其 tokenizer-free、AudioVAE V2 與 `LocEnc → TSLM → RALM → LocDiT` 架構，以及 LoRA／SFT 如何調整說話者與領域特性。
- `INTEGRATE`：若需要替角色系統、語音 Agent 或 AI RPG 加入 TTS，可先以 Python API 驗證；需要服務化時再評估 vLLM-Omni 的 OpenAI 相容介面或 Nano-vLLM。

## 與其他收藏的關聯

目前 Knowledge Card 中未找到直接對應 TTS、VoxCPM 或聲音複製的既有卡片，因此暫不建立內部連結。未來若收錄語音 Agent、TTS 引擎或角色語音相關專案，可再補上關聯。

## 使用者備註


## 更新紀錄

### 2026-08-21

- 重新檢查目前 Repository，依主要交付物正式將 `resource_kind` 分類為 `project`。

### 2026-08-21

- 建立 VoxCPM Knowledge Card，來源以 VoxCPM2 的最新 Repository 中繼資料、README 與 `pyproject.toml` 為主要證據。
