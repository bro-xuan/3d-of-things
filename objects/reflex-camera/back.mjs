// The film magazine of the generated reflex camera, after the Hasselblad A12: a box that hangs
// on the back of the body, with a dark slide in front of the film so it can come off mid-roll.
// Inside, an insert that slides out to the left carries the pressure plate, two rollers and the
// 120 spools; the film runs up from the supply spool at the bottom, round the lower roller, flat
// across the picture, round the upper roller and onto the take-up spool. The body's last gear
// reaches through the back of the body into the magazine's gears, which wind the take-up spool.
import { Geo, cw } from '../../scripts/kit/geometry.mjs';
import { box, plate, rect, revolve, ring, shaft, spur } from '../../scripts/kit/solids.mjs';
import { Part } from '../../scripts/kit/parts.mjs';
import { fromGeo, pick, solidify, centroid } from '../../scripts/kit/surgery.mjs';
import { FILM_WIDTH, MAGAZINE, PICTURE } from './layout.mjs';
import { face, flutes, openHoles, roundRect, roundedBox, sdRect } from '../../scripts/kit/shapes.mjs';
import { GEAR_X, TRAIN } from './body.mjs';

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const M = MAGAZINE;

function toGeo(mesh) {
  const g = new Geo();
  g.positions = [...mesh.positions];
  g.normals = [...mesh.normals];
  g.uvs = [...mesh.uvs];
  g.indices = [...mesh.indices];
  return g;
}

/** The film's rolls: full on the supply spool at frame 1, a few turns of paper on the take-up spool. */
export const ROLLS = { supply: 11.8, takeUp: 6.7 };
/** The dark slide and the gate behind it only span this much across, so the gears beside them pass. */
const SLIDE_HALF = 36.2;
/** The frame counter: a wheel behind a window on the right side, one number per frame. */
export const COUNTER = { y: 4, z: -11, r: 5.2 };

/** The gears inside the magazine, in the same plane as the body's: the input meshes with the body's last gear. */
export const MAG_TRAIN = (() => {
  const m = TRAIN.module;
  const r = (teeth) => (m * teeth) / 2;
  const body = TRAIN.magazine;
  const input = { teeth: 14 };
  input.y = body.y;
  input.z = body.z - (body.r + r(input.teeth));
  const spool = { teeth: 24, y: M.takeUp.y, z: M.takeUp.z };
  const idler = { teeth: 16 };
  {
    const d1 = r(input.teeth) + r(idler.teeth);
    const d2 = r(spool.teeth) + r(idler.teeth);
    const dy = spool.y - input.y;
    const dz = spool.z - input.z;
    const D = Math.hypot(dy, dz);
    const a = (d1 * d1 - d2 * d2 + D * D) / (2 * D);
    const h = Math.sqrt(Math.max(0, d1 * d1 - a * a));
    idler.y = input.y + (a * dy) / D + (h * dz) / D;
    idler.z = input.z + (a * dz) / D - (h * dy) / D;
  }
  for (const g of [input, idler, spool]) g.r = r(g.teeth);
  return { input, idler, spool };
})();

