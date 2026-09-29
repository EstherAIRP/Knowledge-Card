---
schema_version: 1
id: github-debpalash-voicestudio
title: VoiceStudio：本地優先的語音複製、配音與 Agent 語音平台
canonical_url: https://github.com/debpalash/VoiceStudio
source:
  type: github
  url: https://github.com/debpalash/VoiceStudio
  identity: github:debpalash/voicestudio
resource_kind:
  ai: project
  user: null
navigation:
  categories:
    ai:
      - Audio / Music / Speech
      - Agent / Harness
    user: null
created_at: 2026-09-29
updated_at: 2026-09-29
last_checked_at: 2026-09-29
summary: VoiceStudio 是本地優先的開源語音工作站與語音服務平台，整合聲音複製與設計、TTS、ASR、即時聽寫、影片配音、長篇有聲書與模型管理，並透過 OpenAI-compatible HTTP、WebSocket、JSON-RPC 與 MCP 讓 Claude Code、Codex 等 Agent 直接調用。核心價值是把多種語音引擎、桌面輸入控制與 Agent 介面統一在同一套本地執行架構中。
classification:
  categories:
    ai:
      - AI / ML
      - Agent
      - General Tools
    user: null
  tags:
    ai:
      - voice-cloning
      - text-to-speech
      - speech-to-text
      - video-dubbing
      - dictation
      - MCP
      - local-first
      - OmniVoice
      - WhisperX
      - Electron
      - FastAPI
      - voice-design
    user: null
relevance:
  ai:
    overall: 4
    ai_rd: 4
    aoi_ai: 1
    llm_agent: 4
    sillytavern_ai_rpg: 3
    image_gen: 1
  user: {}
actions:
  ai:
    - TRY
    - INTEGRATE
    - LEARN
  user: null
status:
  ai: active
  user: null
---

# VoiceStudio：本地優先的語音複製、配音與 Agent 語音平台

## 一句話介紹

VoiceStudio 是一套本地優先的開源語音工作站，同時也是可被其他程式與 Agent 調用的本地語音平台：它把聲音複製、聲音設計、文字轉語音（TTS）、語音轉文字（ASR）、即時聽寫、影片配音、長篇有聲書與多引擎模型管理整合在同一個 Electron 桌面應用與 FastAPI 後端中。

專案目前以 VoiceStudio 作為預設 TTS 引擎入口，底層預設使用 k2-fsa/OmniVoice，也能切換多種 TTS／ASR 引擎。README 宣稱可涵蓋 646 種語言，但實際可用語言、聲音品質與硬體需求仍取決於所選引擎與模型。

## 它解決什麼問題

本地語音 AI 常被拆成多個彼此獨立的工具：聲音複製用一套、語音辨識用另一套、影片配音再接第三套，若要提供給 Agent 使用，還需要自己包 API、處理音訊檔案、模型常駐、GPU 資源與桌面輸入控制。

VoiceStudio 的切入點不是只做一個 TTS GUI，而是把這些能力收斂成同一個「語音工作站＋語音服務層」：

- 一個桌面介面負責聲音、配音、長篇內容與模型管理。
- 一個 Python 後端統一管理語音模型與工作佇列。
- 一組 HTTP、WebSocket、JSON-RPC、CLI 與 MCP 介面提供自動化與 Agent 整合。
- 桌面原生控制層處理麥克風、目前焦點輸入目標與安全文字插入。
- 預設以本機執行為主，遠端 GPU 與外部服務則是選配。

這讓它更接近「本地語音平台」而不是單一模型的展示介面。

## 核心概念

### 1. 工作站與服務平台共用同一套 Runtime

桌面使用者可以直接透過 GUI 操作，但同一個執行中的後端也能被編輯器、CLI、Agent 或其他程式調用。VoiceStudio 因此不需要為每種使用情境重新啟動一套模型服務。

### 2. 將控制平面與音訊資料平面分開

VoiceStudio 的語音平台文件把本機語音流程拆成兩層：

- Python/FastAPI 後端負責 ASR/TTS 模型、音訊資料與串流處理。
- 桌面原生控制層負責麥克風啟停、目前焦點視窗、剪貼簿安全與最終文字插入。

這個拆分讓「用 VoiceStudio 自己的麥克風聽寫」與「外部程式自己錄音、只把音訊送進 VoiceStudio」都能成立。

### 3. 多引擎路由，而不是綁定單一語音模型

專案內建模型目錄與引擎選擇層。TTS 除預設 OmniVoice 外，還列出 CosyVoice 3、KittenTTS、MLX-Audio、VoxCPM2、IndexTTS 2.5、MOSS-TTS、sherpa-onnx 等；ASR 則包含 WhisperX、Faster-Whisper、MLX Whisper、Parakeet、Moonshine、FunASR 與 OpenAI-compatible 後端。

因此 VoiceStudio 的產品價值主要在「統一工作流、模型管理與介面」，而不是押注單一模型。

### 4. Agent 是第一級整合對象

VoiceStudio 直接內建 MCP Server，並提供 Claude Code、Cursor、Codex CLI 等設定範例。Agent 可呼叫：

