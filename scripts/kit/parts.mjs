// A part, and the build's checks on parts: no generated part crosses another at rest, and the content
// file's explode passes nothing through anything. Written for the rangefinder camera's build
// (objects/rangefinder-camera/mechanism.mjs) and used by every model built in code since.
import { BufferAttribute, BufferGeometry, Matrix4 } from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import { Geo } from './geometry.mjs';

/** A generated part (one glTF node): geometry by material key, in millimetres in the object's frame. */
export class Part {
  constructor(name, { parent, extras } = {}) {
    this.name = name;
    this.parent = parent;
    this.extras = extras;
    this.geos = new Map();
    /** Per Geo, _CLOTH values (two a vertex), for parts the viewer deforms. */
    this.uv1 = null;
  }

  geo(material) {
    if (!this.geos.has(material)) this.geos.set(material, new Geo());
    return this.geos.get(material);
  }
}

/** A BVH of some meshes (mm), with its bounds; null if there are none. */
function indexMeshes(meshes) {
  const positions = [];
  const indices = [];
  for (const mesh of meshes) {
    const base = positions.length / 3;
    positions.push(...mesh.positions);
    for (const i of mesh.indices) indices.push(i + base);
  }
  if (!indices.length) return null;
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setIndex(indices);
  geometry.computeBoundingBox();
  return { geometry, bvh: new MeshBVH(geometry), box: geometry.boundingBox };
}

/** Per piece: a BVH of all its meshes, and one of the generated ones (which are the ones checked at rest). */
function indexPieces(pieces) {
  const out = new Map();
  for (const [name, list] of pieces) {
    const all = indexMeshes(list.map((e) => e.mesh));
    if (!all) continue;
    out.set(name, { ...all, generated: indexMeshes(list.filter((e) => e.generated).map((e) => e.mesh)) });
  }
  return out;
}

/** Where two indexed meshes first cross (a point in A's frame, mm), with B moved by `matrix`; null if they don't. */
function contact(A, B, matrix = new Matrix4()) {
  let at = null;
  A.bvh.bvhcast(B.bvh, matrix, {
    intersectsTriangles(t1, t2) {
      if (!t1.intersectsTriangle(t2)) return false;
      at = [t1.a, t1.b, t1.c].reduce((m, p) => [m[0] + p.x / 3, m[1] + p.y / 3, m[2] + p.z / 3], [0, 0, 0]);
      return true;
    },
  });
  return at;
}
const where = (p) => `[${p.map((v) => v.toFixed(1)).join(', ')}]`;

const overlap = (a, b, sa = [0, 0, 0], sb = [0, 0, 0]) =>
  a.min.x + sa[0] < b.max.x + sb[0] && b.min.x + sb[0] < a.max.x + sa[0] && a.min.y + sa[1] < b.max.y + sb[1] && b.min.y + sb[1] < a.max.y + sa[1] && a.min.z + sa[2] < b.max.z + sb[2] && b.min.z + sb[2] < a.max.z + sa[2];

/** Generated meshes that cross anything in another piece, at rest. `ignore` lists pairs in contact by design ('name*' matches a prefix). */
export function checkClashes(pieces, { ignore = [] } = {}) {
  const index = indexPieces(pieces);
  const names = [...index.keys()];
  const found = [];
  const matches = (pattern, name) => (pattern.endsWith('*') ? name.startsWith(pattern.slice(0, -1)) : pattern === name);
  const allowed = (a, b) => ignore.some(([x, y]) => (matches(x, a) && matches(y, b)) || (matches(x, b) && matches(y, a)));
  for (let i = 0; i < names.length; i++) {
    for (let k = i + 1; k < names.length; k++) {
      const [a, b] = [names[i], names[k]];
      if (allowed(a, b)) continue;
      const A = index.get(a);
      const B = index.get(b);
      if (!overlap(A.box, B.box)) continue;
      const at = (A.generated && overlap(A.generated.box, B.box) && contact(A.generated, B)) || (B.generated && overlap(B.generated.box, A.box) && contact(B.generated, A));
      if (at) found.push(`${a} × ${b} near ${where(at)}`);
    }
  }
  return found;
}

/**
 * Whether the explode in the content file would pass one piece through another. Uses the
 * viewer's timing (see Exploder in src/viewer/rig.ts); pieces nested in another ride with it.
 * Pairs that touch at rest (a lid on its box) are only checked once they've moved apart.
 */
export function checkExplode(pieces, contentParts, parentOf, mmPerUnit, { samples = 160 } = {}) {
  const index = indexPieces(pieces);
  const clamp = (x) => Math.min(1, Math.max(0, x));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  const stages = [...new Set(contentParts.map((p) => p.stage ?? 0))].sort((a, b) => a - b);
  const span = stages.length === 1 ? 1 : Math.max(0.3, 1 / stages.length + 0.2);
  const byNode = new Map();
  for (const p of contentParts) {
    const i = stages.indexOf(p.stage ?? 0);
    const staged = stages.length === 1 ? 0 : (i / (stages.length - 1)) * (1 - span);
    const window = p.window ?? [staged, staged + span];
    for (const name of [p.node, ...(p.with ?? [])]) byNode.set(name, { ...p, window });
  }
  const leg = (d, distance, e) => d.map((c) => (c / Math.hypot(...d)) * distance * mmPerUnit * e);
  const own = (name, v) => {
    const p = byNode.get(name);
    if (!p) return [0, 0, 0];
    const t = clamp((v - p.window[0]) / (p.window[1] - p.window[0]));
    const split = p.then ? Math.max(0.3, p.distance / (p.distance + p.then.distance)) : 1;
    const first = leg(p.direction, p.distance, ease(clamp(t / split)));
    const second = p.then ? leg(p.then.direction, p.then.distance, ease(clamp((t - split) / (1 - split)))) : [0, 0, 0];
    return first.map((c, i) => c + second[i]);
  };
  const offsetAt = (name, v) => {
    const o = own(name, v);
    const parent = parentOf(name);
    if (!parent) return o;
    const p = offsetAt(parent, v);
    return o.map((c, i) => c + p[i]);
  };
  const names = [...index.keys()];
  const found = [];
  const m = new Matrix4();
  for (let i = 0; i < names.length; i++) {
    for (let k = i + 1; k < names.length; k++) {
      const [a, b] = [names[i], names[k]];
      const A = index.get(a);
      const B = index.get(b);
      let touching = overlap(A.box, B.box) && !!contact(A, B);
      for (let s = 1; s <= samples; s++) {
        const v = s / samples;
        const oa = offsetAt(a, v);
        const ob = offsetAt(b, v);
        if (oa.every((c, j) => Math.abs(c - ob[j]) < 1e-9)) continue;
        if (!overlap(A.box, B.box, oa, ob)) {
          touching = false;
          continue;
        }
        const hit = contact(A, B, m.makeTranslation(ob[0] - oa[0], ob[1] - oa[1], ob[2] - oa[2]));
        if (hit && !touching) {
          found.push(`${a} passes through ${b} at slider ${v.toFixed(2)}, near ${where(hit)} (${a}'s rest frame)`);
          break;
        }
        if (!hit) touching = false;
      }
    }
  }
  return found;
}
