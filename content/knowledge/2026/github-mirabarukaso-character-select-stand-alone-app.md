---
schema_version: 1
id: github-mirabarukaso-character-select-stand-alone-app
title: Character Select SAA
canonical_url: https://github.com/mirabarukaso/character_select_stand_alone_app
source:
  type: github
  url: https://github.com/mirabarukaso/character_select_stand_alone_app
  identity: github:mirabarukaso/character_select_stand_alone_app
created_at: 2026-08-12
updated_at: 2026-08-12
last_checked_at: 2026-08-12
summary: Character Select SAA 是一套 Electron 桌面式 AI 圖像生成前端，從角色縮圖選擇、Tag 補全與 AI Prompt，一路整合 ComfyUI／Forge Neo、ControlNet、IP-Adapter、ADetailer、Regional Prompt、MiraITU 與 ONNX Image Tagger；並透過 SAAC WebSocket 服務與 Python SAA Agent，讓瀏覽器或本機 Agent 直接呼叫生成流程。
classification:
  categories:
    ai:
      - Image Generation
      - General Tools
      - Agent
      - AI / ML
    user: null
  tags:
    ai:
      - electron
      - character-selector
      - comfyui
      - forge-neo
      - diffusion-models
      - prompt-assist
      - onnxruntime-node
      - image-tagger
      - controlnet
      - ip-adapter
      - regional-prompting
      - adetailer
      - websocket-api
      - saa-agent
      - openclaw
    user: null
relevance:
  ai:
    overall: 5
    ai_rd: 3
    aoi_ai: 2
    llm_agent: 4
    sillytavern_ai_rpg: 4
    image_gen: 5
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

# Character Select SAA

## 一句話介紹

Character Select SAA 是把「角色選擇、Prompt 編輯、模型／LoRA／ControlNet 設定、圖像生成、Tagger 與 Agent 呼叫」集中到單一 Electron 應用的本機 Image Generation 工作台，主要對接 ComfyUI 與 Forge Neo。

## 它解決什麼問題

一般 Stable Diffusion／ComfyUI 角色生成流程往往分散在角色 Tag 查找、Prompt 編輯、模型與 LoRA 選擇、ControlNet／IP-Adapter、Regional Prompt、ADetailer、Upscale 與生成後整理等多個介面。對固定使用 anime character model 的使用者而言，真正耗時的往往不是按下 Generate，而是反覆查角色名稱、組 Prompt、切換後端與重建相同工作流。

SAA 的切入點是把角色 thumbnail dataset 與生成參數做成可視化操作層。角色資料、Tag Assist、Favorites、Wildcard 與 Prompt 可以直接在同一介面組合，再由後端轉成 ComfyUI workflow 或 Forge Neo API 請求。專案最初偏向 WAI Illustrious 系列，但目前已擴充到 Anima、Qwen Image、Z Image、Flux、Krea2 等 diffusion model 工作流，因此定位已從單一角色選擇器演變成較完整的生成 orchestration frontend。

另一個問題是「如何讓非 GUI client 使用同一套生成能力」。SAA 額外提供 SAAC browser client、HTTP／WebSocket service 與 Python `saa-agent.py`，使本機 Agent 或 CLI 可以透過同一個 SAA backend 執行 ComfyUI／WebUI 生成，而不需要自行重寫完整 workflow construction。

## 核心概念

核心設計可以分成四層：

1. **Character / Prompt data layer**：以 Hugging Face dataset、角色 CSV、thumbnail JSON、Tag Assist、Wildcard 與 Favorites 為基礎，降低角色 Tag 搜尋與 Prompt 組裝成本。
2. **Desktop orchestration layer**：Electron 主程序集中管理設定、模型清單、檔案、Tag Auto Complete、AI Prompt、Image Tagger 與各生成 backend，Renderer 主要透過 preload／IPC 呼叫能力。
3. **Generation adapter layer**：針對 ComfyUI 與 Forge Neo 分別維護 backend adapter；ComfyUI 端會在程式內依 Regional Prompt、ControlNet、IP-Adapter、Refiner、Hires Fix 等選項動態組裝 workflow graph。
4. **Remote / Agent access layer**：可選擇啟用 SAAC HTTP／WebSocket server，瀏覽器與 Python SAA Agent 都可透過 WebSocket API 觸發相同 backend，形成 GUI 與 Agent 共用的生成服務。

AI Prompt 不是自建 LLM，而是提供 OpenAI-compatible remote chat completion 與 local chat endpoint adapter；因此 SAA 把 LLM 視為 Prompt 輔助器，而不是生成核心。

## 架構與技術

主程式使用 **Electron + JavaScript**。`main.js` 建立 BrowserWindow，開啟 `contextIsolation`、停用 renderer `nodeIntegration`，再掛載 file handler、global settings、model list、Tag Auto Complete、remote/local AI、ComfyUI backend、WebUI backend、Wildcard、cache 與 ONNX tagger 等模組。

