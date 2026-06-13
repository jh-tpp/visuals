import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const COLORS = {
  sand: 0xcdb783,
  grass: 0x5f9252,
  darkGrass: 0x346d43,
  rock: 0x85877a,
  seabed: 0x2d6474,
  deepWater: 0x276f88,
  water: 0x57bdd6,
  road: 0xa79b84,
  asphalt: 0x555d5e,
  concrete: 0xa9aba4,
  token: 0xd4a236,
  tokenLight: 0xffde77,
  green: 0x4f8f61,
  red: 0xb46658,
  wall: 0xf0eadc,
  roof: 0xa6603e,
  trunk: 0x5d3d22,
  leaf: 0x2f7b45,
  glass: 0x9bc9d8
};

const LAKE_VISUAL_SCALE = {
  positiveFull: 4.5,
  negativeFull: 13,
  severeNegativeStart: 22,
  severeNegativeFull: 40
};

const PROSPERITY_VISUAL_SCALE = {
  negativeFull: 4,
  positiveFull: 3.8
};

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function smoothstep(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
function signed(v, digits = 1) { return Number.isFinite(v) ? `${v >= 0 ? '+' : ''}${v.toFixed(digits)}` : '—'; }

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

let seedNumber = 1;
let rng = mulberry32(1);
let waterMaterial;
function rand(min = 0, max = 1) { return min + (max - min) * rng(); }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function chance(p) { return rng() < p; }
function pick(arr) { return arr[Math.floor(rng() * arr.length)]; }

function makeMat(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.80,
    metalness: options.metalness ?? 0.02,
    transparent: options.opacity !== undefined && options.opacity < 1,
    opacity: options.opacity ?? 1,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0
  });
}

function rememberMaterialBase(material) {
  if (!material || material.userData.visualBase) return;
  material.userData.visualBase = {
    color: material.color?.clone?.(),
    emissive: material.emissive?.clone?.(),
    emissiveIntensity: material.emissiveIntensity ?? 0,
    roughness: material.roughness,
    metalness: material.metalness,
    opacity: material.opacity,
    transparent: material.transparent
  };
}

function restoreMaterialBase(material) {
  const base = material?.userData?.visualBase;
  if (!base) return;
  if (base.color && material.color) material.color.copy(base.color);
  if (base.emissive && material.emissive) material.emissive.copy(base.emissive);
  if (material.emissiveIntensity !== undefined) material.emissiveIntensity = base.emissiveIntensity;
  if (material.roughness !== undefined) material.roughness = base.roughness;
  if (material.metalness !== undefined) material.metalness = base.metalness;
  if (material.opacity !== undefined) material.opacity = base.opacity;
  if (material.transparent !== undefined) material.transparent = base.transparent;
}

// The coastline, terrain slope, and undulations are adapted from the uploaded Harbor Town
// reference, but fixed to a present-day lake-economy setting rather than an evolution toy.
function coastLine(x) {
  const bay = 15.5 * Math.exp(-(x * x) / (2 * 20 * 20));
  const westInlet = -4.0 * Math.exp(-((x + 42) * (x + 42)) / (2 * 13 * 13));
  const eastHeadland = -5.0 * Math.exp(-((x - 37) * (x - 37)) / (2 * 12 * 12));
  return -19 + bay + westInlet + eastHeadland + 4.1 * Math.sin(x * 0.095 + seedNumber * 0.00001) + 1.4 * Math.sin(x * 0.23);
}
function hash2(i, j) {
  const s = Math.sin(i * 127.1 + j * 311.7 + seedNumber * 0.017) * 43758.5453123;
  return s - Math.floor(s);
}
function valueNoise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);
  const u = smoothstep(fx);
  const v = smoothstep(fz);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
function terrainHeight(x, z) {
  const coast = coastLine(x);
  const distance = z - coast;
  const n1 = valueNoise(x * 0.055, z * 0.055) - 0.5;
  const n2 = valueNoise(x * 0.13 + 20, z * 0.13 - 13) - 0.5;
  if (distance < 0) return -2.8 + distance * 0.055 + n1 * 0.7;
  const hill = 0.13 * distance + 2.8 * Math.exp(-((x - 36) * (x - 36) + (z - 44) * (z - 44)) / 1500);
  return Math.max(0.08, hill + n1 * 1.4 + n2 * 0.45);
}
function groundY(x, z) { return Math.max(0.08, terrainHeight(x, z)); }
function isLand(x, z, margin = 1.5) { return z > coastLine(x) + margin; }

function addBox(parent, size, pos, mat, name = '') {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = name;
  parent.add(mesh);
  return mesh;
}
function addCylinder(parent, radius, height, pos, mat, segments = 24, name = '') {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = name;
  parent.add(mesh);
  return mesh;
}
function createSegment(group, p1, p2, width, height, material, yMode = 'ground', yOffset = 0.04) {
  const dx = p2.x - p1.x;
  const dz = p2.z - p1.z;
  const length = Math.hypot(dx, dz);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, length), material);
  const mx = (p1.x + p2.x) * 0.5;
  const mz = (p1.z + p2.z) * 0.5;
  const y = yMode === 'water' ? yOffset : (groundY(p1.x, p1.z) + groundY(p2.x, p2.z)) * 0.5 + yOffset;
  mesh.position.set(mx, y, mz);
  mesh.rotation.y = Math.atan2(dx, dz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}
function createPath(group, pts, width, height, material, yMode = 'ground', yOffset = 0.04) {
  for (let i = 0; i < pts.length - 1; i++) createSegment(group, pts[i], pts[i + 1], width, height, material, yMode, yOffset);
}
function makeGableRoofGeometry(w, d, h) {
  const verts = new Float32Array([
    -w / 2, 0, -d / 2, w / 2, 0, -d / 2, 0, h, -d / 2,
    -w / 2, 0,  d / 2, w / 2, 0,  d / 2, 0, h,  d / 2
  ]);
  const idx = [0,1,2, 3,5,4, 0,3,4, 0,4,1, 1,4,5, 1,5,2, 2,5,3, 2,3,0];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}
