# Threads Phase 7 — LLM-assisted Continuation Recovery

Phase 7 is a fallback for public Threads pages where the root post and nearby same-author replies are observable, but Threads does not expose enough `reply_to` / `root_post` relationship data to reconstruct the self-thread deterministically.

It does **not** replace Phase 3 structural reconstruction. The order of trust is:

```text
Phase 1 URL resolution
→ Phase 2 exact post extraction
→ Phase 3 structural graph + n/N validation
→ Phase 5 browser evidence
→ retry structural reconstruction
→ Phase 7 candidate recovery only when structure is still unavailable
→ deterministic acceptance gate
→ complete source or fail closed
```

## Why Phase 7 exists

A real public Threads page can expose this combination:

```text
root.has_replies = true
same-author rendered reply objects exist
reply.is_reply = true
reply.reply_to = null
reply.root_post = null
thread n/N is unavailable
```

Before Phase 7, a root-only graph could be misclassified as `SINGLE_POST` even though conversation coverage had not been proved. Phase 7 closes that false-positive path.

If a root reports replies and `conversation_coverage_complete !== true`, `SINGLE_POST` is no longer sufficient for formal ingestion. The source must either be structurally completed, be recovered through the high-confidence fallback below, or fail closed.

## Architecture

The implementation is intentionally split into layers:

```text
browser-adapter.mjs
  public evidence collection only
        ↓
conversation.mjs
  deterministic reply graph / root / n/N logic
        ↓
conversation-recovery.mjs
  orchestration and suspicious-single guard
        ↓
continuation-recovery.mjs
  candidate filtering, LLM ranker contract, acceptance gate
        ↓
source-ingestion.mjs
  Knowledge Card completeness / identity contract
```

The browser adapter does not decide which post is continuation text. The LLM ranker does not decide whether a source is accepted. Acceptance remains deterministic code.

## Candidate filtering

Only evidence already extracted from the public Threads page is eligible. Before any LLM call, candidates are narrowed using deterministic metadata.

Default rules:

- same author as the root;
- exclude the root itself;
- exclude posts published before the root when timestamps are known;
- reject explicit `is_reply: false` candidates by default;
- allow `is_reply: true` and unknown-reply candidates for ranking;
- keep at most 8 candidates;
- default time window is 24 hours after the root.

Time is evidence for narrowing and scoring, **not** proof of thread membership.

The metadata score currently rewards:

- explicit reply status;
- very small publication-time distance;
- presence of text;
- known reply-terminal metadata.

The first LLM-selected continuation must have metadata score `>= 0.60` by default.

## LLM ranker contract

The ranker receives the root and filtered candidates with text, timestamps, reply flags and time deltas. The prompt explicitly treats all post text as **untrusted quoted data**. Instructions contained inside a Threads post must never be followed as instructions to the ranker.

The model must return structured JSON conceptually equivalent to:

```json
{
  "selected_shortcodes": ["PART2"],
  "confidence": 0.98,
  "complete": true,
  "rationale": "The immediate reply fulfills an explicit promise in the root post.",
  "candidate_labels": [
    {"shortcode":"PART2","label":"continuation","confidence":0.99},
    {"shortcode":"LATER","label":"followup","confidence":0.96}
  ]
}
```

Allowed candidate labels are `continuation`, `followup`, `unrelated`, and `uncertain`.

The model is asked to distinguish the original article body from later corrections, casual follow-up comments, acknowledgements, and unrelated posts.

## Deterministic acceptance gate

An LLM response is accepted only if all required checks pass:

```text
judgement.complete == true
confidence >= 0.90
selected sequence is non-empty and unique
all selected shortcodes exist in captured evidence
all selected posts are from the root author
no selected post is explicitly non-reply
first selected candidate metadata score >= 0.60
selected timestamps do not move backwards
```

Failure of any check returns an incomplete source. There is no fallback to "nearest post by time".

Phase 7 is also forbidden from overriding stronger contradictory evidence. It does not resolve:

- conflicting `n/N` indicators;
- known missing parts when `N` is known;
- structural same-author branch ambiguity;
- source identity mismatch.

Those conditions remain fail closed.

## Result provenance

A structurally proven self-thread keeps:

```text
thread.status = COMPLETE_THREAD
analysis_input.thread_verification = structural
```

A Phase 7 accepted result is deliberately distinct:

```text
thread.status = INFERRED_THREAD_HIGH_CONFIDENCE
thread.verification = llm_assisted
thread.confidence = high
extraction.inferred = true
analysis_input.thread_verification = llm_assisted
```

The source also preserves the LLM confidence, short rationale, candidate labels, selected shortcodes, ranker metadata, ordered `parts[]`, and final `combined_text`.

This prevents an inferred relationship from being presented as if Threads itself supplied a verified parent/root graph.

## Ranker configuration

The core is provider-neutral. Tests and callers can inject:

```js
{
  continuationRanker: async ({ rootPost, candidates, prompt }) => ({
    selected_shortcodes: ['PART2'],
    confidence: 0.98,
    complete: true,
    rationale: '...',
    candidate_labels: []
  })
}
```

For runtime use, an OpenAI-compatible Chat Completions endpoint can be enabled with environment variables:

```text
THREADS_CONTINUATION_LLM_ENDPOINT=https://example/v1/chat/completions
THREADS_CONTINUATION_LLM_MODEL=<model-name>
THREADS_CONTINUATION_LLM_API_KEY=<optional bearer token>
```

or:

```text
THREADS_CONTINUATION_LLM_BASE_URL=https://example/v1
THREADS_CONTINUATION_LLM_MODEL=<model-name>
```

No LLM endpoint/model is hard-coded. If no injected ranker or environment configuration exists, Phase 7 reports the recovery as unavailable and the source remains incomplete.

## Example from the live acceptance case

The public root `DFyr62jB6Wr` was observed with `has_replies: true`. Browser evidence exposed multiple same-author posts but not native parent/root relationships.

The strongest continuation candidate was `DFysLsahhe_`:

```text
same author        yes
is_reply           true
root → candidate   +138 seconds
root discourse     says the spell is in a reply
candidate content  supplies the promised spell
```

Later same-author replies occurred hours later and read as follow-up clarification rather than original article body. This is exactly the class of case Phase 7 is intended to recover: strong public evidence, missing relationship fields, and a semantic decision that still must pass deterministic safety gates.

## Operational boundary

Phase 7 improves source recovery; it does not weaken Knowledge Card publication safeguards. A recovered source still must pass root canonical identity checks, create/update deduplication, normal Knowledge Card validation, user-owned-state preservation, and the Phase 6 accepted-snapshot policy.
