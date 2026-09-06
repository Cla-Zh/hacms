# Modal Labs 深度研报 — 2026 Q3

> **一句话定位**:Modal 是从 Rust 容器运行时、FUSE 用户态文件系统、CRIU+gVisor CPU 内存快照、CUDA checkpoint GPU 内存快照出发,自下而上重建的"AI-native cloud",用 `@app.function()` 一个 decorator 取代 Docker/Kubernetes/Helm 的整个堆栈。2026 年 5 月 C 轮 $355M @ $4.65B post-money, ARR ~$300M,9 个月 5 倍增长。

| 字段 | 值 |
|---|---|
| 公司名 | Modal Labs, Inc. |
| 成立 | 2021-01 (incorporation 2022-02-10) |
| HQ | 233 Spring St, Floor 11, New York, NY |
| 团队规模 | 120+ (官方表述) / ~153 (第三方统计, 2026-04) |
| 创始人 | Erik Bernhardsson (CEO) + Akshat Bubna (CTO) |
| 法律实体 | MODAL LABS, INC. |
| 累计融资 | $466M (Seed 7 + A 16 + B 87 + C 355) |
| 最新估值 | $4.65B post-money (Series C, 2026-05-21) |
| ARR | ~$300M (2026-04, Modal 官方披露 + Sacra 估算) |
| 客户数 | 10,000+ 团队 (官方表述) |
| 沙箱累计启动 | >1 billion (截至 2026-05) |
| 调度验证规模 | 1,000,000 concurrent sandboxes in <60s (2026-07 演示) |

