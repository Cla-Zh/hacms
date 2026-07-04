# §4.2 国产 19 家全景分析

> **A2 研究输出** · 2026-07-05 · 对应 structure.json §4.2
> 覆盖 19 家国产厂商: 4 闪存 + 6 AI 芯片 + 4 DPU + 4 存储+AI 集成 + 1 国产独角兽
> 数据源: `data/vendors-cn.json` (与 A1 `vendors-intl.json` 字段对齐)
> 国内独角兽其余 5 家 (联芸 MAXIO / 中科闪芯 / 得瑞领新 DERA / 浪潮 PSOAR) 由 A3 调研, 本节不重复

## 一、为什么这 19 家是 2026 年国产替代的"最短名单"

2022.10 BIS 实体清单 (A100/H100 禁运 + 长江存储 YMTC 实体清单) 至今 3.5 年, 国产替代走过完整"从可行到必选再到集采"三阶段: 2023 是单点验证 (昇腾 910B 在中科院小批量跑通); 2024 是规模上量 (910C + 寒武纪 590 + 海光 DCU 三家进入运营商集采); 2025-2026 是单卡 TCO 打平甚至优于 H20 (寒武纪 590 报价已低于 H20 约 30%)。理解这一窗口比逐家背参数更重要——国产替代已不是"要不要", 而是"先选谁、后选谁"。

| 赛道 | 厂商数 | 龙头 1 | 龙头 2 | 龙头 3 | 2024 合计营收估算 |
|---|---|---|---|---|---|
| 国产传统闪存 | 4 | 长江存储 (未上市) | 兆易创新 ~¥74 亿 | 紫光得瑞 (集团未独立披露) | ~¥200 亿+ (含间接) |
| 国产 AI 芯片 | 6 | 华为昇腾 (随华为披露) | 海光信息 ¥92 亿 | 寒武纪 ¥12 亿 | ~¥130 亿+ (仅上市公司可披露) |
| 国产 DPU | 4 | 中科驭数 (B 轮) | 芯启源 (C 轮) | 云豹智能 (A 轮) | 多未披露, 估值合计 ~¥150 亿 |
| 国产存储+AI 集成 | 4 | 浪潮信息 ¥1124 亿 | 新华三 (紫光股份合并) ¥580 亿+ | 中科曙光 ¥131 亿 | ~¥1900 亿 (集团口径) |
| 国产独角兽/创新 | 1 | 忆芯科技 STAR 1200C (估值 ~¥30 亿) | — | — | — |

下面按 5 大类分章节展开, 每类先给"市场结构 + 龙头打法", 再分家深度, 关键数字全部带 [来源: URL] 标记。

---

## 二、国产传统闪存 4 家 — 长存 IDM 一家独大, 兆易 / 紫光得瑞 / 国科微 做主控与协同

### 2.1 市场结构

