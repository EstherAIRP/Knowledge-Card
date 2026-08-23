---
schema_version: 1
id: github-max0821-web-design-skill
title: Web Design Skill
canonical_url: https://github.com/max0821/web-design-skill
source:
  type: github
  url: https://github.com/max0821/web-design-skill
  identity: github:max0821/web-design-skill
resource_kind:
  ai: skill
  user: null
created_at: 2026-08-23
updated_at: 2026-08-23
last_checked_at: 2026-08-23
summary: Web Design Skill 是一套以視覺優先為核心的 Agent Skill，將網站設計從「直接產生 HTML」改造成可核准、可拆解、可反覆驗證的設計到程式流程，透過 Approved Visual Target、四種結構圖、資產鎖定與實際渲染 QA，降低 AI 網頁設計的模板化與視覺漂移。
classification:
  categories:
    ai:
      - Agent
      - AI Coding / DevTools
    user: null
  tags:
    ai:
      - agent-skill
      - web-design
      - design-to-code
      - frontend
      - visual-qa
      - screenshot-to-code
      - responsive-design
      - design-system
      - asset-locking
      - render-based-qa
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

# Web Design Skill

## 一句話介紹

Web Design Skill 是一套以「先確立視覺設計，再進入程式實作」為核心的 Agent Skill，讓 Agent 在網站設計、重設計、截圖轉程式與視覺重建任務中，先建立可核准的視覺目標，再用結構化拆解、資產管理與實際渲染比對維持設計一致性。

## 它解決什麼問題

許多 AI 網頁工作流會從文字需求直接跳到 HTML/CSS。這種方式雖然快，但常出現幾個問題：版型過度模板化、視覺概念與最終實作落差大、圖片與文字關係在多輪修改後漂移，以及程式碼看似合理但真正渲染出的畫面並不接近目標。

這個 Skill 把「設計到程式」拆成一條更完整的流程：

`理解需求 → 漸進式釐清 → 藝術指導 → 視覺探索 → 使用者回饋 → 核准視覺目標 → 結構拆解 → 一致性契約 → 資產解析 → 實作 → 渲染 → 比對 → 修正 → 重複`

核心取捨是增加前期設計與驗證步驟，換取更低的視覺漂移與更可控的實作品質。

## 核心概念

### Approved Visual Target 是設計規格，不只是參考圖

一旦使用者核准視覺概念，該目標就成為主要的視覺真實來源。後續實作不應因為某個局部資產難處理，就重新生成整頁或任意改變構圖。

### 用四種 Map 把視覺稿轉成可實作規格

核准後的視覺目標會被拆成四種實作描述：

- **Block Map**：定義區塊、垂直流程、版面模型與行動版調整方式。
- **Layer Map**：定義背景、影像、浮動介面、裝飾等圖層與 z-order。
- **Text Map**：定義真正的文字內容、層級、換行、強調方式與語意標籤。
- **Geometry Map**：定義比例、錨點、邊界、裁切區域、重疊與留白。

跨越四種 Map 的 **Token Map** 則負責維持字體、色彩、表面、間距與整體視覺語法的一致性。

### 區分「視覺真實」與「語意真實」

視覺參考負責決定外觀，但實際文字內容仍應來自使用者、原始網站或真實資料。重要文字、按鈕、數字與結構性 UI 優先保留為 live HTML/CSS/SVG，而不是烘焙進生成式點陣圖片。

### 資產解析與鎖定

Skill 會先把重要視覺元素分類成 live HTML/UI、CSS/SVG、既有或裁切資產、局部重新生成、或省略／簡化。若只有單一圖片需要修正，原則是重新生成最小可用資產，通過 QA 後再鎖定，避免後續生成把已核准的視覺重新洗掉。

### 以真正渲染結果做 QA

實作品質不是只看程式碼。Skill 要求在工具可用時實際渲染頁面，依構圖、階層、字體、裁切、視覺重量、留白與響應式表現逐項比較。每一輪只修正 1–3 個感知影響最大的差異，再重新渲染。

## 架構與技術

這個 Repository 的主要交付物是 `web-design/` Skill 套件，而不是獨立網站應用或前端框架。

主要組成包括：

- `web-design/SKILL.md`：核心觸發條件、工作流、不可違反規則與完成條件。
- `web-design/references/`：將藝術指導、視覺一致性、四種 Map、資產解析、響應式設計與渲染 QA 拆成按需載入的參考文件。
- `web-design/agents/openai.yaml`：OpenAI 介面相關中繼資料。
- `dist/web-design-skill-v1.3.0.zip`：已封裝的 v1.3.0 Skill。
- `submission/` 與 `SUBMISSION.md`：Skill 目錄提交與審查用資料。

`SKILL.md` 標示相容於 Agent Skills-compatible clients，並指出在具備瀏覽器、截圖／渲染、影像生成／編輯與互動式 HTML 工具時效果最佳。Repository 本身主要是 Markdown、YAML 與封裝檔，未見獨立執行程式或自動化測試套件，因此它的行為主要由 Agent 對 Skill 契約的遵循程度與宿主工具能力決定。

目前版本為 v1.3.0，授權為 MIT，允許商業使用，但需保留原始著作權與授權聲明。

## 主要功能