- generate_speech
- clone_voice
- transcribe
- list_voices
- list_personalities
- list_languages
- check_health

它也支援為不同 client_id 綁定不同聲音，使不同 Agent 可以有各自固定的聲音身分。

## 架構與技術

### 桌面層

目前唯一維護中的桌面應用是 Electron 版本，主要技術包含：

- Electron 44
- React 19
- TypeScript
- Tailwind CSS v4
- TanStack Query / Router / Form / Store
- Bun
- electron-vite / electron-builder

Electron 主程序會探測本機 FastAPI 後端；若後端不存在則啟動並監督 Python Runtime，後端異常退出時也能進行重啟與錯誤回報。

### 後端與模型層

後端以 Python 3.11+、FastAPI、PyTorch 為核心，管理 TTS、ASR、配音、模型下載、工作佇列與外部整合。主要依賴包含 WhisperX、faster-whisper、sherpa-onnx、pyannote-audio、Demucs、AudioSeal、Argos Translate、OpenAI-compatible LLM client 等。

長篇配音與翻譯流程還能使用 OpenAI-compatible LLM 服務，包括本地 Ollama、LM Studio、vLLM 等，不強制依賴特定雲端模型供應商。

### 語音平台介面

VoiceStudio 同時提供多種傳輸介面：

| 介面 | 主要用途 |
| --- | --- |
| OpenAI-compatible HTTP | 檔案轉錄、既有 SDK 整合 |
| WebSocket | 即時音訊串流與 partial/final 文字 |
| MCP Streamable HTTP | 現代 Agent Client |
| MCP stdio shim | Claude Code、Codex 等 stdio Client |
| JSON-RPC | 桌面原生聽寫控制 |
| Native CLI | 快捷鍵、Hook 與外部工具控制 |

本機原生控制服務僅綁定 loopback；需要跨機器使用時則必須另外啟用分享、API Key／PIN 或反向代理等機制。

## 主要功能

- **聲音複製**：以參考音訊建立可重用聲音 Profile。
- **聲音設計**：以描述方式建立聲音，而不只依賴錄音樣本。
- **TTS 與多引擎切換**：依硬體、語言與品質需求切換不同引擎。
- **語音轉文字**：支援檔案轉錄與即時串流辨識。
- **桌面聽寫**：透過浮動工具與全域控制把辨識結果插入目前焦點應用。
- **影片配音**：包含語音辨識、說話者處理、翻譯、時間對齊與語音生成。
- **Stories / Audiobook**：支援多角色長篇內容、章節化輸出、快取與續跑。
- **模型目錄**：集中管理 TTS、ASR 與 LLM 引擎的安裝、裝置路由與狀態。
- **MCP / API 整合**：讓 Agent 或外部程式直接調用聲音生成、複製與轉錄能力。
- **遠端運算**：可選擇把工作派往其他 GPU 主機，而本機保留桌面與輸入控制。

## 技術亮點

### 1. 把「桌面聽寫」與「模型服務」做成同一個平台

不少語音工具只提供 GUI 或 API 其中一種；VoiceStudio 的架構讓桌面原生輸入、檔案處理、串流 ASR 與 Agent 工具共享同一個模型 Runtime，避免各整合端重複處理模型啟動與 GPU 常駐。

### 2. MCP 特別處理音訊對 LLM Context 的成本

MCP 預設可以直接回傳 WAV base64，但專案也提供 files / both 模式，把生成音訊寫到受控目錄或透過 URL 提供，避免大型 base64 音訊直接塞進 Agent Context。OMNIVOICE_MCP_BASE_PATH 同時作為檔案讀寫安全邊界，路徑與 symlink 都會在存取前驗證。

這是 VoiceStudio 在 Agent 整合上比「把 TTS API 包成 MCP Tool」更值得參考的地方：它考慮了 LLM Context、檔案命名空間與安全邊界。

### 3. 多協定但共用同一份能力發現

VoiceStudio 透過 /.well-known/voicestudio-speech 暴露版本化能力資訊，讓桌面控制、後端資料平面與遠端 Client 可以先確認支援的介面，再選擇 HTTP、WebSocket、MCP 或原生控制。

### 4. 本地優先，但保留遠端算力擴充

專案預設讓模型與音訊工作在本機執行；需要更大的 GPU 時，可以把運算移到遠端 Worker，而麥克風與桌面輸入仍留在 Client 端。這避免了「遠端 GPU 必須同時取得桌面麥克風／焦點控制權」的耦合。

### 5. 工程成熟度高於一般模型 Demo

目前主線版本為 0.5.6，2026-09-23 仍有正式版本更新。Repository 具備 Electron 型別檢查、測試、打包契約、Smoke Test 與跨平台發行流程；Changelog 也持續記錄記憶體、模型下載、GPU、ASR、配音與 MCP 的實際問題修正。

## 限制與風險

### 模型與硬體成本

VoiceStudio 本身可以安裝多種引擎，但高品質聲音複製與長篇配音仍可能需要大量 VRAM／RAM。預設 OmniVoice 第一次使用還需要下載約 2.3 GB 模型；不同引擎的記憶體與速度差異很大，因此「安裝成功」不代表每個模型都適合目前硬體。

