---
schema_version: 1
id: github-nvidia-openshell
title: OpenShell
canonical_url: https://github.com/NVIDIA/OpenShell
source:
  type: github
  url: https://github.com/NVIDIA/OpenShell
  identity: github:nvidia/openshell
resource_kind:
  ai: project
  user: null
navigation:
  categories:
    ai:
      - Agent / Harness
      - Infrastructure / Security
    user: null
created_at: 2026-09-30
updated_at: 2026-09-30
last_checked_at: 2026-09-30
summary: OpenShell 是 NVIDIA 開源的 Agent 安全執行環境，讓自主 Agent 在可讀檔、執行程式、呼叫 API 與使用憑證的同時，仍受檔案、程序與網路政策限制；其 Linux 執行邊界結合 Landlock、seccomp、可信任 supervisor、憑證代理與 Z3/SMT 政策驗證。
classification:
  categories:
    ai:
      - Agent
      - Infrastructure / Deployment
      - AI Coding / DevTools
    user: null
  tags:
    ai:
      - OpenShell
      - agent-security
      - agent-runtime
      - agent-sandbox
      - policy-as-code
      - Landlock
      - seccomp
      - formal-verification
      - Z3
      - credential-isolation
      - credential-proxy
      - sandbox-policy
      - gateway
      - supervisor
      - Kubernetes
      - Docker
    user: null
relevance:
  ai:
    overall: 5
    ai_rd: 4
    aoi_ai: 2
    llm_agent: 5
    sillytavern_ai_rpg: 2
    image_gen: 1
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

# OpenShell

## 一句話介紹

OpenShell 是 NVIDIA 開源的 Agent 安全執行環境：它不取代 Claude Code、Codex、OpenCode 或其他 Agent，而是在這些 Agent 下方建立可強制執行的沙箱，限制它們能讀寫哪些檔案、以什麼身分執行、可以連到哪些網路目的地，以及可以對外部 API 做哪些操作。

它的核心思路是：**不要只靠提示詞或工具白名單要求 Agent「自律」，而是讓作業系統與受信任的執行層真正阻擋未被政策允許的行為。**

## 它解決什麼問題

自主 Agent 要真正完成工作，往往需要比聊天模型更高的環境權限：讀寫專案檔案、安裝套件、執行 shell、連 GitHub、呼叫模型 API，甚至使用存取權杖或雲端憑證。

問題在於，一旦把這些能力直接交給 Agent，風險就不再只是「回答錯誤」，而是可能出現：

- 讀取工作範圍外的檔案。
- 執行不該執行的程式或系統呼叫。
- 把資料送往未核准的網路目的地。
- 取得 API 金鑰後，把憑證帶往錯誤的服務。
- Agent 為了解決任務，自行要求越來越寬的權限。

一般容器可以提供程序與檔案系統隔離，但未必直接表達「只有這個 binary 可以連這個 API，而且只允許 GET，不允許 POST」這種 Agent 工作負載常見的細粒度規則。

OpenShell 把這些需求整理成一套可宣告、可強制執行、可檢查的政策模型，並將 Agent 視為不可信任工作負載；即使 Agent 本身想越權，也必須穿過外部的執行與政策邊界。

## 核心概念

### 1. Sandbox 與 Supervisor 分離

OpenShell 把 Agent 放在不可信任的 sandbox 內，真正做政策判斷的 **supervisor** 則位於邊界外側。

Sandbox 負責啟動 Agent、觀察程序與攔截網路操作，但不自行決定是否允許；它把 Agent 想做的操作送給 supervisor，由 supervisor 依政策判斷、加入必要憑證，再代表 Agent 建立真正的外部連線。

這個分離很重要：即使 Agent 能控制自己的工作程序，也不能直接控制做決策與持有敏感憑證的元件。

### 2. 預設拒絕的政策即程式碼

Sandbox policy 使用 YAML 描述執行邊界。主要可控制：

- `filesystem_policy`：哪些路徑可讀、可寫。
- `landlock`：檔案系統限制套用失敗時的相容策略。
- `process`：工作負載使用的使用者與群組。
- `network_policies`：哪些 binary 可以連哪些目的地，以及允許哪些請求。
- `network_middlewares`：對已允許流量再做檢查、轉換或阻擋。

