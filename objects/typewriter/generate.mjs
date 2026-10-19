// Build step for the typewriter (content/typewriter.json → build.generate): an Underwood Standard No. 5, built whole in
// code from the layout in layout.mjs (Underwood's numbers are in TRUTH.md). Millimetres, x to the typist's right, y up,
// z towards the typist.
//
// What hangs together: 42 keys on levers pivoted at the back; each lever pulls its sublever down by a wire, the sublever
// pulls a link, the link pulls the heel of a type bar, and the bar swings up out of the basket through its slot in the
// segment until its slug hits the ribbon onto the paper at the printing point P. Near the end of the swing the heel lifts
// the universal bar, which tips the rocker of the escapement at the back: its two dogs let the 16-tooth star wheel turn
// one tooth, and with it the pinion that runs in the carriage's rack. The carriage is drawn to the left all the time by
// the drawband from the mainspring drum. The word's keys (and their sublevers, links and type bars) are nodes of their
// own, so the content can move them; the other 35 sit in their group's node.
import sharp from 'sharp';
import { geometry, solids, shapes, Part, assemble, modelSpace, runChecks } from '../../scripts/kit/index.mjs';
import { L, U, DEG, KEYS, P, Q, NP, UP, STRIKE, SWING, HEIGHT, UB_H, add, sub, mul, cross, unit, turn, plane, inPlane, chain } from './layout.mjs';

const { Geo } = geometry;
const { box, plate, rect, shaft } = solids;
const TAU = Math.PI * 2;
const WORD = U.word;
const LETTERS = [...new Set(WORD)];

/** Pairs that touch by design. */
export const CONTACTS = [
  ['keys', 'frame'], ['key_*', 'frame'], ['key_*', 'keys'],
  ['sublevers', 'frame'], ['sublever_*', 'frame'], ['sublever_*', 'sublevers'], ['link_*', 'sublevers'], ['link_*', 'sublever_*'],
  ['sublevers', 'keys'], ['sublevers', 'key_*'], ['sublever_*', 'key_*'], ['sublever_*', 'keys'],
  ['sublevers', 'type_bars'], ['sublevers', 'type_bar_*'], ['link_*', 'type_bar_*'], ['link_*', 'type_bars'], ['link_*', 'segment'], ['sublevers', 'segment'],
  ['type_bars', 'segment'], ['type_bar_*', 'segment'], ['type_bar_*', 'type_bars'], ['type_bars', 'frame'], ['type_bar_*', 'frame'],
  ['segment', 'frame'], ['universal_bar', 'frame'], ['universal_bar', 'rocker'], ['rocker', 'frame'], ['rocker', 'escape_wheel'],
  ['escape_wheel', 'frame'], ['escape_wheel', 'rack'], ['carriage', 'frame'], ['carriage', 'rack'], ['carriage', 'platen'], ['carriage', 'drawband'],
  ['platen', 'paper'], ['paper', 'carriage'], ['paper', 'ribbon*'], ['paper', 'ribbon_guide'], ['platen', 'ribbon*'], ['ink_*', 'paper'], ['ink_*', 'platen'],
  ['drawband', 'mainspring'], ['drawband', 'mainspring_drum'], ['mainspring', 'frame'], ['mainspring_drum', 'mainspring'],
  ['ribbon', 'frame'], ['ribbon_*', 'ribbon'], ['ribbon_*', 'ribbon_guide'], ['ribbon_guide', 'ribbon'], ['ribbon_guide', 'frame'],
];

// ---------------------------------------------------------------- helpers

