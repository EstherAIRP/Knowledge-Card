---
schema_version: 1
id: github-harry0703-moneyprinterturbo
title: MoneyPrinterTurbo
canonical_url: https://github.com/harry0703/MoneyPrinterTurbo
source:
  type: github
  url: https://github.com/harry0703/MoneyPrinterTurbo
  identity: github:harry0703/moneyprinterturbo
created_at: 2026-08-18
updated_at: 2026-08-18
last_checked_at: 2026-08-18
summary: MoneyPrinterTurbo 是一套以 Python 建構的 AI 短影音自動化工作流，將 LLM 腳本與搜尋詞生成、素材取得、TTS、字幕、配樂、影片合成與 TikTok／Instagram／YouTube Shorts 發布串成完整產線，並提供 WebUI、API、CLI 與可由具終端能力 Agent 執行的 SKILL.md 工作流程。
classification:
  categories:
    ai:
      - Image Generation
      - Agent
      - AI / ML
    user: null
  tags:
    ai:
      - AI video generation
      - video automation
      - Agent Skills
      - SKILL.md
      - Python
      - FastAPI
      - Streamlit
      - MoviePy
      - FFmpeg
      - text-to-speech
      - subtitles
      - stock footage
      - Pexels
      - Pixabay
      - Coverr
      - Ollama
      - LiteLLM
      - TwelveLabs
      - cross-posting
    user: null
relevance:
  ai:
    overall: 4
    ai_rd: 3
    aoi_ai: 1
    llm_agent: 4
    sillytavern_ai_rpg: 1
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

# MoneyPrinterTurbo

## 一句話介紹

MoneyPrinterTurbo 是一套 **AI 短影音自動化產線**：輸入主題、關鍵字或既有腳本後，系統可串起 LLM 文案與素材搜尋詞、影片素材、語音合成、字幕、背景音樂與影片合成，最後輸出短影音，並可進一步發布到 TikTok、Instagram 與 YouTube Shorts。

它的核心價值比較接近 **content workflow orchestration**，而不是訓練或提供一個新的影片生成基礎模型。預設工作方式大量依賴素材搜尋、TTS、字幕與 FFmpeg／MoviePy 合成，因此更適合視為「把多個 AI 與媒體處理服務組合成可交付成品」的自動化系統。

## 它解決什麼問題

傳統短影音製作通常需要人工反覆處理文案、搜尋畫面、配音、字幕、音樂、剪輯與發布。MoneyPrinterTurbo 把這些步驟收斂成同一個任務流程，降低從「一個主題」到「可發布 MP4」之間的操作成本。

專案目前提供四種入口：AI Agent、WebUI、API 與 CLI。這使它不只適合非技術使用者透過介面操作，也能被程式或 Agent 當作自動化後端使用。

特別值得注意的是，專案已把 Agent 使用情境正式產品化：官方 `docs/skill/SKILL.md` 規定 Agent 應自動完成安裝、重用設定、檢查缺少的 API Key、執行影片生成、處理一次可恢復錯誤，最後直接交付產出的影片路徑。這比單純提供一段「請 AI 幫我跑 CLI」的說明更接近可重複執行的 Agent Skill。

## 核心概念

第一個核心是 **Pipeline-first**。系統不是讓單一模型一次完成整支影片，而是把影片製作拆成可替換階段：先產生腳本，再產生或整理素材搜尋詞，取得素材、生成旁白、處理字幕與配樂，最後合成影片。這種方式讓每一段都能使用不同供應商，也較容易針對單一階段除錯或替換。

第二個核心是 **Provider abstraction**。README 與設定檔顯示它支援多種 LLM、TTS 與素材來源，包括 Kimi／Moonshot AI、OpenAI、Gemini、DeepSeek、Qwen、Azure OpenAI、Ollama、LiteLLM、Groq，以及 Pexels、Pixabay、Coverr 等。這使整體工作流不被單一模型或雲端 API 完全綁死。

第三個核心是 **Task orchestration**。`app/services/task.py` 將腳本、搜尋詞、素材、語音、字幕、配樂、影片與跨平台發布等服務集中編排，並記錄進度、失敗階段與產物。跨平台發布另外放入受限大小的 thread pool，避免長時間上傳佔住影片生成工作。

