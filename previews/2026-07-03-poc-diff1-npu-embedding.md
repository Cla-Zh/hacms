# DIFF-1 PoC 设计文档 — NPU Embedding-on-Write

**文档状态**: v0.1 草案 · 等待用户评审
**目标读者**: 256 节点超大存储集群项目组 + AI 基础设施团队
**PoC 周期**: 2-3 周 (单节点, 1 个完整迭代)
**作者**: calvin (hermes-agent subagent 委托产出)
**日期**: 2026-07-03
**关联资产**:
- 上游报告: `/mnt/c/Users/calvin/Desktop/storage-for-ai-data-platform.html` (DIFF-1 章节)
- hacms 预览: `previews/2026-07-03-storage-for-ai-data-platform.html` (commit fa00924)

---

## 0. 关键校正 (与上一轮报告的差异)

上一轮报告引用 *"Ascend 310P ~ 22-44 TOPS INT8"*, **该数字与公开规格不符**, 本 PoC 以官方/可信第三方数据为准:

| 芯片 | 上一轮报告 | 校正后 (有据) | 来源 |
|---|---|---|---|
| Ascend 310 (原版) | 22-44 TOPS INT8 | **22 TOPS INT8 单芯片** (Atlas 300I = 4×310 = 88 TOPS) | [Huawei Atlas 300I User Guide](https://support.huawei.com/enterprise/en/doc/EDOC1100079295/3656aeb1/performance) |
| Ascend 310P | — | **140 TOPS INT8 / 70 TFLOPS FP16 单芯片** (Atlas 300I Duo = 2×310P = 280 TOPS) | [Tsingetech HD300I datasheet (PDF)](https://www.tsingetech.com/Public/upload/image/20250926/1758866954.pdf) · [Huawei Atlas 300I Duo specs](https://support.huawei.com/enterprise/en/doc/EDOC1100285916/181ae99a/specifications) |

> **设计影响**: 算力被低估了约 6 倍. 原报告"1 张 NPU 即可承担 100 GB/s 数据流"的估算需重新核算, 见 §3.

---

## 1. PoC 目标

**核心问题**: 256 节点超大存储集群是否应该把 **"数据落 SSD 那一刻同步生成 embedding"** 作为第一个产品差异化功能 (DIFF-1)?

**3 个可证伪假设**:

| # | 假设 | 验证方式 |
|---|---|---|
| H1 | **算力够**: 单张 Atlas 300I Duo (2×Ascend 310P, 280 TOPS INT8) 能实时 embedding 500 MB/s 输入流 | 端到端吞吐测试 |
| H2 | **延迟可接受**: 落盘 P99 延迟在加 embedding 后不超过 X ms (具体阈值见 §6) | fio + 自定义 eBPF tracer |
| H3 | **准确度无损**: NPU 跑 BGE-M3 vs GPU 跑同一模型, Recall@10 偏差 < 0.5% | BeIR/MS MARCO 标准评测 |

**交付物**:
- 一份 PoC 验收报告 (通过/不通过/部分通过 + 数据)
- 一段 demo 视频 (展示 embedding-on-write 流水线的端到端行为)
- 一份产品化建议书 (§8)

---

## 2. 硬件清单 (256 节点中选 1 节点)

### 2.1 推荐配置 (按上一轮报告"极致 NVMe SSD + 高带宽网络"假设)

| 组件 | 型号/规格 | 数量 | 单价参考 (USD) | 来源 |
|---|---|---|---|---|
| **CPU** | 2× Intel Xeon 6980P (Granite Rapids, 128 核, DDR5-6400 12 通道) 或 AMD EPYC 9965 (192 核, Turin) | 2 | ~$15k/颗 | [Servnet UK verified spec](https://www.servnetuk.com/computing-components) |
| **NPU** | **Huawei Atlas 300I Duo** (2×Ascend 310P, 280 TOPS INT8, 96 GB LPDDR4X, PCIe Gen4 x16) | **1 张** | ~$1.8k (市场价) | [Huawei Atlas 300I Duo specs](https://support.huawei.com/enterprise/en/doc/EDOC1100285916/181ae99a/specifications) · [市场价 $1.8k](https://www.accio.com/plp/huawei-ascend-310b-specs) |
| **SSD (主盘)** | **Kioxia CM7-R** 7.68 TB E3.S PCIe Gen5 x4 (14,000 MB/s seq read, 6,750 MB/s seq write) | **2 块** | ~$2k/块 | [Kioxia CM7 Supermicro datasheet](https://americas.kioxia.com/en-us/business/ssd/oem/supermicro/cm7-enterprise-nvme.html) |
| **SSD (备选)** | Samsung PM1743 15.36 TB E3.S PCIe Gen5 x4 (14,000 MB/s seq read) | 2 块 (备选) | ~$3k/块 | [Samsung PM1743 product page](https://semiconductor.samsung.com/ssd/enterprise-ssd/pm1743/) |
| **SSD (大容冷存)** | Solidigm D5-P5336 122.88 TB QLC PCIe Gen4 (7 GB/s seq read, 0.6 DWPD) | 4 块 (用于 100 GB 数据集 + 冷存) | ~$7k/块 | [StorageReview Solidigm D5-P5336 122.88TB review](https://www.storagereview.com/review/solidigm-122-88tb-d5-p5336-review-high-capacity-storage-meets-operational-efficiency) |
| **内存** | 1 TB DDR5-6400 RDIMM (主内存, 用于数据流 buffer + BGE-M3 CPU 备选通路) | 16×64GB | ~$8k | [Servnet UK](https://www.servnetuk.com/computing-components) |
| **网络 (数据入)** | NVIDIA ConnectX-7 400 GbE/NDR (PCIe Gen5 x16) — 用于 BeIR/MS MARCO 数据集导入 | 1 | ~$3k | [Servnet UK](https://www.servnetuk.com/computing-components) |
| **节点总数** | **256** (PoC 仅用 1 节点) | — | ~$150-200k/节点 | — |

> **PoC 节点总预算**: ~$50-80k (1 节点, 含 NPU + SSD + 测试仪表)

### 2.2 为什么选 Atlas 300I Duo 而不是单颗 310P?

- 一张卡 = 2×310P = 280 TOPS INT8 + 96 GB LPDDR4X 统一内存 (避免 PCIe 多卡互联开销)
- 算力冗余: §3 的算力估算显示单颗 310P (140 TOPS) 就够 500 MB/s, 用 Duo 是为了 (a) 跑双模型并行 (dense + sparse/ColBERT) (b) 留 headroom
- 关键风险: Atlas 300I Duo 在 2026-07 仍依赖 **CANN 8.2.0 + ONNX Runtime CANN EP**, 单颗 310P 可走更轻量的 ATC (Ascend Tensor Compiler) 路径

---

## 3. 软件栈

### 3.1 分层架构

```
┌────────────────────────────────────────────────────────────────┐
│ Layer 5: 应用层                                                 │
│  · Python SDK (S3-like API: put/get_object + 自动 embedding)   │
│  · CLI: write --bucket=data --file=f.jsonl --embed-model=bge-m3│
├────────────────────────────────────────────────────────────────┤
│ Layer 4: Embedding 服务                                         │
│  · TEI-Ascend (Text Embeddings Inference 移植版)                │
│  · ONNX Runtime CANN EP (v1.22.1 + CANN 8.2.0)                 │
│  · 备选: FlagEmbedding + torch_npu backend                      │
├────────────────────────────────────────────────────────────────┤
│ Layer 3: 推理框架 / 模型转换                                    │
│  · BGE-M3 (HuggingFace BAAI/bge-m3, MIT license)                │
│  · ATC (Ascend Tensor Compiler): ONNX → .om 离线转换            │
│  · MindSpore / torch_npu (训练侧备用)                          │
├────────────────────────────────────────────────────────────────┤
│ Layer 2: 落盘 Hook (3 种候选, §5 测试)                          │
│  · io_uring (内核, 默认)                                        │
│  · SPDK userspace (高吞吐)                                     │
│  · 自定义 kernel hook (fanotify / eBPF 拦截 write syscall)     │
├────────────────────────────────────────────────────────────────┤
│ Layer 1: 硬件                                                   │
│  · Atlas 300I Duo (Ascend 310P ×2)                              │
│  · Kioxia CM7-R Gen5 NVMe                                       │
│  · Intel Xeon 6980P / AMD EPYC 9965                             │
└────────────────────────────────────────────────────────────────┘
```

### 3.2 各组件详细规格

| 组件 | 选择 | 理由 | 来源 |
|---|---|---|---|
| **NPU 驱动 + 加速库** | **Huawei CANN 8.2.0** (Compute Architecture for Neural Networks) | 昇腾官方栈; ONNX Runtime CANN EP 已发布 (v1.22.1 ↔ CANN 8.2.0); 与 MindSpore/TF/PyTorch 兼容 | [Huawei Ascend Developer](https://www.hiascend.com/en/developer/operator) · [ONNX Runtime CANN EP doc](https://onnxruntime.ai/docs/execution-providers/community-maintained/CANN-ExecutionProvider.html) |
| **推理框架** | **ONNX Runtime 1.22.1 + CANN EP** (主) / **FlagEmbedding + torch_npu** (备) | (a) BGE-M3 已有公开 ONNX 转换, 可直接吃 ATC; (b) FlagEmbedding 是官方训练/推理框架 | [aapot/bge-m3-onnx on HF](https://huggingface.co/aapot/bge-m3-onnx) · [FlagEmbedding GitHub](https://github.com/FlagOpen/FlagEmbedding) |
| **Embedding 模型** | **BGE-M3** (BAAI/bge-m3, 568M 参数, MIT) | **6 个理由**: (1) **多语言** 100+ 工作语言 → 客户无中英文切换成本; (2) **多输出** 同时出 dense (1024-d) + sparse (lexical weight) + ColBERT vec, 一次推理 3 种检索用途; (3) **长上下文** 8192 tokens → 适合 chunk 落盘后的嵌入; (4) **SOTA 表现** MIRACL/MKQA 多语言检索 SOTA; (5) **开源 + 可商用** MIT license → 无云 API 锁定; (6) **ONNX 成熟** 已有社区 ONNX 转换, 可直接走 ATC | [BGE-M3 paper (arXiv 2402.03216)](https://arxiv.org/abs/2402.03216) · [BGE-M3 HF model card](https://huggingface.co/BAAI/bge-m3) · [FlagEmbedding README](https://github.com/FlagOpen/FlagEmbedding/blob/master/research/BGE_M3/README.md) |
| **落盘 Hook A: io_uring** | Linux kernel 5.19+, `liburing` C API | **默认选项**, 生产广泛验证; NVMe 调度器 `none` (passthrough) | [Linux Kernel Internals: tuning-storage](https://kernel-internals.org/io/tuning-storage/) |
| **落盘 Hook B: SPDK** | spdk-26.01 LTS, NVMe bdev + blobfs | **高性能选项**; 用户态轮询 + 无中断, 单设备可达 11.4M IOPS; 适合极致吞吐验证 | [SPDK Performance Reports](https://spdk.io/doc/performance_reports.html) · [SPDK 11x P99 improvement (Optane)](https://lucioduran.com/blog/spdk-nvme-storage-performance-optimization) |
| **落盘 Hook C: 自定义 kernel hook** | eBPF / fanotify 拦截 write() | **透明嵌入选项**; 用户无感, 但性能/兼容性最差, 仅作 research-grade baseline | [Linux fanotify(7)](https://man7.org/linux/man-pages/man7/fanotify.7.html) |

### 3.3 软件栈风险

| 风险 | 缓解 |
|---|---|
| CANN 对 BGE-M3 的 XLM-RoBERTa 算子支持不全 | ONNX Runtime CANN EP 支持 `enable_cann_subgraph=true` 自动切分回退, 优先用这条路径; 备选 torch_npu |
| BGE-M3 模型 568M 参数, 加载需 ~2.27 GB FP16 | Atlas 300I Duo 96 GB LPDDR4X 充裕; CPU 侧 1 TB DDR5 也够 |
| CANN 与 io_uring/SPDK 之间无官方协同 | PoC 中用 user-space daemon 串联: 数据 → io_uring buffer → ACL rtModel.execute() → 落盘 |

---

## 4. 测试数据集

### 4.1 推荐: BeIR benchmark (主)

**选择理由**:
- **标准**: BeIR 是 NeurIPS 2021 Datasets and Benchmarks Track 接收, 18 个数据集 9 个任务, 学术界事实标准
- **零样本评测**: BGE-M3 论文在 BeIR 上有官方 baseline 数字, 可直接对比 Recall@10
- **多样性**: 涵盖新闻/生物医学/电商/推特/Wikipedia, 验证模型在不同分布下的稳定性

| 数据集 | 文档数 | 任务类型 | 大小 |
|---|---|---|---|
| **MS MARCO** (passage) | 8.8M passages | Passage Retrieval | ~2.6 GB compressed → ~30 GB 展开 |
| **NFCorpus** | 3.6K docs | Bio-Medical IR | <100 MB |
| **NQ** (Natural Questions) | 3M docs | QA | ~5 GB |
| **FiQA-2018** | 57K docs | Finance QA | ~250 MB |
| **DBPedia** | 4.6M docs | Entity Retrieval | ~15 GB |
| **HotpotQA** | 5.2M docs | Multi-hop QA | ~10 GB |
| **TREC-COVID** | 171K docs | Bio-Medical (COVID) | ~1 GB |
| **总计 (PoC 100 GB 子集)** | ~20-30M docs | 混合 | **~100 GB** |

来源: [BEIR paper (arXiv 2104.08663)](https://arxiv.org/abs/2104.08663) · [BeIR GitHub](https://github.com/beir-cellar/beir) · [HF BeIR](https://huggingface.co/BeIR)

### 4.2 备选: MS MARCO v2 (passage, augmented)

- 138,364,198 passages → augmented tar 21 GB
- 唯一缺点: 太大 (超过 100 GB PoC 预算); 但 industry 真实分布强
- 来源: [Anserini MS MARCO v2 docs](https://github.com/castorini/anserini/blob/master/docs/experiments-msmarco-v2.md) · [MS MARCO 官方](https://microsoft.github.io/msmarco/)

### 4.3 PoC 数据集构造

```
beir-poc-100gb/
├── source/                  # 原始下载
│   ├── msmarco-passage/    # 8.8M, ~30 GB
│   ├── dbpedia-entity/     # 4.6M, ~15 GB
│   ├── hotpotqa/           # 5.2M, ~10 GB
│   ├── nq/                 # 3M, ~5 GB
│   ├── fiqa/               # ~250 MB
│   ├── nfcorpus/           # ~50 MB
│   ├── trec-covid/         # ~1 GB
│   └── arguana/            # ~30 MB
├── queries/                 # 每个数据集的标准 queries (BeIR 提供)
├── qrels/                   # 标准 relevance judgments
└── total: ~60-70 GB 原始 → 重复 + 复制到 ~100 GB 测试负载
```

---

## 5. 测试场景 (3 个必做 + 1 个可选)

### 5a. Baseline: 单线程同步落盘 + 串行 embedding

**目的**: 测**最坏情况**端到端延迟, 验证链路通畅性, 不期望用于生产

**伪代码**:
```python
for chunk in input_stream:           # 假设 chunk = 512 tokens ~ 2KB
    text = chunk.decode()
    embedding = bge_m3.encode(text) # 同步等 NPU 推理 (假设 50ms)
    f.write(chunk)                  # 同步落 SSD
    index.append({chunk_id: embedding, offset: f.tell()})
```

**预期指标**:
- 吞吐: 受 NPU 推理限速, ~200 docs/s (BGE-M3 batch=1, Ascend 310P 单核性能未知, 假设同 RTX 3050 水平 [GigaGPU benchmark](https://gigagpu.com/embedding-throughput-benchmark-gigagpu/))
- 单 chunk 延迟: 落盘 (1ms) + NPU 推理 (50ms) + Python overhead (5ms) ≈ 56ms
- 准确度: **对照组 (应等同 GPU)** — Recall@10 等同 BGE-M3 paper 数据

### 5b. 流水线并行: 读 → embedding → 落盘 overlap

**目的**: 通过 3-stage pipeline 让 NPU 和 SSD 各自跑满, 测**最大吞吐**

**架构**:
```
[Stage 1: Read]   →  ring buffer  →  [Stage 2: NPU embed]  →  ring buffer  →  [Stage 3: SSD write]
  worker thread 1     (size 64)        worker thread 2-3          (size 64)       worker thread 4
  CPU-bound           (内存 copy)        NPU-bound (ACL batch=32)  (内存 copy)      io_uring / SPDK
```

**关键参数**:
- **Batch size**: 8, 16, 32, 64, 128 (扫一遍)
- **Pipeline depth**: 2 stage vs 3 stage vs 4 stage (双 NPU)
- **Chunking**: 256 / 512 / 1024 / 2048 tokens per chunk

**预期指标**:
- 吞吐目标: **500 MB/s 输入** (即 ~250K chunks/s @ 2KB/chunk, 或 ~10K chunks/s @ 50KB/chunk)
- NPU 推理限速: 假设 Ascend 310P 单核 ~ 1400 docs/s (按 RTX 3050 6GB 的 ~ 1400 docs/s 同性能估算, [GigaGPU BGE-M3 测](https://gigagpu.com/embedding-throughput-benchmark-gigagpu/)), 1 张 310P = ~ 1400 docs/s, **2 张 310P (Duo) = ~ 2800 docs/s**
- 瓶颈: **NPU 推理**, 不是 SSD
- 落盘 P99: 取决于 §6.2 验收标准

### 5c. 批量 embedding 后写 (batch latency vs throughput tradeoff)

**目的**: 验证"攒批"行为是否提供更好 NPU 利用率, 适合**非实时**数据落盘场景

**伪代码**:
```python
buffer = []
for chunk in input_stream:
    buffer.append(chunk)
    if len(buffer) >= 256:           # 或 50ms 时间窗口
        embeddings = bge_m3.encode_batch(buffer, batch_size=32)  # NPU batch=32
        for i, emb in enumerate(embeddings):
            f.write(buffer[i])
            index.append({...})
        buffer.clear()
```

**预期指标**:
- 吞吐: 比 5b 高 20-30% (NPU batch 内并行度更好)
- 落盘 P99: **劣化** (批 256 意味着 P99 延迟 = batch wait + NPU + write ≈ 200-300ms)
- 适用场景: 训练数据 ingestion (非实时); 不适合实时 user-facing query

### 5d. (可选) 落盘 hook 对比: io_uring vs SPDK vs eBPF

**目的**: 验证哪种落盘路径给 embedding pipeline 留更多带宽

- **预期**: SPDK > io_uring > eBPF, 差距主要在延迟 (SPDK P99 ~ 10μs vs io_uring P99 ~ 50-120μs)
- 来源: [SPDK benchmark](https://lucioduran.com/blog/spdk-nvme-storage-performance-optimization) — SPDK tuned P99 = 10.5μs vs kernel io_uring P99 = 120μs (11x improvement)

---

## 6. 验收标准 (Pass/Fail)

### 6.1 吞吐 (核心 KPI)

| 输入负载 | 期望 throughput | 验收线 | 失败线 |
|---|---|---|---|
| **500 MB/s 持续输入** (PoC 目标) | **≥ 10K chunks/s** (batch=32, 50KB/chunk) | **≥ 8K chunks/s** (NPU 利用率 ~ 80%) | < 5K chunks/s |
| 200 MB/s | ≥ 4K chunks/s | ≥ 3.5K | < 2.5K |
| 100 MB/s | ≥ 2K chunks/s | ≥ 1.8K | < 1.5K |

**推导**:
- 500 MB/s ÷ 50 KB/chunk = 10,000 chunks/s
- Ascend 310P 单芯片理论: 140 TOPS INT8, BGE-M3 ~ 568M × 2 (MAC) × 22 层 ≈ 25 GFLOPs/inference. 140 TOPS / 25 GFLOPs ≈ **5,600 inferences/s (INT8)** (理论上限, 实际利用率 50-70% → ~ 3000-4000 inferences/s)
- 2 张 310P (Duo) ≈ **6000-8000 inferences/s**
- 因此 500 MB/s 输入 + BGE-M3 batch=8 (Amdahl 加速 ~ 1.5x) ≈ **4500-6000 chunks/s** → **可能不达标**
- **结论**: PoC 真实期望 ~ **300-400 MB/s**, 500 MB/s 是 stretch goal

### 6.2 延迟

| 指标 | 验收线 (Pass) | 失败线 (Fail) |
|---|---|---|
| **落盘 P99 延迟 (5b pipeline)** | **< 10 ms** (基础假设) | > 10 ms |
| 平均落盘延迟 | < 2 ms | > 5 ms |
| NPU 推理 P99 (batch=32) | < 100 ms | > 200 ms |
| 端到端 P99 (5a baseline) | < 200 ms | > 500 ms |

**推导**:
- io_uring 4KB random write latency: ~ 50-120 μs ([Linux Kernel tuning](https://kernel-internals.org/io/tuning-storage/))
- Kioxia CM7-R seq write 128KB: ~ 6,750 MB/s → 19 μs/block
- 目标: 单 chunk (50 KB) 落盘 ≤ 1 ms, 加 NPU sync ≤ 5 ms, pipeline 内 ≤ 10 ms

### 6.3 准确度 (零容忍)

| 指标 | 验收线 | 失败线 |
|---|---|---|
| **BGE-M3 NPU vs GPU Recall@10 偏差** | **< 0.5%** (绝对差) | > 2% (重新评估) |
| NDCG@10 偏差 | < 0.5% | > 2% |
| BeIR 平均 nDCG@10 | ≥ paper baseline - 0.5% | < paper baseline - 2% |

**基线** (来自 [BGE-M3 paper](https://arxiv.org/abs/2402.03216)):
- MS MARCO nDCG@10 ≈ 0.405
- NQ nDCG@10 ≈ 0.541
- DBPedia nDCG@10 ≈ 0.476
- TREC-COVID nDCG@10 ≈ 0.706

**测试方法**:
1. 用 NVIDIA RTX 4090 (或 H100) 跑 FlagEmbedding `encode()` 作为 ground truth
2. 用 Atlas 300I Duo 跑 ONNX Runtime CANN EP 同一模型, 同一输入
3. 同一 ANN 索引 (Qdrant / FAISS) 下, 跑 BeIR standard evaluation (`beir.retrieval.evaluation.EvaluateRetrieval`)
4. 对比每数据集的 Recall@10 / nDCG@10

### 6.4 资源利用率

| 指标 | 验收线 | 失败线 |
|---|---|---|
| **NPU 平均利用率 (5b pipeline)** | **≥ 30%** (不浪费) | < 30% (考虑降配到单 NPU) |
| SSD 带宽利用率 | 30-70% (留 headroom) | > 90% (饱和, 加 SSD) |
| CPU 占用 (用户态 daemon) | < 8 核 | > 16 核 |

---

## 7. 失败判据 (FMEA 风格)

| 失败类型 | 触发条件 | 决策 | 备选方案 |
|---|---|---|---|
| **F1: 算力不足** | NPU 利用率 ≥ 95% 但吞吐 < 300 MB/s | 换 Ascend 910C (780 TFLOPS BF16, 8x 310P 算力) | 详见 §8.2 vs NVIDIA AIDP 对比 |
| **F2: 延迟劣化** | 落盘 P99 > 10 ms | 切换到 SPDK (预期 P99 降 10x) | 若仍不达标 → 退回 read-after-embedding (落盘后再异步 embed) |
| **F3: 准确度不达标** | NPU vs GPU Recall@10 偏差 > 2% | **立即中止**: 可能是 ONNX→OM 转换精度损失 | 切换 torch_npu 路径 / 切换 BGE-large-en-v1.5 (更小的 335M, 算子更简单) |
| **F4: 软件栈 bug** | CANN 8.2.0 + BGE-M3 模型加载失败 | 降级到 CANN 7.x + 老 ONNX export | 用 GPU 跑 embedding (但失去 DIFF-1 卖点) |
| **F5: 成本失控** | 单节点 PoC BOM > $100k | 砍 Solidigm 大容量 SSD, 用 2 块 CM7-R | 推迟到 Phase 2 |

---

## 8. 下一步 (PoC 通过后)

### 8.1 产品化路径 (Pre-vectorized Storage SKU)

**SKU 命名建议**: **"Vector-on-Write Storage (VWS) SKU"** 或 "AI-Ready Object Storage"

**3 个 tier**:

| Tier | 节点配置 | 单价 (估) | 目标客户 |
|---|---|---|---|
| **VWS-Standard** | 1× Atlas 300I Duo + 8× Kioxia CM7-R 7.68 TB | ~$20k/节点 | 中小 RAG 团队 |
| **VWS-Pro** | 2× Atlas 300I Duo + 16× Samsung PM1743 15.36 TB | ~$40k/节点 | 大模型 fine-tuning 数据湖 |
| **VWS-Cluster** | 256 节点 (用户现有硬件) + 全 Atlas | 用户现有 BOM | Hyperscaler / 国家级 AI 基础设施 |

**差异化卖点**:
- "落盘即向量化, 不需要单独 pipeline"
- "ONNX 兼容, 你能用任何 embedding 模型"
- "embedding 与原文件 atomic, 用 SSD ZNS / NVMe-oF 保证一致性"

### 8.2 竞品对标

| 竞品 | 算力 | 存储 | 商业模式 | 用户 VWS 优势 |
|---|---|---|---|---|
| **NVIDIA AI Data Platform (AIDP)** | GPU (H100/H200/Blackwell) + BlueField DPU | GPUDirect Storage (35 GB/s/节点) | 卖 GPU 附送存储 | **价格**: 昇腾 NPU < H100; **能耗**: 310P 150W vs H100 700W; **国产化**: 无 CUDA 锁定 |
| 来源 | [NVIDIA AIDP Hammerspace](https://www.storagenewsletter.com/2025/10/30/nvidia-gtc-dc-2025-hammerspace-unveils-ai-data-platform-solution-to-transform-enterprise-data-for-the-agentic-ai-anywhere-era) | [Cloudian AIDP launch](https://cloudian.com/press/cloudian-launches-aidp-ai-platform/) | | |
| **DDN A³I** | GPU 配套 (DGX SuperPOD) | EXAScaler Lustre + AI400X2 (InfiniBand) | 卖存储阵列 + GPU 一体机 | **成本**: 昇腾 vs InfiniBand 全栈贵; **部署**: 用户已有 NPU, 不需额外买 GPU |
| 来源 | [DDN + NVIDIA reference architecture](https://www.nvidia.com/en-in/data-center/resources/ddn-a3i-reference-architecture/) · [DDN H100 SuperPOD PDF](https://www.ddn.com/wp-content/uploads/2024/08/ddn-nvidia-h100-superpod-reference-architecture.pdf) | [DDN 173.9 GB/s GPUDirect demo](https://blocksandfiles.com/file/2020/11/18/ddn-adds-extra-shine-to-lustre-using-exascaler-array/1598942) | | |
| **Pinecone (serverless)** | AWS 上跑, 模型嵌入即服务 | 内置向量索引 (proprietary) | 按 $0.33/GB-月存储 + $8.25/M read units + $2/M write units | **价格**: Pinecone ~ $70-200/月 for 10M vectors, 用户 VWS 自建可便宜 50%+; **可控**: 用户数据不外流; **可定制**: 用户可换 embedding 模型 |
| 来源 | [Pinecone Pricing](https://www.pinecone.io/pricing/) · [TechTarget Pinecone Serverless](https://www.techtarget.com/searchdatamanagement/news/366566676/Pinecone-unveils-serverless-vector-database-targets-costs) | | | |

### 8.3 后续 PoC 排队 (DIFF-2, DIFF-4, DIFF-6)

按上一轮报告 5.2 节矩阵 (D1+D2+D4+D6 在右上甜蜜区):
- **DIFF-2**: NPU 加速 checkpoint + 训练/推理统一数据路径 (复用 NPU 硬件)
- **DIFF-4**: Agent sandbox 落本地 SSD + RDMA (DIFF-1 的 NPU 不直接复用, 但 256 节点拓扑复用)
- **DIFF-6**: NPU+SSD IO 拦截自动 lineage metadata (DIFF-1 hook 层扩展)

### 8.4 决策点 (Go / No-Go after PoC)

| PoC 结果 | 决策 |
|---|---|
| 全部 Pass, 准确度偏差 < 0.5% | **Go**: 启动 VWS-Standard SKU 工程化, 申请 8 周量产 |
| 部分 Pass, 准确度偏差 0.5-2% | **Hold**: 调研是否换模型 (BGE-large-en-v1.5) 或换 NPU 型号 (910C) |
| 部分 Pass, NPU 利用率 < 30% | **Pivot**: 单 NPU 配置, BOM 降 30% |
| Fail F3 (准确度 > 2%) | **Kill**: NPU 跑 transformer embedding 不可行, 转 DIFF-3 (语义去重) 用更小模型 |

---

## 附录 A: PoC 实施时间表 (3 周)

| Day | 任务 | 交付 |
|---|---|---|
| D1-D2 | 硬件到货 + 操作系统 + CANN 8.2.0 + ONNX Runtime 安装 | 节点 ready, npu-smi 可用 |
| D3-D4 | BGE-M3 ONNX → ATC → OM 转换, 单 chip inference 跑通 | 单 chunk 推理 demo, 准确度对比 GPU |
| D5-D6 | 5a baseline 实现, 单线程测吞吐/延迟 | baseline 数据 |
| D7-D9 | 5b pipeline 实现 (3-stage, 双 NPU), batch size 调优 | pipeline 数据 |
| D10-D11 | 5c batch-mode 实现, 找最优点 | tradeoff curve |
| D12-D13 | BeIR 数据集导入 + 准确度评测 (vs GPU baseline) | Recall@10 数据 |
| D14 | 失败/通过决策, 写验收报告 | go/no-go |
| D15+ | 若 Go: 启动产品化 | — |

## 附录 B: 所有外部引用源

### 学术 / 模型
- BGE-M3 论文: <https://arxiv.org/abs/2402.03216> · <https://arxiv.org/html/2402.03216v3>
- BGE-M3 模型: <https://huggingface.co/BAAI/bge-m3>
- BGE-M3 ONNX (aapot): <https://huggingface.co/aapot/bge-m3-onnx>
- FlagEmbedding 代码: <https://github.com/FlagOpen/FlagEmbedding>
- BEIR 论文: <https://arxiv.org/abs/2104.08663>
- BEIR GitHub: <https://github.com/beir-cellar/beir>
- MS MARCO 论文: <https://arxiv.org/abs/1611.09268>
- MS MARCO 官方: <https://microsoft.github.io/msmarco/>

### 硬件 / 芯片
- Huawei Atlas 300I (旧版, 4×Ascend 310): <https://support.huawei.com/enterprise/en/doc/EDOC1100079295/3656aeb1/performance>
- Huawei Atlas 300I Duo (新版, 2×Ascend 310P): <https://support.huawei.com/enterprise/en/doc/EDOC1100285916/181ae99a/specifications>
- Ascend 310P 国产模组 HD300I datasheet (140 TOPS INT8): <https://www.tsingetech.com/Public/upload/image/20250926/1758866954.pdf>
- Huawei Ascend Community (Operator Development): <https://www.hiascend.com/en/developer/operator>
- Kioxia CM7-R datasheet: <https://americas.kioxia.com/en-us/business/ssd/oem/supermicro/cm7-enterprise-nvme.html>
- Samsung PM1743: <https://semiconductor.samsung.com/ssd/enterprise-ssd/pm1743/>
- Solidigm D5-P5336 122.88 TB: <https://www.storagereview.com/review/solidigm-122-88tb-d5-p5336-review-high-capacity-storage-meets-operational-efficiency>
- Servnet UK Verified Spec (Gen5 服务器组件): <https://www.servnetuk.com/computing-components>

### 软件栈
- ONNX Runtime CANN EP doc: <https://onnxruntime.ai/docs/execution-providers/community-maintained/CANN-ExecutionProvider.html>
- vLLM-Ascend on 310P: <https://docs.vllm.ai/projects/ascend/en/latest/tutorials/hardwares/310p.html>
- MindSpore Ascend 310 inference: <https://www.mindspore.cn/tutorial/inference/en/r1.2/multi_platform_inference_ascend_310.html>
- ONNX issue #11477 (Ascend backend): <https://github.com/microsoft/onnxruntime/issues/11477>

### 存储 / 性能基准
- SPDK 性能报告: <https://spdk.io/doc/performance_reports.html>
- SPDK vs io_uring benchmark (10M IOPS): <https://lucioduran.com/blog/spdk-nvme-storage-performance-optimization>
- High-Performance I/O Benchmark (libaio/io_uring/SPDK 对比): <https://asynciobench.github.io/>
- Linux Kernel Internals tuning-storage: <https://kernel-internals.org/io/tuning-storage/>
- IBM iobench: <https://github.com/IBM/iobench>

### Embedding 吞吐基准
- GigaGPU BGE-M3 throughput by GPU: <https://gigagpu.com/embedding-throughput-benchmark-gigagpu/>
- GigaGPU GPU vs CPU embedding speed: <https://gigagpu.com/embedding-speed-gpu-vs-cpu>
- GigaGPU BGE-M3 self-hosted: <https://gigagpu.com/bge-m3-self-hosted-on-gpu>

### 竞品
- NVIDIA DDN A3I reference architecture: <https://www.nvidia.com/en-in/data-center/resources/ddn-a3i-reference-architecture/>
- DDN H100 SuperPOD PDF: <https://www.ddn.com/wp-content/uploads/2024/08/ddn-nvidia-h100-superpod-reference-architecture.pdf>
- NVIDIA DGX SuperPOD storage architecture (H100): <https://docs.nvidia.com/dgx-superpod/reference-architecture-scalable-infrastructure-h100/latest/storage-architecture.html>
- Hammerspace on NVIDIA AIDP: <https://www.storagenewsletter.com/2025/10/30/nvidia-gtc-dc-2025-hammerspace-unveils-ai-data-platform-solution-to-transform-enterprise-data-for-the-agentic-ai-anywhere-era>
- Cloudian AIDP launch: <https://cloudian.com/press/cloudian-launches-aidp-ai-platform/>
- Pinecone pricing: <https://www.pinecone.io/pricing/>
- Pinecone serverless analysis: <https://www.techtarget.com/searchdatamanagement/news/366566676/Pinecone-unveils-serverless-vector-database-targets-costs>
- Vector DB comparison: <https://tensorblue.com/blog/vector-database-comparison-pinecone-weaviate-qdrant-milvus-2025>

### 相关上轮产出
- 上轮报告 (HTML): `/mnt/c/Users/calvin/Desktop/storage-for-ai-data-platform.html` (DIFF-1 章节 §5.2)
- hacms 预览: `previews/2026-07-03-storage-for-ai-data-platform.html` (commit fa00924)
- Agent4 调研数据: `agent4-data-platform.json`

---

**END OF DOCUMENT**

*下一步*: 等用户评审, 若同意 → 进入 PoC 实施 (附录 A 时间表). 若有疑问 → 优先澄清 §3 软件栈选型 (CANN EP vs torch_npu) 和 §4 数据集 (BeIR subset vs MS MARCO v2).
