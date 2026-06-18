#!/usr/bin/env python3
"""
防勒索模型训练 - 完整流水线
================================

支持 3 种训练方式:
1. LoRA 微调 (7B/13B 模型, 24GB GPU 够用)
2. QLoRA 量化微调 (4-bit 量化, 16GB GPU 可跑 13B)
3. 全参数微调 (70B+, 需 80GB+ A100/H100)

数据:
- classification.jsonl (1553 行) - 12 大类分类
- extension_qa.jsonl (12424 行) - 文件类型问答
- ransomware_detection.jsonl (1553 行) - 防勒索风险评估
- training_combined.jsonl (13977 行) - 合并任务

模型基座 (推荐):
- Qwen2.5-7B-Instruct (中文优秀, 推理速度快)
- Qwen2.5-14B-Instruct (更大, 准确率更高)
- Llama-3.1-8B-Instruct (英文优秀)
- Mistral-7B-Instruct (轻量)

框架:
- LLaMA-Factory (推荐, 一键启动)
- unsloth (快速 QLoRA, 2x 加速)
- transformers + peft (灵活)
"""
import argparse
import json
import os
import sys
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description='防勒索模型训练 - 数据预处理')
    parser.add_argument('--data-dir', default='/mnt/g/hacms/content/articles/2026-06-18-ransomware-model-training/data',
                        help='数据目录')
    parser.add_argument('--output-dir', default='/mnt/g/hacms/content/articles/2026-06-18-ransomware-model-training/output',
                        help='处理后数据输出目录')
    parser.add_argument('--split', action='store_true', help='切分 train/eval')
    parser.add_argument('--eval-ratio', type=float, default=0.05, help='eval 比例')
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # 加载数据
    files = ['classification.jsonl', 'extension_qa.jsonl', 'ransomware_detection.jsonl']
    all_rows = []
    for f in files:
        path = data_dir / f
        if not path.exists():
            print(f'⚠️  Missing: {f}')
            continue
        with open(path, 'r', encoding='utf-8') as fp:
            for line in fp:
                d = json.loads(line)
                all_rows.append(d)
    print(f'Loaded {len(all_rows)} total examples from {len(files)} files')

    if args.split:
        import random
        random.seed(42)
        random.shuffle(all_rows)
        n_eval = int(len(all_rows) * args.eval_ratio)
        eval_rows = all_rows[:n_eval]
        train_rows = all_rows[n_eval:]

        # 写出
        with open(output_dir / 'train.jsonl', 'w', encoding='utf-8') as f:
            for r in train_rows:
                f.write(json.dumps(r, ensure_ascii=False) + '\n')
        with open(output_dir / 'eval.jsonl', 'w', encoding='utf-8') as f:
            for r in eval_rows:
                f.write(json.dumps(r, ensure_ascii=False) + '\n')
        print(f'✓ Split: train={len(train_rows)}, eval={len(eval_rows)}')
    else:
        # 合并所有任务
        with open(output_dir / 'train.jsonl', 'w', encoding='utf-8') as f:
            for r in all_rows:
                f.write(json.dumps(r, ensure_ascii=False) + '\n')
        print(f'✓ Wrote {len(all_rows)} examples to {output_dir}/train.jsonl')

    # 生成 LLaMA-Factory 格式
    print()
    print('--- LLaMA-Factory dataset_info.json snippet ---')
    print('"ransomware_defense": {')
    print('  "file_name": "train.jsonl",')
    print('  "formatting": "alpaca",')
    print('  "columns": {')
    print('    "prompt": "instruction",')
    print('    "query": "input",')
    print('    "response": "output"')
    print('  }')
    print('}')
    print()
    print('--- Quick start with LLaMA-Factory ---')
    print('llamafactory-cli train \\')
    print('  --model_name_or_path Qwen/Qwen2.5-7B-Instruct \\')
    print(f'  --dataset_dir {output_dir} \\')
    print('  --dataset ransomware_defense \\')
    print('  --output_dir ./sft_output \\')
    print('  --finetuning_type lora \\')
    print('  --lora_rank 16 \\')
    print('  --per_device_train_batch_size 4 \\')
    print('  --gradient_accumulation_steps 4 \\')
    print('  --num_train_epochs 3 \\')
    print('  --learning_rate 1e-4 \\')
    print('  --fp16')

if __name__ == '__main__':
    main()
