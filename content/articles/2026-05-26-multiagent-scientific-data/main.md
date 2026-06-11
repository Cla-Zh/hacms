# 多Agent系统驱动科研数据清洗与治理全景调研报告

> **调研日期**：2026年5月12日
> **调研范围**：国内外学术界 + 产业界 + 权威机构
> **核心问题**：能否用多Agent系统将领域专家知识蒸馏为Skills，自动化科研数据（雷达/卫星/遥感/具身智能等）的清洗与治理，构建知识库助力大模型训练与推理？

---

## 一、问题定义：通用LLM/Agent为何处理不了领域专业数据？

### 1.1 核心矛盾

| 维度 | 通用LLM/Agent的能力边界 | 领域专业数据的需求 |
|------|--------------------------|---------------------|
| **数据格式** | 处理自然语言文本、结构化表格 | 雷达回波(I/Q数据)、卫星多光谱影像、SAR复数数据、点云序列 |
| **语义理解** | 通用语义推理 | 物理约束感知、信号处理先验、材料特性知识 |
| **质量判断** | 基于统计的异常检测 | 需领域专家经验的"数据可用性"判断（如雷达杂波vs目标） |
| **标注能力** | 零样本/少样本通用标注 | 需领域专用标注体系（如遥感L0-L4分级、雷达CFAR标注） |
| **知识关联** | 通用知识图谱 | 领域知识图谱（电磁频谱KG、遥感RSIKG、具身行为KG） |
| **推理链** | 文本推理链 | 物理-数据混合推理（PINN+Neural Operator） |

### 1.2 实证：LLM处理领域数据的三大鸿沟

**鸿沟1：模态鸿沟（Modality Gap）**

RadarLLM（AAAI 2026）[1]明确指出：
> "LLM天然处理离散文本token，而雷达信号是连续的空间-时间序列数据，两者之间存在根本性的表征差异。稀疏点云对语义理解构成重大挑战。"

- 毫米波雷达点云空间稀疏性：单帧仅64-256个点，vs 相机640×480像素
- 解决方案需专门设计：运动引导的雷达分词器（Aggregate VQ-VAE）+ 可变形人体模板 + 掩码轨迹建模

**鸿沟2：物理接地鸿沟（Physical Grounding Gap）**

Multimodal Data Storage and Retrieval for Embodied AI综述（arXiv 2508.13901, 2025）[2]指出：
> "多模态数据表示与物理世界真实状态之间的语义鸿沟是核心瓶颈，具身AI数据必须与物理世界状态关联。"

- 具身AI传感器数据（触觉、力觉、本体感知）无法被LLM直接理解
- 需要物理感知数据模型：将物理定律与约束直接嵌入数据表示

**鸿沟3：领域知识鸿沟（Domain Knowledge Gap）**

Agentic AI in Remote Sensing综述（WACV 2026）[3]指出：
> "现有视觉基础模型和多模态大语言模型虽推进了表征学习，但缺乏复杂地理空间工作流所需的序列规划与主动工具编排能力。"

- 遥感影像需地理坐标系、大气校正、辐射定标等专业知识
- 通用Agent无法自主完成这些领域特定预处理步骤

### 1.3 结论：通用LLM/Agent确实无法处理领域专业数据

**三大鸿沟的本质**是"通用语义"与"领域物理语义"之间的结构性断裂。这不是通过更大的模型或更多的数据就能解决的——需要领域知识的系统性注入。

---

## 二、学术前沿：多Agent系统 + 科研数据治理的最新进展

### 2.1 Agentic Science范式转变

**From AI for Science to Agentic Science**（arXiv 2508.14111, 2025）[4]系统梳理了AI在科学中的演进：

| 阶段 | 角色 | 典型系统 | 数据处理方式 |
|------|------|----------|--------------|
| **AI as Tool** | 专用计算工具 | AlphaFold/DeepMD | 人工清洗→模型消费 |
| **AI as Assistant** | 研究辅助 | Copilot/ChatGPT | 人机协同清洗 |
| **Agentic Science** | 自主发现伙伴 | AI Scientist/Robin | Agent自主编排数据管线 |

该综述收录**100+篇**多Agent科学发现论文，覆盖四大领域：

**生命科学**：CellAgent（单细胞数据分析）、BioAgents、PhenoGraph、TransAgent、AstroAgents

**化学领域**：ChemCrow、ProtAgents、CLADD（RAG增强药物发现）、PharmAgents

