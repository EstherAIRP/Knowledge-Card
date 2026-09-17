---
schema_version: 1
id: github-dreambigou-eli5
title: ELI5
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
      - AI Coding / DevTools
    user: null
created_at: 2026-09-17
updated_at: 2026-09-17
last_checked_at: 2026-09-17
summary: ELI5 是一個給 Claude Code 使用的受眾適配 Skill，會依年齡、教育程度、職務角色或關係調整詞彙、比喻、語氣、深度與表達框架；Repository 另外附有 Python 評測工具，以 Skill 與 baseline 對照、逐項 assertion 自動評分，適合作為「溝通風格規則 + 可重複評測」的輕量 Skill engineering 範例。
classification:
  categories:
    ai:
      - Agent
      - AI Coding / DevTools
      - General Tools
    user: null
  tags:
    ai:
      - ELI5
      - Claude Code
      - agent skill
      - audience adaptation
      - explanation
      - prompt engineering
      - communication
      - evaluation
      - A/B testing
    user: null
relevance:
  ai:
    overall: 4
    ai_rd: 3
    aoi_ai: 1
    llm_agent: 4
    sillytavern_ai_rpg: 2
    image_gen: 1
  user: {}
actions:
  ai:
    - TRY
    - INTEGRATE
    - LEARN
    - REFERENCE
  user: null
status:
  ai: active
  user: null
---

# ELI5

## 一句話介紹

ELI5 是一個給 **Claude Code** 載入的說明型 Skill，會先判斷「這段內容要講給誰聽」，再依受眾調整詞彙、比喻、語氣、深度與 framing，讓同一個技術概念可以分別用適合孩子、學生、工程師、主管、產品經理或家人的方式解釋。

它的重點不是單純把內容「講簡單」，而是把 **受眾適配（audience adaptation）** 明確寫成 Agent 可重複遵循的工作流程。

## 它解決什麼問題

一般要求模型「解釋簡單一點」時，模型很容易只做表面簡化：少用幾個術語、縮短句子，卻沒有真正處理受眾在意的資訊不同。例如工程師通常需要知道架構、取捨與實作細節；主管更關心影響、成本、風險與決策；孩子則需要具體、熟悉的比喻與較短的句子。

ELI5 把這個問題拆成兩層：第一層先辨識受眾；第二層再調整語言與資訊框架。專案目前預先定義四大受眾軸線：年齡、教育程度、職務角色與人際關係，並為每類受眾描述適合的詞彙、比喻、語氣與資訊重點。

另一個它想解決的問題，是這類「溝通品質」往往只靠主觀感覺判斷。Repository 因此另外放了一套 eval workspace，讓相同題目分別以 Skill 與 baseline 執行，再依預先定義的 assertions 做自動評分，至少讓 Skill 調整可以進行重複比較，而不是只靠閱讀幾個範例判斷好不好。

## 核心概念

第一個核心是 **先決定受眾，再決定說法**。Skill 不把 ELI5 限定成「五歲小孩模式」，而是把使用者指定的受眾映射到不同的解釋策略。若沒有明確指定受眾，才預設使用經典的 Age 5 模式。

第二個核心是 **多維度校準**。受眾不同時，不只換詞，而是同時調整：

- **Vocabulary**：是否使用專業術語，以及術語需不需要立即解釋。
- **Analogies**：選擇玩具、學校、日常生活、工作、商業或技術系統等不同類型的比喻。
- **Tone**：從活潑、聊天式，到專業、精簡或較溫暖的家庭語氣。
- **Depth**：控制細節、抽象程度、取捨與邊界案例的深度。
- **Framing**：決定以使用者體驗、商業結果、技術架構、成本風險或實際操作來組織內容。

第三個核心是固定的說明結構：先用一句話說清楚「這是什麼」，再提供受眾能理解的比喻，接著補足必要細節，最後回答「所以這跟你有什麼關係」。這讓輸出不只容易理解，也比較容易對應實際情境。

第四個核心是 **Skill 本身與評測分開**。`skills/eli5/SKILL.md` 定義行為；`eli5-workspace/` 則負責測試、baseline、評分與結果保存。這種分離讓 prompt／Skill 規則可以修改，而評測題目與歷史結果仍能留下來做比較。

## 架構與技術

主要交付物是一個非常輕量的 **Claude Code Skill package**：

