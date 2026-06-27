# 勒索病毒家族全景 (2013-2025) — hacms 洞察材料 · 第 2 篇

**目录**: `/mnt/g/hacms/content/articles/2026-06-27-ransomware-family-landscape-insights/`
**日期**: 2026-06-27
**版本**: v1.0
**类型**: 长期威胁情报研究 (Long-horizon Threat Intelligence Research)

## 交付物清单

| 文件 | 大小 | 说明 |
|---|---|---|
| `index.html` | 60 KB | **主文档** · 9 章节 · 6 SVG 图 · 29 家族表 (含搜索) · 5 个下载链接 |
| `manifest.json` | 6.6 KB | 站点索引元数据 (hacsms 加载用) |
| `SUMMARY.md` | 本文件 | 执行摘要 |
| `attachments/ransomware-landscape.html` | 70 KB | 完整版报告 (含全部 SVG 矢量图) |
| `attachments/ransomware-landscape.pptx` | 44 KB | 演示幻灯片 (10 slides) |
| `attachments/ransomware-families.csv` | 10 KB | 29 家族完整数据 (13 列) |
| `attachments/ransomware-authoritative-sources.csv` | 4 KB | 40 权威源 (含已验证标记) |
| `attachments/ransomware-intel.json` | 23 KB | 完整结构化数据 (可导入 SIEM/SOAR) |

## 核心内容 (9 章节)

1. **执行摘要** — 5 大转折点 + 8 关键数据卡片
2. **12 年时间线** — 16 个时间节点 SVG (2013-2025)
3. **勒索模式演进** — 单/双/三/四重勒索 4 阶段
4. **RaaS 经济模型** — 4 角色产业链 (Stealer/IAB/Affiliate/Operator)
5. **29 家族完整表** — 含 MITRE ID + 报告链接 (可搜索)
6. **8 阶段攻击链** + **T1486 核心 TTP** + **5 阶段防御**
7. **40 权威源** — 8 大类卡片 (MITRE/政府/厂商/样本/规则/追踪)
8. **数据下载** — 5 个文件下载区 (HTML/PPT/2×CSV/JSON)
9. **关联文章** — hacms 洞察材料第 1/3 篇链接

## 7 大关键发现

1. **2024 全球赎金 $8.14 亿** (Chainalysis), 同比 -35% 但攻击数 +47%
2. **勒索模式 4 阶段进化**: 单 (2013) → 双重 (Maze 2019) → 三重 (LockBit 3.0 2023) → 四重 (BlackCat 2024)
3. **RaaS 分成反转**: 2024 平台方 30% → 2026 顶级 Affiliate 85-90%
4. **IAB 价格崩盘**: $5,400 (2020) → $439 (2026 Q1, -97%)
5. **5 大转折点**: WannaCry / Maze / DarkSide / LockBit 3.0 / Rust+Cartel
6. **T1486 唯一专属核心 TTP** (Data Encrypted for Impact)
7. **76% 部署在非工作时段, 30% 案例 48h 内部署** (Mandiant 2024)

## 质量保证 (零幻觉审计)

- **65 报告链接**: 全部经 `urllib.urlopen` + `web_extract` 二次验证
- **40 权威源**: 全部可达, GitHub 仓库含实际 star 数 (Sigma 10.7k, Yara-Rules 4.8k)
- **关键数字**: 双源交叉 (Chainalysis + Mandiant / Trend + Group-IB)
- **找不到的字段**: 标 `null` 不编造 (如 KillSec/Lynx 的 MITRE ID)
- **MITRE ATT&CK 编号**: 22/29 家族, 全部用官方 URL (如 S0366 WannaCry, S1202 LockBit 3.0)

## 3-Agent 并行 + 主控验证

| Agent | 任务 | 输出 |
|---|---|---|
| Agent 1 | 权威源 + 29 家族清单 | 65 报告链接 JSON |
| Agent 2 | MITRE TTP + 攻击链 + RaaS | 14 战术 + 8 阶段 + 4 角色 |
| Agent 3 | 防御 + YARA + IR | 40 源 + 7 仓库 + 4 阶段 IR |
| 主控 | URL 二次验证 + 修复 + 生成交付物 | 5 个文件, 152 KB |

## 下游使用

- **Hacsms 站点**: 自动被 articles 索引加载
- **SIEM/SOAR**: `ransomware-intel.json` 可直接导入
- **YARA/IDS**: 40 权威源 + 7 仓库全部可拉规则
- **培训/汇报**: PPT 10 slides 直接可用
- **DFIR**: 8 阶段攻击链 + 4 阶段 IR + T1486 监测信号

## 关联文章

- **上一篇**: [2026-06-22 AI 知识库全景](/articles/2026-06-22-ai-knowledge-base-panorama-insights/) (hacms 洞察材料第 1 篇)
- **下一篇**: (规划中 — 2026 Q3 AI 模型安全 / 数据中毒 / 模型后门)
