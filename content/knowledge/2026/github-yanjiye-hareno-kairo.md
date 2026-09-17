---
schema_version: 1
id: github-yanjiye-hareno-kairo
title: kairo・迴廊
canonical_url: https://github.com/yanjiye-hareno/kairo
source:
  type: github
  url: https://github.com/yanjiye-hareno/kairo
  identity: github:yanjiye-hareno/kairo
resource_kind:
  ai: project
  user: null
navigation:
  categories:
    ai:
      - Agent / Harness
      - Memory / RAG / Knowledge
      - AI Coding / DevTools
    user: null
created_at: 2026-09-17
updated_at: 2026-09-17
last_checked_at: 2026-09-17
summary: kairo・迴廊是建立在 forge-reload 之上的 Claude Code 長會話續接實踐層：把近期對話原文與 thinking blocks 搬入新 session、重建 parentUuid 鏈，再以滾動摘要、交接便籤、必讀檔案 hook、雙剪防護與回滾紀錄降低跨 context window 的失真。它不是官方 Claude Code 功能，而是依賴本機 jsonl 儲存格式的社群方法與腳本集合。
classification:
  categories:
    ai:
      - LLM
      - Agent
      - RAG / Memory / Knowledge
      - AI Coding / DevTools
    user: null
  tags:
    ai:
      - claude-code
      - context-continuity
      - session-migration
      - long-context
      - agent-memory
      - handoff
      - rolling-summary
      - jsonl
      - parentUuid
      - thinking-blocks
      - lifecycle-hooks
      - forge-reload
      - context-compaction
      - Node.js
      - PowerShell
    user: null
relevance:
  ai:
    overall: 5
    ai_rd: 4
    aoi_ai: 1
    llm_agent: 5
    sillytavern_ai_rpg: 4
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

# kairo・迴廊

## 一句話介紹

`kairo`（迴廊）是一套針對 **Claude Code 長會話跨 context window 續接**的實踐方法與腳本集合：它沿用 `forge-reload` 的近期原文搬移機制，再加入滾動摘要、交接便籤、`--inject` 交接包、必讀檔案 hook、雙剪防護與多窗辨識等流程，把「長對話快滿時怎麼安全換 session」從人工習慣整理成可重複執行的工作流。

## 它解決什麼問題

Claude Code 長時間工作後會碰到 context window 上限。一般壓縮可以繼續工作，但歷史會被濃縮成摘要；對需要保留近期工程細節、工具脈絡、說話風格或角色連續性的使用情境而言，單純摘要可能把重要局部資訊壓掉。

`kairo` 的切入點不是建立一個外部向量記憶庫，而是直接利用 Claude Code 儲存在 `~/.claude/projects/<slug>/<session-id>.jsonl` 的本機 session 資料：從舊 session 尾部保留一段近期原文，重新建立事件鏈與新的 session id，再透過 `claude --resume` 接續。較早、無法完整保留的資訊則交由持續演化的滾動摘要與本次交接便籤補足。

因此它實際上把長期連續性拆成兩層：**近期資訊盡量保留原文，遠期資訊逐步壓成可維護的摘要**。這和「每次都把所有歷史重新摘要」或「只靠 Claude Code 原生 compaction」的策略不同。

## 核心概念

第一個核心是 **近期原文續接，而不是只傳摘要**。`forge-reload.js` 會讀取 Claude Code 的 session `jsonl`，從尾端依目標 token 數量尋找切點，把保留區段寫成新的 session。專案特別保留 `thinking` blocks，並重建每個事件的 `uuid`／`parentUuid` 鏈；寫入前也會檢查新檔能否逐行解析以及 parent chain 是否連續。

第二個核心是 **近細遠粗的滾動摘要**。每次穿越 session 時，不從零重寫整份摘要，而是新增本輪的「近段」，再把上一輪較舊內容逐步壓入「遠段」。專案的理由是避免多輪「摘要的摘要」持續複製誤差，同時把有限篇幅留給最近、最可能再次用到的資訊。

第三個核心是 **交接包必須由舊 session 在還記得時寫完**。方法論把交接拆成滾動摘要與本次便籤，再以 `--inject` 合成新 session 的第一段內容。便籤優先記錄「對方此刻」與進行中工作，目的是讓新 session 不只知道歷史事件，也知道上一個 session 在哪個狀態停下。

第四個核心是 **開機規則用程式攔，不依賴模型自覺**。`hooks/must-read-gate.js` 掛在 Claude Code 的 `PostToolUse` hook；當它偵測 session 內有 `<forge-handoff>` 時，會掃 transcript，確認 `must-read.json` 指定的檔案是否真的被 `Read`。只要還缺檔案，hook 就以非零結束碼提醒，直到全部讀過為止。這把「新 session 要重讀人格、規約或記憶原文」從提示詞習慣升級成可檢查的 gate。

第五個核心是 **把多窗與重複續接視為狀態一致性問題**。專案透過 `~/.claude/forge_history.json` 記錄 old/new session id，並加入同一舊 session 已 forge 過就拒絕再次剪切的防護；方法論也要求新窗先核對自己是否為最新的正確 session，以降低多個視窗都自認為是最新狀態的情況。

