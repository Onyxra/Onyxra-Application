/**
 * ONYXRA — pages/relationship.js
 *
 * Singular profile for the user's significant other.
 * Sections:
 *   - Profile (name, icon, anniversary, notes)
 *   - Updates feed: dated notes about what they're up to / how things are
 *   - Important dates: anniversaries, birthdays, dates that matter
 *   - Gift ideas: running list with "given" toggle
 */

window.registerPage('relationship', function initRelationship() {

  const inner = document.getElementById('relationship-inner');
  if (!inner) return;

  function rel() {
    if (!STATE.data.relationship) {
      STATE.setRelationshipProfile({});
    }
    return STATE.data.relationship;
  }

  inner.innerHTML = `
    ${buildPageHeader('Your partner', 'Relationship', 'OS',
      'A space for the most important person — anniversaries, gift ideas, how they are doing.'
    )}
    <div id="relationshipPanel"></div>`;

  render();

  function render() {
    const r = rel();
    const panel = document.getElementById('relationshipPanel');
    panel.innerHTML = `
      ${renderProfileCard(r)}
      ${renderUpdatesCard(r)}
      ${renderDatesCard(r)}
      ${renderGiftsCard(r)}
    `;
    wireUp(r);
  }

  /* ── Profile card ── */
  function renderProfileCard(r) {
    return `
      <div class="card" style="margin-bottom:16px;overflow:hidden">
        <div style="padding:20px 22px;display:flex;align-items:center;gap:16px;border-bottom:1px solid var(--border)">
          <input id="relIcon" type="text" maxlength="4" value="${escapeAttr(r.icon || '💕')}" style="
            width:60px;height:60px;border-radius:14px;
            background:rgba(255,122,77,0.15);border:1px solid rgba(255,122,77,0.3);
            text-align:center;font-size:34px;
            color:#fff;outline:none;font-family:inherit;flex-shrink:0
          " />
          <div style="flex:1;min-width:0">
            <input id="relName" type="text" placeholder="Their name…" value="${escapeAttr(r.name || '')}" style="
              width:100%;
              background:none;border:none;
              font-family:'Rajdhani',sans-serif;font-size:22px;font-weight:700;
              color:#fff;outline:none;padding:0
            " />
            <div style="display:flex;align-items:center;gap:6px;margin-top:6px">
              <span style="font-size:10px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted)">Together since</span>
              <input id="relStart" type="date" value="${escapeAttr(r.startDate || '')}" style="
                background:none;border:none;color:rgba(255,255,255,0.85);
                font-family:inherit;font-size:12px;outline:none;padding:0;
                color-scheme:dark
              " />
            </div>
          </div>
        </div>
        <div style="padding:14px 20px">
          <label class="form-label" style="margin-bottom:6px;display:block">About them</label>
          <textarea id="relNotes" class="venture-notes-input" placeholder="What you love about them, things they're into, how to make their day…" style="min-height:80px">${escapeHtml(r.notes || '')}</textarea>
        </div>
      </div>
    `;
  }

  /* ── Updates feed ── */
  function renderUpdatesCard(r) {
    const list = (r.updates || []);
    return `
      <div class="card" style="margin-bottom:16px;overflow:hidden">
        <div style="padding:14px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <div style="font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted)">What's going on</div>
          <span style="font-size:11px;color:var(--muted)">${list.length} ${list.length === 1 ? 'entry' : 'entries'}</span>
        </div>
        <div style="padding:14px 20px">
          <form id="addUpdateForm" style="display:flex;gap:8px;margin-bottom:14px">
            <input id="addUpdateInput" type="text" class="form-input" placeholder="Something they shared, an inside joke, how today felt…" style="flex:1" />
            <button type="submit" class="phase-btn active" style="padding:8px 16px;font-size:13px">Log</button>
          </form>
          <div id="updatesFeed">
            ${list.length ? list.map(u => `
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
                <div style="flex:1;min-width:0">
                  <div style="font-size:13px;color:rgba(255,255,255,0.92);line-height:1.5">${escapeHtml(u.text)}</div>
                  <div style="font-size:10px;color:var(--muted);margin-top:3px;font-family:'Rajdhani',sans-serif;letter-spacing:1px;text-transform:uppercase">${formatRelDate(u.date)}</div>
                </div>
                <button class="removeUpdateBtn" data-uid="${u.id}" title="Remove" style="background:none;border:none;color:rgba(255,255,255,0.25);font-size:14px;cursor:pointer;padding:4px 6px">×</button>
              </div>
            `).join('') : `<div style="text-align:center;padding:24px 0;color:var(--muted);font-size:12px;font-style:italic">No notes yet — log the first one above.</div>`}
          </div>
        </div>
      </div>
    `;
  }

  /* ── Important dates ── */
  function renderDatesCard(r) {
    const dates = (r.dates || []);
    return `
      <div class="card" style="margin-bottom:16px;overflow:hidden">
        <div style="padding:14px 20px;border-bottom:1px solid var(--border)">
          <div style="font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted)">Important dates</div>
        </div>
        <div style="padding:14px 20px">
          <form id="addDateForm" style="display:grid;grid-template-columns:1fr 160px auto;gap:8px;margin-bottom:14px">
            <input id="addDateLabel" type="text" class="form-input" placeholder="Anniversary, birthday, when we met…" />
            <input id="addDateValue" type="date" class="form-input" style="color-scheme:dark" />
            <button type="submit" class="phase-btn active" style="padding:8px 14px;font-size:13px">Add</button>
          </form>
          <div id="datesList">
            ${dates.length ? dates.map(d => `
              <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
                <div style="flex:1;min-width:0">
                  <div style="font-size:13px;color:rgba(255,255,255,0.92)">${escapeHtml(d.label)}</div>
                  <div style="font-size:11px;color:var(--muted);margin-top:2px">${formatImportantDate(d.date)}</div>
                </div>
                <span style="font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;color:#ff7a4d;letter-spacing:1px;text-transform:uppercase">${daysUntil(d.date)}</span>
                <button class="removeDateBtn" data-did="${d.id}" style="background:none;border:none;color:rgba(255,255,255,0.25);font-size:14px;cursor:pointer">×</button>
              </div>
            `).join('') : `<div style="text-align:center;padding:18px 0;color:var(--muted);font-size:12px;font-style:italic">Add anniversaries, birthdays, days that matter.</div>`}
          </div>
        </div>
      </div>
    `;
  }

  /* ── Gift ideas ── */
  function renderGiftsCard(r) {
    const ideas = (r.giftIdeas || []);
    const open = ideas.filter(g => !g.given);
    const given = ideas.filter(g => g.given);
    return `
      <div class="card" style="overflow:hidden">
        <div style="padding:14px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <div style="font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted)">Gift ideas</div>
          <span style="font-size:11px;color:var(--muted)">${open.length} open${given.length ? ` · ${given.length} given` : ''}</span>
        </div>
        <div style="padding:14px 20px">
          <form id="addGiftForm" style="display:flex;gap:8px;margin-bottom:14px">
            <input id="addGiftInput" type="text" class="form-input" placeholder="Something they'd love…" style="flex:1" />
            <button type="submit" class="phase-btn active" style="padding:8px 16px;font-size:13px">Add</button>
          </form>
          <div id="giftsList">
            ${ideas.length ? ideas.map(g => `
              <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
                <button class="giftToggleBtn" data-gid="${g.id}" title="${g.given ? 'Mark as not given' : 'Mark as given'}" style="
                  width:18px;height:18px;border-radius:50%;
                  border:1.5px solid ${g.given ? '#3ddc6e' : 'rgba(255,255,255,0.3)'};
                  background:${g.given ? '#3ddc6e' : 'transparent'};
                  color:#000;font-size:11px;line-height:1;cursor:pointer;
                  display:flex;align-items:center;justify-content:center;flex-shrink:0
                ">${g.given ? '✓' : ''}</button>
                <span style="flex:1;font-size:13px;color:${g.given ? 'var(--muted)' : 'rgba(255,255,255,0.92)'};text-decoration:${g.given ? 'line-through' : 'none'}">${escapeHtml(g.text)}</span>
                <button class="removeGiftBtn" data-gid="${g.id}" style="background:none;border:none;color:rgba(255,255,255,0.25);font-size:14px;cursor:pointer">×</button>
              </div>
            `).join('') : `<div style="text-align:center;padding:18px 0;color:var(--muted);font-size:12px;font-style:italic">Capture gift ideas the moment you think of them.</div>`}
          </div>
        </div>
      </div>
    `;
  }

  /* ─────────────────────────────────────────────────────────────
     EVENT WIRING
  ───────────────────────────────────────────────────────────── */
  function wireUp(r) {
    let saveTimer;
    const debounce = (fn) => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(fn, 500);
    };

    // Profile
    const nameEl  = document.getElementById('relName');
    const iconEl  = document.getElementById('relIcon');
    const startEl = document.getElementById('relStart');
    const notesEl = document.getElementById('relNotes');

    nameEl.addEventListener('input',  () => debounce(() => STATE.setRelationshipProfile({ name: nameEl.value })));
    iconEl.addEventListener('input',  () => debounce(() => STATE.setRelationshipProfile({ icon: iconEl.value || '💕' })));
    startEl.addEventListener('change',() => STATE.setRelationshipProfile({ startDate: startEl.value || null }));
    notesEl.addEventListener('input', () => debounce(() => STATE.setRelationshipProfile({ notes: notesEl.value })));

    // Add update
    document.getElementById('addUpdateForm').addEventListener('submit', e => {
      e.preventDefault();
      const inp = document.getElementById('addUpdateInput');
      const text = (inp.value || '').trim();
      if (!text) return;
      STATE.addRelationshipUpdate(text);
      inp.value = '';
      render();
    });

    document.querySelectorAll('.removeUpdateBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        STATE.removeRelationshipUpdate(btn.dataset.uid);
        render();
      });
    });

    // Add date
    document.getElementById('addDateForm').addEventListener('submit', e => {
      e.preventDefault();
      const label = document.getElementById('addDateLabel').value.trim();
      const date  = document.getElementById('addDateValue').value;
      if (!label || !date) return;
      STATE.addRelationshipDate(label, date);
      render();
    });

    document.querySelectorAll('.removeDateBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        STATE.removeRelationshipDate(btn.dataset.did);
        render();
      });
    });

    // Gift ideas
    document.getElementById('addGiftForm').addEventListener('submit', e => {
      e.preventDefault();
      const inp = document.getElementById('addGiftInput');
      const text = (inp.value || '').trim();
      if (!text) return;
      STATE.addGiftIdea(text);
      inp.value = '';
      render();
    });

    document.querySelectorAll('.giftToggleBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        STATE.toggleGiftIdea(btn.dataset.gid);
        render();
      });
    });

    document.querySelectorAll('.removeGiftBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        STATE.removeGiftIdea(btn.dataset.gid);
        render();
      });
    });
  }

  /* ── Helpers ── */
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]);
  }
  function escapeAttr(s) {
    return escapeHtml(s);
  }
  function formatRelDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7)   return diffDays + ' days ago';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  function formatImportantDate(yyyymmdd) {
    if (!yyyymmdd) return '';
    const [y, m, d] = yyyymmdd.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
  function daysUntil(yyyymmdd) {
    if (!yyyymmdd) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [, m, d] = yyyymmdd.split('-').map(Number);
    const next = new Date(today.getFullYear(), m - 1, d);
    if (next < today) next.setFullYear(today.getFullYear() + 1);
    const diff = Math.round((next - today) / 86400000);
    if (diff === 0) return 'TODAY';
    if (diff === 1) return 'TOMORROW';
    if (diff < 30)  return `IN ${diff}D`;
    if (diff < 365) return `IN ${Math.round(diff / 30)}MO`;
    return '';
  }
});
