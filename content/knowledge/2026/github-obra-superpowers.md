---
schema_version: 1
id: github-obra-superpowers
title: Superpowers
canonical_url: https://github.com/obra/superpowers
source:
  type: github
  url: https://github.com/obra/superpowers
  identity: github:obra/superpowers
resource_kind:
  ai: skill
  user: null
navigation:
  categories:
    ai:
      - Agent / Harness
      - AI Coding / DevTools
    user: null
created_at: 2026-09-25
updated_at: 2026-09-25
last_checked_at: 2026-09-25
summary: Superpowers 是 Jesse Vincent 維護的 Coding Agent 軟體開發方法論與技能框架，以可組合 Skills 把需求釐清、規劃、TDD、系統化除錯、子代理驅動開發、程式碼審查與分支收尾串成具明確驗證關卡的工作流，並適配 Claude Code、Codex、Cursor、Gemini CLI、OpenCode 等多種 Agent Host。
classification:
  categories:
    ai:
      - Agent
      - AI Coding / DevTools
      - General Tools
    user: null
  tags:
    ai:
      - agent-skills
      - coding-agent
      - software-development-methodology
      - SKILL.md
      - test-driven-development
      - systematic-debugging
      - subagent-driven-development
      - code-review
      - git-worktree
      - workflow-orchestration
      - Claude Code
      - Codex
      - OpenCode
      - engineering-discipline
      - verification
    user: null
relevance:
  ai:
    overall: 5
    ai_rd: 4
    aoi_ai: 2
    llm_agent: 5
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

# Superpowers

## 一句話介紹

Superpowers 是一套給 Coding Agent 使用的**完整軟體開發方法論與可組合 Skill 框架**：它不提供新的模型或 Agent Runtime，而是在 Claude Code、Codex、Cursor、Gemini CLI、OpenCode 等既有 Agent Host 上方，加入從需求釐清、規劃、測試驅動開發（TDD）、系統化除錯、子代理協作、程式碼審查到分支收尾的工程流程。

它的特色不是單純提供一批「可以叫用的提示詞」，而是明確規定 Agent **何時必須先使用流程型 Skill、什麼證據才算完成，以及哪些步驟不能因為任務看似簡單就自行略過**。

## 它解決什麼問題

Coding Agent 往往不是缺乏寫程式能力，而是容易在工程流程上失控：需求還沒釐清就直接改碼、沒有先建立可失敗的測試、除錯時憑直覺連續嘗試修補、長任務在 context 壓縮後重複做已完成工作，或把「看起來應該可以」當成完成證據。

Superpowers 的做法，是把這些失敗模式轉成可執行的工作紀律。典型流程會先透過 brainstorming 釐清目的與設計，再建立實作計畫與隔離工作區；實作階段可選擇子代理驅動開發或較省成本的原生行內執行，並以 TDD、程式碼審查與完成前驗證作為品質關卡。

其中 `using-superpowers` 更進一步把 Skill discovery 變成入口規則：若任務可能適用某個 Skill，就要求在回覆、查檔、實作甚至追問之前先檢查並載入相應流程。這使 Superpowers 更接近 **Coding Agent 的行為治理層**，而不是被動等待使用者手動呼叫的 Skill 集合。

## 核心概念

第一個核心是 **流程型 Skill 優先於實作型 Skill**。例如遇到「做一個新功能」時，先走 brainstorming 與 planning；遇到錯誤時先走 systematic-debugging；真正的前端、後端或其他實作能力則排在流程決策之後。這個順序用來避免 Agent 一看到可寫的程式碼就提前進入實作。

第二個核心是 **證據優先於完成宣告**。TDD Skill 明確要求先看到測試因缺少功能而失敗，再寫最小實作使其通過；而且綠燈不是只跑單一測試檔，還要執行專案的完整測試命令。系統化除錯同樣要求先找根因、建立假設並做最小驗證，不接受先修症狀再補理由。