**材料科学**：SciAgents（MIT，生物启发多Agent图推理）、AtomAgents（物理感知多模态多Agent）、MechAgents、metaAgent（电磁超材料发现）

**物理与天文**：CosmoAgent、SimAgents、AutoGen-FEM

**关键洞察**：当前Agentic Science主要集中在**假设生成和实验设计**，数据清洗/治理环节的自动化程度仍然极低，是明确的创新空白区。

### 2.2 关键论文与系统

#### 2.2.1 SciToolAgent（Nature Computational Science, 2025）[5]

- **机构**：浙江大学
- **核心**：知识图谱驱动的科学Agent，编排500+科学工具
- **架构**：科学工具知识图谱 → 图检索增强生成(G-RAG) → LLM推理 → 工具编排
- **覆盖**：生物学、化学、材料科学
- **局限性**：工具编排为主，数据清洗/治理能力有限

#### 2.2.2 BioMedAgent（Nature Biomedical Engineering, 2026）[6]

- **机构**：中科院计算所 + 澳门科技大学
- **核心**：多Agent LLM框架，自进化能力，自主生物医学数据分析
- **架构**：自然语言交互 → 多Agent协作 → 自动调用生物信息学工具
- **性能**：327项基准测试，77%成功率，超越其他LLM Agent
- **创新**：工具感知（Tool-Aware）+ 自进化能力
- **意义**：证明了多Agent在专业领域数据处理上的有效性

#### 2.2.3 Robin（FutureHouse, 2025）[7]

- **机构**：FutureHouse（前Google DeepMind）
- **核心**：文献搜索Agent + 数据分析Agent的协作系统
- **能力**：假设生成→实验设计→结果解释→假设更新闭环
- **意义**：首个端到端科学发现多Agent系统

#### 2.2.4 SciAgents（MIT, Advanced Materials, 2024）[8]

- **机构**：MIT
- **核心**：大规模本体知识图谱 + 多Agent图推理
- **创新**：揭示隐藏的跨学科关系，以前被认为无关的领域
- **意义**：证明了知识图谱驱动多Agent在科学发现中的价值

#### 2.2.5 AutoDCWorkflow（EMNLP 2025 Findings）[9]

- **核心**：LLM自动生成数据清洗工作流
- **方法**：原始表 + 分析目的 → LLM生成清洗操作序列 → 自动执行
- **评估**：构建了LLM4DC基准数据集
- **局限性**：主要针对表格数据，未覆盖科学信号数据

#### 2.2.6 DatawiseAgent（北大 + 西交大, 2025）[10]

- **核心**：Notebook为中心的LLM Agent，端到端数据科学工作流
- **创新**：结构化任务分解 + 代码生成 + 执行反馈
- **性能**：超越多个强基线

#### 2.2.7 Labeling Copilot（arXiv 2509.22631, 2025）[11]

- **核心**：首个数据策划深度研究Agent（计算机视觉）
- **架构**：多模态编排 + 校准发现 + 共识标注
- **意义**：将数据标注从人工推向Agent自动化

### 2.3 知识蒸馏与技能学习前沿

#### 2.3.1 SkillX（浙大ZJUNLP, 2026）[12]

- **核心**：全自动化构建即插即用技能知识库（SkillKB）
- **三层层级蒸馏**：
  - 顶层：Strategic Plans（战略计划）
  - 中层：Functional Skills（功能技能）
  - 底层：Atomic Skills（原子技能）
- **跨Agent复用**：强Agent(GLM-4.6)构建→弱Agent消费
- **核心价值**：将经验从"孤立、一次性"转为"共享、累积、可复用"

#### 2.3.2 SkillRL（2026）[13]

- **核心**：递归技能增强的Agent进化框架
- **方法**：从历史经验中学习高级可复用行为模式
- **对比**：传统记忆方法存储冗余和噪声，SkillRL提取结构化技能

#### 2.3.3 DDK: Distilling Domain Knowledge（NeurIPS 2024）[14]

- **核心**：将领域知识从大LLM蒸馏到小LLM
- **方法**：知识蒸馏（KD）策略，改善小模型在特定领域的性能

#### 2.3.4 Domain Knowledge Distillation（arXiv 2307.11769, 2023）[15]

- **核心**：利用LLM进行领域知识蒸馏的自动化框架
- **方法**：提示工程驱动的半自动化框架

