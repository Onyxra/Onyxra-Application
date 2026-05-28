/**
 * ONYXRA — dashboard.js
 *
 * The AI Hub. Replaces the old static dashboard.
 *
 * Layout (top to bottom):
 *   1. AI greeting / status line
 *   2. Tinder-swipeable card carousel — Workout, Meals, Tasks, Business, Passions, Wealth
 *   3. CTA buttons (quick jump to each inner page)
 *   4. AI conversation thread (messages render here when user asks something)
 *   5. Chat input bar (anchored bottom on mobile)
 *
 * AI is wired to /api/chat which proxies to the Vercel AI Gateway.
 * Every chat call includes a STATE snapshot so the AI knows what's going on.
 */

window.registerPage('dashboard', function initDashboard() {

  const inner = document.getElementById('dashboard-inner');
  if (!inner) return;

  const ds  = STATE.data.dashboard;
  const ws  = STATE.data.workout;
  const ns  = STATE.data.nutrition;
  const bs  = STATE.data.business;
  const ps  = STATE.data.passions;

  const todayStr = new Date().toISOString().slice(0, 10);

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
    };
  }

  /* ─────────────────────────────────────────────────────────────
     CARD DEFINITIONS — what each swipeable card shows
  ───────────────────────────────────────────────────────────── */
  function getMealName(id) {
    if (!id) return null;
    const u = (ns.userMeals || []).find(m => m.id === id);
    if (u) return u.name;
    return null;
  }

  function buildCards() {
    const todayWorkoutDay = STATE.currentWorkoutDay;
    const todayPlan = ns.mealPlan?.[todayStr] || {};
    const tasks = (ds.tasks || []).filter(t => !t.done);
    const openTasks = tasks.slice(0, 5);

    const cards = [];

    /* ── Tasks/Todos Card ── */
    cards.push({
      id: 'tasks',
      icon: '📝',
      eyebrow: 'Today',
      title: 'Your To-Dos',
      accent: '#4fc3f7',
      gradient: 'linear-gradient(135deg, rgba(79,195,247,0.15) 0%, rgba(124,106,247,0.05) 100%)',
      body: openTasks.length > 0 ? `
        <div class="card-list">
          ${openTasks.map(t => `
            <div class="card-row" data-task-id="${t.id}">
              <button class="task-check" data-task-id="${t.id}" aria-label="Complete"></button>
              <span>${escapeHtml(t.text)}</span>
            </div>
          `).join('')}
        </div>
        ${tasks.length > 5 ? `<div class="card-footer-text">+${tasks.length - 5} more</div>` : ''}
      ` : `
        <div class="card-empty">No open tasks. Add one below 👇</div>
      `,
      footer: `
        <form class="card-add-task" id="cardAddTaskForm">
          <input type="text" class="card-add-input" placeholder="Add a task..." id="cardAddTaskInput" />
          <button type="submit" class="card-add-btn">+</button>
        </form>
      `,
      cta: { label: 'Ask AI to prioritize', action: 'prioritize' },
    });

    /* ── Workout Card ── */
    const isRest = todayWorkoutDay === 'Rest';
    cards.push({
      id: 'workout',
      icon: '🏋️',
      eyebrow: `Week ${ws.weekNumber || 1} · ${ws.currentPhase}`,
      title: isRest ? 'Rest Day' : `Today: ${todayWorkoutDay}`,
      accent: '#ff6b35',
      gradient: 'linear-gradient(135deg, rgba(255,107,53,0.15) 0%, rgba(245,200,66,0.05) 100%)',
      body: isRest ? `
        <div class="card-empty">Recovery day. Stretch, walk, eat clean.</div>
      ` : `
        <div class="card-stat-row">
          <div class="card-stat">
            <div class="card-stat-label">Phase</div>
            <div class="card-stat-value">${capitalize(ws.currentPhase)}</div>
          </div>
          <div class="card-stat">
            <div class="card-stat-label">Cycle</div>
            <div class="card-stat-value">${(ws.cycleCount || 0) + 1}</div>
          </div>
        </div>
        <div class="card-hint">Open the Workout page to see exercises.</div>
      `,
      cta: { label: 'Open Workout →', action: 'goto:workout' },
    });

    /* ── Nutrition Card ── */
    const macros = window.computeMacros?.(ns.calcWeight, ns.calcGoal, ns.calcActivity) || {};
    const filled = ['breakfast','lunch','dinner','snack'].filter(k => todayPlan[k]).length;
    cards.push({
      id: 'meals',
      icon: '🍽️',
      eyebrow: capitalize(ns.currentPhase),
      title: `${filled}/4 Meals Planned`,
      accent: '#3ddc6e',
      gradient: 'linear-gradient(135deg, rgba(61,220,110,0.15) 0%, rgba(41,168,82,0.05) 100%)',
      body: `
        <div class="card-stat-row">
          <div class="card-stat"><div class="card-stat-label">kcal</div><div class="card-stat-value">${macros.calories || 0}</div></div>
          <div class="card-stat"><div class="card-stat-label">P</div><div class="card-stat-value">${macros.protein || 0}g</div></div>
          <div class="card-stat"><div class="card-stat-label">C</div><div class="card-stat-value">${macros.carbs || 0}g</div></div>
          <div class="card-stat"><div class="card-stat-label">F</div><div class="card-stat-value">${macros.fats || 0}g</div></div>
        </div>
      `,
      cta: { label: 'Open Nutrition →', action: 'goto:nutrition' },
    });

    /* ── Business Card ── */
    const activeVenture = bs.ventures?.find(v => v.id === bs.activeVentureId);
    cards.push({
      id: 'business',
      icon: '🏗️',
      eyebrow: 'Ventures',
      title: activeVenture ? activeVenture.name : 'No active venture',
      accent: '#7c6af7',
      gradient: 'linear-gradient(135deg, rgba(124,106,247,0.15) 0%, rgba(79,58,184,0.05) 100%)',
      body: activeVenture ? `
        <div class="card-stat-row">
          <div class="card-stat"><div class="card-stat-label">MRR</div><div class="card-stat-value">$${activeVenture.mrr || 0}</div></div>
          <div class="card-stat"><div class="card-stat-label">Users</div><div class="card-stat-value">${activeVenture.users || 0}</div></div>
          <div class="card-stat"><div class="card-stat-label">Stage</div><div class="card-stat-value">${activeVenture.hormozi_stage || 0}/9</div></div>
        </div>
      ` : `
        <div class="card-empty">Create your first venture in the Business page.</div>
      `,
      cta: { label: 'Open Business →', action: 'goto:business' },
    });

    /* ── Interests Card ── */
    const activePassion = ps.passions?.find(p => p.id === ps.activePassionId) || ps.passions?.[0];
    cards.push({
      id: 'passions',
      icon: '✦',
      eyebrow: 'Interests',
      title: activePassion ? `${activePassion.icon || '✦'} ${activePassion.name}` : 'No interests yet',
      accent: '#f06292',
      gradient: 'linear-gradient(135deg, rgba(240,98,146,0.15) 0%, rgba(244,143,177,0.05) 100%)',
      body: activePassion ? `
        <div class="card-hint">${escapeHtml(activePassion.description || 'Track what you love.')}</div>
        <div class="card-stat-row">
          <div class="card-stat"><div class="card-stat-label">Goals</div><div class="card-stat-value">${(activePassion.goals || []).length}</div></div>
          <div class="card-stat"><div class="card-stat-label">Journal</div><div class="card-stat-value">${(activePassion.journal || []).length}</div></div>
        </div>
      ` : `
        <div class="card-empty">Add an interest to start tracking.</div>
      `,
      cta: { label: 'Open Interests →', action: 'goto:passions' },
    });

    return cards;
  }

  /* ─────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────── */
  const userName = STATE.profile?.display_name || STATE.user?.email?.split('@')[0] || 'there';
  const greeting = getGreeting();

  function render() {
    const cards = buildCards();
    inner.innerHTML = `
      <div class="ai-hub">

        <!-- AI Greeting -->
        <div class="ai-greeting">
          <div class="ai-avatar">
            <svg viewBox="0 0 40 40" width="40" height="40" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="aiGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#4fc3f7"/>
                  <stop offset="100%" stop-color="#7c6af7"/>
                </linearGradient>
              </defs>
              <circle cx="20" cy="20" r="20" fill="url(#aiGrad)"/>
              <text x="20" y="26" text-anchor="middle" fill="#fff" font-size="18" font-weight="700" font-family="Rajdhani, sans-serif">O</text>
            </svg>
            <span class="ai-pulse"></span>
          </div>
          <div class="ai-greeting-text">
            <div class="ai-greeting-line">${greeting}, ${escapeHtml(userName)}</div>
            <div class="ai-greeting-sub">Swipe through your day, or ask me anything.</div>
          </div>
        </div>

        <!-- Swipeable Card Carousel -->
        <div class="card-carousel" id="cardCarousel">
          <div class="card-track" id="cardTrack">
            ${cards.map((c, i) => renderCard(c, i)).join('')}
          </div>
          <div class="card-dots" id="cardDots">
            ${cards.map((_, i) => `<span class="card-dot${i === 0 ? ' active' : ''}" data-idx="${i}"></span>`).join('')}
          </div>
        </div>

        <!-- CTA Buttons -->
        <div class="ai-ctas">
          ${cards.map(c => `
            <button class="ai-cta-btn" data-jump="${c.id}" style="--accent:${c.accent}">
              <span class="ai-cta-icon">${c.icon}</span>
              <span class="ai-cta-label">${c.id === 'tasks' ? 'Tasks' :
                                            c.id === 'workout' ? 'Workout' :
                                            c.id === 'meals' ? 'Meals' :
                                            c.id === 'business' ? 'Business' :
                                            c.id === 'passions' ? 'Interests' : c.id}</span>
            </button>
          `).join('')}
        </div>

        <!-- Conversation Thread -->
        <div class="ai-thread" id="aiThread"></div>

        <!-- Chat Input -->
        <form class="ai-chat-form" id="aiChatForm">
          <input type="text" id="aiChatInput" class="ai-chat-input" placeholder="Ask Onyxra anything..." autocomplete="off" />
          <button type="submit" class="ai-chat-send" id="aiChatSend" aria-label="Send">→</button>
        </form>

      </div>
    `;

    initCarousel(cards);
    initCTAs(cards);
    initChat();
    initTaskActions();
  }

  function renderCard(c, idx) {
    return `
      <div class="hub-card" data-card-id="${c.id}" data-idx="${idx}" style="background:${c.gradient};border-color:${c.accent}40">
        <div class="hub-card-head">
          <div class="hub-card-icon" style="background:${c.accent}20;color:${c.accent}">${c.icon}</div>
          <div class="hub-card-titles">
            <div class="hub-card-eyebrow">${escapeHtml(c.eyebrow)}</div>
            <div class="hub-card-title">${escapeHtml(c.title)}</div>
          </div>
        </div>
        <div class="hub-card-body">${c.body}</div>
        ${c.footer ? `<div class="hub-card-footer-form">${c.footer}</div>` : ''}
        ${c.cta ? `<button class="hub-card-cta" data-cta-action="${c.cta.action}" style="border-color:${c.accent}80;color:${c.accent}">${c.cta.label}</button>` : ''}
      </div>
    `;
  }

  /* ─────────────────────────────────────────────────────────────
     CAROUSEL — Tinder-style swipe between cards
  ───────────────────────────────────────────────────────────── */
  function initCarousel(cards) {
    const track = document.getElementById('cardTrack');
    const dots = document.querySelectorAll('.card-dot');
    let activeIdx = 0;
    let startX = null;
    let currentX = 0;
    let isDragging = false;

    function goTo(idx) {
      activeIdx = Math.max(0, Math.min(cards.length - 1, idx));
      track.style.transition = 'transform 0.35s cubic-bezier(0.22,0.61,0.36,1)';
      track.style.transform = `translateX(-${activeIdx * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === activeIdx));
    }

    // Touch / drag
    function onStart(x) {
      startX = x;
      isDragging = true;
      track.style.transition = 'none';
    }
    function onMove(x) {
      if (!isDragging) return;
      currentX = x - startX;
      const offsetPct = (currentX / track.offsetWidth) * 100;
      track.style.transform = `translateX(calc(-${activeIdx * 100}% + ${offsetPct}%))`;
    }
    function onEnd() {
      if (!isDragging) return;
      isDragging = false;
      const threshold = track.offsetWidth * 0.18;
      if (currentX < -threshold && activeIdx < cards.length - 1) goTo(activeIdx + 1);
      else if (currentX > threshold && activeIdx > 0) goTo(activeIdx - 1);
      else goTo(activeIdx);
      currentX = 0;
    }

    track.addEventListener('touchstart', e => onStart(e.touches[0].clientX), { passive: true });
    track.addEventListener('touchmove',  e => onMove(e.touches[0].clientX),  { passive: true });
    track.addEventListener('touchend',   onEnd);

    track.addEventListener('mousedown', e => { e.preventDefault(); onStart(e.clientX); });
    window.addEventListener('mousemove', e => isDragging && onMove(e.clientX));
    window.addEventListener('mouseup',   () => isDragging && onEnd());

    // Dot clicks
    dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));

    // CTA buttons inside cards
    document.querySelectorAll('[data-cta-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.ctaAction;
        if (action.startsWith('goto:')) {
          navigateTo(action.replace('goto:', ''));
        } else if (action === 'prioritize') {
          sendChat("What should I focus on right now? Look at my tasks and priorities and give me your top 3.");
        }
      });
    });

    goTo(0);
  }

  /* ─────────────────────────────────────────────────────────────
     CTA BUTTON ROW — jumps to corresponding card or page
  ───────────────────────────────────────────────────────────── */
  function initCTAs(cards) {
    document.querySelectorAll('.ai-cta-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.jump;
        const idx = cards.findIndex(c => c.id === id);
        if (idx >= 0) {
          // Scroll carousel to that card
          const track = document.getElementById('cardTrack');
          track.style.transition = 'transform 0.35s cubic-bezier(0.22,0.61,0.36,1)';
          track.style.transform = `translateX(-${idx * 100}%)`;
          document.querySelectorAll('.card-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
          // Smooth scroll up to the carousel
          document.getElementById('cardCarousel').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────
     TASK ACTIONS (inside the Tasks card)
  ───────────────────────────────────────────────────────────── */
  function initTaskActions() {
    // Add task form
    const form = document.getElementById('cardAddTaskForm');
    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        const input = document.getElementById('cardAddTaskInput');
        const text = (input.value || '').trim();
        if (!text) return;
        STATE.addTask(text);
        input.value = '';
        render();
      });
    }
    // Toggle task done
    document.querySelectorAll('.task-check').forEach(btn => {
      btn.addEventListener('click', () => {
        STATE.toggleTask(btn.dataset.taskId);
        render();
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────
     CHAT — calls /api/chat with snapshot
  ───────────────────────────────────────────────────────────── */
  let messages = []; // {role, content}

  function initChat() {
    const form = document.getElementById('aiChatForm');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const input = document.getElementById('aiChatInput');
      const text = (input.value || '').trim();
      if (!text) return;
      input.value = '';
      await sendChat(text);
    });
  }

  async function sendChat(text) {
    const thread = document.getElementById('aiThread');
    messages.push({ role: 'user', content: text });
    appendMessage('user', text);

    const typingEl = appendTyping();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          snapshot: buildSnapshot(),
        }),
      });

      typingEl.remove();

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        appendMessage('assistant', `⚠️ ${err.error || 'AI is unavailable.'}`, true);
        return;
      }

      const data = await res.json();
      const reply = data.reply || '...';
      messages.push({ role: 'assistant', content: reply });
      appendMessage('assistant', reply);
    } catch (err) {
      typingEl.remove();
      appendMessage('assistant', `⚠️ Network error: ${err.message}`, true);
    }
  }

  function appendMessage(role, content, isError) {
    const thread = document.getElementById('aiThread');
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
    // Very light markdown: bold, line breaks, bullets
    return escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.+)$/gm, '• $1')
      .replace(/\n/g, '<br/>');
  }

  /* ── Initial render ── */
  render();
});
