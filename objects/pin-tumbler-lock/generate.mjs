// Build step for the pin tumbler lock (content/pin-tumbler-lock.json → build.generate): a Kwikset KW1 five-pin cylinder
// keyed 4-3-6-4-3, its key and a wrong one, in a Kwikset 660-type deadbolt whose bolt it throws. Millimetres in the lock's
// frame: the plug's axis is the z axis with its front face at z = 0 (the key goes in towards −z), y is up through the pin
// stacks, x to the right, towards the door's edge and the bolt.
//
// The lock trade's numbers (cut positions, depths, pin lengths, in inches) are in src/viewer/kw1.json, which the viewer's
// module (src/viewer/pintumbler.ts) and its charts read too, so the pins sit where the key's cuts put them, and the key's
// profile here is the one the viewer slides under the pins. The model rests with the right key fully in and every split
// on the shear line.
import { readFileSync } from 'node:fs';
import { geometry, solids, shapes, Part, assemble, modelSpace, runChecks } from '../../scripts/kit/index.mjs';

const { Geo, flat, circle } = geometry;
const KW1 = JSON.parse(readFileSync(new URL('../../src/viewer/kw1.json', import.meta.url), 'utf8'));
const IN = KW1.inch;
const D = KW1.drawn;

/** The plug's radius: its surface is the shear line. */
const PLUG_R = (KW1.plug / 2) * IN;
/** Cut depth + key pin length, the same for every number (.501"). */
const STACK = (KW1.depths[1] + KW1.keyPins[1]) * IN;
/** The key's bottom edge, from the plug's axis: .501" below the shear line. */
const BOTTOM = PLUG_R - STACK;
const PIN_R = (KW1.pin / 2) * IN;
const DRIVER = KW1.driver * IN;
const FLAT = KW1.flat * IN;
const BLANK = KW1.depths[0] * IN;
const CUT_S = KW1.cuts.map((c) => c * IN);
/** The pin stacks along the plug (z of each). */
const CUT_Z = CUT_S.map((s) => -s);
const depth = (cut) => KW1.depths[cut] * IN;
const keyPin = (cut) => KW1.keyPins[cut] * IN;
/** Where a key pin's point rests with no key in: its 45° point on the step between the keyway's two widths. */
const REST_TIP = D.ledge - (D.lowHalf - D.tipR);

/** The key's top edge, mm above its bottom edge, s mm from the shoulder: the blank, cut by a 90° cutter with a flat, and the tip's ramp. */
export function profile(bitting, s) {
  let h = BLANK;
  bitting.forEach((cut, i) => {
    h = Math.min(h, depth(cut) + Math.max(0, Math.abs(s - CUT_S[i]) - FLAT / 2));
  });
  return Math.min(h, D.tipHeight + ((D.blade - s) * (BLANK - D.tipHeight)) / D.tipLength);
}

export const L = {
  housing: { r: 9.5, ridge: 3.0, z: [-26.6, 0], counter: { r: 7.6, depth: 0.8 } },
  plug: { flange: 7.5, keywayEnd: -26.0, stub: [[5.0, -29.0], [5.0, -27.9], [4.4, -27.9], [4.4, -27.0], [5.0, -27.0], [5.0, -26.6]] },
  retainer: { r: [4.6, 7.4], z: [-27.8, -27.1], gap: 160 },
  tailpiece: { x: 0.75, y: 3.8, z: [-60, -28.6] },
  coils: 8,
  coil: { r: 1.15, wire: 0.15 },
  /** The deadbolt: its middle plane, the crank's radius (a quarter turn throws the bolt 25.4 mm), the backset. */
  latch: { z: D.latchZ, crank: D.throw / Math.SQRT2, backset: 60.3, boltR: 11, tube: [11.2, 12.4], plates: 12.5 },
  /** The wrong key lies beside the lock, this far to the left. */
  park: -D.aside,
};
L.latch.rest = (-45 * Math.PI) / 180;
L.latch.pin = [L.latch.crank * Math.sin(L.latch.rest), L.latch.crank * Math.cos(L.latch.rest)];

