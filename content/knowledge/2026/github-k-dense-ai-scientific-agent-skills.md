---
schema_version: 1
id: github-k-dense-ai-scientific-agent-skills
title: Scientific Agent Skills
canonical_url: https://github.com/K-Dense-AI/scientific-agent-skills
source:
  type: github
  url: https://github.com/K-Dense-AI/scientific-agent-skills
  identity: github:k-dense-ai/scientific-agent-skills
resource_kind:
  ai: skill
  user: null
created_at: 2026-08-28
updated_at: 2026-08-28
last_checked_at: 2026-08-28
summary: Scientific Agent Skills 是 K-Dense 維護的大型科學 Agent Skill 資料庫，將生物資訊、化學資訊、藥物探索、醫學研究、科學計算、資料分析與研究寫作等工作流程包成可攜式能力模組，並同時支援 Agent Skills 與 Agent Plugins 規格；適合用來補強研究型 Agent 的領域知識、工具操作與證據邊界。
classification:
  categories:
    ai:
      - Agent
      - AI / ML
      - AI Coding / DevTools
    user: null
  tags:
    ai:
      - Agent Skills
      - Agent Plugins
      - AI Scientist
      - scientific computing
      - scientific databases
      - bioinformatics
      - cheminformatics
      - drug discovery
      - research workflow
      - Python
      - skill library
    user: null
relevance:
  ai:
    overall: 5
    ai_rd: 5
    aoi_ai: 3
    llm_agent: 5
    sillytavern_ai_rpg: 2
    image_gen: 2
  user: {}
actions:
  ai:
    - TRY
    - INTEGRATE
    - REFERENCE
  user: null
status:
  ai: active
  user: null
---

# Scientific Agent Skills

## 一句話介紹

Scientific Agent Skills 是一套大型、可直接載入 Agent 的科學研究技能庫，把資料庫查詢、科學 Python 套件、研究方法、分析流程與科學溝通等專業能力整理成可重用的 Agent Skills，讓通用 Coding Agent 能以較明確、可重複的方式執行科學工作流程。

目前 Repository 頂部標示版本為 `2.64.0`、163 個技能與 100+ 科學資料庫，並同時宣告支援開放的 Agent Skills 與 Agent Plugins 規格。它不是一個單一 AI 科學家應用程式，而是可以被 Cursor、Claude Code、Codex、Gemini CLI、Google Antigravity、Pi 等相容 Agent Host 載入的「能力層」。

## 它解決什麼問題

通用 LLM 即使會寫 Python，也不代表它能可靠完成生物資訊、藥物探索、臨床研究、科學計算或實驗資料處理。實際研究工作往往還需要知道：

- 應該查哪個資料庫、API 或科學套件；
- 套件目前的使用方式、資料格式與版本差異；
- 多個工具要如何串成有順序的分析流程；
- 哪些步驟需要保留來源、引用、provenance 或人工審查；
- 醫療、法規與高風險研究情境有哪些不可跨越的輸出邊界。

Scientific Agent Skills 的做法不是重新實作所有科學工具，而是把這些領域知識、操作程序、範例、外部服務與安全限制預先整理成 Skill。這讓 Agent 不必每次都從零搜尋文件，也把原本散落在套件文件、資料庫說明與研究慣例中的 know-how 變成可被 Agent 發現與載入的能力模組。

## 核心概念

第一個核心概念是 **把專業能力從 Agent Runtime 分離**。Repository 不綁定單一模型或單一 Coding Agent，而是把科學工作流程包成 Agent Skills；只要 Host 支援對應規格，就能以相近方式載入。這使模型、Runtime 與專業能力可以分開演進。

第二個概念是 **文件化的領域工作流程**。每個 Skill 以 `SKILL.md` 為主要入口，除了告訴 Agent「這個能力是什麼」，也會提供使用情境、操作程序、程式範例、外部依賴、參考資料與限制。部分 Skill 另外帶有 `scripts/`、tests 或其他輔助資源，因此不是只有一句提示詞。

第三個概念是 **組合式研究流程**。單一 Skill 可能只負責 Scanpy、RDKit、PubMed、ChEMBL、DiffDock 或統計分析，但 Agent 可以在同一任務中依序調用多個 Skill，把資料取得、分析、建模、視覺化與報告串成較長的研究流程。

第四個概念是 **安全與證據邊界也屬於能力定義的一部分**。Repository 對臨床、醫療、法規與高風險研究情境加入明確限制，例如要求使用去識別資料、將輸出視為研究或草稿、保留 qualified review，避免把 Skill 誤當成診斷、治療或合規認證系統。

## 架構與技術

Repository 的主要交付物是 `skills/` 下的大量 Skill，因此 `resource_kind` 判定為 `skill`。整體架構可分成幾層：

