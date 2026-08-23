---
schema_version: 1
id: github-ai72dope-codex-engineering-system-zh-tw
title: Codex Engineering System 繁體中文版
canonical_url: https://github.com/ai72dope/codex-engineering-system-zh-tw
source:
  type: github
  url: https://github.com/ai72dope/codex-engineering-system-zh-tw
  identity: github:ai72dope/codex-engineering-system-zh-tw
resource_kind:
  ai: skill
  user: null
created_at: 2026-08-24
updated_at: 2026-08-24
last_checked_at: 2026-08-24
summary: Codex Engineering System 是一套可安裝到程式碼儲存庫的 Codex 工程工作流程與指令系統，依任務類型、複雜度與風險自適應選擇流程深度，並用規格驅動開發、選擇性 TDD、驗證契約與路由追蹤提升 coding agent 的工程紀律；繁中版本只翻譯使用者文件，核心 Runtime Instructions 維持已驗證的英文原文。
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
      - coding-agent
      - agent-workflow
      - AGENTS.md
      - adaptive-routing
      - complexity-routing
      - risk-routing
      - spec-driven-development
      - TDD
      - verification-contract
      - routing-trace
      - progressive-disclosure
      - engineering-discipline
      - zh-TW
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
    - LEARN
    - REFERENCE
    - WATCH
  user: null
status:
  ai: active
  user: null
---

# Codex Engineering System 繁體中文版

## 一句話介紹

Codex Engineering System 是一套安裝在程式碼儲存庫根目錄、由 `AGENTS.md` 驅動的 **Codex 工程工作流程與指令系統**：它會依任務類型、複雜度與風險選擇不同工程流程，再視情況載入規格驅動開發、TDD、除錯、安全、測試、架構與程式碼審查等指引。

作者明確說明它不是 Codex Plugin，也不是官方 Skill。依 Knowledge Card 的 `resource_kind` 定義，本卡仍將它歸為 `skill`，因為 Repository 的主要交付物就是供 Agent 載入、遵循與重複使用的工作流程／指令層，而不是一般應用程式、函式庫或服務。

目前來源版本為 **v1.3.2**。繁體中文版只將使用者說明文件中文化；實際交給 Codex 執行的 Runtime Instructions 刻意保留英文，原因是目前 Demo 驗證建立在英文規則上，作者不希望在沒有重新驗證前因翻譯改變模型行為。

## 它解決什麼問題

這個專案針對的是 coding agent 的 **工程流程深度失配**。模型可以很快修改程式碼，但小型局部修正、一般功能、跨模組變更與高風險授權邏輯，實際上不應使用同一套流程。

如果所有任務都套完整規格、TDD、審查與多層驗證，會造成過度工程；反過來，如果大型或高風險需求也直接進入實作，則容易發生需求猜測、範圍擴張、漏掉失敗路徑，甚至在未實際執行測試時把結果寫成「已通過」。

Codex Engineering System 的做法是把工程決策拆成明確路由：先理解任務，再根據 **任務類型、複雜度與風險** 決定應該載入多少規格、測試、安全與驗證要求。它不是增加一個新的 Agent Runtime，而是把 Repository 內的工程規則整理成 Codex 可以持續遵循的行為層。

## 核心概念

第一個核心是 **自適應路由（Adaptive Routing）**。根目錄 `AGENTS.md` 會先判定 Task Type，再分別判斷 Complexity 與 Risk。Complexity 分成 Simple、Standard、Complex：

- Simple：`Understand → Change → Targeted Verify`
- Standard：`Understand → Plan → Implement → Test → Verify`
- Complex：`Understand → Spec → Plan → TDD when appropriate → Implement → Test → Review → Verify`

這裡的複雜度不是單看程式碼行數，而是看需求歧義、跨模組影響、公開契約、相容性、架構與重要邊界條件。

第二個核心是 **風險與複雜度分離**。授權、驗證、付款、秘密資訊、破壞性操作、資料遷移、併發、外部 API 相容性與正式環境基礎設施等工作，即使修改量很小，也會被視為高風險並提高驗證深度。這避免「改動很小，所以可以少檢查」這種危險捷徑。

