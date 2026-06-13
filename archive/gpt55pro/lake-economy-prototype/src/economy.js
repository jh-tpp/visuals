// Lake Economy MVP economic engine
// Browser-native ES module, no dependencies.
// Core loop: offers b -> Delta phi = alpha * b -> Delta K = C * Delta phi -> outcomes + frontier score.

export const ENTITIES = [
  {
    id: 'scalable-farm',
    name: 'Scalable fish farm',
    shortName: 'Scalable farm',
    role: 'Ambitious ponds that can grow quickly when the surrounding system works.',
    icon: 'ponds',
  },
  {
    id: 'steady-farm',
    name: 'Steady fish farm',
    shortName: 'Steady farm',
    role: 'Reliable production with lower risk and more modest scale.',
    icon: 'ponds-steady',
  },
  {
    id: 'feed-mill',
    name: 'Feed mill',
    shortName: 'Feed mill',
    role: 'A practical bottleneck: feed quality and availability shape farm viability.',
    icon: 'mill',
  },
  {
    id: 'hatchery',
    name: 'Hatchery',
    shortName: 'Hatchery',
    role: 'Young fish, survival rates, and biological reliability.',
    icon: 'hatchery',
  },
  {
    id: 'cold-chain',
    name: 'Cold chain / market access',
    shortName: 'Cold chain',
    role: 'Refrigeration, logistics, and routes to stable buyers.',
    icon: 'warehouse',
  },
  {
    id: 'lakefront-industry',
    name: 'Lakefront industry',
    shortName: 'Lakefront industry',
    role: 'Financially attractive and job-creating, with real pressure on lake health.',
    icon: 'factory',
  },
];

const TEMPLATE_NAMES = [
  'Feed bottleneck',
  'Market access bottleneck',
  'Scalable entrepreneur',
  'Dirty growth trap',
];

const BASE = {
  K0: [62, 54, 43, 35, 47, 59],
  mu: [1.02, 0.82, 0.74, 0.78, 0.88, 1.18],
  risk: [0.86, 0.48, 0.62, 0.72, 0.56, 0.70],
  gLake: [0.26, 0.24, 0.08, 0.20, 0.18, -0.92],
  gProsperity: [1.18, 0.82, 0.56, 0.48, 0.72, 1.05],
};

