---
schema_version: 1
id: github-cloudflare-security-audit-skill
title: Security Audit
canonical_url: https://github.com/cloudflare/security-audit-skill
source:
  type: github
  url: https://github.com/cloudflare/security-audit-skill
  identity: github:cloudflare/security-audit-skill
resource_kind:
  ai: skill
  user: null
navigation:
  categories:
    ai:
      - Agent / Harness
      - Infrastructure / Security
      - AI Coding / DevTools
    user: null
created_at: 2026-09-18
updated_at: 2026-09-18
last_checked_at: 2026-09-18
summary: Security Audit 是 Cloudflare 公開的 Coding Agent 資安稽核 Skill，將程式碼安全審查拆成偵察、覆蓋率導向漏洞探索、候選驗證、結構化結果、獨立紀錄驗證與報告六階段。它以 coverage ledger、獨立驗證 Agent、三態 finding、OS 強制沙箱與可執行 validator，將「找漏洞」從單次模型判斷轉成可追蹤、可反駁、可重跑的多 Agent 稽核流程。
classification:
  categories:
    ai:
      - Agent
      - AI Coding / DevTools
      - General Tools
    user: null
  tags:
    ai:
      - Agent Skill
      - Security Audit
      - Vulnerability Research
      - Multi-Agent
      - Coverage Ledger
      - Independent Verification
      - Sandboxing
      - Structured Findings
      - Coding Agent
      - AI Security
      - LLM Security
      - Secure Code Review
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

# Security Audit

## 一句話介紹

Security Audit 是 Cloudflare 將程式碼代理（Coding Agent）轉成**具覆蓋追蹤、獨立驗證與安全執行邊界的資安稽核 Agent** 的 Skill。它不是只提供一份漏洞檢查清單，而是把安全審查拆成六個可追蹤階段，並用結構化資料與 validator 約束「什麼可以算已確認漏洞、什麼仍只能列為待驗證」。

Cloudflare 說明這套 Skill 是其 vulnerability discovery harness 的單一 Repository 起點；後續內部系統已演進成多階段、跨大量目標的 harness，而此專案保留較容易直接安裝與研究的 Skill 版本。

## 它解決什麼問題

一般用 LLM 做安全審查，很容易出現三類問題。

第一是**覆蓋率不可知**。Agent 找到幾個可疑點後就可能提前宣告完成，但使用者很難知道哪些模組、信任邊界或攻擊類別真的看過，哪些其實完全沒碰到。

第二是**發現者自我確認**。同一個 Agent 先提出漏洞假設，再用自己原本的推理去證明它，容易產生確認偏誤；尤其當部署設定、外部服務或真正的執行結果不在 Repository 內時，模型很容易把推論說成事實。

第三是**安全測試本身可能有風險**。若 Agent 為了驗證漏洞直接執行不可信專案的 build、test、fixture、browser 或 fuzzing，等於讓受測程式碼反過來取得主機環境、憑證、網路或檔案系統能力。

Security Audit 的做法，是把這些問題變成工作流契約：先建立 architecture 與 coverage ledger，再按 ledger 分派 hunter；候選結果必須交給新的 verifier 嘗試推翻；無法在安全邊界內確認的結果不能硬升級成漏洞，而是保留為 `needs_validation`；需要執行目標程式碼時，則要求 OS 層級沙箱。

## 核心概念

### Guidance 與 Full Audit 分離

Skill 預設是 guidance mode。一般資安問題、特定 finding 調查或局部 review，只載入需要的方法，不會自動建立完整報告或跑完六階段。

只有使用者明確要求完整 audit、pen-test、end-to-end review，或要求正式報告成品時，才進入 full audit mode。這個切分避免「載入 Skill」就等於授權 Agent 執行大量檔案寫入、子 Agent 與安全測試。

### Coverage Ledger 把覆蓋率變成狀態

