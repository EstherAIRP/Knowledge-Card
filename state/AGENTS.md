# AGENTS.md — Operational source state

This directory contains machine-owned operational state used to compare current public sources with previously accepted source versions. Repository-level `AGENTS.md` still applies.

## Source snapshots

Threads source snapshots live under `state/source-snapshots/threads/` and are written only through the source-state tooling.

Rules:

- A snapshot is an operational fingerprint, not a Knowledge Card and not user-owned classification state.
- Never store raw Threads body text, raw GraphQL payloads, login/session data, cookies, or private content here.
- Snapshots may store stable public provenance such as post IDs, shortcodes, canonical URLs, ordering metadata, timestamps, and SHA-256 fingerprints of normalized text/media/reference content.
- Volatile media query signatures must not create false content changes; fingerprint stable media identity instead.
- Do not advance a snapshot during preflight. Advance it only after the corresponding Knowledge Card exists and the create/update has passed repository validation.
- Failed, incomplete, ambiguous, or identity-mismatched Threads extraction must never overwrite the last accepted snapshot.
- An unchanged source must not rewrite the snapshot merely to refresh a timestamp.
- Deleting a snapshot resets change history for that source but must never delete or modify the Knowledge Card itself.
- Do not hand-edit snapshots to express user intent. User-owned state belongs in the Knowledge Card ownership fields and `## 使用者備註`.
