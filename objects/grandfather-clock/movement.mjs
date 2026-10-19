// The grandfather clock's movement, built from the truth sheet's numbers: an English eight-day going train
// (great wheel 96, centre 60/8, third 56/8, escape 30/7, after the British Museum's Draper and Markwick clocks), a
// recoil anchor escapement, a seconds pendulum 994 mm long, 12 : 1 motion work (36, 36/6, 72, after its Knibb), the
// driving weight on its pulley and gut line, and the frame (plates, pillars, back cock, seatboard). The strike train
// is left out. Millimetres in the source model's frame: x to the clock's right, y up from the floor, z out through
// the dial. The hands' arbor and the going winding square are where the Poly Haven dial has them.
import { geometry, gears, solids, shapes, Part, meshPhase } from '../../scripts/kit/index.mjs';

const { Geo, extrude, contours, sd, circle, cw } = geometry;
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

const centreY = 1731.94;
/** The going side's winding square, in the dial (mesh): the barrel's arbor ends in it. */
const windX = 58;

/** Teeth, from the truth sheet (§4). */
export const TEETH = { great: 96, centrePinion: 8, centre: 60, thirdPinion: 8, third: 56, escapePinion: 7, escape: 30, cannon: 36, minute: 36, minutePinion: 6, hour: 72 };

/** Modules: each pair's own. The great wheel's is set by where the dial puts the winding square. */
const MOD = {
  great: (2 * windX) / (TEETH.great + TEETH.centrePinion),
  centre: 1.1,
  third: 1.05,
  cannon: 0.8,
  hour: (0.8 * (TEETH.cannon + TEETH.minute)) / (TEETH.hour + TEETH.minutePinion),
};

const dist = (m, a, b) => (m * (a + b)) / 2;
const centre = [0, centreY];
const great = [windX, centreY];
const cTh = dist(MOD.centre, TEETH.centre, TEETH.thirdPinion);
const tEs = dist(MOD.third, TEETH.third, TEETH.escapePinion);
const third = [-10, centreY + Math.sqrt(cTh ** 2 - 100)];
const escape = [0, third[1] + Math.sqrt(tEs ** 2 - 100)];
/** The escape wheel's tip radius, and the anchor's arbor √2 radii above it (pallets 90° apart, spanning 7½ teeth). */
const escapeR = 30;
const anchor = [0, escape[1] + Math.SQRT2 * escapeR];
const mDist = dist(MOD.cannon, TEETH.cannon, TEETH.minute);
const minuteWheel = [centre[0] + mDist * Math.cos(225 * DEG), centreY + mDist * Math.sin(225 * DEG)];

/** Everything the parts are laid out from. */
export const L = {
  centre,
  great,
  third,
  escape,
  anchor,
  minuteWheel,
  escapeR,
  modules: MOD,
  /** Plates: z ranges, and the outline they share. */
  back: [7, 10.5],
  front: [90.5, 94],
  plateX: [-125, 125],
  plateY: [1657, 1860],
  dialBack: 114,
  dialFront: 118,
  /** The barrel: its line runs on a 51.4 mm circle (2 in), so a turn pays out 161.5 mm of line. */
  barrel: { r: 25, line: 25.7, z: [20, 76], flange: 30 },
  greatZ: [81, 84],
  centreWheelZ: [13, 16],
  thirdWheelZ: [30, 33],
  escapeWheelZ: [55, 58],
  anchorZ: [53, 60],
  /** Motion work, in front of the front plate. */
  cannonZ: [96, 98.5],
  hourZ: [101.5, 104],
  /** The seconds hand, just clear of the dial; the shell's hands are moved forward to clear it (augment.mjs). */
  secondsZ: [118.3, 118.9],
  /** The pendulum: it hangs from the suspension spring with its bending point level with the anchor's arbor, so
   *  the crutch and the pendulum turn about one line. Seconds pendulum: 994 mm to the bob's centre. */
  pendulum: { length: 994, z: -6, rod: 2, bobR: 50, bobHalf: 10, amplitude: 3 },
  /** The going weight: 5.7 kg of lead (BM, Draper), a cylinder 60 × 180 mm, on a pulley that halves its fall. Drawn
   *  two days after winding: 646 mm of line off the barrel, the weight 323 mm down. */
  weight: { r: 30, h: 180, pulleyR: 22.5, z: 47, pulleyY: 1250, kg: 5.7 },
  seatboard: { y: [1635, 1657], z: [9, 112], x: [-192, 192] },
};
L.pendulum.bobY = anchor[1] - L.pendulum.length;
L.weight.pulleyX = great[0] - L.barrel.line + L.weight.pulleyR;
L.lineLeftX = great[0] - L.barrel.line;
L.lineRightX = L.weight.pulleyX + L.weight.pulleyR;

