# Relation Index — Phase 2

Knowledge-Card 的 Relation Layer 由 Phase 1 的 metadata-only Card-to-Card matching，擴充為可增量更新的 semantic relation pipeline。`content/knowledge/**/*.md` 仍是 Knowledge Card 的內容 source of truth；embedding 與 relation index 都是可重建的 generated data。

## Architecture

```text
content/knowledge/**/*.md
        │
        ├─ effective categories / tags / relevance / actions
        │                │
        │                ▼
        │        taxonomy candidate score
        │
        └─ selected public Card content
                         │
                         ▼
              local multilingual embedding
                         │
                         ▼
                  semantic similarity
                         │
                 taxonomy + semantic
                         │
                     candidates
                         │
              ┌──────────┴──────────┐
              │                     │
        LLM available          LLM unavailable
              │                     │
       typed classifier       conservative fallback
              │                     │
              └──────────┬──────────┘
                         ▼
                 data/relations.json
                         ▲
                         │
          config/relation-overrides.yaml
                  human-owned
```

Generated files:

- `data/embeddings.json` — cached embedding vectors keyed by stable Card ID and content hash.
- `data/relations.json` — semantic candidates, classification cache, typed effective edges, score breakdown, reasons, and pipeline metadata.

Repository configuration:

- `config/relation-config.yaml` — algorithm/provider/model/threshold configuration.
- `config/relation-overrides.yaml` — human-owned pin/block/override decisions.

## Embedding input

`buildEmbeddingText()` intentionally does not embed the entire Markdown file. The semantic representation is built from public Card fields that describe technical meaning:

- title;
- summary;
- effective categories;
- effective tags;
- effective actions;
- effective relevance dimensions;
- `一句話介紹`;
- `核心概念`;
- `架構與技術`;
- `技術亮點`.

The default provider is local Transformers.js with `Xenova/multilingual-e5-small`. Card text is prefixed with `query:` before feature extraction and vectors are mean-pooled and normalized.

The default path does not require an external embedding API. An OpenAI-compatible embedding path remains configurable through `semantic.provider: openai-compatible` if a future deployment wants to switch providers.

## Incremental embedding cache

Every Card embedding stores:

```text
card_id
content_hash
provider
model
dimensions
embedding
```

`content_hash` includes the selected Card text, provider, and model. Ordinary runs reuse a vector when those inputs are unchanged. Only new or materially changed Card representations are re-embedded.

A full rebuild can be forced with:

```bash
npm run embeddings:build -- --full
```

The weekly rebuild uses this path so model/runtime changes that do not alter the Card content hash are eventually refreshed.

## Semantic score calibration

Phase 1 taxonomy score is retained as an independent signal. Phase 2 additionally computes cosine similarity from embeddings.

The default multilingual-E5 model produces cosine values in a relatively high range, so raw cosine is normalized before relation ranking:

```text
semantic_score = clamp(
  (raw_cosine - normalization_floor)
  / (normalization_ceiling - normalization_floor),
  0,
  1
)
```

Default calibration:

```yaml
normalization_floor: 0.70
normalization_ceiling: 0.95
```

Candidate ranking then uses:

```text
combined_score
= taxonomy_score × 0.40
+ semantic_score × 0.60
```

The exact values are configuration, not schema. Adjust them through `config/relation-config.yaml`, not by hardcoding thresholds inside UI code.

## Candidate generation

The pipeline does not send every possible `N × N` pair to an LLM.

It first calculates deterministic taxonomy and semantic scores, applies minimum signal gates, then caps candidate degree with `candidate.top_k`.

```text
all Card pairs
    ↓
taxonomy + embedding similarity
    ↓
minimum signal / combined-score gates
    ↓
Top-K candidate graph
    ↓
LLM classifier only for highest-value candidates
```

This keeps model calls proportional to useful candidates rather than total pair count.

## Relation classifier

When the configured API credential is present, `npm run relations:build:semantic` uses the OpenAI-compatible classifier configured in `relation-config.yaml`.

The classifier must return structured JSON with:

```json
{
  "related": true,
  "type": "complements",
  "direction": "undirected",
  "confidence": 0.87,
  "reason": "..."
}
```

Allowed Phase 2 types:

- `similar_to`
- `alternative_to`
- `complements`
- `integrates_with`
- `depends_on`
- `extends`
- `contrasts_with`

Legacy `related` remains accepted only for Phase 1/manual compatibility. Automatic Phase 2 classification should use the more specific types above.

### Direction

