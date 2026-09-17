---
schema_version: 1
id: github-dreambigou-eli5
title: ELI5 — Explain Like I Am 5
canonical_url: https://github.com/dreambigou/eli5
source:
  type: github
  url: https://github.com/dreambigou/eli5
  identity: github:dreambigou/eli5
resource_kind:
  ai: skill
  user: null
navigation:
  categories:
    ai:
      - Writing / Documentation
      - Agent / Harness
    user: null
created_at: 2026-09-17
updated_at: 2026-09-17
last_checked_at: 2026-09-17
summary: ELI5 是一個 Claude Code Skill，會先辨識說明對象，再依年齡、教育程度、職務或關係調整詞彙、比喻、語氣、深度與問題 framing；專案另外提供 Python 評測工具，能把啟用 Skill 與 baseline 輸出依預先定義的 assertions 做 A/B 比較與自動評分。
classification:
  categories:
    ai:
      - LLM
      - Agent
      - AI Coding / DevTools
      - General Tools
    user: null
  tags:
    ai:
      - Claude Code
      - agent skill
      - ELI5
      - audience adaptation
      - explanation
      - prompt engineering
      - communication
      - A/B evaluation
      - LLM evaluation
      - SKILL.md
    user: null
relevance:
  ai:
    overall: 4
    ai_rd: 3
    aoi_ai: 1
    llm_agent: 4
    sillytavern_ai_rpg: 3
    image_gen: 1
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

# ELI5 — Explain Like I Am 5

## 一句話介紹

ELI5 是一個給 Claude Code 使用的受眾調適 Skill：它不是單純把文字「講簡單一點」，而是先判斷解釋對象，再系統性調整詞彙、比喻、語氣、資訊深度與 framing，讓同一個技術概念能分別講給孩子、學生、工程師、主管、設計師或家人理解。

## 它解決什麼問題

一般的「ELI5」提示通常只告訴模型降低難度，但「簡單」並不是固定尺度。五歲小孩、國中生、主管與工程師所需要的資訊並不相同；若只統一換成較淺的詞彙，常會出現兩種問題：對非技術受眾仍然太技術，或對專業受眾反而顯得過度簡化。

ELI5 的做法是把「受眾」提升成明確的路由條件。Skill 將對象分成年齡、教育程度、職務與關係四類，並為每一類定義適合的說明方式。例如主管優先關心影響、時程、風險與成本；工程師則偏向架構、實作與取捨；孩子使用較具體的日常比喻與短句。若使用者沒有指定對象，則預設採典型的五歲孩童版本。

它也把說明流程固定下來：先理解真正要解釋的來源，再用「這是什麼 → 類比 → 補充細節 → 為什麼重要」的結構輸出，而不是一開始就直接改寫表面文字。

## 核心概念

這個 Skill 可以拆成三個核心層次。

第一層是 **受眾辨識**。`SKILL.md` 會從使用者措辭判斷對象，例如「explain this to my manager」、「for a 5th grader」、「tell my mom」或「simplify this for a designer」。觸發條件設計得相當寬，不要求使用者一定輸入 `ELI5` 關鍵字。

第二層是 **說明校準**。專案把校準維度明確拆成：

- 詞彙：術語密度與是否需要立即定義。
- 比喻：選擇受眾熟悉的生活、工作或專業情境。
- 語氣：從兒童式活潑到專業、商務或家庭式對話。
- 深度：控制抽象程度、細節量、取捨與邊界案例。
- Framing：決定從技術機制、使用者體驗、商業影響或策略角度切入。

第三層是 **來源理解優先**。Skill 明確要求在解釋程式碼、錯誤訊息、技術文件或其他素材前，先理解內容真正的用途與原因。對程式碼尤其強調先說「為什麼存在」，再說語法與機制。

## 架構與技術

Repository 的主要交付物是 `skills/eli5/SKILL.md`，因此資源型態判定為 `skill`，而不是獨立應用程式或函式庫。安裝方式是把 `skills/eli5` 複製到 Claude Code 的 `~/.claude/skills/eli5` 目錄，再透過自然語言觸發。