/** The housing: a rounded box with its window, the slots for the dark slide, the body's hooks and gear, and the insert's opening. */
function housing() {
  const part = new Part('magazine');
  const outer = roundedBox(new Geo(), M.x, M.y, M.z, M.round, { segments: 6, flat: 2.4, uvSpan: 100 });
  let mesh = fromGeo(outer);
  const win = PICTURE / 2 + 0.6;
  const front = M.z[1];
  const slot = [M.slide.z - 0.3, M.slide.z + 0.3];
  const side = { y: [-40.5, 42.5], z: [-37.8, 0.8] };
  const g = TRAIN.magazine;
  const gx = (GEAR_X[0] + GEAR_X[1]) / 2;
  mesh = openHoles(mesh, [
    { axis: 'z', level: front, sdf: sdRect(0, 0, win, win) },
    // The body's hooks below, its catch above, and its gear on the right.
    { axis: 'z', level: front, sdf: sdRect(-30, -39.1, 3.4, 1.5) },
    { axis: 'z', level: front, sdf: sdRect(30, -39.1, 3.4, 1.5) },
    { axis: 'z', level: front, sdf: sdRect(0, 41.2, 7.4, 1.4) },
    { axis: 'z', level: front, sdf: sdRect(gx, g.y, (GEAR_X[1] - GEAR_X[0]) / 2 + 0.6, g.r + 1.8) },
    { axis: 'y', level: M.y[1], sdf: sdRect(0, M.slide.z, SLIDE_HALF + 0.4, (slot[1] - slot[0]) / 2) },
    { axis: 'x', level: M.x[1], sdf: sdRect((side.y[0] + side.y[1]) / 2, (side.z[0] + side.z[1]) / 2, (side.y[1] - side.y[0]) / 2, (side.z[1] - side.z[0]) / 2) },
    { axis: 'x', level: M.x[0], sdf: sdRect(COUNTER.y, COUNTER.z, 2.7, 2.1) },
  ]);
  part.geo('chrome').append(toGeo(mesh));
  part.geo('blackInside').append(solidify(mesh, M.wall, { maxOffset: M.wall * 2 }));
  // The back: leatherette with a chrome clip for the end of the film's box.
  plate(part.geo('leather'), 'z', { outer: roundRect(0, 0.5, 80, 81, 2.5) }, M.z[0] - 0.45, M.z[0] + 0.05, { chamfer: 0.2 });
  plate(part.geo('chrome'), 'z', { outer: roundRect(0, 26, 34, 12, 1.4), holes: [cw(roundRect(0, 26.6, 30, 8.6, 0.8))] }, M.z[0] - 1.1, M.z[0] - 0.4, { chamfer: 0.2 });
  // The gate inside: the black frame the film lies against, with the window the picture's size, behind the slide.
  plate(part.geo('flock'), 'z', { outer: rect([-SLIDE_HALF, SLIDE_HALF], [-42.4, 44.4]), holes: [cw(rect([-PICTURE / 2, PICTURE / 2], [-PICTURE / 2, PICTURE / 2]))] }, 0.18, 1.55);
  // Rails the film's edges run on, either side of the window.
  for (const s of [-1, 1]) {
    const xs = s > 0 ? [PICTURE / 2 + 0.4, PICTURE / 2 + 2.6] : [-PICTURE / 2 - 2.6, -PICTURE / 2 - 0.4];
    box(part.geo('steel'), xs, [-31, 31], [0.08, 0.18], { axis: 'z' });
  }
  // The frame counter's window and the advance indicator, on the right side.
  plate(part.geo('chrome'), 'x', { outer: roundRect(COUNTER.z, COUNTER.y, 9, 7, 1.2), holes: [cw(roundRect(COUNTER.z, COUNTER.y, 5.4, 4.2, 0.6))] }, M.x[0] - 0.6, M.x[0] + 0.02, { chamfer: 0.15 });
  plate(part.geo('window'), 'x', { outer: roundRect(COUNTER.z, COUNTER.y, 5.6, 4.4, 0.6) }, M.x[0] - 0.3, M.x[0] - 0.1);
  plate(part.geo('chrome'), 'x', { outer: roundRect(-4.4, 34, 6, 5, 1), holes: [cw(roundRect(-4.4, 34, 3.4, 2.6, 0.5))] }, M.x[0] - 0.5, M.x[0] + 0.02, { chamfer: 0.12 });
  plate(part.geo('red'), 'x', { outer: roundRect(-4.4, 34, 3.6, 2.8, 0.5) }, M.x[0] - 0.25, M.x[0] - 0.05);
  // Posts for the gears and the counter, on the inside of the right wall.
  for (const q of [MAG_TRAIN.input, MAG_TRAIN.idler]) shaft(part.geo('steel'), 'x', [0, q.y, q.z], [[0.8, M.x[0] + M.wall - 0.05], [0.8, GEAR_X[1] + 0.6]], { segments: 12 });
  return part;
}