## 架構與技術

Repository 的結構很小，核心由幾個可直接閱讀與修改的檔案組成：

- `forge-reload.js`：Node.js CLI，負責找 session、估算 token、挑選切點、選擇近期事件、降採樣過大的工具輸出、清理歷史圖片 base64、重建事件鏈、產生新 session 與記錄歷史。
- `hooks/must-read-gate.js`：Claude Code hook，檢查隧道 session 是否已讀完指定檔案。
- `hooks/must-read.json`：必讀檔案清單範例。
- `scripts/wake-latest.ps1`：Windows／PowerShell 配套腳本，用於喚回最新 session。
- `docs/methodology.md`：完整操作方法論與實戰規則。
- `docs/DESIGN.md`：切點、token 估算、交接包與 context 管理設計說明。
- `docs/TUTORIAL.md`：從備份、dry-run、正式 forge 到回滾的上手教程。
- `docs/54-tunnels.md`：以多次實際操作事故整理出的踩坑紀錄。

`forge-reload.js` 不依賴大型框架，主要使用 Node.js 內建的 `fs`、`path`、`crypto`、`os`。教程要求 Node.js 16 以上，並以本機已安裝 Claude Code 為前提。

切點演算法不是單純從 token 上限硬切。它先由尾端反向累加估算量，找到接近 `retain` 的位置，再向前與向後尋找最近的「真實 user 訊息」作為候選邊界，最後選保留量較接近目標的一側。`<forge-handoff>`、保活訊息或其他可設定 marker 則能排除，避免新 session 的第一幕落在系統注入而不是真實對話。

對大量工具輸出的工程 session，`--squash-tools` 會在 token 估算前裁剪過長 `tool_result`／`tool_use` 文字，只保留頭尾內容；圖片 base64 也會轉成文字佔位，避免歷史媒體把新 session 檔案與估算撐大。最後一個真實 user turn 會被保護，不參與這種降採樣。

## 主要功能

- **Dry-run 預演**：先計算候選切點、預估保留量與新 session id，不直接改動 session。
- **可調式原文保留量**：透過 `--retain` 指定希望搬入新 session 的近期 context 規模。
- **Thinking block 保留**：近期 assistant thinking 會隨原文事件一併保留，而不是只搬一般文字。
- **Parent chain 重建與驗證**：重新建立 `parentUuid` 關係，並在寫入前做 parse／chain 自檢。
- **交接包注入**：`--inject` 可把滾動摘要與便籤放到新 session 開頭。
- **工具輸出降採樣**：`--squash-tools` 減少超長工具結果造成的切點死區。
- **切點黑名單**：`--skip-markers` 排除保活、系統提示或其他偽 user 訊息。
- **雙剪防護與歷史紀錄**：使用 `forge_history.json` 保存新舊 session 對照並阻止一般情況下重複剪同一 session。
- **必讀檔案 gate**：在新 session 中用 hook 驗證指定檔案是否真的被讀取。
- **可回滾**：流程採新建 session，不刪除舊 `jsonl`；出問題時可以重新 resume 舊 session。

## 技術亮點

最值得參考的是它把 **context continuation 分成「資料搬移」與「語意交接」兩條路徑**。近期資訊直接保留原文，避免所有內容都經過摘要；更早的資訊則由模型在仍擁有完整脈絡時主動整理成可長期累積的摘要。這是一種介於 full transcript replay 與純 long-term memory 之間的折衷。

第二個亮點是 **將 context 邊界視為可驗證的資料結構問題**。它不只剪文字，而是處理 Claude Code session 事件、`uuid`、`parentUuid`、偽 user 事件、工具輸出與圖片等細節，並在新檔寫入前進行鏈結自檢。對研究 Coding Agent session／resume 機制而言，這些實作比單純「做一份摘要」更有參考價值。

第三個亮點是 **把「記得要做」改成 hook gate**。很多 Agent continuity 方法把「開新 session 時重讀規約」寫在提示詞裡，但提示詞本身也可能隨長上下文被忽略。`must-read-gate.js` 直接檢查 transcript 中是否真的發生過 `Read` tool call，讓啟動流程具有機械性的完成條件。

第四個亮點是 **以事故反推制度**。雙剪防護、切點 marker、PowerShell settings 必須走檔案路徑、先真跑再把新 id 給後續自動化等規則，都不是抽象架構圖，而是從實際長期操作累積的 failure mode 整理而來。對設計 Agent harness 的 session lifecycle、handoff 與恢復流程很有借鏡價值。

## 限制與風險

最大的限制是：**這不是 Claude Code 官方支援的 session migration API**。專案自己明確把它描述為社群 hack，核心成立條件是 Claude Code 目前使用可直接讀寫的本機 `jsonl`，且 `claude --resume` 能接受經重建的 session。只要 Claude Code 改變檔案格式、事件結構、驗證方式或 thinking block 表示法，腳本就可能失效。因此使用前應先備份，Claude Code 升級後也應重新 dry-run 驗證。