### 646 種語言不是單一模型的等品質保證

README 以 646 languages 描述整體平台覆蓋，但 VoiceStudio 實際上是一個多引擎系統。不同 TTS／ASR 引擎支援的語言、口音、聲音複製能力與品質並不一致，不能把平台總覆蓋數直接視為每個功能對 646 種語言都有相同品質。

### 授權需要分層確認

VoiceStudio 應用程式本身使用 AGPL-3.0-only，允許商業與內部使用；若修改後透過網路提供給他人使用，則會產生 AGPL 的對應原始碼提供義務。

更重要的是，模型權重有自己的授權。專案的 License Notice 特別指出，預設 k2-fsa/OmniVoice 的預訓練權重使用 CC-BY-NC，其他下載模型也各有不同條款。因此即使 VoiceStudio 應用程式本身允許商業使用，也不能直接推論所有模型都可商用。

### 聲音複製涉及同意與身分冒用風險

專案明確要求只在取得同意的情況下複製聲音，也提供 consent-verified Profile 方向。實際導入時仍需要自行管理聲音來源、授權、保存期限與使用範圍，尤其是對外發布、客服或角色語音。

### 遠端分享需要額外安全邊界

本機 loopback 模式的風險較低；一旦開放 LAN、Docker、反向代理或遠端 Worker，則必須處理 API Key、PIN、TLS、反向代理驗證與網路隔離。專案文件明確指出，分享 PIN 不等同完整網路隔離，HTTP 也不應用於不可信網路。

### 仍處於快速演進的 0.x 階段

專案在 2026 年持續快速改動，且從 Tauri 遷移到 Electron、MCP 路徑與遠端整合也都有過相容性修正。若把它當成長期 API 基礎設施，應固定版本並在升級前驗證 API、模型與設定檔相容性。

## 與你的相關性

依公開技術 Profile，VoiceStudio 對 **AI R&D** 與 **LLM / Agent** 的價值較高。

對 AI R&D 而言，它提供一個實際的大型多模型語音產品案例：模型路由、GPU／CPU 裝置管理、模型生命週期、長工作佇列、錯誤隔離與跨平台桌面 Runtime 都具有參考價值。

對 LLM / Agent 而言，它的 MCP、HTTP、WebSocket 與 per-agent voice binding 更值得研究。VoiceStudio 不只是讓 Agent 「播放一句話」，而是把生成、轉錄、聲音複製與檔案輸出模式整理成可組合的工具介面。

對 SillyTavern / AI RPG 而言，VoiceStudio 可以作為本地角色聲音與語音輸入的底層候選，但目前 Repository 沒有提供專門的 SillyTavern 整合，因此更適合作為語音服務層或架構參考，而不是直接即插即用的 AI RPG 外掛。

它與 AOI × AI、Image Generation 的直接關聯較低。

## 建議怎麼使用

### TRY

先用桌面版實際測試三條流程：

1. 建立一個取得授權的聲音 Profile。
2. 測試 TTS 與即時聽寫。
3. 測試不同 TTS／ASR 引擎在目前硬體上的啟動時間、VRAM 與輸出品質。

這能最快確認 VoiceStudio 是不是適合當作日常本地語音工具，而不是只看功能表。

### INTEGRATE

若需要讓 Agent 具備聲音能力，優先測試 MCP：

- 用 generate_speech 讓不同 Agent 綁定不同聲音。
- 用 transcribe 把錄音轉成 Agent 可處理的文字。
- 使用 files 模式而不是把 WAV base64 直接塞進 Context。
- 若跨機器使用，從一開始就把 TLS、驗證與共享目錄邊界納入設計。

### LEARN

最值得讀的不是單一 TTS 模型，而是以下架構：

- Electron 如何監督 Python AI Runtime。
- Rust 原生控制層與 FastAPI 音訊資料平面的拆分。
- 多模型引擎路由與模型目錄。
- MCP 中大型二進位輸出的 Context 成本控制。
- 本機優先與遠端 GPU Worker 的責任邊界。

## 與其他收藏的關聯

- [YuE2：以符號規劃實現可編輯音樂生成與 Agent 音樂編輯](./github-multimodal-art-projection-yue.md)：兩者都屬於 Audio / Music / Speech 與 Agent 的交叉應用；YuE2 著重音樂生成與符號規劃，VoiceStudio 則著重語音、聲音身分、ASR 與配音工作流。
- [MCP Skills Extension (ext-skills)](./github-modelcontextprotocol-ext-skills.md)：ext-skills 解決 Agent Skill 的發現與內容交付；VoiceStudio 則透過 MCP 提供可直接執行的語音 Tool，兩者分別對應「能力封裝／發現」與「能力執行」層。

## 使用者備註

## 更新紀錄

### 2026-09-29

- 建立 Knowledge Card。
- 依 VoiceStudio 0.5.6 README、功能目錄、語音平台、MCP、Electron 架構、授權與效能文件整理。
