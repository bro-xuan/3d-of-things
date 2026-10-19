// Build step for the sewing machine (content/sewing-machine.json → build.generate): a Singer 201-2 head,
// built whole in code from Singer's adjuster's manual (Form 18962, 1936) and instruction book (Form 20340,
// 1951). Millimetres, x to the right, y up, z towards the operator; the bed's underside is y = 0 and the
// needle comes down at x = L.nx, z = L.nz.
//
// What hangs together: one arm shaft, turning once per stitch, carries the needle-bar crank at its left
// end, the feed cam and the feed-lifting eccentric near the pillar, and a bevel gear that turns the upright
// shaft twice as fast. That shaft turns the hook driving shaft under the bed, which turns the rotating
// hook on its vertical shaft: two turns per stitch. The take-up lever rocks in the head; the feed dog is
// lifted by the feed lifting rock shaft and pushed by the feed rock shaft, both under the bed.
//
// At rest the needle is at the top of its stroke (arm shaft angle 0), the feed dog up and pushing. The
// content's crank and cam motions run from there: the numbers they need are in the hints.
import { geometry, solids, shapes, Part, assemble, modelSpace, runChecks, hiddenDriver } from '../../scripts/kit/index.mjs';
import { filleted, insetCorners, walls } from './casting.mjs';

const { signedArea } = geometry;
const { box, plate, rect, ring, hole, shaft, revolve } = solids;
const DEG = Math.PI / 180;

/** The numbers that matter (mm). Section 4 of TRUTH.md says which are Singer's and which are ours. */
export const L = {
  bed: { x: [0, 400], z: [-89, 89], top: 50, plate: 4, skirt: 5, r: 12 },
  nx: 60,
  nz: -15,
  shaftY: 215,
  shaftR: 5,
  stroke: 30,
  link: 38,
  needle: { point: 59, length: 38.5 },
  bar: { r: 3.6, y: [108, 233], stud: 192 },
  presser: { z: -28, r: 3.2, top: 236, sole: 51.5 },
  arm: { z: [-50, 20], split: -15, wall: 5, face: 5 },
  hook: { x: 44, floor: 22, rim: 38, r: 20, inner: 17.5, beakTop: 40, rise: 2.4 },
  caseR: 11.5,
  bobbin: { r: 10.25, h: 10.9, y: 26.5 },
  driveY: 12,
  upX: 330,
  bevel: { m: 1, small: 16, large: 32 },
  wheel: { x: [390, 408], r: 50 },
  feed: { lift: 1.5, travel: 4.2, y: [42.5, 45.5], teeth: 51, duration: 200 },
  rock: { y: 28, z: -15, x: [112, 300], arm: 116 },
  lifter: { y: 28, z: -45, x: [92, 313], arm: 96 },
  cam: { x: [292, 298], e: 2 },
  ecc: { x: [303, 309], e: 0.75 },
  takeUp: { x: 47, hinge: [222, -40], length: 68, swing: 14, phase: 50 },
};
const { nx: NX, nz: NZ, shaftY: SY } = L;
const R = L.stroke / 2;

/** Needle height above its lowest point at arm-shaft angle t (radians; 0 = top of the stroke). */
const needleRise = (t) => R * Math.cos(t) + Math.sqrt(L.link ** 2 - (R * Math.sin(t)) ** 2) - (L.link - R);
/** The arm-shaft angle after the bottom at which the needle has risen `rise`: the hook's point meets it there. */
function catchAngle(rise) {
  let t = Math.PI;
  while (needleRise(t) < rise) t += 0.0005;
  return t;
}
export const CATCH = catchAngle(L.hook.rise);
/** The beak's direction from the hook's axis at rest (an angle about +y from +x): it reaches the needle (+x)
 *  after the hook has turned 2 × CATCH clockwise seen from above. */
const BEAK = (2 * CATCH) % (2 * Math.PI);

/** Pairs that touch by design: castings bolted together, gears in mesh, pins in their eyes, plates in the bed. */
export const CONTACTS = [
  ['arm_front', 'bed'], ['face_plate', 'bed'], ['face_plate', 'arm_front'], ['motor', 'bed'],
  ['balance_wheel', 'arm_shaft'], ['needle_link', 'arm_shaft'], ['needle_link', 'needle_bar'], ['needle', 'needle_bar'],
  ['tension', 'arm_front'], ['stitch_lever', 'arm_front'], ['spool', 'bed'],
  ['upright_shaft', 'arm_shaft'], ['upright_shaft', 'hook_drive_shaft'], ['hook', 'hook_drive_shaft'],
  ['bobbin', 'bobbin_case'], ['bobbin_case', 'slide_plate'], ['bobbin_case', 'bed'],
  ['needle_plate', 'bed'], ['slide_plate', 'bed'], ['needle_plate', 'slide_plate'],
  ['feed_rod', 'arm_shaft'], ['feed_rod', 'feed_lift_shaft'], ['feed_fork', 'feed_rock_shaft'], ['feed_fork', 'arm_shaft'],
  ['feed_rock_shaft', 'bed'], ['feed_lift_shaft', 'bed'],
];

// ------------------------------------------------------------------- helpers

