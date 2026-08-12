---
schema_version: 1
id: github-hugohe3-ppt-master
title: PPT Master
canonical_url: https://github.com/hugohe3/ppt-master
source:
  type: github
  url: https://github.com/hugohe3/ppt-master
  identity: github:hugohe3/ppt-master
created_at: 2026-08-12
updated_at: 2026-08-12
last_checked_at: 2026-08-12
summary: PPT Master 是一套讓 AI Agent 從文件、URL、主題或既有 PPTX 產生原生可編輯 PowerPoint 的開源 Skill／workflow；它以受約束 SVG 作為視覺中介語言，編譯為 DrawingML，並加入模板、原生圖表與表格、動畫轉場、旁白、品質檢查與本機預覽。
classification:
  categories:
    ai:
      - Agent
      - AI Coding / DevTools
      - General Tools
    user: null
  tags:
    ai:
      - PowerPoint
      - PPTX
      - presentation-generation
      - agent-skill
      - SVG-to-PPTX
      - DrawingML
      - OOXML
      - template-system
      - native-charts
      - slide-animation
      - narration
      - visual-quality-gate
    user: null
relevance:
  ai:
    overall: 4
    ai_rd: 3
    aoi_ai: 1
    llm_agent: 5
    sillytavern_ai_rpg: 1
    image_gen: 3
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

# PPT Master

## 一句話介紹

PPT Master 是一套把 AI Agent 的內容理解、敘事規劃與視覺設計能力，接到原生 PowerPoint 物件模型上的開源 workflow：輸入 PDF、DOCX、XLSX、URL、Markdown、主題文字或既有 PPTX，輸出可在 PowerPoint 中持續編輯的 `.pptx`，而不是整頁截圖或只有薄層文字框的偽可編輯簡報。

## 它解決什麼問題

一般 AI 簡報工具常把「可編輯」簡化成文字框與圖片仍能拖動，但真正的 PowerPoint 編輯需求還包括原生 shapes、connectors、charts、tables、slide masters、layouts、transitions、animations、speaker notes 與 narration。PPT Master 的定位是盡量保留或重建這些 PowerPoint-native semantics，讓生成結果更接近人工製作的檔案結構。

它也把簡報生成拆成一個 Agent workflow，而不是單次 prompt：先讀取或轉換來源、補齊必要事實、規劃敘事與視覺系統、準備圖片／圖表／公式資源、生成頁面、執行 deterministic quality gate，再編譯與 postflight。這讓「AI 決策」與「可重複驗證的檔案處理」有明確分工。

## 核心概念

PPT Master 最重要的設計不是某一套版型，而是 **harness + model = agent**。Repository 提供簡報領域的 workflow、rules、artifacts、quality gates 與轉換工具；實際內容理解與設計品質仍受所選模型影響。

另一個核心是把 SVG 當成 **專案限定的 page-design intermediate language**。它不是接受任意 SVG，而是定義一套 project-canonical SVG 子集合，限制元素、屬性、單位、metadata 與 DrawingML mapping。這讓 Agent 能用相對容易生成與檢查的 2D XML 表達頁面，再由 deterministic converter 轉成原生 PPTX shapes。

第三個核心是 route separation。新簡報、快速生成、從圖片重建、填入既有 PPTX、增強既有 PPTX、beautify 與 reusable template 建立，不共用同一種 mutation model；例如 Fill Native PPTX 直接 clone slide shells 並修改 OOXML，而 Generate route 才走 SVG authoring → DrawingML compilation。

## 架構與技術

預設 Generate PPTX pipeline 大致為：

