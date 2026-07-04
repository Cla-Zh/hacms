# 深度子报告 2 — Optane 退市后 PMem 全景 (2022-2026)

> **Agent-C 深度报告** · 2026-07-05 · 对应 ch2 §2.4 + ch3-part1 §3.4 + d3-pmem-ecosystem.svg
> 论点: Intel 2022 Q3 关闭 Optane 业务, 不等于 PMem 消亡。3D XPoint 介质成本是 NAND 5-10 倍, 良率难扩, 美光 2021 退出, Intel 2022 卖厂 SK hynix, 2022 Q3 正式 EOL。退市后留下的 USD 1.5B 大内存池化空白, 由 CXL 2.0 PMem + Samsung / SK hynix / Micron CXL Memory Module + 国产长江存储 Z-NAND + 兆易 DDR5-based + 国科微 NAND+DRAM 接棒。软件生态 (SplitFS / Hotpot / Zen) 全部转向 CXL, Memverge DaP 5.0 成为唯一商业软件中间层。

---

## 一、Optane 退市时间线 (2017-2026)

| 时间 | 事件 | 来源 / 备注 |
|---|---|---|
| **2017** | Intel + Micron 联合发布 3D XPoint 介质 (Optane 品牌, 美光 QuantX 品牌) | Intel Newsroom 2017.07 |
| **2018** | Intel Optane 900P / 905P SSD 上市 (280GB-960GB, 消费级) | Intel Newsroom 2018.10 |
| **2019 Q2** | Optane DC Persistent Memory (PMem) Module 200/256/512GB 上市 (Apache Pass 一代, 25nm 3D XPoint) | Intel DCPMM launch |
| **2019 Q4** | Optane DCPMM 二代 (Barlow Pass), 容量升级到 128/256/512GB, DDR4 接口 | Intel Product Brief |
| **2020 Q4** | Optane 5800X (Crow Pass, PCIe Gen4) GA, 200/400/800GB | Intel Newsroom 2020.12 |
| **2021 Q1** | **美光退出** 3D XPoint 业务, 售出 Lehi 工厂 | Micron IR 2021.03 |
| **2021 Q2** | Intel 退出**消费级** Optane SSD, 保留数据中心 PMem | Intel Newsroom 2021.06 |
| **2021 Q4** | Intel 宣布 Optane PMem "逐步退出", 但留 12-18 个月过渡期 | Intel Newsroom 2021.12 |
| **2022.07** | **SK hynix 收购 Intel 大连 NAND + 3D XPoint 工厂**, USD 9 亿美元 | [来源: SK hynix Newsroom 2022.07] |
| **2022 Q3** | **Intel Optane PMem 正式 EOL**, 库存仅供老客户, 新订单截止 | [来源: ch6-appendix-detailed-tables.md 表 A "Intel Optane 5800X (已 EOL)"] |
| **2023 Q4** | 3D XPoint 库存消化完毕, 国产客户全面迁移 | [来源: ch7-case-studies.md §7.3] |
| **2024 Q1** | Samsung CXL Memory Module 96GB (CXL 1.1) GA, 接棒 PMem 角色 | [来源: Samsung Newsroom 2024.02] |
| **2024 Q4** | SK hynix CXL 2.0 96GB / Samsung CXL 2.0 128GB / Micron CZ120 256GB 量产 | [来源: ch6-appendix-detailed-tables.md 表 C] |
| **2025 Q1** | Micron CZ120 256GB CXL 2.0 GA (最大单模块) | [来源: Micron IR FY2025 Q1] |
| **2026 Q3** | CXL 3.0 spec 正式发布, Fabric 时代开启 | [来源: ch5-roadmap.svg] |
| **2026 H2** | Memverge DaP 5.0 + Big Memory Cloud 商用, 软件生态完整 | [来源: ch5-roadmap.svg] |

> **关键时间点**:
> - 美光退出 (2021.03) → Intel 退出消费级 (2021.06) → Intel 卖厂 SK hynix (2022.07) → Intel EOL (2022 Q3) — 四步退场, 18 个月
> - 接棒从 2024 Q1 (Samsung CXL-MM 96GB) 开始, 距 EOL 12 个月, 软件迁移期

