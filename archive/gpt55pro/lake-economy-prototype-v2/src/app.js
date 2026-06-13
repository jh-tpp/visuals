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
  seed: 'lake-2025-a',
  templateKey: templateForIndex(0).key,
  goalWeight: 0.5,
  tokens: [0, 0, 0, 0, 0, 0],
  selectedEntity: 0,
  lastScore: null,
  bestScore: null,
  frontierCache: new Map(),
  panelMode: null,
  panelCollapsed: false
};

let params = buildLakeParams({ seed: state.seed, templateKey: state.templateKey, lakeOutcomeWeight: state.goalWeight });
let scene;

const elements = {};

function cacheElements() {
  Object.assign(elements, {
    canvas: $('#lakeCanvas'),
    labelRoot: $('#labels'),
    playPanel: $('#playPanel'),
    panelToggle: $('#panelToggle'),
    scenarioName: $('#scenarioName'),
    scenarioText: $('#scenarioText'),
    scenarioNote: $('#scenarioNote'),
    lakeSeed: $('#lakeSeed'),
    goalSlider: $('#goalSlider'),
    goalReadout: $('#goalReadout'),
    goalHint: $('#goalHint'),
    goalButtons: $$('.goal-pill'),
    offersList: $('#offersList'),
    unallocated: $('#unallocatedTokens'),
    totalTokens: $('#totalTokens'),
    runBtn: $('#runBtn'),
    freshBtn: $('#freshBtn'),
    newLakeBtn: $('#newLakeBtn'),
    resetViewBtn: $('#resetViewBtn'),
    selectedCard: $('#selectedCard'),
    resultSummary: $('#resultSummary'),
    resultTable: $('#resultTable'),
    chartBox: $('#frontierChart'),
    bestReadout: $('#bestReadout'),
    statusLine: $('#statusLine'),
    topButtons: $$('.top-nav button[data-panel]'),
    contentPanel: $('#contentPanel'),
    contentTitle: $('#contentTitle'),
    contentBody: $('#contentBody'),
    closeContent: $('#closeContent'),
    minimizePanel: $('#minimizePanel'),
    voiceToggle: $('#voiceToggle')
  });
}

function init() {
  cacheElements();
  scene = new LakeScene({
    canvas: elements.canvas,
    labelRoot: elements.labelRoot,
    onEntitySelect: index => {
      state.selectedEntity = index;
      renderSelectedCard();
      renderOfferRows();
    }
  });
  scene.setLake(params);
  bindEvents();
  renderAll();
}

function bindEvents() {
  elements.goalSlider.addEventListener('input', e => setGoalWeight(Number(e.target.value) / 100));
  elements.goalButtons.forEach(btn => {
    btn.addEventListener('click', () => setGoalWeight(Number(btn.dataset.goal) / 100));
  });

  elements.runBtn.addEventListener('click', runEconomy);
  elements.freshBtn.addEventListener('click', startFresh);
  elements.newLakeBtn.addEventListener('click', newLake);
  elements.resetViewBtn.addEventListener('click', () => scene.resetView());
  elements.panelToggle.addEventListener('click', () => setPanelCollapsed(false));
  elements.minimizePanel.addEventListener('click', () => setPanelCollapsed(true));

  $$('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
  });

  elements.topButtons.forEach(btn => {
    btn.addEventListener('click', () => openContentPanel(btn.dataset.panel));
  });
  elements.closeContent.addEventListener('click', closeContentPanel);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeContentPanel();
  });
}

function setPanelCollapsed(collapsed) {
  state.panelCollapsed = collapsed;
  elements.playPanel.classList.toggle('collapsed', collapsed);
  elements.panelToggle.hidden = !collapsed;
}

function setGoalWeight(weight) {
  state.goalWeight = clamp(weight, 0, 1);
  params.lakeOutcomeWeight = state.goalWeight;
  state.frontierCache.clear();
  elements.goalSlider.value = Math.round(state.goalWeight * 100);
  if (state.lastScore) {
    // Re-score the same offer vector for the newly chosen goal.
    runEconomy({ silent: true });
  } else {
    renderAll();
  }
}

function applyPreset(presetName) {
  const presets = makePresets(params, state.goalWeight);
  let shares;
  switch (presetName) {
    case 'payoff':
      shares = presets.highestBusinessPayoff;
      break;
    case 'outcome':
      shares = presets.highestRawOutcome;
      break;
    case 'soft-payoff':
      shares = presets.payoffTiltSoft;
      break;
    case 'soft-outcome':
      shares = presets.outcomeTiltSoft;
      break;
    case 'equal':
    default:
      shares = presets.equal;
      break;
  }
  state.tokens = tokenVectorFromShares(shares);
  elements.statusLine.textContent = 'Preset loaded. Run the economy to see what actually clears.';
  renderAll();
  scene.updateState({ offers: state.tokens, lastRun: state.lastScore });
}

function adjustToken(index, value) {
  const next = [...state.tokens];
  const old = next[index];
  const otherTotal = sum(next) - old;
  next[index] = clamp(Math.round(value), 0, 100 - otherTotal);
  state.tokens = next;
  renderAll();
  scene.updateState({ offers: state.tokens, lastRun: state.lastScore });
}

