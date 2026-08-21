---
schema_version: 1
id: github-moeru-ai-airi
title: Project AIRI
canonical_url: https://github.com/moeru-ai/airi
source:
  type: github
  url: https://github.com/moeru-ai/airi
  identity: github:moeru-ai/airi
resource_kind:
  ai: project
  user: null
created_at: 2026-08-12
updated_at: 2026-08-21
last_checked_at: 2026-08-21
summary: Project AIRI 是開源的 AI VTuber／數位生命 Runtime，將多模型 LLM、即時語音、VRM／Live2D 角色、Web／桌面／行動端與遊戲 Agent 整合在同一個 monorepo；其目標是讓可持有、可延伸的虛擬角色不只聊天，也能聽、說、看、操作遊戲並逐步建立記憶。
classification:
  categories:
    ai:
      - AI / ML
      - LLM
      - Agent
      - RAG / Memory / Knowledge
      - SillyTavern / AI RPG
    user: null
  tags:
    ai:
      - ai-vtuber
      - virtual-character
      - digital-companion
      - multimodal-agent
      - game-playing-agent
      - voice-agent
      - VRM
      - Live2D
      - WebGPU
      - WebAssembly
      - xsai
      - Electron
      - Capacitor
      - DuckDB-WASM
    user: null
relevance:
  ai:
    overall: 5
    ai_rd: 4
    aoi_ai: 2
    llm_agent: 5
    sillytavern_ai_rpg: 5
    image_gen: 2
  user: {}
actions:
  ai:
    - TRY
    - LEARN
    - REFERENCE
    - WATCH
  user: null
status:
  ai: active
  user: null
---

# Project AIRI

## 一句話介紹

Project AIRI 是一套開源的 AI VTuber／數位生命 Runtime，試圖把 LLM 對話、即時語音、3D／2D 角色表現、記憶、外部通訊與遊戲操作整合成可以由使用者持有並持續擴充的虛擬角色系統，而不是只停留在聊天視窗。

## 它解決什麼問題

一般 Character AI 或聊天型角色系統主要處理「文字輸入 → 角色回覆」。AIRI 想處理的是更完整的 embodied agent 問題：角色需要能聽見語音、以聲音回應、控制 VRM／Live2D 身體、在 Discord／Telegram 等外部場域活動，甚至透過專用 Agent 玩 Minecraft、Factorio 等遊戲。

這使 AIRI 的目標更接近一個可長期運作的「虛擬生命容器」：角色人格只是其中一層，底下還需要模型 provider、音訊 pipeline、stage/rendering、記憶、tool/game runtime、跨裝置 client 與 plugin extension。專案也明確把 Neuro-sama 視為重要靈感來源，但強調以開源方式讓使用者可以自行持有與部署。

## 核心概念

AIRI 的核心不是綁定單一模型，而是把虛擬角色拆成多個可替換能力層。

- **Brain**：LLM 與 Agent 決策層，透過 `xsai` 支援 OpenAI、Anthropic、Gemini、OpenRouter、Ollama、vLLM、SGLang 等大量 hosted／local provider。
- **Ears**：瀏覽器或 Discord 音訊輸入、client-side speech recognition 與 talking detection。
- **Mouth**：多 provider TTS，包含 ElevenLabs、Azure Speech、OpenAI-compatible TTS、Alibaba Cloud 與 local Kokoro。
- **Body**：VRM 與 Live2D 模型控制、動畫、自動眨眼與視線等角色呈現。
- **Memory**：已具純瀏覽器 database 路徑，例如 DuckDB WASM／PGlite；較完整的 Memory Alaya 仍在開發。
- **Action / World interaction**：透過 server runtime 與專用 Agent 連接 Minecraft、Factorio 等環境，使角色可以執行不只是聊天的外部行動。

這種分層使 AIRI 比「LLM + avatar UI」更接近一個多模態角色作業環境：模型、感知、記憶、身體與外部工具可以沿不同 runtime 演進。

## 架構與技術

