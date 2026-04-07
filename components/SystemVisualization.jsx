"use client";

import { useMemo, useState } from "react";

function Button({ variant = "default", className = "", children, ...props }) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium transition border";
  const styles =
    variant === "outline"
      ? "bg-white text-slate-900 border-slate-300 hover:bg-slate-50"
      : "bg-slate-900 text-white border-slate-900 hover:bg-slate-800";

  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}

const FIRMS = ["Firm A", "Firm B", "Firm C", "Firm D"];
const OUTCOMES = ["Production", "Pollution", "Consumer\nsurplus"];

const MODEL = {
  initialInvestorSupply: [8, 3, 6, 2],
  S: [
    [1.0, 0.28, 0.18, 0.12],
    [0.28, 0.95, 0.22, 0.16],
    [0.18, 0.22, 1.05, 0.24],
    [0.12, 0.16, 0.24, 0.9],
  ],
  dDiagonalMultiplier: 1,
  dOffDiagonalMultiplier: 0.9,
  returnsKernel: [
    [0.95, 0.18, 0.08, 0.05],
    [0.16, 0.9, 0.14, 0.08],
    [0.08, 0.14, 1.0, 0.16],
    [0.05, 0.08, 0.16, 0.92],
  ],
  outcomeKernel: [
  [2.4, 0.6, 1.8],
  [2.1, 1.5, 1.2],
  [1.8, 2.7, 2.1],
  [1.5, 2.4, 2.7],
  ],
};

const VISUAL = {
  path: {
    minWidth: 0,
    maxWidth: 18,
    exponent: 0.72,
  },
  node: {
    baseWidth: 110,
    baseHeight: 36,
    minScale: 0.6,
    maxScale: 1.8,
    exponent: 0.7,
  },
  investorPath: {
    minWidth: 0.4,
    maxWidth: 18,
    exponent: 0.72,
  },
  opacity: {
    diagonal: 0.9,
    offDiagonal: 0.55,
    outcomesDiagonal: 0.78,
    outcomesOffDiagonal: 0.62,
  },
};

const TOTAL_INVESTOR_SUPPLY = MODEL.initialInvestorSupply.reduce((a, b) => a + b, 0);
const RETURNS_TO_SCALE_D = buildReturnsToScaleMatrix(
  MODEL.S,
  MODEL.dDiagonalMultiplier,
  MODEL.dOffDiagonalMultiplier
);
const SIZE_KERNEL = invertMatrix(addMatrices(MODEL.S, RETURNS_TO_SCALE_D));

const INVESTOR_NODE = { id: "investor", label: "Investor", x: 90, y: 245, kind: "investor" };
const SUPPLY_NODES = FIRMS.map((label, i) => ({ id: `s-${i}`, label, x: 340, y: 110 + i * 95, kind: "supply" }));
const PRICE_NODES = FIRMS.map((label, i) => ({ id: `p-${i}`, label, x: 720, y: 110 + i * 95, kind: "price" }));
const SIZE_NODES = FIRMS.map((label, i) => ({ id: `q-${i}`, label, x: 1100, y: 50 + i * 58, kind: "size" }));
const RETURN_NODES = FIRMS.map((label, i) => ({ id: `r-${i}`, label, x: 1100, y: 390 + i * 60, kind: "return" }));
const OUTCOME_NODES = OUTCOMES.map((label, i) => ({ id: `o-${i}`, label, x: 1490, y: 130 + i * 110, kind: "outcome" }));
const ALL_NODES = [
  INVESTOR_NODE,
  ...SUPPLY_NODES,
  ...PRICE_NODES,
  ...SIZE_NODES,
  ...RETURN_NODES,
  ...OUTCOME_NODES,
];


