import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';
import { createWarRoom, scenarios } from './warRoom.js';
import { MuseumAudio } from './museumAudio.js';
import { MuseumMultiplayer, multiplayerConfigured } from './multiplayer.js';
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
scene.background = new THREE.Color(0x07101b);
scene.fog = new THREE.FogExp2(0x07101b, 0.0105);
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 150);
camera.position.set(0, 1.68, 14);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
let renderScale = Math.min(devicePixelRatio, 1.35);
renderer.setPixelRatio(renderScale);
renderer.setSize(innerWidth, innerHeight);
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
const controls = new PointerLockControls(camera, document.body);
const playerRig = new THREE.Group();
playerRig.add(camera);
scene.add(playerRig);
const vrButton = VRButton.createButton(renderer, { optionalFeatures: ['hand-tracking'] });
vrButton.id = 'VRButton';
vrButton.className = 'icon-button vr-button';
vrButton.setAttribute('aria-label', 'Enter immersive VR');
document.querySelector('.header-vr').append(vrButton);
const arButton = ARButton.createButton(renderer, {
  requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay'], domOverlay: { root: document.body },
});
arButton.id = 'ARButton'; arButton.className = 'icon-button ar-button';
arButton.setAttribute('aria-label', 'Enter immersive augmented reality');
Object.assign(arButton.style, { position: 'relative', bottom: 'auto', left: 'auto', width: 'auto', borderRadius: '0', zIndex: '4', opacity: '1' });
$('ar-enter-slot').append(arButton);
vrButton.addEventListener('click', () => renderer.xr.setReferenceSpaceType('local-floor'), true);
const clock = new THREE.Clock();
const loader = new GLTFLoader();
const raycaster = new THREE.Raycaster();

async function updateVRDiagnostics() {
  const status = $('vr-diagnostic-status');
  const detail = $('vr-diagnostic-detail');
  status.textContent = 'Checking secure context and immersive-vr support…';
  detail.textContent = '';

  if (!window.isSecureContext) {
    status.textContent = 'VR unavailable: this page is not in a secure context.';
    detail.textContent = 'WebXR immersive sessions require HTTPS (or localhost). Open the museum from its HTTPS GitHub Pages address.';
    return;
  }
  if (!navigator.xr || typeof navigator.xr.isSessionSupported !== 'function') {
    status.textContent = 'VR unavailable: this browser does not expose the WebXR API.';
    detail.textContent = 'Use a WebXR-compatible browser on a supported headset, such as Meta Quest Browser on a Quest headset. A desktop browser may expose WebXR while still lacking an immersive VR runtime.';
    return;
  }

  try {
    const supported = await navigator.xr.isSessionSupported('immersive-vr');
    if (supported) {
      status.textContent = 'Immersive VR is available in this browser.';
      detail.textContent = 'Select ENTER VR to request a real immersive-vr session. If the request is rejected, the browser will report that separately.';
    } else {
      status.textContent = 'VR unavailable: the browser reports no immersive-vr session support.';
      detail.textContent = 'This result is common on laptops without a connected headset and active OpenXR/WebXR runtime, and can also reflect browser or platform limitations. It does not prove a project error. Try the HTTPS site in Meta Quest Browser while wearing an awake Quest headset, then recheck.';
    }
  } catch (error) {
    status.textContent = `VR capability check failed${error?.name ? ` (${error.name})` : ''}.`;
    detail.textContent = error?.message || 'The browser could not query its immersive VR runtime. Check browser permissions, headset connection, and runtime availability.';
  }
}

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
  floor: new THREE.MeshStandardMaterial({ color: 0x121e2a, roughness: 0.72, metalness: 0.32 }),
  wall: new THREE.MeshStandardMaterial({ color: 0x101c29, roughness: 0.82, metalness: 0.2 }),
  trim: new THREE.MeshStandardMaterial({ color: 0x36a8c3, emissive: 0x063745, roughness: 0.36, metalness: 0.68 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x08121d, roughness: 0.58, metalness: 0.42 }),
  plinth: new THREE.MeshStandardMaterial({ color: 0x172532, roughness: 0.44, metalness: 0.5 }),
  gold: new THREE.MeshStandardMaterial({ color: 0x55cce3, emissive: 0x062936, roughness: 0.38, metalness: 0.55 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x7beeff, roughness: 0.1, metalness: 0, transmission: 0.74, transparent: true, opacity: 0.15, thickness: 0.1, depthWrite: false }),
};
const exhibitRoots = new Map();
const exhibitMeshes = [];
const loaded = new Set();
const loading = new Map();
const keys = new Set();
const xrControllers = [];
const xrControllerGrips = [];
const xrHands = [];
let active = false;
let selected = null;
let selectedBox = null;
let drag = null;
let fallbackLook = false;
let lastLoadCheck = 0;
let frameSampleMs = 0;
let frameSampleCount = 0;
let adaptiveCheckAt = 0;
let animationRunning = false;
let nextSnapTurnAt = 0;
let vrPanel = null;
let cameraTransition = null;
const animatedHolograms = [];
let introGroup = null;
const missionState = { zones: new Set(), exhibits: new Set(), quizCorrect: 0, quizAnswered: new Set(), activeQuiz: 0, complete: false };
const museumAudio = new MuseumAudio(camera, scene);
const warRoom = createWarRoom(scene);
const arReticle = new THREE.Mesh(new THREE.RingGeometry(.075, .105, 32), new THREE.MeshBasicMaterial({ color: 0x75f3ff, transparent: true, opacity: .92, side: THREE.DoubleSide, toneMapped: false }));
arReticle.name = 'webxr-hit-test-reticle'; arReticle.rotation.x = -Math.PI / 2; arReticle.matrixAutoUpdate = false; arReticle.visible = false; scene.add(arReticle);
const arPlacedRoot = new THREE.Group(); arPlacedRoot.name = 'ar-placed-original-exhibit'; arPlacedRoot.visible = false; scene.add(arPlacedRoot);
const arRuntime = { active: false, hitTestSource: null, session: null, selectedFile: exhibits[5].file, hiddenObjects: null, previousBackground: null, previousFog: null, previousAlpha: 1, previousCameraPosition: null, previousCameraQuaternion: null, placed: false };
const remoteVisitors = new Map();
let multiplayerConnected = false;
let speechRecognizer = null;
let recognitionStartTimer = null;
let activeUtterance = null;
let scenarioTimer = null;
let scenarioPlaying = false;
const missionQuestions = [
  { question: 'Which exhibit is identified as a Chinese supersonic interceptor?', answers: ['J-8F Interceptor', 'Leclerc AZUR', '2S40 Floks'], correct: 0 },
  { question: 'The G3 in this collection is an example of what?', answers: ['A wheeled artillery vehicle', 'A 7.62×51 mm NATO battle rifle', 'A fighter aircraft'], correct: 1 },
  { question: 'In what year was the RDS-37 tested?', answers: ['1945', '1955', '1965'], correct: 1 },
];
const timelineData = [
  { year: '1914', title: 'First World War begins', section: 'armour', detail: 'The First World War began in Europe in 1914 and expanded into a global conflict. Industrial production and mechanized transport reshaped how armies moved and fought.' },
  { year: '1939', title: 'Second World War begins', section: 'air', detail: 'The Second World War began in 1939. It became a global conflict involving large-scale advances in aviation, armoured vehicles, radar and communications.' },
  { year: '1945', title: 'Second World War ends', section: 'technology', detail: 'The Second World War ended in 1945. The postwar period brought major changes to international institutions, military alliances and defence technology.' },
  { year: '1955', title: 'RDS-37 test', section: 'ordnance', detail: 'The Soviet Union tested RDS-37 in 1955. This exhibit is part of the museum’s ordnance collection and represents the history of nuclear weapons.' },
  { year: '1955', title: 'Warsaw Pact formed', section: 'armour', detail: 'The Warsaw Pact was established in 1955 as a military alliance of the Soviet Union and several Eastern European states.' },
  { year: '1957', title: 'Sputnik 1 launched', section: 'air', detail: 'Sputnik 1, the first artificial Earth satellite, was launched by the Soviet Union in 1957, beginning the space age and accelerating the space race.' },
  { year: '1989', title: 'Berlin Wall opens', section: 'technology', detail: 'The Berlin Wall opened in November 1989, a major event in the political changes that transformed Europe at the end of the Cold War.' },
  { year: '1991', title: 'Soviet Union dissolves', section: 'armour', detail: 'The Soviet Union dissolved in 1991. The T-80 family in the armoured collection was developed during the Soviet era.' },
];

