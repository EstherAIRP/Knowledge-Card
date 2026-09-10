---
schema_version: 1
id: github-tsun-u-memory-toolkit
title: memory-toolkit
canonical_url: https://github.com/Tsun-u/memory-toolkit
source:
  type: github
  url: https://github.com/Tsun-u/memory-toolkit
  identity: github:tsun-u/memory-toolkit
resource_kind:
  ai: skill
  user: null
created_at: 2026-09-10
updated_at: 2026-09-10
last_checked_at: 2026-09-10
summary: memory-toolkit 是一組給長期運作 AI Agent 的 Claude Code 檔案式記憶治理工具：以兩份 Skills 規範「什麼值得記、記到哪、如何寫」，再用兩支 Node.js Hooks 在記憶落檔前與對話壓縮前後強制或提醒檢查。它不提供向量資料庫或記憶檢索引擎，而是把記憶視為會被未來工作階段重讀的 prompt，重點放在品質閘門、索引預算與遺忘前的觸發時機。
classification:
  categories:
    ai:
      - RAG / Memory / Knowledge
      - Agent
      - AI Coding / DevTools
    user: null
  tags:
    ai:
      - Claude Code
      - agent-memory
      - file-based-memory
      - memory-governance
      - Agent Skills
      - hooks
      - context-compaction
      - MEMORY.md
      - prompt-design
      - PreToolUse
    user: null
relevance:
  ai:
    overall: 4
    ai_rd: 4
    aoi_ai: 1
    llm_agent: 5
    sillytavern_ai_rpg: 4
    image_gen: 1
  user: {}
actions:
  ai:
    - TRY
    - BUILD
    - LEARN
    - REFERENCE
  user: null
status:
  ai: active
  user: null
---

# memory-toolkit

## 一句話介紹

memory-toolkit 是一組針對 **Claude Code 檔案式長期記憶**的 Agent Skills 與鉤子（hook）：它不替 Agent 建立新的記憶資料庫，而是把「寫記憶」視為一種需要治理的 prompt 編輯行為，透過規則與執行時機制控制什麼值得留下、寫到哪裡，以及何時必須檢查是否快要遺失重要內容。

## 它解決什麼問題

長期運作的 Agent 很容易把「能寫進記憶」誤當成「應該寫進記憶」。結果通常不是記得太少，而是累積大量暫時狀態、重複規則、已失效錯誤、程序細節與難以理解的濃縮句，最後讓每個新工作階段反覆讀到品質不佳的提示詞。

memory-toolkit 的切入點是把記憶視為**寫給未來自己的 prompt**。因此，記憶的品質問題不只屬於資料保存，也屬於提示詞工程與軟體維護問題：哪些內容應長期存在、哪些程序應搬到 Skill、哪些故事應留在 journal、錯誤記憶要如何退役，以及索引是否已經大到新工作階段根本載不完。

專案進一步處理第二個問題：**檢查時機**。單純在寫完後提醒 Agent「記得檢查」容易被忽略；等真正發生 `compact` 才提醒，又可能已失去完整上下文。因此它使用 Claude Code hooks，在記憶落檔前先擋一次，並在上下文逼近壓縮前主動提醒。

## 核心概念

第一個核心是 **記憶治理優先於記憶擴張**。`memory-write` Skill 把內容分流成幾種不同資產：跨工作階段都有效的原則與事實才進記憶檔；程序與檢查表應進 Skill；完整故事與細節應進 journal；已經由 hook 或 Skill 承擔的內容不應再大段複製進記憶。這讓記憶層保持低重複、可維護，而不是無限制累積。

第二個核心是 **記憶內容本身會改變未來 Agent 行為**。專案因此把 Clean Code 類比帶進記憶維護：一條記憶只負責一件事、使用平常可理解的文字、盡量寫正向替代方案、規則要附上理由，錯的記憶應直接刪除而不是留下「曾經記錯」的註解。目標不是保存所有歷史，而是降低未來重讀時的錯誤促發。

第三個核心是 **`MEMORY.md` 只作索引，不作全文倉庫**。Skill 把它視為開場載入用的導航層，每一行應回答「這條記憶在講什麼、什麼時候查」，真正內容留在其他記憶檔。Hook 也會追蹤 `MEMORY.md` 大小，在接近或超過專案設定的 25 KB／200 行門檻時警告。

