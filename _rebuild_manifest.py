import os, re, json, sys

BASE = 'C:/Users/Administrator/.openclaw/workspace/hacms/content/articles'
sys.stdout.reconfigure(encoding='utf-8')

articles = []
for name in sorted(os.listdir(BASE)):
    idx = os.path.join(BASE, name, 'index.html')
    if not os.path.isfile(idx):
        continue
    
    html = open(idx, 'r', encoding='utf-8', errors='replace').read()
    
    # Extract title from <title> or <h1>
    m = re.search(r'<title>(.*?)</title>', html)
    if not m:
        m = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.DOTALL)
    title = m.group(1).strip() if m else name
    title = re.sub(r'\s+', ' ', title)
    
    # Extract description
    m = re.search(r'<meta\s+name="description"\s+content="([^"]+)"', html)
    desc = m.group(1) if m else ''
    
    # Extract category
    m = re.search(r'<meta\s+name="category"\s+content="([^"]+)"', html)
    cat = m.group(1) if m else '未知'
    
    # Extract tags
    m = re.search(r'<meta\s+name="tags"\s+content="([^"]+)"', html)
    tags = [t.strip() for t in m.group(1).split(',')] if m else []
    
    # Extract date
    m = re.search(r'<meta\s+name="date"\s+content="([^"]+)"', html)
    date = m.group(1) if m else '2026-05-01'
    
    # Extract author
    m = re.search(r'<meta\s+name="author"\s+content="([^"]+)"', html)
    author = m.group(1) if m else ''
    
    # Summary from first paragraph
    m = re.search(r'<p[^>]*>(.*?)</p>', html, re.DOTALL)
    summary = m.group(1).strip() if m else ''
    summary = re.sub(r'<[^>]+>', '', summary)
    summary = re.sub(r'\s+', ' ', summary)[:200]
    
    articles.append({
        'id': name,
        'title': title,
        'category': cat,
        'tags': tags,
        'date': date,
        'author': author,
        'summary': summary
    })

# Sort by date descending
articles.sort(key=lambda x: x['date'], reverse=True)

print('Found', len(articles), 'articles')
for a in articles:
    print(f'  {a["id"]} | {a["category"]} | {a["title"][:40]}')

out = open('C:/Users/Administrator/.openclaw/workspace/hacms/content/index/manifest.json', 'w', encoding='utf-8', newline='')
json.dump(articles, out, ensure_ascii=False, indent=2)
out.close()
print('Written manifest.json')