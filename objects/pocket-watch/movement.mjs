// A pocket watch movement, generated: a Swiss lever escapement beating 21,600 times
// an hour, direct centre seconds, keyless winding. Tooth counts are real and the
// wheels are laid out so they mesh, so the viewer can run the whole train at the
// right ratios.
//
// Movement frame: millimetres, origin on the hands' axis, x toward 3 o'clock, y toward
// 12 o'clock (the crown), z toward the dial. The dial's back is z = 0. "h" is height
// above the main plate's back face, toward the case back: z = PLATE.back - h.
import { Geo, alongAxis, circle, contours, cw, cylinder, extrude, flat, lathe, place, ribbon, sd, spiral, turned } from '../../scripts/kit/geometry.mjs';
import { escapeWheel, gear, polar, wheelHoles } from '../../scripts/kit/gears.mjs';

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

export const PLATE = { radius: 28.2, front: -0.9, back: -2.4 };
export const zh = (h) => PLATE.back - h;

/**
 * Heights above the plate's back face (mm), lowest first. The barrel sits sunk in the
 * plate; the train climbs from the centre wheel to the fourth; the escapement rides on
 * top of the train so it can be seen, under the balance; the balance cock is kept low
 * because the case back is domed.
 */
export const H = {
  plateFloor: -1.2, // depth of the sinks in the plate's back
  barrel: [-1.2, 0.6],
  barrelTeeth: [0.25, 0.6],
  barrelBottom: [-1.2, -0.92],
  mainspring: [-0.85, 0.42],
  centrePinion: [0.2, 0.66],
  centre: [0.75, 1.0],
  thirdPinion: [0.72, 1.05],
  third: [1.12, 1.37],
  fourthPinion: [1.1, 1.42],
  fourth: [1.5, 1.75],
  escapePinion: [1.47, 1.78],
  escape: [1.88, 2.13],
  lever: [1.9, 2.1],
  stones: [1.82, 2.2],
  safetyRoller: [1.92, 2.1],
  rollerTable: [2.18, 2.3],
  palletBridge: [2.35, 2.8],
  trainBridge: [2.25, 3.25],
  rim: [2.9, 3.42],
  arms: [3.12, 3.42],
  collet: [3.48, 3.78],
  hairspring: [3.52, 3.72],
  cock: [3.9, 4.62],
  barrelBridge: [0.75, 1.95],
  winding: [1.37, 1.67], // ratchet and crown wheels, sunk into the barrel bridge
  pivot: 0.3, // how far arbors reach into their jewels
};

const add2 = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub2 = (a, b) => [a[0] - b[0], a[1] - b[1]];
const mul2 = (a, s) => [a[0] * s, a[1] * s];
const len2 = (a) => Math.hypot(a[0], a[1]);
const unit2 = (a) => mul2(a, 1 / len2(a));
const angleOf = (a) => Math.atan2(a[1], a[0]);
/** Frame z range [low, high] for a height range. */
const zr = ([h0, h1]) => [zh(h1), zh(h0)];

// ----------------------------------------------------------------------- layout

/** Every position, tooth count and module, derived from a few design choices. */
export function layout({ stemZ }) {
  const centre = [0, 0];
  const barrel = [-3, 11];
  const third = polar(7.6, 200 * DEG);
  const escape = [0, -7.35];
  // Straight-line lever: escape wheel, pallet arbor and balance on one line.
  const leverDir = polar(1, -40 * DEG);
  const escapeTip = 3.6;
  const palletDistance = escapeTip / Math.cos(30 * DEG); // pallets lock at the tangents, 60° (2½ teeth) apart
  const leverLength = 4.6;
  const rollerRadius = 1.0;
  const pallet = add2(escape, mul2(leverDir, palletDistance));
  const balance = add2(pallet, mul2(leverDir, leverLength + rollerRadius));

  // Modules follow from the centre distances (each mesh has its own, as in real watches).
  const train = {
    barrel: { teeth: 80, module: len2(barrel) / 45 }, // drives the centre pinion (10)
    centrePinion: { teeth: 10, module: len2(barrel) / 45 },
    centre: { teeth: 80, module: len2(third) / 45 }, // drives the third pinion (10)
    thirdPinion: { teeth: 10, module: len2(third) / 45 },
    third: { teeth: 75, module: len2(third) / 42.5 }, // drives the fourth pinion (10)
    fourthPinion: { teeth: 10, module: len2(third) / 42.5 },
    fourth: { teeth: 84, module: len2(escape) / 45.5 }, // drives the escape pinion (7)
    escapePinion: { teeth: 7, module: len2(escape) / 45.5 },
  };

  // Motion works under the dial: cannon pinion 12 → minute wheel 36, minute pinion 10 → hour wheel 40.
  const minuteWheel = polar(4.4, 160 * DEG);
  const motion = {
    cannon: { teeth: 12, module: 4.4 / 24 },
    minute: { teeth: 36, module: 4.4 / 24 },
    minutePinion: { teeth: 10, module: 4.4 / 25 },
    hour: { teeth: 40, module: 4.4 / 25 },
  };

  // Keyless works: the crown wheel sits on the stem's line with its pitch circle over the
  // winding pinion, and drives the ratchet wheel on the barrel arbor. Equal wheels keep the
  // ratchet clear of the fourth wheel's rim, which passes beside it.
  const ratchetTeeth = 36;
  const crownTeeth = 36;
  const windingPinionTeeth = 13;
  const pinionY = 22.4;
  let lo = 0.1;
  let hi = 0.4;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    const gap = ((ratchetTeeth + crownTeeth) / 2) * m - Math.hypot(barrel[0], pinionY - (crownTeeth / 2) * m - barrel[1]);
    if (gap > 0) hi = m;
    else lo = m;
  }
  const windingModule = (lo + hi) / 2;
  const crownWheel = [0, pinionY - (crownTeeth / 2) * windingModule];

  const stemH = PLATE.back - stemZ;
  return {
    centre, barrel, third, escape, pallet, balance, leverDir, palletDistance, leverLength, rollerRadius, escapeTip,
    train, minuteWheel, motion, crownWheel, windingModule, ratchetTeeth, crownTeeth, windingPinionTeeth, pinionY, stemZ, stemH,
    // Bridge feet and the click.
    feet: {
      trainLeft: [-19.0, -6.0],
      trainLower: [-4.5, -17.5],
      barrelLeft: [-14.5, 16.0],
      barrelRight: [9.0, 19.5],
      pallet: add2(pallet, mul2(polar(1, -130 * DEG), 3.0)),
      // Toward the middle, where the domed back leaves room for the cock's height.
      cock: add2(balance, polar(11.3, 75 * DEG)),
    },
    clickPivot: add2(barrel, polar(6.0, 158 * DEG)),
  };
}

// ------------------------------------------------------------------------ parts

export class Part {
  constructor(name, origin = [0, 0, 0]) {
    this.name = name;
    this.origin = origin;
    this.geos = new Map();
    this.solids = [];
  }

  geo(material) {
    if (!this.geos.has(material)) this.geos.set(material, new Geo());
    return this.geos.get(material);
  }