/** The magazine's gears: the input, turned by the body, and an idler to the take-up spool's drive. */
function gears() {
  const parts = [];
  for (const [name, g] of [['magazine_input', MAG_TRAIN.input], ['magazine_idler', MAG_TRAIN.idler], ['spool_drive', MAG_TRAIN.spool]]) {
    const part = new Part(name, { parent: 'magazine' });
    spur(part.geo('brass'), 'x', [0, g.y, g.z], { teeth: g.teeth, module: TRAIN.module, hub: 1.7, bore: 0.8 }, GEAR_X[0], GEAR_X[1]);
    if (name === 'spool_drive') {
      // A dog that takes the take-up spool's slotted end.
      shaft(part.geo('steel'), 'x', [0, g.y, g.z], [[1.6, GEAR_X[1]], [1.6, -33.6]], { segments: 16 });
      box(part.geo('steel'), [-33.6, -32.4], [g.y - 2.4, g.y + 2.4], [g.z - 0.5, g.z + 0.5], { axis: 'x' });
      shaft(part.geo('steel'), 'x', [0, g.y, g.z], [[0.8, M.x[0] + M.wall - 0.05], [0.8, GEAR_X[0]]], { segments: 12 });
    }
    parts.push(part);
  }
  // The frame counter's wheel, with its numbers on its face behind the window.
  const counter = new Part('frame_counter', { parent: 'magazine' });
  const c = [0, COUNTER.y - COUNTER.r, COUNTER.z];
  revolve(counter.geo('black'), 'x', c, [[0, -41.9], [7.4, -41.9], [7.4, -41.3], [0, -41.3]], { segments: 48 });
  face(counter.geo('counterDial'), 'x', c, 2.2, 7.4, -41.92, -1, { segments: 96 });
  shaft(counter.geo('steel'), 'x', c, [[0.7, -41.3], [0.7, M.x[0] + M.wall - 0.05]], { segments: 10 });
  parts.push(counter);
  return parts;
}

/** The crank on the right side, for winding the film to the first frame when loading. */
function crank() {
  const part = new Part('magazine_crank', { parent: 'magazine' });
  const at = [0, 22, -22];
  const x0 = M.x[0];
  revolve(part.geo('chrome'), 'x', at, [[0, x0 - 2.2], [7.4, x0 - 2.2], [8.0, x0 - 1.6], [8.0, x0 + 0.1], [0, x0 + 0.1]], { segments: 48 });
  plate(part.geo('chrome'), 'x', { outer: flutes(8.4, 0.35, 36, { a: at[2], b: at[1] }) }, x0 - 2.0, x0 - 0.2);
  // The arm folded down across its face, and its knob.
  plate(part.geo('chrome'), 'x', { outer: roundRect(at[2], at[1] - 7, 5, 16, 2.5) }, x0 - 3.6, x0 - 2.2, { chamfer: 0.35 });
  shaft(part.geo('black'), 'x', [0, at[1] - 13, at[2]], [[2.0, x0 - 3.6], [2.3, x0 - 5.2], [1.9, x0 - 7.2], [0.01, x0 - 7.4]], { segments: 20 });
  return part;
}

/** The dark slide: a thin steel sheet in front of the film, its handle above the magazine. */
function darkSlide() {
  const part = new Part('dark_slide', { parent: 'magazine' });
  const z = M.slide.z;
  const t = M.slide.thick;
  plate(part.geo('steel'), 'z', { outer: rect([-SLIDE_HALF, SLIDE_HALF], [-41.6, M.y[1] + 0.6]) }, z - t / 2, z + t / 2);
  // The handle: a black grip along the top.
  box(part.geo('plastic'), [-SLIDE_HALF + 2, SLIDE_HALF - 2], [M.y[1] + 0.6, M.y[1] + 4.6], [z - 1.1, z + 1.1], { axis: 'z', round: 0.9 });
  return part;
}

