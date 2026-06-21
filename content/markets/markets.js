/* ═══════════════════════════════════════════════════════════════
   Global Investment Intelligence Platform
   JavaScript 引擎: 读取 markets.json, 渲染 16 模块 + 8 引擎
   ═══════════════════════════════════════════════════════════════ */

(async function () {
  'use strict';

  // ── 加载数据 ────────────────────────────────────────
  let DATA;
  try {
    const res = await fetch('./markets.json');
    DATA = await res.json();
  } catch (e) {
    document.body.innerHTML = `<div style="padding:40px;color:#ff4757;font-family:monospace;">
      <h1>❌ 数据加载失败</h1>
      <p>无法加载 markets.json: ${e.message}</p>
    </div>`;
    return;
  }

  // ── 工具函数 ────────────────────────────────────────
  const $ = sel => document.querySelector(sel);
  const $$ = sel => document.querySelectorAll(sel);
  const fmt = (n, dp = 2) => Number(n).toFixed(dp);
  const fmtPct = (n, dp = 1) => `${n > 0 ? '+' : ''}${fmt(n, dp)}%`;
  const fmtM = (n) => (n > 0 ? '+' : '') + Math.round(n);

  // 严重程度色
  const verdictColor = (v) => {
    const map = {
      '严重低估': '#00ffd4', '低估': '#00d4aa', '合理': '#a0aec0',
      '高估': '#ffa500', '泡沫': '#ff4757'
    };
    return map[v] || '#a0aec0';
  };

  const impactColor = (v) => {
    if (v.includes('灾难')) return '#ff4757';
    if (v.includes('极高')) return '#ff4757';
    if (v === '高') return '#ff6b7a';
    if (v === '中' || v === '中-中') return '#ffa500';
    if (v.includes('低')) return '#6b7a99';
    return '#a0aec0';
  };

  // ── 模块 1: 全球市场状态中心 ───────────────────────
  function renderRegime() {
    const r = DATA.regime_engine.current;
    const candidates = DATA.regime_engine.candidates
      .sort((a, b) => b.prob - a.prob).slice(0, 6);

    return `
      <div class="module module-regime">
        <div class="module-header">
          <div class="module-title">
            <span class="module-title-icon">🌐</span>
            <span>全球市场状态中心 · Market Regime Engine</span>
          </div>
          <div class="module-meta">${DATA.last_updated}</div>
        </div>
        <div class="module-body">
          <div class="regime-current">
            <div class="regime-state">${r.state}</div>
            <div class="regime-confidence">
              <span class="regime-confidence-label">信心度</span>
              <span class="regime-confidence-value">${(r.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div class="regime-progress">
            <div class="regime-progress-bar" style="width:${r.confidence * 100}%"></div>
          </div>
          <div style="font-size:10.5px;color:#6b7a99;margin-top:4px;">
            启动: ${r.started_at} · 预期持续 ${r.expected_duration_days} 天
            <br>历史参考: ${r.historical_reference}
          </div>
          <div style="font-size:10.5px;color:#a0aec0;margin-top:6px;">
            子信号: ${r.sub_signals.map(s => `<span style="color:#00d4aa">${s}</span>`).join(' · ')}
          </div>
          <div class="regime-candidates">
            ${candidates.map(c => `
              <div class="regime-candidate ${c.code === r.code ? 'current' : ''}">
                <span class="regime-candidate-name">${c.state}</span>
                <span class="regime-candidate-prob">${(c.prob * 100).toFixed(0)}%</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ── 模块 2: 全球资产热力图 ───────────────────────
  function renderHeatmap() {
    const assets = [
      { name: 'SPX', value: 5850, change: -0.5, type: '美股' },
      { name: 'NDX', value: 20150, change: -0.8, type: '美股' },
      { name: 'RUT', value: 2180, change: 0.3, type: '美股' },
      { name: 'DXY', value: 99.2, change: -0.2, type: '外汇' },
      { name: 'UST10Y', value: 4.35, change: 0.05, type: '债券' },
      { name: 'GOLD', value: 2420, change: 1.2, type: '商品' },
      { name: 'WTI', value: 78.5, change: 0.8, type: '商品' },
      { name: 'BTC', value: 98500, change: -1.5, type: '数字货币' },
      { name: 'CSI300', value: 3920, change: 0.6, type: 'A 股' },
      { name: 'HSI', value: 19800, change: 1.1, type: '港股' },
      { name: 'NKY', value: 39200, change: 0.4, type: '日股' },
      { name: 'DAX', value: 18500, change: 0.3, type: '欧股' },
    ];

    const heatClass = (c) => {
      if (c > 1) return 'strong-bull';
      if (c > 0.3) return 'bull';
      if (c > 0) return 'weak-bull';
      if (c > -0.3) return 'neutral';
      if (c > -1) return 'weak-bear';
      if (c > -1.5) return 'bear';
      return 'strong-bear';
    };

    return `
      <div class="module module-heatmap">
        <div class="module-header">
          <div class="module-title">
            <span class="module-title-icon">🔥</span>
            <span>全球资产热力图 · Global Heatmap</span>
          </div>
          <div class="module-meta">实时</div>
        </div>
        <div class="module-body">
          <div class="heatmap-grid">
            ${assets.map(a => `
              <div class="heatmap-cell ${heatClass(a.change)}" title="${a.name} ${a.value} (${fmtPct(a.change)})">
                <div class="heatmap-name">${a.name}</div>
                <div class="heatmap-value">${a.value.toLocaleString()}</div>
                <div class="heatmap-change">${fmtPct(a.change)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ── 模块 3: 全球资金流向地图 ─────────────────────
  function renderFlows() {
    const flows = DATA.etf_flows.flows_1w;
    return `
      <div class="module module-flows">
        <div class="module-header">
          <div class="module-title">
            <span class="module-title-icon">💰</span>
            <span>ETF 资金流向 · ETF Flow Engine</span>
          </div>
          <div class="module-meta">1 周</div>
        </div>
        <div class="module-body">
          <table class="flow-table">
            <thead>
              <tr>
                <th>代码</th><th>名称</th>
                <th class="num">净流入 (M)</th>
                <th class="num">AUM (B)</th>
                <th class="num">YTD</th>
              </tr>
            </thead>
            <tbody>
              ${flows.slice(0, 12).map(f => `
                <tr>
                  <td><strong>${f.ticker}</strong></td>
                  <td>${f.name}</td>
                  <td class="num ${f.net_flow_1w_m >= 0 ? 'pos' : 'neg'}">
                    ${f.net_flow_1w_m >= 0 ? '+' : ''}${f.net_flow_1w_m.toLocaleString()}
                  </td>
                  <td class="num">${f.aum_b}</td>
                  <td class="num ${f.ytd_return >= 0 ? 'pos' : 'neg'}">${fmtPct(f.ytd_return)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ── 模块 4: 行业轮动仪表盘 ─────────────────────
  function renderRotation() {
    const sectors = DATA.sector_rotation.performance
      .sort((a, b) => b.rotation_score - a.rotation_score);
    return `
      <div class="module module-rotation">
        <div class="module-header">
          <div class="module-title">
            <span class="module-title-icon">🔄</span>
            <span>行业轮动仪表盘 · Sector Rotation Engine</span>
          </div>
          <div class="module-meta">${DATA.sector_rotation.as_of}</div>
        </div>
        <div class="module-body">
          <div style="font-size:10.5px;color:#6b7a99;margin-bottom:6px;">
            轮动路径: <span style="color:#00d4aa">${DATA.sector_rotation.rotation_path}</span>
            <br>轮动速度: ${DATA.sector_rotation.rotation_speed} · 30 天轮动概率: <strong style="color:#00d4aa">${DATA.sector_rotation.rotation_probability_next_30d}</strong>
          </div>
          <div class="rotation-grid">
            ${sectors.map(s => `
              <div class="rotation-cell ${s.perf_30d > 5 ? 'accelerate' : (s.perf_30d > 0 ? 'up' : 'down')}">
                <div class="rotation-name">${s.sector}</div>
                <div class="rotation-perf ${s.perf_30d < 0 ? 'down' : ''}">${fmtPct(s.perf_30d)}</div>
                <div class="rotation-score">30D · 90D ${fmtPct(s.perf_90d)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ── 模块 5: 聪明资金追踪 ─────────────────────
  function renderSmartMoney() {
    const inc = DATA.smart_money.summary.institutions_increasing;
    const dec = DATA.smart_money.summary.institutions_decreasing;
    const sigs = DATA.insider_tracking.high_credibility_signals;
    return `
      <div class="module module-smart-money">
        <div class="module-header">
          <div class="module-title">
            <span class="module-title-icon">🐋</span>
            <span>聪明资金追踪 · Smart Money Engine</span>
          </div>
          <div class="module-meta">13F + 内部人</div>
        </div>
        <div class="module-body">
          <div style="margin-bottom:8px;">
            <div style="font-size:10px;color:#00d4aa;font-weight:600;margin-bottom:4px;">↑ 机构增持方向</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;">
              ${inc.map(s => `<span style="background:#003830;color:#00ffd4;padding:2px 6px;border-radius:8px;font-size:10px;">${s}</span>`).join('')}
            </div>
          </div>
          <div style="margin-bottom:8px;">
            <div style="font-size:10px;color:#ff4757;font-weight:600;margin-bottom:4px;">↓ 机构减持方向</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;">
              ${dec.map(s => `<span style="background:#3a0a0a;color:#ff6b7a;padding:2px 6px;border-radius:8px;font-size:10px;">${s}</span>`).join('')}
            </div>
          </div>
          <div style="font-size:10px;color:#6b7a99;margin-top:8px;border-top:1px solid #1f2a4a;padding-top:6px;">
            <strong style="color:#a0aec0">CEO 高可信度信号</strong>
          </div>
          <div class="signal-list" style="margin-top:4px;">
            ${sigs.map(s => `
              <div class="signal-row ${s.action === '增持' ? 'bull' : 'bear'}">
                <div>
                  <div class="signal-ticker">${s.ticker} · ${s.insider.split(' (')[0]}</div>
                  <div class="signal-desc">${s.rationale.substring(0, 50)}...</div>
                </div>
                <div style="text-align:right;">
                  <div class="signal-action">${s.action} $${s.amount_m}M</div>
                  <div class="signal-action" style="color:${s.signal_strength === '强' ? '#00d4aa' : '#ffa500'}">信号: ${s.signal_strength}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ── 模块 6: 期权异动监控 ─────────────────────
  function renderOptions() {
    const acts = DATA.options_flow.unusual_activity;
    const gamma = DATA.options_flow.gamma_summary;
    return `
      <div class="module module-options">
        <div class="module-header">
          <div class="module-title">
            <span class="module-title-icon">📞</span>
            <span>期权异动监控 · Options Flow Engine</span>
          </div>
          <div class="module-meta">${DATA.options_flow.as_of}</div>
        </div>
        <div class="module-body">
          <div style="font-size:10.5px;color:#6b7a99;margin-bottom:8px;padding:6px;background:#0d1424;border-radius:4px;">
            <strong style="color:#06b6d4">Gamma 摘要:</strong> ${gamma.spy_gex} · QQQ ${gamma.qqq_gex}
            <br>${gamma.nq_1000_gamma_flip}
          </div>
          <div class="signal-list">
            ${acts.map(a => `
              <div class="signal-row ${a.type === 'Call' ? 'bull' : 'bear'}">
                <div>
                  <div class="signal-ticker">${a.ticker} ${a.type} $${a.strike}</div>
                  <div class="signal-desc">${a.sentiment.substring(0, 60)}...</div>
                </div>
                <div style="text-align:right;">
                  <div class="signal-action">${a.size.toLocaleString()} 张</div>
                  <div class="signal-action" style="color:#a0aec0">$${a.premium_m}M · ${a.expiry}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ── 模块 7: 内部人追踪 (汇总) ─────────────────
  function renderInsider() {
    return `
      <div class="module module-insider">
        <div class="module-header">
          <div class="module-title">
            <span class="module-title-icon">🎯</span>
            <span>内部人追踪 · Insider Tracking Engine</span>
          </div>
          <div class="module-meta">Form 4</div>
        </div>
        <div class="module-body">
          <div style="font-size:11px;color:#a0aec0;margin-bottom:8px;">
            <strong style="color:#00d4aa">高可信度信号统计</strong>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
            <div style="background:#0d1424;padding:10px;border-radius:6px;text-align:center;">
              <div style="font-size:24px;font-weight:700;color:#00d4aa;font-family:var(--font-num);">$290M</div>
              <div style="font-size:10px;color:#6b7a99;">本周内部人净买入</div>
            </div>
            <div style="background:#0d1424;padding:10px;border-radius:6px;text-align:center;">
              <div style="font-size:24px;font-weight:700;color:#ff4757;font-family:var(--font-num);">$27M</div>
              <div style="font-size:10px;color:#6b7a99;">本周内部人净卖出</div>
            </div>
          </div>
          <div style="font-size:10.5px;color:#6b7a99;line-height:1.5;padding:8px;background:#0d1424;border-radius:4px;">
            <strong style="color:#a0aec0">策略意义</strong>: CEO 增持历史胜率 85%, Zuck (META) 250M 是顶级信号
            <br>META/NVDA/ORCL 增持 = 内部人对 AI/基础设施长期看多
            <br>AAPL Tim Cook 减持是 10b5-1 计划, 解读需谨慎
          </div>
        </div>
      </div>
    `;
  }

  // ── 模块 8: 黑天鹅预警 ─────────────────────
  function renderBlackSwan() {
    const swans = DATA.black_swan.monitoring
      .sort((a, b) => b.probability - a.probability);
    const icons = {
      '战争': '⚔️', '地缘冲突': '🌍', '金融危机': '💥', '房地产危机': '🏚️',
      '银行风险': '🏦', '债务风险': '💸', '主权违约': '🏛️', '极端天气': '🌪️',
      '重大技术突破': '🚀'
    };
    const icon = (e) => Object.entries(icons).find(([k]) => e.includes(k))?.[1] || '⚠️';

    return `
      <div class="module module-black-swan">
        <div class="module-header">
          <div class="module-title">
            <span class="module-title-icon">🦢</span>
            <span>黑天鹅预警中心 · Black Swan Engine</span>
          </div>
          <div class="module-meta">8 监控事件</div>
        </div>
        <div class="module-body">
          <div class="swan-grid">
            ${swans.map(s => `
              <div class="swan-row">
                <div class="swan-risk">${icon(s.event)}</div>
                <div class="swan-name">${s.event}</div>
                <div class="swan-impact" style="background:${impactColor(s.impact)};color:${s.impact.includes('低') ? '#a0aec0' : 'white'}">${s.impact}</div>
                <div class="swan-prob">${(s.probability * 100).toFixed(0)}%</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ── 模块 9/10/11: 机会池 ─────────────────────
  function renderOppPool(title, icon, moduleClass, data) {
    return `
      <div class="module ${moduleClass}">
        <div class="module-header">
          <div class="module-title">
            <span class="module-title-icon">${icon}</span>
            <span>${title}</span>
          </div>
          <div class="module-meta">${data.length} 个</div>
        </div>
        <div class="module-body">
          <div class="opp-list">
            ${data.map(o => `
              <div class="opp-row" title="${o.thesis}">
                <div>
                  <div class="opp-ticker">${o.ticker}</div>
                  <div class="opp-thesis">${o.name}</div>
                </div>
                <div class="opp-thesis" style="font-size:10px;">${o.thesis}</div>
                <div>
                  <div class="opp-score-value">${o.score}</div>
                  <div class="opp-grade ${o.grade}">${o.grade}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ── 模块 12: ETF 机会池 ─────────────────────
  function renderEtfPool() {
    return renderOppPool('ETF 机会池 · ETF Opportunity Pool', '📊', 'module-etf-pool', DATA.opportunities.ETF);
  }

  // ── 模块 13: 长期主题 ─────────────────────
  function renderLongThemes() {
    return `
      <div class="module module-long-themes">
        <div class="module-header">
          <div class="module-title">
            <span class="module-title-icon">🌍</span>
            <span>长期主题投资 (1/3/5 年) · Long Themes</span>
          </div>
          <div class="module-meta">${DATA.long_themes.length} 主题</div>
        </div>
        <div class="module-body">
          ${DATA.long_themes.map(t => `
            <div class="theme-row">
              <div>
                <div class="theme-name">${t.name}</div>
                <div class="theme-meta">期限: ${t.horizon} · 关键资产: ${t.key_assets}</div>
              </div>
              <div class="theme-grade ${t.grade}">${t.grade}级</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ── 模块 14: 投资委员会 (全宽) ─────────────
  function renderCommittee() {
    const c = DATA.investment_committee;
    const v = c.final_vote;
    const verdictClass = (vote) => {
      if (vote.includes('BULL') || vote.includes('LONG')) return 'bull';
      if (vote.includes('BEAR') || vote.includes('REDUCE')) return 'bear';
      return 'neutral';
    };

    return `
      <div class="module module-committee">
        <div class="module-header">
          <div class="module-title">
            <span class="module-title-icon">🏛️</span>
            <span>AI 投资委员会 · Investment Committee (5 CIO 投票)</span>
          </div>
          <div class="module-meta">${c.as_of}</div>
        </div>
        <div class="module-body">
          <div class="committee-grid">
            ${c.members.map(m => `
              <div class="cio-card">
                <div class="cio-role">${m.role}</div>
                <div class="cio-name">${m.name}</div>
                <div class="cio-vote ${verdictClass(m.vote)}">${m.vote}</div>
                <div class="cio-reasoning">${m.reasoning}</div>
              </div>
            `).join('')}
          </div>
          <div class="committee-verdict">
            <div class="verdict-label">最终裁决</div>
            <div class="verdict-text">${v.verdict}</div>
            <div class="verdict-score">${v.consensus_score} <span style="font-size:14px;color:#6b7a99;">/ 100</span></div>
            <div class="verdict-action">票数: 看多 ${v.cautious_bullish + v.strongly_bullish} · 中性 ${v.neutral} · 看空 ${v.cautious_bearish + v.strongly_bearish}</div>
            <div class="verdict-action" style="color:#00d4aa;margin-top:8px;font-weight:600;">📌 ${v.actionable}</div>
          </div>
        </div>
      </div>
    `;
  }

  // ── 模块 15: 90 天时间轴 (全宽) ─────────────
  function renderTimeline() {
    const t = DATA.timeline_90d;
    return `
      <div class="module module-timeline">
        <div class="module-header">
          <div class="module-title">
            <span class="module-title-icon">📅</span>
            <span>90 天时间轴 · 90-Day Timeline</span>
          </div>
          <div class="module-meta">${t.events.length} 关键节点</div>
        </div>
        <div class="module-body">
          <div class="timeline-rail">
            ${t.events.map(e => `
              <div class="timeline-node ${e.regime === 'RISK_ON' ? 'risk-on' : (e.regime === 'RISK_OFF' ? 'risk-off' : 'transition')}">
                <div class="timeline-date">${e.date.substring(5)}</div>
                <div class="timeline-event">${e.event}</div>
                <div class="timeline-scores">
                  <span class="timeline-risk">R:${e.risk_score}</span>
                  <span class="timeline-opp">O:${e.opportunity_score}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ── 模块 16: 历史演化 ─────────────────────
  function renderEvolution() {
    const e = DATA.historical_evolution.current_snapshot;
    return `
      <div class="module module-evolution">
        <div class="module-header">
          <div class="module-title">
            <span class="module-title-icon">📈</span>
            <span>历史趋势演化 · Historical Evolution</span>
          </div>
          <div class="module-meta">7D / 30D / 90D / 180D / 365D</div>
        </div>
        <div class="module-body">
          <div class="evo-periods">
            ${Object.entries(e).map(([period, data]) => `
              <div class="evo-period">
                <div class="evo-period-name">${period}</div>
                <div class="evo-period-score">${data.score}</div>
                <div class="evo-period-trend ${data.trend}">${data.trend === 'up' ? '↑ 上升' : data.trend === 'down' ? '↓ 下降' : '→ 中性'}</div>
                <div style="font-size:9px;color:#6b7a99;margin-top:2px;">${data.regime}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ── 叙事排行榜 ─────────────────────
  function renderNarrative() {
    return `
      <div class="module module-narrative">
        <div class="module-header">
          <div class="module-title">
            <span class="module-title-icon">📰</span>
            <span>市场叙事排行榜 · Top 20 Narrative</span>
          </div>
          <div class="module-meta">${DATA.narrative_ranking.as_of}</div>
        </div>
        <div class="module-body">
          <div class="narrative-list">
            ${DATA.narrative_ranking.top20.map(n => `
              <div class="narrative-row">
                <div class="narrative-rank">#${n.rank}</div>
                <div class="narrative-name">${n.name}</div>
                <div class="narrative-score">${n.score}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ── 流动性引擎 ─────────────────────
  function renderLiquidity() {
    const l = DATA.liquidity_engine;
    return `
      <div class="module module-liquidity">
        <div class="module-header">
          <div class="module-title">
            <span class="module-title-icon">💧</span>
            <span>全球流动性引擎 · Global Liquidity Engine</span>
          </div>
          <div class="module-meta">${l.verdict.state}</div>
        </div>
        <div class="module-body">
          <div class="liquidity-grid">
            <div class="liquidity-cell">
              <div class="liquidity-label">美联储资产负债表</div>
              <div class="liquidity-value">$${l.fed_balance_sheet.value} T</div>
              <div class="liquidity-change neg">1M ${fmtM(l.fed_balance_sheet.change_1m)}% · 3M ${fmtM(l.fed_balance_sheet.change_3m)}%</div>
            </div>
            <div class="liquidity-cell">
              <div class="liquidity-label">逆回购 (RRP)</div>
              <div class="liquidity-value">$${l.reverse_repo.value} B</div>
              <div class="liquidity-change neg">1M ${fmtM(l.reverse_repo.change_1m)} · 3M ${fmtM(l.reverse_repo.change_3m)}</div>
            </div>
            <div class="liquidity-cell">
              <div class="liquidity-label">财政部 TGA</div>
              <div class="liquidity-value">$${l.tga.value} B</div>
              <div class="liquidity-change pos">1M +${l.tga.change_1m} · 3M +${l.tga.change_3m}</div>
            </div>
            <div class="liquidity-cell">
              <div class="liquidity-label">M2 货币供应</div>
              <div class="liquidity-value">$${l.m2.value} T</div>
              <div class="liquidity-change">YoY ${fmtPct(l.m2.yoy_pct)}</div>
            </div>
          </div>
          <div style="margin-top:8px;padding:8px;background:#0d1424;border-radius:4px;font-size:10.5px;color:#a0aec0;">
            <strong style="color:#06b6d4">裁决</strong>: <span style="color:#ff4757;font-weight:600;">${l.verdict.state}</span> (信心度 ${(l.verdict.confidence * 100).toFixed(0)}%)
            <br><span style="color:#6b7a99;">${l.verdict.phase}</span>
          </div>
        </div>
      </div>
    `;
  }

  // ── 估值表 ─────────────────────
  function renderValuation() {
    return `
      <div class="module module-valuation">
        <div class="module-header">
          <div class="module-title">
            <span class="module-title-icon">📐</span>
            <span>估值引擎 · Valuation Engine</span>
          </div>
          <div class="module-meta">${DATA.valuation_engine.as_of}</div>
        </div>
        <div class="module-body">
          <table class="valuation-table">
            <thead>
              <tr>
                <th>指数</th><th>PE Fwd</th><th>PE TTM</th><th>PB</th>
                <th>PS</th><th>PEG</th><th>FCF%</th><th>Z-Score</th><th>估值</th>
              </tr>
            </thead>
            <tbody>
              ${DATA.valuation_engine.indices.map(v => `
                <tr>
                  <td>${v.name}</td>
                  <td>${v.pe_fwd}</td>
                  <td>${v.pe_ttm}</td>
                  <td>${v.pb}</td>
                  <td>${v.ps}</td>
                  <td>${v.peg}</td>
                  <td>${v.fcf_yield}</td>
                  <td style="color:${v.z_score > 1.5 ? '#ff4757' : (v.z_score < -1 ? '#00d4aa' : '#a0aec0')};font-weight:700;">${v.z_score > 0 ? '+' : ''}${v.z_score}</td>
                  <td class="verdict-${v.verdict}">${v.verdict}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ── AI Debate ─────────────────────
  function renderDebate() {
    const d = DATA.ai_debate;
    return `
      <div class="module module-debate">
        <div class="module-header">
          <div class="module-title">
            <span class="module-title-icon">⚖️</span>
            <span>AI 多空辩论 · AI Debate Engine</span>
          </div>
          <div class="module-meta">${d.topic}</div>
        </div>
        <div class="module-body">
          <div class="debate-grid">
            <div class="debate-side">
              <div class="debate-agent">${d.bull_case.agent}</div>
              <div class="debate-thesis">${d.bull_case.thesis}</div>
              <ul class="debate-points">
                ${d.bull_case.key_points.map(p => `<li>${p}</li>`).join('')}
              </ul>
              <div class="debate-data">📊 ${d.bull_case.key_data}</div>
            </div>
            <div class="debate-side bear">
              <div class="debate-agent">${d.bear_case.agent}</div>
              <div class="debate-thesis">${d.bear_case.thesis}</div>
              <ul class="debate-points">
                ${d.bear_case.key_points.map(p => `<li>${p}</li>`).join('')}
              </ul>
              <div class="debate-data">📊 ${d.bear_case.key_data}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ── 顶栏 ticker ─────────────────────
  function renderTopbarTickers() {
    const tickers = [
      { name: 'SPX', value: '5,850', change: '-0.5%' },
      { name: 'NDX', value: '20,150', change: '-0.8%' },
      { name: 'GOLD', value: '2,420', change: '+1.2%' },
      { name: 'WTI', value: '78.5', change: '+0.8%' },
      { name: 'BTC', value: '98,500', change: '-1.5%' },
      { name: 'DXY', value: '99.2', change: '-0.2%' },
      { name: 'UST10Y', value: '4.35%', change: '+0.05' },
      { name: 'VIX', value: '18.5', change: '+2.1%' },
    ];
    return tickers.map(t => `
      <div class="ticker-item">
        <span class="ticker-name">${t.name}</span>
        <span class="ticker-value">${t.value}</span>
        <span class="ticker-change ${t.change.startsWith('+') ? 'up' : (t.change.startsWith('-') ? 'down' : '')}">${t.change}</span>
      </div>
    `).join('');
  }

  // ── 渲染所有模块 ─────────────────────
  function render() {
    document.getElementById('markets-ticker-bar').innerHTML = renderTopbarTickers();
    document.getElementById('markets-main').innerHTML = `
      ${renderRegime()}
      ${renderHeatmap()}
      ${renderLiquidity()}
      ${renderNarrative()}
      ${renderFlows()}
      ${renderRotation()}
      ${renderSmartMoney()}
      ${renderOptions()}
      ${renderInsider()}
      ${renderBlackSwan()}
      ${renderOppPool('A 股机会池 · A-Shares', '🇨🇳', 'module-a-shares', DATA.opportunities.A股)}
      ${renderOppPool('港股机会池 · HK-Shares', '🇭🇰', 'module-hk-shares', DATA.opportunities.港股)}
      ${renderOppPool('美股机会池 · US-Shares', '🇺🇸', 'module-us-shares', DATA.opportunities.美股)}
      ${renderEtfPool()}
      ${renderLongThemes()}
      ${renderCommittee()}
      ${renderTimeline()}
      ${renderEvolution()}
      ${renderValuation()}
      ${renderDebate()}
    `;
    document.getElementById('markets-time').textContent =
      `${DATA.last_updated} · ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} 更新`;
  }

  render();
})();