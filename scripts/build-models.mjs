// Compresses downloaded sources into the .glb files the site serves.
//
//   npm run models:build            # every object
//   npm run models:build -- slug    # just one
//
// Geometry gets meshopt compression (decoded in the browser by three.js);
// textures are resized to at most 2048px and re-encoded as WebP. Node names
// are kept intact because content files refer to parts by name.
//
// A content file can name a script under build.augment that edits the model
// first (the pocket watch uses one to open its case and add a movement), or
// one under build.generate that builds the whole model itself, with no source
// (the reflex camera). Either returns model-space hints (pivots, axes, points
// for the content file); with build.hints set, they're written to that file,
// where the object's content builder reads them.
//
//   npm run models:build -- slug --no-check   # report clashes instead of failing (while iterating)
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, textureCompress, meshopt } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { listThings, polyHavenId, polyHavenCacheDir, PUBLIC_DIR, ROOT } from './lib.mjs';

const MAX_TEXTURE = 2048;

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });

async function dirSize(dir) {
  let total = 0;
  for (const entry of await readdir(dir, { withFileTypes: true, recursive: true })) {
    if (entry.isFile() && entry.name !== 'source.json') total += (await stat(path.join(entry.parentPath, entry.name))).size;
  }
  return total;
}

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;
const args = process.argv.slice(2);
const check = !args.includes('--no-check');
const things = await listThings(args.filter((arg) => !arg.startsWith('--')));
let failures = 0;

for (const { slug, data } of things) {
  const id = polyHavenId(data.credit?.sourceUrl);
  const generator = data.build?.generate;
  if (!id && !generator) {
    console.log(`- ${slug}: not a Poly Haven source, skipping`);
    continue;
  }
  try {
    const srcDir = id ? polyHavenCacheDir(id) : null;
    let doc;
    const hints = [];
    if (generator) {
      const { default: generate } = await import(pathToFileURL(path.join(ROOT, generator)).href);
      const built = await generate({ data, check });
      doc = built.doc;
      if (built.hints) hints.push(built.hints);
    } else {
      doc = await io.read(path.join(srcDir, `${id}.gltf`));
    }
    if (data.build?.augment) {
      const { default: augment } = await import(pathToFileURL(path.join(ROOT, data.build.augment)).href);
      const more = await augment(doc, { data, check });
      if (more) hints.push(more);
    }
    if (hints.length && data.build?.hints) {
      await writeFile(path.join(ROOT, data.build.hints), JSON.stringify(Object.assign({}, ...hints), null, 2) + '\n');
      console.log(`  hints → ${data.build.hints}`);
    } else {
      for (const h of hints) console.log(`  model-space hints: ${JSON.stringify(h)}`);
    }
    const textureSize = data.build?.textureSize ?? MAX_TEXTURE;
    await doc.transform(
      dedup(),
      prune(),
      // Normal maps keep more quality: WebP artefacts show up as lighting noise.
      textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [textureSize, textureSize], quality: 80, slots: /^(?!normalTexture$).*/ }),
      textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [textureSize, textureSize], quality: 90, slots: /^normalTexture$/ }),
      meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
    );
    doc.getRoot().getAsset().generator = '3d-of-things build-models';
    const out = path.join(PUBLIC_DIR, data.model);
    await mkdir(path.dirname(out), { recursive: true });
    await io.write(out, doc);
    const after = (await stat(out)).size;
    console.log(srcDir ? `✓ ${slug}: ${mb(await dirSize(srcDir))} → ${mb(after)}  (${data.model})` : `✓ ${slug}: generated, ${mb(after)}  (${data.model})`);
  } catch (err) {
    failures++;
    console.error(`✗ ${slug}: ${err.stack ?? err.message}`);
  }
}

process.exitCode = failures ? 1 : 0;