/**
 * The film's path as [y, z] points: off the supply roll, down round the back and under the lower
 * roller, up the picture (z = 0), over the upper roller and down onto the take-up roll. It wraps
 * every roll and roller the same way round (clockwise seen from the right, angles measured from
 * +y toward +z decreasing), so each straight run is a tangent with both circles on its right.
 */
export const FILM_PATH = (() => {
  const { rollers: R, supply, takeUp } = M;
  const rF = R.r + 0.06;
  const pts = [];
  const at = (c, r, a) => [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
  const arc = (c, r, a0, a1, step = 3 * DEG) => {
    const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / step));
    for (let i = 0; i <= n; i++) pts.push(at(c, r, a0 + ((a1 - a0) * i) / n));
  };
  // The run from circle 1 to circle 2 with both on its right: the normal toward the centres, m, has m·(C2 - C1) = r2 - r1.
  const run = (c1, r1, c2, r2, pick) => {
    const D = [c2[0] - c1[0], c2[1] - c1[1]];
    const d = Math.hypot(...D);
    const phi = Math.atan2(D[1], D[0]);
    const g = Math.acos((r2 - r1) / d);
    const options = [phi + g, phi - g].map((mAngle) => {
      const a = mAngle + Math.PI;
      return { a, p1: at(c1, r1, a), p2: at(c2, r2, a) };
    });
    return options.sort(pick)[0];
  };
  const S = [supply.y, supply.z];
  const L = [-R.y, R.z];
  const U = [R.y, R.z];
  const T = [takeUp.y, takeUp.z];
  const norm = (a) => ((a % TAU) + TAU) % TAU;
  const low = run(S, ROLLS.supply, L, rF, (p, q) => p.p2[1] - q.p2[1]);
  arc(S, ROLLS.supply, low.a + 0.55, low.a);
  let a0 = norm(low.a);
  let a1 = Math.PI / 2;
  if (a1 > a0) a1 -= TAU;
  arc(L, rF, a0, a1);
  const high = run(U, rF, T, ROLLS.takeUp, (p, q) => p.p1[1] - q.p1[1]);
  a0 = Math.PI / 2;
  a1 = norm(high.a);
  if (a1 > a0) a1 -= TAU;
  arc(U, rF, a0, a1);
  arc(T, ROLLS.takeUp, high.a, high.a - 0.55);
  return pts;
})();

/** The path's length (mm), and how far along it the picture's middle is. */
export const FILM_LENGTH = FILM_PATH.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - FILM_PATH[i - 1][0], p[1] - FILM_PATH[i - 1][1]) : 0), 0);

