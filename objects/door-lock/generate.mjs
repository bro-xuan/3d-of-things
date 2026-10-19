// Build step for the pin tumbler lock (content/door-lock.json → build.generate): a five-pin cylinder of
// the kind in a single-cylinder deadbolt, keyed to Schlage Classic numbers, with its key, a wrong key, the
// tailpiece and the retaining clip, built whole in code. Millimetres, x to the right, y up, z towards the
// front; the plug turns about the z axis and its face is at z = 0, where the key's shoulder stops.
//
// The numbers (cut positions and depths, pin lengths, the key's profile) come from the lock's module,
// src/viewer/pinlock.ts, which the viewer runs and the charts read: the key built here is the key whose
// edge the pins ride on the page. Holes are true round holes: surfaces are tessellated finely where a
// pin chamber crosses them and cut along the chamber with the kit's openHoles.
import { geometry, solids, shapes, surgery, Part, assemble, modelSpace, runChecks } from '../../scripts/kit/index.mjs';
import { LOCK, KEYS, cutAt, keyHeight, keyLow, rootDepth, keyPinLength, driverPinLength } from '../../src/viewer/pinlock.ts';

const { Geo, lathe, flat, circle, ccw, cw } = geometry;
const DEG = Math.PI / 180;

/** The numbers that matter (mm). The keying is the module's; the rest is this model's. */
export const L = {
  R: LOCK.plug / 2,
  /** A pin's radius, and its hole's. */
  pin: LOCK.pin / 2,
  hole: 1.5,
  /** The keyway: a plain slot this wide (half), its roof just over the blade's top. */
  kw: 1.1,
  /** The key's blade lies on the bore's bottom: root depth + key pin = .500" puts every gap on the shear line. */
  blade: -LOCK.plug / 2,
  /** A key pin's tip: a flat this wide (radius), and a cone this tall up to the pin's full width. */
  tipFlat: LOCK.pinFlat,
  cone: LOCK.pinCone,
  plug: { z: [-30, -1], lip: 7.4, tail: 5, groove: [4.3, -31, -30.25], tailEnd: -34, slot: -32 },
  shell: { r: 8.4, bible: 3.3, top: 18, back: -30.2, counterbore: 7.45 },
  cover: { t: 0.6, z: [-24.4, -3.2], w: 3.0 },
  spring: { r: 1.12, wire: 0.17, coils: 6 },
  clip: { t: 0.55, z: -30.3, inner: 4.35, outer: 7.6 },
  tailpiece: { w: 0.8, h: 3.6, z: [-50, -32.05] },
  key: { t: 1.0, neck: 3.2, bow: [3, 25], bowY: [-13.6, 9.6], ring: 2.6 },
};
L.keywayTop = L.blade + LOCK.blade + 0.35;
/** The drilled holes' ledges, where a key pin's cone is as wide as the keyway with its tip at the module's drop. */
L.ledge = L.blade + LOCK.drop + (L.cone * (L.kw - L.tipFlat)) / (L.pin - L.tipFlat);
/** The pins' z: cut i is cutAt(i) from the shoulder, and the shoulder is at the plug's face. */
L.pins = KEYS.right.map((_, i) => -cutAt(i));

/** Pairs that touch by design. */
export const CONTACTS = [
  ['key', 'plug'], ['key', 'shell'], ['key_pin_*', 'key'], ['driver_pin_*', 'key_pin_*'],
  ['spring_*', 'spring_*'], ['spring_*', 'driver_pin_*'], ['spring_*', 'spring_cover'], ['spring_cover', 'shell'],
  ['plug', 'shell'], ['tailpiece', 'plug'], ['retaining_clip', 'plug'],
];

// ------------------------------------------------------------------- helpers

/** Rows along z from z0 to z1: every `fine` mm within reach of a pin's hole, `coarse` elsewhere. */
function rows(z0, z1, fine = 0.12, coarse = 2) {
  const out = [];
  let z = z0;
  while (z < z1 - 1e-9) {
    out.push(z);
    const near = L.pins.some((p) => Math.abs(z - p) < L.hole + 0.4 || Math.abs(z + coarse - p) < L.hole + 0.4);
    z = Math.min(z1, z + (near ? fine : coarse));
  }
  out.push(z1);
  return out;
}

