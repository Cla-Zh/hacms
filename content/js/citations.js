/* ═══════════════════════════════════════════════════
   Citations 自动渲染器
   读取 <ol.citations data-source="..."> 元素, 自动从
   JSON 文件加载引用列表并渲染
   数据格式:
     [{ "num": 1, "title": "...", "src": "...",
        "url": "https://...", "url_text": "...",
        "note": "(可选)" }, ...]
═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function renderList(ol, refs) {
    ol.innerHTML = '';
    refs.forEach(r => {
      const li = document.createElement('li');
      const body = document.createElement('div');
      body.className = 'cite-body';

      // 标题
      if (r.title) {
        const t = document.createElement('span');
        t.className = 'cite-title';
        t.textContent = r.title;
        body.appendChild(t);
      }

      // 来源 (源 — 年份)
      if (r.src) {
        const s = document.createElement('span');
        s.className = 'cite-src';
        s.textContent = ' — ' + r.src;
        body.appendChild(s);
      }

      // URL (如果有)
      if (r.url) {
        const a = document.createElement('a');
        a.className = 'cite-url';
        a.href = r.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = r.url_text || r.url;
        body.appendChild(a);
      }
      // 或纯备注 (无链接)
      else if (r.note) {
        const n = document.createElement('span');
        n.className = 'cite-note';
        n.textContent = r.note;
        body.appendChild(n);
      }

      // 编号
      const num = document.createElement('span');
      num.className = 'cite-num';
      num.textContent = '[' + (r.num != null ? r.num : '?') + ']';

      li.appendChild(num);
      li.appendChild(body);
      // 如果有 anchor (如 poison-llm), 加到 li id 以便 #ref-xxx 跳转
      if (r.anchor) li.id = 'ref-' + r.anchor;
      ol.appendChild(li);
    });
  }

  async function init() {
    const lists = document.querySelectorAll('ol.citations[data-source]');
    for (const ol of lists) {
      const src = ol.getAttribute('data-source');
      if (!src) continue;
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const refs = await res.json();
        if (Array.isArray(refs)) {
          renderList(ol, refs);
        } else {
          throw new Error('JSON 不是数组');
        }
      } catch (e) {
        ol.innerHTML = '<li class="cite-error">⚠ 引用加载失败: ' + esc(e.message) + '</li>';
        console.warn('[citations]', src, e);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();