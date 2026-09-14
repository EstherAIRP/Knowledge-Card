---
schema_version: 1
id: github-virgiliojr94-book-to-skill
title: book-to-skill
canonical_url: https://github.com/virgiliojr94/book-to-skill
source:
  type: github
  url: https://github.com/virgiliojr94/book-to-skill
  identity: github:virgiliojr94/book-to-skill
resource_kind:
  ai: skill
  user: null
navigation:
  categories:
    ai:
      - Memory / RAG / Knowledge
      - Agent / Harness
    user: null
created_at: 2026-09-14
updated_at: 2026-09-14
last_checked_at: 2026-09-14
summary: book-to-skill 是一套把 PDF、EPUB、DOCX、HTML、Markdown 等長文件轉成 Agent Skill 的知識編譯工具，以確定性的 Python 擷取器搭配 Agent 驅動的結構化生成流程，將框架、決策規則、反模式與章節索引整理成按需載入的 SKILL.md 與章節資產。它強調轉換成本前移、漸進式揭露、跨多種 Agent Host 使用，以及文件進入 Agent 上下文前後的安全檢查。
classification:
  categories:
    ai:
      - RAG / Memory / Knowledge
      - Agent
      - LLM
    user: null
  tags:
    ai:
      - agent-skill
      - Agent Skills
      - book-to-skill
      - document-processing
      - knowledge-compilation
      - context-engineering
      - progressive-disclosure
      - PDF
      - EPUB
      - DOCX
      - Python
      - Docling
      - Claude Code
      - GitHub Copilot CLI
      - Codex
      - Amp
      - Hermes Agent
      - prompt-injection
      - document-supply-chain
    user: null
relevance:
  ai:
    overall: 5
    ai_rd: 4
    aoi_ai: 2
    llm_agent: 5
    sillytavern_ai_rpg: 3
    image_gen: 2
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

# book-to-skill

## 一句話介紹

book-to-skill 是一套把長篇技術書、文件資料夾或多份來源「編譯」成可重用 Agent Skill 的工具。它不是單純做一次摘要，也不是把整本書永久塞進上下文，而是把來源中的框架、決策規則、技巧、反模式與章節知識整理成 `SKILL.md`、章節檔、詞彙表、模式集與速查表，讓 Agent 在真正需要時才載入相關部分。

Repository 的主要交付物是可安裝的 Agent Skill，Python 擷取器則是它的支援引擎，因此本卡將 `resource_kind` 判定為 `skill`。目前來源文件說明可搭配 GitHub Copilot CLI、Amp、Claude Code、Codex 與 Hermes Agent 等支援相容 Skill 目錄或 Agent Skills 格式的宿主使用。

## 它解決什麼問題

長文件對 Agent 的問題不只是「讀不讀得完」，而是每次查詢都重新導航與重新載入會反覆消耗上下文。直接搜尋 PDF 往往只得到頁碼或片段；把整本文件丟進 context 雖然保留資訊，卻會讓一次局部問題也付出整本書的 token 成本；只做一份普通摘要，又容易失去章節結構、框架名稱、決策條件與可以實際套用的細節。

book-to-skill 的做法是把這個成本前移。第一次轉換時先辨識文件結構、萃取核心模型與各章重點，再建立索引與按需載入的知識檔。日後 Agent 面對具體問題時，先讀取較小的 `SKILL.md` 核心與章節索引，再只打開相關章節，而不是重新探索完整來源。

這種模式也不限於「書」。README 明確把內部文件、架構決策紀錄、runbook、品牌規範、研究論文集合、RFC、API 契約與標準文件列為可能來源。只要是一批會反覆查閱、具有結構、而且使用者有權處理的文字知識，都可以成為轉成 Skill 的候選。

## 核心概念

### 知識編譯，而不是一般摘要

專案的核心哲學是「抽取結構，不只生成摘要」。Skill 希望保留的是有名稱的框架、可以驅動判斷的原則、逐步技巧、反模式，以及作者在特定概念上的精確表述。

這使最終產物更像「可被 Agent 使用的工作知識」，而不是讀書心得。例如一個決策框架不只留下定義，還應保留什麼情況適用、如何判斷、常見失敗方式與對應章節，讓 Agent 能在工作中重新調用。

### 把成本從查詢時移到轉換時

架構文件將這個原則稱為 **compile-time over runtime**。文件擷取、章節切分、框架整理與索引建立主要在轉換階段完成；真正回答問題時，再依需求載入已整理好的小型資產。

這和每次對話都重新解析 PDF、找目錄、定位章節的 discovery loop 不同。專案自己的效能測試把核心 `SKILL.md` 加一個相關章節估為約 5,000 tokens，並在選定書籍上報告相對於整本 context dump 約 24×–51× 的 token 差距。這是該專案依自身方法與測試資料得到的結果，適合作為架構動機，不應解讀成所有文件、模型與問題都會固定得到同樣倍數。

