import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const COLORS = {
  ground: 0xe8dfcc,
  ground2: 0xd9c8a6,
  lake: 0x4a9ab2,
  lakeDeep: 0x2b6f87,
  grass: 0x83a66e,
  tree: 0x3d6842,
  trunk: 0x8a623f,
  road: 0xc9b99f,
  roof: 0xaa6f45,
  wall: 0xf2eee4,
  farm: 0x5a9e86,
  feed: 0xb9824c,
  hatchery: 0x6ba8b8,
  cold: 0xf8fbfd,
  industry: 0x8c8174,
  token: 0xd39c3a,
  good: 0x4b9f6a,
  bad: 0xb86b55,
  neutral: 0x9b8e7a
};

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function fmtSigned(v, digits = 1) { return `${v >= 0 ? '+' : ''}${v.toFixed(digits)}`; }

function makeMat(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.82,
    metalness: options.metalness ?? 0.02,
    transparent: options.opacity !== undefined && options.opacity < 1,
    opacity: options.opacity ?? 1,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0
  });
}

function addBox(parent, size, pos, mat, name = '') {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = name;
  parent.add(mesh);
  return mesh;
}

function addCylinder(parent, radius, height, pos, mat, segments = 32, name = '') {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), mat);
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = name;
  parent.add(mesh);
  return mesh;
}

function addPlane(parent, width, depth, pos, mat, rotationY = 0, name = '') {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = rotationY;
  mesh.position.set(pos[0], pos[1], pos[2]);
  mesh.receiveShadow = true;
  mesh.name = name;
  parent.add(mesh);
  return mesh;
}

function markEntityMeshes(group, index) {
  group.traverse(obj => {
    if (obj.isMesh) obj.userData.entityIndex = index;
  });
}

function makePond(parent, x, z, sx, sz, mat) {
  const pond = addCylinder(parent, 1, 0.10, [x, 0.05, z], mat, 40, 'pond');
  pond.scale.set(sx, 1, sz);
  return pond;
}

function makeTree(parent, x, z, s = 1) {
  const trunk = addCylinder(parent, 0.12 * s, 0.9 * s, [x, 0.45 * s, z], makeMat(COLORS.trunk), 8, 'tree trunk');
  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.65 * s, 1.45 * s, 7), makeMat(COLORS.tree));
  crown.position.set(x, 1.25 * s, z);
  crown.castShadow = true;
  parent.add(crown);
  return [trunk, crown];
}

function makeHuman(parent, x, z, color = 0x444444, scale = 1) {
  const mat = makeMat(color, { roughness: 0.8 });
  const body = addCylinder(parent, 0.12 * scale, 0.55 * scale, [x, 0.42 * scale, z], mat, 12, 'person');
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15 * scale, 12, 8), makeMat(0x8d6247));
  head.position.set(x, 0.80 * scale, z);
  head.castShadow = true;
  parent.add(head);
  return [body, head];
}

function makeTruck(parent, x, z, color = 0xffffff, rotY = 0, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  parent.add(group);
  addBox(group, [1.9 * scale, 0.55 * scale, 0.85 * scale], [0, 0.45 * scale, 0], makeMat(color), 'truck body');
  addBox(group, [0.65 * scale, 0.50 * scale, 0.82 * scale], [1.05 * scale, 0.48 * scale, 0], makeMat(0xe7eef4), 'truck cab');
  const wheelMat = makeMat(0x222222, { roughness: 0.6 });
  [[-0.65, -0.48], [0.65, -0.48], [-0.65, 0.48], [0.65, 0.48]].forEach(([wx, wz]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * scale, 0.18 * scale, 0.12 * scale, 14), wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx * scale, 0.18 * scale, wz * scale);
    wheel.castShadow = true;
    group.add(wheel);
  });
  return group;
}

