---
schema_version: 1
id: threads-dclcucpas-z-66b25b
title: "Hermes Desktop Bot Mode：長期存在的多 Agent 工作角色"
canonical_url: https://threads.com/@aiposthub/post/DcLCUcpAS-z
source:
  type: article
  url: https://threads.com/@aiposthub/post/DcLCUcpAS-z
  identity: threads:DcLCUcpAS-z
created_at: 2026-08-18
updated_at: 2026-08-18
last_checked_at: 2026-08-18
summary: "這篇 Threads 長文介紹 Nous Research 的 Hermes Desktop Bot Mode：將不同 AI Profile 轉成可長期存在的 Bot，分別配置模型、記憶、Skills／MCP、角色設定、API 與排程，並透過多 Bot 協作與 Routines 組成可重複執行的工作流程；同時提醒 Profile 並不等同 Sandbox，需注意本機權限、模型呼叫成本與記憶老化。"
classification:
  categories:
    ai:
      - Agent
      - LLM
    user: null
  tags:
    ai:
      - hermes-desktop
      - multi-agent
      - persistent-agents
      - bot-profiles
      - long-term-memory
      - mcp
      - routines
      - agent-permissions
    user: null
relevance:
  ai:
    overall: 5
    ai_rd: 4
    aoi_ai: 2
    llm_agent: 5
    sillytavern_ai_rpg: 4
    image_gen: 1
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

# Hermes Desktop Bot Mode：長期存在的多 Agent 工作角色

## 一句話介紹

這篇 Threads 長文把 Hermes Desktop Bot Mode 描述成一種「長期存在的數位工作角色」：不同 Bot 各自持有角色、模型、記憶、工具與工作設定，再透過交接、群組討論與排程形成持續運作的多 Agent 工作流程。

## 它解決什麼問題

一般 AI 助手常以單次對話或單次任務為中心，需要使用者反覆指定角色、上下文與工作步驟。來源介紹的 Bot Mode 則把不同職責拆成長期存在的 Bot，例如 Research、Writer、Reviewer，讓每個 Bot 保有自己的 Profile，並在固定流程中重複協作。

這個設計重點不是讓更多 AI 同時聊天，而是把原本混在同一個 Assistant 裡的「角色、記憶、模型、權限、工具與工作紀錄」拆開管理，使不同職責有較清楚的邊界。

## 核心概念

來源可整理出三個主要概念：

- **持久化角色**：Bot 不只是一次性的 Prompt，而是可長期存在、保有自身設定的工作角色。
- **職責分離**：不同 Bot 可以各自負責研究、撰寫、審查等工作，透過交接形成工作鏈。
- **週期性執行**：Routines 讓 Bot 可依固定節奏執行新聞整理、專案檢查、報告產出等重複任務。

因此，這類多 Agent 架構的價值更接近「工作角色與責任邊界管理」，而不只是增加 Agent 數量。

## 架構與技術

依來源描述，每個 Bot Profile 可以分別配置：

- AI 模型
- 長期記憶
- Skills／MCP 工具
- `SOUL.md` 角色設定
- API
- 排程與 Routines

多 Bot 之間則可以用工作交接形成流程，例如：

```text
Research
→ Writer
→ Reviewer
```

來源也提到可以將 2–6 個 Bot 放入同一個 Group Chat 進行討論。這代表整體模式包含兩種主要協作方式：一種是明確的順序式工作交接，另一種是多 Bot 共同討論。

目前來源沒有提供 Hermes Desktop Bot Mode 的內部 Runtime、資料儲存格式、隔離實作、模型路由策略或完整 API 架構，因此這些部分不宜由本文推測。

## 主要功能

- 將不同 AI Profile 轉成長期存在的 Bot。
- 為不同 Bot 分別設定模型、記憶、Skills／MCP、角色設定與 API。
- 使用 Research、Writer、Reviewer 等角色建立多 Agent 工作鏈。
- 讓多個 Bot 在 Group Chat 中共同討論。
- 使用 Routines 安排每日或固定週期任務。
- 將角色、記憶、模型、權限與工作紀錄拆分管理。

