---
schema_version: 1
id: github-mensfeld-code-on-incus
title: code-on-incus (coi)
canonical_url: https://github.com/mensfeld/code-on-incus
source:
  type: github
  url: https://github.com/mensfeld/code-on-incus
  identity: github:mensfeld/code-on-incus
created_at: 2026-08-19
updated_at: 2026-08-19
last_checked_at: 2026-08-19
summary: code-on-incus（coi）是一套面向 AI 程式代理的 Incus 系統容器沙箱，讓 Claude Code、OpenCode、pi、Codex CLI 等工具在具 root、systemd 與 Docker 的隔離環境中工作，同時把主機憑證留在信任邊界之外，並以 nftables 網路政策、唯讀保護路徑、稽核與 HIGH／CRITICAL 自動 pause／kill 提供主動防禦。它適合作為高權限 Agent 的可觀測安全執行層，而不只是一般開發容器。
classification:
  categories:
    ai:
      - Agent
      - AI Coding / DevTools
      - Infrastructure / Deployment
    user: null
  tags:
    ai:
      - Incus
      - AI 程式代理
      - Agent 沙箱
      - 系統容器
      - 容器安全
      - 憑證隔離
      - 網路隔離
      - nftables
      - 主動防禦
      - 威脅偵測
      - Claude Code
      - Codex CLI
      - OpenCode
      - hardened profile
    user: null
relevance:
  ai:
    overall: 5
    ai_rd: 5
    aoi_ai: 2
    llm_agent: 5
    sillytavern_ai_rpg: 1
    image_gen: 1
  user: {}
actions:
  ai:
    - TRY
    - LEARN
    - REFERENCE
    - WATCH
  user: null
status:
  ai: active
  user: null
---

# code-on-incus (coi)

## 一句話介紹

code-on-incus（`coi`）是一套專為高權限 AI 程式代理設計的安全執行層：它把 Claude Code、OpenCode、pi、Codex CLI 等工具放進 Incus 非特權系統容器，讓代理在容器內仍可取得 root、systemd、Docker 與完整套件管理能力，同時把主機憑證、網路與敏感路徑留在外部信任邊界，並以即時監控與自動 pause／kill 補上主動防禦。

## 它解決什麼問題

AI 程式代理越有能力，執行風險也越接近「讓未知程式碼取得開發機權限」。代理常需要安裝套件、啟動服務、跑測試、操作 Git、使用 Docker，甚至為了減少人工確認而開啟 bypass permission。若這些能力直接作用在主機上，提示詞注入、惡意相依套件、誤操作或遭污染的 Repository 都可能碰到 SSH key、API token、其他專案、區域網路或主機設定。

傳統應用容器與 DevContainer 可以提供依賴隔離，但其主要目標通常是可重現開發環境，不一定把「容器裡的代理可能主動探索憑證、建立反向 shell、改寫之後會在主機上執行的 hook」視為核心威脅模型。`coi` 的切入點不同：它假設代理需要很高的容器內權限，因此不先削弱能力，而是把**權限放進隔離邊界，再把主機能力逐項顯式授權**。

另一個問題是平行與長時間工作。多個 coding agents 若共享同一個執行環境，容易互相污染套件、服務、連接埠與工作狀態。`coi` 以 workspace／slot 建立獨立容器，並把「工作區檔案」、「代理 session」與「容器本身是否持久化」分開管理，讓容器可以預設銷毀，但工作成果與對話狀態仍可保留或恢復。

## 核心概念

第一個核心是**把完整機器語意留給代理，把信任邊界留在主機**。`coi` 使用 Incus 系統容器，而不是只跑單一應用程序的容器；代理在裡面可以有 root、systemd、Docker 與套件管理器，主機則透過非特權容器、UID/GID 映射與受控掛載避免把這些權限等同於主機 root。

第二個核心是**憑證預設不進容器**。SSH agent、環境變數、Unix socket、靜態 credential file 都需要明確設定；來自專案 `.coi/config.toml` 的高風險能力還會受 `coi trust` 與 trusted-scope 規則約束。這使 Repository 本身不能只靠提交一份設定檔就任意取得主機 socket、執行主機命令或改變部分安全策略。