function EconomicSystemVisualizationGallery() {

  const [naive, setNaive] = useState(false);
  const [investorSupply, setInvestorSupply] = useState(MODEL.initialInvestorSupply);

  const displayedKernels = useMemo(() => {
    const simplify = naive ? diagonalOnly : identityKernelTransform;
    return {
      supplyToPrice: simplify(MODEL.S),
      priceToSize: simplify(SIZE_KERNEL),
      priceToReturn: simplify(MODEL.returnsKernel),
      sizeToOutcome: MODEL.outcomeKernel,
    };
  }, [naive]);

  const flowState = useMemo(() => {
    const investorToSupply = investorSupply.map((value) => value);

    const supplyToPrice = buildFlowMatrixFromSource(investorSupply, displayedKernels.supplyToPrice);
    const pricePressure = columnSums(supplyToPrice);
    const pricePressureMagnitude = columnAbsSums(supplyToPrice);

    const priceToSize = buildFlowMatrixFromSource(pricePressure, displayedKernels.priceToSize);
    const sizeTotals = columnSums(priceToSize);
    const sizeMagnitude = columnAbsSums(priceToSize);

    const priceToReturn = buildFlowMatrixFromSource(pricePressure, displayedKernels.priceToReturn);
    const returnTotals = columnSums(priceToReturn);
    const returnMagnitude = columnAbsSums(priceToReturn);

    const sizeToOutcome = buildFlowMatrixFromSource(sizeTotals, displayedKernels.sizeToOutcome);
    const outcomeTotals = columnSums(sizeToOutcome);
    const outcomeMagnitude = columnAbsSums(sizeToOutcome);

    return {
      investorToSupply,
      supplyToPrice,
      pricePressure,
      pricePressureMagnitude,
      priceToSize,
      sizeTotals,
      sizeMagnitude,
      priceToReturn,
      returnTotals,
      returnMagnitude,
      sizeToOutcome,
      outcomeTotals,
      outcomeMagnitude,
    };
  }, [investorSupply, displayedKernels]);

  const nodeMagnitudes = useMemo(() => {
    return {
      investor: TOTAL_INVESTOR_SUPPLY,
      ...Object.fromEntries(SUPPLY_NODES.map((node, i) => [node.id, Math.abs(flowState.investorToSupply[i])])),
      ...Object.fromEntries(PRICE_NODES.map((node, i) => [node.id, flowState.pricePressureMagnitude[i]])),
      ...Object.fromEntries(SIZE_NODES.map((node, i) => [node.id, flowState.sizeMagnitude[i]])),
      ...Object.fromEntries(RETURN_NODES.map((node, i) => [node.id, flowState.returnMagnitude[i]])),
      ...Object.fromEntries(OUTCOME_NODES.map((node, i) => [node.id, flowState.outcomeMagnitude[i]])),
    };
  }, [flowState]);

  const globalFlowMax = useMemo(() => {
    const allMagnitudes = [
      ...flowState.investorToSupply.map((v) => Math.abs(v)),
      ...flattenAbs(flowState.supplyToPrice),
      ...flattenAbs(flowState.priceToSize),
      ...flattenAbs(flowState.priceToReturn),
      ...flattenAbs(flowState.sizeToOutcome),
    ];
    return Math.max(1e-9, ...allMagnitudes);
  }, [flowState]);

  const globalNodeMax = useMemo(() => {
    const values = ALL_NODES
      .filter((node) => node.kind !== "investor")
      .map((node) => nodeMagnitudes[node.id] ?? 0);
    return Math.max(1e-9, ...values);
  }, [nodeMagnitudes]);

  const updateSupply = (index, rawValue) => {
    const requestedValue = Number(rawValue);
    const targetValue = Math.max(0, Math.min(TOTAL_INVESTOR_SUPPLY, requestedValue));

    setInvestorSupply((prev) => {
      const next = [...prev];
      next[index] = targetValue;

      const otherIndices = prev.map((_, i) => i).filter((i) => i !== index);
      const previousOtherTotal = otherIndices.reduce((sum, i) => sum + prev[i], 0);
      const remainingTotal = TOTAL_INVESTOR_SUPPLY - targetValue;

      if (otherIndices.length === 0) return next;

      if (previousOtherTotal > 0) {
        otherIndices.forEach((i) => {
          next[i] = (prev[i] / previousOtherTotal) * remainingTotal;
        });
      } else {
        const equalShare = remainingTotal / otherIndices.length;
        otherIndices.forEach((i) => {
          next[i] = equalShare;
        });
      }

      const correctedTotal = next.reduce((sum, value) => sum + value, 0);
      next[index] += TOTAL_INVESTOR_SUPPLY - correctedTotal;
      return next.map((value) => Math.max(0, value));
    });
  };

  const resetSupply = () => setInvestorSupply(MODEL.initialInvestorSupply);

  return (
    <div key={naive ? "root-naive" : "root-system"} className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <div className="max-w-[1850px] mx-auto space-y-8">
        <div className="space-y-6">
              <Panel title="Mode">
                <p className="text-sm text-slate-600">Try switching between the states.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    variant={!naive ? "default" : "outline"}
                    onClick={() => setNaive(false)}
                    className="rounded-2xl"
                  >
                    System aware
                  </Button>
                  <Button
                    variant={naive ? "default" : "outline"}
                    onClick={() => setNaive(true)}
                    className="rounded-2xl"
                  >
                    System unaware
                  </Button>
                </div>
              </Panel>

            <div className="bg-white rounded-3xl rounded-tl-none shadow-sm border border-slate-300 p-6">
              <h2 className="text-xl font-semibold text-slate-900">Prototype</h2>

                  <div className="mt-6 overflow-x-auto">
                    <svg viewBox="0 0 1720 860" className="w-full min-w-[1500px]">
                      <SvgDefs />
                      <SceneLabels />
                      <InvestorStage investorSupply={investorSupply} globalFlowMax={globalFlowMax} />
                      {renderStage(SUPPLY_NODES, PRICE_NODES, flowState.supplyToPrice, "g2", "sp", globalFlowMax, naive)}
                      {renderStage(PRICE_NODES, SIZE_NODES, flowState.priceToSize, "g3", "pq", globalFlowMax, naive)}
                      {renderStage(PRICE_NODES, RETURN_NODES, flowState.priceToReturn, "g4", "pr", globalFlowMax, naive)}
                      {renderStage(
                        SIZE_NODES,
                        OUTCOME_NODES,
                        flowState.sizeToOutcome,
                        "g5",
                        "qo",
                        globalFlowMax,
                        false,
                        true
                      )}
                      <AllNodes nodeMagnitudes={nodeMagnitudes} globalNodeMax={globalNodeMax} />
                    </svg>
                  </div>

                  <div className="mt-8">
                    <Panel title="Investor supply controls">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm text-slate-600">
                          Drag the handles to reallocate a fixed amount of capital across the firms.
                        </p>
                        <Button variant="outline" onClick={resetSupply} className="rounded-2xl">
                          Reset
                        </Button>
                      </div>

                      <div className="mt-5 space-y-4">
                        <div className="grid grid-cols-[140px_minmax(0,1fr)_64px] items-center gap-4 text-xs text-slate-500">
                          <div>Total</div>
                          <div className="h-px bg-slate-200" />
                          <div className="text-right font-mono">{TOTAL_INVESTOR_SUPPLY.toFixed(1)}</div>
                        </div>

                        {FIRMS.map((firm, i) => (
                          <div
                            key={firm}
                            className="grid grid-cols-[140px_minmax(0,1fr)_64px] items-center gap-4"
                          >
                            <label className="text-sm font-medium text-slate-700">{firm}</label>
                            <input
                              type="range"
                              min="0"
                              max={TOTAL_INVESTOR_SUPPLY}
                              step="0.1"
                              value={investorSupply[i]}
                              onChange={(e) => updateSupply(i, e.target.value)}
                              className="w-full"
                              aria-label={`${firm} investor supply`}
                            />
                            <div className="text-sm font-mono text-slate-600 text-right">
                              {investorSupply[i].toFixed(1)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Panel>
                  </div>

            </div>


            
        </div>
      </div>
    </div>
  );
}

function SvgDefs() {
  return (
    <defs>
      <linearGradient id="g1" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#60a5fa" />
      </linearGradient>
      <linearGradient id="g2" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#a78bfa" />
      </linearGradient>
      <linearGradient id="g3" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#a78bfa" />
        <stop offset="100%" stopColor="#34d399" />
      </linearGradient>
      <linearGradient id="g4" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#a78bfa" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
      <linearGradient id="g5" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#f43f5e" />
      </linearGradient>
    </defs>
  );
}

function SceneLabels() {
  return (
    <>
      <StageLabel x={90} y={66} text="Investor" />
      <StageLabel x={340} y={66} text="Change in supply of capital" />
      <StageLabel x={720} y={66} text="Price pressure" />
      <StageLabel x={1100} y={15} text="Equilibrium firm size" />
      <StageLabel x={1490} y={66} text="Aggregate outcomes" />
      <StageLabel x={1100} y={340} text="Equilibrium returns" />
    </>
  );
}

function InvestorStage({ investorSupply, globalFlowMax }) {
  return SUPPLY_NODES.map((to, i) => (
    <path
      key={`is-${i}`}
      d={curvePath(INVESTOR_NODE.x + 78, INVESTOR_NODE.y, to.x - 72, to.y, 0.38)}
      fill="none"
      stroke="url(#g1)"
      strokeWidth={mapPathWidth(Math.abs(investorSupply[i]), globalFlowMax, VISUAL.investorPath)}
      strokeLinecap="round"
      opacity={0.78}
    />
  ));
}

function renderStage(fromNodes, toNodes, flowMatrix, gradientId, prefix, globalFlowMax, naive, isOutcomeStage = false) {
  return flowMatrix.flatMap((row, i) =>
    row.map((value, j) => {
      const isDiagonal = i === j;
      const magnitude = Math.abs(value);
      const width = naive && !isOutcomeStage && !isDiagonal ? 0 : mapPathWidth(magnitude, globalFlowMax, VISUAL.path);
      const opacity = isOutcomeStage
        ? isDiagonal
          ? VISUAL.opacity.outcomesDiagonal
          : VISUAL.opacity.outcomesOffDiagonal
        : isDiagonal
        ? VISUAL.opacity.diagonal
        : VISUAL.opacity.offDiagonal;

      return (
        <path
          key={`${prefix}-${i}-${j}-${naive ? "naive" : "system"}`}
          d={curvePath(fromNodes[i].x + 72, fromNodes[i].y, toNodes[j].x - 72, toNodes[j].y, 0.24)}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={width}
          strokeLinecap="round"
          opacity={width === 0 ? 0 : opacity}
        />
      );
    })
  );
}

function AllNodes({ nodeMagnitudes, globalNodeMax }) {
  return ALL_NODES.map((node) => (
    <Node key={node.id} node={node} magnitude={nodeMagnitudes[node.id] ?? 0} globalNodeMax={globalNodeMax} />
  ));
}

function mapPathWidth(magnitude, globalMax, params) {
  if (magnitude <= 0) return params.minWidth;
  const normalized = Math.max(0, Math.min(1, magnitude / globalMax));
  return params.minWidth + (params.maxWidth - params.minWidth) * Math.pow(normalized, params.exponent);
}

function mapNodeScale(magnitude, globalMax, params) {
  if (magnitude <= 0) return params.minScale;
  const normalized = Math.max(0, Math.min(1, magnitude / globalMax));
  return params.minScale + (params.maxScale - params.minScale) * Math.pow(normalized, params.exponent);
}

function buildReturnsToScaleMatrix(sMatrix, diagonalMultiplier, offDiagonalMultiplier) {
  return sMatrix.map((row, i) =>
    row.map((value, j) => (i === j ? value * diagonalMultiplier : value * offDiagonalMultiplier))
  );
}

function buildFlowMatrixFromSource(sourceVector, kernelMatrix) {
  return sourceVector.map((sourceValue, i) => kernelMatrix[i].map((entry) => sourceValue * entry));
}

function columnSums(matrix) {
  const cols = matrix[0].length;
  return Array.from({ length: cols }, (_, j) => matrix.reduce((sum, row) => sum + row[j], 0));
}

function columnAbsSums(matrix) {
  const cols = matrix[0].length;
  return Array.from({ length: cols }, (_, j) => matrix.reduce((sum, row) => sum + Math.abs(row[j]), 0));
}

function flattenAbs(matrix) {
  return matrix.flatMap((row) => row.map((value) => Math.abs(value)));
}

function diagonalOnly(kernel) {
  return kernel.map((row, i) => row.map((value, j) => (i === j ? value : 0)));
}

function identityKernelTransform(kernel) {
  return kernel;
}

function addMatrices(a, b) {
  return a.map((row, i) => row.map((value, j) => value + b[i][j]));
}

function buildNodeMagnitudes({ investorSupply, pricePressureMagnitude, sizeMagnitude, returnMagnitude, outcomeMagnitude }) {
  return {
    investor: TOTAL_INVESTOR_SUPPLY,
    ...Object.fromEntries(SUPPLY_NODES.map((node, i) => [node.id, Math.abs(investorSupply[i])])),
    ...Object.fromEntries(PRICE_NODES.map((node, i) => [node.id, pricePressureMagnitude[i]])),
    ...Object.fromEntries(SIZE_NODES.map((node, i) => [node.id, sizeMagnitude[i]])),
    ...Object.fromEntries(RETURN_NODES.map((node, i) => [node.id, returnMagnitude[i]])),
    ...Object.fromEntries(OUTCOME_NODES.map((node, i) => [node.id, outcomeMagnitude[i]])),
  };
}

function invertMatrix(matrix) {
  const n = matrix.length;
  const augmented = matrix.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ]);

  for (let col = 0; col < n; col += 1) {
    let pivotRow = col;
    for (let row = col + 1; row < n; row += 1) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[pivotRow][col])) {
        pivotRow = row;
      }
    }

    if (Math.abs(augmented[pivotRow][col]) < 1e-10) {
      throw new Error("Matrix is not invertible");
    }

    if (pivotRow !== col) {
      [augmented[col], augmented[pivotRow]] = [augmented[pivotRow], augmented[col]];
    }

    const pivot = augmented[col][col];
    for (let j = 0; j < 2 * n; j += 1) {
      augmented[col][j] /= pivot;
    }

    for (let row = 0; row < n; row += 1) {
      if (row === col) continue;
      const factor = augmented[row][col];
      for (let j = 0; j < 2 * n; j += 1) {
        augmented[row][j] -= factor * augmented[col][j];
      }
    }
  }

  return augmented.map((row) => row.slice(n));
}

