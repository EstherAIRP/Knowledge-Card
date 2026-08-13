# Runtime Prompt Changelog

本文件記錄 `prompts/RUNTIME.md` 的行為版本變更。版本號採 Semantic Versioning：MAJOR 為不相容流程改動、MINOR 為新增來源/能力、PATCH 為不改核心流程的澄清。

---

## 1.7.1 — 2026-08-13

### Clarified

- 新增 URL provider routing hard gate：`threads.com` / `threads.net`（含子網域）與解析後 primary resource 落在 Threads 的 transient URL，一律走 Threads Phase 1–7；其他 URL 一律走 non-Threads generic/provider flow。
- 明確規定 Threads 與非 Threads ingestion 互斥，不得把 Threads 當普通 article 只分析分享當下單篇，也不得對一般 URL 啟動 Threads Browser、conversation reconstruction、continuation ranker 或 Threads source snapshot。
- `AGENTS.md`、`docs/INGESTION.md`、`docs/THREADS_INGESTION.md` 同步加入相同 routing table / scope，讓裸 URL ingestion 的入口判斷一致。
- 明確規定一般文章即使正文提到或連到 Threads，也不因此切換 provider route；只有 primary resource 本身解析到 Threads 才走 Threads 流程。

---

## 1.7.0 — 2026-08-13

### Added

- 新增 Threads Phase 7 LLM-assisted continuation recovery。
- 新增 deterministic continuation candidate filter：同作者、root 之後、reply/unknown-reply、限定時間窗與候選數量。
- 新增 provider-neutral `continuationRanker` injection contract，以及 opt-in OpenAI-compatible HTTP ranker：`THREADS_CONTINUATION_LLM_ENDPOINT` / `THREADS_CONTINUATION_LLM_BASE_URL`、`THREADS_CONTINUATION_LLM_MODEL`、可選 API key。
- 新增 structured LLM judgement contract：`selected_shortcodes`、`confidence`、`complete`、`rationale`、candidate labels。
- 新增 deterministic acceptance gate：預設 LLM confidence >= 0.90、metadata evidence >= 0.60、同作者、evidence membership、reply constraint、chronological order。
- 新增 `INFERRED_THREAD_HIGH_CONFIDENCE` 與 `thread.verification = llm_assisted`，保留 inference provenance，與原生 `COMPLETE_THREAD` 明確區分。
- 新增 continuation recovery unit tests，涵蓋 live case 型態的 +138 秒同作者 reply、later follow-up 排除、低信心拒絕與 OpenAI-compatible adapter mock。

### Changed

- mandatory Threads ingestion 改經 recovery orchestration layer：strict structural graph 仍優先，只有 coverage 無法由 parent/root metadata 證明時才考慮 LLM-assisted recovery。
- 修正 live test 發現的 false positive：root `has_replies: true` 且 `conversation_coverage_complete !== true` 時，不得直接以 `SINGLE_POST` 通過正式 ingestion。
- `analysis_input` 額外暴露 `thread_verification`，讓 agent 可區分 structural 與 `llm_assisted` source。

### Safety

- LLM 不得覆蓋既有 `n/N` conflict、known missing parts 或 structural same-author branch ambiguity。
- Threads post text 在 ranker prompt 中被視為 untrusted quoted data；不得執行貼文內指令。
- LLM 未設定、低於門檻、候選 evidence 過弱、sequence 不合法或 ranker failure 時維持 `INCOMPLETE_THREAD` / fail closed。
- 不允許純時間距離直接成為正式 source；時間只作 candidate narrowing / metadata evidence。

---

## 1.6.0 — 2026-08-13

### Added

- 新增 Threads Phase 6 accepted source snapshot / change detection。
- `ingest:resolve` 在完整 source reconstruction 後比較上一次 accepted snapshot，輸出 `source_change`。
- 新增 `FIRST_SEEN`、`UNCHANGED`、`THREAD_EXTENDED`、`PART_CHANGED`、`PART_REMOVED`、`STRUCTURE_CHANGED`、`MULTIPLE_CHANGES` 狀態與 added/removed/changed part evidence。
- 新增 SHA-256 source / part fingerprints；snapshot 只保存 public provenance 與 hashes，不保存 Threads 原文或 raw GraphQL payload。
- 新增 `npm run ingest:snapshot -- <Threads URL>`，只在 matching Knowledge Card 已存在後推進 accepted baseline。
- 新增 `state/AGENTS.md`，定義 machine-owned source state 與 user-owned state 的隔離規則。
- 新增 source-state tests，涵蓋 deterministic hashing、volatile media query suppression、thread extension、part edit/removal、snapshot no-op 與 mandatory preflight change reporting。

### Changed

- Threads update flow 會使用 `source_change` 區分 material source change 與普通 re-check；`UNCHANGED` 不應製造 noisy analysis/update log。
- Snapshot preflight 保持 read-only；只有 Card create/update 通過 validation 後才允許執行 `ingest:snapshot`。
- Snapshot hash 未變時不重寫檔案，也不刷新 `captured_at`。

