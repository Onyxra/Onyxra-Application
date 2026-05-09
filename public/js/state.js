/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  KOLTYN OS — state.js                                           ║
 * ║  Live session state: in-memory + IndexedDB persistence          ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  HOW STATE WORKS                                                ║
 * ║                                                                  ║
 * ║  1. APP_DATA (data.js) = static master template. Read-only.    ║
 * ║     It is the "factory defaults" file — hosted on GitHub.       ║
 * ║     Pages read blueprint templates, meal lists, etc. from here. ║
 * ║                                                                  ║
 * ║  2. window.STATE = live in-memory object. Single source of      ║
 * ║     truth for ALL runtime data — priorities, venture progress,  ║
 * ║     workout logs, custom meals, step completions, notes.        ║
 * ║     UI always reads from STATE; interactions always write to it.║
 * ║                                                                  ║
 * ║  3. IndexedDB (db: koltyn-os, store: state) = persistence.     ║
 * ║     STATE is loaded from IDB on startup. If empty, it is        ║
 * ║     bootstrapped from APP_DATA defaults. Every mutation calls   ║
 * ║     STATE.save() which writes to IDB asynchronously.           ║
 * ║                                                                  ║
 * ║  4. Export = full STATE snapshot as downloadable JSON.          ║
 * ║     To update the live master JSON on GitHub: download the      ║
 * ║     snapshot, commit it as data.js (adjust format), and push.  ║
 * ║                                                                  ║
 * ║  5. Import = restore STATE from a previously exported file.     ║
 * ║     Useful for migrating to another device or restoring a       ║
 * ║     previous session.                                           ║
 * ║                                                                  ║
 * ║  HIERARCHY                                                       ║
 * ║    Master Hormozi Roadmap (overarching, in state.business)      ║
 * ║      └── Ventures  (state.business.ventures[])                  ║
 * ║            └── Blueprints  (venture.blueprints[])               ║
 * ║                  └── Steps  (blueprint.steps[])                 ║
 * ║                                                                  ║
 * ║  FORMS → STATE → IDB                                            ║
 * ║    All form submissions call a STATE mutator (e.g.              ║
 * ║    STATE.setWeeklyPriority(), STATE.completeStep()) which       ║
 * ║    updates the in-memory object then calls STATE.save().        ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

/* ──────────────────────────────────────────────────────────────────
   IndexedDB wrapper — minimal, promise-based
────────────────────────────────────────────────────────────────── */
const _DB_NAME    = 'koltyn-os';
const _DB_VERSION = 1;
const _STORE      = 'state';
const _STATE_KEY  = 'main';

function _openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(_DB_NAME, _DB_VERSION);
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore(_STORE);
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

function _idbGet(db) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(_STORE, 'readonly');
    const req = tx.objectStore(_STORE).get(_STATE_KEY);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

function _idbPut(db, value) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(_STORE, 'readwrite');
    const req = tx.objectStore(_STORE).put(value, _STATE_KEY);
    req.onsuccess = () => resolve();
    req.onerror   = e  => reject(e.target.error);
  });
}

