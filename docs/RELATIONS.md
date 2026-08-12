# Relation & Concept Graph — Phase 3

Knowledge-Card 的 relation system 現在分成兩個互補層次：Phase 2 保留 Card↔Card semantic relation；Phase 3 在其上新增 Concept-centric Knowledge Graph。Knowledge Card 仍是具來源、分析與使用者狀態的內容 source of truth；所有 embedding、relation 與 Concept index 都是可重建的 generated data。

## Architecture

```text
content/knowledge/**/*.md
        │
        ├─ selected public Card content
        │          ↓
        │   local multilingual embedding
        │          ↓
        │   taxonomy + semantic candidates
        │          ↓
        │   typed Card ↔ Card relations
        │
        └─ effective Categories / Tags
                   ↓
          deterministic Concept extraction
                   ↓
        canonical Concept nodes
                   ↓
        Card ↔ Concept mappings
                   ↓
        Concept ↔ Concept co-occurrence
                   │
                   ▼
        ┌─────────────────────────┐
        │ data/relations.json     │
        │ data/concepts.json      │
        └─────────────────────────┘
                   │
                   ▼
       Card pages / Concept pages / /graph
```

Generated files:

- `data/embeddings.json` — cached Card semantic vectors keyed by stable Card ID/content hash.
- `data/relations.json` — Phase 2 Card↔Card semantic candidates, classification cache and effective typed edges.
- `data/concepts.json` — Phase 3 canonical Concepts, Card↔Concept mappings with evidence, Concept↔Concept edges and graph statistics.

Configuration:

- `config/relation-config.yaml` — semantic candidate/model/scoring configuration.
- `config/relation-overrides.yaml` — human-owned Card↔Card pin/block/override decisions.
- `config/concept-config.yaml` — repository-owned Concept extraction and promoted Concept policy.

## Card ↔ Card semantic relations

The Phase 2 subsystem remains intact. It embeds selected public Card fields rather than the full Markdown file, using `Xenova/multilingual-e5-small` by default. Phase 1 taxonomy score remains an independent signal and is combined with normalized cosine similarity to form the LLM candidate pool.

Default relation types are:

- `similar_to`
- `alternative_to`
- `complements`
- `integrates_with`
- `depends_on`
- `extends`
- `contrasts_with`

`depends_on` and `extends` are directional. Canonical Card-ID ordering is used only for stable pair identity; `direction` is stored separately so ordering cannot erase subject/object semantics.

A generated relation retains inspectable evidence:

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

## LLM classifier and fallback

When the configured credential exists, high-value Card pairs can be classified through the OpenAI-compatible structured classifier. Accepted and rejected decisions are cached by candidate evidence/config hash.

External model availability is not a deployment dependency. If the API key is absent or a request fails:

- semantic candidate generation still runs;
- new candidates use conservative deterministic fallback;
- fallback publication has an independent score threshold and degree cap;
- fallback never invents directional `depends_on` / `extends` semantics;
- valid cached LLM decisions are preserved when their evidence is unchanged;
- CI, graph generation and Pages deployment continue.

## Human Card-relation overrides

`config/relation-overrides.yaml` remains human-owned. Precedence is:

```text
blocked
> human override / pinned
> LLM classification
> semantic fallback
```

Automation may read this file but must never rewrite it. Manual directional relations must state an explicit direction.

## Concept extraction

Phase 3 introduces deterministic Concept generation. It does not send ontology creation to an LLM by default.

Concepts come from three sources:

1. **Controlled Category Concepts** — every effective taxonomy Category becomes a canonical Concept.
2. **Shared Tag Concepts** — normalized Tags become Concepts only after appearing across the configured minimum number of Cards.
3. **Promoted Concepts** — curated higher-order abstractions in `config/concept-config.yaml`, matched deterministically against effective Categories/Tags.

Normalization uses Unicode NFKC plus case/punctuation canonicalization so superficial formatting variants do not become duplicate concepts. One-off implementation tags are intentionally pruned from the ontology unless they become shared or are deliberately promoted.

Promoted Concepts may express reusable abstractions such as `Agent Memory`, `Character Runtime`, `Coding Agent Tooling`, `Local AI Integration` or `Agent API Bridge`. Their matching rules may use only public repository data; private conversational context is forbidden.

Full Concept-generation details are documented in `docs/CONCEPTS.md`.

## Card ↔ Concept mappings

Every mapping retains evidence and a bounded strength:

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

This is an evidence edge rather than an opaque clustering label. Concept detail pages can therefore explain why each Knowledge Card supports a Concept.

## Concept ↔ Concept relations

Phase 3 currently generates one Concept relation type:

```text
co_occurs_with
```

Two Concepts are linked only when they co-occur across enough supporting Cards. Each edge records:

```text
support = number of shared Cards
weight  = support / min(source.card_count, target.card_count)
```

A support threshold and Concept degree cap keep the graph sparse. `co_occurs_with` is an association signal only; it must not be interpreted as causation, dependency, taxonomy hierarchy or `is_a` semantics.

Typed ontology relations such as `is_a`, `part_of` or `enables` require a future explicit contract rather than being inferred from co-occurrence.

## Website projection

Phase 3 exposes the same graph from three perspectives:

```text
/knowledge/<card-id>
    Card content
    + Card↔Card semantic relations
    + Concept Neighborhood

/concepts/<concept-id>
    Concept metadata
    + supporting Cards/evidence
    + related Concepts

/graph
    Concept-centric interactive graph
```

The `/graph` visualization unifies:

- Card↔Concept membership edges;
- Concept↔Concept co-occurrence edges;
- optional Phase 2 Card↔Card semantic edges.

The current SVG layout is deterministic presentation geometry. Visual distance does not represent embedding distance.

## Generated-data ownership

Generated indexes must never become the only source of truth for content or manual intent.

```text
Knowledge Cards + repository config + generator code
                    ↓
 embeddings.json / relations.json / concepts.json
```

Do not hand-edit generated JSON. Concept policy changes belong in `config/concept-config.yaml`; human Card-relation decisions belong in `config/relation-overrides.yaml`.

Concept IDs are public route identifiers under `/concepts/<id>` and should remain stable unless an intentional migration is performed.

## Commands

Incremental embeddings:

```bash
npm run embeddings:build
npm run embeddings:validate
```

Card↔Card relations:

```bash
npm run relations:build
npm run relations:build:semantic
npm run relations:validate
npm run relations:report
```

Concept Graph:

```bash
npm run concepts:build
npm run concepts:validate
```

Full semantic + Concept rebuild:

```bash
npm run relations:rebuild
```

## Automation

Relevant `main` changes run the **Update Knowledge Graph Indexes** workflow:

```text
incremental embeddings
→ semantic relations
→ Concept Graph
→ validations + tests
→ commit changed generated indexes
```

The weekly **Full Knowledge Graph Rebuild** regenerates every embedding, relation candidate/classification state and Concept graph to remove stale generated state.

PR CI and Pages deployment both build/validate Concepts before static-site generation. Concept extraction itself requires no external API key.

## Validation boundary

Phase 3 validates graph integrity rather than merely checking that JSON parses. In addition to the Phase 2 relation invariants, Concept validation checks unique stable IDs, valid Card/Concept references, mapping evidence and strength, supporting-card counts, duplicate/self Concept edges, relation support/weight and promoted-Concept config consistency.

The current Phase 3 boundary deliberately stops before full ontology reasoning. LLM-assisted Concept proposals, human approval queues, Concept merge/split migrations, semantic graph layout and typed hierarchical Concept relations belong to later graph evolution rather than being silently inferred now.