/** A local mesh moved into the object's frame: local x, y, z along ex, ey, ez from `origin`. */
function placed(geo, local, origin, ex, ey, ez) {
  geo.append(local, (p, n) => [
    [0, 1, 2].map((k) => origin[k] + p[0] * ex[k] + p[1] * ey[k] + p[2] * ez[k]),
    [0, 1, 2].map((k) => n[0] * ex[k] + n[1] * ey[k] + n[2] * ez[k]),
  ]);
  return geo;
}
/** A box of half-sizes `h` centred on `c`, along ex, ey, ez (unit, square to each other, right-handed). */
function obox(geo, c, ex, ey, ez, h, round = 0) {
  const local = new Geo();
  box(local, [-h[0], h[0]], [-h[1], h[1]], [-h[2], h[2]], { round, axis: 'z' });
  return placed(geo, local, c, ex, ey, ez);
}
/** A rod between two points. */
const rod = (geo, a, b, r, segments = 10) => shapes.tube(geo, [a, b], r, { segments });
/** A bar swept round the segment's vertical axis: r0..r1 out, h0..h1 up, from phi0 to phi1. */
function arcBar(geo, phi0, phi1, [r0, r1], [h0, h1], n = 48) {
  const ring = [];
  const corners = [[r0, h0], [r1, h0], [r1, h1], [r0, h1]];
  const normals = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  for (let i = 0; i <= n; i++) {
    const phi = phi0 + ((phi1 - phi0) * i) / n;
    const out = [Math.sin(phi), 0, Math.cos(phi)];
    const vec = ([a, b]) => add(mul(out, a), [0, b, 0]);
    // Each corner twice, once for each face it bounds, so the edges stay sharp.
    ring.push(corners.map(([r, h], k) => [geo.vertex(inPlane(phi, r, h), vec(normals[k])), geo.vertex(inPlane(phi, r, h), vec(normals[(k + 3) % 4]))]));
  }
  const mid = (i) => inPlane(phi0 + ((phi1 - phi0) * i) / n, (r0 + r1) / 2, (h0 + h1) / 2);
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < 4; k++) {
      const k1 = (k + 1) % 4;
      const ids = [ring[i][k][0], ring[i + 1][k][0], ring[i + 1][k1][1], ring[i][k1][1]];
      const p = geo.positions.slice(ids[0] * 3, ids[0] * 3 + 3);
      const facing = sub(p, mid(i));
      geo.tri(ids[0], ids[1], ids[2], facing);
      geo.tri(ids[0], ids[2], ids[3], facing);
    }
  }
  for (const [i, dir] of [[0, -1], [n, 1]]) {
    const phi = phi0 + ((phi1 - phi0) * i) / n;
    const t = mul([Math.cos(phi), 0, -Math.sin(phi)], dir * Math.sign(phi1 - phi0));
    const ids = corners.map(([r, h]) => geo.vertex(inPlane(phi, r, h), t));
    geo.tri(ids[0], ids[1], ids[2], t);
    geo.tri(ids[0], ids[2], ids[3], t);
  }
  return geo;
}
/** A flat disc facing +y at height y, its uvs mapped into cell [u0, v0, u1, v1] of a texture. */
function disc(geo, [cx, y, cz], r, [u0, v0, u1, v1], n = 28) {
  const centre = geo.vertex([cx, y, cz], [0, 1, 0], [(u0 + u1) / 2, (v0 + v1) / 2]);
  const ids = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const [x, z] = [Math.cos(a), Math.sin(a)];
    ids.push(geo.vertex([cx + r * x, y, cz + r * z], [0, 1, 0], [u0 + ((x + 1) / 2) * (u1 - u0), v0 + ((z + 1) / 2) * (v1 - v0)]));
  }
  for (let i = 0; i < n; i++) geo.tri(centre, ids[(i + 1) % n], ids[i], [0, 1, 0]);
}
/** A flat quad with uvs, corners a b c d going round. */
function quad(geo, [a, b, c, d], normal, [u0, v0, u1, v1]) {
  const ids = [[a, [u0, v1]], [b, [u1, v1]], [c, [u1, v0]], [d, [u0, v0]]].map(([p, uv]) => geo.vertex(p, normal, uv));
  geo.tri(ids[0], ids[1], ids[2], normal);
  geo.tri(ids[0], ids[2], ids[3], normal);
}

// ---------------------------------------------------------------- textures

const CELL = 64;
const LEGEND_COLS = 8;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
/** Key legends: white on black under the keys' glass, one cell a key. */
async function legends() {
  const rows = Math.ceil(KEYS.length / LEGEND_COLS);
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${LEGEND_COLS * CELL}" height="${rows * CELL}"><rect width="100%" height="100%" fill="#101010"/>`;
  KEYS.forEach((key, i) => {
    const [cx, cy] = [(i % LEGEND_COLS) * CELL + CELL / 2, Math.floor(i / LEGEND_COLS) * CELL + CELL / 2];
    svg += `<circle cx="${cx}" cy="${cy}" r="${CELL * 0.43}" fill="none" stroke="#e9e4d8" stroke-width="2"/>`;
    svg += `<text x="${cx}" y="${cy + 1}" font-family="Helvetica Neue, Helvetica, Arial" font-size="30" font-weight="600" fill="#f2eee4" text-anchor="middle" dominant-baseline="middle">${esc(key.ch.toUpperCase())}</text>`;
  });
  return sharp(Buffer.from(`${svg}</svg>`)).png().toBuffer();
}
/** The typed word, one cell a letter: type-black on the paper's colour. */
async function typed() {
  const [w, h] = [48, 64];
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * WORD.length}" height="${h}"><rect width="100%" height="100%" fill="#f1ede2"/>`;
  [...WORD].forEach((ch, i) => {
    svg += `<text x="${i * w + w / 2}" y="${h * 0.56}" font-family="Courier New, Courier, monospace" font-size="54" font-weight="700" fill="#1b1a1c" text-anchor="middle" dominant-baseline="middle">${esc(ch)}</text>`;
  });
  return sharp(Buffer.from(`${svg}</svg>`)).png().toBuffer();
}
/** A key's cell in the legend texture. */
function cellOf(key) {
  const i = KEYS.indexOf(key);
  const rows = Math.ceil(KEYS.length / LEGEND_COLS);
  const [c, r] = [i % LEGEND_COLS, Math.floor(i / LEGEND_COLS)];
  return [c / LEGEND_COLS, r / rows, (c + 1) / LEGEND_COLS, (r + 1) / rows];
}

// ---------------------------------------------------------------- the type action, key by key

const X = [1, 0, 0];
const Y = [0, 1, 0];
const Z = [0, 0, 1];