AIRI 是大型 TypeScript monorepo，根目錄使用 `pnpm` workspace 與 Turbo 管理 `apps/`、`packages/`、`server/`、`plugins/`、`integrations/`、`engines/` 等工作區。主要 UI 技術是 Vue、Vite、Pinia、Three.js／TresJS 與 UnoCSS；測試使用 Vitest。

主要 client 分成三條：

- **Stage Web**：Vue + Vite 的瀏覽器版本，依賴 WebGPU、WebAudio、Web Workers、WebAssembly、WebSocket、Transformers.js／ONNX Runtime Web 等 web runtime 能力，也提供 PWA 路徑。
- **Stage Tamagotchi**：Electron + electron-vite 的桌面版本，除了共用 Web UI stack，也能接觸螢幕擷取、global input、MCP／plugin SDK 與其他 native 能力。README 說明桌面端可利用 CUDA／Metal，而不必完全受瀏覽器能力限制。
- **Stage Pocket**：以 Capacitor 包裝的 iOS／Android client，沿用相同的 Vue／Vite 與音訊、模型、UI package。

README 的架構圖把 `Core`、`Stage`、`Server Runtime`、`STT`、`Memory`、`Realtime Audio` 與 game agents 分開。Memory 路徑包含 DuckDB WASM driver、Memory Alaya 與 pgvector 相關 package；遊戲端則以 server runtime 連接 Factorio Agent／RCON API 與 Minecraft Agent／Mineflayer。

模型層由 `xsai` 統一 provider 接口，讓 AIRI 同時能接商用 API、OpenAI-compatible endpoint 與本機推論服務。這種 provider abstraction 對長期角色系統很重要，因為角色人格、UI 與 memory 不需要跟單一模型 vendor 綁死。

## 主要功能

- 在 Web、Windows／macOS／Linux desktop 與 iOS／Android 路徑運行虛擬角色。
- 支援 OpenAI、Claude、Gemini、OpenRouter、Ollama、vLLM、SGLang、Groq、Mistral 等多種 LLM provider。
- 從瀏覽器與 Discord 接收音訊，支援 client-side speech recognition 與 talking detection。
- 以多 provider TTS 產生角色語音，並包含 local Kokoro TTS 路徑。
- 控制 VRM 與 Live2D 模型，提供眨眼、視線與 idle movement 等角色動畫。
- 與 Telegram、Discord 等通訊平台互動。
- 透過專用 Agent 玩 Minecraft；Factorio 已有 PoC／demo，其他遊戲能力仍持續擴充。
- 提供純瀏覽器 database 基礎，並持續開發更完整的長期記憶系統。
- 以 monorepo package、server runtime 與 WIP plugin system 提供擴充邊界。

## 技術亮點

第一個亮點是 **把角色 AI 當成完整 runtime，而不是聊天應用**。語音、模型、avatar、memory、server、game agent 與 client 都被拆成可演進元件，因此可以研究真正長時間運作的角色 Agent 需要哪些 subsystem，而不是只研究 prompt。

第二個亮點是 **Web-first 與 native acceleration 並存**。AIRI 大量採用 WebGPU、WebAudio、WASM、Web Workers 等技術，以取得瀏覽器與跨裝置可攜性；桌面端又保留 CUDA／Metal 與 Electron native integration。這種 hybrid runtime 在「容易分發」與「需要高效能／系統權限」之間提供了具體架構案例。

第三個亮點是 **模型與聲音 provider 的高度解耦**。`xsai` 讓角色 runtime 不必綁死特定 LLM，TTS／STT 也採多 provider 思路；對長期 AI RPG 或 virtual companion 而言，可替換 provider 比單次最佳模型更重要。

第四個亮點是 **把遊戲操作納入角色能力模型**。Factorio、Minecraft 等不是單純 tool-call demo，而是獨立 Agent／server integration，顯示 AIRI 正在探索「角色如何持續感知環境、形成動作並回到同一人格／互動層」的問題。這對 multimodal agent、AI VTuber 與 AI RPG 都有直接研究價值。

## 限制與風險

