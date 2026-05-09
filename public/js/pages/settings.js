/**
 * KOLTYN OS — pages/settings.js
 *
 * Profile & Settings page.
 * Sections: Profile card, North Star, Data management, App info.
 */

window.registerPage('settings', function initSettings() {

  const inner = document.getElementById('settings-inner');

  inner.innerHTML = `
    ${buildPageHeader('Personal OS', 'Profile', 'Settings',
      'Manage your profile, data, and preferences.'
    )}

    <!-- ══ Profile Card ══ -->
    <div class="card" style="margin-bottom:16px;overflow:hidden">
      <div style="padding:24px 20px;display:flex;align-items:center;gap:18px">
        <div style="
          width:64px;height:64px;border-radius:50%;
          background:var(--accent);color:#000;
          font-family:'Rajdhani',sans-serif;font-size:22px;font-weight:700;
          display:flex;align-items:center;justify-content:center;
          flex-shrink:0;letter-spacing:1px">KO</div>
        <div>
          <div style="font-family:'Rajdhani',sans-serif;font-size:24px;font-weight:700;line-height:1">Koltyn</div>
          <div style="font-size:12px;color:var(--muted);margin-top:3px">Life Operating System</div>
          <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">
            <span class="badge badge-accent">$50K MRR</span>
            <span class="badge" style="background:rgba(255,255,255,0.07);color:var(--fg)">200 lbs</span>
            <span class="badge" style="background:rgba(255,255,255,0.07);color:var(--fg)">15% BF</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ North Star ══ -->
    <div class="card" style="margin-bottom:16px;overflow:hidden">
      <div style="padding:14px 20px;border-bottom:1px solid var(--border)">
        <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--muted)">North Star</div>
      </div>
      <div style="padding:16px 20px;display:flex;flex-direction:column;gap:12px">
        ${[
          { label: 'Business', value: '$50,000 MRR', icon: '◧', color: 'var(--accent2)' },
          { label: 'Body Weight', value: '200 lbs', icon: '◉', color: 'var(--accent)' },
          { label: 'Body Fat', value: '15%', icon: '◈', color: 'var(--accent3)' },
        ].map(g => `
          <div style="display:flex;align-items:center;gap:14px">
            <div style="width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:16px;color:${g.color};flex-shrink:0">${g.icon}</div>
            <div>
              <div style="font-size:10px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted)">${g.label}</div>
              <div style="font-family:'Rajdhani',sans-serif;font-size:18px;font-weight:700;color:var(--fg);margin-top:1px">${g.value}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>

    <!-- ══ App Preferences ══ -->
    <div class="card" style="margin-bottom:16px;overflow:hidden">
      <div style="padding:14px 20px;border-bottom:1px solid var(--border)">
        <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--muted)">Preferences</div>
      </div>
      <div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.04)">
          <div>
            <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700">Notifications</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px">Daily reminders and check-ins</div>
          </div>
          <label class="settings-toggle">
            <input type="checkbox" id="toggleNotifs" checked />
            <span class="settings-toggle-track"></span>
          </label>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px">
          <div>
            <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700">Auto-save</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px">Persist all changes to IndexedDB</div>
          </div>
          <label class="settings-toggle">
            <input type="checkbox" id="toggleAutosave" checked disabled />
            <span class="settings-toggle-track"></span>
          </label>
        </div>
      </div>
    </div>

    <!-- ══ Data Management ══ -->
    <div class="card" style="margin-bottom:16px;overflow:hidden">
      <div style="padding:14px 20px;border-bottom:1px solid var(--border)">
        <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--muted)">Data Management</div>
      </div>
      <div style="padding:16px 20px;display:flex;flex-direction:column;gap:10px">
        <div style="font-size:12px;color:var(--muted);line-height:1.6;margin-bottom:4px">
          Export a full snapshot of your OS data as JSON, or restore a previous backup.
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button id="exportStateBtn" class="day-tab active" style="flex:1;min-width:120px;padding:12px 16px;display:flex;align-items:center;justify-content:center;gap:8px">
            <span>⬇</span> Export Data
          </button>
          <button id="importStateBtn" class="day-tab" style="flex:1;min-width:120px;padding:12px 16px;display:flex;align-items:center;justify-content:center;gap:8px">
            <span>⬆</span> Import Data
          </button>
          <input type="file" id="importFileInput" accept=".json" style="display:none" />
        </div>
        <div id="dataMsg" style="font-size:11px;color:var(--accent);display:none;margin-top:4px"></div>
      </div>
    </div>

    <!-- ══ Danger Zone ══ -->
    <div class="card" style="margin-bottom:16px;overflow:hidden;border-color:rgba(255,107,107,0.2)">
      <div style="padding:14px 20px;border-bottom:1px solid rgba(255,107,107,0.15)">
        <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--danger)">Danger Zone</div>
      </div>
      <div style="padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div>
          <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700">Reset All Data</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">Clears IndexedDB and restores defaults. Irreversible.</div>
        </div>
        <button id="resetDataBtn" style="padding:10px 18px;border-radius:8px;border:1px solid rgba(255,107,107,0.3);background:rgba(255,107,107,0.07);color:var(--danger);font-family:'Rajdhani',sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;cursor:pointer;white-space:nowrap">
          Reset
        </button>
      </div>
    </div>

    <!-- ══ About ══ -->
    <div class="card" style="overflow:hidden">
      <div style="padding:14px 20px;border-bottom:1px solid var(--border)">
        <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--muted)">About</div>
      </div>
      <div style="padding:16px 20px;display:flex;flex-direction:column;gap:8px">
        ${[
          ['App',       'Koltyn OS'],
          ['Version',   '1.0.0'],
          ['Built by',  'Koltyn'],
          ['Storage',   'IndexedDB (local, offline-first)'],
          ['PWA',       'Installable · Works offline'],
        ].map(([k, v]) => `
          <div style="display:flex;justify-content:space-between;align-items:baseline;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
            <span style="font-size:11px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted)">${k}</span>
            <span style="font-size:12px;color:var(--fg)">${v}</span>
          </div>`).join('')}
      </div>
    </div>`;

  /* ── Toggle styles (inline — no extra class needed) ── */
  if (!document.getElementById('settingsToggleStyle')) {
    const s = document.createElement('style');
    s.id = 'settingsToggleStyle';
    s.textContent = `
      .settings-toggle { position:relative;display:inline-flex;cursor:pointer; }
      .settings-toggle input { opacity:0;width:0;height:0;position:absolute; }
      .settings-toggle-track {
        width:42px;height:24px;border-radius:12px;
        background:rgba(255,255,255,0.1);border:1px solid var(--border);
        transition:background 0.2s,border-color 0.2s;
        position:relative;
      }
      .settings-toggle-track::after {
        content:'';position:absolute;
        top:3px;left:3px;
        width:16px;height:16px;border-radius:50%;
        background:#fff;transition:transform 0.2s;
      }
      .settings-toggle input:checked + .settings-toggle-track {
        background:var(--accent);border-color:var(--accent);
      }
      .settings-toggle input:checked + .settings-toggle-track::after {
        transform:translateX(18px);
      }
      .settings-toggle input:disabled + .settings-toggle-track { opacity:0.45; }
    `;
    document.head.appendChild(s);
  }

  /* ── Export ── */
  inner.querySelector('#exportStateBtn').addEventListener('click', () => {
    STATE.exportToFile();
    showMsg('Export started — check your Downloads folder.');
  });

  /* ── Import ── */
  const importFileInput = inner.querySelector('#importFileInput');
  inner.querySelector('#importStateBtn').addEventListener('click', () => importFileInput.click());
  importFileInput.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await STATE.importFromFile(file);
      showMsg('Data imported successfully. Reload the page to apply.');
    } catch {
      showMsg('Import failed — make sure the file is a valid Koltyn OS export.');
    }
  });

  /* ── Reset ── */
  inner.querySelector('#resetDataBtn').addEventListener('click', () => {
    if (!confirm('This will permanently delete all your saved data and reset to defaults. Are you sure?')) return;
    if (!confirm('Second confirmation: ALL data will be lost. Continue?')) return;
    indexedDB.deleteDatabase('koltyn-os');
    showMsg('Data cleared. Reloading...');
    setTimeout(() => location.reload(), 1200);
  });

  function showMsg(text) {
    const el = inner.querySelector('#dataMsg');
    el.textContent = text;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
  }

});