第三個核心是 **漸進式揭露（Progressive Disclosure）**。`AGENTS.md` 主要扮演路由器，不把所有工程方法塞成一份超大型 Prompt；只有任務符合條件時，才載入 `workflows/` 或 `prompts/` 下對應的規格、TDD、安全、測試、除錯、架構或重構指引。這降低不相關規則佔用上下文，也讓每層責任比較清楚。

第四個核心是 **規格驅動開發與選擇性 TDD**。需求模糊、任務複雜或驗收條件會實質影響實作時，系統要求先整理 Requirements、Acceptance Criteria、Edge Cases 與 Out of Scope。TDD 則只在行為能用穩定自動化測試表達、且 test-first 能提供有效回饋時啟用，而不是把 RED → GREEN → REFACTOR 強制套到所有工作。

第五個核心是 **驗證誠實性**。Completion Report 必須區分 `Passed`、`Failed`、`Not run` 與 `Manual/Static check`，不能把「看起來應該會過」寫成已通過。若選用 TDD，還必須留下 RED、GREEN、REFACTOR 與 FULL SUITE 的實際執行證據；沒有真正執行就不能事後描述成完整 TDD。

第六個核心是 **流程可觀測性**。v1.3.1／v1.3.2 新增 Routing Trace，要求非 Simple 任務在澄清問題、規劃、回報 blocker 或開始修改之前先顯示所選 Task、Complexity、Risk、Spec、TDD 與 Specialist。它不揭露隱藏推理，而是把「這次採用了什麼工程流程」變成可檢查的外顯狀態。

## 架構與技術

安裝方式非常直接：把 `INSTALL_TO_YOUR_PROJECT/` 裡的 `AGENTS.md` 與 `codex-system/` 複製到目標 Repository 根目錄。之後使用者仍照平常方式向 Codex 下需求，不需要額外 CLI、Plugin 或每次複製 Prompt。

整體主要由 Markdown 指令與模板構成：

- `AGENTS.md`：總路由器與全域工程契約，決定任務類型、複雜度、風險與需要載入的額外層。
- `codex-system/routing/`：`complexity.md`、`risk.md`，分別定義流程深度與高風險升級條件。
- `codex-system/workflows/`：包含 `new_feature.md`、`bug_fix.md`、`refactor.md`、`project_setup.md`、`spec_driven.md`、`tdd.md`。
- `codex-system/prompts/`：提供 debugging、testing、code review、security audit、architecture、refactoring 等專項指引。
- `codex-system/templates/`、`docs/`：提供規格、Issue／PR／Changelog 與觀測性相關文件。

因此它的技術本質不是另一個 execution engine，而是 **Repository-level instruction architecture**。真正執行工具、修改檔案與跑測試的仍是 Codex；這套系統負責規範 Codex 在不同情境下應採用什麼工程節奏、什麼時候必須升級驗證，以及完成後應如何誠實回報。

`manifest.json` 顯示目前產品版本為 `1.3.2`、edition 為 `ZH-TW`，並明確標記本地化策略為「繁體中文使用者文件；已驗證的 Runtime Instructions 維持英文」。這是一個刻意的版本／行為控制邊界，而不是翻譯遺漏。

## 主要功能

- **任務分類與流程路由**：依 Feature、Bug、Refactor、Setup、Review、Specialist，再結合 Complexity 與 Risk 選擇流程。
- **Simple／Standard／Complex 三級工程深度**：讓局部低風險修改保持輕量，複雜任務才進入 Spec、Review 與更完整驗證。
- **高風險升級**：針對 authentication、authorization、payments、secrets、migration、destructive operation、concurrency、production infrastructure 等類型加強要求。
- **Spec-Driven Development**：在需求有歧義或驗收條件重要時，先建立明確邊界再實作。
- **Selective TDD**：只在能形成可靠自動測試回饋的任務使用 TDD，並要求真實 RED／GREEN 證據。
- **Bug Fix Discipline**：強調 Reproduce → Root Cause → Regression Test → Minimal Fix → Verify。
- **Routing Trace**：非 Simple 任務先輸出流程選擇，增加工作方式的可觀測性。
- **Verification Contract**：強制區分真正執行成功、失敗、未執行與人工／靜態檢查。
- **專項工程指引**：依需要載入 Testing、Security、Debugging、Architecture、Refactoring、Code Review 等內容。
- **Install Once**：規則直接存在 Repository，之後一般 Codex 對話即可沿用，不需反覆貼 Prompt。