// Row = actual capital response in target entity, column = player offer destination.
const TEMPLATE_MATRICES = [
  {
    name: 'Feed bottleneck',
    note: 'Fish farms look promising, but feed quality and supply quietly determine how much farm capital can actually scale.',
    alpha: 0.165,
    K0: [64, 55, 41, 34, 46, 58],
    mu: [1.05, 0.82, 0.76, 0.78, 0.86, 1.12],
    risk: [0.88, 0.50, 0.64, 0.70, 0.55, 0.70],
    gLake: [0.30, 0.26, 0.02, 0.22, 0.20, -0.84],
    gProsperity: [1.22, 0.84, 0.58, 0.50, 0.68, 0.98],
    C: [
      [0.38, 0.05, 0.47, 0.17, 0.22, -0.12],
      [0.06, 0.42, 0.30, 0.15, 0.13, -0.08],
      [0.16, 0.12, 0.88, 0.06, 0.18, 0.02],
      [0.09, 0.07, 0.13, 0.70, 0.06, -0.03],
      [0.07, 0.05, 0.16, 0.04, 0.58, 0.05],
      [-0.03, -0.02, 0.02, 0.00, 0.02, 0.76],
    ],
  },
  {
    name: 'Market access bottleneck',
    note: 'The farms can produce, but weak market access leaves too much value stranded before it reaches buyers.',
    alpha: 0.160,
    K0: [58, 56, 45, 36, 42, 61],
    mu: [0.98, 0.84, 0.76, 0.80, 0.92, 1.15],
    risk: [0.80, 0.52, 0.60, 0.74, 0.50, 0.72],
    gLake: [0.22, 0.26, 0.06, 0.22, 0.24, -0.88],
    gProsperity: [1.12, 0.84, 0.60, 0.48, 0.66, 1.02],
    C: [
      [0.54, 0.06, 0.18, 0.12, 0.44, -0.10],
      [0.07, 0.48, 0.12, 0.11, 0.34, -0.07],
      [0.14, 0.09, 0.62, 0.04, 0.28, 0.00],
      [0.08, 0.06, 0.10, 0.68, 0.10, -0.02],
      [0.12, 0.09, 0.18, 0.04, 0.92, 0.03],
      [-0.02, -0.01, 0.00, 0.00, 0.04, 0.76],
    ],
  },
  {
    name: 'Scalable entrepreneur',
    note: 'One farm is unusually ready to scale, but it still needs the technical and market system around it.',
    alpha: 0.155,
    K0: [49, 57, 44, 37, 45, 58],
    mu: [1.15, 0.78, 0.74, 0.82, 0.88, 1.10],
    risk: [0.98, 0.46, 0.58, 0.70, 0.54, 0.70],
    gLake: [0.28, 0.24, 0.10, 0.22, 0.18, -0.86],
    gProsperity: [1.28, 0.78, 0.56, 0.52, 0.70, 0.96],
    C: [
      [1.08, 0.05, 0.26, 0.24, 0.24, -0.10],
      [0.08, 0.40, 0.12, 0.10, 0.12, -0.05],
      [0.22, 0.08, 0.64, 0.05, 0.17, 0.00],
      [0.16, 0.05, 0.08, 0.72, 0.08, -0.02],
      [0.18, 0.04, 0.14, 0.05, 0.62, 0.04],
      [-0.02, -0.02, 0.00, 0.00, 0.03, 0.76],
    ],
  },
  {
    name: 'Dirty growth trap',
    note: 'The industry is lucrative and creates jobs, but it weakens lake health and crowds the aquaculture system if it absorbs too much capital.',
    alpha: 0.160,
    K0: [60, 55, 43, 35, 46, 62],
    mu: [0.96, 0.78, 0.72, 0.76, 0.86, 1.36],
    risk: [0.82, 0.48, 0.60, 0.70, 0.54, 0.62],
    gLake: [0.24, 0.22, 0.04, 0.18, 0.22, -1.22],
    gProsperity: [1.05, 0.78, 0.55, 0.46, 0.72, 1.24],
    C: [
      [0.54, 0.07, 0.20, 0.14, 0.20, -0.22],
      [0.08, 0.45, 0.12, 0.12, 0.12, -0.16],
      [0.12, 0.08, 0.62, 0.04, 0.12, -0.08],
      [0.08, 0.05, 0.08, 0.66, 0.05, -0.06],
      [0.10, 0.08, 0.14, 0.04, 0.62, -0.04],
      [-0.02, -0.01, 0.00, 0.00, 0.02, 0.98],
    ],
  },
];

const GRID_CACHE = new Map();

export function generateLakeEconomy(seed = 104729) {
  const rng = mulberry32(toSeed(seed));
  const templateIndex = Math.abs(toSeed(seed)) % TEMPLATE_MATRICES.length;
  const template = TEMPLATE_MATRICES[templateIndex];

  const jitter = (value, pct = 0.06) => value * (1 + (rng() * 2 - 1) * pct);
  const jitterSigned = (value, pct = 0.07) => value === 0 ? 0 : value * (1 + (rng() * 2 - 1) * pct);

  const entities = ENTITIES.map((entity, i) => ({
    ...entity,
    K0: round1(Math.max(20, jitter(template.K0[i], 0.08))),
    expectedBusinessPayoff: round2(Math.max(0.2, jitter(template.mu[i], 0.05))),
    risk: round2(clamp(jitter(template.risk[i], 0.07), 0.25, 1.1)),
    lakeIntensity: round2(clamp(jitter(template.gLake[i], 0.08), -1.4, 0.6)),
    prosperityIntensity: round2(clamp(jitter(template.gProsperity[i], 0.08), 0.25, 1.45)),
  }));

  const C = template.C.map((row, i) => row.map((value, j) => {
    const v = jitterSigned(value, value < 0 ? 0.04 : 0.08);
    // Keep own responsiveness legible and stable.
    if (i === j) return round4(Math.max(0.34, v));
    return round4(v);
  }));

  const sigma = makeRiskMatrix(entities.map(e => e.risk));

  return {
    id: `lake-${toSeed(seed)}`,
    seed: toSeed(seed),
    templateIndex,
    templateName: template.name,
    scenarioNote: template.note,
    alpha: template.alpha,
    entities,
    responseMatrix: C,
    sigma,
    riskScale: 3.6,
    createdAt: new Date().toISOString(),
  };
}

