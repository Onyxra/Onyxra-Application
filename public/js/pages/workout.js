/**
 * KOLTYN OS — pages/workout.js
 *
 * DATA FLOW
 *   APP_DATA.workout             → exercise data (recovery + ramping phases)
 *   APP_DATA.stretchingRoutine   → static stretching reference
 *   APP_DATA.morningRoutine      → static morning routine reference
 *   APP_DATA.healthPrinciples.workout → static principles
 *
 *   STATE.data.workout → currentPhase, schedule, currentDayIndex,
 *                        cycleCount, weekNumber, log, logbook, progressPics
 *
 * WRITES TO STATE → IDB (all mutators call save() → IndexedDB asynchronously)
 *   STATE.logWorkout(dayName, phase, exercises, notes)
 *     → advances currentDayIndex, tracks cycleCount/weekNumber
 *   STATE.addLogbookEntry(entry)  → detailed sets/reps/weight log
 *   STATE.setWorkoutPhase(phase)  → manual phase override
 *   STATE.advancePhase()          → auto-advance when cycle limit reached
 *   STATE.addProgressPic(dataUrl, note) → stores base64 image
 *   STATE.removeProgressPic(idx)        → deletes image
 *
 * PHASE CYCLING
 *   Recovery: 5 cycles (Weeks 1–5). After 5 cycles, advance button appears.
 *   Ramping:  7 cycles (Weeks 6–12). After 7 cycles, reset button appears.
 *   Cycle = one full run through all 7 scheduled days.
 *
 * SCHEDULE
 *   ['Upper','Lower','Rest','Pull','Push','Legs','Rest']
 *   Rest after Lower (posterior chain) + Rest after Legs (both taxing).
 *   Day tabs show the full 7-step schedule so both Rest days are visible.
 *
 * TABS: Today | Logbook | History | Progress Pics | Principles
 *   Morning Routine and Stretching are collapsible sections inside the Today tab.
 *   Macro Calculator lives on the Nutrition page.
 */

