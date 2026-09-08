---
schema_version: 1
id: github-tsun-u-agent-game-table
title: Agent Game Table
canonical_url: https://github.com/Tsun-u/agent-game-table
source:
  type: github
  url: https://github.com/Tsun-u/agent-game-table
  identity: github:tsun-u/agent-game-table
resource_kind:
  ai: project
  user: null
created_at: 2026-09-08
updated_at: 2026-09-08
last_checked_at: 2026-09-08
summary: 一套讓人類與 AI Agent 透過 MCP 共桌遊玩的自架牌桌平台。Host 掌握伺服器權威狀態，Agent 只接收自己的私有資訊與伺服器計算後的合法動作，支援 STDIO 與 Remote MCP、觀戰與代打、多桌管理及多款台灣常見牌戲。
classification:
  categories:
    ai:
      - Agent
      - SillyTavern / AI RPG
      - General Tools
    user: null
  tags:
    ai:
      - MCP
      - multiplayer-agent
      - server-authoritative
      - card-game-engine
      - Streamable HTTP
      - capability-token
      - agent-environment
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
    - LEARN
    - REFERENCE
  user: null
status:
  ai: active
  user: null
---

# Agent Game Table

## 一句話介紹

Agent Game Table 是一套把「人類玩家」與「AI Agent」放到同一個伺服器權威牌桌上的自架平台：人類用瀏覽器操作，Agent 透過 Model Context Protocol（MCP）加入、觀戰、入座、出牌與聊天，目前原始碼已註冊 8 款台灣常見撲克牌遊戲。

## 它解決什麼問題

許多 AI 遊戲實驗會讓模型扮演主持人、莊家或直接掌握完整遊戲狀態；這種設計不適合需要資訊不對稱與多人公平性的牌戲。Agent Game Table 把牌局狀態集中到 Host，手牌、牌堆、回合與規則判定都由伺服器掌握，人類與 Agent 只是不同介面的玩家。

這使 Agent 不必自己實作整套牌局規則，也不能因為接上工具就看到其他人的私有手牌。輪到 Agent 時，Host 直接提供 `legal_actions` 與 `legal_plays`，讓模型從已驗證的合法選項中選擇，將「會不會遵守遊戲規則」與「策略好不好」拆成兩個不同問題。

## 核心概念

- **伺服器權威狀態**：牌堆、手牌、席位、回合與結算均由 Host 維護，玩家端只取得自己的可見資訊。
- **Agent 與人類平權入桌**：同一桌可以混合真人與 MCP Agent，均經過觀戰、入座、出牌、聊天與離桌流程。
- **合法動作列舉**：Agent 不需自行猜測有效操作；Host 計算合法動作與合法牌組，Agent 只需挑選其中一項送回。
- **事件導向等待**：`wait_for_table_event` 只有出現事件才附帶精簡桌面，無事件時只回少量狀態，可降低長時間等候造成的 token 消耗。
- **可替換遊戲引擎**：牌桌生命週期與遊戲規則分層，新的牌戲以 `GameEngine` 實作後註冊，不必重寫多人牌桌層。

## 架構與技術

專案以 TypeScript 與 Node.js 20 以上環境實作，主要分成幾層：

- `src/multiplayer-store.ts`：管理成員、席位、邀請與能力憑證、版本號、冪等寫入、事件游標、聊天、大廳及持久化。
- `src/engine/`：遊戲規則引擎，以純函式操作可序列化狀態，`src/engine/types.ts` 定義 `GameEngine` 介面。
- `src/engine/registry.ts`：目前註冊 8 個遊戲模式，包含大老二、拱豬、傷心小棧、撿紅點、排七、雙人橋牌、台灣輕橋牌與合約橋牌。
- `web/`：無框架的原生 JavaScript 瀏覽器介面。
- MCP 接入：本機使用 STDIO；遠端使用 Streamable HTTP MCP。

Remote 模式要求 HTTPS 公開網址，並支援 Bearer token、OAuth／OIDC 類型的身分驗證流程。遠端牌桌狀態以 AES-256-GCM 加密後持久化，Agent principal 與座位能力綁定，不同遠端身分不能接管彼此的 MCP session 或座位。

## 主要功能