生成端採雙 backend：

- **ComfyUI**：透過 HTTP／WebSocket 與 ComfyUI 溝通，並由 `comfyui_workflow.js` 與 `generate_backend_comfyui.js` 動態改寫 workflow node graph。ControlNet、IP-Adapter、Regional Condition、Refiner、Hires Fix、MiraITU 與 diffusion UNET／text encoder／VAE 都在此層組合。
- **Forge Neo / WebUI**：使用 WebUI API adapter，並保留 Regional Condition、ADetailer、ControlNet 等相容功能。原始 A1111 仍可能可用，但專案已因維護狀態停止正式測試與支援。

本機 Image Tagger 使用 `onnxruntime-node`，支援 WD、CL 與 Camie 類型的 ONNX tagger；README 明確指出 Electron Node 版本目前主要跑 CPU，效能顯著慢於 Python `onnxruntime-gpu`。

Remote AI 直接送出 OpenAI-compatible `chat/completions` body，包含 system / user messages 與 Bearer API key；Local AI 則使用本機 chat endpoint。預設 remote endpoint 指向 Groq-compatible URL，本機 endpoint 指向 `127.0.0.1`。

SAAC 服務使用 **Express + WebSocket (`ws`)**。若提供 certificate、key 與 user CSV，會啟用 HTTPS、Helmet、bcrypt 驗證與 login token；沒有憑證時則退回 HTTP 模式。Python SAA Agent 使用 `websockets` 與 `aiohttp` 呼叫此服務，支援基本生成、Regional Prompt、HiResFix、Refiner 與輸出檔案等參數。

資料與設定則主要保存在本機檔案：角色 CSV／JSON、Hugging Face 下載的 thumbnail dataset、settings JSON、Wildcard、模型目錄與自訂 path YAML。這使它保持 local-first，但也意味著資料版本與應用程式版本並非完全綁定。

## 主要功能

- 角色 thumbnail 選擇、搜尋、Favorites 與多套 thumbList。
- Semi-auto Tag Complete、Wildcard、Prompt Ban／Replace 與 AI Prompt 輔助。
- ComfyUI 與 Forge Neo 生成，支援 checkpoint 與 diffusion model 類型。
- 模型、LoRA、VAE、text encoder、sampler、scheduler 與生成參數管理。
- Regional Condition／Couple composition，可分左右角色與 Prompt。
- ControlNet、IP-Adapter、ADetailer、Refiner、Hires Fix。
- Mira Image Tiled Upscaler（MiraITU）與圖片拖放 upscale。
- WD／CL／Camie ONNX Image Tagger。
- SAAC browser client 與 WebSocket API。
- Python SAA Agent，可從本機 Agent／CLI 直接觸發生成。
- 自訂模型目錄與設定檔存取，並可由 Hugging Face 更新角色資料集。

## 技術亮點

第一個亮點是 **把角色資料庫與生成 orchestration 真正接在一起**。很多角色 selector 只負責把 Danbooru Tag 複製到剪貼簿，但 SAA 會直接把選擇結果帶入完整生成 pipeline，讓角色 metadata 變成 workflow 的輸入，而不是單純查詢工具。

第二個亮點是 **程式化生成 ComfyUI graph**。它不是要求使用者先維護大量固定 workflow JSON，而是根據 UI 選項動態插入 ControlNet、IP-Adapter、Regional condition、Refiner 等節點。這種「高階設定 → workflow graph compiler」模式很適合參考在其他需要封裝 ComfyUI 複雜度的產品。

第三個亮點是 **GUI、Browser、CLI／Agent 共用 backend**。Electron UI 與 SAA Agent 並不是兩套完全分離的實作，而是透過 IPC 與 WebSocket 進入同一批 backend function。對 Agent tooling 而言，這比只能自動點擊 GUI 的方式更穩定，也更容易組成可程式化工作流。

第四個亮點是把 **Image Tagger 放進桌面 Runtime**。`onnxruntime-node` 讓標籤推論可以直接在 Electron 內完成，不必另啟 Python server；雖然效能較差，但部署與使用體驗更單一。

此外，2026 年的 changelog 顯示專案仍持續快速加入 diffusion model、GGUF、MiraITU、SAA Agent、Favorites 與 Regional／ADetailer 擴充，代表它目前仍是活躍迭代中的實用型工具，而不是停止維護的舊前端。

## 限制與風險

**Backend compatibility 很複雜。** README 目前將 ComfyUI 與 Forge Neo 列為主要支援目標，但不同功能對 SDXL、Anima、一般 diffusion model 的支援程度不同；ComfyUI 還依賴 ComfyUI_Mira、ControlNet Aux、IPAdapter 等 custom node。這種 integration 型工具最大的維護成本就是 upstream API 與 custom node 版本漂移。

