# AGENTS.md — 運作來源狀態

此目錄存放機器擁有的運作狀態，用來比較目前公開來源與先前已接受的來源版本。根目錄的 `AGENTS.md` 仍然適用。

## 來源快照

Threads 來源快照位於 `state/source-snapshots/threads/`，只能透過來源狀態工具寫入。

規則：

- 快照是運作指紋，不是 Knowledge Card，也不是使用者擁有的分類狀態。
- 不得在此儲存 Threads 原始正文、原始 GraphQL payload、登入／session 資料、cookies 或私人內容。
- 快照可以保存穩定的公開來源紀錄，例如貼文 ID、shortcode、canonical URL、排序中繼資料、時間戳記，以及正規化文字／媒體／引用內容的 SHA-256 指紋。
- 易變動的媒體 query signature 不得造成假的內容變更；應以穩定媒體識別建立指紋。
- 前置檢查期間不得推進快照。只有對應 Knowledge Card 已存在，且建立／更新通過儲存庫驗證後，才能推進。
- Threads 擷取失敗、不完整、有歧義或來源識別不一致時，絕不得覆蓋最後一次已接受快照。
- 來源未變時，不得只為刷新 timestamp 而重寫快照。
- 刪除快照會重設該來源的變更歷史，但不得刪除或修改 Knowledge Card 本身。
- 不得手動編輯快照來表達使用者意圖。使用者擁有狀態應放在 Knowledge Card 的所有權欄位與 `## 使用者備註`。