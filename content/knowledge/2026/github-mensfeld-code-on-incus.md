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
summary: code-on-incus（coi）是一套面向 AI 程式代理的 Incus 系統容器沙箱，讓 Claude Code、OpenCode、pi、Codex CLI 等工具在具 root、systemd 與 Docker 的隔離環境中工作，同時把主機憑證留在信任邊界之外，並以 nftables 網路政策、唯讀保護路徑、稽核與 HIGH／CRITICAL 自動暫停／終止提供主動防禦。它適合作為高權限 Agent 的可觀測安全執行層，而不只是一般開發容器。
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

code-on-incus（`coi`）是一套專為高權限 AI 程式代理設計的安全執行層：它把 Claude Code、OpenCode、pi、Codex CLI 等工具放進 Incus 非特權系統容器，讓代理在容器內仍可取得 root、systemd、Docker 與完整套件管理能力，同時把主機憑證、網路與敏感路徑留在外部信任邊界，並以即時監控與自動暫停／終止補上主動防禦。

## 它解決什麼問題

AI 程式代理越有能力，執行風險也越接近「讓未知程式碼取得開發機權限」。代理常需要安裝套件、啟動服務、跑測試、操作 Git、使用 Docker，甚至為了減少人工確認而開啟略過權限確認模式（bypass permission）。若這些能力直接作用在主機上，提示詞注入、惡意相依套件、誤操作或遭污染的儲存庫都可能碰到 SSH key、API token、其他專案、區域網路或主機設定。

傳統應用容器與 DevContainer 可以提供依賴隔離，但其主要目標通常是可重現開發環境，不一定把「容器裡的代理可能主動探索憑證、建立反向 shell、改寫之後會在主機上執行的 hook」視為核心威脅模型。`coi` 的切入點不同：它假設代理需要很高的容器內權限，因此不先削弱能力，而是把**權限放進隔離邊界，再把主機能力逐項顯式授權**。

另一個問題是平行與長時間工作。多個程式代理若共享同一個執行環境，容易互相污染套件、服務、連接埠與工作狀態。`coi` 以工作區／slot 建立獨立容器，並把「工作區檔案」、「代理工作階段」與「容器本身是否持久化」分開管理，讓容器可以預設銷毀，但工作成果與對話狀態仍可保留或恢復。

## 核心概念

第一個核心是**把完整機器語意留給代理，把信任邊界留在主機**。`coi` 使用 Incus 系統容器，而不是只跑單一應用程序的容器；代理在裡面可以有 root、systemd、Docker 與套件管理器，主機則透過非特權容器、UID/GID 映射與受控掛載避免把這些權限等同於主機 root。

第二個核心是**憑證預設不進容器**。SSH agent、環境變數、Unix socket、靜態憑證檔都需要明確設定；來自專案 `.coi/config.toml` 的高風險能力還會受 `coi trust` 與可信設定範圍（trusted scope）規則約束。這使儲存庫本身不能只靠提交一份設定檔，就任意取得主機 socket、執行主機命令或改變部分安全策略。

第三個核心是**預防、偵測、回應三層並行**。預防層包含網路模式、允許清單、對外連接埠限制、敏感路徑唯讀掛載與特權容器防護；偵測層監看程序、檔案、日誌與 nftables 網路事件；回應層則把 HIGH 事件自動暫停、CRITICAL 事件直接終止，並把事件寫入 JSON Lines 稽核紀錄。

第四個核心是**容器生命週期與工作狀態分離**。預設暫時模式（ephemeral）會在離開後刪除容器，但工作區檔案與代理工作階段仍保留；持久模式（persistent）才保留容器內已安裝套件與系統狀態。這讓「環境是否可丟棄」與「工作是否能續接」不必綁在一起。

第五個核心是**設定來源本身也有信任等級**。使用者全域設定、專案設定與 profile 可以疊加，但不是所有欄位都允許不受信任的專案來源控制。像 `dns_servers`、`allowed_ports`、Git 身分鎖定、主機命令產生環境變數等安全敏感能力會限制在可信來源，呈現一個值得參考的「設定也屬於攻擊面」設計。

