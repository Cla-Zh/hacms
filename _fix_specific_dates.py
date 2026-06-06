"""
Fix specific incorrect dates in _rebuild_manifest3.py.
"""
import re, sys
sys.stdout.reconfigure(encoding='utf-8')

REBUILD = 'C:/Users/Administrator/.openclaw/workspace/hacms/_rebuild_manifest3.py'

with open(REBUILD, 'r', encoding='utf-8') as f:
    content = f.read()

# Fixes: (old_val, new_val)
fixes = [
    ("'2026-06-ai-storage-security-survey': {'date': '2026-06-01'}", 
     "'2026-06-ai-storage-security-survey': {'date': '2026-06-06'}"),
    ("'2026-06-ai-memory-panorama-research': {'date': '2026-05-01'}",
     "'2026-06-ai-memory-panorama-research': {'date': '2025-10-28'}"),
]

for old, new in fixes:
    if old in content:
        content = content.replace(old, new)
        print(f'FIXED: {old[:50]}...')
    else:
        print(f'NOT FOUND: {old[:50]}...')

with open(REBUILD, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done.')