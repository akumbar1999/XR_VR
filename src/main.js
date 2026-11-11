import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import t80Url from '../t-80u_t-80um-2_all_versions__broken_arrow.glb?url';
import bombB28Url from '../b28fi_thermonuclear_bomb.glb?url';
import centauroUrl from '../centauro_2_p_tank_destroyer.glb?url';
import centurionUrl from '../centurion_c-ram_searam__broken_arrow.glb?url';
import fabUrl from '../fab-3000_umpk.glb?url';
import j8Url from '../j-8f_with_gp-250-4.glb?url';
import observerUrl from '../leaked_cameraman_2.0.glb?url';
import leclercUrl from '../leclerc_azur.glb?url';
import hkUrl from '../low-poly_hk_g3.glb?url';
import rdsUrl from '../rds-37_thermonuclear_bomb.glb?url';
import floksUrl from '../2s40_floks__broken_arrow.glb?url';
import './style.css';

const $ = (id) => document.getElementById(id);
const canvas = $('museum-canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111811);
scene.fog = new THREE.FogExp2(0x111811, 0.012);
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 150);
camera.position.set(0, 1.68, 14);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
let renderScale = Math.min(devicePixelRatio, 1.35);
renderer.setPixelRatio(renderScale);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
const controls = new PointerLockControls(camera, document.body);
const clock = new THREE.Clock();
const loader = new GLTFLoader();
const raycaster = new THREE.Raycaster();

const sections = [
  { id: 'armour', title: 'ARMOURED FORCES', short: 'ARMOURED FORCES', x: -31 },
  { id: 'air', title: 'AIR POWER', short: 'AIR POWER', x: -15 },
  { id: 'weapons', title: 'PERSONAL ARMS', short: 'PERSONAL ARMS', x: 0 },
  { id: 'ordnance', title: 'ORDNANCE', short: 'ORDNANCE', x: 15 },
  { id: 'technology', title: 'DEFENCE & FIELD TECH', short: 'DEFENCE & TECH', x: 31 },
];
const exhibits = [
  { file: 't-80u_t-80um-2_all_versions__broken_arrow.glb', name: 'T-80U / T-80UM-2', category: 'ARMOURED FORCES', section: 'armour', x: -34, z: -6, size: 5.6, description: 'A family of Soviet main battle tanks developed for speed, mobility and high-intensity operations. Explore the T-80U and its modernised UM-2 variant.' },
  { file: 'leclerc_azur.glb', name: 'LECLERC AZUR', category: 'ARMOURED FORCES', section: 'armour', x: -28, z: 6, size: 5.4, description: 'The AZUR urban combat configuration of France’s Leclerc main battle tank, adapted with added protection and equipment for operations in built-up terrain.' },
  { file: 'centauro_2_p_tank_destroyer.glb', name: 'CENTAURO II', category: 'ARMOURED FORCES', section: 'armour', x: -22, z: -6, size: 5.2, description: 'An Italian 8×8 wheeled combat vehicle carrying a high-calibre gun. Its design pairs road mobility with the firepower traditionally associated with tracked armour.' },
  { file: '2s40_floks__broken_arrow.glb', name: '2S40 FLOKS', category: 'ARMOURED FORCES', section: 'armour', x: -34, z: 7, size: 4.6, description: 'A wheeled self-propelled artillery system built around a 120 mm mortar-gun. The vehicle combines indirect fire support with the ability to reposition quickly.' },
  { file: 'j-8f_with_gp-250-4.glb', name: 'J-8F INTERCEPTOR', category: 'AIR POWER', section: 'air', x: -15, z: 0, size: 9.4, description: 'A Chinese supersonic interceptor in the J-8II family, shown here carrying GP-250 stores. Its long, twin-engine airframe was designed for high-speed air defence.' },
  { file: 'low-poly_hk_g3.glb', name: 'HECKLER & KOCH G3', category: 'PERSONAL ARMS', section: 'weapons', x: -1, z: -1, size: 2.6, glass: true, description: 'The G3 is a 7.62×51 mm NATO battle rifle developed in Germany and adopted by armed forces around the world. This exhibit presents the rifle as a small-arms artefact.' },
  { file: 'fab-3000_umpk.glb', name: 'FAB-3000 UMPK', category: 'ORDNANCE', section: 'ordnance', x: 11, z: -6, size: 4.8, description: 'A large FAB-3000 aerial bomb shown with a UMPK guidance and glide kit. The kit adds control surfaces and navigation capability to a free-fall bomb body.' },
  { file: 'b28fi_thermonuclear_bomb.glb', name: 'B-28FI', category: 'ORDNANCE', section: 'ordnance', x: 18, z: 6, size: 4.4, description: 'A historical B-28 family nuclear weapon form, represented here as a museum object. The display offers a close view of the external casing and proportions.' },
  { file: 'rds-37_thermonuclear_bomb.glb', name: 'RDS-37', category: 'ORDNANCE', section: 'ordnance', x: 23, z: -6, size: 4.1, description: 'A model of the RDS-37, the Soviet Union’s first two-stage thermonuclear device. Its 1955 test marked a major turning point in the history of nuclear weapons.' },
  { file: 'centurion_c-ram_searam__broken_arrow.glb', name: 'CENTURION / SEA-RAM', category: 'DEFENCE & FIELD TECH', section: 'technology', x: 28, z: -6, size: 5.4, description: 'A close-in defence exhibit pairing the land-based Centurion C-RAM concept with the shipboard SeaRAM family. These systems are designed to counter incoming rockets or aircraft at short range.' },
  { file: 'leaked_cameraman_2.0.glb', name: 'FIELD OBSERVER', category: 'DEFENCE & FIELD TECH', section: 'technology', x: 34, z: 6, size: 4.1, glass: true, description: 'A field-observation figure from the digital collection. The exhibit places a human-scale model alongside the museum’s equipment displays to suggest the people and observation work behind military systems.' },
];
const assetUrls = new Map([
  [exhibits[0].file, t80Url], [exhibits[1].file, leclercUrl], [exhibits[2].file, centauroUrl],
  [exhibits[3].file, floksUrl], [exhibits[4].file, j8Url], [exhibits[5].file, hkUrl],
  [exhibits[6].file, fabUrl], [exhibits[7].file, bombB28Url], [exhibits[8].file, rdsUrl],
  [exhibits[9].file, centurionUrl], [exhibits[10].file, observerUrl],
]);

