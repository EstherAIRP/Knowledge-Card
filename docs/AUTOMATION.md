# 自動化與 GitHub Pages

Knowledge Card 使用 GitHub Actions 執行 CI/CD，也用來維護可重建的語意／Concept 索引。Knowledge Card 與儲存庫擁有的設定仍是權威來源；Actions 可以重建 `data/` 產生資料，但不得覆寫使用者擁有的 Knowledge Card 狀態或人工關聯覆寫。

## 工作流程

目前只有三個主要 workflow：

- `.github/workflows/validate.yml`
- `.github/workflows/deploy-pages.yml`
- `.github/workflows/remote-ingest.yml`

圖譜產生與網站部署由同一條 Release Pipeline 負責，不再維護獨立的增量 graph workflow 與 full-rebuild workflow。

### `.github/workflows/validate.yml`

在 pull request 與手動觸發時執行。

```text
checkout
→ Node.js 24
→ 還原／快取本機 embedding 模型
→ npm install
→ 建立 + 驗證 embeddings
→ 建立 relation 索引
→ relation 診斷
→ 建立 + 驗證 Concept Graph
→ 單元測試
→ Knowledge Card 驗證
→ relation 驗證
→ npm run docs:check
→ VitePress 正式建置
→ 建置輸出驗證
```

此 workflow 只有儲存庫唯讀權限，不會提交或部署。它不再監聽一般 feature branch 的 `push`，避免已開 PR 時同一個 SHA 同時因 `push` 與 `pull_request` 重複執行完整 CI。

### `.github/workflows/deploy-pages.yml`

這是 `main` 的單一 Release Pipeline。

觸發來源：

- push 到 `main`；
- 每週日排程；
- 手動 `workflow_dispatch`。

一般 `main` push 會執行增量語意圖譜。Release 一開始先固定來源版本 `S`、唯一 `release_id` 與 `build_mode`；Knowledge Card 驗證會在昂貴的圖譜建置之前執行：

```text
固定 source_sha = S / release_id / build_mode
→ Knowledge Card 驗證
→ 增量 embeddings
→ semantic relation candidates
→ OPENAI_API_KEY 可用時執行 LLM relation 分類
→ 不可用時使用既有快取或確定性備援
→ 重建 Concept Graph
→ graph validators
→ npm test
→ npm run docs:check
→ 固定三個索引的 SHA-256 manifest
→ VitePress build
→ 再次確認索引位元組與 manifest 一致
→ site output + graph projection verification
→ 確認 origin/main == S
→ 保存索引版本 P
→ 從 Git P 回讀三個索引並核對 SHA-256
→ 寫入 Pages artifact 專用 release-meta.json
→ Upload Pages artifact
→ 確認 origin/main == P
→ Deploy GitHub Pages
→ 回讀公開 release-meta.json 並做端到端驗證
```

每週日排程，或手動將 `full_rebuild=true` 時，會把前段改成完整重建：

```text
所有 Cards
→ 全量重建 embeddings
→ 依 cosine distance 重建二維 semantic graph layout
→ 全量重新計算 semantic relations
→ 可用時重新執行 LLM relation classification
→ 分類器不可用時保留仍有效的 LLM 快取判定
→ 重建 Concept Graph
→ 接續相同的驗證、建站、索引持久化與 Pages 部署
```

因此不論是增量更新或週期 full rebuild，網站與 `data/embeddings.json`、`data/graph-layout.json`、`data/relations.json`、`data/concepts.json` 都來自同一個 workflow run 的同一份 graph build。

#### 發布來源證明與版本模型

Release 使用兩個 Git 版本識別：

```text
S = source_sha
    本批次開始建置時的來源版本

P = index_commit_sha
    本批次四個生成索引在 Git 中的保存版本
```

如果索引重建後沒有任何位元組差異，`P = S`。如果索引有差異，workflow 只能建立一個直接以 `S` 為父提交、且只修改以下四個檔案的 `P`：