第四個核心是 **Agent as an execution surface**。官方 Skill 要求具 terminal、network、filesystem 與長時間 command 能力的 Agent，直接執行 `mpt_agent.py`，必要時只詢問缺少的 credentials，成功後回傳最終 MP4。換句話說，Agent 在這裡不是聊天介面，而是安裝、配置、執行與交付的 orchestration layer。

## 架構與技術

主要技術棧為 Python 3.11+。Repository 的 `app/` 依 controller、model、service、config、utils 分層；API 入口使用 FastAPI／Uvicorn，WebUI 使用 Streamlit，CLI 則提供獨立命令列流程。

主要服務可概括為：

- `llm.py`：腳本與素材搜尋詞等 LLM 任務。
- `material.py`：本地或 Pexels／Pixabay／Coverr 等影片素材來源。
- `voice.py`：多種 TTS。
- `subtitle.py`：字幕產生與處理。
- `video.py`：影片處理與合成。
- `bgm.py`、`sonilo.py`、`elevenlabs_music.py`：背景音樂流程。
- `task.py`：跨服務任務編排、進度、錯誤與發布控制。
- `upload_post.py`：短影音平台發布。
- `state.py`：Memory 與 Redis 兩種 task state backend。

媒體處理依賴包含 MoviePy、FFmpeg、pydub；語音與字幕相關依賴包括 Edge TTS、Azure Speech 與 faster-whisper。LLM 端同時保留 OpenAI SDK、Google GenAI、DashScope 與 LiteLLM 等整合層。

部署方式涵蓋本機 Python／`uv`、Windows 一鍵啟動包、Docker、GPU Docker，以及 Google Colab。官方也提供 GHCR 預建映像供 `docker-compose.release.yml` 使用。

## 主要功能

- 從主題或自訂腳本產生影片文案與素材搜尋詞。
- 產生 9:16 直式與 16:9 橫式高清影片。
- 一次產生多個候選影片。
- 支援本地素材與 Pexels、Pixabay、Coverr 線上素材。
- 支援多種 LLM Provider、OpenAI-compatible gateway 與 Ollama 本機模型。
- 支援 Edge TTS、Azure Speech、Google Gemini、ElevenLabs 等語音方案。
- 可自訂字幕字型、位置、顏色、大小、描邊與背景。
- 支援指定或自動生成背景音樂。
- 可用 TwelveLabs 進行選用的素材語意排序／影片分析能力。
- 可將成品自動發布至 TikTok、Instagram 與 YouTube Shorts。
- 提供 AI Agent Skill、WebUI、API、CLI 四種操作面。

## 技術亮點

最值得參考的不是「AI 會寫腳本」本身，而是 **把不可控的模型能力包在可觀測的工程流程裡**。`task.py` 會把 script、terms 等階段明確拆開，失敗時保留 `failed_stage` 與 error，而不是把整個流程視為一個黑箱請求。這種做法對長任務自動化比單純增加 Prompt 更實用。

第二個亮點是 **Agent Skill 已包含 execution contract**。它不只寫「怎麼用」，還規定 Agent 何時可詢問 credentials、禁止洩漏 API Key、如何處理 foreground command、成功時應讀取哪個 result file、什麼情況允許 retry。這讓 Skill 更像一層輕量 harness，而不是靜態說明文件。

第三個亮點是 **供應商替換性高**。LLM、TTS、素材、背景音樂與 state backend 都有一定程度的抽象；對想研究「AI 內容生成產品如何避免被單一 API 綁定」而言，這個 Repository 有實際工程參考價值。

第四個亮點是 **生成與發布分離**。跨平台發布被放進獨立 thread pool，產物生成完成後即可進入完成狀態，不必讓上傳流程長時間占用影片生成並發名額。這是相對成熟的產品化細節。

## 限制與風險

第一，這套系統的品質高度依賴外部服務與素材來源。即使支援許多 Provider，LLM、素材 API、TTS 或社群平台任何一段改版、限流或憑證失效，都可能讓整條工作流中斷；因此「Provider 多」降低的是單點綁定，不代表外部依賴消失。