const mats = {
  floor: new THREE.MeshStandardMaterial({ color: 0x343a34, roughness: 0.76, metalness: 0.24 }),
  wall: new THREE.MeshStandardMaterial({ color: 0x252e27, roughness: 0.84, metalness: 0.12 }),
  trim: new THREE.MeshStandardMaterial({ color: 0x83704c, roughness: 0.42, metalness: 0.7 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x151c17, roughness: 0.64, metalness: 0.34 }),
  plinth: new THREE.MeshStandardMaterial({ color: 0x292f2a, roughness: 0.48, metalness: 0.45 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xb89c67, roughness: 0.4, metalness: 0.55 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xb6c7bc, roughness: 0.08, metalness: 0, transmission: 0.82, transparent: true, opacity: 0.19, thickness: 0.12, depthWrite: false }),
};
const exhibitRoots = new Map();
const exhibitMeshes = [];
const loaded = new Set();
const loading = new Map();
const keys = new Set();
let active = false;
let selected = null;
let selectedBox = null;
let drag = null;
let lastLoadCheck = 0;
let animationId = 0;
let frameSampleMs = 0;
let frameSampleCount = 0;
let adaptiveCheckAt = 0;

function box(parent, w, h, d, x, y, z, material, cast = false, receive = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z); mesh.castShadow = cast; mesh.receiveShadow = receive; parent.add(mesh); return mesh;
}
function addText(parent, text, width, height, x, y, z) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#121914'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#bb9d64'; ctx.fillRect(0, 0, 10, c.height);
  ctx.fillStyle = '#d1b679'; ctx.font = '600 33px Arial'; ctx.letterSpacing = '7px'; ctx.fillText('VIRTUAL ARMY MUSEUM  /  COLLECTION', 45, 67);
  ctx.fillStyle = '#f0eee5'; ctx.font = 'bold 83px Arial'; ctx.letterSpacing = '3px'; ctx.fillText(text.toUpperCase(), 45, 170);
  const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }));
  mesh.position.set(x, y, z); parent.add(mesh); return mesh;
}