/** Pairs that touch by design; the clash check fails on any other contact. */
export const CONTACTS = [
  ['plug', 'housing'],
  ['key', 'plug'],
  ['key_pin_*', 'key'],
  ['driver_*', 'key_pin_*'],
  ['coil_*', 'coil_*'],
  ['spring_cover', 'housing'],
  ['tailpiece', 'plug'],
  ['latch_cover', 'latch_case'],
];

// ------------------------------------------------------------------ helpers

/** A plain mesh (from surgery) back into a Geo. */
function toGeo(mesh) {
  const geo = new Geo();
  geo.positions = [...mesh.positions];
  geo.normals = [...mesh.normals];
  geo.uvs = mesh.uvs ? [...mesh.uvs] : new Array((mesh.positions.length / 3) * 2).fill(0);
  geo.indices = [...mesh.indices];
  return geo;
}
const fromGeo = (geo) => ({ positions: [...geo.positions], normals: [...geo.normals], uvs: [...geo.uvs], indices: [...geo.indices] });

/** Samples from a to b: `fine` apart within `half` of any of `at`, `coarse` apart elsewhere. */
function samples(a, b, at, half, fine, coarse) {
  const out = [a];
  let t = a;
  while (t < b - 1e-9) {
    const near = at.some((c) => Math.abs(t - c) < half + coarse);
    t = Math.min(b, t + (near ? fine : coarse));
    out.push(t);
  }
  return out;
}

/** A cylinder's surface about the z axis, radius r, through angles `thetas` (from +x towards +y) and stations `zs`, facing out (or in). */
function cylinderGrid(geo, r, thetas, zs, inward = false) {
  const s = inward ? -1 : 1;
  const ids = thetas.map((t) => zs.map((z) => geo.vertex([r * Math.cos(t), r * Math.sin(t), z], [s * Math.cos(t), s * Math.sin(t), 0], [t * r, z])));
  for (let j = 0; j < thetas.length - 1; j++) {
    for (let k = 0; k < zs.length - 1; k++) {
      const [a, b, c, d] = [ids[j][k], ids[j + 1][k], ids[j + 1][k + 1], ids[j][k + 1]];
      if (inward) geo.quad(a, d, c, b);
      else geo.quad(a, b, c, d);
    }
  }
  return geo;
}

/** A round hole's wall, axis along y at (0, z0): from y = bottom(x) up to y = top(x), facing in. */
function holeWall(geo, z0, r, bottom, top, segments = 40) {
  const ring = [];
  for (let i = 0; i <= segments; i++) {
    const phi = (i / segments) * Math.PI * 2;
    const x = r * Math.cos(phi);
    const z = z0 + r * Math.sin(phi);
    const n = [-Math.cos(phi), 0, -Math.sin(phi)];
    ring.push([geo.vertex([x, bottom(x), z], n), geo.vertex([x, top(x), z], n)]);
  }
  for (let i = 0; i < segments; i++) geo.quad(ring[i][0], ring[i + 1][0], ring[i + 1][1], ring[i][1]);
}

/** A flat rectangle facing `n` through four corners (any order round it). */
function face(geo, corners, n) {
  const ids = corners.map((p) => geo.vertex(p, n));
  geo.tri(ids[0], ids[1], ids[2], n);
  geo.tri(ids[0], ids[2], ids[3], n);
}

/** A flat face across y at height y (facing dir ±1), outline and holes given as [x, z] loops. */
function flatY(geo, outer, holes, y, dir) {
  const local = new Geo();
  const toLocal = (loop) => loop.map(([x, z]) => [x, -z]);
  flat(local, { outer: toLocal(outer), holes: holes.map(toLocal) }, y, dir);
  solids.put(geo, local, 'y');
}

/** An arc of points (x, y) about the origin from angle a to b. */
const arc = (r, a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n).map((t) => [r * Math.cos(t), r * Math.sin(t)]);