function box(parent, w, h, d, x, y, z, material, cast = false, receive = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z); mesh.castShadow = cast; mesh.receiveShadow = receive; parent.add(mesh); return mesh;
}
function addText(parent, text, width, height, x, y, z, collectionNumber) {
  const c = document.createElement('canvas'); c.width = 1536; c.height = 320;
  const ctx = c.getContext('2d');
  const background = ctx.createLinearGradient(0, 0, c.width, c.height);
  background.addColorStop(0, '#07131d'); background.addColorStop(1, '#101e29');
  ctx.fillStyle = background; ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = 'rgba(96,222,241,.62)'; ctx.lineWidth = 3; ctx.strokeRect(2, 2, c.width - 4, c.height - 4);
  ctx.fillStyle = '#bb9d64'; ctx.fillRect(0, 0, 13, c.height);
  ctx.fillStyle = '#69d9ec'; ctx.font = '600 34px Arial'; ctx.letterSpacing = '6px';
  ctx.textAlign = 'left'; ctx.fillText(`VIRTUAL DEFENCE MUSEUM  /  COLLECTION ${String(collectionNumber).padStart(2, '0')}`, 58, 88, c.width - 116);
  ctx.fillStyle = '#f0f8fa'; ctx.font = '700 118px Arial'; ctx.letterSpacing = '2px'; ctx.textAlign = 'center';
  ctx.fillText(text.toUpperCase(), c.width / 2, 244, c.width - 150);
  const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }));
  mesh.name = `collection-sign-${collectionNumber}`;
  mesh.userData.collectionTitle = text;
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
    const light = new THREE.PointLight(0x55dfff, 92, 20, 1.65);
    light.position.set(x, 10.35, 0); scene.add(light);
    const lum = new THREE.Mesh(new THREE.BoxGeometry(1.25, .12, 4.6), new THREE.MeshBasicMaterial({ color: 0x73edff }));
    lum.position.set(x, 11.16, 0); scene.add(lum);
  }
  // Separate collection bays with open central thresholds.
  for (const x of [-23, -7, 9, 25]) {
    box(scene, .28, 6.7, 8, x, 3.35, -13, mats.wall);
    box(scene, .28, 6.7, 8, x, 3.35, 13, mats.wall);
    box(scene, .38, .2, 9, x, 6.8, -13, mats.trim);
    box(scene, .38, .2, 9, x, 6.8, 13, mats.trim);
  }
  // Place each name in the center of its own bay, clear of the divider supports.
  sections.forEach((section, index) => {
    addText(scene, section.title, 11.2, 2.45, section.x, 5.55, -16.32, index + 1);
  });
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
  const hemi = new THREE.HemisphereLight(0x9deaff, 0x101624, 1.1); scene.add(hemi);
  const ambient = new THREE.AmbientLight(0x8fb9d0, .3); scene.add(ambient);
  const keyLight = new THREE.DirectionalLight(0xb5eaff, 1.8);
  keyLight.position.set(-12, 18, 10); keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024); keyLight.shadow.camera.left = -35; keyLight.shadow.camera.right = 35;
  keyLight.shadow.camera.top = 28; keyLight.shadow.camera.bottom = -28; keyLight.shadow.bias = -.0004;
  scene.add(keyLight);
}

function makeExhibit(e) {
  const group = new THREE.Group(); group.position.set(e.x, 0, e.z); group.userData.exhibit = e;
  const radius = e.size * .66;
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.04, .38, 40), mats.plinth);
  platform.userData.exhibit = e;
  platform.position.y = .21; platform.receiveShadow = true; platform.castShadow = true; group.add(platform);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius * .95, .045, 8, 40), mats.gold);
  rim.rotation.x = Math.PI / 2; rim.position.y = .42; group.add(rim);
  box(group, radius * 1.36, .1, radius * 1.36, 0, .47, 0, mats.dark);
  // A restrained light halo brings the plinth forward without heavy real-time spotlights.
  const halo = new THREE.Mesh(new THREE.CylinderGeometry(radius * .9, radius * .95, .035, 40), new THREE.MeshBasicMaterial({ color: 0x8d794e, transparent: true, opacity: .4 }));
  halo.position.y = .535; group.add(halo);
  const holoRing = new THREE.Mesh(new THREE.TorusGeometry(radius * .88, .018, 6, 48), new THREE.MeshBasicMaterial({ color: 0x65eaff, transparent: true, opacity: .62, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  holoRing.rotation.x = Math.PI / 2; holoRing.position.y = .57; group.add(holoRing);
  const holoCore = new THREE.Mesh(new THREE.CylinderGeometry(radius * .78, radius * .78, .012, 40), new THREE.MeshBasicMaterial({ color: 0x35cce8, transparent: true, opacity: .035, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  holoCore.position.y = .55; group.add(holoCore);
  animatedHolograms.push({ ring: holoRing, core: holoCore, phase: Math.random() * Math.PI * 2 });
  const contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(radius * 1.6, radius * 1.6), contactShadowMaterial);
  contactShadow.rotation.x = -Math.PI / 2; contactShadow.position.y = .546; group.add(contactShadow);
  if (e.glass) {
    const y = e.size * .43 + .65, w = radius * 1.3, h = y;
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, w));
    const frame = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x8f9a89, transparent: true, opacity: .56 }));
    frame.position.y = .5 + h / 2; group.add(frame);
    const cover = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), mats.glass); cover.position.copy(frame.position); group.add(cover);
    cover.userData.exhibit = e;
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

function createVRInfoPanel() {
  vrPanel = new THREE.Group();
  const background = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 1.22), new THREE.MeshBasicMaterial({ color: 0x111a13, transparent: true, opacity: .94, side: THREE.DoubleSide }));
  background.position.z = -.015; vrPanel.add(background);
  const textCanvas = document.createElement('canvas'); textCanvas.width = 1024; textCanvas.height = 560;
  const texture = new THREE.CanvasTexture(textCanvas); texture.colorSpace = THREE.SRGBColorSpace;
  const text = new THREE.Mesh(new THREE.PlaneGeometry(2.12, 1.1), new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide }));
  text.position.z = .005; vrPanel.add(text);
  vrPanel.userData.canvas = textCanvas; vrPanel.userData.texture = texture;
  vrPanel.visible = false; scene.add(vrPanel);
}

function updateVRInfoPanel(exhibit) {
  if (!vrPanel) return;
  const ctx = vrPanel.userData.canvas.getContext('2d');
  ctx.clearRect(0, 0, 1024, 560);
  ctx.fillStyle = '#c5a566'; ctx.fillRect(0, 0, 9, 560);
  ctx.fillStyle = '#c5a566'; ctx.font = '700 25px Arial'; ctx.fillText(exhibit.category, 42, 66);
  ctx.fillStyle = '#f2f0e7'; ctx.font = '700 48px Arial'; ctx.fillText(exhibit.name, 42, 132, 930);
  ctx.fillStyle = '#c4cbbf'; ctx.font = '30px Arial';
  const words = exhibit.description.split(' '); let line = ''; let y = 194;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > 925 && line) { ctx.fillText(line, 42, y); line = word; y += 44; }
    else line = next;
  }
  if (line && y < 530) ctx.fillText(line, 42, y);
  ctx.fillStyle = '#d0b87f'; ctx.font = '700 22px Arial'; ctx.fillText('HOLD TRIGGER + MOVE TO ROTATE · TRIGGER TO SELECT', 42, 535);
  vrPanel.userData.texture.needsUpdate = true;
  vrPanel.visible = renderer.xr.isPresenting;
}

function getVisitorPosition(target = new THREE.Vector3()) {
  if (renderer.xr.isPresenting) return renderer.xr.getCamera(camera).getWorldPosition(target);
  return camera.getWorldPosition(target);
}

