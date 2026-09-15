---
schema_version: 1
id: github-eternityspring-shuohao-skills
title: shuohao-skills
canonical_url: https://github.com/eternityspring/shuohao-skills
source:
  type: github
  url: https://github.com/eternityspring/shuohao-skills
  identity: github:eternityspring/shuohao-skills
resource_kind:
  ai: skill
  user: null
navigation:
  categories:
    ai:
      - Video Creation
      - Agent / Harness
      - Image Creation / Design
    user: null
created_at: 2026-09-15
updated_at: 2026-09-15
last_checked_at: 2026-09-15
summary: shuohao-skills 是一套給 Claude Code 與 Codex 使用的 AI 短劇製作 Agent Skills，將小說改編拆成大綱、角色、美術、劇本與分鏡五個可獨立執行又能用結構化 JSON 串接的階段。它的特色是把生成式創作與 Node.js 確定性品質門分開：模型負責內容決策，腳本負責時長、引用、資產對帳、提示詞格式與分鏡等可機械檢查的約束，並可輸出 Markdown、HTML 評審報告與投產資料。
classification:
  categories:
    ai:
      - Agent
      - LLM
      - Image Generation
    user: null
  tags:
    ai:
      - agent-skill
      - Claude Code
      - Codex
      - AI short drama
      - novel adaptation
      - character bible
      - art bible
      - screenplay
      - storyboard
      - AI video
      - imagegen
      - MiniMax H3
      - Node.js
      - deterministic validation
      - quality gates
      - structured JSON
    user: null
relevance:
  ai:
    overall: 4
    ai_rd: 4
    aoi_ai: 1
    llm_agent: 5
    sillytavern_ai_rpg: 3
    image_gen: 5
  user: {}
actions:
  ai:
    - TRY
    - INTEGRATE
    - LEARN
    - REFERENCE
  user: null
status:
  ai: active
  user: null
---

# shuohao-skills

## 一句話介紹

shuohao-skills 是一套面向 Claude Code 與 Codex 的 **AI 短劇製作 Agent Skills**，把「小說 → 短劇」拆成五個可重用工作階段：改編大綱、角色設定、美術設定、劇本與分鏡；每一階段都有自己的 `SKILL.md`、結構化 JSON、確定性驗證腳本與可視化評審報告。

它不是一個完整影片生成平台，也不是單一超長提示詞。更精確地說，它把短劇前製與生成準備整理成一組可以被 Agent 執行、驗證、反覆修改，最後交給影像／影片／TTS 生成管線的工作流模組。

## 它解決什麼問題

AI 短劇製作真正困難的地方，不只是「讓模型幫忙寫故事」，而是多個產物必須長期互相一致：

- 大綱決定角色、爽點、場景與敘事道具，但後續常會各自重新解讀，造成角色分級、場景清單或劇情資產漂移。
- 劇本需要符合單集時長、人物與場景設定，但純靠模型自我檢查容易漏掉超時、缺鉤子、引用不存在角色等問題。
- 角色與場景生成需要跨集一致；若每次重新描述，外觀、光照、道具尺度與提示詞格式很容易失控。
- 分鏡必須把劇本節拍轉成可生成的短片段，還要對齊切點、關鍵幀與影片模型提示詞。
- 多輪修改後，最大的成本常不是重新生成，而是確認「改了上游之後，下游哪裡壞了」。

shuohao-skills 的核心解法是：**把創意判斷交給模型，把可以程式化的約束交給驗證器。** 上游資料以 JSON 傳遞，下游透過 `seed`、`validate` 與對帳機制使用已決定的事實，而不是每一層再讓模型重新猜一次。

## 核心概念

### 五段工作流，而不是一個巨型 Skill

Repository 目前包含五個主要 Skill：

1. **`novel-outline`**：把小說整理成改編說明、人物表、爽點表、分集梗概與資產清單。
2. **`novel-characters`**：把角色清單擴寫為人物画像、外觀提示詞、音色提示詞與角色設定圖。
3. **`novel-art`**：建立場景與敘事道具的美術設定、一致性錨點、狀態變體與生成提示詞。
4. **`novel-script`**：把分集梗概落成場次與節拍流，將動作和逐句台詞結構化，並估算單集時長。
5. **`novel-storyboard`**：把劇本切成可生成的段、鏡頭與關鍵幀，並輸出 MiniMax H3 導向的影片提示詞與投產資料。

來源文件把大綱放在最上游；角色、美術與劇本形成需要同步迭代的收斂層；分鏡則偏向**落實既有決策**，不應再重新改寫角色、劇情或場景設定。

### 生成式內容與確定性品質門分離

這個專案最明顯的設計取向，是不把「請模型記得檢查」當成品質保證。

例如：

