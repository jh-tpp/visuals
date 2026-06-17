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

let rootNode = document;
let cleanupCurrent = null;
let activeController = null;

const $ = (sel, root = rootNode) => root.querySelector(sel);
const $$ = (sel, root = rootNode) => Array.from(root.querySelectorAll(sel));

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function sum(v) { return v.reduce((a, b) => a + b, 0); }
function fmt(v, digits = 1) { return Number.isFinite(v) ? v.toFixed(digits) : '—'; }
function signed(v, digits = 1) { return Number.isFinite(v) ? `${v >= 0 ? '+' : ''}${v.toFixed(digits)}` : '—'; }
function pct(v, digits = 1) { return Number.isFinite(v) ? `${(v * 100).toFixed(digits)}%` : '—'; }
function metricScale(value, { max = 1, signed: isSigned = true } = {}) {
  if (!Number.isFinite(value)) return '';
  if (!isSigned) {
    const fill = clamp(Math.abs(value) / max, 0, 1) * 100;
    return `<i class="metric-scale positive-only" aria-hidden="true"><em style="width:${fill.toFixed(1)}%"></em></i>`;
  }
  const fill = clamp(Math.abs(value) / max, 0, 1) * 50;
  const style = value >= 0
    ? `left:50%;width:${fill.toFixed(1)}%`
    : `left:${(50 - fill).toFixed(1)}%;width:${fill.toFixed(1)}%`;
  return `<i class="metric-scale signed ${value >= 0 ? 'positive' : 'negative'}" aria-hidden="true"><em style="${style}"></em></i>`;
}

const state = {
  lakeIndex: 0,
  seed: 'lake-2026-a',
  templateKey: 'feed-bottleneck',
  goalWeight: null,
  goalChosen: false,
  tokens: [0, 0, 0, 0, 0, 0],
  lastScore: null,
  bestScore: null,
  cityMode: 'town',
  frontierCache: new Map(),
  selectedEntity: null,
  panelOpen: false,
  panelMode: null,
  frontierModalOpen: false
};

const CITY_MODES = ['town', 'skyline', 'network'];

let params;
let scene;
let elements;

export function initLakeEconomy(rootElement = document) {
  if (cleanupCurrent) cleanupCurrent();

  rootNode = rootElement;
  activeController = new AbortController();
  init(activeController.signal);

  cleanupCurrent = () => {
    activeController?.abort();
    scene?.dispose?.();
    cleanupCurrent = null;
    activeController = null;
  };

  return cleanupCurrent;
}

function init(signal) {
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
    cityModeBtn: $('#cityModeBtn'),
    resultSection: $('#resultSection'),
    resultSummary: $('#resultSummary'),
    resultTable: $('#resultTable'),
    chartBox: $('#frontierChart'),
    expandFrontierBtn: $('#expandFrontierBtn'),
    frontierModal: $('#frontierModal'),
    frontierModalChart: $('#frontierModalChart'),
    closeFrontierModal: $('#closeFrontierModal'),
    bestReadout: $('#bestReadout'),
    topbar: $('.topbar'),
    topButtons: $$('.top-nav [data-panel]'),
    panelButtons: $$('[data-panel]'),
    playButtons: $$('[data-open-play]'),
    welcomePanel: $('#welcomePanel'),
    contentPanel: $('#contentPanel'),
    contentTitle: $('#contentTitle'),
    contentBody: $('#contentBody'),
    closeContent: $('#closeContent'),
    entityPopup: $('#entityPopup')
  };

  updateTopOffsets();
  params = buildLakeParams({ seed: state.seed, templateKey: state.templateKey, lakeOutcomeWeight: 0.50 });
  scene = new LakeScene({
    canvas: elements.canvas,
    labelRoot: elements.labels,
    onEntitySelect: openEntityPopup
  });
  scene.setFrameCallback(() => positionEntityPopup());
  scene.setLake(params);
  scene.updateState({ offers: state.tokens, lastRun: null });
  scene.updateOutcomeVisuals();
  scene.setCityMode(state.cityMode);

  bindEvents(signal);
  renderAll();
}

function on(target, type, handler, signal) {
  if (!target) return;
  target.addEventListener(type, handler, { signal });
}

