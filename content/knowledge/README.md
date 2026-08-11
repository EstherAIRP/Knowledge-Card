# Knowledge content

This directory contains real Knowledge Cards and is the content source of truth for the future website.

## Layout

```text
content/knowledge/
├── README.md
├── 2026/
│   ├── github-owner-project.md
│   └── article-example-topic.md
└── 2027/
    └── ...
```

A card stays in the year directory in which it was first created. Routine source updates must not move the file to a new year.

## Rules

- One canonical source maps to one Knowledge Card.
- Search existing `source.identity` and `canonical_url` values before creating a new card.
- New cards must conform to `schema/knowledge-card.schema.json`.
- Use only controlled taxonomy values from `config/taxonomy.yaml`.
- Preserve all user-owned overrides and the `## 使用者備註` section during refreshes.
- Personalized public analysis may use only `profile/public-profile.yaml`.
- Do not copy entire source articles or repositories into cards; store the source URL plus original summary and analysis.

See `AGENTS.md` for the complete ingestion and update protocol, and `templates/knowledge-card.example.md` for an authoring example.