/** The plug's section through its keyway: a circle with the keyway's notch, open at the bottom. */
function keywaySection(r) {
  const lo = Math.asin(D.lowHalf / r);
  const pts = arc(r, -Math.PI / 2 + lo, (3 * Math.PI) / 2 - lo, 72);
  pts.push([-D.lowHalf, D.ledge], [-D.highHalf, D.ledge], [-D.highHalf, D.ceiling], [D.highHalf, D.ceiling], [D.highHalf, D.ledge], [D.lowHalf, D.ledge]);
  return pts;
}

// -------------------------------------------------------------------- parts

function plug() {
  const part = new Part('plug');
  const g = part.geo('brass');
  const R = PLUG_R;
  const kEnd = L.plug.keywayEnd;
  const front = -L.housing.counter.depth;
  // The surface along the keyway, fine where the pin holes are cut through it, so they come out round.
  const lo = Math.asin(D.lowHalf / R);
  const thetas = samples(-Math.PI / 2 + lo, (3 * Math.PI) / 2 - lo, [Math.PI / 2], 0.28, 0.022, 0.07);
  const zs = samples(kEnd, front, CUT_Z, 1.7, 0.22, 0.9);
  let mesh = fromGeo(cylinderGrid(new Geo(), R, thetas, zs));
  mesh = shapes.openHoles(mesh, CUT_Z.map((z) => ({ axis: 'y', level: R, depth: 2.5, sdf: shapes.sdCircle(0, z, D.holeR) })));
  g.append(toGeo(mesh));
  // The keyway's walls, the step the key pins rest on, and its roof with the five holes.
  const yc = -Math.sqrt(R * R - D.lowHalf ** 2);
  for (const s of [-1, 1]) {
    face(g, [[s * D.lowHalf, yc, kEnd], [s * D.lowHalf, D.ledge, kEnd], [s * D.lowHalf, D.ledge, front], [s * D.lowHalf, yc, front]], [-s, 0, 0]);
    face(g, [[s * D.lowHalf, D.ledge, kEnd], [s * D.highHalf, D.ledge, kEnd], [s * D.highHalf, D.ledge, front], [s * D.lowHalf, D.ledge, front]], [0, 1, 0]);
    face(g, [[s * D.highHalf, D.ledge, kEnd], [s * D.highHalf, D.ceiling, kEnd], [s * D.highHalf, D.ceiling, front], [s * D.highHalf, D.ledge, front]], [-s, 0, 0]);
  }
  const roof = [[-D.highHalf, kEnd], [D.highHalf, kEnd], [D.highHalf, front], [-D.highHalf, front]];
  flatY(g, roof, CUT_Z.map((z) => circle(D.holeR, 0, z, 40)), D.ceiling, -1);
  // The pin holes, from the roof up to the surface.
  for (const z of CUT_Z) holeWall(g, z, D.holeR, () => D.ceiling, (x) => Math.sqrt(R * R - x * x));
  // The front flange (the keyway through it), the solid tail behind the keyway, and the stub the retainer clips round.
  solids.plate(g, 'z', { outer: keywaySection(L.plug.flange) }, front, 0, { chamfer: 0.2, chamferBottom: 0 });
  solids.shaft(g, 'z', [0, 0, 0], [[R, L.housing.z[0]], [R, kEnd]], { segments: 72 });
  solids.shaft(g, 'z', [0, 0, 0], L.plug.stub, { segments: 48 });
  return part;
}

