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
      if (mood === 'idle')          base = 0.16 + Math.sin(t * 1.2) * 0.03;
      else if (mood === 'thinking') base = 0.36 + Math.sin(t * 5.0) * 0.13;
      else                          base = 0.66 + (Math.sin(t * 11) * 0.5 + 0.5) * 0.28 * (0.6 + 0.4 * Math.sin(t * 23));
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
    "How's my week going?",
    'Give me a quick life snapshot',
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
          </div>
        </div>

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
          <button type="submit" class="ai-chat-send" id="aiChatSend" aria-label="Send">→</button>
        </form>

      </div>
    `;

    initOrb();
    initChat();
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
        body: JSON.stringify({ messages, snapshot: buildSnapshot() }),
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
      const reply = data.reply || '...';
      messages.push({ role: 'assistant', content: reply });
      appendMessage('assistant', reply);

      const dur = Math.max(1800, Math.min(6500, reply.length * 32));
      if (orb) orb.speak(dur);
      setStatus('Speaking…');
      speakTimer = setTimeout(() => setStatus("I'm listening. Ask me anything."), dur);
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