Most relation types are undirected. `depends_on` and `extends` are directional and must record one of:

- `source_to_target`
- `target_to_source`

Edges still use canonical Card-ID ordering for stable pair identity. Direction is stored separately so canonicalization cannot erase semantics.

## Score model

A Phase 2 relation retains independent evidence instead of only a final magic score:

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

`taxonomy`, normalized `semantic`, raw cosine, LLM confidence, and pre-classifier combined score remain inspectable for tuning and debugging.

## Fallback behavior

External model availability must not become a deployment dependency.

If the LLM API key is absent or a classifier request fails:

- semantic candidates are still available;
- new candidates receive a conservative heuristic `similar_to` or `complements` classification;
- existing valid LLM classifications are preserved when possible;
- a full rebuild without an API key does not intentionally downgrade cached LLM decisions;
- relation validation, VitePress build, and deployment can continue.

This fallback is deliberately conservative. It must not infer directional `depends_on` / `extends` relationships without LLM or human evidence.

## Classification cache

`data/relations.json` includes a `classifications` map keyed by canonical Card pair. Each item stores a `candidate_hash` derived from the two Card embedding content hashes, semantic/taxonomy scores, configured classifier model, and relation contract.

If the candidate hash is unchanged, a prior valid classification can be reused. If a Card or relation configuration materially changes, only affected candidates need classification again.

Rejected LLM pairs (`related: false`) are cached as well so they are not repeatedly sent to the classifier while their evidence is unchanged.

## Human overrides

`config/relation-overrides.yaml` remains human-owned.

Supported operations:

- `blocked` — remove a relation.
- `overrides` — replace generated relation metadata or create a manual relation.
- `pinned` — guarantee a relation exists unless blocked.

Precedence:

```text
blocked
> human override / pinned
> LLM classification
> semantic fallback
```

For `depends_on` or `extends`, a manual entry must explicitly include `direction`. If canonical Card sorting reverses the supplied ID order, the generator flips the stored direction so the author's intended subject/object relationship remains correct.

Automated jobs must never rewrite `relation-overrides.yaml`.

## Commands

Build/update embeddings incrementally:

```bash
npm run embeddings:build
```

Validate embedding coverage and dimensions:

```bash
npm run embeddings:validate
```

Build relations using all currently available generated data without requiring an external classifier:

```bash
npm run relations:build
```

Build semantic relations and request LLM classification when the configured API key exists:

```bash
npm run relations:build:semantic
```

Validate the relation/config/classifier contract:

```bash
npm run relations:validate
```

Force a full embedding and relation rebuild:

```bash
npm run relations:rebuild
```

## Automation

### Incremental update

`.github/workflows/update-relations.yml` runs when Cards, relation configuration, overrides, model/generator code, or package dependencies change on `main`.

```text
changed Card/config/code
        ↓
incremental embedding build
        ↓
embedding validation
        ↓
semantic candidate generation
        ↓
LLM classification if OPENAI_API_KEY exists
        ↓
relation validation + tests
        ↓
commit embeddings.json + relations.json if changed
```

Generated data paths are excluded from the workflow trigger, so the bot's own index commit does not create an infinite loop.

### Weekly full rebuild

`.github/workflows/rebuild-relations.yml` runs weekly and is also manually dispatchable.

Its purpose is to:

- rebuild every embedding;
- recalculate every candidate;
- reclassify candidates when an LLM credential is available;
- remove stale generated relations;
- restore consistency after model/config/runtime changes.

### Validation and deployment

PR validation and GitHub Pages builds construct local embeddings and semantic relations before VitePress build. They do not require an LLM API key. If committed high-quality LLM classifications remain current, ordinary non-classifying builds reuse them.

## Website projection

The detail-page route projects each edge into the current Card's perspective and exposes:

- relation type;
- direction/perspective;
- final score;
- taxonomy/semantic/LLM score breakdown;
- classifier confidence;
- Traditional-Chinese reason;
- supporting metadata signals;
- human override state.

`KnowledgeRelations.vue` renders these fields in Related Knowledge. Directional edges are phrased relative to the current Card, for example `Depends on` versus `Depended on by`.

## Phase boundary

Phase 2 intentionally does not create Concept nodes or a full knowledge graph ontology. The next relation phase may add:

- `data/concepts.json`;
- concept extraction/canonicalization;
- Card ↔ Concept mapping;
- Concept pages;
- `/graph` visualization;
- knowledge lint for orphan/duplicate/stale concepts.

Those belong to Relation Phase 3.
