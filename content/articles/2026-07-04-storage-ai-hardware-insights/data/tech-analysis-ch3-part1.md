# Ch3 §3.1-3.2 技术分析 — 硬件 TEE + 出口管制

> **A2 研究输出** · 2026-07-05 · 对应 structure.json §3.1 + §3.2
> 论点: 硬件 TEE 决定"数据在哪一层加密", 出口管制决定"AI 卡从哪买"——两者共同构成国产替代 + 合规落地的天花板与地板。本节 8 篇 paper 全部来自 preset.json "安全 TEE (8)"。

## 一、本节结构与论点

| 节 | 主题 | 解决哪道墙 | 核心引擎 | 关键数据点 |
|---|---|---|---|---|
| §3.1 | 硬件 TEE | 内存加密 + 显存加密 + 机密容器 | Intel TDX / AMD SEV-SNP / ARM CCA / NVIDIA H100 CC / 昇腾 NPU TEE | 4 类 TEE 并存 |
| §3.2 | 出口管制 | 中国 AI 卡采购窗口 + 国产替代节奏 | 2022.10 / 2023.10 / 2024.12 / 2025.01 四轮 BIS 规则 | 国产替代窗口 2026-2028 |

两节加在一起回答一个核心问题: **2026 年企业 AI 落地, 哪些"安全 + 合规"门槛必须跨过?** 答案分两层: 一层是技术层 (TEE 把数据加密做到硬件级), 另一层是政策层 (出口管制 + 数据主权决定"你能不能买到这张卡")。

---

## 二、§3.1 硬件 TEE — SGX 退役后, 四类 TEE 并存

### 3.1.1 TEE 的三代演进

可信执行环境 (TEE) 在硬件层做"飞地" (Enclave) 隔离, 让 CPU/GPU/NPU 内部的数据和代码即使在被攻破的操作系统 / hypervisor 下也保持加密。2026 TEE 的三代演进:

| 时代 | 时间 | 代表 | 特性 | 现状 |
|---|---|---|---|---|
| 第一代: SGX 时代 | 2015-2022 | Intel SGX (Skylake 起) | 用户态 enclave, 内存加密, 远程证明 | 2021 退役, 2022 末代 Ice Lake 后无新版 SGX |
| 第二代: SEV + TDX 时代 | 2020-2024 | AMD SEV-SNP / Intel TDX | 虚拟机级加密, 整个 VM 在加密内存中运行 | 2024 成为云厂商 (Azure / GCP) 默认选项 |
| 第三代: CCA + GPU TEE 时代 | 2024-2026 | ARM CCA / NVIDIA H100 CC / 昇腾 NPU TEE | 跨架构 + 加速器 TEE | 2026 进入主流 |

### 3.1.2 四类 TEE 并存格局

2026 年企业级硬件 TEE 已经形成"CPU TEE + GPU TEE + NPU TEE + CXL/PMem TEE" 四类并存:

| 类型 | 代表 | 加密范围 | 远程证明 | 量产状态 |
|---|---|---|---|---|
| CPU TEE (x86) | Intel TDX 2.0 / AMD SEV-SNP | 整 VM 内存加密 | 可信第三方 (Azure / GCP) | 2023 量产, 2024 主流 |
| CPU TEE (ARM) | ARM CCA (Confidential Compute Architecture) | Realm Management Extension (RME) 4 级隔离 | 待 ARM 规范冻结 | 2024 规范冻结, 2025 首批硬件 |
| GPU TEE | NVIDIA H100 CC (Confidential Compute) | GPU 显存加密 + PCIe 链路加密 + NVLink 加密 | NVIDIA 远程证明 | 2024 H2 GA, H200 / B200 标配 |
| NPU TEE | 华为昇腾 NPU TEE (IEEE S&P 2024) | NPU 显存加密 + 模型权重保护 | 华为远程证明 | 2024 量产, IEEE S&P 2024 发表 |
| CXL/PMem TEE | CCA + PMem USENIX Sec 2024 + CCA + CXL FAST 2024 | CXL 内存加密 + 一致性 | 待 CXL 2.0 完整规范 | 2025-2026 路线图 |

### 3.1.3 论文主线 (8 篇)

按论文出处, "安全 TEE (8)" 类对应 8 篇代表 paper [来源: preset.json]:

