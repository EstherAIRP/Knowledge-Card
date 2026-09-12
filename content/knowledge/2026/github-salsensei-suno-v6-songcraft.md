---
schema_version: 1
id: github-salsensei-suno-v6-songcraft
title: Suno v6 Songcraft
canonical_url: https://github.com/SalSensei/suno-v6-songcraft
source:
  type: github
  url: https://github.com/SalSensei/suno-v6-songcraft
  identity: github:salsensei/suno-v6-songcraft
resource_kind:
  ai: skill
  user: null
created_at: 2026-09-12
updated_at: 2026-09-12
last_checked_at: 2026-09-12
summary: Suno v6 Songcraft 是面向 Codex 的音樂創作 Skill，以中文協作、英文音樂指令與可選語言歌詞協助設計 Suno v6 提示；它結合官方證據分級、MusicBrainz 曲風索引、音樂研究檔案與 Python 驗證工具，把曲風研究、歌詞共創、提示編譯與文字約束檢查整理成可重複流程，但不會自動操作 Suno 或生成音訊。
classification:
  categories:
    ai:
      - Agent
      - General Tools
    user: null
  tags:
    ai:
      - agent-skill
      - Codex
      - Suno v6
      - songwriting
      - music-generation
      - prompt-engineering
      - multilingual-lyrics
      - MusicBrainz
      - evidence-aware
      - genre-research
      - constraint-validation
    user: null
relevance:
  ai:
    overall: 4
    ai_rd: 4
    aoi_ai: 1
    llm_agent: 5
    sillytavern_ai_rpg: 2
    image_gen: 2
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

# Suno v6 Songcraft

## 一句話介紹

Suno v6 Songcraft 是一套給 Codex 載入的音樂創作 Skill，將使用者的創作意圖整理成具證據邊界的 Suno v6 音樂提示與歌詞協作流程；它負責研究、討論、撰寫與檢查文字，不會代替使用者操作 Suno 或直接生成音訊。

## 它解決什麼問題

生成式音樂提示很容易把三種不同性質的資訊混在一起：官方產品能力、音樂創作方法，以及尚未驗證的提示技巧。當需求涉及陌生曲風、地域音樂或多語歌詞時，模型也容易只靠名稱聯想，進一步把概括性的音樂知識誤當成特定曲風規則或 Suno 已支援能力。

Suno v6 Songcraft 的做法，是把「創作協作」與「證據管理」綁在同一個 Skill。它會先釐清作品需求與審美方向，再依需要查閱官方產品資料、曲風研究與語言資料，最後才編譯成可貼入 Suno 的文字。對既有歌詞則預設逐字保留，降低多輪修改時不必要的文字漂移。

## 核心概念

- **證據分級**：將 Suno 相關資訊區分為 v6 官方證據、一般官方資訊、創作方法與實驗性建議，避免把工作方法或推測描述成產品保證。
- **先研究再下判斷**：以 MusicBrainz 目錄作為曲風探索入口，再依實際需求導向研究檔案；未充分研究的項目會保留為需要補查，而不是用相似名稱直接套用。
- **自適應共創**：流程不是固定問卷，而是根據已有簡報、歌詞、曲風、語言與使用模式，只追問會實質改變作品的關鍵決策。
- **推理文字與可貼用內容分離**：中文說明、來源與設定建議留在可貼用欄位之外，最後交付的是整理完成的音樂指令與歌詞內容。
- **軟性創作規則搭配硬性檢查**：創意與審美由 Skill 引導；可機械驗證的字數、欄位限制與鎖定歌詞則交給 Python 工具檢查。
- **不把 Agent 變成自動化操作者**：Skill 明確限制自身只處理文字與研究，不會上傳素材、花費點數、發布作品或自行操作 Suno。

## 架構與技術

主要結構可以概括為：

