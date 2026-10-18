// Shapes for the generated medium-format camera, on top of the watch's and the rangefinder's
// building blocks: boxes rounded on every edge (cast shells, a magazine, a finder), knurled and
// fluted rings, bands that carry an engraved scale, and plain plates with UVs for leatherette.
// Millimetres in the camera frame: x toward the photographer's left, y up, z forward along the lens.
import { Geo, lathe } from '../watch/geometry.mjs';
import { gear as gearShape } from '../watch/shapes.mjs';
import { put } from '../camera/solids.mjs';
import { centroid, cut, pick } from '../camera/surgery.mjs';

const TAU = Math.PI * 2;

/**
 * A box rounded by `r` on all twelve edges, as a closed surface. Each face is a grid whose rows
 * crowd into the rounded edges at even steps of angle, so the bends stay smooth; corners are
 * shared by three faces. UVs are each face's own planar projection, in mm / `uvSpan`.
 */
export function roundedBox(geo, [x0, x1], [y0, y1], [z0, z1], r, { segments = 6, flat = 0, uvSpan = 100, faces = ['+x', '-x', '+y', '-y', '+z', '-z'] } = {}) {
  const lo = [x0, y0, z0];
  const hi = [x1, y1, z1];
  const inLo = lo.map((v) => v + r);
  const inHi = hi.map((v) => v - r);
  // Stations along an axis: through the rounded band at the low end, the flat, the band at the high end.
  const stations = (a) => {
    const out = [];
    for (let k = 0; k <= segments; k++) out.push(inLo[a] - r * Math.tan(((segments - k) / segments) * (Math.PI / 4)));
    // Across the flat: about one station every `flat` mm.
    const n = flat ? Math.max(1, Math.round((inHi[a] - inLo[a]) / flat)) : 1;
    for (let k = 1; k < n; k++) out.push(inLo[a] + ((inHi[a] - inLo[a]) * k) / n);
    for (let k = 0; k <= segments; k++) out.push(inHi[a] + r * Math.tan((k / segments) * (Math.PI / 4)));
    return out;
  };
  const S = [stations(0), stations(1), stations(2)];
  // A point on the box's flat face pushed out onto the rounded surface.
  const round = (q) => {
    const c = q.map((v, a) => Math.min(inHi[a], Math.max(inLo[a], v)));
    const d = q.map((v, a) => v - c[a]);
    const l = Math.hypot(...d) || 1;
    const n = d.map((v) => v / l);
    return { p: c.map((v, a) => v + n[a] * r), n };
  };
  for (const face of faces) {
    const a = 'xyz'.indexOf(face[1]);
    const sign = face[0] === '+' ? 1 : -1;
    const [u, v] = [0, 1, 2].filter((k) => k !== a);
    const base = geo.vertexCount;
    const level = sign > 0 ? hi[a] : lo[a];
    // The box's face, before rounding, extends to the box's outer bounds; the rounding pulls its rim in.
    const us = S[u].map((s, i, arr) => (i === 0 ? lo[u] : i === arr.length - 1 ? hi[u] : s));
    const vs = S[v].map((s, i, arr) => (i === 0 ? lo[v] : i === arr.length - 1 ? hi[v] : s));
    for (const sv of vs) {
      for (const su of us) {
        const q = [0, 0, 0];
        q[a] = level;
        q[u] = su;
        q[v] = sv;
        const { p, n } = round(q);
        geo.vertex(p, n, [p[u] / uvSpan + 0.5, p[v] / uvSpan + 0.5]);
      }
    }
    const nu = us.length;
    for (let j = 0; j < vs.length - 1; j++) {
      for (let i = 0; i < nu - 1; i++) {
        const q00 = base + j * nu + i;
        const q10 = q00 + 1;
        const q01 = q00 + nu;
        const q11 = q01 + 1;
        const facing = [0, 0, 0];
        facing[a] = sign;
        geo.tri(q00, q10, q11, facing);
        geo.tri(q00, q11, q01, facing);
      }
    }
  }
  return geo;
}

