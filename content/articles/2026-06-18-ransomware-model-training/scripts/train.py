#!/usr/bin/env python3
"""
训练启动脚本 - 支持 LLaMA-Factory / unsloth / transformers
"""
import os
import sys
import argparse
import subprocess
from pathlib import Path


def run_llamafactory(model_name, output_dir, lora_rank=16, epochs=3, batch_size=4, grad_accum=4, lr=1e-4, quantization='none'):
    """启动 LLaMA-Factory 训练"""
    data_dir = Path('/mnt/g/hacms/content/articles/2026-06-18-ransomware-model-training/data')
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    cmd = [
        'llamafactory-cli', 'train',
        '--model_name_or_path', model_name,
        '--dataset_dir', str(data_dir),
        '--dataset', 'ransomware_defense',
        '--output_dir', str(output_dir),
        '--finetuning_type', 'lora' if quantization == 'none' else 'qlora',
        '--lora_rank', str(lora_rank),
        '--lora_alpha', str(lora_rank * 2),
        '--per_device_train_batch_size', str(batch_size),
        '--gradient_accumulation_steps', str(grad_accum),
        '--num_train_epochs', str(epochs),
        '--learning_rate', str(lr),
        '--warmup_ratio', '0.1',
        '--lr_scheduler_type', 'cosine',
        '--save_steps', '500',
        '--logging_steps', '20',
        '--plot_loss',
    ]
    if quantization in ('4bit', '8bit'):
        cmd += ['--quantization_bit', '4' if quantization == '4bit' else '8']
    if quantization != 'none':
        cmd.append('--quantization_method', 'bitsandbytes')
    cmd.append('--fp16' if quantization in ('none', '8bit') else '--bf16')

    print(' '.join(cmd))
    subprocess.run(cmd, check=True)


def run_unsloth(model_name, output_dir, max_seq_length=2048, epochs=3, lora_rank=16):
    """使用 unsloth 启动 QLoRA 训练 (2x 加速)"""
    script = f'''
import torch
from unsloth import FastLanguageModel
from trl import SFTTrainer
from transformers import TrainingArguments
from datasets import load_dataset

# 加载模型
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="{model_name}",
    max_seq_length={max_seq_length},
    dtype=None,
    load_in_4bit=True,
)

# LoRA 配置
model = FastLanguageModel.get_peft_model(
    model,
    r={lora_rank},
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_alpha={lora_rank * 2},
    lora_dropout=0.05,
    bias="none",
    use_gradient_checkpointing="unsloth",
)

# 数据
dataset = load_dataset("json", data_files="/mnt/g/hacms/content/articles/2026-06-18-ransomware-model-training/data/training_combined.jsonl", split="train")

def format_prompts(examples):
    instructions = examples["instruction"]
    inputs = examples.get("input", [""] * len(instructions))
    outputs = examples["output"]
    texts = []
    for instruction, input, output in zip(instructions, inputs, outputs):
        text = f"### Instruction:\\n{instruction}\\n\\n### Response:\\n{output}"
        texts.append(text)
    return {{"text": texts}}
dataset = dataset.map(format_prompts, batched=True)

# 训练
trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset,
    dataset_text_field="text",
    max_seq_length={max_seq_length},
    args=TrainingArguments(
        per_device_train_batch_size=4,
        gradient_accumulation_steps=4,
        num_train_epochs={epochs},
        learning_rate=1e-4,
        fp16=True,
        logging_steps=20,
        output_dir="{output_dir}",
    ),
)
trainer.train()
model.save_pretrained("{output_dir}")
tokenizer.save_pretrained("{output_dir}")
'''
    print(script)
    print('--- Save as train_unsloth.py and run it ---')


def run_transformers_lora(model_name, output_dir, epochs=3, lora_rank=16, batch_size=2, lr=1e-4, max_length=2048):
    """纯 transformers + peft 训练 (灵活, 无依赖 LLaMA-Factory)"""
    script = f'''
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from datasets import load_dataset
from trl import SFTTrainer

model_name = "{model_name}"
output_dir = "{output_dir}"

# 加载 tokenizer
tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
tokenizer.pad_token = tokenizer.eos_token

# 加载模型 (4-bit 量化以节省显存)
from transformers import BitsAndBytesConfig
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True,
)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True,
)
model = prepare_model_for_kbit_training(model)

# LoRA 配置
lora_config = LoraConfig(
    r={lora_rank},
    lora_alpha={lora_rank * 2},
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
)
model = get_peft_model(model, lora_config)

# 数据
dataset = load_dataset("json", data_files="/mnt/g/hacms/content/articles/2026-06-18-ransomware-model-training/data/training_combined.jsonl", split="train")

def format_prompts(examples):
    texts = []
    for inst, inp, out in zip(examples["instruction"], examples.get("input", [""] * len(examples["instruction"])), examples["output"]):
        text = f"### Instruction:\\n{{inst}}\\n\\n### Response:\\n{{out}}"
        texts.append(text)
    return {{"text": texts}}
dataset = dataset.map(format_prompts, batched=True)

# 训练
training_args = TrainingArguments(
    output_dir=output_dir,
    num_train_epochs={epochs},
    per_device_train_batch_size={batch_size},
    gradient_accumulation_steps=8,
    learning_rate={lr},
    fp16=True,
    logging_steps=20,
    save_steps=500,
    warmup_ratio=0.1,
    lr_scheduler_type="cosine",
    optim="paged_adamw_8bit",
)

trainer = SFTTrainer(
    model=model,
    args=training_args,
    train_dataset=dataset,
    tokenizer=tokenizer,
    dataset_text_field="text",
    max_seq_length={max_length},
)
trainer.train()
trainer.save_model(output_dir)
'''
    print(script)
    print('--- Save as train.py and run it ---')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--method', choices=['llamafactory', 'unsloth', 'transformers'], required=True)
    parser.add_argument('--model', default='Qwen/Qwen2.5-7B-Instruct')
    parser.add_argument('--output', default='./sft_output')
    parser.add_argument('--epochs', type=int, default=3)
    parser.add_argument('--lora-rank', type=int, default=16)
    parser.add_argument('--quantization', default='4bit', choices=['none', '4bit', '8bit'])
    parser.add_argument('--batch-size', type=int, default=4)
    parser.add_argument('--lr', type=float, default=1e-4)
    args = parser.parse_args()

    print(f'=== Training: {args.method} | model={args.model} | epochs={args.epochs} ===')

    if args.method == 'llamafactory':
        run_llamafactory(args.model, args.output, args.lora_rank, args.epochs, args.batch_size, lr=args.lr, quantization=args.quantization)
    elif args.method == 'unsloth':
        run_unsloth(args.model, args.output, epochs=args.epochs, lora_rank=args.lora_rank)
    elif args.method == 'transformers':
        run_transformers_lora(args.model, args.output, args.epochs, args.lora_rank, args.batch_size, args.lr)


if __name__ == '__main__':
    main()