第三個核心是 **把長任務拆成可恢復的執行狀態**。子代理驅動開發會為每個任務派出新的實作者與審查者，並把進度、裁決與提交記錄寫進計畫專屬 ledger；即使主 session 經過 context compaction，也應以 ledger 與 Git 歷史恢復，而不是依賴模型記憶。

第四個核心是 **自動執行與人工控制並存**。實作計畫執行期間，普通歧義與可逆決策由 controller 自行裁決並記錄，不因每個小問題停下詢問；但不可逆／破壞性操作、安全敏感操作，以及 merge、push、publish 等工作區外副作用仍被列為需要停下確認的邊界。

第五個核心是 **方法論本身也可以被診斷**。v6.4.1 新增的 `diagnosing-superpowers` 會讀取實際 session transcript，以 `path:line` 證據分析重複工作、計畫偏離、Skill 未觸發、成本與耗時等問題；若要建立可分享的診斷包，還會加入明確的使用者批准與資料清理流程。

## 架構與技術

這個 Repository 的主要交付物是 `skills/**/SKILL.md` 與各 Agent Host 的整合層，因此 `resource_kind` 判定為 `skill`。它本身不是獨立 Agent 執行引擎，也不綁定特定模型供應商。

主要組成可概括為：

- `skills/`：核心工程方法，包括 `brainstorming`、`writing-plans`、`test-driven-development`、`systematic-debugging`、`subagent-driven-development`、`executing-plans`、`requesting-code-review`、`verification-before-completion`、`finishing-a-development-branch`、`diagnosing-superpowers` 等。
- `using-superpowers`：負責 Skill discovery、流程優先順序與平台適配，是整套方法論的入口規則。
- 平台專用 plugin／manifest／hook：讓同一批 Skills 可以掛載到不同 Coding Agent。Codex manifest 目前版本為 `6.4.1`，核心技能目錄直接指向 `./skills/`。
- `scripts/`、測試與評估工具：維護 Skill、跨平台相容性與行為評估，不只把 Markdown 當作無法驗證的靜態文件。

截至 2026-09-25，最新正式版本為 **v6.4.1**，發布於 2026-09-19。這版新增 Superpowers session 診斷能力，重做 `executing-plans` 的原生行內執行模式，並加入 OpenCode 2.0、Muse、Qwen Code 等支援。

Repository 採 MIT License，且仍持續更新。

## 主要功能

- **需求釐清與設計**：先理解使用者真正想解決的問題，再決定功能與架構，避免從模糊要求直接進入實作。
- **實作計畫**：把規格拆成有明確檔案、介面、測試與提交步驟的小型任務；計畫禁止使用 `TBD`、模糊的「之後補驗證」等占位描述。
- **Git worktree 隔離**：實作前建立或確認隔離工作區，避免直接在主要分支上進行長任務。
- **測試驅動開發**：嚴格採 Red → Green → Refactor，先確認測試真的因缺少功能而失敗，再寫最小實作。
- **系統化除錯**：先重現、蒐集證據、追蹤資料流與建立單一假設，再做最小變更驗證，避免連續猜修。
- **子代理驅動開發**：每個相對獨立的任務使用新的 implementer，再進行規格與品質審查，最後做整體分支 review。
- **原生行內執行**：v6.4.1 提供成本較低的替代模式，由目前 session 完成整份計畫，再由新的 reviewer 做整體審查。
- **程式碼審查與完成驗證**：要求以實際 diff、測試與使用者合理預期檢查結果，不只驗證「計畫文字有沒有照做」。
- **Session 診斷**：分析 Superpowers 使用過程中的重複工作、偏離計畫、成本與 Skill 觸發問題，所有 finding 都要求可追溯到 transcript 的行號證據。
- **分支收尾**：完整測試通過後才進入整合選項，merge、push／PR 或保留分支由使用者決定。

## 技術亮點

