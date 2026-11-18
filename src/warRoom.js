import * as THREE from 'three';

export const scenarios = {
  somme: {
    title: 'The Somme · 1916',
    source: 'Imperial War Museums, First World War large-print guide',
    stages: [
      '1 July 1916 · At 7:30 am, British troops advanced from their trenches toward German lines on the Somme. This display is schematic, not a reconstruction of exact positions.',
      'The campaign continued through 1916. Explore the displayed front line as a historical context layer; the map does not model troop strengths, casualties or tactical outcomes.',
      'The Somme illustrates the scale and human cost of industrial warfare. This educational view ends with historical context and remembrance, without combat effects.',
    ],
  },
  britain: {
    title: 'Battle of Britain · 1940',
    source: 'Imperial War Museums, Battle of Britain and Blitz factsheet',
    stages: [
      '10 July 1940 · The Battle of Britain officially began. German attacks on Channel shipping drew RAF fighters into the campaign.',
      '12 August 1940 · The Luftwaffe began a systematic assault on RAF Fighter Command forward airfields and radar stations. Radar and command networks are highlighted on the map.',
      'By October 1940, the Luftwaffe had not achieved its objective. This timeline describes the campaign’s phases; it does not simulate attacks or depict casualties.',
    ],
  },
};

function makeLabel(text, color = '#8defff') {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#071421dd'; ctx.fillRect(0, 10, 500, 72);
  ctx.strokeStyle = color; ctx.strokeRect(1, 11, 498, 70);
  ctx.fillStyle = color; ctx.font = '600 31px Arial'; ctx.fillText(text.toUpperCase(), 18, 57);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.userData.labelCanvas = canvas; sprite.scale.set(4.1, .78, 1); return sprite;
}

function updateLabel(sprite, text, color) {
  const canvas = sprite.userData.labelCanvas;
  const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#071421dd'; ctx.fillRect(4, 10, 500, 72);
  ctx.strokeStyle = color; ctx.strokeRect(5, 11, 498, 70);
  ctx.fillStyle = color; ctx.font = '600 31px Arial'; ctx.fillText(text.toUpperCase(), 18, 57);
  sprite.material.map.needsUpdate = true;
}

