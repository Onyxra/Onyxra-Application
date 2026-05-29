/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  KOLTYN Journal — app.js                                             ║
 * ║  Router + shared utilities                                       ║
 * ║                                                                  ║
 * ║  HOW THE ROUTER WORKS:                                           ║
 * ║  - Each page is a <section class="page" id="page-X">            ║
 * ║  - Clicking a nav item calls navigateTo('X')                    ║
 * ║  - navigateTo adds class "active" to the right section and      ║
 * ║    the right nav item, and removes it from all others           ║
 * ║  - The URL hash (#X) is updated so browser back/forward works   ║
 * ║  - On first load, the hash is read to restore the right page    ║
 * ║                                                                  ║
 * ║  HOW PAGE MODULES WORK:                                          ║
 * ║  Each page has its own JS file (e.g. nutrition/page.js).        ║
 * ║  That file calls window.registerPage('nutrition', initFn)        ║
 * ║  The router calls initFn the FIRST TIME the page is shown.      ║
 * ║  After that the page stays rendered (no re-init on re-visit).   ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */


/* ══════════════════════════════════════════════════════════════════
   PAGE REGISTRY
   Each page module registers an init function here.
   The router calls it lazily (only when first visited).
════════════════════════════════════════════════════════════════ */
const PAGE_REGISTRY   = {};  /* { pageName: initFunction } */
const INITIALISED     = {};  /* { pageName: true } — tracks which pages have been init'd */

/**
 * Called by each page module to register itself.
 * @param {string}   name - Page identifier e.g. 'nutrition'
 * @param {Function} fn   - Function to call to build the page's HTML/setup events
 */
window.registerPage = function(name, fn) {
  PAGE_REGISTRY[name] = fn;
};


/* ══════════════════════════════════════════════════════════════════
   ROUTER
════════════════════════════════════════════════════════════════ */
const VALID_PAGES = ['dashboard', 'journal', 'insights', 'nutrition', 'workout', 'business', 'wealth', 'passions', 'relationship', 'family', 'friends', 'settings'];

const PAGE_NAMES = {
  dashboard:    'Dashboard',
  journal:      'Journal',
  insights:     'Insights',
  nutrition:    'Nutrition',
  workout:      'Workout',
  business:     'Business',
  wealth:       'Investments',
  passions:     'Interests',
  relationship: 'Relationship',
  family:       'Family',
  friends:      'Friends',
  settings:     'Settings',
};

/**
 * Navigate to a page.
 * @param {string} page - Page name, must be in VALID_PAGES
 */
function navigateTo(page) {
  if (!VALID_PAGES.includes(page)) page = 'dashboard';

  /* Update mobile topbar page name */
  const nameEl = document.getElementById('topbarPageName');
  if (nameEl) nameEl.textContent = PAGE_NAMES[page] || page;

  /* Remove active from all pages + nav items */
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  /* Activate the target page */
  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');

  /* Activate the nav item */
  const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');

  /* Sync profile drawer active state */
  document.querySelectorAll('.drawer-nav-item').forEach(n => n.classList.remove('active'));
  // Add active to BOTH the main drawer item AND any nav-sub-item that's open
  document.querySelectorAll(`.drawer-nav-item[data-page="${page}"]:not(.nav-sub-item)`).forEach(el => el.classList.add('active'));

  /* Update the category tabs hint at the top of mobile pages */
  if (typeof updateCategoryHint === 'function') updateCategoryHint(page);

  /* Re-sync dynamic nav (Business / Interests) sub-item active state */
  if (typeof syncDynamicNavActive === 'function') syncDynamicNavActive();

  /* Update URL hash (no page reload) */
  history.replaceState(null, '', '#' + page);

  /* Lazy-init: run the page module's init function on first visit */
  if (PAGE_REGISTRY[page] && !INITIALISED[page]) {
    PAGE_REGISTRY[page]();
    INITIALISED[page] = true;
  }

  /* Broadcast so non-router features (FAB visibility, etc.) can react.
     replaceState does NOT fire hashchange, so we signal explicitly. */
  window.dispatchEvent(new CustomEvent('onyxra:navigate', { detail: { page } }));
}

/* Wire up nav items */
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo(item.dataset.page);
  });
});

/* Browser back/forward support */
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '');
  navigateTo(VALID_PAGES.includes(hash) ? hash : 'dashboard');
});


/* ══════════════════════════════════════════════════════════════════
   PAGE CATEGORIES — used by swipe gesture and the sibling hint.
   Pages not listed here are non-swipeable (Dashboard, Settings, etc).
═══════════════════════════════════════════════════════════════════ */
const PAGE_CATEGORIES = {
  workout:      { category: 'Health', siblings: ['workout', 'nutrition'] },
  nutrition:    { category: 'Health', siblings: ['workout', 'nutrition'] },
  relationship: { category: 'People', siblings: ['relationship', 'family', 'friends'] },
  family:       { category: 'People', siblings: ['relationship', 'family', 'friends'] },
  friends:      { category: 'People', siblings: ['relationship', 'family', 'friends'] },
  // Wealth / Business / Interests: dynamic or single-page, no sibling-swipe.
};

function getCurrentPage() {
  const h = window.location.hash.replace('#', '');
  return VALID_PAGES.includes(h) ? h : 'dashboard';
}

function navigateCategorySibling(direction /* 'next' | 'prev' */) {
  const current = getCurrentPage();
  const info = PAGE_CATEGORIES[current];
  if (!info) return false;
  const sibs = info.siblings;
  const idx = sibs.indexOf(current);
  if (idx < 0) return false;
  const len = sibs.length;
  const newIdx = direction === 'next'
    ? (idx + 1) % len
    : (idx - 1 + len) % len;
  if (sibs[newIdx] === current) return false;
  navigateTo(sibs[newIdx]);
  return true;
}

/* ══════════════════════════════════════════════════════════════════
   DYNAMIC NAV — render Business + Interests sub-items from STATE.
   Called whenever ventures/passions change.
═══════════════════════════════════════════════════════════════════ */
function _navEscape(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]);
}

