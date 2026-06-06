import os, re

BASE = 'C:/Users/Administrator/.openclaw/workspace/hacms/content/articles'
for name in sorted(os.listdir(BASE)):
    idx = os.path.join(BASE, name, 'index.html')
    if not os.path.isfile(idx):
        continue
    html = open(idx, 'rb').read().decode('utf-8', errors='replace')
    if '2026-05-kv-cache' in name:
        print(f'=== {name} ===')
        # Find date mentions
        dates = re.findall(r'(\d{4}[-/年]\d{1,2}[-/月]\d{0,2})', html)
        print('DATE PATTERNS:', dates[:10])
        # Also find month-year
        m = re.search(r'(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})', html)
        print('MONTH YEAR:', m.groups() if m else 'none')
        # show first 500 chars
        print(html[:500])
        print('---')
        break