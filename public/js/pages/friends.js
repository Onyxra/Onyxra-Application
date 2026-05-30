/**
 * ONYXRA — pages/friends.js
 *
 * Friends tracker. Mirrors the family page but with separate state.
 */

window.registerPage('friends', function initFriends() {

  const inner = document.getElementById('friends-inner');
  if (!inner) return;

  const fri     = () => STATE.data.friends || { activeMemberId: null, members: [] };
  const members = () => fri().members || [];

  inner.innerHTML = `
    ${buildPageHeader('Your circle', 'Friends', 'OS',
      'Keep tabs on your friends — what they’re up to, what matters.'
    )}
    <div id="friendsPanel"></div>`;

  let activeMemberId = null;
  let showingNew     = false;

  function buildMemberTabs() {
    const tabs = [
      ...members().map(m => ({ id: m.id, label: (m.icon || '🧑') + ' ' + m.name })),
      { id: '__new__', label: '+ Add Friend' },
    ];
    const activeId = showingNew ? '__new__' : (activeMemberId || '__new__');
    setPageTabs(inner, tabs, activeId, id => {
      if (id === '__new__') {
        showingNew = true;
        activeMemberId = null;
      } else {
        showingNew = false;
        activeMemberId = id;
        STATE.data.friends.activeMemberId = id;
        STATE.save();
      }
      buildMemberTabs();
      renderPanel();
    });
  }

  function renderPanel() {
    const panel = document.getElementById('friendsPanel');
    if (showingNew) {
      renderNewMemberForm(panel);
    } else if (activeMemberId) {
      renderMemberView(panel, activeMemberId);
    } else if (members().length > 0) {
      activeMemberId = members()[0].id;
      renderMemberView(panel, activeMemberId);
    } else {
      panel.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align:center;padding:48px">
            <div style="font-size:32px;margin-bottom:12px">🧑‍🤝‍🧑</div>
            <div style="font-size:15px;font-weight:600;margin-bottom:6px">No friends added yet</div>
            <div style="font-size:13px;color:var(--muted)">Click "+ Add Friend" to start tracking what your people are up to.</div>
          </div>
        </div>`;
    }
  }

  function renderMemberView(panel, memberId) {
    const m = members().find(m => m.id === memberId);
    if (!m) { panel.innerHTML = ''; return; }

    panel.innerHTML = `
      <div class="card" style="margin-bottom:16px;overflow:hidden">
        <div style="padding:20px 22px;display:flex;align-items:center;gap:16px;border-bottom:1px solid var(--border)">
          <div style="width:54px;height:54px;border-radius:14px;background:rgba(255,179,64,0.15);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:30px;flex-shrink:0">${escapeHtml(m.icon || '🧑')}</div>
          <div style="flex:1;min-width:0">
            <div style="font-family:'Rajdhani',sans-serif;font-size:22px;font-weight:700;line-height:1">${escapeHtml(m.name)}</div>
            ${m.role ? `<div style="font-size:12px;color:var(--muted);margin-top:3px">${escapeHtml(m.role)}</div>` : ''}
          </div>
          <button id="removeFriendBtn" title="Remove friend" style="background:none;border:none;color:rgba(255,255,255,0.3);font-size:18px;cursor:pointer;padding:6px 10px">×</button>
        </div>
        <div style="padding:14px 20px">
          <label class="form-label" style="margin-bottom:6px;display:block">Notes</label>
          <textarea class="venture-notes-input" id="friendNotes" placeholder="Inside jokes, things they're into, what they need…" style="min-height:60px">${escapeHtml(m.notes || '')}</textarea>
        </div>
      </div>

      <div class="card" style="margin-bottom:16px;overflow:hidden">
        <div style="padding:14px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <div style="font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted)">What they're up to</div>
          <span style="font-size:11px;color:var(--muted)">${(m.updates || []).length} ${(m.updates || []).length === 1 ? 'entry' : 'entries'}</span>
        </div>
        <div style="padding:14px 20px">
          <form id="addUpdateForm" style="display:flex;gap:8px;margin-bottom:14px">
            <input id="addUpdateInput" type="text" class="form-input" placeholder="What's going on with them…" style="flex:1" />
            <button type="submit" class="phase-btn active" style="padding:8px 16px;font-size:13px">Log</button>
          </form>
          <div id="updatesFeed">
            ${(m.updates || []).length ? (m.updates || []).map(u => `
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
                <div style="flex:1;min-width:0">
                  <div style="font-size:13px;color:rgba(255,255,255,0.92);line-height:1.5">${escapeHtml(u.text)}</div>
                  <div style="font-size:10px;color:var(--muted);margin-top:3px;font-family:'Rajdhani',sans-serif;letter-spacing:1px;text-transform:uppercase">${formatDate(u.date)}</div>
                </div>
                <button class="removeUpdateBtn" data-uid="${u.id}" title="Remove" style="background:none;border:none;color:rgba(255,255,255,0.25);font-size:14px;cursor:pointer;padding:4px 6px">×</button>
              </div>
            `).join('') : `<div style="text-align:center;padding:24px 0;color:var(--muted);font-size:12px;font-style:italic">No updates yet — log the first one above.</div>`}
          </div>
        </div>
      </div>
    `;

    document.getElementById('removeFriendBtn').addEventListener('click', () => {
      if (!confirm(`Remove ${m.name}?`)) return;
      STATE.removeFriend(m.id);
      activeMemberId = members()[0]?.id || null;
      showingNew = activeMemberId == null;
      buildMemberTabs();
      renderPanel();
    });

    let notesTimer;
    const notesEl = document.getElementById('friendNotes');
    notesEl.addEventListener('input', () => {
      clearTimeout(notesTimer);
      notesTimer = setTimeout(() => STATE.updateFriend(m.id, { notes: notesEl.value }), 600);
    });

    document.getElementById('addUpdateForm').addEventListener('submit', e => {
      e.preventDefault();
      const inp = document.getElementById('addUpdateInput');
      const text = (inp.value || '').trim();
      if (!text) return;
      STATE.addFriendUpdate(m.id, text);
      inp.value = '';
      renderMemberView(panel, memberId);
    });

    document.querySelectorAll('.removeUpdateBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        STATE.removeFriendUpdate(m.id, btn.dataset.uid);
        renderMemberView(panel, memberId);
      });
    });
  }

  function renderNewMemberForm(panel) {
    panel.innerHTML = `
      <div class="card">
        <div class="card-header"><div class="card-title">Add Friend</div></div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-field">
              <label class="form-label">Name</label>
              <input class="form-input" id="nfName" type="text" placeholder="e.g. Jake, Emma, Tony…" />
            </div>
            <div class="form-field" style="max-width:80px">
              <label class="form-label">Icon</label>
              <input class="form-input" id="nfIcon" type="text" placeholder="🧑" maxlength="4" />
            </div>
          </div>
          <div class="form-field" style="margin-top:12px">
            <label class="form-label">Context (optional)</label>
            <input class="form-input" id="nfRole" type="text" placeholder="e.g. College friend, Workout buddy, Neighbor…" />
          </div>
          <div class="form-field" style="margin-top:12px">
            <label class="form-label">Notes (optional)</label>
            <textarea class="venture-notes-input" id="nfNotes" placeholder="What's worth remembering…" style="min-height:60px"></textarea>
          </div>
          <button class="phase-btn active" id="createFriend" style="margin-top:24px;padding:10px 24px;font-size:14px">Add Friend</button>
          <div id="nfError" style="color:var(--danger);font-size:12px;margin-top:8px;display:none"></div>
        </div>
      </div>`;

    panel.querySelector('#createFriend').addEventListener('click', () => {
      const name  = panel.querySelector('#nfName').value.trim();
      const icon  = panel.querySelector('#nfIcon').value.trim() || '🧑';
      const role  = panel.querySelector('#nfRole').value.trim();
      const notes = panel.querySelector('#nfNotes').value.trim();
      const err   = panel.querySelector('#nfError');
      if (!name) {
        err.textContent = 'Name is required.';
        err.style.display = 'block';
        return;
      }
      const newId = STATE.addFriend(name, role, icon, notes);
      activeMemberId = newId;
      showingNew = false;
      buildMemberTabs();
      renderPanel();
    });
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]);
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7)  return diffDays + ' days ago';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: now.getFullYear() === d.getFullYear() ? undefined : 'numeric' });
  }

  activeMemberId = fri().activeMemberId || members()[0]?.id || null;
  if (!members().find(m => m.id === activeMemberId)) activeMemberId = members()[0]?.id || null;
  buildMemberTabs();
  renderPanel();
});