window.renderDynamicNav = function renderDynamicNav() {
  if (!window.STATE?.data) return;

  const ventures = window.STATE.data?.business?.ventures || [];
  const passions = window.STATE.data?.passions?.passions || [];

  function fill(container, items, page, dataKey, defaultIcon, isDrawer) {
    if (!container) return;
    const itemClass = isDrawer ? 'drawer-nav-item nav-sub-item' : 'nav-item nav-sub-item';
    const iconClass = isDrawer ? 'drawer-nav-icon' : 'nav-icon';

    container.innerHTML = items.map(item => {
      const icon  = _navEscape(item.icon || defaultIcon);
      const name  = _navEscape(item.name || 'Untitled');
      const idVal = _navEscape(item.id);
      const labelHtml = isDrawer
        ? `<span>${name}</span>`
        : `<span class="nav-label">${name}</span>`;
      return `
        <a class="${itemClass}" data-page="${page}" data-${dataKey}="${idVal}" href="#${page}">
          <span class="${iconClass}">${icon}</span>${labelHtml}
        </a>`;
    }).join('');

    container.querySelectorAll(`[data-${dataKey}]`).forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        const id = el.getAttribute(`data-${dataKey}`);
        navigateToSubPage(page, id);
      });
    });
  }

  fill(document.getElementById('navBusinessItems'),     ventures, 'business', 'venture-id', '🚀', false);
  fill(document.getElementById('drawerBusinessItems'),  ventures, 'business', 'venture-id', '🚀', true);
  fill(document.getElementById('navInterestsItems'),    passions, 'passions', 'passion-id', '✦', false);
  fill(document.getElementById('drawerInterestsItems'), passions, 'passions', 'passion-id', '✦', true);

  // Re-apply active state for the current page after rebuild
  syncDynamicNavActive();
};

function syncDynamicNavActive() {
  const cur = getCurrentPage();
  const activeVid = window.STATE?.data?.business?.activeVentureId;
  const activePid = window.STATE?.data?.passions?.activePassionId;

  document.querySelectorAll('.nav-sub-item').forEach(el => {
    const isBiz = el.dataset.page === 'business';
    const isPas = el.dataset.page === 'passions';
    const matchPage = el.dataset.page === cur;
    const matchSub = (isBiz && el.dataset.ventureId === activeVid)
                  || (isPas && el.dataset.passionId === activePid);
    el.classList.toggle('active', matchPage && matchSub);
  });

  // Parent nav-item without sub-id should not be active when a sub is active
  document.querySelectorAll(`.nav-item[data-page="${cur}"]:not(.nav-sub-item):not(.nav-add-sub)`).forEach(el => {
    if (cur === 'business' && activeVid) el.classList.remove('active');
    if (cur === 'passions' && activePid) el.classList.remove('active');
  });
}

/** Navigate to a page and switch to a specific sub-record (venture/passion).
 *  Force re-init the page so it re-reads STATE and renders the new active item. */
function navigateToSubPage(page, subId) {
  if (page === 'business') {
    window.STATE.data.business.activeVentureId = subId;
    window.STATE.save();
  } else if (page === 'passions') {
    window.STATE.data.passions.activePassionId = subId;
    window.STATE.save();
  }
  // Force re-init to pick up the new active sub-record
  INITIALISED[page] = false;
  navigateTo(page);
}

/* "+ Add Business" / "+ Add Interest" → navigate to page and show new-form */
function setupNavAddButtons() {
  const wire = (id, page, flagName) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', e => {
      e.preventDefault();
      window[flagName] = true;
      INITIALISED[page] = false;
      navigateTo(page);
    });
  };
  wire('navAddBusinessBtn',   'business', '__onyxraShowNewVenture');
  wire('drawerAddBusinessBtn','business', '__onyxraShowNewVenture');
  wire('navAddInterestBtn',   'passions', '__onyxraShowNewPassion');
  wire('drawerAddInterestBtn','passions', '__onyxraShowNewPassion');

  // Profile chip (desktop sidebar footer) → Settings.
  // Settings was removed as a top-level nav item and lives here now.
  const profileBtn = document.getElementById('navProfileBtn');
  if (profileBtn) {
    profileBtn.addEventListener('click', e => {
      e.preventDefault();
      navigateTo('settings');
    });
  }
}
// Run setup once DOM has the buttons
setupNavAddButtons();


/* Category tabs indicator at the top of each swipe-capable page.
   On mobile: small segmented control showing sibling pages.
   On desktop: hidden (sidebar already handles navigation). */
function updateCategoryHint(page) {
  const main = document.getElementById('mainContent');
  if (!main) return;
  let hint = document.getElementById('categoryHint');

  const info = PAGE_CATEGORIES[page];

  if (!info) {
    if (hint) hint.style.display = 'none';
    return;
  }

  if (!hint) {
    hint = document.createElement('div');
    hint.id = 'categoryHint';
    hint.className = 'category-hint';
    main.insertBefore(hint, main.firstChild);
  }
  hint.style.display = '';

  hint.innerHTML = `
    <div class="category-hint-label">${info.category}</div>
    <div class="category-tabs">
      ${info.siblings.map(s => `
        <button class="category-tab${s === page ? ' active' : ''}" data-target="${s}">
          ${PAGE_NAMES[s] || s}
        </button>
      `).join('')}
    </div>
  `;

  hint.querySelectorAll('.category-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.target !== page) navigateTo(btn.dataset.target);
    });
  });
}


/* ══════════════════════════════════════════════════════════════════
   MOBILE PAGE SWIPE — swipe left/right between category siblings.
   Only fires under 768px. Skips when touch starts inside a child that
   handles its own swipe (carousel, modal, drawer) or an input.
═══════════════════════════════════════════════════════════════════ */
(function setupPageSwipe() {
  const main = document.getElementById('mainContent');
  if (!main) return;

  const SWIPE_DISTANCE_MIN = 80;     // px
  const HORIZONTAL_DOMINANCE = 1.4;  // |dx| > |dy| * this

  // Elements that handle their own touch gestures; we let them have priority
  const SKIP_SELECTOR = [
    '.card-track',              // dashboard AI hub carousel
    '.modal', '.modal-overlay',
    '.ex-modal', '.ex-modal-overlay',
    '.notif-panel',
    '.profile-drawer',
    'input', 'textarea', 'select',
    'button', 'a',
    '[data-no-swipe]',
  ].join(', ');

  let startX = 0, startY = 0, tracking = false;

  main.addEventListener('touchstart', (e) => {
    if (window.innerWidth > 768) return;
    if (e.touches.length !== 1) return;

    // Skip if touch starts on or inside a known interactive/swipeable child
    if (e.target.closest(SKIP_SELECTOR)) return;

    // Only enable on pages that have category siblings
    if (!PAGE_CATEGORIES[getCurrentPage()]) return;

    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    tracking = true;
  }, { passive: true });

  main.addEventListener('touchend', (e) => {
    if (!tracking) return;
    tracking = false;

    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;

    if (Math.abs(dx) < SWIPE_DISTANCE_MIN) return;
    if (Math.abs(dx) < Math.abs(dy) * HORIZONTAL_DOMINANCE) return;

    if (dx < 0) {
      // Swipe left → next sibling
      navigateCategorySibling('next');
    } else {
      // Swipe right → previous sibling
      navigateCategorySibling('prev');
    }
  }, { passive: true });

  main.addEventListener('touchcancel', () => { tracking = false; }, { passive: true });
})();

/*
 * NOTE: Initial page load call (navigateTo) is at the bottom of
 * vision/page.js — the last script tag in index.html — so all
 * page modules are registered before the router tries to init any.
 */