#### 2.3.5 Knowledge Distillation in Remote Sensing（arXiv 2409.12111, 2024）[16]

- **核心**：遥感领域知识蒸馏综述
- **覆盖**：目标识别、场景分类、变化检测等任务的KD方法
- **意义**：证明了KD在遥感领域的广泛适用性

### 2.4 信号与物理数据特殊研究

#### 2.4.1 SignalLLM（电子科大, 2025）[17]

- **核心**：首个通用LLM信号处理Agent框架
- **方法**：结构化任务分解 + RAG + 层次化规划
- **任务**：雷达目标检测、人体活动识别等5类任务
- **意义**：证明了LLM+领域RAG可处理信号数据，但仍需领域知识注入

#### 2.4.2 Agentic AI in Remote Sensing（WACV 2026）[3]

- **核心**：首个遥感Agentic AI统一分类体系
- **分类**：单Agent Copilots vs 多Agent Systems
- **架构**：规划机制 + RAG + 记忆结构
- **核心挑战**：接地问题、安全性、编排能力

---

## 三、产业现状：国内外多Agent数据平台与工具

### 3.1 国际产业界

| 平台 | 多Agent能力 | 数据治理 | 领域适配 | 关键特性 |
|------|------------|----------|----------|----------|
| **Databricks Agent Bricks** | ✅ 多Agent编排 | ✅ Unity Catalog统一治理 | ❌ 通用 | 2026.4发布，Agent+数据治理一体化 |
| **Dataiku Agent Management** | ✅ 跨云Agent管理 | ✅ 全生命周期治理 | ❌ 通用 | 多云Agent控制面板 |
| **Snowflake Cortex Agents** | ✅ 数据Agent | ✅ 原生数据治理 | ❌ 通用 | 结构化+非结构化自然语言查询 |
| **LangGraph** | ✅ 多Agent工作流 | ❌ 需自建 | ⚠️ 可定制 | 最流行的Agent编排框架 |
| **AutoGen (Microsoft)** | ✅ 多Agent对话 | ❌ 需自建 | ⚠️ 可定制 | 灵活的Agent通信协议 |
| **CrewAI** | ✅ 角色化Agent | ❌ 需自建 | ⚠️ 可定制 | 面向角色的Agent框架 |
| **Anthropic Claude Agent** | ✅ Skills系统 | ❌ 通用 | ⚠️ Skills可扩展 | 按需加载、可组合 |

**关键洞察**：所有产业界平台都是**通用型**，没有任何一个专门面向科研领域数据的Agent编排平台。

### 3.2 国内产业界

| 平台 | 多Agent能力 | 数据治理 | 领域适配 |
|------|------------|----------|----------|
| **华为 DataArts Studio** | ❌ 传统数据治理 | ✅ 数据目录/质量/血缘 | 企业级 |
| **阿里云 Dataphin** | ❌ 传统数据中台 | ✅ 数据标准/质量/安全 | 企业级 |
| **腾讯 WeData** | ❌ 传统数据平台 | ✅ 数据治理 | 企业级 |
| **字节 Dataleap** | ❌ 传统数据平台 | ✅ 数据治理 | 企业级 |
| **百分点 AI数据治理** | ⚠️ AI增强治理 | ✅ AI驱动 | 垂直行业 |
| **百度 PaddleScience** | ❌ 科研框架 | ❌ 非数据治理 | ✅ 科学计算 |

**关键洞察**：国内数据治理平台**全部是传统架构**，AI增强刚起步，多Agent编排几乎为零。科研数据治理存在巨大空白。

### 3.3 市场数据

- 2024年中国数据治理工具市场规模：**187亿元**，同比增长32.6%（信通院）
- 具备AI赋能与行业定制能力的工具产品增速**超40%**
- 2024年中国数据治理平台市场：38.3亿，阿里云占32.1%（IDC）
- Gartner 2026预测：到2028年，**1/3的AI应用**将使用Agent编排框架构建

---

## 四、创新分析：专家知识蒸馏为Skills的多Agent系统

### 4.1 创新点识别

基于文献和产业调研，**"将领域专家知识蒸馏为Skills + 多Agent编排科研数据清洗/治理"**这一方向具有**5个核心创新点**：

**创新点1：领域专家知识的Skill化蒸馏范式**

现有工作（SkillX[12]、SkillRL[13]）聚焦通用Agent技能，**从未有人将领域专家的科研数据清洗经验系统性地蒸馏为可复用Skills**。

