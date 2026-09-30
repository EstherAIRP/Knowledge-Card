---
schema_version: 1
id: github-liccabobo-prompt-universe
title: "Prompt Universe：把影像提示詞當成程式碼管理的 Lisp DSL"
canonical_url: https://github.com/liccabobo/prompt-universe
source:
  type: github
  url: https://github.com/liccabobo/prompt-universe
  identity: github:liccabobo/prompt-universe
resource_kind:
  ai: project
  user: null
navigation:
  categories:
    ai:
      - Image Creation / Design
    user: null
created_at: 2026-09-30
updated_at: 2026-09-30
last_checked_at: 2026-09-30
summary: Prompt Universe 是一套以 Common Lisp DSL 將影像提示詞結構化、審查、編譯、批次變體與發佈的 prompt-as-code 工具鏈；透過人工核准關卡、唯讀 seed、變體軸驗證與 Git 追蹤，把提示詞從一次性文字轉成可版本化資產。
classification:
  categories:
    ai:
      - Image Generation
      - Agent
    user: null
  tags:
    ai:
      - prompt-as-code
      - Common-Lisp
      - SBCL
      - prompt-DSL
      - prompt-versioning
      - human-in-the-loop
      - variant-generation
      - prompt-compiler
      - image-prompt
    user: null
relevance:
  ai:
    overall: 4
    ai_rd: 3
    aoi_ai: 1
    llm_agent: 3
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

# Prompt Universe：把影像提示詞當成程式碼管理的 Lisp DSL

## 一句話介紹

Prompt Universe 把影像生成提示詞從「聊天框裡的一段文字」改造成可編譯、可驗證、可審查、可批次產生變體、也可透過 Git 版本控制的結構化資產。

它的核心不是提供另一批現成 prompt，而是提出一套 **prompt-as-code** 工作方式：先用 Common Lisp DSL 描述提示詞的結構與可變部分，經過人工確認，再由編譯器輸出 Markdown；需要延伸系列作品時，再透過明確的變體軸產生真正有語意差異的版本。

## 它解決什麼問題

一般提示詞工作流很容易退化成複製貼上：某次生成結果不錯，就把整段文字留下來；下一次想換角色、色系或場景，再從舊版本手動修改。時間一久會出現幾個典型問題：

- 難以知道哪一版才是經過確認的 canonical 版本。
- 變更沒有清楚的 diff，很難追蹤某次修改到底改了什麼。
- 「做十個變體」常變成十個近義改寫，而不是十個真正不同的創作方向。
- 可重用的角色、材質、構圖、限制條件與方法會散落在大量長文字裡。
- AI 容易直接輸出最終結果，跳過結構審查與人工確認。

Prompt Universe 的做法是把這些問題改寫成軟體工程問題：提示詞有 DSL、編譯器、驗證器、生命週期目錄、發佈流程與版本控制；AI 則被放在「提出結構」的位置，而不是直接成為不受約束的最終文字產生器。

## 核心概念

### Prompt-as-code

提示詞先以 Lisp 結構表示，再由編譯器轉成最終 Markdown。專案目前提供的 DSL 元件包含：

- `defprompt`：定義提示詞。
- `defmodule` / `use-module`：抽取可重用模組。
- `defmethod` / `use-method`：封裝可重用方法。
- `defexpansion-plan`：定義批次變體計畫。
- `defevolution`：描述演化／變異規則。
- `defcomposition-tree`：表達構圖樹。
- `defseed-control`：管理 seed 與變體控制邏輯。

這讓「色系」「構圖」「配件」「禁止事項」不再只是長段落裡的自然語言，而可以保留明確的結構邊界。

### 人工確認是工作流的一部分

專案的 `agents.md` 明確要求 AI 不應在第一步直接輸出完整提示詞。一般創作流程先做語意解析與 Lisp 提案，經使用者確認後才編譯；canonical 版本再次確認後，才進入批次變體。

也就是說，human-in-the-loop 不是 UI 上的一個選項，而是被寫進 Agent 操作契約與檔案生命週期。

### 變體必須改變語意前提

Prompt Universe 特別處理「十個變體其實只是換形容詞」的問題。每個 expansion plan 預設至少要求變更：

1. `:color-theme`：色彩方向。
2. `:theme-anchor`：主題錨點／場景前提。
3. `:accessory-set`：與主題一致的配件群。

`batch-generate` 會在真正輸出變體前檢查這些 required axes；未通過就拒絕整批生成。這使「變體距離」從寫作偏好變成可驗證規則。

### Seed、草稿、核准版與發佈版分層

專案把提示詞生命週期拆成不同目錄：

~~~text
illustration/seeds/       唯讀 curated seed
output/lisp-drafts/       AI / 人工撰寫的 DSL 草稿
output/candidates/        待審查編譯結果
output/approved/          已確認 canonical
output/variants/          批次變體工作區
output/publish/           可由 Git 追蹤的正式發佈批次
output/reports/           驗證與批次報告
output/logs/              核准紀錄
~~~