- 支援 8 款台灣常見牌戲，並把家規做成開桌時的選項。
- 真人與多個 Agent 可同桌，座位滿時可觀戰，局間可輪替。
- 局中支援邀請觀戰者代打，避免單一玩家離席直接破壞整桌體驗。
- Agent 加入後可取得完整規則表，輪到自己時取得自己的手牌、桌面與合法操作。
- 支援多桌隔離、管理台、邀請碼、重連與 Remote Host 重啟後恢復。
- 提供 Claude Code、Codex、Google Antigravity 等 MCP client 的接入範例。

## 技術亮點

最值得參考的不是牌戲數量，而是它把 Agent 行為介面設計成一個**受約束的互動環境**。模型不直接提交任意遊戲指令，而是從伺服器列出的合法集合中決策；這種模式能降低工具呼叫錯誤，也讓評估更集中在策略、協作、欺騙、溝通與長期互動，而不是格式與規則錯誤。

另一個亮點是資訊隔離。Host 維持唯一真實狀態，對手只看到公開資訊；MCP 本身沒有取得全知視角。這種設計對多人 Agent 模擬、社交 Agent 與帶隱藏資訊的 AI RPG 都有參考價值。

牌桌層與遊戲引擎層分離也具有良好的延伸性：多人身分、事件游標、冪等與遠端驗證等基礎設施可以跨遊戲共用，新遊戲主要集中在規則引擎、前端渲染與 MCP 文字摘要。

## 限制與風險

- 專案建立於 2026-09-03，`package.json` 版本仍為 `0.1.0`，屬非常早期且快速變動中的專案。
- Repository 不提供公開託管服務；Remote MCP 必須自行架設 Host、HTTPS reverse proxy、金鑰與身分驗證。
- 文件有明顯版本漂移：目前 README 與 `src/engine/registry.ts` 已是 8 款遊戲，但 2026-09-03 的 `docs/QA.md` 仍記錄當時只有大老二，`docs/MCP.md` 部分段落也反映較早期的遊戲數量。因此評估目前能力時應以最新原始碼與 README 為準，舊 QA 不能直接視為對現行 8 款遊戲的完整驗證。
- 既有 QA 紀錄已驗證當時的規則、STDIO／Remote MCP、加密恢復、身分隔離與瀏覽器 E2E，但同一份報告仍將實際 HTTPS staging、第三方 OIDC 相容性、reverse proxy 限流，以及多副本資料庫一致性列為未完成項目。
- Remote 狀態目前以單檔加密持久化為主；若要做多副本正式服務，需要改成有交易與鎖定機制的資料庫。
- 遊戲規則明確偏向台灣常見玩法與家規，不應假設與其他地區或正式競賽規則完全一致。

## 與你的相關性

依公開技術背景，此專案與 **LLM／Agent** 的關聯很高。它提供一個具狀態、多人、私有資訊、工具呼叫與長時間互動的 Agent 環境，可用來觀察模型在規則約束下的策略選擇、協作與溝通表現。

對 **SillyTavern／AI RPG** 也有明顯參考價值：如果把牌桌視為一個小型世界狀態機，它示範了如何讓多個角色共享世界、各自只看見部分資訊，又透過統一工具協定與事件流持續互動。它本身不是角色記憶或劇情系統，但架構可作為多人角色活動空間的設計參考。

對 AOI × AI 與影像生成則幾乎沒有直接技術關聯。

## 建議怎麼使用

- `TRY`：本機啟動成本低，只需要 Node.js 20 以上，適合直接用既有 MCP client 實際測試真人／Agent 混桌。
- `LEARN`：值得研究 `legal_actions`／`legal_plays`、伺服器權威狀態、能力憑證、事件游標與遊戲引擎抽象等設計。
- `REFERENCE`：可作為多人 Agent 環境、隱藏資訊遊戲、社交 Agent 或 AI RPG 工具介面的架構參考。

若要放到公開網路長期運行，建議先補做最新版完整測試、實際 HTTPS／OIDC 驗證、reverse proxy 限流，以及資料庫化的多副本持久化，再視為正式服務基礎。

## 與其他收藏的關聯

目前 Knowledge Card 尚未找到同來源或直接對應的牌桌專案卡片。概念上它會與 MCP、Agent 工具鏈、多人 Agent 與 AI RPG 類資源形成關係，實際關聯交由知識庫的自動索引與關係圖流程產生。

## 使用者備註


## 更新紀錄

### 2026-09-08

- 建立 Agent Game Table Knowledge Card。
- 依最新 README 與 `src/engine/registry.ts` 確認目前共有 8 個遊戲模式，並註記舊版 QA／MCP 文件的版本漂移。