第三個核心是**預防、偵測、回應三層並行**。預防層包含網路模式、允許清單、對外連接埠限制、敏感路徑唯讀掛載與 privileged-container guard；偵測層監看程序、檔案、日誌與 nftables 網路事件；回應層則把 HIGH 事件自動 pause、CRITICAL 事件直接 kill，並把事件寫入 JSON Lines 稽核紀錄。

第四個核心是**容器生命週期與工作狀態分離**。預設 ephemeral 模式會在離開後刪除容器，但 workspace 檔案與代理 session 仍保留；persistent 模式才保留容器內已安裝套件與系統狀態。這讓「環境是否可丟棄」與「工作是否能續接」不必綁在一起。

第五個核心是**設定來源本身也有信任等級**。使用者全域設定、專案設定與 profile 可以疊加，但不是所有欄位都允許不受信任的專案來源控制。像 `dns_servers`、`allowed_ports`、Git identity lock、主機命令產生環境變數等安全敏感能力會限制在可信來源，呈現一個值得參考的「設定也屬於攻擊面」設計。

## 架構與技術

Repository 主要以 **Go** 實作，模組要求 Go 1.25，CLI 使用 Cobra，設定以 TOML／YAML 與 JSON Schema 驗證。核心執行環境由 **Incus system container** 提供，預設映像以 Ubuntu 24.04 為基礎，容器內可具 systemd、Docker、Node、Python、Git 等完整開發能力；`coi` 本身直接管理 Incus 的容器、掛載、網路、session 與生命週期。

在檔案邊界上，workspace 會掛載進容器，但 `.git/hooks`、`.git/config`、`.husky`、`.vscode`、`.coi`、`.claude/settings.json` 等高風險路徑預設以唯讀方式保護。這些檔案的風險不只在當下：若代理能在沙箱內植入 Git hook、Claude hook 或編輯器設定，使用者之後回到主機原生工具時可能觸發沙箱外執行，因此 `coi` 把「跨 session／跨邊界的持久化植入」視為獨立威脅。

網路層主要依賴 **nftables**。預設 `restricted` 模式阻擋私有網段但允許一般網際網路；`allowlist` 模式由主機先解析核准 hostname，把同一組 IP 同時寫入 firewall 與容器 `/etc/hosts`，並阻擋容器自行對外 DNS，降低代理改用其他解析結果繞過允許清單的空間。另可設定 DNS resolver pinning、全域 `allowed_ports`，以及 `allowed_domains` 的 per-destination port 範圍。

監控程式碼不只存在於文件。`internal/nftmonitor` 的 `NetworkDetector` 會檢查 RFC1918 私有網段、`169.254.169.254` metadata endpoint、可疑連接埠、允許清單違規與 DNS 查詢異常；`Daemon` 會把偵測事件交給 `monitor.Responder`，其中 HIGH 預設 auto-pause、CRITICAL 預設 auto-kill。`internal/monitor` 另包含 process、filesystem、network、log、Sigma、GTFOBins、responder 與 audit 等模組及測試。

工具整合方面，README 目前列出 Claude Code、OpenCode、pi 與 Codex CLI。Codex CLI 已在 0.12.0 開發線加入，但不在預設映像的 agent set，需要在 image build 明確啟用；`permission_mode = "bypass"` 會把 Incus 容器視為主要沙箱，因此可對應各代理的高權限／略過確認模式。session resume、profile、parallel slot、`coi run`、port publishing、socket forwarding、credential seeding 與 health check 則構成周邊操作層。

## 主要功能

