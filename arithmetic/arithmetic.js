/* ============================================================
   算术题乐园 · 核心引擎
   功能:
   1. 随机生成 4 选 1 加减法 (无负数, 范围内)
   2. 4 档难度 (5/10/20/100)
   3. 答对撒星星 + 答错晃动 + 鼓励语
   4. 答对 10 题自动升档
   5. localStorage 记录最高连击
   ============================================================ */

(() => {
  'use strict';

  // ── 配置 ──────────────────────────────────────
  const LEVELS = [
    { max: 5,   name: '5 以内',  emoji: '🐣', color: 'blue'   },
    { max: 10,  name: '10 以内', emoji: '🐰', color: 'green'  },
    { max: 20,  name: '20 以内', emoji: '🦊', color: 'yellow' },
    { max: 100, name: '100 以内',emoji: '🦁', color: 'red'    },
  ];
  const TOTAL_PER_LEVEL = 10;
  const FEEDBACK_CORRECT = ['太棒了!🎉', '真聪明!⭐', '答对啦!🌟', '你真行!🎊', '加油!💪'];
  const FEEDBACK_WRONG   = ['差一点!💡', '再想想!🤔', '没关系!❤️'];
  const EMOJIS_HAPPY = ['😄','🤩','🥳','😁','😆','🤗'];
  const EMOJIS_THINK = ['🤔','🧐','😯','😮'];

  // ── 状态 ──────────────────────────────────────
  const url = new URL(window.location.href);
  let levelIdx = Math.max(0, Math.min(LEVELS.length - 1,
    LEVELS.findIndex(l => l.max === parseInt(url.searchParams.get('max') || '5', 10))
  ));
  if (levelIdx < 0) levelIdx = 0;

  const state = {
    levelIdx,
    qIndex: 0,
    correct: 0,
    current: null,
    locked: false,
  };

  // ── DOM ──────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const dom = {
    levelTitle: $('levelTitle'),
    levelSub:   $('levelSub'),
    levelBadge: $('levelBadge'),
    qIndex:     $('qIndex'),
    qTotal:     $('qTotal'),
    starsRow:   $('starsRow'),
    qCard:      $('qCard'),
    qEmoji:     $('qEmoji'),
    qText:      $('qText'),
    qHint:      $('qHint'),
    choices:    $('choices'),
    feedback:   $('feedback'),
    burst:      $('burst'),
    modalRoot:  $('modalRoot'),
  };

  // ── 题目生成 ──────────────────────────────────────
  function randInt(n) { return Math.floor(Math.random() * (n + 1)); }

  function generateQuestion() {
    const lv = LEVELS[state.levelIdx];
    let a, b, op, answer, expr;

    // 保证 a, b 在 [0, max], 减法不出现负数
    do {
      op = Math.random() < 0.5 ? '+' : '-';
      a = randInt(lv.max);
      b = randInt(lv.max);
      if (op === '-') {
        if (a < b) [a, b] = [b, a];
        answer = a - b;
      } else {
        answer = a + b;
      }
    } while (answer < 0 || answer > lv.max * 2);

    expr = `${a} ${op} ${b}`;
    return { expr, answer, a, b, op };
  }

  function generateChoices(answer) {
    const lv = LEVELS[state.levelIdx];
    const set = new Set([answer]);
    const range = Math.max(2, Math.floor(lv.max * 0.3));

    // 生成干扰项 (近邻答案 ±1..range, 但不能超过题目范围)
    while (set.size < 4) {
      const delta = randInt(range) + 1;
      const sign = Math.random() < 0.5 ? -1 : 1;
      const candidate = answer + delta * sign;
      if (candidate >= 0 && candidate <= lv.max * 2) {
        set.add(candidate);
      }
    }
    const arr = Array.from(set);
    return shuffle(arr);
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ── 渲染 ──────────────────────────────────────
  function renderLevelBadge() {
    const lv = LEVELS[state.levelIdx];
    dom.levelBadge.textContent = `${lv.name}加减法`;
    dom.levelBadge.style.background = `var(--c-${lv.color})`;
    dom.levelBadge.style.color = lv.color === 'yellow' ? 'var(--text)' : '#FFF';
    dom.qTotal.textContent = TOTAL_PER_LEVEL;
    dom.levelTitle.textContent = `${lv.emoji} ${lv.name}`;
    dom.levelSub.textContent = lv.max <= 5 ? '幼儿园小班, 慢慢来!' :
                                lv.max <= 10 ? '幼儿园中班, 加油!' :
                                lv.max <= 20 ? '幼儿园大班, 你真棒!' :
                                               '小学一年级, 来挑战!';
  }

  function renderStars() {
    const html = [];
    for (let i = 0; i < TOTAL_PER_LEVEL; i++) {
      const lit = i < state.correct ? 'lit' : '';
      html.push(`<span class="arith-star ${lit}">⭐</span>`);
    }
    dom.starsRow.innerHTML = html.join('');
  }

  function renderQuestion() {
    const lv = LEVELS[state.levelIdx];
    const q = generateQuestion();
    state.current = q;

    const choices = generateChoices(q.answer);
    dom.qCard.classList.remove('wrong');
    dom.qEmoji.textContent = randomFrom(EMOJIS_THINK);
    dom.qText.textContent = `${q.expr} = ?`;
    dom.qHint.textContent = '点下面正确答案';
    dom.qIndex.textContent = state.qIndex + 1;
    dom.feedback.textContent = '';
    dom.feedback.className = 'arith-feedback';

    dom.choices.innerHTML = choices.map(c =>
      `<button class="arith-choice" data-val="${c}">${c}</button>`
    ).join('');

    [...dom.choices.children].forEach(btn => {
      btn.addEventListener('click', () => onChoice(parseInt(btn.dataset.val, 10), btn));
    });

    // 数字键盘支持 (1-9 直接选)
    document.removeEventListener('keydown', onKey);
    document.addEventListener('keydown', onKey);
  }

  function onKey(e) {
    const k = e.key;
    if (k >= '0' && k <= '9') {
      const target = [...dom.choices.children].find(b => parseInt(b.dataset.val, 10) === parseInt(k, 10));
      if (target) target.click();
    } else if (k === 'Enter' || k === ' ') {
      // 不强制定位正确答案, 由用户点
    }
  }

  function onChoice(val, btn) {
    if (state.locked) return;
    state.locked = true;

    const correct = val === state.current.answer;
    if (correct) {
      btn.classList.add('correct');
      dom.qCard.classList.remove('wrong');
      dom.feedback.textContent = randomFrom(FEEDBACK_CORRECT);
      dom.feedback.className = 'arith-feedback correct';
      dom.qEmoji.textContent = randomFrom(EMOJIS_HAPPY);
      state.correct++;
      renderStars();
      burstStars();
      setTimeout(nextQuestion, 1200);
    } else {
      btn.classList.add('wrong');
      dom.qCard.classList.add('wrong');
      dom.feedback.textContent = randomFrom(FEEDBACK_WRONG);
      dom.feedback.className = 'arith-feedback wrong';
      // 显示正确答案 (高亮)
      [...dom.choices.children].forEach(b => {
        if (parseInt(b.dataset.val, 10) === state.current.answer) {
          b.classList.add('correct');
        }
      });
      setTimeout(nextQuestion, 1800);
    }
  }

  function nextQuestion() {
    state.locked = false;
    if (state.correct >= TOTAL_PER_LEVEL) {
      // 通关
      showLevelUpModal();
      return;
    }
    if (state.qIndex >= TOTAL_PER_LEVEL - 1) {
      // 本档结束 (无论对错)
      showLevelResult();
      return;
    }
    state.qIndex++;
    renderQuestion();
  }

  function showLevelUpModal() {
    // 用户要求 (2026-07-20): 不进入下一级, 永远再来十道
    const lv = LEVELS[state.levelIdx];
    const modal = document.createElement('div');
    modal.className = 'arith-modal';
    modal.innerHTML = `
      <div class="arith-modal-card">
        <div class="arith-modal-emoji">🎉</div>
        <div class="arith-modal-title">太棒啦!</div>
        <div class="arith-modal-sub">
          ${lv.name}加减法 ${TOTAL_PER_LEVEL} 题全部答对!<br>
          再来十道继续挑战吧!
        </div>
        <button class="arith-modal-btn" id="btnAgain">再来十道 🔁</button>
        <button class="arith-modal-btn alt" id="btnBackLevel">换个难度 🎯</button>
        <button class="arith-modal-btn alt" id="btnHome">回首页 🏠</button>
      </div>
    `;
    dom.modalRoot.appendChild(modal);

    $('btnAgain').addEventListener('click', () => {
      dom.modalRoot.innerHTML = '';
      resetRound();
      renderLevelBadge();
      renderStars();
      renderQuestion();
    });
    $('btnBackLevel').addEventListener('click', () => {
      window.location.href = 'index.html';
    });
    $('btnHome').addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  function showLevelResult() {
    // 用户要求 (2026-07-20): 本档结束永远再来十道, 不升档
    const lv = LEVELS[state.levelIdx];
    const modal = document.createElement('div');
    modal.className = 'arith-modal';
    const pass = state.correct >= 7;
    modal.innerHTML = `
      <div class="arith-modal-card">
        <div class="arith-modal-emoji">${pass ? '👍' : '💪'}</div>
        <div class="arith-modal-title">${pass ? '真不错!' : '继续加油!'}</div>
        <div class="arith-modal-sub">
          ${lv.name}加减法<br>
          答对 <b>${state.correct}</b> / ${TOTAL_PER_LEVEL} 题<br>
          ${pass ? '你真棒, 再来十道!' : '再多练几次就更棒啦!'}
        </div>
        <button class="arith-modal-btn" id="btnAgain">再来十道 🔁</button>
        <button class="arith-modal-btn alt" id="btnBackLevel">换个难度 🎯</button>
        <button class="arith-modal-btn alt" id="btnHome2">回首页 🏠</button>
      </div>
    `;
    dom.modalRoot.appendChild(modal);

    $('btnAgain').addEventListener('click', () => {
      dom.modalRoot.innerHTML = '';
      resetRound();
      renderLevelBadge();
      renderStars();
      renderQuestion();
    });
    $('btnBackLevel').addEventListener('click', () => {
      window.location.href = 'index.html';
    });
    $('btnHome2').addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  function resetRound() {
    state.qIndex = 0;
    state.correct = 0;
    state.locked = false;
  }

  // ── 动画 ──────────────────────────────────────
  function burstStars() {
    const burst = dom.burst;
    const N = 24;
    for (let i = 0; i < N; i++) {
      const star = document.createElement('span');
      star.className = 'arith-star-particle';
      star.textContent = randomFrom(['⭐','🌟','✨','💫','⭐','🌟']);
      star.style.left = (Math.random() * 100) + 'vw';
      star.style.top = '20vh';
      star.style.animationDelay = (Math.random() * 0.3) + 's';
      star.style.animationDuration = (1.2 + Math.random() * 0.6) + 's';
      star.style.fontSize = (24 + Math.random() * 24) + 'px';
      burst.appendChild(star);
      setTimeout(() => star.remove(), 2000);
    }
  }

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ── 启动 ──────────────────────────────────────
  renderLevelBadge();
  renderStars();
  renderQuestion();

})();