Skill 本體幾乎全部是 Markdown instruction，沒有額外 runtime。`SKILL.md` 主要包含：

- YAML frontmatter：定義 skill 名稱與大範圍觸發描述。
- Audience routing：依年齡、教育程度、職務、關係選擇說明策略。
- Source-reading rules：先讀懂程式碼、概念、錯誤或技術文件。
- Explanation structure：先說核心，再類比、逐層補充，最後說明對受眾的意義。
- Language calibration：分別規範簡單、技術與商務受眾的詞彙與資訊密度。
- Tone matching：依年齡與角色調整語氣。

Repository 另外有 `eli5-workspace/` 評測區。`run-evals.py` 會呼叫 Claude Code CLI 執行測試案例，可比較已安裝 Skill 與未啟用 Skill 的 baseline，也支援用 `--a`、`--b` 比較兩個 Skill 版本。輸出之後再由 Claude 依每個案例事先定義的 assertions 做 PASS／FAIL 評分，結果寫入逐次 iteration 目錄。

## 主要功能

- **多種受眾路由**：支援年齡、學級、職務與家庭／朋友關係等說明對象。
- **自然語言觸發**：除了 `ELI5`，也會處理「講給主管聽」、「讓五年級學生理解」、「解釋給媽媽聽」等近似意圖。
- **受眾專屬 framing**：主管偏商業影響，設計師偏使用者體驗，工程師偏技術機制與取捨。
- **來源先理解再轉譯**：要求先理解程式碼、錯誤或文件本身，再產生簡化版說明。
- **固定說明結構**：從核心概念、類比、細節到「所以這對你有什麼意義」。
- **Baseline 對照評測**：可比較同一 prompt 在有／無 Skill 情況下的差異。
- **Skill A/B 測試**：評測工具可直接比較兩份不同版本的 `SKILL.md`。
- **Assertion-based grading**：每個測試案例以具體條件評估，例如是否殘留術語、句子是否過長、是否具商業 framing、是否提供行動建議。

## 技術亮點

第一個亮點是 **把「講給誰聽」正式做成 Agent 能力層**。很多提示工程只描述理想輸出風格，例如「簡短、清楚、不要術語」，但 ELI5 把受眾本身建模成 routing signal，再對應到多個輸出維度。這比單純調整 tone 更接近一個小型 communication policy。

第二個亮點是 **受眾校準不是只改詞彙，而是連 framing 一起改**。例如對主管不只是少講程式碼，而是主動改用影響、風險、成本與決策角度；對工程師則反過來保留術語、架構與 trade-off。這種設計可延伸到文件代理、內部知識助理、客服或教學型 Agent。

第三個亮點是 **Repository 不只提供 Skill，還把 Skill evaluation 一起納入**。`run-evals.py` 可以固定測試 prompt、保存每次輸出、比較 baseline、執行 assertion grading，甚至比較兩個 Skill 版本。對 Agent Skill 開發而言，這比只憑人工閱讀判斷「新版好像比較好」更接近可重複的迭代流程。

第四個亮點是 **Skill 與 eval 都維持很低的工程複雜度**。主要能力是一份 `SKILL.md`，評測器則是小型 Python 腳本加 `evals.json`。這使它很適合拿來觀察「一個文字型 Agent Skill 最少需要哪些構件，才能開始做版本化與效果驗證」。

## 限制與風險

第一個限制是 **受眾模板仍是人工設計的 heuristic**。年齡、職務或家庭角色並不能完整代表個人知識背景；例如同樣是「manager」，技術主管與非技術主管的需求可能差異很大。若直接把類別當成固定人格，可能產生過度概括或不合適的類比。

第二個限制是 **目前 Skill 主要綁定 Claude Code 的 skills 目錄與觸發方式**。其 instruction 本身容易移植，但 Repository 沒有提供 Codex、Cursor、Gemini CLI 等其他 Agent Host 的正式 adapter。

