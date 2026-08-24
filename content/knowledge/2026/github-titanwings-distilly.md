---
schema_version: 1
id: github-titanwings-distilly
title: Distilly
canonical_url: https://github.com/titanwings/distilly
source:
  type: github
  url: https://github.com/titanwings/distilly
  identity: github:titanwings/distilly
resource_kind:
  ai: skill
  user: null
created_at: 2026-08-24
updated_at: 2026-08-24
last_checked_at: 2026-08-24
summary: Distilly 是一套人物建模 Agent Skill，將聊天、文件、郵件、公開資料等來源整理成可攜式、以來源為基礎的 Person Profile，再封裝成可被多種 Agent 宿主載入的 Skill；它把人物經驗、判斷、表達方式與工作模式轉成可重用能力，同時保留持續更新與版本回滾機制。
classification:
  categories:
    ai:
      - Agent
      - RAG / Memory / Knowledge
      - SillyTavern / AI RPG
    user: null
  tags:
    ai:
      - agent-skill
      - person-modeling
      - persona
      - source-grounded
      - knowledge-distillation
      - character-ai
      - claude-code
      - codex
      - openclaw
      - lark
      - dingtalk
      - slack
    user: null
relevance:
  ai:
    overall: 5
    ai_rd: 4
    aoi_ai: 1
    llm_agent: 5
    sillytavern_ai_rpg: 5
    image_gen: 2
  user: {}
actions:
  ai:
    - TRY
    - LEARN
    - REFERENCE
  user: null
status:
  ai: active
  user: null
---

# Distilly

## 一句話介紹

Distilly 是一套把「一個人如何思考、判斷、表達與工作」整理成可重用 Person Profile 的 Agent Skill；它從聊天、文件、郵件、公開資料等來源抽取可觀察模式，再把結果封裝成可由多種 Agent 宿主載入的 Skill。

它原名 Colleague Skill，現已從「保存離職同事經驗」擴展為通用人物建模工具，支援 `colleague`、`relationship`、`celebrity` 三種人物類型。專案也明確強調輸出是以來源為基礎的人物描述，不宣稱真正複製或重建一個人的完整人格。

## 它解決什麼問題

許多與人物知識、角色模擬或經驗傳承有關的 Agent 工作流，常停留在一段 persona prompt 或零散筆記。這種做法很難持續更新，也不容易把「這個人通常怎麼判斷」「面對什麼情況會怎麼反應」「他的表達習慣與工作標準是什麼」整理成可攜、可版本化的產物。

Distilly 的切入點是把人物資料處理成一個可安裝的 Person Profile：來源材料先依人物類型進入不同的蒐集與分析流程，再產生對應 Skill。如此可把人物經驗與行為模式從一次性對話提示，提升成能被不同 Agent 重複載入、修正與演化的能力單元。

這裡的「蒸餾」比較接近知識與行為模式整理，不是神經網路中的模型蒸餾。

## 核心概念

### Person Profile 是主要輸出

Distilly 不把最終成果視為一段長 prompt，而是建立可重用的 Person Profile，並將其封裝成 Agent Skill。來源材料可以包含訊息、文件、郵件、圖片、PDF、公開內容或手動描述。

### 三種人物類型使用不同分析策略

目前內建三種 family：

- `colleague`：重點是技術標準、工作流程、判斷方式、表達與職場行為。
- `relationship`：重點是表達模式、情緒觸發、衝突與修復模式等互動特徵。
- `celebrity`：搭配研究工具鏈，從作品、訪談、公開內容與時間線建立較有來源脈絡的人物描述。

這種分流比用同一份 persona 模板處理所有人物更合理，因為不同關係與資料來源能支持的推論範圍不同。

### 以來源為基礎，而不是宣稱「複製人格」

README 明確把 Distilly 定位為 person-modeling layer，輸出應建立在可觀察的經驗、決策模式、表達方式與工作習慣上。這個邊界很重要：生成的 Skill 是對來源材料的結構化近似，不應被當成真實人物本身。

### 產物可以持續演化

