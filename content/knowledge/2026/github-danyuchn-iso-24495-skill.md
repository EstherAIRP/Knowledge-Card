---
schema_version: 1
id: github-danyuchn-iso-24495-skill
title: ISO 24495 Skill
canonical_url: https://github.com/danyuchn/iso-24495-skill
source:
  type: github
  url: https://github.com/danyuchn/iso-24495-skill
  identity: github:danyuchn/iso-24495-skill
created_at: 2026-08-14
updated_at: 2026-08-14
last_checked_at: 2026-08-14
summary: ISO 24495 Skill 是一套供 Claude Code 使用的雙語 Plain Language Skill，將 ISO 24495-1 的 Relevant、Findable、Understandable、Usable 四項讀者結果轉成固定改寫流程，並為英文與繁體中文分別提供技法層；繁中層特別處理歐化長句、公文腔、成語堆疊、中英夾雜與指代不明。
classification:
  categories:
    ai:
      - Agent
      - AI Coding / DevTools
      - General Tools
    user: null
  tags:
    ai:
      - ISO 24495
      - plain language
      - Claude Code
      - agent skill
      - Traditional Chinese
      - bilingual rewriting
      - technical writing
      - reader-centered writing
    user: null
relevance:
  ai:
    overall: 4
    ai_rd: 3
    aoi_ai: 1
    llm_agent: 4
    sillytavern_ai_rpg: 2
    image_gen: 1
  user: {}
actions:
  ai:
    - TRY
    - INTEGRATE
    - REFERENCE
  user: null
status:
  ai: active
  user: null
---

# ISO 24495 Skill

## 一句話介紹

ISO 24495 Skill 是一套給 Claude Code 載入的 Plain Language Skill，把 ISO 24495-1:2023 的四項核心讀者結果——**Relevant、Findable、Understandable、Usable**——轉成可重複執行的改寫程序，並分別提供英文與繁體中文技法層。

## 它解決什麼問題

一般「write plainly／寫白話一點」提示詞常把淺白寫作理解成縮短句子、換簡單詞或降低語氣正式度，但 ISO 24495-1 的核心其實是讀者能不能找到需要的資訊、第一次閱讀就理解，以及看完之後能採取行動。

這個 Skill 的切入點是把這些結果拆成明確流程：先確定讀者與目的，再決定內容是否相關、結構是否容易定位、文字是否容易理解，以及指示是否真的可執行。它因此不只處理句子層級，也會調整內容取捨、資訊排序、標題、段落與下一步。

另一個主要問題是語言差異。專案沒有把英文 plain-language 技巧直接翻譯成中文，而是為繁體中文建立獨立技法層，針對歐化長句、公文腔、成語／四字套語、中英夾雜、被字句濫用與指代不明等中文常見問題設計規則。

## 核心概念

核心模型可以理解成四層檢查，而且有明確順序。

1. **Relevant**：先確認讀者是誰、目的為何，只保留對這個讀者有用的內容。
2. **Findable**：讓讀者不用逐字讀完就能找到重點，例如結論先行、資訊型標題、一段一主題、並列資訊條列化。
3. **Understandable**：降低第一次閱讀的理解成本，包含短句、明確主詞、術語首次定義、減少公文腔與不必要的中英夾雜。
4. **Usable**：把資訊寫成可採取行動的形式，明確寫出誰、做什麼、何時完成，以及條件與下一步。

這個順序很重要。專案明確把 plain language 視為「reader outcome」，不是單純文風，因此如果內容本身不相關或結構以作者為中心，只做句子潤飾仍不算完整套用。

## 架構與技術

Repository 本身不是獨立程式或 SaaS，而是一個 **Claude Code Skill package**。主要結構很小，核心由規則文件組成：

- `SKILL.md`：共用入口，定義觸發情境、適用範圍、四項原則、語言 routing、執行程序與輸出格式。
- `references/principles.md`：整理 ISO 24495-1 公開可取得的原則框架、專案詮釋與著作權邊界。
- `references/english-techniques.md`：英文專用技巧。
- `references/chinese-techniques.md`：繁體中文專用技巧與自查清單。
- `examples/`：提供英文與中文 before／after 範例。

執行時先辨識輸入語言，再載入對應 technique layer；混合語言以主要語言為主。改寫前要求先完整理解原文，並明確禁止刪除事實、數字、條件、範圍限定與具有資訊價值的不確定語氣。預設只輸出改寫後文字；若使用者要求 diff，才改成逐項 before／after 並標示所對應的 principle 與 technique。

這種架構的關鍵不是程式碼，而是 **shared principle layer + per-language technique layer**。新增語言理論上不必重寫整套 Skill，只要增加新的語言技法檔並接上 routing。

## 主要功能

- **英文與繁體中文淺白改寫**：目前有兩套正式 technique layer。
- **讀者與目的導向**：改寫前先辨識 intended reader 與 communication purpose。
- **四原則流程**：依 Relevant → Findable → Understandable → Usable 檢查內容、結構、文字與可執行性。
- **中文專用規則**：處理公文腔、歐化句、中英夾雜、成語堆疊、指代不清與文言殘留。
- **資訊保真**：要求保留事實、數字、條件、scope qualifier 與真實的不確定性。
- **可選 diff 模式**：可列出改寫前後差異，並標明違反或改善的 principle。
- **人類文本與機器文本分流**：明確把 human-facing plain language 與 agent-facing controlled language 分開；後者建議使用 ASD-STE100 類 controlled-language 方法。

