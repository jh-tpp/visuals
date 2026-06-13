import {
  generateLakeEconomy,
  getNextSeed,
  offerTotal,
  presetOffers,
  computeFrontier,
  scoreRun,
  goalLabel,
  statScale,
} from './economy.js';
import { LakeScene } from './scene.js';
import { renderFrontierChart } from './chart.js';

const state = {
  seed: readSeedFromUrl() || 104729,
  economy: null,
  lakeWeight: 0.5,
  offers: [0, 0, 0, 0, 0, 0],
  frontier: null,
  result: null,
  bestResult: null,
  hasRun: false,
  scene: null,
};

const refs = {};

document.addEventListener('DOMContentLoaded', () => {
  collectRefs();
  state.scene = new LakeScene(refs.canvas);
  bindEvents();
  createLake(state.seed, true);
  state.scene.start();
  showModal(refs.goalModal);
});

function collectRefs() {
  refs.canvas = document.querySelector('#lake-canvas');
  refs.goalModal = document.querySelector('#goal-modal');
  refs.offerModal = document.querySelector('#offer-modal');
  refs.resultsModal = document.querySelector('#results-modal');
  refs.infoModal = document.querySelector('#info-modal');
  refs.researchPanel = document.querySelector('#research-panel');
  refs.toast = document.querySelector('#toast');
  refs.openOffersButton = document.querySelector('#open-offers');
  refs.openResearch = document.querySelector('#open-research');
  refs.closeResearch = document.querySelector('#close-research');
  refs.closeInfo = document.querySelector('#close-info');
  refs.goalSlider = document.querySelector('#goal-slider');
  refs.goalSliderLabel = document.querySelector('#goal-slider-label');
  refs.goalContinue = document.querySelector('#goal-continue');
  refs.goalCards = document.querySelectorAll('[data-goal-preset]');
  refs.offerList = document.querySelector('#offer-list');
  refs.budgetRemaining = document.querySelector('#budget-remaining');
  refs.budgetBar = document.querySelector('#budget-bar');
  refs.runEconomy = document.querySelector('#run-economy');
  refs.offerGoalLabel = document.querySelector('#offer-goal-label');
  refs.offerScenario = document.querySelector('#offer-scenario');
  refs.changeGoalFromOffers = document.querySelector('#change-goal-from-offers');
  refs.startFreshFromOffers = document.querySelector('#start-fresh-from-offers');
  refs.newLakeFromOffers = document.querySelector('#new-lake-from-offers');
  refs.presetButtons = document.querySelectorAll('[data-preset]');
  refs.resultsBody = document.querySelector('#results-body');
  refs.resultsChart = document.querySelector('#frontier-chart');
  refs.adjustOffers = document.querySelector('#adjust-offers');
  refs.startFreshFromResults = document.querySelector('#start-fresh-from-results');
  refs.newLakeFromResults = document.querySelector('#new-lake-from-results');
  refs.changeGoalFromResults = document.querySelector('#change-goal-from-results');
  refs.howWorks = document.querySelector('#how-works');
}

