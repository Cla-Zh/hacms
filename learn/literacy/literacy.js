/* ============================================================
   认字识字 · 核心逻辑 (v1)
   功能:
   1. 字表 localStorage 持久化 (key: hacms_lit_words_v1)
   2. 默认字表 (10 个高频字)
   3. 主页 index.html: 字表网格 + "开始" + "家长编辑" 按钮
   4. 答题 play.html: 随机出字 + 家长判对错 + 计时
   5. 编辑 edit.html: 文本输入 + 字数统计 + 预设模板
   ============================================================ */

(() => {
  'use strict';

  const STORAGE_KEY = 'hacms_lit_words_v1';
  const HISTORY_KEY = 'hacms_lit_history_v1';
  const TOTAL_PER_ROUND = 10;

  // 默认字表 (用户可改)
  const DEFAULT_WORDS = ['人', '口', '手', '大', '小', '山', '水', '火', '日', '月', '上', '下', '中', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '天', '地', '你', '我', '他', '好', '吗'];

  // 预设模板
  const PRESETS = {
    '基础 30 字': DEFAULT_WORDS.slice(0, 30),
    '数字 1-10': ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'],
    '家庭称呼': ['爸', '妈', '爷', '奶', '哥', '姐', '弟', '妹', '叔', '姨'],
    '动物世界': ['狗', '猫', '鱼', '鸟', '马', '牛', '羊', '猪', '鸡', '鸭', '虎', '兔', '龙', '蛇', '马'],
    '水果蔬菜': ['苹', '果', '香', '蕉', '西', '瓜', '葡', '萄', '桃', '梨', '萝', '卜', '白', '菜', '豆'],
    '身体部位': ['头', '眼', '耳', '口', '手', '足', '心', '鼻', '牙', '舌'],
  };

  // ── 工具 ──────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const randInt = (n) => Math.floor(Math.random() * n);
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = randInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }

  // ── 字表存储 ──────────────────────────────────────
  function loadWords() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_WORDS.slice(0, 10);  // 默认 10 字
      const arr = JSON.parse(raw);
      return Array.isArray(arr) && arr.length > 0 ? arr : DEFAULT_WORDS.slice(0, 10);
    } catch (e) {
      return DEFAULT_WORDS.slice(0, 10);
    }
  }
  function saveWords(words) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
    } catch (e) {
      console.warn('save words failed', e);
    }
  }
  function dedupeWords(list) {
    // 去重 + 去空白 + 单字
    const set = new Set();
    for (const w of list) {
      if (typeof w !== 'string') continue;
      for (const ch of w.trim()) {
        if (ch.trim()) set.add(ch);
      }
    }
    return Array.from(set);
  }

  // ── 主页渲染 ──────────────────────────────────────
  function renderHome() {
    const words = loadWords();
    const grid = $('wordsGrid');
    if (words.length === 0) {
      grid.innerHTML = '';
      $('emptyState').classList.add('show');
      $('startBtn').disabled = true;
      $('wordCount').textContent = '0';
    } else {
      $('emptyState').classList.remove('show');
      $('startBtn').disabled = false;
      $('wordCount').textContent = words.length;
      grid.innerHTML = words.map((w, i) =>
        `<div class="lit-char" title="第 ${i + 1} 个字"><span class="lit-char-num">${i + 1}</span>${w}</div>`
      ).join('');
    }
  }

  function bindHome() {
    $('editBtn')?.addEventListener('click', () => {
      window.location.href = 'edit.html';
    });
    $('startBtn')?.addEventListener('click', () => {
      window.location.href = 'play.html';
    });
    $('resetBtn')?.addEventListener('click', () => {
      if (confirm('确定要恢复默认字表 (前 10 个高频字) 吗?')) {
        saveWords(DEFAULT_WORDS.slice(0, 10));
        renderHome();
      }
    });
  }

  // ── 答题 (play.html) ──────────────────────────────────────
  const state = {
    pool: [],
    qIndex: 0,
    correct: 0,
    wrong: 0,
    startTime: null,
    elapsedMs: 0,
    timerHandle: null,
    locked: false,
    current: '',
  };

  function startTimer() {
    if (state.timerHandle) return;
    state.startTime = Date.now() - state.elapsedMs;
    state.timerHandle = setInterval(() => {
      state.elapsedMs = Date.now() - state.startTime;
      const t = $('timer');
      if (t) t.textContent = formatTime(state.elapsedMs);
    }, 250);
  }
  function stopTimer() {
    if (state.timerHandle) {
      clearInterval(state.timerHandle);
      state.timerHandle = null;
    }
  }

  function renderPlay() {
    const words = loadWords();
    if (words.length === 0) {
      alert('字表为空, 请先到主页点 "家长编辑" 添加字!');
      window.location.href = 'index.html';
      return;
    }
    // 出题: 随机打乱所有字, 取 TOTAL_PER_ROUND 道
    state.pool = shuffle([...words]).slice(0, Math.min(TOTAL_PER_ROUND, words.length));
    state.qIndex = 0;
    state.correct = 0;
    state.wrong = 0;
    state.locked = false;
    state.elapsedMs = 0;
    renderQuestion();
  }

  function renderQuestion() {
    if (state.qIndex >= state.pool.length) {
      finishRound();
      return;
    }
    state.current = state.pool[state.qIndex];
    $('qChar').textContent = state.current;
    $('qIndex').textContent = state.qIndex + 1;
    $('qTotal').textContent = state.pool.length;
    const pct = (state.qIndex / state.pool.length) * 100;
    $('progressFill').style.width = pct + '%';
    $('feedback').textContent = '让宝宝认读这个字';
    $('feedback').className = 'lit-feedback';
    state.locked = false;
  }

  function onJudge(judge) {
    if (state.locked) return;
    state.locked = true;
    // 第一次点击 → 开始计时
    if (state.startTime === null) startTimer();

    if (judge === 'correct') {
      state.correct++;
      $('feedback').textContent = '✅ 答对啦!';
      $('feedback').className = 'lit-feedback correct';
      $('qChar').style.color = 'var(--c-green)';
    } else {
      state.wrong++;
      $('feedback').textContent = '💪 再练练, 加油!';
      $('feedback').className = 'lit-feedback wrong';
      $('qChar').style.color = 'var(--c-red)';
    }
    setTimeout(() => {
      $('qChar').style.color = '';
      state.qIndex++;
      renderQuestion();
    }, 800);
  }

  function finishRound() {
    stopTimer();
    const words = loadWords();
    const record = {
      ts: Date.now(),
      tsISO: new Date().toISOString(),
      poolSize: state.pool.length,
      correct: state.correct,
      wrong: state.wrong,
      total: state.pool.length,
      elapsedMs: state.elapsedMs,
      elapsedStr: formatTime(state.elapsedMs),
    };
    saveHistory(record);
    const accuracy = state.pool.length > 0 ? Math.round((state.correct / state.pool.length) * 100) : 0;
    const modal = document.createElement('div');
    modal.className = 'lit-modal';
    modal.innerHTML = `
      <div class="lit-modal-card">
        <div class="lit-modal-emoji">${state.correct >= state.pool.length * 0.7 ? '🏆' : '💪'}</div>
        <div class="lit-modal-title">${state.correct >= state.pool.length * 0.7 ? '真棒!' : '继续加油!'}</div>
        <div class="lit-modal-sub">
          <div class="lit-modal-stats">
            <div class="lit-modal-stat"><div class="lit-modal-stat-num">${state.correct}</div><div class="lit-modal-stat-label">答对</div></div>
            <div class="lit-modal-stat"><div class="lit-modal-stat-num">${state.wrong}</div><div class="lit-modal-stat-label">答错</div></div>
            <div class="lit-modal-stat"><div class="lit-modal-stat-num">${accuracy}%</div><div class="lit-modal-stat-label">正确率</div></div>
            <div class="lit-modal-stat"><div class="lit-modal-stat-num">${formatTime(state.elapsedMs)}</div><div class="lit-modal-stat-label">用时</div></div>
          </div>
          <div style="font-size:12px;color:var(--text2);font-family:monospace;margin-top:8px">字表共 ${words.length} 个字, 本次抽 ${state.pool.length} 个</div>
        </div>
        <button class="lit-modal-btn" id="btnAgain">再来一组 🔁</button>
        <button class="lit-modal-btn alt" id="btnEdit">编辑字表 ✏️</button>
        <button class="lit-modal-btn alt" id="btnHome">回首页 🏠</button>
      </div>
    `;
    document.body.appendChild(modal);
    $('btnAgain').onclick = () => { modal.remove(); state.qIndex = 0; state.correct = 0; state.wrong = 0; state.elapsedMs = 0; state.startTime = null; renderQuestion(); };
    $('btnEdit').onclick = () => { window.location.href = 'edit.html'; };
    $('btnHome').onclick = () => { window.location.href = 'index.html'; };
  }

  // 跨 tab 同步
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      if (document.getElementById('wordsGrid')) renderHome();
    }
  });

  // ── 答题记录 ──────────────────────────────────────
  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function saveHistory(record) {
    const arr = loadHistory();
    arr.unshift(record);
    if (arr.length > 100) arr.length = 100;
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(arr)); } catch (e) {}
  }

  // ── 编辑 (edit.html) ──────────────────────────────────────
  function renderEdit() {
    const ta = $('wordsTextarea');
    if (ta) ta.value = loadWords().join('');

    const cnt = $('charCount');
    if (ta && cnt) {
      const update = () => {
        const words = dedupeWords(ta.value.split(''));
        cnt.textContent = words.length;
        // 预览
        const preview = $('preview');
        if (preview) {
          preview.innerHTML = words.length > 0
            ? words.map((w, i) => `<div class="lit-char" title="第 ${i+1} 个字"><span class="lit-char-num">${i+1}</span>${w}</div>`).join('')
            : '<div style="color:var(--text2);padding:20px">还没有字, 请在上面的输入框中输入</div>';
        }
      };
      ta.addEventListener('input', update);
      update();
    }

    $('saveBtn')?.addEventListener('click', () => {
      const text = ta.value;
      const words = dedupeWords(text.split(''));
      if (words.length < 1) {
        alert('请至少输入 1 个字!');
        return;
      }
      if (words.length > 200) {
        if (!confirm(`当前 ${words.length} 个字, 超过 200. 继续保存?`)) return;
      }
      saveWords(words);
      $('savedHint').classList.add('show');
      setTimeout(() => $('savedHint').classList.remove('show'), 2000);
    });

    $('clearBtn')?.addEventListener('click', () => {
      if (confirm('确定清空所有字吗? 此操作不可恢复。')) {
        ta.value = '';
        ta.dispatchEvent(new Event('input'));
      }
    });

    $('defaultBtn')?.addEventListener('click', () => {
      ta.value = DEFAULT_WORDS.join('');
      ta.dispatchEvent(new Event('input'));
    });

    // 预设模板
    const presetsEl = $('presets');
    if (presetsEl) {
      presetsEl.innerHTML = Object.keys(PRESETS).map(name =>
        `<button class="lit-preset-btn" data-name="${name}" type="button">${name}</button>`
      ).join('');
      presetsEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('lit-preset-btn')) {
          const name = e.target.dataset.name;
          ta.value = (PRESETS[name] || []).join('');
          ta.dispatchEvent(new Event('input'));
        }
      });
    }
  }

  // ── 启动 ──────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    if ($('wordsGrid')) { renderHome(); bindHome(); }
    if ($('qChar')) { bindPlay(); }
    if ($('wordsTextarea')) { renderEdit(); }
  });

  function bindPlay() {
    $('btnCorrect').addEventListener('click', () => onJudge('correct'));
    $('btnWrong').addEventListener('click', () => onJudge('wrong'));
    // 键盘: ← 错, → 对
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') onJudge('wrong');
      else if (e.key === 'ArrowRight') onJudge('correct');
    });
    renderPlay();
  }
})();
