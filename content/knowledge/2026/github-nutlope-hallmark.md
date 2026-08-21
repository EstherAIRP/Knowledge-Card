---
schema_version: 1
id: github-nutlope-hallmark
title: Hallmark
canonical_url: https://github.com/Nutlope/hallmark
source:
  type: github
  url: https://github.com/Nutlope/hallmark
  identity: github:nutlope/hallmark
resource_kind:
  ai: skill
  user: null
created_at: 2026-08-12
updated_at: 2026-08-21
last_checked_at: 2026-08-21
summary: Hallmark 是面向 Claude Code、Cursor 與 Codex 的 anti-AI-slop UI 設計 Skill，以結構多樣化、21 種主題、57 項檢查 gate、輸出前自我批判與響應式／設計 token 約束，降低 AI 生成介面的模板化痕跡；同時提供 build、audit、redesign、study 四種工作模式。
classification:
  categories:
    ai:
      - AI Coding / DevTools
      - Agent
      - General Tools
    user: null
  tags:
    ai:
      - design-skill
      - anti-ai-slop
      - frontend-design
      - Claude-Code
      - Cursor
      - Codex
      - UI-generation
      - design-system
      - responsive-design
      - design-audit
    user: null
relevance:
  ai:
    overall: 4
    ai_rd: 3
    aoi_ai: 1
    llm_agent: 4
    sillytavern_ai_rpg: 2
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

# Hallmark

## 一句話介紹

Hallmark 是一套給 Claude Code、Cursor 與 Codex 使用的前端設計 Skill，核心目標不是單純讓 AI 產出的網站「更漂亮」，而是用結構選擇、設計規則與檢查 gate 主動避開常見的 AI 模板化介面。

## 它解決什麼問題

LLM 產生前端時，問題往往不只是配色或元件細節，而是不同需求最後仍收斂到相似的頁面骨架，例如置中 Hero、三欄 Feature、CTA、Footer。Hallmark 把這種 structural sameness 視為 AI 生成介面的主要 fingerprint，要求模型先選擇符合 brief 的 macrostructure，再套用視覺主題與細部規則。

它也把設計品質檢查從提示詞中的抽象要求變成較明確的工作流程：輸出前執行自我評分與 slop-test，並對 fabricated metrics、任意 inline design token、假 browser chrome、手機版 overflow、標題斜體等模式設置明確限制。

## 核心概念

Hallmark 的核心不是一個固定 UI template，而是一組「限制模型預設吸引子」的設計 protocol。

- **Structural variety**：視覺差異之外，頁面資訊結構也必須不同；專案以 macrostructure 與多個結構軸描述頁面 fingerprint。
- **Theme routing**：一般 brief 從 21 個 named themes 中選擇；具有明確創意訊號時可進入 Custom 路徑，建立一次性的 palette、字體與 layout。
- **Slop gates**：README 宣稱執行 57 個 anti-pattern gates，並在輸出前進行六軸自我批判。
- **Scope awareness**：區分完整 page 與單一 component；component flow 會跳過 page macrostructure，但要求 interactive component 呈現 default、hover、focus、active、disabled、loading、error、success 八種狀態。
- **Design DNA study**：`study` 模式可從 screenshot 或 URL 抽取 macrostructure、type pairing、colour anchor 等設計 DNA，而不是直接 pixel clone。

## 架構與技術

Hallmark 本質上是供 AI coding assistant 載入的規則型 Skill，而不是獨立的 UI framework。主要規則位於 `skills/hallmark/SKILL.md`，細部設計知識拆分到 `references/`，包含 structure、macrostructures、responsive、anti-patterns、microinteractions、study 與 custom theme 等文件。

Skill 可安裝到 Claude Code、Cursor 與 Codex；README 提供 `npx skills add nutlope/hallmark` 的安裝方式，也可直接複製 Skill 與 references 到各工具的規則／skills 目錄。專案範例頁以 self-contained HTML + CSS 展示不同 brief 的結果。

設計流程中的技術約束包括 CSS design tokens、OKLCH palette 路徑、字體 pairing、響應式 breakpoint 驗證，以及對既有 codebase 的 pre-flight scan。若專案已有 `design.md`，Hallmark 會將其視為 locked design system，使後續頁面優先保持同一套系統，而不是持續追求頁面間差異。

## 主要功能

- **Build**：預設模式，依 brief 選擇 macrostructure、theme 與規則後建立新 UI。
- **Audit**：`hallmark audit <target>` 對現有 UI／code 進行 anti-pattern 評分並產生優先修正清單，不直接修改。
- **Redesign**：保留既有 copy、information architecture、brand 與實作邊界，重新設計視覺結構與 interaction layer。
- **Study**：從 screenshot 或可讀取的 URL 分析設計 DNA，可進一步用該 DNA 重建內容，或在符合來源使用條件時輸出可攜式 `design.md`。
- **Component scope**：針對 button、input、card、modal 等單一元件採較小的流程，並要求八種互動／狀態展示。
- **Responsive discipline**：規則明確要求檢查 320、375、414、768 px 寬度，處理 horizontal scroll、grid track、長標題 wrapping 等常見失敗模式。

