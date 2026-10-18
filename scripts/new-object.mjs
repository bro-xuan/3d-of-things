// Starts a new object the standard way (stage 2 of the /3d-of-things skill): its folder, truth sheet,
// content builder and, for a model opened or built in code, its build step. Then it builds the
// model and writes the content file once, so the page opens within minutes and is deepened from
// there.
//
//   npm run new -- <slug> --tier C [--title "Gear Pair"] [--category gears]     # built in code
//   npm run new -- <slug> --tier A --polyhaven <asset_id>    # a Poly Haven model with its parts separate
//   npm run new -- <slug> --tier B --polyhaven <asset_id>    # a Poly Haven shell, opened in code
//
// Files: objects/<slug>/TRUTH.md, content.mjs, and generate.mjs (C) or augment.mjs (B), from the
// skill's templates; content/<slug>.json and public/models/<slug>.glb come from them.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { listThings, ROOT } from './lib.mjs';
import { nodeBounds } from './kit/nodes.mjs';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const valued = new Set(['--tier', '--polyhaven', '--title', '--category', '--order']);
const slug = args.find((a, i) => !a.startsWith('--') && !valued.has(args[i - 1]));
const tier = (opt('--tier') ?? '').toUpperCase();
const ph = opt('--polyhaven');
const started = Date.now();

const fail = (message) => { console.error(`new: ${message}`); process.exit(1); };
if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) fail('name it with a slug of lowercase letters, digits and hyphens: npm run new -- <slug> --tier A|B|C');
if (!['A', 'B', 'C'].includes(tier)) fail('pick a tier: --tier A (a Poly Haven model with its parts), B (a shell to open in code) or C (built in code)');
if (tier !== 'C' && !ph) fail(`tier ${tier} starts from a Poly Haven model: add --polyhaven <asset_id> (https://polyhaven.com/a/<asset_id>)`);
const dir = path.join(ROOT, 'objects', slug);
if (existsSync(dir) || existsSync(path.join(ROOT, 'content', `${slug}.json`))) fail(`${slug} exists already`);

