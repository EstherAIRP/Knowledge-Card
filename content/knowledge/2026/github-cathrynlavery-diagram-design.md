---
schema_version: 1
id: github-cathrynlavery-diagram-design
title: Diagram Design
canonical_url: https://github.com/cathrynlavery/diagram-design
source:
  type: github
  url: https://github.com/cathrynlavery/diagram-design
  identity: github:cathrynlavery/diagram-design
resource_kind:
  ai: skill
  user: null
created_at: 2026-09-09
updated_at: 2026-09-09
last_checked_at: 2026-09-09
summary: Diagram Design 是一套面向 Claude Code、Codex、Pi 等 Agent Host 的圖解設計 Skill，提供 39 種編輯式圖解、語意模式、品牌樣式導入、draw.io／Mermaid 重繪與 HTML／SVG／PNG 匯出。它把圖解生成拆成「行為模式 → 版面類型 → 設計系統 → 自我檢查／渲染驗證」，重點不是單純自動排版，而是讓 Agent 產出可讀、可品牌化、可驗證且具可及性的視覺成果。
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
      - diagram-design
      - data-visualization
      - SVG
      - HTML
      - Claude Code
      - Codex
      - Pi
      - Mermaid
      - draw.io
      - diagram-redraw
      - design-system
      - brand-onboarding
      - accessibility
      - Playwright
      - visual-validation
    user: null
relevance:
  ai:
    overall: 5
    ai_rd: 4
    aoi_ai: 2
    llm_agent: 5
    sillytavern_ai_rpg: 2
    image_gen: 3
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

# Diagram Design

## 一句話介紹

Diagram Design 是一套讓 Coding Agent 產生**具有編輯設計感、品牌一致性與可驗證品質的技術圖解**的 Agent Skill；它不是另一套 Mermaid renderer，而是把圖解類型選擇、語意模式、視覺規範、品牌樣式、匯入重繪、匯出與驗證流程一起封裝成可重用能力。

目前 Skill 中繼資料標示版本 `2.6`，README 列出 39 種視覺類型，支援 Claude Code、Codex、Factory Droid、Pi 與其他相容 Agent Skill 的宿主。

## 它解決什麼問題

LLM 很容易畫出「資訊大致正確，但看起來像預設 AI 圖」的架構圖：大量相同圓角框、過多連線、缺乏視覺層級、配色與品牌不一致，或直接接受 Mermaid／draw.io 自動排版後的擁擠結果。

Diagram Design 的切入點不是再增加一個通用圖表 renderer，而是把「圖解設計判斷」本身寫進 Skill。Agent 先判斷讀者真正需要看到什麼，再選擇圖解類型與語意模式，套用設計系統，最後用自我檢查與實際渲染驗證輸出。

因此它處理的問題包含：

- 不同 Agent 每次畫圖時的風格與品質不一致。
- 技術內容雖正確，但視覺密度、焦點與資訊層級失控。
- 既有 Mermaid／draw.io 雖可用，但版面、顏色與字體不符合最終文件或品牌需求。
- 圖解產出缺乏可及性、格式驗證與實際渲染檢查。
- 大型 Skill 若把所有圖解規則一次塞進 context，會浪費上下文並降低可維護性。

## 核心概念

### 先判斷行為語意，再選視覺類型

當重點是狀態、風險、政策、治理或流程行為時，Skill 先從 `semantic-patterns.md` 選擇語意模式，再用最接近的視覺類型負責版面。

目前文件列出八種路由模式，例如 fan-in queue／bottleneck、paired policy-evaluation traces、secure paved road、compensating security layers 與 traceable block decomposition。這種設計把「系統在做什麼」與「畫面如何排」拆成兩層，避免所有需求都硬塞進新的圖表類型。

### 圖解是刪除問題，不是堆疊問題

Skill 的設計哲學非常明確：每個節點與連線都必須提供資訊，若視覺位置本身已能表達關係，就不一定需要再畫線。預設目標密度約為 4/10，超過約九個節點時就應考慮拆成 overview + detail，而不是持續擴大單張圖。

### 設計系統以語意角色管理

顏色不是直接散落在各模板，而是由 `style-guide.md` 管理 `paper`、`ink`、`muted`、`accent`、`link` 等語意角色。`accent` 只保留給 1–2 個真正需要讀者先注意的元素，字體也依標題、節點名稱、技術子標籤與註解分工。

品牌導入流程可以從網站提取背景、文字、品牌色與字體，映射到這些角色；在寫入樣式 token 前，還會檢查文字與背景的 WCAG AA 對比度，並輸出來源 URL、顏色角色、字體與 fallback 的 fidelity receipt。

### Mermaid／draw.io 是重繪，不是轉檔

匯入既有圖時，Diagram Design 會保留元件、關係、分組與方向，但**不沿用原始座標、字體、配色與自動路由**。輸出可以依 `format`、`size`、`detail`、`audience` 四個維度重構，並用 fidelity ledger 明確列出哪些節點被合併、簡化或捨棄。

這代表它追求的是「保留內容語意後重新設計」，而不是像素級 round-trip conversion。

