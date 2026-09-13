# 全站 CSS 與 Layout 統一化開發計畫

> 狀態：Planning  
> 範圍：VitePress 公開網站呈現層  
> 目的：統一全站頁寬、留白、Surface、Border、Radius 與共用樣式來源，降低「改 A 沒改 B」的維護成本。  
> 非目標：本次不重做視覺設計、不改 Knowledge Graph 資料模型、不改 Knowledge Card 結構與收錄流程。

---

## 1. 背景與問題

目前網站主要由 VitePress DefaultTheme 加上自訂 Vue 元件組成，但頁面寬度與共用樣式沒有單一規格來源。

目前至少存在三套寬度系統：

| 頁面 | 目前寬度來源 | 問題 |
| --- | --- | --- |
| 首頁 Knowledge Radar | `.radar-shell { width: min(1180px, calc(100% - 32px)) }` | 自己維護固定寬度 |
| Knowledge Graph | `.knowledge-graph-shell { width: 100% }` + 自訂 padding | 幾乎使用整個 viewport |
| Knowledge Card / Concept | VitePress `VPDoc` 預設文件寬度 | 桌面內容通常只有約 688–784px |

因此切換頁面時會出現明顯的內容幅寬跳動。

此外，目前樣式來源分散：

```text
docs/.vitepress/theme/
├── custom.css
├── relations.css
└── components/
    ├── KnowledgeRadar.vue
    ├── KnowledgeMeta.vue
    ├── KnowledgeRelations.vue
    ├── KnowledgeConcepts.vue
    ├── ConceptPage.vue
    ├── GraphFilterPanel.vue
    └── KnowledgeGraph.vue
```

同一類視覺語意目前可能分別使用：

- `--radar-border`
- `var(--vp-c-divider)`
- 元件內直接寫死的 border / radius / padding
- 不同元件各自維護的 panel background

其中 `--radar-border`、`--radar-panel`、`--radar-muted` 已被 Radar 以外的頁面使用，代表命名與責任範圍已經失真。

---

## 2. 開發目標

### 2.1 核心目標

建立單一、明確的全站樣式架構：

```text
Design Tokens
    ↓
Layout System
    ↓
Shared UI Primitives
    ↓
Component-scoped CSS
```

達成以下結果：

1. 全站頁面寬度由同一組 CSS Token 控制。
2. 首頁、Card、Concept、Graph 使用同一套 gutter 與 breakpoint。
3. Knowledge Card 區分「頁面寬度」與「閱讀寬度」。
4. Graph 保留 wide layout，但不再自行決定整站寬度規則。
5. Border、Panel、Radius、Spacing 等共用設計語意有單一來源。
6. 元件特殊樣式仍保留在各自 scoped CSS，不把所有樣式塞進單一大型 CSS。
7. 建立基本 UI 驗證，避免之後再次出現頁面寬度漂移與水平 overflow。

---

## 3. 目標 CSS 架構

預計新增：

```text
docs/.vitepress/theme/styles/
├── tokens.css
├── layout.css
└── shared.css
```

並調整：

```text
docs/.vitepress/theme/index.js
```

載入順序：

```js
import DefaultTheme from 'vitepress/theme'
import './styles/tokens.css'
import './styles/layout.css'
import './styles/shared.css'

export default {
  extends: DefaultTheme
}
```

### 3.1 `tokens.css`

只存放全站設計 Token，不放頁面 selector。

第一版建議：

```css
:root {
  /* Layout */
  --kc-layout-standard: 1200px;
  --kc-layout-wide: 1600px;
  --kc-reading-max: 820px;
  --kc-page-gutter: clamp(16px, 3vw, 32px);

  /* Spacing */
  --kc-space-xs: 6px;
  --kc-space-sm: 10px;
  --kc-space-md: 16px;
  --kc-space-lg: 24px;
  --kc-space-xl: 32px;

  /* Radius */
  --kc-radius-sm: 8px;
  --kc-radius-md: 12px;
  --kc-radius-lg: 18px;
  --kc-radius-xl: 24px;

  /* Surface */
  --kc-border: color-mix(
    in srgb,
    var(--vp-c-divider) 78%,
    transparent
  );

  --kc-panel: color-mix(
    in srgb,
    var(--vp-c-bg-soft) 82%,
    transparent
  );

  --kc-muted: var(--vp-c-text-2);
}
```

原本：

```text
--radar-border
--radar-panel
--radar-muted
```

應逐步替換成：

```text
--kc-border
--kc-panel
--kc-muted
```

避免 Radar 專屬命名變成全站相依。

### 3.2 `layout.css`

負責：

