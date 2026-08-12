---
schema_version: 1
id: github-minijinai75-tavern-claude-bridge
title: Claude Bridge
canonical_url: https://github.com/Minijinai75/tavern-claude-bridge
source:
  type: github
  url: https://github.com/Minijinai75/tavern-claude-bridge
  identity: github:minijinai75/tavern-claude-bridge
created_at: 2026-08-12
updated_at: 2026-08-12
last_checked_at: 2026-08-12
summary: Claude Bridge 是一套將 SillyTavern 接到本機 Claude Code／Claude Agent SDK 的橋接擴充，提供 OpenAI-compatible chat endpoint、串流回覆、圖片輸入、思考摘要切換與長對話 prompt cache 拆塊；其特色不只是轉發 API，而是針對 RP prompt 結構、快取命中與診斷做專門處理。
classification:
  categories:
    ai:
      - LLM
      - Agent
      - SillyTavern / AI RPG
      - Infrastructure / Deployment
    user: null
  tags:
    ai:
      - SillyTavern
      - Claude-Agent-SDK
      - Claude-Code
      - OpenAI-compatible-API
      - local-bridge
      - prompt-caching
      - cache-breakpoint
      - roleplay-inference
      - SSE-streaming
      - subscription-auth
      - prompt-normalization
    user: null
relevance:
  ai:
    overall: 5
    ai_rd: 4
    aoi_ai: 1
    llm_agent: 5
    sillytavern_ai_rpg: 5
    image_gen: 1
  user: {}
actions:
  ai:
    - TRY
    - INTEGRATE
    - LEARN
    - REFERENCE
  user: null
status:
  ai: active
  user: null
---

# Claude Bridge

## 一句話介紹

Claude Bridge 是一套 SillyTavern 前端擴充加 server plugin，將酒館的 OpenAI-compatible chat request 轉換成 Claude Agent SDK 呼叫，使用本機已登入的 Claude Code 訂閱身份完成生成，再把結果以 OpenAI-compatible JSON 或 SSE 串流格式送回 SillyTavern。

## 它解決什麼問題

SillyTavern 擅長角色卡、世界書、深度注入、長對話與 RP 工作流，但 Claude Code／Claude Agent SDK 並不是 SillyTavern 原生的 chat-completion provider。若要直接使用本機 Claude Code 登入狀態，就需要一層協定與 prompt 語義轉換，而不只是把 HTTP request 原樣轉發。

Claude Bridge 的切入點是把這個相容層做成專門面向 SillyTavern 的本機 bridge：它提供 `/v1/models` 與 `/v1/chat/completions`，理解酒館的 message 排列、system injection、重新生成與串流行為，並針對長 RP 對話額外處理 prompt caching。

專案也刻意把 Agent SDK 當成單輪推理 runtime 使用：實作中設定 `tools: []`、`maxTurns: 1` 與 `settingSources: []`，因此核心不是讓 Claude 在本機執行 Agent tools，而是借用官方 SDK／Claude Code 登入通道來完成文字與圖片推理。

## 核心概念

第一個核心是 **local bridge，而非遠端代理**。Server 綁定 `127.0.0.1:5199`，README 描述的資料流是 `SillyTavern → 本機 Claude Code / Agent SDK → Claude`。這降低了額外第三方 relay 的資料暴露面，但也代表可用性依賴本機 Claude Code、登入狀態、SillyTavern server plugin 與 Agent SDK 版本。

第二個核心是 **prompt semantic adaptation**。SillyTavern 組好的 message array 中，角色卡、預設、世界書深度注入與當前玩家訊息不一定符合一般 OpenAI／Anthropic API 對 role 的直覺。Bridge 會辨識 header、保留 post-history 注入位置、以最後一則 `user` 作為當前輸入，並把歷史重組為 `<history>` 區塊。這種轉換正是它比一般 reverse proxy 更有技術含量、也更需要回歸測試的部分。

第三個核心是 **以實際訊息變化尋找 cache breakpoint**。專案沒有只硬編碼「世界書深度」之類的設定，而是對前後兩次 request 的各則訊息做 fingerprint，比對第一個內容分歧點，再與結構掃描結果取較保守的邊界。穩定的 history 前綴會被切成獨立 content block 並標記 1 小時 cache，會動的尾端維持未快取。這個方法能涵蓋某些「改寫舊樓」而非新增訊息的 RP 機制。

