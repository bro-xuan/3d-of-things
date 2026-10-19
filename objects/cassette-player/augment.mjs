// Build step for the personal cassette player (content/cassette-player.json → build.augment): opens Poly Haven's
// "Portable Cassette Player" (a lid, a body and a cassette, each one closed mesh) and gives it the transport that
// plays the tape. Millimetres in the source's frame: x to the player's right, y up, z out of its front.
//
// The cassette, modelled standing beside the player, goes into the well with its hubs on the spindles. The body is
// cut in two at the deck (front case and back cover) and loses the well's floor and the modeller's stand-ins for the
// head, pinch roller, capstan and spindles; the cassette is split along its mid-plane. Then the insides are built from
// the truth sheet: the deck, the capstan and its flywheel, the belt and motor, the batteries, the pinch roller, the
// head, the take-up's slip clutch, the spindles, and inside the cassette the hubs, tape packs, guide rollers, tape and
// pressure pad. Packs are drawn a quarter of the way through side A of a C60, and the reels turn at the speeds that go
// with them.
import { surgery, solids, shapes, geometry, Part, materialKit, piecesOf, writeNodes, modelSpace, runChecks, beltPath } from '../../scripts/kit/index.mjs';

const { cut, pick, islands, islandBounds, readMesh, solidify, fromGeo, centroid, isEmpty } = surgery;
const { ring, hole } = solids;

const TAU = 2 * Math.PI;

/** The numbers that matter (mm, turns a second), from the truth sheet and the mesh. */
export const L = {
  /** The cassette moves into the well, 79.9 mm left (clear of the ledge that holds it in), its face just under the lid. */
  cassetteMove: [-79.9, 0, 0],
  /** After the move: the cassette's centre line, the mid-plane of its tape channel (9.89–17.39), its faces. */
  centreY: 18.14,
  midZ: 13.64,
  faces: [7.77, 19.51],
  wall: 1.0,
  supply: [0.05, 38.85],
  takeup: [0.05, -2.65],
  /** Tape: 4.7625 cm/s, 3.81 mm wide; drawn 0.12 mm thick (17 µm in life), in the shell's channel (x −30.4 to −28.3). */
  speed: 47.625,
  tapeWidth: 3.81,
  tapeX: -31.32,
  tapeThick: 0.12,
  hubR: 11,
  /** C60: 90 m × 17 µm = 1530 mm² of tape, a quarter played. */
  packArea: 1530,
  played: 0.25,
  rollerR: 2,
  rollerDY: 34.36,
  capstan: { r: 1.0, y: -5.8 },
  pinchR: 4.5,
  /** Behind the deck: belt planes and the pulleys' radii (the belts' pitch adds half their thickness). */
  deckZ: [6.6, 7.6],
  motor: { at: [-18, 16], rpm: 2400, pulley: 2.0, can: 8 },
  flywheelR: 11.84,
  belt: { thick: 0.6, z: [1.6, 3.0] },
  takeupBelt: { r: 0.35, z: -1.6, small: 1.2, big: 11.4 },
  /** Two AA cells (Ø 14.5 × 50.5 mm) behind the deck. */
  cells: { r: 7.25, len: 50.5, x: 3.5, ys: [47, 32.4], z: -5.6 },
};

/** Derived numbers: pack radii, every speed (turns a second), the tape path's points. */
export function derive() {
  const r0 = L.hubR;
  const pack = (f) => Math.sqrt(r0 * r0 + (f * L.packArea) / Math.PI);
  const takeupR = pack(L.played);
  const supplyR = pack(1 - L.played);
  const capstanTurns = L.speed / (TAU * L.capstan.r);
  const motorTurns = L.motor.rpm / 60;
  const beltPitch = L.belt.thick / 2;
  // The flywheel's rim is sized so the belt's pitch radii give the capstan its speed.
  const flywheelPitch = ((L.motor.pulley + beltPitch) * motorTurns) / capstanTurns;
  // The take-up belt is crossed, so the clutch turns the other way from the capstan, as the take-up reel must.
  const clutchTurns = -(capstanTurns * (L.takeupBelt.small + L.takeupBelt.r)) / (L.takeupBelt.big + L.takeupBelt.r);
  return {
    takeupR,
    supplyR,
    speeds: {
      motor: +motorTurns.toFixed(4),
      capstan: +capstanTurns.toFixed(4),
      pinch: +(-L.speed / (TAU * L.pinchR)).toFixed(4),
      clutch: +clutchTurns.toFixed(4),
      takeup: +(-L.speed / (TAU * takeupR)).toFixed(4),
      supply: +(-L.speed / (TAU * supplyR)).toFixed(4),
    },
    flywheelPitch,
    beltRatio: motorTurns / capstanTurns,
  };
}