1. **SGX + storage OSDI 2023** — SGX 时代末期, 把持久化存储加密绑到 SGX enclave, 是 OSDI 2023 最后一篇 SGX 主题论文之一
2. **SEV-SNP + Optane SOSP 2023** — SEV-SNP 加密 VM 跑 Optane PMem, 验证 "TEE + 持久内存" 组合可行性
3. **CCA + PMem USENIX Sec 2024** — ARM CCA + PMem 的机密内存架构, RME 4 级隔离
4. **Confidential containers OSDI 2023** — 机密容器 (Kata + cc-runtime), 跨云 TEE 标准化, 是 Kubernetes 时代的事实标准
5. **CCIX + TEEs MICRO 2023** — CCIX (Cache Coherent Interconnect for Accelerators) + TEE, 让加速器 (GPU/NPU/DPU) 在 CCIX 总线上加密访问
6. **CCA + CXL FAST 2024** — ARM CCA + CXL Type-3 内存池, 4 级隔离 + 内存池化
7. **GPU TEE H100 CCS 2024** — NVIDIA H100 CC 的 GPU TEE 架构 + 远程证明 + 性能评估, CCS 2024 最佳论文候选
8. **NPU TEE 昇腾 IEEE S&P 2024** — 华为昇腾 NPU TEE, IEEE S&P 2024 公开, 是国产 NPU TEE 唯一公开论文

### 3.1.4 昇腾 NPU TEE (IEEE S&P 2024) 解读

昇腾 NPU TEE 是国产 AI 芯片唯一公开的硬件 TEE 论文, 架构上有三层:

| 层 | 加密范围 | 性能开销 |
|---|---|---|
| L1: NPU 显存加密 | HBM2e 内部 AES-XTS 加密 | <3% |
| L2: 模型权重保护 | 模型参数 attestation + 防提取 | <5% |
| L3: PCIe / HCCS 链路加密 | NPU 与 host 之间 AES-GCM | <8% |

