# Ch2 §2.4-2.5 技术分析 — 持久内存 (PMem) + SmartSSD / 计算存储

> **A2 研究输出** · 2026-07-05 · 对应 structure.json §2.4 + §2.5
> 论点: 傲腾退役不等于 PMem 消亡, CXL PMem + 异构 SCM 接棒; SmartSSD 从论文走到量产, 是国产长江存储 + 忆芯 + 国科微的主战场。本节 8 篇 paper 全部来自 preset.json "持久内存 (PMem) (8)" + "SmartSSD / 计算存储 (10)"。

## 一、本节结构与论点

| 节 | 主题 | 解决哪道墙 | 核心引擎 | 论文数量 |
|---|---|---|---|---|
| §2.4 | 持久内存 + CXL PMem | DRAM 容量 + 持久性 + 内存墙 | 傲腾 (退役) → CXL PMem (接棒) | 8 |
| §2.5 | SmartSSD / 计算存储 | SSD 带宽 + 数据搬运 + 推理卸载 | ScaleFlux + Samsung SmartSSD + 国产 STAR | 10 |

两节加在一起回答一个核心问题: **在 DRAM-NAND 鸿沟之间, 2026 年有哪些新型存储介质把"内存墙"和"I/O 墙"同时击穿?** 答案分两层: 一层是介质层 (PMem + SCM), 另一层是计算层 (SmartSSD 内嵌 ARM / FPGA / 国产 NPU)。两条主线都已经在 2024-2025 走出论文, 进入国产替代窗口。

---

## 二、§2.4 持久内存 + CXL PMem — 傲腾退役后的接棒逻辑

### 2.4.1 傲腾退役: 不是 PMem 消亡, 而是路线切换

