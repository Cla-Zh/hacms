/* =============================================================================
 * 肥嘟嘟的炼金工厂 · 文章手机端 JS (2026-09-25)
 * 与 article-mobile.css 配合, 提供:
 *   1. 下滑自动收起 hero 区域
 *   2. 上滑恢复
 *   3. 点击 hero 内 ▾ 按钮展开所有 pill
 * ============================================================================= */
(function () {
  'use strict';

  window.__articleMobileLoaded = true;

  function init() {
    if (window.innerWidth > 767) return;

    const hero = document.querySelector('header.hero');
    if (!hero) {
      setTimeout(init, 100);
      return;
    }

    // 把 aside (TOC) 移到 hero 前面, 这样 TOC 显示在 hero 上方
    const aside = document.querySelector('aside.hidden.lg\\:block') ||
                   document.querySelector('aside.w-64');
    if (aside && aside.parentNode !== hero.parentNode) {
      // 移到 hero 前面
      hero.parentNode.insertBefore(aside, hero);
    }

    hero.dataset.amReady = '1';
    bindEvents(hero);
  }

  function bindEvents(hero) {
    let lastScrollY = 0;
    let scrollAccum = 0;
    const SCROLL_THRESHOLD = 60;

    function collapseHero() {
      if (!hero.classList.contains('is-collapsed')) {
        hero.classList.add('is-collapsed');
      }
    }
    function expandHero() {
      if (hero.classList.contains('is-collapsed')) {
        hero.classList.remove('is-collapsed');
      }
    }

    let scrollTimer = null;
    window.addEventListener('scroll', function () {
      if (scrollTimer) return;
      scrollTimer = setTimeout(function () {
        scrollTimer = null;
        const sy = window.scrollY;
        const dy = sy - lastScrollY;
        if (dy > 4) {
          scrollAccum += dy;
          if (scrollAccum > SCROLL_THRESHOLD && sy > 80) collapseHero();
        } else if (dy < -4) {
          scrollAccum = 0;
          expandHero();
        }
        lastScrollY = sy;
      }, 80);
    }, { passive: true });

    // 点击 hero 右下角展开 pill
    hero.addEventListener('click', function (e) {
      const rect = hero.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x > rect.width - 110 && y > rect.height - 36) {
        e.preventDefault();
        const pillContainer = hero.querySelector('.flex.flex-wrap.gap-2:not(.items-center)');
        if (pillContainer) pillContainer.classList.toggle('is-expanded');
        hero.classList.toggle('is-tags-expanded');
        if (hero.classList.contains('is-tags-expanded')) expandHero();
      }
    });
  }

  // DOM ready 后再 init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();