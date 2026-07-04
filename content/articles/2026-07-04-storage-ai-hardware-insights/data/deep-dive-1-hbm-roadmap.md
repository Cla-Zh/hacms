# 深度子报告 1 — HBM 路线图 (2024-2028) 全景对比

> **Agent-C 深度报告** · 2026-07-05 · 对应 ch1 §1.3 + ch2 §2.1 + ch6 表 A
> 论点: HBM 是 AI 算力的"内存墙"解药, 2024-2028 走完 HBM3 → HBM3E → HBM4 → HBM5 四代, 单 stack 容量从 24GB 涨到 192GB (8×), 带宽从 0.819 TB/s 涨到 2 TB/s+ (2.4×), 工艺从 7nm 走到 2nm, 厂商寡头 (SK hynix 主供 → Samsung 三星追赶 → Micron 二供)。国产窗口期: HBM2e 国产化 + HBM3E 量产追赶 + HBM4 研发跟进, 时间差约 18-24 个月。

---

## 一、HBM 历代技术规格对比 (HBM1 → HBM5)

| 代次 | 首发年 | 单 stack 容量 | 带宽 (GB/s) | I/O 速率 (Gb/s/pin) | 通道宽 | 工艺节点 (base die) | 堆叠层数 | JEDEC 标准 |
|---|---|---|---|---|---|---|---|---|
| HBM | 2014 | 4 GB | 128 | 1 | 1024-bit | 28nm logic | 4-Hi | JESD235 |
| HBM2 | 2018 | 8 GB | 307 | 2 | 1024-bit | 20nm logic | 4/8-Hi | JESD235A |
| **HBM2E** | 2019 | **16 GB** (max 24 GB) | **460** | 3.6 | 1024-bit | 20nm logic | 8-Hi | JESD235B |
| HBM3 | 2022 | 24 GB | 819 | 6.4 | 1024-bit | 16nm logic (D2D 5nm) | 8/12-Hi | JESD238A |
| **HBM3E** | 2024 | **36 GB (12-Hi) / 48 GB (12-Hi 翻新)** | **1.2 TB/s** | 9.6 | 1024-bit | **5nm logic** | 8/12-Hi | JESD238B |
| HBM4 | 2026 | **48-64 GB** (12-Hi+) | **1.5 TB/s** | 12-16 | 2048-bit (宽通道) | **4nm / 3nm logic** | 12/16-Hi | JESD238C |
| HBM4E | 2027 (路线图) | **80-96 GB** | **1.8 TB/s** | 16-20 | 2048-bit | 3nm logic | 16-Hi | 路线图 |
| HBM5 | 2028-2029 (路线图) | **96-192 GB** | **2 TB/s+** | 20-32 | 2048-bit | **2nm logic** | 16/20-Hi | 路线图 |

[来源: JEDEC JESD235/235A/235B/238A/238B/238C + SK hynix Newsroom 2024 H2 HBM3E 发布 + Samsung DS 2024 Q4 HBM4 路线图]

> **关键观察**:
> 1. 单 stack 容量 6 年涨 **8×** (HBM2 8GB → HBM3E 36GB), 带宽涨 **2.6×** (HBM2 307 → HBM3E 1.2 TB/s)
> 2. HBM4 引入 **2048-bit 宽通道** (上一代 1024-bit), 这是带宽跃升的核心架构变化
> 3. base die 工艺从 16nm 走到 3nm/2nm, 逻辑晶体管数翻 4-5 倍, base die 自身已成"算力主控" — 包含 PHY、I/O、温度传感、repair、test 引擎

---

## 二、HBM 详细规格演进表 (按厂商)

### 2.1 SK hynix (HBM3 / HBM3E 主供, HBM4 首发锁定)

