// Mesh surgery, first written for the rangefinder camera's build step. The Poly Haven camera is one closed
// shell, so pieces that come apart are cut out of it along surfaces (a plane, or any level
// set), with the triangles that cross the cut split so the edge is clean and the texture
// carries on across it. Pieces get an inside: the shell is thickened inward, and the edges
// the cut left open are closed with a rim.
//
// Meshes here are plain arrays in the camera frame's millimetres (the source's metres × 1000):
// { positions, normals, uvs, indices }, three numbers a vertex for positions and normals, two for uvs.
import { Geo } from './geometry.mjs';

/** A primitive's triangles as a plain mesh, in millimetres. */
export function readMesh(prim) {
  const get = (semantic, scale = 1) => {
    const accessor = prim.getAttribute(semantic);
    if (!accessor) return null;
    return Array.from(accessor.getArray(), (v) => v * scale);
  };
  return {
    positions: get('POSITION', 1000),
    normals: get('NORMAL'),
    uvs: get('TEXCOORD_0'),
    indices: Array.from(prim.getIndices().getArray()),
  };
}

const vertexAt = (mesh, i) => [mesh.positions[i * 3], mesh.positions[i * 3 + 1], mesh.positions[i * 3 + 2]];
export const triangleCount = (mesh) => mesh.indices.length / 3;

/** The middle of triangle t. */
export function centroid(mesh, t) {
  const c = [0, 0, 0];
  for (let k = 0; k < 3; k++) {
    const p = vertexAt(mesh, mesh.indices[t * 3 + k]);
    for (let d = 0; d < 3; d++) c[d] += p[d] / 3;
  }
  return c;
}

/**
 * Splits every triangle that crosses f(p) = 0, so each piece lies on one side. New vertices
 * are interpolated along the edges they sit on (position, normal and uv), and shared by the
 * triangles either side of an edge, so the cut is watertight wherever the mesh was.
 */
export function cut(mesh, f) {
  const out = {
    positions: [...mesh.positions],
    normals: mesh.normals ? [...mesh.normals] : null,
    uvs: mesh.uvs ? [...mesh.uvs] : null,
    indices: [],
  };
  const value = Array.from({ length: mesh.positions.length / 3 }, (_, i) => f(vertexAt(mesh, i)));
  const side = (i) => value[i] >= 0;
  const onEdge = new Map();
  const split = (a, b) => {
    const key = a < b ? `${a}:${b}` : `${b}:${a}`;
    if (onEdge.has(key)) return onEdge.get(key);
    const s = value[a] / (value[a] - value[b]);
    const lerp = (array, n) => {
      for (let c = 0; c < n; c++) array.push(array[a * n + c] + (array[b * n + c] - array[a * n + c]) * s);
    };
    lerp(out.positions, 3);
    if (out.normals) {
      lerp(out.normals, 3);
      const n = out.normals.length;
      const l = Math.hypot(out.normals[n - 3], out.normals[n - 2], out.normals[n - 1]) || 1;
      for (let c = 1; c <= 3; c++) out.normals[n - c] /= l;
    }
    if (out.uvs) lerp(out.uvs, 2);
    const index = out.positions.length / 3 - 1;
    onEdge.set(key, index);
    return index;
  };
  for (let t = 0; t < mesh.indices.length; t += 3) {
    const tri = mesh.indices.slice(t, t + 3);
    const sides = tri.map(side);
    if (sides[0] === sides[1] && sides[1] === sides[2]) {
      out.indices.push(...tri);
      continue;
    }
    // Rotate so the vertex alone on its side comes first, keeping the winding.
    const lone = sides.findIndex((s, k) => s !== sides[(k + 1) % 3] && s !== sides[(k + 2) % 3]);
    const [a, b, c] = [tri[lone], tri[(lone + 1) % 3], tri[(lone + 2) % 3]];
    const ab = split(a, b);
    const ac = split(a, c);
    out.indices.push(a, ab, ac, ab, b, c, ab, c, ac);
  }
  return out;
}

/** Island number of each triangle: triangles joined through shared (or coincident) vertices. */
export function islands(mesh) {
  const n = mesh.positions.length / 3;
  const key = new Map();
  const rep = Array.from({ length: n }, (_, i) => {
    const k = vertexAt(mesh, i).map((v) => Math.round(v * 1000)).join();
    if (!key.has(k)) key.set(k, i);
    return key.get(k);
  });
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (i) => {
    while (parent[i] !== i) i = parent[i] = parent[parent[i]];
    return i;
  };
  for (let t = 0; t < mesh.indices.length; t += 3) {
    const [a, b, c] = mesh.indices.slice(t, t + 3).map((v) => find(rep[v]));
    parent[a] = b;
    parent[find(c)] = find(b);
  }
  const ids = new Map();
  return Array.from({ length: triangleCount(mesh) }, (_, t) => {
    const root = find(rep[mesh.indices[t * 3]]);
    if (!ids.has(root)) ids.set(root, ids.size);
    return ids.get(root);
  });
}