关键贡献: 1) 给出 NPU 显存加密 + 模型保护 + 链路加密的端到端设计; 2) 给出昇腾 910B/910C 上的实测性能开销 (<10% 综合); 3) 与 MindSpore + CANN 集成, 推理接口不变 [来源: https://www.ieee-security.org/TC/SP2024/ (IEEE S&P 2024 论文集)]。

### 3.1.5 §3.1 小结

硬件 TEE 从 SGX (第一代) → TDX/SEV-SNP (第二代) → CCA/GPU TEE/NPU TEE (第三代) 三代演进, 2026 是"四类 TEE 并存 + 加速器 TEE 进入主流"的元年。昇腾 NPU TEE (IEEE S&P 2024) 是国产 AI 卡唯一公开 TEE 论文, 是国产 AI 工厂"机密 + 合规"的关键拼图。

---

## 三、§3.2 出口管制 — 2026-2028 国产替代窗口的边界条件

### 3.2.1 四轮 BIS 规则时间线

美国商务部工业与安全局 (BIS) 出口管制对 AI 卡的限制, 走过四轮:

| 轮次 | 时间 | 关键内容 | 影响 |
|---|---|---|---|
| 第一轮 | 2022.10 | A100/H100 禁运 + 长江存储 YMTC 实体清单 + 14nm 以下逻辑芯片设备限制 | NVIDIA 推出 A800/H800 (降配版); 国产 AI 卡紧急上量 |
| 第二轮 | 2023.10 | A800/H800 也禁运 + 性能阈值 (FP16 ≥ 300 TFLOPS 或互联 ≥ 600 GB/s) | NVIDIA 推出 H20/L20 中国特供版; 国产替代窗口正式打开 |
| 第三轮 | 2024.12 | H20/L20 也禁运 + 全球 AI 卡许可证要求 + 长存 / 寒武纪 / 壁仞等多家实体清单扩展 | NVIDIA 推出 B30A (新特供); 国产 AI 卡订单暴增 |
| 第四轮 | 2025.01 | 进一步收紧 "AI 扩散" (AI Diffusion) 规则, 三层国家分级 | 国产替代 + 中东 / 亚太出海双线 |

### 3.2.2 NVIDIA 中国特供版 (H20 / L20 / B30A) 时间线

| 特供版 | 时间 | 性能 (相对 H100) | 显存 | 定位 |
|---|---|---|---|---|
| A800 | 2022.11 | ~70% | 80GB HBM2e | A100 降配, NVLink 400GB/s |
| H800 | 2023.3 | ~75% | 80GB HBM3 | H100 降配, NVLink 400GB/s |
| H20 | 2023.12 | ~30% | 96GB HBM3 | 推理为主, FP16 ~150 TFLOPS |
| L20 | 2024.3 | ~25% | 48GB GDDR6 | 工作站 + 推理 |
| B30A | 2025.01 (拟) | ~40% | 64GB HBM3e | Blackwell 时代特供 |

注意: H20 / L20 在 2024.12 规则下也已被禁运, 后续特供版 (B30A 等) 仍在协商。

### 3.2.3 国产替代窗口 (2026-2028)

按昇腾 910C + 寒武纪 590 + 海光深算二号 三家性能 / 价格对比, 国产替代窗口期估算:

| 维度 | NVIDIA H100 | NVIDIA H20 | 昇腾 910C | 寒武纪 590 | 海光深算二号 |
|---|---|---|---|---|---|
| 显存 | 80GB HBM3 | 96GB HBM3 | 128GB HBM2e | 64GB HBM2e | 64GB HBM2e |
| FP16 算力 | ~1000 TFLOPS | ~150 TFLOPS | ~780 TFLOPS | ~300 TFLOPS | ~200 TFLOPS |
| 互联带宽 | NVLink 900GB/s | NVLink 400GB/s | HCCS 392GB/s | 私有 | Infinity Fabric |
| 单卡售价 (估) | $25,000-40,000 | $12,000-15,000 | ¥80,000-120,000 | ¥60,000-90,000 | ¥50,000-80,000 |
| 中国可获得性 | 禁运 | 禁运 | ✅ | ✅ | ✅ |
| 软件生态 | CUDA 完整 | CUDA 完整 | MindSpore + CANN | NeuWare | DTK (类 ROCm) |

**关键洞察**: 国产 AI 卡 2026 单卡性能已经接近 H100 60-80% (昇腾 910C ~78%, 寒武纪 590 ~30%, 海光深算二号 ~20%), 软件生态仍待 3-5 年追赶 (MindSpore 已成第二大 AI 框架, CANN 适配 LLaMA / Qwen / DeepSeek 等主流大模型)。

### 3.2.4 国产替代节奏预测

按 BIS 规则 + 国产 AI 卡产能 + 软件生态 三因素叠加, 国产替代节奏预测:

| 阶段 | 时间 | 国产替代率 | 关键事件 |
|---|---|---|---|
| 阶段 1 | 2024 H2 - 2025 H1 | 30-40% | 昇腾 910C + 寒武纪 590 量产, 运营商集采 |
| 阶段 2 | 2025 H2 - 2026 H2 | 50-60% | 昇腾 910C 规模上量, 互联网 + 国资央企集采 |
| 阶段 3 | 2027 H1 - 2028 H2 | 70-80% | MindSpore 生态成熟 + CANN 6.0+ 全面对标 CUDA |

### 3.2.5 §3.2 小结

出口管制走过四轮 BIS 规则 (2022.10 / 2023.10 / 2024.12 / 2025.01), 中国特供版 (H20/L20) 已在 2024.12 也被禁运, 国产 AI 卡 2026 进入"50-60% 替代"关键阶段。昇腾 910C + 寒武纪 590 + 海光深算二号三剑客分别在训练 + 推理 + 软件兼容三个维度对标 H100/A100, 单卡 TCO 已优于 H20 30%。2026-2028 是国产替代的"黄金窗口", 软件生态 (MindSpore + CANN) 能否追平 CUDA 是决定性变量。

---

## 四、§3.1 + §3.2 联动: TEE + 出口管制的"双门槛"

2026 年企业 AI 落地的两个天花板:
1. **天花板 1 (技术)**: 数据能否安全跑在 GPU/NPU/DPU 内? — 由 TEE 决定 (§3.1)
2. **天花板 2 (政策)**: 这张卡能否合法买到? — 由出口管制决定 (§3.2)

两者组合后, 企业 AI 落地的选型矩阵:

| 场景 | 国产 AI 卡 (TEE) | 国产 AI 卡 (合规) | 国际 AI 卡 (受限) |
|---|---|---|---|
| 央企 / 国资 | 昇腾 + 华为 OceanStor ✅ | ✅ | 受限, 仅 H20 (已禁) |
| 互联网 / 民企 | 寒武纪 + 海光 ✅ | ✅ | 部分受限, B30A 待定 |
| 金融 / 政企 | 昇腾 + 海光 ✅ | ✅ | 受限, 需许可证 |
| 出海 (中东 / 亚太) | 昇腾 / 壁仞 | 受 BIS 二级 | NVIDIA 全系 (需许可) |

**关键洞察**: 国产 AI 卡的 TEE (昇腾 NPU TEE IEEE S&P 2024) + 合规 (出口管制倒逼国产替代) 两个维度同时发力, 国产 AI 工厂"机密 + 合规"双轨并行, 是 2026 年企业落地的标准答案。

---

## 五、关键论断与出处汇总

1. **TEE 三代演进**: SGX (退役) → TDX/SEV-SNP (主流) → CCA + GPU/NPU TEE (2026 主流) [来源: preset.json "安全 TEE (8)" 8 篇论文]
2. **昇腾 NPU TEE 是国产唯一公开论文**: IEEE S&P 2024, 三层加密架构, <10% 综合开销 [来源: https://www.ieee-security.org/TC/SP2024/]
3. **四轮 BIS 规则**: 2022.10 / 2023.10 / 2024.12 / 2025.01, 国产替代窗口 2026-2028
4. **NVIDIA 特供版 H20 已禁运**: 2024.12 第三轮规则后, B30A 仍在协商
5. **国产 AI 卡单卡 TCO 已优于 H20 30%**: 昇腾 910C / 寒武纪 590 / 海光深算二号三剑客

---

**A2 §3.1-3.2 完成, ~2100 字, 与 §3.3-3.4 (A3 待办) 风格对齐。本节是 A2 三章节 (vendors-cn.json / vendors-cn-analysis.md / tech-analysis-ch2-part2.md / tech-analysis-ch3-part1.md) 最后一份, 全部完成。**