---
schema_version: 1
id: threads-db-wlkkgtu-18d1ea
title: AI 時代，我是怎麼重新確認自己與「開發」之間的真實關係
canonical_url: https://threads.com/@licca_bobo/post/Db-WLkKgTU_
source:
  type: article
  url: https://threads.com/@licca_bobo/post/Db-WLkKgTU_
  identity: threads:Db-WLkKgTU_
created_at: 2026-08-13
updated_at: 2026-08-13
last_checked_at: 2026-08-13
summary: 這篇 Threads 文章以 Svelte 5 + Tauri 開發 Multi Agent Desktop Runtime 的經驗，反思 AI Coding 時「把工作全部交給模型」與「保留架構理解、文件閱讀、程式碼審校與親手修改」之間的差異。核心價值不在特定框架教學，而在建立 human-in-the-loop 的開發節奏：AI 負責加速設計與實作，人仍保有系統架構、生命週期、Rust ownership 與前端狀態同步等關鍵技術的理解與決策權。
classification:
  categories:
    ai:
      - Agent
      - AI Coding / DevTools
    user: null
  tags:
    ai:
      - ai-coding
      - human-in-the-loop
      - multi-agent-runtime
      - svelte-5
      - tauri
      - rust-ownership
      - architecture-review
      - documentation-first
      - code-review
    user: null
relevance:
  ai:
    overall: 4
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

# AI 時代，我是怎麼重新確認自己與「開發」之間的真實關係

## 一句話介紹

這篇文章不是在教一套新的 AI Coding 工具，而是在描述一種更可持續的開發方式：讓 AI 參與設計與實作，同時刻意保留文件閱讀、架構判斷、程式碼審校與親手修改，使開發者仍然真正理解並擁有自己正在建造的系統。

## 它解決什麼問題

AI Coding 可以快速產生程式碼，但「產出速度變快」不等於「開發者對系統的理解同步增加」。原文指出，如果把所有工作都直接交給 AI，作者反而會產生空虛與低價值感；相對地，當自己讀完文件、慢慢審查專案架構，並實際修改部分程式碼後，開發感受會變得更扎實。

這背後對應的不只是一個心理問題，也是一個工程治理問題。當開發者逐漸不知道系統為什麼採用某個架構、生命週期如何流動、狀態在哪裡同步、ownership 邊界如何成立時，即使 AI 能繼續產生可執行程式碼，人也會失去對錯誤診斷、設計取捨與後續維護的主導能力。

因此文章真正處理的是 **AI 加速與技術 ownership 之間的平衡**：如何利用模型降低實作成本，又不把理解系統本身這件事一起外包出去。

## 核心概念

原文可整理成四個相互連動的原則：

1. **AI 是交錯設計者，不是唯一實作者**：作者使用不同家的 AI 模型交錯參與設計，但沒有把模型輸出視為最終答案。
2. **把模型等待時間轉成閱讀時間**：AI 忙碌時就閱讀官方文件，使模型產出與人類理解能並行累積，而不是只等待下一段生成結果。
3. **保留關鍵技術的第一手理解**：即使 AI 能寫出大量程式碼，仍希望自己能處理架構設計、生命週期、Rust ownership，以及與 Svelte state 同步等核心問題。
4. **用較慢的節奏換取更高的掌控感**：文章明確接受這種方式可能降低短期產出速度，但換來更穩定的理解、判斷與開發滿足感。

從工程流程來看，可以把它抽象成一個 human-in-the-loop loop：

```text
需求／架構問題
    ↓
多個 AI 模型提出設計或實作
    ↓
開發者閱讀文件、核對技術假設
    ↓
人工審查架構與生命週期
    ↓
親手修改關鍵程式碼
    ↓
把新理解帶回下一輪 AI 協作
```

重點不是要求每一行程式都人工撰寫，而是確保高風險、高耦合、會決定系統長期可維護性的部分仍有人能解釋、驗證與修改。

## 架構與技術