function bindEvents(signal) {
  on(elements.panelToggle, 'click', () => {
    dismissWelcome();
    setPanelOpen(!state.panelOpen);
  }, signal);
  on(elements.canvas, 'pointerdown', dismissWelcome, signal);
  on(elements.minimizePanel, 'click', () => setPanelOpen(false), signal);
  on(elements.goalSlider, 'input', () => setGoal(1 - Number(elements.goalSlider.value) / 100), signal);
  elements.goalButtons.forEach(btn => on(btn, 'click', () => setGoal(Number(btn.dataset.goal) / 100), signal));
  elements.presetButtons.forEach(btn => on(btn, 'click', () => applyPreset(btn.dataset.preset), signal));
  on(elements.runBtn, 'click', runEconomy, signal);
  on(elements.freshBtn, 'click', startFresh, signal);
  on(elements.newLakeBtn, 'click', newLake, signal);
  on(elements.resetViewBtn, 'click', () => {
    scene.resetView();
    scene.updateState({ offers: state.tokens, lastRun: null });
    scene.updateOutcomeVisuals();
  }, signal);
  on(elements.cityModeBtn, 'click', toggleCityMode, signal);
  on(elements.expandFrontierBtn, 'click', openFrontierModal, signal);
  on(elements.chartBox, 'click', openFrontierModal, signal);
  on(elements.closeFrontierModal, 'click', closeFrontierModal, signal);
  on(elements.frontierModal, 'pointerdown', e => {
    if (e.target === elements.frontierModal) closeFrontierModal();
  }, signal);
  elements.panelButtons.forEach(btn => on(btn, 'click', () => {
    dismissWelcome();
    toggleContentPanel(btn.dataset.panel);
  }, signal));
  elements.playButtons.forEach(btn => on(btn, 'click', () => {
    dismissWelcome();
    closeContentPanel();
    setPanelOpen(true);
  }, signal));
  on(elements.closeContent, 'click', closeContentPanel, signal);
  on(elements.contentPanel, 'pointerdown', e => {
    if (e.target === elements.contentPanel) closeContentPanel();
  }, signal);
  on(document, 'pointerdown', e => {
    const target = e.target;
    if (elements.entityPopup.classList.contains('hidden')) return;
    if (elements.entityPopup.contains(target)) return;
    if (target.closest?.('.world-label, [data-select]')) return;
    closeEntityPopup();
  }, signal);
  on(document, 'keydown', e => {
    if (e.key === 'Escape') {
      closeEntityPopup();
      closeContentPanel();
      closeFrontierModal();
    }
  }, signal);
  on(window, 'resize', updateTopOffsets, signal);

  if ('ResizeObserver' in window && elements.topbar) {
    const topbarObserver = new ResizeObserver(updateTopOffsets);
    topbarObserver.observe(elements.topbar);
    signal.addEventListener('abort', () => topbarObserver.disconnect(), { once: true });
  }
}

function updateTopOffsets() {
  const rect = elements.topbar?.getBoundingClientRect();
  if (!rect) return;

  const gap = window.innerWidth <= 860 ? 12 : 14;
  const topbarBottom = Math.ceil(rect.bottom);
  const panelToggleTop = topbarBottom + gap;
  const welcomeTop = panelToggleTop + 52;

  document.documentElement.style.setProperty('--lake-panel-toggle-top', `${panelToggleTop}px`);
  document.documentElement.style.setProperty('--lake-welcome-top', `${welcomeTop}px`);
  document.documentElement.style.setProperty('--lake-panel-top', `${welcomeTop + 46}px`);
}

function dismissWelcome() {
  elements.welcomePanel?.classList.add('hidden');
}

function setPanelOpen(open) {
  state.panelOpen = open;
  elements.playPanel.classList.toggle('collapsed', !open);
  elements.panelToggle.setAttribute('aria-expanded', String(open));
  elements.panelToggle.textContent = open ? 'Playing' : 'Play';
  elements.playButtons.forEach(btn => btn.classList.toggle('active', open));
}

function toggleCityMode() {
  dismissWelcome();
  const index = CITY_MODES.indexOf(state.cityMode);
  state.cityMode = CITY_MODES[(index + 1) % CITY_MODES.length];
  scene.setCityMode(state.cityMode);
  scene.updateState({ offers: state.tokens, lastRun: state.lastScore?.current ?? null });
  scene.updateOutcomeVisuals(state.lastScore
    ? {
        lake: state.lastScore.lakeGainVsEqual,
        prosperity: state.lastScore.prosperityGainVsEqual
      }
    : {});
  renderAll();
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
  renderAll();
}

