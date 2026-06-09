/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  ONYXRA — state.js                                              ║
 * ║  Live session state: in-memory + Supabase persistence           ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  HOW STATE WORKS                                                ║
 * ║                                                                  ║
 * ║  1. APP_DATA (data.js) = static template data. Read-only.       ║
 * ║                                                                  ║
 * ║  2. window.STATE = live in-memory object. Single source of      ║
 * ║     truth for ALL runtime data.                                  ║
 * ║                                                                  ║
 * ║  3. Supabase (user_state table) = persistence.                   ║
 * ║     STATE is loaded from Supabase on startup. Every mutation     ║
 * ║     calls STATE.save() which writes to Supabase asynchronously. ║
 * ║                                                                  ║
 * ║  FORMS → STATE → Supabase                                       ║
 * ║    All form submissions call a STATE mutator which updates the  ║
 * ║    in-memory object then calls STATE.save().                    ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

/* ──────────────────────────────────────────────────────────────────
   Persistence mode
   - 'supabase' if an authenticated Supabase user exists
   - 'local'    otherwise — saves to localStorage
────────────────────────────────────────────────────────────────── */
let _supabase = null;
let _userId = null;
let _saveTimer = null;
let _mode = 'local';                    // 'local' | 'supabase'
const _LOCAL_KEY = 'onyxra_state_v1';

function _getSupabase() {
  if (_supabase) return _supabase;
  if (typeof window !== 'undefined' && window.__supabase) {
    _supabase = window.__supabase;
    return _supabase;
  }
  return null;
}

/* Default single-user identity when no auth exists yet. */
const DEFAULT_PROFILE = {
  id: 'local-user',
  display_name: 'Koltyn',
  email: null,
};