const categories = [...readFileSync(path.join(ROOT, 'src/content.ts'), 'utf8').matchAll(/\{\s*id:\s*'([\w-]+)'/g)].map((m) => m[1]);
const category = opt('--category') ?? categories[0];
if (!categories.includes(category)) fail(`category "${category}" isn't one of ${categories.join(', ')} (a new one goes in src/content.ts and src/types.ts)`);
const order = Number(opt('--order') ?? Math.max(0, ...(await listThings()).map((t) => t.data.order ?? 0)) + 1);

let info = null;
if (ph) {
  const res = await fetch(`https://api.polyhaven.com/info/${ph}`, { headers: { 'User-Agent': '3d-of-things model pipeline' } });
  if (!res.ok) fail(`Poly Haven has no asset "${ph}" (${res.status})`);
  info = await res.json();
}
const title = opt('--title') ?? info?.name ?? slug.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
const authors = Object.keys(info?.authors ?? {}).join(' & ');
const vars = {
  SLUG: slug,
  TITLE: title.replace(/'/g, '’'),
  CATEGORY: category,
  ORDER: String(order),
  TIER: tier,
  DATE: new Date().toISOString().slice(0, 10),
  MODEL_BUDGET: { A: '5 min', B: '30 min', C: '35 min' }[tier],
  PH_ID: ph ?? '',
  PH_NAME: (info?.name ?? '').replace(/'/g, '’'),
  PH_AUTHORS: authors.replace(/'/g, '’'),
  PARTS: '',
  BUILD: tier === 'B' ? `  build: { augment: 'objects/${slug}/augment.mjs', hints: 'objects/${slug}/hints.json' },\n` : '',
};
const TEMPLATES = path.join(ROOT, '.claude/skills/3d-of-things/templates');
const fill = (name, extra = {}) => readFileSync(path.join(TEMPLATES, name), 'utf8').replace(/__([A-Z_]+?)__/g, (m, key) => ({ ...vars, ...extra })[key] ?? m);
const run = (cmd, ...rest) => execFileSync(cmd, rest, { cwd: ROOT, stdio: 'inherit' });
const contentBuilder = path.join(dir, 'content.mjs');

mkdirSync(dir, { recursive: true });
writeFileSync(path.join(dir, 'TRUTH.md'), fill('TRUTH.md'));
if (tier === 'C') {
  writeFileSync(path.join(dir, 'generate.mjs'), fill('generate.mjs'));
  writeFileSync(contentBuilder, fill('content-built.mjs'));
} else {
  if (tier === 'B') writeFileSync(path.join(dir, 'augment.mjs'), fill('augment.mjs'));
  writeFileSync(contentBuilder, fill('content-sourced.mjs'));
}
console.log(`new: objects/${slug}/ (tier ${tier}), order ${order}, category ${category}`);

// A first content file (so the build knows where the model comes from), the model, then the content again
// with the model's real positions.
run(process.execPath, contentBuilder);
try {
  if (ph) run('npm', 'run', '-s', 'models:fetch', '--', slug);
  run('npm', 'run', '-s', 'models:build', '--', slug);
} catch {
  fail(`the first build failed (above). Fix objects/${slug}/, then: npm run models:build -- ${slug} && node objects/${slug}/content.mjs`);
}
if (tier !== 'C') {
  // List the model's parts from its nodes: each mesh a part that comes off away from the middle.
  const N = await nodeBounds(slug);
  const middle = [0, Math.max(...[...N.values()].map((b) => b.max[1])) / 2, 0];
  const parts = [...N].filter(([, b]) => b.mesh).map(([node, b]) => {
    const d = b.centre.map((v, i) => v - middle[i]);
    const len = Math.hypot(...d);
    const direction = len < 0.05 ? [0, 1, 0] : d.map((v) => +(v / len).toFixed(2));
    // Poly Haven names nodes <asset>_<part>: the part is what the label needs.
    const label = node.replace(new RegExp(`^${ph}[_-]?`, 'i'), '').replace(/[_-]+/g, ' ').replace(/\s+\d+$/, '').trim().replace(/^\w/, (c) => c.toUpperCase()) || node;
    return `    { node: '${node}', label: '${label.replace(/'/g, '’')}', group: 'Parts', about: 'TODO', direction: [${direction.join(', ')}], distance: 0.3 },`;
  });
  writeFileSync(contentBuilder, fill('content-sourced.mjs', { PARTS: parts.join('\n') }));
  console.log(`new: listed ${parts.length} parts from the model's nodes`);
  if (tier === 'A' && parts.length < 3) console.log(`new: only ${parts.length} mesh${parts.length === 1 ? '' : 'es'}: there's little to take apart. Tier B (cut the shell open and generate the insides) fits this model better.`);
}
run(process.execPath, contentBuilder);
try {
  run('npm', 'run', '-s', 'check', '--', slug);
} catch {
  // A new object has unfinished text; the check says what's left.
}
console.log(`
new: ${slug} is on the site in ${((Date.now() - started) / 1000).toFixed(0)} s (npm run dev → #/thing/${slug}).
Next, as in .claude/skills/3d-of-things/SKILL.md:
  1. Fill objects/${slug}/TRUTH.md: sources, numbers, energy chain, parts, tour.
  2. ${tier === 'A' ? `Group and describe the parts in objects/${slug}/content.mjs` : `Build the object in objects/${slug}/${tier === 'B' ? 'augment' : 'generate'}.mjs`}, then loop:
       npm run models:build -- ${slug} && node objects/${slug}/content.mjs && npm run check -- ${slug}
       npm run qa -- ${slug} --model        (views and explode, ~15 s)
  3. Write the content, then: npm run qa -- ${slug}   (everything, ~1 min)
  4. Ship: npm run posters -- ${slug}, the README's model table, npm run build.`);