其中 `illustration/seeds/` 被視為唯讀資料；AI 不得自行修改。工作中的 candidates、approved 與 variants 預設留在本機，只有使用者明確發佈後才進入 `output/publish/`。

## 架構與技術

專案主要以 **Common Lisp + SBCL** 實作，`prompt-universe.asd` 將系統拆成幾個層次：

- `lisp/core/`：AST、schema、formatter、compiler、seed loader、composition 等核心。
- `lisp/validator/`：schema 驗證與 responsible prompt 檢查。
- `lisp/generator/`：mutation、variant controller、expansion、batch、publish、evolve 等生成流程。
- `lisp/modules/`：可重用的 identity / constraint 模組。
- `lisp/methods/`：材質覆寫、negative space、降噪與 fusion evolution 等方法。
- `lisp/generator/plans/`：實際的 expansion plan。
- `scripts/`：用 `sbcl --script` 執行常用流程，避免使用者直接操作 REPL。

編譯器本身的路徑很直接：

~~~text
Lisp prompt structure
        ↓
validate-prompt
  ├─ schema validation
  └─ responsible validation
        ↓
render-prompt
        ↓
candidate / approved / variant markdown
~~~

`compile-prompt%` 會先執行 `validate-prompt`；驗證失敗就直接中止，不會產生最終輸出。

批次流程則在生成前呼叫 `validate-expansion-plan-mutations`，確認 expansion plan 滿足有效的變體軸規格，再套用 mutation 與 variant controller，最後逐一編譯並產生 batch report。

## 主要功能

- **結構化提示詞 DSL**：用 Lisp 定義 prompt、module、method、composition 與變體規則。
- **Seed 編譯**：可把 curated seed 編譯成結構一致的 Markdown。
- **草稿與核准流程**：AI 可先產生 Lisp draft，再編譯 candidate，使用者確認後升格成 approved canonical。
- **批次變體**：用 expansion plan 產生多個變體，預設數量由 `config/variant-controller.lisp` 控制。
- **變體距離驗證**：要求 palette、theme anchor、accessory 等關鍵軸真正改變。
- **變體控制器**：可調整 `:color-shift`、`:scene-shift`、`:accessory-shift`、`:evolution-fusion`、`:material-accent`、`:leap-creativity` 等行為。
- **提示詞驗證**：編譯前執行 schema 與 responsible prompt 檢查。
- **發佈生命週期**：把本機 `output/variants/` 中人工審核過的批次移到 Git 可追蹤的 `output/publish/`，並可產生 manifest。
- **Agent 操作契約**：透過 `agents.md` 規範 AI 先提出結構、等待確認、再編譯與批次延伸。

## 技術亮點

### 把提示詞版本管理提升到「原始碼」層

多數提示詞工具管理的是最終文字；Prompt Universe 管理的是產生最終文字的結構。這代表 diff 可以發生在 module、method、參數與 mutation 上，而不是只能比較兩段很長的 Markdown。

對系列圖像或長期維護的 prompt library，這種方法比單純收藏最終 prompt 更容易理解修改原因，也比較適合審查與重用。

### AI 與確定性工具鏈的責任分離

AI 負責理解需求、提出 Lisp 結構與創意變體；編譯、schema 檢查、required axes、檔案路徑與發佈生命週期則交給確定性程式控制。

這個分工很值得參考：不要求模型「自己記得所有規則」，而是把可以程式化保證的部分下沉到 compiler / validator。

### 把「創意差異」轉成可驗證約束

`:color-theme`、`:theme-anchor`、`:accessory-set` 這類 semantic axes 不是傳統程式 schema 常見的欄位，但它們很適合處理生成式內容的品質問題。

它示範了一種中間做法：不試圖用程式評分整張圖的創意品質，而是先驗證每個變體是否至少改變了應該改變的語意維度。

### 發佈與工作區分離

`output/variants/` 是 gitignored 的工作區，`output/publish/` 才是正式分享區。這和軟體工程中的 build artifact / release artifact 概念相似，可以避免大量試驗版本直接污染公開歷史。

## 限制與風險

### 授權限制非常明確

Prompt Universe 使用自訂的 **Fan & Personal Non-Commercial License v1.1**，不是 MIT、Apache、GPL 或其他一般開源授權。

個人、粉絲與非商業用途可以使用、修改與分享；但未經額外書面授權，不得用於付費服務、SaaS、客戶案、營利公司的製作流程，或販售基於專案 seed / plan 的 prompt pack。

因此它很適合研究與個人創作，但若要整合進商業產品或公司正式工作流，不能只把它當成一般可自由採用的開源元件。

### 工具鏈仍有尚未完成的部分

專案的 implementation status 明確列出幾個長期項目尚未完成：