- 頁面最大寬度
- 左右 gutter
- Standard / Wide / Reading 三種 layout
- VitePress DefaultTheme 寬度 override
- Desktop / Tablet / Mobile breakpoint

預計提供：

```css
.kc-shell {
  width: min(
    var(--kc-layout-standard),
    calc(100% - 2 * var(--kc-page-gutter))
  );
  margin-inline: auto;
}

.kc-shell--wide {
  width: min(
    var(--kc-layout-wide),
    calc(100% - 2 * var(--kc-page-gutter))
  );
  margin-inline: auto;
}

.kc-reading {
  width: min(100%, var(--kc-reading-max));
  margin-inline: auto;
}
```

### 3.3 `shared.css`

只放真正跨元件共用的 UI primitive，例如：

- panel surface
- card surface
- control height
- pill / chip 基本樣式
- focus ring
- 共用 transition

不把每個元件所有 CSS 搬進來。

抽取原則：

> 至少三個元件具有相同視覺語意，才考慮抽成共用 primitive。

避免為了「集中管理」而製造過度抽象。

---

## 4. Layout 規格

### 4.1 Standard Layout

適用：

- Knowledge Radar
- Knowledge Card 頁面外層
- Concept 頁面
- Knowledge Meta
- Knowledge Concepts
- Knowledge Relations

第一版：

```text
max-width: 1200px
gutter: clamp(16px, 3vw, 32px)
```

### 4.2 Reading Layout

適用：

- Knowledge Card Markdown 正文

第一版：

```text
max-width: 820px
```

原因：

Card 是文章型內容，若直接拉到 1200px，一行文字過長，會降低閱讀性。

目標結構：

```text
┌──────────────────── 1200px page shell ────────────────────┐
│ KnowledgeMeta                                              │
│                                                            │
│        ┌──────────── 820px reading area ────────────┐      │
│        │ Markdown body                               │      │
│        └─────────────────────────────────────────────┘      │
│                                                            │
│ KnowledgeConcepts                                          │
│ KnowledgeRelations                                         │
└────────────────────────────────────────────────────────────┘
```

### 4.3 Wide Layout

適用：

- Knowledge Graph

第一版：

```text
max-width: 1600px
gutter: clamp(16px, 3vw, 32px)
```

Graph 需要較大的工作區，因此保留 wide layout，但寬度應由 `--kc-layout-wide` 管理，而不是元件自己寫 `width: 100%`。

---

## 5. VitePress Layout 整合方式

VitePress 支援 frontmatter `pageClass`，可將自訂 class 掛在 DefaultTheme Layout 根節點上。

因此不建議直接全域覆蓋所有 `.VPDoc`，而是用 page-specific class 限定影響範圍。

### 5.1 Knowledge Card

調整：

```text
docs/knowledge/[id].md
```

加入：

```yaml
---
pageClass: kc-page-knowledge
---
```

再由 `layout.css` 針對：

```css
.kc-page-knowledge .VPDoc
.kc-page-knowledge .VPDoc .container
.kc-page-knowledge .VPDoc .content
.kc-page-knowledge .VPDoc .content-container
```

解除 VitePress 預設 688–784px 的整頁限制。

Markdown 正文再個別限制至 `--kc-reading-max`。

### 5.2 Concept

調整：

```text
docs/concepts/[id].md
```

加入：

```yaml
---
pageClass: kc-page-concept
---
```

Concept 頁面使用 Standard Layout。

### 5.3 Knowledge Graph

調整：

```text
docs/graph.md
```

加入：

```yaml
pageClass: kc-page-graph
```

Graph component 本身改用 `kc-shell--wide`。

### 5.4 首頁

首頁為 `layout: home`，不需要強制改 VitePress `VPDoc`。

直接將：

```text
radar-shell
```

中的網站寬度責任移除，改成使用 `kc-shell`。

---

## 6. CSS Ownership 規則

重構後樣式責任如下：

| 類型 | 所有權 |
| --- | --- |
| 顏色語意、border、radius、spacing、layout width | `tokens.css` |
| 頁寬、gutter、breakpoint、VitePress width override | `layout.css` |
| 真正跨元件共用 primitive | `shared.css` |
| Radar 特有 UI | `KnowledgeRadar.vue <style scoped>` |
| Graph 特有 UI | `KnowledgeGraph.vue <style scoped>` |
| Graph Filter | `GraphFilterPanel.vue <style scoped>` |
| Concept 特有 UI | `ConceptPage.vue <style scoped>` |
| KnowledgeMeta | `KnowledgeMeta.vue <style scoped>` |
| KnowledgeRelations | `KnowledgeRelations.vue <style scoped>` |
| KnowledgeConcepts | `KnowledgeConcepts.vue <style scoped>` |

