/**
 * KOLTYN OS — dashboard.js
 *
 * Tabs: Overview | Customize
 *
 * Overview sections:
 *   1. Command Center — goal banner + stat rings
 *   2. Today's Focus + Tasks — weekly priority, top 3, task list with voice
 *   3. Today — workout (expanded) + meal plan side by side
 *   4. Morning Ritual — movement exercises + routine steps in 2 columns
 *   5. Vision Board
 *
 * Customize tab:
 *   - Edit morning habit list (stored in STATE, defaults from APP_DATA)
 *   - Completed tasks archive + clear
 *
 * STATE READS:
 *   STATE.data.dashboard → weeklyTopPriority, todayPriorities, tasks, customHabits
 *   STATE.data.workout   → schedule, currentDayIndex, currentPhase, weekNumber, routines
 *   STATE.data.nutrition → mealPlan[today], userMeals
 *
 * STATE WRITES:
 *   STATE.setWeeklyPriority()   → dashboard.weeklyTopPriority
 *   STATE.setTodayPriorities()  → dashboard.todayPriorities
 *   STATE.addTask()             → dashboard.tasks[]
 *   STATE.toggleTask()          → dashboard.tasks[].done
 *   STATE.removeTask()          → dashboard.tasks[]
 *   STATE.setDashboardHabits()  → dashboard.customHabits
 */