沒有被規則允許的 outbound connection 預設會被拒絕，因此政策本身就是 Agent 的能力邊界。

### 3. Agent 看不到真正的 Provider 憑證

OpenShell 把外部服務憑證管理成 provider。Agent 不需要直接拿到真實 API key；supervisor 只在政策允許的目的地與請求上加入對應憑證。

這讓「可以使用某項服務」與「可以取得這項服務的原始憑證」變成兩件不同的事。即使 Agent 可以呼叫 GitHub 或模型服務，也不代表它能任意把同一把 credential 帶往其他主機。

### 4. Policy Prover：在擴權前先算出可能新增的能力

OpenShell 的 Policy Prover 使用 SMT solver 檢查政策。

它目前有兩種重要用途：

- **Boundary check**：確認候選政策沒有超過預先定義的最大允許邊界。
- **Proposal risk check**：Agent 透過 policy advisor 提議新網路規則時，檢查是否增加高風險存取，例如新的 credential 目的地、雲端 metadata 位址或新的 API 能力。

核心實作會把政策、binary 能力與 credential scope 編碼成 Z3 SMT constraints，再做 reachability 檢查。若超過邊界，CLI 可以回傳具體 counterexample，而不只是單純顯示「不安全」。

### 5. Gateway 是控制平面

Gateway 管理 sandbox 生命週期、政策、provider、身分與互動連線；compute driver 則把同一套邏輯落到 Docker、Podman、Kubernetes 或 VM 等不同執行環境。

因此 OpenShell 的政策模型與控制面不必綁死在單一容器技術上。

## 架構與技術

高階資料流可以簡化成：

```text
User / Operator
      ↓
   Gateway
      ↓ policy / provider / lifecycle
Compute Driver
      ↓
Trusted Supervisor
      ⇅ authenticated mediated channel
Sandbox Runtime
      ↓
 Untrusted Agent
```

Agent 的對外網路請求大致會經過：

```text
Agent opens TCP / DNS
      ↓
Sandbox identifies calling program
      ↓
Supervisor checks policy
      ↓
Supervisor injects allowed credential
      ↓
Supervisor opens real upstream connection
```

目前 Linux backend 中，工作負載使用非 root 身分且沒有 Linux capabilities；檔案系統存取由 Landlock 限制，TCP 與 DNS 操作則透過 seccomp user notification 轉交給 sandbox runtime，再送往 supervisor 判斷。

不同 runtime 會用各自原生方法建立最外層網路封鎖：Docker／Podman 的 workload 關閉直接網路、Kubernetes 依賴 `NetworkPolicy` 只允許 supervisor 路徑，VM 則可讓 guest 沒有一般網路裝置。Supervisor 與 sandbox 之間使用經驗證的受保護通道，傳輸方式可依 runtime 使用 Unix socket、TCP 或 vsock。

專案核心是 Rust workspace，使用 Tokio、Tonic／Protocol Buffers、Axum、Rustls、SQLx、Kubernetes client 等元件；Policy Prover 使用 Z3。Repository 另外提供 Python、TypeScript、Go、Rust SDK，以及 Kubernetes Helm 部署方式。

## 主要功能

- **Sandbox 生命週期管理**：建立、啟動、停止與管理 Agent sandbox。
- **細粒度政策**：限制檔案、程序、網路目的地、binary 與部分 API method/path。
- **Provider 憑證管理**：將 API key、token 與 sandbox 分離，在允許的 outbound request 上才注入。
- **Policy Advisor／Prover**：讓 Agent 可以提出更窄的網路規則，同時對擴權做風險檢查與形式驗證。
- **多種執行環境**：支援 Docker、Podman、Kubernetes 與 VM 類 runtime，由共同 supervisor／policy engine 維持一致語意。
- **Gateway 控制平面**：集中管理 sandbox、政策、provider、連線與身分。
- **SDK 與 Agent Skills**：提供多語言 SDK，Repository 也可透過 `npx skills add NVIDIA/OpenShell` 安裝給程式開發 Agent 使用的技能。
- **Kubernetes 部署**：提供 Helm chart；Kubernetes 網路邊界要求叢集 CNI 能實際強制執行 `NetworkPolicy`。
- **可觀察性與 telemetry**：支援 tracing／metrics，預設也會收集匿名的操作類型與數量統計；可透過設定停用。