/* ──────────────────────────────────────────────────────────────────
   Default state bootstrap
   Called when IndexedDB has no saved state yet (first run).
   All values come from APP_DATA so personalisation stays in data.js.
────────────────────────────────────────────────────────────────── */
function _defaultState() {
  /* Build blueprint step arrays for each template */
  function bpSteps(templateId) {
    const tpl = (APP_DATA.blueprintTemplates || []).find(t => t.id === templateId);
    if (!tpl) return [];
    return tpl.steps.map((s, i) => ({
      idx: i, completed: false, completedAt: null, notes: ''
    }));
  }

  return {
    _version:     2,
    _lastUpdated: null,

    /* ── Dashboard ── */
    dashboard: {
      weeklyTopPriority:    '',
      weeklyPriorityDate:   null,
      todayPriorities:      ['', '', ''],
      todayPrioritiesDate:  null,
      tasks:                [],
      customHabits:         null,
    },

    /* ── Business ──
       hierarchy: ventures[] → blueprints[] → steps[]
       The first venture comes pre-seeded from APP_DATA.
    */
    business: {
      activeVentureId:  APP_DATA.business.ventures[0]?.id || null,
      activeBlueprintId: null,
      ventures: (APP_DATA.business.ventures || []).map(v => ({
        id:            v.id,
        name:          v.name,
        icon:          v.icon || '🚀',
        description:   v.description || '',
        mrr:           0,
        users:         0,
        hormozi_stage: 0,
        notes:         '',
        blueprints: (v.defaultBlueprints || []).map(bpId => ({
          id:         'bp_' + bpId + '_' + v.id,
          templateId: bpId,
          name:       (APP_DATA.blueprintTemplates || []).find(t => t.id === bpId)?.name || bpId,
          steps:      bpSteps(bpId),
        })),
      })),
    },

    /* ── Workout ──
       schedule = ordered day types for one full week cycle.
       Order: Upper → Lower → Rest → Pull → Push → Legs → Rest → repeat.
       A Rest day follows Lower (taxing on posterior chain) and Legs.
       currentDayIndex advances when user logs a workout or rest day.
       cycleCount  = number of full cycles completed in the current phase.
       weekNumber  = absolute week (1–12); auto-increments each cycle.
       Recovery phase = 5 cycles (Weeks 1–5).
       Ramping phase  = 7 cycles (Weeks 6–12).
       After Ramping completes, program resets to Recovery from week 1.
    */
    workout: {
      currentPhase:    'recovery',
      schedule:        ['Upper', 'Lower', 'Rest', 'Pull', 'Push', 'Legs', 'Rest'],
      currentDayIndex: 0,
      cycleCount:      0,
      weekNumber:      1,
      log:             [],
      logbook:            [],
      progressPics:       [],
      routines:           [],
      activeRoutineId:    null,
      favoriteExercises:  [],
      bodyGoals: { currentWeight: '', goalWeight: '', currentBF: '', goalBF: '' },
      /* log entry shape:
         { date, dayName, phase, completedExercises: ['Ex Name',...], notes }
         logbook entry shape:
         { date, dayName, phase, exercises: [{name, sets:[{reps,weight,duration,notes}]}] }
         progressPics entry shape:
         { date, dataUrl, note }
         routine shape:
         { id, name, description, createdAt } */
    },

    /* ── Nutrition ── */
    nutrition: {
      currentPhase: 'bulk',
      selectedMeals: {
        bulk:     [null, null, null, null],
        maintain: [null, null, null, null],
        cut:      [null, null, null, null],
      },
      /* customMeals: user-added meals beyond the 10 in APP_DATA.
         Structure mirrors APP_DATA.nutrition.meals:
           { phase: [ [meal, ...], [meal,...], ... ] }  (4 slots)
         Each slot is an array of additional meal objects. */
      customMeals: {
        bulk:     [[], [], [], []],
        maintain: [[], [], [], []],
        cut:      [[], [], [], []],
      },
      /* Macro calculator inputs (set from Settings page) */
      calcWeight:      175,
      calcHeight:      70,
      calcGoal:        'maintain',
      calcActivity:    14,
      startWeight:     0,
      startBodyFat:    0,
      currentBodyFat:  0,
      goalBodyFat:     0,
      foodLibrary:    [],
      userMeals:      [],
      mealPlan:       {},
      slotOptions:      { 0:[], 1:[], 2:[], 3:[] },
      mealDistribution: [25, 30, 35, 10],
    },

    /* ── Passions ──
       hierarchy: passions[] each with notes, goals[], journal[]
       Music passion is pre-seeded and maps to the rich APP_DATA.creative data.
    */
    passions: {
      activePassionId: 'music',
      passions: [
        {
          id:            'music',
          name:          'Music',
          icon:          '🎸',
          blueprintType: 'music',
          description:   'Guitar · Songwriting · Performance',
          notes:         '',
          goals:         [],
          journal:       [],
        },
      ],
    },
  };
}

/* ──────────────────────────────────────────────────────────────────
   STATE — the global in-memory object
   Exposed as window.STATE so every page module can use it.
────────────────────────────────────────────────────────────────── */
let _db = null;  /* IndexedDB connection, set during init */