- 漸進式釐清設計需求，避免一開始丟出長問卷。
- 先做藝術指導與視覺探索，再決定最終實作方向。
- 將核准視覺稿拆解成 Block、Layer、Text、Geometry 四種 Map。
- 以 Token Map 與 Asset Style Contract 維持跨區塊的一致性。
- 把視覺圖層分類成 HTML/UI、CSS/SVG、既有資產、局部生成或簡化策略。
- 透過局部重新生成與 Asset Lock 降低生成式影像造成的目標漂移。
- 支援網站重設計、screenshot-to-code、image-to-HTML、mockup-to-code 與像素級前端重建等任務。
- 強調響應式設計是重新組織視覺關係，而不是單純把桌面版元件垂直堆疊。
- 以真實渲染畫面執行視覺 QA，優先修正最重要的 1–3 個 mismatch。
- 主動檢查常見的 generic AI UI 模式，例如無理由的等寬卡片網格、任意漸層、過量 pill／glass surface 或缺乏視覺層級的模板化配置。

## 技術亮點

### 把「視覺稿」轉成中介表示

四種 Map 很像設計與前端之間的中介表示（intermediate representation）。它把一張難以直接操作的視覺目標，轉成結構、圖層、文字與幾何四個可推理部分，降低 Agent 只靠短期視覺記憶重建複雜畫面的不確定性。

### 用鎖定機制對抗生成式漂移

Asset Lock 將已接受資產視為版本化設計輸入，避免多輪影像生成不斷改變角色姿勢、裁切、光線或整體風格。這是一個可泛化到其他多模態 Agent 工作流的狀態管理概念。

### QA 迴圈以感知影響排序

每輪只修正 1–3 個最主要差異，而不是同時修改大量 CSS 細節。這種策略能把 Agent 的注意力集中在宏觀構圖、焦點、字體與視覺重量等高影響問題，降低微調造成的隨機漂移。

### 把響應式設計視為構圖問題

Skill 明確拒絕「桌面版直接堆成單欄」的簡化方式，要求行動版仍保留焦點順序、影像與文字關係、字體個性與品牌語法。這比只設定 breakpoint 更接近真正的設計規格。

## 限制與風險

- **專案非常新**：Repository 於 2026-08-21 UTC 建立，v1.0.0 到 v1.3.0 的版本紀錄集中在 2026-08-22，現階段還不足以從時間跨度判斷長期維護穩定性。
- **高度依賴宿主能力**：若 Agent 缺少瀏覽器、截圖／渲染或影像生成工具，仍可做結構化設計，但無法完整執行其最關鍵的 render-based QA。
- **屬於指令／方法論層，而非強制執行框架**：Repository 沒有獨立 runtime 或測試套件去硬性保證每個 Agent 都正確執行四種 Map、資產鎖定或 QA 迴圈。
- **流程成本較高**：對簡單、低視覺要求的頁面，完整的視覺探索、拆解與反覆渲染可能比直接產生介面更耗步驟；Skill 本身允許對簡單任務縮短部分階段。
- **像素接近不等於產品正確**：Skill 雖強調視覺 fidelity，也要求保留語意文字、既有架構與商業目的；實際使用仍需要避免為了外觀而破壞可存取性、可維護性或功能正確性。
- **不是官方 OpenAI Skill**：README 明確標示它是社群建立的 Skill，不代表 OpenAI 官方維護或背書。

## 與你的相關性

依公開技術 profile，這個專案與 **LLM／Agent** 方向高度相關，因為它示範了如何把複雜的設計任務轉成具狀態、具驗證迴圈的 Agent Skill，而不是只依賴一段大型提示詞。

對 **AI R&D** 也有中等參考價值：四種 Map、Asset Lock、dominant mismatch loop 都可以視為「降低多模態 Agent 不確定性」的工作流設計模式，值得觀察是否能泛化到其他需要視覺比對與迭代修正的任務。

它對 **影像生成** 有實務關聯，特別是局部重新生成、資產風格契約與鎖定策略；但它本身不是影像生成模型或影像工作流引擎。

與 **AOI × AI / Computer Vision** 的直接關聯較低，因為目標是網站視覺設計與前端重建，不是工業視覺檢測、辨識或量測。

## 建議怎麼使用

- **TRY**：適合直接用一個具視覺要求的 landing page、重設計或 screenshot-to-code 任務測試，觀察四種 Map 與 render-based QA 是否真的能降低視覺落差。
- **LEARN**：值得研究它如何用 Approved Visual Target、資產鎖定與逐輪 dominant mismatch 修正，把容易漂移的多模態設計工作流變得更穩定。
- **REFERENCE**：可作為撰寫其他 Agent Skill 時的參考，尤其是漸進式揭露、核心 `SKILL.md` + references 分層，以及「將不可控生成輸出轉成受控狀態」的設計方式。

現階段不急著直接視為成熟的長期整合基礎；較合理的方式是先在實際設計任務中測試，再依宿主 Agent 與工具鏈表現決定是否固定納入工作流。

## 與其他收藏的關聯

目前不建立直接卡片連結。概念上它適合與 Agent Skill 規範、前端生成工具、screenshot-to-code、影像生成與視覺 QA 類收藏比較；若知識庫中後續有已驗證的同類卡片，再建立實際關聯。

## 使用者備註

## 更新紀錄

### 2026-08-23

- 新增 Knowledge Card。
- 來源驗證版本為 Web Design Skill v1.3.0。
