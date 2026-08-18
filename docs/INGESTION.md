# 收錄流程

> **角色：** 跨來源供應商的收錄與執行規範契約  
> **Threads 來源語意：** [`THREADS_INGESTION.md`](./THREADS_INGESTION.md)  
> **執行流程：** [Runtime Prompt](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/RUNTIME.md)  
> **儲存庫寫入規則：** [AGENTS.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md)  
> **文件導航：** [`DOCUMENTATION.md`](./DOCUMENTATION.md)

本文件負責**跨來源供應商的收錄邊界**：來源路由、調度器／解析器行為、一般來源與 GitHub 收錄、執行後端、Remote Ingest 的請求／執行／結果關聯、失敗分類，以及已接受來源交給儲存庫撰寫流程的銜接規則。

本文件刻意**不**定義 Threads 串文重建、續篇／僅根貼文判定、受管理 Threads 排序器語意或 Threads 快照演算法。這些規則由 [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) 與受信任實作負責。

## 1. 來源路由

每次收錄都必須根據輸入 URL 或解析後的主要資源，先選定一條互斥的來源路由。

| 主要資源 | 路由 |
| --- | --- |
| `threads.com` / `threads.net`，包含 `/share/*`、`/t/*`、`/@user/post/*` | 使用 [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) 的 Threads 來源契約 |
| 解析後指向 Threads 的暫時性／短網址 | 解析後切換到 Threads 路由 |
| GitHub Repository | 使用 GitHub 儲存庫識別的一般收錄流程 |
| 論文 / DOI / 文章 / 文件 / 工具 / 產品 / 其他非 Threads 來源 | 一般／來源供應商流程 |

硬性邊界：

```text
Threads source     → THREADS_INGESTION.md
Non-Threads source → generic/provider flow in this document
```

非 Threads 來源不得啟動 Threads 專用的瀏覽器重建、語意續篇復原或 Threads 快照。Threads 來源也不得只因目前畫面能看到單篇貼文，就降級成一般單篇文章處理。

## 2. 調度器與解析器

一般收錄從以下指令進入：

```bash
npm run ingest:dispatch -- <URL>
```

調度器會選擇已核准的執行後端。執行成功時，回傳封裝（envelope）中的 `result` 會提供正常的解析器結果。

所有已核准的後端最終都執行相同的低階解析器契約：

```bash
npm run ingest:resolve -- <URL>
```

解析器仍是日常建立／更新來源識別的機械性權威，包含：

- `canonical_url`
- `source_identity`
- 穩定的 `id`
- `mode`
- `existing_path`
- `suggested_path`

調度器的典型結果：

```text
local success
→ use envelope.result

local execution capability unavailable
→ REMOTE_EXECUTION_REQUIRED
→ use Repository-defined Remote Ingest

source extraction/completeness failure
→ fail closed
```

結束碼 `75` 搭配 `REMOTE_EXECUTION_REQUIRED` 代表需要轉交執行後端，不是來源層級失敗。

遠端執行方案也會公布機器可讀的執行關聯契約：

```text
mechanism       = commit_status_v1
context         = remote-ingest/run
target          = request_commit
target_url_kind = github_actions_run
```

這個契約讓 Agent 不必依賴通用的「列出所有由 push 觸發的 workflow run」能力，也能找回對應的 Remote Ingest 結果。

## 3. 一般來源與 GitHub 收錄

一般流程如下：

```text
input URL
→ execution dispatcher
→ resolve/canonicalize primary resource
→ derive stable source identity
→ create/update lookup
→ read authoritative primary evidence
→ analyze
→ repository write protocol
→ validation
```

### GitHub

GitHub URL 的不同變體必須收斂成同一個儲存庫識別：

```text
source.identity = github:{owner-lowercase}/{repo-lowercase}
canonical_url   = https://github.com/{owner}/{repo}
```

至少要讀取儲存庫中繼資料與 README。若技術判斷需要更多證據，再查看架構、原始碼、設定、安全、版本發布或文件等檔案。

### 其他網頁來源

一般非 Threads 網頁 URL 的標準化會保守移除 fragment 與已知追蹤參數，同時保留有意義的查詢參數。日常來源識別與建立／更新模式應以已接受的解析器結果為準，不得人工猜測。

## 4. 執行後端規則

來源路由回答「**要跑哪一條來源流程**」，執行路由回答「**這條流程在哪裡執行**」。

核心不變量：