function createSimpleHouse(w, d, h, wallColor, roofColor, options = {}) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), makeMat(wallColor, { roughness: 0.86, metalness: options.metalness ?? 0.02 }));
  base.userData.prosperitySensitive = true;
  base.position.y = h * 0.5;
  g.add(base);
  if (options.flat) {
    const roof = new THREE.Mesh(new THREE.BoxGeometry(w * 1.04, 0.22, d * 1.04), makeMat(roofColor, { roughness: 0.82, metalness: options.roofMetalness ?? 0.02 }));
    roof.userData.prosperitySensitive = true;
    roof.position.y = h + 0.14;
    g.add(roof);
  } else {
    const roof = new THREE.Mesh(makeGableRoofGeometry(w * 1.18, d * 1.10, options.roofHeight ?? 0.9), makeMat(roofColor, { roughness: 0.82 }));
    roof.userData.prosperitySensitive = true;
    roof.position.y = h + 0.02;
    g.add(roof);
  }
  if (options.windows) addWindowGrid(g, w, d, h, options.windowRows ?? Math.floor(h / 1.7), options.windowCols ?? Math.floor(w / 0.9));
  return g;
}
function addWindowGrid(g, w, d, h, rows, cols) {
  rows = clamp(Math.floor(rows), 1, 12);
  cols = clamp(Math.floor(cols), 1, 14);
  const mat = makeMat(0xffe2a0, { roughness: 0.4, emissive: 0xffcf7a, emissiveIntensity: 0.18, opacity: 0.82 });
  const paneGeo = new THREE.PlaneGeometry(0.16, 0.20);
  const zFront = d / 2 + 0.014;
  const zBack = -d / 2 - 0.014;
  for (let r = 0; r < rows; r++) {
    const y = lerp(0.75, h - 0.45, rows === 1 ? 0.5 : r / (rows - 1));
    for (let c = 0; c < cols; c++) {
      if (!chance(0.68)) continue;
      const x = lerp(-w * 0.35, w * 0.35, cols === 1 ? 0.5 : c / (cols - 1));
      const front = new THREE.Mesh(paneGeo, mat);
      front.userData.prosperitySensitive = true;
      front.position.set(x, y, zFront);
      const back = new THREE.Mesh(paneGeo, mat);
      back.userData.prosperitySensitive = true;
      back.position.set(x, y, zBack);
      back.rotation.y = Math.PI;
      g.add(front, back);
    }
  }
}
function placeObject(obj, x, z, rotation = 0, lift = 0) {
  obj.position.set(x, groundY(x, z) + lift, z);
  obj.rotation.y = rotation;
  return obj;
}
function markEntityMeshes(group, index) {
  group.traverse(obj => {
    if (obj.isMesh) obj.userData.entityIndex = index;
  });
}
function createPad(parent, w, d, mat, name = 'site pad') {
  const pad = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, d), mat);
  pad.position.y = 0.065;
  pad.castShadow = false;
  pad.receiveShadow = true;
  pad.name = name;
  parent.add(pad);
  return pad;
}
function createPond(parent, x, z, sx, sz) {
  const pond = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.16, 36), makeMat(0x58aeca, { roughness: 0.42, metalness: 0.04, opacity: 0.86, emissive: 0x1d6f85, emissiveIntensity: 0.05 }));
  pond.scale.set(sx, 1, sz);
  pond.position.set(x, 0.18, z);
  pond.castShadow = false;
  pond.receiveShadow = true;
  parent.add(pond);
  return pond;
}
function makeTree(parent, x, z, s = 1) {
  const trunk = addCylinder(parent, 0.11 * s, 0.9 * s, [x, 0.45 * s, z], makeMat(COLORS.trunk, { roughness: 0.96 }), 7, 'tree trunk');
  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.64 * s, 1.42 * s, 8), makeMat(COLORS.leaf, { roughness: 0.96 }));
  crown.position.set(x, 1.24 * s, z);
  crown.castShadow = true;
  crown.receiveShadow = true;
  parent.add(crown);
  return [trunk, crown];
}
function makePerson(parent, x, z, color = 0x3c5d7c, scale = 1) {
  const body = addCylinder(parent, 0.10 * scale, 0.48 * scale, [x, 0.34 * scale, z], makeMat(color, { roughness: 0.8 }), 10, 'person');
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14 * scale, 12, 8), makeMat(0x8b644d, { roughness: 0.82 }));
  head.position.set(x, 0.68 * scale, z);
  head.castShadow = true;
  parent.add(head);
  return [body, head];
}
function makeTruck(parent, x, z, color = 0xffffff, rotY = 0, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  parent.add(group);
  addBox(group, [1.8 * scale, 0.55 * scale, 0.84 * scale], [0, 0.43 * scale, 0], makeMat(color, { roughness: 0.72 }), 'truck body');
  addBox(group, [0.66 * scale, 0.50 * scale, 0.82 * scale], [1.04 * scale, 0.47 * scale, 0], makeMat(0xeef3f2, { roughness: 0.7 }), 'truck cab');
  const wheelMat = makeMat(0x1e1e1e, { roughness: 0.62 });
  [[-0.66, -0.48], [0.65, -0.48], [-0.66, 0.48], [0.65, 0.48]].forEach(([wx, wz]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * scale, 0.18 * scale, 0.12 * scale, 14), wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx * scale, 0.17 * scale, wz * scale);
    wheel.castShadow = true;
    group.add(wheel);
  });
  return group;
}
function createShip(kind = 'sail', colorOverride = null) {
  const g = new THREE.Group();
  const hullColor = colorOverride ?? (kind === 'steam' ? 0x293342 : kind === 'cargo' ? 0x33506b : kind === 'work' ? 0x2f7890 : 0x6b3f22);
  const isCargo = kind === 'cargo';
  const hull = new THREE.Mesh(new THREE.BoxGeometry(isCargo ? 6.5 : 3.2, 0.6, isCargo ? 1.5 : 1.1), makeMat(hullColor, { roughness: 0.64, metalness: 0.05 }));
  hull.position.y = 0.38;
  g.add(hull);
  const bow = new THREE.Mesh(new THREE.ConeGeometry(isCargo ? 0.75 : 0.55, isCargo ? 1.5 : 1.05, 4), makeMat(hullColor, { roughness: 0.64, metalness: 0.05 }));
  bow.position.set(isCargo ? 3.65 : 1.9, 0.38, 0);
  bow.rotation.z = -Math.PI / 2;
  bow.rotation.y = Math.PI / 4;
  g.add(bow);
  if (kind === 'sail') {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 8), makeMat(0x3b2618, { roughness: 0.82 }));
    mast.position.set(0, 1.55, 0);
    const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.22, 1.72), makeMat(0xf6ead2, { roughness: 0.75, opacity: 0.9 }));
    sail.position.set(0.12, 1.73, 0.04);
    sail.rotation.y = Math.PI / 2;
    g.add(mast, sail);
  } else if (kind === 'steam' || kind === 'work') {
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.72, 0.9), makeMat(0xe8e1ce, { roughness: 0.72 }));
    cabin.position.set(0.1, 0.98, 0);
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.95, 12), makeMat(0x23282b, { roughness: 0.55 }));
    stack.position.set(-0.95, 1.20, 0);
    g.add(cabin, stack);
  } else if (kind === 'cargo') {
    for (let i = 0; i < 5; i++) {
      const cont = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.38, 0.55), makeMat(pick([0xd44d3d, 0xe8ba47, 0x3c82b7, 0x6fae62]), { roughness: 0.76 }));
      cont.position.set(-1.8 + i * 0.75, 0.95, rand(-0.25, 0.25));
      g.add(cont);
    }
  }
  return g;
}
function createSmokePuff(parent, x, y, z, scale = 1) {
  const puff = new THREE.Mesh(new THREE.SphereGeometry(0.32 * scale, 12, 8), makeMat(0xaeb3ae, { roughness: 1, opacity: 0.22 }));
  puff.position.set(x, y, z);
  puff.userData = { base: new THREE.Vector3(x, y, z), phase: rand(0, 10), scale };
  puff.castShadow = false;
  parent.add(puff);
  return puff;
}

