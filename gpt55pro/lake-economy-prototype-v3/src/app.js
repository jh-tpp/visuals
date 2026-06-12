import { LakeScene } from './scene.js';
import {
  buildLakeParams,
  entityCardData,
  frontierGrid,
  makePresets,
  scoreOfferAgainstGrid,
  sharesFromTokens,
  templateForIndex,
  tokenVectorFromShares
} from './economy.js';
import { renderFrontierChart } from './chart.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function sum(v) { return v.reduce((a, b) => a + b, 0); }
function fmt(v, digits = 1) { return Number.isFinite(v) ? v.toFixed(digits) : '—'; }
function signed(v, digits = 1) { return Number.isFinite(v) ? `${v >= 0 ? '+' : ''}${v.toFixed(digits)}` : '—'; }
function pct(v, digits = 1) { return Number.isFinite(v) ? `${(v * 100).toFixed(digits)}%` : '—'; }

const state = {
  lakeIndex: 0,
  seed: 'harbor-2025-a',
  templateKey: 'feed-bottleneck',
  goalWeight: null,
  goalChosen: false,
  tokens: [0, 0, 0, 0, 0, 0],
  lastScore: null,
  bestScore: null,
  frontierCache: new Map(),
  selectedEntity: null,
  panelOpen: false,
  panelMode: null
};

let params;
let scene;
let elements;

function init() {
  elements = {
    canvas: $('#lakeCanvas'),
    labels: $('#labels'),
    panelToggle: $('#panelToggle'),
    playPanel: $('#playPanel'),
    minimizePanel: $('#minimizePanel'),
    scenarioName: $('#scenarioName'),
    scenarioText: $('#scenarioText'),
    scenarioNote: $('#scenarioNote'),
    lakeSeed: $('#lakeSeed'),
    goalSection: $('.goal-section'),
    goalSlider: $('#goalSlider'),
    goalReadout: $('#goalReadout'),
    goalHint: $('#goalHint'),
    goalButtons: $$('.goal-pill'),
    offerSection: $('#offerSection'),
    totalTokens: $('#totalTokens'),
    unallocated: $('#unallocatedTokens'),
    offersList: $('#offersList'),
    presetButtons: $$('.preset-btn'),
    runBtn: $('#runBtn'),
    freshBtn: $('#freshBtn'),
    newLakeBtn: $('#newLakeBtn'),
    resetViewBtn: $('#resetViewBtn'),
    resultSection: $('#resultSection'),
    resultSummary: $('#resultSummary'),
    resultTable: $('#resultTable'),
    chartBox: $('#frontierChart'),
    bestReadout: $('#bestReadout'),
    statusLine: $('#statusLine'),
    topButtons: $$('.top-nav [data-panel]'),
    contentPanel: $('#contentPanel'),
    contentTitle: $('#contentTitle'),
    contentBody: $('#contentBody'),
    closeContent: $('#closeContent'),
    entityPopup: $('#entityPopup')
  };

  params = buildLakeParams({ seed: state.seed, templateKey: state.templateKey, lakeOutcomeWeight: 0.50 });
  scene = new LakeScene({
    canvas: elements.canvas,
    labelRoot: elements.labels,
    onEntitySelect: openEntityPopup
  });
  scene.setFrameCallback(() => positionEntityPopup());
  scene.setLake(params);
  scene.updateState({ offers: state.tokens, lastRun: null });

  bindEvents();
  renderAll();
}