/** Pairs that touch by design: gears in mesh, arbors in what they carry or pass through, parts resting on others. */
export const CONTACTS = [
  ['great_wheel', 'centre_wheel'], ['centre_wheel', 'third_wheel'], ['third_wheel', 'escape_wheel'], ['escape_wheel', 'anchor'],
  ['cannon_wheel', 'centre_wheel'], ['cannon_wheel', 'minute_wheel'], ['minute_wheel', 'hour_wheel'], ['cannon_wheel', 'hour_wheel'],
  ['minute_wheel', 'front_plate'], ['anchor', 'crutch'], ['crutch', 'pendulum'], ['pendulum', 'frame'],
  ['front_plate', 'frame'], ['frame', 'case'], ['dial', 'front_plate'], ['weight', 'great_wheel'], ['weight', 'case'],
  ['great_wheel', 'dial'], ['escape_wheel', 'dial'], ['escape_wheel', 'seconds_hand'], ['hour_wheel', 'dial'], ['cannon_wheel', 'dial'],
  ['hour_wheel', 'hour_hand'], ['cannon_wheel', 'minute_hand'], ['cannon_wheel', 'hour_hand'], ['front_plate', 'case'], ['great_wheel', 'front_plate'], ['great_wheel', 'frame'],
  ['centre_wheel', 'frame'], ['centre_wheel', 'front_plate'], ['third_wheel', 'frame'], ['third_wheel', 'front_plate'],
  ['escape_wheel', 'frame'], ['escape_wheel', 'front_plate'], ['anchor', 'frame'], ['anchor', 'front_plate'], ['crutch', 'frame'],
];

/** An outline moved to a centre. */
const at = (loop, [cx, cy]) => loop.map(([x, y]) => [x + cx, y + cy]);

/** A plate across z between z0 and z1, from outlines already placed. */
function slab(geo, outer, holes, z0, z1, chamfer = 0.25) {
  extrude(geo, geo, { outer, holes }, z0, z1, { crease: 30, chamfer, chamferBottom: chamfer });
}

/** A wheel with English crossings (four spokes), on its centre, between z0 and z1. */
function wheel(geo, c, { teeth, module, phase = 0, bore = 0, spokeWidth }, z0, z1) {
  const g = gears.gear({ teeth, module, phase });
  const rim = g.rootRadius - Math.max(2.2, module * 2.2);
  const hub = Math.max(4, rim * 0.18);
  const holes = gears.wheelHoles({ rim, hub, spokes: 4, width: spokeWidth ?? Math.max(2.4, rim * 0.12), bore, cell: rim / 160, phase: 45 * DEG }).map((h) => at(h, c));
  slab(geo, at(g.outline, c), holes, z0, z1, Math.min(0.3, module * 0.25));
  return g;
}

/** A pinion's leaves along its arbor. */
function pinion(geo, c, { teeth, module, phase = 0 }, z0, z1) {
  const g = gears.gear({ teeth, module, kind: 'pinion', phase });
  slab(geo, at(g.outline, c), [], z0, z1, 0.15);
  return g;
}

/** A plain wheel with no crossings (small motion-work wheels), with a bore. */
function disc(geo, c, { teeth, module, phase = 0, bore = 0 }, z0, z1) {
  const g = gears.gear({ teeth, module, phase });
  slab(geo, at(g.outline, c), bore ? [cw(circle(bore, c[0], c[1], 28))] : [], z0, z1, Math.min(0.25, module * 0.25));
  return g;
}

/** An arbor along z: [radius, z] stations. */
const arbor = (geo, [x, y], stations) => solids.shaft(geo, 'z', [x, y, 0], stations, { segments: 24 });

/** The anchor escapement's wheel: 30 pointed teeth with a steep leading face (it turns clockwise from the front)
 *  and a long sloping back. Tooth k's tip sits at phase + 12° k. */
function escapeOutline(phase, R, r) {
  const pts = [];
  const pitch = TAU / TEETH.escape;
  for (let k = 0; k < TEETH.escape; k++) {
    const a = phase + k * pitch;
    for (const [rr, da] of [[r, -1.6], [R - 0.7, -0.5], [R, 0], [R - 0.5, 1.2], [r + 0.4, 9.6], [r, 10]]) pts.push([rr * Math.cos(a + da * DEG), rr * Math.sin(a + da * DEG)]);
  }
  return pts;
}

