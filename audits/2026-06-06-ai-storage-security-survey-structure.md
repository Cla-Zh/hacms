# Article Audit Prep: 2026-06-06-ai-storage-security-survey

**Path:** `content/articles/2026-06-06-ai-storage-security-survey/index.html`
**Size:** 74,617 bytes (1187 lines)
**Author/Date:** 川龙 / 2026-06-06
**Topic:** AI-Driven Storage Security Survey 2025–2026 全景威胁图谱 (v5 STRICT — Zero-Hallucination Policy, claims "25 Verified URLs" / "32 Verified References")

## Section Structure
- **8 sections** (Section 1–8): North-South 架构 / 威胁演进 / 权威标准 / 学术前沿 / 数据破坏 / AI 造毒 / 防御 / References
- **8 h2**, **1 h3**, **18 h4** (heavy use of h4 for sub-sections within cards)
- 1 nav (sticky top with 8 links)
- 1 disclaimer block declaring "Zero-Hallucination Policy" (lines 229-232) — **notable: explicitly lists what was REMOVED during audit, including "Poison Once/Exploit Forever", "NDSS Philosopher's Stone", "LiteLLM供应链攻击", "CVE-2025-49990"**
- Hero declares: "Zero Hallucination ✓"

## Quantitative Inventory
| Metric | Count |
|---|---|
| External URLs (real `<a href="http">`) | **85** (the most of all 6 articles) |
| arXiv references | **20** |
| Tables (`<table>`) | **14** (threat evolution, standards, academic, CVEs) |
| Sub-section cards (.sub-section) | 18+ |
| Refs with full URL | 32 (ref-1 through ref-32) |
| Inline threat/CVE entries | 13 (Top 30 + Top 10) + 7 CVE detail rows |
| Flowcharts (attack-flow ordered lists) | 2 (LLM-Agent wiping, AI vuln discovery) |
| stat-num / stat-box | 4 (hero meta, not real data) |

## CRITICAL Risk: Cross-Article Reference Leakage
**2 occurrences** of the same `ref-lines` boilerplate:
1. Line 914: at top of Section 8 References intro
2. Line 1183: at bottom of footer

Both contain the standard TLP:CLEAR / IOC / MITRE / Breakout Time strings. **Lower volume than other articles but still present.** The article claims to be "v5 STRICT" and "Zero Hallucination" — the presence of these leaked lines is **inconsistent with the declared policy**.

## Major Risk Areas (this is the most claim-heavy article)

### A. CVE ID Validity (HIGHEST PRIORITY)
**8 CVE IDs cited in 5.6 + Section 2:**
- CVE-2025-11201 (MLflow RCE, 9.8 CVSS, 2025-10) — line 312, 316, 728, 930
- CVE-2026-44428 (MCP Registry OIDC) — line 321, 325, 729, 937
- CVE-2026-31431, CVE-2026-43284, CVE-2026-43500 (AI worm "实测" CVEs) — lines 730-732
- CVE-2026-39987 (Marimo Notebook RCE) — line 733, 1146
- CVE-2026-25253 (OpenClaw credential theft) — line 734, 1154
- CVE-2025-32711 (EchoLeak DLP data exfil) — line 413, 735, 977

**All 8 should be verified in NVD** — the 2026 CVE IDs (44428, 31431, 43284, 43500, 39987, 25253) are the highest risk as they may not exist.

**Note:** the disclaimer explicitly says "CVE-2025-49990 (描述与NAS固件不符，已更正)" — so the author is aware of CVE fabrication risk. The remaining 8 are presented as real.

### B. arXiv ID Verification
12+ arXiv papers cited. The 2606.xxxx range papers are most suspect:
- arXiv:2606.03811 (AI Agents Enable Adaptive Computer Worms, Toronto/CleverHans) — line 530, 1058
- arXiv:2604.08407 (Your Agent Is Mine, CCS 2026) — line 408, 539, 970
- arXiv:2603.09044 (CogniCrypt) — line 548, 1067
- arXiv:2509.06703 (On the (In)Security of Loading ML Models) — line 333, 519, 944
- arXiv:2511.05797 (Prompt Injection Risks in Third-Party AI Chatbot Plugins, IEEE S&P 2026) — line 593, 1106
- arXiv:2507.02057 (MGC: Compositional Blindness) — line 557, 1075
- Plus USENIX Security '25 references [21][22][23] and '26 cycle 1 references [25]

