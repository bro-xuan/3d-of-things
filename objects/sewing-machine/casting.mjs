// The sewing machine's hollow cast-iron arm, built as a silhouette seen from the front (x right, y up)
// and extruded front to back: a face plate at each end of the depth, and walls round the outline in
// between. A wall can be left out along chosen edges, where a shaft, a bar or the bed passes through.
import { Geo } from '../../scripts/kit/geometry.mjs';

/**
 * A loop through `corners` ([x, y, r] anticlockwise), each corner rounded by r. Returns the points and,
 * for the segment from point i to i + 1, what it lies on: { edge: k } (corner k to k + 1) or { corner: k }.
 * A corner always gets `segs` + 1 points (all equal when r = 0), so an inset loop matches point for point.
 */
export function filleted(corners, segs = 8) {
  const n = corners.length;
  const pts = [];
  const tags = [];
  const unit = (a, b) => {
    const d = [b[0] - a[0], b[1] - a[1]];
    const l = Math.hypot(...d);
    return [d[0] / l, d[1] / l];
  };
  for (let k = 0; k < n; k++) {
    const [x, y, r] = corners[k];
    const prev = corners[(k + n - 1) % n];
    const next = corners[(k + 1) % n];
    const ui = unit(prev, [x, y]);
    const uo = unit([x, y], next);
    const turn = ui[0] * uo[1] - ui[1] * uo[0];
    const angle = Math.acos(Math.max(-1, Math.min(1, ui[0] * uo[0] + ui[1] * uo[1])));
    const t = r * Math.tan(angle / 2);
    const a = [x - ui[0] * t, y - ui[1] * t];
    // The arc's centre is r along the inward normal of the incoming edge (left for a left turn).
    const side = turn >= 0 ? 1 : -1;
    const c = [a[0] - ui[1] * r * side, a[1] + ui[0] * r * side];
    const a0 = Math.atan2(a[1] - c[1], a[0] - c[0]);
    for (let s = 0; s <= segs; s++) {
      const th = a0 + side * angle * (s / segs);
      pts.push(r ? [c[0] + r * Math.cos(th), c[1] + r * Math.sin(th)] : [x, y]);
      tags.push(s < segs ? { corner: k } : { edge: k });
    }
  }
  return { pts, tags };
}

/** The corners moved `d` inward (anticlockwise loop: inward is to the left), each radius grown or shrunk to keep its centre. */
export function insetCorners(corners, d) {
  const n = corners.length;
  const line = (p, q) => {
    const l = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const u = [(q[0] - p[0]) / l, (q[1] - p[1]) / l];
    const nrm = [-u[1], u[0]];
    return { p: [p[0] + nrm[0] * d, p[1] + nrm[1] * d], u };
  };
  return corners.map(([x, y, r], k) => {
    const prev = corners[(k + n - 1) % n];
    const next = corners[(k + 1) % n];
    const A = line(prev, [x, y]);
    const B = line([x, y], next);
    const det = A.u[0] * B.u[1] - A.u[1] * B.u[0];
    const s = ((B.p[0] - A.p[0]) * B.u[1] - (B.p[1] - A.p[1]) * B.u[0]) / det;
    const convex = det > 0;
    return [A.p[0] + A.u[0] * s, A.p[1] + A.u[1] * s, r ? Math.max(0.5, convex ? r - d : r + d) : 0];
  });
}

/**
 * Walls between an outer and an inner loop (equal point counts), from z0 to z1, leaving out every segment
 * `keep(tag)` rejects. Smooth along the fillets, creased at sharp corners; the ends of a wall are capped.
 */
export function walls(geo, outer, inner, tags, keep, z0, z1) {
  const n = outer.length;
  const kept = tags.map((t) => keep(t));
  const segNormal = (loop, i, sign) => {
    const [a, b] = [loop[i], loop[(i + 1) % n]];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    // Right of the direction of travel is outward on an anticlockwise loop.
    return [((b[1] - a[1]) / l) * sign, (-(b[0] - a[0]) / l) * sign];
  };
  const vertexNormal = (loop, i, seg, sign) => {
    const prev = (i + n - 1) % n;
    const here = segNormal(loop, seg, sign);
    const other = segNormal(loop, seg === i ? prev : (seg + 1) % n, sign);
    const zeroLength = (j) => Math.hypot(loop[(j + 1) % n][0] - loop[j][0], loop[(j + 1) % n][1] - loop[j][1]) < 1e-6;
    if (zeroLength(seg === i ? prev : (seg + 1) % n)) return here;
    if (here[0] * other[0] + here[1] * other[1] < Math.cos((35 * Math.PI) / 180)) return here;
    const m = [here[0] + other[0], here[1] + other[1]];
    const l = Math.hypot(...m) || 1;
    return [m[0] / l, m[1] / l];
  };
  const face = (loop, i, sign) => {
    const j = (i + 1) % n;
    if (Math.hypot(loop[j][0] - loop[i][0], loop[j][1] - loop[i][1]) < 1e-6) return;
    const ni = vertexNormal(loop, i, i, sign);
    const nj = vertexNormal(loop, j, i, sign);
    const v = [
      geo.vertex([...loop[i], z0], [...ni, 0]),
      geo.vertex([...loop[j], z0], [...nj, 0]),
      geo.vertex([...loop[j], z1], [...nj, 0]),
      geo.vertex([...loop[i], z1], [...ni, 0]),
    ];
    const f = [...segNormal(loop, i, sign), 0];
    geo.tri(v[0], v[1], v[2], f);
    geo.tri(v[0], v[2], v[3], f);
  };
  const quad = (pts, facing) => {
    const v = pts.map((p) => geo.vertex(p, facing));
    geo.tri(v[0], v[1], v[2], facing);
    geo.tri(v[0], v[2], v[3], facing);
  };
  for (let i = 0; i < n; i++) {
    if (!kept[i]) continue;
    const j = (i + 1) % n;
    face(outer, i, 1);
    face(inner, i, -1);
    const len = (loop) => Math.hypot(loop[j][0] - loop[i][0], loop[j][1] - loop[i][1]);
    if (len(outer) > 1e-6 || len(inner) > 1e-6) {
      for (const [z, dir] of [[z0, -1], [z1, 1]]) quad([[...outer[i], z], [...outer[j], z], [...inner[j], z], [...inner[i], z]], [0, 0, dir]);
    }
    // Caps where the wall stops, facing along the wall: its direction comes from the nearest segment of real length.
    const along = (from, step) => {
      for (let k = from, tries = 0; tries < n; k = (k + step + n) % n, tries++) {
        const [a, b] = [outer[k], outer[(k + 1) % n]];
        const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (l > 1e-6) return [(b[0] - a[0]) / l, (b[1] - a[1]) / l, 0];
      }
      return [1, 0, 0];
    };
    if (!kept[(i + n - 1) % n]) {
      const u = along(i, 1);
      quad([[...outer[i], z0], [...inner[i], z0], [...inner[i], z1], [...outer[i], z1]], u.map((c) => -c));
    }
    if (!kept[j]) quad([[...outer[j], z0], [...inner[j], z0], [...inner[j], z1], [...outer[j], z1]], along(i, -1));
  }
  return geo;
}

export { Geo };
