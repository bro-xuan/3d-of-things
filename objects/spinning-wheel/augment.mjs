// Build step for the spinning wheel (content/spinning-wheel.json → build.augment): opens Poly Haven's "Spinning
// Wheel 01", a Saxony (slanted-bench) flyer wheel with a double drive band, in one mesh. Millimetres in the mesh's
// own frame: x along the wheel's axle (the crank on +x, the orifice on −x), y up, z from the flyer (−z) to the wheel (+z).
//
// The mesh's 85 loose pieces are sorted into parts by where they sit. Its axles aren't square to the frame (the
// wheel's leans about 3°, the flyer's about 5°), so the axes are fitted from the pieces that sit on them, and the
// band's radii round the wheel and the two whorls are read off the band itself: they give the drive ratios. What a
// wheel needs and the mesh doesn't have is generated: the yarn, from the drafted fibre through the orifice and out of
// the flyer's eye, over a hook and onto the bobbin; the fibre being drafted; and the tension screw's thread.
import { surgery, geometry, shapes, Part, materialKit, piecesOf, writeNodes, modelSpace, runChecks, smoothPath } from '../../scripts/kit/index.mjs';

/** The numbers that aren't in the mesh (mm), from the truth sheet. */
export const L = {
  /** The drive band: a cotton cord about 1.6 mm thick (the mesh's strands). */
  bandRadius: 0.8,
  /** The yarn: a singles about 2.4 mm across, at about 4 twists to the inch. */
  yarn: { r: 1.2, pitch: 25.4 / 4 },
  /** Along the flyer's axis from the orifice's mouth (mm): the twisted yarn out to the drafting fibre, the fan, the roving's end. */
  draft: { yarn: -105, fan: -140, end: -215, r: 9.5 },
  /** Where the yarn leaves the hollow orifice through the side of the shaft. */
  eye: 22,
  /** Yarn already spun, wound on the bobbin's bare core (mm of depth at its middle). */
  wound: 6,
  /** The hook the yarn runs over: the one on the near arm nearest this x (about half way along the bobbin). */
  hookX: -64,
  /** The tension screw's thread, in from the knob's inner end. */
  screw: { r: 6.5, pitch: 5, length: 112 },
};

/** Pairs that touch by design: the tension screw in the bench's end and in the mother-of-all's post; the yarn through
 *  the orifice and the eye, laid onto the bobbin, and running out of the drafting fibre. (The mesh's own pieces aren't
 *  checked against each other, so its axles in their bearings and the band in its grooves need no entry.) */
export const CONTACTS = [
  ['tension_screw', 'table'], ['tension_screw', 'mother_of_all'],
  ['yarn', 'flyer'], ['yarn', 'bobbin'], ['leader', 'fibre'],
];

const HUB_GUESS = [-21, 665, 251];

/** Which part a loose piece of the mesh belongs to, by its bounds. */
function partFor({ min, max }) {
  const s = max.map((v, i) => v - min[i]);
  const c = min.map((v, i) => (v + max[i]) / 2);
  const big = Math.max(...s);
  const fromHub = Math.hypot(...c.map((v, i) => v - HUB_GUESS[i]));
  if (c[2] < -340) return 'tension_screw';
  if (s[1] > 500 && s[2] > 700) return 'drive_band';
  // The orifice runs in the front maiden's leather bearing.
  if (c[0] < -155 && c[1] > 640) return s[1] < 16 && s[2] < 16 ? 'flyer' : 'front_maiden';
  if (c[1] > 640 && c[2] < -150 && c[2] > -280) {
    if (s[0] > 50 && s[1] < 15) return 'flyer'; // the shaft's back end
    if (c[0] > 10) return 'back_maiden'; // the maiden and its bearing
    if (c[0] > -2) return 'flyer_whorl';
    if (big < 12 || s[0] > 120) return 'flyer'; // the hooks, and the U of the arms
    return 'bobbin';
  }
  if (c[2] < -195 && c[1] > 400) return 'mother_of_all';
  if (s[1] > 590 && s[2] > 590) return 'wheel'; // the rim
  if (s[2] > 500 && c[1] > 300) return 'table';
  if (fromHub < 5 || (big > 200 && s[0] < 35 && c[1] > 380 && fromHub < 260)) return 'wheel'; // the hub and the twelve spokes
  if (s[0] > 150 && s[1] < 80 && c[1] > 600) return 'crank';
  if (s[1] > 550 && s[0] < 100) return 'footman';
  if (c[1] < 70) return s[2] > 600 ? 'legs' : 'treadle';
  if (c[1] > 280 && c[2] > -60) return 'uprights';
  return 'legs';
}