- `skills/<skill-name>/SKILL.md`：每個能力的主要說明與 Agent 指令入口。
- `plugin.json`：依 Agent Plugins 1.0.0 Schema 宣告整個 Repository 為可載入的 plugin package，版本目前為 `2.64.0`。
- `pyproject.toml`：Repository 本身的維護／測試工具使用 Python 3.13+，並依賴 `pytest`、Cisco AI Skill Scanner 等工具；各 Skill 的實際依賴則依個別文件決定。
- `tests/` 與 CI：對含 `scripts/` 的 Skill 要求對應測試，並有 Repository 級結構驗證、連結解析、腳本解析與 `--help` 行為檢查。
- Security Scan：使用 Cisco AI Defense Skill Scanner 進行定期掃描，並發布安全報告。

安裝方式也反映它的「能力套件」定位。支援的 Host 可使用：

```bash
npx skills add K-Dense-AI/scientific-agent-skills
```

GitHub CLI 新版也可用：

```bash
gh skill install K-Dense-AI/scientific-agent-skills
```

需要可重現環境時可 pin 到 release tag 或 commit SHA。Agent Plugins 相容客戶端則可以把整個 Repository 當作一個 plugin 載入。

## 主要功能

- **科學資料庫存取**：Repository 宣稱覆蓋 100+ 科學與金融資料庫，其中 `database-lookup` 提供對 78 個公開資料庫的統一、具 provenance 的查詢路徑，另外還有多個專用資料庫 Skill。
- **科學 Python 套件工作流程**：提供 70+ 套件導向 Skill，涵蓋 RDKit、Scanpy、scikit-learn、PyTorch Lightning、pydicom、GeoPandas、pymatgen、Qiskit、OpenMM／MDAnalysis 等。
- **生物資訊與多體學**：包含基因體、單細胞 RNA-seq、蛋白質體、代謝體、路徑分析、調控網路與族群基因體工作流程。
- **藥物探索與化學資訊**：涵蓋 ChEMBL、分子性質、虛擬篩選、ADMET、分子對接、結構活性關係與 lead optimization。
- **醫學研究與生醫影像**：包含 clinical trial、變異證據整理、DICOM、病理影像與研究型醫療 AI 工作流程，同時保留非診斷／非治療邊界。
- **研究分析與科學溝通**：涵蓋文獻搜尋、假設生成、統計分析、科學寫作、peer review、投影片、圖表與文件處理。
- **實驗室與研究平台整合**：提供 Benchling、DNAnexus、OMERO、Protocols.io、Opentrons 等整合 Skill。
- **Agent 平台能力**：除了科學內容，也包含 Pi SDK、RPC、extension、provider／model 與 session tooling 等 Agent 開發相關 Skill。

## 技術亮點

第一個亮點是 **把「領域專家操作知識」變成可攜式 Agent capability**。傳統 Agent 專案常把所有提示詞、工具規則與 domain logic 寫死在單一應用裡；這個 Repository 則把能力拆成獨立 Skill，讓 Agent Runtime 可以更換，而專業流程仍能重用。

第二個亮點是 **Skill 同時扮演文件、流程與安全契約**。它不是只有「這個套件怎麼呼叫」的 API cheat sheet，而是試圖把何時使用、如何組合、應保存哪些證據，以及哪些情境必須交給人工判斷一起寫進能力定義。對研究型 Agent 來說，這比單純增加工具數量更重要。

第三個亮點是 **以既有科學生態為主，而不是重造輪子**。Repository 將大量成熟 Python library、公共資料庫與研究服務整理成 Agent 可理解的介面；真正的計算仍由 RDKit、Scanpy、OpenMM、NCBI、ChEMBL 等底層工具完成。這使 Skill 層更像一個「操作知識與 orchestration adapter」。

第四個亮點是 **供應鏈與品質控制開始被當成 Skill 工程的一部分**。專案有 Skill 測試、Repository 級結構驗證、安全掃描、版本欄位與可 pin 安裝方式。這對大型 Skill 市集特別關鍵，因為能力數量增加後，單靠人工閱讀很難維持一致性。

第五個亮點是 **適合作為 Agent Skills 生態的實際規模案例**。163 個 Skill 已經足以暴露一個重要工程問題：不是「能不能載入 Skill」，而是怎麼做 discovery、選擇、版本管理、權限邊界、上下文控制與信任管理。README 也因此直接建議不要一次安裝整包，而是優先選擇需要的子集合。

## 限制與風險

