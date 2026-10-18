// Where each node of a built model sits, in model space, for content builders: a callout goes
// at `top('chuck')`, never at a pasted number. Reads public/<model> the way the viewer does
// (the content file's `hide` nodes left out of the bounds).
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const r4 = (v) => +v.toFixed(4);

/** Node name → { centre, min, max, size, mesh, parent } in model space (parent: the nearest named node it hangs
 *  from), or null while the model isn't built. The Map's
 *  `space` is the model's own { origin, mmPerUnit }, for kit/content.mjs's space() on a model with no hints.
 *  A node's box is its own meshes' (not its named children's). The build's compression moves the mesh of a
 *  node that has children onto a new unnamed child, so unnamed meshes count for their nearest named node. */
export async function nodeBounds(slug) {
  const contentFile = path.join(ROOT, 'content', `${slug}.json`);
  const thing = existsSync(contentFile) ? JSON.parse(readFileSync(contentFile, 'utf8')) : {};
  const file = path.join(ROOT, 'public', thing.model ?? `models/${slug}.glb`);
  if (!existsSync(file)) return null;
  await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
  const doc = await io.read(file);
  const hidden = new Set(thing.hide ?? []);
  for (const node of doc.getRoot().listNodes()) if (hidden.has(node.getName())) node.dispose();
  const scene = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0];
  const { min, max } = getBounds(scene);
  const scale = 1 / (0.5 * Math.hypot(...max.map((v, i) => v - min[i])));
  const offset = [-(min[0] + max[0]) / 2, -min[1], -(min[2] + max[2]) / 2];
  const toModel = (p) => p.map((v, i) => r4((v + offset[i]) * scale));
  // Each mesh node's world box. Compression quantizes positions, and getBounds undoes it; mesh nodes are leaves
  // after the build, so a node's bounds are its own mesh's.
  const meshBox = (node) => {
    const { min: lo, max: hi } = getBounds(node);
    return { lo, hi };
  };
  const owner = (node) => {
    for (let n = node; n; n = n.getParentNode?.() ?? null) if (n.getName()) return n;
    return null;
  };
  const boxes = new Map();
  for (const node of doc.getRoot().listNodes()) {
    if (!node.getMesh()) continue;
    const named = owner(node);
    if (!named) continue;
    const { lo, hi } = meshBox(node);
    const box = boxes.get(named) ?? { lo: [Infinity, Infinity, Infinity], hi: [-Infinity, -Infinity, -Infinity] };
    lo.forEach((v, i) => { box.lo[i] = Math.min(box.lo[i], v); box.hi[i] = Math.max(box.hi[i], hi[i]); });
    boxes.set(named, box);
  }
  const out = new Map();
  out.space = { origin: toModel([0, 0, 0]), mmPerUnit: +(1000 / scale).toFixed(3) };
  for (const node of doc.getRoot().listNodes()) {
    if (!node.getName()) continue;
    const own = boxes.get(node);
    const b = own ? { min: own.lo, max: own.hi } : getBounds(node);
    if (![...b.min, ...b.max].every(Number.isFinite)) continue;
    const lo = toModel(b.min);
    const hi = toModel(b.max);
    const parent = owner(node.getParentNode?.() ?? null)?.getName() ?? null;
    out.set(node.getName(), { min: lo, max: hi, centre: lo.map((v, i) => r4((v + hi[i]) / 2)), size: hi.map((v, i) => r4(v - lo[i])), mesh: !!own, parent });
  }
  return out;
}

/** Points on a node's box: centre, top (middle of its upper face), front (+z face), and so on.
 *  Before the first build (N null) they return a placeholder, so the content file can still be written. */
export function placer(N) {
  const get = (name) => {
    if (!N) return null;
    const b = N.get(name);
    if (!b) throw new Error(`no node "${name}" in the model (npm run models:inspect lists them)`);
    return b;
  };
  const face = (axis, side) => (name) => {
    const b = get(name);
    if (!b) return [0, 0.5, 0];
    const p = [...b.centre];
    p[axis] = side > 0 ? b.max[axis] : b.min[axis];
    return p;
  };
  return {
    centre: (name) => get(name)?.centre ?? [0, 0.5, 0],
    top: face(1, 1),
    bottom: face(1, -1),
    front: face(2, 1),
    back: face(2, -1),
    right: face(0, 1),
    left: face(0, -1),
  };
}
