# RSI 自进化全景 v2 · 骨架规格

## 重写原因（用户诊断）

v1 的三个真实缺陷：
1. **没有开篇定义** —— 全稿 0 处定义 RSI/自进化，读者看完仍不知道「RSI 是什么」
2. **没有系统架构** —— `part-3` 标题写「两条路线对照」，正文实为 7 维散点，无一张完整架构图
3. **章节逻辑断裂 + 碎片化** —— Part 1 三套坐标轴 → Part 2 突跳 6 家公司；分类法三套并行无主从；Part 2 有 11 个 H2/H3 各写一段，无统一对比维度

**根因**：v1 按「检索到什么就写什么」组织，而非「读者需要什么顺序」。属框架问题，补段落无法修复。

## 用户选定结构：B（架构主干 / 工程向）

`① RSI 是什么 → ② 六层参考架构 → ③ 三种范式如何实现 → ④ 产业实验室对照 → ⑤ 验证与治理`

## 硬约束

- **不得自创定义**。RSI 定义必须有第一手出处（原作者主页/论文正文/官方报告）
- **不得自创架构**。架构每一层职责必须能对应到真实系统的实际切分
- 每条定义标注来源 + 原文引用（引号内为原文）
- 中英双语并排，不做机械翻译
- 沿用 v1 的 CSS class 体系（`.bi` `.card` `.callout` `.stats` `.src` `.nav` 等）
- 白底黑灰，SVG 矢量，viewBox 800x460

---

## 已完成的溯源（第一手来源，可直接引用）

### 定义层

| 来源 | 可引用内容 | URL |
|---|---|---|
| **Schmidhuber Gödel Machine 主页** | 唯一形式化定义："rewrites any part of its own code as soon as it has found a proof that the rewrite is useful"；效用函数+硬件+初始代码由初始证明搜索器中的公理编码；Global Optimality Theorem；"can be implemented on traditional computers" | `http://people.idsia.ch/~juergen/goedelmachine.html` |
| **arXiv:2607.07663**（Chen, Wang, Qu, UCR, 2026-07） | 1,250 篇系统综述；两轴分类法（改进什么 × 闭环程度）；**bounded self-refinement vs open-ended RSI** 的分野；核心论点 "Self-improvement is only as strong and reliable as the verification signal that defines 'better.'"；"Every improvement loop is a claim that some signal can substitute for human judgment" | `https://arxiv.org/abs/2607.07663` |
| **RAND PEA5068-1**（Sarma, Steratore, Jacob, Bhatt, 2026-10-12） | RAND 专家视角的 RSI 定义与概率框架 | `https://www.rand.org/pubs/perspectives/PEA5068-1.html` |
| **Omohundro 2007** | Basic AI Drives：目标导向系统的内生驱动，"tendencies which will be present unless explicitly counteracted" | `https://steveomohundro.com/wp-content/uploads/2009/12/nature_of_self_improving_ai.pdf` |

### 架构层（这是 v2 的核心新增，每层都有实证来源）

| 层 | 职责 | 实证来源 |
|---|---|---|
| **L1 改进对象载体**（What is rewritten） | 系统改写什么。文本工件（prompt/skill/memory schema）vs 源码。源码是图灵完备的严格超集 | **MOSS** 原文："all confine evolution to text-mutable artifacts... leave the agent harness untouched. Since routing, hook ordering, state invariants, and dispatch live in code rather than in any text artifact, an entire class of structural failure is physically unreachable from the text layer."；"source-level adaptation is Turing-complete, a strict superset of every text-mutable scope" |
| **L2 评估器**（Evaluator） | 把产物映射为质量信号。形式化证明 / 执行反馈 / 学习式评判 / 内生自评 | 2607.07663 的 evaluator 定义；CompassVerifier (EMNLP 2025)；Gödel machine 的证明触发条件 |
| **L3 元学习**（Meta-level） | 学习「改进的方法」本身。DGM: "such agents can be improved through meta-learning of their designs (e.g., prompts, workflows, and tools)" | DGM 原文；MAML (ICML 2017)；HyperNetworks (ICLR 2017);Meta-Learning Survey (arXiv:2004.05439) |
| **L4 搜索/变异策略**（Search） | 如何产生候选。梯度上升 / 进化搜索 / 树搜索。种群与精英保留 | DGM 的 archive + 亲本选择；AlphaEvolve 的演化管线 |
| **L5 执行沙箱**（Sandbox） | 候选在隔离环境验证，不可污染宿主。DGM: "All experiments were done with safety precautions (e.g., sandboxing, human oversight)" | DGM 原文；MOSS 的 ephemeral trial workers + in-place container swap + health-probe-gated rollback |
| **L6 闭环控制与治理**（Loop closure & governance） | 人插在哪。human-in-the-loop / human-on-the-loop / fully closed | 2607.07663: "The literature's dominant pattern is human-on-the-loop... Fully closed loops are sparse, especially in the most consequential cell—systems that modify their own evaluators." |