/** A key: its lever from the fulcrum to the key, the stem, the glass-topped key, and the wire up to the sublever. */
function keyInto(part, key) {
  const { lever, fulcrum, thick, top } = L.keys;
  plate(part.geo('steel'), 'x', { outer: [[fulcrum[1] - 4, lever[0]], [key.z + 3, lever[0] + 3], [key.z + 3, lever[1] + 5], [key.z - 6, lever[1] + 5], [fulcrum[1] - 4, lever[1]]] }, key.x - thick / 2, key.x + thick / 2);
  shaft(part.geo('steel'), 'y', [key.x, 0, key.z], [[1.1, lever[1] + 4], [1.1, key.y - 2.6]]);
  shaft(part.geo('nickel'), 'y', [key.x, 0, key.z], [[top - 0.7, key.y - 3.2], [top, key.y - 2.6], [top, key.y - 0.4], [top - 0.5, key.y]]);
  disc(part.geo('legend'), [key.x, key.y - 0.25, key.z], top - 0.75, cellOf(key));
  shaft(part.geo('steel'), 'y', [key.x, 0, L.sub.wire], [[0.6, lever[1] - 0.5], [0.6, L.sub.y[0] + 0.5]]);
}

/** A sublever: a flat lever from its rod at F back to where the link hangs. */
function subleverInto(part, key) {
  const { F, A, y } = L.sub;
  plate(part.geo('steel'), 'x', { outer: rect([A - 3, F[1] + 4], y, 2) }, key.x - 0.8, key.x + 0.8);
}

/** A link: a wire from the sublever's end up to the bar's heel, straight up for its last few mm (through the slot). */
function linkInto(part, key) {
  const { A, B } = chain(key, 0);
  shapes.tube(part.geo('steel'), [A, add(B, [0, -9, 0]), B], 0.5, { segments: 8 });
}

/** A type bar at rest: the bar from its heel to its end, and the slug, set so its face meets the paper square. */
function barInto(part, key) {
  const { out, axis } = plane(key.phi);
  const O = inPlane(key.phi, U.segmentR, 0);
  const t0 = U.rest * DEG;
  const along = add(mul(out, Math.cos(t0)), mul(Y, Math.sin(t0)));
  const across = add(mul(out, -Math.sin(t0)), mul(Y, Math.cos(t0)));
  const { depth, thick, end, slug } = L.bar;
  obox(part.geo('steel'), add(O, mul(along, (end - U.heel) / 2)), along, across, axis, [(end + U.heel) / 2, depth / 2, thick / 2]);
  // The slug, built where it is at the strike (its lower-case letter on the printing point) and turned back down.
  const back = (p) => turn(p, unit(axis), -SWING * DEG, O);
  const face = add(add(Q, mul(NP, L.platen.r + 0.25 + L.ribbon.out)), mul(UP, slug[1] / 2 - 1.4));
  const c = add(face, mul(NP, slug[2] / 2));
  const local = new Geo();
  box(local, [-slug[0] / 2, slug[0] / 2], [-slug[1] / 2, slug[1] / 2], [-slug[2] / 2, slug[2] / 2], { round: 0.4, axis: 'z' });
  const [ex, ey, ez] = [X, UP, NP].map((v) => sub(back(v), back([0, 0, 0])));
  placed(part.geo('nickel'), local, back(c), ex, ey, ez);
  rod(part.geo('steel'), add(O, mul(along, end)), back(add(c, mul(NP, slug[2] / 2 - 0.3))), 0.7, 8);
}

/** A ribbon strip through sections ({ at, across, normal }), 0.25 mm thick: black over red, as two-colour ribbon was. */
function ribbonStrip(part, sections, halfW) {
  for (const [key, v0, v1] of [['ribbon', 0, halfW], ['ribbon_red', -halfW, 0]]) {
    const g = part.geo(key);
    for (const side of [1, -1]) {
      const ids = sections.map(({ at, across, normal }) => {
        const off = mul(normal, (side * 0.25) / 2);
        return [g.vertex(add(add(at, mul(across, v0)), off), mul(normal, side)), g.vertex(add(add(at, mul(across, v1)), off), mul(normal, side))];
      });
      for (let i = 0; i < ids.length - 1; i++) {
        const facing = mul(sections[i].normal, side);
        g.tri(ids[i][0], ids[i + 1][0], ids[i + 1][1], facing);
        g.tri(ids[i][0], ids[i + 1][1], ids[i][1], facing);
      }
    }
  }
}

/** The ribbon's centre at rest (lowered below the printing point) and lifted (in front of it). */
export const RIBBON = (() => {
  const lifted = add(Q, mul(NP, L.platen.r + 0.25 + L.ribbon.out - 0.15));
  return { lifted, rest: sub(lifted, mul(UP, L.ribbon.lift)) };
})();