window.STATE = {

  /* Raw data — populated by STATE.load() on app boot */
  data: null,

  /* ── Persistence ── */

  /** Persist current data to IndexedDB (fire-and-forget). */
  save() {
    if (!_db || !this.data) return;
    this.data._lastUpdated = new Date().toISOString();
    _idbPut(_db, this.data).catch(err => console.warn('[STATE] IDB write failed:', err));
  },

  /** Load state from IndexedDB, falling back to default. Returns a Promise. */
  async load() {
    try {
      _db = await _openDB();
      const saved = await _idbGet(_db);
      this.data = saved || _defaultState();

      /* ── State migration: safely add fields introduced in newer versions ── */
      if (!this.data.dashboard.weeklyTopPriority) {
        this.data.dashboard.weeklyTopPriority = '';
      }
      if (!Array.isArray(this.data.dashboard.tasks)) this.data.dashboard.tasks = [];
      if (this.data.dashboard.customHabits === undefined) this.data.dashboard.customHabits = null;
      const wk = this.data.workout;
      if (!Array.isArray(wk.logbook))      wk.logbook      = [];
      if (!Array.isArray(wk.progressPics)) wk.progressPics = [];
      if (!Array.isArray(wk.routines))           wk.routines           = [];
      if (!Array.isArray(wk.favoriteExercises)) wk.favoriteExercises  = [];
      if (wk.activeRoutineId === undefined) wk.activeRoutineId = null;
      const nt = this.data.nutrition;
      if (nt.calcWeight      === undefined) nt.calcWeight      = 175;
      if (nt.calcHeight      === undefined) nt.calcHeight      = 70;
      if (nt.calcGoal        === undefined) nt.calcGoal        = 'maintain';
      if (nt.calcActivity    === undefined) nt.calcActivity    = 14;
      if (nt.startWeight     === undefined) nt.startWeight     = 0;
      if (nt.startBodyFat    === undefined) nt.startBodyFat    = 0;
      if (nt.currentBodyFat  === undefined) nt.currentBodyFat  = 0;
      if (nt.goalBodyFat     === undefined) nt.goalBodyFat     = 0;
      if (!Array.isArray(nt.foodLibrary)) nt.foodLibrary = [];
      if (!Array.isArray(nt.userMeals))   nt.userMeals   = [];
      if (typeof nt.mealPlan !== 'object' || Array.isArray(nt.mealPlan)) nt.mealPlan = {};
      if (typeof nt.slotOptions !== 'object' || Array.isArray(nt.slotOptions)) nt.slotOptions = { 0:[], 1:[], 2:[], 3:[] };
      [0,1,2,3].forEach(i => { if (!Array.isArray(nt.slotOptions[i])) nt.slotOptions[i] = []; });
      if (!Array.isArray(nt.mealDistribution) || nt.mealDistribution.length !== 4) nt.mealDistribution = [25, 30, 35, 10];
      if (wk.cycleCount  === undefined)    wk.cycleCount   = 0;
      if (wk.weekNumber  === undefined)    wk.weekNumber   = 1;
      /* Migrate old Pull-first schedule to the new Upper-first schedule */
      if (wk.schedule && wk.schedule[0] === 'Pull') {
        wk.schedule        = ['Upper', 'Lower', 'Rest', 'Pull', 'Push', 'Legs', 'Rest'];
        wk.currentDayIndex = 0;
      }
      /* Migrate: add passions if not present */
      if (!this.data.passions) this.data.passions = _defaultState().passions;
      /* Migrate: stamp blueprintType on existing passions that predate this field */
      (this.data.passions.passions || []).forEach(p => {
        if (!p.blueprintType) p.blueprintType = p.id === 'music' ? 'music' : 'general';
        if (!p.blueprints) p.blueprints = [];
      });
      console.log('[STATE] Loaded from', saved ? 'IndexedDB' : 'defaults');
    } catch (err) {
      console.warn('[STATE] IDB unavailable, using defaults:', err);
      this.data = _defaultState();
    }
  },

  /* ── Export / Import ── */

  /**
   * Download current STATE as a JSON file.
   * The exported file is a full snapshot. To use it as the new
   * master data source, it can be imported on another device via
   * STATE.importFromFile(), or adapted for data.js and committed to GitHub.
   */
  exportJSON() {
    const json = JSON.stringify(this.data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'koltyn-os-state-' + new Date().toISOString().slice(0,10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Restore STATE from a user-selected JSON file.
   * Triggers a file picker, reads the file, validates, then replaces
   * in-memory data and persists to IndexedDB.
   * @returns {Promise<void>}
   */
  importFromFile() {
    return new Promise((resolve, reject) => {
      const input    = document.createElement('input');
      input.type     = 'file';
      input.accept   = '.json,application/json';
      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return reject(new Error('No file selected'));
        try {
          const text   = await file.text();
          const parsed = JSON.parse(text);
          if (!parsed._version) throw new Error('Invalid state file');
          this.data = parsed;
          this.save();
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      input.click();
    });
  },

  /* ── Dashboard mutators ── */

  setWeeklyPriority(text) {
    this.data.dashboard.weeklyTopPriority  = text;
    this.data.dashboard.weeklyPriorityDate = new Date().toISOString();
    this.save();
  },

  setTodayPriorities(p1, p2, p3) {
    this.data.dashboard.todayPriorities     = [p1, p2, p3];
    this.data.dashboard.todayPrioritiesDate = new Date().toISOString();
    this.save();
  },

  addTask(text) {
    if (!Array.isArray(this.data.dashboard.tasks)) this.data.dashboard.tasks = [];
    this.data.dashboard.tasks.push({ id: 't_' + Date.now(), text, done: false, createdAt: new Date().toISOString() });
    this.save();
  },
  toggleTask(id) {
    const t = (this.data.dashboard.tasks || []).find(t => t.id === id);
    if (t) { t.done = !t.done; this.save(); }
  },
  removeTask(id) {
    this.data.dashboard.tasks = (this.data.dashboard.tasks || []).filter(t => t.id !== id);
    this.save();
  },
  setDashboardHabits(habits) {
    this.data.dashboard.customHabits = habits;
    this.save();
  },

  /* ── Passions mutators ── */

  addPassion(name, icon, description, blueprintType) {
    const id = 'pas_' + Date.now();
    this.data.passions.passions.push({
      id, name, icon: icon || '✨', description: description || '',
      blueprintType: blueprintType || 'general',
      notes: '', goals: [], journal: [],
    });
    this.data.passions.activePassionId = id;
    this.save();
    return id;
  },

  updatePassion(passionId, fields) {
    const p = this.data.passions.passions.find(p => p.id === passionId);
    if (p) Object.assign(p, fields);
    this.save();
  },

  addPassionGoal(passionId, label, target, unit) {
    const p = this.data.passions.passions.find(p => p.id === passionId);
    if (!p) return;
    if (!p.goals) p.goals = [];
    const id = 'g_' + Date.now();
    p.goals.push({ id, label, current: 0, target: parseFloat(target) || 0, unit: unit || '' });
    this.save();
    return id;
  },

  updatePassionGoal(passionId, goalId, current) {
    const p = this.data.passions.passions.find(p => p.id === passionId);
    if (!p) return;
    const g = (p.goals || []).find(g => g.id === goalId);
    if (g) { g.current = parseFloat(current) || 0; this.save(); }
  },

  removePassionGoal(passionId, goalId) {
    const p = this.data.passions.passions.find(p => p.id === passionId);
    if (!p) return;
    p.goals = (p.goals || []).filter(g => g.id !== goalId);
    this.save();
  },

  addPassionJournalEntry(passionId, text) {
    const p = this.data.passions.passions.find(p => p.id === passionId);
    if (!p) return;
    if (!p.journal) p.journal = [];
    p.journal.unshift({ id: 'j_' + Date.now(), date: new Date().toISOString(), text });
    this.save();
  },

  removePassionJournalEntry(passionId, entryId) {
    const p = this.data.passions.passions.find(p => p.id === passionId);
    if (!p) return;
    p.journal = (p.journal || []).filter(e => e.id !== entryId);
    this.save();
  },

  /* ── Passion blueprint mutators ── */

  _getPassionById(passionId) {
    return (this.data.passions?.passions || []).find(p => p.id === passionId);
  },

  addPassionBlueprint(passionId, templateId) {
    const p = this._getPassionById(passionId);
    if (!p) return null;
    if (!p.blueprints) p.blueprints = [];
    const tpl = (APP_DATA.passionBlueprintTemplates || []).find(t => t.id === templateId);
    if (!tpl) return null;
    const id = 'pbp_' + Date.now();
    p.blueprints.push({
      id,
      templateId,
      name: tpl.name,
      steps: tpl.steps.map((s, i) => ({ idx: i, completed: false, completedAt: null, notes: '' })),
    });
    this.save();
    return id;
  },

  completePassionStep(passionId, blueprintId, stepIdx, done) {
    const p = this._getPassionById(passionId);
    const bp = (p?.blueprints || []).find(b => b.id === blueprintId);
    if (!bp) return;
    bp.steps[stepIdx].completed   = done;
    bp.steps[stepIdx].completedAt = done ? new Date().toISOString() : null;
    this.save();
  },

  setPassionStepNotes(passionId, blueprintId, stepIdx, notes) {
    const p = this._getPassionById(passionId);
    const bp = (p?.blueprints || []).find(b => b.id === blueprintId);
    if (!bp) return;
    bp.steps[stepIdx].notes = notes;
    this.save();
  },

  /* ── Business mutators ── */

  addVenture(name, icon, description, boardType) {
    const id = 'v_' + Date.now();
    this.data.business.ventures.push({
      id, name, icon: icon || '🚀', description: description || '',
      boardType: boardType || 'saas',
      mrr: 0, users: 0, hormozi_stage: 0, notes: '', blueprints: [],
    });
    this.data.business.activeVentureId = id;
    this.save();
    return id;
  },

  updateVenture(ventureId, fields) {
    const v = this._getVenture(ventureId);
    if (v) Object.assign(v, fields);
    this.save();
  },

  addBlueprint(ventureId, templateId) {
    const v   = this._getVenture(ventureId);
    if (!v) return null;
    const tpl = (APP_DATA.blueprintTemplates || []).find(t => t.id === templateId);
    const id  = 'bp_' + templateId + '_' + Date.now();
    const steps = tpl ? tpl.steps.map((s, i) => ({
      idx: i, completed: false, completedAt: null, notes: ''
    })) : [];
    v.blueprints.push({ id, templateId, name: tpl?.name || templateId, steps });
    this.save();
    return id;
  },

  completeStep(ventureId, blueprintId, stepIdx, done) {
    const bp = this._getBlueprint(ventureId, blueprintId);
    if (!bp) return;
    const step = bp.steps.find(s => s.idx === stepIdx);
    if (!step) return;
    step.completed   = done;
    step.completedAt = done ? new Date().toISOString() : null;
    this.save();
  },

  setStepNotes(ventureId, blueprintId, stepIdx, notes) {
    const bp   = this._getBlueprint(ventureId, blueprintId);
    const step = bp?.steps.find(s => s.idx === stepIdx);
    if (step) { step.notes = notes; this.save(); }
  },

  setHormoziStage(ventureId, stage) {
    const v = this._getVenture(ventureId);
    if (v) { v.hormozi_stage = stage; this.save(); }
  },

  /* ── Workout mutators ── */

  logWorkout(dayName, phase, completedExercises, notes, fromDayIdx, scheduleLen) {
    const s   = this.data.workout;
    const log = s.log;
    log.unshift({
      date: new Date().toISOString(),
      dayName, phase,
      completedExercises: completedExercises || [],
      notes: notes || '',
    });
    /* Keep last 90 summary log entries */
    if (log.length > 90) log.length = 90;
    /* If completing a specific day (ahead or behind schedule), jump to it first */
    if (fromDayIdx !== undefined) s.currentDayIndex = fromDayIdx;
    /* Advance to the next day */
    const modLen = scheduleLen || s.schedule.length;
    s.currentDayIndex = (s.currentDayIndex + 1) % modLen;
    /* When index wraps back to 0, a full cycle is complete.
       This drives weekNumber and cycleCount which gate phase transitions. */
    if (s.currentDayIndex === 0) {
      s.cycleCount = (s.cycleCount || 0) + 1;
      s.weekNumber = (s.weekNumber || 1) + 1;
    }
    this.save();
  },

  setWorkoutPhase(phase) {
    this.data.workout.currentPhase = phase; /* 'recovery' | 'ramping' */
    this.save();
  },

  /**
   * Advance to the next phase once the current phase cycle limit is met.
   * Recovery (5 cycles) → Ramping.
   * Ramping  (7 cycles) → Recovery (12-week program resets).
   * Resets cycleCount and currentDayIndex to 0; persists to IDB.
   */
  advancePhase() {
    const s = this.data.workout;
    if (s.currentPhase === 'recovery') {
      s.currentPhase = 'ramping';
    } else {
      /* After Ramping completes the program resets to Recovery week 1 */
      s.currentPhase = 'recovery';
      s.weekNumber   = 1;
    }
    s.cycleCount      = 0;
    s.currentDayIndex = 0;
    this.save();
  },

  /**
   * Add a detailed logbook entry with per-exercise set data.
   * Kept separate from the summary log[] so the Logbook tab can display
   * richer data (sets × reps × weight) independent of the summary feed.
   * entry: { dayName, phase, exercises:[{name, sets:[{reps,weight,duration,notes}]}] }
   * Persisted to IDB via save().
   */
  addLogbookEntry(entry) {
    const s = this.data.workout;
    if (!Array.isArray(s.logbook)) s.logbook = [];
    s.logbook.unshift({ date: new Date().toISOString(), ...entry });
    if (s.logbook.length > 200) s.logbook.length = 200;
    this.save();
  },

  /* Delete all sets for an exercise on a given date. If it was the only
     exercise in that entry, remove the entire entry. */
  deleteLogbookExercise(date, exName) {
    const s = this.data.workout;
    const idx = (s.logbook || []).findIndex(e => e.date === date);
    if (idx < 0) return;
    const entry = s.logbook[idx];
    entry.exercises = (entry.exercises || []).filter(e => e.name !== exName);
    if (entry.exercises.length === 0) s.logbook.splice(idx, 1);
    this.save();
  },

  /* Update weight/reps for a single set within an exercise session. */
  updateLogbookSet(date, exName, setIdx, data) {
    const entry = (this.data.workout.logbook || []).find(e => e.date === date);
    if (!entry) return;
    const ex = (entry.exercises || []).find(e => e.name === exName);
    if (!ex || !ex.sets[setIdx]) return;
    Object.assign(ex.sets[setIdx], data);
    this.save();
  },

  /* Delete a single set. Cascades to remove exercise / entry if now empty. */
  deleteLogbookSet(date, exName, setIdx) {
    const s = this.data.workout;
    const entryIdx = (s.logbook || []).findIndex(e => e.date === date);
    if (entryIdx < 0) return;
    const entry = s.logbook[entryIdx];
    const ex = (entry.exercises || []).find(e => e.name === exName);
    if (!ex) return;
    ex.sets.splice(setIdx, 1);
    if (ex.sets.length === 0) {
      entry.exercises = entry.exercises.filter(e => e.name !== exName);
      if (entry.exercises.length === 0) s.logbook.splice(entryIdx, 1);
    }
    this.save();
  },

  /* Toggle an exercise name in the favourites list. */
  toggleFavoriteExercise(name) {
    const favs = this.data.workout.favoriteExercises || (this.data.workout.favoriteExercises = []);
    const idx = favs.indexOf(name);
    if (idx >= 0) favs.splice(idx, 1); else favs.push(name);
    this.save();
  },

  /* Append a blank set to an existing exercise session. */
  addLogbookSet(date, exName) {
    const entry = (this.data.workout.logbook || []).find(e => e.date === date);
    if (!entry) return;
    const ex = (entry.exercises || []).find(e => e.name === exName);
    if (!ex) return;
    ex.sets.push({ reps: '', weight: '', duration: null, notes: '' });
    this.save();
  },

  /**
   * Store a progress picture as a base64 data URL.
   * Images are stored inline in STATE so they survive export/import as JSON.
   * Note: large images will make the exported JSON file much larger.
   * Persisted to IDB via save().
   */
  saveBodyGoals(obj) {
    if (!this.data.workout.bodyGoals) this.data.workout.bodyGoals = {};
    Object.assign(this.data.workout.bodyGoals, obj);
    this.save();
  },

  addProgressPic(dataUrl, note) {
    const s = this.data.workout;
    if (!Array.isArray(s.progressPics)) s.progressPics = [];
    s.progressPics.unshift({ date: new Date().toISOString(), dataUrl, note: note || '' });
    this.save();
  },

  removeProgressPic(idx) {
    const arr = this.data.workout.progressPics;
    if (!arr || idx < 0 || idx >= arr.length) return;
    arr.splice(idx, 1);
    this.save();
  },

  reorderProgressPics(fromIdx, toIdx) {
    const arr = this.data.workout.progressPics;
    if (!arr || fromIdx === toIdx) return;
    const [item] = arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, item);
    this.save();
  },

  /* ── Routine mutators ── */

  addRoutine(name, description, id) {
    const rid = id || ('r_' + Date.now());
    const wk = this.data.workout;
    if (!Array.isArray(wk.routines)) wk.routines = [];
    wk.routines.push({
      id: rid, name, description: description || '',
      custom: true,
      repeatable: true,
      gradient: 'linear-gradient(135deg,#7c6af7 0%,#4a3ab8 100%)',
      icon: '📋',
      createdAt: new Date().toISOString(),
      /* stages: [{ id, name, weekCount, dayRoutines:[{ id, name, label, sections:{ warmup,main,stretching } }] }] */
      stages: [],
    });
    if (!wk.activeRoutineId) wk.activeRoutineId = rid;
    this.save();
    return rid;
  },

  saveRoutineData(id, data) {
    const r = (this.data.workout.routines || []).find(r => r.id === id);
    if (!r) return;
    Object.assign(r, data);
    this.save();
  },

  duplicateRoutine(id) {
    const wk = this.data.workout;
    const src = (wk.routines || []).find(r => r.id === id);
    if (!src) return;
    const newId = 'r_' + Date.now();
    wk.routines.push(JSON.parse(JSON.stringify({ ...src, id: newId, name: src.name + ' (Copy)', createdAt: new Date().toISOString() })));
    this.save();
    return newId;
  },

  renameRoutine(id, name, description) {
    const r = (this.data.workout.routines || []).find(r => r.id === id);
    if (!r) return;
    if (name !== undefined) r.name = name;
    if (description !== undefined) r.description = description;
    this.save();
  },

  setActiveRoutine(id) {
    this.data.workout.activeRoutineId = id;
    this.save();
  },

  removeRoutine(id) {
    const wk = this.data.workout;
    wk.routines = (wk.routines || []).filter(r => r.id !== id);
    if (wk.activeRoutineId === id) {
      wk.activeRoutineId = wk.routines[0]?.id || null;
    }
    this.save();
  },

  /* ── Nutrition mutators ── */

  setNutritionPhase(phase) {
    this.data.nutrition.currentPhase = phase;
    this.save();
  },

  setCalcInputs(weight, goal, activity, startWeight, startBodyFat, currentBodyFat, goalBodyFat, height) {
    const nt = this.data.nutrition;
    nt.calcWeight     = weight;
    nt.calcGoal       = goal;
    nt.calcActivity   = activity;
    if (startWeight    !== undefined) nt.startWeight    = startWeight;
    if (startBodyFat   !== undefined) nt.startBodyFat   = startBodyFat;
    if (currentBodyFat !== undefined) nt.currentBodyFat = currentBodyFat;
    if (goalBodyFat    !== undefined) nt.goalBodyFat    = goalBodyFat;
    if (height         !== undefined) nt.calcHeight     = height;
    this.save();
  },

  selectMeal(phase, slotIdx, mealIdx) {
    this.data.nutrition.selectedMeals[phase][slotIdx] = mealIdx;
    this.save();
  },

  addCustomMeal(phase, slotIdx, mealObj) {
    this.data.nutrition.customMeals[phase][slotIdx].push(mealObj);
    this.save();
  },

  removeCustomMeal(phase, slotIdx, customIdx) {
    const arr = this.data.nutrition.customMeals[phase][slotIdx];
    if (arr && arr[customIdx] !== undefined) {
      arr.splice(customIdx, 1);
      this.save();
    }
  },

  /* ── Food Library ── */
  addFoodItem(food) {
    food.id = 'fl_' + Date.now();
    food.createdAt = new Date().toISOString();
    this.data.nutrition.foodLibrary.push(food);
    this.save();
  },
  removeFoodItem(id) {
    const nt = this.data.nutrition;
    nt.foodLibrary = nt.foodLibrary.filter(f => f.id !== id);
    this.save();
  },

  /* ── User Meals ── */
  saveUserMeal(meal) {
    const nt = this.data.nutrition;
    if (meal.id) {
      const idx = nt.userMeals.findIndex(m => m.id === meal.id);
      if (idx !== -1) { nt.userMeals[idx] = meal; }
      else { nt.userMeals.push(meal); }
    } else {
      meal.id = 'um_' + Date.now();
      meal.createdAt = new Date().toISOString();
      nt.userMeals.push(meal);
    }
    this.save();
  },
  removeUserMeal(id) {
    const nt = this.data.nutrition;
    nt.userMeals = nt.userMeals.filter(m => m.id !== id);
    /* clear from any mealPlan slots */
    Object.values(nt.mealPlan).forEach(day => {
      ['breakfast','lunch','dinner','snack'].forEach(slot => {
        if (day[slot] === id) day[slot] = null;
      });
    });
    this.save();
  },

  /* ── Meal Plan ── */
  assignMealToSlot(date, slot, mealId) {
    const nt = this.data.nutrition;
    if (!nt.mealPlan[date]) nt.mealPlan[date] = { breakfast:null, lunch:null, dinner:null, snack:null };
    nt.mealPlan[date][slot] = mealId;
    this.save();
  },
  clearMealSlot(date, slot) {
    const nt = this.data.nutrition;
    if (nt.mealPlan[date]) nt.mealPlan[date][slot] = null;
    this.save();
  },
  addQuickAdd(date, slotKey, item) {
    const nt = this.data.nutrition;
    if (!nt.mealPlan[date]) nt.mealPlan[date] = { breakfast:null, lunch:null, dinner:null, snack:null };
    if (!Array.isArray(nt.mealPlan[date].quickAdds)) nt.mealPlan[date].quickAdds = [];
    nt.mealPlan[date].quickAdds.push({ ...item, slot: slotKey, addedAt: new Date().toISOString() });
    this.save();
  },
  removeQuickAdd(date, idx) {
    const day = this.data.nutrition.mealPlan[date];
    if (day?.quickAdds) { day.quickAdds.splice(idx, 1); this.save(); }
  },
  clearTodayPlan(date) {
    this.data.nutrition.mealPlan[date] = { breakfast: null, lunch: null, dinner: null, snack: null, quickAdds: [] };
    this.save();
  },

  setSlotOptions(slotIdx, mealIds) {
    this.data.nutrition.slotOptions[slotIdx] = mealIds.slice(0, 15);
    this.save();
  },

  setMealDistribution(arr) {
    this.data.nutrition.mealDistribution = arr.slice(0, 4).map(v => Math.max(0, Math.min(100, v)));
    this.save();
  },

  /* ── Private helpers ── */

  _getVenture(id) {
    return this.data.business.ventures.find(v => v.id === id);
  },

  _getBlueprint(ventureId, blueprintId) {
    const v = this._getVenture(ventureId);
    return v?.blueprints.find(b => b.id === blueprintId);
  },

  /** Current workout day name (e.g. 'Pull', 'Rest') */
  get currentWorkoutDay() {
    const s = this.data.workout;
    return s.schedule[s.currentDayIndex % s.schedule.length];
  },

  /** Active venture object */
  get activeVenture() {
    return this._getVenture(this.data.business.activeVentureId);
  },
};