- `skills/eli5/SKILL.md`：唯一的正式 Skill 檔案，YAML frontmatter 定義 `name` 與長篇觸發描述，正文則包含受眾分類、解釋流程、語言校準、語氣規則與範例。
- `eli5-workspace/evals.json`：定義測試案例、受眾與 assertions。
- `eli5-workspace/run-evals.py`：Python 評測程式，透過 `claude -p` 執行 Skill 版本與 baseline，再呼叫 Claude 對各 assertion 做 PASS／FAIL 自動評分。
- `eli5-workspace/iteration-N/`：保存每次評測的回應、時間、grading 與 summary，讓不同 iteration 可以比較。
- `eli5-workspace/eval-results.md`：人工整理的評測策略與結果摘要。

安裝方式也很直接：將 `skills/eli5` 複製到 `~/.claude/skills/eli5`，之後即可用「ELI5 this」、「explain this to my manager」、「break this down for a 5th grader」等自然語句觸發。

Skill 本身沒有額外 Runtime、API、資料庫或外部服務；真正的執行能力由 Claude Code 提供。只有 Repository 內的評測工具需要 Python 與 Claude Code CLI。

## 主要功能

- **年齡適配**：針對 5、10、15、20–30、40+ 等區間調整字彙、句型與比喻。
- **教育程度適配**：支援 5th grade、Middle school、Senior High、College、Graduate school 等層級。
- **職務角色適配**：Manager、Engineer、Designer、Director、Colleague、Product Manager 會使用不同資訊 framing。
- **關係語氣適配**：Partner、Parents、Kids、Friend 等情境會調整語氣與比喻來源。
- **程式碼／錯誤／文件說明**：Skill 明確要求先理解原始內容，再進行受眾化翻譯，而不是只依表面文字改寫。
- **Skill vs baseline 評測**：相同 prompt 可分別以有 Skill 與無 Skill 執行，再比較 assertion pass rate。
- **A/B 測試 Skill 版本**：`run-evals.py` 也支援以 `--a`、`--b` 指定兩份 Skill，直接比較改版前後結果。
- **歷史結果保存**：每輪評測會保留 response、timing、grading 與 summary，方便追蹤規則調整是否真的改善。

## 技術亮點

第一個亮點是 **把「解釋給誰聽」升成一級決策變數**。很多提示詞只規定回答要簡潔、清楚、少術語，但 ELI5 直接把受眾的知識背景與目標視為輸出策略的一部分。對 Agent 設計而言，這比單純加入「請用淺顯方式說明」更接近可重用的 capability。

第二個亮點是 **同一個 Skill 同時控制內容選擇與表達方式**。例如 Manager 不只是使用較少術語，而是改以 impact、timeline、risk、cost 與 decision framing 組織資訊；Engineer 則保留 architecture、trade-off、performance 與 maintainability。這表示它處理的是資訊優先順序，而不只是語氣風格。

第三個亮點是 **Repository 有最小可用的 eval harness**。`run-evals.py` 可以做 Skill／baseline 或 Skill A／B 比較，並把 assertions 與結果落檔。對小型 Agent Skill 而言，這是一個值得參考的工程習慣：Skill 不一定要有大型測試框架，但至少應有固定案例、預期行為與可重複執行的比較方式。

第四個亮點是 **評測條件寫得相對具體**。例如 manager 案例要求 business framing、concise、actionable，5th grader 案例檢查 unexplained jargon、analogy、step-by-step 與 grade-appropriate vocabulary。這比「回答是否比較好」更容易追蹤 prompt 修改造成的實際效果。

## 限制與風險

第一個限制是 **受眾模型是人工預設的固定 bucket**。年齡、職稱或關係只能提供粗略先驗，不能代表個別使用者真正的背景。例如兩位同為 Manager 的讀者可能有完全不同的技術能力；若直接把角色等同於知識程度，仍可能過度簡化或選錯重點。

第二個限制是 **部分比喻與語氣規則帶有硬編碼假設**。例如不同年齡被指定某些生活情境、家庭角色被指定 household／shared-experience 類比。這種規則雖然容易使用，但在不同文化、個人經驗或語境下不一定合適，因此更適合作為初始 heuristic，而不是穩定的人格／背景推斷。

第三個限制是 **Skill 目前高度集中在單一 `SKILL.md`**。內容約包含受眾 taxonomy、routing、語氣、結構、範例與提醒，對小型 Skill 很直觀，但若後續增加更多角色、語言或領域，單檔規則可能逐漸難維護，屆時比較適合拆成 references 或可組合的 technique layer。