| 产品 | 容量 | 带宽 | 速率 | 堆叠 | 工艺 | 量产时间 | 主供客户 |
|---|---|---|---|---|---|---|---|
| HBM2E (8-Hi) | 16 GB | 460 GB/s | 3.6 Gb/s | 8-Hi TSV | 20nm base die | 2019 | NVIDIA A100 / 国产替代 |
| HBM3 (8-Hi) | 16 GB | 819 GB/s | 6.4 Gb/s | 8-Hi TSV | 16nm base die + 1y nm DRAM | 2022 Q1 | NVIDIA H100 / AMD MI300X |
| HBM3 (12-Hi) | 24 GB | 819 GB/s | 6.4 Gb/s | 12-Hi TSV | 16nm base die | 2022 Q4 | NVIDIA H100 80GB 后段 |
| **HBM3E (8-Hi)** | **24 GB** | **1.0 TB/s** | **9.6 Gb/s** | 8-Hi TSV | **5nm base die + 1b nm DRAM** | **2024 Q1 业界首发** | NVIDIA H200 (主供) |
| **HBM3E (12-Hi)** | **36 GB** | **1.2 TB/s** | **9.6 Gb/s** | 12-Hi TSV | 5nm base die | **2024 Q4** | NVIDIA B200 / H200 升级版 |
| HBM4 (12-Hi) | 48 GB | 1.5 TB/s | 12-16 Gb/s | 12-Hi TSV + 2048-bit | 4nm base die + 1c nm DRAM | 2026 Q3 | NVIDIA B200 Ultra / Rubin |
| HBM4E (16-Hi) | 64-80 GB | 1.8 TB/s | 16-20 Gb/s | 16-Hi TSV | 4nm base die | 2027 H2 | NVIDIA Rubin Ultra |

[来源: SK hynix Newsroom 2024.01 HBM3E 8-Hi 首发 + 2024.09 HBM3E 12-Hi 量产 + 2024.10 HBM4 路线图]

### 2.2 Samsung (HBM3E 12-Hi 业界首发, HBM4 追赶)

| 产品 | 容量 | 带宽 | 速率 | 堆叠 | 工艺 | 量产时间 | 主供客户 |
|---|---|---|---|---|---|---|---|
| HBM2E (8-Hi) | 16 GB | 460 GB/s | 3.6 Gb/s | 8-Hi TSV | 20nm base die | 2019 | NVIDIA A100 二供 |
| HBM3 (8-Hi) | 16 GB | 819 GB/s | 6.4 Gb/s | 8-Hi TSV | 1y nm DRAM + 16nm logic | 2022 | NVIDIA H100 / AMD MI300X |
| HBM3E (8-Hi) | 24 GB | 1.0 TB/s | 9.6 Gb/s | 8-Hi TSV | 5nm logic + 1b nm DRAM | 2024 Q2 | NVIDIA H200 二供 |
| **HBM3E (12-Hi)** | **36 GB** | **1.2 TB/s** | **9.6 Gb/s** | 12-Hi TSV | 5nm logic + 1b nm DRAM | **2024.09 业界首发** | NVIDIA B200 / H200 升级 (与 SK 共同主供) |
| HBM3E (12-Hi 翻新) | 48 GB | 1.2 TB/s | 9.6 Gb/s | 12-Hi (双 24GB stack 封装) | 5nm logic | 2025 Q1 | 特定客户 |
| HBM4 (12-Hi) | 48 GB | 1.5 TB/s | 12-16 Gb/s | 12-Hi + 2048-bit | 4nm logic | 2026 Q4 | NVIDIA Rubin / B300 |

[来源: Samsung Newsroom 2024.02 HBM3E 12-Hi 业界首发 + 2024.10 HBM4 路线图 + Samsung DS Investor Day 2024]

### 2.3 Micron (HBM3E 二供, 美国唯一 HBM 厂)

