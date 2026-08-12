# Concept Graph — Phase 3

Phase 3 將 Knowledge Radar 從 Card-to-Card semantic relation system 擴充為 Concept-centric Knowledge Graph。Knowledge Card 仍是具來源與分析內容的 evidence node；Concept 是跨多張 Card 可重用的技術抽象，不取代 Card，也不成為新的內容 source of truth。

## Architecture

```text
Knowledge Cards
   │
   ├─ controlled Categories ─────────────┐
   ├─ shared normalized Tags ────────────┤
   └─ promoted Concept matching ─────────┤
                                         ▼
                              canonical Concept nodes
                                         │
                     ┌───────────────────┴───────────────────┐
                     │                                       │
              Card ↔ Concept                         Concept ↔ Concept
           evidence + strength                  cross-Card co-occurrence
                     │                                       │
                     └───────────────────┬───────────────────┘
                                         ▼
                                data/concepts.json
                                         │
                       ┌─────────────────┴─────────────────┐
                       ▼                                   ▼
                /concepts/<id>                          /graph
```

Phase 2 的 `data/relations.json` 不被淘汰。`/graph` 可以同時投影三種 edge：

- `card-concept`：一張 Card 支援／屬於哪些 Concept；
- `concept-concept`：Concept 在多張 Cards 中共同出現；
- `card-card`：Phase 2 semantic relation，可由 UI 選擇顯示。

## Concept sources

Phase 3 第一版使用 deterministic extraction，避免讓 ontology 是否可建置依賴外部 LLM。

### Category Concepts

每個有效 controlled Category 都會成為 Concept，例如：

```text
Agent → category-agent
RAG / Memory / Knowledge → category-rag-memory-knowledge
```

Category Concept 的 mapping strength 為 `1.0`，因為它直接來自有效 Card taxonomy。

### Shared-tag Concepts

Tag 先做 Unicode NFKC、大小寫與標點正規化。只有跨至少 `minimum_tag_support` 張不同 Cards 出現的 tag 才會升格成 Concept。

因此：

```text
Electron == electron
Claude-Code == claude code
```

而只在單一 Card 出現的一次性 implementation tag 不會自動污染 ontology。

### Promoted Concepts

`config/concept-config.yaml` 可以定義較高階、跨 taxonomy/tag 的 Concept，例如：

- `Agent Memory`
- `Character Runtime`
- `Coding Agent Tooling`
- `Local AI Integration`
- `Image Generation Workflow`
- `AI Character Interface`
- `Agent API Bridge`

Promoted Concept 仍使用 deterministic public-data matching。規則只能依賴 Knowledge Card 的有效 Categories/Tags；不得使用私人聊天記憶。

## Card ↔ Concept evidence

每個 mapping 都保存：

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

這使 Concept page 能回答「為什麼這張 Card 被放進這個 Concept」，而不是只展示不可解釋的群組結果。

## Concept ↔ Concept relations

Phase 3 第一版只產生一種 Concept relation：

```text
co_occurs_with
```

如果兩個 Concept 在多張 Knowledge Cards 中共同出現，會建立共現 edge。

```text
support = 共同支援兩個 Concept 的 Card 數
weight  = support / min(source.card_count, target.card_count)
```

只有達到 `concept_relation_min_support` 的 pair 才建立 relation，並再以 `concept_relation_top_k` 控制 degree，避免 ontology 在小型資料集就退化成 complete graph。

Concept relation 是由 evidence graph 推導出的 association，不代表因果、依賴或上下位語意。未來若加入 `is_a`、`part_of`、`enables` 等 ontology relation，必須另有明確 contract 與 validation。

## Generated index

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

它是 disposable generated data。唯一可重建來源是：

```text
content/knowledge/**/*.md
+ config/concept-config.yaml
+ scripts/lib/concepts.mjs
```

禁止直接手改 `data/concepts.json` 來修正 Concept。

## Concept routes

每個 Concept ID 會建立：

```text
/concepts/<concept-id>
```

頁面展示：

- Concept type / origin；
- description；
- supporting Knowledge Cards；
- mapping strength；
- Category/Tag evidence；
- Related Concepts；
- 回到 `/graph` 的 navigation。

Concept ID 因此屬於穩定 public identifier。一般規則調整不應隨意 rename ID。

## Knowledge Graph UI

`/graph` 使用純 Vue + SVG，不引入 D3/Cytoscape runtime dependency。

預設 layout：

```text
outer ring  = Knowledge Cards
inner ring  = Concepts
center      = Knowledge Radar
```

預設顯示 Card↔Concept 與 Concept↔Concept；Card↔Card semantic relation 可切換。UI 支援文字搜尋與節點類型篩選，節點直接連到 Knowledge Card 或 Concept detail route。

這個 layout 目前是 deterministic visualization，不宣稱圖上幾何距離等同 embedding distance。

## Commands

```bash
npm run concepts:build
npm run concepts:validate
```

Full semantic rebuild 也會連帶重建 Concept index：

```bash
npm run relations:rebuild
```

## Automation

`Update Knowledge Graph Indexes` 在 Card、relation config、concept config 或相關 generator 變動時執行：

```text
embedding index
→ semantic relation index
→ concept graph index
→ validate relations/concepts
→ unit tests
→ commit generated indexes
```

每週 `Full Knowledge Graph Rebuild` 會完整重建 embeddings、relations 與 concepts，以移除 stale generated state。

## Validation invariants

`npm run concepts:validate` 至少保證：

- Concept ID 唯一且非空；
- Concept 至少有一張 supporting Card；
- `card_count` 與 mapping 數一致；
- Card↔Concept references 全部存在；
- mapping strength 位於 `0..1`；
- mapping 必須有 evidence；
- Concept relation 不可 self-reference；
- Concept relation 不可 duplicate；
- support 為正整數；
- weight 位於 `0..1`；
- config promoted Concept ID 不可重複。

## Phase boundary

Phase 3 建立的是可導航、可驗證的 Concept-centric graph，但不宣稱已完成完整 ontology reasoning。後續可考慮：

- LLM-assisted Concept proposal queue，而不是直接寫入正式 ontology；
- human approve/reject Concept candidate；
- `is_a` / `part_of` / `enables` 等 typed Concept relations；
- graph layout 按 semantic embedding 或 community detection 排布；
- Concept merge/split migration tooling；
- graph quality metrics 與 stale Concept review。
