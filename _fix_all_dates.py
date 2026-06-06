"""
Fix all article dates by updating MANUAL dict in _rebuild_manifest3.py
with correct dates extracted from HTML content.
"""
import os, re, sys
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8')

BASE = 'C:/Users/Administrator/.openclaw/workspace/hacms/content/articles'
REBUILD = 'C:/Users/Administrator/.openclaw/workspace/hacms/_rebuild_manifest3.py'

MON_MAP = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4,
    'May': 5, 'June': 6, 'July': 7, 'August': 8,
    'September': 9, 'October': 10, 'November': 11, 'December': 12
}

def extract_date(html):
    m = re.search(r'(\d{4}-\d{2}-\d{2})', html)
    if m:
        try:
            datetime.strptime(m.group(1), '%Y-%m-%d')
            return m.group(1)
        except ValueError:
            pass
    m = re.search(r'(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})', html)
    if m:
        d = datetime(int(m.group(2)), MON_MAP[m.group(1)], 1)
        return d.strftime('%Y-%m-%d')
    m = re.search(r'(\d{4})年(\d{1,2})月', html)
    if m:
        return f'{int(m.group(1))}-{int(m.group(2)):02d}-01'
    return None

# Collect all articles and their dates
article_dates = {}
for name in sorted(os.listdir(BASE)):
    idx = os.path.join(BASE, name, 'index.html')
    if not os.path.isfile(idx):
        continue
    html = open(idx, 'rb').read().decode('utf-8', errors='replace')
    date = extract_date(html)
    article_dates[name] = date
    print(f'  {date} | {name}')

# Read _rebuild_manifest3.py
with open(REBUILD, 'r', encoding='utf-8') as f:
    content = f.read()

# Find where MANUAL dict starts and ends
start_match = re.search(r"(^MANUAL\s*=\s*\{)", content, re.MULTILINE)
end_pattern = re.compile(r"^\}$", re.MULTILINE)

if not start_match:
    print('ERROR: MANUAL dict not found')
    sys.exit(1)

start_idx = start_match.start()

# Find the closing brace of the dict
# Walk from start to find the first } at the top level
brace_count = 0
in_dict = False
end_idx = start_idx
for i in range(start_idx, len(content)):
    c = content[i]
    if c == '{':
        brace_count += 1
        in_dict = True
    elif c == '}':
        brace_count -= 1
        if in_dict and brace_count == 0:
            end_idx = i
            break

# Build new MANUAL dict entries
new_entries = []
for name in sorted(article_dates.keys()):
    date = article_dates[name] or '2026-05-01'
    new_entries.append(f"    {repr(name)}: {{'date': {repr(date)}}},")

new_dict_text = "MANUAL = {\n" + "\n".join(new_entries) + "\n}"

# Replace old dict with new
new_content = content[:start_idx] + new_dict_text + content[end_idx+1:]

with open(REBUILD, 'w', encoding='utf-8') as f:
    f.write(new_content)

print('\nUpdated MANUAL dict in _rebuild_manifest3.py')
print(f'Entries: {len(new_entries)}')