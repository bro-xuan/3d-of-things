// The lens of the generated reflex camera: an 80 mm f/2.8 of the Planar type (seven glasses in
// five groups) in a leaf shutter. The bayonet and its flange ring stay on the body; everything in
// front of them (the shutter's housing with its speed and aperture rings, the depth-of-field ring,
// the focusing ring and the glass) is the optical unit, which a helicoid moves forward to focus
// as the focusing ring turns. Between the glass groups sit the shutter's five blades and the
// iris's five. Frame as in layout.mjs: z forward, the flange at 74.9 mm.
import { Geo, contours, extrude, lathe } from '../watch/geometry.mjs';
import { plate, revolve, ring, shaft, box } from '../camera/solids.mjs';
import { Part } from '../camera/mechanism.mjs';
import { DRIVE, FLANGE, LENS } from './layout.mjs';
import { band, face, flutes } from './shapes.mjs';

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

/** The lens's stops and the shutter's speeds, in the order the rings put them. */
export const STOPS = [2.8, 4, 5.6, 8, 11, 16, 22];
export const SPEEDS = [1, 1 / 2, 1 / 4, 1 / 8, 1 / 15, 1 / 30, 1 / 60, 1 / 125, 1 / 250, 1 / 500];
/** Set at rest: f/8 and 1/125 s, focused at infinity. */
export const REST = { stop: 3, speed: 7 };

/** How far the glass comes out (mm) to focus at `metres`: x·x' = f² with the subject 2f + x + x' from the film. */
export function extensionFor(metres, f = LENS.focal) {
  if (!Number.isFinite(metres) || metres <= 0) return 0;
  const s = metres * 1000 - 2 * f;
  return (s - Math.sqrt(Math.max(0, s * s - 4 * f * f))) / 2;
}
export const MAX_EXTENSION = extensionFor(LENS.nearest);

/** Stations along z (mm) for the lens's outside, from the flange forward. */
export const Z = {
  flange: [FLANGE, FLANGE + 2.6],
  housing: [FLANGE + 2.8, FLANGE + 21.4],
  speed: [FLANGE + 3.2, FLANGE + 9.8],
  aperture: [FLANGE + 10.4, FLANGE + 15.6],
  index: [FLANGE + 15.8, FLANGE + 17.2],
  dof: [FLANGE + 17.6, FLANGE + 21.4],
  focus: [FLANGE + 21.8, FLANGE + 41.4],
  front: [FLANGE + 41.6, FLANGE + 58.6],
};

/** The leaf shutter and the iris: blades on pins round the bore, turning about them to close. */
/** The optical unit's bore, wide enough to slide over the helicoid's sleeve; the sleeve ends short of the blades. */
const BORE = 29.4;
const SLEEVE_END = FLANGE + 12.1;
/**
 * The shutter's five blades. Closed, each is a sector of the bore (half-angle 40°, its tip 1 mm past the
 * middle, so neighbours overlap); opening turns it 48° about its pin, which carries it out into the ring
 * between the bore and the housing (13.9 to 28.1 mm from the axis). Found by .cache/hasselblad/leafsearch.mjs.
 */
export const SHUTTER = { blades: 5, z: FLANGE + 13.1, pivot: 18, bore: 13.6, reach: 14.8, half: 40 * DEG, aim: 58 * DEG, tip: 1.0, open: 48 * DEG, thickness: 0.06, step: 0.09 };
export const IRIS = { blades: 5, z: FLANGE + 14.0, pivot: 16.4, edge: 12.4, outer: 17.8, reach: 22.6, thickness: 0.05, step: 0.08 };
/** How far an iris blade turns (radians) for the opening at f-number n. */
export function irisAngle(n) {
  const radius = IRIS.edge * (STOPS[0] / n);
  return 2 * Math.asin((IRIS.edge - radius) / (2 * IRIS.pivot));
}

/**
 * Blades for an iris or a leaf shutter, as in the rangefinder's lens: at rest each lies open in
 * the ring between `edge` and `outer`, over a long sector so that closed down they still overlap;
 * it's trimmed so that turning on its pin it never sweeps past `reach`.
 */
