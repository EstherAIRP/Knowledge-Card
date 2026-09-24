---
schema_version: 1
id: github-multimodal-art-projection-yue
title: YuE2：以符號規劃實現可編輯音樂生成與 Agent 音樂編輯
canonical_url: https://github.com/multimodal-art-projection/YuE
source:
  type: github
  url: https://github.com/multimodal-art-projection/YuE
  identity: github:multimodal-art-projection/yue
resource_kind:
  ai: project
  user: null
navigation:
  categories:
    ai:
      - Audio / Music / Speech
      - Agent / Harness
    user: null
created_at: 2026-09-24
updated_at: 2026-09-24
last_checked_at: 2026-09-24
summary: YuE2 是開放權重的長篇歌曲生成專案，將歌詞與風格先轉成可讀、可編輯的 ABC 旋律與和弦規劃，再經語意生成、flow matching 與 VAE 合成 48 kHz 立體聲音訊；同一模型支援從零創作、零樣本翻唱與以 Agent 編輯樂譜後重新生成，並附帶 yue2-music Agent skill。
classification:
  categories:
    ai:
      - AI / ML
      - Agent
    user: null
  tags:
    ai:
      - music-generation
      - symbolic-planning
      - ABC-notation
      - audio-generation
      - flow-matching
      - agentic-editing
      - zero-shot-cover
      - YuE2
    user: null
relevance:
  ai:
    overall: 4
    ai_rd: 5
    aoi_ai: 1
    llm_agent: 3
    sillytavern_ai_rpg: 1
    image_gen: 1
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

# YuE2：以符號規劃實現可編輯音樂生成與 Agent 音樂編輯

## 一句話介紹

YuE2 是一套以「先產生可編輯樂譜，再合成完整歌曲」為核心的開放音樂生成系統：輸入歌詞與風格後，模型可先規劃 ABC 格式的旋律與和弦，再生成語意音樂表示、聲學潛在表示與最終 48 kHz 立體聲音訊；同一條管線也能用於翻唱與 Agent 輔助的樂譜編輯。

## 它解決什麼問題

一般文字到歌曲系統通常把「作曲決策」藏在端到端生成過程中，使用者很難在音訊生成前檢查或修改旋律、和聲與曲式。YuE2 將中間的符號音樂計畫暴露出來，讓人或 Agent 可以先讀取、保存與編輯，再以修改後的樂譜重新生成完整錄音。

這使它不只是文字到音樂模型，也是一個把「作曲規劃」與「音訊實現」分離的可控制工作流，特別適合需要可重現比較、翻唱、重配和聲或多輪修改的情境。

## 核心概念

- **符號規劃（symbolic planning）**：`cot="full"` 會規劃旋律與和弦，`cot="melody"` 只規劃旋律，`cot="off"` 則跳過符號計畫直接生成。
- **ABC 作為白盒控制介面**：生成出的 `score.abc` 可以在音訊合成前檢查、保存或修改；修改後以新的 `abc` 輸入再次生成。
- **同一生成 checkpoint 支援多種任務**：從零創作、以轉譜結果做零樣本翻唱，以及針對旋律、和聲、速度、曲式、歌詞等進行 Agent 輔助編輯。
- **分階段 API**：官方介面把流程拆成 `plan()` → `generate_semantic()` → `synthesize()` → `decode()`，因此能保存中間產物並重用相同計畫或潛在表示做比較。

## 架構與技術

YuE2 使用單一 **AR–NAR Mixture-of-Transformers** 主幹：先自回歸預測符號樂譜與語意音樂 token，再以 flow matching 產生聲學 latent，最後由 VAE 解碼成 48 kHz 立體聲音訊。

官方 Python 套件為 `yue2-infer`，核心依賴包含 PyTorch、Transformers、Hugging Face Hub、Accelerate 與 SoundFile；目前文件建議使用 Linux、Python 3.12、支援 BF16 的 NVIDIA GPU，以及約 24 GB VRAM，基準設定以一次一個請求為主。

輸出可保存 `audio.flac`、`score.abc`、`plan.json`、語意 token、`latent.npy`、有效設定、執行時間、模型識別與完整性紀錄。這些產物讓生成結果較容易被稽核、重跑與做 before/after 比較。

## 主要功能

- **文字到完整歌曲**：以歌詞與風格描述生成含人聲與伴奏的完整歌曲。
- **可編輯旋律／和聲規劃**：先產生 ABC 樂譜，再人工或程式化修改後重新生成。
- **零樣本翻唱**：可搭配 SheetSage2 將來源音訊轉成樂譜，再以 `cot="melody"` 或完整樂譜條件重建不同風格的版本。
- **Agent 音樂編輯**：Repository 內附 `skills/yue2-music/`，可讓支援 `SKILL.md` 的 Agent 執行生成、轉譜、改譜、限制條件檢查與試聽比較。
- **CLI 與 Python API**：既能透過 `yue2 generate` 使用，也能直接使用 `YuE2Pipeline`，並可拆開規劃、語意生成、聲學合成與解碼階段。