## 架構與技術

專案主要是 JavaScript / Node.js，包含兩層：

- **SillyTavern frontend extension**：`manifest.json`、`index.js`、`style.css`，提供狀態、模型、推理、拆塊快取與自我健檢等控制面板。
- **SillyTavern server plugin**：`server/tavern-claude-bridge/index.mjs`，啟動本機 HTTP bridge，載入 `@anthropic-ai/claude-agent-sdk`，處理 chat completion、SSE、圖片、usage、錯誤轉譯與 request cancellation。
- **Cache breakpoint module**：`cache-breakpoint.mjs` 將快取邊界判定獨立成可測的訊息 fingerprint／結構掃描邏輯。

Server package 目前標示版本 `1.6.3`，依賴 `@anthropic-ai/claude-agent-sdk ^0.3.216`，授權為 AGPL-3.0-only。前端 `manifest.json` 同樣標示 `1.6.3`。

HTTP 層提供 health、model list、config、self-test 與 `/v1/chat/completions`。Chat completion 同時支援非串流 JSON 與 SSE；request body 設有 4MB 上限，使用者停止、頁面斷線或送出新的重新生成 request 時，bridge 會嘗試中斷前一個 SDK query，而不是單純排隊。

圖片會轉成 Agent SDK 可接受的 content block，但設計上只攜帶最新一則 user message 的圖片，避免長對話反覆送出歷史圖片造成成本膨脹。

## 主要功能

- 以 SillyTavern `Custom (OpenAI-compatible)` 介面連接本機 Claude bridge。
- 使用本機 Claude Code 的登入狀態，不要求使用者在 SillyTavern 填入 Anthropic API key。
- 支援 JSON 與 SSE streaming chat completion。
- 支援最新一則訊息的內嵌圖片輸入。
- 可切換 Claude 原生 thinking summary，避免與 RP prompt 自行產生的 `<thinking>` 通道互相干擾。
- 提供 Reasoning Effort 對應、模型列表、健康狀態與主動 self-test。
- 記錄 SDK 回報的 cost、cache read/write、命中比例與部分 subscription quota 診斷資訊。
- 長對話可啟用 split cache，將穩定 history 與動態尾端分塊；README 提供長局實測案例，但該數字應視為作者環境的案例而非普遍 benchmark。
- 新請求會讓前一則生成讓位，較符合 RP 場景中的「停止／重新生成」操作語義。

## 技術亮點

最值得保留的不是「把 Claude 接進酒館」本身，而是它如何處理 **動態 RP context 與 prefix cache 的衝突**。`cache-breakpoint.mjs` 使用前後 request fingerprint 直接量測訊息何處開始改變，再用 system injection 結構掃描作第二條防線；這比固定保留最後 N 則或列舉每一種外掛規則更能適應未知 extension。

另一個亮點是 **可觀測性針對真實失效型態設計**。程式碼大量區分「沒有 usage」、「cache 沒命中」、「模型根本沒開始」、「SDK result 回錯但沒有 throw」、「SillyTavern process 環境與 CLI 環境不同」等情況，並提供 self-test、usage fallback、prefix hash tracing 與空回覆診斷。這些都是 bridge 類工具實際維護時比正常 happy path 更重要的能力。

它也有明確的 **語義不變式**：拆成 cache blocks 後，兩塊文字重新串接必須與原始 prompt 完全相同；若自檢不成立就退回不拆。這種 fail-safe 思路很適合作為 LLM middleware 的工程參考。

## 限制與風險

最大的非技術風險來自 **訂閱通道使用邊界**。Repository README 明確標示此方案未獲 Anthropic 官方背書，並指出「以 Claude 訂閱額度接第三方介面」不是官方文件明確列出的白名單情境。這是專案作者自己的風險聲明；真正導入前應重新核對當下 Anthropic／Claude Code／Agent SDK 的官方使用條款，而不能把「使用官方 SDK」等同於「所有第三方用法都被官方允許」。

Claude Code 通道本身也有限制：README 列出 temperature / top_p 不生效、不支援 prefill，且經此通道的 token 統計與一般 API 不完全等價。這表示某些依賴採樣參數或固定開頭的 SillyTavern preset 無法原樣移植。

