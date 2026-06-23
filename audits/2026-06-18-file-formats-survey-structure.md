# 结构分析: 2026-06-18-file-formats-survey

## 基本信息
- **文件**: /mnt/g/hacms/content/articles/2026-06-18-file-formats-survey/index.html
- **大小**: 45,891 字节 (~44 KB)
- **行数**: 521
- **文章类型**: 调研报告 (文件类型大全)
- **自我声明**: 1,477 个唯一文件类型 / 1,553 条记录 / Wikipedia 86.7% 引用

## 章节结构
7 个章节:
1. **overview**: 调研概况 (字段格式说明)
2. **stats**: 核心数据 (6 个 stat-card 数字)
3. **sources**: 数据源分布 Top 20 域名
4. **download**: 下载数据 (4 个 CSV 文件 + README + check_report)
5. **categories**: 13 大类详解 (5.1-5.13)
   - images / docs / audio / video / archive / exec / fonts / 3d / data / system / dev / network / misc
6. **check**: 出处验证报告 (静态 URL 验证)
7. **limitations**: 局限与展望

## 数据点统计
- **外部 URL 数**: **0** ⚠️ — 与其他文章一致, 无 `<a href="https://...">` 标签
- **站内链接数 (href="/...")**: 8 (含 6 个 CSV 下载链接 + README + check_report)
- **表格数**: 3 个 (Top 20 域名表 + 下载文件表 + 网络测试结果表)
- **文件扩展名总数**: 1,477 (声明) — 全部以 `<code>` 内联呈现, 未在主 HTML 表格中
- **下载数据文件**: 4 个 CSV (主文件 148KB) + README + check_report

## 风险点识别 (审计优先级)

### 🟡 P1 中风险 (与本批其他文章不同)
1. **1,553 条 URL "静态验证"声明** (line 461-491):
   - "Wikipedia 全域名 + Google 被屏蔽" → 仅做格式/模式验证, **未实际 HTTP 访问**
   - "100% 格式有效 + 86.7% Wikipedia" — **这不是事实验证, 仅是格式验证**
   - 100 条抽样的网络测试不可执行 (Wikipedia timeout)
   - **风险**: 1,553 条 URL 中可能有大量 404 / 重定向 / 内容无关 — 但作者声明诚实
2. **file extensions 准确性** (line 253-459): 1,477 个扩展名, 大部分为公认标准但需抽样验证
   - 包含小众/老格式 (MAGSTAR, 9-track, Acorn DFS 等 line 498 承认)
   - 部分扩展名多用途 (`.stl` 既是 3D 打印也是 EBU 字幕) 未严格区分

### 🟢 P2 低风险
3. **Top 20 数据源域名表** (line 200-224): Wikipedia/github/Microsoft Learn/FileInfo 等公认来源
4. **网络测试结果表** (line 478-486): 沙箱环境真实测试结果, 可重现
5. **扩展名具体清单** (line 253-459): 总体上是公开知识, 但抽样核查仍有价值

## 引用方式问题 ⚠️ (本文章特点)
- **本文章本身没有传统"引用"** — 1,553 条 URL 是数据字段 (存储在 CSV), 而非内联引用
- HTML 文档本身只描述数据, 不展示 URL
- URL 验证完全依赖外部 CSV 文件 (`formats_all.csv` 等)
- **审计需要直接检查 CSV 文件内容**, 而非 HTML 文本

**审计 Agent B 必须独立验证**:
- 检查 `/content/articles/2026-06-18-file-formats-survey/data/formats_all.csv` 是否真实存在
- 抽样验证 CSV 中的 URL (特别是 Wikipedia URL): 文件格式说明是否与 Wikipedia 页面一致
- Top 20 域名计数是否准确 (Wikipedia 1,347 / GitHub 15 / Microsoft Learn 11 等)
- 抽样验证扩展名分类 (例如: `.stl` 是否真为 3D 打印 + EBU 字幕)
- 验证 "100% URL 格式有效" 是否真实 (检查格式异常)
- 验证 "0 URL 拼写错误" 是否真实

## 与同批其他文章的差异
- **最低风险**: 这是事实型/列表型内容, 非叙事/论证型
- 数据点极多 (1,477 个) 但都是公认可查的事实
- **最大风险**: 1,553 条 URL 的真实性 (Wikipedia / Microsoft Learn / GitHub)
- 没有"性能指标"或"产品声明"风险

## 建议: 优先检查子部分
1. **CSV 文件是否存在且内容完整** (data/formats_all.csv + 3 个分类 CSV + README + check_report)
2. **抽样 50-100 条 Wikipedia URL 实际访问** (验证文章真实度)
3. **Top 20 域名计数核对** (line 200-224): Wikipedia 1,347 实际计数
4. **多用途扩展名是否标注** (`.stl`, `.img`, `.iso` 等)
5. **局限声明是否完整** (line 496-502)
