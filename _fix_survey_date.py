import re

with open('hacms/_rebuild_manifest3.py', 'r', encoding='utf-8') as f:
    content = f.read()

# The exact last line of MANUAL dict
old = "'2026-05-multiagent-scientific-data': {'category': '安全',  'tags': ['多Agent', '科研数据', '数据治理', 'AI系统'],                      'date': '2026-05-23'},\n}"

new_entry = "    '2026-06-ai-storage-security-survey': {'category': '安全', 'tags': ['AI安全', '存储安全', 'LLM攻击', '2025-2026'], 'date': '2026-06-06'},\n}"

if old not in content:
    print('PATTERN NOT FOUND - showing end of file:')
    print(repr(content[-800:]))
else:
    # Replace only the very last } of the dict (after the last entry) 
    # The dict ends with: '2025-05-23'},\n}  <-- last dict entry + closing brace
    # We want: '2025-05-23'},\n    NEW_ENTRY\n}
    new_content = old.replace(",\n}", ",\n    '2026-06-ai-storage-security-survey': {'category': '安全', 'tags': ['AI安全', '存储安全', 'LLM攻击', '2025-2026'], 'date': '2026-06-06'},\n}")
    content = content.replace(old, new_content)
    with open('hacms/_rebuild_manifest3.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print('SUCCESS')