export function getNextSeed(seed) {
  const next = (toSeed(seed) * 1664525 + 1013904223) >>> 0;
  return next || 104729;
}

export function normalizeOffers(offers) {
  const clean = offers.map(v => Math.max(0, Number.isFinite(+v) ? +v : 0));
  const sum = clean.reduce((a, b) => a + b, 0);
  if (sum === 0) return [0, 0, 0, 0, 0, 0];
  const scaled = clean.map(v => v * 100 / sum);
  return roundToBudget(scaled);
}

export function offerTotal(offers) {
  return offers.reduce((a, b) => a + (+b || 0), 0);
}

export function getGoalVector(economy, lakeWeight) {
  const w = clamp(lakeWeight, 0, 1);
  return economy.entities.map(e => w * e.lakeIntensity + (1 - w) * e.prosperityIntensity);
}

export function solveEconomy(economy, offers, lakeWeight = 0.5) {
  const cleanOffers = offers.map(v => clamp(+v || 0, 0, 100));
  const deltaPhi = cleanOffers.map(v => economy.alpha * v);
  const rawDeltaK = matVec(economy.responseMatrix, deltaPhi);
  const deltaK = rawDeltaK.map((d, i) => round2(Math.max(-economy.entities[i].K0 + 4, d)));
  const finalK = deltaK.map((d, i) => round1(economy.entities[i].K0 + d));

  const gLake = economy.entities.map(e => e.lakeIntensity);
  const gProsperity = economy.entities.map(e => e.prosperityIntensity);
  const g = getGoalVector(economy, lakeWeight);
  const mu = economy.entities.map(e => e.expectedBusinessPayoff);

  const lakeEffect = dot(gLake, deltaK);
  const prosperityEffect = dot(gProsperity, deltaK);
  const outcome = dot(g, deltaK);
  const expectedPayoff = dot(mu, deltaK);
  const offerWeights = cleanOffers.map(v => v / 100);
  const riskPenalty = economy.riskScale * quadratic(offerWeights, economy.sigma);
  const riskAdjustedReturn = expectedPayoff - riskPenalty;

  const perEntity = economy.entities.map((entity, i) => ({
    id: entity.id,
    name: entity.name,
    offer: round1(cleanOffers[i]),
    deltaK: round2(deltaK[i]),
    finalK: round1(finalK[i]),
    lakeEffect: round2(entity.lakeIntensity * deltaK[i]),
    prosperityEffect: round2(entity.prosperityIntensity * deltaK[i]),
    payoffContribution: round2(entity.expectedBusinessPayoff * deltaK[i]),
  }));

  return {
    offers: cleanOffers.map(round1),
    deltaPhi: deltaPhi.map(round3),
    deltaK,
    finalK,
    lakeEffect: round2(lakeEffect),
    prosperityEffect: round2(prosperityEffect),
    blendedOutcome: round2(outcome),
    expectedPayoff: round2(expectedPayoff),
    riskPenalty: round2(riskPenalty),
    riskAdjustedReturn: round2(riskAdjustedReturn),
    perEntity,
  };
}

