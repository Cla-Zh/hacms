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

    // 各分类项（动态从 manifest 提取）
    const cats = [...new Set(STATE.articles.map(a => a.category).filter(Boolean))];
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

})();