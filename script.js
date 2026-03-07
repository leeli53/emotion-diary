'use strict';

/* ─── Constants ─── */
const STORE_KEY = 'moodDiary_v5';

const MOODS = {
  happy:   { label:'开心', emoji:'😊', img:'assets/开心.png', color:'#b8894a' },
  calm:    { label:'平静', emoji:'😌', img:'assets/平静.png', color:'#4e7d96' },
  sad:     { label:'难过', emoji:'😢', img:'assets/难过.png', color:'#7a6596' },
  anxious: { label:'焦虑', emoji:'😰', img:'assets/焦虑.png', color:'#a07840' },
  angry:   { label:'生气', emoji:'😠', img:'assets/生气.png', color:'#a05050' },
  tired:   { label:'疲惫', emoji:'😴', img:'assets/疲惫.png', color:'#7a7268' },
};

/* ─── State ─── */
let entries    = [];
let activeMood = null;

/* ─── Storage ─── */
const load = () => {
  try { entries = JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
  catch { entries = []; }
};
const save = () => localStorage.setItem(STORE_KEY, JSON.stringify(entries));

/* ─── Date helpers ─── */
const pad2 = n => String(n).padStart(2, '0');
const dateKey = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const monthKey = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
const today    = () => { const d=new Date(); d.setHours(0,0,0,0); return d; };

function calcStreak() {
  if (!entries.length) return 0;
  const days = [...new Set(entries.map(e=>e.dk))].sort().reverse();
  let streak = 0, cursor = today();
  for (const d of days) {
    const dd = new Date(d+'T00:00:00');
    if (Math.round((cursor-dd)/86400000) > 1) break;
    streak++; cursor = dd;
  }
  return streak;
}

/* ─── Toast ─── */
let _tt;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_tt);
  _tt = setTimeout(() => el.classList.remove('show'), 2200);
}

/* ─── MOOD → PAGE COLOR (core feature) ─── */
function applyMood(mood) {
  document.getElementById('app').setAttribute('data-mood', mood||'');
  // Accent-driven elements
  document.querySelectorAll('.mood-card').forEach(b => {
    b.classList.toggle('active', b.dataset.mood === mood);
  });
  const meta = MOODS[mood];
  document.getElementById('mood-picked').textContent =
    meta ? meta.emoji + ' ' + meta.label : '';
}

