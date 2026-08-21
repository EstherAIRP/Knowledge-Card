---
schema_version: 1
id: github-cynthianani-a-simple-nest
title: A Simple Nest
canonical_url: https://github.com/Cynthianani/A-simple-nest
source:
  type: github
  url: https://github.com/Cynthianani/A-simple-nest
  identity: github:cynthianani/a-simple-nest
resource_kind:
  ai: project
  user: null
created_at: 2026-08-12
updated_at: 2026-08-21
last_checked_at: 2026-08-21
summary: A Simple Nest 是一套以「自建持續存在的 AI 伴侶」為目標的工程設計筆記，從 message/context 排序、tool design、Anthropic prompt caching、SQLite＋embedding 長期記憶、hybrid recall、memory consolidation、摘要壓縮，到自主喚醒與主動訊息，整理出一條不依賴現成框架的 stateful companion agent 建構路徑。
classification:
  categories:
    ai:
      - LLM
      - Agent
      - RAG / Memory / Knowledge
      - SillyTavern / AI RPG
    user: null
  tags:
    ai:
      - ai-companion
      - stateful-agent
      - context-engineering
      - long-term-memory
      - memory-consolidation
      - hybrid-retrieval
      - reciprocal-rank-fusion
      - embeddings
      - SQLite
      - prompt-caching
      - tool-design
      - proactive-agent
      - Anthropic-Claude
      - Web-Push
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
    - BUILD
    - LEARN
    - REFERENCE
  user: null
status:
  ai: active
  user: null
---

# A Simple Nest

## 一句話介紹

A Simple Nest 不是可直接安裝的 AI framework，而是一套從實際 AI 伴侶系統累積出的工程筆記：把人格、時間感、工具、記憶、壓縮、快取與主動行為視為同一個長期 Agent runtime 的組成部分，並用可逐步實作的方式說明如何從最小骨架一路擴充。

## 它解決什麼問題

一般聊天型 LLM 很容易在單次對話中維持人格，但只要跨 session、context 被裁切，或需要自己使用工具、主動發訊息，系統就會暴露出「沒有真正持續狀態」的限制。A Simple Nest 處理的正是這個落差：如何讓一個 AI 角色不只會回覆，而是能保有長期記憶、理解時間先後、主動找回相關脈絡、使用自己的工具，並在沒有新使用者訊息時仍可以被喚醒後做決策。

作者把這套內容明確定位成「走過的路與踩坑紀錄」，而不是正式 framework 或完整教學。Repository 以 00–14 共十五個篇章逐層展開，包含 message architecture、tool design、cache strategy、memory write / recall / merge、subconscious memory、summary compression、chronicle、dream、proactive messaging、frontend 與 fake tool-call 汙染等主題。

這種形式的價值在於它沒有先假設一定要使用大型 Agent framework，而是從「一個長期陪伴角色到底需要哪些 subsystem」往回拆解最小工程問題，因此很適合做 system design 參考與原型藍圖。

## 核心概念

第一個核心是 **context 本身就是角色當下的世界模型**。訊息架構篇把每次 API request 的 `messages` 視為 AI 此刻可感知的全部現實，並將內容拆成 system identity、舊摘要、近期 conversation history 與 dynamic context。作者特別強調所有內容應維持「舊的在前、新的在後」的時間排序，否則模型可能把較早的摘要誤解成剛發生的事件。這其實是一個很實用的 context-engineering 原則：時間資訊不只是 metadata，排列順序本身也會影響 temporal interpretation。

第二個核心是 **工具不是單純 API schema，而是角色對自身能力的認知**。專案建議 tool description 使用與 persona 一致的語氣，並在 description 中直接寫出使用情境與邊界。來源列出的實例涵蓋記憶、待辦、文件、Web、RSS、社群、鬧鐘、感知、語音與信箱等工具。技術上仍是標準 tool use，但設計重點從「endpoint 能做什麼」提升成「角色何時會自然想到這是自己的能力」。

第三個核心是 **把長期記憶拆成 write、storage、recall、consolidation 與 compression 不同生命週期**。記憶不是單一向量搜尋函式，而是一組會隨時間演化的資料結構。來源使用 SQLite 儲存 memory cards，內容包含 `content`、`source`、`created_at`、embedding、weight、emotion、pinned、archived、citation 與 sublayer 等欄位；最小版本只要求內容、來源、時間與向量即可運作。