function buildArchitecture() {
  const floor = box(scene, 88, .5, 34, 0, -.25, 0, mats.floor, false);
  floor.receiveShadow = true;
  box(scene, 88, .3, .5, 0, -.05, -17, mats.trim);
  box(scene, 88, .3, .5, 0, -.05, 17, mats.trim);
  box(scene, 88, .25, .45, 0, 12.15, -17, mats.trim);
  box(scene, 88, .25, .45, 0, 12.15, 17, mats.trim);
  box(scene, 88, 12, .7, 0, 6, -17, mats.wall);
  // Monumental front opening doubles as the visitor entrance and initial spawn path.
  box(scene, 30, 12, .7, -29, 6, 17, mats.wall);
  box(scene, 30, 12, .7, 29, 6, 17, mats.wall);
  box(scene, 28, .4, 1.2, 0, 11.7, 17, mats.trim);
  box(scene, .7, 12, 34, -44, 6, 0, mats.wall);
  box(scene, .7, 12, 34, 44, 6, 0, mats.wall);
  // Long roof beams and clerestory panels create a civic, hangar-like museum silhouette.
  for (let x = -40; x <= 40; x += 16) {
    box(scene, .28, .38, 34, x, 11.8, 0, mats.trim);
    box(scene, .24, .7, 34, x, 10.8, 0, mats.dark);
    const light = new THREE.PointLight(0xe5d9b6, 125, 20, 1.65);
    light.position.set(x, 10.35, 0); scene.add(light);
    const lum = new THREE.Mesh(new THREE.BoxGeometry(1.25, .12, 4.6), new THREE.MeshBasicMaterial({ color: 0xffedc4 }));
    lum.position.set(x, 11.16, 0); scene.add(lum);
  }
  // Separate collection bays with open central thresholds.
  for (const x of [-23, -7, 9, 25]) {
    box(scene, .28, 6.7, 8, x, 3.35, -13, mats.wall);
    box(scene, .28, 6.7, 8, x, 3.35, 13, mats.wall);
    box(scene, .38, .2, 9, x, 6.8, -13, mats.trim);
    box(scene, .38, .2, 9, x, 6.8, 13, mats.trim);
    const section = sections.reduce((a, b) => Math.abs(b.x - (x - 8)) < Math.abs(a.x - (x - 8)) ? b : a);
    addText(scene, section.title, 8.5, 2.1, x + .4, 5.35, -16.55);
  }
  // Wall reliefs, upper gallery windows, and brass floor inlays.
  for (let x = -39; x <= 39; x += 4) {
    box(scene, .04, 8.8, .05, x, 6.1, -16.58, mats.trim);
    box(scene, .04, 8.8, .05, x, 6.1, 16.58, mats.trim);
    box(scene, 3.5, .025, .08, x, .42, 0, mats.trim, false, false);
  }
  // Central visitor orientation marker.
  const seal = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.8, .04, 64), mats.dark);
  seal.position.set(0, .015, 12); scene.add(seal);
  const sealRing = new THREE.Mesh(new THREE.TorusGeometry(3.2, .035, 8, 64), mats.gold);
  sealRing.rotation.x = Math.PI / 2; sealRing.position.set(0, .05, 12); scene.add(sealRing);
  const hemi = new THREE.HemisphereLight(0xbfcdbf, 0x25291f, 1.35); scene.add(hemi);
  const ambient = new THREE.AmbientLight(0xc1c5ad, .28); scene.add(ambient);
  const keyLight = new THREE.DirectionalLight(0xffe3ad, 2.4);
  keyLight.position.set(-12, 18, 10); keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024); keyLight.shadow.camera.left = -35; keyLight.shadow.camera.right = 35;
  keyLight.shadow.camera.top = 28; keyLight.shadow.camera.bottom = -28; keyLight.shadow.bias = -.0004;
  scene.add(keyLight);
}

