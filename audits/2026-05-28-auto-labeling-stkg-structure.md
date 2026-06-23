# Article Audit Prep: 2026-05-28-auto-labeling-stkg

**Path:** `content/articles/2026-05-28-auto-labeling-stkg/index.html`
**Size:** 70,277 bytes (1198 lines)
**Author/Date:** 川龙 / 2026-05-28
**Topic:** 科研数据自动化标注与时空知识图谱全景调研报告 (Auto-labeling × Spatiotemporal KG × Research data governance; 90+ citations)

## Section Structure
- **6 main modules** (背景 / 模块1-5 + 参考文献)
- Sidebar nav with 23 links (h3-tagged sections)
- **7 h2**, **22 h3**, **38 h4** (very deep hierarchy)
- 4 metric boxes in hero: $2.32B / ¥1175亿 / 90%+ / 97.3%
- 5 prediction cards (m5-1)
- 4 nav anchors (m0, m1, m2, m3, m4, m5, refs)

## Quantitative Inventory
| Metric | Count |
|---|---|
| External URLs (real `<a href="http">`) | **0** ⚠️ (all references are inline `<span class="ref">` tags with author/year/venue only) |
| arXiv references | **32** |
| Tables (`<table>`) | **20** (extensive, organized in `.deeptable` class) |
| Inline `<span class="ref">` citations | ~90 (claimed "引用 90+条") |
| Vendor / platform profile tables | 5 (全球标注平台, 中国标注生态, 基础模型, 弱监督, etc.) |
| Sub-section cards | 30+ (`.card`, `.card.green`, `.card.red`, `.card.amber`) |
| Prediction cards | 6 (in m5-1) |
| Long quoted content with cite | 3 (`.quote` blocks) |

## CRITICAL Risk: Cross-Article Reference Leakage (MOST SEVERE OF 6 ARTICLES)
**74 occurrences** of the same `ref-lines` boilerplate — **the highest count of any of the 6 articles**. Every single reference in the **参考文献** section (lines 1096-1188, all ~75 numbered references) carries the same TLP:CLEAR / IOC / MITRE / Breakout Time / Dwell Time contamination. The 8 boilerplate patterns repeat ~9-10 times each. This is **template-reuse from a ransomware report** at industrial scale.

Sample (line 1096):
```
[1] Mordor Intelligence. "Data Annotation Tools Market - Size, Share & Industry Analysis." 2025.
<span class="ref-lines">[网页主体 L1-L420；TLP:CLEAR 章节 L42-L68；技术细节 L120-L260；IOC 列表 L300-L420]</span>
```

A market research firm (Mordor Intelligence) being cited with a "TLP:CLEAR 章节" reference is clearly nonsensical.

## Major Risk Areas

### A. Market Size and Funding Claims (HIGH VOLUME)
Multiple TAM/ARR/估值 numbers in opening and elsewhere:
- "$2.32B (2025) → $30.7B (2026) → $82.4B (2030) CAGR 28.8%" (line 133, 295)
- "¥1175亿 (2025) → ¥1520亿 (2026) → ¥2430亿 (2028) CAGR 27.5%" (line 227, 304)
- **Scale AI "2024营收$8.7亿, 2025目标$20亿 (增长130%+)"** (line 144, 317) — Scale AI was reported to have ~$700M-$870M in 2024 revenue by some sources, $20B in 2025 seems **incredibly high** — verify
- **"估值从$73亿(2024)飙升至$250亿(2025)"** (line 318) — Scale AI raised at $13.8B (May 2024) and later at much higher valuations; $25B is plausible but $73B in 2024 is **wrong** (real figure: $13.8B)
- **"中国标注市场自动化率仅15-20%" / "美国 40-50%"** (line 227, 279) — verify against iResearch / 艾瑞咨询

### B. Vendor Funding Claims (50+ entries to check)
- Labelbox: "C轮$110M，总融资$189M" (line 151)
- V7 Darwin: "B轮$33M" (line 158)
- Encord: "B轮$30M，总融资$57M" (line 165)
- Snorkel AI: "C轮$52M，总融资$137M" (line 172)
- Roboflow: "B轮$30M" (line 179)
- Dataloop: "C轮$33M" (line 186)
- SuperAnnotate: "B轮$36M" (line 200)
- Appen: "ASX:APX上市, 2024营收A$197M" (line 193) — Appen is real, ASX listed, but 2024 revenue around A$200M is plausible
- Labellerr: "种子轮$2.5M" (line 221)

**Each of these is a Crunchbase fact — easy to verify but not currently externally linked.**