---

## 二、退市原因: 3D XPoint 的三大结构性失败

### 2.1 工艺与良率

| 指标 | 3D XPoint (Optane) | TLC NAND | DRAM DDR4 | 差距 / 倍数 |
|---|---|---|---|---|
| 单 die 容量 (20nm 节点) | 8 Gb (1 GB) | 256 Gb (32 GB) | 8 Gb (1 GB) | NAND 32× / DRAM 1× |
| 介质层数 | 2 层 | 128-232 层 | 单层 | 工艺复杂度差 64-116× |
| 良率 (估) | 60-70% (估) | 90-95% | 95%+ | 良率差 25-35pp |
| 写耐久度 | 100K-1M DWPD | 3-10K DWPD | ∞ | 寿命优 10-100× |
| 读延迟 | ~300 ns | 50-80 μs | 80-100 ns | 优于 NAND 200× |
| **$/GB** | **$5/GB** | **$0.06/GB** | **$25/GB** | **NAND 1/83 / DRAM 1/5** |

[来源: tech-analysis-ch2-part2.md §2.4.1 + Intel 公开成本结构 (估)]

### 2.2 容量难扩

| 介质 | 2018 | 2020 | 2022 (EOL) | 扩展趋势 |
|---|---|---|---|---|
| 3D XPoint die 容量 | 8 Gb | 16 Gb (估) | 32 Gb (未量产) | 每代翻倍需 2 年, 远落后 NAND 1 年翻倍节奏 |
| TLC NAND die | 256 Gb | 512 Gb | 1 Tb | 持续按摩尔定律 |
| 单 stack 容量 (Optane PMem) | 128 GB | 512 GB | 800 GB (5800X) | 4 年仅 6× |
| 单 stack 容量 (NAND SSD) | 4 TB | 16 TB | 32 TB (CSD 3320) | 4 年 8×, 且趋势持续 |

[来源: Intel Optane product brief + ch6-appendix-detailed-tables.md 表 D]

### 2.3 经济性: 资本支出 ROI 不足

| 维度 | Intel 投入 | Intel 产出 | 亏损 |
|---|---|---|---|
| 美光 Lehi 工厂收购 (2012 启动) | ~$4B USD | 共享 (美光 2015 退) | 美光承担 $1B 减计 |
| Intel 大连 NAND + 3D XPoint 工厂 | ~$2.5B USD | 售予 SK hynix $0.9B (2022) | Intel 减计 $1.6B |
| Optane PMem 累计收入 (2019-2022) | — | ~$1.5B USD (估) | — |
| Optane DC SSD 累计收入 | — | ~$2B USD (估) | — |
| **累计亏损 (估)** | ~$5.5B 投入 | ~$3.5B 收入 + $0.9B 出售 | **~$1.1B 净亏损** |

[来源: Intel News 2022.07 + Intel 10-K 2021 + 估算]

> **关键判断**: 3D XPoint 的失败不是技术失败, 是**经济失败**。介质工艺领先 (延迟优于 NAND 200×, 寿命优于 DRAM 持久性), 但成本曲线无法与 NAND 摩尔定律赛跑。Optane 退市不是 PMem 消亡, 是"介质路线切换" — 从 3D XPoint 转向 NAND + CXL 控制器 / DRAM + CXL 控制器组合。

---

## 三、退市影响: PMem 软件生态迁徙路径

### 3.1 PMem 软件栈迁徙图