### 漸進式揭露控制 Agent context

啟動時 Agent 先看到 Skill 名稱與描述；真正命中圖解需求後才載入 `SKILL.md`，再根據任務讀取對應的 `type-*.md`、語意模式或 animation reference。新增更多圖解類型不代表所有規則都要長期佔據 context。

## 架構與技術

這個 Repository 的主要交付物是 `skills/diagram-design/` 下的 Agent Skill，因此 `resource_kind` 判定為 `skill`。

主要結構包括：

- `skills/diagram-design/SKILL.md`：核心哲學、圖解選型、通用規則、設計系統與複雜度預算。
- `skills/diagram-design/references/`：依需要載入的細部規格，包含 39 種視覺類型、語意模式、動畫、品牌 onboarding、client profiles、draw.io／Mermaid 匯入、輸出規格與匯出流程。
- `skills/diagram-design/scripts/`：包含 `drawio_extract.py`、`mermaid_extract.py` 與 `self_check.py`，分別負責來源結構化與已產出檔案的自我檢查。
- `skills/diagram-design/assets/`：圖解模板、39 種類型的多版本範例、gallery 與動畫範例。
- `commands/`、`prompts/`：提供 Claude Code、Factory Droid、Pi 等宿主的匯出、匯入、profile 與環境檢查入口。
- `.claude-plugin/`、`.codex-plugin/`、`.factory-plugin/`、`.agents/plugins/`：各宿主的 plugin／marketplace 整合資料。
- Repository 根目錄的 `scripts/`：包含封裝驗證、canonical screenshot 產生、渲染 lint、Sankey／polar 等圖表專用驗證與測試。

一般圖解預設產生**單一自包含 HTML**，圖形本體使用 inline SVG 與 CSS；靜態輸出是預設模式，不需要 build step。若要輸出 PNG，則使用 Playwright + Chromium 進行 rasterization；SVG 匯出會把圖解節點抽出並處理字體，使檔案可以獨立使用。

## 主要功能

- 提供 39 種視覺類型，涵蓋架構圖、流程圖、序列圖、狀態機、ER、時間軸、泳道、象限、雷達圖、迴圈、樹狀圖、Gantt、Sankey、魚骨圖、Wardley map、Kanban、部署圖、dependency graph、UML class、database schema 等。
- 每一種類型提供 minimal light、minimal dark 與 full-editorial 靜態變體。
- 根據需求先選語意模式，再選版面類型，處理 queue、policy trace、trust boundary、governance、security layers 等系統行為。
- 可從公開網站擷取品牌顏色與字體，轉成統一 style tokens，並檢查基本對比度。
- 支援命名 client profile 與 `.diagram-design` marker，讓多個專案共用不同品牌設定。
- 可重繪 `.drawio`、`.drawio.xml`、帶嵌入資料的 `.drawio.png`／`.drawio.svg`，以及 `.mmd`、`.mermaid` 與 Markdown 內的 Mermaid code block。
- Mermaid 匯入只解析文字，不需要執行 Mermaid renderer、JavaScript 或瀏覽器。
- 匯入時可以控制輸出格式、版面尺寸、內容詳細度與目標受眾語言層級。
- 每次匯入輸出 fidelity ledger，明確留下合併、刪除與保留內容紀錄。
- 可將 HTML 匯出成 SVG／PNG；使用 traceable block decomposition 時也能額外輸出 block registry JSON。
- SVG 內建 `role="img"`、`aria-labelledby`、`<title>` 與 `<desc>` 等可及性結構。
- 動畫為選配功能，提供 `none`、`reveal`、`step`、`loop`；`prefers-reduced-motion` 會回到完整靜態畫面。
- 提供 `self_check.py` 與渲染 lint，對輸出結構、幾何與實際瀏覽器渲染進行檢查。

## 技術亮點

### 將「內容語意」與「圖形語法」分開

一般圖表工具常把資料結構與版面規則綁在一起；Diagram Design 則先定義語意模式，再由視覺類型負責版面。這種分層很適合 Agent，因為 Agent 可以先理解「這是瓶頸、政策分歧還是信任邊界」，再決定畫面，而不是只做關鍵字對圖表名稱的映射。

### 把視覺品質變成可執行約束

設計規則不只停留在「看起來漂亮」：4px grid、焦點元素數量、連線規則、可及性欄位、靜態 fallback、輸出自我檢查與 render lint 都把主觀設計要求轉成較可驗證的工程契約。

Repository 的 `lint-render.py` 甚至以實際像素差異判斷 SVG clipping，而不是只看 DOM geometry；CI 的預設渲染會封鎖網路並固定 Playwright／Chromium 版本，以降低環境差異。

### Progressive disclosure 適合大型 Skill

39 種類型與大量 reference 沒有全部塞進單一 `SKILL.md`。核心文件只做選型與通用規則，命中類型後才載入對應 reference。這是一個很好的 Agent Skill 擴充模式：功能增加時，不必線性增加每次任務的 context 成本。

### 重繪流程比直接轉換更符合最終用途

