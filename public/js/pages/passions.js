/**
 * KOLTYN OS — passions/page.js
 * Multi-passion tracker with blueprint boards and stackable sub-blueprints.
 */

window.registerPage('passions', function initPassions() {

  /* ── Blueprint definitions (main board types) ── */
  const PASSION_BLUEPRINTS = [
    {
      id:   'guitar',
      icon: '🎸',
      name: 'Guitar',
      desc: 'Technique areas, practice sessions & skill tracking',
      focusAreas: [
        { title: 'Chord Transitions',  body: 'Smooth, muted-free changes between open and barre chords. Start slow with a metronome — speed comes from clean reps, not rushed practice.' },
        { title: 'Scale Runs',         body: 'Major, minor pentatonic, and blues scale positions. Know all five CAGED shapes across the neck before moving to exotic scales.' },
        { title: 'Fingerpicking',      body: 'Thumb carries bass strings (E, A, D). Fingers handle G, B, e. Practice Travis picking patterns until they\'re muscle memory.' },
        { title: 'Barre Chords',       body: 'Finger placement directly behind fret, thumb parallel to index. F and Bm first — these unlock the whole neck.' },
        { title: 'Lead Playing',       body: 'String bending in tune, vibrato with purpose, and phrasing with space. Less notes, more feel — every note should mean something.' },
        { title: 'Rhythm & Timing',    body: 'Play to a click. Record yourself. Solid rhythm is worth more than flashy technique — it\'s what other musicians feel first.' },
      ],
    },
    {
      id:   'vocals',
      icon: '🎤',
      name: 'Vocals',
      desc: 'Warm-up routines, range development & performance',
      focusAreas: [
        { title: 'Warm-Up',            body: 'Lip trills, humming, and light scales before every session. Cold vocals strain faster. 5–10 minutes prevents months of damage.' },
        { title: 'Breath Control',     body: 'Diaphragmatic breathing — fill from the belly, not the chest. Support every phrase from the core. Posture directly affects airflow.' },
        { title: 'Pitch Accuracy',     body: 'Use a piano or pitch app to check yourself honestly. Record and listen back. Ear training and singing are equally important.' },
        { title: 'Range Extension',    body: 'Expand slowly at the edges of your range — never force it. Mix voice and falsetto bridges are where most range development happens.' },
        { title: 'Tone & Resonance',   body: 'Experiment with placement — chest, mask, head. Forward placement generally cuts through a mix better than a dark, swallowed tone.' },
        { title: 'Performance',        body: 'Own the silence between phrases. Emotion first, technique second. The audience feels your conviction more than your perfect pitch.' },
      ],
    },
    {
      id:   'snowboarding',
      icon: '🏂',
      name: 'Snowboarding',
      desc: 'Technique progression from basics to advanced riding',
      focusAreas: [
        { title: 'Stance & Balance',   body: 'Regular vs. goofy — lead with your dominant foot. Neutral athletic stance, knees soft, weight centered over the board at all times.' },
        { title: 'Heel & Toe Turns',   body: 'Edge-to-edge transitions are the foundation of all riding. Dig heel edge to turn left (goofy) or right (regular). Commit to the edge.' },
        { title: 'Carving',            body: 'Angulate your body into the hill — don\'t lean. High edge angle + forward pressure = a carved arc with no skidding. Speed is your friend.' },
        { title: 'Speed Control',      body: 'Hockey stops, skidded turns, and controlled edge releases. Speed management saves lives — nail it before chasing terrain parks.' },
        { title: 'Jumps & Park',       body: 'Approach speed, pop timing, body position in the air, spotting the landing. Start on small rollers before hitting kickers or boxes.' },
        { title: 'Off-Piste & Powder', body: 'Lean back slightly, wider stance, more dynamic movement. Powder rewards riders who stay relaxed and let the board float.' },
      ],
    },
    {
      id:   'skiing',
      icon: '⛷️',
      name: 'Skiing',
      desc: 'From parallel turns to carving and off-piste mastery',
      focusAreas: [
        { title: 'Stance & Alignment', body: 'Athletic stance with slight forward shin pressure on boots. Poles parallel to slope, hands visible in peripheral vision at all times.' },
        { title: 'Parallel Turns',     body: 'Weight transfer from ski to ski drives the turn. Both skis carve the same radius. Keep upper body facing downhill — separate upper and lower body.' },
        { title: 'Carving',            body: 'Tip the skis on edge and let them do the work. Angulate — bring hip into the hill. High edge angle + proper pressure = zero skid, pure carve.' },
        { title: 'Moguls',             body: 'Absorb with legs, not body. Pole plants set rhythm. Eyes look 2–3 moguls ahead. Start slow on small bumps — rhythm first, speed second.' },
        { title: 'Off-Piste & Powder', body: 'Slightly wider stance, equal weight on both skis, rhythmic up-and-down movement. Don\'t fight the snow — let the skis float and rebound.' },
        { title: 'Jumping & Park',     body: 'Approach speed matters — too slow is more dangerous than too fast. Pop off the lip with both legs equally. Spot landing early and absorb.' },
      ],
    },
    {
      id:   'songwriting',
      icon: '🎵',
      name: 'Songwriting',
      desc: 'Songs, setlist, practice routine & performance',
      focusAreas: null, // uses the rich music view
    },
    {
      id:   'general',
      icon: '✦',
      name: 'General',
      desc: 'Flexible board with notes, goals & journal',
      focusAreas: null,
    },
  ];

  /* ── Sub-blueprint templates (from data.js) ── */
  const SUB_BLUEPRINTS = APP_DATA.passionBlueprintTemplates || [];

  /* ── Shorthand refs ── */
  const pas      = () => STATE.data.passions;
  const passions = () => pas().passions;

  /* ── Build shell HTML ── */
  const inner = document.getElementById('passions-inner');
  inner.innerHTML = `
    ${buildPageHeader('Music · Horses · Snow · Outdoors', 'Passions', 'Life',
      'Your pursuits outside of work — track what you love.',
    )}
    <div id="passionPanel"></div>`;

  /* ══════════════════════════════════════════════════════════════
     TABS
  ══════════════════════════════════════════════════════════════ */
  let activePassionId = null;
  let showingNew      = false;

  function buildPassionTabs() {
    const tabs = [
      ...passions().map(p => ({ id: p.id, label: p.icon + ' ' + p.name })),
      { id: '__new__', label: '+ New Passion' },
    ];
    const activeId = showingNew ? '__new__' : (activePassionId || '__new__');
    setPageTabs(inner, tabs, activeId, id => {
      if (id === '__new__') {
        showingNew = true;
        activePassionId = null;
      } else {
        showingNew = false;
        activePassionId = id;
        STATE.data.passions.activePassionId = id;
        STATE.save();
      }
      buildPassionTabs();
      renderPanel();
    });
  }

  function renderPanel() {
    const panel = document.getElementById('passionPanel');
    if (showingNew) {
      renderNewPassionForm(panel);
    } else if (activePassionId) {
      renderPassionView(panel, activePassionId);
    } else if (passions().length > 0) {
      activePassionId = passions()[0].id;
      renderPassionView(panel, activePassionId);
    } else {
      panel.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align:center;padding:48px">
            <div style="font-size:32px;margin-bottom:12px">✦</div>
            <div style="font-size:15px;font-weight:600;margin-bottom:6px">No passions yet</div>
            <div style="font-size:13px;color:var(--muted)">Click "+ New Passion" to add what you love.</div>
          </div>
        </div>`;
    }
  }

  /* ══════════════════════════════════════════════════════════════
     DISPATCH
  ══════════════════════════════════════════════════════════════ */
  function renderPassionView(panel, passionId) {
    const p = passions().find(p => p.id === passionId);
    if (!p) { panel.innerHTML = ''; return; }
    const bt = p.blueprintType || 'general';
    if (bt === 'music' || bt === 'songwriting') {
      renderMusicView(panel, p);
    } else if (bt === 'general') {
      renderGenericView(panel, p);
    } else {
      renderFocusView(panel, p);
    }
  }

  /* ══════════════════════════════════════════════════════════════
     MUSIC / SONGWRITING BOARD
  ══════════════════════════════════════════════════════════════ */
  function renderMusicView(panel, p) {
    const SONGS         = APP_DATA.creative.songs;
    const SETLIST       = APP_DATA.creative.setlist;
    const PRACTICE      = APP_DATA.creative.practice;
    const WRITING_GOALS = APP_DATA.creative.writingGoals;

    panel.innerHTML = `
      <div class="card" style="margin-bottom:16px">
        <div class="card-header" style="display:flex;align-items:center;gap:14px">
          <span style="font-size:36px;line-height:1">${p.icon}</span>
          <div style="flex:1">
            <div style="font-family:'Rajdhani',sans-serif;font-size:22px;font-weight:700">${p.name}</div>
            <div style="font-size:12px;color:var(--muted)">${p.description || 'Guitar · Songwriting · Performance'}</div>
          </div>
        </div>
        <div class="card-body" style="padding-top:0">
          <textarea class="venture-notes-input" id="passionNotes" placeholder="Quick notes — what's clicking, what needs work…" style="min-height:60px">${p.notes || ''}</textarea>
        </div>
      </div>

      <div class="day-tabs" id="passionSubTabs" style="margin-bottom:20px;flex-wrap:wrap">
        <button class="day-tab active" data-subtab="overview">Overview</button>
        <button class="day-tab" data-subtab="drills">💪 Muscle Memory</button>
        <button class="day-tab" data-subtab="theory">🧠 Mind Map</button>
      </div>

      <div id="subtab-overview">
        <div class="grid-4" id="musicStats"></div>
        <div class="grid-2">
          <div class="card">
            <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
              <div class="card-title">Active Setlist — 30 Min Bar Set</div>
              <span class="badge badge-accent">${SETLIST.length} songs</span>
            </div>
            <div class="card-body" style="padding:0"><div id="setlistContainer"></div></div>
          </div>
          <div class="card">
            <div class="card-header"><div class="card-title">Practice Routine</div></div>
            <div class="card-body" style="padding:8px 14px"><div id="practiceContainer"></div></div>
          </div>
        </div>
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
            <div class="section-label" style="margin-bottom:0">Song Library</div>
            <div style="display:flex;gap:8px">
              <button class="day-tab active" data-filter="all">All</button>
              <button class="day-tab" data-filter="ready">Ready</button>
              <button class="day-tab" data-filter="learning">Learning</button>
              <button class="day-tab" data-filter="original">Originals</button>
            </div>
          </div>
          <div class="grid-3" id="songGrid"></div>
        </div>
        <div class="grid-2">
          <div class="card">
            <div class="card-header"><div class="card-title">Progress Toward Goals</div></div>
            <div class="card-body" id="writingGoals"></div>
          </div>
          <div class="card">
            <div class="card-header"><div class="card-title">Performance Notes</div></div>
            <div class="card-body">
              ${[
                ['Stage Presence',    'Move between songs with brief stories. Don\'t just play — connect. 1 sentence per song intro.'],
                ['Tuning',            'Always tune before hitting the stage, even if you just tuned backstage. Audience notices.'],
                ['Set Energy Arc',    'Open with a known crowd song, build to a quiet emotional moment mid-set, finish huge.'],
                ['Originals Strategy','Introduce originals as "a song I wrote" — brief, confident, no apologising. Then play it.'],
                ['Handling Requests', 'Keep a mental list of 3 unplanned songs you can pull out. Confidence matters more than perfection.'],
              ].map(([t,b])=>`
                <div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.04)">
                  <div style="font-family:'Rajdhani',sans-serif;font-size:12px;font-weight:700;color:var(--accent);margin-bottom:3px">${t}</div>
                  <div style="font-size:12px;color:rgba(226,234,242,0.72);line-height:1.55">${b}</div>
                </div>`).join('')}
            </div>
          </div>
        </div>
        ${renderSubBlueprintsHTML(p)}
      </div>

      <div id="subtab-drills" style="display:none">
        ${renderDrillsSection(p.blueprintType)}
      </div>

      <div id="subtab-theory" style="display:none">
        ${renderMindmapSection(p.blueprintType)}
      </div>`;

    wireSubTabs(panel);

    const notesEl = panel.querySelector('#passionNotes');
    let notesTimer;
    notesEl?.addEventListener('input', () => {
      clearTimeout(notesTimer);
      notesTimer = setTimeout(() => STATE.updatePassion(p.id, { notes: notesEl.value }), 600);
    });

    const statsEl = panel.querySelector('#musicStats');
    [
      { label: 'Songs Ready',  value: SONGS.filter(s=>s.status==='ready').length },
      { label: 'Learning',     value: SONGS.filter(s=>s.status==='learning').length },
      { label: 'Originals',    value: SONGS.filter(s=>s.status==='original').length },
      { label: 'Set Length',   value: '30', unit: 'min' },
    ].forEach(s => {
      statsEl.innerHTML += `
        <div class="stat-card">
          <div class="stat-label">${s.label}</div>
          <div style="display:flex;align-items:baseline;gap:3px">
            <span class="stat-value">${s.value}</span>
            ${s.unit ? `<span class="stat-unit">${s.unit}</span>` : ''}
          </div>
        </div>`;
    });

    const setlistEl = panel.querySelector('#setlistContainer');
    SETLIST.forEach((slot, i) => {
      setlistEl.innerHTML += `
        <div class="setlist-slot">
          <div class="setlist-num">${i+1}</div>
          <div>
            <div class="setlist-song">${slot.song}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:1px">${slot.notes}</div>
          </div>
          <div class="setlist-key">Key of ${slot.key}</div>
        </div>`;
    });

    const practiceEl = panel.querySelector('#practiceContainer');
    PRACTICE.forEach(pr => {
      practiceEl.innerHTML += `
        <div class="practice-item">
          <div class="practice-icon">${pr.icon}</div>
          <div class="practice-content">
            <div class="practice-title">${pr.title}
              <span class="badge badge-${pr.priority==='high'?'warn':pr.priority==='medium'?'accent':'muted'}" style="margin-left:6px">${pr.priority}</span>
            </div>
            <div class="practice-detail">${pr.detail}</div>
          </div>
        </div>`;
    });

    let currentFilter = 'all';
    function renderSongs() {
      const grid = panel.querySelector('#songGrid');
      const list = currentFilter === 'all' ? SONGS : SONGS.filter(s => s.status === currentFilter);
      grid.innerHTML = '';
      list.forEach(song => {
        grid.innerHTML += `
          <div class="song-card ${song.status === 'original' ? 'performing' : ''}">
            <div class="song-header">
              <div>
                <div class="song-title">${song.title}</div>
                <div style="font-size:11px;color:var(--muted);margin-top:1px">${song.artist}</div>
              </div>
              <span class="song-status ${song.status}">${song.status === 'original' ? 'Original' : song.status}</span>
            </div>
            <div class="song-meta">
              <span class="song-tag">Key of ${song.key}</span>
              ${song.tags.map(t=>`<span class="song-tag">${t}</span>`).join('')}
            </div>
          </div>`;
      });
    }
    panel.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter;
        panel.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderSongs();
      });
    });
    renderSongs();

    const goalsEl = panel.querySelector('#writingGoals');
    WRITING_GOALS.forEach(g => {
      const pct = g.target ? Math.round((g.current / g.target) * 100) : 0;
      goalsEl.innerHTML += `
        <div style="margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px">
            <span style="font-size:13px;font-weight:500">${g.label}</span>
            <span style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;color:var(--accent)">${g.current} <span style="color:var(--muted);font-weight:400">/ ${g.target} ${g.unit}</span></span>
          </div>
          <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>`;
    });

    wireSubBlueprintSection(panel, p, () => renderMusicView(panel, passions().find(pp => pp.id === p.id)));
  }

  /* ══════════════════════════════════════════════════════════════
     FOCUS BOARD — Guitar, Vocals, Snowboarding, Skiing
  ══════════════════════════════════════════════════════════════ */
  function renderFocusView(panel, p) {
    const bp = PASSION_BLUEPRINTS.find(b => b.id === p.blueprintType);
    const fmtDate = iso => new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});

    panel.innerHTML = `
      <div class="card" style="margin-bottom:16px">
        <div class="card-header" style="display:flex;align-items:center;gap:14px">
          <span style="font-size:36px;line-height:1">${p.icon}</span>
          <div style="flex:1">
            <div style="font-family:'Rajdhani',sans-serif;font-size:22px;font-weight:700">${p.name}</div>
            <div style="font-size:12px;color:var(--muted)">${p.description || bp?.desc || ''}</div>
          </div>
        </div>
        <div class="card-body" style="padding-top:0">
          <textarea class="venture-notes-input" id="passionNotes" placeholder="What are you working on, what's clicking, what needs more reps…" style="min-height:60px">${p.notes || ''}</textarea>
        </div>
      </div>

      <div class="day-tabs" id="passionSubTabs" style="margin-bottom:20px;flex-wrap:wrap">
        <button class="day-tab active" data-subtab="overview">Overview</button>
        <button class="day-tab" data-subtab="drills">💪 Muscle Memory</button>
        <button class="day-tab" data-subtab="theory">🧠 Mind Map</button>
      </div>

      <div id="subtab-overview">
        ${bp?.focusAreas?.length ? `
        <div class="section-label" style="margin-bottom:14px">Focus Areas</div>
        <div class="grid-2" style="margin-bottom:24px">
          ${bp.focusAreas.map(f => `
            <div style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
              <div style="font-family:'Rajdhani',sans-serif;font-size:12px;font-weight:700;color:var(--accent);margin-bottom:3px">${f.title}</div>
              <div style="font-size:12px;color:rgba(226,234,242,0.72);line-height:1.55">${f.body}</div>
            </div>`).join('')}
        </div>` : ''}

        <div class="card" style="margin-bottom:16px">
          <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
            <div class="card-title">Goals</div>
            <button class="day-tab" id="showAddGoalBtn" style="font-size:11px;padding:4px 12px">+ Add Goal</button>
          </div>
          <div class="card-body">
            <div id="addGoalForm" style="display:none;margin-bottom:20px;padding:14px;background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid var(--border)">
              <div style="display:grid;grid-template-columns:1fr 80px 80px;gap:10px;margin-bottom:10px">
                <div>
                  <div class="form-label" style="margin-bottom:3px">Goal</div>
                  <input class="form-input" id="newGoalLabel" placeholder="e.g. Land a clean backside 180" />
                </div>
                <div>
                  <div class="form-label" style="margin-bottom:3px">Target</div>
                  <input class="form-input" id="newGoalTarget" type="number" placeholder="10" style="text-align:right" />
                </div>
                <div>
                  <div class="form-label" style="margin-bottom:3px">Unit</div>
                  <input class="form-input" id="newGoalUnit" placeholder="sessions" />
                </div>
              </div>
              <div style="display:flex;gap:8px">
                <button class="day-tab active" id="saveGoalBtn" style="font-size:12px;padding:6px 18px">Save</button>
                <button class="day-tab" id="cancelGoalBtn" style="font-size:12px;padding:6px 18px">Cancel</button>
              </div>
            </div>
            <div id="goalsList">${renderGoalsHTML(p)}</div>
          </div>
        </div>

        <div class="card" style="margin-bottom:16px">
          <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
            <div class="card-title">Practice Log</div>
            <span style="font-size:11px;color:var(--muted)">${(p.journal || []).length} entries</span>
          </div>
          <div class="card-body">
            <div style="margin-bottom:20px">
              <textarea class="venture-notes-input" id="newJournalEntry" placeholder="What did you practice today? What clicked, what needs more work…" style="min-height:72px"></textarea>
              <button class="day-tab active" id="addJournalEntryBtn" style="margin-top:8px;font-size:12px;padding:6px 18px">Log Session</button>
            </div>
            <div id="journalEntries">${renderJournalHTML(p, fmtDate)}</div>
          </div>
        </div>

        ${renderSubBlueprintsHTML(p)}
      </div>

      <div id="subtab-drills" style="display:none">
        ${renderDrillsSection(p.blueprintType)}
      </div>

      <div id="subtab-theory" style="display:none">
        ${renderMindmapSection(p.blueprintType)}
      </div>`;

    wireSubTabs(panel);
    wireNotesGoalsJournal(panel, p, () => renderFocusView(panel, passions().find(pp => pp.id === p.id)));
    wireSubBlueprintSection(panel, p, () => renderFocusView(panel, passions().find(pp => pp.id === p.id)));
  }

  /* ══════════════════════════════════════════════════════════════
     GENERIC BOARD
  ══════════════════════════════════════════════════════════════ */
  function renderGenericView(panel, p) {
    const fmtDate = iso => new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});

    panel.innerHTML = `
      <div class="card" style="margin-bottom:16px">
        <div class="card-header" style="display:flex;align-items:center;gap:14px">
          <span style="font-size:36px;line-height:1">${p.icon}</span>
          <div style="flex:1">
            <div style="font-family:'Rajdhani',sans-serif;font-size:22px;font-weight:700">${p.name}</div>
            <div style="font-size:12px;color:var(--muted)">${p.description || 'Your passion — track what matters.'}</div>
          </div>
        </div>
        <div class="card-body" style="padding-top:0">
          <textarea class="venture-notes-input" id="passionNotes" placeholder="What's inspiring you, what are you working on, key moments…" style="min-height:60px">${p.notes || ''}</textarea>
        </div>
      </div>

      <div class="day-tabs" id="passionSubTabs" style="margin-bottom:20px;flex-wrap:wrap">
        <button class="day-tab active" data-subtab="overview">Overview</button>
        <button class="day-tab" data-subtab="drills">💪 Muscle Memory</button>
        <button class="day-tab" data-subtab="theory">🧠 Mind Map</button>
      </div>

      <div id="subtab-overview">
        <div class="card" style="margin-bottom:16px">
          <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
            <div class="card-title">Goals</div>
            <button class="day-tab" id="showAddGoalBtn" style="font-size:11px;padding:4px 12px">+ Add Goal</button>
          </div>
          <div class="card-body">
            <div id="addGoalForm" style="display:none;margin-bottom:20px;padding:14px;background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid var(--border)">
              <div style="display:grid;grid-template-columns:1fr 80px 80px;gap:10px;margin-bottom:10px">
                <div>
                  <div class="form-label" style="margin-bottom:3px">Goal</div>
                  <input class="form-input" id="newGoalLabel" placeholder="e.g. Ride 3x / week" />
                </div>
                <div>
                  <div class="form-label" style="margin-bottom:3px">Target</div>
                  <input class="form-input" id="newGoalTarget" type="number" placeholder="e.g. 3" style="text-align:right" />
                </div>
                <div>
                  <div class="form-label" style="margin-bottom:3px">Unit</div>
                  <input class="form-input" id="newGoalUnit" placeholder="rides" />
                </div>
              </div>
              <div style="display:flex;gap:8px">
                <button class="day-tab active" id="saveGoalBtn" style="font-size:12px;padding:6px 18px">Save</button>
                <button class="day-tab" id="cancelGoalBtn" style="font-size:12px;padding:6px 18px">Cancel</button>
              </div>
            </div>
            <div id="goalsList">${renderGoalsHTML(p)}</div>
          </div>
        </div>

        <div class="card" style="margin-bottom:16px">
          <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
            <div class="card-title">Journal</div>
            <span style="font-size:11px;color:var(--muted)">${(p.journal || []).length} entries</span>
          </div>
          <div class="card-body">
            <div style="margin-bottom:20px">
              <textarea class="venture-notes-input" id="newJournalEntry" placeholder="What happened today with ${p.name}? Highlights, milestones, thoughts…" style="min-height:72px"></textarea>
              <button class="day-tab active" id="addJournalEntryBtn" style="margin-top:8px;font-size:12px;padding:6px 18px">Add Entry</button>
            </div>
            <div id="journalEntries">${renderJournalHTML(p, fmtDate)}</div>
          </div>
        </div>

        ${renderSubBlueprintsHTML(p)}
      </div>

      <div id="subtab-drills" style="display:none">
        ${renderDrillsSection(p.blueprintType)}
      </div>

      <div id="subtab-theory" style="display:none">
        ${renderMindmapSection(p.blueprintType)}
      </div>`;

    wireSubTabs(panel);
    wireNotesGoalsJournal(panel, p, () => renderGenericView(panel, passions().find(pp => pp.id === p.id)));
    wireSubBlueprintSection(panel, p, () => renderGenericView(panel, passions().find(pp => pp.id === p.id)));
  }

  /* ── Sub-tab switcher (Overview / Muscle Memory / Mind Map) ── */
  function wireSubTabs(panel) {
    const tabs = ['overview', 'drills', 'theory'];
    panel.querySelectorAll('#passionSubTabs [data-subtab]').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('#passionSubTabs [data-subtab]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        tabs.forEach(t => {
          const el = panel.querySelector(`#subtab-${t}`);
          if (el) el.style.display = t === btn.dataset.subtab ? 'block' : 'none';
        });
      });
    });
  }

  /* ══════════════════════════════════════════════════════════════
     DRILLS SECTION — muscle memory repetition drills per blueprint
  ══════════════════════════════════════════════════════════════ */
  function renderDrillsSection(blueprintType) {
    const drillData = {
      guitar: {
        title: 'Guitar',
        groups: [
          {
            category: 'Warm-Up & Dexterity',
            drills: [
              { name: 'Chromatic Crawl', reps: '5 min', desc: 'One finger per fret, 4 strings ascending and descending. Start at fret 5, move down to fret 1 as fingers loosen. Use a metronome — begin slow, increase BPM each pass.', why: 'Synchronises both hands before anything else. Finger independence and pick/pluck coordination.' },
              { name: '1-2-3-4 Spider Walk', reps: '4 min', desc: 'All four fingers across all six strings in sequence (1234, 1243, 1324, 1342…). Alternate the permutation each day. Never rush — clean is the only goal.', why: 'Builds fretting-hand independence between ring finger and pinky — the weakest pair for almost every guitarist.' },
            ],
          },
          {
            category: 'Chord Transitions',
            drills: [
              { name: 'Slow Chord Change Loop', reps: '3 × 2 min', desc: 'Pick two chords (G→C, D→Bm, F→C, etc.). Hold each chord for 4 beats, switch, hold, switch. Slow enough that every note rings clean. Speed up only when muted strings are gone.', why: 'Muscle memory for the exact finger movements required — not about speed yet.' },
              { name: 'One-Minute Changes', reps: '1 min per pair', desc: 'Set a timer for 60 seconds. Count every clean chord change between two chords. Log your number. Beat it next session. Use G→Em, D→A, F→C, Bm→G.', why: 'Gamified drill that directly builds speed of chord transitions through measurement and improvement pressure.' },
              { name: 'Barre Chord Slides', reps: '4 min', desc: 'Hold an F major barre shape. Slide it to G, A, B, C up the neck without lifting. Each position: strum, confirm all notes ring, then slide. Come back down.', why: 'Trains the barre chord shape to be portable and automatic — the barre chord isn\'t a chord, it\'s a moveable key.' },
            ],
          },
          {
            category: 'Scale & Lead',
            drills: [
              { name: 'Pentatonic Box Drill', reps: '5 min', desc: 'Play the minor pentatonic box (position 1) ascending and descending to a click. When clean: add bends on the 3rd and 7th degrees. When that\'s clean: add vibrato on held notes.', why: 'Locks in the most used scale shape in all rock, country, and blues. Foundation of every improvisation.' },
              { name: 'Three-Note-Per-String Runs', reps: '3 min', desc: 'Major scale, three notes per string, from low E to high e and back. Alternate pick strictly. Start at 60 BPM and step up 5 BPM when you hit three clean passes in a row.', why: 'Builds picking speed and develops the muscle memory to navigate the full neck linearly.' },
              { name: 'String Bending Accuracy', reps: '3 min', desc: 'Bend the G string at the 7th fret up a whole step to match the pitch of the 9th fret. Use a tuner or reference pitch. Release slowly. Repeat 20 times. Move to B string.', why: 'Bends that aren\'t in tune kill feel. This drill hardwires pitch accuracy into every bend before it becomes a habit.' },
            ],
          },
          {
            category: 'Rhythm & Timing',
            drills: [
              { name: 'Metronome Strum Lock', reps: '5 min', desc: 'Set metronome to 70 BPM. Strum a single chord pattern (down-down-up-up-down-up) for 5 minutes without missing or rushing the click. Then mute the click and keep going for 1 min. Reconnect.', why: 'Internal clock development. Playing "to" a click is different from playing "with" one. This builds the latter.' },
              { name: 'Rhythm Pattern Library', reps: '2 min each', desc: 'Cycle through four strumming patterns: (1) straight 8ths, (2) 16th upstrokes, (3) syncopated push pattern, (4) Travis picking thumb pattern. Two minutes each to a click.', why: 'A rhythm guitarist who knows 5 patterns sounds limited. A guitarist with 20 internalized patterns sounds like they can play anything.' },
            ],
          },
        ],
      },

      vocals: {
        title: 'Vocals',
        groups: [
          {
            category: 'Warm-Up (Always First)',
            drills: [
              { name: 'Lip Trill Scales', reps: '3 min', desc: 'Trill the lips (like a motorboat sound) while sliding up and down through your range on a 5-note scale. Start mid-range, expand outward. If the trill stops, you\'re tensing — relax and try again.', why: 'Low-impact activation of the vocal cords without strain. Vibrates the lips to loosen the whole system before adding full voice.' },
              { name: 'Humming Resonance Hunt', reps: '2 min', desc: 'Hum on a comfortable mid pitch. Move the resonance around — feel it in your chest, then your nose, then your head. Try "hmm-mmm" while placing fingertips on each area to feel the vibration.', why: 'Trains you to consciously locate and shift resonance — the skill that underlies register blending and tone control.' },
              { name: 'Sirens', reps: '2 min', desc: 'On an "ng" or "wee" sound, glide smoothly from your lowest comfortable pitch to the top of your range and back. No breaks, no flipping — if a break happens, slow down and approach that spot gently.', why: 'Bridges the chest-to-head voice passaggio. The break is where most singers stall — sirens teach the cords to thin out gradually rather than flip suddenly.' },
            ],
          },
          {
            category: 'Breath & Support',
            drills: [
              { name: 'Sustained Hiss', reps: '5 × 30 sec', desc: 'Take a full diaphragmatic breath (belly and sides expand, not chest). Release it as a steady "sssss" hiss for as long as possible without pushing. Count seconds, beat your record each session.', why: 'Isolates the breath support mechanism from phonation. Longer = better diaphragm engagement. Short = chest breathing or pushing.' },
              { name: 'Staccato Breath Bursts', reps: '3 × 1 min', desc: 'Rapid "ha ha ha" sounds from the belly — like panting but controlled. Each "ha" should pulse from the core, not the throat. Keep the throat relaxed and open throughout.', why: 'Activates the fast-twitch breath muscle coordination needed for dynamic singing, quick phrase attacks, and staccato passages.' },
            ],
          },
          {
            category: 'Pitch & Ear Training',
            drills: [
              { name: 'Piano Match & Record', reps: '5 min', desc: 'Play a random note on piano or app. Sing it back. Record both on your phone. Listen back and check the match. Vary the register — low, mid, and high range. Log misses.', why: 'The ear-to-voice connection is a trainable skill. Recording removes the live-performance bias your brain applies to make you sound better than you are.' },
              { name: 'Interval Singing', reps: '5 min', desc: 'Pick a root note. Sing up a major 3rd, back, up a 5th, back, up an octave, back. Then try minor intervals. Use a reference pitch on piano. Name each interval as you sing it.', why: 'Interval recognition is the foundation of musical ear training. Knowing what a minor 7th sounds like means you can find it instantly in any key.' },
            ],
          },
          {
            category: 'Range & Tone Development',
            drills: [
              { name: 'Half-Step Climb', reps: '8 min', desc: 'Sing a 5-note major scale pattern on "ah" or "mah". Start in your lower-mid range. Move up a half step each time. Stop one half step before it feels strained. Do not push the top.', why: 'Systematic, safe range expansion. The goal is to find where relaxed singing lives — then gently move that ceiling upward each week.' },
              { name: 'Dynamics Ladder', reps: '3 min', desc: 'Pick one comfortable pitch. Sing it pp (barely audible) → mp → mf → forte → then back down. Full support at every dynamic. The soft should be supported, not breathy. The loud should be free, not pushed.', why: 'Dynamic control is the mark of a trained voice. Most untrained singers only have two volumes: quiet-and-breathy or loud-and-pushed. This builds the full range.' },
            ],
          },
        ],
      },

      snowboarding: {
        title: 'Snowboarding',
        groups: [
          {
            category: 'On-Snow Fundamentals',
            drills: [
              { name: 'Falling Leaf — Heel Edge', reps: '4 runs', desc: 'Stay on your heel edge the entire run. Slide sideways across the slope left, then right, then left — like a leaf falling from a tree. No toe-edge transitions. Focus on weight centering.', why: 'Builds confidence and control on the heel edge independently before combining with toe transitions. Reveals weight distribution problems immediately.' },
              { name: 'Falling Leaf — Toe Edge', reps: '4 runs', desc: 'Same as heel leaf but on toe edge — facing the slope. Traverse left and right while on toe edge only. Keep hips over the board, knees pressing into the hill.', why: 'Toe edge is harder for most riders. Isolation drilling builds the specific muscle memory and trust for the weaker edge.' },
              { name: 'Hockey Stop Reps', reps: '20 stops', desc: 'Pick up moderate speed on a groomed run. Choose a point and stop hard with a hockey stop — full edge dig, snow spray. Alternate heel and toe stops. Count 20 clean stops per session.', why: 'Knowing you can stop instantly removes fear and unlocks commitment to speed. The most important safety drill you can do.' },
            ],
          },
          {
            category: 'Turn Mechanics',
            drills: [
              { name: 'Garland Drill', reps: '3 runs', desc: 'Make partial turns — start from heel edge, turn toward toe edge but don\'t complete the turn; return to heel before completing. Like swinging a pendulum. No full turn direction changes yet.', why: 'Isolates the initiation phase of the turn. You\'re drilling the moment of transition without the full commitment of a direction change.' },
              { name: 'Linked Turn Counting', reps: '5 min', desc: 'Ride a groomed blue or green run making deliberate linked turns. Count each complete turn out loud. Focus on rhythm and equal timing left-to-right. Aim for 20 clean, identical turns in a row.', why: 'Rhythm is what separates intermediate from advanced. Counting forces conscious attention to turn timing and exposes asymmetry between heelside and toeside.' },
              { name: 'Slow Carve Progression', reps: '3 runs', desc: 'On a gentle groomed slope, make the slowest possible clean carved turns — high edge angle, zero skidding, two pencil lines in the snow. Slow speed forces balance and technique over momentum.', why: 'Carving at low speed is harder than carving at speed. It removes the crutch of momentum and demands pure technique.' },
            ],
          },
          {
            category: 'Advanced Repetition',
            drills: [
              { name: 'Powder Float Sessions', reps: 'Each powder day', desc: 'On any powder day, spend the first 30 minutes only on powder — not groomed. Weight back, relaxed, rhythmic. Don\'t rescue failed runs, analyse them: where did the nose dive? What tightened up?', why: 'Powder forces adaptive balance you can\'t fake. Every correction has to happen through feel, not sight. Builds proprioception faster than any other terrain.' },
              { name: 'Park Entry Approach Drill', reps: '10 approaches', desc: 'Ride toward a feature (box, small kicker) at consistent speed and stop before the feature. Focus only on approach line, speed control, and body position at takeoff point. Don\'t hit the feature yet.', why: 'Most park errors happen in the approach, not the air. Drilling approach-only removes the fear variable and builds consistency before adding complexity.' },
            ],
          },
        ],
      },

      skiing: {
        title: 'Skiing',
        groups: [
          {
            category: 'Stance & Warm-Up',
            drills: [
              { name: 'Javelin Turns', reps: '4 runs', desc: 'Lift the inside ski off the snow and hold it parallel, then make a full turn on the outside ski only. Stay balanced. Replace the inside ski. Repeat on both sides for a full run.', why: 'Forces correct outside ski loading immediately. If you can\'t balance on one ski through a turn, your weight is in the wrong place.' },
              { name: 'Pole Touch Drill', reps: '2 runs', desc: 'Exaggerate your pole plant — pole tip must touch the snow every single turn, planted forward and to the side. Focus purely on pole placement rhythm, not turn shape.', why: 'Pole timing drives turn initiation. Most skiers plant late or wide — this drill makes the correct timing automatic through exaggeration.' },
              { name: 'Straight Run Balance', reps: '5 min', desc: 'Find a gentle slope. Stand in athletic stance and run straight without turning. Try one-leg balance for 3-second holds each side. Experiment with shin pressure against boots.', why: 'Static balance calibration before dynamic skiing. Reveals boot alignment issues and establishes the sensory baseline for your stance.' },
            ],
          },
          {
            category: 'Edge & Carving',
            drills: [
              { name: 'Railroad Track Carves', reps: '6 turns', desc: 'On a groomed blue, make 6 large-radius carved turns. Look back after each run — you should see two parallel lines with zero skid marks. Wider spacing = better carve. Any spray = skidding.', why: 'Immediate visual feedback on carve quality. You can\'t fool yourself — the snow tells you exactly what your edges did.' },
              { name: 'Angulation Exaggeration', reps: '3 runs', desc: 'Make turns with deliberate, exaggerated hip/knee angulation into the hill — push the hip into the slope more than feels natural. You\'ll feel odd. Watch for improvement in edge hold on harder snow.', why: 'Angulation is underused by most skiers who rely on inclination instead. Exaggeration trains the movement pattern until it becomes available at will.' },
              { name: 'Hop Turns', reps: '20 hops', desc: 'On a gentle to moderate slope, hop both skis off the snow at the same time, rotate slightly in the air, land on the new edges. Small hops — barely airborne. Both skis together.', why: 'Develops simultaneous edge engagement and the rotary movement pattern needed for moguls, powder, and steep terrain.' },
            ],
          },
          {
            category: 'Terrain Drills',
            drills: [
              { name: 'Mogul Absorption Reps', reps: '20 moguls', desc: 'Find a small mogul field. Navigate 20 moguls with the goal of keeping your upper body completely still — only legs absorbing. Hands stay forward. Eyes look ahead 3 bumps. Poles plant on each bump top.', why: 'Upper body stability through moguls is the skill that transfers to every other advanced terrain type. Building it in moguls is the fastest path.' },
              { name: 'Steep Face Commitment', reps: '3 runs', desc: 'Find a run one pitch steeper than your current comfort level. Make one turn at a time — stop, breathe, look, pole plant, commit. Speed is irrelevant. Commitment of each individual turn is the goal.', why: 'Hesitation on steep terrain causes falls more often than technique errors. Drilling deliberate commitment turn-by-turn rewires the fear response.' },
            ],
          },
        ],
      },
    };

    const songwritingDrills = {
      title: 'Songwriting & Music',
      groups: [
        {
          category: 'Daily Writing Drills',
          drills: [
            { name: '10-Minute Lyric Sprint', reps: 'Daily', desc: 'Set a timer for 10 minutes. Pick one emotion or one scene and write without stopping, editing, or backspacing. Pure output. The goal is 10 minutes of forward momentum, not quality. Edit later — never mid-sprint.', why: 'The inner critic and the creator cannot coexist. This drill builds the ability to separate the creating from the judging — the single most important songwriting skill.' },
            { name: 'Hook Line in 2 Minutes', reps: '5 per session', desc: 'Pick an emotion (heartbreak, pride, longing, joy). Write a potential chorus hook line in 2 minutes. Write 5 in a row. Pick the best one. Most will be throwaway — that\'s expected and correct.', why: 'Volume of ideas is how you find the great ones. Professional writers write dozens of hook lines to find one that works. Train yourself to generate fast.' },
            { name: 'Chord Progression + Melody in 5', reps: '3 per week', desc: 'Play a chord progression (4 chords max). Record it looping on your phone. Immediately sing a melody over it — no words, just sounds (la, na, mm). 5 minutes only. Record the whole thing.', why: 'Melody comes from the gut, not the brain. Separating melody from lyric creation lets you find the melodic shape first — often the melody already tells you what the lyric should say.' },
          ],
        },
        {
          category: 'Structure Drills',
          drills: [
            { name: 'Verse/Chorus in 30', reps: '1 per session', desc: 'Write one complete verse (4 lines) and one complete chorus (2–4 lines) in 30 minutes from scratch. Doesn\'t need to be good — it needs to be done. Finished is better than perfect at this stage.', why: 'Structure muscle memory. Writers who work fast through blocks have done this enough times that the blank page stops being a threat.' },
            { name: 'Song Deconstruction', reps: '2 per week', desc: 'Pick a song you admire. Write out the lyric by hand. Map the chord progression. Label each section. Note: what is the hook line? What\'s the metaphor in the verse? What chord creates the emotional turn?', why: 'Songwriting is a learnable craft with patterns. Deconstructing great songs teaches those patterns faster than any course. You learn what the writers knew by reverse-engineering their decisions.' },
            { name: 'Re-Write the Chorus', reps: '5 per session', desc: 'Take a chorus you\'ve already written. Re-write it 5 different ways — change the imagery, change the POV, change the rhyme scheme, make it longer, make it shorter. Keep the same emotion.', why: 'Your first chorus is rarely your best chorus. This drill breaks the attachment to the first version and finds the stronger iteration that was always underneath it.' },
          ],
        },
        {
          category: 'Performance & Delivery',
          drills: [
            { name: 'Cold Performance Recording', reps: '1 per week', desc: 'No warm-up, no preparation. Pick up your guitar, hit record on your phone, and perform a song from start to finish. Watch it back. Note: where did you hesitate? Where did you look away? Where did you lose the emotion?', why: 'Performing cold is what an audience sees. Recording yourself cold reveals the gap between your rehearsed performance and your real one.' },
            { name: 'One Song, 10 Tempos', reps: 'Per song in setlist', desc: 'Play the same song at 10 different tempos — half-speed, slightly slow, normal, slightly fast, very fast. Notice where it breaks down. Notice where it breathes better. Find the tempo where it lives.', why: 'Every song has a tempo it wants to be played at — not necessarily the one you\'ve defaulted to. This drill finds it through elimination.' },
          ],
        },
      ],
    };

    const isSongwriting = blueprintType === 'songwriting' || blueprintType === 'music';
    const data = isSongwriting ? songwritingDrills : drillData[blueprintType];

    if (!data) {
      return `
        <div class="card" style="margin-bottom:16px">
          <div class="card-header" style="background:linear-gradient(135deg,rgba(62,207,142,0.1),transparent);border-bottom:1px solid rgba(62,207,142,0.15)">
            <div style="display:flex;align-items:center;gap:10px">
              <div style="font-size:20px">💪</div>
              <div>
                <div class="card-title">Muscle Memory · Repetition Drills</div>
                <div style="font-size:11px;color:var(--muted);margin-top:2px">Build the drills that matter most for this passion</div>
              </div>
            </div>
          </div>
          <div class="card-body" style="text-align:center;padding:40px;color:var(--muted);font-size:13px">
            Log your practice sessions in the journal to identify which drills you need most.
          </div>
        </div>`;
    }

    return `
      <div class="card" style="margin-bottom:16px;overflow:hidden">
        <div class="card-header" style="background:linear-gradient(135deg,rgba(62,207,142,0.1),rgba(62,207,142,0.02));border-bottom:1px solid rgba(62,207,142,0.18)">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="font-size:22px">💪</div>
            <div>
              <div class="card-title">Muscle Memory · Repetition Drills — ${data.title}</div>
              <div style="font-size:11px;color:var(--muted);margin-top:2px">Deliberate reps that build the physical patterns you can\'t think your way into</div>
            </div>
          </div>
        </div>
        <div class="card-body" style="padding:16px">
          ${data.groups.map(group => `
            <div style="margin-bottom:22px">
              <div style="font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;color:rgba(62,207,142,0.8);margin-bottom:12px">${group.category.toUpperCase()}</div>
              <div style="display:flex;flex-direction:column;gap:10px">
                ${group.drills.map(d => `
                  <div style="padding:13px;border-radius:10px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.02)">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                      <div style="font-size:13px;font-weight:600;color:rgba(226,234,242,0.95)">${d.name}</div>
                      <span style="font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;color:rgba(62,207,142,0.9);background:rgba(62,207,142,0.1);border:1px solid rgba(62,207,142,0.2);border-radius:5px;padding:2px 8px;white-space:nowrap;flex-shrink:0;margin-left:10px">${d.reps}</span>
                    </div>
                    <div style="font-size:12px;color:rgba(226,234,242,0.72);line-height:1.6;margin-bottom:7px">${d.desc}</div>
                    <div style="font-size:11px;color:var(--muted);line-height:1.5;padding-top:7px;border-top:1px solid rgba(255,255,255,0.05)"><span style="font-family:'Rajdhani',sans-serif;font-weight:700;color:rgba(62,207,142,0.6);font-size:10px;letter-spacing:1px">WHY → </span>${d.why}</div>
                  </div>`).join('')}
              </div>
            </div>`).join('')}
        </div>
      </div>`;
  }

  /* ══════════════════════════════════════════════════════════════
     MINDMAP SECTION — comprehensive conceptual map per blueprint
  ══════════════════════════════════════════════════════════════ */
  function renderMindmapSection(blueprintType) {
    const maps = {
      guitar: {
        title: 'Guitar',
        coreTruth: 'Music is a language — the guitar is your instrument for speaking it. Theory is the grammar, technique is the vocabulary, and expression is your voice. Remove any one of the three and you\'re limited.',
        pillars: [
          {
            name: 'Theory', tagline: 'The "why" behind everything you play',
            concepts: [
              { name: 'Intervals', desc: 'The distance between two notes — the DNA of all melody and harmony. Every chord and scale is just stacked intervals.' },
              { name: 'Keys & Scales', desc: 'The pool of notes a song lives in. Major is bright, minor is dark, modes add colour. Know which notes belong before you improvise.' },
              { name: 'Chord Construction', desc: 'Stacked thirds (1–3–5). Add 7ths, 9ths, suspensions for emotion. Understand why a chord sounds that way, not just its shape.' },
              { name: 'Rhythm & Time', desc: 'Subdivisions, swing, feel, groove — rhythm is what holds music together. Your sense of time is more important than your note choice.' },
            ],
          },
          {
            name: 'Technique', tagline: 'The physical language of the guitar',
            concepts: [
              { name: 'CAGED System', desc: 'Five chord shapes that tile the entire fretboard. Every note, chord, and scale pattern is accessible once you see the system.' },
              { name: 'Scale Patterns', desc: 'Pentatonic → major → melodic minor → modes. Learn five positions, then connect them across the neck into one continuous map.' },
              { name: 'Fingerpicking', desc: 'Thumb drives the bass (E A D), fingers handle treble (G B e). Travis picking pattern is the foundation — then build from there.' },
              { name: 'Barre Chords', desc: 'Portable, movable shapes. F major and Bm are the gatekeepers — master them and every key is open to you.' },
            ],
          },
          {
            name: 'Expression', tagline: 'What makes playing feel human',
            concepts: [
              { name: 'Dynamics', desc: 'Soft → loud → soft creates drama. Most players play too loud and too consistently. Volume contrast is one of your most powerful tools.' },
              { name: 'Vibrato & Bends', desc: 'A sustained note needs life — vibrato is your voice on the string. Bends in tune, with conviction, are more expressive than any fast run.' },
              { name: 'Space & Phrasing', desc: 'What you don\'t play matters as much as what you do. Miles Davis built a career on silence. Breathe between your phrases.' },
              { name: 'Tone', desc: 'Touch weight + pick angle + amp settings + guitar choice = your sound. Start with your hands — they travel with you when gear doesn\'t.' },
            ],
          },
          {
            name: 'Performance', tagline: 'All three pillars operating simultaneously in real time',
            concepts: [
              { name: 'Song Structure', desc: 'Verse → chorus → bridge — every section has a job. The verse sets up the world, the chorus delivers the emotional peak.' },
              { name: 'Rhythm Playing', desc: 'The backbone of every band. Flawless rhythm is worth more than flashy lead work — it\'s what the other musicians feel first.' },
              { name: 'Stage Presence', desc: 'Movement, eye contact, brief stories between songs. The audience experiences more than just the notes — they experience you.' },
              { name: 'Improvisation', desc: 'Theory + technique + deep listening = musical conversation in real time. It\'s a skill, not a gift — built through deliberate practice.' },
            ],
          },
        ],
        flow: 'Theory tells you which notes work → Technique lets you play them cleanly and with control → Expression gives them meaning and emotion → Performance delivers everything to a real audience in real time. Each layer is only as strong as the one below it. Skip theory and you\'re playing in the dark. Skip technique and the ideas can\'t come out. Skip expression and you\'re a human tab reader. Skip performance and it never reaches anyone.',
        insight: 'Most guitarists learn technique first and theory last — which is backwards. Theory without technique is useless, but technique without theory means you\'ll plateau. The players who break through are the ones who close the theory gap while continuing to refine their hands. Start with the pentatonic, understand why it works, then expand outward.',
      },

      vocals: {
        title: 'Vocals',
        coreTruth: 'Your voice is a physical instrument built into your body. Unlike a guitar, you can\'t see it, hold it, or buy a better one. You have to feel it, listen to it, and train it from the inside out — which is why most singers never reach their ceiling.',
        pillars: [
          {
            name: 'The Body', tagline: 'Your instrument before a sound is made',
            concepts: [
              { name: 'Posture', desc: 'Spine tall, shoulders relaxed, chin parallel to the floor. Posture is the foundation for airflow — collapse it and your instrument is already restricted.' },
              { name: 'Breath Support', desc: 'The diaphragm is the engine. Expand low (belly and sides), not high (chest and shoulders). Support every phrase from the core, not the throat.' },
              { name: 'Physical Relaxation', desc: 'Jaw, tongue, throat, neck — tension anywhere in the chain chokes the instrument. Great singing feels easy, not forced.' },
              { name: 'Warm-Up Protocol', desc: 'Cold vocals strain faster and recover slower. Lip trills, gentle humming, easy scales — 5–10 minutes minimum before every session or show.' },
            ],
          },
          {
            name: 'Sound Production', tagline: 'How breath becomes tone',
            concepts: [
              { name: 'Resonance Spaces', desc: 'Chest voice (low, warm), mask/sinus (forward, bright, cuts through a mix), head voice (high, airy clarity). The best singers blend all three fluidly.' },
              { name: 'Vocal Registers', desc: 'Chest voice → mix voice → head voice/falsetto. The mix register is where most of your range extension happens — don\'t skip it.' },
              { name: 'Vowel Modification', desc: 'Open vowels project and carry; closed vowels go flat. Modify vowel shape for resonance as you ascend — not to change the word, but to preserve the sound.' },
              { name: 'Tone Color', desc: 'Bright, dark, breathy, edgy, pressed — placement and subtle tension control your character. Match tone to the emotional content of the lyric.' },
            ],
          },
          {
            name: 'Control', tagline: 'Doing what you intend rather than what happens by accident',
            concepts: [
              { name: 'Pitch Accuracy', desc: 'Hear the pitch before you sing it (audiation). Record every practice session — your ear gives you feedback in real time that is often optimistically wrong.' },
              { name: 'Dynamic Control', desc: 'Piano to forte without losing support. Full power without tension is the holy grail of singing — it takes years to develop and is worth every rep.' },
              { name: 'Range Extension', desc: 'Expand at the very edges of your range, slowly, over months — never force it. Healthy range extension comes from relaxation, not more effort.' },
              { name: 'Agility & Runs', desc: 'Melisma and riffs are only clean when everything below them is relaxed, supported, and controlled. If it\'s messy, fix the foundation first.' },
            ],
          },
          {
            name: 'Artistry', tagline: 'Why people feel something when you sing',
            concepts: [
              { name: 'Phrasing', desc: 'Where you breathe shapes the meaning of the lyric. Long held phrases create tension; clipped short phrases create urgency. Both are tools.' },
              { name: 'Emotion & Story', desc: 'The audience reads your face, your body language, your eyes — not just your voice. Believe what you\'re singing or they won\'t believe it either.' },
              { name: 'Connection', desc: 'Sing to someone in the room — make eye contact, even momentarily. You\'re not performing to a wall; you\'re communicating to a person.' },
              { name: 'Authenticity', desc: 'Your natural voice — trained — is more powerful than any impression of someone else. Serve the song, not the technique. Technique is the vehicle, not the destination.' },
            ],
          },
        ],
        flow: 'The body creates breath → Breath vibrates the vocal cords → Resonance spaces amplify and shape the tone → Control allows you to direct that tone with precision → Artistry transforms technique into felt emotion. Remove any link in this chain and the whole system suffers. Great singing is the seamless integration of all four layers at once.',
        insight: 'Singers who chase only high notes and power miss the point entirely. The most compelling voices in history aren\'t the biggest — they\'re the most honest and the most present. Technique exists for one purpose: to remove the physical limitations that stop your emotion from coming through freely. Once technique is solid enough, get it out of the way.',
      },

      snowboarding: {
        title: 'Snowboarding',
        coreTruth: 'Snowboarding is controlled falling. You use gravity, momentum, edge angle, and body position to manage your descent. The board and your body are one linked system — change any variable and it changes everything else.',
        pillars: [
          {
            name: 'Physics', tagline: 'The invisible forces you\'re always working with',
            concepts: [
              { name: 'Gravity & The Fall Line', desc: 'The straight downhill path. Every turn takes you away from the fall line — time across it kills speed, time in it builds speed. Use this deliberately.' },
              { name: 'Edge Angle', desc: 'The angle the board\'s edge makes with the snow surface. More edge angle = more grip = more carved arc. This is your primary control variable.' },
              { name: 'Momentum', desc: 'Speed is your friend when managed. It enables carving, floating in powder, clearing jumps. Fighting momentum creates instability — work with it.' },
              { name: 'Center of Mass', desc: 'Keep your mass over the board. Too far back = loss of front-foot steering and arm-flailing. Too far forward on heels = caught edge and faceplant.' },
            ],
          },
          {
            name: 'Mechanics', tagline: 'How your body and the board create controlled movement',
            concepts: [
              { name: 'Stance', desc: 'Regular or goofy, shoulder-width apart, knees soft. Athletic ready-position at all times — not locked, not collapsing. Always prepared to react.' },
              { name: 'Edge Transitions', desc: 'Heel edge → flat board moment → toe edge. The flat-board transition is where most falls happen. Learn to own this moment, not avoid it.' },
              { name: 'Weight Distribution', desc: 'Front foot steers, back foot drives power out of turns. In powder, shift weight back to lift the nose and float. Terrain dictates your balance point.' },
              { name: 'Board Flex & Pop', desc: 'The board bends under pressure. Loading the tail stores energy — releasing it creates pop. Understand flex and you unlock the physics of jumps.' },
            ],
          },
          {
            name: 'Terrain Mastery', tagline: 'Applying your mechanics to real mountain conditions',
            concepts: [
              { name: 'Groomed Runs', desc: 'Your classroom. Predictable surface, ideal for developing edge-to-edge timing, carving technique, and speed management without variables.' },
              { name: 'Powder', desc: 'Weight back, wider stance, rhythmic up-down movement. Stop fighting the snow — surrender to it, let the board float, stay loose and reactive.' },
              { name: 'Park & Pipe', desc: 'Approach speed, pop timing, air body position, and spotting the landing are all non-negotiable. If one element is missing, the whole jump breaks down.' },
              { name: 'Trees & Moguls', desc: 'Read 3–5 seconds ahead. Your brain can only process what\'s coming — not what\'s already under your feet. Vision determines reaction time.' },
            ],
          },
          {
            name: 'Progression', tagline: 'The deliberate arc from beginner to expert',
            concepts: [
              { name: 'Stop First', desc: 'Master the hockey stop before anything else. Knowing you can stop gives you the psychological permission to ride faster and commit harder.' },
              { name: 'Carved Turns', desc: 'No skidding — just two clean lines in the snow. Takes multiple seasons to develop properly. Worth every rep. This is the defining mark of an expert rider.' },
              { name: 'Terrain Selection', desc: 'Choose terrain one level above your comfort zone — not two. Just outside comfort forces adaptation. Too far outside it causes panic and ingrained bad habits.' },
              { name: 'Film Your Riding', desc: 'What you think your body is doing and what it\'s actually doing are almost always different — often dramatically. Camera doesn\'t lie. Watch yourself weekly.' },
            ],
          },
        ],
        flow: 'Physics sets the conditions → Mechanics gives you tools to work within those conditions → Terrain mastery applies those tools to the infinite variety of real mountain situations → Progression is the deliberate, systematic expansion of your ceiling over time. Rush any layer and the physics eventually corrects you.',
        insight: 'Most intermediate riders plateau because they only ride terrain they\'re already comfortable on. They get better at what they already know, not at what\'s ahead. Mastery comes from deliberately seeking discomfort — a slightly steeper pitch, a deeper powder day, a slightly larger jump. The body only adapts when it has to.',
      },

      skiing: {
        title: 'Skiing',
        coreTruth: 'Two skis, two edges, one body — skiing is the art of making all of them work in coordinated sequence. The upper and lower body must separate and cooperate simultaneously. This is the concept that unlocks everything.',
        pillars: [
          {
            name: 'Foundation', tagline: 'The body position everything is built on',
            concepts: [
              { name: 'Stance & Alignment', desc: 'Shoulder-width, knees flexed, slight forward shin pressure on boots, hands forward and visible in peripheral vision. This is your home base — return here constantly.' },
              { name: 'Pole Work', desc: 'Poles set rhythm and timing, not balance. Plant forward and to the side — never reach back or wide. Each plant signals the start of the next turn.' },
              { name: 'Upper/Lower Body Separation', desc: 'Torso faces downhill while legs turn below it. This counter-rotation is the most important concept in skiing — and the hardest to ingrain.' },
              { name: 'Boot Alignment', desc: 'Cant and forward lean affect how your edges engage. Improper boot fit or alignment is a ceiling that no amount of skill can break through.' },
            ],
          },
          {
            name: 'Edge Mechanics', tagline: 'How you make the ski grip and carve',
            concepts: [
              { name: 'Angulation', desc: 'Bending the hip and knee into the hill to increase edge angle without tipping the whole body over. This is how you create high edge angles at lower speeds.' },
              { name: 'Inclination', desc: 'Leaning the entire body toward the center of a carved turn. Only sustainable at higher speeds due to centrifugal force. Speed and inclination are linked.' },
              { name: 'Inside vs Outside Ski', desc: 'Load the outside ski through every turn — it has more edge contact and carries the arc. The inside ski guides and balances, never dominates.' },
              { name: 'Early Edge Engagement', desc: 'Tip the ski on edge before the turn is fully initiated. This is what creates a carved arc rather than a skidded smear. The earlier the engagement, the cleaner the line.' },
            ],
          },
          {
            name: 'Turning', tagline: 'Controlling direction, speed, and turn radius',
            concepts: [
              { name: 'Turn Initiation', desc: 'Weight transfer from the old outside ski to the new outside ski. This single movement starts every turn. Everything else follows from getting this right.' },
              { name: 'Radius & Speed Control', desc: 'Short-radius turns kill speed; long-radius turns build it. Choose your turn shape to manage pace without relying on braking or scrubbing.' },
              { name: 'The Finish Phase', desc: 'Complete the turn fully — don\'t rush to the next one. Pressure through the finish creates control and sets you up perfectly for the next initiation.' },
              { name: 'Fall Line Management', desc: 'Time spent across the fall line slows you; time spent in it accelerates you. Managing how long you point downhill is how you control your speed on steeps.' },
            ],
          },
          {
            name: 'Terrain & Mastery', tagline: 'Applying every skill to every condition',
            concepts: [
              { name: 'Moguls', desc: 'Absorb with legs only — upper body stays completely quiet. Eyes look 3 bumps ahead, never at the one you\'re on. Poles set your rhythm.' },
              { name: 'Off-Piste & Powder', desc: 'Equal weight on both skis, slightly wider stance, rhythmic rebound off each turn to float the tips. Match your speed to your visibility and terrain.' },
              { name: 'Steeps', desc: 'Plant the pole downhill before every turn to commit. Hesitation on a steep face usually causes falls. Eyes look far down the run — never at your feet.' },
              { name: 'Variable Conditions', desc: 'Crud, ice, wind slab, spring slush — each needs different pressure, speed, and edge engagement. Adapt constantly. The mountain never gives you the same run twice.' },
            ],
          },
        ],
        flow: 'Foundation creates the stable platform → Edge mechanics give you precise control over what the ski does → Turning applies that control to manage direction and speed → Terrain mastery adapts all of it to every condition the mountain presents. Skiing is a series of linked turns — the end of each is already the beginning of the next. Flow comes when this linkage becomes unconscious.',
        insight: 'The biggest technical gap in most intermediate skiers is upper/lower body separation. When the upper body rotates with the legs, the whole system fights itself — you lose edge, you skid, you speed-check constantly. Fix this one thing and almost everything else improves automatically. Every elite ski coach identifies it as the first lever to pull.',
      },
    };

    const songwritingData = {
      title: 'Songwriting & Music',
      coreTruth: 'A song is a complete emotional experience — every element (melody, harmony, rhythm, lyrics, arrangement) exists to serve one thing: the feeling the song is trying to create. Technique is the servant, not the master.',
      pillars: [
        {
          name: 'The Seed', tagline: 'Where every great song starts',
          concepts: [
            { name: 'Emotion & Intent', desc: 'What is this song trying to make the listener feel? Answer this first. Every technical decision should serve this answer. If you can\'t name the feeling, the song isn\'t ready.' },
            { name: 'The Hook', desc: 'The line or musical phrase the listener will still be humming tomorrow. Find it early in the writing process and build the entire song toward it.' },
            { name: 'Point of View', desc: 'First person (I) = maximum intimacy. Second person (You) = direct confrontation. Third person = storytelling distance. Choose deliberately — it changes everything.' },
            { name: 'The Unresolved Tension', desc: 'Every great song poses a question the listener needs answered. The verse raises it. The chorus delivers the answer (or deepens the wound).' },
          ],
        },
        {
          name: 'Melody', tagline: 'The part people hum in the shower',
          concepts: [
            { name: 'Contour & Breath', desc: 'Melodies that rise and fall with the emotional content of the lyric land harder. Ascending = rising urgency or hope. Descending = resolution or sadness.' },
            { name: 'Prosody', desc: 'Stressed syllables must land on strong melodic beats. When words and melody fight, the lyric loses its meaning — the listener hears sound, not sense.' },
            { name: 'Range Architecture', desc: 'Hold the big notes back. Verse stays low-to-mid — chorus earns the top of your range. The emotional climb of a song is partly a climb in pitch.' },
            { name: 'Memorable Repetition', desc: 'Repeat with variation. The exact same phrase twice is boring; a slight change keeps interest. The hook should repeat — everything else should develop.' },
          ],
        },
        {
          name: 'Harmony', tagline: 'The emotional colour underneath the melody',
          concepts: [
            { name: 'Chord Progressions', desc: 'I–IV–V is triumphant. I–V–vi–IV is pop gold. ii–V–I creates resolution. Each progression has a built-in emotional arc — choose deliberately, not by habit.' },
            { name: 'Tension & Release', desc: 'Diminished and dominant chords create tension; resolve them (or pointedly refuse to) for effect. The space between tension and release is where emotion lives.' },
            { name: 'Key & Mode', desc: 'Major is generally bright, minor is darker, Mixolydian has a rock anthemic quality. Choose the key for the singer\'s strongest register, not the guitarist\'s convenience.' },
            { name: 'Borrowed Chords', desc: 'A chord from outside the key (modal mixture, secondary dominant) creates a moment of surprise and depth. Even one borrowed chord per song can be transformative.' },
          ],
        },
        {
          name: 'Lyrics & Craft', tagline: 'Specific images are more powerful than general statements',
          concepts: [
            { name: 'Concrete Imagery', desc: '"Rusted Chevrolet in a church parking lot" hits harder than "old car." Specific, sensory details make listeners feel present — not informed.' },
            { name: 'Subtext', desc: 'Say what the song is about without saying it directly. Show the feeling, don\'t name it. "I miss you" is weak. Describe what reminded you of them at 2am.' },
            { name: 'Rhyme & Near-Rhyme', desc: 'ABAB, AABB, ABCB — each scheme creates different momentum. Near-rhyme (slant rhyme) can feel more honest than perfect rhyme. Use both deliberately.' },
            { name: 'The Title Line', desc: 'The most important lyric in the song. Ideally: it\'s the emotional peak, it\'s the hook, and it sits in the chorus. If the title doesn\'t earn its place, the song hasn\'t found itself yet.' },
          ],
        },
      ],
      flow: 'The emotional seed shapes what the melody needs to feel → The melody reveals what harmony will support or contrast it → Harmony and melody together suggest what the lyrics need to say and how to say it → Lyrics refine all three layers → Arrangement serves everything above it by choosing what sounds tell this specific story → Performance delivers it to a real person in real time.',
      insight: 'Most songwriters write chords first, then melody, then lyrics — which produces competent songs but rarely great ones. The best writers start from the emotion or the central lyric line and let it dictate everything else. Nashville writers ask one question before anything: "What\'s this song saying?" If you can\'t answer that in a single sentence, the song isn\'t finished yet.',
    };

    const isSongwriting = blueprintType === 'songwriting' || blueprintType === 'music';
    const data = isSongwriting ? songwritingData : maps[blueprintType];

    if (!data) {
      return `
        <div class="card" style="margin-bottom:16px">
          <div class="card-header" style="background:linear-gradient(135deg,rgba(124,106,247,0.1),transparent);border-bottom:1px solid rgba(124,106,247,0.15)">
            <div style="display:flex;align-items:center;gap:10px">
              <div style="font-size:20px">🧠</div>
              <div>
                <div class="card-title">Mind Mapping Theory</div>
                <div style="font-size:11px;color:var(--muted);margin-top:2px">Build your conceptual map as you learn — what connects to what</div>
              </div>
            </div>
          </div>
          <div class="card-body" style="text-align:center;padding:40px;color:var(--muted);font-size:13px">
            Use your journal to document how the pieces of this passion connect. Patterns will emerge.
          </div>
        </div>`;
    }

    return `
      <div class="card" style="margin-bottom:16px;overflow:hidden">
        <div class="card-header" style="background:linear-gradient(135deg,rgba(124,106,247,0.12),rgba(124,106,247,0.03));border-bottom:1px solid rgba(124,106,247,0.18)">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="font-size:22px">🧠</div>
            <div>
              <div class="card-title">Mind Mapping Theory — ${data.title}</div>
              <div style="font-size:11px;color:var(--muted);margin-top:2px">How every element of this passion connects at a conceptual level</div>
            </div>
          </div>
        </div>
        <div class="card-body">

          <div style="padding:14px 16px;margin-bottom:20px;background:rgba(124,106,247,0.07);border-radius:10px;border:1px solid rgba(124,106,247,0.18);border-left:3px solid var(--accent)">
            <div style="font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;color:var(--accent);margin-bottom:6px">CORE TRUTH</div>
            <div style="font-size:13px;color:rgba(226,234,242,0.9);line-height:1.65;font-style:italic">${data.coreTruth}</div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px;margin-bottom:18px">
            ${data.pillars.map((pillar, pi) => `
              <div style="padding:14px;border-radius:10px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.02)">
                <div style="font-family:'Rajdhani',sans-serif;font-size:11px;letter-spacing:1.5px;font-weight:700;color:var(--accent);margin-bottom:3px">${pi + 1}. ${pillar.name.toUpperCase()}</div>
                <div style="font-size:11px;color:var(--muted);margin-bottom:10px;font-style:italic;line-height:1.4">${pillar.tagline}</div>
                <div style="display:flex;flex-direction:column;gap:8px">
                  ${pillar.concepts.map(c => `
                    <div>
                      <div style="font-size:12px;font-weight:600;color:rgba(226,234,242,0.9);margin-bottom:2px">→ ${c.name}</div>
                      <div style="font-size:11px;color:var(--muted);line-height:1.5">${c.desc}</div>
                    </div>`).join('')}
                </div>
              </div>`).join('')}
          </div>

          <div style="padding:12px 16px;margin-bottom:12px;background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid rgba(255,255,255,0.07)">
            <div style="font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;color:rgba(226,234,242,0.45);margin-bottom:6px">HOW IT ALL FLOWS</div>
            <div style="font-size:12px;color:rgba(226,234,242,0.7);line-height:1.7">${data.flow}</div>
          </div>

          <div style="padding:12px 16px;background:rgba(124,106,247,0.05);border-radius:10px;border:1px solid rgba(124,106,247,0.12)">
            <div style="font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;color:var(--accent);margin-bottom:6px">KEY INSIGHT</div>
            <div style="font-size:12px;color:rgba(226,234,242,0.8);line-height:1.7">${data.insight}</div>
          </div>

        </div>
      </div>`;
  }

  /* ══════════════════════════════════════════════════════════════
     SUB-BLUEPRINT SECTION — shared across all board types
  ══════════════════════════════════════════════════════════════ */
  function renderSubBlueprintsHTML(p) {
    if (!(p.blueprints || []).length) return `
      <div style="margin-top:8px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div class="section-label" style="margin-bottom:0">Sub-Blueprints</div>
          <button class="day-tab" id="addSubBlueprintBtn" style="font-size:11px;padding:4px 12px">+ Add Blueprint</button>
        </div>
        <div class="card">
          <div class="card-body" style="text-align:center;padding:32px;color:var(--muted);font-size:13px">
            No sub-blueprints added. Stack a framework to track step-by-step progress.
          </div>
        </div>
      </div>`;

    const activeBpId = p.blueprints[0]?.id || null;
    return `
      <div style="margin-top:8px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div class="section-label" style="margin-bottom:0">Sub-Blueprints</div>
          <button class="day-tab" id="addSubBlueprintBtn" style="font-size:11px;padding:4px 12px">+ Add Blueprint</button>
        </div>
        <div class="day-tabs" style="margin-bottom:14px;flex-wrap:wrap" id="subBpTabs">
          ${p.blueprints.map(b => `
            <button class="day-tab${b.id === activeBpId ? ' active' : ''}" data-sbpid="${b.id}">${b.name}</button>`).join('')}
        </div>
        <div id="subBpDetail"></div>
      </div>`;
  }

  function renderSubBlueprintDetail(container, p, blueprintId) {
    const bp = (p.blueprints || []).find(b => b.id === blueprintId);
    if (!bp) return;
    const tpl = SUB_BLUEPRINTS.find(t => t.id === bp.templateId);
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
          <div id="sbpStepList"></div>
        </div>
      </div>`;

    const stepList = container.querySelector('#sbpStepList');
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

      row.querySelector('.bp-step-check').addEventListener('click', () => {
        STATE.completePassionStep(p.id, blueprintId, idx, !step.completed);
        const freshP = passions().find(pp => pp.id === p.id);
        renderSubBlueprintDetail(container, freshP, blueprintId);
      });

      const notesEl = row.querySelector('.bp-step-notes');
      let t;
      notesEl.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => STATE.setPassionStepNotes(p.id, blueprintId, idx, notesEl.value), 600);
      });

      stepList.appendChild(row);
    });
  }

  function wireSubBlueprintSection(panel, p, rerender) {
    /* Add blueprint picker */
    panel.querySelector('#addSubBlueprintBtn')?.addEventListener('click', () => {
      const existing  = new Set((p.blueprints || []).map(b => b.templateId));
      const available = SUB_BLUEPRINTS.filter(t => !existing.has(t.id));
      if (!available.length) { alert('All available sub-blueprints are already added.'); return; }

      const overlay = document.createElement('div');
      overlay.className = 'ex-modal-overlay';
      overlay.innerHTML = `
        <div class="ex-modal">
          <div class="ex-modal-header">
            <div class="ex-modal-info">
              <div class="ex-modal-eyebrow">Stack a Framework</div>
              <div class="ex-modal-title">Add Sub-Blueprint</div>
            </div>
            <button class="modal-close" id="sbpPickerClose">✕</button>
          </div>
          <div class="ex-modal-body" style="padding:20px;display:flex;flex-direction:column;gap:10px">
            ${available.map(t => `
              <div style="padding:14px;border-radius:10px;border:1px solid var(--border);cursor:pointer;transition:border-color 0.15s" class="sbp-option" data-tplid="${t.id}">
                <div style="font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;margin-bottom:3px">${t.name}</div>
                <div style="font-size:12px;color:var(--muted)">${t.description}</div>
              </div>`).join('')}
          </div>
        </div>`;

      const page = document.getElementById('page-passions');
      page.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('open'));

      overlay.querySelector('#sbpPickerClose').addEventListener('click', () => {
        overlay.classList.remove('open');
        setTimeout(() => overlay.remove(), 300);
      });
      overlay.addEventListener('click', e => {
        if (e.target === overlay) { overlay.classList.remove('open'); setTimeout(() => overlay.remove(), 300); }
      });
      overlay.querySelectorAll('.sbp-option').forEach(opt => {
        opt.addEventListener('click', () => {
          STATE.addPassionBlueprint(p.id, opt.dataset.tplid);
          overlay.classList.remove('open');
          setTimeout(() => overlay.remove(), 300);
          rerender();
        });
      });
    });

    /* Blueprint tabs */
    const subBpTabs   = panel.querySelector('#subBpTabs');
    const subBpDetail = panel.querySelector('#subBpDetail');
    if (subBpTabs && subBpDetail && (p.blueprints || []).length) {
      let activeSbpId = p.blueprints[0].id;

      function activateTab(id) {
        activeSbpId = id;
        subBpTabs.querySelectorAll('[data-sbpid]').forEach(b => b.classList.toggle('active', b.dataset.sbpid === id));
        renderSubBlueprintDetail(subBpDetail, p, id);
      }

      subBpTabs.querySelectorAll('[data-sbpid]').forEach(btn => {
        btn.addEventListener('click', () => activateTab(btn.dataset.sbpid));
      });
      activateTab(activeSbpId);
    }
  }

  /* ── Shared HTML helpers ── */
  function renderGoalsHTML(p) {
    if (!(p.goals || []).length) return `<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px">No goals yet — add one above.</div>`;
    return p.goals.map(g => {
      const pct = g.target ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
      return `
        <div style="margin-bottom:18px" data-goalid="${g.id}">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
            <span style="font-size:13px;font-weight:500">${g.label}</span>
            <div style="display:flex;align-items:center;gap:10px">
              <span style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;color:var(--accent)">
                <input class="form-input goal-curr-input" data-goalid="${g.id}" type="number" value="${g.current}" style="width:52px;padding:2px 6px;font-size:13px;font-family:'Rajdhani',sans-serif;font-weight:700;text-align:right;display:inline-block" />
                <span style="color:var(--muted);font-weight:400;font-size:12px">/ ${g.target} ${g.unit}</span>
              </span>
              <button class="day-tab" data-removegid="${g.id}" style="font-size:10px;padding:2px 8px;color:var(--muted)">✕</button>
            </div>
          </div>
          <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>`;
    }).join('');
  }

  function renderJournalHTML(p, fmtDate) {
    if (!(p.journal || []).length) return `<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px">No entries yet.</div>`;
    return p.journal.map(e => `
      <div style="padding:14px 0;border-top:1px solid rgba(255,255,255,0.05);display:flex;gap:12px;align-items:flex-start">
        <div style="flex:1">
          <div style="font-size:9px;font-family:'Rajdhani',sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:6px">${fmtDate(e.date)}</div>
          <div style="font-size:13px;color:rgba(226,234,242,0.85);line-height:1.6">${e.text.replace(/\n/g,'<br>')}</div>
        </div>
        <button class="day-tab" data-removejid="${e.id}" style="font-size:10px;padding:2px 8px;color:var(--muted);flex-shrink:0">✕</button>
      </div>`).join('');
  }

  function wireNotesGoalsJournal(panel, p, rerender) {
    const notesEl = panel.querySelector('#passionNotes');
    let notesTimer;
    notesEl?.addEventListener('input', () => {
      clearTimeout(notesTimer);
      notesTimer = setTimeout(() => STATE.updatePassion(p.id, { notes: notesEl.value }), 600);
    });

    const addGoalForm = panel.querySelector('#addGoalForm');
    panel.querySelector('#showAddGoalBtn').addEventListener('click', () => {
      addGoalForm.style.display = addGoalForm.style.display === 'none' ? 'block' : 'none';
    });
    panel.querySelector('#cancelGoalBtn').addEventListener('click', () => { addGoalForm.style.display = 'none'; });
    panel.querySelector('#saveGoalBtn').addEventListener('click', () => {
      const label  = panel.querySelector('#newGoalLabel').value.trim();
      const target = panel.querySelector('#newGoalTarget').value;
      const unit   = panel.querySelector('#newGoalUnit').value.trim();
      if (!label) return;
      STATE.addPassionGoal(p.id, label, target, unit);
      rerender();
    });

    panel.querySelectorAll('.goal-curr-input').forEach(inp => {
      let t;
      inp.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => {
          STATE.updatePassionGoal(p.id, inp.dataset.goalid, inp.value);
          const g = passions().find(pp => pp.id === p.id)?.goals?.find(g => g.id === inp.dataset.goalid);
          if (g) {
            const pct = g.target ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
            const fill = panel.querySelector(`[data-goalid="${inp.dataset.goalid}"] .progress-fill`);
            if (fill) fill.style.width = pct + '%';
          }
        }, 400);
      });
    });

    panel.querySelectorAll('[data-removegid]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Remove this goal?')) return;
        STATE.removePassionGoal(p.id, btn.dataset.removegid);
        rerender();
      });
    });

    panel.querySelector('#addJournalEntryBtn').addEventListener('click', () => {
      const text = panel.querySelector('#newJournalEntry').value.trim();
      if (!text) return;
      STATE.addPassionJournalEntry(p.id, text);
      rerender();
    });

    panel.querySelectorAll('[data-removejid]').forEach(btn => {
      btn.addEventListener('click', () => {
        STATE.removePassionJournalEntry(p.id, btn.dataset.removejid);
        rerender();
      });
    });
  }

  /* ══════════════════════════════════════════════════════════════
     NEW PASSION FORM
  ══════════════════════════════════════════════════════════════ */
  function renderNewPassionForm(panel) {
    panel.innerHTML = `
      <div class="card">
        <div class="card-header"><div class="card-title">Add New Passion</div></div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-field">
              <label class="form-label">Name</label>
              <input class="form-input" id="npName" type="text" placeholder="e.g. Horses, Snow, Outdoors…" />
            </div>
            <div class="form-field" style="max-width:80px">
              <label class="form-label">Icon</label>
              <input class="form-input" id="npIcon" type="text" placeholder="🐴" maxlength="4" />
            </div>
          </div>
          <div class="form-field" style="margin-top:12px">
            <label class="form-label">Description</label>
            <input class="form-input" id="npDesc" type="text" placeholder="One line about what this passion means to you…" />
          </div>

          <!-- Main blueprint picker -->
          <div style="margin-top:20px">
            <div class="form-label" style="margin-bottom:10px;display:block">Board Blueprint</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px" id="blueprintPicker">
              ${PASSION_BLUEPRINTS.map((bp, i) => `
                <div class="bp-card" data-bpid="${bp.id}" style="padding:14px;border-radius:10px;border:1px solid ${i === 0 ? 'var(--accent)' : 'var(--border)'};background:${i === 0 ? 'rgba(124,106,247,0.08)' : ''};cursor:pointer;transition:border-color 0.15s,background 0.15s">
                  <div style="font-size:22px;margin-bottom:6px">${bp.icon}</div>
                  <div style="font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;margin-bottom:3px">${bp.name}</div>
                  <div style="font-size:11px;color:var(--muted);line-height:1.4">${bp.desc}</div>
                </div>`).join('')}
            </div>
          </div>

          <!-- Sub-blueprint checkboxes -->
          ${SUB_BLUEPRINTS.length ? `
          <div style="margin-top:20px">
            <div class="form-label" style="margin-bottom:10px;display:block">Sub-Blueprints <span style="color:var(--muted);font-weight:400">(stack onto your board)</span></div>
            <div style="display:flex;flex-direction:column;gap:10px" id="subBpCheckboxes">
              ${SUB_BLUEPRINTS.map(t => `
                <label style="display:flex;align-items:flex-start;gap:12px;cursor:pointer;padding:12px;border-radius:10px;border:1px solid var(--border)">
                  <input type="checkbox" value="${t.id}" style="margin-top:2px;accent-color:var(--accent);width:16px;height:16px;flex-shrink:0" />
                  <div>
                    <div style="font-size:13px;font-weight:500;margin-bottom:2px">${t.name}</div>
                    <div style="font-size:11px;color:var(--muted)">${t.description}</div>
                  </div>
                </label>`).join('')}
            </div>
          </div>` : ''}

          <button class="phase-btn active" id="createPassion" style="margin-top:24px;padding:10px 24px;font-size:14px">Add Passion</button>
          <div id="npError" style="color:var(--danger);font-size:12px;margin-top:8px;display:none"></div>
        </div>
      </div>`;

    /* Main blueprint card picker */
    let selectedBlueprint = PASSION_BLUEPRINTS[0].id;
    panel.querySelectorAll('.bp-card').forEach(c => {
      c.addEventListener('click', () => {
        selectedBlueprint = c.dataset.bpid;
        panel.querySelectorAll('.bp-card').forEach(x => {
          x.style.borderColor = 'var(--border)';
          x.style.background  = '';
        });
        c.style.borderColor = 'var(--accent)';
        c.style.background  = 'rgba(124,106,247,0.08)';
        /* Auto-set icon from blueprint if user hasn't typed one */
        const iconInput = panel.querySelector('#npIcon');
        if (!iconInput.value || PASSION_BLUEPRINTS.some(b => b.icon === iconInput.value)) {
          iconInput.value = PASSION_BLUEPRINTS.find(b => b.id === selectedBlueprint)?.icon || '';
        }
      });
    });

    panel.querySelector('#createPassion').addEventListener('click', () => {
      const name  = panel.querySelector('#npName').value.trim();
      const bp    = PASSION_BLUEPRINTS.find(b => b.id === selectedBlueprint);
      const icon  = panel.querySelector('#npIcon').value.trim() || bp?.icon || '✨';
      const desc  = panel.querySelector('#npDesc').value.trim();
      const errEl = panel.querySelector('#npError');
      if (!name) { errEl.textContent = 'Name is required.'; errEl.style.display = 'block'; return; }
      errEl.style.display = 'none';

      const newId = STATE.addPassion(name, icon, desc, selectedBlueprint);

      /* Attach checked sub-blueprints */
      panel.querySelectorAll('#subBpCheckboxes input:checked').forEach(cb => {
        STATE.addPassionBlueprint(newId, cb.value);
      });

      activePassionId = newId;
      showingNew      = false;
      buildPassionTabs();
      renderPanel();
    });
  }

  /* ── Initial render ── */
  activePassionId = pas().activePassionId || passions()[0]?.id || null;
  if (!passions().find(p => p.id === activePassionId)) activePassionId = passions()[0]?.id || null;
  buildPassionTabs();
  renderPanel();
});

(async function boot() {
  await STATE.load();
  const hash  = window.location.hash.replace('#', '');
  const valid = ['dashboard','nutrition','workout','business','wealth','passions'];
  navigateTo(valid.includes(hash) ? hash : 'dashboard');
})();
