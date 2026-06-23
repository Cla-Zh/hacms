# 结构审计报告 — 2026-05-31-ai-supply-chain-security

> Agent A5 · 结构分析 + 风险点识别 (未修正) · 文件大小 ~33 KB / 673 行

## 1. 基本信息

| 项目 | 数值 |
|---|---|
| 文件路径 | `content/articles/2026-05-31-ai-supply-chain-security/index.html` |
| 字节数 | 33,734 |
| 行数 | 673 |
| 标题 | 🔐 AI供应链安全深度调研报告 |
| 类型 | 调研报告 (含学术 + 产业 + 案例) |
| 风格 | GitHub Dark 配色 (与同系列其他 dark 主题文章一致) |
| 调研周期 | 2025年 – 2026年5月 |

## 2. 章节结构

- **H2**: 8 个 (TOC + 7 章: 概述 · 攻击面 · 攻击类型 · 产业方案 · 学术进展 · 路线图 · 关键发现)
- **H3**: 16 个
- **H4**: 4 个
- **表格**: 12 个
- **章节深度**: 7 章 + 4 个真实案例卡片 + 4 篇代表性论文 + 3 阶段路线图

## 3. 引用与外部 URL

- **外部 URL 总数**: 0 (文中无 http(s) 链接, 仅 tag 标识)
- **arXiv ID**: **0 个真实 ID** (全部为占位符 `arXiv:2503.XXXXX`!)
- **DOI**: 0
- **CVE 引用**: CVE-2025-32711 EchoLeak (1 次)
- **机构引用**: OWASP (5+ 次) · CISA (3+ 次) · NIST (1 次) · Gartner (1 次) · Foundation-Sec-8B (1 次) · elpaco Research (2 次)

## 4. 数据点统计

| 类型 | 数量 / 样例 |
|---|---|
| 百分比 | 6 处 (100% / 75% / 10% / 98.3% / 2% / 5%) |
| 美元金额 | 0 |
| arXiv ID | **0 真实** + 1 占位符 (arXiv:2503.XXXXX) |
| 调研范围 | 13 篇论文 (开篇称) · 实际只展示 4 篇 (TransTroj / PromptGuard / ML Supply Chain / Model Signing) |
| 时间 | 2025 / 2026 / 2026-04 (TeamPCP) / 2025-09 (Shai-Hulud) |

### 关键百分比 (需验证)

- **Gartner 预测**: 2028 年 75% 企业 AI 项目依赖外部 AI 供应链组件 vs 当前 <10% 有评估流程
- **PromptGuard**: 在 EchoLeak 等真实攻击上达到 98.3% 检测率, 误报率 <2%
- **Model Signing**: 签名开销 <5%, 推理延迟影响可忽略
- **OWASP LLM Top 10 2025**: LLM04 (Model Supply Chain) 列为第三大威胁 — 排名需校 (实际是 LLM03 不是 LLM04, 这是关键问题!)

### ⚠️ 关键事实问题 (高优先级)

1. **OWASP LLM04 编号**: 文中两处提到 `LLM04: Model Supply Chain` 和 `LLM04列为第三大威胁`, 但 OWASP 2025 实际编号是 **LLM03: Supply Chain** (LLM04 是 Data Privacy). 这是数字错配
2. **OWASP LLM03 = Prompt Injection**: 文末表 4.1 列为 `LLM01: Prompt Injection` (这是对的), 但前文说 LLM04 是 Model Supply Chain (错)
3. **arXiv:2503.XXXXX 占位符**: 这是模板占位符未填, 真实 ID 缺失, 属 fabrication 风险
4. **EchoLeak CVE-2025-32711**: 声称是"首个在野零点击间接提示注入" — 需校 CVE 数据库
5. **Shai-Hulud npm 蠕虫**: "500+ npm包被攻陷" — 需校实际数字
6. **TransTroj**: 仅给 arXiv:2503.XXXXX 占位符, 论文存在性无法验证

## 5. 高频提及实体

- **学术论文**: 4 篇真实 + 多篇占位符
- **攻击类型**: 5 大类 (数据投毒 · 模型后门 · 提示注入 · Agent 劫持 · MLOps 供应链)
- **云厂商**: AWS Bedrock · Google Vertex AI · Microsoft Azure AI
- **安全框架**: OWASP / CISA / NIST
- **真实案例**: TransTroj · EchoLeak · Shai-Hulud · TeamPCP · OWASP LLM Top10

## 6. 风险点 TOP 5

| 排名 | 子部分 | 风险类型 | 校验重点 |
|---|---|---|---|
| 1 | **arXiv:2503.XXXXX 占位符** | fabrication | 必须替换为真实 arXiv ID 或删除; 占位符在 5.2 节代表性论文 (TransTroj) 和 1.x 节案例中均出现 |
| 2 | **OWASP LLM04 vs LLM03 编号错配** | internal_inconsistency | 前文称 "LLM04: Model Supply Chain 列为第三大威胁"; 4.1 表却用 "LLM03: Model Supply Chain". 必须核对 OWASP 2025 官方文档确认编号 |
| 3 | **PromptGuard "IEEE S&P 2025" + 98.3% 检测率** | 学术细节真伪 | 论文存在性 + 数据真伪; "在 EchoLeak 等真实攻击上达到 98.3%" — PromptGuard 2025 是否真做过 EchoLeak 测试? |
| 4 | **Shai-Hulud "500+ npm包被攻陷"** | 数据声明真伪 | 真实数字 (CISA Alert 实际范围) 需校 |
| 5 | **EchoLeak CVE-2025-32711 真实性** | CVE 编号真伪 | CVE 数据库是否真有该编号; elpaco Research 报告是否真存在 |

### 次级风险

- **CISA Agentic AI Systems Security Guidance**: 文中两次提及但未给 URL, 报告 PDF 是否公开可查
- **NIST SP 800-53 Rev 5 COSAiS 补充文件**: 真实存在性需校 (可能为 AI RMF 而非 SP 800-53)
- **Foundation-Sec-8B "超70B"**: "CTI推理+GRPO, 超70B" 的对比声明需校 (与姊妹篇 datashield-aegis-plan-v3 引用同一篇)
- **ELPACO Research 实体**: 是否真实研究机构, 还是拼写错误 (ELPACO → Aplhao/Aplha? 可能为混淆词)
- **章节 4.4 云厂商能力**: "Binary Authorization for ML" 是 GCP 产品名; "Guardrails" 是 AWS Bedrock 功能; 名称准确性需逐一核
- **调研周期**: 自称 2025-2026年5月, 但 OWASP LLM Top 10 for Agentic 2026 实际 2025-12 发布 — 时间窗对得上, 但需确认其他引用
- **13篇论文声明**: 开篇称引用 13 篇学术论文, 但实际 5.2 节只列 4 篇, 数据对不上