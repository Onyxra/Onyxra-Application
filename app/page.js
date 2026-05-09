'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function Home() {

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(reg => console.log('[SW] Registered, scope:', reg.scope))
        .catch(err => console.warn('[SW] Registration failed:', err));
    }
  }, []);

  return (
    <>
      {/* ══ MOBILE TOP BAR ══ */}
      <div className="mobile-topbar" id="mobileTopbar">
        <button className="topbar-btn" id="hamburgerBtn" aria-label="Open menu">
          <div className="hamburger-lines">
            <span></span><span></span><span></span>
          </div>
        </button>
        <div className="topbar-wordmark">
          <span id="topbarPageName" className="topbar-page-name">Dashboard</span>
        </div>
        <button className="topbar-btn topbar-notif-btn" id="notifBtn" aria-label="Notifications">
          <span className="topbar-notif-icon">🔔</span>
          <span className="notif-badge" id="notifBadge">2</span>
        </button>
      </div>

      {/* ══ PROFILE DRAWER ══ */}
      <div className="drawer-backdrop" id="drawerBackdrop"></div>
      <div className="profile-drawer" id="profileDrawer">
        <div className="drawer-profile-header">
          <div className="drawer-avatar">KO</div>
          <div className="drawer-profile-info">
            <div className="drawer-profile-name">Koltyn</div>
            <div className="drawer-profile-sub">Life Operating System</div>
          </div>
          <button className="drawer-close-btn" id="drawerClose" aria-label="Close">✕</button>
        </div>
        <div className="drawer-north-star">
          <div className="drawer-ns-label">North Star</div>
          <div className="drawer-ns-text">$50K MRR · 200 lbs · 15% BF</div>
        </div>
        <div className="drawer-divider"></div>
        <div className="drawer-nav">
          <a className="drawer-nav-item" data-page="dashboard" href="#dashboard">
            <span className="drawer-nav-icon">⬡</span><span>Dashboard</span>
          </a>
          <a className="drawer-nav-item" data-page="nutrition" href="#nutrition">
            <span className="drawer-nav-icon">◈</span><span>Nutrition</span>
          </a>
          <a className="drawer-nav-item" data-page="workout" href="#workout">
            <span className="drawer-nav-icon">◉</span><span>Workout</span>
          </a>
          <a className="drawer-nav-item" data-page="business" href="#business">
            <span className="drawer-nav-icon">◧</span><span>Business</span>
          </a>
          <a className="drawer-nav-item" data-page="wealth" href="#wealth">
            <span className="drawer-nav-icon">◈</span><span>Wealth</span>
          </a>
          <a className="drawer-nav-item" data-page="passions" href="#passions">
            <span className="drawer-nav-icon">✦</span><span>Passions</span>
          </a>
        </div>
        <div className="drawer-divider"></div>
        <div className="drawer-nav">
          <a className="drawer-nav-item" data-page="settings" href="#settings">
            <span className="drawer-nav-icon">⚙</span><span>Settings</span>
          </a>
        </div>
      </div>

      {/* ══ NOTIFICATIONS PANEL ══ */}
      <div className="notif-panel" id="notifPanel">
        <div className="notif-panel-header">
          <span className="notif-panel-title">Notifications</span>
          <button className="notif-mark-read" id="notifMarkRead">Mark all read</button>
        </div>
        <div className="notif-list" id="notifList"></div>
      </div>

      {/* ══ SIDEBAR NAV ══ */}
      <nav className="sidebar" id="sidebar">
        <div className="nav-brand">
          <svg className="nav-logo-mark" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" width="34" height="34" aria-hidden="true">
            <defs>
              <linearGradient id="navLogoGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4fc3f7"/>
                <stop offset="100%" stopColor="#7c6af7"/>
              </linearGradient>
            </defs>
            <rect width="36" height="36" rx="9" fill="url(#navLogoGrad)"/>
            <line x1="11" y1="9" x2="11" y2="27" stroke="#fff" strokeWidth="2.8" strokeLinecap="round"/>
            <line x1="11" y1="18" x2="25" y2="9" stroke="#fff" strokeWidth="2.8" strokeLinecap="round"/>
            <line x1="11" y1="18" x2="26" y2="27" stroke="#fff" strokeWidth="2.8" strokeLinecap="round"/>
            <circle cx="30" cy="29" r="2.2" fill="#fff" opacity="0.5"/>
          </svg>
          <div className="nav-brand-text">
            <div className="nav-brand-name">Koltyn OS</div>
            <div className="nav-brand-sub">Life Operating System</div>
          </div>
        </div>

        <div className="nav-links">
          <a className="nav-item" data-page="dashboard" href="#dashboard">
            <span className="nav-icon">⬡</span>
            <span className="nav-label">Dashboard</span>
          </a>
          <div className="nav-divider"></div>
          <a className="nav-item" data-page="nutrition" href="#nutrition">
            <span className="nav-icon">◈</span>
            <span className="nav-label">Nutrition</span>
          </a>
          <a className="nav-item" data-page="workout" href="#workout">
            <span className="nav-icon">◉</span>
            <span className="nav-label">Workout</span>
          </a>
          <div className="nav-divider"></div>
          <a className="nav-item" data-page="business" href="#business">
            <span className="nav-icon">◧</span>
            <span className="nav-label">Business</span>
          </a>
          <a className="nav-item" data-page="wealth" href="#wealth">
            <span className="nav-icon">◈</span>
            <span className="nav-label">Wealth</span>
          </a>
          <div className="nav-divider"></div>
          <a className="nav-item" data-page="passions" href="#passions">
            <span className="nav-icon">✦</span>
            <span className="nav-label">Passions</span>
          </a>
          <div className="nav-divider nav-settings-divider"></div>
          <a className="nav-item nav-settings-item" data-page="settings" href="#settings">
            <span className="nav-icon">⚙</span>
            <span className="nav-label">Settings</span>
          </a>
        </div>

        <div className="nav-profile">
          <div className="nav-profile-avatar">KO</div>
          <div className="nav-profile-info">
            <div className="nav-profile-name">Koltyn</div>
            <div className="nav-profile-goal">$50K · 200 lbs · 15% BF</div>
          </div>
        </div>
      </nav>

      {/* ══ MAIN CONTENT ══ */}
      <main className="main-content" id="mainContent">

        {/* Dashboard */}
        <section className="page" id="page-dashboard" data-accent="dashboard">
          <div className="page-inner" id="dashboard-inner"></div>
        </section>

        {/* Nutrition */}
        <section className="page" id="page-nutrition" data-accent="nutrition">
          {/* Recipe modal */}
          <div className="modal-overlay" id="modalOverlay">
            <div className="modal">
              <div className="modal-drag-handle"></div>
              <div className="modal-header">
                <div className="modal-header-info">
                  <div className="modal-eyebrow" id="modalEyebrow"></div>
                  <div className="modal-title" id="modalTitle"></div>
                  <div className="modal-tags">
                    <span className="category-badge" id="modalCatBadge"></span>
                    <span className="cuisine-tag" id="modalCuisineTag"></span>
                  </div>
                  <div className="modal-macros">
                    <span className="modal-macro-chip mmc-cal" id="mCalChip"></span>
                    <span className="modal-macro-chip mmc-p" id="mProChip"></span>
                    <span className="modal-macro-chip mmc-c" id="mCarbChip"></span>
                    <span className="modal-macro-chip mmc-f" id="mFatChip"></span>
                  </div>
                </div>
                <button className="modal-close" id="modalClose" aria-label="Close">✕</button>
              </div>
              <div className="modal-body" id="modalBody">
                <div className="modal-loading">
                  <div className="spinner"></div>
                  <div className="loading-text">Fetching Recipe</div>
                  <div className="loading-sub">Ingredients, directions &amp; cultural history…</div>
                </div>
              </div>
            </div>
          </div>

          {/* Add Custom Meal modal */}
          <div className="ex-modal-overlay" id="addMealOverlay">
            <div className="ex-modal">
              <div className="modal-drag-handle"></div>
              <div className="ex-modal-header">
                <div className="ex-modal-info">
                  <div className="ex-modal-eyebrow" id="addMealEyebrow"></div>
                  <div className="ex-modal-title">Log Custom Meal</div>
                </div>
                <button className="modal-close" id="addMealClose">✕</button>
              </div>
              <div className="ex-modal-body" id="addMealBody"></div>
            </div>
          </div>

          {/* Add Custom Food modal */}
          <div id="addFoodOverlay" className="ex-modal-overlay" style={{ display: 'none' }}>
            <div className="ex-modal" style={{ maxWidth: '480px' }}>
              <div className="ex-modal-header">
                <span className="ex-modal-title">Add Food to Library</span>
                <button id="addFoodClose" className="modal-close">×</button>
              </div>
              <div className="ex-modal-body">
                <form id="addFoodForm">
                  <div style={{ marginBottom: '10px' }}>
                    <label className="form-label">Food Name</label>
                    <input id="afName" type="text" className="form-input" placeholder="e.g. Chicken Breast" required />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label className="form-label">Brand (optional)</label>
                    <input id="afBrand" type="text" className="form-input" placeholder="e.g. Quest" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label className="form-label">Category</label>
                      <select id="afCategory" className="form-input" defaultValue="Proteins">
                        <option>Proteins</option><option>Vegetables</option><option>Fruits</option>
                        <option>Grains &amp; Breads</option><option>Dairy</option>
                        <option>Fats &amp; Oils</option><option>Condiments</option>
                        <option>Snacks</option><option>Beverages</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Type</label>
                      <select id="afType" className="form-input" defaultValue="whole">
                        <option value="whole">Whole Food</option>
                        <option value="brand">Brand / Prepared</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label className="form-label">Serving Size</label>
                      <input id="afServingSize" type="number" className="form-input" placeholder="100" min="0" step="any" required />
                    </div>
                    <div>
                      <label className="form-label">Unit</label>
                      <select id="afServingUnit" className="form-input" defaultValue="g">
                        <option value="g">g</option><option value="oz">oz</option>
                        <option value="ml">ml</option><option value="cup">cup</option>
                        <option value="piece">piece</option><option value="tbsp">tbsp</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div><label className="form-label">Calories</label><input id="afCalories" type="number" className="form-input" placeholder="0" min="0" /></div>
                    <div><label className="form-label">Protein (g)</label><input id="afProtein" type="number" className="form-input" placeholder="0" min="0" step="any" /></div>
                    <div><label className="form-label">Carbs (g)</label><input id="afCarbs" type="number" className="form-input" placeholder="0" min="0" step="any" /></div>
                    <div><label className="form-label">Fats (g)</label><input id="afFats" type="number" className="form-input" placeholder="0" min="0" step="any" /></div>
                    <div><label className="form-label">Fiber (g)</label><input id="afFiber" type="number" className="form-input" placeholder="0" min="0" step="any" /></div>
                  </div>
                  <button type="submit" className="phase-btn active" style={{ width: '100%', padding: '11px', fontSize: '14px', marginTop: '4px' }}>Save to Library</button>
                </form>
              </div>
            </div>
          </div>

          <div className="page-inner" id="nutrition-inner"></div>
        </section>

        {/* Workout */}
        <section className="page" id="page-workout" data-accent="workout">
          <div className="ex-modal-overlay" id="exModalOverlay">
            <div className="ex-modal">
              <div className="modal-drag-handle"></div>
              <div className="ex-modal-header">
                <div className="ex-modal-info">
                  <div className="ex-modal-eyebrow" id="exModalEyebrow"></div>
                  <div className="ex-modal-title" id="exModalTitle"></div>
                  <div className="ex-modal-chips" id="exModalChips"></div>
                </div>
                <button className="modal-close" id="exModalClose">✕</button>
              </div>
              <div className="ex-modal-body" id="exModalBody"></div>
            </div>
          </div>
          <div className="page-inner" id="workout-inner"></div>
        </section>

        {/* Business */}
        <section className="page" id="page-business" data-accent="business">
          <div className="page-inner" id="business-inner"></div>
        </section>

        {/* Wealth */}
        <section className="page" id="page-wealth" data-accent="wealth">
          <div className="page-inner" id="wealth-inner"></div>
        </section>

        {/* Passions */}
        <section className="page" id="page-passions" data-accent="creative">
          <div className="page-inner" id="passions-inner"></div>
        </section>

        {/* Settings */}
        <section className="page" id="page-settings" data-accent="dashboard">
          <div className="page-inner" id="settings-inner"></div>
        </section>

      </main>

      {/* ══ SCRIPTS — loaded in order ══ */}
      <Script src="/js/data.js" strategy="beforeInteractive" />
      <Script src="/js/state.js" strategy="beforeInteractive" />
      <Script src="/js/app.js" strategy="beforeInteractive" />
      <Script src="/js/pages/dashboard.js" strategy="beforeInteractive" />
      <Script src="/js/pages/nutrition.js" strategy="beforeInteractive" />
      <Script src="/js/pages/workout.js" strategy="beforeInteractive" />
      <Script src="/js/pages/business.js" strategy="beforeInteractive" />
      <Script src="/js/pages/wealth.js" strategy="beforeInteractive" />
      <Script src="/js/pages/passions.js" strategy="beforeInteractive" />
      <Script src="/js/pages/settings.js" strategy="beforeInteractive" />
    </>
  );
}