/** A cylinder's surface about the z axis from angle a0 over `span` degrees, facing out (or in). */
function band(geo, r, zs, a0, span, segments, { inward = false } = {}) {
  const local = new Geo();
  const profile = zs.map((z) => [r, z]);
  lathe(local, inward ? profile.reverse() : profile, { segments, start: a0 * DEG, length: span * DEG });
  geo.append(local);
}

/** Opens the pin holes (vertical, round) in a mesh near height `level`. */
function drill(geo, level, depth = 1.2) {
  const mesh = shapes.openHoles(surgery.fromGeo(geo), L.pins.map((z) => ({ axis: 'y', level, depth, sdf: shapes.sdCircle(0, z, L.hole) })));
  const out = new Geo();
  out.positions = mesh.positions;
  out.normals = mesh.normals;
  out.uvs = mesh.uvs ?? new Array((mesh.positions.length / 3) * 2).fill(0);
  out.indices = mesh.indices;
  return out;
}

/** A flat face in the plane y = level from outlines in (x, z), facing dir (±1). */
function faceY(geo, shape, level, dir) {
  const local = new Geo();
  flat(local, { outer: solids.toLocal('y', shape.outer), holes: (shape.holes ?? []).map((h) => solids.toLocal('y', h)) }, level, dir);
  solids.put(geo, local, 'y');
}

/** Walls along z from z0 to z1 under an open polyline in (x, y) that runs with the outside on its right. */
function walls(geo, line, z0, z1, crease = 35) {
  const seg = line.slice(0, -1).map(([x0, y0], i) => {
    const [x1, y1] = line[i + 1];
    const l = Math.hypot(x1 - x0, y1 - y0) || 1;
    return [(y1 - y0) / l, -(x1 - x0) / l];
  });
  const cosCrease = Math.cos(crease * DEG);
  const normalAt = (i, k) => {
    const own = seg[i];
    const other = k === i ? seg[i - 1] : seg[k];
    if (!other || other[0] * own[0] + other[1] * own[1] < cosCrease) return own;
    const m = [own[0] + other[0], own[1] + other[1]];
    const l = Math.hypot(...m);
    return [m[0] / l, m[1] / l];
  };
  for (let i = 0; i < line.length - 1; i++) {
    const [p, q] = [line[i], line[i + 1]];
    const [np, nq] = [normalAt(i, i), normalAt(i, i + 1)];
    const a = geo.vertex([p[0], p[1], z0], [np[0], np[1], 0]);
    const b = geo.vertex([q[0], q[1], z0], [nq[0], nq[1], 0]);
    const c = geo.vertex([q[0], q[1], z1], [nq[0], nq[1], 0]);
    const d = geo.vertex([p[0], p[1], z1], [np[0], np[1], 0]);
    geo.tri(a, b, c, [np[0], np[1], 0]);
    geo.tri(a, c, d, [np[0], np[1], 0]);
  }
}

/** A vertical round hole's wall, facing in, round the pin at z: from bottom(x) up to top(x), x across it. */
function holeWall(geo, z, bottom, top, extra = []) {
  const angles = [...Array.from({ length: 48 }, (_, k) => (k / 48) * 360), ...extra].sort((a, b) => a - b);
  angles.push(angles[0] + 360);
  const at = (t) => [L.hole * Math.cos(t), z + L.hole * Math.sin(t)];
  for (let k = 0; k < angles.length - 1; k++) {
    const [a, b] = [angles[k] * DEG, angles[k + 1] * DEG];
    if (b - a < 1e-6) continue;
    const lo = bottom(L.hole * Math.cos((a + b) / 2));
    const [xa, za] = at(a);
    const [xb, zb] = at(b);
    const na = [-Math.cos(a), 0, -Math.sin(a)];
    const nb = [-Math.cos(b), 0, -Math.sin(b)];
    const v0 = geo.vertex([xa, lo, za], na);
    const v1 = geo.vertex([xb, lo, zb], nb);
    const v2 = geo.vertex([xb, top(xb), zb], nb);
    const v3 = geo.vertex([xa, top(xa), za], na);
    const mid = [-Math.cos((a + b) / 2), 0, -Math.sin((a + b) / 2)];
    geo.tri(v0, v1, v2, mid);
    geo.tri(v0, v2, v3, mid);
  }
}