```text
$suno-v6-songcraft
→ SKILL.md
→ references/
   ├── official-rules.md
   ├── workflows.md
   ├── delivery.md
   ├── lyrics.md / languages.md
   ├── fusion.md / music-research.md
   └── music/*.md + genre-index.json
→ scripts/songcraft.py
   ├── search
   ├── audit
   └── check
→ tests/
   ├── test_tools.py
   ├── scenarios.json
   └── acceptance.json
→ 可貼入 Suno 的文字成果
```

Repository 的主要交付物是 `SKILL.md` 與其 references，因此屬於 `skill`，不是獨立音樂生成應用程式。安裝方式是把完整 Repository 放入 Codex skills 目錄，之後以 `$suno-v6-songcraft` 呼叫。

Python 3 僅用於選配的本機搜尋與驗證工具，`scripts/songcraft.py` 使用標準函式庫即可執行。網路連線不是基本文字流程的硬需求，但若要確認最新 Suno 官方規則、陌生曲風或語言資料，Skill 會要求重新查證並保留無法驗證的部分。

## 主要功能

- 從概念、角色、標題、hook、意象與歌曲結構開始共創，也能逐行修改既有歌詞。
- 依節奏、音高／和聲系統、樂器角色、唱法、段落發展與轉場設計編曲方向與曲風融合。
- 對陌生音樂傳統或語言先做針對性研究，而不是把索引中的名稱直接視為 Suno 已支援標籤。
- 依需求輸出 Simple Mode 指令，或分開整理 Styles、Lyrics、Exclude 等欄位。
- 規劃 Cover、Extend、局部修改與依試聽回饋迭代的文字策略。
- 預設逐字保留使用者既有歌詞，包括標點、換行與 Unicode 正規化差異。
- 依簡報與作品語言提供 Song Title 建議，並保留已確認的標題。
- 透過 `search`、`audit`、`check` 三個工具搜尋曲風、稽核研究覆蓋與驗證文字約束。

## 技術亮點

### 把「我知道」與「來源證明」拆開

`official-rules.md` 不只是整理 Suno 文件，而是替產品資訊標示適用層級與日期。官方能力、歷史文件、創作方法及實驗性技巧不會被混成同一種確定性，這是一種很適合 Agent Skill 的認知邊界設計。

### 大型曲風索引採取「可搜尋，但不假裝都懂」

2026-09-11 的快照保留 2,196 個 MusicBrainz 基線項目，其中 220 個已連到創作研究檔案，1,976 個明確標示為需要針對性研究；另有 18 個家族／地域／用途研究檔案與 258 張創作卡。專案明確強調這些數量不等於專家級研究，也不代表 Suno 支援所有名稱。

這比把數千個曲風標籤直接塞入提示詞更保守：索引負責「找到要研究什麼」，研究檔案才負責「目前能說到什麼程度」。

### 將可確定的約束交給程式驗證

`scripts/songcraft.py check` 會以 Unicode code point 計算欄位長度，並能逐字比對鎖定歌詞。Styles 的 1,000 字元上限在專案中被明確標示為 Skill 自身要求，而不是冒充 Suno 官方已驗證限制。

### 不只測工具，也測多輪協作行為

公開驗證資料包含 15 項工具測試、36 個首輪情境，以及多輪歌詞修訂案例。後者會鎖定非目標段落，再檢查修改是否只發生在指定區域，讓「不要亂改使用者文字」不只停留在提示詞聲明。

## 限制與風險