function getFrontier() {
  const key = `${params.seed}:${params.template.key}:${state.goalWeight.toFixed(3)}`;
  if (!state.frontierCache.has(key)) {
    state.frontierCache.set(key, frontierGrid(params, state.goalWeight, { randomN: 3200 }));
  }
  return state.frontierCache.get(key);
}

function runEconomy(options = {}) {
  const total = sum(state.tokens);
  if (total !== 100) {
    elements.statusLine.textContent = `Allocate all 100 offer tokens first. ${100 - total} remain unallocated.`;
    return;
  }
  const shares = sharesFromTokens(state.tokens);
  const grid = getFrontier();
  const score = scoreOfferAgainstGrid(shares, params, state.goalWeight, grid);
  state.lastScore = score;
  if (!state.bestScore || score.frontierRecovery > state.bestScore.frontierRecovery) {
    state.bestScore = score;
  }
  scene.updateState({ offers: state.tokens, lastRun: score });
  if (!options.silent) elements.statusLine.textContent = 'Economy cleared. Offers and actual capital are not the same — compare the bars.';
  renderAll();
}

function startFresh() {
  state.tokens = [0, 0, 0, 0, 0, 0];
  state.lastScore = null;
  elements.statusLine.textContent = 'Same lake, fresh offer sheet. Allocate 100 tokens before running.';
  scene.updateState({ offers: state.tokens, lastRun: null });
  renderAll();
}

function newLake() {
  state.lakeIndex += 1;
  const template = templateForIndex(state.lakeIndex);
  state.templateKey = template.key;
  state.seed = `lake-${2025 + state.lakeIndex}-${template.key}`;
  state.tokens = [0, 0, 0, 0, 0, 0];
  state.lastScore = null;
  state.bestScore = null;
  state.frontierCache.clear();
  params = buildLakeParams({ seed: state.seed, templateKey: state.templateKey, lakeOutcomeWeight: state.goalWeight });
  scene.setLake(params);
  scene.selectEntity(0);
  elements.statusLine.textContent = 'New lake generated. The hidden response system has changed.';
  renderAll();
}

function renderAll() {
  renderScenario();
  renderGoal();
  renderOfferRows();
  renderSelectedCard();
  renderResults();
  renderButtons();
}

function renderScenario() {
  elements.scenarioName.textContent = params.template.name;
  elements.scenarioText.textContent = params.template.story;
  elements.scenarioNote.textContent = params.template.note;
  elements.lakeSeed.textContent = params.seed;
}

function renderGoal() {
  const lakePct = Math.round(state.goalWeight * 100);
  const prosperityPct = 100 - lakePct;
  elements.goalSlider.value = lakePct;
  elements.goalReadout.textContent = `${lakePct}% lake · ${prosperityPct}% prosperity`;
  elements.goalHint.textContent = state.goalWeight > 0.72
    ? 'Frontier is now judged mainly by lake health.'
    : state.goalWeight < 0.28
      ? 'Frontier is now judged mainly by local prosperity.'
      : 'Frontier is now judged by a blended goal.';
  elements.goalButtons.forEach(btn => {
    const value = Number(btn.dataset.goal);
    btn.classList.toggle('active', Math.round(value) === Math.round(lakePct));
  });
}

function renderOfferRows() {
  const cards = entityCardData(params, state.goalWeight);
  const last = state.lastScore;
  elements.offersList.innerHTML = cards.map((e, i) => {
    const actual = last ? signed(last.current.deltaK[i], 1) : '—';
    const selected = state.selectedEntity === i;
    const offer = state.tokens[i] || 0;
    return `
      <article class="offer-row ${selected ? 'selected' : ''}" data-index="${i}">
        <button class="entity-head" type="button" data-select="${i}" aria-label="Show ${e.name}">
          <span class="entity-icon">${e.icon}</span>
          <span><strong>${e.short}</strong><small>${metricMini(e)}</small></span>
        </button>
        <div class="offer-control">
          <input type="range" min="0" max="100" value="${offer}" step="1" data-slider="${i}" aria-label="Offer tokens for ${e.name}">
          <output>${offer}</output>
        </div>
        <div class="actual-mini" title="Capital actually added after clearing"><span>Actual K</span><strong>${actual}</strong></div>
      </article>`;
  }).join('');

  $$('[data-slider]', elements.offersList).forEach(slider => {
    slider.addEventListener('input', e => adjustToken(Number(e.target.dataset.slider), Number(e.target.value)));
  });
  $$('[data-select]', elements.offersList).forEach(btn => {
    btn.addEventListener('click', () => {
      const index = Number(btn.dataset.select);
      state.selectedEntity = index;
      scene.selectEntity(index);
      renderOfferRows();
      renderSelectedCard();
    });
  });

  const total = sum(state.tokens);
  const unallocated = 100 - total;
  elements.totalTokens.textContent = String(total);
  elements.unallocated.textContent = String(unallocated);
  elements.unallocated.classList.toggle('complete', unallocated === 0);
}