function housing() {
  const part = new Part('housing');
  const g = part.geo('brass');
  const { r: RO, ridge: W } = L.housing;
  const [z0, z1] = L.housing.z;
  const cz = -L.housing.counter.depth;
  const Rb = D.boreR;
  const top = D.chamberTop;
  // The bore, with the five chambers drilled up out of its top.
  const thetas = samples(0, Math.PI * 2, [Math.PI / 2], 0.27, 0.022, 0.07);
  const zs = samples(z0, cz, CUT_Z, 1.7, 0.22, 0.9);
  let mesh = fromGeo(cylinderGrid(new Geo(), Rb, thetas, zs, true));
  mesh = shapes.openHoles(mesh, CUT_Z.map((z) => ({ axis: 'y', level: Rb, depth: 2.5, sdf: shapes.sdCircle(0, z, D.holeR) })));
  g.append(toGeo(mesh));
  // The counterbore the plug's flange sits in.
  cylinderGrid(g, L.housing.counter.r, samples(0, Math.PI * 2, [], 0, 0.1, 0.1), [cz, z1], true);
  flat(g, { outer: circle(L.housing.counter.r, 0, 0, 72), holes: [circle(Rb, 0, 0, 72)] }, cz, 1);
  // The outside: round, with the ridge the chambers are drilled through.
  const a = Math.asin(W / RO);
  cylinderGrid(g, RO, samples(Math.PI / 2 + a, (5 * Math.PI) / 2 - a, [], 0, 0.08, 0.08), [z0, z1]);
  const yW = Math.sqrt(RO * RO - W * W);
  for (const s of [-1, 1]) face(g, [[s * W, yW, z0], [s * W, top, z0], [s * W, top, z1], [s * W, yW, z1]], [s, 0, 0]);
  flatY(g, [[-W, z0], [W, z0], [W, z1], [-W, z1]], CUT_Z.map((z) => circle(D.holeR, 0, z, 40)), top, 1);
  for (const z of CUT_Z) holeWall(g, z, D.holeR, (x) => Math.sqrt(Rb * Rb - x * x), () => top);
  // Its two ends.
  const outline = [[W, yW], [W, top], [-W, top], ...arc(RO, Math.PI / 2 + a, (5 * Math.PI) / 2 - a, 80)];
  flat(g, { outer: outline, holes: [circle(L.housing.counter.r, 0, 0, 72)] }, z1, 1);
  flat(g, { outer: outline, holes: [circle(Rb, 0, 0, 72)] }, z0, -1);
  return part;
}

function springCover() {
  const part = new Part('spring_cover');
  const g = part.geo('brass');
  const W = L.housing.ridge;
  const top = D.chamberTop;
  const [z0, z1] = [CUT_Z[4] - 3.4, CUT_Z[0] + 3.4];
  solids.box(g, [-W - 0.4, W + 0.4], [top, top + 0.45], [z0, z1], { axis: 'y', chamfer: 0.1 });
  for (const s of [-1, 1]) solids.box(g, s < 0 ? [-W - 0.4, -W] : [W, W + 0.4], [top - 1.6, top], [z0, z1], { axis: 'y' });
  return part;
}

/** The key pins of one key, each resting on its cut, under the plug (they turn with it). */
function keyPins(bitting) {
  const group = new Part('key_pins', { parent: 'plug' });
  const pins = bitting.map((cut, i) => {
    const part = new Part(`key_pin_${i + 1}`, { parent: 'key_pins' });
    const tip = BOTTOM + depth(cut);
    const topY = tip + keyPin(cut);
    const cone = PIN_R - D.tipR;
    solids.revolve(part.geo('pin'), 'y', [0, 0, CUT_Z[i]], [[0, tip], [D.tipR, tip], [PIN_R, tip + cone], [PIN_R, topY - 0.22], [PIN_R - 0.22, topY], [0, topY]], { segments: 28 });
    return part;
  });
  return [group, ...pins];
}

function drivers() {
  const group = new Part('driver_pins');
  const pins = CUT_Z.map((z, i) => {
    const part = new Part(`driver_${i + 1}`, { parent: 'driver_pins' });
    const y0 = PLUG_R;
    solids.revolve(part.geo('driver'), 'y', [0, 0, z], [[0, y0], [PIN_R - 0.15, y0], [PIN_R, y0 + 0.15], [PIN_R, y0 + DRIVER - 0.15], [PIN_R - 0.15, y0 + DRIVER], [0, y0 + DRIVER]], { segments: 28 });
    return part;
  });
  return [group, ...pins];
}