function bladeOutlines(cfg, k, maxTurn) {
  const psi = 90 * DEG + (k * TAU) / cfg.blades;
  const P = [cfg.pivot * Math.cos(psi), cfg.pivot * Math.sin(psi)];
  const turn = (q, th) => {
    const c = Math.cos(th);
    const s = Math.sin(th);
    const d = [q[0] - P[0], q[1] - P[1]];
    return [P[0] + d[0] * c - d[1] * s, P[1] + d[0] * s + d[1] * c];
  };
  const turns = Array.from({ length: 9 }, (_, i) => (maxTurn * i) / 8);
  const span = (q) => {
    const a = Math.atan2(q[1], q[0]);
    const rel = Math.atan2(Math.sin(a - psi), Math.cos(a - psi));
    return Math.max(-50 * DEG - rel, rel - 170 * DEG) * 12;
  };
  const blade = (q) => {
    const r = Math.hypot(...q);
    let d = Math.max(cfg.edge - r, r - cfg.outer, span(q));
    for (const th of turns) d = Math.max(d, Math.hypot(...turn(q, th)) - cfg.reach);
    return d;
  };
  const shapes = contours(blade, { min: [-cfg.outer - 1, -cfg.outer - 1], max: [cfg.outer + 1, cfg.outer + 1] }, 0.06, 0.1).map(({ outer }) => ({ outer, holes: [] }));
  return { shapes, P, turn };
}

/** A shutter blade's outline, open (as at rest), and its pin, for blade k: the sector plus an arm round to the pin. */
export function leafOutline(k) {
  const S = SHUTTER;
  const psi = 90 * DEG + (k * TAU) / S.blades;
  const rot = (q, a) => [q[0] * Math.cos(a) - q[1] * Math.sin(a), q[0] * Math.sin(a) + q[1] * Math.cos(a)];
  // In the blade's own frame the pin is at (pivot, 0) and the sector's middle points at -aim.
  const tip = [-Math.cos(-S.aim) * S.tip, -Math.sin(-S.aim) * S.tip];
  const closed = [tip];
  for (let i = 0; i <= 24; i++) {
    const a = -S.aim - S.half + (2 * S.half * i) / 24;
    closed.push([tip[0] + S.reach * Math.cos(a), tip[1] + S.reach * Math.sin(a)]);
  }
  // Round the pin: an arc of radius 2.4 joining the sector's far corner back to its tip side.
  const pin = [S.pivot, 0];
  for (let i = 0; i <= 10; i++) {
    const a = -100 * DEG + (200 * DEG * i) / 10;
    closed.push([pin[0] + 2.4 * Math.cos(a), pin[1] + 2.4 * Math.sin(a)]);
  }
  const P = rot(pin, psi);
  const open = closed.map((q) => {
    const d = [q[0] - pin[0], q[1] - pin[1]];
    const o = [pin[0] + d[0] * Math.cos(S.open) - d[1] * Math.sin(S.open), pin[1] + d[0] * Math.sin(S.open) + d[1] * Math.cos(S.open)];
    return rot(o, psi);
  });
  // Turning by th about the pin (negative closes it).
  const turn = (q, th) => {
    const c = Math.cos(th);
    const s = Math.sin(th);
    const d = [q[0] - P[0], q[1] - P[1]];
    return [P[0] + d[0] * c - d[1] * s, P[1] + d[0] * s + d[1] * c];
  };
  return { outline: convexHull(open), P, turn };
}

