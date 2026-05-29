/**
 * ONYXRA — journal.js
 *
 * Daily reflections + mood. A composer (mood + text), a mood-trend chart,
 * a dated timeline with edit/delete, and an AI "reflect on my week" button.
 * Entries feed the AI snapshot so the orb knows how you've been feeling.
 */
window.registerPage('journal', function initJournal() {
  const inner = document.getElementById('journal-inner');
  if (!inner) return;

  // mood value → [emoji, label, color]
  const MOODS = {
    1: ['😞', 'Rough', '#ff6b6b'],
    2: ['😕', 'Meh', '#f5a623'],
    3: ['😐', 'Okay', '#f5c842'],
    4: ['🙂', 'Good', '#3ddc6e'],
    5: ['🤩', 'Amazing', '#4fc3f7'],
  };
  let draftMood = null;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dayKey = (x) => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');

  function fmtDay(day) {
    const d = new Date(day + 'T00:00:00');
    const today = new Date(); const yest = new Date(); yest.setDate(yest.getDate() - 1);
    if (day === dayKey(today)) return 'Today';
    if (day === dayKey(yest)) return 'Yesterday';
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }
  function fmtTime(iso) { try { return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; } }

  function moodChart() {
    const series = (STATE.data.metrics?.mood || []).slice(-21);
    if (series.length < 2) return '';
    const W = 300, H = 72, pad = 8;
    const xs = series.map((p, i) => pad + (i / (series.length - 1)) * (W - 2 * pad));
    const ys = series.map(p => H - pad - ((p.value - 1) / 4) * (H - 2 * pad));
    const pts = xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
    const dots = series.map((p, i) => `<circle cx="${xs[i].toFixed(1)}" cy="${ys[i].toFixed(1)}" r="2.8" fill="${MOODS[Math.round(p.value)]?.[2] || '#4fc3f7'}"/>`).join('');
    const avg = (series.reduce((s, p) => s + p.value, 0) / series.length).toFixed(1);
    return `<div class="jr-card jr-chart-card">
      <div class="jr-chart-head"><span>Mood trend</span><span class="jr-chart-sub">avg ${avg} · last ${series.length}</span></div>
      <svg viewBox="0 0 ${W} ${H}" class="jr-mood-chart" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="jrgrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#7c6af7"/><stop offset="100%" stop-color="#4fc3f7"/>
        </linearGradient></defs>
        <polyline points="${pts}" fill="none" stroke="url(#jrgrad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${dots}
      </svg>
    </div>`;
  }

  function render() {
    const entries = (STATE.data.journal?.entries || []);
    const groups = {};
    entries.forEach(e => { (groups[e.day] = groups[e.day] || []).push(e); });
    const days = Object.keys(groups).sort((a, b) => b.localeCompare(a));

    inner.innerHTML = window.buildPageHeader('Reflect', 'Your', 'Journal', 'Capture how today went — your AI reads this to know you better.') + `
      <div class="jr-wrap">
        <div class="jr-card jr-composer">
          <div class="jr-mood-label">How was today?</div>
          <div class="jr-mood-row">
            ${Object.keys(MOODS).map(m => `<button class="jr-mood${draftMood == m ? ' on' : ''}" data-mood="${m}" title="${MOODS[m][1]}">${MOODS[m][0]}</button>`).join('')}
          </div>
          <textarea class="jr-input" id="jrInput" rows="3" placeholder="What happened, what you're grateful for, what's on your mind…"></textarea>
          <div class="jr-composer-actions">
            <button class="jr-reflect" id="jrReflect" type="button">✦ Reflect on my week</button>
            <button class="jr-save" id="jrSave" type="button">Save entry</button>
          </div>
        </div>
        <div id="jrReflection"></div>
        ${moodChart()}
        <div class="jr-timeline">
          ${days.length ? days.map(day => `
            <div class="jr-day">
              <div class="jr-day-label">${fmtDay(day)}</div>
              ${groups[day].map(e => `
                <div class="jr-entry" data-id="${e.id}">
                  <div class="jr-entry-mood" style="--mc:${e.mood ? MOODS[e.mood][2] : '#3a4658'}">${e.mood ? MOODS[e.mood][0] : '•'}</div>
                  <div class="jr-entry-body">
                    ${e.text ? `<div class="jr-entry-text">${esc(e.text)}</div>` : '<div class="jr-entry-text jr-muted">(mood only)</div>'}
                    <div class="jr-entry-meta">${fmtTime(e.date)}${e.mood ? ' · ' + MOODS[e.mood][1] : ''}</div>
                  </div>
                  <div class="jr-entry-tools">
                    <button class="jr-iconbtn" data-edit="${e.id}" aria-label="Edit">✎</button>
                    <button class="jr-iconbtn" data-del="${e.id}" aria-label="Delete">✕</button>
                  </div>
                </div>`).join('')}
            </div>`).join('') : `<div class="jr-empty">No entries yet. Your first reflection starts the streak. 📓</div>`}
        </div>
      </div>`;
    wire();
  }

  function wire() {
    inner.querySelectorAll('.jr-composer .jr-mood').forEach(b => b.addEventListener('click', () => {
      draftMood = (draftMood == b.dataset.mood) ? null : b.dataset.mood;
      inner.querySelectorAll('.jr-composer .jr-mood').forEach(x => x.classList.toggle('on', x.dataset.mood === draftMood));
      if (window.haptic) window.haptic('tap');
    }));
    const save = inner.querySelector('#jrSave');
    if (save) save.addEventListener('click', () => {
      const t = inner.querySelector('#jrInput').value.trim();
      if (!t && !draftMood) { if (window.toast) window.toast('Write something or pick a mood', { type: 'warn' }); return; }
      STATE.addJournalEntry({ text: t, mood: draftMood ? Number(draftMood) : null });
      draftMood = null;
      if (window.haptic) window.haptic('success');
      if (window.toast) window.toast('Entry saved', { type: 'success', duration: 1400 });
      window.dispatchEvent(new CustomEvent('onyxra:state-changed', { detail: { local: true } }));
      render();
    });
    inner.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
      STATE.removeJournalEntry(b.dataset.del); if (window.haptic) window.haptic('tap'); render();
    }));
    inner.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => startEdit(b.dataset.edit)));
    const reflect = inner.querySelector('#jrReflect');
    if (reflect) reflect.addEventListener('click', doReflect);
  }

  function startEdit(id) {
    const e = (STATE.data.journal?.entries || []).find(x => x.id === id);
    const entryEl = inner.querySelector(`.jr-entry[data-id="${id}"]`);
    if (!e || !entryEl) return;
    entryEl.classList.add('editing');
    entryEl.innerHTML = `
      <div class="jr-edit-form">
        <div class="jr-mood-row">${Object.keys(MOODS).map(m => `<button class="jr-mood${e.mood == m ? ' on' : ''}" data-emood="${m}">${MOODS[m][0]}</button>`).join('')}</div>
        <textarea class="jr-input" id="jrEdit_${id}" rows="3">${esc(e.text || '')}</textarea>
        <div class="jr-composer-actions">
          <button class="jr-cancel" type="button" data-cancel>Cancel</button>
          <button class="jr-save" type="button" data-saveedit="${id}">Save</button>
        </div>
      </div>`;
    let em = e.mood;
    entryEl.querySelectorAll('[data-emood]').forEach(b => b.addEventListener('click', () => {
      em = (em == b.dataset.emood) ? null : Number(b.dataset.emood);
      entryEl.querySelectorAll('[data-emood]').forEach(x => x.classList.toggle('on', Number(x.dataset.emood) === em));
    }));
    entryEl.querySelector('[data-cancel]').addEventListener('click', render);
    entryEl.querySelector('[data-saveedit]').addEventListener('click', () => {
      STATE.updateJournalEntry(id, { text: entryEl.querySelector(`#jrEdit_${id}`).value.trim(), mood: em });
      if (window.toast) window.toast('Updated', { type: 'success', duration: 1200 });
      render();
    });
  }

  async function doReflect() {
    const box = inner.querySelector('#jrReflection');
    const btn = inner.querySelector('#jrReflect');
    if (!box) return;
    btn.disabled = true; btn.classList.add('loading');
    box.innerHTML = `<div class="jr-card jr-reflection"><div class="onyx-cap-thinking"><span></span><span></span><span></span></div></div>`;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Look at my recent journal entries and mood trend in the snapshot. Give me a short, warm weekly reflection: one thing that stands out, one gentle insight, and one suggestion for the week ahead. Four sentences max. Do not include any action block.' }],
          snapshot: window.buildOnyxraSnapshot ? window.buildOnyxraSnapshot() : {},
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        box.innerHTML = `<div class="jr-card jr-reflection jr-err">⚠️ ${esc(e.error || 'Reflection unavailable.')}</div>`;
      } else {
        const data = await res.json();
        const parsed = window.parseOnyxraActions ? window.parseOnyxraActions(data.reply || '') : { clean: data.reply };
        box.innerHTML = `<div class="jr-card jr-reflection">
          <div class="jr-reflection-head">✦ Weekly reflection</div>
          <div class="jr-reflection-body">${esc(parsed.clean || data.reply || '').replace(/\n/g, '<br/>')}</div>
        </div>`;
      }
    } catch (e) {
      box.innerHTML = `<div class="jr-card jr-reflection jr-err">⚠️ ${esc(e.message)}</div>`;
    } finally {
      btn.disabled = false; btn.classList.remove('loading');
    }
  }

  // Refresh when state changes elsewhere (e.g. quick capture) while this page is open.
  window.__renderJournal = render;
  if (!window.__onyxJournalListener) {
    window.__onyxJournalListener = true;
    window.addEventListener('onyxra:state-changed', () => {
      const pg = document.getElementById('page-journal');
      const editing = inner.querySelector('.jr-entry.editing');
      if (pg && pg.classList.contains('active') && !editing) {
        try { window.__renderJournal && window.__renderJournal(); } catch (e) {}
      }
    });
  }

  render();
});