/* ══════════════════════════════════════════════════════════════════
   MOBILE TOP BAR CONTROLS
   Hamburger → profile drawer slide-out
   Bell → notifications panel drop-down
   Drawer nav items → navigate + close drawer
════════════════════════════════════════════════════════════════ */

(function initMobileControls() {
  const hamburgerBtn   = document.getElementById('hamburgerBtn');
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  const profileDrawer  = document.getElementById('profileDrawer');
  const drawerClose    = document.getElementById('drawerClose');
  const notifBtn       = document.getElementById('notifBtn');      // mobile topbar bell
  const notifPanel     = document.getElementById('notifPanel');
  const notifBadge     = document.getElementById('notifBadge');    // mobile topbar badge
  const notifMarkRead  = document.getElementById('notifMarkRead');
  const notifList      = document.getElementById('notifList');

  if (!hamburgerBtn) return; // not in DOM (shouldn't happen)

  /* ── Notifications data ── */
  const NOTIFS = [
    { icon: '🏋️', title: 'Workout Reminder',  text: 'Today is your Upper day — stay on schedule.', time: 'Now',       unread: true  },
    { icon: '🎯', title: 'Weekly Check-in',    text: 'Log your body weight and BF% to track progress.', time: '2h ago',   unread: true  },
    { icon: '🍽️', title: 'Nutrition',          text: 'Select your meals for today to hit your macros.', time: '5h ago',   unread: false },
    { icon: '⭐', title: 'North Star',         text: '$50K MRR · 200 lbs · 15% BF — keep your eyes on it.', time: 'Yesterday', unread: false },
  ];

  let unreadCount = NOTIFS.filter(n => n.unread).length;

  function renderNotifs() {
    notifList.innerHTML = NOTIFS.map(n => `
      <div class="notif-item${n.unread ? ' unread' : ''}">
        <div class="notif-item-icon">${n.icon}</div>
        <div class="notif-item-body">
          <div class="notif-item-title">${n.title}</div>
          <div class="notif-item-text">${n.text}</div>
          <div class="notif-item-time">${n.time}</div>
        </div>
        ${n.unread ? '<div class="notif-unread-dot"></div>' : ''}
      </div>`).join('');
  }

  function updateBadge() {
    const val     = unreadCount > 0 ? String(unreadCount) : '';
    const display = unreadCount > 0 ? 'flex' : 'none';
    // Mobile topbar badge
    notifBadge.textContent   = val;
    notifBadge.style.display = display;
    // All in-header page notif badges (one per page, rendered by buildPageHeader)
    document.querySelectorAll('.page-notif-badge').forEach(b => {
      b.textContent   = val;
      b.style.display = display;
    });
  }

  renderNotifs();
  updateBadge();

  /* ── Drawer open / close ── */
  function openDrawer() {
    profileDrawer.classList.add('open');
    drawerBackdrop.classList.add('open');
    closeNotifPanel();
  }

  function closeDrawer() {
    profileDrawer.classList.remove('open');
    drawerBackdrop.classList.remove('open');
  }

  hamburgerBtn.addEventListener('click', () =>
    profileDrawer.classList.contains('open') ? closeDrawer() : openDrawer());
  drawerClose.addEventListener('click', closeDrawer);
  drawerBackdrop.addEventListener('click', closeDrawer);

  /* ── Drawer nav items ── */
  document.querySelectorAll('.drawer-nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(item.dataset.page);
      closeDrawer();
    });
  });

  /* ── Notifications panel open / close ── */
  function openNotifPanel(triggerBtn) {
    if (triggerBtn) {
      const rect = triggerBtn.getBoundingClientRect();
      notifPanel.style.top   = (rect.bottom + 8) + 'px';
      notifPanel.style.right = (window.innerWidth - rect.right) + 'px';
      notifPanel.style.left  = 'auto';
    }
    notifPanel.classList.add('open');
    closeDrawer();
  }

  function closeNotifPanel() {
    notifPanel.classList.remove('open');
  }

  // Mobile topbar bell
  notifBtn.addEventListener('click', e => {
    e.stopPropagation();
    notifPanel.classList.contains('open') ? closeNotifPanel() : openNotifPanel(notifBtn);
  });

  // Desktop in-header bells (one per page) — event delegation
  document.addEventListener('click', e => {
    const btn = e.target.closest('.page-notif-btn');
    if (btn) {
      e.stopPropagation();
      notifPanel.classList.contains('open') ? closeNotifPanel() : openNotifPanel(btn);
      return;
    }
    if (!notifPanel.contains(e.target) && e.target !== notifBtn) {
      closeNotifPanel();
    }
  });

  notifMarkRead.addEventListener('click', () => {
    NOTIFS.forEach(n => n.unread = false);
    unreadCount = 0;
    updateBadge();
    renderNotifs();
  });
})();


/* ══════════════════════════════════════════════════════════════════
   SHARED UTILITIES
   Helper functions available to all page modules.
════════════════════════════════════════════════════════════════ */

/**
 * Creates an eyebrow + title page header and returns the HTML string.
 * Each page calls this to render its top section consistently.
 */
window.buildPageHeader = function(eyebrow, titleMain, titleAccent, subtitle, controlsHTML = '') {
  return `
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-eyebrow">${eyebrow}</div>
        <h1 class="page-title">${titleMain} <span>${titleAccent}</span></h1>
        ${subtitle ? `<div class="page-subtitle">${subtitle}</div>` : ''}
      </div>
      <div class="page-header-right">
        ${controlsHTML ? `<div class="page-header-controls">${controlsHTML}</div>` : ''}
        <div class="page-tabs-desktop"></div>
        <button class="page-notif-btn" aria-label="Notifications">
          <span class="page-notif-icon">🔔</span>
          <span class="page-notif-badge"></span>
        </button>
      </div>
    </div>
    <div class="page-tabs-mobile"></div>`;
};

/**
 * Renders page-level tabs into both the desktop header slot and the mobile bar.
 * tabs: [{ id: string, label: string }]
 * activeId: the currently active tab id
 * onChange: function(id) called when a tab is clicked
 */
window.setPageTabs = function(inner, tabs, activeId, onChange) {
  function build(isMobile) {
    return tabs.map(t => {
      const cls = 'ptab-' + (isMobile ? 'mobile' : 'desktop') + (t.id === activeId ? ' active' : '');
      return `<button class="${cls}" data-ptab="${t.id}">${t.label}</button>`;
    }).join('');
  }

  const desktop = inner.querySelector('.page-tabs-desktop');
  const mobile  = inner.querySelector('.page-tabs-mobile');
  if (desktop) desktop.innerHTML = build(false);
  if (mobile)  mobile.innerHTML  = build(true);

  inner.querySelectorAll('[data-ptab]').forEach(btn => {
    btn.addEventListener('click', () => onChange(btn.dataset.ptab));
  });
};

