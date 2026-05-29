/**
 * ONYXRA — insights.js
 *
 * The analytics surface that makes all the quietly-collected data come alive:
 * streak stats, achievement badges, metric trend charts (weight / body fat /
 * net worth / mood), a GitHub-style habit-consistency heatmap, and an AI
 * "analyze my trends" button.
 */
window.registerPage('insights', function initInsights() {
  const inner = document.getElementById('insights-inner');
  if (!inner) return;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dayKey = (x) => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');

  function fmtVal(key, v) {
    if (v == null) return '—';
    if (key === 'networth') return window.formatCurrency ? window.formatCurrency(v) : ('$' + v);
    if (key === 'mood') return (Math.round(v * 10) / 10).toString();
    return (Math.round(v * 10) / 10).toString();
  }

  function lineChart(series, color, key) {
    const pts = series.slice(-30);
    if (pts.length < 2) return '';
    const vals = pts.map(p => p.value);
    const min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    const span = (max - min) || 1;
    const W = 320, H = 92, pad = 10;
    const xs = pts.map((p, i) => pad + (i / (pts.length - 1)) * (W - 2 * pad));
    const ys = pts.map(p => H - pad - ((p.value - min) / span) * (H - 2 * pad));
    const line = xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
    const area = `${pad},${H - pad} ` + line + ` ${(W - pad)},${H - pad}`;
    const gid = 'insg_' + key;
    return `<svg viewBox="0 0 ${W} ${H}" class="ins-chart" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.34"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient></defs>
      <polygon points="${area}" fill="url(#${gid})"/>
      <polyline points="${line}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${xs[xs.length - 1].toFixed(1)}" cy="${ys[ys.length - 1].toFixed(1)}" r="3.6" fill="${color}"/>
    </svg>`;
  }

  function metricCard(key, label, unit, color) {
    const series = STATE.data.metrics?.[key] || [];
    const has = series.length >= 1;
    const last = has ? series[series.length - 1].value : null;
    const first = has ? series[0].value : null;
    const delta = (series.length >= 2) ? (last - first) : 0;
    const dir = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
    const deltaTxt = (Math.round(delta * 10) / 10);
    return `<div class="ins-card ins-metric" style="--ic:${color}">
      <div class="ins-metric-head">
        <span class="ins-metric-label">${label}</span>
        ${has ? `<span class="ins-metric-val">${fmtVal(key, last)}${unit ? `<span class="ins-unit">${unit}</span>` : ''}</span>` : ''}
      </div>
      ${has
        ? (series.length >= 2
            ? lineChart(series, color, key)
            : '<div class="ins-hint">One data point so far — log again to see the trend.</div>')
        : `<div class="ins-empty-metric">No ${label.toLowerCase()} logged yet.<br/><span>Say “log my ${label.toLowerCase()}…” or tap ＋ / ⌘K.</span></div>`}
      ${series.length >= 2 ? `<div class="ins-delta ins-delta-${dir}">${dir === 'up' ? '▲' : dir === 'down' ? '▼' : '◆'} ${deltaTxt > 0 ? '+' : ''}${deltaTxt}${unit} since start · ${series.length} entries</div>` : ''}
    </div>`;
  }

  function streakCard() {
    const life = STATE.data.life || {};
    const t = STATE.computeToday ? STATE.computeToday() : { overall: 0 };
    return `<div class="ins-card ins-streak-card">
      <div class="ins-stat"><div class="ins-stat-num">🔥 ${life.streak || 0}</div><div class="ins-stat-lbl">Current streak</div></div>
      <div class="ins-stat"><div class="ins-stat-num">🏅 ${life.bestStreak || 0}</div><div class="ins-stat-lbl">Best streak</div></div>
      <div class="ins-stat"><div class="ins-stat-num">${Math.round((t.overall || 0) * 100)}%</div><div class="ins-stat-lbl">Today</div></div>
    </div>`;
  }

  function badgesCard() {
    if (!STATE.computeAchievements) return '';
    const all = STATE.computeAchievements();
    const earned = all.filter(b => b.earned);
    const locked = all.filter(b => !b.earned).sort((a, b) => b.pct - a.pct).slice(0, 6);
    return `<div class="ins-card">
      <div class="ins-card-head">Achievements <span class="ins-card-sub">${earned.length}/${all.length}</span></div>
      <div class="ins-badges">
        ${earned.map(b => `<div class="ins-badge earned" title="${esc(b.desc)}"><div class="ins-badge-icon">${b.icon}</div><div class="ins-badge-name">${esc(b.name)}</div></div>`).join('')}
        ${locked.map(b => `<div class="ins-badge locked" title="${esc(b.desc)} (${b.cur}/${b.target})"><div class="ins-badge-icon">${b.icon}</div><div class="ins-badge-name">${esc(b.name)}</div><div class="ins-badge-prog"><span style="width:${b.pct}%"></span></div></div>`).join('')}
      </div>
    </div>`;
  }

  function heatmap() {
    const habits = STATE.data.habits?.items || [];
    if (!habits.length) {
      return `<div class="ins-card"><div class="ins-card-head">Habit consistency</div><div class="ins-empty-metric">No habits yet. Add one on the dashboard to start your grid. 🔥</div></div>`;
    }
    const WEEKS = 13;
    const today = new Date();
    const start = new Date(today); start.setDate(start.getDate() - (WEEKS * 7 - 1));
    const cells = [];
    for (let i = 0; i < WEEKS * 7; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const key = dayKey(d);
      const count = habits.filter(h => h.log && h.log[key]).length;
      cells.push({ key, count, ratio: count / habits.length });
    }
    const cols = [];
    for (let w = 0; w < WEEKS; w++) cols.push(cells.slice(w * 7, (w + 1) * 7));
    const grid = cols.map(col => `<div class="ins-hm-col">${col.map(c => `<div class="ins-hm-cell" data-l="${c.count === 0 ? 0 : Math.ceil(c.ratio * 4)}" title="${c.key}: ${c.count}/${habits.length}"></div>`).join('')}</div>`).join('');
    const totalDone = cells.reduce((s, c) => s + c.count, 0);
    return `<div class="ins-card">
      <div class="ins-card-head">Habit consistency <span class="ins-card-sub">${totalDone} check-ins · ${WEEKS} wks</span></div>
      <div class="ins-heatmap">${grid}</div>
      <div class="ins-hm-legend"><span>Less</span>${[0, 1, 2, 3, 4].map(l => `<span class="ins-hm-cell" data-l="${l}"></span>`).join('')}<span>More</span></div>
      <div class="ins-habit-streaks">${habits.map(h => `<span class="ins-habit-streak" style="--hc:${esc(h.color || '#4fc3f7')}">${esc(h.icon || '✅')} ${esc(h.name)} <b>🔥${STATE.habitStreak(h.id)}</b></span>`).join('')}</div>
    </div>`;
  }

  function render() {
    inner.innerHTML = window.buildPageHeader('Analytics', 'Your', 'Insights', 'Trends, streaks, and milestones across your whole life.') + `
      <div class="ins-wrap">
        ${streakCard()}
        <button class="ins-analyze" id="insAnalyze" type="button">✦ Analyze my trends</button>
        <div id="insAnalysis"></div>
        ${badgesCard()}
        <div class="ins-metrics-grid">
          ${metricCard('weight', 'Weight', 'lb', '#f5c842')}
          ${metricCard('bodyfat', 'Body fat', '%', '#ff6b35')}
          ${metricCard('networth', 'Net worth', '', '#3ddc6e')}
          ${metricCard('mood', 'Mood', '', '#7c6af7')}
        </div>
        ${heatmap()}
      </div>`;
    const a = inner.querySelector('#insAnalyze');
    if (a) a.addEventListener('click', analyze);
  }

  async function analyze() {
    const box = inner.querySelector('#insAnalysis');
    const btn = inner.querySelector('#insAnalyze');
    if (!box) return;
    btn.disabled = true; btn.classList.add('loading');
    box.innerHTML = `<div class="ins-card ins-analysis"><div class="onyx-cap-thinking"><span></span><span></span><span></span></div></div>`;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Analyze the trends in my snapshot — weight, body fat, net worth, mood, habit streaks and consistency. Call out what is trending well, what needs attention, and one concrete move for this week. Be specific with the numbers. Five sentences max. No action block.' }],
          snapshot: window.buildOnyxraSnapshot ? window.buildOnyxraSnapshot() : {},
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        box.innerHTML = `<div class="ins-card ins-analysis ins-err">⚠️ ${esc(e.error || 'Analysis unavailable.')}</div>`;
      } else {
        const data = await res.json();
        const parsed = window.parseOnyxraActions ? window.parseOnyxraActions(data.reply || '') : { clean: data.reply };
        box.innerHTML = `<div class="ins-card ins-analysis">
          <div class="ins-analysis-head">✦ Onyxra's read on your data</div>
          <div class="ins-analysis-body">${esc(parsed.clean || data.reply || '').replace(/\n/g, '<br/>')}</div>
        </div>`;
      }
    } catch (e) {
      box.innerHTML = `<div class="ins-card ins-analysis ins-err">⚠️ ${esc(e.message)}</div>`;
    } finally {
      btn.disabled = false; btn.classList.remove('loading');
    }
  }

  window.__renderInsights = render;
  if (!window.__onyxInsightsListener) {
    window.__onyxInsightsListener = true;
    window.addEventListener('onyxra:state-changed', () => {
      const pg = document.getElementById('page-insights');
      if (pg && pg.classList.contains('active')) { try { window.__renderInsights && window.__renderInsights(); } catch (e) {} }
    });
  }

  render();
});
