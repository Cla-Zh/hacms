# Article Audit Prep: 2026-05-26-ai-trends-q2

**Path:** `content/articles/2026-05-26-ai-trends-q2/index.html`
**Size:** 67,371 bytes (1063 lines)
**Author/Date:** 川龙 / 2026-05-26
**Topic:** 2026年Q2 AI技术与产业全景趋势调研报告 (Q2 2026 AI tech + industry panorama; 90+ citations)

## Section Structure
- **5 main chapters** (1: 背景 / 2: 学术前沿 / 3: 产业实践 / 4: 商业洞察 / 5: 大胆预测) + 参考文献
- **7 h2**, **35 h3**, **38 h4** (very dense, 80+ sub-sections)
- 1 TOC
- 10 prediction cards in Chapter 5
- 1 mermaid diagram (Agent internet protocol stack)
- 1 mermaid diagram (AI Scientist research loop)

## Quantitative Inventory
| Metric | Count |
|---|---|
| External URLs (real `<a href="http">`) | **11** (low; mostly Chinese blog/news sources) |
| arXiv references | **5** (very low for "90+ citations" claim) |
| Tables (`<table>`) | **21** (extensive: model comparisons, MoE architecture, AI chips, IPOs, China LLM table) |
| Inline `<span class="ref">` citations | 90+ (claimed) |
| Prediction cards | 10 (with confidence levels 50%-90%) |
| Headline data points | ~55 (per "stats" count) |

## CRITICAL Risk: Cross-Article Reference Leakage
**8 occurrences** of `ref-lines` boilerplate — all concentrated in lines 1043-1050, the "补充引用" subsection of references. The 8 "additional references" (CNBC, SoftBank Stargate, Zhihu, Juejin, Sohu, CSDN) all carry the same TLP:CLEAR / IOC / MITRE / Breakout Time / Dwell Time contamination:
```
[83] CNBC, "Nvidia buying AI chip startup Groq for about $20 billion", December 2025.
<span class="ref-lines">[网页主体 L1-L420；TLP:CLEAR 章节 L42-L68；技术细节 L120-L260；IOC 列表 L300-L420]</span>
```

A CNBC article about NVIDIA buying Groq cannot have a "TLP:CLEAR 章节" reference. **Clear template reuse defect.**

## Major Risk Areas (this article has the most aggressive future claims)

### A. Date Inconsistency / Time Period Mismatch
The article is dated **2026-05-26** but contains many claims about Q1 2026 and even references to **2025 events being treated as "Q2 2025"回顾** (Section 4.9-4.13):
- Section 4.9 (line 747-764): "**2025年Q2**头部模型厂商关键发布回顾" — but the article date is May 2026, so a "2025 Q2 回顾" placed in 2026 Q2 is **temporally confusing**
- Tables list events from "2025年3月" to "2025年8月" within a "2026 Q2" article
- Section 4.13 model comparison (line 842-872) compares "GPT-5 (2025-08)" / "Claude 4 Opus (2025-05)" — these are 2025 models compared in a 2026 article

**This is a major structural issue: the article mixes 2025 Q2 retrospective with 2026 Q2 current**. The mix suggests either (a) the article was repurposed from an earlier draft, or (b) deliberate historical comparison. Either way, dates need scrutiny.

### B. NVIDIA Buying Groq ($20B)
- Line 422: "Groq 3 LPU" listed as part of Vera Rubin platform
- Line 585: "NVIDIA Vera Rubin R100 + Groq 3 LPU"
- Line 1043: "[83] CNBC, 'Nvidia buying AI chip startup Groq for about $20 billion', December 2025"
- **REALITY CHECK:** As of my knowledge, NVIDIA has NOT acquired Groq for $20B. Groq remains independent (founded by Jonathan Ross). **This may be a hallucination or a confused reference to Groq's $640M Series C or similar fundraising.** ⚠️ HIGH RISK.

### C. "DeepSeek V4 Pro 1.6T MoE" (line 149)
- Article date: 2026-05-26
- DeepSeek V4: I have no verified record of a "V4 Pro 1.6T MoE" release
- DeepSeek had V3.1 (685B MoE, Aug 2025), V3.2-Exp (Sep 2025)
- **A "V4 1.6T MoE released April 24 2026 with MIT license" would be a major model release that should be verifiable in major media.** As of my knowledge, this has not been publicly released.

### D. Specific Date-Specific Event Claims (verifiable)
- "GPT-5 正式发布 2026年3月 (OpenAI)" (line 148) — verify actual release date
- "NVIDIA GTC 2026发布Vera Rubin" (line 150) — GTC 2026 was March 16-19, 2026 ✓
- "Sakana AI AI Scientist登上Nature 2026年3月25日" (line 268) — verify
- "Qwen3.6-Plus 全球代码第一" (line 365) — verify
- "Claude Opus 4.6 (2026年2月) / 4.7 (2026年4月)" (line 386) — verify
- "Gemini 3.1 Pro (2026年4月) / 3.5 Flash (2026年5月)" (line 387) — verify
- "EU AI Act 2026年8月2日 首批执法" (line 768-770) — actual EU AI Act effective dates should be checked (real schedule: Aug 2024, Feb 2025, Aug 2025, Aug 2026, Aug 2027)
- "FutureHouse Robin" (line 278) — verify if this is a real biology AI system