第二，這套方法會直接處理完整對話、工具輸出、thinking blocks 與交接摘要。這些內容可能包含原始碼、路徑、憑證片段或其他敏感資料。尤其方法論建議把摘要與便籤放進 Git 版控時，使用者必須自行判斷哪些內容可以被提交、Repository 是否為私人，以及是否需要額外脫敏；「能被長期保存」不代表「適合被提交」。

第三，token 計算是啟發式估算。專案依實際 session 校準 CJK／ASCII／圖片與事件開銷，來源宣稱其實測誤差可壓在約 ±5%，但這屬於該專案的經驗值，不是 Claude Code 官方 tokenizer 契約，也不應視為跨版本保證。

第四，`thinking` blocks 的保留對續接可能有幫助，但這同樣高度依賴 Claude Code 當前 session 結構與產品行為。若官方未來改變推理內容的儲存或恢復方式，這項設計可能需要重寫。

第五，目前 Repository 更像一套「實戰方法論＋可讀腳本」而非封裝完成的軟體產品。根目錄可看到文件、單一核心 JS、hook 與 PowerShell 腳本，但沒有 `package.json`、自動化測試或 CI workflow；因此成熟度主要來自作者描述的長期實戰使用，而不是完整的測試矩陣、版本化套件或跨平台自動回歸驗證。

最後，README 與文件大量使用「人格」「靈魂」「回家」等敘事語言來描述 AI 夥伴的連續感。這是專案的方法論與使用體驗 framing，不應被解讀成模型在技術上擁有跨 session 的主體連續性；工程上真正能驗證的是被保留／注入的資料與 session 行為。

## 與你的相關性

依公開技術背景，`kairo` 對 **LLM／Agent** 最直接：它提供一個很具體的 Coding Agent context lifecycle 案例，涵蓋 session、handoff、context 壓縮、原文保留、hook gate 與恢復策略，適合拿來思考「長時間 Agent 到底該怎麼換 context」。

對 **AI R&D** 而言，價值主要在工程實驗與方法設計，而不是模型訓練本身。它很適合拿來比較 transcript replay、摘要記憶、RAG／長期記憶與 runtime hook 各自負責哪一層。

對 **SillyTavern／AI RPG** 也有中高參考價值，因為專案特別關注跨 session 後的語氣、角色規約與近期互動連續性；雖然它只能直接操作 Claude Code session，不能直接套用到 SillyTavern，但「近期原文＋遠期滾動摘要＋啟動時重讀核心檔」是一個可轉譯到角色型 Agent 的記憶設計模式。

它與 AOI／電腦視覺、影像生成本身沒有直接技術關聯，因此這兩個面向評分較低。

## 建議怎麼使用

建議先把它當成 **可實驗的 Agent continuity 參考實作**，而不是直接接管重要工作 session。

`TRY` 的方式最好是在可丟棄的 Claude Code 測試專案先跑：備份 `~/.claude/projects`，使用 `--dry-run` 觀察切點，再建立新的 forge session，實際確認 `resume`、工具歷史與上下文是否符合預期。Claude Code 每次重大升級後都應重新做一次這種驗證。

`LEARN` 的重點不是複製所有敘事規則，而是研究幾個可移植的設計：近期原文與遠期摘要分層、handoff hard gate、真實 user boundary、工具輸出降採樣、session identity、防重複遷移與啟動必讀檔案 gate。

`REFERENCE` 則適合用在設計其他 Agent harness、角色型 Agent 或長期工作代理時，拿它和外部記憶／RAG 系統比較：哪些資訊應留在 session 原文、哪些應進 durable memory、哪些必須在 runtime 啟動時重新取得權威原文。

## 與其他收藏的關聯

- [ai-memory](./github-akitaonrails-ai-memory.md)：兩者都處理 Coding Agent 的跨 session 連續性，但 `ai-memory` 把記憶抽到 Agent 外部，以 Git 版控 wiki、SQLite／FTS／graph／vector retrieval 與 lifecycle hooks 建立跨多種 Agent 的長期記憶；`kairo` 則更貼近 Claude Code 本機 session，優先搬移近期原文並補上人工定義的交接流程。
- [DeepSeek Harness 繁體中文版](./github-g36maid-deepseek-harness.md)：DeepSeek Harness 關注完整 Agent runtime、session event log、工具與 plugin seam；`kairo` 可以視為 session lifecycle／context rollover 這個局部問題的實戰案例，兩者適合拿來比較「runtime 原生支援」與「在既有 Coding Agent 上外掛續接機制」的差異。
- [Claude Code Hidden Settings](./github-charliie-dev-claude-code-hidden-settings.md)：兩張卡都深入 Claude Code 非表面層的行為。Hidden Settings 研究設定與 runtime control surface，`kairo` 則依賴本機 session 儲存格式與 `resume` 行為；共同風險都是對 Claude Code 內部／非穩定介面的依賴需要做版本驗證。

## 使用者備註

## 更新紀錄

### 2026-09-17

- 建立 Knowledge Card，整理 `kairo` 的 Claude Code 長會話續接方法、`forge-reload.js` 機制、交接方法論、必讀 hook、限制與相關收藏。
