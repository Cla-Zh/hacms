import re, os

article_dir = 'C:/Users/Administrator/.openclaw/workspace/hacms/content/articles'

for name in sorted(os.listdir(article_dir)):
    idx = os.path.join(article_dir, name, 'index.html')
    if not os.path.isfile(idx):
        continue
    html = open(idx, 'rb').read()
    
    cat_m = re.search(b'<meta\\s+name="category"\\s+content="([^"]+)"', html)
    tag_m = re.search(b'<meta\\s+name="tags"\\s+content="([^"]+)"', html)
    date_m = re.search(b'<meta\\s+name="date"\\s+content="([^"]+)"', html)
    
    cat = cat_m.group(1).decode('utf-8', errors='replace') if cat_m else b'NOT FOUND'
    tags = tag_m.group(1).decode('utf-8', errors='replace') if tag_m else b'NOT FOUND'
    date = date_m.group(1).decode('utf-8', errors='replace') if date_m else b'NOT FOUND'
    
    print(f'{name}:')
    print(f'  category={cat}')
    print(f'  tags={tags}')
    print(f'  date={date}')