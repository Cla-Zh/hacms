#!/usr/bin/env python3
"""
hacms manifest 同步脚本
- 读 manifest.json
- 重新生成 manifest-light.json (精简字段)
- 重新计算 _meta.version (基于所有文章 id+date 的 SHA256)
- 更新 _meta.generated_at
- 更新 _meta.article_count

使用:
  python3 /mnt/g/hacms/scripts/sync-manifest.py

或加入 hacms-deploy.sh 自动调用
"""
import json
import hashlib
import datetime
import os
import sys

REPO = '/mnt/g/hacms'
FULL = f'{REPO}/content/index/manifest.json'
LIGHT = f'{REPO}/content/index/manifest-light.json'

# light 模式: 保留的字段
LIGHT_FIELDS = {
    'id', 'title', 'category', 'series', 'tags',
    'date', 'summary', 'html_path',
    'word_count', 'reading_time_minutes',
    'featured', 'hero_priority',
    'cover', 'attachments',
}


def compute_version(articles):
    """基于所有文章 id+date+html_path 计算稳定版本号"""
    keys = sorted(f"{a.get('id')}|{a.get('date')}|{a.get('html_path', '')}"
                  for a in articles)
    raw = '|'.join(keys)
    h = hashlib.sha256(raw.encode()).hexdigest()[:16]
    return f"{h[:8]}-{h[8:16]}"


def main():
    if not os.path.exists(FULL):
        print(f"❌ {FULL} 不存在")
        return 1

    with open(FULL, encoding='utf-8') as f:
        full = json.load(f)

    articles = full.get('articles', [])
    new_version = compute_version(articles)
    now = datetime.datetime.now().isoformat(timespec='seconds')

    # 更新 full _meta
    full.setdefault('_meta', {})
    old_version = full['_meta'].get('version', 'NONE')
    full['_meta']['version'] = new_version
    full['_meta']['generated_at'] = now
    full['_meta']['article_count'] = len(articles)
    full['_meta'].setdefault('schema', 'hacms-manifest-v2')

    # 生成 light (只保留必要字段)
    light_articles = []
    for a in articles:
        light_articles.append({k: a.get(k) for k in LIGHT_FIELDS if k in a})

    light = {
        '_meta': {
            'version': new_version,
            'generated_at': now,
            'article_count': len(articles),
            'schema': 'hacms-manifest-v2-light',
            'parent_full_version': new_version,
        },
        'articles': light_articles,
    }

    # 写回
    with open(FULL, 'w', encoding='utf-8') as f:
        json.dump(full, f, ensure_ascii=False, indent=2)
    with open(LIGHT, 'w', encoding='utf-8') as f:
        json.dump(light, f, ensure_ascii=False, indent=2)

    # 检查 _meta.article_count 是否对得上 articles 数量
    if full['_meta']['article_count'] != len(articles):
        print(f"⚠️ _meta.article_count={full['_meta']['article_count']} != articles={len(articles)}")
        return 2

    # 检查所有文章的 html_path 文件是否真的存在
    missing_files = []
    for a in articles:
        path = a.get('html_path', '')
        if not path:
            continue
        full_path = os.path.join(REPO, path)
        if not os.path.exists(full_path):
            missing_files.append(path)
    if missing_files:
        print(f"⚠️ {len(missing_files)} 篇文章 html_path 指向不存在的文件:")
        for p in missing_files[:5]:
            print(f"  - {p}")
        if len(missing_files) > 5:
            print(f"  ... 共 {len(missing_files)} 个")

    print(f"✅ manifest 同步完成")
    print(f"  version:    {old_version} → {new_version}")
    print(f"  full:       {len(articles)} 篇 ({os.path.getsize(FULL)} 字节)")
    print(f"  light:      {len(light_articles)} 篇 ({os.path.getsize(LIGHT)} 字节)")
    print(f"  generated:  {now}")
    return 0


if __name__ == '__main__':
    sys.exit(main())
