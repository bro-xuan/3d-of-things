// The typewriter's layout and its strokes, in millimetres in the object's frame (x to the typist's right, y up, z
// towards the typist). generate.mjs builds from it and content.mjs samples its strokes for the motions' curves, so the
// model and the curves can't disagree. The Underwood's own numbers are src/viewer/underwood.json (shared with
// src/viewer/typewriter.ts, whose dipAt, swingAt and stepAt are the same sums as here); TRUTH.md says which are
// Underwood's and which are ours.
//
// Every type bar lives in a vertical plane through the segment's centre C, at angle phi round from the front (+z)
// towards +x. In that plane, r runs out from C's vertical axis and h up from the pivots; a bar at angle theta points
// along (cos theta, sin theta) in (r, h). At rest theta = -5 deg (lying in the basket, pointing at the typist); at the
// strike it points at the printing point P straight above C, so all 42 bars meet there.
import { readFileSync } from 'node:fs';

export const U = JSON.parse(readFileSync(new URL('../../src/viewer/underwood.json', import.meta.url), 'utf8'));
export const DEG = Math.PI / 180;

// ---------------------------------------------------------------- vectors
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const unit = (a) => mul(a, 1 / Math.hypot(...a));
/** `p` turned by `angle` (radians) about the line through `origin` along unit `axis` (Rodrigues). */
export function turn(p, axis, angle, origin = [0, 0, 0]) {
  const v = sub(p, origin);
  const [c, s] = [Math.cos(angle), Math.sin(angle)];
  const r = add(add(mul(v, c), mul(cross(axis, v), s)), mul(axis, dot(axis, v) * (1 - c)));
  return add(r, origin);
}

// ---------------------------------------------------------------- numbers
export const L = {
  /** The segment's centre: the bars' pivots lie on a circle of segmentR round it, at this height. */
  C: [0, 99, -70],
  /** The slots span this much of a half circle (degrees). */
  arc: 170,
  bar: { depth: 2.8, thick: 1.2, end: 90, slug: [2.6, 5.4, 3] },
  /** Where the link takes hold of the heel, mm behind the pivot. */
  linkAt: 6,
  segment: { r: [38, 56], h: [-6, 5], fin: 1.5, rim: [56, 60], wire: 0.7 },
  /** The type bar rest: a felt pad under the bars' heads. */
  pad: { r: [112, 128] },
  platen: { r: 22.5, x: 126, axle: 4, knob: [136, 152, 15] },
  paper: { r: [22.55, 22.7], x: 108, top: 30, back: 90, from: -150, to: 40 },
  /** Ink: hidden under the paper, out on its face once struck. */
  ink: { r: [22.3, 22.76], h: 2.5 },
  keys: {
    rows: [
      { keys: '234567890-=', x0: -103, z: 82, y: 89 },
      { keys: 'qwertyuiop½', x0: -95, z: 100, y: 78 },
      { keys: 'asdfghjkl;', x0: -90, z: 118, y: 67 },
      { keys: 'zxcvbnm,./', x0: -81, z: 136, y: 56 },
    ],
    pitch: 19,
    top: 6.4,
    fulcrum: [21, -128],
    lever: [18, 24],
    thick: 1.6,
  },
  /** Sublevers: on a rod at F (y, z), out to the link's end at z = A; the key lever's wire takes hold at z = wire. */
  sub: { F: [48, 25], A: -28, wire: -15, y: [45, 51] },
  /** The universal bar: an arc under the slots, lifted by the heels at the end of the swing. */
  ub: { r: [46.5, 52], h: [-11.4, -8.6], back: -118 },
  rocker: { pivot: [108, -135], arm: 7, dog: 11 },
  wheel: { at: [0, 131.53], z: [-136, -134], root: 11.5 },
  pinion: { z: [-130, -126] },
  rack: { y: 138, z: [-131, -125], x: 127 },
  rail: { y: [120, 128], z: [-120, -100] },
  carriage: { plate: [127, 131], z: [-134, -64], y: [133, 205] },
  band: { z: -145, y: [152, 164], hook: 129 },
  drum: { at: [-175, -165], barrel: 20, cup: 34, y: [148, 170] },
  ribbon: { width: 12.7, spool: [105, -50, 14], centre: 18, lift: 9, out: 1.6 },
  frame: { side: [146, 152], back: [-150, -146], front: [158, 164] },
};
L.wheel.r = U.wheel.r;
L.pinion.teeth = U.wheel.teeth;
L.pinion.module = U.pitch / Math.PI;
L.pinion.r = (L.pinion.teeth * L.pinion.module) / 2;
L.wheel.at[1] = L.rack.y - L.pinion.r;