## 技術亮點

第一個亮點是 **把寫作品質變成可執行的 Agent Skill workflow**。與只塞一段「簡潔、清楚」提示詞相比，它把任務拆成 reader identification、language routing、whole-text reading、four-principle rewrite 與 self-check，讓模型有固定的決策順序。

第二個亮點是 **把跨語言原則與語言特定技巧分層**。ISO 24495-1 的原則本身是 language-independent，但真正造成閱讀困難的語言現象並不相同；這個專案沒有假設英文規則可以直接翻譯，而是把中文問題當成獨立 domain knowledge。這種「共用抽象原則 + local technique adapter」的設計也可套用到其他 Agent Skill。

第三個亮點是 **刻意保留 precision boundary**。Skill 不要求為了白話而犧牲精確度；如果簡化會讓條件、範圍或技術意義消失，應保留原內容並指出取捨。這比單純追求短句或低閱讀難度更適合技術文件、政策、公告與 AI 產出。

第四個亮點是 **plain language 與 controlled language 的邊界定義清楚**。專案將「給人看、希望容易找到／理解／使用」與「給機器或高風險維修情境解析、要求低歧義」視為不同問題，避免把同一套寫作規則錯用到 agent prompt 或機器可解析規格。

## 限制與風險

最大的限制是它是 **非官方 ISO 實作**。專案明確說明並未獲 ISO 認可，也沒有重製付費標準全文；它是根據公開 principle framework 與 plain-language 資料建立的實作。因此不能把 Skill 的輸出視為 ISO 認證或正式 conformance 判定。

第二個限制是 **繁中技法層屬原創詮釋**。例如句長約 40 字、一段超過五句、三項以上改條列等數字都是專案自訂的警戒線，而不是 ISO 條文。這些規則適合當 heuristic，不應被當成 deterministic compliance rule。

第三個限制是 **目前只有英文與繁體中文 technique layer**。其他語言只能直接套四項原則，沒有同等深度的語言特定技巧。

第四個限制是 **Skill 的一致性仍取決於模型是否遵守規則**。Repository 主要由 instructions、references 與 examples 構成，沒有獨立的 deterministic rewrite engine；因此不同模型版本、context 狀態與原文複雜度仍可能造成結果差異。

第五個限制是成熟度仍早期。Repository 於 2026-08-13 建立，`SKILL.md` 目前版本為 `0.1.0`；雖然結構清楚、已有範例與來源說明，但長期規則穩定性、更多語言層與系統化評測仍值得觀察。

## 與你的相關性

依公開技術 Profile，這個專案對 **LLM / Agent** 的價值最高，因此 `llm_agent` 評為 4。它提供的是一個相當乾淨的 Skill engineering 案例：如何把抽象標準拆成 shared principles、language routing、reference knowledge、rewrite procedure 與 self-check，而不是只寫一段長 prompt。

對 **AI R&D** 評為 3。它不是模型研究或訓練工具，但很適合用來研究 AI output quality、instruction hierarchy、domain-skill packaging、evaluation rubric 與 human-facing communication。對 AOI × AI 沒有直接技術關聯，因此評為 1；對 SillyTavern / AI RPG 只有間接價值，例如改善說明、設定文件或使用者介面的可讀性，因此評為 2。Image Generation 則沒有直接關聯。

整體評為 4，主要原因是它體積小、可直接試用，而且「原則層與語言技法層分離」很適合作為其他 Agent Skill 的設計參考。

## 建議怎麼使用

- `TRY`：挑一組公文式中文、技術文件、產品公告與 AI 生成說明文字做 before／after，比較是否真的改善「找得到、看得懂、用得上」，而不是只變短。
- `INTEGRATE`：若有 Claude Code 或其他支援 Skill／rules 的 Agent workflow，可把它當作人類可讀文件的最後一道 rewrite pass，特別適合 README、操作說明、公告、UI copy 與報告。
- `REFERENCE`：研究 `SKILL.md` 與 `references/chinese-techniques.md` 的分層方式，作為建立其他 domain-specific Skill 的範本。

若要客觀評估效果，可固定一批原文，讓未使用 Skill 與使用 Skill 的模型分別改寫，再用四項 reader outcome 做人工評分；同時檢查事實、數字、條件與專有名詞是否被錯誤刪減。這會比只比較「哪一版比較順」更接近這個專案真正的設計目標。

## 與其他收藏的關聯

- [Hallmark](./github-nutlope-hallmark.md)：兩者都是把專業判準包成 coding-agent Skill。Hallmark 處理 UI 設計品質與 anti-AI-slop，ISO 24495 Skill 處理 human-facing writing quality；共同點是把模糊品質要求拆成 routing、reference knowledge、具名規則與輸出前檢查。
- [Orca](./github-stablyai-orca.md)：Orca 位於更外層，負責管理 Claude Code 等 coding agent 的 workspace 與 execution lifecycle；ISO 24495 Skill 則是可由其中某個 agent 載入的能力層。兩者可視為 agent runtime 與 agent capability packaging 的不同層次。

## 使用者備註


## 更新紀錄

### 2026-08-14

- 首次收錄 ISO 24495 Skill，整理其 ISO 24495-1 四原則、英文／繁中雙 technique layer、中文淺白規則、precision boundary 與 Claude Code Skill 架構。