/** Each spring as eight separate coils, so it can close up and open out as the stack under it moves. */
function springs() {
  const group = new Part('springs');
  const { r, wire } = L.coil;
  const y0 = PLUG_R + DRIVER + wire;
  const y1 = D.chamberTop - wire;
  const pitch = (y1 - y0) / L.coils;
  const coils = [];
  CUT_Z.forEach((z, i) => {
    for (let k = 0; k < L.coils; k++) {
      const part = new Part(`coil_${i + 1}_${k}`, { parent: 'springs' });
      shapes.tube(part.geo('steel'), shapes.helix('y', [0, 0, z], r, y0 + k * pitch, y0 + (k + 1) * pitch, 1, 22), wire, { segments: 8 });
      coils.push(part);
    }
  });
  return [group, ...coils];
}

function retainer() {
  const part = new Part('retainer');
  const [ri, ro] = L.retainer.r;
  const half = ((L.retainer.gap / 2) * Math.PI) / 180;
  const a = -Math.PI / 2 + half;
  const b = (3 * Math.PI) / 2 - half;
  const loop = [...arc(ro, a, b, 60), ...arc(ri, b, a, 60)];
  solids.plate(part.geo('steel'), 'z', { outer: loop }, ...L.retainer.z, { chamfer: 0.08, chamferBottom: 0.08 });
  return part;
}

function tailpiece() {
  const part = new Part('tailpiece', { parent: 'plug' });
  const { x, y, z } = L.tailpiece;
  solids.box(part.geo('steel'), [-x, x], [-y, y], z, { axis: 'z', chamfer: 0.15 });
  return part;
}

/** A key: its blade cut to `bitting`, the shoulder that stops it at the plug's face, the bow; `dx` to the side. */
function key(name, bitting, material, dx = 0, parent) {
  const part = new Part(name, { parent });
  const g = part.geo(material);
  const t = D.bladeHalf;
  // The blade's outline in (z, y): along the cut edge from the shoulder to the tip, back along the bottom.
  const loop = [];
  for (let s = 0; s <= D.blade + 1e-9; s += 0.1) loop.push([-s, BOTTOM + profile(bitting, s)]);
  loop.push([-D.blade, BOTTOM + 1.0], [-D.blade + 1.0, BOTTOM], [3.0, BOTTOM], [3.0, BOTTOM + BLANK + 2.0], [0.05, BOTTOM + BLANK + 2.0], [0.05, BOTTOM + BLANK]);
  const local = new Geo();
  solids.plate(local, 'x', { outer: loop }, -t, t, { chamfer: 0.12, chamferBottom: 0.12 });
  // The bow, with its hole.
  solids.plate(local, 'x', { outer: shapes.roundRect(15, 0, 25.5, 25, 6), holes: [geometry.cw(circle(2.6, 22.5, 0, 32))] }, -t, t, { chamfer: 0.35, chamferBottom: 0.35 });
  g.append(local, (p, n) => [[p[0] + dx, p[1], p[2]], n]);
  return part;
}

