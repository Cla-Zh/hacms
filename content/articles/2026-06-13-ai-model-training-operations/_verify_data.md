# 数据核查报告

**文章：** AI模型训练与MLOps全流程产业洞察报告 2026
**核查日期：** 2026-06-13
**核查方法：** 网络搜索交叉验证（Exa AI搜索 + 官方页面核对）

---

## 一、重点数据核查

| 状态 | 数据内容 | 验证结果 |
|-----|---------|---------|
| ✅ | NVIDIA DGX H200：8×H200 GPU、1,128GB总显存、32 petaFLOPS FP8算力 | 官方规格页完全确认，各项指标与[nvidia.com官方数据](https://www.nvidia.com/en-us/data-center/dgx-h200/)一致 |
| ⚠️ | Meta 35,000+ H100 GPU集群 | 数据量级属实，但具体数字需注意上下文。Meta在2024年1月宣布到年底累计部署350,000块H100的计划；同期已部署2个24,576 GPU集群（共49,152块）。35,000+可能是早期部署阶段数字，实际部署规模已远大于此 |
| ⚠️ | Tesla Dojo 1.8 EFLOPS算力 | 数字本身可溯源（Karpathy在2021 CVPR上公布），但存在**系统混淆**：1.8 EFLOPS是当时基于720节点×8×A100的GPU集群算力，是Dojo的前身而非Dojo本体。真正的Dojo D1芯片系统设计为每个ExaPOD约1.1 EFLOPS（BFP16），Tesla AI Day 2023也未单独确认1.8 EFLOPS归于Dojo |
| ✅ | PaLM 540B训练用6144块TPU v4 | 论文原文确认，来自[arXiv:2204.02311](https://arxiv.org/abs/2204.02311)（PaLM论文）及[JMLR v24/22-1144](https://jmlr.org/papers/v24/22-1144.html) |
| ✅ | GPT-3训练成本约$4-8M（现估算值） | $4.6M来自Lambda Labs基于V100的公开估算，CNBC报道引述Forrester分析师称"over $4 million"，与文章范围吻合。但注意：原始GPT-3（2020年）训练成本约$4.6M；随硬件效率提升，2026年同等规模训练成本会更低 |
| ⚠️ | Meta推荐系统500亿次/天请求 | "hundreds of billions"在Meta论文中有记载，但500亿（50×10^10）是精确表述，而官方来源仅用模糊表述"数百亿"，无法精确确认 |
| ⚠️ | Meta推荐系统Embedding存储超1PB | 论文提及"trillion-parameter scale"（万亿参数规模）且Meta新系统接近TB级embedding，但原始"_research_agent3.md"中"超过1PB"的精确数字未找到直接对应公开来源 |
| ✅ | Meta推荐系统1000+个在线模型 | 来自Meta工程博客[*Journey to 1000 models*](https://engineering.fb.com/2025/05/21/production-engineering/journey-to-1000-models-scaling-instagrams-recommendation-system/)（2025年5月），明确说明Instagram推荐系统已扩展至1000+ ML模型 |

---

## 二、其他数据核查

| 状态 | 数据内容 | 验证结果 |
|-----|---------|---------|
| ✅ | DGX H200系统功耗~10.2kW | 官方规格页确认 |
| ✅ | DGX H200：双路Intel Xeon Platinum 8480C（112核）、2TB系统内存 | 官方规格页确认 |
| ✅ | DGX H200：ConnectX-7 400Gb/s网络 | 官方规格页确认 |
| ✅ | Meta FAIR集群网络：InfiniBand 400Gb/s | Meta工程博客确认 |
| ✅ | PaLM 540B训练数据：7800亿tokens | PaLM论文原文确认 |
| ✅ | Tesla Autopilot BEV+Transformer推理延迟<10ms | Tesla AI Day 2022数据， AnandTech分析佐证 |
| ✅ | Google TPU v5e BF16算力：131 TFLOPS；v5p：459 TFLOPS | Google Cloud TPU官方文档 |
| ✅ | GPT-3 175B参数、3000亿tokens训练数据 | OpenAI GPT-3论文（arXiv:2005.14165）确认 |
| ⚠️ | GPT-3 3.6M A100 GPU小时估算 | 多个来源（Lambda Labs、Epoch AI）引用，但OpenAI从未官方披露精确GPU小时数，属行业估算而非官方数据 |
| ⚠️ | Anthropic团队约2,500-5,000人 | SaaStr（2026年4月）报道约5,000人，范围存在不确定性 |
| ✅ | Scale AI估值$14B+ | getperspective.ai（2026年5月）确认 |
| ⚠️ | RLHF/SFT/DPO具体成本 | 各厂商均未公开精确数字，属行业估算 |

---

## 三、核查结论

**高度可信数据（可直接引用）：**
- DGX H200全部规格（官方来源）
- PaLM 540B训练硬件配置（论文原文）
- Instagram 1000+推荐模型（Meta工程博客）
- GPT-3训练成本$4-6M量级（多来源估算一致）
- Meta大规模H100部署（350,000计划已公开宣布）

**需注意表述精确性的数据：**
- Tesla Dojo "1.8 EFLOPS"应注明来源为2021年前身集群，而非Dojo本体
- Meta 35,000+ H100数字应说明为早期部署阶段，实际规模已更大
- 推荐系统500亿次/天请求建议改为"数百亿次"以规避精确性争议
- Embedding存储1PB建议加注"据公开信息"或提供来源说明

---

**报告生成时间：** 2026-06-13
**核查人：** Agent-B（数据核查子任务）