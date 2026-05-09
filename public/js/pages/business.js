/**
 * KOLTYN OS — business/page.js
 *
 * HIERARCHY
 *   Ventures (STATE.data.business.ventures[])
 *     └── Blueprints  (venture.blueprints[])
 *           └── Steps  (blueprint.steps[])  ← checkable, with notes
 *
 * DESIGN
 *   Each venture is self-contained: its own overview (metrics, notes),
 *   its own Hormozi stage timeline, and its own blueprints.
 *   No "all ventures at a glance" overview — each venture is the focus.
 *
 *   Venture selector tabs across the top, then "+ New" at the end.
 *
 * ALL WRITES GO THROUGH STATE MUTATORS → IDB
 *   STATE.addVenture()           → ventures[] → IDB
 *   STATE.updateVenture()        → venture fields → IDB
 *   STATE.setHormoziStage()      → venture.hormozi_stage → IDB
 *   STATE.addBlueprint()         → venture.blueprints[] → IDB
 *   STATE.completeStep()         → blueprint.steps[].completed → IDB
 *   STATE.setStepNotes()         → blueprint.steps[].notes → IDB
 *   STATE.exportJSON()           → downloads full STATE snapshot as JSON
 *   STATE.importFromFile()       → replaces STATE + saves to IDB
 */