第四個核心是 **把檢查放到真正能改變行為的時間點**。`memory_write_check.js` 在對記憶目錄第一次 `Write`／`Edit` 前使用 `PreToolUse` 拒絕該次操作，要求 Agent 先回答四個檢查問題；同一檔案在 120 秒內重送才放行。這不是提醒訊息，而是一個實際的寫入閘門。

第五個核心是 **在壓縮前預測，而不是只依賴 `PreCompact`**。`compact_memory_check.js` 會在 `UserPromptSubmit` 時從 transcript 尾端估算目前上下文（context）用量，跨過 150k 或 800k token 警戒線時注入一次記憶檢查；`SessionStart` 的 `compact` 事件則作為壓縮後安全網。這個設計承認 hook 無法直接得知實際上下文窗口大小，因此採用可調整的絕對門檻。

## 架構與技術

Repository 非常小型，主要交付物只有兩份 Skill 與兩支 JavaScript hook：

- `skills/memory-write/SKILL.md`：定義該不該記、內容分流、記憶寫法、`MEMORY.md` 索引維護與退役規則。
- `skills/prompt-design/SKILL.md`：提供清楚、正向、附理由、偏好一般原則等提示詞設計原則，作為記憶寫作的配套檢查。
- `hooks/memory_write_check.js`：掛在 `PreToolUse`／`PostToolUse`，只處理 `.claude/projects/<專案>/memory/` 內的 `Write` 與 `Edit`。寫入前執行四問閘門，寫入後回報索引大小與同一工作階段的連續寫入次數。
- `hooks/compact_memory_check.js`：掛在 `UserPromptSubmit` 與 `SessionStart(compact)`，透過 transcript usage 估算上下文用量，在壓縮前後提醒檢查長期記憶。

兩支 hook 都只使用 Node.js 內建模組，沒有第三方套件。狀態檔放在 `~/.claude/tmp`，並會清理超過七天的舊狀態。安裝方式以檔案複製與修改 `~/.claude/settings.json` 為主，不需要額外套件管理器。

這個 Repository 的主要交付物本身就是可供 Agent 載入／掛接的可重用行為模組，因此 `resource_kind` 判定為 `skill`，而不是一般應用程式。

## 主要功能

- **記憶內容分流**：把長期原則／事實、程序、故事與已實作成 hook／Skill 的內容分到不同儲存層。
- **記憶寫入前閘門**：對記憶目錄的首次寫入先拒絕，迫使 Agent 在真正落檔前重新檢查必要性與寫法。
- **記憶寫入後監控**：回報 `MEMORY.md` 大小與行數，並在同一工作階段連續大量寫入時提醒重新檢視。
- **壓縮前預警**：根據 transcript 中的 token usage 估算上下文大小，跨過門檻時提醒先處理可能遺失的長期內容。
- **壓縮後補檢查**：若長時間 Agent 執行途中直接自動壓縮、沒有機會觸發前置提醒，`SessionStart(compact)` 會再補一次安全網。
- **提示詞自檢**：額外提供 `prompt-design` Skill，避免記憶逐步退化成冗長、負向、案例拼貼式的規則集合。
- **索引容量治理**：把 `MEMORY.md` 的載入限制轉成可觀測的警戒線，而不是等新工作階段讀不到內容才發現問題。

## 技術亮點

最值得參考的是它把 **Agent 記憶問題從「存什麼資料」改寫成「什麼資訊應成為未來提示詞」**。這和常見的向量檢索、摘要壓縮或對話資料庫方向不同：memory-toolkit 不處理召回演算法，而是處理寫入品質與長期提示詞污染。

第二個亮點是 **規則層與執行層分離**。兩份 Skill 說明「應該怎麼做」，兩支 hook 則確保某些檢查在正確時機真的發生。這種組合比只增加 System Prompt 規則更接近 guardrail：規則仍可被理解與修改，但高風險行為可以由 runtime hook 強制建立回饋迴圈。

第三個亮點是 **用預測式觸發補足上下文壓縮事件的限制**。既然真正的 `PreCompact` 無法給模型一個可以行動的回應輪，專案就從 transcript usage 提前估算「快壓縮了」，把動作搬到仍有完整內容可讀的正常對話輪。這是一個很具體的 Agent Harness 設計取捨。

第四個亮點是 **把錯誤記憶視為會持續被促發的死程式碼**。直接刪除錯誤內容、避免保留「已更正」說明，反映了這套工具對長期提示詞副作用的理解：歷史透明度不是永遠優於行為乾淨度；需要留存歷史時，應把故事放到不同層，而不是讓每次 session 都重讀。

## 限制與風險

