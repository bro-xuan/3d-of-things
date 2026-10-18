// The regression test for the content files (and, with --models, the models): re-runs every object's
// builder and fails if that changed a byte of what was there, so the files are always what the code
// makes. Run it after any change to the kit, a content builder or a generator.
//
//   npm run reproduce                 # every objects/<slug>/content.mjs: content/ must not change
//   npm run reproduce -- --models     # rebuild every model first (needs the Poly Haven sources in .cache):
//                                     # public/models/ and objects/*/hints.json must not change either
//
// It compares with the files as they were before it ran (committed or not), and leaves what the builders
// wrote in place, so `git diff` shows the change. CI runs it on a fresh checkout without --models: the
// models are only known to rebuild byte for byte on the Mac they're made on.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { listThings, ROOT } from './lib.mjs';

const models = process.argv.includes('--models');
const node = (file) => execFileSync(process.execPath, [file], { cwd: ROOT, stdio: 'inherit' });
const fail = (message) => {
  console.error(`\nreproduce: ${message}`);
  process.exit(1);
};

const objects = readdirSync(path.join(ROOT, 'objects')).sort();
const builders = objects.filter((d) => existsSync(path.join(ROOT, 'objects', d, 'content.mjs')));
/** The files the builders write, relative to the repo. */
function outputs() {
  const inDir = (dir, ext) => (existsSync(path.join(ROOT, dir)) ? readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith(ext)).map((f) => `${dir}/${f}`) : []);
  const hints = objects.map((d) => `objects/${d}/hints.json`).filter((f) => existsSync(path.join(ROOT, f)));
  return [...inDir('content', '.json'), ...(models ? [...inDir('public/models', '.glb'), ...hints] : [])];
}
const read = (file) => (existsSync(path.join(ROOT, file)) ? readFileSync(path.join(ROOT, file)) : null);

// Every content file has a builder, so none can drift from the code.
const orphans = (await listThings()).map((t) => t.slug).filter((s) => !builders.includes(s));
if (orphans.length) fail(`no objects/<slug>/content.mjs for ${orphans.join(', ')}: every content file is written by its builder`);

const before = new Map(outputs().map((f) => [f, read(f)]));
const started = Date.now();
if (models) node(path.join(ROOT, 'scripts', 'build-models.mjs'));
for (const slug of builders) node(path.join(ROOT, 'objects', slug, 'content.mjs'));

const changed = [];
for (const file of new Set([...before.keys(), ...outputs()])) {
  const [was, now] = [before.get(file) ?? null, read(file)];
  if (was && now && was.equals(now)) continue;
  if (!was || !now) {
    changed.push(`${file}: ${was ? 'deleted' : 'new'}`);
    continue;
  }
  if (!file.endsWith('.json')) {
    changed.push(`${file}: ${was.length} → ${now.length} bytes`);
    continue;
  }
  const [a, b] = [was.toString('utf8').split('\n'), now.toString('utf8').split('\n')];
  const line = a.findIndex((l, i) => l !== b[i]);
  changed.push(`${file}: from line ${line + 1}\n      was ${a[line]?.trim() ?? '(end of file)'}\n      now ${b[line]?.trim() ?? '(end of file)'}`);
}
const seconds = ((Date.now() - started) / 1000).toFixed(0);
if (changed.length) fail(`${changed.length} file${changed.length === 1 ? '' : 's'} came out different (git diff shows how):\n  ${changed.join('\n  ')}`);
console.log(`\nreproduce: ${builders.length} content files${models ? `, ${outputs().length - builders.length} models and hints` : ''} rebuilt in ${seconds} s, all identical`);