/** A profile of [r, w] points turned anticlockwise, so the lathe's normals face out. */
const ccw = (profile) => (signedArea(profile) < 0 ? [...profile].reverse() : profile);
/** Turned solids about a line along y through (x, z), along x through (y, z), along z through (x, y). */
const turnedY = (geo, x, z, profile, segments = 48) => revolve(geo, 'y', [x, 0, z], ccw(profile), { segments });
const turnedX = (geo, y, z, profile, segments = 48) => revolve(geo, 'x', [0, y, z], ccw(profile), { segments });
const turnedZ = (geo, x, y, profile, segments = 40) => revolve(geo, 'z', [x, y, 0], ccw(profile), { segments });
/** A circle for a plate across x, centred at (z, y). */
const disc = (r, z, y, segments) => ring(r, z, y, segments);

/**
 * A bevel gear on `axis` (x, y or z): `teeth` of module m, its pitch circle `dir` (+1 or −1) along the axis
 * from the apex where the two shafts' lines cross, at the distance the mating gear's pitch radius sets,
 * its teeth tapering towards that apex.
 */
function bevel(geo, axis, apex, dir, { teeth, mate, m = L.bevel.m, face = 4.5, phase = 0 }) {
  const d = (mate * m) / 2;
  const cone = Math.hypot((teeth * m) / 2, d);
  const s1 = 1 - face / cone;
  const i = 'xyz'.indexOf(axis);
  const w0 = apex[i] + dir * d;
  const w1 = apex[i] + dir * d * s1;
  shapes.conicalGear(geo, axis, apex, { teeth, module: m, phase }, w0, w1, 1, s1, 0);
  return { w0, w1 };
}

/** The feed dog's teeth: a saw-tooth row seen from the side (z, y), across x from x0 to x1. */
function teethRow(geo, x0, x1, z0, z1, base, crest) {
  const n = 5;
  const pitch = (z1 - z0) / n;
  const loop = [[z1, base], [z1, crest - 1.2]];
  for (let k = n - 1; k >= 0; k--) {
    const za = z0 + k * pitch;
    loop.push([za + pitch * 0.35, crest], [za, crest - 1.2]);
  }
  loop.push([z0, base]);
  plate(geo, 'x', { outer: loop }, x0, x1);
}

/**
 * The hook's beak: a horn on the rim that rises and sharpens towards its point, which leads as the hook
 * turns (clockwise seen from above). At rest the point is at BEAK, so it reaches the needle at CATCH.
 */
function beak(geo) {
  const H = L.hook;
  const steps = 14;
  const span = 50 * DEG;
  const P = (i) => geo.positions.slice(i * 3, i * 3 + 3);
  const rings = [];
  for (let s = 0; s <= steps; s++) {
    const f = s / steps; // 0 at the tail, 1 at the point
    const a = BEAK + span * (1 - f);
    const r0 = H.inner + 0.6 + (H.r - H.inner - 0.6) * f * 0.85;
    const y1 = H.rim + (H.beakTop - H.rim) * Math.min(1, f * 1.4);
    const y0 = H.rim - 2.5 + 2.4 * f;
    const at = (r, y) => [H.x + r * Math.cos(a), y, NZ - r * Math.sin(a)];
    rings.push([at(r0, y0), at(H.r, y0), at(H.r, y1), at(r0, y1)].map((pt) => geo.vertex(pt, [0, 1, 0])));
  }
  for (let s = 0; s < steps; s++) {
    for (let k = 0; k < 4; k++) {
      const [a, b, c, d] = [rings[s][k], rings[s][(k + 1) % 4], rings[s + 1][(k + 1) % 4], rings[s + 1][k]];
      const mid = [0, 1, 2].map((j) => (P(a)[j] + P(c)[j]) / 2);
      const radial = [mid[0] - H.x, 0, mid[2] - NZ];
      const out = [[0, -1, 0], radial, [0, 1, 0], radial.map((v) => -v)][k];
      geo.tri(a, b, c, out);
      geo.tri(a, c, d, out);
    }
  }
  for (const [ring0, ring1] of [[rings[0], rings[1]], [rings[steps], rings[steps - 1]]]) {
    const out = [0, 1, 2].map((j) => P(ring0[0])[j] - P(ring1[0])[j]);
    geo.tri(ring0[0], ring0[1], ring0[2], out);
    geo.tri(ring0[0], ring0[2], ring0[3], out);
  }
}

// ------------------------------------------------------------------- the arm

/** The arm and pillar seen from the front: anticlockwise corners [x, y, fillet]. */
const ARM = [
  [272, 50, 0], // the pillar's foot, left (A)...
  [376, 50, 0], // ...and right (B)
  [380, 176, 30], // the pillar's right side, flaring into the arm (C)
  [386, 200, 8], // the arm's right end, below the shaft (D)...
  [386, 250, 14], // ...and above it (E)
  [28, 250, 14], // the head's top left (F)
  [28, 150, 6], // the head's bottom left (G)
  [98, 150, 6], // the head's bottom right (H)
  [98, 176, 8], // where the head meets the arm's underside (I)
  [292, 176, 28], // where the arm's underside meets the pillar (J)
];
/** Walls left out: the pillar's foot (it stands on the bed), the arm's right end (the shaft), the head's end and bottom (face plate, bars). */
const OPEN = new Set(['edge0', 'edge3', 'edge5', 'corner6', 'edge6']);
const keep = (t) => !OPEN.has(t.edge !== undefined ? `edge${t.edge}` : `corner${t.corner}`);

