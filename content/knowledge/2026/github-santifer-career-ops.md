---
schema_version: 1
id: github-santifer-career-ops
title: career-ops
canonical_url: https://github.com/santifer/career-ops
source:
  type: github
  url: https://github.com/santifer/career-ops
  identity: github:santifer/career-ops
resource_kind:
  ai: skill
  user: null
created_at: 2026-08-27
updated_at: 2026-08-27
last_checked_at: 2026-08-27
summary: career-ops 是一套以 Agent Skill 為核心、在多種 AI coding CLI 內執行的本機優先求職作業系統；它把職缺掃描、適配評估、履歷客製、申請追蹤、面試準備與公司研究整合成可路由的工作流程，並以 Playwright、腳本工具與可選插件延伸能力。
classification:
  categories:
    ai:
      - Agent
      - AI Coding / DevTools
      - General Tools
    user: null
  tags:
    ai:
      - agent-skill
      - multi-cli-agent
      - job-search-automation
      - career-workflow
      - resume-tailoring
      - ats
      - playwright
      - human-in-the-loop
      - local-first
      - plugin-system
    user: null
relevance:
  ai:
    overall: 4
    ai_rd: 3
    aoi_ai: 1
    llm_agent: 5
    sillytavern_ai_rpg: 2
    image_gen: 1
  user: {}
actions:
  ai:
    - LEARN
    - REFERENCE
  user: null
status:
  ai: active
  user: null
---

# career-ops

## 一句話介紹

career-ops 是一套把 Claude Code、Codex、OpenCode、Cursor 等 AI coding CLI 轉成「求職作業中樞」的 Agent Skill：使用者可以貼入職缺網址或職缺描述，讓 Agent 依模式路由完成職缺分析、履歷客製、追蹤、研究與面試準備等工作。

## 它解決什麼問題

一般求職流程常被拆散在瀏覽器、試算表、履歷檔案、筆記與不同 AI 對話中，造成資料重複、判斷標準不一致，也難以累積前一次分析的上下文。career-ops 的核心做法不是自動大量投遞，而是建立一個可重複執行的候選人端工作流程，先過濾值得投入時間的職缺，再把評估、文件產生與後續追蹤串成同一條管線。

專案 README 明確把它定位為篩選與決策支援工具，而不是「大量投遞機器人」；申請送出仍由人決定，系統本身不自動提交申請。

## 核心概念

1. **Agent Skill 作為統一入口**：`.agents/skills/career-ops/SKILL.md` 定義共用路由器，依輸入內容或子命令切換到 `scan`、`pipeline`、`pdf`、`tracker`、`interview` 等模式。
2. **多 CLI 共用語意**：相同工作流程可以由 Claude Code、Codex、OpenCode、Cursor、Qwen、Kimi、GitHub Copilot CLI 等不同 Agent CLI 執行；差異主要集中在入口包裝，而不是重新實作整套流程。
3. **職缺先評估、再投入**：職缺被整理成結構化 A–H 報告與整體評分，並把履歷適配、職缺可信度、公司研究與後續準備納入同一套判斷流程。
4. **本機優先與單一資料來源**：履歷、職缺報告、追蹤器與產出檔案主要留在本機專案目錄，讓 Agent 能持續讀取同一份狀態，而不是把每次互動當成獨立聊天。
5. **人機協作而非全自動申請**：Agent 負責分析、產生草稿與整理資料，實際申請與對外動作保留人工確認。

## 架構與技術

career-ops 的主要交付物符合 Agent Skill 形態，但 Repository 同時包含大量可執行工具，因此比較像「Skill 路由器 + 本機工具鏈」的組合。

- **Skill 層**：`.agents/skills/career-ops/SKILL.md` 提供主要路由、觸發條件、模式載入規則與上下文組裝方式。
- **工作流程層**：`modes/` 內各模式負責不同任務，例如職缺評估、掃描、履歷、追蹤、公司研究、面試與 offer 分析。
- **腳本層**：Node.js 腳本處理掃描、資料正規化、去重、履歷與 PDF 產生、追蹤器維護、模式分析與健康檢查等工作。
- **瀏覽器自動化**：使用 Playwright 擷取職缺頁面與產生 PDF；安裝流程也會準備 Chromium。
- **Dashboard**：README 顯示另有以 Go 建置的終端介面，用來瀏覽與篩選求職管線。
- **多模型／多 CLI**：核心不是綁定單一模型；官方文件列出 Claude Code、Codex、OpenCode、Cursor、Antigravity CLI、Qwen、Kimi、GitHub Copilot CLI 等入口。
- **插件系統**：外部 API 與第三方服務被拆成可選插件。插件需明確啟用並提供對應金鑰，Registry 以固定 commit 方式管理已審核社群插件。

目前 `package.json` 顯示 Node.js 需求為 18 以上，主要相依包含 `playwright`、`js-yaml`、`dotenv` 與 Google Generative AI SDK；Repository 採 MIT License。

## 主要功能