/** Pivot to the paper: the slug meets it straight above C. */
export const HEIGHT = Math.sqrt(U.bar ** 2 - U.segmentR ** 2);
export const P = [L.C[0], L.C[1] + HEIGHT, L.C[2]];
/** The bar's angle at the strike, and its whole swing (degrees). */
export const STRIKE = 180 - Math.atan2(HEIGHT, U.segmentR) / DEG;
export const SWING = STRIKE - U.rest;
/** The platen's outward normal at the printing point: square to the middle bar as it strikes. */
const HIT = (STRIKE - 90) * DEG;
export const NP = [0, Math.sin(HIT), Math.cos(HIT)];
/** Up the paper at the printing point (the way the lines run up the page), and the platen's axis. */
export const UP = [0, NP[2], -NP[1]];
export const Q = sub(P, mul(NP, L.platen.r + 0.25));

// ---------------------------------------------------------------- strokes (as src/viewer/typewriter.ts)
const clamp = (x) => Math.min(1, Math.max(0, x));
export const dipAt = (s) => Math.sin(Math.PI * clamp(s));
export const swingAt = (s) => dipAt(s) ** U.throw;
/** The bar's angle (degrees, in its plane) through a stroke. */
export const barAngle = (s) => U.rest + SWING * swingAt(s);
/** The heel's tip in (r, h): it points back from the pivot, opposite the bar. */
export const heelTip = (theta, len = U.heel) => [U.segmentR + len * Math.cos((theta + 180) * DEG), len * Math.sin((theta + 180) * DEG)];
/** The heel's tip as it meets the universal bar (the slug 7/8 inch from the paper), and how far it has lifted it by s. */
const PICKUP = STRIKE - (U.pickup / U.bar) / DEG;
export const UB_H = heelTip(PICKUP)[1];
export const ubLift = (s) => {
  const theta = barAngle(s);
  return theta > PICKUP ? heelTip(theta)[1] - UB_H : 0;
};
/** The ribbon guide's lift (0–1): up with the key, there before the strike. */
export const ribbonAt = (s) => Math.min(1, dipAt(s) / 0.8);

// ---------------------------------------------------------------- the keyboard and its bars
/** The 42 keys, each with its bar's slot round the segment: the slots run left to right in the keys' order across. */
export const KEYS = (() => {
  const keys = [];
  L.keys.rows.forEach((row, r) => {
    [...row.keys].forEach((ch, j) => keys.push({ ch, row: r, x: row.x0 + L.keys.pitch * j, z: row.z, y: row.y }));
  });
  [...keys].sort((a, b) => a.x - b.x).forEach((key, slot) => (key.slot = slot));
  for (const key of keys) {
    key.phi = (-L.arc / 2 + (key.slot * L.arc) / (keys.length - 1)) * DEG;
    key.id = /[a-z]/.test(key.ch) ? key.ch : `k${key.slot}`;
  }
  return keys;
})();

/** A bar's plane: out (radial, horizontal), up, and its pivot axis (turning about it by +theta takes out to up). */
export function plane(phi) {
  const out = [Math.sin(phi), 0, Math.cos(phi)];
  const up = [0, 1, 0];
  return { out, up, axis: cross(out, up) };
}
/** A point in a bar's plane, (r, h), in the object's frame. */
export const inPlane = (phi, r, h) => add(L.C, [r * Math.sin(phi), h, r * Math.cos(phi)]);

/** Where a key's chain is at stroke s: key lever angle, sublever angle (radians about +x), the bar's angle (degrees),
 *  and the link's two ends. */
export function chain(key, s) {
  const [fy, fz] = L.keys.fulcrum;
  const kappa = (U.dip * dipAt(s)) / (key.z - fz);
  // The key lever's wire pulls the sublever down where it takes hold, as far as the lever moves there.
  const pull = kappa * (L.sub.wire - fz);
  const sigma = -pull / (L.sub.F[1] - L.sub.wire);
  const A0 = [key.x, L.sub.y[0] + 1, L.sub.A];
  const A = turn(A0, [1, 0, 0], sigma, [key.x, L.sub.F[0], L.sub.F[1]]);
  const theta = barAngle(s);
  const [r, h] = heelTip(theta, L.linkAt);
  return { kappa, sigma, theta, A, B: inPlane(key.phi, r, h) };
}