第三個限制是 **語言與文化適配不足**。README 將新增非英語支援列為未來改善方向，而現有受眾類比主要以英文語境與一般西方生活情境撰寫；直接套用到其他文化或語言不一定自然。

第四個限制是 **自動評測仍是小樣本，而且 evaluator 與被測模型高度相關**。目前公開評測只有三個主要案例，輸出與 grading 都透過 Claude Code CLI 完成，因此不能把結果視為獨立、外部驗證的 benchmark。若要做更可靠的 Skill 比較，應增加案例數、固定模型版本、加入人工盲評或不同 evaluator。

第五個限制是 **Repository 內的評測摘要目前存在不一致**。README 的示例／Current Results 顯示 With Skill 83.3%、Without Skill 41.6%，而 `eli5-workspace/eval-results.md` 則記錄 91.7% 對 33.3%。這代表數據可能來自不同執行或文件更新不同步；因此這些數字適合視為專案內部實驗結果，不應當成穩定效能宣稱。

## 與你的相關性

依公開技術 Profile，這個專案對 **LLM / Agent** 的相關性最高，因此 `llm_agent` 評為 4。它是一個很小但完整的 Agent Skill 工程案例：從 trigger description、routing、instruction policy 到 baseline／A/B eval 都在同一個 Repository 裡，適合研究如何讓 Agent 能力不只「寫出來」，也能持續測量。

對 **AI R&D** 評為 3。專案本身不是模型訓練或推論框架，但它提供了一個可實作的 prompt／skill evaluation 方法：固定案例、固定 assertions、保留輸出、與 baseline 或另一版本比較。對 AOI × AI 與 Image Generation 沒有直接技術關聯，因此各評為 1。

對 **SillyTavern / AI RPG** 評為 3，原因是受眾與角色導向的語氣、詞彙、深度調整可以作為角色互動、教學型角色或世界觀解說的設計參考；不過專案本身不是角色扮演系統，也沒有處理長期記憶或角色狀態。

整體評為 4：它不是大型框架，但把「可重用 Skill + 可重複 Eval」這個最小閉環做得很清楚，具有直接試用與設計參考價值。

## 建議怎麼使用

- `TRY`：直接安裝到 Claude Code，挑同一個技術主題分別要求解釋給五歲孩童、主管、工程師與設計師，再比較 framing 是否真的隨受眾改變。
- `INTEGRATE`：若有需要輸出操作說明、技術解釋、知識庫摘要或使用者教育內容的 Agent，可以把「受眾辨識 → 詞彙／語氣／深度／framing 校準」拆成獨立能力層，而不是散落在每個 prompt 裡。
- `REFERENCE`：重點閱讀 `SKILL.md`、`evals.json` 與 `run-evals.py` 的搭配方式，作為建立其他 Agent Skill 評測閉環的最小範本。

若要延伸專案，最值得先做的不是增加更多角色名稱，而是把受眾表示從固定類別改成多維條件，例如技術程度、決策權限、領域知識、閱讀目的與期望長度，再用較大的 eval set 驗證每一個維度是否真的改變輸出。

## 與其他收藏的關聯

- [ISO 24495 Skill](./github-danyuchn-iso-24495-skill.md)：兩者都處理「讓人更容易理解」的 Agent Skill，但 ISO 24495 Skill 以 plain language 與資訊可用性為核心，ELI5 則更聚焦在依受眾身分動態切換詞彙、類比、深度與 framing。兩者可視為「內容清晰度」與「受眾適配」的互補層。
- [Agent Skills](./github-addyosmani-agent-skills.md)：Agent Skills 展示較大型、跨開發生命週期的 Skill packaging 與 routing；ELI5 則是單一能力、單一 `SKILL.md` 搭配小型 eval harness 的最小案例，適合比較 Skill 規模擴張前後需要增加哪些結構與治理。

## 使用者備註


## 更新紀錄

### 2026-09-17

- 首次收錄 ELI5，整理其受眾路由、說明校準策略、Claude Code Skill 架構、baseline／A/B 評測流程，以及目前評測摘要不一致的限制。