function makeExhibit(e) {
  const group = new THREE.Group(); group.position.set(e.x, 0, e.z); group.userData.exhibit = e;
  const radius = e.size * .66;
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.04, .38, 40), mats.plinth);
  platform.position.y = .21; platform.receiveShadow = true; platform.castShadow = true; group.add(platform);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius * .95, .045, 8, 40), mats.gold);
  rim.rotation.x = Math.PI / 2; rim.position.y = .42; group.add(rim);
  box(group, radius * 1.36, .1, radius * 1.36, 0, .47, 0, mats.dark);
  // A restrained light halo brings the plinth forward without heavy real-time spotlights.
  const halo = new THREE.Mesh(new THREE.CylinderGeometry(radius * .9, radius * .95, .035, 40), new THREE.MeshBasicMaterial({ color: 0x8d794e, transparent: true, opacity: .4 }));
  halo.position.y = .535; group.add(halo);
  const contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(radius * 1.6, radius * 1.6), contactShadowMaterial);
  contactShadow.rotation.x = -Math.PI / 2; contactShadow.position.y = .546; group.add(contactShadow);
  if (e.glass) {
    const y = e.size * .43 + .65, w = radius * 1.3, h = y;
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, w));
    const frame = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x8f9a89, transparent: true, opacity: .56 }));
    frame.position.y = .5 + h / 2; group.add(frame);
    const cover = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), mats.glass); cover.position.copy(frame.position); group.add(cover);
  }
  const plaque = new THREE.Group(); plaque.position.set(0, .28, radius * .78); group.add(plaque);
  box(plaque, Math.min(radius * 1.3, 2.8), .42, .09, 0, .35, 0, mats.dark);
  const strip = box(plaque, .045, .3, .1, -Math.min(radius * .65, 1.38), .35, .055, mats.gold, false, false);
  strip.material = mats.gold;
  const labelCanvas = document.createElement('canvas'); labelCanvas.width = 768; labelCanvas.height = 192;
  const labelCtx = labelCanvas.getContext('2d'); labelCtx.fillStyle = '#171e18'; labelCtx.fillRect(0, 0, 768, 192);
  labelCtx.fillStyle = '#d5bb7f'; labelCtx.fillRect(0, 0, 12, 192);
  labelCtx.fillStyle = '#f1eee3'; labelCtx.font = 'bold 54px Arial'; labelCtx.fillText(e.name, 40, 83, 700);
  labelCtx.fillStyle = '#b39b6a'; labelCtx.font = 'bold 23px Arial'; labelCtx.fillText(e.category, 40, 145, 700);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(radius * 1.12, 2.35), .34), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(labelCanvas), side: THREE.DoubleSide }));
  label.material.map.colorSpace = THREE.SRGBColorSpace; label.position.set(0, .35, .055); plaque.add(label);
  const root = new THREE.Group(); root.position.y = .62; group.add(root);
  scene.add(group); exhibitRoots.set(e.file, root); exhibitMeshes.push(platform, coverMesh(group));
  return group;
}
function coverMesh(group) { return group.children.find(o => o.isMesh && o.material === mats.glass) || group.children.find(o => o.geometry?.type === 'CylinderGeometry'); }

function buildExhibits() { exhibits.forEach(makeExhibit); }

function mergeStaticArchitecture() {
  const buckets = new Map();
  for (const mesh of [...scene.children]) {
    if (!mesh.isMesh || mesh.geometry.type !== 'BoxGeometry') continue;
    const key = mesh.material.uuid;
    if (!buckets.has(key)) buckets.set(key, { material: mesh.material, geometries: [] });
    mesh.updateMatrix();
    buckets.get(key).geometries.push(mesh.geometry.clone().applyMatrix4(mesh.matrix));
    scene.remove(mesh); mesh.geometry.dispose();
  }
  for (const { material, geometries } of buckets.values()) {
    const merged = mergeGeometries(geometries, false);
    geometries.forEach(geometry => geometry.dispose());
    if (!merged) continue;
    merged.computeBoundingSphere();
    const mesh = new THREE.Mesh(merged, material); mesh.receiveShadow = true; scene.add(mesh);
  }
}

const contactShadowCanvas = document.createElement('canvas');
contactShadowCanvas.width = contactShadowCanvas.height = 128;
const shadowContext = contactShadowCanvas.getContext('2d');
const shadowGradient = shadowContext.createRadialGradient(64, 64, 3, 64, 64, 62);
shadowGradient.addColorStop(0, 'rgba(0,0,0,0.42)'); shadowGradient.addColorStop(.52, 'rgba(0,0,0,0.2)'); shadowGradient.addColorStop(1, 'rgba(0,0,0,0)');
shadowContext.fillStyle = shadowGradient; shadowContext.fillRect(0, 0, 128, 128);
const contactShadowMaterial = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(contactShadowCanvas), transparent: true, depthWrite: false, toneMapped: false });