function curvePath(x1, y1, x2, y2, curve) {
  const dx = x2 - x1;
  const effectiveY2 = y1 === y2 ? y2 + 0.01 : y2;
  const dy = effectiveY2 - y1;
  const isVerticalish = Math.abs(dx) < 30;
  if (isVerticalish) {
    return `M ${x1} ${y1} C ${x1} ${y1 + dy * 0.35}, ${x2} ${effectiveY2 - dy * 0.35}, ${x2} ${effectiveY2}`;
  }
  return `M ${x1} ${y1} C ${x1 + dx * curve} ${y1}, ${x2 - dx * curve} ${effectiveY2}, ${x2} ${effectiveY2}`;
}

function Panel({ title, children }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function StageLabel({ x, y, text }) {
  return (
    <text x={x} y={y} fontSize="16" fontWeight="600" fill="#0f172a" textAnchor="middle">
      {text}
    </text>
  );
}

function Node({ node, magnitude = 0, globalNodeMax }) {
  const fillMap = {
    investor: "#e2e8f0",
    supply: "#dbeafe",
    price: "#ede9fe",
    size: "#dcfce7",
    return: "#fef3c7",
    outcome: "#ffe4e6",
  };

  const strokeMap = {
    investor: "#94a3b8",
    supply: "#60a5fa",
    price: "#a78bfa",
    size: "#34d399",
    return: "#f59e0b",
    outcome: "#f43f5e",
  };

  const baseWidth = node.kind === "investor" ? 138 : VISUAL.node.baseWidth;
  const baseHeight = node.kind === "investor" ? 40 : VISUAL.node.baseHeight;
  const scale = node.kind === "investor" ? 1 : mapNodeScale(magnitude, globalNodeMax, VISUAL.node);
  const width = baseWidth * scale;
  const height = baseHeight * scale;

  return (
    <g>
      <rect
        x={node.x - width / 2}
        y={node.y - height / 2}
        width={width}
        height={height}
        rx="15"
        fill={fillMap[node.kind]}
        stroke={strokeMap[node.kind]}
        strokeWidth="1.5"
      />
      <text x={node.x} y={node.y - 2} textAnchor="middle" fontSize="13" fontWeight="600" fill="#0f172a">
        {node.label}
      </text>
    </g>
  );
}

export default EconomicSystemVisualizationGallery;
