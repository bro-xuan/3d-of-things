// Build step for the medium-format reflex camera (content/reflex-camera.json → build.generate).
// Nothing comes from a source model: the whole camera is built here, after the Hasselblad 500C/M,
// from the parts in body.mjs (shell, mirror box, mirror, rear flaps, winding gears), lens.mjs
// (an 80 mm f/2.8 in a leaf shutter), back.mjs (the film magazine) and finder.mjs (the folding
// hood). Like the rangefinder's build, it checks that no part passes through another, at rest
// and along the explode in the content file, and returns model-space numbers for the content.
import { Document, getBounds } from '@gltf-transform/core';
import { KHRMaterialsIOR, KHRMaterialsIridescence, KHRMaterialsTransmission, KHRTextureTransform } from '@gltf-transform/extensions';
import { fromGeo, writePrimitive } from '../../scripts/kit/surgery.mjs';
import { checkClashes, checkExplode } from '../../scripts/kit/parts.mjs';
import { buildBody, TRAIN } from './body.mjs';
import { buildLens, irisAngle, IRIS, MAX_EXTENSION, REST, SHUTTER, SPEEDS, STOPS, Z, leafOutline } from './lens.mjs';
import { buildMagazine, COUNTER, FILM_LENGTH, MAG_TRAIN, ROLLS } from './back.mjs';
import { buildFinder } from './finder.mjs';
import { DRIVE, FLAPS, FRAME_PITCH, KNOB, LENS, MAGAZINE, MIRROR } from './layout.mjs';
import { engraving, leatherGrain, rollFilm, screenMarkings } from '../../scripts/kit/textures.mjs';

const TAU = Math.PI * 2;
const srgb = (hex) => [0, 2, 4].map((i) => ((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))(parseInt(hex.slice(i + 1, i + 3), 16) / 255));

/** Parts that touch by design: gears in mesh, pins in their holes, the film on its rollers, the magazine on the body. */
export const CONTACTS = [
  ['film', 'insert'], ['film', 'supply_spool'], ['film', 'take_up_spool'], ['film', 'magazine'],
  ['supply_spool', 'insert'], ['take_up_spool', 'insert'], ['take_up_spool', 'spool_drive'],
  ['dark_slide', 'magazine'], ['frame_counter', 'magazine'], ['magazine_crank', 'magazine'],
  ['magazine_input', 'magazine'], ['magazine_idler', 'magazine'], ['spool_drive', 'magazine'],
  ['magazine_input', 'magazine_gear'], ['magazine_input', 'magazine_idler'], ['magazine_idler', 'spool_drive'],
  ['magazine', 'rear_plate'], ['magazine', 'shell'],
  ['knob', 'shell'], ['knob', 'wind_gear'], ['wind_gear', 'idler_gear'], ['wind_gear', 'flap_barrel'], ['wind_gear', 'mechanism_plate'],
  ['idler_gear', 'cross_shaft'], ['cross_shaft', 'drive_shaft'], ['flap_barrel', 'magazine_gear'],
  ['idler_gear', 'mechanism_plate'], ['flap_barrel', 'mechanism_plate'], ['magazine_gear', 'mechanism_plate'], ['cross_shaft', 'mechanism_plate'],
  ['mechanism_plate', 'chassis'], ['cross_shaft', 'chassis'],
  ['mirror', 'chassis'], ['screen', 'chassis'], ['flap_upper', 'rear_plate'], ['flap_lower', 'rear_plate'],
  ['chassis', 'front_plate'], ['drive_shaft', 'front_plate'],
  ['lens', 'front_plate'], ['lens', 'drive_shaft'], ['optics', 'lens'],
  ['shutter_blade_*', 'optics'], ['iris_blade_*', 'optics'], ['speed_ring', 'optics'], ['aperture_ring', 'optics'], ['focus_ring', 'optics'],
  ['finder', 'shell'], ['release_button', 'shell'], ['release_button', 'front_plate'],
];

