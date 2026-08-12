# AGENTS.md — Configuration ownership

Repository-level `AGENTS.md` still applies.

## `relation-overrides.yaml`

Treat this file as human-owned configuration.

- Automated relation rebuilds may read it but must not rewrite it.
- AI may edit it only when the user explicitly asks to pin, block, remove, or override a relation.
- `blocked` takes precedence over generated relations and manual pinned/override entries for the same Card pair.
- Supported Phase 2 relation types are `similar_to`, `alternative_to`, `complements`, `integrates_with`, `depends_on`, `extends`, and `contrasts_with`.
- Legacy `related` remains accepted for Phase 1/manual compatibility but should not be generated as a Phase 2 semantic type.
- `depends_on` and `extends` require explicit `direction: source_to_target` or `direction: target_to_source`.
- Other semantic relation types must use `direction: undirected` when a direction is supplied.

## `relation-config.yaml`

Treat this file as repository-owned algorithm configuration, not human override state and not generated state.

- It may define candidate thresholds, embedding provider/model, semantic normalization, classifier provider/model, scoring weights, and controlled relation types.
- Do not place API keys, tokens, or credentials in this file. Store credentials in environment variables / GitHub Secrets referenced by `api_key_env`.
- Threshold/model/provider changes are deliberate behavior changes and should be tested with `npm test`, `npm run embeddings:validate`, and `npm run relations:validate` after generated data is rebuilt.
- Do not silently add new relation types without updating validation, classifier schema/prompt, UI labels, documentation, and tests.

## `concept-config.yaml`

Treat this file as repository-owned Phase 3 ontology/extraction configuration.

- It defines deterministic Concept extraction from effective Categories, shared Tags, and curated higher-order `promoted_concepts`.
- A promoted concept is a reusable public technical abstraction, not a place to encode private user context or one-off project notes.
- Prefer stable Concept IDs. Changing an ID breaks historical graph routes and should be treated as a migration.
- `minimum_tag_support`, Concept relation support, and degree caps are algorithm behavior, not content facts.
- Do not place generated Card IDs or computed edge lists in this config merely to force graph output; generated membership belongs in `data/concepts.json`.
- When changing Concept rules, rebuild with `npm run concepts:build`, then run `npm run concepts:validate` and `npm test`.
- Avoid near-duplicate promoted concepts. Prefer extending matching aliases/signals for the existing canonical Concept.