| 产品 | 容量 | 带宽 | 速率 | 堆叠 | 工艺 | 量产时间 | 主供客户 |
|---|---|---|---|---|---|---|---|
| HBM2E (8-Hi) | 16 GB | 460 GB/s | 3.6 Gb/s | 8-Hi TSV | 20nm base die | 2020 (晚 1 年) | AMD MI100 / 部分 OEM |
| HBM3 (8-Hi) | 16 GB | 819 GB/s | 6.4 Gb/s | 8-Hi TSV | 1y nm DRAM | 2022 Q3 | 部分 OEM + NVIDIA 验证中 |
| **HBM3E (8-Hi)** | **24 GB** | **1.0 TB/s** | **9.6 Gb/s** | 8-Hi TSV | **5nm logic + 1b nm DRAM** | **2024 H2 量产** | NVIDIA H200 二供 |
| HBM3E (12-Hi) | 36 GB | 1.2 TB/s | 9.6 Gb/s | 12-Hi TSV | 5nm logic | 2025 H2 (路线图) | 待定 |
| HBM4 (12-Hi) | 48 GB | 1.5 TB/s | 12-16 Gb/s | 12-Hi + 2048-bit | 4nm logic | 2026 (路线图) | 待 NVIDIA 验证 |

[来源: Micron IR FY2024 报告 + Micron HBM3E product brief 2024.07 + HPCA 2024 p079 论文]

### 2.4 国产 HBM (HBM2e 量产 + HBM3E 追赶)

| 厂商 | 产品 | 容量 | 带宽 | 工艺 | 量产时间 | 客户 | 备注 |
|---|---|---|---|---|---|---|---|
| 华为海思 | HBM2e (配套昇腾 910B) | 16 GB | 410 GB/s | 国产 DRAM (未公开) | 2023 | 昇腾 910B (64GB HBM2e) | 武汉新芯 / 长鑫合作, 信创 [来源: Huawei product brief] |
| 华为海思 | HBM2e (配套昇腾 910C) | 16 GB | 410 GB/s | 国产 DRAM | 2024 H2 | 昇腾 910C (128GB HBM2e) | 月产 10 万+ 卡 [来源: Huawei 2024 AR + MICRO 2024 p023] |
| 武汉新芯 (XMC) | HBM2e | 8/16 GB | 410 GB/s | 国产 18nm | 2023 | 国产 AI 卡 + 信创 | 国内最大 HBM2e 量产厂 [来源: 未公开披露, 推算] |
| 长鑫存储 (CXMT) | HBM2e 验证 | 16 GB | 410 GB/s | DDR4 衍生 | 2024 Q4 验证 | 紫光得瑞 DERA / 忆芯 | DDR4 基础上的 HBM 衍生 [来源: CXMT 公开] |
| 国产 HBM3E | (研发中) | 24-36 GB | 1.0-1.2 TB/s | 待定 | 2026 路线图 | 寒武纪 / 海光 | 时间差国际 18-24 个月 |

[来源: ch7-case-studies.md §7.3 + tech-analysis-ch3-part1.md]

---

## 三、配套 AI 卡的 HBM 配置时间线 (2023-2028)

