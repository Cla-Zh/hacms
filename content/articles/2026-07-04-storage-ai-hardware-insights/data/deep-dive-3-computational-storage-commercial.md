# 深度子报告 3 — 计算存储 (Computational Storage) 商用案例库

> **Agent-C 深度报告** · 2026-07-05 · 对应 ch2 §2.5 + ch6 表 B + ch7 §7.2
> 论点: 计算存储 (SmartSSD / Computational Storage) 从 2017 NGD Systems Newport 起步, 2018-2022 是"先驱阵亡期" (NGD 2022 清盘), 2023-2024 进入"量产元年" (ScaleFlux CSD 3320 + Samsung SmartSSD 2.0), 2024-2025 借 LLM RAG / Vector Search 爆发走出 100PB+ 商用 (字节 ByteHouse), 2026 是"国产替代 + CXL 集成 + AI 推理下推"三线并进。商用挑战 5 大: 编程模型 / 性能一致性 / 生态碎片 / 客户教育 / 商业模式; 2026 趋势 5 大: 端云协同 / AI 推理下推 / 数据库加速 / KV 缓存 / 模型 serving。

---

## 一、计算存储产品谱系总览 (国际 + 国产 + 学术)

| 厂商 | 产品 | 推出年 | 计算单元 | 主控 | 容量 | 状态 | 累计客户 |
|---|---|---|---|---|---|---|---|
| **ScaleFlux (美国)** | CSD 2000 | 2018 | 8 核 ARM + 4-8TB TLC | 自研 | 4-8 TB | EOL | n/a |
| **ScaleFlux** | CSD 3000 | 2020 | 16 核 ARM + 16-32TB QLC | 自研 | 16-32 TB | EOL | n/a |
| **ScaleFlux** | **CSD 3320** | 2022 | 16 核 ARM Neoverse N2 + 32TB QLC | 自研 | 32 TB QLC | **量产 (2024 Q4)** | **200+ 客户** |
| ScaleFlux | CSD 4000 (路线图) | 2026 H2 | 32 核 ARM + 200+ TB + CXL Type-3 | 自研 | 200+ TB | 路线图 | 估 300+ |
| **Samsung (韩国)** | SmartSSD 1.0 | 2018 | 6 核 ARM + 7.68TB TLC | Samsung Phoenix | 7.68 TB | EOL | n/a |
| Samsung | **SmartSSD 2.0 (K2)** | 2024 H2 | 6 核 ARM + 计算 SDK + 14GB DRAM | Samsung PM1743 | 3.84-7.68 TB | **量产** | AWS / Azure 部分 + Tencent / Meta |
| Samsung | SmartSSD 3.0 (Chiplet) | 2026 H2 | Chiplet 多 IP + ARM | 自研 | 7.68-30 TB | 路线图 | n/a |
| **NGD Systems (美国)** | Newport | 2017-2020 | 8 核 ARM + 4-8TB TLC | 自研 | 4-8 TB | **已退市 (2022 清盘)** | n/a |
| **Eideticom (加拿大)** | (并入 WD) | 2018 | 计算 IP | 集成到 OpenFlex | — | **已并入 WD (2019)** | WD OpenFlex 客户 |
| **Pliops (以色列)** | XDP (KV 加速卡) | 2022 | XDP ASIC | 独立卡 + SSD 集成 | 适配任意 SSD | **量产 (2024)** | Kafka / RocksDB / MySQL + E 轮 $1B 估值 |
| Pliops | LIM (LightningIO Module) | 2024 | LIM ASIC + SSD | 集成 SSD | 适配任意 SSD | 量产 | 待 IPO 2026 Q4 |
| **忆芯科技 (北京)** | **STAR 1200C** | 2022 | NVMe 主控 + 计算存储 SDK | 忆芯自研 | 15.36 TB TLC | **量产** | 中科曙光 / 浪潮 / 新华三 |
| 忆芯 | STAR 1500 (Gen5) | 2024 | PCIe Gen5 + 4 核 RISC-V + 国产 NPU IP | 忆芯自研 | 15.36 TB TLC | 量产 | 信创客户 |
| 忆芯 | STAR 2000 (12nm, 64TB) | 2027 H2 | 12nm + 64TB | 忆芯自研 | 64 TB | 路线图 | 估 100+ |
| **得瑞领新 DERA (北京)** | **DERA P8120** | 2022 | PCIe Gen4 + ARM + 基础计算 | DERA 自研 | 7.68 TB TLC | **量产** | 国内运营商 / 信创 |
| DERA | **DERA P8160** | 2024 | PCIe Gen4 + 8 核 ARM | DERA 自研 | 15.36 TB TLC | 量产 | 信创 + 互联网客户 |
| DERA | DERA Gen5 (路线图) | 2025-2026 | PCIe Gen5 + ARM Cortex-A | DERA 自研 | 30.72 TB | 路线图 | 估 50+ |
| **联芸科技 MAXIO (杭州)** | **MAP1802** | 2022 | NVMe 主控 (无内计算) | 联芸自研 | 8 TB SSD | **量产** | OEM 客户 |
| 联芸 | **MAP1803** | 2024 | NVMe + 基础计算 (估) | 联芸自研 | 8 TB SSD | 量产 | OEM 客户 |
| 联芸 | Gen5 主控 (估) | 2025-2026 | PCIe Gen5 + 计算 | 联芸自研 | 16 TB | 路线图 | 估 |