function bindEvents() {
  refs.openResearch.addEventListener('click', openResearch);
  refs.closeResearch.addEventListener('click', closeResearch);
  refs.closeInfo.addEventListener('click', () => hideModal(refs.infoModal));
  refs.howWorks.addEventListener('click', () => showModal(refs.infoModal));

  refs.goalSlider.addEventListener('input', event => {
    state.lakeWeight = Number(event.target.value) / 100;
    renderGoalText();
  });
  refs.goalCards.forEach(card => {
    card.addEventListener('click', () => {
      const value = Number(card.dataset.goalPreset);
      state.lakeWeight = value;
      refs.goalSlider.value = Math.round(value * 100);
      renderGoalText();
      refs.goalCards.forEach(c => c.classList.toggle('is-selected', c === card));
    });
  });
  refs.goalContinue.addEventListener('click', () => {
    recomputeFrontier();
    renderOfferModal();
    hideModal(refs.goalModal);
    showModal(refs.offerModal);
  });

  refs.openOffersButton.addEventListener('click', () => {
    renderOfferModal();
    showModal(refs.offerModal);
  });

  refs.presetButtons.forEach(button => {
    button.addEventListener('click', () => {
      const kind = button.dataset.preset;
      if (kind === 'frontierHint' && !state.hasRun) {
        toast('Run the same lake once before asking for a response-aware hint.');
        return;
      }
      state.offers = presetOffers(kind, state.economy, state.lakeWeight, state.frontier).slice();
      state.scene.setOffers(state.offers);
      renderOfferModal();
      toast(presetToast(kind));
    });
  });

  refs.runEconomy.addEventListener('click', runEconomy);
  refs.changeGoalFromOffers.addEventListener('click', () => {
    hideModal(refs.offerModal);
    showModal(refs.goalModal);
  });
  refs.startFreshFromOffers.addEventListener('click', startFresh);
  refs.newLakeFromOffers.addEventListener('click', newLake);
  refs.adjustOffers.addEventListener('click', () => {
    renderOfferModal();
    hideModal(refs.resultsModal);
    showModal(refs.offerModal);
  });
  refs.startFreshFromResults.addEventListener('click', startFresh);
  refs.newLakeFromResults.addEventListener('click', newLake);
  refs.changeGoalFromResults.addEventListener('click', () => {
    hideModal(refs.resultsModal);
    showModal(refs.goalModal);
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (refs.researchPanel.classList.contains('is-open')) closeResearch();
    else if (!refs.resultsModal.hidden) hideModal(refs.resultsModal);
    else if (!refs.offerModal.hidden) hideModal(refs.offerModal);
    else if (!refs.infoModal.hidden) hideModal(refs.infoModal);
  });
}

function createLake(seed, first = false) {
  state.seed = seed >>> 0;
  state.economy = generateLakeEconomy(state.seed);
  state.offers = [0, 0, 0, 0, 0, 0];
  state.result = null;
  state.bestResult = null;
  state.hasRun = false;
  state.frontier = null;
  state.scene.setEconomy(state.economy);
  state.scene.setOffers(state.offers);
  state.scene.clearResult();
  updateUrlSeed(state.seed);
  renderGoalText();
  refs.openOffersButton.hidden = true;
  if (!first) {
    hideModal(refs.offerModal);
    hideModal(refs.resultsModal);
    showModal(refs.goalModal);
    toast(`New lake generated: ${state.economy.templateName}.`);
  }
}

function recomputeFrontier() {
  refs.goalContinue.disabled = true;
  refs.goalContinue.textContent = 'Computing frontier…';
  // Work synchronously; the grid is intentionally small for homepage MVP performance.
  state.frontier = computeFrontier(state.economy, state.lakeWeight, 10);
  refs.goalContinue.disabled = false;
  refs.goalContinue.textContent = 'Continue to offers';
  if (state.result && Math.abs(offerTotal(state.offers) - 100) < 0.001) {
    state.result = scoreRun(state.economy, state.offers, state.lakeWeight, state.frontier);
  }
}

function renderGoalText() {
  const lakePct = Math.round(state.lakeWeight * 100);
  const prosperityPct = 100 - lakePct;
  refs.goalSlider.value = lakePct;
  refs.goalSliderLabel.textContent = `${lakePct}% lake health · ${prosperityPct}% local prosperity`;
  refs.goalCards.forEach(card => {
    card.classList.toggle('is-selected', Math.abs(Number(card.dataset.goalPreset) - state.lakeWeight) < 0.01);
  });
}

function renderOfferModal() {
  if (!state.frontier) recomputeFrontier();
  const total = offerTotal(state.offers);
  const remaining = Math.max(0, 100 - total);
  refs.offerGoalLabel.textContent = `${goalLabel(state.lakeWeight)} goal · ${Math.round(state.lakeWeight * 100)}% lake / ${100 - Math.round(state.lakeWeight * 100)}% prosperity`;
  refs.offerScenario.textContent = `${state.economy.templateName}: ${state.economy.scenarioNote}`;
  refs.budgetRemaining.textContent = `${Math.round(remaining)} tokens unallocated`;
  refs.budgetBar.style.width = `${Math.max(0, Math.min(100, total))}%`;
  refs.runEconomy.disabled = Math.abs(total - 100) > 0.001;
  refs.runEconomy.title = refs.runEconomy.disabled ? 'Allocate all 100 offer tokens before running the economy.' : 'Solve the lake economy with these offers.';

  refs.offerList.innerHTML = '';
  state.economy.entities.forEach((entity, i) => {
    refs.offerList.appendChild(createOfferCard(entity, i));
  });

  document.querySelector('[data-preset="frontierHint"]').disabled = !state.hasRun;
}

