import json, sys

MANIFEST = 'C:/Users/Administrator/.openclaw/workspace/hacms/content/index/manifest.json'

# Read manifest as UTF-8 text
f = open(MANIFEST, 'r', encoding='utf-8')
text = f.read()
f.close()

# Normalize CRLF to LF
text = text.replace('\r\n', '\n').replace('\r', '\n')

# Write back as UTF-8 without BOM, LF only
f = open(MANIFEST, 'w', encoding='utf-8')
f.write(text)
f.close()

# Verify
f2 = open(MANIFEST, 'rb')
raw = f2.read()
f2.close()
sys.stdout.reconfigure(encoding='utf-8')
print('File size:', len(raw))
print('Has BOM:', raw[:3] == b'\xef\xbb\xbf')
print('Has CRLF:', b'\r\n' in raw)
data = json.loads(raw)
print('Parse OK, count:', len(data))
print('Title:', data[0]['title'])
print('Category:', data[0]['category'])
print('All good!' if len(data) == 8 else 'PROBLEM')