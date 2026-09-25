---
schema_version: 1
id: github-ncusspm25-opus-mode-for-codex
title: Opus Mode for Codex
canonical_url: https://github.com/ncusspm25/opus-mode-for-codex
source:
  type: github
  url: https://github.com/ncusspm25/opus-mode-for-codex
  identity: github:ncusspm25/opus-mode-for-codex
resource_kind:
  ai: skill
  user: null
navigation:
  categories:
    ai:
      - Agent / Harness
      - AI Coding / DevTools
    user: null
created_at: 2026-09-26
updated_at: 2026-09-26
last_checked_at: 2026-09-26
summary: Opus Mode for Codex 是一個給 Codex 使用的輕量 Agent Skill，將長任務中的狀態維護、脈絡綜整、跨檔案一致性、根因追查、反證檢查、比例式驗證與完成證據整理成可重用工作習慣。它不切換模型、不呼叫 Anthropic，也不提供持久記憶；v0.1.0 目前只有相容性與 smoke test，尚未公布受控的基準比較結果。
classification:
  categories:
    ai:
      - Agent
      - AI Coding / DevTools
      - General Tools
    user: null
  tags:
    ai:
      - Codex
      - agent-skills
      - coding-agent
      - SKILL.md
      - long-horizon-tasks
      - context-synthesis
      - task-state
      - root-cause-analysis
      - multi-file-consistency
      - falsification
      - verification
      - completion-evidence
      - engineering-discipline
    user: null
relevance:
  ai:
    overall: 4
    ai_rd: 4
    aoi_ai: 2
    llm_agent: 5
    sillytavern_ai_rpg: 2
    image_gen: 1
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

# Opus Mode for Codex

## 一句話介紹

Opus Mode for Codex 是一個**只靠文字指令運作的 Codex Agent Skill**，把長時間、跨多輪、跨多檔案工作中最容易失守的工程習慣，整理成一套可重用的行為層：保留已確認決策、壓縮而不是堆積脈絡、追查第一個根因分歧、維持共享行為一致性、主動做一次有資訊價值的反證，以及在宣告完成前提供與風險相稱的驗證證據。

名稱中的「Opus Mode」指的是長任務工作風格，不代表切換到 Claude Opus，也不會呼叫 Anthropic API。專案同樣不是 Codex 替代品、Agent Runtime、背景程序或持久記憶系統。

## 它解決什麼問題

這個 Skill 針對的不是「模型不會寫程式」，而是複雜任務常見的**執行習慣失真**。

長對話或長除錯過程中，Agent 可能記得最新幾輪內容，卻遺漏更早仍然有效的限制；也可能在看到第一個合理原因後直接修補症狀，沒有沿資料流追到第一個真正偏離預期的地方。跨檔案修改時，另一種常見問題是只修正眼前 caller，卻破壞共用契約；而在工作尾端，Agent 也容易把「程式碼已改」等同於「問題已解決」。

Opus Mode 的做法，是要求 Agent 維持一份小型工作模型，只保存會影響後續決策的資訊：目標、已驗證事實、限制、決策、被否決方案、未解問題、目前 artifact 狀態與下一步。它不鼓勵把整段對話重新讀一遍，也不要求每個任務都建立計畫文件，而是將注意力集中在「哪些資訊仍然會改變下一個行動」。

## 核心概念

第一個核心是 **工作狀態而不是逐字記憶**。Skill 要求將歷史壓縮成可操作狀態，並區分觀察、假設與已驗證結論。若後續證據推翻舊假設，就更新工作模型，而不是單純再附上一條新資訊。

第二個核心是 **脈絡綜整而不是脈絡堆積**。對長任務而言，更多 context 不一定代表更準確；Skill 強調只讀取足以改變下一個決策的資料，避免反覆重載整段歷史或蒐集與行動無關的背景。

第三個核心是 **一致性邊界**。修改共享行為前，先找出真正受同一不變量影響的 caller、設定、測試、schema 與文件，再做最小但完整的修改。這種做法刻意介於「只修眼前一行」與「把整個 Repository 都重構」之間。

第四個核心是 **根因先於修補**。遇到異常時先比較 expected 與 observed 行為，找到第一個 divergence，再把它連回可驗證的因果機制與正確修改邊界。只有證據足夠時才停止追查。

第五個核心是 **一次有資訊價值的反證**。對非瑣碎結論，預設做一次聚焦的 falsification：查看另一個 caller、邊界條件、替代設定、隱藏依賴、較簡單的解釋或可能 regression。重點不是儀式化自我審查，而是挑一個最可能推翻目前結論的檢查。

