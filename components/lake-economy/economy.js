const ENTITY_NAMES = [
  'Scalable fish farm',
  'Steady fish farm',
  'Feed mill',
  'Hatchery',
  'Cold chain',
  'Lakefront industry'
];

const ENTITY_META = [
  { id: 'scalable-farm', short: 'Scalable farm', icon: '↗', world: [-48, 0, 20] },
  { id: 'steady-farm', short: 'Steady farm', icon: '≈', world: [-31, 0, 18] },
  { id: 'feed-mill', short: 'Feed mill', icon: '▦', world: [-11, 0, 15] },
  { id: 'hatchery', short: 'Hatchery', icon: '◌', world: [8, 0, 18] },
  { id: 'cold-chain', short: 'Cold chain', icon: '▣', world: [29, 0, 13] },
  { id: 'industry', short: 'Lakefront industry', icon: '▰', world: [51, 0, 11] }
];

const TEMPLATES = [
  {
    key: 'feed-bottleneck',
    name: 'Feed bottleneck',
    story: 'The farms are ready, but feed quality and delivery are holding the system back.',
    note: 'Feed may look indirect, but it can unlock farm response.'
  },
  {
    key: 'market-access',
    name: 'Market access bottleneck',
    story: 'Production is plausible, but cold storage and market routes decide whether fish reach buyers.',
    note: 'Cold chain investments may pull several lake businesses forward.'
  },
  {
    key: 'scalable-entrepreneur',
    name: 'Scalable entrepreneur',
    story: 'One ambitious farm can grow quickly, if the supporting system does not choke it.',
    note: 'High upside depends on complements, not just the farm itself.'
  },
  {
    key: 'dirty-growth-trap',
    name: 'Dirty growth trap',
    story: 'A lakefront industry offers jobs and payoff, but its growth can crowd out lake health.',
    note: 'The trade-off is real: not villainy, but costly spillovers.'
  }
];

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function sum(v) { return v.reduce((a, b) => a + b, 0); }
function dot(a, b) { return a.reduce((acc, v, i) => acc + v * b[i], 0); }
function add(a, b) { return a.map((v, i) => v + b[i]); }
function sub(a, b) { return a.map((v, i) => v - b[i]); }
function scale(v, s) { return v.map(x => x * s); }
function mean(v) { return sum(v) / v.length; }

function named(values) {
  return values.map((value, i) => ({ name: ENTITY_NAMES[i], value }));
}

function matZeros(n, m = n) {
  return Array.from({ length: n }, () => Array.from({ length: m }, () => 0));
}

function matAdd(A, B) {
  return A.map((row, i) => row.map((v, j) => v + B[i][j]));
}

function matScale(A, s) {
  return A.map(row => row.map(v => v * s));
}

function matVec(A, x) {
  return A.map(row => dot(row, x));
}

function matMul(A, B) {
  const n = A.length;
  const p = B[0].length;
  const m = B.length;
  const out = matZeros(n, p);
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < m; k++) {
      const aik = A[i][k];
      if (aik === 0) continue;
      for (let j = 0; j < p; j++) out[i][j] += aik * B[k][j];
    }
  }
  return out;
}

function diag(v) {
  const D = matZeros(v.length);
  v.forEach((x, i) => { D[i][i] = x; });
  return D;
}

function sym(A) {
  const n = A.length;
  const out = matZeros(n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) out[i][j] = (A[i][j] + A[j][i]) / 2;
  }
  return out;
}

function inverse(A) {
  const n = A.length;
  const M = A.map((row, i) => [
    ...row.map(Number),
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  ]);

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    if (Math.abs(M[pivot][col]) < 1e-12) {
      throw new Error('Matrix is singular or ill-conditioned.');
    }
    if (pivot !== col) [M[col], M[pivot]] = [M[pivot], M[col]];

    const div = M[col][col];
    for (let j = 0; j < 2 * n; j++) M[col][j] /= div;

    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = M[r][col];
      if (factor === 0) continue;
      for (let j = 0; j < 2 * n; j++) M[r][j] -= factor * M[col][j];
    }
  }

  return M.map(row => row.slice(n));
}

function solve(A, b) {
  return matVec(inverse(A), b);
}

function normalizePrecision(Sigma) {
  const P = inverse(Sigma);
  const d = mean(P.map((row, i) => row[i]));
  return matScale(P, 1 / d);
}