function bindEvents() {
  elements.panelToggle.addEventListener('click', () => setPanelOpen(!state.panelOpen));
  elements.minimizePanel.addEventListener('click', () => setPanelOpen(false));
  elements.goalSlider.addEventListener('input', () => setGoal(Number(elements.goalSlider.value) / 100));
  elements.goalButtons.forEach(btn => btn.addEventListener('click', () => setGoal(Number(btn.dataset.goal) / 100)));
  elements.presetButtons.forEach(btn => btn.addEventListener('click', () => applyPreset(btn.dataset.preset)));
  elements.runBtn.addEventListener('click', runEconomy);
  elements.freshBtn.addEventListener('click', startFresh);
  elements.newLakeBtn.addEventListener('click', newLake);
  elements.resetViewBtn.addEventListener('click', () => scene.resetView());
  elements.topButtons.forEach(btn => btn.addEventListener('click', () => openContentPanel(btn.dataset.panel)));
  elements.closeContent.addEventListener('click', closeContentPanel);
  elements.contentPanel.addEventListener('pointerdown', e => {
    if (e.target === elements.contentPanel) closeContentPanel();
  });
  document.addEventListener('pointerdown', e => {
    const target = e.target;
    if (elements.entityPopup.classList.contains('hidden')) return;
    if (elements.entityPopup.contains(target)) return;
    if (target.closest?.('.world-label, [data-select]')) return;
    closeEntityPopup();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeEntityPopup();
      closeContentPanel();
    }
  });
}

function setPanelOpen(open) {
  state.panelOpen = open;
  elements.playPanel.classList.toggle('collapsed', !open);
  elements.panelToggle.setAttribute('aria-expanded', String(open));
  elements.panelToggle.textContent = open ? 'Playing' : 'Play';
}

function setGoal(weight) {
  state.goalWeight = clamp(weight, 0, 1);
  state.goalChosen = true;
  params.lakeOutcomeWeight = state.goalWeight;
  if (sum(state.tokens) === 100 && state.lastScore) {
    state.lastScore = scoreCurrentOffers();
    state.bestScore = state.lastScore;
    scene.updateState({ offers: state.tokens, lastRun: state.lastScore.current });
  } else {
    state.bestScore = null;
  }
  elements.statusLine.textContent = 'Goal selected. Allocate exactly 100 offer tokens, then run the economy.';
  renderAll();
}

function applyPreset(preset) {
  if (!state.goalChosen) return;
  const presets = makePresets(params, state.goalWeight);
  let shares = presets.equal;
  if (preset === 'payoff') shares = presets.highestBusinessPayoff;
  if (preset === 'outcome') shares = presets.highestRawOutcome;
  if (preset === 'soft-outcome') shares = presets.outcomeTiltSoft;
  state.tokens = tokenVectorFromShares(shares);
  clearStaleRun('Preset loaded. Run the economy to see what actually clears.');
}

function adjustToken(index, value) {
  if (!state.goalChosen) return;
  const next = [...state.tokens];
  next[index] = clamp(Math.round(value), 0, 100);
  let over = sum(next) - 100;
  if (over > 0) {
    const order = next
      .map((v, i) => ({ i, v }))
      .filter(item => item.i !== index && item.v > 0)
      .sort((a, b) => b.v - a.v);
    for (const item of order) {
      if (over <= 0) break;
      const take = Math.min(next[item.i], over);
      next[item.i] -= take;
      over -= take;
    }
    if (over > 0) next[index] = Math.max(0, next[index] - over);
  }
  state.tokens = next;
  clearStaleRun('Offer sheet changed. Run the economy when the token budget reaches 100.');
}

function clearStaleRun(message) {
  state.lastScore = null;
  scene.updateState({ offers: state.tokens, lastRun: null });
  elements.statusLine.textContent = message;
  renderAll();
}

function scoreCurrentOffers() {
  const shares = sharesFromTokens(state.tokens);
  const grid = getFrontierGrid();
  return scoreOfferAgainstGrid(shares, params, state.goalWeight, grid);
}

function getFrontierGrid() {
  const key = `${params.seed}:${params.template.key}:${state.goalWeight.toFixed(3)}`;
  if (!state.frontierCache.has(key)) {
    state.frontierCache.set(key, frontierGrid(params, state.goalWeight, { randomN: 3400 }));
  }
  return state.frontierCache.get(key);
}