第六個核心是 **比例式驗證**。Skill 用影響程度、不可逆性與不確定性來決定驗證深度，但明確說明這只是判斷工具，不是數值風險公式。文字修正可能只需要重新閱讀；共享 parser 修改則需要邊界案例、相關 caller 與實際測試；高後果操作則需要更強證據與既有授權。

## 架構與技術

這個 Repository 的主要交付物就是 `SKILL.md`，因此 `resource_kind` 判定為 `skill`。

主要組成包括：

- `SKILL.md`：正式行為規則，涵蓋狀態維護、脈絡綜整、任務續接、全域一致性、根因調查、反證、比例式驗證與完成回報。
- `references/`：設計原則、評估方法與實際驗證紀錄。
- `benchmarks/`：提供成對比較 protocol 與可重現 fixture，用於未來比較 baseline Codex 與載入 Skill 後的差異。
- `examples/`：長除錯、跨檔案重構、對話續接與研究綜整等情境範例。
- `agents/openai.yaml`：Codex 顯示名稱、短描述與預設 prompt 等介面 metadata。

安裝方式是把 Repository 放入 Codex 支援的本機 Skill 路徑，例如個人層級的 `$HOME/.agents/skills/opus-mode-for-codex`，或專案內的 `.agents/skills/opus-mode-for-codex/`。README 指出需要 Git 與支援本機 Agent Skills 的 Codex client；Skill 本身不新增 runtime dependencies、API key、MCP Server 或 installer script。

專案採 MIT License。v0.1.0 為 2026-09-26 的首次公開版本。

## 主要功能

- **長任務狀態維護**：保留仍會影響決策的限制、證據與 artifact 狀態。
- **上下文壓縮**：將重複歷史整理成可操作摘要，而不是無限制累積 transcript。
- **中斷後續接**：從已驗證進度繼續工作，不因 context 壓縮或任務中斷就重新從零開始。
- **共享行為一致性**：修改前確認相關 caller、設定、schema、測試與文件的實際邊界。
- **根因導向除錯**：先找第一個 divergence，再決定真正需要修改的位置。
- **聚焦反證**：在非瑣碎結論完成前，主動找一個最可能推翻目前假設的例外。
- **比例式驗證**：依影響、不可逆性與不確定性調整檢查深度。
- **完成證據管理**：區分「已修改」、「已測試」、「已發布」、「已部署」與「已驗證」，避免把推測描述成完成事實。
- **複雜度感知**：明確要求簡單工作保持簡單，不因 Skill 被叫用就強迫小任務走多階段流程。

## 技術亮點

最值得參考的地方，是它把「長任務品質」拆解成幾個**低儀式感但高槓桿的行為不變量**。相較於完整開發生命週期框架，Opus Mode 不要求每次都先 brainstorm、產生正式 spec、建立計畫檔或固定多輪 review；它更像一個套在原有 Codex 行為上的「複雜任務穩定器」。

第二個亮點是 **明確限制脈絡管理本身的成本**。Skill 不鼓勵無限讀取歷史，而是要求「只保存能改變行動的資訊」。對長 context Agent 而言，這比單純追求更多記憶更接近實際工作需求。

第三個亮點是 **把反證設計成一次高資訊檢查，而不是重複自我反思**。這避免常見的「再檢查一次」只產生更多文字，卻沒有新增可驗證資訊。

第四個亮點是 **完成宣告與證據綁定**。Skill 特別強調不能把「看起來應該成功」寫成「已測試／已部署／已發布」，這對 Coding Agent 的可信度比單純增加產碼能力更重要。

第五個亮點是 Repository 已經預先提供**成對評估 protocol**，要求固定模型、reasoning effort、權限、Prompt、fixture 與工具條件，再比較 baseline 與 Skill。這顯示作者沒有把單一成功案例直接當成品質提升證明。

## 限制與風險

最大的限制是：**目前沒有受控證據證明這個 Skill 真的讓 Codex 更好。**

v0.1.0 的 validation record 包含格式／discovery 檢查與一個 debugging smoke test；該 smoke test 最終讓 22 個 acceptance tests 從原始的 7 passed / 15 failed 變成 22 passed / 0 failed，但這只是「載入 Skill 後的一次成功案例」，不是 baseline-versus-skill 對照實驗。專案本身也明確拒絕把它解讀成品質提升、token 節省、延遲改善或統計顯著性。

目前實際驗證環境也很有限：紀錄使用 Windows、Codex CLI `0.155.0-alpha.9.2`，behavioral smoke test 使用 `gpt-6-astra`、reasoning effort `high`。文件明確指出尚未做 macOS／Linux 行為測試、內建 `$skill-installer` 安裝測試、預設 policy 下的 implicit activation 評估，以及真實長對話 compaction／跨 session persistence 評估。

