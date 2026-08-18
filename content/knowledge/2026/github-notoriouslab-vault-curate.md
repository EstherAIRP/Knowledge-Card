---
schema_version: 1
id: github-notoriouslab-vault-curate
title: Vault Curate
canonical_url: https://github.com/notoriouslab/vault-curate
source:
  type: github
  url: https://github.com/notoriouslab/vault-curate
  identity: github:notoriouslab/vault-curate
created_at: 2026-08-19
updated_at: 2026-08-19
last_checked_at: 2026-08-19
summary: >-
  Vault Curate 是 Obsidian 的本地優先知識整理外掛，把 BM25、中文語意嵌入與模糊標題搜尋融合成混合檢索，並用語意關聯圖、最寬路徑與 Hot/Cold 分級協助重新發現未手動連結或長期未觸及的筆記；預設在本機建索引，AI 整理功能則採明確啟用與人工觸發。
classification:
  categories:
    ai:
      - RAG / Memory / Knowledge
      - General Tools
    user: null
  tags:
    ai:
      - Obsidian
      - personal-knowledge-management
      - local-first
      - semantic-search
      - hybrid-search
      - BM25
      - embeddings
      - CJK
      - knowledge-graph
      - k-NN
      - WebGPU
      - SQLite
      - transformers.js
    user: null
relevance:
  ai:
    overall: 4
    ai_rd: 4
    aoi_ai: 1
    llm_agent: 4
    sillytavern_ai_rpg: 3
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

# Vault Curate

## 一句話介紹

Vault Curate 是一款 Obsidian 本地優先外掛，把筆記庫轉成可用語意搜尋、關聯探索與遺忘再發現的個人知識索引，同時把是否建立真實 wikilink、是否隱藏建議等最終決策保留給使用者。

## 它解決什麼問題

Obsidian 原生搜尋偏向字面比對，原生關聯圖主要呈現已經手動建立的連結；這代表「不同措辭但相同概念」的筆記不容易被找到，尚未建立 wikilink 的潛在關聯也不會自然浮現，長期未編輯的孤立筆記更容易沉入筆記庫。

Vault Curate 將問題拆成一個「找到 → 看見關聯 → 重新發現」閉環：先用混合檢索找筆記，再用語意鄰域與語意路徑探索未連結關係，最後用 Hot/Cold 分級把長期未觸及但仍與近期主題相關的內容重新帶回視野。它刻意不把 AI 放在自動改寫或自動決策的位置，而是把關聯視為建議；採納後才寫成 wikilink，拒絕後則記住這個判定。

## 核心概念

1. **混合檢索而非只靠向量搜尋**：查詢同時執行 BM25、語意相似度與 Jaro-Winkler 模糊標題比對，再用 Reciprocal Rank Fusion 合併排名。這種設計可同時保留精確詞彙、同義改寫與錯字容忍度。
2. **把知識關聯視為可操作建議**：語意相近但尚未建立連結的筆記會出現在關聯圖與 Discover 中；使用者可採納為真正 wikilink，或永久隱藏不合理的配對。
3. **語意路徑採最寬路徑（widest path）判定**：路徑分數由最弱的一條邊決定，而不是讓多個強連結掩蓋一個牽強跳點；底層在 k-NN 語意圖上尋找有限跳數內瓶頸相似度最高的路徑。
4. **本地優先與單一索引寫入者**：桌機負責建置與更新索引，索引檔跟著原本的 vault 同步到行動裝置；手機與平板以唯讀方式使用，以避免多裝置同時重建索引造成同步衝突。
5. **AI 整理與檢索分離**：預設的搜尋與關聯探索不需要 LLM 自動介入；摘要、標籤與主題式 MOC 生成屬於可選功能，必須明確開啟並手動觸發。

## 架構與技術