### E. Funding Round / IPO Claims
- "OpenAI $1220亿 估值$8520亿" (line 610) — OpenAI did have major funding rounds; verify the specific $1220B
- "Anthropic $300亿新一轮" (line 611) — verify
- "新增独角兽 70家" (line 612) — verify
- "OpenAI Q1 2026 funding $40B, 估值$300B" (line 806) — **DIFFERENT number from line 610** ($8520亿 vs $300B) — **INTERNAL CONTRADICTION** in the same article!
- "Anthropic Series E $3.5B, 估值$61.5B" (line 807) — **also different from $300B funding** — contradiction
- "xAI Series C $6.0B, 估值$50B" (line 808) — verify
- "Databricks $134B" (line 687, 910) — verify
- "Cursor (Anysphere) $50B+" (line 689) — verify

**These funding/valuation numbers should be cross-checked internally for consistency** — the article contains multiple different OpenAI valuations.

### F. NVIDIA Vera Rubin Platform Specs (line 414-422)
- "Rubin R100 GPU: 336亿晶体管, 288GB HBM4, 22TB/s带宽" — verify
- "Vera CPU: 1.5TB LPDDR5X/颗" — verify
- "NVLink 6 Switch: 1.8TB/s双向带宽" — verify
- "CPO (Co-Packaged Optics)" — verify
- "ConnectX-8 NIC: 400GbE" — verify
- "BlueField-4 DPU" — verify

### G. Model Price Claims
- "DeepSeek V4 Pro: ¥1/¥2 per million tokens" (line 400) — if V4 is hallucinated, the price is too
- "GPT-5: $10/$30" — verify
- "Claude Opus 4.7: $15/$75" — verify
- "Gemini 3.1 Pro: $7/$21" — verify
- "Llama 4 Maverick 自部署 ~$0.5" — verify (cost may not be standard metric)

### H. Performance Benchmarks
- "MMLU-Pro 92.0 (GPT-5) / 91.5 (Claude) / 89.5 (Gemini) / 88.3 (DeepSeek) / 87.8 (Qwen3-Max)" (line 850) — verify
- "GPQA Diamond 85.0 (GPT-5)..." (line 851) — verify
- "SWE-bench 75.0 (GPT-5) / 72.5 (Claude) / 63.0 (Gemini) / 62.0 (DeepSeek) / 69.0 (Qwen3-Max)" (line 852) — verify
- "HumanEval+ 95.0 (GPT-5)..." (line 853) — verify

### I. China LLM Table (lines 822-828) Risks
- "百度 ERNIE 4.5 / X1" (line 822) — verify versions
- "阿里 Qwen3 / Qwen3-Max" (line 823) — verify
- "月之暗面 K2 / K2-0905" (line 824) — verify K2-0905 (obscure internal version)
- "DeepSeek V3.1 / V3.2-Exp" (line 825) — REAL, verifiable
- "豆包 1.5 Pro 256K $0.11/M" (line 826) — verify the price
- "智谱 GLM-4.5 / GLM-Z1 355B MoE Apache 2.0" (line 827) — verify

### J. Energy / Data Center Claims
- "2026 全球数据中心年耗电 1000 TWh" (line 668) — verify
- "2028 年前需新增 126 GW" (line 669) — verify
- "AI Agent ROI 中位数 14 个月回本" (line 630) — verify
- "72% 企业已部署至少一个 AI 生产应用" (line 628) — verify
- "Stanford AI Index 2026: AI 安全事件 2024→2025 233→362 (+55%)" (line 324) — verify

## Sub-Sections to Prioritize for Verification (Agent B)
1. **Chapter 1 标志性事件 table** (lines 146-151): GPT-5, DeepSeek V4, Vera Rubin — 3 anchor events
2. **Chapter 2.1 MoE 模型表** (lines 216-223): 5 models, parameter counts
3. **Chapter 3.1 开源五强争霸** (lines 358-367): 5 open-source models
4. **Chapter 3.2 闭源前沿军备竞赛** (lines 378-389): 6 closed-source models
5. **Chapter 3.3 NVIDIA Vera Rubin 七芯片平台** (lines 410-422): 7 chips with detailed specs
6. **Chapter 4.1 Q1 2026 融资** (lines 603-618): $2970亿 + 70 new unicorns
7. **Chapter 4.5 AI IPO 浪潮** (lines 680-696): 5 IPO candidates
8. **Chapter 4.9-4.13 2025 Q2 回顾 (anomaly)** (lines 747-872): The 2025 historical section in a 2026 article
9. **Chapter 5 大胆预测** (lines 880-944): 10 prediction cards with confidence levels
10. **参考文献补充引用** (lines 1042-1051): 8 references all with `ref-lines` contamination

## Severity Summary
- **CRITICAL:** 8 `ref-lines` template contamination in supplementary references
- **CRITICAL:** "NVIDIA acquired Groq for $20B" (line 1043) — **likely fabricated**, Groq is independent
- **CRITICAL:** "DeepSeek V4 Pro 1.6T MoE MIT license 2026-04-24" (line 149) — **likely fabricated**, DeepSeek's latest verified is V3.2-Exp
- **CRITICAL:** **INTERNAL CONTRADICTION** — OpenAI valued at $8520亿 (line 610) vs $300B (line 806)
- **CRITICAL:** **TEMPORAL ANOMALY** — "2025年Q2回顾" inside a 2026 Q2 article (Sections 4.9-4.13)
- **HIGH:** 8 model benchmark numbers (MMLU-Pro, GPQA, SWE-bench, HumanEval+) need verification
- **HIGH:** Vera Rubin 7-chip platform specs (336亿晶体管, 288GB HBM4, 22TB/s)
- **HIGH:** Funding round figures across multiple paragraphs (Anthropic, xAI, OpenAI, Databricks)
- **MEDIUM:** Energy consumption (1000 TWh) and EU AI Act dates
- **MEDIUM:** 10 prediction cards with stated confidence levels
- **POSITIVE:** The article has many internal numbers that should make it easy to cross-validate (if one is wrong, others may be too)