- **AI 程式代理系統容器**：讓代理在隔離環境中使用 root、systemd、Docker、套件管理器與完整 Linux 工具鏈。
- **多工具支援**：整合 Claude Code、OpenCode、pi 與 Codex CLI，並提供工具專屬啟動、credential seed 與 session resume 邏輯。
- **工作區與 session 管理**：支援 workspace／slot 隔離、attach、resume、persistent／ephemeral mode、snapshot 與清理流程。
- **網路隔離**：提供 restricted、allowlist、open 三種模式，並可限制 DNS、目的連接埠與個別目的地的連接埠範圍。
- **主機憑證邊界**：SSH agent、socket、環境變數與 credential file 皆透過顯式機制暴露，專案來源的敏感設定另有 trust gate。
- **主動安全監控**：偵測 reverse shell、憑證掃描、資料外傳與可疑網路行為，依嚴重度記錄、pause 或 kill 容器。
- **敏感檔案保護**：將 Git hooks/config、AI 工具設定、編輯器設定等高風險路徑設為唯讀，降低代理把持久化執行點植回工作區的風險。
- **Hardened Profile**：內建針對不受信任 Repository 的設定組合，收緊網路、秘密暴露與持久化，並啟用監控。
- **任意命令沙箱**：`coi run -- <command>` 可讓一般 script／test job 使用與 Agent 相同的掛載、網路、資源限制與安全監控。
- **健康檢查與稽核**：`coi health` 檢查 Incus、核心、安全設定、儲存與監控條件；`coi audit` 提供 JSON Lines 威脅事件串流。

## 技術亮點

最值得保留的設計是**沒有把「安全」等同於降低 Agent 能力**。`coi` 接受 coding agent 需要 root、package install、Docker 與服務管理的現實，改用「高權限只存在於受控系統容器」來建立能力邊界。這對 autonomous coding 的實務價值很高，因為安全模型不必靠代理每一步都問人才能成立。

第二個亮點是**把主機後續可能執行的設定檔視為供應鏈邊界**。保護 `.git/hooks`、`.claude/settings.*`、`.vscode` 等路徑，是針對「代理現在在沙箱內，但它可以修改未來會在沙箱外生效的檔案」這類跨時間攻擊。這比只限制 `/etc` 或主機 home 更貼近 coding agent 的實際工作面。

第三個亮點是**網路政策具有可驗證的資料流**。allowlist 不是只允許 hostname 字串，而是由主機解析後把相同 IP 同步進 nftables 與 `/etc/hosts`，再封鎖外部 DNS；目的地還可縮到特定 port。這使「名稱解析」本身也納入 egress policy，而不是默認容器可自行找到其他位址。

第四個亮點是**偵測結果直接連到容器控制平面**。來源碼中的 responder 會把 HIGH／CRITICAL event 映射成 pause／kill，而不是只產生 log。這使監控成為真正的 runtime control loop；對希望讓 Agent 長時間自治運作的系統而言，比事後查看 audit log 更有實際阻斷能力。

第五個亮點是**多處安全敏感流程採失敗時預設拒絕（fail-closed）**。例如明確要求唯讀 Git identity 時，若無法正確掛載就中止 session，而不是默默退回可寫狀態；部分不合法網路設定也會在啟動時直接拒絕。這類「不能安全套用就不要執行」的行為，比單純印 warning 更適合作為安全執行層的預設。

## 限制與風險

第一個限制是 **Incus 系統容器仍共享主機核心**。它提供的隔離強度與 microVM／完整 VM 不同，因此適合降低 coding agent、供應鏈與誤操作風險，但不應把它描述成能對抗所有 hostile kernel exploit 的絕對安全邊界。若威脅模型包含刻意攻擊 Linux kernel／容器逃逸的任意惡意碼，仍應評估更強的虛擬化層。

第二個限制是**主動防禦屬偵測與回應層，不是隔離本身的替代品**。其中部分規則具有啟發式特徵，例如來源碼把 4444、5555、31337、8080 等目的連接埠列入可疑集合；合法開發服務也可能使用其中某些 port，因此監控有誤報可能，而 auto-pause／auto-kill 也可能中斷正常工作。

第三個風險是**顯式整合功能本身可以重新打開信任邊界**。SSH agent forwarding、socket forwarding、credential copy、環境變數注入與 open network 都是有用功能，但一旦啟用，就不能再假設容器完全看不到主機能力。`coi trust`、trusted-scope 設定與 hardened profile 的選擇，實際上是整套模型是否安全的重要一環。

第四個限制是 **Linux／Incus 維運成本**。macOS 需要先透過 Colima／Lima 等 Linux VM 承載 Incus；網路隔離又依賴 nftables 與核心能力。儲存池若使用 `dir` driver，README 也指出缺少 copy-on-write 會顯著拖慢每次容器啟動，因此實際體驗高度依賴主機 Incus、kernel、storage 與 firewall 配置。