  /** A footprint for the clash check: an SDF in movement x/y, over frame z0..z1. */
  solid(label, sdf, bounds, z0, z1) {
    this.solids.push({ label, sdf, bounds, z: [Math.min(z0, z1), Math.max(z0, z1)] });
  }
}

/** Local frame of a part whose origin is at (x, y) on the movement. */
const at = (x, y) => [x, y, 0];

/** Wheel phase so its teeth fall between the teeth of `a` where the two meet. */
function meshPhase(a, b) {
  const beta = angleOf(sub2(b.center, a.center));
  const pitchA = TAU / a.teeth;
  const k = Math.round((beta - a.phase) / pitchA);
  const thetaA = a.phase + k * pitchA;
  const rA = (a.module * a.teeth) / 2;
  const rB = (b.module * b.teeth) / 2;
  const u = (thetaA - beta) * rA;
  return beta + Math.PI - u / rB + Math.PI / b.teeth;
}

function addGear(part, material, { teeth, module, kind = 'wheel', phase = 0 }, [z0, z1], { spokes = 0, rim, hub, width, bore = 0, curve = 0, center = [0, 0] } = {}) {
  const g = gear({ teeth, module, kind, phase });
  const holes = spokes ? wheelHoles({ rim: rim ?? g.rootRadius - Math.max(0.35, g.rootRadius * 0.1), hub: hub ?? Math.max(0.6, g.pitchRadius * 0.16), spokes, width: width ?? Math.max(0.3, g.pitchRadius * 0.085), curve, bore }) : bore ? [cw(circle(bore))] : [];
  const geo = part.geo(material);
  extrude(geo, geo, { outer: g.outline, holes }, z0, z1, { crease: 30 });
  const tip = g.tipRadius;
  const disc = sd.circle(center, kind === 'pinion' ? g.rootRadius : tip);
  part.solid(`${kind} ${teeth}`, bore ? sd.subtract(disc, sd.circle(center, bore)) : disc, box(center, tip), z0, z1);
  return g;
}

const box = ([x, y], r) => ({ min: [x - r, y - r], max: [x + r, y + r] });

/** An arbor between heights h0 and h1: a thin shaft with pivots at both ends. */
function arbor(geo, h0, h1, { r = 0.22, pivot = 0.1 } = {}) {
  const tip = 0.25;
  turned(geo, [[pivot, zh(h1)], [pivot, zh(h1 - tip)], [r, zh(h1 - tip - 0.12)], [r, zh(h0 + tip + 0.12)], [pivot, zh(h0 + tip)], [pivot, zh(h0)]], { segments: 20 });
}

/** A slotted screw head sitting on a surface at (x, y, z), its head rising along `facing`. */
function screw(geo, [x, y], z, { r = 0.7, height = 0.38, facing = -1, slot = 0 } = {}) {
  const head = new Geo();
  const slotDepth = height * 0.45;
  const slotHalf = r * 0.13;
  extrude(head, head, { outer: circle(r, 0, 0, 36) }, 0, height - slotDepth, { bottom: false });
  const a = Math.acos(slotHalf / r);
  const half = (sign) => {
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const t = -a + (2 * a * i) / 12;
      pts.push([sign * r * Math.cos(t), r * Math.sin(t) * sign]);
    }
    return { outer: pts };
  };
  extrude(head, head, [half(1), half(-1)], height - slotDepth, height, { bottom: false, chamfer: Math.min(0.08, r * 0.12), crease: 50 });
  geo.append(head, alongAxis([0, 0, facing], [x, y, z], slot));
}

/** A jewel: a domed ruby ring with a pivot hole, its face at (x, y, z) looking along `facing`. */
function jewel(geo, [x, y], z, { r = 0.5, hole = 0.1, depth = 0.45, facing = -1 } = {}) {
  const j = new Geo();
  lathe(j, [[hole, -depth], [r, -depth], [r, -0.03], [r * 0.82, 0.05], [r * 0.5, 0.075], [hole + 0.05, 0.05], [hole, 0], [hole, -depth]], { segments: 32, crease: 60 });
  geo.append(j, alongAxis([0, 0, facing], [x, y, z]));
}

/** A gold chaton (setting ring) round a jewel. */
function chaton(geo, [x, y], z, { r = 0.5, width = 0.32, height = 0.12, facing = -1 } = {}) {
  const c = new Geo();
  lathe(c, [[r, -0.05], [r + width, -0.05], [r + width, height * 0.5], [r + width * 0.7, height], [r, height], [r, -0.05]], { segments: 36, crease: 50 });
  geo.append(c, alongAxis([0, 0, facing], [x, y, z]));
}

/** A pillar (a bridge's foot) from the plate up to height h. */
function pillar(part, center, r, h) {
  const shapes = contours(sd.circle(center, r), boundsOf([[...center, r + 0.2]]), 0.04);
  extrude(part.geo('satin'), part.geo('satin'), shapes, zh(h), zh(0), { top: false, bottom: false });
  part.solid('foot', sd.circle(center, r), boundsOf([[...center, r]]), zh(h), zh(0));
}

/**
 * A plate or bridge cut from an SDF and extruded between heights h0 and h1 (toward the
 * case back). The back face takes `finish`, the walls a satin finish and the edge a
 * polished chamfer. Optional `sink` (an SDF) is cut down to hSink from the back face.
 */
function slab(part, { sdf, bounds, h: [h0, h1], finish, chamfer = 0.12, sink, hSink, cell = 0.04, spacing = 0.13 }) {
  const zBack = zh(h1);
  const zFront = zh(h0);
  const local = (f) => (p) => f(add2(p, part.origin));
  const walls = part.geo('satin');
  const anglage = part.geo('nickel');
  if (!sink) {
    part.solid('slab', sdf, bounds, zFront, zBack);
    const shapes = contours(local(sdf), bounds, cell, spacing);
    extrude(part.geo(finish), walls, shapes, zBack, zFront, { top: false, chamferBottom: chamfer, bevels: anglage });
    flat(part.geo('satin'), shapes, zFront, 1);
    return shapes;
  }
  part.solid('slab (below sink)', sdf, bounds, zFront, zh(hSink));
  part.solid('slab (beside sink)', sd.subtract(sdf, sink), bounds, zh(hSink), zBack);
  const zFloor = zh(hSink);
  const full = contours(local(sdf), bounds, cell, spacing);
  const upper = contours(local(sd.subtract(sdf, sink)), bounds, cell, spacing);
  const floor = contours(local(sd.intersect(sdf, sink)), bounds, cell, spacing);
  extrude(part.geo(finish), walls, upper, zBack, zFloor, { top: false, chamferBottom: chamfer, bevels: anglage });
  extrude(part.geo(finish), walls, full, zFloor, zFront, { top: false, bottom: false });
  flat(part.geo('satin'), full, zFront, 1);
  flat(part.geo(finish), floor, zFloor, -1);
  return full;
}

/** Bounds of a set of circles [[x, y, r]]. */
function boundsOf(circles, pad = 0.5) {
  const xs = circles.flatMap(([x, , r]) => [x - r, x + r]);
  const ys = circles.flatMap(([, y, r]) => [y - r, y + r]);
  return { min: [Math.min(...xs) - pad, Math.min(...ys) - pad], max: [Math.max(...xs) + pad, Math.max(...ys) + pad] };
}