window.registerPage('workout', function initWorkout() {

  /* ── Data ── */
  const RECOVERY       = APP_DATA.workout.recovery;
  const RAMPING        = APP_DATA.workout.ramping;
  const REST_DAY       = APP_DATA.workout.restDay;
  const PROGRAM_LOGIC  = APP_DATA.workout.programLogic;

  /* ── Live state ── */
  const ws = STATE.data.workout;

  /* ── Preset routines (built-in, not stored in state) ── */
  const PRESET_ROUTINES = [
    {
      id: 'jeff-nippard-ulppl',
      name: 'Jeff Nippard UL+PPL',
      eyebrow: 'Hypertrophy · Science-Based',
      description: 'A research-backed Upper/Lower + Push/Pull/Legs hybrid for intermediate lifters. Progressive overload from technique-focused recovery phases into high-intensity ramping.',
      gradient: 'linear-gradient(135deg, #ff6b35 0%, #c93c10 100%)',
      icon: '🔬',
      daysPerWeek: 5,
      duration: '12 Weeks',
      level: 'Intermediate',
      tags: ['Hypertrophy', 'Strength'],
      schedule: ['Upper', 'Lower', 'Rest', 'Pull', 'Push', 'Legs', 'Rest'],
      stages: [
        { name: 'Technique',  weekCount: 2, phase: 'recovery' },
        { name: 'Volume',     weekCount: 3, phase: 'recovery' },
        { name: 'Intro',      weekCount: 1, phase: 'ramping'  },
        { name: 'Overload',   weekCount: 6, phase: 'ramping'  },
      ],
    },
    {
      id: 'classic-ppl',
      name: 'Classic PPL',
      eyebrow: 'Strength · Volume',
      description: 'The timeless Push/Pull/Legs 6-day split. High volume, high frequency — designed to maximize muscle and strength gains for intermediate to advanced lifters.',
      gradient: 'linear-gradient(135deg, #7c6af7 0%, #4a3ab8 100%)',
      icon: '💪',
      daysPerWeek: 6,
      duration: 'Ongoing',
      level: 'Intermediate+',
      tags: ['Volume', 'Strength'],
      schedule: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs', 'Rest'],
      stages: [{ name: 'Push/Pull/Legs', weekCount: 52 }],
    },
    {
      id: 'full-body-3x',
      name: 'Full Body 3×',
      eyebrow: 'Beginner · Efficient',
      description: 'Three full-body sessions per week hitting every muscle group each workout. Perfect for beginners or those with limited time who want balanced development.',
      gradient: 'linear-gradient(135deg, #f5c842 0%, #c48a0a 100%)',
      icon: '⚡',
      daysPerWeek: 3,
      duration: 'Ongoing',
      level: 'Beginner',
      tags: ['Full Body', 'Efficiency'],
      schedule: ['Full Body', 'Rest', 'Full Body', 'Rest', 'Full Body', 'Rest', 'Rest'],
      stages: [{ name: 'Full Body', weekCount: 52 }],
    },
    {
      id: 'bro-split',
      name: 'Classic Bro Split',
      eyebrow: 'Bodybuilding · Traditional',
      description: 'Chest/Tri, Back/Bi, Shoulders, Legs, Arms — one muscle group per day with maximum focus and volume per session. The original bodybuilding blueprint.',
      gradient: 'linear-gradient(135deg, #f06292 0%, #ad1457 100%)',
      icon: '🏆',
      daysPerWeek: 5,
      duration: 'Ongoing',
      level: 'All Levels',
      tags: ['Bodybuilding', 'Classic'],
      schedule: ['Chest & Tri', 'Back & Bi', 'Shoulders', 'Arms', 'Legs', 'Rest', 'Rest'],
      stages: [{ name: 'Split Training', weekCount: 52 }],
    },
  ];

  const PRESET_EXERCISES = APP_DATA.presetExercises;

  /* Migrate old seeded 'default' routine — clean it out, use preset IDs instead */
  if (!ws.routines) ws.routines = [];
  ws.routines = ws.routines.filter(r => r.id !== 'default');
  if (!ws.activeRoutineId || ws.activeRoutineId === 'default') {
    ws.activeRoutineId = 'jeff-nippard-ulppl';
    STATE.save();
  }

  function getAllRoutines() {
    return [
      ...PRESET_ROUTINES,
      ...ws.routines.map(r => ({ ...r, custom: true })),
    ];
  }

  /* ── Program logic helpers ── */
  const COMPOUND_KEYWORDS = ['squat', 'bench', 'row', 'pulldown', 'pull-up', 'lunge'];

  function getWeekRule(phaseName, weekNum) {
    const phaseLogic = PROGRAM_LOGIC.phases.find(p => p.name.toLowerCase() === phaseName);
    if (!phaseLogic) return null;
    return phaseLogic.weekRules.find(r => r.weeks.includes(weekNum)) || phaseLogic.weekRules[0];
  }

  function isCompound(exName) {
    const lower = exName.toLowerCase();
    return COMPOUND_KEYWORDS.some(k => lower.includes(k));
  }

  function getSets(ex, phaseName, weekNum) {
    if (phaseName === 'ramping' && weekNum >= 7) {
      return isCompound(ex.name) ? 3 : 2;
    }
    const rule = getWeekRule(phaseName, weekNum);
    return rule ? rule.sets : 1;
  }

  function getRPEForWeek(ex, phaseName, weekNum) {
    if (phaseName === 'recovery') {
      const key = weekNum <= 2 ? 'wk12' : 'wk35';
      return { earlyRPE: ex.earlyRPE?.[key] || '~7', lastRPE: ex.lastRPE?.[key] || '~8' };
    } else {
      const key = weekNum <= 6 ? 'wk6' : 'wk712';
      return { earlyRPE: ex.earlyRPE?.[key] || '~7', lastRPE: ex.lastRPE?.[key] || '~8' };
    }
  }


  /* 4 clickable stages derived from programLogic weekRules */
  const STAGES = [
    { phase: 'recovery', label: 'Technique',  sub: '1 set · RPE ~6',       weekLabel: 'Weeks 1–2',  weekStart: 1, weekCount: 2 },
    { phase: 'recovery', label: 'Volume',     sub: '2 sets · RPE ~7–8',     weekLabel: 'Weeks 3–5',  weekStart: 3, weekCount: 3 },
    { phase: 'ramping',  label: 'Intro',      sub: '1 set · new movements', weekLabel: 'Week 6',     weekStart: 6, weekCount: 1 },
    { phase: 'ramping',  label: 'Overload',   sub: '2–3 sets · to failure', weekLabel: 'Weeks 7–12', weekStart: 7, weekCount: 6 },
  ];


  let currentPhaseName   = ws.currentPhase || 'recovery';
  let currentPhaseData   = currentPhaseName === 'ramping' ? RAMPING : RECOVERY;
  let currentDay         = ws.schedule[ws.currentDayIndex % ws.schedule.length];
  let viewedDayIdx       = ws.currentDayIndex % ws.schedule.length;
  let routineSchedule    = ws.schedule;
  /* Pending sets: keyed by exercise name, holds sets for the current session.
     Only committed to STATE when Complete Session is clicked. */
  const pendingSets = {};

  /* ── Build page shell ── */
  const inner = document.getElementById('workout-inner');
  const activeRoutine = getAllRoutines().find(r => r.id === ws.activeRoutineId) || getAllRoutines()[0];
  inner.innerHTML = `
    ${buildPageHeader(activeRoutine?.name || 'Workout Program', 'Workout', 'Program',
      activeRoutine?.description || 'Tap any exercise for notes & swaps.'
    )}
    <div id="workoutTabPanel"></div>`;

  /* ── Tab routing ── */
  let activeTab = 'today';
  const WORKOUT_TABS = [
    { id: 'today',   label: 'Routine'  },
    { id: 'logbook', label: 'Customize' },
  ];

  function buildTabs() {
    setPageTabs(inner, WORKOUT_TABS, activeTab, id => {
      activeTab = id;
      buildTabs();
      renderTab();
    });
  }

  function renderTab() {
    const panel = document.getElementById('workoutTabPanel');
    switch (activeTab) {
      case 'today':   renderToday();         break;
      case 'logbook': renderLogbook(panel);  break;
    }
  }

  buildTabs();
  renderTab();

  /* ══════════════════════════════════════════════════════════════
     TODAY TAB
     Displays the current scheduled day's exercises.
     Below the exercises: collapsible Morning Routine section,
     then collapsible Stretching section.
     "Log Session" form at the bottom advances the schedule → IDB.
  ══════════════════════════════════════════════════════════════ */
  function renderToday() {
    const panel = document.getElementById('workoutTabPanel');
    const activeRoutine = getAllRoutines().find(r => r.id === ws.activeRoutineId) || getAllRoutines()[0];

    /* Custom routine with built-out stages → dedicated renderer */
    if (activeRoutine?.custom && activeRoutine?.stages?.some(s => s.dayRoutines?.length > 0)) {
      renderCustomRoutineDay(panel, activeRoutine);
      return;
    }

    const isJeff = activeRoutine?.id === 'jeff-nippard-ulppl';

    /* Build staged list with weekStart computed */
    const rawStages = activeRoutine?.stages?.length ? activeRoutine.stages : STAGES;
    let sw = 1;
    const staged = rawStages.map(s => { const r = { ...s, weekStart: sw }; sw += s.weekCount; return r; });
    const totalWeeks = staged.reduce((t, s) => t + s.weekCount, 0);
    const isOngoing  = totalWeeks >= 52;

    const weekNum = ws.weekNumber || 1;
    const activeStageIdx = staged.findIndex(s => weekNum >= s.weekStart && weekNum < s.weekStart + s.weekCount);

    routineSchedule = activeRoutine?.schedule?.length ? activeRoutine.schedule : ws.schedule;
    currentDay = routineSchedule[ws.currentDayIndex % routineSchedule.length];

    /* Stage bar segment */
    function stageSegHTML(s, i) {
      const isCurrent = i === activeStageIdx;
      const isPast    = !isCurrent && weekNum >= s.weekStart + s.weekCount;
      const fill      = isPast ? 100 : isCurrent ? Math.round(((weekNum - s.weekStart) / s.weekCount) * 100) : 0;
      const accent    = s.phase === 'recovery' ? 'var(--accent)' : s.phase === 'ramping' ? 'var(--accent3)' : 'var(--accent)';
      const radius    = i === 0 ? '7px 0 0 7px' : i === staged.length - 1 ? '0 7px 7px 0' : '0';
      return `
        <div data-stageidx="${i}" style="flex:${Math.min(s.weekCount,12)};position:relative;cursor:pointer;border-radius:${radius};overflow:hidden;background:rgba(255,255,255,0.04);border:2px solid ${isCurrent ? accent : 'transparent'};padding:8px 10px;min-width:0">
          <div style="position:absolute;inset:0;background:${accent};opacity:0.13;width:${fill}%;pointer-events:none"></div>
          <div style="font-family:'Rajdhani',sans-serif;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted);position:relative;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.name || s.label || ''}</div>
        </div>`;
    }

    panel.innerHTML = `
      <div class="card" style="margin-bottom:16px">
        <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
          <div class="card-title" style="display:flex;align-items:baseline;gap:8px">
            Progress
            <span style="font-weight:400;font-family:'Rajdhani',sans-serif;font-size:13px;color:var(--muted)">
              Week ${weekNum}${!isOngoing ? ` <span style="opacity:0.45">of</span> ${totalWeeks}` : ''}
            </span>
          </div>
          <button id="progressToggleBtn" class="day-tab" style="padding:4px 12px;font-size:11px;white-space:nowrap">Show Progress</button>
        </div>
        <div class="card-body" style="padding:10px 16px 14px">
          <div style="display:flex;gap:2px" id="stageBar">
            ${staged.map((s, i) => stageSegHTML(s, i)).join('')}
          </div>
          <div class="day-tabs" style="margin-top:12px;flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none" id="dayTabs"></div>
        </div>
        <div id="routineProgressDrop" style="display:none;border-top:1px solid var(--border)"></div>
      </div>

      <div id="workoutContent"></div>

      ${isJeff ? `<div class="section-label" style="margin-top:18px">Training Principles</div><div class="grid-2" id="principlesBody"></div>` : ''}`;

    /* Stage bar clicks */
    panel.querySelectorAll('#stageBar [data-stageidx]').forEach(el => {
      el.addEventListener('click', () => {
        const s = staged[+el.dataset.stageidx];
        ws.weekNumber = s.weekStart;
        if (isJeff && s.phase) {
          currentPhaseName = s.phase;
          currentPhaseData = s.phase === 'ramping' ? RAMPING : RECOVERY;
          STATE.setWorkoutPhase(s.phase);
        } else {
          STATE.save();
        }
        renderToday();
      });
    });

    /* Progress dropdown */
    const progressToggleBtn = panel.querySelector('#progressToggleBtn');
    const progressDrop      = panel.querySelector('#routineProgressDrop');
    let progressOpen = false;
    progressToggleBtn.addEventListener('click', () => {
      progressOpen = !progressOpen;
      progressToggleBtn.textContent = progressOpen ? 'Hide Progress' : 'Show Progress';
      if (progressOpen) { renderRoutineProgressDrop(progressDrop); progressDrop.style.display = ''; }
      else progressDrop.style.display = 'none';
    });

    /* Day tabs */
    const tabsEl = document.getElementById('dayTabs');
    const activeDayIdx = ws.currentDayIndex % routineSchedule.length;
    viewedDayIdx = activeDayIdx;
    routineSchedule.forEach((day, di) => {
      const btn = document.createElement('button');
      btn.className = 'day-tab' + (di === activeDayIdx ? ' active' : '');
      btn.textContent = day;
      btn.addEventListener('click', () => {
        currentDay = day;
        viewedDayIdx = di;
        tabsEl.querySelectorAll('.day-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (isJeff) renderDayContent(); else renderGenericDayContent(activeRoutine);
      });
      tabsEl.appendChild(btn);
    });

    if (isJeff) {
      renderDayContent();
      panel.querySelector('#principlesBody').innerHTML =
        (APP_DATA.healthPrinciples?.workout || []).map(p => `
          <div style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
            <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;color:var(--accent);margin-bottom:4px">${p.title}</div>
            <div style="font-size:12px;color:rgba(226,234,242,0.72);line-height:1.6">${p.body}</div>
          </div>`).join('');
    } else {
      renderGenericDayContent(activeRoutine);
    }
  }

  /* Generic day content for non-Jeff presets */
  function renderGenericDayContent(routine) {
    const content = document.getElementById('workoutContent');
    if (!content) return;
    const isRest  = currentDay.toLowerCase().includes('rest');
    const dayData = PRESET_EXERCISES[routine?.id]?.[currentDay] || null;

    content.innerHTML = `
      <div class="workout-card">
        <div class="workout-card-header">
          <div>
            <div class="workout-card-phase">${routine?.eyebrow || routine?.name || 'Training'}</div>
            <div class="workout-card-day">${currentDay}</div>
            ${dayData ? `<div class="workout-card-focus">${dayData.focus}</div>` : ''}
          </div>
          ${dayData ? `<span class="badge badge-accent">${dayData.exercises.length} exercises</span>` : ''}
        </div>
        ${isRest ? `
        <div style="border-top:1px solid rgba(255,255,255,0.07);padding:16px;text-align:center">
          <div style="font-size:28px;margin-bottom:8px">😴</div>
          <div style="font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;margin-bottom:4px">Rest Day</div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:14px">Active recovery only — walk, stretch, foam roll.</div>
          <button class="day-tab active" id="logRestBtn" style="padding:8px 20px">Mark Rest Day Complete →</button>
        </div>` : `
        <div style="border-top:1px solid rgba(255,255,255,0.07)">
          <div class="exercise-list" id="exerciseList"></div>
          <div style="padding:0 16px 16px">
            <textarea class="venture-notes-input" id="workoutNotes" placeholder="Session notes…" style="height:52px;margin-bottom:10px"></textarea>
            <button class="phase-btn active" id="logWorkoutBtn" style="width:100%;padding:11px;font-size:14px">Complete ${currentDay} Session ✓</button>
          </div>
        </div>`}
      </div>`;

    if (isRest) {
      content.querySelector('#logRestBtn').addEventListener('click', () => {
        STATE.logWorkout('Rest', 'ongoing', [], '');
        renderToday();
      });
      return;
    }

    /* Render exercise rows */
    const list = document.getElementById('exerciseList');
    (dayData?.exercises || []).forEach((ex, i) => {
      const row = document.createElement('div');
      row.className = 'exercise-row';
      row.dataset.exname = ex.name;
      const subOpts = [
        { name: ex.name,  note: ex.note || '' },
        ...(ex.sub1 ? [{ name: ex.sub1, note: '' }] : []),
        ...(ex.sub2 ? [{ name: ex.sub2, note: '' }] : []),
      ];
      const chips = `
        <span class="ex-chip reps">${ex.sets} Sets</span>
        <span class="ex-chip reps">${ex.reps} Reps</span>
        <span class="ex-chip">${ex.muscle}</span>
        <span class="ex-chip">Rest: ${ex.rest}</span>`;

      const SUB_LABELS = ['Primary', 'Sub 1', 'Sub 2'];
      let subIdx = 0;

      if (subOpts.length > 1) {
        row.className = '';
        row.style.cssText = 'display:block;cursor:grab;user-select:none;';
        const n = subOpts.length;
        row.innerHTML = `
          <div class="ex-sub-outer" style="overflow:hidden">
            <div class="ex-sub-track" style="display:flex;will-change:transform;width:${n * 100}%">
              ${subOpts.map((opt, oi) => `
                <div class="ex-sub-slide" style="width:${100/n}%;flex-shrink:0;box-sizing:border-box;padding:3px 4px;display:flex;">
                  <div style="border:1.5px solid var(--border);border-radius:var(--radius-sm);display:flex;align-items:flex-start;gap:12px;padding:10px 12px;cursor:pointer;flex:1">
                    <div class="ex-num" style="width:24px;flex-shrink:0;font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;color:var(--muted);padding-top:2px">${i + 1}</div>
                    <div class="ex-info" style="flex:1;min-width:0">
                      <div style="font-size:9px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${oi === 0 ? 'var(--accent)' : 'rgba(255,255,255,0.45)'};margin-bottom:4px">${SUB_LABELS[oi]}</div>
                      <div class="ex-name">${opt.name}</div>
                      <div class="ex-meta">${chips}</div>
                      ${opt.note ? `<div class="ex-notes">${opt.note}</div>` : ''}
                    </div>
                    <div style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;color:rgba(255,255,255,0.25);padding-top:2px">
                      <span style="font-size:15px">⇄</span>
                      <span style="font-size:8px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:0.5px;text-transform:uppercase">${oi + 1}/${n}</span>
                    </div>
                  </div>
                </div>`).join('')}
            </div>
          </div>`;

        const track = row.querySelector('.ex-sub-track');
        function goTo(idx, animate = true) {
          subIdx = Math.max(0, Math.min(n - 1, idx));
          track.style.transition = animate ? 'transform 0.28s cubic-bezier(0.4,0,0.2,1)' : 'none';
          track.style.transform = `translateX(${-subIdx * row.offsetWidth}px)`;
        }
        let dragX = null, didDrag = false;
        row.addEventListener('mousedown', e => { dragX = e.clientX; didDrag = false; row.style.cursor = 'grabbing'; track.style.transition = 'none'; window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp); });
        const onMove = e => { if (dragX === null) return; const dx = e.clientX - dragX; if (Math.abs(dx) > 4) didDrag = true; const raw = -subIdx * row.offsetWidth + dx; track.style.transform = `translateX(${Math.max(-(n-1)*row.offsetWidth, Math.min(0, raw))}px)`; };
        const onUp = e => { if (dragX === null) return; const dx = e.clientX - dragX; dragX = null; row.style.cursor = 'grab'; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); const t = row.offsetWidth * 0.25; if (dx < -t) goTo(subIdx+1); else if (dx > t) goTo(subIdx-1); else goTo(subIdx); };
        row.addEventListener('click', e => { if (didDrag) { e.stopPropagation(); didDrag = false; } }, true);
        let touchX = null;
        row.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; track.style.transition = 'none'; }, { passive: true });
        row.addEventListener('touchmove', e => { if (touchX === null) return; const dx = e.touches[0].clientX - touchX; const raw = -subIdx * row.offsetWidth + dx; track.style.transform = `translateX(${Math.max(-(n-1)*row.offsetWidth, Math.min(0, raw))}px)`; }, { passive: true });
        row.addEventListener('touchend', e => { if (touchX === null) return; const dx = e.changedTouches[0].clientX - touchX; touchX = null; const t = row.offsetWidth * 0.25; if (dx < -t) goTo(subIdx+1); else if (dx > t) goTo(subIdx-1); else goTo(subIdx); }, { passive: true });
        row.querySelectorAll('.ex-sub-slide').forEach(slide => { slide.addEventListener('click', () => { if (!didDrag) openExModal(ex, i + 1, subOpts[subIdx]); }); });
      } else {
        row.innerHTML = `
          <div class="ex-num">${i + 1}</div>
          <div class="ex-info">
            <div class="ex-name">${ex.name}</div>
            <div class="ex-meta">${chips}</div>
            ${ex.note ? `<div class="ex-notes">${ex.note}</div>` : ''}
          </div>
          <div style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;color:rgba(255,255,255,0.18);align-self:center">
            <span style="font-size:13px">⊘</span>
            <span style="font-size:8px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:0.5px;text-transform:uppercase">no sub</span>
          </div>`;
        row.addEventListener('click', () => openExModal(ex, i + 1, subOpts[0]));
      }
      if (pendingSets[ex.name]) {
        row.style.boxShadow = '0 0 0 1.5px var(--accent)';
        row.style.borderRadius = 'var(--radius-sm)';
      }
      list.appendChild(row);
    });

    content.querySelector('#logWorkoutBtn').addEventListener('click', () => {
      const notes = content.querySelector('#workoutNotes')?.value || '';
      Object.entries(pendingSets).forEach(([name, sets]) => {
        STATE.addLogbookEntry({ dayName: currentDay, phase: 'ongoing', exercises: [{ name, sets }] });
      });
      STATE.logWorkout(currentDay, 'ongoing', [], notes, viewedDayIdx, routineSchedule.length);
      renderToday();
    });
  }

  function renderDayContent() {
    const content = document.getElementById('workoutContent');
    if (!content) return;
const dayData   = currentDay === 'Rest' ? REST_DAY : (currentPhaseData[currentDay] || { focus:'', exercises:[] });
    const phaseName  = currentPhaseName === 'recovery' ? 'Recovery Phase' : 'Ramping Phase';
    const stageIdx   = STAGES.findIndex(s => s.phase === currentPhaseName && (ws.weekNumber||1) >= s.weekStart && (ws.weekNumber||1) < s.weekStart + s.weekCount);
    const stageName  = (STAGES[stageIdx] ?? STAGES[0]).label;

    const sr = APP_DATA.stretchingRoutine || {};

    content.innerHTML = `
      <div class="workout-card">
        <div class="workout-card-header">
          <div>
            <div class="workout-card-phase" style="display:flex;align-items:center;gap:6px">${phaseName}<span style="font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);padding:2px 7px;background:rgba(255,255,255,0.05);border-radius:4px;border:1px solid rgba(255,255,255,0.08)">${stageName}</span></div>
            <div class="workout-card-day">${currentDay}</div>
            <div class="workout-card-focus">${dayData.focus}</div>
          </div>
          <span class="badge badge-accent">${dayData.exercises.length} exercises</span>
        </div>

        ${currentDay !== 'Rest' ? `
        <!-- Warmup section -->
        <div style="border-bottom:1px solid rgba(255,255,255,0.07)">
          <div id="warmupToggle" style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;cursor:pointer">
            <div style="font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--accent)">Warmup</div>
            <span style="font-size:16px;color:var(--muted);transition:transform 0.2s" id="warmupArrow">▾</span>
          </div>
          <div id="warmupBody" style="display:none;padding:0 16px 10px">
            ${(sr.morning || []).map(s => `
              <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
                <div style="flex:1">
                  <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;margin-bottom:2px">${s.name}</div>
                  <div style="font-size:11.5px;color:rgba(226,234,242,0.65);line-height:1.5">${s.instruction}</div>
                </div>
                <span class="badge badge-muted" style="margin-left:10px;flex-shrink:0">${s.duration}</span>
              </div>`).join('')}
          </div>
        </div>` : ''}

        <!-- Routine section -->
        ${currentDay !== 'Rest' ? `
        <div style="border-bottom:1px solid rgba(255,255,255,0.07);padding:10px 16px 4px">
          <div style="font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--accent);margin-bottom:6px">Routine</div>
        </div>` : ''}
        <div class="exercise-list" id="exerciseList"></div>

        ${currentDay !== 'Rest' ? `
        <!-- Stretches section -->
        <div style="border-top:1px solid rgba(255,255,255,0.07)">
          <div id="stretchesToggle" style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;cursor:pointer">
            <div style="font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--accent)">Stretches</div>
            <span style="font-size:16px;color:var(--muted);transition:transform 0.2s" id="stretchesArrow">▾</span>
          </div>
          <div id="stretchesBody" style="display:none;padding:0 16px 10px">
            ${(sr.postWorkout || []).map(s => `
              <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
                <div style="flex:1">
                  <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;margin-bottom:2px">${s.name}</div>
                  <div style="font-size:11.5px;color:rgba(226,234,242,0.65);line-height:1.5">${s.instruction}</div>
                </div>
                <span class="badge badge-muted" style="margin-left:10px;flex-shrink:0">${s.duration}</span>
              </div>`).join('')}
          </div>
        </div>` : ''}

        ${currentDay !== 'Rest' ? `
          <div style="border-top:1px solid rgba(255,255,255,0.07);padding:14px 16px 16px">
            <textarea class="venture-notes-input" id="workoutNotes" placeholder="Session notes — how it felt, what to adjust…" style="height:52px;margin-bottom:10px"></textarea>
            <button class="phase-btn active" id="logWorkoutBtn" style="width:100%;padding:11px;font-size:14px">Complete ${currentDay} Session ✓</button>
          </div>` : `
          <div style="border-top:1px solid rgba(255,255,255,0.07);padding:16px;text-align:center">
            <div style="font-size:28px;margin-bottom:8px">😴</div>
            <div style="font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;margin-bottom:4px">Rest Day</div>
            <div style="font-size:12px;color:var(--muted);margin-bottom:14px">Active recovery only — walk, stretch, foam roll.</div>
            <button class="day-tab active" id="logRestBtn" style="padding:8px 20px">Mark Rest Day Complete →</button>
          </div>`}
      </div>`;

    const list = document.getElementById('exerciseList');
    const weekNum = ws.weekNumber || 1;
    dayData.exercises.forEach((ex, i) => {
      const row = document.createElement('div');
      row.className = 'exercise-row';
      row.dataset.exname = ex.name;
      let subOpts = [{ name: ex.name, note: ex.note || '' }];
      let subIdx  = 0;
      if (currentDay === 'Rest') {
        /* restDay keeps original field names */
        row.innerHTML = `
          <div class="ex-num">${i + 1}</div>
          <div class="ex-info">
            <div class="ex-name">${ex.name}</div>
            <div class="ex-meta">
              <span class="ex-chip">${ex.muscle}</span>
              <span class="ex-chip reps">${ex.reps}</span>
              ${ex.rpe ? `<span class="ex-chip rpe">RPE ${ex.rpe}</span>` : ''}
              <span class="ex-chip">Rest: ${ex.rest}</span>
            </div>
            ${ex.notes ? `<div class="ex-notes">${ex.notes}</div>` : ''}
          </div>`;
      } else {
        const { lastRPE } = getRPEForWeek(ex, currentPhaseName, weekNum);
        const sets = getSets(ex, currentPhaseName, weekNum);
        const rule = getWeekRule(currentPhaseName, weekNum);
        const SUB_LABELS = ['Primary', 'Sub 1', 'Sub 2'];
        subOpts = [
          { name: ex.name, note: ex.note || '' },
          ...(ex.sub1 ? [{ name: ex.sub1, note: '' }] : []),
          ...(ex.sub2 ? [{ name: ex.sub2, note: '' }] : []),
        ];
        const chips = `
          ${ex.warmupSets ? `<span class="ex-chip">${ex.warmupSets} Warmup</span>` : ''}
          <span class="ex-chip reps">${sets} Sets</span>
          <span class="ex-chip reps">${ex.reps} Reps</span>
          <span class="ex-chip rpe">Last RPE ${ex.toFailure && rule?.toFailure ? '→ Failure' : lastRPE}</span>
          <span class="ex-chip">Rest: ${ex.rest}</span>`;

        if (subOpts.length > 1) {
          row.className = '';
          row.style.cssText = 'display:block;cursor:grab;user-select:none;';
          const n = subOpts.length;
          row.innerHTML = `
            <div class="ex-sub-outer" style="overflow:hidden">
              <div class="ex-sub-track" style="display:flex;will-change:transform;width:${n * 100}%">
                ${subOpts.map((opt, oi) => `
                  <div class="ex-sub-slide" style="width:${100 / n}%;flex-shrink:0;box-sizing:border-box;padding:3px 4px;display:flex;">
                    <div style="border:1.5px solid var(--border);border-radius:var(--radius-sm);display:flex;align-items:flex-start;gap:12px;padding:10px 12px;cursor:pointer;flex:1">
                      <div class="ex-num" style="width:24px;flex-shrink:0;font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;color:var(--muted);padding-top:2px">${i + 1}</div>
                      <div class="ex-info" style="flex:1;min-width:0">
                        <div style="font-size:9px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${oi === 0 ? 'var(--accent)' : 'rgba(255,255,255,0.45)'};margin-bottom:4px">${SUB_LABELS[oi]}</div>
                        <div class="ex-name">${opt.name}</div>
                        <div class="ex-meta">${chips}</div>
                        ${opt.note ? `<div class="ex-notes">${opt.note}</div>` : ''}
                      </div>
                      <div style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;color:rgba(255,255,255,0.25);padding-top:2px">
                        <span style="font-size:15px">⇄</span>
                        <span style="font-size:8px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:0.5px;text-transform:uppercase">${oi + 1}/${n}</span>
                      </div>
                    </div>
                  </div>`).join('')}
              </div>
            </div>
            `;

          const track = row.querySelector('.ex-sub-track');

          function goTo(idx, animate = true) {
            subIdx = Math.max(0, Math.min(n - 1, idx));
            track.style.transition = animate ? 'transform 0.28s cubic-bezier(0.4,0,0.2,1)' : 'none';
            track.style.transform = `translateX(${-subIdx * row.offsetWidth}px)`;
          }

          /* Mouse drag — live */
          let dragX = null, didDrag = false;
          row.addEventListener('mousedown', e => {
            dragX = e.clientX; didDrag = false;
            row.style.cursor = 'grabbing';
            track.style.transition = 'none';
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
          });
          const onMove = e => {
            if (dragX === null) return;
            const dx = e.clientX - dragX;
            if (Math.abs(dx) > 4) didDrag = true;
            const raw = -subIdx * row.offsetWidth + dx;
            track.style.transform = `translateX(${Math.max(-(n - 1) * row.offsetWidth, Math.min(0, raw))}px)`;
          };
          const onUp = e => {
            if (dragX === null) return;
            const dx = e.clientX - dragX; dragX = null;
            row.style.cursor = 'grab';
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            const threshold = row.offsetWidth * 0.25;
            if (dx < -threshold) goTo(subIdx + 1);
            else if (dx > threshold) goTo(subIdx - 1);
            else goTo(subIdx);
          };
          row.addEventListener('click', e => { if (didDrag) { e.stopPropagation(); didDrag = false; } }, true);

          /* Touch drag — live */
          let touchX = null;
          row.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; track.style.transition = 'none'; }, { passive: true });
          row.addEventListener('touchmove', e => {
            if (touchX === null) return;
            const dx = e.touches[0].clientX - touchX;
            const raw = -subIdx * row.offsetWidth + dx;
            track.style.transform = `translateX(${Math.max(-(n - 1) * row.offsetWidth, Math.min(0, raw))}px)`;
          }, { passive: true });
          row.addEventListener('touchend', e => {
            if (touchX === null) return;
            const dx = e.changedTouches[0].clientX - touchX; touchX = null;
            const threshold = row.offsetWidth * 0.25;
            if (dx < -threshold) goTo(subIdx + 1);
            else if (dx > threshold) goTo(subIdx - 1);
            else goTo(subIdx);
          }, { passive: true });

          row.querySelectorAll('.ex-sub-slide').forEach(slide => {
            slide.addEventListener('click', () => { if (!didDrag) openExModal(ex, i + 1, subOpts[subIdx]); });
          });
        } else {
          /* Single option: normal exercise-row */
          row.innerHTML = `
            <div class="ex-num">${i + 1}</div>
            <div class="ex-info">
              <div class="ex-name">${ex.name}</div>
              <div class="ex-meta">${chips}</div>
              ${ex.note ? `<div class="ex-notes">${ex.note}</div>` : ''}
            </div>
            <div style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;color:rgba(255,255,255,0.18);align-self:center">
              <span style="font-size:13px">⊘</span>
              <span style="font-size:8px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:0.5px;text-transform:uppercase">no sub</span>
            </div>`;
          row.addEventListener('click', () => openExModal(ex, i + 1, subOpts[0]));
        }
      }
      if (currentDay === 'Rest') {
        row.addEventListener('click', () => openExModal(ex, i + 1, subOpts[0]));
      }
      if (pendingSets[ex.name]) {
        row.style.boxShadow = '0 0 0 1.5px var(--accent)';
        row.style.borderRadius = 'var(--radius-sm)';
      }
      list.appendChild(row);
    });

    content.querySelector('#logWorkoutBtn')?.addEventListener('click', () => {
      const notes = (content.querySelector('#workoutNotes')?.value || '').trim();
      /* Commit all pending sets before advancing the day */
      Object.entries(pendingSets).forEach(([name, sets]) => {
        STATE.addLogbookEntry({ dayName: currentDay, phase: currentPhaseName, exercises: [{ name, sets }] });
      });
      STATE.logWorkout(currentDay, currentPhaseName, [], notes, viewedDayIdx, routineSchedule.length);
      renderToday();
    });
    content.querySelector('#logRestBtn')?.addEventListener('click', () => {
      STATE.logWorkout(currentDay, currentPhaseName, [], '', viewedDayIdx, routineSchedule.length);
      renderToday();
    });

    /* Warmup toggle */
    content.querySelector('#warmupToggle')?.addEventListener('click', () => {
      const body  = content.querySelector('#warmupBody');
      const arrow = content.querySelector('#warmupArrow');
      const open  = body.style.display !== 'none';
      body.style.display = open ? 'none' : 'block';
      arrow.style.transform = open ? '' : 'rotate(180deg)';
    });

    /* Stretches toggle */
    content.querySelector('#stretchesToggle')?.addEventListener('click', () => {
      const body  = content.querySelector('#stretchesBody');
      const arrow = content.querySelector('#stretchesArrow');
      const open  = body.style.display !== 'none';
      body.style.display = open ? 'none' : 'block';
      arrow.style.transform = open ? '' : 'rotate(180deg)';
    });
  }

  /* ── Exercise modal ── */
  const exOverlay = document.getElementById('exModalOverlay');
  const exModal   = document.querySelector('#page-workout .ex-modal');

  function openExModal(ex, _num, opt) {
    const weekNum = ws.weekNumber || 1;
    const isRestDay = currentDay === 'Rest';

    if (isRestDay) {
      document.getElementById('exModalEyebrow').textContent = ex.muscle + ' · Active Recovery';
      document.getElementById('exModalTitle').textContent   = ex.name;
      document.getElementById('exModalChips').innerHTML = `
        <span class="badge badge-accent">${ex.reps}</span>
        ${ex.rpe ? `<span class="badge badge-warn">RPE ${ex.rpe}</span>` : ''}
        <span class="badge badge-muted">Rest ${ex.rest}</span>`;
      document.getElementById('exModalBody').innerHTML = `
        <div class="modal-section">
          <div class="modal-section-label" style="color:var(--accent)">Notes
            <span style="flex:1;height:1px;background:var(--border);display:block;margin-left:10px"></span>
          </div>
          <div class="description-text" style="line-height:1.7">${ex.notes || ''}</div>
        </div>
        <div class="modal-section" style="margin-top:20px">
          <div class="modal-section-label" style="color:var(--accent)">Alternatives
            <span style="flex:1;height:1px;background:var(--border);display:block;margin-left:10px"></span>
          </div>
          <div class="swap-list">
            ${(ex.swaps || []).map((s, si) => `<div class="swap-item"><strong>Option ${si+1}:</strong> ${s}</div>`).join('')}
          </div>
        </div>`;
    } else {
      opt = opt || { name: ex.name, note: ex.note || '' };
      /* Support both Jeff Nippard format (earlyRPE/lastRPE objects) and simple preset format (ex.sets string) */
      const isSimpleFormat = !!ex.sets;
      const { earlyRPE, lastRPE } = isSimpleFormat ? { earlyRPE: '', lastRPE: '' } : getRPEForWeek(ex, currentPhaseName, weekNum);
      const sets     = isSimpleFormat ? ex.sets : getSets(ex, currentPhaseName, weekNum);
      const rule     = isSimpleFormat ? null : getWeekRule(currentPhaseName, weekNum);
      const VIDEO_ID = 'ZaTM37cfiDs';

      document.getElementById('exModalChips').innerHTML = `
        <span class="badge badge-accent">${sets} × ${ex.reps}</span>
        ${!isSimpleFormat ? `<span class="badge badge-warn">Last RPE ${lastRPE}</span>` : ''}
        <span class="badge badge-muted">Rest ${ex.rest}</span>
        ${ex.warmupSets ? `<span class="badge badge-muted">${ex.warmupSets} warmup sets</span>` : ''}
        ${ex.muscle ? `<span class="badge badge-muted">${ex.muscle}</span>` : ''}`;

      document.getElementById('exModalBody').innerHTML = `
        <!-- ── Exercise name ── -->
        <div style="font-family:'Rajdhani',sans-serif;font-size:20px;font-weight:800;color:var(--fg);line-height:1.25;margin-bottom:14px">${opt.name}</div>

        <!-- ── Video ── -->
        <div style="position:relative;width:100%;height:44vh;background:#000;border-radius:12px;overflow:hidden;margin-bottom:14px">
          <iframe
            src="https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&mute=1&rel=0&controls=1&modestbranding=1&loop=1&playlist=${VIDEO_ID}"
            style="position:absolute;inset:0;width:100%;height:100%;border:none"
            allow="autoplay; encrypted-media; fullscreen"
            allowfullscreen
          ></iframe>
        </div>

        <!-- ── Notes ── -->
        <div style="font-size:12px;color:rgba(226,234,242,0.72);line-height:1.7;margin-bottom:14px">${opt.note || 'Focus on quality reps. Control the negative on every set.'}</div>

        ${rule ? `<div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:11px 14px;margin-bottom:20px">
          <div style="font-size:10px;color:var(--accent);font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Week ${weekNum} Prescription</div>
          <div style="font-size:12px;color:rgba(226,234,242,0.75);line-height:1.6">
            <strong>${sets} working set${sets !== 1 ? 's' : ''}</strong> · Early sets: ${earlyRPE} · Last set: ${lastRPE}
            ${ex.toFailure && rule.toFailure ? ' · <span style="color:var(--accent3)">Last set to failure</span>' : ''}
          </div>
          <div style="font-size:11px;color:var(--muted);margin-top:3px;font-style:italic">${rule.note}</div>
        </div>` : ''}

        <!-- ── Log form ── -->
        <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:16px">
          <div style="font-size:10px;color:var(--muted);font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">
            Log: <span style="color:var(--accent)">${opt.name}</span>
          </div>
          <div id="exModalSetList"></div>
          <button id="exAddSetBtn" style="font-size:12px;color:var(--accent);background:none;border:1px dashed rgba(255,255,255,0.15);border-radius:8px;padding:7px 14px;cursor:pointer;width:100%;margin-top:6px">+ Add Set</button>
          <button id="exLogSetsBtn" style="margin-top:10px;width:100%;padding:11px;background:var(--accent);color:#000;border:none;border-radius:10px;font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;cursor:pointer;letter-spacing:0.5px">Exercise Complete ✓</button>
        </div>`;

      document.getElementById('exModalEyebrow').textContent = (currentPhaseName === 'recovery' ? 'Recovery' : 'Ramping') + ' · Wk ' + weekNum;
      document.getElementById('exModalTitle').textContent   = opt.name;

      function addSetRow(setNum) {
        const setList = document.getElementById('exModalSetList');
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px';
        row.innerHTML = `
          <span style="font-size:11px;color:var(--muted);width:40px;flex-shrink:0">Set ${setNum}</span>
          <input class="form-input ex-modal-reps" type="number" placeholder="Reps" min="1" style="flex:1;padding:8px 10px;font-size:13px" />
          <span style="font-size:11px;color:var(--muted)">×</span>
          <input class="form-input ex-modal-weight" type="number" placeholder="lbs" min="0" style="flex:1;padding:8px 10px;font-size:13px" />
          ${setNum > 1 ? `<button class="ex-rm-set" style="background:none;border:none;color:var(--muted);font-size:16px;cursor:pointer;flex-shrink:0;width:24px;line-height:1">×</button>` : '<span style="width:24px;flex-shrink:0"></span>'}`;
        if (setNum > 1) {
          row.querySelector('.ex-rm-set').addEventListener('click', () => {
            row.remove();
            document.getElementById('exModalSetList')?.querySelectorAll('div').forEach((r, i) => {
              const lbl = r.querySelector('span');
              if (lbl) lbl.textContent = `Set ${i + 1}`;
            });
          });
        }
        setList.appendChild(row);
      }
      /* Pre-populate from pending if this exercise was already logged this session */
      const existing = pendingSets[opt.name];
      if (existing && existing.length) {
        existing.forEach((s, si) => {
          addSetRow(si + 1);
          const rows = document.getElementById('exModalSetList').querySelectorAll('div');
          const r = rows[rows.length - 1];
          if (r) {
            r.querySelector('.ex-modal-reps').value   = s.reps   || '';
            r.querySelector('.ex-modal-weight').value = s.weight || '';
          }
        });
      } else {
        addSetRow(1);
      }

      document.getElementById('exAddSetBtn').addEventListener('click', () => {
        const setList = document.getElementById('exModalSetList');
        if (setList.children.length >= 4) return;
        addSetRow(setList.children.length + 1);
        if (setList.children.length >= 4) document.getElementById('exAddSetBtn').style.opacity = '0.35';
      });

      document.getElementById('exLogSetsBtn').addEventListener('click', () => {
        const loggedSets = [];
        document.getElementById('exModalSetList').querySelectorAll('div').forEach(r => {
          const reps   = parseInt(r.querySelector('.ex-modal-reps')?.value)    || 0;
          const weight = parseFloat(r.querySelector('.ex-modal-weight')?.value) || 0;
          loggedSets.push({ reps, weight, duration: null, notes: '' });
        });
        /* Save to pending — committed to STATE only when Complete Session is clicked */
        pendingSets[opt.name] = loggedSets;
        exOverlay.classList.remove('open');
        const exerciseList = document.getElementById('exerciseList');
        const doneRow = exerciseList?.querySelector(`[data-exname="${ex.name}"]`);
        if (doneRow) {
          doneRow.style.boxShadow = '0 0 0 1.5px var(--accent)';
          doneRow.style.borderRadius = 'var(--radius-sm)';
        }
      });
    }
    exOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeExModal() {
    if (exModal) { exModal.style.transform = ''; exModal.style.transition = ''; }
    exOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  exOverlay.addEventListener('click', e => { if (e.target === exOverlay) closeExModal(); });
  document.getElementById('exModalClose').addEventListener('click', closeExModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && exOverlay.classList.contains('open')) closeExModal(); });
  setupSwipeDismiss(exModal, closeExModal);

  /* ══════════════════════════════════════════════════════════════
     ROUTINE PROGRESS DROPDOWN
     Renders inside the Stage Progress card when toggled open.
  ══════════════════════════════════════════════════════════════ */
  function renderRoutineProgressDrop(container) {
    const pics    = ws.progressPics || [];
    const log     = (ws.log     || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    const logbook = (ws.logbook || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    const STATS = APP_DATA.dashboard.stats;
    const bodyW = STATS.find(s => s.label === 'Body Weight') || STATS[0];
    const bodyF = STATS.find(s => s.label === 'Body Fat')    || STATS[1];

    const bodyPct = s => s.invert
      ? (s.current <= s.goal ? 100 : Math.round((s.goal / s.current) * 100))
      : (s.goal > 0 ? Math.min(100, Math.round((s.current / s.goal) * 100)) : 0);

    const fmtFull = d => new Date(d).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });

    container.innerHTML = `
      <div style="padding:14px 16px 12px;display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid var(--border)">
        <!-- Body Weight + Exercise Library -->
        <div style="padding:0 12px 0 0;border-right:1px solid var(--border)">
          <div style="font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:5px">Body Weight</div>
          <div style="font-family:'Rajdhani',sans-serif;font-size:28px;font-weight:700;color:${bodyW.color};line-height:1">${bodyW.value}<span style="font-size:12px;color:var(--muted);margin-left:2px">${bodyW.unit}</span></div>
          <div style="font-size:10px;color:var(--muted);margin-top:3px;margin-bottom:7px">Goal · 200 lbs</div>
          <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden">
            <div style="height:100%;width:${bodyPct(bodyW)}%;background:${bodyW.color};border-radius:2px"></div>
          </div>
          <div style="font-size:10px;color:var(--muted);margin-top:3px;margin-bottom:10px">${bodyPct(bodyW)}% to goal</div>
          <button id="exTrackingBtn" class="day-tab" style="width:100%;padding:5px 0;font-size:11px">Exercise Library</button>
        </div>
        <!-- Body Fat + Session History -->
        <div style="padding:0 0 0 12px">
          <div style="font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:5px">Body Fat</div>
          <div style="font-family:'Rajdhani',sans-serif;font-size:28px;font-weight:700;color:${bodyF.color};line-height:1">${bodyF.value}<span style="font-size:12px;color:var(--muted);margin-left:2px">${bodyF.unit}</span></div>
          <div style="font-size:10px;color:var(--muted);margin-top:3px;margin-bottom:7px">Goal · 15%</div>
          <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden">
            <div style="height:100%;width:${bodyPct(bodyF)}%;background:${bodyF.color};border-radius:2px"></div>
          </div>
          <div style="font-size:10px;color:var(--muted);margin-top:3px;margin-bottom:10px">${bodyPct(bodyF)}% to goal</div>
          <button id="sessionHistoryBtn" class="day-tab" style="width:100%;padding:5px 0;font-size:11px">Session History</button>
        </div>
      </div>
      <div id="exTrackingList" style="display:none"></div>
      <div id="sessionHistoryList" style="display:none"></div>
      <!-- Progress photos -->
      <div style="border-top:1px solid var(--border);padding:10px 16px 10px;display:flex;align-items:center;justify-content:space-between;gap:8px">
        <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--muted)">Progress Photos</div>
        <div style="display:flex;align-items:center;gap:6px">
          <input type="text" class="form-input" id="routinePicNote" style="width:140px;padding:4px 8px;font-size:11px" value="${new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}" />
          ${pics.length > 1 ? `<button id="routineReorderBtn" class="day-tab" style="padding:4px 12px;font-size:11px;white-space:nowrap">Reorder</button>` : ''}
          <button id="routineAddPicBtn" class="day-tab active" style="padding:4px 12px;font-size:11px;white-space:nowrap">+ Add</button>
          <input type="file" id="routinePicFile" accept="image/*" style="display:none" />
        </div>
      </div>
      ${pics.length === 0
        ? `<div style="padding:4px 16px 10px;font-size:12px;color:var(--muted)">No progress photos yet.</div>`
        : `<div class="progress-pics-strip" id="routinePicsStrip"></div>`}`;

    container.querySelector('#routineAddPicBtn').addEventListener('click', () => {
      container.querySelector('#routinePicFile').click();
    });
    container.querySelector('#routinePicFile').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const note   = container.querySelector('#routinePicNote').value.trim();
      const reader = new FileReader();
      reader.onload = ev => {
        STATE.addProgressPic(ev.target.result, note);
        renderRoutineProgressDrop(container);
      };
      reader.readAsDataURL(file);
    });

    if (pics.length > 0) {
      const strip = container.querySelector('#routinePicsStrip');
      let reorderMode = false;

      const buildCards = () => {
        strip.innerHTML = '';
        (ws.progressPics || []).forEach((pic, idx, arr) => {
          const card = document.createElement('div');
          card.className = 'progress-pic-card routine-pic';
          card.innerHTML = `
            <img src="${pic.dataUrl}" alt="Progress ${idx + 1}" class="progress-pic-img" draggable="false" />
            <div class="progress-pic-meta" style="position:absolute;bottom:0;left:0;right:0;z-index:2;padding:28px 10px 8px;background:linear-gradient(to top,rgba(0,0,0,0.72) 0%,rgba(0,0,0,0.38) 50%,transparent 100%)">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:6px">
                <div class="progress-pic-date" style="color:#fff">${pic.note || new Date(pic.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
                ${reorderMode
                  ? `<div style="display:flex;gap:4px">
                      <button class="rpo-left"  style="background:rgba(255,255,255,0.2);border:none;border-radius:4px;color:#fff;font-size:12px;padding:2px 6px;cursor:pointer;line-height:1;${idx === 0 ? 'opacity:0.3;pointer-events:none' : ''}">←</button>
                      <button class="rpo-right" style="background:rgba(255,255,255,0.2);border:none;border-radius:4px;color:#fff;font-size:12px;padding:2px 6px;cursor:pointer;line-height:1;${idx === arr.length - 1 ? 'opacity:0.3;pointer-events:none' : ''}">→</button>
                      <button class="rpo-del"   style="background:rgba(220,50,50,0.55);border:none;border-radius:4px;color:#fff;font-size:10px;padding:2px 6px;cursor:pointer;line-height:1.4">✕</button>
                    </div>`
                  : ''
                }
              </div>
            </div>`;

          if (reorderMode) {
            card.querySelector('.rpo-del').addEventListener('click', e => {
              e.stopPropagation();
              if (!confirm('Remove this progress photo?')) return;
              STATE.removeProgressPic(idx);
              renderRoutineProgressDrop(container);
            });
            const leftBtn  = card.querySelector('.rpo-left');
            const rightBtn = card.querySelector('.rpo-right');
            if (leftBtn)  leftBtn.addEventListener('click',  e => { e.stopPropagation(); STATE.reorderProgressPics(idx, idx - 1); buildCards(); });
            if (rightBtn) rightBtn.addEventListener('click', e => { e.stopPropagation(); STATE.reorderProgressPics(idx, idx + 1); buildCards(); });
          }

          strip.appendChild(card);
        });
      };

      buildCards();

      const reorderBtn = container.querySelector('#routineReorderBtn');
      if (reorderBtn) {
        reorderBtn.addEventListener('click', () => {
          reorderMode = !reorderMode;
          reorderBtn.textContent = reorderMode ? 'Done' : 'Reorder';
          reorderBtn.classList.toggle('active', reorderMode);
          buildCards();
        });
      }

      /* horizontal scroll by mouse drag */
      let isScrollDragging = false, startX = 0, scrollLeft = 0;
      strip.addEventListener('mousedown', e => {
        if (e.target.closest('button')) return;
        isScrollDragging = true; startX = e.pageX - strip.offsetLeft; scrollLeft = strip.scrollLeft;
        strip.style.cursor = 'grabbing'; strip.style.userSelect = 'none';
      });
      strip.addEventListener('mouseleave', () => { isScrollDragging = false; strip.style.cursor = ''; });
      strip.addEventListener('mouseup',    () => { isScrollDragging = false; strip.style.cursor = ''; strip.style.userSelect = ''; });
      strip.addEventListener('mousemove', e => { if (!isScrollDragging) return; e.preventDefault(); strip.scrollLeft = scrollLeft - (e.pageX - strip.offsetLeft - startX); });
    }

    /* Build most-recent weight × reps per exercise from logbook */
    const latest = new Map();
    logbook.forEach(entry => {
      (entry.exercises || []).forEach(ex => {
        const sets = (ex.sets || []).filter(s => s.reps || s.weight);
        if (!sets.length || latest.has(ex.name)) return;
        const last = sets[sets.length - 1];
        latest.set(ex.name, { weight: last.weight || 0, reps: last.reps || 0, date: entry.date });
      });
    });

    const sessionBtn  = container.querySelector('#sessionHistoryBtn');
    const sessionList = container.querySelector('#sessionHistoryList');
    const exBtn       = container.querySelector('#exTrackingBtn');
    const exList      = container.querySelector('#exTrackingList');
    let sessionOpen = false;
    let exOpen      = false;

    sessionBtn.addEventListener('click', () => {
      sessionOpen = !sessionOpen;
      sessionBtn.textContent = sessionOpen ? 'Hide' : 'Session History';
      if (sessionOpen && exOpen) {
        exOpen = false;
        exBtn.textContent = 'Exercise Library';
        exList.style.display = 'none';
      }
      if (sessionOpen) {
        sessionList.innerHTML = log.length === 0
          ? `<div style="padding:8px 16px 14px;font-size:12px;color:var(--muted)">No sessions logged yet.</div>`
          : `<div style="max-height:220px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--border) transparent">${log.slice(0, 50).map((entry, i) => `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;${i % 2 === 1 ? 'background:rgba(255,255,255,0.02)' : ''}border-bottom:1px solid rgba(255,255,255,0.03)">
                <div>
                  <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700">${entry.dayName}</div>
                  ${entry.notes ? `<div style="font-size:11px;color:rgba(226,234,242,0.5);margin-top:2px;line-height:1.4">${entry.notes}</div>` : ''}
                </div>
                <div style="text-align:right;flex-shrink:0;margin-left:12px">
                  <div style="font-size:11px;color:var(--muted)">${fmtFull(entry.date)}</div>
                  <div style="font-size:10px;color:var(--muted);margin-top:2px;text-transform:capitalize">${entry.phase}</div>
                </div>
              </div>`).join('')}</div>`;
        sessionList.style.display = '';
      } else {
        sessionList.style.display = 'none';
      }
    });

    exBtn.addEventListener('click', () => {
      exOpen = !exOpen;
      exBtn.textContent = exOpen ? 'Hide' : 'Exercise Library';
      if (exOpen && sessionOpen) {
        sessionOpen = false;
        sessionBtn.textContent = 'Session History';
        sessionList.style.display = 'none';
      }
      if (exOpen) {
        exList.innerHTML = latest.size === 0
          ? `<div style="padding:8px 16px 14px;font-size:12px;color:var(--muted)">No exercises logged yet.</div>`
          : `<div style="max-height:220px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--border) transparent">
              <div style="display:grid;grid-template-columns:1fr 72px 56px;padding:8px 16px 6px;border-bottom:1px solid rgba(255,255,255,0.05)">
                <div style="font-size:9px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted)">Exercise</div>
                <div style="font-size:9px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);text-align:right">Weight</div>
                <div style="font-size:9px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);text-align:right">Reps</div>
              </div>
              ${[...latest.entries()].map(([name, rec], i) => `
                <div style="display:grid;grid-template-columns:1fr 72px 56px;align-items:center;padding:10px 16px;${i % 2 === 1 ? 'background:rgba(255,255,255,0.02)' : ''}border-bottom:1px solid rgba(255,255,255,0.03)">
                  <div>
                    <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700">${name}</div>
                    <div style="font-size:10px;color:var(--muted);margin-top:1px">${new Date(rec.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
                  </div>
                  <div style="text-align:right;font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;color:var(--accent)">
                    ${rec.weight ? `${rec.weight}<span style="font-size:10px;color:var(--muted)">lbs</span>` : '—'}
                  </div>
                  <div style="text-align:right;font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700">
                    ${rec.reps || '—'}
                  </div>
                </div>`).join('')}
            </div>`;
        exList.style.display = '';
      } else {
        exList.style.display = 'none';
      }
    });
  }

  /* ══════════════════════════════════════════════════════════════
     LOGBOOK TAB
     Top: current stats table — most recent weight × reps per exercise.
     Bottom: session history from ws.log (date, day, notes).
     Data shape: logbook[].{ date, exercises[].{ name, sets[].{ reps, weight } } }
  ══════════════════════════════════════════════════════════════ */
  function renderLogbook(panel) {
    const logbook = (ws.logbook || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    const log     = (ws.log     || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));

    /* Build per-exercise PB stats across all sessions */
    const latest = new Map();
    logbook.forEach(entry => {
      (entry.exercises || []).forEach(ex => {
        const sets = (ex.sets || []).filter(s => s.reps || s.weight);
        if (!sets.length) return;
        if (!latest.has(ex.name)) {
          latest.set(ex.name, { maxWeight: 0, maxVolSet: 0, lastDate: entry.date, totalSets: 0 });
        }
        const rec = latest.get(ex.name);
        sets.forEach(s => {
          const w = parseFloat(s.weight) || 0;
          const r = parseInt(s.reps)    || 0;
          if (w > rec.maxWeight) rec.maxWeight = w;
          const vol = w * r;
          if (vol > rec.maxVolSet) rec.maxVolSet = vol;
        });
        rec.totalSets += sets.length;
        if (new Date(entry.date) > new Date(rec.lastDate)) rec.lastDate = entry.date;
      });
    });

    /* Add exercises from routines that haven't been logged yet */
    const addUnlogged = name => { if (name && !latest.has(name)) latest.set(name, { maxWeight: 0, maxVolSet: 0, lastDate: null, totalSets: 0 }); };
    /* Jeff Nippard preset — all days in recovery + ramping phases */
    [APP_DATA.workout.recovery, APP_DATA.workout.ramping].forEach(phase => {
      Object.values(phase || {}).forEach(day => (day.exercises || []).forEach(ex => addUnlogged(ex.name)));
    });
    /* Custom routines */
    (ws.routines || []).forEach(r => (r.stages || []).forEach(s => (s.dayRoutines || []).forEach(d => (d.exercises || []).forEach(ex => addUnlogged(ex.name)))));
    /* Sort: favourites first, then logged (by lastDate desc), then unlogged alphabetically */
    const favSet = new Set(ws.favoriteExercises || []);
    const sortedLatest = [...latest.entries()].sort(([na, a], [nb, b]) => {
      const fa = favSet.has(na), fb = favSet.has(nb);
      if (fa && !fb) return -1;
      if (!fa && fb) return 1;
      if (a.lastDate && !b.lastDate) return -1;
      if (!a.lastDate && b.lastDate) return 1;
      if (a.lastDate && b.lastDate) return new Date(b.lastDate) - new Date(a.lastDate);
      return na.localeCompare(nb);
    });

    const fmtDate  = d => new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric' });
    const fmtFull  = d => new Date(d).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });

    const bg = ws.bodyGoals || {};

    panel.innerHTML = `

      <!-- ══ Goals card ══ -->
      <div class="card" style="margin-bottom:16px;overflow:hidden">
        <div style="padding:14px 20px 12px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
          <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--muted)">Goals</div>
          <button id="saveGoalsBtn" class="day-tab active" style="padding:4px 14px;font-size:11px">Save</button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">

          <!-- Body Weight -->
          <div style="padding:16px 20px;border-right:1px solid var(--border)">
            <div style="font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:10px">Body Weight</div>
            <div style="margin-bottom:10px">
              <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Current (lbs)</div>
              <input id="goalCurWeight" type="number" class="form-input" style="width:100%;padding:6px 10px;font-size:13px" placeholder="e.g. 176" value="${bg.currentWeight || ''}" />
            </div>
            <div>
              <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Goal (lbs)</div>
              <input id="goalTgtWeight" type="number" class="form-input" style="width:100%;padding:6px 10px;font-size:13px" placeholder="e.g. 200" value="${bg.goalWeight || ''}" />
            </div>
          </div>

          <!-- Body Fat -->
          <div style="padding:16px 20px">
            <div style="font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:10px">Body Fat %</div>
            <div style="margin-bottom:10px">
              <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Current (%)</div>
              <input id="goalCurBF" type="number" class="form-input" style="width:100%;padding:6px 10px;font-size:13px" placeholder="e.g. 16" value="${bg.currentBF || ''}" />
            </div>
            <div>
              <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Goal (%)</div>
              <input id="goalTgtBF" type="number" class="form-input" style="width:100%;padding:6px 10px;font-size:13px" placeholder="e.g. 15" value="${bg.goalBF || ''}" />
            </div>
          </div>

        </div>
      </div>

      <!-- ══ Routine Selection ══ -->
      <div class="card" id="routineSelectionCard" style="margin-bottom:16px">
        <div style="padding:12px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
          <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--muted)">Routine Selection</div>
          <span id="routineCountBadge" style="font-size:11px;color:var(--muted)">${getAllRoutines().length} routines</span>
        </div>
        <div id="routineList" style="overflow-x:auto;-webkit-overflow-scrolling:touch"></div>
      </div>

      <!-- ══ Exercise Library ══ -->
      <div class="card" style="margin-bottom:16px;overflow:hidden">
        <div style="padding:12px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
          <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--muted)">Exercise Library</div>
          <span style="font-size:11px;color:var(--muted)">${latest.size} exercises</span>
        </div>
        ${latest.size === 0 ? `
          <div style="padding:32px;text-align:center;color:var(--muted);font-size:13px">
            Log sets via the exercise modals on the Routine tab.
          </div>` : `
          <div style="display:grid;grid-template-columns:32px 1fr 90px 90px 20px;padding:8px 20px 6px;border-bottom:1px solid rgba(255,255,255,0.05)">
            <div></div>
            <div style="font-size:9px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted)">Exercise</div>
            <div style="font-size:9px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);text-align:right">PB Weight</div>
            <div style="font-size:9px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);text-align:right">PB Volume</div>
          </div>
          <div id="liftTable" class="lift-table-scroll" style="max-height:400px;overflow-y:auto">
            ${sortedLatest.map(([name, rec], i) => `
              <div class="lift-row" data-exname="${name.replace(/"/g,'&quot;')}" style="display:grid;grid-template-columns:32px 1fr 90px 90px 20px;align-items:center;padding:10px 20px;cursor:pointer;${i % 2 === 1 ? 'background:rgba(255,255,255,0.02)' : ''}">
                <button class="fav-toggle" data-exname="${name.replace(/"/g,'&quot;')}" style="background:none;border:none;padding:0;cursor:pointer;font-size:20px;line-height:1;color:${favSet.has(name) ? '#f5c518' : 'rgba(255,255,255,0.2)'}" title="${favSet.has(name) ? 'Unfavourite' : 'Favourite'}">${favSet.has(name) ? '★' : '☆'}</button>
                <div>
                  <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700">${name}</div>
                  <div style="font-size:10px;color:var(--muted);margin-top:1px">${rec.lastDate ? `${fmtDate(rec.lastDate)} · ${rec.totalSets} sets` : 'No logs yet'}</div>
                </div>
                <div style="text-align:right;font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;color:var(--accent)">
                  ${rec.maxWeight ? `${rec.maxWeight}<span style="font-size:10px;color:var(--muted)"> lbs</span>` : '—'}
                </div>
                <div style="text-align:right;font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;color:var(--fg)">
                  ${rec.maxVolSet ? `${rec.maxVolSet.toLocaleString()}<span style="font-size:10px;color:var(--muted)"> lbs</span>` : '—'}
                </div>
                <div style="text-align:right;color:var(--muted);font-size:12px">›</div>
              </div>`).join('')}
          </div>`}
      </div>

      <!-- ══ Session History ══ -->
      <div class="card" style="overflow:hidden">
        <div style="padding:12px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
          <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--muted)">Session History</div>
          <span style="font-size:11px;color:var(--muted)">${log.length} sessions</span>
        </div>
        <div class="lift-table-scroll" style="max-height:400px;overflow-y:auto">
          ${log.length === 0 ? `
            <div style="padding:32px;text-align:center;color:var(--muted);font-size:13px">
              Complete sessions on the Routine tab to build your history.
            </div>` :
            log.map((entry, i) => `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 20px;${i % 2 === 1 ? 'background:rgba(255,255,255,0.02)' : ''}border-bottom:1px solid rgba(255,255,255,0.03)">
                <div>
                  <div style="font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700">${entry.dayName}</div>
                  ${entry.notes ? `<div style="font-size:11px;color:rgba(226,234,242,0.5);margin-top:2px;line-height:1.4">${entry.notes}</div>` : ''}
                </div>
                <div style="text-align:right;flex-shrink:0;margin-left:12px">
                  <div style="font-size:11px;color:var(--muted)">${fmtFull(entry.date)}</div>
                  <div style="font-size:10px;color:var(--muted);margin-top:2px;text-transform:capitalize">${entry.phase}</div>
                </div>
              </div>`).join('')}
        </div>
      </div>`;

    /* ── Goals save ── */
    panel.querySelector('#saveGoalsBtn').addEventListener('click', () => {
      STATE.saveBodyGoals({
        currentWeight: panel.querySelector('#goalCurWeight').value.trim(),
        goalWeight:    panel.querySelector('#goalTgtWeight').value.trim(),
        currentBF:     panel.querySelector('#goalCurBF').value.trim(),
        goalBF:        panel.querySelector('#goalTgtBF').value.trim(),
      });
      const btn = panel.querySelector('#saveGoalsBtn');
      btn.textContent = 'Saved ✓';
      setTimeout(() => { btn.textContent = 'Save'; }, 1500);
    });

    /* ── Routine Selection ── */
    function renderRoutineList() {
      const list = panel.querySelector('#routineList');
      if (!list) return;
      const all      = getAllRoutines();
      const activeId = ws.activeRoutineId;

      /* Active routine first, rest in original order */
      const sorted = [...all].sort((a, b) => (b.id === activeId) - (a.id === activeId));

      list.style.cssText = 'overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none';
      list.innerHTML = `
        <div style="display:flex;gap:12px;padding:12px 16px 16px;scroll-snap-type:x mandatory;width:max-content;min-width:100%">

          ${sorted.map(r => {
            const isActive = r.id === activeId;
            const isCustom = !!r.custom;
            const gradient = r.gradient || 'linear-gradient(135deg,rgba(255,255,255,0.1) 0%,rgba(255,255,255,0.04) 100%)';
            const icon     = r.icon || '📋';
            const eyebrow  = r.eyebrow || (isCustom ? 'Custom Plan' : 'Training Program');

            return `
            <div style="flex:0 0 260px;border-radius:14px;overflow:hidden;border:1.5px solid ${isActive ? 'var(--accent)' : 'var(--border)'};scroll-snap-align:start;display:flex;flex-direction:column;${isActive ? 'box-shadow:0 0 0 2px rgba(255,107,53,0.2)' : ''}">

              <!-- Banner -->
              <div style="background:${gradient};padding:16px 14px 14px;position:relative;min-height:100px;display:flex;flex-direction:column;justify-content:flex-end;flex-shrink:0">
                <div style="position:absolute;top:10px;right:12px;font-size:30px;opacity:0.3;line-height:1">${icon}</div>
                ${isActive ? `<div style="position:absolute;top:10px;left:12px;font-family:'Rajdhani',sans-serif;font-size:8px;font-weight:700;letter-spacing:2px;text-transform:uppercase;background:rgba(0,0,0,0.5);color:#fff;padding:2px 8px;border-radius:20px">● Active</div>` : ''}
                <div style="font-family:'Rajdhani',sans-serif;font-size:8px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:4px">${eyebrow}</div>
                <div style="font-family:'Rajdhani',sans-serif;font-size:18px;font-weight:800;color:#fff;line-height:1.1;text-shadow:0 1px 4px rgba(0,0,0,0.4)">${r.name}</div>
              </div>

              <!-- Body -->
              <div style="background:var(--surface);padding:12px 14px;display:flex;flex-direction:column;flex:1">
                <p style="font-size:11px;color:rgba(226,234,242,0.6);line-height:1.55;margin:0 0 10px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${r.description || ''}</p>

                ${r.daysPerWeek || r.duration || r.level || r.tags?.length ? `
                <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">
                  ${r.daysPerWeek ? `<span style="font-size:9px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;background:rgba(255,255,255,0.07);padding:2px 7px;border-radius:20px;color:var(--muted)">${r.daysPerWeek}×/wk</span>` : ''}
                  ${r.duration   ? `<span style="font-size:9px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;background:rgba(255,255,255,0.07);padding:2px 7px;border-radius:20px;color:var(--muted)">${r.duration}</span>` : ''}
                  ${r.level      ? `<span style="font-size:9px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;background:rgba(255,255,255,0.07);padding:2px 7px;border-radius:20px;color:var(--muted)">${r.level}</span>` : ''}
                  ${(r.tags||[]).map(t => `<span style="font-size:9px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;background:rgba(255,107,53,0.12);padding:2px 7px;border-radius:20px;color:var(--accent)">${t}</span>`).join('')}
                </div>` : ''}

                <div style="display:flex;gap:6px;margin-top:auto">
                  ${isActive
                    ? `<div style="flex:1;text-align:center;padding:8px 6px;background:rgba(255,107,53,0.1);border-radius:8px;font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--accent)">● Active</div>`
                    : `<button class="rsel-preview" data-rid="${r.id}" style="flex:1;padding:8px 6px;background:var(--accent);color:#000;border:none;border-radius:8px;font-family:'Rajdhani',sans-serif;font-size:12px;font-weight:700;cursor:pointer">Select</button>`
                  }
                  ${isCustom ? `<button class="rsel-build" data-rid="${r.id}" style="padding:8px 10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;color:var(--fg);font-size:13px;cursor:pointer" title="Edit">✏️</button>` : ''}
                  ${isCustom && !isActive ? `<button class="rsel-del" data-rid="${r.id}" style="padding:8px 10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:var(--muted);font-size:13px;cursor:pointer" title="Remove">✕</button>` : ''}
                </div>
              </div>
            </div>`;
          }).join('')}

          <!-- Create Custom Plan card -->
          <div id="createCustomBtn" style="flex:0 0 200px;border-radius:14px;border:1.5px dashed rgba(255,255,255,0.12);scroll-snap-align:start;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:24px 16px;cursor:pointer;background:rgba(255,255,255,0.02);transition:background 0.2s">
            <div style="width:44px;height:44px;border-radius:50%;border:1.5px dashed rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:22px;color:rgba(255,255,255,0.3)">+</div>
            <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;color:var(--muted);text-align:center;line-height:1.4">Create Custom<br>Plan</div>
          </div>

        </div>`;

      /* Wire events */
      list.querySelectorAll('.rsel-preview').forEach(btn => {
        btn.addEventListener('click', () => openRoutinePreview(btn.dataset.rid));
      });

      list.querySelectorAll('.rsel-del').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!confirm('Remove this custom routine?')) return;
          STATE.removeRoutine(btn.dataset.rid);
          renderRoutineList();
          const badge = panel.querySelector('#routineCountBadge');
          if (badge) badge.textContent = `${getAllRoutines().length} routines`;
        });
      });

      list.querySelectorAll('.rsel-build').forEach(btn => {
        btn.addEventListener('click', () => openRoutineBuilder(btn.dataset.rid));
      });

      /* Create custom — create empty routine then immediately open builder */
      list.querySelector('#createCustomBtn').addEventListener('click', () => {
        const newId = STATE.addRoutine('New Custom Plan', '');
        renderRoutineList();
        const badge = panel.querySelector('#routineCountBadge');
        if (badge) badge.textContent = `${getAllRoutines().length} routines`;
        openRoutineBuilder(newId);
      });

      /* ── Drag-to-scroll (mouse) ── */
      let dragStart = null, dragScrollLeft = 0, didDrag = false;
      list.style.cursor = 'grab';
      list.addEventListener('mousedown', e => {
        if (e.button !== 0) return;
        dragStart = e.clientX;
        dragScrollLeft = list.scrollLeft;
        didDrag = false;
        list.style.cursor = 'grabbing';
        list.style.userSelect = 'none';
      });
      window.addEventListener('mousemove', e => {
        if (dragStart === null) return;
        const dx = dragStart - e.clientX;
        if (Math.abs(dx) > 4) didDrag = true;
        list.scrollLeft = dragScrollLeft + dx;
      });
      window.addEventListener('mouseup', () => {
        if (dragStart === null) return;
        dragStart = null;
        list.style.cursor = 'grab';
        list.style.userSelect = '';
      });
      /* Suppress click on child elements when drag occurred */
      list.addEventListener('click', e => {
        if (didDrag) { e.stopPropagation(); e.preventDefault(); didDrag = false; }
      }, true);
    }
    renderRoutineList();

    /* ── Exercise Library modal (created once, reused) ── */
    let liftHistoryOverlay = document.getElementById('liftHistoryOverlay');
    if (!liftHistoryOverlay) {
      liftHistoryOverlay = document.createElement('div');
      liftHistoryOverlay.id = 'liftHistoryOverlay';
      liftHistoryOverlay.className = 'ex-modal-overlay';
      liftHistoryOverlay.innerHTML = `
        <div class="ex-modal">
          <div class="modal-drag-handle"></div>
          <div class="ex-modal-header">
            <div class="ex-modal-info">
              <div class="ex-modal-eyebrow" id="liftHistoryEyebrow">Exercise Library</div>
              <div class="ex-modal-title" id="liftHistoryName"></div>
            </div>
            <button class="modal-close" id="liftHistoryClose">✕</button>
          </div>
          <div class="ex-modal-body" id="liftHistoryBody"></div>
        </div>`;
      document.body.appendChild(liftHistoryOverlay);
    }

    function openLiftHistory(exName) {
      document.getElementById('liftHistoryName').textContent    = exName;
      document.getElementById('liftHistoryEyebrow').textContent = 'Exercise Library';

      const body = document.getElementById('liftHistoryBody');

      function renderHistory() {
        const sessions = (ws.logbook || [])
          .map(entry => {
            const ex = (entry.exercises || []).find(e => e.name === exName);
            if (!ex) return null;
            const sets = ex.sets || [];
            return { date: entry.date, sets };
          })
          .filter(Boolean)
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        /* Compute PBs across all sets */
        let pbWeight = 0, pbVolSet = 0, pbVolReps = 0, pbVolWeight = 0;
        sessions.forEach(s => s.sets.forEach(set => {
          const w = parseFloat(set.weight) || 0, r = parseInt(set.reps) || 0;
          if (w > pbWeight) pbWeight = w;
          const vol = w * r;
          if (vol > pbVolSet) { pbVolSet = vol; pbVolReps = r; pbVolWeight = w; }
        }));

        body.innerHTML = `
          <!-- PB panel -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid var(--border);margin-bottom:4px">
            <div style="padding:14px 16px;border-right:1px solid var(--border)">
              <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:var(--muted);margin-bottom:6px">PB Max Weight</div>
              <div style="font-family:'Rajdhani',sans-serif;font-size:30px;font-weight:700;color:var(--accent);line-height:1">
                ${pbWeight ? `${pbWeight}<span style="font-size:12px;color:var(--muted);margin-left:3px">lbs</span>` : '—'}
              </div>
              ${pbWeight ? `<div style="font-size:10px;color:var(--muted);margin-top:4px">Heaviest single set</div>` : ''}
            </div>
            <div style="padding:14px 16px">
              <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:var(--muted);margin-bottom:6px">PB Max Volume</div>
              <div style="font-family:'Rajdhani',sans-serif;font-size:30px;font-weight:700;color:var(--fg);line-height:1">
                ${pbVolSet ? `${pbVolSet.toLocaleString()}<span style="font-size:12px;color:var(--muted);margin-left:3px">lbs</span>` : '—'}
              </div>
              ${pbVolSet ? `<div style="font-size:10px;color:var(--muted);margin-top:4px">${pbVolReps} reps × ${pbVolWeight} lbs</div>` : ''}
            </div>
          </div>

          <!-- Session count header -->
          <div style="padding:10px 16px 4px">
            <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--muted)">${sessions.length} Session${sessions.length !== 1 ? 's' : ''}</div>
          </div>

          ${sessions.length === 0
            ? `<div style="padding:28px;text-align:center;color:var(--muted);font-size:13px">No sets logged yet.</div>`
            : sessions.map((s, si) => `
                <div style="padding:10px 16px 12px;${si > 0 ? 'border-top:1px solid rgba(255,255,255,0.05)' : ''}">

                  <!-- Session header: date + delete session -->
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                    <div style="font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--accent)">
                      ${new Date(s.date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'})}
                    </div>
                    <button class="lh-del-session" data-date="${s.date}" title="Delete this session"
                      style="background:none;border:none;color:var(--muted);font-size:14px;cursor:pointer;padding:2px 6px;border-radius:5px;transition:color 0.15s">🗑</button>
                  </div>

                  <!-- Column headers -->
                  <div style="display:grid;grid-template-columns:36px 1fr 18px 1fr 56px 26px;align-items:center;gap:4px;padding:0 0 4px;border-bottom:1px solid rgba(255,255,255,0.04);margin-bottom:4px">
                    <span style="font-size:9px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted)">Set</span>
                    <span style="font-size:9px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted);text-align:center">Weight</span>
                    <span></span>
                    <span style="font-size:9px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted);text-align:center">Reps</span>
                    <span style="font-size:9px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted);text-align:right">Volume</span>
                    <span></span>
                  </div>

                  <!-- Set rows (editable) -->
                  ${s.sets.map((set, j) => {
                    const w = parseFloat(set.weight) || 0, r = parseInt(set.reps) || 0;
                    const vol = w * r;
                    const isPBW = w === pbWeight && pbWeight > 0;
                    const isPBV = vol === pbVolSet && pbVolSet > 0;
                    return `
                    <div style="display:grid;grid-template-columns:36px 1fr 18px 1fr 56px 26px;align-items:center;gap:4px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.03)">
                      <span style="font-family:'Rajdhani',sans-serif;font-size:11px;color:var(--muted)">S${j+1}${isPBW||isPBV?'<span style="color:var(--accent);margin-left:2px">★</span>':''}</span>
                      <input class="lh-weight form-input" data-date="${s.date}" data-si="${j}"
                        style="padding:4px 6px;font-size:13px;font-weight:700;text-align:center;color:${isPBW?'var(--accent)':'var(--fg)'};background:${isPBW?'rgba(255,107,53,0.08)':'rgba(255,255,255,0.05)'}"
                        type="number" step="0.5" min="0" value="${set.weight||''}" placeholder="lbs" />
                      <span style="font-size:11px;color:var(--muted);text-align:center">×</span>
                      <input class="lh-reps form-input" data-date="${s.date}" data-si="${j}"
                        style="padding:4px 6px;font-size:13px;font-weight:700;text-align:center"
                        type="number" min="0" value="${set.reps||''}" placeholder="reps" />
                      <span class="lh-vol" data-date="${s.date}" data-si="${j}"
                        style="font-family:'Rajdhani',sans-serif;font-size:12px;font-weight:700;color:${isPBV?'var(--accent3)':'var(--muted)'};text-align:right">
                        ${vol ? vol.toLocaleString() : '—'}
                      </span>
                      <button class="lh-del-set" data-date="${s.date}" data-si="${j}"
                        style="background:none;border:none;color:rgba(255,255,255,0.2);font-size:13px;cursor:pointer;padding:2px;line-height:1;transition:color 0.15s">✕</button>
                    </div>`;
                  }).join('')}

                  <!-- Add set -->
                  <button class="lh-add-set" data-date="${s.date}"
                    style="margin-top:8px;width:100%;padding:6px;background:rgba(255,255,255,0.04);border:1px dashed rgba(255,255,255,0.1);border-radius:7px;color:var(--muted);font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;cursor:pointer">
                    + Add Set
                  </button>
                </div>`).join('')}`;

        /* ── Wire events ── */

        /* Delete session */
        body.querySelectorAll('.lh-del-session').forEach(btn => {
          btn.addEventListener('click', () => {
            STATE.deleteLogbookExercise(btn.dataset.date, exName);
            renderHistory();
          });
        });

        /* Delete set */
        body.querySelectorAll('.lh-del-set').forEach(btn => {
          btn.addEventListener('click', () => {
            STATE.deleteLogbookSet(btn.dataset.date, exName, +btn.dataset.si);
            renderHistory();
          });
        });

        /* Add set */
        body.querySelectorAll('.lh-add-set').forEach(btn => {
          btn.addEventListener('click', () => {
            STATE.addLogbookSet(btn.dataset.date, exName);
            renderHistory();
          });
        });

        /* Edit weight — save on change, update volume cell live */
        body.querySelectorAll('.lh-weight').forEach(inp => {
          inp.addEventListener('change', () => {
            const repsInp = body.querySelector(`.lh-reps[data-date="${inp.dataset.date}"][data-si="${inp.dataset.si}"]`);
            const w = parseFloat(inp.value) || 0;
            const r = parseInt(repsInp?.value) || 0;
            STATE.updateLogbookSet(inp.dataset.date, exName, +inp.dataset.si, { weight: w || '' });
            const volEl = body.querySelector(`.lh-vol[data-date="${inp.dataset.date}"][data-si="${inp.dataset.si}"]`);
            if (volEl) volEl.textContent = w && r ? (w * r).toLocaleString() : '—';
          });
        });

        /* Edit reps — save on change, update volume cell live */
        body.querySelectorAll('.lh-reps').forEach(inp => {
          inp.addEventListener('change', () => {
            const weightInp = body.querySelector(`.lh-weight[data-date="${inp.dataset.date}"][data-si="${inp.dataset.si}"]`);
            const w = parseFloat(weightInp?.value) || 0;
            const r = parseInt(inp.value) || 0;
            STATE.updateLogbookSet(inp.dataset.date, exName, +inp.dataset.si, { reps: r || '' });
            const volEl = body.querySelector(`.lh-vol[data-date="${inp.dataset.date}"][data-si="${inp.dataset.si}"]`);
            if (volEl) volEl.textContent = w && r ? (w * r).toLocaleString() : '—';
          });
        });
      }

      renderHistory();
      liftHistoryOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeLiftHistory() {
      liftHistoryOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    document.getElementById('liftHistoryClose').onclick = closeLiftHistory;
    liftHistoryOverlay.addEventListener('click', e => { if (e.target === liftHistoryOverlay) closeLiftHistory(); });

    panel.querySelectorAll('.lift-row').forEach(row => {
      row.addEventListener('click', e => {
        if (e.target.closest('.fav-toggle')) return; // handled separately
        openLiftHistory(row.dataset.exname);
      });
    });
    panel.querySelectorAll('.fav-toggle').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        STATE.toggleFavoriteExercise(btn.dataset.exname);
        renderTab(); // re-render to resort + update star
      });
    });
  }

  /* ══════════════════════════════════════════════════════════════
     ROUTINE BUILDER
     Full-screen overlay for building custom routine structures:
       Info → Stages → Days (each day has Warmup / Main / Stretching)
  ══════════════════════════════════════════════════════════════ */

  /* ══════════════════════════════════════════════════════════════
     ROUTINE PREVIEW MODAL
     Bottom-sheet that showcases a routine; "Activate" button at bottom.
  ══════════════════════════════════════════════════════════════ */

  function openRoutinePreview(routineId) {
    const r = getAllRoutines().find(x => x.id === routineId);
    if (!r) return;

    let overlay = document.getElementById('routinePreviewOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'routinePreviewOverlay';
      overlay.className = 'ex-modal-overlay';
      overlay.innerHTML = `
        <div class="ex-modal" style="max-height:92vh">
          <div class="modal-drag-handle"></div>
          <div id="rpHeader" style="flex-shrink:0"></div>
          <div class="ex-modal-body" id="rpBody" style="padding:0"></div>
          <div id="rpFooter" style="padding:14px 16px;border-top:1px solid var(--border);flex-shrink:0"></div>
        </div>`;
      document.body.appendChild(overlay);
      overlay.addEventListener('click', e => { if (e.target === overlay) closePreview(); });
    }

    function closePreview() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    function activateAndClose() {
      STATE.setActiveRoutine(r.id);
      ws.currentDayIndex = 0;
      ws.weekNumber = 1;
      if (r.custom && r.stages?.length > 0) {
        /* Custom: schedule from first stage's dayRoutine labels */
        const firstStage = r.stages[0];
        if (firstStage?.dayRoutines?.length > 0) {
          ws.schedule = firstStage.dayRoutines.map(d => d.label || d.name);
        }
      } else if (r.schedule?.length) {
        /* Preset: use built-in schedule */
        ws.schedule = r.schedule;
      }
      STATE.save();
      closePreview();
      renderTab();
    }

    const isActive = ws.activeRoutineId === r.id;
    const gradient = r.gradient || 'linear-gradient(135deg,rgba(255,255,255,0.1) 0%,rgba(255,255,255,0.04) 100%)';
    const staged   = r.stages?.length ? (() => { let w=1; return r.stages.map(s=>({...s,weekStart:w,weekEnd:(w+=s.weekCount)-1})); })() : [];
    const totalWks = r.stages?.reduce((t,s)=>t+s.weekCount,0) || 0;

    /* Header = gradient banner */
    overlay.querySelector('#rpHeader').innerHTML = `
      <div style="background:${gradient};padding:24px 18px 20px;position:relative;min-height:120px;display:flex;flex-direction:column;justify-content:flex-end">
        <button id="rpClose" style="position:absolute;top:14px;right:14px;background:rgba(0,0,0,0.3);border:none;color:#fff;width:30px;height:30px;border-radius:50%;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>
        <div style="position:absolute;top:14px;left:16px;font-size:40px;opacity:0.25;line-height:1">${r.icon||'📋'}</div>
        ${isActive ? `<div style="margin-bottom:8px;font-family:'Rajdhani',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;background:rgba(0,0,0,0.4);color:#fff;display:inline-block;padding:3px 10px;border-radius:20px;width:fit-content">● Active Routine</div>` : ''}
        <div style="font-family:'Rajdhani',sans-serif;font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:5px">${r.eyebrow||'Training Program'}</div>
        <div style="font-family:'Rajdhani',sans-serif;font-size:24px;font-weight:800;color:#fff;line-height:1.1;text-shadow:0 1px 6px rgba(0,0,0,0.4)">${r.name}</div>
      </div>`;

    overlay.querySelector('#rpClose').addEventListener('click', closePreview);

    /* Body */
    const SEC_COLOR = { warmup:'var(--accent)', main:'var(--accent3)', stretching:'#26a69a' };
    const SEC_LABEL = { warmup:'Warmup', main:'Main Training', stretching:'Stretching' };
    function chip(txt, accent) {
      return `<span style="font-size:10px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;background:${accent?'rgba(255,107,53,0.12)':'rgba(255,255,255,0.07)'};padding:3px 9px;border-radius:20px;color:${accent?'var(--accent)':'var(--muted)'}">${txt}</span>`;
    }
    function sectionHead(label, color) {
      return `<div style="display:flex;align-items:center;gap:8px;padding:10px 16px 6px">
        <div style="font-family:'Rajdhani',sans-serif;font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${color}">${label}</div>
        <div style="flex:1;height:1px;background:${color};opacity:0.2"></div>
      </div>`;
    }

    const body = overlay.querySelector('#rpBody');
    body.innerHTML = `

      <!-- ── Overview ── -->
      <div style="padding:16px 16px 0">
        ${r.description ? `<p style="font-size:13px;color:rgba(226,234,242,0.72);line-height:1.75;margin:0 0 12px">${r.description}</p>` : ''}
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:4px">
          ${r.daysPerWeek ? chip(r.daysPerWeek+'×/week') : ''}
          ${r.duration    ? chip(r.duration) : ''}
          ${r.level       ? chip(r.level) : ''}
          ${r.repeatable!==undefined ? chip(r.repeatable?'Repeatable':'Linear') : ''}
          ${(r.tags||[]).map(t=>chip(t,true)).join('')}
        </div>
      </div>

      <!-- ── Stages ── -->
      ${staged.length ? `
        <div style="margin:16px 0 0">
          ${sectionHead(`${staged.length} Stage${staged.length!==1?'s':''} · ${totalWks} Weeks Total`, 'var(--accent)')}

          <!-- Visual timeline bar -->
          <div style="display:flex;gap:3px;padding:0 16px;margin-bottom:10px">
            ${staged.map((s,i)=>`
              <div style="flex:${s.weekCount};background:var(--accent);opacity:${0.25+i*0.15};border-radius:4px;height:6px" title="${s.name}"></div>`).join('')}
          </div>

          <!-- Stage rows -->
          <div style="display:flex;flex-direction:column;gap:0">
            ${staged.map((s,i)=>`
              <div style="display:grid;grid-template-columns:24px 1fr auto auto;align-items:center;gap:10px;padding:9px 16px;border-top:1px solid rgba(255,255,255,0.05)${i===0?';border-top:none':''}">
                <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:800;color:var(--accent);text-align:center">${i+1}</div>
                <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700">${s.name}</div>
                <div style="font-family:'Rajdhani',sans-serif;font-size:11px;color:var(--muted);white-space:nowrap">Wk ${s.weekStart}–${s.weekEnd}</div>
                <div style="font-family:'Rajdhani',sans-serif;font-size:11px;color:var(--muted);white-space:nowrap;text-align:right">${s.weekCount} wk${s.weekCount!==1?'s':''}</div>
              </div>`).join('')}
          </div>
        </div>` : ''}

      <!-- ── Stage Days ── -->
      ${staged.some(s => s.dayRoutines?.length) ? `
        <div style="margin:16px 0 0">
          ${staged.filter(s => s.dayRoutines?.length).map(s => `
            <div style="margin-bottom:18px">
              ${sectionHead(`${s.name} · Wk ${s.weekStart}–${s.weekEnd}`, 'var(--accent)')}
              <div style="display:flex;flex-direction:column;gap:10px;padding:4px 16px 4px">
                ${s.dayRoutines.map(d=>{
                  const exCount = ['warmup','main','stretching'].reduce((t,sec)=>t+(d.sections?.[sec]?.length||0),0);
                  const secs    = ['warmup','main','stretching'].filter(sec=>d.sections?.[sec]?.length);
                  return `
                    <div style="border:1px solid var(--border);border-radius:12px;overflow:hidden">
                      <div style="display:flex;align-items:center;gap:12px;padding:11px 14px;background:rgba(255,255,255,0.03)">
                        <div style="font-family:'Rajdhani',sans-serif;font-size:20px;font-weight:800;color:var(--accent);min-width:36px;text-align:center;background:rgba(255,107,53,0.1);border-radius:8px;padding:4px 0">${d.label||'?'}</div>
                        <div style="flex:1">
                          <div style="font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700">${d.name||'Unnamed'}</div>
                          <div style="font-size:10px;color:var(--muted);margin-top:2px">${exCount} exercise${exCount!==1?'s':''} across ${secs.length} section${secs.length!==1?'s':''}</div>
                        </div>
                      </div>
                      ${secs.map(sec=>`
                        <div style="border-top:1px solid rgba(255,255,255,0.06)">
                          <div style="display:flex;align-items:center;gap:8px;padding:8px 14px 4px">
                            <div style="width:3px;height:14px;background:${SEC_COLOR[sec]};border-radius:2px;flex-shrink:0"></div>
                            <div style="font-family:'Rajdhani',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${SEC_COLOR[sec]}">${SEC_LABEL[sec]}</div>
                            <div style="font-size:10px;color:var(--muted)">${d.sections[sec].length} ex</div>
                          </div>
                          <div style="padding:0 14px 10px;display:flex;flex-direction:column;gap:6px">
                            ${d.sections[sec].map((ex,ei)=>`
                              <div style="display:flex;align-items:flex-start;gap:10px;padding:7px 10px;background:rgba(255,255,255,0.03);border-radius:8px;border-left:2px solid ${SEC_COLOR[sec]}">
                                <div style="flex:1;min-width:0">
                                  <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;margin-bottom:4px">${ex.name||'—'}</div>
                                  <div style="display:flex;flex-wrap:wrap;gap:4px;${ex.desc?'margin-bottom:5px':''}">
                                    ${ex.sets   ? `<span style="font-size:10px;background:rgba(255,255,255,0.07);padding:2px 7px;border-radius:12px;color:var(--muted);font-family:'Rajdhani',sans-serif;font-weight:700">${ex.sets} Sets</span>` : ''}
                                    ${ex.reps   ? `<span style="font-size:10px;background:rgba(255,255,255,0.07);padding:2px 7px;border-radius:12px;color:var(--muted);font-family:'Rajdhani',sans-serif;font-weight:700">${ex.reps} Reps</span>` : ''}
                                    ${ex.lastRPE? `<span style="font-size:10px;background:rgba(245,200,66,0.1);padding:2px 7px;border-radius:12px;color:var(--accent2,#f5c842);font-family:'Rajdhani',sans-serif;font-weight:700">RPE ${ex.lastRPE}</span>` : ''}
                                    ${ex.rest   ? `<span style="font-size:10px;background:rgba(255,255,255,0.06);padding:2px 7px;border-radius:12px;color:var(--muted);font-family:'Rajdhani',sans-serif;font-weight:700">Rest ${ex.rest}</span>` : ''}
                                  </div>
                                  ${ex.desc ? `<div style="font-size:11px;color:var(--muted);line-height:1.5">${ex.desc}</div>` : ''}
                                </div>
                                <div style="font-family:'Rajdhani',sans-serif;font-size:11px;color:var(--muted);flex-shrink:0">${ei+1}</div>
                              </div>`).join('')}
                          </div>
                        </div>`).join('')}
                    </div>`;
                }).join('')}
              </div>
            </div>`).join('')}
        </div>` : `
        <div style="padding:20px 16px 16px;text-align:center;color:var(--muted);font-size:12px;line-height:1.6">
          ${r.custom ? 'No days added yet. Use the Build button to add stages and days.' : 'This is a built-in preset program.<br>Select it to use it on the Routine tab.'}
        </div>`}
    `;

    /* Footer */
    overlay.querySelector('#rpFooter').innerHTML = isActive
      ? `<div style="text-align:center;padding:6px;font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--accent)">● Currently Active</div>`
      : `<button id="rpActivate" style="width:100%;padding:13px;background:var(--accent);color:#000;border:none;border-radius:10px;font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;cursor:pointer;letter-spacing:0.5px">Activate This Routine</button>`;

    overlay.querySelector('#rpActivate')?.addEventListener('click', activateAndClose);

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  /* ══════════════════════════════════════════════════════════════
     CUSTOM ROUTINE — ROUTINE TAB RENDERER
  ══════════════════════════════════════════════════════════════ */

  function renderCustomRoutineDay(panel, routine) {
    const staged = (() => { let w=1; return (routine.stages||[]).map(s=>({...s,weekStart:w,weekEnd:(w+=s.weekCount)-1})); })();
    const totalWks = (routine.stages||[]).reduce((t,s)=>t+s.weekCount,0) || staged.length;
    const weekNum  = ws.weekNumber || 1;

    /* Find the stage that covers the current week; fall back to first stage */
    const currentStage = staged.find(s => weekNum >= s.weekStart && weekNum <= s.weekEnd) || staged[0];
    const days    = currentStage?.dayRoutines || [];
    const schedule = days.map(d => d.label || d.name);
    let   selDay  = schedule[ws.currentDayIndex % Math.max(schedule.length,1)] || schedule[0];

    panel.innerHTML = `
      <!-- Progress card -->
      <div class="card" style="margin-bottom:16px">
        <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
          <div class="card-title" style="display:flex;align-items:baseline;gap:8px">
            Progress
            ${totalWks ? `<span style="font-weight:400;font-family:'Rajdhani',sans-serif;font-size:13px;color:var(--muted)">Week ${Math.min(weekNum,totalWks)} <span style="opacity:0.45">of</span> ${totalWks}</span>` : ''}
          </div>
          <div style="display:flex;gap:6px;align-items:center">
            <button id="customProgressToggleBtn" class="day-tab" style="padding:4px 12px;font-size:11px;white-space:nowrap">Show Progress</button>
            <button id="customEditRoutineBtn" class="day-tab active" style="padding:4px 12px;font-size:11px;white-space:nowrap">Edit Routine</button>
          </div>
        </div>
        <div class="card-body" style="padding:10px 16px 14px">
          ${staged.length ? `
            <div style="display:flex;gap:2px;margin-bottom:12px">
              ${staged.map((s,i)=>{
                const isPast = weekNum > s.weekEnd;
                const isCurrent = weekNum >= s.weekStart && weekNum <= s.weekEnd;
                const fill = isPast ? 100 : isCurrent ? Math.round(((weekNum-s.weekStart)/s.weekCount)*100) : 0;
                const radius = i===0?'7px 0 0 7px':i===staged.length-1?'0 7px 7px 0':'0';
                return `
                  <div style="flex:${s.weekCount};position:relative;border-radius:${radius};overflow:hidden;background:rgba(255,255,255,0.04);border:2px solid ${isCurrent?'var(--accent)':'transparent'};padding:6px 8px;min-width:0;cursor:default">
                    <div style="position:absolute;inset:0;background:var(--accent);opacity:0.13;width:${fill}%;pointer-events:none"></div>
                    <div style="font-family:'Rajdhani',sans-serif;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted);position:relative;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.name}</div>
                  </div>`;
              }).join('')}
            </div>` : ''}
          <!-- Day tabs -->
          <div class="day-tabs" style="flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none" id="customDayTabs"></div>
        </div>
        <div id="customProgressDrop" style="display:none;border-top:1px solid var(--border)"></div>
      </div>

      <!-- Day content -->
      <div id="customDayContent"></div>`;

    /* Day tabs */
    const tabsEl = panel.querySelector('#customDayTabs');
    schedule.forEach(lbl => {
      const btn = document.createElement('button');
      btn.className = 'day-tab' + (selDay === lbl ? ' active' : '');
      btn.textContent = lbl;
      btn.addEventListener('click', () => {
        selDay = lbl;
        tabsEl.querySelectorAll('.day-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderCustomDay();
      });
      tabsEl.appendChild(btn);
    });

    /* Progress dropdown */
    const pgBtn  = panel.querySelector('#customProgressToggleBtn');
    const pgDrop = panel.querySelector('#customProgressDrop');
    let pgOpen   = false;
    pgBtn.addEventListener('click', () => {
      pgOpen = !pgOpen;
      pgBtn.textContent = pgOpen ? 'Hide Progress' : 'Show Progress';
      if (pgOpen) { renderRoutineProgressDrop(pgDrop); pgDrop.style.display = ''; }
      else pgDrop.style.display = 'none';
    });

    panel.querySelector('#customEditRoutineBtn').addEventListener('click', () => {
      openRoutineBuilder(routine.id);
    });

    /* Day content */
    function renderCustomDay() {
      const content = panel.querySelector('#customDayContent');
      const day = days.find(d => (d.label||d.name) === selDay);
      if (!day) {
        content.innerHTML = `<div class="card"><div class="card-body" style="padding:32px;text-align:center;color:var(--muted)">Rest Day</div></div>`;
        return;
      }
      const SECTION_COLORS = { warmup:'var(--accent)', main:'var(--accent3)', stretching:'#26a69a' };
      const SECTION_LABELS = { warmup:'Warmup', main:'Main Training', stretching:'Stretching' };
      const exTotal = ['warmup','main','stretching'].reduce((t,s)=>t+(day.sections?.[s]?.length||0),0);

      content.innerHTML = `
        <div class="workout-card">
          <div class="workout-card-header">
            <div>
              <div class="workout-card-phase">${routine.name}</div>
              <div class="workout-card-day">${day.name||selDay}</div>
            </div>
            <span class="badge badge-accent">${exTotal} exercises</span>
          </div>
          ${['warmup','main','stretching'].map(sec => {
            const exs = day.sections?.[sec] || [];
            return `
              <div style="border-top:1px solid rgba(255,255,255,0.07)">
                <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;cursor:pointer" class="custom-sec-toggle" data-sec="${sec}">
                  <div style="font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${SECTION_COLORS[sec]}">${SECTION_LABELS[sec]}</div>
                  <span style="font-size:16px;color:var(--muted)">▾</span>
                </div>
                <div class="custom-sec-body" data-sec="${sec}" style="display:none;padding:0 16px 10px">
                  ${exs.length === 0
                    ? `<div style="padding:8px 0;font-size:12px;color:var(--muted)">No exercises assigned.</div>`
                    : exs.map((ex, exI)=>{
                        const allOpts = [
                          { name: ex.name || '—' },
                          ...(ex.subs||[]).map(s => ({ name: s.name || '—' }))
                        ];
                        const CSUB = ['Primary','Sub 1','Sub 2','Sub 3'];
                        const chips = `
                          ${ex.sets?`<span class="ex-chip reps">${ex.sets} Sets</span>`:''}
                          ${ex.reps?`<span class="ex-chip reps">${ex.reps} Reps</span>`:''}
                          ${ex.lastRPE?`<span class="ex-chip rpe">Last RPE ${ex.lastRPE}</span>`:''}
                          ${ex.rest?`<span class="ex-chip">Rest: ${ex.rest}</span>`:''}`;
                        if (allOpts.length > 1) {
                          const cn = allOpts.length;
                          return `
                          <div class="custom-ex-row" data-cn="${cn}" style="margin-bottom:4px;cursor:grab;user-select:none">
                            <div class="custom-ex-outer" style="overflow:hidden">
                              <div class="custom-ex-track" style="display:flex;will-change:transform;width:${cn*100}%">
                                ${allOpts.map((opt,oi)=>`
                                  <div class="custom-ex-slide" style="width:${100/cn}%;flex-shrink:0;box-sizing:border-box;padding:3px 4px;display:flex;">
                                    <div style="border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;flex:1">
                                      <div style="font-size:9px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${oi===0?'var(--accent)':'rgba(255,255,255,0.45)'};margin-bottom:4px">${CSUB[oi]||'Sub '+oi}</div>
                                      <div style="font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;margin-bottom:6px">${opt.name}</div>
                                      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:${ex.desc?'6px':'0'}">${chips}</div>
                                      ${ex.desc?`<div style="font-size:11px;color:var(--muted);line-height:1.5">${ex.desc}</div>`:''}
                                    </div>
                                  </div>`).join('')}
                              </div>
                            </div>
                          </div>`;
                        }
                        return `
                        <div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
                          <div style="font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;margin-bottom:6px">${ex.name||'—'}</div>
                          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:${ex.desc?'6px':'0'}">${chips}</div>
                          ${ex.desc?`<div style="font-size:11px;color:var(--muted);line-height:1.5">${ex.desc}</div>`:''}
                        </div>`;
                      }).join('')}
                </div>
              </div>`;
          }).join('')}
        </div>`;

      content.querySelectorAll('.custom-sec-toggle').forEach(hdr => {
        hdr.addEventListener('click', () => {
          const body  = content.querySelector(`.custom-sec-body[data-sec="${hdr.dataset.sec}"]`);
          const arrow = hdr.querySelector('span');
          const open  = body.style.display === 'none';
          body.style.display  = open ? '' : 'none';
          arrow.style.transform = open ? 'rotate(180deg)' : '';
        });
      });

      /* Wire up drag + clickable dots for custom routine sub carousels */
      content.querySelectorAll('.custom-ex-row[data-cn]').forEach(rowEl => {
        const cn    = +rowEl.dataset.cn;
        const track = rowEl.querySelector('.custom-ex-track');
        if (!track) return;
        let idx = 0;

        function goTo(i, animate = true) {
          idx = Math.max(0, Math.min(cn - 1, i));
          track.style.transition = animate ? 'transform 0.28s cubic-bezier(0.4,0,0.2,1)' : 'none';
          track.style.transform = `translateX(${-idx * rowEl.offsetWidth}px)`;
        }

        let dragX = null, didDrag = false;
        rowEl.addEventListener('mousedown', e => {
          dragX = e.clientX; didDrag = false;
          rowEl.style.cursor = 'grabbing';
          track.style.transition = 'none';
          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
        });
        const onMove = e => {
          if (dragX === null) return;
          const dx = e.clientX - dragX;
          if (Math.abs(dx) > 4) didDrag = true;
          const raw = -idx * rowEl.offsetWidth + dx;
          track.style.transform = `translateX(${Math.max(-(cn - 1) * rowEl.offsetWidth, Math.min(0, raw))}px)`;
        };
        const onUp = e => {
          if (dragX === null) return;
          const dx = e.clientX - dragX; dragX = null;
          rowEl.style.cursor = 'grab';
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
          const threshold = rowEl.offsetWidth * 0.25;
          if (dx < -threshold) goTo(idx + 1);
          else if (dx > threshold) goTo(idx - 1);
          else goTo(idx);
        };
        rowEl.addEventListener('click', e => { if (didDrag) { e.stopPropagation(); didDrag = false; } }, true);

        let touchX = null;
        rowEl.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; track.style.transition = 'none'; }, { passive: true });
        rowEl.addEventListener('touchmove', e => {
          if (touchX === null) return;
          const dx = e.touches[0].clientX - touchX;
          const raw = -idx * rowEl.offsetWidth + dx;
          track.style.transform = `translateX(${Math.max(-(cn - 1) * rowEl.offsetWidth, Math.min(0, raw))}px)`;
        }, { passive: true });
        rowEl.addEventListener('touchend', e => {
          if (touchX === null) return;
          const dx = e.changedTouches[0].clientX - touchX; touchX = null;
          const threshold = rowEl.offsetWidth * 0.25;
          if (dx < -threshold) goTo(idx + 1);
          else if (dx > threshold) goTo(idx - 1);
          else goTo(idx);
        }, { passive: true });
      });
    }

    renderCustomDay();
  }

  function openRoutineBuilder(routineId) {
    const src = ws.routines.find(r => r.id === routineId);
    if (!src) return;

    /* Work on a deep clone — only written to state on Save */
    let draft = JSON.parse(JSON.stringify(src));
    /* Ensure every stage has a dayRoutines array */
    draft.stages = (draft.stages || []).map(s => ({ dayRoutines: [], ...s }));

    /* ── Create overlay (modal sheet, not full-screen) ── */
    let backdrop = document.getElementById('routineBuilderBackdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'routineBuilderBackdrop';
      backdrop.className = 'ex-modal-overlay';
      const modal = document.createElement('div');
      modal.id = 'routineBuilderModal';
      modal.className = 'ex-modal';
      modal.style.cssText = 'max-height:92vh;display:flex;flex-direction:column;overflow:hidden';
      backdrop.appendChild(modal);
      document.body.appendChild(backdrop);
      backdrop.addEventListener('click', e => { if (e.target === backdrop) closeBuilder(); });
    }
    function closeBuilder() {
      backdrop.classList.remove('open');
      document.body.style.overflow = '';
    }
    const overlay = document.getElementById('routineBuilderModal');
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';

    let builderTab = 'info';
    let editingStageId = null; /* drill into a stage's days */
    let editingDayId   = null; /* drill into a specific day editor */

    const GRADIENT_OPTIONS = [
      'linear-gradient(135deg,#7c6af7 0%,#4a3ab8 100%)',
      'linear-gradient(135deg,#ff6b35 0%,#c93c10 100%)',
      'linear-gradient(135deg,#f5c842 0%,#c48a0a 100%)',
      'linear-gradient(135deg,#f06292 0%,#ad1457 100%)',
      'linear-gradient(135deg,#26a69a 0%,#00695c 100%)',
    ];
    const ICON_OPTIONS = ['📋','💪','🔬','⚡','🏆','🔥','🎯','🏋️'];

    function stagesWithWeeks(stages) {
      let w = 1;
      return stages.map(s => { const r = { ...s, weekStart: w }; w += s.weekCount; return r; });
    }

    function uid() { return 'id_' + Math.random().toString(36).slice(2, 9); }

    /* ── Main render ── */
    function renderBuilder() {
      const TABS = ['info','stages'];

      /* Compute top-bar title */
      let topTitle = draft.name || 'New Routine';
      if (editingStageId) {
        const st = draft.stages.find(s => s.id === editingStageId);
        topTitle = editingDayId
          ? (st?.dayRoutines?.find(d => d.id === editingDayId)?.name || 'Edit Day')
          : (st?.name || 'Stage Days');
      }

      overlay.innerHTML = `
        <!-- Top bar -->
        <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border);background:var(--surface);flex-shrink:0;position:sticky;top:0;z-index:10">
          <button id="rbBack" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:8px;color:var(--fg);font-size:18px;width:36px;height:36px;cursor:pointer;display:flex;align-items:center;justify-content:center">←</button>
          <div style="flex:1;font-family:'Rajdhani',sans-serif;font-size:17px;font-weight:700;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${topTitle}</div>
          <button id="rbSave" style="background:var(--accent);color:#000;border:none;border-radius:8px;padding:7px 18px;font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;cursor:pointer">Save</button>
        </div>

        ${!editingStageId ? `
        <!-- Tab bar (top-level only) -->
        <div style="display:flex;gap:0;border-bottom:1px solid var(--border);background:var(--surface);flex-shrink:0">
          ${TABS.map(t => `
            <button class="rb-tab-btn" data-tab="${t}" style="flex:1;padding:10px 4px;background:none;border:none;border-bottom:2px solid ${t===builderTab?'var(--accent)':'transparent'};color:${t===builderTab?'var(--accent)':'var(--muted)'};font-family:'Rajdhani',sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:color 0.2s">
              ${t==='info'?'Overview':'Stages'}
            </button>`).join('')}
        </div>` : `
        <!-- Breadcrumb (drill-in mode) -->
        <div style="display:flex;align-items:center;gap:6px;padding:7px 16px;background:var(--surface);border-bottom:1px solid var(--border);flex-shrink:0">
          <span style="font-size:11px;color:var(--muted)">Stages</span>
          <span style="font-size:11px;color:var(--muted)">›</span>
          ${editingDayId ? `
            <span id="rbBreadStage" style="font-size:11px;color:var(--accent);cursor:pointer">${draft.stages.find(s=>s.id===editingStageId)?.name||'Stage'}</span>
            <span style="font-size:11px;color:var(--muted)">›</span>
            <span style="font-size:11px;color:var(--fg)">${draft.stages.find(s=>s.id===editingStageId)?.dayRoutines?.find(d=>d.id===editingDayId)?.name||'Day'}</span>
          ` : `
            <span style="font-size:11px;color:var(--fg)">${draft.stages.find(s=>s.id===editingStageId)?.name||'Stage'}</span>
          `}
        </div>`}

        <!-- Content -->
        <div id="rbContent" style="flex:1;overflow-y:auto;padding:16px"></div>`;

      /* Back */
      overlay.querySelector('#rbBack').addEventListener('click', () => {
        if (editingDayId) {
          const stage = draft.stages.find(s => s.id === editingStageId);
          const day   = stage?.dayRoutines?.find(d => d.id === editingDayId);
          if (day) saveDayEdits(day, overlay.querySelector('#rbContent'));
          editingDayId = null;
          renderBuilder();
        } else if (editingStageId) {
          editingStageId = null;
          renderBuilder();
        } else {
          closeBuilder();
        }
      });

      /* Save */
      overlay.querySelector('#rbSave').addEventListener('click', () => {
        collectInfoTab();
        if (editingDayId) {
          const stage = draft.stages.find(s => s.id === editingStageId);
          const day   = stage?.dayRoutines?.find(d => d.id === editingDayId);
          if (day) saveDayEdits(day, overlay.querySelector('#rbContent'));
        }
        STATE.saveRoutineData(routineId, draft);
        closeBuilder();
        renderTab();
      });

      /* Tab nav (top-level) */
      if (!editingStageId) {
        overlay.querySelectorAll('.rb-tab-btn').forEach(btn => {
          btn.addEventListener('click', () => { builderTab = btn.dataset.tab; renderBuilder(); });
        });
      } else {
        /* Stage breadcrumb — click stage name to go back to day list */
        overlay.querySelector('#rbBreadStage')?.addEventListener('click', () => {
          const stage = draft.stages.find(s => s.id === editingStageId);
          const day   = stage?.dayRoutines?.find(d => d.id === editingDayId);
          if (day) saveDayEdits(day, overlay.querySelector('#rbContent'));
          editingDayId = null;
          renderBuilder();
        });
      }

      /* Render active view */
      const content = overlay.querySelector('#rbContent');
      if (!editingStageId) {
        if (builderTab === 'info')   renderInfoTab(content);
        if (builderTab === 'stages') renderStagesTab(content);
      } else {
        if (editingDayId) renderDayEditor(content);
        else              renderStageDays(content);
      }
    }

    /* ── Info tab ── */
    let infoFields = null;
    function collectInfoTab() {
      if (!infoFields) return;
      draft.name        = infoFields.name?.value.trim()    || draft.name;
      draft.description = infoFields.desc?.value.trim()    || draft.description;
      draft.repeatable  = infoFields.repeatable?.checked   ?? draft.repeatable;
      draft.eyebrow     = infoFields.eyebrow?.value.trim() || draft.eyebrow;
    }

    function renderInfoTab(el) {
      el.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:14px">
          <!-- Preview banner -->
          <div style="border-radius:14px;overflow:hidden;height:100px;background:${draft.gradient};display:flex;align-items:flex-end;padding:14px 16px;position:relative">
            <div style="position:absolute;top:12px;right:14px;font-size:32px;opacity:0.3">${draft.icon}</div>
            <div style="font-family:'Rajdhani',sans-serif;font-size:20px;font-weight:800;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.5)">${draft.name||'Plan Name'}</div>
          </div>

          <!-- Name -->
          <div>
            <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Plan Name</div>
            <input id="rbName" type="text" class="form-input" style="width:100%;padding:9px 12px;font-size:14px" value="${draft.name||''}" placeholder="e.g. My 5-Day Split" />
          </div>

          <!-- Eyebrow -->
          <div>
            <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Category / Style</div>
            <input id="rbEyebrow" type="text" class="form-input" style="width:100%;padding:8px 12px;font-size:13px" value="${draft.eyebrow||''}" placeholder="e.g. Hypertrophy · Strength" />
          </div>

          <!-- Description -->
          <div>
            <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Description</div>
            <textarea id="rbDesc" class="form-input" rows="3" style="width:100%;padding:8px 12px;font-size:12px;resize:none;line-height:1.6" placeholder="Describe your plan...">${draft.description||''}</textarea>
          </div>

          <!-- Repeatable -->
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:rgba(255,255,255,0.04);border-radius:10px;border:1px solid var(--border)">
            <div>
              <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700">Repeatable</div>
              <div style="font-size:11px;color:var(--muted);margin-top:2px">Loop back to week 1 after completing all stages</div>
            </div>
            <label style="position:relative;display:inline-block;width:42px;height:24px;flex-shrink:0;margin-left:12px">
              <input type="checkbox" id="rbRepeatable" style="opacity:0;width:0;height:0" ${draft.repeatable?'checked':''} />
              <span style="position:absolute;inset:0;background:${draft.repeatable?'var(--accent)':'rgba(255,255,255,0.15)'};border-radius:24px;transition:background 0.2s;cursor:pointer"></span>
              <span style="position:absolute;top:3px;left:${draft.repeatable?'21px':'3px'};width:18px;height:18px;background:#fff;border-radius:50%;transition:left 0.2s;pointer-events:none"></span>
            </label>
          </div>

          <!-- Color -->
          <div>
            <div style="font-size:10px;color:var(--muted);margin-bottom:8px">Banner Color</div>
            <div style="display:flex;gap:8px">
              ${GRADIENT_OPTIONS.map((g, i) => `
                <button class="rb-grad-btn" data-g="${i}" style="flex:1;height:32px;border-radius:8px;background:${g};border:2px solid ${draft.gradient===g?'#fff':'transparent'};cursor:pointer;transition:border-color 0.2s"></button>`).join('')}
            </div>
          </div>

          <!-- Icon -->
          <div>
            <div style="font-size:10px;color:var(--muted);margin-bottom:8px">Icon</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              ${ICON_OPTIONS.map(ic => `
                <button class="rb-icon-btn" data-icon="${ic}" style="width:40px;height:40px;border-radius:8px;background:${draft.icon===ic?'rgba(255,107,53,0.2)':'rgba(255,255,255,0.06)'};border:1.5px solid ${draft.icon===ic?'var(--accent)':'transparent'};font-size:18px;cursor:pointer;transition:all 0.15s">${ic}</button>`).join('')}
            </div>
          </div>
        </div>`;

      infoFields = {
        name:       el.querySelector('#rbName'),
        desc:       el.querySelector('#rbDesc'),
        repeatable: el.querySelector('#rbRepeatable'),
        eyebrow:    el.querySelector('#rbEyebrow'),
      };

      el.querySelector('#rbName').addEventListener('input', () => {
        draft.name = el.querySelector('#rbName').value.trim();
        renderBuilder();
      });
      el.querySelectorAll('.rb-grad-btn').forEach(btn => {
        btn.addEventListener('click', () => { draft.gradient = GRADIENT_OPTIONS[+btn.dataset.g]; renderBuilder(); });
      });
      el.querySelectorAll('.rb-icon-btn').forEach(btn => {
        btn.addEventListener('click', () => { draft.icon = btn.dataset.icon; renderBuilder(); });
      });
      el.querySelector('#rbRepeatable').addEventListener('change', e => { draft.repeatable = e.target.checked; renderBuilder(); });
    }

    /* ── Stages tab ── */
    function renderStagesTab(el) {
      collectInfoTab();
      const staged = stagesWithWeeks(draft.stages);
      const totalWeeks = draft.stages.reduce((t, s) => t + s.weekCount, 0);

      el.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div>
            <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--muted)">Stages</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px">${totalWeeks} total week${totalWeeks!==1?'s':''} · ${draft.repeatable?'Repeatable':'Linear'}</div>
          </div>
          ${draft.stages.length < 10 ? `<button id="rbAddStage" class="day-tab active" style="padding:5px 14px;font-size:11px">+ Add Stage</button>` : ''}
        </div>

        ${draft.stages.length === 0 ? `<div style="padding:32px;text-align:center;color:var(--muted);font-size:13px;border:1.5px dashed rgba(255,255,255,0.1);border-radius:12px">Add your first stage to define the program structure.</div>` : ''}

        <div id="stageList" style="display:flex;flex-direction:column;gap:10px">
          ${staged.map((s, i) => {
            const dayCount = (s.dayRoutines||[]).length;
            return `
            <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden">
              <div style="padding:12px 14px;display:flex;align-items:center;gap:10px">
                <div style="font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;color:var(--muted);min-width:20px">${i+1}</div>
                <input class="stage-name-inp form-input" data-si="${i}" style="flex:1;padding:6px 10px;font-size:13px;font-weight:700" value="${s.name}" placeholder="Stage name" />
                <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
                  <input class="stage-weeks-inp form-input" data-si="${i}" type="number" min="1" max="${54-totalWeeks+s.weekCount}" style="width:52px;padding:6px 8px;font-size:13px;text-align:center" value="${s.weekCount}" />
                  <span style="font-size:11px;color:var(--muted)">wks</span>
                </div>
                <button class="stage-del-btn" data-si="${i}" style="background:none;border:none;color:var(--muted);font-size:16px;cursor:pointer;flex-shrink:0">✕</button>
              </div>
              <div style="padding:0 14px 12px;display:flex;align-items:center;justify-content:space-between">
                <div style="font-size:10px;color:var(--muted)">Wk ${s.weekStart}–${s.weekStart+s.weekCount-1} · ${dayCount} day${dayCount!==1?'s':''}</div>
                <button class="stage-manage-days" data-sid="${s.id}" style="background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:7px;color:var(--fg);font-family:'Rajdhani',sans-serif;font-size:11px;font-weight:700;padding:4px 12px;cursor:pointer;letter-spacing:0.5px">Manage Days →</button>
              </div>
            </div>`;
          }).join('')}
        </div>`;

      el.querySelector('#rbAddStage')?.addEventListener('click', () => {
        collectInfoTab();
        if (draft.stages.length >= 10) return;
        const remaining = 54 - draft.stages.reduce((t, s) => t + s.weekCount, 0);
        if (remaining <= 0) return;
        draft.stages.push({ id: uid(), name: `Stage ${draft.stages.length + 1}`, weekCount: Math.min(4, remaining), dayRoutines: [] });
        renderBuilder();
      });

      el.querySelectorAll('.stage-name-inp').forEach(inp => {
        inp.addEventListener('change', () => { draft.stages[+inp.dataset.si].name = inp.value.trim() || `Stage ${+inp.dataset.si+1}`; });
      });
      el.querySelectorAll('.stage-weeks-inp').forEach(inp => {
        inp.addEventListener('change', () => {
          const n = Math.max(1, Math.min(54, parseInt(inp.value)||1));
          draft.stages[+inp.dataset.si].weekCount = n;
          renderBuilder();
        });
      });
      el.querySelectorAll('.stage-del-btn').forEach(btn => {
        btn.addEventListener('click', () => { draft.stages.splice(+btn.dataset.si, 1); renderBuilder(); });
      });
      el.querySelectorAll('.stage-manage-days').forEach(btn => {
        btn.addEventListener('click', () => {
          collectInfoTab();
          editingStageId = btn.dataset.sid;
          renderBuilder();
        });
      });
    }

    /* ── Stage days list (drill-in from a stage) ── */
    function renderStageDays(el) {
      const stage = draft.stages.find(s => s.id === editingStageId);
      if (!stage) { editingStageId = null; renderBuilder(); return; }
      if (!stage.dayRoutines) stage.dayRoutines = [];
      const days = stage.dayRoutines;

      el.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div>
            <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--muted)">${stage.name}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px">${days.length} day${days.length!==1?'s':''} in this stage</div>
          </div>
          ${days.length < 8 ? `<button id="rbAddDay" class="day-tab active" style="padding:5px 14px;font-size:11px">+ Add Day</button>` : ''}
        </div>

        ${days.length === 0 ? `<div style="padding:32px;text-align:center;color:var(--muted);font-size:13px;border:1.5px dashed rgba(255,255,255,0.1);border-radius:12px">Add days to define each training session for this stage.</div>` : ''}

        <div style="display:flex;flex-direction:column;gap:8px">
          ${days.map((d, di) => {
            const exCount = ['warmup','main','stretching'].reduce((t, s) => t + (d.sections[s]||[]).length, 0);
            return `
              <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--surface);border:1px solid var(--border);border-radius:12px;cursor:pointer" class="rb-day-row" data-did="${d.id}">
                <div style="font-family:'Rajdhani',sans-serif;font-size:22px;font-weight:800;color:var(--accent);min-width:28px">${d.label||'?'}</div>
                <div style="flex:1;min-width:0">
                  <div style="font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700">${d.name||'Unnamed Day'}</div>
                  <div style="font-size:10px;color:var(--muted);margin-top:2px">${exCount} exercise${exCount!==1?'s':''}</div>
                </div>
                <span style="color:var(--muted);font-size:14px">›</span>
                <button class="rb-day-del" data-di="${di}" style="background:none;border:none;color:var(--muted);font-size:15px;cursor:pointer;padding:4px">✕</button>
              </div>`;
          }).join('')}
        </div>`;

      el.querySelector('#rbAddDay')?.addEventListener('click', () => {
        if (days.length >= 8) return;
        const newDay = { id: uid(), name: '', label: '', sections: { warmup: [], main: [], stretching: [] } };
        days.push(newDay);
        editingDayId = newDay.id;
        renderBuilder();
      });

      el.querySelectorAll('.rb-day-row').forEach(row => {
        row.addEventListener('click', e => {
          if (e.target.closest('.rb-day-del')) return;
          editingDayId = row.dataset.did;
          renderBuilder();
        });
      });

      el.querySelectorAll('.rb-day-del').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          days.splice(+btn.dataset.di, 1);
          renderBuilder();
        });
      });
    }

    /* ── Day editor (works on stage.dayRoutines[x]) ── */
    function renderDayEditor(el) {
      const stage = draft.stages.find(s => s.id === editingStageId);
      if (!stage) { editingStageId = null; editingDayId = null; renderBuilder(); return; }
      const day = (stage.dayRoutines||[]).find(d => d.id === editingDayId);
      if (!day) { editingDayId = null; renderBuilder(); return; }

      const SECTION_LABELS = { warmup: 'Warmup', main: 'Main Training', stretching: 'Stretching' };
      const SECTION_COLORS = { warmup: 'var(--accent)', main: 'var(--accent3)', stretching: '#26a69a' };

      el.innerHTML = `
        <!-- Name + Label -->
        <div style="display:grid;grid-template-columns:1fr 100px;gap:10px;margin-bottom:14px">
          <div>
            <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Day Name</div>
            <input id="dayNameInp" type="text" class="form-input" style="width:100%;padding:8px 10px;font-size:13px" value="${day.name}" placeholder="e.g. Upper Body" />
          </div>
          <div>
            <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Tab Label</div>
            <input id="dayLabelInp" type="text" class="form-input" style="width:100%;padding:8px 10px;font-size:13px;text-align:center" value="${day.label}" placeholder="Upper" maxlength="8" />
          </div>
        </div>

        <!-- Sections -->
        ${['warmup','main','stretching'].map(sec => `
          <div style="margin-bottom:16px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
              <div style="font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${SECTION_COLORS[sec]}">${SECTION_LABELS[sec]}</div>
              <div style="display:flex;gap:6px">
                <button class="sec-pick-ex" data-sec="${sec}" style="font-size:11px;color:var(--muted);background:none;border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:3px 9px;cursor:pointer">🔍 From Tracking</button>
                <button class="sec-add-ex" data-sec="${sec}" style="font-size:11px;color:var(--accent);background:none;border:1px dashed rgba(255,255,255,0.15);border-radius:6px;padding:3px 10px;cursor:pointer">+ Add</button>
              </div>
            </div>
            <div class="sec-ex-list" data-sec="${sec}" style="display:flex;flex-direction:column;gap:6px">
              ${(day.sections[sec]||[]).map((ex, ei) => `
                <div style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:10px;padding:10px 12px">
                  <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
                    <input class="ex-name-inp form-input" data-sec="${sec}" data-ei="${ei}" style="flex:1;padding:5px 8px;font-size:13px;font-weight:700" value="${ex.name}" placeholder="Exercise name" />
                    <button class="ex-pick-btn" data-sec="${sec}" data-ei="${ei}" title="Search from tracking" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:var(--muted);font-size:12px;padding:5px 8px;cursor:pointer;flex-shrink:0">🔍</button>
                    <button class="ex-del-btn" data-sec="${sec}" data-ei="${ei}" style="background:none;border:none;color:var(--muted);font-size:15px;cursor:pointer;flex-shrink:0">✕</button>
                  </div>
                  <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin-bottom:6px">
                    <div>
                      <div style="font-size:9px;color:var(--muted);margin-bottom:3px;text-align:center">Sets</div>
                      <input class="ex-sets-inp form-input" data-sec="${sec}" data-ei="${ei}" type="number" min="1" style="width:100%;padding:5px 4px;font-size:12px;text-align:center" value="${ex.sets||''}" placeholder="—" />
                    </div>
                    <div>
                      <div style="font-size:9px;color:var(--muted);margin-bottom:3px;text-align:center">Reps</div>
                      <input class="ex-reps-inp form-input" data-sec="${sec}" data-ei="${ei}" style="width:100%;padding:5px 4px;font-size:12px;text-align:center" value="${ex.reps||''}" placeholder="8-12" />
                    </div>
                    <div>
                      <div style="font-size:9px;color:var(--muted);margin-bottom:3px;text-align:center">Last RPE</div>
                      <input class="ex-rpe-inp form-input" data-sec="${sec}" data-ei="${ei}" style="width:100%;padding:5px 4px;font-size:12px;text-align:center" value="${ex.lastRPE||''}" placeholder="~9" />
                    </div>
                    <div>
                      <div style="font-size:9px;color:var(--muted);margin-bottom:3px;text-align:center">Rest</div>
                      <input class="ex-rest-inp form-input" data-sec="${sec}" data-ei="${ei}" style="width:100%;padding:5px 4px;font-size:12px;text-align:center" value="${ex.rest||''}" placeholder="2 min" />
                    </div>
                  </div>
                  <input class="ex-desc-inp form-input" data-sec="${sec}" data-ei="${ei}" style="width:100%;padding:5px 8px;font-size:11px;color:var(--muted)" value="${ex.desc||''}" placeholder="Notes / cues for this exercise..." />
                  <div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06)">
                    ${(ex.subs||[]).map((sub, si) => `
                      <div style="display:flex;align-items:center;gap:5px;margin-bottom:5px">
                        <span style="font-size:10px;color:var(--muted);flex-shrink:0;width:38px">Sub ${si+1}</span>
                        <input class="ex-sub-inp form-input" data-sec="${sec}" data-ei="${ei}" data-si="${si}" style="flex:1;padding:4px 8px;font-size:12px" value="${sub.name||''}" placeholder="Substitute name" />
                        <button class="ex-sub-pick-btn" data-sec="${sec}" data-ei="${ei}" data-si="${si}" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:var(--muted);font-size:11px;padding:4px 7px;cursor:pointer;flex-shrink:0">🔍</button>
                        <button class="ex-sub-del-btn" data-sec="${sec}" data-ei="${ei}" data-si="${si}" style="background:none;border:none;color:var(--muted);font-size:14px;cursor:pointer;flex-shrink:0;line-height:1">✕</button>
                      </div>`).join('')}
                    <button class="ex-add-sub-btn" data-sec="${sec}" data-ei="${ei}" style="font-size:10px;color:var(--muted);background:none;border:1px dashed rgba(255,255,255,0.1);border-radius:6px;padding:3px 10px;cursor:pointer;width:100%;text-align:left;margin-top:2px">＋ Add Substitute</button>
                  </div>
                </div>`).join('')}
              ${(day.sections[sec]||[]).length === 0 ? `<div style="text-align:center;padding:10px;font-size:11px;color:var(--muted)">No exercises yet</div>` : ''}
            </div>
          </div>`).join('')}`;

      el.querySelector('#dayNameInp').addEventListener('change', e => { day.name = e.target.value.trim() || day.name; });
      el.querySelector('#dayLabelInp').addEventListener('change', e => { day.label = e.target.value.trim().slice(0,8) || day.label; });

      /* Section-level "From Tracking" pick button */
      el.querySelectorAll('.sec-pick-ex').forEach(btn => {
        btn.addEventListener('click', () => {
          saveDayEdits(day, el);
          const sec = btn.dataset.sec;
          openExercisePicker(name => {
            if (!day.sections[sec]) day.sections[sec] = [];
            day.sections[sec].push({ id: uid(), name, sets: '', reps: '', lastRPE: '', rest: '', desc: '', subs: [] });
            renderBuilder();
          });
        });
      });

      /* Per-exercise pick button */
      el.querySelectorAll('.ex-pick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          saveDayEdits(day, el);
          const sec = btn.dataset.sec;
          const ei  = +btn.dataset.ei;
          openExercisePicker(name => {
            if (day.sections[sec]?.[ei]) {
              day.sections[sec][ei].name = name;
              renderBuilder();
            }
          });
        });
      });

      el.querySelectorAll('.sec-add-ex').forEach(btn => {
        btn.addEventListener('click', () => {
          saveDayEdits(day, el);
          const sec = btn.dataset.sec;
          if (!day.sections[sec]) day.sections[sec] = [];
          day.sections[sec].push({ id: uid(), name: '', sets: '', reps: '', lastRPE: '', rest: '', desc: '', subs: [] });
          renderBuilder();
        });
      });

      el.querySelectorAll('.ex-del-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          saveDayEdits(day, el);
          day.sections[btn.dataset.sec].splice(+btn.dataset.ei, 1);
          renderBuilder();
        });
      });

      el.querySelectorAll('.ex-add-sub-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          saveDayEdits(day, el);
          const ex = day.sections[btn.dataset.sec]?.[+btn.dataset.ei];
          if (ex) { if (!ex.subs) ex.subs = []; ex.subs.push({ name: '' }); }
          renderBuilder();
        });
      });

      el.querySelectorAll('.ex-sub-del-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          saveDayEdits(day, el);
          const ex = day.sections[btn.dataset.sec]?.[+btn.dataset.ei];
          if (ex?.subs) ex.subs.splice(+btn.dataset.si, 1);
          renderBuilder();
        });
      });

      el.querySelectorAll('.ex-sub-pick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          saveDayEdits(day, el);
          const sec = btn.dataset.sec, ei = +btn.dataset.ei, si = +btn.dataset.si;
          openExercisePicker(name => {
            const ex = day.sections[sec]?.[ei];
            if (ex?.subs?.[si] !== undefined) { ex.subs[si].name = name; renderBuilder(); }
          });
        });
      });
    }

    /* ── Exercise picker (search from tracking logbook) ── */
    function openExercisePicker(onSelect) {
      const tracked = [...new Set(
        (ws.logbook || []).flatMap(entry => (entry.exercises || []).map(ex => ex.name).filter(Boolean))
      )].sort();

      let pickerEl = document.getElementById('rbExercisePicker');
      if (!pickerEl) {
        pickerEl = document.createElement('div');
        pickerEl.id = 'rbExercisePicker';
        pickerEl.className = 'ex-modal-overlay';
        pickerEl.style.zIndex = '10100';
        pickerEl.innerHTML = `
          <div class="ex-modal" style="max-height:80vh;max-width:480px">
            <div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;flex-shrink:0">
              <div style="flex:1;font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700">Select Exercise</div>
              <button id="rbPickerClose" style="background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer;line-height:1">✕</button>
            </div>
            <div style="padding:10px 14px;border-bottom:1px solid var(--border);flex-shrink:0">
              <input id="rbPickerSearch" class="form-input" style="width:100%;padding:8px 12px;font-size:13px" placeholder="Search exercises..." />
            </div>
            <div id="rbPickerList" style="overflow-y:auto;flex:1"></div>
          </div>`;
        document.body.appendChild(pickerEl);
        pickerEl.addEventListener('click', e => { if (e.target === pickerEl) pickerEl.classList.remove('open'); });
      }
      pickerEl.classList.add('open');

      function renderPickerList(filter) {
        const list = pickerEl.querySelector('#rbPickerList');
        const filtered = tracked.filter(n => !filter || n.toLowerCase().includes(filter.toLowerCase()));
        if (filtered.length === 0) {
          list.innerHTML = `<div style="padding:24px;text-align:center;color:var(--muted);font-size:12px">${tracked.length === 0 ? 'No exercises logged yet — add some via Exercise Library first.' : 'No match found.'}</div>`;
          return;
        }
        list.innerHTML = filtered.map(n => `
          <div class="rb-picker-item" data-name="${n.replace(/"/g,'&quot;')}" style="padding:12px 16px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.04);display:flex;align-items:center;gap:10px">
            <div style="font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:600;flex:1">${n}</div>
            <span style="font-size:10px;color:var(--accent);font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px">SELECT</span>
          </div>`).join('');
        list.querySelectorAll('.rb-picker-item').forEach(item => {
          item.addEventListener('click', () => {
            onSelect(item.dataset.name);
            pickerEl.classList.remove('open');
          });
        });
      }

      pickerEl.querySelector('#rbPickerClose').onclick = () => pickerEl.classList.remove('open');
      pickerEl.querySelector('#rbPickerSearch').value = '';
      pickerEl.querySelector('#rbPickerSearch').oninput = e => renderPickerList(e.target.value);
      renderPickerList('');
      setTimeout(() => pickerEl.querySelector('#rbPickerSearch').focus(), 50);
    }

    /* Collect exercise field values from the day editor before re-rendering */
    function saveDayEdits(day, el) {
      ['warmup','main','stretching'].forEach(sec => {
        const exList = day.sections[sec] || [];
        el.querySelectorAll(`.ex-name-inp[data-sec="${sec}"]`).forEach((inp, ei) => { if (exList[ei]) exList[ei].name    = inp.value.trim(); });
        el.querySelectorAll(`.ex-sets-inp[data-sec="${sec}"]`).forEach((inp, ei) => { if (exList[ei]) exList[ei].sets    = inp.value.trim(); });
        el.querySelectorAll(`.ex-reps-inp[data-sec="${sec}"]`).forEach((inp, ei) => { if (exList[ei]) exList[ei].reps    = inp.value.trim(); });
        el.querySelectorAll(`.ex-rpe-inp[data-sec="${sec}"]`).forEach((inp, ei)  => { if (exList[ei]) exList[ei].lastRPE = inp.value.trim(); });
        el.querySelectorAll(`.ex-rest-inp[data-sec="${sec}"]`).forEach((inp, ei) => { if (exList[ei]) exList[ei].rest    = inp.value.trim(); });
        el.querySelectorAll(`.ex-desc-inp[data-sec="${sec}"]`).forEach((inp, ei) => { if (exList[ei]) exList[ei].desc    = inp.value.trim(); });
        el.querySelectorAll(`.ex-sub-inp[data-sec="${sec}"]`).forEach(inp => {
          const ei = +inp.dataset.ei, si = +inp.dataset.si;
          if (exList[ei]?.subs?.[si] !== undefined) exList[ei].subs[si].name = inp.value.trim();
        });
      });
    }

    renderBuilder();
  }

  /* ── Initial render ── */
  renderTab();
});