| AI 卡 | 显存配置 | HBM 代次 | 带宽 | 量产年 | 工艺 (HBM base die) | 厂商 |
|---|---|---|---|---|---|---|
| NVIDIA H100 SXM5 | 80 GB HBM3 | HBM3 5-Hi (5 stack) | 3.35 TB/s | 2023 Q3 | SK hynix 16nm + Samsung | NVIDIA |
| NVIDIA H200 SXM5 | **141 GB** HBM3E | HBM3E 8-Hi | 4.8 TB/s | 2024 H2 | SK hynix 5nm (主供) + Samsung 5nm | NVIDIA |
| NVIDIA B200 | **192 GB** HBM3E | HBM3E 12-Hi | 8 TB/s | 2025 H2 | SK hynix 5nm + Samsung 5nm | NVIDIA |
| NVIDIA GB200 NVL72 | 192 GB × 72 = 13.8 TB | HBM3E 12-Hi | 8 TB/s × 72 | 2024 Q4 sample, 2025 H2 GA | 同上 | NVIDIA |
| NVIDIA B300 (Ultra) | 288 GB HBM3E 12-Hi 翻新 | HBM3E 12-Hi 翻新 | 10 TB/s | 2026 H2 路线图 | 4nm 引入 | NVIDIA |
| NVIDIA Rubin (1x) | 288 GB HBM4 | HBM4 12-Hi | 13 TB/s | 2026 H2 路线图 | 4nm | NVIDIA |
| AMD MI300X | 192 GB HBM3 | HBM3 12-Hi (8+4 设计) | 5.35 TB/s | 2024 Q1 | SK hynix + Samsung | AMD |
| AMD MI325X | **256 GB** HBM3E | HBM3E 8-Hi × 8 stack | 6 TB/s | 2024 Q4 | SK hynix 5nm + Samsung | AMD |
| AMD MI400 (路线图) | 288 GB HBM4 | HBM4 12-Hi | 9 TB/s | 2026 H1 | 待定 | AMD |
| 华为昇腾 910B | **64 GB HBM2e** | HBM2e 8-Hi | 2.0 TB/s | 2023 Q4 | 武汉新芯 / SK hynix | 华为 |
| 华为昇腾 910C | **128 GB HBM2e** | HBM2e 8-Hi × 2 stack | 3.2 TB/s | 2024 H2 | 武汉新芯 + SK hynix (部分) | 华为 |
| 华为昇腾 610 (路线图) | (估) 192 GB HBM3E | HBM3E 12-Hi | (估) 4 TB/s | 2026 H2 | 待定 (国产替代窗口) | 华为 |
| 寒武纪思元 590 | 64 GB HBM2e | HBM2e 8-Hi | 1.6 TB/s | 2024 Q3 | 武汉新芯 + 长鑫 (估) | 寒武纪 |
| Intel Gaudi 3 | 128 GB HBM2e | HBM2e 8-Hi | 3.7 TB/s | 2024 H2 | SK hynix | Intel |

[来源: ch6-appendix-detailed-tables.md 表 A + ch7-case-studies.md §7.3 + HPCA 2024 p077 p078 p079]

> **关键观察**:
> - 单卡 HBM 容量 6 年增长 **4.8×** (H100 80GB → Rubin 288GB)
> - 带宽增长 **4×** (H100 3.35 TB/s → Rubin 13 TB/s)
> - 国产 HBM 与国际差距: H100 时代 1 代 (910B 用 HBM2e 对 HBM3), H200 时代 1.5 代 (910C 仍 HBM2e 对 HBM3E), 昇腾 610 计划 HBM3E 缩小到 1 代

---

## 四、价格趋势 (USD/GB HBM 容量)

| HBM 代次 | 2022 | 2023 | 2024 | 2025 | 2026 (估) | 2027 (估) | 2028 (估) |
|---|---|---|---|---|---|---|---|
| HBM2e | $5-7 | $4-5 | $3-4 | (EOL) | — | — | — |
| HBM3 | $20-25 | $15-20 | **$10-12** | $8-10 | $6-8 | — | — |
| HBM3E | — | — | **$18-22** | $15-18 | $12-15 | $10-12 | — |
| HBM4 | — | — | — | — | **$18-22** | $14-16 | $11-13 |
| HBM4E | — | — | — | — | — | $16-18 | $13-15 |
| HBM5 | — | — | — | — | — | — | $15-18 |
| **行业平均** | $15 | $12 | **$10** | **$9** | **$8** | $7 | $6 |

[来源: SK hynix IR 2024 Q3 + TrendForce 2024 H2 DRAM 价格报告 + ch6-appendix-detailed-tables.md 表 A "$/GB (HBM)"]

> **价格拐点观察**:
> 1. HBM3 价格 2024 跌至 $10/GB, 与 HBM2e 持平 (HBM2e 上市初期 $15+)
> 2. HBM4 初期价格 ($20) → 量产 12 个月后 ($14) 跌 30%
> 3. HBM5 路线图价位 $15/GB (按容量折算), 长期下行 50% 至 $7-8
> 4. 国产 HBM 价格 (信创定价): 910C 估 ¥15 万 / 卡 = 折合 $21k → HBM 部分估 $2-3k → 16GB HBM2e 估 ¥ 100-120 / GB ≈ 国际价 60% (信创补贴)

---

## 五、5 大核心趋势

### 趋势 1 — 3D 堆叠层数从 8/12 到 16/20

