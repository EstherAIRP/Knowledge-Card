---
schema_version: 1
id: github-dstack-tee-dstack
title: dstack
canonical_url: https://github.com/Dstack-TEE/dstack
source:
  type: github
  url: https://github.com/Dstack-TEE/dstack
  identity: github:dstack-tee/dstack
resource_kind:
  ai: project
  user: null
created_at: 2026-08-26
updated_at: 2026-08-26
last_checked_at: 2026-08-26
summary: dstack 是開源的機密 AI（Confidential AI）部署框架，利用 Intel TDX、AMD SEV-SNP、AWS Nitro 與 NVIDIA Confidential Computing 等可信執行環境，讓既有 Docker 工作負載在受硬體保護的機密虛擬機中執行，並透過遠端證明、可重現映像、每應用程式金鑰與治理機制，讓使用者能驗證實際執行的程式與硬體環境。
classification:
  categories:
    ai:
      - Infrastructure / Deployment
      - AI / ML
    user: null
  tags:
    ai:
      - confidential-ai
      - confidential-computing
      - TEE
      - Intel-TDX
      - AMD-SEV-SNP
      - NVIDIA-Confidential-Computing
      - remote-attestation
      - confidential-VM
      - secure-inference
      - confidential-training
      - workload-identity
      - Docker-Compose
    user: null
relevance:
  ai:
    overall: 4
    ai_rd: 4
    aoi_ai: 3
    llm_agent: 4
    sillytavern_ai_rpg: 2
    image_gen: 2
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

# dstack

## 一句話介紹

dstack 是一套把 AI 推論、訓練與 Agent 工作負載放進可信執行環境（Trusted Execution Environment, TEE）的開源部署框架：應用仍可沿用 Docker Compose，但 CPU、記憶體、磁碟、網路與可選的 NVIDIA 機密運算 GPU 由硬體隔離與遠端證明機制保護，使用者不必只靠營運商宣稱「資料不會被看到」，而是能驗證執行環境與程式身分。

## 它解決什麼問題

一般雲端 AI 服務的隱私模型，往往仍要求使用者信任雲端供應商、主機管理者或服務營運者不會讀取提示詞、模型權重、訓練資料、RAG 內容與應用程式秘密。即使傳輸使用 TLS，資料進入伺服器記憶體後，基礎設施管理權限仍可能位於信任邊界內。

dstack 的切入點是把這個信任邊界往硬體層縮小。應用程式執行在 Intel TDX、AMD SEV-SNP 或 AWS Nitro 系列的受保護環境中，並透過遠端證明（remote attestation）提供「這台機器使用什麼硬體、啟動了什麼映像、執行了哪份工作負載」的可驗證證據。對 GPU AI 工作負載，專案另外整合 NVIDIA Confidential Computing，嘗試同時保護 CPU 與 GPU 端的模型權重、提示詞、梯度與中間運算資料。

這個框架也試圖降低導入成本。README 的主要路線不是要求應用重寫成 enclave 專用程式，而是讓既有 Docker Compose 工作負載進入機密虛擬機（Confidential VM, CVM），再由 dstack 補上映像建置、金鑰管理、證明、閘道、治理與主機層虛擬化。

## 核心概念

1. **硬體信任根而不是營運者信任**：TEE 將受保護記憶體與主機／Hypervisor 隔離；使用者的主要信任對象轉為 CPU／GPU 硬體、韌體與其證明 PKI，而不是直接信任基礎設施管理者。
2. **可證明的工作負載身分**：Guest OS、啟動量測、Compose 內容與部分執行期事件會納入證明資料，讓驗證者能把實際環境與自己審查過的程式／設定比對。
3. **每應用程式金鑰與機密資料生命週期**：KMS 在獨立 TEE 中驗證工作負載身分後才釋放或衍生金鑰，避免將長期秘密直接交給主機管理者。
4. **CPU 與 GPU 雙重證明**：GPU 工作負載不只確認 CPU TEE，還會驗證 NVIDIA GPU 的機密運算狀態、證明結果與政策；相關量測再與 CPU 端的事件紀錄綁定。
5. **治理也是安全邊界的一部分**：更新與金鑰授權可以受預先定義的治理規則控制。這讓「誰有權換掉程式或取得秘密」不只是一個主機管理權限問題。
6. **證明不等於程式安全**：專案文件明確指出，attestation 只能證明「什麼在執行」，不能自動證明程式沒有漏洞、沒有資料外洩邏輯或錯誤權限設計；應用本身仍需要審查。

## 架構與技術

儲存庫以 **Rust** 為主要語言，預設分支目前為 `next`，並包含核心服務、SDK、Guest OS、主機／客體執行碼、文件與工具。Guest OS 目前的建置後端採用 **Yocto**，並把共同 rootfs、映像組裝與建置後端拆開，保留未來加入其他 OS builder 的空間。

主要元件包括：