### C. Academic Paper Claims (32 arXiv papers)
- **SAM2**: arXiv:2408.00714 (Ravi et al.) — REAL, well-known
- **DINOv2**: arXiv:2304.07193 (Oquab et al.) — REAL
- **Grounding DINO "ECCV 2024"** (line 358) — actual venue for Grounding DINO paper is arXiv 2303.05499, ECCV 2024 ✓
- **YOLO-World "CVPR 2024"** (line 365) — real, Cheng et al.
- **SAM2-ELNet "arXiv:2503.12805, 2025"** (line 372) — specific paper, verify
- **ALGPT "arXiv:2503.02949, 2025"** (line 474) — verify
- **CrowdAgent "arXiv:2502.06823, 2025"** (line 481) — verify
- **HAICoGA "Bioinformatics, 2025"** (line 488) — verify journal
- **SciToolAgent "Nature Computational Science, 2024"** (line 495) — verify
- **BioMedAgent "Nature BME, 2025"** (line 502) — verify
- **"AI Models Collapse" Shumailov et al., Nature 2024** (line 439) — REAL, well-known
- **"Chain-of-Thought Prompting", Wei et al., NeurIPS 2022** (line 418) — REAL
- **Confident Learning, Northcutt et al., JMLR 2022** (line 622) — REAL
- **FixMatch, Sohn et al., NeurIPS 2020** (line 595) — REAL
- **ST-TransE "AAAI 2021"** (line 712) — real
- **TeRo "IJCAI 2021"** (line 719) — real
- **STKOpt "AAAI 2024"** (line 831) — verify
- **KE-STCN "KDD 2024"** (line 838) — verify
- **WeatherKG "AGU 2025"** (line 845) — verify (AGU is a real conference)
- **EpiSTKG "Nature Comm 2023"** (line 858) — verify
- **Yao et al. KGC-LLM "AAAI 2025"** (line 774) — verify
- **arXiv 2502.13030 Bian et al. "LLM-empowered KG Construction"** (line 685) — verify
- **arXiv 2304.07193 DINOv2** — REAL
- **arXiv 2502.08843 HED ransomware detection** (line 1027) — verify
- **Snorkel, Ratner et al. VLDB 2020** (line 529) — REAL, foundational paper

### D. Performance / Metric Claims (very specific)
- "SAM2 遥感建筑分割 IoU 88-92%" (line 343)
- "DINOv2 特征聚类精度 90%+" (line 349)
- "Grounding DINO 零样本检测 mAP 50-60%; COCO 48.5" (line 357)
- "YOLO-World 零样本 mAP 35-45" (line 364)
- "SAM2-ELNet F1 94.2%; 比纯 SAM2 提升 12.8pp" (line 371)
- "TrackSAM MOTA 78.5%" (line 377)
- "ALGPT F1 97.3%" (line 473)
- "GPT-4 Cohen's Kappa 0.73-0.85" (line 410)
- "Model Collapse 5-10代后性能下降 30%+" (line 438)
- "TITAN 17种癌症类型分割 mIoU 78.5%+" (line 993)
- "V7 Auto-Segment 标注时间减少 75%" (line 978)
- "Encord Micro-Model 标注效率提升 10倍" (line 985)

**Each percentage is a verifiable claim that can be checked against the source paper.** A single wrong number in such a heavily-quantified article is significant.

### E. Chinese Market Data Risk
- "海天瑞声 科创板上市 688787" (line 236) — real, verifiable
- "¥1175亿 (2025) 中国数据标注市场" — **This is suspiciously large** — most market reports put the Chinese data annotation market at ¥10-50亿 scale. ¥1175亿 is **likely a fabrication** or a different metric (e.g., total data services market).

### F. "SkillX. Skill Extraction and Distillation. ZJUNLP, 2025" (line 1187)
ZJUNLP (Zhejiang University NLP Lab) is a real lab, but "SkillX" as a specific paper is obscure. Verify.

## Sub-Sections to Prioritize for Verification (Agent B)
1. **Hero metric grid** (lines 100-105): $2.32B, ¥1175亿, 90%+, 97.3% — all need sources
2. **Module 1.1 全球AI标注平台 table** (lines 138-223): 12 vendor rows with funding figures
3. **Module 1.2 中国AI标注生态 table** (lines 230-274): 8 vendors
4. **Module 1.3 市场规模与商业数据** (lines 286-323): Scale AI and Mordor/Grand View data
5. **Module 2.1-2.7 自动化标注技术** (lines 327-651): 7 subsections, ~30 papers
6. **Module 3.1-3.5 STKG** (lines 654-860): ~15 STKG papers
7. **Module 4 科研领域** (lines 862-1030): 4 scientific domains with 20+ papers
8. **Module 5.1 六大趋势预测** (lines 1035-1065): 6 prediction cards with confidence levels
9. **参考文献** (lines 1090-1190): 75+ entries with **all 74 having `ref-lines` contamination**

## Severity Summary
- **CRITICAL:** 74 `ref-lines` template contamination (highest of 6 articles) — entire reference list needs cleanup
- **CRITICAL:** "Scale AI 2025 target $20亿" and "估值$250亿" — possibly confused with $2.5B / $25B
- **HIGH:** "中国标注市场 ¥1175亿" — order-of-magnitude likely wrong
- **HIGH:** 32 arXiv paper IDs need verification (esp. 2024-2025 dated ones)
- **HIGH:** Vendor funding rounds (50+ Crunchbase claims)
- **MEDIUM:** Performance percentages across all tech tables
- **MEDIUM:** 6 prediction cards in Module 5 (with stated confidence levels)
- **LOW:** Internal conceptual claims (qualitative, internally consistent)