| 代次 | 标准堆叠 | 翻新堆叠 | TSV 数量 | 散热挑战 |
|---|---|---|---|---|
| HBM2 | 4-Hi | 8-Hi | 4K | 低 |
| HBM3 | 8-Hi (标准) | 12-Hi (扩展) | 8K → 12K | 中 (需 lid) |
| HBM3E | 8-Hi / 12-Hi | 16-Hi (路线图) | 8K-16K | 高 |
| HBM4 | 12-Hi (标准) | 16-Hi (高端) | 12K-16K | 高 (lidless 必选) |
| HBM4E | 16-Hi | 20-Hi (路线图) | 16K-20K | 极高 (liquid cooling) |
| HBM5 | 16-Hi / 20-Hi | (路线图) | 16K-24K | 极高 |

[来源: JEDEC HBM4 草案 + SK hynix Newsroom 2024.10]

> 12-Hi HBM3E 单 stack 36GB → 16-Hi HBM4E 单 stack 80GB, TSV 数量翻倍带来良率挑战, 这是 HBM4E 推迟到 2027 H2 的根本原因。

### 趋势 2 — 散热 lidless 设计

| 设计 | 散热能力 | 厚度 | HBM 容量上限 | 代表 |
|---|---|---|---|---|
| 有 lid (传统) | 5-10 W/stack | 1.2mm | 8-Hi | H100 / MI300X |
| **Lidless (现代)** | **15-25 W/stack** | **0.8mm** | **12-Hi / 16-Hi** | H200 / B200 |
| Lidless + TIM 优化 | 25-35 W/stack | 0.7mm | 16-Hi | Rubin (估) |
| Liquid cooling direct | 40-60 W/stack | — | 16-Hi / 20-Hi | HBM5 (估) |

[来源: ch6-appendix-detailed-tables.md + SEMI 热分析白皮书 + SK hynix HBM3E 发布]

> HBM4 12-Hi 单 stack 满载 25W, 传统 lid 散热不足以支撑, **lidless + 高导热 TIM** 成为 HBM4/4E/5 标准设计; 这也是 NVL72 整机柜必须液冷的原因之一。

### 趋势 3 — Base Die 复杂度激增

| 代次 | Base Die 工艺 | Base Die 面积 | 集成 IP 块 | 复杂度 (晶体管数, 估) |
|---|---|---|---|---|
| HBM2 | 28nm | ~100 mm² | PHY + 简单控制 | ~0.5B |
| HBM3 | 16nm | ~120 mm² | PHY + 测试 + repair | ~1B |
| HBM3E | **5nm** | ~140 mm² | PHY + 高级测试 + 监控 + 热传感 | ~3B |
| HBM4 | **4nm / 3nm** | ~160 mm² | PHY + CXL 控制器 (估) + 监控 + 加密 | ~5-6B |
| HBM5 | **3nm / 2nm** | ~180 mm² | PHY + CXL/PAM4 + AI 监控 + 安全 | ~8-10B |

[来源: Samsung DS Investor Day 2024 + SK hynix HBM4 路线图 + 公开估算]

> Base Die 复杂度爆炸: HBM5 的 base die 已接近一颗中端 CPU 复杂度, 集成 PHY + 协议控制器 + 安全模块 + 测试与监控引擎。这是 HBM 单价下不来的根本原因。

### 趋势 4 — 国产替代窗口 (18-24 个月时间差)

| 代次 | SK hynix / Samsung / Micron | 国产 (武汉新芯 + 长鑫 + 紫光得瑞) | 时间差 |
|---|---|---|---|
| HBM2e | 2019 GA | **2023 GA (昇腾 910B)** | 4 年 (慢) |
| HBM3 | 2022 GA | (研发中) | 估 4-5 年 (慢) |
| HBM3E | 2024 GA | **2026 路线图 (昇腾 610 估)** | 估 1.5-2 年 (追赶中) |
| HBM4 | 2026 GA | 估 2028+ | 估 2+ 年 |

