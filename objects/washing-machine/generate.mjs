// Build step for the washing machine (content/washing-machine.json → build.generate): a European
// front-loader of 7 kg and 1400 rpm, built whole in code. Millimetres, x to the right, y up, z towards
// the front; the floor is y = 0 and the drum turns about a line front to back at y = L.axis.
//
// What hangs together: the tub (two halves) hangs on two springs from the cabinet's top and stands on two
// friction dampers; the drum turns in it on two bearings, driven by a belt from a motor bolted under the
// tub; a concrete block on the tub's top makes the whole swinging mass heavy. Water comes in through a
// valve and the detergent drawer, is heated in the sump and leaves through the drain pump.
import sharp from 'sharp';
import { geometry, solids, shapes, Part, assemble, modelSpace, runChecks, smoothPath, beltPath } from '../../scripts/kit/index.mjs';

const { Geo, lathe, turned, ribbon, alongAxis, signedArea, ccw: ccwLoop } = geometry;
const TAU = Math.PI * 2;

/** The numbers that matter (mm). The content builder gets them through the hints. */
export const L = {
  W: 595,
  H: 850,
  sheet: 1.5,
  base: 25,
  top: 835,
  front: 295,
  back: -295,
  axis: 440,
  drum: { r: 235, z0: -210, z1: 118, mouth: 158, lifterH: 45 },
  tub: { r: 265, wall: 6, z0: -250, split: 0, z1: 175, mouth: 178, hub: 60, bore: 26, hubBack: -272 },
  door: { r: 232, open: 168, glass: 158 },
  shaft: 12.5,
  pulley: { r: 140, z: [-288, -276] },
  motor: { at: [-30, 115], r: 55, z: [-232, -62], pulley: 13 },
  springs: { x: 200, z: -80, top: 812 },
  dampers: { base: [225, 25], top: [120, 192], z: -40 },
  counterweight: { x: 200, z: [30, 245], top: 742 },
  dispenser: { x: [-274, -102], y: [752, 828], z: [-40, 262] },
  fascia: { y: [745, 835], z: [270, 298] },
  pump: { at: [190, 70, 190], r: 38 },
};
const AX = L.axis;
/** y of a circle of radius r round the drum's axis, above (+1) or below (−1) it, at x. */
const onCircle = (r, x, side = 1) => AX + side * Math.sqrt(Math.max(0, r * r - x * x));

/** Pairs that touch by design: parts on their mounts, the belt on its pulleys, the shaft in its bearings. */
export const CONTACTS = [
  ['side_*', 'frame'], ['back_panel', 'frame'], ['side_*', 'back_panel'], ['side_*', 'front_panel'], ['side_*', 'fascia'],
  ['top_lid', 'frame'], ['top_lid', 'side_*'], ['top_lid', 'back_panel'], ['top_lid', 'fascia'], ['fascia', 'front_panel'], ['fascia', 'frame'], ['front_panel', 'frame'],
  ['door', 'front_panel'], ['door', 'bellows'], ['bellows', 'front_panel'], ['bellows', 'tub_front'], ['tub_front', 'tub_rear'],
  ['counterweight', 'tub_front'], ['front_weight', 'tub_front'], ['springs', 'frame'], ['springs', 'tub_rear'],
  ['dampers', 'frame'], ['dampers', 'tub_rear'], ['motor', 'tub_rear'], ['motor_rotor', 'motor'],
  ['belt', 'pulley'], ['belt', 'motor_rotor'], ['bearings', 'tub_rear'], ['bearings', 'spider'], ['pulley', 'spider'],
  ['spider', 'drum'], ['heater', 'tub_front'], ['hoses', 'tub_front'], ['hoses', 'tub_rear'], ['hoses', 'dispenser'],
  ['hoses', 'inlet_valve'], ['hoses', 'drain_pump'], ['hoses', 'back_panel'], ['inlet_valve', 'back_panel'],
  ['drawer', 'dispenser'], ['control_board', 'fascia'], ['drain_pump', 'frame'], ['dispenser', 'frame'],
];

// ------------------------------------------------------------------- helpers

/** A profile of [r, z] points as an outline turned counter-clockwise, so the lathe's normals face out. */
const ccw = (profile) => (signedArea(profile) < 0 ? [...profile].reverse() : profile);

/** A lathe about a line along z through (x, y). */
function turnedAlongZ(geo, [x, y], profile, opts = {}) {
  const local = new Geo();
  lathe(local, ccw(profile), { segments: 72, ...opts });
  solids.put(geo, local, 'z', [x, y, 0]);
}

/** A plate across z from an outline in (x, y), whichever way round the outline was written. */
const plateZ = (geo, outer, z0, z1, holes) => solids.plate(geo, 'z', { outer: ccwLoop(outer), holes }, z0, z1);