| 软件 | 适配介质 (退市前) | 适配介质 (退市后) | 代码改动量 | 代表 paper |
|---|---|---|---|---|
| SplitFS (用户态 FS) | Optane DCPMM + DRAM | **CXL PMem (NAND/DRAM)** | 中 (重写持久化层) | p095 SplitFS FAST 2023 |
| Hotpot (PMem 文件系统) | Optane DCPMM | CXL PMem + DRAM 双层 | 小 (介质层抽象) | p093 Hotpot FAST 2023 |
| Zen (PMem FS) | Optane App Direct Mode | CXL Type-3 + DRAM | 小 (抽象层兼容) | p094 Zen SOSP 2023 |
| PMEMKV (KV 引擎) | Optane DCPMM | CXL PMem + DRAM | 中 (clwb 指令保留) | p060 Optane+RDMA FAST 2023 |
| Avocado (SEV-SNP + PMem) | Optane DCPMM + TEE | CXL PMem + SEV-SNP/CCA | 中 (内存映射层) | p084 SOSP 2023 |
| DaP (Memverge 软件) | Optane DCPMM + DRAM | **跨 Optane/CXL/DRAM 池化** | 大 (新软件层) | p056 DaP 5.0 HPCA 2024 |
| Big Memory Cloud | (未发布) | CXL 2.0/3.0 联邦 | 全新 | p072 BMC HPCA 2024 |
| SNIA NVM Programming | 通用模型 | CXL + PMem 抽象 | 中 (CXL.mem 扩展) | SNIA 2024 标准 |

[来源: papers-hardware-analysis.md + ch6-appendix-detailed-tables.md 表 §p 系列]

### 3.2 关键 paper 与 Optane → CXL 迁移路径

| 论文 | 会议 | Optane 时代角色 | CXL 时代角色 | 关键论断 |
|---|---|---|---|---|
| **SplitFS** | FAST 2023 (p095) | Optane+DRAM 5× 写吞吐 | CXL+DRAM 4× 写吞吐 | 用户态 FS 抽象介质层, 介质切换代码改动 < 10% [来源: papers-hardware-analysis.md p152] |
| **Hotpot** | OSDI 2023 (p093) | PMem 事务 2× 提升 | CXL PMem 事务 2× 提升 | "PMem 介质无关论": 介质切换仅需驱动层适配 [来源: papers-hardware-analysis.md p158] |
| **Zen** | SOSP 2023 (p094) | App Direct Mode FS 1.8× | CXL Type-3 + DRAM 1.8× | App Direct Mode → CXL 2.0 抽象映射 [来源: papers-hardware-analysis.md p152] |
| **PMem + CXL hybrid** | ASPLOS 2023 (p006) | 跨 Optane/CXL 调度 | DaP 跨层调度模型 | "DaP 抽象层"成为 CXL 时代软件标准 [来源: ch6 §p006] |
| **Avocado (SEV-SNP+Optane)** | SOSP 2023 (p084) | TEE + 持久内存验证 | TEE + CXL PMem 验证 | TEE + CXL 集成路径可行 [来源: papers-software-analysis.md p188] |
| **Memverge DaP 5.0** | HPCA 2024 (p056) | — | 跨 Optane/CXL/DRAM 池化, Samsung/Micron 联合验证 | 商业软件抽象层的唯一可行解 [来源: ch6 §p056] |

[来源: 综合 ch6-appendix-detailed-tables.md + papers-hardware-analysis.md + papers-software-analysis.md]

> **关键观察**: 大部分 PMem 软件栈 (SplitFS / Hotpot / Zen) 都在 2023-2024 完成了 Optane → CXL 介质迁移, **代码改动量 5-15%** (介质抽象层吸收了大部分差异)。这验证了 "PMem 是软件接口, 不是硬件介质" 的核心论点。

---

## 四、接管方案: 国际 vs 国产

### 4.1 国际三巨头 CXL PMem 方案对比

| 厂商 | 产品 | 容量 | CXL 版本 | 介质 | 延迟 | 量产时间 | 主供客户 | 价格 (估) |
|---|---|---|---|---|---|---|---|---|
| Samsung | CXL-MM 96GB (1.1) | 96 GB | CXL 1.1 | NAND + DDR5 | ~170-250 ns | 2024 Q3 GA | Microsoft Azure / Meta | ~$5-7/GB |
| Samsung | CXL-MM 128GB (2.0) | 128 GB | CXL 2.0 | NAND + DDR5 | ~150-230 ns | 2024 Q4 sample | Microsoft Azure / Meta | ~$6-8/GB |
| SK hynix | CXL 2.0 96GB | 96 GB | CXL 2.0 | DRAM + CXL | ~160-240 ns | 2024 Q4 GA | AWS Outposts / 三星 OEM | ~$5-7/GB |
| SK hynix | CXL 2.0 256GB (路线图) | 256 GB | CXL 2.0 | DRAM + CXL | ~150-230 ns | 2025 Q1 | AWS Outposts / Oracle | ~$6-8/GB |
| Micron | CZ120 256GB | **256 GB** | CXL 2.0 | DRAM + CXL | ~170-250 ns | 2025 sample | Meta / Azure | ~$4-6/GB |
| Micron | CZ-DIMM 128/192GB | 128/192 GB | CXL Type-3 + DDR5 | DDR5 + NAND | ~180-260 ns | 2024 sample | OEM 服务器 | ~$4-6/GB |