[来源: ch7-case-studies.md §7.3 + tech-analysis-ch3-part1.md §3.1 + 长江存储 / 武汉新芯 / 长鑫公开披露]

> **关键观察**: 国产 HBM 在 HBM3E 节点"时间差缩短到 1.5-2 年", 这是因为 (1) 国产 DRAM 工艺已突破 DDR5 18nm; (2) 武汉新芯 HBM2e 量产积累; (3) 长江存储 / 紫光得瑞 / 华为深度协同。BIS 出口管制反而加速国产替代。

### 趋势 5.5 — 关键工艺挑战: TSV 深宽比 + 散热 + 良率

| 代次 | TSV 深宽比 | TSV 数量 | 单 TSV 直径 | 工艺挑战 | 良率影响 |
|---|---|---|---|---|---|
| HBM2 (8-Hi) | 10:1 | ~4,000 | 6 μm | 蚀刻 + 填充 | 良率 80-85% |
| HBM3 (12-Hi) | 15:1 | ~6,000 | 5 μm | 高深宽比蚀刻 | 良率 75-80% |
| HBM3E (12-Hi) | 18:1 | ~8,000 | 4 μm | 散热 + 翘曲 | 良率 70-75% |
| HBM4 (16-Hi) | **20:1** | **~12,000** | **3.5 μm** | 翘曲 + 信号完整性 | **良率 65-70%** (估) |
| HBM5 (16/20-Hi) | **25:1** | **~16,000** | **3 μm** | 多 TSV + 翘曲 | 良率 55-65% (估) |

[来源: SK hynix HBM3E white paper + Samsung DS Investor Day 2024 + 公开估算]

> **良率挑战**: HBM4 16-Hi 良率 65-70% 是 HBM4E 推迟到 2027 H2 的根本原因, 也是 HBM5 推迟到 2028 的关键瓶颈。每代 TSV 数量 +50%, 但工艺良率改善跟不上, 单 stack 成本曲线下行被部分抵消。

### 趋势 5 — 客户绑定与"二供"博弈

| AI 卡 | HBM 主供 (80-90%) | HBM 二供 (10-20%) | 验证中 | 绑定深度 |
|---|---|---|---|---|
| NVIDIA H100 | SK hynix (16-Hi 80%) | Samsung (20%) | Micron (少量) | SK 强绑定 |
| NVIDIA H200 | SK hynix (主供) | Samsung (12-Hi 业界首发, 2024.09) | Micron (8-Hi 二供) | 双源 |
| NVIDIA B200 | SK hynix + Samsung 共同主供 | Micron (待验证) | — | 双源并立 |
| NVIDIA Rubin | SK hynix (估主供) + Samsung | Micron (估二供) | — | 三源 |
| AMD MI300X | SK hynix (主供) | Samsung | Micron | SK 强绑定 |
| AMD MI325X | SK hynix + Samsung | Micron | — | 双源 |
| 华为昇腾 910C | 武汉新芯 (估 70%) | SK hynix (估 30%, 制裁前) | (BIS 后) | 信创切换 |

[来源: ch6-appendix-detailed-tables.md + SK hynix Newsroom + Samsung Newsroom + TrendForce 2024 H2]

> **关键观察**:
> - NVIDIA 实行 "主供 70-80% + 二供 20-30% + 三供 <5%" 三源策略, 避免单源依赖
> - 12-Hi HBM3E 是 SK hynix 与 Samsung 双雄并立, Micron 在 8-Hi 守二供
> - 国产昇腾 910C HBM2e 在 BIS 制裁后已切换到武汉新芯 + 长鑫, 信创体系自给率估 70%+

---

## 六、2026-2028 关键里程碑 (HBM 路线图)