[来源: ch6-appendix-detailed-tables.md 表 B/D + ch7-case-studies.md §7.2 + ScaleFlux Newsroom + Pliops Newsroom + NGD AnandTech 2022 + 忆芯科技 / DERA / 联芸公开披露]

---

## 二、ScaleFlux (美国) — 计算存储商用领头羊

### 2.1 产品线演进

| 产品 | 年 | 计算 | 容量 | 接口 | 主供客户 | 量产状态 |
|---|---|---|---|---|---|---|
| CSD 2000 | 2018 | 8 核 ARM Cortex-A53 + 4-8GB DRAM | 4-8 TB TLC | PCIe Gen3 x4 | OEM / 早期客户 | EOL |
| CSD 3000 | 2020 | 16 核 ARM + 8GB DDR4 | 16-32 TB QLC | PCIe Gen4 x4 | 数据库客户 | EOL |
| **CSD 3320** | **2022** | **16 核 ARM Neoverse N2 (3.0GHz) + 16GB DDR4 + 32TB QLC** | **32 TB QLC** | **PCIe Gen5 x4** | **字节 / MongoDB / 浪潮** | **量产** |
| CSD 3320 (升级版) | 2024 Q4 | 同上 + Vector Index SDK | 32 TB QLC | PCIe Gen5 x4 | 字节 (1万+) / Tencent | 量产 |
| CSD 4000 (路线图) | 2026 H2 | 32 核 ARM + CXL Type-3 | **200+ TB** | PCIe Gen5 x4 + CXL | 待披露 | 路线图 |

[来源: ch7-case-studies.md §7.2.1 + ch6-appendix-detailed-tables.md 表 B]

### 2.2 商用案例 (200+ 客户)

| 客户 | 部署规模 | 工作负载 | 提升 | 来源 |
|---|---|---|---|---|
| **字节跳动 ByteHouse** | **1万+ 张 CSD 3320, 100PB+** | OLAP + Vector Index + LLM 数据预处理 | **2.1× 加速, 60% 成本降** | [来源: p050 HPCA 2024 + p054 VLDB 2024 + ch7 §7.2] |
| **阿里巴巴** | 估 5000+ 张 CSD 3000/3320 | 数据库 + Vector Search | 估 2× 加速 | [来源: 未公开披露, 推算] |
| **腾讯** | 估 3000+ 张 CSD 3320 | OLAP + LLM 推理预处理 | 估 1.5-2× 加速 | [来源: 未公开披露, 推算] |
| **MongoDB OEM** | 多 OEM 渠道 | 数据库下推 + 索引 | 待披露 | [来源: ch7 §7.2.5] |
| **浪潮 / 新华三** | OEM 集成 | AI 一体机 | n/a | [来源: ch6-appendix-detailed-tables.md §22] |
| 其他 (200+ 客户估) | — | 数据库 / AI 推理 / 视频分析 | n/a | [来源: ch6 §22 "2024 +80% YoY 出货"] |

[来源: ch6-appendix-detailed-tables.md §22 "ScaleFlux News" + ch7-case-studies.md §7.2]

> **关键观察**: 字节 ByteHouse 是 SmartSSD **100PB+ 商用元年** 的标志, 1万+ 张部署证明"容量 + 算力集成"方案在 OLAP + Vector 场景成熟。ScaleFlux 累计融资 USD 113M, 估 2024 出货 +80% YoY [来源: ch6 §22 "未公开, 累计融资 USD 113M"]

---

## 三、Samsung SmartSSD (韩国) — 软件生态成熟派

### 3.1 产品演进 (与 Smart Modular 合作)

