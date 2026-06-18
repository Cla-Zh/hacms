# 防勒索模型训练数据集 (基于 1,553 个文件类型)

**基于** [6/18 文件类型大全调研报告](../2026-06-18-file-formats-survey/) 的 1,553 个文件扩展名，转换为 4 种 JSONL 训练格式。

## 数据规模

| 文件 | 行数 | 用途 | 训练方式 |
|---|---|---|---|
| `data/classification.jsonl` | 1,553 | 12 大类分类 (图片/文档/音视频/...) | 序列分类 + 生成式分类 |
| `data/extension_qa.jsonl` | 12,424 | 文件类型问答 (8 模板 × 1,553 扩展名) | 指令微调 SFT |
| `data/ransomware_detection.jsonl` | 1,553 | 防勒索风险评分 (0-1) + verdict + 缓解建议 | 指令微调 SFT |
| `data/training_combined.jsonl` | **13,977** | 合并所有任务 | **主训练文件** |

## 任务详情

### 1. classification (分类)
```json
{
  "extension": ".exe",
  "purpose": "Windows 可执行文件 (PE 格式)",
  "variants": "exe, dll, com, scr, cpl, ocx, ax, sys, drv, efi",
  "category": "executable"
}
```
12 个类别: image / document / media / archive / executable / font / 3d_game / database / system / science / network / development

### 2. extension_qa (问答)
8 种问题模板 × 1,553 扩展名 = 12,424 条训练样本

例:
```json
{
  "instruction": ".exe 是什么文件类型?",
  "input": "",
  "output": ".exe 用于 Windows 可执行文件 (PE 格式)。变种: exe, dll, com, scr, cpl, ocx, ax, sys, drv, efi。"
}
```

### 3. ransomware_detection (防勒索检测)
基于扩展名评估勒索软件风险等级 (0.0-1.0):

| 风险等级 | 分数 | 解释 |
|---|---|---|
| HIGH_RISK_EXECUTABLE | 0.95 | .exe .dll .scr .bat .vbs .ps1 .jar 等 |
| HIGH_RISK_CRYPTO | 0.75 | .zip .rar .7z .gpg .enc .dmg .iso .tc .luks |
| MEDIUM_RISK_DATA | 0.55 | .db .pst .edb .mbox .reg .key .pem |
| LOW_RISK_DOCUMENT | 0.25 | .txt .md .log .bak |
| VERY_LOW_RISK | 0.10 | 图片/视频/字体 |

```json
{
  "instruction": "请评估文件扩展名 .exe 在勒索软件攻击中的风险等级。",
  "output": "{\"extension\":\".exe\",\"risk_score\":0.95,\"verdict\":\"HIGH_RISK_EXECUTABLE\",\"category\":\"executable\",\"reason\":\"扩展名 .exe 是典型可执行/脚本类型, 勒索软件常用此类型投递或驻留。\",\"mitigation\":\"启用 EDR/EDP 行为监控; 限制此类型文件的网络下载与执行; 使用应用白名单; 对此类型文件启用完整性校验 (HMAC) 与 WORM 备份。\"}"
}
```

## 风险分布

| 风险等级 | 数量 | 占比 |
|---|---|---|
| 0.1 (极低) | 406 | 26.1% |
| 0.2 (低) | 73 | 4.7% |
| 0.3 (普通) | 755 | 48.6% |
| 0.4 (较低) | 93 | 6.0% |
| 0.5 (中) | 19 | 1.2% |
| 0.6 (中) | 56 | 3.6% |
| 0.7 (中高) | 27 | 1.7% |
| 0.8 (高) | 100 | 6.4% |
| 0.9 (极高) | 24 | 1.5% |

**总: 1,553** | **平均: 0.32** | **中位: 0.3**

## 类目分布

| 类别 | 数量 |
|---|---|
| system | 341 |
| document | 258 |
| media | 232 |
| archive | 136 |
| image | 132 |
| executable | 110 |
| database | 98 |
| science | 87 |
| 3d_game | 79 |
| network | 31 |
| development | 25 |
| font | 24 |

## 数据来源

所有数据来自 [2026-06-18 文件类型大全调研报告](../2026-06-18-file-formats-survey/) 的 `data/formats_all.csv`，86.7% 来自 Wikipedia 等权威源。