**ComfyUI Desktop 明確不支援。** 若使用者主要依賴 ComfyUI Desktop，需要先確認是否願意改用一般 ComfyUI runtime。A1111 也已從正式支援矩陣移除，即使部分功能仍可能工作，也不應視為維護中的 target backend。

**SAAC 網路服務需要特別注意。** 功能預設關閉，但預設 bind address 是 `0.0.0.0`。在沒有 certificate 時，server 會退回 HTTP，而且 `/api/login` 直接發出 token、不檢查 username/password。若只綁 localhost 或可信任 LAN，風險較可控；若把該 port 暴露到不可信網路，則應自行配置 HTTPS／帳密驗證與防火牆，而不能把 HTTP fallback 當作安全遠端 API。

**本機 settings 應視為敏感檔案。** Remote AI API key 是 global settings 的一部分，設定本身使用 JSON 檔案保存；因此備份、同步或分享 settings 時應避免連同 API key 外洩。

**Tagger 效能有取捨。** README 的測試指出 `onnxruntime-node` CPU 版本比 Python CPU 慢約數倍、比 `onnxruntime-gpu` 更慢；若 Tagger 是高頻批次流程，Electron 內建推論的便利性可能不值得效能成本。

**應用程式與資料集更新分離。** Git pull 不會自動更新既有角色 dataset；README 要求刪除舊的 CSV／JSON 後重新下載。One-click package 也可能落後 GitHub 最新版，因此版本診斷時要同時確認 app、dataset、ComfyUI custom node 與 backend 版本。

專案採 MIT License，程式碼可自由研究與整合；但實際使用的 diffusion models、LoRA、角色資料集與外部 custom nodes 仍各自受其授權條款約束。

## 與你的相關性

依公開技術 Profile，這個專案對 **Image Generation** 的相關性最高。它不是只提供 Prompt 範例，而是完整涵蓋角色資料、生成 UI、ComfyUI／WebUI backend、ControlNet、IP-Adapter、Regional Prompt、Upscale 與 Tagger，適合作為「如何把複雜生成能力包成可操作產品」的案例。

對 **LLM / Agent** 也有高相關性。SAA Agent 與 SAAC WebSocket API 已經把圖像生成能力變成可被本機 Agent 呼叫的工具，並提供明確 CLI 參數與 exit code；因此它可以直接作為 Agent image-generation tool 的參考實作，而不是只停留在 GUI automation。

對 **SillyTavern / AI RPG** 屬間接但明顯相關。SAA 本身不是角色扮演 runtime，也沒有 SillyTavern protocol，但它擅長角色 thumbnail、角色 Tag、雙人 Regional Prompt 與 character-centric image generation，適合作為 AI RPG 角色立繪、場景圖與互動素材的生成前端。

對 **AI R&D** 的價值主要在系統整合與 inference engineering：例如 ComfyUI graph assembly、multi-backend adapter、ONNX runtime、模型清單與 local/remote AI interface。它不是研究 framework，因此研究性分數低於實用性分數。

對 **AOI × AI** 的直接關聯較低。ONNX Image Tagger、圖片讀取與影像處理架構仍可作為桌面 CV inference 的參考，但它的資料、模型與流程都以生成式影像為中心，並非工業檢測系統。

## 建議怎麼使用

- **TRY**：優先用 GitHub clone 版本而不是只依賴 one-click package，先以 ComfyUI 或 Forge Neo 完成最小生成流程，再測 Character Select、Regional Prompt 與 Image Tagger。
- **INTEGRATE**：若需要讓 Agent 控制本機 image generation，可直接研究 SAA Agent + SAAC WebSocket 的工具介面；建議先限定在 `127.0.0.1`，確認流程穩定後再考慮 LAN access。
- **REFERENCE**：把它當作 ComfyUI productization 的參考：尤其是「高階 UI 設定如何轉成 workflow graph」、「GUI 與 Agent 如何共用 backend」以及「角色 metadata 如何接到生成流程」三個設計。

不優先標記 `BUILD`，因為這個專案已提供相當完整的成品；若需求與它高度重疊，直接試用、整合或抽取架構通常比重新實作更划算。

## 與其他收藏的關聯

目前已收錄的 **Personal Model** 著重 Agent 的長期 context／memory，而 Character Select SAA 著重 Agent 可呼叫的 image-generation capability；兩者位於 Agent stack 的不同層，可以用來對照「context provider」與「action/tool provider」的邊界。

現有 **Hallmark** 則屬 AI coding / frontend design skill，與 SAA 沒有直接技術依賴，因此暫不建立強關聯。

## 使用者備註


## 更新紀錄

### 2026-08-12

- 首次收錄。
- 依 repository metadata、README、CHANGELOG、Electron main process、ComfyUI backend、SAAC WebSocket service、global settings 與 SAA Agent 文件建立分析。