/**
 * Computes daily macro targets from calculator inputs.
 * Shared by nutrition.js (for summary bars) and settings.js (for the calculator UI).
 * Returns { calories, protein, carbs, fats, tdee }
 */
window.computeMacros = function(weight, goal, activity) {
  weight   = weight   || 175;
  goal     = goal     || 'maintain';
  activity = activity || 14;
  const tdee     = weight * activity;
  const goalAdj  = goal === 'bulk' ? 300 : goal === 'cut' ? -500 : 0;
  const calories = Math.round(tdee + goalAdj);
  const protein  = Math.round(weight * 1.0);
  const fat      = Math.round(weight * 0.35);
  const carbs    = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { calories, protein, carbs, fats: fat, tdee: Math.round(tdee) };
};

/**
 * Formats a number as currency: 1234.5 → "$1,234"
 */
window.formatCurrency = function(n, prefix = '$') {
  return prefix + Math.round(n).toLocaleString('en-US');
};

/**
 * Returns a CSS width% string capped at 100% for progress bars.
 */
window.progressPct = function(current, target) {
  return Math.min(100, Math.round((current / target) * 100)) + '%';
};

/**
 * Shared modal swipe-to-dismiss setup for mobile.
 * @param {Element} modalEl   - The .modal or .ex-modal element
 * @param {Function} closeFn  - Function to call when dismissed
 */
window.setupSwipeDismiss = function(modalEl, closeFn) {
  let startY = 0;

  modalEl.addEventListener('touchstart', e => {
    startY = e.touches[0].clientY;
  }, { passive: true });

  modalEl.addEventListener('touchmove', e => {
    const dy = e.touches[0].clientY - startY;
    if (dy > 0) modalEl.style.transform = `translateY(${Math.min(dy, 200)}px)`;
  }, { passive: true });

  modalEl.addEventListener('touchend', e => {
    const dy = e.changedTouches[0].clientY - startY;
    modalEl.style.transition = 'transform 0.25s ease';
    if (dy > 80) {
      closeFn();
    } else {
      modalEl.style.transform = '';
      setTimeout(() => { modalEl.style.transition = ''; }, 260);
    }
  });
};


/* ══════════════════════════════════════════════════════════════════
   PWA POLISH LAYER
   Native-app feel: haptics, toasts, install prompt, pull-to-refresh.
   All exposed on window so any page module can use them.
════════════════════════════════════════════════════════════════ */
(function onyxraPWA() {

  /* ── Haptics — light, meaningful vibration on supported devices ── */
  const HAPTIC = { tap: 8, soft: 14, success: [0, 22, 34, 22], warn: [0, 40, 30, 55], error: [0, 60, 40, 60], pop: 18 };
  window.haptic = function (kind) {
    try {
      if (!('vibrate' in navigator)) return;
      navigator.vibrate(HAPTIC[kind] != null ? HAPTIC[kind] : (kind || 8));
    } catch (e) { /* no-op */ }
  };

  /* ── Toasts — transient confirmations, top-center, swipe/tap to dismiss ── */
  function toastHost() {
    let host = document.getElementById('onyxToasts');
    if (!host) {
      host = document.createElement('div');
      host.id = 'onyxToasts';
      host.className = 'onyx-toasts';
      document.body.appendChild(host);
    }
    return host;
  }
  window.toast = function (message, opts) {
    opts = opts || {};
    const type = opts.type || 'default';
    const icon = ('icon' in opts) ? opts.icon
      : ({ success: '✓', error: '✕', info: 'ⓘ', ai: '✦', warn: '!' }[type] || '');
    const el = document.createElement('div');
    el.className = 'onyx-toast onyx-toast-' + type;
    if (icon) {
      const ic = document.createElement('span');
      ic.className = 'onyx-toast-icon';
      ic.textContent = icon;
      el.appendChild(ic);
    }
    const msg = document.createElement('span');
    msg.className = 'onyx-toast-msg';
    msg.textContent = message;
    el.appendChild(msg);
    if (opts.action && typeof opts.onAction === 'function') {
      const b = document.createElement('button');
      b.className = 'onyx-toast-action';
      b.textContent = opts.action;
      b.addEventListener('click', (e) => { e.stopPropagation(); try { opts.onAction(); } catch (er) {} dismiss(); });
      el.appendChild(b);
    }
    toastHost().appendChild(el);
    requestAnimationFrame(() => el.classList.add('in'));
    let timer = setTimeout(dismiss, opts.duration || 3200);
    function dismiss() {
      clearTimeout(timer);
      el.classList.remove('in');
      el.classList.add('out');
      setTimeout(() => el.remove(), 280);
    }
    el.addEventListener('click', (e) => { if (e.target.tagName !== 'BUTTON') dismiss(); });
    return { dismiss };
  };

  /* ── Install to home screen ── */
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.__canInstall = true;
    document.body.classList.add('can-install');
    maybeShowInstallBanner();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    window.__canInstall = false;
    document.body.classList.remove('can-install');
    try { localStorage.setItem('onyxra_installed', '1'); } catch (e) {}
    if (window.toast) window.toast('Onyxra installed — welcome home', { type: 'success' });
    const b = document.getElementById('onyxInstallBanner');
    if (b) b.remove();
  });

  window.promptInstall = async function () {
    if (!deferredPrompt) {
      const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      if (window.toast) {
        window.toast(isiOS ? 'Tap the Share icon, then “Add to Home Screen”'
                           : 'Use your browser menu → Install / Add to Home Screen',
                     { type: 'info', duration: 5200 });
      }
      return;
    }
    deferredPrompt.prompt();
    let outcome = 'dismissed';
    try { outcome = (await deferredPrompt.userChoice).outcome; } catch (e) {}
    deferredPrompt = null;
    document.body.classList.remove('can-install');
  };

  function maybeShowInstallBanner() {
    let dismissed = false, installed = false;
    try {
      dismissed = localStorage.getItem('onyxra_install_dismissed') === '1';
      installed = localStorage.getItem('onyxra_installed') === '1';
    } catch (e) {}
    if (dismissed || installed) return;
    if (document.getElementById('onyxInstallBanner')) return;
    const standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
                    || window.navigator.standalone === true;
    if (standalone) return;

    const b = document.createElement('div');
    b.id = 'onyxInstallBanner';
    b.className = 'onyx-install-banner';
    b.innerHTML = `
      <div class="onyx-install-logo">⬡</div>
      <div class="onyx-install-copy">
        <div class="onyx-install-title">Install Onyxra</div>
        <div class="onyx-install-sub">Full-screen, offline-ready, on your home screen</div>
      </div>
      <button class="onyx-install-go" type="button">Install</button>
      <button class="onyx-install-x" type="button" aria-label="Dismiss">✕</button>`;
    document.body.appendChild(b);
    requestAnimationFrame(() => b.classList.add('in'));
    b.querySelector('.onyx-install-go').addEventListener('click', () => { window.haptic('tap'); window.promptInstall(); });
    b.querySelector('.onyx-install-x').addEventListener('click', () => {
      try { localStorage.setItem('onyxra_install_dismissed', '1'); } catch (e) {}
      b.classList.remove('in');
      setTimeout(() => b.remove(), 300);
    });
  }

  /* ── Refresh the current page module (re-runs its init) ── */
  window.refreshCurrentPage = function () {
    try {
      const page = (typeof getCurrentPage === 'function') ? getCurrentPage() : 'dashboard';
      if (typeof INITIALISED !== 'undefined') INITIALISED[page] = false;
      navigateTo(page);
      window.dispatchEvent(new CustomEvent('onyxra:refresh', { detail: { page } }));
    } catch (e) {
      location.reload();
    }
  };

  /* ── Pull-to-refresh (mobile) ── */
  (function pullToRefresh() {
    const main = document.getElementById('mainContent');
    if (!main) return;

    const THRESH = 72;
    let startY = 0, pulling = false, dist = 0, indicator = null;

    function ensureIndicator() {
      if (indicator) return indicator;
      indicator = document.createElement('div');
      indicator.className = 'onyx-ptr';
      indicator.innerHTML = '<div class="onyx-ptr-ring"></div>';
      document.body.appendChild(indicator);
      return indicator;
    }
    function scrolledTop() {
      const sc = document.scrollingElement || document.documentElement;
      return Math.max(main.scrollTop || 0, sc.scrollTop || 0, window.scrollY || 0) <= 4;
    }

    main.addEventListener('touchstart', (e) => {
      if (window.innerWidth > 900) return;
      if (e.touches.length !== 1) return;
      if (!scrolledTop()) return;
      // Don't hijack pulls that begin inside a scrollable inner panel / modal.
      if (e.target.closest('.modal, .ex-modal, .notif-panel, .profile-drawer, .onyx-sheet, .ai-thread')) return;
      startY = e.touches[0].clientY; pulling = true; dist = 0;
    }, { passive: true });

    main.addEventListener('touchmove', (e) => {
      if (!pulling) return;
      dist = e.touches[0].clientY - startY;
      if (dist <= 0) { reset(); return; }
      const ind = ensureIndicator();
      const pull = Math.min(dist, 130);
      ind.classList.add('show');
      ind.style.transform = `translateX(-50%) translateY(${Math.min(pull, THRESH + 24)}px)`;
      ind.style.opacity = String(Math.min(1, pull / THRESH));
      const ring = ind.querySelector('.onyx-ptr-ring');
      if (ring) ring.style.transform = `rotate(${pull * 3}deg)`;
      ind.classList.toggle('ready', pull >= THRESH);
    }, { passive: true });

    main.addEventListener('touchend', () => {
      if (!pulling) return;
      pulling = false;
      if (dist >= THRESH && indicator) {
        indicator.classList.add('refreshing');
        indicator.style.transform = `translateX(-50%) translateY(${THRESH}px)`;
        window.haptic('success');
        setTimeout(() => {
          window.refreshCurrentPage();
          reset();
          if (window.toast) window.toast('Up to date', { type: 'success', duration: 1300 });
        }, 420);
      } else {
        reset();
      }
      dist = 0;
    }, { passive: true });

    main.addEventListener('touchcancel', () => { pulling = false; reset(); }, { passive: true });

    function reset() {
      pulling = false;
      if (!indicator) return;
      indicator.classList.remove('show', 'ready', 'refreshing');
      indicator.style.opacity = '0';
    }
  })();

  // If the install event already fired before this code ran, surface the banner.
  if (window.__canInstall) maybeShowInstallBanner();
})();