const onBore = (x) => Math.sqrt(L.R * L.R - x * x);

/** An arc of points on a circle round the z axis, from angle a0 to a1 (radians). */
const arc = (r, a0, a1, n) => Array.from({ length: n + 1 }, (_, k) => {
  const a = a0 + ((a1 - a0) * k) / n;
  return [r * Math.cos(a), r * Math.sin(a)];
});

/** A key's blade in (z, y): its top edge is the module's profile for this bitting, with the shoulder and neck. */
function keyBlade(bitting) {
  const y0 = L.blade;
  const pts = [[L.key.neck, y0], [-LOCK.tipBottom, y0]];
  for (let s = LOCK.tipBottom + 0.2; s < LOCK.tipEnd; s += 0.2) pts.push([-s, y0 + keyLow(s)]);
  pts.push([-LOCK.tipEnd, y0 + LOCK.tipLow], [-LOCK.tipEnd, y0 + LOCK.tipHigh]);
  for (let s = LOCK.tipEnd - 0.05; s > 0.02; s -= 0.05) pts.push([-s, y0 + keyHeight(bitting, s)]);
  // The shoulder: a step up at the plug's face, which stops the key.
  pts.push([0, y0 + LOCK.blade], [0, y0 + LOCK.blade + 1.2], [L.key.neck, y0 + LOCK.blade + 1.2]);
  return pts;
}

/** A key, its blade's bottom on y = L.blade and its shoulder at z = 0, moved by `offset`. */
function buildKey(part, bitting, offset = [0, 0, 0]) {
  const local = new Geo();
  solids.plate(local, 'x', { outer: keyBlade(bitting) }, -L.key.t, L.key.t);
  const [b0, b1] = L.key.bow;
  const [y0, y1] = L.key.bowY;
  const ring = circle(L.key.ring, b1 - 6, (y0 + y1) / 2 - 0.5, 36);
  solids.plate(local, 'x', { outer: shapes.roundRect((b0 + b1) / 2, (y0 + y1) / 2, b1 - b0, y1 - y0, 7), holes: [ring] }, -L.key.t - 0.25, L.key.t + 0.25, { chamfer: 0.25, chamferBottom: 0.25 });
  part.geo('key').append(local, (p, n) => [p.map((v, i) => v + offset[i]), n]);
}

// ------------------------------------------------------------------- parts