/** The anchor: a hub on its arbor, two arms bowed out over the wheel, and a pallet at each end reaching to just
 *  clear of the teeth (it dips between them as it rocks). Relative to the escape wheel's centre. */
function anchorShape() {
  const A = [0, Math.SQRT2 * escapeR];
  const elbow = (s) => [s * 37 * Math.SQRT1_2, 37 * Math.SQRT1_2];
  const nose = (s) => [s * (escapeR + 1.35) * Math.SQRT1_2, (escapeR + 1.35) * Math.SQRT1_2];
  const f = sd.smooth(
    1.2,
    sd.circle(A, 6.5),
    sd.capsule(A, elbow(-1), 3.4, 2.8),
    sd.capsule(A, elbow(1), 3.4, 2.8),
    sd.capsule(elbow(-1), nose(-1), 2.6, 1.0),
    sd.capsule(elbow(1), nose(1), 2.6, 1.0),
  );
  const shapes2 = contours(f, { min: [-34, 16], max: [34, 52] }, 0.12, 0.25);
  return shapes2[0].outer;
}

export function buildMovement() {
  const parts = [];
  const add = (name, opts) => {
    const p = new Part(name, opts);
    parts.push(p);
    return p;
  };
  const z0 = (r) => r[0];
  const z1 = (r) => r[1];

  // ---------------------------------------------------------------- frame: plates, pillars, back cock
  const frame = add('frame');
  const front = add('front_plate');
  const plateOutline = solids.rect(L.plateX, L.plateY, 10);
  const pivotHole = (c, r) => cw(circle(r, c[0], c[1], 28));
  const arbors = [[great, 4.4], [centre, 2.6], [third, 2.2], [escape, 2.2], [anchor, 2.2]];
  slab(frame.geo('brass'), plateOutline, arbors.map(([c, r]) => pivotHole(c, r)), z0(L.back), z1(L.back), 0.4);
  slab(front.geo('brass'), plateOutline, arbors.map(([c, r]) => pivotHole(c, r)), z0(L.front), z1(L.front), 0.4);
  // Four turned pillars, riveted to the back plate; the front plate sits on their shoulders.
  for (const [x, y] of [[-112, 1672], [112, 1672], [-112, 1845], [112, 1845]]) {
    solids.revolve(frame.geo('brass'), 'z', [x, y, 0], [[0, L.back[1]], [5.5, L.back[1]], [5.5, 14], [4, 18], [4.6, 50], [4, 82], [5.5, 86], [5.5, L.front[0]], [0, L.front[0]]], { segments: 28 });
  }
  // The back cock: two prongs behind the back plate, with the pendulum's top block on them.
  const ay = anchor[1];
  for (const s of [-1, 1]) solids.box(frame.geo('brass'), s < 0 ? [-12, -1.2] : [1.2, 12], [ay + 6, ay + 16], [-14, L.back[0]]);
  solids.box(frame.geo('brass'), [-10, 10], [ay + 16, ay + 24], [-13, 0], { axis: 'z' });
  // The minute wheel's stud, riveted to the front plate.
  arbor(front.geo('steel'), minuteWheel, [[2, z1(L.front)], [2, z1(L.cannonZ) - 0.1]]);
  // The dial's feet come later, with the dial (augment.mjs adds them to its part).

  // ---------------------------------------------------------------- power: barrel and great wheel
  const greatWheel = add('great_wheel');
  const bz = L.barrel.z;
  solids.revolve(greatWheel.geo('brass'), 'z', [...great, 0], [[3.9, bz[0]], [L.barrel.flange, bz[0]], [L.barrel.flange, bz[0] + 2.2], [L.barrel.r, bz[0] + 3.4], [L.barrel.r, bz[1] - 3.4], [L.barrel.flange, bz[1] - 2.2], [L.barrel.flange, bz[1]], [3.9, bz[1]]], { segments: 64 });
  // The ratchet on the barrel's end: the click on the great wheel drops into it, so the weight turns the wheel but
  // winding turns the barrel alone.
  const ratchet = Array.from({ length: 40 }, (_, k) => {
    const a = (k / 40) * TAU;
    return [[24, a], [28, a + 0.6 * (TAU / 40)]];
  }).flat().map(([r, a]) => [great[0] + r * Math.cos(a), great[1] + r * Math.sin(a)]);
  slab(greatWheel.geo('brass'), ratchet, [], 76.6, 80.2, 0.2);
  wheel(greatWheel.geo('brass'), great, { teeth: TEETH.great, module: MOD.great, bore: 0, spokeWidth: 5 }, z0(L.greatZ), z1(L.greatZ));
  // The click, on the great wheel's face, and its spring.
  solids.box(greatWheel.geo('steel'), [great[0] + 18, great[0] + 32], [great[1] + 24, great[1] + 28], [80.2, 81], { axis: 'z' });
  arbor(greatWheel.geo('steel'), great, [[2, z0(L.back)], [2, z1(L.back)], [4, z1(L.back)], [4, 104]]);
  // The gut line on the barrel: about twelve turns left of sixteen, two days after winding. It leaves the barrel on
  // its left, where the barrel's turn (anticlockwise from the front) pays it out downwards.
  const lineZ = L.weight.z;
  const coil = shapes.helix('z', [...great, 0], L.barrel.line, lineZ - 11.5 * 1.5, lineZ, 11.5, 28);
  shapes.tube(greatWheel.geo('gut'), coil, 0.7, { segments: 6 });

  // ---------------------------------------------------------------- the going train
  const centreWheel = add('centre_wheel');
  const cp = { center: centre, teeth: TEETH.centrePinion, module: MOD.great };
  cp.phase = meshPhase({ center: great, teeth: TEETH.great, module: MOD.great, phase: 0 }, cp);
  pinion(centreWheel.geo('steel'), centre, cp, 76, 86);
  const cw0 = { teeth: TEETH.centre, module: MOD.centre, phase: 0 };
  wheel(centreWheel.geo('brass'), centre, cw0, z0(L.centreWheelZ), z1(L.centreWheelZ));
  arbor(centreWheel.geo('steel'), centre, [[1.5, z0(L.back)], [1.5, z1(L.back)], [2.2, z1(L.back)], [2.2, 112]]);
  solids.shaft(centreWheel.geo('brass'), 'z', [...centre, 0], [[5, z1(L.centreWheelZ)], [5, z1(L.centreWheelZ) + 3]]);

  const thirdWheel = add('third_wheel');
  const tp = { center: third, teeth: TEETH.thirdPinion, module: MOD.centre };
  tp.phase = meshPhase({ center: centre, ...cw0 }, tp);
  pinion(thirdWheel.geo('steel'), third, tp, 11, 18);
  const tw0 = { teeth: TEETH.third, module: MOD.third, phase: 0 };
  wheel(thirdWheel.geo('brass'), third, tw0, z0(L.thirdWheelZ), z1(L.thirdWheelZ));
  arbor(thirdWheel.geo('steel'), third, [[1.4, z0(L.back)], [1.4, z1(L.back)], [1.8, z1(L.back)], [1.8, z0(L.front)], [1.4, z0(L.front)], [1.4, z1(L.front)]]);
  solids.shaft(thirdWheel.geo('brass'), 'z', [...third, 0], [[4.5, z1(L.thirdWheelZ)], [4.5, z1(L.thirdWheelZ) + 2.5]]);

  const escapeWheel = add('escape_wheel');
  const ep = { center: escape, teeth: TEETH.escapePinion, module: MOD.third };
  ep.phase = meshPhase({ center: third, ...tw0 }, ep);
  pinion(escapeWheel.geo('steel'), escape, ep, 28, 35);
  // Tips at 45° (under the right pallet) and every 12°: the left pallet, 7½ teeth round, sits over a gap.
  const er = 25.5;
  const escHoles = gears.wheelHoles({ rim: er - 4, hub: 4.2, spokes: 4, width: 2.4, cell: 0.12, phase: 0 }).map((h) => at(h, escape));
  slab(escapeWheel.geo('brass'), at(escapeOutline(45 * DEG, escapeR, er), escape), escHoles, z0(L.escapeWheelZ), z1(L.escapeWheelZ), 0.2);
  arbor(escapeWheel.geo('steel'), escape, [[1.4, z0(L.back)], [1.4, z1(L.back)], [1.8, z1(L.back)], [1.8, L.secondsZ[0]]]);
  solids.shaft(escapeWheel.geo('brass'), 'z', [...escape, 0], [[4, z1(L.escapeWheelZ)], [4, z1(L.escapeWheelZ) + 2.5]]);

  // ---------------------------------------------------------------- escapement: anchor, crutch, pendulum
  const anchorPart = add('anchor');
  slab(anchorPart.geo('steel'), at(anchorShape(), escape), [cw(circle(1.8, anchor[0], anchor[1], 20))], z0(L.anchorZ), z1(L.anchorZ), 0.3);
  arbor(anchorPart.geo('steel'), anchor, [[1.8, z1(L.back)], [1.8, z0(L.front)], [1.4, z0(L.front)], [1.4, z1(L.front)]]);
  solids.shaft(anchorPart.geo('brass'), 'z', [...anchor, 0], [[4.5, z1(L.anchorZ)], [4.5, z1(L.anchorZ) + 3]]);

  const pz = L.pendulum.z;
  const crutch = add('crutch');
  arbor(crutch.geo('steel'), anchor, [[1.8, 0.5], [1.8, z1(L.back)]]);
  solids.shaft(crutch.geo('brass'), 'z', [...anchor, 0], [[4.2, 0.5], [4.2, 5]]);
  const forkY = 1695;
  solids.box(crutch.geo('steel'), [-1.6, 1.6], [forkY, anchor[1]], [0.8, 3.6], { axis: 'z' });
  solids.box(crutch.geo('steel'), [-5.2, 5.2], [forkY - 3, forkY + 3], [0.8, 3.6], { axis: 'z' });
  for (const s of [-1, 1]) arbor(crutch.geo('steel'), [s * (L.pendulum.rod + 1.3), forkY], [[0.8, pz - 6], [0.8, 0.8]]);

  const pendulum = add('pendulum');
  const by = L.pendulum.bobY;
  // The suspension spring: a thin steel ribbon, bending about the anchor's line; then the lower chops and the rod.
  solids.box(pendulum.geo('spring'), [-0.25, 0.25], [ay - 14, ay + 16], [pz - 2.5, pz + 2.5]);
  solids.box(pendulum.geo('brass'), [-4, 4], [ay - 22, ay - 14], [pz - 3, pz + 3]);
  solids.shaft(pendulum.geo('steel'), 'y', [0, 0, pz], [[L.pendulum.rod, by - L.pendulum.bobR - 32], [L.pendulum.rod, ay - 22]], { segments: 16 });
  // The bob: a lens of lead faced with brass, 100 mm across.
  const lens = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    lens.push([L.pendulum.bobR * Math.sin((t * Math.PI) / 2), pz + L.pendulum.bobHalf * Math.cos((t * Math.PI) / 2)]);
  }
  const lensProfile = [...lens, ...lens.slice(0, -1).reverse().map(([r, z]) => [r, 2 * pz - z])];
  const bob = new Geo();
  geometry.lathe(bob, [...lensProfile].reverse(), { segments: 48 });
  solids.put(pendulum.geo('bob'), bob, 'z', [0, by, 0]);
  // The rating nut under the bob: screw it up and the bob rises, the pendulum shortens and the clock gains.
  solids.shaft(pendulum.geo('brass'), 'y', [0, 0, pz], [[5.5, by - L.pendulum.bobR - 22], [5.5, by - L.pendulum.bobR - 2], [3, by - L.pendulum.bobR]], { segments: 6 });

  // ---------------------------------------------------------------- weight, pulley and line
  const W = L.weight;
  const weight = add('weight');
  solids.revolve(weight.geo('brass'), 'z', [W.pulleyX, W.pulleyY, 0], [[3, W.z - 3.5], [W.pulleyR + 1.5, W.z - 3.5], [W.pulleyR + 1.5, W.z - 2.2], [W.pulleyR - 0.7, W.z - 0.9], [W.pulleyR - 0.7, W.z + 0.9], [W.pulleyR + 1.5, W.z + 2.2], [W.pulleyR + 1.5, W.z + 3.5], [3, W.z + 3.5]], { segments: 48 });
  arbor(weight.geo('steel'), [W.pulleyX, W.pulleyY], [[2.5, W.z - 7], [2.5, W.z + 7]]);
  // The stirrup from the pulley's axle down to the hook on the weight.
  for (const s of [-1, 1]) solids.box(weight.geo('steel'), [W.pulleyX - 1.5, W.pulleyX + 1.5], [W.pulleyY - 34, W.pulleyY + 3], s < 0 ? [W.z - 7, W.z - 5] : [W.z + 5, W.z + 7]);
  solids.box(weight.geo('steel'), [W.pulleyX - 3, W.pulleyX + 3], [W.pulleyY - 37, W.pulleyY - 34], [W.z - 7, W.z + 7]);
  const top = W.pulleyY - 37;
  solids.revolve(weight.geo('lead'), 'y', [W.pulleyX, 0, W.z], [[0, top - W.h], [W.r - 1.5, top - W.h], [W.r, top - W.h + 1.5], [W.r, top - 1.5], [W.r - 1.5, top], [4, top], [0, top]], { segments: 40 });
  // The gut line: down from the barrel, round the pulley, and up to its knot under the seatboard.
  const gut = weight.geo('gut');
  shapes.tube(gut, [[L.lineLeftX, great[1] - 0.6, lineZ], [L.lineLeftX, W.pulleyY, lineZ]], 0.7, { segments: 6 });
  const arc = Array.from({ length: 13 }, (_, i) => {
    const a = Math.PI + (i / 12) * Math.PI;
    return [W.pulleyX + W.pulleyR * Math.cos(a), W.pulleyY + W.pulleyR * Math.sin(a), W.z];
  });
  shapes.tube(gut, [[L.lineLeftX, W.pulleyY, lineZ], ...arc, [L.lineRightX, W.pulleyY, W.z]], 0.7, { segments: 6 });
  shapes.tube(gut, [[L.lineRightX, W.pulleyY, W.z], [L.lineRightX, L.seatboard.y[1] + 1, W.z]], 0.7, { segments: 6 });

  // ---------------------------------------------------------------- motion work and the seconds hand
  const cannon = add('cannon_wheel');
  disc(cannon.geo('brass'), centre, { teeth: TEETH.cannon, module: MOD.cannon, bore: 2.2 }, z0(L.cannonZ), z1(L.cannonZ));
  solids.shaft(cannon.geo('brass'), 'z', [...centre, 0], [[4.4, 95.5], [4.4, 120.8]], { bore: 2.2 });
  const minute = add('minute_wheel');
  const mw = { center: minuteWheel, teeth: TEETH.minute, module: MOD.cannon };
  mw.phase = meshPhase({ center: centre, teeth: TEETH.cannon, module: MOD.cannon, phase: 0 }, mw);
  disc(minute.geo('brass'), minuteWheel, { ...mw, bore: 2.15 }, z0(L.cannonZ), z1(L.cannonZ));
  const mp = { teeth: TEETH.minutePinion, module: MOD.hour, phase: 0 };
  const mpg = gears.gear({ ...mp, kind: 'pinion' });
  slab(minute.geo('steel'), at(mpg.outline, minuteWheel), [], z1(L.cannonZ), 104.2, 0.1);
  const hour = add('hour_wheel');
  const hw = { center: centre, teeth: TEETH.hour, module: MOD.hour };
  hw.phase = meshPhase({ center: minuteWheel, ...mp }, hw);
  disc(hour.geo('brass'), centre, { ...hw, bore: 4.6 }, z0(L.hourZ), z1(L.hourZ));
  solids.shaft(hour.geo('brass'), 'z', [...centre, 0], [[6.3, z1(L.hourZ)], [6.3, 119.4]], { bore: 4.6 });

  const seconds = add('seconds_hand');
  const [sx, sy] = escape;
  const hand = sd.smooth(0.6, sd.circle([0, 0], 2.6), sd.capsule([0, -8], [0, 26], 1.0, 0.35), sd.circle([0, -8], 1.8));
  const outline = contours(hand, { min: [-4, -11], max: [4, 28] }, 0.08, 0.16)[0].outer;
  slab(seconds.geo('blued'), at(outline, [sx, sy]), [], L.secondsZ[0], L.secondsZ[1], 0.1);

  // ---------------------------------------------------------------- the case's insides: seatboard and cheeks
  const caseInside = add('case');
  const S = L.seatboard;
  // Notches for the two lines, open to the front, so the weight can be lifted out with its line.
  const n = lineZ - 4;
  const [xl, xr] = [L.lineLeftX, L.lineRightX];
  const seat = [[S.x[0], S.z[0]], [S.x[1], S.z[0]], [S.x[1], S.z[1]], [xr + 3, S.z[1]], [xr + 3, n], [xr - 3, n], [xr - 3, S.z[1]], [xl + 3, S.z[1]], [xl + 3, n], [xl - 3, n], [xl - 3, S.z[1]], [S.x[0], S.z[1]]];
  solids.plate(caseInside.geo('oak'), 'y', { outer: seat }, S.y[0], S.y[1], { chamfer: 0.5, chamferBottom: 0.5 });
  for (const s of [-1, 1]) solids.box(caseInside.geo('oak'), s < 0 ? [-192, -170] : [170, 192], [1440, S.y[0]], [-120, 105]);

  return { parts };
}