- `defprompt-chain`。
- Markdown ↔ Lisp 雙向轉換。
- ASDF test system / CI。
- 完整的 responsible validator 名人／品牌資料庫。

因此目前已具備 compiler、batch、publish 與部分 higher macro layer，但還不是一套完整的 prompt IDE 或成熟 CI 型資產系統。

### Common Lisp 提高採用門檻

選擇 Lisp 的好處是 AST、macro 與 DSL 很自然，但代價是團隊必須接受 SBCL 與 S-expression 工作方式。對只想快速改幾段 prompt 的使用者，這套流程會明顯比一般 Prompt Manager 重。

### Responsible validator 不能視為法律或平台保證

目前程式已經有 responsible validation 層，但專案自己也說完整名人／品牌資料庫尚未完成。即使驗證器通過，生成內容是否涉及第三方權利、平台規則或真實人物風險仍需要人工判斷。

### GitHub 可能不是唯一上游

GitHub Repository 的 README 內，clone 指令與作者連結都指向 GitLab 的 `bobo-ai/prompt-universe`。GitHub metadata 顯示此鏡像最近一次程式碼 push 是 2026-07-16，而 README／implementation status 也以 2026 年 6–7 月的內容為主。

若要追蹤最即時的專案狀態，應另外確認 GitLab 上游是否存在更新；不能只以 GitHub activity 判斷整個專案是否仍在開發。

## 與你的相關性

依公開技術背景，這個專案與 **AI Image Generation** 的關聯最高。它不是新的生圖模型，而是處理提示詞資產的結構、版本、變體與審查流程，對建立可重現、可維護的影像生成工作流很有參考價值。

對 **LLM／Agent** 也有明顯的架構價值：`agents.md` 把「AI 先提案、人工確認、確定性工具再執行」寫成操作契約，示範如何讓 Agent 參與創作又不完全掌控最後輸出。這類人機協作模式可延伸到其他需要審批與版本管理的 Agent workflow。

對 **AI R&D** 的價值主要不在模型研究，而在生成式系統工程：DSL、編譯器、validator、可追蹤變體與人工核准關卡，都是把不穩定自然語言流程工程化的實例。

它與 AOI × AI 沒有直接應用關係；SillyTavern／AI RPG 也不是目前專案目標，但「結構化 prompt → canonical → controlled variants」這個抽象仍可作為其他生成式內容系統的設計參考。

## 建議怎麼使用

### TRY

如果想判斷 prompt-as-code 是否真的比一般 prompt manager 更適合長期創作，可以直接用內建 seed 跑一次完整生命週期：

~~~bash
sbcl --script scripts/compile-seed.lisp prop-design/GOLDEN-MANGO-JELLY
sbcl --script scripts/batch-generate.lisp dessert-jelly-flavor-10
~~~

重點不是看最終文字漂不漂亮，而是觀察「結構 → 審查 → canonical → variants」是否讓修改原因與系列差異更容易管理。

### LEARN

最值得深入看的程式區域是：

- `lisp/core/compiler.lisp`：驗證與編譯邊界。
- `lisp/generator/batch.lisp`：批次變體與報告流程。
- `docs/rules/variant-expansion-axes.md`：如何把創意差異轉成 semantic constraints。
- `agents.md`：如何把人工核准關卡寫入 Agent 操作規則。

這四個部分組合起來，幾乎就是這個專案最有辨識度的設計。

### REFERENCE

若未來要設計自己的影像 prompt library、Agent-assisted creative tool 或生成資產管理系統，可以優先借鏡它的架構，而不是直接複製實作：

~~~text
structured source
→ deterministic validation
→ human approval
→ canonical artifact
→ controlled variation
→ reviewed publish
~~~

這個模式比「模型一次吐出完整結果」更容易除錯，也更適合長期維護。

## 與其他收藏的關聯

- [prompt_fairy｜胖譜小精靈](./github-promptfairy-prompt-fairy.md)：同樣把影像提示詞視為需要長期管理的資產；prompt_fairy 偏向本機 PWA、角色卡與片段管理，Prompt Universe 則偏向 DSL、compiler、Git 與批次變體。
- [ComfyUI-QwenImage-PhotoStyles：Qwen-Image-2.1 攝影風格提示詞重寫節點](./github-pottokao-dotcom-comfyui-qwenimage-photostyles.md)：兩者都把 prompt engineering 從單段文字拆成可重用規格；前者著重 Lisp DSL 與版本生命週期，後者著重風格資料層、LLM rewrite 與 ComfyUI 工作流。

## 使用者備註

## 更新紀錄

### 2026-09-30

- 建立 Knowledge Card。
- 記錄 prompt-as-code、Lisp DSL、人工核准、變體軸驗證、prompt compiler 與 publish 生命週期。
- 補充自訂非商用授權、未完成能力、Common Lisp 採用門檻與 GitHub／GitLab 上游狀態風險。