export class LakeScene {
  constructor({ canvas, labelRoot, onEntitySelect = () => {} }) {
    this.canvas = canvas;
    this.labelRoot = labelRoot;
    this.onEntitySelect = onEntitySelect;
    this.clock = new THREE.Clock();
    this.labels = [];
    this.entityGroups = [];
    this.offerRings = [];
    this.responseBars = [];
    this.capitalLines = [];
    this.animated = [];
    this.selectedIndex = null;
    this.state = { offers: [0, 0, 0, 0, 0, 0], lastRun: null };

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf6f2ea);
    this.scene.fog = new THREE.Fog(0xf6f2ea, 62, 118);

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 300);
    this.camera.position.set(38, 31, 43);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.target.set(0, 0, 0);
    this.controls.minDistance = 28;
    this.controls.maxDistance = 78;
    this.controls.maxPolarAngle = Math.PI * 0.46;
    this.controls.minPolarAngle = Math.PI * 0.18;
    this.controls.screenSpacePanning = false;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.down = null;
    this.renderer.domElement.addEventListener('pointerdown', e => { this.down = { x: e.clientX, y: e.clientY }; });
    this.renderer.domElement.addEventListener('pointerup', e => this.handleClick(e));

    this.world = new THREE.Group();
    this.scene.add(this.world);
    this.setupLights();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.animate();
  }

  setupLights() {
    const hemi = new THREE.HemisphereLight(0xffffff, 0xb9a37d, 1.75);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(25, 40, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -55;
    sun.shadow.camera.right = 55;
    sun.shadow.camera.top = 55;
    sun.shadow.camera.bottom = -55;
    sun.shadow.camera.near = 5;
    sun.shadow.camera.far = 90;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0xb9d9ff, 0.55);
    fill.position.set(-35, 18, -28);
    this.scene.add(fill);
  }

  resize() {
    const { clientWidth, clientHeight } = this.canvas.parentElement;
    this.camera.aspect = clientWidth / Math.max(1, clientHeight);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight, false);
  }

  resetView() {
    this.camera.position.set(38, 31, 43);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  setLake(params) {
    this.params = params;
    this.clearWorld();
    this.buildWorld(params);
    this.updateState(this.state);
  }

  clearWorld() {
    this.world.clear();
    this.labels.forEach(label => label.remove());
    this.labels = [];
    this.entityGroups = [];
    this.offerRings = [];
    this.responseBars = [];
    this.capitalLines = [];
    this.animated = [];
  }

  buildWorld(params) {
    const groundMat = makeMat(COLORS.ground, { roughness: 0.9 });
    const grassMat = makeMat(COLORS.grass, { roughness: 0.9 });
    const roadMat = makeMat(COLORS.road, { roughness: 0.92 });
    const waterMat = makeMat(COLORS.lake, { roughness: 0.55, metalness: 0.03, opacity: 0.82, emissive: COLORS.lakeDeep, emissiveIntensity: 0.05 });

    addPlane(this.world, 78, 64, [0, -0.06, 0], groundMat);
    addPlane(this.world, 60, 42, [-2, -0.05, 4], grassMat, 0.06);

    // Roads and paths, deliberately sparse: small lake town, not a megacity.
    addPlane(this.world, 4.4, 58, [-31, 0.01, 0], roadMat, -0.05);
    addPlane(this.world, 4.2, 42, [28, 0.012, 1], roadMat, 0.08);
    addPlane(this.world, 54, 3.6, [0, 0.014, 24], roadMat, 0.02);
    addPlane(this.world, 50, 3.4, [0, 0.014, -29], roadMat, -0.03);
    addPlane(this.world, 3.0, 28, [5, 0.016, -4], roadMat, 0.34);

    const lake = new THREE.Mesh(new THREE.CircleGeometry(13.8, 96), waterMat);
    lake.rotation.x = -Math.PI / 2;
    lake.scale.set(1.28, 0.82, 1);
    lake.position.y = 0.03;
    lake.receiveShadow = true;
    lake.name = 'lake';
    this.world.add(lake);
    this.lake = lake;

    for (let i = 0; i < 4; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(4.2 + i * 2.6, 0.018, 8, 90), makeMat(0xffffff, { opacity: 0.15 }));
      ring.rotation.x = Math.PI / 2;
      ring.scale.set(1.28, 0.82, 1);
      ring.position.y = 0.08 + i * 0.003;
      ring.userData.ripple = { offset: i / 4 };
      this.world.add(ring);
      this.animated.push(ring);
    }

    this.createBoatsAndFish();
    this.createLandscapeDetails();
    this.createInvestorBuildings();
    this.createEntities(params);
    this.createCapitalLines(params);
  }

  createLandscapeDetails() {
    for (let i = 0; i < 54; i++) {
      const angle = i * 2.399 + 0.3;
      const radius = 20 + (i % 7) * 3.6 + ((i * 17) % 11) * 0.35;
      const x = Math.cos(angle) * radius * 1.05;
      const z = Math.sin(angle) * radius * 0.82;
      if (Math.abs(x) < 11 && Math.abs(z) < 10) continue;
      if (Math.abs(x) > 35 || Math.abs(z) > 30) continue;
      makeTree(this.world, x, z, 0.75 + (i % 3) * 0.12);
    }

    // Market / residential low-rise cluster. Kept modest on purpose.
    const wallMats = [0xf1e2c6, 0xe7d2b0, 0xece5da, 0xd9d6ca].map(c => makeMat(c));
    const roofMats = [0xb7663c, 0x9f7a50, 0xc48b54, 0x7e8b76].map(c => makeMat(c));
    for (let i = 0; i < 13; i++) {
      const x = 26 + (i % 4) * 2.5;
      const z = 8 + Math.floor(i / 4) * 2.4;
      const h = 0.8 + (i % 3) * 0.18;
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      this.world.add(g);
      addBox(g, [1.8, h, 1.4], [0, h / 2, 0], wallMats[i % wallMats.length], 'low building');
      addBox(g, [2.0, 0.22, 1.65], [0, h + 0.15, 0], roofMats[i % roofMats.length], 'roof');
    }

    // Market stalls near cold-chain route.
    for (let i = 0; i < 5; i++) {
      const g = new THREE.Group();
      g.position.set(16 + i * 1.1, 0, -8.5 + (i % 2) * 0.6);
      this.world.add(g);
      addBox(g, [0.85, 0.40, 0.65], [0, 0.20, 0], makeMat(0xd6b47b), 'market table');
      addBox(g, [1.0, 0.10, 0.78], [0, 0.72, 0], makeMat(i % 2 ? 0xc46f46 : 0x6d9e8c), 'market shade');
    }
  }

  createBoatsAndFish() {
    const boat = new THREE.Group();
    addBox(boat, [2.0, 0.35, 0.55], [0, 0.22, 0], makeMat(0x80523a), 'boat hull');
    addBox(boat, [0.08, 1.25, 0.08], [0.05, 0.86, 0], makeMat(0x6c5a43), 'mast');
    const sail = new THREE.Mesh(new THREE.ConeGeometry(0.52, 1.05, 3), makeMat(0xf7f0dc, { opacity: 0.92 }));
    sail.position.set(0.35, 0.95, 0.04);
    sail.rotation.z = -0.45;
    boat.add(sail);
    boat.userData.boat = true;
    this.world.add(boat);
    this.boat = boat;
    this.animated.push(boat);

    const fishMat = makeMat(0xd7b15c, { roughness: 0.65 });
    for (let i = 0; i < 22; i++) {
      const fish = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.52, 8), fishMat);
      fish.rotation.z = Math.PI / 2;
      fish.userData.fish = { angle: i * 0.7, radius: 2.3 + (i % 6) * 1.25, speed: 0.18 + (i % 5) * 0.025 };
      fish.position.y = 0.16;
      this.world.add(fish);
      this.animated.push(fish);
    }
  }

  createInvestorBuildings() {
    const bank = new THREE.Group();
    bank.position.set(-31, 0, 21);
    this.world.add(bank);
    addBox(bank, [4.4, 1.55, 3.0], [0, 0.78, 0], makeMat(0xe9e1d2), 'local bank');
    addBox(bank, [4.8, 0.32, 3.3], [0, 1.72, 0], makeMat(0x9d7d55), 'bank roof');
    for (let i = -1; i <= 1; i++) addCylinder(bank, 0.14, 1.20, [i * 1.05, 0.70, -1.65], makeMat(0xded4bf), 12, 'bank column');
    this.createWorldLabel('Local bank', new THREE.Vector3(-31, 2.55, 21), 'soft');

    const investorHub = new THREE.Group();
    investorHub.position.set(31, 0, 22);
    this.world.add(investorHub);
    addCylinder(investorHub, 1.9, 0.38, [0, 0.19, 0], makeMat(0xd7bd7a), 32, 'capital pool');
    for (let i = 0; i < 5; i++) {
      const coin = addCylinder(investorHub, 0.68, 0.16, [-1.1 + i * 0.55, 0.52 + i * 0.14, 0], makeMat(0xc79238, { metalness: 0.16, roughness: 0.5 }), 32, 'coin');
      coin.rotation.y = i * 0.1;
    }
    this.createWorldLabel('Other investors', new THREE.Vector3(31, 2.7, 22), 'soft');

    makeHuman(this.world, -27.5, 19, 0x364b5f, 0.95);
    makeHuman(this.world, 27.8, 20.5, 0x5c4b3f, 0.95);
  }

  createEntities(params) {
    const pondMat = makeMat(COLORS.lake, { opacity: 0.70, emissive: COLORS.lakeDeep, emissiveIntensity: 0.04 });
    params.entities.forEach((entity, i) => {
      const g = new THREE.Group();
      g.position.set(entity.world[0], 0, entity.world[2]);
      g.name = entity.name;
      this.world.add(g);
      this.entityGroups[i] = g;

      switch (entity.id) {
        case 'scalable-farm':
          this.buildScalableFarm(g, pondMat);
          break;
        case 'steady-farm':
          this.buildSteadyFarm(g, pondMat);
          break;
        case 'feed-mill':
          this.buildFeedMill(g);
          break;
        case 'hatchery':
          this.buildHatchery(g, pondMat);
          break;
        case 'cold-chain':
          this.buildColdChain(g);
          break;
        case 'industry':
          this.buildIndustry(g);
          break;
        default:
          break;
      }

      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.065, 10, 64), makeMat(COLORS.token, { opacity: 0.74, emissive: 0x8c5c18, emissiveIntensity: 0.05 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.08;
      ring.visible = false;
      g.add(ring);
      this.offerRings[i] = ring;

      const barGroup = new THREE.Group();
      barGroup.position.set(2.25, 0, 1.7);
      const bar = addCylinder(barGroup, 0.22, 1, [0, 0.5, 0], makeMat(COLORS.good, { opacity: 0.82 }), 18, 'capital response');
      bar.userData.barMesh = true;
      barGroup.visible = false;
      g.add(barGroup);
      this.responseBars[i] = { group: barGroup, bar };

      markEntityMeshes(g, i);
      this.createEntityLabel(entity, i);
    });
  }

  buildScalableFarm(g, pondMat) {
    makePond(g, -1.2, -0.8, 1.15, 0.72, pondMat);
    makePond(g, 0.2, -0.8, 1.15, 0.72, pondMat);
    makePond(g, -0.5, 0.55, 1.4, 0.82, pondMat);
    addBox(g, [2.5, 0.95, 1.5], [1.75, 0.48, 0.85], makeMat(0xe4d6b8), 'farm office');
    addBox(g, [2.8, 0.38, 1.7], [1.75, 1.13, 0.85], makeMat(0xb87042), 'farm roof');
    addBox(g, [2.2, 0.15, 0.25], [-1.1, 0.14, 1.95], makeMat(0x9c744f), 'new pond plank');
    makeHuman(g, 0.9, -1.65, 0x305f56, 0.9);
    makeHuman(g, -2.2, 0.85, 0x4e6a30, 0.82);
  }

  buildSteadyFarm(g, pondMat) {
    makePond(g, -0.7, -0.7, 1.2, 0.75, pondMat);
    makePond(g, 0.8, -0.6, 1.1, 0.70, pondMat);
    addBox(g, [2.4, 0.82, 1.45], [0.05, 0.41, 1.0], makeMat(0xe8dcbc), 'steady farm');
    addBox(g, [2.6, 0.30, 1.7], [0.05, 0.97, 1.0], makeMat(0xa46d4a), 'steady roof');
    makeHuman(g, -1.7, 0.95, 0x6a5a44, 0.82);
  }

  buildFeedMill(g) {
    addBox(g, [3.7, 1.75, 2.6], [0, 0.88, 0], makeMat(0xd4b283), 'feed mill');
    addBox(g, [3.9, 0.42, 2.85], [0, 1.95, 0], makeMat(COLORS.feed), 'feed mill roof');
    addCylinder(g, 0.55, 2.55, [-2.45, 1.27, 0.65], makeMat(0xa6815a), 18, 'silo');
    addCylinder(g, 0.55, 2.35, [-3.15, 1.18, -0.45], makeMat(0xc59b66), 18, 'silo');
    for (let i = 0; i < 5; i++) addBox(g, [0.55, 0.42, 0.35], [1.55 + (i % 2) * 0.44, 0.21, -1.7 + i * 0.38], makeMat(0xb99156), 'feed sacks');
    makeTruck(g, 2.8, -2.0, 0xb68648, -0.3, 0.88);
  }

  buildHatchery(g, pondMat) {
    addBox(g, [2.9, 1.18, 1.8], [0.2, 0.59, 0.55], makeMat(0xe8ece6), 'hatchery lab');
    addBox(g, [3.1, 0.32, 2.0], [0.2, 1.35, 0.55], makeMat(0x7fa6aa), 'hatchery roof');
    for (let i = 0; i < 5; i++) {
      const tank = addCylinder(g, 0.42, 0.35, [-1.75 + i * 0.75, 0.18, -1.05], pondMat, 24, 'hatchery tank');
      tank.scale.z = 0.78;
    }
    makeHuman(g, 1.7, -0.95, 0x4f6672, 0.78);
  }

  buildColdChain(g) {
    addBox(g, [4.1, 1.45, 2.6], [0, 0.73, 0], makeMat(COLORS.cold), 'cold storage');
    addBox(g, [4.3, 0.30, 2.8], [0, 1.62, 0], makeMat(0xb7c7c9), 'cold roof');
    addBox(g, [1.1, 1.0, 0.12], [-1.15, 0.68, -1.37], makeMat(0xb8d6e4), 'cold door');
    makeTruck(g, 2.95, -1.95, 0xffffff, 0.15, 0.92);
    addBox(g, [0.35, 0.24, 0.35], [3.12, 0.85, -1.95], makeMat(0x9ed0e0), 'truck snowflake');
  }

  buildIndustry(g) {
    addBox(g, [4.8, 1.95, 3.0], [0, 0.98, 0], makeMat(COLORS.industry), 'industry plant');
    addBox(g, [5.0, 0.36, 3.25], [0, 2.13, 0], makeMat(0x716658), 'factory roof');
    addCylinder(g, 0.42, 3.4, [-2.35, 1.7, 0.95], makeMat(0x5c554f), 18, 'smokestack');
    addBox(g, [1.7, 0.95, 1.4], [2.45, 0.48, -0.55], makeMat(0x9a8d80), 'annex');
    makeTruck(g, 2.8, 1.85, 0xd7d0bd, -0.2, 0.78);
    const pipe = addBox(g, [0.28, 0.22, 2.4], [-1.2, 0.16, 2.65], makeMat(0x5f6660), 'runoff pipe');
    pipe.rotation.y = 0.1;
    for (let i = 0; i < 6; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 9), makeMat(0x8f8b82, { opacity: 0.28 }));
      puff.position.set(-2.35 + (i % 2) * 0.13, 3.4 + i * 0.26, 0.95 + (i % 3) * 0.08);
      puff.userData.smoke = { offset: i / 6 };
      g.add(puff);
      this.animated.push(puff);
    }
  }

  createCapitalLines(params) {
    const source = new THREE.Vector3(31, 0.18, 22);
    params.entities.forEach((entity, i) => {
      const target = new THREE.Vector3(entity.world[0], 0.18, entity.world[2]);
      const mid = new THREE.Vector3().addVectors(source, target).multiplyScalar(0.5);
      mid.y = 1.2;
      const curve = new THREE.QuadraticBezierCurve3(source, mid, target);
      const points = curve.getPoints(28);
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ color: COLORS.token, transparent: true, opacity: 0.0 });
      const line = new THREE.Line(geo, mat);
      line.visible = false;
      line.userData.index = i;
      this.world.add(line);
      this.capitalLines[i] = line;
    });
  }

  createEntityLabel(entity, index) {
    const div = document.createElement('button');
    div.className = 'world-label entity-world-label';
    div.type = 'button';
    div.dataset.index = String(index);
    div.innerHTML = `<strong>${entity.short}</strong><span class="label-metric">offer 0</span>`;
    div.addEventListener('click', e => {
      e.preventDefault();
      this.selectEntity(index);
    });
    this.labelRoot.appendChild(div);
    this.labels.push({ element: div, world: new THREE.Vector3(entity.world[0], 2.9, entity.world[2]), type: 'entity', index });
  }

  createWorldLabel(text, world, kind = '') {
    const div = document.createElement('div');
    div.className = `world-label ${kind}`;
    div.innerHTML = `<strong>${text}</strong>`;
    this.labelRoot.appendChild(div);
    this.labels.push({ element: div, world, type: 'static' });
  }

  handleClick(event) {
    if (!this.down) return;
    const dx = event.clientX - this.down.x;
    const dy = event.clientY - this.down.y;
    this.down = null;
    if (Math.hypot(dx, dy) > 5) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.world.children, true);
    const hit = hits.find(h => Number.isInteger(h.object.userData.entityIndex));
    if (hit) this.selectEntity(hit.object.userData.entityIndex);
  }

  selectEntity(index) {
    this.selectedIndex = index;
    this.onEntitySelect(index);
    this.entityGroups.forEach((g, i) => { g.userData.selected = i === index; });
    this.updateVisualHighlights();
  }

  updateState(next) {
    this.state = { ...this.state, ...next };
    this.updateVisualHighlights();
  }

  updateVisualHighlights() {
    const offers = this.state.offers || [0, 0, 0, 0, 0, 0];
    const lastRun = this.state.lastRun;
    const maxDelta = lastRun ? Math.max(1, ...lastRun.current.deltaK.map(v => Math.abs(v))) : 1;

    this.entityGroups.forEach((g, i) => {
      const offer = offers[i] || 0;
      const ring = this.offerRings[i];
      if (ring) {
        ring.visible = offer > 0 || i === this.selectedIndex;
        const s = 0.55 + Math.sqrt(Math.max(0, offer)) / 6.5;
        ring.scale.setScalar(i === this.selectedIndex ? s * 1.14 : s);
        ring.material.opacity = clamp(0.18 + offer / 120, 0.22, 0.90);
      }

      const line = this.capitalLines[i];
      if (line) {
        line.visible = offer > 0;
        line.material.opacity = clamp(offer / 95, 0.06, 0.48);
      }

      const response = this.responseBars[i];
      if (response) {
        if (lastRun) {
          const dk = lastRun.current.deltaK[i];
          const h = clamp(Math.abs(dk) / maxDelta * 2.7, 0.16, 3.2);
          response.group.visible = true;
          response.bar.geometry.dispose();
          response.bar.geometry = new THREE.CylinderGeometry(0.22, 0.22, h, 18);
          response.bar.position.y = h / 2 + 0.08;
          response.bar.material.color.setHex(dk >= 0 ? COLORS.good : COLORS.bad);
          response.bar.material.opacity = clamp(0.48 + Math.abs(dk) / maxDelta * 0.42, 0.50, 0.92);
        } else {
          response.group.visible = false;
        }
      }

      if (g.userData.selected) {
        g.position.y = lerp(g.position.y, 0.34, 0.28);
      } else {
        g.position.y = lerp(g.position.y, 0, 0.18);
      }
    });

    this.labels.forEach(label => {
      if (label.type === 'entity') {
        const offer = offers[label.index] || 0;
        const dk = lastRun ? lastRun.current.deltaK[label.index] : null;
        label.element.classList.toggle('selected', label.index === this.selectedIndex);
        label.element.innerHTML = `<strong>${this.params.entities[label.index].short}</strong><span class="label-metric">${offer ? `offer ${offer}` : 'set offer'}${dk !== null ? ` · K ${fmtSigned(dk)}` : ''}</span>`;
      }
    });
  }

  updateLabels() {
    const rect = this.renderer.domElement.getBoundingClientRect();
    for (const label of this.labels) {
      const v = label.world.clone();
      if (label.type === 'entity' && this.entityGroups[label.index]) {
        v.y += this.entityGroups[label.index].position.y;
      }
      v.project(this.camera);
      const visible = v.z > -1 && v.z < 1;
      const x = (v.x * 0.5 + 0.5) * rect.width;
      const y = (-v.y * 0.5 + 0.5) * rect.height;
      label.element.style.display = visible ? '' : 'none';
      label.element.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      label.element.style.zIndex = String(Math.round(1000 - v.z * 100));
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const t = this.clock.getElapsedTime();

    if (this.lake) {
      this.lake.material.opacity = 0.80 + Math.sin(t * 0.45) * 0.025;
    }

    for (const obj of this.animated) {
      if (obj.userData.ripple) {
        const phase = (t * 0.055 + obj.userData.ripple.offset) % 1;
        obj.scale.set(1.28 + phase * 0.05, 0.82 + phase * 0.035, 1);
        obj.material.opacity = 0.16 * (1 - phase);
      }
      if (obj.userData.boat) {
        const a = t * 0.12;
        obj.position.set(Math.cos(a) * 6.2, 0.24, Math.sin(a) * 3.55);
        obj.rotation.y = -a + Math.PI / 2;
      }
      if (obj.userData.fish) {
        const f = obj.userData.fish;
        const a = f.angle + t * f.speed;
        obj.position.x = Math.cos(a) * f.radius * 1.22;
        obj.position.z = Math.sin(a) * f.radius * 0.72;
        obj.rotation.y = -a;
      }
      if (obj.userData.smoke) {
        const phase = (t * 0.12 + obj.userData.smoke.offset) % 1;
        obj.position.y = 3.1 + phase * 2.1;
        obj.position.x += Math.sin(t * 0.4 + phase * 4) * 0.0008;
        const s = 0.7 + phase * 1.2;
        obj.scale.setScalar(s);
        obj.material.opacity = 0.22 * (1 - phase);
      }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.updateLabels();
  }
}