function latch() {
  const { z: zc, crank, backset, boltR, tube, plates } = L.latch;
  const [px, py] = L.latch.pin;
  const zb = zc - plates;
  const zf = zc + plates;
  // The case: a back plate, two posts, the tube to the door's edge and the faceplate.
  const casePart = new Part('latch_case');
  const c = casePart.geo('nickel');
  const plateOutline = shapes.roundRect(0.5, 5.5, 41, 37, 3);
  const slot = geometry.cw(solids.rect([-1.3, 1.3], [-4.6, 4.6]));
  solids.plate(c, 'z', { outer: plateOutline, holes: [slot] }, zb - 1, zb, { chamfer: 0.2, chamferBottom: 0.2 });
  for (const [x, y] of [[-18.4, 22.4], [-16.5, -10]]) solids.shaft(c, 'z', [x, y, 0], [[1.4, zb], [1.4, zf]], { segments: 20 });
  solids.shaft(c, 'x', [0, 0, zc], [[tube[1], 21], [tube[1], backset - 1.5]], { bore: tube[0], segments: 64 });
  solids.plate(c, 'x', { outer: shapes.roundRect(zc, 0, 25.4, 57.2, 3), holes: [geometry.cw(circle(tube[0], zc, 0, 64)), geometry.cw(circle(1.8, zc, 22, 20)), geometry.cw(circle(1.8, zc, -22, 20))] }, backset - 1.5, backset, { chamfer: 0.25 });
  // The cover: the plate on the cylinder's side.
  const cover = new Part('latch_cover', { parent: 'latch_case' });
  solids.plate(cover.geo('nickel'), 'z', { outer: plateOutline, holes: [slot] }, zf, zf + 1, { chamfer: 0.2, chamferBottom: 0.2 });
  // The drive: a hub on the tailpiece, an arm and the crank pin, at rest 45° to the left of the top.
  const drive = new Part('drive', { parent: 'latch_case' });
  const d = drive.geo('steel');
  const hub = [zc - 1.5, zc + 1.5];
  solids.plate(d, 'z', { outer: circle(6, 0, 0, 48), holes: [geometry.cw(solids.rect([-0.95, 0.95], [-4.0, 4.0]))] }, ...hub, { chamfer: 0.2, chamferBottom: 0.2 });
  const ux = px / crank;
  const uy = py / crank;
  const w = 2.5;
  solids.plate(d, 'z', { outer: [[ux * 4 + uy * w, uy * 4 - ux * w], [px + uy * w, py - ux * w], [px - uy * w, py + ux * w], [ux * 4 - uy * w, uy * 4 + ux * w]] }, ...hub);
  solids.plate(d, 'z', { outer: circle(w, px, py, 32) }, ...hub);
  solids.shaft(d, 'z', [px, py, 0], [[1.5, zc - 5], [1.5, hub[1]]], { segments: 20 });
  // The bolt: a round slug in the tube, a bar back to the yoke whose slot the crank pin drives.
  const bolt = new Part('bolt', { parent: 'latch_case' });
  const b = bolt.geo('nickel');
  const boltBack = backset - 38;
  solids.shaft(b, 'x', [0, 0, zc], [[boltR, boltBack], [boltR, backset - 0.8], [boltR - 0.8, backset]], { segments: 64 });
  const yokeZ = [zc - 4.6, zc - 2.0];
  solids.box(b, [px + 4, boltBack + 0.7], [7.0, 9.5], yokeZ, { axis: 'z', chamfer: 0.15 });
  solids.plate(b, 'z', { outer: solids.rect([px - 4, px + 4], [7.0, 21.0], 1), holes: [geometry.cw(solids.rect([px - 1.65, px + 1.65], [11.0, 19.6]))] }, ...yokeZ, { chamfer: 0.15, chamferBottom: 0.15 });
  return [casePart, cover, drive, bolt];
}

export function buildParts() {
  return [
    plug(),
    ...keyPins(KW1.keys.right),
    tailpiece(),
    key('key', KW1.keys.right, 'brass', 0, 'plug'),
    key('wrong_key', KW1.keys.wrong, 'nickel', L.park),
    housing(),
    springCover(),
    ...drivers(),
    ...springs(),
    retainer(),
    ...latch(),
  ];
}