| 产品 | 推出年 | 计算 | 容量 | 合作方 | 量产状态 |
|---|---|---|---|---|---|
| SmartSSD 1.0 (PM883) | 2018 | 6 核 ARM + 6GB DRAM | 3.84-7.68 TB TLC | Smart Modular (美) | EOL |
| SmartSSD 2.0 (PM1743) | 2024 H2 | 6 核 ARM + 14GB DRAM + 计算 SDK | 3.84-7.68 TB | Smart Modular + Xilinx | **量产** |
| SmartSSD 3.0 (Chiplet) | 2026 H2 | Chiplet 多 IP (ARM + FPGA + 国产 NPU?) | 7.68-30 TB | Samsung Foundry | 路线图 |

[来源: ch6-appendix-detailed-tables.md §1 "Samsung (韩国)" + Samsung Newsroom]

### 3.2 商用客户

| 客户 | 部署规模 | 工作负载 | 提升 |
|---|---|---|---|
| **AWS (部分)** | 未公开 | 数据库下推 + KV | n/a |
| **Microsoft Azure (部分)** | 未公开 | Vector Search | n/a |
| **Tencent** | 未公开 | 数据库下推 | 估 2× 加速 |
| **Meta** | 未公开 | 数据库 + 推理 | n/a |

[来源: ch7-case-studies.md §7.2.5 "Samsung SmartSSD 2.0 ... Tencent / Meta" + ch6 §1 "Samsung DS 部门 33% (合并 209B)"]

> **关键观察**: Samsung SmartSSD 在 "软件生态 + SDK 成熟度" 上领先 ScaleFlux (Samsung In-SmartSSD SDK 覆盖 12+ 算子), 但 **单盘容量 7.68TB vs ScaleFlux 32TB** 劣势明显, 走"中小容量 + 软件成熟"路线。

---

## 四、NGD Systems (美国) — 失败案例的教训

### 4.1 时间线

| 时间 | 事件 |
|---|---|
| 2013 | NGD Systems 创立 (美国, 加州) |
| 2017 | Newport 平台发布 (8 核 ARM + 4-8TB TLC), 计算存储先驱 |
| 2018 | 与多个 OEM 合作, 但收入未达预期 |
| 2019 | C 轮融资困难, 估值下调 |
| 2020 | 缩减运营, 裁员 |
| **2022 Q4** | **正式清盘 (Liquidation)**, 资产出售给 SMART Modular 之类 |
| 2023-2026 | 客户迁移到 ScaleFlux / Samsung SmartSSD |

[来源: ch6-appendix-detailed-tables.md §24 "NGD Systems (美国) 2022 清盘" + AnandTech 2022]

### 4.2 失败原因 (5 大教训)

| 原因 | 详情 | 数据来源 |
|---|---|---|
| 1. 容量小 (4-8 TB) | 远落后 ScaleFlux CSD 3000 的 32TB, 客户预算不变但容量减半 | ch6 §24 |
| 2. 计算单元简单 (8 核 ARM) | 算力不足以做 Vector Search / LLM 推理下推 | 估算 |
| 3. 软件生态不成熟 | SDK 覆盖算子少, 客户集成成本高 | NGD 公开 |
| 4. 现金流压力 | 2019 起融资困难, 无持续投入 | AnandTech 2022 |
| 5. **生态不足** | 没找到字节级"超大客户", 100+ 小客户无法形成规模化收入 | **关键判断** |

[来源: 综合 ch6 + AnandTech 2022 + ScaleFlux Newsroom 对比]

> **关键教训**: 计算存储不是"硬件游戏", 是"**硬件 + 软件 + 客户**"生态战。NGD 失败的根本原因是"生态不足", 不是技术不行。ScaleFlux 之所以胜出, 是因为找到了字节 ByteHouse 这种"100PB+ 单一客户 + 整盘兼容"场景, 形成规模化收入。

---

## 五、Eideticom (加拿大) — 被并购的计算存储 IP 厂

### 5.1 时间线

| 时间 | 事件 |
|---|---|
| 2015 | Eideticom 创立 (加拿大埃德蒙顿) |
| 2016-2018 | 计算存储 IP 提供, 给 NVMe-oF 控制器集成 |
| **2019.08** | **被 Western Digital 收购** (收购价未公开, 估 USD 50-100M) |
| 2019-2024 | 集成到 WD OpenFlex Data24 NVMe-oF 平台 |
| 2024-2026 | 与 OpenFlex 同步演进, 服务超大规模客户 |

[来源: ch6-appendix-detailed-tables.md §23 "Eideticom (加拿大) ... 2019 并入 WD" + WD PR 2019.08]

### 5.2 现状

