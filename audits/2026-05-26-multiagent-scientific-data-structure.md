# 结构分析: 2026-05-26-multiagent-scientific-data

## 基本信息
- **index.html**: 3,698 字节, 52 行 (壳层)
- **main.md (实际内容)**: 31,198 字节, 583 行
- **行数总计**: ~635
- **文章类型**: AI 基础设施 (多 Agent 科研数据治理)
- **自我声明**: 调研范围"国内外学术界 + 产业界 + 权威机构", 29 条参考文献

## 章节结构 (来自 main.md)
10 个主章节 (一–十):
1. **一、问题定义**: 通用 LLM/Agent 为何处理不了领域专业数据
   - 1.1 核心矛盾 (含 6 行表)
   - 1.2 实证: 三大鸿沟 (模态/物理接地/领域知识)
2. **二、学术前沿**: 多 Agent 系统 + 科研数据治理
   - 2.1 Agentic Science 范式转变
   - 2.2 关键论文与系统 (2.2.1–2.2.7)
   - 2.3 知识蒸馏与技能学习 (2.3.1–2.3.5)
   - 2.4 信号与物理数据特殊研究
3. **三、产业现状**: 国内外多 Agent 数据平台
   - 3.1 国际 (7 平台表)
   - 3.2 国内 (6 平台表)
   - 3.3 市场数据
4. **四、创新分析**: 5 个核心创新点
5. **五、难点分析**: 5 大技术挑战
6. **六、价值分析**: 价值主张 + SWOT + 是否值得做
7. **七、全景图**: 5 层架构 + Agent DAG + 3 领域映射
8. **八、实施路线图**: Phase 1-4 (0-36 月)
9. **九、参考文献** (29 条, 含 DOI/arXiv)
10. **十、总结**: 6 条核心结论

## 数据点统计
- **外部 URL 数**: **5** (HTML 中) + **4** (main.md L562-568)
  - HTML: `https://cdn.jsdelivr.net/npm/marked/marked.min.js` (CDN)
  - main.md: `https://www.huaweicloud.com/product/dayu.html` (华为 DataArts), `https://www.alibabacloud.com/product/dataphin` (阿里 Dataphin), `https://cloud.tencent.com/product/wedata` (腾讯 WeData), `https://github.com/PaddlePaddle/PaddleScience` (百度 Paddle)
- **表格数 (index.html)**: 0
- **表格数 (main.md)**: 6+ (6 行核心矛盾表, 7 平台国际表, 6 平台国内表, 5 创新点评估表, 3 领域映射表, 4 时间阶段表)
- **DOI/arXiv 数**: 13+ 篇学术论文 (RadarLLM, SciToolAgent, BioMedAgent, Robin, SciAgents, AutoDCWorkflow, DatawiseAgent, Labeling Copilot, SkillX, SkillRL, DDK, Domain Knowledge Distillation, Knowledge Distillation in RS, SignalLLM)
- **关键数据点**:
  - 2024 中国数据治理工具市场 187 亿元, 同比 +32.6% (信通院)
  - 2024 中国数据治理平台市场 38.3 亿, 阿里云占 32.1% (IDC)
  - Gartner 2026 预测: 2028 年 1/3 AI 应用使用 Agent 编排框架
  - BioMedAgent: 327 项基准测试, 77% 成功率
  - AutoDCWorkflow: LLM4DC 基准数据集
  - RadarLLM: 单帧 64-256 个点 (vs 相机 640×480 像素)
  - Gartner 收录 100+ 篇 Agentic Science 论文
  - 3 大鸿沟 (模态/物理接地/领域知识)

## 风险点识别 (审计优先级)

### 🔴 P0 高风险 — 学术论文真实性
1. **RadarLLM (AAAI 2026)** [1]: arXiv:2504.09862 — **arXiv ID 格式异常** (2504 表示 2025 年 4 月), 需查 AAAI 2026 录用清单
2. **BioMedAgent (Nature Biomedical Engineering, 2026)** [6]: DOI:10.1038/s41551-026-01634-6 — DOI 中含 "2026", 较罕见
3. **Agentic AI in Remote Sensing (WACV 2026)** [3]: arXiv:2601.01891 — 需查 WACV 2026 GeoCV Workshop
4. **SkillX (ZJUNLP, 2026)** [12]: arXiv:2604.04804 — **arXiv ID 异常** (2604 = 2026 年 4 月, 高度可疑)

