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
const VALID_PAGES = ['dashboard', 'nutrition', 'workout', 'business', 'wealth', 'passions', 'settings'];

const PAGE_NAMES = {
  dashboard: 'Dashboard',
  nutrition: 'Nutrition',
  workout:   'Workout',
  business:  'Business',
  wealth:    'Wealth',
  passions:  'Passions',
  settings:  'Settings',
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
  const drawerItem = document.querySelector(`.drawer-nav-item[data-page="${page}"]`);
  if (drawerItem) drawerItem.classList.add('active');

  /* Update URL hash (no page reload) */
  history.replaceState(null, '', '#' + page);

  /* Lazy-init: run the page module's init function on first visit */
  if (PAGE_REGISTRY[page] && !INITIALISED[page]) {
    PAGE_REGISTRY[page]();
    INITIALISED[page] = true;
  }
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