function applyPreset(preset) {
  if (!state.goalChosen) return;
  const presets = makePresets(params, state.goalWeight);
  let shares = presets.equal;
  if (preset === 'return') shares = presets.highestBusinessReturn;
  if (preset === 'outcome') shares = presets.highestRawOutcome;
  state.tokens = tokenVectorFromShares(shares);
  clearStaleRun();
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
  clearStaleRun();
}

function clearStaleRun() {
  state.lastScore = null;
  closeFrontierModal();
  scene.updateState({ offers: state.tokens });
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
  scene.updateOutcomeVisuals({
    lake: state.lastScore.lakeGainVsEqual,
    prosperity: state.lastScore.prosperityGainVsEqual
  });
  renderAll();
}

function startFresh() {
  state.tokens = [0, 0, 0, 0, 0, 0];
  state.lastScore = null;
  closeFrontierModal();
  closeEntityPopup();
  scene.updateState({ offers: state.tokens, lastRun: null });
  scene.updateOutcomeVisuals();
  renderAll();
}

function newLake() {
  state.lakeIndex += 1;
  const template = templateForIndex(state.lakeIndex);
  state.templateKey = template.key;
  state.seed = `lake-${2026 + state.lakeIndex}-${template.key}`;
  state.tokens = [0, 0, 0, 0, 0, 0];
  state.lastScore = null;
  state.bestScore = null;
  closeFrontierModal();
  state.frontierCache.clear();
  closeEntityPopup();
  params = buildLakeParams({ seed: state.seed, templateKey: state.templateKey, lakeOutcomeWeight: state.goalChosen ? state.goalWeight : 0.5 });
  scene.setLake(params);
  scene.updateState({ offers: state.tokens, lastRun: null });
  scene.updateOutcomeVisuals();
  renderAll();
}

function renderAll() {
  renderScenario();
  renderGoal();
  renderOfferRows();
  renderResults();
  renderFlowLocks();
  renderButtons();
  renderCityMode();
  renderEntityPopup();
}

function renderCityMode() {
  if (!elements.cityModeBtn) return;
  const skyline = state.cityMode === 'skyline';
  const network = state.cityMode === 'network';
  rootNode.classList.toggle('light-network-mode', network);
  elements.cityModeBtn.classList.toggle('active', skyline || network);
  elements.cityModeBtn.setAttribute('aria-pressed', String(skyline || network));
  elements.cityModeBtn.textContent = skyline ? 'Light network' : network ? 'Harbor town' : 'City skyline';
}

function renderScenario() {
  if (elements.scenarioName) elements.scenarioName.textContent = `Scenario: ${params.template.name}`;
  if (elements.scenarioText) elements.scenarioText.textContent = params.template.story;
  if (elements.scenarioNote) elements.scenarioNote.textContent = params.template.note;
  if (elements.lakeSeed) elements.lakeSeed.textContent = params.seed;
}