專案本身仍明確標示為 early stage。Roadmap 中 Memory Alaya、純瀏覽器 WebGPU local inference、部分遊戲能力與 plugin system 仍是 WIP，因此目前較適合作為快速演進中的平台與架構參考，而不是把所有 roadmap 項目視為穩定能力。

AIRI 的系統面很廣，monorepo 同時涵蓋 Web、Electron、mobile、音訊、3D rendering、LLM provider、database、server 與 game integrations。這帶來高度可研究性，也意味著本機開發、測試矩陣、跨平台相容性與升級成本會高於單一聊天前端。

多 provider 架構也代表資料邊界取決於實際選用的 LLM／STT／TTS 服務；若使用雲端 provider，語音、文字與角色上下文可能離開本機。相對地，Ollama、vLLM、local TTS、WebGPU／WASM 等路徑提供較高 local-first 潛力，但不等於所有功能目前都能完全離線。

截至 2026-08-12，最新正式 release 為 **v0.11.3**，發布於 2026-07-18；`main` 在 2026-08-11 仍有多筆語音／Stage 相關提交，維護活動度高。License 為 MIT，但快速迭代也表示介面、package 邊界與設定仍可能持續變動。

## 與你的相關性

依公開技術 Profile，AIRI 與 **LLM / Agent** 及 **SillyTavern / AI RPG** 都屬核心相關。它提供一個比聊天角色更完整的參考系統，可以直接觀察人格互動之外，語音、avatar、memory、provider abstraction、外部平台與 game agent 如何被組成同一個長期角色 runtime。

對 **AI R&D** 的價值也高，尤其適合拆解 multimodal agent、client/server 分工、local inference、語音 pipeline、memory lifecycle 與 game-playing agent。它並不是 AOI 專案，因此 `aoi_ai` 只給 2；不過其中 WebGPU、ONNX Runtime Web、Transformers.js、Computer Vision／RL 探索仍有技術旁通價值。

對 **Image Generation** 的直接相關性較低。AIRI 重點是角色呈現與動態控制，而不是 diffusion／image generation pipeline；VRM、Live2D 與 3D rendering 值得視覺系統參考，但不能等同影像生成工具。

## 建議怎麼使用

- **TRY**：先直接使用 Web 或桌面 release，實際測試「文字／語音 → LLM → TTS → avatar」完整迴路，以及不同 provider 切換的成本。
- **LEARN**：優先讀 monorepo 的 `stage-*`、audio pipeline、server runtime、memory 與 game agent 邊界。真正值得保留的是它如何把虛擬角色拆成可替換 subsystem，而不只是 UI。
- **REFERENCE**：把 AIRI 當作 AI VTuber／virtual companion 的大型架構基準。未來比較 SillyTavern 類聊天系統、AI RPG engine 或 agent framework 時，可用「感知、語音、身體、記憶、工具、世界互動、跨裝置」七個面向做差異分析。
- **WATCH**：持續關注 Memory Alaya、browser-local inference 與 plugin system。這三部分成熟後，AIRI 才會更接近真正可組裝、可長期持有的 local-first character runtime。

目前不直接標記 `INTEGRATE`：公開 Profile 顯示此領域高度相關，但 AIRI 本身仍在快速演進，先試用與拆解架構比直接把整個 runtime 納入其他系統更合理。

## 與其他收藏的關聯

- [Personal Model](./github-intuition-lab-personal-model.md)：兩者都涉及長期 Agent memory，但定位不同。Personal Model 專注於 owner-owned、evidence-linked 的跨 Agent 個人記憶；AIRI 的 memory 是虛擬角色 runtime 的其中一層，而且 Memory Alaya 仍在開發。兩者適合用來比較「個人工作 context」與「角色／數位生命記憶」在 ownership、provenance 與 state formation 上應如何分工。

## 使用者備註


## 更新紀錄

### 2026-08-21

- 重新檢查目前 Repository，依主要交付物正式將 `resource_kind` 分類為 `project`。

### 2026-08-12

- 首次收錄 Project AIRI。
- 依 repository README、monorepo package metadata、最新 release 與近期提交整理其 Web／Electron／mobile runtime、語音／avatar／game agent 架構與目前成熟度。
