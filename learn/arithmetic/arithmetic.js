/* ============================================================
   算术题乐园 · 核心引擎  (v3 — 删 5 以内 + 计时 + 答题记录)
   功能:
   1. 随机生成 4 选 1 加减法 (无负数, 范围内)
   2. 3 档难度 (10/20/100)  — 5 以内已删除 (2026-07-28)
   3. 答对撒星星 + 答错晃动 + 鼓励语
   4. ⏱️ 答题过程实时计时 (MM:SS, 第 1 题点击即开始)
   5. 📊 答题记录写入 localStorage (时间戳/难度/对/错/用时)
   6. 📜 index.html 显示最近 20 条记录 + 总统计
   ============================================================ */

(() => {
  'use strict';

  // ── 配置 (5 以内已删除) ──────────────────────────────────────
  const LEVELS = [
    { max: 10,  name: '10 以内', emoji: '🐰', color: 'green'  },
    { max: 20,  name: '20 以内', emoji: '🦊', color: 'yellow' },
    { max: 100, name: '100 以内',emoji: '🦁', color: 'red'    },
  ];
  const TOTAL_PER_LEVEL = 10;
  const FEEDBACK_CORRECT = ['太棒了!🎉', '真聪明!⭐', '答对啦!🌟', '你真行!🎊', '加油!💪'];
  const FEEDBACK_WRONG   = ['差一点!💡', '再想想!🤔', '没关系!❤️'];
  const EMOJIS_HAPPY = ['😄','🤩','🥳','😁','😆','🤗'];
  const EMOJIS_THINK = ['🤔','🧐','😯','😮'];
  const HISTORY_KEY = 'hacms_arith_history_v1';
  const HISTORY_MAX = 100;   // localStorage 保留最近 100 条

  // ── 状态 ──────────────────────────────────────
  const url = new URL(window.location.href);
  let levelIdx = Math.max(0, Math.min(LEVELS.length - 1,
    LEVELS.findIndex(l => l.max === parseInt(url.searchParams.get('max') || '10', 10))
  ));
  if (levelIdx < 0) levelIdx = 0;

  const state = {
    levelIdx,
    qIndex: 0,
    correct: 0,
    wrong: 0,
    current: null,
    locked: false,
    // 计时
    startTime: null,      // 第 1 题点击时记录
    elapsedMs: 0,         // 当前用时 (每 250ms 刷新)
    timerHandle: null,
    // 本轮记录
    roundStart: null,     // ISO string, round 开始时间
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
    timer:      $('timer'),
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
    dom.levelSub.textContent = lv.max <= 10 ? '幼儿园中班, 加油!' :
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

    document.removeEventListener('keydown', onKey);
    document.addEventListener('keydown', onKey);
  }

  function onKey(e) {
    const k = e.key;
    if (k >= '0' && k <= '9') {
      const target = [...dom.choices.children].find(b => parseInt(b.dataset.val, 10) === parseInt(k, 10));
      if (target) target.click();
    }
  }

  // ── 计时 ──────────────────────────────────────
  function startTimer() {
    if (state.timerHandle) return;  // 已在跑
    state.startTime = Date.now() - state.elapsedMs;
    state.timerHandle = setInterval(() => {
      state.elapsedMs = Date.now() - state.startTime;
      if (dom.timer) dom.timer.textContent = formatTime(state.elapsedMs);
    }, 250);
  }

  function stopTimer() {
    if (state.timerHandle) {
      clearInterval(state.timerHandle);
      state.timerHandle = null;
    }
  }

  function resetTimer() {
    stopTimer();
    state.elapsedMs = 0;
    if (dom.timer) dom.timer.textContent = '00:00';
  }

  function formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  // ── 答题 ──────────────────────────────────────
  function onChoice(val, btn) {
    if (state.locked) return;
    state.locked = true;

    // 第一次点击 → 开始计时
    if (state.startTime === null) {
      startTimer();
    }

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
      state.wrong++;
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
      finishRound('全对');
      return;
    }
    if (state.qIndex >= TOTAL_PER_LEVEL - 1) {
      finishRound('完成');
      return;
    }
    state.qIndex++;
    renderQuestion();
  }

  // ── 记录 (XML + localStorage 双写) ──────────────────────
  function loadHistory() {
    // 优先从 localStorage 读取 (即时)
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) return arr;
      }
    } catch (e) {}
    // fallback: 尝试从软链 XML 加载 (用户跨设备/浏览器共享)
    if (window.LearnData) {
      const xml = LearnData.lsGet('hacms_arith_history_v1_xml');
      if (xml) {
        const arr = LearnData.xmlToHistory(xml);
        if (arr) return arr;
      }
    }
    return [];
  }

  function saveHistory(record) {
    const arr = loadHistory();
    arr.unshift(record);  // 最新在前
    if (arr.length > HISTORY_MAX) arr.length = HISTORY_MAX;
    // 双写: localStorage (主) + XML 备份
    try {
      LearnData.lsSet(HISTORY_KEY, JSON.stringify(arr));
      // XML 备份
      const xml = LearnData.historyToXml(arr, { source: 'arithmetic-finish-round' });
      LearnData.lsSet(HISTORY_KEY + '_xml', xml);
      // 自动下载 XML 到用户下载文件夹 (家长可手动 cp 到 hermes_data)
      // 注: 不在每次答题都下载, 仅在用户点导出按钮时
    } catch (e) {
      console.warn('save history failed', e);
    }
  }

  function finishRound(reason) {
    stopTimer();
    const lv = LEVELS[state.levelIdx];
    const elapsedMs = state.elapsedMs;
    const record = {
      ts: Date.now(),
      tsISO: new Date().toISOString(),
      level: lv.name,
      levelMax: lv.max,
      correct: state.correct,
      wrong: state.wrong,
      total: TOTAL_PER_LEVEL,
      elapsedMs: elapsedMs,
      elapsedStr: formatTime(elapsedMs),
      reason: reason,  // '全对' 或 '完成'
      pass: state.correct >= 7,
    };
    saveHistory(record);
    showLevelResult(record);
  }

  // ── 结算弹窗 ──────────────────────────────────────
  function showLevelResult(record) {
    const lv = LEVELS[state.levelIdx];
    const pass = record.pass;
    const accuracy = ((record.correct / TOTAL_PER_LEVEL) * 100).toFixed(0);
    const modal = document.createElement('div');
    modal.className = 'arith-modal';
    modal.innerHTML = `
      <div class="arith-modal-card">
        <div class="arith-modal-emoji">${pass ? '🏆' : (record.correct >= 5 ? '👍' : '💪')}</div>
        <div class="arith-modal-title">${pass ? '太棒啦!' : (record.correct >= 5 ? '真不错!' : '继续加油!')}</div>
        <div class="arith-modal-sub">
          <div style="font-size:1.05rem;margin-bottom:8px"><b>${lv.name}</b>加减法</div>
          <div class="arith-result-row">
            <div class="arith-result-item">
              <div class="arith-result-num">${record.correct}</div>
              <div class="arith-result-label">答对</div>
            </div>
            <div class="arith-result-item">
              <div class="arith-result-num">${record.wrong}</div>
              <div class="arith-result-label">答错</div>
            </div>
            <div class="arith-result-item">
              <div class="arith-result-num">${accuracy}%</div>
              <div class="arith-result-label">正确率</div>
            </div>
            <div class="arith-result-item">
              <div class="arith-result-num">${record.elapsedStr}</div>
              <div class="arith-result-label">用时</div>
            </div>
          </div>
          <div class="arith-result-time">🕐 ${formatTimestamp(record.ts)}</div>
          ${pass ? '<div style="margin-top:10px;color:var(--c-green);font-weight:700">🎉 7 题以上, 过关!</div>' : ''}
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

  function formatTimestamp(ts) {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${h}:${min}`;
  }

  function resetRound() {
    state.qIndex = 0;
    state.correct = 0;
    state.wrong = 0;
    state.locked = false;
    state.startTime = null;
    state.elapsedMs = 0;
    resetTimer();
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
  resetTimer();  // 显示 00:00

})();
