/**
 * ONYXRA — goals.js
 *
 * Goals & Targets — the north-star page. Every big number being chased,
 * grouped by life area: Wealth ($5M net worth), Business (Envosta $50k/mo),
 * Calisthenics skills, Singing, Guitar, and anything custom.
 *
 * Each goal: current vs target, progress bar, dated history, quick "+ Log".
 * Metric-linked goals (Net Worth → metrics.networth) auto-sync their current
 * value. The AI can add/log/retarget goals via agentic actions, and the
 * "✦ Coach me" button asks Onyxra for the next move against these numbers.
 */
window.registerPage('goals', function initGoals() {
  const inner = document.getElementById('goals-inner');
  if (!inner) return;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const CATS = {
    wealth:       { label: 'Wealth',       icon: '👑', accent: '#f5c842' },
    business:     { label: 'Business',     icon: '🏗️', accent: '#ff8a3d' },
    calisthenics: { label: 'Calisthenics', icon: '🤸', accent: '#ff6b35' },
    singing:      { label: 'Singing',      icon: '🎤', accent: '#ffb340' },
    guitar:       { label: 'Guitar',       icon: '🎸', accent: '#e07b15' },
    health:       { label: 'Health',       icon: '❤️', accent: '#ff6b6b' },
    custom:       { label: 'Custom',       icon: '🎯', accent: '#ffd27a' },
  };
  const CAT_ORDER = ['wealth', 'business', 'calisthenics', 'singing', 'guitar', 'health', 'custom'];

  function fmtVal(g, v) {
    if (v == null || isNaN(v)) return '—';
    const u = g.unit || '';
    if (u.startsWith('$')) {
      const money = '$' + Math.round(v).toLocaleString();
      return u === '$/mo' ? money + '<span class="gl-permo">/mo</span>' : money;
    }
    const n = (Math.round(v * 10) / 10).toLocaleString();
    return `${n}<span class="gl-unit">${esc(u)}</span>`;
  }

  function goalCard(g) {
    const cur = STATE.goalCurrent(g);
    const pct = Math.round(STATE.goalPct(g) * 100);
    const cat = CATS[g.category] || CATS.custom;
    const done = pct >= 100;
    const logs = (g.history || []).length + (g.metric ? (STATE.data.metrics?.[g.metric] || []).length : 0);
    return `
      <div class="gl-card${done ? ' gl-done' : ''}" data-gid="${g.id}" style="--gc:${cat.accent}">
        <div class="gl-card-top">
          <div class="gl-icon">${g.icon || '🎯'}</div>
          <div class="gl-title-wrap">
            <div class="gl-name">${esc(g.name)}</div>
            ${g.note ? `<div class="gl-note">${esc(g.note)}</div>` : ''}
          </div>
          <button class="gl-menu-btn" data-menu="${g.id}" aria-label="Goal options">⋯</button>
        </div>
        <div class="gl-numbers">
          <span class="gl-current">${fmtVal(g, cur)}</span>
          <span class="gl-sep">/</span>
          <span class="gl-target">${fmtVal(g, g.target)}</span>
          <span class="gl-pct${done ? ' hit' : ''}">${done ? '✦ HIT' : pct + '%'}</span>
        </div>
        <div class="gl-track"><div class="gl-fill" style="width:${Math.min(100, pct)}%"></div></div>
        <div class="gl-card-foot">
          <span class="gl-logcount">${logs ? logs + ' entries' : 'No entries yet'}</span>
          <button class="gl-log-btn" data-log="${g.id}">+ Log Progress</button>
        </div>
      </div>`;
  }

  function render() {
    const summary = STATE.computeGoals();
    const items = STATE.data.goals?.items || [];
    const grouped = {};
    items.forEach(g => { (grouped[g.category] = grouped[g.category] || []).push(g); });
    const cats = CAT_ORDER.filter(c => grouped[c]?.length)
      .concat(Object.keys(grouped).filter(c => !CAT_ORDER.includes(c)));

    inner.innerHTML = window.buildPageHeader('North Star', 'Goals', '& Targets', 'The numbers you’re chasing — across body, music, business, and wealth.') + `
      <div class="gl-wrap">

        <div class="gl-hero">
          <div class="gl-hero-ring" style="--p:${summary.overall}">
            <div class="gl-hero-pct">${summary.overall}<span>%</span></div>
          </div>
          <div class="gl-hero-body">
            <div class="gl-hero-line">Mission progress</div>
            <div class="gl-hero-big">${summary.done} of ${summary.count} targets hit</div>
            <div class="gl-hero-sub">Log progress as you go — Onyxra tracks every number and coaches the gap.</div>
          </div>
          <button class="gl-coach" id="glCoach" type="button">✦ Coach me</button>
        </div>

        ${cats.map(c => {
          const cat = CATS[c] || CATS.custom;
          return `
          <div class="gl-cat">
            <div class="gl-cat-head" style="--gc:${cat.accent}">
              <span class="gl-cat-icon">${cat.icon}</span>
              <span class="gl-cat-label">${cat.label}</span>
              <span class="gl-cat-count">${grouped[c].length}</span>
            </div>
            <div class="gl-grid">${grouped[c].map(goalCard).join('')}</div>
          </div>`;
        }).join('')}

        <button class="gl-add" id="glAdd" type="button">＋ New Goal</button>
        <div id="glCoachOut"></div>
      </div>`;
    wire();
  }

  /* ── Overlay helper (bottom sheet, same pattern as nutrition modals) ── */
  function sheet(html) {
    let overlay = document.getElementById('glOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'glOverlay';
      overlay.className = 'food-picker-overlay';
      overlay.style.cssText = 'align-items:flex-end';
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = `<div class="food-picker-sheet" style="max-height:86vh">${html}</div>`;
    overlay.style.display = 'flex';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.style.display = 'none'; };
    return overlay;
  }
  const sheetHead = (title) => `
    <div class="food-picker-header">
      <span style="font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700">${title}</span>
      <button data-x style="background:none;border:none;color:var(--muted);font-size:22px;cursor:pointer;padding:0 4px;line-height:1">×</button>
    </div>`;
  const field = (label, input) => `
    <div style="margin-bottom:12px">
      <label style="font-size:11px;color:var(--muted);font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;display:block;margin-bottom:4px">${label}</label>
      ${input}
    </div>`;

  function openLogSheet(id) {
    const g = (STATE.data.goals?.items || []).find(x => x.id === id);
    if (!g) return;
    const cur = STATE.goalCurrent(g);
    const overlay = sheet(`
      ${sheetHead(`${g.icon || '🎯'} ${esc(g.name)}`)}
      <div class="food-picker-body" style="padding:16px">
        <div style="font-size:12px;color:var(--muted);margin-bottom:12px">Current: <b style="color:var(--text)">${cur.toLocaleString()}${g.unit && !g.unit.startsWith('$') ? ' ' + esc(g.unit) : ''}</b> · Target: <b style="color:var(--accent)">${g.target.toLocaleString()}</b></div>
        ${field(g.metric ? 'New value' : 'Value', `<input id="glVal" class="form-input" type="number" inputmode="decimal" min="0" step="any" placeholder="0" style="width:100%;box-sizing:border-box" autofocus>`)}
        ${g.metric ? '' : `
        <div style="display:flex;gap:8px;margin-bottom:14px">
          <button class="day-tab active" id="glModeSet" style="flex:1;padding:8px;font-size:12px">Set total</button>
          <button class="day-tab" id="glModeAdd" style="flex:1;padding:8px;font-size:12px">Add to total</button>
        </div>`}
        <button id="glSaveLog" style="width:100%;padding:13px;background:var(--accent);color:#000;border:none;border-radius:10px;font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;cursor:pointer;letter-spacing:0.5px">Log It</button>
      </div>`);
    let mode = 'set';
    overlay.querySelector('[data-x]').onclick = () => { overlay.style.display = 'none'; };
    const mSet = overlay.querySelector('#glModeSet'), mAdd = overlay.querySelector('#glModeAdd');
    if (mSet) mSet.onclick = () => { mode = 'set'; mSet.classList.add('active'); mAdd.classList.remove('active'); };
    if (mAdd) mAdd.onclick = () => { mode = 'add'; mAdd.classList.add('active'); mSet.classList.remove('active'); };
    overlay.querySelector('#glSaveLog').onclick = () => {
      const v = parseFloat(overlay.querySelector('#glVal').value);
      if (isNaN(v)) return;
      const res = STATE.logGoal(id, v, mode);
      overlay.style.display = 'none';
      if (window.haptic) window.haptic('success');
      if (res && res.hitTarget) {
        if (window.onyxConfetti) { try { window.onyxConfetti(); } catch (e) {} }
        if (window.toast) window.toast(`✦ TARGET HIT — ${g.name}!`, { type: 'success', duration: 4200 });
      } else if (window.toast) {
        window.toast(`Logged ${g.name}`, { type: 'success', duration: 1600 });
      }
      window.dispatchEvent(new CustomEvent('onyxra:state-changed', { detail: { local: true } }));
      render();
    };
  }

  function openEditSheet(id) {
    const g = id ? (STATE.data.goals?.items || []).find(x => x.id === id) : null;
    const overlay = sheet(`
      ${sheetHead(g ? 'Edit Goal' : 'New Goal')}
      <div class="food-picker-body" style="padding:16px">
        ${field('Name', `<input id="geName" class="form-input" placeholder="e.g. Front Lever Hold" value="${g ? esc(g.name) : ''}" style="width:100%;box-sizing:border-box">`)}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${field('Target', `<input id="geTarget" class="form-input" type="number" inputmode="decimal" min="0" step="any" value="${g ? g.target : ''}" placeholder="0" style="width:100%;box-sizing:border-box">`)}
          ${field('Unit', `<input id="geUnit" class="form-input" value="${g ? esc(g.unit || '') : ''}" placeholder="reps · sec · $ · songs" style="width:100%;box-sizing:border-box">`)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${field('Category', `<select id="geCat" class="form-input" style="width:100%;margin:0">${CAT_ORDER.map(c => `<option value="${c}"${g && g.category === c ? ' selected' : ''}>${CATS[c].label}</option>`).join('')}</select>`)}
          ${field('Icon (emoji)', `<input id="geIcon" class="form-input" value="${g ? esc(g.icon || '') : ''}" placeholder="🎯" style="width:100%;box-sizing:border-box">`)}
        </div>
        ${field('Why it matters (optional)', `<input id="geNote" class="form-input" value="${g ? esc(g.note || '') : ''}" placeholder="One line of fire" style="width:100%;box-sizing:border-box">`)}
        <button id="geSave" style="width:100%;padding:13px;background:var(--accent);color:#000;border:none;border-radius:10px;font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;cursor:pointer;letter-spacing:0.5px">${g ? 'Save Changes' : 'Create Goal'}</button>
        ${g ? `<button id="geDelete" style="width:100%;padding:10px;margin-top:8px;background:none;border:1px solid rgba(255,94,71,0.4);border-radius:10px;color:#ff9a8a;font-size:13px;cursor:pointer">Delete goal</button>` : ''}
      </div>`);
    overlay.querySelector('[data-x]').onclick = () => { overlay.style.display = 'none'; };
    overlay.querySelector('#geSave').onclick = () => {
      const name = overlay.querySelector('#geName').value.trim();
      const target = parseFloat(overlay.querySelector('#geTarget').value);
      if (!name || !(target > 0)) { if (window.toast) window.toast('Name and target are required', { type: 'warn' }); return; }
      const patch = {
        name, target,
        unit: overlay.querySelector('#geUnit').value.trim(),
        category: overlay.querySelector('#geCat').value,
        icon: overlay.querySelector('#geIcon').value.trim() || '🎯',
        note: overlay.querySelector('#geNote').value.trim(),
      };
      if (g) STATE.updateGoal(g.id, patch); else STATE.addGoal(patch);
      overlay.style.display = 'none';
      if (window.haptic) window.haptic('success');
      window.dispatchEvent(new CustomEvent('onyxra:state-changed', { detail: { local: true } }));
      render();
    };
    const del = overlay.querySelector('#geDelete');
    if (del) del.onclick = () => {
      if (!confirm('Delete this goal? Its history goes with it.')) return;
      STATE.removeGoal(g.id);
      overlay.style.display = 'none';
      render();
    };
  }

  async function coach() {
    const btn = inner.querySelector('#glCoach');
    const out = inner.querySelector('#glCoachOut');
    if (btn) { btn.disabled = true; btn.textContent = '✦ …'; }
    if (out) out.innerHTML = `<div class="gl-coach-card"><div class="onyx-cap-thinking"><span></span><span></span><span></span></div></div>`;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Look at my goals in the snapshot (goals.items — calisthenics, singing, guitar, Envosta revenue, net worth). Pick the ONE goal with the best momentum-to-impact ratio right now and give me a hard-hitting, specific push: what exactly to do this week to move it. 4 sentences max, direct tone. No action block unless I asked you to log something.' }],
          snapshot: window.buildOnyxraSnapshot ? window.buildOnyxraSnapshot() : {},
        }),
      });
      const data = await res.json().catch(() => ({}));
      const parsed = window.parseOnyxraActions ? window.parseOnyxraActions(data.reply || '') : { clean: data.reply, actions: [] };
      if (window.applyOnyxraActions && parsed.actions?.length) window.applyOnyxraActions(parsed.actions);
      if (out) out.innerHTML = res.ok
        ? `<div class="gl-coach-card"><div class="gl-coach-head">✦ Coach</div><div class="gl-coach-body">${esc(parsed.clean || '')}</div></div>`
        : `<div class="gl-coach-card gl-coach-err">⚠️ ${esc(data.error || 'Coach unavailable right now.')}</div>`;
    } catch (e) {
      if (out) out.innerHTML = `<div class="gl-coach-card gl-coach-err">⚠️ ${esc(e.message)}</div>`;
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '✦ Coach me'; }
    }
  }

  function wire() {
    inner.querySelectorAll('[data-log]').forEach(b => b.addEventListener('click', () => { if (window.haptic) window.haptic('tap'); openLogSheet(b.dataset.log); }));
    inner.querySelectorAll('[data-menu]').forEach(b => b.addEventListener('click', () => openEditSheet(b.dataset.menu)));
    const add = inner.querySelector('#glAdd');
    if (add) add.addEventListener('click', () => openEditSheet(null));
    const coachBtn = inner.querySelector('#glCoach');
    if (coachBtn) coachBtn.addEventListener('click', coach);
  }

  /* Refresh when state changes elsewhere (AI actions, quick capture). */
  window.__renderGoals = render;
  if (!window.__onyxGoalsListener) {
    window.__onyxGoalsListener = true;
    window.addEventListener('onyxra:state-changed', () => {
      const pg = document.getElementById('page-goals');
      const overlayOpen = document.getElementById('glOverlay')?.style.display === 'flex';
      if (pg && pg.classList.contains('active') && !overlayOpen) {
        try { window.__renderGoals && window.__renderGoals(); } catch (e) {}
      }
    });
  }

  render();
});
