/* ============================================================
   算术题乐园 · 答题记录渲染 (index.html)
   功能: 读取 localStorage hacms_arith_history_v1
        + 显示总统计 + 最近 20 条记录
        + 清空记录按钮
   ============================================================ */

(() => {
  'use strict';

  const HISTORY_KEY = 'hacms_arith_history_v1';
  const DISPLAY_MAX = 20;  // 首页只显示最近 20 条

  const $ = (id) => document.getElementById(id);
  const dom = {
    stats:  $('historyStats'),
    list:   $('historyList'),
    clear:  $('btnClearHistory'),
  };

  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      console.warn('load history failed', e);
      return [];
    }
  }

  function render() {
    const arr = loadHistory();
    renderStats(arr);
    renderList(arr);
    bindClear(); bindExportImport();
  }

  function renderStats(arr) {
    if (arr.length === 0) {
      dom.stats.innerHTML = `
        <div class="arith-empty">
          <div class="arith-empty-emoji">📭</div>
          <div class="arith-empty-text">还没有答题记录, 选个难度开始吧!</div>
        </div>
      `;
      return;
    }
    const totalRounds = arr.length;
    const totalCorrect = arr.reduce((s, r) => s + (r.correct || 0), 0);
    const totalWrong = arr.reduce((s, r) => s + (r.wrong || 0), 0);
    const totalMs = arr.reduce((s, r) => s + (r.elapsedMs || 0), 0);
    const passCount = arr.filter(r => r.pass).length;
    const passRate = ((passCount / totalRounds) * 100).toFixed(0);
    const avgMs = totalMs / totalRounds;
    const avgSecPerQ = (totalMs / 1000) / Math.max(1, totalCorrect + totalWrong);
    const fmt = (ms) => {
      const s = Math.floor(ms / 1000);
      const m = Math.floor(s / 60);
      const ss = s % 60;
      return `${m}分${String(ss).padStart(2, '0')}秒`;
    };
    dom.stats.innerHTML = `
      <div class="arith-stat-card">
        <div class="arith-stat-num">${totalRounds}</div>
        <div class="arith-stat-label">总轮次</div>
      </div>
      <div class="arith-stat-card">
        <div class="arith-stat-num">${totalCorrect}</div>
        <div class="arith-stat-label">总答对</div>
      </div>
      <div class="arith-stat-card">
        <div class="arith-stat-num">${passRate}%</div>
        <div class="arith-stat-label">过关率</div>
      </div>
      <div class="arith-stat-card">
        <div class="arith-stat-num">${fmt(totalMs)}</div>
        <div class="arith-stat-label">总用时</div>
      </div>
      <div class="arith-stat-card">
        <div class="arith-stat-num">${avgSecPerQ.toFixed(1)}s</div>
        <div class="arith-stat-label">平均每题</div>
      </div>
    `;
  }

  function renderList(arr) {
    if (arr.length === 0) {
      dom.list.innerHTML = '';
      return;
    }
    const list = arr.slice(0, DISPLAY_MAX);
    const fmtTime = (ms) => {
      const s = Math.floor(ms / 1000);
      const m = Math.floor(s / 60);
      const ss = s % 60;
      return `${m}:${String(ss).padStart(2, '0')}`;
    };
    const fmtDate = (iso) => {
      const d = new Date(iso);
      const y = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      const h = String(d.getHours()).padStart(2, '0');
      const mi = String(d.getMinutes()).padStart(2, '0');
      return `${y}-${mo}-${da} ${h}:${mi}`;
    };
    const rows = list.map(r => {
      const tag = r.pass ? 'pass' : 'fail';
      const tagText = r.pass ? '🎉 过关' : '💪 加油';
      return `
        <tr class="arith-history-row arith-tag-${tag}">
          <td class="arith-col-time">${fmtDate(r.tsISO || new Date(r.ts).toISOString())}</td>
          <td class="arith-col-level">${r.level || '?'}</td>
          <td class="arith-col-correct"><b style="color:${r.pass ? 'var(--c-green)' : 'var(--c-red)'}">${r.correct}</b> / ${r.total || 10}</td>
          <td class="arith-col-wrong">${r.wrong || 0}</td>
          <td class="arith-col-elapsed">⏱️ ${fmtTime(r.elapsedMs || 0)}</td>
          <td class="arith-col-tag"><span class="arith-tag-pill arith-tag-${tag}">${tagText}</span></td>
        </tr>
      `;
    }).join('');
    dom.list.innerHTML = `
      <table class="arith-history-table">
        <thead>
          <tr>
            <th>📅 何时</th>
            <th>🎯 难度</th>
            <th>✅ 对/总</th>
            <th>❌ 错</th>
            <th>⏱️ 用时</th>
            <th>🏷️ 结果</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      ${arr.length > DISPLAY_MAX ? `<p class="arith-history-more">还有 ${arr.length - DISPLAY_MAX} 条更早的记录, 共 ${arr.length} 条</p>` : ''}
    `;
  }

  function bindClear() {
    if (!dom.clear) return;
    dom.clear.addEventListener('click', () => {
      if (!confirm('确定要清空所有答题记录吗? 此操作不可恢复。')) return;
      try {
        localStorage.removeItem(HISTORY_KEY);
        if (window.LearnData) LearnData.lsDel(HISTORY_KEY + '_xml');
        render();
      } catch (e) {
        alert('清空失败: ' + e.message);
      }
    });
  }

  function bindExportImport() {
    const exportBtn = $('btnExportXml');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const arr = loadHistory();
        if (arr.length === 0) { alert('没有记录可导出'); return; }
        const xml = LearnData.historyToXml(arr, { source: 'arithmetic-home-export' });
        const ts = new Date().toISOString().slice(0, 10);
        LearnData.downloadXml(`arithmetic-history-${ts}.xml`, xml);
        // 同时保存 XML 备份到 localStorage
        LearnData.lsSet(HISTORY_KEY + '_xml', xml);
        alert(`✅ 已导出 ${arr.length} 条记录为 XML 文件。\n\n提示: 将下载的 XML 文件保存到:\n  /mnt/g/hermes_data/learn-data/arithmetic/\n即可跨设备/浏览器共享。`);
      });
    }
    const importInput = $('importXmlInput');
    if (importInput) {
      importInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const xml = await LearnData.readXmlFile(file);
          const arr = LearnData.xmlToHistory(xml);
          if (!arr) { alert('XML 解析失败, 请检查格式'); return; }
          if (!confirm(`导入 ${arr.length} 条记录?\n(会与现有记录合并, 按时间排序)`)) return;
          const existing = loadHistory();
          // 合并去重 (按 ts)
          const map = new Map();
          [...arr, ...existing].forEach(r => map.set(r.ts, r));
          const merged = Array.from(map.values()).sort((a, b) => b.ts - a.ts).slice(0, 100);
          LearnData.lsSet(HISTORY_KEY, JSON.stringify(merged));
          LearnData.lsSet(HISTORY_KEY + '_xml', LearnData.historyToXml(merged));
          render();
          alert(`✅ 导入成功! 当前共 ${merged.length} 条记录`);
        } catch (err) {
          alert('导入失败: ' + err.message);
        }
        importInput.value = '';
      });
    }
  }

  // 跨 tab 同步: storage 事件触发时刷新
  window.addEventListener('storage', (e) => {
    if (e.key === HISTORY_KEY) render();
  });

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }

})();
