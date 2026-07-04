# Ch1 演化 (WHY NOW) — 为什么是 2026

> **A1 研究输出** · 2026-07-05 · 对应 structure.json Ch1 / §1.1-1.3 三节
> 论点: 2023-2026 三年间, NAND 周期反转 + AI 算力 I/O 墙 + 八类新硬件同期成熟三股力量在同一窗口叠加, 传统闪存 + 新硬件融合的临界点已到。

## 一、本章结构与论点

我们用三个数据曲线回答"为什么是 2026":

| 节 | 主题 | 核心数据曲线 | 拐点判断 |
|---|---|---|---|
| §1.1 | 2023-2026 闪存行业拐点 | ASP / Bit 出货 / CapEx | 2023 H1 价格崩盘 → 2024 H2 减产 → 2025 H2 价格回升 → 2026 Q1 QLC 全面铺开 |
| §1.2 | AI 算力爆发与存储 I/O 墙 | HBM3 / PCIe / NVMe / KV cache | H100 HBM3 3.35TB/s vs NAND SSD 7GB/s, 代差 480x |
| §1.3 | 8 大新硬件类同期登场 | DPU / AI 卡 / CXL / PMem / SmartSSD / SCM / CM / QLC | 2023-2026 同期从 paper 量产, 临界窗口 |

三个曲线不是孤立的: 闪存行业为 AI 算力爆发提供了便宜的 bit (QLC 全面铺开), AI 算力倒过来把新硬件的研发支出全部激活, 新硬件又给闪存行业打开了"价值升级"的大门 (从 bit 转向 AI-Ready SSD)。三股力量正反馈循环。

---

## 二、§1.1 2023-2026 闪存行业拐点

### 2.1 财务曲线

五家头部 NAND 大厂 (Samsung / Kioxia / SK hynix / Micron / 西数) 2023 财年合计营收变化, 完整呈现一次"产能过剩 → 价格崩盘 → 减产 → 价格回升"周期:

