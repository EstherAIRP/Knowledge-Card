---
schema_version: 1
id: github-hkuds-lightrag
title: LightRAG
canonical_url: https://github.com/HKUDS/LightRAG
source:
  type: github
  url: https://github.com/HKUDS/LightRAG
  identity: github:hkuds/lightrag
resource_kind:
  ai: project
  user: null
created_at: 2026-08-27
updated_at: 2026-08-27
last_checked_at: 2026-08-27
summary: LightRAG 是 HKUDS 開源的圖結構 RAG 系統，將實體／關係知識圖譜與向量檢索結合，透過 local、global、hybrid、mix 等查詢模式支援不同層次的知識召回，並提供增量更新、reranker、引用、WebUI、API、多種儲存後端與多模態文件解析。它適合作為知識圖譜 × RAG 架構、企業知識庫與 Agent 外部知識層的實作參考。
classification:
  categories:
    ai:
      - AI / ML
      - LLM
      - RAG / Memory / Knowledge
    user: null
  tags:
    ai:
      - retrieval-augmented-generation
      - graph-rag
      - knowledge-graph
      - hybrid-retrieval
      - vector-retrieval
      - entity-relation-extraction
      - dual-level-retrieval
      - incremental-indexing
      - reranking
      - citation
      - multimodal-rag
      - RAG-Anything
      - Docling
      - MinerU
      - RAGAS
      - Langfuse
      - WebUI
      - Python
      - Docker
      - Neo4j
      - OpenSearch
    user: null
relevance:
  ai:
    overall: 5
    ai_rd: 5
    aoi_ai: 3
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

# LightRAG

## 一句話介紹

LightRAG 是 HKUDS 開源的圖結構檢索增強生成（RAG）系統：它不只把文件切塊後做向量搜尋，而是進一步抽取實體與關係建立知識圖譜，再把圖結構與向量檢索結合，讓查詢可以同時處理局部細節、跨實體關係與較高層次的整體知識。

## 它解決什麼問題

傳統 RAG 常把知識表示成一組彼此相對獨立的文字片段，再依 embedding 相似度找出 top-k chunks。這種方式在「答案就在某一段文字裡」時很有效，但碰到跨文件、多實體、多步關聯或需要理解整體脈絡的問題時，容易只取回零碎片段，忽略資訊之間的結構關係。

LightRAG 的核心切入點是把**圖結構加入索引與檢索流程**。論文將問題描述為平坦資料表示與上下文感知不足，並提出雙層檢索（dual-level retrieval），同時處理較低層次的具體實體資訊與較高層次的整體關係知識；圖結構再與向量表示搭配，以取得相關實體、關係與原始文字證據。

另一個重點是**增量更新**。知識庫不必每次新增文件都整批重建；新的文件可持續進入既有圖譜與索引。近年的專案實作也持續補強大型資料集處理、文件刪除後的知識圖譜重建、不同文件切塊策略、reranker 與多儲存後端，已從論文原型發展成可部署的 RAG 服務框架。

## 核心概念

第一個核心是 **知識圖譜與向量檢索並行，而不是二選一**。LightRAG 會把文字內容轉成 chunks，同時讓 LLM 抽取 entities 與 relations，形成可查詢的圖結構；向量索引則保留語意相似度召回能力。查詢時可依需求從圖、文字片段或兩者混合取得 context。

第二個核心是 **local／global 雙層知識檢索**。程式中的 `QueryParam` 支援 `local`、`global`、`hybrid`、`naive`、`mix` 與 `bypass`：`local` 偏向實體附近的具體脈絡，`global` 偏向整體關係與高層知識，`hybrid` 合併 local 與 global，`naive` 接近一般文字向量檢索，而預設的 `mix` 會整合知識圖譜與向量檢索。這使 LightRAG 不必用單一 retrieval policy 處理所有問題。

第三個核心是 **索引本身具有結構化知識生命週期**。專案不只支援文件插入，也已加入文件刪除、知識圖譜重新整理、增量更新與多種 chunking 策略。這表示圖結構不是一次性的衍生視覺化，而是正式參與資料維護與查詢的索引層。

第四個核心是 **模組化模型與儲存層**。目前實作把 LLM、embedding、reranker 與 storage 拆成可替換元件，並進一步支援 EXTRACT、QUERY、KEYWORDS、VLM 等角色使用不同 LLM 設定。儲存抽象則包含 KV、vector、graph 與 document status 四類，讓單機檔案／資料庫、PostgreSQL、MongoDB、Neo4j、OpenSearch 等不同部署組合可以依規模調整。

## 架構與技術

LightRAG 主要以 **Python** 實作，採 MIT License。專案提供 Python package、核心程式介面、API Server、WebUI 與 Docker Compose 部署方式，也提供離線部署文件與互動式 setup wizard。GitHub 儲存庫截至 2026-08-27 仍持續更新，並已累積約 3.9 萬 stars，屬於目前相當活躍的開源 RAG 專案。

高階資料流程可整理成：

