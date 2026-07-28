/* ============================================================
   learn-shared.js · XML 持久化 + 软链同步 (v1)
   功能:
   1. localStorage 读写 (主存储, 即时)
   2. XML 序列化/反序列化
   3. fetch 从 data/ 软链目录加载 XML (服务器模式下可用)
   4. 导出 XML 按钮 (下载到本地, 用户可手动 cp 到 hermes_data)
   ============================================================ */

window.LearnData = (() => {
  'use strict';

  // ── XML 工具 ──────────────────────────────────────
  function escapeXml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function xmlHeader() {
    return '<?xml version="1.0" encoding="UTF-8"?>\n';
  }

  // ── 字表 XML ──────────────────────────────────────
  function wordsToXml(words, meta = {}) {
    const now = new Date().toISOString();
    let xml = xmlHeader();
    xml += `<word-list version="1" count="${words.length}" savedAt="${escapeXml(now)}"`;
    if (meta.source) xml += ` source="${escapeXml(meta.source)}"`;
    xml += '>\n';
    words.forEach((w, i) => {
      xml += `  <word index="${i + 1}">${escapeXml(w)}</word>\n`;
    });
    xml += '</word-list>\n';
    return xml;
  }

  function xmlToWords(xmlText) {
    if (!xmlText) return null;
    const m = xmlText.match(/<word-list[^>]*>([\s\S]*)<\/word-list>/);
    if (!m) return null;
    const words = [];
    const re = /<word[^>]*>([^<]+)<\/word>/g;
    let mm;
    while ((mm = re.exec(m[1])) !== null) {
      words.push(mm[1].trim());
    }
    return words;
  }

  // ── 答题记录 XML ──────────────────────────────────────
  function historyToXml(records, meta = {}) {
    const now = new Date().toISOString();
    let xml = xmlHeader();
    xml += `<history version="1" count="${records.length}" exportedAt="${escapeXml(now)}">\n`;
    records.forEach(r => {
      xml += '  <record>\n';
      xml += `    <ts>${escapeXml(r.tsISO || new Date(r.ts).toISOString())}</ts>\n`;
      xml += `    <level>${escapeXml(r.level || '?')}</level>\n`;
      xml += `    <levelMax>${r.levelMax || 0}</levelMax>\n`;
      xml += `    <correct>${r.correct || 0}</correct>\n`;
      xml += `    <wrong>${r.wrong || 0}</wrong>\n`;
      xml += `    <total>${r.total || 0}</total>\n`;
      xml += `    <elapsedMs>${r.elapsedMs || 0}</elapsedMs>\n`;
      xml += `    <elapsedStr>${escapeXml(r.elapsedStr || '')}</elapsedStr>\n`;
      if (r.pass !== undefined) xml += `    <pass>${r.pass ? 1 : 0}</pass>\n`;
      if (r.poolSize !== undefined) xml += `    <poolSize>${r.poolSize}</poolSize>\n`;
      xml += '  </record>\n';
    });
    xml += '</history>\n';
    return xml;
  }

  function xmlToHistory(xmlText) {
    if (!xmlText) return null;
    const m = xmlText.match(/<history[^>]*>([\s\S]*)<\/history>/);
    if (!m) return null;
    const records = [];
    const re = /<record>([\s\S]*?)<\/record>/g;
    let mm;
    while ((mm = re.exec(m[1])) !== null) {
      const rec = {};
      const get = (tag) => {
        const t = new RegExp(`<${tag}>([^<]*)</${tag}>`);
        const x = t.exec(mm[1]);
        return x ? x[1] : null;
      };
      rec.ts = new Date(get('ts') || Date.now()).getTime();
      rec.tsISO = get('ts');
      rec.level = get('level');
      rec.levelMax = parseInt(get('levelMax') || '0', 10);
      rec.correct = parseInt(get('correct') || '0', 10);
      rec.wrong = parseInt(get('wrong') || '0', 10);
      rec.total = parseInt(get('total') || '0', 10);
      rec.elapsedMs = parseInt(get('elapsedMs') || '0', 10);
      rec.elapsedStr = get('elapsedStr') || '';
      const passStr = get('pass');
      if (passStr !== null) rec.pass = passStr === '1';
      const poolStr = get('poolSize');
      if (poolStr !== null) rec.poolSize = parseInt(poolStr, 10);
      records.push(rec);
    }
    return records;
  }

  // ── 下载 XML ──────────────────────────────────────
  function downloadXml(filename, content) {
    const blob = new Blob([content], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  // ── 读取 XML 文件 (用户选择本地文件) ──────────────────────────────────────
  function readXmlFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file, 'utf-8');
    });
  }

  // ── 软链目录 fetch 加载 (需要 http 协议, file:// 不行) ──────────────
  async function fetchFromDataDir(filename) {
    try {
      const r = await fetch(`data/${filename}?t=${Date.now()}`);
      if (r.ok) return await r.text();
    } catch (e) { /* file:// 或 404 静默 */ }
    return null;
  }

  // ── localStorage 包装 (主存储) ──────────────────────
  function lsGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, val); } catch (e) { /* 容量满 */ }
  }
  function lsDel(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  }

  return {
    escapeXml, xmlHeader,
    wordsToXml, xmlToWords,
    historyToXml, xmlToHistory,
    downloadXml, readXmlFile,
    fetchFromDataDir,
    lsGet, lsSet, lsDel,
  };
})();