function runEconomy() {
  if (!state.goalChosen || sum(state.tokens) !== 100) return;
  state.lastScore = scoreCurrentOffers();
  if (!state.bestScore || state.lastScore.frontierRecovery > state.bestScore.frontierRecovery) {
    state.bestScore = state.lastScore;
  }
  scene.updateState({ offers: state.tokens, lastRun: state.lastScore.current });
  elements.statusLine.textContent = 'Economy cleared. Compare your offers with total capital change and other-investor response.';
  renderAll();
}

function startFresh() {
  state.tokens = [0, 0, 0, 0, 0, 0];
  state.lastScore = null;
  closeEntityPopup();
  scene.updateState({ offers: state.tokens, lastRun: null });
  elements.statusLine.textContent = state.goalChosen
    ? 'Same harbor economy, fresh offer sheet. Allocate 100 tokens before running.'
    : 'Same harbor economy. Choose a goal first, then allocate offers.';
  renderAll();
}

function newLake() {
  state.lakeIndex += 1;
  const template = templateForIndex(state.lakeIndex);
  state.templateKey = template.key;
  state.seed = `harbor-${2025 + state.lakeIndex}-${template.key}`;
  state.tokens = [0, 0, 0, 0, 0, 0];
  state.lastScore = null;
  state.bestScore = null;
  state.frontierCache.clear();
  closeEntityPopup();
  params = buildLakeParams({ seed: state.seed, templateKey: state.templateKey, lakeOutcomeWeight: state.goalChosen ? state.goalWeight : 0.5 });
  scene.setLake(params);
  scene.updateState({ offers: state.tokens, lastRun: null });
  elements.statusLine.textContent = state.goalChosen
    ? 'New harbor economy generated. The goal is unchanged, but the hidden response system is new.'
    : 'New harbor economy generated. Choose a goal to begin.';
  renderAll();
}

function renderAll() {
  renderScenario();
  renderGoal();
  renderOfferRows();
  renderResults();
  renderFlowLocks();
  renderButtons();
  renderEntityPopup();
}

function renderScenario() {
  elements.scenarioName.textContent = params.template.name;
  elements.scenarioText.textContent = params.template.story;
  elements.scenarioNote.textContent = params.template.note;
  elements.lakeSeed.textContent = params.seed;
}

function renderGoal() {
  if (!state.goalChosen) {
    elements.goalSlider.value = 50;
    elements.goalReadout.textContent = 'No goal selected';
    elements.goalHint.textContent = 'Choose a goal to unlock the offer sheet.';
    elements.goalButtons.forEach(btn => btn.classList.remove('active'));
    return;
  }
  const lakePct = Math.round(state.goalWeight * 100);
  const prosperityPct = 100 - lakePct;
  elements.goalSlider.value = lakePct;
  elements.goalReadout.textContent = `${lakePct}% lake · ${prosperityPct}% prosperity`;
  elements.goalHint.textContent = state.goalWeight > 0.72
    ? 'Frontier is judged mainly by lake health.'
    : state.goalWeight < 0.28
      ? 'Frontier is judged mainly by local prosperity.'
      : 'Frontier is judged by a blended goal.';
  elements.goalButtons.forEach(btn => {
    const value = Number(btn.dataset.goal);
    btn.classList.toggle('active', value === lakePct);
  });
}

