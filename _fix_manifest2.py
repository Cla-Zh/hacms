import json, sys, os

MANIFEST = 'C:/Users/Administrator/.openclaw/workspace/hacms/content/index/manifest.json'
out_path = MANIFEST

# Read current file
f = open(MANIFEST, 'r', encoding='utf-8')
content = f.read()
f.close()

# Replace CRLF with LF only
content = content.replace('\r\n', '\n').replace('\r', '\n')

# Write back as pure UTF-8 (no BOM)
f = open(out_path, 'w', encoding='utf-8', newline='')
f.write(content)
f.close()

# Verify by reading bytes
f2 = open(out_path, 'rb')
raw = f2.read()
f2.close()

sys.stdout.reconfigure(encoding='utf-8')
print('Written. File size:', len(raw))
print('Has BOM:', raw[:3] == b'\xef\xbb\xbf')
print('Has CR:', b'\r' in raw)
print('Has LF:', b'\n' in raw)

# Verify JSON
try:
    data = json.loads(raw)
    print('JSON OK, count:', len(data))
    print('Title:', data[0]['title'])
except Exception as e:
    print('JSON ERROR:', e)