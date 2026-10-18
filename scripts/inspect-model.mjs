// Prints every named node of a model with its bounds in "model space", the
// normalized space content files use for positions and camera poses:
//   - x and z are centred on the model, y = 0 is the model's lowest point
//   - scaled so half the bounding-box diagonal is 1 unit
//
//   npm run models:inspect -- hand-drill
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import path from 'node:path';
import { listThings, polyHavenId, polyHavenCacheDir, PUBLIC_DIR } from './lib.mjs';

await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const fmt = (v) => `[${v.map((n) => n.toFixed(3).padStart(6)).join(', ')}]`;

for (const { slug, data } of await listThings(process.argv.slice(2))) {
  // Prefer the uncompressed source: bounds are identical to quantisation precision. Models
  // that a build step adds to (build.augment) only have their parts in the built file.
  const id = polyHavenId(data.credit?.sourceUrl);
  const file = id && !data.build?.augment ? path.join(polyHavenCacheDir(id), `${id}.gltf`) : path.join(PUBLIC_DIR, data.model);
  const doc = await io.read(file);
  // Nodes the content file hides don't count towards model space, same as in the viewer.
  const hidden = new Set(data.hide ?? []);
  for (const node of doc.getRoot().listNodes()) if (hidden.has(node.getName())) node.dispose();
  const scene = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0];
  const { min, max } = getBounds(scene);
  const size = max.map((v, i) => v - min[i]);
  const scale = 1 / (0.5 * Math.hypot(...size));
  const offset = [-(min[0] + max[0]) / 2, -min[1], -(min[2] + max[2]) / 2];
  const toModel = (p) => p.map((v, i) => (v + offset[i]) * scale);

  console.log(`\n${slug}  (${path.relative(process.cwd(), file)})`);
  console.log(`  real size  ${size.map((v) => (v * 100).toFixed(1)).join(' × ')} cm (x × y × z)`);
  console.log(`  model size ${fmt(size.map((v) => v * scale))}  scale ${scale.toFixed(4)}`);
  for (const node of doc.getRoot().listNodes()) {
    if (!node.getMesh()) continue;
    const b = getBounds(node);
    const lo = toModel(b.min);
    const hi = toModel(b.max);
    const c = lo.map((v, i) => (v + hi[i]) / 2);
    const s = hi.map((v, i) => v - lo[i]);
    const origin = toModel(node.getWorldTranslation());
    console.log(`  ${node.getName().padEnd(44)} centre ${fmt(c)} size ${fmt(s)} origin ${fmt(origin)}`);
  }
}