window.registerPage('dashboard', function initDashboard() {

  /* ── Static data ── */
  const STATS        = APP_DATA.dashboard.stats;
  const VISION_AREAS = APP_DATA.vision.areas;
  const MOVEMENT = [
    { name:'Pull-Ups',      sets:'3–5 sets',        rest:'2–3 min',   cue:'Dead hang start. Scapular retraction before pulling. Chin clears bar.',               progression:'Add reps → resistance band → weight vest' },
    { name:'Pike Push-Ups', sets:'3–4 × 8–15',      rest:'90 sec',    cue:'Hips high, head through on descent. Elbows track forward.',                           progression:'Elevate feet → decline → wall HSPU negative' },
    { name:'Handstand',     sets:'10–15 min block',  rest:'As needed', cue:'Finger-pad pressure controls balance. Hollow body, slight shoulder shrug.',            progression:'Wall kick-up → wall freestanding → freestand' },
    { name:'Push-Ups',      sets:'3–4 sets',        rest:'60–90 sec', cue:'Elbows ~45°. Full ROM — chest to floor, lock out top.',                                progression:'Standard → archer → weighted → ring push-up' },
    { name:'L-Sit',         sets:'5 × max hold',    rest:'60 sec',    cue:'Straight legs, toes pointed. Depress shoulders. Push floor away.',                     progression:'Tuck → one leg → full L-sit → V-sit' },
    { name:'Planche Lean',  sets:'4–5 × 10–20 sec', rest:'90 sec',    cue:'Lean forward until weight shifts to wrists. Posterior pelvic tilt. Full depression.',  progression:'Lean → tuck → advanced tuck → straddle → full' },
  ];

  /* ── Live state refs ── */
  const ds  = STATE.data.dashboard;
  const ws  = STATE.data.workout;
  const ns  = STATE.data.nutrition;
  const todayStr        = new Date().toISOString().slice(0, 10);
  const todayWorkoutDay = STATE.currentWorkoutDay;

  /* ── Tab state ── */
  let activeTab = 'overview';

  /* ── Helpers ── */
  function getMorningHabits() {
    return ds.customHabits || APP_DATA.dashboard.morningHabits || [];
  }

  function getMealName(id) {
    if (!id) return null;
    const u = (ns.userMeals || []).find(m => m.id === id);
    if (u) return u.name;
    const phases = APP_DATA.nutrition?.meals || {};
    for (const slots of Object.values(phases)) {
      for (const slotMeals of (slots || [])) {
        for (const m of (slotMeals || [])) {
          if ('base_' + m.name.replace(/\s+/g, '_').toLowerCase() === id) return m.name;
        }
      }
    }
    return null;
  }

  /* Returns the next upcoming meal slot key based on current hour */
  function getNextSlot() {
    const h = new Date().getHours();
    if (h <  10) return 'breakfast';
    if (h <  14) return 'lunch';
    if (h <  19) return 'dinner';
    if (h <  22) return 'snack';
    return 'breakfast'; /* next day */
  }

  function getTodayRoutineInfo() {
    const r = (ws.routines || []).find(r => r.id === ws.activeRoutineId);
    if (!r?.stages?.length) return null;
    for (const stage of r.stages) {
      const dr = (stage.dayRoutines || []).find(d =>
        d.label === todayWorkoutDay || (d.name || '').includes(todayWorkoutDay)
      );
      if (dr) {
        const exs = (dr.sections?.main || [])
          .map(e => typeof e === 'string' ? e : e.name || e.exerciseName || '')
          .filter(Boolean).slice(0, 5);
        return { stageName: stage.name, dayLabel: dr.name || todayWorkoutDay, exercises: exs };
      }
    }
    return null;
  }

  /* ── Root render ── */
  const inner = document.getElementById('dashboard-inner');

  function render() {
    inner.innerHTML = `
      ${buildPageHeader('Personal OS', 'Morning', 'Dashboard',
        new Date().toLocaleDateString('en-US', {weekday:'long', year:'numeric', month:'long', day:'numeric'}))}

      <div class="day-tabs" style="margin-bottom:16px">
        <button class="day-tab${activeTab === 'overview'  ? ' active' : ''}" data-tab="overview">Overview</button>
        <button class="day-tab${activeTab === 'customize' ? ' active' : ''}" data-tab="customize">Customize</button>
      </div>

      <div id="db-overview" style="display:${activeTab === 'overview'  ? '' : 'none'}"></div>
      <div id="db-customize" style="display:${activeTab === 'customize' ? '' : 'none'}"></div>`;

    inner.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => { activeTab = btn.dataset.tab; render(); });
    });

    if (activeTab === 'overview')  renderOverview();
    else                           renderCustomize();
  }

  /* ══════════════════════════════════════════════════════════════
     OVERVIEW TAB
  ══════════════════════════════════════════════════════════════ */
  function renderOverview() {
    const el   = document.getElementById('db-overview');
    const plan = ns.mealPlan?.[todayStr] || {};
    const SLOT_LABELS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
    const SLOT_KEYS   = ['breakfast', 'lunch', 'dinner', 'snack'];
    const routineInfo = getTodayRoutineInfo();
    const nextSlot    = getNextSlot();
    const habits      = getMorningHabits();
    const tasks       = ds.tasks || [];

    el.innerHTML = `

      <!-- ══ COMMAND CENTER ══ -->
      <div class="card" style="overflow:hidden;margin-bottom:14px">
        <div style="background:linear-gradient(135deg,rgba(79,195,247,0.1) 0%,rgba(2,136,209,0.05) 100%);border-bottom:1px solid rgba(79,195,247,0.2);padding:16px 20px">
          <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#4fc3f7;margin-bottom:5px">Overarching Goal</div>
          <div style="font-family:'Rajdhani',sans-serif;font-size:17px;font-weight:700;line-height:1.35;margin-bottom:8px">${APP_DATA.vision.overarchingGoal}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${APP_DATA.vision.goalPillars.map(p => `<span style="font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;letter-spacing:1px;padding:3px 10px;border-radius:20px;border:1px solid rgba(79,195,247,0.3);color:#4fc3f7;background:rgba(79,195,247,0.08)">${p}</span>`).join('')}
          </div>
        </div>
        <div style="padding:16px 20px">
          <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:var(--muted);margin-bottom:12px">Progress</div>
          <div class="stat-rings-row" id="statRings"></div>
        </div>
      </div>

      <!-- ══ TODAY'S FOCUS + TASKS ══ -->
      <div class="card" style="overflow:hidden;margin-bottom:14px">
        <div class="card-header" style="border-bottom:1px solid var(--border)">
          <div class="card-title">Today's Focus</div>
          <span style="font-family:'Rajdhani',sans-serif;font-size:10px;color:var(--muted)">${new Date().toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'})}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">

          <!-- Left: priorities -->
          <div style="padding:16px 20px;border-right:1px solid var(--border)">
            <div style="font-size:10px;font-family:'Rajdhani',sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:4px">Weekly Priority</div>
            <input class="form-input" id="weeklyPriorityInput"
              placeholder="The single most important thing this week…"
              value="${(ds.weeklyTopPriority || '').replace(/"/g, '&quot;')}"
              style="margin-bottom:12px" />

            <div style="font-size:10px;font-family:'Rajdhani',sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:6px">Top 3 Today</div>
            ${[0,1,2].map(i => `
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                <span style="font-family:'Rajdhani',sans-serif;font-weight:700;color:var(--accent);font-size:13px;min-width:14px;flex-shrink:0">${i+1}</span>
                <input class="form-input today-p" data-idx="${i}"
                  placeholder="Priority ${i+1}…"
                  value="${(ds.todayPriorities?.[i] || '').replace(/"/g, '&quot;')}"
                  style="flex:1" />
              </div>`).join('')}

            <button class="day-tab active" id="saveFocus" style="margin-top:8px;padding:7px 16px">Save</button>
          </div>

          <!-- Right: tasks -->
          <div style="padding:16px 20px;display:flex;flex-direction:column;gap:0">
            <div style="font-size:10px;font-family:'Rajdhani',sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:8px">Tasks</div>
            <div style="display:flex;gap:6px;margin-bottom:10px">
              <input class="form-input" id="taskInput" placeholder="Add a task…" style="flex:1;margin:0" />
              <button id="taskVoiceBtn" title="Voice input" style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:8px;padding:5px 10px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;gap:5px;transition:all 0.15s">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--muted);flex-shrink:0"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                <span id="taskVoiceLabel" style="font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.5px;color:var(--muted)">Speak</span>
              </button>
              <button id="taskAddBtn" style="background:var(--accent);border:none;border-radius:8px;padding:5px 12px;cursor:pointer;color:#000;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:12px;flex-shrink:0">Add</button>
            </div>
            <div id="taskList" style="flex:1;overflow-y:auto;max-height:210px">
              ${renderTaskListHTML(tasks)}
            </div>
          </div>

        </div>
      </div>

      <!-- ══ TODAY: Workout + Meal Plan ══ -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">

        <!-- Workout -->
        <div class="card" style="overflow:hidden">
          <div class="card-header">
            <div class="card-title">Today's Workout</div>
            <span class="badge badge-${todayWorkoutDay === 'Rest' ? 'muted' : 'warn'}">${ws.currentPhase === 'recovery' ? 'Recovery' : 'Ramping'} · Wk ${ws.weekNumber || 1}</span>
          </div>
          <div class="card-body">
            <div style="font-family:'Rajdhani',sans-serif;font-size:38px;font-weight:700;color:var(--accent);line-height:1;margin-bottom:6px">${todayWorkoutDay}</div>
            ${routineInfo ? `
              <div style="font-size:10px;font-family:'Rajdhani',sans-serif;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:6px">${routineInfo.stageName}</div>
              ${routineInfo.exercises.length > 0 ? `
                <div style="margin-bottom:10px">
                  ${routineInfo.exercises.map(ex => `<div style="font-size:12px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.04);color:rgba(226,234,242,0.85)">${ex}</div>`).join('')}
                </div>` : ''}
            ` : `
              <div style="font-size:11px;color:var(--muted);line-height:1.8;margin-bottom:10px">${ws.schedule.join(' · ')}</div>
            `}
            <button class="day-tab" onclick="navigateTo('workout')" style="padding:7px 14px;font-size:11px">Open Workout →</button>
          </div>
        </div>

        <!-- Meal Plan -->
        <div class="card" style="overflow:hidden">
          <div class="card-header">
            <div class="card-title">Today's Meals</div>
            <button onclick="navigateTo('nutrition')" style="background:none;border:none;color:var(--accent);font-size:11px;font-family:'Rajdhani',sans-serif;font-weight:700;cursor:pointer;padding:0;letter-spacing:0.5px">Plan →</button>
          </div>
          <div class="card-body" style="padding:4px 16px 10px">
            ${SLOT_KEYS.map((slot, i) => {
              const mealId   = plan[slot];
              const mealName = getMealName(mealId);
              const qas      = (plan.quickAdds || []).filter(qa => qa.slot === slot);
              const isNext   = slot === nextSlot;
              return `
                <div style="padding:8px ${isNext ? '10px' : '0'};margin:${isNext ? '4px -10px' : '0'};${i < 3 ? 'border-bottom:1px solid rgba(255,255,255,0.04)' : ''};${isNext ? 'background:rgba(124,106,247,0.08);border-radius:8px;border-bottom:none;' : ''}">
                  <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
                    <div style="font-family:'Rajdhani',sans-serif;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${isNext ? 'var(--accent)' : 'var(--muted)'};">${SLOT_LABELS[i]}</div>
                    ${isNext ? `<span style="font-family:'Rajdhani',sans-serif;font-size:8px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--accent);background:rgba(124,106,247,0.18);border:1px solid rgba(124,106,247,0.3);border-radius:10px;padding:1px 6px">Next</span>` : ''}
                  </div>
                  ${mealName
                    ? `<div style="font-size:12.5px;color:${isNext ? 'var(--text)' : 'var(--text)'};">${mealName}</div>`
                    : `<div style="font-size:12px;color:var(--muted)">—</div>`}
                  ${qas.map(qa => `<div style="font-size:11px;color:var(--muted)">+ ${qa.name} <span style="opacity:0.6">${qa.calories}kcal</span></div>`).join('')}
                </div>`;
            }).join('')}
          </div>
        </div>

      </div>

      <!-- ══ MORNING RITUAL — 2 col ══ -->
      <div class="card" style="overflow:hidden;margin-bottom:14px">
        <div class="card-header" style="border-bottom:1px solid var(--border)">
          <div class="card-title">Morning Ritual</div>
          <span class="badge badge-accent">Daily</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">

          <!-- Movement column -->
          <div style="border-right:1px solid var(--border)">
            <div style="padding:10px 16px 6px;font-family:'Rajdhani',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted)">Movement · Pre-session</div>
            ${MOVEMENT.map(s => `
              <div style="padding:9px 16px;border-top:1px solid rgba(255,255,255,0.04)">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;gap:6px">
                  <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700">${s.name}</div>
                  <span class="badge badge-accent" style="font-size:9px;flex-shrink:0">${s.sets}</span>
                </div>
                <div style="font-size:11px;color:rgba(226,234,242,0.72);line-height:1.4;margin-bottom:2px">${s.cue}</div>
                <div style="font-size:10px;color:var(--muted)">↑ ${s.progression}</div>
              </div>`).join('')}
          </div>

          <!-- Routine column -->
          <div>
            <div style="padding:10px 16px 6px;font-family:'Rajdhani',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted)">Routine · ${habits.length} steps</div>
            ${habits.map((h, i) => `
              <div style="display:flex;align-items:flex-start;gap:8px;padding:9px 16px;border-top:1px solid rgba(255,255,255,0.04)">
                <span style="font-family:'Rajdhani',sans-serif;font-weight:700;color:var(--accent);font-size:12px;min-width:18px;flex-shrink:0">${i+1}.</span>
                <span style="font-size:12px;color:rgba(226,234,242,0.85);line-height:1.4">${h}</span>
              </div>`).join('')}
          </div>

        </div>
      </div>

      <!-- ══ VISION BOARD ══ -->
      <div class="section-label">Vision Board</div>
      <div id="visionAreas"></div>
    `;

    buildStatRings();
    buildVisionAreas();
    wireFocus();
    wireTaskControls();
  }

  /* ══════════════════════════════════════════════════════════════
     CUSTOMIZE TAB
  ══════════════════════════════════════════════════════════════ */
  function renderCustomize() {
    const el     = document.getElementById('db-customize');
    const habits = getMorningHabits();
    const done   = (ds.tasks || []).filter(t => t.done);

    el.innerHTML = `
      <div class="card" style="margin-bottom:16px">
        <div class="card-header">
          <div class="card-title">Morning Habits</div>
          <button id="addHabitBtn" class="day-tab active" style="padding:5px 12px;font-size:11px">+ Add</button>
        </div>
        <div class="card-body" style="padding:4px 16px">
          ${habits.map((h, i) => `
            <div style="display:flex;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
              <span style="font-family:'Rajdhani',sans-serif;font-weight:700;color:var(--accent);font-size:12px;min-width:18px;flex-shrink:0">${i+1}.</span>
              <span style="flex:1;font-size:12.5px">${h}</span>
              <button data-habit-rm="${i}" style="background:none;border:none;color:var(--muted);font-size:16px;cursor:pointer;padding:2px 6px;line-height:1">×</button>
            </div>`).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">Completed Tasks</div>
          ${done.length > 0 ? `<button id="clearDoneBtn" class="day-tab" style="padding:5px 12px;font-size:11px">Clear All</button>` : ''}
        </div>
        <div class="card-body" style="padding:4px 16px">
          ${done.length === 0
            ? `<div style="font-size:12px;color:var(--muted);padding:8px 0">No completed tasks.</div>`
            : done.map(t => `
              <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
                <span style="flex:1;font-size:12.5px;text-decoration:line-through;color:var(--muted)">${t.text}</span>
                <button data-task-rm="${t.id}" style="background:none;border:none;color:var(--muted);font-size:16px;cursor:pointer;padding:2px 6px;line-height:1">×</button>
              </div>`).join('')}
        </div>
      </div>
    `;

    el.querySelectorAll('[data-habit-rm]').forEach(btn => {
      btn.addEventListener('click', () => {
        const updated = [...getMorningHabits()];
        updated.splice(parseInt(btn.dataset.habitRm), 1);
        STATE.setDashboardHabits(updated);
        renderCustomize();
      });
    });

    el.querySelector('#addHabitBtn').addEventListener('click', () => {
      const text = prompt('New morning habit:');
      if (!text?.trim()) return;
      STATE.setDashboardHabits([...getMorningHabits(), text.trim()]);
      renderCustomize();
    });

    el.querySelectorAll('[data-task-rm]').forEach(btn => {
      btn.addEventListener('click', () => { STATE.removeTask(btn.dataset.taskRm); renderCustomize(); });
    });

    const clearBtn = el.querySelector('#clearDoneBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        (ds.tasks || []).filter(t => t.done).forEach(t => STATE.removeTask(t.id));
        renderCustomize();
      });
    }
  }

  /* ══════════════════════════════════════════════════════════════
     STAT RINGS
  ══════════════════════════════════════════════════════════════ */
  function buildStatRings() {
    const CIRC   = 201.06;
    const ringsEl = document.getElementById('statRings');
    if (!ringsEl) return;
    STATS.forEach(s => {
      const pct     = s.invert
        ? (s.current <= s.goal ? 1 : Math.max(0, s.goal / s.current))
        : (s.goal > 0 ? Math.min(1, s.current / s.goal) : 0);
      const fillArc = (pct * CIRC).toFixed(2);
      ringsEl.innerHTML += `
        <div class="stat-ring-card">
          <div class="stat-ring-wrap">
            <svg class="stat-ring-svg" viewBox="0 0 80 80" aria-hidden="true">
              <circle class="stat-ring-track" cx="40" cy="40" r="32" />
              <circle class="stat-ring-fill" cx="40" cy="40" r="32"
                style="stroke:${s.color};stroke-dasharray:${fillArc} ${CIRC}" />
            </svg>
            <div class="stat-ring-inner">
              <span class="stat-ring-value">${s.value}</span>
              <span class="stat-ring-unit">${s.unit}</span>
            </div>
          </div>
          <div class="stat-ring-label">${s.label}</div>
          <div class="stat-ring-note">${s.note}</div>
        </div>`;
    });
  }

  /* ══════════════════════════════════════════════════════════════
     VISION AREAS
  ══════════════════════════════════════════════════════════════ */
  function buildVisionAreas() {
    const areasEl = document.getElementById('visionAreas');
    if (!areasEl) return;
    VISION_AREAS.forEach(area => {
      areasEl.innerHTML += `
        <div class="vision-area" style="margin-bottom:14px">
          <div class="vision-area-header">
            <div class="vision-area-icon">${area.icon}</div>
            <div class="vision-area-title">${area.name}</div>
          </div>
          <div class="vision-columns">
            <div class="vision-col">
              <div class="vision-col-label">Dream Big</div>
              ${area.dream.map(d => `<div class="vision-item">${d}</div>`).join('')}
            </div>
            <div class="vision-col">
              <div class="vision-col-label">1-Year Goal</div>
              ${area.oneYear.map(g => `<div class="vision-item">${g}</div>`).join('')}
            </div>
            <div class="vision-col">
              <div class="vision-col-label">90-Day Focus</div>
              ${area.focus.map(f => `<div class="vision-item">${f}</div>`).join('')}
            </div>
          </div>
        </div>`;
    });
  }

  /* ══════════════════════════════════════════════════════════════
     FOCUS SAVE
  ══════════════════════════════════════════════════════════════ */
  function wireFocus() {
    inner.querySelector('#saveFocus').addEventListener('click', () => {
      const weekly = inner.querySelector('#weeklyPriorityInput').value.trim();
      const [p1, p2, p3] = [...inner.querySelectorAll('.today-p')].map(i => i.value.trim());
      STATE.setWeeklyPriority(weekly);
      STATE.setTodayPriorities(p1, p2, p3);
      const btn = inner.querySelector('#saveFocus');
      btn.textContent = 'Saved ✓';
      setTimeout(() => { btn.textContent = 'Save'; }, 1500);
    });
  }

  /* ══════════════════════════════════════════════════════════════
     TASK CONTROLS — add, toggle, remove, voice
  ══════════════════════════════════════════════════════════════ */
  function renderTaskListHTML(tasks) {
    const active = tasks.filter(t => !t.done);
    const done   = tasks.filter(t => t.done);
    const all    = [...active, ...done];
    if (all.length === 0) return `<div style="font-size:12px;color:var(--muted);padding:4px 0">No tasks yet.</div>`;
    return all.map(t => `
      <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
        <input type="checkbox" ${t.done ? 'checked' : ''} data-task-toggle="${t.id}"
          style="width:15px;height:15px;accent-color:var(--accent);cursor:pointer;flex-shrink:0" />
        <span style="flex:1;font-size:12.5px;${t.done ? 'text-decoration:line-through;color:var(--muted)' : ''}">${t.text}</span>
        <button data-task-rm="${t.id}" style="background:none;border:none;color:var(--muted);font-size:14px;cursor:pointer;padding:2px 4px;line-height:1;flex-shrink:0">×</button>
      </div>`).join('');
  }

  function wireTaskControls() {
    const taskInput    = inner.querySelector('#taskInput');
    const taskAddBtn   = inner.querySelector('#taskAddBtn');
    const taskVoiceBtn = inner.querySelector('#taskVoiceBtn');
    const taskList     = inner.querySelector('#taskList');

    function addTask() {
      const text = taskInput.value.trim();
      if (!text) return;
      STATE.addTask(text);
      taskInput.value = '';
      taskList.innerHTML = renderTaskListHTML(ds.tasks || []);
      wireListEvents();
    }

    function wireListEvents() {
      taskList.querySelectorAll('[data-task-toggle]').forEach(cb => {
        cb.addEventListener('change', () => {
          STATE.toggleTask(cb.dataset.taskToggle);
          taskList.innerHTML = renderTaskListHTML(ds.tasks || []);
          wireListEvents();
        });
      });
      taskList.querySelectorAll('[data-task-rm]').forEach(btn => {
        btn.addEventListener('click', () => {
          STATE.removeTask(btn.dataset.taskRm);
          taskList.innerHTML = renderTaskListHTML(ds.tasks || []);
          wireListEvents();
        });
      });
    }

    taskAddBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

    /* Voice input via Web Speech API */
    const voiceLabel = inner.querySelector('#taskVoiceLabel');
    const voiceSvg   = taskVoiceBtn.querySelector('svg');

    function setVoiceActive(on) {
      if (on) {
        taskVoiceBtn.style.background    = 'rgba(239,68,68,0.12)';
        taskVoiceBtn.style.borderColor   = '#ef4444';
        if (voiceSvg) voiceSvg.style.color = '#ef4444';
        if (voiceLabel) { voiceLabel.textContent = 'Listening…'; voiceLabel.style.color = '#ef4444'; }
      } else {
        taskVoiceBtn.style.background    = 'rgba(255,255,255,0.04)';
        taskVoiceBtn.style.borderColor   = '';
        if (voiceSvg) voiceSvg.style.color = 'var(--muted)';
        if (voiceLabel) { voiceLabel.textContent = 'Speak'; voiceLabel.style.color = 'var(--muted)'; }
      }
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      let rec = null, listening = false;
      taskVoiceBtn.addEventListener('click', () => {
        if (listening) { rec?.stop(); return; }
        rec = new SpeechRec();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';
        rec.onstart  = () => { listening = true;  setVoiceActive(true);  };
        rec.onresult = e  => { taskInput.value = e.results[0][0].transcript; };
        rec.onend = rec.onerror = () => { listening = false; setVoiceActive(false); };
        rec.start();
      });
    } else {
      taskVoiceBtn.style.opacity = '0.3';
      taskVoiceBtn.style.cursor  = 'default';
      taskVoiceBtn.title = 'Voice input not supported in this browser';
      if (voiceLabel) voiceLabel.textContent = 'N/A';
    }

    wireListEvents();
  }

  render();
});