除了建立新 Skill，Distilly 也支援追加新資料、對錯誤人物行為進行修正、版本管理與回滾。這使 Person Profile 更接近可維護的長期狀態，而不是一次生成後固定不變的角色卡。

## 架構與技術

這個 Repository 的主要交付物是根目錄的 `SKILL.md`，目前 frontmatter 名稱為 `distilly`、版本為 `1.0.0`，並標示為可由使用者直接調用。Skill 本身需要宿主具備本地檔案讀寫與 Bash／Python 執行能力。

目前文件列出的原生本地 Skill 宿主包括：

- Claude Code
- OpenClaw
- Hermes
- Codex
- DeepSeek Harness
- Pi coding agent
- Grok Build
- OpenCode

不同宿主的顯式呼叫語法不同，例如 Claude Code 可使用 `/distilly`，Codex 使用 `$distilly` 或從 `/skills` 選取，Pi 使用 `/skill:distilly`。Grok Bot 目前只有 saved/private Skill 的手動遷移預覽，專案沒有宣稱可直接匯入本地 `SKILL.md`。

資料入口涵蓋：

- Lark／飛書訊息、文件與試算表
- DingTalk／釘釘
- Slack
- WeChat 匯出的 SQLite 聊天紀錄
- `.eml`／`.mbox` 郵件
- PDF、圖片、截圖
- Markdown 或直接貼上的文字
- `celebrity` 流程可選擇透過第三方 Xquik 蒐集公開 X 貼文候選證據

Repository 內提供多個 Python 工具處理來源蒐集、解析、安裝、研究、版本管理與 Skill 寫入。基本依賴包含 `requests`；Playwright、`slack-sdk`、`python-docx`、`openpyxl` 等則依資料來源與功能選用。

生成後的 Skill 預設寫到 `./skills/{character}/{slug}/`，再透過安裝工具部署到支援的 Agent 宿主。Repository 也包含涵蓋 CLI lifecycle、設定遷移、不同宿主安裝、研究工具與 Skill writer 的測試檔案，顯示專案除了提示詞之外，也把不少跨宿主與資料處理行為落成可測試工具。

## 主要功能

- 透過 `distilly` 建立 `colleague`、`relationship` 或 `celebrity` Person Profile。
- 從企業協作工具、郵件、文件、圖片、聊天匯出與直接文字等多種來源蒐集材料。
- 依人物 family 套用不同 intake、分析維度與輸出結構。
- 將人物描述封裝成可安裝的 Agent Skill，而不是只輸出一般提示詞。
- 支援對既有 Skill 追加材料與對話式修正。
- 提供版本管理與回滾機制，方便持續演化人物模型。
- 提供多個 Agent 宿主的安裝器與路徑規則。
- `celebrity` family 提供字幕下載、逐字稿整理、研究合併與品質檢查工具鏈。
- 支援公開 X 貼文候選資料的選用式蒐集，但要求人工驗證作者與永久連結後再整理進研究資料。

## 技術亮點

### 把 persona 從「文字設定」提升成可攜式能力單元

Distilly 最值得參考的地方不是人物模仿本身，而是把人物建模輸出包成 Agent Skill。這讓 persona 可以具有安裝、發現、版本、更新與跨宿主部署等工程屬性，比單純保存在 system prompt 或角色卡更接近可維護的 Agent 元件。

### 依人物關係切換資料模型

`colleague`、`relationship`、`celebrity` 並不是只換名稱，而是採用不同來源策略與分析維度。這種做法承認「可從工作文件推論的內容」和「可從私人互動或公開訪談推論的內容」並不相同，有助於降低把單一 persona schema 套到所有情境的失真。

### 把資料蒐集、分析與部署串成完整流水線

Repository 不只有 `SKILL.md`，還包含 Lark、DingTalk、Slack、郵件、研究資料等 collector／parser，以及跨宿主安裝與品質檢查工具。對 Agent 工程而言，這比只提供 prompt template 更接近一個可操作的「來源 → 人物模型 → Skill → 宿主」流程。

### 將人物模型視為可更新狀態