/** Pairs that touch by design. */
export const CONTACTS = [
  ['deck', 'front_case'], ['deck', 'head'], ['deck', 'pinch_roller'], ['deck', 'flywheel'],
  ['belts', 'motor_pulley'], ['belts', 'flywheel'], ['belts', 'clutch'],
  ['motor', 'motor_pulley'], ['pinch_roller', 'pinch_wheel'],
  ['clutch', 'takeup_spindle'], ['deck', 'motor'], ['deck', 'batteries'],
  ['tape', 'supply_reel'], ['tape', 'takeup_reel'], ['tape', 'cassette_back'], ['tape', 'pressure_pad'],
  ['pressure_pad', 'cassette_back'], ['cassette_back', 'cassette_front'], ['deck', 'back_cover'],
];

const shifted = (mesh, t) => {
  for (let i = 0; i < mesh.positions.length; i += 3) for (let d = 0; d < 3; d++) mesh.positions[i + d] += t[d];
  return mesh;
};
const inBox = ([x, y, z], [x0, x1], [y0, y1], [z0, z1]) => x > x0 && x < x1 && y > y0 && y < y1 && z > z0 && z < z1;

/** A disc or ring on an axis along z through (x, y), from z0 to z1. */
const disc = (geo, [x, y], r, z0, z1, bore = 0, segments = 40) => solids.shaft(geo, 'z', [x, y, 0], [[r, z0], [r, z1]], { bore, segments });

/** The internal tangent between two circles: the points on each, `side` choosing which of the two. */
function internalTangent(c1, r1, c2, r2, side) {
  const d = [c2[0] - c1[0], c2[1] - c1[1]];
  const len = Math.hypot(...d);
  const base = Math.atan2(d[1], d[0]);
  const a = base + side * Math.acos((r1 + r2) / len);
  const n = [Math.cos(a), Math.sin(a)];
  return { p1: [c1[0] + r1 * n[0], c1[1] + r1 * n[1]], p2: [c2[0] - r2 * n[0], c2[1] - r2 * n[1]], n };
}
const arc = (c, r, from, to, steps = 24) => Array.from({ length: steps + 1 }, (_, i) => {
  const t = from + ((to - from) * i) / steps;
  return [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)];
});

/** A crossed belt round two pulleys at height z (it turns the second pulley the other way): round each pulley's far side,
 *  the two runs crossing between them, one a little above the other where they cross. 3D points. */