## 架構與技術

儲存庫主要以 **Go** 實作，模組要求 Go 1.25，CLI 使用 Cobra，設定以 TOML／YAML 與 JSON Schema 驗證。核心執行環境由 **Incus 系統容器**提供，預設映像以 Ubuntu 24.04 為基礎，容器內可具 systemd、Docker、Node、Python、Git 等完整開發能力；`coi` 本身直接管理 Incus 的容器、掛載、網路、工作階段與生命週期。

在檔案邊界上，工作區會掛載進容器，但 `.git/hooks`、`.git/config`、`.husky`、`.vscode`、`.coi`、`.claude/settings.json` 等高風險路徑預設以唯讀方式保護。這些檔案的風險不只在當下：若代理能在沙箱內植入 Git hook、Claude hook 或編輯器設定，使用者之後回到主機原生工具時可能觸發沙箱外執行，因此 `coi` 把「跨工作階段／跨邊界的持久化植入」視為獨立威脅。

網路層主要依賴 **nftables**。預設 `restricted` 模式阻擋私有網段但允許一般網際網路；`allowlist` 模式由主機先解析核准的主機名稱，把同一組 IP 同時寫入防火牆與容器 `/etc/hosts`，並阻擋容器自行對外 DNS，降低代理改用其他解析結果繞過允許清單的空間。另可設定 DNS 解析器固定、全域 `allowed_ports`，以及 `allowed_domains` 的各目的地連接埠範圍。

監控程式碼不只存在於文件。`internal/nftmonitor` 的 `NetworkDetector` 會檢查 RFC1918 私有網段、`169.254.169.254` metadata 端點、可疑連接埠、允許清單違規與 DNS 查詢異常；`Daemon` 會把偵測事件交給 `monitor.Responder`，其中 HIGH 預設自動暫停、CRITICAL 預設自動終止。`internal/monitor` 另包含程序、檔案系統、網路、日誌、Sigma、GTFOBins、responder 與 audit 等模組及測試。

工具整合方面，README 目前列出 Claude Code、OpenCode、pi 與 Codex CLI。Codex CLI 已在 0.12.0 開發線加入，但不在預設映像的代理集合，需要在映像建置時明確啟用；`permission_mode = "bypass"` 會把 Incus 容器視為主要沙箱，因此可對應各代理的高權限／略過確認模式。工作階段恢復、profile、平行 slot、`coi run`、連接埠發布、socket 轉送、憑證匯入與健康檢查則構成周邊操作層。

## 主要功能

- **AI 程式代理系統容器**：讓代理在隔離環境中使用 root、systemd、Docker、套件管理器與完整 Linux 工具鏈。
- **多工具支援**：整合 Claude Code、OpenCode、pi 與 Codex CLI，並提供工具專屬啟動、憑證匯入與工作階段恢復邏輯。
- **工作區與工作階段管理**：支援工作區／slot 隔離、attach、resume、持久／暫時模式、snapshot 與清理流程。
- **網路隔離**：提供 `restricted`、`allowlist`、`open` 三種模式，並可限制 DNS、目的連接埠與個別目的地的連接埠範圍。
- **主機憑證邊界**：SSH agent、socket、環境變數與憑證檔皆透過顯式機制暴露，專案來源的敏感設定另有信任閘門。
- **主動安全監控**：偵測反向 shell、憑證掃描、資料外傳與可疑網路行為，依嚴重度記錄、暫停或終止容器。
- **敏感檔案保護**：將 Git hooks/config、AI 工具設定、編輯器設定等高風險路徑設為唯讀，降低代理把持久化執行點植回工作區的風險。
- **Hardened Profile**：內建針對不受信任儲存庫的設定組合，收緊網路、秘密暴露與持久化，並啟用監控。
- **任意命令沙箱**：`coi run -- <command>` 可讓一般腳本／測試工作使用與 Agent 相同的掛載、網路、資源限制與安全監控。
- **健康檢查與稽核**：`coi health` 檢查 Incus、核心、安全設定、儲存與監控條件；`coi audit` 提供 JSON Lines 威脅事件串流。