function setupXRControllers() {
  const rayGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
  const controllerModelFactory = new XRControllerModelFactory();
  const handModelFactory = new XRHandModelFactory();
  for (let index = 0; index < 2; index++) {
    const controller = renderer.xr.getController(index);
    const grip = renderer.xr.getControllerGrip(index);
    const hand = renderer.xr.getHand(index);
    const ray = new THREE.Line(rayGeometry, new THREE.LineBasicMaterial({ color: 0xd9bd7b, transparent: true, opacity: .88 }));
    ray.name = 'controller-ray'; ray.scale.z = 12; controller.add(ray); controller.visible = false;
    grip.name = `tracked-controller-grip-${index}`; grip.visible = false;
    grip.add(controllerModelFactory.createControllerModel(grip));
    grip.addEventListener('connected', event => {
      grip.userData.connected = event.data.targetRayMode === 'tracked-pointer' && !event.data.hand;
      grip.userData.handedness = event.data.handedness;
      grip.visible = grip.userData.connected;
    });
    grip.addEventListener('disconnected', () => { grip.userData.connected = false; grip.visible = false; });
    hand.name = `tracked-hand-${index}`; hand.visible = false;
    const handModel = handModelFactory.createHandModel(hand, 'spheres');
    hand.add(handModel);
    hand.addEventListener('connected', event => {
      hand.userData.hasTrackedHand = !!event.data.hand;
      hand.visible = hand.userData.hasTrackedHand;
      if (hand.userData.hasTrackedHand) handModel.traverse(object => {
        if (!object.isInstancedMesh) return;
        object.material.color.set(0xd3a18b);
        object.material.roughness = .78;
        object.material.metalness = 0;
      });
    });
    hand.addEventListener('disconnected', () => { hand.userData.hasTrackedHand = false; hand.visible = false; });
    controller.addEventListener('connected', event => { controller.userData.handedness = event.data.handedness; });
    controller.addEventListener('disconnected', () => { controller.userData.handedness = null; });
    controller.addEventListener('select', () => selectFromController(controller));
    controller.addEventListener('selectstart', () => {
      if (!renderer.xr.isPresenting || !selected) return;
      controller.userData.rotatingFile = selected.file;
      controller.userData.rotationMoved = false;
      controller.userData.previousRotation = controller.getWorldQuaternion(new THREE.Quaternion());
    });
    controller.addEventListener('selectend', () => {
      controller.userData.suppressNextSelection = !!controller.userData.rotationMoved;
      controller.userData.rotatingFile = null;
    });
    scene.add(controller, grip, hand);
    xrControllers.push(controller); xrControllerGrips.push(grip); xrHands.push(hand);
  }
}

function selectFromController(controller) {
  if (arRuntime.active) { placeARExhibit(); return; }
  if (controller.userData.suppressNextSelection) { controller.userData.suppressNextSelection = false; return; }
  controller.updateMatrixWorld(true);
  const origin = new THREE.Vector3().setFromMatrixPosition(controller.matrixWorld);
  const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(controller.getWorldQuaternion(new THREE.Quaternion())).normalize();
  raycaster.ray.set(origin, direction); raycaster.near = .05; raycaster.far = 18;
  const hits = raycaster.intersectObjects(exhibitMeshes, false);
  const exhibit = hits.find(hit => hit.object.userData.exhibit)?.object.userData.exhibit;
  if (exhibit) { selectExhibit(exhibit); return; }
  // Point at open floor and press the trigger to teleport the XR rig.
  const floorPoint = new THREE.Vector3();
  const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  if (raycaster.ray.direction.y < -.12 && raycaster.ray.intersectPlane(floor, floorPoint)) {
    const visitorX = floorPoint.x, visitorZ = floorPoint.z;
    if (raycaster.ray.origin.distanceTo(floorPoint) <= 18 && !collided(visitorX, visitorZ)) {
      playerRig.position.set(visitorX, 0, visitorZ);
      clearSelection();
      showToast('TELEPORTED · POINT AT THE FLOOR TO MOVE');
      return;
    }
  }
  if (selected) clearSelection();
}

async function loadARModel(file = arRuntime.selectedFile) {
  const exhibit = exhibits.find(item => item.file === file);
  if (!exhibit) return false;
  arRuntime.selectedFile = exhibit.file;
  $('ar-model-status').dataset.state = 'connecting';
  $('ar-model-status').textContent = `Preparing ${exhibit.name}…`;
  await loadExhibit(exhibit);
  const root = exhibitRoots.get(exhibit.file);
  if (!root?.userData.model) {
    $('ar-model-status').dataset.state = 'error';
    $('ar-model-status').textContent = `Could not load ${exhibit.name}. Choose another existing museum model.`;
    return false;
  }
  $('ar-model-status').dataset.state = 'connected';
  $('ar-model-status').textContent = `${exhibit.name} is ready. Enter AR, aim at a surface, then place it.`;
  return true;
}

async function updateARSupport() {
  const status = $('ar-diagnostic-status');
  status.dataset.state = '';
  if (!window.isSecureContext) { status.dataset.state = 'error'; status.textContent = 'AR unavailable: WebXR requires HTTPS or localhost.'; return; }
  if (!navigator.xr?.isSessionSupported) { status.dataset.state = 'error'; status.textContent = 'This browser does not expose the WebXR API.'; return; }
  try {
    const supported = await navigator.xr.isSessionSupported('immersive-ar');
    status.dataset.state = supported ? 'connected' : 'setup';
    status.textContent = supported
      ? 'This browser reports immersive-ar support. The ARButton also requests the required hit-test feature.'
      : 'This browser reports immersive-ar is unavailable. AR needs a compatible mobile/headset browser and hit-test support; VR and desktop modes remain available.';
  } catch (error) {
    status.dataset.state = 'error';
    status.textContent = `AR support check failed${error?.name ? ` (${error.name})` : ''}: ${error?.message || 'the browser could not query its AR runtime.'}`;
  }
}

function beginARPresentation(session) {
  arRuntime.active = true; arRuntime.session = session; arRuntime.placed = false;
  arRuntime.previousBackground = scene.background; arRuntime.previousFog = scene.fog; arRuntime.previousAlpha = renderer.getClearAlpha();
  arRuntime.previousCameraPosition = camera.position.clone(); arRuntime.previousCameraQuaternion = camera.quaternion.clone();
  camera.position.set(0, 0, 0); camera.rotation.set(0, 0, 0); playerRig.position.set(0, 0, 0); playerRig.rotation.set(0, 0, 0);
  const keepVisible = new Set([playerRig, arReticle, arPlacedRoot, ...xrControllers, ...xrControllerGrips, ...xrHands]);
  arRuntime.hiddenObjects = scene.children.map(object => ({ object, visible: object.visible })).filter(({ object }) => !keepVisible.has(object));
  arRuntime.hiddenObjects.forEach(({ object }) => { object.visible = false; });
  xrControllers.forEach(controller => { controller.visible = true; });
  xrControllerGrips.forEach(grip => { grip.visible = !!grip.userData.connected; });
  xrHands.forEach(hand => { hand.visible = !!hand.userData.hasTrackedHand; });
  scene.background = null; scene.fog = null; renderer.setClearAlpha(0);
  arRootVisibility(true);
  document.body.classList.add('ar-active');
  $('ar-diagnostic-status').textContent = 'AR session active. Move the device to scan a surface; place the model with the button or a controller trigger.';
  $('ar-place-button').disabled = true;
  session.requestReferenceSpace('viewer')
    .then(viewerSpace => session.requestHitTestSource({ space: viewerSpace }))
    .then(source => { arRuntime.hitTestSource = source; })
    .catch(error => {
      $('ar-diagnostic-status').dataset.state = 'error';
      $('ar-diagnostic-status').textContent = `Surface scanning failed${error?.name ? ` (${error.name})` : ''}. This device may not expose WebXR hit-test.`;
    });
}

function arRootVisibility(visible) {
  arReticle.visible = false; arPlacedRoot.visible = !!visible && arRuntime.placed;
}

function updateARFrame(xrFrame) {
  if (!xrFrame || !arRuntime.hitTestSource) return;
  const referenceSpace = renderer.xr.getReferenceSpace();
  if (!referenceSpace) return;
  const hit = xrFrame.getHitTestResults(arRuntime.hitTestSource)[0];
  if (!hit) { arReticle.visible = false; $('ar-place-button').disabled = true; return; }
  const pose = hit.getPose(referenceSpace);
  if (!pose) return;
  arReticle.matrix.fromArray(pose.transform.matrix);
  arReticle.matrixWorldNeedsUpdate = true; arReticle.visible = true;
  $('ar-place-button').disabled = false;
}

function placeARExhibit() {
  if (!arRuntime.active || !arReticle.visible) {
    showToast('MOVE THE DEVICE TO FIND A PLACEABLE SURFACE'); return;
  }
  const exhibit = exhibits.find(item => item.file === arRuntime.selectedFile);
  const source = exhibit && exhibitRoots.get(exhibit.file)?.userData.model;
  if (!source) { showToast('WAIT FOR THE SELECTED EXHIBIT TO FINISH LOADING'); return; }
  arPlacedRoot.clear();
  const placedModel = source.clone(true);
  placedModel.scale.multiplyScalar(Math.min(1, 1.35 / exhibit.size));
  placedModel.traverse(object => { if (object.isMesh) { object.castShadow = false; object.receiveShadow = false; } });
  arPlacedRoot.add(placedModel);
  arReticle.updateMatrixWorld(true);
  arReticle.matrixWorld.decompose(arPlacedRoot.position, arPlacedRoot.quaternion, new THREE.Vector3());
  arRootVisibility(true); arRuntime.placed = true; arPlacedRoot.visible = true;
  $('ar-diagnostic-status').textContent = `${exhibit.name} placed. Move to scan another surface, then place again to reposition it.`;
}