原本 `custom.css` 中的 Radar 特有規則應回到 `KnowledgeRadar.vue`。

原本 `relations.css` 應搬進 `KnowledgeRelations.vue` scoped style。

完成後 `custom.css` 與 `relations.css` 可移除，避免同時存在新舊兩套責任來源。

---

## 7. 開發階段

## Phase 1 — 建立全站 Token 與 Layout 基礎

### 工作項目

新增：

```text
docs/.vitepress/theme/styles/tokens.css
docs/.vitepress/theme/styles/layout.css
docs/.vitepress/theme/styles/shared.css
```

修改：

```text
docs/.vitepress/theme/index.js
```

完成：

- 建立 `--kc-layout-standard`
- 建立 `--kc-layout-wide`
- 建立 `--kc-reading-max`
- 建立 `--kc-page-gutter`
- 建立 spacing / radius / surface token
- 保留 VitePress theme variable 作為底層來源

### 驗收

- 網站可正常 build
- Dark mode 正常
- 尚未遷移的舊 CSS 不應立即失效

---

## Phase 2 — 統一四種主要頁面寬度

### 工作項目

修改：

```text
docs/index.md
docs/graph.md
docs/knowledge/[id].md
docs/concepts/[id].md
docs/.vitepress/theme/components/KnowledgeRadar.vue
docs/.vitepress/theme/components/KnowledgeGraph.vue
```

完成：

1. Radar → Standard shell
2. Graph → Wide shell
3. Card → Standard outer shell + Reading body
4. Concept → Standard shell
5. 使用 `pageClass` 限定 VitePress override
6. 移除元件自己決定網站整體寬度的規則

### 驗收

桌面 1440px viewport：

| 頁面 | 目標 |
| --- | --- |
| Radar | 最大約 1200px |
| Card outer | 最大約 1200px |
| Card Markdown | 最大約 820px |
| Concept | 最大約 1200px |
| Graph | 最大約 1600px，實際受 viewport 限制 |

所有頁面左右 gutter 使用同一規則。

---

## Phase 3 — 共用 Surface 與 Token 遷移

### 工作項目

替換：

```text
--radar-border → --kc-border
--radar-panel  → --kc-panel
--radar-muted  → --kc-muted
```

盤點並逐步替換：

- 重複 border
- 重複 background
- 重複 radius
- 共用 control height
- 共用 focus ring
- 共用 hover transition

### 原則

不要求所有：

```text
9px
10px
11px
12px
...
```

全部消失。

只有具備相同視覺語意的值才合併。

### 驗收

修改以下 Token 時，應能同時影響所有相關元件：

```text
--kc-border
--kc-panel
--kc-radius-lg
--kc-page-gutter
```

---

## Phase 4 — CSS Ownership 清理

### 工作項目

將：

```text
custom.css
```

拆分。

Radar 專用 CSS → `KnowledgeRadar.vue`

Knowledge Meta 專用 CSS → `KnowledgeMeta.vue`

Relations CSS → `KnowledgeRelations.vue`

共用規則 → `styles/*.css`

完成後移除：

```text
docs/.vitepress/theme/custom.css
docs/.vitepress/theme/relations.css
```

並確認 `index.js` 只載入全域樣式入口。

### 驗收

每一條 CSS 應能回答：

> 這是全站規則，還是元件規則？

不得再有「放在 global CSS 只是因為以前就放在那裡」的規則。

---

## Phase 5 — 響應式整理

### 驗證尺寸

至少驗證：

```text
1440px desktop
1280px desktop
1024px tablet / small desktop
768px tablet
390px mobile
```

### 驗收

所有主要頁面：

- 無水平捲軸
- Header / content gutter 一致
- Card Grid 正常縮排
- Graph filter / inspector 不超出 viewport
- Graph canvas 仍可正常 Pan / Zoom
- Reading width 在手機上自動退回 100%
- Controls 不因新 layout token 被壓縮到不可操作

---

## Phase 6 — UI Regression Guard

目前 `verify:site` 主要確認建置輸出存在，不能防止 CSS 寬度再次漂移。

建議新增：

```text
scripts/verify-site-layout.mjs
```

使用現有 Playwright 依賴檢查：

1. 首頁
2. 一個 Knowledge Card
3. 一個 Concept
4. Knowledge Graph

至少在：

```text
1440 × 900
390 × 844
```

驗證：

- `document.documentElement.scrollWidth <= viewport width`
- Standard shell 不超過 `--kc-layout-standard`
- Graph shell 不超過 `--kc-layout-wide`
- Markdown body 不超過 `--kc-reading-max`
- mobile 不產生水平 overflow

