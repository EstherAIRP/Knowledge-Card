# AGENTS.md — 設定所有權

根目錄的 `AGENTS.md` 仍然適用。

## `relation-overrides.yaml`

此檔案視為使用者擁有的設定。

- 自動化關聯重建可以讀取，但不得覆寫。
- 只有使用者明確要求 pin、block、移除或 override 某個關聯時，AI 才能編輯。
- 同一組 Card 配對中，`blocked` 的優先權高於產生關聯與人工 pinned／override 項目。
- Phase 2 支援的關聯類型為 `similar_to`、`alternative_to`、`complements`、`integrates_with`、`depends_on`、`extends`、`contrasts_with`。
- 舊版 `related` 仍保留給 Phase 1／人工相容用途，但不應再產生為 Phase 2 語意類型。
- `depends_on` 與 `extends` 必須明確指定 `direction: source_to_target` 或 `direction: target_to_source`。
- 其他語意關聯類型若提供方向，必須使用 `direction: undirected`。

## `relation-config.yaml`

此檔案是儲存庫擁有的演算法設定，不是使用者覆寫狀態，也不是產生狀態。

- 可定義候選門檻、向量嵌入供應者／模型、語意正規化、分類器供應者／模型、評分權重與受控關聯類型。
- 不得把 API key、token 或憑證放入此檔案。憑證應放在 `api_key_env` 指向的環境變數／GitHub Secrets。
- 門檻／模型／供應者變更屬於明確的行為變更。重建產生資料後，應執行 `npm test`、`npm run embeddings:validate` 與 `npm run relations:validate`。
- 不得在未同步更新驗證、分類器 Schema／prompt、UI 標籤、文件與測試的情況下，偷偷新增關聯類型。

## `concept-config.yaml`

此檔案是儲存庫擁有的 Phase 3 ontology／擷取設定。

- 定義如何從有效 Categories、共用 Tags 與人工整理的高階 `promoted_concepts` 確定性擷取 Concept。
- promoted concept 是可重用的公開技術抽象，不是用來編碼私人使用者脈絡或一次性專案筆記的地方。
- Concept ID 應盡量保持穩定。變更 ID 會破壞既有圖譜路由，應視為遷移。
- `minimum_tag_support`、Concept 關聯支援門檻與 degree cap 屬於演算法行為，不是內容事實。
- 不得為了強迫圖譜輸出，就把產生的 Card ID 或計算後的邊清單塞進此設定；產生成員關係屬於 `data/concepts.json`。
- 變更 Concept 規則時，先用 `npm run concepts:build` 重建，再執行 `npm run concepts:validate` 與 `npm test`。
- 避免建立近似重複的 promoted concept；應優先擴充既有 canonical Concept 的比對別名／訊號。