export function buildParts() {
  const parts = [];
  const make = (name, opts) => {
    const part = new Part(name, opts);
    parts.push(part);
    return part;
  };
  const [sx0, sx1] = L.frame.side;
  const [bz0, bz1] = L.frame.back;
  const [ry, rz] = L.rocker.pivot;
  const [spx, spz, spr] = L.ribbon.spool;
  const [dx, dz] = L.drum.at;

  // ------------------------------------------------ frame
  const frame = make('frame');
  const fg = frame.geo('enamel');
  plate(fg, 'y', { outer: rect([-sx1, sx1], [bz0, L.frame.front[1]], 10), holes: [solids.hole(rect([-sx0, sx0], [bz1, L.frame.front[0]], 6))] }, 6, 14);
  for (const fx of [-sx1 + 12, sx1 - 12]) for (const fz of [bz0 + 12, L.frame.front[1] - 12]) shaft(frame.geo('rubber'), 'y', [fx, 0, fz], [[8, 0], [9, 2], [9, 6]]);
  // Sides: low at the keyboard, high at the back where the carriage rides.
  const sideOutline = [[150, 14], [150, 45], [60, 55], [-10, 112], [-20, 150], [-62, 150], [-80, 145], [bz0, 145], [bz0, 14]];
  for (const s of [-1, 1]) plate(fg, 'x', { outer: sideOutline }, ...[s * sx0, s * sx1].sort((a, b) => a - b));
  box(fg, [-sx0, sx0], [14, 48], L.frame.front, { round: 3, axis: 'x' });
  box(fg, [-sx0, sx0], [14, 110], [bz0, bz1], { axis: 'x' });
  box(frame.geo('nickel'), [-sx0, sx0], L.rail.y, L.rail.z, { round: 1.5, axis: 'x' });
  // Fulcrum rods: the keys' at the back, the sublevers' under the basket.
  shaft(frame.geo('steel'), 'x', [0, L.keys.fulcrum[0], L.keys.fulcrum[1]], [[1.5, -sx0], [1.5, sx0]]);
  shaft(frame.geo('steel'), 'x', [0, L.sub.F[0], L.sub.F[1]], [[1.4, -sx0], [1.4, sx0]]);
  // The type bar rest: a felt pad on an arc under the bars' heads, on two posts.
  arcBar(frame.geo('felt'), -88 * DEG, 88 * DEG, L.pad.r, [-11.8, -8.82]);
  for (const s of [-1, 1]) {
    const foot = inPlane(s * 88 * DEG, (L.pad.r[0] + L.pad.r[1]) / 2, -11.8);
    shaft(fg, 'y', [foot[0], 0, foot[2]], [[2.5, 14], [2.5, foot[1] + 0.2]]);
  }
  // The escapement's bracket on the back plate, with the rocker's rod in two lugs and the wheel's bearing.
  box(fg, [-20, 20], [98, 146], [-142, -139], { round: 2, axis: 'z' });
  box(fg, [-12, 12], [98, 110], [bz1, -142], { axis: 'z' });
  for (const [a, b] of [[6, 10], [-10, -6]]) box(fg, [a, b], [ry - 4, ry + 4], [rz - 4, -139], { axis: 'z' });
  shaft(frame.geo('steel'), 'x', [0, ry, rz], [[1.2, -10], [1.2, 10]]);
  shaft(frame.geo('nickel'), 'z', [L.wheel.at[0], L.wheel.at[1], 0], [[3, -139], [3, -137.5]]);
  // Spool cups on brackets from the sides.
  for (const s of [-1, 1]) {
    box(fg, s > 0 ? [spx, sx0] : [-sx0, -spx], [145, 150], [spz - 6, spz + 6], { round: 1, axis: 'y' });
    shaft(frame.geo('nickel'), 'y', [s * spx, 0, spz], [[spr + 2, 150], [spr + 2, 160], [spr - 1, 161]]);
  }
  // The segment's brackets back to the back plate.
  for (const s of [-1, 1]) box(fg, s > 0 ? [56, 60] : [-60, -56], [93, 99], [bz1, -72], { axis: 'x' });

  // ------------------------------------------------ keys
  const keys = make('keys');
  for (const key of KEYS) keyInto(LETTERS.includes(key.id) ? make(`key_${key.id}`, { parent: 'keys' }) : keys, key);
  // The space bar on two arms back to the fulcrum, outside the key levers.
  box(keys.geo('steel'), [-80, 80], [43, 48], [151, 157], { round: 2, axis: 'y' });
  for (const s of [-1, 1]) {
    plate(keys.geo('steel'), 'x', { outer: [[L.keys.fulcrum[1] - 4, 18], [152, 40], [156, 44], [156, 47], [151, 46], [L.keys.fulcrum[1] - 4, 24]] }, s * 108 - 0.8, s * 108 + 0.8);
  }

  // ------------------------------------------------ sublevers and links
  const subs = make('sublevers');
  for (const key of KEYS) {
    const mine = LETTERS.includes(key.id);
    subleverInto(mine ? make(`sublever_${key.id}`, { parent: 'sublevers' }) : subs, key);
    linkInto(mine ? make(`link_${key.id}`, { parent: 'sublevers' }) : subs, key);
  }

  // ------------------------------------------------ type bars and segment
  const bars = make('type_bars');
  for (const key of KEYS) barInto(LETTERS.includes(key.id) ? make(`type_bar_${key.id}`, { parent: 'type_bars' }) : bars, key);

  const segment = make('segment');
  const step = (L.arc / (KEYS.length - 1)) * DEG;
  const half = (L.segment.fin / 2) * DEG;
  const start = (-L.arc / 2) * DEG;
  for (let k = 0; k <= KEYS.length; k++) {
    const phi = start + (k - 0.5) * step;
    arcBar(segment.geo('nickel'), phi - half, phi + half, L.segment.r, L.segment.h, 1);
  }
  const ends = [start - step, -start + step];
  arcBar(segment.geo('nickel'), ...ends, L.segment.rim, L.segment.h, 64);
  shapes.tube(bars.geo('steel'), Array.from({ length: 65 }, (_, i) => inPlane(ends[0] + ((ends[1] - ends[0]) * i) / 64, U.segmentR, 0)), L.segment.wire, { segments: 8 });
  for (const s of [-1, 1]) box(segment.geo('nickel'), s > 0 ? [56, 60] : [-60, -56], [L.C[1] - 6, L.C[1] + 5], [-72, -66], { axis: 'x' });

  // ------------------------------------------------ escapement
  const ub = make('universal_bar');
  const ubh = [UB_H + 0.2, UB_H + 0.2 + (L.ub.h[1] - L.ub.h[0])];
  arcBar(ub.geo('steel'), -88 * DEG, 88 * DEG, L.ub.r, ubh, 64);
  const arm = (L.ub.r[0] + L.ub.r[1]) / 2;
  const yArm = [L.C[1] + ubh[0], L.C[1] + ubh[1]];
  const armX = arm * Math.sin(88 * DEG);
  for (const s of [-1, 1]) {
    const endAt = inPlane(s * 88 * DEG, arm, 0);
    box(ub.geo('steel'), [s * armX - 1.5, s * armX + 1.5], yArm, [L.ub.back - 2, endAt[2] + 1], { axis: 'z' });
  }
  box(ub.geo('steel'), [-armX - 1.5, armX + 1.5], yArm, [L.ub.back - 2, L.ub.back + 2], { axis: 'z' });
  box(ub.geo('steel'), [-2, 2], yArm, [rz + L.rocker.arm - 1, L.ub.back - 2], { axis: 'z' });
  box(ub.geo('steel'), [-2, 2], [yArm[0], ry - 1.5], [rz + L.rocker.arm - 1, rz + L.rocker.arm + 1], { axis: 'z' });

  const rocker = make('rocker');
  const rg = rocker.geo('steel');
  const wz = L.wheel.z;
  const dogTop = L.wheel.at[1] - L.wheel.r + 2.5;
  shaft(rg, 'x', [0, ry, rz], [[3, -5], [3, 5]], { bore: 1.2 });
  box(rg, [-2, 2], [ry - 1.5, ry + 1.5], [rz + 2.5, rz + L.rocker.arm + 1], { axis: 'z' });
  box(rg, [-3, 3], [ry + 2.5, dogTop - 3], [wz[1] + 0.1, wz[1] + 1.4], { axis: 'z' });
  box(rocker.geo('nickel'), [0.05, 1.25], [dogTop - 3, dogTop], [wz[1] + 0.1, wz[1] + 1.4], { axis: 'z' });
  box(rocker.geo('nickel'), [-0.6, 0.6], [dogTop - 3, dogTop], [wz[0] + 0.2, wz[1] + 0.1], { axis: 'z' });

  const wheel = make('escape_wheel');
  const [wx, wy] = L.wheel.at;
  // A ratchet star: each tooth slopes up to its point and drops square on its leading face (the side it turns to).
  const pitch = TAU / L.pinion.teeth;
  const lead = 267.2 * DEG;
  const star = [];
  for (let k = 0; k < L.pinion.teeth; k++) {
    const a = lead + k * pitch;
    for (const [r, da] of [[L.wheel.root, -0.7 * pitch], [L.wheel.r, -0.05], [L.wheel.r, 0], [L.wheel.root, 0]]) star.push([wx + r * Math.cos(a + da), wy + r * Math.sin(a + da)]);
  }
  const spokes = [0, 1, 2, 3].map((k) => solids.hole(geometry.circle(2.6, wx + 6.5 * Math.cos((k * Math.PI) / 2 + 0.4), wy + 6.5 * Math.sin((k * Math.PI) / 2 + 0.4), 20)));
  plate(wheel.geo('brass'), 'z', { outer: star, holes: spokes }, ...wz);
  solids.spur(wheel.geo('steel'), 'z', [wx, wy, 0], { teeth: L.pinion.teeth, module: L.pinion.module, phase: pitch / 2 }, ...L.pinion.z);
  shaft(wheel.geo('steel'), 'z', [wx, wy, 0], [[1.5, -139], [1.5, wz[0]], [2.5, wz[0]], [2.5, L.pinion.z[1] + 0.6]]);

  // ------------------------------------------------ carriage
  const carriage = make('carriage');
  const cg = carriage.geo('enamel');
  const [p0, p1] = L.carriage.plate;
  for (const s of [-1, 1]) {
    const xs = s > 0 ? [p0, p1] : [-p1, -p0];
    const [cz0, cz1] = L.carriage.z;
    const [cy0, cy1] = L.carriage.y;
    const w = L.platen.axle + 0.4;
    const slot = Array.from({ length: 13 }, (_, i) => {
      const a = Math.PI + (i / 12) * Math.PI;
      return [Q[2] - w * Math.cos(a), Q[1] + w * Math.sin(a)];
    });
    plate(cg, 'x', { outer: [[cz0, cy0], [cz1, cy0], [cz1, cy1 - 14], [cz1 - 14, cy1], [Q[2] + w, cy1], ...slot, [Q[2] - w, cy1], [cz0, cy1]] }, ...xs);
    // A hanger down past the rail at the back.
    box(cg, xs, [113, L.carriage.y[0] + 2], [-125, -121], { axis: 'x' });
  }
  box(carriage.geo('nickel'), [-p1, p1], [L.rail.y[1], L.carriage.y[0]], [L.rail.z[0] + 2, L.rail.z[1] - 4], { round: 1, axis: 'x' });
  // The stud the drawband hooks on.
  box(carriage.geo('nickel'), [p0, p1], [L.band.y[0] + 2, L.band.y[1] - 2], [L.band.z + 0.15, L.carriage.z[0] + 0.5], { axis: 'z' });
  // The paper table behind the platen, along the paper's back run.
  const g0 = L.paper.from * DEG;
  const tableDir = [0, -Math.cos(g0), Math.sin(g0)];
  const b0 = add(Q, [0, (L.paper.r[1] + 1.4) * Math.sin(g0), (L.paper.r[1] + 1.4) * Math.cos(g0)]);
  const t0 = add(b0, mul(tableDir, 4));
  const t1 = add(b0, mul(tableDir, L.paper.back - 8));
  obox(cg, mul(add(t0, t1), 0.5), X, tableDir, unit(cross(X, tableDir)), [L.paper.x - 14, Math.hypot(...sub(t1, t0)) / 2, 0.8]);
  // The carriage return lever, out to the left and forward.
  const lever = [[-p1, Q[1] + 18, L.carriage.z[1] - 6], [-p1 - 16, Q[1] + 24, L.carriage.z[1] + 10], [-p1 - 28, Q[1] + 28, L.carriage.z[1] + 34]];
  shapes.tube(carriage.geo('nickel'), lever, 2.2, { segments: 12 });
  shaft(carriage.geo('rubber'), 'x', [0, lever[2][1], lever[2][2]], [[4, lever[2][0] - 12], [5, lever[2][0] - 8], [5, lever[2][0] - 2], [4, lever[2][0] + 1]]);

  const platen = make('platen', { parent: 'carriage' });
  const px = L.platen.x;
  shaft(platen.geo('rubber'), 'x', [0, Q[1], Q[2]], [[L.platen.r - 0.8, -px], [L.platen.r, -px + 1.2], [L.platen.r, px - 1.2], [L.platen.r - 0.8, px]], { segments: 72 });
  shaft(platen.geo('nickel'), 'x', [0, Q[1], Q[2]], [[L.platen.axle, -p1 - 2], [L.platen.axle, p1 + 2]]);
  const [k0, k1, kr] = L.platen.knob;
  const ridged = shapes.flutes(kr, 0.6, 30);
  for (const s of [-1, 1]) {
    plate(platen.geo('rubber'), 'x', { outer: ridged.map(([a, b]) => [Q[2] + a, Q[1] + b]) }, ...[s * (k0 + 2), s * (k1 - 2)].sort((a, b) => a - b), { chamfer: 1.2, chamferBottom: 1.2 });
    shaft(platen.geo('nickel'), 'x', [0, Q[1], Q[2]], s < 0 ? [[6, -k0 - 2.01], [6, -p1 - 2]] : [[6, p1 + 2], [6, k0 + 2.01]]);
  }
  // The line-space ratchet on the left end: 33 teeth, one a line.
  solids.spur(platen.geo('nickel'), 'x', [0, Q[1], Q[2]], { teeth: 33, module: 1.3, phase: 0 }, -px - 0.1, -px + 1.6);

  // ------------------------------------------------ paper and ink
  const paper = make('paper', { parent: 'platen' });
  const [pr0, pr1] = L.paper.r;
  const g1 = L.paper.to * DEG;
  const tangentAt = (g) => [0, Math.cos(g), -Math.sin(g)];
  const onPlaten = (g, r) => add(Q, [0, r * Math.sin(g), r * Math.cos(g)]);
  const pathAt = (r) => [
    add(onPlaten(g0, r), mul(tangentAt(g0), -L.paper.back)),
    ...Array.from({ length: 61 }, (_, i) => onPlaten(g0 + ((g1 - g0) * i) / 60, r)),
    add(onPlaten(g1, r), mul(tangentAt(g1), L.paper.top)),
  ];
  const outline = [...pathAt(pr1), ...pathAt(pr0).reverse()].map((p) => [p[2], p[1]]);
  plate(paper.geo('paper'), 'x', { outer: outline }, -L.paper.x, L.paper.x, { crease: 50 });
  for (let n = 0; n < WORD.length; n++) {
    const ink = make(`ink_${n}`, { parent: 'paper' });
    const c = add(add(Q, mul(NP, L.ink.r[0])), [n * U.pitch, 0, 0]);
    const [hx, hy] = [U.pitch / 2, L.ink.h * 0.66];
    const corners = [[-hx, -hy], [hx, -hy], [hx, hy], [-hx, hy]].map(([a, b]) => add(add(c, mul(X, a)), mul(UP, b)));
    quad(ink.geo('ink'), corners, NP, [n / WORD.length, 0, (n + 1) / WORD.length, 1]);
  }

  const rack = make('rack', { parent: 'carriage' });
  const m = L.pinion.module;
  const [rxa, rxb] = [-L.rack.x, L.rack.x];
  const root = L.rack.y + 1.45 * m;
  const teeth = [[rxb, root], [rxb, L.rack.y + 4.5], [rxa, L.rack.y + 4.5], [rxa, root]];
  for (let k = Math.ceil(rxa / U.pitch + 0.5); k * U.pitch <= rxb - U.pitch / 2; k++) {
    const x = k * U.pitch;
    const w = 0.25 * U.pitch;
    teeth.push([x - w - 0.3 * m, root], [x - w * 0.5, L.rack.y - 1.3 * m], [x + w * 0.5, L.rack.y - 1.3 * m], [x + w + 0.3 * m, root]);
  }
  plate(rack.geo('steel'), 'z', { outer: teeth }, ...L.rack.z);

  const band = make('drawband', { parent: 'carriage' });
  box(band.geo('band'), [dx, L.band.hook + 1.5], L.band.y, [L.band.z - 0.15, L.band.z + 0.15], { axis: 'z' });

  // ------------------------------------------------ mainspring
  const spring = make('mainspring');
  const [dy0, dy1] = L.drum.y;
  const cup = spring.geo('enamel');
  shaft(cup, 'y', [dx, 0, dz], [[L.drum.cup, dy0], [L.drum.cup, dy1 - 2]], { bore: L.drum.cup - 1.6, segments: 64 });
  shaft(cup, 'y', [dx, 0, dz], [[L.drum.cup - 1.5, dy0 - 2], [L.drum.cup - 1.5, dy0]], { segments: 64 });
  shaft(cup, 'y', [dx, 0, dz], [[L.drum.cup, dy1 - 2], [L.drum.cup, dy1]], { bore: L.drum.barrel + 0.6, segments: 64 });
  // Its bracket to the frame's back corner.
  box(cup, [dx + 10, -sx0], [dy0 - 5, dy0 - 2], [dz - 4, dz + 4], { axis: 'x' });
  box(cup, [-sx1, -sx0], [110, dy0 - 2], [bz0, bz0 + 4], { axis: 'x' });
  box(cup, [-sx1, -sx0], [dy0 - 5, dy0 - 2], [dz - 4, bz0 + 4], { axis: 'x' });
  const drum = make('mainspring_drum', { parent: 'mainspring' });
  shaft(drum.geo('brass'), 'y', [dx, 0, dz], [[L.drum.barrel, dy0 + 1], [L.drum.barrel, dy1 + 0.5]], { segments: 64 });
  solids.spur(drum.geo('nickel'), 'y', [dx, 0, dz], { teeth: 24, module: 1, phase: 0 }, dy1 + 0.5, dy1 + 3);
  shaft(drum.geo('nickel'), 'y', [dx, 0, dz], [[5, dy1 + 3], [4, dy1 + 8]]);
  for (let k = 0; k < 3; k++) {
    const a = (k * TAU) / 3;
    obox(drum.geo('enamel'), [dx + 11 * Math.cos(a), dy1 + 0.75, dz + 11 * Math.sin(a)], [Math.cos(a), 0, Math.sin(a)], Y, [-Math.sin(a), 0, Math.cos(a)].map((v) => -v), [6, 0.25, 1.2]);
  }

  // ------------------------------------------------ ribbon
  const ribbon = make('ribbon');
  const halfW = L.ribbon.width / 2;
  const spoolY = [RIBBON.rest[1] - halfW - 2.5, RIBBON.rest[1] + halfW + 2.5];
  for (const s of [-1, 1]) {
    shaft(ribbon.geo('nickel'), 'y', [s * spx, 0, spz], [[spr, spoolY[0]], [spr, spoolY[0] + 1], [6, spoolY[0] + 1], [6, spoolY[1] - 1], [spr, spoolY[1] - 1], [spr, spoolY[1]]]);
    shaft(ribbon.geo('ribbon'), 'y', [s * spx, 0, spz], [[spr - 2, spoolY[0] + 1.05], [spr - 2, spoolY[1] - 1.05]], { bore: 6.05 });
    shaft(ribbon.geo('nickel'), 'y', [s * spx, 0, spz], [[2, 161], [2, spoolY[0]]]);
  }
  const centre = make('ribbon_centre', { parent: 'ribbon' });
  ribbonStrip(centre, [-1, -0.5, 0, 0.5, 1].map((t) => ({ at: add(RIBBON.rest, [t * L.ribbon.centre, 0, 0]), across: UP, normal: NP })), halfW);
  for (const s of [-1, 1]) {
    const run = make(s < 0 ? 'ribbon_left' : 'ribbon_right', { parent: 'ribbon' });
    const end = add(RIBBON.rest, [s * L.ribbon.centre, 0, 0]);
    const tan = [s * spx, end[1], spz - spr + 2];
    const sections = Array.from({ length: 13 }, (_, i) => {
      const t = i / 12;
      const k = t * t * (3 - 2 * t);
      return { at: add(mul(end, 1 - t), mul(tan, t)), across: unit(add(mul(UP, 1 - k), mul(Y, k))), normal: unit(add(mul(NP, 1 - k), mul(Z, k))) };
    });
    ribbonStrip(run, s < 0 ? sections.reverse() : sections, halfW);
  }

  const guide = make('ribbon_guide');
  const gg = guide.geo('nickel');
  // A thin plate in front of the ribbon with a window the type strikes through, on an arm out to the right.
  const at = (x, y) => add(add(add(RIBBON.rest, mul(NP, 0.9)), mul(X, x)), mul(UP, y));
  for (const [cx, cy, hx, hy] of [[-12.5, 0, 6.5, 8.5], [12.5, 0, 6.5, 8.5], [0, -6.5, 6, 2], [0, 6.5, 6, 2]]) obox(gg, at(cx, cy), X, UP, NP, [hx, hy, 0.35]);
  const armA = at(18.5, -5);
  const armB = add(armA, [44, 0, 0]);
  shapes.tube(gg, [armA, armB, add(armB, mul(UP, -34))], 1.1, { segments: 8 });

  return parts;
}