/** A closed loop for a ring with `count` rounded ridges (knurling seen end on): radius r at the crests, r - depth in the grooves. */
export function flutes(r, depth, count, { a = 0, b = 0, samples = 6, sharp = 1.6 } = {}) {
  const pts = [];
  const n = count * samples;
  for (let i = 0; i < n; i++) {
    const phi = (i / n) * TAU;
    const wave = 0.5 + 0.5 * Math.cos(phi * count);
    const rr = r - depth * (1 - wave ** (1 / sharp));
    pts.push([a + rr * Math.cos(phi), b + rr * Math.sin(phi)]);
  }
  return pts;
}

/**
 * A band of a turned part that carries a scale: a plain cylinder from z0 to z1 (along the axis)
 * whose uv runs once round (u, from +x toward +y) and across the band (v, from z1 at the top of
 * the image to z0), so text drawn upright in the image reads the right way up from behind and above.
 */
export function band(geo, axis, at, r, z0, z1, { segments = 160, start = 0 } = {}) {
  const local = new Geo();
  lathe(local, [[r, z0], [r, z1]], { segments, start });
  // The lathe's v runs from z0 (0) to z1 (1): turn it over.
  for (let i = 0; i < local.vertexCount; i++) local.uvs[i * 2 + 1] = 1 - local.uvs[i * 2 + 1];
  const offset = [...at];
  offset['xyz'.indexOf(axis)] = 0;
  return put(geo, local, axis, offset);
}

/** A flat annulus (a scale on a ring's face) across `axis` at w, facing +axis or -axis. uv: u round, v out from r0 to r1. */
export function face(geo, axis, at, r0, r1, w, dir = 1, { segments = 160, flip = false } = {}) {
  const local = new Geo();
  const rings = [];
  for (const [r, v] of [[r0, 1], [r1, 0]]) {
    const ids = [];
    for (let j = 0; j <= segments; j++) {
      const phi = (j / segments) * TAU;
      ids.push(local.vertex([r * Math.cos(phi), r * Math.sin(phi), w], [0, 0, dir], [flip ? 1 - j / segments : j / segments, v]));
    }
    rings.push(ids);
  }
  for (let j = 0; j < segments; j++) {
    const [a, b, c, d] = [rings[0][j], rings[0][j + 1], rings[1][j + 1], rings[1][j]];
    local.tri(a, b, c, [0, 0, dir]);
    local.tri(a, c, d, [0, 0, dir]);
  }
  const offset = [...at];
  offset['xyz'.indexOf(axis)] = 0;
  return put(geo, local, axis, offset);
}

/** A rounded rectangle loop centred at (a, b), w × h, corner radius rr. */
export function roundRect(a, b, w, h, rr, steps = 6) {
  const pts = [];
  const corners = [
    [a + w / 2 - rr, b - h / 2 + rr, -90],
    [a + w / 2 - rr, b + h / 2 - rr, 0],
    [a - w / 2 + rr, b + h / 2 - rr, 90],
    [a - w / 2 + rr, b - h / 2 + rr, 180],
  ];
  for (const [cx, cy, start] of corners) {
    for (let i = 0; i <= steps; i++) {
      const t = ((start + (i * 90) / steps) * Math.PI) / 180;
      pts.push([cx + rr * Math.cos(t), cy + rr * Math.sin(t)]);
    }
  }
  return pts;
}

/** UVs for a Geo by planar projection along `axis` (mm / span), for the faces it covers. */
export function projectUVs(geo, axis, span = 100, [du, dv] = [0, 0]) {
  const a = 'xyz'.indexOf(axis);
  const [u, v] = [0, 1, 2].filter((k) => k !== a);
  for (let i = 0; i < geo.vertexCount; i++) {
    geo.uvs[i * 2] = geo.positions[i * 3 + u] / span + 0.5 + du;
    geo.uvs[i * 2 + 1] = geo.positions[i * 3 + v] / span + 0.5 + dv;
  }
  return geo;
}

