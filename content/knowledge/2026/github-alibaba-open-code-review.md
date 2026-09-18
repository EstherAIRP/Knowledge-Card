---
schema_version: 1
id: github-alibaba-open-code-review
title: Open Code Review
canonical_url: https://github.com/alibaba/open-code-review
source:
  type: github
  url: https://github.com/alibaba/open-code-review
  identity: github:alibaba/open-code-review
resource_kind:
  ai: project
  user: null
navigation:
  categories:
    ai:
      - AI Coding / DevTools
      - Agent / Harness
    user: null
created_at: 2026-09-18
updated_at: 2026-09-18
last_checked_at: 2026-09-18
summary: Open Code Review 是 Alibaba 開源的 AI 程式碼審查 CLI，以「確定性工程流程 × Agent」混合架構處理檔案選擇、分組、規則匹配、評論定位與反思，再由具工具使用能力的 Agent 動態探索程式碼脈絡；支援多模型、Coding Agent 整合、CI/CD、SARIF、MCP 擴充與 Delegation Mode，重點是把 Code Review 從單純 Prompt 提升成可約束、可分工、可觀測的專用工程系統。
classification:
  categories:
    ai:
      - AI Coding / DevTools
      - Agent
      - LLM
    user: null
  tags:
    ai:
      - AI Code Review
      - Coding Agent
      - CLI
      - Deterministic Engineering
      - Git Diff
      - Review Rules
      - Sub-Agent
      - Delegation Mode
      - MCP
      - SARIF
      - CI/CD
      - OpenTelemetry
    user: null
relevance:
  ai:
    overall: 5
    ai_rd: 4
    aoi_ai: 2
    llm_agent: 5
    sillytavern_ai_rpg: 1
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

# Open Code Review

## 一句話介紹

Open Code Review 是 Alibaba 開源的 AI 程式碼審查 CLI。它不是只把 `git diff` 丟給通用 Coding Agent，而是先用確定性工程邏輯控制審查範圍、檔案分組、規則匹配、評論定位與後處理，再把需要語意判斷與動態脈絡探索的部分交給具工具使用能力的 Agent。

專案提供 `ocr review` 做差異審查，也有 `ocr scan` 做整檔／整個 Repository 掃描；可獨立配置 LLM，也能透過 Delegation Mode 把實際審查交給 Claude Code、Codex 等宿主 Agent，由 OCR 保留檔案選擇與規則解析等工程層。

## 它解決什麼問題

通用 Coding Agent 可以做 Code Review，但大型 changeset 常會遇到三個工程問題：模型可能選擇性閱讀而造成覆蓋不穩定、評論對應的檔案／行號可能漂移，以及自然語言 Skill 對流程的約束容易隨 Prompt 細節波動。

Open Code Review 的切入點是把「不能靠模型臨場發揮的步驟」移出 Agent。哪些檔案要審、哪些要排除、哪些檔案應該一起看、哪一組規則套到哪個檔案、評論應該落在哪一行，以及評論產出後要不要再做反思與驗證，都由專用工程模組處理；Agent 則專注在風險判斷、搜尋脈絡、跨檔理解與提出 finding。

這讓它比較接近一個專門的 Code Review harness，而不是「一份 Code Review Prompt」。目標不是讓模型做更多事，而是縮小模型必須自行決定的範圍，讓品質、成本與位置精度更可控。

## 核心概念

### 確定性工程 × Agent

README 把核心設計明確定義為 deterministic engineering 與 Agent 的混合架構。

確定性部分負責精準檔案選擇、智慧檔案分組、細粒度規則匹配，以及獨立的評論定位與反思模組。需要語意推理的部分才交給 Agent，並搭配為 Code Review 調整過的 Prompt 與工具集。

這個邊界很重要：系統不是要求 LLM 同時扮演工作流管理器、檔案路由器、規則引擎、定位器與審查者，而是把可程式化的責任固定下來。

### 分組後的隔離子 Agent