Prompt 轉換是另一個相容性風險。世界書、正則、記憶系統與第三方 extension 都可能改變 message ordering 或內容；專案已經針對多種真實案例修正，但這類 middleware 天生需要跟著 SillyTavern 與 SDK 變化維護。

Privacy 方面，bridge 只綁 loopback 是優點，但本機 endpoint 本身不驗 API key；任何能存取使用者本機該 port 的程式都可能呼叫它。另依程式註解，`persistSession` 預設開啟以提高對話 cache 命中，因此 Agent SDK session 資料會留在本機磁碟，對資料留存敏感的使用者應特別確認。

成熟度仍屬早期專案：Repository 建立於 2026-07-21，最新程式集中在少數檔案。公開 tree 沒有獨立 `test/` 目錄，雖然程式註解多次提到 spike／contract test 與真實案例回歸，但目前從公開 Repository 不容易獨立重跑完整測試證據。

另有一個值得注意的 metadata drift：frontend `manifest.json` 與 server `package.json` 都是 `1.6.3`，但 server export 的 plugin `info.version` 仍寫成 `1.3.0`。這不代表核心功能失效，但會使狀態 API／除錯資訊可能顯示舊版號，反映版本同步仍有改善空間。

## 與你的相關性

依公開技術 Profile，這個專案對 **SillyTavern / AI RPG** 與 **LLM / Agent** 都是核心相關。它直接處理角色聊天、世界書／歷史 prompt、thinking 顯示、長對話成本與本機 provider bridge，是比一般 LLM SDK demo 更接近實際 AI RPG runtime 的案例。

對 **AI R&D** 也有很高的工程參考價值，尤其是 cache breakpoint detection、prompt semantic normalization、stream cancellation、usage observability、provider compatibility layer 與 fail-safe invariants。這些模式可以抽離 SillyTavern，應用到其他長上下文 LLM middleware。

對 **AOI × AI** 幾乎沒有直接關聯；對 **Image Generation** 也沒有生成側價值，雖然它支援 multimodal image input，但用途是讓 Claude 理解圖片而非生成影像。

## 建議怎麼使用

- **TRY**：在隔離的本機 SillyTavern 環境實際跑一組既有 RP 對話，先驗證登入、串流、世界書位置、重新生成與圖片輸入是否符合預期。
- **INTEGRATE**：若目標就是讓 SillyTavern 使用 Claude Code／Agent SDK，這個專案已提供相對完整的 adapter，可以作為直接整合候選；但應先確認當前官方使用政策與本機 session 留存需求。
- **LEARN**：優先讀 `cache-breakpoint.mjs` 與 `index.mjs` 的 prompt parsing、split cache、usage diagnostics。這些部分比安裝流程更值得作為 LLM middleware 設計教材。
- **REFERENCE**：把它當作「RP frontend → local model runtime」橋接層的架構基準。未來比較其他 provider bridge 時，可檢查是否同樣處理 message semantics、interrupt、streaming、multimodal、cache、observability 與 policy boundary。

如果要評估 split cache 的真實價值，應用自己的長對話建立 A/B：固定角色卡與世界書，分別關閉／開啟 split，至少跑到第三輪後比較 cache read、cache write、單輪 cost 與輸出一致性，而不要直接把 README 的單一案例當成預期節省比例。

## 與其他收藏的關聯

可與 [Personal Model](./github-intuition-lab-personal-model.md) 對照閱讀。兩者都採 local-first 思路、讓上層 AI client 透過本機 runtime 取得能力，但 Personal Model 解決的是跨 Agent 的長期記憶與 context ownership，Claude Bridge 解決的是 SillyTavern 到模型推理 runtime 的 provider／prompt adaptation；兩者位於 Agent stack 的不同層。

目前收藏中尚無另一張直接同類的 SillyTavern provider bridge，因此不建立更多牽強關聯。

## 使用者備註


## 更新紀錄

### 2026-08-12

- 首次收錄 Claude Bridge。
- 依 Repository README、server plugin、cache breakpoint implementation、package metadata 與公開 repository metadata 整理其 SillyTavern bridge、prompt adaptation、split cache、observability 與風險邊界。