- **執行環境**：TypeScript 實作的 Obsidian 外掛；目前 `manifest.json` 顯示版本 1.5.0、最低 Obsidian 1.7.2，並支援桌機與行動裝置。
- **內建嵌入模型**：預設在 Web Worker 中透過 transformers.js／ONNX Runtime WASM 執行 `Xenova/bge-small-zh-v1.5` 的 q8 量化版本。程式也支援 Ollama 與 OpenAI-compatible 嵌入端點。
- **中文處理**：語意嵌入前會把繁體中文轉為簡體表徵，但原始筆記、關鍵字搜尋與顯示內容保持原樣；BM25 另使用針對 CJK 的分詞規則。
- **索引儲存**：以 sql.js 維護 SQLite 索引，筆記與 chunk 的向量以 BLOB 儲存。由於專案使用的 sql.js 未內建 FTS5，BM25 實際採純 TypeScript 倒排索引，並以 typed arrays 壓縮 postings。
- **搜尋融合**：BM25、chunk 級餘弦相似度與模糊標題三路檢索平行執行，預設權重為 1.0／1.0／0.5，再透過 RRF 合併。
- **語意圖**：以筆記向量建立 k-NN 圖，預設每個節點取 10 個鄰居並限制同資料夾鄰居數，降低大量模板同源筆記擠占鄰域的問題；完整建圖為 O(N²) 相似度掃描，專案以 Worker 與增量維護降低主執行緒負擔。
- **語意路徑**：在 k-NN 圖上使用有限跳數的 widest-path 動態規劃，最大化整條路徑的最小相似度，並用圖中邊分數分布的百分位門檻判斷是否真的足夠連通。
- **行動裝置**：桌機建立的 SQLite 索引由同步工具帶到手機／平板；行動端不寫索引。沒有遠端嵌入服務時，查詢可退化成 BM25 加模糊標題，但 Find Similar、Discover 與其他使用既有向量的功能仍可利用桌機建立的索引。

## 主要功能

- **語意搜尋**：以 BM25、語意向量與模糊標題組合查詢筆記。
- **Find Similar**：從目前筆記尋找內容或主題上接近的其他筆記，並融合 frontmatter tags 以降低只因文體／模板相似而產生的誤配。
- **關聯圖**：產生可編輯的 Obsidian Canvas，區分已有 wikilink 與尚未建立連結的語意近鄰。
- **語意路徑**：在兩篇筆記間找出一條由多篇中繼筆記構成、且每一跳都相對合理的關聯鏈。
- **原地展開圖譜**：在既有 Canvas 上展開某一節點的語意鄰域，避免重複節點並保留使用者已調整的版面。
- **Hot/Cold 與 Discover**：依內部連結和近期建立／編輯狀態判定筆記熱度，從近期關注主題重新找出相關但被遺忘的 Cold 筆記。
- **採納／拒絕建議**：可把語意關聯提升成真實 wikilink，也可永久隱藏不合理的筆記配對；判定可跨重新索引保留。
- **可選 AI 整理**：啟用後可手動生成筆記描述與標籤、批次處理搜尋結果，以及產生主題分組的 MOC；支援 Ollama 或 OpenAI-compatible LLM 端點。

## 技術亮點

### 1. 混合檢索設計具備實作參考價值

專案沒有把「語意搜尋」簡化成單一路徑的向量近鄰，而是保留 BM25 與模糊標題，再用 RRF 做排名融合。對中文個人知識庫來說，這能處理專有名詞需要精確命中、同義詞需要語意擴展、標題又可能有拼寫差異的多種查詢型態。

### 2. CJK 搜尋不是只換一個 embedding model

Vault Curate 同時處理 CJK BM25 tokenization、繁體轉簡體的 embedding 前處理與中文 BGE 模型，因此中文支援是從詞法檢索到語意表示的一整條資料路徑，而不是只宣稱「支援中文」。

### 3. 語意圖不是單純把 cosine similarity 畫成線

k-NN 建圖包含同資料夾鄰居上限，用來抑制模板兄弟筆記形成局部壟斷；語意路徑再用瓶頸最佳化而不是總分或平均分，降低一條非常弱的橋接邊被其他高相似邊掩蓋的風險。這些設計很適合作為知識圖譜式探索介面的工程參考。

### 4. 人在迴路（human-in-the-loop）被做成持久狀態

使用者對關聯的採納與拒絕不是一次性 UI 操作，而是會影響後續建議：採納者轉成真連結、拒絕者不再出現。這讓系統逐步吸收使用者自己的知識結構判定，而不是每次重新計算後又重複提出同樣的錯誤建議。

### 5. 桌機單寫入、行動端唯讀是務實的同步取捨

向量索引與 SQLite 檔案若在多裝置同時更新，容易與一般檔案同步工具發生衝突。Vault Curate 直接規定桌機維護索引、行動端只消費同步結果，犧牲行動端即時建索引能力，換取較簡單且可預期的跨裝置狀態模型。

