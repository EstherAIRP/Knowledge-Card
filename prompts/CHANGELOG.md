# Runtime Prompt Changelog

本文件記錄 `prompts/RUNTIME.md` 的行為版本變更。

版本號建議採 Semantic Versioning：

- MAJOR：任務流程、資料責任或核心判定方式有不相容改動
- MINOR：新增來源類型、分析規則、分類策略或回覆能力
- PATCH：文字澄清、判定微調、不改變核心流程

---

## 1.3.0 — 2026-08-13

### Added

- 新增 Threads Phase 3 conversation reconstruction。
- 從 embedded JSON / conversation adapter 建立 reply graph，支援由任意 part 回溯 root。
- 只沿同作者、直接 `replied_to`、同 root 的 self-thread chain 合併正文；同作者分支無法唯一判定時 fail closed。
- 新增 Threads UI / adapter `n/N` indicator 解析與完整性驗證。
- normalized conversation 保存 `parts[]`、`combined_text`、root metadata、input index、thread status / total / confidence。
- 新增 API conversation 與 browser conversation adapter fallback 介面。
- Threads canonical post identity 改為 `threads:{shortcode}`，Phase 3 完整重建後以 root shortcode 作最終 source identity。

### Changed

- `npm run ingest:extract -- <Threads URL>` 預設由單篇 extractor 升級為完整 conversation extractor；只有 `thread.complete: true` 才可作正式 ingestion source。
- Threads share URL、root/middle/last part 在完整重建後都以 root canonical URL 進入 create/update 判定。
- extraction CLI 額外輸出 root canonical URL 對應的 ingestion resolution。

### Failure modes

- `THREADS_CONVERSATION_INCOMPLETE`：已知或推定是串文，但未取得完整 parts。
- `THREADS_CONVERSATION_AMBIGUOUS`：同作者 branch 或 indicator 衝突，無法安全決定正文鏈。

---

## 1.2.0 — 2026-08-13

### Added

- 新增 Threads Phase 2 normalized single-post extraction。
- 新增 `npm run ingest:extract -- <URL>` source extraction CLI。
- public HTML embedded JSON 會遞迴尋找與 canonical shortcode 相符的 post object。
- normalized post 保存 text、author、timestamp、media、reply/root metadata、quoted/reposted post、link attachment 與 extraction method。
- 預留 API adapter 與 browser extractor fallback，不綁定特定 OAuth 或 headless browser 套件。
- fallback 結果必須與預期 shortcode 一致，避免誤抓同頁其他貼文或引用內容。

### Changed

- Threads ingestion 現在區分 URL resolution 與 source extraction 兩層。
- normalized output 明確標示 `single_post_complete: true` 與 `conversation_complete: false`，避免把單篇擷取誤當完整 self-thread。

### Boundary

- Phase 2 尚未重建 `1/N → N/N` author chain，也尚未利用 UI `n/N`、conversation graph 或 root-level identity 驗證完整串文；這些工作留給 Phase 3。

---

## 1.1.0 — 2026-08-13

### Added

- 新增 transient / share / short URL 的 external resolution 階段。
- 新增 Threads `/share/*`、`/t/*`、`@user/post/*` URL 辨識規則。
- Threads share URL 可透過 HTTP redirect、HTML canonical / embedded URL 解析 canonical post。
- 定義 browser resolver fallback 介面，供 HTTP 解析失敗時接入 headless browser。

### Changed

- `npm run ingest:resolve -- <URL>` 會先執行 source-specific external URL resolution，再進入既有 canonicalization / deduplication。
- Threads share URL 不得直接成為 Knowledge Card 的正式 `canonical_url` 或 source identity。

### Boundary

- 此版本只完成 Threads Phase 1 URL resolution；完整 self-thread / conversation 擷取、`n/N` 完整性驗證與 root-level identity 尚未納入本階段。

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

之後每次調整 `prompts/RUNTIME.md`，在此新增版本紀錄。
