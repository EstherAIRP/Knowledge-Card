---
schema_version: 1
id: github-mexicat-pdoom-video
title: pdoom-video — 確定性程式化音樂錄影帶渲染系統
canonical_url: https://github.com/mexicat/pdoom-video
source:
  type: github
  url: https://github.com/mexicat/pdoom-video
  identity: github:mexicat/pdoom-video
resource_kind:
  ai: project
  user: null
navigation:
  categories:
    ai:
      - Video Creation
      - Audio / Music / Speech
    user: null
created_at: 2026-09-28
updated_at: 2026-09-28
last_checked_at: 2026-09-28
summary: 以 TypeScript／three.js 將音樂錄影帶建成由歌曲時間決定畫面的確定性渲染系統；同一套場景程式同時供瀏覽器預覽與 1080p60／4K60 離線輸出，並用 Demucs、CTC、Whisper 與音訊特徵分析產生逐字歌詞、節拍與起音資料，再以 Playwright、Chrome 與 FFmpeg 完成高品質影片輸出。
classification:
  categories:
    ai:
      - General Tools
    user: null
  tags:
    ai:
      - code-rendered-video
      - deterministic-rendering
      - three.js
      - TypeScript
      - WebGL
      - Bun
      - Vite
      - Playwright
      - FFmpeg
      - audio-analysis
      - forced-alignment
      - CTC
      - Whisper
      - adaptive-sampling
      - motion-blur
      - karaoke-typography
      - Claude-Code
    user: null
relevance:
  ai:
    overall: 4
    ai_rd: 3
    aoi_ai: 1
    llm_agent: 3
    sillytavern_ai_rpg: 1
    image_gen: 4
  user: {}
actions:
  ai:
    - LEARN
    - REFERENCE
  user: null
status:
  ai: active
  user: null
---

# pdoom-video — 確定性程式化音樂錄影帶渲染系統

## 一句話介紹

`pdoom-video` 是一個把完整音樂錄影帶當成「可重現程式」來製作的專案：畫面不是預先剪好的影片素材，而是由歌曲時間 `t`、歌詞時間、節拍與音訊事件共同驅動的 three.js／WebGL 場景，再用同一套程式輸出即時預覽、靜態畫面、接觸表與 1080p60／4K60 成片。

專案作者也明確記錄，概念、分鏡 treatment、歌詞對齊、音訊分析、渲染器與各場景都曾透過 Claude Code 與 Claude（README 記載為 Opus 5.5）協作完成；但實際成片不是由生成式影片模型直接產生，而是由程式化渲染與資料驅動時間軸生成。

## 它解決什麼問題

一般音樂錄影帶製作常把視覺設計、剪輯、歌詞同步與輸出分散在多套工具中；當作品大量依賴精準節拍、逐字歌詞、程序動畫與反覆調整時，傳統時間軸也容易出現版本同步、預覽與正式輸出不一致，以及高品質運動模糊成本過高等問題。

這個專案的切入方式是把整部影片變成一個確定性的渲染函式：

```text
歌曲時間 t
+ 歌詞／音節時間
+ 節拍／小節／段落
+ kick、snare、hat、vocal onset
+ 音量與頻段包絡
→ 場景與動畫狀態
→ 當下影格
```

因此任何指定時間都能重新算出相同畫面，瀏覽器預覽與離線輸出也可以共用同一套場景程式。

## 核心概念

### 1. 影片是一個「時間 → 畫面」的確定性函式

`docs/ENGINE.md` 對場景的核心要求是：畫面原則上只能由 `f.t` 與固定種子的隨機數決定，不能使用 `Math.random()`、`Date.now()` 或其他會讓每次渲染結果不同的狀態。

這個限制看似嚴格，但換來三個重要特性：

- 可以任意 seek 到某個時間直接重建畫面；
- 瀏覽器即時預覽與離線 60 fps 輸出不需要維護兩套邏輯；
- 同一影格可以被多次、不同順序地取樣，支援高品質時間超取樣與運動模糊。

只有真的需要模擬狀態的場景才設為 `stateful`，而這類場景會受到固定取樣數等限制。

### 2. 場景不是硬綁秒數，而是綁到歌詞與音樂結構

渲染引擎把逐字歌詞、節拍、小節、段落、鼓點與音訊包絡變成可查詢資料。場景作者可以透過歌詞內容找到某一行，再取單字開始時間，而不是把 `23.42` 秒這種數字散落在動畫程式裡。

這讓視覺事件能更穩定地跟著：

- 某個單字被唱出的進度；
- downbeat、bar phase；
- kick／snare／hat；
- vocal onset；
- 低、中、高頻或人聲／鼓／貝斯能量。

