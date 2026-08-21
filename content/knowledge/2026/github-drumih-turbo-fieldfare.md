---
schema_version: 1
id: github-drumih-turbo-fieldfare
title: TurboFieldfare
canonical_url: https://github.com/drumih/turbo-fieldfare
source:
  type: github
  url: https://github.com/drumih/turbo-fieldfare
  identity: github:drumih/turbo-fieldfare
resource_kind:
  ai: project
  user: null
created_at: 2026-08-12
updated_at: 2026-08-21
last_checked_at: 2026-08-21
summary: TurboFieldfare 是針對 Apple Silicon 與 Gemma 4 26B-A4B 特化的 Swift + Metal 本機推論 Runtime，透過讓共用權重與 KV cache 常駐、將 MoE routed experts 由 SSD 按需串流，把約 14.3 GB 的文字模型壓到約 2 GB 實體記憶體 footprint；並提供 Mac App、CLI 與實驗性的 OpenAI-compatible Chat Completions Server。
classification:
  categories:
    ai:
      - AI / ML
      - LLM
      - Infrastructure / Deployment
    user: null
  tags:
    ai:
      - Gemma 4
      - Apple Silicon
      - Swift
      - Metal
      - MoE inference
      - SSD expert streaming
      - 4-bit quantization
      - local LLM
      - on-device inference
      - OpenAI-compatible API
      - KV cache
      - bounded-memory runtime
    user: null
relevance:
  ai:
    overall: 4
    ai_rd: 5
    aoi_ai: 2
    llm_agent: 5
    sillytavern_ai_rpg: 4
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

# TurboFieldfare

## 一句話介紹

TurboFieldfare 是一套針對 **Gemma 4 26B-A4B** 與 **Apple Silicon** 特化的 Swift + Metal 本機推論 Runtime：它不把整個約 14.3 GB 模型常駐記憶體，而是只保留共用權重、KV cache 與工作區，再依每個 token 的 MoE router 結果從 SSD 載入需要的 routed experts，目標是在 8 GB Mac 上仍能執行 26B 級 MoE 模型。

## 它解決什麼問題

大型本機 LLM 在低記憶體裝置上的主要瓶頸，不只是計算量，而是「權重是否必須全部進入 RAM／Unified Memory」。對 Gemma 4 26B-A4B 這類 MoE 模型而言，總參數量很大，但每個 token 實際只啟用部分 routed experts；傳統 runtime 若仍以完整模型載入為中心，就無法充分利用這個稀疏性。

TurboFieldfare 將問題重新定義為一個 **bounded-memory inference system**：共用部分常駐、專家權重視路由需求進出 SSD cache，並讓 installer、prefill、decode、KV storage 都遵守固定記憶體上限。README 的基準顯示，在 8 GB M2 MacBook Air 上，TurboFieldfare 的 decode 約為 5.1–6.3 tok/s，footprint 約 1.9–2.1 GB；在 24 GB M5 Pro 上約為 31–35 tok/s。這些數值是特定 workload 的實測參考，不應視為所有硬體與 prompt 的固定速度。

它因此不是單純的「另一個 LLM GUI」，而是在探索一個更具系統研究價值的問題：**當 SSD I/O、Metal compute、MoE routing、cache policy 與 quantized layout 一起設計時，本機推論的 RAM 下限可以壓到多低。**

## 核心概念

TurboFieldfare 的核心設計建立在 Gemma 4 26B-A4B 的 MoE 結構上。模型每層有 128 個 routed experts，但 router 對每個 token 只選 8 個，因此 runtime 不需要讓所有 expert weights 同時常駐。

主要策略可整理為四層：

- **Resident core**：embedding／LM head、attention projections、router、shared expert、norm 等共用權重放在約 1.35 GB 的 `model_weights.bin`，以 read-only mapping 提供 Metal 使用。
- **SSD-backed expert streaming**：每層 routed experts 被拆成固定 stride 的 layer file；cache miss 時用 bounded `pread` 把需要的 expert blob 載入可被 Metal 直接使用的 slot buffer。
- **Per-layer bounded cache**：每個已開啟 layer 具有 16 個 expert slots，production 使用 LFU eviction 並以 recency 作 tie-breaker，避免無界成長。
- **Bounded prefill / KV**：prefill 以最多 128 tokens 分塊；25 個 sliding-window attention layers 使用環形 KV storage，5 個 full-attention layers 使用線性 storage，使 prompt 處理與 context memory 更可控。

這個架構的真正價值在於「模型格式、installer、I/O、cache、Metal kernel 與 execution schedule 是一體設計」，而不是把 SSD offload 當成 runtime 外掛選項。

## 架構與技術

專案以 **Swift 6.2+、Metal 4、macOS 26+** 為主要 runtime 環境，僅支援 arm64 Apple Silicon。它不是 MLX 或 llama.cpp wrapper，而是為固定 Gemma 4 26B-A4B checkpoint 建立的 model-specific engine。

