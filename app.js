/**
 * app.js — AAM-CMS v2 前端核心路由、模糊搜索与附件渲染逻辑
 * 状态机：HOME（主页列表） <-> READER（文章框架 Iframe）
 */

(function () {
  'use strict';

  // ── 全局状态 ──────────────────────────────────────────────────────
  const STATE = {
    mode: 'HOME',        // 'HOME' | 'READER'
    sidebarOpen: false,
    articles: [],        // 从 manifest.json 加载的原始数据
    filtered: [],       // 经过滤后的展示数据
    activeCategory: null,
    activeTags: [],
    searchQuery: '',
    prevHomeScroll: 0,  // 离开主页时的滚动位置
  };

  // ── DOM 引用 ──────────────────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    appShell:      $('#app-shell'),
    sidebar:       $('#sidebar'),
    sidebarOverlay: $('#sidebar-overlay'),
    sidebarClose:  $('#sidebar-close'),
    menuToggle:     $('#menu-toggle'),
    categoryList:  $('#category-list'),
    tagCloud:      $('#tag-cloud'),
    topBar:        $('#top-bar'),
    searchInput:   $('#search-input'),
    articleCount:  $('#article-count'),
    articleList:   $('#article-list'),
    readerFrame:   $('#reader-frame'),
    readerBar:     $('#reader-bar'),
    btnBack:       $('#btn-back'),
    readerTitle:   $('#reader-title'),
    readerMeta:    $('#reader-meta'),
    readerAttach:  $('#reader-attachments'),
    iframeWrap:    $('#iframe-wrap'),
    contentIframe: $('#content-iframe'),
    noHtmlNotice:  $('#no-html-notice'),
  };

  // ── 工具函数 ──────────────────────────────────────────────────────
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  };

  const formatIcon = (fmt) => {
    const icons = { docx:'Word', doc:'Word', pptx:'PPT', ppt:'PPT', pdf:'PDF', xlsx:'Excel', xls:'Excel' };
    return icons[fmt] || fmt.toUpperCase();
  };

  // 判断是否为 Word 文档格式
  const isWordDoc = (fmt) => fmt === 'docx' || fmt === 'doc';

  // 获取在线查看 Word 的 URL（Office Online）
  const getWordViewerUrl = (docUrl) => {
    return 'https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURIComponent(docUrl);
  };

  // 模糊搜索：同时匹配 title / summary / tags
  const fuzzyMatch = (article, query) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      article.title.toLowerCase().includes(q) ||
      (article.summary || '').toLowerCase().includes(q) ||
      (article.tags || []).some(t => t.toLowerCase().includes(q))
    );
  };

  // ── 侧边栏（移动端） ─────────────────────────────────────────────
  function openSidebar() {
    STATE.sidebarOpen = true;
    dom.sidebar.classList.add('open');
    dom.sidebarOverlay.classList.remove('hidden');
    dom.sidebarOverlay.classList.add('visible');
  }

  function closeSidebar() {
    STATE.sidebarOpen = false;
    dom.sidebar.classList.remove('open');
    dom.sidebarOverlay.classList.add('hidden');
    dom.sidebarOverlay.classList.remove('visible');
  }

  // ── 核心渲染 ──────────────────────────────────────────────────────

  /** 渲染左侧分类目录 */
  function renderCategories() {
    dom.categoryList.innerHTML = '';

    // "全部" 项
    const allItem = el('li', 'cat-item');
    allItem.innerHTML = `<span class="cat-icon">📚</span> 全部文章`;
    allItem.dataset.cat = '';
    if (!STATE.activeCategory) allItem.classList.add('active');
    allItem.addEventListener('click', () => {
      STATE.activeCategory = null;
      renderCategories();
      applyFilters();
      closeSidebar();
    });
    dom.categoryList.appendChild(allItem);

    // 各分类项（动态从 manifest 提取，按指定顺序排列）
    const cats = [...new Set(STATE.articles.map(a => a.category).filter(Boolean))];
    const ORDER = ['洞察', 'AI 应用'];
    cats.sort((a, b) => {
      const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b);
      if (ia >= 0 && ib >= 0) return ia - ib;
      if (ia >= 0) return -1;
      if (ib >= 0) return 1;
      return a.localeCompare(b);
    });
    cats.forEach(cat => {
      if (!STATE.articles.some(a => a.category === cat)) return;
      const item = el('li', 'cat-item');
      item.innerHTML = `<span class="cat-icon">•</span> ${cat}`;
      item.dataset.cat = cat;
      if (STATE.activeCategory === cat) item.classList.add('active');
      item.addEventListener('click', () => {
        STATE.activeCategory = STATE.activeCategory === cat ? null : cat;
        renderCategories();
        applyFilters();
        closeSidebar();
      });
      dom.categoryList.appendChild(item);
    });
  }

  /** 渲染标签云 */
  function renderTagCloud() {
    dom.tagCloud.innerHTML = '';
    const tagCount = {};
    STATE.articles.forEach(a => (a.tags || []).forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; }));
    const sorted = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 30);
    sorted.forEach(([tag, count]) => {
      const btn = el('button', 'tag-btn');
      btn.textContent = tag;
      if (STATE.activeTags.includes(tag)) btn.classList.add('active');
      btn.title = `${count} 篇`;
      btn.addEventListener('click', () => {
        STATE.activeTags = STATE.activeTags.includes(tag)
          ? STATE.activeTags.filter(t => t !== tag)
          : [...STATE.activeTags, tag];
        renderTagCloud();
        applyFilters();
        closeSidebar();
      });
      dom.tagCloud.appendChild(btn);
    });
  }

  /** 渲染文章列表卡片 */
  function renderArticleList() {
    dom.articleList.innerHTML = '';

    if (STATE.filtered.length === 0) {
      dom.articleList.innerHTML = '<div class="empty-state">没有匹配的文章，请尝试调整筛选条件。</div>';
      dom.articleCount.textContent = '';
      return;
    }

    dom.articleCount.textContent = `${STATE.filtered.length} 篇文章`;

    STATE.filtered.forEach(article => {
      const card = el('div', 'article-card');
      card.dataset.id = article.id;

      // 卡片顶部：分类 + 日期
      const header = el('div', 'card-header');
      header.innerHTML = `
        <span class="card-cat">${article.category || '未分类'}</span>
        <span class="card-date">${article.date || ''}</span>
      `;

      // 标题
      const title = el('div', 'card-title');
      title.textContent = article.title;

      // 摘要
      const summary = el('div', 'card-summary');
      summary.textContent = article.summary || '';

      // 标签
      const tagsRow = el('div', 'card-tags');
      (article.tags || []).forEach(tag => {
        const tagEl = el('span', 'card-tag');
        tagEl.textContent = tag;
        tagsRow.appendChild(tagEl);
      });

      // 附件格式图标
      const attachRow = el('div', 'card-attach');
      if (article.html_path) {
        const badge = el('span', 'fmt-badge fmt-html');
        badge.textContent = 'HTML';
        attachRow.appendChild(badge);
      }
      (article.attachments || []).forEach(att => {
        const badge = el('span', `fmt-badge fmt-${att.format}`);
        badge.textContent = formatIcon(att.format);
        attachRow.appendChild(badge);
      });

      card.appendChild(header);
      card.appendChild(title);
      card.appendChild(summary);
      card.appendChild(tagsRow);
      card.appendChild(attachRow);

      card.addEventListener('click', () => openReader(article));
      dom.articleList.appendChild(card);
    });
  }

  /** 渲染文章阅读框架（Reader Frame）*/
  function openReader(article) {
    STATE.prevHomeScroll = window.scrollY;

    // 填充元数据
    dom.readerTitle.textContent = article.title;
    dom.readerMeta.innerHTML = `
      <span class="rmeta-cat">${article.category || '未分类'}</span>
      <span class="rmeta-sep">·</span>
      <span>${article.date || ''}</span>
      <span class="rmeta-sep">·</span>
      <span>${(article.tags || []).join('、')}</span>
    `;

    // 动态附件下载按钮
    dom.readerAttach.innerHTML = '';
    (article.attachments || []).forEach(att => {
      const btn = document.createElement('a');
      btn.className = `attach-btn attach-${att.format}`;
      btn.href = att.path;
      btn.download = att.name;
      btn.textContent = `📥 ${att.name}`;
      btn.target = '_blank';
      dom.readerAttach.appendChild(btn);
    });

    // HTML 优先展示；无 HTML 时检查 Word 文档并提供在线查看
    if (article.html_path) {
      dom.contentIframe.src = article.html_path;
      dom.contentIframe.classList.remove('hidden');
      dom.noHtmlNotice.classList.add('hidden');
    } else {
      // 无 HTML，检查是否有 Word 文档可以在线查看
      const wordAtt = (article.attachments || []).find(att => isWordDoc(att.format));
      if (wordAtt) {
        // 有 Word 文档，显示在线查看提示（点击按钮在 Office Online 打开）
        dom.contentIframe.classList.add('hidden');
        dom.noHtmlNotice.classList.remove('hidden');
        const noticeEl = dom.noHtmlNotice.querySelector('.notice-inner');
        if (noticeEl) {
          noticeEl.innerHTML = `
            <div class="notice-icon">📄</div>
            <p>本文档为 Word 格式</p>
            <a href="${getWordViewerUrl(wordAtt.path)}" target="_blank" class="word-view-btn">在线查看 Word</a>
            <p style="margin-top:8px;font-size:12px;color:#999">或点击右上角下载按钮获取文件</p>
          `;
        }
      } else {
        dom.contentIframe.classList.add('hidden');
        dom.noHtmlNotice.classList.remove('hidden');
      }
    }

    // 切换视图
    dom.appShell.classList.add('hidden');
    dom.readerFrame.classList.remove('hidden');
    closeSidebar();
    window.scrollTo(0, 0);

    STATE.mode = 'READER';
    window.location.hash = `article/${article.id}`;
  }

  /** 关闭 Reader，返回主页（并恢复筛选状态）*/
  function closeReader() {
    dom.readerFrame.classList.add('hidden');
    dom.readerTitle.textContent = '';
    dom.readerMeta.innerHTML = '';
    dom.readerAttach.innerHTML = '';
    dom.contentIframe.src = '';

    // 恢复兜底提示原样
    const noticeEl = dom.noHtmlNotice.querySelector('.notice-inner');
    if (noticeEl) {
      noticeEl.innerHTML = `
        <div class="notice-icon">📄</div>
        <p>暂无 HTML 预览</p>
        <p>请下载附件查看</p>
      `;
    }

    dom.appShell.classList.remove('hidden');
    window.scrollTo(0, STATE.prevHomeScroll);
    STATE.mode = 'HOME';
    window.location.hash = '';
  }

  /** 应用筛选（分类 + 标签 + 搜索）*/
  function applyFilters() {
    STATE.filtered = STATE.articles.filter(a => {
      const catMatch = !STATE.activeCategory || a.category === STATE.activeCategory;
      const tagMatch = STATE.activeTags.length === 0 || STATE.activeTags.every(t => (a.tags || []).includes(t));
      const searchMatch = fuzzyMatch(a, STATE.searchQuery);
      return catMatch && tagMatch && searchMatch;
    });
    renderArticleList();
  }

  // ── 事件绑定 ──────────────────────────────────────────────────────

  // 返回按钮
  dom.btnBack.addEventListener('click', closeReader);

  // 菜单切换（移动端）
  dom.menuToggle.addEventListener('click', () => {
    if (STATE.sidebarOpen) closeSidebar(); else openSidebar();
  });

  // 关闭侧边栏按钮
  dom.sidebarClose.addEventListener('click', closeSidebar);

  // 点击遮罩关闭侧边栏
  dom.sidebarOverlay.addEventListener('click', closeSidebar);

  // 搜索输入
  dom.searchInput.addEventListener('input', (e) => {
    STATE.searchQuery = e.target.value.trim();
    applyFilters();
  });

  // 键盘快捷键：Escape 关闭 Reader / 侧边栏
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (STATE.sidebarOpen) { closeSidebar(); return; }
      if (STATE.mode === 'READER') closeReader();
    }
    // Ctrl/Cmd + K 聚焦搜索
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      dom.searchInput.focus();
    }
  });

  // Hash 路由：支持直接链接打开文章
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    if (hash.startsWith('#article/')) {
      const id = hash.replace('#article/', '');
      const article = STATE.articles.find(a => a.id === id);
      if (article) openReader(article);
    } else if (!hash && STATE.mode === 'READER') {
      closeReader();
    }
  });

  // ── 初始化：加载 manifest.json ───────────────────────────────────
  async function init() {
    try {
      const r = await fetch('content/index/manifest.json');
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      STATE.articles = Array.isArray(data) ? data : [];
    } catch (e) {
      STATE.articles = [];
      console.warn('[AAM-CMS] manifest.json 加载失败:', e.message);
    }

    STATE.filtered = [...STATE.articles];

    // 如果 URL 带 hash，直接打开对应文章
    const hash = window.location.hash;
    if (hash.startsWith('#article/')) {
      const id = hash.replace('#article/', '');
      const article = STATE.articles.find(a => a.id === id);
      if (article) {
        renderCategories();
        renderTagCloud();
        renderArticleList();
        openReader(article);
        return;
      }
    }

    renderCategories();
    renderTagCloud();
    renderArticleList();
  }

  init();

  // ══════════════════════════════════════════════════════════════════
  // 阶段 3 新功能模块（追加在 IIFE 内，共享 STATE 闭包）
  // ══════════════════════════════════════════════════════════════════
  initV3Features();

  function initV3Features() {
    enhanceReaderWithRelated();
    enhanceHashRouter();
    enhanceSearchWithFullText();
    addKeyboardShortcuts();
  }

  function enhanceReaderWithRelated() {
    const observer = new MutationObserver(() => {
      const wrap = document.getElementById('iframe-wrap');
      if (!wrap || wrap.dataset.v3Enhanced) return;
      const hash = window.location.hash;
      if (!hash.startsWith('#article/')) return;
      const id = hash.replace('#article/', '');
      const article = STATE.articles.find(a => a.id === id);
      if (!article) return;

      const sorted = [...STATE.articles].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      const idx = sorted.findIndex(a => a.id === id);
      const prev = idx > 0 ? sorted[idx - 1] : null;
      const next = idx < sorted.length - 1 ? sorted[idx + 1] : null;

      const relatedArts = (article.related || []).slice(0, 5)
        .map(rid => STATE.articles.find(a => a.id === rid)).filter(Boolean);
      const seriesArts = article.series
        ? STATE.articles.filter(a => a.series === article.series && a.id !== id)
        : [];

      // 侧边面板
      const panel = document.createElement('div');
      panel.id = 'v3-related-panel';
      panel.style.cssText = 'position:fixed;right:0;top:0;bottom:0;width:280px;background:#f4f2ed;border-left:1px solid #d8d4cc;overflow-y:auto;padding:16px 14px;font-size:12.5px;line-height:1.6;color:#1a1a1a;z-index:150;display:none;';
      document.body.appendChild(panel);

      function buildPanel() {
        let html = '<div style="font-weight:700;font-size:13px;margin-bottom:10px;color:#3a4a6b;">📑 导航</div>';

        if (prev || next) {
          html += '<div style="display:flex;gap:6px;margin-bottom:16px;">';
          if (prev) html += `<a href="#article/${prev.id}" style="flex:1;padding:6px 8px;background:#fff;border:1px solid #d8d4cc;border-radius:4px;text-decoration:none;color:#5a5a5a;font-size:11.5px;">← ${escapeHtml(prev.title.slice(0, 18))}</a>`;
          if (next) html += `<a href="#article/${next.id}" style="flex:1;padding:6px 8px;background:#fff;border:1px solid #d8d4cc;border-radius:4px;text-decoration:none;color:#5a5a5a;font-size:11.5px;text-align:right;">${escapeHtml(next.title.slice(0, 18))} →</a>`;
          html += '</div>';
        }

        if (article.series) {
          html += `<div style="font-weight:700;font-size:13px;margin:14px 0 6px;color:#3a4a6b;">📚 系列：${escapeHtml(article.series)}</div>`;
          html += '<div style="display:flex;flex-direction:column;gap:5px;margin-bottom:14px;">';
          for (const sa of seriesArts.slice(0, 6)) {
            html += `<a href="#article/${sa.id}" style="padding:5px 8px;background:#eef0f5;border-radius:4px;text-decoration:none;color:#2c3a54;font-size:11.5px;">${escapeHtml(sa.title)}</a>`;
          }
          html += '</div>';
        }

        if (relatedArts.length) {
          html += '<div style="font-weight:700;font-size:13px;margin:14px 0 6px;color:#3a4a6b;">🔗 相关文章</div>';
          html += '<div style="display:flex;flex-direction:column;gap:5px;">';
          for (const ra of relatedArts) {
            html += `<a href="#article/${ra.id}" style="padding:5px 8px;background:#fff;border:1px solid #d8d4cc;border-radius:4px;text-decoration:none;color:#5a5a5a;font-size:11.5px;">${escapeHtml(ra.title)}</a>`;
          }
          html += '</div>';
        }

        html += '<div style="margin-top:18px;padding-top:12px;border-top:1px solid #d8d4cc;color:#9a9690;font-size:10.5px;">⌨ 快捷键：n/p 翻页 · t 关闭面板</div>';
        panel.innerHTML = html;
      }

      buildPanel();
      wrap.dataset.v3Enhanced = '1';
      panel._buildPanel = buildPanel;

      if (!document.getElementById('v3-toggle-btn')) {
        const toggle = document.createElement('button');
        toggle.id = 'v3-toggle-btn';
        toggle.textContent = '📑';
        toggle.title = '显示导航面板 (t)';
        toggle.style.cssText = 'position:fixed;right:12px;bottom:60px;width:40px;height:40px;border-radius:50%;background:#3a4a6b;color:#fff;border:none;font-size:18px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.2);z-index:160;';
        toggle.onclick = () => {
          const isOpen = panel.style.display === 'block';
          panel.style.display = isOpen ? 'none' : 'block';
          if (!isOpen && panel._buildPanel) panel._buildPanel();
        };
        document.body.appendChild(toggle);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function enhanceHashRouter() {
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash;
      if (hash.startsWith('#series/')) {
        showCollectionView('series', decodeURIComponent(hash.replace('#series/', '')));
      } else if (hash.startsWith('#tag/')) {
        showCollectionView('tag', decodeURIComponent(hash.replace('#tag/', '')));
      } else if (hash === '' || hash === '#') {
        hideCollectionView();
      }
    });
  }

  function showCollectionView(type, value) {
    hideCollectionView();
    const filtered = type === 'series'
      ? STATE.articles.filter(a => a.series === value)
      : STATE.articles.filter(a => (a.tags || []).includes(value));

    const title = type === 'series' ? `📚 系列：${value}` : `🏷️ 标签：${value}`;

    const overlay = document.createElement('div');
    overlay.id = 'v3-collection-overlay';
    overlay.style.cssText = 'position:fixed;left:0;right:0;top:0;bottom:0;background:#f4f2ed;z-index:300;overflow-y:auto;padding:24px 36px;';
    overlay.innerHTML = `
      <div style="max-width:1280px;margin:0 auto;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #3a4a6b;">
          <h1 style="font-size:24px;color:#3a4a6b;margin:0;">${escapeHtml(title)}</h1>
          <a href="#" id="v3-collection-close" style="padding:6px 16px;background:#fff;border:1px solid #d8d4cc;border-radius:6px;text-decoration:none;color:#5a5a5a;">← 返回首页</a>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;">
          ${filtered.map(a => `
            <a href="#article/${a.id}" style="background:#fff;border:1px solid #d8d4cc;border-radius:8px;padding:14px;text-decoration:none;color:inherit;display:block;">
              <div style="font-size:11px;color:#9a9690;margin-bottom:6px;">${escapeHtml(a.category || '')} · ${escapeHtml(a.date || '')}</div>
              <div style="font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:6px;line-height:1.4;">${escapeHtml(a.title)}</div>
              <div style="font-size:12px;color:#5a5a5a;line-height:1.5;">${escapeHtml((a.summary || '').slice(0, 80))}${(a.summary || '').length > 80 ? '…' : ''}</div>
              ${a.tags && a.tags.length ? `<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px;">${a.tags.slice(0, 3).map(t => `<span style="background:#eae7e1;color:#5a5a5a;padding:1px 8px;border-radius:10px;font-size:10.5px;">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
            </a>
          `).join('')}
        </div>
        ${filtered.length === 0 ? '<p style="color:#9a9690;">没有匹配的文章。</p>' : ''}
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('v3-collection-close').onclick = (e) => {
      e.preventDefault();
      window.location.hash = '';
    };
  }

  function hideCollectionView() {
    const overlay = document.getElementById('v3-collection-overlay');
    if (overlay) overlay.remove();
  }

  function enhanceSearchWithFullText() {
    let fulltextIndex = null;
    const input = document.getElementById('search-input');
    if (!input) return;
    let timer = null;

    input.addEventListener('input', (e) => {
      clearTimeout(timer);
      const q = e.target.value.trim();
      if (q.length < 2) {
        hideCollectionView();
        return;
      }
      timer = setTimeout(async () => {
        if (q.length < 2) return;
        if (!fulltextIndex) {
          fulltextIndex = [];
          for (const a of STATE.articles) {
            try {
              const r = await fetch(a.html_path);
              if (!r.ok) continue;
              const html = await r.text();
              const text = html
                .replace(/<script[\s\S]*?<\/script>/gi, '')
                .replace(/<style[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
              fulltextIndex.push({ id: a.id, text: text.slice(0, 50000) });
            } catch (e) {}
          }
        }
        const ql = q.toLowerCase();
        const matchedIds = new Set(
          fulltextIndex.filter(x => x.text.toLowerCase().includes(ql)).map(x => x.id)
        );
        // 加上 manifest 自带的 title/summary/tags 匹配
        for (const a of STATE.articles) {
          if (a.title.toLowerCase().includes(ql) || (a.summary || '').toLowerCase().includes(ql)) {
            matchedIds.add(a.id);
          }
        }
        if (matchedIds.size === 0) {
          const overlay = document.createElement('div');
          overlay.id = 'v3-collection-overlay';
          overlay.style.cssText = 'position:fixed;left:0;right:0;top:0;bottom:0;background:#f4f2ed;z-index:300;display:flex;align-items:center;justify-content:center;';
          overlay.innerHTML = `<div style="text-align:center;"><h1 style="color:#3a4a6b;">🔍 没有匹配 "${escapeHtml(q)}" 的文章</h1><br><a href="#" onclick="event.preventDefault();window.location.hash='';document.getElementById('v3-collection-overlay')?.remove();" style="padding:6px 16px;background:#fff;border:1px solid #d8d4cc;border-radius:6px;text-decoration:none;color:#5a5a5a;">返回</a></div>`;
          hideCollectionView();
          document.body.appendChild(overlay);
          return;
        }
        // 渲染搜索结果视图
        const title = `🔍 搜索："${q}" (${matchedIds.size} 篇)`;
        const filtered = STATE.articles.filter(a => matchedIds.has(a.id));
        const overlay = document.createElement('div');
        overlay.id = 'v3-collection-overlay';
        overlay.style.cssText = 'position:fixed;left:0;right:0;top:0;bottom:0;background:#f4f2ed;z-index:300;overflow-y:auto;padding:24px 36px;';
        overlay.innerHTML = `
          <div style="max-width:1280px;margin:0 auto;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #3a4a6b;">
              <h1 style="font-size:24px;color:#3a4a6b;margin:0;">${escapeHtml(title)}</h1>
              <a href="#" id="v3-collection-close" style="padding:6px 16px;background:#fff;border:1px solid #d8d4cc;border-radius:6px;text-decoration:none;color:#5a5a5a;">← 返回首页</a>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;">
              ${filtered.map(a => `
                <a href="#article/${a.id}" style="background:#fff;border:1px solid #d8d4cc;border-radius:8px;padding:14px;text-decoration:none;color:inherit;display:block;">
                  <div style="font-size:11px;color:#9a9690;margin-bottom:6px;">${escapeHtml(a.category || '')} · ${escapeHtml(a.date || '')}</div>
                  <div style="font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:6px;line-height:1.4;">${escapeHtml(a.title)}</div>
                  <div style="font-size:12px;color:#5a5a5a;line-height:1.5;">${escapeHtml((a.summary || '').slice(0, 120))}${(a.summary || '').length > 120 ? '…' : ''}</div>
                </a>
              `).join('')}
            </div>
          </div>
        `;
        hideCollectionView();
        document.body.appendChild(overlay);
        document.getElementById('v3-collection-close').onclick = (e) => {
          e.preventDefault();
          window.location.hash = '';
          input.value = '';
        };
      }, 800);
    });
  }

  function addKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (STATE.mode !== 'READER') return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const hash = window.location.hash;
      if (!hash.startsWith('#article/')) return;
      const id = hash.replace('#article/', '');
      const sorted = [...STATE.articles].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      const idx = sorted.findIndex(a => a.id === id);
      if ((e.key === 'n' || e.key === 'ArrowRight') && idx >= 0 && idx < sorted.length - 1) {
        window.location.hash = '#article/' + sorted[idx + 1].id;
      } else if ((e.key === 'p' || e.key === 'ArrowLeft') && idx > 0) {
        window.location.hash = '#article/' + sorted[idx - 1].id;
      } else if (e.key === 't') {
        const btn = document.getElementById('v3-toggle-btn');
        if (btn) btn.click();
      }
    });
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

})();