function restoreARPresentation() {
  arRuntime.hitTestSource?.cancel(); arRuntime.hitTestSource = null; arRuntime.session = null;
  arRuntime.active = false; arRuntime.placed = false; arPlacedRoot.clear();
  arRootVisibility(false);
  for (const { object, visible } of arRuntime.hiddenObjects || []) object.visible = visible;
  arRuntime.hiddenObjects = null;
  scene.background = arRuntime.previousBackground; scene.fog = arRuntime.previousFog;
  renderer.setClearAlpha(arRuntime.previousAlpha ?? 1);
  if (arRuntime.previousCameraPosition) camera.position.copy(arRuntime.previousCameraPosition);
  if (arRuntime.previousCameraQuaternion) camera.quaternion.copy(arRuntime.previousCameraQuaternion);
  arRuntime.previousCameraPosition = null; arRuntime.previousCameraQuaternion = null;
  renderer.xr.setReferenceSpaceType('local-floor');
  document.body.classList.remove('ar-active');
}

function createRemoteVisitor(visitor) {
  const group = new THREE.Group(); group.name = `visitor-${visitor.id}`;
  const uniform = new THREE.MeshBasicMaterial({ color: 0x5deaff, transparent: true, opacity: .82, toneMapped: false });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.2, .62, 3, 8), uniform); body.position.y = .58; group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.18, 10, 8), new THREE.MeshBasicMaterial({ color: 0xb0f8ff, toneMapped: false })); head.position.y = 1.08; group.add(head);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.32, .018, 5, 24), new THREE.MeshBasicMaterial({ color: 0x5deaff, transparent: true, opacity: .65, toneMapped: false }));
  ring.rotation.x = Math.PI / 2; ring.position.y = .05; group.add(ring);
  const labelCanvas = document.createElement('canvas'); labelCanvas.width = 512; labelCanvas.height = 96;
  const ctx = labelCanvas.getContext('2d'); ctx.fillStyle = '#061522dd'; ctx.fillRect(4, 8, 504, 80);
  ctx.strokeStyle = '#5deaff'; ctx.strokeRect(5, 9, 502, 78);
  ctx.fillStyle = '#dffaff'; ctx.font = '600 40px Arial'; ctx.textAlign = 'center'; ctx.fillText(String(visitor.name || 'Visitor').slice(0, 20), 256, 62);
  const labelTexture = new THREE.CanvasTexture(labelCanvas); labelTexture.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture, transparent: true, depthWrite: false }));
  label.position.y = 1.52; label.scale.set(1.55, .3, 1); group.add(label);
  group.userData.target = new THREE.Vector3(Number(visitor.x) || 0, 0, Number(visitor.z) || 0);
  group.userData.yaw = Number(visitor.yaw) || 0;
  group.userData.visitorId = visitor.id;
  group.position.copy(group.userData.target); group.rotation.y = group.userData.yaw;
  scene.add(group); remoteVisitors.set(visitor.id, group); return group;
}

function syncRemoteVisitors(visitors) {
  const known = new Set(visitors.map(visitor => visitor.id));
  for (const [id, avatar] of remoteVisitors) {
    if (!known.has(id)) {
      scene.remove(avatar);
      avatar.traverse(node => {
        node.geometry?.dispose();
        if (Array.isArray(node.material)) node.material.forEach(material => { material.map?.dispose(); material.dispose(); });
        else if (node.material) { node.material.map?.dispose(); node.material.dispose(); }
      });
      remoteVisitors.delete(id);
    }
  }
  visitors.forEach(visitor => { if (!remoteVisitors.has(visitor.id)) createRemoteVisitor(visitor); });
  $('multiplayer-count').textContent = `${Math.max(0, visitors.length + (multiplayerConnected ? 1 : 0))} ${visitors.length + (multiplayerConnected ? 1 : 0) === 1 ? 'visitor' : 'visitors'}`;
}

function receiveVisitorPose(payload) {
  if (!payload || typeof payload.id !== 'string' || payload.id.length > 80) return;
  const x = Number(payload.x), z = Number(payload.z), yaw = Number(payload.yaw);
  if (![x, z, yaw].every(Number.isFinite) || Math.abs(x) > 44 || Math.abs(z) > 24) return;
  const avatar = remoteVisitors.get(payload.id) || createRemoteVisitor(payload);
  avatar.userData.target.set(x, 0, z);
  avatar.userData.yaw = yaw;
}

const multiplayer = new MuseumMultiplayer({
  onVisitors: syncRemoteVisitors,
  onPose: receiveVisitorPose,
  onStatus: (state, message) => {
    $('multiplayer-status').dataset.state = state;
    $('multiplayer-status').textContent = message;
  },
});

function updateAudioStatus(message, state = '') {
  $('audio-status').dataset.state = state;
  $('audio-status').textContent = message;
}

function speakMuseumText(text) {
  if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
    $('guide-voice-status').textContent = 'Spoken narration is unavailable in this browser.';
    showToast('SPOKEN NARRATION IS NOT AVAILABLE IN THIS BROWSER'); return false;
  }
  activeUtterance = null;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  activeUtterance = utterance;
  utterance.rate = .95; utterance.pitch = 1.02; utterance.lang = document.documentElement.lang || 'en-US';
  utterance.onstart = () => {
    $('guide-speak').textContent = '■ STOP NARRATION';
    $('guide-voice-status').textContent = 'Speaking the guide response…';
  };
  utterance.onend = () => {
    if (activeUtterance !== utterance) return;
    activeUtterance = null; $('guide-speak').textContent = '◖ NARRATE';
    if (!$('guide-modal').classList.contains('hidden')) $('guide-voice-status').textContent = 'Ready for another question.';
  };
  utterance.onerror = event => {
    if (activeUtterance !== utterance) return;
    activeUtterance = null; $('guide-speak').textContent = '◖ NARRATE';
    $('guide-voice-status').textContent = `Spoken response failed (${event.error || 'speech unavailable'}).`;
  };
  speechSynthesis.speak(utterance); return true;
}

function stopMuseumSpeech() {
  activeUtterance = null;
  window.speechSynthesis?.cancel?.();
  $('guide-speak').textContent = '◖ NARRATE';
}

function handleVoiceQuestion(question) {
  const answer = guideResponse(question);
  $('guide-answer').textContent = answer;
  $('guide-voice-status').textContent = `Heard: “${question}”`;
  speakMuseumText(answer);
}