export default async function generate({ data, check = true, log = console.log } = {}) {
  const parts = buildParts();
  const { doc, scene, nodes, pieces, parentOf } = await assemble({
    name: 'pin-tumbler-lock',
    parts,
    materials: (doc, { material }) => ({
      brass: material('pin-tumbler-lock_brass', '#c9a24e', 1, 0.3),
      pin: material('pin-tumbler-lock_pin', '#d8b45c', 1, 0.24),
      // Drawn nickel-silver, so the split between the brass key pin and its driver shows.
      driver: material('pin-tumbler-lock_driver', '#cfd0cb', 1, 0.22),
      nickel: material('pin-tumbler-lock_nickel', '#c4c6c2', 1, 0.26),
      steel: material('pin-tumbler-lock_steel', '#8e9399', 1, 0.36),
    }),
  });
  const { toModel, unit, space, mmPerUnit, realSize } = modelSpace(scene);
  runChecks({ label: 'pin-tumbler-lock', pieces, contacts: CONTACTS, data, parentOf, mmPerUnit, check, log });
  log(`  pin-tumbler-lock: ${nodes.size} nodes, ${realSize.join(' × ')} mm`);
  const { z: zc, crank, backset } = L.latch;
  const [px, py] = L.latch.pin;
  const stack = (i) => {
    const cut = KW1.keys.right[i];
    const tip = BOTTOM + depth(cut);
    return { tip: toModel([0, tip, CUT_Z[i]]), shear: toModel([0, PLUG_R, CUT_Z[i]]), driverTop: toModel([0, PLUG_R + DRIVER, CUT_Z[i]]), spring: toModel([0, (PLUG_R + DRIVER + D.chamberTop) / 2, CUT_Z[i]]), side: toModel([L.housing.ridge, PLUG_R + 1.5, CUT_Z[i]]) };
  };
  return {
    doc,
    hints: {
      space,
      /** Model units per millimetre, for the controls' slides (which run in mm). */
      perMm: unit(1),
      /** How far each coil of a spring moves for 1 mm of its stack: the bottom coil nearly as far, the top one hardly. */
      coilShare: Array.from({ length: L.coils }, (_, k) => +(1 - (k + 0.5) / L.coils).toFixed(4)),
      pivots: { plug: toModel([0, 0, 0]), drive: toModel([0, 0, zc]) },
      anchors: {
        plug_face: toModel([0, -3.6, 0.05]),
        plug_top: toModel([0, PLUG_R, CUT_Z[2]]),
        keyway: toModel([0, BOTTOM + 4, 0.1]),
        key_bow: toModel([D.bladeHalf, 0, 18]),
        key_blade: toModel([D.bladeHalf, BOTTOM + 5, 4]),
        key_tip: toModel([0, BOTTOM + 4, -D.blade]),
        wrong_bow: toModel([L.park + D.bladeHalf, 0, 18]),
        wrong_blade: toModel([L.park + D.bladeHalf, BOTTOM + 6, -12]),
        housing_top: toModel([0, D.chamberTop, CUT_Z[0] + 2]),
        housing_side: toModel([-L.housing.r, 0, -13]),
        cover_top: toModel([0, D.chamberTop + 0.45, CUT_Z[2]]),
        shear_line: toModel([0, PLUG_R, CUT_Z[1]]),
        shear_side: toModel([-PLUG_R, 0.6, CUT_Z[1]]),
        stacks: CUT_Z.map((_, i) => stack(i)),
        retainer: toModel([L.retainer.r[1], 0, L.retainer.z[1]]),
        tail_start: toModel([0, 0, L.tailpiece.z[1]]),
        tail_mid: toModel([0, L.tailpiece.y, -36]),
        tail_end: toModel([0, 0, L.tailpiece.z[0]]),
        drive: toModel([0, 0, zc + 1.5]),
        crank_pin: toModel([px, py, zc - 2]),
        bolt_back: toModel([backset - 38, 0, zc]),
        bolt_face: toModel([backset, 0, zc]),
        bolt_top: toModel([backset - 6, L.latch.boltR, zc]),
        latch_face: toModel([backset, 18, zc]),
        latch_plate: toModel([-10, -6, zc + L.latch.plates + 1]),
        hand: toModel([0, 0, 28]),
      },
      numbers: { crank, throw: D.throw, backset, plugR: PLUG_R, stack: STACK, restTip: REST_TIP },
    },
  };
}