async function materialsFor(doc) {
  const transmission = doc.createExtension(KHRMaterialsTransmission);
  const ior = doc.createExtension(KHRMaterialsIOR);
  const iridescence = doc.createExtension(KHRMaterialsIridescence);
  const transform = doc.createExtension(KHRTextureTransform);
  const material = (name, hex, metallic, roughness) => doc.createMaterial(name).setBaseColorFactor([...srgb(hex), 1]).setMetallicFactor(metallic).setRoughnessFactor(roughness);
  const texture = (name, image) => doc.createTexture(name).setImage(image).setMimeType('image/png').setURI(`${name}.png`);
  const textured = (name, image, metallic, roughness) => material(name, '#ffffff', metallic, roughness).setBaseColorTexture(texture(name, image));
  const glass = (name, hex) =>
    material(name, hex, 0, 0.02)
      .setExtension('KHR_materials_transmission', transmission.createTransmission().setTransmissionFactor(1))
      .setExtension('KHR_materials_ior', ior.createIOR().setIOR(1.52));

  // Leatherette: a pebble grain, tiled every 9 mm (its UVs span 200 mm).
  const grain = texture('leatherette_grain', await leatherGrain());
  const leather = material('reflex_leatherette', '#141414', 0, 0.62).setNormalTexture(grain).setNormalScale(1);
  leather.getNormalTextureInfo().setExtension('KHR_texture_transform', transform.createTransform().setScale([200 / 9, 200 / 9]));

  const coated = glass('reflex_coated_glass', '#f4f6ff');
  coated.setExtension('KHR_materials_iridescence', iridescence.createIridescence().setIridescenceFactor(1).setIridescenceIOR(1.38).setIridescenceThicknessMinimum(250).setIridescenceThicknessMaximum(420));

  const film = textured('reflex_film', await rollFilm({ pitch: FRAME_PITCH }), 0, 0.4).setDoubleSided(true);
  film.getBaseColorTextureInfo().setExtension('KHR_texture_transform', transform.createTransform().setScale([FILM_LENGTH / FRAME_PITCH, 1]));

  return {
    chrome: material('reflex_chrome', '#d8d9db', 1, 0.2),
    blackInside: material('reflex_black_inside', '#121213', 0, 0.82),
    leather,
    red: material('reflex_red', '#c41a1f', 0, 0.45),
    flock: material('reflex_flock', '#050505', 0, 1),
    steel: material('reflex_steel', '#b9bdc3', 1, 0.3),
    black: material('reflex_black', '#0f0f10', 0.25, 0.42),
    finderBlack: material('reflex_finder', '#101011', 0.3, 0.5),
    spring: material('reflex_spring', '#3a3e46', 1, 0.34),
    brass: material('reflex_brass', '#c9a35a', 1, 0.3),
    brassPlate: material('reflex_brass_plate', '#b8955a', 1, 0.42),
    foam: material('reflex_foam', '#0b0b0b', 0, 1),
    flap: material('reflex_flap', '#151516', 0.35, 0.5),
    mirror: material('reflex_mirror', '#f2f4f5', 1, 0.03),
    screen: textured('reflex_screen', await screenMarkings(), 0, 0.86),
    glass: glass('reflex_glass', '#eef5f3'),
    window: glass('reflex_window', '#f5f7f7'),
    coated,
    grip: material('reflex_grip', '#111112', 0.15, 0.55),
    blade: material('reflex_shutter_blade', '#1c1d20', 0.7, 0.3),
    iris: material('reflex_iris_blade', '#202022', 0.5, 0.42),
    plastic: material('reflex_plastic', '#0c0c0d', 0, 0.5),
    paper: material('reflex_backing_paper', '#3b1f1b', 0, 0.75),
    paperBack: material('reflex_backing_paper_inside', '#151312', 0, 0.8).setDoubleSided(true),
    film,
    distanceScale: textured('reflex_distance_scale', await distanceScale(), 0.15, 0.48),
    dofScale: textured('reflex_dof_scale', await dofScale(), 0.85, 0.3),
    apertureScale: textured('reflex_aperture_scale', await apertureScale(), 0.15, 0.45),
    speedScale: textured('reflex_speed_scale', await speedScale(), 0.15, 0.45),
    nameRing: textured('reflex_name_ring', await nameRing(), 0.1, 0.5),
    counterDial: textured('reflex_counter', await counterDial(), 0, 0.6),
  };
}

// ---------------------------------------------------------------- engravings
// Each scale is drawn unrolled: u = 0.25 is the top of the lens, where the index is.

/** The focusing ring turns this far (in turns) to focus at `metres`. */
export const focusTurn = (metres) => (extensionFor(metres) / MAX_EXTENSION) * (LENS.throw / 360);
function extensionFor(metres) {
  if (!Number.isFinite(metres) || metres <= 0) return 0;
  const f = LENS.focal;
  const s = metres * 1000 - 2 * f;
  return (s - Math.sqrt(Math.max(0, s * s - 4 * f * f))) / 2;
}

function distanceScale() {
  const metres = [[Infinity, '∞'], [10, '10'], [5, '5'], [3, '3'], [2, '2'], [1.5, '1.5'], [1.2, '1.2'], [1, '1'], [0.9, '0.9']];
  const feet = [[Infinity, '∞'], [30, '30'], [15, '15'], [10, '10'], [7, '7'], [5, '5'], [4, '4'], [3.5, '3.5'], [3, '3']];
  const marks = [];
  for (const [m, text] of metres) marks.push({ at: 0.25 + focusTurn(m), text, colour: '#f2f2f2', size: 25, y: 0.7, weight: 600 }, { at: 0.25 + focusTurn(m), tick: [0.92, 1.0], colour: '#f2f2f2', w: 2 });
  for (const [ft, text] of feet) marks.push({ at: 0.25 + focusTurn(ft * 0.3048), text, colour: '#f39b2a', size: 21, y: 0.3, weight: 600 });
  return engraving({ width: 2048, height: 72, background: '#111112', marks });
}