完整稽核會先建立 `coverage-ledger.json`，把系統表面、信任邊界與攻擊類別拆成可追蹤單位。Hunter 不是自由漫遊，而是從 ledger 單位取得工作；每輪之後還會由 coverage critic 尋找遺漏、重疊或沒有真正完成的區域。

這使「我們有檢查安全性」變成可稽核狀態，而不是一段報告中的模糊敘述。

### 發現者與驗證者必須分離

每個獨立候選 finding 都交給**新的 verifier**，而 verifier 的任務不是幫忙證明，而是盡可能推翻它。到了最終紀錄階段，又會再由新的 Agent 驗證報告中的來源與結論；若紀錄被實質替換，還需要再次驗證。

這個設計把對抗式驗證（adversarial validation）直接嵌入多 Agent orchestration，而不是只提醒同一個模型「再想一次」。

### 三態 Finding，而不是真假二分

`findings.json` 使用三種 verdict：

- `confirmed`：已有完整來源追蹤與受控、可觀察的結果。
- `needs_validation`：存在具體、來源支撐的安全假設，但仍缺少一個明確事實；不給 severity。
- `rejected`：候選已被驗證流程推翻。

這個設計的重要性在於「不確定」本身有正式位置。Agent 不需要為了產出看起來完整的報告，把部署外資訊、供應商行為或猜測補成已確認漏洞。

### 重跑是累積覆蓋，不是重置結果

多次執行會讀取先前的 coverage ledger 與 findings，重新檢查已變更的來源、保留仍有效的證據，並把舊的 blocked、deferred、out-of-scope 或 needs-validation 項目重新納入目前工作。

因此重跑的目的不只是「再問模型一次」，而是利用歷史狀態找上一輪沒完成的區域。官方 README 也明確指出，單一 run 不應被視為完整涵蓋所有漏洞。

## 架構與技術

Repository 的主要交付物位於 `skills/security-audit/`，因此這張卡判定為 `skill`，不是獨立掃描器或 SaaS。

主要組成包括：

- `SKILL.md`：定義觸發條件、guidance/full audit 模式、核心安全原則、profile、budget 與完整六階段流程。
- `RECONNAISSANCE.md`：建立架構、信任邊界與 deterministic coverage units。
- `HUNTING.md`：規範 hunter、coverage critic、候選輸出與驗證邊界。
- `VALIDATION-AND-REPORTING.md`：處理候選驗證、最終紀錄驗證與報告產生。
- 多份 attack-class companion：涵蓋 AI/LLM、Web protocol/auth、client-side、供應鏈、cloud/deployment、RPC/messaging、資源耗盡、資料隔離與生命週期、desktop/mobile/local IPC，以及 memory safety/native binary。
- `report-schema.json`：定義 `findings.json` 的三種 verdict 結構。
- `validate-findings.cjs` 與 `validate-coverage-ledger.cjs`：以 Node.js 執行、無額外套件依賴的結果與 coverage validator，並附測試檔。

完整 audit 的共享輸出包含 `run-metadata.json`、`architecture.md`、`coverage-ledger.json`、`findings.json`、`REPORT.md`、`FINDINGS-DETAIL.md` 與 `NEEDS-VALIDATION.md`。Parent Agent 是共享狀態唯一寫入者；hunter 與 verifier 各自使用隔離的 scratch/artifacts 目錄。

Skill 本身刻意採 agent-neutral 的術語，不綁定特定 Agent Host，但宿主至少需要工具使用與平行子 Agent 能力；若要做動態驗證，還需要能真正提供 OS 強制隔離的沙箱。

## 主要功能

