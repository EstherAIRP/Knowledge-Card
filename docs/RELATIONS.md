# 關聯與概念圖譜 — Phase 3

Knowledge Card 的關聯系統分成兩個互補層次：Phase 2 保留 Card↔Card 語意關聯；Phase 3 在其上加入以概念為中心的知識圖譜。Knowledge Card 仍是帶有來源、分析與使用者狀態的主要內容權威來源；所有向量嵌入、關聯與概念索引都屬於可重建的產生資料。

## 架構

```text
content/knowledge/**/*.md
        │
        ├─ 選定的公開 Card 內容
        │          ↓
        │   本機多語向量嵌入
        │          ↓
        │   taxonomy + 語意候選
        │          ↓
        │   有類型的 Card ↔ Card 關聯
        │
        └─ 有效 Categories / Tags
                   ↓
          確定性 Concept 擷取
                   ↓
        canonical Concept 節點
                   ↓
        Card ↔ Concept 對應
                   ↓
        Concept ↔ Concept 共現
                   │
                   ▼
        ┌─────────────────────────┐
        │ data/relations.json     │
        │ data/concepts.json      │
        └─────────────────────────┘
                   │
                   ▼
       Card 頁面 / Concept 頁面 / /graph
```

產生檔案：

- `data/embeddings.json` — 依穩定 Card ID／內容雜湊快取語意向量。
- `data/relations.json` — Phase 2 Card↔Card 語意候選、分類快取與實際生效的類型化邊。
- `data/concepts.json` — Phase 3 canonical Concept、Card↔Concept 對應與證據、Concept↔Concept 邊及圖譜統計。

設定檔：

- `config/relation-config.yaml` — 語意候選、模型與評分設定。
- `config/relation-overrides.yaml` — 使用者擁有的 Card↔Card pin／block／override 決策。
- `config/concept-config.yaml` — 儲存庫擁有的 Concept 擷取與 promoted Concept 規則。

## Card ↔ Card 語意關聯

Phase 2 子系統維持不變。它會對選定的公開 Card 欄位建立向量嵌入，而不是直接處理整份 Markdown；預設模型為 `Xenova/multilingual-e5-small`。Phase 1 的 taxonomy 分數仍是獨立訊號，並與正規化 cosine similarity 結合形成 LLM 候選集合。

預設關聯類型：

- `similar_to`
- `alternative_to`
- `complements`
- `integrates_with`
- `depends_on`
- `extends`
- `contrasts_with`

`depends_on` 與 `extends` 具有方向性。canonical Card ID 排序只用於建立穩定配對識別；方向另外存於 `direction`，因此排序不會抹除主體／客體語意。

產生的關聯會保留可檢查證據：

```json
{
  "score": 0.81,
  "scores": {
    "taxonomy": 0.42,
    "semantic": 0.76,
    "semantic_raw": 0.89,
    "llm": 0.91,
    "combined": 0.62
  },
  "confidence": 0.91
}
```

## LLM 分類器與備援

設定的憑證存在時，高價值 Card 配對可透過 OpenAI-compatible 結構化分類器判定。接受與拒絕的決策會依候選證據／設定雜湊快取。

外部模型可用性不是部署必要條件。若 API key 缺失或請求失敗：

- 語意候選仍會產生；
- 新候選使用保守的確定性備援；
- 備援發布有獨立分數門檻與 degree cap；
- 備援不會臆造方向性的 `depends_on`／`extends` 語意；
- 證據未變時，保留有效的 LLM 快取判定；
- CI、圖譜產生與 Pages 部署可以繼續。

## 人工 Card 關聯覆寫

`config/relation-overrides.yaml` 仍由使用者擁有。優先順序：

```text
blocked
> human override / pinned
> LLM classification
> semantic fallback
```

自動化可以讀取此檔案，但不得覆寫。手動建立的方向性關聯必須明確指定方向。

## Concept 擷取

Phase 3 新增確定性 Concept 產生，不會預設把 ontology 建立交給 LLM。

Concept 來源有三種：

1. **受控 Category Concept** — 每個有效 taxonomy Category 都成為 canonical Concept。
2. **共用 Tag Concept** — 正規化後的 Tag 只有在跨足設定的最少 Card 數量後才升格為 Concept。
3. **Promoted Concept** — `config/concept-config.yaml` 中人工整理的高階抽象，使用有效 Categories／Tags 做確定性比對。

正規化使用 Unicode NFKC，加上大小寫與標點 canonicalization，避免表面格式差異產生重複 Concept。只出現在單一卡片的一次性實作 Tag 會被排除，除非它之後成為共用概念或被明確 promoted。

