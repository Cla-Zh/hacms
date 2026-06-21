# 世界金融分析 — Prompt 历史存档

本目录按**日期维度**留存每次金融分析的需求 / 调整 / 决策快照.
供以后任何 AI Agent 或人类同事, 在新会话中提到 "hacms 金融分析" 时, 能快速加载历史上下文, 延续一致性.

## 📁 文件命名规范

```
YYYY-MM-DD-prompt-context.md    # 自然语言版 (给人看, 留底)
YYYY-MM-DD-prompt-context.json  # 结构化字段 (给 AI 解析, 自动化加载)
```

**示例**:
- `2026-06-22-prompt-context.md` — 第 1 份, 初始需求规格 (本仓库创建日)
- `2026-07-15-prompt-context.md` — 假设以后某次调整, 加新模块 / 改评分维度
- `2026-08-03-prompt-context.md` — 等等

每次新需求 → 复制最新一份 → 改日期 + 改 "变更说明" + 加新内容.

## 🔍 怎么使用 (下次提到 "hacms 金融分析" 时)

**方式 1 — 快速回顾**: `cat content/markets/history/README.md` 看目录 + 看最新 .md

**方式 2 — 加载最新结构化上下文 (推荐)**:
```bash
# 找最新日期的 json
ls -t content/markets/history/*.json | head -1
# 喂给 AI (作为 system prompt 的一部分)
cat $(ls -t content/markets/history/*.json | head -1)
```

**方式 3 — 完整历史**:
```bash
# 按日期列出所有存档
ls -la content/markets/history/*.md
# 看每份的 "变更说明" 章节, 了解演进过程
```

**方式 4 — 在 hermes 会话中**:
```
"按照 content/markets/history/ 里最新的 prompt 上下文, 帮我做 X"
```
我会自动读取最新 JSON + 应用所有约定.

## 📊 每份存档包含字段

| 字段 | 用途 |
|---|---|
| **id** | 唯一标识 (date-slug) |
| **date** | YYYY-MM-DD |
| **trigger** | 这次分析的触发原因 (新增 / 调整 / 修复) |
| **summary** | 一句话概括本次变化 |
| **core_mission** | 核心使命 (资金流 / 为什么 / 未来) |
| **targets** | 5 大目标 (低估 / 高估 / 趋势分级 / 短期炒作 / 长期机会) |
| **engines** | 11 个引擎的当前定义 |
| **committee** | 5 CIO 投资委员会当前成员 + 投票机制 |
| **trend_grades** | S/A/B/C/D 5 级趋势分级当前定义 |
| **scoring_weights** | 评分 7 维度权重 (资金流 20% ... 风险 10%) |
| **dashboard_modules** | 16 模块当前清单 |
| **ui_style** | 当前 UI 风格 (Bloomberg + TradingView + Apple + Linear) |
| **theme** | 当前主题 (浅色 hacms / 暗色 Bloomberg) |
| **architecture_decisions** | 关键架构决策 (数据流 / 组件结构 / 集成方式) |
| **change_log** | 本次相对上一份的变化 |

## 📜 历史记录 (按日期倒序)

| 日期 | ID | 触发 | 摘要 |
|---|---|---|---|
| 2026-06-22 | initial-prompt-spec | 初始创建 | 第 1 份, 完整 prompt 规格 + 11 引擎 + 16 模块 |

## 🔄 维护规则

1. **每收到新的金融分析需求** → 复制最新 .md/.json → 改日期 → 加新内容
2. **修复 bug / 调整** → 也是新一份存档 (哪怕只是 CSS 改动)
3. **不删除旧存档** — 演进历史完整留存
4. **JSON 字段稳定** — 后续新增字段不破坏旧字段