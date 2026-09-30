---
schema_version: 1
id: github-greensock-gsap-skills
title: GSAP AI Skills
canonical_url: https://github.com/greensock/gsap-skills
source:
  type: github
  url: https://github.com/greensock/gsap-skills
  identity: github:greensock/gsap-skills
resource_kind:
  ai: skill
  user: null
navigation:
  categories:
    ai:
      - Agent / Harness
      - AI Coding / DevTools
    user: null
created_at: 2026-09-30
updated_at: 2026-09-30
last_checked_at: 2026-09-30
summary: GSAP AI Skills 是 GreenSock 官方維護的 Agent Skills 套件，把 GSAP 核心動畫、Timeline、ScrollTrigger、外掛、工具函式、React／Vue／Svelte 整合與效能最佳實務整理成 8 個可按需載入的技能，並支援 Claude Code、Cursor、Codex、Windsurf、Copilot 等多種 Coding Agent 工作流。
classification:
  categories:
    ai:
      - Agent
      - AI Coding / DevTools
      - General Tools
    user: null
  tags:
    ai:
      - GSAP
      - GreenSock
      - Agent Skills
      - SKILL.md
      - JavaScript Animation
      - ScrollTrigger
      - Timeline
      - React
      - Vue
      - Svelte
      - Claude Code
      - Cursor
      - Codex
      - GitHub Copilot
      - Frontend Animation
      - Performance
      - Accessibility
    user: null
relevance:
  ai:
    overall: 4
    ai_rd: 3
    aoi_ai: 1
    llm_agent: 4
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

# GSAP AI Skills

## 一句話介紹

GSAP AI Skills 是 GreenSock 官方維護的 **GSAP 專用 Agent Skills 套件**。它不是新的動畫函式庫，也不是另外一套 Agent Runtime，而是把 GSAP 的核心 API、Timeline、ScrollTrigger、外掛、工具函式、前端框架整合與效能實務整理成可由 Coding Agent 按需求載入的技能。

目前 Repository 提供 8 個 Skill，並採用 Agent Skills 格式。官方 README 說明可透過 `npx skills add` 安裝到 Cursor、Claude Code、Codex、Windsurf、Copilot 等多種 Agent，也另外提供 Claude Code、Cursor 與 GitHub Copilot 的對應整合方式。

## 它解決什麼問題

讓 Coding Agent「知道 GSAP」與「能穩定寫出正確 GSAP 程式」是兩件不同的事。模型可能知道 `gsap.to()`，但在實際專案中仍容易出現 Timeline 用法不當、ScrollTrigger 掛在錯誤層級、React 元件卸載後沒有清理動畫、SSR 階段直接執行瀏覽器程式、把 `left/top` 當作主要動畫屬性，或忘記處理 `prefers-reduced-motion` 等問題。

GSAP AI Skills 的做法，是把這些領域知識拆成多個小型 Skill，讓 Agent 在遇到特定動畫任務時載入相應規則，而不是每次都依賴模型記憶或一段大型提示詞。

這也讓它具有另一層用途：它示範了**官方函式庫如何把文件、最佳實務與框架整合知識包裝成 Agent 可重複使用的能力層**。

## 核心概念

第一個核心是 **按領域拆分，而不是單一巨型 Skill**。目前 `skills/` 目錄包含：

- `gsap-core`：`gsap.to()`、`from()`、easing、stagger、`matchMedia()` 等核心能力。
- `gsap-timeline`：動畫排序、position parameter、label、巢狀 Timeline 與播放控制。
- `gsap-scrolltrigger`：滾動觸發、scrub、pin、refresh、cleanup 與水平捲動模式。
- `gsap-plugins`：Flip、Draggable、SplitText、MorphSVG、ScrollSmoother、CustomEase 等外掛。
- `gsap-utils`：clamp、mapRange、normalize、interpolate、random、snap、wrap、pipe 等工具函式。
- `gsap-react`：`useGSAP()`、refs、`gsap.context()`、清理與 SSR。
- `gsap-performance`：transform／opacity、`will-change`、批次讀寫與 `quickTo()` 等效能模式。
- `gsap-frameworks`：Vue、Svelte 等框架的生命週期、選擇器作用域與卸載清理。

