---
schema_version: 1
id: github-nanako0129-sepia
title: sepia
canonical_url: https://github.com/Nanako0129/sepia
source:
  type: github
  url: https://github.com/Nanako0129/sepia
  identity: github:nanako0129/sepia
resource_kind:
  ai: skill
  user: null
created_at: 2026-08-28
updated_at: 2026-08-28
last_checked_at: 2026-08-28
summary: sepia 是一個跨 Claude Code、Codex、Grok Build 與 Antigravity 的 Agent Skill，將「去 AI 味」從單純換詞提升到敘事架構、篇章流動與場景化專業寫作規則；它以研究摘要、診斷 rubric 與模型指紋作為修訂依據，提供 write、review、refactor、recreate 四種操作。
classification:
  categories:
    ai:
      - Agent
      - LLM
      - AI Coding / DevTools
    user: null
  tags:
    ai:
      - agent-skill
      - ai-writing
      - narrative-architecture
      - prose-revision
      - humanizer
      - prompt-engineering
      - storyscope
      - claude-code
      - codex
      - grok-build
      - antigravity
    user: null
relevance:
  ai:
    overall: 4
    ai_rd: 3
    aoi_ai: 1
    llm_agent: 5
    sillytavern_ai_rpg: 4
    image_gen: 1
  user: {}
actions:
  ai:
    - TRY
    - INTEGRATE
    - LEARN
  user: null
status:
  ai: active
  user: null
---

# sepia

## 一句話介紹

sepia 是一個可攜式 Agent Skill，目標不是只把 AI 常見詞彙換掉，而是先修正小說的敘事架構與篇章節奏，再處理表面語氣；面對 release notes、PR／issue 回覆、postmortem、ticket 與技術文章等專業文件時，則改用各場景專屬規則。

## 它解決什麼問題

一般「humanizer」常集中在詞彙、句型、破折號、陳腔濫調等表面特徵，但 sepia 認為這不足以處理更深層的 AI 寫作模式。專案引用 StoryScope 等研究，將小說中的主題過度解釋、單線且因果過度整齊的情節、身體感受式情緒描寫、缺乏真實世界參照、線性時間與過度收束的結局等現象，轉成生成與修訂規則。

對專業文件，sepia 不沿用小說規則，而是把問題轉為資訊密度、立場、具體性、場景語域與格式模板化等檢查，避免把所有文字都套成同一種「像人類」風格。

## 核心概念

1. **先結構、後表面。** 小說流程固定先處理敘事架構，再處理篇章流動，最後才處理詞彙與句法。
2. **依文件類型路由。** `SKILL.md` 會依小說、release notes、開發者回覆、事故檢討、ticket、技術文章或一般散文，載入不同 reference 檔案。
3. **四種操作模式。** `write` 直接生成；`review` 只診斷不修改；`refactor` 做最小幅度原地修訂；`recreate` 先抽取事實與意圖，再完整重寫。
4. **校準到人類分布，而不是把 AI 特徵全部反轉。** 專案強調每篇只挑少量有效手法，保留不均勻與普通段落，避免 humanizer 本身形成新的固定指紋。
5. **來源與作者習慣優先。** 專業寫作建議先抽樣同一 venue 的近期人類文件，小說與一般寫作則應尊重作者既有聲音，而不是硬套一種通用口吻。

## 架構與技術

sepia 的主要交付物是符合 Agent Skills 規格的 `skills/sepia/`：

- `SKILL.md`：負責任務路由、四種操作、小說工作流程、校準原則與 guardrails。
- `references/narrative-pass.md`：小說第一層，處理敘事架構。
- `references/discourse-pass.md`：處理段落、節奏與篇章流動。
- `references/style-pass.md`：最後的表面風格、詞彙與句法掃描。
- `references/rubric.md`：小說的 30-feature 診斷 rubric。
- `references/model-fingerprints.md`：針對 Claude、GPT、Gemini、DeepSeek、Kimi 的模型指紋校正。
- `references/professional-pass.md` 與 `references/domains/`：專業文件共用檢查與各場景薄層規則。
- `research/`：整理 StoryScope 與其他研究的 evidence base。

Repository 本身不是獨立模型服務；實際生成與修改仍由宿主 Agent／LLM 執行。README 提供 Claude Code、Codex、Grok Build、Antigravity 的原生安裝方式，也可使用 `install.sh` 或 Skills CLI。專案採 MIT License；`SKILL.md` 目前標示版本為 `0.2.0`。

## 主要功能

