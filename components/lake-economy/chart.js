function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function fmt(v) {
  if (!Number.isFinite(v)) return '—';
  const abs = Math.abs(v);
  if (abs >= 100) return v.toFixed(0);
  if (abs >= 10) return v.toFixed(1);
  return v.toFixed(2);
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function renderFrontierChart(container, grid, score) {
  if (!container) return;
  if (!grid || !grid.points?.length) {
    container.innerHTML = `<div class="chart-empty">Run the economy to place your offers on the frontier.</div>`;
    return;
  }

  const all = grid.points.filter(p => Number.isFinite(p.blendedGainVsEqual) && Number.isFinite(p.ceGainVsEqual));
  const frontier = [...grid.frontier]
    .filter(p => Number.isFinite(p.blendedGainVsEqual) && Number.isFinite(p.ceGainVsEqual))
    .sort((a, b) => a.blendedGainVsEqual - b.blendedGainVsEqual);

  if (!all.length) {
    container.innerHTML = `<div class="chart-empty">The frontier grid did not produce valid points for this lake.</div>`;
    return;
  }

  const currentX = score?.blendedGainVsEqual ?? 0;
  const currentY = score?.ceGainVsEqual ?? 0;
  const xs = all.map(p => p.blendedGainVsEqual).concat([0, currentX]);
  const ys = all.map(p => p.ceGainVsEqual).concat([0, currentY]);
  let xMin = Math.min(...xs), xMax = Math.max(...xs);
  let yMin = Math.min(...ys), yMax = Math.max(...ys);
  const xPad = Math.max(0.25, (xMax - xMin) * 0.08);
  const yPad = Math.max(0.10, (yMax - yMin) * 0.12);
  xMin -= xPad; xMax += xPad; yMin -= yPad; yMax += yPad;

  const W = 360, H = 232;
  const m = { left: 46, right: 18, top: 16, bottom: 44 };
  const iw = W - m.left - m.right;
  const ih = H - m.top - m.bottom;
  const sx = x => m.left + (x - xMin) / (xMax - xMin) * iw;
  const sy = y => m.top + ih - (y - yMin) / (yMax - yMin) * ih;

  const x0 = clamp(sx(0), m.left, m.left + iw);
  const y0 = clamp(sy(0), m.top, m.top + ih);

  const sampled = all.filter((_, i) => i % Math.ceil(all.length / 900) === 0);
  const dots = sampled.map(p => {
    const positive = p.blendedGainVsEqual >= 0;
    return `<circle cx="${sx(p.blendedGainVsEqual).toFixed(2)}" cy="${sy(p.ceGainVsEqual).toFixed(2)}" r="1.45" class="${positive ? 'pt-positive' : 'pt-negative'}" />`;
  }).join('');

  const path = frontier.length
    ? `M ${frontier.map(p => `${sx(p.blendedGainVsEqual).toFixed(2)} ${sy(p.ceGainVsEqual).toFixed(2)}`).join(' L ')}`
    : '';

  const current = score ? `
    <g class="current-point">
      <circle cx="${sx(currentX).toFixed(2)}" cy="${sy(currentY).toFixed(2)}" r="6.2" />
      <circle cx="${sx(currentX).toFixed(2)}" cy="${sy(currentY).toFixed(2)}" r="2.2" />
    </g>` : '';

  const ticksX = [xMin, 0, xMax].map((v, i) => `
    <g class="tick">
      <line x1="${sx(v).toFixed(2)}" x2="${sx(v).toFixed(2)}" y1="${m.top + ih}" y2="${m.top + ih + 4}" />
      <text x="${sx(v).toFixed(2)}" y="${m.top + ih + 18}" text-anchor="${i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}">${escapeXml(fmt(v))}</text>
    </g>`).join('');

  const ticksY = [yMin, 0, yMax].map((v, i) => `
    <g class="tick">
      <line x1="${m.left - 4}" x2="${m.left}" y1="${sy(v).toFixed(2)}" y2="${sy(v).toFixed(2)}" />
      <text x="${m.left - 8}" y="${(sy(v) + 3).toFixed(2)}" text-anchor="end">${escapeXml(fmt(v))}</text>
    </g>`).join('');

  container.innerHTML = `
    <svg class="frontier-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Impact Frontier chart">
      <rect x="0" y="0" width="${W}" height="${H}" rx="18" class="chart-bg" />
      <line x1="${m.left}" x2="${m.left + iw}" y1="${y0.toFixed(2)}" y2="${y0.toFixed(2)}" class="zero-line" />
      <line x1="${x0.toFixed(2)}" x2="${x0.toFixed(2)}" y1="${m.top}" y2="${m.top + ih}" class="zero-line" />
      <rect x="${m.left}" y="${m.top}" width="${iw}" height="${ih}" class="plot-frame" />
      ${dots}
      ${path ? `<path d="${path}" class="frontier-path" />` : ''}
      ${current}
      ${ticksX}${ticksY}
      <text x="${m.left + iw / 2}" y="${H - 9}" class="axis-label" text-anchor="middle">Expected outcome change</text>
      <text transform="translate(14 ${m.top + ih / 2}) rotate(-90)" class="axis-label" text-anchor="middle">Risk-adjusted return</text>
    </svg>`;
}
