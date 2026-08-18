# Runtime Prompt Changelog

本文件記錄 `prompts/RUNTIME.md` 的行為版本變更。版本號採 Semantic Versioning：MAJOR 為不相容流程改動、MINOR 為新增來源/能力、PATCH 為不改核心流程的澄清。

---

## 1.12.1 — 2026-08-18

### Clarified

- 完成 Knowledge Card 文件重構 Phase 2：將 `prompts/RUNTIME.md` 收斂為 runtime orchestration contract，只保留 task trigger、mandatory preflight、provider-route hard gate、execution/source failure separation、accepted-source requirement、analysis/update/public-safety、validation 與 completion report。
- 將 root `AGENTS.md` 收斂為 Repository engineering / ownership / write / validation / commit contract，不再重複 provider-specific extraction、Threads Phase 7 gate、Remote Ingest payload、Copilot permissions/model profile 或 taxonomy enum 清單。
- Detailed generic ingestion / execution contract 明確由 `docs/INGESTION.md` 承擔；Threads source semantics / completeness 由 `docs/THREADS_INGESTION.md` 承擔；workflow 與 trusted scripts 保持 executable authority。
- Runtime / AGENTS 新增 `docs/DOCUMENTATION.md` 與 `docs/AUTHORITY_MAP.md` 交叉索引，並加入「global rule files 不複製 domain-specific algorithms」的文件治理規則。

### Behavior

- 本版不改變 ingestion route、RemoteBackend、Threads Phase 1–7、Phase 8B/8C/8D、semantic judgement、acceptance threshold、source identity、snapshot、Schema、Taxonomy、public profile 或 user-owned state 行為。
- Runtime Prompt 升至 `1.12.1`，屬文件責任與規則索引澄清的 PATCH 版本。

---

## 1.12.0 — 2026-08-15

### Added

- 實作 Phase 8D Agent-mediated Semantic Handoff，作為 Phase 8C managed ranker 被 organization policy / auth / provider capability 阻擋時的正式 fallback。
- 新增 `scripts/lib/execution/semantic-handoff.mjs`：建立 public root/candidate evidence、SHA-256 digest、capture-only ranker、handoff request validation 與 digest-bound agent ranker。
- Remote Ingest schema v1 / `operation=resolve` 保持相容；第二階段可選擇加入 `semantic_handoff`，內容只能是 `knowledge_card_agent` producer、evidence digest 與 Phase 7 structured judgement。
- Remote runner 升級 `remote-ingest-v4`。Managed semantic backend unavailable 時會嘗試產生 `failure.semantic_handoff`；收到 handoff judgement 時會重新擷取來源、重建候選並驗證 digest。
- 新增 semantic-handoff tests，涵蓋 stable digest、trusted producer、bounded judgement、capture-only evidence、fresh-evidence binding 與 mismatch rejection。

### Safety

- Handoff request 不得提供 source evidence；trusted runner 永遠以 live re-extraction 的 root/candidates 為準。
- Evidence digest 不一致時回 `THREADS_CONTINUATION_HANDOFF_EVIDENCE_MISMATCH` 並 fail closed，禁止 stale judgement 套用到變更後來源。
- Agent judgement 仍必須通過既有 Phase 7 deterministic gate；不得覆蓋 `n/N`、known missing parts、structural ambiguity、candidate membership、metadata threshold、chronology、confidence 或 root-only complete-label coverage。
- Accepted provenance 保留 `thread.verification = llm_assisted`，ranker 標示 `agent_semantic_handoff / knowledge_card_agent` + evidence digest，不冒充 native Threads graph verification。

### Changed

- Package version 升至 `0.17.0`；Runtime Prompt 升至 `1.12.0`。
- Phase 8C Copilot CLI 仍是 Remote Ingest 第一順位 managed ranker；Phase 8D 只在 managed semantic backend 無法執行時提供第二條可驗證路徑。

---

## 1.11.2 — 2026-08-15

### Fixed

- Phase 8C live acceptance 證實 organization-owned `GITHUB_TOKEN` 可成功進入 Copilot CLI，但目前 Repository 所屬組織 policy 回 `Access denied by policy settings`。新增 `THREADS_CONTINUATION_COPILOT_POLICY_DENIED`，不再把這種 managed-backend activation failure 誤判成 Threads `SOURCE_INCOMPLETE`。
- `classifyIngestionFailure()` 會檢查 remote direct/nested Copilot capability error；policy/auth/CLI/timeout/output/invalid-response 等 managed execution failure 統一分類為 `REMOTE_EXECUTION_UNAVAILABLE`。只有 semantic judgement 真正完成後仍未通過來源 deterministic gate，才維持 `SOURCE_INCOMPLETE`。
- 移除 managed ranker 對 `gpt-5.2` 的固定依賴，改用 Copilot CLI `--model=auto`，避免模型 deprecated / organization model policy 變更再次讓 Harness 失效。