```text
execution/runtime failure != source unavailable
```

不能只因目前工作階段缺少 shell、Node/npm、對外網路、瀏覽器能力，或必要的模型／供應商能力，就把公開來源判定為不可用。

執行順序：

```text
LocalBackend
↓ if unavailable
Repository-defined Remote Ingest
↓ if unavailable / blocked
Existing Card / accepted source state only for identity/history
↓
INGESTION_BLOCKED if no approved backend can produce accepted current evidence
```

既有 Card、別名或已接受快照可以協助辨識過去已接受的狀態，但永遠不能取代目前來源的即時完整性與新鮮度驗證。

## 5. 失敗分類

以下頂層分類必須一致使用：

- `LOCAL_EXECUTION_UNAVAILABLE` — 目前執行環境無法跑必要的儲存庫流程；
- `REMOTE_EXECUTION_UNAVAILABLE` — 儲存庫定義的遠端後端或必要的受管理執行能力不可用或遭阻擋；
- `SOURCE_EXTRACTION_FAILED` — 可用後端已進入來源流程，但因來源／證據原因擷取失敗；
- `SOURCE_INCOMPLETE` — 已取得證據且必要能力已執行，但來源完整性／歧義關卡未通過；
- `INGESTION_BLOCKED` — 沒有任何允許的後端能產生目前可接受的來源；
- `SOURCE_UNAVAILABLE` — 僅保留給可用後端已確認的來源層級不可用狀態。

來源供應商專用錯誤可作為巢狀原因出現，但外層分類仍必須區分執行能力失敗與真正的來源不完整。

硬性規則：

- 執行失敗不得重新標記成來源不可用；
- 不完整、有歧義、來源識別不一致、被阻擋或其他未接受來源，不得建立／更新正式 Card；
- 即時重新驗證受阻時，不得刷新分析、`last_checked_at` 或已接受來源狀態；
- 工作階段／工具差異不得降低來源完整性、識別、所有權或公開安全關卡。

## 6. Remote Ingest 傳輸

永久遠端後端為：

