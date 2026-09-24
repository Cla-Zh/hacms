/**
 * app.js — 肥嘟嘟的炼金工厂 v7 (杂志风全宽布局)
 *
 * 重大变更 (2026-09-24 v7):
 * - 整体重设计: 杂志风 + 顶栏水平菜单 + 全宽卡片网格, 去掉 sidebar
 * - 配色: 图3 (DC3971 玫红 / EC719F 桃粉 / F3B3CC 樱花粉 / ABE5E8 薄荷蓝 / 34ADAE 青绿)
 * - 卡片: 顶部色带 + 大标题 + 摘要完整显示 + 渐隐 + 展开按钮
 * - 分类: 从 sidebar 移到顶部水平筛选条 (filter-pill)
 * - 标签: 从 sidebar 移到文章区上方横向 chip
 * - 移动端: 顶栏模式切换收起, 改为汉堡菜单 + 抽屉 (覆盖式)
 *
 * 沿用:
 * - 全文搜索 / 高亮 / 片段
 * - Reader iframe + 仅下载页
 * - QA 视图 + 模式切换
 * - Markets 视图
 * - V3 增强 (相关面板 / 键盘 / 路由)
 * - TOC 自动注入
 * - 暗色模式 + 缓存
 */

(function () {
  'use strict';

  // ── 全局状态 ──────────────────────────────────────────
  const STATE = {
    mode: 'HOME',
    viewMode: 'articles',  // 'articles' | 'qa' — 视图模式
    drawerOpen: false,
    articles: [],
    qaList: [],
    filtered: [],
    qaFiltered: [],
    activeCategory: null,
    activeTags: [],
    activeQaTags: [],
    searchQuery: '',
    qaSearchQuery: '',
    sortMode: 'date-desc',
    qaSortMode: 'date-desc',
    prevHomeScroll: 0,
    searchIndex: {},
    searchIndexReady: false,
    searchIndexInflight: false,
  };

  // ── 分类颜色映射 (去棕色, 用图3 5色板) ──────────────
  const CATEGORY_COLORS = {
    '友商调研':     '#EC719F',  // 桃粉 (替代原棕色)
    '洞察':         '#DC3971',  // 玫红
    '战略洞察':     '#34ADAE',  // 青绿
    'AI应用':       '#ABE5E8',  // 薄荷蓝
    'AI基础设施':   '#DC3971',  // 玫红
    '安全':         '#F3B3CC',  // 樱花粉
    '技术调研':     '#EC719F',  // 桃粉
    '其他':         '#9A9AA6',  // 中性灰
  };
  const DEFAULT_CATEGORY_COLOR = '#9A9AA6';

  function getCategoryColor(category) {
    return CATEGORY_COLORS[category] || DEFAULT_CATEGORY_COLOR;
  }

  // ── DOM 引用 ──────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    appShell:        $('#app-shell'),
    modeArticlesBtn: $('#mode-articles'),
    modeQaBtn:       $('#mode-qa'),
    modeMarketsBtn:  $('#mode-markets'),
    modeArticlesCount: $('#mode-articles-count'),
    modeQaCount:     $('#mode-qa-count'),
    articlesView:    $('#articles-view'),
    qaView:          $('#qa-view'),
    marketsView:     $('#markets-view'),
    // 水平筛选条 (替代 sidebar 分类列表)
    categoryList:    $('#category-list'),
    tagsClear:       $('#tags-clear'),
    // 标签云
    tagCloudWrap:    $('#tag-cloud-wrap'),
    tagCloud:        $('#tag-cloud'),
    // 移动端抽屉
    mobileToggle:    $('#mobile-toggle'),
    mobileDrawer:    $('#mobile-drawer'),
    drawerClose:     $('#drawer-close'),
    drawerCategoryList: $('#drawer-category-list'),
    drawerTagCloud:  $('#drawer-tag-cloud'),
    drawerModeBtns:  $$('#drawer-modes .drawer-mode-btn'),
    // QA
    qaTagCloud:      $('#qa-tag-cloud'),
    qaGrid:          $('#qa-grid'),
    qaEmpty:         $('#qa-empty'),
    qaSearchInput:   $('#qa-search-input'),
    qaSortSelect:    $('#qa-sort-select'),
    // 顶栏
    topbarCount:     $('#topbar-count'),
    footerArticleCount: $('#footer-article-count'),
    footerQaCount:   $('#footer-qa-count'),
    searchInput:     $('#search-input'),
    sortSelect:      $('#sort-select'),
    themeToggle:     $('#theme-toggle'),
    statsBtn:        $('#stats-btn'),
    statsOverlay:    $('#stats-overlay'),
    statsClose:      $('#stats-close'),
    statsBody:       $('#stats-body'),
    metricArticles:  $('#metric-articles'),
    metricQa:        $('#metric-qa'),
    metricCats:      $('#metric-cats'),
    mainArea:        $('#main-area'),
    articleGrid:     $('#article-grid'),
    emptyState:      $('#empty-state'),
    emptyReset:      $('#empty-reset'),
    // Reader
    readerFrame:     $('#reader-frame'),
    readerBar:       $('#reader-bar'),
    btnBack:         $('#btn-back'),
    downloadPane:    $('#download-pane'),
    readerTitle:     $('#reader-title'),
    readerMeta:      $('#reader-meta'),
    readerAttach:    $('#reader-attachments'),
    iframeWrap:      $('#iframe-wrap'),
    contentIframe:   $('#content-iframe'),
    noHtmlNotice:    $('#no-html-notice'),
    // Hero
    heroSection:     $('#hero-section'),
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

  const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const isExternalUrl = (url) => /^(https?:|mailto:|tel:)/i.test(url);

  // ── 高亮匹配关键字 ──────────────────────────────────
  function highlightText(escapedHtml, query) {
    if (!query) return escapedHtml;
    const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length >= 1);
    if (tokens.length === 0) return escapedHtml;
    let result = escapedHtml;
    tokens.forEach(tok => {
      const re = new RegExp(escapeRegex(tok), 'gi');
      result = result.replace(re, m => `<mark class="hl">${m}</mark>`);
    });
    return result;
  }

  function extractSnippet(text, query, len = 30) {
    if (!text || !query) return '';
    const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length >= 1);
    if (tokens.length === 0) return '';
    const lower = text.toLowerCase();
    let pos = -1;
    for (const tok of tokens) {
      pos = lower.indexOf(tok);
      if (pos >= 0) break;
    }
    if (pos < 0) return '';
    const half = Math.floor(len / 2);
    let start = Math.max(0, pos - half);
    let end = Math.min(text.length, start + len);
    if (end - start < len) start = Math.max(0, end - len);
    let snippet = text.slice(start, end);
    if (start > 0) snippet = '…' + snippet;
    if (end < text.length) snippet = snippet + '…';
    return snippet;
  }

  const formatIcon = (fmt) => {
    if (!fmt) return '附件';
    const icons = { docx:'Word', doc:'Word', pptx:'PPT', ppt:'PPT', pdf:'PDF', xlsx:'Excel', xls:'Excel' };
    return icons[fmt] || String(fmt).toUpperCase();
  };

  const isWordDoc = (fmt) => fmt === 'docx' || fmt === 'doc';

  const getWordViewerUrl = (docUrl) =>
    'https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURIComponent(docUrl);

  function applyAnchorTarget(anchor, href) {
    if (!href) return;
    if (href.startsWith('#')) return;
    if (isExternalUrl(href) || href.startsWith('/')) {
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
    }
  }

  // ── 全文搜索: 在内存索引上做 ─────────────────────────
  function searchMatch(article, query) {
    if (!query) return true;
    const q = query.toLowerCase().trim();
    if (!q) return true;
    const idx = STATE.searchIndex[article.id];
    if (idx) {
      return (
        (idx.title || '').toLowerCase().includes(q) ||
        (idx.summary || '').toLowerCase().includes(q) ||
        (idx.tags || []).some(t => t.toLowerCase().includes(q)) ||
        (idx.content || '').toLowerCase().includes(q)
      );
    }
    return (
      (article.title || '').toLowerCase().includes(q) ||
      (article.summary || '').toLowerCase().includes(q) ||
      (article.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }

  async function buildSearchIndex() {
    if (STATE.searchIndexReady || STATE.searchIndexInflight) return;
    STATE.searchIndexInflight = true;
    const articles = STATE.articles;
    const MAX_CHARS = 80000;
    const task = (a) => fetch(a.html_path, { cache: 'force-cache' })
      .then(r => r.ok ? r.text() : '')
      .then(html => {
        if (!html) return;
        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, ' ')
          .trim();
        STATE.searchIndex[a.id] = {
          title: a.title || '',
          summary: a.summary || '',
          tags: a.tags || [],
          content: text.slice(0, MAX_CHARS),
        };
      })
      .catch(() => {});
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));
    articles.slice(0, 4).forEach(a => task(a));
    idle(() => {
      articles.slice(4).forEach(a => task(a));
      Promise.all(articles.map(a => STATE.searchIndex[a.id] || task(a)))
        .finally(() => {
          STATE.searchIndexReady = true;
          STATE.searchIndexInflight = false;
          if (STATE.searchQuery) applyFilters();
        });
    });
  }

  // ── 渲染: 分类筛选水平条 (新) ─────────────────────────
  function renderCategories() {
    if (!dom.categoryList) return;
    dom.categoryList.innerHTML = '';

    const reportArticles = STATE.articles.filter(a =>
      a.series !== '智慧问答' && a.type !== 'qa'
    );

    // "全部" 按钮
    const allBtn = el('button', 'filter-pill');
    allBtn.dataset.cat = '';
    if (!STATE.activeCategory) allBtn.classList.add('active');
    const allCount = reportArticles.filter(a => a.category !== '其他').length;
    allBtn.innerHTML = `<span class="filter-pill-count">${allCount}</span> 全部`;
    allBtn.addEventListener('click', () => {
      STATE.activeCategory = null;
      renderCategories();
      applyFilters();
    });
    dom.categoryList.appendChild(allBtn);

    // 各分类
    const catCount = {};
    reportArticles.forEach(a => {
      const c = a.category || '其他';
      catCount[c] = (catCount[c] || 0) + 1;
    });
    const ORDER = ['友商调研', '洞察', '战略洞察', 'AI应用', 'AI基础设施', '安全', '技术调研', '其他'];
    const cats = Object.keys(catCount).sort((a, b) => {
      const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b);
      if (ia >= 0 && ib >= 0) return ia - ib;
      if (ia >= 0) return -1;
      if (ib >= 0) return 1;
      return a.localeCompare(b);
    });

    cats.forEach(cat => {
      const btn = el('button', 'filter-pill');
      btn.dataset.cat = cat;
      btn.style.setProperty('--fc', getCategoryColor(cat));
      if (STATE.activeCategory === cat) btn.classList.add('active');
      btn.innerHTML = `${escapeHtml(cat)} <span class="filter-pill-count">${catCount[cat]}</span>`;
      btn.addEventListener('click', () => {
        STATE.activeCategory = STATE.activeCategory === cat ? null : cat;
        renderCategories();
        applyFilters();
      });
      dom.categoryList.appendChild(btn);
    });
  }

  // 抽屉版分类 (手机)
  function renderDrawerCategories() {
    if (!dom.drawerCategoryList) return;
    dom.drawerCategoryList.innerHTML = '';

    const reportArticles = STATE.articles.filter(a =>
      a.series !== '智慧问答' && a.type !== 'qa'
    );

    const allBtn = el('button', 'drawer-mode-btn');
    allBtn.dataset.cat = '';
    if (!STATE.activeCategory) allBtn.classList.add('active');
    allBtn.innerHTML = `全部文章 <span class="badge">${reportArticles.length}</span>`;
    allBtn.addEventListener('click', () => {
      STATE.activeCategory = null;
      renderCategories();
      renderDrawerCategories();
      applyFilters();
      closeDrawer();
    });
    dom.drawerCategoryList.appendChild(allBtn);

    const catCount = {};
    reportArticles.forEach(a => {
      const c = a.category || '其他';
      catCount[c] = (catCount[c] || 0) + 1;
    });
    const ORDER = ['友商调研', '洞察', '战略洞察', 'AI应用', 'AI基础设施', '安全', '技术调研', '其他'];
    const cats = Object.keys(catCount).sort((a, b) => {
      const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b);
      if (ia >= 0 && ib >= 0) return ia - ib;
      if (ia >= 0) return -1;
      if (ib >= 0) return 1;
      return a.localeCompare(b);
    });

    cats.forEach(cat => {
      const btn = el('button', 'drawer-mode-btn');
      btn.dataset.cat = cat;
      if (STATE.activeCategory === cat) btn.classList.add('active');
      btn.innerHTML = `${escapeHtml(cat)} <span class="badge">${catCount[cat]}</span>`;
      btn.addEventListener('click', () => {
        STATE.activeCategory = STATE.activeCategory === cat ? null : cat;
        renderCategories();
        renderDrawerCategories();
        applyFilters();
        closeDrawer();
      });
      dom.drawerCategoryList.appendChild(btn);
    });
  }

  // ── 渲染: 标签云 (横向滚动) ──────────────────────────
  function renderTagCloud() {
    if (!dom.tagCloud) return;
    dom.tagCloud.innerHTML = '';
    const tagCount = {};
    const reportArticles = STATE.articles.filter(a =>
      a.series !== '智慧问答' && a.type !== 'qa'
    );
    reportArticles.forEach(a => (a.tags || []).forEach(t => {
      tagCount[t] = (tagCount[t] || 0) + 1;
    }));

    const tagCategory = {};
    reportArticles.forEach(a => {
      const c = a.category || '其他';
      (a.tags || []).forEach(t => {
        if (!tagCategory[t]) tagCategory[t] = c;
      });
    });

    const sorted = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 24);

    sorted.forEach(([tag, count]) => {
      const btn = el('button', 'tag-chip');
      btn.textContent = `${tag} (${count})`;
      btn.title = `${tag} · ${count} 篇`;
      if (STATE.activeTags.includes(tag)) btn.classList.add('active');
      btn.addEventListener('click', () => {
        STATE.activeTags = STATE.activeTags.includes(tag)
          ? STATE.activeTags.filter(t => t !== tag)
          : [...STATE.activeTags, tag];
        renderTagCloud();
        applyFilters();
      });
      dom.tagCloud.appendChild(btn);
    });

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

    // 标签区显隐
    if (dom.tagCloudWrap) {
      dom.tagCloudWrap.hidden = sorted.length === 0;
    }
  }

  // 抽屉版标签
  function renderDrawerTagCloud() {
    if (!dom.drawerTagCloud) return;
    dom.drawerTagCloud.innerHTML = '';
    const tagCount = {};
    const reportArticles = STATE.articles.filter(a =>
      a.series !== '智慧问答' && a.type !== 'qa'
    );
    reportArticles.forEach(a => (a.tags || []).forEach(t => {
      tagCount[t] = (tagCount[t] || 0) + 1;
    }));
    const sorted = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);
    sorted.forEach(([tag, count]) => {
      const btn = el('button', 'tag-chip');
      btn.textContent = `${tag} (${count})`;
      if (STATE.activeTags.includes(tag)) btn.classList.add('active');
      btn.addEventListener('click', () => {
        STATE.activeTags = STATE.activeTags.includes(tag)
          ? STATE.activeTags.filter(t => t !== tag)
          : [...STATE.activeTags, tag];
        renderTagCloud();
        renderDrawerTagCloud();
        applyFilters();
      });
      dom.drawerTagCloud.appendChild(btn);
    });
  }

  // ── 渲染: Hero 封面文章 (杂志大封面) ──────────────────
  function renderHero(articles) {
    if (!dom.heroSection) return;
    if (!articles || articles.length === 0) {
      dom.heroSection.innerHTML = '';
      dom.heroSection.style.display = 'none';
      return;
    }
    const top = articles[0];  // 最新一篇
    dom.heroSection.style.display = '';

    const heroCard = el('div', 'hero-card');
    heroCard.addEventListener('click', () => openReader(top));

    const body = el('div', 'hero-body');
    const cat = el('span', 'hero-cat');
    cat.textContent = (top.category || '深度调研') + ' · 最新发布';
    body.appendChild(cat);

    const title = el('h1', 'hero-title');
    title.textContent = top.title;
    body.appendChild(title);

    const summary = el('p', 'hero-summary');
    summary.textContent = top.summary || '';
    body.appendChild(summary);

    const meta = el('div', 'hero-meta');
    const date = el('span', 'hero-meta-item');
    date.textContent = `📅 ${formatDateTime(top) || top.date || ''}`;
    meta.appendChild(date);
    if (top.reading_time_min) {
      const read = el('span', 'hero-meta-item');
      read.textContent = `⏱ ${top.reading_time_min} 分钟阅读`;
      meta.appendChild(read);
    }
    if (top.word_count) {
      const words = el('span', 'hero-meta-item');
      words.textContent = `📄 ${formatNum(top.word_count)} 字`;
      meta.appendChild(words);
    }
    body.appendChild(meta);

    const cta = el('div', 'hero-cta');
    cta.textContent = '阅读全文 →';
    body.appendChild(cta);

    heroCard.appendChild(body);
    dom.heroSection.innerHTML = '';
    dom.heroSection.appendChild(heroCard);
  }

  // ── 渲染: 杂志风卡片 ──────────────────────────────────
  function renderGridCard(article) {
    const card = el('article', 'grid-card');
    card.dataset.id = article.id;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `打开文章: ${article.title}`);

    // 顶部色带 (杂志特征)
    const band = el('div', 'grid-card-band');
    band.style.background = getCategoryColor(article.category);
    card.appendChild(band);

    const body = el('div', 'grid-card-body');

    // 顶部元数据: 分类 + 日期
    const meta = el('div', 'grid-card-meta');
    const catColor = getCategoryColor(article.category);
    const catBadge = el('span', 'grid-card-cat');
    catBadge.textContent = article.category || '未分类';
    catBadge.style.setProperty('--cat-bg', catColor + '20');
    catBadge.style.setProperty('--cat-color', catColor);
    meta.appendChild(catBadge);

    if (article.download_only) {
      const dlBadge = el('span', 'card-download-badge');
      dlBadge.textContent = '📦 体积大';
      dlBadge.title = '总体积超过 6MB';
      meta.appendChild(dlBadge);
    }

    const dateEl = el('span', 'grid-card-date');
    dateEl.textContent = formatDateTime(article);
    meta.appendChild(dateEl);
    body.appendChild(meta);

    // 标题 (杂志大字)
    const title = el('h3', 'grid-card-title');
    if (STATE.searchQuery) {
      title.innerHTML = highlightText(escapeHtml(article.title), STATE.searchQuery);
    } else {
      title.textContent = article.title;
    }
    body.appendChild(title);

    // 摘要 (完整 + 渐隐)
    const summary = el('p', 'grid-card-summary');
    const rawSummary = article.summary || '';
    const SUMMARY_TRUNCATE_LEN = 180;
    const willTruncate = rawSummary.length > SUMMARY_TRUNCATE_LEN;
    if (STATE.searchQuery) {
      summary.innerHTML = highlightText(escapeHtml(rawSummary), STATE.searchQuery);
    } else {
      summary.textContent = rawSummary;
    }
    if (willTruncate) summary.classList.add('is-truncated');
    body.appendChild(summary);

    // 展开/收起按钮
    let expandBtn = null;
    if (willTruncate) {
      expandBtn = el('button', 'grid-card-expand');
      expandBtn.type = 'button';
      expandBtn.innerHTML = '展开 <span class="arrow">▼</span>';
      expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = summary.classList.toggle('expanded');
        expandBtn.innerHTML = (isExpanded ? '收起 <span class="arrow">▼</span>' : '展开 <span class="arrow">▼</span>');
      });
      body.appendChild(expandBtn);
    }

    // 搜索片段
    if (STATE.searchQuery) {
      const idx = STATE.searchIndex[article.id];
      const snippet = idx ? extractSnippet(idx.content, STATE.searchQuery, 40) : '';
      if (snippet) {
        const snipEl = el('p', 'match-snippet');
        snipEl.innerHTML = `<span class="snip-label">匹配</span> ${highlightText(escapeHtml(snippet), STATE.searchQuery)}`;
        body.appendChild(snipEl);
      }
    }

    // 标签条
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

    // 底部: 阅读时间 / 字数 / 格式
    const footer = el('div', 'grid-card-footer');
    if (article.reading_time_min) {
      const r = el('span', 'grid-card-read');
      r.textContent = `⏱ ${article.reading_time_min} 分钟`;
      footer.appendChild(r);
    }
    if (article.word_count) {
      const sep = el('span', 'grid-card-sep');
      sep.textContent = '·';
      footer.appendChild(sep);
      const w = el('span', 'grid-card-words');
      w.textContent = `${formatNum(article.word_count)} 字`;
      footer.appendChild(w);
    }
    const fmts = collectFormats(article);
    if (fmts.length) {
      const sep2 = el('span', 'grid-card-sep');
      sep2.textContent = '·';
      footer.appendChild(sep2);
      fmts.slice(0, 3).forEach(f => {
        const b = el('span', 'grid-card-fmt');
        b.textContent = formatIcon(f);
        footer.appendChild(b);
      });
    }
    body.appendChild(footer);

    card.appendChild(body);

    // 卡片错落入场动画 (stagger)
    const idx = Number(card.dataset.idx) || 0;
    card.style.animationDelay = (Math.min(idx, 12) * 0.03) + 's';

    const open = () => openReader(article);
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
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

  function formatDateTime(a) {
    const d = a.date || (a.updated_at ? a.updated_at.slice(0, 10) : '');
    if (!d) return '';
    const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return d;
    return `${m[2]}-${m[3]}`;
  }

  // ── 渲染: 文章列表 (杂志风) ─────────────────────────
  function renderArticleList() {
    dom.articleGrid.innerHTML = '';

    const total = STATE.filtered.length;
    if (total === 0) {
      if (dom.topbarCount) dom.topbarCount.textContent = '0 篇';
      dom.emptyState.classList.remove('hidden');
      dom.articleGrid.style.display = 'none';
      if (dom.heroSection) dom.heroSection.style.display = 'none';
      return;
    }
    dom.emptyState.classList.add('hidden');
    dom.articleGrid.style.display = '';
    if (dom.topbarCount) dom.topbarCount.textContent = `${total} 篇`;

    // 按 date 倒序
    const sorted = sortArticles(STATE.filtered.slice(), STATE.sortMode);

    // 第一篇做 Hero (杂志封面)
    if (dom.heroSection && STATE.viewMode === 'articles' && !STATE.activeCategory && !STATE.searchQuery) {
      renderHero(sorted);
      // 其余做卡片
      sorted.slice(1).forEach((a, idx) => {
        const card = renderGridCard(a);
        card.dataset.idx = idx;
        dom.articleGrid.appendChild(card);
      });
    } else {
      if (dom.heroSection) dom.heroSection.style.display = 'none';
      sorted.forEach((a, idx) => {
        const card = renderGridCard(a);
        card.dataset.idx = idx;
        dom.articleGrid.appendChild(card);
      });
    }
  }

  function sortArticles(arr, mode) {
    const cmp = {
      'date-desc': (a, b) => (b.date || '').localeCompare(a.date || ''),
      'date-asc':  (a, b) => (a.date || '').localeCompare(b.date || ''),
      'words':     (a, b) => (b.word_count || 0) - (a.word_count || 0),
      'reading':   (a, b) => (b.reading_time_min || 0) - (a.reading_time_min || 0),
      'title':     (a, b) => (a.title || '').localeCompare(b.title || ''),
    }[mode] || ((a, b) => (b.date || '').localeCompare(a.date || ''));
    return arr.sort(cmp);
  }

  // ── 应用筛选 ─────────────────────────────────────────
  function applyFilters() {
    STATE.filtered = STATE.articles.filter(a => {
      if (a.series === '智慧问答' || a.type === 'qa') return false;
      const isAllView = !STATE.activeCategory;
      const catMatch = isAllView ? a.category !== '其他' : a.category === STATE.activeCategory;
      const tagMatch = STATE.activeTags.length === 0 || STATE.activeTags.every(t => (a.tags || []).includes(t));
      const searchOK = searchMatch(a, STATE.searchQuery);
      return catMatch && tagMatch && searchOK;
    });
    renderArticleList();
  }

  // ── 抽屉 (手机端) ────────────────────────────────────
  function openDrawer() {
    if (!dom.mobileDrawer) return;
    STATE.drawerOpen = true;
    dom.mobileDrawer.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    if (!dom.mobileDrawer) return;
    STATE.drawerOpen = false;
    dom.mobileDrawer.classList.add('hidden');
    document.body.style.overflow = '';
  }

  // ── Reader ────────────────────────────────────────────
  function openReader(article) {
    STATE.prevHomeScroll = window.scrollY;

    dom.readerTitle.textContent = article.title;
    document.title = `${article.title} | 肥嘟嘟的炼金工厂`;
    setOpenGraphMeta(article);
    dom.readerMeta.innerHTML = `
      <span class="rmeta-cat">${escapeHtml(article.category || '未分类')}</span>
      <span class="rmeta-sep">·</span>
      <span>${escapeHtml(formatDateTime(article))}</span>
      <span class="rmeta-sep">·</span>
      <span>${escapeHtml((article.tags || []).join('、'))}</span>
    `;

    dom.readerAttach.innerHTML = '';
    if (article.download_only) {
      dom.readerAttach.classList.add('hidden');
    } else {
      dom.readerAttach.classList.remove('hidden');
      (article.attachments || []).forEach(att => {
        const btn = document.createElement('a');
        btn.className = `attach-btn attach-${att.format}`;
        btn.href = att.path.startsWith('/') ? att.path : '/' + att.path;
        btn.download = att.name;
        btn.target = '_blank';
        btn.rel = 'noopener noreferrer';
        btn.textContent = `📥 ${att.name}`;
        dom.readerAttach.appendChild(btn);
      });
    }

    if (article.download_only) {
      dom.contentIframe.classList.add('hidden');
      dom.noHtmlNotice.classList.add('hidden');
      renderDownloadOnlyPane(article);
      dom.downloadPane.classList.remove('hidden');
    } else if (article.html_path) {
      dom.contentIframe.src = article.html_path;
      dom.contentIframe.classList.remove('hidden');
      dom.noHtmlNotice.classList.add('hidden');
      if (dom.downloadPane) dom.downloadPane.classList.add('hidden');
      dom.contentIframe.addEventListener('load', () => injectArticleToc(), { once: true });
    } else {
      const wordAtt = (article.attachments || []).find(att => isWordDoc(att.format));
      if (wordAtt) {
        dom.contentIframe.classList.add('hidden');
        dom.noHtmlNotice.classList.remove('hidden');
        if (dom.downloadPane) dom.downloadPane.classList.add('hidden');
        const noticeEl = dom.noHtmlNotice.querySelector('.notice-inner');
        if (noticeEl) {
          noticeEl.innerHTML = `
            <div class="notice-icon">📄</div>
            <p>本文档为 Word 格式</p>
            <a href="${getWordViewerUrl(wordAtt.path)}" target="_blank" rel="noopener noreferrer" class="word-view-btn">在线查看 Word</a>
            <p style="margin-top:8px;font-size:12px;color:#999">或点击右上角下载按钮获取文件</p>
          `;
        }
      } else {
        dom.contentIframe.classList.add('hidden');
        dom.noHtmlNotice.classList.remove('hidden');
        if (dom.downloadPane) dom.downloadPane.classList.add('hidden');
      }
    }

    dom.appShell.classList.add('hidden');
    dom.readerFrame.classList.remove('hidden');
    closeDrawer();
    window.scrollTo(0, 0);

    STATE.mode = 'READER';
    window.location.hash = `article/${article.id}`;
  }

  function renderDownloadOnlyPane(article) {
    if (!dom.downloadPane) return;
    const summary = article.summary || '（暂无摘要）';
    const totalSize = (article.total_size_mb || '?');
    const chapters = article.chapters || '?';
    const wordCount = article.word_count ? formatNum(article.word_count) : '?';
    const imgCount = article.image_count || '?';
    const refCount = article.references_count || '?';
    const readingMin = article.reading_time_min || article.reading_time_minutes || '—';
    const tags = (article.tags || []).slice(0, 8);
    const tagsHtml = tags.map(t => `<span class="dl-tag">${escapeHtml(t)}</span>`).join('');

    const atts = (article.attachments || []).filter(a => a.format === 'zip' || /\.zip$/i.test(a.path || a.name || ''));
    const attsHtml = atts.map((a, i) => {
      const sizeMb = (a.size_mb != null) ? a.size_mb : ((a.size_bytes || 0) / 1024 / 1024).toFixed(1);
      const sizeTxt = sizeMb >= 1 ? `${(+sizeMb).toFixed(1)} MB` : `${Math.round((sizeMb||0)*1024)} KB`;
      const isImgPart = /images|图|images-p/i.test(a.name || '');
      const icon = isImgPart ? '🖼️' : (i === 0 ? '📄' : '📦');
      const desc = a.description || (isImgPart ? '图片资源包' : 'HTML 主页 + 元数据');
      const href = a.path.startsWith('/') ? a.path : '/' + a.path;
      return `
        <a class="dl-attach-btn dl-attach-${a.format || 'zip'}" href="${escapeHtml(href)}" download="${escapeHtml(a.name || '')}" target="_blank" rel="noopener noreferrer">
          <span class="dl-attach-icon">${icon}</span>
          <span class="dl-attach-body">
            <span class="dl-attach-name">${escapeHtml(a.name || ('附件 ' + (i+1)))}</span>
            <span class="dl-attach-meta">${sizeTxt} · ${escapeHtml(desc)}</span>
          </span>
          <span class="dl-attach-go">下载 ↓</span>
        </a>`;
    }).join('');

    dom.downloadPane.innerHTML = `
      <article class="dl-article">
        <header class="dl-hero">
          <div class="dl-hero-top">
            <span class="dl-cat" style="background:${escapeHtml(getCategoryColor(article.category))}">${escapeHtml(article.category || '未分类')}</span>
            <span class="dl-size-badge">📦 体积大 · ${totalSize} MB</span>
          </div>
          <h1 class="dl-title">${escapeHtml(article.title)}</h1>
          <div class="dl-meta">
            <span>📅 ${escapeHtml(formatDateTime(article))}</span>
            <span>·</span>
            <span>⏱ ${escapeHtml(String(readingMin))} 分钟</span>
            <span>·</span>
            <span>🏷 ${tags.length} 标签</span>
          </div>
        </header>
        <section class="dl-summary">
          <h2 class="dl-h2">📋 内容摘要</h2>
          <div class="dl-summary-body">${escapeHtml(summary)}</div>
        </section>
        ${tagsHtml ? `<section class="dl-tags-section"><h2 class="dl-h2">🏷 主题标签</h2><div class="dl-tags">${tagsHtml}</div></section>` : ''}
        <section class="dl-downloads">
          <h2 class="dl-h2">📥 下载完整文章包</h2>
          <div class="dl-attach-list">${attsHtml || '<p class="dl-empty">（未配置附件）</p>'}</div>
        </section>
      </article>
    `;
  }

  function closeReader() {
    dom.readerFrame.classList.add('hidden');
    dom.readerTitle.textContent = '';
    dom.readerMeta.innerHTML = '';
    dom.readerAttach.innerHTML = '';
    dom.contentIframe.src = 'about:blank';
    if (dom.downloadPane) {
      dom.downloadPane.classList.add('hidden');
      dom.downloadPane.innerHTML = '';
    }
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
    document.title = '肥嘟嘟的炼金工厂 · 调研报告与白皮书';
    setOpenGraphMeta(null);
    STATE.mode = 'HOME';
    applyFilters();
    window.location.hash = '';
  }

  // ── 文章 TOC 自动生成 ───────────────────────────────
  function injectArticleToc() {
    const iframe = dom.contentIframe;
    if (!iframe || !iframe.contentDocument) return;
    const doc = iframe.contentDocument;
    const oldToc = doc.getElementById('hacms-auto-toc');
    if (oldToc) oldToc.remove();
    const oldBtn = doc.getElementById('hacms-toc-toggle');
    if (oldBtn) oldBtn.remove();

    const heads = Array.from(doc.querySelectorAll('h2, h3'));
    if (heads.length === 0) return;

    heads.forEach((h, i) => {
      if (!h.id) {
        const text = (h.textContent || '').trim();
        const id = 'auto-h-' + i + '-' + text.replace(/[^\w一-鿿]+/g, '-').substring(0, 40).toLowerCase();
        h.id = id;
      }
    });

    const toc = doc.createElement('aside');
    toc.id = 'hacms-auto-toc';
    toc.setAttribute('aria-label', '文章目录');
    const h2Count = heads.filter(h => h.tagName === 'H2').length;
    toc.innerHTML = `
      <style>
        #hacms-auto-toc { position: fixed; top: 90px; right: 16px; width: 220px; max-height: calc(100vh - 120px); overflow-y: auto; background: rgba(255,255,255,0.94); backdrop-filter: blur(8px); border: 1px solid #F0E5E8; border-radius: 12px; padding: 14px 16px; box-shadow: 0 4px 16px rgba(220,57,113,0.08); font-family: system-ui, -apple-system, "PingFang SC", sans-serif; font-size: 12px; z-index: 9999; }
        #hacms-auto-toc::-webkit-scrollbar { width: 4px; }
        #hacms-auto-toc::-webkit-scrollbar-thumb { background: #F3B3CC; border-radius: 2px; }
        #hacms-toc-toggle { position: fixed; top: 80px; right: 16px; z-index: 9999; background: linear-gradient(135deg, #DC3971 0%, #EC719F 100%); color: #fff; border: none; padding: 6px 12px; border-radius: 16px; font-size: 11px; cursor: pointer; box-shadow: 0 2px 8px rgba(220,57,113,0.15); font-family: system-ui, sans-serif; }
        #hacms-auto-toc.collapsed { display: none; }
        #hacms-auto-toc .toc-h-title { font-weight: 700; font-size: 11px; color: #9A9AA6; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #F0E5E8; }
        #hacms-auto-toc .toc-h-count { color: #DC3971; }
        #hacms-auto-toc ul { list-style: none; padding: 0; margin: 0; }
        #hacms-auto-toc li { margin: 5px 0; line-height: 1.4; }
        #hacms-auto-toc a { color: #5A5A66; text-decoration: none; display: block; padding: 3px 6px; border-radius: 4px; border-left: 2px solid transparent; transition: all 0.2s; }
        #hacms-auto-toc a:hover { background: rgba(220,57,113,0.08); color: #1A1A1F; border-left-color: #DC3971; }
        #hacms-auto-toc .toc-h3 a { padding-left: 18px; font-size: 11px; color: #9A9AA6; }
        @media (max-width: 1024px) { #hacms-auto-toc { display: none; } #hacms-toc-toggle { display: none; } }
      </style>
      <div class="toc-h-title">📑 章节目录 · <span class="toc-h-count">${h2Count} 章</span></div>
      <ul>
        ${heads.map(h => {
          const text = (h.textContent || '').trim().substring(0, 50);
          return `<li class="toc-${h.tagName.toLowerCase()}"><a href="#${h.id}">${text}</a></li>`;
        }).join('')}
      </ul>
    `;

    const toggle = doc.createElement('button');
    toggle.id = 'hacms-toc-toggle';
    toggle.textContent = `📑 目录`;
    toggle.title = '显示/隐藏文章目录';
    toggle.addEventListener('click', () => {
      toc.classList.toggle('collapsed');
    });

    doc.body.appendChild(toc);
    doc.body.appendChild(toggle);
  }

  // ── Open Graph meta 动态切换 ──────────────────────────
  function setOpenGraphMeta(article) {
    const title = article ? article.title : '肥嘟嘟的炼金工厂 · 调研报告与白皮书';
    const desc = article
      ? (article.summary || '').slice(0, 120)
      : '深度调研报告与白皮书 · 涵盖 AI 基础设施 / 存储安全 / 勒索防御 / 数据安全';
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

  // ── 统计弹层 ──────────────────────────────────────────
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

  // ── 搜索 debounce ────────────────────────────────────
  let searchDebounceTimer = null;
  function onSearchInput(value) {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      STATE.searchQuery = value.trim();
      applyFilters();
    }, 100);
  }

  // ── 事件绑定 ─────────────────────────────────────────
  function bindEvents() {
    dom.btnBack.addEventListener('click', closeReader);

    if (dom.mobileToggle) {
      dom.mobileToggle.addEventListener('click', openDrawer);
    }
    if (dom.drawerClose) {
      dom.drawerClose.addEventListener('click', closeDrawer);
    }

    dom.searchInput.addEventListener('input', (e) => {
      onSearchInput(e.target.value);
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

    // 暗色模式
    const THEME_KEY = 'hacms-theme';
    const applyTheme = (mode) => {
      document.documentElement.setAttribute('data-theme', mode);
      try { localStorage.setItem(THEME_KEY, mode); } catch (_) {}
    };
    const savedTheme = (() => { try { return localStorage.getItem(THEME_KEY); } catch (_) { return null; } })();
    if (savedTheme === 'dark') applyTheme('dark');
    if (dom.themeToggle) {
      dom.themeToggle.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme');
        applyTheme(cur === 'dark' ? 'light' : 'dark');
      });
    }

    if (dom.emptyReset) {
      dom.emptyReset.addEventListener('click', () => {
        STATE.activeCategory = null;
        STATE.activeTags = [];
        STATE.searchQuery = '';
        STATE.sortMode = 'date-desc';
        dom.searchInput.value = '';
        dom.sortSelect.value = 'date-desc';
        renderCategories();
        renderTagCloud();
        renderDrawerCategories();
        renderDrawerTagCloud();
        applyFilters();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (dom.statsOverlay.classList.contains('visible')) { closeStats(); return; }
        if (STATE.drawerOpen) { closeDrawer(); return; }
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

  // ── 初始化 ─────────────────────────────────────────
  const MANIFEST_VERSION_KEY = 'hacms.manifest.version';

  function parseManifestResponse(data) {
    if (Array.isArray(data)) return { articles: data, version: null };
    if (data && typeof data === 'object' && Array.isArray(data.articles)) {
      return { articles: data.articles, version: data._meta && data._meta.version || null };
    }
    return { articles: [], version: null };
  }

  function bustCache(url, version) {
    if (!version) return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}v=${encodeURIComponent(version)}`;
  }

  async function init() {
    bindEvents();
    bindQaEvents();

    let cachedVersion = null;
    try {
      cachedVersion = localStorage.getItem(MANIFEST_VERSION_KEY);
    } catch (e) { /* localStorage 不可用 */ }

    try {
      const lightUrl = bustCache('content/index/manifest-light.json', cachedVersion);
      let r = await fetch(lightUrl, { cache: 'no-store' }).then(r => r.ok ? r : null);
      if (!r) {
        const fullUrl = bustCache('content/index/manifest.json', cachedVersion);
        r = await fetch(fullUrl, { cache: 'no-store' }).then(r => r.ok ? r : null);
      }
      if (!r) throw new Error('manifest-light.json 和 manifest.json 都 404');

      const raw = await r.json();
      const parsed = parseManifestResponse(raw);
      STATE.articles = parsed.articles;

      const serverVersion = parsed.version;
      if (serverVersion) {
        if (cachedVersion && cachedVersion !== serverVersion) {
          try {
            if ('caches' in window) {
              caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
            }
          } catch (e) { /* ignore */ }
        }
        try { localStorage.setItem(MANIFEST_VERSION_KEY, serverVersion); } catch (e) {}
      }
    } catch (e) {
      STATE.articles = [];
      console.warn('[肥嘟嘟的炼金工厂] manifest.json 加载失败:', e.message);
    }

    STATE.filtered = [...STATE.articles];
    STATE.qaList = STATE.articles.filter(a => a.series === '智慧问答' || a.type === 'qa');
    STATE.qaFiltered = [...STATE.qaList];

    const articleTotal = STATE.articles.length - STATE.qaList.length;
    const topbarTotal = STATE.articles.filter(a =>
      a.series !== '智慧问答' && a.type !== 'qa' && a.category !== '其他'
    ).length;
    if (dom.topbarCount) dom.topbarCount.textContent = `${topbarTotal} 篇`;

    if (dom.modeArticlesCount) dom.modeArticlesCount.textContent = articleTotal;
    if (dom.modeQaCount) dom.modeQaCount.textContent = STATE.qaList.length;

    if (dom.footerArticleCount) dom.footerArticleCount.textContent = articleTotal;
    if (dom.footerQaCount) dom.footerQaCount.textContent = STATE.qaList.length;

    const qaTotal = STATE.qaList.length;
    const catTotal = new Set(STATE.articles.filter(a => a.series !== '智慧问答' && a.type !== 'qa').map(a => a.category)).size;
    if (dom.metricArticles) dom.metricArticles.textContent = articleTotal;
    if (dom.metricQa) dom.metricQa.textContent = qaTotal;
    if (dom.metricCats) dom.metricCats.textContent = catTotal;

    renderCategories();
    renderTagCloud();
    renderDrawerCategories();
    renderDrawerTagCloud();

    const hash = window.location.hash;
    if (hash.startsWith('#article/')) {
      const id = hash.replace('#article/', '');
      const article = STATE.articles.find(a => a.id === id);
      if (article) {
        applyFilters();
        openReader(article);
        buildSearchIndex();
        return;
      }
    }

    if (hash.startsWith('#qa/') || hash === '#qa') {
      const qaId = hash.replace('#qa/', '').replace('#qa', '');
      switchToQaView();
      if (qaId) {
        const qa = STATE.qaList.find(q => q.id === qaId);
        if (qa) openQaReader(qa);
      }
      return;
    }

    if (hash === '#markets') {
      switchToMarketsView();
      return;
    }

    applyFilters();
    buildSearchIndex();
  }

  init();

  // ═══════════════════════════════════════════════════════
  // 智慧问答模块 v1
  // ═══════════════════════════════════════════════════════

  function switchToArticlesView() {
    STATE.viewMode = 'articles';
    if (dom.articlesView) dom.articlesView.classList.remove('hidden');
    if (dom.qaView) dom.qaView.classList.add('hidden');
    if (dom.marketsView) dom.marketsView.classList.add('hidden');
    document.body.classList.remove('qa-view-active', 'markets-view-active');
    if (dom.modeArticlesBtn) {
      dom.modeArticlesBtn.classList.add('active');
      dom.modeArticlesBtn.setAttribute('aria-selected', 'true');
    }
    if (dom.modeQaBtn) {
      dom.modeQaBtn.classList.remove('active');
      dom.modeQaBtn.setAttribute('aria-selected', 'false');
    }
    if (dom.modeMarketsBtn) {
      dom.modeMarketsBtn.classList.remove('active');
      dom.modeMarketsBtn.setAttribute('aria-selected', 'false');
    }
    if (dom.topbarCount) {
      dom.topbarCount.textContent = `${STATE.articles.length - STATE.qaList.length} 篇调研`;
    }
    renderArticleList();
  }

  function switchToQaView() {
    STATE.viewMode = 'qa';
    if (dom.articlesView) dom.articlesView.classList.add('hidden');
    if (dom.qaView) dom.qaView.classList.remove('hidden');
    if (dom.marketsView) dom.marketsView.classList.add('hidden');
    document.body.classList.add('qa-view-active');
    if (dom.modeArticlesBtn) {
      dom.modeArticlesBtn.classList.remove('active');
      dom.modeArticlesBtn.setAttribute('aria-selected', 'false');
    }
    if (dom.modeQaBtn) {
      dom.modeQaBtn.classList.add('active');
      dom.modeQaBtn.setAttribute('aria-selected', 'true');
    }
    if (dom.modeMarketsBtn) {
      dom.modeMarketsBtn.classList.remove('active');
      dom.modeMarketsBtn.setAttribute('aria-selected', 'false');
    }
    if (dom.topbarCount) {
      dom.topbarCount.textContent = `${STATE.qaList.length} 个问答`;
    }
    renderQaList();
  }

  function switchToMarketsView() {
    STATE.viewMode = 'markets';
    if (dom.articlesView) dom.articlesView.classList.add('hidden');
    if (dom.qaView) dom.qaView.classList.add('hidden');
    if (dom.marketsView) dom.marketsView.classList.remove('hidden');
    document.body.classList.add('markets-view-active');
    if (dom.modeArticlesBtn) {
      dom.modeArticlesBtn.classList.remove('active');
      dom.modeArticlesBtn.setAttribute('aria-selected', 'false');
    }
    if (dom.modeQaBtn) {
      dom.modeQaBtn.classList.remove('active');
      dom.modeQaBtn.setAttribute('aria-selected', 'false');
    }
    if (dom.modeMarketsBtn) {
      dom.modeMarketsBtn.classList.add('active');
      dom.modeMarketsBtn.setAttribute('aria-selected', 'true');
    }
    if (dom.topbarCount) {
      dom.topbarCount.textContent = `世界金融分析`;
    }
  }

  function bindQaEvents() {
    if (dom.modeArticlesBtn) {
      dom.modeArticlesBtn.addEventListener('click', () => {
        switchToArticlesView();
        window.location.hash = '';
      });
    }
    if (dom.modeQaBtn) {
      dom.modeQaBtn.addEventListener('click', () => {
        switchToQaView();
        window.location.hash = '#qa';
      });
    }
    if (dom.modeMarketsBtn) {
      dom.modeMarketsBtn.addEventListener('click', () => {
        switchToMarketsView();
        window.location.hash = '#markets';
      });
    }

    // 抽屉版模式切换
    dom.drawerModeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        if (mode === 'articles') {
          switchToArticlesView();
          window.location.hash = '';
        } else if (mode === 'qa') {
          switchToQaView();
          window.location.hash = '#qa';
        } else if (mode === 'markets') {
          switchToMarketsView();
          window.location.hash = '#markets';
        }
        closeDrawer();
      });
    });

    if (dom.qaSearchInput) {
      let timer = null;
      dom.qaSearchInput.addEventListener('input', (e) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          STATE.qaSearchQuery = e.target.value.trim();
          applyQaFilters();
        }, 100);
      });
    }
    if (dom.qaSortSelect) {
      dom.qaSortSelect.addEventListener('change', (e) => {
        STATE.qaSortMode = e.target.value;
        renderQaList();
      });
    }
  }

  function applyQaFilters() {
    STATE.qaFiltered = STATE.qaList.filter(q => {
      const tagMatch = STATE.activeQaTags.length === 0 || STATE.activeQaTags.every(t => (q.qa_tags || q.tags || []).includes(t));
      const searchMatch = !STATE.qaSearchQuery ||
        (q.question || q.title || '').toLowerCase().includes(STATE.qaSearchQuery.toLowerCase()) ||
        (q.summary || '').toLowerCase().includes(STATE.qaSearchQuery.toLowerCase()) ||
        (q.qa_tags || q.tags || []).some(t => t.toLowerCase().includes(STATE.qaSearchQuery.toLowerCase()));
      return tagMatch && searchMatch;
    });
    renderQaList();
  }

  function renderQaTagCloud() {
    if (!dom.qaTagCloud) return;
    dom.qaTagCloud.innerHTML = '';
    const tagCount = {};
    STATE.qaList.forEach(q => {
      (q.qa_tags || q.tags || []).forEach(t => {
        tagCount[t] = (tagCount[t] || 0) + 1;
      });
    });
    const sorted = Object.entries(tagCount).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    if (sorted.length === 0) {
      dom.qaTagCloud.style.display = 'none';
      return;
    }
    dom.qaTagCloud.style.display = '';
    sorted.forEach(([tag, count]) => {
      const btn = el('button', 'qa-tag-cloud-item');
      btn.textContent = `${tag} (${count})`;
      btn.title = `${tag} · ${count} 个问答`;
      if (STATE.activeQaTags.includes(tag)) btn.classList.add('active');
      btn.addEventListener('click', () => {
        STATE.activeQaTags = STATE.activeQaTags.includes(tag)
          ? STATE.activeQaTags.filter(t => t !== tag)
          : [...STATE.activeQaTags, tag];
        renderQaTagCloud();
        applyQaFilters();
      });
      dom.qaTagCloud.appendChild(btn);
    });
  }

  function renderQaList() {
    if (!dom.qaGrid) return;
    dom.qaGrid.innerHTML = '';

    renderQaTagCloud();

    const list = STATE.qaFiltered.slice();
    const cmp = {
      'date-desc': (a, b) => (b.date || '').localeCompare(a.date || ''),
      'date-asc':  (a, b) => (a.date || '').localeCompare(a.date || ''),
    }[STATE.qaSortMode] || ((a, b) => (b.date || '').localeCompare(a.date || ''));
    list.sort(cmp);

    if (list.length === 0) {
      dom.qaGrid.style.display = 'none';
      if (dom.qaEmpty) dom.qaEmpty.classList.remove('hidden');
      return;
    }
    dom.qaGrid.style.display = '';
    if (dom.qaEmpty) dom.qaEmpty.classList.add('hidden');

    list.forEach((q, idx) => {
      const card = renderQaCard(q, idx + 1);
      dom.qaGrid.appendChild(card);
    });
  }

  function renderQaCard(q, num) {
    const card = el('article', 'qa-card');
    card.dataset.id = q.id;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `打开问答: ${q.question || q.title}`);

    const header = el('div', 'qa-card-header');
    const qBadge = el('span', 'qa-card-q');
    qBadge.textContent = 'Q';
    header.appendChild(qBadge);
    const numBadge = el('span', 'qa-card-num');
    numBadge.textContent = `问答 #${num}`;
    header.appendChild(numBadge);
    const dateEl = el('span', 'qa-card-date');
    const d = (q.date || '').slice(0, 10);
    if (d) {
      const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
      dateEl.textContent = m ? `${m[1]}-${m[2]}-${m[3]}` : d;
    }
    header.appendChild(dateEl);
    card.appendChild(header);

    const question = el('h3', 'qa-card-question');
    question.textContent = q.question || q.title || '';
    card.appendChild(question);

    if (q.summary) {
      const preview = el('p', 'qa-card-answer-preview');
      preview.textContent = q.summary.length > 200 ? q.summary.slice(0, 200) + '…' : q.summary;
      card.appendChild(preview);
    }

    const tags = q.qa_tags || q.tags || [];
    if (tags.length) {
      const tagsRow = el('div', 'qa-card-tags');
      tags.slice(0, 6).forEach(t => {
        const tEl = el('span', 'qa-card-tag');
        tEl.textContent = t;
        tagsRow.appendChild(tEl);
      });
      card.appendChild(tagsRow);
    }

    const footer = el('div', 'qa-card-footer');
    const stats = el('div', 'qa-card-stats');
    if (q.references_count) {
      const refItem = el('span', 'qa-card-stat-item');
      refItem.textContent = `📚 ${q.references_count} 引用`;
      stats.appendChild(refItem);
    }
    if (q.word_count) {
      const wItem = el('span', 'qa-card-stat-item');
      wItem.textContent = `📄 ${(q.word_count / 1000).toFixed(1)}k 字`;
      stats.appendChild(wItem);
    }
    if (q.reading_time_min) {
      const rItem = el('span', 'qa-card-stat-item');
      rItem.textContent = `⏱ ${q.reading_time_min} 分钟`;
      stats.appendChild(rItem);
    }
    footer.appendChild(stats);
    const hint = el('span', 'qa-card-open-hint');
    hint.textContent = '点击查看完整调研 →';
    footer.appendChild(hint);
    card.appendChild(footer);

    const open = () => openQaReader(q);
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });

    return card;
  }

  function openQaReader(q) {
    if (!q.html_path) return;
    location.assign(q.html_path);
  }

  // ═══════════════════════════════════════════════════════
  // V3 增强模块
  // ═══════════════════════════════════════════════════════
  initV3Features();

  function initV3Features() {
    enhanceReaderWithRelated();
    enhanceHashRouter();
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
      panel.style.cssText = 'position:fixed;right:0;top:0;bottom:0;width:280px;background:#FCFAFB;border-left:1px solid #F0E5E8;overflow-y:auto;padding:16px 14px;font-size:12.5px;line-height:1.6;color:#1A1A1F;z-index:150;display:none;';
      document.body.appendChild(panel);

      function buildPanel() {
        let html = '<div style="font-weight:700;font-size:13px;margin-bottom:10px;color:#DC3971;">📑 导航</div>';

        if (prev || next) {
          html += '<div style="display:flex;gap:6px;margin-bottom:16px;">';
          if (prev) html += `<a href="#article/${prev.id}" style="flex:1;padding:6px 8px;background:#fff;border:1px solid #F0E5E8;border-radius:4px;text-decoration:none;color:#5A5A66;font-size:11.5px;">← ${escapeHtml(prev.title.slice(0, 18))}</a>`;
          if (next) html += `<a href="#article/${next.id}" style="flex:1;padding:6px 8px;background:#fff;border:1px solid #F0E5E8;border-radius:4px;text-decoration:none;color:#5A5A66;font-size:11.5px;text-align:right;">${escapeHtml(next.title.slice(0, 18))} →</a>`;
          html += '</div>';
        }

        if (article.series) {
          html += `<div style="font-weight:700;font-size:13px;margin:14px 0 6px;color:#DC3971;">📚 系列：${escapeHtml(article.series)}</div>`;
          html += '<div style="display:flex;flex-direction:column;gap:5px;margin-bottom:14px;">';
          for (const sa of seriesArts.slice(0, 6)) {
            html += `<a href="#article/${sa.id}" target="_blank" rel="noopener noreferrer" style="padding:5px 8px;background:rgba(220,57,113,0.06);border-radius:4px;text-decoration:none;color:#1A1A1F;font-size:11.5px;">${escapeHtml(sa.title)}</a>`;
          }
          html += '</div>';
        }

        if (relatedArts.length) {
          html += '<div style="font-weight:700;font-size:13px;margin:14px 0 6px;color:#DC3971;">🔗 相关文章</div>';
          html += '<div style="display:flex;flex-direction:column;gap:5px;">';
          for (const ra of relatedArts) {
            html += `<a href="#article/${ra.id}" target="_blank" rel="noopener noreferrer" style="padding:5px 8px;background:#fff;border:1px solid #F0E5E8;border-radius:4px;text-decoration:none;color:#5A5A66;font-size:11.5px;">${escapeHtml(ra.title)}</a>`;
          }
          html += '</div>';
        }

        html += '<div style="margin-top:18px;padding-top:12px;border-top:1px solid #F0E5E8;color:#9A9AA6;font-size:10.5px;">⌨ 快捷键：n/p 翻页 · t 关闭面板</div>';
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
        toggle.style.cssText = 'position:fixed;right:12px;bottom:60px;width:40px;height:40px;border-radius:50%;background:#DC3971;color:#fff;border:none;font-size:18px;cursor:pointer;box-shadow:0 2px 8px rgba(220,57,113,0.3);z-index:160;';
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
    overlay.style.cssText = 'position:fixed;left:0;right:0;top:0;bottom:0;background:#FCFAFB;z-index:300;overflow-y:auto;padding:24px 36px;';
    overlay.innerHTML = `
      <div style="max-width:1280px;margin:0 auto;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #DC3971;">
          <h1 style="font-size:24px;color:#DC3971;margin:0;">${escapeHtml(title)}</h1>
          <a href="#" id="v3-collection-close" style="padding:6px 16px;background:#fff;border:1px solid #F0E5E8;border-radius:6px;text-decoration:none;color:#5A5A66;">← 返回首页</a>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;">
          ${filtered.map(a => `
            <a href="#article/${a.id}" style="background:#fff;border:1px solid #F0E5E8;border-radius:8px;padding:14px;text-decoration:none;color:inherit;display:block;">
              <div style="font-size:11px;color:#9A9AA6;margin-bottom:6px;">${escapeHtml(a.category || '')} · ${escapeHtml(formatDateTime(a))}</div>
              <div style="font-size:14px;font-weight:600;color:#1A1A1F;margin-bottom:6px;line-height:1.4;">${escapeHtml(a.title)}</div>
              <div style="font-size:12px;color:#5A5A66;line-height:1.5;">${escapeHtml((a.summary || '').slice(0, 80))}${(a.summary || '').length > 80 ? '…' : ''}</div>
              ${a.tags && a.tags.length ? `<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px;">${a.tags.slice(0, 3).map(t => `<span style="background:rgba(236,113,159,0.12);color:#5A5A66;padding:1px 8px;border-radius:10px;font-size:10.5px;">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
            </a>
          `).join('')}
        </div>
        ${filtered.length === 0 ? '<p style="color:#9A9AA6;">没有匹配的文章。</p>' : ''}
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