Promoted Concept 可表達可重用抽象，例如 `Agent Memory`、`Character Runtime`、`Coding Agent Tooling`、`Local AI Integration`、`Agent API Bridge`。比對規則只能使用公開儲存庫資料，不得使用私人對話脈絡。

完整 Concept 產生細節請見 `docs/CONCEPTS.md`。

## Card ↔ Concept 對應

每個對應都保留證據與有界強度：

```json
{
  "card_id": "github-example-project",
  "concept_id": "agent-memory",
  "strength": 0.84,
  "origin": "promoted",
  "evidence": [
    { "kind": "category", "value": "RAG / Memory / Knowledge" },
    { "kind": "tag", "value": "agent-memory" }
  ]
}
```

這是一條有證據的邊，而不是不可解釋的分群標籤，因此 Concept 詳細頁可以說明每張 Knowledge Card 為什麼支援該 Concept。

## Concept ↔ Concept 關聯

Phase 3 目前只產生一種 Concept 關聯：

```text
co_occurs_with
```

只有兩個 Concept 在足夠多的支援 Card 中共同出現時才建立連結。每條邊記錄：

```text
support = 共同支援兩個 Concept 的 Card 數
weight  = support / min(source.card_count, target.card_count)
```

支援門檻與 Concept degree cap 用來維持圖譜稀疏。`co_occurs_with` 只代表關聯訊號，不得解讀為因果、依賴、taxonomy 階層或 `is_a` 語意。

若未來加入 `is_a`、`part_of`、`enables` 等類型化 ontology 關聯，必須建立明確的新契約，不能直接從共現關係推論。

## 網站投影

Phase 3 從三個視角呈現同一份圖譜：

```text
/knowledge/<card-id>
    Card 內容
    + Card↔Card 語意關聯
    + Concept 鄰域

/concepts/<concept-id>
    Concept 中繼資料
    + 支援 Cards / 證據
    + 相關 Concepts

/graph
    以 Concept 為中心的互動圖譜
```

`/graph` 視覺化整合：

- Card↔Concept 成員邊；
- Concept↔Concept 共現邊；
- 可選的 Phase 2 Card↔Card 語意邊。

目前 SVG 版面是確定性的呈現幾何，不代表畫面距離等同向量嵌入距離。

## 產生資料所有權

產生索引不得成為內容或人工意圖的唯一權威來源。

```text
Knowledge Cards + repository config + generator code
                    ↓
 embeddings.json / relations.json / concepts.json
```

不要手動編輯產生的 JSON。Concept 規則變更應修改 `config/concept-config.yaml`；人工 Card 關聯決策應修改 `config/relation-overrides.yaml`。

Concept ID 是 `/concepts/<id>` 下的公開路由識別字，除非進行明確遷移，否則應保持穩定。

## 指令

增量向量嵌入：

```bash
npm run embeddings:build
npm run embeddings:validate
```

Card↔Card 關聯：

```bash
npm run relations:build
npm run relations:build:semantic
npm run relations:validate
npm run relations:report
```

Concept Graph：

```bash
npm run concepts:build
npm run concepts:validate
```

完整語意與 Concept 重建：

```bash
npm run relations:rebuild
```

## 自動化

相關 `main` 變更會執行 **Update Knowledge Graph Indexes** workflow：

```text
增量 embeddings
→ 語意 relations
→ Concept Graph
→ 驗證 + 測試
→ 有變更時提交產生索引
```

每週的 **Full Knowledge Graph Rebuild** 會重新產生全部向量嵌入、關聯候選／分類狀態與 Concept graph，清除過期產生狀態。

PR CI 與 Pages 部署都會在靜態網站產生前建立並驗證 Concepts。Concept 擷取本身不需要外部 API key。

## 驗證邊界

Phase 3 驗證的是圖譜完整性，而不是只檢查 JSON 能否解析。除了 Phase 2 關聯不變量外，Concept 驗證還會檢查唯一穩定 ID、有效 Card／Concept 參照、對應證據與強度、支援 Card 數量、重複／自指 Concept 邊、relation support／weight 與 promoted Concept 設定一致性。

目前 Phase 3 刻意停在完整 ontology reasoning 之前。LLM 輔助 Concept 提案、人工審核佇列、Concept merge／split 遷移、語意圖譜版面與有類型的階層 Concept 關聯，都屬於後續圖譜演進，不應在現階段偷偷推論。