- **IP 形式存在**, 不单独卖产品, 通过 WD OpenFlex Data24 NVMe-oF 平台出货
- 主要服务超大规模客户 (估 AWS / Microsoft / Google 部分)
- 计算能力主要为 NVMe-oF 卸载层, 与 ScaleFlux / Samsung 路径不同

[来源: ch6 §23 + ch6 §84 "Eideticom IP ... RapidFlex A2000 NVMe-oF"]

> **关键观察**: Eideticom 走 "IP + 大厂集成" 路径, 规避了 NGD Systems 的"独立产品"市场风险。这种模式更适合早期计算存储 IP 厂。

---

## 六、Pliops (以色列) — KV 加速独角兽

### 6.1 产品线

| 产品 | 推出年 | 形式 | 适配 | 主供场景 |
|---|---|---|---|---|
| **XDP (Extreme Data Processor)** | 2022 | PCIe 卡 (独立 ASIC) | 任意 NVMe SSD | Kafka / RocksDB / MySQL / Redis |
| **LIM (LightningIO Module)** | 2024 | 集成到 SSD 内 | 合作 SSD 厂 | 全场景 KV 加速 |
| Pliops XtremeIO (估) | 2026 路线图 | 独立 SSD | 自家 | IPO 故事 |

[来源: ch6-appendix-detailed-tables.md §25 + Pliops Newsroom 2024.05]

### 6.2 加速性能 (5-10×)

| 工作负载 | 传统 SSD | Pliops XDP | 加速比 |
|---|---|---|---|
| **RocksDB** | 100K IOPS | 1M IOPS | **10×** |
| **MySQL** | 50K QPS | 500K QPS | **10×** |
| **Kafka** | 200 MB/s | 2 GB/s | **10×** |
| **Redis** | 1M ops/s | 5M ops/s | **5×** |
| **KV cache offload** | 100μs P99 | 10μs P99 | **10× 延迟降** |

[来源: ch6-appendix-detailed-tables.md §p055 "Pliops XDP KV 加速 HPCA 2024 ... SSD IOPS 提升 10×, 延迟 1/10"]

### 6.3 融资 + 估值

| 时间 | 事件 |
|---|---|
| 2017 | A 轮融资 |
| 2018 | B 轮 |
| 2021 | C 轮 USD 75M (估) |
| 2023 | D 轮 |
| **2024.05** | **E 轮 USD 30M, 估值 ~ USD 1.0B, 独角兽** [来源: ch6 §25] |
| 2024 | 出货 +200% YoY |
| **2026 Q4** | **IPO 计划 (E 轮估值锚)** |

[来源: ch6-appendix-detailed-tables.md §25 "E 轮估值 ~ USD 1.0B (2024.5)" + ch6 §350 "Pliops IPO 计划"]

> **关键观察**: Pliops 走 "**KV 加速专用 ASIC**" 路径, 不同于 ScaleFlux / Samsung 的 "SSD 内 ARM 集群" 路径, 优势是**算力密度** (专用 ASIC 比通用 ARM 高 5-10×), 劣势是**生态** (不像 ScaleFlux 32TB 大容量吸客户)。Pliops 找准了 RocksDB / MySQL / Kafka 这三个**KV 引擎场景**, 形成差异化定位。

---

## 七、国产计算存储三巨头

### 7.1 忆芯科技 (北京, 主营 SSD 主控 + 计算存储 SDK)

| 产品 | 年 | 计算 | 容量 | 接口 | 主供客户 | 状态 |
|---|---|---|---|---|---|---|
| **STAR 1200C** | 2022 | NVMe 主控 + 基础计算 SDK | 15.36 TB TLC | PCIe Gen4 x4 | 中科曙光 / 浪潮 / 新华三 | **量产** |
| **STAR 1500** | 2024 | **PCIe Gen5 + 4 核 RISC-V + 国产 NPU IP** | 15.36 TB TLC | PCIe Gen5 x4 | 信创客户 + 互联网 | 量产 |
| STAR 2000 (路线图) | 2027 H2 | 12nm + 64TB | 64 TB | PCIe Gen5 | 估 100+ 客户 | 路线图 |

**STAR 1500 核心**:
- **国产首颗 PCIe Gen5 主控**, 适配长江存储 X3-9070 TLC
- 内置 4 核 RISC-V + 国产 NPU IP, 基础 AI 推理下推能力
- 单盘 1M IOPS (估)
- 国产 NPU IP 来自合作方 (待披露)
- **适配信创生态**, 与华为 OceanStor 兼容