/* ──────────────────────────────────────────────────────────────────
   Default state bootstrap
────────────────────────────────────────────────────────────────── */
function _defaultState() {
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

    dashboard: {
      weeklyTopPriority:    '',
      weeklyPriorityDate:   null,
      todayPriorities:      ['', '', ''],
      todayPrioritiesDate:  null,
      tasks:                [],
      customHabits:         null,
    },

    business: {
      activeVentureId:  (APP_DATA.business?.ventures?.[0]?.id) || null,
      activeBlueprintId: null,
      ventures: (APP_DATA.business?.ventures || []).map(v => ({
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
    },

    nutrition: {
      currentPhase: 'maintain',
      selectedMeals: {
        bulk:     [null, null, null, null],
        maintain: [null, null, null, null],
        cut:      [null, null, null, null],
      },
      customMeals: {
        bulk:     [[], [], [], []],
        maintain: [[], [], [], []],
        cut:      [[], [], [], []],
      },
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

    passions: {
      activePassionId: null,
      passions: [],
    },

    /* ── Family ──
       Members of the user's family (or chosen circle).
    */
    family: {
      activeMemberId: null,
      members: [],
    },

    /* ── Friends ──
       Same shape as family — separate so the two stay independent.
    */
    friends: {
      activeMemberId: null,
      members: [],
    },

    /* ── Relationship ──
       Singular: the user's significant other / partner.
       Differs from family/friends in that it's ONE person, with
       extra context: anniversary, gift ideas, important dates.
    */
    relationship: {
      name: '',
      icon: '💕',
      startDate: null,
      notes: '',
      updates:    [],   // { id, date, text }
      dates:      [],   // { id, label, date }    e.g. anniversary, birthday
      giftIdeas:  [],   // { id, text, given:false, addedAt }
    },

    wealth: {},

    /* ── Journal ──
       Daily reflections + mood. One or more entries per day.
       mood is 1..5 (😞 😕 😐 🙂 🤩) or null. */
    journal: {
      entries: [],      // { id, date(ISO), day('YYYY-MM-DD'), mood, text, tags:[] }
    },

    /* ── Habits ──
       Recurring daily habits with a per-day completion log.
       log is a map { 'YYYY-MM-DD': true }. */
    habits: {
      items: [],        // { id, name, icon, color, ring, createdAt, log:{} }
    },

    /* ── Metrics ──
       Lightweight time-series for charting trends. Each series is an
       array of { day:'YYYY-MM-DD', value:Number, at:ISO }. */
    metrics: {
      weight:   [],
      bodyfat:  [],
      networth: [],
      mood:     [],     // mirrors journal mood for quick sparklines
    },

    /* ── Life ──
       Cross-cutting "today" engine: day streak + ring goals. */
    life: {
      streak: 0,
      lastActiveDay: null,    // 'YYYY-MM-DD' of last day with any logged activity
      bestStreak: 0,
      ringGoals: { focus: 3, body: 1, connect: 1 },   // tasks done, body actions, people touches
    },
  };
}

/* Local date key 'YYYY-MM-DD' (NOT UTC — respects the user's timezone so
   "today" matches the calendar on their device). */
function _dayKey(d) {
  d = d || new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/* ──────────────────────────────────────────────────────────────────
   STATE — the global in-memory object
────────────────────────────────────────────────────────────────── */
window.STATE = {

  data: null,
  user: null,

  /* ── Persistence ──
     Dual-mode:
     - If an authenticated Supabase user is found, mode='supabase'.
     - Otherwise mode='local' and state is persisted to localStorage.
     The data shape is identical, so the only thing that changes is the
     storage backend. When real auth is added later, on first login we
     can migrate localStorage data into Supabase.
  */

  /** Persist current data (debounced, fire-and-forget). */
  save() {
    if (!this.data) return;
    this.data._lastUpdated = new Date().toISOString();

    // Re-render dynamic nav (Business/Interests sub-items) on every mutation
    if (typeof window.renderDynamicNav === 'function') {
      // Defer so callers can finish any in-progress UI work first
      Promise.resolve().then(() => window.renderDynamicNav());
    }

    // Debounce writes — wait 500ms after last mutation before saving
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => {
      if (_mode === 'supabase') {
        this._writeToSupabase();
      } else {
        this._writeToLocal();
      }
    }, 500);
  },

  _writeToLocal() {
    try {
      localStorage.setItem(_LOCAL_KEY, JSON.stringify(this.data));
      console.log('[STATE] Saved to localStorage');
    } catch (err) {
      console.warn('[STATE] localStorage write failed:', err);
    }
  },

  async _writeToSupabase() {
    const sb = _getSupabase();
    if (!sb || !_userId) {
      console.warn('[STATE] No Supabase connection — falling back to local save');
      this._writeToLocal();
      return;
    }
    try {
      const { error } = await sb
        .from('user_state')
        .update({
          dashboard: this.data.dashboard,
          workout:   this.data.workout,
          nutrition: this.data.nutrition,
          business:  this.data.business,
          passions:  this.data.passions,
          family:       this.data.family        || { activeMemberId: null, members: [] },
          friends:      this.data.friends       || { activeMemberId: null, members: [] },
          relationship: this.data.relationship  || { name: '', icon: '💕', startDate: null, notes: '', updates: [], dates: [], giftIdeas: [] },
          wealth:       this.data.wealth        || {},
          journal:      this.data.journal       || { entries: [] },
          habits:       this.data.habits        || { items: [] },
          metrics:      this.data.metrics       || { weight: [], bodyfat: [], networth: [], mood: [] },
          life:         this.data.life          || { streak: 0, lastActiveDay: null, bestStreak: 0, ringGoals: { focus: 3, body: 1, connect: 1 } },
        })
        .eq('user_id', _userId);
      if (error) throw error;
      console.log('[STATE] Saved to Supabase');
    } catch (err) {
      console.warn('[STATE] Supabase write failed, saving locally:', err);
      this._writeToLocal();
    }
  },

  /** Load state. Tries Supabase first if a user is authenticated,
   *  otherwise loads from localStorage. Falls back to defaults. */
  async load() {
    // Try Supabase auth first (in case the user is signed in)
    try {
      const sb = _getSupabase();
      if (sb) {
        const { data: { user } } = await sb.auth.getUser();
        if (user) {
          _userId = user.id;
          _mode = 'supabase';
          this.user = user;

          // Profile
          const { data: profile } = await sb
            .from('users')
            .select('*')
            .eq('id', _userId)
            .single();
          this.profile = profile;

          // State row
          const { data: stateRow } = await sb
            .from('user_state')
            .select('*')
            .eq('user_id', _userId)
            .single();

          if (stateRow) {
            this.data = {
              _version: stateRow.version || 2,
              _lastUpdated: stateRow.updated_at,
              dashboard: stateRow.dashboard || _defaultState().dashboard,
              workout:   stateRow.workout   || _defaultState().workout,
              nutrition: stateRow.nutrition || _defaultState().nutrition,
              business:  stateRow.business  || _defaultState().business,
              passions:  stateRow.passions  || _defaultState().passions,
              family:       stateRow.family        || _defaultState().family,
              friends:      stateRow.friends       || _defaultState().friends,
              relationship: stateRow.relationship  || _defaultState().relationship,
              wealth:       stateRow.wealth        || {},
              journal:      stateRow.journal       || _defaultState().journal,
              habits:       stateRow.habits        || _defaultState().habits,
              metrics:      stateRow.metrics       || _defaultState().metrics,
              life:         stateRow.life          || _defaultState().life,
            };
            this._migrate();
            console.log('[STATE] Loaded from Supabase for user:', profile?.display_name || user.email);
            return;
          }
          // Authenticated but no state row — fall through to defaults
          this.data = _defaultState();
          this._migrate();
          console.log('[STATE] Authenticated, no state yet — using defaults');
          return;
        }
      }
    } catch (err) {
      console.warn('[STATE] Supabase load failed, falling back to local:', err.message);
    }

    // Local mode — default identity, load from localStorage
    _mode = 'local';
    this.user = null;
    this.profile = { ...DEFAULT_PROFILE };

    try {
      const raw = localStorage.getItem(_LOCAL_KEY);
      if (raw) {
        this.data = JSON.parse(raw);
        this._migrate();
        console.log('[STATE] Loaded from localStorage');
        return;
      }
    } catch (err) {
      console.warn('[STATE] localStorage read failed:', err);
    }

    this.data = _defaultState();
    this._migrate();
    console.log('[STATE] Using defaults (no saved state)');
  },

  /** Apply forward-compat field defaults. Called after every load. */
  _migrate() {
    if (!this.data) return;
    // Make sure all top-level sections exist
    const d = _defaultState();
    if (!this.data.dashboard) this.data.dashboard = d.dashboard;
    if (!this.data.workout)   this.data.workout   = d.workout;
    if (!this.data.nutrition) this.data.nutrition = d.nutrition;
    if (!this.data.business)  this.data.business  = d.business;
    if (!this.data.passions)  this.data.passions  = d.passions;
    if (!this.data.family)    this.data.family    = d.family;
    if (!this.data.friends)      this.data.friends      = d.friends;
    if (!this.data.relationship) this.data.relationship = d.relationship;
    if (!this.data.wealth)    this.data.wealth    = {};
    if (!this.data.journal)   this.data.journal   = d.journal;
    if (!Array.isArray(this.data.journal.entries)) this.data.journal.entries = [];
    if (!this.data.habits)    this.data.habits    = d.habits;
    if (!Array.isArray(this.data.habits.items)) this.data.habits.items = [];
    if (!this.data.metrics)   this.data.metrics   = d.metrics;
    ['weight','bodyfat','networth','mood'].forEach(k => {
      if (!Array.isArray(this.data.metrics[k])) this.data.metrics[k] = [];
    });
    if (!this.data.life)      this.data.life      = d.life;
    if (typeof this.data.life.streak !== 'number') this.data.life.streak = 0;
    if (typeof this.data.life.bestStreak !== 'number') this.data.life.bestStreak = 0;
    if (this.data.life.lastActiveDay === undefined) this.data.life.lastActiveDay = null;
    if (!this.data.life.ringGoals) this.data.life.ringGoals = { focus: 3, body: 1, connect: 1 };
    // Seed seen-badges once so pre-existing progress doesn't trigger a confetti storm.
    if (this.data.life.seenBadges === undefined) {
      this.data.life.seenBadges = this.computeAchievements().filter(b => b.earned).map(b => b.id);
    }

      /* ── State migration: safely add fields ── */
      const ds = this.data.dashboard;
      if (!ds.weeklyTopPriority) ds.weeklyTopPriority = '';
      if (!Array.isArray(ds.tasks)) ds.tasks = [];
      if (ds.customHabits === undefined) ds.customHabits = null;

      const wk = this.data.workout;
      if (!Array.isArray(wk.logbook))           wk.logbook           = [];
      if (!Array.isArray(wk.progressPics))      wk.progressPics      = [];
      if (!Array.isArray(wk.routines))           wk.routines          = [];
      if (!Array.isArray(wk.favoriteExercises)) wk.favoriteExercises = [];
      if (wk.activeRoutineId === undefined)     wk.activeRoutineId   = null;
      if (wk.cycleCount  === undefined)         wk.cycleCount        = 0;
      if (wk.weekNumber  === undefined)         wk.weekNumber        = 1;
      if (wk.schedule && wk.schedule[0] === 'Pull') {
        wk.schedule        = ['Upper', 'Lower', 'Rest', 'Pull', 'Push', 'Legs', 'Rest'];
        wk.currentDayIndex = 0;
      }

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

      if (!this.data.passions) this.data.passions = _defaultState().passions;
      (this.data.passions.passions || []).forEach(p => {
        if (!p.blueprintType) p.blueprintType = p.id === 'music' ? 'music' : 'general';
        if (!p.blueprints) p.blueprints = [];
      });
  },

  /* ── Export / Import ── */

  exportJSON() {
    const json = JSON.stringify(this.data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'onyxra-state-' + new Date().toISOString().slice(0,10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
  },

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
    if (t) {
      t.done = !t.done;
      t.completedAt = t.done ? new Date().toISOString() : null;
      if (t.done) this._touchStreak();
      this.save();
    }
  },
  removeTask(id) {
    this.data.dashboard.tasks = (this.data.dashboard.tasks || []).filter(t => t.id !== id);
    this.save();
  },
  setDashboardHabits(habits) {
    this.data.dashboard.customHabits = habits;
    this.save();
  },

  /* ──────────────────────────────────────────────────────────────
     STREAK ENGINE + "TODAY" — the heart of the Life Rings.
     Any meaningful logging action calls _touchStreak() so the day
     streak grows. computeToday() rolls up today's progress.
  ────────────────────────────────────────────────────────────── */

  /** Mark today as "active" and roll the day-streak forward. */
  _touchStreak() {
    const life = this.data.life || (this.data.life = { streak: 0, lastActiveDay: null, bestStreak: 0, ringGoals: { focus: 3, body: 1, connect: 1 } });
    const today = _dayKey();
    if (life.lastActiveDay === today) return;          // already counted today
    const y = new Date(); y.setDate(y.getDate() - 1);
    life.streak = (life.lastActiveDay === _dayKey(y)) ? (life.streak || 0) + 1 : 1;
    life.lastActiveDay = today;
    if (life.streak > (life.bestStreak || 0)) life.bestStreak = life.streak;
  },

  /** Roll up today's cross-life progress for the Life Rings. Pure read. */
  computeToday() {
    const today = _dayKey();
    const d = this.data;
    const isToday = (iso) => iso && _dayKey(new Date(iso)) === today;
    const goals = d.life?.ringGoals || { focus: 3, body: 1, connect: 1 };

    /* FOCUS — tasks knocked out today + journaling */
    const tasksDoneToday = (d.dashboard?.tasks || []).filter(t => t.done && isToday(t.completedAt)).length;
    const journaledToday = (d.journal?.entries || []).some(e => e.day === today);
    const focusVal = tasksDoneToday + (journaledToday ? 1 : 0);

    /* BODY — workout / body metric / health habit today */
    const workedOutToday = (d.workout?.log || []).some(l => isToday(l.date))
                        || (d.workout?.logbook || []).some(l => isToday(l.date));
    const bodyMetricToday = ['weight', 'bodyfat'].some(k => (d.metrics?.[k] || []).some(p => p.day === today));
    const bodyHabitTicks = (d.habits?.items || []).filter(h => h.ring === 'body' && h.log?.[today]).length;
    const bodyVal = (workedOutToday ? 1 : 0) + (bodyMetricToday ? 1 : 0) + bodyHabitTicks;

    /* CONNECT — reached out to people today */
    let connectVal = 0;
    if (isToday(d.relationship?.updates?.[0]?.date)) connectVal++;
    (d.family?.members || []).forEach(m => { if (isToday(m.updates?.[0]?.date)) connectVal++; });
    (d.friends?.members || []).forEach(m => { if (isToday(m.updates?.[0]?.date)) connectVal++; });
    connectVal += (d.habits?.items || []).filter(h => h.ring === 'connect' && h.log?.[today]).length;

    const ring = (val, goal) => ({ value: val, goal, frac: Math.min(1, goal > 0 ? val / goal : 0) });
    const focus   = ring(focusVal,   goals.focus   || 3);
    const body    = ring(bodyVal,    goals.body    || 1);
    const connect = ring(connectVal, goals.connect || 1);
    const overall = (focus.frac + body.frac + connect.frac) / 3;

    const moodEntry = (d.journal?.entries || []).find(e => e.day === today && e.mood);
    return {
      day: today,
      focus, body, connect, overall,
      journaledToday,
      moodToday: moodEntry?.mood || null,
      streak: d.life?.streak || 0,
      bestStreak: d.life?.bestStreak || 0,
    };
  },

  /* ── Journal mutators ── */

  addJournalEntry(fields) {
    const j = this.data.journal || (this.data.journal = { entries: [] });
    const now = new Date();
    const entry = {
      id: 'jr_' + Date.now(),
      date: now.toISOString(),
      day: _dayKey(now),
      mood: fields?.mood != null ? Number(fields.mood) : null,
      text: fields?.text || '',
      tags: Array.isArray(fields?.tags) ? fields.tags : [],
    };
    j.entries.unshift(entry);
    if (j.entries.length > 500) j.entries.length = 500;
    if (entry.mood) this._pushMetric('mood', entry.mood, entry.day);
    this._touchStreak();
    this.save();
    return entry.id;
  },

  /** Set today's mood (creates a mood-only entry if none today). */
  setTodayMood(value) {
    value = Number(value);
    const j = this.data.journal || (this.data.journal = { entries: [] });
    const today = _dayKey();
    let entry = j.entries.find(e => e.day === today);
    if (entry) { entry.mood = value; }
    else {
      entry = { id: 'jr_' + Date.now(), date: new Date().toISOString(), day: today, mood: value, text: '', tags: [] };
      j.entries.unshift(entry);
    }
    this._pushMetric('mood', value, today);
    this._touchStreak();
    this.save();
  },

  updateJournalEntry(id, fields) {
    const e = (this.data.journal?.entries || []).find(x => x.id === id);
    if (!e) return;
    if (fields.text !== undefined) e.text = fields.text;
    if (fields.mood !== undefined) {
      e.mood = (fields.mood == null) ? null : Number(fields.mood);
      if (e.mood) this._pushMetric('mood', e.mood, e.day);
    }
    this.save();
  },

  removeJournalEntry(id) {
    const j = this.data.journal;
    if (!j) return;
    j.entries = (j.entries || []).filter(e => e.id !== id);
    this.save();
  },

  /* ── Habit mutators ── */

  addHabit(name, icon, color, ring) {
    const h = this.data.habits || (this.data.habits = { items: [] });
    const id = 'hb_' + Date.now();
    h.items.push({
      id,
      name: name || 'New habit',
      icon: icon || '✅',
      color: color || '#ffb340',
      ring: ring || 'focus',          // which Life Ring this feeds: focus | body | connect
      createdAt: new Date().toISOString(),
      log: {},
    });
    this.save();
    return id;
  },

  renameHabit(id, fields) {
    const it = (this.data.habits?.items || []).find(h => h.id === id);
    if (it) { Object.assign(it, fields); this.save(); }
  },

  removeHabit(id) {
    const h = this.data.habits;
    if (!h) return;
    h.items = (h.items || []).filter(it => it.id !== id);
    this.save();
  },

  /** Toggle (or set) a habit's completion for a given day. */
  tickHabit(id, day, on) {
    const it = (this.data.habits?.items || []).find(h => h.id === id);
    if (!it) return;
    if (!it.log) it.log = {};
    const key = day || _dayKey();
    const next = (on === undefined) ? !it.log[key] : !!on;
    if (next) { it.log[key] = true; this._touchStreak(); }
    else delete it.log[key];
    this.save();
    return next;
  },

  /** Current consecutive-day streak for a single habit. */
  habitStreak(id) {
    const it = (this.data.habits?.items || []).find(h => h.id === id);
    if (!it || !it.log) return 0;
    let streak = 0;
    const d = new Date();
    // Allow today to be unticked without breaking the streak shown.
    if (!it.log[_dayKey(d)]) d.setDate(d.getDate() - 1);
    while (it.log[_dayKey(d)]) { streak++; d.setDate(d.getDate() - 1); }
    return streak;
  },

  /* ──────────────────────────────────────────────────────────────
     ACHIEVEMENTS — milestone badges computed from live data.
     computeAchievements() returns every badge with an `earned` flag +
     progress; checkNewAchievements() returns ids freshly earned since
     last check (used to fire confetti). seenBadges is seeded silently
     on first migrate so existing progress never spam-celebrates.
  ────────────────────────────────────────────────────────────── */
  computeAchievements() {
    const d = this.data;
    const best        = d.life?.bestStreak || 0;
    const jcount      = (d.journal?.entries || []).length;
    const hcount      = (d.habits?.items || []).length;
    const habitStreaks = (d.habits?.items || []).map(h => this.habitStreak(h.id));
    const maxHabit    = habitStreaks.length ? Math.max.apply(null, habitStreaks) : 0;
    const wcount      = (d.workout?.logbook || []).length + (d.workout?.log || []).length;
    const doneTasks   = (d.dashboard?.tasks || []).filter(t => t.done).length;
    const weighIns    = (d.metrics?.weight || []).length;
    const totalAct    = jcount + (d.dashboard?.tasks || []).length + hcount + wcount + weighIns;

    const defs = [
      { id: 'first_step',      icon: '👣', name: 'First Step',       desc: 'Log your very first thing',     cur: totalAct,   target: 1 },
      { id: 'streak_3',        icon: '🔥', name: 'On a Roll',        desc: 'Reach a 3-day streak',          cur: best,       target: 3 },
      { id: 'streak_7',        icon: '🗓️', name: 'Full Week',        desc: 'Reach a 7-day streak',          cur: best,       target: 7 },
      { id: 'streak_30',       icon: '🏆', name: 'Unstoppable',      desc: 'Reach a 30-day streak',         cur: best,       target: 30 },
      { id: 'streak_100',      icon: '💎', name: 'Centurion',        desc: 'Reach a 100-day streak',        cur: best,       target: 100 },
      { id: 'journal_1',       icon: '📓', name: 'Dear Diary',       desc: 'Write your first entry',        cur: jcount,     target: 1 },
      { id: 'journal_10',      icon: '✍️', name: 'Reflective',       desc: 'Write 10 journal entries',      cur: jcount,     target: 10 },
      { id: 'journal_50',      icon: '📚', name: 'Chronicler',       desc: 'Write 50 journal entries',      cur: jcount,     target: 50 },
      { id: 'habit_first',     icon: '🌱', name: 'New Leaf',         desc: 'Create your first habit',       cur: hcount,     target: 1 },
      { id: 'habit_streak_7',  icon: '⚡', name: 'Habit Hero',       desc: 'Keep a habit 7 days straight',  cur: maxHabit,   target: 7 },
      { id: 'habit_streak_30', icon: '🚀', name: 'Habit Master',     desc: 'Keep a habit 30 days straight', cur: maxHabit,   target: 30 },
      { id: 'workout_10',      icon: '💪', name: 'Iron Will',        desc: 'Log 10 workouts',               cur: wcount,     target: 10 },
      { id: 'weigh_in_5',      icon: '⚖️', name: 'Dialed In',        desc: 'Log your weight 5 times',       cur: weighIns,   target: 5 },
      { id: 'task_25',         icon: '✅', name: 'Executor',         desc: 'Complete 25 tasks',             cur: doneTasks,  target: 25 },
    ];
    return defs.map(b => ({ ...b, earned: b.cur >= b.target, pct: Math.min(100, Math.round((b.cur / b.target) * 100)) }));
  },

  /** Returns badge objects newly earned since last check (and records them). */
  checkNewAchievements() {
    const life = this.data.life || (this.data.life = {});
    if (!Array.isArray(life.seenBadges)) life.seenBadges = [];
    const earned = this.computeAchievements().filter(b => b.earned);
    const fresh = earned.filter(b => !life.seenBadges.includes(b.id));
    if (fresh.length) {
      life.seenBadges.push(...fresh.map(b => b.id));
      this.save();
    }
    return fresh;
  },

  /* ── Metric mutators (time-series) ── */

  _pushMetric(key, value, day) {
    const m = this.data.metrics || (this.data.metrics = { weight: [], bodyfat: [], networth: [], mood: [] });
    if (!Array.isArray(m[key])) m[key] = [];
    day = day || _dayKey();
    const v = Number(value);
    if (!isFinite(v)) return;
    const existing = m[key].find(p => p.day === day);
    if (existing) { existing.value = v; existing.at = new Date().toISOString(); }
    else m[key].push({ day, value: v, at: new Date().toISOString() });
    m[key].sort((a, b) => a.day.localeCompare(b.day));
    if (m[key].length > 400) m[key].splice(0, m[key].length - 400);
  },

  logMetric(key, value, day) {
    const allowed = ['weight', 'bodyfat', 'networth', 'mood'];
    if (!allowed.includes(key)) return;
    this._pushMetric(key, value, day);
    // Keep body goals in sync so the Workout page reflects the latest weight/BF.
    if (key === 'weight')  this.saveBodyGoals({ currentWeight: String(value) });
    if (key === 'bodyfat') this.saveBodyGoals({ currentBF: String(value) });
    this._touchStreak();
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
      id, templateId, name: tpl.name,
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

  /* ── Family mutators ── */

  _getFamilyMember(memberId) {
    return (this.data.family?.members || []).find(m => m.id === memberId);
  },

  addFamilyMember(name, role, icon, notes) {
    const id = 'fm_' + Date.now();
    if (!this.data.family) this.data.family = { activeMemberId: null, members: [] };
    this.data.family.members.push({
      id,
      name,
      role: role || '',
      icon: icon || '👤',
      notes: notes || '',
      updates: [],
      goals: [],
      birthday: null,
    });
    this.data.family.activeMemberId = id;
    this.save();
    return id;
  },

  updateFamilyMember(memberId, fields) {
    const m = this._getFamilyMember(memberId);
    if (m) Object.assign(m, fields);
    this.save();
  },

  removeFamilyMember(memberId) {
    if (!this.data.family) return;
    this.data.family.members = this.data.family.members.filter(m => m.id !== memberId);
    if (this.data.family.activeMemberId === memberId) {
      this.data.family.activeMemberId = this.data.family.members[0]?.id || null;
    }
    this.save();
  },

  /** Add an "update" — a dated note about what this family member is up to. */
  addFamilyUpdate(memberId, text) {
    const m = this._getFamilyMember(memberId);
    if (!m) return;
    if (!Array.isArray(m.updates)) m.updates = [];
    m.updates.unshift({
      id: 'fu_' + Date.now(),
      date: new Date().toISOString(),
      text,
    });
    if (m.updates.length > 200) m.updates.length = 200;
    this.save();
  },

  removeFamilyUpdate(memberId, updateId) {
    const m = this._getFamilyMember(memberId);
    if (!m) return;
    m.updates = (m.updates || []).filter(u => u.id !== updateId);
    this.save();
  },

  addFamilyGoal(memberId, label, target, unit) {
    const m = this._getFamilyMember(memberId);
    if (!m) return;
    if (!Array.isArray(m.goals)) m.goals = [];
    const id = 'fg_' + Date.now();
    m.goals.push({
      id,
      label,
      current: 0,
      target: parseFloat(target) || 0,
      unit: unit || '',
    });
    this.save();
    return id;
  },

  updateFamilyGoal(memberId, goalId, current) {
    const m = this._getFamilyMember(memberId);
    if (!m) return;
    const g = (m.goals || []).find(g => g.id === goalId);
    if (g) { g.current = parseFloat(current) || 0; this.save(); }
  },

  removeFamilyGoal(memberId, goalId) {
    const m = this._getFamilyMember(memberId);
    if (!m) return;
    m.goals = (m.goals || []).filter(g => g.id !== goalId);
    this.save();
  },

  /* ── Friends mutators ── */

  _getFriend(memberId) {
    return (this.data.friends?.members || []).find(m => m.id === memberId);
  },

  addFriend(name, role, icon, notes) {
    const id = 'fr_' + Date.now();
    if (!this.data.friends) this.data.friends = { activeMemberId: null, members: [] };
    this.data.friends.members.push({
      id,
      name,
      role: role || '',
      icon: icon || '🧑',
      notes: notes || '',
      updates: [],
      goals: [],
    });
    this.data.friends.activeMemberId = id;
    this.save();
    return id;
  },

  updateFriend(memberId, fields) {
    const m = this._getFriend(memberId);
    if (m) Object.assign(m, fields);
    this.save();
  },

  removeFriend(memberId) {
    if (!this.data.friends) return;
    this.data.friends.members = this.data.friends.members.filter(m => m.id !== memberId);
    if (this.data.friends.activeMemberId === memberId) {
      this.data.friends.activeMemberId = this.data.friends.members[0]?.id || null;
    }
    this.save();
  },

  addFriendUpdate(memberId, text) {
    const m = this._getFriend(memberId);
    if (!m) return;
    if (!Array.isArray(m.updates)) m.updates = [];
    m.updates.unshift({
      id: 'fru_' + Date.now(),
      date: new Date().toISOString(),
      text,
    });
    if (m.updates.length > 200) m.updates.length = 200;
    this.save();
  },

  removeFriendUpdate(memberId, updateId) {
    const m = this._getFriend(memberId);
    if (!m) return;
    m.updates = (m.updates || []).filter(u => u.id !== updateId);
    this.save();
  },

  addFriendGoal(memberId, label, target, unit) {
    const m = this._getFriend(memberId);
    if (!m) return;
    if (!Array.isArray(m.goals)) m.goals = [];
    const id = 'frg_' + Date.now();
    m.goals.push({ id, label, current: 0, target: parseFloat(target) || 0, unit: unit || '' });
    this.save();
    return id;
  },

  updateFriendGoal(memberId, goalId, current) {
    const m = this._getFriend(memberId);
    if (!m) return;
    const g = (m.goals || []).find(g => g.id === goalId);
    if (g) { g.current = parseFloat(current) || 0; this.save(); }
  },

  removeFriendGoal(memberId, goalId) {
    const m = this._getFriend(memberId);
    if (!m) return;
    m.goals = (m.goals || []).filter(g => g.id !== goalId);
    this.save();
  },

  /* ── Relationship mutators ──
     Singular partner. All mutators operate on STATE.data.relationship.
  */

  _ensureRel() {
    if (!this.data.relationship) {
      this.data.relationship = {
        name: '', icon: '💕', startDate: null, notes: '',
        updates: [], dates: [], giftIdeas: [],
      };
    }
    return this.data.relationship;
  },

  setRelationshipProfile(fields) {
    const r = this._ensureRel();
    Object.assign(r, fields);
    this.save();
  },

  addRelationshipUpdate(text) {
    const r = this._ensureRel();
    if (!Array.isArray(r.updates)) r.updates = [];
    r.updates.unshift({
      id: 'ru_' + Date.now(),
      date: new Date().toISOString(),
      text,
    });
    if (r.updates.length > 200) r.updates.length = 200;
    this.save();
  },

  removeRelationshipUpdate(updateId) {
    const r = this._ensureRel();
    r.updates = (r.updates || []).filter(u => u.id !== updateId);
    this.save();
  },

  addRelationshipDate(label, date) {
    const r = this._ensureRel();
    if (!Array.isArray(r.dates)) r.dates = [];
    r.dates.push({
      id: 'rd_' + Date.now(),
      label,
      date,
    });
    // Keep sorted by date (MM-DD ignoring year, so anniversaries cycle yearly)
    r.dates.sort((a, b) => {
      const aMd = (a.date || '').slice(5);
      const bMd = (b.date || '').slice(5);
      return aMd.localeCompare(bMd);
    });
    this.save();
  },

  removeRelationshipDate(dateId) {
    const r = this._ensureRel();
    r.dates = (r.dates || []).filter(d => d.id !== dateId);
    this.save();
  },

  addGiftIdea(text) {
    const r = this._ensureRel();
    if (!Array.isArray(r.giftIdeas)) r.giftIdeas = [];
    r.giftIdeas.unshift({
      id: 'rg_' + Date.now(),
      text,
      given: false,
      addedAt: new Date().toISOString(),
    });
    this.save();
  },

  toggleGiftIdea(ideaId) {
    const r = this._ensureRel();
    const g = (r.giftIdeas || []).find(g => g.id === ideaId);
    if (g) { g.given = !g.given; this.save(); }
  },

  removeGiftIdea(ideaId) {
    const r = this._ensureRel();
    r.giftIdeas = (r.giftIdeas || []).filter(g => g.id !== ideaId);
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
    if (log.length > 90) log.length = 90;
    if (fromDayIdx !== undefined) s.currentDayIndex = fromDayIdx;
    const modLen = scheduleLen || s.schedule.length;
    s.currentDayIndex = (s.currentDayIndex + 1) % modLen;
    if (s.currentDayIndex === 0) {
      s.cycleCount = (s.cycleCount || 0) + 1;
      s.weekNumber = (s.weekNumber || 1) + 1;
    }
    this.save();
  },

  setWorkoutPhase(phase) {
    this.data.workout.currentPhase = phase;
    this.save();
  },

  advancePhase() {
    const s = this.data.workout;
    if (s.currentPhase === 'recovery') {
      s.currentPhase = 'ramping';
    } else {
      s.currentPhase = 'recovery';
      s.weekNumber   = 1;
    }
    s.cycleCount      = 0;
    s.currentDayIndex = 0;
    this.save();
  },

  addLogbookEntry(entry) {
    const s = this.data.workout;
    if (!Array.isArray(s.logbook)) s.logbook = [];
    s.logbook.unshift({ date: new Date().toISOString(), ...entry });
    if (s.logbook.length > 200) s.logbook.length = 200;
    this.save();
  },

  deleteLogbookExercise(date, exName) {
    const s = this.data.workout;
    const idx = (s.logbook || []).findIndex(e => e.date === date);
    if (idx < 0) return;
    const entry = s.logbook[idx];
    entry.exercises = (entry.exercises || []).filter(e => e.name !== exName);
    if (entry.exercises.length === 0) s.logbook.splice(idx, 1);
    this.save();
  },

  updateLogbookSet(date, exName, setIdx, data) {
    const entry = (this.data.workout.logbook || []).find(e => e.date === date);
    if (!entry) return;
    const ex = (entry.exercises || []).find(e => e.name === exName);
    if (!ex || !ex.sets[setIdx]) return;
    Object.assign(ex.sets[setIdx], data);
    this.save();
  },

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

  toggleFavoriteExercise(name) {
    const favs = this.data.workout.favoriteExercises || (this.data.workout.favoriteExercises = []);
    const idx = favs.indexOf(name);
    if (idx >= 0) favs.splice(idx, 1); else favs.push(name);
    this.save();
  },

  addLogbookSet(date, exName) {
    const entry = (this.data.workout.logbook || []).find(e => e.date === date);
    if (!entry) return;
    const ex = (entry.exercises || []).find(e => e.name === exName);
    if (!ex) return;
    ex.sets.push({ reps: '', weight: '', duration: null, notes: '' });
    this.save();
  },

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
    const routine = {
      id: rid, name, description: description || '',
      custom: true, repeatable: true,
      gradient: 'linear-gradient(135deg,#e07b15 0%,#a8550c 100%)',
      icon: '📋',
      createdAt: new Date().toISOString(),
      stages: [],
    };
    wk.routines.push(routine);
    if (!wk.activeRoutineId) wk.activeRoutineId = rid;
    this.save();
    this._cloudUpsertRoutine(routine);
    return rid;
  },

  saveRoutineData(id, data) {
    const r = (this.data.workout.routines || []).find(r => r.id === id);
    if (!r) return;
    Object.assign(r, data);
    this.save();
    this._cloudUpsertRoutine(r);
  },

  duplicateRoutine(id) {
    const wk = this.data.workout;
    const src = (wk.routines || []).find(r => r.id === id);
    if (!src) return;
    const newId = 'r_' + Date.now();
    const copy = JSON.parse(JSON.stringify({ ...src, id: newId, name: src.name + ' (Copy)', createdAt: new Date().toISOString() }));
    delete copy._cloudId;   // a copy is a brand-new cloud row
    wk.routines.push(copy);
    this.save();
    this._cloudUpsertRoutine(copy);
    return newId;
  },

  renameRoutine(id, name, description) {
    const r = (this.data.workout.routines || []).find(r => r.id === id);
    if (!r) return;
    if (name !== undefined) r.name = name;
    if (description !== undefined) r.description = description;
    this.save();
    this._cloudUpsertRoutine(r);
  },

  setActiveRoutine(id) {
    this.data.workout.activeRoutineId = id;
    this.save();
  },

  removeRoutine(id) {
    const wk = this.data.workout;
    const removed = (wk.routines || []).find(r => r.id === id);
    wk.routines = (wk.routines || []).filter(r => r.id !== id);
    if (wk.activeRoutineId === id) {
      wk.activeRoutineId = wk.routines[0]?.id || null;
    }
    this.save();
    if (removed && removed._cloudId && typeof window !== 'undefined' && window.OnyxDB) {
      try { window.OnyxDB.remove('routines', removed._cloudId).catch(() => {}); } catch (e) { /* fail-soft */ }
    }
  },

  /* ── Cloud routine sync (Supabase via OnyxDB server routes — fail-soft) ──
     Custom routines live in the workout_routines table (owner_id = you). The
     full routine object is stored in the row's `program` JSONB so reconstruction
     is lossless; name/schedule/etc. are mirrored into columns for listing.
     Every call no-ops gracefully when signed out / offline. */
  _routineToRow(r) {
    return {
      name: r.name || 'Routine',
      description: r.description || '',
      icon: r.icon || '📋',
      gradient: r.gradient || '',
      schedule: Array.isArray(r.schedule) ? r.schedule : [],
      stages: Array.isArray(r.stages) ? r.stages : [],
      program: r,
      sort_order: 0,
    };
  },
  _cloudUpsertRoutine(routine) {
    if (!routine || !routine.custom || typeof window === 'undefined' || !window.OnyxDB) return;
    try {
      const row = this._routineToRow(routine);
      if (routine._cloudId) {
        window.OnyxDB.update('routines', routine._cloudId, row).catch(() => {});
      } else {
        window.OnyxDB.create('routines', row).then((created) => {
          if (created && created.id) { routine._cloudId = created.id; this.save(); }
        }).catch(() => {});
      }
    } catch (e) { /* fail-soft */ }
  },
  async syncRoutinesFromCloud() {
    if (typeof window === 'undefined' || !window.OnyxDB) return false;
    let enabled = false;
    try { enabled = await window.OnyxDB.cloudEnabled(); } catch (e) { return false; }
    if (!enabled) return false;
    let rows;
    try { rows = await window.OnyxDB.list('routines'); } catch (e) { return false; }
    if (!Array.isArray(rows)) return false;
    const wk = this.data.workout;
    if (!Array.isArray(wk.routines)) wk.routines = [];
    let changed = false;
    const byId = {};
    wk.routines.forEach((r) => { byId[r.id] = r; });
    // Pull cloud custom routines (owner rows carry a program payload, no builtin_key).
    rows.filter((row) => !row.builtin_key && row.program).forEach((row) => {
      const obj = row.program || {};
      const lid = obj.id || ('r_' + row.id);
      if (!byId[lid] || !byId[lid]._cloudId) changed = true;
      byId[lid] = Object.assign({}, obj, { id: lid, custom: true, _cloudId: row.id });
    });
    wk.routines = Object.values(byId);
    // Backfill: push any local-only custom routines up to the cloud once.
    for (const r of wk.routines) {
      if (r.custom && !r._cloudId) {
        try {
          const created = await window.OnyxDB.create('routines', this._routineToRow(r));
          if (created && created.id) { r._cloudId = created.id; changed = true; }
        } catch (e) { /* ignore one */ }
      }
    }
    if (changed) this.save();
    return changed;
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
    Object.values(nt.mealPlan).forEach(day => {
      ['breakfast','lunch','dinner','snack'].forEach(slot => {
        if (day[slot] === id) day[slot] = null;
      });
    });
    this.save();
  },

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

  get currentWorkoutDay() {
    const s = this.data.workout;
    return s.schedule[s.currentDayIndex % s.schedule.length];
  },

  get activeVenture() {
    return this._getVenture(this.data.business.activeVentureId);
  },

  /* ── Auth helpers ── */

  async signOut() {
    const sb = _getSupabase();
    if (sb) await sb.auth.signOut();
    window.location.href = '/login';
  },
};
