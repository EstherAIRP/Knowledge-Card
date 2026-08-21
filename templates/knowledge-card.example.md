---
schema_version: 1
id: example-project
title: Example Project
canonical_url: https://github.com/example/example-project
source:
  type: github
  url: https://github.com/example/example-project
  identity: github:example/example-project
resource_kind:
  ai: project
  user: null
created_at: 2026-08-11
updated_at: 2026-08-11
last_checked_at: 2026-08-11
summary: 這是一張僅供作者與 Agent 參考格式的範例 Knowledge Card，不代表實際收錄項目。
classification:
  categories:
    ai:
      - AI / ML
      - Agent
    user: null
  tags:
    ai:
      - example
      - agent-tool
    user: null
relevance:
  ai:
    overall: 3
    ai_rd: 4
    aoi_ai: 1
    llm_agent: 4
    sillytavern_ai_rpg: 2
    image_gen: 1
  user: {}
actions:
  ai:
    - LEARN
    - REFERENCE
  user: null
status:
  ai: active
  user: null
---

# Example Project

## 一句話介紹

這是一張格式範例，用來展示 Knowledge Card 的 YAML 前置欄位（frontmatter）、分析章節與 AI／使用者所有權寫法；真正收錄內容應放在 `content/knowledge/{YYYY}/`。

GitHub 來源應使用 `resource_kind.ai` 判斷 Repository 的主要交付物是 `project` 或 `skill`。`skill` 指主要供 Agent 載入、遵循或調用的可重用能力／工作流程；一般應用、函式庫、框架、CLI、服務或只是附帶 Skill 範例的 Repository 仍屬 `project`。不得只因為出現 `SKILL.md` 就自動判為 `skill`。

## 它解決什麼問題

真正的 Knowledge Card 在此說明來源試圖解決的具體問題、目標使用者，以及它相較既有方法的切入點。避免只改寫專案宣傳標語。

## 核心概念

整理來源最值得保留的核心思想、抽象模型與設計取捨。需要區分來源明確陳述的事實與分析者的推論。

## 架構與技術

可依來源實際內容說明：

- 主要語言與框架
- 執行環境／模型／供應商
- 儲存與資料流程
- Agent／工具架構
- 部署方式
- 重要外部依賴

若來源沒有提供某項資訊，不應自行補寫成事實。

若 `resource_kind` 是 `skill`，應額外說明適用的 Agent／Runtime、安裝或載入方式、觸發方式、需要的工具／權限，以及 `SKILL.md`、references、scripts、assets 等主要組成。

## 主要功能

- 功能 A：描述實際能力與使用情境。
- 功能 B：描述與其他工具的差異。
- 功能 C：若有 CLI、API、GUI、SDK 等介面，可在此整理。

## 技術亮點

聚焦值得 AI R&D、工程實作或架構設計參考的部分，而非單純列功能清單。

## 限制與風險

至少考慮適用時：

- 技術成熟度與維護狀態
- 供應商／模型／API 依賴
- 安全與隱私
- 擴充性
- 授權或部署限制
- 文件與測試完整度

## 與你的相關性

本段只能使用 `profile/public-profile.yaml` 的公開資訊進行個人化分析。

例如可以說明它對 AI R&D、AOI × AI、LLM／Agent、SillyTavern／AI RPG、影像生成五個面向的價值與限制，但不得引用私人聊天記憶或其他未公開背景。

## 建議怎麼使用

說明為何給予目前的 `Action`，例如：

- `LEARN`：架構值得研究，但沒有立即導入需求。
- `REFERENCE`：可作為設計比較或未來方案評估基準。

`Action` 必須來自固定受控詞彙表（taxonomy）。

## 與其他收藏的關聯

只有在其他 Knowledge Card 已存在時才建立實際連結；不要預先杜撰不存在的關聯卡片。

## 使用者備註

此區為使用者擁有。Agent 更新來源時必須逐字保留，除非使用者明確要求修改。

## 更新紀錄

### 2026-08-11

- 建立 Knowledge Card 格式範例。