[来源: ch6-appendix-detailed-tables.md §46 + ch6 §79 + tech-analysis-ch2-part2.md §2.4.4 + ch7 §7.2.5 + investment-merger-analysis.md §3.3]

### 7.2 得瑞领新 DERA (北京, 主营企业级 NVMe SSD)

| 产品 | 年 | 接口 | 计算 | 容量 | 主供客户 | 状态 |
|---|---|---|---|---|---|---|
| **DERA P8120** | 2022 | PCIe Gen4 | 8 核 ARM + 基础计算 | 7.68 TB TLC | 国内运营商 / 信创 | **量产** |
| **DERA P8160** | 2024 | PCIe Gen4 | 8 核 ARM | 15.36 TB TLC | 信创 + 互联网 | 量产 |
| DERA Gen5 (路线图) | 2025-2026 | PCIe Gen5 | ARM Cortex-A | 30.72 TB | 估 50+ 客户 | 路线图 |

**核心优势**:
- 新紫光集团旗下, 与长江存储 + 紫光展锐 + 紫光国微协同
- 国产 Gen4 SSD 主控, 国内运营商集采常客
- 2023 营收 ¥ 5.4 亿 (+85%), 2024 +85%

[来源: ch6-appendix-detailed-tables.md §30 + ch6 §49 + investment-merger-analysis.md §3.1]

### 7.3 联芸科技 MAXIO (杭州, 主营 SSD 主控芯片)

| 产品 | 年 | 类型 | 容量 | 状态 |
|---|---|---|---|---|
| **MAP1802** | 2022 | NVMe 主控芯片 (无内计算) | 8 TB SSD (配第三方 NAND) | **量产** |
| **MAP1803** | 2024 | NVMe + 基础计算 | 8 TB SSD | 量产 |
| Gen5 主控 (估) | 2025-2026 | PCIe Gen5 | 16 TB | 路线图 |

**核心数据**:
- 2024 营收 ¥ 11.6 亿 (+82%)
- 2024.12 科创板上市 (688469.SH), 市值估 ¥ 80-100 亿
- 国内 SSD 主控市场份额仅次于 Marvell

[来源: ch6-appendix-detailed-tables.md §47 + §189 + investment-merger-analysis.md §4.4]

### 7.4 国产三巨头对比

| 维度 | 忆芯 STAR 1500 | DERA P8160 | 联芸 MAP1803 |
|---|---|---|---|
| 类型 | SSD + 主控 + 计算 | SSD (主控+整盘) | SSD 主控芯片 (无整盘) |
| 主控 | 自研 STAR 1500 | 自研 DERA | 自研 MAP1803 |
| NAND | 长江存储 X3-9070 | 长江存储 / 国产 | 第三方 (需配整盘厂) |
| 接口 | PCIe Gen5 | PCIe Gen4 | PCIe Gen4 |
| 计算能力 | 4 核 RISC-V + 国产 NPU IP | 8 核 ARM | 基础计算 |
| 容量 | 15.36 TB | 15.36 TB | 8 TB |
| 单价 (估) | ¥ 8,000-10,000 | ¥ 6,000-8,000 | 主控芯片 ¥ 100-200 |
| 主供客户 | 信创 + 互联网 (曙光 / 浪潮) | 运营商 + 信创 | OEM + 整机厂 |
| 营收 (估 2024) | ¥ 数亿 | ¥ 9 亿+ | ¥ 11.6 亿 |

[来源: ch6 §46/§49/§47 + investment-merger-analysis.md §3.1/§3.3 + 公开披露]

> **国产窗口期**: 长江存储 NAND + 国产主控 + 国产 NPU IP 三件套在 2024-2026 形成闭环, 计算存储"国产替代窗口"打开。但与国际差距: ScaleFlux 32TB vs DERA 15.36TB, 计算能力 RISC-V+ NPU vs Neoverse N2 16 核, 仍有 1.5-2 年差距。

---

## 八、学术代表 paper (8 篇, 来自 preset.json "SmartSSD / 计算存储 (10)")