第四個核心是 **記憶應該自然淡化與重組，而不是讓模型任意刪除**。記憶整理篇採「寧可多留，不要多丟」原則：相似碎片可以 merge / consolidate，但舊文字進入 sublayer 保留地層史，未被使用的記憶交給 weight decay 慢慢沉下去；矛盾則建立 `contradicts` 關係，而不是直接覆蓋。這使 memory maintenance 從單純摘要，變成一個帶 provenance 與 reversible thinking 的小型知識演化系統。

第五個核心是 **主動性不等於固定 cron 訊息**。主動訊息篇的做法是用隨機鬧鐘喚醒同一個 Agent context，讓模型看到時間、近期對話、浮現記憶、待辦與外部狀態後，自己決定要傳訊息、做事或什麼都不做。自主決策與排程只是 trigger 的區分，對話時與主動醒來時共用同一套人格、工具與長期狀態。

## 架構與技術

這個 Repository 本身主要是 Markdown 設計文件，不提供一套可 clone 後直接啟動的正式 runtime。來源中的實作片段以 Python 為主，並以 Claude API / Anthropic tool use 與 prompt caching 作為主要實例；README 也說明概念大多不限定單一模型。

記憶層的基礎設計是 **SQLite + embeddings**。來源示例使用 Gemini `gemini-embedding-001` 產生 3072 維 float32 向量，並建議使用 NumPy binary 寫入 SQLite BLOB，而非 JSON 字串，以減少儲存體積。搜尋最小版本直接對所有向量計算 cosine similarity；記憶量增加後，再加入 keyword search 與 RRF（Reciprocal Rank Fusion）做 hybrid recall。

Recall pipeline 不是只取 Top-K embedding。來源進一步加入：

- vector search + keyword search 的 RRF 合併；
- weight 對語意分數加權；
- daily decay 與 recall boost；
- emotional intensity 影響衰減速度；
- memory link graph 從 seed memory 擴散鄰居；
- summary memory 採補位制，避免長摘要壟斷 recall slots。

Memory consolidation 被設計成定期批次整理。相似卡片可以 merge，較大的相關碎片群可以 consolidation；被覆寫的內容保存在 `sublayer`，被吸收的卡片改為 archived，原有 links 轉移到保留卡片。來源也加入字數硬閘、未吸收安全網、整理前 database backup 與 contradiction linking，避免模型在整理過程中不可逆地刪掉資訊。

Conversation compression 採 **high-water / low-water hysteresis**。來源示例是訊息累積超過 122 則才觸發，壓回保留 60 則，再用每批最多 13 則的方式生成多段摘要。重點不是這些數字本身，而是避免每輪都刪一則舊訊息，因為頻繁改動 history prefix 會降低 prompt cache 命中率。摘要失敗時則不裁切原始歷史，優先保留資料完整性。

Prompt cache 章節以 Anthropic 為主要實例，提出四個 breakpoint：system prompt、tool definitions、最後一則穩定 assistant history，以及 tool loop 中的移動 cache marker。這種切法的核心是把「長期穩定前綴」與「每輪變動尾端」分開。來源報告其實際系統的 cache hit rate 可維持在 70% 以上；這屬作者環境的實務觀察，不應視為通用 benchmark，而且實際 cache 價格與 TTL 仍應以 provider 當期規格為準。

主動訊息層以背景 async loop 為例，在 1–4 小時間隔中隨機喚醒，並加入 quiet hours 與 daily max。喚醒後仍使用完整人格、history、tools 與 recall context，最後可透過 Web Push 與前端 broadcast 將主動訊息送到使用者端。角色也可以自己設定一次性 alarm，形成「未來自己叫醒自己」的簡單 temporal agency。

## 主要功能