export function computeFrontier(economy, lakeWeight = 0.5, step = 10) {
  const grid = getOfferGrid(step, economy.entities.length);
  const candidates = grid.map(offers => {
    const run = solveEconomy(economy, offers, lakeWeight);
    return {
      offers,
      outcome: run.blendedOutcome,
      lakeEffect: run.lakeEffect,
      prosperityEffect: run.prosperityEffect,
      riskAdjustedReturn: run.riskAdjustedReturn,
    };
  });

  // Add a few useful non-grid feasible offers for smoother behavior.
  const presets = [
    presetOffers('equal', economy, lakeWeight),
    presetOffers('business', economy, lakeWeight),
    presetOffers('rawOutcome', economy, lakeWeight),
  ];
  for (const offers of presets) {
    const run = solveEconomy(economy, offers, lakeWeight);
    candidates.push({
      offers,
      outcome: run.blendedOutcome,
      lakeEffect: run.lakeEffect,
      prosperityEffect: run.prosperityEffect,
      riskAdjustedReturn: run.riskAdjustedReturn,
    });
  }

  const financialBestReturn = Math.max(...candidates.map(c => c.riskAdjustedReturn));
  const outcomeBest = Math.max(...candidates.map(c => c.outcome));
  const outcomeWorst = Math.min(...candidates.map(c => c.outcome));
  const returnBest = financialBestReturn;
  const returnWorst = Math.min(...candidates.map(c => c.riskAdjustedReturn));

  const frontierPoints = upperEnvelope(candidates);
  const thinned = thinPoints(frontierPoints, 65);

  return {
    step,
    candidates,
    frontierPoints: thinned,
    financialBestReturn: round2(financialBestReturn),
    outcomeBest: round2(outcomeBest),
    outcomeWorst: round2(outcomeWorst),
    returnBest: round2(returnBest),
    returnWorst: round2(returnWorst),
  };
}

export function scoreRun(economy, offers, lakeWeight, frontier = null) {
  const run = solveEconomy(economy, offers, lakeWeight);
  const frontierData = frontier || computeFrontier(economy, lakeWeight);

  const tolerance = 0.35;
  const eligible = frontierData.candidates.filter(c => c.riskAdjustedReturn >= run.riskAdjustedReturn - tolerance);
  const bestOutcomeAtCost = eligible.length ? Math.max(...eligible.map(c => c.outcome)) : frontierData.outcomeBest;

  let frontierScore = null;
  let scoreLabel = '';
  if (run.blendedOutcome <= 0) {
    scoreLabel = 'This offer moved against your chosen goal.';
  } else if (bestOutcomeAtCost <= 0) {
    scoreLabel = 'No positive frontier benchmark is available at this return.';
  } else {
    frontierScore = clamp(100 * run.blendedOutcome / bestOutcomeAtCost, 0, 100);
    const rounded = Math.round(frontierScore);
    scoreLabel = `You reached about ${rounded}% of the frontier for this lake.`;
  }

  return {
    ...run,
    frontierScore: frontierScore == null ? null : round1(frontierScore),
    frontierScoreLabel: scoreLabel,
    bestOutcomeAtCost: round2(bestOutcomeAtCost),
    financialBestReturn: frontierData.financialBestReturn,
  };
}

export function presetOffers(kind, economy, lakeWeight = 0.5, frontier = null) {
  const n = economy.entities.length;
  if (kind === 'equal') {
    return roundToBudget(Array(n).fill(100 / n));
  }

  if (kind === 'business') {
    const mu = economy.entities.map(e => e.expectedBusinessPayoff);
    const idx = argMax(mu);
    return oneHotBudget(n, idx);
  }

  if (kind === 'rawOutcome') {
    const g = getGoalVector(economy, lakeWeight);
    const idx = argMax(g);
    return oneHotBudget(n, idx);
  }

  if (kind === 'frontierHint') {
    const frontierData = frontier || computeFrontier(economy, lakeWeight);
    const candidates = frontierData.candidates;
    const minReturn = frontierData.financialBestReturn - 5.5;
    const filtered = candidates.filter(c => c.riskAdjustedReturn >= minReturn && c.outcome > 0);
    const pool = filtered.length ? filtered : candidates;
    const best = pool.reduce((a, b) => {
      const scoreA = a.outcome + 0.20 * a.riskAdjustedReturn;
      const scoreB = b.outcome + 0.20 * b.riskAdjustedReturn;
      return scoreB > scoreA ? b : a;
    }, pool[0]);
    return best.offers.slice();
  }

  return Array(n).fill(0);
}

export function goalLabel(lakeWeight) {
  if (lakeWeight >= 0.75) return 'Lake health';
  if (lakeWeight <= 0.25) return 'Local prosperity';
  return 'Balanced';
}