function renderOfferRows() {
  const cards = entityCardData(params, state.goalChosen ? state.goalWeight : 0.5);
  const last = state.lastScore;
  elements.offersList.innerHTML = cards.map((e, i) => {
    const actual = last ? signed(last.current.deltaK[i], 1) : '—';
    const offer = state.tokens[i] || 0;
    return `
      <article class="offer-row" data-index="${i}">
        <button class="entity-head" type="button" data-select="${i}" aria-label="Show ${e.name}" ${state.goalChosen ? '' : 'disabled'}>
          <span class="entity-icon">${e.icon}</span>
          <span><strong>${e.short}</strong><small>${metricMini(e)}</small></span>
        </button>
        <div class="offer-control">
          <input type="range" min="0" max="100" value="${offer}" step="1" data-slider="${i}" aria-label="Offer tokens for ${e.name}" ${state.goalChosen ? '' : 'disabled'}>
          <output>${offer}</output>
        </div>
        <div class="actual-mini" title="Total capital change after market clearing"><span>Δ capital</span><strong>${actual}</strong></div>
      </article>`;
  }).join('');

  $$('[data-slider]', elements.offersList).forEach(slider => {
    slider.addEventListener('input', e => adjustToken(Number(e.target.dataset.slider), Number(e.target.value)));
  });
  $$('[data-select]', elements.offersList).forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openEntityPopup(Number(btn.dataset.select));
    });
  });

  const total = sum(state.tokens);
  const unallocated = 100 - total;
  elements.totalTokens.textContent = String(total);
  elements.unallocated.textContent = String(unallocated);
  elements.unallocated.classList.toggle('complete', state.goalChosen && unallocated === 0);
}

function metricMini(e) {
  const lake = e.lakeHealthIntensity >= 0 ? `lake +${fmt(e.lakeHealthIntensity, 2)}` : `lake ${fmt(e.lakeHealthIntensity, 2)}`;
  return `${pct(e.expectedBusinessPayoff, 1)} payoff · ${lake}`;
}

function renderResults() {
  const score = state.lastScore;
  if (!score) {
    elements.resultSummary.innerHTML = `
      <div class="empty-result">
        <strong>${state.goalChosen ? 'Set offers, then run the economy.' : 'Choose a goal first.'}</strong>
        <span>The chart will compare your cleared result with the playable frontier for the selected goal.</span>
      </div>`;
    elements.resultTable.innerHTML = '';
    renderFrontierChart(elements.chartBox, null, null);
    elements.bestReadout.textContent = state.bestScore ? `${Math.round(state.bestScore.frontierRecovery * 100)}% best in this harbor` : 'No run yet';
    return;
  }

  const recovery = Math.round(score.frontierRecovery * 100);
  const positiveOutcome = score.blendedGainVsEqual >= 0;
  const positiveReturn = score.ceGainVsEqual >= 0;
  elements.resultSummary.innerHTML = `
    <div class="score-card ${recovery >= 85 ? 'strong' : recovery >= 55 ? 'ok' : 'learning'}">
      <span>Frontier score</span>
      <strong>${recovery}%</strong>
      <small>${recovery >= 85 ? 'Coherent strategy for this goal.' : 'There is still room to learn the response system.'}</small>
    </div>
    <div class="meter-row">
      <div class="mini-meter">
        <span>Expected outcome change</span>
        <strong class="${positiveOutcome ? 'pos' : 'neg'}">${signed(score.blendedGainVsEqual, 2)}</strong>
        <i style="--fill:${clamp(50 + score.blendedGainVsEqual * 7, 4, 96)}%"></i>
      </div>
      <div class="mini-meter">
        <span>Risk-adjusted return</span>
        <strong class="${positiveReturn ? 'pos' : 'neg'}">${signed(score.ceGainVsEqual, 2)}</strong>
        <i style="--fill:${clamp(50 + score.ceGainVsEqual * 18, 4, 96)}%"></i>
      </div>
      <div class="mini-meter two-values">
        <span>External outcomes</span>
        <strong>Lake ${signed(score.lakeGainVsEqual, 1)}</strong>
        <strong>Prosperity ${signed(score.prosperityGainVsEqual, 1)}</strong>
      </div>
    </div>`;

  const cards = entityCardData(params, state.goalWeight);
  elements.resultTable.innerHTML = `
    <div class="response-table">
      ${cards.map((e, i) => {
        const totalDelta = score.current.deltaK[i];
        const playerDelta = score.current.deltaKPlayer[i];
        const otherDelta = score.current.KOther[i] - score.baseline.KOther[i];
        return `
          <div class="response-row">
            <span>${e.short}</span>
            <b>${state.tokens[i]}</b>
            <b>${signed(totalDelta, 1)}</b>
            <small>${signed(playerDelta, 1)}</small>
            <small>${signed(otherDelta, 1)}</small>
          </div>`;
      }).join('')}
    </div>
    <div class="table-key"><span>Entity</span><span>Offer</span><span>Total ΔK</span><span>Player ΔK</span><span>Other ΔK</span></div>`;

  renderFrontierChart(elements.chartBox, score.grid, score);
  elements.bestReadout.textContent = state.bestScore ? `${Math.round(state.bestScore.frontierRecovery * 100)}% best in this harbor` : 'No run yet';
}