| 季度 | 事件 | 厂商 | 影响 |
|---|---|---|---|
| **2026 Q1** | HBM3E 12-Hi 满产 (单 stack 36GB) | SK + Samsung | B200 量产, H200 升级版 |
| **2026 Q2** | HBM3E 12-Hi 翻新 48GB (双 stack 封装) | SK + Samsung | 特定客户, 增容量 |
| **2026 Q3** | HBM4 12-Hi 48GB 试样 → SK + Samsung 主供 | SK + Samsung + Micron | B300 / Rubin 试样 |
| **2026 Q4** | HBM4 12-Hi 48GB 量产 (估) | SK (主) + Samsung (主) | Rubin 量产启动 |
| **2027 H1** | AMD MI400 + HBM4 12-Hi 288GB | SK hynix | AMD 第二代进入市场 |
| **2027 H2** | HBM4E 16-Hi 80GB 试样 | SK + Samsung | Rubin Ultra 试样 |
| **2028 H1** | HBM4E 16-Hi 80GB 量产 | SK + Samsung | Rubin Ultra 量产 |
| **2028 H2** | HBM5 路线图披露, 12-Hi + 2048-bit 96GB+ | SK + Samsung + Micron | 下一代 AI 卡 |

[来源: SK hynix HBM4 路线图 + Samsung DS Investor Day 2024 + ch5-roadmap.svg 21 季度事件 + tech-analysis-ch5.md]

---

## 七、小结 — HBM 路线图五大判断

1. **HBM4 是关键节点**: 12-Hi + 2048-bit 通道 + 4nm base die 三个变量同时升级, 带宽跃升 25%, 单 stack 容量涨 33%
2. **国产 HBM 窗口期**: 昇腾 610 (HBM3E) 2026 H2 量产是关键里程碑, 时间差国际 18-24 个月
3. **HBM5 押注 16-Hi + 3nm/2nm**: 单 stack 192GB, 2030 年前主力 AI 卡显存 (Rubin Next)
4. **寡头格局稳固**: SK + Samsung + Micron 三家, 国产武汉新芯 + 长鑫挑战, 但 2028 前难撼动 SK + Samsung 主导
5. **价格曲线下行**: HBM3 → HBM4 单价持平 (容量涨抵消), 实际单位容量价格继续跌 30-50%

---

## 八、附录 — HBM 关键术语速查

| 术语 | 全称 | 含义 |
|---|---|---|
| TSV | Through-Silicon Via | 硅通孔, HBM 多层堆叠的垂直互连 |
| base die | 基础逻辑芯片 | HBM 底层逻辑控制 (PHY + 监控 + 测试) |
| 8-Hi / 12-Hi / 16-Hi | 8/12/16 层堆叠 | 单 stack 内部 DRAM die 层数 |
| Stack | 单个 HBM 封装 | 多个 DRAM die + 1 个 base die 堆叠 + TSV 互连 |
| Cube | 单 stack 内部 | 与 Stack 等价, 多见于学术 paper |
| PHY | Physical Layer | 物理层接口电路, base die 核心 IP |
| Lid | 散热盖 | HBM 顶部的金属散热片, 12-Hi+ 必须 lidless |
| lidless | 无散热盖 | H200/B200 标准设计, 散热更优, 但工艺难 |
| PAM4 | 4-level Pulse Amplitude Modulation | 4 电平脉冲幅度调制, HBM4 引入, 速率翻倍 |
| 1024-bit / 2048-bit 通道 | 总 I/O 宽 | HBM2/3 是 1024-bit, HBM4 翻倍到 2048-bit |
| JEDEC | 固态技术协会 | HBM 标准制定方 (JESD235 系列) |
| 64GT/s | 64 Giga-Transfers/sec | PCIe Gen5 等效速率, HBM PHY 接口 |
| pJ/bit | 皮焦/比特 | HBM 能效指标, HBM3E ~1.0 pJ/bit, HBM4 目标 <0.8 pJ/bit |
| ECC | Error-Correcting Code | HBM 内部纠错码, 12-Hi+ 必须支持 |
| MRS | Mode Register Set | HBM 内部模式寄存器, 配置速率/时序 |

[来源: JEDEC HBM spec 摘要 + SK hynix white paper + 公开术语表]

[来源: 综合 ch1-ch7 + ch6-appendix-detailed-tables.md 表 A + SK hynix Newsroom + Samsung DS Investor Day 2024]