第五個限制是**專案仍在快速演進**。截至 2026-08-19，CHANGELOG 頂端是 `0.12.0 (Unreleased)`，8 月 18–19 日仍在加入 Codex CLI、per-destination port、DNS／egress 控制與唯讀 Git identity 等安全功能；README 也保留近期 0.9 → 0.10 設定遷移說明。這代表它非常值得追蹤，但自動化整合不宜假設 CLI／config surface 已長期穩定。

Codex CLI 另有一個實務細節：目前不是預設映像中的 agent，需要 image build 明確選入；若主機 credential 存在 OS keyring 而沒有 `auth.json`，則要在容器內走 device auth 或 API key，普通 browser OAuth callback 無法直接回到容器。

## 與你的相關性

依公開 profile，這個專案與 **AI R&D、Agent 與 LLM Agent 工程**的相關性很高。研究或開發 Agent 時，模型與 tool calling 只是其中一層；真正要讓 coding agent 自主跑測試、裝套件、啟服務與操作 Repository，還需要一個能把高權限執行與主機資產分開的 execution boundary。`coi` 正好提供一個可直接研究與試用的完整案例。

對 **AOI × AI** 的關聯較偏工程基礎設施，而非演算法本身。它沒有 Computer Vision、檢測模型或產線能力，但可用來隔離依賴複雜的模型開發／測試工作，尤其當 Agent 需要自行安裝 CUDA 以外的系統套件、啟動服務、跑 build pipeline 或分析不受信任的第三方 Repository 時，其安全與可重現性模式仍有參考價值。

對 SillyTavern／AI RPG 與 Image Generation 的直接關聯低；若未來把自主角色 Agent 或生成工具交給高權限 shell／filesystem，才會透過「Agent 安全執行層」間接產生價值。

## 建議怎麼使用

- `TRY`：先用非敏感測試 Repository 執行 `coi shell --profile hardened`，實際驗證工作區寫入、套件安裝、Docker、網路阻擋與 container teardown 是否符合預期，再考慮拿到日常 Agent workflow。
- `LEARN`：即使最後不用 Incus，也值得拆解它的 trust scope、protected paths、host-resolved allowlist、credential broker、fail-closed 與 responder 設計，作為自建 Agent sandbox 的安全 checklist。
- `REFERENCE`：把它當作「高權限 coding agent execution layer」的參考基線，與只做 worktree isolation、application container 或 remote VM 的方案比較：誰控制 kernel、credential、network、persistent hooks、session state 與 response action。
- `WATCH`：持續追蹤 0.12.x 之後的 config 穩定度、Codex 預設整合、監控誤報調校、Incus／nftables 相依，以及快速新增的 network hardening 是否逐步收斂。

若要做一個小型驗證，建議挑同一個不受信任的開源 Repository，分別用「主機原生執行」與 `coi` hardened profile 讓 coding agent 做相同任務，再比較它能看到哪些環境變數／socket、能否碰私有網段、能否改 `.git/hooks`、異常行為是否產生 audit event，以及任務完成後有哪些狀態仍留在主機。這比只確認 `coi shell` 能啟動，更能驗證它真正的安全價值。

## 與其他收藏的關聯

- [Orca](./github-stablyai-orca.md)：Orca 側重多個 coding agents 的 worktree、終端、任務編排與 review，是「如何管理平行 Agent」；`coi` 則把焦點放在每個 Agent 實際執行 shell、Docker、服務與不受信任程式碼時的 OS／network／credential 邊界。兩者可視為 orchestration layer 與 secure execution layer 的互補方案。
- [DeepSeek Harness 繁體中文版](./github-g36maid-deepseek-harness.md)：DeepSeek Harness 定義 model、tool、session、approval 與 agent loop 等 runtime seam；`coi` 則可以作為 filesystem／subprocess／shell 等高權限 capability 之下的隔離執行世界。前者偏 Agent Runtime 架構，後者偏 Host Security 與 Execution Sandbox。

## 使用者備註

## 更新紀錄

### 2026-08-19

- 建立 Knowledge Card；收錄 Incus 系統容器、coding agent 工具整合、主機憑證邊界、nftables 網路政策、主動威脅偵測與 HIGH／CRITICAL 自動回應，以及 0.12.0 開發線的 Codex／egress／Git identity hardening。