[`.github/workflows/remote-ingest.yml`](https://github.com/EstherAIRP/Knowledge-Card/blob/main/.github/workflows/remote-ingest.yml)

一般收錄不得自行建立臨時 workflow 檔案來替代正式流程。

### 請求分支規則

1. 重新讀取最新 `main`。
2. 從該次精確的 `main` commit 建立 `runtime/ingest/{request_id}`。
3. 只新增一個請求檔 `.runtime/requests/{request_id}.json`。
4. 請求分支只能包含資料，不得修改受信任原始碼、workflow 程式碼、Cards 或機器擁有狀態。

基本請求格式：

```json
{
  "schema_version": 1,
  "request_id": "20260818-example01",
  "operation": "resolve",
  "url": "https://example.com/source"
}
```

目前基本限制：

- `request_id`：6–80 個小寫且 URL 安全的字元；
- `operation`：`resolve`；
- `url`：絕對 HTTP(S) URL。

若來源供應商支援額外的選填請求欄位，仍由受信任驗證程式碼與對應來源契約控制。請求資料不得重新定義 workflow 程式碼、提示詞、憑證、模型規則或接受關卡。

### 受信任執行邊界

Remote Ingest 會執行 `main` 上的受信任執行框架；請求分支則另外作為資料讀取。遠端執行可以安裝儲存庫相依套件與來源供應商需要的執行能力，但把工作移到 GitHub Actions 不得降低來源完整性或儲存庫安全規則。

### 請求與執行關聯

請求 commit SHA 是穩定的關聯鍵。Remote Ingest workflow 啟動時，會在該請求 commit 上發布 GitHub commit status：

```text
context    = remote-ingest/run
target_url = https://github.com/<owner>/<repo>/actions/runs/<run_id>
state      = pending | success | failure
```

`target_url` 是對應 GitHub Actions run 的權威指標。workflow 會在來源處理前先發布 `pending`，並在解析工作完成後更新同一個 status context。

結果取得流程：

```text
known request commit SHA
→ read commit statuses
→ select context remote-ingest/run
→ parse run ID from target_url
→ inspect run/jobs as needed
→ fetch artifact remote-ingest-{request_id}
→ validate remote-ingest-result.json
```

臨時 `runtime/ingest/**` 分支可以在執行後刪除。這項清理不會使請求 commit SHA 關聯鍵或已附加的 status 失效。

只要仍能查詢請求 commit 的 status，缺少通用的 push-triggered workflow run 列表 API，**本身不足以**判定 Remote Ingest 不可用。反之，如果 workflow 無法發布有效的執行指標，且沒有其他儲存庫核准的關聯方法，就不得猜測遠端結果或誤用其他不相關的執行結果。

執行指標的發布／收尾工作只有 `statuses: write`。處理來源的 `resolve` 工作仍維持既有的 `contents: read` 加上受管理模型權限邊界；發布指標不會賦予模型執行工作儲存庫內容寫入權限。

### 結果產物

已驗證請求會使用以下短期產物（artifact）識別：

```text
remote-ingest-{request_id}
└── remote-ingest-result.json
```

使用成功結果前，至少驗證：

```text
schema_version == 1
request_id == submitted request_id
execution.backend == github_actions
execution.status == success
```

只有在請求／執行／結果關聯驗證成功後，才能把封裝中的 `result` 當成解析器／前置檢查輸出。失敗封裝維持保守失敗（fail closed）。臨時請求傳輸分支絕對不得合併進 `main`。

來源供應商專用的受管理執行細節由對應來源文件負責。Threads 的語意復原與轉交規則請見 [`THREADS_INGESTION.md`](./THREADS_INGESTION.md)。

## 7. 主要證據要求

不得只根據 URL slug、搜尋摘要、儲存庫名稱或模型記憶撰寫實質分析。

撰寫 Card 前：

- 讀取已接受的權威主要來源；
- GitHub 至少查看儲存庫中繼資料與 README；
- 論文優先使用論文／摘要與官方專案資料；
- 文章／文件應讀取實際權威頁面；
- 區分已驗證事實與推論；
- 不得臆造功能、架構、成熟度、授權、相容性、benchmark 或維護狀態。

Threads 正式分析必須使用 [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) 定義的完整已接受來源，而不是只分析原始分享貼文。

允許的執行路由全部嘗試後，如果目前主要證據仍無法被接受，就不得自行補造 Card。

## 8. 已接受來源交給儲存庫寫入

來源流程回傳已接受的解析器結果後，Card 撰寫規則改由 [AGENTS.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md) 負責。

其中：

- 建立或更新由已接受的解析器識別結果決定；
- 必須保留穩定 ID／路徑與使用者擁有狀態；
- Card 的 YAML 前置欄位必須符合 Schema 與 Taxonomy；
- 更新既有 Card 時必須驗證所有權；
- 來源供應商擁有的運作狀態，只能在對應 Card 寫入通過驗證後推進。

不要在此重複完整的建立／更新與所有權契約。

## 9. 驗證與回報

Card 寫入需要執行：

```bash
npm run validate
```

更新既有 Card 時另需執行：

```bash
npm run validate:ownership -- <existing_path>
```

若修改來源／執行實作，還需要執行：

```bash
npm test
```

僅修改文件時，依 [AGENTS.md](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md) 的驗證／CI 要求處理。

必要的儲存庫寫入、驗證、Push、CI 與部署狀態尚未實際確認前，不得回報為完成。

## 10. 文件責任邊界

本文件負責：

- 來源路由選擇；
- 調度器／解析器關係；
- 一般來源／GitHub 收錄；
- 執行後端順序；
- 跨來源供應商的失敗分類；
- Remote Ingest 的請求／執行／結果關聯與信任邊界；
- 已接受來源交給儲存庫撰寫流程的銜接。

本文件**不**負責：

- Threads Phase 1–7 演算法；
- Threads 續篇／僅根貼文判定門檻與判定語意；
- 受管理 Threads 分類器提示詞語意；
- Threads 語意轉交的證據／摘要規則；
- Threads 已接受快照／變更偵測演算法；
- 已由 `AGENTS.md` 定義的 Knowledge Card 所有權／寫入細節。

## 相關文件

- [文件導航](./DOCUMENTATION.md)
- [文件權威來源索引](./AUTHORITY_MAP.md)
- [Threads 收錄](./THREADS_INGESTION.md)
- [自動化](./AUTOMATION.md)
- [Runtime Prompt](https://github.com/EstherAIRP/Knowledge-Card/blob/main/prompts/RUNTIME.md)
- [儲存庫規則](https://github.com/EstherAIRP/Knowledge-Card/blob/main/AGENTS.md)
- [Remote Ingest Workflow](https://github.com/EstherAIRP/Knowledge-Card/blob/main/.github/workflows/remote-ingest.yml)