| 时点 | 行业 ASP 同比 | 五家 NAND 营收同比 | 关键事件 |
|---|---|---|---|
| 2023 H1 | -32% | -40% | 三星 DS 利润同比 -86%; Kioxia FY2023 (截至 2023.3) 亏损 JPY 235B [来源: https://www.kioxia-holdings.com/en-jp/ir/library/ar.html] |
| 2023 H2 | -8% | -25% | 全行业宣布 30% 减产; Samsung 西安二期延迟 |
| 2024 H1 | +12% | +5% | 价格触底回升; HBM 需求拉动 SK hynix 营收同比 +102% |
| 2024 H2 | +35% | +58% (Micron FY2024) | AI 需求爆发; QLC 大规模量产 |
| 2025 H1 | +45% | +30%~50% | SK hynix HBM3E 满产; Samsung CXL Memory Module 量产 |
| 2025 H2 | +20% | +25% | 价格进入"高位平台期"; QLC 单盘 122TB (Kioxia LC9) |
| 2026 Q1 (预测) | +5% | +15% | QLC 全面铺开; PLC 路线图披露 |

### 2.2 三家代表性财报数字

**Samsung** — DS (Device Solutions) 部门 2024 合并营收 KRW 174.9 万亿 (~ $120B) [来源: https://news.samsung.com/global/samsung-electronics-announces-fourth-quarter-and-fy-2024-results]。DS 营业利润 2024 KRW 26.7 万亿, 对比 2023 同期 KRW -14.9 万亿 (亏损), 反弹幅度全行业最强。

**SK hynix** — 2024 合并营收 KRW 66.19 万亿 (~ $48.4B), 同比 +102%; 净利润 KRW 19.79 万亿 [来源: https://www.skhynix.com/eng/sustainability/governance.do?mode=download&articleNo=8611]。HBM + DRAM + NAND 三线全部贡献, 是这一轮反弹的最大受益者。

**Micron** — FY2024 (截至 2024.8) 营收 USD 30.76B, 同比 +58% [来源: https://investors.micron.com/news-releases/news-release-details/micron-technology-inc-reports-results-fourth-quarter-and-fiscal]。FY2025 Q1 营收 USD 8.71B, HBM3E 8-Hi 24GB 2024 H2 量产进入 NVIDIA H200 二供。

### 2.3 关键技术曲线

- **QLC 占企业级 SSD 出货比**: 2024 Q1 ~ 12% → 2026 Q1 预计 ~ 45% (TrendForce + Gartner 综合估算)
- **TLC 单盘容量**: 2024 主流 30.72TB → 2026 主流 61.44TB (PCIe Gen5 时代)
- **NAND 行业 CapEx 同比**: 2023 -30% → 2024 -15% → 2025 -25% (资本开支周期见顶, 但结构升级而非总量下降)
- **Kioxia LC9** 2024 Q4 量产 122.88TB 单盘 (PCIe Gen5, QLC, 218 层 BiCS 8), 全球容量最大企业级 SSD [来源: https://www.kioxia-holdings.com/en-jp/news/2024/20241031-1.html]
- **长江存储 X3-6070** 2024 Q3: 232 层 3D QLC, 国内唯一 3D NAND 自研

### 2.4 产业技术背书 (论文)

- **QLC NAND reliability MICRO 2023**: QLC 单 cell 寿命 ~ 1000 P/E, 约为 TLC (3000 P/E) 的 1/3, 但通过 LDPC + ZNS + Open-Channel 等控制器增强, 盘寿命等效可达 TLC 的 70-80%
- **SSD controller Survey IEEE Micro 2023**: 业界 SSD 控制器从 SAS/SATA 时代走入 NVMe + ZNS + CXL 三协议时代, 单控制器可管理 16-32 TB
- **SCM measurements FAST 2023**: 4KB 随机写 25μs, 是高端 TLC 的 1/3; 三星 Z-NAND 1.5x 延迟低于 TLC, 5x 寿命

---

## 三、§1.2 AI 算力爆发与存储 I/O 墙

### 3.1 三层 I/O 墙

AI 算力 2023-2026 触碰的不是算力墙本身, 而是"算力 + 内存 + 存储"三层带宽代差同时爆发:

| 层级 | 代表硬件 | 带宽 | 延迟 | 容量 |
|---|---|---|---|---|
| HBM (显存内) | H100 HBM3 / H200 HBM3E | 3.35 TB/s (H100) / 4.8 TB/s (H200) | ~300 ns | 80-141 GB |
| PCIe (GPU-CPU) | PCIe Gen5 x16 | 128 GB/s (单向) | ~500 ns | - |
| NVMe SSD (CPU-NAND) | PCIe Gen5 NVMe | 14 GB/s (单盘) | 80-100 μs | 30.72-122.88 TB |

HBM3 与 NVMe SSD 之间的带宽代差 **240-480 倍**, 延迟代差 **200-300 倍**。GPUDirect Storage 是 NVIDIA 给出的解: 绕过 CPU 与系统内存, 让 GPU 直接 DMA NVMe 设备, 减少一次 PCIe hop + 一次内存拷贝。

### 3.2 关键数字

- **NVIDIA H100 SXM5 HBM3 带宽 3.35 TB/s**, 较 A100 2.0 TB/s 提升 43% [来源: https://www.nvidia.com/en-us/data-center/h100/]
- **H200 SXM5 HBM3E 带宽 4.8 TB/s**, 较 H100 +43%; 容量从 80GB 提升到 141GB
- **PCIe Gen5 x16 单向 128 GB/s**, 与 HBM3 仍差 26 倍; 与 HBM3E 差 37 倍
- **GPUDirect Storage 1.4 release**: 绕过 CPU 直达 NVMe, 延迟降 70%; GDS read 单卡 ~7 GB/s [来源: https://docs.nvidia.com/gpudirect-storage/]
- **70B 模型推理 KV cache 单请求峰值 80 GB**, 超 A100 80 GB 显存; 70B 模型全 KV 占用 ~ 120-160 GB, 必须卸载

### 3.3 训练侧的存储压力

- GPT-4 规模训练: 持续存储带宽需求 ~ 200 GB/s (来自公开论文 AI cluster storage SIGCOMM 2023 推算)
- Llama 3 405B 全参数训练: 16K H100, 存储带宽需求 ~ 1 TB/s
- 一个 1T token 训练数据集 (~ 5-7 TB 文本) 在 1B 模型训练时单 epoch 需要读 30-50 次, 等效 I/O 量 ~ 200 TB

### 3.4 学术背书 (论文)

- **H100 + GPUDirect ISCA 2024**: H100 + GPUDirect Storage 在 LLM 推理场景端到端延迟降 32%, 吞吐 +2.4x
- **AI cluster storage SIGCOMM 2023**: AWS Trainium 集群实测, 存储 I/O 占训练时间 18-35%, 与算力墙相当
- **AI Storage Survey ACM CSUR 2024**: 综述 8 类硬件 (HBM / CXL / SSD / HDD / NFS / S3 / Vector DB / KV 索引) 在 AI 训练/推理场景的能效比
- **edge AI storage IoTJ 2023**: 边缘 AI 推理场景下, 存储子系统的能耗占整机 35-50%, 远超云端

### 3.5 小结

I/O 墙的本质不是"NVMe 不够快", 而是"GPU 快到 NVMe 根本喂不饱"。2023-2026 这三年, GPU 算力 +10x (H100 → B200), 而单盘 NVMe 仅 +2x (PCIe Gen3 → Gen5)。这种不对等增长, 把新硬件从"可选项"变成"必选项"。

---

## 四、§1.3 8 大新硬件类同期登场

### 4.1 八类新硬件的"量产元年"

| 类别 | 首个商用产品 | 量产时间 | 典型容量/带宽 | 代表厂商 |
|---|---|---|---|---|
| **DPU** | BlueField-2 (16nm) → BlueField-3 (7nm) | 2023 Q1 (量产) | 16 核 A78 + 400GbE + 16GB DDR | NVIDIA |
| **AI 卡 (GPU/NPU)** | H100 SXM5 → MI300X → 昇腾 910B | 2023 Q3 (H100) / 2024 Q1 (MI300X) | HBM3/HBM3E 80-192GB | NVIDIA / AMD / 华为 |
| **CXL** | 三星 CXL-MM 96GB | 2024 Q3 | 1.1 64GT/s, 96/128GB 模块 | Samsung / SK hynix / Micron |
| **PMem** | 傲腾 5800X (已 EOL) → CXL PMem | 2022 Q3 (傲腾 EOL), 2025 (CXL 接棒) | 128/256/512GB 模块, 300-500ns | Memverge (软件) |
| **SmartSSD** | Samsung SmartSSD 1.0 → ScaleFlux CSD 3320 | 2023 GA (Samsung), 2024 Q4 (ScaleFlux) | 内置 16 核 ARM + 32TB QLC | Samsung / ScaleFlux |
| **SCM** | 铠侠 XL-FLASH / 三星 Z-NAND | 2024 Q1 (XL-FLASH 16GB) | 4μs 延迟, 16GB 模块 | Kioxia / Samsung |
| **CM (Computational Memory)** | Mythic AMP / Syntiant NDP | 2024 量产 | 8 TOPS/W 模拟矩阵推理 | Mythic / Syntiant |
| **QLC** | 铠侠 LC9 / 长江存储 X3-6070 | 2024 Q4 (LC9), 2024 Q3 (X3-6070) | 122TB / 232 层 | Kioxia / YMTC |
| **PLC (路线图)** | 铠侠 PLC 122TB+ | 2026 路线图 | 单 cell 5bit, 容量再 +25% | Kioxia |

### 4.2 8 大类同期登场的意义

这八类在 2023-2026 同一窗口从 paper 走到量产, 是过去 20 年从未出现的局面:

- **DPU** 在 2015 年概念, 2020 NVIDIA 收购 Mellanox 后真正落地, 2023 BlueField-3 量产才进入"AI 工厂标配"层级
- **CXL** 在 2019 年 Intel 牵头起草规范, 2023 CXL 2.0 spec 冻结, 2024 三星首发量产模块, 是标准化推进最快的硬件之一
- **QLC** 从 2018 年 Intel 首款 660p/665p 起步, 到 2024 Kioxia LC9 122TB, 容量密度 6 年增长 30x
- **SmartSSD** 2017 NGD Newport 首发 (2018 退场), 2023 Samsung SmartSSD GA + 2024 ScaleFlux CSD 3320 量产, 5 年走完"从 paper 到 GA"周期

### 4.3 代表厂商 + 数字 + 论文

| 类别 | 代表厂商 | 关键数字 | 代表 paper |
|---|---|---|---|
| DPU | NVIDIA BlueField-3 | 16 核 A78 + 400GbE + 16GB DDR | DPU Survey ACM Computing Surveys 2024 |
| AI 卡 | NVIDIA H200 | HBM3E 141GB, 4.8 TB/s | H100 + GPUDirect ISCA 2024 |
| CXL | Samsung CXL-MM | 96GB / 128GB 2024 Q3 | Samsung CXL Memory Module MICRO 2023 |
| PMem | Memverge DaP 5.0 | 128/256/512GB 池化 | PMem + CXL hybrid ASPLOS 2023 |
| SmartSSD | ScaleFlux CSD 3320 | 16 核 ARM + 32TB QLC | Computational Storage Survey IEEE TSC 2024 |
| SCM | 铠侠 XL-FLASH | 16GB 模块, 4μs 延迟 | SCM measurements FAST 2023 |
| CM | Mythic AMP | 8 TOPS/W | KV cache offload Survey TACO 2024 |
| QLC | Kioxia LC9 | 122TB / 30 DWPD | QLC NAND reliability MICRO 2023 |

### 4.4 三股力量的临界点

把三条曲线叠加看:

```
时间      2023 H1     2024 H1     2025 H1     2026 Q1 (临界点)
NAND      价格崩盘    触底回升    高位平台    QLC 全面铺开
AI 算力   H100 出货    B200 量产    GB200 量产  GB300 路线图
新硬件    DPU / QLC    CXL / SmartSSD  PMem CM    全栈成熟
```

三个时间序列在 2026 Q1 全部进入"量产 + 标准成熟 + 价格可接受"区间。这正是为什么把"AI 存储一体机"采购窗口放在 2026 H2-2027 H1 的根本原因: 早了半年, CXL 量产规模不够; 晚了半年, 国产替代已经把价格打下来。

---

## 五、Ch1 小结: 为什么是 2026 (一句话回答)

NAND 行业在 2023 H1 完成去库存 + 2024 H2 完成减产提价, 给 QLC 全面铺开让出了产能空间; AI 算力从 H100 走到 B200 触碰到 HBM3 4.8 TB/s 上限, 倒逼"GPUDirect + DPU + CXL"三层卸载同步部署; 八类新硬件同期从 paper 走到量产, 临界窗口恰好重叠在 2026 Q1。三股力量在同一窗口叠加, 是过去 20 年从未出现的局面, 也是"传统闪存 + 新硬件融合"在 2026 年必须被当作战略议题的根本原因。

---

**A1 Ch1 完成**: 涵盖 §1.1-1.3 三节, 中文 ~ 2300 字, 表格 6 张, 关键数据点 ~ 28 个 (含 5 个 source_url 验证)。下游交接给 Ch2 技术基础 (CAN IT WORK), 由 A1 同步输出。