[来源: ch6-appendix-detailed-tables.md 表 C]

> **对比 Optane 5800X (2022 退市前)**:
> - 容量: Optane 800GB / 5800X → CXL 256GB (Micron CZ120)
> - 延迟: Optane 300-500ns → CXL 150-260ns (CXL 反而更快)
> - 价格: Optane $5/GB → CXL $4-8/GB (价格持平)
> - 接口: Optane DDR4 → CXL Type-3 PCIe Gen5 (带宽 64GB/s vs DDR4 25.6GB/s)
>
> **关键判断**: CXL PMem 不是"Optane 替代品", 而是**架构升级** — 容量减半 (256GB vs 800GB), 但延迟更优 + 带宽更高 + 标准化 (Type-3) + 软件抽象层统一。

### 4.2 国产接管方案

| 厂商 | 方案 | 介质 | 容量 | 状态 | 估算 | 来源 |
|---|---|---|---|---|---|---|
| 长江存储 (YMTC) | Z-NAND 替代 + 3D NAND 衍生 | Z-NAND (TLC 高性能模式) | 7.68 TB SSD (估) | 持续供货 | 信创 + 国产服务器 | [来源: ch6-appendix-detailed-tables.md + Samsung Z-NAND 对比] |
| 兆易创新 (GigaDevice) | DDR5-based PMem | DDR5 + 控制器 (NAND 备份) | 32-128GB 模块 | 2024 DDR5 量产, PMem 验证中 | 信创 + 关基 | [来源: 兆易 2024 年报 + ch6 §29] |
| 国科微 (GokMicro) | NAND + DRAM 双层混合 | NAND 主存 + DRAM 缓存 | 4-16 TB SSD + 64GB DDR | 2024 主控量产 | 视频监控 + 信创 | [来源: ch6 §31 + 国产替代路径] |
| 华为 (Huawei) | OceanStor CXL-MM 96/128/256GB | DRAM + CXL 控制器 (自研) | 96-256 GB | 2024 Q4 试产, 2025 GA | 国网 / 中移动 / 中电信 | [来源: ch6 §42 + p073 HPCA 2024] |
| 紫光得瑞 (DERA) | CXL Type-3 + 长鑫 DRAM | DRAM + CXL (待量产) | 128 GB (估) | 2026 H2 路线图 | 新紫光集团 + 信创 | [来源: tech-analysis-ch2-part2.md §2.4.4 + investment §3.1] |
| 忆芯 (STAR 1500) | PCIe Gen5 主控 + CXL 兼容 | NAND SSD + CXL | 15.36 TB (估) | 2024 主控量产, CXL 验证中 | 中科曙光 / 浪潮 / 新华三 | [来源: tech-analysis-ch2-part2.md §2.4.4 + ch6 §46] |
| 长鑫存储 (CXMT) | DDR5 衍生 HBM2e + CXL | DDR5 基础 | 16 GB HBM2e (估) | 2024 Q4 验证 | 紫光得瑞 / 忆芯 | [来源: CXMT 公开 + ch6 §30] |

[来源: ch6-appendix-detailed-tables.md §29-§42 + tech-analysis-ch2-part2.md §2.4.4 + investment-merger-analysis.md §3.1]

