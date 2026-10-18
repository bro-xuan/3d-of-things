// Mesh building blocks (the kit's `geometry`), first written for the generated watch movement.
//
// Everything is in millimetres in a part's local frame: x/y lie in the plane of
// the movement and z runs along the watch's axis, toward the dial. Loops are
// arrays of [x, y]; outer loops run anticlockwise and holes clockwise, so the
// outside of the solid is always on the right of the direction of travel.
import { ShapeUtils, Vector2 } from 'three';

const TAU = Math.PI * 2;

/** An indexed triangle mesh under construction. */
export class Geo {
  positions = [];
  normals = [];
  uvs = [];
  indices = [];

  get vertexCount() {
    return this.positions.length / 3;
  }

  vertex(p, n, uv = [0, 0]) {
    this.positions.push(p[0], p[1], p[2]);
    this.normals.push(n[0], n[1], n[2]);
    this.uvs.push(uv[0], uv[1]);
    return this.vertexCount - 1;
  }

  /** Adds a triangle, flipped if needed so it faces along `facing`. */
  tri(a, b, c, facing) {
    if (facing) {
      const P = this.positions;
      const u = [0, 1, 2].map((k) => P[b * 3 + k] - P[a * 3 + k]);
      const v = [0, 1, 2].map((k) => P[c * 3 + k] - P[a * 3 + k]);
      const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      if (n[0] * facing[0] + n[1] * facing[1] + n[2] * facing[2] < 0) [b, c] = [c, b];
    }
    this.indices.push(a, b, c);
  }

  /** Quad a-b-c-d, anticlockwise seen from the side it faces. */
  quad(a, b, c, d) {
    this.indices.push(a, b, c, a, c, d);
  }

  append(other, transform = identity) {
    const base = this.vertexCount;
    for (let i = 0; i < other.vertexCount; i++) {
      const [p, n] = transform(other.positions.slice(i * 3, i * 3 + 3), other.normals.slice(i * 3, i * 3 + 3));
      this.vertex(p, n, other.uvs.slice(i * 2, i * 2 + 2));
    }
    for (const index of other.indices) this.indices.push(base + index);
    return this;
  }

  get isEmpty() {
    return this.indices.length === 0;
  }
}

const identity = (p, n) => [p, n];

// ------------------------------------------------------------------ transforms

/** Rotation about z by `angle`, then a translation. */
export function place([tx, ty, tz] = [0, 0, 0], angle = 0) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return (p, n) => [
    [p[0] * c - p[1] * s + tx, p[0] * s + p[1] * c + ty, p[2] + tz],
    [n[0] * c - n[1] * s, n[0] * s + n[1] * c, n[2]],
  ];
}

