// Lightweight SVG Impact Frontier chart. No dependencies.

export function renderFrontierChart(svg, frontier, result) {
  if (!svg || !frontier) return;
  const width = 640;
  const height = 390;
  const margin = { top: 24, right: 28, bottom: 58, left: 62 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Impact Frontier chart with expected outcome change on the horizontal axis and risk-adjusted return on the vertical axis.');
  clear(svg);

  const allPoints = [...frontier.candidates, ...frontier.frontierPoints];
  if (result) allPoints.push({ outcome: result.blendedOutcome, riskAdjustedReturn: result.riskAdjustedReturn });
  const xVals = allPoints.map(d => d.outcome).filter(Number.isFinite);
  const yVals = allPoints.map(d => d.riskAdjustedReturn).filter(Number.isFinite);
  const xDomain = paddedDomain(Math.min(...xVals), Math.max(...xVals), 0.12);
  const yDomain = paddedDomain(Math.min(...yVals), Math.max(...yVals), 0.16);

  const x = v => margin.left + (v - xDomain[0]) / (xDomain[1] - xDomain[0]) * innerW;
  const y = v => margin.top + innerH - (v - yDomain[0]) / (yDomain[1] - yDomain[0]) * innerH;

  svg.appendChild(rect(0, 0, width, height, 16, 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0.10)'));

  // Grid and axes.
  const xTicks = ticks(xDomain[0], xDomain[1], 5);
  const yTicks = ticks(yDomain[0], yDomain[1], 5);
  for (const t of xTicks) {
    svg.appendChild(line(x(t), margin.top, x(t), margin.top + innerH, 'rgba(238,233,218,0.10)', 1));
    svg.appendChild(text(formatNumber(t), x(t), height - 32, 'middle', 'chart-tick'));
  }
  for (const t of yTicks) {
    svg.appendChild(line(margin.left, y(t), margin.left + innerW, y(t), 'rgba(238,233,218,0.10)', 1));
    svg.appendChild(text(formatNumber(t), margin.left - 12, y(t) + 4, 'end', 'chart-tick'));
  }
  svg.appendChild(line(margin.left, margin.top + innerH, margin.left + innerW, margin.top + innerH, 'rgba(238,233,218,0.50)', 1.25));
  svg.appendChild(line(margin.left, margin.top, margin.left, margin.top + innerH, 'rgba(238,233,218,0.50)', 1.25));

  // Candidate cloud, thinned.
  const cloud = thin(frontier.candidates, 180);
  for (const c of cloud) {
    svg.appendChild(circle(x(c.outcome), y(c.riskAdjustedReturn), 2.1, 'rgba(238,233,218,0.16)', 'none'));
  }

  // Frontier line.
  if (frontier.frontierPoints.length > 1) {
    const d = frontier.frontierPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.outcome).toFixed(1)} ${y(p.riskAdjustedReturn).toFixed(1)}`).join(' ');
    svg.appendChild(path(d, 'none', 'rgba(226,173,96,0.95)', 3.1, 'round'));
    svg.appendChild(path(d, 'none', 'rgba(255,229,187,0.24)', 8, 'round'));
  }

  // Player point.
  if (result) {
    const px = x(result.blendedOutcome);
    const py = y(result.riskAdjustedReturn);
    svg.appendChild(line(px, py, px, margin.top + innerH, 'rgba(111,184,191,0.35)', 1.1, '4 5'));
    svg.appendChild(line(margin.left, py, px, py, 'rgba(111,184,191,0.35)', 1.1, '4 5'));
    svg.appendChild(circle(px, py, 8, 'rgba(62, 160, 169, 0.92)', 'rgba(246,243,231,0.92)', 2));
    svg.appendChild(circle(px, py, 15, 'rgba(62,160,169,0.18)', 'rgba(111,184,191,0.30)', 1));
    svg.appendChild(text('Your run', px + 16, py - 12, 'start', 'chart-label'));
  }

  svg.appendChild(text('Expected outcome change →', margin.left + innerW / 2, height - 12, 'middle', 'chart-axis-label'));
  const yLabel = text('Risk-adjusted return ↑', 20, margin.top + innerH / 2, 'middle', 'chart-axis-label');
  yLabel.setAttribute('transform', `rotate(-90 20 ${margin.top + innerH / 2})`);
  svg.appendChild(yLabel);

  svg.appendChild(text('Playable Impact Frontier', margin.left, 18, 'start', 'chart-title'));
  svg.appendChild(text('approximate grid search over feasible 100-token offers', width - margin.right, 18, 'end', 'chart-subtitle'));
}

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function create(tag) {
  return document.createElementNS('http://www.w3.org/2000/svg', tag);
}

function line(x1, y1, x2, y2, stroke, width = 1, dash = '') {
  const el = create('line');
  el.setAttribute('x1', x1);
  el.setAttribute('y1', y1);
  el.setAttribute('x2', x2);
  el.setAttribute('y2', y2);
  el.setAttribute('stroke', stroke);
  el.setAttribute('stroke-width', width);
  if (dash) el.setAttribute('stroke-dasharray', dash);
  return el;
}

function circle(cx, cy, r, fill, stroke = 'none', strokeWidth = 0) {
  const el = create('circle');
  el.setAttribute('cx', cx);
  el.setAttribute('cy', cy);
  el.setAttribute('r', r);
  el.setAttribute('fill', fill);
  el.setAttribute('stroke', stroke);
  if (strokeWidth) el.setAttribute('stroke-width', strokeWidth);
  return el;
}

function rect(x, y, w, h, rx, fill, stroke = 'none') {
  const el = create('rect');
  el.setAttribute('x', x);
  el.setAttribute('y', y);
  el.setAttribute('width', w);
  el.setAttribute('height', h);
  el.setAttribute('rx', rx);
  el.setAttribute('fill', fill);
  el.setAttribute('stroke', stroke);
  return el;
}

function path(d, fill, stroke, strokeWidth = 1, linecap = 'butt') {
  const el = create('path');
  el.setAttribute('d', d);
  el.setAttribute('fill', fill);
  el.setAttribute('stroke', stroke);
  el.setAttribute('stroke-width', strokeWidth);
  el.setAttribute('stroke-linecap', linecap);
  el.setAttribute('stroke-linejoin', 'round');
  return el;
}

function text(value, x, y, anchor = 'start', className = '') {
  const el = create('text');
  el.textContent = value;
  el.setAttribute('x', x);
  el.setAttribute('y', y);
  el.setAttribute('text-anchor', anchor);
  if (className) el.setAttribute('class', className);
  return el;
}

function paddedDomain(min, max, padRatio) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
  if (min === max) return [min - 1, max + 1];
  const span = max - min;
  return [min - span * padRatio, max + span * padRatio];
}

function ticks(min, max, count) {
  const out = [];
  if (min === max) return [min];
  for (let i = 0; i < count; i++) out.push(min + (max - min) * i / (count - 1));
  return out;
}

function formatNumber(v) {
  if (Math.abs(v) >= 10) return String(Math.round(v));
  return v.toFixed(1);
}

function thin(points, max) {
  if (points.length <= max) return points;
  const out = [];
  for (let i = 0; i < max; i++) {
    const idx = Math.floor(i * points.length / max);
    out.push(points[idx]);
  }
  return out;
}