### 3. 先把音訊轉成結構化時間資料，再讓視覺只讀資料

`analysis/` 是獨立的 Python 前處理層，輸出 `data/lyrics.json` 與 `data/audio.json`。完成後，正式渲染不需要重新跑模型。

歌詞對齊流程包含：

- Demucs 分離 stems；
- 兩組 CTC 聲學模型產生 emission；
- Whisper word timestamps 作交叉檢查；
- 全曲 constrained CTC Viterbi 對齊；
- 依 vocal onset、RMS、fricative 等訊號細修字界；
- 對困難段落保留人工 anchor／修正。

音樂分析則建立固定 tempo beat grid、downbeat、sections、100 fps 音量／頻段包絡，以及鼓點與人聲起音事件。

### 4. 一套場景 API，同時涵蓋 2D、3D、字體與後製

場景以 TypeScript class 實作並繼承共用 `Scene`。渲染工具包含：

- three.js 與 WebGL render target；
- Canvas2D `Layer2D`；
- GLSL fullscreen pass；
- 大量線段用的 GPU `LineBatch`；
- Archivo、IBM Plex Mono、Cormorant Garamond 與單線字體；
- bloom、halation、grain、vignette、chromatic aberration、shake、zoom 等後製；
- 共用視覺 motif 與色盤。

這使每一段可以有不同視覺語彙，但仍共享同一個渲染框架與時間資料。

## 架構與技術

### 前處理層

```text
audio/pdoom.mp3
↓
Demucs / audio-separator
↓
CTC + Whisper + vocal features
↓
analysis/align.py
→ data/lyrics.json

audio stems / mix
↓
librosa / scipy signal analysis
↓
analysis/analyze.py
→ data/audio.json
```

Python 分析環境要求 Python 3.12，並使用 PyTorch、torchaudio、ONNX Runtime、librosa、scipy、Demucs、mlx-whisper 等套件。

### 即時渲染層

```text
data/lyrics.json
data/audio.json
        ↓
TypeScript scene modules
        ↓
three.js / WebGL / Canvas2D
        ↓
shared post-processing
        ↓
browser preview
```

應用由 Bun + Vite 啟動，three.js 負責主要圖形渲染；時間軸位於 `app/src/timeline.ts`，每個 plate／場景則獨立成 `app/src/scenes/*.ts`。

### 離線輸出層

```text
render.ts
↓
Playwright 驅動 headless Chrome
↓
瀏覽器逐影格渲染 RGBA
↓ WebSocket
FFmpeg
↓
H.264 + AAC
```

正式影片不是另外重寫 renderer，而是讓 headless Chrome 執行和預覽完全相同的 Web 應用，再把 raw frame 串流給 FFmpeg。

## 主要功能

- **瀏覽器即時預覽**：可播放、暫停、逐影格、跳場景、循環當前場景與直接以 `?t=` 跳到指定時間。
- **多種離線輸出模式**：支援 `stills`、`sheet`、`plates`、`perf` 與完整 `video`。
- **1080p60 與真正 4K60**：`--scale 2` 不是後製放大，而是實際以 3840×2160 重新渲染所有圖層與 shader。
- **逐字 karaoke 排版**：歌詞有 word-level、部分 syllable-level 時間，並支援逐字／逐 glyph 顯示。
- **節拍與音訊事件驅動動畫**：場景可直接依 beat、bar、鼓點、人聲起音與音量包絡反應。
- **自適應時間超取樣**：`--samples auto` 會依影格收斂誤差，在 4、12、36、108、324 個子影格間調整。
- **品質檢查工作流**：可快速輸出指定時間的 PNG、時間範圍接觸表，以及量測特定場景的 GPU／渲染成本。

## 技術亮點

### 自適應運動模糊不是單純固定 samples

傳統時間超取樣常直接為每一影格設定固定 N 次取樣；這個專案使用巢狀取樣集合，逐步增加到 4、12、36、108、324 個子影格，並比較新舊平均畫面的差異。

靜止畫面通常可以很早停止，快速 whip、slam 或 zoom 才提高取樣數，因此把品質成本集中在真正需要的影格。更重要的是，這套方法直接反向約束場景設計：所有可自適應取樣的場景都必須是時間純函式，不能依賴 render 呼叫次數或不可重現狀態。

### 邏輯解析度與實際解析度分離

場景始終以 1920×1080 的邏輯座標設計；當輸出 4K 時，引擎負責讓 render target、Canvas2D、線寬、後製與 shader 的 pixel-size 計算對應到實際解析度。

這比單純把 canvas 放大更完整，因為 `fwidth`、抗鋸齒、hairline、bloom、grain 等效果若未一起處理，4K 結果通常不會只是「同畫面更銳利」。