/** Bounds of each island, by island number. */
export function islandBounds(mesh, ids) {
  const bounds = [];
  ids.forEach((id, t) => {
    const b = (bounds[id] ??= { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity], triangles: 0 });
    b.triangles++;
    for (let k = 0; k < 3; k++) {
      const p = vertexAt(mesh, mesh.indices[t * 3 + k]);
      for (let d = 0; d < 3; d++) {
        b.min[d] = Math.min(b.min[d], p[d]);
        b.max[d] = Math.max(b.max[d], p[d]);
      }
    }
  });
  return bounds.map((b) => ({ ...b, centre: b.min.map((v, d) => (v + b.max[d]) / 2), size: b.max.map((v, d) => v - b.min[d]) }));
}

/** The triangles `keep(t)` says yes to, as a mesh of their own (only the vertices they use). */
export function pick(mesh, keep) {
  const map = new Map();
  const out = { positions: [], normals: mesh.normals ? [] : null, uvs: mesh.uvs ? [] : null, indices: [] };
  for (let t = 0; t < triangleCount(mesh); t++) {
    if (!keep(t)) continue;
    for (let k = 0; k < 3; k++) {
      const v = mesh.indices[t * 3 + k];
      if (!map.has(v)) {
        map.set(v, out.positions.length / 3);
        out.positions.push(...mesh.positions.slice(v * 3, v * 3 + 3));
        out.normals?.push(...mesh.normals.slice(v * 3, v * 3 + 3));
        out.uvs?.push(...mesh.uvs.slice(v * 2, v * 2 + 2));
      }
      out.indices.push(map.get(v));
    }
  }
  return out;
}

/** Several meshes as one. */
export function merge(...meshes) {
  const out = { positions: [], normals: [], uvs: [], indices: [], uv1: meshes.some((m) => m.uv1) ? [] : null };
  for (const mesh of meshes) {
    const base = out.positions.length / 3;
    const n = mesh.positions.length / 3;
    out.positions.push(...mesh.positions);
    out.normals.push(...(mesh.normals ?? new Array(n * 3).fill(0)));
    out.uvs.push(...(mesh.uvs ?? new Array(n * 2).fill(0)));
    out.uv1?.push(...(mesh.uv1 ?? new Array(n * 2).fill(0)));
    out.indices.push(...mesh.indices.map((i) => i + base));
  }
  return out;
}

export const isEmpty = (mesh) => mesh.indices.length === 0;

/**
 * Gives a shell its thickness: an inner skin `thickness` mm in from the outside (mitred, so
 * walls stay that thick at corners too) and a rim along every open edge, joining the two.
 * Returns a Geo for the inside's own material.
 */