### 漸進式揭露控制上下文

生成結果會拆成數個層級：

- `SKILL.md`：核心心智模型、重要規則與章節／主題索引。
- `chapters/*.md`：各章的可用知識，只在相關問題出現時載入。
- `glossary.md`：重要術語與章節參照。
- `patterns.md`：技巧、演算法、模式與反模式。
- `cheatsheet.md`：決策表、判斷規則與快速查找層。

這種結構讓「功能增加」不必等同「每回合 context 線性增加」，也是一個很典型的 Agent Skill 漸進式揭露設計。

### 確定性擷取與生成式整理分層

book-to-skill 刻意把兩類問題拆開。第一層是 Python 實作的確定性擷取器，負責讀檔、格式解析、清理、結構偵測與中繼資料；第二層才由 Agent 依 `SKILL.md` 規格理解內容，產生章節摘要與可重用知識結構。

這使「文件怎麼安全、完整地變成乾淨文字」和「模型如何理解並重新組織知識」可以分別測試與演進，而不是全部交給一個大型提示詞。

### 既有 Skill 可以持續折入新來源

除了完整轉換，來源 `SKILL.md` 還定義 Analyze Only、Generate from Prior Analysis，以及 Update / Fold-in 四種操作模式。當同一主題累積新論文、新規格或補充文件時，可以把新內容折入既有 Skill，而不必每次重建一套獨立知識包。

## 架構與技術

Repository 主要以 Python 實作擷取引擎，整體可以分成兩半：

1. **Extractor**：`scripts/extract.py` 作為入口，實際工作由 `book_to_skill/` 下的 CLI、設定、依賴檢查、清理與格式解析模組負責。
2. **Generator**：Agent 依 Repository 根目錄的 `SKILL.md` 執行一系列步驟，將擷取後的內容整理成可安裝的 Agent Skill。

擷取器支援 PDF、EPUB、DOCX、HTML、RTF、純文字、Markdown、reStructuredText、AsciiDoc，以及透過 Calibre 處理的 MOBI／AZW 類格式。不同格式會選擇可用的最佳擷取器並保留 fallback。

PDF 又分為兩種主要路徑：

- **text 模式**：優先使用 `pdftotext`，再退回 `pypdf`、`pdfminer.six`，適合以文字為主的書。
- **technical 模式**：使用 Docling 保留表格、程式碼與較多結構資訊，代價是速度明顯較慢。

一次擷取會建立獨立暫存工作目錄，主要產生 `full_text.txt` 與 `metadata.json`。前者是帶來源邊界的合併文字，後者保存來源、頁數、字數、估算 token、章節／目錄等資料。對超過約 50k tokens 的大型文件，Skill 還明確要求把文字視為可查詢 corpus，優先使用 `grep`、`sed` 等方式選取區段，而不是無限制把整份檔案讀進模型上下文。

Generator 再依內容類型與使用目的決定深度，分析章節、產生章節檔、詞彙表、模式集、速查表與主 `SKILL.md`。完成後可寫到 `~/.agents/skills/<slug>/` 等宿主可發現的位置；Claude Code、Hermes Agent 等平台因 Skill 搜尋路徑不同，另有對應安裝或連結方式。

安裝本身也分成兩種：以 Agent Skill 使用時可透過 `npx skills add virgiliojr94/book-to-skill` 或 clone 到 Skill 目錄；獨立 Python CLI 則只安裝文件擷取引擎，不會自動註冊 `/book-to-skill` Skill。來源文件特別提醒不要混淆這兩條路徑。

## 主要功能

- 將單一檔案、資料夾、glob 或多個來源一次轉成統一 Skill。
- 支援 PDF、EPUB、DOCX、HTML、RTF、Markdown、純文字與多種電子書格式。
- 依技術型／文字型內容選擇不同 PDF 擷取策略。
- 產生核心 `SKILL.md`、按需章節、詞彙表、模式集與速查表。
- 提供完整轉換、只分析、從既有分析生成、更新／折入既有 Skill 四種模式。
- 在正式生成前提供來源統計與 token 成本估算。
- 對大型來源採局部查詢方式，降低整份文件反覆載入的成本。
- 針對不同 Agent Host 提供 Skill 安裝與發現路徑。
- 提供 `tools/validate_skill.py` 檢查產生的 `SKILL.md` 是否符合不同宿主要求。
- 提供生成後安全掃描，檢查可能的提示詞覆寫、模型控制標記、殘留不可見字元、權限擴張與疑似資料外傳內容。
- 對掃描型 PDF 會提早辨識「沒有文字層」的情況並提示先進行 OCR，而不是花完整擷取時間後才得到空內容。
- 支援把新來源折入既有 Skill，適合持續累積研究資料或版本化文件。

