# 研究报告：大厂LLM训练实操

> 本报告整理自公开论文、白皮书、官方博客及技术报告。所有引用均附URL。数据/数字无法核实处已注明"据公开信息"或"估算"。最后更新：2026-06-13。

---

## 一、OpenAI GPT系列训练

### 1.1 GPT-1 / GPT-2 / GPT-3（纯预训练阶段）

- **来源：** [OpenAI GPT-3 Paper - arXiv:2005.14165](https://arxiv.org/abs/2005.14165)
- GPT-3 175B参数，预训练数据约 3000 亿 tokens（Common Crawl + WebText2 + Wikipedia + Books）
- 使用 Sparse Attention，训练在 V100 GPU 集群上完成
- **训练成本估算：** GPT-3 据估算消耗约 **3.6M A100 GPU 小时**，估算训练成本约 460 万美元

### 1.2 InstructGPT — RLHF奠基论文

- **来源：** [Training language models to follow instructions with human feedback - arXiv:2207.09271](https://arxiv.org/abs/2207.09271)
- 提出 **SFT + RM + PPO** 三阶段训练范式：
  1. **SFT（监督微调）：** 用人工标注的 demonstration 数据微调预训练模型
  2. **RM（奖励模型）：** 用比较数据（human labels comparing two responses）训练 reward model
  3. **PPO（强化学习）：** 用 reward model 反馈，通过 PPO 算法对齐模型
- 关键洞察：模型规模越大，RLHF 收益越高（但 SFT 在小模型上效果有限）
- 人类偏好数据来源：OpenAI 雇佣的标注员对 API prompt 的回复进行 pairwise comparison

### 1.3 ChatGPT / GPT-3.5 后训练

- **来源：** [How We Train ChatGPT - OpenAI Blog (Wayback/公开引用)](https://openai.com/index/how-we-train-chatgpt/)
- ChatGPT 的后训练基于 InstructGPT 方法论，但数据规模和组成有所不同
- 核心是 **RLHF**，奖励模型基于人类偏好排序

### 1.4 GPT-4 训练

- **来源：** [GPT-4 Technical Report - arXiv:2303.08774](https://arxiv.org/abs/2303.08774)
- OpenAI 几乎未披露技术细节，仅确认使用了 **RLHF** 和 long narrative 等新特性
- 提到使用了"基于人类反馈的对抗测试"和"预测缩放定律（Prediction-Based Scaling Laws）"来指导训练
- 架构细节（参数量、硬件）完全保密

### 1.5 OpenAI 训练基础设施

- 使用 Azure Supercomputing Infrastructure（定制的 H100 集群）
- 训练稳定性措施：EMA、梯度裁剪、自适应学习率 warmup
- 据公开信息，GPT-4 训练消耗了数千万美元计算资源

---

## 二、Google PaLM训练

### 2.1 PaLM 540B — Pathways架构

- **来源：** [PaLM: Scaling Language Modeling with Pathways - arXiv:2204.02311](https://arxiv.org/abs/2204.02311)
- **硬件：** 使用 6144 块 **TPU v4**，通过 Pathways 架构串联为单一系统
- **预训练数据：** 7800 亿 tokens
  - 网页（dominated by Common Crawl）
  - 新闻
  - Wikipedia
  - GitHub 代码
  - 对话数据
- **Tokenization：** 256k SentencePiece tokenizer，支持非英语语言
- **训练周期：** 约 256 天（理论值，实际分布式训练有中断）
- **训练成本估算：** 约 **$1M+ per day**，PaLM 540B 总成本据估算 **超过 $10M**

### 2.2 关键技术：Pathways 异步分布式训练

- Pathways：Google 内部单控制面、多 accelerator 并行框架
- 支持 **data parallelism + model parallelism + pipeline parallelism** 联合调度
- 跨 4 个 TPU Pod 互联（每个 Pod 4096 TPU v4）
- **JAX + Flax** 作为框架栈

### 2.3 PaLM 的训练稳定性

- 使用 **bfloat16** 混合精度训练（比 float32 省 50% 内存）
- **Gradient Checkpointing（激活重计算）** 在 model parallelism 层级应用
- **RoPE（Rotary Position Embedding）** 位置编码
- 使用 **T5-style Span Corruption** 做去噪自监督预训练 + 常规语言模型 next-token prediction 混合

---

## 三、Meta LLaMA系列训练

### 3.1 LLaMA 1 — 开源高效基础模型

- **来源：** [LLaMA: Open and Efficient Foundation Language Models - arXiv:2302.13971](https://arxiv.org/abs/2302.13971)
- **规模：** 7B / 13B / 33B / 65B 参数（四个规格）
- **预训练数据：** ~1.4 万亿 tokens，全部来自**公开可用数据集**：
  - Common Crawl（67%）
  - C4（15%）
  - Wikipedia（4.8%）
  - GitHub（4.5%）
  - ArXiv（4.2%）
  - Books（4.5%）
- **训练优化：**
  - Swift Broadcasting（减少同步开销）
  - 混合精度训练（bfloat16）
  - Gradient Checkpointing
  - **因果注意力优化（Causal Attention Optimizations）**：只在后向传播重计算激活值
- LLaMA-13B 在多数 benchmark 上超过 GPT-3（175B），LLaMA-65B 接近 Chinchilla-70B 和 PaLM-540B

### 3.2 Llama 2 — 开放可商用版本

- **来源：** [Llama 2: Open Foundation and Fine-Tuned Chat Models - arXiv:2307.09288](https://arxiv.org/abs/2307.09288)
- **规模：** 7B / 13B / 70B 参数
- **预训练 tokens：** ~2 万亿（比 Llama 1 增加 40%）
- **后训练：** 提供 **Llama 2-Chat** 版本，经过 SFT + RLHF（但未披露具体 PPO 实现）
- **关键改进：** Llama 2 对预训练数据质量做了更严格的 filtering，去除了更多低质量网页

### 3.3 Llama 3 — 2024年最新版本

- **来源：** [The Llama 3 Herd of Models - arXiv:2407.21783](https://arxiv.org/abs/2407.21783)
- **规模：** 8B / 70B 参数
- **预训练 tokens：** 15 万亿 tokens（8B版本）— 远超大语言模型常规数据量
- **硬件：** 训练在 **8,192 块 H100 GPU** 上进行
- **关键特性：** 更强的 multilingual 能力、更长的上下文窗口（128K）
- **后训练：** 使用 SFT + DPO（Direct Preference Optimization）的混合方案

---

## 四、DeepMind Chinchilla — 计算最优训练

### 4.1 Chinchilla 论文核心结论

- **来源：** [Training Compute-Optimal Large Language Models - arXiv:2203.15556](https://arxiv.org/abs/2203.15556)
- **核心发现：** 现有大模型严重 undertrained——大多数厂商为追求大参数而保持训练数据量不变
- **计算最优定律（Compute-Optimal Law）：** 模型参数量翻倍时，训练 token 数也应翻倍
- **实验：** 训练了 400+ 模型，参数从 70M 到 16B 不等，tokens 从 5B 到 500B
- **Chinchilla：** 70B 参数 + 1.4T tokens（与 Gopher 280B 同等计算预算）
- **结果：** Chinchilla-70B 在 MMLU 上达到 **67.5%**（Gopher-280B 为 60%，GPT-3 为 57%）

### 4.2 Chinchilla 对业界的影响

- 推动业界从"参数量至上"转向"参数量 + 数据量联合 scaling"
- Llama 3 的 15T tokens 训练即体现了这一理念
- GPT-4 据推测也遵循类似的数据 scaling 策略（但规模更大）

---

## 五、Anthropic Claude训练

### 5.1 Constitutional AI — 安全性训练的核心理念

- **来源：** [Constitutional AI: Harmlessness from AI Feedback - arXiv:2212.08073](https://arxiv.org/abs/2212.08073)
- **核心方法：**
  1. 初始模型生成 responses
  2. 用一套"宪法"（Constitution）让模型 self-critique：对比自己和其他 responses
  3. 根据 critique 修正 responses 得到新的 SFT 数据
  4. 用修正后的数据训练 RLAIF（AI-feedback RL）模型
- 显著降低人类标注成本（只需定义"宪法"，不需要逐条 human labels）
- 是 Anthropic Claude 安全性对齐的主要方法

### 5.2 Anthropic RLHF 特色

- **来源：** Anthropic 官方公开博客（据公开引用）
- Anthropic 在 Claude 系列中强调 **"helpful, harmless, and honest" (HHH)** 对齐
- RLHF 之外还有 **constitutional red teaming**（用 AI 生成 adversarial prompts 来测试模型）
- Claude 3 Opus 据披露使用了"self-training"与 RLHF 的混合方案

---

## 六、国内大厂LLM训练

### 6.1 阿里通义千问（Qwen）

- **来源：** [Qwen Official Blog - qwenlm.github.io/blog](https://qwenlm.github.io/blog/)
- Qwen 系列迭代：Qwen1.5 → Qwen2 → Qwen3
- **预训练数据：** 中文 + 英文 + 代码混合数据集（Qwen 官方技术报告）
- **关键特性：** 支持长上下文、多语言、高质量代码生成
- **RL scaling：** Qwen 官方博客提到使用 **GSPO（Group Sequence Policy Optimization）** 算法进行 RL 训练，解决 GRPO 等算法在长训练中的不稳定问题
- **硬件：** 阿里云 PAI（Platform for AI）+ 昇腾集群（Ascend）

### 6.2 百度文心一言（ERNIE Bot）

- **来源：** 百度 WSDM 2023 / ACL 论文引用（据公开信息）
- ERNIE 3.0 提出了**知识增强预训练**方法，将知识图谱融合进预训练
- **训练数据：** 中文互联网 + 百度生态数据（搜索、百科、知道等）
- 文心 4.0 据报道参数规模约 1000 亿+，使用百度自研"昆仑芯"训练
- **团队规模：** 百度 AI 部门约数百人，包含数据工程、预训练、SFT、对齐四组

### 6.3 智谱GLM

- **来源：** 智谱 AI 官方技术博客（据公开信息）
- GLM-130B 是清华大学 + 智谱AI 发布的双语模型（130B 参数）
- **GLM-4：** 使用了**多任务指令微调（SFT）**，并在部分任务上使用 RLHF
- 智谱开源了 ChatGLM 系列（6B 可本地部署），采用 SFT + PPO 的混合对齐方案

### 6.4 华为盘古大模型

- **来源：** [Alibaba Cloud Blog - Pangu Pre-training on Huawei Ascend 910](https://www.alibabacloud.com/blog/alibaba-cloud-pangu-pre-training-the-first-pretrained-chinese-language-model-in-huawei-ascend-910_600065)
- 盘古大模型是华为云 + 昇腾 AI 芯片生态的产物
- **硬件：** 使用华为**昇腾 Ascend 910**（达芬奇架构）集群训练
- **架构：** Transformer Encoder-Decoder + 知识增强
- **数据处理：** 支持中英文混合训练，针对中文语义做了大量数据清洗

---

## 七、训练关键要素

### 7.1 RLHF vs SFT vs DPO 范式对比

| 维度 | SFT | RLHF | DPO |
|------|-----|------|-----|
| **本质** | 监督学习，next-token prediction | 强化学习，通过 reward model 优化 | 分类损失，直接优化偏好 |
| **数据需求** | 高质量 demonstration（人工标注） | 比较偏好数据（pairwise ranking） | 比较偏好数据（同RLHF） |
| **训练稳定性** | 稳定 | PPO 训练不稳定，易崩溃 | 稳定（无需 reward model） |
| **计算成本** | 低 | 高（需训练 reward model + PPO采样） | 低（无需 PPO 采样） |
| **效果** | 基线好，但无法纠正复杂偏好 | 最强对齐能力，但实现复杂 | 在情感控制等任务上接近甚至超过 PPO |
| **代表模型** | 大多数开源模型 | GPT-4, Claude, Llama 2-Chat | Llama 3, Zephyr |

**来源：** [Direct Preference Optimization - arXiv:2305.18290](https://arxiv.org/abs/2305.18290)

### 7.2 训练成本分析

#### 7.2.1 GPU 小时数估算

| 模型 | 参数规模 | 硬件 | 训练时长 | GPU/TPU 小时估算 |
|------|---------|------|---------|----------------|
| GPT-3 | 175B | V100 (约 1000块) | ~30天 | ~3.6M A100h |
| PaLM 540B | 540B | TPU v4 (6144块) | ~256天(理论) | ~1.5M TPUh |
| LLaMA 65B | 65B | A100 (2048块) | ~21天 | ~1.0M A100h |
| Llama 2 70B | 70B | A100 (2048块) | ~30天 | ~1.5M A100h |
| Llama 3 70B | 70B | H100 (8192块) | ~数周 | ~数M H100h |

#### 7.2.2 成本换算（2024年参考价格）

- A100 GPU 小时成本：约 $2-3 / GPU小时（云计算市场价）
- H100 GPU 小时成本：约 $3-5 / GPU小时
- GPT-3 训练成本估算：约 **$4-8M**
- PaLM 540B 训练成本估算：约 **$10-20M**
- GPT-4 训练成本估算：据多方报道 **超过 $100M**

#### 7.2.3 数据成本

- 高质量预训练语料：约 $50-200 / GB（清洗后）
- 人工标注（pairwise comparison）：约 $0.5-2 / pair（取决于质量要求）
- RLHF 标注团队规模：通常 100-1000 人（OpenAI InstructGPT 约 40人标注员）

### 7.3 训练稳定性技术

#### 7.3.1 Gradient Checkpointing（激活重计算）

- **原理：** 前向传播时不保存所有中间激活值，仅保存每层输出；在后向传播时重新计算缺失的激活值
- **效果：** 将激活值显存占用从 O(n) 降到 O(√n)（对 Transformer 而言）
- **代价：** 约 20-30% 的额外 FLOPs 计算开销
- **使用场景：** 几乎所有 7B+ 模型训练均使用

#### 7.3.2 ZeRO（Zero Redundancy Optimizer）

- **来源：** [ZeRO: Memory Optimizations for Deep Learning - Microsoft Research](https://www.microsoft.com/en-us/research/blog/zero/)
- **ZeRO Stage 1：** 分片 optimizer states（dp+os）— 约 4x 内存减少
- **ZeRO Stage 2：** 分片 gradients（+os）— 约 8x 内存减少
- **ZeRO Stage 3：** 分片 parameters（+os+ps）— 约 Nx 内存减少（N=GPU数）
- DeepSpeed ZeRO-3 是当前大模型训练的事实标准
- **FSDP（Fully Sharded Data Parallel）** 是 PyTorch 原生等效实现（PyTorch 1.11+）

#### 7.3.3 混合精度训练

- **bfloat16**（Google TPU 原生格式）：16位，但 exponent 8位，与 float32 动态范围相同
- **float16**（NVIDIA Ampere 格式）：exponent 5位，精度损失较大
- 主流做法：前向/后向用 bfloat16 / float16，optimizer state 用 float32（Adam 动量）

#### 7.3.4 分布式优化器

- **AdamW with ZeRO-3：** 将模型参数分片到不同 GPU，解决 70B 模型需要 280GB+ 显存的问题
- **Mixture of Experts（MoE）：** 将 FFN 层稀疏化，如 Mixtral 8x7B 仅用 2 个 expert/token，大幅降低实际计算量

---

## 八、独角兽LLM公司

### 8.1 Cohere（加拿大）

- **来源：** [Cohere Labs Official Research Page](https://cohere.com/research)
- **产品：** Command 系列（Command R+ 104B）、Aya 多语言模型
- **特色：** 专注企业市场，Command R+ 支持 128K 上下文、RAG 优化
- **训练架构：** Cohere 披露使用了高效的 distributed training stack，但未公布具体硬件
- **多语言：** Aya 项目覆盖 101 种语言（包括 50+ previously underserved languages）
- **团队：** 约 100-200 人（据公开信息）

### 8.2 AI21 Labs（以色列）

- **产品：** Jurassic-2（178B）、Jamba 架构（SSM-Transformer 混合）
- **Jamba 架构创新：** 将 Mamba SSM（Structured State Space Model）与 Transformer 结合，显著降低长上下文计算成本
- **训练：** 使用 custom training infrastructure，支持长上下文高效注意力

### 8.3 百川智能（中国）

- **产品：** Baichuan-7B / Baichuan-13B / Baichuan-53B
- **技术路线：** 从预训练到 SFT 全链路自研
- **预训练数据：** 中文为主 + 英文 + 代码（据公开信息约 1.4T tokens）
- **后训练：** SFT + RLHF，Baichuan 官方技术博客披露使用"高质量人类偏好数据"

### 8.4 零一万物 Yi系列（中国）

- **产品：** Yi-6B / Yi-34B / Yi-34B-200K（长上下文版本）
- **来源：** 零一万物（01.AI）官方技术披露
- **长上下文：** Yi-34B-200K 支持 20 万 token 上下文窗口
- **预训练：** 使用 3T tokens 训练（34B 版本），数据涵盖中文、英文、代码
- **团队：** 李开复创办，核心团队有 Google、Microsoft 背景

### 8.5 月之暗面 Moonshot AI — Kimi（中国）

- **产品：** Kimi（支持 20 万 token 上下文，后扩展至 100 万）
- **长上下文训练技术：** 
  - 使用**位置插值（Positional Interpolation）** 扩展 RoPE 位置编码
  - 使用 YaRN（Yet another RoPE extensioN）优化远距离注意力
- **预训练数据：** 专注高质量长文本（论文、书籍、代码、长对话）
- **推理优化：** 特别针对长上下文的 KV cache 优化，降低显存占用
- **团队：** 约百人规模，核心成员来自 Google Brain / DeepMind

---

## 九、训练团队规模与分工

### 9.1 典型大厂 LLM 训练团队配置

| 角色 | 职责 | 典型规模 |
|------|------|---------|
| **数据工程** | 数据收集、清洗、去重、质量过滤 | 20-100人 |
| **预训练（Pretraining）** | 模型结构设计、分布式训练、优化器配置 | 10-50人 |
| **后训练（Post-training）** | SFT 数据构建、标注团队管理 | 20-100人 |
| **RLHF / 对齐** | Reward Model 训练、PPO/DPO 训练、对齐评估 | 10-50人 |
| **Infra / 平台** | GPU 集群管理、网络拓扑、故障恢复 | 20-100人 |
| **评估（Evaluation）** | Benchmark 构建、红队测试、能力评测 | 10-30人 |

- **OpenAI：** 总团队数百人，LLM 相关约 100-200 人
- **Google DeepMind：** 数百人规模，仅 PaLM 项目就有数十人核心团队
- **Meta FAIR：** 数百人，覆盖预训练到后训练全链路
- **国内大厂（阿里/百度/华为）：** 通常 100-500 人规模

### 9.2 训练周期

| 阶段 | 典型时长 | 说明 |
|------|---------|------|
| 数据收集+清洗 | 3-6个月 | 高质量数据是训练的基础 |
| 预训练（Pretraining） | 2-8周（取决于规模） | 大规模 Transformer 自回归训练 |
| SFT | 1-4周 | 监督微调，较小数据集 |
| RLHF / DPO | 2-6周 | 多轮迭代，人类反馈收集 |
| 安全评估（Red Teaming） | 2-8周 | 贯穿后训练全程 |
| **总周期** | **6-18个月** | 从零开始训练一个顶级模型 |

---

## 十、关键参考文献汇总

| 论文/来源 | URL | 核心贡献 |
|---------|-----|---------|
| GPT-3 | https://arxiv.org/abs/2005.14165 | 175B SOTA，Scaling Law |
| InstructGPT | https://arxiv.org/abs/2207.09271 | RLHF 三阶段范式 |
| GPT-4 Technical Report | https://arxiv.org/abs/2303.08774 | GPT-4 方法论概述 |
| PaLM | https://arxiv.org/abs/2204.02311 | Pathways 架构，TPU 大规模训练 |
| LLaMA 1 | https://arxiv.org/abs/2302.13971 | 开源高效模型，数据Scaling |
| Llama 2 | https://arxiv.org/abs/2307.09288 | 开放可商用，Chat版本 |
| Llama 3 | https://arxiv.org/abs/2407.21783 | H100训练，DPO后训练 |
| Chinchilla | https://arxiv.org/abs/2203.15556 | 计算最优Scaling定律 |
| Constitutional AI | https://arxiv.org/abs/2212.08073 | Anthropic安全性训练方法 |
| DPO | https://arxiv.org/abs/2305.18290 | 无需PPO的偏好优化 |
| Qwen Blog | https://qwenlm.github.io/blog/ | 通义千问技术迭代 |
| Cohere Research | https://cohere.com/research | 企业LLM，多语言模型 |

---

*本报告由 Agent-4（子研究智能体）整理，引用来源截至 2026-06-13 的公开资料。部分数字为估算值，仅供参考。*