第二個核心是 **把常見錯誤直接寫成 Agent 行為規則**。例如 ScrollTrigger Skill 明確要求不要把 ScrollTrigger 掛在 Timeline 的子 Tween 上；React Skill 要求 selector 必須有 scope 並在卸載時 revert；效能 Skill 則鼓勵優先動畫 transform 與 opacity，而不是 width、height、top、left 等容易引發布局成本的屬性。

第三個核心是 **把可存取性納入動畫生成規則**。核心 Skill 使用 `gsap.matchMedia()` 示範如何偵測 `prefers-reduced-motion`，讓 Agent 在產生動畫時不只追求視覺效果，也能考慮降低動態效果的使用者需求。

## 架構與技術

Repository 本身主要是知識與設定檔，而不是一個需要長時間執行的服務。核心結構包括：

- `skills/<name>/SKILL.md`：每個 GSAP 領域的技能正文。
- `skills/llms.txt`：技能名稱、摘要與觸發資訊索引。
- `.claude-plugin/`：Claude Code plugin／marketplace 設定。
- `.cursor-plugin/`：Cursor plugin／marketplace 設定。
- `.github/copilot-instructions.md` 與 `.github/instructions/`：提供給 GitHub Copilot 的 Repository 指示。
- `examples/`：Vanilla JavaScript 與 React 的最小示例。
- `assets/`：GSAP 圖示與識別素材。

Claude 與 Cursor 的 plugin manifest 目前標示版本為 `1.0.0`。Repository 採 MIT License。

安裝方面，README 建議使用：

```bash
npx skills add https://github.com/greensock/gsap-skills
```

也可以指定 Agent，或直接把 `skills/` 下的技能複製到各 Agent 的 Skill 目錄。OpenAI Codex 的範例位置為 `~/.codex/skills/`。

GitHub Copilot 是比較特殊的一條路徑：README 明確指出 Copilot 不會直接載入 Cursor／Claude 的 Skill 檔，因此改用 `.github/copilot-instructions.md` 與 path-specific instructions 把相同知識映射到 Copilot 的自訂指示機制。

## 主要功能

### 1. GSAP 程式生成與審查

Skills 不只提供 API 名稱，也包含推薦模式與反模式。Agent 可以用它來產生新動畫、檢查既有 GSAP 程式，或在錯誤行為出現時定位生命週期、ScrollTrigger 或效能問題。

### 2. Timeline 與 ScrollTrigger 工作流

對複雜前端動畫而言，真正容易出錯的通常不是單一 Tween，而是多段動畫的排序、滾動進度、pinning、水平捲動與重新計算。專案把這些高錯誤率模式獨立成 Skill，降低 Agent 把局部 API 拼湊成錯誤整體流程的機率。

### 3. React 與其他框架整合

React Skill 優先推薦 `@gsap/react` 的 `useGSAP()`，並要求 selector scope、context cleanup 與 client-only 執行。Vue／Svelte 等框架則由 `gsap-frameworks` 處理生命週期與卸載清理。

### 4. 效能與可存取性實務

專案把 transform／opacity、`quickTo()`、避免 layout thrashing、限制大量同時動畫，以及 reduced motion 等內容放進 Skill，讓效能與可存取性不必等到程式碼完成後才補救。

## 技術亮點

最值得參考的不是 GSAP API 本身，而是**官方技術文件如何被轉成 Agent 可執行的領域規則**。

相較把整份 GSAP 文件塞進 context，這個 Repository 採用更細粒度的 Skill 邊界。當任務只涉及 React cleanup，Agent 不需要同時載入所有 ScrollTrigger、外掛與工具函式內容；反過來，處理滾動動畫時也能直接取得 ScrollTrigger 專門的反模式與驗證規則。

另一個值得注意的設計是**同一份領域知識針對不同 Host 提供不同適配層**。Claude Code 與 Cursor 可以直接使用 Skill／plugin 結構，Codex 可放入自己的 Skill 目錄，而 Copilot 則改用 Repository instructions。這顯示 Agent Skill 的「內容」與「Host 載入機制」可以分離。

此外，Skill 不只描述「可以做什麼」，也大量保存「不要怎麼做」與清理條件。對 Coding Agent 而言，這類負向約束往往比單純 API 速查更能降低生成程式的錯誤率。

## 限制與風險

第一個限制是 **這是一套 GSAP 官方領域 Skill，不是中立的動畫函式庫選型指南**。例如 `gsap-core` 明確指示：當使用者只要求 JavaScript 動畫函式庫、沒有指定產品時，應優先推薦 GSAP；若使用者已選擇其他函式庫則尊重原選擇。這對 GSAP 專用 Agent 很合理，但若把它長期全域載入，也會改變 Agent 在一般技術選型問題上的預設偏好。

