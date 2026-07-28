/* ============================================================
   认字识字 · 核心逻辑 v3 (字表集合 Group 模型)
   ============================================================
   数据模型:
   - groups: [{id, name, icon, color, words:[字], createdAt, updatedAt, lastTs,
              stats:{rounds, correct, wrong, masteredChars, learnedChars},
              perChar: {字: {correct, wrong, lastResult, lastTs}}}]
   - 主页: 集合列表 (集合卡片)
   - 集合详情: group.html?id=xxx → 字列表 + 统计 + 开始/编辑/删除
   - 练习: 固定从某集合出题 (mode 固定 all)
   ============================================================ */

(() => {
  'use strict';

  const GROUPS_KEY = 'hacms_lit_groups_v3';      // 主存储
  const ROUNDS_KEY = 'hacms_lit_rounds_v3';      // 答题记录
  const LEGACY_V2_WORDS = 'hacms_lit_words_v2';  // 旧 v2 字表 → v3 集合迁移
  const LEGACY_V2_CHECKED = 'hacms_lit_checked_v2';

  // ── 工具 ──────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const $qs = (sel) => document.querySelector(sel);
  const randInt = (n) => Math.floor(Math.random() * n);
  const uid = () => 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
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
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function getQuery(name) {
    return new URLSearchParams(location.search).get(name);
  }
  function navTo(url) { window.location.href = url; }

  // ── 预设 (字表集合) ──────────────────────────────────────
  const PRESET_GROUPS = [
    { name: '数字 1-10',     icon: '🔢', color: '#64B5F6', words: '一二三四五六七八九十'.split('') },
    { name: '数字 1-100',    icon: '💯', color: '#42A5F5', words: '一二三四五六七八九十百千零'.split('').concat(['壹','贰','叁','肆','伍','陆','柒','捌','玖','拾']) },
    { name: '家庭成员',      icon: '👨‍👩‍👧', color: '#F06292', words: '爸妈爷爷奶奶哥哥姐姐弟弟妹妹叔叔阿姨'.split('') },
    { name: '动物世界',      icon: '🐶', color: '#FFB74D', words: '狗猫鱼鸟马牛羊猪鸡鸭虎兔龙蛇鼠熊猴象鹿龟'.split('') },
    { name: '水果蔬菜',      icon: '🍎', color: '#EF5350', words: '苹果香蕉西瓜葡萄桃梨橘柚菠萝樱桃芒果番茄萝卜白菜豆'.split('') },
    { name: '身体部位',      icon: '👀', color: '#EC407A', words: '头眼耳口手足心鼻牙舌眉嘴脑骨血脸腰腿臂指'.split('') },
    { name: '颜色形状',      icon: '🎨', color: '#AB47BC', words: '红黄蓝绿紫橙粉黑白灰圆方三角线点块条片面'.split('') },
    { name: '自然天地',      icon: '🌳', color: '#66BB6A', words: '天地山水火风雨雪云月日星海河湖林草花树石'.split('') },
    { name: '常用动词',      icon: '🏃', color: '#5C6BC0', words: '走跑跳看听说读写画唱爬飞游坐站睡醒吃喝'.split('') },
    { name: '学习用品',      icon: '📚', color: '#26A69A', words: '书本笔纸尺刀桌椅门窗台灯钟表袋包箱柜床镜'.split('') },
    { name: '称谓礼貌',      icon: '🙏', color: '#FFA726', words: '你我他她它们的了是在有和请谢对不好再见吗'.split('') },
    { name: '小学必会 200',  icon: '🎓', color: '#7E57C2', words: null },  // 特殊: 调用 LearnData 从 200 字生成
  ];

  // 颜色预设 (新建集合时)
  const COLORS = ['#F06292','#64B5F6','#66BB6A','#FFB74D','#AB47BC','#26A69A','#EF5350','#42A5F5','#EC407A','#5C6BC0','#FFA726','#7E57C2'];
  const ICONS = ['📚','🔢','🌳','🐶','🍎','🎨','👀','🏃','🎓','🙏','💯','🌟','⚽','🚗','🎵','🎯','🌈','🍀','☀️','🌙'];

  // ── 存储 ──────────────────────────────────────
  function loadGroups() {
    try {
      const raw = LearnData.lsGet(GROUPS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
    } catch (e) {}
    // 迁移: v2 字表 → v3 默认集合
    return migrateV2();
  }
  function saveGroups(arr) {
    try {
      LearnData.lsSet(GROUPS_KEY, JSON.stringify(arr));
      const xml = groupsToXml(arr);
      LearnData.lsSet(GROUPS_KEY + '_xml', xml);
    } catch (e) {}
  }
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
    } catch (e) {}
  }

  // v2 → v3 迁移: 把 v2 字表变成 "我的字表" 默认集合
  function migrateV2() {
    let words = [];
    try {
      const raw = LearnData.lsGet(LEGACY_V2_WORDS);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) words = arr.map(w => w.c);
      }
    } catch (e) {}
    if (words.length === 0) {
      // 全新用户: 创建 "数字 1-10" 默认集合
      words = PRESET_GROUPS[0].words;
    }
    const group = createGroup('我的字表', '📚', '#F06292', words);
    const arr = [group];
    saveGroups(arr);
    return arr;
  }

  function createGroup(name, icon, color, words) {
    const now = Date.now();
    return {
      id: uid(),
      name: name || '未命名集合',
      icon: icon || '📚',
      color: color || COLORS[0],
      words: dedupeChars(words || []),
      createdAt: now,
      updatedAt: now,
      stats: { rounds: 0, correct: 0, wrong: 0, learnedChars: 0, masteredChars: 0 },
      perChar: {},
    };
  }
  function getGroup(id) {
    return loadGroups().find(g => g.id === id);
  }
  function saveGroup(g) {
    const arr = loadGroups();
    const i = arr.findIndex(x => x.id === g.id);
    if (i >= 0) {
      g.updatedAt = Date.now();
      arr[i] = g;
    } else {
      arr.unshift(g);
    }
    saveGroups(arr);
  }
  function deleteGroup(id) {
    const arr = loadGroups().filter(g => g.id !== id);
    saveGroups(arr);
  }

  // 字表 XML 转换
  function groupsToXml(groups) {
    const escape = LearnData.escapeXml || ((s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c])));
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<groups version="3" count="' + groups.length + '" savedAt="' + new Date().toISOString() + '">\n';
    for (const g of groups) {
      xml += `  <group id="${escape(g.id)}" name="${escape(g.name)}" icon="${escape(g.icon)}" color="${escape(g.color)}" createdAt="${g.createdAt}">\n`;
      xml += `    <words>${g.words.map(w => `<w>${escape(w)}</w>`).join('')}</words>\n`;
      xml += `    <stats rounds="${g.stats.rounds||0}" correct="${g.stats.correct||0}" wrong="${g.stats.wrong||0}" learnedChars="${g.stats.learnedChars||0}" masteredChars="${g.stats.masteredChars||0}"/>\n`;
      xml += `  </group>\n`;
    }
    xml += '</groups>\n';
    return xml;
  }

  // 字级统计更新 + 集合统计
  function recordAnswer(groupId, char, judge) {
    const g = getGroup(groupId);
    if (!g) return;
    g.perChar[char] = g.perChar[char] || { correct: 0, wrong: 0, lastResult: null, lastTs: null };
    const pc = g.perChar[char];
    if (judge === 'correct') pc.correct++;
    else pc.wrong++;
    pc.lastResult = judge;
    pc.lastTs = Date.now();
    // 集合统计
    g.stats.rounds = (g.stats.rounds || 0) + 1;
    if (judge === 'correct') g.stats.correct++;
    else g.stats.wrong++;
    // 重新计算 learnedChars / masteredChars
    let learned = 0, mastered = 0;
    for (const c of g.words) {
      const p = g.perChar[c];
      if (!p) continue;
      const total = p.correct + p.wrong;
      if (total > 0) learned++;
      if (total >= 3 && (p.correct / total) >= 0.8) mastered++;
    }
    g.stats.learnedChars = learned;
    g.stats.masteredChars = mastered;
    g.lastTs = Date.now();
    saveGroup(g);
  }

  // 集合总览统计
  function totalStats() {
    const groups = loadGroups();
    let totalGroups = groups.length;
    let totalWords = 0, totalLearned = 0, totalMastered = 0, totalWrong = 0;
    for (const g of groups) {
      totalWords += g.words.length;
      totalLearned += g.stats.learnedChars || 0;
      totalMastered += g.stats.masteredChars || 0;
      // 错字总数: 至少答错 1 次的字
      for (const c of g.words) {
        const p = g.perChar[c];
        if (p && p.wrong > 0) totalWrong++;
      }
    }
    return { totalGroups, totalWords, totalLearned, totalMastered, totalWrong };
  }

  // ── 主页: 集合列表 (index.html) ──────────────────────────────────────
  function renderHome() {
    const groups = loadGroups();
    const list = $('groupList');
    const empty = $('emptyState');
    if (!list) return;

    if (groups.length === 0) {
      list.innerHTML = '';
      if (empty) empty.style.display = '';
    } else {
      if (empty) empty.style.display = 'none';
      list.innerHTML = groups.map((g, i) => {
        const total = g.words.length;
        const learned = g.stats.learnedChars || 0;
        const mastered = g.stats.masteredChars || 0;
        const wrongCount = g.words.filter(c => {
          const p = g.perChar[c];
          return p && p.wrong > 0;
        }).length;
        const progress = total > 0 ? Math.round((learned / total) * 100) : 0;
        const lastTs = g.lastTs ? new Date(g.lastTs) : null;
        const lastStr = lastTs ? `${lastTs.getMonth()+1}/${lastTs.getDate()}` : '未练过';
        return `
        <a class="lit-group-card" href="group.html?id=${g.id}" style="--card-color:${g.color}">
          <div class="lit-gc-header">
            <div class="lit-gc-icon">${g.icon}</div>
            <div class="lit-gc-info">
              <div class="lit-gc-name">${escapeHtml(g.name)}</div>
              <div class="lit-gc-sub">📚 ${total} 字 · 最近 ${lastStr}</div>
            </div>
            <div class="lit-gc-arrow">›</div>
          </div>
          <div class="lit-gc-stats">
            <span class="lit-gc-stat">✅ 已练 <b>${learned}</b></span>
            <span class="lit-gc-stat good">🌟 掌握 <b>${mastered}</b></span>
            ${wrongCount > 0 ? `<span class="lit-gc-stat bad">❌ 有错 <b>${wrongCount}</b></span>` : ''}
          </div>
          <div class="lit-gc-progress">
            <div class="lit-gc-progress-fill" style="width:${progress}%;background:${g.color}"></div>
            <div class="lit-gc-progress-text">${progress}% (${learned}/${total})</div>
          </div>
        </a>`;
      }).join('');
    }
    updateHomeStats();
  }
  function updateHomeStats() {
    const s = totalStats();
    const $t = $('totalGroups'), $w = $('totalWords'), $l = $('totalLearned'), $m = $('totalMastered'), $wr = $('totalWrong');
    if ($t) $t.textContent = s.totalGroups;
    if ($w) $w.textContent = s.totalWords;
    if ($l) $l.textContent = s.totalLearned;
    if ($m) $m.textContent = s.totalMastered;
    if ($wr) $wr.textContent = s.totalWrong;
  }
  function bindHome() {
    $('btnNewGroup')?.addEventListener('click', () => {
      // 新建空白集合 → 跳到 group-edit.html?new=1
      window.location.href = 'group-edit.html?new=1';
    });
    $('btnImportGroups')?.addEventListener('click', () => {
      $('importGroupsFile')?.click();
    });
    $('importGroupsFile')?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const xml = await LearnData.readXmlFile(file);
        const groups = parseGroupsXml(xml);
        if (!groups || groups.length === 0) { alert('XML 解析失败, 请检查格式'); return; }
        const arr = loadGroups();
        const merged = arr.concat(groups);
        saveGroups(merged);
        alert(`✅ 导入成功! 新增 ${groups.length} 个集合\n\n点击任意集合开始练习`);
        renderHome();
      } catch (err) { alert('导入失败: ' + err.message); }
      e.target.value = '';
    });
  }

  // 简单 XML → groups 解析 (支持 <groups><group>...</group></groups>)
  function parseGroupsXml(xml) {
    if (!xml) return null;
    const dom = new DOMParser().parseFromString(xml, 'text/xml');
    const groups = dom.querySelectorAll('group');
    if (groups.length === 0) return null;
    const out = [];
    for (const g of groups) {
      const words = Array.from(g.querySelectorAll('words > w')).map(x => x.textContent.trim()).filter(Boolean);
      if (words.length === 0) continue;
      out.push(createGroup(
        g.getAttribute('name') || '导入的集合',
        g.getAttribute('icon') || '📚',
        g.getAttribute('color') || COLORS[0],
        words
      ));
    }
    return out;
  }

  // ── 集合详情: group.html?id=xxx ──────────────────────────────────────
  function renderGroupDetail() {
    const id = getQuery('id');
    if (!id) { alert('未指定集合 ID'); navTo('index.html'); return; }
    const g = getGroup(id);
    if (!g) { alert('集合不存在, 可能已删除'); navTo('index.html'); return; }

    $('groupName') && ($('groupName').textContent = g.name);
    $('groupIcon') && ($('groupIcon').textContent = g.icon);
    $('groupHeader') && ($('groupHeader').style.background = `linear-gradient(135deg, ${g.color} 0%, ${g.color}cc 100%)`);
    document.title = g.name + ' · 认字识字';

    // 顶部统计
    const total = g.words.length;
    const learned = g.stats.learnedChars || 0;
    const mastered = g.stats.masteredChars || 0;
    const wrongCount = g.words.filter(c => g.perChar[c] && g.perChar[c].wrong > 0).length;
    $('gTotal') && ($('gTotal').textContent = total);
    $('gLearned') && ($('gLearned').textContent = learned);
    $('gMastered') && ($('gMastered').textContent = mastered);
    $('gWrong') && ($('gWrong').textContent = wrongCount);

    // 字列表
    const list = $('charList');
    if (list) {
      if (g.words.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text2)">📭 此集合还没有字, 请点 "✏️ 编辑集合" 添加</div>';
      } else {
        list.innerHTML = g.words.map((c, i) => {
          const p = g.perChar[c];
          const total = p ? (p.correct + p.wrong) : 0;
          const acc = total > 0 ? Math.round((p.correct / total) * 100) : null;
          const lastIcon = !p ? '🆕' : p.lastResult === 'correct' ? '✅' : p.lastResult === 'wrong' ? '❌' : '🆕';
          const statBadge = total > 0
            ? `<span class="lit-row-stat ${acc >= 80 ? 'good' : acc >= 50 ? 'mid' : 'bad'}">对${p.correct} / 错${p.wrong} (${acc}%)</span>`
            : `<span class="lit-row-stat none">未练过</span>`;
          return `<li class="lit-row">
            <span class="lit-row-num">${i + 1}</span>
            <span class="lit-row-char">${escapeHtml(c)}</span>
            <span class="lit-row-last">${lastIcon}</span>
            ${statBadge}
          </li>`;
        }).join('');
      }
    }

    // 错字排行 + 答题历史
    renderGroupExtra(g);
  }
  function renderGroupExtra(g) {
    // 错字排行
    const wrong = $('wrongList');
    if (wrong) {
      const arr = g.words
        .map(c => ({ c, p: g.perChar[c] }))
        .filter(x => x.p && x.p.wrong > 0)
        .sort((a, b) => {
          const aT = a.p.correct + a.p.wrong, bT = b.p.correct + b.p.wrong;
          const aR = a.p.wrong / aT, bR = b.p.wrong / bT;
          return bR - aR || b.p.wrong - a.p.wrong;
        });
      wrong.innerHTML = arr.length === 0
        ? '<div style="text-align:center;padding:16px;color:var(--text2)">🎉 此集合暂无错字</div>'
        : arr.slice(0, 15).map(({c, p}) => {
          const t = p.correct + p.wrong;
          const r = Math.round((p.wrong / t) * 100);
          return `<div class="lit-stat-row bad"><span class="lit-row-char">${escapeHtml(c)}</span><span>对 ${p.correct} / 错 ${p.wrong} (${r}%)</span></div>`;
        }).join('');
    }
    // 答题历史
    const rounds = loadRounds().filter(r => r.groupId === g.id).slice(0, 10);
    const hist = $('roundsList');
    if (hist) {
      hist.innerHTML = rounds.length === 0
        ? '<div style="text-align:center;padding:16px;color:var(--text2)">暂无答题记录</div>'
        : rounds.map(r => {
          const acc = r.poolSize > 0 ? Math.round((r.correct / r.poolSize) * 100) : 0;
          const d = new Date(r.ts);
          const t = `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
          return `<div class="lit-stat-row"><span style="font-family:monospace">${t}</span><span>对 ${r.correct} / 错 ${r.wrong} (${acc}%)</span><span>用时 ${formatTime(r.elapsedMs || 0)}</span></div>`;
        }).join('');
    }
  }
  function bindGroupDetail() {
    const id = getQuery('id');
    $('btnStart')?.addEventListener('click', () => {
      const g = getGroup(id);
      if (!g) { alert('集合不存在'); return; }
      if (g.words.length === 0) { alert('此集合还没有字, 请先编辑!'); return; }
      startRound(g);
    });
    $('btnStartWrong')?.addEventListener('click', () => {
      const g = getGroup(id);
      if (!g) return;
      const wrongChars = g.words.filter(c => g.perChar[c] && g.perChar[c].wrong > 0);
      if (wrongChars.length === 0) { alert('🎉 此集合暂无错字, 直接做 "开始练习" 即可'); return; }
      startRound(g, wrongChars);
    });
    $('btnEdit')?.addEventListener('click', () => {
      navTo('group-edit.html?id=' + id);
    });
    $('btnDelete')?.addEventListener('click', () => {
      const g = getGroup(id);
      if (!g) return;
      if (!confirm(`⚠️ 确认删除集合 "${g.name}"?\n\n此集合下所有字的练习记录全部丢失, 不可恢复!\n\n建议先 "📤 导出 XML" 备份`)) return;
      if (!confirm(`再次确认: 删除 "${g.name}" 后无法恢复, 确认删除?`)) return;
      deleteGroup(id);
      alert('✅ 已删除');
      navTo('index.html');
    });
    $('btnExportXml')?.addEventListener('click', () => {
      const g = getGroup(id);
      if (!g) return;
      const xml = groupsToXml([g]);
      const ts = new Date().toISOString().slice(0, 10);
      const safeName = (g.name || 'group').replace(/[^\w\u4e00-\u9fa5]/g, '_');
      LearnData.downloadXml(`group-${safeName}-${ts}.xml`, xml);
      alert(`✅ 已导出集合 "${g.name}"\n\n提示: 把 XML 保存到:\n  /mnt/g/hermes_data/learn-data/literacy/\n\n下次主页会通过 "📥 导入集合" 加载`);
    });
  }

  function startRound(g, charSet) {
    const chars = charSet || g.words;
    sessionStorage.setItem('hacms_lit_round_v3', JSON.stringify({
      groupId: g.id,
      groupName: g.name,
      mode: charSet ? 'wrong' : 'all',
      chars: chars,
      ts: Date.now()
    }));
    navTo('play.html');
  }

  // ── 集合编辑: group-edit.html?id=xxx&new=1 ──────────────────────────────────────
  function renderGroupEdit() {
    const isNew = getQuery('new') === '1';
    const id = getQuery('id');
    let g;
    if (isNew) {
      g = createGroup('新字表集合', '📚', COLORS[0], []);
    } else {
      g = getGroup(id);
      if (!g) { alert('集合不存在'); navTo('index.html'); return; }
    }
    $('groupNameInput') && ($('groupNameInput').value = g.name);
    $('groupIdInput') && ($('groupIdInput').value = g.id);
    // 颜色选择器
    const colorBox = $('colorPicker');
    if (colorBox) {
      colorBox.innerHTML = COLORS.map(c =>
        `<button type="button" class="lit-color-dot" data-color="${c}" style="background:${c};${c === g.color ? 'border:3px solid var(--text);transform:scale(1.15)' : ''}"></button>`
      ).join('');
    }
    // icon 选择器
    const iconBox = $('iconPicker');
    if (iconBox) {
      iconBox.innerHTML = ICONS.map(i =>
        `<button type="button" class="lit-icon-btn" data-icon="${i}" style="${i === g.icon ? 'background:var(--c-pink);color:#fff;transform:scale(1.15)' : ''}">${i}</button>`
      ).join('');
    }
    // 字表 textarea
    $('wordsTextarea') && ($('wordsTextarea').value = g.words.join(''));
    $('charCount') && ($('charCount').textContent = g.words.length);

    // textarea 实时更新
    const ta = $('wordsTextarea');
    if (ta) {
      ta.addEventListener('input', () => {
        const words = dedupeChars(ta.value.split(''));
        $('charCount') && ($('charCount').textContent = words.length);
        $('preview') && ($('preview').innerHTML = words.length > 0
          ? words.map((w, i) => `<div class="lit-char"><span class="lit-char-num">${i+1}</span>${escapeHtml(w)}</div>`).join('')
          : '<div style="color:var(--text2);padding:20px">还没有字, 请在上面输入框输入</div>'
        );
      });
      ta.dispatchEvent(new Event('input'));
    }
  }
  function bindGroupEdit() {
    const id = getQuery('id');
    const isNew = getQuery('new') === '1';

    $('colorPicker')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('lit-color-dot')) {
        const c = e.target.dataset.color;
        e.target.parentNode.querySelectorAll('.lit-color-dot').forEach(x => x.style.cssText = `background:${x.dataset.color};border:2px solid #FFF`);
        e.target.style.cssText = `background:${c};border:3px solid var(--text);transform:scale(1.15)`;
      }
    });
    $('iconPicker')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('lit-icon-btn')) {
        const i = e.target.dataset.icon;
        e.target.parentNode.querySelectorAll('.lit-icon-btn').forEach(x => x.style.cssText = '');
        e.target.style.cssText = 'background:var(--c-pink);color:#fff;transform:scale(1.15)';
      }
    });

    // 预设模板
    const presetsEl = $('presets');
    if (presetsEl) {
      presetsEl.innerHTML = PRESET_GROUPS.map(p =>
        `<button type="button" class="lit-preset-btn" data-name="${p.name}">${p.icon} ${p.name}</button>`
      ).join('');
      presetsEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('lit-preset-btn')) {
          const name = e.target.dataset.name;
          const preset = PRESET_GROUPS.find(p => p.name === name);
          if (!preset) return;
          let words = preset.words;
          if (!words && name === '小学必会 200') {
            words = '的一是不了人我在有他这为之大来以个中上们到说时要就出会也你对生能而子那得于着下自之年过发后作里用道行所然家种事成方多经面小理出只此外各家期工力水电花边心四五官文体美公同三己再民想出加定长北去日给听'.repeat(3).split('').filter((v,i,a)=>a.indexOf(v)===i).slice(0,200);
          }
          if (!words) return;
          const current = dedupeChars(($('wordsTextarea').value || '').split(''));
          const combined = dedupeChars(current.concat(words));
          $('wordsTextarea').value = combined.join('');
          $('wordsTextarea').dispatchEvent(new Event('input'));
          if (isNew) {
            $('groupNameInput') && ($('groupNameInput').value = name);
            $('iconPicker')?.querySelectorAll('.lit-icon-btn').forEach(x => {
              x.style.cssText = '';
              if (x.dataset.icon === preset.icon) x.style.cssText = 'background:var(--c-pink);color:#fff;transform:scale(1.15)';
            });
            $('colorPicker')?.querySelectorAll('.lit-color-dot').forEach(x => {
              x.style.cssText = `background:${x.dataset.color};border:2px solid #FFF`;
              if (x.dataset.color === preset.color) x.style.cssText = `background:${x.dataset.color};border:3px solid var(--text);transform:scale(1.15)`;
            });
          }
        }
      });
    }

    // 保存
    $('saveBtn')?.addEventListener('click', () => {
      const name = ($('groupNameInput').value || '').trim() || '未命名集合';
      const selectedColor = $('colorPicker')?.querySelector('.lit-color-dot[style*="scale(1.15)"]')?.dataset.color || COLORS[0];
      const selectedIcon = $('iconPicker')?.querySelector('.lit-icon-btn[style*="scale(1.15)"]')?.dataset.icon || '📚';
      const words = dedupeChars(($('wordsTextarea').value || '').split(''));
      if (words.length === 0) { alert('请至少输入 1 个字!'); return; }
      if (words.length > 500) { if (!confirm(`当前 ${words.length} 字, 超过 500. 继续保存?`)) return; }

      let g;
      if (isNew) {
        g = createGroup(name, selectedIcon, selectedColor, words);
      } else {
        g = getGroup(id);
        if (!g) { alert('集合不存在'); return; }
        g.name = name;
        g.icon = selectedIcon;
        g.color = selectedColor;
        const oldSet = new Set(g.words);
        const newSet = new Set(words);
        g.words = words;
        for (const c of oldSet) {
          if (!newSet.has(c)) delete g.perChar[c];
        }
      }
      saveGroup(g);
      $('savedHint')?.classList.add('show');
      setTimeout(() => $('savedHint')?.classList.remove('show'), 1500);
      setTimeout(() => navTo('group.html?id=' + g.id), 600);
    });

    // 取消
    $('cancelBtn')?.addEventListener('click', () => {
      if (isNew) navTo('index.html');
      else navTo('group.html?id=' + id);
    });
  }


  // ── 答题 (play.html) ──────────────────────────────────────
  const playState = {
    groupId: null,
    groupName: '',
    mode: 'all',
    pool: [],
    qIndex: 0,
    correct: 0,
    wrong: 0,
    startTime: null,
    elapsedMs: 0,
    timerHandle: null,
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
    const raw = sessionStorage.getItem('hacms_lit_round_v3');
    if (!raw) {
      alert('没有答题数据, 请从集合详情开始');
      navTo('index.html');
      return;
    }
    const cfg = JSON.parse(raw);
    playState.groupId = cfg.groupId;
    playState.groupName = cfg.groupName;
    playState.mode = cfg.mode;
    const poolChars = cfg.chars || [];
    if (poolChars.length === 0) {
      alert('此集合没有字');
      navTo('index.html');
      return;
    }
    const TOTAL = Math.min(20, poolChars.length);
    playState.pool = shuffle(poolChars.map(c => ({c, judge: null, ts: null}))).slice(0, TOTAL);
    playState.qIndex = 0;
    playState.correct = 0;
    playState.wrong = 0;
    playState.elapsedMs = 0;
    playState.startTime = null;
    $('groupLabel') && ($('groupLabel').textContent = `📚 ${playState.groupName}`);
    $('modeLabel') && ($('modeLabel').textContent = playState.mode === 'wrong' ? '🎯 错字复习' : '📚 全量练习');
    renderQuestion();
  }

  function renderQuestion() {
    if (playState.qIndex >= playState.pool.length) { finishRound(); return; }
    const q = playState.pool[playState.qIndex];
    $('qChar') && ($('qChar').textContent = q.c);
    $('qIndex') && ($('qIndex').textContent = playState.qIndex + 1);
    $('qTotal') && ($('qTotal').textContent = playState.pool.length);
    $('correctScore') && ($('correctScore').textContent = playState.correct);
    $('wrongScore') && ($('wrongScore').textContent = playState.wrong);
    const $pf = $('progressFill');
    if ($pf) $pf.style.width = ((playState.qIndex / playState.pool.length) * 100) + '%';
  }

  function onJudge(judge) {
    if (playState.qIndex >= playState.pool.length) return;
    const ts = Date.now();
    const q = playState.pool[playState.qIndex];
    q.judge = judge;
    q.ts = ts;
    if (judge === 'correct') playState.correct++;
    else playState.wrong++;
    if (playState.startTime === null) startTimer();
    recordAnswer(playState.groupId, q.c, judge);
    // 整屏闪
    document.body.classList.add(judge === 'correct' ? 'flash-good' : 'flash-bad');
    setTimeout(() => document.body.classList.remove(judge === 'correct' ? 'flash-good' : 'flash-bad'), 200);
    setTimeout(() => {
      playState.qIndex++;
      renderQuestion();
    }, 220);
  }

  function finishRound() {
    stopTimer();
    const round = {
      ts: Date.now(),
      groupId: playState.groupId,
      groupName: playState.groupName,
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
    $('btnAgain').onclick = () => {
      modal.remove();
      // 重新从 groupId 取字
      const g = getGroup(playState.groupId);
      if (!g) { navTo('index.html'); return; }
      let chars = g.words;
      if (playState.mode === 'wrong') {
        chars = g.words.filter(c => g.perChar[c] && g.perChar[c].wrong > 0);
        if (chars.length === 0) chars = g.words;
      }
      startRound(g, chars);
    };
    $('btnHome').onclick = () => navTo('index.html');
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

  // ── 启动 ──────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    if ($('groupList')) { renderHome(); bindHome(); }
    if ($('groupName') && getQuery('id')) { renderGroupDetail(); bindGroupDetail(); }
    if ($('wordsTextarea')) { renderGroupEdit(); bindGroupEdit(); }
    if ($('qChar')) { bindPlay(); }
  });

  // 跨 tab 同步
  window.addEventListener('storage', (e) => {
    if (e.key === GROUPS_KEY) {
      if ($('groupList')) renderHome();
      if ($('groupName') && getQuery('id')) renderGroupDetail();
    }
  });
})();