**The headline claim "AI Agents Enable Adaptive Computer Worms 73.8% / 61.8%"** (line 530) is presented as "实测验证" with authors from Toronto/CleverHans Lab (Guan, Blanchard, Foerster, Jia, Huang, Papernot) — **Papernot is a real prominent ML security researcher**, but verify this paper actually exists.

### C. "Removed" List Honesty Check
Lines 230-231 declare removed items:
- "Poison Once/Exploit Forever" — verify this is a real security concept that exists somewhere
- "Contextual Agentic Memory" — verify
- "Provably Secure RAG" / "Privacy-Aware RAG" / "MAIF" — verify these are real research terms
- "NDSS 'The Philosopher's Stone'" — verify NDSS 2025/2026 actually had this paper
- "LiteLLM供应链攻击" — LiteLLM is real, but is there a verified supply chain attack?
- "CVE-2025-49990 (描述与NAS固件不符)" — CVE exists but description mismatch is plausible

**This is an unusual and useful pattern** — the article documents its own removals, which can be used to validate methodology.

### D. Vendor / CVE-Specific Risks
- **Hugging Face "Model Namespace Reuse" (2025-09)** (line 303) — real research from Unit 42, verifiable
- **MLflow "CVE-2025-11201 CVSS 9.8" (2025-10)** (line 317) — needs NVD check
- **Keras / Skops "6× Zero-Day CVEs" (2025)** (line 333) — links to arXiv 2509.06703, verify
- **Google Sigstore Model Signing v1.0 (2025-04)** (line 341) — real initiative, verify
- **Microsoft / Azure AI Foundry "已修复" (2025-09)** (line 357) — same Unit 42 research

### E. Architecture / Diagram Risks
Section 1 (lines 234-287) has a North-South architecture diagram with 4 layers (North / Mid / South / DESTR) and 20+ attack types. The labels (e.g., "Storage Side-Channel", "Rowhammer/Bit-Flip", "Cold Boot Attack", "SSD Firmware Rootkit") are real attack classes but the **specific mappings** (e.g., "Rowhammer" → "GPU/内存攻击") need verification.

### F. Mandiant M-Trends Reference
Line 490: "Mandiant M-Trends 2026 报告指出，勒索软件组织开始利用LLM自动识别目标环境的存储架构" — verify against actual M-Trends 2026 publication.

### G. Defense Section (Section 7) Internal Consistency
Section 7.4 (lines 893-906) "攻防对照矩阵" maps attack stages to defenses. The attack→defense mappings are internally consistent. The "负责方" column (存储团队 / 安全团队 / MLOps团队) is plausible but has no external source.

## Sub-Sections to Prioritize for Verification (Agent B)
1. **Section 2 (威胁演进表)** — lines 290-422: 13 threat entries, all with CVE numbers or specific incidents
2. **Section 5.6 (2025-2026年存储系统关键CVE汇总)** — lines 721-738: 8 CVE rows, all need NVD check
3. **Section 4 (学术前沿)** — lines 504-625: 12 academic papers
4. **Section 6.1 (AI生成式恶意代码)** — lines 747-789: AI Worm paper [18] is the headline claim
5. **Section 8 (References)** — lines 912-1176: 32 references with full URLs — these are the most verifiable
6. **"Removed" list in disclaimer** (lines 230-231): verify each "removed" item is a real concept

## Severity Summary
- **CRITICAL:** Cross-article `ref-lines` template leak (2 occurrences) — inconsistent with declared "Zero Hallucination" policy
- **CRITICAL:** 8 CVE IDs (especially 2026-prefix) need NVD verification — 6 of 8 are 2026 dates
- **HIGH:** AI Worm paper (arXiv:2606.03811, 73.8% / 61.8% figures) is a major claim requiring paper verification
- **HIGH:** Other 2026 arXiv papers (2606.11827, 2606.12011, 2606.11871, 2606.11878, 2606.11839, 2606.11736) need existence check
- **MEDIUM:** USENIX '26 cycle 1 papers (lines 600-622) — verify the cycle 1 accepted papers list
- **MEDIUM:** Unit 42 "Model Namespace Reuse" — link is real but the specific findings (Vertex AI / Azure AI Foundry RCE) need checking
- **LOW:** Internal architecture diagram and attack-defense matrix (qualitative, internally consistent)
- **POSITIVE:** The "removed items" disclaimer shows genuine audit effort; 85 real URLs is a strong signal