/** Shift bounds into a part's local frame. */
const localBounds = (b, o) => ({ min: [b.min[0] - o[0], b.min[1] - o[1]], max: [b.max[0] - o[0], b.max[1] - o[1]] });

// ----------------------------------------------------------------------- build

export function buildMovement(L) {
  const parts = [];
  const T = L.train;
  const M = L.motion;

  // Phases, chained along each train so every pair meshes at rest.
  const ph = {};
  ph.barrel = 0;
  ph.centrePinion = meshPhase({ center: L.barrel, phase: ph.barrel, ...T.barrel }, { center: L.centre, ...T.centrePinion });
  ph.centre = 0.1;
  ph.thirdPinion = meshPhase({ center: L.centre, phase: ph.centre, ...T.centre }, { center: L.third, ...T.thirdPinion });
  ph.third = 0;
  ph.fourthPinion = meshPhase({ center: L.third, phase: ph.third, ...T.third }, { center: L.centre, ...T.fourthPinion });
  ph.fourth = 0.05;
  ph.escapePinion = meshPhase({ center: L.centre, phase: ph.fourth, ...T.fourth }, { center: L.escape, ...T.escapePinion });
  ph.cannon = 0;
  ph.minute = meshPhase({ center: L.centre, phase: ph.cannon, ...M.cannon }, { center: L.minuteWheel, ...M.minute });
  ph.minutePinion = 0;
  ph.hour = meshPhase({ center: L.minuteWheel, phase: ph.minutePinion, ...M.minutePinion }, { center: L.centre, ...M.hour });
  const ratchet = { teeth: L.ratchetTeeth, module: L.windingModule };
  const crown = { teeth: L.crownTeeth, module: L.windingModule };
  ph.ratchet = 0;
  ph.crown = meshPhase({ center: L.barrel, phase: ph.ratchet, ...ratchet }, { center: L.crownWheel, ...crown });

  // The click and its spring, in movement coordinates: they sit in the barrel bridge's sink beside the ratchet.
  const ratchetTip = gear({ ...ratchet }).tipRadius;
  const clickNose = add2(L.barrel, polar(ratchetTip - 0.25, angleOf(sub2(L.clickPivot, L.barrel)) + 24 * DEG));
  const clickTail = add2(L.clickPivot, mul2(unit2(sub2(L.clickPivot, clickNose)), 1.3));
  const click = sd.smooth(0.25, sd.capsule(clickTail, L.clickPivot, 0.38, 0.62), sd.capsule(L.clickPivot, clickNose, 0.62, 0.16));
  const clickSpring = [];
  for (let i = 0; i <= 24; i++) {
    const a = angleOf(sub2(L.clickPivot, L.barrel)) - 30 * DEG + (i / 24) * 26 * DEG;
    clickSpring.push(add2(L.barrel, polar(len2(sub2(L.clickPivot, L.barrel)) + 1.3 + Math.sin((i / 24) * Math.PI) * 0.2, a)));
  }
  const clickRoom = sd.union(
    (q) => click(q) - 0.22,
    ...clickSpring.slice(1).map((q, i) => sd.capsule(clickSpring[i], q, 0.3)),
  );

  // At rest (just after an even beat) the lever leans so the entry pallet locks a tooth.
  const entryAngle = angleOf(L.leverDir) - 30 * DEG;
  const lockLag = 3 * DEG;
  ph.escape = entryAngle - lockLag;

  // ------------------------------------------------------------- main plate
  {
    const p = new Part('main_plate');
    const through = [
      sd.circle(L.centre, 0.55),
      sd.circle(L.third, 0.5),
      sd.circle(L.escape, 0.45),
      sd.circle(L.pallet, 0.45),
      sd.circle(L.balance, 0.55),
      sd.circle(L.barrel, 0.55),
      sd.box([0, L.pinionY], [2.1, 0.95], 0, 0.2),
    ];
    const sinks = sd.union(sd.circle(L.barrel, 10.75), sd.box([0, 25.6], [0.8, 3.4], 0, 0.3));
    const disc = sd.circle([0, 0], PLATE.radius);
    const bounds = { min: [-PLATE.radius - 0.5, -PLATE.radius - 0.5], max: [PLATE.radius + 0.5, PLATE.radius + 0.5] };
    const upper = contours(sd.subtract(disc, sinks, ...through), bounds, 0.04, 0.22);
    const lower = contours(sd.subtract(disc, ...through), bounds, 0.04, 0.22);
    const floor = contours(sd.subtract(sd.intersect(disc, sinks), ...through), bounds, 0.04, 0.22);
    extrude(p.geo('plate'), p.geo('satin'), upper, zh(0), zh(H.plateFloor), { top: false, chamferBottom: 0.15, bevels: p.geo('nickel') });
    extrude(p.geo('satin'), p.geo('satin'), lower, zh(H.plateFloor), PLATE.front, { bottom: false, chamfer: 0.1, bevels: p.geo('nickel') });
    flat(p.geo('plate'), floor, zh(H.plateFloor), -1);
    // Jewels for the lower pivots, flush with the back face.
    for (const c of [L.third, L.escape, L.pallet, L.balance]) jewel(p.geo('ruby'), c, zh(0), { r: 0.5, depth: 1.45 });
    // Banking pins either side of the lever.
    const across = [-L.leverDir[1], L.leverDir[0]];
    for (const s of [-1, 1]) {
      const c = add2(add2(L.pallet, mul2(L.leverDir, 3.0)), mul2(across, s * 0.74));
      const g = new Geo();
      cylinder(g, 0.13, 0, H.lever[1] + 0.05, { segments: 14 });
      p.geo('steel').append(g, alongAxis([0, 0, -1], [c[0], c[1], zh(0)]));
    }
    // Dial-side stud for the minute wheel.
    const stud = new Geo();
    cylinder(stud, 0.32, 0, 0.7, { segments: 18 });
    p.geo('steel').append(stud, alongAxis([0, 0, 1], [L.minuteWheel[0], L.minuteWheel[1], PLATE.front]));
    p.solid('plate (back layer)', sd.subtract(disc, sinks, ...through), bounds, zh(0), zh(H.plateFloor));
    p.solid('plate (front layer)', sd.subtract(disc, ...through), bounds, zh(H.plateFloor), PLATE.front);
    parts.push(p);
  }

  // --------------------------------------------------------- winding pinion
  {
    // It turns on the stem but belongs to the movement: the stem slides out through it.
    const p = new Part('winding_pinion');
    const y0 = L.pinionY - 0.8;
    const wp = gear({ teeth: L.windingPinionTeeth, module: L.windingModule, kind: 'wheel' });
    const pin = new Geo();
    extrude(pin, pin, { outer: wp.outline, holes: [cw(circle(0.47))] }, y0, y0 + 1.6, { crease: 30 });
    p.geo('steel').append(pin, alongAxis([0, 1, 0], [0, 0, L.stemZ]));
    parts.push(p);
  }

  // ----------------------------------------------------------------- barrel
  {
    const p = new Part('barrel', at(...L.barrel));
    const g = gear({ ...T.barrel, phase: ph.barrel });
    const wall = g.rootRadius - 0.08;
    const inner = wall - 0.32;
    const [b0, b1] = H.barrel;
    // Drum: a cup open toward the case back, teeth round its rim.
    lathe(p.geo('gilt'), [[0.62, zh(b0)], [0.62, zh(H.barrelBottom[1])], [inner, zh(H.barrelBottom[1])], [inner, zh(H.barrelTeeth[0])], [wall, zh(H.barrelTeeth[0])], [wall, zh(b0)], [0.62, zh(b0)]], { segments: 96 });
    extrude(p.geo('gilt'), p.geo('gilt'), { outer: g.outline, holes: [cw(circle(inner, 0, 0, 96))] }, ...zr(H.barrelTeeth), { crease: 30 });
    // Arbor, with its hook core and the square the ratchet wheel sits on.
    turned(p.geo('steel'), [[0.5, zh(-1.5)], [0.5, zh(-0.95)], [1.15, zh(-0.85)], [1.15, zh(0.5)], [0.95, zh(0.62)], [0.95, zh(H.winding[1] - 0.01)]], { segments: 40 });
    p.solid('barrel wall', sd.subtract(sd.circle(L.barrel, g.tipRadius), sd.circle(L.barrel, inner)), box(L.barrel, g.tipRadius), zh(b1), zh(b0));
    p.solid('barrel bottom', sd.circle(L.barrel, wall), box(L.barrel, wall), ...zr(H.barrelBottom));
    p.solid('arbor pivot', sd.circle(L.barrel, 0.5), box(L.barrel, 0.5), zh(-0.92), zh(-1.5));
    p.solid('arbor core', sd.circle(L.barrel, 1.15), box(L.barrel, 1.2), zh(0.5), zh(-0.85));
    p.solid('arbor square', sd.circle(L.barrel, 0.95), box(L.barrel, 1), zh(H.winding[1] - 0.01), zh(0.62));
    p.meta = { gear: g, wall, inner };
    parts.push(p);
  }

  // ------------------------------------------------------------- mainspring
  {
    const barrel = parts.find((q) => q.name === 'barrel').meta;
    const p = new Part('mainspring', at(...L.barrel));
    const path = spiral(1.2, barrel.inner - 0.12, 10.5, 0.4, 0.34).map(([x, y]) => [x, -y]);
    ribbon(p.geo('spring'), path, 0.17, ...zr(H.mainspring));
    p.solid('mainspring', sd.subtract(sd.circle(L.barrel, barrel.inner - 0.02), sd.circle(L.barrel, 1.15)), box(L.barrel, barrel.inner), ...zr(H.mainspring));
    parts.push(p);
  }

  // ----------------------------------------------------------- centre wheel
  {
    const p = new Part('centre_wheel', at(...L.centre));
    addGear(p, 'gilt', { ...T.centre, phase: ph.centre }, zr(H.centre), { spokes: 5, bore: 0.25, center: L.centre });
    addGear(p, 'steel', { ...T.centrePinion, kind: 'pinion', phase: ph.centrePinion }, zr(H.centrePinion), { bore: 0.25, center: L.centre });
    // Hollow arbor: from above the wheel, through the plate, out under the dial for the cannon pinion.
    turned(p.geo('steel'), [[0.42, -0.25], [0.42, zh(H.centrePinion[0])], [0.55, zh(H.centre[0])], [0.55, zh(H.centre[1])], [0.42, zh(H.centre[1] + 0.05)]], { bore: 0.25 });
    parts.push(p);
  }

  // ------------------------------------------------------------ third wheel
  {
    const p = new Part('third_wheel', at(...L.third));
    addGear(p, 'gilt', { ...T.third, phase: ph.third }, zr(H.third), { spokes: 5, center: L.third });
    addGear(p, 'steel', { ...T.thirdPinion, kind: 'pinion', phase: ph.thirdPinion }, zr(H.thirdPinion), { center: L.third });
    arbor(p.geo('steel'), -H.pivot, H.trainBridge[0] + H.pivot);
    p.solid('third arbor', sd.circle(L.third, 0.25), box(L.third, 0.3), zh(H.trainBridge[0] + H.pivot), zh(-H.pivot));
    parts.push(p);
  }

  // ----------------------------------------------------------- fourth wheel
  {
    const p = new Part('fourth_wheel', at(...L.centre));
    addGear(p, 'gilt', { ...T.fourth, phase: ph.fourth }, zr(H.fourth), { spokes: 5, center: L.centre });
    addGear(p, 'steel', { ...T.fourthPinion, kind: 'pinion', phase: ph.fourthPinion }, zr(H.fourthPinion), { center: L.centre });
    // Its long arbor runs down through the hollow centre wheel and out to the seconds hand.
    const top = H.trainBridge[0] + H.pivot;
    turned(p.geo('steel'), [[0.1, zh(top)], [0.1, zh(top - 0.25)], [0.2, zh(top - 0.33)], [0.2, zh(H.fourthPinion[0])], [0.15, zh(H.fourthPinion[0] - 0.1)], [0.15, 0.62], [0.06, 0.66]], { segments: 18 });
    parts.push(p);
  }

  // ----------------------------------------------------------- escape wheel
  {
    const p = new Part('escape_wheel', at(...L.escape));
    const e = escapeWheel({ tip: L.escapeTip, phase: ph.escape });
    const holes = wheelHoles({ rim: e.rootRadius - 0.38, hub: 0.55, spokes: 4, width: 0.32, phase: ph.escape + 0.2 });
    extrude(p.geo('steel'), p.geo('steel'), { outer: e.outline, holes }, ...zr(H.escape), { crease: 30 });
    p.solid('escape wheel', sd.circle(L.escape, e.tipRadius), box(L.escape, e.tipRadius), ...zr(H.escape));
    addGear(p, 'steel', { ...T.escapePinion, kind: 'pinion', phase: ph.escapePinion }, zr(H.escapePinion), { center: L.escape });
    arbor(p.geo('steel'), -H.pivot, H.trainBridge[0] + H.pivot, { r: 0.18, pivot: 0.08 });
    p.solid('escape arbor', sd.circle(L.escape, 0.2), box(L.escape, 0.25), zh(H.trainBridge[0] + H.pivot), zh(-H.pivot));
    parts.push(p);
  }

  // ------------------------------------------------------------- pallet fork
  {
    const p = new Part('pallet_fork', at(...L.pallet));
    const d = L.leverDir;
    const across = [-d[1], d[0]];
    const toBalance = L.leverLength;
    // Pallet stones sit where the tangents from the pallet arbor touch the escape wheel.
    const entry = add2(L.escape, polar(L.escapeTip, angleOf(d) - 30 * DEG));
    const exit = add2(L.escape, polar(L.escapeTip, angleOf(d) + 30 * DEG));
    const forkEnd = add2(L.pallet, mul2(d, toBalance + 0.28));
    const slot = add2(L.pallet, mul2(d, toBalance));
    const stoneBase = (s) => add2(L.pallet, mul2(unit2(sub2(s, L.pallet)), len2(sub2(s, L.pallet)) - 0.95));
    const body = sd.smoothSubtract(
      0.08,
      sd.smooth(
        0.35,
        sd.capsule(L.pallet, add2(L.pallet, mul2(d, toBalance - 0.5)), 0.42, 0.24),
        sd.capsule(L.pallet, stoneBase(entry), 0.42, 0.34),
        sd.capsule(L.pallet, stoneBase(exit), 0.42, 0.34),
        sd.capsule(add2(slot, mul2(across, 0.38)), add2(forkEnd, mul2(across, 0.42)), 0.17),
        sd.capsule(add2(slot, mul2(across, -0.38)), add2(forkEnd, mul2(across, -0.42)), 0.17),
        sd.capsule(add2(L.pallet, mul2(d, toBalance - 0.6)), add2(slot, mul2(across, 0.38)), 0.2),
        sd.capsule(add2(L.pallet, mul2(d, toBalance - 0.6)), add2(slot, mul2(across, -0.38)), 0.2),
      ),
      sd.box(add2(slot, mul2(d, 0.35)), [0.55, 0.22], angleOf(d), 0.05),
      sd.circle(L.pallet, 0.12),
    );
    const bounds = localBounds(boundsOf([[...L.pallet, toBalance + 1], [...entry, 1], [...exit, 1]]), p.origin);
    const shapes = contours((q) => body(add2(q, p.origin)), bounds, 0.015, 0.03);
    extrude(p.geo('steel'), p.geo('steel'), shapes, ...zr(H.lever), { crease: 40 });
    // Ruby stones, along the lines from the arbor.
    for (const s of [entry, exit]) {
      const dir = unit2(sub2(s, L.pallet));
      const centre = add2(L.pallet, mul2(dir, len2(sub2(s, L.pallet)) - 0.4));
      const local = sub2(centre, L.pallet);
      const stone = sd.box(local, [0.62, 0.155], angleOf(dir), 0.02);
      const st = contours(stone, { min: [local[0] - 0.8, local[1] - 0.8], max: [local[0] + 0.8, local[1] + 0.8] }, 0.01, 0.02);
      extrude(p.geo('ruby'), p.geo('ruby'), st, ...zr(H.stones), { crease: 50 });
    }
    arbor(p.geo('steel'), -H.pivot, H.palletBridge[0] + H.pivot, { r: 0.17, pivot: 0.08 });
    p.solid('pallet fork', body, boundsOf([[...L.pallet, toBalance + 1]]), ...zr(H.lever));
    p.solid('pallet arbor', sd.circle(L.pallet, 0.17), box(L.pallet, 0.2), zh(H.palletBridge[0] + H.pivot), zh(-H.pivot));
    p.meta = { entry, exit };
    parts.push(p);
  }

  // --------------------------------------------------------- balance & staff
  {
    const p = new Part('balance_wheel', at(...L.balance));
    const rimOuter = 7.75;
    const rimInner = 7.2;
    const toPallet = angleOf(mul2(L.leverDir, -1));
    const rim = { outer: circle(rimOuter, 0, 0, 240), holes: [cw(circle(rimInner, 0, 0, 240))] };
    extrude(p.geo('gilt'), p.geo('gilt'), rim, ...zr(H.rim), { chamfer: 0.06, crease: 50 });
    // One arm across, with a hub.
    const armAngle = toPallet + 90 * DEG;
    const arm = sd.smooth(0.4, sd.box([0, 0], [rimInner + 0.2, 0.42], armAngle, 0.1), sd.circle([0, 0], 1.0));
    const armShapes = contours(sd.subtract(sd.intersect(arm, sd.circle([0, 0], rimInner + 0.1)), sd.circle([0, 0], 0.3)), { min: [-8, -8], max: [8, 8] }, 0.03, 0.06);
    extrude(p.geo('gilt'), p.geo('gilt'), armShapes, ...zr(H.arms), { crease: 40 });
    // Timing screws round the rim.
    const screwH = (H.rim[0] + H.rim[1]) / 2;
    for (let k = 0; k < 18; k++) {
      const a = armAngle + ((k + 0.5) / 18) * TAU;
      const head = new Geo();
      cylinder(head, 0.3, 0, 0.42, { segments: 16 });
      lathe(head, [[0, 0.42], [0.3, 0.42], [0.3, 0.5], [0.22, 0.56], [0, 0.56]], { segments: 16 });
      p.geo('gilt').append(head, alongAxis([Math.cos(a), Math.sin(a), 0], [rimOuter * Math.cos(a), rimOuter * Math.sin(a), zh(screwH)]));
    }
    // Staff, rollers and the impulse jewel (which hangs down to the lever's level).
    const s = (r, h) => [r, zh(h)];
    turned(p.geo('steel'), [
      s(0.08, -H.pivot), s(0.08, -0.05), s(0.2, 0.05), s(0.2, H.safetyRoller[0] - 0.03),
      s(0.5, H.safetyRoller[0]), s(0.5, H.safetyRoller[1]), s(0.25, H.safetyRoller[1] + 0.02),
      s(0.25, H.rollerTable[0]), s(1.35, H.rollerTable[0] + 0.001), s(1.35, H.rollerTable[1]), s(0.3, H.rollerTable[1] + 0.001),
      s(0.3, H.arms[0]), s(0.42, H.arms[1]), s(0.26, H.collet[0] - 0.02), s(0.26, H.cock[0]), s(0.08, H.cock[0] + 0.1), s(0.08, H.cock[0] + 0.35),
    ], { segments: 32 });
    const pin = polar(L.rollerRadius, toPallet);
    const jewelPin = new Geo();
    cylinder(jewelPin, 0.15, zh(H.rollerTable[0]), zh(H.lever[0] - 0.02), { segments: 14 });
    p.geo('ruby').append(jewelPin, place([pin[0], pin[1], 0]));
    // Collet for the hairspring's inner end.
    cylinder(p.geo('steel'), 0.62, ...zr(H.collet), { inner: 0.26, segments: 24 });
    p.solid('balance rim', sd.subtract(sd.circle(L.balance, rimOuter + 0.6), sd.circle(L.balance, rimInner)), box(L.balance, rimOuter + 0.6), ...zr(H.rim));
    p.solid('balance arm', (q) => arm(sub2(q, L.balance)), box(L.balance, rimInner), ...zr(H.arms));
    p.solid('staff lower pivot', sd.circle(L.balance, 0.1), box(L.balance, 0.1), zh(0), zh(-H.pivot));
    p.solid('staff', sd.circle(L.balance, 0.2), box(L.balance, 0.2), zh(H.safetyRoller[0]), zh(0.05));
    p.solid('safety roller', sd.circle(L.balance, 0.5), box(L.balance, 0.5), ...zr(H.safetyRoller));
    p.solid('roller table', sd.circle(L.balance, 1.35), box(L.balance, 1.4), ...zr(H.rollerTable));
    p.solid('staff upper', sd.circle(L.balance, 0.3), box(L.balance, 0.3), zh(H.cock[0]), zh(H.rollerTable[1]));
    p.meta = { rimOuter, toPallet };
    parts.push(p);
  }

  // -------------------------------------------------------------- hairspring
  {
    const p = new Part('hairspring', at(...L.balance));
    const turns = 12.5;
    const outer = 3.65;
    const start = 0;
    const path = spiral(0.64, outer, turns, start, 0.13);
    // Outer terminal: carry on round a little, then out to the stud on the cock.
    const end = start + turns * TAU;
    const stud = polar(outer + 0.12, end + 0.35);
    path.push(stud);
    ribbon(p.geo('blued'), path, 0.055, ...zr(H.hairspring));
    p.meta = { stud: add2(L.balance, stud), outer };
    parts.push(p);
  }

  // ------------------------------------------------------------ balance cock
  {
    const p = new Part('balance_cock');
    const [low, high] = H.cock;
    const hs = parts.find((q) => q.name === 'hairspring').meta;
    const foot = L.feet.cock;
    const outline = sd.smooth(1.2, sd.circle(L.balance, 3.1), sd.capsule(L.balance, foot, 2.3, 2.9), sd.circle(foot, 3.1));
    const bounds = boundsOf([[...L.balance, 3.6], [...foot, 3.6]]);
    slab(p, { sdf: sd.subtract(outline, sd.circle(L.balance, 0.62)), bounds, h: H.cock, finish: 'bridge' });
    pillar(p, foot, 2.1, low);
    screw(p.geo('blued'), add2(foot, polar(0.9, 255 * DEG)), zh(high), { r: 0.85, height: 0.3 });
    // Jewel in a gold chaton, held by two screws.
    jewel(p.geo('ruby'), L.balance, zh(high), { r: 0.6, depth: 1.0 });
    chaton(p.geo('gilt'), L.balance, zh(high), { r: 0.6, width: 0.55 });
    for (const sgn of [-1, 1]) screw(p.geo('blued'), add2(L.balance, polar(1.65, 120 * DEG + (sgn > 0 ? Math.PI : 0))), zh(high), { r: 0.32, height: 0.2 });
    // Regulator index, kept short and clear of the escapement and of the case back's slope.
    const towardFoot = angleOf(sub2(foot, L.balance));
    const indexAngle = towardFoot + 125 * DEG;
    const index = sd.smooth(0.2, sd.circle(L.balance, 1.5), sd.capsule(add2(L.balance, polar(1.4, indexAngle)), add2(L.balance, polar(4.6, indexAngle)), 0.32, 0.12));
    const ring = sd.subtract(index, sd.circle(L.balance, 1.2));
    const indexShapes = contours((q) => ring(q), boundsOf([[...L.balance, 6.6]]), 0.02, 0.04);
    extrude(p.geo('steel'), p.geo('steel'), indexShapes, zh(high + 0.13), zh(high), { crease: 40 });
    // Stud holding the hairspring's outer end, hanging under the cock.
    const studBox = contours(sd.box(hs.stud, [0.35, 0.35], 0, 0.05), boundsOf([[...hs.stud, 0.6]]), 0.01, 0.03);
    extrude(p.geo('steel'), p.geo('steel'), studBox, zh(low), zh(H.hairspring[0] - 0.02), { bottom: false });
    parts.push(p);
  }

  // ------------------------------------------------------------ pallet bridge
  {
    const p = new Part('pallet_bridge');
    const foot = L.feet.pallet;
    const outline = sd.smooth(0.6, sd.circle(L.pallet, 1.25), sd.capsule(L.pallet, foot, 1.05, 1.2));
    const bounds = boundsOf([[...L.pallet, 1.6], [...foot, 1.6]]);
    slab(p, { sdf: sd.subtract(outline, sd.circle(L.pallet, 0.5)), bounds, h: H.palletBridge, finish: 'bridge', chamfer: 0.08 });
    pillar(p, foot, 0.9, H.palletBridge[0]);
    screw(p.geo('blued'), foot, zh(H.palletBridge[1]), { r: 0.62, height: 0.3 });
    jewel(p.geo('ruby'), L.pallet, zh(H.palletBridge[1]), { r: 0.42, depth: 0.45 });
    parts.push(p);
  }

  // ------------------------------------------------------------- train bridge
  {
    const p = new Part('train_bridge');
    const { trainLeft: f1, trainLower: f2 } = L.feet;
    const pivots = [L.third, L.centre, L.escape];
    const outline = sd.smoothSubtract(
      0.9,
      sd.smooth(
        1.3,
        sd.capsule(f1, L.third, 2.3, 1.7),
        sd.capsule(L.third, L.centre, 1.7, 1.9),
        sd.capsule(L.centre, L.escape, 1.9, 1.7),
        sd.capsule(L.escape, f2, 1.7, 2.3),
        ...pivots.map((c) => sd.circle(c, 2.15)),
        sd.circle(f1, 2.4),
        sd.circle(f2, 2.4),
      ),
      sd.circle(L.balance, 8.9),
    );
    const holes = pivots.map((c) => sd.circle(c, 0.95));
    const bounds = boundsOf([[...f1, 3], [...f2, 3], ...pivots.map((c) => [...c, 2.6])]);
    slab(p, { sdf: sd.subtract(outline, ...holes), bounds, h: H.trainBridge, finish: 'bridge' });
    for (const f of [f1, f2]) {
      pillar(p, f, 1.6, H.trainBridge[0]);
      screw(p.geo('blued'), f, zh(H.trainBridge[1]), { r: 0.85, slot: 0.6 });
    }
    for (const c of pivots) {
      jewel(p.geo('ruby'), c, zh(H.trainBridge[1]), { r: 0.5, depth: 0.9 });
      chaton(p.geo('gilt'), c, zh(H.trainBridge[1]), { r: 0.5, width: 0.42 });
    }
    parts.push(p);
  }

  // ------------------------------------------------------------ barrel bridge
  {
    const p = new Part('barrel_bridge');
    const { barrelLeft: f3, barrelRight: f4 } = L.feet;
    const rTip = gear({ ...ratchet }).tipRadius;
    const cTip = gear({ ...crown }).tipRadius;
    const outline = sd.smoothSubtract(
      1.0,
      sd.smooth(
        1.6,
        sd.circle(L.barrel, 5.8),
        sd.circle(L.crownWheel, 3.4),
        sd.capsule(L.barrel, f3, 3.2, 2.1),
        sd.capsule(L.barrel, f4, 3.0, 2.1),
        sd.circle(L.clickPivot, 1.5),
        sd.circle(f3, 2.3),
        sd.circle(f4, 2.3),
      ),
      sd.circle(L.centre, 7.7),
      sd.circle(L.third, 7.5),
      // A slot so the winding pinion can reach up to the crown wheel.
      sd.box([0, L.pinionY], [2.25, 1.0], 0, 0.2),
    );
    const sink = sd.union(sd.circle(L.barrel, rTip + 0.18), sd.circle(L.crownWheel, cTip + 0.18), clickRoom);
    const bounds = boundsOf([[...L.barrel, 6.5], [...L.crownWheel, 4.2], [...f3, 2.6], [...f4, 2.6]]);
    slab(p, { sdf: sd.subtract(outline, sd.circle(L.barrel, 1.0), sd.circle(L.crownWheel, 0.5)), bounds, h: H.barrelBridge, finish: 'bridge', sink, hSink: H.winding[0] - 0.02 });
    for (const f of [f3, f4]) {
      pillar(p, f, 1.6, H.barrelBridge[0]);
      screw(p.geo('blued'), f, zh(H.barrelBridge[1]), { r: 0.85, slot: -0.4 });
    }
    parts.push(p);
  }

  // ------------------------------------------------- ratchet wheel and click
  {
    const w = new Part('ratchet_wheel', at(...L.barrel));
    addGear(w, 'steel', { ...ratchet, phase: ph.ratchet }, zr(H.winding), { bore: 0.98, center: L.barrel });
    screw(w.geo('steel'), [0, 0], zh(H.winding[1]), { r: 1.55, height: 0.42 });
    w.solid('ratchet screw', sd.circle(L.barrel, 1.55), box(L.barrel, 1.6), zh(H.winding[1] + 0.42), zh(H.winding[1]));
    parts.push(w);
    const p = new Part('ratchet_click', at(...L.barrel));
    // Click: a pawl on its own screw, nose in the ratchet teeth; a curved spring behind it.
    const pivot = sub2(L.clickPivot, L.barrel);
    const cs = contours((q) => click(add2(q, L.barrel)), boundsOf([[...pivot, 3.6]]), 0.015, 0.03);
    extrude(p.geo('steel'), p.geo('steel'), cs, zh(H.winding[1] - 0.05), zh(H.winding[0]), { chamfer: 0.04, crease: 40 });
    screw(p.geo('blued'), pivot, zh(H.winding[1] - 0.05), { r: 0.48, height: 0.25 });
    ribbon(p.geo('steel'), clickSpring.map((q) => sub2(q, L.barrel)), 0.14, zh(H.winding[1] - 0.07), zh(H.winding[0] + 0.03));
    p.solid('click', click, boundsOf([[...L.clickPivot, 3]]), ...zr(H.winding));
    parts.push(p);
  }

  // -------------------------------------------------------------- crown wheel
  {
    const p = new Part('crown_wheel', at(...L.crownWheel));
    addGear(p, 'steel', { ...crown, phase: ph.crown }, zr(H.winding), { bore: 0.45, center: L.crownWheel });
    screw(p.geo('steel'), [0, 0], zh(H.winding[1]), { r: 1.1, height: 0.32, slot: 0.3 });
    p.solid('crown wheel screw', sd.circle(L.crownWheel, 1.1), box(L.crownWheel, 1.1), zh(H.winding[1] + 0.32), zh(H.winding[1]));
    parts.push(p);
  }

  // -------------------------------------------------------------- winding stem
  {
    const y0 = L.pinionY - 0.8;
    const p = new Part('winding_stem', [0, 30, L.stemZ]);
    const local = (y) => y - 30;
    // The stem, along y, stepping down where it runs through the winding pinion.
    const stem = new Geo();
    turned(stem, [[0.45, local(y0 - 0.35)], [0.45, local(y0 + 1.7)], [0.58, local(y0 + 1.8)], [0.58, local(40.5)], [0.3, local(40.8)]], { segments: 20 });
    p.geo('steel').append(stem, alongAxis([0, 1, 0], [0, 0, 0]));
    parts.push(p);
  }

  // ----------------------------------------------------- motion works (dial side)
  {
    const p = new Part('cannon_pinion', at(...L.centre));
    addGear(p, 'steel', { ...M.cannon, kind: 'pinion', phase: ph.cannon }, [-0.82, -0.59], { bore: 0.44, center: L.centre });
    turned(p.geo('steel'), [[0.62, -0.86], [0.62, 0.58], [0.5, 0.62]], { bore: 0.44 });
    parts.push(p);
  }
  {
    const p = new Part('minute_wheel', at(...L.minuteWheel));
    addGear(p, 'gilt', { ...M.minute, phase: ph.minute }, [-0.82, -0.59], { spokes: 4, bore: 0.34, center: L.minuteWheel });
    addGear(p, 'steel', { ...M.minutePinion, kind: 'pinion', phase: ph.minutePinion }, [-0.5, -0.27], { bore: 0.34, center: L.minuteWheel });
    turned(p.geo('steel'), [[0.5, -0.86], [0.5, -0.22]], { bore: 0.34, segments: 20 });
    parts.push(p);
  }
  {
    const p = new Part('hour_wheel', at(...L.centre));
    addGear(p, 'gilt', { ...M.hour, phase: ph.hour }, [-0.5, -0.27], { spokes: 4, bore: 0.64, center: L.centre });
    turned(p.geo('gilt'), [[0.85, -0.52], [0.85, 0.36], [0.74, 0.42]], { bore: 0.64 });
    parts.push(p);
  }

  return parts;
}

