// Bakes the site into another one: builds it to be served from a path on that site (its mount)
// and copies the build into the host's public folder. It's how 3D of Things gets onto
// afrodance.fun/3d-of-everything:
//
//   npm run export -- --out ../afrodance.fun/public/3d-of-everything   # the mount is the path after public/
//   npm run export -- --out <folder> --mount /3d-of-everything          # or name it
//
// skill.html becomes the mount's index.html and the gallery <mount>/objects/index.html; every other URL is
// a file under the mount (vite.config.ts). A host that doesn't serve a folder's index.html needs two
// rewrites for that, printed at the end. The folder is replaced, but only if it's empty or holds an
// earlier export: that one carries .3d-of-things.json, which also names the commit it was built from.
import { execFileSync } from 'node:child_process';
import { cp, mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { listThings, ROOT } from './lib.mjs';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const fail = (message) => { console.error(`export: ${message}`); process.exit(1); };
const MARK = '.3d-of-things.json';
const started = Date.now();

if (!opt('--out')) fail('say where it goes: npm run export -- --out <host>/public/<path>');
const out = path.resolve(opt('--out'));
const underPublic = out.split(`${path.sep}public${path.sep}`);
const mount = (opt('--mount') ?? (underPublic.length > 1 ? `/${underPublic.pop().split(path.sep).join('/')}` : '')).replace(/\/+$/, '');
if (!/^(\/[\w.-]+)+$/.test(mount)) fail(`name the path it's served at: --mount /<path>${mount ? ` (not "${mount}")` : ''}`);

const there = await readdir(out).catch(() => []);
if (there.length && !there.includes(MARK)) fail(`${out} holds other files: export into an empty folder or over an earlier export`);

// The production build (type-check, then Vite), with every URL under the mount.
const build = path.join(ROOT, '.cache', 'export');
execFileSync('npm', ['run', '-s', 'build', '--', '--outDir', build, '--emptyOutDir'], { cwd: ROOT, stdio: 'inherit', env: { ...process.env, SITE_MOUNT: mount } });

const things = await listThings();
const skill = await readFile(path.join(build, 'skill.html'), 'utf8');
const gallery = await readFile(path.join(build, 'index.html'), 'utf8');
const models = await readdir(path.join(build, 'models'));
const problems = [
  skill.includes('%OBJECTS%') && 'skill.html still has %OBJECTS% in it',
  !skill.includes(`href="${mount}/objects#/thing/`) && `skill.html doesn't link to ${mount}/objects`,
  !gallery.includes(`src="${mount}/assets/`) && `index.html doesn't load its script from ${mount}/assets/`,
  ...things.filter((t) => !models.includes(path.basename(t.data.model))).map((t) => `no model for ${t.slug}`),
].filter(Boolean);
if (problems.length) fail(problems.join('; '));

if (await stat(path.join(build, 'objects')).catch(() => null)) fail('the build has an objects/ folder, where the gallery goes');
await rm(out, { recursive: true, force: true });
// robots.txt only counts at a site's root, so it stays behind.
await cp(build, out, { recursive: true, filter: (from) => path.basename(from) !== 'robots.txt' });
// Laid out as folders, the way static hosts serve them: the skill's page is the mount's index.html and the gallery
// is objects/index.html. A host that answers a folder with its index.html (Vercel does, before any rewrite) then
// serves both pages at their clean URLs; left as skill.html beside the gallery's index.html, the gallery took the mount.
await mkdir(path.join(out, 'objects'));
await rename(path.join(out, 'index.html'), path.join(out, 'objects', 'index.html'));
await rename(path.join(out, 'skill.html'), path.join(out, 'index.html'));
const commit = await headCommit();
await writeFile(path.join(out, MARK), `${JSON.stringify({ from: 'github.com/bro-xuan/3d-of-things', commit, built: new Date().toISOString(), mount }, null, 2)}\n`);

let files = 0;
let bytes = 0;
for (const entry of await readdir(out, { withFileTypes: true, recursive: true })) {
  if (!entry.isFile()) continue;
  files += 1;
  bytes += (await stat(path.join(entry.parentPath, entry.name))).size;
}
console.log(`\nexport: ${things.length} objects, ${files} files, ${(bytes / 1e6).toFixed(1)} MB → ${path.relative(process.cwd(), out)}, served at ${mount}, from ${commit?.slice(0, 7) ?? 'an unknown commit'} (uncommitted changes aren't recorded) in ${((Date.now() - started) / 1000).toFixed(0)} s`);
console.log(`
The skill's page is ${mount}/index.html and the gallery ${mount}/objects/index.html. A host that serves a folder's
index.html (Vercel, Netlify, most static servers) needs nothing more; Next.js's own server (next start) doesn't, so
add these to next.config.ts:

  async rewrites() {
    return [
      { source: '${mount}', destination: '${mount}/index.html' },
      { source: '${mount}/objects', destination: '${mount}/objects/index.html' },
    ];
  }`);

/** The commit the working tree is on, read from .git itself (the git on PATH may not run). */
async function headCommit() {
  try {
    let dir = path.join(ROOT, '.git');
    if ((await stat(dir)).isFile()) dir = path.resolve(ROOT, (await readFile(dir, 'utf8')).replace(/^gitdir:\s*/, '').trim());
    const head = (await readFile(path.join(dir, 'HEAD'), 'utf8')).trim();
    if (!head.startsWith('ref: ')) return head;
    const ref = head.slice(5);
    // A worktree keeps its branches in the main repository's folder.
    const common = await readFile(path.join(dir, 'commondir'), 'utf8').then((c) => path.resolve(dir, c.trim())).catch(() => dir);
    const loose = await readFile(path.join(common, ref), 'utf8').catch(() => '');
    if (loose) return loose.trim();
    const packed = await readFile(path.join(common, 'packed-refs'), 'utf8').catch(() => '');
    return packed.split('\n').find((line) => line.endsWith(` ${ref}`))?.split(' ')[0] ?? null;
  } catch {
    return null;
  }
}
