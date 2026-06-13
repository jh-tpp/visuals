// Canvas-based isometric lake world. No external dependencies.
// This is deliberately a visual layer only; economic logic lives in economy.js.

const ENTITY_POSITIONS = [
  { x: -4.7, z: -1.9, labelDx: -54, labelDy: -52 },
  { x: 3.8, z: -2.5, labelDx: 28, labelDy: -48 },
  { x: -4.9, z: 2.3, labelDx: -58, labelDy: -56 },
  { x: -0.7, z: -4.6, labelDx: -40, labelDy: -70 },
  { x: 4.7, z: 1.7, labelDx: 22, labelDy: -60 },
  { x: 0.9, z: 4.4, labelDx: 28, labelDy: -66 },
];

export class LakeScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.economy = null;
    this.offers = [0, 0, 0, 0, 0, 0];
    this.result = null;
    this.bestResult = null;
    this.runStart = 0;
    this.hoverIndex = -1;
    this.mouse = { x: 0, y: 0 };
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.world = { cx: 0, cy: 0, scale: 1 };
    this.running = false;

    window.addEventListener('resize', () => this.resize());
    canvas.addEventListener('mousemove', e => this.onMouseMove(e));
    canvas.addEventListener('mouseleave', () => { this.hoverIndex = -1; });
    this.resize();
  }

  setEconomy(economy) {
    this.economy = economy;
    this.result = null;
    this.bestResult = null;
    this.runStart = 0;
  }

  setOffers(offers) {
    this.offers = offers.slice();
  }

  setResult(result) {
    this.result = result;
    if (!this.bestResult || (result.frontierScore || -Infinity) > (this.bestResult.frontierScore || -Infinity)) {
      this.bestResult = result;
    }
    this.runStart = performance.now();
  }

  clearResult() {
    this.result = null;
    this.runStart = 0;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(320, rect.width || window.innerWidth);
    const h = Math.max(320, rect.height || window.innerHeight);
    this.canvas.width = Math.floor(w * this.pixelRatio);
    this.canvas.height = Math.floor(h * this.pixelRatio);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    this.world = {
      cx: w * 0.50,
      cy: h * 0.57,
      scale: Math.min(w, h) / 14.3,
      width: w,
      height: h,
    };
  }

  start() {
    if (this.running) return;
    this.running = true;
    const tick = (now) => {
      this.draw(now);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  onMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = event.clientX - rect.left;
    this.mouse.y = event.clientY - rect.top;
    this.hoverIndex = -1;
    for (let i = 0; i < ENTITY_POSITIONS.length; i++) {
      const p = this.project(ENTITY_POSITIONS[i].x, ENTITY_POSITIONS[i].z, 0.6);
      if (distance(this.mouse.x, this.mouse.y, p.x, p.y) < 58) this.hoverIndex = i;
    }
  }

  project(x, z, y = 0) {
    const { cx, cy, scale } = this.world;
    return {
      x: cx + (x - z) * scale * 0.86,
      y: cy + (x + z) * scale * 0.42 - y * scale,
    };
  }

  draw(now = performance.now()) {
    const ctx = this.ctx;
    const { width: w, height: h } = this.world;
    ctx.clearRect(0, 0, w, h);
    this.drawSky(ctx, w, h);
    this.drawDistantShore(ctx, w, h, now);
    this.drawGround(ctx, now);
    this.drawLake(ctx, now);
    this.drawRoutes(ctx);
    this.drawOtherInvestors(ctx, now);

    const entities = ENTITY_POSITIONS.map((pos, i) => ({ ...pos, i, depth: pos.x + pos.z }));
    entities.sort((a, b) => a.depth - b.depth);
    for (const item of entities) this.drawEntity(ctx, item.i, now);

    this.drawOfferTokens(ctx, now);
    this.drawMeters(ctx, now);
    this.drawSceneNote(ctx);
  }

  drawSky(ctx, w, h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#263a3e');
    grad.addColorStop(0.45, '#526052');
    grad.addColorStop(1, '#273127');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Soft vignette.
    const vignette = ctx.createRadialGradient(w * 0.5, h * 0.35, h * 0.05, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
    vignette.addColorStop(0, 'rgba(255,255,255,0.05)');
    vignette.addColorStop(0.65, 'rgba(0,0,0,0.04)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.46)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }

  drawDistantShore(ctx, w, h, now) {
    ctx.save();
    ctx.globalAlpha = 0.36;
    const y = h * 0.30;
    ctx.fillStyle = '#314132';
    ctx.beginPath();
    ctx.moveTo(0, y + 20);
    for (let x = 0; x <= w + 40; x += 40) {
      const wave = Math.sin(x * 0.017 + now * 0.0002) * 11 + Math.sin(x * 0.033) * 5;
      ctx.lineTo(x, y + wave);
    }
    ctx.lineTo(w, h * 0.58);
    ctx.lineTo(0, h * 0.58);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawGround(ctx, now) {
    const p = (x, z, y = 0) => this.project(x, z, y);
    // Island shadow.
    const shadow = p(0.2, 0.2, -0.05);
    ctx.save();
    ctx.translate(shadow.x, shadow.y + this.world.scale * 0.60);
    ctx.rotate(-0.01);
    ctx.scale(1, 0.48);
    const sh = ctx.createRadialGradient(0, 0, 20, 0, 0, this.world.scale * 7.8);
    sh.addColorStop(0, 'rgba(0,0,0,0.14)');
    sh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sh;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.world.scale * 8.3, this.world.scale * 5.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Main land mass as layered ellipses.
    const c = p(0, 0, 0);
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(1, 0.52);
    ctx.fillStyle = '#556447';
    ctx.beginPath();
    ctx.ellipse(0, 0, this.world.scale * 7.5, this.world.scale * 5.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6d7650';
    ctx.beginPath();
    ctx.ellipse(0, -this.world.scale * 0.20, this.world.scale * 7.2, this.world.scale * 5.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Subtle fields and road loops.
    this.drawIsoPatch(ctx, -5.8, -3.1, 2.8, 1.8, '#66744e', 'rgba(255,255,255,0.05)');
    this.drawIsoPatch(ctx, 3.9, -3.5, 2.1, 1.5, '#606d49', 'rgba(255,255,255,0.04)');
    this.drawIsoPatch(ctx, -6.2, 1.1, 2.4, 1.8, '#596a47', 'rgba(255,255,255,0.04)');
    this.drawIsoPatch(ctx, 4.6, 0.5, 2.0, 1.6, '#61704b', 'rgba(255,255,255,0.05)');

    // Tiny trees.
    const trees = [
      [-6.3, -0.9], [-5.7, 0.2], [-3.9, -3.7], [-2.6, 3.8], [-1.4, 4.7],
      [2.9, -4.1], [5.7, -1.1], [6.0, 0.1], [3.8, 3.6], [1.8, -5.0],
    ];
    for (const [x, z] of trees) this.drawTree(ctx, x, z, 0.42 + 0.06 * Math.sin(now * 0.001 + x));
  }

  drawLake(ctx, now) {
    const c = this.project(0, 0, 0.02);
    const scale = this.world.scale;
    const result = this.result;
    const healthShift = result ? clamp(result.lakeEffect / 18, -1, 1) : 0;
    const lakeOuter = healthShift >= 0 ? '#397177' : '#52615e';
    const lakeInner = healthShift >= 0 ? '#2b777e' : '#43535b';

    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(1, 0.52);
    ctx.fillStyle = '#4e573f';
    ctx.beginPath();
    ctx.ellipse(0, 0, scale * 3.55, scale * 2.45, 0, 0, Math.PI * 2);
    ctx.fill();

    const water = ctx.createRadialGradient(-scale * 0.4, -scale * 0.3, scale * 0.2, 0, 0, scale * 3.2);
    water.addColorStop(0, lighten(lakeInner, 18));
    water.addColorStop(0.58, lakeInner);
    water.addColorStop(1, lakeOuter);
    ctx.fillStyle = water;
    ctx.beginPath();
    ctx.ellipse(0, -scale * 0.06, scale * 3.15, scale * 2.04, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(238,233,218,0.22)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 8; i++) {
      const yy = -scale * 1.35 + i * scale * 0.38 + Math.sin(now * 0.001 + i) * 1.4;
      ctx.beginPath();
      ctx.ellipse(Math.sin(i) * 4, yy, scale * (0.8 + i * 0.08), scale * 0.045, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Fish glints.
    ctx.fillStyle = healthShift >= -0.3 ? 'rgba(238,233,218,0.55)' : 'rgba(238,233,218,0.22)';
    for (let i = 0; i < 7; i++) {
      const angle = now * 0.00025 + i * 1.7;
      const rx = Math.cos(angle) * scale * (0.5 + (i % 3) * 0.28);
      const ry = Math.sin(angle * 1.3) * scale * 0.45;
      ctx.beginPath();
      ctx.ellipse(rx, ry, 3.2, 1.2, angle, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Small boat.
    const boatAngle = now * 0.00018;
    const bx = Math.cos(boatAngle) * 1.6;
    const bz = Math.sin(boatAngle * 1.2) * 0.9;
    this.drawBoat(ctx, bx, bz);
  }

  drawRoutes(ctx) {
    const routes = [
      [-4.9, 2.3, -4.7, -1.9],
      [-0.7, -4.6, -4.7, -1.9],
      [-4.9, 2.3, 3.8, -2.5],
      [4.7, 1.7, 3.8, -2.5],
      [4.7, 1.7, 0.9, 4.4],
    ];
    ctx.save();
    ctx.strokeStyle = 'rgba(222,207,170,0.20)';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([6, 8]);
    for (const [x1, z1, x2, z2] of routes) {
      const a = this.project(x1, z1, 0.03);
      const b = this.project(x2, z2, 0.03);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawOtherInvestors(ctx, now) {
    // Local bank / outside capital. Visible but non-interactive.
    this.drawBox(ctx, -1.5, 5.7, 1.2, 0.82, 0.8, '#7a7c6a');
    const p = this.project(-1.5, 5.7, 0.92);
    this.drawBillboardLabel(ctx, p.x - 48, p.y - 16, 'Other investors', 'local bank · market capital', 'muted');

    // Tiny investor figures.
    for (let i = 0; i < 8; i++) {
      const x = -2.4 + (i % 4) * 0.42;
      const z = 6.35 + Math.floor(i / 4) * 0.28;
      this.drawPerson(ctx, x, z, 0.18, '#d8c49b', now + i * 100);
    }
  }

  drawEntity(ctx, i, now) {
    if (!this.economy) return;
    const entity = this.economy.entities[i];
    const pos = ENTITY_POSITIONS[i];
    const runElapsed = this.runStart ? clamp((now - this.runStart) / 1300, 0, 1) : 1;
    const t = easeOutCubic(runElapsed);
    const delta = this.result ? this.result.deltaK[i] : 0;
    const factor = clamp(1 + (delta / entity.K0) * 1.35 * t, 0.74, 1.38);
    const hover = this.hoverIndex === i;

    if (hover) {
      const p = this.project(pos.x, pos.z, 0.05);
      ctx.save();
      ctx.fillStyle = 'rgba(245,229,194,0.12)';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 9, this.world.scale * 1.15, this.world.scale * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    switch (i) {
      case 0: this.drawScalableFarm(ctx, pos.x, pos.z, factor, now); break;
      case 1: this.drawSteadyFarm(ctx, pos.x, pos.z, factor, now); break;
      case 2: this.drawFeedMill(ctx, pos.x, pos.z, factor, now); break;
      case 3: this.drawHatchery(ctx, pos.x, pos.z, factor, now); break;
      case 4: this.drawColdChain(ctx, pos.x, pos.z, factor, now); break;
      case 5: this.drawIndustry(ctx, pos.x, pos.z, factor, now); break;
    }

    if (this.result) this.drawCapitalSignal(ctx, i, delta, t);
    this.drawEntityLabel(ctx, i, hover);
  }

  drawScalableFarm(ctx, x, z, factor, now) {
    this.drawPond(ctx, x - 0.42, z + 0.08, 0.66 * factor, 0.36 * factor, '#2f777b');
    this.drawPond(ctx, x + 0.32, z - 0.22, 0.58 * factor, 0.32 * factor, '#337f83');
    this.drawBox(ctx, x + 0.48, z + 0.42, 0.58, 0.45, 0.44 * factor, '#a8794f');
    this.drawPerson(ctx, x - 0.1, z - 0.65, 0.18, '#e1bf80', now);
    this.drawPerson(ctx, x + 0.42, z - 0.74, 0.17, '#d8c49b', now + 900);
  }

  drawSteadyFarm(ctx, x, z, factor, now) {
    this.drawPond(ctx, x - 0.30, z + 0.00, 0.55 * factor, 0.31 * factor, '#3b7a7a');
    this.drawPond(ctx, x + 0.32, z - 0.02, 0.50 * factor, 0.28 * factor, '#3e7f7b');
    this.drawBox(ctx, x + 0.18, z + 0.52, 0.62, 0.50, 0.34 * factor, '#957554');
    this.drawTree(ctx, x - 0.8, z + 0.55, 0.32);
    this.drawPerson(ctx, x + 0.68, z - 0.38, 0.16, '#d4b987', now + 300);
  }

  drawFeedMill(ctx, x, z, factor, now) {
    this.drawBox(ctx, x, z, 1.12, 0.82, 0.72 * factor, '#8a8366');
    this.drawSilo(ctx, x - 0.74, z + 0.12, 0.30, 0.92 * factor, '#b5ad94');
    this.drawTruck(ctx, x + 0.94, z - 0.25, '#b88a54');
    // Feed sacks.
    for (let i = 0; i < 4; i++) this.drawBox(ctx, x - 0.25 + i * 0.16, z - 0.72, 0.14, 0.16, 0.10, '#c8ad77');
  }

  drawHatchery(ctx, x, z, factor, now) {
    this.drawBox(ctx, x, z + 0.25, 0.95, 0.65, 0.46 * factor, '#87908a');
    this.drawTank(ctx, x - 0.42, z - 0.32, 0.30 * factor, '#4b8787');
    this.drawTank(ctx, x + 0.02, z - 0.38, 0.30 * factor, '#4c8a89');
    this.drawTank(ctx, x + 0.46, z - 0.30, 0.27 * factor, '#4b8787');
    this.drawPerson(ctx, x + 0.78, z + 0.02, 0.16, '#d8c49b', now + 700);
  }

  drawColdChain(ctx, x, z, factor, now) {
    this.drawBox(ctx, x, z, 1.18, 0.82, 0.58 * factor, '#707b7e');
    this.drawBox(ctx, x - 0.18, z - 0.48, 0.44, 0.20, 0.15, '#c9d2cf');
    this.drawTruck(ctx, x + 1.0, z + 0.14, '#c6d3d1');
    this.drawBox(ctx, x - 0.88, z + 0.36, 0.42, 0.36, 0.30 * factor, '#9d7e5a');
  }

  drawIndustry(ctx, x, z, factor, now) {
    this.drawBox(ctx, x, z, 1.28, 0.95, 0.70 * factor, '#7b766d');
    this.drawBox(ctx, x - 0.62, z + 0.54, 0.22, 0.22, 1.10 * factor, '#686861');
    const top = this.project(x - 0.62, z + 0.54, 1.12 * factor);
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#d4c3a4';
    for (let i = 0; i < 3; i++) {
      const drift = Math.sin(now * 0.001 + i) * 4;
      ctx.beginPath();
      ctx.ellipse(top.x - 6 + i * 9 + drift, top.y - 12 - i * 10, 8 + i * 2, 4 + i, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    this.drawPerson(ctx, x + 0.92, z + 0.54, 0.16, '#d9c390', now + 100);
    this.drawPerson(ctx, x + 1.12, z + 0.32, 0.16, '#d9c390', now + 500);
  }

  drawOfferTokens(ctx, now) {
    if (!this.economy) return;
    const investor = this.project(-1.5, 5.7, 1.08);
    const anim = this.runStart ? clamp((now - this.runStart) / 900, 0, 1) : 1;
    const flowT = easeOutCubic(anim);
    for (let i = 0; i < ENTITY_POSITIONS.length; i++) {
      const offer = this.offers[i] || 0;
      if (offer <= 0) continue;
      const pos = ENTITY_POSITIONS[i];
      const target = this.project(pos.x - 0.42, pos.z - 0.78, 0.16);
      const count = Math.min(14, Math.max(1, Math.round(offer / 7)));

      // Run-time token flow from other investors/player dock to entities.
      if (this.runStart && anim < 1) {
        for (let j = 0; j < Math.min(count, 8); j++) {
          const stagger = j / 14;
          const t = clamp((flowT - stagger * 0.45) / 0.78, 0, 1);
          const wiggle = Math.sin(now * 0.01 + j * 1.7) * 5;
          const x = lerp(investor.x, target.x, t) + wiggle * (1 - Math.abs(t - 0.5) * 2);
          const y = lerp(investor.y, target.y, t) - Math.sin(t * Math.PI) * 42;
          drawCoin(ctx, x, y, 4.5, 0.85);
        }
      }

      // Resting stack.
      for (let j = 0; j < count; j++) {
        const x = target.x + (j % 4) * 7 - 11;
        const y = target.y - Math.floor(j / 4) * 4;
        drawCoin(ctx, x, y, 4.3, 0.78);
      }
    }
  }

  drawCapitalSignal(ctx, i, delta, t) {
    const pos = ENTITY_POSITIONS[i];
    const base = this.project(pos.x + 0.74, pos.z + 0.62, 0.1);
    const height = clamp(Math.abs(delta) * 2.8, 5, 54) * t;
    ctx.save();
    ctx.globalAlpha = 0.86;
    if (delta >= 0) {
      const grad = ctx.createLinearGradient(base.x, base.y, base.x, base.y - height);
      grad.addColorStop(0, 'rgba(90,155,126,0.15)');
      grad.addColorStop(1, 'rgba(112,190,154,0.70)');
      ctx.fillStyle = grad;
      roundRect(ctx, base.x - 7, base.y - height, 14, height, 6);
      ctx.fill();
      ctx.fillStyle = 'rgba(230,244,220,0.84)';
      ctx.beginPath();
      ctx.ellipse(base.x, base.y - height, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(177,106,86,0.74)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(base.x - 10, base.y - 8);
      ctx.lineTo(base.x + 10, base.y + 8);
      ctx.moveTo(base.x + 10, base.y - 8);
      ctx.lineTo(base.x - 10, base.y + 8);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawMeters(ctx, now) {
    const result = this.result;
    const lakePct = result ? clamp(50 + result.lakeEffect * 1.9, 4, 96) : 50;
    const prosperityPct = result ? clamp(50 + result.prosperityEffect * 1.25, 4, 96) : 50;
    const p1 = this.project(-6.2, 4.4, 0.5);
    const p2 = this.project(-5.0, 5.0, 0.5);
    this.drawMeter(ctx, p1.x - 26, p1.y - 54, 'Lake health', lakePct, '#5eb1b2');
    this.drawMeter(ctx, p2.x - 26, p2.y - 54, 'Prosperity', prosperityPct, '#d8aa64');
  }

  drawMeter(ctx, x, y, label, pct, color) {
    ctx.save();
    ctx.fillStyle = 'rgba(25,32,28,0.48)';
    ctx.strokeStyle = 'rgba(238,233,218,0.16)';
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, 112, 34, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(238,233,218,0.80)';
    ctx.font = '11px Inter, ui-sans-serif, system-ui, sans-serif';
    ctx.fillText(label, x + 9, y + 13);
    ctx.fillStyle = 'rgba(238,233,218,0.16)';
    roundRect(ctx, x + 9, y + 20, 94, 6, 6);
    ctx.fill();
    ctx.fillStyle = color;
    roundRect(ctx, x + 9, y + 20, 94 * pct / 100, 6, 6);
    ctx.fill();
    ctx.restore();
  }

  drawSceneNote(ctx) {
    if (!this.economy) return;
    const { width: w, height: h } = this.world;
    ctx.save();
    ctx.fillStyle = 'rgba(18,24,22,0.42)';
    ctx.strokeStyle = 'rgba(238,233,218,0.12)';
    ctx.lineWidth = 1;
    roundRect(ctx, 24, h - 98, Math.min(600, w - 48), 64, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(245,239,221,0.88)';
    ctx.font = '600 14px Inter, ui-sans-serif, system-ui, sans-serif';
    ctx.fillText(this.economy.templateName, 44, h - 70);
    ctx.fillStyle = 'rgba(245,239,221,0.66)';
    ctx.font = '12px Inter, ui-sans-serif, system-ui, sans-serif';
    wrapCanvasText(ctx, this.economy.scenarioNote, 44, h - 50, Math.min(548, w - 96), 16, 2);
    ctx.restore();
  }

  drawEntityLabel(ctx, i, hover = false) {
    if (!this.economy) return;
    const pos = ENTITY_POSITIONS[i];
    const entity = this.economy.entities[i];
    const p = this.project(pos.x, pos.z, 0.9);
    const offer = this.offers[i] || 0;
    const delta = this.result ? this.result.deltaK[i] : null;
    let sub = offer > 0 ? `${Math.round(offer)} offer tokens` : 'offer target';
    if (delta != null) sub = `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} actual capital`;
    this.drawBillboardLabel(ctx, p.x + pos.labelDx, p.y + pos.labelDy, entity.shortName, sub, hover ? 'hot' : 'normal');
  }

  drawBillboardLabel(ctx, x, y, title, subtitle, mode = 'normal') {
    ctx.save();
    ctx.font = '600 12px Inter, ui-sans-serif, system-ui, sans-serif';
    const titleW = ctx.measureText(title).width;
    ctx.font = '11px Inter, ui-sans-serif, system-ui, sans-serif';
    const subW = ctx.measureText(subtitle).width;
    const width = Math.max(titleW, subW) + 20;
    const height = subtitle ? 40 : 25;
    const fill = mode === 'hot' ? 'rgba(36,46,38,0.76)' : mode === 'muted' ? 'rgba(26,33,31,0.42)' : 'rgba(24,31,29,0.56)';
    const stroke = mode === 'hot' ? 'rgba(233,205,150,0.55)' : 'rgba(238,233,218,0.14)';
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    roundRect(ctx, x, y, width, height, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(246,241,226,0.90)';
    ctx.font = '600 12px Inter, ui-sans-serif, system-ui, sans-serif';
    ctx.fillText(title, x + 10, y + 16);
    if (subtitle) {
      ctx.fillStyle = 'rgba(246,241,226,0.62)';
      ctx.font = '11px Inter, ui-sans-serif, system-ui, sans-serif';
      ctx.fillText(subtitle, x + 10, y + 31);
    }
    ctx.restore();
  }

  drawIsoPatch(ctx, x, z, w, d, fill, stroke) {
    const pts = [
      this.project(x - w / 2, z - d / 2, 0.015),
      this.project(x + w / 2, z - d / 2, 0.015),
      this.project(x + w / 2, z + d / 2, 0.015),
      this.project(x - w / 2, z + d / 2, 0.015),
    ];
    ctx.save();
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    polygon(ctx, pts);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawBox(ctx, x, z, w, d, h, color) {
    const p = (xx, zz, yy) => this.project(xx, zz, yy);
    const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2;
    const b = [p(x0, z0, 0), p(x1, z0, 0), p(x1, z1, 0), p(x0, z1, 0)];
    const t = [p(x0, z0, h), p(x1, z0, h), p(x1, z1, h), p(x0, z1, h)];
    ctx.save();
    ctx.strokeStyle = 'rgba(25,24,18,0.20)';
    ctx.lineWidth = 1;
    ctx.fillStyle = shade(color, -18);
    polygon(ctx, [b[1], b[2], t[2], t[1]]); ctx.fill(); ctx.stroke();
    ctx.fillStyle = shade(color, -28);
    polygon(ctx, [b[2], b[3], t[3], t[2]]); ctx.fill(); ctx.stroke();
    ctx.fillStyle = shade(color, 12);
    polygon(ctx, t); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  drawPond(ctx, x, z, rx, rz, color) {
    const p = this.project(x, z, 0.03);
    const s = this.world.scale;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(-0.01);
    ctx.scale(1, 0.52);
    ctx.fillStyle = '#4f5e43';
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * s * 1.12, rz * s * 1.22, 0, 0, Math.PI * 2);
    ctx.fill();
    const grad = ctx.createRadialGradient(-rx * s * 0.2, -rz * s * 0.2, 2, 0, 0, rx * s);
    grad.addColorStop(0, lighten(color, 16));
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * s, rz * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(238,233,218,0.16)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  drawSilo(ctx, x, z, r, h, color) {
    const s = this.world.scale;
    const base = this.project(x, z, 0);
    const top = this.project(x, z, h);
    ctx.save();
    ctx.fillStyle = shade(color, -10);
    ctx.fillRect(base.x - r * s, top.y, r * s * 2, base.y - top.y);
    ctx.fillStyle = shade(color, 10);
    ctx.beginPath();
    ctx.ellipse(top.x, top.y, r * s, r * s * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(30,28,20,0.22)';
    ctx.stroke();
    ctx.restore();
  }

  drawTank(ctx, x, z, r, color) {
    const s = this.world.scale;
    const p = this.project(x, z, 0.04);
    ctx.save();
    ctx.fillStyle = shade(color, -16);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + r * s * 0.18, r * s, r * s * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = lighten(color, 8);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, r * s, r * s * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(238,233,218,0.20)';
    ctx.stroke();
    ctx.restore();
  }

  drawTruck(ctx, x, z, color) {
    this.drawBox(ctx, x, z, 0.58, 0.28, 0.24, color);
    this.drawBox(ctx, x + 0.34, z - 0.03, 0.22, 0.26, 0.18, shade(color, -8));
    const a = this.project(x - 0.22, z + 0.18, 0.04);
    const b = this.project(x + 0.28, z + 0.18, 0.04);
    drawWheel(ctx, a.x, a.y);
    drawWheel(ctx, b.x, b.y);
  }

  drawTree(ctx, x, z, h = 0.38) {
    const trunk = this.project(x, z, 0.10);
    const top = this.project(x, z, h);
    ctx.save();
    ctx.strokeStyle = '#69543a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(trunk.x, trunk.y);
    ctx.lineTo(top.x, top.y + 8);
    ctx.stroke();
    ctx.fillStyle = '#384c34';
    ctx.beginPath();
    ctx.ellipse(top.x, top.y, this.world.scale * 0.18, this.world.scale * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#45613d';
    ctx.beginPath();
    ctx.ellipse(top.x + 5, top.y + 5, this.world.scale * 0.15, this.world.scale * 0.10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawPerson(ctx, x, z, height, color, now) {
    const bob = Math.sin((now || 0) * 0.004) * 0.025;
    const p = this.project(x, z, height + bob);
    const feet = this.project(x, z, 0.03);
    ctx.save();
    ctx.strokeStyle = 'rgba(30,25,18,0.50)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(feet.x, feet.y);
    ctx.lineTo(p.x, p.y + 5);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 3.5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawBoat(ctx, x, z) {
    const p = this.project(x, z, 0.08);
    ctx.save();
    ctx.fillStyle = '#9a714d';
    ctx.strokeStyle = 'rgba(30,24,16,0.25)';
    ctx.beginPath();
    ctx.moveTo(p.x - 14, p.y + 2);
    ctx.lineTo(p.x + 12, p.y - 1);
    ctx.lineTo(p.x + 6, p.y + 8);
    ctx.lineTo(p.x - 8, p.y + 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(238,233,218,0.45)';
    ctx.beginPath();
    ctx.moveTo(p.x + 1, p.y - 3);
    ctx.lineTo(p.x + 1, p.y - 20);
    ctx.stroke();
    ctx.fillStyle = 'rgba(238,233,218,0.42)';
    ctx.beginPath();
    ctx.moveTo(p.x + 3, p.y - 19);
    ctx.lineTo(p.x + 15, p.y - 8);
    ctx.lineTo(p.x + 3, p.y - 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawCoin(ctx, x, y, r, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#d9a84d';
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,236,184,0.55)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawWheel(ctx, x, y) {
  ctx.save();
  ctx.fillStyle = '#30322c';
  ctx.beginPath();
  ctx.ellipse(x, y, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function polygon(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = text.split(' ');
  let line = '';
  let lines = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + lines * lineHeight);
      lines += 1;
      line = word;
      if (lines >= maxLines) return;
    } else {
      line = test;
    }
  }
  if (line && lines < maxLines) ctx.fillText(line, x, y + lines * lineHeight);
}

function distance(x1, y1, x2, y2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function shade(hex, amt) {
  const { r, g, b } = parseHex(hex);
  return `rgb(${clamp(Math.round(r + amt), 0, 255)}, ${clamp(Math.round(g + amt), 0, 255)}, ${clamp(Math.round(b + amt), 0, 255)})`;
}

function lighten(hex, amt) { return shade(hex, amt); }

function parseHex(color) {
  const rgb = String(color).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgb) return { r: +rgb[1], g: +rgb[2], b: +rgb[3] };
  const clean = String(color).replace('#', '');
  const expanded = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  const value = parseInt(expanded, 16);
  if (!Number.isFinite(value)) return { r: 128, g: 128, b: 128 };
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}