function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function seed() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(a) {
  return function rng() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rngFromSeed(seed) {
  return mulberry32(xmur3(String(seed))());
}

function randomSimplex(n, count, rng) {
  const rows = [];
  for (let r = 0; r < count; r++) {
    const x = Array.from({ length: n }, () => -Math.log(Math.max(1e-12, 1 - rng())));
    const s = sum(x);
    rows.push(x.map(v => v / s));
  }
  return rows;
}

function coarseSimplex(step = 10, n = 6) {
  const out = [];
  const prefix = [];
  function rec(depth, remaining) {
    if (depth === n - 1) {
      out.push([...prefix, remaining].map(v => v / step));
      return;
    }
    for (let v = 0; v <= remaining; v++) {
      prefix.push(v);
      rec(depth + 1, remaining - v);
      prefix.pop();
    }
  }
  rec(0, step);
  return out;
}

function projectShare(x) {
  const positive = x.map(v => Math.max(0, Number.isFinite(v) ? v : 0));
  const total = sum(positive);
  if (total <= 0) return Array.from({ length: positive.length }, () => 1 / positive.length);
  return positive.map(v => v / total);
}

function oneHot(index, n = 6) {
  return Array.from({ length: n }, (_, i) => (i === index ? 1 : 0));
}

function softmax(values, temp = 10) {
  const mx = Math.max(...values);
  const z = values.map(v => Math.exp(temp * (v - mx)));
  const s = sum(z);
  return z.map(v => v / s);
}

function jitterArray(values, rng, width = 0.035) {
  return values.map(v => v * (1 + (rng() - 0.5) * 2 * width));
}

function makeBaseData(templateKey, rng) {
  let muBusiness = [0.145, 0.115, 0.130, 0.125, 0.105, 0.175];
  let sigma = [0.28, 0.18, 0.20, 0.25, 0.16, 0.22];
  let K0 = [80, 60, 45, 35, 40, 70];
  let P0 = [0.118, 0.098, 0.108, 0.112, 0.090, 0.142];
  let gLake = [0.25, 0.18, 0.02, 0.20, 0.08, -0.75];
  let gProsperity = [0.75, 0.52, 0.62, 0.45, 0.55, 0.38];
  let qOther = [0.70, 0.95, 0.55, 0.45, 0.65, 1.00];

  const diagB = [0.0022, 0.0024, 0.0026, 0.0030, 0.0027, 0.0020];
  const B = matZeros(6);
  let demandScale = 1;
  diagB.forEach((v, i) => { B[i][i] = v; });

  // Complementarities within aquaculture. Negative off-diagonal B_ij means capital in j
  // raises the demand/willingness-to-pay for i in the inverse demand curve P = a - B K.
  B[0][2] = -0.00035; B[1][2] = -0.00028; B[2][0] = -0.00018; B[2][1] = -0.00012;
  B[0][3] = -0.00025; B[1][3] = -0.00020; B[3][0] = -0.00010; B[3][1] = -0.00008;
  B[0][4] = -0.00025; B[1][4] = -0.00020; B[4][0] = -0.00015; B[4][1] = -0.00010; B[2][4] = -0.00012;

  // Lakefront industry competes for lake capacity, labor, political attention, or water quality.
  B[0][5] = 0.00030; B[1][5] = 0.00022; B[3][5] = 0.00012; B[5][0] = 0.00008; B[5][1] = 0.00006;

  const multiplyLink = (i, j, f) => { B[i][j] *= f; };
  const multiplyPair = (i, j, f) => { B[i][j] *= f; B[j][i] *= f; };

  switch (templateKey) {
    case 'feed-bottleneck':
      demandScale = 1;
      qOther[2] = 0.38;
      K0[2] *= 0.86;
      P0[2] += 0.010;
      muBusiness[2] += 0.012;
      gProsperity[2] += 0.06;
      multiplyLink(0, 2, 5.20); multiplyLink(1, 2, 4.50); multiplyLink(2, 0, 2.85); multiplyLink(2, 1, 2.40);
      break;
    case 'market-access':
      demandScale = 1;
      qOther[4] = 0.36;
      K0[4] *= 0.82;
      P0[4] += 0.012;
      muBusiness[4] += 0.016;
      gProsperity[4] += 0.10;
      multiplyLink(0, 4, 5.25); multiplyLink(1, 4, 4.35); multiplyLink(4, 0, 3.05); multiplyLink(4, 1, 2.55); multiplyLink(2, 4, 3.35);
      break;
    case 'scalable-entrepreneur':
      demandScale = 1;
      qOther[0] = 0.48;
      K0[0] *= 0.82;
      P0[0] += 0.014;
      muBusiness[0] += 0.034;
      sigma[0] += 0.045;
      gProsperity[0] += 0.08;
      gLake[0] += 0.04;
      multiplyLink(0, 2, 2.80); multiplyLink(0, 3, 3.10); multiplyLink(0, 4, 2.80);
      multiplyLink(2, 0, 3.00); multiplyLink(3, 0, 2.70); multiplyLink(4, 0, 2.55);
      break;
    case 'dirty-growth-trap':
      demandScale = 1;
      qOther[5] = 1.12;
      K0[5] *= 1.10;
      P0[5] += 0.018;
      muBusiness[5] += 0.038;
      gProsperity[5] += 0.06;
      gLake[5] -= 0.22;
      qOther[0] *= 0.92; qOther[1] *= 0.94; qOther[3] *= 0.94;
      multiplyPair(0, 5, 1.75); multiplyPair(1, 5, 1.60); multiplyPair(3, 5, 1.55);
      break;
    default:
      break;
  }

  muBusiness = jitterArray(muBusiness, rng, 0.025);
  sigma = jitterArray(sigma, rng, 0.018);
  K0 = jitterArray(K0, rng, 0.025);
  P0 = jitterArray(P0, rng, 0.018);
  gLake = jitterArray(gLake, rng, 0.025);
  gProsperity = jitterArray(gProsperity, rng, 0.025);
  qOther = qOther.map(q => clamp(q * (1 + (rng() - 0.5) * 0.025), 0.25, 1.20));

  return { muBusiness, sigma, K0, P0, gLake, gProsperity, qOther, B: matScale(sym(B), demandScale) };
}

export function buildLakeParams({ seed = 'lake-1', templateKey = 'feed-bottleneck', lakeOutcomeWeight = 0.50 } = {}) {
  const rng = rngFromSeed(`${seed}:${templateKey}`);
  const n = 6;
  const data = makeBaseData(templateKey, rng);

  const Corr = [
    [1.00, 0.55, 0.45, 0.42, 0.35, -0.10],
    [0.55, 1.00, 0.38, 0.35, 0.30, -0.05],
    [0.45, 0.38, 1.00, 0.30, 0.50, 0.05],
    [0.42, 0.35, 0.30, 1.00, 0.25, -0.02],
    [0.35, 0.30, 0.50, 0.25, 1.00, 0.08],
    [-0.10, -0.05, 0.05, -0.02, 0.08, 1.00]
  ];

  const playerWealth = 100;
  const otherWealth = 900;
  const gammaPlayer = 8;
  const gammaOther = 8;
  const supplyScale = 0.045;
  const offerShiftScale = 18;
  const playerBaselineShareOfK = 0.10;

  const Sigma = matMul(matMul(diag(data.sigma), Corr), diag(data.sigma));
  const riskPrecision = normalizePrecision(Sigma);
  const EPlayer = matScale(riskPrecision, supplyScale * (playerWealth / gammaPlayer));
  const EOtherBase = matScale(riskPrecision, supplyScale * (otherWealth / gammaOther));
  const Q = diag(data.qOther);
  const EOther = matMul(matMul(Q, EOtherBase), Q);
  const ETotal = matAdd(EPlayer, EOther);
  const PhiS = inverse(ETotal);

  const b0Share = Array.from({ length: n }, () => 1 / n);
  const makeOfferShift = (bShare) => {
    const b = projectShare(bShare);
    return b.map((v, i) => offerShiftScale * (v - b0Share[i]));
  };

  const s0 = makeOfferShift(b0Share);
  const KPlayer0 = data.K0.map(v => playerBaselineShareOfK * v);
  const KOther0 = data.K0.map(v => (1 - playerBaselineShareOfK) * v);
  const cPlayer = sub(sub(KPlayer0, matVec(EPlayer, data.P0)), s0);
  const cOther = sub(KOther0, matVec(EOther, data.P0));
  const cSupply = add(cPlayer, cOther);
  const aDemand = add(data.P0, matVec(data.B, data.K0));

  const template = TEMPLATES.find(t => t.key === templateKey) || TEMPLATES[0];
  return {
    seed,
    template,
    entities: ENTITY_META.map((meta, i) => ({ ...meta, name: ENTITY_NAMES[i], index: i })),
    n,
    muBusiness: data.muBusiness,
    sigma: data.sigma,
    Corr,
    Sigma,
    qOther: data.qOther,
    gLake: data.gLake,
    gProsperity: data.gProsperity,
    lakeOutcomeWeight,
    K0: data.K0,
    P0: data.P0,
    b0Share,
    offerShiftScale,
    makeOfferShift,
    playerWealth,
    otherWealth,
    gammaPlayer,
    gammaOther,
    playerBaselineShareOfK,
    EPlayer,
    EOther,
    ETotal,
    PhiS,
    B: data.B,
    cPlayer,
    cOther,
    cSupply,
    aDemand
  };
}

export function solveLakeEquilibrium(bShare, params) {
  const b = projectShare(bShare);
  const sPlayer = params.makeOfferShift(b);
  const M = matAdd(params.PhiS, params.B);
  const rhs = add(params.aDemand, matVec(params.PhiS, add(params.cSupply, sPlayer)));
  const K = solve(M, rhs);
  const P = sub(params.aDemand, matVec(params.B, K));
  const KPlayer = add(add(params.cPlayer, matVec(params.EPlayer, P)), sPlayer);
  const KOther = add(params.cOther, matVec(params.EOther, P));
  const supplyGap = sub(K, add(KPlayer, KOther));

  return { bShare: b, sPlayer, P, K, KPlayer, KOther, supplyGap };
}

export function computeLakeMetrics(eq, params, lakeOutcomeWeight = params.lakeOutcomeWeight) {
  const lake = dot(params.gLake, eq.K);
  const prosperity = dot(params.gProsperity, eq.K);
  const blended = lakeOutcomeWeight * lake + (1 - lakeOutcomeWeight) * prosperity;
  const playerExpectedPayoff = dot(eq.P, eq.KPlayer);
  const playerVariance = dot(eq.KPlayer, matVec(params.Sigma, eq.KPlayer));
  const playerRiskPenalty = 0.5 * params.gammaPlayer / params.playerWealth * playerVariance;
  const playerCE = playerExpectedPayoff - playerRiskPenalty;

  return { lake, prosperity, blended, playerExpectedPayoff, playerVariance, playerRiskPenalty, playerCE };
}

export function runLake(bShare, params, lakeOutcomeWeight = params.lakeOutcomeWeight) {
  const eq = solveLakeEquilibrium(bShare, params);
  const metrics = computeLakeMetrics(eq, params, lakeOutcomeWeight);
  const baseline = solveLakeEquilibrium(params.b0Share, params);
  const deltaK = sub(eq.K, baseline.K);
  const deltaKPlayer = sub(eq.KPlayer, baseline.KPlayer);
  const lakeContribution = deltaK.map((dk, i) => params.gLake[i] * dk);
  const prosperityContribution = deltaK.map((dk, i) => params.gProsperity[i] * dk);
  return { ...eq, metrics, deltaK, deltaKPlayer, lakeContribution, prosperityContribution };
}

export function makePresets(params, lakeOutcomeWeight = params.lakeOutcomeWeight) {
  const blendedG = params.gLake.map((g, i) => lakeOutcomeWeight * g + (1 - lakeOutcomeWeight) * params.gProsperity[i]);
  return {
    equal: Array.from({ length: params.n }, () => 1 / params.n),
    highestBusinessPayoff: oneHot(params.muBusiness.indexOf(Math.max(...params.muBusiness)), params.n),
    highestRawOutcome: oneHot(blendedG.indexOf(Math.max(...blendedG)), params.n),
    payoffTiltSoft: softmax(params.muBusiness, 25),
    outcomeTiltSoft: softmax(blendedG, 4)
  };
}

export function entityCardData(params, lakeOutcomeWeight = params.lakeOutcomeWeight) {
  return params.entities.map((entity, i) => ({
    ...entity,
    currentSizeK0: params.K0[i],
    expectedBusinessPayoff: params.muBusiness[i],
    riskSigma: params.sigma[i],
    lakeHealthIntensity: params.gLake[i],
    localProsperityIntensity: params.gProsperity[i],
    blendedVisibleIntensity: lakeOutcomeWeight * params.gLake[i] + (1 - lakeOutcomeWeight) * params.gProsperity[i],
    otherInvestorAccessQ: params.qOther[i]
  }));
}

function rowFromRun(bShare, params, lakeOutcomeWeight) {
  const run = runLake(bShare, params, lakeOutcomeWeight);
  const base = runLake(params.b0Share, params, lakeOutcomeWeight);
  return {
    bShare: run.bShare,
    playerCE: run.metrics.playerCE,
    blended: run.metrics.blended,
    lake: run.metrics.lake,
    prosperity: run.metrics.prosperity,
    ceLossVsEqual: base.metrics.playerCE - run.metrics.playerCE,
    ceGainVsEqual: run.metrics.playerCE - base.metrics.playerCE,
    blendedGainVsEqual: run.metrics.blended - base.metrics.blended,
    lakeGainVsEqual: run.metrics.lake - base.metrics.lake,
    prosperityGainVsEqual: run.metrics.prosperity - base.metrics.prosperity,
    minK: Math.min(...run.K),
    minKPlayer: Math.min(...run.KPlayer),
    maxAbsSupplyGap: Math.max(...run.supplyGap.map(Math.abs))
  };
}

export function frontierGrid(params, lakeOutcomeWeight = params.lakeOutcomeWeight, options = {}) {
  const randomN = options.randomN ?? 3200;
  const seed = options.seed ?? `${params.seed}:${params.template.key}:${lakeOutcomeWeight.toFixed(3)}:frontier`;
  const rng = rngFromSeed(seed);
  const presets = makePresets(params, lakeOutcomeWeight);
  const rows = [
    ...Object.values(presets),
    ...coarseSimplex(10, params.n),
    ...randomSimplex(params.n, randomN, rng)
  ];

  const seen = new Set();
  const uniqueRows = [];
  for (const row of rows) {
    const key = row.map(v => v.toFixed(4)).join('|');
    if (!seen.has(key)) {
      seen.add(key);
      uniqueRows.push(row);
    }
  }

  const points = uniqueRows.map(row => rowFromRun(row, params, lakeOutcomeWeight));
  points.sort((a, b) => a.ceLossVsEqual - b.ceLossVsEqual || b.blendedGainVsEqual - a.blendedGainVsEqual);

  let best = -Infinity;
  for (const p of points) {
    best = Math.max(best, p.blendedGainVsEqual);
    p.frontierBestGainUpToLoss = best;
    p.isFrontierPoint = p.blendedGainVsEqual >= best - 1e-10;
  }

  const frontier = points.filter(p => p.isFrontierPoint && Number.isFinite(p.blendedGainVsEqual) && Number.isFinite(p.ceGainVsEqual));
  return { points, frontier };
}

export function scoreOfferAgainstGrid(bShare, params, lakeOutcomeWeight = params.lakeOutcomeWeight, grid = null) {
  const frontier = grid || frontierGrid(params, lakeOutcomeWeight);
  const current = runLake(bShare, params, lakeOutcomeWeight);
  const baseline = runLake(params.b0Share, params, lakeOutcomeWeight);
  const curGain = current.metrics.blended - baseline.metrics.blended;
  const curLoss = baseline.metrics.playerCE - current.metrics.playerCE;
  const curCEGain = current.metrics.playerCE - baseline.metrics.playerCE;

  const feasible = frontier.points.filter(p => p.ceLossVsEqual <= curLoss + 1e-8);
  let bestGain = feasible.length ? Math.max(...feasible.map(p => p.blendedGainVsEqual)) : curGain;
  if (!Number.isFinite(bestGain)) bestGain = curGain;
  bestGain = Math.max(bestGain, curGain);

  const recovery = bestGain > 1e-9 ? curGain / bestGain : (curGain > 1e-9 ? 1 : 0);
  const frontierRecovery = clamp(recovery, 0, 1.25);

  return {
    current,
    baseline,
    ceLossVsEqual: curLoss,
    ceGainVsEqual: curCEGain,
    blendedGainVsEqual: curGain,
    lakeGainVsEqual: current.metrics.lake - baseline.metrics.lake,
    prosperityGainVsEqual: current.metrics.prosperity - baseline.metrics.prosperity,
    bestGainAtNoMoreLoss: bestGain,
    frontierRecovery,
    grid: frontier
  };
}

export function tokenVectorFromShares(shares) {
  const raw = shares.map(v => Math.max(0, v * 100));
  const floors = raw.map(Math.floor);
  let remaining = 100 - sum(floors);
  const order = raw.map((v, i) => ({ i, frac: v - Math.floor(v) })).sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < remaining; k++) floors[order[k % order.length].i] += 1;
  return floors;
}

export function sharesFromTokens(tokens) {
  return projectShare(tokens.map(v => v / 100));
}

export function templateForIndex(index) {
  return TEMPLATES[((index % TEMPLATES.length) + TEMPLATES.length) % TEMPLATES.length];
}

export function listTemplates() {
  return [...TEMPLATES];
}

export function namedVector(values) {
  return named(values);
}