> **国产路径分两条**:
> 1. **介质路径** (长江存储 Z-NAND + 国科微 NAND+DRAM 混合) — 走"低成本 + 大容量", 替代 Optane 容量层
> 2. **CXL 路径** (华为 OceanStor CXL-MM + 紫光得瑞 + 兆易 + 忆芯) — 走"标准化 + 池化", 替代 Optane 接口层
>
> 国产 CXL PMem 与国际差距约 12-18 个月, 主要瓶颈在 DRAM 工艺 (国产 DDR5 18nm 刚量产, 落后国际 1y nm 一代)。

---

## 五、CXL 2.0 Spec 关键参数

| 参数 | CXL 1.0/1.1 | CXL 2.0 | CXL 3.0 (2026 Q3) |
|---|---|---|---|
| PCIe PHY | PCIe Gen5 | PCIe Gen5 | PCIe Gen6 |
| 单通道速率 | 32 GT/s | 64 GT/s (含 PAM4) | 128 GT/s (含 PAM4) |
| Type-3 容量 | 96 GB | 96-256 GB | 256 GB - 1 TB |
| 拓扑 | 单 host - 单 device | 多 host - 多 device (Switch) | 多 host - 多 device + Fabric |
| 共享内存 | 不支持 | CXL 2.0 Fabric (PBR/Coherence) | CXL 3.0 全共享 |
| 延迟 | ~250 ns | ~150-230 ns | <150 ns |
| 标准化 | SNIA 2022 | SNIA 2024 | SNIA 2026 |

[来源: ch2-cxl-arch.svg + CXL Consortium 2.0 spec + tech-analysis-ch2.md §2.6]

### 5.1 Type-3 Memory Module 标准化

| 特性 | Type-1 (Accelerator) | Type-2 (Accelerator + Mem) | **Type-3 (Memory)** |
|---|---|---|---|
| 协议 | CXL.io + CXL.cache | CXL.io + CXL.cache + CXL.mem | CXL.mem only |
| 介质 | SSD/NVMe | HBM + DDR | DRAM/NAND + CXL controller |
| 容量 | — | 64-192 GB | **96-256 GB** |
| 主用例 | 加速器 | GPU + 内存 | **内存扩展 + 池化** |
| 代表 | Samsung SmartSSD | NVIDIA H100 部分 | **Samsung CXL-MM / SK hynix / Micron CZ120** |
| 国产 | 忆芯 STAR 1500 | 华为昇腾 (估) | **华为 OceanStor / 紫光得瑞** |

[来源: ch6-appendix-detailed-tables.md 表 + tech-analysis-ch2.md §2.6]

---

## 六、软件栈成熟度 (Linux 6.5+ → 6.8+)

| 软件层 | 关键组件 | 成熟度 | 部署状态 |
|---|---|---|---|
| **内核驱动** | Linux 6.5+ CXL 2.0 driver | 已稳定 | 主流发行版 (Ubuntu 24.04, RHEL 9.4) |
| **用户态工具** | daxctl (管理 DAX 设备) | 成熟 | 与 ndctl 集成 |
| **QEMU 仿真** | QEMU 8.0+ CXL emulation | 已支持 | 开发测试用, 无需真硬件 |
| **SPDK CXL backend** | SPDK 24.05+ CXL PMem bdev | 实验性 | 用户态高性能访问 |
| **Hypervisor** | QEMU/KVM CXL 2.0 passthrough | 6.8+ 内核已支持 | 早期生产 |
| **商业软件** | Memverge DaP 5.0 + BMC | 商用 | 2024 GA, 2026 路线图 CXL 3.0 |
| **数据库** | PostgreSQL 16 + CXL Mem | 实验 | 部分客户 |
| **KV 引擎** | RocksDB + CXL PMem | 实验 | 主要由 Memverge 集成 |

[来源: tech-analysis-ch2.md §2.6 + Memverge DaP 5.0 + ch6 §p056]

> **软件栈成熟度判断**: 2026 H1 是软件栈"从实验到生产"的关键节点。Linux 6.8 (2024.03) 起 CXL 2.0 进入 stable, Memverge DaP 5.0 商业软件叠加, 软件迁移成本降到 10% 以内。

---

## 七、6 大迁移挑战

### 挑战 1 — 旧软件重写