相關檔案可以先被組成同一個 review unit，每個 group 再用隔離脈絡執行子 Agent。對大型 changeset，這是一種分治策略：避免把所有 diff 塞進單一對話，同時可以平行處理不同群組。

程式碼中的 grouping 邏輯還會考慮 token budget；分組過大時可退回 per-file group。這代表「分組」不是純 LLM 決策，而是有明確 fallback 與資源限制。

### 規則路由，而不是把所有規則塞進 Prompt

OCR 會依檔案特性匹配 Review Rules。Skill 文件顯示規則可由 `--rule`、Repository 的 `.opencodereview/rule.json`、使用者全域規則與內建預設分層解析。

這種做法把 Code Review 規範變成可版本控制、可針對路徑套用的資料，而不是每次要求模型自己從一大段通用規則中找重點。

### 評論定位與反思獨立於主 Agent Loop

專案把 comment positioning、re-tracking、reflection、suggestion validation 等後處理放到獨立 worker pool，避免主 LLM tool-use loop 被阻塞。網站原始碼描述評論定位採多階段策略，反思模組則用來攔截幻覺與知識漂移。

這是典型的 harness 思路：生成 finding 與驗證 finding 不必綁在同一條模型輸出路徑。

### Delegation Mode 分離「審查框架」與「模型使用權」

一般模式由 OCR 自己呼叫設定好的 LLM。Delegation Mode 則由 OCR 決定檔案與規則，再把結構化任務交給宿主 Coding Agent 執行，因此不需要另外替 OCR 配置 API key。

這讓 Claude Code、Codex 等既有 Agent 可以保留自己的模型與工具迴圈，同時借用 OCR 的 scope、rules 與 review engineering。

## 架構與技術

核心程式以 **Go 1.25.5** 開發，CLI 使用 Cobra；終端互動介面使用 Bubble Tea／Bubbles／Lip Gloss。`go.mod` 同時包含 Anthropic SDK、OpenAI Go SDK、AWS SDK、MCP Go SDK 與 OpenTelemetry 套件，對應多模型、外部工具與可觀測性能力。

主要技術層可整理為：

- **Git／Diff 層**：依 workspace、branch range、commit 等模式取得審查範圍，也支援整檔 `scan`。
- **Scope 與 Grouping 層**：先過濾檔案，再依 changeset 與 token 條件分組，必要時退回 per-file。
- **Rules 層**：依檔案路徑與規則設定解析實際 review instructions。
- **Agent 層**：使用專用工具讀檔、搜尋程式碼、查看其他變更檔案並執行多輪審查。
- **Comment pipeline**：行號追蹤、重新定位、reflection、suggestion validation 由額外 worker pool 處理。
- **Provider 層**：支援 Anthropic Messages、OpenAI Chat Completions／Responses、AWS Bedrock 等協定與多種預設 provider，也可接自訂 endpoint。
- **MCP 擴充**：文件明確描述 OCR 可作為 MCP client，把外部 MCP server 的工具加入 review agent；Roadmap 另外把對外暴露 OCR review capability 的 MCP server 列在 current state，但兩份文件的命名角度略有差異，實際採用時應以當前 CLI／官方文件確認。
- **可觀測性**：整合 OpenTelemetry，並有 session viewer 供瀏覽與回放 review session。
- **發佈層**：主要執行檔是 Go binary，npm 套件 `@alibaba-group/open-code-review` 作為跨平台安裝與啟動入口。

Repository 也附帶 Claude Code、Codex、Cursor、Kimi Code 等 Agent 整合與可攜式 Skill。這些整合的本質是呼叫本機 `ocr` CLI，而不是在每個宿主上重新實作一套 Review Engine。

## 主要功能