function toggleGuideRecognition() {
  if (speechRecognizer) {
    const recognition = speechRecognizer;
    speechRecognizer = null;
    window.clearTimeout(recognitionStartTimer);
    recognitionStartTimer = null;
    try { recognition.stop(); } catch { /* Recognition may have ended between clicks. */ }
    $('guide-listen').textContent = '◉ ASK BY VOICE';
    $('guide-listen').setAttribute('aria-pressed', 'false');
    $('guide-voice-status').textContent = 'Voice input stopped.';
    return;
  }
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    $('guide-voice-status').textContent = 'Voice input is unavailable in this browser. Try Chrome or Edge, allow microphone access, or type your question below. Narration can still read answers aloud.';
    return;
  }
  const recognition = new Recognition();
  speechRecognizer = recognition;
  recognition.lang = 'en-US'; recognition.continuous = false; recognition.interimResults = true; recognition.maxAlternatives = 1;
  recognition.onstart = () => {
    window.clearTimeout(recognitionStartTimer);
    recognitionStartTimer = null;
    $('guide-listen').textContent = 'STOP LISTENING';
    $('guide-listen').setAttribute('aria-pressed', 'true');
    $('guide-voice-status').textContent = 'Listening… ask about an exhibit, controls, history, or missions.';
  };
  recognition.onresult = event => {
    const result = event.results?.[event.resultIndex] || event.results?.[event.results.length - 1];
    const transcript = result?.[0]?.transcript?.trim();
    if (!transcript) return;
    if (result.isFinal) handleVoiceQuestion(transcript);
    else $('guide-voice-status').textContent = `Hearing: “${transcript}”`;
  };
  recognition.onerror = event => {
    window.clearTimeout(recognitionStartTimer);
    recognitionStartTimer = null;
    const messages = {
      'not-allowed': 'Microphone or speech access was denied. Allow microphone access for this site, then click ASK BY VOICE again.',
      'service-not-allowed': 'This browser blocked its speech service. Try Chrome or Edge, or type your question below.',
      'audio-capture': 'No microphone was found. Connect or enable a microphone, then try again.',
      network: 'The browser speech service could not connect. Check your connection and try again.',
      'no-speech': 'No speech was detected. Click ASK BY VOICE and try again.',
      aborted: 'Voice input stopped.',
    };
    $('guide-voice-status').textContent = messages[event.error] || `Voice input failed (${event.error || 'unknown error'}). Try again or type your question.`;
    $('guide-listen').textContent = '◉ ASK BY VOICE';
    $('guide-listen').setAttribute('aria-pressed', 'false');
  };
  recognition.onend = () => {
    window.clearTimeout(recognitionStartTimer);
    recognitionStartTimer = null;
    if (speechRecognizer === recognition) speechRecognizer = null;
    $('guide-listen').textContent = '◉ ASK BY VOICE';
    $('guide-listen').setAttribute('aria-pressed', 'false');
    const status = $('guide-voice-status').textContent;
    if (status.startsWith('Listening…') || status.startsWith('Hearing:')) {
      $('guide-voice-status').textContent = 'No complete question was captured. Click ASK BY VOICE and try again.';
    }
  };
  $('guide-voice-status').textContent = 'Starting voice input…';
  $('guide-listen').textContent = 'CANCEL VOICE START';
  $('guide-listen').setAttribute('aria-pressed', 'true');
  try {
    recognition.start();
    // Some browser runtimes silently leave recognition pending if microphone
    // permission or the network speech service is blocked. Never leave the UI
    // stuck on a spinner-like state in that case.
    recognitionStartTimer = window.setTimeout(() => {
      if (speechRecognizer !== recognition) return;
      $('guide-voice-status').textContent = 'The browser has not started listening. Check this site’s microphone permission and speech service, then try again. You can also type a question below.';
      $('guide-listen').textContent = 'CANCEL VOICE START';
    }, 4000);
  }
  catch (error) {
    window.clearTimeout(recognitionStartTimer);
    recognitionStartTimer = null;
    speechRecognizer = null;
    $('guide-listen').textContent = '◉ ASK BY VOICE';
    $('guide-listen').setAttribute('aria-pressed', 'false');
    $('guide-voice-status').textContent = `Could not start microphone input (${error?.name || 'browser error'}). Check site permissions and try again.`;
  }
}

function updateXRModelRotation() {
  for (const controller of xrControllers) {
    const file = controller.userData.rotatingFile;
    if (!file) continue;
    const root = exhibitRoots.get(file);
    if (!root) continue;
    const current = controller.getWorldQuaternion(new THREE.Quaternion());
    const delta = current.clone().multiply(controller.userData.previousRotation.clone().invert());
    const rotation = new THREE.Euler().setFromQuaternion(delta, 'YXZ');
    if (Math.abs(rotation.x) + Math.abs(rotation.y) > .003) controller.userData.rotationMoved = true;
    root.rotation.y -= rotation.y;
    root.rotation.x = THREE.MathUtils.clamp(root.rotation.x + rotation.x, -.35, .35);
    controller.userData.previousRotation.copy(current);
  }
}

function applyVRMovement(dt) {
  const session = renderer.xr.getSession();
  if (!session) return;
  const forward = renderer.xr.getCamera(camera).getWorldDirection(new THREE.Vector3());
  forward.y = 0; if (forward.lengthSq() < .001) return; forward.normalize();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  const deadzone = value => Math.abs(value) < .16 ? 0 : Math.sign(value) * (Math.abs(value) - .16) / .84;
  let moveX = 0, moveY = 0, turn = 0;
  for (const source of session.inputSources) {
    const pad = source.gamepad;
    if (!pad) continue;
    const axisX = deadzone(pad.axes[pad.axes.length >= 4 ? 2 : 0] ?? 0);
    const axisY = deadzone(pad.axes[pad.axes.length >= 4 ? 3 : 1] ?? 0);
    if (source.handedness === 'left') { moveX = axisX; moveY = axisY; }
    if (source.handedness === 'right') turn = axisX;
  }
  const speed = 2.35 * dt;
  const delta = right.multiplyScalar(moveX * speed).addScaledVector(forward, -moveY * speed);
  const candidateX = playerRig.position.x + delta.x, candidateZ = playerRig.position.z + delta.z;
  if (!collided(candidateX, candidateZ)) playerRig.position.add(delta);
  const now = performance.now();
  if (Math.abs(turn) > .72 && now > nextSnapTurnAt) {
    playerRig.rotation.y -= Math.sign(turn) * Math.PI / 6;
    nextSnapTurnAt = now + 520;
  }
}

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
      clearSelection();
      const pathClear = (x1, z1, x2, z2) => {
        const steps = Math.max(1, Math.ceil(Math.hypot(x2 - x1, z2 - z1) / .65));
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          if (collided(THREE.MathUtils.lerp(x1, x2, t), THREE.MathUtils.lerp(z1, z2, t))) return false;
        }
        return true;
      };
      let route = null;
      for (const offset of [0, -3, 3, -5, 5, -8, 8, -11, 11]) {
        const midX = camera.position.x + offset;
        for (const aisleZ of [3, -3]) {
          if (pathClear(camera.position.x, camera.position.z, midX, camera.position.z)
            && pathClear(midX, camera.position.z, midX, aisleZ)
            && pathClear(midX, aisleZ, s.x, aisleZ)) {
            route = [[midX, camera.position.z], [midX, aisleZ], [s.x, aisleZ]]; break;
          }
        }
        if (route) break;
      }
      route ??= [[camera.position.x, 3], [s.x, 3]];
      cameraTransition = { route, segment: 0, startX: camera.position.x, startZ: camera.position.z, elapsed: 0, duration: .62 };
      $('location-name').textContent = s.title; updateNav(s.id);
      missionState.zones.add(s.id); updateMissionUI();
      document.querySelector('.topbar').classList.remove('menu-open');
      $('nav-menu-toggle').setAttribute('aria-expanded', 'false');
      if (!controls.isLocked) requestDesktopLook(); ensureNearby();
    });
    nav.appendChild(button);
  }
}
function updateNav(id) { document.querySelectorAll('.nav-button').forEach((b, i) => b.classList.toggle('active', sections[i]?.id === id)); }
function showToast(message) {
  const toast = $('toast'); toast.textContent = message; toast.classList.remove('hidden');
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.add('hidden'), 3800);
}

function visitZone(id) {
  if (!id || missionState.zones.has(id)) return;
  missionState.zones.add(id);
  updateMissionUI();
}

function renderMissionQuiz() {
  const index = missionQuestions.findIndex((_, i) => !missionState.quizAnswered.has(i));
  const questionNode = $('quiz-question'), answersNode = $('quiz-answers');
  answersNode.replaceChildren();
  $('quiz-feedback').textContent = '';
  if (index === -1) {
    questionNode.textContent = 'Archive checks complete. Your answers and discoveries are saved for this visit.';
    return;
  }
  missionState.activeQuiz = index;
  const item = missionQuestions[index];
  questionNode.textContent = `${index + 1} / ${missionQuestions.length} · ${item.question}`;
  item.answers.forEach((answer, answerIndex) => {
    const button = document.createElement('button');
    button.className = 'quiz-answer'; button.type = 'button'; button.textContent = answer;
    button.addEventListener('click', () => {
      if (answerIndex === item.correct) {
        button.classList.add('correct');
        missionState.quizAnswered.add(index); missionState.quizCorrect++;
        $('quiz-feedback').textContent = 'Correct. Answer recorded.';
        updateMissionUI();
        window.setTimeout(renderMissionQuiz, 650);
      } else {
        button.classList.add('incorrect'); button.disabled = true;
        $('quiz-feedback').textContent = 'Not quite. Try another answer.';
        const options = Array.from(answersNode.querySelectorAll('.quiz-answer'));
        if (options.every(option => option.disabled)) {
          $('quiz-feedback').textContent = 'No correct answer selected. Resetting this question…';
          window.setTimeout(() => {
            options.forEach(option => { option.disabled = false; option.classList.remove('incorrect'); });
            $('quiz-feedback').textContent = 'Try the question again.';
          }, 900);
        }
      }
    });
    answersNode.appendChild(button);
  });
}