function progress(text, percent) {
  $('loading-text').textContent = text;
  $('progress-fill').style.width = `${percent}%`;
}
function loadExhibit(e) {
  if (loaded.has(e.file) || loading.has(e.file)) return loading.get(e.file) || Promise.resolve();
  const root = exhibitRoots.get(e.file);
  const promise = new Promise((resolve) => {
    loader.load(assetUrls.get(e.file), (gltf) => {
      const model = gltf.scene;
      model.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; o.frustumCulled = true; if (Array.isArray(o.material)) o.material.forEach(m => { if (m.map) m.map.colorSpace = THREE.SRGBColorSpace; }); else if (o.material?.map) o.material.map.colorSpace = THREE.SRGBColorSpace; } });
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      model.scale.setScalar(e.size / maxDim);
      const scaled = new THREE.Box3().setFromObject(model);
      const center = scaled.getCenter(new THREE.Vector3());
      model.position.x -= center.x; model.position.z -= center.z; model.position.y -= scaled.min.y;
      root.add(model); root.userData.model = model; root.userData.exhibit = e;
      model.traverse((o) => { if (o.isMesh) { o.userData.exhibit = e; exhibitMeshes.push(o); } });
      loaded.add(e.file); loading.delete(e.file); resolve();
    }, (ev) => {
      if (ev.total && $('loading').classList.contains('hidden') === false) progress(`Loading ${e.name}…`, Math.round(ev.loaded / ev.total * 100));
    }, (error) => {
      console.warn(`Could not load ${e.file}`, error);
      root.userData.failed = true; loading.delete(e.file);
      showToast(`Could not load ${e.name}. The rest of the gallery is available.`); resolve();
    });
  });
  loading.set(e.file, promise); return promise;
}

function setSectionNav() {
  const nav = $('section-nav');
  for (const s of sections) {
    const button = document.createElement('button'); button.className = 'nav-button'; button.textContent = s.short;
    button.addEventListener('click', () => {
      selected = null; $('info-card').classList.add('hidden');
      camera.position.set(s.x, 1.68, 10); camera.rotation.set(0, 0, 0);
      $('location-name').textContent = s.title; updateNav(s.id);
      if (!controls.isLocked) controls.lock(); ensureNearby();
    });
    nav.appendChild(button);
  }
}
function updateNav(id) { document.querySelectorAll('.nav-button').forEach((b, i) => b.classList.toggle('active', sections[i]?.id === id)); }
function showToast(message) {
  const toast = $('toast'); toast.textContent = message; toast.classList.remove('hidden');
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.add('hidden'), 3800);
}

function ensureNearby() {
  const p = camera.position;
  const candidates = exhibits.map(e => ({ e, d: Math.hypot(p.x - e.x, p.z - e.z) })).filter(v => v.d < 20).sort((a, b) => a.d - b.d);
  // Stage just the nearest pair; the next nearest assets stream in as the visitor moves.
  for (const { e } of candidates.slice(0, 2)) loadExhibit(e);
}

function selectExhibit(e) {
  if (!e) return;
  selected = e;
  const group = exhibitRoots.get(e.file);
  if (selectedBox) { scene.remove(selectedBox); selectedBox = null; }
  if (group?.userData.model) { selectedBox = new THREE.BoxHelper(group.userData.model, 0xcdb578); scene.add(selectedBox); }
  $('info-category').textContent = e.category;
  $('info-title').textContent = e.name;
  $('info-description').textContent = e.description;
  $('info-card').classList.remove('hidden');
  controls.unlock(); $('hint').textContent = 'DRAG TO ROTATE THE MODEL · CLICK TO RETURN';
}

function onCanvasClick(event) {
  if (!active) return;
  if (selected && !controls.isLocked) { controls.lock(); return; }
  const rect = canvas.getBoundingClientRect();
  const x = controls.isLocked ? 0 : ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const y = controls.isLocked ? 0 : -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
  const hits = raycaster.intersectObjects(exhibitMeshes, false);
  const e = hits.find(h => h.object.userData.exhibit)?.object.userData.exhibit;
  if (e) selectExhibit(e);
  else if (!controls.isLocked && !selected) controls.lock();
}
canvas.addEventListener('click', onCanvasClick);
canvas.addEventListener('pointerdown', (event) => {
  if (!selected || controls.isLocked || event.button !== 0) return;
  drag = { x: event.clientX, y: event.clientY, moved: false };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (!drag || !selected) return;
  const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
  const root = exhibitRoots.get(selected.file);
  if (root) { root.rotation.y += dx * .009; root.rotation.x = THREE.MathUtils.clamp(root.rotation.x + dy * .004, -.35, .35); }
  drag.x = event.clientX; drag.y = event.clientY;
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  if (!selected) return;
  const root = exhibitRoots.get(selected.file);
  if (root?.userData.model) root.userData.model.scale.multiplyScalar(e.deltaY > 0 ? .94 : 1.06);
  e.preventDefault();
}, { passive: false });