## 技術亮點

### 把長文件變成 Agent 原生知識資產

一般 RAG 以「索引 → 檢索 → 回傳片段」為中心；book-to-skill 則更像先把來源編譯成 Agent 自己會使用的知識結構。它保留檢索概念，但真正的產物是可版本控制的 `SKILL.md`、章節、決策規則與索引，而不是只有向量資料庫。

這使它很適合拿來研究「RAG、檔案搜尋、長 context、Memory 與 Skill-based knowledge」之間不同的工程取捨。

### 漸進式揭露不只用在工具說明，也用在知識本體

許多 Agent Skill 會把 reference 拆檔，是為了不要讓工具規則一次佔滿 context。book-to-skill 把相同思想套到外部知識：Skill 核心只保存導航與高密度模型，細節留在章節檔。這是一個很直接的 context engineering 範例。

### 來源供應鏈安全被視為一級問題

架構文件把流程描述成「document → context supply chain」。因為不可信文件中的內容最後可能進入 Agent context，再被生成成另一個日後會自動載入的 Skill，所以它不是普通文字轉檔問題。

目前的防護包含：

- 移除零寬字元、Unicode tag block 與其他不可見控制內容。
- DOCX XML 在解析前拒絕 DTD／entity，避免 XXE 與 Billion Laughs 類風險。
- 外部程式取得檔案路徑前先絕對化，降低以 `-` 開頭檔名造成參數注入的風險。
- 對生成後的 Skill 做提示詞注入與權限擴張型內容掃描。
- CI 使用 CodeQL、Bandit、Zizmor 與相依套件漏洞檢查。

這些機制不能把任意文件變成「可信內容」，但專案至少把文件進入 Agent 行為層後可能造成的風險顯式工程化，而不是把文件視為純資料。

### 擷取器與語意生成器的邊界清楚

擷取階段負責「忠實取得可分析文本」，生成階段負責「把文本改造成可操作知識」。這個分層有利於對錯誤來源做定位：若表格或程式碼遺失，是 parser／extractor 問題；若框架被誤解或決策規則整理錯誤，則是生成與驗證問題。

最新標記版本 `v1.4.0` 也主要集中在擷取可靠性，包括掃描 PDF 提早失敗、避免頁緣清理誤刪正常字詞、多來源目錄偵測、CJK token 估算與目錄辨識、單一來源讀取失敗不拖垮整批等修正。Repository 在該 release 後仍持續有更新，顯示目前仍是活躍演進中的專案。

## 限制與風險

第一個限制是 **擷取可以較確定，但知識重組仍是生成式工作**。即使來源完整，Agent 在萃取框架、摘要章節、歸納反模式或建立決策規則時仍可能省略、誤解或過度概括。README 使用「從真實內容回答、避免 hallucination」作為產品價值，但這不能視為數學上的零幻覺保證；重要技術結論仍應能回查原始來源。

第二個限制是 **文件格式與結構會直接影響品質**。掃描 PDF 必須先 OCR；章節自動偵測依賴可辨認的標題或目錄形式；高度客製化排版、公式、圖像、複雜表格也可能需要 technical 模式或人工檢查。

第三個限制是 **高品質擷取有成本差異**。專案的 103 頁技術 PDF 範例中，`pdftotext` 幾乎立即完成，但無法保留表格與程式碼區塊；Docling 保留了結構，卻需要約 164 秒。這代表「快」與「結構完整」之間需要依來源選擇，而不是固定用單一路徑。

第四個限制是 **專案效能數字具有工作負載前提**。24×–51× 的 context-dump 差距是專案針對特定書籍、token 計算方式與「一個目標問題載入核心 + 單章」模型測得；若問題需要跨很多章、Skill 本身更大、來源結構不同，實際節省比例會改變。

第五個風險是 **生成後 Skill 仍屬於提示詞供應鏈**。內建 scanner 是 advisory guardrail，不是 sandbox，也不能證明文件中的惡意或誤導內容已被完全消除。若來源不可信，應把 generated Skill 視為需要審查的可執行行為內容，而不是一般筆記。

第六個限制是 **跨 Agent Host 的行為並不完全等價**。相同 `SKILL.md` 可以跨多種宿主重用，但 Skill discovery、路徑、工具名稱、權限、symlink 與專案信任機制不同，仍需要各平台的安裝與測試。

第七個風險是 **著作權與再散布**。專案明確指出 converter 本身採 MIT，但被處理的書籍與文件仍受原有權利約束；針對第三方受著作權保護內容產生的 Skill，不應因為已經摘要／重組就自動視為可以公開散布。對私人購買書籍或內部文件，預設保留在私人範圍較合理。