function metricMini(e) {
  const lake = e.lakeHealthIntensity >= 0 ? `lake +${fmt(e.lakeHealthIntensity, 2)}` : `lake ${fmt(e.lakeHealthIntensity, 2)}`;
  return `${pct(e.expectedBusinessPayoff, 1)} payoff · ${lake}`;
}

function renderSelectedCard() {
  const cards = entityCardData(params, state.goalWeight);
  const e = cards[state.selectedEntity] || cards[0];
  const last = state.lastScore;
  const actual = last ? last.current.deltaK[state.selectedEntity] : null;
  const lakeEff = last ? last.current.lakeContribution[state.selectedEntity] : null;
  const prosperEff = last ? last.current.prosperityContribution[state.selectedEntity] : null;
  elements.selectedCard.innerHTML = `
    <div class="selected-title">
      <span class="entity-icon large">${e.icon}</span>
      <div><strong>${e.name}</strong><small>Visible characteristics only</small></div>
    </div>
    <div class="stat-grid compact">
      <span><b>${pct(e.expectedBusinessPayoff, 1)}</b><small>Business payoff</small></span>
      <span><b>${pct(e.riskSigma, 0)}</b><small>Risk</small></span>
      <span><b>${signed(e.lakeHealthIntensity, 2)}</b><small>Lake intensity</small></span>
      <span><b>${signed(e.localProsperityIntensity, 2)}</b><small>Prosperity intensity</small></span>
    </div>
    ${actual !== null ? `
      <div class="entity-after-run">
        <span>After clearing</span>
        <strong>${signed(actual, 1)} capital</strong>
        <small>Lake ${signed(lakeEff, 1)} · Prosperity ${signed(prosperEff, 1)}</small>
      </div>` : `<p class="microcopy">Click Run economy to reveal how offers translate into actual capital for this lake.</p>`}
  `;
}

function renderResults() {
  const score = state.lastScore;
  if (!score) {
    elements.resultSummary.innerHTML = `
      <div class="empty-result">
        <strong>Choose offers, then run the economy.</strong>
        <span>The chart will compare your cleared result with the playable frontier for this goal.</span>
      </div>`;
    elements.resultTable.innerHTML = '';
    renderFrontierChart(elements.chartBox, null, null);
    elements.bestReadout.textContent = state.bestScore ? `${Math.round(state.bestScore.frontierRecovery * 100)}% best in this lake` : 'No run yet';
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
      ${cards.map((e, i) => `
        <div class="response-row">
          <span>${e.short}</span>
          <b>${state.tokens[i]}</b>
          <b>${signed(score.current.deltaK[i], 1)}</b>
          <small>${signed(score.current.lakeContribution[i], 1)} lake</small>
          <small>${signed(score.current.prosperityContribution[i], 1)} local</small>
        </div>`).join('')}
    </div>
    <div class="table-key"><span>Your offer</span><span>Actual capital</span><span>Outcome effects</span></div>`;

  renderFrontierChart(elements.chartBox, score.grid, score);
  elements.bestReadout.textContent = state.bestScore ? `${Math.round(state.bestScore.frontierRecovery * 100)}% best in this lake` : 'No run yet';
}

function renderButtons() {
  const total = sum(state.tokens);
  elements.runBtn.disabled = total !== 100;
  elements.runBtn.title = total === 100 ? 'Clear this lake economy' : 'Allocate exactly 100 offer tokens first';
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
            <p>Use this slot for the paper abstract, screenshot, download button, or embedded preview.</p>
            <div class="screenshot-slot">Paper screenshot / PDF preview</div>
          </article>
          <article class="research-card">
            <span class="eyebrow">Paper 2</span>
            <h3>Shifting the Frontier</h3>
            <p>Use this slot for the companion paper and future extensions: coalitions, stewardship, policy.</p>
            <div class="screenshot-slot">Paper screenshot / PDF preview</div>
          </article>
        </div>
        <section class="html-slot" id="papers-html-slot">
          <h3>Research HTML slot</h3>
          <p>Drop your existing paper cards, screenshots, citation blocks, or download links here. The lake remains behind the panel instead of being hidden by the game.</p>
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
            <p>The game uses the guide's ordering: choose the goal first, then judge strategy against the frontier.</p>
            <div class="screenshot-slot">Guide screenshot / chapter cards</div>
          </article>
          <article class="research-card">
            <span class="eyebrow">Coming soon</span>
            <h3>Lake Economy play notes</h3>
            <p>Short explainers can live here for readers who want the intuition before playing.</p>
          </article>
        </div>`
    };
  }
  return {
    title: 'Methods',
    body: `
      <section class="method-copy">
        <p>The prototype treats offers as supply-curve shifts, then clears a six-entity lake economy in levels. The visible distinction is intentional: your offer vector is not the same object as capital actually added.</p>
        <pre><code>K(b) = solve(PhiS + B, a_demand + PhiS × (c_supply + s_player(b)))
P(b) = a_demand - B × K(b)</code></pre>
        <p>The frontier chart uses expected outcome change on the horizontal axis and risk-adjusted return on the vertical axis.</p>
      </section>`
  };
}

init();