最值得參考的是它把 **Coding Agent 的可靠性視為工作流設計問題，而不是只靠更強模型解決**。即使模型本身可以一次寫出大量程式碼，需求、驗證、審查、狀態恢復與副作用邊界仍需要顯式設計；Superpowers 把這些工程紀律做成 Agent 可以版本控制與反覆執行的行為規則。

第二個亮點是 **對 Agent「合理化跳步」的明確防護**。多個 Skill 都直接列出常見藉口，例如「這很簡單不用測」、「我先快速看一下程式碼」、「先修再說」等，目的不是增加說明文字，而是阻止模型在追求快速完成時自行降低流程標準。

第三個亮點是 **計畫、執行與恢復狀態的分離**。尤其子代理驅動模式把計畫本身視為規格推論、把 ledger 視為執行狀態，並要求 controller 在 context 遺失後信任可持久化的紀錄。這對長時間 Agent 任務與多代理協作相當有參考價值。

第四個亮點是 **同時提供高品質與低成本兩種執行路徑**。子代理模式用額外 context 換取任務隔離與逐任務 review；原生行內模式則讓同一 session 執行所有任務，只在最後派出新的 reviewer。v6.4.1 已把這兩條路徑正式放進計畫 handoff，讓成本成為工作流設計的一部分。

第五個亮點是 **可觀測性延伸到 Skill 框架本身**。`diagnosing-superpowers` 不直接替框架下診斷結論，而是要求從 transcript 建立可追溯的報告，並對分享 session 資料設置 redaction、audit 與人工批准。這讓「為什麼 Agent 這次做得很怪」不再只能靠事後印象猜測。

## 限制與風險

第一個限制是 **方法論非常有立場，而且刻意偏嚴格**。例如新功能與 bug fix 原則上都要求 TDD，systematic-debugging 不允許在根因調查前提出修正，`using-superpowers` 甚至要求只要有很小機率適用 Skill 就先載入。這對需要可重現品質的正式工程很有價值，但對一次性原型、快速探索或非常小的修改可能造成額外流程成本。

第二個限制是 **Skill 仍由 LLM 解讀，不是 deterministic workflow engine**。硬性文字可以顯著提高遵循度，但不同模型、Host、工具權限與 context 狀態仍可能造成行為差異；真正的測試、CI、sandbox、權限控制與 code review 仍不能由 Skill 文字取代。

第三個限制是 **子代理模式會直接增加模型使用量與協調成本**。它刻意用「每任務新的實作者 + review」換取隔離與品質；任務很多時，context 與 review 次數也會增加。v6.4.1 的原生行內執行就是官方為這個成本面提供的較輕方案。

第四個風險是 **與既有專案規則可能重疊或衝突**。Superpowers 明確說明使用者／Repository 指令優先於 Skills，但如果專案本身已有 `AGENTS.md`、TDD 規範、分支策略、驗證流程或其他 Skill framework，仍應先確認哪一層負責路由、哪一層負責品質關卡，避免同一工作被兩套方法論重複約束。

第五個風險是 **第三方 Skill 本身就是 Agent 行為供應鏈**。安裝後，Skills 會影響 Agent 何時讀檔、寫檔、執行命令、派子代理與做工程決策；因此應像審查 CI Action、IDE plugin 或其他自動化腳本一樣，先檢查版本與核心規則，再允許它在有寫入／執行權限的專案中運作。

第六個限制是 **專案演進速度快，具體工作流可能隨版本改變**。例如 v6.4.1 就大幅重做 `executing-plans`、新增診斷 Skill，並調整 planning、TDD 與 review 規則；若要把它當成團隊標準，應固定版本或把升級視為需要審查的方法論變更。

另外，README 說明其可選的視覺伴隨功能會從專案網站載入圖示並帶上 Superpowers 版本資訊；專案提供環境變數可停用此行為。若在嚴格離線或限制外連的環境使用，這也是部署時需要檢查的項目。

## 與你的相關性

