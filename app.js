/**
 * app.js — 肥嘟嘟的炼金工厂 v5
 *
 * 变更:
 * - 排序: 严格按文章 date (YYYY-MM-DD) 字段, 模式改为 date-desc / date-asc
 * - Hero: 不再显示"精选", 而是最新 2 篇 (badge 文字改为"最新")
 * - 卡片: 去掉左缩略图占位, 改用顶部细色条 + 分类徽章
 * - 搜索: 全文索引 + 高亮 + 摘要片段
 * - 标签: 词云样式, 字号按频次缩放
 * - 外部链接: target=_blank; 内部锚点保持当前页
 */

(function () {
  'use strict';


  // ── 全局状态 ──────────────────────────────────────────
  const STATE = {
    mode: 'HOME',
    sidebarOpen: false,
    viewMode: 'articles',  // 'articles' | 'qa' — 视图模式
    articles: [],
    qaList: [],            // 问答列表 (从 articles 过滤 type=='qa')
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
    thumbCache: {},      // { articleId: 'path/to/img.png' | null }
    thumbInflight: {},   // 防重复探测
    searchIndex: {},     // { articleId: { title, summary, tags, content } }
    searchIndexReady: false,
    searchIndexInflight: false,
  };

  // ── 分类颜色映射 ─────────────────────────────────────
  const CATEGORY_COLORS = {
    '洞察':         '#d4a574',  // 金/橙
    '战略洞察':     '#8b7ab8',  // 紫
    'AI应用':       '#5fb3a1',  // 青
    'AI基础设施':   '#4a7fb8',  // 蓝
    '安全':         '#c97b7b',  // 红
    '技术调研':     '#7a8a99',  // 灰蓝
    '其他':         '#9a9690',  // 灰
  };
  const DEFAULT_CATEGORY_COLOR = '#9a9690';

  function getCategoryColor(category) {
    return CATEGORY_COLORS[category] || DEFAULT_CATEGORY_COLOR;
  }

  // ── DOM 引用 ──────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    appShell:        $('#app-shell'),
    sidebar:         $('#sidebar'),
    sidebarOverlay:  $('#sidebar-overlay'),
    sidebarClose:    $('#sidebar-close'),
    menuToggle:      $('#menu-toggle'),
    modeArticlesBtn: $('#mode-articles'),
    modeQaBtn:       $('#mode-qa'),
    modeMarketsBtn:  $('#mode-markets'),
    modeArticlesCount: $('#mode-articles-count'),
    modeQaCount:     $('#mode-qa-count'),
    articlesView:    $('#articles-view'),
    qaView:          $('#qa-view'),
    marketsView:     $('#markets-view'),
    categoryList:    $('#category-list'),
    tagCloud:        $('#tag-cloud'),
    tagsClear:       $('#tags-clear'),
    qaTagCloud:      $('#qa-tag-cloud'),
    qaGrid:          $('#qa-grid'),
    qaEmpty:         $('#qa-empty'),
    qaSearchInput:   $('#qa-search-input'),
    qaSortSelect:    $('#qa-sort-select'),
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

  // 转义正则元字符
  const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 外部 URL 判断 (http/https/mailto/相对协议)
  const isExternalUrl = (url) => /^(https?:|mailto:|tel:)/i.test(url);

  // ── 高亮匹配关键字 → 返回带 <mark> 包裹的 HTML ──────────
  // 注: 输入 text 必须是已 escape 过的 HTML 字符串
  function highlightText(escapedHtml, query) {
    if (!query) return escapedHtml;
    const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length >= 1);
    if (tokens.length === 0) return escapedHtml;
    // 注意: 高亮标记要避开已存在的标签, 这里简化处理: 对 textContent 风格字符串加 mark
    // 由于传入的是已 escape 的纯文本 (无标签), 直接 replace 即可
    let result = escapedHtml;
    tokens.forEach(tok => {
      const re = new RegExp(escapeRegex(tok), 'gi');
      result = result.replace(re, m => `<mark class="hl">${m}</mark>`);
    });
    return result;
  }

  // 从纯文本中抽取包含 query 的 30 字片段
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

  // 工具: 给 <a> 标签加 target=_blank (外部) / 保持当前页 (内部锚点)
  function applyAnchorTarget(anchor, href) {
    if (!href) return;
    if (href.startsWith('#')) {
      // 内部锚点: 保持当前页
      return;
    }
    if (isExternalUrl(href) || href.startsWith('/')) {
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
    }
  }

  // 全文搜索: 同步在内存索引上做
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
    // 索引未就绪: 退回到只搜 title/summary/tags
    return (
      (article.title || '').toLowerCase().includes(q) ||
      (article.summary || '').toLowerCase().includes(q) ||
      (article.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }

  // ── 全文搜索索引 (后台构建, 不阻塞首屏) ──────────────
  async function buildSearchIndex() {
    if (STATE.searchIndexReady || STATE.searchIndexInflight) return;
    STATE.searchIndexInflight = true;
    const articles = STATE.articles;
    // 限制单篇长度, 防止内存爆炸
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
    // 顺序: 先 4 篇立即, 其余 idle 时再处理, 避免阻塞首屏
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));
    articles.slice(0, 4).forEach(a => task(a));
    idle(() => {
      articles.slice(4).forEach(a => task(a));
      // 等所有请求完成后再标记就绪
      Promise.all(articles.map(a => STATE.searchIndex[a.id] || task(a)))
        .finally(() => {
          STATE.searchIndexReady = true;
          STATE.searchIndexInflight = false;
          // 如果有未应用的搜索, 重新过滤一次
          if (STATE.searchQuery) applyFilters();
        });
    });
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
    const ORDER = ['洞察', '战略洞察', 'AI应用', 'AI基础设施', '安全', '技术调研', '其他'];
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
        <span class="cat-dot" style="background:${getCategoryColor(cat)}"></span>
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

  // ── 渲染: 标签词云 ────────────────────────────────────
  function renderTagCloud() {
    dom.tagCloud.innerHTML = '';
    const tagCount = {};
    STATE.articles.forEach(a => (a.tags || []).forEach(t => {
      tagCount[t] = (tagCount[t] || 0) + 1;
    }));
    // 找到每个 tag 对应的主分类 (取该 tag 出现次数最多的文章分类)
    const tagCategory = {};
    STATE.articles.forEach(a => {
      const c = a.category || '其他';
      (a.tags || []).forEach(t => {
        if (!tagCategory[t]) tagCategory[t] = c;
      });
    });

    const sorted = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 30);
    const maxCount = sorted.length ? sorted[0][1] : 1;
    const minCount = sorted.length ? sorted[sorted.length - 1][1] : 1;
    const MIN_FS = 12, MAX_FS = 22;

    sorted.forEach(([tag, count]) => {
      const btn = el('button', 'tag-cloud-item');
      const ratio = maxCount === minCount ? 1 : (count - minCount) / (maxCount - minCount);
      const fs = MIN_FS + ratio * (MAX_FS - MIN_FS);
      btn.style.fontSize = fs + 'px';
      btn.style.color = getCategoryColor(tagCategory[tag]);
      btn.textContent = tag;
      btn.title = `${tag} · ${count} 篇`;
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

  // ── 渲染: Hero 大卡片 ───────────────────────────────
  function renderHeroCard(article) {
    const card = el('article', 'hero-card');
    card.dataset.id = article.id;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `打开文章: ${article.title}`);

    // 顶部细色条 (按 category 配色)
    const colorBar = el('div', 'card-color-bar');
    colorBar.style.background = getCategoryColor(article.category);
    card.appendChild(colorBar);

    // 文本主体
    const body = el('div', 'hero-body');
    const badgeRow = el('div', 'hero-badge-row');
    const catColor = getCategoryColor(article.category);
    badgeRow.innerHTML = `
      <span class="hero-badge latest">最新</span>
      <span class="hero-badge cat" style="background:${catColor}">${escapeHtml(article.category || '未分类')}</span>
      <span class="hero-date">${escapeHtml(formatDateTime(article))}</span>
    `;
    body.appendChild(badgeRow);

    const title = el('h3', 'hero-title');
    if (STATE.searchQuery) {
      title.innerHTML = highlightText(escapeHtml(article.title), STATE.searchQuery);
    } else {
      title.textContent = article.title;
    }
    body.appendChild(title);

    const summary = el('p', 'hero-summary');
    if (STATE.searchQuery) {
      summary.innerHTML = highlightText(escapeHtml(article.summary || ''), STATE.searchQuery);
    } else {
      summary.textContent = article.summary || '';
    }
    body.appendChild(summary);

    // 搜索匹配片段 (仅在有 query 且命中内容时显示)
    if (STATE.searchQuery) {
      const idx = STATE.searchIndex[article.id];
      const snippet = idx ? extractSnippet(idx.content, STATE.searchQuery, 60) : '';
      if (snippet) {
        const snipEl = el('p', 'match-snippet');
        snipEl.innerHTML = `<span class="snip-label">匹配</span> ${highlightText(escapeHtml(snippet), STATE.searchQuery)}`;
        body.appendChild(snipEl);
      }
    }

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

    // 绑定打开
    const open = () => openReader(article);
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });

    return card;
  }

  // ── 渲染: 普通网格卡片 (重设计) ──────────────────────
  function renderGridCard(article) {
    const card = el('article', 'grid-card');
    card.dataset.id = article.id;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `打开文章: ${article.title}`);

    // 顶部细色条 (按 category 配色)
    const colorBar = el('div', 'card-color-bar');
    colorBar.style.background = getCategoryColor(article.category);
    card.appendChild(colorBar);

    // 文本主体 (整张卡片就是 body)
    const body = el('div', 'grid-card-body');

    // 分类徽章 + 日期
    const metaRow = el('div', 'grid-card-meta');
    const catColor = getCategoryColor(article.category);
    const catBadge = el('span', 'grid-card-cat');
    catBadge.textContent = article.category || '未分类';
    catBadge.style.background = catColor;
    metaRow.appendChild(catBadge);
    const dateEl = el('span', 'grid-card-date');
    dateEl.textContent = formatDateTime(article);
    metaRow.appendChild(dateEl);
    body.appendChild(metaRow);

    // 标题
    const title = el('h3', 'grid-card-title');
    if (STATE.searchQuery) {
      title.innerHTML = highlightText(escapeHtml(article.title), STATE.searchQuery);
    } else {
      title.textContent = article.title;
    }
    body.appendChild(title);

    // 摘要
    const summary = el('p', 'grid-card-summary');
    if (STATE.searchQuery) {
      summary.innerHTML = highlightText(escapeHtml(article.summary || ''), STATE.searchQuery);
    } else {
      summary.textContent = article.summary || '';
    }
    body.appendChild(summary);

    // 搜索匹配片段 (仅在有 query 且命中内容时显示)
    if (STATE.searchQuery) {
      const idx = STATE.searchIndex[article.id];
      const snippet = idx ? extractSnippet(idx.content, STATE.searchQuery, 40) : '';
      if (snippet) {
        const snipEl = el('p', 'match-snippet');
        snipEl.innerHTML = `<span class="snip-label">匹配</span> ${highlightText(escapeHtml(snippet), STATE.searchQuery)}`;
        body.appendChild(snipEl);
      }
    }

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

    // 底部: 阅读时间 / 附件 / 格式
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

    card.appendChild(body);

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

  // 把 date (YYYY-MM-DD) 格式化成 "MM-DD" (只显示日期, 排序用 date 字段)
  function formatDateTime(a) {
    const d = a.date || (a.updated_at ? a.updated_at.slice(0, 10) : '');
    if (!d) return '';
    const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return d;
    return `${m[2]}-${m[3]}`;
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

    // 排序后的列表
    const sorted = sortArticles(STATE.filtered.slice(), STATE.sortMode);

    // Hero: 取最新 2 篇 (严格按 date 降序)
    const dateSorted = sorted.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const heroArts = dateSorted.slice(0, 2);
    const heroIds = new Set(heroArts.map(a => a.id));

    // Hero: 过滤后总数 >= 2 时显示
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

  // ── 排序 (严格按文章 date 字段 YYYY-MM-DD) ───────────
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

  // ── 应用筛选 ────────────────────────────────────────
  function applyFilters() {
    STATE.filtered = STATE.articles.filter(a => {
      const catMatch = !STATE.activeCategory || a.category === STATE.activeCategory;
      const tagMatch = STATE.activeTags.length === 0 || STATE.activeTags.every(t => (a.tags || []).includes(t));
      const searchOK = searchMatch(a, STATE.searchQuery);
      return catMatch && tagMatch && searchOK;
    });
    renderArticleList();
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
      <span>${escapeHtml(formatDateTime(article))}</span>
      <span class="rmeta-sep">·</span>
      <span>${escapeHtml((article.tags || []).join('、'))}</span>
    `;

    dom.readerAttach.innerHTML = '';
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
            <a href="${getWordViewerUrl(wordAtt.path)}" target="_blank" rel="noopener noreferrer" class="word-view-btn">在线查看 Word</a>
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
  function setOpenGraphMeta(article) {
    const title = article ? article.title : '肥嘟嘟的炼金工厂 · 调研报告与白皮书';
    const desc = article
      ? (article.summary || '').slice(0, 120)
      : '35 篇深度调研 · 涵盖 AI 基础设施 / 存储安全 / 勒索防御 / 数据安全';
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

  // ── 搜索 debounce ───────────────────────────────────
  let searchDebounceTimer = null;
  function onSearchInput(value) {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      STATE.searchQuery = value.trim();
      applyFilters();
    }, 100);
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
    bindQaEvents();

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

    // 分离 QA 条目 (type === 'qa')
    STATE.qaList = STATE.articles.filter(a => a.type === 'qa');
    STATE.qaFiltered = [...STATE.qaList];

    // 顶栏计数
    dom.topbarCount.textContent = `${STATE.articles.length} 篇`;

    // 模式按钮计数
    if (dom.modeArticlesCount) dom.modeArticlesCount.textContent = STATE.articles.length - STATE.qaList.length;
    if (dom.modeQaCount) dom.modeQaCount.textContent = STATE.qaList.length;

    renderCategories();
    renderTagCloud();

    // 如果 URL 带 hash, 直接打开对应文章
    const hash = window.location.hash;
    if (hash.startsWith('#article/')) {
      const id = hash.replace('#article/', '');
      const article = STATE.articles.find(a => a.id === id);
      if (article) {
        renderArticleList();
        openReader(article);
        // 后台构建搜索索引 (不阻塞)
        buildSearchIndex();
        return;
      }
    }

    // 如果 URL 带 #qa/ 切换到问答模式
    if (hash.startsWith('#qa/') || hash === '#qa') {
      const qaId = hash.replace('#qa/', '').replace('#qa', '');
      switchToQaView();
      if (qaId) {
        // 打开具体问答
        const qa = STATE.qaList.find(q => q.id === qaId);
        if (qa) openQaReader(qa);
      }
      return;
    }

    // 如果 URL 带 #markets 切换到世界金融分析模式
    if (hash === '#markets') {
      switchToMarketsView();
      return;
    }

    renderArticleList();
    // 后台构建搜索索引 (不阻塞首屏)
    buildSearchIndex();
  }

  init();

  // ═══════════════════════════════════════════════════════
  // 智慧问答模块 v1
  // ═══════════════════════════════════════════════════════

  // ── 模式切换 ────────────────────────────────────────
  function switchToArticlesView() {
    STATE.viewMode = 'articles';
    if (dom.articlesView) dom.articlesView.classList.remove('hidden');
    if (dom.qaView) dom.qaView.classList.add('hidden');
    if (dom.marketsView) dom.marketsView.classList.add('hidden');
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
  }

  function switchToQaView() {
    STATE.viewMode = 'qa';
    if (dom.articlesView) dom.articlesView.classList.add('hidden');
    if (dom.qaView) dom.qaView.classList.remove('hidden');
    if (dom.marketsView) dom.marketsView.classList.add('hidden');
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

  // 世界金融分析模式 (顶级功能域, 独立 SPA)
  function switchToMarketsView() {
    STATE.viewMode = 'markets';
    if (dom.articlesView) dom.articlesView.classList.add('hidden');
    if (dom.qaView) dom.qaView.classList.add('hidden');
    if (dom.marketsView) dom.marketsView.classList.remove('hidden');
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

  // ── 问答事件绑定 ───────────────────────────────────
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

  // ── 问答筛选 + 渲染 ───────────────────────────────
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
      'date-asc':  (a, b) => (a.date || '').localeCompare(b.date || ''),
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

    // Header: Q 标 + 编号 + 日期
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

    // 问题 (大字)
    const question = el('h3', 'qa-card-question');
    question.textContent = q.question || q.title || '';
    card.appendChild(question);

    // 答案预览 (前 150 字)
    if (q.summary) {
      const preview = el('p', 'qa-card-answer-preview');
      preview.textContent = q.summary.length > 200 ? q.summary.slice(0, 200) + '…' : q.summary;
      card.appendChild(preview);
    }

    // 标签
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

    // Footer: 统计 + 打开提示
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

    // 点击打开
    const open = () => openQaReader(q);
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });

    return card;
  }

  // ── 打开问答 (跟文章 reader 类似的 iframe 框架, 但样式不同) ──
  function openQaReader(q) {
    if (!q.html_path) return;
    // 修复: 不预先 set hash (那样会产生 [prev, prev#qa, target] 三步, back 1 步没意义)
    // 现在只用 location.assign, 浏览器历史只有 [prev, target] 两步
    // back 1 步直接回 prev (列表/上一题/主页), 自然 work
    // 额外: 顶部 fixed bar 也有 ← 返回按钮 (双保险)
    location.assign(q.html_path);
  }

  // ═══════════════════════════════════════════════════════
  // V3 增强模块 — 沿用 + 调整: 移除"全文搜索覆盖层" (改用主网格内高亮),
  //                          related/series 链接加 target=_blank
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
            html += `<a href="#article/${sa.id}" target="_blank" rel="noopener noreferrer" style="padding:5px 8px;background:#eef0f5;border-radius:4px;text-decoration:none;color:#2c3a54;font-size:11.5px;">${escapeHtml(sa.title)}</a>`;
          }
          html += '</div>';
        }

        if (relatedArts.length) {
          html += '<div style="font-weight:700;font-size:13px;margin:14px 0 6px;color:#3a4a6b;">🔗 相关文章</div>';
          html += '<div style="display:flex;flex-direction:column;gap:5px;">';
          for (const ra of relatedArts) {
            html += `<a href="#article/${ra.id}" target="_blank" rel="noopener noreferrer" style="padding:5px 8px;background:#fff;border:1px solid #d8d4cc;border-radius:4px;text-decoration:none;color:#5a5a5a;font-size:11.5px;">${escapeHtml(ra.title)}</a>`;
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
              <div style="font-size:11px;color:#9a9690;margin-bottom:6px;">${escapeHtml(a.category || '')} · ${escapeHtml(formatDateTime(a))}</div>
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