export default async function generate({ data, check = true, log = console.log } = {}) {
  const parts = buildParts();
  const legendPng = await legends();
  const inkPng = await typed();
  const { doc, scene, nodes, pieces, parentOf } = await assemble({
    name: 'typewriter',
    parts,
    materials: (doc, { material, textured }) => ({
      enamel: material('typewriter_enamel', '#151515', 0.25, 0.32),
      nickel: material('typewriter_nickel', '#c9ccd0', 1, 0.24),
      steel: material('typewriter_steel', '#8e9398', 1, 0.42),
      brass: material('typewriter_brass', '#c7a253', 1, 0.34),
      rubber: material('typewriter_rubber', '#1e1e1f', 0, 0.78),
      felt: material('typewriter_felt', '#5a4b3c', 0, 0.95),
      paper: material('typewriter_paper', '#f1ede2', 0, 0.92),
      band: material('typewriter_band', '#9a7b52', 0.3, 0.6),
      ribbon: material('typewriter_ribbon', '#1d1b1c', 0, 0.9),
      ribbon_red: material('typewriter_ribbon_red', '#8c2420', 0, 0.9),
      legend: textured('typewriter_legends', legendPng, 0, 0.15),
      ink: textured('typewriter_ink', inkPng, 0, 0.92),
    }),
  });
  const { toModel, space, mmPerUnit, realSize } = modelSpace(scene);
  runChecks({ label: 'typewriter', pieces, contacts: CONTACTS, data, parentOf, mmPerUnit, check, log });
  log(`  typewriter: ${nodes.size} nodes, ${realSize.join(' × ')} mm`);
  return { doc, hints: hints(toModel, space) };
}