最後要特別注意 **安裝來源安全**。官方 Repository 在 2026-08-17 發布安全公告，指出曾出現未授權的惡意 re-upload，修改版包含資料外傳與本機敏感資料蒐集等行為。應只從 `virgiliojr94/book-to-skill` 官方來源安裝，並避免因名稱相同就信任第三方重新上傳版本。

## 與你的相關性

依公開技術 Profile，這個專案對 **LLM／Agent** 屬於核心相關。它把長文件從一次性「丟進 context」轉成可安裝、可索引、可按需讀取的 Agent 知識層，適合研究 Skill、context engineering、knowledge compilation、工具發現與來源安全之間的關係，因此 `llm_agent` 評為 5。

對 **AI R&D** 也有高度參考價值。技術書、論文集合、研究文件與框架文件都可以成為實驗來源，而且可以直接比較「整份 context、一般檔案搜尋／RAG、生成式摘要、Skill 編譯」在成本、忠實度、可維護性與更新方式上的差異，因此 `ai_rd` 評為 4。

對 **AOI × AI** 的直接演算法價值較低，專案本身沒有檢測、分類、分割或 OCR 模型；但 AOI 技術手冊、設備文件、缺陷規範、論文與標準文件可以被整理成 Agent 參考 Skill，因此仍有工程層面的間接價值，評為 2。

對 **SillyTavern／AI RPG** 評為 3。它沒有 SillyTavern 整合，但同一套「把大型設定集、規則書、世界觀文件或資料集轉成漸進式揭露知識」的設計，可以作為長期角色／敘事 Agent 知識層的參考。

對 **影像生成** 評為 2。可以把模型文件、工作流手冊、風格規範或相關教材整理成 Skill，但專案本身不提供影像生成、diffusion、LoRA 或 ControlNet 能力。

整體 `overall` 評為 5，重點不是它取代 RAG，而是它提供了一條不同的 Agent 知識工程路線：把高頻使用的長文件預先整理成宿主可直接發現與調用的知識 Skill。

## 建議怎麼使用

- **TRY**：先挑一份自己有權處理、而且會反覆查閱的技術文件做實驗。轉換後不要只看檔案是否成功生成，而要拿數個跨章與局部問題，比較原始文件搜尋、直接丟 context 與 Skill 查詢的回答品質、來源可回查性與 token 使用量。
- **INTEGRATE**：對穩定且高頻使用的文件集合，可以把生成 Skill 納入版本控制，搭配 Update / Fold-in 持續加入新版規格或研究資料，讓它成為 Agent 知識層的一部分，而不是一次性摘要檔。
- **LEARN**：優先閱讀 `docs/architecture.md`、`SKILL.md`、`docs/how-it-works.md` 與安全相關程式，拆解「確定性 extractor → 語意 generator → progressive disclosure → generated-skill scan」的邊界設計。
- **REFERENCE**：把它當成 knowledge compilation 路線的代表案例，和向量 RAG、檔案搜尋、長 context、Memory 系統放在一起比較。特別值得觀察的是：哪些知識適合預編譯，哪些仍需要動態檢索，以及來源更新時如何避免 Skill 逐漸失真。

若做最小驗證，建議先使用一份結構清楚的技術文件；有表格、程式碼或公式時選 technical 模式。生成後抽查至少數個章節的原文對應，再測試一個需要多章整合的問題，會比只確認「能不能回答」更能看出這條路線真正的價值與限制。

## 與其他收藏的關聯

- [Agent Skills](./github-addyosmani-agent-skills.md)：兩者都使用可跨 Agent Host 載入的 Skill 作為能力邊界，但 Agent Skills 主要是人工撰寫的工程工作流技能庫；book-to-skill 則是把外部長文件轉譯成新的知識 Skill。兩者可以對照「手工方法論 Skill」與「由來源編譯出的知識 Skill」如何共存。
- [memory-toolkit](./github-tsun-u-memory-toolkit.md)：兩者都在處理長期 Agent 的 context 壓力，但分工不同。memory-toolkit 關心「什麼內容值得寫進長期記憶、什麼時候寫、如何避免記憶污染」；book-to-skill 則把可重建的外部來源知識移出 Memory，整理成可索引、按需讀取的 Skill。一起看可以區分「關係／狀態記憶」與「外部知識資產」應該由哪一層承擔。

## 使用者備註

## 更新紀錄

### 2026-09-14

- 新增 Knowledge Card。
- 依 Repository metadata、README、`SKILL.md`、架構／運作方式／效能／安裝文件、安全公告與最新 release 檢視其文件擷取、知識編譯、跨 Agent Host、漸進式揭露與安全設計。