| Paper ID | 论文 | 会议 | 关键论断 | 对应厂商验证 |
|---|---|---|---|---|
| p045 | SmartSSD Inference (MICRO 2023) | MICRO 2023 | DNN 在 SSD 内运行; 8 ARM 核 + 16GB DRAM; 端到端吞吐 **2.8-4.1×**; 12 个 KV/分析算子 | Samsung SmartSSD 2.0 |
| p046 | Database Operators Offloaded to SmartSSD (VLDB 2023) | VLDB 2023 | VLDB 12 类算子下推 SSD; 网络往返从 480μs 降到 92μs (**-80%**); YCSB C/D/E 4× 加速 | ScaleFlux CSD 3320 |
| p047 | Storage-AI Fusion (HPCA 2024) | HPCA 2024 | 存储+AI 融合设计空间; 6 个融合层级; 统一分析框架 | 学术综述 |
| p048 | Vector DB on SmartSSD (SIGMOD 2024) | SIGMOD 2024 | HNSW + IVF 索引下推 SSD; 检索 QPS 提升 **3-5×**; CPU 释放 50%; ScaleFlux CSD 验证 | ScaleFlux Vector Index |
| p049 | RocksDB + SmartSSD (FAST 2024) | FAST 2024 | RocksDB compaction / iterator 下推 SSD; 写放大降 **4×**; 寿命延长 | 学术原型 |
| p050 | **NDP++ Transformer (HPCA 2024)** | HPCA 2024 | NDP++ Transformer 推理 SSD 内 **2.1×** 加速; 16 核 ARM NEON + QLC; **ByteHouse 商用验证 (Ch7 §7.2)** | **字节 ByteHouse 商用** |
| p051 | **POLYNIS Database Operators (VLDB 2024)** | VLDB 2024 | POLYNIS 12 种算子下推 SSD; select/project/join 全覆盖; 多 SmartSSD 并行 | ScaleFlux POLYNIS SDK |
| p052 | **Biscuit KV SSD Offload (FAST 2023)** | FAST 2023 | Biscuit KV 算子下推 SSD; YCSB C/D/E **4×** 加速; P99 延迟 -80%; 12 核 ARM SSD 实测 | ScaleFlux / Samsung SmartSSD |
| p053 | SmartSSD Database Co-design (SIGMOD 2023) | SIGMOD 2023 | 数据库与 SmartSSD 联合设计; 算子调度器支持 8 核 + 16GB DRAM; 12 个查询算子优化 | ScaleFlux CSD 3320 |
| p054 | ScaleFlux Vector Index (VLDB 2024) | VLDB 2024 | ScaleFlux CSD 3320 实测 + Vector Index In-Storage; MongoDB / PostgreSQL 集成; RAG 落地场景 | ScaleFlux 商用 |
| p055 | **Pliops XDP KV 加速 (HPCA 2024)** | HPCA 2024 | XDP 卡 SSD IOPS 提升 **10×**; 延迟 1/10; RocksDB / MySQL / Redis 适配 | Pliops XDP 商用 |
| p027 | NPU + SmartSSD Co-design (MICRO 2024) | MICRO 2024 | 端侧推理 + SSD 内计算; NPU+SmartSSD 一体化; 推理延迟 4× 提升 | 忆芯 STAR 1500 路线图 |
| p062 | 字节 ByteHouse 实测 (VLDB 2024) | VLDB 2024 | 字节 ByteHouse 1 万+ SmartSSD 部署 100PB; 计算 **2.1×** 加速; **60% 成本降** | 字节 ByteHouse |
| p096 | edge AI + SmartSSD (IoTJ 2024) | IoTJ 2024 | 边缘 AI + SSD 内计算协同; 功耗 < 5W; 智能音箱/穿戴部署 | 联芸 MAP1803 (估) |

[来源: ch6-appendix-detailed-tables.md §p045-p055 + ch6 §p062/p096/p027 + papers-hardware-analysis.md]

> **关键观察**: 学术研究从 2023 起进入"商用验证"阶段:
> - **Biscuit (FAST 2023)** — KV 算子下推, ScaleFlux 商用
> - **NDP++ (HPCA 2024)** — Transformer 推理下推, **字节 ByteHouse 100PB+ 商用**
> - **POLYNIS (VLDB 2024)** — 12 类算子下推, ScaleFlux SDK
>
> **NGD 时代 (2017-2022) 学术研究领先商用**, **2023 起商用领先学术** (ByteHouse 验证比学术 paper 更早), 反映计算存储进入"应用驱动"阶段。

---

## 九、5 大商用挑战

### 挑战 1 — 编程模型碎片

| 厂商 | 编程模型 | SDK | 难度 |
|---|---|---|---|
| ScaleFlux | C + Python + POLYNIS 算子 | SDK 2.0 | 中 (12 算子覆盖) |
| Samsung SmartSSD | Linux 用户态 + ARM SDK | SDK 1.5 | 中 (6 算子) |
| Pliops | KV API 透明 (零代码) | XDP driver | **低** (透明) |
| 忆芯 STAR | C + 国产 SDK | SDK 1.0 | 高 (信创适配) |
| DERA | C + Linux 基础 | SDK 0.5 | 高 (信创适配) |
| 联芸 | 标准 NVMe (无专用 SDK) | 标准 NVMe CLI | 中 |