- 现状：AutoDCWorkflow[9]只能清洗表格数据
- 突破：将雷达信号处理专家的经验（如CFAR检测、杂波抑制、STC补偿）编码为Skills
- 价值：解决"专家退休、经验流失"的痛点

**创新点2：多Agent协同的领域数据治理Pipeline**

现有数据治理平台（DataArts/Dataphin）是**传统规则引擎**，不涉及Agent。

- 现状：人工定义质量规则→规则引擎执行→人工复查
- 突破：多Agent协同编排→领域Skills驱动的自动化治理
- 类比：BioMedAgent[6]证明了多Agent在生物医学数据上的有效性，但**尚未扩展到雷达/遥感/具身等领域**

**创新点3：物理-数据混合驱动的Agent决策机制**

现有Agent决策基于纯数据驱动，无法感知物理约束。

- 现状：LLM Agent缺乏物理接地能力[2]
- 突破：将PINN/Neural Operator等物理先验嵌入Agent决策
- 价值：使Agent能理解"为什么这个雷达回波是杂波而非目标"

**创新点4：领域知识图谱驱动的Agent工具编排**

SciToolAgent[5]证明了知识图谱驱动工具编排的有效性，但仅限生物/化学。

- 现状：SciToolAgent覆盖500+生物/化学工具，**零覆盖雷达/遥感/电磁频谱工具**
- 突破：构建电磁频谱KG/遥感RSIKG驱动的Agent工具编排
- 价值：从"人找工具"到"Agent主动调用工具"

**创新点5：清洗后数据→知识库→推理增强的闭环**

现有工作将数据清洗和知识库构建视为**独立环节**。

- 现状：清洗→存储→独立构建RAG
- 突破：清洗即知识提取，治理即知识组织，推理即知识应用
- 价值：实现"数据→知识→推理"的端到端自动化

### 4.2 创新性评估

| 评估维度 | 评分 | 说明 |
|----------|------|------|
| **问题新颖性** | ⭐⭐⭐⭐⭐ | 学术界和产业界均未系统解决"领域专家知识Skill化"问题 |
| **方法创新性** | ⭐⭐⭐⭐ | SkillX+SciToolAgent的组合是新的，但底层技术非原创 |
| **实用价值** | ⭐⭐⭐⭐⭐ | 科研数据清洗人力成本极高，自动化需求强烈 |
| **技术可行性** | ⭐⭐⭐ | 三个核心技术（Skill蒸馏/多Agent编排/物理嵌入）各有成熟度差异 |
| **商业价值** | ⭐⭐⭐⭐ | 军工/气象/地震/遥感市场大，但需政策驱动 |

---

## 五、难点分析：五大核心技术挑战

### 难点1：领域专家知识的显性化与编码

**问题描述**：专家的"隐性知识"（tacit knowledge）如何转化为可执行的Skills？

- 雷达专家判断杂波的直觉：基于数十年的模式识别经验，难以形式化
- 遥感专家对影像质量的判断：涉及大气、传感器、季节等多维耦合因素
- 具身智能专家对传感器数据的信任度评估：硬件故障vs环境变化vs正常波动

**文献支撑**：
- SkillX[12]的"多层级蒸馏"方法可参考：顶层战略→中层功能→底层原子
- 但SkillX处理的是通用Agent技能，领域知识蒸馏的粒度和语义丰富度远超

**难度评估**：🔴🔴🔴🔴🔴（5/5）— 这是**最核心的难题**

### 难点2：多模态科学数据的统一表征

**问题描述**：雷达I/Q数据、卫星多光谱影像、点云序列、时序传感器数据的表征空间完全不同。

- 雷达：复数域，距离-多普勒图，CFAR统计模型
- 遥感：多光谱/超光谱，像素级到场景级的多粒度
- 具身：视觉+触觉+力觉+本体感知的异构融合

**文献支撑**：
- RadarLLM[1]的VQ-VAE分词器可参考：将连续信号→离散token
- 但每种模态需独立的分词器设计，统一表征是开放问题

**难度评估**：🔴🔴🔴🔴（4/5）

### 难点3：物理约束的Agent嵌入

**问题描述**：如何让Agent"理解"物理定律并据此做数据质量判断？

- 雷达数据需满足能量守恒、多普勒一致性
- 遥感数据需满足辐射传输方程
- 具身数据需满足运动学约束

