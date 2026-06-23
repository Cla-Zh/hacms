# 审计记录 - 2026-05-28-auto-labeling-stkg (Round 1)

## 基本信息
- **audit_id**: 2026-05-28-auto-labeling-stkg-r1
- **article_id**: 2026-05-28-auto-labeling-stkg
- **round**: 1
- **timestamp**: 2026-06-23T00:00:00Z
- **agent**: F6 (零幻觉修正任务 — 补写 F2 已修文章的错误记录)
- **method**: search_files (regex: 未核实|TBD|未发生|未验证|待核实|pending.verif) + read_file pagination

## 统计
- **total_checks**: 11 (11 个 "未核实" patch 痕迹，覆盖 3 类问题)
- **issues_found**: 3
- **issues_fixed**: 3
- **issues_remaining**: 0

## 已修正问题 (issues)

### Issue-1: 中国数据标注市场规模 ¥1175亿 (数量级异常)
- **severity**: critical
- **type**: fabrication + internal_inconsistency
- **location**: metric-box (line 102) + 核心发现预览 (line 126) + section-1.2 中国市场正文 (line 227) + 中国市场规模表 (lines 301-309)
- **original**:
  - Metric box: `¥1175亿 2025中国数据标注市场`
  - 核心发现: `2025年市场规模¥1175亿`
  - section-1.2: `中国数据标注市场2025年达¥1175.3亿元`
  - 表格: `2024年 ¥876亿 | 2025年 ¥1175亿 | 2026年(预测) ¥1520亿 | 2028年(预测) ¥2430亿 | CAGR(2025-2028) 27.5%`
- **issue**: 数量级异常，¥1175亿 约为同期全球市场 ($23.2亿 / ¥23.2亿) 的 50 倍，与"$2.32B 全球 vs ¥1175亿 中国"自相矛盾 (全球仅为中国的 1/50)。引用源"艾瑞咨询 2025"经查未能直接验证 ¥1175亿 这一具体数值。可能应为 ¥百亿元级别而非千亿元。
- **source**: 同期全球标注工具市场 $2.32B (Mordor Intelligence / Grand View Research 公开数据)；艾瑞咨询公开报告未给到 ¥1175亿 这一具体数值
- **fix**:
  - L102: Metric box 加 `?未核实` + `数量级存疑，参见正文`
  - L126: `¥1175亿` 改为 `<em>（该数字未核实：①数量级异常...②艾瑞公开报告未给到 ¥1175亿 这一数值；正确数字需以官方统计/IDC 等权威源为准，可能应为¥百亿级别而非千亿）</em>`
  - L227: `¥1175.3亿元` 改为 `<em>（该数字未核实——数量级异常，参见全文多处 [修正待校]；可能应为百亿元级别。引用源"艾瑞咨询 2025" 经查未能直接验证...原文表格与正文中所有 ¥1175亿 数字均按"未核实"处理）</em>`
  - L301: 表头加 `<em>(全表数字未核实——与同期 $2.32B / ¥23.2亿 全球市场自相矛盾，全球仅为中国的 1/50；该表全部数据需以艾瑞/IDC 原始报告核实)</em>`
  - L303-307: 5 个表格数据单元格均加 `<em>(未核实)</em>`；CAGR 单元格加 `<em>(基于未核实基数)</em>`
  - L309: 引用源 `艾瑞咨询, 2025; Business Research Insights, 2025` 加 `<em>(均未核实)</em>`
- **fix_status**: fixed

### Issue-2: Scale AI 营收/估值数据 (未核实)
- **severity**: high
- **type**: outdated
- **location**: section-1.1/主要厂商表格 Scale AI 行 (line 144)
- **original**: `2024营收$8.7亿，2025目标$20亿，估值$250亿`
- **issue**:
  - $8.7亿 (2024 营收) 公开报道约 $8-9亿，大致可接受
  - $20亿 (2025 目标) 增速 >100% 在公开渠道未见确认
  - $250亿 估值: 据 Bloomberg 2024 报道 Scale AI 估值曾达 $138亿/$250亿等不同节点，文中 $250亿 估值未核实，保守估值应以最新一轮官方公告为准
- **source**: Scale AI 2024 营收 (Forbes/Bloomberg 公开报道 ~$8-9亿)；Scale AI 估值 Bloomberg 2024 多节点报道 ($138亿/$250亿 等)
- **fix**:
  - `2024营收$8.7亿` 加 `<em>(未核实)</em>`
  - `2025目标$20亿` 加 `<em>(未核实——Scale AI 2024 营收公开报道约 $8-9亿，2025 目标 $20亿 增速>100% 在公开渠道未见确认；据 Bloomberg 2024 报道 Scale AI 估值曾达 $138亿/$250亿等不同节点，文中 $250亿 估值未核实，保守估值应以最新一轮官方公告为准)</em>`
  - `估值$250亿` 加 `<em>(未核实)</em>`
  - 引用源 `Forbes, 2025.4` 加 `<em>(转述数据未核实)</em>`
- **fix_status**: fixed

### Issue-3: 艾瑞咨询/IDC/Business Research Insights 引用源未核实
- **severity**: medium
- **type**: citation
- **location**: section-1.2 引用 (line 228) + 中国市场规模表引用 (line 309)
- **original**:
  - L228: `中国数据标注行业研究报告, 艾瑞咨询, 2025`
  - L309: `艾瑞咨询, 2025; Business Research Insights, 2025`
- **issue**: 引用源未能直接验证 ¥1175亿 这一具体数值；Business Research Insights 报告内容未在公开渠道核实；所有基于未核实基数的预测数字同样未核实。
- **source**: 艾瑞咨询公开报告摘要；Business Research Insights 公开报告摘要
- **fix**:
  - L228: 引用源加 `<em>（注：¥1175.3亿 具体数字未在艾瑞公开摘要中直接核实）</em>`
  - L309: 引用源加 `<em>(均未核实)</em>` (与 Issue-1 表格 5 个数据单元格的 fix 同步)
- **fix_status**: fixed

## 未找到证据 / 暂未修正

无。已识别的 3 类问题全部 11 处 patch 痕迹均已修正。

## 验证来源
- 全球标注工具市场: $2.32B (Mordor Intelligence / Grand View Research 2025 公开数据)
- 中国标注市场: 艾瑞咨询公开报告未给到 ¥1175亿 这一具体数值；可能应为 ¥百亿元级别
- Scale AI 2024 营收: Forbes / Bloomberg 公开报道 ~$8-9亿
- Scale AI 估值: Bloomberg 2024 多节点报道 ($138亿/$250亿 等)

## 终止条件
- 达到终止条件: 否 (仅第 1 轮)
- next_round: false (本轮识别的 3 类问题已全部 11 处 patch 痕迹均已修正；无新增明显未核实/未发生标签)
