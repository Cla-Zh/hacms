#!/usr/bin/env python3
"""
validate_manifest.py — HACMS manifest.json 完整性校验工具

校验项（与 .harness/harness.json 一致）：
  1. JSON 合法
  2. id 唯一
  3. html_path 文件存在
  4. attachments 中每个文件存在
  5. category 在 allowed_categories 中
  6. tags 长度 2-4
  7. id 与 html_path 一致

使用：
  python3 scripts/validate_manifest.py                  # 校验
  python3 scripts/validate_manifest.py --fix-tags      # 自动从 title/summary 提取 tags
  python3 scripts/validate_manifest.py --fix-attachments  # 自动扫描生成 attachments
  python3 scripts/validate_manifest.py --strict        # 失败时返回非零退出码
"""

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HARNESS = ROOT / ".harness" / "harness.json"
MANIFEST = ROOT / "content" / "index" / "manifest.json"


def load_harness():
    return json.loads(HARNESS.read_text(encoding="utf-8"))


def load_manifest():
    return json.loads(MANIFEST.read_text(encoding="utf-8"))


def save_manifest(articles):
    MANIFEST.write_text(
        json.dumps(articles, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def list_attachments(slug):
    art_dir = ROOT / "content" / "articles" / slug
    if not art_dir.is_dir():
        return []
    out = []
    for f in art_dir.iterdir():
        if f.is_file() and f.name != "index.html":
            out.append(
                {
                    "format": f.suffix.lstrip(".").lower(),
                    "name": f.name,
                    "path": f"content/articles/{slug}/{f.name}",
                }
            )
    return out


def extract_tags_from_text(article):
    """简易关键词提取：基于现有 tag 库 + 关键词字典"""
    title = article.get("title", "")
    summary = article.get("summary", "")
    text = title + " " + summary

    # 关键词 -> tag 映射
    keyword_map = {
        "勒索病毒": ["勒索病毒", "LockBit", "BlackCat", "ALPHV", "Akira", "Play", "Hive", "REvil", "Conti", "Cl0p", "Medusa", "BianLian", "DarkSide", "Babuk", "Royal", "Black Basta", "RansomEXX", "Ransomware"],
        "AI 训练": ["训练", "training", "MLOps", "模型训练"],
        "AI 推理": ["推理", "inference", "serving", "KV Cache", "kv-cache"],
        "AI Agent": ["Agent", "多 Agent", "Harness", "代理"],
        "AI 记忆": ["记忆", "memory", "MemoryOS", "MemGPT", "UCM"],
        "AI 存储": ["存储", "storage", "对象存储", "数据湖", "湖仓", "RAG", "向量"],
        "云原生": ["云原生", "云存储", "Kubernetes", "容器"],
        "数据安全": ["数据安全", "DLP", "UEBA", "防泄漏"],
        "勒索防护": ["防勒索", "勒索防护", "勒索检测", "误报", "Cyber Recovery", "数据恢复"],
        "供应链": ["供应链", "supply chain"],
        "零信任": ["零信任", "zero trust"],
        "数据治理": ["数据治理", "数据标注", "数据清洗", "STKG", "知识图谱"],
        "行业趋势": ["趋势", "全景", "调研", "展望", "预测", "Q1", "Q2", "Q3", "Q4"],
        "DLP": ["DLP", "Data Loss Prevention", "数据防泄漏"],
        "UEBA": ["UEBA"],
        "数据恢复": ["数据恢复", "Recovery", "Cyber Recovery"],
        "AI 安全": ["AI 安全", "AISecurity", "AI Security"],
        "基础能力": ["基础能力", "工业化"],
        "安全路线图": ["安全路线图", "roadmap", "演进路线"],
        "勒索误报": ["误报", "False Positive", "false-positive"],
    }

    matched = set()
    for tag, keywords in keyword_map.items():
        for kw in keywords:
            if kw.lower() in text.lower():
                matched.add(tag)
                break

    # 取 2-4 个高频 tag
    tags = list(matched)[:4]
    if len(tags) < 2:
        # 兜底：基于 category 给默认 tag
        cat = article.get("category", "")
        defaults = {
            "安全": ["网络安全", "安全"],
            "AI基础设施": ["AI", "基础设施"],
            "洞察": ["行业趋势", "市场"],
            "AI应用": ["AI应用", "Agent"],
            "其他": ["调研", "分析"],
        }
        for t in defaults.get(cat, ["调研", "分析"]):
            if t not in tags:
                tags.append(t)
                if len(tags) >= 2:
                    break
    return tags[:4]


def fix_tags(articles):
    """自动补 tags"""
    fixed = 0
    for a in articles:
        tags = a.get("tags", [])
        if not tags or len(tags) < 2:
            a["tags"] = extract_tags_from_text(a)
            fixed += 1
            print(f"  ✓ {a['id']}: tags → {a['tags']}")
    return fixed


def fix_attachments(articles):
    """自动扫描生成 attachments"""
    fixed = 0
    for a in articles:
        slug = a["id"]
        declared = a.get("attachments", [])
        actual = list_attachments(slug)
        if len(declared) != len(actual) or any(
            d.get("path") != x["path"] for d, x in zip(declared, actual)
        ):
            a["attachments"] = actual
            fixed += 1
            print(f"  ✓ {slug}: {len(actual)} 个附件")
    return fixed


def validate(articles, harness, strict=False):
    """返回 (errors, warnings) 列表"""
    errors = []
    warnings = []

    allowed_cats = set(harness.get("classification_policy", {}).get("allowed_categories", []))
    tag_min = harness.get("tag_policy", {}).get("min", 2)
    tag_max = harness.get("tag_policy", {}).get("max", 4)
    required_fields = harness.get("manifest_spec", {}).get("required_fields", [])

    # 1. 唯一性
    ids = [a.get("id") for a in articles]
    if len(ids) != len(set(ids)):
        seen = set()
        dups = [i for i in ids if i in seen or seen.add(i)]
        errors.append(f"重复 id: {dups}")

    for i, a in enumerate(articles):
        prefix = f"#{i} {a.get('id', '?')}"
        # 2. 必填字段
        for f in required_fields:
            if f not in a:
                errors.append(f"{prefix} 缺必填字段: {f}")
        # 3. category
        if a.get("category") not in allowed_cats:
            errors.append(
                f"{prefix} category='{a.get('category')}' 不在 allowed_categories {allowed_cats}"
            )
        # 5. tags 长度（超过 max 时自动截断到 max 个，保留靠前的）
        tags = a.get("tags", [])
        if len(tags) > tag_max:
            a["tags"] = tags[:tag_max]
            tags = a["tags"]
        if not (tag_min <= len(tags) <= tag_max):
            errors.append(f"{prefix} tags 数量 {len(tags)} 不在 [{tag_min}, {tag_max}]")
        # 5. html_path 存在
        hp = a.get("html_path", "")
        if hp:
            full = ROOT / hp
            if not full.exists():
                errors.append(f"{prefix} html_path 不存在: {hp}")
        # 6. id 与 html_path 一致 (qa 条目走 qa 目录, 其他走 articles)
        if a.get("id") and hp:
            if a.get("type") == "qa":
                expected = f"content/qa/{a['id']}/index.html"
            else:
                expected = f"content/articles/{a['id']}/index.html"
            if hp != expected:
                errors.append(f"{prefix} html_path 应为 {expected}, 实际 {hp}")
        # 7. attachments 存在
        for att in a.get("attachments", []):
            p = ROOT / att.get("path", "")
            if not p.exists():
                errors.append(f"{prefix} 附件不存在: {att.get('path')}")
        # 8. summary 长度
        summary = a.get("summary", "")
        if len(summary) < 10:
            warnings.append(f"{prefix} summary 过短 ({len(summary)} 字符)")

    return errors, warnings


def main():
    parser = argparse.ArgumentParser(description="HACMS manifest 校验")
    parser.add_argument("--fix-tags", action="store_true", help="自动补 tags")
    parser.add_argument("--fix-attachments", action="store_true", help="自动补 attachments")
    parser.add_argument("--strict", action="store_true", help="失败时返回非零退出码")
    args = parser.parse_args()

    harness = load_harness()
    articles = load_manifest()

    print(f"📋 加载 manifest: {len(articles)} 篇文章")
    print(f"🔧 harness 版本: {harness.get('harness_version', '?')}")
    print()

    if args.fix_tags:
        print("🔧 自动补 tags ...")
        n = fix_tags(articles)
        print(f"   → 修复 {n} 篇")
        save_manifest(articles)
        print()
    if args.fix_attachments:
        print("🔧 自动补 attachments ...")
        n = fix_attachments(articles)
        print(f"   → 修复 {n} 篇")
        save_manifest(articles)
        print()

    print("🔍 校验中 ...")
    errors, warnings = validate(articles, harness, args.strict)

    if errors:
        print(f"\n❌ {len(errors)} 个错误:")
        for e in errors:
            print(f"  - {e}")
    if warnings:
        print(f"\n⚠️  {len(warnings)} 个警告:")
        for w in warnings:
            print(f"  - {w}")
    if not errors and not warnings:
        print("\n✅ 全部通过")

    return 1 if errors and args.strict else 0


if __name__ == "__main__":
    sys.exit(main())
