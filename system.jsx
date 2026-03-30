const { useMemo, useState } = React;

const FIRMS = ["Firm A", "Firm B", "Firm C", "Firm D"];
const OUTCOMES = ["Production", "Emissions", "Consumer surplus"];

const INITIAL_INVESTOR_SUPPLY = [8, 3, 6, 2];
const TOTAL_INVESTOR_SUPPLY = INITIAL_INVESTOR_SUPPLY.reduce((a, b) => a + b, 0);

const SUPPLY_SPILLOVER_S = [
  [1.0, 0.28, 0.18, 0.12],
  [0.28, 0.95, 0.22, 0.16],
  [0.18, 0.22, 1.05, 0.24],
  [0.12, 0.16, 0.24, 0.9],
];

const RETURNS_TO_SCALE_D = buildReturnsToScaleMatrix(SUPPLY_SPILLOVER_S);

const RETURN_KERNEL = [
  [0.95, 0.18, 0.08, 0.05],
  [0.16, 0.9, 0.14, 0.08],
  [0.08, 0.14, 1.0, 0.16],
  [0.05, 0.08, 0.16, 0.92],
];

const QUANTITY_TO_OUTCOME_KERNEL = [
  [0.8, 0.2, 0.6],
  [0.7, 0.5, 0.4],
  [0.6, 0.9, 0.7],
  [0.5, 0.8, 0.9],
];

const INVESTOR_NODE = {
  id: "investor",
  label: "Investor",
  x: 90,
  y: 245,
  kind: "investor",
};

const SUPPLY_NODES = FIRMS.map((label, i) => ({
  id: `s-${i}`,
  label,
  x: 340,
  y: 110 + i * 95,
  kind: "supply",
}));

const PRICE_NODES = FIRMS.map((label, i) => ({
  id: `p-${i}`,
  label,
  x: 720,
  y: 110 + i * 95,
  kind: "price",
}));

const QUANTITY_NODES = FIRMS.map((label, i) => ({
  id: `q-${i}`,
  label,
  x: 1100,
  y: 50 + i * 58,
  kind: "quantity",
}));

const RETURN_NODES = FIRMS.map((label, i) => ({
  id: `r-${i}`,
  label,
  x: 1100,
  y: 330 + i * 60,
  kind: "return",
}));

const OUTCOME_NODES = OUTCOMES.map((label, i) => ({
  id: `o-${i}`,
  label,
  x: 1490,
  y: 130 + i * 110,
  kind: "outcome",
}));

const ALL_NODES = [
  INVESTOR_NODE,
  ...SUPPLY_NODES,
  ...PRICE_NODES,
  ...QUANTITY_NODES,
  ...RETURN_NODES,
  ...OUTCOME_NODES,
];

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