## 技術亮點

最值得保留的設計是**沒有把「安全」等同於降低 Agent 能力**。`coi` 接受程式代理需要 root、安裝套件、Docker 與服務管理的現實，改用「高權限只存在於受控系統容器」來建立能力邊界。這對自主程式開發的實務價值很高，因為安全模型不必靠代理每一步都問人才能成立。

第二個亮點是**把主機後續可能執行的設定檔視為供應鏈邊界**。保護 `.git/hooks`、`.claude/settings.*`、`.vscode` 等路徑，是針對「代理現在在沙箱內，但它可以修改未來會在沙箱外生效的檔案」這類跨時間攻擊。這比只限制 `/etc` 或主機家目錄更貼近程式代理的實際工作面。

第三個亮點是**網路政策具有可驗證的資料流**。允許清單不是只保留主機名稱字串，而是由主機解析後把相同 IP 同步進 nftables 與 `/etc/hosts`，再封鎖對外 DNS；目的地還可縮到特定連接埠。這使「名稱解析」本身也納入對外連線政策，而不是默認容器可自行找到其他位址。

第四個亮點是**偵測結果直接連到容器控制平面**。來源碼中的 responder 會把 HIGH／CRITICAL 事件映射成暫停／終止，而不是只產生日誌。這使監控成為真正的執行期控制迴路；對希望讓 Agent 長時間自治運作的系統而言，比事後查看稽核紀錄更有實際阻斷能力。

第五個亮點是**多處安全敏感流程採失敗時預設拒絕（fail-closed）**。例如明確要求唯讀 Git 身分時，若無法正確掛載就中止工作階段，而不是默默退回可寫狀態；部分不合法網路設定也會在啟動時直接拒絕。這類「不能安全套用就不要執行」的行為，比單純印出警告更適合作為安全執行層的預設。

## 限制與風險

第一個限制是 **Incus 系統容器仍共享主機核心**。它提供的隔離強度與 microVM／完整虛擬機不同，因此適合降低程式代理、供應鏈與誤操作風險，但不應把它描述成能對抗所有惡意核心漏洞利用的絕對安全邊界。若威脅模型包含刻意攻擊 Linux 核心或容器逃逸的任意惡意碼，仍應評估更強的虛擬化層。

第二個限制是**主動防禦屬偵測與回應層，不是隔離本身的替代品**。其中部分規則具有啟發式特徵，例如來源碼把 4444、5555、31337、8080 等目的連接埠列入可疑集合；合法開發服務也可能使用其中某些連接埠，因此監控有誤報可能，而自動暫停／終止也可能中斷正常工作。

第三個風險是**顯式整合功能本身可以重新打開信任邊界**。SSH agent 轉送、socket 轉送、憑證複製、環境變數注入與開放網路都是有用功能，但一旦啟用，就不能再假設容器完全看不到主機能力。`coi trust`、可信設定範圍與 `hardened` profile 的選擇，實際上是整套模型是否安全的重要一環。

第四個限制是 **Linux／Incus 維運成本**。macOS 需要先透過 Colima／Lima 等 Linux 虛擬機承載 Incus；網路隔離又依賴 nftables 與核心能力。儲存池若使用 `dir` 儲存驅動，README 也指出缺少寫入時複製（copy-on-write）會顯著拖慢每次容器啟動，因此實際體驗高度依賴主機 Incus、核心、儲存與防火牆配置。

第五個限制是**專案仍在快速演進**。截至 2026-08-19，CHANGELOG 頂端是 `0.12.0 (Unreleased)`，8 月 18–19 日仍在加入 Codex CLI、各目的地連接埠、DNS／對外連線控制與唯讀 Git 身分等安全功能；README 也保留近期 0.9 → 0.10 設定遷移說明。這代表它非常值得追蹤，但自動化整合不宜假設 CLI／設定介面已長期穩定。

