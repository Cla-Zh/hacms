# HACMS Task: RSI + Self-Evolution Panorama Survey (中英双语)

**Created**: 2026-10-21
**Category**: 洞察 (insights)
**Target repo**: `/mnt/g/hacms` → branch `main` (auto-push hook 已配置)
**Article ID**: `2026-10-21-rsi-self-evolution-panorama`
**Directory**: `content/articles/2026-10-21-rsi-self-evolution-panorama/`

---

## 交付物结构 (遵循 hacms 洞察分类惯例)

```
content/articles/2026-10-21-rsi-self-evolution-panorama/
├── index.html                      主页 · 中英双语导航 + 摘要
├── part-1-foundations.html         第 1 部分 · 学术基础与理论框架 (中英)
├── part-2-industry.html            第 2 部分 · 工业格局与关键公司 (中英)
├── part-3-routes.html              第 3 部分 · 主流技术路线与架构 (中英)
├── part-4-challenges.html          第 4 部分 · 挑战、瓶颈与安全护栏 (中英)
├── data/
│   ├── manifest.json               文章元数据 + 文件清单
│   ├── bibliography.json           引用源全集 (每条含 title + url + type)
│   └── glossary.json               术语表 (RSI/Self-Evolution/AlphaEvolve/DGM...)
└── assets/
    └── (SVG 图: 递归层级图 / 技术路线对比图 / 风险阈值图)
```

**必须同步修改**: `content/index/manifest.json` — 在 `articles` 数组追加条目, `category: "洞察"`, `hero_priority` 设为较高值让主页可见.

---

## 双语要求 (关键)

| 元素 | 要求 |
|---|---|
| 页面语言 | `<html lang="zh-CN">`, 中英**并排**呈现 |
| 每个 H2/H3 标题 | 中文在前, 英文在后 (例: `## 一、学术基础与理论框架 / Academic Foundations & Theoretical Frameworks`) |
| 每个正文段落 | 中文段 + 对应英文段 (或中文主 + 英文摘要) |
| 所有图表标签 | 中英双语 (例: `自修改代码 / Self-modifying code`) |
| 术语首次出现 | `递归自我改进 (Recursive Self-Improvement, RSI)` 格式 |
| 参考文献 | 标题保留原文, 追加中文译名 (例: `"title": "AlphaEvolve: A coding agent for scientific and algorithmic discovery", "title_zh": "AlphaEvolve: 用于科学与算法发现的编码 Agent"`) |
| SVG 图 | 文字标签全部中英双语 |

**不做**: 不做机翻堆砌 — 英文必须读起来是母语技术写作, 中文必须简洁专业.

---

## Phase 1: 检索与事实核查 (3 个并行 subagent)

### Agent 1 — 学术文献
- arXiv / alphaXiv 上 RSI、self-evolution、automated algorithm discovery 相关论文
- 重点核查: `AlphaEvolve` (Google DeepMind)、`Darwin Gödel Machine` (Sakana AI)、`The Last AI Built by Humans` 综述
- 分类元框架: 任务执行级 → 元改进级的多层自主度分级
- 输出: 论文标题 + 作者 + 年份 + arXiv URL + 核心贡献一句话

### Agent 2 — 工业界与公司动态
- **Anthropic**: Claude 编写内部生产代码的比例、研究闭环自动化程度 (需官方博客/工程报告来源)
- **OpenAI**: automated research intern、可扩展对齐 (scalable alignment)、闭环 agentic improvement
- **Recursion / Richard Socher  ventures**: RSI 纯玩家实验室
- **Google DeepMind**: AlphaEvolve、AlphaTensor 谱系
- **Sakana AI**: DGM、evolutionary agent harness
- 输出: 公司/项目 + 具体声明 + 官方来源 URL

### Agent 3 — 技术路线、安全与评测
- 两条主流路线: 代码库/Harness 自修改 vs 权重级自进化
- Evaluator 设计、proxy gaming 防范 (Red Queen effect、alignment drift)
- 基础设施: 算力需求、sandboxed agent runtime (microVM/Firecracker/WASM)
- 瓶颈: grounding 要求、collapse dynamics、verification limits
- 安全护栏: blast-radius 阈值、rollback 机制、治理框架
- 输出: 技术要点 + 评测基准 + 失败模式 + 来源 URL