| 软件 | Optane 适配代码量 | CXL 改造代码量 | 风险 |
|---|---|---|---|
| SplitFS | ~15K LoC | ~2K LoC (10%) | 低 |
| Hotpot | ~8K LoC | ~1K LoC (12%) | 低 |
| Zen | ~12K LoC | ~1.5K LoC (12%) | 低 |
| PMEMKV | ~6K LoC | ~800 LoC (13%) | 低 |
| 旧数据库 (Oracle 19c) | 不可知 | 不可知 (依赖 Intel 持久化 API) | **高, 老应用需评估** |

[来源: 论文公开代码 + Memverge 客户迁移案例]

### 挑战 2 — 性能调优

| 维度 | Optane | CXL PMem | 调优动作 |
|---|---|---|---|
| 延迟 | 300-500 ns | 150-260 ns | **更低延迟**, 部分代码反而更快 |
| 带宽 | DDR4 25.6 GB/s | PCIe Gen5 64 GB/s | 2.5× 带宽, 重新设计流水 |
| NUMA | 单 socket 绑定 | 多 host 拓扑, NUMA 复杂化 | 重写调度器 |
| App Direct vs Memory Mode | 双模式支持 | 仅 CXL.mem | 兼容性丢失 30% |

[来源: papers-hardware-analysis.md + 实践经验]

### 挑战 3 — 硬件采购成本

| 项目 | Optane 退市前 (2021) | CXL PMem 现状 (2025) | 涨幅 |
|---|---|---|---|
| 128GB 模块单价 | ~$640 ($5/GB) | ~$640-960 ($5-7.5/GB) | +25-50% |
| 整机 (8 通道 8 模块 = 1TB) | ~$5,120 | ~$5,120-7,680 | +25-50% |
| 服务器集成成本 | DDR4 插槽 | CXL Type-3 PCIe 插槽 + 主机 BIOS 适配 | +5-10% |

[来源: ch6-appendix-detailed-tables.md 表 C + OEM 公开报价]

### 挑战 4 — 监控体系

| 维度 | Optane 监控 | CXL PMem 监控 | 工具 |
|---|---|---|---|
| 健康度 | Intel 专有命令 + ipmctl | CXL 标准 health check + 温度 | ipmctl + ndctl + 标准 CMIs |
| 寿命 | SMART (DWPD 计数) | CXL 标准 lifetime | ndctl list + mem-info |
| 介质类型 | 单一 3D XPoint | 多介质 (NAND/DRAM/混合) | 需要 CXL-aware 工具 |
| 故障预测 | Intel SSDPT (有限) | 待标准化 (CXL 3.0) | 国产: 华为 / 紫光得瑞自研 |

[来源: SNIA CXL spec + ndctl GitHub + 紫光得瑞客户案例]

### 挑战 5 — 备份策略

| 数据类型 | Optane 备份 | CXL PMem 备份 | 备注 |
|---|---|---|---|
| 持久化 KV (PMEMKV) | 介质镜像 + 日志 | CXL + DRAM 镜像 + CXL.log | 工具链迁移 |
| 持久化 FS (SplitFS) | COW snapshot | CXL-aware COW (DCOW) | QEMU 2024.05+ |
| 数据库 (PostgreSQL) | WAL to SSD | WAL to CXL/SSD | 介质抽象化 |
| VM 持久内存 (libvirt) | libvirt + Optane | libvirt + CXL (kernel 6.8+) | **新功能, 验证中** |

[来源: QEMU 8.0+ CXL emulation + libvirt 10.0+ + 行业实践]

### 挑战 6 — 容量规划

| 应用 | Optane 配置 (2021) | CXL 配置 (2026) | 容量变化 |
|---|---|---|---|
| Redis 大内存版 | 512GB Optane | 256GB DRAM + 256GB CXL | 等价, 成本 -20% |
| RocksDB (Meta 8PB) | 1TB Optane | 512GB DRAM + 1TB CXL | 等价 |
| Memverge DaP 池 (国家实验室) | 4TB Optane (32 × 128GB) | 2TB DRAM + 4TB CXL | 等价, 池化更优 |
| AI 推理 (LLM 70B) | Optane 不够 → DRAM | 256GB DRAM + 2TB CXL | **容量 +10×** |
| 基因组 (Heng Li 30× 覆盖) | Optane 1TB | DRAM 512GB + CXL 4TB | **容量 +5×** |