## 技術亮點

最值得參考的是 **Complexity 與 Risk 的雙軸設計**。很多 coding-agent 工作流只用「任務大不大」決定流程，但這套系統另外把高風險行為獨立拉出來，使小型授權修改也能觸發更深的安全與測試要求。這種分離比單純用檔案數量或變更行數做 routing 更接近實際工程風險。

第二個亮點是 **根規則只負責路由，細節採漸進式載入**。這比一份巨型 system prompt 更容易維護與版本化：Feature、Bug、Spec、TDD、Security 各自有明確檔案與責任，也比較容易針對單一方法更新，而不必重寫整套指令。

第三個亮點是 **把「驗證是否真的執行」提升成一級契約**。很多 Agent 回覆的主要風險不是完全不測，而是把推測、靜態閱讀或未執行命令描述成已驗證。`Passed / Failed / Not run / Manual-Static check` 與 TDD Trace 把這個問題直接變成輸出格式約束，對 AI coding 的可信度很有實務價值。

第四個亮點是 **將路由本身做成可觀測輸出**。Routing Trace 讓使用者可以看見 Agent 對任務的分類結果，並在分類錯誤時及早修正，而不是等到最後才從過度工程或驗證不足反推 Agent 當初選錯流程。

第五個亮點是 **對翻譯核心規則採保守變更策略**。繁中版沒有為了「完整中文化」直接改寫已驗證 Runtime Instructions，而是先保留英文執行層。對 Prompt／Agent policy 這類自然語言即程式行為的系統而言，這種先驗證再翻譯的態度本身很值得參考。

## 限制與風險

最直接的限制是 **目前仍屬 Beta，且 Routing Trace 的顯示並非完全穩定**。README 與 `ROUTING_VISIBILITY_TESTS.md` 都明確指出：核心 Routing Decision 已觀察到能運作，但在需要立即澄清、缺少 Repository Context 或回報 blocker 的情境中，Route block 有時不會在預期時機先出現。作者把這些案例保留成回歸測試，而沒有宣稱 100% deterministic compliance。

第二個限制是 **它本質上仍是 instruction-driven system**。Repository 沒有額外的決策執行器去硬性保證 Codex 一定依照每條 Markdown 規則行動；路由、專項指引與 Trace 最終仍依賴 host model 正確理解並遵循上下文。因此它提升的是工程紀律與可觀測性，不是形式驗證或 deterministic workflow engine。

第三個限制是 **公開驗證證據目前以 Demo 與情境式回歸案例為主**。`ROUTING_VISIBILITY_TESTS.md` 定義了模糊 Feature、高風險 Authorization、already-fixed Bug 等 prompt 與通過條件，但這些案例本身不是一個能對所有規則提供強制保證的執行框架。採用者仍應在自己的 Repository、Codex 版本與任務型態重新驗證。

第四個限制是 **專案非常新且演進快速**。Changelog 顯示 2026-08-22 發布 1.0.0，隔天已演進到 1.3.2，期間連續加入 Complexity／Risk Routing、Spec、TDD、Verification Contract 與 Routing Trace。這代表目前設計活躍，但也表示行為與文件仍可能快速變化。

第五個限制是 **授權不是一般開源授權**。GitHub metadata 的 SPDX 為 `NOASSERTION`，Repository 的 `LICENSE.md` 使用自訂 Personal & Commercial Use License，權利文字以「Purchasers may」為前提，並禁止轉售、再授權或公開重新散布工具包本身。公開可讀不等於可任意複製、修改或重新發布；實際導入前應先確認自己是否具備授權資格與適用條款。

第六個限制是 **執行層並未繁體中文化**。目前繁中版刻意保留英文 Runtime Instructions，因此若目標是研究「中文提示詞是否能維持同樣路由行為」，這個 Repository 還沒有提供對等的繁中執行層驗證。

