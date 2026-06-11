#!/usr/bin/env python3
"""
HACMS manifest 重建脚本 v6
策略：
1. 目录名前10字符必须为有效 YYYY-MM-DD（强制校验）
2. 不符合的目录 → 报错，不降级
3. 新建文章必须遵循 YYYY-MM-DD-xxx 命名规范
彻底消除日期问题。
"""
import re, os, json, sys
from datetime import datetime

BASE = 'C:/Users/Administrator/.openclaw/workspace/hacms/content/articles'
OUT  = 'C:/Users/Administrator/.openclaw/workspace/hacms/content/index/manifest.json'
sys.stdout.reconfigure(encoding='utf-8')

# ── 从目录名前10字符提取 YYYY-MM-DD（严格校验） ──────────────────
def extract_date_from_dir(name):
    d = name[:10]
    try:
        datetime.strptime(d, '%Y-%m-%d')
        return d
    except ValueError:
        return None  # 不降级，要求命名规范

# 从 HTML 提取第一个 <p> 纯文本作为摘要
P_TAG = re.compile(b'<p[^>]*>(.*?)</p>', re.DOTALL)
def extract_summary(html_bytes):
    m = P_TAG.search(html_bytes)
    if not m:
        return ''
    s = re.sub(r'<[^>]+>', '', m.group(1).decode('utf-8', errors='replace'))
    return re.sub(r'\s+', ' ', s).strip()[:200]

# 从 title 标签提取标题
TITLE_RE = re.compile(b'<title>(.*?)</title>')
def extract_title(html_bytes, fallback):
    m = TITLE_RE.search(html_bytes)
    if not m:
        return fallback
    t = m.group(1).decode('utf-8', errors='replace').strip()
    return re.sub(r'\s+', ' ', t)

# 从 HTML 提取 keywords meta 标签
META_KW = re.compile(b'<meta[^>]+name=["\']keywords["\'][^>]+content=["\']([^"\']+)["\']', re.I)
def extract_tags(html_bytes):
    m = META_KW.search(html_bytes)
    if m:
        return [t.strip() for t in m.group(1).decode('utf-8', errors='replace').split(',') if t.strip()]
    return []

# ── 分类推断 ──────────────────────────────────────────────────────
def guess_category(title, tags):
    text = ' '.join(tags) + ' ' + title
    if any(k in text for k in ['安全', '勒索', 'DLP', '泄露', '攻击', '威胁', '防护', '病毒', ' malware']):
        return '安全'
    if any(k in text for k in ['AI', 'LLM', 'Agent', '记忆', '推理', '训练', '算力', 'GPU', '存储', 'KV Cache']):
        return 'AI基础设施'
    if any(k in text for k in ['趋势', '洞察', '调研', '研究', '分析', '产业', '全景', '报告']):
        return '洞察'
    if any(k in text for k in ['应用', 'Demo', '平台', '系统', '方案']):
        return 'AI应用'
    return '其他'

errors = []
articles = []
for name in sorted(os.listdir(BASE)):
    idx = os.path.join(BASE, name, 'index.html')
    if not os.path.isfile(idx):
        continue

    # ── 日期（严格：必须从目录名提取） ─────────────────────
    date = extract_date_from_dir(name)
    if not date:
        errors.append(name)
        continue  # 跳过，不生成错误 manifest

    html_bytes = open(idx, 'rb').read()
    title   = extract_title(html_bytes, name)
    summary = extract_summary(html_bytes)
    tags    = extract_tags(html_bytes)
    category = guess_category(title, tags)

    articles.append({
        'id':        name,
        'title':     title,
        'category':  category,
        'tags':      tags,
        'date':      date,
        'author':    '川龙',
        'summary':   summary,
        'html_path': f'content/articles/{name}/index.html',
    })

# 按日期倒序
articles.sort(key=lambda x: x['date'], reverse=True)

print(f'Rebuilt {len(articles)} articles')
for a in articles:
    print(f'  {a["date"]} | {a["category"]} | {a["id"]}')

if errors:
    print(f'\n[ERROR] 以下目录不符合 YYYY-MM-DD-xxx 命名规范，无法构建 manifest:')
    for e in errors:
        print(f'  - {e}')
    print('\n请将目录重命名为正确格式后再运行脚本。')
    sys.exit(1)

out = open(OUT, 'w', encoding='utf-8', newline='\n')
json.dump(articles, out, ensure_ascii=False, indent=2)
out.close()
print(f'\nWritten {OUT}')