export function createWarRoom(scene) {
  const root = new THREE.Group(); root.name = 'war-room-hologram'; root.position.set(0, 2.7, 6.8); root.visible = false; scene.add(root);
  const cyan = new THREE.MeshBasicMaterial({ color: 0x59e8ff, transparent: true, opacity: .84, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const blue = new THREE.MeshBasicMaterial({ color: 0x4388ff, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(13, 7.2), new THREE.MeshBasicMaterial({ color: 0x061725, transparent: true, opacity: .7, side: THREE.DoubleSide, depthWrite: false }));
  root.add(panel);
  const border = new THREE.LineSegments(new THREE.EdgesGeometry(panel.geometry), cyan); border.position.z = .015; root.add(border);
  const grid = new THREE.Group(); root.add(grid);
  const gridMaterial = new THREE.LineBasicMaterial({ color: 0x28758b, transparent: true, opacity: .46 });
  for (let x = -6; x <= 6; x += 1) {
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, -3.15, .02), new THREE.Vector3(x, 3.15, .02)]), gridMaterial);
    grid.add(line);
  }
  for (let y = -3; y <= 3; y += 1) {
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-6.2, y, .02), new THREE.Vector3(6.2, y, .02)]), gridMaterial);
    grid.add(line);
  }

  const terrain = new THREE.Group(); root.add(terrain);
  const terrainMaterial = new THREE.MeshBasicMaterial({ color: 0x1c91ac, transparent: true, opacity: .12, wireframe: true, toneMapped: false });
  for (const [x, y, sx, sy] of [[-4, 1.7, 1.8, .6], [-2, -1.8, 1.3, .48], [3.8, 1.8, 1.7, .72], [4, -1.2, 1.2, .42]]) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), terrainMaterial);
    hill.position.set(x, y, .12); hill.scale.set(sx, sy, .16); terrain.add(hill);
  }

  const frontLines = new THREE.Group(); root.add(frontLines);
  const routePoints = [new THREE.Vector3(-5.3, -.3, .12), new THREE.Vector3(-3.6, -.15, .16), new THREE.Vector3(-1.5, -.25, .18), new THREE.Vector3(.2, -.05, .18), new THREE.Vector3(2.1, .35, .16), new THREE.Vector3(4.9, .5, .12)];
  const routeCurve = new THREE.CatmullRomCurve3(routePoints);
  const route = new THREE.Mesh(new THREE.TubeGeometry(routeCurve, 52, .032, 6, false), blue); frontLines.add(route);
  const secondaryPoints = routePoints.map((p, i) => new THREE.Vector3(p.x, p.y + (i < 3 ? 1.3 : 1.6), p.z - .02));
  const secondary = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(secondaryPoints), 52, .018, 6, false), cyan); frontLines.add(secondary);

  const markers = new THREE.Group(); root.add(markers);
  const markerMat = new THREE.MeshBasicMaterial({ color: 0x73efff, transparent: true, opacity: .88, toneMapped: false });
  const marker = new THREE.Mesh(new THREE.SphereGeometry(.17, 12, 8), markerMat); marker.position.copy(routeCurve.getPoint(0)); markers.add(marker);
  const beacon = new THREE.Mesh(new THREE.TorusGeometry(.27, .022, 6, 28), cyan); beacon.position.copy(marker.position); markers.add(beacon);
  const radar = new THREE.Mesh(new THREE.RingGeometry(.65, .69, 48), new THREE.MeshBasicMaterial({ color: 0x50dffc, transparent: true, opacity: .35, side: THREE.DoubleSide, toneMapped: false }));
  radar.position.set(-4.4, 2.1, .13); markers.add(radar);
  const labels = new THREE.Group(); root.add(labels);
  const lineLabel = makeLabel('Front line · schematic', '#8cbcff'); lineLabel.position.set(0, -2.7, .14); labels.add(lineLabel);
  const markerLabel = makeLabel('Timeline marker', '#72efff'); markerLabel.position.set(-4.4, 2.62, .14); labels.add(markerLabel);
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(12.6, .018), new THREE.MeshBasicMaterial({ color: 0x64eaff, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  scan.position.z = .1; root.add(scan);
  const title = makeLabel('Historical operations · educational archive', '#71e7ff'); title.position.set(0, 3.25, .14); title.scale.set(6.2, .78, 1); root.add(title);

  let currentScenario = 'somme'; let currentStage = 0;
  function setScenario(id, stage = 0) {
    currentScenario = scenarios[id] ? id : 'somme';
    currentStage = THREE.MathUtils.clamp(stage, 0, 2);
    const progress = currentStage / 2;
    marker.position.copy(routeCurve.getPoint(progress));
    beacon.position.copy(marker.position);
    const isAir = currentScenario === 'britain';
    route.material.color.set(isAir ? 0x57dbff : 0x548fff);
    updateLabel(lineLabel, `${isAir ? 'Campaign phase' : 'Somme front line'} · ${currentStage + 1}/3`, isAir ? '#8defff' : '#8cbcff');
    updateLabel(markerLabel, isAir ? 'Radar / command network' : 'Historical marker', '#72efff');
  }

  function update(timeSeconds) {
    scan.position.y = THREE.MathUtils.mapLinear(Math.sin(timeSeconds * .42), -1, 1, -3.45, 3.45);
    const pulse = 1 + (Math.sin(timeSeconds * 2.2) + 1) * .13;
    beacon.scale.setScalar(pulse); radar.rotation.z = timeSeconds * .24;
    marker.material.opacity = .7 + (Math.sin(timeSeconds * 2.4) + 1) * .13;
  }

  function setLayer(name, enabled) {
    ({ front: frontLines, terrain, markers })[name]?.traverse(object => {
      object.visible = enabled;
    });
    // Restore children too, so switching a layer back on fully reveals it.
    const target = ({ front: frontLines, terrain, markers })[name];
    if (target) target.visible = enabled;
  }

  setScenario(currentScenario, currentStage);
  return { root, setScenario, update, setLayer, scenarios };
}