```text
文件輸入
→ 解析／切塊
→ LLM 抽取實體與關係
→ 建立／更新知識圖譜
→ 建立文字與圖相關向量索引
→ 儲存文件狀態與索引資料
→ 查詢時依 mode 執行圖檢索／向量檢索
→ rerank 與 token budget 控制
→ 組合 context
→ LLM 產生答案與可選引用
```

儲存層以抽象介面拆成 `BaseKVStorage`、`BaseVectorStorage`、`BaseGraphStorage` 與 `DocStatusStorage`。這個設計讓 LightRAG 可以把不同資料型態交給不同後端；近期版本也加入 OpenSearch 作為可涵蓋四類儲存的統一後端，另外已有 PostgreSQL、MongoDB、Neo4j 等整合方式。

查詢層的 `QueryParam` 不只控制 retrieval mode，也包含 entity／relation／chunk 的 token budget、`top_k`、`chunk_top_k`、conversation history、reranker 開關、streaming，以及是否只回傳 context／prompt。這表示 retrieval 與 generation 之間有明確的 context 預算控制，而不是無限制把所有檢索結果塞給模型。

文件處理方面，2026 年版本已把 RAG-Anything 能力併入 LightRAG，並可透過 MinerU／Docling 等服務解析多模態文件；同時提供 Fix、Recursive、Vector、Paragraph 等切塊策略。這裡的「多模態」重點是把 PDF、Office 文件、圖片、表格、公式等資料轉成可供 RAG 索引的內容，並不等同於影像生成模型。

觀測與評估方面，專案已整合 **RAGAS** 與 **Langfuse**，API 也可回傳 retrieved contexts，方便做 context precision 等評估與 tracing。使用者介面則包含 LightRAG WebUI，可進行文件插入、查詢與知識圖譜視覺化。

## 主要功能

- **圖結構 RAG**：從文件抽取 entities／relations，將知識圖譜正式納入索引與 retrieval。
- **多種檢索模式**：支援 local、global、hybrid、naive、mix 等模式，可依問題型態調整 retrieval strategy。
- **向量 + 圖混合檢索**：預設 `mix` 將知識圖譜與向量召回結合，而非只依 embedding 相似度。
- **增量更新**：新文件可持續加入既有知識結構，不必每次完整重建索引。
- **文件刪除與圖譜修復**：刪除文件時會處理相關 KG 內容，降低失效關係殘留。
- **Reranker**：可對初步取得的文字 chunks 再排序，改善混合檢索結果品質。
- **引用與 retrieved contexts**：支援回傳來源引用與檢索 context，方便答案追溯與 RAG 評估。
- **多種文件切塊策略**：可依資料型態選擇 Fix、Recursive、Vector、Paragraph。
- **多模態文件解析**：整合 RAG-Anything，透過 MinerU／Docling 處理 PDF、Office、圖片、表格與公式等資料。
- **角色化 LLM 設定**：EXTRACT、QUERY、KEYWORDS、VLM 可使用不同模型與配置。
- **可替換儲存後端**：KV、vector、graph、doc status 可依部署規模配置不同資料庫。
- **API Server + WebUI**：除 Python API 外，也能以服務方式部署並透過 WebUI 管理與查詢知識庫。
- **評估與可觀測性**：整合 RAGAS 與 Langfuse，便於比較 retrieval 與生成品質。

## 技術亮點

最值得參考的是 **「結構化關係」與「語意相似度」同時成為一級 retrieval signal**。一般向量 RAG 擅長找「語意上像」的文字，知識圖譜則擅長保留「誰與誰有什麼關係」。LightRAG 把兩者整合，使 retrieval 能兼顧原始證據與跨實體關係，特別適合需要多跳關聯或整體脈絡的知識庫。

第二個亮點是 **local／global 的抽象非常適合做 retrieval policy 實驗**。同一批資料可以比較局部實體導向、全域關係導向、一般向量搜尋與混合模式，對 AI R&D 來說比「只有一個 top-k API」更容易分析問題到底出在索引、檢索還是生成。

第三個亮點是 **從研究演算法一路延伸到完整服務層**。專案目前已涵蓋文件解析、切塊、entity/relation extraction、圖與向量索引、reranking、引用、評估、tracing、API、WebUI、Docker、Kubernetes 相關部署與多種資料庫整合，因此可以同時拿來研究演算法與參考實務 RAG 平台如何工程化。

第四個亮點是 **模型角色拆分**。不同工作不一定需要同一個 LLM；entity extraction、query generation、keyword extraction、VLM 可以採不同成本／能力模型，讓系統從「一顆模型包辦全部」轉成可調校的 RAG pipeline。

## 限制與風險

第一個限制是 **知識圖譜建置本身需要額外成本**。LightRAG 需要 LLM 參與 entities／relations 抽取，索引階段因此比單純 chunk embedding 更複雜，也會受到模型品質、prompt、語言與領域詞彙影響。專案持續改善開源模型的 KG extraction accuracy，本身也反映這仍是影響結果品質的重要變數。