Codex CLI 另有一個實務細節：目前不是預設映像中的代理，需要在映像建置時明確選入；若主機憑證存放在 OS keyring 而沒有 `auth.json`，則要在容器內使用 device auth 或 API key，普通瀏覽器 OAuth callback 無法直接回到容器。

## 與你的相關性

依公開 profile，這個專案與 **AI R&D、Agent 與 LLM Agent 工程**的相關性很高。研究或開發 Agent 時，模型與工具呼叫只是其中一層；真正要讓程式代理自主跑測試、裝套件、啟動服務與操作儲存庫，還需要一個能把高權限執行與主機資產分開的執行邊界。`coi` 正好提供一個可直接研究與試用的完整案例。

對 **AOI × AI** 的關聯較偏工程基礎設施，而非演算法本身。它沒有電腦視覺（Computer Vision）、檢測模型或產線能力，但可用來隔離依賴複雜的模型開發／測試工作，尤其當 Agent 需要自行安裝 CUDA 以外的系統套件、啟動服務、跑建置流程或分析不受信任的第三方儲存庫時，其安全與可重現性模式仍有參考價值。

對 SillyTavern／AI RPG 與 Image Generation 的直接關聯低；若未來把自主角色 Agent 或生成工具交給高權限 shell／檔案系統，才會透過「Agent 安全執行層」間接產生價值。

## 建議怎麼使用

- `TRY`：先用非敏感測試儲存庫執行 `coi shell --profile hardened`，實際驗證工作區寫入、套件安裝、Docker、網路阻擋與容器清理是否符合預期，再考慮納入日常 Agent 工作流程。
- `LEARN`：即使最後不用 Incus，也值得拆解它的信任範圍、受保護路徑、主機解析允許清單、憑證代理器、fail-closed 與 responder 設計，作為自建 Agent 沙箱的安全檢核表。
- `REFERENCE`：把它當作「高權限程式代理執行層」的參考基線，與只做 worktree 隔離、應用容器或遠端虛擬機的方案比較：誰控制核心、憑證、網路、持久化 hook、工作階段狀態與回應動作。
- `WATCH`：持續追蹤 0.12.x 之後的設定穩定度、Codex 預設整合、監控誤報調校、Incus／nftables 相依，以及快速新增的網路安全強化是否逐步收斂。

若要做一個小型驗證，建議挑同一個不受信任的開源儲存庫，分別用「主機原生執行」與 `coi` 的 `hardened` profile 讓程式代理做相同任務，再比較它能看到哪些環境變數／socket、能否碰私有網段、能否改 `.git/hooks`、異常行為是否產生稽核事件，以及任務完成後有哪些狀態仍留在主機。這比只確認 `coi shell` 能啟動，更能驗證它真正的安全價值。

## 與其他收藏的關聯

- [Orca](./github-stablyai-orca.md)：Orca 側重多個程式代理的 worktree、終端、任務編排與審查，是「如何管理平行 Agent」；`coi` 則把焦點放在每個 Agent 實際執行 shell、Docker、服務與不受信任程式碼時的作業系統、網路與憑證邊界。兩者可視為編排層與安全執行層的互補方案。
- [DeepSeek Harness 繁體中文版](./github-g36maid-deepseek-harness.md)：DeepSeek Harness 定義模型、工具、工作階段、權限核准與代理迴圈等執行環境介面；`coi` 則可以作為 `filesystem`／`subprocess`／`shell` 等高權限 capability 之下的隔離執行世界。前者偏 Agent 執行環境架構，後者偏主機安全與執行沙箱。

## 使用者備註

## 更新紀錄

### 2026-08-19

- 建立 Knowledge Card；收錄 Incus 系統容器、程式代理工具整合、主機憑證邊界、nftables 網路政策、主動威脅偵測與 HIGH／CRITICAL 自動回應，以及 0.12.0 開發線的 Codex、對外連線與 Git 身分安全強化。
