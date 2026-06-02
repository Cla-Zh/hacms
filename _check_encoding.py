import json

# Read the manifest.json as bytes
f = open('content/index/manifest.json', 'rb')
raw = f.read()
f.close()

# Try to detect encoding issue
# The file shows garbled Chinese chars, which could be:
# 1. GBK bytes stored as UTF-8 (most likely)
# 2. UTF-16 confusion

# Let's try re-reading as GBK
try:
    text_gbk = raw.decode('gbk', errors='strict')
    print('GBK decode succeeded (strict mode)')
    data = json.loads(text_gbk)
    print('JSON from GBK parsed OK, count:', len(data))
except Exception as e:
    print('GBK strict failed:', e)
    # Try with replacement
    text_gbk = raw.decode('gbk', errors='replace')
    try:
        data = json.loads(text_gbk)
        print('GBK replace OK, count:', len(data))
        print('Title[0]:', data[0]['title'])
    except Exception as e2:
        print('GBK replace also failed:', e2)

# Let's also check if raw bytes look like GBK
print()
print('Checking first title bytes...')
# Find "AAM-CMS" in the raw bytes and get the Chinese bytes after it
# UTF-8 Chinese: 3 bytes per char, e.g. '\xe9\x8d\x98' for 去
# GBK Chinese: 2 bytes per char, e.g. '\xc8\xd5' for 去
idx = raw.find(b'AAM-CMS ')
if idx >= 0:
    after = raw[idx+8:idx+50]
    print('Bytes after AAM-CMS:', after[:30].hex())
    print('Length of after:', len(after))