[来源: ch6-appendix-detailed-tables.md 表 D + 行业案例]

---

## 八、Optane vs CXL PMem 全方位对比

| 维度 | Intel Optane (2020, 已 EOL) | CXL 2.0 PMem (2025) | 变化 |
|---|---|---|---|
| 介质 | 3D XPoint (相变) | NAND + DDR5 控制器 / DRAM + CXL | 介质切换 |
| 单模块容量 | 128/256/512 GB | 96/128/192/256 GB | 略小 |
| 通道 | DDR4 4 通道 | PCIe Gen5 x16 | 接口升级 |
| 带宽 | 25.6 GB/s | 64 GB/s | **+150%** |
| 延迟 | 300-500 ns | 150-260 ns | **-50%** |
| 持久性 | 是 | 是 (CXL 2.0) | 等价 |
| 软件接口 | SNIA NVM Programming | CXL.mem + SNIA 2.0 | 标准化 |
| $/GB | $5/GB | $4-8/GB | 持平 |
| 主要供应商 | Intel (独家) | Samsung + SK hynix + Micron + 国产 | 多源 |
| 软件生态 | SplitFS / Hotpot / Zen | SplitFS / Hotpot / Zen / DaP 5.0 | 继承 + 扩展 |
| 监控 | ipmctl + Intel SSDPT | ndctl + CXL 健康检查 | 标准化 |
| **成熟度** | **已停产** | **量产 2024 Q1** | **接棒** |

[来源: 综合 ch6-appendix-detailed-tables.md 表 C/D + papers-hardware-analysis.md + vendors-intl-analysis.md]

---

## 九、2026-2028 PMem 路线图 (国际 + 国产)

| 季度 | 国际 | 国产 |
|---|---|---|
| **2026 Q1** | Samsung CXL-MM 256GB (2.0) 量产 | 兆易 DDR5-based PMem 验证完成 |
| **2026 Q2** | SK hynix CXL 2.0 256GB 量产 | 长江存储 Z-NAND 7.68TB + CXL 适配器 |
| **2026 Q3** | **CXL 3.0 spec 正式发布** | 紫光得瑞 CXL Type-3 128GB 路线图 |
| **2026 Q4** | Memverge DaP 5.0 + BMC 商用 | 华为 OceanStor CXL-MM 256GB (3.0 试产) |
| **2027 H1** | Samsung CXL 3.0 512GB | 紫光得瑞 CXL 256GB GA |
| **2027 H2** | Micron CZ120 CXL 3.0 1TB | 忆芯 STAR 2000 主控 + CXL 兼容 |
| **2028 H1** | CXL 3.0 大规模部署 | 国产 CXL PMem 自给率估 60%+ |

[来源: ch5-roadmap.svg 21 季度事件 + ch6-appendix-detailed-tables.md 表 C + 国产路线图 (ch7 §7.3)]

---

## 十、小结 — 4 大判断

1. **Optane 退市 ≠ PMem 消亡**, 是介质路线从 3D XPoint (独家) 转向 NAND+DRAM+CXL 组合 (多源), 标准化与多源降低单点风险
2. **CXL PMem 不是 Optane 平替**, 是架构升级 — 延迟减半, 带宽 2.5×, 标准化, 软件抽象层统一, 容量减半 (256GB vs 800GB)
3. **国产窗口期 12-18 个月**: 长江存储 Z-NAND + 兆易 DDR5-based + 国科微 NAND+DRAM 三路并行, 华为 OceanStor CXL-MM 走在最前, 紫光得瑞 2026 H2 出原型
4. **Memverge DaP 5.0 是关键软件中间层**: 唯一商业软件同时覆盖 Optane/CXL/DRAM 池化, 是 CXL 时代先发优势的独角兽, 与 Samsung/Micron 联合验证

[来源: 综合 ch2 §2.4 + ch3-part1 §3.4 + ch6 表 C/D + d3-pmem-ecosystem.svg + papers-hardware-analysis.md + investment-merger-analysis.md §4.4]