1. `source_to_md.py` 依 PDF、DOCX、XLSX、PPTX、URL 等來源轉成可分析內容，必要時補 topic research。
2. `project_manager.py` 建立 project、封存 sources，並對既有 PPTX 做 intake／identity／slide library 分析。
3. Strategist 進行 communication contract、template choice、page count、visual system 與 production decision，產生 `design_spec.md` 與 `spec_lock.md`；Quick profile 則把這些決策保留在當前 Agent context，不建立可續跑的規劃 artifacts。
4. Executor 生成 `svg_output/`，先做 first-page quality gate，再完成全 deck，最後執行 `svg_quality_checker.py --stage final`。
5. 若包含資料圖表，另做 chart calibration；speaker notes、旁白、動畫與 transition 由各自的 sidecar／post-processing contract 處理。
6. `finalize_svg.py` 產生視覺預覽，`svg_to_pptx.py` 驗證 mapping 與 package 後將 canonical SVG 編譯為 DrawingML PPTX，並輸出 postflight report。

主要 Python 依賴包括 `python-pptx`、`XlsxWriter`、`skia-pathops`、`uharfbuzz`、`PyMuPDF`、`mammoth`、`markdownify`、`openpyxl`、`Pillow`、`requests`、`beautifulsoup4`、`google-genai`、`Flask` 與 `edge-tts`。多數 orchestration／file operation 工具仍以 Python standard library 為主。

## 主要功能

- **從多種來源生成簡報**：可處理文件、試算表、URL、Markdown、主題文字與既有 PPTX，並產生原生可編輯 `.pptx`。
- **Native PowerPoint objects**：支援 DrawingML shapes、connectors，以及依需求產生真正 data-backed 的 charts／tables，而不是把所有內容 rasterize。
- **模板與品牌重用**：可從既有簡報建立 Brand、Style、Layout、Deck workspace，也可直接以 Fill Native PPTX 路徑保留原生 slide shell。
- **Live preview 與人工修正**：生成過程可開 localhost preview；使用者可直接修改 SVG element 的文字、顏色、字體、尺寸與位置，或留下 annotation 再讓 Agent 重寫。
- **Transitions 與 animations**：輸出真正的 OOXML page transitions，並可選擇 entrance、emphasis、motion path、exit 等原生 animation presets。
- **Speaker notes、語音旁白與影片流程**：可把 notes 轉成逐頁 audio，嵌回 PPTX；預設可使用 `edge-tts`，也支援多個雲端 voice provider 與 cloned voice workflow。
- **Quick profile**：可跳過互動式 confirmation 與持久化規劃 artifacts，保留主要工具能力做 one-pass generation。
- **品質與可追蹤性**：有 first-page/final SVG checker、package validation、chart verification、postflight report 與 project-scoped workflow log。

## 技術亮點

第一個亮點是 **把 AI 簡報生成做成 compiler-like pipeline**。Agent 不直接「畫完就算完成」，而是經過 source normalization、planning、canonical authoring language、static checks、compilation 與 postflight。這種設計比單純把 prompt 加長更接近可靠的 artifact engineering。

第二個亮點是 **canonical SVG → DrawingML**。把 SVG 視為有限語言而不是通用格式，可以建立明確的 invalid／compatible／canonical 邊界；checker 與 converter 各自負責不同 correctness 層，避免「瀏覽器看起來正常」被錯當成「PPTX 結構一定正確」。

第三個亮點是 **mutation model 分流**。Fill Native PPTX、Enhance Native PPTX 直接操作 OOXML；Beautify 則重新生成視覺；Generate 才以 SVG 為 page authority。這個 route boundary 很值得 Agent 工程參考，因為它避免所有需求都被硬塞進同一個抽象層。

第四個亮點是 **品質 gate 與 provenance 意識**。專案要求 final quality report 才能 formal release，對 template、brand 值與資料圖表也強調來源與可驗證性。最新 v4.5.0 甚至把 brand workspace 中可由公開 guideline 證實的值標為 `fact`，其餘明確標示 `approx`，反映它正在把設計資產也納入 evidence-aware workflow。

## 限制與風險

PPT Master 不是獨立模型，最終品質仍高度依賴驅動它的 Agent／LLM。官方文件明確指出 harness 提供流程下限，但模型設定品質上限；長流程也代表 context 管理、指令遵循與 host agent 能力會直接影響結果。