### 音訊資料先離線解析，渲染期保持簡單

需要模型與較重運算的 Demucs、CTC、Whisper 只在資料產生階段使用。渲染器平常只消費 JSON 時間資料，使影片預覽與輸出不受語音模型推論延遲影響，也讓最終作品更可重現。

### AI 協作被放在「製作流程」而不是最終 runtime

README 明確把 Claude Code 描述為概念、視覺 treatment、對齊分析、renderer、scene 與 render 的協作工具。這是一個值得研究的 AI-assisted creative coding 案例：LLM 沒有被包進成品播放器，而是在開發過程中協助把創意規格逐步具體化成可測試程式與渲染結果。

## 限制與風險

### 高度專案化，不是通用影片框架

雖然 engine 與 scene API 有重用價值，但目前整個 repository 明顯是為單一歌曲與單一 treatment 設計：

- section map 是手動定義；
- 部分歌詞時間有人工修正；
- timeline 與每個場景都針對特定歌詞內容；
- 共用 motif、字體與 palette 也屬於這支作品的美術規格。

若要做成通用產品，需要把歌曲資料模型、timeline authoring、scene template、素材／授權管理與可視化編輯介面進一步抽離。

### 高品質輸出成本高

README 記錄 4K 渲染是 GPU-bound：簡單影格約數十毫秒，ray-marched 場景在高子影格取樣時可超過 10 秒；作者的完整 4K 成片曾在 M5 Pro 上分兩條管線約花 2.5 小時。

大量 film grain 也會顯著提高 H.264 位元率與輸出檔案大小，因此它更像高品質離線 renderer，而不是即時 4K 成片工具。

### 開發環境依賴明確

主要 renderer 需要 Bun、Google Chrome 與 FFmpeg；分析工具還需要 Python／uv 與約數 GB 的模型權重。這些都提高了重新產生完整資料與最終成片的環境成本。

### 授權不能只看根目錄 MIT

Repository 的程式碼使用 MIT License，但 README 特別說明：

- 字體各自保留自己的授權；
- 歌曲、歌詞與對應歌詞資料不包含在 MIT 授權內。

因此若 fork 作其他公開作品，不能把「整個 repository 都是 MIT」當成素材授權結論。

### 專案仍很新

Repository 建立於 2026-09-24，至 2026-09-28 仍有密集更新，例如自適應 motion blur 與 README／授權整理。現階段較適合視為完成度很高的作品型技術案例，而不是長期穩定、具相容性承諾的通用函式庫。

## 與你的相關性

依公開技術背景，這個專案對 **AI R&D** 與 **Image Generation** 最有參考價值。

對 AI R&D 而言，值得看的不是某一個模型，而是它如何把高不確定性的創意製作拆成可驗證資料與確定性 runtime：歌詞對齊、音訊事件、場景 API、品質檢查、效能量測與離線輸出各自有明確界面。

對影像生成相關興趣而言，它提供另一條不同於 diffusion／文字轉影片的路線：當構圖、排版、節拍同步與視覺一致性比「每幀都由模型自由生成」更重要時，程序式／程式化渲染可以提供極高控制力與可重現性。

對 LLM／Agent 領域則主要是製作流程案例：Claude Code 被當成創作與工程協作者，而不是影片 runtime 的 agent 架構，因此具參考價值，但不應誤分類為 Agent framework。

AOI × AI 與 SillyTavern／AI RPG 則沒有直接技術連結。

## 建議怎麼使用

- **LEARN**：優先閱讀 `docs/ENGINE.md`、`analysis/align.py` 與 `analysis/analyze.py`，理解「音訊先結構化、畫面再純函式化」的設計。
- **REFERENCE**：若要評估程式化 MV、歌詞影片、資料驅動動畫或高品質 WebGL 離線輸出，可把它當成完整案例，尤其值得參考自適應時間取樣與 preview／export 共用 renderer 的做法。
- 若要實際 fork，建議先抽出 `engine/`、資料 schema 與 `render.ts`，不要一開始直接複製整套 song-specific timeline 與場景。
- 開發新視覺時，可沿用它的迭代方式：先輸出 still／contact sheet 檢查，再跑短片段，最後才做全曲高 sample export。

## 與其他收藏的關聯

目前 Knowledge Card Repository 中未檢索到足夠直接、可形成穩定技術連結的既有收藏，因此暫不建立牽強的關聯卡片。

## 使用者備註

## 更新紀錄

### 2026-09-28

- 建立 Knowledge Card。
- 收錄確定性影片渲染、逐字歌詞／音訊分析、three.js 場景引擎、自適應時間超取樣與 Claude Code 協作製作流程。
