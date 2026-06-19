/* ═══════════════════════════════════════════════════
   article-toc.js — 文章浮动目录 + 右下角 FAB 导航

   行为:
   - 自动扫描文章内的 H2/H3 标题
   - 右侧浮动面板 (PC) / 底部抽屉 (手机)
   - IntersectionObserver 监听滚动, 高亮当前章节
   - 点击跳转 (smooth scroll)
   - FAB 按钮 toggle 显示
   - H3 自动折叠 (条目 > 30 时)

   选择器: article h2/h3, main h2/h3, .content h2/h3,
           body > h2/h3 (直接子标题兜底)
   ════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── 工具函数 ───────────────────────────────────
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') {
          node.addEventListener(k.slice(2), attrs[k]);
        } else {
          node.setAttribute(k, attrs[k]);
        }
      });
    }
    if (children) {
      children.forEach(function (c) { if (c) node.appendChild(c); });
    }
    return node;
  }

  function slugify(s) {
    return String(s || '')
      .trim()
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-z0-9\s-]/gi, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'section';
  }

  function isMobile() {
    return window.matchMedia('(max-width: 767px)').matches;
  }

  // ── 主入口 ─────────────────────────────────────
  function initTOC() {
    // 收集所有标题 (按规范覆盖多场景)
    var headings = $$('article h2, article h3, main h2, main h3, .content h2, .content h3');
    // 兜底: 如果以上都没命中, 扫 body > h2/h3 (大多数文章用这种结构)
    if (headings.length === 0) {
      headings = $$('body > h2, body > h3, body section h2, body section h3');
    }
    // 再兜底: 任何位置所有 h2/h3
    if (headings.length === 0) {
      headings = $$('h2, h3');
    }

    // 过滤掉:
    // 1. 导航 / 页脚 / sidebar 内的
    // 2. 隐藏的 (display:none)
    // 3. 没有正文 textContent 的
    headings = headings.filter(function (h) {
      if (!h.offsetParent && getComputedStyle(h).display !== 'none') return true; // 可能没渲染
      // 排除 nav, footer, header, aside 内的
      var p = h.parentElement;
      while (p && p !== document.body) {
        var tag = p.tagName.toLowerCase();
        if (tag === 'nav' || tag === 'footer' || tag === 'header' || tag === 'aside') return false;
        if (p.classList && (
          p.classList.contains('nav') ||
          p.classList.contains('footer') ||
          p.classList.contains('sidebar') ||
          p.classList.contains('toc-source') ||
          p.classList.contains('article-toc')
        )) return false;
        p = p.parentElement;
      }
      var txt = (h.textContent || '').trim();
      if (!txt) return false;
      // 跳过纯装饰 / "目录" / "Table of Contents"
      if (/^(目录|目\s*录|Table\s*of\s*Contents|TOC|Contents)$/i.test(txt)) return false;
      return true;
    });

    if (headings.length < 2) {
      // 少于 2 个标题就不渲染 TOC
      return;
    }

    // 确保每个 heading 有 id (用于锚点跳转)
    headings.forEach(function (h, idx) {
      if (!h.id) {
        h.id = 'toc-' + slugify(h.textContent) + '-' + idx;
      }
    });

    // 构建 TOC 树
    var toc = buildTOC(headings);
    if (!toc) return;

    // 创建 DOM
    var wrapper = renderTOC(toc, headings.length);
    document.body.appendChild(wrapper.panel);
    document.body.appendChild(wrapper.backdrop);
    document.body.appendChild(wrapper.fab);

    // 滚动监听 (IntersectionObserver)
    setupObserver(headings, wrapper.list);

    // FAB / 折叠按钮事件
    wireEvents(wrapper, headings.length);

    // 初始显示 (PC 默认显示, 手机默认隐藏)
    if (!isMobile()) {
      // 延迟一帧显示, 让动画生效
      requestAnimationFrame(function () {
        wrapper.panel.classList.add('is-visible');
        wrapper.fab.classList.add('is-open');
      });
    }
  }

  // ── 构建 TOC 树 ────────────────────────────────
  function buildTOC(headings) {
    var items = []; // { level: 2|3, text, id, children: [] }
    var stack = []; // 当前父节点栈

    headings.forEach(function (h) {
      var level = h.tagName === 'H2' ? 2 : 3;
      var node = {
        level: level,
        text: (h.textContent || '').trim(),
        id: h.id,
        children: []
      };

      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack.length === 0) {
        items.push(node);
      } else {
        stack[stack.length - 1].children.push(node);
      }
      stack.push(node);
    });

    return items;
  }

  // ── 渲染 TOC DOM ───────────────────────────────
  function renderTOC(items, totalCount) {
    var panel = el('aside', { class: 'article-toc', 'aria-label': '文章目录' });
    var header = el('div', { class: 'article-toc-header' }, [
      el('span', { text: '📑 文章目录' }),
      el('button', {
        class: 'article-toc-collapse',
        type: 'button',
        title: '折叠/展开 H3',
        'aria-label': '折叠/展开 H3',
        text: items.some(function (i) { return i.children && i.children.length; }) ? '−' : '+'
      })
    ]);
    panel.appendChild(header);

    var list = el('ul', { class: 'article-toc-list' });

    var collapseAuto = totalCount > 30;
    if (collapseAuto) list.classList.add('is-collapsed-h3');

    items.forEach(function (item) {
      list.appendChild(makeItem(item));
      if (item.children && item.children.length) {
        item.children.forEach(function (sub) {
          list.appendChild(makeItem(sub));
        });
      }
    });

    panel.appendChild(list);

    // 背景遮罩 (手机)
    var backdrop = el('div', { class: 'article-toc-backdrop' });

    // FAB 按钮
    var fab = el('button', {
      class: 'article-toc-fab',
      type: 'button',
      title: '目录',
      'aria-label': '打开/关闭文章目录',
      text: '⚜'
    });

    return { panel: panel, list: list, fab: fab, backdrop: backdrop };
  }

  function makeItem(item) {
    var li = el('li', {});
    var a = el('a', {
      class: 'article-toc-item' + (item.level === 3 ? ' is-h3' : ''),
      href: '#' + item.id,
      'data-target': item.id,
      text: item.text
    });
    // 点击平滑滚动
    a.addEventListener('click', function (e) {
      var target = document.getElementById(item.id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // 更新 hash (不触发跳变)
        if (history.replaceState) {
          history.replaceState(null, '', '#' + item.id);
        }
      }
    });
    li.appendChild(a);
    return li;
  }

  // ── IntersectionObserver 监听 ──────────────────
  function setupObserver(headings, listEl) {
    // 用 rootMargin 制造一个观察区 (顶部 0-30%, 用于判定当前章节)
    var visibleSet = new Set();
    var links = {};
    listEl.querySelectorAll('.article-toc-item').forEach(function (a) {
      links[a.getAttribute('data-target')] = a;
    });

    function setActive(id) {
      Object.keys(links).forEach(function (k) {
        links[k].classList.remove('is-active');
      });
      if (id && links[id]) {
        links[id].classList.add('is-active');
      }
    }

    function pickActive() {
      // 找出 visibleSet 中位置最靠前的 heading id
      var firstVisible = null;
      for (var i = 0; i < headings.length; i++) {
        if (visibleSet.has(headings[i].id)) {
          firstVisible = headings[i].id;
          break;
        }
      }
      if (firstVisible) {
        setActive(firstVisible);
      } else {
        // 没有可见时, 找当前滚动位置之前的最后一个 heading
        var scrollY = window.scrollY || document.documentElement.scrollTop;
        var pick = null;
        for (var j = 0; j < headings.length; j++) {
          var rect = headings[j].getBoundingClientRect();
          var top = rect.top + scrollY;
          if (top <= scrollY + 120) {
            pick = headings[j].id;
          } else {
            break;
          }
        }
        if (pick) setActive(pick);
      }
    }

    // 兼容老浏览器
    if (!('IntersectionObserver' in window)) {
      window.addEventListener('scroll', pickActive, { passive: true });
      pickActive();
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var id = entry.target.id;
        if (entry.isIntersecting) {
          visibleSet.add(id);
        } else {
          visibleSet.delete(id);
        }
      });
      pickActive();
    }, {
      // 观察区: 距离顶部 80px 到屏幕 50% 处
      rootMargin: '-80px 0px -50% 0px',
      threshold: [0, 0.01, 0.5, 1]
    });

    headings.forEach(function (h) {
      observer.observe(h);
    });

    // 兜底: 滚动时也 pickActive (用于快速滚动时定位上一个章节)
    var scrollTimer = null;
    window.addEventListener('scroll', function () {
      if (scrollTimer) return;
      scrollTimer = setTimeout(function () {
        scrollTimer = null;
        if (visibleSet.size === 0) pickActive();
      }, 80);
    }, { passive: true });
  }

  // ── 事件绑定 ───────────────────────────────────
  function wireEvents(w, totalCount) {
    var panel = w.panel;
    var fab = w.fab;
    var backdrop = w.backdrop;
    var list = w.list;

    function open() {
      panel.classList.add('is-visible');
      fab.classList.add('is-open');
      if (isMobile()) backdrop.classList.add('is-visible');
    }
    function close() {
      panel.classList.remove('is-visible');
      fab.classList.remove('is-open');
      backdrop.classList.remove('is-visible');
    }
    function toggle() {
      if (panel.classList.contains('is-visible')) close();
      else open();
    }

    fab.addEventListener('click', toggle);
    backdrop.addEventListener('click', close);

    // 折叠/展开 H3
    var collapseBtn = panel.querySelector('.article-toc-collapse');
    if (collapseBtn) {
      var collapseAuto = totalCount > 30;
      // 自动折叠 (>30 时)
      if (collapseAuto) {
        list.classList.add('is-collapsed-h3');
      }
      collapseBtn.addEventListener('click', function () {
        var collapsed = list.classList.toggle('is-collapsed-h3');
        collapseBtn.textContent = collapsed ? '+' : '−';
      });
    }

    // ESC 关闭 (手机)
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-visible') && isMobile()) {
        close();
      }
    });

    // 屏幕尺寸变化时调整显示状态
    var mq = window.matchMedia('(max-width: 767px)');
    var lastIsMobile = mq.matches;
    mq.addEventListener('change', function (e) {
      var nowMobile = e.matches;
      // 切到 PC: 显示; 切到手机: 隐藏 (除非用户已打开)
      if (!nowMobile && lastIsMobile) {
        // 手机 -> PC
        if (!panel.classList.contains('is-visible')) {
          panel.classList.add('is-visible');
          fab.classList.add('is-open');
        }
        backdrop.classList.remove('is-visible');
      } else if (nowMobile && !lastIsMobile) {
        // PC -> 手机
        if (!fab.dataset.userOpened) {
          panel.classList.remove('is-visible');
          fab.classList.remove('is-open');
        }
        backdrop.classList.remove('is-visible');
      }
      lastIsMobile = nowMobile;
    });

    // 链接点击后手机端关闭抽屉
    list.addEventListener('click', function (e) {
      if (e.target.classList.contains('article-toc-item') && isMobile()) {
        setTimeout(close, 250);
      }
    });
  }

  // ── 启动 ───────────────────────────────────────
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initTOC);
  } else {
    // defer 已经触发, 直接调用
    initTOC();
  }
})();
