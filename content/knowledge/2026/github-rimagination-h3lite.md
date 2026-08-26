---
schema_version: 1
id: github-rimagination-h3lite
title: H3 Lite
canonical_url: https://github.com/Rimagination/h3lite
source:
  type: github
  url: https://github.com/Rimagination/h3lite
  identity: github:rimagination/h3lite
resource_kind:
  ai: skill
  user: null
created_at: 2026-08-26
updated_at: 2026-08-26
last_checked_at: 2026-08-26
summary: H3 Lite 是給 Codex、WorkBuddy 等 AI Agent 使用的 MiniMax H3 本地影片生成 Skill，將 Windows + NVIDIA + ComfyUI 的硬體檢查、元件組選擇、低顯存規劃、提示詞路由、影片生成與結果驗收整合成可重複執行的工作流程。
classification:
  categories:
    ai:
      - Agent
      - Image Generation
      - AI / ML
    user: null
  tags:
    ai:
      - MiniMax H3
      - ComfyUI
      - agent-skill
      - local-video-generation
      - hardware-aware-routing
      - low-VRAM
      - NVIDIA CUDA
      - T2VA
      - I2VA
      - Ref2VA
      - native-audio
    user: null
relevance:
  ai:
    overall: 4
    ai_rd: 4
    aoi_ai: 1
    llm_agent: 5
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

# H3 Lite

## 一句話介紹

H3 Lite 把 MiniMax H3 的本地影片生成環境包裝成一套可由 Agent 執行的 Skill：使用者描述想要的影片後，Agent 先檢查平台與硬體，再選擇 ComfyUI 元件組、生成模式與低顯存策略，最後提交生成並驗證輸出，而不是要求使用者自行理解模型、文字編碼器、LoRA、雙 VAE、節點與顯存參數如何配合。

## 它解決什麼問題

MiniMax H3 的本地部署不只是「下載模型後執行」；實務上還要同時處理 GPU／顯存、系統記憶體、pagefile、磁碟、ComfyUI 節點、模型版本、文字編碼器、VAE、LoRA、工作流 JSON、生成模式與結果驗收。這些元件彼此有相容性，任一環節選錯都可能造成 OOM、極慢推論、模型載入失敗、灰屏／馬賽克或輸出雖可播放但內容不符合需求。

H3 Lite 的切入點是把這些工程判斷整理成 Agent 可遵循的工作流程，讓「環境檢查 → 路線選擇 → 提示詞整理 → 生成 → 驗收」成為同一個任務，而不是把部署、生成與除錯拆成多份人工操作說明。

## 核心概念

1. **硬體感知路由**：先偵測作業系統、GPU、顯存與資源狀況，再決定是否走已驗證的 Windows + NVIDIA + ComfyUI 路線，以及該使用哪一組模型與記憶體模式。
2. **元件組原子化**：把擴散模型、文字編碼器、ClipProj、Turbo LoRA、雙 VAE、工作流與 custom nodes 視為一個整體，不允許只因檔名看起來合理就混搭不同版本。
3. **意圖導向的生成模式**：依輸入素材與驗收條件，在 `T2VA`、`I2VA`、`FL2VA`、`L2VA`、`Ref2VA` 之間選擇主要路線，而不是只從提示詞風格猜測模式。
4. **從提示詞到驗收的完整契約**：複雜任務採用「意圖路由 → 參考／身份錨點 → 提示詞增強 → 執行 → 驗證」流程，將角色一致性、鏡頭、聲音與防漂移條件納入生成前後的檢查。
5. **熱路徑與冷路徑分離**：既有健康環境的普通生成走精簡 fast path；下載模型、雜湊驗證、依賴修復與完整環境掃描留在安裝／修復階段，避免每次生成重做高成本檢查。

## 架構與技術