## 技術亮點

### 把 Agent 權限從「約定」提升成真正的執行邊界

很多 Agent 工具的權限限制仍停留在工具呼叫層，例如「這個工具不要讀某個目錄」或「只有核准工具能呼叫 shell」。OpenShell 則把防線下移到檔案系統、程序、網路與可信任 proxy 層。

這使安全模型不需要假設模型一定遵守提示詞，也不需要假設 Agent framework 自己的工具封裝永遠不會被繞過。

### 憑證與 Agent 工作負載真正分離

「Agent 可以呼叫 API」不等於「Agent 可以看到 API key」是 OpenShell 很重要的設計。

Credential 由 supervisor 掌握，再依 endpoint 與政策注入請求，可以大幅縮小憑證被模型輸出、shell 歷史、惡意套件或錯誤程式碼直接讀到的機會。

### 把形式驗證放進日常政策變更流程

Policy Prover 不是獨立研究工具，而是直接介入 Agent 申請新網路規則的工作流程。

比起只做 schema validation，它會回答「這個新政策實際上是否讓某個 binary 多取得了一條 credentialed path」這種能力層級問題。這對會持續自行調整工具與存取權的自主 Agent 特別有價值。

### 執行環境與政策語意分離

Docker、Kubernetes 或 VM 各自負責把隔離邊界建立起來，但真正的 allow/deny 判斷仍由共同 supervisor 與 policy engine 決定。這讓同一份 Agent 權限模型可以跨不同 compute runtime 使用。

### 與 Harness 是互補關係，不是同一層產品

OpenShell 處理的是「一個 Agent 執行時到底能碰什麼」；多 Agent Harness 則通常處理角色、任務、工作階段、拓樸、預算或協作。

這兩者可以疊在一起：Harness 負責決定 Agent 應該做什麼，OpenShell 負責在作業系統與網路層保證它最多能做什麼。

## 限制與風險

### 仍在 0.1.x 階段

截至 2026-09-30，最新 stable release 是 2026-09-28 發布的 `v0.1.2`。官方已定義 stable／pre-release／dev 發布流程，stable release 也有固定 qualification 與相容性政策，但整體專案仍處於非常早期的版本階段。

官方規則指出 Stable 介面在 patch release 間維持向後相容；標為 Experimental 的介面則可能在 patch release 中改變或移除。正式導入仍應固定版本並檢查每次升級的 release／upgrade 說明。

### Windows WSL 2 仍是實驗性支援

目前正式支援的主機主要是 Linux x86_64／arm64 與 Apple Silicon macOS；Windows + WSL 2 + Docker Desktop 被標示為 Experimental。

因此 Windows 使用者可以拿來驗證概念，但不應直接把 WSL 2 路徑視為與 Linux 正式支援等價。

### 形式驗證只保證模型涵蓋的部分

Policy Prover 官方文件明確指出，它的保證只適用於目前形式模型所表示的政策功能。

Boundary check 目前可覆蓋 filesystem、process、Landlock、L4 network 與 REST request 等範圍；GraphQL、MCP、JSON-RPC、WebSocket 等政策形狀可能回傳 `unsupported`。過大的政策也可能因資源限制回傳 `inconclusive`。

因此 `within_boundary` 不代表「整個 Agent 一定安全」，也不代表實際 runtime 一定正確執行政策；它只證明目前模型可檢查的政策能力沒有超出指定 boundary。

### 外層網路隔離仍必須被平台真正強制

OpenShell 的安全模型假設 workload 沒有繞過 supervisor 的其他出口。Docker／Podman／VM 可由 runtime 建立封鎖；Kubernetes 則明確要求 CNI 能強制執行 `NetworkPolicy`。

如果平台層的 outer fence 設定錯誤，OpenShell 上層政策設計再精細，也不能取代底層網路隔離本身。

### 應用程式輸出仍可能自行洩漏敏感資料

官方安全建議提醒，OpenShell 不會替應用程式輸出自動清洗所有敏感資訊。若某個 framework 把完整 request config、token 或錯誤內容寫入 stack trace，再被使用者分享出去，仍可能形成資料外洩。

換句話說，OpenShell 縮小 Agent 直接取得與濫用憑證的能力，但不能取代應用程式本身的秘密管理與輸出衛生。