/** One half of the arm: walls from z0 to z1 and a face plate at `faceAt`, chamfered on its outer edge. */
function armHalf(geo, z0, z1, faceAt, faceHoles = []) {
  const { pts: outer, tags } = filleted(ARM);
  const { pts: inner } = filleted(insetCorners(ARM, L.arm.wall));
  walls(geo, outer, inner, tags, keep, z0, z1);
  const [f0, f1] = faceAt;
  plate(geo, 'z', { outer, holes: faceHoles }, f0, f1, f0 > z0 ? { chamfer: 1.6 } : { chamferBottom: 1.6 });
}

// ------------------------------------------------------------------- the parts

export function buildParts() {
  const parts = [];
  const add = (part) => (parts.push(part), part);
  const [AZ0, AZ1] = L.arm.z;
  const split = L.arm.split;
  const top = L.bed.top;
  const T = top - L.bed.plate;

  // The bed: a hollow cast-iron tray, its top cut for the pillar and the throat, with the back half of the
  // arm (bed and arm are one casting; it's split here so the front half can come off).
  const bed = add(new Part('bed'));
  const japan = bed.geo('japan');
  const outerBed = rect(L.bed.x, L.bed.z, L.bed.r);
  plate(japan, 'y', { outer: outerBed, holes: [hole(geometry.inset(outerBed, L.bed.skirt))] }, 0, T);
  plate(japan, 'y', { outer: outerBed, holes: [hole(rect([22, 84], [-40, 10])), hole(rect([282, 366], [-40, 10]))] }, T, top, { chamfer: 1.5 });
  armHalf(japan, AZ0 + L.arm.face, split, [AZ0, AZ0 + L.arm.face]);
  // The head's bottom, with the bushings' holes for the needle bar and the presser bar.
  plate(japan, 'y', { outer: rect([28, 92], [AZ0, AZ1]), holes: [hole(ring(L.bar.r + 0.4, NX, NZ)), hole(ring(L.presser.r + 0.4, NX, L.presser.z))] }, 150, 155);
  // Lugs under the bed that carry the two feed rock shafts.
  for (const x of [200, 262]) {
    box(japan, [x, x + 8], [L.rock.y + 3, T], [L.rock.z - 3, L.rock.z + 3]);
    box(japan, [x, x + 8], [L.lifter.y + 3, T], [L.lifter.z - 3, L.lifter.z + 3]);
  }

  // The arm's front half: walls and the front face, with the slot the take-up lever works in and holes for
  // the tension's and the stitch regulator's studs. Two gold lines, as on the real machine's decals.
  const front = add(new Part('arm_front'));
  const slot = hole(rect([44, 50], [190, 230], 1.5));
  armHalf(front.geo('japan'), split, AZ1 - L.arm.face, [AZ1 - L.arm.face, AZ1], [slot, hole(ring(2.6, 75, 185)), hole(ring(2.6, 335, 175))]);
  box(front.geo('gold'), [110, 262], [241, 242.2], [AZ1, AZ1 + 0.25]);
  box(front.geo('gold'), [110, 262], [180, 181.2], [AZ1, AZ1 + 0.25]);

  // The face plate on the head's left end.
  const face = add(new Part('face_plate'));
  box(face.geo('chrome'), [23, 28], [150, 250], [AZ0, AZ1], { axis: 'x', round: 9, chamfer: 1 });

  // The motor, built onto the back of the arm, and its gear cover over the balance wheel's hub.
  const motor = add(new Part('motor'));
  const mY = 205;
  const mZ = AZ0 - 24;
  turnedX(motor.geo('japan'), mY, mZ, [[0, 292], [19, 292], [21, 296], [24, 302], [24, 370], [21, 376], [18, 382], [0, 382]]);
  turnedX(motor.geo('chrome'), mY, mZ, [[0, 286], [6, 286], [6, 292], [0, 292]]);
  box(motor.geo('japan'), [376, 388], [182, 232], [AZ0 - 18, AZ0], { axis: 'z', round: 5 });
  box(motor.geo('japan'), [318, 356], [mY - 6, mY + 6], [mZ + 20, AZ0]);

  // The balance wheel on the arm shaft's right end, with its stop-motion clamp knob.
  const wheel = add(new Part('balance_wheel'));
  const [wx0, wx1] = L.wheel.x;
  const wr = L.wheel.r;
  turnedX(wheel.geo('japan'), SY, NZ, [[L.shaftR, 386.5], [13, 386.5], [13, 393], [wr - 6, 393], [wr - 6, wx0], [wr - 1.5, wx0], [wr, wx0 + 2], [wr, wx1 - 2], [wr - 1.5, wx1], [wr - 6.5, wx1], [wr - 6.5, 397], [13, 397], [13, 408], [L.shaftR, 408]]);
  plate(wheel.geo('japan'), 'x', { outer: disc(wr - 5.5, NZ, SY), holes: [0, 120, 240].map((a) => hole(disc(9, NZ + 27 * Math.cos(a * DEG), SY + 27 * Math.sin(a * DEG), 32))) }, 393.5, 396.5);
  turnedX(wheel.geo('chrome'), SY, NZ, [[0, 408], [13, 408], [14, 410], [14, 418], [12.5, 420], [0, 420]]);

  // The arm shaft: the needle-bar crank and its pin at the left end, the feed cam and the feed-lifting
  // eccentric near the pillar, and the bevel gear that drives the upright shaft.
  const arm = add(new Part('arm_shaft'));
  const steel = arm.geo('steel');
  shaft(steel, 'x', [0, SY, NZ], [[L.shaftR, 72], [L.shaftR, 401]]);
  plate(steel, 'x', { outer: disc(18, NZ, SY) }, 72, 78, { chamfer: 0.6, chamferBottom: 0.6 });
  shaft(steel, 'x', [0, SY + R, NZ], [[3, 64.2], [3, 72]]);
  plate(steel, 'x', { outer: disc(8, NZ, SY - L.cam.e) }, ...L.cam.x);
  plate(steel, 'x', { outer: disc(8, NZ, SY + L.ecc.e) }, ...L.ecc.x);
  const upperApex = [L.upX, SY, NZ];
  bevel(steel, 'x', upperApex, 1, { teeth: L.bevel.large, mate: L.bevel.small });

  // The needle bar, its connecting stud and the needle clamp; the link from the crank pin to the stud.
  const bar = add(new Part('needle_bar'));
  shaft(bar.geo('chrome'), 'y', [NX, 0, NZ], [[L.bar.r, L.bar.y[0]], [L.bar.r, L.bar.y[1]]]);
  shaft(bar.geo('steel'), 'x', [0, L.bar.stud, NZ], [[2.4, 63], [2.4, 69]]);
  const clampY = L.needle.point + L.needle.length - 2.5;
  box(bar.geo('chrome'), [NX - 4, NX + 4], [clampY, L.bar.y[0]], [NZ - 4, NZ + 4], { round: 1.5 });
  shaft(bar.geo('chrome'), 'x', [0, clampY + 5, NZ], [[2.2, NX + 4], [2.2, NX + 6.5], [3.2, NX + 6.5], [3.2, NX + 9]]);

  const needle = add(new Part('needle', { parent: 'needle_bar' }));
  const p = L.needle.point;
  turnedY(needle.geo('steel'), NX, NZ, [[0, p], [0.45, p + 2], [0.45, p + 21], [0.8, p + 22.5], [0.8, p + L.needle.length], [0, p + L.needle.length]], 16);

  const link = add(new Part('needle_link'));
  const lg = link.geo('steel');
  const linkTop = SY + R;
  plate(lg, 'x', { outer: disc(4.2, NZ, L.bar.stud), holes: [hole(disc(2.45, NZ, L.bar.stud))] }, 64.5, 67.5);
  plate(lg, 'x', { outer: disc(5, NZ, linkTop), holes: [hole(disc(3.05, NZ, linkTop))] }, 64.5, 67.5);
  box(lg, [64.8, 67.2], [L.bar.stud + 3.9, linkTop - 4.7], [NZ - 1.6, NZ + 1.6]);

  // The take-up lever: pivoted at the back of the head, its eye out through the slot in the front.
  const tu = add(new Part('take_up_lever'));
  const [hy, hz] = L.takeUp.hinge;
  const tx = L.takeUp.x;
  const eyeZ = hz + L.takeUp.length;
  plate(tu.geo('steel'), 'x', { outer: disc(4.5, hz, hy), holes: [hole(disc(1.8, hz, hy))] }, tx - 2.5, tx + 2.5);
  box(tu.geo('steel'), [tx - 1.5, tx + 1.5], [hy - 2.6, hy + 2.6], [hz + 3.5, eyeZ - 2.5]);
  plate(tu.geo('steel'), 'x', { outer: disc(3.6, eyeZ, hy), holes: [hole(disc(1.4, eyeZ, hy))] }, tx - 1.5, tx + 1.5);

  // The tension on the head's front: stud, two discs, the thumb nut and the check spring.
  const ten = add(new Part('tension'));
  const [tX, tY] = [75, 185];
  shaft(ten.geo('steel'), 'z', [tX, tY, 0], [[2, 10], [2, AZ1 + 14]]);
  turnedZ(ten.geo('chrome'), tX, tY, [[2, AZ1], [5, AZ1], [8, AZ1 + 2.2], [2, AZ1 + 2.2]]);
  turnedZ(ten.geo('chrome'), tX, tY, [[2, AZ1 + 2.4], [8, AZ1 + 2.4], [5, AZ1 + 4.6], [2, AZ1 + 4.6]]);
  plate(ten.geo('chrome'), 'z', { outer: shapes.flutes(8.5, 0.6, 24, { a: tX, b: tY }), holes: [hole(ring(2.05, tX, tY))] }, AZ1 + 6, AZ1 + 12, { chamfer: 0.6 });
  shapes.tube(ten.geo('steel'), shapes.helix('z', [tX, tY, 0], 3.2, AZ1 + 4.8, AZ1 + 5.9, 1.5, 16), 0.25);
  shapes.tube(ten.geo('steel'), [[tX + 3.2, tY, AZ1 + 5.3], [tX + 9, tY + 4, AZ1 + 5.3], [tX + 11, tY + 9, AZ1 + 5.3]], 0.3);

  // The spool pin on top of the arm, and a reel of thread.
  const spool = add(new Part('spool'));
  const [sx, sz] = [230, -30];
  shaft(spool.geo('steel'), 'y', [sx, 0, sz], [[2.5, 250], [2.5, 300], [1.8, 302]]);
  turnedY(spool.geo('wood'), sx, sz, [[2.6, 254], [11, 254], [11, 257], [7, 257], [7, 289], [11, 289], [11, 292], [2.6, 292]]);
  turnedY(spool.geo('thread'), sx, sz, [[7, 257.2], [9.4, 257.2], [9.4, 288.8], [7, 288.8]]);

  // The presser bar and its foot, resting just above the feed dog's teeth.
  const foot = add(new Part('presser_foot'));
  const pz = L.presser.z;
  const sole = L.presser.sole;
  shaft(foot.geo('chrome'), 'y', [NX, 0, pz], [[L.presser.r, 62], [L.presser.r, L.presser.top]]);
  box(foot.geo('chrome'), [NX - 3, NX + 3], [sole + 2, 64], [pz - 3, pz + 3], { round: 1 });
  plate(foot.geo('chrome'), 'y', { outer: rect([54.5, 65.5], [-27, -1], 2.5), holes: [hole(rect([58.8, 61.2], [-19, -11], 1))] }, sole, sole + 2);

  // The upright shaft in the pillar, with a bevel gear at each end.
  const up = add(new Part('upright_shaft'));
  const lowerApex = [L.upX, L.driveY, NZ];
  const C10 = bevel(up.geo('steel'), 'y', upperApex, -1, { teeth: L.bevel.small, mate: L.bevel.large });
  const Z9 = bevel(up.geo('steel'), 'y', lowerApex, 1, { teeth: L.bevel.small, mate: L.bevel.small, face: 4 });
  shaft(up.geo('steel'), 'y', [L.upX, 0, NZ], [[4, Z9.w1 + 0.5], [4, C10.w1 - 0.5]]);

  // The rotating hook driving shaft under the bed, from the pillar to the hook.
  const drive = add(new Part('hook_drive_shaft'));
  const hookApex = [L.hook.x, L.driveY, NZ];
  const G8 = bevel(drive.geo('steel'), 'x', lowerApex, -1, { teeth: L.bevel.small, mate: L.bevel.small, face: 4, phase: Math.PI / 16 });
  const T7 = bevel(drive.geo('steel'), 'x', hookApex, 1, { teeth: L.bevel.small, mate: L.bevel.small, face: 4 });
  shaft(drive.geo('steel'), 'x', [0, L.driveY, NZ], [[4, T7.w1 + 0.5], [4, G8.w1 - 0.5]]);

  // The rotating hook: a cup on a vertical shaft, its beak on the rim, and the gear that turns it.
  const hk = add(new Part('hook'));
  const H = L.hook;
  const Q7 = bevel(hk.geo('steel'), 'y', hookApex, 1, { teeth: L.bevel.small, mate: L.bevel.small, face: 4, phase: Math.PI / 16 });
  turnedY(hk.geo('steel'), H.x, NZ, [[0, Q7.w1 + 0.4], [4, Q7.w1 + 0.4], [4, H.floor], [H.r, H.floor], [H.r, H.rim], [H.inner, H.rim], [H.inner, H.floor + 2.5], [0, H.floor + 2.5]], 64);
  beak(hk.geo('chrome'));

  // The bobbin case: held still in the hook by its finger, which sits in the position plate's notch.
  const bc = add(new Part('bobbin_case'));
  turnedY(bc.geo('chrome'), H.x, NZ, [[0, 25], [L.caseR, 25], [L.caseR, 38.5], [L.caseR - 0.9, 38.5], [L.caseR - 0.9, 26], [2, 26], [2, 37], [0, 37]], 48);
  box(bc.geo('chrome'), [H.x - 1.5, H.x + 1.5], [38.5, 41.6], [NZ - L.caseR, NZ - L.caseR + 0.9]);
  box(bc.geo('chrome'), [H.x - 1.5, H.x + 1.5], [40.6, 41.6], [NZ - 24, NZ - L.caseR]);
  box(bc.geo('steel'), [H.x - 4, H.x + 4], [40.6, T], [-40, -35]);

  // The bobbin (class 66: 20.5 mm across, 10.9 mm high), wound with the lower thread.
  const bob = add(new Part('bobbin'));
  const b = L.bobbin;
  turnedY(bob.geo('chrome'), H.x, NZ, [[2.2, b.y], [b.r, b.y], [b.r, b.y + 0.8], [4.5, b.y + 0.8], [4.5, b.y + b.h - 0.8], [b.r, b.y + b.h - 0.8], [b.r, b.y + b.h], [2.2, b.y + b.h]], 40);
  turnedY(bob.geo('thread'), H.x, NZ, [[4.5, b.y + 0.85], [9.2, b.y + 0.85], [9.2, b.y + b.h - 0.85], [4.5, b.y + b.h - 0.85]], 40);

  // The throat plate (needle plate), with the needle hole and the feed dog's slots; the slide plate over the bobbin.
  const np = add(new Part('needle_plate'));
  const slots = [[54.75, 58.25], [61.75, 65.25]];
  plate(np.geo('chrome'), 'y', { outer: rect([50, 84], [-40, 10]), holes: [hole(ring(1.2, NX, NZ, 16)), ...slots.map((xs) => hole(rect(xs, [-24.5, -5.5])))] }, T, top);
  for (const zz of [-34, 4]) shaft(np.geo('chrome'), 'y', [78, 0, zz], [[2.6, top], [2.2, top + 0.6], [0, top + 0.8]], { segments: 16 });
  const sp = add(new Part('slide_plate'));
  plate(sp.geo('chrome'), 'y', { outer: rect([22, 50], [-40, 10]) }, T, top);
  box(sp.geo('chrome'), [26, 36], [top, top + 0.4], [-14, -12]);

  // The feed: the dog and its bar, lifted by a hidden driver (the lift cam's motion in the content) and
  // pushed back and forth by the feed rock shaft; the two rock shafts and the two links from the arm.
  add(hiddenDriver('feed_lifter', { parent: 'bed', at: [100, 44, NZ] }));
  const dog = add(new Part('feed_dog', { parent: 'feed_lifter' }));
  const [fy0, fy1] = L.feed.y;
  plate(dog.geo('steel'), 'y', { outer: rect([54.5, 66], [-26, -4], 1), holes: [hole(rect([58.8, 61.2], [-18.5, -11.5], 1))] }, fy0, fy1);
  box(dog.geo('steel'), [66, 130], [fy0, fy1], [-20, -10]);
  for (const [z0, z1] of [[-19.3, -17.3], [-12.7, -10.7]]) box(dog.geo('steel'), [115, 121], [35, fy0], [z0, z1]);
  for (const [x0, x1] of slots) teethRow(dog.geo('steel'), x0 + 0.5, x1 - 0.5, -21, -9, fy1, L.feed.teeth);

  const rock = add(new Part('feed_rock_shaft'));
  const rk = L.rock;
  shaft(rock.geo('steel'), 'x', [0, rk.y, rk.z], [[3, rk.x[0]], [3, rk.x[1]]]);
  box(rock.geo('steel'), [rk.arm, rk.arm + 4], [rk.y, 40.5], [rk.z - 2, rk.z + 2], { round: 0.8 });
  box(rock.geo('steel'), [288, 292], [rk.y, 45], [rk.z - 2.5, rk.z + 2.5], { round: 0.8 });
  shaft(rock.geo('steel'), 'x', [0, 42, rk.z], [[1.5, 288], [1.5, 298]]);

  const lift = add(new Part('feed_lift_shaft'));
  const lf = L.lifter;
  shaft(lift.geo('steel'), 'x', [0, lf.y, lf.z], [[3, lf.x[0]], [3, lf.x[1]]]);
  box(lift.geo('steel'), [lf.arm, lf.arm + 6], [lf.y - 2.5, lf.y + 2.5], [lf.z, NZ + 2]);
  box(lift.geo('steel'), [lf.arm, lf.arm + 6], [lf.y + 2.5, 42], [NZ - 2, NZ + 2]);
  box(lift.geo('steel'), [309, 313], [lf.y - 2.5, lf.y + 2.5], [lf.z, NZ + 2]);
  shaft(lift.geo('steel'), 'x', [0, lf.y, NZ], [[1.5, 303], [1.5, 313]]);

  // The feed connecting rod: a strap round the feed-lifting eccentric, down the pillar to the lift shaft's crank.
  const rod = add(new Part('feed_rod'));
  const ex = L.ecc.x;
  plate(rod.geo('steel'), 'x', { outer: disc(11, NZ, SY + L.ecc.e), holes: [hole(disc(8.05, NZ, SY + L.ecc.e))] }, ex[0] + 0.5, ex[1] - 0.5);
  box(rod.geo('steel'), [ex[0] + 1, ex[1] - 1], [lf.y + 3.5, SY + L.ecc.e - 10.5], [NZ - 2, NZ + 2]);
  plate(rod.geo('steel'), 'x', { outer: disc(4, NZ, lf.y), holes: [hole(disc(1.55, NZ, lf.y))] }, ex[0] + 0.5, ex[1] - 0.5);

  // The feed forked connection: its prongs straddle the feed cam; its foot drives the feed rock shaft.
  const fork = add(new Part('feed_fork'));
  const cx = L.cam.x;
  const gap = 8 + L.cam.e + 0.5;
  for (const zs of [[NZ - gap - 3, NZ - gap], [NZ + gap, NZ + gap + 3]]) box(fork.geo('steel'), [cx[0] + 0.5, cx[1] - 0.5], [196, 226], zs);
  box(fork.geo('steel'), [cx[0] + 0.5, cx[1] - 0.5], [192, 196], [NZ - gap - 3, NZ + gap + 3]);
  box(fork.geo('steel'), [cx[0] + 1, cx[1] - 1], [46, 192], [NZ - 2, NZ + 2]);
  plate(fork.geo('steel'), 'x', { outer: disc(4, NZ, 42), holes: [hole(disc(1.55, NZ, 42))] }, cx[0] + 0.5, cx[1] - 0.5);

  // The stitch regulator on the arm's front: the indicator plate, its slot and the lever.
  const sl = add(new Part('stitch_lever'));
  const [lx, ly] = [335, 175];
  plate(sl.geo('chrome'), 'z', { outer: rect([322, 348], [104, 168], 4), holes: [hole(rect([332, 338], [112, 160], 3))] }, AZ1, AZ1 + 1.2);
  shaft(sl.geo('steel'), 'z', [lx, ly, 0], [[2.4, 10], [2.4, AZ1 + 4]]);
  turnedZ(sl.geo('chrome'), lx, ly, [[0, AZ1], [6, AZ1], [6, AZ1 + 3], [0, AZ1 + 3]]);
  box(sl.geo('chrome'), [lx - 2, lx + 2], [128, ly], [AZ1 + 3, AZ1 + 5]);
  shaft(sl.geo('japan'), 'z', [lx, 128, 0], [[4, AZ1 + 3], [4, AZ1 + 10], [3, AZ1 + 11]]);

  return parts;
}