/** Pairs of parts whose footprints overlap at the same height: anything that would collide. */
export function clashes(parts, { cell = 0.05, ignore = [] } = {}) {
  const solids = parts.flatMap((p) => p.solids.map((s) => ({ ...s, part: p.name })));
  const found = [];
  for (let i = 0; i < solids.length; i++) {
    for (let k = i + 1; k < solids.length; k++) {
      const a = solids[i];
      const b = solids[k];
      if (a.part === b.part) continue;
      if (ignore.some(([x, y]) => (x === a.part && y === b.part) || (x === b.part && y === a.part))) continue;
      if (a.z[1] <= b.z[0] + 1e-6 || b.z[1] <= a.z[0] + 1e-6) continue;
      const min = [Math.max(a.bounds.min[0], b.bounds.min[0]), Math.max(a.bounds.min[1], b.bounds.min[1])];
      const max = [Math.min(a.bounds.max[0], b.bounds.max[0]), Math.min(a.bounds.max[1], b.bounds.max[1])];
      if (min[0] >= max[0] || min[1] >= max[1]) continue;
      let hits = 0;
      let at = null;
      for (let y = min[1]; y <= max[1]; y += cell) {
        for (let x = min[0]; x <= max[0]; x += cell) {
          if (a.sdf([x, y]) < -0.01 && b.sdf([x, y]) < -0.01) {
            hits++;
            at ??= [x, y];
          }
        }
      }
      if (hits) found.push(`${a.part} (${a.label}) × ${b.part} (${b.label}): ${(hits * cell * cell).toFixed(2)} mm² near [${at.map((v) => v.toFixed(1))}]`);
    }
  }
  return found;
}