```text
data/embeddings.json
data/graph-layout.json
data/relations.json
data/concepts.json
```

四個索引在完成 validators 後只建立一次 SHA-256 manifest；VitePress 建站後會再次核對工作目錄中的原始位元組，索引保存後還會直接從 Git commit `P` 讀取相同檔案並核對 SHA-256。這使網站建置、Git 中的索引與發布 metadata 可以由同一份 manifest 串接。

每批 Pages artifact 會額外包含：

```text
release-meta.json
```

其中記錄 `schema_version`、`release_id`、`source_sha`、`index_commit_sha`、`build_mode`、產生時間，以及四個索引各自的 SHA-256 與位元組大小。這個檔案只屬於 Pages artifact，不提交回 Git，避免發布 metadata 對自身 commit 形成循環引用。

純生成索引提交已列入 `push.paths-ignore`。因此 workflow 自己保存 `P` 時不會再觸發第二輪 Release，也不會因 `cancel-in-progress: true` 取消仍在完成中的原批次。

#### 過期發布防護

發布流程有兩道 Git 版本守門：

```text
索引保存前：
origin/main == S

真正部署前：
origin/main == P
```

若建置期間有其他來源變更使 `main` 離開 `S`，本批次不會提交舊索引；若索引保存後、Pages 真正部署前 `main` 又離開 `P`，舊 artifact 也不會部署。較新的來源 revision 會由自己的 Release 取代舊批次。

#### 線上回讀驗證

`actions/deploy-pages` 成功後，workflow 會執行 `scripts/verify-live-release.mjs`，從實際 `page_url` 回讀 `release-meta.json`。驗證器會核對：

- `release_id`；
- `source_sha = S`；
- `index_commit_sha = P`；
- `build_mode`；
- 線上 metadata 中三個索引 SHA-256 是否與 Git commit `P` 的原始位元組一致。

為容許 GitHub Pages／CDN 的短暫傳播時間，線上驗證使用有限次重試，且每次請求帶入 cache-busting query；超過重試次數仍不一致就採保守失敗。

因此應區分兩種狀態：

```text
Deploy Pages API 成功
≠
端到端 Release 驗證成功
```

只有部署動作與線上回讀都通過，才可把本批次回報為完整發布成功。

#### 權限

因為 Release Pipeline 同時需要持久化 generated indexes 與部署 Pages，workflow 權限為：

```yaml
contents: write
pages: write
id-token: write
```

內容寫入僅限可重建的 `data/*.json`；不得藉由 release 副作用修改 Knowledge Card 或人工設定。

### `.github/workflows/remote-ingest.yml`

當目前本機執行環境無法滿足已核准的收錄能力時，提供儲存庫定義的 Remote Ingest。跨來源傳輸與失敗分類由 [`INGESTION.md`](./INGESTION.md) 定義；Threads 專用的受管理語意行為仍由 [`THREADS_INGESTION.md`](./THREADS_INGESTION.md) 定義。

workflow 有明確的請求到執行關聯路徑：

```text
request commit SHA
→ commit status context: remote-ingest/run
→ target_url 指向相符的 Actions run
→ run ID
→ remote-ingest-{request_id} artifact
→ remote-ingest-result.json
```

權限依 job 分離：

```text
announce/finalize → statuses: write
resolve           → contents: read + copilot-requests: write
cleanup           → contents: write
```

因此執行模型的 `resolve` job 不會因這項機制取得儲存庫內容寫入權限。

## 文件治理檢查

```bash
npm run docs:check
```

由 `scripts/check-documentation.mjs` 實作。

這項檢查會驗證：

- 必要的權威來源與契約檔案存在；
- 已廢棄／衝突路徑沒有重新出現；
- `docs/` 只有一個小寫 `index.md`；
- README 使用 `ingest:dispatch` 作為一般收錄入口；
- README 與自動化文件只列出目前存在的 workflow；
- 文件導航與權威來源索引保留關鍵權威引用；
- 治理文件集合中的本機 Markdown 連結可解析；
- PR 驗證與 `main` Release Pipeline 都會執行此檢查；
- Remote Ingest 保留 request-commit status pointer、固定 `remote-ingest/run` context、Actions run URL 與最終狀態發布。