最大的風險是 **Skill 本身具有供應鏈與執行權限風險**。Repository 明確提醒，Skill 可以引導 Coding Agent 執行任意程式、安裝套件、發送網路請求與修改本機檔案。即使專案有安全掃描與 review，也不能視為完整安全保證，尤其 Repository 已包含不少社群貢獻。

第二個限制是 **效果仍高度依賴 Host、模型與工具環境**。Skill 多半是 instructions、references、scripts 與 examples 的組合，不是 deterministic scientific engine；同一 Skill 在不同模型、不同工具權限與不同上下文下，遵循程度與結果品質仍可能不同。

第三個限制是 **外部資料來源與 API 仍各有自己的限制**。資料庫可能需要 API key、受到 rate limit、授權條款、網路政策或服務可用性影響；安裝 Skill 不等於這些底層資源一定可用。

第四個限制是 **大量 Skill 會帶來 discovery 與 context 成本**。README 特別指出整包技能的 standing context 很大，建議只安裝需要的主題子集。對 Agent 系統而言，能力越多不一定越好；若 selection/routing 不佳，反而可能增加錯誤觸發與上下文干擾。

第五個限制是 **Repository 文件已有少量版本／數量漂移跡象**。README 頂部與主要介紹寫 163 個 Skill，但部分段落仍寫 161；因此引用技能總數時應以目前主要 metadata 為準，並預期數量會快速變動。

第六個限制是 **科學與醫療輸出不能因為有 Skill 就視為已驗證結論**。專案本身在醫療、臨床與法規相關 Skill 中反覆保留研究用途與 qualified review 邊界；真正影響病患、法規或實驗放行的決策仍需要適格專業人員與原始證據確認。

## 與你的相關性

依公開技術 Profile，這個 Repository 對 **AI R&D** 與 **LLM / Agent** 都屬核心相關，因此 `ai_rd` 與 `llm_agent` 都評為 5。它提供的不只是科學工具清單，而是一個大型 capability packaging 案例，可用來研究 Skill discovery、工具路由、領域知識封裝、證據 provenance、安全掃描、版本管理與多 Skill orchestration。

對 **AOI × AI** 評為 3。專案不是工業 AOI 工具，也沒有直接聚焦製造檢測；但它包含 computer vision、醫療影像、資料分析與科學 Python 工作流程，其「把影像／資料處理 know-how 封裝成 Skill」的方式可作為視覺與檢測型 Agent 的架構參考。

對 **SillyTavern / AI RPG** 評為 2。科學內容本身關聯低，但大型 Skill library 的 discovery、按需載入與能力模組化思路，可類比到角色 Agent 的工具／世界知識能力設計。對 **Image Generation** 評為 2，主要價值在工作流程與工具封裝方法，而非影像生成模型本身。

整體評為 5，原因是它同時具備可直接試用的實務價值，以及很高的 Agent architecture 參考價值。

## 建議怎麼使用

- `TRY`：不要先整包安裝，先挑 3–5 個與當前研究任務直接相關的 Skill，例如 `database-lookup`、科學寫作、統計分析，再搭配一個領域套件 Skill，觀察 Agent 是否真的減少文件查找與錯誤工具選擇。
- `INTEGRATE`：若已有自己的 Agent Runtime，可把 Scientific Agent Skills 視為 capability layer，建立「搜尋 Skill → 選擇少量相關 Skill → 載入 → 執行 → 驗證輸出」的流程，而不是把全部內容永久塞入 system context。
- `REFERENCE`：研究 `SKILL.md`、測試、安全掃描與 plugin packaging 的做法，特別適合用來設計自己的大型 Skill Repository、Skill registry 或 domain-specific Agent capability system。

若要正式導入，建議 pin 到 release tag 或 commit SHA，並把 Skill 安裝視為第三方程式碼供應鏈管理：先看 `SKILL.md`、檢查 scripts 與外部網路需求，再只開放必要權限。

## 與其他收藏的關聯

- [ISO 24495 Skill](./github-danyuchn-iso-24495-skill.md)：兩者都把專業知識整理成 Agent Skill；ISO 24495 Skill 是窄領域、單一能力的乾淨範例，Scientific Agent Skills 則展示大量異質 Skill 在同一 Repository 中的 discovery、測試、安全與版本管理問題。
- [Pi Agent Harness](./earendil-works-pi.md)：Pi 偏向 Agent Runtime／Harness，Scientific Agent Skills 偏向可被 Runtime 載入的 capability layer。兩者組合可清楚區分「Agent 怎麼執行」與「Agent 會做什麼」兩個架構層級。

## 使用者備註


## 更新紀錄

### 2026-08-28

- 首次收錄 Scientific Agent Skills；整理其 Agent Skills／Agent Plugins 可攜式技能架構、科學資料庫與 Python 工作流程覆蓋、安全掃描與供應鏈風險。