### Changed

- Managed model provenance / execution metadata 由 `gpt-5.2` 改為 selector `auto`。`auto` 只表示 Repository 交給 Copilot CLI 自動選擇目前可用且允許的模型；Harness 不宣稱知道 CLI 內部實際選到的模型。
- Phase 8C tests 新增 `--model=auto`、policy-denial diagnostic 與 remote failure classification regression coverage。
- Package version 升至 `0.16.2`；Runtime Prompt 升至 `1.11.2`。

### Activation boundary

- Phase 8C code、workflow、browser、Copilot CLI 安裝、isolated custom agent、artifact/cleanup pipeline 都已可執行；若 organization policy 尚未允許 Copilot CLI billed to the organization，Remote Ingest 會安全回 `REMOTE_EXECUTION_UNAVAILABLE / THREADS_CONTINUATION_COPILOT_POLICY_DENIED`，不建立/更新 Card，也不推進 snapshot。
- 開啟 organization Copilot CLI policy 後，仍必須由 live acceptance 驗證實際 semantic judgement 與 Phase 7 deterministic gate；policy 開啟本身不等於來源自動通過。

---

## 1.11.1 — 2026-08-15

### Fixed

- Phase 8C live acceptance 證實原先 GitHub Models managed provider 已無法使用：API 回 `HTTP 410`。移除 `github-models-ranker.mjs` 與對應 tests，Remote Ingest 不再依賴 GitHub Models。
- Managed provider 改為 GitHub Copilot CLI，新增 `scripts/lib/execution/copilot-cli-ranker.mjs` 與 trusted `.github/agents/threads-continuation-ranker.agent.md`。
- 修正 Remote Ingest 的 Knowledge Card content root：不再以 workflow workspace cwd 的 `content/knowledge` 推導，而改以 trusted runner script 所在 Repository 的 `../content/knowledge/` 作準，避免 remote dedup/update lookup 指到錯誤路徑。
- Execution failure envelope 保留安全的 direct nested `cause_code` / `cause_message`，讓 managed ranker 的 auth/policy/model/CLI failure 可診斷，同時保留外層 provider completeness classification。

### Changed

- Remote `resolve` job 改為 least privilege：`contents: read` + `copilot-requests: write`；Temporary request branch 刪除拆成獨立 `cleanup` job，只有 cleanup job 取得 `contents: write`。
- Remote workflow 安裝 `@github/copilot`，managed ranker 使用 `gpt-5.2`、`--agent=threads-continuation-ranker`、`--model=gpt-5.2`、`-s`、`--no-ask-user`。
- Remote runner 升級為 `remote-ingest-v3`，managed provenance 改為 `github_copilot_cli / github_copilot / gpt-5.2 / threads-continuation-ranker`。
- Package version 升至 `0.16.1`；Runtime Prompt 升至 `1.11.1`。

### Safety

- Copilot semantic classifier 在 ephemeral workspace 執行，使用 isolated `HOME` / `COPILOT_HOME`，只複製 trusted custom-agent profile；agent 設定 `tools: []`，不得使用 shell、file、URL、GitHub、MCP、memory 或其他工具。
- `GITHUB_TOKEN` 僅注入 mandatory-preflight step；Copilot child 只收到 `COPILOT_GITHUB_TOKEN` 與明確白名單 runtime env，不轉送任意 workflow secrets/env。
- Request branch 仍只能提供 URL request data，不能指定 model、agent、prompt、token、tool policy 或 executable ranker code。
- Phase 7 deterministic candidate filter / `n/N` / structural ambiguity / metadata evidence / confidence / chronology / root-only label coverage 全部不變；CLI/auth/policy/model failure、invalid JSON 或低信心 judgement 仍 fail closed，不得退化成時間猜測。

---

## 1.11.0 — 2026-08-15

### Added