原文透露目前正在使用 **Svelte 5 + Tauri** 打造一個 **Multi Agent Desktop Runtime**，並特別點出幾個正在學習或處理的技術面向：

- 桌面應用的整體架構設計與生命週期。
- Tauri 背後 Rust 程式設計中的 ownership 問題。
- Rust／Tauri 與 Svelte 端狀態同步的邊界。
- 不同 AI 模型交錯參與設計與開發。

不過，文章沒有公開 runtime 的實際 component diagram、Tauri command／IPC 設計、Rust crate 組成、Svelte store 結構、Agent orchestration protocol、模型路由、session persistence、權限隔離或 deployment 方式。因此目前只能確認技術選型與作者關注的工程問題，不能從本文推導出完整系統架構。

這點本身也很重要：這篇收藏的用途應是 **開發方法論與設計心態 reference**，而不是 Svelte 5、Tauri 或 Rust 的實作教學。

## 主要功能

本文沒有發布可下載的成品，也沒有列出 Multi Agent Desktop Runtime 的正式 feature list；目前能直接從來源確認的，是作者正在建立一個桌面型多 Agent runtime，並以多家 AI 模型協助設計。

因此若以文章本身作為 Knowledge Card，其主要「功能」更接近一套開發工作法：

- 讓不同模型交錯參與架構與程式設計。
- 在 AI 生成或等待期間閱讀技術文件。
- 人工重新檢查模型形成的專案架構。
- 對關鍵程式碼保留親手修改能力。
- 把「是否真的理解系統」納入開發完成度，而不只看任務卡是否被清空。

對 runtime 本身的具體能力，仍需未來的專案公開資料、程式碼或技術文件才能建立更細的產品層分析。

## 技術亮點

第一個值得保留的概念是 **AI-assisted development 不等於 delegated development**。模型可以承擔大量搜尋、草擬、比較與程式生成工作，但架構 ownership 必須有明確的人類落點。當系統出現跨語言、跨 runtime 或狀態同步問題時，這種理解會直接影響 debugging 與設計修正能力。

第二個亮點是 **把文件閱讀嵌入 AI workflow，而不是視為 AI 之前的準備工作**。在傳統流程裡常先讀文件再寫程式；AI Coding 可以改成模型執行與人類閱讀並行。這讓 AI 的速度優勢不必以犧牲技術理解為代價。

第三個亮點是 **把「能否人工修改關鍵路徑」當成系統可控性的代理指標**。如果一個 AI 生成的專案只有模型能持續修改，人對架構已經缺乏足夠 mental model；反過來，能解釋 ownership、state synchronization 與 lifecycle，並能自行修改相關程式碼，代表開發者仍掌握核心設計。

第四個亮點是 **有意識地接受較慢的局部速度**。在 Agentic Coding 越來越容易追求 task throughput 的情況下，原文提醒應區分「任務完成數」與「系統理解度」。對需要長期維護的工程專案，後者往往更接近真正的技術資產。

## 限制與風險

這是一篇個人開發反思，不是對 AI Coding 生產力、程式品質或學習效果的實證研究。作者描述的空虛感、滿足感與 Tauri 學習曲線都屬於個人經驗，不能直接推廣成所有開發者都會得到相同結果的結論。

來源也沒有提供 Multi Agent Desktop Runtime 的 repository、程式碼、架構圖、測試結果或 benchmark，因此目前無法驗證其實作成熟度，也無法判斷多模型交錯設計是否真的改善 correctness、maintainability 或開發效率。

此外，「自己讀文件與改程式」並不自動代表設計正確。若沒有測試、lint/type check、integration test、security review 與可觀測性，人工參與仍可能做出錯誤判斷。更完整的 human-in-the-loop pipeline 應把理解與自動化驗證同時保留，而不是把兩者視為替代關係。

對 Tauri 類桌面 runtime 而言，跨前端／Rust 邊界還可能涉及 IPC 權限、command surface、local filesystem、credential handling 與 process isolation；本文沒有討論這些面向，因此不應從文章內容推定它們已被處理。

