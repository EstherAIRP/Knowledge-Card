# Runtime Prompt Changelog

本文件記錄 `prompts/RUNTIME.md` 的行為版本變更。

版本號建議採 Semantic Versioning：

- MAJOR：任務流程、資料責任或核心判定方式有不相容改動
- MINOR：新增來源類型、分析規則、分類策略或回覆能力
- PATCH：文字澄清、判定微調、不改變核心流程

---

## 1.0.0 — 2026-08-12

初版 Runtime Prompt。

### Added

- 定義裸 URL 為預設 ingestion trigger
- 定義執行前必讀文件與 Repository 規則來源
- 定義 URL canonicalization / deduplication 流程
- 定義 Knowledge Card analysis standard
- 定義 Category、Tags、Relevance、Action 判定規則
- 定義 existing-card update policy
- 定義 user-owned state 保護規則
- 定義 public safety boundary
- 定義 validation / push 流程
- 定義完成後的聊天回覆格式
- 定義 Runtime Prompt、AGENTS.md、Schema / Taxonomy 的責任邊界

### Current behavior

```text
URL
 → load latest runtime rules
 → resolve canonical source identity
 → create or update Knowledge Card
 → analyze / classify / score / recommend action
 → preserve user-owned state
 → validate
 → commit / push
 → GitHub Actions build
 → GitHub Pages deploy
 → report result
```

---

## Future entries

之後每次調整 `prompts/RUNTIME.md`，在此新增版本紀錄，例如：

```markdown
## 1.1.0 — YYYY-MM-DD

### Added
- 新增 paper-specific analysis rules

### Changed
- 調整 LEARN / WATCH 判定邏輯

### Fixed
- 修正某類來源的 ingestion 判斷
```