- 實作 Phase 8C managed Threads continuation ranker，讓永久 `Remote Ingest` 在 GitHub Actions 上能直接執行 Phase 7 semantic continuation / root-only recovery。
- 新增 `scripts/lib/execution/github-models-ranker.mjs`，以 GitHub Models 作 repository-managed provider，預設 endpoint `https://models.github.ai/inference/chat/completions`、model `openai/gpt-4.1`。
- Remote Ingest workflow 新增 `models: read` 權限，使用該次 workflow 的 `GITHUB_TOKEN`，不需要額外 OpenAI API secret。
- Managed adapter 強制 `response_format = json_object`、保留既有 `temperature = 0`，並保存 `github_models_chat / github_models / model` ranker provenance。
- Remote runner 升級為 `remote-ingest-v2`，會把 managed ranker 直接注入 `prepareExternalIngestion(..., { continuationRanker })`。
- 新增 managed-ranker unit tests，驗證 token gate、GitHub Models endpoint/auth header、JSON mode、model 與 provenance。

### Changed

- Phase 8B 的 browser-capable remote environment 現在同時具備 managed Phase 7 semantic ranker；`continuation_recovery_ranker_unavailable` 不再是正常 Remote Ingest 的預期終點。
- Request branch 仍只傳 URL request data，不能指定 model endpoint、token、prompt 或 ranker implementation；managed provider configuration 只由 trusted `main` harness/workflow 控制。
- Local Phase 7 保持 provider-neutral，可繼續使用 injected `continuationRanker` 或既有 OpenAI-compatible environment configuration。
- Package version 升至 `0.16.0`；Runtime Prompt 升至 `1.11.0`。

### Safety

- `GITHUB_TOKEN` 只注入 remote mandatory-preflight step，不保存至 request branch、artifact、Card、snapshot 或 log output。
- GitHub Models judgement 仍不是 source of truth；`n/N` conflict、known missing parts、structural ambiguity、candidate filter、metadata evidence、confidence threshold、chronology 與 root-only label coverage 全部維持 deterministic gate。
- Managed ranker auth、quota、service/model error 或任何低信心/不完整 judgement 仍 fail closed，不得退化成純時間猜測。

---

## 1.10.0 — 2026-08-15

### Added

- 實作 Phase 8B execution harness：新增 `npm run ingest:dispatch -- <URL>`、LocalBackend、RemoteBackend request/result contract 與統一 execution envelope。
- 新增永久 `.github/workflows/remote-ingest.yml`，使用 `runtime/ingest/{request_id}` temporary request branch 觸發 remote mandatory preflight。
- Remote runner 固定從 `main` checkout trusted harness code，request branch 只以 sparse checkout 載入 `.runtime/requests/*.json` 作 data input，避免執行 request branch 上的任意程式碼。
- 新增 request schema v1：`schema_version`、`request_id`、`operation=resolve`、absolute HTTP(S) `url`。
- 新增 artifact result protocol：`remote-ingest-{request_id}` / `remote-ingest-result.json`，retention 1 day；result envelope 保留 backend/status/failure classification 與完整 resolver result。
- Remote runner 安裝 Node 24、Repository dependencies 與 Playwright Chromium，讓 local shell/network/browser capability 不足時有正式 browser-capable execution location。
- 新增 execution harness tests，涵蓋 request validation、local capability classification、remote plan identity 與 request/result correlation。

### Changed

- 普通 URL ingestion 的推薦入口由直接 `ingest:resolve` 提升為 `ingest:dispatch`；`ingest:resolve` 保留為 approved backend 內部 mandatory resolver 與 debug/test command。
- Dispatcher local success 時以 envelope `result` 回傳既有 resolver contract；local capability failure 時以 exit code 75 + `REMOTE_EXECUTION_REQUIRED` 輸出正式 remote handoff plan。
- `Validate Knowledge Radar` 不再對 `runtime/ingest/**` operational request branches執行完整 repository validation，避免 remote request 同時觸發不必要的 build pipeline。
- `AGENTS.md`、`docs/INGESTION.md`、`docs/THREADS_INGESTION.md` 同步 Remote Ingest request branch / artifact consumption protocol。

### Safety

- Remote workflow 執行的程式碼只來自 `main`；temporary request branch 不得修改 source/workflow/Card/state，且不允許合併到 `main`。
- Remote request operation 目前只允許 `resolve`；URL 僅允許 absolute HTTP(S)，不得將 request 內容當 shell command 執行。
- 完整 source result 不 commit 到 Repository，也不 dump 到 workflow logs；只保存於 1-day Actions artifact。
- Workflow 結束後會嘗試刪除 `runtime/ingest/**` temporary branch。
- RemoteBackend 只改變 execution location，不降低 provider completeness、identity、ownership 或 public-safety gate。

