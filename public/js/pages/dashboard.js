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
  function createDashOrb(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return { setMood() {}, speak() {}, destroy() {} };

    const reduce = window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // palette
    const CY = [79, 195, 247];   // cyan
    const PU = [124, 106, 247];  // purple
    const PK = [240, 98, 146];   // pink
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

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      W = w; H = h;
      CXp = w / 2; CYp = h / 2;
      R = Math.min(w, h) * 0.26;
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
      // Skip work entirely when the dashboard page is hidden (display:none).
      if (canvas.offsetParent === null) { raf = requestAnimationFrame(draw); return; }

      t = now * 0.001;

      // smooth pointer
      ptr.x += (ptr.tx - ptr.x) * 0.10;
      ptr.y += (ptr.ty - ptr.y) * 0.10;
      ptr.act += (ptr.tAct - ptr.act) * 0.08;

      // mood → target energy
      if (mood === 'speaking' && now > speakUntil) mood = 'idle';
      let base;
      if (mood === 'idle')           base = 0.16 + Math.sin(t * 1.2) * 0.03;
      else if (mood === 'thinking')  base = 0.36 + Math.sin(t * 5.0) * 0.13;
      else if (mood === 'listening') base = 0.30 + Math.sin(t * 7.0) * 0.10;
      else                           base = 0.66 + (Math.sin(t * 11) * 0.5 + 0.5) * 0.28 * (0.6 + 0.4 * Math.sin(t * 23));
      if (reduce) base *= 0.5;
      energy += (base - energy) * 0.12;

      // lean toward pointer
      const lean = R * 0.16 * ptr.act;
      const cx = CXp + ptr.x * lean;
      const cy = CYp + ptr.y * lean;
      const pAng = Math.atan2(ptr.y, ptr.x);
      const pMag = Math.min(1, Math.hypot(ptr.x, ptr.y));
      const bulge = 0.17 * ptr.act * pMag;

      ctx.clearRect(0, 0, W, H);

      /* 1 — outer aura */
      ctx.globalCompositeOperation = 'lighter';
      const auraR = R * (2.5 + energy * 0.7);
      const aura = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, auraR);
      aura.addColorStop(0,   `rgba(79,195,247,${0.18 + energy * 0.14})`);
      aura.addColorStop(0.5, `rgba(124,106,247,${0.09 + energy * 0.06})`);
      aura.addColorStop(1,   'rgba(124,106,247,0)');
      ctx.fillStyle = aura;
      ctx.beginPath(); ctx.arc(cx, cy, auraR, 0, 6.2832); ctx.fill();

      /* 2 — rotating HUD arcs */
      for (let i = 0; i < 3; i++) {
        const rr = R * (1.42 + i * 0.17);
        const rot = t * (0.22 + i * 0.14) * (i % 2 ? -1 : 1);
        const span = 1.1 + i * 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, rr, rot, rot + span);
        const c = i === 1 ? PK : CY;
        ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.10 + energy * 0.12})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      /* 3 — voice waveform bars */
      for (let j = 0; j < BARS; j++) {
        const a = (j / BARS) * 6.2832;
        const rad = radiusAt(a, pAng, bulge);
        const n = Math.sin(t * 6 + seed[j] + a * 3) * 0.5 + 0.5;
        const len = 5 + energy * 48 * (0.32 + 0.68 * n);
        const r0 = rad + 7;
        const r1 = r0 + len;
        const ca = Math.cos(a), sa = Math.sin(a);
        const col = mix(CY, PU, 0.5 + 0.5 * Math.sin(a * 2 + t * 0.6));
        ctx.beginPath();
        ctx.moveTo(cx + ca * r0, cy + sa * r0);
        ctx.lineTo(cx + ca * r1, cy + sa * r1);
        ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${0.22 + energy * 0.5})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      /* 4 — blob body */
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * 6.2832;
        const r = radiusAt(a, pAng, bulge);
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      const body = ctx.createRadialGradient(cx - R * 0.32, cy - R * 0.32, R * 0.1, cx, cy, R * 1.25);
      body.addColorStop(0,   'rgba(150,230,255,0.95)');
      body.addColorStop(0.5, 'rgba(79,140,247,0.60)');
      body.addColorStop(1,   'rgba(124,106,247,0.22)');
      ctx.fillStyle = body;
      ctx.fill();
      ctx.strokeStyle = `rgba(190,238,255,${0.45 + energy * 0.35})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      /* 5 — inner breathing core */
      ctx.globalCompositeOperation = 'lighter';
      const coreR = R * (0.40 + energy * 0.18 + Math.sin(t * 2) * 0.02);
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      core.addColorStop(0,   'rgba(240,252,255,0.95)');
      core.addColorStop(0.4, 'rgba(130,205,255,0.55)');
      core.addColorStop(1,   'rgba(130,205,255,0)');
      ctx.fillStyle = core;
      ctx.beginPath(); ctx.arc(cx, cy, coreR, 0, 6.2832); ctx.fill();

      /* 6 — tap ripples */
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += rp.v;
        rp.life -= 1;
        const al = Math.max(0, rp.life / rp.max) * 0.5;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, 6.2832);
        ctx.strokeStyle = `rgba(190,238,255,${al})`;
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
      const rect = canvas.getBoundingClientRect();
      ripples.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        r: R * 0.45, v: 3.4, life: 48, max: 48,
      });
    }
    function onUp(e) { if (e.pointerType !== 'mouse') ptr.tAct = 0; }

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);

    const ro = ('ResizeObserver' in window) ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(canvas); else window.addEventListener('resize', resize);

    resize();
    raf = requestAnimationFrame(draw);

    return {
      setMood(m) { mood = m; },
      speak(ms) { mood = 'speaking'; speakUntil = performance.now() + (ms || 2500); },
      // transient energy spike — call per spoken word so the blob pulses in sync with the voice
      kick(a) { energy = Math.min(1.5, energy + (a || 0.35)); },
      destroy() {
        if (raf) cancelAnimationFrame(raf);
        if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
        canvas.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerdown', onDown);
        canvas.removeEventListener('pointerleave', onLeave);
        canvas.removeEventListener('pointerup', onUp);
        canvas.removeEventListener('pointercancel', onUp);
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

  const SECTORS = [
    { label: 'People',    icon: '💕',  page: 'relationship', accent: '#f06292' },
    { label: 'Health',    icon: '◉',  page: 'workout',      accent: '#ff6b35' },
    { label: 'Wealth',    icon: '◈',  page: 'wealth',       accent: '#3ddc6e' },
    { label: 'Business',  icon: '🏗️', page: 'business',     accent: '#7c6af7' },
    { label: 'Interests', icon: '✦',  page: 'passions',     accent: '#4fc3f7' },
  ];

  function render() {
    inner.innerHTML = `
      <div class="ai-dash">

        <!-- Talking AI orb -->
        <div class="ai-orb-stage">
          <canvas class="ai-orb-canvas" id="dashOrb" aria-hidden="true"></canvas>
          <div class="ai-orb-caption">
            <div class="ai-orb-greeting">${greeting}, ${escapeHtml(userName)}</div>
            <div class="ai-orb-status" id="aiOrbStatus">I'm listening. Ask me anything.</div>
            <button class="ai-voice-toggle" id="aiVoiceToggle" type="button" aria-pressed="true" title="Toggle the AI's voice">
              <span id="aiVoiceToggleIcon">🔊</span><span id="aiVoiceToggleLabel">Voice on</span>
            </button>
          </div>
        </div>

        <!-- Today command center (Life Rings + streak + mood + habits + focus) -->
        <div class="onyx-today" id="onyxToday"></div>

        <!-- Suggested prompts -->
        <div class="ai-suggest">
          ${SUGGESTIONS.map(s => `
            <button class="ai-suggest-btn" type="button" data-prompt="${escapeHtml(s)}">${escapeHtml(s)}</button>
          `).join('')}
        </div>

        <!-- Sector shortcuts -->
        <div class="ai-ctas ai-quick">
          ${SECTORS.map(s => `
            <button class="ai-cta-btn" type="button" data-page="${s.page}" style="--accent:${s.accent}">
              <span class="ai-cta-icon">${s.icon}</span>
              <span class="ai-cta-label">${s.label}</span>
            </button>
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
    const canvas = document.getElementById('dashOrb');
    orb = canvas ? createDashOrb(canvas) : null;
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

    document.querySelectorAll('.ai-quick .ai-cta-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pg = btn.dataset.page;
        if (pg) navigateTo(pg);
      });
    });
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
            return `<button class="onyx-habit${done ? ' done' : ''}" data-habit="${h.id}" style="--hc:${escapeHtml(h.color || '#4fc3f7')}">
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
    const RINGS = [['focus', '🎯', '#4fc3f7'], ['body', '💪', '#ff6b35'], ['connect', '💬', '#f06292']];
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
    let pick = { ring: 'focus', icon: '🎯', color: '#4fc3f7' };
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
