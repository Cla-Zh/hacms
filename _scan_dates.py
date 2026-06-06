import os, re, json, sys
from datetime import datetime

BASE = 'C:/Users/Administrator/.openclaw/workspace/hacms/content/articles'
sys.stdout.reconfigure(encoding='utf-8')

MON_MAP = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4,
    'May': 5, 'June': 6, 'July': 7, 'August': 8,
    'September': 9, 'October': 10, 'November': 11, 'December': 12
}

results = []
for name in sorted(os.listdir(BASE)):
    idx = os.path.join(BASE, name, 'index.html')
    if not os.path.isfile(idx):
        continue
    html = open(idx, 'rb').read().decode('utf-8', errors='replace')

    title_m = re.search(b'<title>(.*?)</title>', html.encode())
    title = title_m.group(1).decode('utf-8', errors='replace').strip()[:60] if title_m else name

    date_str = None

    # Pattern 1: ISO yyyy-mm-dd
    m = re.search(r'(\d{4}-\d{2}-\d{2})', html)
    if m:
        date_str = m.group(1)

    # Pattern 2: Month Year or Month YYYY
    if not date_str:
        m = re.search(r'(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})', html)
        if m:
            d = datetime(int(m.group(2)), MON_MAP[m.group(1)], 1)
            date_str = d.strftime('%Y-%m-%d')

    # Pattern 3: yyyy年mm月 or yyyy/mm/dd in Chinese text
    if not date_str:
        m = re.search(r'(\d{4})年(\d{1,2})月', html)
        if m:
            date_str = f'{int(m.group(1))}-{int(m.group(2)):02d}-01'

    results.append((name, date_str, title))

for name, date_str, title in results:
    status = date_str if date_str else 'NONE'
    print(f'{date_str or "NONE"} | {name} | {title[:50]}')