- **Agent Skill 層**：`SKILL.md` 定義 Codex、WorkBuddy 等 Agent 的使用情境、平台路由、安裝原則、執行規則與失敗處理。Repository 的主要交付物就是這套可被 Agent 載入與遵循的 Skill。
- **決策與參考層**：`references/deployment-matrix.md`、`component-sets.md`、`agent-workflow.md`、`prompt-assist.md` 等文件提供硬體矩陣、元件版本、生成模式、錨點與提示詞結構。
- **本地執行層**：Python 腳本包含 `h3_doctor.py`、`h3_plan.py`、`h3_preflight.py`、`h3_fastpath.py`、`h3_generate.py`、`h3_status.py`、`h3_vram.py`、`h3_anchor.py` 等，分別負責診斷、規劃、前置檢查、快速提交、生成、狀態追蹤、顯存檢查與錨點管理。
- **生成後端**：主路線使用本機 ComfyUI HTTP API 與 MiniMax H3 模型；當已有可重用的 API-format workflow JSON 時優先走 API，瀏覽器／CDP 只作為工作流恢復備援。
- **模型與加速元件**：Set A 使用 W4A8 擴散模型搭配 4B INT4 文字編碼器，偏向 8 GB 級低顯存快速路線；Set B 使用 W4A8 模型搭配 4B FP8 文字編碼器，偏向較高顯存的相容路線。兩組都要求匹配的 ClipProj、Turbo LoRA、VAE 與工作流。
- **執行紀錄與驗收**：每次生成會保存有效提示詞、工作流指紋、queue ID、實際耗時與輸出資訊；涉及多鏡頭或身份一致性時還會保存 `anchors.json`，並以影片／音訊流、時長、FPS、黑幀、動作與首中尾畫面等訊號輔助驗收。

目前已驗證的主要平台是 Windows + NVIDIA。macOS Apple Silicon 有獨立的社群 MLX／Metal 路線，但不等同於 H3 Lite 的 ComfyUI 主路線；Linux + NVIDIA 則仍屬實驗性適配範圍。

## 主要功能

- 由 Agent 檢查平台、GPU、顯存、記憶體、pagefile、磁碟與既有 ComfyUI 環境，決定是否能安全進入生成流程。
- 依硬體與已安裝元件選擇 Set A／Set B、`LOW_VRAM`／`NORMAL_VRAM` 與對應工作流。
- 支援文字生成影片、首幀／尾幀約束與多種參考素材路線，包括 `T2VA`、`I2VA`、`FL2VA`、`L2VA`、`Ref2VA`。
- 保留 MiniMax H3 原生音訊流程，可在提示詞中處理環境聲、動作聲、對白與音樂需求。
- 針對多鏡頭與身份敏感任務建立錨點卡，固定角色、服裝、道具、場景與參考素材角色，並記錄可變項與禁止漂移項目。
- 以 `fast`、`balanced`、`quality` 等預設控制步數與畫質取捨，建議先低解析度驗證完整鏈路，再提高解析度或複雜度。
- 對已註冊的大型模型檔提供大小／SHA-256 完整性檢查與快取，降低「檔案存在但內容損壞」造成的錯誤判斷。
- 提供顯存競爭、ComfyUI 健康狀態、生成狀態與媒體輸出檢查腳本，協助區分模型問題、環境問題與資源不足。

## 技術亮點

### 1. Skill 不只是提示詞文件，而是本地推論 Harness

H3 Lite 最值得參考的地方不是某一組 H3 提示詞，而是它把 Agent 指令、硬體探測、元件契約、ComfyUI API、生成腳本、狀態紀錄與驗收組合成一個可執行的本地 Harness。這種設計適合需要 Agent 操作大型本地模型、又不能只靠「最佳努力」猜測環境狀態的工作。

### 2. 用「元件組」處理相容性，而不是逐檔案猜測

大型生成模型常見的問題是模型、文字編碼器、VAE、LoRA 與節點都各自能載入，但組合後不一定正確。H3 Lite 明確把它們綁成 Set A／Set B，並要求版本、工作流與完整性一起驗證。這比單純列下載連結更接近可重現部署。

### 3. 將資源成本納入 Agent 決策

Repository 不把「8 GB 顯存」視為充分條件，而是同時考慮系統記憶體、儲存、pagefile、筆電功耗與動態卸載成本。README 中同一組 Set B、提示詞、seed 與 `640×352 / 4 步` 條件下，RTX 4060 Ti 16 GB 約 77.08 秒、RTX 4070 Laptop 8 GB 約 591.22 秒，作者也明確指出這不是純 GPU benchmark，而是顯存駐留與系統記憶體卸載差異的實務案例。