- `novel-outline` 有 14 道程式化品質門，檢查角色分檔、主場景數、爽點間隔、每集鉤子、資產引用等。
- `novel-art` 有 11 道品質門，檢查一致性錨點、提示詞語言、人物污染、道具尺度、白底無手等條件。
- `novel-script` 有 10 道品質門，檢查單集時長容差、台詞長度、說話人、冷開場鉤子、爽點認領與上游角色／場景／道具引用。
- `novel-storyboard` 的來源描述標示 17 道品質門，並可選擇額外掛入 shot-recipe 卡庫檢查。
- `novel-characters` 則會驗證資料結構、人物引文、角色歸併、語言分工，以及出圖／TTS 提示詞等要求。

這種做法把「LLM 產生內容」與「程式驗證不變量」切成兩層，較適合長鏈工作流反覆修改。

### 結構化交接，而不是靠聊天記憶

各 Skill 的核心產物分別是 `outline.json`、`cast.json`、`art.json`、`script.json` 與 `storyboard.json`。

下游 Skill 會盡量從上游 JSON 搬運已經決定的事實，例如角色 ID、場景清單、敘事道具、爽點與集數，再把「這一層才該做的設計」留給模型補完。這能降低多階段工作流中常見的重新推理與資料漂移。

### 報告是工作產物的一部分

五個 Skill 都能把 JSON 渲染成 Markdown 與 HTML 評審報告；Repository 另外提供 `scripts/report.mjs`，可以把已完成的幾個階段合成單頁報告。

這個組裝器不直接 import 各 Skill 實作，而是呼叫各自的 `render --html` 再處理 CSS、腳本作用域與圖片路徑，讓各 Skill 仍維持獨立可用。

## 架構與技術

Repository 的核心不是大型 Runtime，而是 **Skill 規格 + Node.js 工具腳本 + references + examples**。

典型 Skill 結構包含：

```text
skills/<skill-name>/
├── SKILL.md
├── scripts/
├── references/
├── examples/
└── assets/
```

主要技術特徵：

- **Host**：Claude Code、Codex。
- **執行環境**：Node.js 18 以上。
- **依賴**：主要腳本只使用 Node.js 標準函式庫，不需要 `npm install`。
- **模型使用**：直接使用目前 Agent 會話的模型額度，不要求額外 API key。
- **出圖**：角色、美術與部分分鏡流程可選擇使用 Codex 內建的 `$imagegen`；沒有 Codex 時可以跳過圖片生成，其他結構化產物仍可繼續。
- **影片提示**：分鏡 Skill 目前對 MiniMax H3 有明確提示詞與切點對帳設計。
- **授權**：Repository 採 Apache-2.0。

根目錄的 `scripts/install.sh` 會偵測 `~/.claude` 與 `~/.codex`，再把選定的 Skill 以 symbolic link 放入相對應 skills 目錄。安裝器只會覆蓋既有 symbolic link；若目標是一般實體目錄，會跳過而不是直接刪除。

## 主要功能

- **小說改編大綱**：支援長篇分卷、改編骨架、爽點與分集規劃，也能對既有大綱只跑品質體檢。
- **角色設定集**：從上游角色清單或原文建立角色卡、人物画像、形象提示詞、聲音設計與可選角色設定圖。
- **場景／道具美術設定**：建立跨集一致性錨點、光照變體、道具狀態、尺度參照與白底資產提示詞。
- **結構化劇本**：把動作與台詞拆成節拍流，逐句保留說話人與語氣，並用可調語速估算每集時長。
- **分鏡與投產資料**：把劇本轉成短片段、鏡頭、關鍵幀、影片提示詞與匯出清單。
- **多語報告介面**：README 說明五段報告都支援中英文介面。
- **單頁總報告**：可將目前已完成的階段整併成一張可切換的 HTML。
- **自測**：各 Skill 的腳本都有大量純程式斷言，用來測試驗證器、資料合成與渲染邏輯，不需要調模型。

## 技術亮點

### 品質門是可執行契約

很多 Agent Skill 的規則仍停留在「請務必遵守」；shuohao-skills 更進一步把大量要求寫成 `validate` 與 `selftest`。

這代表品質規則不只存在於提示詞，也能被測試、破壞、修正與回歸驗證。對 Agent Workflow 設計來說，這是一個很實用的方向：**模型負責模糊判斷，程式負責確定性不變量。**

### 上游只傳事實，下游只補自己的設計

`seed` 機制的價值不只是方便填欄位，而是明確區分「上一層已拍板」與「這一層才應該決定」的責任。

例如大綱先決定角色 ID、分級、場景與敘事道具；角色、美術與劇本再各自擴充，而不是每個 Skill 重新從小說全文推導一次。這是一種很適合多 Agent／多 Skill 流程的資料契約思路。

### 把生成資產一致性當成一等公民

角色設定圖、場景錨點、道具狀態與分鏡參考圖，都不是單純「多生幾張圖」。來源文件反覆把一致性拆成可以被描述與核對的資料，例如場景錨點、變體母體、道具尺度與角色別名。

這使它比單純的影片提示詞模板更接近一套**生成式製作資產管理方法**。

### 評審報告與機器資料同時存在

JSON 是機器交接格式；Markdown／HTML 則讓人類可以檢查 KPI、品質門、時長、角色、場景與生成批次。這種「同一份結構化來源，同時服務 Agent 與人工審查」的做法，對較長的生成工作流特別有價值。

