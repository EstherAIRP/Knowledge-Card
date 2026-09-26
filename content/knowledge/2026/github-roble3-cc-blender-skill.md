---
schema_version: 1
id: github-roble3-cc-blender-skill
title: cc-blender-skill
canonical_url: https://github.com/RobLe3/cc-blender-skill
source:
  type: github
  url: https://github.com/RobLe3/cc-blender-skill
  identity: github:roble3/cc-blender-skill
resource_kind:
  ai: skill
  user: null
navigation:
  categories:
    ai:
      - Agent / Harness
      - Image Creation / Design
    user: null
created_at: 2026-09-27
updated_at: 2026-09-27
last_checked_at: 2026-09-27
summary: cc-blender-skill 是一套給 Claude Code 使用的 Blender 技能集合，以 text-to-blender 編排器將自然語言需求拆成建模、材質、燈光、相機、渲染、動畫、輸出與參考圖重建等子技能，再透過 Blender MCP 執行 Python；v1.3.0 進一步加入品質改進迴圈、來源鎖定重建與多視角驗證。
classification:
  categories:
    ai:
      - Agent
      - AI Coding / DevTools
      - Image Generation
    user: null
  tags:
    ai:
      - Claude Code
      - Blender
      - Blender MCP
      - Agent Skills
      - 3D Generation
      - Tool Orchestration
      - Visual Validation
      - Reference-to-3D
      - Quality Refinement
    user: null
relevance:
  ai:
    overall: 4
    ai_rd: 3
    aoi_ai: 2
    llm_agent: 4
    sillytavern_ai_rpg: 2
    image_gen: 4
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

# cc-blender-skill

## 一句話介紹

cc-blender-skill 是一套面向 Claude Code 的 Blender 技能集合：它不另外包一層大型控制程式，而是讓 Claude 依自然語言意圖載入不同 SKILL.md，再透過 Blender MCP 執行 Blender Python，完成從場景規劃、建模、材質、燈光、相機、渲染、動畫到輸出的工作流。

目前 README 與 plugin manifest 標示版本為 **1.3.0**，包含 **30 個可串接技能**。專案聲稱核心流程已在 Blender 5.1.1 上用 6 類場景做端到端驗證，並明確把 Blender 4.x 標為「有相容程式碼、但未直接測試」。

## 它解決什麼問題

單純讓語言模型「呼叫 Blender」並不等於能穩定完成 3D 製作。真正困難的是：模型要知道何時該建模、何時先鎖相機、怎麼安排材質與燈光、如何在多個技能之間交接，以及如何判斷一張技術上成功的渲染其實視覺上是錯的。

這個專案把問題拆成一組可組合的技能與驗證關卡。頂層 text-to-blender 負責辨識意圖與排程，再依需求載入建模、材質、燈光、相機、渲染、動畫、輸出或參考圖重建等技能。複雜任務則交給 blender-skill-harmonizer 統一處理技能優先順序、來源真值與交接契約。

## 核心概念

第一個核心是 **技能編排而不是單一巨型提示詞**。每一類 Blender 任務都有自己的技能說明與配套 references，頂層技能只負責路由、排序與必要的全域規則。這種拆法降低單一提示詞膨脹，也讓技能可以獨立改善。

第二個核心是 **以視覺驗證作為完成條件**。專案要求渲染後呼叫 mcp__blender__get_viewport_screenshot 或直接讀取輸出影像，檢查主體是否可辨識、比例與構圖是否合理、材質是否有實際可見差異；僅有物件數量、頂點數或 API 無錯誤並不足以宣告成功。

第三個核心是 **來源鎖定的參考圖重建**。新版將參考圖、正交視圖、貼圖集與品牌素材先整理成 source manifest，再利用輪廓、遮罩、多視角註冊、IoU／SSIM／bbox／centroid 等量化訊號進行比對，避免只靠「看起來像」的主觀重建。

第四個核心是 **把失敗轉成技能改進**。v1.3.0 的 quality-refinement-autoloop 會先凍結失敗成果、收集證據、分類失敗維度，再判斷是重用現有技能或補強通用技能；只有技能與驗證通過後才回到成品修復。這比反覆盲目重試更接近可維護的 Agent 工程流程。

## 架構與技術

專案的實際可安裝內容位於 plugin/，其中 plugin/manifest.json 宣告 30 個技能及其角色。主要層次可整理為：

- **頂層編排器**：text-to-blender、blender-skill-harmonizer、quality-refinement-autoloop。
- **領域技能**：建模、材質、燈光、相機、渲染、動畫、輸出、UV／貼圖等。
- **專項技能**：wireframe-to-3d、reference-to-3d、contour-to-mesh、orthographic-registration、multiview-fit-loop、fit-repair-optimizer、reference-look-calibration 等。
- **執行層**：透過 ahujasid/blender-mcp 暴露的 MCP 工具，主要由 mcp__blender__execute_blender_code 執行產生的 bpy 程式碼。
- **驗證層**：場景資訊、物件資訊、viewport screenshot、參考圖量測與品質關卡。

專案採「純技能」設計：沒有自建新的 Blender MCP，也沒有額外 Python orchestration wrapper。Claude 本身就是編排器，技能主要由 Markdown 決策規則、程式片段、references 與少量輔助腳本構成。