- **Guest Agent**：執行在每個 CVM 裡，負責產生證明、取得每應用程式金鑰、加密本機儲存，並透過 `/var/run/dstack.sock` 對應用提供介面。
- **KMS**：獨立執行於 TEE 中，在釋放金鑰前驗證工作負載證明與授權政策，並依應用程式身分衍生決定性的金鑰。
- **Gateway**：處理對外流量、憑證與路由，內部通訊可使用帶遠端證明的 TLS 機制；實際信任邊界仍需依部署方式與安全模型驗證。
- **VMM**：在自架 TDX 主機上解析 Docker Compose、啟動 CVM，並配置 CPU、記憶體與可選的機密 GPU 資源。
- **Guest OS**：以可重現映像與量測值作為驗證基礎，讓使用者可以把啟動環境與來源／核准雜湊比對。
- **SDK / API**：Guest Agent 提供 HTTP over Unix socket 介面，官方列出 Python、TypeScript、Rust、Go SDK，也可直接以 HTTP API 存取。

平台方面，README 目前列出裸機 Intel TDX、支援對應 Guest Image 的 AMD SEV-SNP 主機、Phala Cloud、GCP Confidential VMs 與 AWS Nitro Enclaves。GPU 路線支援 NVIDIA H100、H200、B200／Blackwell 等具 Confidential Computing 能力的 GPU；不同平台使用的證明載體與信任根並不完全相同。

## 主要功能

- **既有 Docker 工作負載進入 CVM**：以 Docker Compose 為主要應用描述，不要求一般 AI 服務先改寫成 enclave 專用 SDK。
- **機密 AI 推論**：可將 vLLM、代理服務或其他模型端點放入 TEE，讓提示詞、模型權重與中間資料維持在受保護記憶體中。
- **機密訓練／微調**：文件提供敏感訓練資料與 GPU 機密運算的部署模式，目標是避免主機營運者直接接觸資料、梯度與權重。
- **可信任 Agent**：可把 Agent、RAG、資料庫查詢與 LLM 呼叫放在受證明環境中；若下游 LLM 也在 TEE 中，可把端到端信任邊界延伸到模型服務。
- **遠端證明與工作負載驗證**：使用者可取得證明並比對 Compose hash、Guest OS 與硬體量測，確認實際部署是否與審查版本一致。
- **TEE 衍生金鑰**：應用可從工作負載身分衍生簽章／加密金鑰，使秘密不必以明文配置在主機環境。
- **磁碟與網路保護**：每應用程式金鑰用於靜態資料加密，網路路線則將 TLS 與受證明環境結合，降低基礎設施中介點看到明文的機會。
- **GPU 政策與證明**：啟動時可檢查 GPU 型號、CC／DevTools／debug／secure boot 等狀態，並可用 Rego v0 加入部署專屬政策。
- **多平台證明**：Intel TDX、AMD SEV-SNP、AWS Nitro 系列與 NVIDIA GPU 各有不同證明鏈，專案提供對應驗證文件與工具。

## 技術亮點

### 1. 把「機密運算」包裝成一般 AI 工程可用的部署層

許多 TEE 技術本身只提供硬體隔離原語，真正部署 AI 服務時仍要自行處理映像、證明、金鑰、TLS、GPU、工作負載身分與更新政策。dstack 的價值在於把這些元件整理成一套完整執行框架，並盡量保留 Docker Compose 工作方式，降低 AI 團隊跨入機密運算的門檻。

### 2. 不只保護 CPU，也把 GPU 納入可驗證政策

對 LLM 推論與訓練而言，只保護 CPU 記憶體並不足夠，因為模型權重、activation 與梯度大量存在 GPU。dstack 的安全模型會對 NVIDIA GPU 執行證明、檢查機密運算狀態，並把 GPU 政策雜湊與證明事件納入可遠端驗證的量測流程。這是它與只處理一般機密 VM 的部署工具最有辨識度的部分之一。

### 3. 安全模型把「能保護什麼」與「不能保護什麼」寫得相對清楚

文件沒有把 TEE 描述成萬能安全機制：側通道、微架構漏洞、阻斷服務、應用程式本身漏洞，以及持久儲存遭還原到舊的有效快照，都仍在限制範圍內。尤其磁碟加密只能提供機密性與部分完整性，無法單靠本地儲存證明資料是最新狀態；需要防回滾的應用仍要外部單調計數或可信狀態錨點。

### 4. 把可重現部署、證明與金鑰授權串成同一條信任鏈

dstack 並不是只產生一份 TDX quote。Guest OS 映像、工作負載 Compose、啟動事件、KMS 授權與應用金鑰彼此關聯，讓金鑰是否釋放可以依證明身分決定。這種「先驗證，再取得秘密」的模式，比單純在 VM 中加密磁碟更接近零信任式機密工作負載。

## 限制與風險

