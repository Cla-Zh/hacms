/* ============================================================
   认字识字 · 核心逻辑 (v2 - 复选框列表 + 字表统计 + 错字复习)
   功能:
   1. 字表 localStorage 持久化 (key: hacms_lit_words_v2)
   2. 每字带统计: 出现次数 / 答对次数 / 答错次数 / 答错率
   3. 主页: 复选框列表 + 模式切换 (全量 / 错字复习) + 统计详情折叠
   4. 答题: 极简大字 + 对/错按钮 (无提示)
   5. 编辑: 文本输入 + 12 个预设模板
   ============================================================ */

(() => {
  'use strict';

  // ── 存储 key ──────────────────────────────────────
  const WORDS_KEY = 'hacms_lit_words_v2';      // [{c, addedAt, correct, wrong, lastResult, lastTs}]
  const ROUNDS_KEY = 'hacms_lit_rounds_v2';    // [{ts, mode, poolSize, correct, wrong, results:[{c,judge,ts}]}]
  const LEGACY_V1 = 'hacms_lit_words_v1';      // v1 旧数据迁移

  // ── 预设模板 (12 个) ──────────────────────────────────────
  const PRESETS = {
    '数字 1-10':       ['一','二','三','四','五','六','七','八','九','十'],
    '数字 1-100':      '一二三四五六七八九十百千'.split('').concat(['零','壹','贰','叁','肆','伍','陆','柒','捌','玖','拾','佰','仟','万','亿']),
    '家庭成员':         ['爸','妈','爷','奶','哥','姐','弟','妹','叔','姨','伯','姑','舅','嫂','婿','夫','妻','儿','女','孙'],
    '动物世界':         ['狗','猫','鱼','鸟','马','牛','羊','猪','鸡','鸭','虎','兔','龙','蛇','鼠','熊','猴','象','鹿','龟'],
    '水果蔬菜':         ['苹','果','香','蕉','西','瓜','葡','萄','桃','梨','橘','柚','菠','萝','莓','樱','芒','椰','番','茄','萝','卜','白','菜','豆','瓜'],
    '身体部位':         ['头','眼','耳','口','手','足','心','鼻','牙','舌','眉','嘴','脑','骨','血','脸','腰','腿','臂','指'],
    '颜色形状':         ['红','黄','蓝','绿','紫','橙','粉','黑','白','灰','圆','方','三','角','线','点','块','条','片','面'],
    '自然天地':         ['天','地','山','水','火','风','雨','雪','云','月','日','星','海','河','湖','林','草','花','树','石'],
    '常用动词':         ['走','跑','跳','看','听','说','读','写','画','唱','跳','爬','飞','游','坐','站','睡','醒','吃','喝'],
    '学习用品':         ['书','本','笔','纸','尺','刀','桌','椅','门','窗','台','灯','钟','表','袋','包','箱','柜','床','镜'],
    '称谓礼貌':         ['你','我','他','她','它','们','的','了','是','在','有','和','请','谢','对','不','好','再','见','吗'],
    '小学必会 200':     ('的一是不了人我在有他这为之大来以个中上们到说时要就出会也你对生能而子那得于着下自之年过发后作里用道行所然家种事成方多经面小理出只此外各家期工力水电花边心四五官文体美公同三己再民想出加定长北去日给听'.repeat(2).split('').filter((v,i,a)=>a.indexOf(v)===i).slice(0,200)),
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
  function dedupeChars(list) {
    const set = new Set();
    for (const w of list) {
      if (typeof w !== 'string') continue;
      for (const ch of w.trim()) {
        if (ch.trim()) set.add(ch);
      }
    }
    return Array.from(set);
  }

  // ── 字表存储 ──────────────────────────────────────
  // 词条结构: {c:'字', addedAt:ts, correct:N, wrong:N, lastResult:'correct'|'wrong', lastTs:ts}
  function loadWords() {
    // 1) v2 localStorage
    try {
      const raw = LearnData.lsGet(WORDS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
    } catch (e) {}
    // 2) v1 迁移 (旧字表 → v2)
    try {
      const raw = LearnData.lsGet(LEGACY_V1);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) {
          const now = Date.now();
          const migrated = arr.map(c => ({c, addedAt: now, correct: 0, wrong: 0, lastResult: null, lastTs: null}));
          saveWords(migrated);
          return migrated;
        }
      }
    } catch (e) {}
    // 3) 默认: 数字 1-10
    return makeFreshWords(PRESETS['数字 1-10']);
  }
  function makeFreshWords(chars) {
    const now = Date.now();
    return chars.map(c => ({c, addedAt: now, correct: 0, wrong: 0, lastResult: null, lastTs: null}));
  }
  function saveWords(arr) {
    try {
      LearnData.lsSet(WORDS_KEY, JSON.stringify(arr));
      const xml = LearnData.wordsToXml(arr.map(w => w.c), { source: 'literacy-v2-save' });
      LearnData.lsSet(WORDS_KEY + '_xml', xml);
    } catch (e) { console.warn('saveWords failed', e); }
  }

  // 软链 fetch (可选)
  async function loadWordsFromDataDir() {
    if (!window.fetch) return null;
    try {
      const xml = await LearnData.fetchFromDataDir('word-list.xml');
      if (xml) {
        const arr = LearnData.xmlToWords(xml);
        if (arr && arr.length > 0) {
          // 合并到现有列表, 保留统计
          const existing = loadWords();
          const map = new Map(existing.map(w => [w.c, w]));
          for (const c of arr) {
            if (!map.has(c)) {
              map.set(c, {c, addedAt: Date.now(), correct: 0, wrong: 0, lastResult: null, lastTs: null});
            }
          }
          const merged = Array.from(map.values());
          saveWords(merged);
          return merged;
        }
      }
    } catch (e) {}
    return null;
  }

  // 答题记录
  function loadRounds() {
    try {
      const raw = LearnData.lsGet(ROUNDS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
    } catch (e) {}
    return [];
  }
  function saveRound(round) {
    const arr = loadRounds();
    arr.unshift(round);
    if (arr.length > 200) arr.length = 200;
    try {
      LearnData.lsSet(ROUNDS_KEY, JSON.stringify(arr));
      const xml = LearnData.historyToXml(arr, { source: 'literacy-v2-round' });
      LearnData.lsSet(ROUNDS_KEY + '_xml', xml);
    } catch (e) {}
  }

  // 字级统计更新
  function updateWordStat(c, judge, ts) {
    const arr = loadWords();
    const w = arr.find(x => x.c === c);
    if (w) {
      if (judge === 'correct') w.correct = (w.correct || 0) + 1;
      else w.wrong = (w.wrong || 0) + 1;
      w.lastResult = judge;
      w.lastTs = ts;
      saveWords(arr);
    }
  }

  // ── 主页 (index.html) ──────────────────────────────────────
  function renderHome() {
    const words = loadWords();
    const checked = loadChecked();
    const list = $('wordList');
    const empty = $('emptyState');
    if (!list) return;

    if (words.length === 0) {
      list.innerHTML = '';
      if (empty) empty.style.display = '';
    } else {
      if (empty) empty.style.display = 'none';
      list.innerHTML = words.map((w, i) => {
        const total = (w.correct || 0) + (w.wrong || 0);
        const acc = total > 0 ? Math.round((w.correct / total) * 100) : null;
        const lastIcon = w.lastResult === 'correct' ? '✅' : w.lastResult === 'wrong' ? '❌' : '🆕';
        const statBadge = total > 0
          ? `<span class="lit-row-stat ${acc >= 80 ? 'good' : acc >= 50 ? 'mid' : 'bad'}">对${w.correct || 0} / 错${w.wrong || 0} (${acc}%)</span>`
          : `<span class="lit-row-stat none">未练过</span>`;
        return `<li class="lit-row" data-c="${w.c}">
          <label class="lit-row-check"><input type="checkbox" class="lit-word-cb" data-c="${w.c}" ${checked.has(w.c) ? 'checked' : ''}><span class="lit-row-num">${i + 1}</span><span class="lit-row-char">${w.c}</span></label>
          <span class="lit-row-last">${lastIcon}</span>
          ${statBadge}
        </li>`;
      }).join('');
    }
    updateHomeStats();
    updateSelectionBar();
  }
  function updateHomeStats() {
    const words = loadWords();
    const total = words.length;
    const practiced = words.filter(w => (w.correct || 0) + (w.wrong || 0) > 0).length;
    const mastered = words.filter(w => {
      const t = (w.correct || 0) + (w.wrong || 0);
      return t >= 3 && ((w.correct / t) >= 0.8);
    }).length;
    const wrongCount = words.filter(w => (w.wrong || 0) > 0).length;
    const $w = $('wordCount'), $p = $('practicedCount'), $m = $('masteredCount'), $wr = $('wrongCount');
    if ($w) $w.textContent = total;
    if ($p) $p.textContent = practiced;
    if ($m) $m.textContent = mastered;
    if ($wr) $wr.textContent = wrongCount;
  }
  function updateSelectionBar() {
    const cbs = document.querySelectorAll('.lit-word-cb');
    const checked = Array.from(cbs).filter(c => c.checked).length;
    const total = cbs.length;
    const $bar = $('selectionBar');
    const $num = $('selectionNum');
    if ($bar) $bar.style.display = total > 0 ? '' : 'none';
    if ($num) $num.textContent = `${checked} / ${total}`;
    saveChecked(getCheckedSet());
  }
  function getCheckedSet() {
    const set = new Set();
    document.querySelectorAll('.lit-word-cb:checked').forEach(cb => set.add(cb.dataset.c));
    return set;
  }
  function loadChecked() {
    try {
      const raw = LearnData.lsGet('hacms_lit_checked_v2');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return new Set(arr);
      }
    } catch (e) {}
    // 默认全选
    return new Set(loadWords().map(w => w.c));
  }
  function saveChecked(set) {
    try { LearnData.lsSet('hacms_lit_checked_v2', JSON.stringify(Array.from(set))); } catch (e) {}
  }
  function bindHome() {
    // 全选/反选/清空
    $('btnSelectAll')?.addEventListener('click', () => {
      document.querySelectorAll('.lit-word-cb').forEach(cb => cb.checked = true);
      updateSelectionBar();
    });
    $('btnSelectNone')?.addEventListener('click', () => {
      document.querySelectorAll('.lit-word-cb').forEach(cb => cb.checked = false);
      updateSelectionBar();
    });
    $('btnSelectInverse')?.addEventListener('click', () => {
      document.querySelectorAll('.lit-word-cb').forEach(cb => cb.checked = !cb.checked);
      updateSelectionBar();
    });
    $('btnSelectWrong')?.addEventListener('click', () => {
      const words = loadWords();
      const wrongChars = new Set(words.filter(w => (w.wrong || 0) > 0).map(w => w.c));
      document.querySelectorAll('.lit-word-cb').forEach(cb => cb.checked = wrongChars.has(cb.dataset.c));
      updateSelectionBar();
    });
    $('btnSelectMastered')?.addEventListener('click', () => {
      const words = loadWords();
      const mastered = new Set(words.filter(w => {
        const t = (w.correct || 0) + (w.wrong || 0);
        return t >= 3 && ((w.correct / t) >= 0.8);
      }).map(w => w.c));
      document.querySelectorAll('.lit-word-cb').forEach(cb => cb.checked = mastered.has(cb.dataset.c));
      updateSelectionBar();
    });
    // 列表点击行 → 切换勾选
    const list = $('wordList');
    if (list) {
      list.addEventListener('change', (e) => {
        if (e.target.classList.contains('lit-word-cb')) updateSelectionBar();
      });
      // 点击字行 (非 checkbox) 也勾选
      list.addEventListener('click', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'LABEL') return;
        const row = e.target.closest('.lit-row');
        if (!row) return;
        const cb = row.querySelector('.lit-word-cb');
        if (cb) { cb.checked = !cb.checked; updateSelectionBar(); }
      });
    }
    // 模式: 全部 / 错字
    $('btnStartAll')?.addEventListener('click', () => {
      const set = getCheckedSet();
      if (set.size === 0) { alert('请至少勾选 1 个字!'); return; }
      startRound('all', set);
    });
    $('btnStartWrong')?.addEventListener('click', () => {
      const set = getCheckedSet();
      if (set.size === 0) { alert('请至少勾选 1 个字!'); return; }
      startRound('wrong', set);
    });
    // 删除字
    $('btnDelete')?.addEventListener('click', () => {
      const set = getCheckedSet();
      if (set.size === 0) { alert('请先勾选要删除的字!'); return; }
      if (!confirm(`确定从字表中删除 ${set.size} 个字? 此操作不可恢复。`)) return;
      const arr = loadWords().filter(w => !set.has(w.c));
      saveWords(arr);
      renderHome();
    });
    // 折叠/展开统计详情
    $('btnToggleStats')?.addEventListener('click', () => {
      const detail = $('statsDetail');
      if (!detail) return;
      const shown = detail.style.display !== 'none';
      detail.style.display = shown ? 'none' : '';
      $('btnToggleStats').textContent = shown ? '📊 查看统计详情' : '📊 收起统计';
      if (!shown) renderStatsDetail();
    });
  }
  function startRound(mode, charSet) {
    const arr = Array.from(charSet);
    sessionStorage.setItem('hacms_lit_round_v2', JSON.stringify({mode, chars: arr, ts: Date.now()}));
    window.location.href = 'play.html';
  }
  function renderStatsDetail() {
    const el = $('statsDetail');
    if (!el) return;
    const words = loadWords();
    const rounds = loadRounds();
    const sorted = [...words].sort((a, b) => {
      // 错字优先 → 答错率高优先 → 答错次数多优先
      const ar = (a.correct || 0) + (a.wrong || 0);
      const br = (b.correct || 0) + (b.wrong || 0);
      const arR = ar > 0 ? (a.wrong || 0) / ar : 0;
      const brR = br > 0 ? (b.wrong || 0) / br : 0;
      if (brR !== arR) return brR - arR;
      return (b.wrong || 0) - (a.wrong || 0);
    });
    const recentRounds = rounds.slice(0, 10);
    el.innerHTML = `
      <div class="lit-stats-grid">
        <div class="lit-stats-block">
          <h4>🚨 错字排行 (前 20)</h4>
          ${sorted.filter(w => (w.wrong || 0) > 0).slice(0, 20).map(w => {
            const t = (w.correct || 0) + (w.wrong || 0);
            const r = t > 0 ? Math.round((w.wrong / t) * 100) : 0;
            return `<div class="lit-stat-row bad"><span class="lit-row-char">${w.c}</span><span>对 ${w.correct||0} / 错 ${w.wrong||0} (${r}%)</span></div>`;
          }).join('') || '<div style="color:var(--text2);padding:8px">暂无错字 🎉</div>'}
        </div>
        <div class="lit-stats-block">
          <h4>🌟 掌握字 (练习≥3 正确率≥80%)</h4>
          ${words.filter(w => {
            const t = (w.correct || 0) + (w.wrong || 0);
            return t >= 3 && (w.correct / t) >= 0.8;
          }).map(w => `<div class="lit-stat-row good"><span class="lit-row-char">${w.c}</span><span>对 ${w.correct||0} / 错 ${w.wrong||0}</span></div>`).join('') || '<div style="color:var(--text2);padding:8px">尚未掌握任何字</div>'}
        </div>
        <div class="lit-stats-block" style="grid-column: 1 / -1">
          <h4>📜 最近 10 次答题</h4>
          ${recentRounds.length === 0 ? '<div style="color:var(--text2);padding:8px">暂无记录</div>' :
            recentRounds.map(r => {
              const acc = r.poolSize > 0 ? Math.round((r.correct / r.poolSize) * 100) : 0;
              const d = new Date(r.ts);
              const t = `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
              return `<div class="lit-stat-row"><span style="font-family:monospace">${t}</span><span>${r.mode === 'wrong' ? '🎯 错字' : '📚 全量'}</span><span>对 ${r.correct} / 错 ${r.wrong} (${acc}%)</span><span>用时 ${formatTime(r.elapsedMs || 0)}</span></div>`;
            }).join('')
          }
        </div>
      </div>
    `;
  }

  // ── 答题 (play.html) ──────────────────────────────────────
  const playState = {
    pool: [],         // [{c, judge?, ts?}]
    qIndex: 0,
    correct: 0,
    wrong: 0,
    startTime: null,
    elapsedMs: 0,
    timerHandle: null,
    mode: 'all',
    chars: [],
  };

  function startTimer() {
    if (playState.timerHandle) return;
    playState.startTime = Date.now() - playState.elapsedMs;
    playState.timerHandle = setInterval(() => {
      playState.elapsedMs = Date.now() - playState.startTime;
      const t = $('timer');
      if (t) t.textContent = formatTime(playState.elapsedMs);
    }, 250);
  }
  function stopTimer() {
    if (playState.timerHandle) { clearInterval(playState.timerHandle); playState.timerHandle = null; }
  }

  function renderPlay() {
    const raw = sessionStorage.getItem('hacms_lit_round_v2');
    if (!raw) {
      alert('没有答题数据, 请从主页开始');
      window.location.href = 'index.html';
      return;
    }
    const cfg = JSON.parse(raw);
    playState.mode = cfg.mode || 'all';
    playState.chars = cfg.chars || [];
    // 错字模式: 从勾选字中过滤掉已答对的 (>=3 次 + 正确率>=80%) — 但保留所有错过的字
    let poolChars = [...playState.chars];
    if (playState.mode === 'wrong') {
      const words = loadWords();
      const map = new Map(words.map(w => [w.c, w]));
      poolChars = poolChars.filter(c => {
        const w = map.get(c);
        if (!w) return true;  // 没练过 → 算"需要练"
        return (w.wrong || 0) > 0;  // 只取有错过的
      });
    }
    if (poolChars.length === 0) {
      alert(playState.mode === 'wrong' ? '勾选范围内暂无需要复习的错字! 请在主页点 "全量作答" 或勾选其他字' : '字表为空!');
      window.location.href = 'index.html';
      return;
    }
    // 出题: 全部 (字少时) 或 20 道
    const TOTAL = Math.min(20, poolChars.length);
    playState.pool = shuffle(poolChars.map(c => ({c, judge: null, ts: null}))).slice(0, TOTAL);
    playState.qIndex = 0;
    playState.correct = 0;
    playState.wrong = 0;
    playState.elapsedMs = 0;
    playState.startTime = null;
    renderQuestion();
  }

  function renderQuestion() {
    if (playState.qIndex >= playState.pool.length) { finishRound(); return; }
    const q = playState.pool[playState.qIndex];
    const $q = $('qChar');
    if ($q) $q.textContent = q.c;
    const $qi = $('qIndex'); if ($qi) $qi.textContent = playState.qIndex + 1;
    const $qt = $('qTotal'); if ($qt) $qt.textContent = playState.pool.length;
    const $cs = $('correctScore'); if ($cs) $cs.textContent = playState.correct;
    const $ws = $('wrongScore'); if ($ws) $ws.textContent = playState.wrong;
    // 进度条
    const $pf = $('progressFill');
    if ($pf) $pf.style.width = ((playState.qIndex / playState.pool.length) * 100) + '%';
    // 模式标签
    const $ml = $('modeLabel');
    if ($ml) $ml.textContent = playState.mode === 'wrong' ? '🎯 错字复习' : '📚 全量作答';
  }

  function onJudge(judge) {
    if (playState.qIndex >= playState.pool.length) return;
    const ts = Date.now();
    const q = playState.pool[playState.qIndex];
    q.judge = judge;
    q.ts = ts;
    if (judge === 'correct') playState.correct++;
    else playState.wrong++;
    // 第一次点击 → 开始计时
    if (playState.startTime === null) startTimer();
    // 更新字级统计
    updateWordStat(q.c, judge, ts);
    // 极简反馈: 整屏闪一下绿/红
    const $b = document.body;
    $b.classList.add(judge === 'correct' ? 'flash-good' : 'flash-bad');
    setTimeout(() => $b.classList.remove(judge === 'correct' ? 'flash-good' : 'flash-bad'), 200);
    setTimeout(() => {
      playState.qIndex++;
      renderQuestion();
    }, 220);
  }

  function finishRound() {
    stopTimer();
    const round = {
      ts: Date.now(),
      mode: playState.mode,
      poolSize: playState.pool.length,
      correct: playState.correct,
      wrong: playState.wrong,
      elapsedMs: playState.elapsedMs,
      results: playState.pool.filter(x => x.judge),
    };
    saveRound(round);
    const accuracy = round.poolSize > 0 ? Math.round((round.correct / round.poolSize) * 100) : 0;
    const modal = document.createElement('div');
    modal.className = 'lit-modal';
    modal.innerHTML = `
      <div class="lit-modal-card">
        <div class="lit-modal-emoji">${accuracy >= 80 ? '🏆' : accuracy >= 60 ? '👍' : '💪'}</div>
        <div class="lit-modal-title">${accuracy >= 80 ? '真棒!' : accuracy >= 60 ? '不错!' : '继续加油!'}</div>
        <div class="lit-modal-stats">
          <div class="lit-modal-stat"><div class="lit-modal-stat-num">${round.correct}</div><div class="lit-modal-stat-label">答对</div></div>
          <div class="lit-modal-stat"><div class="lit-modal-stat-num">${round.wrong}</div><div class="lit-modal-stat-label">答错</div></div>
          <div class="lit-modal-stat"><div class="lit-modal-stat-num">${accuracy}%</div><div class="lit-modal-stat-label">正确率</div></div>
          <div class="lit-modal-stat"><div class="lit-modal-stat-num">${formatTime(round.elapsedMs)}</div><div class="lit-modal-stat-label">用时</div></div>
        </div>
        <button class="lit-modal-btn" id="btnAgain">再来一组 🔁</button>
        <button class="lit-modal-btn alt" id="btnHome">回首页 🏠</button>
      </div>
    `;
    document.body.appendChild(modal);
    $('btnAgain').onclick = () => { modal.remove(); playState.qIndex = 0; playState.correct = 0; playState.wrong = 0; playState.elapsedMs = 0; playState.startTime = null; renderQuestion(); };
    $('btnHome').onclick = () => { window.location.href = 'index.html'; };
  }

  function bindPlay() {
    $('btnCorrect')?.addEventListener('click', () => onJudge('correct'));
    $('btnWrong')?.addEventListener('click', () => onJudge('wrong'));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') onJudge('correct');
      else if (e.key === 'ArrowLeft' || e.key === 'Backspace') onJudge('wrong');
    });
    renderPlay();
  }

  // ── 编辑 (edit.html) ──────────────────────────────────────
  function renderEdit() {
    const ta = $('wordsTextarea');
    if (ta) ta.value = loadWords().map(w => w.c).join('');

    const cnt = $('charCount');
    if (ta && cnt) {
      const update = () => {
        const words = dedupeChars(ta.value.split(''));
        cnt.textContent = words.length;
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
      const chars = dedupeChars(text.split(''));
      if (chars.length < 1) { alert('请至少输入 1 个字!'); return; }
      // 合并到现有 (保留原字统计)
      const existing = loadWords();
      const map = new Map(existing.map(w => [w.c, w]));
      for (const c of chars) {
        if (!map.has(c)) {
          map.set(c, {c, addedAt: Date.now(), correct: 0, wrong: 0, lastResult: null, lastTs: null});
        }
      }
      saveWords(Array.from(map.values()));
      $('savedHint').classList.add('show');
      setTimeout(() => $('savedHint').classList.remove('show'), 2000);
    });

    // 清空所有字 (⚠ 警告)
    $('clearBtn')?.addEventListener('click', () => {
      if (!confirm('⚠️ 确定清空所有字吗?\n\n所有字 + 所有统计 + 错字记录全部清空, 不可恢复!\n\n(建议先 "导出 XML" 备份)')) return;
      saveWords([]);
      ta.value = '';
      ta.dispatchEvent(new Event('input'));
    });
    // 恢复默认 = 把数字 1-10 追加到当前
    $('defaultBtn')?.addEventListener('click', () => {
      if (!confirm('追加数字 1-10 到当前字表末尾? (不会覆盖现有字)')) return;
      const current = dedupeChars((ta.value || '').split(''));
      const combined = dedupeChars(current.concat(PRESETS['数字 1-10']));
      ta.value = combined.join('');
      ta.dispatchEvent(new Event('input'));
      $('savedHint').classList.add('show');
      setTimeout(() => $('savedHint').classList.remove('show'), 1500);
    });
    // 导出 XML
    $('exportXmlBtn')?.addEventListener('click', () => {
      const text = ta.value;
      const words = dedupeChars(text.split(''));
      if (words.length < 1) { alert('请至少输入 1 个字!'); return; }
      // 合并保存
      const existing = loadWords();
      const map = new Map(existing.map(w => [w.c, w]));
      for (const c of words) {
        if (!map.has(c)) map.set(c, {c, addedAt: Date.now(), correct: 0, wrong: 0, lastResult: null, lastTs: null});
      }
      saveWords(Array.from(map.values()));
      // 导出 XML (只导出字, 不含统计 — 统计是 v2 内部结构)
      const xml = LearnData.wordsToXml(words, { source: 'literacy-v2-export' });
      const ts = new Date().toISOString().slice(0, 10);
      LearnData.downloadXml(`word-list-${ts}.xml`, xml);
      alert(`✅ 已导出 ${words.length} 个字为 XML。\n\n提示: 把下载的 XML 文件保存到:\n  /mnt/g/hermes_data/learn-data/literacy/word-list.xml\n\n下次任意浏览器打开主页会自动加载!`);
    });
    // 导入 XML
    $('importXmlFile')?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const xml = await LearnData.readXmlFile(file);
        const arr = LearnData.xmlToWords(xml);
        if (!arr) { alert('XML 解析失败, 请检查格式'); return; }
        ta.value = arr.join('');
        ta.dispatchEvent(new Event('input'));
        saveWords(makeFreshWords(arr));  // 替换 (导入 = 全新)
        alert(`✅ 导入成功! 共 ${arr.length} 个字\n\n注意: 导入会替换当前字表, 原有统计清空。`);
      } catch (err) { alert('导入失败: ' + err.message); }
      e.target.value = '';
    });

    // 预设
    const presetsEl = $('presets');
    if (presetsEl) {
      presetsEl.innerHTML = Object.keys(PRESETS).map(name =>
        `<button class="lit-preset-btn" data-name="${name}" type="button">${name}</button>`
      ).join('');
      presetsEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('lit-preset-btn')) {
          const name = e.target.dataset.name;
          let chars = PRESETS[name];
          if (typeof chars === 'string') chars = chars.split('');
          // 追加: 把预设字加到当前 textarea 末尾 (已去重)
          const current = dedupeChars((ta.value || '').split(''));
          const combined = dedupeChars(current.concat(chars || []));
          ta.value = combined.join('');
          ta.dispatchEvent(new Event('input'));
          $('savedHint').classList.add('show');
          setTimeout(() => $('savedHint').classList.remove('show'), 1500);
        }
      });
    }
  }

  // ── 启动 ──────────────────────────────────────
  document.addEventListener('DOMContentLoaded', async () => {
    // 先从软链 fetch 同步 (如果 XML 存在, 合并到字表)
    const remote = await loadWordsFromDataDir();
    if ($('wordList')) {
      // 软链 fetch 后, 处理 checked 默认值
      const words = loadWords();
      const allChars = new Set(words.map(w => w.c));
      const rawChecked = LearnData.lsGet('hacms_lit_checked_v2');
      if (!rawChecked) {
        // 首次: 默认全选所有字
        saveChecked(allChars);
      } else {
        // 已有 checked: 只加入软链/新增字 (不动用户已取消的)
        const checked = new Set(JSON.parse(rawChecked));
        for (const c of allChars) {
          if (!checked.has(c)) checked.add(c);
        }
        saveChecked(checked);
      }
      renderHome();
      bindHome();
    }
    if ($('qChar')) { bindPlay(); }
    if ($('wordsTextarea')) { renderEdit(); }
  });

  // 跨 tab 同步
  window.addEventListener('storage', (e) => {
    if (e.key === WORDS_KEY || e.key === ROUNDS_KEY) {
      if ($('wordList')) renderHome();
    }
  });
})();