第二，它主要是 **AI 輔助素材編排與影片自動合成**，不應與 Sora、Kling、Seedance 類的端到端生成式影片模型混為一談。若需求是高度客製的鏡頭運動、角色一致性或純生成影片，MoneyPrinterTurbo 的核心方法並不是同一類技術。

第三，Agent Skill 具有明顯的 supply-chain surface。當 Agent 僅載入遠端 `SKILL.md` 時，官方流程允許再從 Repository `main` 下載 `mpt_agent.py` 並執行。正式或高信任環境若要使用，較穩健的做法是 pin 到審核過的 tag／commit，而不是永遠追隨移動中的 `main`。

第四，網路暴露需要額外注意。`config.example.toml` 的 API 預設 `listen_host` 為 `0.0.0.0`，ASGI 設定在未提供 `CORS_ALLOWED_ORIGINS` 時使用萬用來源；在檢視的 ASGI 檔案中也沒有看到 authentication middleware。這不代表整個專案一定沒有其他存取控制，但不應直接把預設服務裸露到不受信任網路。

第五，Redis state 的程式註解明確把 Redis 視為應由應用程式私有使用的 trust boundary。若把 Redis 開放給不受信任寫入者，現有的值轉型／反序列化相容邏輯不應被當作安全隔離機制。

專案目前仍十分活躍：GitHub metadata 顯示 2026-08-18 仍有 push，並採 MIT License；同時已有大量使用者與 Fork，成熟度明顯高於一般實驗型 AI 專案。但高人氣不能取代實際 deployment hardening，尤其是 credentials、外部 API 與自動發布權限。

## 與你的相關性

依公開技術 Profile，這個專案對 **AI R&D、Agent 與 AI Image Generation／創作工作流** 的相關性較高。

對 AI R&D 而言，它適合用來研究一個「多模型、多服務、長任務」AI 應用如何拆 service、管理狀態、回報失敗階段與降低 provider lock-in；它的價值偏工程系統，而不是新模型方法。

對 Agent 而言，`SKILL.md + mpt_agent.py` 是很具體的案例：把一個原本需要人類安裝與操作的完整應用，包成 Agent 能執行的 delivery workflow。這對研究 Agent Skill、tool execution、credential handoff、result contract 與錯誤恢復特別有參考價值。

對 Image Generation／創作流程而言，雖然它不是純生圖工具，但它展示了生成式 AI 如何進一步接到素材、聲音、字幕、合成與發布，形成真正可以交付的內容產品。因此整體相關性評為 4，而創作工作流維度給 5。

AOI × AI 與 SillyTavern／AI RPG 則沒有直接技術重疊，因此相關性較低。

## 建議怎麼使用

`TRY`：如果目標是理解目前成熟的 AI 短影音自動化能做到什麼，這個專案值得直接跑一次。建議先用本機或隔離環境，選定單一 LLM、Pexels 與預設 TTS，觀察從主題到 MP4 的完整 task lifecycle，而不是一開始就把所有 Provider 都接上。

`LEARN`：優先研究 `docs/skill/SKILL.md`、`app/services/task.py`、`app/services/llm.py`、`app/services/state.py` 與 `config.example.toml`。這幾個檔案最能看出它如何把 Agent contract、內容生成 pipeline、provider abstraction 與 task state 串起來。

`REFERENCE`：若未來要設計任何「Agent 接手一個既有應用並直接交付成品」的系統，MoneyPrinterTurbo 很適合作為參考案例，尤其是 credentials 只在必要時詢問、結果檔案 contract、一次 retry、階段式錯誤與背景任務隔離等細節。

## 與其他收藏的關聯

- [Skills For Real Engineers](./github-mattpocock-skills.md)：兩者都使用 `SKILL.md` 把 Agent 行為轉成可重複執行的工作流程。差別是 Skills For Real Engineers 偏工程方法與行為規範；MoneyPrinterTurbo 的 Skill 則直接包住一個具體應用，目標是從安裝一路執行到交付影片，屬於更偏 application execution 的 Agent Skill。

## 使用者備註

## 更新紀錄

### 2026-08-18

- 建立 MoneyPrinterTurbo Knowledge Card。
- 收錄官方 README、Repository metadata、Agent Skill、核心 task orchestration、ASGI、state 與 configuration evidence。