function renderFlowLocks() {
  elements.offerSection.classList.toggle('locked', !state.goalChosen);
  elements.offerSection.setAttribute('aria-disabled', String(!state.goalChosen));
  elements.resultSection.classList.toggle('locked', !state.lastScore);
  elements.resultSection.setAttribute('aria-disabled', String(!state.lastScore));
}

function renderButtons() {
  const total = sum(state.tokens);
  const canRun = state.goalChosen && total === 100;
  elements.runBtn.disabled = !canRun;
  elements.runBtn.title = canRun
    ? 'Clear this harbor economy'
    : state.goalChosen
      ? 'Allocate exactly 100 offer tokens first'
      : 'Choose a goal first';
  elements.presetButtons.forEach(btn => { btn.disabled = !state.goalChosen; });
}

function openEntityPopup(index) {
  state.selectedEntity = index;
  scene.selectEntity(index);
  elements.entityPopup.classList.remove('hidden');
  renderEntityPopup();
  positionEntityPopup();
}

function closeEntityPopup() {
  state.selectedEntity = null;
  elements.entityPopup.classList.add('hidden');
  scene.selectEntity(null);
}

function renderEntityPopup() {
  if (state.selectedEntity === null || elements.entityPopup.classList.contains('hidden')) return;
  const cards = entityCardData(params, state.goalChosen ? state.goalWeight : 0.5);
  const e = cards[state.selectedEntity];
  const last = state.lastScore;
  const actual = last ? last.current.deltaK[state.selectedEntity] : null;
  const playerDelta = last ? last.current.deltaKPlayer[state.selectedEntity] : null;
  const otherDelta = last ? last.current.KOther[state.selectedEntity] - last.baseline.KOther[state.selectedEntity] : null;
  const lakeEff = last ? last.current.lakeContribution[state.selectedEntity] : null;
  const prosperEff = last ? last.current.prosperityContribution[state.selectedEntity] : null;
  elements.entityPopup.innerHTML = `
    <div class="popup-head">
      <div>
        <span class="eyebrow">Visible characteristics only</span>
        <h3>${e.name}</h3>
        <small>Click outside this card to close.</small>
      </div>
      <button type="button" class="popup-close" aria-label="Close entity popup">×</button>
    </div>
    <div class="stat-grid">
      <span><b>${pct(e.expectedBusinessPayoff, 1)}</b><small>Business payoff</small></span>
      <span><b>${pct(e.riskSigma, 0)}</b><small>Risk</small></span>
      <span><b>${signed(e.lakeHealthIntensity, 2)}</b><small>Lake intensity</small></span>
      <span><b>${signed(e.localProsperityIntensity, 2)}</b><small>Prosperity intensity</small></span>
    </div>
    <p class="popup-copy">The hidden response system is not shown up front. Learn it by comparing your offers with capital that actually clears.</p>
    ${actual !== null ? `
      <div class="entity-after-run">
        <span>After market clearing, relative to the equal-offer baseline</span>
        <strong>Total ΔK ${signed(actual, 1)}</strong>
        <small>Player ΔK ${signed(playerDelta, 1)} · Other investors ΔK ${signed(otherDelta, 1)}</small><br>
        <small>Lake ${signed(lakeEff, 1)} · Prosperity ${signed(prosperEff, 1)}</small>
      </div>` : ''}`;
  $('.popup-close', elements.entityPopup).addEventListener('click', closeEntityPopup);
}