VitePress 正式建置仍負責自身路由與死連結驗證。兩者互補：`docs:check` 保護儲存庫治理慣例，VitePress 驗證實際渲染的文件／網站圖譜。

## 模型憑證

預設語意向量嵌入供應者在本機執行，不需要 API 憑證。Concept 擷取也是確定性的，不需要外部 API。

LLM Card↔Card 關聯分類使用 `config/relation-config.yaml` 設定的環境變數，目前為：

```text
OPENAI_API_KEY
```

需要時將它設為儲存庫 Secret。沒有此憑證是支援情境：有效的既有 LLM 判定會保留；新的語意候選會使用保守備援，Concept 產生仍會正常進行。

## 向量嵌入模型快取

Workflows 設定：

```text
TRANSFORMERS_CACHE_DIR=.cache/transformers
```

並透過 `actions/cache` 快取此目錄。快取 key 會納入 relation config 與套件設定。

## 產生資料所有權

Release Pipeline 只能自動提交以下產生索引：

```text
data/embeddings.json
data/graph-layout.json
data/relations.json
data/concepts.json
```

不得因索引維護的副作用修改：

```text
content/knowledge/**
config/relation-overrides.yaml
config/relation-config.yaml
config/concept-config.yaml
```

產生資料仍依 [`../data/AGENTS.md`](https://github.com/EstherAIRP/Knowledge-Card/blob/main/data/AGENTS.md) 的 ownership 契約管理。

## 建置輸出驗證

`scripts/verify-site-output.mjs` 會在 VitePress 後執行。除了要求首頁、graph、每個 Card／Concept 頁面與 JavaScript／CSS 資產存在，也會使用與 `docs/graph.data.js` 相同的共用 graph projection 邏輯核對：

- Card 與 Concept 節點；
- Card↔Concept、Concept↔Concept、Card↔Card 三類邊；
- Card↔Card 關聯方向；
- 每條邊的來源／目標端點確實存在；
- graph 統計數量與目前索引一致。

`docs/graph.data.js` 對必要圖譜索引採保守失敗：缺檔、空檔、JSON 損壞或無效關聯端點不再退回空圖。因此 VitePress 成功退出但圖譜資料實際錯誤，不會被視為可發布成果。

## 部署 URL

VitePress 專案 base 維持：

```text
/Knowledge-Card/
```

預期的 GitHub Pages 專案 URL：

```text
https://estherairp.github.io/Knowledge-Card/
```

除非另行設定 custom domain。

## 發布不變量

Pages artifact 進入部署前必須全部通過：

1. Knowledge Card 驗證；
2. 向量嵌入產生與覆蓋率驗證；
3. 語意關聯與 Concept Graph 產生／驗證；
4. 單元測試與 `npm run docs:check`；
5. 三個固定索引 manifest 已建立，且 VitePress 建站後位元組未漂移；
6. 網站頁面、資產與 graph projection 驗證；
7. 保存索引前 `origin/main == S`；
8. `P = S`，或 `P` 是只修改三個生成索引的直接子提交；
9. Git commit `P` 中的索引 SHA-256 與建站 manifest 完全一致；
10. 真正部署前 `origin/main == P`；
11. Pages artifact 已包含本批次 `release-meta.json`。

任一部署前條件失敗，Pages artifact 都不得部署。部署 API 完成後還必須通過公開 `release-meta.json` 的線上回讀驗證；這項驗證失敗時，應標示為「部署動作已完成，但端到端發布未驗證」，不能回報為完整發布成功。

## 相依套件安裝

儲存庫目前在 `package.json` 鎖定直接相依版本，但尚未提交 `package-lock.json`，因此 workflows 使用 `npm install` 而不是 `npm ci`。之後若提交 lockfile，可再切換為 `npm ci`。