模型安裝階段會從 pinned Hugging Face revision 讀取來源索引與指定 byte ranges，直接重新排列成自有 `.gturbo` 目錄，而不先下載完整 checkpoint 再轉換。官方 system design 說明，repacker 不會進行 dequantize → requantize，而是保留來源 MLX affine quantized values，只重排實體 layout。安裝完成後以 manifest、SHA-256 與 verified receipt 驗證檔案完整性。

`.gturbo` 主要由下列資料組成：

- `model_weights.bin`：常駐共用權重。
- `packed_experts/layer_XX.bin`：30 層 routed expert files。
- `packed_experts/layout.json`：expert blob 內部 offset／layout。
- tokenizer files。
- `manifest.json` 與 `verified-install.json`：格式、hash、完整性與安裝狀態。

推論時 attention 與 router 先在 Metal 執行，CPU 取得 top-8 expert IDs 後規劃 cache hit／miss；miss 由 bounded parallel `pread` 補入 slot。shared expert branch 可在 routed expert I/O 期間執行，之後再組合兩路輸出。這種 scheduling 的重點是用計算去覆蓋部分 I/O latency，而不是假設 SSD streaming 沒有成本。

專案提供六個 Swift products，其中包含 runtime library、native Mac app、decode service、CLI、repack installer，以及 `TurboFieldfareServer`。Server 綁定 `127.0.0.1`，提供 OpenAI-compatible Chat Completions、SSE streaming、單一 prefix KV reuse 與 function-tool call 輸出；工具執行仍由 client 端授權與完成。

## 主要功能

- 在 Apple Silicon Mac 上執行 Gemma 4 26B-A4B instruction model，官方驗證目標包含 8 GB M2 MacBook Air。
- 以 4-bit MLX affine weights、8-bit router、FP16 KV cache 與自訂 Metal kernels 完成 text-only inference。
- 透過 SSD-backed routed-expert streaming 與 bounded expert cache 控制實體記憶體 footprint。
- 提供 streaming model installer，可直接從遠端 byte ranges repack 到 `.gturbo`，支援 resume、hash validation 與 install verification。
- 提供 native Mac App、CLI 與 Swift library。
- 提供 loopback OpenAI-compatible `/v1/chat/completions` server，支援 streaming、system／developer／tool messages 與 function tool calls。
- 提供單一 conversation prefix 的 KV reuse，並在 usage 中回報 cached tokens。
- 提供 benchmark、system design、optimization journey 與大量實驗紀錄，便於追蹤效能決策及失敗方案。

## 技術亮點

第一個亮點是 **把 MoE 稀疏性真正轉換成記憶體架構優勢**。很多 runtime 雖然只計算少數 experts，仍可能需要完整權重可用；TurboFieldfare 則直接把 routed expert residency 變成 cache 問題，讓 SSD 成為模型權重層級的一部分。

第二個亮點是 **以 bounded-memory 原則貫穿 install 到 inference**。遠端 checkpoint 不會整包落地再轉檔，prefill 不會一次展開整個 prompt，expert cache 固定 slot 數，KV 針對 sliding-window layer 使用 ring。這是一個值得研究的 edge inference 系統設計範例。

第三個亮點是 **針對 Apple Silicon unified memory 與 Metal buffer ownership 做低階最佳化**。共用權重以 read-only mapping 搭配 Metal buffer，expert slot 使用對齊配置後讓 Metal 直接存取，避免把每個 tensor 都轉成 Swift heap object。這種設計比一般應用層的「選一個 local model backend」更接近 inference runtime engineering。

第四個亮點是 **效能文件保留失敗與量測限制**。官方 benchmark 明確區分 decode rate、TTFT、RSS／physical footprint、GPU allocation 等不同量測，也說明 M2 row 多為單次 fresh-process 測試、file cache 並未完全控制。這使它不只是一個可執行專案，也是一份關於 local inference optimization methodology 的案例。

第五個亮點是 **在超低記憶體 runtime 上仍提供 OpenAI-compatible integration surface**。雖然 API subset 不完整，但能讓上層 Agent／AI application 把 TurboFieldfare 視為 local chat backend，而不必直接嵌入 Swift runtime。

## 限制與風險

最大的限制是 **高度 model-specific**。目前 production scope 固定在 Gemma 4 26B-A4B instruction checkpoint 與特定量化格式；這種特化換來極低 memory footprint，但不像 llama.cpp／MLX 那樣具有廣泛模型相容性。若模型架構、quantization metadata 或 checkpoint layout 改變，可能需要 runtime 級修改。

第二個限制是 **平台條件很窄**：需要 Apple Silicon、macOS 26、Metal 4、Xcode 26 與 Swift 6.2+。對非 macOS、Intel Mac、NVIDIA／Linux 或較舊系統沒有直接價值。