- `ocr review`：審查 staged、unstaged、untracked 變更，或指定 branch range／commit。
- `ocr scan`：不依賴 Git diff，直接掃描整個 Repository、目錄或指定檔案。
- `ocr review --resume`：續接中斷的 range／commit review session。
- 自訂 Review Rules 與路徑匹配，可預覽實際套用規則。
- 文字、JSON、SARIF 等輸出格式，便於人類閱讀、Agent 後處理與 Code Scanning。
- 依 severity 與 category 輸出結構化 finding，並可附修正建議。
- 多 Provider LLM 設定與自訂模型 endpoint。
- Delegation Mode：讓宿主 Coding Agent 使用自己的 LLM 執行實際審查。
- Claude Code、Codex、Cursor、Kimi Code 等整合。
- GitHub Actions、GitLab CI 等 CI/CD 使用情境。
- MCP 工具擴充與 OpenTelemetry 可觀測性。
- Session Viewer：以本機 Web UI 檢視、回放與整理審查結果。

## 技術亮點

### 把 Agent 不穩定的部分改成工程不變量

最值得研究的不是「它會 Code Review」，而是它清楚切分哪些責任不該交給 LLM。Scope、grouping、rule routing、line positioning 都是容易驗證的工程問題；如果仍交給自然語言 Agent 自由決定，就會把可消除的隨機性重新帶回系統。

這與一般 Skill 的差異很明顯：Skill 多半是在模型前面增加指令，而 OCR 直接增加一層執行架構。

### 子 Agent 分治不是目的，Context 邊界才是重點

每個 file group 使用隔離脈絡，使大型變更可以分批、平行審查。這不只解決速度，也限制單一 Agent 必須同時追蹤的資訊量。再配合 token budget 與 fallback，讓 context engineering 變成程式邏輯的一部分。

### Finding 產生與後處理解耦

評論定位與 reflection 不必占用主 Agent 的 critical path，這使系統可以在 LLM 繼續工作的同時非同步處理 comment post-step。對長時間 Agent pipeline，這種 worker pool 設計同時改善 latency 與模組可測試性。

### Delegation Mode 是很實用的 Harness 分層案例

OCR 可以只負責「審查框架」，而把 reasoning engine 交給外部 Coding Agent。這證明 harness 不一定要連模型執行都自己包辦；只要能穩定提供 scope、rules、context 與輸出契約，就可以把宿主 Agent 當成可替換的推理後端。

### Benchmark 至少揭露了它的取捨方向

README 公布的 AACR-Bench 由 50 個熱門開源 Repository、200 個真實 Pull Request、10 種語言與 1,505 個人工標註問題組成，並稱經 80+ 資深工程師交叉驗證。

專案宣稱在相同底層模型下，相較通用 Claude Code 具有更高 Precision 與 F1、約使用 1/9 token 且更快，但 Recall 較低。這是專案方自己的 benchmark，不能當成獨立第三方結論；不過它清楚反映產品設計選擇：寧可少報，也希望降低 false positive 與 review noise。

## 限制與風險

第一個風險是 **原始碼與 Diff 的資料邊界**。一般模式會把需要審查的程式碼脈絡送到設定的 LLM provider；若 Repository 含機密程式碼，必須確認 provider、endpoint、資料保留政策與網路邊界。自訂／私有 endpoint 或 Delegation Mode 可以改變這條資料路徑，但不等於自動消除所有隱私風險。

第二個限制是 **Precision 優先會犧牲 Recall**。專案自己的 benchmark 就明確承認 Recall 低於通用 Agent，因此它不應被解讀成「一定找到所有問題」。資安、高風險變更仍需要測試、靜態分析、安全掃描與人工 Review 等其他防線。

第三個限制是 **大型 Diff 仍受 token 與 budget 約束**。Skill 文件指出，單檔 diff 過大可在 LLM 前被跳過；全域 token budget 也可能讓後續 group 不再派發，並留下 partial result。工程化 scope 可以降低遺漏，但不能突破模型上下文與成本上限。

第四個風險來自 **外部工具信任邊界**。當 review agent 連接 MCP server 或其他外部工具時，新的工具輸入、網路、憑證與資料外洩面也一起進入審查流程。對 CI 或企業環境應限制可用工具與權限，而不是因為它是「Review Agent」就給予廣泛存取權。

第五個限制是 **專案仍快速演進**。2026-09-17 仍有密集功能與修正提交，包括 token budget、增量評論去重與 viewer 改版。活躍維護是優點，但 CLI flags、整合方式與文件可能持續變動，導入 CI 前應鎖定版本並驗證升級。