export function buildParts() {
  const parts = [];
  const add = (name, opts) => {
    const p = new Part(name, opts);
    parts.push(p);
    return p;
  };
  const { R } = L;
  const [pz0, pz1] = L.plug.z;
  const S = L.shell;

  // ---- the shell: a bore for the plug, five chambers drilled up through the bible on top
  const shell = add('shell');
  const sg = shell.geo('brass');
  const boreTop = new Geo();
  band(boreTop, R, rows(S.back, -1), 60, 60, 72, { inward: true });
  sg.append(drill(boreTop, R - 0.4));
  band(sg, R, [S.back, -1], 120, 300, 120, { inward: true });
  for (const z of L.pins) holeWall(sg, z, onBore, () => S.top);
  // The outside: the round body and the bible, but not the bible's top, which has the chambers' mouths.
  const rc = 0.9;
  const yJoin = Math.sqrt(S.r * S.r - S.bible * S.bible);
  const line = [
    ...arc(rc, Math.PI / 2, Math.PI, 6).map(([x, y]) => [x - S.bible + rc, y + S.top - rc]),
    ...arc(S.r, Math.atan2(yJoin, -S.bible), Math.atan2(yJoin, S.bible) + 2 * Math.PI, 120),
    ...arc(rc, 0, Math.PI / 2, 6).map(([x, y]) => [x + S.bible - rc, y + S.top - rc]),
  ];
  walls(sg, line, S.back, 0);
  const top = [[-S.bible + rc, S.back], [S.bible - rc, S.back], [S.bible - rc, 0], [-S.bible + rc, 0]];
  faceY(sg, { outer: top, holes: L.pins.map((z) => circle(L.hole, 0, z, 48)) }, S.top, 1);
  flat(sg, { outer: line, holes: [circle(S.counterbore, 0, 0, 96)] }, 0, 1);
  flat(sg, { outer: line, holes: [circle(R, 0, 0, 96)] }, S.back, -1);
  // The counterbore the plug's lip sits in.
  band(sg, S.counterbore, [-1, 0], 0, 360, 96, { inward: true });
  flat(sg, { outer: circle(S.counterbore, 0, 0, 96), holes: [circle(R, 0, 0, 96)] }, -1, 1);

  const cover = add('spring_cover', { parent: 'shell' });
  solids.box(cover.geo('nickel'), [-L.cover.w, L.cover.w], [S.top, S.top + L.cover.t], L.cover.z, { round: 1.2 });

  // ---- the plug: a keyway up its middle, open at the bottom, and five holes drilled down into it
  const plug = add('plug');
  const pg = plug.geo('plugbrass');
  const slot = Math.asin(L.kw / R) / DEG;
  const plugTop = new Geo();
  band(plugTop, R, rows(pz0, pz1), 60, 60, 72);
  pg.append(drill(plugTop, R - 0.4));
  band(pg, R, [pz0, pz1], 120, 150 - slot, 60);
  band(pg, R, [pz0, pz1], -90 + slot, 150 - slot, 60);
  // The lip at the face, and the face itself round the keyway's mouth.
  const yLip = -Math.sqrt(L.plug.lip ** 2 - L.kw ** 2);
  const lipLoop = [...arc(L.plug.lip, Math.atan2(yLip, L.kw), Math.atan2(yLip, -L.kw) + 2 * Math.PI, 120), [-L.kw, L.keywayTop], [L.kw, L.keywayTop]];
  solids.plate(pg, 'z', { outer: lipLoop }, -1, 0);
  // The back face, a C round the keyway.
  const yBody = -Math.sqrt(R * R - L.kw * L.kw);
  flat(pg, { outer: [...arc(R, Math.atan2(yBody, L.kw), Math.atan2(yBody, -L.kw) + 2 * Math.PI, 96), [-L.kw, L.keywayTop], [L.kw, L.keywayTop]] }, pz0, -1);
  // The keyway's sides, open where the holes cross them, and its roof, with the holes in it.
  const reach = Math.sqrt(L.hole ** 2 - L.kw ** 2);
  for (const side of [-1, 1]) {
    const x = side * L.kw;
    const n = [-side, 0, 0];
    const quad = (y0, y1, z0, z1) => {
      const a = pg.vertex([x, y0, z0], n);
      const b = pg.vertex([x, y0, z1], n);
      const c = pg.vertex([x, y1, z1], n);
      const d = pg.vertex([x, y1, z0], n);
      pg.tri(a, b, c, n);
      pg.tri(a, c, d, n);
    };
    quad(yBody, L.ledge, pz0, pz1);
    const cuts = [pz0, ...[...L.pins].reverse().flatMap((z) => [z - reach, z + reach]), pz1];
    for (let k = 0; k < cuts.length; k += 2) quad(L.ledge, L.keywayTop, cuts[k], cuts[k + 1]);
  }
  const roof = new Geo();
  const zs = rows(pz0, pz1, 0.1, 2);
  for (let k = 0; k < zs.length - 1; k++) {
    for (let j = 0; j < 6; j++) {
      const xa = -L.kw + (2 * L.kw * j) / 6;
      const xb = -L.kw + (2 * L.kw * (j + 1)) / 6;
      const v = (x, z) => roof.vertex([x, L.keywayTop, z], [0, -1, 0]);
      const [p, q, r, s] = [v(xa, zs[k]), v(xb, zs[k]), v(xb, zs[k + 1]), v(xa, zs[k + 1])];
      roof.tri(p, q, r, [0, -1, 0]);
      roof.tri(p, r, s, [0, -1, 0]);
    }
  }
  pg.append(drill(roof, L.keywayTop, 0.2));
  // The holes: from their ledges (beside the keyway) or the keyway's roof up to the plug's surface.
  const tAngle = Math.acos(L.kw / L.hole) / DEG;
  for (const z of L.pins) {
    holeWall(pg, z, (x) => (Math.abs(x) >= L.kw ? L.ledge : L.keywayTop), onBore, [tAngle, 360 - tAngle, 180 - tAngle, 180 + tAngle]);
    // The ledges a key pin's cone rests on with no key in.
    for (const side of [1, -1]) {
      const pts = arc(L.hole, -tAngle * DEG, tAngle * DEG, 12).map(([x, y]) => [side * x, z + y]);
      faceY(pg, { outer: pts }, L.ledge, 1);
    }
  }
  // The tail: a groove for the clip, and a slot across its end for the tailpiece.
  const [gr, gz0, gz1] = L.plug.groove;
  solids.shaft(pg, 'z', [0, 0, 0], [[0, pz0], [L.plug.tail, pz0], [L.plug.tail, gz1], [gr, gz1], [gr, gz0], [L.plug.tail, gz0], [L.plug.tail, L.plug.slot], [0, L.plug.slot]], { segments: 64 });
  const sw = L.tailpiece.w + 0.05;
  const ys = Math.atan2(Math.sqrt(L.plug.tail ** 2 - sw * sw), sw);
  for (const side of [1, -1]) {
    const half = [...arc(L.plug.tail, -ys, ys, 32)].map(([x, y]) => [side * x, y]);
    solids.plate(pg, 'z', { outer: half }, L.plug.tailEnd, L.plug.slot);
  }

  // ---- the key pins, in the plug, each cut to its cut: tip on the key, top on the shear line
  KEYS.right.forEach((depth, i) => {
    const pin = add(`key_pin_${i + 1}`, { parent: 'plug' });
    const tip = L.blade + rootDepth(depth);
    const len = keyPinLength(depth);
    solids.revolve(pin.geo('pin'), 'y', [0, 0, L.pins[i]], [[0, tip], [L.tipFlat, tip], [L.pin, tip + L.cone], [L.pin, tip + len - 0.15], [L.pin - 0.15, tip + len], [0, tip + len]], { segments: 40 });
  });
  // ---- the driver pins, in the shell, standing on them; the springs above
  KEYS.right.forEach((depth, i) => {
    const pin = add(`driver_pin_${i + 1}`, { parent: 'shell' });
    const len = driverPinLength(depth);
    solids.revolve(pin.geo('steel'), 'y', [0, 0, L.pins[i]], [[0, R], [L.pin - 0.15, R], [L.pin, R + 0.15], [L.pin, R + len - 0.15], [L.pin - 0.15, R + len], [0, R + len]], { segments: 40 });
  });
  add('springs', { parent: 'shell' });
  KEYS.right.forEach((depth, i) => {
    const y0 = R + driverPinLength(depth) + L.spring.wire;
    const y1 = S.top - L.spring.wire;
    const n = L.spring.coils;
    for (let k = 0; k < n; k++) {
      const coil = add(`spring_${i + 1}_${k}`, { parent: 'springs' });
      const path = shapes.helix('y', [0, 0, L.pins[i]], L.spring.r, y0 + ((y1 - y0) * k) / n, y0 + ((y1 - y0) * (k + 1)) / n, 1, 28);
      shapes.tube(coil.geo('spring'), path, L.spring.wire, { segments: 6 });
    }
  });

  // ---- the key, in the lock, and the wrong key, beside it and drawn out
  buildKey(add('key', { parent: 'plug' }), KEYS.right);
  buildKey(add('wrong_key'), KEYS.wrong, [LOCK.apart, 0, LOCK.out]);

  // ---- the output: the clip that holds the plug in, and the tailpiece that turns the bolt's drive
  const clip = add('retaining_clip', { parent: 'plug' });
  const c = L.clip;
  // A horseshoe, open at the top: it slides down onto the groove.
  const clipLoop = [...arc(c.outer, Math.PI, 2 * Math.PI, 48), [c.outer, 6], [c.inner + 0.9, 6], ...arc(c.inner, 2 * Math.PI, Math.PI, 48), [-c.inner - 0.9, 6], [-c.outer, 6]];
  solids.plate(clip.geo('clip'), 'z', { outer: clipLoop }, c.z - c.t, c.z);

  const tail = add('tailpiece', { parent: 'plug' });
  const t = L.tailpiece;
  solids.box(tail.geo('zinc'), [-t.w, t.w], [-t.h, t.h], t.z, { axis: 'z', chamfer: 0.2 });

  return parts;
}