/* ─── HTML escape ─── */
const esc = s => String(s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function isValidDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

function toDisplayDateFromDateKey(dk) {
  const [y, m, d] = dk.split('-').map(Number);
  const dt = new Date(y, m - 1, d, 12, 0, 0);
  return dt.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizeImportedEntries(rawList) {
  if (!Array.isArray(rawList)) throw new Error('导入文件格式错误：根节点必须是数组');
  const usedIds = new Set();
  const normalized = [];

  rawList.forEach((item, idx) => {
    if (!item || typeof item !== 'object') return;
    const mood = typeof item.mood === 'string' && MOODS[item.mood] ? item.mood : null;
    if (!mood) return;

    const dk = isValidDateKey(item.dk) ? item.dk : null;
    if (!dk) return;

    const text = typeof item.text === 'string' ? item.text : '';
    let id = Number(item.id);
    if (!Number.isFinite(id)) id = Date.now() + idx;
    while (usedIds.has(id)) id += 1;
    usedIds.add(id);

    const ds = typeof item.ds === 'string' && item.ds.trim()
      ? item.ds.trim()
      : toDisplayDateFromDateKey(dk);

    normalized.push({ id, mood, text, dk, ds });
  });

  if (!normalized.length) throw new Error('导入失败：没有可用的有效记录');

  normalized.sort((a, b) => {
    if (a.dk === b.dk) return b.id - a.id;
    return a.dk > b.dk ? -1 : 1;
  });

  return { items: normalized, dropped: rawList.length - normalized.length };
}

/* ─── Entry icon background ─── */
function entryBg(mood) {
  const c = MOODS[mood]?.color || '#888';
  return `background:${c}22;`;
}

/* ─── Feed item HTML ─── */
function entryHTML(e) {
  const m = MOODS[e.mood] || {};
  // Yuque style: 更新于 MM-DD HH:mm
  const dateStr = e.ds ? `更新于 ${e.ds}` : '';
  const moodIcon = m.img
    ? `<img src="${m.img}" alt="${m.label}" style="width:14px;height:14px;object-fit:contain;vertical-align:middle;margin-right:2px;">`
    : '';
  return `
  <div class="entry" data-id="${e.id}">
    <div class="entry-meta">
      <span class="entry-date">${moodIcon} ${dateStr}</span>
    </div>
    <div class="entry-text">${esc(e.text||'（空）')}</div>
    <button class="entry-del" data-id="${e.id}" aria-label="删除">×</button>
  </div>`;
}

/* ─── Delete ─── */
function del(id) {
  if (!confirm('确定删除这条记录？')) return;
  entries = entries.filter(e => e.id !== id);
  save(); renderAll(); toast('已删除');
}

/* ─── Open detail ─── */
function openDetail(id) {
  const e = entries.find(e => e.id === id);
  if (!e) return;
  const m = MOODS[e.mood] || {};
  const emojiEl = document.getElementById('d-emoji');
  if (m.img) {
    emojiEl.innerHTML = `<img src="${m.img}" alt="${m.label}" style="width:36px;height:36px;object-fit:contain;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.12));">`;
  } else {
    emojiEl.textContent = m.emoji || '🙂';
  }
  document.getElementById('d-mood').textContent  = m.label||'';
  document.getElementById('d-date').textContent  = e.ds;
  document.getElementById('d-text').textContent  = e.text||'（空）';
  document.getElementById('detail-overlay').classList.add('open');
}

/* ─── Attach feed events (open detail / delete) ─── */
function bindFeed(id) {
  document.getElementById(id).addEventListener('click', ev => {
    const del_btn = ev.target.closest('.entry-del');
    if (del_btn) { del(Number(del_btn.dataset.id)); return; }
    const card = ev.target.closest('.entry');
    if (card) openDetail(Number(card.dataset.id));
  });
}

/* ═══ RENDER FUNCTIONS ═══ */

function renderHome() {
  // streak
  const s = calcStreak();
  document.getElementById('streak-num').textContent = s;
  document.getElementById('sidebar-streak') && (document.getElementById('sidebar-streak').textContent = s);

  // recent feed (all entries, scrollable)
  const el = document.getElementById('home-feed');
  el.innerHTML = entries.length
    ? entries.map(entryHTML).join('')
    : '<div class="empty">还没有记录<br>写下今天的第一篇吧</div>';

  renderCal();
}

function renderStats() {
  const s = calcStreak();
  document.getElementById('s-total').textContent  = entries.length;
  document.getElementById('s-streak').textContent = s;
  const mo = monthKey(new Date());
  document.getElementById('s-month').textContent  =
    entries.filter(e => e.dk?.startsWith(mo)).length;

  const counts = Object.fromEntries(Object.keys(MOODS).map(k=>[k,0]));
  const dayCountMap = {};
  const dayMoodMap = {};
  const dayEntryMap = {};

  entries.forEach(e => {
    if (!e?.dk) return;
    if (counts[e.mood] !== undefined) counts[e.mood]++;
    dayCountMap[e.dk] = (dayCountMap[e.dk] || 0) + 1;
    if (!dayMoodMap[e.dk]) dayMoodMap[e.dk] = e.mood;
    if (!dayEntryMap[e.dk]) dayEntryMap[e.dk] = e.id;
  });

  // Distribution
  const maxC = Math.max(...Object.values(counts), 1);
  const total = Math.max(entries.length, 1);
  document.getElementById('dist-chart').innerHTML =
    Object.entries(counts).map(([k,n]) => {
      const m = MOODS[k];
      const barPct = Math.round((n/maxC)*100);
      const sharePct = Math.round((n/total)*100);
      return `<div class="dist-row">
        <div class="dist-meta">
          <span class="dist-icon">${m.img ? `<img src="${m.img}" alt="${m.label}" style="width:16px;height:16px;object-fit:contain;">` : m.emoji}</span>
          <span class="dist-name">${m.label}</span>
        </div>
        <div class="dist-track" title="${m.label} · ${n} 条">
          <div class="dist-fill" style="width:${barPct}%;background:${m.color};"></div>
        </div>
        <span class="dist-n">${n}<span class="dist-pct">${sharePct}%</span></span>
      </div>`;
    }).join('');

  // Weekly chart
  const chart = document.getElementById('week-chart');
  const td = today();
  const weekDays = [];
  for (let i=6; i>=0; i--) {
    const d = new Date(td);
    d.setDate(td.getDate()-i);
    const key = dateKey(d);
    weekDays.push({ d, key, count: dayCountMap[key] || 0 });
  }

  const weekMaxRaw = Math.max(...weekDays.map(item => item.count), 1);
  const weekMaxSeed = Math.ceil(weekMaxRaw * 1.15);
  const weekMax = (() => {
    if (weekMaxSeed <= 4) return 4;
    const p = 10 ** Math.floor(Math.log10(weekMaxSeed));
    const n = weekMaxSeed / p;
    const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return nice * p;
  })();
  const yTicks = [
    weekMax,
    Math.round(weekMax * 0.75),
    Math.round(weekMax * 0.5),
    Math.round(weekMax * 0.25),
    0
  ];

  const VIEW_W = 620;
  const VIEW_H = 170;
  const PAD_X = 10;
  const PAD_TOP = 10;
  const PAD_BOTTOM = 16;
  const innerW = VIEW_W - PAD_X * 2;
  const innerH = VIEW_H - PAD_TOP - PAD_BOTTOM;
  const xAt = idx => PAD_X + (innerW / (weekDays.length - 1)) * idx;
  const yAt = count => PAD_TOP + (1 - count / weekMax) * innerH;
  const baseY = PAD_TOP + innerH;

  const points = weekDays.map((item, idx) => ({
    x: xAt(idx),
    y: yAt(item.count),
    key: item.key,
    count: item.count,
    moodKey: dayMoodMap[item.key],
    day: item.d
  }));

  const linePath = points.map((p, i) => `${i===0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  const areaPath = `M ${points[0].x.toFixed(2)} ${baseY.toFixed(2)} ` +
    points.map(p => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ') +
    ` L ${points[points.length - 1].x.toFixed(2)} ${baseY.toFixed(2)} Z`;

  const gridH = yTicks.map(v => {
    const y = yAt(v);
    return `<line class="trend-grid-h" x1="${PAD_X}" y1="${y.toFixed(2)}" x2="${VIEW_W-PAD_X}" y2="${y.toFixed(2)}"></line>`;
  }).join('');

  const gridV = points.map(p =>
    `<line class="trend-grid-v" x1="${p.x.toFixed(2)}" y1="${PAD_TOP}" x2="${p.x.toFixed(2)}" y2="${baseY.toFixed(2)}"></line>`
  ).join('');

  const dots = points.map((p, idx) =>
    `<circle class="trend-dot${idx===points.length-1 ? ' last' : ''}" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${idx===points.length-1 ? 5 : 3}"></circle>`
  ).join('');

  const yAxisHtml = yTicks.map(v => `<span class="trend-y-label">${v}</span>`).join('');
  const xAxisHtml = weekDays.map((item, idx) => {
    const mm = String(item.d.getMonth() + 1).padStart(2, '0');
    const dd = String(item.d.getDate()).padStart(2, '0');
    const label = idx === weekDays.length - 1 ? '今天' : `${mm}.${dd}`;
    return `<span class="trend-x-label${idx===weekDays.length-1 ? ' today' : ''}">${label}</span>`;
  }).join('');

  chart.innerHTML = `
    <div class="trend-shell">
      <div class="trend-y">${yAxisHtml}</div>
      <div class="trend-main">
        <div class="trend-meta">记录数  单位: 条</div>
        <div class="trend-plot">
          <svg class="trend-svg" viewBox="0 0 ${VIEW_W} ${VIEW_H}" preserveAspectRatio="none" aria-label="近七天记录趋势图">
            ${gridH}
            ${gridV}
            <path class="trend-area" d="${areaPath}"></path>
            <path class="trend-line" d="${linePath}"></path>
            ${dots}
            <line class="trend-hover-line" id="trend-hover-v" x1="0" y1="${PAD_TOP}" x2="0" y2="${baseY.toFixed(2)}"></line>
            <line class="trend-hover-line" id="trend-hover-h" x1="${PAD_X}" y1="0" x2="${(VIEW_W - PAD_X).toFixed(2)}" y2="0"></line>
            <circle class="trend-hover-dot" id="trend-hover-dot" cx="0" cy="0" r="5"></circle>
          </svg>
          <div class="trend-tooltip" id="trend-tooltip"></div>
        </div>
        <div class="trend-x">${xAxisHtml}</div>
      </div>
    </div>
  `;

  const plotEl = chart.querySelector('.trend-plot');
  const tipEl = chart.querySelector('#trend-tooltip');
  const hoverV = chart.querySelector('#trend-hover-v');
  const hoverH = chart.querySelector('#trend-hover-h');
  const hoverDot = chart.querySelector('#trend-hover-dot');
  const weekNames = '日一二三四五六';

  if (plotEl && tipEl && hoverV && hoverH && hoverDot) {
    const setHoverByIndex = (idx) => {
      const p = points[idx];
      if (!p) return;

      hoverV.setAttribute('x1', p.x.toFixed(2));
      hoverV.setAttribute('x2', p.x.toFixed(2));
      hoverH.setAttribute('y1', p.y.toFixed(2));
      hoverH.setAttribute('y2', p.y.toFixed(2));
      hoverDot.setAttribute('cx', p.x.toFixed(2));
      hoverDot.setAttribute('cy', p.y.toFixed(2));

      const mm = String(p.day.getMonth() + 1).padStart(2, '0');
      const dd = String(p.day.getDate()).padStart(2, '0');
      const wk = weekNames[p.day.getDay()];
      const mood = p.moodKey && MOODS[p.moodKey] ? MOODS[p.moodKey].label : '';
      tipEl.innerHTML = `
        <div class="trend-tip-date">${mm}.${dd} · 周${wk}</div>
        <div class="trend-tip-val">${p.count} 条记录</div>
        ${mood ? `<div class="trend-tip-mood">心情：${mood}</div>` : ''}
      `;

      const rect = plotEl.getBoundingClientRect();
      const xPx = (p.x / VIEW_W) * rect.width;
      const yPx = (p.y / VIEW_H) * rect.height;

      tipEl.classList.add('show');
      let left = xPx;
      const tipW = tipEl.offsetWidth || 140;
      const minLeft = tipW / 2 + 8;
      const maxLeft = rect.width - tipW / 2 - 8;
      left = Math.min(maxLeft, Math.max(minLeft, left));
      tipEl.style.left = `${left}px`;
      tipEl.style.top = `${Math.max(16, yPx - 8)}px`;
    };

    const findNearestIndex = (clientX) => {
      const rect = plotEl.getBoundingClientRect();
      const xInPlot = clientX - rect.left;
      const xInView = (xInPlot / rect.width) * VIEW_W;
      let nearest = 0;
      let minDist = Infinity;
      points.forEach((p, idx) => {
        const dist = Math.abs(p.x - xInView);
        if (dist < minDist) {
          minDist = dist;
          nearest = idx;
        }
      });
      return nearest;
    };

    plotEl.addEventListener('pointerenter', (ev) => {
      setHoverByIndex(findNearestIndex(ev.clientX));
    });

    plotEl.addEventListener('pointermove', (ev) => {
      setHoverByIndex(findNearestIndex(ev.clientX));
    });

    plotEl.addEventListener('pointerleave', () => {
      tipEl.classList.remove('show');
      hoverV.style.opacity = '0';
      hoverH.style.opacity = '0';
      hoverDot.style.opacity = '0';
    });

    plotEl.addEventListener('pointerenter', () => {
      hoverV.style.opacity = '1';
      hoverH.style.opacity = '1';
      hoverDot.style.opacity = '1';
    });
  }

  // Heatmap (近 365 天，按周排列)
  const hm = document.getElementById('heatmap');
  const hmMonths = document.getElementById('heatmap-months');
  hm.innerHTML = '';
  hmMonths.innerHTML = '';

  const endDay = today();
  const startDay = new Date(endDay);
  startDay.setDate(endDay.getDate() - 364);

  const gridStart = new Date(startDay);
  gridStart.setDate(startDay.getDate() - startDay.getDay());

  const gridEnd = new Date(endDay);
  gridEnd.setDate(endDay.getDate() + (6 - endDay.getDay()));

  let cursor = new Date(gridStart);
  let weekIndex = 0;
  while (cursor <= gridEnd) {
    const weekCol = document.createElement('div');
    weekCol.className = 'hmap-week';

    const monthLabel = document.createElement('span');
    monthLabel.className = 'hmap-month';
    let monthText = '';

    for (let day = 0; day < 7; day++) {
      const d = new Date(cursor);
      d.setDate(cursor.getDate() + day);
      const key = dateKey(d);
      const inRange = d >= startDay && d <= endDay;
      const count = inRange ? (dayCountMap[key] || 0) : 0;
      const level = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count === 3 ? 3 : 4;

      const cell = document.createElement('div');
      cell.className = `hmap-cell lv-${level}${inRange ? '' : ' out-range'}${count ? ' has-entry' : ''}`;
      if (inRange) {
        cell.title = `${key} · ${count} 条记录`;
        if (count && dayEntryMap[key]) {
          cell.addEventListener('click', () => openDetail(dayEntryMap[key]));
        }
      }
      weekCol.appendChild(cell);

      if (!monthText && inRange && d.getDate() === 1) {
        monthText = `${d.getMonth() + 1}月`;
      }
    }

    if (!monthText && weekIndex === 0) {
      monthText = `${startDay.getMonth() + 1}月`;
    }
    monthLabel.textContent = monthText;

    hm.appendChild(weekCol);
    hmMonths.appendChild(monthLabel);
    cursor.setDate(cursor.getDate() + 7);
    weekIndex++;
  }
}

function renderTimeline() {
  const el = document.getElementById('timeline-feed');
  el.innerHTML = entries.length
    ? entries.map(entryHTML).join('')
    : '<div class="empty">还没有任何记录</div>';
}

function renderSettings() {
  const mo = monthKey(new Date());
  document.getElementById('p-total').textContent  = entries.length;
  document.getElementById('p-month').textContent  =
    entries.filter(e=>e.dk?.startsWith(mo)).length;
  document.getElementById('p-streak').textContent = calcStreak();

  const counts = {};
  entries.forEach(e => { counts[e.mood]=(counts[e.mood]||0)+1; });
  const top = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
  const pCommon = document.getElementById('p-common');
  if (top) {
    const m = MOODS[top[0]] || {};
    if (m.img) {
      pCommon.innerHTML = `<img src="${m.img}" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;margin-right:4px;"> ${m.label}`;
    } else {
      pCommon.textContent = `${m.emoji} ${m.label}`;
    }
  } else {
    pCommon.textContent = '—';
  }
}

function renderCal() {
  const now   = new Date();
  const y     = now.getFullYear();
  const mo    = now.getMonth();
  const tdKey = dateKey(now);

  const calLabel = document.getElementById('mini-cal-label');
  if (calLabel) {
    calLabel.textContent = `${y}年${mo+1}月心情`;
  }

  // Week headers
  const heads = document.getElementById('cal-heads');
  heads.innerHTML = ['日','一','二','三','四','五','六']
    .map(d=>`<div class="cal-head-cell">${d}</div>`).join('');

  // Build entry map
  const map = {};
  entries.forEach(e => {
    const prefix = `${y}-${String(mo+1).padStart(2,'0')}`;
    if (e.dk?.startsWith(prefix) && !map[e.dk]) map[e.dk] = e;
  });

  const firstDay    = new Date(y,mo,1).getDay();
  const daysInMonth = new Date(y,mo+1,0).getDate();
  const body = document.getElementById('cal-body');

  let html = Array(firstDay).fill('<div class="cal-cell empty"></div>').join('');
  for (let d=1; d<=daysInMonth; d++) {
    const k   = `${y}-${String(mo+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const e   = map[k];
    const isT = k===tdKey;
    let cls   = 'cal-cell';
    let inner = String(d);
    let extra = '';
    if (isT)      cls += ' today';
    if (e) {
      cls += ' has-entry';
      const m = MOODS[e.mood] || {};
      inner = m.img ? `<img src="${m.img}" style="width:16px;height:16px;object-fit:contain;pointer-events:none;">` : (m.emoji || d);
      extra = `data-id="${e.id}"`;
    }
    html += `<div class="${cls}" ${extra}>${inner}</div>`;
  }
  body.innerHTML = html;

  body.addEventListener('click', ev => {
    const cell = ev.target.closest('.cal-cell.has-entry');
    if (cell?.dataset.id) openDetail(Number(cell.dataset.id));
  }, { once: true });
}

function renderAll() {
  renderHome();
  renderStats();
  renderTimeline();
  renderSettings();
}

/* ─── Page routing ─── */
function showPage(name) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-btn[data-page]').forEach(b=>
    b.classList.toggle('active', b.dataset.page===name));
  const p = document.getElementById(`page-${name}`);
  if (p) p.classList.add('active');
  renderAll();
}

/* ═══ INIT ═══ */
document.addEventListener('DOMContentLoaded', () => {
  load();

  /* Date in sidebar */
  const now = new Date();
  document.getElementById('sb-day').textContent  = now.getDate();
  document.getElementById('sb-info').textContent =
    `${now.getMonth()+1}月 · ${'日一二三四五六'[now.getDay()]}`;

  /* Home eyebrow */
  document.getElementById('home-eyebrow').textContent =
    now.toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'long'});

  /* Mood selection */
  document.getElementById('mood-grid').addEventListener('click', ev => {
    const btn = ev.target.closest('.mood-card');
    if (!btn) return;
    activeMood = btn.dataset.mood;
    applyMood(activeMood);
  });

  /* Word count — removed from UI */
  const journal = document.getElementById('journal');

  /* Save */
  const saveBtn = document.getElementById('save-btn');
  saveBtn.addEventListener('click', () => {
    if (!activeMood) { toast('请先选择今天的心情 ↑'); return; }
    const text = journal.value.trim();
    if (!text)      { toast('请写下今天的感受'); return; }
    const n = new Date();
    entries.unshift({
      id:   Date.now(),
      mood: activeMood,
      text,
      dk:   dateKey(n),
      ds:   n.toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}),
    });
    save();
    journal.value  = '';
    activeMood = null;
    applyMood(null);
    renderAll();
    toast('已保存 ✓');
  });

  // 支持回车快捷保存，Shift+Enter 换行
  journal.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault(); // 阻止默认的换行行为
      saveBtn.click(); // 触发保存
    }
  });

  /* Nav */
  document.querySelectorAll('.nav-btn[data-page]').forEach(btn =>
    btn.addEventListener('click', () => showPage(btn.dataset.page)));

  document.querySelectorAll('.card-action[data-page]').forEach(btn =>
    btn.addEventListener('click', () => showPage(btn.dataset.page)));

  /* FAB */
  document.getElementById('fab').addEventListener('click', () => {
    showPage('home');
    journal.focus();
  });

  /* Feed events */
  bindFeed('home-feed');
  bindFeed('timeline-feed');

  /* Detail modal */
  const dOv = document.getElementById('detail-overlay');
  document.getElementById('detail-close').addEventListener('click', () =>
    dOv.classList.remove('open'));
  dOv.addEventListener('click', ev => {
    if (ev.target===dOv) dOv.classList.remove('open');
  });

  /* Help */
  const hOv = document.getElementById('help-overlay');
  document.getElementById('help-btn').addEventListener('click', () =>
    hOv.classList.add('open'));
  document.getElementById('help-close').addEventListener('click', () =>
    hOv.classList.remove('open'));
  hOv.addEventListener('click', ev => {
    if (ev.target===hOv) hOv.classList.remove('open');
  });

  /* Keyboard */
  document.addEventListener('keydown', ev => {
    if (ev.key==='Escape') {
      dOv.classList.remove('open');
      hOv.classList.remove('open');
    }
  });

  /* Export */
  document.getElementById('btn-export').addEventListener('click', () => {
    const b = new Blob([JSON.stringify(entries,null,2)],{type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = `mood-diary-${dateKey(new Date())}.json`;
    a.click(); URL.revokeObjectURL(a.href);
    toast('导出成功');
  });

  /* Import */
  const iBtn  = document.getElementById('btn-import');
  const iFile = document.getElementById('import-file');
  iBtn.addEventListener('click', () => iFile.click());
  iFile.addEventListener('change', ev => {
    const f = ev.target.files?.[0]; if (!f) return;
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const parsed = JSON.parse(fr.result);
        const { items, dropped } = normalizeImportedEntries(parsed);
        entries = items;
        save();
        renderAll();
        toast(dropped > 0
          ? `导入成功：${items.length} 条（已过滤 ${dropped} 条无效记录）`
          : `导入成功，共 ${items.length} 条`);
      } catch(err) { toast('导入失败：'+err.message); }
      iFile.value='';
    };
    fr.readAsText(f);
  });

  /* Clear */
  document.getElementById('btn-clear').addEventListener('click', () => {
    if (!confirm('确定清空所有数据？此操作不可恢复')) return;
    entries=[]; save(); renderAll(); toast('已清空');
  });

  // 初始化加载时渲染所有页面数据
  renderAll();

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
  const shouldRunDecorativeEffects = !prefersReducedMotion && hasFinePointer;

  if (shouldRunDecorativeEffects) {
  /* ══════════════════════════════════════════════════════
     CLICK ATMOSPHERE (氛围感彩条)
  ══════════════════════════════════════════════════════ */
  let isPointerDown = false;
  let lastParticleTime = 0;

  // 监听按下
  document.addEventListener('pointerdown', (ev) => {
    isPointerDown = true;
    createAtmosphere(ev.clientX, ev.clientY, false);
    lastParticleTime = Date.now();
  });

  // 监听拖动（加入节流，防止生成过多微粒导致卡顿）
  document.addEventListener('pointermove', (ev) => {
    if (!isPointerDown) return;
    const now = Date.now();
    // 拖动时每隔 40ms 生成一次轨迹微粒
    if (now - lastParticleTime > 40) {
      createAtmosphere(ev.clientX, ev.clientY, true);
      lastParticleTime = now;
    }
  });

  // 监听抬起/取消
  document.addEventListener('pointerup', () => isPointerDown = false);
  document.addEventListener('pointercancel', () => isPointerDown = false);

  function createAtmosphere(x, y, isDragging) {
    // 点击时爆出较多（12-18个），拖动时爆出较少（2-4个，形成紧凑轨迹）
    const baseCount = isDragging ? 2 : 12;
    const randomCount = isDragging ? 3 : 6;
    const particleCount = baseCount + Math.floor(Math.random() * randomCount);
    
    // 点击时的颜色：当前心情的强调色
    const moodColors = [
      'var(--c-accent)', 
      'rgba(var(--c-accent-rgb), 0.6)', 
      'rgba(var(--c-accent-rgb), 0.3)',
      '#ffffff'
    ];

    // 获取当前时间，用于计算彩虹色相
    const now = Date.now();
    // 随时间推移（除以4控制颜色变化速度）自动流转的 Hue（色相 0-360）
    const rainbowHueBase = (now / 4) % 360; 

    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      p.className = 'click-particle';
      
      // 随机决定形状：60% 彩条，40% 圆点
      const isCircle = Math.random() > 0.6;
      // 拖动时的微粒稍微小一点，显得更轻盈
      const sizeBase = Math.random() * (isDragging ? 3 : 4) + (isDragging ? 2 : 3); 
      
      if (isCircle) {
        p.style.width = `${sizeBase}px`;
        p.style.height = `${sizeBase}px`;
        p.style.borderRadius = '50%';
      } else {
        p.style.width = `${sizeBase}px`;
        p.style.height = `${sizeBase * (1.5 + Math.random() * 2)}px`; 
      }

      // 【核心】颜色分配
      if (isDragging) {
        // 彩虹拖尾：主色相 + 随机偏移量，让尾迹色彩有一点层次感
        const hue = (rainbowHueBase + Math.random() * 30 - 15) % 360;
        // 采用 HSL 颜色模式，高饱和度，明快的亮度
        p.style.background = `hsl(${hue}, 85%, 65%)`;
        // 给拖尾增加一点梦幻的发光效果
        p.style.boxShadow = `0 0 6px hsl(${hue}, 85%, 65%, 0.6)`;
      } else {
        // 单次点击：使用情绪主题色
        p.style.background = moodColors[Math.floor(Math.random() * moodColors.length)];
      }

      p.style.left = `${x}px`;
      p.style.top = `${y}px`;

      document.body.appendChild(p);

      // 物理动画计算
      const angle = Math.random() * Math.PI * 2;
      // 拖动时的扩散力度大幅减小，让轨迹更聚拢
      const velocityBase = isDragging ? 4 : 25;
      const velocityRandom = isDragging ? 12 : 70;
      const velocity = velocityBase + Math.random() * velocityRandom; 
      
      const tx = Math.cos(angle) * velocity;
      // Y轴上稍微加一点向上的趋势
      const ty = Math.sin(angle) * velocity - (15 + Math.random() * 20); 
      const rot = (Math.random() - 0.5) * 360;
      
      // 动画时长：拖尾稍微快一点消失（600-900ms），点击停留稍久（800-1200ms）
      const duration = isDragging ? (600 + Math.random() * 300) : (800 + Math.random() * 400);

      // Web Animations API
      const anim = p.animate([
        { transform: `translate(-50%, -50%) scale(1) rotate(0deg)`, opacity: isDragging ? 0.9 : 1 },
        { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0) rotate(${rot}deg)`, opacity: 0 }
      ], {
        duration: duration,
        easing: 'cubic-bezier(0.25, 1, 0.3, 1)', 
        fill: 'forwards'
      });

      // 动画结束后清理 DOM
      anim.onfinish = () => p.remove();
    }
  }

  /* ══════════════════════════════════════════════════════
     BACKGROUND PATTERN (静止背景印花 - 均匀散布不重叠)
  ══════════════════════════════════════════════════════ */
  function createRandomPattern(container, width, height, countLimit = 80, isCard = false) {
    container.innerHTML = '';
    const availableImgs = Object.values(MOODS).map(m => m.img).filter(Boolean);
    if (availableImgs.length === 0) return;

    // 密度计算：基数减半，数量翻倍！
    const area = width * height;
    const density = isCard ? 50000 : 30000;
    const targetCount = Math.min(Math.floor(area / density) || 1, countLimit);

    const placed = []; // 用于记录已放置印花的坐标和半径 {x, y, r}
    const padding = isCard ? 15 : 25; // 印花之间的最小安全间距

    for (let i = 0; i < targetCount; i++) {
      const baseSize = isCard ? 30 : 40;
      const sizeRandom = isCard ? 50 : 80;
      
      let size, radius, x, y;
      let isValid = false;
      let attempts = 0;
      const maxAttempts = 50; // 最多尝试50次寻找不重叠的空地

      // 碰撞检测循环
      do {
        size = baseSize + Math.random() * sizeRandom;
        radius = size / 2;
        // 确保不会贴在最边缘被生硬切断
        x = radius + Math.random() * (width - size);
        y = radius + Math.random() * (height - size);

        isValid = true;
        for (const p of placed) {
          const dx = x - p.x;
          const dy = y - p.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // 如果两个圆心的距离小于它们半径之和+安全间距，则说明重叠了
          if (distance < (radius + p.r + padding)) {
            isValid = false;
            break;
          }
        }
        attempts++;
      } while (!isValid && attempts < maxAttempts);

      // 如果找到了合法的不重叠位置，就渲染它
      if (isValid) {
        placed.push({ x, y, r: radius });

        const imgPath = availableImgs[Math.floor(Math.random() * availableImgs.length)];
        const img = document.createElement('img');
        img.src = imgPath;
        img.className = 'bg-img';
        
        img.style.width = `${size}px`;
        img.style.height = `${size}px`;

        // 使用绝对像素定位
        img.style.left = `${x}px`;
        img.style.top = `${y}px`;

        // 随机角度 (-45deg ~ 45deg)
        const rotation = -45 + Math.random() * 90;
        img.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;

        // 轻微的透明度抖动
        img.style.opacity = (0.5 + Math.random() * 0.5).toString();

        container.appendChild(img);
      }
    }
  }

  function generateBgPattern() {
    // 1. 全局背景印花
    const bgContainer = document.getElementById('bg-pattern');
    if (bgContainer) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      createRandomPattern(bgContainer, w, h, 80, false);
    }

    // 2. 卡片内部印花
    document.querySelectorAll('.card').forEach(card => {
      // 找到或创建卡片内的印花层
      let cardPattern = card.querySelector('.card-pattern');
      if (!cardPattern) {
        cardPattern = document.createElement('div');
        cardPattern.className = 'card-pattern';
        card.appendChild(cardPattern);
      }
      const rect = card.getBoundingClientRect();
      const w = rect.width || 300;
      const h = rect.height || 200;
      
      // 给个保底的面积算个数 (保证至少会有 2 个左右)
      createRandomPattern(cardPattern, w, h, 10, true); 
    });
  }

  // 初始化并在窗口改变大小时重新生成（使用 debounce 防止卡顿）
  generateBgPattern();
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(generateBgPattern, 300);
  });

  /* ══════════════════════════════════════════════════════
     MOUSE FOLLOWER (鼠标跟随 & 空闲随机动效)
  ══════════════════════════════════════════════════════ */
  const follower = document.createElement('div');
  follower.className = 'mouse-follower';
  document.body.appendChild(follower);

  let mouseX = -100, mouseY = -100;
  let followerX = -100, followerY = -100;
  let isUserActive = false;
  let idleTimer = null;
  let idleAnimTimer = null;
  let isIdle = false;

  // 鼠标移动时更新位置
  document.addEventListener('mousemove', (ev) => {
    mouseX = ev.clientX;
    mouseY = ev.clientY;

    if (isIdle) {
      follower.getAnimations().forEach(anim => anim.cancel());
    }

    isUserActive = true;
    isIdle = false;
    if (idleAnimTimer) {
      clearTimeout(idleAnimTimer);
      idleAnimTimer = null;
    }
    
    // 重置空闲计时器
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      isUserActive = false;
      isIdle = true;
      startIdleAnimation();
    }, 3000); // 3秒无操作进入空闲模式
  });

  // 鼠标离开窗口时隐藏
  document.addEventListener('mouseleave', () => {
    follower.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    follower.style.opacity = '1';
  });

  // 空闲时的随机漂浮动画
  function startIdleAnimation() {
    if (idleAnimTimer) return;
    
    const idleAnimate = () => {
      if (!isIdle || isUserActive) {
        idleAnimTimer = null;
        return;
      }
      
      // 随机目标位置（屏幕内）
      const targetX = Math.random() * (window.innerWidth - 100) + 50;
      const targetY = Math.random() * (window.innerHeight - 100) + 50;
      
      // 平滑移动到目标
      follower.animate([
        { left: `${followerX}px`, top: `${followerY}px` },
        { left: `${targetX}px`, top: `${targetY}px` }
      ], {
        duration: 2000 + Math.random() * 2000,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards'
      }).onfinish = () => {
        followerX = targetX;
        followerY = targetY;
      };
      
      idleAnimTimer = setTimeout(idleAnimate, 2000 + Math.random() * 2000);
    };
    
    idleAnimate();
  }

  // 每一帧平滑跟随
  function animateFollower() {
    // 缓动跟随 (lerp)
    const ease = 0.12;
    followerX += (mouseX - followerX) * ease;
    followerY += (mouseY - followerY) * ease;
    
    follower.style.left = `${followerX}px`;
    follower.style.top = `${followerY}px`;
    
    requestAnimationFrame(animateFollower);
  }
  
  // 初始化位置到鼠标位置（如果可用）
  document.addEventListener('mousemove', (ev) => {
    if (followerX === -100) {
      followerX = ev.clientX;
      followerY = ev.clientY;
    }
  }, { once: true });
  
  animateFollower();
  }

})();