第四個限制是 **評測規模仍小，而且 grader 也是 Claude**。目前公開的完整結果只有 3 個測試案例、12 項 assertions；`run-evals.py` 產生回應與自動評分都呼叫 Claude Code CLI，因此結果不是獨立模型或人工盲測。它能證明「這套規則值得進一步測」，但不足以單獨證明對所有主題與受眾都有一致改善。

第五個限制是 **Repository 內兩份評測摘要目前不一致**。README 的 Current Results 表列出 With Skill 83.3%、Without Skill 41.6%、Delta +41.7%；`eli5-workspace/eval-results.md` 則記錄 91.7%、33.3%、Delta +58.3%。後者提供較完整的逐測試 breakdown，但這個差異仍表示文件同步與結果版本標記需要更清楚。

第六個限制是 **多語言能力沒有被獨立設計或驗證**。目前 Skill 的分類、語氣描述、範例與 assertions 主要以英文編寫；模型本身可能可以用其他語言回答，但 Repository 沒有像語言專屬 Skill 那樣提供中文等語言的獨立風格規則或評測證據。

## 與你的相關性

依公開技術 Profile，這個專案與 **LLM / Agent** 的關聯最高，因此 `llm_agent` 評為 4。它提供一個非常容易讀懂的 Skill engineering 小案例：如何定義觸發語意、做受眾 routing、把抽象的「好解釋」拆成明確行為，以及如何用 baseline／assertion 對 Skill 進行回歸比較。

對 **AI R&D** 評為 3。它不是模型訓練、推論或研究框架，但其 eval harness、A/B Skill 比較與 assertion-based grading 很適合拿來研究 prompt／Skill 變更的可測試性。對 AOI × AI 沒有直接技術關聯，因此評為 1。

對 **SillyTavern / AI RPG** 評為 2。受眾適配、語氣與解釋深度的思路可以延伸到角色輸出或世界觀說明，但 ELI5 本身沒有角色記憶、敘事狀態、persona runtime 或角色一致性機制，所以只是間接參考。Image Generation 則沒有直接關聯。

整體評為 4：它不是大型系統，但體積小、能直接試，而且同時把 Skill 規則與 eval workflow 放在同一個 Repository，作為 Agent capability 的最小工程範例很完整。

## 建議怎麼使用

- `TRY`：直接安裝到 Claude Code，拿同一份技術內容分別要求「給工程師」、「給主管」、「給國中生」三種版本，觀察它是否真的改變資訊優先順序，而不只是替換詞彙。
- `INTEGRATE`：若有需要對不同讀者產生說明文件、錯誤解釋、技術摘要或交接內容，可把 ELI5 當成輸出前的 audience-adaptation layer；尤其適合先產生完整技術答案，再由 Skill 依讀者重新 framing。
- `LEARN`：重點閱讀 `SKILL.md` 的 audience taxonomy 與 `eli5-workspace/run-evals.py`。前者示範能力規則如何落地，後者示範小型 Skill 如何建立 baseline、assertions 與 A/B evaluation。
- `REFERENCE`：若要自己設計 domain-specific Skill，可參考它「觸發描述 → 分類 → 固定流程 → 範例 → eval」的最小閉環，而不必一開始就建立大型 Agent framework。

若要進一步驗證，可以擴充更多題型與受眾，並把評分拆成 Claude grader、其他模型 grader 與人工盲測三組；這能更清楚區分 Skill 真正帶來的改善，與同模型自評造成的偏差。

## 與其他收藏的關聯

- [ISO 24495 Skill](./github-danyuchn-iso-24495-skill.md)：兩者都在處理 human-facing communication quality，但切入點不同。ISO 24495 Skill 以 Relevant、Findable、Understandable、Usable 改善文字是否容易找到、理解與採取行動；ELI5 則先判斷受眾，再調整詞彙、比喻、語氣、深度與 framing。兩者可以視為「內容可用性」與「受眾適配」兩個互補層。
- [Agent Skills](./github-addyosmani-agent-skills.md)：Agent Skills 是大型工程工作流 Skill 套件，ELI5 則是單一能力、單一 `SKILL.md` 的小型案例。兩者放在一起很適合比較 Skill package 從單功能到多工作流系統時，routing、驗證與模組化設計如何演進。

## 使用者備註


## 更新紀錄

### 2026-09-17

- 首次收錄 ELI5，整理其受眾適配模型、Claude Code Skill 結構、Skill／baseline 評測方式、A/B 測試工具，以及目前評測文件不一致等限制。
