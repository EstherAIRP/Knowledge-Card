# 網站架構

## 目標

把儲存庫中的 Knowledge Card 與產生的 Concept Graph 呈現為公開、可搜尋的技術雷達，同時不建立第二套內容資料庫。

內容的主要權威來源仍是：

```text
content/knowledge/**/*.md
```

產生的圖譜索引仍是可重建的呈現／查詢資料：

```text
data/relations.json
data/concepts.json
```

`docs/` 目錄是 VitePress 呈現層。

## 執行模型

```text
content/knowledge/**/*.md
        │
        ├─ docs/knowledge.data.js
        │      └─ 首頁中繼資料投影
        │
        ├─ docs/knowledge/[id].paths.js
        │      └─ Knowledge Card 詳細頁 + 語意關聯 + Concepts
        │
        ├─ data/concepts.json
        │      ├─ docs/concepts/[id].paths.js
        │      └─ docs/graph.data.js
        │
        └─ data/relations.json
               └─ docs/graph.data.js

                         ↓
                    VitePress
                         ↓
                    靜態網站
```

`docs/knowledge/` 下不會提交由 Knowledge Card 產生的 Markdown 副本。

## 首頁 — Knowledge Radar

`docs/index.md` 掛載 `KnowledgeRadar.vue`。

Radar 可以依標題、摘要、來源類型、分類、標籤與 Action 篩選中繼資料，也支援 GitHub `Project`／`Skill` 類型、相關性維度選擇、最低分數篩選、排序、自動統計與響應式 Card 網格。

GitHub 類型來自 Knowledge Card 的有效 `resource_kind`：

```text
resource_kind = user ?? ai
```

為了相容在此欄位加入前建立的舊 GitHub Card，網站會暫時把具有明確 Agent Skill 標記的舊卡推定為 `skill`，其餘舊 GitHub Card 視為 `project`。新建立或重新分析的 GitHub Card 應正式寫入 `resource_kind`，因此舊資料的推定只是一層過渡相容，不是新的內容權威來源。

所選的相關性維度會同時影響篩選結果與每張 Card 顯示的分數。

## 有效使用者覆寫值

資料投影層會先解析使用者擁有欄位，再把中繼資料送到 UI。

```text
effective wrapper value = user ?? ai
```

相關性會依各維度分別解析，因此人工修正可以直接反映在網站上，不需要覆寫 AI 擁有值。`resource_kind` 也遵循同一個使用者覆寫優先規則。

## Knowledge Card 詳細頁路由

`docs/knowledge/[id].paths.js` 建立：

```text
/knowledge/{card.id}
```

每個路由會投影：

- Card 中繼資料與完整 Markdown 正文；
- GitHub Card 的有效 `resource_kind`，並在頁首顯示 `GitHub · Project` 或 `GitHub · Skill`；
- Phase 2 類型化 Card↔Card 語意關聯；
- Phase 3 Card↔Concept 對應及其強度／證據；
- 來源、編輯與導覽連結。

`KnowledgeConcepts.vue` 提供 Concept 鄰域，並將每個節點連到對應 Concept 詳細頁或完整圖譜。

## Concept 詳細頁路由

`docs/concepts/[id].paths.js` 建立：

```text
/concepts/{concept.id}
```

Concept 頁面提供：

- 穩定 Concept ID、類型與來源；
- 說明；
- 支援的 Knowledge Cards；
- 對應強度與 Category／Tag 證據；
- 由跨 Card 共現推導出的 Concept↔Concept 鄰居；
- 回到 `/graph` 的導覽。

路由直接從 `data/concepts.json` 產生；Concept 頁面不會建立第二套人工維護的 Concept 文章資料庫。

## 知識圖譜

`docs/graph.md` 掛載 `KnowledgeGraph.vue`，資料由 `docs/graph.data.js` 提供。

圖譜資料載入器整合三種邊：

```text
Card ↔ Concept       has_concept
Concept ↔ Concept    co_occurs_with
Card ↔ Card          Phase 2 semantic relation
```

預設視覺化使用可重建的語意版面：

```text
Knowledge Card embedding
→ cosine distance matrix
→ classical MDS
→ graph-layout.json 的 2D 座標
→ Concept 依 Card↔Concept strength 計算加權重心
```

畫面上的 2D 距離是高維向量距離的近似，不等於原始 cosine distance；使用者選取 Card 時，介面另外顯示由原始 embedding 直接計算的相似度與距離。

圖譜支援：

- **按需標籤（label on demand）**：初始只標示少數高 degree Concept；選取、搜尋命中、滑鼠移入與 Top 語意鄰居才顯示名稱，避免密集文字覆蓋語意空間；
- **Progressive disclosure**：初始只保留稀疏 Concept↔Concept 結構；Card↔Concept 邊在選取 Card 時展開，全部 Card↔Card 邊維持可選；
- Concept／Card 關鍵字搜尋與節點類型篩選；
- **自動 Fit**：依目前語意節點實際 bounding box 使用單一等比例縮放，置中並保留 padding，不以不同 x/y 比例扭曲 MDS 幾何；
- **Pan / Zoom**：桌機支援拖曳、滾輪縮放、雙擊 Fit；手機支援單指拖曳、雙指縮放，另提供 +/-/Fit 控制；
- **全域地圖 / 聚焦模式**：聚焦模式只保留選取 Card、Top 語意鄰居與直接 Concept；手機預設使用聚焦模式；
- 選取 Card 後顯示原始 embedding 直接計算的 Top 語意鄰居、cosine similarity／distance 與既有 relation；
- 語意 layout 的 MDS、stress、距離 metric 與 embedding model 收在「語意地圖」資訊面板，不佔主要視覺層級；
- 從圖譜節點直接導覽到 Card／Concept 詳細頁。

圖上的節點位置先由 `graph-layout.json` 投影，再由 viewport transform 執行 Pan / Zoom；viewport transform 只影響觀看方式，不修改或重新計算語意座標。視覺化以 Vue + SVG 實作，不新增 D3／Cytoscape 執行階段依賴。

## 搜尋

目前有三種導覽／搜尋介面：

1. 首頁 Radar 中繼資料篩選。
2. `/graph` Concept／Card 圖譜篩選。
3. VitePress 對靜態頁面內容提供的本機搜尋。

網站運作不需要伺服器端搜尋服務。

## GitHub Pages 基礎路徑

本儲存庫使用 project Pages，因此 VitePress 設定：

```js
base: '/Knowledge-Card/'
```

自訂連結使用 `withBase()`，確保路由在儲存庫子路徑下正常工作。`cleanUrls` 維持啟用。

## Theme 元件

自訂呈現程式碼位於：

```text
docs/.vitepress/theme/components/
├── KnowledgeRadar.vue
├── KnowledgeMeta.vue
├── KnowledgeRelations.vue
├── KnowledgeConcepts.vue
├── ConceptPage.vue
└── KnowledgeGraph.vue
```

網站仍延伸 VitePress DefaultTheme，保留導覽、本機搜尋、大綱、深色模式與 Markdown 渲染。

## 建置指令

靜態網站產生前必須先有完整語意圖譜資料：

```bash
npm run embeddings:build
npm run embeddings:validate
npm run graph-layout:build
npm run graph-layout:validate
npm run concepts:build
npm run concepts:validate
npm run docs:build
npm run verify:site
```

`verify:site` 會要求首頁、`/graph`、每個 Knowledge Card 頁面、每個 Concept 頁面，以及 JS／CSS 資產都存在於最終 VitePress 輸出。
