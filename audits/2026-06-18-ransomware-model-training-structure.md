# 结构审计报告 — 2026-06-18-ransomware-model-training

> Agent A5 · 结构分析 + 风险点识别 (未修正) · 文件大小 ~23 KB / 397 行

## 1. 基本信息

| 项目 | 数值 |
|---|---|
| 文件路径 | `content/articles/2026-06-18-ransomware-model-training/index.html` |
| 字节数 | 23,415 |
| 行数 | 397 |
| 标题 | 防勒索模型训练数据集 (1,553 个文件类型 → 13,977 条训练样本) |
| 类型 | 工程实施报告 (数据集 + 训练方案) |
| 风格 | 浅色学术风 + 橙蓝绿三色 tag |
| 文件清单 | 11 个配套文件 (data + scripts + config) |

## 2. 章节结构

- **H2**: 8 个 — 1.核心问题解答 · 2.数据集详情 · 3.训练配置 · 4.训练脚本 · 5.推理示例 · 6.局限与扩展 · 7.文件清单 · 8.关联资源
- **H3**: 17 个
- **H4**: 4 个 (任务 1/2/3 样例)
- **表格**: 5 个 (Alpaca/Dolly 对比 · GPU 推荐 · 风险评分 · 类别分布 · 文件清单)
- **代码块**: 12+ (bash / python / json)

## 3. 引用与外部 URL

- **外部 URL 总数**: 2 (仅 2 个 Wikipedia 链接)
  - en.wikipedia.org/wiki/Ransomware
  - en.wikipedia.org/wiki/Data_security
- **arXiv ID**: 0
- **DOI**: 0
- **内部引用**: 自身 dataset 文件 (4 个 JSONL) + scripts (3 个 .py) + config (3 个 yaml/json)

## 4. 数据点统计

| 类型 | 数量 / 样例 |
|---|---|
| 百分比 | 12+ 处 (含 86.7% / 22.0% / 16.6% / 14.9% / 8.8% / 8.5% / 7.1% 等) |
| 数据规模 | 1,553 扩展名 · 13,977 总样本 · 12 大类 · 9.0 平均/扩展名 · 86.7% Wikipedia 来源 |
| 训练 | LoRA rank 16 / 32 · QLoRA 4-bit · lr 1e-4 / 5e-5 · batch 4×4 / 2×8 · epochs 3 |

### 关键数据点 (需验证)

- **数据来源**: 1,553 扩展名 86.7% 来自 Wikipedia
- **数据任务分布**:
  - classification.jsonl: 1,553 行 (12大类)
  - extension_qa.jsonl: 12,424 行 (8模板QA)
  - ransomware_detection.jsonl: 1,553 行
  - training_combined.jsonl: 13,977 行 (主训练)
- **训练方案对比**:
  - LoRA 7B: ~16GB 显存, 2-3h, F1≥0.92, MAE≤0.10
  - QLoRA 14B (推荐): ~12GB, 4-5h, F1≥0.95, MAE≤0.08
  - 全参数 7B: ~60GB, 6-8h, F1≥0.93, MAE≤0.09
  - 全参数 70B: ~280GB, 24h, 边际提升 F1+0.01
- **风险评分体系**: 5 等级 (HIGH_RISK_EXECUTABLE 0.95 · HIGH_RISK_CRYPTO 0.75 · MEDIUM_RISK_DATA 0.55 · LOW_RISK_DOCUMENT 0.25 · VERY_LOW_RISK 0.10)
- **类别分布**: system 341 (22.0%) · document 258 (16.6%) · media 232 (14.9%) · archive 136 (8.8%) · image 132 (8.5%) · executable 110 (7.1%) · database 98 (6.3%) · science 87 (5.6%) · 3d_game 79 (5.1%) · network 31 (2.0%) · development 25 (1.6%) · font 24 (1.5%)
- **总和**: 341+258+232+136+132+110+98+87+79+31+25+24 = 1553 ✓ (内部一致)

### ⚠️ 关键问题 (高优先级)