- 對 Repository、API、service、CLI、library、daemon 等程式碼執行來源優先的安全稽核。
- 先做 architecture mapping 與 trust-boundary reconnaissance，再建立 coverage ledger。
- 依 coverage unit 分派隔離 hunter，並由 coverage critic 尋找漏查區域。
- 將每個獨立候選交給新的 verifier 嘗試反駁。
- 用 `confirmed`、`needs_validation`、`rejected` 保存不同確定程度，而不是把所有可疑點混成漏洞清單。
- 以 JSON Schema 與兩支 validator 檢查 findings 與 coverage ledger 的結構、唯一性與狀態約束。
- 提供 `quick`、`standard`、`deep` 三種 audit profile，也能做 scoped run。
- 支援 Agent invocation budget；預算不足時會保留 critic 與 validation 成本，並把未完成範圍明確標為 deferred/incomplete，而不是默默降低證據標準。
- 利用 prior run 做來源變更比對、finding revalidation 與覆蓋補強。
- 針對 AI/LLM 系統額外檢查 prompt injection、RAG/記憶污染、跨 session/tenant 洩漏、tool argument injection、confused deputy、approval binding、MCP 身分與工具信任等攻擊面。
- 最終由已驗證 structured records 產生面向不同讀者的報告，而不是讓最後一個 Agent 重新自由改寫安全結論。

## 技術亮點

### 把「安全稽核覆蓋率」資料化

很多 Agent 安全審查只有輸出 finding，沒有保存「沒找到問題的區域究竟檢查到什麼程度」。Security Audit 把 coverage ledger 提升成第一級成品，並用 deterministic unit、attempt provenance、critic wave 與 validator 管理它。

這種模式不只適用於資安，也很值得借用到測試、Code Review、資料品質檢查或大型 Agent research：不要只保存答案，也保存「有哪些工作單位被處理、證據是什麼、還缺哪裡」。

### 把獨立驗證做成架構，而不是 Prompt 口號

「請重新檢查答案」仍然是同一份上下文、同一條推理路徑。這個 Skill 直接用不同 Agent 身分切斷發現與驗證，並要求 verifier 主動反駁 finding。最終紀錄還有另一層 fresh verification。

這是一個很典型的 Agent harness 設計：模型能力之外，再用 orchestration 降低單一 Agent 的偏誤與錯誤傳播。

### 不確定性有正式資料結構

`needs_validation` 不是「低信心漏洞」，而是明確記錄目前缺少哪個事實以及安全的下一步驗證方式，而且不配置 severity。這可以避免「有點可疑」在多輪摘要後逐步漂移成「已確認高風險」。

### 沙箱要求被放進 Finding 真值判定

Skill 不允許為了取得動態證據而任意執行目標程式碼。若要執行受測 target，必須沒有外網、使用乾淨 allowlist environment、限制 CPU/記憶體/程序/檔案/時間、target/toolchain 唯讀，且 target 只能寫入指定 scratch。

更重要的是：**如果這些控制無法保證，就不執行**。因此執行能力不足會使結果停在 `needs_validation`，而不是偷偷降低安全標準。

### Skill 不只是 Markdown，還有可執行契約

雖然工作流主要以 Markdown 描述，但 coverage ledger 與 findings 不是只靠模型「照格式輸出」，而是配有 JSON Schema、validator 與測試。這讓部分關鍵狀態可以被程式驗證，是它與純 Prompt 型安全 Skill 的重要差異。

## 限制與風險

- **依賴宿主的多 Agent 能力**：發現者／驗證者分離、coverage critic 與 fresh verification 都需要宿主真的能建立隔離任務；若平台只是用同一個上下文模擬角色，獨立性會降低。
- **完整 Audit 成本不低**：偵察、hunter waves、critics、candidate verifier 與 final verifier 都會消耗 Agent invocation。大型 Repository 若要求 deep profile，成本與執行時間可能明顯高於單次 code review。
- **嚴格沙箱不是每個環境都有**：只靠 Docker 指令、提示詞或工作目錄約定，不必然等同 Skill 要求的 OS-enforced isolation。無法滿足安全條件時，動態證據會合理地留在 `needs_validation`。
- **不保證找完所有漏洞**：coverage ledger 能誠實描述檢查範圍，但不能把有限的 Agent 探索變成形式化完整證明。專案本身也強調 repeated runs 可以補充單次執行沒有找到的問題。
- **Repository 外的事實仍需要擁有者驗證**：反向代理、IAM、實際部署拓撲、瀏覽器 header、供應商政策或 production identity 若不在來源中，Skill 不會自行假設它們存在或不存在。
- **Skill 是安全工作流，不是現成 SAST 引擎**：它能調度來源分析與局部動態驗證，但不取代專門的 compiler analysis、fuzzer、SAST/DAST 或供應商掃描工具；真正強項是把不同證據納入一致的 Agent 稽核流程。
- **安裝第三方 Skill 本身也是供應鏈決策**：此 Repository 由 Cloudflare 公開且採 MIT 授權，但任何能影響 Coding Agent 工具使用、檔案與命令行為的 Skill，都應在高權限環境使用前先審查版本與內容。