/* ══════════════════════════════════════════════════════════════════
   AGENTIC ENGINE
   The AI doesn't just talk — it acts. The model may append a fenced
   ```onyxra { "actions": [...] }``` block to its reply. We parse it,
   apply each action through STATE mutators, and confirm with chips.
   Shared by the dashboard orb chat AND Quick Capture.
════════════════════════════════════════════════════════════════ */

/** Build the full life snapshot sent to the AI for grounding. */
window.buildOnyxraSnapshot = function buildOnyxraSnapshot() {
  const S = window.STATE;
  if (!S || !S.data) return {};
  const d = S.data;
  const now = new Date();
  const z = new Date();
  const todayStr = z.getFullYear() + '-' + String(z.getMonth() + 1).padStart(2, '0') + '-' + String(z.getDate()).padStart(2, '0');
  const today = (typeof S.computeToday === 'function') ? S.computeToday() : null;
  const ns = d.nutrition || {}, ws = d.workout || {}, ds = d.dashboard || {};
  const bs = d.business || {}, ps = d.passions || {};
  const fs = d.family || { members: [] }, frs = d.friends || { members: [] }, rls = d.relationship || {};
  const last = (arr) => (arr && arr.length) ? arr[arr.length - 1].value : null;

  return {
    time: now.toLocaleString(),
    todayDate: todayStr,
    profile: { name: S.profile?.display_name || (S.user?.email || '').split('@')[0] || 'user' },
    today: today ? {
      streak: today.streak,
      mood: today.moodToday,
      ringsPct: { focus: Math.round(today.focus.frac * 100), body: Math.round(today.body.frac * 100), connect: Math.round(today.connect.frac * 100) },
      journaledToday: today.journaledToday,
    } : null,
    dashboard: {
      weeklyTopPriority: ds.weeklyTopPriority,
      todayPriorities: ds.todayPriorities,
      tasks: (ds.tasks || []).map(t => ({ text: t.text, done: t.done })),
    },
    habits: (d.habits?.items || []).map(h => ({
      name: h.name, ring: h.ring,
      doneToday: !!(h.log && h.log[todayStr]),
      streak: (typeof S.habitStreak === 'function') ? S.habitStreak(h.id) : 0,
    })),
    metrics: { weight: last(d.metrics?.weight), bodyfat: last(d.metrics?.bodyfat), networth: last(d.metrics?.networth) },
    workout: { todayDay: S.currentWorkoutDay, currentPhase: ws.currentPhase, weekNumber: ws.weekNumber, recentLogCount: (ws.log || []).length },
    nutrition: { currentPhase: ns.currentPhase, macroTargets: window.computeMacros?.(ns.calcWeight, ns.calcGoal, ns.calcActivity) },
    business: { ventureCount: (bs.ventures || []).length, activeVenture: bs.ventures?.find(v => v.id === bs.activeVentureId)?.name || null },
    interests: { count: (ps.passions || []).length, active: ps.passions?.find(p => p.id === ps.activePassionId)?.name || null },
    family: { members: (fs.members || []).map(m => ({ name: m.name, role: m.role, latestUpdate: m.updates?.[0]?.text || null })) },
    friends: { members: (frs.members || []).map(m => ({ name: m.name, role: m.role, latestUpdate: m.updates?.[0]?.text || null })) },
    relationship: { name: rls.name || null, latestUpdate: rls.updates?.[0]?.text || null, openGiftIdeas: (rls.giftIdeas || []).filter(g => !g.given).length, upcomingDates: (rls.dates || []).slice(0, 3) },
    recentJournal: (d.journal?.entries || []).slice(0, 3).map(e => ({ day: e.day, mood: e.mood, text: (e.text || '').slice(0, 160) })),
  };
};