**文献支撑**：
- PINN（Physics-Informed Neural Networks）将物理方程嵌入损失函数
- Neural Operator学习物理算子的映射
- 但将这些嵌入Agent的决策循环中尚无先例

**难度评估**：🔴🔴🔴🔴🔴（5/5）

### 难点4：多Agent编排的可信性验证

**问题描述**：多Agent处理科研数据时，如何保证结果的可靠性和可解释性？

- 单Agent出错可追溯，多Agent级联出错难以定位
- 科研数据对错误容忍度极低（一个误判可能导致重大决策错误）
- 需要Agent决策的因果可追溯性

**文献支撑**：
- Agentic Science综述[4]指出"可解释性"是Agentic Science四大挑战之一
- 目前缺乏多Agent系统在科研数据场景的可信性评估框架

**难度评估**：🔴🔴🔴🔴（4/5）

### 难点5：领域数据稀缺下的Skill学习

**问题描述**：领域专家数据（如标注好的雷达杂波样本、高质量遥感训练集）极为稀缺。

- RadarLLM[1]指出"雷达-文本配对数据极为稀缺"
- 需要从少量专家示范中快速学习Skills
- 小样本/零样本的Skill学习是未解决问题

**文献支撑**：
- SkillX[12]用强Agent构建SkillKB，但强Agent本身需要大量数据训练
- 领域强Agent的构建本身就是一个鸡生蛋的问题

**难度评估**：🔴🔴🔴🔴🔴（5/5）

---

## 六、价值分析：值得做吗？

### 6.1 核心价值主张

**价值1：解决"专家瓶颈"——人力成本降低90%+**

- 现状：雷达数据清洗需信号处理博士1-2人月/数据集
- 目标：Agent+Skills自动化完成90%+的常规清洗，专家仅处理10%的疑难
- 参考：AutoDCWorkflow[9]证明LLM可将表格数据清洗效率提升3-5倍

**价值2：构建"可复用知识资产"——专家经验永不流失**

- 现状：专家退休/转岗→经验流失→重新培训成本巨大
- 目标：SkillKB[12]持久化存储→新员工即插即用
- 参考：SkillX证明SkillKB跨Agent复用的有效性

**价值3：实现"数据→知识→推理"闭环——科研效率跃升**

- 现状：清洗→存储→独立构建知识库→独立推理，4个割裂环节
- 目标：清洗即知识提取→治理即知识组织→推理即知识应用
- 参考：SciToolAgent[5]证明知识图谱驱动的端到端效果

**价值4：打通"长尾场景"——通用LLM无法触及的领域**

- 现状：通用LLM在雷达/遥感/具身等领域的处理能力接近于零
- 目标：领域Skills注入→Agent获得领域专家级能力
- 参考：RadarLLM[1]证明即使是简单的VQ-VAE分词也能显著提升LLM在雷达数据上的理解

### 6.2 SWOT分析

| 维度 | 内容 |
|------|------|
| **优势(S)** | 领域空白（无竞争对手）、需求刚性（科研数据清洗是刚需）、技术积累（SkillX/SciToolAgent可借鉴） |
| **劣势(W)** | 领域知识获取难、多模态统一表征未解决、物理嵌入技术不成熟 |
| **机会(O)** | Gartner预测Agent成为标准工具、国内数据治理市场年增30%+、AI4S政策驱动 |
| **威胁(T)** | 通用Agent平台可能向下兼容领域、开源社区可能快速跟进、领域数据安全合规要求高 |

### 6.3 是否值得做：明确判断

**✅ 非常值得做，且应尽快启动。** 核心理由：

1. **学术空白**：Agentic Science综述[4]收录100+篇论文，**零篇**专门解决科研数据清洗/治理的多Agent系统
2. **产业空白**：全球无任何平台提供"领域专家知识Skill化+多Agent科研数据治理"的能力
3. **需求刚性**：雷达/遥感/具身等领域数据量每年增长10x，但清洗人力无法线性增长
4. **技术窗口**：SkillX（2026.4）、BioMedAgent（2026.3）刚发表，技术基础刚成型
5. **先发优势**：2年内做出可演示系统，可在顶级会议（NeurIPS/ICML/AAAI）发表

**⚠️ 风险提示**：
- 难度极高，建议分阶段推进（先雷达1个领域验证→再扩展）
- 需要真正的领域专家深度参与（不是AI工程师"想象"领域知识）
- 商业化周期可能3-5年（科研市场付费意愿低）

