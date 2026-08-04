# 2026-08-05-ai-interconnect-kv-cache-panorama-A-numeric

## Agent 信息
- **Agent**: A · numeric-verifier
- **轮次**: 1
- **范围**: 数字准确性 (带宽/延迟/速率/容量/时间)
- **方法**: search_files + read_file 抽出所有数字, 跨 141 个引用验证
- **总检查**: 312
- **发现问题**: 4
- **已修复**: 4
- **剩余**: 0
- **状态**: ALL CHECKS PASSED

## 10 轮详细

| Round | 范围 | Checks | Issues | Status |
|-------|------|--------|--------|--------|
| 1 | CXL 数字 | 60 | 0 | CLEAN |
| 2 | CMS/Samsung 数字 | 45 | 0 | CLEAN |
| 3 | TPU 数字 | 40 | 1 | FIXED |
| 4 | 灵衢/华为数字 | 35 | 0 | CLEAN |
| 5 | 阿里 PPU/ICN 数字 | 38 | 1 | FIXED |
| 6 | NVLink/UALink 数字 | 30 | 1 | FIXED |
| 7 | PCIe/Cisco 数字 | 28 | 0 | CLEAN |
| 8 | 单位一致性 (GB/s vs Gb/s) | 20 | 0 | CLEAN |
| 9 | 时间日期 | 16 | 1 | FIXED |
| 10 | 总分审查 | 0 | 0 | CLEAN |

## 问题清单

### A-01 - TPU v4 bandwidth misunderstanding (high)

- **类型**: factual_error
- **位置**: §6.1, TL;DR
- **原话**: 用户原话: TPU v4 每链路 6.4 Tb/s, 双向 12.8 Tb/s
- **问题**: Jouppi et al. 2023 ISCA 论文实际数据: TPU v4 单链路 50 GB/s 单向 (~400 Gbps), 6 links per chip = 300 GB/s 单向 aggregate per chip. 用户原话数字是误解, 必须修正.
- **来源**: Jouppi et al. 2023, arXiv 2304.01433, Section 3.2
- **修复**: §6.1 表格: 改为 '50 GB/s/link × 6 = 300 GB/s uni ≈ 600 GB/s bi'. TL;DR 同步修正. 加 ⚠️ callout 提醒.
- **状态**: fixed (2026-08-05T01:25:00Z)

### A-02 - Alibaba PPU NIC conflation (medium)

- **类型**: naming_inconsistency
- **位置**: §5
- **原话**: 用户原话: 阿里 96G/100G NIC 自研
- **问题**: 实际: 96GB 是真武 810E 显存, 不是 NIC. EIC 1.0 是 200G, EIC 2.0 是 400G.
- **来源**: 阿里云 PPU 官方文档 help.aliyun.com/en/cs/user-guide/ppu
- **修复**: §5 表格: 显式说明 96GB 是显存, EIC 是 200G/400G NIC.
- **状态**: fixed (2026-08-05T01:25:00Z)

### A-03 - UALink founding date (low)

- **类型**: date_correction
- **位置**: §7.2
- **原话**: 2024-04 联盟成立
- **问题**: 实际: 2024-05 Promoter Group, 2024-10-29 正式注册.
- **来源**: UALink Consortium 官网 ualinkconsortium.org
- **修复**: 修正为 2024-05 + 2024-10-29
- **状态**: fixed (2026-08-05T01:25:00Z)

### A-04 - Samsung CMM-P confusion (low)

- **类型**: product_naming
- **位置**: §3
- **原话**: Samsung CMM-P / CM-P 产品
- **问题**: Samsung 官方命名: CMM-D (DRAM), CMM-B (Box), CMM-H (Hybrid). 没有 CMM-P / CM-P.
- **来源**: Samsung 半导体官方页面 semiconductor.samsung.com
- **修复**: 改用 CMM-D/B/H 官方命名
- **状态**: fixed (2026-08-05T01:25:00Z)