此外，若既有專案本身已有重要 `AGENTS.md` 規則，不宜直接覆蓋。較安全的做法是把新系統視為待合併的 Repository contract，先檢查與現有架構、測試、發布、安全與所有權規則是否衝突，再決定如何整合。

## 與你的相關性

依公開技術 Profile，這個專案對 **LLM／Agent** 的相關性最高，因此 `llm_agent` 評為 5。它直接處理 coding agent 的 task routing、spec、TDD、安全、驗證、可觀測性與 Repository instructions，對設計 Agent 工作流程與約束模型行為具有直接參考價值。

對 **AI R&D** 也有高相關性，評為 4。它不處理模型訓練或推論演算法，但能改善研究原型、Agent 系統與 AI 工程專案在需求理解、修改範圍、測試證據與高風險變更上的流程可靠度。

對 **AOI × AI** 的價值主要是間接工程層，因此評為 2。它沒有影像檢測、分類、分割或製造資料流程，但若 AOI 專案大量使用 Codex 進行功能、除錯、重構與測試，這套 routing／verification 思路可以作為工程治理層參考。

對 **SillyTavern／AI RPG** 也是間接相關，評為 2。它沒有角色系統、敘事記憶或世界模型功能，但 Agent workflow、規格邊界與驗證誠實性的設計可轉用於複雜 AI 應用開發。Image Generation 幾乎沒有直接技術關聯，因此評為 1。

整體評為 4：它很貼近「如何讓 coding agent 不只會改 code，也能依風險選擇合理工程流程」這個重要問題；但目前 Beta 行為、快速版本演進與自訂授權，都降低了直接導入的確定性。

## 建議怎麼使用

目前最適合先採 **LEARN + REFERENCE + WATCH**，而不是直接把整套規則當成成熟標準導入。

可以先拆讀四個部分：根目錄 `AGENTS.md` 看整體路由；`routing/complexity.md` 與 `routing/risk.md` 看雙軸分類；`workflows/spec_driven.md`／`tdd.md` 看 optional layer 如何掛入主流程；最後看 `ROUTING_VISIBILITY_TESTS.md`，理解作者如何把 workflow observability 轉成可重複測試情境。

如果要實際試用，建議先確認自訂授權的適用資格，再在可丟棄或低風險 Repository 做小型試驗。可用 Simple 修正、模糊 Feature、高風險 Authorization、Bug regression 四類任務檢查：Route 是否選對、Route block 是否在正確時機顯示、Spec／TDD 是否只在需要時啟用、最後是否誠實區分實際執行與未執行的驗證。

若後續版本把 Routing Trace 穩定性、測試證據與授權條款進一步釐清，再重新評估是否提升為 `TRY` 或 `INTEGRATE` 會比較合理。

## 與其他收藏的關聯

- [Skills For Real Engineers](./github-mattpocock-skills.md)：兩者都位於 coding agent 的工程行為層，但組織方式不同。Skills For Real Engineers 把 TDD、除錯、code review、domain modeling 等拆成可獨立叫用與組合的 Skills；Codex Engineering System 則由 Repository 根 `AGENTS.md` 當中央 router，讓一般 Codex 任務先自動分類，再載入對應流程深度。很適合拿來比較「模組化 Skill library」與「Repository-wide adaptive policy」兩種設計。
- [DeepSeek Harness 繁體中文版](./github-g36maid-deepseek-harness.md)：DeepSeek Harness 位於更底層的 Agent Runtime／Harness，處理 model adapter、agent loop、tool execution、session、sandbox 與權限 seam；Codex Engineering System 不提供這些 runtime 能力，而是規範 Agent 在既有執行環境上應怎麼做工程。兩張卡可以一起用來區分 execution substrate 與 workflow／policy layer。

## 使用者備註


## 更新紀錄

### 2026-08-24

- 建立 Knowledge Card，整理 v1.3.2 的 Adaptive Routing、Complexity／Risk 雙軸、Spec、Selective TDD、Verification Contract、Routing Trace、繁中版本邊界，以及 Beta 與自訂授權風險。
