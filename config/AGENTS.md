# AGENTS.md — Configuration ownership

Repository-level `AGENTS.md` still applies.

For `relation-overrides.yaml` specifically:

- Treat the file as human-owned configuration.
- Automated relation rebuilds may read it but must not rewrite it.
- AI may edit it only when the user explicitly asks to pin, block, remove, or override a relation.
- `blocked` takes precedence over generated relations and manual pinned/override entries for the same Card pair.
- Phase 1 relation types are limited to `related` and `similar_to`.
