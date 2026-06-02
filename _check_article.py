import re

html = open('content/articles/2026-05-aicms-intro/index.html', 'rb').read()

# Check meta tags
for line in html.split(b'\n'):
    if b'name="' in line and (b'category' in line or b'tags' in line or b'date' in line):
        print(repr(line[:200]))