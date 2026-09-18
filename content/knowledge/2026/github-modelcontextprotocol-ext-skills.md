---
schema_version: 1
id: github-modelcontextprotocol-ext-skills
title: MCP Skills Extension (ext-skills)
canonical_url: https://github.com/modelcontextprotocol/ext-skills
source:
  type: github
  url: https://github.com/modelcontextprotocol/ext-skills
  identity: github:modelcontextprotocol/ext-skills
resource_kind:
  ai: reference
  user: null
navigation:
  categories:
    ai:
      - Agent / Harness
    user: null
created_at: 2026-09-18
updated_at: 2026-09-18
last_checked_at: 2026-09-18
summary: Model Context Protocol 官方 Skills extension 規格與工作組儲存庫，定義如何透過 MCP Resources 發現、取得與驗證 Agent Skills，包含 skills/list、skills/get、逐檔雜湊完整性與可選的目錄讀取機制。
classification:
  categories:
    ai:
      - Agent
      - LLM
    user: null
  tags:
    ai:
      - MCP
      - Model Context Protocol
      - Agent Skills
      - Skills Extension
      - SEP-2640
      - skills/list
      - skills/get
      - resources/read
      - progressive-disclosure
      - content-integrity
    user: null
relevance:
  ai:
    overall: 5
    ai_rd: 4
    aoi_ai: 1
    llm_agent: 5
    sillytavern_ai_rpg: 3
    image_gen: 1
  user: {}
actions:
  ai:
    - LEARN
    - REFERENCE
    - WATCH
  user: null
status:
  ai: active
  user: null
---

# MCP Skills Extension (ext-skills)

## 一句話介紹

`ext-skills` 是 Model Context Protocol 官方 Skills extension（`io.modelcontextprotocol/skills`）與 Skills Over MCP Working Group 的規格儲存庫，目標是讓 Agent Skills 不只存在本機檔案系統，也能透過 MCP 以可發現、可逐步載入、可驗證的 Resources 形式提供給 Host。

## 它解決什麼問題

Agent Skills 的核心格式是 `SKILL.md` 加上可選的 supporting files；如果技能只能依賴本機檔案系統，MCP Server 很難把與自身工具配套的操作知識、範本與參考資料一起遠端提供給 Agent。這會造成技能發布、版本同步、來源識別與 Host 載入行為缺乏共同協定。

Skills extension 將這個問題定位為「如何透過 MCP 傳輸與發現技能」，而不是重新定義 Agent Skills 格式。它利用既有 Resources primitive 傳遞技能檔案，再補上技能列舉、單一技能查詢、內容完整性與可選目錄瀏覽能力。

## 核心概念

- **Skills as Resources**：技能內容沿用 MCP Resources，而不是新增一個完全獨立的內容 primitive。這讓 `resources/read`、URI 定址與既有 Resource 客戶端能力可以直接重用。
- **格式與傳輸分離**：技能本體仍遵循 Agent Skills 規格；MCP Skills extension 只規範如何宣告、發現、傳輸與驗證。
- **漸進式揭露（progressive disclosure）**：Host 可以先取得輕量技能中繼資料，需要時才讀取 `SKILL.md`，再依工作流程讀取 supporting files，避免把整個技能目錄一次塞進模型上下文。
- **內容完整性**：可驗證技能會列出檔案與摘要資訊，Host 在實際讀取時核對內容，讓使用者核准可以綁定到一組具體資源，而不是只相信技能名稱。
- **來源與身分分離**：技能名稱是標籤，不應被當成全域唯一識別；規格要求 Host 正確處理不同來源的同名技能與來源邊界。

## 架構與技術

這個 extension 以 MCP extension capability `io.modelcontextprotocol/skills` 進行協商，主要協定面包含：

- `skills/list`：列出 Server 可提供的技能項目；列舉可以是空的或不完整，因此「沒有出現在列表中」不代表 Server 一定沒有該技能。
- `skills/get`：依技能 URI 取得單一技能項目，也能處理未出現在 `skills/list` 的技能。
- `resources/read`：沿用 MCP 基礎 Resources 讀取 `SKILL.md` 與 supporting files。
- `resources/directory/read`：可選能力，用於列出一個目錄 Resource 的直接子項目，讓 Agent 可以像瀏覽目錄一樣逐步探索技能檔案。

規格建議使用 `skill://<skill-path>/<file-path>` 形式，但 `skill://` 並不是具有特殊信任語意的 privileged scheme；Host 應由 `skills/list` 或 `skills/get` 的回應辨識技能，而不是僅看 URI scheme。

官方穩定規格位於 `specification/stable/skills.mdx`，目前文件標示它是對應 MCP base protocol revision `2026-07-28` 的 released snapshot。SEP-2640 已標記 Final，相關決策與設計取捨則保留在 decision log 與 rationale 文件中。

## 主要功能