安裝端要求 Claude Code >= 1.0、Blender >= 4.0，以及 ahujasid/blender-mcp >= 1.5.0。只有 wireframe-to-3d 等影像處理流程額外依賴 OpenCV、NumPy、SciPy 與 Pillow。

## 主要功能

- 由自然語言自動路由到建模、材質、燈光、相機、渲染、動畫與輸出技能。
- 依專業場景組裝順序執行 block-out、camera lock、light、geometry、material、final render 與 export。
- 以真實物件尺寸 references 約束常見物件比例，降低模型任意猜尺寸。
- 支援 glTF／GLB、FBX、OBJ、USD、STL 等輸出流程。
- 提供 wireframe-to-3d 與 reference-to-3d 類工作流，處理 2D 線稿、正交視圖與貼圖來源。
- 以多視角註冊、輪廓／遮罩比對、IoU、SSIM、bbox、centroid 等訊號檢查重建結果。
- 針對失敗輸出提供品質改進迴圈，將問題分類、補強技能、執行 sanitizer 與驗證後再修復成品。
- 每個技能帶 starter trigger eval，用來檢查技能描述是否過度觸發或漏觸發。

## 技術亮點

最值得保留的不是 Blender recipe 數量，而是它對「技能型 Agent 如何可靠操作視覺軟體」的工程拆解。

一是它明確承認 **工具執行成功不代表視覺任務成功**，因此把 viewport screenshot 與視覺檢查放進完成條件。這個模式可泛化到任何 GUI／創作型 Agent：最終輸出需要由任務層證據驗證，而不是只看 API 回傳值。

二是它對複雜技能加入 **交接契約與來源真值**。當建模、UV、材質、渲染同時作用時，錯誤常來自子技能各自最佳化卻互相衝突；blender-skill-harmonizer 的角色就是先處理 precedence 與 handoff，再執行實作。

三是 v1.3.0 的品質迴圈把「失敗後再試一次」改造成 **可累積的技能改進流程**：凍結成果 → 蒐集證據 → 判斷 skill gap → 去除專案特定資訊 → 更新通用技能 → 驗證 → 再修復產品。這種結構對 Agent Harness 與技能庫維護特別有參考價值。

## 限制與風險

專案目前仍有幾個需要保守看待的地方：

- README 明確表示 Blender 5.1.1 有實測，而 Blender 4.x 雖有相容處理但未直接測試，不能把「Blender >= 4.0」理解成各版本都有相同驗證強度。
- 參考圖鎖定重建、動畫品質關卡與品質改進迴圈是近期擴充，專案自己也列出仍需要更多外部、不同來源素材的驗證。
- trigger eval 目前主要是每技能 10 個正例與 10 個反例的 starter set，而且尚未提供完整自動 runner；README 提到的聚合結果不等於成熟的持續評測系統。
- Blender MCP 允許執行生成的 Python，能力很強，也代表錯誤程式碼可能修改場景、覆寫輸出或操作檔案。正式使用時仍應限制工作目錄、保留版本與檢查高風險程式碼。
- 「純技能」設計容易部署，但可靠度高度依賴 Claude 是否正確載入技能、遵守每個 SKILL.md 的順序與驗證規則；它不像具強制狀態機的 workflow engine 那樣能從程式層硬性保證每個 gate 一定執行。
- 複雜角色雕刻、工程級 CAD、重型模擬等本來就不是這套 recipe 型工作流的強項，專案本身也有明確範圍限制。

## 與你的相關性

依公開技術背景，這個專案同時落在 **Agent** 與 **AI Image Generation／創作工作流** 的交界，相關性偏高。

對 Agent 研究而言，它是一個很具體的「技能路由 + 子技能編排 + 工具執行 + 視覺驗證 + 失敗改進」範例；對影像生成與創作工具而言，它展示了如何把語言模型從單次產生指令提升成能持續操作 Blender、檢查結果並修正的工作流。

它對 AOI × AI 的直接用途較弱，但「視覺結果不能只靠 API／數值成功判定」與「把視覺證據設為 gate」這兩個設計觀念仍具有跨領域參考價值。

## 建議怎麼使用

**TRY**：如果已經使用 Claude Code 與 Blender，可直接以小型產品場景測試完整鏈路，例如建模 → 材質 → 三點燈光 → render → glTF export，再觀察技能是否真的依規定執行視覺驗證。

**LEARN**：值得拆讀 text-to-blender、blender-skill-harmonizer 與 quality-refinement-autoloop，重點不是 Blender recipe，而是它如何定義技能路由、handoff、驗證與失敗後學習。

**REFERENCE**：可作為設計其他「LLM 操作專業 GUI／創作軟體」技能系統時的參考案例，尤其是 screenshot gate、source-of-truth、reference-locked reconstruction 與 skill-gap loop。

## 與其他收藏的關聯

目前未在公開 Knowledge Card 儲存庫中找到足夠直接、可確認存在的 Blender／Blender MCP 相關卡片，因此暫不建立硬連結。後續若收錄 Blender MCP、其他 Claude Code 3D skill 或 GUI Agent 工具，可把本卡作為「技能編排與視覺驗證」節點串接。

## 使用者備註

## 更新紀錄

### 2026-09-27

- 建立 Knowledge Card。
- 依 v1.3.0 README、plugin manifest、text-to-blender 與 quality-refinement-autoloop 重新整理其技能編排、視覺驗證、來源鎖定重建與品質改進架構。