## 技術亮點

### 1. Profile 從 Prompt 升級為持久工作單位

最值得注意的並不是「多 Agent」本身，而是 Profile 被提升為可持續存在的 Bot。當角色、記憶、模型與工具都能分離管理後，Agent 的身份就不再只是某次呼叫中的 Prompt 狀態，而更接近一個可反覆使用的工作單位。

### 2. 將 Agent Orchestration 落到可理解的職責鏈

來源使用 Research → Writer → Reviewer 作為範例，這種設計比讓多個 Agent 自由討論更容易觀察輸入、輸出與失敗位置，也較適合逐步驗證多 Agent 是否真的帶來品質提升。

### 3. Routines 讓 Agent 從事件驅動走向持續運作

排程讓 Bot 不必每次等待人工指令，而可以固定執行週期性工作。這使 Agent 系統從「被呼叫的工具」逐漸轉向「長期存在的數位工作角色」。

### 4. 明確指出 Profile 與 Sandbox 是兩件事

來源特別提醒，Bot 擁有獨立 Profile，不代表它具有獨立安全沙箱。這是一個重要的工程界線：角色與記憶隔離不等於作業系統檔案權限、程序權限或執行環境也已隔離。

## 限制與風險

來源直接指出幾個實務風險：

- **Profile ≠ Sandbox**：在預設 local terminal 環境下，Bot 仍可能繼承目前電腦使用者本身的檔案權限。
- **模型呼叫成本增加**：多 Bot 每次交接都可能形成新的模型呼叫，Agent 數量與流程長度增加時，Token 成本也可能上升。
- **權限管理複雜化**：Bot 越多，API、工具與本機權限的邊界越難維護。
- **長期記憶老化**：持久記憶若缺少更新、清理或失效機制，可能累積過期資訊。
- **來源屬於技術摘要**：這篇 Threads 長文未提供完整實作細節、隔離機制、效能測試或正式安全模型，因此適合作為功能與架構觀念入口，不應單獨作為安全性或成熟度判定依據。

## 與你的相關性

依公開技術 Profile，這個主題與 LLM／Agent 與 AI R&D 高度相關。特別值得參考的是「把角色、記憶、模型與工具拆成持久 Agent 單位」的設計，適合用來研究多 Agent orchestration、工具權限、記憶生命週期與週期性任務。

對 SillyTavern／AI RPG 方向也有概念上的參考價值：角色人格、長期記憶與工具能力若能各自管理，可以形成更清楚的持久角色邊界。不過本文討論的是工作型 Bot，不代表其互動與記憶模型可直接等同角色扮演系統。

與 AOI × AI 的直接關聯較低，但 Research → Writer → Reviewer 這類可驗證的角色鏈，仍可作為任何需要多階段 AI 工作流程時的架構參考。

## 建議怎麼使用

- `TRY`：來源本身建議先從少量 Bot 開始，最適合以 Research → Writer → Reviewer 三角色驗證實際體驗。
- `LEARN`：值得研究 Profile、記憶、工具、排程與多 Agent orchestration 如何形成持久工作單位。
- `REFERENCE`：尤其適合作為「角色隔離不等於安全沙箱」以及多 Agent 權限／成本設計的參考案例。

實作時可先挑一個每週固定發生、輸出可人工驗收的工作流程，只建立三個角色；確認品質、成本與權限邊界穩定後，再逐步增加 Routines、工具與自動化。

## 與其他收藏的關聯

目前不建立明確關聯連結。後續若已有以多 Agent orchestration、持久記憶、Agent Runtime 或 Harness 為核心的 Knowledge Card，可再由關聯索引建立對照。

## 使用者備註


## 更新紀錄

### 2026-08-18

- 首次建立 Knowledge Card。
- Threads share URL 已解析為 canonical root `DcLCUcpAS-z`。
- accepted source 共 6 段，使用 `llm_assisted` continuation verification 完成正文重建。