const add = (a, b) => a.map((v, i) => v + b[i]);
const sub = (a, b) => a.map((v, i) => v - b[i]);
const mul = (a, k) => a.map((v) => v * k);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (v) => mul(v, 1 / Math.hypot(...v));
const round = (v, k = 2) => +v.toFixed(k);
const centre = ({ min, max }) => min.map((v, i) => (v + max[i]) / 2);

/** A frame on an axis. Local points are [a, b, s]: a along `side` (squared to the axis), b along their cross, s along
 *  the axis from `origin` (so the kit's turned shapes, which run along z, run along the axis). */
function axisFrame(origin, axis, side) {
  const d = norm(axis);
  const e1 = norm(sub(side, mul(d, dot(side, d))));
  const e2 = cross(d, e1);
  const dir = ([a, b, s]) => add(add(mul(e1, a), mul(e2, b)), mul(d, s));
  return {
    d, e1, e2,
    at: (p) => add(origin, dir(p)),
    /** Distance along the axis and from it. */
    /** The local coordinates [a, b, s] of a point. */
    local: (p) => {
      const v = sub(p, origin);
      return [dot(v, e1), dot(v, e2), dot(v, d)];
    },
    polar: (p) => {
      const v = sub(p, origin);
      const s = dot(v, d);
      return [s, Math.hypot(...sub(v, mul(d, s)))];
    },
    /** Appends a Geo built in local coordinates. */
    put: (geo, local) => geo.append(local, (p, n) => [add(origin, dir(p)), dir(n)]),
  };
}

/** The mesh's vertices for some islands. */
function vertices(mesh, ids, keep) {
  const seen = new Set();
  const out = [];
  for (let t = 0; t < ids.length; t++) {
    if (!keep(ids[t])) continue;
    for (let k = 0; k < 3; k++) {
      const i = mesh.indices[t * 3 + k];
      if (seen.has(i)) continue;
      seen.add(i);
      out.push([mesh.positions[i * 3], mesh.positions[i * 3 + 1], mesh.positions[i * 3 + 2]]);
    }
  }
  return out;
}

const boxCentre = (pts) => {
  const min = [0, 1, 2].map((d) => Math.min(...pts.map((p) => p[d])));
  const max = [0, 1, 2].map((d) => Math.max(...pts.map((p) => p[d])));
  return centre({ min, max });
};

/** The circle through local points [a, b, s] (least squares, in a and b): its radius, and the points' mean s. */
function fitCircle(points) {
  // x² + y² + Dx + Ey + F = 0, solved by the normal equations.
  const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const B = [0, 0, 0];
  for (const [x, y] of points) {
    const row = [x, y, 1];
    const rhs = -(x * x + y * y);
    for (let i = 0; i < 3; i++) {
      B[i] += row[i] * rhs;
      for (let j = 0; j < 3; j++) A[i][j] += row[i] * row[j];
    }
  }
  const det = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const D0 = det(A);
  const [D, E, Fc] = [0, 1, 2].map((k) => det(A.map((row, i) => row.map((v, j) => (j === k ? B[i] : v)))) / D0);
  const r = Math.sqrt((D * D + E * E) / 4 - Fc);
  return { r, centre: [-D / 2, -E / 2], s: points.reduce((acc, p) => acc + p[2], 0) / points.length, n: points.length };
}