function EconomicSystemVisualizationGallery() {
  const [naive, setNaive] = useState(false);
  const [investorSupply, setInvestorSupply] = useState(INITIAL_INVESTOR_SUPPLY);

  const sizeKernel = useMemo(() => invertMatrix(addMatrices(SUPPLY_SPILLOVER_S, RETURNS_TO_SCALE_D)), []);

  const supplyToPriceFlows = useMemo(
    () => buildFlowMatrixFromSource(investorSupply, SUPPLY_SPILLOVER_S),
    [investorSupply]
  );

  const pricePressureTotals = useMemo(
    () => columnSums(supplyToPriceFlows),
    [supplyToPriceFlows]
  );

  const priceToQuantityFlows = useMemo(
    () => buildFlowMatrixFromSource(pricePressureTotals, sizeKernel),
    [pricePressureTotals, sizeKernel]
  );

  const priceToReturnFlows = useMemo(
    () => buildFlowMatrixFromSource(pricePressureTotals, RETURN_KERNEL),
    [pricePressureTotals]
  );

  const quantityTotals = useMemo(
    () => columnSums(priceToQuantityFlows),
    [priceToQuantityFlows]
  );

  const quantityToOutcomeFlows = useMemo(
    () => buildFlowMatrixFromSource(quantityTotals, QUANTITY_TO_OUTCOME_KERNEL),
    [quantityTotals]
  );

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
      const roundingGap = TOTAL_INVESTOR_SUPPLY - correctedTotal;
      next[index] += roundingGap;

      return next.map((value) => Math.max(0, value));
    });
  };

  const resetSupply = () => setInvestorSupply(INITIAL_INVESTOR_SUPPLY);

  return (
    <div key={naive ? "root-naive" : "root-system"} className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <div className="max-w-[1850px] mx-auto space-y-8">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">Interactive flow field for a system aware economic model</h1>
          <p className="text-lg text-slate-700 max-w-6xl">
            Price pressure now comes from a positive diagonal heavy matrix S. Equilibrium firm size now comes from the inverse of S plus a diagonal heavy returns to scale matrix D. Returns and aggregate outcomes are also propagated from those updated states.
          </p>
        </header>

        <div className="space-y-6">
          <Panel title="Mode">
            <p className="text-sm text-slate-600">Switch between the two states.</p>
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
                Naive
              </Button>
            </div>
          </Panel>

          <Panel title="Investor supply controls">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-slate-600">Drag the handles to reallocate a fixed total supply weight across firms.</p>
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
                <div key={firm} className="grid grid-cols-[140px_minmax(0,1fr)_64px] items-center gap-4">
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
                  <div className="text-sm font-mono text-slate-600 text-right">{investorSupply[i].toFixed(1)}</div>
                </div>
              ))}
            </div>
          </Panel>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900">Prototype</h2>
            <p className="text-sm text-slate-600 mt-1">Investor supply, price pressure, firm size, returns, and aggregate outcomes now respond to the current supply allocation.</p>
            <div className="mt-6 overflow-x-auto">
              {naive ? (
                <NaivePrototype
                  investorSupply={investorSupply}
                  supplyToPriceFlows={supplyToPriceFlows}
                  priceToQuantityFlows={priceToQuantityFlows}
                  priceToReturnFlows={priceToReturnFlows}
                  quantityToOutcomeFlows={quantityToOutcomeFlows}
                />
              ) : (
                <SystemPrototype
                  investorSupply={investorSupply}
                  supplyToPriceFlows={supplyToPriceFlows}
                  priceToQuantityFlows={priceToQuantityFlows}
                  priceToReturnFlows={priceToReturnFlows}
                  quantityToOutcomeFlows={quantityToOutcomeFlows}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SystemPrototype({ investorSupply, supplyToPriceFlows, priceToQuantityFlows, priceToReturnFlows, quantityToOutcomeFlows }) {
  return (
    <svg key="svg-system" viewBox="0 0 1720 860" className="w-full min-w-[1500px]">
      <SvgDefs />
      <SceneLabels />
      <InvestorStage investorSupply={investorSupply} />
      {renderSystemStage(SUPPLY_NODES, PRICE_NODES, supplyToPriceFlows, "g2", "sp", 1.8)}
      {renderSystemStage(PRICE_NODES, QUANTITY_NODES, priceToQuantityFlows, "g3", "pq", 10)}
      {renderSystemStage(PRICE_NODES, RETURN_NODES, priceToReturnFlows, "g4", "pr", 0.8)}
      <OutcomeStage quantityToOutcomeFlows={quantityToOutcomeFlows} />
      <AllNodes />
    </svg>
  );
}

function NaivePrototype({ investorSupply, supplyToPriceFlows, priceToQuantityFlows, priceToReturnFlows, quantityToOutcomeFlows }) {
  return (
    <svg key="svg-naive" viewBox="0 0 1720 860" className="w-full min-w-[1500px]">
      <SvgDefs />
      <SceneLabels />
      <InvestorStage investorSupply={investorSupply} />
      {renderNaiveStage(SUPPLY_NODES, PRICE_NODES, supplyToPriceFlows, "g2", "sp", 1.8)}
      {renderNaiveStage(PRICE_NODES, QUANTITY_NODES, priceToQuantityFlows, "g3", "pq", 10)}
      {renderNaiveStage(PRICE_NODES, RETURN_NODES, priceToReturnFlows, "g4", "pr", 0.8)}
      <OutcomeStage quantityToOutcomeFlows={quantityToOutcomeFlows} />
      <AllNodes />
    </svg>
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
      <StageLabel x={1100} y={16} text="Equilibrium firm size" />
      <StageLabel x={1490} y={66} text="Aggregate outcomes" />
      <StageLabel x={1100} y={280} text="Equilibrium returns" />
    </>
  );
}

function InvestorStage({ investorSupply }) {
  return SUPPLY_NODES.map((to, i) => (
    <path
      key={`is-${i}`}
      d={curvePath(INVESTOR_NODE.x + 78, INVESTOR_NODE.y, to.x - 72, to.y, 0.38)}
      fill="none"
      stroke="url(#g1)"
      strokeWidth={2 + investorSupply[i] * 1.6}
      strokeLinecap="round"
      opacity={0.72}
    />
  ));
}

function OutcomeStage({ quantityToOutcomeFlows }) {
  return renderSystemStage(QUANTITY_NODES, OUTCOME_NODES, quantityToOutcomeFlows, "g5", "qo", 0.9, 0.42, 0.6);
}

function AllNodes() {
  return ALL_NODES.map((node) => <Node key={node.id} node={node} />);
}

function renderSystemStage(fromNodes, toNodes, matrix, gradientId, prefix, widthScale, offDiagonalOpacity = 0.55, diagonalOpacity = 0.9) {
  return FIRMS.flatMap((_, i) =>
    toNodes.map((_, j) => {
      const value = matrix[i][j];
      const width = widthFromValue(value, widthScale, 2.2);
      return (
        <path
          key={`${prefix}-system-${i}-${j}`}
          d={curvePath(fromNodes[i].x + 72, fromNodes[i].y, toNodes[j].x - 72, toNodes[j].y, 0.24)}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={width}
          strokeLinecap="round"
          opacity={i === j ? diagonalOpacity : offDiagonalOpacity}
        />
      );
    })
  );
}

function renderNaiveStage(fromNodes, toNodes, matrix, gradientId, prefix, widthScale) {
  return FIRMS.flatMap((_, i) =>
    toNodes.map((_, j) => {
      const value = matrix[i][j];
      const width = i === j ? widthFromValue(value, widthScale, 2.2) : 0;
      return (
        <path
          key={`${prefix}-naive-${i}-${j}`}
          d={curvePath(fromNodes[i].x + 72, fromNodes[i].y, toNodes[j].x - 72, toNodes[j].y, 0.24)}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={width}
          strokeLinecap="round"
          opacity={i === j ? 0.98 : 0.55}
        />
      );
    })
  );
}

function widthFromValue(value, scale, base = 2) {
  return value === 0 ? 0 : base + Math.abs(value) * scale;
}

function buildReturnsToScaleMatrix(sMatrix) {
  return sMatrix.map((row, i) =>
    row.map((value, j) => (i === j ? value * 10 : value * 0.15))
  );
}

function buildFlowMatrixFromSource(sourceVector, kernelMatrix) {
  return sourceVector.map((sourceValue, i) =>
    kernelMatrix[i].map((entry) => sourceValue * entry)
  );
}

function columnSums(matrix) {
  const cols = matrix[0].length;
  return Array.from({ length: cols }, (_, j) => matrix.reduce((sum, row) => sum + row[j], 0));
}

function addMatrices(a, b) {
  return a.map((row, i) => row.map((value, j) => value + b[i][j]));
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

function Node({ node }) {
  const fillMap = {
    investor: "#e2e8f0",
    supply: "#dbeafe",
    price: "#ede9fe",
    quantity: "#dcfce7",
    return: "#fef3c7",
    outcome: "#ffe4e6",
  };

  const strokeMap = {
    investor: "#94a3b8",
    supply: "#60a5fa",
    price: "#a78bfa",
    quantity: "#34d399",
    return: "#f59e0b",
    outcome: "#f43f5e",
  };

  const width = node.kind === "investor" ? 138 : node.kind === "outcome" ? 146 : node.kind === "return" ? 126 : 118;
  const height = node.kind === "outcome" ? 46 : 40;

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

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<EconomicSystemVisualizationGallery />);