function crossedBelt(c1, r1, c2, r2, z, lift = 0.4) {
  const base = Math.atan2(c2[1] - c1[1], c2[0] - c1[0]);
  const phi = Math.acos((r1 + r2) / Math.hypot(c2[0] - c1[0], c2[1] - c1[1]));
  const at = (c, r, a) => [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
  const run = (p, q, sign) => Array.from({ length: 17 }, (_, i) => {
    const s = i / 16;
    return [p[0] + (q[0] - p[0]) * s, p[1] + (q[1] - p[1]) * s, z + sign * lift * Math.sin(Math.PI * s)];
  });
  const flat = (pts) => pts.map(([x, y]) => [x, y, z]);
  return [
    ...run(at(c1, r1, base + phi), at(c2, r2, base + phi + Math.PI), 1),
    ...flat(arc(c2, r2, base + phi + Math.PI, base + 3 * Math.PI - phi, 48)).slice(1),
    ...run(at(c2, r2, base + Math.PI - phi), at(c1, r1, base - phi), -1).slice(1),
    ...flat(arc(c1, r1, base - phi, base - 2 * Math.PI + phi, 16)).slice(1),
  ];
}

/** The tape's path in the plane: off the supply pack, round the top roller, down past the head and the capstan, round the
 *  bottom roller and onto the take-up pack (both reels turn clockwise from the front). */
export function tapePath({ takeupR, supplyR }) {
  const gap = L.tapeThick / 2 + 0.03;
  const rr = L.rollerR + gap;
  const top = [L.tapeX + rr, L.centreY + L.rollerDY];
  const bottom = [L.tapeX + rr, L.centreY - L.rollerDY];
  const up = internalTangent(L.supply, supplyR + gap, top, rr, 1);
  const down = internalTangent(bottom, rr, L.takeup, takeupR + gap, -1);
  const angle = (c, p) => Math.atan2(p[1] - c[1], p[0] - c[0]);
  let a0 = angle(top, up.p2);
  let a1 = Math.PI;
  const path = [up.p1, ...arc(top, rr, a0, a1)];
  a0 = Math.PI;
  a1 = angle(bottom, down.p1);
  while (a1 < a0) a1 += TAU;
  path.push(...arc(bottom, rr, a0, a1), down.p2);
  return { path, top, bottom };
}

export function buildInsides(D) {
  const { takeupR, supplyR, flywheelPitch } = D;
  const [z0, z1] = L.deckZ;
  const zm = L.midZ;
  const cap = [L.tapeX + L.tapeThick / 2 + 0.02 + L.capstan.r, L.capstan.y];
  const pinch = [L.tapeX - L.tapeThick / 2 - 0.02 - L.pinchR, L.capstan.y];
  const parts = [];
  const part = (name, opts) => {
    const p = new Part(name, opts);
    parts.push(p);
    return p;
  };

  // ---------------------------------------------------------------- the deck
  // The chassis plate the cassette sits over (its outline is set from the old floor in augment()), with the capstan's
  // bearing under it.
  const deck = part('deck');
  disc(deck.geo('steel'), cap, 2.0, 4.4, z0, 1.06);

  // -------------------------------------------------------------- the power
  const cells = part('batteries');
  for (const y of L.cells.ys) {
    const x0 = L.cells.x - L.cells.len / 2;
    const x1 = L.cells.x + L.cells.len / 2;
    solids.shaft(cells.geo('cell'), 'x', [0, y, L.cells.z], [[L.cells.r, x0 + 0.6], [L.cells.r, x1 - 1.2]]);
    solids.shaft(cells.geo('nickel'), 'x', [0, y, L.cells.z], [[L.cells.r - 0.4, x0], [L.cells.r - 0.4, x0 + 0.6]]);
    solids.shaft(cells.geo('nickel'), 'x', [0, y, L.cells.z], [[L.cells.r - 0.4, x1 - 1.2], [L.cells.r - 0.4, x1 - 1.0], [2.6, x1 - 1.0], [2.6, x1]]);
  }

  const { at: m, can, pulley } = L.motor;
  const motor = part('motor');
  disc(motor.geo('can'), m, can, -12, 0.0, 0, 48);
  disc(motor.geo('plastic'), m, can - 1.6, 0.0, 0.8, 0, 40);
  disc(motor.geo('plastic'), [m[0] - can + 1, m[1]], 0.8, -11, -9.5);
  const motorPulley = part('motor_pulley', { parent: 'motor' });
  disc(motorPulley.geo('steel'), m, 0.6, 0.8, 1.4, 0, 16);
  disc(motorPulley.geo('brass'), m, pulley, 1.4, 3.2, 0, 32);

  // --------------------------------------------------------------- the drive
  const belts = part('belts');
  const main = beltPath({ center: cap, r: flywheelPitch }, { center: m, r: pulley + L.belt.thick / 2 }, { samples: 96 });
  geometry.ribbon(belts.geo('rubber'), main.path, L.belt.thick, L.belt.z[0], L.belt.z[1]);
  const tb = L.takeupBelt;
  shapes.tube(belts.geo('rubber'), crossedBelt(cap, tb.small + tb.r, L.takeup, tb.big + tb.r, tb.z), tb.r, { segments: 8, caps: false });

  // The flywheel on the capstan's shaft: brass, with the belt's rim, a hub, and the small pulley for the take-up belt.
  // Its web has four holes, so its turning shows.
  const fly = part('flywheel');
  const webHoles = [0, 1, 2, 3].map((k) => hole(ring(2.4, cap[0] + 6.4 * Math.cos((k * TAU) / 4), cap[1] + 6.4 * Math.sin((k * TAU) / 4))));
  solids.plate(fly.geo('brass'), 'z', { outer: ring(L.flywheelR - 1.3, ...cap, 96), holes: [hole(ring(0.98, ...cap)), ...webHoles] }, 0.8, 2.0);
  disc(fly.geo('brass'), cap, L.flywheelR, 0.8, 3.8, L.flywheelR - 1.4, 96);
  disc(fly.geo('brass'), cap, 3.2, 2.0, 4.2, 0.98, 32);
  disc(fly.geo('steel'), cap, L.capstan.r, -3.0, 19.3, 0, 32);
  disc(fly.geo('brass'), cap, tb.small, -2.6, -0.6, 0, 24);

  // The pinch roller: rubber on a steel arm that pivots on a post at the deck's edge; a spring (not drawn) presses it in.
  const pivot = [-38.6, -1.0];
  const arm = part('pinch_roller');
  disc(arm.geo('steel'), pivot, 1.2, z1, 12.2, 0, 20);
  const dir = [pinch[0] - pivot[0], pinch[1] - pivot[1]];
  const len = Math.hypot(...dir);
  const nrm = [-dir[1] / len, dir[0] / len];
  const armOutline = [[...pivot.map((v, i) => v + nrm[i] * 1.8)], [pinch[0] + nrm[0] * 1.8, pinch[1] + nrm[1] * 1.8], [pinch[0] - nrm[0] * 1.8, pinch[1] - nrm[1] * 1.8], [...pivot.map((v, i) => v - nrm[i] * 1.8)]];
  solids.plate(arm.geo('steel'), 'z', { outer: geometry.ccw(armOutline) }, 10.4, 11.2);
  disc(arm.geo('steel'), pinch, 0.7, 11.2, 18.3, 0, 16);
  const wheel = part('pinch_wheel', { parent: 'pinch_roller' });
  solids.revolve(wheel.geo('rubber'), 'z', [pinch[0], pinch[1], 0], [[0.75, zm - 3], [L.pinchR - 0.3, zm - 3], [L.pinchR, zm - 2.7], [L.pinchR, zm + 2.7], [L.pinchR - 0.3, zm + 3], [0.75, zm + 3]], { segments: 48 });

  // ---------------------------------------------------------- the take-up
  // The slip clutch: the take-up belt's big pulley turns a felt ring; the spindle's collar sits on the felt and is
  // dragged round, slipping whenever the tape holds it back.
  const t = L.takeup;
  const clutch = part('clutch');
  const clutchHoles = [0, 1, 2].map((k) => hole(ring(2.2, t[0] + 7.2 * Math.cos((k * TAU) / 3 + 0.5), t[1] + 7.2 * Math.sin((k * TAU) / 3 + 0.5))));
  solids.plate(clutch.geo('brass'), 'z', { outer: ring(tb.big, ...t, 96), holes: [hole(ring(1.9, ...t)), ...clutchHoles] }, -2.6, -0.6);
  disc(clutch.geo('felt'), t, 6.0, -0.6, 0.2, 2.0, 40);
  disc(clutch.geo('steel'), t, 2.0, -4.2, -2.6, 0, 20);

  // Each spindle: a reel table sunk in the deck, six splines that turn the hub, a shaft through the deck.
  const spindle = (name, at, collar) => {
    const s = part(name);
    disc(s.geo('steel'), at, 1.5, collar ? 0.2 : 3.0, 7.0, 0, 20);
    if (collar) disc(s.geo('steel'), at, 3.0, 0.2, 1.0, 0, 32);
    else disc(s.geo('steel'), at, 3.0, 3.0, 3.8, 0, 32);
    disc(s.geo('white'), at, 6.2, 7.0, 7.55, 0, 40);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU;
      const c = [at[0] + 2.6 * Math.cos(a), at[1] + 2.6 * Math.sin(a)];
      solids.box(s.geo('white'), [c[0] - 0.45, c[0] + 0.45], [c[1] - 0.45, c[1] + 0.45], [7.55, 10.2], { axis: 'z' });
    }
    disc(s.geo('white'), at, 2.2, 7.55, 10.4, 0, 24);
    return s;
  };
  spindle('takeup_spindle', L.takeup, true);
  spindle('supply_spindle', L.supply, false);

  // ------------------------------------------------------------- the head
  const C = L.centreY;
  const head = part('head');
  const face = L.tapeX - L.tapeThick / 2 - 0.05;
  shapes.roundedBox(head.geo('chrome'), [face - 2.6, face], [C - 5, C + 5], [zm - 3.3, zm + 3.3], 1.1, { segments: 4 });
  shapes.roundedBox(head.geo('chrome'), [-39.2, face - 2.4], [C - 5.5, C + 5.5], [9.2, 18.3], 0.8, { segments: 3 });
  // The gap, where the tape's field is read: a dark hairline across the face, one core for each track of the pair.
  solids.box(head.geo('dark'), [face - 0.06, face + 0.01], [C - 0.08, C + 0.08], [zm - 1.7, zm + 1.7], { axis: 'z' });
  // The bracket on the deck, and the wires to the amplifier.
  solids.box(head.geo('steel'), [-41.5, -33.9], [C - 7.5, C + 7.5], [z1, 9.2], { axis: 'z' });
  void z0;
  for (const [k, dy] of [[0, -2], [1, -0.7], [2, 0.7], [3, 2]]) {
    shapes.tube(head.geo(k % 2 ? 'copper' : 'wire'), [[-39.2, C + dy, 15], [-40.4, C + dy, 15], [-41.6, C + dy, 13], [-42.4, C + dy, 10.5], [-42.6, C + dy, 9.4]], 0.22, { segments: 6 });
  }

  // ------------------------------------------------------- the cassette's insides
  const reel = (name, at, R, parent) => {
    const r = part(name, { parent });
    disc(r.geo('white'), at, L.hubR, zm - 2.3, zm + 2.3, 5.6, 64);
    disc(r.geo('tape'), at, R, zm - L.tapeWidth / 2, zm + L.tapeWidth / 2, L.hubR + 0.02, 96);
    return r;
  };
  reel('supply_reel', L.supply, supplyR, 'cassette_back');
  reel('takeup_reel', L.takeup, takeupR, 'cassette_back');

  const tape = part('tape', { parent: 'cassette_back' });
  const { path, top, bottom } = tapePath(D);
  geometry.ribbon(tape.geo('tape'), path, L.tapeThick, zm - L.tapeWidth / 2, zm + L.tapeWidth / 2);

  // The guide rollers turn on pins between the shell's halves; they belong to the back half here.
  const rollers = part('guide_rollers', { parent: 'cassette_back' });
  for (const c of [top, bottom]) {
    disc(rollers.geo('white'), c, L.rollerR, zm - 2.5, zm + 2.5, 0.65, 32);
    disc(rollers.geo('steel'), c, 0.6, zm - 3.4, zm + 3.4, 0, 12);
  }

  // The pressure pad: felt on a phosphor-bronze leaf spring, pressing the tape onto the head.
  const pad = part('pressure_pad', { parent: 'cassette_back' });
  const back = L.tapeX + L.tapeThick / 2 + 0.02;
  solids.box(pad.geo('felt'), [back, back + 1.4], [C - 2.6, C + 2.6], [zm - 1.9, zm + 1.9], { axis: 'z' });
  solids.box(pad.geo('bronze'), [back + 1.4, back + 1.7], [C - 7.5, C + 7.5], [zm - 2.2, zm + 2.2], { axis: 'z' });

  return { parts, cap, pinch, pivot, face };
}