/** The main direction of a cloud of points (power iteration on its covariance). */
function principalAxis(pts) {
  const c = pts.reduce((acc, p) => add(acc, mul(p, 1 / pts.length)), [0, 0, 0]);
  const C = [0, 1, 2].map((i) => [0, 1, 2].map((j) => pts.reduce((acc, p) => acc + (p[i] - c[i]) * (p[j] - c[j]), 0)));
  let v = [0.3, 0.2, 1];
  for (let k = 0; k < 50; k++) v = norm([0, 1, 2].map((i) => dot(C[i], v)));
  return { c, v };
}

/** The yarn from the drafting fibre through the orifice, out of the eye, over a hook and onto the bobbin. It rides with
 *  the flyer, so it turns with it: the twisted length outside the orifice turns about its own line, the twist going in. */
function buildYarn(F, [hs, ha], packageR) {
  const yarn = new Part('yarn', { parent: 'flyer' });
  const leader = new Part('leader', { parent: 'flyer' });
  const { r, pitch } = L.yarn;
  // Outside the orifice: a core with a raised spiral, so the twist shows as it turns.
  const twisted = new geometry.Geo();
  geometry.turned(twisted, [[r * 0.25, L.draft.yarn - 4], [r, L.draft.yarn + 4], [r, -4]], { segments: 14 });
  const from = L.draft.yarn + 4;
  shapes.tube(twisted, shapes.helix('z', [0, 0, 0], r * 0.82, from, -4, (-4 - from) / pitch, 10), r * 0.42, { segments: 6 });
  F.put(leader.geo('wool'), twisted);
  // Through the orifice to the eye, out to the hook, and down to the bobbin, laid on round it a little way.
  const lean = Math.acos(packageR / ha);
  const lay = (phi) => [packageR * Math.cos(phi), packageR * Math.sin(phi), hs];
  const local = [[0, 0, -3], [0, 0, L.eye - 6], [1.5, 0, L.eye], [6.5, 0, L.eye + 4], [ha - 4, 0, hs - 3], [ha, 0, hs], lay(lean), lay(lean + 0.35), lay(lean + 0.7)];
  shapes.tube(yarn.geo('wool'), smoothPath(local, { steps: 8 }).map((p) => F.at(p)), r, { segments: 8 });
  return [yarn, leader];
}

/** The yarn already wound on the bobbin: an even fill between the flanges, a little fuller in the middle. */
function buildPackage(F, core, [s0, s1]) {
  const part = new Part('bobbin', { parent: 'flyer' });
  const local = new geometry.Geo();
  const full = core + L.wound;
  const mid = (s0 + s1) / 2;
  const stations = [[core, s0], [full - 2.5, s0 + 3], [full - 0.8, s0 + 9]];
  for (let k = 1; k < 8; k++) {
    const t = k / 8;
    stations.push([full + 0.6 * Math.sin(t * Math.PI), s0 + 9 + (s1 - s0 - 18) * t]);
  }
  stations.push([full - 0.8, s1 - 9], [full - 2.5, s1 - 3], [core, s1]);
  geometry.turned(local, stations, { segments: 40 });
  F.put(part.geo('wool'), local);
  return { part, full, mid };
}

/** The fibre being drafted: a fan of it narrowing into the yarn, and the roving behind, held in the spinner's hand. */
function buildFibre(F) {
  const fibre = new Part('fibre');
  const local = new geometry.Geo();
  const { yarn, fan, end, r } = L.draft;
  const stations = [];
  for (let s = yarn - 2; s >= end; s -= 2.5) {
    const t = Math.min(1, (yarn - s) / (yarn - fan));
    const base = L.yarn.r * 0.9 + (r - L.yarn.r) * t * t * (3 - 2 * t);
    // A tuft, not a turned rod: the radius wanders a little, and the far end is pulled to a soft point.
    const wander = 1 + 0.06 * Math.sin(s * 0.37) + 0.04 * Math.sin(s * 1.13 + 1);
    const tail = s < end + 22 ? Math.sqrt(Math.max(0.05, (s - end) / 22)) : 1;
    stations.push([base * wander * tail, s]);
  }
  geometry.turned(local, stations.reverse(), { segments: 20 });
  F.put(fibre.geo('roving'), local);
  return fibre;
}