export class LakeScene {
  constructor({ canvas, labelRoot, onEntitySelect = () => {} }) {
    this.canvas = canvas;
    this.labelRoot = labelRoot;
    this.onEntitySelect = onEntitySelect;
    this.clock = new THREE.Clock();
    this.labels = [];
    this.entityGroups = [];
    this.offerBars = [];
    this.responseBars = [];
    this.anchors = [];
    this.movingBoats = [];
    this.smokePuffs = [];
    this.prosperityMeshes = [];
    this.grimeMarks = [];
    this.waterMesh = null;
    this.selectedIndex = null;
    this.frameCallback = null;
    this.animationFrame = null;
    this.isDisposed = false;
    this.tmpVec = new THREE.Vector3();
    this.state = { offers: [0, 0, 0, 0, 0, 0], lastRun: null };

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf7f7f3);
    this.scene.fog = new THREE.FogExp2(0xdce8eb, 0.001);

    this.camera = new THREE.PerspectiveCamera(52, 1, 0.1, 500);
    this.camera.position.set(0, 90, -500);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.045;
    this.controls.target.set(0, 7.5, 14);
    this.controls.minDistance = 24;
    this.controls.maxDistance = 142;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.minPolarAngle = Math.PI * 0.16;
    this.controls.screenSpacePanning = false;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.down = null;
    this.handlePointerDown = e => { this.down = { x: e.clientX, y: e.clientY }; };
    this.handlePointerUp = e => this.handleClick(e);
    this.handleResize = () => this.resize();
    this.renderer.domElement.addEventListener('pointerdown', this.handlePointerDown);
    this.renderer.domElement.addEventListener('pointerup', this.handlePointerUp);