第三個限制是 **SSD streaming 以容量換取 latency／I/O 壓力**。M2 實測中 expert reads 是 decode latency 的主要成本之一，因此「約 2 GB RAM」不代表它同時達到記憶體與速度最優。官方同機比較也顯示 MLX 在 24 GB M5 Pro 上 throughput 更高，但記憶體使用顯著更大；兩者本質上是在不同資源約束下做取捨。

第四個限制是 **OpenAI-compatible server 只實作 API subset**。它不支援 Responses API、embeddings、multimodal input、structured output、batching、logprobs 或遠端 model switching；function tools 只負責輸出 tool calls，權限與執行完全由 client 處理。Server 也沒有 auth/TLS，官方明確要求只綁 loopback，不應直接透過 proxy 或 tunnel 暴露。

第五個限制是 **目前為快速演進中的年輕專案**。Repository 建立於 2026-07-17，截至 2026-08-12 已有 0.4.2 source-only release 並保持活躍；最新 release 強化 streaming detokenization 與 tokenizer correctness，顯示工程品質持續改善，但 API、format 與最佳化策略仍可能快速變動。Apache-2.0 適用於專案原始碼與文件，模型權重則仍受來源模型條款約束。

## 與你的相關性

依公開技術 Profile，TurboFieldfare 對 **AI R&D** 與 **LLM / Agent** 都具有高度價值。它值得看的不是「又多一個本機聊天模型」，而是如何把 MoE routing、quantization、Metal kernels、SSD I/O、cache policy、KV layout 與 server interface 組成一個受嚴格 RAM 約束的推論系統。對 model serving、edge inference、on-device AI 與效能分析而言，這是相當具體的實作案例。

對 **LLM / Agent** 的另一層價值是其 OpenAI-compatible Chat Completions Server。上層 Agent runtime 可以用熟悉的 HTTP interface 測試 local backend、streaming、prompt prefix reuse 與 function tool-call 流程；但在實際整合前必須確認 client 是否依賴 Responses API、structured outputs、parallel tool controls 等 TurboFieldfare 尚未支援的能力。

對 **SillyTavern / AI RPG** 的相關性給 4，原因不是 TurboFieldfare 本身包含角色、記憶或 RPG engine，而是它可能成為 local character/agent stack 的低 RAM LLM backend。這種價值高度取決於上層工具對 OpenAI Chat Completions subset 的相容性，因此仍應以實測為準。

對 **AOI × AI** 只有間接價值：其 Metal、memory ownership、streaming I/O 與 edge inference optimization 思路可以旁通到裝置端 AI，但專案沒有 computer vision／inspection pipeline。對 **Image Generation** 則幾乎沒有直接關聯，因為目前明確為 text-only runtime。

## 建議怎麼使用

- **LEARN**：優先讀 `docs/SYSTEM_DESIGN.md`、`docs/BENCHMARKS.md` 與 optimization journey。重點不是照抄實作，而是理解「如何把模型結構轉成 I/O／cache／memory architecture」。
- **REFERENCE**：把它保留為「極端低記憶體 local LLM inference」的設計基準。未來比較 MLX、llama.cpp、vLLM 或其他 on-device runtime 時，可從 resident weights、offload granularity、KV layout、prefill strategy、I/O overlap 與 API surface 六個面向比較。
- **WATCH**：持續觀察是否擴充更多 Gemma checkpoint、iPhone／iPad、更多 Apple Silicon benchmark，以及 OpenAI-compatible API coverage。若模型支援範圍擴大，實用性會從研究型 runtime 明顯提升為可重複利用的 inference backend。

若有符合條件的 Apple Silicon 測試環境，可以額外自行試跑，但目前不把 `TRY` 設為主要 Action，因為公開技術 Profile 沒有指定可用 macOS 26／Metal 4 硬體，而且此專案的價值核心仍偏向推論架構研究與比較。

## 與其他收藏的關聯

- [Project AIRI](./github-moeru-ai-airi.md)：AIRI 是上層 AI VTuber／digital companion runtime，並採多 provider abstraction；TurboFieldfare 則可視為相反方向的底層 local inference engine。兩者形成「角色／Agent runtime ↔ 本機模型 serving」的互補關係。TurboFieldfare 的 OpenAI-compatible API 使概念上的對接成立，但實際相容性仍需依 AIRI provider adapter 與 TurboFieldfare API subset 測試，不能直接假設完整支援。

## 使用者備註


## 更新紀錄

### 2026-08-21

- 重新檢查目前 Repository，依主要交付物正式將 `resource_kind` 分類為 `project`。

### 2026-08-12

- 建立 Knowledge Card；分析 TurboFieldfare 的 Gemma 4 MoE expert streaming、bounded-memory runtime、Metal 架構、benchmark 與 OpenAI-compatible server。