export function solidify(mesh, thickness, { maxOffset = thickness * 2.5 } = {}) {
  const n = mesh.positions.length / 3;
  // Weld by position: the shell's hard edges and uv seams split vertices that are one point.
  const key = new Map();
  const weld = Array.from({ length: n }, (_, i) => {
    const k = vertexAt(mesh, i).map((v) => Math.round(v * 1000)).join();
    if (!key.has(k)) key.set(k, key.size);
    return key.get(k);
  });
  const points = key.size;
  const faceNormal = (t) => {
    const [a, b, c] = mesh.indices.slice(t * 3, t * 3 + 3).map((v) => vertexAt(mesh, v));
    const u = a.map((x, d) => b[d] - x);
    const v = a.map((x, d) => c[d] - x);
    const m = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const l = Math.hypot(...m);
    return { normal: l ? m.map((x) => x / l) : [0, 0, 0], area: l / 2 };
  };
  // Per welded point, the normals of the faces around it, weighted by the angle each face has there.
  const sums = Array.from({ length: points }, () => ({ a: [0, 0, 0, 0, 0, 0, 0, 0, 0], b: [0, 0, 0], w: 0 }));
  const faces = [];
  for (let t = 0; t < triangleCount(mesh); t++) {
    const { normal, area } = faceNormal(t);
    faces.push(normal);
    if (!area) continue;
    const tri = mesh.indices.slice(t * 3, t * 3 + 3);
    tri.forEach((v, k) => {
      const p = vertexAt(mesh, v);
      const q = vertexAt(mesh, tri[(k + 1) % 3]);
      const r = vertexAt(mesh, tri[(k + 2) % 3]);
      const e1 = q.map((x, d) => x - p[d]);
      const e2 = r.map((x, d) => x - p[d]);
      const cos = (e1[0] * e2[0] + e1[1] * e2[1] + e1[2] * e2[2]) / (Math.hypot(...e1) * Math.hypot(...e2) || 1);
      const w = Math.acos(Math.max(-1, Math.min(1, cos)));
      const s = sums[weld[v]];
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) s.a[i * 3 + j] += w * normal[i] * normal[j];
        s.b[i] += w * normal[i];
      }
      s.w += w;
    });
  }
  // The offset that keeps every face round a point `thickness` away: least squares over its faces' normals.
  const offsets = sums.map(({ a, b, w }) => {
    if (!w) return [0, 0, 0];
    const lambda = 1e-3 * w;
    const m = [a[0] + lambda, a[1], a[2], a[3], a[4] + lambda, a[5], a[6], a[7], a[8] + lambda];
    const rhs = b.map((x) => -thickness * x);
    const d = solve3(m, rhs);
    const l = Math.hypot(...d);
    return l > maxOffset ? d.map((x) => (x / l) * maxOffset) : d;
  });

  const geo = new Geo();
  // Inner skin: the same triangles turned inside out, with the outside's normals reversed.
  const inner = Array.from({ length: n }, (_, i) => {
    const p = vertexAt(mesh, i).map((x, d) => x + offsets[weld[i]][d]);
    const m = mesh.normals ? mesh.normals.slice(i * 3, i * 3 + 3).map((x) => -x) : [0, 0, 1];
    return geo.vertex(p, m);
  });
  for (let t = 0; t < mesh.indices.length; t += 3) geo.indices.push(inner[mesh.indices[t]], inner[mesh.indices[t + 2]], inner[mesh.indices[t + 1]]);

  // Rims along the open edges: edges (between welded points) that only one triangle uses.
  const edges = new Map();
  for (let t = 0; t < triangleCount(mesh); t++) {
    for (let k = 0; k < 3; k++) {
      const a = mesh.indices[t * 3 + k];
      const b = mesh.indices[t * 3 + ((k + 1) % 3)];
      const [wa, wb] = [weld[a], weld[b]];
      const id = wa < wb ? `${wa}:${wb}` : `${wb}:${wa}`;
      const entry = edges.get(id);
      if (entry) entry.count++;
      else edges.set(id, { count: 1, a, b, t });
    }
  }
  for (const { count, a, b, t } of edges.values()) {
    if (count !== 1) continue;
    const pa = vertexAt(mesh, a);
    const pb = vertexAt(mesh, b);
    const qa = pa.map((x, d) => x + offsets[weld[a]][d]);
    const qb = pb.map((x, d) => x + offsets[weld[b]][d]);
    // Facing away from the triangle the edge bounds: along edge × the face's normal.
    const e = pb.map((x, d) => x - pa[d]);
    const fn = faces[t];
    let m = [e[1] * fn[2] - e[2] * fn[1], e[2] * fn[0] - e[0] * fn[2], e[0] * fn[1] - e[1] * fn[0]];
    const l = Math.hypot(...m) || 1;
    m = m.map((x) => x / l);
    const ids = [geo.vertex(pa, m), geo.vertex(pb, m), geo.vertex(qb, m), geo.vertex(qa, m)];
    geo.tri(ids[0], ids[1], ids[2], m);
    geo.tri(ids[0], ids[2], ids[3], m);
  }
  return geo;
}

/** Solves a 3×3 system (row-major) by Cramer's rule. */
function solve3(m, b) {
  const det = (a) => a[0] * (a[4] * a[8] - a[5] * a[7]) - a[1] * (a[3] * a[8] - a[5] * a[6]) + a[2] * (a[3] * a[7] - a[4] * a[6]);
  const d = det(m);
  if (Math.abs(d) < 1e-12) return [0, 0, 0];
  return [0, 1, 2].map((col) => {
    const r = [...m];
    for (let row = 0; row < 3; row++) r[row * 3 + col] = b[row];
    return det(r) / d;
  });
}

/** A Geo as a plain mesh (for picking or merging), in the same units. */
export function fromGeo(geo) {
  return { positions: [...geo.positions], normals: [...geo.normals], uvs: [...geo.uvs], indices: [...geo.indices] };
}

/** Writes a plain mesh (mm) as a glTF primitive in metres. */
export function writePrimitive(doc, buffer, mesh, material, { uvs = !!mesh.uvs, uv1 = null } = {}) {
  const accessor = (type, array) => doc.createAccessor().setType(type).setArray(array).setBuffer(buffer);
  const prim = doc
    .createPrimitive()
    .setMaterial(material)
    .setAttribute('POSITION', accessor('VEC3', new Float32Array(mesh.positions.map((v) => v / 1000))))
    .setIndices(accessor('SCALAR', new Uint32Array(mesh.indices)));
  if (mesh.normals) prim.setAttribute('NORMAL', accessor('VEC3', new Float32Array(mesh.normals)));
  if (uvs && mesh.uvs) prim.setAttribute('TEXCOORD_0', accessor('VEC2', new Float32Array(mesh.uvs)));
  // A custom attribute, not TEXCOORD_1: prune drops texture coordinates no material reads.
  if (uv1) prim.setAttribute('_CLOTH', accessor('VEC2', new Float32Array(uv1)));
  return prim;
}
