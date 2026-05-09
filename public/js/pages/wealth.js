/**
 * KOLTYN OS — wealth/page.js
 * Full net worth tracker: cash, stocks, crypto, retirement, real estate,
 * vehicles, collectibles, business equity, and liabilities.
 * All values stored in localStorage and editable on click.
 */

window.registerPage('wealth', function initWealth() {

  const STORAGE_KEY = 'koltyn_wealth_v1';

  /* ── Category definitions ── */
  const CATEGORIES = [
    {
      id: 'cash', label: 'Cash & Liquid', icon: '💵', color: '#3ddc6e', isLiability: false,
      items: [
        { id: 'checking',     label: 'Checking Account' },
        { id: 'savings',      label: 'Savings Account' },
        { id: 'emergency',    label: 'Emergency Fund' },
        { id: 'hysa',         label: 'High-Yield Savings (HYSA)' },
        { id: 'money_market', label: 'Money Market' },
      ]
    },
    {
      id: 'stocks', label: 'Stock Investments', icon: '📈', color: '#4fc3f7', isLiability: false,
      items: [
        { id: 'voo',        label: 'VOO — S&P 500 ETF' },
        { id: 'vti',        label: 'VTI — Total Market ETF' },
        { id: 'vxus',       label: 'VXUS — International ETF' },
        { id: 'individual', label: 'Individual Stocks' },
        { id: 'other_etf',  label: 'Other ETFs / Funds' },
      ]
    },
    {
      id: 'crypto', label: 'Cryptocurrency', icon: '💎', color: '#f5a623', isLiability: false,
      items: [
        { id: 'btc',  label: 'Bitcoin (BTC)' },
        { id: 'eth',  label: 'Ethereum (ETH)' },
        { id: 'sol',  label: 'Solana (SOL)' },
        { id: 'alts', label: 'Altcoins / Other' },
      ]
    },
    {
      id: 'retirement', label: 'Retirement Accounts', icon: '🛡️', color: '#7c6af7', isLiability: false,
      items: [
        { id: '401k',     label: '401(k)' },
        { id: 'roth_ira', label: 'Roth IRA' },
        { id: 'trad_ira', label: 'Traditional IRA' },
        { id: 'hsa',      label: 'HSA (Health Savings)' },
      ]
    },
    {
      id: 'real_estate', label: 'Real Estate', icon: '🏠', color: '#26c6da', isLiability: false,
      items: [
        { id: 'primary_home', label: 'Primary Home' },
        { id: 'rental_1',     label: 'Rental Property 1' },
        { id: 'rental_2',     label: 'Rental Property 2' },
        { id: 'land',         label: 'Land / Lots' },
      ]
    },
    {
      id: 'vehicles', label: 'Vehicles', icon: '🚗', color: '#ff6b35', isLiability: false,
      items: [
        { id: 'car1',       label: 'Primary Vehicle' },
        { id: 'car2',       label: 'Secondary Vehicle' },
        { id: 'motorcycle', label: 'Motorcycle' },
        { id: 'other_veh',  label: 'Other (Boat, ATV, etc.)' },
      ]
    },
    {
      id: 'valuables', label: 'Collectibles & Valuables', icon: '🏆', color: '#f06292', isLiability: false,
      items: [
        { id: 'precious_metals', label: 'Gold & Silver' },
        { id: 'jewelry',         label: 'Jewelry & Watches' },
        { id: 'collectibles',    label: 'Collectibles & Trading Cards' },
        { id: 'instruments',     label: 'Musical Instruments' },
        { id: 'art',             label: 'Art & Memorabilia' },
        { id: 'electronics',     label: 'Electronics & Tech' },
      ]
    },
    {
      id: 'business', label: 'Business Equity', icon: '🏗️', color: '#f5c842', isLiability: false,
      items: [
        { id: 'envosta',   label: 'Envosta (estimated valuation)' },
        { id: 'other_biz', label: 'Other Business Assets' },
      ]
    },
    {
      id: 'liabilities', label: 'Liabilities / Debt', icon: '💳', color: '#ef5350', isLiability: true,
      items: [
        { id: 'credit_cards',   label: 'Credit Cards' },
        { id: 'student_loans',  label: 'Student Loans' },
        { id: 'car_loan',       label: 'Car Loan(s)' },
        { id: 'mortgage',       label: 'Mortgage' },
        { id: 'personal_loan',  label: 'Personal Loans' },
        { id: 'other_debt',     label: 'Other Debt' },
      ]
    },
  ];

  /* ── Storage helpers ── */
  function loadData() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
  }

  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getValue(data, catId, itemId) {
    return (data[catId] && data[catId][itemId]) || 0;
  }

  function getCategoryTotal(data, cat) {
    return cat.items.reduce((sum, item) => sum + getValue(data, cat.id, item.id), 0);
  }

  function calcNetWorth(data) {
    let assets = 0, liabilities = 0;
    CATEGORIES.forEach(cat => {
      const total = getCategoryTotal(data, cat);
      if (cat.isLiability) liabilities += total;
      else assets += total;
    });
    return { assets, liabilities, netWorth: assets - liabilities };
  }

  /* ── Render shell ── */
  const inner = document.getElementById('wealth-inner');
  inner.innerHTML = `
    ${buildPageHeader('Financial System', 'Wealth', 'Dashboard',
      'Track every asset, investment, and liability. Know your exact net worth.',
      `<span class="badge badge-warn">MRR Target: ${formatCurrency(APP_DATA.wealth.mrrTarget)}</span>`
    )}

    <!-- Net Worth Hero -->
    <div class="card" id="nwCard">
      <div class="mrr-display">
        <div class="mrr-label">Total Net Worth</div>
        <div class="mrr-amount" id="nwAmount">$0</div>
        <div class="mrr-sub" id="nwSub">Assets: $0 &nbsp;·&nbsp; Liabilities: $0</div>
      </div>
      <div class="mrr-progress-wrap" style="padding-bottom:16px">
        <div class="mrr-progress-labels" style="justify-content:flex-end;margin-bottom:4px">
          <span id="nwGoalLabel" style="color:rgba(226,234,242,0.4);font-size:10px"></span>
        </div>
        <div class="progress-track" style="height:8px">
          <div class="progress-fill" id="nwBar" style="width:0%;background:#f5c842"></div>
        </div>
      </div>
    </div>

    <!-- Summary Stats -->
    <div class="grid-4" id="wealthStats"></div>

    <!-- Asset Sections -->
    <div class="section-label">Assets</div>
    <div id="assetSections"></div>

    <!-- Liabilities -->
    <div class="section-label" style="margin-top:8px">Liabilities</div>
    <div id="liabilitySections"></div>

    <!-- MRR -->
    <div class="section-label" style="margin-top:8px">Monthly Recurring Revenue</div>
    <div class="card">
      <div class="mrr-display">
        <div class="mrr-label">Envosta MRR</div>
        <div class="mrr-amount" style="font-size:40px" id="mrrDisplay">$0</div>
        <div class="mrr-sub">Target: ${formatCurrency(APP_DATA.wealth.mrrTarget)} / mo &nbsp;·&nbsp; Pre-revenue</div>
      </div>
      <div class="mrr-progress-wrap">
        <div class="mrr-progress-labels">
          <span>$0</span><span>$10K</span><span>$25K</span><span>$50K</span>
        </div>
        <div class="progress-track" style="height:10px">
          <div class="progress-fill" style="width:0%;background:var(--accent)"></div>
        </div>
      </div>
    </div>
  `;

  /* ── Render all ── */
  let data = loadData();

  function renderAll() {
    data = loadData();
    const { assets, liabilities, netWorth } = calcNetWorth(data);
    const NW_GOAL = APP_DATA.wealth.netWorthGoal;

    /* Net worth hero */
    const nwEl = document.getElementById('nwAmount');
    nwEl.textContent = formatCurrency(netWorth);
    nwEl.style.color = netWorth >= 0 ? '#f5c842' : '#ef5350';
    document.getElementById('nwSub').innerHTML =
      `Assets: ${formatCurrency(assets)} &nbsp;·&nbsp; Liabilities: ${formatCurrency(liabilities)}`;
    document.getElementById('nwBar').style.width = progressPct(Math.max(0, netWorth), NW_GOAL);
    document.getElementById('nwGoalLabel').textContent = `Goal: $1M net worth · ${Math.round((Math.max(0, netWorth)/NW_GOAL)*100)}% there`;

    /* Summary stat cards */
    const investTotal = ['stocks','crypto','retirement'].reduce((s, id) => {
      const cat = CATEGORIES.find(c => c.id === id);
      return s + getCategoryTotal(data, cat);
    }, 0);
    const physicalTotal = ['real_estate','vehicles','valuables'].reduce((s, id) => {
      const cat = CATEGORIES.find(c => c.id === id);
      return s + getCategoryTotal(data, cat);
    }, 0);
    const cashTotal = getCategoryTotal(data, CATEGORIES.find(c => c.id === 'cash'));
    const bizTotal  = getCategoryTotal(data, CATEGORIES.find(c => c.id === 'business'));

    document.getElementById('wealthStats').innerHTML = [
      { label: 'Cash & Liquid',    value: cashTotal,    color: '#3ddc6e' },
      { label: 'Investments',      value: investTotal,  color: '#4fc3f7' },
      { label: 'Physical Assets',  value: physicalTotal,color: '#f5a623' },
      { label: 'Business Equity',  value: bizTotal,     color: '#f5c842' },
    ].map(s => `
      <div class="stat-card">
        <div class="stat-label">${s.label}</div>
        <div class="stat-value" style="font-size:18px;color:${s.color}">${formatCurrency(s.value)}</div>
      </div>`).join('');

    /* Category sections */
    renderCategories('assetSections',     CATEGORIES.filter(c => !c.isLiability));
    renderCategories('liabilitySections', CATEGORIES.filter(c =>  c.isLiability));
  }

  function renderCategories(containerId, cats) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    for (let i = 0; i < cats.length; i += 2) {
      const row = document.createElement('div');
      row.className = 'grid-2';

      [cats[i], cats[i + 1]].filter(Boolean).forEach(cat => {
        const total = getCategoryTotal(data, cat);
        const card  = document.createElement('div');
        card.className = 'card';

        card.innerHTML = `
          <div class="card-header">
            <div class="card-title">${cat.icon} ${cat.label}</div>
            <div class="wealth-cat-total" style="color:${cat.isLiability ? '#ef5350' : cat.color}" id="cat-total-${cat.id}">
              ${formatCurrency(total)}
            </div>
          </div>
          <div class="card-body">
            ${cat.items.map(item => {
              const val = getValue(data, cat.id, item.id);
              return `
                <div class="wealth-item">
                  <span class="wealth-item-label">${item.label}</span>
                  <span class="wealth-item-amount${cat.isLiability ? ' is-liability' : ''}"
                    data-cat="${cat.id}" data-item="${item.id}"
                    title="Click to edit">
                    ${val > 0 ? formatCurrency(val) : '<span class="wealth-item-empty">tap to set</span>'}
                  </span>
                </div>`;
            }).join('')}
          </div>`;

        card.querySelectorAll('.wealth-item-amount').forEach(el => {
          el.addEventListener('click', () => startEdit(el));
        });

        row.appendChild(card);
      });

      container.appendChild(row);
    }
  }

  function startEdit(el) {
    const catId  = el.dataset.cat;
    const itemId = el.dataset.item;
    const current = getValue(data, catId, itemId);

    const input = document.createElement('input');
    input.type        = 'number';
    input.min         = '0';
    input.value       = current || '';
    input.placeholder = '0';
    input.className   = 'wealth-edit-input';

    el.replaceWith(input);
    input.focus();
    input.select();

    function commit() {
      const newVal = parseFloat(input.value) || 0;
      if (!data[catId]) data[catId] = {};
      data[catId][itemId] = newVal;
      saveData(data);
      renderAll();
    }

    input.addEventListener('blur', commit);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter')  { input.blur(); }
      if (e.key === 'Escape') { renderAll(); }
    });
  }

  renderAll();
});
