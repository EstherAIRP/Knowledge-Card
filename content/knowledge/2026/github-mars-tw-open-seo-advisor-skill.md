---
schema_version: 1
id: github-mars-tw-open-seo-advisor-skill
title: Open SEO Advisor
canonical_url: https://github.com/mars-tw/open-seo-advisor-skill
source:
  type: github
  url: https://github.com/mars-tw/open-seo-advisor-skill
  identity: github:mars-tw/open-seo-advisor-skill
resource_kind:
  ai: skill
  user: null
navigation:
  categories:
    ai:
      - Agent / Harness
      - Automation / Productivity
    user: null
created_at: 2026-09-15
updated_at: 2026-09-15
last_checked_at: 2026-09-15
summary: Open SEO Advisor 是一套可供 AI coding agent 載入、也能獨立以 Python CLI 執行的開源 SEO／行銷營運技能。它以 Connector、Analyzer/Fixer/Writer 與 Report/CLI 分層，把網站健檢、技術修復、內容、廣告、產圖、成長行銷與電商檢查串成可執行流程，並以唯讀、dry-run、人工確認與權限限制控制高風險動作。
classification:
  categories:
    ai:
      - Agent
      - LLM
      - General Tools
    user: null
  tags:
    ai:
      - SEO
      - Agent Skill
      - Python CLI
      - WebsiteConnector
      - Website Audit
      - Marketing Automation
      - dry-run
      - Human-in-the-loop
    user: null
relevance:
  ai:
    overall: 4
    ai_rd: 3
    aoi_ai: 1
    llm_agent: 4
    sillytavern_ai_rpg: 1
    image_gen: 2
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

# Open SEO Advisor

## 一句話介紹

Open SEO Advisor 是一套把 SEO 與數位行銷方法論封裝成 Agent Skill 與 Python CLI 的開源工具；它不只產生建議，也把網站讀取、問題分析、修復計畫、內容產出與部分營運工作拆成可執行模組，並在會寫入、花錢或部署的步驟前加入安全閘門。

## 它解決什麼問題

SEO 與網站行銷工作通常分散在爬蟲、網站分析、內容工具、廣告平台、CMS 與人工檢查表之間。若直接交給 Agent 操作，又會遇到另一個問題：讀取網站與修改正式環境、分析廣告與真的花費預算，在風險上並不是同一件事。

Open SEO Advisor 的做法是把領域流程整理成同一套介面與資料模型，讓 Agent 或 CLI 可以先取得網站資料、產生結構化問題清單，再依風險決定只分析、產生修復計畫，或在明確確認後執行有限的寫入。它同時把外部 API 做成可替換的 adapter，降低整套流程綁死單一供應商的程度。

## 核心概念

- **Skill 與 CLI 雙重入口**：根目錄的 `SKILL.md` 定義觸發詞、模式與安全前提；`seo-advisor` 則可作為獨立 CLI 使用。
- **能力分層而不是單一大型 Prompt**：網站連線、分析、修復、寫作與報告各自有明確模組，降低所有工作都依賴一次 LLM 回答的耦合。
- **結構化 Finding**：不同檢查結果收斂成共同資料模型，包含嚴重度、影響、成本、信心度、證據、建議與驗證方式。
- **預設安全失敗**：專案把唯讀、dry-run、人工確認、最小權限與授權範圍當成執行前提，而不是只放在說明文件中的提醒。
- **供應商與資料來源抽象化**：網站來源透過 `WebsiteConnector`，LLM、產圖、廣告與分析服務則透過 provider／adapter 隔離，讓核心流程不必依附單一 API。
- **逐步自動化**：能安全自動完成的分析直接執行；涉及花錢、發布、部署或高風險寫入的部分，依能力狀態停在 mock、plan-only 或人工確認。

## 架構與技術

專案的核心實作使用 Python 3.10+，CLI 採 Typer，資料模型使用 Pydantic，HTTP 以 httpx 為主，HTML 解析使用 BeautifulSoup／lxml，終端輸出使用 Rich，測試以 pytest 為主。

整體可分成三層：

1. **Connector 層**：負責取得網站或平台資料。官方文件列出的來源包含 HTTP、本地網站檔案、Git repository、SSH/SFTP、WordPress REST API、Cloudflare 與 cPanel 等；各 Connector 只暴露自己實際支援的 capability。
2. **Analyzer / Fixer / Writer 層**：把資料轉成 `Finding`、`PatchPlan` 或內容草稿。SEO 問題排序會先依 P0–P3 嚴重度分組，再使用 `impact * confidence / effort` 作為同組內的優先分數。
3. **Report / CLI 層**：將結果輸出為人類與機器可讀格式，並承接 dry-run、確認、備份、回滾等操作流程。顧問模式可輸出 Markdown、JSON 與 HTML 報告。

LLM 與外部服務採選配依賴。專案提供 Anthropic、OpenAI、本地模型等 LLM provider，並為產圖、Meta Ads、Google 分析來源等建立不同程度的 adapter；缺少憑證時，部分功能可改用 mock 或停止在分析／計畫階段。

## 主要功能

