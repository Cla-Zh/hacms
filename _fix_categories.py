"""
Fix categories and dates in _rebuild_manifest3.py MANUAL dict.
"""
import re, sys
sys.stdout.reconfigure(encoding='utf-8')

REBUILD = 'C:/Users/Administrator/.openclaw/workspace/hacms/_rebuild_manifest3.py'

with open(REBUILD, 'r', encoding='utf-8') as f:
    content = f.read()

# Complete MANUAL entries with category + tags + date
complete = {
    '2026-05-aicms-intro':            {'category': 'AI基础设施', 'tags': ['CMS', '去中心化', 'AAM', 'AI基础设施'], 'date': '2026-05-25'},
    '2026-05-ransomware-defense':     {'category': '安全',       'tags': ['勒索软件', '数据保护', '安全', '2025-2026'], 'date': '2025-07-09'},
    '2026-05-ransomware-false-positive': {'category': '安全',    'tags': ['误报', '安全运营', 'SOC', 'EDR'], 'date': '2025-07-09'},
    '2026-05-dlp-storage-vendors':    {'category': '安全',       'tags': ['DLP', '存储安全', '数据防泄漏', '厂商分析'], 'date': '2026-05-19'},
    '2026-05-ueba-dlp':               {'category': '安全',       'tags': ['UEBA', 'DLP', '行为分析', '数据安全'], 'date': '2026-05-20'},
    '2026-05-harness-agent-demo':     {'category': 'AI应用',     'tags': ['Harness', 'Agent', 'AI架构', 'Demo'], 'date': '2026-05-21'},
    '2026-05-ai-trends-q2':           {'category': '安全',       'tags': ['AI趋势', '产业分析', '2026Q2', '研究报告'], 'date': '2026-05-26'},
    '2026-05-multiagent-scientific-data': {'category': '安全', 'tags': ['多Agent', '科研数据', '数据治理', 'AI系统'], 'date': '2026-05-23'},
    '2026-06-ai-storage-security-survey': {'category': '安全',   'tags': ['AI安全', '存储安全', 'LLM攻击', '2025-2026'], 'date': '2026-06-06'},
    '2026-05-ai-storage-infrastructure': {'category': 'AI基础设施', 'tags': ['AI算力', '存储架构', 'GPU', '分布式'], 'date': '2026-03-01'},
    '2026-05-auto-labeling-stkg':     {'category': 'AI应用',     'tags': ['数据标注', '知识图谱', '科研数据', '自动化'], 'date': '2025-04-01'},
    '2026-05-ai-supply-chain-security': {'category': '安全',     'tags': ['AI安全', '供应链', '模型安全', '投毒'], 'date': '2026-05-01'},
    '2026-05-kv-cache-industry-trend-research': {'category': 'AI基础设施', 'tags': ['KV Cache', 'LLM推理', '内存优化', '产业趋势'], 'date': '2026-05-01'},
    '2026-05-malware-trends-2025-2026': {'category': '安全',     'tags': ['恶意软件', '勒索软件', '数据窃取', '趋势分析'], 'date': '2025-05-01'},
    '2026-05-security-roadmap-agent-poison-recovery': {'category': '安全', 'tags': ['Agent安全', '数据投毒', '数据恢复'], 'date': '2026-05-01'},
    '2026-05-security-roadmap-agent-security': {'category': '安全', 'tags': ['Agent安全', '存储侧防护'], 'date': '2025-12-01'},
    '2026-05-security-roadmap-ai-card-v1': {'category': '安全', 'tags': ['AI检测', '勒索软件', '卸载'], 'date': '2026-01-01'},
    '2026-05-security-roadmap-ai-foundation': {'category': 'AI基础设施', 'tags': ['AI开发', '工业化'], 'date': '2026-05-01'},
    '2026-05-security-roadmap-data-recovery': {'category': '安全', 'tags': ['数据恢复', '网络恢复', 'Cyber Recovery'], 'date': '2026-05-01'},
    '2026-05-security-roadmap-false-positive': {'category': '安全', 'tags': ['误报治理', '多信号融合'], 'date': '2026-05-01'},
    '2026-05-security-roadmap-overview': {'category': '安全', 'tags': ['安全路线图', '26H1-27H2'], 'date': '2026-05-01'},
    '2026-05-security-roadmap-recall-ai-card-v2': {'category': '安全', 'tags': ['漏报根治', 'AI卡V2'], 'date': '2026-05-01'},
    '2026-05-storage-data-security-incremental-v3': {'category': '安全', 'tags': ['存储安全', '增量方向', '调研'], 'date': '2026-05-01'},
    '2026-06-datashield-aegis-plan-v3': {'category': '安全', 'tags': ['DataShield', 'Aegis', 'LLM安全', 'Agent'], 'date': '2026-06-04'},
    '2026-06-ai-memory-panorama-research': {'category': 'AI基础设施', 'tags': ['AI记忆', 'Agent记忆', '内存管理'], 'date': '2025-10-28'},
}

# Build the full MANUAL dict text
lines = ['MANUAL = {']
for name in sorted(complete.keys()):
    entry = complete[name]
    cat = entry['category']
    tags = entry['tags']
    date = entry['date']
    tags_str = ', '.join(repr(t) for t in tags)
    lines.append(f"    {repr(name)}: {{'category': {repr(cat)}, 'tags': [{tags_str}], 'date': {repr(date)}}},")
lines.append('}')

new_manual = '\n'.join(lines)

# Find and replace MANUAL dict in _rebuild_manifest3.py
start_m = re.search(r'^MANUAL\s*=\s*\{', content, re.MULTILINE)
if not start_m:
    print('ERROR: MANUAL not found')
    sys.exit(1)

start_idx = start_m.start()
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

new_content = content[:start_idx] + new_manual + '\n' + content[end_idx+1:]

with open(REBUILD, 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Updated MANUAL dict with', len(complete), 'entries')
print('Sample entry:', lines[1])