function renderGoal() {
  if (!state.goalChosen) {
    elements.goalSlider.value = 50;
    elements.goalReadout.textContent = 'No goal selected';
    elements.goalHint.textContent = 'The same outcomes can look different given different goals.';
    elements.goalButtons.forEach(btn => btn.classList.remove('active'));
    return;
  }
  const lakePct = Math.round(state.goalWeight * 100);
  const prosperityPct = 100 - lakePct;
  elements.goalSlider.value = prosperityPct;
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
  elements.offersList.innerHTML = cards.map((e, i) => {
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
  return `${pct(e.expectedBusinessReturn, 1)} return · ${lake}`;
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
    renderFrontierChart(elements.frontierModalChart, null, null);
    elements.chartBox.disabled = true;
    elements.expandFrontierBtn.disabled = true;
    elements.chartBox.classList.remove('interactive');
    elements.bestReadout.textContent = state.bestScore ? `${Math.round(state.bestScore.frontierRecovery * 100)}% best in this lake` : 'No run yet';
    return;
  }

  const recovery = Math.round(score.frontierRecovery * 100);
  const positiveOutcome = score.blendedGainVsEqual >= 0;
  const positiveReturn = score.playerCE >= 0;
  const playerCEPercent = score.playerCE * 100;
  elements.resultSummary.innerHTML = `
    <div class="score-card ${recovery >= 85 ? 'strong' : recovery >= 55 ? 'ok' : 'learning'}">
      <span>Frontier score</span>
      <strong>${recovery}%</strong>
      <small>${recovery >= 85 ? 'Close to the frontier for this goal.' : "You're still leaving value on the table."}</small>
    </div>
    <div class="meter-row">
      <div class="mini-meter">
        <span>Expected outcome change</span>
        <strong class="${positiveOutcome ? 'pos' : 'neg'}">${signed(score.blendedGainVsEqual, 2)}</strong>
        <i style="--fill:${clamp(50 + score.blendedGainVsEqual * 7, 4, 96)}%"></i>
      </div>
      <div class="mini-meter">
        <span>Risk-adjusted return (%)</span>
        <strong class="${positiveReturn ? 'pos' : 'neg'}">${fmt(playerCEPercent, 2)}</strong>
        <i style="--fill:${clamp(playerCEPercent * 18, 4, 96)}%"></i>
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
    <div class="table-key"><span>Entity</span><span>Your offer</span><span>Actual capital</span><span>Your ΔK</span><span>Other investors</span></div>`;

  renderFrontierChart(elements.chartBox, score.grid, score);
  renderFrontierChart(elements.frontierModalChart, score.grid, score);
  elements.chartBox.disabled = false;
  elements.expandFrontierBtn.disabled = false;
  elements.chartBox.classList.add('interactive');
  elements.bestReadout.textContent = state.bestScore ? `${Math.round(state.bestScore.frontierRecovery * 100)}% best in this lake` : 'No run yet';
}

function openFrontierModal() {
  if (!state.lastScore || !elements.frontierModal) return;
  state.frontierModalOpen = true;
  renderFrontierChart(elements.frontierModalChart, state.lastScore.grid, state.lastScore);
  elements.frontierModal.classList.remove('hidden');
  elements.closeFrontierModal?.focus();
}

function closeFrontierModal() {
  if (!elements?.frontierModal) return;
  state.frontierModalOpen = false;
  elements.frontierModal.classList.add('hidden');
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
    ? 'Clear this lake economy'
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
        <h3>${e.name}</h3>
      </div>
      <button type="button" class="popup-close" aria-label="Close entity popup">×</button>
    </div>
    <div class="stat-grid">
      <span><b>${pct(e.expectedBusinessReturn, 1)}</b>${metricScale(e.expectedBusinessReturn, { max: 0.25 })}<small>Expected return</small></span>
      <span><b>${pct(e.riskSigma, 0)}</b>${metricScale(e.riskSigma, { max: 0.35, signed: false })}<small>Risk</small></span>
      <span><b>${signed(e.lakeHealthIntensity, 2)}</b>${metricScale(e.lakeHealthIntensity, { max: 1 })}<small>Lake health score</small></span>
      <span><b>${signed(e.localProsperityIntensity, 2)}</b>${metricScale(e.localProsperityIntensity, { max: 1 })}<small>Prosperity score</small></span>
    </div>
    ${actual !== null ? `
      <div class="entity-after-run">
        <span>After the economy clears, relative to the equal-offer baseline</span>
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

function toggleContentPanel(mode) {
  if (state.panelMode === mode && !elements.contentPanel.classList.contains('hidden')) {
    closeContentPanel();
    return;
  }

  openContentPanel(mode);
}

function closeContentPanel() {
  state.panelMode = null;
  elements.contentPanel.classList.add('hidden');
  elements.topButtons.forEach(btn => btn.classList.remove('active'));
}

function contentForMode(mode) {
  if (mode === 'about') {
    return {
      title: 'About',
      body: `
        <section class="about-layout">
          <article class="about-lede">
            <span class="eyebrow">What this is</span>
            <h3>Interactive research.</h3>
            <!-- REVIEW COPY: Jonathan may want to rephrase this About-panel language. -->
            <p>The Impact Frontier studies investor impact as a market response, not just a company score. The Lake Economy makes that idea playable.</p>
            <p>You make investment offers. The model financial market responds. The result shows what actually got funded, how lake health and local prosperity changed, and how close the strategy came to the frontier.</p>
             <p>The demo is stylized. It is not a forecast or a calibrated policy model. It is a way to make the research intuition visible: impact and financial returns depend on the system, not just raw company impact or profitability in isolation.</p>
          </article>
          <article class="about-card collaboration-card">
            <span class="eyebrow">Collaboration</span>
            <h3>Connected academic and applied work</h3>
            <p>This work is connected to research and guide materials developed with CSP, MIT Sloan Sustainability Initiative, Stanford PACS, the University of St.Gallen, and Impact Frontiers.</p>
            <div class="partner-logo-row" aria-label="Collaborating organizations">
              <a class="partner-logo partner-logo-wide" href="https://www.cspglobal.org/" target="_blank" rel="noopener noreferrer" aria-label="Visit CSP">
                <img src="/logos/CSP Logo-01.png" alt="CSP">
              </a>
              <a class="partner-logo partner-logo-wide" href="https://mitsloan.mit.edu/sustainability-initiative" target="_blank" rel="noopener noreferrer" aria-label="Visit MIT Sloan Sustainability Initiative">
                <img src="/logos/MITSloanLogo_MASTER-Horizontal_Print.png" alt="MIT Sloan Sustainability Initiative">
              </a>
              <a class="partner-logo partner-logo-wide" href="https://pacscenter.stanford.edu/" target="_blank" rel="noopener noreferrer" aria-label="Visit Stanford PACS">
                <img src="/logos/StanfordPACS_4C_HR_RGB 1.png" alt="Stanford PACS">
              </a>
              <a class="partner-logo partner-logo-wide" href="https://www.unisg.ch/en/" target="_blank" rel="noopener noreferrer" aria-label="Visit the University of St.Gallen">
                <img src="/logos/HSG_Logo_EN_RGB.png" alt="University of St.Gallen">
              </a>
              <a class="partner-logo partner-logo-impact-frontiers" href="https://impactfrontiers.org/" target="_blank" rel="noopener noreferrer" aria-label="Visit Impact Frontiers">
                <img src="/logos/impactfrontiers.jpg" alt="Impact Frontiers">
              </a>
            </div>
          </article>
        </section>`
    };
  }

  if (mode === 'papers') {
    return {
      title: 'Papers',
      body: `
        <p class="panel-intro">The technical results that inspired the model.</p>
        <div class="paper-stack">
          <article class="paper-hero-card">
            <img class="paper-cover-small" src="/papers/paper1.png" alt="The Impact Frontier paper preview">
            <div class="guide-copy">
              <span class="eyebrow">Paper 1</span>
              <h3>The Impact Frontier</h3>
              <!-- REVIEW COPY: replace with final abstract language if desired. -->
              <p>How portfolio tilts move capital, financial outcomes, and external outcomes through a financial market system. The Lake Economy is a stylized version of the core mechanism.</p>
              <p class="status-note">Working paper. Now available on SSRN.</p>
              <a class="research-action secondary-link" href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6859238" target="_blank" rel="noopener noreferrer">View on SSRN</a>
            </div>
          </article>
          <article class="paper-hero-card">
            <img class="paper-cover-small" src="/papers/paper2.png" alt="Shifting the Frontier paper preview">
            <div class="guide-copy">
              <span class="eyebrow">Paper 2</span>
              <h3>Shifting the Frontier</h3>
              <!-- REVIEW COPY: replace with final abstract language if desired. -->
              <p>How coalitions, policy, stewardship, and other instruments can shift the frontier itself, not just move along it.</p>
              <p class="status-note">In development. SSRN link coming soon.</p>
              <button class="research-action secondary-link disabled-action" type="button" disabled aria-disabled="true">View on SSRN</button>
            </div>
          </article>
        </div>`
    };
  }
  if (mode === 'guides') {
    return {
      title: 'Guides',
      body: `
        <p class="panel-intro">Start with the goal, then choose the strategy.</p>
        <div class="guide-stack">
          <section class="guide-hero-card">
            <img class="guide-cover-small" src="/guides/ig-goals-cover.jpg" alt="Investor's Guide to Goals-based Investing and Philanthropy cover">
            <div class="guide-copy">
              <span class="eyebrow">Current featured guide</span>
              <h3>Goals-based investing and philanthropy</h3>
              <!-- REVIEW COPY: Jonathan may want to adjust this practitioner-facing description. -->
              <p>A practical starting point for turning clear goals into coherent strategies across your portfolio.</p>
              <a class="research-action" href="https://www.cspglobal.org/research/publications/investors-guide-goals-based-investing-and-philanthropy" target="_blank" rel="noopener noreferrer">Open guide on CSP</a>
            </div>
          </section>
          <section class="guide-hero-card legacy-guide-card">
            <img class="guide-cover-small" src="/guides/three_cases_TPP.png" alt="Impact Returns: Three Case Studies report cover">
            <div class="guide-copy">
              <span class="eyebrow">Legacy report by Total Portfolio Project</span>
              <h3>Impact Returns: Three Case Studies</h3>
              <p>Three high-provenance cases and one next-generation approach to integrating impact and financial analysis.</p>
              <p class="status-note">Early Total Portfolio Project report, formerly featured and included here for legacy context.</p>
            </div>
          </section>
        </div>`
    };
  }

  return contentForMode('about');
}
