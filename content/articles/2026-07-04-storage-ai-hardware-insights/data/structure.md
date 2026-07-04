# 传统闪存 + 新硬件全景图 2026 — 结构大纲

> **副标题**: 从 NAND 拐点到 AI 存储一体机的 12-18 月行动地图
> **生成**: A0-master-planner / 2026-07-04
> **总章节**: 5 (渐进式 WHY NOW → CAN IT WORK → SHOULD WE SHIP → WILL IT PAY OFF → WHAT'S NEXT)
> **总节数**: 23
> **覆盖厂商**: 50 (国际 27 + 国产 19 + 国内独角兽 5)
> **覆盖论文**: 100 (硬件 50 + 软件 50, 来自 preset.json)
> **UI 风格**: 深蓝 `#3a4a6b` + 米白 `#f4f2ed`, 卡片网格 280px, PingFang SC / 微软雅黑
> **交付**: index.html + structure.json + structure.md + report.json + 5 张 SVG 图

---

## 全局论点 (Thesis)

2023-2026 三年间, NAND 行业经历完整周期反转, AI 算力触碰 I/O 墙, 八类新硬件 (DPU / AI 卡 / CXL / PMem / SmartSSD / SCM / CM / QLC) 同期从论文走向量产。三股力量在同一窗口叠加, 使"传统闪存 + 新硬件"融合在 2026 年达到临界点。本报告以此为出发点, 用 5 章节渐进结构, 回答四个递进问题:

1. **WHY NOW** — 为什么是 2026 (Ch1 演化)
2. **CAN IT WORK** — 工程上能不能跑通 (Ch2 技术基础)
3. **SHOULD WE SHIP** — 企业能否合规落地 (Ch3 风险与合规)
4. **WILL IT PAY OFF** — 资本和生态是否支持 (Ch4 商业化)
5. **WHAT'S NEXT** — 12-18 月内该怎么动 (Ch5 展望)

---

## Ch1 · 演化 (WHY NOW) — 时间锚点

**核心问题**: 为什么是现在?

§1.1 **2023-2026 闪存行业拐点** — 五家头部 (Samsung / Kioxia / SK hynix / Micron / Western Digital) 财报中 2023 H1 价格崩盘 → 2024 H2 减产 → 2025 H2 价格回升 → 2026 Q1 QLC 全面铺开。三个时间锚点 + 五家厂商 ASP/CapEx 曲线。

§1.2 **AI 算力爆发与存储 I/O 墙** — H100 HBM3 3.35TB/s vs NAND SSD 7GB/s 的代差, GPUDirect Storage 1.4 必要性; 70B 模型 KV cache 单请求 80GB, 显存撑不住; 引用 ISCA 2024、SIGCOMM 2023。

§1.3 **8 大新硬件类同期登场** — DPU (BlueField-3 2023 量产) / AI 卡 (H100/MI300/昇腾 2023-2024) / CXL (1.1→2.0, 三星/海力士/美光 2024 首批) / PMem (傲腾退役 → CXL PMem 接棒) / SmartSSD (Samsung + ScaleFlux 量产) / SCM (XL-FLASH/Z-NAND) / CM (Mythic AMP) / QLC (铠侠 LC9 / 长江存储 X3-6070)。每类给"首个商用产品年份 + 容量/带宽 + 一篇代表 paper"。

---

## Ch2 · 技术基础 (CAN IT WORK) — 工程可行

**核心问题**: 八类硬件各自的原理、性能、与传统闪存的接口点?

§2.1 **DPU 卸载** — NVMe-oF target + SPDK 用户态驱动 + QAT 压缩 + AES-NI/IPSec 加密; BlueField-3 16 核 A78 + 400GbE + 16GB DDR; 主线论文 OSDI 2023 / NSDI 2023 / NSDI 2022。

§2.2 **AI 卡 + 存储集成** — GPUDirect Storage 直通 NVMe、KV cache 卸载 SSD/PMem/CXL、vLLM paged attention + TensorRT-LLM + DeepSpeed-Inference 三层栈。

§2.3 **CXL 内存池化** — 1.1/2.0/3.0 三代演进, Type-3 + switch + fabric; 三星 CXL-MM 96GB/128GB 2024 Q3 量产。

§2.4 **持久内存 + CXL PMem** — 傲腾退役后, SplitFS / Zen / Hotpot 接棒; 容量 128/256/512GB, 延迟 300-500ns。

§2.5 **SmartSSD / 计算存储** — ScaleFlux CSD3320 (16 核 ARM + 6.4TB) + Samsung SmartSSD 2.0; 数据库下推算子 12 种 (POLYNIS); Transformer 推理 SSD 内 2.1x 加速 (NDP++)。

§2.6 **SCM / Computational Memory** — 铠侠 XL-FLASH + 三星 Z-NAND 填补 DRAM-NAND 鸿沟; Mythic AMP 8TOPS/W 模拟矩阵推理。

§2.7 **QLC / PLC NAND** — 单 cell 4bit / 5bit; 铠侠 LC9 122TB 单盘 30 DWPD; 长江存储 X3-6070 232 层 3D QLC; PLC 容量 +25% 寿命 -50%。

§2.8 **8 类硬件对比矩阵** — 一张汇总表, 列容量 / 带宽 / 延迟 / $/GB / 典型用例 / 与 CPU/GPU 的接口; Mermaid + HTML table 双呈现。

---

## Ch3 · 风险与合规 (SHOULD WE SHIP) — 企业落地

**核心问题**: 技术能用 ≠ 能落地。出口管制 + 数据主权 + 硬件 TEE 三重门槛决定选型与采购周期。

§3.1 **硬件 TEE** — Intel SGX 退役 → TDX 接棒; AMD SEV-SNP; ARM CCA 2024 规范冻结; NVIDIA H100 CC GPU 显存加密 + PCIe 链路加密; 昇腾 NPU TEE (IEEE S&P 2024)。

§3.2 **出口管制** — 2022.10 / 2023.10 / 2024.12 / 2025.01 四轮 BIS 规则; H100/A100/H200 禁运 → H20/L20 中国特供版; 国产替代窗口期 2026-2028。

§3.3 **兼容与标准化** — NVMe-oF 1.1 (TCP/RDMA/FC) + CXL 2.0 + OCP SAF 1.0 + OCP Cloud SSD v2 (14 厂商互通)。

§3.4 **数据主权** — GDPR Art.44 + 中国《数据安全法》(2021.9) + 《关基条例》+ 《生成式 AI 服务管理暂行办法》(2023.8); 信创采购目录 2024 扩容至 DPU/CXL 设备。

---

## Ch4 · 商业化 (WILL IT PAY OFF) — 资本 + 生态

**核心问题**: 50 家厂商谁在赢, 钱往哪流?

§4.1 **国际大厂 27 家** — 8 闪存 + 6 AI/DPU + 6 存储集成 + 4 国际独角兽 + 3 国际 Niche = 27; 每家 1-2 句话定位 + 关键产品 + 一组营收/估值数据。

§4.2 **国产 19 家** — 4 闪存 + 6 AI + 4 DPU + 4 存储集成 + 5 国内独角兽 (按需求取 19); 政策导向与替代节奏标注。

§4.3 **独角兽 + Niche 12 家** — Lightbits (NVMe-oF disagg) / ScaleFlux (计算存储) / Pliops (KV 加速) / Memverge (大内存池化) 等 12 家差异化技术点。

§4.4 **投资并购** — 标志性四笔: NVIDIA→Mellanox $6.9B (2020) / AMD→Pensando $1.9B (2022) / Intel→Habana $2B (2019) / Meta→Fungible (2023); 解释 DPU 战局演化; 加 Marvell OCTEON 10 / Broadcom Stingray PS1100R 2024 量产。

---

## Ch5 · 12-18 月展望 (WHAT'S NEXT) — 行动地图

**核心问题**: 未来 12-18 月, CISO / 架构师 / CFO 各自该做什么?

§5.1 **3 大趋势** — AI 存储一体机 (NVIDIA DGX SuperPOD / 华为 Atlas 900) 2026 主流; CXL 内存池化 2026 H2 首批大规模部署; 国产替代 DPU + PMem 双线。

§5.2 **CISO / 架构师 / CFO 行动清单** — CISO: 硬件 TEE 选型 + 数据主权清单; 架构师: GPUDirect + DPU + CXL 三层参考架构; CFO: H20 / 昇腾 910C / 寒武纪 590 单卡 TCO 对比。

§5.3 **风险预警** — 2025 Q4 - 2026 Q2 可能再有 BIS 规则; NVIDIA CUDA 13 / AMD ROCm 7 锁生态; 国产替代节奏与新版规则赛跑。

§5.4 **12-18 月里程碑** — 3 张季度表 (2026 Q3 / 2026 Q4 / 2027 Q1), 每张 4-6 个产品/标准里程碑; 共 12-18 个里程碑 (Blackwell B200 量产 / 铠侠 PLC 122TB / CXL 3.0 fabric 首批 / 长江存储 300+ 层 QLC 等)。

---

## 数据流与下游交接

```
preset.json (50 厂商 + 100 论文)
    ↓
A0-master-planner (本 agent)
    ↓ 写 structure.json + structure.md
A1-research / A2-research / A3-research (并行深度调研, 补财报/法规/并购)
    ↓
M1-writer (写 index.html + report.json)
    +
M2-designer (画 5 张 SVG 图)
    +
M3-qa (反幻觉校验: 所有 vendor/paper 必须能在 preset.json 中找到)
```

---

## 反幻觉铁律 (M3 校验用)

1. **vendor 名严格匹配**: 本大纲出现的所有厂商名字必须能在 `preset.json` 的 10 个 category 中找到
2. **paper 名严格匹配**: 所有论文必须能在 `preset.json` 的 10 个 paper category 中找到
3. **数字 realistic**: depth_kpi 中 paragraphs_min / data_points_min / papers_min / vendors_min 与 target_length_kb 成正比, 不出现"10 段 10 数据点"这类过低/过高值
4. **章节-论文对应**: 每节 key_papers_hint 引用必须与 preset.json 中所属 category 主题一致
5. **厂商分类不重叠**: 同一厂商不在国际和国产两边出现 (Huawei OceanStor 分国际/国产两行, 这是 preset.json 本身的规定)

---

## UI 风格 (与 2026-06-18 data-security 文章保持一致)

| 元素 | 值 |
|---|---|
| accent_color | `#3a4a6b` (深蓝, 标题/卡片边框) |
| bg_color | `#f4f2ed` (米白, 页面背景) |
| card_bg | `#ffffff` |
| text_primary | `#1a1a1a` |
| text_secondary | `#5a5a5a` |
| max_width | `860px` (阅读舒适宽度) |
| card_grid_min | `280px` (响应式网格) |
| font | `PingFang SC, Microsoft YaHei, -apple-system, sans-serif` |
| font_mono | `JetBrains Mono, Menlo, Consolas, monospace` |
| radius | `10px` |
| shadow | `0 2px 12px rgba(58, 74, 107, 0.08)` |

---

**A0 完成。structure.json 31KB / 5 章 23 节 / 50 厂商 / 100 论文引用。交接给 A1/A2/A3 做深度调研。**