追加資料、對話修正、版本管理與回滾使人物模型可以隨新證據演化。這個概念也能泛化到長期 Agent memory、偏好模型與組織知識角色：輸出不一定要重新從頭生成，而可以有版本與變更歷史。

## 限制與風險

- **隱私與同意是核心風險**：Distilly 可處理私人聊天、郵件、工作文件、家人／伴侶互動等高度敏感資料。即使技術上能取得資料，也不代表使用者一定有權把第三人的內容轉成可長期使用的 Person Profile；實際使用前應先處理授權、目的限制與資料保存政策。
- **憑證管理需要特別小心**：部分自動蒐集流程需要 `app_secret`、OAuth token、Slack Bot 權限或第三方 API key。這些憑證不應被寫進生成 Skill、公開 Repository 或長期人物資料。
- **人物模型仍可能失真**：來源為基礎只能降低無根據推論，不能消除 LLM 對有限樣本的過度概括。資料量少、情境偏斜或時間跨度不足時，Person Profile 可能把暫時行為錯當成穩定特質。
- **宿主相容性仍不完全一致**：各 Agent 的 Skill discovery、安裝位置與顯式呼叫方式不同；Grok Bot 的本地 `SKILL.md` 直接安裝尚未驗證。
- **部分資料來源有平台限制**：README 註明目前 Lark 自動蒐集相容層使用中國區 `open.feishu.cn`／`feishu.cn`，國際版 `larksuite.com` tenant routing 尚未實作；Roadmap 也仍把 Windows 相容性改善列為待辦。
- **第三方研究來源增加外部依賴**：公開 X 貼文蒐集可選用 Xquik，屬計量付費的獨立第三方服務；候選資料仍需人工驗證，不能直接視為可信研究結果。
- **專案仍在快速演化**：Repository 建立於 2026 年 3 月，雖已具有大量社群關注、測試與多宿主支援，但名稱、安裝方式與 Roadmap 在短期內都有明顯變動，導入時仍應鎖定版本並重新檢查文件。

## 與你的相關性

依公開技術 profile，Distilly 對 **LLM／Agent** 與 **SillyTavern／AI RPG** 兩個方向都具有高度相關性。

對 Agent 工程而言，它示範了如何把 persona、長期人物知識與來源蒐集流程從單一 prompt 拆成可安裝、可版本化、可跨宿主使用的 Skill。這對研究 Agent 記憶、角色狀態、工作流封裝與能力分發都有參考價值。

對 SillyTavern／AI RPG 類應用而言，`relationship`、`celebrity` 與未來的多人物協作／關係圖方向尤其值得觀察。它提供的價值不只在角色口吻，而是嘗試把來源、行為模式、演化與部署納入同一套角色建模流程。

對 AOI × AI 幾乎沒有直接關聯；影像生成目前也不是核心能力，Roadmap 中的視覺、語音與影片仍屬後續多模態方向。

## 建議怎麼使用

建議先以 `TRY`、`LEARN`、`REFERENCE` 的方式評估，而不是一開始就把真實私人聊天或公司資料大量匯入。

較安全且有技術價值的試法是：

1. 先使用公開人物、虛構角色或刻意準備的低敏感度資料建立 Person Profile。
2. 檢查生成 Skill 是否能把來源證據與推論分清楚，並觀察它在不同問題下的人物一致性。
3. 測試追加資料、錯誤修正與版本回滾，確認「人物演化」是否真的比重建 prompt 更可控。
4. 若要研究 Agent 基礎設施，再比較同一份生成 Skill 在 Codex、Claude Code、OpenClaw 等宿主的 discovery、呼叫與行為差異。
5. 真正導入私人或企業資料前，再獨立設計權限、同意、憑證與資料保存規則。

## 與其他收藏的關聯

目前不建立未驗證的固定 Card 連結。概念上它與 Agent Skill、長期記憶／人物狀態、角色 AI 與多 Agent 人格協作類收藏高度相關，後續可由知識圖譜依實際已存在的 Card 建立關聯。

## 使用者備註

## 更新紀錄

### 2026-08-24

- 建立 Distilly Knowledge Card。