**MOSS 的五件套作为架构实证**（真实生产系统按此切分，证明六层不是纸上分类）：
Substrate / Control Surface / External Coding Agent / Host-Daemon Supervision / Topology
- 控制面用单个 `moss evo` CLI，九个子命令覆盖全生命周期
- 外部编码 agent CLI 可插拔（4 个 runner：Claude Code / OpenAI Codex / DeepSeek-TUI / OpenCode）
- 职责边界明确：**MOSS owns stage ordering, verdicts, loop exit, and the swap moment; the coding-agent CLI owns the act of editing**

---

## 文件结构（v2）

```
content/articles/2026-10-21-rsi-self-evolution-panorama/
├── index.html                  # 重写：定义开篇 + 六层架构总览 + 五部分导航
├── part-1-what-is-rsi.html     # 新建：① RSI 是什么
├── part-2-architecture.html    # 新建：② 六层参考架构（核心新增）
├── part-3-paradigms.html       # 重写自 part-3-routes：③ 三种范式如何实现
├── part-4-practice.html        # 重写自 part-2-industry：④ 产业实践统一维度对照
├── part-5-verification.html    # 重写自 part-4-challenges：⑤ 验证与治理
├── bibliography.html           # 更新：编号引用
├── assets/
│   ├── six-layer-architecture.svg   # 新建：六层架构图（核心图）
│   ├── rsi-loop.svg                 # 新建：闭环控制流图
│   ├── autonomy-levels.svg          # 保留
│   ├── verification-hierarchy.svg   # 保留
│   └── rsi-timeline.svg             # 保留
└── data/
    ├── bibliography.json       # 更新
    ├── glossary.json           # 更新
    └── manifest.json           # 更新
```

## 各章大纲

### index.html
- **开篇即定义**：一句话定义 + 三层递进（是什么 / 改什么 / 怎么闭环）
- 六层架构总览图 + 每层一句话
- 五部分导航（统一格式）
- 方法与核查

### part-1-what-is-rsi.html ① RSI 是什么
1. **一个可引用的工作定义** —— 2607.07663 的 bounded vs open-ended 分野 + Gödel machine 的形式化定义原文
2. **"递归"二字严格指什么** —— 为什么 self-improvement ≠ recursive self-improvement；闭环闭合是分水岭
3. **四条谱系** —— I.J. Good (1965) 思想源头 → Schmidhuber Gödel machine (2003/2006) 形式化 → 元学习 (Bengio 2000 / MAML 2017) 方法论 → 2025-2026 工程化
4. **什么不算 RSI** —— 三个常见混淆：单次自我修正 / 人类在环的持续调参 / 模型内自我一致性
5. **本领域的坐标系** —— 保留改进什么 × 闭环程度两轴（2607.07663 原文），交代与 v1 三套坐标轴的关系

### part-2-architecture.html ② 六层参考架构 【核心新增】
1. **为什么需要架构章** —— 碎片化信息无法拼装成系统
2. **六层总览**（大 SVG 图）+ 每层三问：做什么 / 谁在做 / 现状成熟度
3. **逐层详解**：
   - L1 改进对象载体：文本工件 vs 源码（引 MOSS 原文论证源码是严格超集）
   - L2 评估器：四种强度排序 + 为什么这是最强约束
   - L3 元学习：改进"改进方法"的双层结构
   - L4 搜索策略：三种搜索范式 + 种群/精英
   - L5 沙箱：为什么必须在隔离环境验证 + 三种隔离技术对比
   - L6 闭环控制：三种闭环程度 + 现实 dominant pattern
4. **两套实证架构的对照** —— DGM 的 archive/亲本/子代 vs MOSS 的五件套，说明同一层可以有不同实现
5. **一张表总结**：层 × 谁在做 × 代表系统 × 成熟度 × 主要风险

### part-3-paradigms.html ③ 三种范式如何实现
- 范式一 权重级（元学习/学到的优化器）
- 范式二 代码级进化搜索（AlphaEvolve/DGM 谱系）
- 范式三 世界模型引导
- 每个范式统一用「对应哪几层 / 典型系统 / 实证数字 / 已知失效模式」四段式写

### part-4-practice.html ④ 产业实践
**统一对比维度**（解决 v1 碎片化）：
| 系统 | 实验室 | 改哪几层 | 闭环程度 | 评估器 | 沙箱 | 公开数字 |
- 全部实验室用同一张表 + 同一组维度叙述，不再各写一段

### part-5-verification.html ⑤ 验证与治理
- 三刹车（保留 v1 实证）
- 治理现状
- 路线图

## 反幻觉纪律

- 每个定义句标注来源编号 + 原文引用
- 架构层职责必须对应上文实证来源，**不得凭印象编写**
- 未验证的公司声明不写成事实
- 参考文献页保持编号 + 中英标题 + 核实程度标注