function positionEntityPopup() {
  if (state.selectedEntity === null || elements.entityPopup.classList.contains('hidden') || !scene) return;
  const p = scene.projectEntity(state.selectedEntity);
  if (!p || !p.visible) {
    elements.entityPopup.style.opacity = '0';
    return;
  }
  elements.entityPopup.style.opacity = '1';
  const w = elements.entityPopup.offsetWidth || 300;
  const h = elements.entityPopup.offsetHeight || 210;
  const left = clamp(p.left + 18, 12, window.innerWidth - w - 12);
  const top = clamp(p.top - 86, 86, window.innerHeight - h - 12);
  elements.entityPopup.style.left = `${left}px`;
  elements.entityPopup.style.top = `${top}px`;
}

function openContentPanel(mode) {
  state.panelMode = mode;
  elements.contentPanel.classList.remove('hidden');
  elements.contentPanel.dataset.mode = mode;
  elements.topButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.panel === mode));
  const content = contentForMode(mode);
  elements.contentTitle.textContent = content.title;
  elements.contentBody.innerHTML = content.body;
}

function closeContentPanel() {
  state.panelMode = null;
  elements.contentPanel.classList.add('hidden');
  elements.topButtons.forEach(btn => btn.classList.remove('active'));
}

function contentForMode(mode) {
  if (mode === 'papers') {
    return {
      title: 'Papers',
      body: `
        <div class="content-grid">
          <article class="research-card">
            <span class="eyebrow">Paper 1</span>
            <h3>The Impact Frontier</h3>
            <p>Use this slot for the paper abstract, screenshot, download button, or embedded preview. The interactive harbor stays behind the research panel.</p>
            <div class="screenshot-slot">Paper screenshot / PDF preview</div>
          </article>
          <article class="research-card">
            <span class="eyebrow">Paper 2</span>
            <h3>Shifting the Frontier</h3>
            <p>Use this slot for the companion paper and future extensions: coalitions, stewardship, policy, and changing the response system.</p>
            <div class="screenshot-slot">Paper screenshot / PDF preview</div>
          </article>
        </div>
        <section class="html-slot" id="papers-html-slot">
          <h3>Research HTML slot</h3>
          <p>Drop your existing paper cards, screenshots, citation blocks, or download links here. The top bar remains the research-site navigation, not a game-only header.</p>
        </section>`
    };
  }
  if (mode === 'guides') {
    return {
      title: 'Guides',
      body: `
        <div class="content-grid guides">
          <article class="research-card wide">
            <span class="eyebrow">Investor guide</span>
            <h3>Goals-based investing and philanthropy</h3>
            <p>The demo uses the guide's ordering: choose the goal first, then judge strategy against the frontier.</p>
            <div class="screenshot-slot">Guide screenshot / chapter cards</div>
          </article>
          <article class="research-card">
            <span class="eyebrow">Coming soon</span>
            <h3>Practical play notes</h3>
            <p>Short explainers can live here for readers who want the intuition before experimenting with the harbor economy.</p>
          </article>
        </div>`
    };
  }
  return {
    title: 'Methods',
    body: `
      <section class="method-copy">
        <p>The demo treats offers as supply-curve shifts, then clears a six-entity economy in levels. The visible distinction is intentional: offer tokens are not the same object as firm capital after clearing.</p>
        <pre><code>K(b) = solve(PhiS + B, a_demand + PhiS × (c_supply + s_player(b)))
P(b) = a_demand - B × K(b)</code></pre>
        <p>“Actual capital change” is measured relative to the equal-offer baseline for the current harbor. A negative value does not mean the firm disappears; it means that under this offer pattern, equilibrium capital is lower than in that baseline. Other investors remain active through their own supply schedules.</p>
        <p>The frontier chart uses expected outcome change on the horizontal axis and risk-adjusted return on the vertical axis.</p>
      </section>`
  };
}

init();