/** Extract { clean, actions } from a model reply containing an onyxra block. */
window.parseOnyxraActions = function parseOnyxraActions(text) {
  if (!text) return { clean: text || '', actions: [] };
  let actions = [];
  let clean = text;
  const fence = /```(?:onyxra|json)?\s*(\{[\s\S]*?"actions"[\s\S]*?\})\s*```/i;
  let m = text.match(fence);
  if (!m) {
    const bare = /(\{[\s\S]*?"actions"\s*:\s*\[[\s\S]*?\][\s\S]*?\})/;
    m = text.match(bare);
  }
  if (m) {
    try {
      const obj = JSON.parse(m[1]);
      if (Array.isArray(obj.actions)) actions = obj.actions;
      clean = text.replace(m[0], '').trim();
    } catch (e) { /* malformed — leave reply intact */ }
  }
  clean = clean.replace(/```(?:onyxra|json)?\s*```/gi, '').replace(/\n{3,}/g, '\n\n').trim();
  return { clean, actions };
};

function _onyxMapPage(p) {
  if (!p) return null;
  p = String(p).toLowerCase().trim();
  const all = (typeof VALID_PAGES !== 'undefined') ? VALID_PAGES : ['dashboard'];
  if (all.includes(p)) return p;
  const map = {
    health: 'workout', body: 'workout', gym: 'workout', fitness: 'workout', exercise: 'workout',
    food: 'nutrition', diet: 'nutrition', meals: 'nutrition', macros: 'nutrition',
    money: 'wealth', investing: 'wealth', invest: 'wealth', finance: 'wealth', investments: 'wealth',
    people: 'relationship', partner: 'relationship', love: 'relationship',
    interests: 'passions', hobbies: 'passions', interest: 'passions',
    home: 'dashboard', ai: 'dashboard', chat: 'dashboard',
  };
  return (map[p] && all.includes(map[p])) ? map[p] : null;
}

/** Apply parsed actions to STATE. Returns chips [{icon,label}] for confirmation. */
window.applyOnyxraActions = function applyOnyxraActions(actions) {
  if (!Array.isArray(actions) || !actions.length || !window.STATE) return [];
  const S = window.STATE;
  const out = [];
  const norm = (s) => String(s == null ? '' : s).trim().toLowerCase();
  const findHabit = (name) => (S.data.habits?.items || []).find(h => norm(h.name) === norm(name))
                          || (S.data.habits?.items || []).find(h => norm(h.name).includes(norm(name)) && norm(name));
  const findPerson = (list, name) => (list || []).find(m => norm(m.name) === norm(name))
                                 || (list || []).find(m => norm(name) && norm(m.name).includes(norm(name)));
  let nav = null;

  for (const a of actions) {
    try {
      const type = a.type || a.action;
      switch (type) {
        case 'add_task':
          if (a.text) { S.addTask(a.text); out.push({ icon: '✅', label: a.text }); }
          break;
        case 'complete_task': {
          const t = (S.data.dashboard.tasks || []).find(t => !t.done && norm(t.text).includes(norm(a.text)));
          if (t) { S.toggleTask(t.id); out.push({ icon: '✔', label: 'Done: ' + t.text }); }
          break;
        }
        case 'set_priority':
          if (a.text) { S.setWeeklyPriority(a.text); out.push({ icon: '⭐', label: 'Priority: ' + a.text }); }
          break;
        case 'add_today_priority':
          if (a.text) {
            const arr = (S.data.dashboard.todayPriorities || ['', '', '']).slice(0, 3);
            const i = arr.findIndex(x => !x);
            if (i >= 0) arr[i] = a.text; else arr[2] = a.text;
            S.setTodayPriorities(arr[0], arr[1], arr[2]);
            out.push({ icon: '🎯', label: 'Today: ' + a.text });
          }
          break;
        case 'log_weight':
          if (a.value != null) { S.logMetric('weight', a.value); out.push({ icon: '⚖️', label: 'Weight ' + a.value }); }
          break;
        case 'log_bodyfat':
          if (a.value != null) { S.logMetric('bodyfat', a.value); out.push({ icon: '📉', label: 'Body fat ' + a.value + '%' }); }
          break;
        case 'log_networth':
          if (a.value != null) { S.logMetric('networth', a.value); out.push({ icon: '💰', label: 'Net worth logged' }); }
          break;
        case 'add_journal':
          if (a.text || a.mood != null) { S.addJournalEntry({ text: a.text || '', mood: a.mood }); out.push({ icon: '📓', label: 'Journal saved' }); }
          break;
        case 'set_mood':
          if (a.value != null) { S.setTodayMood(a.value); out.push({ icon: '🧠', label: 'Mood logged' }); }
          break;
        case 'add_habit':
          if (a.name) { S.addHabit(a.name, a.icon, a.color, a.ring); out.push({ icon: '🔁', label: 'Habit: ' + a.name }); }
          break;
        case 'tick_habit': {
          const h = findHabit(a.name);
          if (h) { S.tickHabit(h.id, null, true); out.push({ icon: '🔥', label: h.name + ' ✓' }); }
          break;
        }
        case 'log_workout':
          S.addLogbookEntry({ title: a.title || 'Workout', exercises: [], notes: a.notes || '' });
          out.push({ icon: '🏋️', label: 'Workout logged' });
          break;
        case 'add_gift_idea':
          if (a.text) { S.addGiftIdea(a.text); out.push({ icon: '🎁', label: 'Gift idea: ' + a.text }); }
          break;
        case 'add_relationship_update':
          if (a.text) { S.addRelationshipUpdate(a.text); out.push({ icon: '💕', label: 'Relationship note' }); }
          break;
        case 'add_family_update': {
          const m = findPerson(S.data.family?.members, a.name);
          if (m && a.text) { S.addFamilyUpdate(m.id, a.text); out.push({ icon: '❤︎', label: m.name + ': noted' }); }
          break;
        }
        case 'add_friend_update': {
          const m = findPerson(S.data.friends?.members, a.name);
          if (m && a.text) { S.addFriendUpdate(m.id, a.text); out.push({ icon: '🧑', label: m.name + ': noted' }); }
          break;
        }
        case 'navigate': {
          const pg = _onyxMapPage(a.page);
          if (pg) { nav = pg; out.push({ icon: '➡', label: 'Open ' + (PAGE_NAMES[pg] || pg) }); }
          break;
        }
        default: break;
      }
    } catch (e) { /* skip a single bad action, keep the rest */ }
  }

  if (out.length) {
    if (window.haptic) window.haptic('success');
    window.dispatchEvent(new CustomEvent('onyxra:state-changed', { detail: { actions } }));
  }
  if (nav && typeof navigateTo === 'function') setTimeout(() => navigateTo(nav), 350);
  return out;
};