---

## Phase 2: 综合与结构化 (Coordinator)

整合三份检索结果为 4 部分结构:

| 部分 | 主题 | 核心问题 |
|---|---|---|
| 1 | 学术基础与理论框架 | RSI 的分层自主度是什么? 算法范式有哪些? |
| 2 | 工业格局与关键公司 | 谁在做? 做到了什么程度? 声明可验证吗? |
| 3 | 主流技术路线与架构 | 自修改代码 vs 权重更新, 各自成本与瓶颈? |
| 4 | 挑战、瓶颈与安全护栏 | 什么会让递归失败? 阈值在哪? 如何治理? |

**风格**: 长程 5-10 年视角, 第一性原理 (信息论/熵/物理约束), 反直觉洞察, 专家视角. 拒绝按部就班罗列.

---

## Phase 3: HTML 生成

- 生产级 HTML, 单文件自包含 (CSS 内联, 无外部依赖除 `article-mobile.css/js`)
- 现代排版: 清晰字体层级、适度卡片、良好间距、专业配色 (参考 `2026-08-30-agent-security-tech-landscape/index.html` 的 CSS 变量方案)
- 响应式: 移动端适配 (必须引入 `/assets/article-mobile.css` 和 `article-mobile.js`)
- 参考文献列表嵌在末尾, 编号有序, 每条含完整标题 + 可用 URL

---

## Phase 4: 全谱验证 (2 个 validator subagent)

### Validator A — 引用完整性
- 逐条检查所有 URL 可访问 (无死链)
- 检查每条引用在正文中确实被引用 (无孤立引用)
- 检查编号连续、无重复
- 发现问题 → 回退修复

### Validator B — 技术一致性与完整性
- 对照 prompt 的 4 大维度, 确认无遗漏
- 检查技术表述是否准确 (术语使用、因果链、因果倒置)
- 检查中英双语是否对应 (段落配对、标题配对)
- 检查是否存在幻觉 (无来源的具体数字/公司声明)
- 发现问题 → 回退修复

---

## 引用规则 (铁律)

| 规则 | 说明 |
|---|---|
| **权威来源优先** | 同行评审论文 (NeurIPS/ICLR/ICML)、官方实验室技术报告、已验证预印本 |
| **链接完整性** | 每个事实声明/论文提及/技术里程碑 **必须** 带权威链接 (arXiv 直链或官方发布页) |
| **禁止死链** | 不允许 placeholder、`example.com`、或未验证 URL |
| **参考文献列表** | 报告末尾维护编号参考文献表, 含完整标题 + 可用 URL |

**幻觉零容忍**: 所有具体数字 (如 "Claude 编写 X% 代码") 必须有可验证来源. 无来源 → 删除该声明, 不允许"大约""据估计".

---

## 验收标准

- [ ] 4 个部分 HTML + 主页 index.html 全部生成, 均为中英双语
- [ ] `data/manifest.json` + `bibliography.json` + `glossary.json` 齐全
- [ ] `content/index/manifest.json` 已追加条目, category = "洞察"
- [ ] 所有引用 URL 可访问 (Validator A 验证)
- [ ] 4 大研究维度全覆盖 (Validator B 验证)
- [ ] 中英段落一一对应
- [ ] 至少 3 个 SVG 图 (中英双语标签)
- [ ] git commit 完成, **GitHub API 验证远端 SHA 与文件可访问**
- [ ] 首页可见 (hero_priority 设置正确)

---

## 提交前自检命令

```bash
cd /mnt/g/hacms
# 1. 文件齐全
ls -la content/articles/2026-10-21-rsi-self-evolution-panorama/
# 2. manifest 已更新
python3 -c "import json; m=json.load(open('content/index/manifest.json')); print([a['id'] for a in m['articles'] if 'rsi' in a['id']])"
# 3. 无中文乱码 (检查字体编码)
grep -c "�" content/articles/2026-10-21-rsi-self-evolution-panorama/*.html || echo "OK 无乱码"
# 4. commit 后验证远端
git log --oneline -3
git ls-remote origin main
```

---

**执行模式**: 自主研究, 不等待人工干预. Phase 4 发现问题必须回退修复后才能交付.