## 技術亮點

最值得研究的不是單一音質分數，而是 **將中間作曲計畫變成可操作介面**。這讓生成式音樂具備類似結構化中間表示的控制方式：Agent 不需要直接修改 waveform，而是修改 ABC 樂譜，再交由模型重新實現成音訊。

官方 WildSongBench 在 2026-09-12 的 192 個提示、17 個設定比較中，標準 YuE2 的 SongBench Avg 為 6.7316；best-of-8 設定為 6.9632。官方文件同時明確提醒：best-of-8 使用額外候選選擇流程，這些自動評估結果不代表普遍的人類偏好，也不能把不同指標上的差異解讀成全面優勢。

翻唱評估則顯示符號條件的重要性：在 948 個 SHS100K 作品、每種方法 3,792 個輸出的設定下，完整樂譜條件的 CLEWS mAP 為 0.647，移除樂譜後為 0.006。這支持「顯式樂譜是作品身分保留的重要控制訊號」這個設計方向，但不代表能保存原始歌手音色或 waveform。

## 限制與風險

- **硬體門檻高**：官方基準起點是 BF16 NVIDIA GPU 與 24 GB VRAM，並以一次一個請求為主；長歌曲生成仍屬高成本推論工作負載。
- **編輯是重新生成，不是局部音訊修補**：改 ABC、風格或歌詞後會重新產生完整錄音；官方 skill 明確指出沒有音訊參考、音素對齊或局部 inpainting 介面。
- **benchmark 要注意候選選擇與解碼器差異**：標準、best-of-8、比較系統的候選選擇策略並不完全相同；重現報告分數還需要使用指定的 `YuE2-Vae-legacy`，而日常試聽預設是 `YuE2-Vae`。
- **程式碼與模型權重授權不同**：程式碼、文件與 Agent skill 為 Apache 2.0；模型權重為 CC BY-NC 4.0 加附加 creator permission。README 表示個人使用者、內容創作者與音樂人可使用並營利生成內容，但公司商業使用模型權重需聯絡作者討論商業授權，因此不能把 Apache 2.0 誤套到模型本身。
- **翻唱仍有著作權與身分風險**：技術上能以來源旋律做重製不代表具備使用該作品、錄音、歌詞或演唱身分的法律權利；實際公開或商業使用仍需自行確認權利範圍。

## 與你的相關性

依公開技術背景來看，YuE2 對 **AI R&D** 的價值很高：它提供了一個清楚的「結構化規劃 → 生成 → 可驗證中間產物」案例，可用來研究生成模型如何暴露可編輯控制層、如何保存生成 provenance，以及如何讓 Agent 操作結構化中間表示，而不是只對黑盒模型反覆提示。

它與 **LLM／Agent** 的相關性屬中等：專案本身不是通用 Agent 框架，但 `yue2-music` skill 已把生成、轉譜、樂譜修改、約束檢查與比較流程整理成可供 Agent 執行的工作規格，適合參考「專門領域模型 + Agent skill」的整合方式。

它與 AOI × AI、SillyTavern／AI RPG、影像生成沒有直接核心關係，因此不應因同屬生成式 AI 就高估相關性。

## 建議怎麼使用

- **TRY**：官方提供免安裝的線上試用，可先實際比較 `full`、`melody` 與不同風格生成的差異，再決定是否投入本機環境。
- **LEARN**：優先研究符號規劃、中間產物保存、Agent 編輯約束與 benchmark 候選選擇，這些設計比單純比較最終音質更具可移植性。
- **REFERENCE**：把 `yue2-music` 當成「如何把專門生成模型包裝成 Agent 可安全操作工作流」的參考實例，尤其值得看它如何要求保留 baseline、定義 invariant、比較 before/after 與避免把符號檢查誤說成音訊層保證。

## 與其他收藏的關聯

目前 Repository 中未找到可確認存在、且適合直接互鏈的音樂生成 Knowledge Card，因此本次不預先建立關聯連結。

## 使用者備註


## 更新紀錄

### 2026-09-24

- 建立 Knowledge Card。
- 依 YuE2 主分支 README、生成文件、benchmark 文件、`yue2-music` Agent skill 與模型授權整理符號規劃、生成管線、翻唱／Agent 編輯能力、硬體需求與授權限制。