- 規劃可持續存在 AI 角色的 message / context 組裝順序。
- 將人格、釘選記憶、摘要、近期歷史與 dynamic context 分層注入。
- 設計 persona-aware tool descriptions 與多類工具能力。
- 以 SQLite 儲存長期記憶卡片與 embedding。
- 實作 vector + keyword 的 hybrid memory recall 與 RRF 排序。
- 以 weight decay、emotion、recall boost 與 link graph 管理記憶浮現。
- 定期 merge / consolidate 記憶，同時保存 sublayer 歷史與矛盾關係。
- 使用 high-water / low-water 策略壓縮長對話並保存 diary-like summaries。
- 透過 prompt caching 降低長 context 與多工具 Agent 的重複 input 成本。
- 讓 Agent 在無新訊息時被喚醒，自主決定是否發話、做事或保持沉默。
- 透過 Web Push 與前端事件呈現主動訊息。
- 分析歷史中的 fake tool calls、長期上下文與角色內在生活等 companion-specific 問題。

## 技術亮點

最值得保留的亮點是 **把 AI companion 問題轉成 state lifecycle，而不是單純 persona prompt**。人格只負責「我是誰」，時間感、記憶、主動性與工具各自有獨立資料流與觸發機制。這種拆法更接近真正長時間運作的 Agent architecture。

第二個亮點是 **memory pipeline 的非破壞性設計**。weight decay、archive、sublayer、contradiction links 與 pre-merge backup 都是在回答同一個問題：模型可以幫忙整理記憶，但不應該輕易成為不可逆刪除真相的唯一裁判。即使沒有照搬其所有欄位，這種設計原則也適合用在一般長期 Agent memory。

第三個亮點是 **把 cache strategy 與 summary strategy 聯動**。很多系統把 conversation trimming 與 prompt caching 分開設計，但此專案直接指出「每輪滑動刪除 history」會讓 stable prefix 消失，因此壓縮策略要配合 cache breakpoint。這是很實際的成本／context architecture 共設計案例。

第四個亮點是 **hybrid recall 不是追求複雜，而是針對具體 blind spot 逐步加層**。最小版本只用 embedding Top-K；遇到人名、專有名詞問題後補 keyword；遇到結果融合再加 RRF；記憶量變大後才加 decay、link graph、summary quota。這種 incremental design 很適合用於早期原型，避免一開始就導入重量級 vector DB 或複雜 graph infrastructure。

第五個亮點是 **主動 Agent 的「可不做事」設計**。喚醒 prompt 明確允許 nothing，是在抑制 LLM 常見的 usefulness bias：模型被叫醒後不必為了證明有用而巡遍所有工具。這個 guardrail 對任何 background / scheduled agent 都有參考價值。

## 限制與風險

第一個限制是它**不是可直接安裝的 framework**。來源本身明確說明這是一系列思路與踩坑分享；程式碼多為章節內示例，沒有固定 package API、版本化 runtime、完整測試矩陣或 deployment artifact。因此最適合 `BUILD / LEARN / REFERENCE`，不應把它當作成熟成品直接 `TRY` 或 `INTEGRATE`。

第二個限制是大量設計來自單一家庭式 AI companion 的實務經驗。像 high-water 122、keep 60、batch 13、每日主動訊息上限、1–4 小時喚醒、特定 weight decay 等，都應視為案例參數，而不是經過 benchmark 的普遍最佳值。

第三個限制是部分實作明顯 **Anthropic / Claude-centric**。Tool use 與一般模型容易遷移，但 cache breakpoint、TTL、cache control 格式與成本模型會依 provider 改變。若改成 OpenAI、Gemini、OpenRouter 或 local model，需要重新確認 cache semantics、tool loop 與 context accounting。

第四個限制是 **記憶正確性與推斷污染**。專案允許 consolidation 時加入高信心 inference，雖然會降低初始權重並保留舊內容，但推論一旦進入 recall pipeline，仍可能形成自我強化。若應用到高風險或事實性 Agent，最好額外加入 provenance、confidence、source citation、human correction 與區分 observation / inference 的 schema。

第五個風險是 **感知與外部工具的隱私邊界**。來源的工具箱案例包含螢幕截圖、手機使用軌跡、健康／睡眠資料、郵件、社群與瀏覽器。這類 capability 對 companion 很自然，但如果實際建置，必須把最小權限、資料保留期、local storage、secret management、明確 consent 與工具 audit trail 視為一級設計問題，而不能只關注角色體驗。

