function IntegrationScatterplot() {
  const GEOM = {
    xMin: -0.2,
    xMax: 1.3,
    yMin: -0.015,
    yMax: 1.25,
    yH: 1.0,
    xV: 0.9,
    yP: 0.2,
    tradInvestingShare: 0.95,
    tradPhilanthropyShare: 0.05,
    m: -1.2,
    c: 1.25,
  };

  const COLORS = {
    orange: "rgb(255, 140, 0)",
    pointOrange: "rgba(255, 191, 77, 0.42)",
    blue: "rgb(31, 94, 163)",
    green: "rgb(51, 158, 71)",
    darkGreen: "rgb(0, 99, 0)",
    red: "rgb(199, 46, 51)",
    grey: "rgb(115, 115, 115)",
    axis: "rgb(0, 0, 0)",
    bg: "rgb(255, 255, 255)",
    greenHex: "#339e47",
    redHex: "#c72e33",
  };

  const DOT = {
    baseSize: 18,
    sizeScale: 2800,
  };

  const VIEW = {
    width: 1100,
    height: 820,
    left: 90,
    right: 40,
    top: 30,
    bottom: 160,
  };

  const PLOT = {
    width: VIEW.width - VIEW.left - VIEW.right,
    height: VIEW.height - VIEW.top - VIEW.bottom,
  };

  const X_POINTS = [
    -0.10803, -0.17, 0.17066, 0.198859, -0.011937, 0.123464, 0.392079, 0.26216, 0.191528, 0.18755,
    -0.122713, 0.242803, -0.17, -0.016418, -0.037459, -0.17, 0.027932, 0.378691, -0.018025, -0.17,
    0.031789, 0.220785, 0.088644, 0.049467, -0.17, 0.150203, 0.147146, 0.318253, 0.347811, 0.187717,
    -0.17, -0.17, -0.169596, 0.108985, -0.107449, 0.311908, 0.098771, 0.122953, 0.200102, 0.11805,
    -0.17, 0.540386, 0.342598, 0.354626, -0.099497, -0.17, -0.17, -0.160693, 0.226428, 0.230064,
    0.341679, 0.47849, 0.154182, 0.120912, -0.0226, -0.017293, -0.17, 0.15216, 0.699636, 0.487798,
    1.024319, 0.663035, 0.613811, 0.864543, 0.542865, 0.725897, 0.668159, 0.69654, 0.664212, 0.372316,
    0.926185, 0.608333, 0.785764, 0.340361, 0.707071, 0.653155, 0.40851, 0.764993, 0.706412, 0.813687,
    0.546492, 0.576863, 0.7016, 0.605605, 0.796548, 0.45866, 0.924159, 0.815556, 0.621493, 0.919724,
    0.770845, 0.77117, 0.635317, 0.698826, 1.231212, 0.634793, 0.795439, 0.50227, 0.822202, 0.326418,
    0.855253, 0.979654, 0.421412, 0.902699, 0.56359, 0.746774, 0.30341, 0.50966, 0.509407, 0.848627,
    0.682753, 0.496055, 0.867397, 0.233695, 0.684511, 0.786333, 0.342335, 0.64159, -0.044833, -0.163989,
    -0.067592, -0.159979, -0.04641, -0.17, -0.135527, -0.130333, -0.17, -0.057361, -0.17, -0.165363,
    -0.128235, -0.062788, -0.140667, -0.000561, -0.101247, -0.114453, -0.07757, -0.106558, 0.868635, 0.86806,
    0.513263, 0.697055, 0.700161, 0.717228, 1.26, 0.614846, 0.612448, 0.562574, 0.887309, 1.149843,
    1.26, 0.889325, 0.852168, 1.112406, 0.911693, 1.062679, 1.220282, 1.012034, 1.141219, 1.051881,
    1.07874,
  ];

  const Y_POINTS = [
    1.131817, 1.05948, 1.018941, 1.145695, 1.23, 1.10815, 1.128377, 1.045183, 1.075147, 1.06835,
    1.071492, 1.040276, 1.139638, 1.229973, 1.005282, 1.23, 1.0597, 1.063291, 0.884353, 0.857852,
    1.17355, 0.990892, 1.180531, 1.105063, 1.125047, 1.23, 1.092764, 0.773389, 0.926137, 1.197263,
    1.23, 1.090405, 1.02978, 0.960778, 1.154605, 0.920211, 0.975419, 1.113593, 1.110193, 1.074119,
    1.206339, 0.975659, 0.980917, 1.058164, 1.106514, 1.066223, 1.23, 1.039613, 1.163534, 1.04136,
    1.13207, 1.055711, 1.060697, 1.23, 1.066297, 1.23, 1.026047, 1.05312, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0.99423, 1.045013,
    1.116675, 1.23, 1.126345, 1.147554, 0.876245, 1.073224, 1.097208, 1.23, 1.23, 1.111858,
    1.152804, 1.093045, 1.026942, 1.101602, 1.062267, 1.132263, 1.168198, 1.079872, 1.010803, 0.576143,
    0.673528, 0.96417, 0.928422, 0.40764, 1.23, 0.78324, 0.98525, 0.799298, 1.108829, 0.766954,
    1.104989, 0.984163, 0.906494, 0.985485, 0.881585, 0.882957, 0.796061, 0.93622, 0.224688, 0.393629,
    0.021288,
  ];

    const [points, setPoints] = React.useState(
    X_POINTS.map((x, i) => ({ x, y: Y_POINTS[i] }))
    );

    const [yH, setYH] = React.useState(GEOM.yH);
    const [draggingIndex, setDraggingIndex] = React.useState(null);
    const [draggingHurdle, setDraggingHurdle] = React.useState(false);
    const svgRef = React.useRef(null);

  function signedDistanceToIntegrationLine(x, y) {
    return (y - (GEOM.m * x + GEOM.c)) / Math.sqrt(1 + GEOM.m ** 2);
  }

  function traditionalWeights(pointsInput) {
    const investScores = pointsInput.map((p) => (p.y > yH ? p.y - yH : 0));
    const investTotal = investScores.reduce((a, b) => a + b, 0);
    const investWeights =
      investTotal > 0
        ? investScores.map((s) => (GEOM.tradInvestingShare * s) / investTotal)
        : investScores.map(() => 0);

    const philScores = pointsInput.map((p) =>
      p.y <= GEOM.yP && p.x > GEOM.xV ? 1 : 0
    );
    const philTotal = philScores.reduce((a, b) => a + b, 0);
    const philWeights =
      philTotal > 0
        ? philScores.map((s) => (GEOM.tradPhilanthropyShare * s) / philTotal)
        : philScores.map(() => 0);

    return investWeights.map((w, i) => w + philWeights[i]);
  }

  function integratedWeights(pointsInput) {
    const scores = pointsInput.map((p) =>
      Math.max(signedDistanceToIntegrationLine(p.x, p.y), 0)
    );
    const total = scores.reduce((a, b) => a + b, 0);
    if (total <= 0) return scores.map(() => 0);
    return scores.map((s) => s / total);
  }

  function markerRadiusFromWeight(weight) {
    const size = DOT.baseSize + DOT.sizeScale * weight;
    return Math.max(2.2, Math.sqrt(size) * 0.46);
  }

  function clipPoint(point) {
    return {
        x: Math.max(GEOM.xMin + 0.03, Math.min(GEOM.xMax - 0.04, point.x)),
        y: Math.max(GEOM.yMin + 0.01, Math.min(GEOM.yMax - 0.02, point.y)),
    };
    }

    function svgClientToDataPoint(svgElement, clientX, clientY, GEOM, VIEW, PLOT) {
    const rect = svgElement.getBoundingClientRect();

    const xPx = ((clientX - rect.left) / rect.width) * VIEW.width;
    const yPx = ((clientY - rect.top) / rect.height) * VIEW.height;

    const x =
        GEOM.xMin + ((xPx - VIEW.left) / PLOT.width) * (GEOM.xMax - GEOM.xMin);

    const y =
        GEOM.yMax - ((yPx - VIEW.top) / PLOT.height) * (GEOM.yMax - GEOM.yMin);

    return clipPoint({ x, y });
    }

  function buildKernelBackground(pointsInput, tradW, intW, GEOM, COLORS, width = 700, height = 500) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const image = ctx.createImageData(width, height);
    const data = image.data;

    const sx = 0.11;
    const sy = 0.11;

    const deltaW = intW.map((w, i) => w - tradW[i]);

    const under = new Float32Array(width * height);
    const over = new Float32Array(width * height);

    for (let py = 0; py < height; py++) {
        const y = GEOM.yMin + (1 - py / (height - 1)) * (GEOM.yMax - GEOM.yMin);

        for (let px = 0; px < width; px++) {
        const x = GEOM.xMin + (px / (width - 1)) * (GEOM.xMax - GEOM.xMin);

        let underVal = 0;
        let overVal = 0;

        for (let i = 0; i < pointsInput.length; i++) {
            const dx = (x - pointsInput[i].x) / sx;
            const dy = (y - pointsInput[i].y) / sy;
            const kernel = Math.exp(-0.5 * (dx * dx + dy * dy));
            const d = deltaW[i];

            if (d > 0) underVal += d * kernel;
            else if (d < 0) overVal += (-d) * kernel;
        }

        const idx = py * width + px;
        under[idx] = underVal;
        over[idx] = overVal;
        }
    }

    let underMax = 1e-9;
    let overMax = 1e-9;

    for (let i = 0; i < under.length; i++) {
        if (under[i] > underMax) underMax = under[i];
        if (over[i] > overMax) overMax = over[i];
    }

    function hexToRgb(hex) {
        const clean = hex.replace("#", "");
        return {
        r: parseInt(clean.slice(0, 2), 16),
        g: parseInt(clean.slice(2, 4), 16),
        b: parseInt(clean.slice(4, 6), 16),
        };
    }

    const green = hexToRgb(COLORS.greenHex);
    const red = hexToRgb(COLORS.redHex);

    for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
        const idx = py * width + px;
        const p = idx * 4;

        const underNorm = under[idx] / underMax;
        const overNorm = over[idx] / overMax;

        const greenAlpha = under[idx] > 0 ? Math.min(1, 0.3 + 0.45 * underNorm) : 0;
        const redAlpha = over[idx] > 0 ? Math.min(1, 0.3 + 0.3 * overNorm) : 0;

        const totalAlpha = Math.max(greenAlpha, redAlpha);

        let r = 255;
        let g = 255;
        let b = 255;

        if (greenAlpha >= redAlpha) {
            r = Math.round(255 * (1 - greenAlpha) + green.r * greenAlpha);
            g = Math.round(255 * (1 - greenAlpha) + green.g * greenAlpha);
            b = Math.round(255 * (1 - greenAlpha) + green.b * greenAlpha);
        } else {
            r = Math.round(255 * (1 - redAlpha) + red.r * redAlpha);
            g = Math.round(255 * (1 - redAlpha) + red.g * redAlpha);
            b = Math.round(255 * (1 - redAlpha) + red.b * redAlpha);
        }

        data[p] = r;
        data[p + 1] = g;
        data[p + 2] = b;
        data[p + 3] = Math.round(255 * totalAlpha);
        }
    }

    ctx.putImageData(image, 0, 0);
    return canvas.toDataURL("image/png");
  }

  function sx(x) {
    return VIEW.left + ((x - GEOM.xMin) / (GEOM.xMax - GEOM.xMin)) * PLOT.width;
  }

  function sy(y) {
    return VIEW.top + PLOT.height - ((y - GEOM.yMin) / (GEOM.yMax - GEOM.yMin)) * PLOT.height;
  }

  const tradW = React.useMemo(() => traditionalWeights(points), [points]);
  const intW = React.useMemo(() => integratedWeights(points), [points]);

  const backgroundUrl = React.useMemo(() => {
    return buildKernelBackground(points, tradW, intW, GEOM, COLORS, 700, 500);
  }, [points, tradW, intW]);

  const tradMask = tradW.map((w) => w > 1e-12);
  const intMask = intW.map((w) => w > 1e-12);
  const unfundedMask = tradMask.map((t, i) => !t && !intMask[i]);

    const integrationLine = React.useMemo(() => {
    const candidates = [];

    const yAtXMin = GEOM.m * GEOM.xMin + GEOM.c;
    if (yAtXMin >= GEOM.yMin && yAtXMin <= GEOM.yMax) {
        candidates.push({ x: GEOM.xMin, y: yAtXMin });
    }

    const yAtXMax = GEOM.m * GEOM.xMax + GEOM.c;
    if (yAtXMax >= GEOM.yMin && yAtXMax <= GEOM.yMax) {
        candidates.push({ x: GEOM.xMax, y: yAtXMax });
    }

    const xAtYMin = (GEOM.yMin - GEOM.c) / GEOM.m;
    if (xAtYMin >= GEOM.xMin && xAtYMin <= GEOM.xMax) {
        candidates.push({ x: xAtYMin, y: GEOM.yMin });
    }

    const xAtYMax = (GEOM.yMax - GEOM.c) / GEOM.m;
    if (xAtYMax >= GEOM.xMin && xAtYMax <= GEOM.xMax) {
        candidates.push({ x: xAtYMax, y: GEOM.yMax });
    }

    const unique = [];
    for (const p of candidates) {
        if (!unique.some((q) => Math.abs(q.x - p.x) < 1e-9 && Math.abs(q.y - p.y) < 1e-9)) {
        unique.push(p);
        }
    }

    if (unique.length >= 2) {
        return {
        x1: unique[0].x,
        y1: unique[0].y,
        x2: unique[1].x,
        y2: unique[1].y,
        };
    }

    return null;
    }, []);

    const beginDrag = (index, e) => {
    setDraggingIndex(index);
    if (e.currentTarget.setPointerCapture) {
        e.currentTarget.setPointerCapture(e.pointerId);
    }
    };

    const beginHurdleDrag = (e) => {
    setDraggingHurdle(true);
    if (e.currentTarget.setPointerCapture) {
        e.currentTarget.setPointerCapture(e.pointerId);
    }
    };

    const updateDrag = (e) => {
    if (!svgRef.current) return;

    const nextPoint = svgClientToDataPoint(
        svgRef.current,
        e.clientX,
        e.clientY,
        GEOM,
        VIEW,
        PLOT
    );

    if (draggingHurdle) {
        const clippedY = Math.max(GEOM.yMin + 0.03, Math.min(GEOM.yMax - 0.03, nextPoint.y));
        setYH(clippedY);
        return;
    }

    if (draggingIndex === null) return;

    setPoints((prev) =>
        prev.map((p, i) => (i === draggingIndex ? nextPoint : p))
    );
    };

    const endDrag = () => {
        setDraggingIndex(null);
        setDraggingHurdle(false);
    };

  return (
    <div className="w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        className="w-full h-auto rounded-2xl bg-white"
        style={{ touchAction: "none" }}
        onPointerMove={updateDrag}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        <rect x="0" y="0" width={VIEW.width} height={VIEW.height} fill={COLORS.bg} />
        <image
            href={backgroundUrl}
            x={VIEW.left}
            y={VIEW.top}
            width={PLOT.width}
            height={PLOT.height}
            preserveAspectRatio="none"
        />

        {/* axes */}
        <line
          x1={sx(GEOM.xMin)}
          y1={sy(0)}
          x2={sx(GEOM.xMax)}
          y2={sy(0)}
          stroke={COLORS.axis}
          strokeWidth="1.5"
        />
        <line
          x1={sx(0)}
          y1={sy(GEOM.yMin)}
          x2={sx(0)}
          y2={sy(GEOM.yMax)}
          stroke={COLORS.axis}
          strokeWidth="1.5"
        />

        {/* arrowheads */}
        <polygon
          points={`${sx(GEOM.xMax) + 14},${sy(0)} ${sx(GEOM.xMax) + 2},${sy(0) - 6} ${sx(GEOM.xMax) + 2},${sy(0) + 6}`}
          fill={COLORS.axis}
        />
        <polygon
          points={`${sx(0)},${sy(GEOM.yMax) - 14} ${sx(0) - 6},${sy(GEOM.yMax) - 2} ${sx(0) + 6},${sy(GEOM.yMax) - 2}`}
          fill={COLORS.axis}
        />
        <polygon
          points={`${sx(GEOM.xMin) - 14},${sy(0)} ${sx(GEOM.xMin) - 2},${sy(0) - 6} ${sx(GEOM.xMin) - 2},${sy(0) + 6}`}
          fill={COLORS.axis}
        />

        {/* hurdle lines */}
        <line
          x1={sx(GEOM.xMin)}
          y1={sy(yH)}
          x2={sx(GEOM.xMax)}
          y2={sy(yH)}
          stroke={COLORS.orange}
          strokeWidth="2.2"
          strokeDasharray="9 8"
        />
        <line
          x1={sx(GEOM.xV)}
          y1={sy(GEOM.yMin)}
          x2={sx(GEOM.xV)}
          y2={sy(GEOM.yP)}
          stroke={COLORS.orange}
          strokeWidth="2.2"
          strokeDasharray="9 8"
        />
        <line
          x1={sx(GEOM.xV)}
          y1={sy(GEOM.yP)}
          x2={sx(GEOM.xMax)}
          y2={sy(GEOM.yP)}
          stroke={COLORS.orange}
          strokeWidth="2.2"
          strokeDasharray="9 8"
        />

        {/* draggable hit area for traditional hurdle */}
        <line
        x1={sx(GEOM.xMin)}
        y1={sy(yH)}
        x2={sx(GEOM.xMax)}
        y2={sy(yH)}
        stroke="transparent"
        strokeWidth="18"
        style={{ cursor: draggingHurdle ? "grabbing" : "ns-resize" }}
        onPointerDown={beginHurdleDrag}
        />

        {/* integration line */}
        {integrationLine && (
        <line
            x1={sx(integrationLine.x1)}
            y1={sy(integrationLine.y1)}
            x2={sx(integrationLine.x2)}
            y2={sy(integrationLine.y2)}
            stroke={COLORS.blue}
            strokeWidth="2.6"
        />
        )}

        {/* unfunded points */}
        {points.map((p, i) =>
          unfundedMask[i] ? (
            <circle
              key={`u-${i}`}
              cx={sx(p.x)}
              cy={sy(p.y)}
              r="2.4"
              fill="white"
              stroke={COLORS.grey}
              strokeWidth="1"
              opacity="0.95"
            />
          ) : null
        )}

        {/* traditional allocation */}
        {points.map((p, i) =>
          tradMask[i] ? (
            <circle
              key={`t-${i}`}
              cx={sx(p.x)}
              cy={sy(p.y)}
              r={markerRadiusFromWeight(tradW[i])}
              fill={COLORS.pointOrange}
              stroke={COLORS.orange}
              strokeWidth="1.2"
            />
          ) : null
        )}

        {/* integrated allocation */}
        {points.map((p, i) =>
          intMask[i] ? (
            <circle
              key={`i-${i}`}
              cx={sx(p.x)}
              cy={sy(p.y)}
              r={markerRadiusFromWeight(intW[i])}
              fill="none"
              stroke={COLORS.blue}
              strokeWidth="1.5"
            />
          ) : null
        )}

        {/* labels */}
        <text
          x={sx(0.03)}
          y={VIEW.top - 6}
          textAnchor="start"
          fontSize="18"
          fill="#0f172a"
        >
          Risk-adjusted financial return
        </text>

        <text
          x={sx(GEOM.xMax) - 10}
          y={sy(0) + 42}
          textAnchor="end"
          fontSize="18"
          fill="#0f172a"
        >
          Impact
        </text>

        <text
          x={sx(0.49)}
          y={sy(yH) - 10}
          fontSize="15"
          fill={COLORS.orange}
        >
          Traditional investing hurdle rate
        </text>

        <text
          x={sx(0.96)}
          y={sy(0.145)}
          fontSize="15"
          fill={COLORS.orange}
        >
          Traditional philanthropy zone
        </text>

        <text
          x={sx(0.44)}
          y={sy(0.4)}
          fontSize="15"
          fill={COLORS.blue}
          transform={`rotate(-0 ${sx(0.44)} ${sy(0.4)})`}
        >
          Integrated hurdle rate
        </text>

        <text x={sx(0.9)} y={sy(0.58)} fontSize="17" fill={COLORS.darkGreen}>
          <tspan x={sx(0.9)} dy="0">Zone of opportunities missed</tspan>
          <tspan x={sx(0.9)} dy="20">without integration</tspan>
        </text>

        {/* drag handles */}
        {points.map((p, i) => (
        <circle
            key={`drag-${i}`}
            cx={sx(p.x)}
            cy={sy(p.y)}
            r="12"
            fill="rgba(0,0,0,0.001)"
            pointerEvents="all"
            style={{ cursor: draggingIndex === i ? "grabbing" : "grab" }}
            onPointerDown={(e) => beginDrag(i, e)}
        />
        ))}

        {/* legend */}
        <g transform={`translate(${VIEW.width / 2 - 280}, ${VIEW.height - 92})`}>
          <circle cx="0" cy="0" r="8" fill={COLORS.pointOrange} stroke={COLORS.orange} strokeWidth="1.2" />
          <text x="16" y="5" fontSize="14" fill="#0f172a">Traditional allocation</text>

          <circle cx="220" cy="0" r="8" fill="none" stroke={COLORS.blue} strokeWidth="1.5" />
          <text x="236" y="5" fontSize="14" fill="#0f172a">Integrated allocation</text>

          <circle cx="430" cy="0" r="6" fill="white" stroke={COLORS.grey} strokeWidth="1" />
          <text x="444" y="5" fontSize="14" fill="#0f172a">Unfunded under both approaches</text>
        </g>

        <g transform={`translate(${VIEW.width / 2 - 150}, ${VIEW.height - 56})`}>
          <circle cx="0" cy="0" r="8" fill="rgba(199, 46, 51, 0.35)" stroke="none" />
          <text x="16" y="5" fontSize="14" fill="#0f172a">Overinvestment without integration</text>

          <circle cx="280" cy="0" r="8" fill="rgba(51, 158, 71, 0.35)" stroke="none" />
          <text x="296" y="5" fontSize="14" fill="#0f172a">Underinvestment without integration</text>
        </g>
      </svg>
    </div>
  );
}

window.IntegrationScatterplot = IntegrationScatterplot;