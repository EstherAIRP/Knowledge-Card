# Taxonomy 與人類導航

Knowledge Card 將「語意系統」與「人類找資料」拆成不同欄位，避免為了改善分類介面而改變既有 embedding、Relation 或 Concept Graph。

## 四個維度

| 欄位 | 回答的問題 | 是否影響既有語意關聯 |
| --- | --- | --- |
| `navigation.categories` | 這份收藏主要在談什麼？ | 否 |
| `resource_kind` | 這份資源本身是什麼？ | 否 |
| `classification.categories` | 既有 semantic taxonomy 訊號是什麼？ | 是 |
| `classification.tags` | 有哪些細粒度技術／特徵？ | 是 |

`source.type` 只描述來源媒介，例如 GitHub、文章、論文或文件；它不等於資源型態。

## Human Navigation Categories

受控值以 `config/taxonomy.yaml` 的 `navigation_categories` 為準。

- Agent / Harness
- AI Coding / DevTools
- Memory / RAG / Knowledge
- Character AI / AI RPG
- Automation / Productivity
- Infrastructure / Security
- Model / Inference
- Vision / Multimodal
- Image Creation / Design
- Video Creation
- Audio / Music / Speech
- Writing / Documentation
- Research / Science

一張 Card 可以有多個 Human Navigation Category，但只應標示使用者會拿來找它的主要主題。不要因為實作中用了某項技術，就把所有技術都升成導航分類。

例如影片自動生成專案可以是：

```yaml
navigation:
  categories:
    ai:
      - Video Creation
      - Automation / Productivity
    user: null
```

即使底層同時用了 LLM、Agent Skill、TTS、字幕與影像生成，也不需要把所有技術都列成人類導航主題；細節保留在 semantic classification、Tags、Concept 與 Relations。

## Resource Kind

`resource_kind` 描述「這份資源是什麼」，不是「從哪裡抓到」。

| 值 | 定義 |
| --- | --- |
| `project` | 完整應用、框架、函式庫、CLI、服務或可部署專案 |
| `skill` | 主要供 Agent 載入、遵循或調用的可重用能力／工作流程 |
| `tutorial` | 有明確操作步驟，目標是帶讀者完成一件事 |
| `guide` | 方法論、最佳實踐或實務指引，不一定逐步操作 |
| `article` | 技術介紹、分析、心得、觀點或案例文章 |
| `reference` | 以查閱、盤點、規格或速查為主要用途 |
| `paper` | 論文或正式研究成果 |
| `tool` | 可直接使用、範圍相對單一的工具或服務 |

`resource_kind` 與 `source.type` 可以不同，例如 Threads 上的 Cloudflare 實作教學可同時是：

```yaml
source:
  type: article
resource_kind:
  ai: tutorial
  user: null
```

## 所有權

Human Navigation 與 Resource Kind 都遵守：

```text
effective_value = user ?? ai
```

AI 更新不得覆蓋 `navigation.categories.user` 或 `resource_kind.user`。

## 系統邊界

Human Navigation 只供 Radar、Graph 篩選／上色與 Card 頁面顯示使用。Relation、Embedding 與 Concept Graph 仍沿用既有 semantic classification，因此調整 Human Navigation 不需要也不應重算語意距離。