/**
 * Parts that pass through each other while the model comes apart: pairs clear of each
 * other when assembled that meet at some slider value, given the content file's parts
 * (direction, distance, window, then). `mm` converts model units to millimetres.
 */
export function explodeClashes(parts, contentParts, mm) {
  const byNode = new Map(contentParts.flatMap((p) => [p.node, ...(p.with ?? [])].map((name) => [name, p])));
  const clamp = (x) => Math.min(1, Math.max(0, x));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  const leg = (d, distance, e) => d.map((c) => (c / Math.hypot(...d)) * distance * mm * e);
  // The same timing as the viewer's Exploder (two legs share the window by length).
  const offsetAt = (name, v) => {
    const p = byNode.get(name);
    if (!p?.window) return [0, 0, 0];
    const t = clamp((v - p.window[0]) / (p.window[1] - p.window[0]));
    const split = p.then ? Math.max(0.3, p.distance / (p.distance + p.then.distance)) : 1;
    const first = leg(p.direction, p.distance, ease(clamp(t / split)));
    const second = p.then ? leg(p.then.direction, p.then.distance, ease(clamp((t - split) / (1 - split)))) : [0, 0, 0];
    return first.map((c, i) => c + second[i]);
  };
  const overlaps = (a, b, sa, sb) => {
    const min = [Math.max(a.bounds.min[0] + sa[0], b.bounds.min[0] + sb[0]), Math.max(a.bounds.min[1] + sa[1], b.bounds.min[1] + sb[1])];
    const max = [Math.min(a.bounds.max[0] + sa[0], b.bounds.max[0] + sb[0]), Math.min(a.bounds.max[1] + sa[1], b.bounds.max[1] + sb[1])];
    if (min[0] >= max[0] || min[1] >= max[1]) return false;
    for (let y = min[1]; y <= max[1]; y += 0.1) {
      for (let x = min[0]; x <= max[0]; x += 0.1) if (a.sdf([x - sa[0], y - sa[1]]) < -0.02 && b.sdf([x - sb[0], y - sb[1]]) < -0.02) return true;
    }
    return false;
  };
  const solids = parts.flatMap((p) => p.solids.map((s) => ({ ...s, part: p.name })));
  const found = [];
  for (let i = 0; i < solids.length; i++) {
    for (let k = i + 1; k < solids.length; k++) {
      const a = solids[i];
      const b = solids[k];
      if (a.part === b.part) continue;
      // At each sample: do they overlap in depth, which one is in front, and do their footprints overlap?
      const state = (v) => {
        const oa = offsetAt(a.part, v);
        const ob = offsetAt(b.part, v);
        const za = [a.z[0] + oa[2], a.z[1] + oa[2]];
        const zb = [b.z[0] + ob[2], b.z[1] + ob[2]];
        return { depth: za[1] > zb[0] + 0.02 && zb[1] > za[0] + 0.02, order: Math.sign(za[0] + za[1] - zb[0] - zb[1]), plan: () => overlaps(a, b, oa, ob) };
      };
      let prev = state(0);
      if (prev.depth && prev.plan()) continue; // meshing wheels, pivots in their jewels: in contact by design
      for (let s = 1; s <= 160; s++) {
        const now = state(s / 160);
        // Either caught overlapping, or swapped front and back between samples (a thin part moving fast).
        const crossed = now.order !== prev.order && now.order !== 0 && prev.order !== 0;
        if (((now.depth || crossed) && now.plan()) || (crossed && prev.plan())) {
          found.push(`${a.part} (${a.label}) passes through ${b.part} (${b.label}) at slider ${(s / 160).toFixed(2)}`);
          break;
        }
        prev = now;
      }
    }
  }
  return found;
}