- **沒有真實 Suno 生成與音訊驗證**：目前驗證的是來源、文字流程、工具與模擬互動，沒有用實際生成成品做聽感對照，因此不能把提示結果視為音色、節拍、聲線、咬字或編曲的保證。
- **語言與文化研究不是母語或傳承人認證**：專案採取一致的研究流程，但沒有宣稱所有語言具母語能力，也沒有文化傳承人審查。
- **長尾曲風仍大量需要補研**：2,196 個基線項目中有 1,976 個仍標示為需要針對性研究，索引覆蓋廣度不等於研究深度。
- **產品資訊會快速老化**：官方規則快照核驗日期為 2026-09-11；Suno 的方案、模型、介面或欄位行為改變後，相關結論需要重新確認。
- **提示詞不是正式控制語法**：專案本身也指出，目前官方資料並未證明固定 tag 順序、權重語法、精確 BPM／調性／拍號控制或方括號標記具有保證性的解析語意。
- **專案非常新**：GitHub Repository 建立於 2026-09-11，仍缺乏長期使用、版本演進與社群採用的觀察資料。
- **授權不明確**：目前 GitHub metadata 沒有標示 license，Repository 也沒有 `LICENSE` 檔；若要複製、修改或再散布其內容，應先確認作者授權。

## 與你的相關性

依公開技術 Profile，這個專案與 **LLM／Agent** 的相關性最高。它直接展示了如何把一個高度主觀的創作任務拆成 Skill 核心流程、按需載入的研究資料、明確證據層級，以及可執行的驗證工具，因此 `llm_agent` 評為 5。

對 **AI R&D** 也有高度參考價值。它把資料索引、研究覆蓋狀態、認知不確定性、情境測試與 deterministic validator 放進同一套 Agent workflow，適合研究「哪些事情交給模型判斷、哪些事情交給程式保證」，因此評為 4。

對 **AOI × AI** 幾乎沒有直接技術關聯，沒有影像檢測、OCR、分類或製造應用，因此評為 1。

對 **SillyTavern／AI RPG** 有少量間接價值：多輪共創、保留既有文字、鎖定局部修改與研究後再生成的做法，可以轉用到敘事或角色內容工作流，但它本身沒有角色記憶、世界狀態或角色扮演系統，因此評為 2。

對 **Image Generation** 也只有方法層的間接關聯。提示編譯、風格研究、證據邊界與文字約束的設計可供其他生成式創作工具參考，但專案不處理圖片模型或影像生成流程，因此評為 2。

整體評為 4：它不是公開 Profile 的核心音樂領域工具，但作為「如何把專業創作知識封裝成可靠 Agent Skill」的案例，技術結構值得直接拆解。

## 建議怎麼使用

- **TRY**：可以直接安裝後用一個具體音樂簡報測試，尤其適合觀察「陌生曲風研究 → 方向比較 → 完整提示 → 多輪局部改詞」這條流程是否真的能穩定保留已確認內容。
- **LEARN**：優先閱讀 `SKILL.md`、`references/official-rules.md`、`references/music-research.md`、`scripts/songcraft.py` 與測試資料，理解它如何把創意判斷、證據分級、資料檢索與程式驗證切成不同責任。
- **REFERENCE**：可把它當成領域型 Agent Skill 的設計範例，尤其適合參考「大量知識不全部塞進主提示」、「不確定性顯式化」以及「軟性創作規則＋硬性 validator」的組合方式。

若要把它的檔案直接複製進其他公開專案，應先釐清目前未標示的授權條款。

## 與其他收藏的關聯

- [Skills For Real Engineers](./github-mattpocock-skills.md)：兩者都是疊加在 Codex 等 Agent Host 上的 Skill layer。Skills For Real Engineers 偏向通用軟體工程流程；Suno v6 Songcraft 則示範如何把單一創作領域的研究資料、證據管理與驗證工具組合成專用 Skill。
- [Diagram Design](./github-cathrynlavery-diagram-design.md)：兩者都採用核心 Skill + references + 可執行檢查的分層方式。Diagram Design 將視覺設計品質工程化；Suno v6 Songcraft 則將音樂提示、歌詞共創與研究證據邊界工程化。

## 使用者備註

## 更新紀錄

### 2026-09-12

- 首次收錄 Suno v6 Songcraft。
- 依 README、`SKILL.md`、官方規則證據表、音樂研究流程、`songcraft.py`、測試與驗證報告整理其架構與限制。
- 記錄目前未提供明確 Repository 授權，以及尚未進行真實 Suno 音訊生成驗證。