function dofScale() {
  // How far the focusing ring may turn either way before a point blurs past 0.06 mm, at each stop.
  const turnFor = (n) => ((n * 0.06) / MAX_EXTENSION) * (LENS.throw / 360);
  const marks = [{ at: 0.25, diamond: [0.3, 9], colour: '#c41a1f' }];
  for (const n of [4, 8, 11, 16, 22]) {
    for (const side of [-1, 1]) marks.push({ at: 0.25 + side * turnFor(n), text: String(n), colour: '#1b1b1b', size: 22, y: 0.62, weight: 600 }, { at: 0.25 + side * turnFor(n), tick: [0, 0.3], colour: '#1b1b1b', w: 2 });
  }
  return engraving({ width: 2048, height: 64, background: '#c9cacc', marks });
}

function apertureScale() {
  const marks = STOPS.map((n, s) => ({ at: 0.25 + ((s - REST.stop) * LENS.stopTurn) / 360, text: String(n), colour: s === 0 ? '#f39b2a' : '#f2f2f2', size: 26, y: 0.52, weight: 600 }));
  for (let s = 0; s < STOPS.length; s++) marks.push({ at: 0.25 + ((s - REST.stop) * LENS.stopTurn) / 360, tick: [0.86, 1.0], colour: '#f2f2f2', w: 2 });
  return engraving({ width: 2048, height: 80, background: '#111112', marks });
}

function speedScale() {
  const labels = ['1', '2', '4', '8', '15', '30', '60', '125', '250', '500'];
  const marks = labels.map((text, k) => ({ at: 0.25 + ((k - REST.speed) * LENS.speedTurn) / 360, text, colour: k >= 6 ? '#f2f2f2' : '#f39b2a', size: 24, y: 0.5, weight: 600 }));
  marks.push({ at: 0.25 + ((-1 - REST.speed) * LENS.speedTurn) / 360, text: 'B', colour: '#f2f2f2', size: 24, y: 0.5, weight: 700 });
  return engraving({ width: 2048, height: 56, background: '#111112', marks });
}

function nameRing() {
  return engraving({
    width: 2048,
    height: 64,
    background: '#0f0f10',
    marks: [
      { at: 0.25, text: '1 : 2.8     f = 80 mm', colour: '#e8e8e8', size: 30, y: 0.52, spacing: 1 },
      { at: 0.75, text: 'No 5 712 304', colour: '#e8e8e8', size: 26, y: 0.52, spacing: 1 },
    ],
  });
}

function counterDial() {
  const marks = [];
  for (let n = 1; n <= 12; n++) marks.push({ at: 0.25 - (n - 1) / 12, text: String(n), colour: '#f2f2f2', size: 54, y: 0.45, weight: 700 });
  return engraving({ width: 1024, height: 96, background: '#0d0d0d', marks });
}

// ------------------------------------------------------------------ build

/** Box-mapped UVs (mm / span) for textures that tile, such as leatherette: each vertex projects along its normal's main axis. */
function boxUVs(mesh, span = 100) {
  const n = mesh.positions.length / 3;
  for (let i = 0; i < n; i++) {
    const p = mesh.positions.slice(i * 3, i * 3 + 3);
    const m = mesh.normals.slice(i * 3, i * 3 + 3).map(Math.abs);
    const a = m.indexOf(Math.max(...m));
    const [u, v] = [0, 1, 2].filter((k) => k !== a);
    mesh.uvs[i * 2] = p[u] / span + 0.5;
    mesh.uvs[i * 2 + 1] = p[v] / span + 0.5;
  }
  return mesh;
}

export function buildParts() {
  return [...buildBody(), ...buildLens(), ...buildMagazine(), ...buildFinder()];
}

