# AI-Agent Managed Static CMS (AAM-CMS) v2.0

一个专门为 AI Agent（智能体）内容生命周期管理而设计的、**完全去后端**的开源静态知识库/CMS系统。支持多格式资产聚合、智能自动分类以及标签筛选。

## ─── 智能体执行前必读 (AGENT CRITICAL INSTRUCTION) ───

> **请注意 (ATTENTION AGENT):** 在处理任何用户请求、添加/删除文件或修改仓库前，你**必须**先阅读 `.harness/harness.json`。
> 1. **资产聚合：** 相同主题的 HTML、Word、PPT 等文件必须放在同名目录下。
> 2. **增量合并：** 禁止在 `manifest.json` 中为同主题的不同格式建立多条记录，必须合并为带有 `attachments` 的单一文章模型。
> 3. **智能分类：** 若用户未指定 `category`，请阅读内容并根据行为宪法自动分类，同时提取 2-4 个精准标签。

## 项目特性

- **一文多资产聚合:** 优先在网页端用 `<iframe>` 框架全屏渲染直观的 HTML 报告，同时将对应的 Word、PPT、PDF 转换为工具栏附件提供一键下载。
- **真正的零后端 (Zero-Backend):** 纯静态，无数据库，天然具备极高的安全性和极佳的并发性能。可完美托管于 Nginx、GitHub Pages、Vercel。
- **双层分类过滤系统:** 整合了"父级目录（Category）"与"横向标签（Tags）"的双重筛选逻辑，配合前端模糊搜索，秒级检索海量调研报告。
- **去中心化管理:** 所有文章通过 Agent 统一维护目录结构、manifest.json 和分类标签，无需人工干预。
- **开源协议:** 本项目基于 Apache 2.0 协议开源。欢迎持续修改与提交贡献。

## 目录结构

```
├── .harness/
│   └── harness.json          # 智能体的行为宪法（定义分类标准、资产命名规范）
├── content/
│   ├─ index/
│   │   └── manifest.json     # 全局动态索引（由 Agent 维护的聚合文章模型）
│   ├─ articles/
│   │   └─ [topic-slug]/      # 每个文章一个目录，多格式资产聚合存放
│   │       ├─ index.html     # 【核心】主体报告（优先展示）
│   │       ├─ main.docx       # 【附件】Word版
│   │       └─ slides.pptx     # 【附件】PPT版
│   └── assets/               # 公共静态资源
├── index.html                # 前端主外壳（SPA 框架）
├── app.js                    # 前端核心路由、模糊搜索与附件渲染逻辑
├── style.css                 # 极简主义、高质感生产力工具风格样式表
└── README.md                 # 项目开源说明文档
```

## 使用指南 (面向人类用户)

### 1. 本地预览

```bash
# Python 3
python3 -m http.server 8080

# 或 Node.js
npx serve .
```

访问 `http://localhost:8080` 即可预览。

### 2. 命令你的 Agent 投放/更新报告（提示词模板）

> "请先读取 `.harness/harness.json`。我给你一个新课题的三个文件：一个调研报告 `index.html`，一个 `report.docx` 和一个汇报 `slides.pptx`。请在 `content/articles/` 下创建合适目录放进去。如果我没指定分类，请帮我自动分类并打上标签。最后更新 `content/index/manifest.json`。请记住，将它们聚合成同一个文章条目，把 docx 和 pptx 写入 attachments 字段，确保前端可以作为附件下载。"

### 3. 添加新文章流程

1. 在 `content/articles/` 下创建文章目录（如 `2026-06-my-topic/`）
2. 将 `index.html`（主体）和附件（docx/pptx/pdf）放入该目录
3. 编辑 `content/index/manifest.json`，加入新的 article 条目
4. 更新完成，前端自动渲染

## 前端功能说明

- **主页视图（List State）：** 展示所有文章卡片，支持分类筛选、标签筛选和实时模糊搜索
- **文章阅读框架（Reader Frame State）：** 点击卡片后进入全屏 iframe 框架，左上角 [◀ 返回] 按钮，右上角动态附件下载按钮
- **Hash 路由：** 支持直接链接访问文章（如 `#article/2026-05-ai-storage`）
- **键盘快捷键：** `Escape` 关闭 Reader；`Ctrl/Cmd + K` 聚焦搜索框

## 开源协议

本项目采用 [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0) 协议授权。