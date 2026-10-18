// Downloads source models for content files whose credit points at Poly Haven.
//
//   npm run models:fetch            # every object
//   npm run models:fetch -- slug    # just one
//
// Poly Haven publishes every asset under CC0 1.0. This script still checks that
// the content file says so and that the credited authors match the API, so the
// attribution on the site never drifts from the source.
import { createHash } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { listThings, polyHavenId, polyHavenCacheDir } from './lib.mjs';

const RESOLUTION = '2k';
const API = 'https://api.polyhaven.com';
const HEADERS = { 'User-Agent': '3d-of-things model pipeline' };

async function getJSON(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

async function download(url, dest, md5) {
  try {
    const existing = await readFile(dest);
    if (createHash('md5').update(existing).digest('hex') === md5) return 'cached';
  } catch {}
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const actual = createHash('md5').update(buf).digest('hex');
  if (md5 && actual !== md5) throw new Error(`Checksum mismatch for ${url}`);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  return 'downloaded';
}

const things = await listThings(process.argv.slice(2));
let failures = 0;

for (const { slug, data } of things) {
  const id = polyHavenId(data.credit?.sourceUrl);
  if (!id) {
    console.log(`- ${slug}: not a Poly Haven source, skipping`);
    continue;
  }
  try {
    if (!/^CC0/.test(data.credit.license)) {
      throw new Error(`content says "${data.credit.license}" but Poly Haven assets are CC0`);
    }
    const [info, files] = await Promise.all([getJSON(`${API}/info/${id}`), getJSON(`${API}/files/${id}`)]);
    const authors = Object.keys(info.authors ?? {});
    const missing = authors.filter((a) => !data.credit.author.includes(a));
    if (missing.length) throw new Error(`credit is missing author(s): ${missing.join(', ')}`);

    const entry = files.gltf?.[RESOLUTION]?.gltf;
    if (!entry) throw new Error(`no ${RESOLUTION} glTF download`);
    const dir = polyHavenCacheDir(id);
    const results = [await download(entry.url, path.join(dir, `${id}.gltf`), entry.md5)];
    for (const [rel, file] of Object.entries(entry.include ?? {})) {
      results.push(await download(file.url, path.join(dir, rel), file.md5));
    }
    await writeFile(
      path.join(dir, 'source.json'),
      JSON.stringify({ id, name: info.name, authors, license: 'CC0-1.0', resolution: RESOLUTION, fetched: new Date().toISOString() }, null, 2),
    );
    const fresh = results.filter((r) => r === 'downloaded').length;
    console.log(`✓ ${slug}: ${id} by ${authors.join(', ')} (${fresh} downloaded, ${results.length - fresh} cached)`);
  } catch (err) {
    failures++;
    console.error(`✗ ${slug}: ${err.message}`);
  }
}

process.exitCode = failures ? 1 : 0;