/** A strut (turned along its own axis) from point a to point b: stations are [radius, fraction of the length]. */
function strut(geo, a, b, stations, segments = 20) {
  const d = b.map((v, i) => v - a[i]);
  const len = Math.hypot(...d);
  const local = new Geo();
  turned(local, stations.map(([r, f]) => [r, f * len]), { segments });
  geo.append(local, alongAxis(d.map((v) => v / len), a));
}

/** A hose along a smooth path through `points`. */
const hose = (geo, points, r, steps = 10) => shapes.tube(geo, smoothPath(points, { steps }), r, { segments: 14 });

/** Points on a radial bar round the axis at angle a: (distance along it, offset across it). */
const radial = (a, [cx, cy] = [0, AX]) => (r, w) => [cx + r * Math.cos(a) - w * Math.sin(a), cy + r * Math.sin(a) + w * Math.cos(a)];

/** The drum's perforation: a staggered field of 3.5 mm holes, as a texture tiled round the mantle. */
async function perforation() {
  const dot = (x, y) => `<circle cx="${x}" cy="${y}" r="10" fill="#2a2c2e"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="#ffffff"/>${dot(64, 64)}${dot(0, 0)}${dot(128, 0)}${dot(0, 128)}${dot(128, 128)}</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

// ------------------------------------------------------------------- parts

export function buildParts() {
  const parts = [];
  const add = (name, opts) => {
    const p = new Part(name, opts);
    parts.push(p);
    return p;
  };
  const { W, H, sheet, base, top, front, back } = L;
  const hw = W / 2;
  const t = L.tub;
  const inner = t.r - t.wall;

  // ---- cabinet: a frame (base, corner posts, top rails with the springs' brackets) and its panels
  const frame = add('frame');
  const fsteel = frame.geo('steel');
  const inside = hw - sheet;
  solids.box(fsteel, [-inside, inside], [15, base], [back + sheet, front - 15], { axis: 'y' });
  for (const sx of [-1, 1]) {
    const rail = sx < 0 ? [-inside, -inside + 20] : [inside - 20, inside];
    solids.box(fsteel, rail, [L.springs.top + 3, top], [back + sheet, L.fascia.z[0] - 2], { axis: 'y' });
    solids.box(fsteel, rail, [base, L.springs.top + 3], [back + sheet, back + sheet + 20], { axis: 'y' });
    solids.box(fsteel, rail, [base, L.fascia.y[0]], [front - 23, front - 3], { axis: 'y' });
    const span = sx < 0 ? [-inside + 20, -L.springs.x + 10] : [L.springs.x - 10, inside - 20];
    solids.box(fsteel, span, [L.springs.top, L.springs.top + 18], [L.springs.z - 15, L.springs.z + 15], { axis: 'y' });
    for (const sz of [-1, 1]) solids.shaft(frame.geo('rubber'), 'y', [sx * 255, 0, sz * 250], [[17, 0], [17, 8], [10, 8], [10, 15]]);
  }
  solids.box(add('side_left').geo('enamel'), [-hw, -inside], [15, top], [back, front - 3], { axis: 'x' });
  solids.box(add('side_right').geo('enamel'), [inside, hw], [15, top], [back, front - 3], { axis: 'x' });
  solids.box(add('back_panel').geo('enamel'), [-inside, inside], [15, top], [back, back + sheet], { axis: 'z' });

  const topLid = add('top_lid');
  shapes.roundedBox(topLid.geo('enamel'), [-hw, hw], [top, H], [back, front + 4], 4);

  // ---- front: the panel with the door's opening, the fascia with its dial, the door
  const frontPanel = add('front_panel');
  solids.plate(frontPanel.geo('enamel'), 'z', { outer: solids.rect([-hw, hw], [15, L.fascia.y[0]], 2), holes: [solids.hole(solids.ring(L.door.open, 0, AX, 96))] }, front - 3, front);
  solids.box(frontPanel.geo('fascia'), [148, 252], [28, 112], [front, front + 2], { round: 6, axis: 'z' });

  const fascia = add('fascia');
  const [fy0, fy1] = L.fascia.y;
  const [fz0, fz1] = L.fascia.z;
  solids.plate(fascia.geo('fascia'), 'z', { outer: solids.rect([-hw, hw], [fy0, fy1], 3), holes: [solids.hole(solids.rect([-280, -105], [755, 825], 4))] }, fz0, fz1);
  turnedAlongZ(fascia.geo('chrome'), [180, 790], [[34, fz1], [37, fz1], [37, fz1 + 4], [34, fz1 + 4]]);
  plateZ(fascia.geo('fascia'), shapes.flutes(31, 1.2, 36, { a: 180, b: 790 }), fz1, fz1 + 24);
  solids.box(fascia.geo('ink'), [178, 182], [800, 818], [fz1 + 24, fz1 + 25], { axis: 'z' });
  solids.shaft(fascia.geo('steel'), 'z', [180, 790, 0], [[4, 262], [4, fz0]]);
  solids.box(fascia.geo('display'), [30, 120], [772, 808], [fz1, fz1 + 1.5], { round: 3, axis: 'z' });
  for (const bx of [38, 66, 94, 122]) solids.shaft(fascia.geo('chrome'), 'z', [bx, 757, 0], [[5.5, fz1], [5.5, fz1 + 3]]);

  const door = add('door');
  const g = L.door.glass;
  turnedAlongZ(door.geo('fascia'), [0, AX], [[g + 2, front], [L.door.r, front], [L.door.r, front + 30], [L.door.r - 18, front + 46], [g + 26, front + 46], [g + 2, front + 34]]);
  turnedAlongZ(door.geo('chrome'), [0, AX], [[g + 24, front + 46], [L.door.r - 16, front + 46], [L.door.r - 16, front + 49], [g + 24, front + 49]]);
  turnedAlongZ(door.geo('glass'), [0, AX], [[0, 232], [112, 232], [140, 262], [g, 300], [g, front + 36], [g - 6, front + 36], [g - 6, 302], [134, 266], [108, 238], [0, 238]]);
  for (const hy of [AX - 120, AX + 120]) solids.box(door.geo('chrome'), [-L.door.r + 4, -L.door.r + 30], [hy - 18, hy + 18], [front, front + 22], { round: 3, axis: 'z' });

  // ---- the drawer and its housing
  const dispenser = add('dispenser');
  const [dx0, dx1] = L.dispenser.x;
  const [dy0, dy1] = L.dispenser.y;
  const [dz0, dz1] = L.dispenser.z;
  const dg = dispenser.geo('plastic');
  solids.box(dg, [dx0, dx1], [dy1 - 3, dy1], [dz0, dz1], { axis: 'y' });
  solids.box(dg, [dx0, dx1], [dy0, dy0 + 3], [dz0, dz1], { axis: 'y' });
  solids.box(dg, [dx0, dx0 + 3], [dy0, dy1], [dz0, dz1], { axis: 'x' });
  solids.box(dg, [dx1 - 3, dx1], [dy0, dy1], [dz0, dz1], { axis: 'x' });
  solids.box(dg, [dx0, dx1], [dy0, dy1], [dz0, dz0 + 3], { axis: 'z' });
  solids.shaft(dg, 'y', [-200, 0, -18], [[13, dy0 - 18], [13, dy0]]);
  solids.box(dispenser.geo('steel'), [-hw + sheet + 20, dx0], [L.springs.top + 3, dy1], [60, 120], { axis: 'y' });

  const drawer = add('drawer');
  const wg = drawer.geo('plastic');
  const [wx0, wx1, wy0, wy1, wz0] = [dx0 + 6, dx1 - 6, dy0 + 6, dy1 - 10, dz0 + 10];
  solids.box(drawer.geo('fascia'), [-278, -107], [757, 823], [fz1 - 4, fz1 + 6], { round: 4, axis: 'z' });
  solids.box(wg, [wx0, wx1], [wy0, wy0 + 2.5], [wz0, fz1 - 4], { axis: 'y' });
  solids.box(wg, [wx0, wx0 + 2.5], [wy0, wy1], [wz0, fz1 - 4], { axis: 'x' });
  solids.box(wg, [wx1 - 2.5, wx1], [wy0, wy1], [wz0, fz1 - 4], { axis: 'x' });
  solids.box(wg, [wx0, wx1], [wy0, wy1], [wz0, wz0 + 2.5], { axis: 'z' });
  for (const cx of [-222, -164]) solids.box(wg, [cx, cx + 2], [wy0, wy1 - 12], [wz0, fz1 - 20], { axis: 'x' });

  // ---- the tub, in two halves that clamp together, with the bearings in its rear hub
  const tubFront = add('tub_front');
  turnedAlongZ(tubFront.geo('tub'), [0, AX], [[t.mouth - 6, t.z1 + 15], [t.mouth - 6, t.z1 - t.wall], [inner, t.z1 - t.wall], [inner, t.split], [t.r, t.split], [t.r, t.z1], [t.mouth, t.z1], [t.mouth, t.z1 + 15]]);
  turnedAlongZ(tubFront.geo('tub'), [0, AX], [[t.r, t.split], [t.r + 8, t.split], [t.r + 8, t.split + 10], [t.r, t.split + 10]]);
  solids.shaft(tubFront.geo('tub'), 'y', [0, 0, 60], [[14, onCircle(t.r, 0, -1) - 16], [14, onCircle(inner, 0, -1) + 1]]);

  const tubRear = add('tub_rear');
  turnedAlongZ(tubRear.geo('tub'), [0, AX], [[inner, t.split], [inner, t.z0 + t.wall], [t.bore, t.z0 + t.wall], [t.bore, t.hubBack], [t.hub, t.hubBack], [t.hub, t.z0], [t.r, t.z0], [t.r, t.split]]);
  turnedAlongZ(tubRear.geo('tub'), [0, AX], [[t.r, t.split - 10], [t.r + 8, t.split - 10], [t.r + 8, t.split], [t.r, t.split]]);
  for (let k = 0; k < 6; k++) {
    const p = radial((k / 6) * TAU + TAU / 12);
    plateZ(tubRear.geo('tub'), [p(t.hub, -5), p(t.r - 4, -5), p(t.r - 4, 5), p(t.hub, 5)], t.z0 - 12, t.z0);
  }
  for (const sx of [-1, 1]) {
    const x = sx * L.springs.x;
    solids.box(tubRear.geo('tub'), [x - 9, x + 9], [onCircle(t.r, x) - 6, onCircle(t.r, x) + 14], [L.springs.z - 9, L.springs.z + 9], { axis: 'y' });
    const [dxT, dyT] = L.dampers.top;
    solids.box(tubRear.geo('tub'), [sx * dxT - 10, sx * dxT + 10], [dyT - 4, onCircle(t.r, sx * dxT, -1) + 6], [L.dampers.z - 12, L.dampers.z + 12], { axis: 'y' });
  }
  solids.shaft(tubRear.geo('tub'), 'y', [-150, 0, -18], [[13, onCircle(t.r, -150) - 6], [13, onCircle(t.r, -150) + 12]]);
  const [mx, my] = L.motor.at;
  for (const lz of [L.motor.z[0] + 25, L.motor.z[1] - 25]) {
    solids.box(tubRear.geo('tub'), [mx - 14, mx + 14], [my + L.motor.r - 2, onCircle(t.r, mx, -1) + 4], [lz - 10, lz + 10], { axis: 'y' });
  }

  const bearings = add('bearings', { parent: 'tub_rear' });
  for (const [z0, z1] of [[t.hubBack + 1, t.hubBack + 11], [t.hubBack + 12, t.z0 + t.wall - 1]]) {
    turnedAlongZ(bearings.geo('steel'), [0, AX], [[L.shaft, z0], [t.bore, z0], [t.bore, z1], [L.shaft, z1]]);
  }

  // ---- the drum: a perforated mantle, a lipped front, a back plate, three lifters, and the spider
  const d = L.drum;
  const drum = add('drum');
  for (const start of [0, Math.PI]) {
    turnedAlongZ(drum.geo('perforated'), [0, AX], [[d.r - 2, d.z1], [d.r - 2, d.z0], [d.r, d.z0], [d.r, d.z1], [d.r - 2, d.z1]], { start, length: Math.PI, segments: 48 });
  }
  turnedAlongZ(drum.geo('stainless'), [0, AX], [[d.r, d.z1], [215, d.z1 + 12], [175, d.z1 + 20], [d.mouth + 2, d.z1 + 24], [d.mouth - 1, d.z1 + 22], [d.mouth - 1, d.z1 + 18], [173, d.z1 + 16], [213, d.z1 + 8], [d.r - 2, d.z1 - 2]]);
  turnedAlongZ(drum.geo('stainless'), [0, AX], [[0, d.z0 - 2], [d.r, d.z0 - 2], [d.r, d.z0], [0, d.z0]]);
  for (let k = 0; k < 3; k++) {
    const a = TAU / 4 + (k / 3) * TAU;
    const pt = (r, da) => [r * Math.cos(a + da), AX + r * Math.sin(a + da)];
    const rb = d.r - 2.5;
    const rt = d.r - d.lifterH;
    plateZ(drum.geo('lifter'), [pt(rb, -0.16), pt(rb - 10, -0.12), pt(rt, -0.05), pt(rt - 3, 0), pt(rt, 0.05), pt(rb - 10, 0.12), pt(rb, 0.16)], d.z0 + 6, d.z1 - 6);
  }

  const spider = add('spider', { parent: 'drum' });
  const sz0 = d.z0 - 22;
  const sz1 = d.z0 - 2;
  for (let k = 0; k < 3; k++) {
    const p = radial(TAU / 4 + (k / 3) * TAU);
    plateZ(spider.geo('aluminium'), [p(30, -30), p(d.r - 12, -14), p(d.r - 4, 0), p(d.r - 12, 14), p(30, 30)], sz0 + 4, sz1);
  }
  turnedAlongZ(spider.geo('aluminium'), [0, AX], [[0, sz0], [44, sz0], [48, sz1], [0, sz1]]);
  solids.shaft(spider.geo('steel'), 'z', [0, AX, 0], [[L.shaft, back + sheet + 2.5], [L.shaft, sz0]]);

  // ---- drive: the drum's pulley on the shaft, the belt, the motor bolted under the tub
  const pulley = add('pulley');
  const [pz0, pz1] = L.pulley.z;
  const pr = L.pulley.r;
  const ribs = [];
  for (let i = 0; i <= 10; i++) ribs.push([pr - (i % 2 ? 2.2 : 0), pz0 + ((pz1 - pz0) * i) / 10]);
  turnedAlongZ(pulley.geo('aluminium'), [0, AX], [[pr - 12, pz0], ...ribs, [pr - 12, pz1]]);
  turnedAlongZ(pulley.geo('aluminium'), [0, AX], [[L.shaft, pz0 - 1.5], [26, pz0 - 1.5], [26, pz1 + 2], [L.shaft, pz1 + 2]]);
  for (let k = 0; k < 5; k++) {
    const p = radial((k / 5) * TAU);
    plateZ(pulley.geo('aluminium'), [p(24, -9), p(pr - 11, -6), p(pr - 11, 6), p(24, 9)], pz0 + 3, pz1 - 3);
  }

  const motor = add('motor');
  const [mz0, mz1] = L.motor.z;
  const mr = L.motor.r;
  const bore = L.shaft * 0.7;
  turnedAlongZ(motor.geo('motor'), [mx, my], [[bore, mz0], [mr, mz0], [mr, mz1], [bore, mz1], [bore, mz1 - 4], [mr - 4, mz1 - 4], [mr - 4, mz0 + 4], [bore, mz0 + 4]]);
  turnedAlongZ(motor.geo('copper'), [mx, my], [[42, mz0 + 30], [mr - 4.5, mz0 + 30], [mr - 4.5, mz1 - 30], [42, mz1 - 30]]);
  for (const sx of [-1, 1]) solids.box(motor.geo('carbon'), [mx + sx * 30 - 7, mx + sx * 30 + 7], [my - 7, my + 7], [mz0 - 16, mz0], { axis: 'z' });

  const motorRotor = add('motor_rotor', { parent: 'motor' });
  turnedAlongZ(motorRotor.geo('copper'), [mx, my], [[0, mz0 + 26], [36, mz0 + 26], [36, mz1 - 26], [0, mz1 - 26]]);
  solids.shaft(motorRotor.geo('steel'), 'z', [mx, my, 0], [[bore, pz0], [bore, mz1 - 6]]);
  turnedAlongZ(motorRotor.geo('aluminium'), [mx, my], [[bore, pz0], [L.motor.pulley, pz0], [L.motor.pulley - 1.5, (pz0 + pz1) / 2], [L.motor.pulley, pz1], [bore, pz1]]);

  const belt = add('belt');
  const { path } = beltPath({ center: [0, AX], r: pr + 2 }, { center: [mx, my], r: L.motor.pulley + 2 }, { samples: 96 });
  ribbon(belt.geo('rubber'), path, 4, pz0 + 1, pz1 - 1);

  // ---- suspension: springs from the cabinet's top, friction dampers from its base, the counterweight
  const springs = add('springs');
  for (const sx of [-1, 1]) {
    const x = sx * L.springs.x;
    const y0 = onCircle(t.r, x) + 14;
    const y1 = L.springs.top;
    const coil = shapes.helix('y', [x, 0, L.springs.z], 15, y0 + 14, y1 - 14, 13, 18);
    shapes.tube(springs.geo('steel'), [[x, y0, L.springs.z], [x + 15, y0 + 10, L.springs.z], ...coil, [x + 15, y1 - 10, L.springs.z], [x, y1, L.springs.z]], 2, { segments: 8 });
  }

  const dampers = add('dampers');
  for (const sx of [-1, 1]) {
    const a = [sx * L.dampers.base[0], L.dampers.base[1], L.dampers.z];
    const b = [sx * L.dampers.top[0], L.dampers.top[1], L.dampers.z];
    strut(dampers.geo('damper'), a, b, [[9, 0], [9, 0.06], [14, 0.08], [14, 0.6], [6, 0.62], [5, 0.64], [5, 0.94], [9, 0.96], [9, 1]]);
  }

  const counterweight = add('counterweight');
  const cw = L.counterweight;
  const arc = [];
  for (let i = 0; i <= 24; i++) {
    const x = -cw.x + (2 * cw.x * i) / 24;
    arc.push([x, onCircle(t.r + 1, x)]);
  }
  plateZ(counterweight.geo('concrete'), [...arc, [cw.x, cw.top - 6], [cw.x - 6, cw.top], [-cw.x + 6, cw.top], [-cw.x, cw.top - 6]], ...cw.z);
  for (const bx of [-60, 60]) solids.shaft(counterweight.geo('steel'), 'y', [bx, 0, 100], [[9, cw.top], [9, cw.top + 4]]);

  // A second block round the tub's mouth, open at the bottom where the heater's terminals come out; it rides
  // with the tub's front half. At 2.3 kg a litre each block weighs about 12.5 kg, as spares catalogues list
  // them: 25 kg together.
  const frontWeight = add('front_weight', { parent: 'tub_front' });
  const ring = (r, a0, a1) => Array.from({ length: 41 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / 40;
    return [r * Math.cos(a), AX + r * Math.sin(a)];
  });
  const [ra0, ra1] = [-Math.PI / 3, (4 * Math.PI) / 3];
  plateZ(frontWeight.geo('concrete'), [...ring(260, ra0, ra1), ...ring(196, ra1, ra0)], t.z1, t.z1 + 72);
  for (const a of [Math.PI / 2, Math.PI / 12, (11 * Math.PI) / 12]) solids.shaft(frontWeight.geo('steel'), 'z', [228 * Math.cos(a), AX + 228 * Math.sin(a), 0], [[9, t.z1 + 72], [9, t.z1 + 76]]);

  const bellows = add('bellows');
  turnedAlongZ(bellows.geo('rubber'), [0, AX], [
    [t.mouth, t.z1 + 2], [t.mouth + 8, t.z1 + 2], [t.mouth + 8, t.z1 + 16], [174, 210], [150, 236], [150, 252], [176, 274], [L.door.open + 16, front - 4], [L.door.open + 16, front + 4],
    [L.door.open - 4, front + 4], [L.door.open - 4, front - 6], [168, 276], [146, 255], [146, 233], [170, 208], [t.mouth, t.z1 + 14],
  ]);

  // ---- water: the inlet valve, the heater in the sump, the drain pump, the hoses between them
  const valve = add('inlet_valve');
  solids.box(valve.geo('plastic'), [120, 200], [782, 812], [back + sheet, back + 30], { round: 4, axis: 'z' });
  for (const cx of [140, 180]) solids.shaft(valve.geo('coil'), 'y', [cx, 0, back + 18], [[13, 812], [13, 828]]);
  solids.shaft(valve.geo('brass'), 'z', [160, 797, 0], [[9, back - 14], [9, back + sheet]]);
  solids.shaft(valve.geo('plastic'), 'z', [160, 797, 0], [[7, back + 30], [7, back + 44]]);

  const heater = add('heater', { parent: 'tub_front' });
  const hy = onCircle(inner, 0, -1) + 11;
  const hz0 = -150;
  const hz1 = t.z1 + 6;
  const bend = [];
  for (let i = 1; i < 12; i++) {
    const a = Math.PI + (i / 12) * Math.PI;
    bend.push([22 * Math.cos(a), hy, hz0 + 22 * Math.sin(a)]);
  }
  shapes.tube(heater.geo('steel'), [[-22, hy, hz1], [-22, hy, hz0], ...bend, [22, hy, hz0], [22, hy, hz1]], 4, { segments: 10 });
  solids.box(heater.geo('steel'), [-34, 34], [hy - 13, hy + 13], [t.z1, t.z1 + 7], { round: 4, axis: 'z' });
  for (const tx of [-22, 22]) solids.shaft(heater.geo('brass'), 'z', [tx, hy, 0], [[3.5, t.z1 + 7], [3.5, t.z1 + 20]]);

  const pump = add('drain_pump');
  const [px, py, pz] = L.pump.at;
  const R = L.pump.r;
  turnedAlongZ(pump.geo('pump'), [px, py], [[0, pz - 30], [R, pz - 30], [R, pz + 30], [26, pz + 30], [26, pz + 26], [R - 3, pz + 26], [R - 3, pz - 26], [0, pz - 26]]);
  turnedAlongZ(pump.geo('pump'), [px, py], [[0, pz - 90], [28, pz - 90], [28, pz - 30], [0, pz - 30]]);
  turnedAlongZ(pump.geo('fascia'), [px, py], [[0, pz + 30], [30, pz + 30], [30, front - 10], [0, front - 10]]);
  solids.box(pump.geo('fascia'), [px - 18, px + 18], [py - 4, py + 4], [front - 10, front - 4], { axis: 'z' });
  solids.shaft(pump.geo('pump'), 'y', [px, 0, pz], [[12, py + R - 2], [12, py + R + 14]]);
  solids.shaft(pump.geo('pump'), 'x', [0, py, pz], [[10, px + R - 2], [10, px + R + 16]]);
  solids.box(pump.geo('steel'), [px - 34, px + 34], [base, py - R + 2], [pz - 50, pz + 10], { axis: 'y' });

  const impeller = add('pump_impeller', { parent: 'drain_pump' });
  for (let k = 0; k < 4; k++) {
    const p = radial((k / 4) * TAU, [px, py]);
    plateZ(impeller.geo('impeller'), [p(5, -1.5), p(30, -1.5), p(30, 1.5), p(5, 1.5)], pz - 22, pz + 18);
  }
  turnedAlongZ(impeller.geo('impeller'), [px, py], [[0, pz - 24], [7, pz - 24], [7, pz + 20], [0, pz + 20]]);

  const hoses = add('hoses');
  const tubBottom = onCircle(t.r, 0, -1);
  // Valve → drawer housing, along the top.
  hose(hoses.geo('rubber'), [[160, 797, back + 44], [160, 800, -170], [-60, 812, -160], [-150, 815, -120], [-150, 815, dz0]], 7);
  // Drawer housing → tub, a corrugated hose.
  hose(hoses.geo('rubber'), [[-200, dy0 - 18, -18], [-200, dy0 - 40, -18], [-170, onCircle(t.r, -150) + 34, -18], [-150, onCircle(t.r, -150) + 12, -18]], 13);
  // Sump → pump, under the tub.
  hose(hoses.geo('rubber'), [[0, tubBottom - 16, 60], [0, tubBottom - 40, 60], [110, 112, 80], [px, py + R + 30, pz - 40], [px, py + R + 14, pz]], 14);
  // Pump → out of the back, rising above the water so the tub doesn't siphon empty.
  hose(hoses.geo('rubber'), [[px + R + 16, py, pz], [262, 62, 120], [266, 66, -120], [262, 150, back + 22], [262, 700, back + 22], [258, 800, back + 19], [246, 812, back + sheet]], 10);

  // ---- the controls: the board behind the fascia
  const board = add('control_board');
  solids.box(board.geo('pcb'), [20, 270], [760, 792], [258, 262], { axis: 'z' });
  for (const [x0, x1, y0, y1] of [[40, 80, 766, 786], [100, 118, 768, 780], [140, 190, 770, 788], [210, 250, 764, 774]]) {
    solids.box(board.geo('ink'), [x0, x1], [y0, y1], [250, 258], { axis: 'z' });
  }

  return parts;
}

export default async function generate({ data, check = true, log = console.log } = {}) {
  const parts = buildParts();
  const holes = await perforation();
  const { doc, scene, nodes, pieces, parentOf } = await assemble({
    name: 'washing_machine',
    parts,
    materials: (doc, { material, textured, glass, tile }) => {
      const perforated = textured('washer_drum_holes', holes, 1, 0.3);
      tile(perforated.getBaseColorTextureInfo(), [32, 56]);
      return {
        enamel: material('washer_enamel', '#f3f3f0', 0, 0.32),
        fascia: material('washer_fascia', '#e9e9e6', 0, 0.45),
        chrome: material('washer_chrome', '#d9dadb', 1, 0.16),
        display: material('washer_display', '#1d2428', 0, 0.12),
        ink: material('washer_ink', '#222426', 0, 0.5),
        glass: glass('washer_glass', '#dfe8ec'),
        plastic: material('washer_plastic', '#f0f0ec', 0, 0.55),
        tub: material('washer_tub', '#5d6268', 0, 0.62),
        perforated,
        stainless: material('washer_stainless', '#d2d5d8', 1, 0.26),
        lifter: material('washer_lifter', '#c7cacd', 0.6, 0.4),
        aluminium: material('washer_aluminium', '#b9bec3', 1, 0.42),
        steel: material('washer_steel', '#9fa5ab', 1, 0.34),
        rubber: material('washer_rubber', '#2b2d2f', 0, 0.82),
        concrete: material('washer_concrete', '#a7a49c', 0, 0.95),
        damper: material('washer_damper', '#3a3d41', 0.3, 0.55),
        motor: material('washer_motor', '#45494e', 0.7, 0.45),
        copper: material('washer_copper', '#b87333', 1, 0.38),
        carbon: material('washer_carbon', '#1e1f20', 0, 0.7),
        coil: material('washer_coil', '#2f4f8f', 0, 0.5),
        brass: material('washer_brass', '#c49a45', 1, 0.35),
        pump: material('washer_pump', '#c8cbcf', 0, 0.5),
        impeller: material('washer_impeller', '#d9883a', 0, 0.5),
        pcb: material('washer_pcb', '#2e6b3d', 0, 0.6),
      };
    },
  });
  const { toModel, space, mmPerUnit, realSize, unit } = modelSpace(scene);
  runChecks({ label: 'washing machine', pieces, contacts: CONTACTS, data, parentOf, mmPerUnit, check, log });
  log(`  washing machine: ${nodes.size} nodes, ${realSize.join(' × ')} mm`);

  const t = L.tub;
  const inner = t.r - t.wall;
  const [mx, my] = L.motor.at;
  const [px, py, pz] = L.pump.at;
  const mid = (a, b) => (a + b) / 2;
  return {
    doc,
    hints: {
      space,
      pivots: { drum: toModel([0, AX, 0]), motor: toModel([mx, my, 0]), impeller: toModel([px, py, pz]) },
      anchors: {
        door: toModel([L.door.r - 30, AX + 80, L.front + 46]),
        glass: toModel([0, AX + 60, 300]),
        drawer: toModel([-190, 823, L.fascia.z[1] + 6]),
        dial: toModel([180, 821, L.fascia.z[1] + 24]),
        board: toModel([150, 792, 260]),
        drum_mouth: toModel([0, AX + L.drum.mouth, L.drum.z1 + 24]),
        drum_centre: toModel([0, AX, 0]),
        suspension_left: toModel([-200, 420, -60]),
        lifter: toModel([0, AX + L.drum.r - L.drum.lifterH, 40]),
        drum_top: toModel([0, AX + L.drum.r, -40]),
        drum_back: toModel([0, AX + 120, L.drum.z0 - 2]),
        spider: toModel([0, AX + 140, L.drum.z0 - 22]),
        shaft: toModel([0, AX, L.pulley.z[0] - 4]),
        bearings: toModel([0, AX + t.hub, t.hubBack + 6]),
        pulley: toModel([0, AX + L.pulley.r, L.pulley.z[0]]),
        pulley_side: toModel([L.pulley.r, AX, mid(...L.pulley.z)]),
        belt_mid: toModel([mid(mx, L.pulley.r) + 8, mid(my, AX), L.pulley.z[0]]),
        motor_pulley: toModel([mx, my - L.motor.pulley, L.pulley.z[0]]),
        motor: toModel([mx, my + L.motor.r, mid(...L.motor.z)]),
        motor_side: toModel([mx - L.motor.r, my, mid(...L.motor.z)]),
        tub_top: toModel([0, AX + t.r, -120]),
        tub_bottom: toModel([0, AX - t.r, -60]),
        spring_left: toModel([-L.springs.x - 15, mid(onCircle(t.r, L.springs.x), L.springs.top), L.springs.z]),
        spring_right: toModel([L.springs.x + 15, mid(onCircle(t.r, L.springs.x), L.springs.top), L.springs.z]),
        damper_left: toModel([-mid(L.dampers.base[0], L.dampers.top[0]) - 12, mid(L.dampers.base[1], L.dampers.top[1]), L.dampers.z]),
        damper_right: toModel([mid(L.dampers.base[0], L.dampers.top[0]) + 12, mid(L.dampers.base[1], L.dampers.top[1]), L.dampers.z]),
        counterweight: toModel([0, L.counterweight.top, 100]),
        bellows: toModel([0, AX + 176, 274]),
        heater: toModel([0, onCircle(inner, 0, -1) + 15, 60]),
        heater_flange: toModel([0, onCircle(inner, 0, -1) + 24, t.z1 + 7]),
        sump: toModel([0, onCircle(t.r, 0, -1) - 16, 60]),
        pump: toModel([px, py + L.pump.r, pz]),
        pump_filter: toModel([px, py, L.front - 4]),
        pump_out: toModel([px + L.pump.r + 16, py, pz]),
        drain_low: toModel([266, 66, -120]),
        drain_back: toModel([262, 400, L.back + 22]),
        drain_top: toModel([258, 800, L.back + 19]),
        valve: toModel([160, 812, L.back + 20]),
        valve_in: toModel([160, 797, L.back - 14]),
        fill_top: toModel([-60, 812, -160]),
        dispenser_in: toModel([-150, 815, L.dispenser.z[0]]),
        dispenser: toModel([-190, 828, 120]),
        dispenser_out: toModel([-200, L.dispenser.y[0] - 18, -18]),
        tub_inlet: toModel([-150, onCircle(t.r, -150) + 12, -18]),
        top_lid: toModel([0, L.H, 0]),
        front_panel: toModel([-200, 120, L.front]),
      },
      ratio: +(L.pulley.r / L.motor.pulley).toFixed(3),
      drumRadius: L.drum.r,
      drumLitres: +(Math.PI * (L.drum.r / 1000) ** 2 * ((L.drum.z1 - L.drum.z0) / 1000) * 1000).toFixed(1),
      unitPerMm: unit(1),
    },
  };
}
