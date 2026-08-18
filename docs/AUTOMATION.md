# 自動化與 GitHub Pages

Knowledge Card 使用 GitHub Actions 執行 CI/CD，也用來維護產生的語意／Concept 索引。Knowledge Card 與儲存庫擁有的設定仍是權威來源；Actions 可以重建產生資料，但不得覆寫使用者擁有的 Knowledge Card 狀態或人工關聯覆寫。

## 工作流程

### `.github/workflows/validate.yml`

在 pull request、推送到非 `main` 分支，以及手動觸發時執行。

```text
checkout
→ Node.js 24
→ 還原／快取本機 embedding 模型
→ npm install
→ 建立 + 驗證 embeddings
→ 建立語意 relation 索引
→ relation 診斷
→ 建立 + 驗證 Concept Graph
→ 單元測試
→ Knowledge Card 驗證
→ relation 驗證
→ npm run docs:check
→ VitePress 正式建置
→ 建置輸出驗證
```

此 workflow 只有儲存庫唯讀權限，不會提交或部署。分支 CI 不需要外部 LLM 憑證。

### `.github/workflows/update-relations.yml`

歷史檔名維持 `update-relations.yml`，workflow 名稱是 **Update Knowledge Graph Indexes**。

它會在 `main` 的相關變更觸發，包括 Knowledge Card、relation config、Concept config、產生器函式庫與套件設定。

```text
Card / config / generator 變更
→ 增量 embeddings
→ embedding 驗證
→ 語意候選
→ OPENAI_API_KEY 存在時執行 LLM relation 分類
→ 不可用時使用確定性備援
→ relation 診斷
→ 重建 Concept Graph
→ relation + Concept 驗證
→ 單元測試
→ embeddings.json / relations.json / concepts.json 有變更時提交
```

產生的 `data/*.json` 不屬於 workflow 觸發路徑，因此機器人的產生資料 commit 不會遞迴重建索引。

### `.github/workflows/rebuild-relations.yml`

歷史檔名維持 `rebuild-relations.yml`，workflow 名稱是 **Full Knowledge Graph Rebuild**。

每週日與手動觸發時執行。

```text
所有 Cards
→ 重建全部 embedding
→ 重新計算語意候選
→ API 憑證存在時重新分類
→ 分類器不可用時保留有效的 LLM 快取判定
→ 重建 Concept Graph
→ 移除過期產生狀態
→ 驗證 embeddings / relations / concepts
→ 單元測試
→ 有實質變更時提交產生資料
```

完整重建會修復增量處理造成的漂移，並刷新三份產生索引。

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

指標會在來源處理前發布，並在 `resolve` job 完成後更新。這讓 Agent 可以從已知的 request commit 找回由 push 觸發的 Remote Ingest run，不必依賴通用的 workflow-run listing API。

權限依 job 分離：

```text
announce/finalize → statuses: write
resolve           → contents: read + copilot-requests: write
cleanup           → contents: write
```

因此執行模型的 `resolve` job 不會因這項機制取得儲存庫內容寫入權限。

### `.github/workflows/deploy-pages.yml`

推送到 `main` 與手動觸發時執行。

```text
checkout
→ Node.js 24
→ npm install
→ 建立 + 驗證 embeddings
→ 建立 relations
→ 建立 Concept Graph
→ 單元測試
→ 驗證 Cards / relations / concepts
→ npm run docs:check
→ VitePress 正式建置
→ 驗證首頁 + graph + Card 頁面 + Concept 頁面
→ 上傳 Pages artifact
→ deploy
```

部署權限維持最小化：

```yaml
contents: read
pages: write
id-token: write
```

## 文件治理檢查

Phase 5 加入：

```bash
npm run docs:check
```

由 `scripts/check-documentation.mjs` 實作。

這項檢查刻意只處理穩定的治理不變量，不重複實作 VitePress parser。它會檢查：

- 必要的權威來源與契約檔案存在；
- `docs/THREADS_PHASE7_RECOVERY.md` 等已廢棄／衝突路徑沒有重新出現；
- `docs/` 只有一個小寫 `index.md`，不存在只有大小寫不同的 `INDEX.md`；
- README 使用 `ingest:dispatch` 作為一般收錄入口；
- 文件導航與權威來源索引保留關鍵權威引用；
- 治理文件集合中的本機 Markdown 連結可解析；
- VitePress 文件不使用相對路徑連到 `docs/` 外部檔案；
- 分支驗證與 `main` Pages 建置都會執行此檢查；
- Remote Ingest 保留 request-commit status pointer、固定 `remote-ingest/run` context、Actions run URL 與最終狀態發布。

VitePress 正式建置仍負責自身路由與死連結驗證。兩者互補：`docs:check` 保護儲存庫治理慣例，VitePress 驗證實際渲染的文件／網站圖譜。

## 模型憑證

預設語意向量嵌入供應者在本機執行，不需要 API 憑證。Concept 擷取也是確定性的，不需要外部 API。

LLM Card↔Card 關聯分類使用 `config/relation-config.yaml` 設定的環境變數，目前為：

```text
OPENAI_API_KEY
```

需要時將它設為儲存庫 Secret。沒有此憑證是支援情境：新的語意關聯會使用保守備援，Concept 產生仍會正常進行。

## 向量嵌入模型快取

Workflows 設定：

```text
TRANSFORMERS_CACHE_DIR=.cache/transformers
```

並透過 `actions/cache` 快取此目錄。快取 key 會納入 relation config 與套件設定。

## 產生資料所有權

自動化只能提交以下產生索引：

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

部署必須全部通過：

1. 向量嵌入產生與覆蓋率驗證；
2. 語意關聯產生與驗證；
3. Concept Graph 產生與驗證；
4. 單元／網站測試；
5. JSON Schema 與 Knowledge Card 驗證；
6. 使用 `npm run docs:check` 執行文件治理驗證；
7. VitePress 正式編譯；
8. 首頁、graph、Card 路由與 Concept 路由 smoke verification。

任一階段失敗，Pages artifact 都不得部署。

## 相依套件安裝

儲存庫目前在 `package.json` 鎖定直接相依版本，但尚未提交 `package-lock.json`，因此 workflows 使用 `npm install` 而不是 `npm ci`。之後若提交 lockfile，可再切換為 `npm ci`。