function convexHull(points) {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper = [];
  for (const q of p.reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

/** Points of the bore left uncovered with every shutter blade turned by th (-open closes it fully). */
export function uncovered(th) {
  const blades = Array.from({ length: SHUTTER.blades }, (_, k) => {
    const { outline, turn } = leafOutline(k);
    return { shapes: [{ outer: outline }], turn };
  });
  const cfg = { edge: SHUTTER.bore };
  const inside = (q, loop) => {
    let c = false;
    for (let i = 0, j = loop.length - 1; i < loop.length; j = i++) {
      const [xi, yi] = loop[i];
      const [xj, yj] = loop[j];
      if (yi > q[1] !== yj > q[1] && q[0] < ((xj - xi) * (q[1] - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const open = [];
  for (let r = 0; r <= cfg.edge; r += 0.5) {
    for (let a = 0; a < TAU; a += Math.max(0.02, 0.5 / Math.max(r, 0.5))) {
      const q = [r * Math.cos(a), r * Math.sin(a)];
      // Turning a blade by th about its pin is the same as turning the point back by th.
      const covered = blades.some(({ shapes, turn }) => shapes.some(({ outer }) => inside(turn(q, -th), outer)));
      if (!covered) open.push(q);
    }
  }
  return open;
}

/** A lens element: a disc with spherical faces (radius of curvature > 0 bulges forward). */
function element(geo, { z, r, thick, front, back }) {
  const sag = (R, h) => (R ? Math.sign(R) * (Math.abs(R) - Math.sqrt(Math.max(0, R * R - h * h))) : 0);
  const n = 14;
  const profile = [];
  // From the axis at the back face, out to the rim, up the edge, and back in along the front face.
  for (let i = 0; i <= n; i++) {
    const h = (r * i) / n;
    profile.push([h, z - sag(back, h)]);
  }
  for (let i = n; i >= 0; i--) {
    const h = (r * i) / n;
    profile.push([h, z + thick - sag(front, h)]);
  }
  const local = new Geo();
  lathe(local, profile, { segments: 64, crease: 50 });
  geo.append(local);
}

function cellParts() {
  const parts = [];
  // ------------------------------------------------- fixed: bayonet and flange
  const lens = new Part('lens');
  const m = LENS.mount;
  // The bayonet barrel, with its four lugs behind the flange and the drive coupling's tongue at the bottom.
  revolve(lens.geo('chrome'), 'z', [0, 0, 0], [[23.2, 70.95], [m.r, 70.95], [m.r, FLANGE], [23.2, FLANGE]], { segments: 120 });
  for (let k = 0; k < 4; k++) {
    const a0 = (k * 90 - 13) * DEG;
    const a1 = (k * 90 + 13) * DEG;
    const outline = [];
    for (let i = 0; i <= 8; i++) outline.push([(m.r - 0.1) * Math.cos(a0 + ((a1 - a0) * i) / 8), (m.r - 0.1) * Math.sin(a0 + ((a1 - a0) * i) / 8)]);
    for (let i = 8; i >= 0; i--) outline.push([27.3 * Math.cos(a0 + ((a1 - a0) * i) / 8), 27.3 * Math.sin(a0 + ((a1 - a0) * i) / 8)]);
    plate(lens.geo('chrome'), 'z', { outer: outline }, 71.0, 72.3, { chamfer: 0.12 });
  }
  box(lens.geo('steel'), [DRIVE.x - 2.9, DRIVE.x + 2.9], [-23.4, DRIVE.y + 0.4], [70.7, 70.98], { axis: 'z' });
  // The flange ring, which seats on the body's bayonet, with the red dot to line it up by.
  revolve(lens.geo('chrome'), 'z', [0, 0, 0], [[27.2, Z.flange[0]], [32.2, Z.flange[0]], [32.6, Z.flange[0] + 0.5], [32.6, Z.flange[1] - 0.4], [32.2, Z.flange[1]], [27.2, Z.flange[1]], [27.2, Z.flange[0]]], { segments: 120 });
  plate(lens.geo('red'), 'z', { outer: ring(0.7, 0, 30.4) }, Z.flange[1] - 0.04, Z.flange[1] + 0.05);
  // The helicoid's sleeve, which shows between the flange and the housing when the lens is focused close.
  revolve(lens.geo('chrome'), 'z', [0, 0, 0], [[29.2, Z.flange[1]], [29.2, SLEEVE_END], [28.6, SLEEVE_END], [28.6, Z.flange[1]]], { segments: 96 });
  parts.push(lens);

  // ------------------------------------------------ moving: the optical unit
  const optics = new Part('optics', { parent: 'lens' });
  // The shutter's housing: a drum round the blades, with a raised band for the index between the rings.
  revolve(optics.geo('chrome'), 'z', [0, 0, 0], [[BORE, Z.housing[0]], [31.0, Z.housing[0]], [31.0, Z.housing[1]], [BORE, Z.housing[1]]], { segments: 120 });
  revolve(optics.geo('chrome'), 'z', [0, 0, 0], [[31.0, Z.index[0]], [31.9, Z.index[0] + 0.3], [31.9, Z.index[1] - 0.3], [31.0, Z.index[1]]], { segments: 120 });
  // The index: a red line at the top, between the speed and aperture scales, and the depth-of-field scale's ring.
  box(optics.geo('red'), [-0.25, 0.25], [31.85, 31.95], [Z.index[0] + 0.35, Z.index[1] - 0.35], { axis: 'y' });
  band(optics.geo('dofScale'), 'z', [0, 0, 0], 31.6, Z.dof[0], Z.dof[1]);
  revolve(optics.geo('chrome'), 'z', [0, 0, 0], [[31.0, Z.dof[0]], [31.6, Z.dof[0]], [31.6, Z.dof[0] + 0.01]], { segments: 120 });
  // The synchro lever and the flash socket on the housing's left side.
  shaft(optics.geo('chrome'), 'x', [0, -14, Z.housing[0] + 9], [[2.2, 27.4], [2.2, 33.6], [1.6, 34.4]], { segments: 20 });
  box(optics.geo('black'), [30.2, 32.8], [-6.5, -4.5], [Z.housing[0] + 2, Z.housing[0] + 6.5], { axis: 'x', round: 0.6 });
  // The front barrel, with the filter bayonet's lugs and the name ring.
  revolve(
    optics.geo('chrome'),
    'z',
    [0, 0, 0],
    [[21.6, Z.front[0]], [30.2, Z.front[0]], [30.2, Z.front[0] + 2.2], [28.6, Z.front[0] + 3.2], [28.6, Z.front[1] - 2.2], [28.0, Z.front[1] - 0.6], [27.0, Z.front[1]], [21.6, Z.front[1]]],
    { segments: 120 },
  );
  for (let k = 0; k < 3; k++) {
    const a0 = (k * 120 + 30) * DEG;
    const a1 = (k * 120 + 62) * DEG;
    const outline = [];
    for (let i = 0; i <= 8; i++) outline.push([28.5 * Math.cos(a0 + ((a1 - a0) * i) / 8), 28.5 * Math.sin(a0 + ((a1 - a0) * i) / 8)]);
    for (let i = 8; i >= 0; i--) outline.push([29.5 * Math.cos(a0 + ((a1 - a0) * i) / 8), 29.5 * Math.sin(a0 + ((a1 - a0) * i) / 8)]);
    plate(optics.geo('chrome'), 'z', { outer: outline }, Z.front[1] - 4.6, Z.front[1] - 3.0, { chamfer: 0.12 });
  }
  face(optics.geo('nameRing'), 'z', [0, 0, 0], 19.2, 21.55, Z.front[1] - 0.6, 1, { flip: true });
  revolve(optics.geo('black'), 'z', [0, 0, 0], [[18.4, Z.front[1] - 0.6], [21.6, Z.front[1] - 0.6], [21.6, Z.front[1] - 6], [18.4, Z.front[1] - 6]].reverse(), { segments: 96 });
  // The barrel inside, black, holding the glass; and the rear barrel that reaches back into the body.
  revolve(optics.geo('flock'), 'z', [0, 0, 0], [[BORE - 0.02, Z.housing[1]], [BORE - 0.02, Z.housing[0]]], { segments: 96 });
  // The plates the shutter's and the iris's blades lie between.
  for (const z of [SHUTTER.z - 0.15, IRIS.z + IRIS.step * IRIS.blades + 0.15]) {
    revolve(optics.geo('black'), 'z', [0, 0, 0], [[SHUTTER.bore + 0.6, z], [BORE - 0.02, z], [BORE - 0.02, z + 0.12], [SHUTTER.bore + 0.6, z + 0.12]], { segments: 96 });
  }
  revolve(optics.geo('black'), 'z', [0, 0, 0], [[16.6, 64.6], [18.0, 64.6], [18.0, 70.8], [23.0, 70.8], [23.0, Z.housing[0]], [16.6, Z.housing[0]], [16.6, 64.6]], { segments: 96 });
  // The glass: a Planar's seven elements in five groups, the stop between them.
  const g = optics.geo('glass');
  element(g, { z: FLANGE + 49.0, r: 18.2, thick: 5.6, front: 44, back: 160 });
  element(g, { z: FLANGE + 42.6, r: 16.4, thick: 5.0, front: 30, back: 90 });
  element(g, { z: FLANGE + 33.4, r: 15.0, thick: 7.4, front: 26, back: 22 });
  element(g, { z: FLANGE + 0.5, r: 14.6, thick: 7.0, front: -40, back: -28 });
  element(g, { z: 66.2, r: 15.6, thick: 4.6, front: -150, back: -55 });
  // The front element's coating catches the light.
  element(optics.geo('coated'), { z: FLANGE + 54.7, r: 18.0, thick: 0.02, front: 44, back: 44 });
  parts.push(optics);

  // ------------------------------------------------------------- the rings
  const speed = new Part('speed_ring', { parent: 'optics' });
  plate(speed.geo('black'), 'z', { outer: flutes(32.7, 0.5, 60), holes: [ring(31.02, 0, 0, 120).reverse()] }, Z.speed[0], Z.speed[0] + 3.4, { chamfer: 0.3, chamferBottom: 0.3 });
  band(speed.geo('speedScale'), 'z', [0, 0, 0], 32.15, Z.speed[0] + 3.4, Z.speed[1]);
  revolve(speed.geo('black'), 'z', [0, 0, 0], [[31.02, Z.speed[0] + 3.4], [32.15, Z.speed[0] + 3.4], [32.15, Z.speed[0] + 3.41]], { segments: 96 });
  revolve(speed.geo('black'), 'z', [0, 0, 0], [[32.15, Z.speed[1] - 0.01], [32.15, Z.speed[1]], [31.02, Z.speed[1]]], { segments: 96 });
  parts.push(speed);

  const aperture = new Part('aperture_ring', { parent: 'optics' });
  band(aperture.geo('apertureScale'), 'z', [0, 0, 0], 32.0, Z.aperture[0], Z.aperture[1]);
  for (const z of [Z.aperture[0], Z.aperture[1]]) revolve(aperture.geo('black'), 'z', [0, 0, 0], z === Z.aperture[0] ? [[31.02, z], [32.0, z], [32.0, z + 0.01]] : [[32.0, z - 0.01], [32.0, z], [31.02, z]], { segments: 96 });
  // A little tab to turn it by, at the bottom.
  box(aperture.geo('black'), [-2.2, 2.2], [-34.4, -31.8], [Z.aperture[0] + 0.6, Z.aperture[1] - 0.6], { axis: 'y', round: 0.8 });
  parts.push(aperture);

  const focus = new Part('focus_ring', { parent: 'optics' });
  band(focus.geo('distanceScale'), 'z', [0, 0, 0], 32.4, Z.focus[0], Z.focus[0] + 4.2);
  revolve(focus.geo('black'), 'z', [0, 0, 0], [[31.02, Z.focus[0]], [32.4, Z.focus[0]], [32.4, Z.focus[0] + 0.01]], { segments: 96 });
  plate(focus.geo('grip'), 'z', { outer: flutes(34.6, 0.9, 40, { sharp: 2.4 }), holes: [ring(31.02, 0, 0, 120).reverse()] }, Z.focus[0] + 4.2, Z.focus[1] - 1.2, { chamfer: 0.6, chamferBottom: 0.6 });
  revolve(focus.geo('chrome'), 'z', [0, 0, 0], [[31.02, Z.focus[1] - 1.2], [33.6, Z.focus[1] - 1.2], [33.6, Z.focus[1] - 0.3], [33.2, Z.focus[1]], [31.02, Z.focus[1]]], { segments: 120 });
  parts.push(focus);
  return parts;
}

/** The shutter's and the iris's blades, each its own part to turn on its pin, and the plates they lie between. */
function bladeParts() {
  const parts = [];
  const make = (cfg, prefix, maxTurn, restTurn, material) => {
    for (let k = 0; k < cfg.blades; k++) {
      const { shapes, P, turn } = bladeOutlines(cfg, k, maxTurn);
      const part = new Part(`${prefix}_${k}`, { parent: 'optics', extras: { pivot: P } });
      const z = cfg.z + k * cfg.step;
      const local = new Geo();
      extrude(local, local, shapes, z, z + cfg.thickness);
      part.geo(material).append(local, (pp, n) => {
        const [x, y] = turn([pp[0], pp[1]], restTurn);
        const c = Math.cos(restTurn);
        const s = Math.sin(restTurn);
        return [[x, y, pp[2]], [n[0] * c - n[1] * s, n[0] * s + n[1] * c, n[2]]];
      });
      shaft(part.geo('steel'), 'z', [P[0], P[1], 0], [[0.42, z - 0.01], [0.42, z + cfg.thickness + 0.01]], { segments: 14 });
      parts.push(part);
    }
  };
  // The shutter is open for viewing at rest: its blades lie out in the ring round the bore.
  for (let k = 0; k < SHUTTER.blades; k++) {
    const { outline, P } = leafOutline(k);
    const part = new Part(`shutter_blade_${k}`, { parent: 'optics', extras: { pivot: P } });
    const z = SHUTTER.z + k * SHUTTER.step;
    extrude(part.geo('blade'), part.geo('blade'), { outer: outline }, z, z + SHUTTER.thickness);
    shaft(part.geo('steel'), 'z', [P[0], P[1], 0], [[0.42, z - 0.01], [0.42, z + SHUTTER.thickness + 0.01]], { segments: 14 });
    parts.push(part);
  }
  // The iris is set to the rest stop.
  make(IRIS, 'iris_blade', irisAngle(STOPS[STOPS.length - 1]), irisAngle(STOPS[REST.stop]), 'iris');
  return parts;
}

export function buildLens() {
  return [...cellParts(), ...bladeParts()];
}