/**
 * The way the power goes through the movement, for "How it works": polylines in the movement
 * frame (mm), each point with the part it sits on. Between two wheels the path crosses where
 * their teeth meet, at that mesh's height, and it climbs each arbor from pinion to wheel.
 */
export function flowPaths(L) {
  const T = L.train;
  const M = L.motion;
  const mid = ([h0, h1]) => zh((h0 + h1) / 2);
  const pitch = ({ teeth, module }) => (teeth * module) / 2;
  /** Where wheel a's teeth meet the pinion at b. */
  const meet = (a, b, wheel) => add2(a, mul2(unit2(sub2(b, a)), pitch(wheel)));
  const pt = (part, [x, y], z) => ({ part, at: [x, y, z] });
  /** Out and back to an off-axis wheel: a loop round its arbor, so the way there and the way back can be told apart. */
  const loop = (part, from, to, z0, z1, r = 0.9) => {
    const dir = unit2(sub2(to, from));
    const side = [-dir[1], dir[0]];
    return [
      pt(part, add2(add2(from, mul2(dir, len2(sub2(to, from)) - r * 1.6)), mul2(side, r)), z0),
      pt(part, add2(to, mul2(side, r)), (z0 * 2 + z1) / 3),
      pt(part, add2(to, mul2(dir, r)), (z0 + z1) / 2),
      pt(part, add2(to, mul2(side, -r)), (z0 + z1 * 2) / 3),
      pt(part, add2(add2(from, mul2(dir, len2(sub2(to, from)) - r * 1.6)), mul2(side, -r)), z1),
    ];
  };
  const stem = [0, L.pinionY + 6];
  const crownTop = [0, 41]; // the crown, at the stem's outer end
  const power = [
    pt('winding_stem', crownTop, L.stemZ),
    pt('winding_stem', stem, L.stemZ),
    pt('crown_wheel', [0, L.pinionY - 0.2], mid(H.winding)),
    pt('crown_wheel', L.crownWheel, mid(H.winding)),
    pt('ratchet_wheel', meet(L.crownWheel, L.barrel, { teeth: L.crownTeeth, module: L.windingModule }), mid(H.winding)),
    pt('ratchet_wheel', L.barrel, mid(H.winding)),
    pt('mainspring', add2(L.barrel, polar(3.2, -40 * DEG)), mid(H.mainspring)),
    pt('mainspring', add2(L.barrel, polar(6.2, -95 * DEG)), mid(H.mainspring)),
    pt('barrel', meet(L.barrel, L.centre, T.barrel), mid(H.barrelTeeth)),
  ];
  const train = [
    pt('barrel', L.barrel, mid(H.barrelTeeth)),
    pt('barrel', meet(L.barrel, L.centre, T.barrel), mid(H.barrelTeeth)),
    pt('centre_wheel', L.centre, mid(H.centre)),
    ...loop('third_wheel', L.centre, L.third, mid(H.centre), mid(H.third)),
    pt('fourth_wheel', L.centre, mid(H.fourth)),
    pt('fourth_wheel', meet(L.centre, L.escape, T.fourth), mid(H.fourth)),
    pt('escape_wheel', L.escape, mid(H.escape)),
  ];
  const fork = L.pallet;
  const pin = add2(L.balance, mul2(L.leverDir, -L.rollerRadius));
  const escapement = [
    pt('escape_wheel', L.escape, mid(H.escape)),
    pt('escape_wheel', add2(L.escape, mul2(unit2(sub2(fork, L.escape)), L.escapeTip * 0.9)), mid(H.escape)),
    pt('pallet_fork', fork, mid(H.lever)),
    pt('pallet_fork', add2(fork, mul2(L.leverDir, L.leverLength)), mid(H.lever)),
    pt('balance_wheel', pin, mid(H.rollerTable)),
    pt('balance_wheel', L.balance, mid(H.rim)),
  ];
  const zDial = (h) => -h; // the motion works sit under the dial, z just below 0
  const hands = [
    pt('cannon_pinion', L.centre, zDial(0.4)),
    pt('cannon_pinion', meet(L.centre, L.minuteWheel, M.cannon), zDial(0.7)),
    pt('minute_wheel', L.minuteWheel, zDial(0.7)),
    pt('minute_wheel', meet(L.minuteWheel, L.centre, M.minutePinion), zDial(0.38)),
    pt('hour_wheel', L.centre, zDial(0.2)),
  ];
  return { power, train, escapement, hands };
}