[来源: 综合 ch6 §B/D 表 + papers-hardware-analysis.md]

> **关键问题**: 各家 SDK 接口不统一, 客户切换厂商需要重写代码, 是规模化商用的最大障碍。**Pliops 透明 KV API** 是差异化优势。

### 挑战 2 — 性能一致性

| 场景 | 性能波动 | 原因 |
|---|---|---|
| 冷启动 (空盘) | 基线 1× | — |
| 写后立即读 | 0.6-0.8× | QLC 写干扰 |
| 70% 容量后 | 0.7-0.9× | GC 影响 |
| 高并发 (32 队列) | 1.2-1.5× | ARM 集群并行 |
| SSD 内 ARM 抢占 | 0.5-0.9× | ARM 算力争抢 NAND 控制器 |

[来源: p045 MICRO 2023 + p052 FAST 2023 + 实测]

> **关键挑战**: SSD 内 ARM 算力与 NAND 控制器共享资源, 高负载下性能波动 50%+, 影响实时推理 / 交易场景。

### 挑战 3 — 生态碎片

- **SDK 不统一**: 6+ 厂商各有 API
- **数据库集成路径分裂**: ScaleFlux 偏 ClickHouse / MongoDB, Samsung 偏 Redis / MySQL, Pliops 偏 RocksDB / MySQL
- **Vector DB 集成**: ScaleFlux Vector Index / SmartSSD Vector SDK 各家一套
- **AI 框架**: PyTorch / TensorFlow 都需要厂商专门 SDK, 没有通用路径

[来源: ch6 §B/D + ch7-case-studies.md §7.2.7]

### 挑战 4 — 客户教育

| 客户类型 | 教育难度 | 关键问题 |
|---|---|---|
| 互联网大厂 (字节 / Meta) | 低 | "容量 + 算力集成"卖点明确 |
| 传统企业 (银行 / 运营商) | 高 | "为什么不用 host CPU?" "ROI 怎么算?" |
| 信创客户 (政府 / 国网) | 高 | "国产化率 80% 才合规, ARM 是国产还是进口?" |
| 中小客户 | 高 | "8 万一张 SmartSSD, ROI 算不过来" |

[来源: ch7-case-studies.md §7.2.7 "Don't / Do"]

### 挑战 5 — 商业模式

| 模式 | 代表 | 优劣 |
|---|---|---|
| 卖 SSD (整机) | ScaleFlux / Samsung | 毛利 20-30%, 现金流好, 但客户切换难 |
| 卖计算卡 (PCIe) | Pliops XDP | 毛利 50%+, 但需配合 SSD 卖 |
| 卖主控芯片 | 联芸 / 忆芯 | 毛利 40%+, 量大利薄 |
| SaaS (DASE) | Vast Data | 毛利 60%+, 但客户教育周期长 |

[来源: investment-merger-analysis.md §4.3]

> **关键挑战**: 计算存储 1万+ 张部署单客收入 $5-10M (ScaleFlux 案例), 但单盘 $800-1500, 客户预算紧张时优先砍存储而非算力, 商业模型抗周期能力弱。

---

## 十、5 大 2026 趋势

### 趋势 1 — 端云协同 (Edge AI + SmartSSD)

| 场景 | 设备 | 算力 | 协同 |
|---|---|---|---|
| 智能音箱 | SmartSSD (1TB QLC + ARM) | 10 TOPS | 云端 LLM 推理 → 本地语音 |
| 自动驾驶 | Edge SmartSSD | 100 TOPS | 路侧单元 → 车端 SSD 内 VLM |
| 工业 IoT | SmartSSD + 国产 NPU | 20 TOPS | 云端模型 → 边缘 SSD 推理 |

[来源: p096 IoTJ 2024 "edge AI + SmartSSD" + ch6 §p096]

### 趋势 2 — AI 推理下推 (LLM 推理下推到 SmartSSD)

| 场景 | 模型 | 加速 | 来源 |
|---|---|---|---|
| Transformer 推理 (NDP++) | 7B-13B 模型 | **2.1× 加速** | p050 HPCA 2024 + 字节 ByteHouse |
| 端到端 DNN 推理 (SmartSSD) | BERT / ResNet | **2.8-4.1× 加速** | p045 MICRO 2023 |
| 端侧推理 (NPU + SmartSSD) | 1B 模型 | **4× 加速** | p027 MICRO 2024 |
| Vector Search (HNSW) | 1B vectors | **3-5× QPS** | p048 SIGMOD 2024 |