1. **数据集可下载链接**: `/content/articles/2026-06-18-ransomware-model-training/data/training_combined.jsonl` 内部路径, 需验证文件真实存在
2. **86.7% Wikipedia 来源**: 与"基于 1,553 个文件扩展名生成"自相矛盾 — 1,553 是 Wikipedia 数据集大小, 但内容是 "防勒索知识" 而非 Wikipedia 原文, 需澄清生成逻辑
3. **F1≥0.95 / MAE≤0.08**: 是"预期效果"非实测, 需注明
4. **"QLoRA 4-bit 量化后只需 ~10GB"**: 与表格 12GB 略有不一致
5. **"LLaMA-Factory `config/train_14b_qlora.yaml`"**: 配置文件可能未上传, 需核实际 git repo

## 5. 高频提及实体

### 模型

- **Qwen2.5-7B-Instruct** · **Qwen2.5-14B-Instruct** · **Qwen2.5-70B**
- **LLaMA / Mistral** (作为对比)
- **LLaMA-Factory** · **unsloth** · **transformers** · **peft** · **BitsAndBytes**

### 数据集 (对比)

- **Alpaca** (Stanford 52K) · **Dolly** (Databricks 15K) · 本数据集 (13,977)
- **EMBER2024** (3.2M, XGBoost/MLP) · **SOREL-20M** (20M PE)

### 工具 / 硬件

- **RTX 4090** · **A100 40GB/80GB** · **H100** · **RTX 4080** · **3090** · **4060Ti 16GB**
- **tensorboard** · **peft** · **unsloth** · **LLaMA-Factory**

### 勒索家族 (提及)

- **Conti** · **LockBit** · **BlackCat** · **REvil** · **.locked** · **.crypt** · **.enc** · **.phobos** · **.conti** · **.lockbit**

## 6. 风险点 TOP 5

| 排名 | 子部分 | 风险类型 | 校验重点 |
|---|---|---|---|
| 1 | **13,977 训练样本是否真实存在** | fabrication 风险 | 4 个 JSONL 文件路径在文中提及, 需校实际 git 仓库是否有这 4 个文件; 文件总大小声称 3.5MB |
| 2 | **86.7% Wikipedia 来源 + "基于 1,553 扩展名生成"** | 内部矛盾 | Wikipedia 提供的是文件类型列表, 而非训练数据本身; "生成"逻辑需澄清 (LLM 生成? 模板生成?) |
| 3 | **F1≥0.95 / MAE≤0.08 "预期效果"** | 内部 KPI 未实测 | 是预测值还是实测值? 是否真做过训练? |
| 4 | **"QLoRA 4-bit 量化后只需 ~10GB" vs 表中 12GB** | 数据不一致 | 9 行说明 vs 3.1 表格 12GB — 自相矛盾 |
| 5 | **风险评分 0.95/0.75/0.55/0.25/0.10 是启发式而非数据驱动** | 方法学 | 文中 6.1 自己也承认 "不是从真实勒索样本训的分类器", 是规则; 实际勒索家族 (.locked, .crypt) 不在此 1,553 列表 |

### 次级风险

- **3.5MB JSONL 文件大小**: 与 13,977 行 × 平均 250 字符/行 = ~3.5MB, 基本吻合
- **Qwen2.5 模型**: 真实模型, 但 Qwen2.5-14B 是否真为官方版本需校 (Qwen 官方有 7B/14B/72B 系列)
- **"70B 模型在分类任务上不一定比 7B 更准"**: 是经验性说法, 业界有争议
- **A100 80GB vs H100 80GB**: 全参数 70B 训练需 4×H100 80GB 数字需校
- **关联资源**: 文中链接 `/content/articles/2026-06-18-file-formats-survey/` 与 `/content/articles/2026-06-18-ransomware-storage-data-security-survey/`, 需核这些文章真实存在
- **`.phobos` `.conti` `.lockbit` 后缀**: 真实勒索家族使用这些后缀, 但本数据集 1,553 扩展名来自 Wikipedia, 不含这些家族后缀 — 6.2 局限性已自承认
- **LLaMA-Factory 安装命令**: `pip install llamafactory` 真实, 但启动命令参数需核
- **EMBER2024 3.2M / SOREL-20M**: 数据集真实, 数字需校 (SOREL-20M 是 2020 数据集, 已被取代)