function createOfferCard(entity, i) {
  const value = state.offers[i] || 0;
  const card = document.createElement('article');
  card.className = 'offer-card';
  card.innerHTML = `
    <div class="offer-card__header">
      <div>
        <h3>${escapeHtml(entity.name)}</h3>
        <p>${escapeHtml(entity.role)}</p>
      </div>
      <output class="offer-value" for="offer-${i}">${Math.round(value)}</output>
    </div>
    <div class="stat-grid" aria-label="Visible firm statistics">
      ${metric('Business payoff', entity.expectedBusinessPayoff, statScale(entity.expectedBusinessPayoff, 0.65, 1.40))}
      ${metric('Risk', entity.risk, statScale(entity.risk, 0.30, 1.05), true)}
      ${metric('Lake health', entity.lakeIntensity, statScale(entity.lakeIntensity, -1.25, 0.45), false, entity.lakeIntensity < 0)}
      ${metric('Local prosperity', entity.prosperityIntensity, statScale(entity.prosperityIntensity, 0.35, 1.35))}
    </div>
    <label class="slider-row" for="offer-${i}">
      <span>Your offer strength</span>
      <input id="offer-${i}" type="range" min="0" max="100" value="${value}" step="1" data-offer-index="${i}">
    </label>
  `;
  const input = card.querySelector('input');
  input.addEventListener('input', event => {
    setOffer(i, Number(event.target.value));
  });
  return card;
}

function metric(label, value, pct, risk = false, isNegative = false) {
  const display = risk ? `${Math.round(value * 100)}%` : value.toFixed(2);
  const tone = isNegative ? 'negative' : risk ? 'risk' : 'normal';
  return `
    <div class="metric metric--${tone}">
      <span>${label}</span>
      <strong>${display}</strong>
      <i style="--pct:${Math.round(pct * 100)}%"></i>
    </div>
  `;
}

function setOffer(index, requested) {
  const old = state.offers[index] || 0;
  const others = offerTotal(state.offers) - old;
  const allowed = Math.max(0, 100 - others);
  const next = clamp(Math.round(requested), 0, allowed);
  state.offers[index] = next;
  state.result = null;
  state.scene.setOffers(state.offers);
  state.scene.clearResult();
  renderOfferModal();
}

function runEconomy() {
  if (!state.frontier) recomputeFrontier();
  const total = offerTotal(state.offers);
  if (Math.abs(total - 100) > 0.001) {
    toast(`Allocate the remaining ${Math.round(100 - total)} tokens before running.`);
    return;
  }
  state.result = scoreRun(state.economy, state.offers, state.lakeWeight, state.frontier);
  state.hasRun = true;
  if (!state.bestResult || scoreValue(state.result) > scoreValue(state.bestResult)) {
    state.bestResult = state.result;
  }
  state.scene.setResult(state.result);
  renderResultsModal();
  hideModal(refs.offerModal);
  showModal(refs.resultsModal);
  refs.openOffersButton.hidden = false;
}

