/**
 * KOLTYN OS — pages/nutrition.js
 *
 * DATA FLOW
 *   APP_DATA.nutrition  → base meal options per phase (read-only)
 *   APP_DATA.wholeFoods → whole foods reference categories (read-only)
 *   APP_DATA.healthPrinciples.nutrition → static principles (read-only)
 *
 *   STATE.data.nutrition → currentPhase, selectedMeals, customMeals (read + write)
 *
 * WRITES TO STATE → IDB
 *   STATE.setNutritionPhase(phase)              → nutrition.currentPhase
 *   STATE.selectMeal(phase, slotIdx, mealIdx)   → nutrition.selectedMeals
 *   STATE.addCustomMeal(phase, slotIdx, mealObj) → nutrition.customMeals
 *   STATE.removeCustomMeal(phase, slotIdx, idx)  → nutrition.customMeals
 *   All mutators call save() which writes to IndexedDB asynchronously.
 *
 * REMOVE BUTTONS
 *   Base meals: clicking a selected meal deselects it (toggle already in place).
 *   Custom meals: a permanent × delete button removes the meal from STATE/IDB.
 *
 * WHOLE FOODS
 *   All categories shown in one compact multi-column grid (not separate cards).
 */

window.registerPage('nutrition', function initNutrition() {

  /* ── Base data (read-only) ── */
  const MEAL_TITLES = APP_DATA.nutrition.mealTitles;
  const ns          = STATE.data.nutrition;

  /* ── Food Library helpers ── */
  function getAllFoods() {
    const base   = (APP_DATA.foodLibrary || []);
    const custom = (STATE.data.nutrition.foodLibrary || []);
    return [...base, ...custom];
  }

  function filterFoods(query, category, type) {
    return getAllFoods().filter(f => {
      if (category && category !== 'All' && f.category !== category) return false;
      if (type && type !== 'all' && f.type !== type) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!f.name.toLowerCase().includes(q) && !(f.brand||'').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }

  function getUnifiedMealCollection() {
    const seen = new Set();
    const all = [];

    // Flatten all APP_DATA base meals across all phases (deduplicate by name)
    const phases = APP_DATA.nutrition?.meals || {};
    Object.entries(phases).forEach(([_phase, slots]) => {
      (slots || []).forEach((slotMeals, _slotIdx) => {
        (slotMeals || []).forEach(m => {
          if (seen.has(m.name)) return;
          seen.add(m.name);
          all.push({
            _base: true,
            id: 'base_' + m.name.replace(/\s+/g, '_').toLowerCase(),
            name: m.name,
            category: m.category,
            cuisine: m.cuisine || '',
            totalCalories: m.calories,
            totalProtein:  m.protein,
            totalCarbs:    m.carbs,
            totalFats:     m.fats,
            slots: [],
          });
        });
      });
    });

    // Append user-built meals
    (STATE.data.nutrition.userMeals || []).forEach(m => all.push(m));

    return all;
  }

  function computeMealTotals(ingredients) {
    return ingredients.reduce((acc, ing) => {
      acc.calories += ing.calories || 0;
      acc.protein  += ing.protein  || 0;
      acc.carbs    += ing.carbs    || 0;
      acc.fats     += ing.fats     || 0;
      return acc;
    }, { calories:0, protein:0, carbs:0, fats:0 });
  }

  let currentPhase  = ns.calcGoal || ns.currentPhase || 'maintain';
  let viewDate      = new Date().toISOString().slice(0, 10);

  let activeTab = 'plan';
  let builderMeal = { name:'', slots:[], ingredients:[] };
  let foodLibFilter = { query:'', category:'All', type:'all' };

  const NUTRITION_TABS = [
    { id: 'plan',      label: 'Meal Plan' },
    { id: 'customize', label: 'Customize' },
  ];

  /* ── Page shell ── */
  const inner = document.getElementById('nutrition-inner');
  inner.innerHTML = `
    ${buildPageHeader('Whole Food Influenced', 'Nutrition', 'Dashboard',
      'Select one per meal slot — tap a meal to select, tap again to expand details.'
    )}

    <!-- ── Meal Plan tab ── -->
    <div id="nt-section-plan">

      <!-- Phase + macro progress -->
      <div class="card" id="mealPlanProgress" style="margin-bottom:14px;overflow:hidden">
        <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;gap:8px">
          <div style="flex-shrink:0">
            <div class="card-title">Daily Macro Summary</div>
            <div id="planPhaseLabel" style="font-family:'Rajdhani',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-top:2px"></div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex:1;justify-content:center">
            <button id="prevDayBtn" style="background:none;border:1px solid var(--border);color:var(--muted);font-size:14px;line-height:1;padding:2px 9px;border-radius:6px;cursor:pointer">‹</button>
            <span id="summaryDateLabel" style="font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;letter-spacing:0.5px;color:var(--text);white-space:nowrap;min-width:110px;text-align:center"></span>
            <button id="nextDayBtn" style="background:none;border:1px solid var(--border);color:var(--muted);font-size:14px;line-height:1;padding:2px 9px;border-radius:6px;cursor:pointer">›</button>
          </div>
          <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
            <button id="clearTodayBtn" style="background:none;border:1px solid var(--border);color:var(--muted);font-size:10px;font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:0.5px;padding:3px 8px;border-radius:6px;cursor:pointer;text-transform:uppercase">Clear Day</button>
          </div>
        </div>
        <div class="card-body" style="padding:12px 16px">
          <div class="macro-summary-grid" id="macroSummaryGrid"></div>
          <div class="legend" style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border)">
            <div class="legend-item"><div class="legend-dot" style="background:var(--simple)"></div>Simple</div>
            <div class="legend-item"><div class="legend-dot" style="background:var(--premade)"></div>Premade</div>
            <div class="legend-item"><div class="legend-dot" style="background:var(--gourmet)"></div>Gourmet</div>
          </div>
        </div>
      </div>

      <!-- Meal slots -->
      <div class="meals-grid" id="mealsGrid"></div>

      <!-- Nutrition Principles -->
      <div class="section-label" style="margin-top:8px">Nutrition Principles</div>
      <div class="grid-2" id="nutritionPrinciplesPlan"></div>

    </div>

    <!-- ── Customize tab ── -->
    <div id="nt-section-customize" style="display:none">

      <!-- Unified Nutrition Setup -->
      <div class="card" style="margin-bottom:16px;overflow:hidden" id="ntMacroCalcCard">
        <div style="padding:14px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
          <div style="font-family:'Rajdhani',sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:var(--muted)">Nutrition Setup</div>
          <div id="ntPhaseSuggestion" style="display:none;font-size:10px;padding:3px 8px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:var(--muted)"></div>
        </div>

        <!-- Body Stats row -->
        <div style="padding:16px 20px 0">
          <div style="font-family:'Rajdhani',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:12px">Body Stats</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:20px">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
                <span style="font-size:11px;color:var(--muted)">Weight</span>
                <span style="font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;color:var(--text)" id="ntCalcWeightDisplay">175 lbs</span>
              </div>
              <input type="range" id="ntCalcWeight" min="100" max="350" value="175" step="1" class="macro-slider" />
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
                <span style="font-size:11px;color:var(--muted)">Height</span>
                <span style="font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;color:var(--text)" id="ntCalcHeightDisplay">5'10"</span>
              </div>
              <input type="range" id="ntCalcHeight" min="54" max="84" value="70" step="1" class="macro-slider" />
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
                <span style="font-size:11px;color:var(--muted)">Body Fat</span>
                <span style="font-family:'Rajdhani',sans-serif;font-size:14px;font-weight:700;color:var(--text)" id="ntCurrentBodyFatDisplay">18%</span>
              </div>
              <input type="range" id="ntCurrentBodyFat" min="4" max="45" value="18" step="0.5" class="macro-slider" />
            </div>
          </div>
        </div>

        <!-- Phase + Activity -->
        <div style="padding:0 20px 16px;display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <div>
            <label style="font-family:'Rajdhani',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:8px">Goal Phase</label>
            <select id="ntCalcGoalToggle" class="form-input" style="width:100%;margin:0">
              <option value="cut">Cut</option>
              <option value="maintain">Maintain</option>
              <option value="bulk">Bulk</option>
            </select>
          </div>
          <div>
            <label style="font-family:'Rajdhani',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:8px">Activity Level</label>
            <select id="ntCalcActivityToggle" class="form-input" style="width:100%;margin:0">
              <option value="12">Sedentary</option>
              <option value="14">Light</option>
              <option value="15.5">Moderate</option>
              <option value="17">Active</option>
            </select>
          </div>
        </div>

        <!-- Live macro totals -->
        <div style="padding:14px 20px 0">
          <div class="macro-calc-results" id="ntCalcResults"></div>
        </div>

        <!-- Meal distribution sliders -->
        <div style="border-top:1px solid var(--border);padding:20px 20px 16px;margin-top:6px" id="macroDistributionSection"></div>
      </div>

      <!-- Slot Meal Options -->
      <div id="slotCustomizerSection" style="margin-bottom:24px"></div>

      <!-- Meal Builder + Food Library -->
      <div id="mealBuilderSection" style="margin-bottom:24px"></div>
      <div id="foodLibrarySection" style="margin-bottom:24px"></div>

    </div>
  `;

  /* ── Sub-page tabs ── */
  function showTab(id) {
    activeTab = id;
    document.getElementById('nt-section-plan').style.display      = id === 'plan'      ? '' : 'none';
    document.getElementById('nt-section-customize').style.display = id === 'customize' ? '' : 'none';
    setPageTabs(inner, NUTRITION_TABS, id, showTab);
  }
  setPageTabs(inner, NUTRITION_TABS, activeTab, showTab);

  function catClass(c) {
    return c === 'Simple' ? 'cat-simple' : c === 'Premade' ? 'cat-premade' : 'cat-gourmet';
  }

  /* ── Add Custom Food modal wiring ── */
  const addFoodClose = document.getElementById('addFoodClose');
  if (addFoodClose) addFoodClose.addEventListener('click', closeAddFoodModal);

  const addFoodForm = document.getElementById('addFoodForm');
  if (addFoodForm) {
    addFoodForm.addEventListener('submit', e => {
      e.preventDefault();
      STATE.addFoodItem({
        name:        document.getElementById('afName').value.trim(),
        brand:       document.getElementById('afBrand').value.trim() || null,
        category:    document.getElementById('afCategory').value,
        type:        document.getElementById('afType').value,
        servingSize: parseFloat(document.getElementById('afServingSize').value) || 0,
        servingUnit: document.getElementById('afServingUnit').value,
        calories:    parseFloat(document.getElementById('afCalories').value) || 0,
        protein:     parseFloat(document.getElementById('afProtein').value)  || 0,
        carbs:       parseFloat(document.getElementById('afCarbs').value)    || 0,
        fats:        parseFloat(document.getElementById('afFats').value)     || 0,
        fiber:       parseFloat(document.getElementById('afFiber').value)    || 0,
        tags:        [],
      });
      closeAddFoodModal();
      renderFoodLibrary();
    });
  }

  /* ══════════════════════════════════════════════════════════════
     RENDER PHASE — horizontal scroll of curated slot options
  ══════════════════════════════════════════════════════════════ */
  function renderPhase() {
    const grid = document.getElementById('mealsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const today      = viewDate;
    const plan       = STATE.data.nutrition.mealPlan[today] || {};
    const SLOT_KEYS  = ['breakfast', 'lunch', 'dinner', 'snack'];
    const collection = getUnifiedMealCollection();
    const slotOpts   = STATE.data.nutrition.slotOptions || { 0:[], 1:[], 2:[], 3:[] };
    const slotTargets = getSlotTargets();

    MEAL_TITLES.forEach((title, mi) => {
      const slotKey    = SLOT_KEYS[mi];
      const optionIds  = slotOpts[mi] || [];
      const options    = optionIds.map(id => collection.find(m => m.id === id)).filter(Boolean);
      const selectedId = plan[slotKey] || null;
      const tgt        = slotTargets[mi];
      const quickAdds  = (plan.quickAdds || []).filter(qa => qa.slot === slotKey);

      const card = document.createElement('div');
      card.className = 'meal-card';
      card.innerHTML = `
        <div class="meal-card-header" style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
          <div>
            <div class="meal-card-number">Slot ${mi + 1}</div>
            <div class="meal-card-title">${title}</div>
            <div style="display:flex;gap:5px;margin-top:4px">
              <span class="mm mm-cal">${tgt.calories}kcal</span>
              <span class="mm mm-p">${tgt.protein}g P</span>
              <span class="mm mm-c">${tgt.carbs}g C</span>
              <span class="mm mm-f">${tgt.fats}g F</span>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0">
            ${selectedId ? `<span style="font-size:10px;color:var(--accent);font-family:'Rajdhani',sans-serif;font-weight:700">Selected ✓</span>` : ''}
            <button class="slot-quick-add-btn" data-slot-key="${slotKey}" style="background:none;border:1px dashed var(--border);border-radius:7px;color:var(--muted);font-size:11px;cursor:pointer;font-family:'Rajdhani',sans-serif;font-weight:600;letter-spacing:0.4px;padding:4px 9px;white-space:nowrap">+ Quick Add</button>
          </div>
        </div>
        <div class="meal-options-scroll" id="slot-scroll-${mi}"></div>
        ${options.length === 0 ? `<div style="padding:4px 14px 8px;font-size:12px;color:var(--muted)">No options — add meals in Customize tab.</div>` : ''}
        ${quickAdds.length > 0 ? `
        <div style="padding:6px 14px 8px;border-top:1px solid var(--border);margin-top:4px">
          ${quickAdds.map((qa) => {
            const realIdx = (plan.quickAdds || []).indexOf(qa);
            return `<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0">
              <div>
                <span style="font-size:12px;font-weight:600">${qa.name}</span>
                <span style="font-size:11px;color:var(--muted);margin-left:6px">${qa.calories}kcal${qa.protein ? ` · ${qa.protein}P` : ''}${qa.carbs ? ` · ${qa.carbs}C` : ''}${qa.fats ? ` · ${qa.fats}F` : ''}</span>
              </div>
              <button data-qa-rm="${realIdx}" style="background:none;border:none;color:var(--muted);font-size:16px;cursor:pointer;padding:2px 6px;line-height:1">×</button>
            </div>`;
          }).join('')}
        </div>` : ''}
      `;
      grid.appendChild(card);

      /* Quick add remove buttons */
      card.querySelectorAll('[data-qa-rm]').forEach(btn => {
        btn.addEventListener('click', () => {
          STATE.removeQuickAdd(today, parseInt(btn.dataset.qaRm));
          renderPhase();
        });
      });

      /* Quick add open modal */
      card.querySelector('.slot-quick-add-btn').addEventListener('click', () => {
        openQuickAddModal(slotKey);
      });

      const list = card.querySelector(`#slot-scroll-${mi}`);
      list.style.cursor = 'grab';
      list.style.userSelect = 'none';
      (function initDrag(el) {
        let sx = 0, sl = 0, active = false;
        el.addEventListener('mousedown', e => { active=true; sx=e.pageX; sl=el.scrollLeft; el.style.cursor='grabbing'; });
        el.addEventListener('mousemove', e => { if (!active) return; el.scrollLeft = sl-(e.pageX-sx); });
        ['mouseup','mouseleave'].forEach(ev => el.addEventListener(ev, () => { active=false; el.style.cursor='grab'; }));
      }(list));

      options.forEach(meal => {
        const isSelected = meal.id === selectedId;
        const catBg = meal.category === 'Simple' ? 'rgba(76,175,158,0.13)' : meal.category === 'Premade' ? 'rgba(124,106,247,0.13)' : meal.category === 'Gourmet' ? 'rgba(240,156,58,0.13)' : 'rgba(107,138,170,0.08)';

        const item = document.createElement('div');
        item.className = 'meal-option' + (isSelected ? ' selected' : '');
        item.style.cssText = `flex:0 0 280px;min-height:160px;display:flex;flex-direction:column;justify-content:space-between`;

        item.innerHTML = `
          <div class="meal-option-top" style="background:${catBg};margin:-14px -14px 8px;padding:10px 14px;border-radius:10px 10px 0 0;min-height:58px;align-items:flex-start">
            <div class="meal-option-name">${meal.name}</div>
            <div style="display:flex;gap:4px;align-items:center;flex-shrink:0">
              ${meal.category ? `<div class="category-badge ${catClass(meal.category)}">${meal.category}</div>` : ''}
              ${!meal._base ? `<span style="font-size:9px;color:var(--accent);font-family:'Rajdhani',sans-serif;font-weight:700">CUSTOM</span>` : ''}
            </div>
          </div>
          <div class="meal-option-desc" style="font-size:12px;color:var(--muted);flex:1">${meal.cuisine || ''}</div>
          <div class="meal-option-bottom">
            <div class="meal-macros">
              <span class="mm mm-cal">${meal.totalCalories}kcal</span>
              <span class="mm mm-p">${meal.totalProtein}P</span>
              <span class="mm mm-c">${meal.totalCarbs}C</span>
              <span class="mm mm-f">${meal.totalFats}F</span>
            </div>
          </div>`;

        /* Use a drag-flag instead of clientX delta — more reliable on mobile touch */
        let dragged = false;
        item.addEventListener('pointerdown', () => { dragged = false; });
        item.addEventListener('pointermove', () => { dragged = true; });
        item.addEventListener('click', () => {
          if (dragged) return;
          if (isSelected) {
            STATE.clearMealSlot(today, slotKey);
          } else {
            STATE.assignMealToSlot(today, slotKey, meal.id);
          }
          renderPhase();
        });

        list.appendChild(item);
      });
    });

    updateSummary();
  }

  /* ══════════════════════════════════════════════════════════════
     MACRO DISTRIBUTION — split daily totals across 4 meal slots
  ══════════════════════════════════════════════════════════════ */
  function getSlotTargets() {
    const dist    = ns.mealDistribution || [25, 30, 35, 10];
    const targets = computeMacros(ns.calcWeight, ns.calcGoal, ns.calcActivity);
    const total   = dist.reduce((s, v) => s + v, 0) || 100;
    return dist.map(pct => ({
      pct:      Math.round(pct),
      calories: Math.round(targets.calories * pct / total),
      protein:  Math.round(targets.protein  * pct / total),
      carbs:    Math.round(targets.carbs    * pct / total),
      fats:     Math.round(targets.fats     * pct / total),
    }));
  }

  function renderMacroDistribution() {
    const el = document.getElementById('macroDistributionSection');
    if (!el) return;
    const dist    = [...(ns.mealDistribution || [25, 30, 35, 10])];
    const targets = getSlotTargets();
    const total   = dist.reduce((s, v) => s + v, 0);
    const slotColors = ['#42c4f5','#f5a623','var(--accent)','#c97bff'];

    el.innerHTML = `
      <div style="font-family:'Rajdhani',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:12px;display:flex;align-items:center;justify-content:space-between">
        <span>Meal Distribution</span>
        <span id="distTotal" style="font-size:11px;font-weight:700;color:${total === 100 ? 'var(--accent)' : 'var(--danger)'}">${total}% allocated</span>
      </div>
      ${MEAL_TITLES.map((title, i) => `
        <div style="margin-bottom:14px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">
            <div style="display:flex;align-items:center;gap:7px">
              <div style="width:7px;height:7px;border-radius:50%;background:${slotColors[i]};flex-shrink:0"></div>
              <span style="font-size:12px;font-weight:600">${title}</span>
            </div>
            <div style="display:flex;align-items:baseline;gap:6px">
              <span style="font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700;color:${slotColors[i]}" id="distPct${i}">${dist[i]}%</span>
              <span style="font-size:10px;color:var(--muted)" id="distKcal${i}">${targets[i].calories}kcal · ${targets[i].protein}P ${targets[i].carbs}C ${targets[i].fats}F</span>
            </div>
          </div>
          <input type="range" min="0" max="60" step="1" value="${dist[i]}"
            class="macro-slider" data-dist="${i}"
            style="accent-color:${total > 100 ? 'var(--danger)' : slotColors[i]}">
        </div>`).join('')}`;

    el.querySelectorAll('[data-dist]').forEach(slider => {
      slider.addEventListener('input', () => {
        const i = parseInt(slider.dataset.dist);
        dist[i] = parseInt(slider.value);
        STATE.setMealDistribution(dist);
        // Update labels live without full re-render
        const t = getSlotTargets();
        const tot = dist.reduce((s, v) => s + v, 0);
        [0,1,2,3].forEach(j => {
          const pctEl  = el.querySelector(`#distPct${j}`);
          const kcalEl = el.querySelector(`#distKcal${j}`);
          if (pctEl)  pctEl.textContent  = `${dist[j]}%`;
          if (kcalEl) kcalEl.textContent = `${t[j].calories}kcal · ${t[j].protein}P ${t[j].carbs}C ${t[j].fats}F`;
        });
        const over = tot > 100;
        const totalEl = el.querySelector('#distTotal');
        if (totalEl) {
          totalEl.textContent = `${tot}% allocated`;
          totalEl.style.color = tot === 100 ? 'var(--accent)' : 'var(--danger)';
        }
        el.querySelectorAll('[data-dist]').forEach(s => {
          s.style.accentColor = over ? 'var(--danger)' : slotColors[parseInt(s.dataset.dist)];
        });
        renderPhase();
      });
    });
  }

  /* ══════════════════════════════════════════════════════════════
     SLOT CUSTOMIZER — manage up to 15 meal options per slot
  ══════════════════════════════════════════════════════════════ */
  function renderSlotCustomizer() {
    const el = document.getElementById('slotCustomizerSection');
    if (!el) return;
    const collection = getUnifiedMealCollection();
    const slotOpts   = STATE.data.nutrition.slotOptions || { 0:[], 1:[], 2:[], 3:[] };

    el.innerHTML = `<div class="section-label" style="margin-bottom:4px">Meal Plan Options</div>
      <div style="font-size:11.5px;color:var(--muted);margin-bottom:14px">Add up to 15 meals per slot. These appear as swipeable options on the Plan tab.</div>`;

    MEAL_TITLES.forEach((title, mi) => {
      const optionIds = slotOpts[mi] || [];
      const options   = optionIds.map(id => collection.find(m => m.id === id)).filter(Boolean);
      const atMax     = options.length >= 15;

      const block = document.createElement('div');
      block.style.cssText = 'margin-bottom:18px';
      block.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <div>
            <div style="font-family:'Rajdhani',sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--muted)">Slot ${mi+1}</div>
            <div style="font-size:13px;font-weight:600">${title}</div>
          </div>
          <span style="font-size:11px;color:var(--muted)">${options.length}/15</span>
        </div>
        <div class="card" style="overflow:hidden">
          <div style="padding:8px 12px">
            ${options.length === 0
              ? `<div style="padding:10px 0;font-size:12px;color:var(--muted);text-align:center">No meals added yet</div>`
              : options.map((m, oi) => `
                <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
                  <div style="flex:1;min-width:0">
                    <div style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m.name}</div>
                    <div style="font-size:10.5px;color:var(--muted)">${m.totalCalories}kcal · ${m.totalProtein}P ${m.totalCarbs}C ${m.totalFats}F</div>
                  </div>
                  ${m.category ? `<span class="category-badge ${catClass(m.category)}">${m.category}</span>` : ''}
                  <button class="builder-remove-btn" data-slot="${mi}" data-oi="${oi}">×</button>
                </div>`).join('')}
            <button class="day-tab" data-add-slot="${mi}" style="width:100%;padding:8px;font-size:12px;margin-top:8px${atMax ? ';opacity:0.4;pointer-events:none' : ''}">${atMax ? 'Max 15 reached' : '+ Add Meal'}</button>
          </div>
        </div>`;

      block.querySelectorAll('[data-oi]').forEach(btn => {
        btn.addEventListener('click', () => {
          const si = parseInt(btn.dataset.slot);
          const ids = [...(STATE.data.nutrition.slotOptions[si] || [])];
          ids.splice(parseInt(btn.dataset.oi), 1);
          STATE.setSlotOptions(si, ids);
          renderSlotCustomizer();
          renderPhase();
        });
      });

      block.querySelectorAll('[data-add-slot]').forEach(btn => {
        btn.addEventListener('click', () => {
          const si = parseInt(btn.dataset.addSlot);
          openMealCollectionPicker(si, (mealId) => {
            const ids = [...(STATE.data.nutrition.slotOptions[si] || [])];
            if (!ids.includes(mealId) && ids.length < 15) {
              ids.push(mealId);
              STATE.setSlotOptions(si, ids);
              renderSlotCustomizer();
              renderPhase();
            }
          });
        });
      });

      el.appendChild(block);
    });
  }

  /* ══════════════════════════════════════════════════════════════
     MACRO SUMMARY — two-column layout: targets | selected
     Shown at the top of the page (always visible).
  ══════════════════════════════════════════════════════════════ */
  function updateSummary() {
    const today = viewDate;
    const plan  = STATE.data.nutrition.mealPlan[today] || {};
    const collection = getUnifiedMealCollection();
    const totals = { calories: 0, protein: 0, carbs: 0, fats: 0 };
    ['breakfast','lunch','dinner','snack'].forEach(slot => {
      const mid = plan[slot];
      if (!mid) return;
      const meal = collection.find(m => m.id === mid);
      if (!meal) return;
      totals.calories += meal.totalCalories || 0;
      totals.protein  += meal.totalProtein  || 0;
      totals.carbs    += meal.totalCarbs    || 0;
      totals.fats     += meal.totalFats     || 0;
    });
    /* Include one-time quick adds */
    (plan.quickAdds || []).forEach(qa => {
      totals.calories += qa.calories || 0;
      totals.protein  += qa.protein  || 0;
      totals.carbs    += qa.carbs    || 0;
      totals.fats     += qa.fats     || 0;
    });
    const cal = totals.calories, pro = totals.protein, carb = totals.carbs, fat = totals.fats;
    /* Targets come from the macro calculator (saved in Settings) */
    const targets = computeMacros(ns.calcWeight, ns.calcGoal, ns.calcActivity);

    /* Update plan tab phase label */
    const phaseLabel = document.getElementById('planPhaseLabel');
    if (phaseLabel) {
      const phaseColor = ns.calcGoal === 'bulk' ? 'var(--accent3)' : ns.calcGoal === 'cut' ? 'var(--danger)' : 'var(--accent)';
      const phaseStr   = (ns.calcGoal || 'maintain').charAt(0).toUpperCase() + (ns.calcGoal || 'maintain').slice(1);
      phaseLabel.innerHTML = `Active Phase · <span style="color:${phaseColor}">${phaseStr}</span>`;
    }

    const grid = document.getElementById('macroSummaryGrid');
    if (!grid) return;

    const macros = [
      { label:'Calories', eaten:cal,  target:targets.calories, unit:'kcal', color:'var(--accent3)' },
      { label:'Protein',  eaten:pro,  target:targets.protein,  unit:'g',    color:'#f5a623' },
      { label:'Carbs',    eaten:carb, target:targets.carbs,    unit:'g',    color:'#42c4f5' },
      { label:'Fats',     eaten:fat,  target:targets.fats,     unit:'g',    color:'#c97bff' },
    ];

    grid.innerHTML = macros.map(m => {
      const rawPct  = m.target > 0 ? (m.eaten / m.target) * 100 : 0;
      const over    = m.eaten > m.target;
      const fillPct = over ? 100 : rawPct;
      /* Overflow segment: how far past 100% (capped at 40% of track for visual) */
      const overPct = over ? Math.min(40, rawPct - 100) : 0;
      const valColor = over ? 'var(--danger)' : m.color;
      return `
        <div class="macro-summary-item">
          <div class="macro-summary-header">
            <span class="macro-summary-label">${m.label}</span>
            <span class="macro-summary-values">
              <span style="color:${valColor};font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700">${m.eaten}</span>
              <span class="macro-summary-sep">/</span>
              <span class="macro-summary-target">${m.target}${m.unit}</span>
            </span>
          </div>
          <div class="macro-bar-track" style="position:relative;overflow:hidden">
            <div class="macro-bar-fill" style="width:${fillPct}%;background:${m.color}"></div>
            ${over ? `<div style="position:absolute;top:0;right:0;height:100%;width:${overPct}%;background:var(--danger);border-radius:0 4px 4px 0;opacity:0.85"></div>` : ''}
          </div>
          <div class="macro-summary-sub" style="color:${over ? 'var(--danger)' : ''}">
            ${over ? `+${Math.round(m.eaten - m.target)}${m.unit} over` : `${Math.round(rawPct)}% of daily target`}
          </div>
        </div>`;
    }).join('');

  }

  /* ══════════════════════════════════════════════════════════════
     QUICK ADD MODAL — one-off food per slot
  ══════════════════════════════════════════════════════════════ */
  function openQuickAddModal(slotKey) {
    let overlay = document.getElementById('quickAddOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'quickAddOverlay';
      overlay.className = 'food-picker-overlay';
      overlay.style.cssText = 'align-items:flex-end';
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
      <div class="food-picker-sheet" style="max-height:80vh">
        <div class="food-picker-header">
          <span style="font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700">Quick Add · ${slotKey.charAt(0).toUpperCase() + slotKey.slice(1)}</span>
          <button id="qaClose" style="background:none;border:none;color:var(--muted);font-size:22px;cursor:pointer;padding:0 4px;line-height:1">×</button>
        </div>
        <div class="food-picker-body" style="padding:16px">
          <div style="margin-bottom:12px">
            <label style="font-size:11px;color:var(--muted);font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;display:block;margin-bottom:4px">Food Name</label>
            <input id="qaName" class="form-input" placeholder="e.g. Protein Bar" style="width:100%;box-sizing:border-box">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
            <div>
              <label style="font-size:11px;color:var(--muted);font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;display:block;margin-bottom:4px">Calories</label>
              <input id="qaCalories" class="form-input" type="number" min="0" placeholder="0" style="width:100%;box-sizing:border-box">
            </div>
            <div>
              <label style="font-size:11px;color:var(--muted);font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;display:block;margin-bottom:4px">Protein (g)</label>
              <input id="qaProtein" class="form-input" type="number" min="0" placeholder="0" style="width:100%;box-sizing:border-box">
            </div>
            <div>
              <label style="font-size:11px;color:var(--muted);font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;display:block;margin-bottom:4px">Carbs (g)</label>
              <input id="qaCarbs" class="form-input" type="number" min="0" placeholder="0" style="width:100%;box-sizing:border-box">
            </div>
            <div>
              <label style="font-size:11px;color:var(--muted);font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:1px;text-transform:uppercase;display:block;margin-bottom:4px">Fats (g)</label>
              <input id="qaFats" class="form-input" type="number" min="0" placeholder="0" style="width:100%;box-sizing:border-box">
            </div>
          </div>
          <button id="qaConfirm" style="width:100%;padding:13px;background:var(--accent);color:#fff;border:none;border-radius:10px;font-family:'Rajdhani',sans-serif;font-size:15px;font-weight:700;cursor:pointer;letter-spacing:0.5px">Add to Today</button>
        </div>
      </div>`;

    overlay.style.display = 'flex';
    document.getElementById('qaClose').addEventListener('click', () => { overlay.style.display = 'none'; });
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.style.display = 'none'; });

    /* Live macro preview — update summary as user types */
    ['qaCalories','qaProtein','qaCarbs','qaFats'].forEach(id => {
      document.getElementById(id).addEventListener('input', updateSummaryPreview);
    });

    function updateSummaryPreview() {
      /* No-op — actual update happens on confirm. Could add preview here later. */
    }

    document.getElementById('qaConfirm').addEventListener('click', () => {
      const name     = document.getElementById('qaName').value.trim() || 'Food';
      const calories = parseFloat(document.getElementById('qaCalories').value) || 0;
      const protein  = parseFloat(document.getElementById('qaProtein').value)  || 0;
      const carbs    = parseFloat(document.getElementById('qaCarbs').value)    || 0;
      const fats     = parseFloat(document.getElementById('qaFats').value)     || 0;
      if (!calories && !protein && !carbs && !fats) return;
      STATE.addQuickAdd(viewDate, slotKey, { name, calories, protein, carbs, fats });
      overlay.style.display = 'none';
      renderPhase();
    });
  }

  /* ══════════════════════════════════════════════════════════════
     FOOD PICKER OVERLAY
  ══════════════════════════════════════════════════════════════ */
  function openFoodPicker(onSelect) {
    let pickerQuery    = '';
    let pickerCategory = 'All';
    const CATS = ['All','Proteins','Vegetables','Fruits','Grains & Breads','Dairy','Fats & Oils','Condiments','Snacks','Beverages'];

    let overlay = document.getElementById('foodPickerOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'foodPickerOverlay';
      overlay.className = 'food-picker-overlay';
      overlay.style.display = 'none';
      document.body.appendChild(overlay);
    }

    function renderPicker() {
      const foods = filterFoods(pickerQuery, pickerCategory, 'all');
      overlay.innerHTML = `
        <div class="food-picker-sheet">
          <div class="food-picker-header">
            <span style="font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700">Add Ingredient</span>
            <button id="fpClose" style="background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer;padding:0 4px">×</button>
          </div>
          <div style="padding:10px 16px 0;flex-shrink:0">
            <input id="fpSearch" type="text" class="form-input" placeholder="Search foods…" value="${pickerQuery}" style="margin-bottom:8px">
            <div class="food-lib-filter-pills">
              ${CATS.map(c=>`<button class="food-lib-pill${c===pickerCategory?' active':''}" data-cat="${c}">${c}</button>`).join('')}
            </div>
          </div>
          <div class="food-picker-body" id="fpBody">
            ${foods.length === 0 ? `<div style="text-align:center;color:var(--muted);padding:30px 0;font-size:13px">No foods found</div>` :
              foods.map(f => `
                <div class="food-picker-row" data-id="${f.id}">
                  <div style="flex:1;min-width:0">
                    <div class="food-picker-row-name">${f.name}${f.brand?`<span style="font-size:10px;color:var(--muted);margin-left:5px">${f.brand}</span>`:''}</div>
                    <div style="font-size:10.5px;color:var(--muted)">${f.servingSize}${f.servingUnit} · ${f.calories}kcal · ${f.protein}P ${f.carbs}C ${f.fats}F</div>
                  </div>
                  <span class="food-type-badge food-type-${f.type}">${f.type}</span>
                </div>`).join('')}
          </div>
        </div>`;

      overlay.style.display = 'flex';

      overlay.querySelector('#fpClose').addEventListener('click', () => { overlay.style.display='none'; });
      overlay.addEventListener('click', e => { if(e.target===overlay) overlay.style.display='none'; });

      overlay.querySelector('#fpSearch').addEventListener('input', e => {
        pickerQuery = e.target.value;
        renderPicker();
      });

      overlay.querySelectorAll('.food-lib-pill').forEach(btn => {
        btn.addEventListener('click', () => { pickerCategory = btn.dataset.cat; renderPicker(); });
      });

      overlay.querySelectorAll('.food-picker-row').forEach(row => {
        row.addEventListener('click', () => {
          const food = getAllFoods().find(f => f.id === row.dataset.id);
          if (!food) return;
          showQtyPicker(food);
        });
      });
    }

    function showQtyPicker(food) {
      let qty = 1;
      const body = overlay.querySelector('#fpBody');
      body.innerHTML = `
        <div style="padding:16px 0">
          <div style="font-size:15px;font-weight:600;margin-bottom:4px">${food.name}</div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:16px">${food.servingSize}${food.servingUnit} per serving</div>
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
            <button id="fpQtyMinus" style="width:36px;height:36px;border-radius:50%;border:1.5px solid var(--border);background:var(--surface2);color:var(--text);font-size:18px;cursor:pointer">−</button>
            <span id="fpQtyVal" style="font-family:'Rajdhani',sans-serif;font-size:22px;font-weight:700;min-width:40px;text-align:center">${qty}</span>
            <button id="fpQtyPlus" style="width:36px;height:36px;border-radius:50%;border:1.5px solid var(--border);background:var(--surface2);color:var(--text);font-size:18px;cursor:pointer">+</button>
            <span style="font-size:12px;color:var(--muted)">serving${qty!==1?'s':''}</span>
          </div>
          <div style="font-size:12px;color:var(--muted);margin-bottom:16px" id="fpQtyMacros">
            ${food.calories * qty}kcal · ${food.protein * qty}g P · ${food.carbs * qty}g C · ${food.fats * qty}g F
          </div>
          <button id="fpQtyConfirm" class="phase-btn active" style="width:100%;padding:11px;font-size:14px">Add to Meal</button>
          <button id="fpQtyBack" style="width:100%;padding:8px;margin-top:8px;background:none;border:none;color:var(--muted);font-size:13px;cursor:pointer">← Back</button>
        </div>`;

      function updateQtyDisplay() {
        overlay.querySelector('#fpQtyVal').textContent = qty;
        overlay.querySelector('#fpQtyMacros').textContent =
          `${Math.round(food.calories*qty)}kcal · ${Math.round(food.protein*qty)}g P · ${Math.round(food.carbs*qty)}g C · ${Math.round(food.fats*qty)}g F`;
      }

      overlay.querySelector('#fpQtyMinus').addEventListener('click', () => { if(qty>0.5) { qty=Math.round((qty-0.5)*2)/2; updateQtyDisplay(); } });
      overlay.querySelector('#fpQtyPlus').addEventListener('click',  () => { qty=Math.round((qty+0.5)*2)/2; updateQtyDisplay(); });
      overlay.querySelector('#fpQtyBack').addEventListener('click',  () => renderPicker());
      overlay.querySelector('#fpQtyConfirm').addEventListener('click', () => {
        const entry = {
          foodId:       food.id,
          _name:        food.name,
          _servingSize: food.servingSize,
          _servingUnit: food.servingUnit,
          quantity:     qty,
          calories:     Math.round(food.calories * qty),
          protein:      Math.round(food.protein  * qty),
          carbs:        Math.round(food.carbs    * qty),
          fats:         Math.round(food.fats     * qty),
        };
        overlay.style.display = 'none';
        onSelect(entry);
      });
    }

    renderPicker();
  }

  /* ══════════════════════════════════════════════════════════════
     FOOD LIBRARY (Customize tab)
  ══════════════════════════════════════════════════════════════ */
  function renderFoodLibrary() {
    const el = document.getElementById('foodLibrarySection');
    if (!el) return;
    const CATS = ['All','Proteins','Vegetables','Fruits','Grains & Breads','Dairy','Fats & Oils','Condiments','Snacks','Beverages'];
    const foods = filterFoods(foodLibFilter.query, foodLibFilter.category, foodLibFilter.type);

    el.innerHTML = `
      <div class="section-label" style="margin-bottom:4px">Food Library</div>
      <div style="font-size:11.5px;color:var(--muted);margin-bottom:12px">Browse ingredients used in Meal Builder.</div>
      <div class="food-lib-filter-pills" id="flCatPills">
        ${CATS.map(c=>`<button class="food-lib-pill${c===foodLibFilter.category?' active':''}" data-cat="${c}">${c}</button>`).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <input id="flSearch" type="text" class="form-input" placeholder="Search foods…" value="${foodLibFilter.query}" style="flex:1;margin:0">
        <select id="flType" class="form-input" style="width:auto;padding:6px 10px;margin:0">
          <option value="all"${foodLibFilter.type==='all'?' selected':''}>All</option>
          <option value="whole"${foodLibFilter.type==='whole'?' selected':''}>Whole</option>
          <option value="brand"${foodLibFilter.type==='brand'?' selected':''}>Brand</option>
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
        ${foods.slice(0,40).map(f=>`
          <div class="food-item-card">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:4px">
              <div class="food-item-card-name">${f.name}</div>
              <span class="food-type-badge food-type-${f.type}">${f.type}</span>
            </div>
            ${f.brand?`<div class="food-item-card-sub">${f.brand}</div>`:''}
            <div class="food-item-card-sub">${f.servingSize}${f.servingUnit}</div>
            <div class="food-item-card-macros">
              <span class="mm mm-cal">${f.calories}kcal</span>
              <span class="mm mm-p">${f.protein}P</span>
              <span class="mm mm-c">${f.carbs}C</span>
              <span class="mm mm-f">${f.fats}F</span>
            </div>
            ${f.createdAt?`<button class="meal-delete-btn" data-fid="${f.id}" style="align-self:flex-end;margin-top:2px">× Remove</button>`:''}
          </div>`).join('')}
      </div>
      ${foods.length>40?`<div style="text-align:center;font-size:12px;color:var(--muted);margin-bottom:10px">Showing 40 of ${foods.length} — refine search to narrow results</div>`:''}
      <button id="flAddCustomBtn" class="day-tab" style="width:100%;padding:8px;font-size:12px">+ Add Custom Food</button>
    `;

    el.querySelector('#flSearch').addEventListener('input', e => { foodLibFilter.query = e.target.value; renderFoodLibrary(); });
    el.querySelector('#flType').addEventListener('change', e => { foodLibFilter.type = e.target.value; renderFoodLibrary(); });
    el.querySelectorAll('#flCatPills .food-lib-pill').forEach(btn => {
      btn.addEventListener('click', () => { foodLibFilter.category = btn.dataset.cat; renderFoodLibrary(); });
    });
    el.querySelectorAll('[data-fid]').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); STATE.removeFoodItem(btn.dataset.fid); renderFoodLibrary(); });
    });
    el.querySelector('#flAddCustomBtn').addEventListener('click', () => openAddFoodModal());
  }

  function openAddFoodModal() {
    const overlay = document.getElementById('addFoodOverlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    document.getElementById('addFoodForm').reset();
  }
  function closeAddFoodModal() {
    const overlay = document.getElementById('addFoodOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  /* ══════════════════════════════════════════════════════════════
     MEAL BUILDER MODAL
  ══════════════════════════════════════════════════════════════ */
  function openMealBuilderModal(meal) {
    builderMeal = meal
      ? { ...meal, ingredients: [...meal.ingredients] }
      : { name:'', slots:[], ingredients:[] };

    let overlay = document.getElementById('mealBuilderOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'mealBuilderOverlay';
      overlay.className = 'food-picker-overlay';
      overlay.style.cssText = 'align-items:flex-end';
      document.body.appendChild(overlay);
    }

    function renderBuilderModal() {
      const totals = computeMealTotals(builderMeal.ingredients);
      overlay.innerHTML = `
        <div class="food-picker-sheet" style="max-height:90vh">
          <div class="food-picker-header">
            <span style="font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700">${builderMeal.id ? 'Edit Meal' : 'New Meal'}</span>
            <button id="mbClose" style="background:none;border:none;color:var(--muted);font-size:22px;cursor:pointer;padding:0 4px;line-height:1">×</button>
          </div>
          <div class="food-picker-body" style="padding:14px 16px 24px">
            <input id="mbName" type="text" class="form-input" placeholder="Meal name (e.g. Chicken Rice Bowl)" value="${builderMeal.name||''}">
            <div style="font-size:11px;color:var(--muted);font-weight:600;margin:12px 0 8px;letter-spacing:0.5px;text-transform:uppercase">Ingredients</div>
            ${builderMeal.ingredients.length === 0
              ? `<div style="text-align:center;color:var(--muted);padding:14px 0;font-size:12px">No ingredients yet</div>`
              : builderMeal.ingredients.map((ing, i) => `
                <div class="builder-ingredient-row">
                  <div class="builder-ingredient-name">${ing._name}</div>
                  <div style="font-size:10.5px;color:var(--muted);white-space:nowrap">${ing.calories}kcal</div>
                  <input class="builder-qty-input" type="number" min="0.5" step="0.5" value="${ing.quantity}" data-ing="${i}">
                  <button class="builder-remove-btn" data-remove="${i}">×</button>
                </div>`).join('')}
            <button id="mbAddIngredient" class="day-tab" style="width:100%;padding:8px;font-size:12px;margin-top:8px">+ Add Ingredient</button>
            ${builderMeal.ingredients.length > 0 ? `
            <div class="builder-macro-bar" style="margin-top:14px">
              <div class="builder-macro-item"><div class="builder-macro-val" style="color:var(--accent3)">${Math.round(totals.calories)}</div><div class="builder-macro-lbl">kcal</div></div>
              <div class="builder-macro-item"><div class="builder-macro-val" style="color:#f5a623">${Math.round(totals.protein)}g</div><div class="builder-macro-lbl">protein</div></div>
              <div class="builder-macro-item"><div class="builder-macro-val" style="color:#42c4f5">${Math.round(totals.carbs)}g</div><div class="builder-macro-lbl">carbs</div></div>
              <div class="builder-macro-item"><div class="builder-macro-val" style="color:#c97bff">${Math.round(totals.fats)}g</div><div class="builder-macro-lbl">fats</div></div>
            </div>` : ''}
            <button id="mbSave" class="phase-btn active" style="width:100%;padding:12px;font-size:14px;margin-top:14px">${builderMeal.id ? 'Update Meal' : 'Save Meal'} ✓</button>
          </div>
        </div>`;

      overlay.style.display = 'flex';

      overlay.querySelector('#mbClose').addEventListener('click', () => { overlay.style.display = 'none'; });

      overlay.querySelector('#mbName').addEventListener('input', e => { builderMeal.name = e.target.value; });

      overlay.querySelectorAll('.builder-qty-input').forEach(inp => {
        inp.addEventListener('change', () => {
          const i    = parseInt(inp.dataset.ing);
          const food = getAllFoods().find(f => f.id === builderMeal.ingredients[i].foodId);
          const qty  = parseFloat(inp.value) || 1;
          if (food) {
            builderMeal.ingredients[i].quantity = qty;
            builderMeal.ingredients[i].calories = Math.round(food.calories * qty);
            builderMeal.ingredients[i].protein  = Math.round(food.protein  * qty);
            builderMeal.ingredients[i].carbs    = Math.round(food.carbs    * qty);
            builderMeal.ingredients[i].fats     = Math.round(food.fats     * qty);
          }
          renderBuilderModal();
        });
      });

      overlay.querySelectorAll('[data-remove]').forEach(btn => {
        btn.addEventListener('click', () => {
          builderMeal.ingredients.splice(parseInt(btn.dataset.remove), 1);
          renderBuilderModal();
        });
      });

      overlay.querySelector('#mbAddIngredient').addEventListener('click', () => {
        openFoodPicker(entry => {
          builderMeal.ingredients.push(entry);
          renderBuilderModal();
        });
      });

      overlay.querySelector('#mbSave').addEventListener('click', () => {
        const name = (overlay.querySelector('#mbName').value || builderMeal.name || '').trim();
        if (!name) { alert('Please enter a meal name.'); return; }
        if (builderMeal.ingredients.length === 0) { alert('Please add at least one ingredient.'); return; }
        const t = computeMealTotals(builderMeal.ingredients);
        STATE.saveUserMeal({ ...builderMeal, name,
          totalCalories: Math.round(t.calories),
          totalProtein:  Math.round(t.protein),
          totalCarbs:    Math.round(t.carbs),
          totalFats:     Math.round(t.fats),
        });
        overlay.style.display = 'none';
        builderMeal = { name:'', slots:[], ingredients:[] };
        renderMealBuilder();
      });
    }

    renderBuilderModal();
  }

  /* ══════════════════════════════════════════════════════════════
     MEAL BUILDER (Customize tab — saved meals list only)
  ══════════════════════════════════════════════════════════════ */
  function renderMealBuilder() {
    const el = document.getElementById('mealBuilderSection');
    if (!el) return;
    const meals = STATE.data.nutrition.userMeals || [];

    el.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div class="section-label" style="margin:0">Saved Meals</div>
        <button id="mbNewMeal" class="day-tab active" style="padding:5px 14px;font-size:12px">+ New Meal</button>
      </div>
      ${meals.length === 0
        ? `<div style="text-align:center;color:var(--muted);padding:18px 0;font-size:12px">No saved meals yet — tap New Meal to build one.</div>`
        : meals.map(m => `
          <div class="user-meal-card">
            <div class="user-meal-card-body">
              <div class="user-meal-card-name">${m.name}</div>
              <div class="food-item-card-macros" style="margin-top:4px">
                <span class="mm mm-cal">${m.totalCalories||0}kcal</span>
                <span class="mm mm-p">${m.totalProtein||0}P</span>
                <span class="mm mm-c">${m.totalCarbs||0}C</span>
                <span class="mm mm-f">${m.totalFats||0}F</span>
                <span style="font-size:10px;color:var(--muted);margin-left:2px">(${m.ingredients?.length||0} ingredients)</span>
              </div>
            </div>
            <div class="user-meal-card-actions">
              <button class="day-tab" data-edit="${m.id}" style="padding:4px 12px;font-size:11px">Edit</button>
              <button class="meal-delete-btn" data-del="${m.id}" style="font-size:18px">×</button>
            </div>
          </div>`).join('')}
    `;

    el.querySelector('#mbNewMeal').addEventListener('click', () => openMealBuilderModal(null));

    el.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const meal = (STATE.data.nutrition.userMeals||[]).find(m => m.id === btn.dataset.edit);
        if (meal) openMealBuilderModal(meal);
      });
    });

    el.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => { STATE.removeUserMeal(btn.dataset.del); renderMealBuilder(); });
    });
  }

  /* ══════════════════════════════════════════════════════════════
     USER MEAL PICKER (assign to plan slot)
  ══════════════════════════════════════════════════════════════ */
  function openMealCollectionPicker(slotIdx, onPick) {
    const SLOT_KEYS = ['breakfast', 'lunch', 'dinner', 'snack'];
    const slotKey   = SLOT_KEYS[slotIdx];
    const today     = viewDate;
    let pickerQuery = '';

    let overlay = document.getElementById('mealCollectionPickerOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'mealCollectionPickerOverlay';
      overlay.className = 'food-picker-overlay';
      overlay.style.display = 'none';
      document.body.appendChild(overlay);
    }

    function renderPicker() {
      const q    = pickerQuery.toLowerCase();
      const all  = getUnifiedMealCollection();
      const meals = q ? all.filter(m => m.name.toLowerCase().includes(q)) : all;

      overlay.innerHTML = `
        <div class="food-picker-sheet">
          <div class="food-picker-header">
            <span style="font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700">Choose Meal — ${slotKey.charAt(0).toUpperCase() + slotKey.slice(1)}</span>
            <button id="mcpClose" style="background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer;padding:0 4px">×</button>
          </div>
          <div style="padding:10px 16px 0;flex-shrink:0">
            <input id="mcpSearch" type="text" class="form-input" placeholder="Search meals…" value="${pickerQuery}" style="margin-bottom:8px">
          </div>
          <div class="food-picker-body">
            ${meals.length === 0
              ? `<div style="text-align:center;color:var(--muted);padding:30px 0;font-size:13px">No meals found</div>`
              : meals.map(m => `
                <div class="food-picker-row" data-mid="${m.id}" style="flex-direction:column;align-items:flex-start;gap:4px">
                  <div style="display:flex;align-items:center;gap:6px;width:100%">
                    <span style="font-weight:600;font-size:13px;flex:1">${m.name}</span>
                    ${m.category ? `<span class="category-badge ${catClass(m.category)}">${m.category}</span>` : ''}
                    ${!m._base ? `<span style="font-size:9px;color:var(--accent);font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:0.5px">CUSTOM</span>` : ''}
                  </div>
                  <div style="display:flex;gap:5px">
                    <span class="mm mm-cal">${m.totalCalories}kcal</span>
                    <span class="mm mm-p">${m.totalProtein}P</span>
                    <span class="mm mm-c">${m.totalCarbs}C</span>
                    <span class="mm mm-f">${m.totalFats}F</span>
                  </div>
                </div>`).join('')}
          </div>
        </div>`;

      overlay.style.display = 'flex';

      overlay.querySelector('#mcpClose').addEventListener('click', () => { overlay.style.display = 'none'; });
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.style.display = 'none'; });
      overlay.querySelector('#mcpSearch').addEventListener('input', e => { pickerQuery = e.target.value; renderPicker(); });

      overlay.querySelectorAll('[data-mid]').forEach(row => {
        row.addEventListener('click', () => {
          overlay.style.display = 'none';
          if (onPick) {
            onPick(row.dataset.mid);
          } else {
            STATE.assignMealToSlot(today, slotKey, row.dataset.mid);
            renderPhase();
            updateSummary();
          }
        });
      });
    }

    renderPicker();
  }

  /* ══════════════════════════════════════════════════════════════
     MACRO CALCULATOR (Customize tab)
  ══════════════════════════════════════════════════════════════ */
  let ntCalcWeight     = ns.calcWeight     || 175;
  let ntCalcHeight     = ns.calcHeight     || 70;
  let ntCalcGoal       = ns.calcGoal       || 'maintain';
  let ntCalcActivity   = ns.calcActivity   || 14;
  let ntCurrentBodyFat = ns.currentBodyFat || 18;

  function fmtHeight(inches) {
    return `${Math.floor(inches / 12)}'${inches % 12}"`;
  }
  function calcBMI(weightLbs, heightIn) {
    return heightIn > 0 ? (weightLbs / (heightIn * heightIn)) * 703 : 0;
  }

  /* Pre-populate sliders */
  inner.querySelector('#ntCalcWeight').value = ntCalcWeight;
  inner.querySelector('#ntCalcWeightDisplay').textContent = ntCalcWeight + ' lbs';
  inner.querySelector('#ntCalcHeight').value = ntCalcHeight;
  inner.querySelector('#ntCalcHeightDisplay').textContent = fmtHeight(ntCalcHeight);
  inner.querySelector('#ntCurrentBodyFat').value = ntCurrentBodyFat;
  inner.querySelector('#ntCurrentBodyFatDisplay').textContent = ntCurrentBodyFat + '%';
  inner.querySelector('#ntCalcGoalToggle').value = ntCalcGoal;
  inner.querySelector('#ntCalcActivityToggle').value = String(ntCalcActivity);

  function renderPhaseSuggestion() {
    const el  = document.getElementById('ntPhaseSuggestion');
    if (!el) return;
    const bmi = calcBMI(ntCalcWeight, ntCalcHeight);
    const bf  = ntCurrentBodyFat;
    let phase = null, reason = '';

    if (bmi >= 25 && bf <= 15) {
      /* Upper BMI but lean — likely muscular, don't cut */
      phase  = 'maintain';
      reason = `BMI ${bmi.toFixed(1)} but ${bf}% body fat — you're likely muscular. Maintain to preserve mass.`;
    } else if (bf >= 20 || bmi >= 27) {
      phase  = 'cut';
      reason = bmi >= 27
        ? `BMI ${bmi.toFixed(1)} and ${bf}% body fat — a cut phase will help reduce excess fat.`
        : `${bf}% body fat — a cut is recommended to get back into a leaner range.`;
    } else if (bmi < 18.5 || bf <= 10) {
      phase  = 'bulk';
      reason = bmi < 18.5
        ? `BMI ${bmi.toFixed(1)} — you're underweight. A bulk phase will help you build size and strength.`
        : `${bf}% body fat — you're very lean and in a great position to bulk effectively.`;
    }

    if (!phase) { el.style.display = 'none'; return; }
    const isCurrent  = ntCalcGoal === phase;
    const phaseColor = phase === 'cut' ? 'var(--danger)' : phase === 'bulk' ? 'var(--accent3)' : 'var(--accent)';
    el.style.display = 'block';
    el.innerHTML = `<span style="color:${phaseColor};font-weight:700">${phase.charAt(0).toUpperCase() + phase.slice(1)} suggested</span>${isCurrent ? ' ✓' : ''} — ${reason}`;
  }

  function renderNtCalcResults() {
    const m = computeMacros(ntCalcWeight, ntCalcGoal, ntCalcActivity);
    const pPct = Math.round((m.protein * 4 / m.calories) * 100);
    const cPct = Math.round((m.carbs   * 4 / m.calories) * 100);
    const fPct = Math.round((m.fats    * 9 / m.calories) * 100);
    const adj  = ntCalcGoal === 'bulk' ? '+300 surplus' : ntCalcGoal === 'cut' ? '−500 deficit' : 'maintenance';
    inner.querySelector('#ntCalcResults').innerHTML = `
      <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:10px">
        <div style="font-family:'Rajdhani',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted)">Daily Targets</div>
        <div style="font-size:10px;color:var(--muted)">TDEE ${m.tdee.toLocaleString()} kcal · ${adj} · BMI ${calcBMI(ntCalcWeight, ntCalcHeight).toFixed(1)}</div>
      </div>
      <div class="macro-calc-breakdown" style="grid-template-columns:1fr 1fr 1fr 1fr">
        <div class="macro-calc-macro" style="--mc:100%;--col:var(--accent3)">
          <div class="macro-calc-bar"><div class="macro-calc-bar-fill"></div></div>
          <div class="macro-calc-val" style="color:var(--accent3)">${m.calories.toLocaleString()}</div>
          <div class="macro-calc-lbl">Calories</div>
        </div>
        <div class="macro-calc-macro" style="--mc:${pPct}%;--col:#f5a623">
          <div class="macro-calc-bar"><div class="macro-calc-bar-fill"></div></div>
          <div class="macro-calc-val">${m.protein}g</div>
          <div class="macro-calc-lbl">Protein (${pPct}%)</div>
        </div>
        <div class="macro-calc-macro" style="--mc:${cPct}%;--col:#42c4f5">
          <div class="macro-calc-bar"><div class="macro-calc-bar-fill"></div></div>
          <div class="macro-calc-val">${m.carbs}g</div>
          <div class="macro-calc-lbl">Carbs (${cPct}%)</div>
        </div>
        <div class="macro-calc-macro" style="--mc:${fPct}%;--col:#c97bff">
          <div class="macro-calc-bar"><div class="macro-calc-bar-fill"></div></div>
          <div class="macro-calc-val">${m.fats}g</div>
          <div class="macro-calc-lbl">Fats (${fPct}%)</div>
        </div>
      </div>`;
  }

  function ntSaveAndRender() {
    currentPhase = ntCalcGoal;
    STATE.setNutritionPhase(currentPhase);
    STATE.setCalcInputs(ntCalcWeight, ntCalcGoal, ntCalcActivity,
      undefined, undefined, ntCurrentBodyFat, undefined, ntCalcHeight);
    renderNtCalcResults();
    renderPhaseSuggestion();
    renderMacroDistribution();
    updateSummary();
    if (document.getElementById('mealsGrid')) renderPhase();
  }

  inner.querySelector('#ntCalcWeight').addEventListener('input', e => {
    ntCalcWeight = parseInt(e.target.value);
    inner.querySelector('#ntCalcWeightDisplay').textContent = ntCalcWeight + ' lbs';
    ntSaveAndRender();
  });
  inner.querySelector('#ntCalcHeight').addEventListener('input', e => {
    ntCalcHeight = parseInt(e.target.value);
    inner.querySelector('#ntCalcHeightDisplay').textContent = fmtHeight(ntCalcHeight);
    ntSaveAndRender();
  });
  inner.querySelector('#ntCurrentBodyFat').addEventListener('input', e => {
    ntCurrentBodyFat = parseFloat(e.target.value);
    inner.querySelector('#ntCurrentBodyFatDisplay').textContent = ntCurrentBodyFat + '%';
    ntSaveAndRender();
  });

  inner.querySelector('#ntCalcGoalToggle').addEventListener('change', e => {
    ntCalcGoal = e.target.value;
    ntSaveAndRender();
  });
  inner.querySelector('#ntCalcActivityToggle').addEventListener('change', e => {
    ntCalcActivity = parseFloat(e.target.value);
    ntSaveAndRender();
  });
  renderNtCalcResults();
  renderPhaseSuggestion();

  /* ── Nutrition principles (Plan tab only) ── */
  const principleHTML = (APP_DATA.healthPrinciples?.nutrition || []).map(p => `
    <div style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
      <div style="font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:700;color:var(--accent);margin-bottom:4px">${p.title}</div>
      <div style="font-size:12px;color:rgba(226,234,242,0.72);line-height:1.6">${p.body}</div>
    </div>`).join('');
  document.getElementById('nutritionPrinciplesPlan').innerHTML = principleHTML;

  renderPhase();
  renderMacroDistribution();
  renderSlotCustomizer();
  renderMealBuilder();
  renderFoodLibrary();

  /* ── Date navigation ── */
  function todayStr() { return new Date().toISOString().slice(0, 10); }

  function offsetDate(base, days) {
    const d = new Date(base + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function updateDateNav() {
    const t     = todayStr();
    const min   = offsetDate(t, -28);
    const max   = offsetDate(t, 14);
    const label = document.getElementById('summaryDateLabel');
    const prev  = document.getElementById('prevDayBtn');
    const next  = document.getElementById('nextDayBtn');
    if (label) {
      const d = new Date(viewDate + 'T00:00:00');
      const dayPart  = viewDate === t ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      label.textContent = `${dayPart} · ${datePart}`;
    }
    if (prev) prev.disabled = viewDate <= min;
    if (next) next.disabled = viewDate >= max;
  }

  const prevBtn = document.getElementById('prevDayBtn');
  const nextBtn = document.getElementById('nextDayBtn');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      viewDate = offsetDate(viewDate, -1);
      updateDateNav();
      renderPhase();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      viewDate = offsetDate(viewDate, 1);
      updateDateNav();
      renderPhase();
    });
  }

  /* Clear Day button */
  const clearBtn = document.getElementById('clearTodayBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      STATE.clearTodayPlan(viewDate);
      renderPhase();
    });
  }

  /* Prune mealPlan entries older than 28 days */
  (function pruneMealPlanHistory() {
    const cutoff = offsetDate(todayStr(), -28);
    const mp = STATE.data.nutrition.mealPlan;
    let pruned = false;
    Object.keys(mp).forEach(k => { if (k < cutoff) { delete mp[k]; pruned = true; } });
    if (pruned) STATE.save();
  }());

  updateDateNav();
});