### Boundary

- Phase 8B 提供 permanent browser-capable RemoteBackend，但尚未提供 managed Phase 7 LLM provider/secrets。需要 semantic continuation/root-only recovery 的 Threads source 若 remote ranker 未設定，仍 fail closed；managed ranker 留給 Phase 8C。
- Alias persistence / share-token identity cache 尚未在本階段新增。

---

## 1.9.0 — 2026-08-15

### Added

- 新增 Phase 8A execution-backend contract，正式分離 provider routing 與 execution routing。
- 新增核心規則：`execution/runtime failure != source unavailable`。當前 session 缺 shell、Node/npm、outbound network、Playwright/Chromium 或必要 model endpoint 時，不得直接把來源判定為 `SOURCE_UNAVAILABLE`。
- 定義 backend 嘗試順序：Local execution backend → Repository-defined remote execution backend → existing alias / accepted snapshot lookup（僅 identity/history 輔助）。
- 新增 failure vocabulary：`LOCAL_EXECUTION_UNAVAILABLE`、`REMOTE_EXECUTION_UNAVAILABLE`、`SOURCE_EXTRACTION_FAILED`、`SOURCE_INCOMPLETE`、`INGESTION_BLOCKED`，並收窄 `SOURCE_UNAVAILABLE` 為真正 source-level failure。
- `AGENTS.md`、`docs/INGESTION.md`、`docs/THREADS_INGESTION.md` 同步 execution-backend policy。

### Changed

- `npm run ingest:resolve -- <URL>` 仍是 mandatory preflight，但 local runtime 無法執行時必須先套用 execution-backend policy，不能直接停止並把來源宣告 unavailable。
- Threads browser / Phase 7 model endpoint 的 local capability failure 先視為 execution-backend failure；來源完整性 gate 本身不變。
- Existing Card / accepted snapshot 可在 live revalidation blocked 時提供已知 identity/state，但不得用來刷新 analysis、`last_checked_at` 或 accepted snapshot。

### Boundary

- Phase 8A 是 contract-only；尚未實作永久 RemoteBackend / remote-ingest workflow。永久 execution harness 留給後續 Phase 8B。
- 在正式 RemoteBackend 上線前，Agent 不得自行發明 ad-hoc remote workflow 並把它當作 Repository 標準流程；無正式 remote backend 時應明確回報 `REMOTE_EXECUTION_UNAVAILABLE` / `INGESTION_BLOCKED`。
- Provider routing、Threads Phase 1–7 completeness、user-owned state 與 public safety 規則不因 execution backend 改變。

---

## 1.8.0 — 2026-08-13

### Added

- 擴充 Threads Phase 7，新增 high-confidence root-only recovery：當 root `has_replies: true`、原生 parent/root metadata 不足，但 Browser 已捕捉同作者 reply 候選時，可由 LLM 明確判定 root 本身就是完整正文。
- LLM structured judgement 新增 `root_only`。Root-only 只有在 `selected_shortcodes=[]` 且所有 filtered candidates 都被完整標記為 `followup` / `unrelated` 時才可能接受。
- 新增 `INFERRED_SINGLE_POST_HIGH_CONFIDENCE`、`thread.recovery.root_only = true` 與 `extraction.method = llm_assisted_root_only`，和 `INFERRED_THREAD_HIGH_CONFIDENCE` 分開保存 provenance。
- 新增 VoxCPM live-case 型態的 unit / mandatory-ingestion fixtures，確認後續 VibeVoice / 台灣口音 replies 不會被誤併入原始正文。

### Safety

- Root-only acceptance 預設要求 global LLM confidence >= 0.90，且每個 candidate-label confidence >= 0.90。
- `candidate_labels` 必須完整且唯一覆蓋所有 filtered candidates；漏標、多標、未知 candidate、`continuation`、`uncertain` 或低信心 label 均 fail closed。
- 沒有 filtered candidate 時不得用 root-only 通過；「沒有找到續篇」不等於「已證明 root 是完整單篇」。
- 既有 `n/N` conflict、known missing parts、structural ambiguity 與 provider routing hard gate 不變，LLM 仍不得覆蓋結構證據。

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
- public HTTP / hydration extraction不足時，可用 headless browser 解析 JS-only `/share/*` / `/t/*` navigation。
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