Native depth 並不等於完整覆蓋 PowerPoint。專案刻意維護 PowerPoint ↔ SVG mapping 邊界，部分能力仍可能缺失或只在特定 route 支援；SmartArt 目前屬刻意不做的範圍。動畫主要以 Microsoft PowerPoint 為驗證目標，Keynote、WPS、LibreOffice 可能重新映射或忽略部分 effect／Start semantics。

Quick mode 雖然方便，但它不建立 `design_spec.md`、`spec_lock.md` 或可恢復的 Strategist state；若 active context 消失，無法從 operational logs 重建當時的設計決策，只能重新執行 Quick。

資料「本機處理」也不能被理解成完全離線。Repository 表示除 AI model communication 外 pipeline 主要在本機運作；若選用雲端 LLM、image generation 或 TTS provider，來源內容、prompt 或語音資料仍可能離開本機，實際 privacy boundary 取決於 provider 設定。

截至 2026-08-12，Repository 為公開 MIT 專案，GitHub 約有 45k stars、3.6k forks，`main` 當日仍有提交；最新正式 release 是 **v4.5.0**，發布於 2026-08-09。高活躍度代表成熟度與社群關注度都很高，但也表示 route、template contract 與 capability surface 仍在快速演進，整合時應固定版本並保留回歸測試。

## 與你的相關性

依公開技術 Profile，PPT Master 對 **LLM / Agent** 的相關性最高。它是一個完整的 domain-specific Agent harness 範例：不只提供 Skill prompt，還把 route selection、persistent artifacts、deterministic tools、quality gates、compiler boundary 與 postflight 組成可執行系統，因此 `llm_agent` 評為 5。

對 **AI R&D** 的價值主要在 Agent engineering、multimodal content transformation、evaluation／quality-gate design 與 artifact pipeline，而不是模型訓練本身，所以評為 3。對 **Image Generation** 有中度旁通價值：影像生成只是 deck resource pipeline 的其中一環，但它示範了如何把 generated images 納入 layout、provenance、review 與 editable output，因此評為 3。

AOI × AI 與 SillyTavern／AI RPG 都不是直接目標，因此分數保守。整體仍評為 4，因為它同時具備立即可試用價值，以及相當完整的 Agent workflow／validation 架構參考價值。

## 建議怎麼使用

- **TRY**：先用一份公開 PDF 或技術文件跑 Default 與 Quick 各一次，直接比較輸出 `.pptx` 的 native editability、圖表／表格結構、layout quality 與人工修正時間。
- **LEARN**：優先閱讀 `skills/ppt-master/SKILL.md`、routing、`docs/technical-design.md`、`svg_quality_checker.py` 與 `svg_to_pptx.py`。真正值得研究的是「Agent reasoning 與 deterministic compiler／validator 如何切分責任」。
- **REFERENCE**：可把它當作 domain Agent Skill 的大型實例，尤其適合參考 canonical intermediate representation、route contract、first-page gate、final gate、postflight 與 resumability 邊界的設計。

若後續要正式整合進工作流程，建議先固定 release 版本，建立一組代表性文件與預期 deck 的 regression set，再評估是否增加 `INTEGRATE`；不要只依官方 showcase 判斷穩定性。

## 與其他收藏的關聯

- [Hallmark](./github-nutlope-hallmark.md)：兩者都是把專業設計知識包成可供 Claude Code／Codex 類 Agent 使用的 Skill／harness，但 Hallmark 聚焦前端 UI 並用規則抑制 AI-slop；PPT Master 則進一步加入中介表示、compiler、OOXML mutation route 與 artifact validation。兩者適合一起比較「規則型 Skill」與「具 deterministic toolchain 的 domain Agent」在可靠性上的差異。

## 使用者備註


## 更新紀錄

### 2026-08-12

- 首次收錄 PPT Master。
- 依 README、Getting Started、Technical Design、requirements、Repository metadata 與 v4.5.0 release 整理其 Agent workflow、canonical SVG、DrawingML／OOXML 路徑、模板系統、品質 gate 與目前成熟度。