- **TEE 並未消除硬體與供應鏈信任**：Intel／AMD／AWS／NVIDIA 的硬體、韌體、憑證鏈與撤銷服務仍是信任基礎；不同平台的信任模型也不同，不能把所有「Confidential VM」視為同一安全保證。
- **應用程式仍可能自己外洩資料**：attestation 只能讓使用者知道正在執行哪份程式，不會自動判斷它是否偷偷記錄、傳送資料或含有一般軟體漏洞。
- **側通道與 TCB 漏洞仍存在**：專案安全模型要求持續更新 TCB；TEE 的微架構攻擊面不會因框架存在而消失。
- **可用性不在主要保護範圍**：不受信任的基礎設施營運者仍能關機、限速、切斷網路或移除資源。高可用需求仍要做跨節點／跨供應商冗餘。
- **持久儲存存在回滾問題**：加密磁碟可被營運者替換成先前合法的舊快照；需要強一致或防回滾狀態的系統必須再接外部可信狀態來源。
- **GPU 證明不是永久共址證明**：目前 GPU 安全流程主要描述啟動或重新證明當下的狀態，文件也指出無法完全排除裝置替換、熱拔插或遠端 relay／cuckoo 類型風險。
- **自架門檻不低**：要自行取得與維護 TDX／SEV-SNP 主機、相容 Guest OS、GPU Confidential Computing、TCB 更新與證明基礎設施，工程複雜度明顯高於一般容器平台。使用受管理平台可以降低維運成本，但也會改變實際的信任與供應商依賴。
- **效能數字應視為專案測試結果**：文件宣稱 CPU／GPU 額外成本有限，並提供接近裸機的 GPU 測試結果；這些數字仍應依模型、GPU、IO、驅動、平台與安全政策重新驗證，不宜直接當成通用保證。
- **授權需看元件邊界**：dstack 自有程式碼、SDK、文件、工具與 Guest OS 建置碼採 Apache-2.0，但嵌入與第三方元件仍保留各自授權與 SPDX 聲明。

維護狀態方面，Repository 在 2026-08-26 仍有更新，GitHub 顯示約 533 stars、93 forks，且 README 連結第三方安全稽核與公開安全報告。專案也自稱已用於實際 AI 基礎設施；這些成熟度訊號值得參考，但正式導入前仍應以最新 audit、威脅模型、硬體 TCB 與自己的工作負載驗證為準。

## 與你的相關性

- **AI R&D：4/5**。對模型推論、敏感資料微調、模型服務安全與可驗證 AI 系統很有研究／工程價值，尤其適合用來理解 TEE 如何從硬體原語延伸到完整 AI 部署棧。
- **AOI × AI：3/5**。dstack 不提供 AOI 模型、視覺演算法或產線整合，但若影像、配方、模型權重或製程資料不能暴露給雲端／機房營運者，機密推論與機密訓練可成為部署選項。
- **LLM / Agent：4/5**。官方文件直接涵蓋私有 LLM 推論、RAG／Agent 與機密 LLM 端點，適合研究「Agent 程式可驗證、資料處理環境不可由營運者窺視」的架構。
- **SillyTavern / AI RPG：2/5**。可以作為私有角色聊天或自架 LLM 的底層安全部署技術，但不處理角色記憶、世界模型、敘事或前端互動，因此關聯主要在基礎設施層。
- **Image Generation：2/5**。NVIDIA Confidential Computing 理論上同樣可保護生成模型權重與提示資料，但專案目前文件的核心案例更集中在 LLM／一般 AI 推論與訓練，並非影像生成工作流工具。

## 建議怎麼使用

- **LEARN**：先把 dstack 當作「Confidential AI 全棧參考實作」閱讀，重點看 security model、attestation、KMS、GPU policy 與可重現 Guest OS 如何串起來，而不是只看部署指令。
- **REFERENCE**：未來評估敏感 AI 工作負載、私有 LLM、跨組織資料合作或「雲端營運者也不應看見資料」的需求時，可拿它作為 TEE 架構比較基準。
- **WATCH**：TEE、NVIDIA Confidential Computing、AMD SEV-SNP 與雲端證明機制都還在快速演進，值得持續追蹤 dstack 對硬體平台、GPU 驗證、audit 與治理模型的更新。

若要實際驗證，建議先從受管理的測試環境或 no-TEE 開發映像理解 API／部署流程，再進入真正 TDX／GPU CC 環境。真正的採用判斷應以 threat model 為起點：先定義要防的是雲端營運者、主機管理者、GPU 管理面、應用程式本身，還是資料回滾，再確認 dstack 的保證是否涵蓋該威脅。

## 與其他收藏的關聯

- [code-on-incus (coi)](./github-mensfeld-code-on-incus.md)：兩者都處理高權限 AI 工作負載的隔離，但信任模型不同。`coi` 主要防止 Agent／不受信任程式碼影響宿主機，核心是 Incus 系統容器、憑證邊界與主動監控；dstack 則進一步假設基礎設施營運者可能不可信，以硬體 TEE 與遠端證明保護工作負載內容。兩者適合用來對照「沙箱隔離」與「機密運算」是兩種不同層級的安全問題。

## 使用者備註

## 更新紀錄

### 2026-08-26

- 建立 dstack Knowledge Card，整理機密 AI、TEE、遠端證明、KMS、GPU Confidential Computing、安全邊界與 AI 工作負載部署價值。
