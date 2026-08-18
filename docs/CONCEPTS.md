# 概念圖譜 — Phase 3

Phase 3 將 Knowledge Radar 從 Card-to-Card 語意關聯系統擴充為以 Concept 為中心的知識圖譜。Knowledge Card 仍是具來源與分析內容的證據節點；Concept 是跨多張 Card 可重用的技術抽象，不取代 Card，也不成為新的內容主要權威來源。

## 架構

```text
Knowledge Cards
   │
   ├─ 受控 Categories ───────────────────┐
   ├─ 共用正規化 Tags ───────────────────┤
   └─ promoted Concept 比對 ─────────────┤
                                         ▼
                              canonical Concept 節點
                                         │
                     ┌───────────────────┴───────────────────┐
                     │                                       │
              Card ↔ Concept                         Concept ↔ Concept
               證據 + 強度                           跨 Card 共現
                     │                                       │
                     └───────────────────┬───────────────────┘
                                         ▼
                                data/concepts.json
                                         │
                       ┌─────────────────┴─────────────────┐
                       ▼                                   ▼
                /concepts/<id>                          /graph
```

Phase 2 的 `data/relations.json` 不會被淘汰。`/graph` 可以同時投影三種邊：

- `card-concept`：一張 Card 支援／屬於哪些 Concept；
- `concept-concept`：Concept 在多張 Cards 中共同出現；
- `card-card`：Phase 2 語意關聯，可由 UI 選擇是否顯示。

## Concept 來源

Phase 3 第一版使用確定性擷取，避免讓 ontology 是否能建置依賴外部 LLM。

### Category Concept

每個有效的受控 Category 都會成為 Concept，例如：

```text
Agent → category-agent
RAG / Memory / Knowledge → category-rag-memory-knowledge
```

Category Concept 的 `mapping strength` 為 `1.0`，因為它直接來自有效 Card taxonomy。

### 共用 Tag Concept

Tag 會先做 Unicode NFKC、大小寫與標點正規化。只有跨至少 `minimum_tag_support` 張不同 Card 出現的 Tag 才會升格為 Concept。

因此：

```text
Electron == electron
Claude-Code == claude code
```

只在單一 Card 出現的一次性實作 Tag 不會自動污染 ontology。

### Promoted Concept

`config/concept-config.yaml` 可以定義較高階、跨 taxonomy／Tag 的 Concept，例如：

- `Agent Memory`
- `Character Runtime`
- `Coding Agent Tooling`
- `Local AI Integration`
- `Image Generation Workflow`
- `AI Character Interface`
- `Agent API Bridge`

Promoted Concept 仍使用確定性的公開資料比對。規則只能依賴 Knowledge Card 的有效 Categories／Tags，不得使用私人聊天記憶。

## Card ↔ Concept 證據

每個對應都保存：

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

這使 Concept 頁面能回答「為什麼這張 Card 被放進這個 Concept」，而不是只展示不可解釋的分群結果。

## Concept ↔ Concept 關聯

Phase 3 第一版只產生一種 Concept 關聯：

```text
co_occurs_with
```

若兩個 Concept 在多張 Knowledge Card 中共同出現，就會建立共現邊。

```text
support = 共同支援兩個 Concept 的 Card 數
weight  = support / min(source.card_count, target.card_count)
```

只有達到 `concept_relation_min_support` 的配對才建立關聯，並再用 `concept_relation_top_k` 控制 degree，避免 ontology 在小型資料集就退化成 complete graph。

Concept 關聯是從證據圖譜推導出的關聯訊號，不代表因果、依賴或上下位語意。未來若加入 `is_a`、`part_of`、`enables` 等 ontology 關聯，必須另有明確契約與驗證。

## 產生索引

`data/concepts.json` 包含：

```text
schema_version
generated_at
input_hash
concepts[]
card_concepts[]
concept_relations[]
stats
```

它是可丟棄、可重建的產生資料。唯一可重建來源是：

```text
content/knowledge/**/*.md
+ config/concept-config.yaml
+ scripts/lib/concepts.mjs
```

禁止直接手改 `data/concepts.json` 來修正 Concept。

## Concept 路由

每個 Concept ID 會建立：

```text
/concepts/<concept-id>
```

頁面展示：

- Concept 類型／來源；
- 說明；
- 支援的 Knowledge Cards；
- 對應強度；
- Category／Tag 證據；
- 相關 Concepts；
- 回到 `/graph` 的導覽。

Concept ID 因此屬於穩定公開識別字。一般規則調整不應隨意重新命名 ID。

## 知識圖譜 UI

`/graph` 使用純 Vue + SVG，不引入 D3／Cytoscape 執行階段依賴。

預設版面：

```text
outer ring  = Knowledge Cards
inner ring  = Concepts
center      = Knowledge Radar
```

預設顯示 Card↔Concept 與 Concept↔Concept；Card↔Card 語意關聯可以切換顯示。UI 支援文字搜尋與節點類型篩選，節點可直接連到 Knowledge Card 或 Concept 詳細頁。

目前版面是確定性的視覺化，不宣稱圖上的幾何距離等同向量嵌入距離。

## 指令

```bash
npm run concepts:build
npm run concepts:validate
```

完整語意重建也會一併重建 Concept 索引：

```bash
npm run relations:rebuild
```

## 自動化

`Update Knowledge Graph Indexes` 會在 Card、relation config、concept config 或相關 generator 變動時執行：

```text
embedding index
→ semantic relation index
→ concept graph index
→ validate relations/concepts
→ unit tests
→ commit generated indexes
```

每週 `Full Knowledge Graph Rebuild` 會完整重建 embeddings、relations 與 concepts，以移除過期產生狀態。

## 驗證不變量

`npm run concepts:validate` 至少保證：

- Concept ID 唯一且非空；
- Concept 至少有一張支援 Card；
- `card_count` 與對應數一致；
- Card↔Concept 參照全部存在；
- 對應強度位於 `0..1`；
- 對應必須有證據；
- Concept 關聯不可自指；
- Concept 關聯不可重複；
- `support` 為正整數；
- `weight` 位於 `0..1`；
- config 中 promoted Concept ID 不可重複。

## Phase 邊界

Phase 3 建立的是可導航、可驗證、以 Concept 為中心的圖譜，但不宣稱已完成完整 ontology reasoning。後續可考慮：

- LLM 輔助的 Concept 提案佇列，而不是直接寫入正式 ontology；
- 人工核准／拒絕 Concept 候選；
- `is_a`／`part_of`／`enables` 等類型化 Concept 關聯；
- 依語意向量嵌入或 community detection 排布圖譜；
- Concept merge／split 遷移工具；
- 圖譜品質指標與過期 Concept 審查。