/* ══════════════════════════════════════════════════════════════════
   QUICK CAPTURE — the everywhere command palette
   FAB (mobile) + ⌘K / Ctrl+K (desktop) → a native bottom sheet to
   capture anything by text or voice. AI-routed via the agentic engine,
   plus instant offline local quick-actions.
════════════════════════════════════════════════════════════════ */
(function quickCapture() {
  let sheetEl = null, inputEl = null, busy = false, recog = null, listening = false;

  function ensureUI() {
    if (sheetEl) return;

    // Floating action button
    const fab = document.createElement('button');
    fab.id = 'onyxFab';
    fab.className = 'onyx-fab';
    fab.type = 'button';
    fab.setAttribute('aria-label', 'Quick capture');
    fab.innerHTML = '<span class="onyx-fab-plus">+</span>';
    fab.addEventListener('click', () => { window.haptic('tap'); openCapture(); });
    document.body.appendChild(fab);

    // Bottom sheet
    sheetEl = document.createElement('div');
    sheetEl.id = 'onyxSheet';
    sheetEl.className = 'onyx-sheet-overlay';
    sheetEl.innerHTML = `
      <div class="onyx-sheet" role="dialog" aria-label="Quick capture">
        <div class="onyx-sheet-handle"></div>
        <div class="onyx-sheet-head">
          <span class="onyx-sheet-spark">✦</span>
          <span class="onyx-sheet-title">Capture anything</span>
          <button class="onyx-sheet-x" type="button" aria-label="Close">✕</button>
        </div>
        <div class="onyx-sheet-inputwrap">
          <textarea id="onyxCaptureInput" class="onyx-sheet-input" rows="2"
            placeholder="Log a task, weight, mood, a note about someone… or just ask."></textarea>
          <button id="onyxCaptureMic" class="onyx-sheet-mic" type="button" aria-label="Speak">🎤</button>
        </div>
        <div class="onyx-sheet-quick" id="onyxCaptureQuick">
          <button class="onyx-qa" data-qa="task">✅ Task</button>
          <button class="onyx-qa" data-qa="journal">📓 Journal</button>
          <button class="onyx-qa" data-qa="weight">⚖️ Weight</button>
          <button class="onyx-qa" data-qa="priority">⭐ Priority</button>
          <button class="onyx-qa" data-qa="mood">🧠 Mood</button>
        </div>
        <div class="onyx-sheet-result" id="onyxCaptureResult"></div>
        <button class="onyx-sheet-send" id="onyxCaptureSend" type="button">
          <span class="onyx-sheet-send-spark">✦</span> Ask Onyxra
        </button>
        <div class="onyx-sheet-hint">Onyxra figures out what to do — or use a quick button above.</div>
      </div>`;
    document.body.appendChild(sheetEl);

    inputEl = sheetEl.querySelector('#onyxCaptureInput');
    sheetEl.querySelector('.onyx-sheet-x').addEventListener('click', closeCapture);
    sheetEl.addEventListener('click', (e) => { if (e.target === sheetEl) closeCapture(); });
    sheetEl.querySelector('#onyxCaptureSend').addEventListener('click', sendToAI);
    sheetEl.querySelectorAll('.onyx-qa').forEach(b => b.addEventListener('click', () => localAction(b.dataset.qa)));

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); sendToAI(); }
    });

    // Mic (voice → input)
    const micBtn = sheetEl.querySelector('#onyxCaptureMic');
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { micBtn.style.display = 'none'; }
    else {
      micBtn.addEventListener('click', () => {
        if (listening) { try { recog && recog.stop(); } catch (e) {} return; }
        try {
          recog = new SR(); recog.lang = 'en-US'; recog.interimResults = true; recog.continuous = false;
          listening = true; micBtn.classList.add('listening'); window.haptic('tap');
          recog.onresult = (e) => {
            let txt = '';
            for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
            inputEl.value = txt;
            if (e.results[e.results.length - 1].isFinal) { listening = false; micBtn.classList.remove('listening'); }
          };
          recog.onerror = () => { listening = false; micBtn.classList.remove('listening'); };
          recog.onend = () => { listening = false; micBtn.classList.remove('listening'); };
          recog.start();
        } catch (e) { listening = false; micBtn.classList.remove('listening'); }
      });
    }
  }

  function openCapture(prefill) {
    ensureUI();
    document.body.classList.add('onyx-sheet-open');
    sheetEl.classList.add('open');
    const result = sheetEl.querySelector('#onyxCaptureResult');
    if (result) { result.innerHTML = ''; result.classList.remove('show'); }
    if (prefill) inputEl.value = prefill;
    setTimeout(() => inputEl && inputEl.focus(), 120);
  }
  function closeCapture() {
    if (!sheetEl) return;
    sheetEl.classList.remove('open');
    document.body.classList.remove('onyx-sheet-open');
    try { recog && recog.stop(); } catch (e) {}
  }

  function showChips(chips, leadText) {
    const result = sheetEl.querySelector('#onyxCaptureResult');
    if (!result) return;
    const lead = leadText ? `<div class="onyx-cap-lead">${escapeHtmlLocal(leadText)}</div>` : '';
    const chipHtml = (chips || []).map(c => `<span class="onyx-cap-chip">${c.icon || '✓'} ${escapeHtmlLocal(c.label)}</span>`).join('');
    result.innerHTML = lead + (chipHtml ? `<div class="onyx-cap-chips">${chipHtml}</div>` : '');
    result.classList.add('show');
  }

  function escapeHtmlLocal(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* Instant, offline, no-AI quick actions */
  function localAction(kind) {
    const text = (inputEl.value || '').trim();
    const S = window.STATE;
    if (!S) return;
    window.haptic('tap');
    if (kind === 'weight') {
      const num = parseFloat((text.match(/[\d.]+/) || [])[0]);
      if (!isFinite(num)) { window.toast('Type your weight first (e.g. 182)', { type: 'warn' }); return; }
      S.logMetric('weight', num); finishLocal([{ icon: '⚖️', label: 'Weight ' + num }]);
    } else if (kind === 'task') {
      if (!text) { window.toast('Type the task first', { type: 'warn' }); return; }
      S.addTask(text); finishLocal([{ icon: '✅', label: text }]);
    } else if (kind === 'journal') {
      if (!text) { window.toast('Write something to journal', { type: 'warn' }); return; }
      S.addJournalEntry({ text }); finishLocal([{ icon: '📓', label: 'Journal saved' }]);
    } else if (kind === 'priority') {
      if (!text) { window.toast('Type your priority first', { type: 'warn' }); return; }
      S.setWeeklyPriority(text); finishLocal([{ icon: '⭐', label: text }]);
    } else if (kind === 'mood') {
      openMoodPicker();
    }
  }

  function openMoodPicker() {
    const result = sheetEl.querySelector('#onyxCaptureResult');
    const MOODS = [[1, '😞'], [2, '😕'], [3, '😐'], [4, '🙂'], [5, '🤩']];
    result.innerHTML = `<div class="onyx-cap-lead">How are you feeling?</div>
      <div class="onyx-mood-row">${MOODS.map(m => `<button class="onyx-mood-btn" data-mood="${m[0]}">${m[1]}</button>`).join('')}</div>`;
    result.classList.add('show');
    result.querySelectorAll('.onyx-mood-btn').forEach(b => b.addEventListener('click', () => {
      window.STATE.setTodayMood(Number(b.dataset.mood));
      window.haptic('success');
      finishLocal([{ icon: '🧠', label: 'Mood logged' }]);
    }));
  }

  function finishLocal(chips) {
    window.dispatchEvent(new CustomEvent('onyxra:state-changed', { detail: { local: true } }));
    showChips(chips, 'Done.');
    inputEl.value = '';
    window.toast((chips[0] && chips[0].label) ? chips[0].label : 'Saved', { type: 'success', duration: 1600 });
    setTimeout(closeCapture, 700);
  }

  /* Route through the AI agentic endpoint */
  async function sendToAI() {
    const text = (inputEl.value || '').trim();
    if (!text || busy) return;
    busy = true;
    const sendBtn = sheetEl.querySelector('#onyxCaptureSend');
    const result = sheetEl.querySelector('#onyxCaptureResult');
    sendBtn.classList.add('loading');
    sendBtn.disabled = true;
    result.classList.add('show');
    result.innerHTML = '<div class="onyx-cap-thinking"><span></span><span></span><span></span></div>';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
          snapshot: window.buildOnyxraSnapshot ? window.buildOnyxraSnapshot() : {},
          capture: true,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        result.innerHTML = `<div class="onyx-cap-lead onyx-cap-err">⚠️ ${escapeHtmlLocal(err.error || 'AI unavailable.')}</div>`;
      } else {
        const data = await res.json();
        const parsed = window.parseOnyxraActions(data.reply || '');
        const chips = window.applyOnyxraActions(parsed.actions);
        if (chips.length) {
          showChips(chips, parsed.clean || 'Done.');
          inputEl.value = '';
          window.toast(chips.length + (chips.length === 1 ? ' thing captured' : ' things captured'), { type: 'success', duration: 1800 });
          setTimeout(closeCapture, 1400);
        } else {
          // No actions — just an answer. Show it.
          showChips([], parsed.clean || data.reply || 'Done.');
        }
      }
    } catch (e) {
      result.innerHTML = `<div class="onyx-cap-lead onyx-cap-err">⚠️ ${escapeHtmlLocal(e.message)}</div>`;
    } finally {
      busy = false;
      sendBtn.classList.remove('loading');
      sendBtn.disabled = false;
    }
  }

  // Keyboard: ⌘K / Ctrl+K toggles capture anywhere
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (sheetEl && sheetEl.classList.contains('open')) closeCapture();
      else openCapture();
    }
    if (e.key === 'Escape' && sheetEl && sheetEl.classList.contains('open')) closeCapture();
  });

  // Hide the FAB on the dashboard (the orb already is the capture surface there).
  function updateFabVisibility() {
    const fab = document.getElementById('onyxFab');
    if (!fab) return;
    const page = (typeof getCurrentPage === 'function') ? getCurrentPage() : 'dashboard';
    fab.classList.toggle('hidden', page === 'dashboard');
  }
  window.addEventListener('hashchange', updateFabVisibility);
  window.addEventListener('onyxra:navigate', updateFabVisibility);

  // Expose + initial paint
  window.openCapture = openCapture;
  ensureUI();
  updateFabVisibility();
})();