export default async function generate({ data, check = true, log = console.log } = {}) {
  const parts = buildParts();
  const { doc, scene, nodes, pieces, parentOf } = await assemble({
    name: 'sewing-machine',
    parts,
    // Material names are global in the viewer: prefixed with the object.
    materials: (doc, { material }) => ({
      japan: material('sewing-machine_japan', '#141414', 0.15, 0.2),
      chrome: material('sewing-machine_chrome', '#d6dade', 1, 0.14),
      steel: material('sewing-machine_steel', '#a9aeb4', 1, 0.32),
      gold: material('sewing-machine_gold', '#c9a24c', 1, 0.3),
      wood: material('sewing-machine_wood', '#c8a06a', 0, 0.6),
      thread: material('sewing-machine_thread', '#b0262e', 0, 0.75),
      dark: material('sewing-machine_dark', '#202020', 0.2, 0.6),
    }),
  });
  const { toModel, unit, space, mmPerUnit, realSize } = modelSpace(scene);
  runChecks({ label: 'sewing-machine', pieces, contacts: CONTACTS, data, parentOf, mmPerUnit, check, log });
  log(`  sewing-machine: ${nodes.size} nodes, ${realSize.join(' × ')} mm`);

  // Turns per turn of the arm shaft (one stitch), about +y (upright, hook) or +x (drive). In a bevel pair the
  // driven gear turns −d_driver / d_driven times as fast about its own axis pointing away from the apex.
  const upright = L.bevel.large / L.bevel.small;
  const drive = upright;
  const hook = -drive;

  // Rocking parts are driven as cranks on the arm shaft with a vanishingly short rod: they then only turn,
  // by asin(throw / rod × sin(angle + phase)), and slide a hair's breadth along their own axis.
  const tiny = 0.002;
  const rockArm = 40.5 - 2 - L.rock.y; // where the rock shaft's arm bears in the feed bar's fork, above its axis
  const kRock = L.feed.travel / 2 / rockArm;
  const kLift = L.feed.lift / 2 / (L.nz - L.lifter.z);
  const kFork = (kRock * (42 - L.rock.y)) / (SY - 42);
  const kTake = Math.sin(L.takeUp.swing * DEG);

  return {
    doc,
    hints: {
      space,
      pivots: {
        arm_shaft: toModel([200, SY, NZ]),
        balance_wheel: toModel([400, SY, NZ]),
        upright_shaft: toModel([L.upX, 100, NZ]),
        hook_drive_shaft: toModel([190, L.driveY, NZ]),
        hook: toModel([L.hook.x, 30, NZ]),
        needle_bar: toModel([NX, 170, NZ]),
        needle_link: toModel([66, L.bar.stud, NZ]),
        take_up_lever: toModel([L.takeUp.x, ...L.takeUp.hinge]),
        feed_rod: toModel([306, L.lifter.y, NZ]),
        feed_fork: toModel([295, SY, NZ]),
        feed_rock_shaft: toModel([200, L.rock.y, L.rock.z]),
        feed_lift_shaft: toModel([200, L.lifter.y, L.lifter.z]),
        feed_lifter: toModel([100, 44, NZ]),
        feed_dog: toModel([100, 44, NZ]),
      },
      anchors: {
        wheel_top: toModel([399, SY + L.wheel.r, NZ]),
        wheel_knob: toModel([420, SY, NZ]),
        wheel_face: toModel([408, SY + 30, NZ]),
        wheel_hub: toModel([389, SY + 8, NZ - 14]),
        motor: toModel([336, 205 + 24, L.arm.z[0] - 24]),
        motor_end: toModel([382, 205, L.arm.z[0] - 24]),
        crank: toModel([72, SY + 18, NZ]),
        crank_pin: toModel([64, SY + R, NZ]),
        arm_shaft: toModel([200, SY + L.shaftR, NZ]),
        arm_shaft_mid: toModel([200, SY, NZ]),
        arm_shaft_right: toModel([380, SY, NZ]),
        link: toModel([67.5, (L.bar.stud + SY + R) / 2, NZ]),
        needle_bar: toModel([NX + L.bar.r, 125, NZ]),
        needle: toModel([NX, L.needle.point + 8, NZ]),
        needle_point: toModel([NX, L.needle.point, NZ]),
        take_up_eye: toModel([L.takeUp.x, L.takeUp.hinge[0] + 3.6, L.takeUp.hinge[1] + L.takeUp.length]),
        tension: toModel([75, 185 + 8.5, L.arm.z[1] + 9]),
        tension_face: toModel([75, 185, L.arm.z[1] + 12]),
        spool: toModel([230, 292, -30]),
        bevel_top: toModel([L.upX + 6, SY - 16, NZ]),
        upright: toModel([L.upX + 4, 110, NZ]),
        bevel_bottom: toModel([L.upX - 8, L.driveY + 8, NZ]),
        drive_shaft: toModel([190, L.driveY + 4, NZ]),
        drive_mid: toModel([190, L.driveY, NZ]),
        hook_gears: toModel([L.hook.x + 8, L.driveY + 8, NZ]),
        hook: toModel([L.hook.x, (L.hook.floor + L.hook.rim) / 2, NZ + L.hook.r]),
        hook_axis: toModel([L.hook.x, 30, NZ]),
        beak: toModel([L.hook.x + 19 * Math.cos(BEAK), L.hook.beakTop, NZ - 19 * Math.sin(BEAK)]),
        bobbin: toModel([L.hook.x, L.bobbin.y + L.bobbin.h, NZ]),
        bobbin_case: toModel([L.hook.x, 38.5, NZ + L.caseR]),
        needle_hole: toModel([NX, L.bed.top, NZ]),
        feed_dog: toModel([NX, L.feed.teeth, -9]),
        feed_teeth: toModel([56.5, L.feed.teeth, NZ]),
        feed_bar: toModel([100, L.feed.y[0], NZ]),
        rock_arm: toModel([118, 36, L.rock.z]),
        lift_arm: toModel([99, 42, NZ]),
        rock_shaft: toModel([230, L.rock.y + 3, L.rock.z]),
        lift_shaft: toModel([230, L.lifter.y + 3, L.lifter.z]),
        feed_rod: toModel([306, 120, NZ + 2]),
        feed_fork: toModel([295, 120, NZ + 2]),
        feed_cam: toModel([295, SY - L.cam.e, NZ]),
        stitch_lever: toModel([335, 128, L.arm.z[1] + 11]),
        stitch_plate: toModel([335, 150, L.arm.z[1] + 1.2]),
        throat_plate: toModel([72, L.bed.top, 0]),
        slide_plate: toModel([36, L.bed.top, 0]),
        presser_foot: toModel([NX, L.presser.sole + 2, -2]),
        face_plate: toModel([23, 200, NZ]),
        arm_front: toModel([200, 215, L.arm.z[1]]),
        arm_top: toModel([200, 250, NZ]),
        pillar: toModel([326, 120, L.arm.z[1]]),
        bed_front: toModel([200, L.bed.top, L.bed.z[1]]),
        bed_under: toModel([180, 0, NZ]),
      },
      // Turns of each part per turn of the arm shaft (one stitch), signed about the content's axes.
      turns: { arm: 1, upright, drive, hook },
      // The crank and cam motions' numbers, in model units (phases in degrees).
      motion: {
        needle: { throw: unit(R), rod: unit(L.link) },
        takeUp: { throw: +(kTake * tiny).toFixed(7), rod: tiny, phase: L.takeUp.phase },
        rock: { throw: +(kRock * tiny).toFixed(7), rod: tiny },
        lift: { throw: +(kLift * tiny).toFixed(7), rod: tiny },
        fork: { throw: +(kFork * tiny).toFixed(7), rod: tiny },
        rod: { throw: unit(L.ecc.e), rod: unit(SY + L.ecc.e - L.lifter.y) },
        feed: { throw: unit(L.feed.travel / 2), rod: 1, lift: unit(L.feed.lift), duration: L.feed.duration },
      },
      // The numbers the charts and the text use.
      stitch: {
        stroke: L.stroke,
        catchDeg: +((CATCH * 180) / Math.PI).toFixed(1),
        rise: L.hook.rise,
        lift: L.feed.lift,
        travel: L.feed.travel,
        teeth: { upper: [L.bevel.large, L.bevel.small], lower: [L.bevel.small, L.bevel.small], hook: [L.bevel.small, L.bevel.small] },
        needleOut: +((Math.acos(1 - (L.needle.point - L.bed.top) / R) * 180) / Math.PI).toFixed(1),
        takeUpPhase: L.takeUp.phase,
      },
    },
  };
}
