import re, os, json, sys
from datetime import datetime

BASE = 'C:/Users/Administrator/.openclaw/workspace/hacms/content/articles'
sys.stdout.reconfigure(encoding='utf-8')

# 手动指定已知文章（优先级最高）
MANUAL = {
    '2026-05-aicms-intro':            {'category': 'AI基础设施', 'tags': ['CMS', '去中心化', 'AAM', 'AI基础设施'],                             'date': '2026-05-15'},
    '2026-05-ransomware-defense':     {'category': '安全',       'tags': ['勒索软件', '数据保护', '安全', '2025-2026'],                      'date': '2026-05-18'},
    '2026-05-ransomware-false-positive': {'category': '安全',    'tags': ['误报', '安全运营', 'SOC', 'EDR'],                                  'date': '2026-05-18'},
    '2026-05-dlp-storage-vendors':     {'category': '安全',       'tags': ['DLP', '存储安全', '数据防泄漏', '厂商分析'],                      'date': '2026-05-19'},
    '2026-05-ueba-dlp':                {'category': '安全',       'tags': ['UEBA', 'DLP', '行为分析', '数据安全'],                           'date': '2026-05-20'},
    '2026-05-harness-agent-demo':      {'category': 'AI应用',     'tags': ['Harness', 'Agent', 'AI架构', 'Demo'],                           'date': '2026-05-21'},
    '2026-05-ai-trends-q2':            {'category': '安全',       'tags': ['AI趋势', '产业分析', '2026Q2', '研究报告'],                      'date': '2026-05-22'},
    '2026-05-multiagent-scientific-data': {'category': '安全',  'tags': ['多Agent', '科研数据', '数据治理', 'AI系统'],                      'date': '2026-05-23'},
}

# 自动从HTML提取日期的正则模式（按优先级尝试）
DATE_PATTERNS = [
    # 格式: yyyy-mm-dd（HTML里常见的日期格式）
    re.compile(r'(\d{4}-\d{2}-\d{2})'),
    re.compile(r'(\d{4}/\d{2}/\d{2})'),
    re.compile(r'(\d{4}\.\d{2}\.\d{2})'),
]

def extract_date_from_html(html_bytes):
    """从HTML内容中提取日期，优先用文件路径中的目录名"""
    text = html_bytes.decode('utf-8', errors='replace')

    # 先用正则搜常见日期格式
    for pat in DATE_PATTERNS:
        m = pat.search(text)
        if m:
            d = m.group(1).replace('/', '-').replace('.', '-')
            # 简单的合法性校验
            try:
                datetime.strptime(d, '%Y-%m-%d')
                return d
            except ValueError:
                pass

    return None

articles = []
for name in sorted(os.listdir(BASE)):
    idx = os.path.join(BASE, name, 'index.html')
    if not os.path.isfile(idx):
        continue

    html_bytes = open(idx, 'rb').read()

    # 标题
    m = re.search(b'<title>(.*?)</title>', html_bytes)
    title = m.group(1).decode('utf-8', errors='replace').strip() if m else name
    title = re.sub(r'\s+', ' ', title)

    # 摘要：取第一个 <p>...</p> 的纯文本
    m = re.search(b'<p[^>]*>(.*?)</p>', html_bytes, re.DOTALL)
    summary = ''
    if m:
        summary = re.sub(r'<[^>]+>', '', m.group(1).decode('utf-8', errors='replace'))
        summary = re.sub(r'\s+', ' ', summary).strip()[:200]

    # 优先用手动配置，其次从HTML自动提取，最后用文件夹名
    manual = MANUAL.get(name, {})
    auto_date = extract_date_from_html(html_bytes)

    date = manual.get('date') or auto_date or '2026-05-01'

    # category / tags
    category = manual.get('category') or '未知'
    tags = manual.get('tags') or []

    html_path = f'content/articles/{name}/index.html'

    articles.append({
        'id': name,
        'title': title,
        'category': category,
        'tags': tags,
        'date': date,
        'author': '川龙',
        'summary': summary,
        'html_path': html_path,
    })

articles.sort(key=lambda x: x['date'], reverse=True)

print('Rebuilt', len(articles), 'articles')
for a in articles:
    print(f'  {a["date"]} | {a["category"]} | {a["id"]}')

out = open('C:/Users/Administrator/.openclaw/workspace/hacms/content/index/manifest.json', 'w', encoding='utf-8', newline='\n')
json.dump(articles, out, ensure_ascii=False, indent=2)
out.close()
print('Written manifest.json')