function updateMissionUI() {
  if (!$('mission-zones-count')) return;
  const zones = missionState.zones.size, artifacts = missionState.exhibits.size, knowledge = missionState.quizCorrect;
  $('mission-zones-count').textContent = `${Math.min(zones, 5)} / 5`;
  $('mission-exhibits-count').textContent = `${Math.min(artifacts, 3)} / 3`;
  $('mission-quiz-count').textContent = `${Math.min(knowledge, 3)} / 3`;
  const score = Math.round(Math.min(zones, 5) * 8 + Math.min(artifacts, 3) * 10 + Math.min(knowledge, 3) * 10);
  $('mission-score').innerHTML = `SCORE <strong>${score}</strong> / 100`;
  const unlocked = [zones >= 5, artifacts >= 3, zones >= 5 && artifacts >= 3 && knowledge >= 3];
  $('mission-badges').querySelectorAll('.badge').forEach((badge, index) => badge.classList.toggle('locked', !unlocked[index]));
  const complete = unlocked[2];
  if (complete && !missionState.complete) showToast('MISSION COMPLETE · ARCHIVE EXPERT BADGE EARNED');
  missionState.complete = complete;
}

function guideResponse(question) {
  const query = question.toLowerCase();
  const normalizedQuery = query.replace(/[^a-z0-9]/g, '');
  const exhibit = exhibits.find(item => {
    const titleAlias = item.name.split(/[ /]/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const titleKey = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return (titleAlias.length > 2 && normalizedQuery.includes(titleAlias)) || normalizedQuery.includes(titleKey) || item.file.toLowerCase().split('.')[0].split(/[_-]+/).filter(part => part.length > 2).some(part => query.includes(part));
  });
  if (exhibit) return `${exhibit.name} · ${exhibit.category}. ${exhibit.description}`;
  if (/vr|quest|controller|teleport/.test(query)) return 'In WebXR, use the left controller stick to walk and the right stick to snap-turn. Aim at an open patch of floor and press the trigger to teleport. Aim at an exhibit and press the trigger to inspect it. VR availability depends on your browser and headset runtime.';
  if (/mission|quiz|score|badge/.test(query)) return 'Mission Control tracks five visited collection zones, three different exhibits inspected, and three correct archive checks. Complete every objective to earn the Archive Expert badge and a score of 100.';
  if (/where|navigate|move|walk|gallery|section|zone/.test(query)) return 'Use W A S D to walk, move the mouse to look, and choose a collection tab at the top to travel to its gallery. On a Quest, use the left stick or point at the floor and trigger to teleport.';
  if (/history|timeline|event|year/.test(query)) return 'Open History in the top bar to explore a short, sourced timeline. Select an event to read its note and visit the related museum collection.';
  if (/hello|hi\b|help|guide/.test(query)) return 'I can explain the eleven exhibits using the museum’s built-in descriptions, explain controls, or help with Missions and the History Timeline. My answers are local guide notes, not generated by a connected AI.';
  return 'I do not have a built-in note for that question yet. Try an exhibit name such as T-80U, Leclerc, J-8F, G3, RDS-37, Centauro, Floks or SeaRAM.';
}

function buildTimeline() {
  const container = $('timeline-events');
  timelineData.forEach((event, index) => {
    const button = document.createElement('button');
    button.className = 'timeline-event'; button.type = 'button';
    const year = document.createElement('span'); year.className = 'timeline-year'; year.textContent = event.year;
    const title = document.createElement('span'); title.className = 'timeline-name'; title.textContent = event.title;
    button.append(year, title);
    button.addEventListener('click', () => {
      container.querySelectorAll('.timeline-event').forEach(node => node.classList.remove('active'));
      button.classList.add('active'); $('timeline-detail').textContent = event.detail;
      $('timeline-visit').dataset.section = event.section;
      $('timeline-visit').disabled = false;
    });
    container.appendChild(button);
  });
}

function updateScenarioPanel() {
  const id = $('scenario-select').value;
  const scenario = scenarios[id] || scenarios.somme;
  const stage = THREE.MathUtils.clamp(Number($('scenario-progress').value) || 0, 0, scenario.stages.length - 1);
  warRoom.setScenario(id, stage);
  $('scenario-copy').textContent = `${scenario.title} · Historical source: ${scenario.source}. The 3D display is a schematic teaching aid and is not to scale.`;
  $('scenario-stage-label').textContent = `STAGE ${stage + 1} / ${scenario.stages.length}`;
  $('scenario-stage').textContent = scenario.stages[stage];
  $('war-room-stage').textContent = `${scenario.title.toUpperCase()} / SCHEMATIC`;
}

function createIntroEnvironment() {
  introGroup = new THREE.Group(); introGroup.position.set(0, 2.4, 5.7);
  const wire = new THREE.MeshBasicMaterial({ color: 0x55dff5, wireframe: true, transparent: true, opacity: .48, toneMapped: false });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.65, 2), wire); introGroup.add(core);
  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x88efff, transparent: true, opacity: .42, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  for (const [radius, rotation] of [[2.1, .1], [2.45, .84], [2.8, 1.36]]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, .012, 6, 96), ringMaterial);
    ring.rotation.set(Math.PI / 2 + rotation, rotation * .7, rotation); introGroup.add(ring);
  }
  introGroup.add(new THREE.PointLight(0x35ccef, 7, 11));
  introGroup.visible = true; scene.add(introGroup);
}

function ensureNearby() {
  const p = getVisitorPosition();
  const candidates = exhibits.map(e => ({ e, d: Math.hypot(p.x - e.x, p.z - e.z) })).filter(v => v.d < 20).sort((a, b) => a.d - b.d);
  // Stage just the nearest pair; the next nearest assets stream in as the visitor moves.
  for (const { e } of candidates.slice(0, 2)) loadExhibit(e);
}

function selectExhibit(e) {
  if (!e) return;
  selected = e;
  missionState.exhibits.add(e.file); updateMissionUI();
  const group = exhibitRoots.get(e.file);
  if (group) museumAudio.playExhibitCue(e, group).catch(error => updateAudioStatus(`Audio unavailable: ${error.message}`, 'error'));
  if (selectedBox) { scene.remove(selectedBox); selectedBox = null; }
  if (group?.userData.model) { selectedBox = new THREE.BoxHelper(group.userData.model, 0xcdb578); scene.add(selectedBox); }
  $('info-category').textContent = e.category;
  $('info-title').textContent = e.name;
  $('info-description').textContent = e.description;
  $('info-card').classList.remove('hidden');
  updateVRInfoPanel(e);
  if (!renderer.xr.isPresenting) {
    controls.unlock(); $('hint').textContent = 'DRAG TO ROTATE THE MODEL · CLICK TO RETURN';
  }
}

function requestDesktopLook() {
  if (typeof document.body.requestPointerLock === 'function') {
    controls.lock();
    return;
  }
  fallbackLook = true;
  $('hint').textContent = 'DRAG TO LOOK · WASD TO MOVE · CLICK AN EXHIBIT TO INSPECT';
}

function clearSelection() {
  selected = null;
  $('info-card').classList.add('hidden');
  if (selectedBox) { scene.remove(selectedBox); selectedBox = null; }
  if (vrPanel) vrPanel.visible = false;
}