export default async function augment(doc, { data, check = true, log = console.log } = {}) {
  const root = doc.getRoot();
  const scene = root.getDefaultScene() ?? root.listScenes()[0];
  const node = (name) => root.listNodes().find((n) => n.getName() === name);
  const lidNode = node('portable_cassette_player_lid');
  const bodyNode = node('portable_cassette_player');
  const tapeNode = node('portable_cassette_player_casette');
  const at = (n) => n.getTranslation().map((v) => v * 1000);
  const prim = (n, glass) => n.getMesh().listPrimitives().find((p) => (p.getMaterial()?.getName() ?? '').endsWith('_glass') === glass);
  const skin = prim(bodyNode, false).getMaterial();
  const glassMaterial = prim(bodyNode, true).getMaterial();

  const kit = materialKit(doc);
  const M = {
    steel: kit.material('cassette_steel', '#b9bec4', 1, 0.32),
    chrome: kit.material('cassette_head', '#d4d8dc', 1, 0.18),
    brass: kit.material('cassette_brass', '#c39a4c', 1, 0.33),
    rubber: kit.material('cassette_rubber', '#1d1e20', 0, 0.8),
    can: kit.material('cassette_motor_can', '#9ea4aa', 1, 0.42),
    plastic: kit.material('cassette_black_plastic', '#26282b', 0, 0.55),
    nickel: kit.material('cassette_cell_ends', '#c9ccce', 1, 0.3),
    cell: kit.material('cassette_cell', '#2c4a7a', 0.2, 0.45),
    felt: kit.material('cassette_felt', '#cdbf9f', 0, 0.95),
    white: kit.material('cassette_hub', '#e8e6df', 0, 0.5),
    tape: kit.material('cassette_tape', '#5b3a22', 0.1, 0.45),
    bronze: kit.material('cassette_bronze', '#b8875a', 1, 0.35),
    dark: kit.material('cassette_gap', '#141414', 0, 0.6),
    copper: kit.material('cassette_copper', '#b8673a', 1, 0.35),
    wire: kit.material('cassette_wire', '#9a2a22', 0, 0.5),
    caseInside: kit.material('cassette_case_inside', '#56696a', 0, 0.7),
    shellInside: kit.material('cassette_shell_inside', '#1f2022', 0, 0.6),
  };

  const pieces = new Map();
  const put = (name, mesh, material, generated = false) => {
    if (isEmpty(mesh)) return;
    if (!pieces.has(name)) pieces.set(name, []);
    pieces.get(name).push({ mesh, material, generated });
  };

  // ------------------------------------------------------------------ lid
  const lid = shifted(readMesh(prim(lidNode, false)), at(lidNode));
  put('lid', lid, skin);
  put('lid', fromGeo(solidify(lid, 0.8)), M.caseInside);
  put('lid', shifted(readMesh(prim(lidNode, true)), at(lidNode)), glassMaterial);

  // ----------------------------------------------------------------- body
  // Loose pieces in the well (the floor's decal, its screws, the stand-ins for spindles, posts, head, pinch roller and
  // capstan) go; the rest follow the half they sit in.
  const Z_CUT = L.deckZ[0];
  const body = shifted(readMesh(prim(bodyNode, false)), at(bodyNode));
  const ids = islands(body);
  const bounds = islandBounds(body, ids);
  const main = bounds.reduce((best, b, i) => (b && b.triangles > bounds[best].triangles ? i : best), 0);
  const WELL = { x: [-40, 31], y: [-36, 68] };
  bounds.forEach((b, i) => {
    if (!b || i === main) return;
    const inWell = b.min[0] > WELL.x[0] && b.max[0] < WELL.x[1] && b.min[1] > WELL.y[0] && b.max[1] < WELL.y[1] && b.min[2] > 6.0 && b.max[2] < 20;
    if (inWell) return;
    put(b.centre[2] > Z_CUT ? 'front_case' : 'back_cover', pick(body, (t) => ids[t] === i), skin);
  });
  // The shell: the well's floor and its bosses go (the deck takes their place), and so do the blocks the modeller put
  // where the head and pinch roller stand; then it is cut at the deck into the front case and the back cover.
  const floor = { x: [-35.6, 30.2], y: [-35.6, 69.6], z: [6.0, 8.85] };
  const transport = { x: [-44, -30], y: [-17.5, 28], z: [6.0, 19.0] };
  let floorBox = [[Infinity, Infinity], [-Infinity, -Infinity]];
  // Cut along the transport box's planes first, so what goes and what stays meet on clean edges.
  let mainMesh = pick(body, (t) => ids[t] === main);
  for (const f of [([x]) => x - transport.x[0], ([, y]) => y - transport.y[0], ([, y]) => y - transport.y[1], ([, , z]) => z - transport.z[1]]) mainMesh = cut(mainMesh, f);
  const shell = pick(mainMesh, (t) => {
    const c = centroid(mainMesh, t);
    if (inBox(c, floor.x, floor.y, floor.z)) {
      for (let k = 0; k < 3; k++) {
        const v = mainMesh.indices[t * 3 + k];
        const [x, y] = [mainMesh.positions[v * 3], mainMesh.positions[v * 3 + 1]];
        floorBox = [[Math.min(floorBox[0][0], x), Math.min(floorBox[0][1], y)], [Math.max(floorBox[1][0], x), Math.max(floorBox[1][1], y)]];
      }
      return false;
    }
    return !inBox(c, transport.x, transport.y, transport.z);
  });
  const halves = cut(shell, ([, , z]) => z - Z_CUT);
  const front = pick(halves, (t) => centroid(halves, t)[2] > Z_CUT);
  const backHalf = pick(halves, (t) => centroid(halves, t)[2] <= Z_CUT);
  put('front_case', front, skin);
  put('front_case', fromGeo(solidify(front, 1.0)), M.caseInside);
  put('back_cover', backHalf, skin);
  put('back_cover', fromGeo(solidify(backHalf, 1.0)), M.caseInside);
  put('front_case', shifted(readMesh(prim(bodyNode, true)), at(bodyNode)), glassMaterial);

  // ------------------------------------------------------------- cassette
  // Into the well; the shell split along its mid-plane; the modeller's tape plane goes (it is generated); the two hub
  // rings seen through the shell's holes turn with their reels.
  const move = at(tapeNode).map((v, i) => v + L.cassetteMove[i]);
  const cassette = shifted(readMesh(prim(tapeNode, false)), move);
  const cids = islands(cassette);
  const cb = islandBounds(cassette, cids);
  const shellIsland = cb.reduce((best, b, i) => (b && b.triangles > cb[best].triangles ? i : best), 0);
  cb.forEach((b, i) => {
    if (!b || i === shellIsland || b.size[0] < 1) return; // the flat tape plane is < 1 mm across
    put(b.centre[1] > L.centreY ? 'supply_reel' : 'takeup_reel', pick(cassette, (t) => cids[t] === i), skin);
  });
  // The model's tape channel is closed at its ends and its pinch-roller pockets are boxes; a real cassette is open there,
  // so the tape can run from the packs round the corner rollers. Those walls go.
  const OPEN = [{ x: [-31.75, -23.9], y: [35.8, 56.5] }, { x: [-31.75, -23.9], y: [-20.5, 0.6] }];
  const walled = pick(cassette, (t) => {
    if (cids[t] !== shellIsland) return false;
    const c = centroid(cassette, t);
    return !OPEN.some((o) => inBox(c, o.x, o.y, [10.1, 17.2]));
  });
  const cshell = cut(walled, ([, , z]) => z - L.midZ);
  for (const [name, keep] of [['cassette_front', (z) => z > L.midZ], ['cassette_back', (z) => z <= L.midZ]]) {
    const half = pick(cshell, (t) => keep(centroid(cshell, t)[2]));
    put(name, half, skin);
    put(name, fromGeo(solidify(half, L.wall)), M.shellInside);
  }

  // ----------------------------------------------------------- generated
  const D = derive();
  const built = buildInsides(D);
  // The deck plate: the old floor's outline (inset), and a tab under the radio's panel for the head and pinch roller.
  const [[fx0, fy0], [fx1, fy1]] = floorBox;
  const deck = built.parts.find((p) => p.name === 'deck');
  const e = 0.15;
  const outline = [[fx0 + e, fy0 + e], [fx1 - e, fy0 + e], [fx1 - e, fy1 - e], [fx0 + e, fy1 - e], [fx0 + e, 28], [-43.5, 28], [-43.5, -17.5], [fx0 + e, -17.5]];
  solids.plate(deck.geo('steel'), 'z', {
    outer: geometry.ccw(outline),
    holes: [hole(ring(1.06, ...built.cap)), hole(ring(6.6, ...L.takeup)), hole(ring(6.6, ...L.supply))],
  }, L.deckZ[0], L.deckZ[1]);

  piecesOf(built.parts, M, pieces);
  for (const name of ['lid', 'front_case', 'back_cover', 'cassette_front', 'cassette_back']) if (!pieces.has(name)) pieces.set(name, []);
  const parentOf = (n) => built.parts.find((p) => p.name === n)?.parent ?? (n === 'cassette_front' ? 'cassette_back' : undefined);
  writeNodes(doc, scene, pieces, { parts: [...built.parts, { name: 'cassette_front' }], parentOf });
  for (const n of [lidNode, bodyNode, tapeNode]) {
    n.getMesh()?.dispose();
    n.dispose();
  }

  const { toModel, space, mmPerUnit, realSize, unit } = modelSpace(scene);
  runChecks({ label: 'cassette player', pieces, contacts: CONTACTS, data, parentOf, mmPerUnit, check, log });
  log(`  cassette player: ${pieces.size} pieces, ${realSize.join(' × ')} mm; floor ${floorBox.flat().map((v) => v.toFixed(1)).join(', ')}`);

  const C = L.centreY;
  const zm = L.midZ;
  const { cap, pinch, pivot, face } = built;
  return {
    space,
    unitPerMm: unit(1),
    speeds: D.speeds,
    numbers: {
      capstanRpm: +(D.speeds.capstan * 60).toFixed(1),
      beltRatio: +D.beltRatio.toFixed(2),
      takeupR: +D.takeupR.toFixed(2),
      supplyR: +D.supplyR.toFixed(2),
      flywheelD: +(2 * L.flywheelR).toFixed(1),
      motorPulleyD: 2 * L.motor.pulley,
    },
    pivots: {
      motor: toModel([...L.motor.at, 0]),
      capstan: toModel([...cap, 10]),
      pinch: toModel([...pinch, zm]),
      clutch: toModel([...L.takeup, 0]),
      takeup: toModel([...L.takeup, zm]),
      supply: toModel([...L.supply, zm]),
    },
    anchors: {
      lid: toModel([0, 50, 23.2]),
      lid_window: toModel([0, 18, 23]),
      dial: toModel([-46, -12, 20.6]),
      radio_switch: toModel([-45.3, 33.5, 20.8]),
      keys: toModel([-5.8, 74.2, 0]),
      front_label: toModel([-10, -46, 20.4]),
      back: toModel([5, 20, -16.6]),
      cells: toModel([L.cells.x + 10, L.cells.ys[0] + 4, L.cells.z + L.cells.r]),
      cells_end: toModel([L.cells.x + L.cells.len / 2, L.cells.ys[1], L.cells.z]),
      motor: toModel([L.motor.at[0] + L.motor.can, L.motor.at[1], -5]),
      motor_pulley: toModel([L.motor.at[0], L.motor.at[1] + L.motor.pulley, 2.3]),
      belt: toModel([(L.motor.at[0] + cap[0]) / 2 + 6, (L.motor.at[1] + cap[1]) / 2 + 2, 2.3]),
      flywheel: toModel([cap[0] + L.flywheelR, cap[1], 2.3]),
      flywheel_face: toModel([cap[0] - 6, cap[1] - 6, 0.8]),
      capstan: toModel([cap[0], cap[1], 19]),
      capstan_low: toModel([cap[0], cap[1], 10]),
      capstan_tape: toModel([cap[0], cap[1], zm]),
      pinch: toModel([pinch[0] - L.pinchR, pinch[1], zm]),
      pinch_arm: toModel([pivot[0], pivot[1], 11.2]),
      head: toModel([-36, C, 18.3]),
      head_face: toModel([face, C, zm]),
      head_wires: toModel([-42.4, C, 10.5]),
      pad: toModel([face + 1.2, C, zm + 1.9]),
      pad_spring: toModel([L.tapeX + L.tapeThick / 2 + 1.6, C + 6.5, zm + 2.2]),
      tape_top: toModel([L.tapeX, C + 30, zm]),
      tape_mid: toModel([L.tapeX, C + 12, zm]),
      tape_low: toModel([L.tapeX, C - 33, zm]),
      roller_top: toModel([L.tapeX + L.rollerR, C + L.rollerDY + L.rollerR, zm]),
      roller_bottom: toModel([L.tapeX + L.rollerR, C - L.rollerDY - L.rollerR, zm]),
      supply_pack: toModel([L.supply[0] + D.supplyR, L.supply[1], zm]),
      takeup_pack: toModel([L.takeup[0] + D.takeupR, L.takeup[1], zm]),
      supply_hub: toModel([...L.supply, zm + 2.3]),
      takeup_hub: toModel([...L.takeup, zm + 2.3]),
      cassette: toModel([12, 50, L.faces[1]]),
      cassette_centre: toModel([0, C, L.faces[1]]),
      clutch: toModel([L.takeup[0] + L.takeupBelt.big, L.takeup[1], -1.6]),
      felt: toModel([L.takeup[0] + 6, L.takeup[1], -0.2]),
      takeup_table: toModel([L.takeup[0] + 6.2, L.takeup[1], 7.4]),
      supply_table: toModel([L.supply[0] + 6.2, L.supply[1], 7.4]),
      takeup_belt: toModel([cap[0] + ((L.takeup[0] - cap[0]) * (L.takeupBelt.small + L.takeupBelt.r)) / (L.takeupBelt.small + L.takeupBelt.big + 2 * L.takeupBelt.r), cap[1] + ((L.takeup[1] - cap[1]) * (L.takeupBelt.small + L.takeupBelt.r)) / (L.takeupBelt.small + L.takeupBelt.big + 2 * L.takeupBelt.r), -1.6]),
      deck: toModel([20, -30, L.deckZ[1]]),
      deck_centre: toModel([0, 18, L.deckZ[1]]),
      under_deck: toModel([-10, 0, 0]),
    },
  };
}