    this.world = new THREE.Group();
    this.scene.add(this.world);
    this.setupLights();
    this.resize();
    window.addEventListener('resize', this.handleResize);
    this.animate();
  }

  setupLights() {
    const hemi = new THREE.HemisphereLight(0xffffff, 0x4d6b4c, 1.25);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff1cd, 1.8);
    sun.position.set(36, 58, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -90;
    sun.shadow.camera.right = 90;
    sun.shadow.camera.top = 90;
    sun.shadow.camera.bottom = -90;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 180;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0xc8e8ff, 0.48);
    fill.position.set(-46, 24, -38);
    this.scene.add(fill);
  }

  resize() {
    const { clientWidth, clientHeight } = this.canvas.parentElement;
    this.camera.aspect = clientWidth / Math.max(1, clientHeight);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight, false);
  }

  resetView() {
    this.camera.position.set(62, 43, 82);
    this.controls.target.set(0, 7.5, 14);
    this.controls.update();
  }

  setFrameCallback(fn) { this.frameCallback = fn; }

  setLake(params) {
    this.params = params;
    seedNumber = xmur3(`${params.seed}:${params.template?.key ?? 'harbor'}`)();
    rng = mulberry32(seedNumber);
    this.clearWorld();
    this.buildWorld(params);
    this.updateState(this.state);
  }

  clearWorld() {
    this.world.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose?.();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(m => m.dispose?.());
      }
    });
    this.world.clear();
    this.labels.forEach(label => label.div.remove());
    this.labels = [];
    this.entityGroups = [];
    this.offerBars = [];
    this.responseBars = [];
    this.anchors = [];
    this.movingBoats = [];
    this.smokePuffs = [];
    this.prosperityMeshes = [];
    this.grimeMarks = [];
    this.waterMesh = null;
    waterMaterial = null;
  }

  buildWorld(params) {
    this.createTerrain();
    this.createRoadsAndQuays();
    this.createTownAndLandscape();
    this.createEntities(params);
    this.createOtherInvestors();
    this.createBoats();
    this.captureProsperitySurfaces();
  }

  createTerrain() {
    const size = 142;
    const segments = 150;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = [];
    const c = new THREE.Color();
    const sand = new THREE.Color(COLORS.sand);
    const grass = new THREE.Color(COLORS.grass);
    const darkGrass = new THREE.Color(COLORS.darkGrass);
    const rock = new THREE.Color(COLORS.rock);
    const seabed = new THREE.Color(COLORS.seabed);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = terrainHeight(x, z);
      pos.setY(i, h);
      const dist = z - coastLine(x);
      if (dist < -1) c.copy(seabed).lerp(new THREE.Color(0x173c4f), clamp(-dist / 60, 0, 1));
      else if (dist < 4) c.copy(sand).lerp(grass, clamp(dist / 4, 0, 1) * 0.55);
      else c.copy(grass).lerp(darkGrass, clamp((h - 1) / 12, 0, 1) * 0.8).lerp(rock, clamp((h - 8) / 10, 0, 1) * 0.25);
      const speckle = (valueNoise(x * 0.25, z * 0.25) - 0.5) * 0.10;
      c.offsetHSL(0, 0, speckle);
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const terrainMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.98, metalness: 0.0 });
    const mesh = new THREE.Mesh(geo, terrainMat);
    mesh.receiveShadow = true;
    this.world.add(mesh);

    const waterGeo = new THREE.PlaneGeometry(150, 118, 110, 90);
    waterGeo.rotateX(-Math.PI / 2);
    waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x4aa7c8,
      roughness: 0.55,
      metalness: 0.0,
      transparent: true,
      opacity: 0.88,
      envMapIntensity: 0.7
    });
    this.waterMesh = new THREE.Mesh(waterGeo, waterMaterial);
    this.waterMesh.position.set(0, 0.055, -27);
    this.waterMesh.receiveShadow = true;
    this.world.add(this.waterMesh);

    const shorePts = [];
    for (let x = -70; x <= 70; x += 1.2) shorePts.push(new THREE.Vector3(x, groundY(x, coastLine(x) + 0.2) + 0.09, coastLine(x) + 0.3));
    const shoreGeo = new THREE.BufferGeometry().setFromPoints(shorePts);
    const shoreMat = new THREE.LineBasicMaterial({ color: 0xf4f0d4, transparent: true, opacity: 0.74 });
    const shoreline = new THREE.Line(shoreGeo, shoreMat);
    this.world.add(shoreline);

    const rockMat = makeMat(0x77796c, { roughness: 0.96 });
    for (let i = 0; i < 76; i++) {
      const x = rand(-68, 68);
      const z = coastLine(x) + rand(-0.5, 2.4);
      if (!chance(0.62)) continue;
      const r = rand(0.18, 0.72);
      const rockMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), rockMat.clone());
      rockMesh.position.set(x + rand(-0.6, 0.6), groundY(x, z) + r * 0.45, z + rand(-0.6, 0.6));
      rockMesh.rotation.set(rand(0, 2), rand(0, 6), rand(0, 2));
      rockMesh.castShadow = true;
      rockMesh.receiveShadow = true;
      this.world.add(rockMesh);
    }
  }

  createRoadsAndQuays() {
    const road = makeMat(COLORS.road, { roughness: 0.96 });
    const asphalt = makeMat(COLORS.asphalt, { roughness: 0.86 });
    const concrete = makeMat(COLORS.concrete, { roughness: 0.78 });
    const quayPts = [];
    for (let x = -60; x <= 62; x += 6) quayPts.push({ x, z: coastLine(x) + 1.6 });
    createPath(this.world, quayPts, 4.2, 0.34, concrete, 'water', 0.34);

    const shoreRoad = [];
    for (let x = -62; x <= 62; x += 8) shoreRoad.push({ x, z: coastLine(x) + 10.5 });
    createPath(this.world, shoreRoad, 1.6, 0.10, road, 'ground', 0.12);
    createSegment(this.world, { x: -64, z: 35 }, { x: 64, z: 35 }, 2.2, 0.10, road, 'ground', 0.12);
    createSegment(this.world, { x: -18, z: 8 }, { x: -18, z: 58 }, 1.65, 0.10, asphalt, 'ground', 0.13);
    createSegment(this.world, { x: 22, z: 5 }, { x: 22, z: 58 }, 1.65, 0.10, asphalt, 'ground', 0.13);
    createSegment(this.world, { x: -52, z: coastLine(-52) + 6 }, { x: -52, z: 35 }, 1.1, 0.09, road, 'ground', 0.13);
    createSegment(this.world, { x: 52, z: coastLine(52) + 4 }, { x: 52, z: 35 }, 1.1, 0.09, road, 'ground', 0.13);
  }

  createTownAndLandscape() {
    const trees = Math.round(115);
    for (let i = 0; i < trees; i++) {
      const x = rand(-68, 68);
      const z = rand(8, 66);
      if (!isLand(x, z, 4)) continue;
      const nearEntity = Math.abs(x + 48) < 10 && z < 30 || Math.abs(x - 51) < 12 && z < 25 || Math.abs(x) < 42 && z < 24;
      if (nearEntity && chance(0.80)) continue;
      const g = new THREE.Group();
      makeTree(g, 0, 0, rand(0.72, 1.45));
      placeObject(g, x, z, rand(0, Math.PI * 2));
      this.world.add(g);
    }

    const lowRiseMat = [0xd6cab0, 0xc6b99f, 0xe4dccb, 0xc8d3d0, 0xd8c4a1];
    const roofs = [0xa45d3c, 0x8f5d46, 0x6b6f73, 0x7f4e3c];
    for (let i = 0; i < 34; i++) {
      const x = rand(-42, 46);
      const z = rand(38, 64);
      if (!isLand(x, z, 3)) continue;
      const h = rand(2.0, 6.4);
      const b = createSimpleHouse(rand(2.2, 5.6), rand(2.0, 4.8), h, pick(lowRiseMat), pick(roofs), {
        windows: chance(0.48),
        flat: chance(0.35),
        windowRows: Math.max(1, Math.floor(h / 1.6)),
        windowCols: randInt(2, 5),
        roofHeight: rand(0.55, 1.05)
      });
      placeObject(b, x, z, pick([0, Math.PI / 2]) + rand(-0.15, 0.15));
      b.scale.setScalar(rand(0.85, 1.15));
      this.world.add(b);
    }
  }

  entityLayout() {
    return [
      { x: -50, z: coastLine(-50) + 13.8, rot: 0.10 },
      { x: -33, z: coastLine(-33) + 13.0, rot: -0.06 },
      { x: -12, z: coastLine(-12) + 11.4, rot: 0.03 },
      { x: 7, z: coastLine(7) + 13.2, rot: 0.05 },
      { x: 29, z: coastLine(29) + 9.6, rot: -0.05 },
      { x: 51, z: coastLine(51) + 8.4, rot: 0.03 }
    ];
  }

  createEntities(params) {
    const layout = this.entityLayout();
    params.entities.forEach((entity, i) => {
      const group = new THREE.Group();
      group.userData.entityIndex = i;
      placeObject(group, layout[i].x, layout[i].z, layout[i].rot);
      this.world.add(group);
      this.entityGroups[i] = group;
      this.buildEntity(group, i);
      markEntityMeshes(group, i);
      this.addOfferBar(group, i);
      this.addResponseBar(group, i);
      const anchor = new THREE.Object3D();
      anchor.position.set(0, 7.6, 0);
      group.add(anchor);
      this.anchors[i] = anchor;
      this.addWorldLabel(i, entity.short, anchor);
    });
  }

  buildEntity(group, index) {
    const dirt = makeMat(0x9e8c67, { roughness: 0.98 });
    const concrete = makeMat(0xb4b0a2, { roughness: 0.88 });
    const grassPad = makeMat(0x6d9b59, { roughness: 0.98 });
    if (index === 0) {
      createPad(group, 13.0, 10.5, grassPad);
      createPond(group, -3.2, -1.7, 1.7, 1.15);
      createPond(group, 0.3, -1.8, 1.7, 1.12);
      createPond(group, 3.5, -1.3, 1.35, 0.98);
      const office = createSimpleHouse(3.0, 2.4, 2.1, 0xf0e7d2, 0xb56b3d, { windows: true, roofHeight: 0.75 });
      office.position.set(-3.8, 0.12, 2.7);
      group.add(office);
      addBox(group, [3.0, 0.2, 1.8], [3.0, 0.23, 2.9], makeMat(0xb89858, { roughness: 0.9 }), 'construction frame');
      for (let j = 0; j < 4; j++) makePerson(group, rand(-4.6, 4.4), rand(-3.5, 3.2), pick([0x355c7d, 0x7d5a35, 0x2f6f56]), 0.9);
    } else if (index === 1) {
      createPad(group, 11.5, 9.0, grassPad);
      [-2.4, 0.2, 2.7].forEach((x, j) => createPond(group, x, -1.6 + j * 0.12, 1.18, 0.88));
      const house = createSimpleHouse(3.2, 2.4, 2.0, 0xe5d6b8, 0x885a40, { windows: true, roofHeight: 0.7 });
      house.position.set(-2.9, 0.10, 2.6);
      group.add(house);
      addBox(group, [2.8, 0.55, 1.1], [2.4, 0.38, 2.3], makeMat(0xc5b08b, { roughness: 0.86 }), 'feed storage');
      for (let j = 0; j < 3; j++) makePerson(group, rand(-3.8, 3.2), rand(-3.0, 3.0), 0x4a6b4d, 0.85);
    } else if (index === 2) {
      createPad(group, 12.8, 10.4, dirt);
      const mill = createSimpleHouse(4.8, 4.2, 4.2, 0xc48a4b, 0x574237, { flat: true, windows: true, windowRows: 2, windowCols: 5 });
      mill.position.set(-1.4, 0.10, 0.2);
      group.add(mill);
      addCylinder(group, 1.05, 4.6, [3.2, 2.40, 0.2], makeMat(0xb9a683, { roughness: 0.72, metalness: 0.10 }), 22, 'feed silo');
      addCylinder(group, 0.82, 3.6, [4.6, 1.90, -1.5], makeMat(0xcbb98d, { roughness: 0.72, metalness: 0.08 }), 22, 'feed silo');
      for (let j = 0; j < 6; j++) addBox(group, [0.7, 0.32, 0.48], [-4.5 + j * 0.75, 0.24, -3.5], makeMat(0xd8bc77, { roughness: 0.9 }), 'feed sacks');
      makeTruck(group, -3.2, 3.3, 0xc49145, -0.18, 0.85);
    } else if (index === 3) {
      createPad(group, 11.8, 9.6, grassPad);
      const lab = createSimpleHouse(4.5, 3.0, 2.5, 0xdfe9e5, 0x5d8ba0, { flat: true, windows: true, windowRows: 1, windowCols: 5 });
      lab.position.set(-2.4, 0.12, 1.7);
      group.add(lab);
      [-3.5, -1.5, 0.5, 2.5].forEach(x => addCylinder(group, 0.74, 0.45, [x, 0.30, -2.3], makeMat(0x74b8c5, { roughness: 0.48, opacity: 0.86 }), 30, 'hatchery tank'));
      addBox(group, [3.5, 0.20, 1.8], [2.6, 0.26, 1.8], makeMat(0xbac6bd, { roughness: 0.82 }), 'tank deck');
      for (let j = 0; j < 3; j++) makePerson(group, rand(-4.0, 3.5), rand(-2.8, 2.8), 0x2e7691, 0.82);
    } else if (index === 4) {
      createPad(group, 12.6, 9.6, concrete);
      const store = createSimpleHouse(5.8, 4.0, 3.4, 0xf8fbfb, 0x6f8fa0, { flat: true, windows: true, windowRows: 2, windowCols: 6, metalness: 0.03 });
      store.position.set(-1.1, 0.11, 0.1);
      group.add(store);
      addBox(group, [3.2, 1.3, 1.5], [3.3, 0.74, 2.4], makeMat(0xe7edf0, { roughness: 0.68 }), 'market stall');
      addBox(group, [3.4, 0.12, 1.8], [3.3, 1.44, 2.4], makeMat(0x326f7d, { roughness: 0.65 }), 'market canopy');
      makeTruck(group, -3.4, -3.2, 0xf7fbff, 0.15, 1.05);
      makeTruck(group, 3.2, -2.6, 0xe5eef2, -0.25, 0.72);
    } else if (index === 5) {
      createPad(group, 13.8, 10.8, concrete);
      const factory = createSimpleHouse(6.2, 4.4, 4.6, 0x8e5143, 0x34383d, { flat: true, windows: true, windowRows: 2, windowCols: 7 });
      factory.position.set(-0.9, 0.12, 0.4);
      group.add(factory);
      const annex = createSimpleHouse(3.5, 3.4, 3.0, 0x9c6d55, 0x34383d, { flat: true, windows: true, windowRows: 1, windowCols: 4 });
      annex.position.set(3.9, 0.12, 1.1);
      group.add(annex);
      const stack = addCylinder(group, 0.42, 6.6, [-4.3, 3.45, -1.6], makeMat(0x4b3531, { roughness: 0.78 }), 16, 'smokestack');
      stack.userData.entityIndex = index;
      for (let p = 0; p < 5; p++) this.smokePuffs.push(createSmokePuff(group, -4.3 + rand(-0.2, 0.2), 7.0 + p * 0.62, -1.6 + rand(-0.15, 0.15), rand(0.8, 1.35)));
      makeTruck(group, 3.9, -3.3, 0x7f7468, -0.08, 0.86);
      addBox(group, [4.4, 0.18, 0.46], [-0.5, 0.20, -5.1], makeMat(0x5a5f59, { roughness: 0.7 }), 'subtle outflow pipe');
    }
  }

  addOfferBar(group, index) {
    const base = addBox(group, [5.4, 0.18, 0.44], [0, 0.28, -5.0], makeMat(0xe6e0d2, { roughness: 0.82 }), 'offer bar base');
    const fill = addBox(group, [5.4, 0.22, 0.46], [0, 0.34, -5.0], makeMat(COLORS.token, { roughness: 0.68, emissive: 0x553500, emissiveIntensity: 0.03 }), 'offer bar fill');
    fill.userData.baseWidth = 5.4;
    this.offerBars[index] = { base, fill };
  }

  addResponseBar(group, index) {
    const pole = addBox(group, [0.18, 2.6, 0.18], [5.8, 1.35, -4.3], makeMat(0x8a8172, { roughness: 0.86 }), 'response pole');
    const fill = addBox(group, [0.70, 1.0, 0.70], [5.8, 0.60, -4.3], makeMat(COLORS.green, { roughness: 0.72 }), 'capital response');
    fill.visible = false;
    this.responseBars[index] = { pole, fill };
  }

  createOtherInvestors() {
    const bank = createSimpleHouse(7.2, 5.2, 4.0, 0xded7c5, 0x596b6b, { flat: true, windows: true, windowRows: 2, windowCols: 6 });
    placeObject(bank, -48, 44, 0.05);
    this.world.add(bank);
    addBox(bank, [4.8, 0.2, 0.38], [0, 4.25, 2.72], makeMat(0x2a4c57, { roughness: 0.6 }), 'bank sign');

    const capital = new THREE.Group();
    placeObject(capital, 43, 43, -0.10);
    createPad(capital, 9.0, 6.8, makeMat(0xc5bd9a, { roughness: 0.94 }));
    for (let i = 0; i < 10; i++) {
      const coin = addCylinder(capital, 0.42, 0.16, [-3.2 + (i % 5) * 1.4, 0.20 + Math.floor(i / 5) * 0.18, rand(-1.9, 1.9)], makeMat(0xcaa84b, { roughness: 0.52, metalness: 0.12 }), 24, 'capital coin');
      coin.rotation.y = rand(0, Math.PI);
    }
    const office = createSimpleHouse(3.2, 2.6, 2.6, 0xe8e2d1, 0x5f6869, { flat: true, windows: true, windowRows: 1, windowCols: 4 });
    office.position.set(3.0, 0.12, 1.4);
    capital.add(office);
    this.world.add(capital);

    const publicOffice = createSimpleHouse(6.0, 4.0, 3.2, 0xe1d2b8, 0x9e6c4b, { windows: true, roofHeight: 0.9, windowRows: 2, windowCols: 5 });
    placeObject(publicOffice, 4, 47, 0.02);
    this.world.add(publicOffice);
  }

  captureProsperitySurfaces() {
    const structureNames = [
      'construction frame',
      'feed storage',
      'feed silo',
      'feed sacks',
      'hatchery tank',
      'tank deck',
      'market stall',
      'market canopy',
      'smokestack',
      'subtle outflow pipe',
      'truck body',
      'truck cab',
      'site pad'
    ];

    this.prosperityMeshes = [];
    this.world.traverse(obj => {
      if (!obj.isMesh || !obj.material || obj === this.waterMesh) return;
      const isStructure = obj.userData.prosperitySensitive || structureNames.includes(obj.name);
      if (!isStructure) return;
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      materials.forEach(rememberMaterialBase);
      this.prosperityMeshes.push(obj);
    });

    this.createGrimeMarks();
  }

  createGrimeMarks() {
    this.grimeMarks = [];
    this.entityGroups.forEach(group => {
      if (!group) return;
      const markCount = 4;
      for (let i = 0; i < markCount; i++) {
        const mark = new THREE.Mesh(
          new THREE.PlaneGeometry(rand(0.52, 1.18), rand(0.20, 0.54)),
          makeMat(0x221f1b, { roughness: 0.98, opacity: 0.0 })
        );
        mark.material.transparent = true;
        mark.position.set(rand(-4.8, 4.8), rand(1.05, 3.8), rand(-5.18, 5.18));
        if (Math.abs(mark.position.z) > 4.9) {
          mark.rotation.y = mark.position.z > 0 ? 0 : Math.PI;
        } else {
          mark.position.x = mark.position.x < 0 ? -6.95 : 6.95;
          mark.rotation.y = mark.position.x < 0 ? -Math.PI / 2 : Math.PI / 2;
        }
        mark.userData.baseOpacity = rand(0.10, 0.24);
        mark.visible = false;
        group.add(mark);
        this.grimeMarks.push(mark);
      }
    });
  }

  createBoats() {
    const colors = [0x2f7890, 0x9b4f42, 0xd7a64a, 0x365f7d, 0x4f7f55];
    for (let i = 0; i < 7; i++) {
      const kind = i === 0 ? 'cargo' : i % 3 === 0 ? 'sail' : 'work';
      const boat = createShip(kind, kind === 'cargo' ? null : pick(colors));
      boat.scale.setScalar(kind === 'cargo' ? rand(0.95, 1.25) : rand(0.75, 1.25));
      boat.userData = {
        offset: rand(0, Math.PI * 2),
        rx: rand(22, 58),
        rz: rand(7, 20),
        speed: kind === 'cargo' ? rand(0.015, 0.03) : rand(0.025, 0.055),
        zBase: -30 + rand(-8, 6),
        bob: rand(0.02, 0.08)
      };
      this.world.add(boat);
      this.movingBoats.push(boat);
    }

    // A few boats moored along the quay in the same simple style as the harbor reference.
    [-43, -37, -31, 37, 43].forEach((x, i) => {
      const b = createShip('sail', colors[i % colors.length]);
      b.scale.setScalar(0.55);
      b.position.set(x, 0.20, coastLine(x) - 4 + rand(-1, 1));
      b.rotation.y = rand(-0.25, 0.25);
      this.world.add(b);
    });
  }

  addWorldLabel(index, name, anchor) {
    const div = document.createElement('button');
    div.type = 'button';
    div.className = 'world-label';
    div.innerHTML = `
      <span class="label-top"><span class="name"></span><span class="offer-bubble">0</span></span>
      <span class="offer-fill"><i></i></span>
      <span class="delta">Δ capital —</span>`;
    div.querySelector('.name').textContent = name;
    div.addEventListener('click', e => {
      e.stopPropagation();
      this.selectEntity(index);
      this.onEntitySelect(index);
    });
    this.labelRoot.appendChild(div);
    this.labels.push({ index, name, anchor, div });
  }

  updateState(nextState) {
    this.state = { ...this.state, ...nextState };
    const offers = this.state.offers || [0, 0, 0, 0, 0, 0];
    const lastRun = this.state.lastRun;
    this.labels.forEach(item => {
      const offer = offers[item.index] || 0;
      item.div.style.setProperty('--offer-fill', `${clamp(offer, 0, 100)}%`);
      item.div.querySelector('.offer-bubble').textContent = String(offer);
      const deltaText = lastRun ? `Δ capital ${signed(lastRun.deltaK[item.index], 1)}` : 'Δ capital —';
      item.div.querySelector('.delta').textContent = deltaText;
    });
    offers.forEach((offer, i) => {
      const bar = this.offerBars[i];
      if (!bar) return;
      const pct = clamp(offer / 100, 0.001, 1);
      bar.fill.scale.x = pct;
      bar.fill.position.x = -2.7 + (5.4 * pct) / 2;
      bar.fill.visible = offer > 0;
    });
    if (lastRun?.deltaK) this.updateResponseBars(lastRun.deltaK);
    else this.responseBars.forEach(bar => { if (bar?.fill) bar.fill.visible = false; });
  }

  updateResponseBars(deltaK) {
    const maxAbs = Math.max(1, ...deltaK.map(v => Math.abs(v)));
    deltaK.forEach((dk, i) => {
      const bar = this.responseBars[i];
      if (!bar) return;
      const h = clamp(Math.abs(dk) / maxAbs * 3.2, 0.16, 3.2);
      bar.fill.visible = true;
      bar.fill.scale.y = h;
      bar.fill.position.y = dk >= 0 ? 0.35 + h / 2 : 0.35 - h / 2;
      bar.fill.material.color.setHex(dk >= 0 ? COLORS.green : COLORS.red);
    });
  }

  selectEntity(index) {
    this.selectedIndex = index;
    this.labels.forEach(item => item.div.classList.toggle('selected', item.index === index));
    this.entityGroups.forEach((group, i) => {
      if (!group) return;
      const targetScale = i === index ? 1.045 : 1.0;
      group.scale.setScalar(targetScale);
    });
  }

  handleClick(event) {
    if (!this.down) return;
    const dist = Math.hypot(event.clientX - this.down.x, event.clientY - this.down.y);
    this.down = null;
    if (dist > 5) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.world.children, true);
    const hit = hits.find(h => Number.isInteger(h.object.userData.entityIndex));
    if (hit) {
      const index = hit.object.userData.entityIndex;
      this.selectEntity(index);
      this.onEntitySelect(index);
    }
  }

  projectEntity(index) {
    const anchor = this.anchors[index];
    if (!anchor) return null;
    anchor.getWorldPosition(this.tmpVec);
    this.tmpVec.project(this.camera);
    const width = this.renderer.domElement.clientWidth;
    const height = this.renderer.domElement.clientHeight;
    const visible = this.tmpVec.z < 1 && this.tmpVec.x > -1.18 && this.tmpVec.x < 1.18 && this.tmpVec.y > -1.18 && this.tmpVec.y < 1.18;
    return {
      visible,
      left: (this.tmpVec.x * 0.5 + 0.5) * width,
      top: (-this.tmpVec.y * 0.5 + 0.5) * height
    };
  }

  updateLakeColor(netLakeOutcome = 0) {
    if (!waterMaterial) return;

    const sparkling = new THREE.Color(0x72dcec);
    const clean = new THREE.Color(0x51cbe0);
    const neutral = new THREE.Color(0x6f9fb0);
    const dirty = new THREE.Color(0x2d3a32);
    const ugly = new THREE.Color(0x1d1f1b);

    let color;

    if (netLakeOutcome >= 0) {
      const t = smoothstep(netLakeOutcome / LAKE_VISUAL_SCALE.positiveFull);
      color = neutral.clone().lerp(clean, t).lerp(sparkling, Math.max(0, t - 0.62) * 0.65);
      waterMaterial.opacity = lerp(0.82, 0.66, t);
      waterMaterial.roughness = lerp(0.55, 0.28, t);
      waterMaterial.emissive.setHex(0x0b9cb0);
      waterMaterial.emissiveIntensity = lerp(0.0, 0.08, t);
    } else {
      const t = smoothstep(Math.abs(netLakeOutcome) / LAKE_VISUAL_SCALE.negativeFull);
      color = neutral.clone().lerp(dirty, t);
      waterMaterial.opacity = lerp(0.88, 0.95, t);
      waterMaterial.roughness = lerp(0.58, 0.82, t);
      waterMaterial.emissive.setHex(0x000000);
      waterMaterial.emissiveIntensity = 0;
    }

    if (netLakeOutcome < -LAKE_VISUAL_SCALE.severeNegativeStart) {
      const t = smoothstep((Math.abs(netLakeOutcome) - LAKE_VISUAL_SCALE.severeNegativeStart) / (LAKE_VISUAL_SCALE.severeNegativeFull - LAKE_VISUAL_SCALE.severeNegativeStart));
      color = dirty.clone().lerp(ugly, t);
    }

    waterMaterial.color.copy(color);
  }

  updateProsperityLook(netProsperityOutcome = 0) {
    const positive = smoothstep(netProsperityOutcome / PROSPERITY_VISUAL_SCALE.positiveFull);
    const negative = smoothstep(Math.abs(Math.min(0, netProsperityOutcome)) / PROSPERITY_VISUAL_SCALE.negativeFull);
    const cleanTint = new THREE.Color(0xfff5dc);
    const rundownTint = new THREE.Color(0x3a332d);

    this.prosperityMeshes.forEach(mesh => {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach(material => {
        restoreMaterialBase(material);
        const base = material.userData.visualBase;
        if (!base?.color || !material.color) return;
        if (positive > 0) {
          material.color.copy(base.color).lerp(cleanTint, positive * 0.28);
          if (material.emissive) material.emissive.copy(base.emissive ?? new THREE.Color(0x000000)).lerp(new THREE.Color(0xffd887), positive * 0.36);
          if (material.emissiveIntensity !== undefined) material.emissiveIntensity = (base.emissiveIntensity ?? 0) + positive * 0.10;
          if (material.roughness !== undefined) material.roughness = Math.max(0.38, (base.roughness ?? 0.8) - positive * 0.18);
        }
        if (negative > 0) {
          material.color.copy(base.color).lerp(rundownTint, negative * 0.55);
          material.color.offsetHSL(0, -negative * 0.12, -negative * 0.13);
          if (material.emissiveIntensity !== undefined) material.emissiveIntensity = (base.emissiveIntensity ?? 0) * (1 - negative * 0.82);
          if (material.roughness !== undefined) material.roughness = Math.min(1, (base.roughness ?? 0.8) + negative * 0.16);
        }
      });
    });

    this.grimeMarks.forEach(mark => {
      mark.visible = negative > 0.05;
      mark.material.opacity = mark.userData.baseOpacity * negative;
      mark.scale.setScalar(lerp(0.72, 1.25, negative));
    });
  }

  updateOutcomeVisuals({ lake = 0, prosperity = 0 } = {}) {
    this.updateLakeColor(lake);
    this.updateProsperityLook(prosperity);
  }

  updateLabels() {
    const width = this.renderer.domElement.clientWidth;
    const height = this.renderer.domElement.clientHeight;
    for (const item of this.labels) {
      item.anchor.getWorldPosition(this.tmpVec);
      this.tmpVec.project(this.camera);
      const visible = this.tmpVec.z < 1 && this.tmpVec.x > -1.12 && this.tmpVec.x < 1.12 && this.tmpVec.y > -1.12 && this.tmpVec.y < 1.12;
      if (!visible) {
        item.div.style.display = 'none';
        continue;
      }
      item.div.style.display = 'grid';
      item.div.style.left = `${(this.tmpVec.x * 0.5 + 0.5) * width}px`;
      item.div.style.top = `${(-this.tmpVec.y * 0.5 + 0.5) * height}px`;
    }
  }

  updateMotion(delta, time) {
    if (this.waterMesh) {
      const pos = this.waterMesh.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const wave = Math.sin(x * 0.08 + time * 0.9) * 0.035 + Math.cos(z * 0.11 + time * 0.7) * 0.025;
        pos.setY(i, wave);
      }
      pos.needsUpdate = true;
      this.waterMesh.geometry.computeVertexNormals();
    }

    this.movingBoats.forEach(boat => {
      const u = time * boat.userData.speed + boat.userData.offset;
      const x = Math.cos(u) * boat.userData.rx;
      const z = boat.userData.zBase + Math.sin(u * 0.72) * boat.userData.rz;
      boat.position.set(x, 0.18 + Math.sin(time * 1.9 + boat.userData.offset) * boat.userData.bob, z);
      const dx = -Math.sin(u) * boat.userData.rx;
      const dz = Math.cos(u * 0.72) * 0.72 * boat.userData.rz;
      boat.rotation.y = Math.atan2(dx, dz) + Math.PI / 2;
    });

    this.smokePuffs.forEach(puff => {
      const phase = time * 0.55 + puff.userData.phase;
      puff.position.x = puff.userData.base.x + Math.sin(phase) * 0.22 * puff.userData.scale;
      puff.position.y = puff.userData.base.y + (Math.sin(phase * 0.7) + 1) * 0.10 * puff.userData.scale;
      puff.position.z = puff.userData.base.z + Math.cos(phase * 0.8) * 0.18 * puff.userData.scale;
      const s = puff.userData.scale * (0.95 + Math.sin(phase * 1.3) * 0.12);
      puff.scale.setScalar(s);
    });
  }

  animate() {
    if (this.isDisposed) return;
    this.animationFrame = requestAnimationFrame(() => this.animate());
    const delta = Math.min(0.05, this.clock.getDelta());
    const time = this.clock.elapsedTime;
    this.updateMotion(delta, time);
    this.controls.update();
    this.updateLabels();
    if (this.frameCallback) this.frameCallback();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.isDisposed = true;
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    window.removeEventListener('resize', this.handleResize);
    this.renderer.domElement.removeEventListener('pointerdown', this.handlePointerDown);
    this.renderer.domElement.removeEventListener('pointerup', this.handlePointerUp);
    this.clearWorld();
    this.controls.dispose?.();
    this.renderer.dispose?.();
  }
}