### 🔴 P0 高风险 — 行业市场数据
5. **L213 (信通院)**: 2024 中国数据治理工具市场 187 亿元, 同比 +32.6%
6. **L215 (IDC)**: 2024 中国数据治理平台市场 38.3 亿, 阿里云占 32.1%
7. **L216 Gartner 2026 预测**: 2028 年 1/3 AI 应用使用 Agent 编排框架
8. **L122 BioMedAgent 77% 成功率 / 327 项基准**: 数字需核 Nature Biomedical Engineering 原文

### 🟡 P1 中风险 — 平台/产品声明
9. **L188-196 (国际 7 平台表)**: Databricks Agent Bricks "2026.4 发布" 需核 Databricks 公告
10. **L198-208 (国内 6 平台表)**: 华为 DataArts/阿里 Dataphin/腾讯 WeData/百度 PaddleScience 状态描述
11. **L225-227 (Databricks/Dataiku 引用)**: 厂商文档真实性

### 🟡 P1 中风险 — 论文细节
12. **SciToolAgent (Nature Comp Sci, 2025)** [5]: DOI:10.1038/s43588-025-00849-y — 浙大
13. **Robin (FutureHouse, 2025)** [7]: arXiv:2505.13400 — 首个端到端科学发现多 Agent
14. **SciAgents (MIT, Adv Materials, 2024)** [8]: DOI:10.1002/adma.202413523
15. **AutoDCWorkflow (EMNLP 2025 Findings)** [9]: arXiv:2412.06724
16. **DatawiseAgent (PKU+XJTU, 2025)** [10]: arXiv:2503.07044
17. **Labeling Copilot** [11]: arXiv:2509.22631
18. **SkillRL (2026)** [13]: GitHub aiming-lab/SkillRL — 仅有 GitHub 链接, 无论文
19. **DDK (NeurIPS 2024)** [14]: 无 DOI/arXiv
20. **Domain Knowledge Distillation (2023)** [15]: arXiv:2307.11769
21. **Knowledge Distillation in RS (2024)** [16]: arXiv:2409.12111
22. **SignalLLM (UESTC, 2025)** [17]: arXiv:2509.17197
23. **[18] LLM Agents for Cleaning Tabular ML**: arXiv:2503.06664
24. **[19] Botfip-LLM**: ScienceDirect 2025
25. **[20] GLA-SD**: 2024

### 🟢 P2 低风险 — 行业报告
26. **L548-558 行业报告 [21]-[25]**: Gartner 2026 / IDC 2024 / 信通院 2024-2025 / Databricks 2026.4 / Dataiku 2025

## 引用方式问题 ⚠️
- **HTML 壳层**仅 52 行, 实际内容在 main.md 中, 通过 `fetch + marked.js` 动态渲染
- 4 个国内平台 URL 散落于参考文献章节
- 13+ 学术论文, **多个 arXiv ID 含 "2601"/"2604"** (2026 年) — **需重点验证 ID 真实性** ⚠️
- GitHub 引用 1 个 (SkillRL), 无论文

## 建议: 优先检查子部分
1. **L508 RadarLLM arXiv:2504.09862**: ID 格式异常, 需查 AAAI 2026 论文清单
2. **L518 BioMedAgent DOI 10.1038/s41551-026-01634-6**: 需查 Nature Biomedical Engineering
3. **L530 SkillX arXiv:2604.04804**: **最可疑** (arXiv 2604 = 2026.4, 与 2026.5 调研日期过于接近)
4. **L512 WACV 2026 arXiv:2601.01891**: 需查 WACV 2026 GeoCV Workshop
5. **L213-216 (国内 187 亿/38.3 亿/CAGR 32.6%)**: 信通院/IDC 报告需独立核
6. **L216 Gartner 1/3 Agent 预测**: Gartner 2026 报告需查
7. **L188-196 (国际 7 平台表)**: Databricks Agent Bricks 2026.4 发布声明
8. **L562-568 (4 个国内平台 URL)**: URL 需全部访问验证
9. **L130 未来 2 年技术窗口期**: 主观判断, 需谨慎
10. **L211-264 (5 大创新点 + 5 大难点)**: 主观性内容, 内部一致性需自查

## 备注
- 文章是**唯一一篇 HTML+MD 双层**结构
- "先发优势 2 年" 营销性判断需注意
- 大量 arXiv ID 含 "2604" 异常前缀, **审计 Agent B 应优先验证全部 arXiv ID 真实性**
