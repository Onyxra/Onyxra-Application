/**
 * ONYXRA — dashboard.js
 *
 * The dashboard IS the AI. A living, JARVIS-style talking orb sits at the
 * centre — pointer/touch reactive, with idle / thinking / speaking moods.
 * Below it: quick suggestion prompts, sector shortcuts, the conversation
 * thread, and the chat bar.
 *
 * Chat is wired to /api/chat → Vercel AI Gateway. Every call ships a STATE
 * snapshot so the AI always knows what's going on across the whole life OS.
 */

window.registerPage('dashboard', function initDashboard() {

  const inner = document.getElementById('dashboard-inner');
  if (!inner) return;

  const ds  = STATE.data.dashboard;
  const ws  = STATE.data.workout;
  const ns  = STATE.data.nutrition;
  const bs  = STATE.data.business;
  const ps  = STATE.data.passions;
  const fs  = STATE.data.family       || { activeMemberId: null, members: [] };
  const frs = STATE.data.friends      || { activeMemberId: null, members: [] };
  const rls = STATE.data.relationship || { name: '', icon: '💕', updates: [], dates: [], giftIdeas: [] };

  const todayStr = new Date().toISOString().slice(0, 10);

  let orb = null;        // active orb instance
  let messages = [];     // {role, content}
  let speakTimer = null; // resets status line after a reply
  let voiceOn = (typeof localStorage !== 'undefined' && localStorage.getItem('onyxra_voice') === 'off') ? false : true;
  let recog = null;      // SpeechRecognition instance (voice input)
  let listening = false; // mic actively listening
  let mealSlot = 0;      // which meal slot the meal card is showing (swipeable)

  /* ─────────────────────────────────────────────────────────────
     SNAPSHOT — sent to AI as context
  ───────────────────────────────────────────────────────────── */
  function buildSnapshot() {
    const now = new Date();
    const todayWorkoutDay = STATE.currentWorkoutDay;
    const todayPlan = ns.mealPlan?.[todayStr] || {};

    return {
      time: now.toLocaleString(),
      todayDate: todayStr,
      profile: {
        name: STATE.profile?.display_name || STATE.user?.email?.split('@')[0] || 'user',
        email: STATE.user?.email,
      },
      dashboard: {
        weeklyTopPriority: ds.weeklyTopPriority,
        todayPriorities:   ds.todayPriorities,
        tasks: (ds.tasks || []).map(t => ({ text: t.text, done: t.done })),
      },
      workout: {
        todayDay: todayWorkoutDay,
        currentPhase: ws.currentPhase,
        weekNumber: ws.weekNumber,
        scheduleIndex: ws.currentDayIndex,
        recentLogCount: (ws.log || []).length,
      },
      nutrition: {
        currentPhase: ns.currentPhase,
        todayMealPlan: todayPlan,
        macroTargets: window.computeMacros?.(ns.calcWeight, ns.calcGoal, ns.calcActivity),
      },
      business: {
        ventureCount: (bs.ventures || []).length,
        activeVenture: bs.ventures?.find(v => v.id === bs.activeVentureId)?.name || null,
      },
      interests: {
        interestCount: (ps.passions || []).length,
        activeInterest: ps.passions?.find(p => p.id === ps.activePassionId)?.name || null,
      },
      family: {
        memberCount: (fs.members || []).length,
        members: (fs.members || []).map(m => ({
          name: m.name,
          role: m.role,
          latestUpdate: m.updates?.[0]?.text || null,
          latestUpdateDate: m.updates?.[0]?.date || null,
          goalCount: (m.goals || []).length,
        })),
      },
      friends: {
        memberCount: (frs.members || []).length,
        members: (frs.members || []).map(m => ({
          name: m.name,
          role: m.role,
          latestUpdate: m.updates?.[0]?.text || null,
          latestUpdateDate: m.updates?.[0]?.date || null,
        })),
      },
      relationship: {
        name: rls.name || null,
        startDate: rls.startDate || null,
        latestUpdate: rls.updates?.[0]?.text || null,
        latestUpdateDate: rls.updates?.[0]?.date || null,
        upcomingDates: (rls.dates || []).slice(0, 3),
        openGiftIdeas: (rls.giftIdeas || []).filter(g => !g.given).length,
      },
    };
  }

  /* ─────────────────────────────────────────────────────────────
     THE ORB — vanilla canvas, JARVIS-style talking AI
     Returns { setMood, speak, destroy }
  ───────────────────────────────────────────────────────────── */
  function createDashOrb(canvas, interEl) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return { setMood() {}, speak() {}, kick() {}, destroy() {} };
    const hit = interEl || canvas;             // element that receives pointer events
    const pageEl = document.getElementById('page-dashboard');

    const reduce = window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // palette — molten amber (arc-reactor gold → burnt amber → hot-rod red)
    const CY = [255, 184, 60];   // gold
    const PU = [224, 123, 21];   // amber
    const PK = [255, 84, 50];    // red
    const mix = (a, b, m) => [
      Math.round(a[0] + (b[0] - a[0]) * m),
      Math.round(a[1] + (b[1] - a[1]) * m),
      Math.round(a[2] + (b[2] - a[2]) * m),
    ];

    // geometry
    let W = 1, H = 1, CXp = 0.5, CYp = 0.5, R = 60, dpr = 1;
    let raf = null, t = 0;

    // mood / energy
    let mood = 'idle';            // idle | thinking | speaking
    let energy = 0.16;            // smoothed 0..1
    let speakUntil = 0;

    // pointer (normalised -1..1 around centre)
    const ptr = { x: 0, y: 0, tx: 0, ty: 0, act: 0, tAct: 0 };
    const ripples = [];

    // blob shape
    const N = 86;
    const harm = [
      { k: 2, a: 0.060, s: 0.7 },
      { k: 3, a: 0.045, s: -0.9 },
      { k: 5, a: 0.030, s: 1.3 },
      { k: 7, a: 0.018, s: -1.8 },
    ];
    // voice waveform
    const BARS = 76;
    const seed = Array.from({ length: BARS }, () => Math.random() * 6.283);

    // Sparse, slow-drifting embers — a faint living field
    const embers = Array.from({ length: 22 }, () => ({
      x: Math.random(), y: Math.random(),
      s: 0.5 + Math.random() * 1.5,
      sp: 0.0002 + Math.random() * 0.0005,
      dx: (Math.random() - 0.5) * 0.0003,
      ph: Math.random() * 6.283,
    }));

    // Orbiting data-nodes — a calm constellation around the core
    const nodes = Array.from({ length: 8 }, (_, i) => ({
      rr: 1.26 + (i % 3) * 0.24,
      sp: (0.05 + (i % 4) * 0.025) * (i % 2 ? -1 : 1),
      ph: (i / 8) * 6.283 + Math.random(),
      sz: 1.3 + Math.random() * 1.4,
    }));

    function resize() {
      // The orb is a full-bleed fixed background, so it always tracks the
      // viewport. We set its CSS box explicitly (inline px) so no stylesheet /
      // containing-block quirk can collapse it, and size the backing store too.
      const w = Math.max(1, window.innerWidth);
      const h = Math.max(1, window.innerHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      W = w; H = h;
      CXp = w / 2; CYp = h * 0.46;
      R = Math.min(w, h) * 0.30;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function radiusAt(theta, pAng, bulge) {
      let r = 1;
      for (const hc of harm) r += hc.a * Math.sin(hc.k * theta + t * hc.s);
      let d = Math.abs(((theta - pAng + Math.PI) % (2 * Math.PI)) - Math.PI);
      r += bulge * Math.exp(-(d * d) / (2 * 0.55 * 0.55));
      r *= 1 + energy * 0.07;
      return R * r;
    }

    function draw(now) {
      // Skip work entirely when the dashboard isn't the active page. (A fixed
      // canvas has no offsetParent, so we check the page's active state instead.)
      if (pageEl && !pageEl.classList.contains('active')) { raf = requestAnimationFrame(draw); return; }

      t = now * 0.001;

      // smooth pointer
      ptr.x += (ptr.tx - ptr.x) * 0.10;
      ptr.y += (ptr.ty - ptr.y) * 0.10;
      ptr.act += (ptr.tAct - ptr.act) * 0.08;

      // mood → target energy
      if (mood === 'speaking' && now > speakUntil) mood = 'idle';
      let base;
      if (mood === 'idle')           base = 0.12 + Math.sin(t * 0.6) * 0.02;
      else if (mood === 'thinking')  base = 0.28 + Math.sin(t * 2.4) * 0.09;
      else if (mood === 'listening') base = 0.22 + Math.sin(t * 3.0) * 0.07;
      else                           base = 0.46 + (Math.sin(t * 5.0) * 0.5 + 0.5) * 0.20 * (0.6 + 0.4 * Math.sin(t * 10));
      if (reduce) base *= 0.5;
      energy += (base - energy) * 0.07;

      // lean toward pointer
      const lean = R * 0.16 * ptr.act;
      const cx = CXp + ptr.x * lean;
      const cy = CYp + ptr.y * lean;
      const pAng = Math.atan2(ptr.y, ptr.x);
      const pMag = Math.min(1, Math.hypot(ptr.x, ptr.y));
      const bulge = 0.17 * ptr.act * pMag;

      ctx.clearRect(0, 0, W, H);

      /* 0 — faint ambient field: a soft, voice-like glow. Kept low so the
         cards/panels read cleanly on top of it. */
      ctx.globalCompositeOperation = 'lighter';
      const fieldR = Math.hypot(W, H) * 0.7;
      const field = ctx.createRadialGradient(cx, cy * 0.94, R * 0.4, cx, cy, fieldR);
      field.addColorStop(0,    `rgba(255,150,40,${0.045 + energy * 0.035})`);
      field.addColorStop(0.42, `rgba(190,95,22,${0.022 + energy * 0.02})`);
      field.addColorStop(1,    'rgba(60,30,8,0)');
      ctx.fillStyle = field;
      ctx.fillRect(0, 0, W, H);

      /* 0b — sparse drifting embers */
      for (const e of embers) {
        e.y -= e.sp; e.x += e.dx;
        if (e.y < -0.03) { e.y = 1.03; e.x = Math.random(); }
        if (e.x < -0.03) e.x = 1.03; else if (e.x > 1.03) e.x = -0.03;
        const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 1.2 + e.ph));
        ctx.beginPath();
        ctx.arc(e.x * W, e.y * H, e.s, 0, 6.2832);
        ctx.fillStyle = `rgba(255,${160 + Math.round(50 * tw)},95,${(0.04 + 0.09 * tw) * (0.5 + 0.5 * energy)})`;
        ctx.fill();
      }

      /* 1 — soft aura */
      const auraR = R * (2.2 + energy * 0.5);
      const aura = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, auraR);
      aura.addColorStop(0,   `rgba(255,176,46,${0.07 + energy * 0.05})`);
      aura.addColorStop(0.5, `rgba(224,123,21,${0.035 + energy * 0.025})`);
      aura.addColorStop(1,   'rgba(224,123,21,0)');
      ctx.fillStyle = aura;
      ctx.beginPath(); ctx.arc(cx, cy, auraR, 0, 6.2832); ctx.fill();

      /* 2 — geometric HUD: slow tick ring, thin guide rings, drifting arcs */
      ctx.lineCap = 'round';
      const sweep = t * 0.26;
      const squash = 1 - Math.abs(ptr.y) * 0.10 * ptr.act;

      const tickR = R * 1.6;
      for (let i = 0; i < 72; i++) {
        const a = (i / 72) * 6.2832 + t * 0.02;
        const long = (i % 6 === 0);
        const ca = Math.cos(a), sa = Math.sin(a) * squash;
        const r1 = tickR + (long ? 9 : 4);
        ctx.beginPath();
        ctx.moveTo(cx + ca * tickR, cy + sa * tickR);
        ctx.lineTo(cx + ca * r1, cy + sa * r1);
        ctx.strokeStyle = `rgba(255,196,90,${(long ? 0.16 : 0.07) + energy * 0.12})`;
        ctx.lineWidth = long ? 1.4 : 0.9;
        ctx.stroke();
      }

      for (const rf of [1.30, 1.84, 2.12]) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, R * rf, R * rf * squash, 0, 0, 6.2832);
        ctx.strokeStyle = `rgba(255,196,90,${0.04 + energy * 0.04})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      for (let i = 0; i < 4; i++) {
        const rr = R * (1.38 + i * 0.2);
        const rot = sweep * (0.5 + i * 0.3) * (i % 2 ? -1 : 1);
        const segs = 3 + i;
        const c = i === 1 ? PK : (i === 3 ? PU : CY);
        for (let s = 0; s < segs; s++) {
          const a0 = rot + (s / segs) * 6.2832;
          ctx.beginPath();
          ctx.arc(cx, cy, rr, a0, a0 + (0.16 + 0.08 * Math.sin(t * 0.6 + s + i)));
          ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.12 + energy * 0.22})`;
          ctx.lineWidth = i === 0 ? 1.8 : 1.2;
          ctx.stroke();
        }
      }

      /* 2b — orbiting nodes + faint links */
      const npos = nodes.map(n => {
        const a = n.ph + t * n.sp;
        const rr = R * n.rr;
        return { x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr * squash, sz: n.sz };
      });
      for (let i = 0; i < npos.length; i++) {
        for (let j = i + 1; j < npos.length; j++) {
          const d = Math.hypot(npos[i].x - npos[j].x, npos[i].y - npos[j].y);
          if (d < R * 1.05) {
            ctx.beginPath();
            ctx.moveTo(npos[i].x, npos[i].y);
            ctx.lineTo(npos[j].x, npos[j].y);
            ctx.strokeStyle = `rgba(255,196,90,${0.07 * (1 - d / (R * 1.05)) * (0.5 + energy)})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }
      for (const p of npos) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.sz, 0, 6.2832);
        ctx.fillStyle = `rgba(255,210,120,${0.30 + energy * 0.30})`;
        ctx.fill();
      }

      /* 3 — circular voice waveform: a clean ring of bars that reacts as it speaks */
      const waveR = R * (0.92 + energy * 0.05);
      for (let j = 0; j < BARS; j++) {
        const a = (j / BARS) * 6.2832;
        const n = Math.sin(t * 3 + seed[j] + a * 3) * 0.5 + 0.5;
        const len = 3 + energy * 34 * (0.3 + 0.7 * n);
        const ca = Math.cos(a), sa = Math.sin(a);
        const col = mix(CY, PU, 0.5 + 0.5 * Math.sin(a * 2 + t * 0.4));
        ctx.beginPath();
        ctx.moveTo(cx + ca * waveR, cy + sa * waveR);
        ctx.lineTo(cx + ca * (waveR + len), cy + sa * (waveR + len));
        ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${0.12 + energy * 0.30})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      /* 4 — geometric wireframe gem: two slow counter-rotating hexagons + facet
         lattice. Mostly line-art and transparent, so panels float cleanly over. */
      const SIDES = 6;
      const Rv = R * (0.9 + energy * 0.05);
      const Ri = R * (0.5 + energy * 0.04);
      const outRot = t * 0.07;
      const inRot = -t * 0.10 + 0.4;
      const outer = [], inner = [];
      for (let i = 0; i < SIDES; i++) {
        const ao = outRot + (i / SIDES) * 6.2832;
        const ai = inRot + (i / SIDES) * 6.2832;
        outer.push({ x: cx + Math.cos(ao) * Rv, y: cy + Math.sin(ao) * Rv });
        inner.push({ x: cx + Math.cos(ai) * Ri, y: cy + Math.sin(ai) * Ri });
      }
      // faint inner glow fill
      ctx.beginPath();
      outer.forEach((v, i) => i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y));
      ctx.closePath();
      const gem = ctx.createRadialGradient(cx, cy, 0, cx, cy, Rv);
      gem.addColorStop(0, `rgba(255,210,130,${0.06 + energy * 0.05})`);
      gem.addColorStop(1, 'rgba(255,150,40,0)');
      ctx.fillStyle = gem;
      ctx.fill();
      // outer + inner outlines
      ctx.strokeStyle = `rgba(255,214,150,${0.26 + energy * 0.28})`;
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.beginPath();
      inner.forEach((v, i) => i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y));
      ctx.closePath();
      ctx.strokeStyle = `rgba(255,196,90,${0.16 + energy * 0.20})`;
      ctx.lineWidth = 0.9;
      ctx.stroke();
      // facet lattice (connect outer ↔ inner)
      for (let i = 0; i < SIDES; i++) {
        ctx.beginPath();
        ctx.moveTo(outer[i].x, outer[i].y);
        ctx.lineTo(inner[i].x, inner[i].y);
        ctx.lineTo(inner[(i + 1) % SIDES].x, inner[(i + 1) % SIDES].y);
        ctx.strokeStyle = `rgba(255,196,90,${0.08 + energy * 0.10})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }

      /* 5 — dim reactor core */
      const coreR = R * (0.26 + energy * 0.12 + Math.sin(t * 1.0) * 0.015);
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      core.addColorStop(0,   'rgba(255,248,235,0.7)');
      core.addColorStop(0.4, 'rgba(255,200,110,0.3)');
      core.addColorStop(1,   'rgba(255,150,40,0)');
      ctx.fillStyle = core;
      ctx.beginPath(); ctx.arc(cx, cy, coreR, 0, 6.2832); ctx.fill();
      ctx.fillStyle = `rgba(255,255,250,${0.32 + energy * 0.28})`;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.05, 0, 6.2832); ctx.fill();

      /* 6 — tap ripples */
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += rp.v;
        rp.life -= 1;
        const al = Math.max(0, rp.life / rp.max) * 0.5;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, 6.2832);
        ctx.strokeStyle = `rgba(255,222,165,${al})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        if (rp.life <= 0) ripples.splice(i, 1);
      }

      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(draw);
    }

    /* pointer reactivity */
    function setPtr(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const nx = ((clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((clientY - rect.top) / rect.height - 0.5) * 2;
      ptr.tx = Math.max(-1, Math.min(1, nx));
      ptr.ty = Math.max(-1, Math.min(1, ny));
    }
    function onMove(e) { setPtr(e.clientX, e.clientY); ptr.tAct = 1; }
    function onLeave()  { ptr.tAct = 0; }
    function onDown(e) {
      setPtr(e.clientX, e.clientY);
      ptr.tAct = 1;
      // Lean toward the touch, but don't ripple when interacting with a control.
      if (e.target && e.target.closest && e.target.closest('button, a, input, textarea, select, .ai-card, .onyx-card, .ai-chat-form, .ai-thread')) return;
      const rect = canvas.getBoundingClientRect();
      ripples.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        r: R * 0.45, v: 3.4, life: 48, max: 48,
      });
    }
    function onUp(e) { if (e.pointerType !== 'mouse') ptr.tAct = 0; }

    hit.addEventListener('pointermove', onMove);
    hit.addEventListener('pointerdown', onDown);
    hit.addEventListener('pointerleave', onLeave);
    hit.addEventListener('pointerup', onUp);
    hit.addEventListener('pointercancel', onUp);

    const ro = ('ResizeObserver' in window) ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(canvas);
    window.addEventListener('resize', resize);   // always — the orb tracks the viewport

    resize();
    raf = requestAnimationFrame(draw);

    return {
      setMood(m) { mood = m; },
      speak(ms) { mood = 'speaking'; speakUntil = performance.now() + (ms || 2500); },
      // transient energy spike — call per spoken word so the blob pulses in sync with the voice
      kick(a) { energy = Math.min(1.5, energy + (a || 0.35)); },
      destroy() {
        if (raf) cancelAnimationFrame(raf);
        if (ro) ro.disconnect();
        window.removeEventListener('resize', resize);
        hit.removeEventListener('pointermove', onMove);
        hit.removeEventListener('pointerdown', onDown);
        hit.removeEventListener('pointerleave', onLeave);
        hit.removeEventListener('pointerup', onUp);
        hit.removeEventListener('pointercancel', onUp);
      },
    };
  }

  /* ─────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────── */
  const userName = STATE.profile?.display_name || STATE.user?.email?.split('@')[0] || 'there';
  const greeting = getGreeting();

  const SUGGESTIONS = [
    'What should I focus on today?',
    'Add a task: call the bank',
    'I weighed 182 today',
  ];

  const BRIEF_PROMPT = "Give me a punchy daily briefing. Greet me by name, then in short bullet lines: my #1 priority this week, today's workout day, anyone I should reach out to, one habit to keep alive, and end with a single motivating line. Keep it tight — under 7 short lines.";

  // Card CTAs — tapping one summons a live, interactive card (the AI can
  // summon the same cards via a show_card action).
  const CARD_CTAS = [
    { key: 'meal',    label: 'Meal Plan', icon: '🍽️' },
    { key: 'workout', label: 'Workout',   icon: '🏋️' },
    { key: 'focus',   label: 'Focus',     icon: '🎯' },
    { key: 'money',   label: 'Money',     icon: '💰' },
    { key: 'connect', label: 'Connect',   icon: '💕' },
  ];

  function render() {
    inner.innerHTML = `
      <div class="ai-dash">

        <!-- Orb hero — the caption floats over the glowing orb -->
        <div class="ai-orb-hero">
          <div class="ai-orb-caption">
            <div class="ai-orb-greeting">${greeting}, ${escapeHtml(userName)}</div>
            <div class="ai-orb-status" id="aiOrbStatus">I'm listening. Ask me anything.</div>
            <button class="ai-voice-toggle" id="aiVoiceToggle" type="button" aria-pressed="true" title="Toggle the AI's voice">
              <span id="aiVoiceToggleIcon">🔊</span><span id="aiVoiceToggleLabel">Voice on</span>
            </button>
          </div>
        </div>

        <!-- Daily briefing -->
        <button class="ai-brief-btn" id="aiBriefBtn" type="button">☀️ Brief me on my day</button>

        <!-- Summonable cards — tap a CTA (or ask the AI) to pop a live card -->
        <div class="ai-card-ctas">
          ${CARD_CTAS.map(c => `<button class="ai-card-cta" type="button" data-card="${c.key}"><span class="ai-card-cta-icon">${c.icon}</span><span>${escapeHtml(c.label)}</span></button>`).join('')}
        </div>
        <div class="onyx-cardstage" id="onyxCardStage"></div>

        <!-- Today command center (Life Rings + streak + mood + habits + focus) -->
        <div class="onyx-today" id="onyxToday"></div>

        <!-- Suggested prompts -->
        <div class="ai-suggest">
          ${SUGGESTIONS.map(s => `
            <button class="ai-suggest-btn" type="button" data-prompt="${escapeHtml(s)}">${escapeHtml(s)}</button>
          `).join('')}
        </div>

        <!-- Conversation thread -->
        <div class="ai-thread" id="aiThread"></div>

        <!-- Chat input -->
        <form class="ai-chat-form" id="aiChatForm">
          <input type="text" id="aiChatInput" class="ai-chat-input" placeholder="Ask Onyxra anything…" autocomplete="off" />
          <button type="button" class="ai-chat-mic" id="aiChatMic" aria-label="Speak to Onyxra" title="Hold a conversation — tap to talk">🎤</button>
          <button type="submit" class="ai-chat-send" id="aiChatSend" aria-label="Send">→</button>
        </form>

      </div>
    `;

    initOrb();
    initChat();
    initVoice();
    renderToday();

    // Re-render the Today layer whenever state changes anywhere (chat actions,
    // quick capture, pull-to-refresh). Idempotent: the listener is added once
    // and always calls the latest renderToday via window.__renderToday.
    window.__renderToday = renderToday;
    if (!window.__onyxTodayListener) {
      window.__onyxTodayListener = true;
      ['onyxra:state-changed', 'onyxra:refresh'].forEach(ev =>
        window.addEventListener(ev, () => { try { window.__renderToday && window.__renderToday(); } catch (e) {} }));
    }
  }

  /* ─────────────────────────────────────────────────────────────
     ORB INIT (with cleanup of any prior instance)
  ───────────────────────────────────────────────────────────── */
  function initOrb() {
    if (window.__dashOrb) { try { window.__dashOrb.destroy(); } catch (e) {} }
    // The orb lives OUTSIDE the pages (directly in #mainContent, behind every
    // page) — a position:fixed, continuously-animating canvas placed INSIDE an
    // opacity-transitioning .page stalls the opacity transitions of the other
    // pages, leaving them blank. Only #page-dashboard is transparent, so the
    // orb shows through there and is covered by the opaque pages elsewhere.
    const host = document.getElementById('mainContent') || document.body;
    let canvas = document.getElementById('dashOrb');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'dashOrb';
      canvas.className = 'ai-orb-bg';
      canvas.setAttribute('aria-hidden', 'true');
    }
    if (canvas.parentElement !== host) host.insertBefore(canvas, host.firstChild);
    orb = createDashOrb(canvas, document.getElementById('page-dashboard'));
    window.__dashOrb = orb;
  }

  function setStatus(text, thinking) {
    const el = document.getElementById('aiOrbStatus');
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('thinking', !!thinking);
  }

  /* ─────────────────────────────────────────────────────────────
     CHAT — calls /api/chat with snapshot, drives orb mood
  ───────────────────────────────────────────────────────────── */
  function initChat() {
    const form = document.getElementById('aiChatForm');
    if (form) {
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const input = document.getElementById('aiChatInput');
        const text = (input.value || '').trim();
        if (!text) return;
        input.value = '';
        // Keep speech synthesis unlocked — must be touched inside a user gesture.
        if (voiceOn && 'speechSynthesis' in window) { try { window.speechSynthesis.resume(); } catch (e2) {} }
        await sendChat(text);
      });
    }

    document.querySelectorAll('.ai-suggest-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = btn.dataset.prompt;
        if (p) sendChat(p);
      });
    });

    const briefBtn = document.getElementById('aiBriefBtn');
    if (briefBtn) briefBtn.addEventListener('click', () => {
      if (window.haptic) window.haptic('tap');
      if (voiceOn && 'speechSynthesis' in window) { try { window.speechSynthesis.resume(); } catch (e) {} }
      sendChat(BRIEF_PROMPT);
    });

    document.querySelectorAll('.ai-card-cta').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.haptic) window.haptic('tap');
        showCard(btn.dataset.card);
      });
    });

    // Let the AI (show_card action) and other modules summon cards.
    window.onyxShowCard = (key) => showCard(key);
  }

  async function sendChat(text) {
    messages.push({ role: 'user', content: text });
    appendMessage('user', text);

    const typingEl = appendTyping();
    if (orb) orb.setMood('thinking');
    setStatus('Thinking…', true);
    if (speakTimer) { clearTimeout(speakTimer); speakTimer = null; }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          snapshot: window.buildOnyxraSnapshot ? window.buildOnyxraSnapshot() : buildSnapshot(),
        }),
      });

      typingEl.remove();

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        appendMessage('assistant', `⚠️ ${err.error || 'AI is unavailable.'}`, true);
        if (orb) orb.setMood('idle');
        setStatus('Something went wrong. Try again.');
        return;
      }

      const data = await res.json();
      const raw = data.reply || '...';

      // Agentic: pull any action block out, apply it, show what changed.
      const parsed = window.parseOnyxraActions ? window.parseOnyxraActions(raw) : { clean: raw, actions: [] };
      const chips = (window.applyOnyxraActions && parsed.actions.length) ? window.applyOnyxraActions(parsed.actions) : [];
      const reply = parsed.clean || (chips.length ? 'Done ✓' : raw);

      messages.push({ role: 'assistant', content: reply });   // store CLEAN text only
      appendMessage('assistant', reply);
      if (chips.length) {
        appendActionChips(chips);
        renderToday();                                          // reflect changes immediately
        if (window.toast) window.toast(chips.length === 1 ? chips[0].label : (chips.length + ' updates applied'), { type: 'success', duration: 1800 });
      }

      const dur = Math.max(1800, Math.min(6500, reply.length * 32));
      if (voiceOn && 'speechSynthesis' in window) {
        speakAloud(reply, dur);          // talk out loud + pulse the orb per word
      } else {
        if (orb) orb.speak(dur);         // silent: just the speaking-pulse animation
        setStatus('Speaking…');
        speakTimer = setTimeout(() => setStatus("I'm listening. Ask me anything."), dur);
      }
    } catch (err) {
      typingEl.remove();
      appendMessage('assistant', `⚠️ Network error: ${err.message}`, true);
      if (orb) orb.setMood('idle');
      setStatus('Connection lost. Try again.');
    }
  }

  function appendMessage(role, content, isError) {
    const thread = document.getElementById('aiThread');
    if (!thread) return;
    const el = document.createElement('div');
    el.className = `ai-msg ai-msg-${role}${isError ? ' ai-msg-error' : ''}`;
    el.innerHTML = role === 'assistant'
      ? `<div class="ai-msg-avatar">O</div><div class="ai-msg-bubble">${formatMarkdown(content)}</div>`
      : `<div class="ai-msg-bubble">${escapeHtml(content)}</div>`;
    thread.appendChild(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  function appendTyping() {
    const thread = document.getElementById('aiThread');
    const el = document.createElement('div');
    el.className = 'ai-msg ai-msg-assistant';
    el.innerHTML = `<div class="ai-msg-avatar">O</div><div class="ai-msg-bubble"><span class="ai-typing"><span></span><span></span><span></span></span></div>`;
    thread.appendChild(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'end' });
    return el;
  }

  /** Render confirmation chips under the last assistant reply (what changed). */
  function appendActionChips(chips) {
    const thread = document.getElementById('aiThread');
    if (!thread || !chips || !chips.length) return;
    const el = document.createElement('div');
    el.className = 'ai-action-chips';
    el.innerHTML = chips.map(c => `<span class="ai-action-chip">${escapeHtml(c.icon || '✓')} ${escapeHtml(c.label)}</span>`).join('');
    thread.appendChild(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  /* ─────────────────────────────────────────────────────────────
     VOICE — the orb literally talks (TTS) + you can talk to it (STT)
  ───────────────────────────────────────────────────────────── */
  function speakAloud(text, fallbackDur) {
    try {
      const synth = window.speechSynthesis;
      synth.cancel(); // stop anything already queued
      // Strip markdown + emoji so the voice reads cleanly.
      const clean = String(text)
        .replace(/[*_`#>]/g, '')
        .replace(/\s*[•\-]\s+/g, ', ')
        .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{FE0F}]/gu, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
      if (!clean) { if (orb) orb.speak(fallbackDur); return; }

      const u = new SpeechSynthesisUtterance(clean);
      const v = pickVoice();
      if (v) u.voice = v;
      u.rate = 1.03; u.pitch = 1.0; u.volume = 1.0;
      u.onstart    = () => { if (orb) orb.setMood('speaking'); setStatus('Speaking…'); };
      u.onboundary = () => { if (orb) orb.kick(0.30); };   // pulse the blob on each word
      u.onend      = () => { if (orb) orb.setMood('idle'); setStatus("I'm listening. Ask me anything."); };
      u.onerror    = u.onend;
      synth.speak(u);
    } catch (e) {
      if (orb) orb.speak(fallbackDur);
      setStatus('Speaking…');
      speakTimer = setTimeout(() => setStatus("I'm listening. Ask me anything."), fallbackDur);
    }
  }

  function pickVoice() {
    const vs = (window.speechSynthesis && window.speechSynthesis.getVoices()) || [];
    if (!vs.length) return null;
    const prefer = ['Google US English', 'Samantha', 'Microsoft Aria', 'Microsoft Jenny', 'Daniel', 'Karen', 'Google UK English Female'];
    for (const name of prefer) {
      const hit = vs.find(v => v.name && v.name.indexOf(name) !== -1);
      if (hit) return hit;
    }
    return vs.find(v => /en[-_]US/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || vs[0];
  }

  function syncVoiceToggle() {
    const icon   = document.getElementById('aiVoiceToggleIcon');
    const label  = document.getElementById('aiVoiceToggleLabel');
    const toggle = document.getElementById('aiVoiceToggle');
    if (icon)   icon.textContent  = voiceOn ? '🔊' : '🔇';
    if (label)  label.textContent = voiceOn ? 'Voice on' : 'Voice off';
    if (toggle) toggle.setAttribute('aria-pressed', voiceOn ? 'true' : 'false');
  }

  function initVoice() {
    // ── Talk-back toggle ──
    const toggle = document.getElementById('aiVoiceToggle');
    if (toggle) {
      syncVoiceToggle();
      toggle.addEventListener('click', () => {
        voiceOn = !voiceOn;
        try { localStorage.setItem('onyxra_voice', voiceOn ? 'on' : 'off'); } catch (e) {}
        if (!voiceOn && 'speechSynthesis' in window) window.speechSynthesis.cancel();
        syncVoiceToggle();
      });
    }

    // Warm up the voice list (loads async on some browsers).
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }

    // ── Mic / speech-to-text ──
    const micBtn = document.getElementById('aiChatMic');
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!micBtn) return;
    if (!SR) { micBtn.style.display = 'none'; return; } // unsupported (e.g. Firefox) → hide

    function stopListening() {
      if (!listening && !recog) return;
      listening = false;
      micBtn.classList.remove('listening');
      try { recog && recog.stop(); } catch (e) {}
      if (orb) orb.setMood('idle');
      const st = document.getElementById('aiOrbStatus');
      if (st && st.textContent === 'Listening…') setStatus("I'm listening. Ask me anything.");
    }

    function startListening() {
      try {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel(); // don't talk over the user
        recog = new SR();
        recog.lang = 'en-US';
        recog.interimResults = true;
        recog.continuous = false;
        listening = true;
        micBtn.classList.add('listening');
        if (orb) orb.setMood('listening');
        setStatus('Listening…', true);
        const input = document.getElementById('aiChatInput');

        recog.onresult = e => {
          let txt = '';
          for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
          if (input) input.value = txt;
          if (e.results[e.results.length - 1].isFinal) {
            const finalText = txt.trim();
            stopListening();
            if (finalText) { if (input) input.value = ''; sendChat(finalText); }
          }
        };
        recog.onerror = () => stopListening();
        recog.onend   = () => { if (listening) stopListening(); };
        recog.start();
      } catch (e) { stopListening(); }
    }

    micBtn.addEventListener('click', () => listening ? stopListening() : startListening());
  }

  /* ─────────────────────────────────────────────────────────────
     SUMMONABLE CARDS — tap a CTA or ask the AI; a live, interactive
     card pops into the stage. Google-style answer cards for your life.
  ───────────────────────────────────────────────────────────── */
  function cardShell(icon, title, bodyHtml, openPage) {
    return `<div class="ai-card ai-pop">
      <div class="ai-card-head">
        <span class="ai-card-title">${icon} ${escapeHtml(title)}</span>
        <div class="ai-card-headtools">
          ${openPage ? `<button class="ai-card-open" type="button" data-open="${openPage}">Open →</button>` : ''}
          <button class="ai-card-close" type="button" data-card-close aria-label="Close">✕</button>
        </div>
      </div>
      <div class="ai-card-body">${bodyHtml}</div>
    </div>`;
  }

  function nextMealSlot() {
    const h = new Date().getHours();
    return h < 11 ? 0 : h < 15 ? 1 : h < 20 ? 2 : 3;
  }
  function mealForSlot(slot) {
    const phase = STATE.data.nutrition.currentPhase || 'maintain';
    const options = (APP_DATA.nutrition?.meals?.[phase]?.[slot]) || [];
    const selIdx = STATE.data.nutrition.selectedMeals?.[phase]?.[slot];
    const chosen = (selIdx != null && options[selIdx]) ? options[selIdx] : options[0];
    return { meal: chosen, chosen: !!(selIdx != null && options[selIdx]), phase };
  }

  function buildMealCard() {
    const titles = APP_DATA.nutrition?.mealTitles || ['Meal 1', 'Meal 2', 'Meal 3', 'Meal 4'];
    const slot = Math.max(0, Math.min(3, mealSlot));
    const { meal, chosen, phase } = mealForSlot(slot);
    if (!meal) {
      return cardShell('🍽️', "Today's meals", `<div class="ai-card-empty">No meals set for your ${escapeHtml(phase)} phase yet. Open Meal Plan to choose them.</div>`, 'nutrition');
    }
    const body = `
      <div class="ai-meal" data-no-swipe>
        <div class="ai-meal-slot">${escapeHtml(titles[slot] || ('Meal ' + (slot + 1)))}${chosen ? '' : ' · suggested'}</div>
        <div class="ai-meal-name">${escapeHtml(meal.name)}</div>
        <div class="ai-meal-tags">${meal.cuisine ? `<span>${escapeHtml(meal.cuisine)}</span>` : ''}${meal.category ? `<span>${escapeHtml(meal.category)}</span>` : ''}</div>
        <div class="ai-meal-macros">
          <span class="mm mm-cal">${meal.calories} cal</span>
          <span class="mm mm-p">${meal.protein}g P</span>
          <span class="mm mm-c">${meal.carbs}g C</span>
          <span class="mm mm-f">${meal.fats}g F</span>
        </div>
        <div class="ai-card-nav">
          <button class="ai-card-arrow" type="button" data-meal-prev aria-label="Previous meal">‹</button>
          <div class="ai-card-dots">${[0, 1, 2, 3].map(i => `<span class="${i === slot ? 'on' : ''}"></span>`).join('')}</div>
          <button class="ai-card-arrow" type="button" data-meal-next aria-label="Next meal">›</button>
        </div>
      </div>`;
    return cardShell('🍽️', "Today's meals", body, 'nutrition');
  }

  function buildWorkoutCard() {
    const ws = STATE.data.workout;
    const day = STATE.currentWorkoutDay;
    const phase = ws.currentPhase || 'recovery';
    const week = ws.weekNumber || 1;
    if (!day || day === 'Rest') {
      return cardShell('🛌', 'Today: Rest day',
        `<div class="ai-wk-rest">You're on a <b>rest day</b> — recovery is where the growth happens. Week ${week}, ${capitalize(phase)} phase.<div class="ai-wk-restsub">Stretch, walk, hydrate. 💧</div></div>`,
        'workout');
    }
    const dayData = (APP_DATA.workout?.[phase]?.[day]) || null;
    const exs = dayData?.exercises || [];
    const body = `
      <div class="ai-wk">
        <div class="ai-wk-head"><span class="ai-wk-day">${escapeHtml(day)}</span><span class="ai-wk-meta">${escapeHtml(dayData?.focus || '')} · Week ${week}</span></div>
        <div class="ai-wk-list">
          ${exs.length ? exs.slice(0, 8).map(e => `<div class="ai-wk-ex"><span class="ai-wk-ex-name">${escapeHtml(e.name)}</span><span class="ai-wk-ex-reps">${escapeHtml(e.reps || '')}</span></div>`).join('') : '<div class="ai-card-empty">No exercises mapped for today.</div>'}
          ${exs.length > 8 ? `<div class="ai-wk-more">+${exs.length - 8} more exercises</div>` : ''}
        </div>
      </div>`;
    return cardShell('🏋️', "Today's workout", body, 'workout');
  }

  function buildFocusCard() {
    const ds = STATE.data.dashboard;
    const open = (ds.tasks || []).filter(t => !t.done).slice(0, 6);
    const body = `
      <div class="ai-focuscard">
        ${ds.weeklyTopPriority ? `<div class="ai-focuscard-prio">⭐ ${escapeHtml(ds.weeklyTopPriority)}</div>` : ''}
        ${open.length ? open.map(t => `<div class="ai-focuscard-task"><button class="ai-focuscard-check" type="button" data-fcheck="${t.id}" aria-label="Complete"></button><span>${escapeHtml(t.text)}</span></div>`).join('') : '<div class="ai-card-empty">No open tasks — you\'re clear. 🎯</div>'}
      </div>`;
    return cardShell('🎯', 'Focus', body);
  }

  function buildMoneyCard() {
    const nw = STATE.data.metrics?.networth || [];
    const last = nw.length ? nw[nw.length - 1].value : null;
    const delta = nw.length >= 2 ? last - nw[0].value : 0;
    const fmt = (v) => window.formatCurrency ? window.formatCurrency(v) : ('$' + Math.round(v).toLocaleString());
    const body = (last != null)
      ? `<div class="ai-money"><div class="ai-money-val">${fmt(last)}</div><div class="ai-money-sub">${nw.length >= 2 ? `${delta >= 0 ? '▲ +' : '▼ '}${fmt(Math.abs(delta))} since first log` : 'net worth logged'}</div></div>`
      : `<div class="ai-card-empty">No net worth logged yet. Say “log my net worth 52000,” or open Investments.</div>`;
    return cardShell('💰', 'Money', body, 'wealth');
  }

  function buildConnectCard() {
    const rls = STATE.data.relationship || {};
    const fam = STATE.data.family?.members || [];
    const fr = STATE.data.friends?.members || [];
    const dates = (rls.dates || []).slice(0, 3);
    const people = [];
    if (rls.name) people.push({ n: rls.name, u: rls.updates?.[0]?.text || 'No recent note' });
    fam.slice(0, 2).forEach(m => people.push({ n: m.name, u: m.updates?.[0]?.text || 'No recent note' }));
    fr.slice(0, 2).forEach(m => people.push({ n: m.name, u: m.updates?.[0]?.text || 'No recent note' }));
    const body = `
      <div class="ai-connectcard">
        ${dates.length ? `<div class="ai-connect-dates">${dates.map(d => `<span class="ai-connect-date">📅 ${escapeHtml(d.label)} · ${escapeHtml((d.date || '').slice(5))}</span>`).join('')}</div>` : ''}
        ${people.length ? people.map(p => `<div class="ai-connect-person"><b>${escapeHtml(p.n)}</b><span>${escapeHtml(p.u)}</span></div>`).join('') : '<div class="ai-card-empty">Add people in the People section to track who to reach out to. 💕</div>'}
      </div>`;
    return cardShell('💕', 'Connect', body, 'relationship');
  }

  function buildCard(key) {
    switch (key) {
      case 'meal': return buildMealCard();
      case 'workout': return buildWorkoutCard();
      case 'focus': return buildFocusCard();
      case 'money': return buildMoneyCard();
      case 'connect': return buildConnectCard();
      default: return '';
    }
  }

  function showCard(key, opts) {
    opts = opts || {};
    if (typeof getCurrentPage === 'function' && getCurrentPage() !== 'dashboard') navigateTo('dashboard');
    const stage = document.getElementById('onyxCardStage');
    if (!stage || !buildCard(key)) return;
    if (key === 'meal' && !opts.keepSlot) mealSlot = nextMealSlot();
    stage.innerHTML = buildCard(key);
    stage.classList.add('show');
    wireCard(key, stage);
    if (!opts.noScroll) stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function wireCard(key, stage) {
    const close = stage.querySelector('[data-card-close]');
    if (close) close.addEventListener('click', () => { stage.classList.remove('show'); stage.innerHTML = ''; });
    const open = stage.querySelector('[data-open]');
    if (open) open.addEventListener('click', () => navigateTo(open.dataset.open));

    if (key === 'meal') {
      const prev = stage.querySelector('[data-meal-prev]');
      const next = stage.querySelector('[data-meal-next]');
      const go = (d) => { mealSlot = (mealSlot + d + 4) % 4; if (window.haptic) window.haptic('tap'); showCard('meal', { keepSlot: true, noScroll: true }); };
      if (prev) prev.addEventListener('click', () => go(-1));
      if (next) next.addEventListener('click', () => go(1));
      // swipe between meals
      const card = stage.querySelector('.ai-meal');
      if (card) {
        let sx = 0;
        card.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
        card.addEventListener('touchend', e => {
          const dx = e.changedTouches[0].clientX - sx;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        }, { passive: true });
      }
    }

    if (key === 'focus') {
      stage.querySelectorAll('[data-fcheck]').forEach(b => b.addEventListener('click', () => {
        STATE.toggleTask(b.dataset.fcheck);
        if (window.haptic) window.haptic('success');
        showCard('focus', { noScroll: true });
        renderToday();
      }));
    }
  }

  /* ─────────────────────────────────────────────────────────────
     TODAY — Life Rings, streak, mood, focus/tasks, habits.
     A glanceable command center that lives under the orb.
  ───────────────────────────────────────────────────────────── */
  const MOODS = [[1, '😞'], [2, '😕'], [3, '😐'], [4, '🙂'], [5, '🤩']];

  function ringSvg(t) {
    const arc = (r, frac, cls) => {
      const c = 2 * Math.PI * r;
      const off = c * (1 - Math.max(0, Math.min(1, frac)));
      return `<circle class="onyx-ring-bg" cx="60" cy="60" r="${r}"></circle>
        <circle class="onyx-ring-fg ${cls}" cx="60" cy="60" r="${r}"
          stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"
          transform="rotate(-90 60 60)"></circle>`;
    };
    return `<svg viewBox="0 0 120 120" class="onyx-rings-svg" aria-hidden="true">
      ${arc(52, t.focus.frac, 'r-focus')}
      ${arc(40.5, t.body.frac, 'r-body')}
      ${arc(29, t.connect.frac, 'r-connect')}
    </svg>`;
  }

  function sparkline(series, cls) {
    const pts = (series || []).slice(-12);
    if (pts.length < 2) return '';
    const vals = pts.map(p => p.value);
    const min = Math.min(...vals), max = Math.max(...vals);
    const span = (max - min) || 1;
    const W = 120, H = 30;
    const coords = pts.map((p, i) => {
      const x = (i / (pts.length - 1)) * W;
      const y = H - ((p.value - min) / span) * (H - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" class="onyx-spark ${cls}" preserveAspectRatio="none" aria-hidden="true">
      <polyline points="${coords.join(' ')}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  function renderToday() {
    const host = document.getElementById('onyxToday');
    if (!host || !STATE.computeToday) return;
    const t = STATE.computeToday();
    const habits = STATE.data.habits?.items || [];
    const tasks = (STATE.data.dashboard.tasks || []);
    const openTasks = tasks.filter(x => !x.done).slice(0, 5);
    const doneCount = tasks.filter(x => x.done).length;
    const priority = STATE.data.dashboard.weeklyTopPriority || '';
    const wSeries = STATE.data.metrics?.weight || [];
    const overallPct = Math.round(t.overall * 100);

    host.innerHTML = `
      <div class="onyx-card onyx-today-card">
        <div class="onyx-rings">
          <div class="onyx-rings-stack">
            ${ringSvg(t)}
            <div class="onyx-rings-center">
              <div class="onyx-rings-pct">${overallPct}<span>%</span></div>
              <div class="onyx-rings-sub">today</div>
            </div>
          </div>
          <div class="onyx-rings-side">
            <div class="onyx-streak"><span class="onyx-streak-flame">🔥</span><b>${t.streak}</b><span class="onyx-streak-lbl">day${t.streak === 1 ? '' : 's'}</span></div>
            <button class="onyx-leg r-focus" data-ring="focus"><span class="onyx-leg-dot"></span>Focus<b>${t.focus.value}/${t.focus.goal}</b></button>
            <button class="onyx-leg r-body" data-ring="body"><span class="onyx-leg-dot"></span>Body<b>${Math.round(t.body.frac * 100)}%</b></button>
            <button class="onyx-leg r-connect" data-ring="connect"><span class="onyx-leg-dot"></span>Connect<b>${Math.round(t.connect.frac * 100)}%</b></button>
          </div>
        </div>

        <div class="onyx-mood">
          <span class="onyx-mood-label">${t.moodToday ? 'Today’s mood' : 'How are you feeling?'}</span>
          <div class="onyx-mood-row">
            ${MOODS.map(m => `<button class="onyx-mood-pick${t.moodToday === m[0] ? ' on' : ''}" data-mood="${m[0]}" aria-label="Mood ${m[0]}">${m[1]}</button>`).join('')}
          </div>
        </div>
      </div>

      <div class="onyx-card onyx-focus-card">
        <div class="onyx-focus-priority">
          <span class="onyx-focus-star">⭐</span>
          <input class="onyx-priority-input" id="onyxPriorityInput" value="${escapeHtml(priority)}" placeholder="Your #1 focus this week…" />
        </div>
        <div class="onyx-tasks" id="onyxTasks">
          ${openTasks.length ? openTasks.map(x => `
            <div class="onyx-task" data-task="${x.id}">
              <button class="onyx-task-check" data-check="${x.id}" aria-label="Complete"></button>
              <span class="onyx-task-text">${escapeHtml(x.text)}</span>
              <button class="onyx-task-del" data-del="${x.id}" aria-label="Delete">✕</button>
            </div>`).join('') : `<div class="onyx-tasks-empty">No open tasks. Ask me to add one, or type below. 🎯</div>`}
        </div>
        <form class="onyx-task-add" id="onyxTaskAdd">
          <input class="onyx-task-add-input" id="onyxTaskInput" placeholder="Add a task…" autocomplete="off" />
          <button class="onyx-task-add-btn" type="submit" aria-label="Add task">+</button>
        </form>
        ${doneCount ? `<div class="onyx-focus-foot">${doneCount} done all-time${wSeries.length >= 2 ? ' · weight trend' : ''} ${wSeries.length >= 2 ? sparkline(wSeries, 'sp-weight') : ''}</div>` : ''}
      </div>

      <div class="onyx-card onyx-habits-card">
        <div class="onyx-habits-head"><span>Daily habits</span><button class="onyx-habit-add-btn" id="onyxHabitAdd" type="button">+ Add</button></div>
        <div class="onyx-habits-row" id="onyxHabitsRow">
          ${habits.length ? habits.map(h => {
            const done = !!(h.log && h.log[t.day]);
            const streak = STATE.habitStreak(h.id);
            return `<button class="onyx-habit${done ? ' done' : ''}" data-habit="${h.id}" style="--hc:${escapeHtml(h.color || '#ffb340')}">
              <span class="onyx-habit-icon">${escapeHtml(h.icon || '✅')}</span>
              <span class="onyx-habit-name">${escapeHtml(h.name)}</span>
              ${streak > 0 ? `<span class="onyx-habit-streak">🔥${streak}</span>` : ''}
            </button>`;
          }).join('') : `<div class="onyx-habits-empty">No habits yet. Tap “+ Add” or say “add a habit to read 20 minutes.”</div>`}
        </div>
      </div>
    `;
    wireToday();
  }

  function wireToday() {
    const host = document.getElementById('onyxToday');
    if (!host) return;

    // Mood
    host.querySelectorAll('.onyx-mood-pick').forEach(b => b.addEventListener('click', () => {
      STATE.setTodayMood(Number(b.dataset.mood));
      if (window.haptic) window.haptic('success');
      if (window.toast) window.toast('Mood logged', { type: 'success', duration: 1200 });
      renderToday();
    }));

    // Ring legend → jump to the relevant area
    host.querySelectorAll('.onyx-leg').forEach(b => b.addEventListener('click', () => {
      const r = b.dataset.ring;
      if (r === 'body') navigateTo('workout');
      else if (r === 'connect') navigateTo('relationship');
      else { const i = document.getElementById('onyxTaskInput'); if (i) i.focus(); }
    }));

    // Priority — save on blur / Enter
    const pin = host.querySelector('#onyxPriorityInput');
    if (pin) {
      const save = () => { const v = pin.value.trim(); if (v !== (STATE.data.dashboard.weeklyTopPriority || '')) { STATE.setWeeklyPriority(v); if (window.haptic) window.haptic('tap'); } };
      pin.addEventListener('blur', save);
      pin.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); save(); pin.blur(); } });
    }

    // Tasks — toggle / delete / add
    host.querySelectorAll('[data-check]').forEach(b => b.addEventListener('click', () => {
      STATE.toggleTask(b.dataset.check); if (window.haptic) window.haptic('success'); renderToday();
    }));
    host.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
      STATE.removeTask(b.dataset.del); if (window.haptic) window.haptic('tap'); renderToday();
    }));
    const taskForm = host.querySelector('#onyxTaskAdd');
    if (taskForm) taskForm.addEventListener('submit', e => {
      e.preventDefault();
      const input = host.querySelector('#onyxTaskInput');
      const v = (input.value || '').trim();
      if (!v) return;
      STATE.addTask(v); input.value = '';
      if (window.haptic) window.haptic('tap');
      renderToday();
      setTimeout(() => { const i = document.getElementById('onyxTaskInput'); if (i) i.focus(); }, 0);
    });

    // Habits — tick / add
    host.querySelectorAll('[data-habit]').forEach(b => b.addEventListener('click', () => {
      const on = STATE.tickHabit(b.dataset.habit);
      if (window.haptic) window.haptic(on ? 'success' : 'tap');
      renderToday();
    }));
    const addBtn = host.querySelector('#onyxHabitAdd');
    if (addBtn) addBtn.addEventListener('click', () => showHabitAdd());
  }

  function showHabitAdd() {
    const row = document.getElementById('onyxHabitsRow');
    if (!row) return;
    const RINGS = [['focus', '🎯', '#ffb340'], ['body', '💪', '#ff6b35'], ['connect', '💬', '#ff7a4d']];
    row.innerHTML = `
      <form class="onyx-habit-form" id="onyxHabitForm">
        <input class="onyx-habit-input" id="onyxHabitName" placeholder="New habit (e.g. Read 20 min)" autocomplete="off" />
        <div class="onyx-habit-rings">
          ${RINGS.map((r, i) => `<button type="button" class="onyx-habit-ringpick${i === 0 ? ' on' : ''}" data-ring="${r[0]}" data-icon="${r[1]}" data-color="${r[2]}" title="${r[0]}">${r[1]}</button>`).join('')}
        </div>
        <button class="onyx-habit-save" type="submit">Add</button>
      </form>`;
    const form = document.getElementById('onyxHabitForm');
    const name = document.getElementById('onyxHabitName');
    let pick = { ring: 'focus', icon: '🎯', color: '#ffb340' };
    row.querySelectorAll('.onyx-habit-ringpick').forEach(b => b.addEventListener('click', () => {
      row.querySelectorAll('.onyx-habit-ringpick').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      pick = { ring: b.dataset.ring, icon: b.dataset.icon, color: b.dataset.color };
    }));
    setTimeout(() => name && name.focus(), 50);
    form.addEventListener('submit', e => {
      e.preventDefault();
      const v = (name.value || '').trim();
      if (!v) { renderToday(); return; }
      STATE.addHabit(v, pick.icon, pick.color, pick.ring);
      if (window.haptic) window.haptic('success');
      if (window.toast) window.toast('Habit added', { type: 'success', duration: 1400 });
      renderToday();
    });
  }

  /* ─────────────────────────────────────────────────────────────
     HELPERS
  ───────────────────────────────────────────────────────────── */
  function getGreeting() {
    const h = new Date().getHours();
    if (h < 5)  return 'Late night';
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    if (h < 21) return 'Evening';
    return 'Night';
  }

  function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : ''; }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]);
  }

  function formatMarkdown(text) {
    return escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.+)$/gm, '• $1')
      .replace(/\n/g, '<br/>');
  }

  /* ── Initial render ── */
  render();
});