/* ══════════════════════════════════════════════════════════════════
   CELEBRATION — confetti + achievement watcher
   When a milestone is newly earned (streaks, journaling, habits, …),
   we toast it and fire a confetti burst. seenBadges (seeded silently on
   first load) guarantees existing progress never spam-celebrates.
════════════════════════════════════════════════════════════════ */
window.onyxConfetti = function (opts) {
  opts = opts || {};
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  const count = opts.count || 110;
  const canvas = document.createElement('canvas');
  canvas.className = 'onyx-confetti';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = () => window.innerWidth, h = () => window.innerHeight;
  function size() { canvas.width = w() * dpr; canvas.height = h() * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  size();
  const colors = ['#4fc3f7', '#7c6af7', '#f06292', '#3ddc6e', '#f5c842', '#ff6b35'];
  const ox = (opts.x != null) ? opts.x : w() / 2;
  const oy = (opts.y != null) ? opts.y : h() * 0.32;
  const parts = Array.from({ length: count }, (_, i) => ({
    x: ox, y: oy,
    vx: Math.cos((i / count) * 6.283) * (2 + (i % 6)) + (i % 2 ? 1.5 : -1.5),
    vy: -(5 + (i % 8)),
    g: 0.18 + (i % 3) * 0.03,
    r: 3 + (i % 4),
    rot: (i * 37) % 360, vr: (i % 2 ? 7 : -7),
    color: colors[i % colors.length],
    life: 0, max: 95 + (i % 45),
  }));
  let raf, frame = 0;
  function tick() {
    frame++;
    ctx.clearRect(0, 0, w(), h());
    let alive = false;
    for (const p of parts) {
      p.life++; if (p.life > p.max) continue;
      alive = true;
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      const a = Math.max(0, 1 - p.life / p.max);
      ctx.save(); ctx.globalAlpha = a; ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color; ctx.fillRect(-p.r, -p.r * 0.6, p.r * 2, p.r * 1.2); ctx.restore();
    }
    if (alive && frame < 220) raf = requestAnimationFrame(tick);
    else { cancelAnimationFrame(raf); canvas.remove(); }
  }
  raf = requestAnimationFrame(tick);
};

(function achievementWatch() {
  let pending = false;
  function celebrate() {
    if (!window.STATE || typeof window.STATE.checkNewAchievements !== 'function') return;
    const fresh = window.STATE.checkNewAchievements();
    fresh.forEach((b, i) => setTimeout(() => {
      if (window.toast) window.toast('Achievement unlocked — ' + b.name + '!', { type: 'success', icon: b.icon, duration: 4200 });
      if (window.haptic) window.haptic('success');
      if (window.onyxConfetti) window.onyxConfetti();
    }, i * 950));
  }
  window.addEventListener('onyxra:state-changed', () => {
    if (pending) return;
    pending = true;
    setTimeout(() => { pending = false; celebrate(); }, 140);
  });
})();