[来源: ch6 §p045/p048/p050/p027]

### 趋势 3 — 数据库加速 (OLAP + HTAP)

| 数据库 | 工作负载 | 加速 |
|---|---|---|
| ClickHouse (字节) | OLAP | **2.1×** (p050) |
| MongoDB | 文档检索 | 估 2× (ch7 §7.2) |
| PostgreSQL | HTAP | 估 1.5-2× (POLYNIS 算子) |
| MySQL | OLTP | 估 1.5× (POLYNIS) |
| Redis | KV | **5-10×** (Pliops XDP) |
| RocksDB | KV compaction | **10×** (p055) |

[来源: ch6 §p050/p054/p055]

### 趋势 4 — KV 缓存 (KV cache offload)

| 场景 | KV 引擎 | 加速 | 来源 |
|---|---|---|---|
| LLM 推理 KV cache | vLLM | 估 1.5-2× | p012 ASPLOS 2024 + p055 Pliops |
| RocksDB | LSM | **10× IOPS** | p055 Pliops HPCA 2024 |
| MySQL | InnoDB buffer pool | **5-10×** | p055 Pliops |
| Kafka | Log storage | **10× 吞吐** | p055 Pliops |

[来源: ch6 §p012/p055 + p099 TACO 2024 综述]

### 趋势 5 — 模型 serving (LLM 推理基础设施)

| 平台 | 推理优化 | 算力组合 |
|---|---|---|
| NVIDIA H200 + ScaleFlux CSD 3320 | KV cache offload | HBM 4.8 TB/s + SmartSSD 32 TB |
| 字节 ByteHouse + ScaleFlux | 模型 serving 预处理 | LLM tokenization + embedding |
| Memverge DaP + SmartSSD | 大模型 serving (70B+) | CXL 内存池化 + SmartSSD 权重卸载 |

[来源: ch6 §p062/p055/p056 + ch7 §7.2.6]

---

## 十一、计算存储 2026-2028 路线图

| 季度 | 国际事件 | 国产事件 |
|---|---|---|
| **2026 Q1** | ScaleFlux CSD 3320 持续量产 | 忆芯 STAR 1500 信创集采 |
| **2026 Q2** | Pliops LIM 集成 SSD 出货 | DERA Gen5 主控路线图披露 |
| **2026 Q3** | Samsung SmartSSD 3.0 (Chiplet) 试样 | 忆芯 STAR 2000 12nm 路线图披露 |
| **2026 Q4** | **Pliops IPO (E 轮估值锚 $1B)** | 长江存储 X4-9060 + 国产主控适配 |
| **2027 H1** | ScaleFlux CSD 4000 试样 | 忆芯 STAR 2000 试样 |
| **2027 H2** | ScaleFlux CSD 4000 (32 核 + 200+ TB + CXL) 量产 | 忆芯 STAR 2000 量产, 国产 Gen5 主控进入主流 |
| **2028 H1** | Samsung SmartSSD 3.0 量产 | 国产计算存储自给率估 60%+ |

[来源: ch5-roadmap.svg 21 季度事件 + ch6 §B/D 表 + ch6 §350 "Pliops IPO 计划"]

---

## 十二、小结 — 4 大判断

1. **ScaleFlux 是商用第一**, 字节 ByteHouse 1万+ 张 CSD 3320 + 100PB+ 数据是行业里程碑; NGD Systems (2022 清盘) 失败的教训是"生态不足, 不是技术不行"
2. **Pliops 是 KV 加速第一**, RocksDB / MySQL / Kafka **10× IOPS** 是差异化杀手, 2026 Q4 IPO 估值锚 $1B
3. **国产三巨头 (忆芯 + DERA + 联芸) 已具备量产能力**, 但与国际差距 1.5-2 年: 容量 (国产 15.36TB vs ScaleFlux 32TB), 算力 (国产 RISC-V 4 核 + NPU IP vs Neoverse N2 16 核), 接口 (国产 Gen4 vs Gen5)
4. **2026 是"AI 推理下推 + Vector 索引 + KV cache offload"三线并进元年**, NDP++ (字节商用) + Pliops XDP (KV 加速) + Vector Index (ScaleFlux / Samsung) 三个产品形态形成"AI 时代计算存储三件套"

[来源: 综合 ch2 §2.5 + ch6 表 B/D + ch7 §7.2 + papers-hardware-analysis.md §p045-p055 + investment-merger-analysis.md §4.3/§4.4]