### Safety

- incomplete / ambiguous / identity-mismatched / extraction-failed Threads source 不得覆蓋 accepted snapshot。
- Meta CDN media query signatures 視為 volatile transport metadata，不單獨構成 source change。

---

## 1.5.0 — 2026-08-13

### Added

- 新增 Threads Phase 5 Playwright browser / web-data fallback。
- public HTTP / hydration extraction 不足時，可用 headless browser 解析 JS-only `/share/*` / `/t/*` navigation。
- Browser adapter 擷取 render 後 DOM hydration，以及 Threads same-origin JSON / GraphQL responses，再交回既有 post normalizer / reply graph。
- 新增 browser session isolation：不讀取登入 session、cookies 或 user profile；只處理公開 Threads URL。
- 新增 `npm run threads:browser:install` 安裝 Playwright Chromium。
- 支援 `THREADS_BROWSER_EXECUTABLE` 與 `THREADS_BROWSER_CHANNEL`，可使用既有 browser executable / Chrome channel。
- 新增 browser fixture tests，涵蓋 GraphQL capture、rendered `n/N`、JS-only share resolution、sparse HTML conversation completion 與 unsafe redirect rejection。

### Changed

- 一般 live Threads ingestion 會在既有 HTTP / HTML 路徑不足時自動啟用 browser fallback；custom `fetchImpl` / fixture 預設維持 deterministic，除非明確要求 browser fallback。
- Browser 成功載入頁面不等於來源完整；Phase 3 的 `n/N`、reply graph、root identity 與 fail-closed contract 仍是唯一完整性判定標準。

### Failure modes

- `THREADS_BROWSER_UNAVAILABLE`：Playwright 套件不可用。
- `THREADS_BROWSER_LAUNCH_FAILED`：找不到可啟動的 Chromium / Chrome。
- `THREADS_BROWSER_NAVIGATION_FAILED`：Threads 頁面導覽失敗。
- `THREADS_BROWSER_UNSAFE_REDIRECT`：browser 最終導覽離開 Threads host。
- `THREADS_BROWSER_NO_POSTS`：頁面已 render，但 DOM / captured JSON 仍找不到可驗證 post object。

---

## 1.4.0 — 2026-08-13

### Added

- 新增 Threads Phase 4 Knowledge Card integration。
- mandatory `npm run ingest:resolve -- <Threads URL>` 會在 create/update 判定前完成 Phase 1–3 的完整 conversation extraction。
- resolver 成功時輸出完整 `source_document` 與 `analysis_input`，其中正式文章文字為 `source_document.combined_text`。
- 新增 extracted source identity consistency check，要求 root canonical URL 與 `threads:{root_shortcode}` identity 一致。
- 新增 Threads integration tests：middle-part share → root identity、existing-card dedup、incomplete-thread rejection、identity mismatch rejection、non-Threads backward compatibility。

### Changed

- Threads create/update 判定不再使用 Phase 1 得到的 middle/last canonical post，而使用 Phase 3 完整重建後的 root canonical URL。
- `ingest:resolve` 現在是 Threads 完整性 gate；只有 `thread.complete` 與 `conversation_complete` 同時為 true 才會回傳正式 create/update contract。
- `ingest:extract` 的 ingestion resolution 也會驗證 extracted source identity，而不是只信任 URL。

### Boundary

- Core repository 仍不內建 Playwright/Chromium；若 public HTML 無法提供完整 conversation，需要由後續 browser/GraphQL adapter 實作補足，否則會安全 fail closed。

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

- 新增 Threads Phase 2 normalized single-post extraction 與 `npm run ingest:extract -- <URL>`。
- public HTML embedded JSON 遞迴尋找 canonical shortcode，保存 text、author、timestamp、media、reply/root metadata、quoted/reposted post 與 extraction method。
- 預留 API adapter / browser extractor fallback，且 fallback 必須與預期 shortcode 一致。

### Changed

- Threads ingestion 區分 URL resolution 與 source extraction；single-post output 明確標示 `conversation_complete: false`。

---

## 1.1.0 — 2026-08-13

### Added

- 新增 transient/share/short URL external resolution。
- 新增 Threads `/share/*`、`/t/*`、`@user/post/*` URL 辨識與 HTTP redirect / HTML canonical / embedded URL 解析。
- 定義 browser resolver fallback 介面。

### Changed

- `ingest:resolve` 先執行 source-specific external URL resolution；Threads share URL 不得直接成為正式 identity。

---

## 1.0.0 — 2026-08-12

初版 Runtime Prompt：定義裸 URL ingestion、必讀文件、canonicalization/dedup、analysis、分類與 relevance/action、user-owned state、public safety、validation/push 與完成回覆契約。