/** Maps a part built along +z onto an arbitrary axis (unit vector), then translates. */
export function alongAxis(axis, origin = [0, 0, 0], spin = 0) {
  const z = normalize(axis);
  const helper = Math.abs(z[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  let x = normalize(cross(helper, z));
  let y = cross(z, x);
  if (spin) {
    const c = Math.cos(spin);
    const s = Math.sin(spin);
    [x, y] = [add(scale(x, c), scale(y, s)), add(scale(y, c), scale(x, -s))];
  }
  const map = (v) => [x[0] * v[0] + y[0] * v[1] + z[0] * v[2], x[1] * v[0] + y[1] * v[1] + z[1] * v[2], x[2] * v[0] + y[2] * v[1] + z[2] * v[2]];
  return (p, n) => [add(map(p), origin), map(n)];
}

export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export function normalize(v) {
  const l = Math.hypot(...v) || 1;
  return v.map((x) => x / l);
}

// ------------------------------------------------------------------ 2D helpers

export function signedArea(loop) {
  let a = 0;
  for (let i = 0; i < loop.length; i++) {
    const [x0, y0] = loop[i];
    const [x1, y1] = loop[(i + 1) % loop.length];
    a += x0 * y1 - x1 * y0;
  }
  return a / 2;
}

export const ccw = (loop) => (signedArea(loop) < 0 ? [...loop].reverse() : loop);
export const cw = (loop) => (signedArea(loop) > 0 ? [...loop].reverse() : loop);

export function circle(r, cx = 0, cy = 0, segments = Math.max(24, Math.ceil(r * 40))) {
  return Array.from({ length: segments }, (_, i) => [cx + r * Math.cos((i / segments) * TAU), cy + r * Math.sin((i / segments) * TAU)]);
}

export function pointInLoop([x, y], loop) {
  let inside = false;
  for (let i = 0, j = loop.length - 1; i < loop.length; j = i++) {
    const [xi, yi] = loop[i];
    const [xj, yj] = loop[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Outward (solid-side right-hand) unit normals of each edge i → i+1. */
function edgeNormals(loop) {
  return loop.map(([x0, y0], i) => {
    const [x1, y1] = loop[(i + 1) % loop.length];
    const l = Math.hypot(x1 - x0, y1 - y0) || 1;
    return [(y1 - y0) / l, -(x1 - x0) / l];
  });
}

/** Per point: the normal arriving and leaving (equal unless the corner is sharper than `crease`). */
function pointNormals(loop, crease) {
  const e = edgeNormals(loop);
  const cosCrease = Math.cos((crease * Math.PI) / 180);
  return loop.map((_, i) => {
    const a = e[(i - 1 + loop.length) % loop.length];
    const b = e[i];
    if (a[0] * b[0] + a[1] * b[1] < cosCrease) return { split: true, in: a, out: b };
    const m = normalize([a[0] + b[0], a[1] + b[1], 0]);
    return { split: false, in: [m[0], m[1]], out: [m[0], m[1]] };
  });
}

/** Moves every point of a loop inward (toward the solid) by d along its smoothed normal. */
export function inset(loop, d) {
  const e = edgeNormals(loop);
  return loop.map(([x, y], i) => {
    const a = e[(i - 1 + loop.length) % loop.length];
    const b = e[i];
    const m = [a[0] + b[0], a[1] + b[1]];
    const dot = (m[0] * b[0] + m[1] * b[1]) || 1;
    // Mitre: keep both edges d away, but don't let sharp corners shoot off.
    const k = Math.min(d / dot, d * 3);
    return [x - m[0] * k, y - m[1] * k];
  });
}

// --------------------------------------------------------------------- extrude

/**
 * Extrudes shapes ({ outer, holes }) between z0 and z1. Caps go to `caps`, side walls and
 * chamfers to `sides`, so the two can carry different finishes (a striped bridge top with
 * polished edges). `chamfer` bevels the top edge at 45°, `chamferBottom` the bottom; the
 * bevels go to `bevels` if given (a mirror-polished anglage beside satin walls).
 */
export function extrude(caps, sides, shapes, z0, z1, opts = {}) {
  const { top = true, bottom = true, chamfer = 0, chamferBottom = 0, crease = 35, uv = ([x, y]) => [x, y], bevels = sides } = opts;
  for (const shape of [].concat(shapes)) {
    const loops = [ccw(shape.outer), ...(shape.holes ?? []).map(cw)];
    const topLoops = chamfer ? loops.map((l) => inset(l, chamfer)) : loops;
    const bottomLoops = chamferBottom ? loops.map((l) => inset(l, chamferBottom)) : loops;
    if (top) cap(caps, topLoops, z1, 1, uv);
    if (bottom) cap(caps, bottomLoops, z0, -1, uv);
    for (let k = 0; k < loops.length; k++) {
      const wallTop = z1 - chamfer;
      const wallBottom = z0 + chamferBottom;
      wall(sides, loops[k], wallBottom, wallTop, crease);
      if (chamfer) bevel(bevels, loops[k], topLoops[k], wallTop, z1, crease, 1);
      if (chamferBottom) bevel(bevels, loops[k], bottomLoops[k], wallBottom, z0, crease, -1);
    }
  }
}

function cap(geo, loops, z, dir, uv) {
  const contour = loops[0].map(([x, y]) => new Vector2(x, y));
  const holes = loops.slice(1).map((l) => l.map(([x, y]) => new Vector2(x, y)));
  // triangulateShape may drop a repeated end point, so read the points back after it.
  const faces = ShapeUtils.triangulateShape(contour, holes);
  const base = geo.vertexCount;
  for (const p of [contour, ...holes].flat()) geo.vertex([p.x, p.y, z], [0, 0, dir], uv([p.x, p.y]));
  for (const [a, b, c] of faces) geo.tri(base + a, base + b, base + c, [0, 0, dir]);
}

function wall(geo, loop, z0, z1, crease) {
  const normals = pointNormals(loop, crease);
  const n = loop.length;
  const arc = [0];
  for (let k = 1; k < n; k++) arc.push(arc[k - 1] + Math.hypot(loop[k][0] - loop[k - 1][0], loop[k][1] - loop[k - 1][1]));
  // Each point gets one vertex pair if smooth, two if it's a crease.
  const ids = loop.map((p, i) => {
    const { split, in: a, out: b } = normals[i];
    const s = arc[i];
    const make = (m) => [geo.vertex([p[0], p[1], z0], [m[0], m[1], 0], [s, z0]), geo.vertex([p[0], p[1], z1], [m[0], m[1], 0], [s, z1])];
    const out = make(b);
    return { in: split ? make(a) : out, out };
  });
  for (let i = 0; i < n; i++) {
    const [a0, a1] = ids[i].out;
    const [b0, b1] = ids[(i + 1) % n].in;
    geo.quad(a0, b0, b1, a1);
  }
}

function bevel(geo, outerLoop, innerLoop, zOuter, zInner, crease, dir) {
  const normals = pointNormals(outerLoop, crease);
  const n = outerLoop.length;
  const ids = outerLoop.map((p, i) => {
    const q = innerLoop[i];
    const { split, in: a, out: b } = normals[i];
    const make = (m) => {
      const nn = normalize([m[0], m[1], dir]);
      return [geo.vertex([p[0], p[1], zOuter], nn), geo.vertex([q[0], q[1], zInner], nn)];
    };
    const out = make(b);
    return { in: split ? make(a) : out, out };
  });
  for (let i = 0; i < n; i++) {
    const [a0, a1] = ids[i].out;
    const [b0, b1] = ids[(i + 1) % n].in;
    if (dir > 0) geo.quad(a0, b0, b1, a1);
    else geo.quad(a0, a1, b1, b0);
  }
}

/** A flat cap only (a sink floor, a hole bottom): shapes at height z facing dir (±1). */
export function flat(geo, shapes, z, dir, uv = ([x, y]) => [x, y]) {
  for (const shape of [].concat(shapes)) cap(geo, [ccw(shape.outer), ...(shape.holes ?? []).map(cw)], z, dir, uv);
}

// ----------------------------------------------------------------------- lathe

/**
 * Revolves a profile of [r, z] points about the z axis. The profile runs around the
 * section with the outside on its right: a solid cylinder is (0,z0) (R,z0) (R,z1) (0,z1).
 */
export function lathe(geo, profile, { segments = 48, crease = 40, start = 0, length = TAU } = {}) {
  profile = profile.filter((p, i) => i === 0 || Math.hypot(p[0] - profile[i - 1][0], p[1] - profile[i - 1][1]) > 1e-6);
  const closed = length >= TAU - 1e-9;
  const cols = closed ? segments : segments + 1;
  const n = profile.length;
  // 2D normals per profile point, split at creases, like a wall.
  const e = profile.slice(0, -1).map(([r0, z0], i) => {
    const [r1, z1] = profile[i + 1];
    const l = Math.hypot(r1 - r0, z1 - z0) || 1;
    return [(z1 - z0) / l, -(r1 - r0) / l];
  });
  const cosCrease = Math.cos((crease * Math.PI) / 180);
  const rings = profile.map(([r, z], i) => {
    const a = e[i - 1];
    const b = e[i];
    const normalsAt = !a ? [b] : !b ? [a] : a[0] * b[0] + a[1] * b[1] < cosCrease ? [a, b] : [normalize([a[0] + b[0], a[1] + b[1], 0])];
    return normalsAt.map((m) => {
      const ids = [];
      for (let j = 0; j < cols; j++) {
        const phi = start + (j / segments) * length;
        const c = Math.cos(phi);
        const s = Math.sin(phi);
        ids.push(geo.vertex([r * c, r * s, z], [m[0] * c, m[0] * s, m[1]], [j / segments, i / (n - 1)]));
      }
      return ids;
    });
  });
  for (let i = 0; i < n - 1; i++) {
    const lower = rings[i][rings[i].length - 1];
    const upper = rings[i + 1][0];
    for (let j = 0; j < segments; j++) {
      const j1 = closed ? (j + 1) % segments : j + 1;
      geo.quad(lower[j], lower[j1], upper[j1], upper[j]);
    }
  }
}

/** A plain cylinder (or tube, with `inner`) from z0 to z1. */
export function cylinder(geo, r, z0, z1, { inner = 0, segments } = {}) {
  if (z0 > z1) [z0, z1] = [z1, z0];
  segments ??= Math.max(16, Math.min(96, Math.ceil(r * 28)));
  const profile = inner > 0 ? [[inner, z1], [inner, z0], [r, z0], [r, z1], [inner, z1]] : [[0, z0], [r, z0], [r, z1], [0, z1]];
  lathe(geo, profile, { segments });
}

/**
 * A turned part (arbor, staff, pipe) from a list of [radius, z] stations along its
 * length, in either order. Radius 0 at an end closes it; otherwise `bore` leaves a hole.
 */
export function turned(geo, stations, { bore = 0, segments = 24 } = {}) {
  const s = [...stations].sort((a, b) => a[1] - b[1]);
  const z0 = s[0][1];
  const z1 = s[s.length - 1][1];
  const outer = s.map(([r, z]) => [Math.max(r, bore), z]);
  const profile = bore > 0 ? [[bore, z1], [bore, z0], ...outer, [bore, z1]] : [[0, z0], ...outer, [0, z1]];
  lathe(geo, profile, { segments });
}

// ---------------------------------------------------------------------- ribbon

/**
 * A flat strip of rectangular section swept along a centreline in the plane (a hairspring,
 * a mainspring). `width` is across the path, the strip spans z0..z1. uv.x is the fraction
 * of the length from the start.
 */
export function ribbon(geo, path, width, z0, z1) {
  const n = path.length;
  const lengths = [0];
  for (let i = 1; i < n; i++) lengths.push(lengths[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  const total = lengths[n - 1] || 1;
  const side = path.map(([x, y], i) => {
    const [xa, ya] = path[Math.max(0, i - 1)];
    const [xb, yb] = path[Math.min(n - 1, i + 1)];
    const l = Math.hypot(xb - xa, yb - ya) || 1;
    return [(yb - ya) / l, -(xb - xa) / l];
  });
  const edge = (i, k) => [path[i][0] + side[i][0] * k * (width / 2), path[i][1] + side[i][1] * k * (width / 2)];
  const strip = (k, z, normal, flip) => {
    const ids = [];
    for (let i = 0; i < n; i++) {
      const [x, y] = edge(i, k);
      ids.push(geo.vertex([x, y, z], normal(i), [lengths[i] / total, 0]));
    }
    return ids;
  };
  // Four faces, each with its own vertices so the edges stay crisp.
  const faces = [
    [strip(1, z0, (i) => [side[i][0], side[i][1], 0]), strip(1, z1, (i) => [side[i][0], side[i][1], 0])],
    [strip(-1, z1, (i) => [-side[i][0], -side[i][1], 0]), strip(-1, z0, (i) => [-side[i][0], -side[i][1], 0])],
    [strip(1, z1, () => [0, 0, 1]), strip(-1, z1, () => [0, 0, 1])],
    [strip(-1, z0, () => [0, 0, -1]), strip(1, z0, () => [0, 0, -1])],
  ];
  for (const [a, b] of faces) for (let i = 0; i < n - 1; i++) geo.quad(a[i], a[i + 1], b[i + 1], b[i]);
  // End caps.
  for (const [i, dir] of [[0, -1], [n - 1, 1]]) {
    const [tx, ty] = [path[Math.min(n - 1, i + 1)][0] - path[Math.max(0, i - 1)][0], path[Math.min(n - 1, i + 1)][1] - path[Math.max(0, i - 1)][1]];
    const t = normalize([tx * dir, ty * dir, 0]);
    const corners = [edge(i, 1), edge(i, -1)];
    const ids = [
      geo.vertex([...corners[0], z0], t), geo.vertex([...corners[1], z0], t),
      geo.vertex([...corners[1], z1], t), geo.vertex([...corners[0], z1], t),
    ];
    geo.tri(ids[0], ids[1], ids[2], t);
    geo.tri(ids[0], ids[2], ids[3], t);
  }
}

/** Archimedean spiral centreline from radius r0 to r1 over `turns`, starting at angle a0, turning anticlockwise. */
export function spiral(r0, r1, turns, a0 = 0, step = 0.08) {
  const points = [];
  const total = turns * TAU;
  // Sample by arc length so coils stay smooth at every radius.
  let a = 0;
  while (a <= total) {
    const r = r0 + ((r1 - r0) * a) / total;
    points.push([r * Math.cos(a0 + a), r * Math.sin(a0 + a)]);
    a += step / Math.max(r, 0.3);
  }
  const r = r1;
  points.push([r * Math.cos(a0 + total), r * Math.sin(a0 + total)]);
  return points;
}

// -------------------------------------------------------------- SDF → outlines

/**
 * Traces the zero contour of a signed distance function (negative inside) and
 * returns shapes ready to extrude: [{ outer, holes }]. Points are snapped onto the
 * true contour and resampled evenly, so smooth unions come out as clean curves.
 */
export function contours(sdf, { min, max }, cell = 0.05, spacing = Math.max(0.03, cell * 1.8)) {
  const [x0, y0] = min;
  const nx = Math.ceil((max[0] - x0) / cell) + 3;
  const ny = Math.ceil((max[1] - y0) / cell) + 3;
  const ox = x0 - cell;
  const oy = y0 - cell;
  const values = new Float64Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) values[j * nx + i] = sdf([ox + i * cell, oy + j * cell]);
  // Pad the border so every contour closes.
  for (let i = 0; i < nx; i++) values[i] = values[(ny - 1) * nx + i] = Math.max(values[i], cell);
  for (let j = 0; j < ny; j++) values[j * nx] = values[j * nx + nx - 1] = Math.max(values[j * nx], cell);

  const v = (i, j) => values[j * nx + i];
  const point = (key) => {
    const [kind, i, j] = key;
    const a = v(i, j);
    const b = kind === 'h' ? v(i + 1, j) : v(i, j + 1);
    const t = a / (a - b);
    return kind === 'h' ? [ox + (i + t) * cell, oy + j * cell] : [ox + i * cell, oy + (j + t) * cell];
  };
  const id = ([kind, i, j]) => (kind === 'h' ? 0 : 1) + 2 * (i + j * nx);
  const keys = new Map();
  const links = new Map();
  const link = (a, b) => {
    for (const k of [a, b]) keys.set(id(k), k);
    const ia = id(a);
    const ib = id(b);
    links.set(ia, [...(links.get(ia) ?? []), ib]);
    links.set(ib, [...(links.get(ib) ?? []), ia]);
  };
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const c = [v(i, j) < 0, v(i + 1, j) < 0, v(i + 1, j + 1) < 0, v(i, j + 1) < 0];
      const code = c[0] | (c[1] << 1) | (c[2] << 2) | (c[3] << 3);
      if (code === 0 || code === 15) continue;
      const bottom = ['h', i, j];
      const right = ['v', i + 1, j];
      const topE = ['h', i, j + 1];
      const left = ['v', i, j];
      const centreInside = (v(i, j) + v(i + 1, j) + v(i + 1, j + 1) + v(i, j + 1)) / 4 < 0;
      switch (code) {
        case 1: case 14: link(left, bottom); break;
        case 2: case 13: link(bottom, right); break;
        case 3: case 12: link(left, right); break;
        case 4: case 11: link(right, topE); break;
        case 6: case 9: link(bottom, topE); break;
        case 7: case 8: link(left, topE); break;
        case 5:
          if (centreInside) { link(left, topE); link(bottom, right); } else { link(left, bottom); link(right, topE); }
          break;
        case 10:
          if (centreInside) { link(left, bottom); link(right, topE); } else { link(left, topE); link(bottom, right); }
          break;
      }
    }
  }
  // Walk the links into closed loops.
  const seen = new Set();
  const loops = [];
  for (const start of links.keys()) {
    if (seen.has(start)) continue;
    const loop = [];
    let prev = -1;
    let cur = start;
    while (!seen.has(cur)) {
      seen.add(cur);
      loop.push(point(keys.get(cur)));
      const next = (links.get(cur) ?? []).find((k) => k !== prev && !seen.has(k)) ?? (links.get(cur) ?? []).find((k) => k !== prev);
      prev = cur;
      cur = next;
      if (cur === undefined) break;
    }
    if (loop.length >= 6) loops.push(refine(loop, sdf, spacing, cell));
  }
  // Nesting decides outer vs hole.
  const info = loops.map((loop) => ({ loop, area: Math.abs(signedArea(loop)) }));
  const depth = info.map((a, i) => info.filter((b, k) => k !== i && b.area > a.area && pointInLoop(a.loop[0], b.loop)).length);
  const shapes = [];
  info.forEach((a, i) => {
    if (depth[i] % 2 === 0) shapes.push({ outer: ccw(a.loop), holes: [], area: a.area });
  });
  info.forEach((a, i) => {
    if (depth[i] % 2 === 0) return;
    const owner = shapes.filter((s) => s.area > a.area && pointInLoop(a.loop[0], s.outer)).sort((p, q) => p.area - q.area)[0];
    owner?.holes.push(cw(a.loop));
  });
  return shapes.map(({ outer, holes }) => ({ outer, holes }));
}

function project(p, sdf, h) {
  let [x, y] = p;
  for (let k = 0; k < 4; k++) {
    const d = sdf([x, y]);
    const gx = (sdf([x + h, y]) - sdf([x - h, y])) / (2 * h);
    const gy = (sdf([x, y + h]) - sdf([x, y - h])) / (2 * h);
    const g2 = gx * gx + gy * gy || 1;
    x -= (d * gx) / g2;
    y -= (d * gy) / g2;
  }
  return [x, y];
}

function refine(loop, sdf, spacing, cell) {
  const h = cell * 0.25;
  let pts = loop.map((p) => project(p, sdf, h));
  // Resample at even spacing along the curve, then snap again.
  const out = [];
  const n = pts.length;
  let carry = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let t = carry;
    while (t < len) {
      out.push([a[0] + ((b[0] - a[0]) * t) / len, a[1] + ((b[1] - a[1]) * t) / len]);
      t += spacing;
    }
    carry = t - len;
  }
  pts = out.map((p) => project(p, sdf, h));
  // Drop points that crowd their successor (the seam where resampling wraps round).
  return pts.filter((p, i) => {
    const q = pts[(i + 1) % pts.length];
    return Math.hypot(q[0] - p[0], q[1] - p[1]) > spacing * 0.3;
  });
}

// ------------------------------------------------------------- SDF primitives

export const sd = {
  circle: ([cx, cy], r) => ([x, y]) => Math.hypot(x - cx, y - cy) - r,
  /** A bar from a to b with rounded ends, radius r (or ra → rb, tapering). */
  capsule: ([ax, ay], [bx, by], ra, rb = ra) => ([x, y]) => {
    // Rounded cone (Inigo Quilez's uneven capsule), exact for ra ≠ rb.
    const px = x - ax;
    const py = y - ay;
    const dx = bx - ax;
    const dy = by - ay;
    const h = Math.hypot(dx, dy) || 1e-9;
    const ux = dx / h;
    const uy = dy / h;
    const qx = Math.abs(-uy * px + ux * py);
    const qy = ux * px + uy * py;
    const b = (ra - rb) / h;
    const a = Math.sqrt(Math.max(0, 1 - b * b));
    const k = qx * -b + qy * a; // dot(q, (-b, a))
    if (k < 0) return Math.hypot(qx, qy) - ra;
    if (k > a * h) return Math.hypot(qx, qy - h) - rb;
    return qx * a + qy * b - ra;
  },
  box: ([cx, cy], [hw, hh], angle = 0, round = 0) => ([x, y]) => {
    const c = Math.cos(-angle);
    const s = Math.sin(-angle);
    const lx = (x - cx) * c - (y - cy) * s;
    const ly = (x - cx) * s + (y - cy) * c;
    const qx = Math.abs(lx) - hw + round;
    const qy = Math.abs(ly) - hh + round;
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - round;
  },
  union: (...fs) => (p) => Math.min(...fs.map((f) => f(p))),
  /** Polynomial smooth minimum: unions with a fillet of size ~k. */
  smooth: (k, ...fs) => (p) => fs.map((f) => f(p)).reduce((a, b) => smin(a, b, k)),
  subtract: (f, ...cuts) => (p) => Math.max(f(p), ...cuts.map((g) => -g(p))),
  smoothSubtract: (k, f, ...cuts) => (p) => cuts.reduce((d, g) => -smin(-d, g(p), k), f(p)),
  intersect: (...fs) => (p) => Math.max(...fs.map((f) => f(p))),
};

export function smin(a, b, k) {
  if (k <= 0) return Math.min(a, b);
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - (h * h * k) / 4;
}