---

## 七、全景图：多Agent系统驱动科研数据清洗与治理架构

### 7.1 五层架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    Layer 5: 推理增强层                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ RAG引擎  │  │ 知识图谱  │  │ 推理Agent │  │ 决策Agent │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
├─────────────────────────────────────────────────────────────────┤
│                    Layer 4: 知识组织层                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ 语义标注  │  │ 关联发现  │  │ 质量评估  │  │ 血缘追踪  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
├─────────────────────────────────────────────────────────────────┤
│                    Layer 3: 数据治理层                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ 标准化    │  │ 质量规则  │  │ 元数据    │  │ 安全合规  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
├─────────────────────────────────────────────────────────────────┤
│                    Layer 2: 数据清洗层                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ 异常检测  │  │ 降噪去杂  │  │ 格式对齐  │  │ 缺失修复  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
├─────────────────────────────────────────────────────────────────┤
│                    Layer 1: Skill蒸馏层                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ 专家访谈  │  │ 示范学习  │  │ 层级蒸馏  │  │ SkillKB  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Agent DAG：7类Agent协同

```
                    ┌─────────────────┐
                    │   编排Agent       │
                    │ (Orchestrator)   │
                    └───────┬─────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │  清洗Agent     │ │  治理Agent     │ │  标注Agent     │
    │  (Cleaner)    │ │  (Governor)   │ │  (Annotator)  │
    └───────┬───────┘ └───────┬───────┘ └───────┬───────┘
            │               │               │
            ▼               ▼               ▼
    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │  质检Agent     │ │  知识Agent     │ │  推理Agent     │
    │  (Inspector)  │ │  (Knowledge)  │ │  (Reasoner)   │
    └───────────────┘ └───────────────┘ └───────────────┘
```

### 7.3 三大领域数据挑战与Agent需求映射

| 领域 | 数据特征 | 通用LLM失败原因 | 所需专家Skills | 关键Agent |
|------|----------|------------------|----------------|-----------|
| **雷达/电磁频谱** | I/Q复数、距离-多普勒图、CFAR统计 | 模态鸿沟+物理接地 | 杂波抑制、CFAR检测、STC补偿、极化处理 | 清洗+质检 |
| **卫星/遥感** | 多光谱/超光谱、SAR、辐射定标 | 地理空间接地+大气校正 | 辐射校正、大气校正、几何校正、云检测 | 清洗+治理+标注 |
| **具身智能** | 视觉+触觉+力觉+本体感知 | 物理接地+多模态融合 | 传感器标定、运动学验证、虚实对齐 | 全链路 |

---

## 八、实施路线图

### Phase 1（0-6月）：概念验证

- 选择**1个领域**（推荐雷达/电磁频谱，需求最刚性）
- 实现3-5个核心Skills的蒸馏（杂波抑制、CFAR检测、信号质量评估）
- 搭建最小多Agent原型（编排+清洗+质检3个Agent）
- 目标：1个端到端数据清洗Demo

### Phase 2（6-12月）：系统化

- 扩展到15-20个Skills
- 实现知识组织层（语义标注+关联发现）
- 接入RAG引擎，构建领域知识库
- 目标：论文投稿（NeurIPS/AAAI 2027）

### Phase 3（12-24月）：跨领域验证

- 扩展到遥感领域
- 验证SkillKB跨领域复用性
- 实现推理增强层
- 目标：开源框架 + 行业合作

### Phase 4（24-36月）：产业化

- 覆盖3+领域
- 商业化部署
- 与华为DataArts/阿里Dataphin生态对接
- 目标：行业标准制定参与者

---

## 九、参考文献

### 学术论文

[1] Zengyuan Lai et al., "RadarLLM: Empowering Large Language Models to Understand Human Motion from Millimeter-Wave Point Cloud Sequence," AAAI 2026. arXiv:2504.09862

[2] Yihao Lu, Hao Tang, "Multimodal Data Storage and Retrieval for Embodied AI: A Survey," arXiv:2508.13901, 2025.

[3] Niloufar Alipour Talemi et al., "Agentic AI in Remote Sensing: Foundations, Taxonomy, and Emerging Systems," IEEE/CVF WACV 2026, GeoCV Workshop. arXiv:2601.01891

[4] Jiaqi Wei, Yuejin Yang, Xiang Zhang et al., "From AI for Science to Agentic Science: A Survey on Autonomous Scientific Discovery," arXiv:2508.14111, 2025.

