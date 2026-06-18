#!/usr/bin/env python3
"""评估脚本: 测试训练后的模型在防勒索任务上的表现"""
import json
import argparse
from pathlib import Path
from collections import defaultdict


def load_jsonl(path):
    data = []
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            data.append(json.loads(line))
    return data


def eval_classification(predictions, ground_truth):
    """分类任务评估: accuracy / precision / recall / F1"""
    from collections import Counter
    correct = 0
    pred_dist = Counter()
    true_dist = Counter()
    confusion = defaultdict(lambda: defaultdict(int))

    for pred, true in zip(predictions, ground_truth):
        pred_dist[pred] += 1
        true_dist[true] += 1
        confusion[true][pred] += 1
        if pred == true:
            correct += 1
    accuracy = correct / len(predictions) if predictions else 0
    return {
        'accuracy': accuracy,
        'pred_dist': dict(pred_dist),
        'true_dist': dict(true_dist),
        'confusion': {k: dict(v) for k, v in confusion.items()}
    }


def eval_detection(predictions, ground_truth):
    """风险评分评估: MAE / RMSE / 相邻等级准确率"""
    import math
    n = len(predictions)
    if n == 0:
        return {'mae': 0, 'rmse': 0, 'adjacent_accuracy': 0}
    mae = sum(abs(p - t) for p, t in zip(predictions, ground_truth)) / n
    rmse = math.sqrt(sum((p - t) ** 2 for p, t in zip(predictions, ground_truth)) / n)
    # 相邻 0.1 区间算对
    adj_correct = sum(1 for p, t in zip(predictions, ground_truth) if abs(p - t) <= 0.1)
    return {
        'mae': round(mae, 4),
        'rmse': round(rmse, 4),
        'adjacent_accuracy': round(adj_correct / n, 4)
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--eval-data', default='/mnt/g/hacms/content/articles/2026-06-18-ransomware-model-training/data/eval.jsonl')
    parser.add_argument('--predictions', help='模型预测结果 JSONL, 每行 {extension, predicted_category, predicted_risk_score}')
    parser.add_argument('--output', default='./eval_report.json')
    args = parser.parse_args()

    # 加载 eval 数据
    eval_data = load_jsonl(args.eval_data)
    print(f'Loaded {len(eval_data)} eval examples')

    if not args.predictions:
        print('--predictions not provided, showing ground truth distribution only')
        cats = [d.get('category') for d in eval_data if 'category' in d]
        from collections import Counter
        print('Category distribution:', dict(Counter(cats)))
        risks = [d.get('risk_score') for d in eval_data if 'risk_score' in d]
        if risks:
            print(f'Risk score: min={min(risks):.2f}, max={max(risks):.2f}, mean={sum(risks)/len(risks):.2f}')
        return

    preds = load_jsonl(args.predictions)
    pred_cats = [p.get('predicted_category') for p in preds]
    true_cats = [p.get('category') for p in preds]
    pred_risks = [p.get('predicted_risk_score') for p in preds]
    true_risks = [p.get('risk_score') for p in preds]

    # 分类
    cls_report = eval_classification(pred_cats, true_cats)
    # 风险评分
    risk_report = eval_detection(pred_risks, true_risks)

    report = {
        'n': len(preds),
        'classification': cls_report,
        'risk_scoring': risk_report,
    }

    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f'✓ Report: {args.output}')
    print(f'Classification Accuracy: {cls_report["accuracy"]:.4f}')
    print(f'Risk MAE: {risk_report["mae"]}, RMSE: {risk_report["rmse"]}')
    print(f'Adjacent Accuracy: {risk_report["adjacent_accuracy"]:.4f}')


if __name__ == '__main__':
    main()