Threads 完整性方面，來源 root 雖顯示有回覆，但 Phase 7 只找到一則同作者候選：「oh mo 竟然是 Pi 底層，我來看看」。它出現在主文約 32 分鐘後，語義上是後續隨手回覆而不是文章續篇，因此被標記為 `followup`，沒有併入原始正文。

## 與你的相關性

依公開技術 Profile，這篇內容與 **AI R&D、LLM / Agent** 的工作方向具有高相關性。尤其在實作 Agent、AI Coding workflow 或跨框架工具時，真正困難的部分往往不是讓模型先產生一版程式，而是確保之後仍能由人理解、debug、重構與持續演進。

對 **Agent** 方向而言，作者正在建造 Multi Agent Desktop Runtime，本身就與 Agent runtime、model orchestration 與 desktop tooling 的設計問題相鄰。雖然本文尚未提供足夠架構細節，但「多模型交錯設計 + 人工保留 ownership」可以作為開發這類系統時的 process guideline。

對 **AI R&D** 而言，這篇文章也適合轉成可測量的工程假設。例如可比較「完全代理式 coding」與「文件閱讀 + 架構審查 + 關鍵路徑人工修改」兩種流程，在 defect rate、返工次數、architecture consistency、debug time 與開發者可解釋性上的差異。

它與 **AOI × AI**、**Image Generation** 沒有直接技術連結；與 **SillyTavern / AI RPG** 只有「多 Agent／runtime」層面的間接關聯，因此相關性維持較低。

## 建議怎麼使用

- **LEARN**：把這篇文章當成 AI Coding 的流程設計案例，特別觀察哪些工作適合交給模型、哪些知識必須由開發者保留第一手理解。可優先把 architecture、lifecycle、state ownership、security boundary 與 failure handling 視為不可完全外包的區域。
- **REFERENCE**：建立自己的 Agentic Coding checklist 時，可以加入「我是否能解釋這個模組為什麼這樣設計」、「我是否能不依賴模型修改關鍵路徑」、「模型提出的框架用法是否已對照官方文件」等檢查項，而不是只記錄 AI 完成了多少任務。

若未來要工程化這個方法，可以在每次大型 AI coding change 後保存簡短的 architecture decision record（ADR）：記錄模型建議、採納原因、官方文件證據、人工修改點與驗證結果。這會比單純保留聊天紀錄更容易累積可維護的技術 ownership。

## 與其他收藏的關聯

- [Orca](./github-stablyai-orca.md)：Orca 把多個 coding agents、worktree isolation、review 與 orchestration 做成 Agent Development Environment；本文則提供互補的人類工作原則——即使多 Agent 能平行加速，也要保留對架構與關鍵修改的人工理解與 review。若要設計 Multi Agent Desktop Runtime，Orca 可作為產品／runtime 層參考，本篇可作為 human-in-the-loop 流程參考。
- [Personal Model](./github-intuition-lab-personal-model.md)：Personal Model 強調 provenance、可修正狀態與長期 Agent runtime；本文沒有深入 memory layer，但同樣凸顯一個共通原則：AI 系統越複雜，越需要讓人保留可理解、可追溯、可修改的控制面，而不能只依賴模型持續生成下一版。

## 使用者備註


## 更新紀錄

### 2026-08-13

- 首次收錄。
- 原始 Threads `/share/BACv6U2rel/` 已解析為 canonical root `Db-WLkKgTU_`，stable identity 為 `threads:Db-WLkKgTU_`。
- Phase 7 root-only recovery 將唯一同作者候選 `Db-Z5PogTuV` 判定為後續 `followup`，未併入正文；完整性狀態為 `INFERRED_SINGLE_POST_HIGH_CONFIDENCE`，thread verification 為 `llm_assisted`。
- 正式分析僅使用已驗證完整的 root `combined_text`。