- **技能發現**：提供標準化的 `skills/list`，讓 Host 建立技能 registry。
- **單一技能查詢**：透過 `skills/get` 取得指定 URI 的技能資訊，降低重新列舉大型 catalog 的成本。
- **按需讀取**：使用既有 `resources/read` 只在技能或 supporting file 真正需要時載入內容。
- **目錄瀏覽**：Server 可選擇宣告 `directoryRead`，提供 scoped directory listing。
- **逐檔完整性驗證**：對可固定內容的技能，以逐檔摘要資訊綁定技能資源集合並驗證後續讀取。
- **來源與核准邊界**：規格處理跨 Server 名稱衝突、內容變更後既有核准失效，以及巢狀技能啟用時需要獨立處理的安全邊界。

## 技術亮點

第一個亮點是**沒有為 Skills 再造一套平行內容傳輸機制**。Working Group 選擇讓技能檔案落在 Resources 模型中，只新增必要的技能索引與單筆查詢能力，降低 MCP 生態的協定複雜度。

第二個亮點是 `skills/get` 與「列舉不必完整」的組合。大型、動態或由 gateway 提供的技能 catalog 不必強迫 Server 一次列出全部技能；已知 URI 仍可直接查詢與讀取。

第三個亮點是**完整性與信任刻意分離**。逐檔 digest 可以確認「實際讀到的內容是否仍等於使用者核准時看到的那組內容」，但 digest 與內容都可能由同一 Server 提供，因此它不是身分驗證或信任來源本身的安全邊界。

第四個亮點是 v1 放棄 archive distribution，改用獨立可定址 Resources。這避免 Host 額外承擔解壓縮、path traversal、連結逃逸與壓縮炸彈等封裝攻擊面，也更符合按需載入的模型。

## 限制與風險

- **生態支援仍在導入期**：規格本身已是 stable snapshot，但儲存庫的 implementations 清單顯示多個官方 SDK 仍處於 `in progress`，許多 Host 也只有 `partial` 支援；實際可用性要看 Server、SDK 與 Host 的組合。
- **Digest 不等於信任**：摘要能偵測內容是否和宣告值一致，但不能證明 Server 本身可信，也不能防禦同時竄改 manifest 與內容的來源。
- **動態技能較難持久核准**：若技能內容無法提供穩定、完整的資源摘要集合，Host 無法把既有核准可靠地綁定到特定內容版本。
- **Host 實作責任仍高**：來源標示、同名技能衝突、跨來源讀取、快取隔離、核准 UX 與安全政策都需要 Host 正確處理。
- **不是可直接安裝的 SDK**：此 Repository 的主要角色是規格、決策紀錄與 Working Group 文件；真正整合需要依賴支援此 extension 的 MCP SDK、Server 或 Host 實作。

授權方面，Repository 的程式碼採 Apache-2.0；文件另標示為 CC-BY-4.0。

## 與你的相關性

對公開技術背景中的 LLM／Agent 領域而言，這是高價值的基礎規格：它直接涉及 Agent 如何取得可重用技能、如何把遠端技能納入 Harness，以及如何在載入內容時維持來源與完整性邊界。

對 AI R&D 也具有架構參考價值，特別是漸進式載入、內容摘要、使用者核准狀態與遠端／本機技能統一抽象等議題。對 AOI × AI 與影像生成本身沒有直接方法論貢獻，但若相關系統採用 Agent／MCP 架構，仍可能成為工具知識與工作流程分發的底層協定。

對 SillyTavern／AI RPG 類應用則屬間接但值得關注：若未來角色 Agent 或外掛生態開始透過 MCP 提供技能，這套規格可作為遠端技能發現、載入與安全控制的互通基礎。

## 建議怎麼使用

- **LEARN**：先讀穩定規格與 rationale，理解 Skills over MCP 為何選擇 Resources、`skills/list`／`skills/get` 與逐檔完整性模型。
- **REFERENCE**：若設計自己的 Agent Harness、MCP Host、Server 或技能發布流程，可把此規格當成遠端 Skills 互通與安全邊界的主要參考。
- **WATCH**：持續觀察官方 TypeScript、Python、Go、C# SDK 與主要 Host 的支援進度；等目標執行環境具備完整相容性後，再評估實際整合。

## 與其他收藏的關聯

目前未建立實際卡片連結。後續若收錄 MCP SDK、Agent Skills 規格、MCP Host／Harness 或 Skill registry 類專案，可將本卡作為「Skills 傳輸與互通規格」的上游參考節點。

## 使用者備註


## 更新紀錄

### 2026-09-18

- 首次收錄。
- 確認 `specification/stable/skills.mdx` 為 Skills extension 的規格來源。
- 記錄 SEP-2640 Final、`skills/list`、`skills/get`、可選 `resources/directory/read` 與逐檔完整性驗證等核心設計。