function collided(x, z) {
  if (x < -42 || x > 42 || z < -15.8 || (z > 15.8 && (Math.abs(x) > 6 || z > 23))) return true;
  for (const e of exhibits) {
    // Keep a clear visitor aisle between plinths while preventing walking through display bases.
    if (Math.hypot(x - e.x, z - e.z) < Math.min(e.size * .51, 2.5)) return true;
  }
  for (const xWall of [-23, -7, 9, 25]) {
    if (Math.abs(x - xWall) < .55 && (z < -8.8 || z > 8.8)) return true;
  }
  return false;
}
function tick() {
  animationId = 0;
  if (!active) return;
  animationId = requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), .045);
  if (controls.isLocked && !selected) {
    const speed = 6.1 * dt;
    const old = camera.position.clone();
    if (keys.has('KeyW') || keys.has('ArrowUp')) controls.moveForward(speed);
    if (keys.has('KeyS') || keys.has('ArrowDown')) controls.moveForward(-speed);
    if (keys.has('KeyA') || keys.has('ArrowLeft')) controls.moveRight(-speed);
    if (keys.has('KeyD') || keys.has('ArrowRight')) controls.moveRight(speed);
    if (collided(camera.position.x, camera.position.z)) camera.position.copy(old);
    camera.position.y = 1.68;
    const current = sections.reduce((a, b) => Math.abs(b.x - camera.position.x) < Math.abs(a.x - camera.position.x) ? b : a);
    $('location-name').textContent = current.title; updateNav(current.id);
    if (performance.now() - lastLoadCheck > 800) { lastLoadCheck = performance.now(); ensureNearby(); }
  }
  if (selectedBox) selectedBox.update();
  renderer.render(scene, camera);
  frameSampleMs += dt * 1000; frameSampleCount++;
  const now = performance.now();
  if (frameSampleCount >= 90 && now - adaptiveCheckAt > 1500) {
    const average = frameSampleMs / frameSampleCount;
    const nextScale = average > 21 ? Math.max(.85, renderScale - .12) : average < 15 ? Math.min(Math.min(devicePixelRatio, 1.35), renderScale + .05) : renderScale;
    if (Math.abs(nextScale - renderScale) > .01) {
      renderScale = nextScale; renderer.setPixelRatio(renderScale); renderer.setSize(innerWidth, innerHeight, false);
    }
    frameSampleMs = 0; frameSampleCount = 0; adaptiveCheckAt = now;
  }
}

buildArchitecture(); buildExhibits(); mergeStaticArchitecture(); setSectionNav();
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setPixelRatio(renderScale); renderer.setSize(innerWidth, innerHeight);
});
window.addEventListener('keydown', e => { keys.add(e.code); if (e.code === 'Escape') $('hint').textContent = 'CLICK TO LOOK AROUND · WASD TO MOVE'; });
window.addEventListener('keyup', e => keys.delete(e.code));
controls.addEventListener('lock', () => { $('hint').textContent = 'WASD TO MOVE · CLICK AN EXHIBIT TO INSPECT · ESC TO PAUSE'; });
controls.addEventListener('unlock', () => { if (active && !selected) $('hint').textContent = 'CLICK TO LOOK AROUND · WASD TO MOVE'; });
$('enter-button').addEventListener('click', async () => {
  $('welcome').classList.add('hidden'); $('loading').classList.remove('hidden');
  active = true;
  if (!animationId) tick();
  const initial = [exhibits.find(e => e.file === 'low-poly_hk_g3.glb')];
  progress('Opening the museum…', 4);
  await Promise.all(initial.map(e => loadExhibit(e)));
  progress('Gallery ready', 100);
  setTimeout(() => { $('loading').classList.add('hidden'); $('hud').classList.remove('hidden'); controls.lock(); }, 380);
});
$('help-button').addEventListener('click', () => { controls.unlock(); $('help-modal').classList.remove('hidden'); });
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => { $(b.dataset.close).classList.add('hidden'); if (!selected) controls.lock(); }));
$('close-info').addEventListener('click', () => {
  $('info-card').classList.add('hidden'); selected = null;
  if (selectedBox) scene.remove(selectedBox); selectedBox = null;
  controls.lock(); $('hint').textContent = 'WASD TO MOVE · CLICK AN EXHIBIT TO INSPECT · ESC TO PAUSE';
});
$('exit-button').addEventListener('click', () => {
  controls.unlock(); active = false; if (animationId) cancelAnimationFrame(animationId); animationId = 0; selected = null; $('info-card').classList.add('hidden'); $('hud').classList.add('hidden'); $('welcome').classList.remove('hidden');
});