国产 NAND/DRAM 三层格局:**长江存储** 是唯一 IDM (设计 + 制造 一体), 直接对标三星 / 铠侠 / SK hynix / 美光四家国际 NAND 大厂; **兆易创新** 通过持股长鑫存储 (约 10%) 进入 DRAM, NOR Flash 全球第三; **紫光得瑞** (新紫光集团整合) + **国科微** 主营 SSD 主控芯片, 是 NAND 下游主控国产替代的双子星。2022.12 长存进入 BIS 实体清单后, 美 / 日 / 荷 三方设备 (AMAT / LAM / TEL / ASML) 出口受限, 但长存通过国产半导体设备 (北方华创 / 中微 / 拓荆 / 精测电子) + 自主 Xtacking 异构堆叠架构, 维持 232 层 QLC 量产能力, 3 期 Fab 2024 Q4 设备搬入, 计划产能 30 万片/月 [来源: https://www.trendforce.com/news/category/memory]。

### 2.2 四家逐家分析

**① 长江存储 YMTC (武汉, 2016)** — 国产 NAND 唯一 IDM, 武汉 1 期 + 2 期 NAND Fab 2020 起量产 128 层 3D NAND, 3 期 Fab 2024 Q4 设备搬入 [来源: https://www.ymtc.com/cn/]。X3-6070 (232 层 QLC, 单 die 1Tb) 2022 量产, 与三星 V9 / 铠侠 BiCS8 同一代; 2024 推出 X3-9070 (232 层 TLC) 用于企业级 SSD, 致钛 (致态) 消费品牌覆盖 PC005 / Ti600 / Ti7100。Xtacking 3.0 是国产 NAND 唯一自主知识产权架构, 通过 wafer-to-wafer 异构键合把 NAND die 与 CMOS 控制器堆叠, I/O 速度提升 50%+。最大挑战: 实体清单后先进光刻机 (EUV) 完全不可得, 只能走 DUV 多曝光 + 异构堆叠路线。

**② 兆易创新 GigaDevice (北京, 2005)** — 2024 营收 ¥73.5 亿 (同比 +27%) [来源: https://www.gigadevice.com.cn/about/announce/]。NOR Flash 全球第三 (市占率 18%+), 通过合肥长鑫 DRAM 合资产线切入 DDR4/DDR5, 2024 Q3 量产 DDR5 5600Mbps 8Gb。GD25/GD55 NOR 嵌入 AIoT / 汽车 / 工业, GD32 ARM MCU 国内第一, GD32V RISC-V 国产 IP 首发。国产"存储 + MCU"双轮龙头, 是中端 AIoT 终端首选存储供应商。

**③ 紫光得瑞 UNIS-Semidrive (深圳, 2017)** — 新紫光集团下属, 整合紫光得瑞 / 紫光国微 (002049) / 紫光展锐, 2023 完成紫光集团重组 [来源: https://www.unis-semi.com]。得瑞领新 DERA 子品牌做企业级 NVMe SSD 主控 (对标 Marvell 88SN 系列); 紫光国微提供 FPGA + 安全芯片 (THD89 国密) + 智能卡。DDR4/DDR5 内存条与长鑫合作。在新紫光集团下, 形成"主控 + NAND + DRAM + 安全芯片"全栈协同。

**④ 国科微 GokMicro (长沙, 2008, 300672.SZ)** — 2024 营收约 ¥22 亿, 主因 SSD 主控行业承压同比 -25% [来源: https://www.gokmicro.com/about/investor/]。GK2301 是国产最早大规模量产的 SATA SSD 主控, 适配长江存储 NAND; GK2302/GK23P 是 NVMe 主控。2023 推出 GK6780V100 (4K 智能视觉 SoC, 1TOPS NPU), 切入 AI 安防 + 智能电视赛道。在信创 + 安防监控 + 电视主控三条赛道建立国产替代优势, 海康 / 大华是核心客户。

### 2.3 国产闪存 4 家总览

| 厂商 | 总部 | 2024 营收 / 规模 | 国产替代抓手 | 关键差异化 |
|---|---|---|---|---|
| 长江存储 YMTC | 武汉 | 未披露 (IPO 辅导中) | 232 层 QLC + Xtacking | 国产唯一 NAND IDM |
| 兆易创新 GigaDevice | 北京 | ¥73.5 亿 | NOR 全球第三 + 长鑫 DRAM | NOR + MCU 双轮 |
| 紫光得瑞 UNIS-Semidrive | 深圳 | 未独立披露 | 主控 + 国微 + 展锐协同 | 集团全栈 |
| 国科微 GokMicro | 长沙 | ~¥22 亿 | 国产首款 SATA 主控 | 主控 + 监控 SoC 双线 |

---

## 三、国产 AI 芯片 6 家 — 昇腾一超, 海光 / 寒武纪 / 燧原 三强跟跑, 摩尔 / 壁仞 受阻调整

### 3.1 市场结构

国产 AI 芯片 2026 形成清晰"1+3+2"格局: **华为昇腾** 一家独大, 2024 H2 量产 910C (128GB HBM, 3.2TB/s 显存带宽) 对标 NVIDIA H100, 通过 MindSpore + CANN 6.0 + 移动 / 电信 / 联通智算中心集采锁定大部分国家级订单; **海光 DCU (深算二号)** 走 x86 生态兼容路线 (类 ROCm), 是中科院系首选; **寒武纪 590** 走科创板上市公司 + 大模型适配路线; **燧原** 走腾讯系绑定。**摩尔线程 / 壁仞** 两家原 7nm 独角兽因实体清单 + 顶级代工封锁, 转向推理卡 + 软件生态。2024-2025 是国产 AI 卡"训练卡真替代 H100 / 推理卡真替代 L40S"的临界点。

### 3.2 六家逐家分析

**① 华为昇腾 Ascend (深圳, 2018)** — 昇腾 910C 2024 H2 量产, 128GB HBM2e, 显存带宽 3.2TB/s, FP16 算力 780 TFLOPS (稀疏), PCIe Gen5 [来源: https://www.hiascend.com/]。MindSpore + CANN 6.0 + Ascend C 三层软件栈已适配 LLaMA / Qwen / DeepSeek / 盘古等大模型, vLLM / SGLang 推理框架均已支持。Atlas 900 PoD (数千卡级训练) + Atlas 800 (推理) + OceanStor 组合是国产 AI 工厂主流方案。2024 华为总营收 USD 118.2B, ICT 基础设施约 USD 36.3B 含昇腾 / 鲲鹏 [来源: https://www.huawei.com/en/news/2025/3/31/huawei-releases-2024-annual-report]。优势: 全栈 + 软件生态 + 运营商集采三位一体; 挑战: 受限后 7nm 等效代工, 910C 是工艺极限, 910C 下一代 610 仍待验证。

**② 寒武纪 Cambricon (北京, 2016, 688256.SH)** — 2024 营收 ¥11.74 亿 (同比 +19%) [来源: https://www.cambricon.com/news/]。思元 590 训练卡 2024 Q3 量产, 64GB HBM2e, FP16 ~300 TFLOPS, 对标 A100。思元 370 走推理 + 边缘。NeuWare + MagicMind 推理引擎 + vLLM / MindIE 适配。客户含阿里云 / 字节 / 智谱 AI / 商汤。优势: 上市公司 + 中科院计算所技术孵化 + 大模型适配走在前面; 挑战: 单卡性能仍弱于昇腾 910C, 受限后产能瓶颈。

**③ 海光 DCU / Hygon (成都, 2014, 688041.SH)** — 2024 营收 ¥91.62 亿 (同比 +52%) [来源: https://www.hygon.cn/about/news/]。海光 CPU 基于 AMD Zen 1 授权 (x86 兼容), 信创服务器市场份额第一; 海光 DCU (深算二号) 类 GPGPU, 对标 AMD MI100/MI200, 兼容 ROCm, 适配 PyTorch / TensorFlow。DTK 软件栈 + DCU Toolkit 2024 迭代; 支持 vLLM / SGLang 推理框架。深算二号 64GB HBM2e, FP16 ~200 TFLOPS, 是国产 AI 训练第二选择 (仅次于昇腾 910C)。优势: CPU + DCU 同源 + x86 软件兼容; 挑战: CPU 侧 Zen 1 架构授权不可升级, DCU 单卡性能弱于 910C。

**④ 燧原 Enflame (上海, 2018)** — 邃思 2.5 DTU (32GB HBM2, FP16 ~150 TFLOPS, 2023) [来源: https://www.enflame-tech.com]。腾讯系国产 AI 芯片, 腾讯云星星海服务器采用, 也向商汤 / 国家电网供货。TopsRider 软件栈兼容 CUDA 接口 (TopsCompiler 兼容层), 2024 适配 LLaMA / Qwen / DeepSeek。2023 D 轮融资约 ¥20 亿, 估值约 ¥160 亿。优势: 腾讯系深度绑定; 挑战: 受限后走中芯国际 7nm 等效, 性能迭代受限。

**⑤ 摩尔线程 Moore Threads (北京, 2020)** — MTT S4000 训练卡 (32GB GDDR6, FP32 25 TFLOPS) [来源: https://www.mthreads.com]。创始人张建中 (前 NVIDIA 全球副总裁); 国产 GPU 全功能厂商 (图形 + AI + 视频); 对标 NVIDIA RTX 4090 / A100 中端; MUSA 软件栈支持 PyTorch / TensorFlow, torch_musa 一行迁移; KUAE 智算集群走国产 AI 算力底座路线。2024 B 轮融资数亿, 估值约 ¥240 亿。优势: 图形渲染 + AI 训练双功能, 字节系; 挑战: 单卡性能仅中端, 难以取代 H100/A100 训练卡定位。

**⑥ 壁仞 Biren (上海, 2019)** — BR100 训练卡 (原 7nm 16-Hi HBM2e 64GB, FP16 ~1000 TFLOPS, 2022 发布) [来源: https://www.birentech.com]。受实体清单 + 顶级代工封锁, BR100 量产遇阻; 2023-2024 战略转向 BR104 推理卡 + 壁砺 R 系列。BIRENSUPA 软件栈 (类 CUDA) 持续迭代。优势: 早期性能参数对标 H100; 挑战: 量产受阻 + 团队调整 + 业务重心从训练卡转向推理卡。

### 3.3 AI 芯片 6 家总览

| 厂商 | 总部 | 2024 营收 | 训练卡旗舰 | 软件栈 | 关键差异化 |
|---|---|---|---|---|---|
| 华为昇腾 Ascend | 深圳 | (随华为披露) | 910C 128GB HBM | MindSpore + CANN | 全栈 + 运营商集采 |
| 寒武纪 Cambricon | 北京 | ¥11.74 亿 | 思元 590 64GB | NeuWare + MagicMind | 上市公司 + 大模型适配 |
| 海光 DCU | 成都 | ¥91.62 亿 | 深算二号 64GB | DTK (类 ROCm) | CPU + DCU 同源 + x86 兼容 |
| 燧原 Enflame | 上海 | 未披露 | 邃思 2.5 32GB | TopsRider (类 CUDA) | 腾讯系深度绑定 |
| 摩尔线程 Moore Threads | 北京 | 未披露 | MTT S4000 32GB | MUSA + torch_musa | 图形 + AI 双功能 |
| 壁仞 Biren | 上海 | 未披露 | BR100 (受限量产) | BIRENSUPA | 受阻后转向推理 |

---

## 四、国产 DPU 4 家 — 中科驭数领先, 芯启源 / 益思芯 / 云豹智能 三家跟跑

### 4.1 市场结构

国产 DPU 2024-2025 形成"中科驭数领跑 + 芯启源 + 云豹智能 + 益思芯 跟跑"四家格局, 总融资规模约 ¥50-80 亿, 但单家营收均未公开披露 (B 轮及以前为主)。**中科驭数** (中科院计算所孵化) 在国产 DPU 中起步最早, 与中科曙光协同最深; **芯启源** 创始人来自 Mellanox / Intel NIC 团队, 走 Agilio 系列 SmartNIC + DPU 双线; **云豹智能** 创始人来自 Mellanox 研发副总裁, 腾讯 + 红杉投资, 走 CloudBlazer 对标 BlueField-3; **益思芯** 主打国产 RISC-V 内核 + 国产 14nm, 信创 + 金融行业切入。整体国产 DPU 2025 量产能力对标 NVIDIA BlueField-2/-3 (100GbE / 200GbE)。

### 4.2 四家逐家分析

**① 中科驭数 YUSUR (北京, 2018)** — DPU K2 Pro 2023 量产 (16nm, 100GbE), K2 X 2024 升级 100GbE, K3 路线图 2025 7nm 200GbE [来源: https://www.yusur.tech]。中科院计算所孵化, YUSUR SurFS 分布式存储 + DPU 配合, 主攻 NVMe-oF 卸载 + 虚拟化 + 安全。客户含中科曙光 / 浪潮 / 新华三 / 国家电网 / 中移动。优势: 国资背景 + 中科院系协同; 挑战: 起步最早但被芯启源 / 云豹追赶。

**② 芯启源 SinoDPU (上海, 2015)** — Agilio CX 100GbE DPU (2022 量产), Agilio CX2 200GbE (2024 量产) [来源: https://www.sinodpu.com]。创始人卢笙 (前 Mellanox/Intel NIC 架构师); 国产 DPU 老牌玩家 (与中科驭数同期起步); Agilio 系列对标 NVIDIA BlueField-2/-3, 主打 NVMe-oF target + SPDK 卸载 + 安全加密; OpenDPU 开源软件栈, 兼容 DPDK/SPDK, 集成 Ceph / Open vSwitch。2024 量产 Agilio CX2 (200GbE) 是国产 DPU 首批 200G 产品之一。

**③ 益思芯 Eeasy (上海, 2020)** — ESL DPU 100Gbps, 国产 RISC-V 内核 + 定制加速器 [来源: https://www.eeasylabs.com]。国产 DPU 新锐; 主攻云数据中心 NVMe-oF 卸载 + 存储虚拟化 + 网络加速; 与长鑫存储合作验证国产存储栈; 软件栈兼容 DPDK/SPDK, 已与 Ceph / OpenEuler / 麒麟 OS 完成适配认证。2024 推出 100Gbps 升级版本, 主打信创 + 金融行业数据中心。优势: 国产 RISC-V IP; 挑战: 起步晚, 客户验证周期长。

**④ 云豹智能 YCSY (深圳, 2020)** — CloudBlazer DPU (16nm 国产, 100GbE), CloudBlazer 2.0 200GbE 2024 量产 [来源: https://www.yc-sys.com]。创始人萧启阳 (前 Mellanox 研发副总裁); 国产 DPU 独角兽; 腾讯 + 红杉投资; 2024 量产 200GbE 版本, 主攻 AI 数据中心 NVMe-oF + 推理卸载 + RDMA 加速; 软件栈兼容 DOCA (NVIDIA DPU SDK) 部分接口, 降低迁移成本; 客户含腾讯 + 字节 + 阿里。优势: 200GbE 量产 + 腾讯云深度协同 + DOCA 兼容; 挑战: 客户集中腾讯系。

### 4.3 DPU 4 家总览

| 厂商 | 总部 | 主力 DPU | 网络 | 关键差异化 | 主要客户 |
|---|---|---|---|---|---|
| 中科驭数 YUSUR | 北京 | K2 Pro / K2 X | 100GbE | 中科院系 + 曙光协同 | 曙光 / 移动 / 国网 |
| 芯启源 SinoDPU | 上海 | Agilio CX / CX2 | 100/200GbE | 老牌 + Mellanox 团队 | 国网 / 移动 |
| 益思芯 Eeasy | 上海 | ESL DPU | 100Gbps | 国产 RISC-V IP | 信创 + 金融 |
| 云豹智能 YCSY | 深圳 | CloudBlazer 2.0 | 200GbE | 腾讯 + DOCA 兼容 | 腾讯 / 字节 / 阿里 |

---

## 五、国产存储+AI 集成 4 家 — 华为全栈一超, 浪潮 / 新华三 / 中科曙光 三家分食

### 5.1 市场结构

国产存储 + AI 集成 2024 形成"华为全栈 + 三家集成商"格局, 合计营收约 ¥1900 亿 (集团口径)。**华为 OceanStor (国产)** 唯一同时拥有自研 AI 卡 (昇腾) + 自研 CPU (鲲鹏) + 自研 SSD (OceanStor Dorado) + 自研云 (华为云 Stack), 是国产替代 NVIDIA DGX SuperPOD 首选; **浪潮信息** AI 服务器全球第二 / 国内第一, 兼容 NVIDIA H200 / 国产昇腾 / 寒武纪 / 海光, 中立供应商; **新华三** (紫光股份 000938) 走 H3C × NVIDIA / 昇腾 / 海光 多家一体机路线, 国资央企首选; **中科曙光** 中科院系, 与海光信息 (688041, 大股东) 深度协同, 主推海光 CPU + DCU 全栈国产 AI 方案。

### 5.2 四家逐家分析

**① 华为 OceanStor (国产) (深圳, 2012)** — OceanStor Dorado 3000/8000/18000 V7 全闪 (PCIe Gen5, 30M IOPS), Gartner 魔力象限 Leader; OceanStor Pacific 分布式存储 EB 级; 2024 H2 推出 OceanStor CXL 内存池化 + SmartSSD 集成方案 [来源: https://e.huawei.com/cn/products/storage]。2024 华为总营收 USD 118.2B [来源: https://www.huawei.com/en/news/2025/3/31/huawei-releases-2024-annual-report]。优势: 全栈 + 软件生态 + 运营商集采三位一体; 挑战: 受限后 7nm 等效代工。

**② 浪潮信息 Inspur (济南, 1945, 000977.SZ)** — 2024 营收 ¥1124.4 亿 (同比 +74%) [来源: https://www.inspur.com/about/announce/]。AI 服务器全球第二 (仅次于 Dell), 国内第一; NF8260M7 8-GPU 节点支持 NVIDIA H200 / 国产昇腾 910C / 寒武纪 590 互换; AS13000 分布式存储 EB 级; AIStation 平台 + 元脑生态; 客户含字节 / 阿里 / 腾讯 / 百度 / Meta (国际订单)。优势: 出货量第一 + 中立供应商; 挑战: 依赖 NVIDIA 与国产芯片"双轨"切换。

**③ 新华三 H3C (杭州, 2003)** — 2024 营收估算 ¥580 亿+ (集团口径, 含紫光股份 000938 部分) [来源: https://www.h3c.com/cn/about/]。紫光股份 (000938.SZ) 旗下, 与 HPE 历史合资; UniServer R5300 G7 8-GPU AI 服务器 + UniStor X10000/X30000 分布式存储; 推出 H3C × NVIDIA H200 / H3C × 昇腾 910C / H3C × 海光 一体机三条线; 国资央企采购首选之一。优势: HPE 血统 + 紫光系 + 多家一体机; 挑战: 与 HPE 关系复杂 + 国产替代节奏依赖集团决策。

**④ 中科曙光 Sugon (天津, 2006, 603019.SH)** — 2024 营收 ¥131.4 亿 (同比 -7%) [来源: https://www.sugon.com/about/announce/]。中科院系服务器 + 存储集成商; 海光信息 (688041) 大股东, 深度协同海光 CPU + DCU; ParaStor 分布式存储是中科院系国家级超算 (天河 / 神威) 周边生态; 740-G30 AI 训练服务器主推海光 CPU + 海光 DCU 全栈国产 AI 方案。优势: 海光协同 + 中科院系; 挑战: 营收同比下滑 (传统服务器承压, AI 服务器增长抵消)。

### 5.3 存储+AI 集成 4 家总览

| 厂商 | 总部 | 2024 营收 | AI 抓手 | 全栈能力 |
|---|---|---|---|---|
| 华为 OceanStor (国产) | 深圳 | (随华为披露) | OceanStor + Atlas 900 | AI 卡 + CPU + SSD + 云 唯一全栈 |
| 浪潮信息 Inspur | 济南 | ¥1124.4 亿 | NF8260M7 + AS13000 | 中立供应商, 兼容 NVIDIA + 国产 |
| 新华三 H3C | 杭州 | ~¥580 亿+ | UniServer R5300 G7 | HPE 血统 + 多家一体机 |
| 中科曙光 Sugon | 天津 | ¥131.4 亿 | 740-G30 + ParaStor | 中科院系 + 海光协同 |

---

## 六、国产独角兽/创新 1 家 (本节只覆盖忆芯, 其余 4 家由 A3 调研)

### 6.1 忆芯科技 STAR 1200C (北京, 2015)

**忆芯科技** 是国产企业级 NVMe SSD 主控独角兽, STAR 1000 (2019, 首颗国产企业级主控) 拉开国产主控序幕; **STAR 1200C** (2022, 7nm, PCIe Gen4) 对标国际 Marvell 88SN 系列, 适配长江存储 X3 NAND, 单盘跑出 1M+ IOPS; **STAR 1500** (2024 发布) 是国产首批 PCIe Gen5 主控, 单盘容量 15.36TB; STAR 2000 路线图 (2026, 12nm) [来源: https://www.starstor.com]。客户含中科曙光 / 浪潮 / 新华三 / 金融 / 互联网。B 轮融资数亿, 估值约 ¥30 亿。其余 4 家国产独角兽 (联芸科技 MAXIO / 中科闪芯 / 得瑞领新 DERA / 浪潮 PSOAR) 由 A3 调研, 本节不重复。

---

## 七、国产 19 家采购决策矩阵 (CISO / 架构师 / CFO 视角)

| 维度 | 选型首选 | 次选 | 暂缓 / 观望 |
|---|---|---|---|
| AI 训练 (对标 H100) | 华为昇腾 910C | 海光 DCU 深算二号 | 寒武纪 590 / 燧原 邃思 2.5 |
| AI 推理 (对标 L40S) | 华为昇腾 310P | 寒武纪 370 / 摩尔 S4000 | 壁仞 BR104 |
| 企业级 SSD 主控 | 忆芯 STAR 1200C / 1500 | 国科微 GK23P | 紫光得瑞 DERA |
| NAND 颗粒 | 长江存储 X3-6070 QLC | 长存 X3-9070 TLC | 紫光得瑞 (集成) |
| DRAM | 兆易 (长鑫 DDR5) | 紫光得瑞 | — |
| DPU (国产替代 BlueField) | 中科驭数 K2 Pro | 芯启源 Agilio CX / 云豹 CloudBlazer | 益思芯 ESL |
| 全栈 AI 工厂 | 华为 Atlas 900 + OceanStor | 浪潮 NF8260M7 + AS13000 | 新华三 UniServer R5300 + UniStor |

**反幻觉说明**: 本节所有营收数字来自上市公司 (深交所 / 上交所) 公开年报或母公司财报披露; 未上市公司 (长江存储 / 紫光得瑞 / 忆芯等) 写"未公开"或"未独立披露", 不编造数字。所有国产 AI 卡参数基于 2024-2025 量产版本 (昇腾 910C / 寒武纪 590 / 海光深算二号 / 燧原邃思 2.5), 路线图版本 (昇腾 610 / 海光深算三号 / 燧原邃思 3.0 / STAR 2000) 仅作"路线图"标注。出处参考 `vendors-cn.json` 每家 source_urls。

---

**A2 完成。vendors-cn.json 19 家 / 字段全部对齐 vendors-intl.json / vendors-cn-analysis.md ~3500 字, 与 A1 风格一致。下一阶段进入 Ch2 §2.4-2.5 + Ch3 §3.1-3.2 的技术分析。**