export default async function generate({ data, log = console.log, check = true } = {}) {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene('reflex_camera');
  doc.getRoot().setDefaultScene(scene);
  const M = await materialsFor(doc);
  const parts = buildParts();

  const pieces = new Map();
  for (const part of parts) {
    const list = [];
    for (const [key, geo] of part.geos) {
      if (geo.isEmpty) continue;
      if (!M[key]) throw new Error(`no material "${key}" (part ${part.name})`);
      const mesh = fromGeo(geo);
      if (key === 'leather') boxUVs(mesh, 200);
      list.push({ mesh, material: M[key], key, generated: true });
    }
    pieces.set(part.name, list);
  }

  // One node per part, nested as the parts ride on each other.
  const nodes = new Map();
  for (const part of parts) {
    const node = doc.createNode(part.name);
    const list = pieces.get(part.name);
    if (list.length) {
      const mesh = doc.createMesh(part.name);
      for (const { mesh: m, material } of list) mesh.addPrimitive(writePrimitive(doc, buffer, m, material, { uvs: !!material.getBaseColorTexture() || !!material.getNormalTexture() }));
      node.setMesh(mesh);
    }
    if (part.extras) node.setExtras(part.extras);
    nodes.set(part.name, node);
  }
  const parentOf = (name) => parts.find((p) => p.name === name)?.parent;
  for (const [name, node] of nodes) {
    const parent = parentOf(name);
    (parent ? nodes.get(parent) : scene).addChild(node);
  }

  const bounds = getBounds(scene);
  const size = bounds.max.map((v, i) => v - bounds.min[i]);
  const scale = 1 / (0.5 * Math.hypot(...size));
  const offset = [-(bounds.min[0] + bounds.max[0]) / 2, -bounds.min[1], -(bounds.min[2] + bounds.max[2]) / 2];
  const toModel = (mm) => mm.map((v, i) => +(((v / 1000 + offset[i]) * scale).toFixed(4)));

  const fail = (message) => {
    if (check) throw new Error(message);
    log(`  (not checked) ${message}`);
  };
  const clashes = checkClashes(pieces, { ignore: CONTACTS });
  if (clashes.length) fail(`reflex camera: parts collide\n  ${clashes.join('\n  ')}`);
  if (data?.parts?.length) {
    const path = checkExplode(pieces, data.parts, parentOf, 1000 / scale);
    if (path.length) fail(`reflex camera: the explode in the content file collides\n  ${path.join('\n  ')}`);
  }
  log(`  reflex camera: ${nodes.size} nodes, ${size.map((v) => (v * 1000).toFixed(1)).join(' × ')} mm`);
  return { doc, hints: hints(toModel, scale) };
}

/** Model-space numbers for the content file: pivots and axes of everything that moves. */
function hints(toModel, scale) {
  const round = (v, d = 4) => +v.toFixed(d);
  const unit = (mm) => round((mm / 1000) * scale, 5);
  return {
    space: { origin: toModel([0, 0, 0]), mmPerUnit: round(1 / scale, 6) * 1000 },
    mirrorHinge: toModel([0, MIRROR.hinge[1], MIRROR.hinge[0]]),
    flapUpper: toModel([0, FLAPS.hinge, FLAPS.z + 0.25]),
    flapLower: toModel([0, -FLAPS.hinge, FLAPS.z - 0.25]),
    knob: toModel([-50, KNOB.y, KNOB.z]),
    gears: Object.fromEntries(Object.entries(TRAIN).filter(([, g]) => g.teeth).map(([k, g]) => [k, { at: toModel([-37.8, g.y, g.z]), teeth: g.teeth }])),
    magazineGears: Object.fromEntries(Object.entries(MAG_TRAIN).map(([k, g]) => [k, { at: toModel([-37.8, g.y, g.z]), teeth: g.teeth }])),
    drive: toModel([DRIVE.x, DRIVE.y, 60]),
    lensAxis: toModel([0, 0, 100]),
    focus: { slide: unit(MAX_EXTENSION), maxExtension: round(MAX_EXTENSION, 3), throw: LENS.throw },
    shutterPivots: Array.from({ length: SHUTTER.blades }, (_, k) => toModel([...leafOutline(k).P, SHUTTER.z])),
    shutterTurn: round(-SHUTTER.open / TAU, 4),
    irisCurve: STOPS.map((n, s) => [s, round((irisAngle(n) - irisAngle(STOPS[REST.stop])) / TAU, 4)]),
    irisPivots: Array.from({ length: IRIS.blades }, (_, k) => {
      const psi = Math.PI / 2 + (k * TAU) / IRIS.blades;
      return toModel([IRIS.pivot * Math.cos(psi), IRIS.pivot * Math.sin(psi), IRIS.z]);
    }),
    spools: { supply: toModel([0, MAGAZINE.supply.y, MAGAZINE.supply.z]), takeUp: toModel([0, MAGAZINE.takeUp.y, MAGAZINE.takeUp.z]), perFrame: { supply: round(FRAME_PITCH / (TAU * ROLLS.supply), 4), takeUp: round(FRAME_PITCH / (TAU * ROLLS.takeUp), 4) } },
    film: { length: round(FILM_LENGTH, 2), tilesPerFrame: 1 },
    counter: toModel([-41.6, COUNTER.y - COUNTER.r, COUNTER.z]),
    darkSlide: { lift: unit(60) },
    stops: STOPS,
    speeds: SPEEDS,
    rest: REST,
    z: Z,
  };
}
