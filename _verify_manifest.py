import json
with open('C:/Users/Administrator/.openclaw/workspace/hacms/content/index/manifest.json', 'r', encoding='utf-8') as f:
    articles = json.load(f)
for a in articles:
    print(f'{a["date"]} | {a["category"]} | {a["id"]}')