/** Everything the content places, in model space: pivots, axes and the strokes' points. */
function hints(toModel, space) {
  const keys = {};
  for (const id of LETTERS) {
    const key = KEYS.find((k) => k.id === id);
    keys[id] = {
      keyPivot: toModel([key.x, ...L.keys.fulcrum]),
      subPivot: toModel([key.x, ...L.sub.F]),
      barPivot: toModel(inPlane(key.phi, U.segmentR, 0)),
      barAxis: plane(key.phi).axis.map((v) => +v.toFixed(6)),
      linkPivot: toModel(chain(key, 0).A),
      top: toModel([key.x, key.y + 1, key.z]),
    };
  }
  const [dx, dz] = L.drum.at;
  const [spx, spz, spr] = L.ribbon.spool;
  const rest = RIBBON.rest;
  return {
    space,
    word: WORD,
    keys,
    pivots: {
      rocker: toModel([0, ...L.rocker.pivot]),
      wheel: toModel([...L.wheel.at, -135]),
      drum: toModel([dx, 160, dz]),
      ribbon_left: toModel([-spx, rest[1], spz - spr + 2]),
      ribbon_right: toModel([spx, rest[1], spz - spr + 2]),
    },
    numbers: { ribbonRun: Math.hypot(spx - L.ribbon.centre, spz - spr + 2 - rest[2]), drum: L.drum.barrel, rockerArm: L.rocker.arm, teeth: L.pinion.teeth },
    anchors: {
      printing: toModel(P),
      paper: toModel(add(Q, [-30, L.paper.r[1] * Math.sin(L.paper.to * DEG) + 12, L.paper.r[1] * Math.cos(L.paper.to * DEG) - 10])),
      platen: toModel([90, Q[1] + L.platen.r * 0.7, Q[2] + L.platen.r * 0.7]),
      ribbon: toModel(add(rest, [-60, 0, 1])),
      guide: toModel(add(rest, [12.5, -6, 1.4])),
      spool: toModel([-spx, RIBBON.rest[1] + 9, spz]),
      segment: toModel(inPlane(-25 * DEG, L.segment.rim[1], 3)),
      ubar: toModel(inPlane(35 * DEG, L.ub.r[1], UB_H + 2)),
      rocker: toModel([3, L.rocker.pivot[0] + 4, L.rocker.pivot[1] + 2]),
      wheel: toModel([L.wheel.at[0] - 9.5, L.wheel.at[1] - 9.5, L.wheel.z[1] + 0.1]),
      rack: toModel([50, L.rack.y + 4.5, L.rack.z[1]]),
      band: toModel([-60, L.band.y[1], L.band.z]),
      drum: toModel([dx, L.drum.y[1] + 8, dz]),
      carriage: toModel([-L.carriage.plate[1] - 28, Q[1] + 28, L.carriage.z[1] + 34]),
      frame: toModel([L.frame.side[1], 90, 20]),
      keyboard: toModel([-40, 79, 100]),
      sublevers: toModel([-60, L.sub.y[1], 0]),
      bars: toModel(inPlane(-40 * DEG, 100, -2)),
    },
    check: { strike: +STRIKE.toFixed(3), swing: +SWING.toFixed(3), height: +HEIGHT.toFixed(3) },
  };
}