截至 2026-08-12，Repository 建立時間很短，GitHub metadata 顯示 default branch 為 `master`、未標示 license，也沒有 release。缺少 license 意味著可以閱讀與參考公開內容，但若要直接複製、重製或散布程式／文字，授權邊界不夠明確，應先取得作者授權或等待正式 license。

## 與你的相關性

依公開技術 Profile，A Simple Nest 對 **LLM / Agent** 與 **SillyTavern / AI RPG** 都屬核心相關，因為它集中處理長期角色系統真正困難的部分：context layout、記憶生命週期、tool use、摘要、成本控制與 autonomy，而不是只做 persona prompt。

對 **AI R&D** 也有高價值。它提供多個可以獨立驗證的工程 hypothesis，例如 chronological context ordering、hybrid recall、memory decay、consolidation safety、summary hysteresis 與 proactive wake-up。這些機制都適合做小型 A/B 測試或 evaluator，而不必先實作完整 companion product。

對 **AOI × AI** 幾乎沒有直接應用，因此 `aoi_ai` 給 1；對 **Image Generation** 也不是生成 pipeline 類專案，因此 `image_gen` 給 1。它的價值主要集中在 stateful LLM system 與角色 Agent architecture。

## 建議怎麼使用

- **BUILD**：把它當作 companion-agent MVP 的設計清單，而不是整套照抄。最適合先做 `message architecture → SQLite memory → semantic recall → summary compression → proactive wake-up` 五層，逐層觀察角色一致性與成本變化。
- **LEARN**：優先研究 01、04、05、06、07、09、12 幾篇。這幾篇分別對應 context、cache、storage、retrieval、consolidation、compression 與 autonomy，合起來已經是一個完整 stateful-agent curriculum。
- **REFERENCE**：未來比較 AI companion / roleplay 系統時，可以用它的 subsystem 分法當 checklist：Identity、Temporal Context、Tools、Memory Write、Recall、Consolidation、Summary、Chronicle、Autonomy、Frontend。

若要把內容轉成真正可維護的 runtime，建議補上三個來源中較弱的工程層：第一是 observation / inference / user-authored memory 的 provenance schema；第二是工具與感知權限的 policy / audit；第三是對 memory recall 與 proactive behavior 的離線 evaluation。這樣才能從「有效的個人系統經驗」提升成可重複驗證的工程平台。

## 與其他收藏的關聯

- [Project AIRI](./github-moeru-ai-airi.md)：兩者都把 AI companion 視為長期存在的角色系統，但切入層級不同。AIRI 是完整的 multimodal character runtime，涵蓋 voice、avatar、client、game agent 與 memory；A Simple Nest 更聚焦「內在狀態」——context、memory lifecycle、summary 與 autonomy。可以把 A Simple Nest 當成 AIRI 類 runtime 的 state / memory 設計參考。
- [Personal Model](./github-intuition-lab-personal-model.md)：兩者都做長期記憶，但 Personal Model 強調 owner-owned、evidence-linked、跨 Agent 的個人 context；A Simple Nest 強調單一角色持續存在時的 autobiographical / relational memory。兩者很適合比較 provenance-first memory 與 companion-first memory 的資料模型差異。
- [Claude Bridge](./github-minijinai75-tavern-claude-bridge.md)：兩者都涉及 Claude、長對話與 prompt caching。Claude Bridge 從 SillyTavern request adaptation 與 cache breakpoint 處理 RP inference；A Simple Nest 則從 companion runtime 的整體 history / summary / cache lifecycle 設計。前者偏協定橋接，後者偏 state architecture。
- [Character Select SAA](./github-mirabarukaso-character-select-stand-alone-app.md)：SAA 展示如何把 Agent 接到 image-generation capability；A Simple Nest 則補上角色本身的 memory、tool semantics 與 autonomy。兩者位於同一個角色 Agent stack 的 action layer 與 state layer，可用來思考「角色如何記得」與「角色能做什麼」應如何解耦。

## 使用者備註


## 更新紀錄

### 2026-08-21

- 重新檢查目前 Repository，依主要交付物正式將 `resource_kind` 分類為 `project`。

### 2026-08-12

- 建立 Knowledge Card，依 README 與 message architecture、tool design、cache、memory、recall、merge、summary、proactive messaging 等主要篇章整理核心架構與風險。