- **顧問模式**：爬取網站並檢查狀態碼、redirect、robots.txt、sitemap、canonical、title/meta/H1、內部連結、noindex、Open Graph、JSON-LD 等技術 SEO 項目，產出健康分數與問題清單。
- **工程師模式**：針對部分 robots.txt、sitemap、canonical、hreflang 等問題建立修復方案；可寫入的操作採 dry-run、確認、備份與回滾機制，部分無法安全推斷的修復只提供 plan-only 建議。
- **資安模式**：進行與 SEO 有關的被動式風險檢查，例如暴露檔案、目錄列表、惡意重導、HTTPS/HSTS、spam 與 CMS 版本線索；較具探測性的檢查需要明確授權。
- **內容寫作**：使用 LLM 將 brief 經過 outline、draft、QA 流程產生 SEO 內容，也可從既有網站健檢結果轉成寫作任務。
- **行銷模組**：涵蓋 Meta 廣告診斷、廣告／內容產圖、UTM、CRO、跨渠道分析與電商 listing 健檢；其中真實投放、花費或其他高風險行動並非全部開放自動執行。
- **Autopilot**：以 `seo-advisor auto <url>` 作為新手入口，對網址目標執行實際 SEO 分析，並將需要花錢或寫入的後續動作留在受控階段。
- **AI Matrix**：由 NORA 統籌多角色任務，把部分角色接到既有專屬引擎，其他工作則使用通用 LLM 流程；發布、花錢、部署等高風險任務會升級為人工確認與 plan-only。

## 技術亮點

第一個值得參考的地方不是 SEO 規則本身，而是它如何把「領域技能」做成可執行 Agent Skill。專案沒有只提供一份大型提示詞，而是讓 `SKILL.md`、CLI、資料模型、Connector、分析器與安全政策形成一個完整的執行邊界。這對研究 Agent Skill 如何從文字指令演進成具工具與狀態約束的能力包，有直接參考價值。

第二個亮點是**把安全語意做進執行流程**。例如寫入前 dry-run、特定確認字串、備份／回滾、遠端路徑限制、SSRF 防護、敏感憑證不落地，以及對正式環境要求二次確認。這些設計比「叫模型小心操作」更接近可驗證的 Agent 工程。

第三個亮點是 Connector 與 provider 抽象層。SEO 分析器不需要知道內容來自 HTTP、SSH 還是 WordPress；同樣地，內容與產圖功能不必永久綁死特定模型供應商。這使它可以作為「領域 Agent 如何隔離工具供應商」的實作案例。

## 限制與風險

- **仍是 1.0 前專案**：目前版本為 0.3.5，roadmap 仍把 Connector API、Finding／Report schema 的向後相容穩定化列在 v1.0.0，代表介面仍可能變動。
- **文件存在狀態漂移**：`docs/capability-map.md` 宣稱自己是能力狀態的權威總覽，但其中部分狀態與較新的 `SKILL.md`／roadmap 版本紀錄不完全同步。採用前應以目前程式碼、測試與最新版本紀錄再次確認單一功能是否真的已實作。
- **部分能力刻意不是全自動**：Meta Ads、AI Matrix 與會花費、發布、部署的工作有 mock／plan-only 或人工確認限制，因此「一個指令搞定」更適合理解成統一入口，而不是所有外部操作都已無人值守自動化。
- **外部服務仍有依賴**：真實 LLM、產圖、廣告與部分分析來源需要 API 憑證或平台權限；沒有憑證時只能降級、使用 mock 或略過。
- **網站與遠端操作有固有安全面**：專案已實作多種防護，但 `SECURITY.md` 仍明確記錄 HTTP SSRF 防護中 DNS 檢查與實際連線間的理論 TOCTOU 窗口，以及本地 Ollama provider 不套用相同 SSRF 規則等已知限制。
- **範圍非常廣**：專案已從 SEO 延伸到廣告、產圖、電商、成長行銷與 26 角色矩陣。廣度有利於示範統一營運入口，但也提高文件一致性、測試覆蓋與長期維護成本。

## 與你的相關性

依公開技術背景來看，它與 **LLM／Agent** 的關聯高於 SEO 本身。最值得研究的是 Agent Skill 的封裝方式、工具抽象層、結構化結果、安全閘門，以及如何把「先分析、再經人類確認後執行」落成程式契約。

對一般 AI R&D 也有中度參考價值，尤其是 provider abstraction、資料模型、模組化 workflow 與測試邊界。它和 AOI／Computer Vision 的直接關聯很低；產圖模組雖涉及影像生成，但主要定位是行銷素材工作流，而不是影像生成模型研究。

## 建議怎麼使用

建議先 **TRY** 它的 `auto-demo`、各模組 demo 或對非正式網站執行唯讀健檢，確認報告品質與工作流是否符合需求，再考慮提供外部服務憑證。

同時值得 **LEARN** 它的 `SKILL.md`、Connector 契約、安全政策與 Fixer 流程，特別是「Agent Skill + CLI + 結構化資料模型 + 人工確認」這種組合。

目前更適合 **REFERENCE** 為 Agent 領域技能與高風險工具操作的架構案例；在 1.0 API／schema 穩定前，不宜只因功能範圍很廣就直接把整套系統當成穩定依賴。

## 與其他收藏的關聯

目前未確認到需要直接建立連結的既有 Knowledge Card。後續若收錄更多 Agent Skill 封裝、網站自動化或人機協作安全閘門相關專案，再由關聯索引依語意距離建立連結。

## 使用者備註

## 更新紀錄

### 2026-09-15

- 建立 Knowledge Card。
- 依 Repository resolver 確認 canonical URL、來源 identity、穩定 ID 與建立模式。
- 主要依據 Repository metadata、README、`SKILL.md`、架構文件、能力地圖、roadmap、Python package 設定與安全政策整理。