export function statScale(value, min, max) {
  return clamp((value - min) / (max - min), 0, 1);
}

function makeRiskMatrix(risk) {
  const n = risk.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let corr = i === j ? 1 : 0.18;
      // Aquaculture cluster: farms, feed, hatchery, cold chain.
      if (i < 5 && j < 5 && i !== j) corr = 0.36;
      if ((i === 0 && j === 2) || (i === 2 && j === 0)) corr = 0.48;
      if ((i === 0 && j === 3) || (i === 3 && j === 0)) corr = 0.42;
      if ((i === 5 && j < 5) || (j === 5 && i < 5)) corr = 0.05;
      matrix[i][j] = round4(corr * risk[i] * risk[j]);
    }
  }
  // Small ridge regularization for positive definiteness.
  for (let i = 0; i < n; i++) matrix[i][i] = round4(matrix[i][i] + 0.05);
  return matrix;
}

function getOfferGrid(step, n) {
  const key = `${step}:${n}`;
  if (GRID_CACHE.has(key)) return GRID_CACHE.get(key);
  const out = [];
  const recur = (idx, remaining, current) => {
    if (idx === n - 1) {
      out.push([...current, remaining]);
      return;
    }
    for (let value = 0; value <= remaining; value += step) {
      current.push(value);
      recur(idx + 1, remaining - value, current);
      current.pop();
    }
  };
  recur(0, 100, []);
  GRID_CACHE.set(key, out);
  return out;
}

function upperEnvelope(candidates) {
  const sorted = candidates
    .filter(c => Number.isFinite(c.outcome) && Number.isFinite(c.riskAdjustedReturn))
    .slice()
    .sort((a, b) => a.outcome - b.outcome || a.riskAdjustedReturn - b.riskAdjustedReturn);

  const points = [];
  let bestReturn = -Infinity;
  for (const c of sorted) {
    if (c.riskAdjustedReturn > bestReturn + 0.02) {
      bestReturn = c.riskAdjustedReturn;
      points.push({ outcome: c.outcome, riskAdjustedReturn: c.riskAdjustedReturn, offers: c.offers });
    }
  }
  return points;
}

function thinPoints(points, target) {
  if (points.length <= target) return points;
  const out = [];
  for (let i = 0; i < target; i++) {
    const idx = Math.round(i * (points.length - 1) / (target - 1));
    out.push(points[idx]);
  }
  return out;
}

function oneHotBudget(n, idx) {
  const offers = Array(n).fill(0);
  offers[idx] = 100;
  return offers;
}

function roundToBudget(values) {
  const rounded = values.map(v => Math.max(0, Math.round(v)));
  let diff = 100 - rounded.reduce((a, b) => a + b, 0);
  let i = 0;
  while (diff !== 0 && i < 1000) {
    const idx = i % rounded.length;
    if (diff > 0) {
      rounded[idx] += 1;
      diff -= 1;
    } else if (rounded[idx] > 0) {
      rounded[idx] -= 1;
      diff += 1;
    }
    i += 1;
  }
  return rounded;
}

function matVec(matrix, vector) {
  return matrix.map(row => row.reduce((sum, value, i) => sum + value * vector[i], 0));
}

function dot(a, b) {
  return a.reduce((sum, value, i) => sum + value * b[i], 0);
}

function quadratic(v, matrix) {
  let total = 0;
  for (let i = 0; i < v.length; i++) {
    for (let j = 0; j < v.length; j++) total += v[i] * matrix[i][j] * v[j];
  }
  return total;
}

function argMax(values) {
  return values.reduce((best, value, i) => value > values[best] ? i : best, 0);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round1(value) { return Math.round(value * 10) / 10; }
function round2(value) { return Math.round(value * 100) / 100; }
function round3(value) { return Math.round(value * 1000) / 1000; }
function round4(value) { return Math.round(value * 10000) / 10000; }

function toSeed(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value >>> 0;
  const str = String(value || 'lake-economy');
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a += 0x6D2B79F5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function templateNames() {
  return TEMPLATE_NAMES.slice();
}