/** A round wire swept along a path (springs, rods, cables): radius r, `segments` round, frames carried along without twisting. */
export function tube(geo, path, r, { segments = 10, caps = true } = {}) {
  const n = path.length;
  const tangent = (i) => {
    const a = path[Math.max(0, i - 1)];
    const b = path[Math.min(n - 1, i + 1)];
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const l = Math.hypot(...d) || 1;
    return d.map((v) => v / l);
  };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (v) => {
    const l = Math.hypot(...v) || 1;
    return v.map((x) => x / l);
  };
  let t = tangent(0);
  let u = norm(cross(t, Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
  const rings = [];
  for (let i = 0; i < n; i++) {
    const tn = tangent(i);
    // Parallel transport: turn the frame by the change in tangent.
    u = norm(cross(cross(tn, u), tn));
    t = tn;
    const v = cross(t, u);
    const ids = [];
    for (let j = 0; j < segments; j++) {
      const phi = (j / segments) * TAU;
      const m = [0, 1, 2].map((k) => u[k] * Math.cos(phi) + v[k] * Math.sin(phi));
      ids.push(geo.vertex([0, 1, 2].map((k) => path[i][k] + m[k] * r), m, [i / (n - 1), j / segments]));
    }
    rings.push(ids);
  }
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < segments; j++) {
      const j1 = (j + 1) % segments;
      geo.quad(rings[i][j], rings[i + 1][j], rings[i + 1][j1], rings[i][j1]);
    }
  }
  if (caps) {
    for (const [i, dir] of [[0, -1], [n - 1, 1]]) {
      const tn = tangent(i).map((v) => v * dir);
      const centre = geo.vertex(path[i], tn);
      const ids = rings[i].map((id) => geo.vertex(geo.positions.slice(id * 3, id * 3 + 3), tn));
      for (let j = 0; j < segments; j++) geo.tri(centre, ids[j], ids[(j + 1) % segments], tn);
    }
  }
  return geo;
}

/** A helix along `axis` through `at`: radius r, from w0 to w1, `turns` turns (a coil spring's centreline). */
export function helix(axis, at, r, w0, w1, turns, steps = 24) {
  const pts = [];
  const a = 'xyz'.indexOf(axis);
  const [u, v] = [0, 1, 2].filter((k) => k !== a);
  const total = Math.ceil(turns * steps);
  for (let i = 0; i <= total; i++) {
    const s = i / total;
    const phi = s * turns * TAU;
    const p = [...at];
    p[a] = w0 + (w1 - w0) * s;
    p[u] = at[u] + r * Math.cos(phi);
    p[v] = at[v] + r * Math.sin(phi);
    pts.push(p);
  }
  return pts;
}

/**
 * A gear whose teeth taper toward a point on its axis (a bevel gear, its pitch cone at `angle`
 * to the axis): the gear outline scaled from s0 at w0 to s1 at w1 along `axis`, capped at both ends.
 */