## 限制與風險

- **領域規則不是通用標準**：角色數、爽點間隔、單集時長估算、鏡頭長度等品質門都帶有作者對 AI 短劇製作的假設。部分門檻可透過參數調整，但不應直接視為所有平台或題材的最佳實務。
- **分鏡提示目前明顯針對 MiniMax H3**：若改用其他影片模型，鏡頭結構仍可參考，但提示詞格式、切點控制與模型能力假設需要重新驗證。
- **Host 能力不完全可攜**：Skill 會使用 Read、Write、Bash、Task、Glob 等工具；圖片流程又依賴 Codex 的 `$imagegen`。移植到其他 Agent Host 時，需要確認工具名稱、子代理能力與檔案權限。
- **安裝腳本偏 Unix 工具鏈**：官方安裝方式使用 Bash、`ln -s` 與 home directory 下的 skills 目錄；不具備相同 shell／symlink 行為的環境需要改用手動或等效安裝方式。
- **Agent Skill 仍具有檔案與命令執行權限**：Repository 本身公開且腳本可審查，但正式放入 Agent skills 目錄前仍應閱讀 `SKILL.md` 與 scripts，確認允許的 Bash／Write 行為符合自己的執行環境。
- **專案仍很新且快速演進**：GitHub metadata 顯示 Repository 建立於 2026-08-06，檢查日之前仍有近期更新；目前設計成熟度可以從大量自測與變更紀錄觀察，但長期 API／schema 穩定性仍需時間驗證。
- **時長與生成品質是近似模型**：例如劇本時長是依字數與動作節拍估算；通過驗證代表符合專案定義的結構條件，不代表實際 TTS、影片生成或成片節奏必然符合預期。

## 與你的相關性

依公開技術 Profile，這個專案與 **LLM／Agent** 和 **AI Image Generation** 的相關性最高。

在 Agent 面向，它展示了一種比純提示詞更工程化的 Skill 設計：`SKILL.md` 負責任務語意與流程，JSON 負責跨階段契約，Node.js 驗證器負責確定性規則，自測則把品質門變成可以回歸測試的程式。這些模式不只適用短劇，也很適合拿來研究「如何把複雜工作流程封裝成可維護 Agent Skill」。

在影像生成面向，角色、場景、道具與分鏡都圍繞一致性資產設計，尤其是場景錨點、狀態變體、參考圖與提示詞對帳，具有很高的工作流參考價值。

它和 AOI × AI 的直接關聯很低；與 SillyTavern／AI RPG 則有間接關聯，主要在角色設定、世界資產、敘事結構與多階段內容生成方法，而不是對話 Runtime 或角色記憶本身。

## 建議怎麼使用

建議動作是 **TRY / INTEGRATE / LEARN / REFERENCE**。

最值得先做的不是一次跑完整本小說，而是挑一個短篇樣本，依序測：

1. 先跑 `novel-outline`，觀察「LLM 生成 + 程式品質門」的實際互動。
2. 再挑 `novel-art` 或 `novel-characters`，檢查上游 JSON 是否真的能降低重複推理與設定漂移。
3. 若關心 Agent Skill 架構，直接閱讀各 Skill 的 `SKILL.md`、`references/`、`validate` 與 `selftest`，比只看最終短劇結果更有研究價值。
4. 真正要接影片生成管線時，再評估 `novel-storyboard` 對 MiniMax H3 的提示格式是否需要抽象成可替換的 model adapter。

如果只想借鑑架構，也很值得把它當成「**生成式決策 + deterministic validator + structured handoff**」的完整案例，而不必採用它的短劇製作規則本身。

## 與其他收藏的關聯

- [Skills For Real Engineers](./github-mattpocock-skills.md)：同樣把工程／工作方法封裝成 Agent Skill；shuohao-skills 更強調結構化產物與可執行品質門，可用來比較 prompt-driven discipline 與 deterministic validation 的差異。
- [Diagram Design](./github-cathrynlavery-diagram-design.md)：兩者都把創意／視覺任務做成 Agent Skill，並透過明確設計規則與驗證流程降低輸出漂移。
- [Suno v6 Songcraft](./github-salsensei-suno-v6-songcraft.md)：都是生成式內容領域的專用 Skill；Songcraft 偏音樂研究與文字約束，shuohao-skills 則展示多階段影音資產如何透過 JSON 與品質門串成生產流程。
- [book-to-skill](./github-virgiliojr94-book-to-skill.md)：可從 Skill 結構、漸進式載入與可維護知識封裝的角度對照；前者把長文件編譯成 Skill，shuohao-skills 則直接把特定產業流程封裝成一組可執行 Skill。

## 使用者備註

## 更新紀錄

### 2026-09-15

- 建立 Knowledge Card。
- 依 Repository metadata、README、安裝腳本、CHANGELOG 與多個 `SKILL.md` 分析五段 AI 短劇製作流程、結構化交接、品質門與 Host 依賴。