## 與你的相關性

依公開技術 Profile，這個專案對 **LLM／Agent** 屬於核心相關。它直接示範多 Agent orchestration、工具執行安全、對抗式 verifier、狀態化 coverage 與結構化結果如何組成一個較可靠的 Agent harness，因此 `llm_agent` 評為 5。

對 **AI R&D** 也有高度參考價值。即使不做資安研究，coverage ledger、獨立驗證、三態 verdict、budget reservation、prior-run revalidation 都可以轉用到模型評測、研究 Agent、資料驗證與其他需要「不能只相信第一次答案」的工作流，因此評為 4。

對 **AOI × AI** 的直接演算法關聯較低，沒有物件偵測、分類、分割或 OCR 能力；但如果 AOI 系統包含 API、Agent、自動化服務、部署與資料隔離，它可以作為安全審查方法，因此評為 2。

對 SillyTavern／AI RPG 與影像生成則不是主要定位，各評為 1。

整體評為 5，主要價值不只在「讓 Agent 找漏洞」，而是提供了一個具體案例：如何用 coverage state、fresh verifier、可執行 validator 與執行邊界，讓高風險 Agent 任務比單一 Prompt 更可稽核。

## 建議怎麼使用

建議先 **TRY** 一個小型、非敏感、可重建的測試 Repository。先用 guidance mode 觀察它對 trust boundary 與 finding 證據的要求，再在具備合格沙箱的環境跑 `quick` 或 `standard` full audit。第一輪測試的重點不是找到幾個漏洞，而是確認 `coverage-ledger.json` 與 `findings.json` 是否真的能讓你看懂「做過什麼、為何成立、哪裡還沒證明」。

值得 **INTEGRATE** 到 Coding Agent 的高風險 Code Review 流程，但應把它定位成安全審查的一層，而不是唯一守門員。合併或發布前仍應搭配既有測試、CI、SAST／dependency scanner，以及人類對高嚴重度 finding 的確認。

也很值得 **LEARN** `SKILL.md`、`RECONNAISSANCE.md`、`HUNTING.md` 與 `VALIDATION-AND-REPORTING.md`。其中 coverage ledger、fresh verifier 與 `needs_validation` 的資料模型，是最容易泛化到其他 Agent 工作流的部分。

最後給予 **REFERENCE**，因為即使不採用整套安全 Skill，它仍是「如何把多 Agent 審查流程從提示詞提升成可驗證 harness」的高價值架構範例。

## 與其他收藏的關聯

- [Agent Skills](./github-addyosmani-agent-skills.md)：兩者都把 Coding Agent 的工程行為封裝成可版本控制的 Skill。Agent Skills 涵蓋完整軟體生命週期與一般安全／品質紀律；Security Audit 則把單一資安領域做得更深，加入 coverage ledger、獨立 hunter/verifier、三態 finding 與結果 validator，適合比較「通用工程 Skill」與「高風險專業 Skill」需要多少額外執行契約。

## 使用者備註

## 更新紀錄

### 2026-09-18

- 建立 Knowledge Card。
- 依 Repository resolver 確認 canonical URL、來源 identity、穩定 ID 與建立模式。
- 主要依據 Repository metadata、README、`skills/security-audit/SKILL.md`、AI/LLM attack-class 文件、驗證／報告文件、validator 結構與近期提交整理。