/** The tension screw's thread, from the knob's inner end into the mother-of-all's post. */
function buildScrew(knob) {
  const part = new Part('tension_screw');
  const F = axisFrame(knob.c, knob.v, [1, 0, 0]);
  const local = new geometry.Geo();
  const { r, pitch, length } = L.screw;
  geometry.turned(local, [[r - 0.6, knob.inner - 2], [r - 0.6, knob.inner + length - 1], [r - 2.5, knob.inner + length]], { segments: 24 });
  shapes.tube(local, shapes.helix('z', [0, 0, 0], r - 0.6, knob.inner + 2, knob.inner + length - 4, (length - 6) / pitch, 16), 1.1, { segments: 6 });
  F.put(part.geo('screw'), local);
  return part;
}

export default async function augment(doc, { data, check = true, log = console.log } = {}) {
  const root = doc.getRoot();
  const scene = root.getDefaultScene() ?? root.listScenes()[0];
  const source = root.listNodes().find((n) => n.getMesh());
  const prim = source.getMesh().listPrimitives()[0];
  const skin = prim.getMaterial();
  const mesh = surgery.readMesh(prim);
  const ids = surgery.islands(mesh);
  const bounds = surgery.islandBounds(mesh, ids);

  // The mesh's own pieces, sorted into parts; they keep the model's textured material.
  const pieces = new Map();
  const islandsOf = new Map();
  bounds.forEach((b, i) => {
    if (!b) return;
    const name = partFor(b);
    const list = pieces.get(name) ?? [];
    list.push({ mesh: surgery.pick(mesh, (t) => ids[t] === i), material: skin, key: 'skin', generated: false });
    pieces.set(name, list);
    islandsOf.set(name, [...(islandsOf.get(name) ?? []), i]);
  });
  const pts = (name, keep = () => true) => vertices(mesh, ids, (i) => islandsOf.get(name).includes(i) && keep(i));
  const isle = (name, test) => islandsOf.get(name).filter((i) => test(bounds[i], centre(bounds[i])));
  const size = (i) => bounds[i].max.map((v, k) => v - bounds[i].min[k]);

  // The wheel turns on an axle through its hub; the axle's left end sticks out of its bearing, the crank is on its right.
  const hub = centre(bounds[isle('wheel', (b, c) => Math.hypot(...sub(c, HUB_GUESS)) < 5)[0]]);
  const crankPts = pts('crank');
  const wheelAxis = norm(sub(hub, boxCentre(crankPts.filter((p) => p[0] < -60))));
  const W = axisFrame(hub, wheelAxis, [0, 1, 0]);
  const crankPin = boxCentre(crankPts.filter((p) => p[0] > 60));
  const crankThrow = W.polar(crankPin)[1];

  // The flyer turns on a line through the middle of its orifice and its back bearing.
  const orificePts = pts('flyer', (i) => bounds[i].min[0] < -155 && size(i)[1] < 16);
  const orifice = boxCentre(orificePts);
  // (The bearing is the small block round the shaft's end: thinner than it is deep, unlike the screws beside it.)
  const backBearing = centre(bounds[islandsOf.get('back_maiden').find((i) => size(i)[1] < 15 && size(i)[2] > 8)]);
  const flyerAxis = norm(sub(backBearing, orifice));
  const mouth = add(orifice, mul(flyerAxis, Math.min(...orificePts.map((p) => p[0])) - orifice[0]));
  // a towards the near arm (the hooks on −z), b up, s along the axis from the orifice's mouth.
  const F = axisFrame(mouth, flyerAxis, [0, 0, -1]);

  // The band's radius round the wheel: a circle fitted to the cord where it wraps (inside and outside together, so it
  // runs down the cord's middle), in the plane square to the axis. Round the whorls the mesh's band sits loosely, so
  // there the radius is the floor of the groove it runs in, plus the cord's own radius.
  const band = pts('drive_band');
  const wrap = (frame, keep) => fitCircle(band.map((p) => frame.local(p)).filter(keep));
  const wheelWrap = wrap(W, ([a, b, s]) => Math.abs(s) < 60 && Math.hypot(a, b) > 280 && W.at([a, b, s])[2] > hub[2] + 40);
  const fs = F.polar(centre(bounds[islandsOf.get('flyer_whorl')[0]]))[0];
  // Two wraps, a groove apart, on the far side of the whorls from the wheel: the one nearer the orifice is the bobbin's.
  const near = band.map((p) => F.local(p)).filter(([a, b, s]) => Math.hypot(a, b) < 30 && a > -4 && s > fs - 30 && s < fs + 15);
  const split = (Math.min(...near.map(([, , s]) => s)) + Math.max(...near.map(([, , s]) => s))) / 2;
  const bobbinWrap = fitCircle(near.filter(([, , s]) => s < split));
  const flyerWrap = fitCircle(near.filter(([, , s]) => s >= split));
  const groove = (part, s0) => Math.min(...pts(part).map((p) => F.polar(p)).filter(([s, rr]) => Math.abs(s - s0) < 2 && rr > 10).map(([, rr]) => rr)) + L.bandRadius;
  const [wheelR, bobbinR, flyerR] = [wheelWrap.r, groove('bobbin', bobbinWrap.s), groove('flyer_whorl', flyerWrap.s)];
  const [bobbinS, flyerS] = [bobbinWrap.s, flyerWrap.s];

  // The bobbin's bare core and its flanges; the yarn already on it; the hook the yarn runs over (on the near arm, −z).
  const coreR = Math.max(...pts('bobbin', (i) => size(i)[0] < 90).map((p) => F.polar(p)[1]));
  const ends = pts('bobbin', (i) => size(i)[0] >= 90).map((p) => F.polar(p)).filter(([, rr]) => rr > coreR + 4);
  const middle = (Math.min(...ends.map(([e]) => e)) + Math.max(...ends.map(([e]) => e))) / 2;
  const flanges = [Math.max(...ends.filter(([e]) => e < middle).map(([e]) => e)) + 1.5, Math.min(...ends.filter(([e]) => e > middle).map(([e]) => e)) - 1.5];
  const wound = buildPackage(F, coreR - 0.5, flanges);
  const packageR = wound.full + 1;
  const hooks = isle('flyer', (b) => Math.max(...b.max.map((v, k) => v - b.min[k])) < 12 && b.min[0] > -110).map((i) => centre(bounds[i]));
  const nearHook = hooks.filter((h) => h[2] < mouth[2]).sort((a, b) => Math.abs(a[0] - L.hookX) - Math.abs(b[0] - L.hookX))[0];
  const [hookS, hookR] = F.polar(nearHook);

  // The tension screw's knob: its axis by its own shape, pointing in towards the mother-of-all.
  const knobPts = pts('tension_screw');
  const knob = principalAxis(knobPts);
  if (knob.v[2] < 0) knob.v = mul(knob.v, -1);
  knob.inner = Math.max(...knobPts.map((p) => dot(sub(p, knob.c), knob.v)));
  const knobOuter = Math.min(...knobPts.map((p) => dot(sub(p, knob.c), knob.v)));

  // The treadle hinges on two pins along its inner bar; the footman hangs from the crank to its far corner.
  const small = isle('treadle', (b) => Math.max(...b.max.map((v, k) => v - b.min[k])) < 40).map((i) => centre(bounds[i]));
  const footPin = small.reduce((a, p) => (p[2] > a[2] ? p : a));
  const hinge = small.filter((p) => p !== footPin).sort((a, b) => a[2] - b[2]);
  const treadleAxis = norm(sub(hinge.at(-1), hinge[0]));
  const fromHinge = sub(footPin, hinge[0]);
  const treadleArm = Math.hypot(...sub(fromHinge, mul(treadleAxis, dot(fromHinge, treadleAxis))));
  const footmanLength = Math.hypot(...sub(crankPin, footPin));

  const kit = materialKit(doc);
  const M = {
    wool: kit.material('spinning_wool', '#e9e1cf', 0, 0.92),
    roving: kit.material('spinning_roving', '#efe8d8', 0, 1),
    screw: kit.material('spinning_screw', '#6e4a2c', 0, 0.62),
  };
  const parts = [...buildYarn(F, [hookS - 2, hookR - 3.5], packageR), wound.part, buildFibre(F), buildScrew(knob)];
  piecesOf(parts, M, pieces);
  const nesting = { crank: 'wheel', flyer_whorl: 'flyer', bobbin: 'flyer', yarn: 'flyer', leader: 'flyer' };
  const parentOf = (n) => nesting[n];
  writeNodes(doc, scene, pieces, { parts, parentOf });
  source.dispose();

  const { toModel: m, space, mmPerUnit, realSize, unit } = modelSpace(scene);
  runChecks({ label: 'spinning wheel', pieces, contacts: CONTACTS, data, parentOf, mmPerUnit, check, log });
  const ratio = { flyer: wheelR / flyerR, bobbin: wheelR / bobbinR };
  log(`  spinning wheel: ${pieces.size} parts, ${realSize.join(' × ')} mm; band on the wheel ${round(wheelR * 2, 1)} mm across, on the whorls ${round(flyerR * 2, 1)} and ${round(bobbinR * 2, 1)}; ratios ${round(ratio.flyer)} and ${round(ratio.bobbin)} : 1; crank ${round(crankThrow, 1)} mm, footman ${round(footmanLength)} mm, treadle arm ${round(treadleArm)} mm`);

  // A point on the band's top run, a share t of the way from the wheel to the flyer's whorl: on the two circles' outer
  // tangent, seen from the side (the mesh's straight runs have no points along them).
  const wheelC = W.at([wheelWrap.centre[0], wheelWrap.centre[1], 0]);
  const whorlC = F.at([0, 0, flyerS]);
  const bandTop = (t) => {
    const [dz, dy] = [wheelC[2] - whorlC[2], wheelC[1] - whorlC[1]];
    const dist = Math.hypot(dz, dy);
    const u = [dz / dist, dy / dist];
    const c = (wheelR - flyerR) / dist;
    const n = [c * u[0] - Math.sqrt(1 - c * c) * u[1], c * u[1] + Math.sqrt(1 - c * c) * u[0]];
    const up = n[1] > 0 ? n : [c * u[0] + Math.sqrt(1 - c * c) * u[1], c * u[1] - Math.sqrt(1 - c * c) * u[0]];
    const onWheel = [wheelC[0], wheelC[1] + wheelR * up[1], wheelC[2] + wheelR * up[0]];
    const onWhorl = [whorlC[0], whorlC[1] + flyerR * up[1], whorlC[2] + flyerR * up[0]];
    return add(onWheel, mul(sub(onWhorl, onWheel), t));
  };
  const tableBox = boxCentre(pts('table'));
  const moa = boxCentre(pts('mother_of_all', (i) => size(i)[0] > 200));
  const top = (list) => list.reduce((a, p) => (p[1] > a[1] ? p : a));
  const board = isle('treadle', (b) => b.max[0] - b.min[0] > 250)[0];
  const lay = Math.acos(packageR / hookR);

  return {
    space,
    pivots: { wheel: m(hub), flyer: m(mouth), treadle: m(hinge[0]) },
    axes: { wheel: wheelAxis.map((v) => round(v, 4)), flyer: flyerAxis.map((v) => round(v, 4)), treadle: treadleAxis.map((v) => round(v, 4)), screw: knob.v.map((v) => round(v, 4)) },
    anchors: {
      treadle_board: m([centre(bounds[board])[0] - 60, bounds[board].max[1], centre(bounds[board])[2]]),
      treadle_pin: m(footPin),
      footman_mid: m(mul(add(crankPin, footPin), 0.5)),
      footman_low: m(add(footPin, mul(sub(crankPin, footPin), 0.25))),
      crank_pin: m(crankPin),
      hub: m(hub),
      rim_top: m(W.at([0, wheelR, 0])),
      rim_back: m(W.at([0, 0, 0]).map((v, i) => v + [0, 0, wheelR][i])),
      rim_low: m(W.at([0, -wheelR * 0.7, 0]).map((v, i) => v + [0, 0, wheelR * 0.7][i])),
      band_top_wheel: m(bandTop(0.12)),
      band_top_mid: m(bandTop(0.5)),
      band_top_flyer: m(bandTop(0.88)),
      flyer_whorl: m(F.at([0, flyerR + 2, flyerS])),
      bobbin_whorl: m(F.at([0, bobbinR + 2, bobbinS])),
      orifice: m(F.at([0, 0, -2])),
      eye: m(F.at([6, 0, L.eye + 3])),
      hook: m(nearHook),
      flyer_arm: m(F.at([hookR + 4, 0, hookS - 30])),
      flyer_tip: m(F.at([-(hookR + 2), 0, flanges[1] - 6])),
      bobbin_rim: m(F.at([0, Math.max(...ends.filter(([e]) => e < middle).map(([, rr]) => rr)), flanges[0] - 4])),
      flyer_yoke: m(F.at([0, 10, 14])),
      bobbin: m(F.at([0, packageR, hookS])),
      bobbin_lay: m(F.at([packageR * Math.cos(lay), packageR * Math.sin(lay), hookS - 2])),
      yarn_out: m(F.at([0, 0, L.draft.yarn * 0.55])),
      drafting: m(F.at([0, 0, L.draft.fan + 8])),
      fibre: m(F.at([0, 0, (L.draft.fan + L.draft.end) / 2])),
      mother_of_all: m([moa[0] - 40, moa[1] + 25, moa[2]]),
      maiden_front: m(top(pts('front_maiden', (i) => size(i)[1] > 200))),
      maiden_back: m(top(pts('back_maiden', (i) => size(i)[1] > 200))),
      tension_knob: m(add(knob.c, mul(knob.v, knobOuter))),
      tension_screw: m(add(knob.c, mul(knob.v, knob.inner + L.screw.length / 2))),
      table: m([tableBox[0], tableBox[1] + 40, tableBox[2]]),
    },
    // The four-bar the treadle makes: the crank's pin and the footman's foot on the treadle, with the crank at rest.
    linkage: { pin: m(crankPin), foot: m(footPin) },
    numbers: {
      wheelDiameter: round(wheelR * 2, 1),
      rimDiameter: round(Math.max(...pts('wheel', (i) => size(i)[1] > 590).map((p) => W.polar(p)[1])) * 2, 0),
      flyerWhorl: round(flyerR * 2, 1),
      bobbinWhorl: round(bobbinR * 2, 1),
      flyerRatio: round(ratio.flyer, 3),
      bobbinRatio: round(ratio.bobbin, 3),
      packageDiameter: round(wound.full * 2, 1),
      coreDiameter: round(coreR * 2, 1),
      crankThrow: round(crankThrow, 1),
      footmanLength: round(footmanLength, 0),
      treadleArm: round(treadleArm, 0),
      wheelTilt: round((Math.acos(Math.abs(wheelAxis[0])) * 180) / Math.PI, 1),
      flyerTilt: round((Math.acos(Math.abs(flyerAxis[0])) * 180) / Math.PI, 1),
    },
    unitPerMm: unit(1),
  };
}