window.registerPage('business', function initBusiness() {

  /* ── Shorthand refs ── */
  const biz      = () => STATE.data.business;
  const ventures = () => biz().ventures;

  /* ── Build shell HTML ── */
  const inner = document.getElementById('business-inner');
  inner.innerHTML = `
    ${buildPageHeader('Envosta HQ', 'Business', 'OS',
      'Multi-venture · Hormozi roadmap · Blueprint step tracking.'
    )}
    <div id="bizPanel"></div>`;

  /* ══════════════════════════════════════════════════════════════
     VENTURE TABS — rebuilt whenever ventures change
  ══════════════════════════════════════════════════════════════ */
  let activeVentureId = null;
  let showingNew      = false;

  function buildVentureTabs() {
    const tabs = [
      ...ventures().map(v => ({ id: v.id, label: v.icon + ' ' + v.name })),
      { id: '__new__', label: '+ New Venture' },
    ];
    const activeId = showingNew ? '__new__' : (activeVentureId || '__new__');
    setPageTabs(inner, tabs, activeId, id => {
      if (id === '__new__') {
        showingNew = true;
        activeVentureId = null;
      } else {
        showingNew = false;
        activeVentureId = id;
      }
      buildVentureTabs();
      renderPanel();
    });
  }

  function renderPanel() {
    const panel = document.getElementById('bizPanel');
    if (showingNew) {
      renderNewVentureForm(panel);
    } else if (activeVentureId) {
      renderVentureView(panel, activeVentureId);
    } else if (ventures().length > 0) {
      /* Default: first venture */
      activeVentureId = ventures()[0].id;
      renderVentureView(panel, activeVentureId);
    } else {
      panel.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align:center;padding:48px">
            <div style="font-size:32px;margin-bottom:12px">🚀</div>
            <div style="font-size:15px;font-weight:600;margin-bottom:6px">No ventures yet</div>
            <div style="font-size:13px;color:var(--muted)">Click "+ New Venture" to create your first one.</div>
          </div>
        </div>`;
    }
  }

  /* ══════════════════════════════════════════════════════════════
     VENTURE VIEW — self-contained overview + Hormozi stages + blueprints
  ══════════════════════════════════════════════════════════════ */
  function renderVentureView(panel, ventureId) {
    const v = ventures().find(v => v.id === ventureId);
    if (!v) { panel.innerHTML = ''; return; }

    const STAGES    = APP_DATA.business.stages;
    const TEMPLATES = APP_DATA.blueprintTemplates || [];

    /* Blueprint state */
    let activeBpId = biz().activeBlueprintId;
    if (!v.blueprints.find(b => b.id === activeBpId)) {
      activeBpId = v.blueprints[0]?.id || null;
      STATE.data.business.activeBlueprintId = activeBpId;
    }

    const stage        = STAGES[v.hormozi_stage] || STAGES[0];
    const totalSteps   = v.blueprints.reduce((s, b) => s + b.steps.length, 0);
    const doneSteps    = v.blueprints.reduce((s, b) => s + b.steps.filter(st => st.completed).length, 0);
    const overallPct   = totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0;

    panel.innerHTML = `
      <!-- ── Venture Overview ── -->
      <div class="card" style="margin-bottom:16px">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:30px">${v.icon}</span>
            <div>
              <div style="font-family:'Rajdhani',sans-serif;font-size:22px;font-weight:700">${v.name}</div>
              <div style="font-size:12px;color:var(--muted)">${v.description || 'No description set'}</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${v.boardType ? `<span class="badge badge-accent" style="text-transform:capitalize">${v.boardType === 'saas' ? '⚡ SaaS' : v.boardType === 'product' ? '📦 Product' : '🤝 Service'}</span>` : ''}
            <span class="badge badge-warn">Hormozi Stage ${v.hormozi_stage} — ${stage.name}</span>
          </div>
        </div>
        <div class="card-body">
          <!-- Editable metrics -->
          <div style="display:flex;gap:20px;margin-bottom:16px;flex-wrap:wrap">
            <div>
              <div class="form-label" style="margin-bottom:2px">MRR</div>
              <input class="venture-metric-input" data-field="mrr" type="number" value="${v.mrr || 0}" placeholder="0" />
            </div>
            <div>
              <div class="form-label" style="margin-bottom:2px">Paying Users</div>
              <input class="venture-metric-input" data-field="users" type="number" value="${v.users || 0}" placeholder="0" />
            </div>
            <div>
              <div class="form-label" style="margin-bottom:2px">Hormozi Stage</div>
              <select class="app-select" id="hormozi-stage-sel">
                ${STAGES.map((s, i) => `<option value="${i}"${i === v.hormozi_stage ? ' selected' : ''}>${i} — ${s.name}</option>`).join('')}
              </select>
            </div>
          </div>
          <!-- Overall blueprint progress -->
          <div style="font-size:11px;color:var(--muted);margin-bottom:4px">Blueprint progress — ${doneSteps}/${totalSteps} steps (${overallPct}%)</div>
          <div class="progress-track" style="margin-bottom:16px"><div class="progress-fill" style="width:${overallPct}%"></div></div>
          <!-- Venture notes -->
          <div class="form-label" style="margin-bottom:4px">Venture Notes</div>
          <textarea class="venture-notes-input" id="ventureNotes" placeholder="Key decisions, blockers, observations…">${v.notes || ''}</textarea>
        </div>
      </div>

      <!-- ── Hormozi Stage Timeline for this venture ── -->
      <div class="card" style="margin-bottom:16px">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
          <div class="card-title">Hormozi Roadmap</div>
          <span class="badge badge-accent">Stage ${v.hormozi_stage} — ${stage.name}</span>
        </div>
        <div class="card-body">
          <div class="stage-timeline" id="stageTimeline"></div>
          <div id="stageDetail" style="margin-top:16px;padding:14px 16px;background:rgba(124,106,247,0.06);border:1px solid rgba(124,106,247,0.2);border-radius:10px">
            <div style="font-family:'Rajdhani',sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:var(--accent);margin-bottom:5px">
              Current Stage — ${stage.name}
            </div>
            <div style="font-size:13px;color:rgba(226,234,242,0.82);line-height:1.6">${stage.sub}</div>
          </div>
        </div>
      </div>

      <!-- ── Blueprints ── -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
        <div class="section-label" style="margin-bottom:0">Blueprints</div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <select class="app-select" id="addBpSel">
            <option value="">+ Add Blueprint…</option>
            ${TEMPLATES.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
          </select>
          <button class="day-tab" id="addBpBtn">Add</button>
        </div>
      </div>

      ${v.blueprints.length === 0 ? `
        <div class="card">
          <div class="card-body" style="text-align:center;padding:32px;color:var(--muted);font-size:13px">
            No blueprints yet. Select a framework above and click Add.
          </div>
        </div>` : `
        <div class="day-tabs" style="margin-bottom:14px;flex-wrap:wrap" id="bpTabs">
          ${v.blueprints.map(b => `
            <button class="day-tab${b.id === activeBpId ? ' active' : ''}" data-bpid="${b.id}">${b.name}</button>`).join('')}
        </div>
        <div id="bpDetail"></div>`}`;

    /* ── Metric inputs ── */
    panel.querySelectorAll('.venture-metric-input').forEach(inp => {
      inp.addEventListener('change', () => {
        STATE.updateVenture(ventureId, { [inp.dataset.field]: parseFloat(inp.value) || 0 });
      });
    });

    /* ── Stage selector ── */
    panel.querySelector('#hormozi-stage-sel')?.addEventListener('change', e => {
      STATE.setHormoziStage(ventureId, parseInt(e.target.value));
      renderVentureView(panel, ventureId); /* re-render to update stage timeline */
    });

    /* ── Notes autosave (600ms debounce → STATE → IDB) ── */
    const notesEl = panel.querySelector('#ventureNotes');
    let notesTimer;
    notesEl?.addEventListener('input', () => {
      clearTimeout(notesTimer);
      notesTimer = setTimeout(() => STATE.updateVenture(ventureId, { notes: notesEl.value }), 600);
    });

    /* ── Stage timeline ── */
    const tl = document.getElementById('stageTimeline');
    if (tl) {
      STAGES.forEach((s, i) => {
        const div = document.createElement('div');
        const cls = i < v.hormozi_stage ? 'completed' : i === v.hormozi_stage ? 'current' : '';
        div.className = `stage-step ${cls}`;
        div.innerHTML = `<div class="stage-node">${s.num}</div><div class="stage-name">${s.name}</div>`;
        div.title = s.sub;
        div.style.cursor = 'pointer';
        div.addEventListener('click', () => {
          document.getElementById('stageDetail').innerHTML = `
            <div style="font-family:'Rajdhani',sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:var(--accent);margin-bottom:5px">Stage ${s.num} — ${s.name}</div>
            <div style="font-size:13px;color:rgba(226,234,242,0.82);line-height:1.6">${s.sub}</div>`;
        });
        tl.appendChild(div);
      });
    }

    /* ── Add blueprint ── */
    panel.querySelector('#addBpBtn')?.addEventListener('click', () => {
      const sel   = panel.querySelector('#addBpSel');
      const tplId = sel.value;
      if (!tplId) return;
      const newId = STATE.addBlueprint(ventureId, tplId);
      STATE.data.business.activeBlueprintId = newId;
      renderVentureView(panel, ventureId);
    });

    /* ── Blueprint tabs ── */
    if (v.blueprints.length > 0) {
      panel.querySelectorAll('[data-bpid]').forEach(btn => {
        btn.addEventListener('click', () => {
          STATE.data.business.activeBlueprintId = btn.dataset.bpid;
          activeBpId = btn.dataset.bpid;
          panel.querySelectorAll('[data-bpid]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          renderBlueprintDetail(document.getElementById('bpDetail'), ventureId, activeBpId);
        });
      });
      if (activeBpId) renderBlueprintDetail(document.getElementById('bpDetail'), ventureId, activeBpId);
    }
  }

  /* ══════════════════════════════════════════════════════════════
     BLUEPRINT STEP LIST
     Each step shows template description, key actions, notes textarea,
     and a checkmark to toggle completion.
     All writes go through STATE → IDB via completeStep() / setStepNotes().
  ══════════════════════════════════════════════════════════════ */
  function renderBlueprintDetail(container, ventureId, blueprintId) {
    const v  = ventures().find(v => v.id === ventureId);
    const bp = v?.blueprints.find(b => b.id === blueprintId);
    if (!bp) return;

    const tpl       = (APP_DATA.blueprintTemplates || []).find(t => t.id === bp.templateId);
    const doneCount = bp.steps.filter(s => s.completed).length;
    const pct       = bp.steps.length ? Math.round((doneCount / bp.steps.length) * 100) : 0;

    container.innerHTML = `
      <div class="card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div class="card-title">${bp.name}</div>
            ${tpl ? `<div style="font-size:11px;color:var(--muted);margin-top:2px">${tpl.description}</div>` : ''}
          </div>
          <span class="badge badge-accent">${doneCount}/${bp.steps.length} · ${pct}%</span>
        </div>
        <div class="card-body" style="padding:8px 0">
          <div class="progress-track" style="margin:0 16px 16px"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div id="stepList"></div>
        </div>
      </div>`;

    const stepList = container.querySelector('#stepList');
    bp.steps.forEach((step, idx) => {
      const tplStep = tpl?.steps[idx] || {};
      const row     = document.createElement('div');
      row.className = 'bp-step-row' + (step.completed ? ' done' : '');
      row.innerHTML = `
        <div class="bp-step-check${step.completed ? ' checked' : ''}" data-step="${idx}" title="Toggle complete"></div>
        <div class="bp-step-content">
          <div class="bp-step-name">${tplStep.name || 'Step ' + (idx + 1)}</div>
          ${tplStep.description ? `<div class="bp-step-desc">${tplStep.description}</div>` : ''}
          ${tplStep.keyActions?.length ? `
            <div class="bp-step-actions">
              ${tplStep.keyActions.map(a => `<div class="bp-step-action">→ ${a}</div>`).join('')}
            </div>` : ''}
          <textarea class="bp-step-notes" data-step="${idx}" placeholder="Notes for this step…">${step.notes || ''}</textarea>
          ${step.completedAt ? `<div class="bp-step-date">Completed ${new Date(step.completedAt).toLocaleDateString()}</div>` : ''}
        </div>`;

      /* Toggle step completion → STATE.completeStep → IDB */
      row.querySelector('.bp-step-check').addEventListener('click', () => {
        STATE.completeStep(ventureId, blueprintId, idx, !step.completed);
        renderBlueprintDetail(container, ventureId, blueprintId);
      });

      /* Notes autosave → STATE.setStepNotes → IDB */
      const notesEl = row.querySelector('.bp-step-notes');
      let t;
      notesEl.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => STATE.setStepNotes(ventureId, blueprintId, idx, notesEl.value), 600);
      });

      stepList.appendChild(row);
    });
  }

  /* ══════════════════════════════════════════════════════════════
     NEW VENTURE FORM
  ══════════════════════════════════════════════════════════════ */
  function renderNewVentureForm(panel) {
    const TEMPLATES = APP_DATA.blueprintTemplates || [];
    panel.innerHTML = `
      <div class="card">
        <div class="card-header"><div class="card-title">Create New Venture</div></div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-field">
              <label class="form-label">Venture Name</label>
              <input class="form-input" id="nvName" type="text" placeholder="e.g. Envosta, Side Project…" />
            </div>
            <div class="form-field" style="max-width:80px">
              <label class="form-label">Icon</label>
              <input class="form-input" id="nvIcon" type="text" placeholder="🚀" maxlength="4" />
            </div>
          </div>
          <div class="form-field" style="margin-top:12px">
            <label class="form-label">Description</label>
            <input class="form-input" id="nvDesc" type="text" placeholder="One line — what does this venture do?" />
          </div>
          <div class="form-field" style="margin-top:12px">
            <label class="form-label">Starting Blueprints</label>
            <div id="bpCheckboxes" style="display:flex;flex-direction:column;gap:8px;margin-top:6px">
              ${TEMPLATES.map(t => `
                <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer">
                  <input type="checkbox" value="${t.id}" style="margin-top:3px;accent-color:var(--accent)" />
                  <div>
                    <div style="font-size:13px;font-weight:500">${t.name}</div>
                    <div style="font-size:11px;color:var(--muted)">${t.description}</div>
                  </div>
                </label>`).join('')}
            </div>
          </div>
          <!-- Board type picker -->
          <div style="margin-top:20px">
            <label class="form-label" style="margin-bottom:10px;display:block">Board Type</label>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px" id="boardTypePicker">
              <div class="bp-card" data-bt="saas" style="padding:14px;border-radius:10px;border:1px solid var(--accent);background:rgba(124,106,247,0.08);cursor:pointer">
                <div style="font-size:20px;margin-bottom:6px">⚡</div>
                <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;margin-bottom:2px">SaaS</div>
                <div style="font-size:11px;color:var(--muted);line-height:1.4">Software · Subscription · Digital product</div>
              </div>
              <div class="bp-card" data-bt="product" style="padding:14px;border-radius:10px;border:1px solid var(--border);cursor:pointer">
                <div style="font-size:20px;margin-bottom:6px">📦</div>
                <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;margin-bottom:2px">Product</div>
                <div style="font-size:11px;color:var(--muted);line-height:1.4">Physical goods · E-commerce · Manufacturing</div>
              </div>
              <div class="bp-card" data-bt="service" style="padding:14px;border-radius:10px;border:1px solid var(--border);cursor:pointer">
                <div style="font-size:20px;margin-bottom:6px">🤝</div>
                <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;margin-bottom:2px">Service</div>
                <div style="font-size:11px;color:var(--muted);line-height:1.4">Agency · Consulting · Freelance</div>
              </div>
            </div>
          </div>

          <button class="phase-btn active" id="createVenture" style="margin-top:20px;padding:10px 24px;font-size:14px">Create Venture</button>
          <div id="nvError" style="color:var(--danger);font-size:12px;margin-top:8px;display:none"></div>
        </div>
      </div>`;

    /* Board type card picker wiring */
    panel.querySelectorAll('.bp-card[data-bt]').forEach(c => {
      c.addEventListener('click', () => {
        panel.querySelectorAll('.bp-card[data-bt]').forEach(x => {
          x.style.borderColor = 'var(--border)';
          x.style.background  = '';
        });
        c.style.borderColor = 'var(--accent)';
        c.style.background  = 'rgba(124,106,247,0.08)';
      });
    });

    panel.querySelector('#createVenture').addEventListener('click', () => {
      const name  = panel.querySelector('#nvName').value.trim();
      const icon  = panel.querySelector('#nvIcon').value.trim() || '🚀';
      const desc  = panel.querySelector('#nvDesc').value.trim();
      const errEl = panel.querySelector('#nvError');
      if (!name) { errEl.textContent = 'Venture name is required.'; errEl.style.display = 'block'; return; }
      errEl.style.display = 'none';

      /* STATE.addVenture → ventures[] → IDB */
      const boardType = panel.querySelector('.bp-card[data-bt][style*="var(--accent)"]')?.dataset?.bt || 'saas';
      const newId = STATE.addVenture(name, icon, desc, boardType);

      /* Attach selected blueprints */
      panel.querySelectorAll('#bpCheckboxes input:checked').forEach(cb => {
        STATE.addBlueprint(newId, cb.value);
      });

      /* Switch to the new venture's view */
      activeVentureId = newId;
      showingNew      = false;
      buildVentureTabs();
      renderPanel();
    });
  }

  /* ── Initial render ── */
  /* Resolve active venture (use stored or default to first) */
  activeVentureId = biz().activeVentureId || ventures()[0]?.id || null;
  if (!ventures().find(v => v.id === activeVentureId)) {
    activeVentureId = ventures()[0]?.id || null;
  }
  buildVentureTabs();
  renderPanel();
});
