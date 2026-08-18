# AGENTS.md — 產生資料

此目錄存放由機器產生、可丟棄並可重建的索引。根目錄的 `AGENTS.md` 仍然適用。

## 一般規則

`data/` 下的產生檔案不得成為使用者撰寫知識或人工決策的唯一權威來源。它們必須能從 Knowledge Card、儲存庫設定、模型／產生器程式碼與使用者擁有的覆寫重新建立。

不得手動編輯產生索引來表達使用者意圖。

## `embeddings.json`

- 由 `npm run embeddings:build` 產生。
- 依穩定 Card ID 儲存語意向量、內容雜湊、供應者／模型識別與維度。
- 一般增量執行中，Card／模型輸入未變時應重用快取向量。
- `--full` 可用來刻意重建全部向量。
- 人工修正不得寫入此檔案。
- 提交產生的 embeddings 前，執行 `npm run embeddings:validate`。

## `relations.json`

- 由 `npm run relations:build` 或 `npm run relations:build:semantic` 產生。
- 可包含 taxonomy／semantic／LLM 分數、類型化邊、方向、原因、pipeline 中繼資料與快取分類器判定。
- 不得成為 Knowledge Card 中繼資料的權威來源。
- 人工關聯決策應放在 `config/relation-overrides.yaml`。
- 輸入未變時應保留有效的 LLM 快取分類；API 不可用時，不得在完整重建中偷偷將其降級。
- 實質輸入與輸出未變時，避免只因 timestamp 改變而重寫檔案。
- 提交 relation 索引變更前，執行 `npm run relations:validate` 與 `npm test`。

## `concepts.json`

- 由 `npm run concepts:build` 根據目前 Knowledge Card 與 `config/concept-config.yaml` 產生。
- 儲存 canonical Concept 節點、帶有證據／強度的 Card↔Concept 對應、Concept↔Concept 共現邊與圖譜統計。
- Category Concepts 與符合條件的共用 Tag Concepts 由機械規則推導；高階 promoted Concepts 由 `config/concept-config.yaml` 中的儲存庫規則定義。
- Concept membership 是產生證據，不是人工標註儲存區。不得手動編輯此檔案中的對應或 Concept 關聯。
- Concept ID 會成為 `/concepts/<id>` 下的公開路由；除非進行明確遷移，產生器／設定變更必須保留穩定 ID。
- 提交 Concept 索引變更前，執行 `npm run concepts:validate` 與 `npm test`。

## 產生資料提交

自動化可以提交 `data/embeddings.json`、`data/relations.json` 與 `data/concepts.json`。產生資料 commit 不得因副作用修改 `content/knowledge/` 或儲存庫／使用者擁有的設定。