export default async function generate({ data, check = true, log = console.log } = {}) {
  const parts = buildParts();
  const { doc, scene, nodes, pieces, parentOf } = await assemble({
    name: 'door-lock',
    parts,
    materials: (doc, { material }) => ({
      brass: material('lock_brass', '#c9a457', 1, 0.36),
      plugbrass: material('lock_plug', '#d4b26a', 1, 0.3),
      pin: material('lock_keypin', '#d8b36a', 1, 0.28),
      steel: material('lock_driver', '#b9bdc2', 1, 0.3),
      spring: material('lock_spring', '#6d7278', 1, 0.38),
      nickel: material('lock_nickel', '#c7c9c8', 1, 0.3),
      key: material('lock_key', '#ddd8c6', 0.85, 0.36),
      clip: material('lock_clip', '#3a3d42', 0.8, 0.42),
      zinc: material('lock_zinc', '#a9aeb4', 1, 0.4),
    }),
  });
  const { toModel, space, mmPerUnit, realSize, unit } = modelSpace(scene);
  runChecks({ label: 'door-lock', pieces, contacts: CONTACTS, data, parentOf, mmPerUnit, check, log });
  log(`  door-lock: ${nodes.size} nodes, ${realSize.join(' × ')} mm`);

  const { R, shell: S, pins: z } = L;
  const each = (name, f) => Object.fromEntries(z.map((zi, i) => [`${name}_${i + 1}`, toModel(f(zi, i))]));
  return {
    doc,
    hints: {
      space,
      pivots: { plug: toModel([0, 0, 0]) },
      anchors: {
        key_bow: toModel([L.key.t + 0.3, -2, 14]),
        key_blade: toModel([L.key.t, L.blade + 4, -12]),
        key_tip: toModel([0, L.blade + 3, -LOCK.tipEnd]),
        wrong_bow: toModel([LOCK.apart + L.key.t + 0.3, -2, LOCK.out + 14]),
        wrong_cut: toModel([LOCK.apart + L.key.t, L.blade + rootDepth(KEYS.wrong[3]), LOCK.out - cutAt(3)]),
        ...each('gap', (zi) => [L.pin, R, zi]),
        ...each('cut', (zi, i) => [L.key.t, L.blade + rootDepth(KEYS.right[i]), zi]),
        ...each('spring', (zi, i) => [L.spring.r + L.spring.wire, (R + driverPinLength(KEYS.right[i]) + S.top) / 2, zi]),
        ...each('driver', (zi, i) => [L.pin, R + driverPinLength(KEYS.right[i]) / 2, zi]),
        ...each('keypin', (zi, i) => [L.pin, R - keyPinLength(KEYS.right[i]) / 2, zi]),
        shear: toModel([R, 0, -14]),
        shear_top: toModel([0, R, -14]),
        shear_face: toModel([0, R + 0.5, 0]),
        plug_face: toModel([0, 4.5, 0]),
        plug_side: toModel([R, -2, -12]),
        plug_back: toModel([0, -4, L.plug.z[0]]),
        shell_side: toModel([S.r, 0, -16]),
        bible: toModel([S.bible, 14, -14]),
        cover: toModel([0, S.top + L.cover.t, -14]),
        clip: toModel([0, -L.clip.outer, L.clip.z - L.clip.t / 2]),
        clip_side: toModel([L.clip.outer, -2, L.clip.z - L.clip.t / 2]),
        tail: toModel([0, 0, L.plug.slot]),
        tailpiece: toModel([0, L.tailpiece.h, -46]),
        tailpiece_end: toModel([0, 0, L.tailpiece.z[0]]),
        centre: toModel([0, 0, -14]),
        above: toModel([0, S.top + 12, -14]),
      },
      unitPerMm: unit(1),
      pins: z.length,
      coils: L.spring.coils,
      apart: LOCK.apart,
      out: LOCK.out,
    },
  };
}