第一個限制是 **高度綁定 Claude Code**。檔案路徑、`Write|Edit` matcher、`PreToolUse`、`UserPromptSubmit`、`SessionStart(compact)` 與 transcript 結構都依賴 Claude Code 的 hooks 與檔案式記憶慣例。若要移植到其他 Agent Harness，需要重新對應工具事件、記憶路徑與上下文計量方式。

第二個限制是 **部分門檻屬於硬編碼的經驗值**。`MEMORY.md` 的 25 KB／200 行限制，以及壓縮前 150k／800k token 警戒線，都被寫成常數。專案自己也承認 hook 無法得知實際 context window，因此不同模型、版本或產品行為改變時需要重新校準。

第三個限制是 **前置拒絕本身會增加一次工具往返**。`memory_write_check.js` 的設計刻意讓第一次寫入失敗，再依 120 秒通行窗口允許同檔重送。這能提高檢查強度，但也意味著 host agent 必須能正確理解拒絕原因並重試；若工具呼叫策略不同，可能需要改寫機制。

第四個限制是 **專案仍非常早期**。Repository 建立於 2026-09-08，目前可見提交歷史只有首發與行尾設定調整；完整樹狀結構中也沒有測試套件或自動化驗證檔案。程式量小、依賴少使它容易人工審查，但在納入重要工作流前仍適合自行做跨平台與 hook 行為測試。

第五個限制是 **「值得記憶」本身帶有使用情境假設**。`compact_memory_check.js` 特別把里程碑、共同經歷、成長軌跡與情感連結列入「關係型記憶」檢查，這對長期角色／陪伴型 Agent 很有啟發，但對純企業自動化 Agent 可能需要刪減或替換成任務、決策、責任與依賴關係等更合適的記憶類型。

## 與你的相關性

依公開技術背景，這個專案對 **LLM／Agent** 的相關性最高。它提供的不是新的模型能力，而是長期 Agent 在記憶寫入、提示詞維護與 context compaction 之間如何建立工程紀律，適合作為 Agent runtime／harness 設計的參考案例。

對 **AI R&D** 也有高參考價值，尤其適合拿來拆解「語意規則應放在 Skill，還是由 hook 強制執行」這類邊界問題。它的程式碼很小，可以快速讀完後改造成自己的實驗版本。

對 **SillyTavern／AI RPG** 的概念相關性也明顯：關係型記憶、共同經歷與「壓縮前保留不可重建細節」都與長期角色一致性有關。不過現成實作是 Claude Code 專用，若用於角色 Agent，應移植其治理原則而不是直接照搬路徑與事件。

它與 **AOI × AI**、影像生成則沒有直接技術關聯。

## 建議怎麼使用

先給 `TRY`：如果手上有 Claude Code 的檔案式記憶環境，這套工具沒有第三方依賴，最適合直接複製兩份 Skill 與兩支 hook 做小規模觀察，重點測試「前置拒絕是否真的改善記憶品質」以及警戒線是否適合自己的模型窗口。

給 `BUILD`：即使不使用 Claude Code，也很值得把它抽象成自己的 Agent Harness 元件。可以把 `PreToolUse` 寫入閘門映射成「memory write validator」，把壓縮前預警映射成「context pressure trigger」，再用自己的事件系統重做。

同時給 `LEARN` 與 `REFERENCE`：這個 Repository 最有價值的是它示範了記憶治理的分層——**內容規範放 Skill、時機約束放 hook、全文與索引分離、壓縮前主動觸發**。這些原則比 Claude Code 的具體路徑更容易移植到其他長期 Agent。

## 與其他收藏的關聯

- [Skills For Real Engineers](./github-mattpocock-skills.md)：兩者都把 Agent 行為規範封裝成可重用 Skill。Skills For Real Engineers 聚焦完整軟體工程工作流程；memory-toolkit 則把範圍收斂到長期記憶與提示詞治理，並額外用 runtime hook 強制執行部分規則。
- [DeepSeek Harness 繁體中文版](./github-g36maid-deepseek-harness.md)：DeepSeek Harness 偏向 Agent 的執行基礎設施與能力邊界；memory-toolkit 則示範可以掛在 Harness 之上的記憶政策與事件型 guardrail。若要把這套概念移植到其他 Agent runtime，兩張卡可一起看。

## 使用者備註

## 更新紀錄

### 2026-09-10

- 新增 Knowledge Card，整理 memory-toolkit 的記憶分流原則、寫入前閘門、上下文壓縮預警與 Claude Code 移植限制。