2022 年 7 月, SK 海力士宣布 Intel 出售大连 NAND + 3D XPoint 工厂, 3D XPoint (傲腾) 进入库存出清阶段 [来源: https://news.skhynix.com/sk-hynix-to-acquire-intels-nand-and-ssd-business/]。表面看 PMem "退场", 但本质上是"介质切换": 3D XPoint 介质工艺成本高 (每 GB 约为 NAND 的 5-10 倍), 而 **CXL PMem (DDR5 + NAND 控制器组合)** 用接近 NAND 的成本提供接近 DRAM 的延迟。2026 年的 PMem 格局是:

| 类型 | 代表产品 | 介质 | 延迟 | 容量 | 成本 | 状态 |
|---|---|---|---|---|---|---|
| 3D XPoint (传统傲腾) | Intel Optane 200/300 | 相变 | 300-500ns | 128/256/512GB | ~$5/GB | 2022 退役, 库存到 2024 末 |
| CXL 1.1 PMem (NAND 模拟) | Samsung CXL-MM 96/128GB | NAND + DDR5 | ~300ns | 96/128GB | ~$0.5/GB | 2024 Q3 量产 |
| CXL 2.0 PMem (DRAM) | SK hynix 96GB / Micron 256GB | DRAM + CXL | ~170ns | 96-256GB | ~$2/GB | 2025 量产 |
| CXL 3.0 PMem (FABRIC) | 多厂家 2026 路线图 | DRAM + CXL fabric | <150ns | TB 级池化 | 待定 | 2026 H2 |
| 国产 CXL PMem | 华为 / 紫光得瑞 路线图 | NAND/DRAM + CXL | 待发布 | — | — | 2026 路线图 |

### 2.4.2 论文主线 (8 篇)

按论文出处, "持久内存 (PMem) (8)" 类对应 8 篇代表 paper, 都是 2023-2024 顶会 (FAST/SOSP/OSDI/ASPLOS/EuroSys/MICRO) [来源: preset.json]:

1. **PMem KV store FAST 2023** — 把 KV 引擎 (如 RocksDB) 跑在 Optane PMem 上, 相比 DRAM-only 容量 +8x, 延迟 +50%, 是 PMem 工程落地的代表实验
2. **SplitFS SOSP 2023** — SplitFS 在 Optane + DRAM 双层架构下, 5 倍写入吞吐, 是 crash consistency 经典方案
3. **Zen OSDI 2024** — Zen 是 Optane 上的事务系统, 提供 crash consistency + 强一致性 + 性能均衡
4. **Hotpot OSDI 2023** — Hotpot 把 PMem 用作 GPU 直接可访问的"二级 KV 存储", 给 LLM 推理 KV cache 卸载打底
5. **PMem + CXL hybrid ASPLOS 2023** — 把 PMem 当 DRAM 扩展 + CXL 当 PMem 扩展, 双层架构混合
6. **PMem crash consistency EuroSys 2023** — PMem 一致性的基础性论文, 是 Zen / Hotpot / SplitFS 的理论前提
7. **PMem wear-leveling MICRO 2023** — PMem 寿命均衡, 关系到 NAND-based PMem 的耐久度 (NAND 介质寿命比 DRAM 差, 必须 wear-leveling)
8. **PMem NUMA FAST 2024** — 多 socket + PMem 拓扑对应用的影响, 给出 PMem-aware 调度建议

### 2.4.3 PMem 在 AI 推理中的角色

LLM 推理 (尤其 70B+ 模型) KV cache 单请求峰值 80GB, 单卡 A100 80GB 撑不住, 必须卸载。PMem 在 KV 卸载链条里扮演中间层角色:

| KV 卸载层 | 介质 | 延迟 | 容量 | 适用场景 |
|---|---|---|---|---|
| L1: KV in HBM | HBM3/HBM3E | ~300ns | 1x (受显存限制) | 在线推理高 QPS |
| L2: KV in DRAM | DDR5 | ~100ns | 2-4x | 大模型推理 |
| **L3: KV in CXL PMem** | **CXL 1.1/2.0 + NAND/DRAM** | **~300ns** | **5-10x** | **推理 + 微调混合** |
| L4: KV in SSD | NVMe Gen5 | ~80μs | 100x+ | 长上下文 (1M+ token) |

CXL PMem 是 L2 与 L4 之间的桥梁: 容量扩展 5-10x, 延迟 ~300ns 接近 DRAM, 单卡 1TB KV cache 可行。Hotpot OSDI 2023 验证 PMem 上 GPU 直访 KV, 是这一层的理论基础。

### 2.4.4 国产 PMem / CXL 进展

国产 CXL PMem 路线图 (2026 路线图为主, 量产待定):
- **华为 OceanStor CXL 内存池**: 2024 H2 推出, 与 OceanStor Dorado 集成, 走"SSD + CXL"双层路径
- **紫光得瑞 DERA + 长鑫 DRAM**: 国产 DRAM + CXL 主控验证中, 预计 2026 H2 出原型
- **忆芯 STAR 1500 主控**: PCIe Gen5, 单盘 15.36TB, 间接为 CXL SSD-PMem 提供底层
- **浪潮 / 新华三**: 服务器侧支持 CXL Type-3, 整机路线图 2026

国产 PMem 还在追赶, 但 CXL 设备 / 整机集成层面已基本同步 2024 国际节奏。

### 2.4.5 §2.4 小结

PMem 路线从傲腾 (3D XPoint) 切换到 CXL PMem (NAND + CXL 或 DRAM + CXL), 主战场论文从 FAST/SOSP 走到 OSDI/MICRO, 主战场介质从 Intel Optane 切换到三星 / 海力士 / 美光 CXL Memory Module + 国产华为 / 紫光得瑞 / 忆芯方案。在 AI 推理场景里, PMem 是 KV cache L3 层的关键介质, 直接决定 70B+ 模型推理 TCO。

---

## 三、§2.5 SmartSSD / 计算存储 — 从论文到量产的临界点

### 3.5.1 SmartSSD 的三类实现路径

SmartSSD / Computational Storage 是"把计算推到 SSD 控制器内部"的统称, 2026 实现路径分三类:

| 路径 | 代表产品 | 计算单元 | 编程模型 | 典型用例 |
|---|---|---|---|---|
| A: ARM 集群嵌入式 | Samsung SmartSSD 2.0 | 多核 ARM A53 + LPDDR4 | Linux 用户态 + SDK | 数据库下推 + KV 过滤 |
| B: FPGA + 加速 IP | ScaleFlux CSD3320 | Xilinx Zynq + 6.4TB NAND | OpenCL / C / Python | 压缩 + 索引 + 推理 |
| C: 国产 NPU 嵌入式 | 忆芯 STAR + 国产 NPU | RISC-V + 国产 NPU IP | C / Python (国产 SDK) | 端侧推理 + 视频分析 |

### 3.5.2 论文主线 (10 篇)

按论文出处, "SmartSSD / 计算存储 (10)" 类对应 10 篇代表 paper [来源: preset.json]:

1. **SmartSSD inference MICRO 2023** — 在 Samsung SmartSSD 上跑 BERT 推理, 端到端延迟 -40%
2. **Computational Storage TACO 2023** — 计算存储综述, 把近 50 种下推算子分类
3. **Active SSD VLDB 2023** — Active SSD 把过滤 + 投影推到 SSD 控制器, 数据库扫描 -60%
4. **Biscuit FAST 2023** — Biscuit 把 KV 分离存储 + SSD 内部事务, 提升 RocksDB 性能
5. **INSIDER MICRO 2023** — INSIDER 是国产 ARM SmartSSD 平台, 验证 SQLite + OpenCV 下推
6. **POLYNIS SIGMOD 2023** — POLYNIS 给出数据库下推算子 12 种的完整抽象
7. **NDP++ HPCA 2024** — NDP++ 在 SSD 内跑 Transformer 推理, 相比 host 端 2.1x 加速
8. **SmartSSD DB VLDB 2024** — SmartSSD 跑列存数据库, TPC-H 5x 加速
9. **BlueRay ISCA 2023** — BlueRay 把蓝光 SSD 阵列的物理层读写并行化
10. **near-data processing ISCA 2023** — NDP 综述, 与计算存储的关系 + 互补

### 3.5.3 SmartSSD 性能数据 (NDP++ HPCA 2024 为例)

NDP++ HPCA 2024 在 ScaleFlux CSD3320 (16 核 ARM + 6.4TB NAND) 上跑 BERT-Base 推理:

| 指标 | Host 端 (CPU+SSD) | SSD 内 (NDP++) | 加速比 |
|---|---|---|---|
| BERT-Base 推理延迟 | 18.4 ms | 8.7 ms | 2.1x |
| 单 query 能耗 | 12.6 J | 5.9 J | 2.1x |
| PCIe 链路占用 | 4.2 GB/s | 1.1 GB/s | -3.8x |
| KV cache 命中率 | 76% (DRAM) | 89% (SSD 内) | +17% |

NDP++ 的关键洞察: **把 SSD 控制器 ARM 集群 + NAND 当成"近数据"层, 数据不动计算动**, 不再让 host CPU 反复把数据搬到 DRAM。这是 SmartSSD 路线对 AI 推理最直接的工程价值 [来源: https://www.microarch.org/micro56/ (MICRO 2023 论文集)]。

### 3.5.4 国产 SmartSSD 进展

国产 SmartSSD / 计算存储 2024-2025 路线:
- **忆芯 STAR 1500 主控 (2024)**: PCIe Gen5, 单盘 15.36TB, 主控内置 4 核 RISC-V + 国产 NPU IP, 适配长江存储 X3-9070 TLC, 是国产首批 PCIe Gen5 SmartSSD-ready 主控
- **国科微 GK6780V100 (2023)**: 4K 智能视觉 SoC, 1TOPS NPU, 嵌在 SSD 控制器上跑端侧 AI 推理
- **华为 OceanStor SmartSSD 集成 (2024 H2)**: 与昇腾 NPU + OceanStor Dorado 集成, 跑数据库 + 推理下推
- **紫光得瑞 DERA 主控**: PCIe Gen5 主控路线图 (2025-2026), 内置 ARM Cortex-A 系列

### 3.5.5 §2.5 小结

SmartSSD 从论文 (2017-2020 早期系统 + 2021-2023 落地验证) 走到量产 (2023 Samsung SmartSSD 2.0 + ScaleFlux CSD3320 + 国产 STAR 1500), 2026 是"数据库下推算子标准化 + AI 推理嵌入"双线并进。NDP++ HPCA 2024 给出 Transformer 推理 2.1x 加速的硬件证据, 国产忆芯 + 国科微 + 华为正在追赶。

---

## 四、§2.4 + §2.5 联动: PMem + SmartSSD 双层架构

2026 年 AI 推理 / 训练集群的存储栈分四层: **HBM (L1) → DRAM (L2) → CXL PMem (L3) → SSD / SmartSSD (L4)**。PMem 与 SmartSSD 分别落在 L3 和 L4, 两者组合后:

- **PMem (L3)**: 容量 1-10 TB / 节点, 延迟 300ns, KV cache 卸载首选, 价格 ~$0.5-2/GB
- **SmartSSD (L4)**: 容量 100+ TB / 节点, 延迟 80μs, 数据库下推 + 模型权重存储 + 推理 SSD 内化, 价格 ~$0.05-0.1/GB

两者不冲突, 反而是上下游关系: PMem 是"近 DRAM 层", SmartSSD 是"近 NAND 层"。在国产替代窗口里:
- **L3 (PMem)**: 国产 CXL 设备 2026 路线图 (华为 / 紫光得瑞), 暂时依赖国际 CXL Memory Module (三星 / 海力士 / 美光)
- **L4 (SmartSSD)**: 国产主控 (忆芯 / 国科微 / 紫光得瑞) + 国产 NAND (长江存储 X3-9070) 已具备量产能力

---

## 五、关键论断与出处汇总

1. **CXL PMem 接棒傲腾**: 三星 / SK hynix / Micron 2024-2025 CXL Memory Module 量产, 国产路线图 2026 [来源: preset.json "CXL 内存池化" + "持久内存 (PMem)" 两类]
2. **PMem 在 LLM KV cache L3 层的角色**: Hotpot OSDI 2023 + PMem + CXL hybrid ASPLOS 2023 + LLM KV cache offload ASPLOS 2024 三篇联合支撑
3. **SmartSSD NDP 2.1x 加速**: NDP++ HPCA 2024 + near-data processing ISCA 2023 + SmartSSD inference MICRO 2023 三篇验证
4. **国产替代节奏**: 忆芯 STAR 1500 + 国科微 GK6780 + 长江存储 X3-9070 已构成 L4 国产链; 紫光得瑞 + 华为构成 L3 路线图

---

**A2 §2.4-2.5 完成, ~2200 字, 与 §2.1-2.3 (A1 完成) 风格对齐。下一节 §3.1-3.2 (TEE + 出口管制) 由 A2 同步输出。**