匯入工具明確放棄原始座標與視覺樣式，保留真正重要的結構與關係，再按照簡報、文件、社群圖片或工程閱讀需求重新排版。`detail` 與 `audience` 也讓同一份來源可以產生不同層級的版本，而不是只有一個固定輸出。

### 靜態優先降低安全與相容性成本

普通輸出預設沒有 JavaScript；需要動畫時，Skill 要求使用經審查的固定 controller，並拒絕任意修改的 inline script、遠端資產、CSS import 與可執行 HTML attribute。這讓「漂亮輸出」與「可控執行面」沒有完全綁死在一起。

## 限制與風險

- **它仍然是 Agent Skill，不是 deterministic layout engine**：規則再完整，最終品質仍取決於宿主模型是否正確理解內容、選對圖解類型並遵循 Skill；不能把 `SKILL.md` 當成硬性 renderer 保證。
- **39 種類型不代表所有複雜視覺都能自動完美處理**：對高密度系統、非常規統計圖或特殊 domain notation，仍可能需要人工拆圖、修改 SVG 或新增 type reference。
- **重繪會刻意改變原始表現**：Mermaid／draw.io 的座標、配色、字體與自動 layout 不會保留；`balanced`／`simplified` 模式也可能合併或刪除資訊，因此不適合需要精確 round-trip 的編輯流程。
- **PNG 匯出與 render lint 需要 Playwright／Chromium**：HTML／SVG 本身可以靜態使用，但完整的 raster export 與渲染檢查會增加瀏覽器依賴與執行成本。
- **字體會影響量測結果**：README 明確指出 CI 預設使用 fallback fonts 取得 deterministic layout；本機若要確認 Instrument Serif／Geist 等實際 webfont 的文字 fitting，需要另外執行 `--fonts` 檢查。
- **品牌 onboarding 依賴可讀取的網站樣式**：若網站限制抓取、使用特殊字體載入方式或設計系統資訊不易從頁面取得，仍需要手動設定 token。
- **動畫模式增加執行面**：雖然專案對可接受 script 有明確限制，而且 static 是預設，但只要啟用 motion，就不再是完全無 JavaScript 的輸出。

## 與你的相關性

依公開技術 Profile，這個專案與 **LLM／Agent** 高度相關。它示範如何把一個容易依賴「模型美感」的任務，拆成選型、語意模式、設計約束、reference 載入與驗證流程，適合研究大型 Agent Skill 的組織方式。

對 **AI R&D** 也有高度參考價值：progressive disclosure、fidelity ledger、render-based validation 與 deterministic CI 都是把生成式 Agent 輸出變得更可控的工程模式，不侷限於畫圖場景。

對 **影像生成** 有中度相關性，因為最終產物是視覺內容，而且牽涉品牌樣式與視覺品質控制；但它不使用 diffusion、LoRA 或 ControlNet，主要生成的是 HTML／SVG，因此不應把它視為傳統生成式影像模型工具。

與 **AOI × AI** 的直接關聯較低，但可以用於整理 AOI 系統架構、檢測流程、資料流、部署拓撲或模型 pipeline；其價值在技術溝通，不在影像檢測演算法本身。

與 **SillyTavern／AI RPG** 只有間接關聯，例如可用來畫角色系統、記憶架構、事件流程或 world model，但專案本身沒有針對角色扮演或敘事 Agent 提供專門能力。

## 建議怎麼使用

- **TRY**：直接拿一個真實的架構圖或 Mermaid block 測試，分別比較原始版本與 Diagram Design 重繪後的資訊密度、連線可讀性與品牌一致性。
- **INTEGRATE**：如果文件、技術設計或 Agent 產出經常需要架構圖，可以把它固定納入 Coding Agent 工作流，尤其適合需要 HTML／SVG 可持續修改，而不是只要一次性圖片的情境。
- **LEARN**：研究 `SKILL.md → semantic-patterns → type reference → self-check` 的分層，這套 progressive disclosure 結構很適合拿來設計其他大型 Agent Skill。
- **REFERENCE**：可作為「如何把主觀品質規範工程化」的參考，特別是設計 token、fidelity ledger、render lint、可及性與 static-first motion contract。

若只需要非常快速的 ASCII／Unicode 草圖或單純列表，不必為了使用 Skill 而強制畫圖；這個專案本身也明確主張「文字能講清楚，就不要畫」。

## 與其他收藏的關聯

- [Web Design Skill](./github-max0821-web-design-skill.md)：兩者都把視覺工作拆成 Agent 可執行的規範與驗證流程；Web Design Skill 聚焦整頁網站設計與 render-based QA，Diagram Design 則聚焦技術圖解、SVG grammar 與跨格式重繪。
- [Agent Skills](./github-addyosmani-agent-skills.md)：可對照一般工程工作流 Skill 與專用視覺 Skill 的架構差異。兩者都採取拆分 Skill／reference、強調驗證與跨 Agent Host 使用，但 Diagram Design 對視覺設計與渲染約束更深入。

## 使用者備註

## 更新紀錄

### 2026-09-09

- 新增 Knowledge Card。
- 來源驗證時 `SKILL.md` 中繼資料版本為 `2.6`，README 列出 39 種視覺類型。