function renderResultsModal() {
  const r = state.result;
  const best = state.bestResult;
  refs.resultsBody.innerHTML = `
    <section class="result-hero">
      <div>
        <p class="eyebrow">${escapeHtml(state.economy.templateName)} · ${escapeHtml(goalLabel(state.lakeWeight))} goal</p>
        <h2>${escapeHtml(r.frontierScoreLabel)}</h2>
        <p>Your offers shifted capital supply. The lake economy then cleared, so actual capital added differs from the offers you set.</p>
      </div>
      <div class="score-ring" style="--score:${Math.round(r.frontierScore || 0)}">
        <strong>${r.frontierScore == null ? '—' : Math.round(r.frontierScore) + '%'}</strong>
        <span>frontier</span>
      </div>
    </section>
    <section class="result-stats">
      ${statCard('Blended outcome', signed(r.blendedOutcome), 'chosen goal')}
      ${statCard('Lake health', signed(r.lakeEffect), 'external outcome')}
      ${statCard('Local prosperity', signed(r.prosperityEffect), 'external outcome')}
      ${statCard('Risk-adjusted return', signed(r.riskAdjustedReturn), 'higher is better')}
    </section>
    <section class="best-note">
      <strong>Best in this lake:</strong> ${best && best.frontierScore != null ? `${Math.round(best.frontierScore)}% frontier score` : 'No scored run yet'}.
      Try changing offers while keeping the same lake to infer the hidden response system.
    </section>
    <section class="response-table-wrap">
      <h3>Offers versus actual capital response</h3>
      <div class="response-table" role="table" aria-label="Player offers versus actual capital added">
        <div role="row" class="response-row response-row--head">
          <span>Entity</span><span>Your offer</span><span>Actual capital added</span><span>Lake effect</span><span>Prosperity effect</span>
        </div>
        ${r.perEntity.map(row => `
          <div role="row" class="response-row">
            <span>${escapeHtml(row.name)}</span>
            <span>${Math.round(row.offer)}</span>
            <span class="${row.deltaK < 0 ? 'neg' : 'pos'}">${signed(row.deltaK)}</span>
            <span class="${row.lakeEffect < 0 ? 'neg' : 'pos'}">${signed(row.lakeEffect)}</span>
            <span class="${row.prosperityEffect < 0 ? 'neg' : 'pos'}">${signed(row.prosperityEffect)}</span>
          </div>
        `).join('')}
      </div>
    </section>
  `;
  renderFrontierChart(refs.resultsChart, state.frontier, r);
}

function statCard(label, value, note) {
  return `<article><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`;
}

function startFresh() {
  state.offers = [0, 0, 0, 0, 0, 0];
  state.result = null;
  state.scene.setOffers(state.offers);
  state.scene.clearResult();
  hideModal(refs.resultsModal);
  renderOfferModal();
  showModal(refs.offerModal);
  toast('Start fresh: same lake, 100 offer tokens back in the pool.');
}

function newLake() {
  createLake(getNextSeed(state.seed));
}

function openResearch() {
  refs.researchPanel.classList.add('is-open');
  refs.researchPanel.setAttribute('aria-hidden', 'false');
  refs.openResearch.setAttribute('aria-expanded', 'true');
}

function closeResearch() {
  refs.researchPanel.classList.remove('is-open');
  refs.researchPanel.setAttribute('aria-hidden', 'true');
  refs.openResearch.setAttribute('aria-expanded', 'false');
}

function showModal(modal) {
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('is-open'));
}

function hideModal(modal) {
  modal.classList.remove('is-open');
  modal.hidden = true;
}

function toast(message) {
  refs.toast.textContent = message;
  refs.toast.hidden = false;
  refs.toast.classList.add('is-visible');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    refs.toast.classList.remove('is-visible');
    setTimeout(() => { refs.toast.hidden = true; }, 260);
  }, 2400);
}

function presetToast(kind) {
  if (kind === 'business') return 'Preset applied: all offers to the highest expected business payoff.';
  if (kind === 'rawOutcome') return 'Preset applied: all offers to the highest raw outcome intensity for your goal.';
  if (kind === 'equal') return 'Preset applied: equal offers across the six entities.';
  if (kind === 'frontierHint') return 'Response-aware hint applied. It uses what the frontier solver learned about this lake.';
  return 'Preset applied.';
}

function scoreValue(result) {
  if (!result || result.frontierScore == null) return -Infinity;
  return result.frontierScore;
}

function signed(value) {
  const v = Number(value) || 0;
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}`;
}

function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

function escapeHtml(str) {
  return String(str).replace(/[&<>'"]/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[ch]));
}

function readSeedFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const seed = Number(params.get('seed'));
  return Number.isFinite(seed) ? seed : null;
}

function updateUrlSeed(seed) {
  const url = new URL(window.location.href);
  url.searchParams.set('seed', String(seed));
  window.history.replaceState({}, '', url);
}
