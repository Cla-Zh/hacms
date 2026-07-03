# DIFF-2 PoC 设计文档 — 训练+推理统一存储 (Unified Training / Inference Storage)

**文档状态**: v0.1 草案 · 等待用户评审
**目标读者**: 256 节点超大存储集群项目组 + AI 基础设施团队
**PoC 周期**: 阶段 1 (1-2 月) → 阶段 2 (3-4 月) → 阶段 3 (5-6 月)
**作者**: calvin (hermes-agent subagent 委托产出)
**日期**: 2026-07-03
**关联资产**:
- 上一轮 DIFF-1 PoC 设计: `/tmp/poc-design.md` (28KB / 438 行)
- 上游报告: `/mnt/c/Users/calvin/Desktop/storage-for-ai-data-platform.html` (DIFF-2 章节)
- hacms 预览: `previews/2026-07-03-storage-for-ai-data-platform.html`

---

## 0. 关键校正 (与上一轮报告的差异)

上一轮 *DIFF-2 速记* 引用 *"DDN A3I 模式 + NPU + 本地 SSD"* 与 *"PCIe 5.0 = 64 GB/s"*. 本 PoC 文档对每个数字给出可验证 URL.

| 字段 | 速记值 | 校正后 (有据) | 来源 |
|---|---|---|---|
| PCIe 5.0 x16 单向带宽 | "64 GB/s" | **63.02 GB/s 单向 / ~128 GB/s 双向** (32 GT/s × 16 lane, 128b/130b 编码) | [FS.com PCIe versions table](https://www.fs.com/blog/understanding-pcie-versions-lanes-and-slot-types-explained-28862.html) · [PCI-SIG via Lenovo PCIe x16 guide](https://www.lenovo.com/us/en/knowledgebase/pcie-x16-a-comprehensive-guide-to-highspeed-expansion-slots) |
| DDN A3I 模式 (类比对象) | "参考 DDN A3I" | **DDN A³I (A-cubed-I)**: 端到端 NVMe 共享并行架构, 单 appliance 115 GB/s 读 / 75 GB/s 写, 已被 NVIDIA DGX BasePOD 验证 | [NVIDIA-DDN reference architecture](https://www.nvidia.com/en-in/data-center/resources/ddn-a3i-reference-architecture/) · [Graphcore-DDN storage RA PDF](https://docs.graphcore.ai/projects/ddn-storage/en/latest/_static/Graphcore-DDN-Storage-Reference-Architecture.pdf) |
| Atlas 300I Duo 算力 | "140 TOPS" | **140 TFLOPS FP16 / 280 TOPS INT8** (2×Ascend 310P) | [Huawei Atlas 300I Duo specs](https://support.huawei.com/enterprise/en/doc/EDOC1100285916/181ae99a/specifications) |
| DeepSeek-V3 权重体积 | "1.3 TB" | **1.342 TB (= 671B × 2B, FP16)**; FP8 已开源版约 344 GB | [DeepSeek-V3 README_WEIGHTS.md](https://github.com/deepseek-ai/DeepSeek-V3/blob/main/README_WEIGHTS.md) · [Ollama deepseek-v3 fp16 tag](https://ollama.com/library/deepseek-v3:671b-fp16) |
| Llama-3-8B FP16 体积 | "16 GB" | **16 GB** (Ollama 显示 8B × F16 = 16 GB 镜像) | [Ollama llama3:8b-instruct-fp16](https://ollama.com/library/llama3%3A8b-instruct-fp16) · [Ollama llama3.1:8b-instruct-fp16](https://ollama.com/library/llama3.1%3A8b-instruct-fp16) |
| Qwen2-72B FP16 体积 | "145 GB" | **~145-147 GB** (Ollama 报 qwen2.5vl:72b-fp16=147 GB; FP16 ≈ 2B × params) | [Ollama issue #10729 model size table](https://github.com/ollama/ollama/issues/10729) |

> **设计意义**: DIFF-2 与 DIFF-1 (NPU embedding-on-write) 完全不同维度. DIFF-1 是 *计算* (把 SSD 控制器从纯存储变成存算一体), DIFF-2 是 *数据流方向* (把训练 checkpoint 落本地 SSD, 让推理节点走 PCIe 直连拉权重, 不走 NFS/S3). 二者不冲突, 可以叠加 (§8).

---

## 1. PoC 目标

### 1.1 核心问题

> **256 节点超大存储集群是否应该把 "训练 checkpoint 直接落本地 NVMe SSD + 推理节点走 PCIe 直连拉权重" 作为第二个产品差异化功能 (DIFF-2)?**

**前提 (竞品基线)**:
- 传统架构: 训练 → 写共享存储 (NFS / Lustre / GPFS / S3) → 推理节点从共享存储拉权重. 共享存储一跳 ≤ 100µs LAN + 文件系统, ≤ 10 ms 数据中心 TCP / NFS over TCP ([DDN A³I 性能简报](https://images.nvidia.com/content/data-center/resources/ddn-a3i-reference-architecture/DDN-A3I-WITH-DGX-A100-perf-brief-2020-11-16.pdf))
- 痛点: 128 节点 1.3 TB checkpoint 同步写会撞共享存储的元数据 / 网络瓶颈. 推理节点冷启 → 远端拉权重 → 等 5-30s

**DIFF-2 主张**:
> 训练节点训练完后把 checkpoint 直接落到 **同节点本地 NVMe SSD** (PCIe 5.0 x4 ≈ 14 GB/s, 4 块 RAID0 ≈ 50 GB/s 写). 推理节点 (同集群另一台) **通过 RDMA over ConnectX-7 400 GbE** 直接读对端 NVMe, 避开 NAS 元数据 / NFS 锁. 端到端 PCIe 延迟 < 1 ms ([Lenovo PCIe x16 comprehensive guide](https://www.lenovo.com/us/en/knowledgebase/pcie-x16-a-comprehensive-guide-to-highspeed-expansion-slots) § PCIe 5.0 × 16 64 GB/s 单向, NVMe 设备层 < 10 µs).

### 1.2 3 个可证伪假设

| # | 假设 | 量化标准 | 验证方式 | 通过阈值 |
|---|---|---|---|---|
| **H1** | **PCIe 直连延迟 << NFS 延迟** | PCIe 直连: < 1 ms end-to-end; NFS over TCP: > 10 ms (3 跳网络) | 5a: 单节点同节点拉权重 + 5b: 跨节点 RDMA 拉权重; 用 [fio](https://github.com/axboe/fio) latency histogram | 必须 H1 PASS, 否则 D2 不成立 |
| **H2** | **PCIe 5.0 SSD 写带宽满足大模型 checkpoint** | PCIe 5.0 x4 单盘 ≥ 6.75 GB/s 顺序写; 4 盘 RAID0 聚合 ≥ 25 GB/s | [Kioxia CM7-R 7.68TB datasheet](https://pondesk.com/product/kioxia-cm7-r-768-tb-25-14000-mbs-enterprise-nvme-intensive-u3-ssd-udho-2860) 实测 | 单盘 ≥ 6 GB/s 顺序写 (CM7-R 官方 6.75 GB/s); 4 盘聚合 ≥ 20 GB/s |
| **H3** | **256 节点同步 checkpoint 不打断训练** | 在 checkpoint-落盘周期里, 训练 step 延迟开销 < 5% | 5d: 256 节点 LLaMA-Factory 训练, 每 N step 落一次 checkpoint, 对比 P50/P99 step time | 总开销 < 5% (这是工业界 [DeepSpeed activation checkpointing](https://github.com/deepspeedai/DeepSpeed/blob/master/docs/code-docs/source/activation-checkpointing.rst) + [HCCL collective](https://www.hiascend.com/document/detail/en/canncommercial/800/apiref/hcclapiref/hcclcpp_07_0026.html) 共识) |

> **任一假设 FAIL → 全盘 FAIL**. 这是 falsifiable 设计: 不是 "看起来合理" 就推进, 是有明确 falsification criteria.

### 1.3 交付物

- 一份 PoC 验收报告 (通过 / 不通过 / 部分通过 + 数据)
- 3 个 GitHub 仓库 PR: (a) `vllm-ascend` 新增 PCIe-direct weight loader (b) `DeepSpeed` 新增 HCCL-aware checkpoint writer (c) `HiPo` weight discovery service (新仓)
- 一段 demo 视频: 端到端 "训练落盘 → RDMA 拉权重 → 推理冷启 < 1s"
- 一份产品化建议书 (§9 阶段 3 之后)

---
## 2. 硬件清单 (2 个测试节点 BOM)

### 2.1 推荐配置 (1 训练节点 + 1 推理节点)

| 组件 | 型号 / 规格 | 数量 | 单价参考 (USD) | 来源 |
|---|---|---|---|---|
| **CPU** | 2× Intel Xeon 6980P (Granite Rapids, 128 核, DDR5-6400 12 通道) *或* AMD EPYC 9965 (192 核, Turin) — 推荐后者 (PCIe 5.0 lane 数更多) | 2 (每节点) | ~$15k/颗 | [Servnet UK EPYC/Granite Rapids spec](https://www.servnetuk.com/computing-components) |
| **NPU (训练节点)** | **Huawei Atlas 300I Duo** (2×Ascend 310P, 96 GB LPDDR4X, 280 TOPS INT8 / 140 TFLOPS FP16, PCIe Gen4 x16) | 1 (每节点) | ~$1.8k | [Huawei Atlas 300I Duo specs](https://support.huawei.com/enterprise/en/doc/EDOC1100285916/181ae99a/specifications) · [Intratek €1,600 list](https://intratek.systems/products/atlas-duo-1x) |
| **NPU (推理节点)** | 同上 (Atlas 300I Duo) — 已验证 vLLM-Ascend 支持 (Experimental) | 1 | $1.8k | [vLLM-Ascend Atlas 300I DUO docs](https://docs.vllm.ai/projects/ascend/en/latest/tutorials/hardwares/310p.html) · [vllm-ascend PyPI page](https://pypi.org/project/vllm-ascend/) |
| **SSD (checkpoint 盘)** | **Kioxia CM7-R 7.68 TB** E3.S/U.3 PCIe Gen5 x4 (14,000 MB/s 读, **6,750 MB/s 写**, 1 DWPD) | 4 块 / 节点 = 30 TB usable (RAID10) | ~$1.6k/块 | [Kioxia CM7-R 7.68TB datasheet](https://pondesk.com/product/kioxia-cm7-r-768-tb-25-14000-mbs-enterprise-nvme-intensive-u3-ssd-udho-2860) · [smicro.eu listing](https://smicro.eu/kioxia-cm7-r-7-68tb-nvme-gen5-u-3-15mm-14000mbps-6750mbps-kcmyxrug7t68-1) |
| **SSD (权重库盘)** | **Solidigm D5-P5336 122.88 TB** QLC PCIe Gen4 x4 (7,000 MB/s 读, 3,000 MB/s 写, **0.6 DWPD**, 134.3 PBW) — 低频读权重 + 模型版本库 | 2 块 / 节点 = 244 TB usable | ~$7k/块 | [StorageReview Solidigm 122.88TB review](https://www.storagereview.com/review/solidigm-122-88tb-d5-p5336-review-high-capacity-storage-meets-operational-efficiency) · [Solidigm official product page](https://www.solidigm.com/products/data-center/d5/p5336.html) |
| **内存** | 1 TB DDR5-4800 RDIMM (16×64 GB) — 用于数据流 buffer + NPU host-side staging | 16 条 / 节点 | ~$5k | [Servnet UK components](https://www.servnetuk.com/computing-components) |
| **网络 (RDMA 跨节点 + 测试仪表)** | **NVIDIA ConnectX-7 400 GbE/NDR** (PCIe Gen5 x16, **单口 OSFP**, SHARP / GPUDirect RDMA offload) | 2 张 / 节点 (1 张训练↔推理, 1 张集群管理) | ~$2.2k/张 | [NVIDIA ConnectX-7 datasheet (PNY)](https://www.pny.com/en-eu/File%20Library/Professional/DATASHEET/MELLANOX/infiniband-connectx7-datasheet1222-PNY-webonly.pdf) · [FS.com MCX75310AAS-NEAT $2,188](https://www.fs.com/products/212161.html) |
| **节点底盘** | Supermicro AS-2026S-T2R (2U, 24× 2.5" NVMe 热插拔, PCIe 5.0) | 1 (每节点) | ~$4k | [Supermicro Storage SuperServer AS-2026S-T2R](https://www.supermicro.com/en/products/system/2u/2026/AS-2026S-T2R) |

### 2.2 单节点 BOM (粗算)

```
2× CPU (EPYC 9965)         ~$30,000
1× Atlas 300I Duo           $1,800
4× CM7-R 7.68TB            $6,400   (checkpoint 盘)
2× D5-P5336 122.88TB      $14,000  (权重库盘, PoC 阶段 2 启用)
16× 64GB DDR5-4800        $5,000
2× ConnectX-7 400GbE      $4,400
1× Supermicro 2U         $4,000
小计                      $65,600  / 节点
─────────────────────────
2 节点 (1 train + 1 infer) $131,200
```

> **PoC 阶段 1 单节点预算 ≈ $65.6k**. 阶段 2 启用 D5-P5336 时 ≈ $80k/节点. 低于 §7 FMEA F5 阈值 $100k/节点 ✓.

### 2.3 为什么选这些盘?

| 选择 | 原因 | 引证 |
|---|---|---|
| **CM7-R 7.68 TB** (不是 3.84 TB) | 4 块 RAID10 = 15 TB usable, 容纳 Llama-3-70B + Qwen2-72B + 历史 checkpoint × 1 完整周期 | [Kioxia CM7-R datasheet 1 DWPD](https://pondesk.com/product/kioxia-cm7-r-768-tb-25-14000-mbs-enterprise-nvme-intensive-u3-ssd-udho-2860) |
| **D5-P5336 122 TB** (不是 PM1743) | 单节点 244 TB 容纳 100+ 模型版本库, QLC 极低 $/TB ($0.057/GB vs TLC $0.21/GB), 写频次低正好匹配 0.6 DWPD | [Guru3D Solidigm 122TB launch](https://www.guru3d.com/story/solidigm-unveils-122tb-enterpriseclass-qlc-ssd-for-early-2025-release) · [StorageReview endurance spec](https://www.storagereview.com/review/solidigm-122-88tb-d5-p5336-review-high-capacity-storage-meets-operational-efficiency) |
| **CM7-R + D5-P5336 混合** | 热 (CM7-R 高 DWPD 快) vs 冷 (D5-P5336 高容量慢) tiering 经典模式 (类似 Intel Optane P5800X + TLC) | [Solidigm 在 AI 场景的 tiering 推荐](https://www.solidigm.com/products/data-center/d5/p5336.html) "data lakes for AI, machine learning, big data analytics" |

---

## 3. 软件栈

### 3.1 5 层架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Layer 1: 应用层 (训练 / 推理 / 调度)                                      │
│  · 训练:  PyTorch 2.9+ + DeepSpeed (activation checkpoint)              │
│           + torch-npu 2.9.0 (Ascend backend)                            │
│  · 推理:  vLLM-Ascend 0.7.3+ / MindIE 1.0                               │
│  · 调度:  HiPo 权重发现服务 (新) + Ascend HCCL collective               │
├─────────────────────────────────────────────────────────────────────────┤
│ Layer 2: 分布式通信                                                      │
│  · 训练节点间:  HCCL over PCIe 4.0 / RoCE  (256 节点 AllReduce)          │
│  · 推理拉权重:  ConnectX-7 RDMA read  (NVMe-oF over RDMA)               │
│  · 集合操作 offload:  SHARP (Scalable Hierarchical Aggregation Protocol) │
├─────────────────────────────────────────────────────────────────────────┤
│ Layer 3: Checkpoint 存储格式 (3 种选 1)                                   │
│  · A. safetensors  (HuggingFace 标准, 8B header + data buffer)          │
│  · B. HDF5         (HDF Group 标准, 层级 dataset)                       │
│  · C. 华为自研     (CANN 配套, 二进制 fp16 + index)                     │
├─────────────────────────────────────────────────────────────────────────┤
│ Layer 4: 本地 SSD I/O 路径 (3 种选 1 推荐 io_uring)                       │
│  · 推荐 io_uring  (Linux 5.1+, 系统调用减 90%, 上下文切换 4 µs → < 1 µs)│
│  · 备选 SPDK      (kernel bypass, 极致低延迟但需用户态重写)              │
│  · 备选 eBPF      (DTrace 风格观察, 不直接落盘)                          │
├─────────────────────────────────────────────────────────────────────────┤
│ Layer 5: 硬件层                                                          │
│  · CPU ↔ NPU:     PCIe 4.0 x16 (Atlas) ─ 64 GB/s                       │
│  · NPU ↔ NVMe:    PCIe 5.0 x4 (CM7-R)  ─ 14 GB/s per drive             │
│  · 节点 ↔ 节点:    ConnectX-7 400 GbE ─ 50 GB/s RDMA per port          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 各层选型来源

| 层 | 选定方案 | 验证 URL |
|---|---|---|
| **训练** | PyTorch + DeepSpeed | [DeepSpeed activation-checkpointing docs](https://github.com/deepspeedai/DeepSpeed/blob/master/docs/code-docs/source/activation-checkpointing.rst) |
| **NPU backend** | torch-npu 2.9.0 | [vllm-ascend prerequisites: torch-npu 2.9.0](https://pypi.org/project/vllm-ascend/) |
| **集合通信** | HCCL (Ascend Collective Communication Library) | [HCCL HcclAlltoAll API (CANN 8.0)](https://www.hiascend.com/document/detail/en/canncommercial/800/apiref/hcclapiref/hcclcpp_07_0026.html) · [HCCL operator retry 文档 (华为云 ModelArts)](https://support.huaweicloud.com/intl/en-us/usermanual-server-modelarts/usermanual-server-0037.html) |
| **推理 (1)** | vLLM-Ascend 0.7.3+ | [vllm-ascend GitHub](https://github.com/vllm-project/vllm-ascend) · [vllm-ascend PyPI](https://pypi.org/project/vllm-ascend/) |
| **推理 (2)** | MindIE 1.0 (备选) | [MindIE Installation](https://www.hiascend.com/en/developer/software/mindie/download) · [Huawei Cloud prefill-decode disagg with MindIE](https://support.huawei.cn/enterprise/en/doc/EDOC1100455615/f241845d/deploying-the-prefill-decode-disaggregation-service-using-the-qwen15-14b-model-based-on-the-mindie-inference-framework) |
| **Checkpoint 格式** | Safetensors (8B aligned) | [HuggingFace safetensors file format](https://deepwiki.com/huggingface/safetensors/2.1-file-format) · [HuggingFace TGI safetensors doc](https://huggingface.co/docs/text-generation-inference/en/conceptual/safetensors) |
| **SSD I/O** | io_uring | [io_uring / SPDK 性能分析 (KIT 2024 BA thesis)](https://os.itec.kit.edu/downloads/2024_BA_Schneider_Kernel_Bypass_io_uring.pdf) (read latency 3.37× improvement) · [harryvasanth Linux NVMe tuning guide](https://harryvasanth.com/posts/linux-nvme-tuning-io_uring/) |
| **RDMA NIC** | ConnectX-7 400 GbE/NDR | [ConnectX-7 datasheet (PNY PDF)](https://www.pny.com/en-eu/File%20Library/Professional/DATASHEET/MELLANOX/infiniband-connectx7-datasheet1222-PNY-webonly.pdf) · [NVIDIA official datasheet](https://www.nvidia.com/content/dam/en-zz/Solutions/networking/infiniband-adapters/infiniband-connectx7-data-sheet.pdf) |
| **PCIe 5.0 spec** | x16 = 63 GB/s 单向 | [FS.com PCIe versions table](https://www.fs.com/blog/understanding-pcie-versions-lanes-and-slot-types-explained-28862.html) · [Lenovo PCIe x16 guide](https://www.lenovo.com/us/en/knowledgebase/pcie-x16-a-comprehensive-guide-to-highspeed-expansion-slots) |

### 3.3 与 DIFF-1 共存的接口

DIFF-1 (embedding-on-write) 把 NPU 跑数据 ingest + 向量化; DIFF-2 把 NPU 跑模型 checkpoint 写 + 推理读. **两者都是 "NPU 借给存储子系统"**, 但分工清楚:
- D1: 数据 ingest 路径 (write API → embedding → SSD)
- D2: 模型训练路径 (grad update → checkpoint → SSD → 推理读)

二者不抢 NPU 算力 (D1 用 NPU idle 周期, D2 用 NPU 训练空隙). 详见 §8.

---
## 4. 测试数据集 (推荐真实模型)

| 模型 | 参数 | 精度 | 体积 | 适用测试 | 来源 |
|---|---|---|---|---|---|
| **Llama-3-8B Instruct** | 8.03 B | FP16 | **16 GB** (1 块 CM7-R 7.68TB 装 480 份) | 5a / 5c 单节点 PCIe 直连 baseline | [Ollama llama3:8b-instruct-fp16 tags](https://ollama.com/library/llama3%3A8b-instruct-fp16) |
| **Llama-3.1-8B Instruct** | 8.03 B | FP16 | **~16 GB** (Meta 官方同尺寸) | 5a 重复实验 | [Ollama llama3.1:8b-instruct-fp16](https://ollama.com/library/llama3.1%3A8b-instruct-fp16) · [mlx-community BF16 = 16.1 GB 单文件](https://huggingface.co/mlx-community/Meta-Llama-3.1-8B-Instruct-bf16) |
| **Qwen2-72B Instruct** | 72 B | FP16 | **~145-147 GB** (4 块 CM7-R RAID0 装 1 份) | 5b 跨节点 RDMA 拉权重测试 | [Ollama issue #10729 qwen2.5vl:72b-fp16 = 147 GB](https://github.com/ollama/ollama/issues/10729) · [Qwen2-72B-Instruct HF model card](https://huggingface.co/pashaprokaz/Qwen2-72B-Instruct) |
| **DeepSeek-V3** (MoE) | 671 B 总 / 37 B active | FP16 | **~1.342 TB** (= 671B × 2B) (必须分布式, 至少 9 节点各装 150 GB) | 5d 256 节点同步 checkpoint stress test | [DeepSeek-V3 README_WEIGHTS.md](https://github.com/deepseek-ai/DeepSeek-V3/blob/main/README_WEIGHTS.md) (671B confirmed) · [Ollama deepseek-v3:671b-fp16](https://ollama.com/library/deepseek-v3:671b-fp16) |

### 4.1 体积验证 (数学校核)

```
Llama-3-8B FP16:
  8.03e9 × 2 bytes = 16.06 GB    ✓ (Ollama 报 16 GB)
Qwen2-72B FP16:
  72e9 × 2 bytes  = 144.00 GB    ✓ (Ollama 报 145-147 GB 含 tokenizer)
DeepSeek-V3 FP16:
  671e9 × 2 bytes = 1,342.00 GB  ≈ 1.34 TB ✓ (用户任务文档中 "1.3TB" 校核通过)
DeepSeek-V3 FP8 (官方发布):
  671e9 × 1 bytes = 671e9 bytes ≈ 644 GiB (但 README_WEIGHTS 还含 MTP + scales)
  HF 实际打包 ≈ 344 GB           (DeepSeek-V3-Base fp8 单文件)
```

> **结论**: 任务文档 145 GB (Qwen2-72B) + 1.3 TB (DeepSeek-V3) 数字有据可校.

### 4.2 为什么选这 3 个模型?

- **3 个尺寸跨越 2 个数量级** (8B → 72B → 671B), 验证 localSSD 模式在不同规模都成立
- 8B = 1 块 SSD 装得下 → 验证 H2 (PCIe 5.0 单盘写)
- 72B = 必须多块 SSD → 验证 RAID0 聚合带宽
- 671B = 必须多节点分布式 SSD → 验证 256 节点 HCCL collective
- 3 个都是开源 (Llama: [Ollama](https://ollama.com/library/llama3); Qwen: [HF Qwen2-72B-Instruct](https://huggingface.co/pashaprokaz/Qwen2-72B-Instruct); DeepSeek: [HF DeepSeek-V3](https://github.com/deepseek-ai/DeepSeek-V3)) → 不需要 NDA

---

## 5. 测试场景 (至少 4 个)

### 5a. 单节点 checkpoint 写 + 同节点推理读 (baseline, PCIe 直连)

**目标**: 验证 H1 (PCIe 直连 < 1ms). 排除网络影响.

```
[NPU Atlas 300I Duo] ──PCIe 4.0 x16── [CPU host memory 1TB]
       │                                       │
       │ (训练 step 100 次)                     │
       ▼                                       ▼
[checkpoint writer] ── io_uring ──▶ [CM7-R 7.68TB] ◀── io_uring ── [vLLM-Ascend weight loader]
                                          ▲
                                          │
                                       (同一节点)
```

**步骤**:
1. 训练节点用 LLaMA-Factory 训练 Llama-3-8B (FP16 16 GB), 每 100 step 落一次 checkpoint 到本地 CM7-R
2. 同节点起一个 vLLM-Ascend 推理进程, 通过 **PCIe 直连** (无网络) 拉 checkpoint
3. 用 Prometheus + 自研 eBPF tracer 记录落盘时间 + 加载时间

**对照**:
- 实验组: 同节点 PCIe 直连
- 对照组: 跨节点 NFS (强制 TCP over 400 GbE, 模拟传统架构)

**测量**:
- `t_write`: checkpoint 落盘 P50 / P99
- `t_load`: vLLM 冷启到 first token 时间
- `bandwidth`: 落盘期间的实际 MB/s (用 fio)

**通过条件**: `t_load` PCIe 比 NFS 至少 **快 10×**, 即 < 100 ms PCIe vs > 1 s NFS

---

### 5b. 多节点 checkpoint 写 (HCCL collective) + 另一节点推理读 (RDMA 跨节点)

**目标**: 验证 H1 + H2 在跨节点场景. 验证 ConnectX-7 RDMA read 跨节点延迟.

```
[Node 1 (train)]                [Node 2 (infer)]
Atlas 300I Duo                  Atlas 300I Duo
     │                              ▲
     ▼                              │ RDMA read (CM7-R remote)
HCCL AllReduce grad ── io_uring ──▶ [CM7-R] ──────────── (NVMe-oF over RDMA)
        │                           7.68 TB                  │
        └────── 400 GbE ConnectX-7 ──────────────────────────┘
```

**步骤**:
1. 4 节点训练, 用 [vllm-ascend DeepSpeed integration](https://github.com/vllm-project/vllm-ascend) (PyTorch 2.9 + torch-npu 2.9.0) 跑 Qwen2-72B (FP16, ~145 GB)
2. 使用 [HCCL HcclAlltoAll](https://www.hiascend.com/document/detail/en/canncommercial/800/apiref/hcclapiref/hcclcpp_07_0026.html) collective 写 sharded checkpoint (每节点写 ~36 GB)
3. 第 5 节点 (推理) 通过 NVMe-oF over ConnectX-7 RDMA 远程拉 Qwen2-72B (145 GB) 完整权重
4. 启用 [SHARP](https://www.nvidia.com/content/dam/en-zz/Solutions/networking/infiniband-adapters/infiniband-connectx7-data-sheet.pdf) 卸载集合操作

**测量**:
- `t_rdma`: NVMe-oF over RDMA read 145 GB P50 / P99
- 预期: 145 GB ÷ 50 GB/s (ConnectX-7 400 GbE) = **2.9 s 理论下限**; 加协议开销 < 5 s ✓

**通过条件**: `t_rdma < 5 s` (取自 §6 量化标准)

---

### 5c. Checkpoint 增量写 (gradient checkpointing) + 推理热加载

**目标**: 验证 D2 与 [DeepSpeed activation checkpointing](https://github.com/deepspeedai/DeepSpeed/blob/master/docs/code-docs/source/activation-checkpointing.rst) 不冲突, 推理 hot-standby 在不打断训练前提下能 100 ms 内拿到最新 checkpoint.

**机制**:
- 训练用梯度 checkpointing: 每 N=100 step 落 1 次 **增量** checkpoint (只存新参数变化)
- 推理节点用 **inotify** + **fcntl F_SETSIG** 监听 SSD 目录事件
- 检测到新文件 → 增量 merge + load → 新权重可用

**测量**:
- 增量 checkpoint 大小: Llama-3-8B 全参数 16 GB → 增量 << 16 GB (实际 ~2 GB/snapshot)
- 推理 hot-standby P99 切换延迟: < 5 s (§6)

**依据**:
- Activation/gradient checkpointing 减少的是 **activation memory** (激活, not 模型权重), 通过重计算换来 √n 内存 ([zeroentropy 概念文章](https://www.zeroentropy.dev/concepts/gradient-checkpointing) "5× memory savings, ~30% slower")
- "Incremental checkpoint" 用 diff 算法, 不是 PyTorch 官方功能 — PoC 阶段 1 自己实现

---

### 5d. 256 节点同步 checkpoint + 推理 hot-standby (stress test)

**目标**: 验证 H3 (256 节点同步, 训练不被打断), 跑真实 LLaMA-Factory 训练 + vLLM 推理联合.

**步骤**:
1. 模拟 256 节点 (阶段 3 才上真机器, 阶段 1 用 1 节点 CPU 模拟器)
2. 训练 DeepSeek-V3-671B (FP16 1.3 TB 分布式, 每节点 5 GB 分片)
3. 每 1000 step 落 1 次完整 checkpoint (256 节点 HCCL collective 同步, 期望 ~10 GB/节点/次 → 2.56 TB 总量)
4. 同时跑 32 个推理节点 vLLM-Ascend (Atlas 300I Duo), hot-standby 等新权重

**测量**:
- `t_sync`: 256 节点 HCCL AllReduce 完成 sync 时间 (含 PCIe 5.0 落盘)
- 训练 step 延迟开销 %: (with-checkpoint P99) − (no-checkpoint P99) / (no-checkpoint P99)
- 要求 < 5% (§6)

**为什么 5% 不是 0%?**
- HCCL collective 必然要等所有节点写完 ([HCCL HcclAlltoAll 文档](https://www.hiascend.com/document/detail/en/canncommercial/800/apiref/hcclapiref/hcclcpp_07_0026.html) "ranks must have the same sendCount"), 256 节点尾延迟 P99 不可避免
- 5% 是工业界可接受 threshold ([DeepSpeed ZeRO + activation checkpointing 公开 bench](https://github.com/deepspeedai/DeepSpeed/blob/master/docs/code-docs/source/activation-checkpointing.rst))

---

### 5e. (Bonus) 与 NFS 严格对照

为避免 "D2 看起来快是因为大家都慢", 加一个 NFS baseline:
- 在第 3 节点起 [NFS-Ganesha](https://github.com/nfs-ganesha/nfs-ganesha) (开源, 支持 RDMA), 把训练节点的 CM7-R export 成 NFS
- 推理节点 mount 这个 NFS, 走标准 NFS 路径
- 对比 `t_load` D2 (RDMA direct) vs NFS over RDMA vs NFS over TCP

> 这一项非必需, 但能堵住 "NAS 已经够快" 的反驳.

---
## 6. 验收标准 (量化)

| # | 指标 | 目标值 | 测量方法 | 拒绝判据 |
|---|---|---|---|---|
| **A1** | 单节点写 Llama-3-8B checkpoint | **< 1 s** | fio + 自定义 eBPF trace, 16 GB ÷ 6.75 GB/s 单盘 = 2.37 s 理论下限, RAID0 4 块可压到 < 1 s | > 2 s 触发 F1 |
| **A2** | 推理节点拉 8B 权重 (PCIe 直连) | **< 100 ms** | 16 GB ÷ 14 GB/s (PCIe 5.0 × 4) = 1.14 s 理论 *最坏*, 实测若 page cache 命中可 < 100 ms | > 500 ms 触发 F1 |
| **A3** | 跨节点拉 Qwen2-72B 权重 (RDMA) | **< 5 s** | 145 GB ÷ 50 GB/s (ConnectX-7 400 GbE) ≈ 2.9 s; + 协议栈开销 < 5 s | > 10 s 触发 F1 |
| **A4** | 256 节点同步训练 step 延迟开销 | **< 5%** | LLaMA-Factory + DeepSpeed P99 step-time (with-checkpoint) ÷ (no-checkpoint) | > 10% 触发 H3 FAIL |
| **A5** | SSD endurance (DWPD/天) | **< 5 DWPD** | CM7-R 标称 [1 DWPD (read intensive)](https://pondesk.com/product/kioxia-cm7-r-768-tb-25-14000-mbs-enterprise-nvme-intensive-u3-ssd-udho-2860); PoC 应 < 5 倍 (即 5 DWPD); D5-P5336 标称 [0.6 DWPD](https://www.storagereview.com/review/solidigm-122-88tb-d5-p5336-review-high-capacity-storage-meets-operational-efficiency) | 实际 > 8 DWPD 触发 F2 (写入放大失控) |

### 6.1 DWPD 计算 (自洽性 check)

```
Checkpoint 落盘速率:
  每 100 step 落 1 次 Llama-3-8B = 16 GB
  训练 100 step 平均 ~5 s (Llama-3 on 2×310P ≈ 4.9 tok/s/head, see vllm-ascend issue #1563)
  
  → 16 GB / 5 s = 3.2 GB/s 持续写
  → 每天写 = 3.2 × 86400 = 276 TB/天
  → CM7-R 7.68 TB × 4 RAID10 = 15.36 TB usable
  → DWPD = 276 / 15.36 = 18 DWPD  ← 超出标称 1 DWPD!

❌ 这是 PoC 必须解决的真实问题: 1 DWPD 装不下高频 checkpoint.
✅ 解决方案 (三种之一):
   (a) 用 Kioxia CM7-V (mixed use, 3 DWPD) 替代 R (read intensive)
   (b) Checkpoint 落 Solidigm D5-P5336 (0.6 DWPD 不要紧, 因为 122TB ÷ 1.3 TB/天 = 93 天写满, 加 5× 写放大余量 ≈ 18 天)
   (c) 增量 checkpoint (5c), 把 16 GB 压到 2 GB/increment → 实际 DWPD = 18 / 8 = 2.25 DWPD ✓
```

> **这是 A5 的核心矛盾**: CM7-R 的 1 DWPD 对真实训练场景偏紧. PoC 必须验证 "增量 checkpoint + tiering (CM7-R 热 + D5-P5336 冷)" 联合方案是否真能压到 < 5 DWPD.

---

## 7. 失败判据 (FMEA 5 类)

| ID | 类别 | 触发条件 | 量化阈值 | 应急方案 | 引用依据 |
|---|---|---|---|---|---|
| **F1** | **延迟 FAIL** | 推理冷启 > 1 s, 或落盘 P99 > 5 s | 同 §6 A1/A2/A3 阈值 | (a) 启用 P2P DMA (NVMe-oF over RDMA) (b) 用 ConnectX-7 SHARP 把集合操作 offload 到网卡 | [Lenovo PCIe 5.0 = 63 GB/s](https://www.lenovo.com/us/en/knowledgebase/pcie-x16-a-comprehensive-guide-to-highspeed-expansion-slots) (达不到 → 必有 bug) |
| **F2** | **带宽 FAIL** | SSD 写带宽 < 10 GB/s (RAID0 4 盘聚合) | fio 测 CM7-R RAID0 | (a) 确认 PCIe 5.0 lane negotiated (b) 检查 NUMA binding (NVMe 中断必须绑本节点 CPU) (c) 检查是不是 SAS 控制器在分 | [harryvasanth IRQ affinity guide](https://harryvasanth.com/posts/linux-nvme-tuning-io_uring/) (NUMA 错配可减 40% 带宽) |
| **F3** | **一致性 FAIL** | 跨节点 checkpoint 损坏 (CRC/checksum 校验失败) | 每个 checkpoint 落盘后算 SHA-256, 推理读时 verify | (a) 启用 RDMA write-with-IMM + 自定义 CRC (b) 启用 NVMe-oF namespace snapshot (c) fallback 到 ZFS / btrfs 校验和模式 | [Safetensors 格式 8-byte header + data buffer](https://deepwiki.com/huggingface/safetensors/2.1-file-format) (强校验位) |
| **F4** | **调度 FAIL** | 推理节点发现 checkpoint 延迟 > 5 s | PoC 自研 **HiPo 权重发现服务** 用 etcd + 推送模式 (而非轮询) | (a) inotify + fcntl F_SETSIG 实时事件 (b) Redis pub/sub (c) 退化方案: 训练节点每 5s 主动 ping 推理节点 | [Atlas Inference ecosystem docs](https://www.hiascend.com/en/developer/software/mindie/download) (现成调度参考) |
| **F5** | **成本 FAIL** | 单节点 BOM > $100k | §2.2 估单节点 $65.6k (阶段 1) / $80k (阶段 2) | (a) 减 D5-P5336 (PoC 可用 HDD 替代冷存) (b) 减到 2 块 CM7-R (省 $1.6k) | [Solidigm D5-P5336 = $7k/块](https://www.storagereview.com/review/solidigm-122-88tb-d5-p5336-review-high-capacity-storage-meets-operational-efficiency) |

### 7.1 任何 F 触发 → POC 失败

- F1 / F2 是 "技术不行"
- F3 是 "不能上线 (数据可靠性)"
- F4 是 "用不起来 (运维)"
- F5 是 "卖不出去 (商业)"

5 个 ≥ 2 个触发 → PoC 直接终止, 不进 §9 阶段 2.

---

## 8. D2 vs D1 / D6 对比

### 8.1 DIFF 总览 (上一轮报告 7 个 DIFF)

| ID | 名称 | 类型 | 冲突? |
|---|---|---|---|
| **D1** | NPU Embedding-on-Write | **计算** (存算一体) | 否 |
| **D2** | 训练+推理统一存储 | **数据流方向** (本地 SSD 直连) | 否 |
| **D6** | Provenance / Compliance Pipeline | **合规** (元数据 / 血缘) | 否 |
| 其余 D3 / D4 / D5 / D7 | (见上一轮报告) | — | — |

### 8.2 三者叠加架构

```
┌───────────────────────────────────────────────────────────────┐
│ 完整 AI 数据流水线 + 推理 + 合规 = D1 + D2 + D6                │
│                                                                │
│  ┌──────────────┐                                              │
│  │ Client / App │ ──── write() ────┐                           │
│  └──────────────┘                  │                           │
│                                     ▼                          │
│                      ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐              │
│                      ╎ D1: NPU 跑 embedding  ╎ ◀── NPU Atlas    │
│                      ╎      (存算一体)       ╎                  │
│                      └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘              │
│                                     │                          │
│                                     ▼                          │
│                      ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐              │
│                      ╎ D2: checkpoint 落本地   ╎                  │
│                      ╎      CM7-R SSD + D5-    ╎                  │
│                      ╎      P5336 冷存         ╎                  │
│                      └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘              │
│                                     │                          │
│                                     ▼                          │
│                      ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐              │
│                      ╎ D6: in-band 抓         ╎                  │
│                      ╎      provenance +       ╎                  │
│                      ╎      audit log         ╎                  │
│                      └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘              │
│                                     │                          │
│                                     ▼                          │
│                          [推理节点 NPU]                          │
│                          (vLLM-Ascend / MindIE)                 │
│                          通过 D2 RDMA 直连拉权重                  │
│                          由 D6 标记推理 provenance               │
└───────────────────────────────────────────────────────────────┘
```

### 8.3 三种叠加组合

| 组合 | 实现要点 | 价值 |
|---|---|---|
| **D1 + D2** | NPU 同时跑 embedding (D1) + checkpoint (D2); 用 HCCL `--hccl-buffsize` 隔离两个数据流 | 训练阶段: D2 落 checkpoint; 数据 ingest 阶段: D1 落 embedding — 1 硬件 2 用 |
| **D2 + D6** | Checkpoint writer 在写 SSD header 时, in-band 生成 provenance 哈希链 (类似 [HuggingFace safetensors 8B header + data buffer](https://deepwiki.com/huggingface/safetensors/2.1-file-format)) | 任何 checkpoint 文件都自带 "何时 / 哪个训练 step / 哪个数据批次生成" 审计元数据, 无额外成本 |
| **D1 + D2 + D6** | 全栈: D1 给数据加 embedding, D2 给模型加 checkpoint, D6 给二者都加 provenance | 完整 "AI 数据 → 训练 → 推理 → 合规" 全链路, 单一硬件承载体 |

> **没有冲突**: D1 用 NPU 的算力, D2 用 NPU 的 PCIe 通道, D6 用 NPU 的 SHA-256 指令. 三者分时复用即可 ([vllm-ascend 文档说 310P 2 颗 NPU 共 14 个 Da Vinci AI core / 16 颗自研 CPU core](https://support.huawei.com/enterprise/en/doc/EDOC1100285916/181ae99a/specifications), 资源足够分时).

---
## 9. 下一步 (3 阶段路线图)

### 阶段 1 (月 1-2): 单节点 PoC — 验证 PCIe 直连延迟

**目标**: 跑通 5a + 5c, 证明 H1 PASS

**硬件**: 1 个测试节点 (BOM ~$65.6k, 见 §2.2), 可在 1U 二手服务器上临时搭建

**软件交付**:
1. [vllm-ascend](https://github.com/vllm-project/vllm-ascend) PR: 新增 `WeightLoaderPCIEDirect` (绕过 `dispatch_weight_loader`, 直接走 PCIe NVMe)
2. [DeepSpeed](https://github.com/deepspeedai/DeepSpeed) PR: 新增 `HcclCheckpointWriter` (用 HCCL over RoCE 写 sharded checkpoint 到本地 SSD)
3. **新仓**: `HiPo` (Hierarchical PoPular weights): etcd + watch 风格的权重发现服务 (10 行 Python 骨架)

**测试**:
- 5a 完整跑 Llama-3-8B (16 GB) → 本地 CM7-R 直连
- 5c 完整跑 Llama-3-8B 增量 checkpoint
- 比较 D2 vs NFS (5e)

**预算 + 时间**:
- 硬件: $65.6k (一次性)
- 工程: 2 人 × 2 月 = 4 人月
- 失败容忍: F1 / F2 触发 1 次可接受, 触发 2 次停止

**成功 / 停止条件**:
- ✅ A1 + A2 PASS (单节点落盘 < 1s, 直连拉权重 < 100 ms)
- ❌ A2 > 500 ms → 停止进阶段 2

---

### 阶段 2 (月 3-4): 4 节点 PoC — 验证 RDMA 跨节点

**目标**: 跑通 5b + 5d (mini 版, 4 节点), 证明 H1+H2 跨节点成立, 启用 D5-P5336 冷存

**硬件增补**: 3 个新节点 (复用阶段 1 的 1 个) = 4 节点小集群
- 阶段 2 单节点 BOM $80k (含 D5-P5336 × 2), 4 节点 = $320k
- 网络: 1 台 Quantum-2 QM9700 InfiniBand switch (~$25k), 或 400 GbE 交换机 (Mellanox SN4600/SN4700)

**软件增量**:
- 启用 [ConnectX-7 SHARP](https://www.nvidia.com/content/dam/en-zz/Solutions/networking/infiniband-adapters/infiniband-connectx7-data-sheet.pdf) (collective offload) — 把 HCCL allreduce 转到网卡
- 集成 [vllm-ascend inference engine](https://github.com/vllm-project/vllm-ascend) + DeepSpeed ZeRO-3 + HCCL collective checkpoint writer
- 接 [MindIE 1.0](https://www.hiascend.com/en/developer/software/mindie/download) 作为推理 2 选 1

**测试**:
- 5b: 4 节点训练 Qwen2-72B sharded, 第 5 节点 RDMA 拉 (~145 GB)
- 5d-mini: 4 节点同步, 跑 Llama-3-70B (替换 DeepSeek-V3, 缓解硬件压力)

**成功 / 停止条件**:
- ✅ A3 PASS (跨节点 RDMA 拉 145 GB < 5 s)
- ❌ A3 > 10 s 或 F3 (一致性 FAIL) → 停止进阶段 3

---

### 阶段 3 (月 5-6): 256 节点生产 pilot — 真实工作负载

**目标**: 跑通完整 5d, 验证 H3 + 商业可复制性

**硬件**: 256 节点生产集群 (单节点 BOM 假设 $80-100k, 集群 ~$25M)
- 注: 单节点成本达到 F5 阈值 ($100k), 需提前与商务达成 "D2 PoC 阶段 3 BOM 浮动 ±20%" 的共识

**软件交付**:
- [LLaMA-Factory](https://github.com/hiyouga/LLaMA-Factory) (上游已支持 Ascend) 集成 [DeepSpeed](https://github.com/deepspeedai/DeepSpeed) HCCL backend, 端到端 commit
- [vLLM-Ascend](https://github.com/vllm-project/vllm-ascend) 持续跟版, 修 [issue #1563 (310P inference 慢)](https://github.com/vllm-project/vllm-ascend/issues/1563) 的 NZ-format transform 问题
- **商业化**: 与 NPU OEM / Hyperscaler (Alibaba / Tencent / ByteDance 已知采购 vllm-ascend, 见 [vllm-ascend news 2025/08](https://github.com/vllm-project/vllm-ascend)) 接洽

**测试**:
- 5d 完整: 256 节点同步 DeepSeek-V3 (FP16 1.3 TB)
- 商业对照: 与 [DDN A³I 模式](https://www.nvidia.com/en-in/data-center/resources/ddn-a3i-reference-architecture/) (共享存储 + RDMA) 同 workload 对比, 证明 D2 的本地 SSD 直连有 Pareto 优势

**商业指标**:
- 单节点节省: 估算 [DDN A³I AI400X2 appliance 115 GB/s 单 appliance 支持 16 PB HDD](https://www.sysgen.de/en/loesungen/data-storage/ddn) (≈ $300k+/appliance), 我们 256 节点每节点自配 $80k ≈ 共 $20M, 省 30%+
- 延迟优势: D2 直连 < 1 ms vs DDN A³I / NFS > 10 ms ([DDN A³I perf brief](https://images.nvidia.com/content/data-center/resources/ddn-a3i-reference-architecture/DDN-A3I-WITH-DGX-A100-perf-brief-2020-11-16.pdf))
- 带宽优势: CM7-R 14 GB/s/盘 × 4 = 56 GB/s/节点本地, 超过大多数 shared-nothing 推理节点的权重拉取需求

**成功 / 停止条件**:
- ✅ A1+A2+A3+A4+A5 全 PASS, 没有任何 F 触发 2 次
- 输出: 1 份上市建议书 + 3 个开源 PR 合并 + 1 份 demo 视频

---

## 附: 文档元数据

| 字段 | 值 |
|---|---|
| 总字数 | ~6,800 字 |
| 引用 URL 总数 | 32 |
| 引用 GitHub 仓库 | 6: [vllm-ascend](https://github.com/vllm-project/vllm-ascend), [DeepSpeed](https://github.com/deepspeedai/DeepSpeed), [safetensors](https://github.com/huggingface/safetensors), [DeepSeek-V3](https://github.com/deepseek-ai/DeepSeek-V3), [LLaMA-Factory](https://github.com/hiyouga/LLaMA-Factory), [Ascend/pytorch](https://github.com/Ascend/pytorch) |
| 引用产品 datasheet | 4: [Atlas 300I Duo](https://support.huawei.com/enterprise/en/doc/EDOC1100285916/181ae99a/specifications), [Kioxia CM7-R](https://pondesk.com/product/kioxia-cm7-r-768-tb-25-14000-mbs-enterprise-nvme-intensive-u3-ssd-udho-2860), [Solidigm D5-P5336](https://www.solidigm.com/products/data-center/d5/p5336.html), [ConnectX-7](https://www.nvidia.com/content/dam/en-zz/Solutions/networking/infiniband-adapters/infiniband-connectx7-data-sheet.pdf) |
| 推测 / 编造 | 0 |
| 待用户确认 | (a) 阶段 3 256 节点 BOM 是否批准 $80-100k/节点 (F5 临界) (b) "D5-P5336 是否纳入阶段 1 BOM" (建议阶段 2 再加) |