/** A thin sheet along a [y, z] path, `width` across x: its front face (the side the path's left normal points to) and its back. */
function sheet(front, back, path, width, thick) {
  const n = path.length;
  const len = [0];
  for (let i = 1; i < n; i++) len.push(len[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  const total = len[n - 1];
  const normal = (i) => {
    const a = path[Math.max(0, i - 1)];
    const b = path[Math.min(n - 1, i + 1)];
    const t = [b[0] - a[0], b[1] - a[1]];
    const l = Math.hypot(...t) || 1;
    return [-t[1] / l, t[0] / l];
  };
  for (const [geo, side] of [[front, 1], [back, -1]]) {
    const ids = [];
    for (let i = 0; i < n; i++) {
      const [ny, nz] = normal(i);
      const [y, z] = path[i];
      const o = (side * thick) / 2;
      for (const x of [-width / 2, width / 2]) ids.push(geo.vertex([x, y + ny * o, z + nz * o], [0, ny * side, nz * side], [len[i] / total, x < 0 ? 1 : 0]));
    }
    for (let i = 0; i < n - 1; i++) {
      const [a, b, c, d] = [ids[i * 2], ids[i * 2 + 1], ids[(i + 1) * 2 + 1], ids[(i + 1) * 2]];
      geo.tri(a, b, c, [0, normal(i)[0] * side, normal(i)[1] * side]);
      geo.tri(a, c, d, [0, normal(i)[0] * side, normal(i)[1] * side]);
    }
  }
  return total;
}

/** The insert: its end plate with the key, the pressure plate, the rollers, the spools and the film. */
function insert() {
  const parts = [];
  const part = new Part('insert', { parent: 'magazine' });
  // The end plate that closes the left side, with the folding key that locks it in.
  plate(part.geo('chrome'), 'x', { outer: roundRect(-18.7, 1, 38.0, 82.8, 2) }, M.x[1] - M.wall + 0.05, M.x[1], { chamfer: 0.3 });
  revolve(part.geo('chrome'), 'x', [0, 1, -19], [[0, M.x[1]], [7.2, M.x[1]], [7.2, M.x[1] + 0.9], [6.4, M.x[1] + 1.5], [0, M.x[1] + 1.5]], { segments: 48 });
  plate(part.geo('chrome'), 'x', { outer: roundRect(-19, 1, 3.2, 12, 1.4) }, M.x[1] + 1.5, M.x[1] + 2.9, { chamfer: 0.3 });
  // Side frames carrying the rollers and the spools, either side of the film.
  for (const s of [-1, 1]) {
    const x0 = s * 32.6;
    const x1 = s * 33.4;
    const outline = roundRect(-19.4, 1, 36.4, 82.2, 3);
    const holes = [M.supply, M.takeUp].map((q) => cw(ring(2.6, q.z, q.y)));
    plate(part.geo('black'), 'x', { outer: outline, holes }, Math.min(x0, x1), Math.max(x0, x1));
  }
  // The pressure plate, which holds the film flat against the gate.
  plate(part.geo('chrome'), 'z', { outer: roundRect(0, 0, 62, 63, 1.5) }, M.pressure.z[0], M.pressure.z[1], { chamfer: 0.2 });
  box(part.geo('black'), [-32.6, 32.6], [-4, 4], [-6, M.pressure.z[0]], { axis: 'z' });
  // The rollers.
  for (const y of [-M.rollers.y, M.rollers.y]) {
    shaft(part.geo('chrome'), 'x', [0, y, M.rollers.z], [[M.rollers.r, -31.4], [M.rollers.r, 31.4]], { segments: 40 });
    shaft(part.geo('steel'), 'x', [0, y, M.rollers.z], [[1.0, -32.7], [1.0, 32.7]], { segments: 14 });
  }
  parts.push(part);

  // The spools: 120 spools with their rolls of film and backing paper.
  for (const [name, q, roll] of [['supply_spool', M.supply, ROLLS.supply], ['take_up_spool', M.takeUp, ROLLS.takeUp]]) {
    const spool = new Part(name, { parent: 'insert' });
    const at = [0, q.y, q.z];
    const { core, flange, half } = M.spool;
    for (const s of [-1, 1]) {
      const x = [s * (half - 0.6), s * half].sort((a, b) => a - b);
      revolve(spool.geo('plastic'), 'x', at, [[0, x[0]], [flange, x[0]], [flange, x[1]], [0, x[1]]], { segments: 64 });
    }
    shaft(spool.geo('plastic'), 'x', at, [[core, -half + 0.6], [core, half - 0.6]], { segments: 32 });
    // The roll: paper outside, a thin film edge showing at each end.
    revolve(spool.geo('paper'), 'x', at, [[core, -FILM_WIDTH / 2], [roll, -FILM_WIDTH / 2], [roll, FILM_WIDTH / 2], [core, FILM_WIDTH / 2]], { segments: 64 });
    // The ends' slots, and the pins of the frames they turn on.
    for (const s of [-1, 1]) shaft(spool.geo('steel'), 'x', at, [[1.3, s * half], [1.3, s * 33.5]], { segments: 14 });
    parts.push(spool);
  }

  // The film: emulsion toward the lens, paper behind.
  const film = new Part('film', { parent: 'insert' });
  sheet(film.geo('film'), film.geo('paperBack'), FILM_PATH, FILM_WIDTH, 0.12);
  parts.push(film);
  return parts;
}

export function buildMagazine() {
  return [housing(), ...gears(), crank(), darkSlide(), ...insert()];
}