function onCanvasClick(event) {
  if (!active) return;
  if (arRuntime.active) { placeARExhibit(); return; }
  if (selected && !controls.isLocked) { controls.lock(); return; }
  const rect = canvas.getBoundingClientRect();
  const x = controls.isLocked ? 0 : ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const y = controls.isLocked ? 0 : -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
  const hits = raycaster.intersectObjects(exhibitMeshes, false);
  const e = hits.find(h => h.object.userData.exhibit)?.object.userData.exhibit;
  if (e) selectExhibit(e);
  else if (!controls.isLocked && !selected) requestDesktopLook();
}
canvas.addEventListener('click', onCanvasClick);
canvas.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  if (!selected && fallbackLook && active && !controls.isLocked) {
    drag = { x: event.clientX, y: event.clientY, moved: false, mode: 'look' };
    canvas.setPointerCapture(event.pointerId); return;
  }
  if (!selected || controls.isLocked) return;
  drag = { x: event.clientX, y: event.clientY, moved: false, mode: 'inspect' };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
  if (drag.mode === 'look') {
    const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    euler.y -= dx * .004; euler.x = THREE.MathUtils.clamp(euler.x - dy * .004, -1.52, 1.52);
    camera.quaternion.setFromEuler(euler);
    drag.x = event.clientX; drag.y = event.clientY; return;
  }
  if (!selected) return;
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
function tick(time, xrFrame) {
  const dt = Math.min(clock.getDelta(), .045);
  const elapsed = clock.elapsedTime;
  warRoom.update(elapsed);
  if (introGroup) {
    introGroup.visible = !active;
    if (!active) { introGroup.rotation.y = elapsed * .08; introGroup.rotation.z = Math.sin(elapsed * .21) * .035; }
  }
  animatedHolograms.forEach(({ ring, core, phase }) => {
    const pulse = 1 + Math.sin(elapsed * 1.2 + phase) * .018;
    ring.scale.setScalar(pulse); ring.material.opacity = .48 + (Math.sin(elapsed * 1.4 + phase) + 1) * .1;
    core.material.opacity = .025 + (Math.sin(elapsed * .9 + phase) + 1) * .009;
  });
  if (!active) { renderer.render(scene, camera); return; }
  if (arRuntime.active) {
    updateARFrame(xrFrame);
    renderer.render(scene, camera);
    return;
  }
  if (cameraTransition) {
    cameraTransition.elapsed = Math.min(cameraTransition.elapsed + dt, cameraTransition.duration);
    const linear = cameraTransition.elapsed / cameraTransition.duration;
    const eased = linear * linear * (3 - 2 * linear);
    const destination = cameraTransition.route[cameraTransition.segment];
    camera.position.x = THREE.MathUtils.lerp(cameraTransition.startX, destination[0], eased);
    camera.position.z = THREE.MathUtils.lerp(cameraTransition.startZ, destination[1], eased);
    if (linear >= 1 && cameraTransition.segment < cameraTransition.route.length - 1) {
      cameraTransition.segment++; cameraTransition.elapsed = 0;
      cameraTransition.startX = destination[0]; cameraTransition.startZ = destination[1];
    } else if (linear >= 1) cameraTransition = null;
  }
  if (renderer.xr.isPresenting) {
    applyVRMovement(dt);
    updateXRModelRotation();
    const p = getVisitorPosition();
    const current = sections.reduce((a, b) => Math.abs(b.x - p.x) < Math.abs(a.x - p.x) ? b : a);
    $('location-name').textContent = current.title; updateNav(current.id);
    visitZone(current.id);
    if (performance.now() - lastLoadCheck > 800) { lastLoadCheck = performance.now(); ensureNearby(); }
    if (selected && vrPanel) {
      const exhibit = selected;
      const toward = new THREE.Vector3(p.x - exhibit.x, 0, p.z - exhibit.z).normalize();
      vrPanel.position.set(exhibit.x + toward.x * 1.7, Math.min(exhibit.size * .68 + 1.2, 7.5), exhibit.z + toward.z * 1.7);
      vrPanel.lookAt(p.x, vrPanel.position.y, p.z);
    }
  } else if ((controls.isLocked || fallbackLook) && !selected && !cameraTransition) {
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
    visitZone(current.id);
    if (performance.now() - lastLoadCheck > 800) { lastLoadCheck = performance.now(); ensureNearby(); }
  }
  if (selectedBox) selectedBox.update();
  for (const avatar of remoteVisitors.values()) {
    avatar.position.lerp(avatar.userData.target, 1 - Math.exp(-dt * 9));
    const yawDelta = Math.atan2(Math.sin(avatar.userData.yaw - avatar.rotation.y), Math.cos(avatar.userData.yaw - avatar.rotation.y));
    avatar.rotation.y += THREE.MathUtils.clamp(yawDelta, -dt * 4, dt * 4);
  }
  if (multiplayer.channel && !renderer.xr.isPresenting) {
    const pose = getVisitorPosition();
    const direction = camera.getWorldDirection(new THREE.Vector3());
    multiplayer.setPose({ x: pose.x, z: pose.z, yaw: Math.atan2(direction.x, -direction.z), zone: $('location-name').textContent });
  } else if (multiplayer.channel && renderer.xr.isPresenting) {
    const pose = getVisitorPosition();
    const orientation = renderer.xr.getCamera(camera).getWorldQuaternion(new THREE.Quaternion());
    const yaw = new THREE.Euler().setFromQuaternion(orientation, 'YXZ').y;
    const zone = sections.reduce((a, b) => Math.abs(b.x - pose.x) < Math.abs(a.x - pose.x) ? b : a);
    multiplayer.setPose({ x: pose.x, z: pose.z, yaw, zone: zone.short });
  }
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

function startRendering() {
  if (animationRunning) return;
  animationRunning = true; clock.start(); renderer.setAnimationLoop(tick);
}
function stopRendering() {
  if (!animationRunning) return;
  animationRunning = false; renderer.setAnimationLoop(null);
}

buildArchitecture(); buildExhibits(); mergeStaticArchitecture(); setSectionNav(); createVRInfoPanel(); createIntroEnvironment(); buildTimeline(); renderMissionQuiz(); updateMissionUI(); setupXRControllers();
exhibits.forEach(exhibit => { const option = document.createElement('option'); option.value = exhibit.file; option.textContent = `${exhibit.name} · ${exhibit.category}`; $('ar-exhibit-select').appendChild(option); });
updateARSupport();
startRendering();
renderer.xr.addEventListener('sessionstart', () => {
  const session = renderer.xr.getSession();
  if (session?.mode === 'immersive-ar') { beginARPresentation(session); return; }
  const startX = camera.position.x, startZ = camera.position.z, yaw = camera.rotation.y;
  playerRig.position.set(startX, 0, startZ); playerRig.rotation.set(0, yaw, 0);
  camera.position.set(0, 0, 0); camera.rotation.set(0, 0, 0);
  xrControllers.forEach(controller => { controller.visible = true; });
  xrControllerGrips.forEach(grip => { grip.visible = !!grip.userData.connected; });
  xrHands.forEach(hand => { hand.visible = !!hand.userData.hasTrackedHand; });
  vrButton.setAttribute('aria-label', 'Exit immersive VR');
  $('hint').textContent = 'LEFT STICK MOVE · RIGHT STICK TURN · TRIGGER SELECT · HOLD + MOVE TO ROTATE';
});
renderer.xr.addEventListener('sessionend', () => {
  if (arRuntime.active) { restoreARPresentation(); return; }
  camera.position.set(playerRig.position.x, 1.68, playerRig.position.z);
  camera.rotation.set(0, playerRig.rotation.y, 0);
  playerRig.position.set(0, 0, 0); playerRig.rotation.set(0, 0, 0);
  xrControllers.forEach(controller => { controller.visible = false; });
  xrControllerGrips.forEach(grip => { grip.visible = false; });
  xrHands.forEach(hand => { hand.visible = false; });
  if (vrPanel) vrPanel.visible = false;
  vrButton.setAttribute('aria-label', 'Enter immersive VR');
  $('hint').textContent = 'CLICK TO LOOK AROUND · WASD TO MOVE';
});
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setPixelRatio(renderScale); renderer.setSize(innerWidth, innerHeight);
});
window.addEventListener('keydown', e => {
  keys.add(e.code);
  if (e.code === 'Escape') {
    $('hint').textContent = 'CLICK TO LOOK AROUND · WASD TO MOVE';
    document.querySelector('.topbar').classList.remove('menu-open');
    $('nav-menu-toggle').setAttribute('aria-expanded', 'false');
  }
});
window.addEventListener('keyup', e => keys.delete(e.code));
const topbar = document.querySelector('.topbar');
const navMenuToggle = $('nav-menu-toggle');
navMenuToggle.addEventListener('click', () => {
  const open = topbar.classList.toggle('menu-open');
  navMenuToggle.setAttribute('aria-expanded', String(open));
});
document.addEventListener('click', e => {
  if (!topbar.contains(e.target) && topbar.classList.contains('menu-open')) {
    topbar.classList.remove('menu-open');
    navMenuToggle.setAttribute('aria-expanded', 'false');
  }
});
controls.addEventListener('lock', () => { $('hint').textContent = 'WASD TO MOVE · CLICK AN EXHIBIT TO INSPECT · ESC TO PAUSE'; });
controls.addEventListener('unlock', () => { if (active && !selected) $('hint').textContent = 'CLICK TO LOOK AROUND · WASD TO MOVE'; });
document.addEventListener('pointerlockerror', () => {
  if (!active || renderer.xr.isPresenting) return;
  fallbackLook = true;
  $('hint').textContent = 'DRAG TO LOOK · WASD TO MOVE · CLICK AN EXHIBIT TO INSPECT';
});
$('enter-button').addEventListener('click', async () => {
  $('welcome').classList.add('hidden'); $('loading').classList.remove('hidden');
  active = true;
  startRendering();
  requestDesktopLook();
  const initial = [exhibits.find(e => e.file === 'low-poly_hk_g3.glb')];
  progress('Opening the museum…', 4);
  await Promise.all(initial.map(e => loadExhibit(e)));
  progress('Gallery ready', 100);
  setTimeout(() => { $('loading').classList.add('hidden'); $('hud').classList.remove('hidden'); }, 380);
});
$('help-button').addEventListener('click', () => { controls.unlock(); $('help-modal').classList.remove('hidden'); });
$('experience-button').addEventListener('click', () => { controls.unlock(); $('experience-modal').classList.remove('hidden'); });
$('guide-button').addEventListener('click', () => { controls.unlock(); $('guide-modal').classList.remove('hidden'); $('guide-input').focus(); });
$('mission-button').addEventListener('click', () => { controls.unlock(); renderMissionQuiz(); updateMissionUI(); $('mission-modal').classList.remove('hidden'); });
$('timeline-button').addEventListener('click', () => { controls.unlock(); $('timeline-modal').classList.remove('hidden'); });
$('open-war-room').addEventListener('click', () => {
  $('experience-modal').classList.add('hidden'); controls.unlock(); warRoom.root.visible = true;
  $('war-room-modal').classList.remove('hidden'); updateScenarioPanel();
});
$('open-simulation').addEventListener('click', () => {
  $('experience-modal').classList.add('hidden'); controls.unlock(); warRoom.root.visible = true;
  updateScenarioPanel(); $('simulation-modal').classList.remove('hidden');
});
$('war-room-scenario').addEventListener('click', () => {
  $('war-room-modal').classList.add('hidden'); updateScenarioPanel(); $('simulation-modal').classList.remove('hidden');
});
document.querySelectorAll('[data-map-layer]').forEach(button => button.addEventListener('click', () => {
  const enabled = button.classList.toggle('active'); button.setAttribute('aria-pressed', String(enabled));
  warRoom.setLayer(button.dataset.mapLayer, enabled);
}));
$('scenario-select').addEventListener('change', () => { $('scenario-progress').value = 0; updateScenarioPanel(); });
$('scenario-progress').addEventListener('input', updateScenarioPanel);
$('scenario-play').addEventListener('click', () => {
  if (scenarioPlaying) {
    clearInterval(scenarioTimer); scenarioTimer = null; scenarioPlaying = false;
    $('scenario-play').querySelector('span').textContent = 'PLAY TIMELINE'; $('scenario-play').querySelector('.arrow').textContent = '▶';
    return;
  }
  scenarioPlaying = true; $('scenario-play').querySelector('span').textContent = 'PAUSE TIMELINE'; $('scenario-play').querySelector('.arrow').textContent = 'Ⅱ';
  scenarioTimer = window.setInterval(() => {
    const progress = $('scenario-progress');
    if (Number(progress.value) >= 2) { $('scenario-play').click(); return; }
    progress.value = Number(progress.value) + 1; updateScenarioPanel();
  }, 1750);
});
$('open-multiplayer').addEventListener('click', () => { $('experience-modal').classList.add('hidden'); controls.unlock(); $('multiplayer-modal').classList.remove('hidden'); });
$('multiplayer-join').addEventListener('click', async () => {
  $('multiplayer-join').disabled = true;
  multiplayerConnected = await multiplayer.join($('room-name').value, $('visitor-name').value);
  $('multiplayer-leave').disabled = !multiplayerConnected;
  $('multiplayer-join').disabled = multiplayerConnected;
  $('multiplayer-count').textContent = multiplayerConnected ? `${remoteVisitors.size + 1} ${remoteVisitors.size === 0 ? 'visitor' : 'visitors'}` : '0 visitors';
});
$('multiplayer-leave').addEventListener('click', async () => {
  await multiplayer.leave(); multiplayerConnected = false;
  $('multiplayer-leave').disabled = true; $('multiplayer-join').disabled = false;
  $('multiplayer-count').textContent = '0 visitors';
});
$('open-audio').addEventListener('click', () => { $('experience-modal').classList.add('hidden'); controls.unlock(); $('audio-modal').classList.remove('hidden'); });
$('ambient-toggle').addEventListener('change', async event => {
  try {
    await museumAudio.setAmbientEnabled(event.target.checked);
    updateAudioStatus(event.target.checked ? 'Spatial ambient bed is playing. Toggle it off at any time.' : 'Ambient audio is off.');
  } catch (error) { event.target.checked = false; updateAudioStatus(`Could not start browser audio: ${error.message}`, 'error'); }
});
$('audio-volume').addEventListener('input', event => {
  const value = Number(event.target.value); museumAudio.setVolume(value / 100);
  $('audio-volume-label').textContent = `${value}%`;
});
$('spatial-cues-toggle').addEventListener('change', async event => {
  museumAudio.setCuesEnabled(event.target.checked);
  if (event.target.checked) {
    try { await museumAudio.initialize(); updateAudioStatus('Spatial exhibit cues are enabled; select an exhibit to hear its positional locator tone.'); }
    catch (error) { event.target.checked = false; museumAudio.setCuesEnabled(false); updateAudioStatus(`Could not start browser audio: ${error.message}`, 'error'); }
  } else updateAudioStatus('Spatial exhibit cues are off.');
});
$('open-ar').addEventListener('click', async () => {
  $('experience-modal').classList.add('hidden'); controls.unlock(); $('ar-modal').classList.remove('hidden');
  $('ar-exhibit-select').value = arRuntime.selectedFile;
  await Promise.all([loadARModel(arRuntime.selectedFile), updateARSupport()]);
});
$('ar-exhibit-select').addEventListener('change', async event => {
  arRuntime.selectedFile = event.target.value; arRuntime.placed = false; arPlacedRoot.clear(); arPlacedRoot.visible = false;
  await loadARModel(event.target.value);
});
$('ar-place-button').addEventListener('click', placeARExhibit);
$('guide-listen').addEventListener('click', toggleGuideRecognition);
$('guide-form').addEventListener('submit', event => {
  event.preventDefault();
  const question = $('guide-input').value.trim();
  if (!question) return;
  $('guide-answer').textContent = guideResponse(question);
  $('guide-input').value = '';
});
document.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click', () => {
  $('guide-answer').textContent = guideResponse(button.dataset.question);
}));
$('guide-speak').addEventListener('click', () => {
  if (activeUtterance && speechSynthesis.speaking) {
    stopMuseumSpeech(); $('guide-voice-status').textContent = 'Narration stopped.'; return;
  }
  speakMuseumText($('guide-answer').textContent);
});
$('info-narrate').addEventListener('click', () => {
  if (selected) speakMuseumText(`${selected.name}. ${selected.description}`);
});
$('timeline-visit').addEventListener('click', () => {
  const section = sections.find(item => item.id === $('timeline-visit').dataset.section);
  if (!section) return;
  $('timeline-modal').classList.add('hidden');
  Array.from(document.querySelectorAll('.nav-button')).find(button => button.textContent === section.short)?.click();
});
$('vr-status-button').addEventListener('click', async () => {
  controls.unlock();
  $('vr-status-modal').classList.remove('hidden');
  await updateVRDiagnostics();
});
$('vr-recheck').addEventListener('click', updateVRDiagnostics);
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => {
  const id = b.dataset.close;
  if (id === 'ar-modal' && arRuntime.session) { arRuntime.session.end(); return; }
  $(id).classList.add('hidden');
  if (id === 'guide-modal' && speechRecognizer) {
    try { speechRecognizer.stop(); } catch { /* Recognition may already have ended. */ }
    speechRecognizer = null; $('guide-listen').textContent = '◉ ASK BY VOICE'; $('guide-listen').setAttribute('aria-pressed', 'false');
  }
  if (id === 'guide-modal' && 'speechSynthesis' in window) stopMuseumSpeech();
  if (id === 'war-room-modal' || id === 'simulation-modal') {
    warRoom.root.visible = false;
    if (scenarioTimer) clearInterval(scenarioTimer);
    scenarioTimer = null; scenarioPlaying = false;
    $('scenario-play').querySelector('span').textContent = 'PLAY TIMELINE'; $('scenario-play').querySelector('.arrow').textContent = '▶';
  }
  if (!selected && active && !renderer.xr.isPresenting) requestDesktopLook();
}));
$('close-info').addEventListener('click', () => {
  clearSelection();
  requestDesktopLook(); $('hint').textContent = fallbackLook ? 'DRAG TO LOOK · WASD TO MOVE · CLICK AN EXHIBIT TO INSPECT' : 'WASD TO MOVE · CLICK AN EXHIBIT TO INSPECT · ESC TO PAUSE';
});
$('exit-button').addEventListener('click', () => {
  controls.unlock(); active = false; cameraTransition = null; clearSelection();
  if (speechRecognizer) { try { speechRecognizer.stop(); } catch { /* Recognition may already have ended. */ } speechRecognizer = null; }
  stopMuseumSpeech();
  multiplayer.leave(false).then(() => { multiplayerConnected = false; });
  museumAudio.setAmbientEnabled(false).catch(() => {});
  const session = renderer.xr.getSession(); if (session) session.end();
  $('hud').classList.add('hidden'); $('welcome').classList.remove('hidden');
});
