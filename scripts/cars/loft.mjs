// A car's body as a loft: cross-sections along its length, each a smooth closed curve through a
// few key points (the underbody, the side at its widest, the beltline, the roof's edge, the roof)
// whose heights and half-widths follow profile curves given as (z, value) points. Millimetres in
// the car frame: z forward along the car, x to its left, y up from the ground; z = 0 is midway
// between the axles.
import { Geo } from '../watch/geometry.mjs';

/** Straight lines between (z, value) points, for a body of flat panels. */
export function lines(points) {
  const p = [...points].sort((a, b) => a[0] - b[0]);
  return (z) => {
    if (z <= p[0][0]) return p[0][1];
    if (z >= p[p.length - 1][0]) return p[p.length - 1][1];
    let i = 0;
    while (z > p[i + 1][0]) i++;
    const t = (z - p[i][0]) / (p[i + 1][0] - p[i][0] || 1);
    return p[i][1] + (p[i + 1][1] - p[i][1]) * t;
  };
}

/** Piecewise-smooth interpolation through (z, value) points (monotone cubic, so it never overshoots). */
export function curve(points) {
  const p = [...points].sort((a, b) => a[0] - b[0]);
  const n = p.length;
  const d = [];
  for (let i = 0; i < n - 1; i++) d.push((p[i + 1][1] - p[i][1]) / (p[i + 1][0] - p[i][0] || 1));
  // Fritsch–Carlson tangents.
  const m = p.map((_, i) => (i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return (z) => {
    if (z <= p[0][0]) return p[0][1];
    if (z >= p[n - 1][0]) return p[n - 1][1];
    let i = 0;
    while (z > p[i + 1][0]) i++;
    const h = p[i + 1][0] - p[i][0];
    const t = (z - p[i][0]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * p[i][1] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * p[i + 1][1] + (t3 - t2) * h * m[i + 1];
  };
}

/** Centripetal Catmull–Rom through 2D points, `per` samples a segment (or a list, one count per segment); the end points repeated as tangents. */
function catmull(points, per) {
  const out = [];
  const P = [points[0], ...points, points[points.length - 1]];
  const dist = (a, b) => Math.max(1e-6, Math.hypot(b[0] - a[0], b[1] - a[1]) ** 0.5);
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    const t0 = 0;
    const t1 = t0 + dist(p0, p1);
    const t2 = t1 + dist(p1, p2);
    const t3 = t2 + dist(p2, p3);
    const count = Array.isArray(per) ? per[i - 1] : per;
    for (let k = 0; k < count; k++) {
      const t = t1 + ((t2 - t1) * k) / count;
      const lerp = (a, b, ta, tb) => [0, 1].map((c) => ((tb - t) * a[c] + (t - ta) * b[c]) / (tb - ta));
      const A1 = lerp(p0, p1, t0, t1);
      const A2 = lerp(p1, p2, t1, t2);
      const A3 = lerp(p2, p3, t2, t3);
      const B1 = lerp(A1, A2, t0, t2);
      const B2 = lerp(A2, A3, t1, t3);
      out.push(lerp(B1, B2, t1, t2));
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

/**
 * The body's surface. `spec` gives, as (z, value) lists:
 * - `top`: the centreline's height (nose, bonnet, windscreen, roof, tail); `bottom`: the underside's;
 * - `width`: the half-width at the widest, `shoulder` the height of that point as a fraction from
 *   the bottom to the belt, `sill`: how far the sill is tucked in from it;
 * - `belt`: the beltline's height (the crease under the glass, the top of the doors and wings);
 * - `fender`: the height of the wings' crowns, which can stand above the bonnet (optional);
 * - `shoulderIn`: how far the top of the doors runs in from the side before the glass starts;
 * - `cabin`: the roof's half-width.
 * `length` is [rear, front] in z. Returns a Geo (uv: along the car 0..1, round the section 0..1) and
 * the curves, with `glassAt(x, y, z)` telling whether a point of the surface is in the greenhouse.
 */
/** Samples per segment of a section, from the bottom middle round to the roof: so every key point sits on the same row. */
const SEGMENTS = [8, 6, 8, 10, 8, 6, 8, 6, 14, 8, 8];
/** The rows the key points land on, by name (the creases run along some of them). */
export const ROWS = (() => {
  const names = ['bottom', 'floor', 'sill', 'lower', 'side', 'roll', 'belt', 'shoulder', 'glass', 'header', 'roof', 'middle'];
  const at = {};
  let j = 0;
  names.forEach((name, i) => {
    at[name] = j;
    j += SEGMENTS[i] ?? 0;
  });
  return at;
})();

export function loftBody(spec, { stations = 240 } = {}) {
  const top = curve(spec.top);
  const bottom = curve(spec.bottom);
  const width = curve(spec.width);
  const shoulder = curve(spec.shoulder);
  const belt = curve(spec.belt);
  const cabin = curve(spec.cabin);
  const sill = curve(spec.sill ?? [[0, 60]]);
  const fender = spec.fender ? curve(spec.fender) : null;
  const shoulderIn = curve(spec.shoulderIn ?? [[0, 90]]);
  const [z0, z1] = spec.length;
  // The greenhouse runs from the windscreen's foot to the rear glass's (spec.cabinSpan, [rear, front] in z); outside it the
  // top is a lid (bonnet, boot), and the belt rises to meet it.
  const [cr, cf] = spec.cabinSpan ?? [z0, z1];
  const cabinFactor = (z) => Math.max(0, Math.min(1, Math.min(z - cr, cf - z) / 90));
  const greenhouse = (z) => {
    const yb = bottom(z);
    const yt = Math.max(yb + 20, top(z));
    const c = cabinFactor(z);
    const lidBelt = yt - 8;
    const yl = Math.min(yt - 2, Math.max(yb + 40, belt(z) * c + Math.min(lidBelt, Math.max(belt(z), lidBelt)) * (1 - c)));
    return { yb, yt, yl, glass: (yt - yl) * c, c };
  };
  // Half a section (the car's left, x ≥ 0): from the bottom middle to the roof's middle.
  const half = (z) => {
    const { yb, yt, yl, glass } = greenhouse(z);
    const w = Math.max(10, width(z));
    const ys = yb + (yl - yb) * shoulder(z);
    const ws = Math.max(8, w - Math.min(sill(z), w * 0.3));
    const rb = Math.min(60, (ys - yb) * 0.5, ws * 0.3);
    const wf = Math.max(6, w - Math.min(shoulderIn(z), w * 0.35));
    const yf = fender ? Math.max(yl + 6, fender(z)) : yl + 8;
    const roll = Math.min(spec.roll ?? 45, (yl - ys) * 0.6);
    const pts = [
      [0, yb],
      [ws * 0.6, yb],
      [ws - rb * 0.3, yb + rb * 0.25],
      [ws + (w - ws) * 0.55, yb + (ys - yb) * 0.42],
      [w, ys],
      [w - roll * 0.45, ys + (yl - ys) * 0.6],
      [w - roll, yl - 4],
      [wf, Math.max(yl + 2, yf - 4)],
    ];
    // Above the shoulder: the glass's base, its top edge (the roof's side), and the roof; with no cabin, the
    // bonnet or the boot lid runs across from the wings to the middle (the same number of points either way).
    const g = Math.max(0, Math.min(1, (glass - 10) / 40));
    void yl;
    const wr = Math.min(wf - 20, Math.max(6, cabin(z)));
    const rr = Math.min(100, Math.max(1, glass) * 0.4, wr * 0.45);
    const lid = [wf * 0.55, (yt + yf) / 2 + (yt - yf) * 0.25];
    const mix = (a, b) => [a[0] + (b[0] - a[0]) * g, a[1] + (b[1] - a[1]) * g];
    pts.push(mix([wf - 10, yf + (lid[1] - yf) * 0.3], [wf - Math.min(28, (wf - wr) * 0.3), yf + 10]), mix(lid, [wr + rr * 0.3, yt - rr * 0.55]), mix([wf * 0.25, yt - (yt - lid[1]) * 0.15], [wr * 0.45, yt - rr * 0.06]), [0, yt]);
    return { pts: catmull(pts, SEGMENTS), yb, yt, yl, w, wf };
  };
  const geo = new Geo();
  const rows = [];
  const round = SEGMENTS.reduce((a, b) => a + b, 0);
  for (let i = 0; i <= stations; i++) {
    const s = i / stations;
    const e = 0.5 - 0.5 * Math.cos(Math.PI * s);
    const z = z0 + (z1 - z0) * (0.2 * s + 0.8 * e);
    rows.push({ z, row: half(z).pts });
  }
  // Both sides: the left is +x, the right mirrored; vertices shared down the middle.
  const rowOfVertex = [];
  const ids = rows.map(({ z, row }, i) => {
    const left = row.map(([x, y], j) => {
      rowOfVertex.push(j);
      return geo.vertex([x, y, z], [0, 0, 1], [i / stations, (0.5 * j) / round]);
    });
    const right = row.map(([x, y], j) => {
      if (j === 0 || j === round) return left[j];
      rowOfVertex.push(j);
      return geo.vertex([-x, y, z], [0, 0, 1], [i / stations, 1 - (0.5 * j) / round]);
    });
    return { left, right };
  });
  for (let i = 0; i < stations; i++) {
    const a = ids[i];
    const b = ids[i + 1];
    for (let j = 0; j < round; j++) {
      // Left side (+x): up the side with j, forward with i; outward is +x.
      const q = [a.left[j], a.left[j + 1], b.left[j + 1], b.left[j]];
      geo.indices.push(q[0], q[2], q[3], q[0], q[1], q[2]);
      const r = [a.right[j], a.right[j + 1], b.right[j + 1], b.right[j]];
      geo.indices.push(r[0], r[3], r[2], r[0], r[2], r[1]);
    }
  }
  for (const [i, dir] of [[0, -1], [stations, 1]]) {
    const { z, row } = rows[i];
    const cy = row.reduce((sum, [, y]) => sum + y, 0) / row.length;
    const centre = geo.vertex([0, cy, z + dir * 0.01], [0, 0, dir]);
    rowOfVertex.push(-1);
    const ring = [...ids[i].left, ...ids[i].right.slice(1, -1).reverse()].map((v) => {
      rowOfVertex.push(-1);
      return geo.vertex(geo.positions.slice(v * 3, v * 3 + 3), [0, 0, dir]);
    });
    for (let k = 0; k < ring.length; k++) {
      const [p, q] = [ring[k], ring[(k + 1) % ring.length]];
      if (dir > 0) geo.indices.push(centre, p, q);
      else geo.indices.push(centre, q, p);
    }
  }
  computeNormals(geo, { creases: (spec.creases ?? ['belt', 'shoulder']).map((name) => ROWS[name]), rowOf: (v) => rowOfVertex[v] });
  /** Whether a point on the surface is in the greenhouse: above the glass's base and inboard of the shoulder. */
  const glassAt = (x, y, z) => {
    const { yl, glass, c } = greenhouse(z);
    if (glass <= 30 || c < 0.5) return false;
    const wf = Math.max(6, width(z) - Math.min(shoulderIn(z), width(z) * 0.35));
    return y > yl + 14 && Math.abs(x) < wf - 6;
  };
  return { geo, half, top, bottom, width, belt, cabin, greenhouse, glassAt };
}

/** Smooth vertex normals from the faces round each vertex (area weighted), welding coincident points. */
export function computeNormals(geo, { creases = [], rowOf = null, onCopy = null } = {}) {
  // Vertices on a crease row are split: triangles above the crease get their own copy of each, so the two sides
  // shade apart. Copies (and end caps, row -1) weld only among themselves.
  const tag = new Map();
  if (rowOf) for (let v = 0; v < geo.vertexCount; v++) if (rowOf(v) === -1) tag.set(v, 'cap');
  if (creases.length && rowOf) {
    const crease = new Set(creases);
    const copies = new Map();
    for (let t = 0; t < geo.indices.length; t += 3) {
      const tri = geo.indices.slice(t, t + 3);
      const rows = tri.map((v) => rowOf(v));
      tri.forEach((v, k) => {
        const r = rows[k];
        if (r === undefined || r < 0 || !crease.has(r)) return;
        if (!rows.some((o, m) => m !== k && o !== undefined && o > r)) return;
        if (!copies.has(v)) {
          const c = geo.vertex(geo.positions.slice(v * 3, v * 3 + 3), [0, 0, 1], geo.uvs.slice(v * 2, v * 2 + 2));
          copies.set(v, c);
          onCopy?.(v, c);
          tag.set(c, `crease${r}`);
        }
        geo.indices[t + k] = copies.get(v);
      });
    }
  }
  const n = geo.vertexCount;
  const acc = new Float64Array(n * 3);
  const key = new Map();
  const weld = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    const k = `${tag.get(i) ?? ''}|${[0, 1, 2].map((c) => Math.round(geo.positions[i * 3 + c] * 100)).join()}`;
    if (!key.has(k)) key.set(k, i);
    weld[i] = key.get(k);
  }
  for (let t = 0; t < geo.indices.length; t += 3) {
    const [a, b, c] = [geo.indices[t], geo.indices[t + 1], geo.indices[t + 2]];
    const P = (v) => [geo.positions[v * 3], geo.positions[v * 3 + 1], geo.positions[v * 3 + 2]];
    const [pa, pb, pc] = [P(a), P(b), P(c)];
    const u = [pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]];
    const v = [pc[0] - pa[0], pc[1] - pa[1], pc[2] - pa[2]];
    const nrm = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    for (const w of [a, b, c]) for (let k = 0; k < 3; k++) acc[weld[w] * 3 + k] += nrm[k];
  }
  for (let i = 0; i < n; i++) {
    const w = weld[i];
    const l = Math.hypot(acc[w * 3], acc[w * 3 + 1], acc[w * 3 + 2]) || 1;
    for (let k = 0; k < 3; k++) geo.normals[i * 3 + k] = acc[w * 3 + k] / l;
  }
  return geo;
}