第二個限制是 **多儲存層帶來一致性與維運複雜度**。KV、vector、graph、document status 可能使用不同後端；文件刪除、更新、migration 或 embedding 設定變更時，必須確保不同索引仍一致。大型部署不只是「換一個向量資料庫」即可完成，還要評估圖資料與文件狀態的生命週期。

第三個限制是 **模型與 retrieval 參數很多，預設值不代表適合所有資料集**。不同 chunking、`top_k`、reranker、local/global/mix、LLM role 與 embedding 模型都會影響結果。論文與官方 benchmark 可證明方法有潛力，但真正導入前仍應使用自己的 corpus 與問題集做 retrieval／answer evaluation。

第四個限制是 **API 部署要主動設定安全邊界**。官方安裝說明指出 server 預設綁定 `0.0.0.0`，若直接暴露在網路上，需要設定 `LIGHTRAG_API_KEY`，或使用帳號／token 驗證並檢查 whitelist 路徑；未設定驗證時不應把服務直接公開到不受信任網路。

第五個限制是 **多模態能力主要是文件理解與索引，不是完整 multimodal reasoning 或 image generation stack**。如果需求核心是影像生成、視覺模型訓練或像素級 CV 推論，LightRAG 只能作為其外部知識／文件層，不能取代專門的視覺模型。

## 與你的相關性

對 **AI R&D** 而言，LightRAG 的價值很高。它把 GraphRAG、vector retrieval、reranking、chunking、evaluation、tracing 與多 storage backend 放在同一個可運行專案中，很適合作為 RAG 架構實驗基線，也能用來比較「純向量」與「圖 + 向量」在真實資料上的差異。

對 **LLM／Agent** 而言，它可以扮演 Agent 外部知識層：Agent 不必把所有文件放進 context window，而是透過 retrieval 取得與目前任務相關的實體、關係與原始文字。尤其 `mix`、引用與 retrieved contexts 對需要可追溯回答的 Agent workflow 很實用。

對 **AOI × AI** 而言，LightRAG 不是視覺檢測模型，但很適合承接 inspection SOP、缺陷 taxonomy、設備手冊、維修紀錄、root-cause 報告與製程知識等文字／文件資料。如果問題需要跨文件串起「缺陷 → 製程條件 → 設備 → 對策」等關係，圖結構會比單純文件搜尋更值得測試。

對 **SillyTavern／AI RPG** 而言，知識圖譜的 entity/relation 與 local/global retrieval 很適合研究世界觀、角色關係、地點、事件與設定資料的召回方式。不過 LightRAG 本身是通用 RAG 基礎設施，不是現成的角色長期記憶或劇情狀態管理器；若要用於 RPG，仍需要另外設計 session memory、時間線與 state transition。

對 **Image Generation** 的直接相關性較低。它可以索引圖片／文件中的內容並提供知識檢索，但不負責 diffusion、ControlNet、LoRA 或影像生成流程。

## 建議怎麼使用

建議先 **TRY**：用一個數十到數百份文件的小型 corpus 建立測試環境，準備一組同時包含單段事實、跨文件關聯與全域摘要的問題，直接比較 `naive`、`local`、`global`、`hybrid`、`mix`。這比只看 demo 更容易判斷圖結構對自己的資料是否真的有價值。

第二步 **LEARN**：重點閱讀 `QueryParam`、entity／relation extraction、`kg_query`、storage abstraction 與 document lifecycle。LightRAG 最值得學的不是某一個 prompt，而是「圖、向量、文字證據與增量索引怎麼放在同一個 RAG runtime 裡」。

第三步把它當成 **REFERENCE**：即使最後不直接採用 LightRAG，它仍非常適合用來設計自己的 GraphRAG／企業知識庫／Agent knowledge service，特別是 local/global retrieval、四類 storage abstraction、reranker 與 retrieval evaluation 這幾個架構切面。

若要正式整合，建議先以自己的問題集做 RAGAS 或自訂評估，確認 retrieval recall、context precision、answer correctness、索引成本與更新延遲，再決定是否採用完整圖索引，而不是只根據公開 benchmark 選型。

## 與其他收藏的關聯

- [`ai-memory`](./github-akitaonrails-ai-memory.md)：兩者都處理「如何讓 LLM 從外部知識取得正確 context」，但定位不同。LightRAG 偏向通用文件知識庫與 GraphRAG retrieval；`ai-memory` 偏向 Coding Agent 的長期歷史記憶、handoff 與生命週期管理。兩者可以用來比較「知識庫 RAG」與「Agent memory」在資料治理、retrieval 與更新策略上的差異。

## 使用者備註


## 更新紀錄

### 2026-08-27

- 建立 LightRAG Knowledge Card；來源正規化為 `https://github.com/HKUDS/LightRAG`。
- 整理圖結構 RAG、local/global/mix retrieval、增量更新、reranker、多模態文件解析、角色化 LLM、儲存抽象、評估與部署能力。
