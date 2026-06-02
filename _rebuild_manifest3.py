import re, os, json, sys

BASE = 'C:/Users/Administrator/.openclaw/workspace/hacms/content/articles'
sys.stdout.reconfigure(encoding='utf-8')

CATEGORIES = {
    '2026-05-aicms-intro': 'AI基础设施',
    '2026-05-ransomware-defense': '安全',
    '2026-05-ransomware-false-positive': '安全',
    '2026-05-dlp-storage-vendors': '安全',
    '2026-05-ueba-dlp': '安全',
    '2026-05-harness-agent-demo': 'AI应用',
    '2026-05-ai-trends-q2': '安全',
    '2026-05-multiagent-scientific-data': '安全',
}

TAGS = {
    '2026-05-aicms-intro': ['CMS', '去中心化', 'AAM', 'AI基础设施'],
    '2026-05-ransomware-defense': ['勒索软件', '数据保护', '安全', '2025-2026'],
    '2026-05-ransomware-false-positive': ['误报', '安全运营', 'SOC', 'EDR'],
    '2026-05-dlp-storage-vendors': ['DLP', '存储安全', '数据防泄漏', '厂商分析'],
    '2026-05-ueba-dlp': ['UEBA', 'DLP', '行为分析', '数据安全'],
    '2026-05-harness-agent-demo': ['Harness', 'Agent', 'AI架构', 'Demo'],
    '2026-05-ai-trends-q2': ['AI趋势', '产业分析', '2026Q2', '研究报告'],
    '2026-05-multiagent-scientific-data': ['多Agent', '科研数据', '数据治理', 'AI系统'],
}

DATES = {
    '2026-05-aicms-intro': '2026-05-15',
    '2026-05-ransomware-defense': '2026-05-18',
    '2026-05-ransomware-false-positive': '2026-05-18',
    '2026-05-dlp-storage-vendors': '2026-05-19',
    '2026-05-ueba-dlp': '2026-05-20',
    '2026-05-harness-agent-demo': '2026-05-21',
    '2026-05-ai-trends-q2': '2026-05-22',
    '2026-05-multiagent-scientific-data': '2026-05-23',
}

articles = []
for name in sorted(os.listdir(BASE)):
    idx = os.path.join(BASE, name, 'index.html')
    if not os.path.isfile(idx):
        continue

    html_bytes = open(idx, 'rb').read()

    # Extract title
    m = re.search(b'<title>(.*?)</title>', html_bytes)
    title = m.group(1).decode('utf-8', errors='replace').strip() if m else name
    title = re.sub(r'\s+', ' ', title)

    # Extract first paragraph as summary
    m = re.search(b'<p[^>]*>(.*?)</p>', html_bytes, re.DOTALL)
    summary = ''
    if m:
        summary = re.sub(r'<[^>]+>', '', m.group(1).decode('utf-8', errors='replace'))
        summary = re.sub(r'\s+', ' ', summary).strip()[:200]

    # html_path: 相对于 content/articles/ 的路径
    html_path = f'content/articles/{name}/index.html'

    articles.append({
        'id': name,
        'title': title,
        'category': CATEGORIES.get(name, '未知'),
        'tags': TAGS.get(name, []),
        'date': DATES.get(name, '2026-05-01'),
        'author': '川龙',
        'summary': summary,
        'html_path': html_path,
    })

articles.sort(key=lambda x: x['date'], reverse=True)

print('Rebuilt', len(articles), 'articles')
for a in articles:
    print(f'  {a["id"]} | {a["category"]} | {a["html_path"]}')

out = open('C:/Users/Administrator/.openclaw/workspace/hacms/content/index/manifest.json', 'w', encoding='utf-8', newline='\n')
json.dump(articles, out, ensure_ascii=False, indent=2)
out.close()
print('Written manifest.json')