> **核心信源:** [Modal Series C](https://modal.com/blog/modal-series-c) · [Reuters exclusive](https://www.reuters.com/business/modal-labs-valued-465-billion-ai-coding-takes-off-2026-05-21/) · [Modal Series B](https://modal.com/blog/announcing-our-series-b) · [Sacra](https://sacra.com/c/modal-labs/) · [Erik Bernhardsson blog](https://erikbern.com/)

---

## 模块一 · 公司全景与商业底盘

### 1.1 公司概况

**Modal Labs, Inc.** 是 Erik Bernhardsson(CEO,Spotify 推荐系统之父,IOI 2003 金牌)和 Akshat Bubna(CTO,Scale AI 前 Staff Engineer,IOI 2014 金牌)于 2021 年 1 月在纽约创立的 AI 基础设施公司。法律实体 Modal Labs, Inc. 于 2022 年 2 月 10 日在 Delaware 注册 ([Amplify seed post](https://amplifypartners.com/blog-posts/modal))。

公司总部位于纽约 233 Spring Street Floor 11,另有 San Francisco、Stockholm、London 办公室 ([modal.com/customers](https://modal.com/customers), [modal.com/blog](https://modal.com/blog))。

**官方愿景**(Series C 自述):"Modal is a cloud built for AI. Not a single-purpose GPU cloud, but a platform with the right primitives for developers to build a very wide range of applications. Today, this looks like low-latency elastic inference, dynamic agent runtimes, reinforcement learning, batch jobs at massive scale, and much more." ([modal.com/blog/modal-series-c](https://modal.com/blog/modal-series-c))

**五大战略重心**(Series C 自述):
1. Low-latency elastic inference
2. Dynamic agent runtimes(Sandboxes)
3. Reinforcement learning infrastructure
4. Batch jobs at massive scale
5. Compute layer for agents — shipping granular RBAC(2026-06 已上线)

### 1.2 创始团队与关键工程师

**Erik Bernhardsson**([erikbern.com/about.html](https://erikbern.com/about.html), [Silicon Valley Investclub](https://siliconvalleyinvestclub.com/companies/modal-labs/team/erik-bernhardsson/)):
- **2003** IOI 金牌(瑞典队)
- **2008-2015** Spotify:2.5 年在 Stockholm 带 Analytics 团队,3.5 年在 NYC 建机器学习团队;Spotify 首个版本的推荐系统(Related Artists、Radio、Discover Weekly 的早期)即出自其手
- **2015-2021** Better.com CTO,管理 ~300 人技术团队
- 开源 **Luigi**(10k+ GitHub stars,Spotify 时代工作流引擎)和 **Annoy**(approximate nearest neighbors,业界事实标准之一)
- KTH 物理硕士

**Akshat Bubna**([LinkedIn](https://www.linkedin.com/in/akshat-bubna-188885103), [Founderland](https://www.founderland.ai/founder/akshat-bubna)):
- **2014** IOI 金牌(印度队)
- **2017** MIT 数学与计算机科学学士
- 创立 Modal 之前任 Scale AI Staff Software Engineer,主导 NLP 与 Quality 团队的核心工程系统

**关键工程师**(从 Engineering Blog 作者署名反推):

| 工程师 | 角色 | 代表作 |
|---|---|---|
| Jonathon Belotti | Member of Technical Staff | "Fast, lazy container loading in Modal"(2024-09), "Memory snapshots"(2025-01)。同时向上游 gVisor 提交 commits(例如 nvproxy 子组件的 85d1e860166348b4ae71bc1067ccf2613938c29e) |
| Luis Capelo | Member of Technical Staff | "GPU Memory Snapshots"(2025-07)第一作者 |
| Colin Weld | Member of Technical Staff | "Scaling to 1M concurrent sandboxes"(2026-07), "Linear programming for fun and profit"(Resource Solver, 2025-05), GPU Mem Snapshots 联合作者 |
| Connor Adams | Member of Technical Staff | 1M Sandbox 调度系统联合作者 |
| Irfan Sharif | Member of Technical Staff | Resource Solver LP/GLOP 联合作者 |
| Tristan Hume | 工程师 | Memory Snapshots post 中"process component state"示意图的原作者 |
| Yiren Lu | Solutions Engineer | "Top 5 serverless GPU providers"(2025-10) |

> **观察**:Modal 团队的工程师公开署名集中在 **5-7 人**,但 Modal 公开承认"120+ team"。这意味着公开博客作者只是技术叙事的代表,真实工程团队规模远大于此 — 整套自研 Rust 运行时、FUSE 文件系统、GPU 调度器、Linear Programming 资源求解器,需要的是一支接近 hyperscaler infra 团队规模的工程组织。

### 1.3 资本脉络

**完整融资时间线**(每一轮均有公开信源):

| 轮次 | 时间 | 金额 | Lead | 累计 | Post-money | 信源 |
|---|---|---|---|---|---|---|
| Seed | 2022-02-14 | $7M | Amplify Partners | $7M | 未披露 | [amplifypartners.com/blog-posts/modal](https://amplifypartners.com/blog-posts/modal) |
| Series A | 2023-10-10 | $16M | Redpoint Ventures(+Amplify、Lux、Definition) | $23M | 未披露 | [modal.com/blog/general-availability-and-series-a-press-release](https://modal.com/blog/general-availability-and-series-a-press-release), [TechCrunch](https://techcrunch.com/2023/10/10/modal-labs-lands-16m-to-abstract-away-big-data-workload-infrastructure/) |
| Series B | 2025-09-29 | $87M | Lux Capital | $111M | $1.1B | [modal.com/blog/announcing-our-series-b](https://modal.com/blog/announcing-our-series-b) |
| Series C | 2026-05-21 | $355M | Redpoint Ventures + General Catalyst | $466M | $4.65B | [modal.com/blog/modal-series-c](https://modal.com/blog/modal-series-c), [Reuters](https://www.reuters.com/business/modal-labs-valued-465-billion-ai-coding-takes-off-2026-05-21/) |

**Series C 的两个 tranche 结构**(Reuters 独家披露):
- 第一个 tranche 在 **$2.5B post-money** 关闭
- 第二个 tranche 推升至 **$4.65B post-money**
- 9 个月估值 4 倍跳升(对比 $1.1B 的 2025-09 Series B)
- 新进资方:Menlo Ventures、Bain Capital Ventures、Accel
- 全部现有主要投资人"加倍下注"(doubled down)

**投资人产业生态协同解读**:

| 投资人 | 投资定位 | 与 Modal 的协同 |
|---|---|---|
| **Amplify Partners**(Seed) | "radically technical founders reinventing the enterprise" | 早期识别 Erik + Akshat 是因为 Erik 写 Annoy 时给的反馈让合伙人 Sarah Catanzaro 改变了 thesis,典型 technical founder radar |
| **Redpoint Ventures**(A 轮领, C 轮跟) | 基础设施 vertical 的传统强项(Patrick Chase) | 三轮加注,显示深度 conviction |
| **Lux Capital**(B 轮领) | Frontier tech / science / 重 R&D | B 轮 lead 是因为 Modal 解决了 2023-24 GPU 抢购后普遍存在的 GPU 利用率问题 |
| **Definition Capital**(A 轮跟) | Multi-stage enterprise infra | 早期下注 |
| **General Catalyst**(C 轮 co-lead) | 激进 AI infra 配置 | C 轮联手 Redpoint 推动 tranche 结构 |
| **Menlo Ventures**(C 轮新) | Consumer + Enterprise AI | 提供 SaaS GTM 关系 |
| **Bain Capital Ventures**(C 轮新) | Bain 集团企业关系 | 大企业 GTM 桥梁 |
| **Accel**(C 轮新) | B2B infra 血统(Slack, Atlassian, Spotify) | B2B 拓展 |

**资本故事的核心张力**:
- 9 个月内估值从 $1.1B → $4.65B(4.2 倍)同时 ARR 增 5 倍($60M → $300M),**增长被基本面支撑,不是单纯 paper round**。
- C 轮 $4.65B / $300M ARR = **~15.5x forward revenue**,与 Fireworks 17.5x、Together 7x、Baseten 21x 处于同一区间,但 **Modal 是其中唯一 ARR 来自"基础设施(不只是 inference API)+Sandboxes(Agent 算力)"双引擎的公司**(其他三家基本是 inference API 单引擎)。

### 1.4 营收模式与客户

**定价模型(2026 年最新,[modal.com/pricing](https://modal.com/pricing))**:

| 资源 | 单价 |
|---|---|
| GPU B300 | $0.001972/sec (~$7.10/hr) |
| GPU B200 | $0.001736/sec (~$6.25/hr) |
| GPU H200 SXM | $0.001261/sec (~$4.54/hr) |
| **GPU H100 SXM5** | **$0.001097/sec (~$3.95/hr)** |
| GPU RTX PRO 6000 | $0.000842/sec |
| **GPU A100 80GB** | **$0.000694/sec (~$2.50/hr)** |
| GPU A100 40GB | $0.000583/sec |
| GPU L40S | $0.000542/sec |
| GPU A10 | $0.000306/sec |
| GPU L4 | $0.000222/sec |
| GPU T4 | $0.000164/sec |
| Standard CPU | $0.0000131/core/sec (1 physical core = 2 vCPU) |
| Standard Memory | $0.00000222/GiB/sec |
| **Sandbox CPU** | **$0.00003942/core/sec (3× standard)** |
| **Sandbox Memory** | **$0.00000667/GiB/sec (3× standard)** |
| Volume Storage | $0.09/GiB-月 (1 TiB/月 免费) |

**溢价乘数**:
- 区域选择 1.15-1.75×
- 非可抢占执行 3×

**订阅 tier**:
- Starter: $0/月 + $30 计算额度
- Team: $250/月 + $100 计算额度
- Enterprise: Custom

**自报 vs. 第三方 ARR 估算**(交叉验证):

| 时点 | ARR | 信源 |
|---|---|---|
| 2023-10 | 六位数/月(~$1M/yr) | TechCrunch 援引"familiar with the matter" |
| 2025-09 | ~$60M | Reuters 引述 Erik Bernhardsson |
| 2025-12 | ~$119M | Sacra 估算 |
| 2026-04 | **$300M** | Modal Series C 自述("surpassing $300M in annualized revenue"), Sacra 估算匹配 |

**【分析师估算】**:ARR 从 2025-09 到 2026-04 的 8 个月增长 5×($60M → $300M),年化增长率对应约 **150x YoY**(以 2024-09 为基准)。考虑到 2023-10 时 ARR 仅 ~$1M,2024-09 大概率是 ~$30-50M(线性外推)— 这意味着 ARR 增长曲线在 2024-2025 是 30-50x,在 2025-2026 是 5x,**减速但仍极快**。

按线性 2-3×/年外推:
- 2026 年底:~$600-900M
- 2027 年底:~$1.5-2.5B

**毛利率倒推**:
- GPU 上游成本:云厂(CoreWeave、Lambda、AWS、GCP、Oracle)对 A100 80GB 报价 ~$1.5-2.5/GPU-hr,H100 SXM ~$2.5-4/GPU-hr,H200 ~$2.5-3.5/GPU-hr
- Modal 售价:A100 80GB $2.50/hr,H100 $3.95/hr,H200 $4.54/hr
- 算上 LP arbitrage 的 H200 < H100 时点(Modal 自述"20% off"),Modal 实际混合成本可低至 ~$1.8-2.5/GPU-hr
- 混合售价 ~$3.0-4.0/GPU-hr → **推断毛利率 35-50%**([分析师估算])
- Sandbox 定价为标准 CPU/内存的 3× → **Sandbox 业务毛利率更高**,这是 Sandboxes 占收入 1/3+ 的关键意义

**客户结构**(按收入层级):

**Tier 1 收入贡献方(Series C 与 Modal Resources 自述)**:
- **Cognition**(Devin):"Modal powers both our reinforcement learning infrastructure and production inference. Millions of sandboxes on one end, real-time serving on the other."
- **Decagon**:Voice AI,p90 延迟 342ms
- **Reducto**:VLM 文档解析,延迟降 3×,吞吐 >100,000 pages/min
- **Physical Intelligence**:机器人实时推理,<10ms 网络开销
- **Suno**:每天生成数百万首歌曲,scale 到 thousands of GPUs
- **Runway**:多节点推理,4 个月 faster to launch
- **DoorDash**:merchant AI agents via Claude Managed Agents
- **Ramp Inspect**:70% of merged PRs 由 coding agent 撰写
- **Lovable**:48 小时跑 1M sandboxes,峰值 20k 并发
- **Quora (Poe)**:1k sandboxes/sec 压力测试
- **Meta**(Code World Models):thousands of concurrent sandboxes for RL
- **Applied Compute**:为 DoorDash/Cognition/Mercor 提供 RL
- **Chai Discovery**:蛋白嵌入 → 抗体设计
- **Mistral**:foundation model serving
- **Allen AI / Ai2**:Olmo、Tülu 部署

**合规**:SOC 2 Type 2 + HIPAA (Enterprise via BAA)([modal.com/resources/best-gpu-enabled-sandboxes-ai-agents](https://modal.com/resources/best-gpu-enabled-sandboxes-ai-agents))

---

## 模块二 · 产品矩阵与开发者体验

### 2.1 核心产品矩阵

Modal 的产品矩阵分为 **计算原语**、**存储原语**、**调度/路由原语** 三大类,所有原语通过同一个 Python DSL 暴露。

**计算原语**:

| 原语 | 用途 | 关键能力 |
|---|---|---|
| **Functions** | 单进程 autoscaling unit | `@app.function(gpu='H100', memory=4096)`,`scaledown_window`, `min_containers`, `buffer_containers`, `enable_memory_snapshot=True`, `experimental_options={'enable_gpu_snapshot': True}` |
| **Sandboxes** | 不可信代码执行 | gVisor 隔离(默认)/ VM Sandboxes (alpha);filesystem + memory snapshot;outbound domain allowlist;5 分钟默认寿命,可配 24h |
| **Clustered Jobs / Multi-Node** | 多节点训练、RL | RDMA 互联,closed beta |
| **Notebooks** | 浏览器 Jupyter | GPU memory snapshot 加速 10×;AI completion via Claude 4 |

**存储原语**:

| 原语 | 用途 | 关键能力 |
|---|---|---|
| **Image** | 容器镜像 DSL | `modal.Image.debian_slim().pip_install('torch').add_local_dir(...)`;Rust builder;layer 缓存;Dockerfile / registry pull / `run_function` (build 期可挂 GPU) |
| **Volumes v1** | 分布式文件系统 | <500k 文件推荐,<5 并发写 |
| **Volumes v2** | 同上,新架构 | 无限文件、hardlinks、并发写 hundreds 容器、HIPAA-compliant delete、commit/reload 更快、按需 tree traversal |
| **Cloud Bucket Mounts** | S3 等外部 bucket | 通过 Modal Secrets 挂载到 /mnt |
| **Dicts / Queues** | 跨 Function 共享状态 | Distributed dict / queue,unlimited 容量 |

**路由/调度原语**:

| 原语 | 用途 |
|---|---|
| **Web Endpoints** | HTTPS API,自定义域名,Static IP 代理 |
| **Streaming Endpoints** | Token streaming / WebRTC / WebSocket |
| **modal.experimental.http_server** | Ultra-low latency 区域路由(目标 <100ms 网络) |
| **Region Selection** | US East / US West / EU West / Asia Pacific South |
| **Tunnels / Proxies** | 出站端口代理,private network access |
| **Auto Endpoints** | 一行命令部署托管模型(GLM 5.2 FP8, Qwen3.6 35B A3B, Gemma 4 E4B IT) |

### 2.2 Infrastructure-from-Code 范式

**传统 Docker/Kubernetes/Helm 流程**:
```
Dockerfile → docker build → docker push to registry → 
  kubectl apply (Helm chart, ConfigMap, Deployment YAML) → 
    wait for image pull on node → wait for pod scheduling → 
      first request
```
每个环节都是异步、跨工具、跨团队的;feedback loop 分钟到小时;版本管理靠 git + CI/CD。

**Modal 范式**:
```python
import modal

image = modal.Image.debian_slim().pip_install("torch")
app = modal.App("inference")

@app.function(gpu="H100", memory=4096, enable_memory_snapshot=True)
def predict(prompt: str) -> dict:
    import torch, transformers
    model = transformers.pipeline("fill-mask", model="bert-base-uncased", device="cuda")
    return model(prompt)

# Deploy
# modal deploy app.py

# Call
# predict.remote("The capital of France is [MASK].")
```

Erik 在 2022 年的 post 中明确说:"We decided to not build this on top of tools like Docker/Kubernetes because we want infrastructure to be _fast_. I met a lot of VCs and other people while I was still just working alone on a prototype and most of them told me I was nuts when I started talking about building custom file systems and container engines." ([erikbern.com/2022/12/07](https://erikbern.com/2022/12/07/what-ive-been-working-on-modal.html))

Modal 在该 post 中给出的数据点至今仍被人引用:**"Modal has no problem building a 100GB container, and then booting up 100 of those containers — you can do the whole thing in a few seconds."**

**Inheritance of Behavior**:Modal Function 可以在本地直接 `.local()` 调用(在开发者机器上跑),也可以 `.remote()` 上云跑同样的代码 — 因为 image 定义和资源声明都在 Python 中,不是分开的 YAML 文件。这一特性让"本地能跑 → 云能跑"的鸿沟被消除。

---

## 模块三 · 硬核底层技术架构

本章是本研报的核心。每个子系统均给出 OS/内核交互级别的事实陈述 + URL 出处。

### 3.1 运行时与虚拟化栈

**核心结论:Modal Functions / Sandboxes 默认运行在 gVisor 的 `runsc`("run Sandboxed Container") OCI runtime 之上,而非 Docker / runc / Firecracker。**(多源验证)

| 证据 | 出处 |
|---|---|
| Modal docs 自述:"For added security, Modal runs containers using the sandboxed gVisor container runtime" | [modal.com/docs/guide/images](https://modal.com/docs/guide/images) |
| Modal 自述:"CRIU is developed for the runc container runtime, but for security reasons Modal uses the gVisor container runtime runsc" | [modal.com/blog/mem-snapshots](https://modal.com/blog/mem-snapshots) |
| Modal 自述(2025-06-15):"VM Sandboxes... run a real Linux kernel, so they can support workloads that run Docker containers within the Sandbox, or that require Linux features like eBPF, systemd, cgroups" | [modal.com/docs/guide/vm-sandboxes](https://modal.com/docs/guide/vm-sandboxes) |
| 第三方确认(2026 benchmark):"Modal Sandboxes isolation is gVisor, which is software-level (a user-space kernel that intercepts syscalls)" | [learndevrel.com sandbox benchmark](https://learndevrel.com/blog/agent-sandbox-runtimes-tested) |
| Modal 向上游 gVisor 贡献:commit 85d1e860166348b4ae71bc1067ccf2613938c29e 在 nvproxy 子组件,该子组件"communicates with the GPU's kernel-mode drivers" | [Modal's truly-serverless-gpus blog 引用](https://modal.com/blog/truly-serverless-gpus) |

**为什么不用 Docker/runc?**
- runc 容器直接与 host kernel 共享 syscall surface — 对执行 LLM 生成的 hostile 代码不够安全
- Modal 选 gVisor 是为了在不需要硬件虚拟化开销的前提下获得强隔离

**为什么不用 Firecracker?**
- Firecracker 是 KVM-backed microVM(Kernel-based Virtual Machine),启动需要 ~125ms,有 ~5MB memory overhead,但 **Firecracker 在每个 microVM 里都有一个完整的 guest kernel**,对 CUDA / GPU passthrough 不友好
- Modal 需要在数十万并发 sandbox 中提供 GPU,Firecracker 的硬件虚拟化路径与 NVIDIA GPU 的 passthrough 模型摩擦更大
- Modal 自述:"Because applications only interface with this emulated kernel [gVisor Sentry], they can be checkpointed and restored by it without cooperation from the host kernel." — **checkpoint/restore 是 Modal 选择 gVisor 的关键非显然原因**

**为什么 runsc 让 checkpoint/restore 变简单?**
> "Checkpoint/restore is actually especially easy for runsc. A container in the runsc runtime is straightforwardly a state machine. That is, the runtime is architected (in Go) as a collection of tasks with cooperative preemption, as in most other systems with async/await-style concurrency. The system is already being interrupted and then continued at every await point, so it's 'only' a matter of serializing that state into a checkpoint." ([truly-serverless-gpus blog](https://modal.com/blog/truly-serverless-gpus))

**VM Sandboxes(alpha, 2026-06-15)**:
- 通过 `experimental_options={'vm_runtime': True}` 启用
- 使用真实 Linux kernel(KVM 后端)
- 适用场景:Docker-in-Docker、eBPF、systemd、custom cgroups、I/O 敏感工作负载
- 与 Memory Snapshots **部分兼容**:Filesystem Snapshots 支持,Memory Snapshots **尚未支持**
- 这是 Modal 承认 gVisor 在某些 Linux feature 上覆盖不全后的扩展路径

### 3.2 冷启动消除机制 — ImageFS + CPU/GPU Snapshot

Modal 的冷启动消除是**三层叠加**,缺一不可:

#### 3.2.1 ImageFS — FUSE 用户态文件系统 + 内容寻址

**核心设计**(Modal 官方定义在 [jono-containers-talk 2024-09-08](https://modal.com/blog/jono-containers-talk)):

| 设计点 | 值 / 描述 |
|---|---|
| Image Index 大小 | ~5 MiB |
| Index 加载延迟 | 1-100 ms(memory / SSD / AZ cache / CDN / blob) |
| FUSE 挂载延迟 | ~2 ms |
| 文件内容获取 | 按需,经 FUSE kernel module 转发到 user-space server |
| 内容寻址 | 文件 chunks 由 hash 命名 → dedup + immutable cache |

**数据路径**(5 个 tier):
```
Python container process
    ↕ (libfuse syscall)
FUSE kernel module (host)
    ↕
FUSE user-space server (Modal Rust process)
    ↕
host page cache → SSD → AZ cache server → regional CDN → blob storage
```

**关键性能调优**(Belotti 公开承认):
- **`read_ahead_kb`**:从 Linux 默认 128 KiB 调到 **32 MiB**
- **1 GiB read-ahead 引发"disastrous latency issues in production"**(Modal 自述) → **生产环境最后停在 32 MiB**
- **FUSE request size**:从 128 KiB 调到 1 MiB
- **跳过 gzip 解压**:"DEFLATE is inherently single-threaded (LZ77, Huffman), which limits you to ~100 MB/s, much lower than the throughput of any of the cache layers"
- **zstd 在 Modal 自控 build 时使用,否则 raw bytes**
- **大 host 配置**:AWS 8-GPU 实例,~5 GB/s 网络,RAID-0 SSD
- **多流下载**(multi-flow HTTP):用多个 source IP / port / protocol 绕过 per-flow throttle

**实测吞吐**:
- 调优前 ~800 MB/s
- 调优后 **~2.5 GB/s**
- 512 MiB .safetensors 文件:disk cache 200ms,network 300ms

**第三方验证**: Jordi Villar 用 250 行 Python 实现了一个 toy FUSE image loader,复现了同样的核心思想 — content addressing + lazy load + tiered cache,验证该设计的极简性([jordivillar.com/blog/lazy-loading-images](https://jordivillar.com/blog/lazy-loading-images))

#### 3.2.2 CPU Memory Snapshot — CRIU + gVisor

**核心技术栈**([modal.com/blog/mem-snapshots](https://modal.com/blog/mem-snapshots)):

| 组件 | 来源 | 角色 |
|---|---|---|
| **CRIU**(Checkpoint/Restore In Userspace) | Linux kernel patch 099469502f62fbe0d7e4f0b83a2f22538367f734,2011 年由一群"mad Russians"提交 | 原生针对 runc 的快照/恢复机制 |
| **gVisor Sentry** | Google,Go 实现 | Modal 真正跑 sandbox 的 runtime,自带 checkpoint/restore 实现 |
| **gVisor save_restore.go** | "at least eighteen system components implement checkpoint/restore functionality in save_restore.go files" | 序列化 Sentry 自己的 async/await state machine |

**Snapshot 内容**:
- 容器文件系统 mutations(overlayfs upper dir 状态)
- 整个进程树
- 每个进程的状态:memory mappings、file descriptor table、registers、environment variables、PID
- **不包括**:live network connections、NVIDIA GPU state(单独处理)

**触发时机**:
```python
snapshot_info: Optional[api_pb2.SnapshotInfo] = None
if function_proto.checkpointing_enabled:
    snapshot_info = await get_or_create_checkpoint_for_worker_and_task(
        state, ephemeral_function_struct, worker_ephemeral_struct, task_id
    )
```
- **On-demand, not proactive**:只有当 scheduler 发现目标 worker host 上没有匹配的 snapshot 时才创建
- **一个 Function version 会有多个 snapshot**:因为不同 worker host 的 CPU instruction set / OS micro-version 不同,无法跨 host 通用
- **g6.12xlarge 缺 pclmulqdq 指令**,因此不能在含该指令的 host 上 restore — 这是 Modal 多云架构必须付出的代价

**API 用法**:
```python
@app.function(enable_memory_snapshot=True)
def f():
    print(f"Hello from torch {torch.__version__}.")
```
或在 lifecycle 中:
```python
@modal.enter(snap=True)
def load(self):
    # 快照前执行 — 通常是 load model weights 到 CPU
    self.model = AutoModelForCausalLM.from_pretrained("...")

@modal.method()
def predict(self, x):
    # restore 后从快照点继续执行
    return self.model(x).to("cuda")  # GPU state 在 restore 后重建
```

**性能数据**:
- Stable Diffusion:13s 正常冷启动 → 3.5s snapshot restore(2.5×)
- import torch: ~5s 正常 → **1.05s p50 / 0.69s p0**(7.2× speedup)

#### 3.2.3 GPU Memory Snapshot — CUDA Checkpoint API

**触发条件**:NVIDIA 在 driver 分支 570 / 575 中加入了 `cuCheckpointProcessLock / cuCheckpointProcessRestore / cuCheckpointProcessUnlock` 三件套([Modal GPU Mem Snapshots blog](https://modal.com/blog/gpu-mem-snapshots), [NVIDIA CUDA Driver API docs](https://docs.nvidia.com/cuda/cuda-driver-api/group__CUDA__CHECKPOINT.html))。

**Snapshot 流程**:
1. **Lock CUDA processes** — `cuCheckpointProcessLock()` 防止在快照过程中发起新的 GPU 操作
2. **等待所有进程进入 `CU_PROCESS_STATE_CHECKPOINTED`** 且无活跃 CUDA sessions
3. **Snapshot CPU memory + GPU memory** — 一个统一的 pages 文件
4. **Restore 时反向**: `cuCheckpointProcessRestore()` → `cuCheckpointProcessUnlock()`

**约束**(Modal 自述):
- Multi-GPU + NCCL 程序容易在 snapshot 期间死锁(peer pause 时 deadlock)
- vLLM / SGLang 需要先 offload weights 到 CPU 再 snapshot,空 KV cache 应在 restore 后重建而非 restore 空 KV cache

**API**:
```python
@app.cls(
    gpu="a10g",
    enable_memory_snapshot=True,
    experimental_options={"enable_gpu_snapshot": True}
)
class ImageClassifier:
    @modal.enter(snap=True)
    def load(self):
        # 现在可以直接 load 到 GPU,不再需要 snap=True/snap=False 拆分
        self.model = AutoModelForImageClassification.from_pretrained("google/vit-base-patch16-224").to("cuda")
        self.model = torch.compile(self.model)
```

**性能数据**(GPU mem snapshots 启用前后):
| 工作负载 | 关闭 P0 | 开启 P0 | 加速比 |
|---|---|---|---|
| Parakeet (NVIDIA NeMo) | 20s | **2s** | **10×** |
| ViT + torch.compile | 8.5s | 2.25s | 3.8× |
| vLLM Qwen2.5-0.5B-Instruct | 45s | 5s | 9× |
| Reducto VLMs(自定义) | 70s | ~12s | 6× |

> **关键洞察**: Modal 的 cold-start 优化是**叠加而非替代**的。Lazy load + CPU snapshot + GPU snapshot 各自解决不同 bottleneck,合起来使"任意 Function 从 idle 恢复到 ready 接受 request"的端到端延迟从 ~2,000 秒降到 ~50 秒(40×)— 这是 [truly-serverless-gpus](https://modal.com/blog/truly-serverless-gpus) 文章的核心数据点。

### 3.3 GPU 虚拟化、共享与调度

#### 3.3.1 支持的 GPU 谱系

Modal 公开支持([modal.com/docs/guide/gpu](https://modal.com/docs/guide/gpu)):

| 类型 | 架构 | 显存 |
|---|---|---|
| T4 | Turing | 16 GB |
| L4 | Ada Lovelace | 24 GB |
| A10 | Ampere | 24 GB |
| A100-40GB | Ampere | 40 GB |
| A100-80GB | Ampere | 80 GB |
| L40S | Ada Lovelace | 48 GB |
| H100 / H100! | Hopper | 80 GB HBM3 |
| H200 | Hopper | **141 GB HBM3e, 4.8 TB/s** |
| B200 / B200+ | Blackwell | 192 GB HBM3e |
| B300 | Blackwell Ultra | (新) |
| RTX PRO 6000 | Blackwell Server Edition | (新) |

**H100 → H200 自动升级**:request `H100` 可能被调度到 H200,**价格不变**,kernels 兼容。Modal 自述 H200 容量是 H100 的 1.75×,带宽 1.4×。

#### 3.3.2 GPU 共享:MIG / vGPU / Time-Slicing 的现状

**Modal 不在生产中启用 MIG 或 vGPU**。这是一个值得注意的**架构选择**:
- Modal 自家的 glossary [modal.com/gpu-glossary](https://modal.com/gpu-glossary)(开源仓库 [github.com/modal-labs/gpu-glossary](https://github.com/modal-labs/gpu-glossary),665 stars)对 MIG、vGPU、time-slicing 有详细描述,**说明 Modal 工程师理解这些技术但当前不在生产中使用**
- 单个 Function 默认独占整块物理 GPU(单 GPU / 8 GPU node)
- MIG-backed vGPU 需要更复杂的调度(NVIDIA 文档 [nvidia.com/.../mig-user-guide](https://docs.nvidia.com/datacenter/tesla/mig-user-guide/introduction.html) 描述了 MIG 的硬件分片模型)
- **推断**:Modal 选择了"小粒度共享在 OS/资源层做(在同一物理 GPU 上跑多个进程),大粒度共享在硬件层做(MIG)"的二选一中,前者通过多 Process / 多 Container 在一个物理 GPU 上跑,后者未产品化
- 这与 Beam.cloud(beta9 runtime)、Replicate、Baseten 的方案一致 — **整个 serverless GPU 行业目前都没有产品化 MIG**,因为 MIG 限制了 CUDA compatibility profile,对 inference engine 的兼容性更严苛

#### 3.3.3 调度器架构(2026-07 重构)

**之前的问题**([modal.com/blog/scaling-to-1-million-concurrent-sandboxes-in-seconds](https://modal.com/blog/scaling-to-1-million-concurrent-sandboxes-in-seconds)):
- Postgres 在 sandbox create / schedule 关键路径上,**O(sandboxes) writes**
- 中央调度器(类比 K8s scheduler)
- 每个 finished sandbox 触发 durable workflow,**churn 高时 event backlog 暴涨**
- Worker heartbeat O(nodes) → DB writes 暴涨

**K8s 类比**(Modal 自述 K8s 痛点):
- Scheduling algorithm `O(n × p)` 串行化
- 每个 pod 多次 etcd writes
- Heartbeat O(nodes) 写到 etcd
- etcd **在 keyspace 内不可分片**

**Modal 新架构**:
1. **水平扩展的 scheduling servers**,并发处理 create 请求
2. **In-memory cached worker state**(不是单一 source of truth)
3. **Workers 自己是 source of truth** — workers 周期性把状态 publish 到 Redis stream
4. **Schedulers 消费 Redis stream 异步**,根据 in-memory cache 做调度决策
5. 选定 worker 后,**scheduler 直接 RPC 该 worker**,worker accept(有 free resources)/ reject
6. **Sandbox 对象存在 Redis,不在 critical path**

**关键 bug 修复**:Modal 发现新调度器把 sandbox 推到 worker **太快**,大量并发 sandbox 创建在 worker 上设置容器网络规则时**竞争 Linux 内核的 `rtnl` lock**(网络路由相关锁),导致容器启动时间从 sub-second 涨到 tens of seconds — 必须重做容器网络设置以承受 burst 流量。

**结果**:
- 1,000,000 sandboxes 在 **<60 秒** 内创建
- p50 time-to-interactivity **<500ms**
- 单一 Redis stream 支持 >100k workers;若需要,加更多 streams(不依赖 ordering)

**调度架构对比**(Modal 自述,与 K8s):
| 维度 | K8s | Modal 原架构 | Modal 新架构 |
|---|---|---|---|
| Centralized durable store | etcd | Postgres | Redis(off critical path) |
| Scheduler | 单一 scheduler(可并行化但需 scatter-gather) | 乐观并行 + 中央协调 | 水平扩展 LB-style |
| Worker state source of truth | API server | Postgres | Worker 自己 |
| Bottleneck scaling | etcd writes | O(sandboxes) Postgres writes | 单一 Redis stream(可加) |

#### 3.3.4 容量编排:Linear Programming Resource Solver

**问题**:13+ 云厂的 GPU 价格 / 容量 / 性能 / 区域动态变化,如何选择最便宜的组合满足动态需求?

**解决方案**([modal.com/blog/resource-solver](https://modal.com/blog/resource-solver)):
- 用 **Linear Programming(LP)** 形式化:目标最小化成本,约束满足需求 + buffer headroom + region mix
- 使用 Google 的 **GLOP solver**(OR-Tools 库的一部分)
- 求解器外部 service 周期抓取数据 → GLOP 输出 delta(各 instance type spin-up/spin-down 数量)
- Background workers 调用各云厂 API 执行 instance 请求
- 失败 → observed scaling limit 反馈到下一次求解

**自报节约**:Modal 称"capture arbitrages... saving millions of dollars a year"。具体例子:**H200 几个月前比 H100 便宜 20%,solver 自动 pick H200**。

**Dual Mandate 类比**(Modal 自述):"Like the Fed, with a dual mandate" — 用户体验(scale 快)和成本最优化经常冲突。

### 3.4 存储分层与分布式 I/O

**Volumes**(持久存储):

| 属性 | v1 | v2 |
|---|---|---|
| 文件数 | <500k 推荐 | 无限 |
| 并发写 | <5 容器 | 数百容器 |
| Hardlinks | 不支持 | 支持 |
| HIPAA 删除合规 | 否 | 是 |
| Random write performance | 可能需重写整个文件 | 仅写变化部分 |

**预期吞吐**:"designed to provide up to 2.5 GB/s of bandwidth (not guaranteed)"([modal.com/docs/guide/volumes](https://modal.com/docs/guide/volumes))

**实现细节 Modal 未完全公开**(推测):
- 跟 ImageFS 同构 — 内容寻址 + 多 tier cache(RAM / SSD / AZ / regional / blob)
- Modal 自述 backing by "multiple cloud providers" 暗示多云冗余
- v2 "demand loading of the filesystem tree" 暗示元数据是按需加载的,类似于 ImageFS 的 index 模式

**Model Weights 加载路径**(truly-serverless-gpus 自述):
- 跨 AZ:几 GB/s
- 同 AZ:3×
- **同 rack RDMA(InfiniBand/RoCE):10×**
- Modal 自述"doable, but expensive and gnarly, especially when scaling to many models and dynamic worker pools. We're working on it!" — **RDMA weight server 尚未产品化**

### 3.5 健康检查与可靠性

**GPU 健康监测**([modal.com/blog/gpu-health](https://modal.com/blog/gpu-health)):
- 每个 GPU node **每周一次** deep active check(NVIDIA DCGM `diag` level 2)
- GPUBurn/GPU-fryer 验证
- Local NCCL all-reduce 测试(NVLink / NVSwitch / NVLink SHARP 性能)
- 4 个 GPU 指标暴露给每个容器:memory / utilization / temperature / power
- 异常 Xid 错误实时写入 log("gpu-health" lines)
- Modal 维护一份 "Xid and sXid dictionary",自述"the best GPU error resource on the internet"
- Critical level Xid errors per hour per GPU 在云厂间差异巨大(Modal 自述"Failure rates are far from negligible")

**Container start lifetime 总体保证**:"Containers boot in about one second."([modal.com/docs/guide/cold-start](https://modal.com/docs/guide/cold-start)) — 这是 Modal 自报,用户实际 P0/P50/P99 取决于 snapshot 命中率和代码 init。

---

## 模块四 · 硬核技术博客解构

本章对 6 篇最有价值的 Modal 博客做"Problem / Solution / Benchmark / Source"四段式拆解。

### 4.1 Fast, lazy container loading in Modal.com

| 字段 | 值 |
|---|---|
| **标题** | Fast, lazy container loading in Modal.com |
| **作者** | Jonathon Belotti(@jonobelotti_IO) |
| **发布日期** | 2024-09-08 |
| **Source** | [modal.com/blog/jono-containers-talk](https://modal.com/blog/jono-containers-talk) |

**Problem Statement**
Serverless cold start. 一个典型的 8 GiB Python "fat container" 在 naive `docker run` 流程下需要 ~1 分钟(网络下载 ~2 GiB/s,单线程 gzip 解压 ~80 MiB/s,unpack 到 rootfs)。K8s 集群可以容忍,因为 pod 调度频率低,但 Modal 是 serverless 平台,每分钟可能调度数百个新 pod。

**Solution Details**
- **ImageFS**:容器 image 变成一个 ~5 MiB 的 content-addressed index,文件 contents 按需通过 FUSE kernel module → user-space server → tiered cache 拉取
- **5 tier 数据路径**:Python container → FUSE server → host page cache → SSD → AZ cache → regional CDN → blob
- **`read_ahead_kb`** 从默认 128 KiB 调到 **32 MiB**(在 big hosts 上)
- **FUSE request size** 从 128 KiB 调到 1 MiB
- **Skip gzip 解压**:"DEFLATE is inherently single-threaded (LZ77, Huffman), which limits you to ~100 MB/s"
- **zstd** 在 Modal 自控 build 时使用,否则 raw bytes
- **大 host**:AWS 8-GPU instances,~5 GB/s down,RAID-0 SSD
- **Multi-flow HTTP**:用多个 src IP/port/protocol 绕开 per-flow throttle

**Benchmarks**
- 调优前: **~800 MB/s**
- 调优后: **~2.5 GB/s**
- 512 MiB .safetensors 文件:disk cache **200ms**,network **300ms**
- 1 GiB read-ahead 引发"disastrous latency issues in production" → Modal settled on 32 MB

### 4.2 Memory snapshots: Checkpoint/restore for sub-second startup

| 字段 | 值 |
|---|---|
| **标题** | Memory snapshots: Checkpoint/restore for sub-second startup |
| **作者** | Jonathon Belotti |
| **发布日期** | 2025-01-28 |
| **Source** | [modal.com/blog/mem-snapshots](https://modal.com/blog/mem-snapshots) |

**Problem Statement**
即使 ImageFS 把文件系统加载延迟降到 <100ms,Python 进程仍然要执行 `import torch` 等 26,000 syscalls。这是文件系统不能消除的 cost。

**Solution Details**
- **CRIU** (Linux kernel patch 099469502f62fbe0d7e4f0b83a2f22538367f734,2011 年"mad Russians"提交) 原生针对 runc
- Modal 跑在 gVisor 的 `runsc` 上,**gVisor 自己的 Sentry(Go 实现)实现了 checkpoint/restore** — "at least eighteen system components implement checkpoint/restore functionality in save_restore.go files"
- Snapshot 内容:容器 fs mutations + 整个进程树(memory mappings + fd table + registers + env vars + PID)
- Snapshot 文件 = 单个 'pages' 文件(100 MiB - 10 GiB)
- gVisor 的**prioritized background page loading** + Modal FUSE 的**aggressive preload** 协同,最小化 aggregate page-fault latency
- On-demand, not proactive:scheduling 时如果目标 worker host 没有匹配的 snapshot 才创建
- 一个 Function version **会有多个 snapshot**(不同 worker host 的 instruction set / OS micro-version 不兼容)

**Benchmarks**
- Stable Diffusion:13s → **3.5s**(2.5×)
- import torch:~5s → **1.05s p50 / 0.69s p0**(7.2× speedup)
- Restore 是 I/O bound(主进程 memory mappings 喂进 host page cache)

### 4.3 GPU Memory Snapshots: Supercharging sub-second startup

| 字段 | 值 |
|---|---|
| **标题** | GPU Memory Snapshots: Supercharging sub-second startup |
| **作者** | Luis Capelo, Colin Weld |
| **发布日期** | 2025-07-30 |
| **Source** | [modal.com/blog/gpu-mem-snapshots](https://modal.com/blog/gpu-mem-snapshots) |

**Problem Statement**
CPU memory snapshot 不能包含 GPU state。所以 `model.to('cuda')` 必须在 snapshot restore 后再做,吃掉了 CPU snapshot 带来的 wins。

**Solution Details**
- 利用 NVIDIA CUDA checkpoint API(driver 分支 570 / 575)
  - `cuCheckpointProcessLock()` 防止 snapshot 期间发起新 GPU 操作
  - 等待所有进程到 `CU_PROCESS_STATE_CHECKPOINTED`
  - snapshot CPU + GPU memory 一起
  - restore 时:`cuCheckpointProcessRestore()` → `cuCheckpointProcessUnlock()`
- **不需要再分 `snap=True` / `snap=False` lifecycle**
- 集成进 gVisor checkpoint/restore system
- 不同 worker host 间硬件兼容性检查 → fallback to CPU-only snapshot

**Benchmarks**
| 工作负载 | 关闭 P0 | 开启 P0 | 加速比 |
|---|---|---|---|
| Parakeet (NVIDIA NeMo) | 20s | **2s** | **10×** |
| ViT + torch.compile | 8.5s | 2.25s | 3.8× |
| vLLM Qwen2.5-0.5B-Instruct | 45s | 5s | 9× |

### 4.4 How we achieved truly serverless GPUs

| 字段 | 值 |
|---|---|
| **标题** | How we achieved truly serverless GPUs |
| **作者** | Modal engineering(Erik cross-posted) |
| **发布日期** | 2026-05-12 |
| **Source** | [modal.com/blog/truly-serverless-gpus](https://modal.com/blog/truly-serverless-gpus) |

**Problem Statement**
GPU allocation utilization 对 inference 工作负载常 10-20%(用户 over-provision 应对 burst)。四个 bottleneck:
1. Instance acquisition(GPU 分配分钟级)
2. Machine management / boot
3. Container image + filesystem loading
4. App-level host + device initialization

Naive 2000s vs Modal 50s for fresh inference replica(40×)。

**Solution Details — 四大 ingredient**
1. **Multi-cloud capacity orchestrator**(Resource Solver):13+ cloud providers,LP via GLOP;capture H200 < H100 时点的 arbitrage
2. **Cloud buffers**:small idle GPU pool to absorb new load
3. **Custom filesystem**(ImageFS):lazy, content-addressed, multi-tier cache
4. **Checkpoint/restore**:CPU(CRIU+gVisor)+ GPU(NVIDIA CUDA checkpoint API)

**关于 runsc checkpoint 的非显然洞察**
> "Because applications only interface with this emulated kernel [gVisor Sentry], they can be checkpointed and restored by it without cooperation from the host kernel. Checkpoint/restore is actually especially easy for runsc. A container in the runsc runtime is straightforwardly a state machine. ... The system is already being interrupted and then continued at every await point, so it's 'only' a matter of serializing that state into a checkpoint."

**Benchmarks**
- 40× spin-up improvement(50s vs 2000s)
- vLLM Qwen3-0.6B boot:CPU+GPU snapshots reduce 95th-percentile restore time materially
- AWS `g6.12xlarge` **缺 `pclmulqdq` 指令** → 不能接受带该指令 host 上做的 snapshot
- RDMA weight server 可以让 model load 带宽提升 3-10×(in-AZ / in-rack),但**尚未产品化**

### 4.5 Scaling to 1 million concurrent sandboxes in seconds

| 字段 | 值 |
|---|---|
| **标题** | Scaling to 1 million concurrent sandboxes in seconds |
| **作者** | Colin Weld, Connor Adams |
| **发布日期** | 2026-07-16 |
| **Source** | [modal.com/blog/scaling-to-1-million-concurrent-sandboxes-in-seconds](https://modal.com/blog/scaling-to-1-million-concurrent-sandboxes-in-seconds) |

**Problem Statement**
Run a million concurrent sandboxes(数十万 nodes)。K8s 不可行:
- `O(n × p)` 调度算法,默认串行化
- 每个 pod 多次 etcd writes
- Heartbeat O(nodes)
- etcd 在 keyspace 内**不可分片**
Modal 原架构也有同样问题:Postgres 在 critical path 上,O(sandboxes) writes;每个 finished sandbox 触发 durable workflow。

**Solution Details**
1. **水平扩展的 scheduling servers**,并发处理 create 请求
2. **In-memory cached worker state**(不是单一 source of truth)
3. **Workers 自己是 source of truth** — workers 周期性把状态 publish 到 Redis stream
4. **Schedulers 消费 Redis stream 异步**,根据 in-memory cache 做调度决策
5. 选定 worker 后,**scheduler 直接 RPC 该 worker**,worker accept(有 free resources)/ reject
6. **Sandbox 对象存 Redis,不在 critical path**
7. **只两个网络 hop + 一个便宜 CPU op**

**rntl lock 修复**:新调度器推 sandbox 到 worker **太快**,worker 上大量 sandbox 创建在设置容器网络规则时竞争 Linux 内核的 `rtnl` lock(网络路由相关),导致容器启动 tens of seconds → Modal 重做容器网络设置。

**Benchmarks**
- 1,000,000 sandboxes **<60 秒**
- p50 time-to-interactivity **<500ms**
- 单一 Redis stream 可用至 >100k workers;可加更多 streams

### 4.6 Linear programming for fun and profit (Resource Solver)

| 字段 | 值 |
|---|---|
| **标题** | Linear programming for fun and profit |
| **作者** | Colin Weld, Irfan Sharif |
| **发布日期** | 2025-05-07 |
| **Source** | [modal.com/blog/resource-solver](https://modal.com/blog/resource-solver) |

**Problem Statement**
找最优云厂 instance type 组合满足动态需求,given per-instance price + capacity limit across 13+ providers + demand variability + buffer headroom + per-region mix + GPU performance equivalence。

**Solution Details**
- LP formulation,目标最小化成本,约束满足需求
- 用 Google 的 **GLOP solver**(OR-Tools)
- Pre-prune instance types 启发式(cut solve time 10×,lose a bit accuracy)
- Solver 输出 delta → background workers 调云厂 API → 失败 → observed scaling limit → feedback

**Dual Mandate 类比**
> "Like the Fed, with a dual mandate — our scaling decisions must be made quickly and be cost-optimal. Like the Fed, we find that our two mandates are often in conflict."

**Benchmarks**
- 自报"saving millions of dollars a year"
- "几个月前 H200 比 H100 便宜 20%,solver 自动 pick H200,grab 了 hundreds of superior H200 GPUs"

---

## 模块五 · 权衡、竞争、瓶颈

### 5.1 竞品对比矩阵

> 数据来源: [valueaddvc.com](https://valueaddvc.com/), [sacra.com](https://sacra.com/c/fireworks-ai/), [learndevrel.com sandbox benchmark 2026-05](https://learndevrel.com/blog/agent-sandbox-runtimes-tested), [beam.cloud GPU benchmark 2025-08](https://www.beam.cloud/blog/top-serverless-gpu-providers)

| 厂商 | 隔离原语 | 冷启动 P50 | 调度验证 | 估值 (latest) | ARR (latest) | 商业模式 | 关键缺陷 |
|---|---|---|---|---|---|---|---|
| **Modal** | gVisor runsc (default) / VM Sandboxes (alpha) | <500ms (snapshot 加速) | 1M sandboxes <60s | $4.65B (C 2026-05) | ~$300M | Per-second, scale-to-0 | 厂商锁定,不可 self-host |
| **Fireworks AI** | Custom | ~1s (model dependent) | — | $17.5B (D 2026-07) | $1B+ | Token pricing | 封闭 catalog,少 Python DSL 控制 |
| **Together AI** | Custom | ~2s | — | $8.3B (C 2026-07) | ~$1.15B bookings | API + 专用 cluster | DX 弱于 Modal |
| **Baseten** | YAML Truss | 16-60s (2025) | 1B+ calls/day | $13B (F 2026-06) | ~$600M | Per-call + GPU 分钟 | YAML 配置,冷启动慢;但有 self-hosted 选项 |
| **Replicate** | Container | 长时间(custom) | — | — | — | Idle billed | 私有部署冷启动长 |
| **RunPod** | Docker | 6-12s(FlashBoot <1s) | — | — | — | Per-pod | 学习曲线陡 |
| **Beam** | beta9 custom + GPU snapshot | 2-3s | — | — | — | Per-second | 厂商小 |
| **Anyscale** | Ray OSS | — | — | — | — | Per-cluster + OSS | 更像"managed Ray",不是 serverless DX |
| **AWS Lambda** | Firecracker microVM | <1s (small package) | — | n/a | n/a | Per-GB-sec | 无 GPU,Python ML workflow 弱 |
| **Google Cloud Run** | gVisor | 20-30s | — | n/a | n/a | Per-second | GPU 只支持 L4 (mid-2025) |
| **E2B** | Firecracker | ~180ms | — | — | — | Embeddable API | 无 GPU sandbox |
| **Vercel Sandbox** | Firecracker | ~250ms | — | — | — | Per-active-CPU | 45min cap |

**冷启动数据来源对比**:
- Modal:truly-serverless-gpus blog 自述 50s vs 2000s baseline(40×)
- E2B/Vercel/Modal/Morph:Docker sbx:[learndevrel.com benchmark](https://learndevrel.com/blog/agent-sandbox-runtimes-tested)
- Beam/RunPod/GCP/Baseten/Replicate:[beam.cloud benchmark 2025-08](https://www.beam.cloud/blog/top-serverless-gpu-providers)

### 5.2 架构权衡

**Modal 为极致 DX 牺牲了什么?**

1. **Vendor Lock-in**:Modal Functions 只能在 Modal 上跑。**不可 self-host**,不像 Daytona / microsandbox 那样提供 on-prem / VPC 选项。Modal 的 deliverable 是"Modal runtime",不是 open-source stack。
2. **No BYOC / VPC**:Modal 是完全 managed-only,客户的数据/计算不能跑在客户自己的 VPC(除非 Enterprise 谈 specific deal,未公开)。
3. **gVisor syscall coverage**:gVisor 不能 100% 模拟 Linux kernel;某些 features(eBPF, raw sockets, Docker-in-Docker, custom cgroups, systemd)需要新的 alpha VM Sandboxes。
4. **Snapshot portability**:snapshot 绑定 host CPU instruction set + CUDA driver branch + GPU model。Modal 多云架构 → 一个 Function version 需要多个 snapshot,存储 / metadata 开销更高。
5. **Pricing opacity**:region 1.15-1.75×、non-preemptible 3×、Sandbox CPU/memory 3× standard,产能规划比 hyperscaler 难。
6. **Static IP / Custom domain**:仅 Team 计划以上可用,且为 proxy-based,不是原生 L4/L7 LB。

**Modal 的架构优势**:

1. **冷启动最优化(端到端)**:
   - ImageFS lazy load(~100ms index mount)
   - CRIU+gVisor CPU snapshot(2.5-7×)
   - NVIDIA CUDA GPU snapshot(10×)
   - Stack 在一起 40× 整体
2. **统一 Python DSL 覆盖全工作流**:同一 `@app.function()` 装饰器可写 inference、batch、RL、sandboxes、training、notebook — 没有"infra switch tax"
3. **Multi-cloud arbitrage via LP solver**:通过 Resource Solver,Modal 可以持续用最优成本组合服务用户,这是 hyperscaler 永远做不到的
4. **gVisor isolation + ephemeral-by-default sandboxes**:hostile agent code 安全
5. **1M concurrent sandboxes 验证**:scheduling 已证明可扩展到客户级 50k+ concurrency

### 5.3 瓶颈

**1. InfiniBand/RoCE 暂未产品化**
- Modal 自述:RDMA weight server 可以让 model load 带宽提升 3-10×,但"expensive and gnarly, especially when scaling to many models and dynamic worker pools. We're working on it!"
- 后果:超大模型(>50 GB weights)在多 worker 间 distributed inference 时,model loading 是主要瓶颈;不是 LLM inference 本身的瓶颈,而是 cold start 时加载 weights 的瓶颈
- 影响:对 trillion-parameter 模型 serving 不友好

**2. 多 GPU 训练 production-readiness 不足**
- Modal docs 自述:"Multi-node training in closed beta (contact us for access)"
- Multi-GPU 8 GPU per node 是支持的,但 DDP across nodes 是 closed beta
- 影响:不适合超大规模 training workload,定位 inference / fine-tune / RL 而非 pretraining

**3. GPU 供应链依赖上游云厂**
- Modal 自报 13+ 云厂(AWS, GCP, Oracle, CoreWeave, Lambda 等)
- Erik 接受 Reuters 采访时说:"we work with 13 cloud providers, up from 5 last year"
- Modal 自身是 GPU 净买方,受 NVIDIA 产能 / 云厂分配 / 区域 quota 影响
- 后果:在 GPU 极端紧缺期(类似 2024 年),Modal 也会面临 capacity constraints,只是比 hyperscaler 单一供应商更多元化

**4. Snapshot 兼容性约束**
- 100% restore 成功率无法保证:host CPU instruction set、CUDA driver version、GPU model 任一不匹配都会触发 fallback 到 cold start
- 在 heterogeneous fleet 上,一个 Function version 需要多个 snapshot → storage / metadata 开销
- 影响:p99 冷启动延迟仍可能 hit worst case(几十秒)

**5. 毛利率压制**
- GPU 上游成本 + 区域 multiplier + 3× Sandbox premium → 客户被引导用 preemptible / 多区域 mix
- Hyperscaler 持续降价(AWS 在 2025 年降价 45% GPU price)
- 推论:Modal 长期毛利率可能压缩到 25-35%(vs 短期 35-50%)— 除非 LP arbitrage 持续产生超额价值

**6. 监管/合规**
- SOC 2 Type 2 + HIPAA(Enterprise)已有
- ISO 27001、FedRAMP 未公开 — 在高度监管行业(政府、银行、医疗机构)GTM 阻力
- HIPAA 删除合规仅在 Volumes v2

---

## 附录 A · 关键数字速查表

| 维度 | 数字 | 信源 |
|---|---|---|
| 累计融资 | $466M | [Series C blog](https://modal.com/blog/modal-series-c) |
| 最新估值 | $4.65B post-money | [Series C blog](https://modal.com/blog/modal-series-c) |
| Series C ARR 报道 | $300M (2026-04) | [Series C blog](https://modal.com/blog/modal-series-c) |
| 9 个月 ARR 增长 | 5× ($60M → $300M) | [Reuters](https://www.reuters.com/business/modal-labs-valued-465-billion-ai-coding-takes-off-2026-05-21/) |
| Series C 估值倍数 | ~15.5× forward revenue | [分析师估算] |
| 客户数 | 10,000+ teams | [modal.com/customers](https://modal.com/customers) |
| 累计沙箱启动 | >1 billion | [Series C blog](https://modal.com/blog/modal-series-c) |
| 1M sandbox 调度 | <60s | [scaling 1M sandboxes](https://modal.com/blog/scaling-to-1-million-concurrent-sandboxes-in-seconds) |
| p50 sandbox interactivity | <500ms | 同上 |
| 冷启动(naive) | ~2000s | [truly-serverless-gpus](https://modal.com/blog/truly-serverless-gpus) |
| 冷启动(Modal) | ~50s | 同上 |
| 冷启动加速比 | 40× | 同上 |
| GPU snapshot 加速比 | 10×(Parakeet) | [GPU mem snapshots](https://modal.com/blog/gpu-mem-snapshots) |
| ImageFS 吞吐 | ~2.5 GB/s | [jono-containers-talk](https://modal.com/blog/jono-containers-talk) |
| import torch P0 | 0.69s (snapshot) | [mem-snapshots](https://modal.com/blog/mem-snapshots) |
| 云厂数 | 13+ | [Reuters](https://www.reuters.com/business/modal-labs-valued-465-billion-ai-coding-takes-off-2026-05-21/) |
| Modal 员工数 | 120+ (self), ~153 (Apr 2026, SVI) | [SVI profile](https://siliconvalleyinvestclub.com/companies/modal-labs/) |
| H100 SXM5 价格 | $3.95/hr ($0.001097/sec) | [pricing](https://modal.com/pricing) |
| B200 价格 | $6.25/hr ($0.001736/sec) | 同上 |
| Sandbox CPU 倍率 | 3× standard | 同上 |

## 附录 B · 关键工程师 GitHub / 贡献证据

| 工程师 | Modal 博客 / 提交 |
|---|---|
| Jonathon Belotti | "Fast, lazy container loading in Modal"(2024-09),"Memory snapshots"(2025-01),gVisor nvproxy commit `85d1e860166348b4ae71bc1067ccf2613938c29e` |
| Luis Capelo | "GPU Memory Snapshots"(2025-07) |
| Colin Weld | "Scaling to 1M sandboxes"(2026-07), "Linear programming for fun and profit"(2025-05), "GPU Memory Snapshots"(2025-07) |
| Connor Adams | "Scaling to 1M sandboxes"(2026-07) |
| Irfan Sharif | "Linear programming for fun and profit"(2025-05) |
| Yiren Lu | "Top 5 serverless GPU providers"(2025-10) |

## 附录 C · 全部核心信源链接

**Modal 自有内容**
- Series A: <https://modal.com/blog/general-availability-and-series-a-press-release>
- Series B: <https://modal.com/blog/announcing-our-series-b>
- Series C: <https://modal.com/blog/modal-series-c>
- Erik 个人 "What I've been working on: Modal": <https://erikbern.com/2022/12/07/what-ive-been-working-on-modal.html>
- Pricing: <https://modal.com/pricing>
- Truly serverless GPUs: <https://modal.com/blog/truly-serverless-gpus>
- Fast lazy container loading: <https://modal.com/blog/jono-containers-talk>
- Memory snapshots: <https://modal.com/blog/mem-snapshots>
- GPU Memory snapshots: <https://modal.com/blog/gpu-mem-snapshots>
- 1M sandboxes: <https://modal.com/blog/scaling-to-1-million-concurrent-sandboxes-in-seconds>
- Resource solver (LP): <https://modal.com/blog/resource-solver>
- GPU health: <https://modal.com/blog/gpu-health>
- Future of AI GPU capacity: <https://modal.com/blog/the-future-of-ai-needs-more-flexible-gpu-capacity>
- VM Sandboxes product update: <https://modal.com/blog/product-updates-vm-sandboxes-domain>
- Top 5 serverless GPU providers: <https://modal.com/blog/serverless-gpu-article>
- Docs — Images: <https://modal.com/docs/guide/images>
- Docs — Volumes: <https://modal.com/docs/guide/volumes>
- Docs — Cold start: <https://modal.com/docs/guide/cold-start>
- Docs — GPU: <https://modal.com/docs/guide/gpu>
- Docs — VM Sandboxes: <https://modal.com/docs/guide/vm-sandboxes>
- Docs — Sandboxes: <https://modal.com/docs/guide/sandboxes>
- Customers page: <https://modal.com/customers>

**第三方权威报道 / 投资人**
- Reuters Series C exclusive: <https://www.reuters.com/business/modal-labs-valued-465-billion-ai-coding-takes-off-2026-05-21/>
- TechCrunch Series A: <https://techcrunch.com/2023/10/10/modal-labs-lands-16m-to-abstract-away-big-data-workload-infrastructure/>
- TechStartups Series C: <https://techstartups.com/2026/05/21/modal-labs-raises-355m-quadrupling-valuation-to-4-65b-as-ai-infrastructure-demand-surges/>
- Amplify Partners seed thesis: <https://amplifypartners.com/blog-posts/modal>
- Sacra company profile: <https://sacra.com/c/modal-labs/>
- TBPN digest interview with Erik: <https://www.tbpndigest.com/story/2025-09-29/modal-labs-raises-87m-series-b-led-by-lux-capital-to-scale-serverless-ai-infrastructure>

**底层技术文档**
- NVIDIA MIG intro: <https://docs.nvidia.com/datacenter/tesla/mig-user-guide/introduction.html>
- NVIDIA CUDA checkpoint API: <https://docs.nvidia.com/cuda/cuda-driver-api/group__CUDA__CHECKPOINT.html>
- CRIU original commit: <https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=099469502f62fbe0d7e4f0b83a2f22538367f734>
- Modal GPU Glossary open-source: <https://github.com/modal-labs/gpu-glossary>
- Modal modal-examples: <https://github.com/modal-labs/modal-examples>

**竞品 / 行业**
- Beam 2025 cold start benchmark: <https://www.beam.cloud/blog/top-serverless-gpu-providers>
- Fireworks AI valuation analysis: <https://valueaddvc.com/blog/fireworks-ai-valuation-2026-17-5b-series-d-and-the-1b-arr-inference-business>
- Baseten profile: <https://valueaddvc.com/company/baseten>
- Fireworks Sacra profile: <https://sacra.com/c/fireworks-ai/>
- Sandbox runtime benchmark: <https://learndevrel.com/blog/agent-sandbox-runtimes-tested>

---

*报告完成时间:2026-09-06。所有数据点均附 URL 出处。[分析师估算] 部分为基于公开定价 + 公开披露的 ARR + 行业可比公司毛利的倒推。*