依公開技術 Profile，這個專案對 **LLM／Agent** 的相關性最高。它直接處理 Coding Agent 的 Skill routing、長任務執行、子代理協作、驗證、除錯與 review，可作為設計 Agent workflow、Harness 上層治理與多代理工程流程時的高價值參考，因此 `llm_agent` 評為 5。

對 **AI R&D** 也有明顯實務價值。研究型專案同樣會遇到需求漂移、實驗程式回歸、測試不足、除錯與長任務 context 遺失；其中 evidence-first debugging、TDD、plan ledger 與 session diagnosis 都可轉用到 AI 工程流程，因此 `ai_rd` 評為 4。

對 **AOI × AI／Computer Vision** 的價值主要在工程層。它不提供影像分類、偵測、分割、OCR 或 AOI 演算法，但可規範相關軟體的需求、測試、除錯與版本整合，因此評為 2。

對 **SillyTavern／AI RPG** 則是間接關聯：若開發複雜插件、Agent 系統或需要跨 session 的功能，這套流程仍可作為工程方法參考，但它不是角色扮演或聊天體驗工具，因此評為 2。影像生成沒有直接功能關聯，評為 1。

## 建議怎麼使用

建議先把它當成 **Coding Agent 方法論實驗**，不要第一天就把整套規則變成所有專案的唯一標準。

最適合先觀察的組合是 `using-superpowers`、`brainstorming`、`writing-plans`、`test-driven-development`、`systematic-debugging` 與 `verification-before-completion`。這些 Skill 可以直接檢驗「先設計、先證明，再宣告完成」是否能降低返工。

遇到有多個相對獨立任務的功能，再測試 `subagent-driven-development`；若發現成本或協調開銷過高，則對照 v6.4.1 的 `executing-plans` 行內模式。兩者的差異本身就很適合作為多代理工作流設計的比較案例。

因此給予 `TRY` 與 `INTEGRATE`：它已是可直接安裝並在多種 Coding Agent 上使用的完整框架，而且內容與平台適配都相當成熟。同時給予 `LEARN` 與 `REFERENCE`，因為即使不採用它的強制程度，Skill 優先順序、反合理化規則、plan ledger、逐任務 review、成本分層與 session diagnosis 都值得拆解成自己的 Agent 設計原則。

## 與其他收藏的關聯

- [Agent Skills](./github-addyosmani-agent-skills.md)：兩者都把完整軟體生命週期轉成 Coding Agent 可重用的 Skills，也都支援多個 Agent Host。Superpowers 更強調「方法論必須被遵循」與流程硬關卡，例如先 Skill discovery、嚴格 TDD、系統化除錯與子代理 review；Agent Skills 則更像完整工程生命週期能力庫與 routing layer，適合比較兩種 workflow governance 的強度。
- [Skills For Real Engineers](./github-mattpocock-skills.md)：兩者都把資深工程實務封裝成 Agent Skills，但 Matt Pocock 的設計更強調 small／adaptable／composable skills，以及 user-invoked／model-invoked 的觸發邊界；Superpowers 更接近一套會主導整體開發節奏的完整方法論。兩張卡很適合對照「可選 discipline library」與「整體 process framework」。
- [Tsunu Superpowers](./github-tsun-u-tsunu-superpowers.md)：同樣處理 Codex／Claude Code 的工程流程，但 Tsunu Superpowers 特別強調依任務性質與風險調整流程強度，避免每個任務都套最重流程；obra/superpowers 則更強調預設嚴格的 Skill discipline。兩者可作為「自適應流程」與「強制流程」的對照。

## 使用者備註

## 更新紀錄

### 2026-09-25

- 建立 Knowledge Card。
- 依 Repository metadata、README、v6.4.1 release、Codex／Claude plugin manifest，以及 `using-superpowers`、TDD、systematic debugging、subagent-driven development、planning、branch finishing、session diagnosis 等核心 Skill 整理目前方法論與風險。
