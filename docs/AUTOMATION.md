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

一般 `main` push 會執行增量語意圖譜：

```text
目前 main revision
→ 增量 embeddings
→ semantic relation candidates
→ OPENAI_API_KEY 可用時執行 LLM relation 分類
→ 不可用時使用既有快取或確定性備援
→ 重建 Concept Graph
→ graph validators
→ npm test
→ Knowledge Card 驗證
→ npm run docs:check
→ VitePress build
→ site output verification
→ 確認 main 沒有在建置期間前進
→ 有實質差異時提交 data/*.json
→ Upload Pages artifact
→ Deploy GitHub Pages
```

每週日排程，或手動將 `full_rebuild=true` 時，會把前段改成完整重建：

```text
所有 Cards
→ 全量重建 embeddings
→ 全量重新計算 semantic relations
→ 可用時重新執行 LLM relation classification
→ 分類器不可用時保留仍有效的 LLM 快取判定
→ 重建 Concept Graph
→ 接續相同的驗證、建站、索引持久化與 Pages 部署
```

因此不論是增量更新或週期 full rebuild，網站與 `data/embeddings.json`、`data/relations.json`、`data/concepts.json` 都來自同一個 workflow run 的同一份 graph build。

#### Stale release 防護

在提交產生索引之前，workflow 會重新抓取 `origin/main` 並與本次 `GITHUB_SHA` 比對。

若建置期間 `main` 已前進：

```text
GITHUB_SHA != origin/main
→ 本次 release 失敗並停止
→ 不提交舊 graph
→ 不部署舊 Pages artifact
```

同一條 workflow 使用 `cancel-in-progress: true`，較新的 `main` revision 會取代較舊的 release run。

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

`scripts/verify-site-output.mjs` 會在 VitePress 後執行，並要求：

- `docs/.vitepress/dist/index.html`；
- `docs/.vitepress/dist/graph.html`；
- 每個 Card ID 都有一個 Knowledge Card HTML 頁面；
- 每個產生的 Concept ID 都有一個 Concept HTML 頁面；
- 至少一個 JavaScript bundle；
- 至少一個 CSS bundle。

這可以抓出 VitePress 本身成功退出，但某類動態路由頁面沒有產生的失敗情況。

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

## 部署不變量

Pages 部署前必須全部通過：

1. 向量嵌入產生與覆蓋率驗證；
2. 語意關聯產生與驗證；
3. Concept Graph 產生與驗證；
4. 單元／網站測試；
5. JSON Schema 與 Knowledge Card 驗證；
6. `npm run docs:check`；
7. VitePress 正式編譯；
8. 首頁、graph、Card 路由與 Concept 路由 smoke verification；
9. stale release SHA 檢查；
10. generated indexes 與 Pages artifact 來自同一次 graph build。

任一階段失敗，Pages artifact 都不得部署。

## 相依套件安裝

儲存庫目前在 `package.json` 鎖定直接相依版本，但尚未提交 `package-lock.json`，因此 workflows 使用 `npm install` 而不是 `npm ci`。之後若提交 lockfile，可再切換為 `npm ci`。