- **write**：先讀取對應領域規則，再產生新內容，避免寫完後才補救結構。
- **review**：只輸出缺陷與證據，不自行修改原文，適合先診斷再決定處理深度。
- **refactor**：完整盤點問題後，以最小修改修正，優先處理最深層缺陷並盡量保留原本結構、聲音與意圖。
- **recreate**：先抽出事實、主張與意圖，再依規則重新生成，適合結構問題已經大到局部修補成本更高的文本。
- **小說三段式流程**：敘事架構 → 篇章流動 → 表面風格，並以 rubric 回頭檢查。
- **專業文件場景化規則**：針對 release notes、PR／issue 回覆、postmortem、ticket 與技術文章調整優先檢查項目與格式習慣。
- **多平台安裝**：同一份 canonical `SKILL.md` 支援多個 Agent 環境，不為各平台維護不同內容分支。

## 技術亮點

最值得參考的地方不是「有哪些禁用詞」，而是把寫作品質問題拆成不同深度的診斷層級。這種設計讓 Agent 在處理小說時可以先看因果鏈、揭露順序、支線、情緒表達與讀者互動，再決定表面句子是否需要改寫；對專業文件則換成資訊密度、立場、具體性與 venue matching，避免跨類型共用同一套規則。

專案的研究摘要進一步把 StoryScope 的敘事特徵整理成可操作的 rubric，並強調人類作品通常落在「適度」而非極端值，因此採用「選擇少量手法、保留 slack」的校準策略。這比單純列出 AI 常見詞彙更接近可重複的寫作評估流程，也適合作為 Agent Skill 如何把研究結果轉成工作流程與 reference 檔案的設計案例。

## 限制與風險

- Repository 於 2026-08-28 才建立，雖然已有完整 README、Skill 結構、研究摘要與 MIT 授權，但長期維護穩定性、版本相容性與實際使用回饋仍不足以判定。
- 專案把研究差異轉成寫作規則，本質上仍是啟發式工程。研究中的可分類特徵不等於每一條反向操作都會普遍提升文學品質，也不能視為對所有 AI detector 的保證。
- 模型指紋具有時效性。Claude、GPT、Gemini、DeepSeek、Kimi 的輸出分布隨模型版本與系統提示改變後，現有校正表可能快速過期。
- 「更像人類」與「更符合作者本人的聲音」不是完全相同的目標。即使專案已有保留作者習慣的 guardrail，使用者仍需要人工判斷是否出現過度修訂或風格同質化。
- sepia 自身不是資料隔離層。處理內部 postmortem、PR、ticket 或其他敏感文字時，實際資料是否送往外部服務、如何留存，仍取決於宿主 Agent 與模型供應商的安全設定。

## 與你的相關性

對公開技術背景中的 LLM／Agent 方向，sepia 的價值很高：它是一個結構清楚、跨多個 Agent Runtime 的 Skill 範例，而且展示了如何把論文與研究摘要拆成 routing、reference、rubric、guardrail 與操作模式，而不是把所有邏輯塞進單一超長 prompt。

對 SillyTavern／AI RPG 也有直接參考價值。小說三層修訂、角色網絡、揭露節奏、情緒表達與結局模式等規則，可以作為長篇角色扮演、劇情生成與敘事品質檢查的參考。它與 AOI × AI、影像生成的直接關聯則很低。

## 建議怎麼使用

- **TRY**：Repository 很小、安裝方式清楚，而且可直接在既有 Agent 環境以 user scope 使用，適合先拿幾篇 AI 生成小說或技術文件比較 `review` 與原本輸出差異。
- **INTEGRATE**：若已有 Claude Code、Codex 或其他 Agent 工作流程，可把 sepia 當成寫作／審稿後處理層；特別適合技術文章、PR 回覆與敘事內容生成。
- **LEARN**：值得研究它如何將 evidence base 拆成多層 reference、任務路由與 rubric，作為設計其他研究驅動 Agent Skill 的範例。

## 與其他收藏的關聯

目前沒有建立未經驗證的直接 Card 連結。從技術定位來看，sepia 最容易與「Agent Skill 設計」、「多平台 Skill 發佈」、「LLM 寫作品質評估」及「AI RPG／敘事生成」類收藏形成關聯，後續可由 Knowledge Graph 的分類、Tag 與語意關聯自動整理。

## 使用者備註


## 更新紀錄

### 2026-08-28

- 建立 sepia Knowledge Card；確認來源為 `github:nanako0129/sepia`，並依 README、`SKILL.md`、專業寫作 reference 與 StoryScope 研究摘要整理架構、使用方式與限制。