可加入 package script：

```json
"layout-ui:verify": "node scripts/verify-site-layout.mjs"
```

此驗證不需要做像素級 screenshot diff，只需要防止 Layout 結構退化。

---

## 8. 預計修改檔案

### 新增

```text
docs/.vitepress/theme/styles/tokens.css
docs/.vitepress/theme/styles/layout.css
docs/.vitepress/theme/styles/shared.css
scripts/verify-site-layout.mjs
```

### 修改

```text
docs/.vitepress/theme/index.js
docs/.vitepress/theme/components/KnowledgeRadar.vue
docs/.vitepress/theme/components/KnowledgeMeta.vue
docs/.vitepress/theme/components/KnowledgeRelations.vue
docs/.vitepress/theme/components/KnowledgeConcepts.vue
docs/.vitepress/theme/components/ConceptPage.vue
docs/.vitepress/theme/components/GraphFilterPanel.vue
docs/.vitepress/theme/components/KnowledgeGraph.vue

docs/index.md
docs/graph.md
docs/knowledge/[id].md
docs/concepts/[id].md

package.json
docs/WEBSITE.md
```

### 預計移除

```text
docs/.vitepress/theme/custom.css
docs/.vitepress/theme/relations.css
```

---

## 9. 不應在本次順便處理的內容

為降低範圍膨脹，本次先不處理：

- Knowledge Graph 節點視覺重新設計
- Graph filtering UX 重做
- 首頁資訊架構重做
- 字體系統全面重設
- 顏色品牌重設
- Markdown Typography 全面改版
- VitePress Navbar 功能調整
- Knowledge Card 資料結構
- Relation / Concept 計算方式

如果重構過程發現上述問題，只記錄，不與 CSS 基礎架構一起修改。

---

## 10. 風險與對策

### 風險 1：VitePress DefaultTheme selector 被過度覆蓋

對策：

- 使用 `pageClass`
- 所有 override 都限定在 `.kc-page-*`
- 不直接全站覆蓋 `.VPDoc .content`

### 風險 2：Graph 因 Standard layout 被壓縮

對策：

Graph 使用獨立 `--kc-layout-wide`，不共用 Standard max-width。

### 風險 3：文章頁變寬後閱讀性下降

對策：

區分 outer shell 與 reading width，正文固定在 `--kc-reading-max`。

### 風險 4：一次搬太多 CSS 造成視覺 regression

對策：

依 Phase 漸進處理：

```text
Token
→ Layout
→ Surface
→ Ownership cleanup
→ Responsive
→ Regression guard
```

每階段都先確認 build 與主要頁面，再進下一階段。

---

## 11. 驗證指令

每一個實作階段至少執行：

```bash
npm run docs:build
npm run verify:site
```

Graph 有修改時另外執行：

```bash
npm run graph-ui:verify
```

新增 Layout UI guard 後執行：

```bash
npm run layout-ui:verify
```

若只修改呈現層，不需要重建 embedding / relation / concept 資料；只有資料輸入或產生流程異動時才需要完整 rebuild。

---

## 12. 完成定義

本次 CSS 重構完成的條件：

- [ ] 全站只有一組 Layout Token
- [ ] Radar 不再自行維護固定網站寬度
- [ ] Graph 不再自行使用 viewport 作為唯一寬度規則
- [ ] Card 與 Concept 不再受 VitePress 預設窄版面限制
- [ ] Knowledge Card 正文仍維持適合閱讀的最大寬度
- [ ] Desktop / Tablet / Mobile gutter 由單一 Token 控制
- [ ] `--radar-*` 全站共用 Token 已移除
- [ ] `custom.css` / `relations.css` 責任已重新分配
- [ ] 元件特殊 CSS 保留 scoped ownership
- [ ] 首頁 / Card / Concept / Graph 無水平 overflow
- [ ] `npm run docs:build` 通過
- [ ] `npm run verify:site` 通過
- [ ] Graph UI 驗證通過
- [ ] Layout UI regression guard 通過
- [ ] `docs/WEBSITE.md` 更新目前 CSS / Layout 架構

---

## 13. 建議實作順序

```text
1. tokens.css
2. layout.css
3. index.js
4. Radar shell
5. Card pageClass + VitePress override
6. Concept pageClass
7. Graph wide shell
8. Surface token migration
9. 搬回 component-scoped CSS
10. 移除 custom.css / relations.css
11. Responsive audit
12. Playwright layout guard
13. WEBSITE.md
14. Build / verify / deploy
```

這個順序的目的，是先修正「全站結構」，再整理「樣式所有權」，避免同時重構版型與大量元件細節而增加除錯成本。