第二個限制是 **它本質上仍是 instruction-driven guidance**。沒有外部 runtime 可以硬性保證 Agent 一定遵守每條規則，因此不能取代測試、CI、sandbox、權限控制或正式工作流程引擎。

第三個限制是 **它沒有持久記憶能力**。若另一個 session 完全拿不到先前對話、task note 或 artifact，Skill 不能自行「回憶」不存在的歷史。真正跨 session 續接仍需要可存取的 handoff 或專案文件。

第四個限制是 **與既有規則可能重疊**。若 Repository 已有 `AGENTS.md`、開發方法論 Skill、TDD 規範或其他 completion gate，Opus Mode 會疊加在這些規則之上；導入前應檢查是否產生重複或互相衝突的要求。

第五個限制是專案目前只有初始版。v0.1.0 的文件與評估方法做得相對完整，但成熟度仍應以「新發布、值得試驗」看待，而不是已被廣泛證實的 Coding Agent 最佳實務。

## 與你的相關性

依公開技術 Profile，這個 Skill 對 **LLM／Agent** 的相關性最高。它直接處理 Agent 在長任務中的上下文治理、工具使用前後的狀態維持、根因推理、跨檔案一致性與完成驗證，因此 `llm_agent` 評為 5。

對 **AI R&D** 也有直接實務價值，評為 4。研究原型、Agent 工程、模型整合與評估流程都常涉及長上下文、多檔案修改、資料與假設更新；這套「狀態綜整＋反證＋證據式完成」方法可作為通用工程紀律。

對 **AOI × AI** 的價值主要在軟體工程層，評為 2。它不提供電腦視覺、檢測、分割或 OCR 方法，但若相關專案使用 Coding Agent 協助除錯與修改，共享行為一致性與比例式驗證仍有間接價值。

對 SillyTavern／AI RPG 也是間接相關，主要可借鑑長任務 Agent 的狀態維護與完成判定；對影像生成則幾乎沒有直接技術關聯。

整體評為 4：設計主題高度符合 LLM／Agent 與 AI 工程，但 v0.1.0 尚缺受控效能比較，因此現階段更適合做小規模試驗與方法論參考，而不是直接假設它能帶來穩定品質增益。

## 建議怎麼使用

最適合先在四類任務中試用：

1. **長時間除錯**：已經累積多輪假設，需要避免重複調查並追到真正根因。
2. **跨檔案修改**：同一行為被多個 caller、設定或測試共享，需要維持整體契約。
3. **對話續接**：先前已經有明確限制與驗證結果，希望後續工作不要重新開始。
4. **研究綜整**：新來源推翻舊假設，需要同步修正依賴該假設的結論。

不建議用在單純拼字、格式調整、明確的一行修正或短問題。這點也是 Skill 本身的設計原則：額外 deliberation 只有在任務複雜度足夠時才值得付出成本。

因此給予 `TRY`：它安裝成本低，最適合直接拿真實複雜任務做小型 A/B 對照。給予 `LEARN` 與 `REFERENCE`：即使最後不長期安裝，「工作模型、一次聚焦反證、比例式驗證、證據式完成」都是很值得抽離使用的 Agent 設計原則。同時保留 `WATCH`，因為真正決定它是否值得長期整合的關鍵，仍是後續是否出現可重現的 baseline-versus-skill 結果。

## 與其他收藏的關聯

- [Agent Skills](./github-addyosmani-agent-skills.md)：兩者都把 Coding Agent 的工程行為封裝成 Skill。Agent Skills 是涵蓋完整軟體生命週期的大型能力庫；Opus Mode 則刻意維持單一、輕量、跨情境的長任務工作習慣層，適合比較「多 Skill workflow library」與「單一複雜度穩定器」兩種設計。
- [Superpowers](./github-obra-superpowers.md)：兩者都強調先理解、找根因、驗證後再完成，但 Superpowers 對 brainstorm、planning、TDD、review 等流程有更完整且更強的紀律；Opus Mode 的設計較柔性，讓簡單任務保持簡單，並把重點放在狀態、反證與比例式驗證。
- [Codex Engineering System 繁體中文版](./github-ai72dope-codex-engineering-system-zh-tw.md)：兩者都試圖解決 Coding Agent 工程流程深度失配。Codex Engineering System 以 Complexity／Risk 路由到不同工作流程；Opus Mode 則不建立明確路由表，而是用同一組原則依後果與不確定性自行調整深度。

## 使用者備註

## 更新紀錄

### 2026-09-26

- 建立 Knowledge Card。
- 依 Repository metadata、README、`SKILL.md`、設計原則、benchmark protocol、v0.1.0 validation record 與 MIT License 整理目前能力與限制。
- 明確保留「尚未有受控 baseline-versus-skill 效能證據」的成熟度邊界。
