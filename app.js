/**
 * app.js — 肥嘟嘟的炼金工厂 v4
 *
 * 状态机：HOME（双层布局：Hero 大卡 + 3 列网格）<-> READER（iframe）
 * 沿用 V3：related 面板、series/tag 集合视图、全文搜索、键盘快捷键
 */

(function () {
  'use strict';

  // ── 全局状态 ──────────────────────────────────────────
  const STATE = {
    mode: 'HOME',
    sidebarOpen: false,
    articles: [],
    filtered: [],
    activeCategory: null,
    activeTags: [],
    searchQuery: '',
    sortMode: 'newest',
    prevHomeScroll: 0,
    thumbCache: {},      // { articleId: 'path/to/img.png' | null }
    thumbInflight: {},   // 防重复探测
  };

  // ── DOM 引用 ──────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    appShell:        $('#app-shell'),
    sidebar:         $('#sidebar'),
    sidebarOverlay:  $('#sidebar-overlay'),
    sidebarClose:    $('#sidebar-close'),
    menuToggle:      $('#menu-toggle'),
    categoryList:    $('#category-list'),
    tagCloud:        $('#tag-cloud'),
    tagsClear:       $('#tags-clear'),
    topBar:          $('#top-bar'),
    topbarCount:     $('#topbar-count'),
    searchInput:     $('#search-input'),
    sortSelect:      $('#sort-select'),
    statsBtn:        $('#stats-btn'),
    statsOverlay:    $('#stats-overlay'),
    statsClose:      $('#stats-close'),
    statsBody:       $('#stats-body'),
    mainArea:        $('#main-area'),
    heroSection:     $('#hero-section'),
    articleGrid:     $('#article-grid'),
    articleCount:    $('#article-count'),
    emptyState:      $('#empty-state'),
    emptyReset:      $('#empty-reset'),
    readerFrame:     $('#reader-frame'),
    readerBar:       $('#reader-bar'),
    btnBack:         $('#btn-back'),
    readerTitle:     $('#reader-title'),
    readerMeta:      $('#reader-meta'),
    readerAttach:    $('#reader-attachments'),
    iframeWrap:      $('#iframe-wrap'),
    contentIframe:   $('#content-iframe'),
    noHtmlNotice:    $('#no-html-notice'),
  };

  // ── 工具函数 ──────────────────────────────────────────
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  const escapeHtml = (s) => {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const formatIcon = (fmt) => {
    const icons = { docx:'Word', doc:'Word', pptx:'PPT', ppt:'PPT', pdf:'PDF', xlsx:'Excel', xls:'Excel' };
    return icons[fmt] || fmt.toUpperCase();
  };

  const isWordDoc = (fmt) => fmt === 'docx' || fmt === 'doc';

  const getWordViewerUrl = (docUrl) =>
    'https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURIComponent(docUrl);

  const fuzzyMatch = (article, query) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      article.title.toLowerCase().includes(q) ||
      (article.summary || '').toLowerCase().includes(q) ||
      (article.tags || []).some(t => t.toLowerCase().includes(q))
    );
  };

  // 分类对应的内联 SVG 占位 (低 AI 感, 学术风)
  const CATEGORY_PLACEHOLDER = {
    'AI基础设施': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <!-- CPU/芯片: 中央方块 + 4 向引脚 + 内部小方块 -->
      <rect x="22" y="22" width="36" height="36" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <rect x="32" y="32" width="16" height="16" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <!-- 引脚 (上) -->
      <line x1="30" y1="22" x2="30" y2="14" stroke="currentColor" stroke-width="1.5"/>
      <line x1="40" y1="22" x2="40" y2="14" stroke="currentColor" stroke-width="1.5"/>
      <line x1="50" y1="22" x2="50" y2="14" stroke="currentColor" stroke-width="1.5"/>
      <!-- 引脚 (下) -->
      <line x1="30" y1="58" x2="30" y2="66" stroke="currentColor" stroke-width="1.5"/>
      <line x1="40" y1="58" x2="40" y2="66" stroke="currentColor" stroke-width="1.5"/>
      <line x1="50" y1="58" x2="50" y2="66" stroke="currentColor" stroke-width="1.5"/>
      <!-- 引脚 (左) -->
      <line x1="22" y1="30" x2="14" y2="30" stroke="currentColor" stroke-width="1.5"/>
      <line x1="22" y1="40" x2="14" y2="40" stroke="currentColor" stroke-width="1.5"/>
      <line x1="22" y1="50" x2="14" y2="50" stroke="currentColor" stroke-width="1.5"/>
      <!-- 引脚 (右) -->
      <line x1="58" y1="30" x2="66" y2="30" stroke="currentColor" stroke-width="1.5"/>
      <line x1="58" y1="40" x2="66" y2="40" stroke="currentColor" stroke-width="1.5"/>
      <line x1="58" y1="50" x2="66" y2="50" stroke="currentColor" stroke-width="1.5"/>
    </svg>`,
    '安全': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 12 L62 22 L62 42 Q62 58 40 68 Q18 58 18 42 L18 22 Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M30 40 L37 47 L52 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    '洞察': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="22" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="40" cy="40" r="3" fill="currentColor"/>
      <line x1="40" y1="40" x2="40" y2="22" stroke="currentColor" stroke-width="1.5"/>
      <line x1="40" y1="40" x2="55" y2="48" stroke="currentColor" stroke-width="1.5"/>
      <line x1="40" y1="14" x2="40" y2="10" stroke="currentColor" stroke-width="1"/>
      <line x1="40" y1="70" x2="40" y2="66" stroke="currentColor" stroke-width="1"/>
      <line x1="14" y1="40" x2="10" y2="40" stroke="currentColor" stroke-width="1"/>
      <line x1="70" y1="40" x2="66" y2="40" stroke="currentColor" stroke-width="1"/>
    </svg>`,
    'AI应用': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <rect x="16" y="22" width="48" height="36" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <line x1="16" y1="34" x2="64" y2="34" stroke="currentColor" stroke-width="1.5"/>
      <line x1="16" y1="46" x2="64" y2="46" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="26" cy="28" r="1.5" fill="currentColor"/>
      <circle cx="32" cy="28" r="1.5" fill="currentColor"/>
      <line x1="28" y1="58" x2="28" y2="64" stroke="currentColor" stroke-width="1.5"/>
      <line x1="52" y1="58" x2="52" y2="64" stroke="currentColor" stroke-width="1.5"/>
      <line x1="22" y1="64" x2="58" y2="64" stroke="currentColor" stroke-width="1.5"/>
    </svg>`,
    '其他': `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="26" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <ellipse cx="40" cy="40" rx="26" ry="10" fill="none" stroke="currentColor" stroke-width="1"/>
      <ellipse cx="40" cy="40" rx="10" ry="26" fill="none" stroke="currentColor" stroke-width="1"/>
    </svg>`,
  };

  function getCategoryPlaceholder(category) {
    const svg = CATEGORY_PLACEHOLDER[category] || CATEGORY_PLACEHOLDER['其他'];
    return `<div class="placeholder-svg" aria-hidden="true">${svg}</div>`;
  }

  // ── 缩略图探测 (异步, 缓存) ──────────────────────────
  // 策略:
  //   1. 先返回占位 SVG (同步)
  //   2. 后台探测: content/articles/{id}/images/cover.*|01_*.{png,jpg,webp,svg}
  //   3. 探测成功 → 替换 <img>; 失败 → 保留占位
  const IMG_EXT = ['png', 'jpg', 'jpeg', 'webp', 'svg'];
  const IMG_CANDIDATES = ['cover', '01_cover', '01', '1', '00', 'thumbnail'];

  async function probeThumbnail(article) {
    if (STATE.thumbCache[article.id] !== undefined) {
      return STATE.thumbCache[article.id];
    }
    if (STATE.thumbInflight[article.id]) {
      return STATE.thumbInflight[article.id];
    }
    if (!article.html_path) {
      STATE.thumbCache[article.id] = null;
      return null;
    }
    // html_path: content/articles/{id}/index.html
    // 推导出 images/ 目录
    const htmlDir = article.html_path.replace(/index\.html$/, '');
    const base = htmlDir + 'images/';

    STATE.thumbInflight[article.id] = (async () => {
      for (const name of IMG_CANDIDATES) {
        for (const ext of IMG_EXT) {
          const url = `${base}${name}.${ext}`;
          try {
            const r = await fetch(url, { method: 'HEAD' });
            if (r.ok) {
              STATE.thumbCache[article.id] = url;
              return url;
            }
          } catch (e) { /* 忽略, 继续探测 */ }
        }
      }
      STATE.thumbCache[article.id] = null;
      return null;
    })();
    return STATE.thumbInflight[article.id];
  }

  // 后台批量探测所有缩略图, 完成后替换占位
  function hydrateThumbnails(articles) {
    if (!('IntersectionObserver' in window)) return;
    // 用图片懒加载 + 替换策略:
    // 首屏立即探测, 其余延后 (requestIdleCallback)
    const probe = (a) => probeThumbnail(a).then(url => {
      if (!url) return;
      // 找到对应卡片内的 img, 设置 src
      document.querySelectorAll(`img[data-thumb-for="${a.id}"]`).forEach(img => {
        if (!img.src || img.dataset.placeholder) {
          img.src = url;
          img.removeAttribute('data-placeholder');
        }
      });
    });

    articles.slice(0, 4).forEach(p => probe(p));
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => articles.slice(4).forEach(p => probe(p)), { timeout: 1500 });
    } else {
      setTimeout(() => articles.slice(4).forEach(p => probe(p)), 600);
    }
  }

  // ── 侧边栏 ───────────────────────────────────────────
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

  // ── 渲染: 分类 ──────────────────────────────────────
  function renderCategories() {
    dom.categoryList.innerHTML = '';

    // "全部" 项
    const allItem = el('button', 'cat-item');
    allItem.dataset.cat = '';
    if (!STATE.activeCategory) allItem.classList.add('active');
    allItem.innerHTML = `
      <span class="cat-name">全部文章</span>
      <span class="cat-count">${STATE.articles.length}</span>
    `;
    allItem.addEventListener('click', () => {
      STATE.activeCategory = null;
      renderCategories();
      applyFilters();
      if (window.innerWidth < 1024) closeSidebar();
    });
    dom.categoryList.appendChild(allItem);

    // 各分类项
    const catCount = {};
    STATE.articles.forEach(a => {
      const c = a.category || '其他';
      catCount[c] = (catCount[c] || 0) + 1;
    });
    const ORDER = ['洞察', 'AI 应用', 'AI基础设施', '安全', '其他'];
    const cats = Object.keys(catCount).sort((a, b) => {
      const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b);
      if (ia >= 0 && ib >= 0) return ia - ib;
      if (ia >= 0) return -1;
      if (ib >= 0) return 1;
      return a.localeCompare(b);
    });

    cats.forEach(cat => {
      const item = el('button', 'cat-item');
      item.dataset.cat = cat;
      if (STATE.activeCategory === cat) item.classList.add('active');
      item.innerHTML = `
        <span class="cat-name">${escapeHtml(cat)}</span>
        <span class="cat-count">${catCount[cat]}</span>
      `;
      item.addEventListener('click', () => {
        STATE.activeCategory = STATE.activeCategory === cat ? null : cat;
        renderCategories();
        applyFilters();
        if (window.innerWidth < 1024) closeSidebar();
      });
      dom.categoryList.appendChild(item);
    });
  }

  // ── 渲染: 标签云 ────────────────────────────────────
  function renderTagCloud() {
    dom.tagCloud.innerHTML = '';
    const tagCount = {};
    STATE.articles.forEach(a => (a.tags || []).forEach(t => {
      tagCount[t] = (tagCount[t] || 0) + 1;
    }));
    const sorted = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 24);
    sorted.forEach(([tag, count]) => {
      const btn = el('button', 'tag-btn');
      btn.textContent = tag;
      btn.title = `${count} 篇`;
      if (STATE.activeTags.includes(tag)) btn.classList.add('active');
      btn.addEventListener('click', () => {
        STATE.activeTags = STATE.activeTags.includes(tag)
          ? STATE.activeTags.filter(t => t !== tag)
          : [...STATE.activeTags, tag];
        renderTagCloud();
        applyFilters();
        if (window.innerWidth < 1024) closeSidebar();
      });
      dom.tagCloud.appendChild(btn);
    });

    // 清除按钮
    if (dom.tagsClear) {
      if (STATE.activeTags.length > 0) {
        dom.tagsClear.hidden = false;
        dom.tagsClear.onclick = () => {
          STATE.activeTags = [];
          renderTagCloud();
          applyFilters();
        };
      } else {
        dom.tagsClear.hidden = true;
      }
    }
  }

  // ── 渲染: 缩略图节点 ────────────────────────────────
  function renderThumbEl(article, extraCls) {
    const wrap = el('div', `thumb-wrap ${extraCls || ''}`);
    // 先放占位, 后续探测替换
    const placeholder = document.createElement('div');
    placeholder.className = 'placeholder-svg';
    placeholder.innerHTML = getCategoryPlaceholder(article.category);
    wrap.appendChild(placeholder);

    // 占位即最终 (探测成功后会被 IMG 替换)
    // 我们用一个隐藏的 img 探测, 一旦加载成功, 用它替换 placeholder
    const img = new Image();
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.dataset.thumbFor = article.id;
    img.style.display = 'none';
    wrap.appendChild(img);
    return { wrap, img, placeholder };
  }

  // 把 (img, placeholder) 节点升级为真实图 (探测成功后回调用)
  function adoptRealImage(img, placeholder, url) {
    img.src = url;
    img.style.display = '';
    img.onload = () => {
      if (placeholder.parentNode) placeholder.remove();
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.25s';
      requestAnimationFrame(() => { img.style.opacity = '1'; });
    };
    img.onerror = () => {
      // 探测成功但加载失败, 保留占位
      img.remove();
    };
  }

  // ── 渲染: Hero 大卡片 ───────────────────────────────
  function renderHeroCard(article) {
    const card = el('article', 'hero-card');
    card.dataset.id = article.id;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `打开文章: ${article.title}`);

    // 文本主体
    const body = el('div', 'hero-body');
    const badgeRow = el('div', 'hero-badge-row');
    badgeRow.innerHTML = `
      <span class="hero-badge">精选</span>
      <span class="hero-badge cat">${escapeHtml(article.category || '未分类')}</span>
      <span class="hero-date">${escapeHtml(article.date || '')}</span>
    `;
    body.appendChild(badgeRow);

    const title = el('h3', 'hero-title');
    title.textContent = article.title;
    body.appendChild(title);

    const summary = el('p', 'hero-summary');
    summary.textContent = article.summary || '';
    body.appendChild(summary);

    // 标签
    const tagsRow = el('div', 'hero-tags');
    const tags = article.tags || [];
    tags.slice(0, 10).forEach(t => {
      const tEl = el('span', 'hero-tag');
      tEl.textContent = t;
      tagsRow.appendChild(tEl);
    });
    if (tags.length > 10) {
      const more = el('span', 'hero-tag more');
      more.textContent = `+${tags.length - 10}`;
      tagsRow.appendChild(more);
    }
    body.appendChild(tagsRow);

    // Meta 行: 阅读时间 / 字数 / 附件
    const meta = el('div', 'hero-meta');
    const parts = [];
    if (article.reading_time_min) {
      parts.push(`<span class="hero-meta-item">⏱ ${article.reading_time_min} 分钟</span>`);
    }
    if (article.word_count) {
      parts.push(`<span class="hero-meta-item">${formatNum(article.word_count)} 字</span>`);
    }
    const atts = article.attachments || [];
    if (atts.length > 0) {
      const summary2 = atts.map(a => formatIcon(a.format)).join(' · ');
      parts.push(`<span class="hero-attach-info">📎 <span class="att-count">${atts.length}</span> 附件 · ${escapeHtml(summary2)}</span>`);
    }
    meta.innerHTML = parts.join('<span class="hero-meta-sep">·</span>');
    body.appendChild(meta);

    card.appendChild(body);

    // 缩略图
    const thumbWrap = el('div', 'hero-thumb');
    const { wrap, img, placeholder } = renderThumbEl(article, 'hero');
    thumbWrap.appendChild(wrap);
    card.appendChild(thumbWrap);

    // 绑定打开
    const open = () => openReader(article);
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });

    // 缩略图升级回调
    probeThumbnail(article).then(url => {
      if (url) adoptRealImage(img, placeholder, url);
    });

    return card;
  }

  // ── 渲染: 普通网格卡片 ──────────────────────────────
  function renderGridCard(article) {
    const card = el('article', 'grid-card');
    card.dataset.id = article.id;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `打开文章: ${article.title}`);

    // 缩略图
    const thumbWrap = el('div', 'grid-card-thumb');
    const { wrap, img, placeholder } = renderThumbEl(article, 'grid');
    thumbWrap.appendChild(wrap);

    // 文本
    const body = el('div', 'grid-card-body');

    // 分类徽章 (右上角)
    const cat = el('span', 'grid-card-cat');
    cat.textContent = article.category || '未分类';
    body.appendChild(cat);

    // 标题
    const title = el('h3', 'grid-card-title');
    title.textContent = article.title;
    body.appendChild(title);

    // 摘要
    const summary = el('p', 'grid-card-summary');
    summary.textContent = article.summary || '';
    body.appendChild(summary);

    // 标签
    const tagsRow = el('div', 'grid-card-tags');
    const tags = article.tags || [];
    tags.slice(0, 4).forEach(t => {
      const tEl = el('span', 'grid-card-tag');
      tEl.textContent = t;
      tagsRow.appendChild(tEl);
    });
    if (tags.length > 4) {
      const more = el('span', 'grid-card-tag more');
      more.textContent = `+${tags.length - 4}`;
      tagsRow.appendChild(more);
    }
    body.appendChild(tagsRow);

    // 底部: 日期 · 阅读时间 · 格式徽章
    const footer = el('div', 'grid-card-footer');
    if (article.date) {
      const d = el('span', 'grid-card-date');
      d.textContent = article.date;
      footer.appendChild(d);
    }
    if (article.reading_time_min) {
      const sep = el('span', 'grid-card-sep');
      sep.textContent = '·';
      footer.appendChild(sep);
      const r = el('span', 'grid-card-read');
      r.textContent = `${article.reading_time_min} 分钟`;
      footer.appendChild(r);
    }
    // 格式徽章
    const fmts = collectFormats(article);
    if (fmts.length) {
      const sep2 = el('span', 'grid-card-sep');
      sep2.textContent = '·';
      footer.appendChild(sep2);
      fmts.slice(0, 3).forEach(f => {
        const b = el('span', `fmt-badge fmt-${f}`);
        b.textContent = formatIcon(f);
        footer.appendChild(b);
      });
    }
    body.appendChild(footer);

    card.appendChild(thumbWrap);
    card.appendChild(body);

    const open = () => openReader(article);
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });

    probeThumbnail(article).then(url => {
      if (url) adoptRealImage(img, placeholder, url);
    });

    return card;
  }

  function collectFormats(article) {
    const fmts = [];
    if (article.html_path) fmts.push('html');
    (article.attachments || []).forEach(a => { if (a.format && !fmts.includes(a.format)) fmts.push(a.format); });
    return fmts;
  }

  function formatNum(n) {
    if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + ' 万';
    return n.toLocaleString();
  }

  // ── 渲染: 文章列表 (Hero + Grid) ────────────────────
  function renderArticleList() {
    // 清空
    dom.heroSection.innerHTML = '';
    dom.articleGrid.innerHTML = '';

    // 顶部计数
    const total = STATE.filtered.length;
    if (total === 0) {
      dom.articleCount.textContent = '';
      dom.topbarCount.textContent = '0 篇';
      dom.emptyState.classList.remove('hidden');
      dom.heroSection.style.display = 'none';
      dom.articleGrid.style.display = 'none';
      return;
    }
    dom.emptyState.classList.add('hidden');
    dom.heroSection.style.display = '';
    dom.articleGrid.style.display = '';
    dom.articleCount.textContent = `${total} 篇`;
    dom.topbarCount.textContent = `${total} 篇`;

    // 当前筛选后的副本 (Hero 用最新 2 篇, Grid 显示其余)
    const sorted = sortArticles(STATE.filtered.slice(), STATE.sortMode);

    // Hero: 取最新 2 篇 (按日期降序)
    // 注意: 如果当前筛选改了, 应该展示筛选后的最新 2 篇
    const dateSorted = sorted.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const heroArts = dateSorted.slice(0, 2);
    const heroIds = new Set(heroArts.map(a => a.id));

    // Hero: 仅当 1) 没搜索/没筛标签时, 或 2) 过滤后总数 ≥ 2 时显示
    const showHero = heroArts.length >= 2;
    if (showHero) {
      heroArts.forEach(a => dom.heroSection.appendChild(renderHeroCard(a)));
      dom.heroSection.style.display = '';
    } else {
      dom.heroSection.style.display = 'none';
    }

    // Grid: 其余
    sorted.forEach(a => {
      if (heroIds.has(a.id)) return;
      dom.articleGrid.appendChild(renderGridCard(a));
    });
  }

  // ── 排序 ────────────────────────────────────────────
  function sortArticles(arr, mode) {
    const cmp = {
      newest:   (a, b) => (b.date || '').localeCompare(a.date || ''),
      oldest:   (a, b) => (a.date || '').localeCompare(b.date || ''),
      words:    (a, b) => (b.word_count || 0) - (a.word_count || 0),
      reading:  (a, b) => (b.reading_time_min || 0) - (a.reading_time_min || 0),
      title:    (a, b) => (a.title || '').localeCompare(b.title || ''),
    }[mode] || ((a, b) => 0);
    return arr.sort(cmp);
  }

  // ── 应用筛选 ────────────────────────────────────────
  function applyFilters() {
    STATE.filtered = STATE.articles.filter(a => {
      const catMatch = !STATE.activeCategory || a.category === STATE.activeCategory;
      const tagMatch = STATE.activeTags.length === 0 || STATE.activeTags.every(t => (a.tags || []).includes(t));
      const searchMatch = fuzzyMatch(a, STATE.searchQuery);
      return catMatch && tagMatch && searchMatch;
    });
    renderArticleList();
  }

  // ── Reader ──────────────────────────────────────────
  function openReader(article) {
    STATE.prevHomeScroll = window.scrollY;

    dom.readerTitle.textContent = article.title;
    // 同步浏览器标题 + OG meta, 方便复制链接到微信时显示文章标题
    document.title = `${article.title} | 肥嘟嘟的炼金工厂`;
    setOpenGraphMeta(article);
    dom.readerMeta.innerHTML = `
      <span class="rmeta-cat">${escapeHtml(article.category || '未分类')}</span>
      <span class="rmeta-sep">·</span>
      <span>${escapeHtml(article.date || '')}</span>
      <span class="rmeta-sep">·</span>
      <span>${escapeHtml((article.tags || []).join('、'))}</span>
    `;

    dom.readerAttach.innerHTML = '';
    (article.attachments || []).forEach(att => {
      const btn = document.createElement('a');
      btn.className = `attach-btn attach-${att.format}`;
      // 用绝对路径 (从根开始) — 避免在 iframe 内点击时路径被解析为 iframe URL
      // 例: manifest 里 path = "content/articles/.../x.pptx"
      //     iframe URL = "http://.../content/articles/.../index.html"
      //     相对路径会变成 "http://.../content/articles/.../content/articles/.../x.pptx" ❌
      //     绝对路径 "/" 开头:  "http://.../content/articles/.../x.pptx" ✅
      btn.href = att.path.startsWith('/') ? att.path : '/' + att.path;
      btn.download = att.name;
      btn.textContent = `📥 ${att.name}`;
      // 不加 target=_blank — iframe 内 _blank 会被部分浏览器拦截, 导致下载到错误页
      btn.setAttribute('rel', 'noopener');
      dom.readerAttach.appendChild(btn);
    });

    if (article.html_path) {
      dom.contentIframe.src = article.html_path;
      dom.contentIframe.classList.remove('hidden');
      dom.noHtmlNotice.classList.add('hidden');
    } else {
      const wordAtt = (article.attachments || []).find(att => isWordDoc(att.format));
      if (wordAtt) {
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

    dom.appShell.classList.add('hidden');
    dom.readerFrame.classList.remove('hidden');
    closeSidebar();
    window.scrollTo(0, 0);

    STATE.mode = 'READER';
    window.location.hash = `article/${article.id}`;
  }

  function closeReader() {
    dom.readerFrame.classList.add('hidden');
    dom.readerTitle.textContent = '';
    dom.readerMeta.innerHTML = '';
    dom.readerAttach.innerHTML = '';
    dom.contentIframe.src = '';

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

    // 恢复主页标题 + 主页 OG meta
    document.title = '肥嘟嘟的炼金工厂 · 调研报告与白皮书';
    setOpenGraphMeta(null);
    STATE.mode = 'HOME';
    window.location.hash = '';
  }

  // ── Open Graph meta 动态切换 ──────────────────────────
  // 用于复制链接到微信/QQ/飞书时, 接收方能看到当前文章标题和摘要
  // 注: WeChat 抓取需要 server-side JS 渲染才能拿到动态 OG,
  //     本函数至少保证浏览器标签页、Twitter/Slack/钉钉/飞书分享卡显示正确
  function setOpenGraphMeta(article) {
    const title = article ? article.title : '肥嘟嘟的炼金工厂 · 调研报告与白皮书';
    const desc = article
      ? (article.summary || '').slice(0, 120)
      : '32 篇深度调研 · 涵盖 AI 基础设施 / 存储安全 / 勒索防御 / 数据安全';
    const url = article
      ? `${location.origin}/${article.html_path || ''}`
      : location.origin + location.pathname;
    setMeta('og:title', title);
    setMeta('og:description', desc);
    setMeta('og:url', url);
    setMeta('og:type', article ? 'article' : 'website');
    setMeta('twitter:title', title);
    setMeta('twitter:description', desc);
  }
  function setMeta(prop, content) {
    let el = document.querySelector(`meta[property="${prop}"]`) ||
             document.querySelector(`meta[name="${prop}"]`);
    if (!el) {
      el = document.createElement('meta');
      const attr = prop.startsWith('og:') ? 'property' : 'name';
      el.setAttribute(attr, prop);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  // ── 统计弹层 ────────────────────────────────────────
  function openStats() {
    const articles = STATE.articles;
    const totalWords = articles.reduce((s, a) => s + (a.word_count || 0), 0);
    const totalRead = articles.reduce((s, a) => s + (a.reading_time_min || 0), 0);

    const catCount = {};
    articles.forEach(a => { catCount[a.category || '其他'] = (catCount[a.category || '其他'] || 0) + 1; });
    const catMax = Math.max(...Object.values(catCount));

    const tagCount = {};
    articles.forEach(a => (a.tags || []).forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; }));
    const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const tagMax = Math.max(...topTags.map(([_, c]) => c));

    // 年份分布
    const yearCount = {};
    articles.forEach(a => {
      const y = (a.date || '').slice(0, 4);
      if (y) yearCount[y] = (yearCount[y] || 0) + 1;
    });

    const barRow = (label, val, max, fmt) => `
      <div class="bar-row">
        <span class="bar-label" title="${escapeHtml(label)}">${escapeHtml(label)}</span>
        <span class="bar-track"><span class="bar-fill" style="width:${Math.max(8, val / max * 100)}%"></span></span>
        <span class="bar-val">${fmt ? fmt(val) : val}</span>
      </div>
    `;

    dom.statsBody.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-num">${articles.length}</div>
          <div class="stat-label">文章总数</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">${formatNum(totalWords)}</div>
          <div class="stat-label">总字数</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">${Math.round(totalRead / 60)}h</div>
          <div class="stat-label">总阅读时长</div>
        </div>
      </div>

      <div class="stats-section">
        <div class="stats-section-title">分类分布</div>
        ${Object.entries(catCount).sort((a, b) => b[1] - a[1])
          .map(([c, n]) => barRow(c, n, catMax)).join('')}
      </div>

      <div class="stats-section">
        <div class="stats-section-title">Top 10 标签</div>
        ${topTags.map(([t, n]) => barRow(t, n, tagMax)).join('')}
      </div>

      <div class="stats-section">
        <div class="stats-section-title">年份分布</div>
        ${Object.entries(yearCount).sort().map(([y, n]) => barRow(y, n, Math.max(...Object.values(yearCount)))).join('')}
      </div>
    `;

    dom.statsOverlay.classList.remove('hidden');
    requestAnimationFrame(() => dom.statsOverlay.classList.add('visible'));
    dom.statsOverlay.setAttribute('aria-hidden', 'false');
  }

  function closeStats() {
    dom.statsOverlay.classList.remove('visible');
    dom.statsOverlay.setAttribute('aria-hidden', 'true');
    setTimeout(() => dom.statsOverlay.classList.add('hidden'), 200);
  }

  // ── 事件绑定 ────────────────────────────────────────
  function bindEvents() {
    dom.btnBack.addEventListener('click', closeReader);

    dom.menuToggle.addEventListener('click', () => {
      if (STATE.sidebarOpen) closeSidebar(); else openSidebar();
    });
    dom.sidebarClose.addEventListener('click', closeSidebar);
    dom.sidebarOverlay.addEventListener('click', closeSidebar);

    dom.searchInput.addEventListener('input', (e) => {
      STATE.searchQuery = e.target.value.trim();
      applyFilters();
    });

    dom.sortSelect.addEventListener('change', (e) => {
      STATE.sortMode = e.target.value;
      renderArticleList();
    });

    dom.statsBtn.addEventListener('click', openStats);
    dom.statsClose.addEventListener('click', closeStats);
    dom.statsOverlay.addEventListener('click', (e) => {
      if (e.target === dom.statsOverlay) closeStats();
    });

    if (dom.emptyReset) {
      dom.emptyReset.addEventListener('click', () => {
        STATE.activeCategory = null;
        STATE.activeTags = [];
        STATE.searchQuery = '';
        STATE.sortMode = 'newest';
        dom.searchInput.value = '';
        dom.sortSelect.value = 'newest';
        renderCategories();
        renderTagCloud();
        applyFilters();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (dom.statsOverlay.classList.contains('visible')) { closeStats(); return; }
        if (STATE.sidebarOpen) { closeSidebar(); return; }
        if (STATE.mode === 'READER') closeReader();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        dom.searchInput.focus();
      }
    });

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
  }

  // ── 初始化 ──────────────────────────────────────────
  async function init() {
    bindEvents();

    try {
      const r = await fetch('content/index/manifest.json');
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      STATE.articles = Array.isArray(data) ? data : [];
    } catch (e) {
      STATE.articles = [];
      console.warn('[肥嘟嘟的炼金工厂] manifest.json 加载失败:', e.message);
    }

    STATE.filtered = [...STATE.articles];

    // 顶栏计数
    dom.topbarCount.textContent = `${STATE.articles.length} 篇`;

    renderCategories();
    renderTagCloud();

    // 如果 URL 带 hash, 直接打开对应文章
    const hash = window.location.hash;
    if (hash.startsWith('#article/')) {
      const id = hash.replace('#article/', '');
      const article = STATE.articles.find(a => a.id === id);
      if (article) {
        renderArticleList();
        hydrateThumbnails(STATE.articles);
        openReader(article);
        return;
      }
    }

    renderArticleList();
    hydrateThumbnails(STATE.articles);
  }

  init();

  // ═══════════════════════════════════════════════════════
  // V3 增强模块 — 沿用, 不破坏
  // ═══════════════════════════════════════════════════════
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

})();