export function conicalGear(geo, axis, at, { teeth, module, phase = 0 }, w0, w1, s0, s1, bore = 0) {
  const g = gearOutline({ teeth, module, phase });
  const local = new Geo();
  const ring = (s, w, n) => g.map(([x, y]) => local.vertex([x * s, y * s, w], n));
  // Side wall: quads between the two scaled outlines.
  const m = g.length;
  const lo = [];
  const hi = [];
  for (let i = 0; i < m; i++) {
    const [x, y] = g[i];
    const [px, py] = g[(i + m - 1) % m];
    const [nx, ny] = g[(i + 1) % m];
    let e = [ny - py, -(nx - px)];
    const l = Math.hypot(...e) || 1;
    e = e.map((c) => c / l);
    const slope = ((s0 - s1) * Math.hypot(x, y)) / Math.abs(w1 - w0 || 1);
    const n = normalizeVec([e[0], e[1], Math.sign(w1 - w0) * slope]);
    lo.push(local.vertex([x * s0, y * s0, w0], n));
    hi.push(local.vertex([x * s1, y * s1, w1], n));
  }
  for (let i = 0; i < m; i++) {
    const j = (i + 1) % m;
    local.tri(lo[i], lo[j], hi[j], null);
    local.tri(lo[i], hi[j], hi[i], null);
  }
  // Caps, by fanning to the bore (or the centre).
  for (const [s, w, dir] of [[s0, w0, -Math.sign(w1 - w0)], [s1, w1, Math.sign(w1 - w0)]]) {
    const outer = ring(s, w, [0, 0, dir]);
    const inner = g.map(([x, y]) => {
      const l = Math.hypot(x, y) || 1;
      return local.vertex([(x / l) * Math.max(bore, 0.01), (y / l) * Math.max(bore, 0.01), w], [0, 0, dir]);
    });
    for (let i = 0; i < m; i++) {
      const j = (i + 1) % m;
      local.tri(outer[i], outer[j], inner[j], [0, 0, dir]);
      local.tri(outer[i], inner[j], inner[i], [0, 0, dir]);
    }
  }
  // Outward-facing side triangles: fix any that point inward.
  for (let t = 0; t < local.indices.length; t += 3) {
    const [a, b, c] = local.indices.slice(t, t + 3);
    const P = (k) => local.positions.slice(k * 3, k * 3 + 3);
    const [pa, pb, pc] = [P(a), P(b), P(c)];
    const nrm = [
      (pb[1] - pa[1]) * (pc[2] - pa[2]) - (pb[2] - pa[2]) * (pc[1] - pa[1]),
      (pb[2] - pa[2]) * (pc[0] - pa[0]) - (pb[0] - pa[0]) * (pc[2] - pa[2]),
      (pb[0] - pa[0]) * (pc[1] - pa[1]) - (pb[1] - pa[1]) * (pc[0] - pa[0]),
    ];
    const vn = local.normals.slice(a * 3, a * 3 + 3);
    if (nrm[0] * vn[0] + nrm[1] * vn[1] + nrm[2] * vn[2] < 0) [local.indices[t + 1], local.indices[t + 2]] = [c, b];
  }
  const offset = [...at];
  offset['xyz'.indexOf(axis)] = 0;
  return put(geo, local, axis, offset);
}

function normalizeVec(v) {
  const l = Math.hypot(...v) || 1;
  return v.map((x) => x / l);
}

/** A spur gear's outline (watch-style teeth). */
export const gearOutline = (opts) => gearShape(opts).outline;

/**
 * Opens holes in a shell mesh: for each, the mesh is cut along the hole's outline (a 2D signed
 * distance, negative inside, on the face across `axis` at `level`), and the triangles inside are
 * dropped. Only triangles within `depth` of the face are touched.
 */
export function openHoles(mesh, holes) {
  const frame = (h) => {
    const a = 'xyz'.indexOf(h.axis);
    const [u, v] = [0, 1, 2].filter((k) => k !== a);
    return { a, u, v, depth: h.depth ?? 1.2 };
  };
  for (const h of holes) {
    const { a, u, v, depth } = frame(h);
    mesh = cut(mesh, (p) => (Math.abs(p[a] - h.level) < depth ? h.sdf(p[u], p[v]) : 1));
  }
  return pick(mesh, (t) => {
    const c = centroid(mesh, t);
    return !holes.some((h) => {
      const { a, u, v, depth } = frame(h);
      return Math.abs(c[a] - h.level) < depth && h.sdf(c[u], c[v]) < 0;
    });
  });
}

/** 2D signed distances for openHoles, in the face's other two axes in x, y, z order: a circle and a rectangle (centre, half sizes). */
export const sdCircle = (cu, cv, r) => (u, v) => Math.hypot(u - cu, v - cv) - r;
export const sdRect = (cu, cv, hu, hv) => (u, v) => Math.max(Math.abs(u - cu) - hu, Math.abs(v - cv) - hv);