## 技術亮點

最值得參考的是它把「不要有 AI 味」從模糊審美要求轉成可執行的 constraint system。尤其 structural fingerprint 的觀點比單純提供更多 theme 更有價值：模型即使更換顏色、字體與陰影，如果 section rhythm 與 component vocabulary 不變，結果仍容易辨識為同一種生成模板。

第二個亮點是將 Skill 做成多階段設計 harness：pre-flight 讀取既有系統、判斷 scope、選結構與 theme、鎖定 token、輸出前自評、再通過 anti-pattern gates。這種做法可作為其他 AI coding Skill 的設計參考——把品質要求拆成具名、可檢查的規則，而不是只增加形容詞。

第三個亮點是對既有專案設有 implementation safety rail。`redesign` 並不等於任意重建 codebase；Skill 明確要求保留 route、component ownership、copy intent 與 information architecture，若需要大量刪除元件則應先取得確認。這降低「設計 Agent 為了漂亮而破壞工程結構」的風險。

## 限制與風險

Hallmark 的品質高度依賴 coding agent 是否忠實遵守長篇 Skill 與 references；57 個 gate 並不等同於獨立 deterministic linter，因此實際一致性仍受模型能力、context 長度與執行環境影響。

其規則具有強烈設計立場。這有助於壓制 LLM 常見模式，但也可能把另一組偏好固化成新的 distribution；對已有成熟 design system 的產品，應優先讓既有 tokens、brand 與 design.md 成為上位約束，而不是直接接受 Hallmark 的 catalog aesthetic。

`study` 的 URL 模式依賴工具能讀取頁面 HTML/CSS；對 auth wall、純 JS shell 或無法存取的頁面會受限。從第三方設計抽取 DNA 時也仍需注意著作權、品牌識別與過度近似問題；專案本身因此明確主張不做 pixel clone，且對輸出 `design.md` 設有更嚴格的來源 attestation。

截至 2026-08-12，Repository 為公開、MIT License、仍在活躍更新；GitHub 顯示約 24k stars，代表已有顯著關注度，但人氣不能替代對實際生成品質與不同 framework 相容性的專案內測。

## 與你的相關性

依公開技術 Profile，Hallmark 對 LLM／Agent 與 AI 工程工作的價值高於 AOI 或 Image Generation 本身。它不是模型研究工具，而是一個很具體的 Agent Skill／harness 案例：展示如何把專業領域規則拆成 runtime instructions、reference knowledge、scope routing、self-critique 與 safety rail。

因此 `llm_agent` 評為 4，適合研究 coding agent 如何吸收專門能力與如何把審美判準轉成 workflow constraint；`ai_rd` 評為 3，主要價值在 agent behavior、evaluation thinking 與 prompt/skill engineering，而不是模型訓練。AOI × AI 幾乎沒有直接關聯。對 AI Image Generation 則只有間接參考價值，例如「避免生成分布中的高頻預設」這個思想可類比到視覺 prompt 與風格控制，但 Hallmark 本身處理的是前端 UI。

## 建議怎麼使用

- `TRY`：適合直接在一個非關鍵 landing page 或 side project 上安裝，對比一般 coding agent 與 Hallmark flow 的結構差異，尤其觀察是否真的減少 hero → features → CTA 的固定節奏。
- `LEARN`：建議閱讀 `SKILL.md`、`structure.md`、anti-pattern 與 responsive references，重點不是抄 theme，而是研究它如何把 domain knowledge 編排成可執行 Skill。
- `REFERENCE`：可作為設計其他 Agent Skill 的參考案例，例如建立「規則 → routing → artifact contract → self-check → safety rail」的結構。

若要評估實際效益，最好建立同一組 5–10 個 brief，分別以 baseline coding agent 與 Hallmark 生成，再比較 structural diversity、responsive defects、人工修改時間與品牌一致性；這會比單看官方 demo 更能判斷是否值得長期整合。

## 與其他收藏的關聯

目前 Knowledge Card 中尚無直接同類的前端設計 Skill 收藏。它與其他 Agent／AI Coding 類收藏可在未來從「Skill packaging、runtime instructions、evaluation gates」建立關聯，但此處不預先建立不存在的 Card 連結。

## 使用者備註


## 更新紀錄

### 2026-08-21

- 重新檢查目前 Repository，依主要交付物正式將 `resource_kind` 分類為 `skill`。

### 2026-08-12

- 首次收錄 Hallmark，整理其 structural variety、四種工作模式、slop-test、component scope 與 coding-agent Skill 架構。