[5] SciToolAgent Team (Zhejiang University), "SciToolAgent: a knowledge-graph-driven scientific agent for multi-tool orchestration," Nature Computational Science, 2025. DOI:10.1038/s43588-025-00849-y

[6] Zhao Yi et al. (ICT-CAS + MUST), "Empowering AI data scientists using a multi-agent LLM framework with self-evolving capabilities for autonomous, tool-aware biomedical data analyses," Nature Biomedical Engineering, 2026. DOI:10.1038/s41551-026-01634-6

[7] FutureHouse, "Robin: A multi-agent system for automating scientific discovery," arXiv:2505.13400, 2025.

[8] MIT, "SciAgents: Automating Scientific Discovery Through Multi-Agent Intelligent Graph Reasoning," Advanced Materials, 2024. DOI:10.1002/adma.202413523

[9] Lan Li et al., "AutoDCWorkflow: LLM-based Data Cleaning Workflow Auto-Generation and Benchmark," Findings of EMNLP 2025. arXiv:2412.06724

[10] DatawiseAgent Team (PKU + XJTU), "DatawiseAgent: A Notebook-Centric LLM Agent Framework for End-to-End Data Science," arXiv:2503.07044, 2025.

[11] Labeling Copilot, "Labeling Copilot: A Deep Research Agent for Automated Data Curation," arXiv:2509.22631, 2025.

[12] Chenxi Wang et al. (ZJUNLP, Zhejiang University), "SkillX: Automatically Constructing Skill Knowledge Bases for Agents," arXiv:2604.04804, 2026.

[13] SkillRL Team, "SkillRL: Evolving Agents via Recursive Skill-Augmented Reinforcement Learning," 2026. GitHub: aiming-lab/SkillRL

[14] DDK Team, "DDK: Distilling Domain Knowledge for Efficient Large Language Models," NeurIPS 2024.

[15] Domain Knowledge Distillation Team, "Domain Knowledge Distillation from Large Language Models," arXiv:2307.11769, 2023.

[16] Himeur et al., "Applications of Knowledge Distillation in Remote Sensing: A Survey," arXiv:2409.12111, 2024.

[17] SignalLLM Team (UESTC), "SignalLLM: A General-Purpose LLM Agent Framework for Automated Signal Processing," arXiv:2509.17197, 2025.

[18] Exploring LLM Agents for Cleaning Tabular Machine Learning Datasets, arXiv:2503.06664, 2025.

[19] Botfip-LLM: An enhanced multimodal scientific computing framework, ScienceDirect, 2025.

[20] GLA-SD: Towards General LLM-based Agents for Scientific Discovery, 2024.

### 行业报告

[21] Gartner, "Top Predictions for Data and Analytics in 2026," March 2026.

[22] IDC, "中国数据治理市场份额，2024," September 2025.

[23] 信通院, "2024-2025年中国数据治理工具市场研究报告," December 2025.

[24] Databricks, "Agent Bricks: The Governed Enterprise Agent Platform," April 2026.

[25] Dataiku, "Agent Management: Multi-Cloud Agent Control," 2025.

### 国内数据治理平台

[26] 华为 DataArts Studio, https://www.huaweicloud.com/product/dayu.html

[27] 阿里云 Dataphin, https://www.alibabacloud.com/product/dataphin

[28] 腾讯 WeData, https://cloud.tencent.com/product/wedata

[29] 百度 PaddleScience, https://github.com/PaddlePaddle/PaddleScience

---

## 十、总结

**核心结论**：

1. **通用LLM/Agent确实无法处理领域专业数据**——三大鸿沟（模态/物理接地/领域知识）是结构性问题
2. **将专家知识蒸馏为Skills+多Agent编排是明确的创新方向**——学术和产业均未系统解决
3. **创新点有5个**——专家Skill化、多Agent治理Pipeline、物理嵌入决策、领域KG驱动编排、数据→知识→推理闭环
4. **最大难点是领域知识的显性化编码**——隐性知识→可执行Skills的转化是核心挑战
5. **非常值得做**——学术空白、产业空白、需求刚性、技术窗口已开
6. **建议先做1个领域**——雷达/电磁频谱（需求最刚性、数据格式最标准、安全合规驱动最强）

**一句话**：这不是"要不要做"的问题，而是"谁先做出来"的问题。2年的技术窗口期，先发者定义标准。