## 限制與風險

- **語意搜尋的向量掃描仍具有線性成本**：目前查詢會逐一讀取所有 chunk 向量並計算 cosine similarity，因此語意檢索成本會隨 chunk 數量成長；BM25 已有稀疏倒排索引，但向量部分尚不是 ANN 索引。這在非常大型 vault 上是值得實測的擴充性限制。
- **完整 k-NN 建圖是 O(N²)**：專案用 Worker、背景建置與增量維護緩解 UI 阻塞，但首次完整建立大型語意圖仍有平方級計算成本。
- **首次本地啟動仍需要取得模型與 WASM 資產**：內建模式不需要 API key，但會下載模型與 SQLite／ONNX Runtime 的 WASM 執行資產；完全離線的新安裝環境需要先準備這些檔案。
- **「本地優先」取決於所選供應者**：使用內建模型時語意索引在本機處理；若切換到 Ollama、遠端 OpenAI-compatible 嵌入端點或啟用外部 LLM 整理，資料邊界就取決於該端點部署位置與隱私政策。
- **行動端不是完整索引工作站**：手機與平板不能建立／更新索引，也不能執行部分寫入型操作；新筆記必須等桌機重新索引並同步後才會完整進入搜尋結果。
- **AI 整理會實際修改筆記**：摘要／標籤生成與 MOC 輸出雖然預設關閉且手動觸發，但一旦啟用仍屬寫入行為，應先確認版本控制、備份與模型輸出品質。
- **仍是相對年輕的專案**：Repository 建立於 2026 年，雖然目前已進入 Obsidian Community plugins 且 main 顯示 1.5.0，但長期相容性、超大型 vault 與不同同步方案的行為仍值得持續觀察。

## 與你的相關性

對公開技術背景中的 **AI R&D** 與 **LLM／Agent** 方向有高參考價值。Vault Curate 的混合檢索、中文向量前處理、RRF、持久化索引、k-NN 語意圖與 widest-path 設計，都是可抽離成一般知識檢索／記憶系統元件的工程案例。

它本身不是 Agent，也不是用 LLM 直接回答問題的 RAG 系統，但「從大量個人知識中找回相關內容、建立潛在關聯、保留人的採納／拒絕回饋」這套模式，與 Agent 長期記憶、知識庫探索及記憶再召回很接近。對 SillyTavern／AI RPG 方向也有中度的架構轉用價值，例如把角色記憶分成近期熱記憶與長期冷記憶，並把語意鄰域與顯式回饋用於記憶召回；這屬於可借鑑的設計推論，而不是 Vault Curate 原生功能。

它與 AOI × AI、影像生成沒有直接應用連結，因此這兩個面向的相關性較低。

## 建議怎麼使用

- **TRY**：如果要直接體驗本地中文語意搜尋、Obsidian 關聯探索與 Cold note 再發現，Community plugins 的安裝門檻低，適合用真實 vault 驗證搜尋品質與索引成本。
- **LEARN**：優先研究 `src/search/searchHybrid.ts`、`src/storage/bm25.ts`、`src/search/semanticPath.ts` 與 embedding provider 架構；這幾個區域集中呈現混合檢索、CJK BM25、語意圖與本地模型抽象方式。
- **REFERENCE**：可作為「本地知識庫 + 混合檢索 + 語意圖 + 人在迴路回饋」的架構參考，尤其適合比較純向量搜尋、純 Graph RAG 或完全由 LLM 自動整理知識庫的不同取捨。

若要評估導入大型知識庫，建議先以實際筆記量測量三件事：首次索引時間、單次語意查詢延遲，以及 k-NN 圖首次建立成本，再決定是否需要 ANN 向量索引或把嵌入服務外移。

## 與其他收藏的關聯

目前 Repository 中未找到可確認為同一技術鏈、且適合直接建立連結的既有 Knowledge Card，因此暫不加入跨卡片連結。

## 使用者備註


## 更新紀錄

### 2026-08-19

- 新增 Vault Curate Knowledge Card。
- 記錄混合檢索、中文/CJK 處理、語意 k-NN 圖、widest-path、Hot/Cold 再發現與桌機／行動索引架構。
- 標記向量查詢線性掃描、完整 k-NN 建圖平方成本與外部 AI 端點造成的資料邊界變化等限制。