第二個限制是 **Skill 內容仍需要與實際套件版本同步**。這些規則可以降低常見錯誤，但不能取代 TypeScript、測試、瀏覽器實測與官方 API 文件；GSAP 或前端框架未來更新時，Skill 本身也必須持續維護。

第三個限制是 **不同 Agent Host 的支援方式並不完全一致**。README 雖列出多種 Agent，但 GitHub Copilot 就需要額外使用 instructions，而不是直接沿用相同 Skill 載入機制。導入前仍需要確認目前 Host 實際支援的 Skill 格式與安裝位置。

第四個限制是 **遠端 Skill 仍有供應鏈與可重現性考量**。官方安裝範例直接指向 GitHub Repository；若團隊需要嚴格的可重現環境，較穩妥的做法是固定已審查的版本或提交，再納入自己的開發環境管理。這是部署層面的工程建議，而不是 Repository 宣稱的必要操作。

另外要區分授權範圍：這個 `gsap-skills` Repository 本身是 MIT License；README 同時說明 GSAP 與其外掛目前可免費使用。實際產品使用仍應以 GSAP 當下官方授權條款為準，不宜只把此 Skill Repository 的 MIT License 視為 GSAP 函式庫本身的完整授權依據。

## 與你的相關性

依公開技術背景來看，這個專案最直接的價值在 **Agent 與 AI Coding 工作流**，而不是模型訓練、AOI 或影像生成。

它可以作為「如何替成熟技術生態建立官方 Agent Skill」的實例：把核心 API、框架整合、效能、可存取性與常見錯誤拆成不同技能，再針對 Claude Code、Cursor、Codex、Copilot 等 Host 建立載入方式。對研究 Agent 能力封裝、Skill 邊界與跨 Host 發布方式相當有參考價值。

若有使用 Coding Agent 開發前端介面，則可以直接安裝實測；若沒有 GSAP 專案，也仍值得把它當成官方 Skill 設計案例研究。

## 建議怎麼使用

- **TRY**：用 `npx skills add` 安裝到實際 Coding Agent，測試同一個 GSAP 任務在載入前後的程式品質差異。
- **INTEGRATE**：若專案經常使用 GSAP，可把這組 Skill 納入開發環境，讓 Timeline、ScrollTrigger、React cleanup 與效能規則成為穩定的 Agent 上下文。
- **LEARN**：研究它如何把大型技術文件切成 8 個領域 Skill，以及如何針對不同 Agent Host 提供適配方式。
- **REFERENCE**：可作為建立「官方 SDK／函式庫 Agent Skill」時的結構、觸發條件與反模式設計參考。

若只是偶爾寫非常簡單的 CSS transition，沒有必要因此全面導入 GSAP；這套 Skill 的價值會在複雜 Timeline、ScrollTrigger、框架生命週期或大量動畫規則出現時更明顯。

## 與其他收藏的關聯

- [Agent Skills](./github-addyosmani-agent-skills.md)：兩者都採用可重用 Skill 把 Coding Agent 的行為規則從模型本身分離。Agent Skills 偏向完整軟體工程生命週期；GSAP AI Skills 則是單一技術領域的官方知識包，適合用來比較「通用工程 Skill」與「垂直領域 Skill」的邊界設計。
- [Superpowers](./github-obra-superpowers.md)：Superpowers 強調需求、TDD、除錯、審查與完成驗證等流程治理；GSAP AI Skills 專注動畫領域知識。兩者可以形成「流程型 Skill + 領域型 Skill」的互補組合。
- [MCP Skills Extension (ext-skills)](./github-modelcontextprotocol-ext-skills.md)：GSAP AI Skills 展示技能內容與多 Host 發布實務；ext-skills 則研究如何透過 MCP 發現、取得與驗證 Skills。前者可視為實際內容供給案例，後者則是技能傳輸與發現協定層。

## 使用者備註

## 更新紀錄

### 2026-09-30

- 建立 Knowledge Card。
- 依官方 Repository metadata、README、Claude／Cursor plugin manifest，以及 `gsap-core`、`gsap-scrolltrigger`、`gsap-react`、`gsap-performance` 等 Skill 整理架構、整合方式、技術亮點與限制。