- 貼入職缺網址或 JD 後執行完整評估管線。
- 以 A–H 結構整理職缺、履歷匹配、層級策略、薪資／公司研究、面試準備與職缺可信度。
- 依職缺內容產生 ATS 導向的客製化履歷 PDF 與 cover letter 草稿。
- 掃描 Greenhouse、Ashby、Lever 與公司職缺頁，並支援批次處理。
- 用 tracker 管理申請狀態、後續追蹤、回覆分類、拒絕模式與 funnel 統計。
- 進行公司研究、聯絡人探索、LinkedIn 訊息與應徵 Email 草稿產生。
- 提供面試計畫、模擬問答、面試後檢討與 offer／合約閱讀輔助。
- 透過 opt-in 插件延伸 Gmail、Notion、Apify 或其他社群整合。

## 技術亮點

### 1. 把大型 Agent 工作流拆成可路由模式

最值得參考的不是「AI 幫忙寫履歷」本身，而是把一個長流程拆成多個 mode，再由 Skill 層根據輸入與任務動態載入適用的上下文。這種路由方式可降低每次執行需要載入的提示內容，也讓工作流可以逐步擴充。

### 2. 同一套 Skill 適配多個 Agent CLI

專案將 Claude Code、Codex、OpenCode 等視為不同執行介面，而把核心流程放在共用規則與 Skill 中。對設計跨 Agent Runtime 的工具而言，這種「共用語意、薄入口包裝」比為每個 CLI 建一套獨立工作流更容易維護。

### 3. LLM 推理與確定性工具混合

職缺適配、公司研究與內容客製適合交給 LLM；去重、狀態正規化、追蹤器、PDF、健康檢查等工作則交由腳本執行。這種分工讓 Agent 不必用自然語言推理取代所有確定性處理。

### 4. 人工確認被放在架構層，而不是只靠提示詞提醒

README 與插件契約都刻意排除自動送出申請；插件也沒有 auto-submit hook。這讓「Human-in-the-Loop」成為產品邊界，而不是一句容易被後續提示覆蓋的安全提醒。

### 5. 插件供應鏈有明確信任模型

插件採 opt-in、固定 commit、信任徽章、變更偵測與 `allowedHosts` 等約束；文件也坦白說明一般 ESM 沒有真正的強隔離沙箱。這種把「實際能保證什麼、不能保證什麼」寫清楚的做法，對 Agent 外掛架構很有參考價值。

## 限制與風險

- **快速演進造成介面變動**：專案建立時間不長但功能量很大，模式、CLI 適配與資料格式仍可能快速調整，導入前應先看目前版本文件。
- **輸出品質高度依賴個人資料完整度**：README 直接提醒，初期評估品質會受履歷、職涯故事、偏好與證據資料是否完整影響。
- **需要信任所使用的 Agent CLI 與模型**：雖然核心本機優先，但執行時仍可能把履歷、職缺或公司資料交給所選模型供應商處理；實際隱私邊界取決於使用者選擇的 CLI、模型與插件。
- **插件不是強沙箱**：官方插件文件明確指出 ESM 沒有真正的硬隔離；未驗證或自行修改的插件仍等同執行第三方程式碼。
- **Playwright 與瀏覽器依賴增加環境成本**：完整功能需要 Node.js、Chromium 與相關依賴，並不是單一純文字提示檔即可運作。
- **求職評估仍屬主觀決策輔助**：評分與建議由模型推理產生，不能當成客觀招聘結果或保證；薪資、公司與職缺資訊也需要注意資料新鮮度。

## 與你的相關性

對公開技術背景中的 LLM／Agent 方向，career-ops 的價值很高：它不是單純聊天機器人，而是一個成熟度相對高的「Agent Skill + 多模式路由 + 腳本工具 + 外掛」範例，可直接研究如何把大型實務流程拆成 Agent 可執行的模組。

對 AI R&D 而言，它也適合用來觀察推理任務與確定性工具的責任切分、上下文載入策略、人機確認點與跨 Runtime 適配方式。與 AOI × AI 或影像生成的直接關聯則很低；可借鑑的主要是 Agent 系統設計，而不是領域模型技術。

## 建議怎麼使用

- **LEARN**：優先研究 `SKILL.md` 的模式路由、上下文載入與跨 CLI 設計，這些模式很容易抽象到其他 Agent 應用。
- **REFERENCE**：可把它當成大型本機 Agent workflow 的工程案例，特別參考「LLM + 腳本」、「Human-in-the-Loop」與插件信任模型。

若單純要體驗產品，可以依 README 用 `npx @santifer/career-ops init` 建立專案，再從慣用的 AI CLI 進入；但若目的是技術研究，不必先完整配置個人求職資料，也能直接閱讀 Skill、modes、腳本與插件契約。

## 與其他收藏的關聯

目前不手動建立特定卡片連結。它與 Agent Skill、Agent workflow、多 CLI 適配與本機 Agent 工具鏈類型的收藏具有明顯語意關聯，後續可由 Knowledge Graph 自動建立關係。

## 使用者備註


## 更新紀錄

### 2026-08-27

- 建立 Knowledge Card；來源經 Remote Ingest resolver 驗證為 `github:santifer/career-ops`。
- 依 README、`SKILL.md`、`package.json`、`docs/SUPPORTED_CLIS.md` 與 `docs/PLUGINS.md` 整理 Agent Skill 架構、主要能力與風險。