### 預設 telemetry 需要納入部署政策

OpenShell 預設收集匿名的操作類型與次數統計，不收集 sandbox 名稱、hostname、檔案路徑、prompt、credential、provider／model 名稱或使用者內容。若部署環境要求完全關閉遙測，必須另外停用設定或在編譯時移除。

## 與你的相關性

依公開技術 Profile，OpenShell 對 **LLM／Agent** 的相關性屬核心等級，對 **AI R&D** 也有高度參考價值。

對 LLM／Agent 而言，它補的是 Agent 系統中常被忽略的「執行安全層」：當 Agent 從回答文字進一步取得 shell、檔案、API 與 credential 權限時，如何用系統層政策而不是提示詞限制能力。這與 Agent Harness、工具調用與自主工作流程有直接關聯。

對 AI R&D 而言，Policy Prover、credential isolation、可跨 runtime 的 policy model，以及「讓 Agent 自己提出權限、但由獨立機制檢查擴權」的流程，都很適合作為自主系統治理與安全研究案例。

對 AOI × AI 的直接關聯較低，因為 OpenShell 不處理電腦視覺、模型訓練或檢測演算法；但如果 AI 系統開始用 Agent 自動操作資料、模型服務或工程工具，OpenShell 類型的執行邊界仍可作為基礎設施參考。

它與 SillyTavern／AI RPG、影像生成的關聯主要也在「讓 Agent 安全使用外部工具」這一層，而不是內容生成能力本身。

## 建議怎麼使用

### TRY：用最小 sandbox 驗證「預設拒絕」是否真的符合預期

先以官方 quickstart 建立乾淨 sandbox，不要一開始就接入大量真實 credential。

```bash
curl -LsSf https://raw.githubusercontent.com/NVIDIA/OpenShell/main/install.sh | sh
openshell sandbox create --name demo
```

接著測試三件事：未允許的網路是否真的被擋下、加入窄範圍 policy 後是否只開放指定目的地，以及 provider credential 是否能在 Agent 看不到原始金鑰的情況下完成 API 呼叫。

若使用 Windows，應把 WSL 2 當成實驗環境，不要用它直接推論正式 Linux 部署結果。

### LEARN：優先拆解 Architecture 與 Policy Prover

最值得深入讀的不是 CLI 指令清單，而是：

1. sandbox／supervisor 為什麼放在邊界兩側；
2. outer network fence 與 mediated channel 如何避免 Agent 直接繞出去；
3. provider credential 如何只在核准 endpoint 上生效；
4. Z3 模型實際檢查哪些 policy capability，哪些情況會回傳 `unsupported`／`inconclusive`。

這些部分比單純「用容器跑 Agent」更能代表 OpenShell 的核心技術價值。

### REFERENCE：把它當作 Agent 執行安全層的比較基準

評估 Agent framework 或 Harness 時，可以用 OpenShell 反問幾個問題：權限限制最後由誰強制？Agent 能不能直接看到 credential？網路 allowlist 是否能限制到 binary／API method？權限擴張是否有獨立驗證？底層 sandbox 掛掉或 supervisor 失聯時是否 fail closed？

即使最後不直接採用 OpenShell，這組問題本身就很適合拿來檢查其他自主 Agent 平台的安全邊界。

## 與其他收藏的關聯

- **OpenRig**（`content/knowledge/2026/github-mvschwarz-openrig.md`）主要處理多 Agent 的工作階段、角色、拓樸、恢復與 Harness 權限設定；OpenShell 則把權限進一步下沉到 sandbox、檔案系統與網路執行邊界。兩者可以視為「Harness 控制層」與「受控執行層」的互補案例。
- **Paperclip**（`content/knowledge/2026/github-paperclipai-paperclip.md`）負責多 Agent 任務、預算、審批與治理，但其本機 CLI adapter 文件也明確提醒工作負載未被 sandbox。OpenShell 正好提供另一種把 Agent 執行隔離納入基礎設施的思路。

## 使用者備註


## 更新紀錄

### 2026-09-30

- 建立 OpenShell Knowledge Card。
- 依 README、Architecture、Sandbox Policies、Policy Prover、Security Best Practices、Support Matrix、Rust workspace 與 `v0.1.2` release 資訊整理安全執行架構、形式驗證、credential isolation、平台支援與限制。