第六個注意點是 **文件不同區域可能存在時序差異**。例如 Roadmap 的 H2 2026 還把 Delegate Mode 列為 planned，但目前 README 與 plugin command 已提供 Delegation Mode；這表示 Roadmap 並不一定即時反映 main 的全部已實作能力。

專案使用 Apache-2.0 授權。

## 與你的相關性

依公開技術 Profile，這個專案對 **LLM／Agent** 是核心相關，因此 `llm_agent` 評為 5。它提供一個很具體的案例：如何把通用 LLM Agent 包進具 scope、routing、context、post-processing、budget 與 observability 的專用 harness，而不是把可靠度全部寄託在 Prompt。

對 **AI R&D** 評為 4。它不是模型訓練框架，但在 Agent 系統評估、工具設計、Context Engineering、成本控制、錯誤後處理與 benchmark 方法上都有很高的工程研究價值。

對 **AOI × AI** 的直接演算法關聯較低，因此評為 2；它沒有影像檢測、分類、分割或 OCR 模型能力，但若 AI 專案需要大量程式碼與 Agent 協作開發，Code Review pipeline 仍可作為工程品質層。

對 SillyTavern／AI RPG 與影像生成沒有直接產品關聯，各評為 1。

整體評為 5，主要原因是它同時具備可直接試用的工具價值，以及很強的 Agent／Harness 架構參考價值；尤其「確定性工程處理 certainty、Agent 處理 semantics」這個分工原則具有高度可遷移性。

## 建議怎麼使用

建議先 **TRY**。可以在一個非敏感、測試完善的 Repository 安裝 `ocr`，先跑 `ocr review --preview` 確認 scope，再對單一 commit 或小型 branch range 執行 review，觀察它的 finding 品質、位置精度與 false positive。

如果結果符合需求，再 **INTEGRATE** 到 Coding Agent 或 CI/CD，但初期不要直接當成 merge gate。比較適合先用 JSON／SARIF 或 PR comment 形式當第二審查者，累積一段時間的 Precision、Recall、成本與開發者接受率後，再決定是否提升權重。

值得 **LEARN** 的重點是 grouping、rule routing、CommentWorkerPool、reflection 與 Delegation Mode，因為這些部分比特定 Prompt 更能說明「專用 Agent 系統怎麼把模型的不確定性縮到合理邊界」。

同時給予 **REFERENCE**：即使最後不採用 OCR，本專案仍很適合作為 Code Review harness、專用 Agent toolchain、context partitioning 與 deterministic/LLM hybrid architecture 的設計參考。

## 與其他收藏的關聯

- [Security Audit](./github-cloudflare-security-audit-skill.md)：兩者都把程式碼審查從單次 LLM 回答提升成具流程約束的 Agent 系統。Security Audit 專注高風險資安稽核，強調 coverage ledger、fresh verifier 與 finding 真值狀態；Open Code Review 則偏一般 Code Review Engine，強調 scope、file grouping、rule routing、comment positioning 與效率。很適合比較「專業安全稽核 harness」與「通用程式碼審查 harness」的不同可靠度設計。
- [Codex Engineering System 繁體中文版](./github-ai72dope-codex-engineering-system-zh-tw.md)：Codex Engineering System 位於 Repository policy／workflow 層，用 `AGENTS.md` 決定 Coding Agent 應採用多少規格、測試與驗證；Open Code Review 則是專門執行 Code Review 的工具與 Agent runtime。兩者可以一起用來區分「工程流程治理」與「專用 Review Engine」。

## 使用者備註

## 更新紀錄

### 2026-09-18

- 建立 Knowledge Card。
- 依 Repository resolver 確認 canonical URL、來源 identity、穩定 ID、建立模式與建議路徑。
- 主要依據 Repository metadata、README、`go.mod`、`package.json`、`ROADMAP.md`、Coding Agent plugin 文件、`skills/open-code-review/SKILL.md`、MCP／rules 相關程式與近期提交整理。