### 4. 把內容一致性變成可記錄的驗收資料

`anchors.json`、`manifest.json` 與首／中／尾幀檢查讓生成任務不只留下 MP4，而是留下「這次為什麼選這個路線、用了什麼提示詞、如何判定成功」的執行證據。雖然身份與服裝一致性仍需要人工複核，但這種設計比只檢查檔案是否存在更適合 Agent 工作流。

## 限制與風險

- **平台限制明顯**：目前主支援仍是 Windows + NVIDIA + ComfyUI；Linux + NVIDIA 未完整驗證，macOS Apple Silicon 使用的是外部社群 MLX／Metal 路線，不能把文件中的 Windows 指令或效能數字直接套用。
- **硬體與模型成本高**：模型檔案龐大，首次部署會消耗大量下載時間、磁碟與記憶體；低顯存雖可藉由卸載運作，但速度可能大幅下降。
- **第三方相依多**：MiniMax 模型權重、ComfyUI、custom nodes、LoRA、VAE 與社群套件各自有版本與授權條件。H3 Lite 本身是 MIT License，不代表上游模型與節點也都適用相同授權。
- **Ref2VA 與身份一致性仍有實驗成分**：Repository 會先確認對應模型、文字編碼器、投影與 workflow 是否齊全；若元件不完整會回退到其他模式。`anchor_qa` 只是漂移訊號，不等同人臉辨識或身份一致性證明。
- **效能數字不可當硬體保證**：README 的測試反映特定模型、工作流、驅動、記憶體與卸載策略；不同電腦即使 GPU 型號或顯存相近，也可能有很大差異。
- **專案仍很新且快速演進**：Repository 建立於 2026-08-13，雖然已包含多個測試、診斷腳本與版本化參考文件，但元件集、ComfyUI 相容性與最佳路線仍可能快速變動，導入時應重新檢查最新文件。

## 與你的相關性

依公開技術背景，H3 Lite 與 **LLM／Agent** 及 **AI Image Generation** 的關聯最高。它一方面是典型的 Agent Skill：重點在如何讓 Agent 可靠地檢查環境、選路線、呼叫本地工具、保留執行證據並處理失敗；另一方面則直接落在擴散模型、LoRA、ComfyUI 與生成式影音工作流。

對 **AI R&D** 也有高參考價值，尤其是硬體感知規劃、前置檢查、模型元件完整性、執行快取、可重現 manifest 與生成後驗收的組合方式。這些設計不只適用 H3，也能借鑑到其他需要大型本地模型與 Agent 協作的推論工具。

與 **AOI × AI** 的直接關聯較低，因為它不是檢測、分類、分割或製造視覺系統；與 **SillyTavern／AI RPG** 則偏間接，可作為角色、場景或敘事影音素材生成工具，但 Repository 本身沒有針對角色扮演 Runtime 或長期記憶做整合。

## 建議怎麼使用

- `TRY`：若手上有相容的 Windows + NVIDIA 環境，可直接讓 Codex／WorkBuddy 依 Skill 流程檢查既有 ComfyUI，先跑低解析度、短片、`fast` 路線確認完整鏈路，再評估是否值得投入更大模型與高解析度生成。
- `LEARN`：研究它如何把 `SKILL.md`、references、Python 腳本、硬體探測與 ComfyUI API 組成一個「可操作本地模型」的 Agent Skill，特別值得比較一般只寫提示詞／安裝教學的 Skill。
- `REFERENCE`：把元件組原子化、doctor → planner → preflight、熱／冷路徑分離、manifest／anchor 驗收等模式當成其他本地 AI Harness 的設計參考。

## 與其他收藏的關聯

目前不手動建立未驗證的 related-card 連結。這張卡的主要語意鄰近方向是 Agent Skill、ComfyUI、本地生成式影音、低顯存推論與硬體感知工作流，可交由 Knowledge Graph 的分類、Tag 與語意索引建立關係。

## 使用者備註


## 更新紀錄

### 2026-08-26

- 建立 H3 Lite Knowledge Card；來源 resolver 驗證為 `github:rimagination/h3lite`，並依 README、`SKILL.md`、Agent workflow、部署／元件文件與 Repository 中繼資料整理分析。
