// Checks content files against their models, without a browser, in about a second:
// every node a content file names exists, every mesh belongs to a part, positions
// sit on the model, charts and experiments exist, the credit is complete, the object's
// posters are there, and its builder and truth sheet sit in objects/<slug>/.
//
//   npm run check                 # every object
//   npm run check -- slug         # just one
//   npm run check -- slug --json  # machine-readable, for the QA runner
//
// Errors make it exit 1. Warnings are things a finished object shouldn't have
// but that don't break the page.
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { listThings, PUBLIC_DIR, ROOT } from './lib.mjs';

const args = process.argv.slice(2);
const listOnly = args.includes('--list');
const asJson = args.includes('--json');
const only = args.filter((a) => !a.startsWith('--'));

await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const exists = (file) => access(file).then(() => true, () => false);

const CATEGORIES = await categoryIds();
const CHARTS = await chartNames();
const CUES = await cueNames();

/** Category ids from src/content.ts, so a new category only has to be added there. */
async function categoryIds() {
  const src = await readFile(path.join(ROOT, 'src/content.ts'), 'utf8');
  return new Set([...src.matchAll(/\{\s*id:\s*'([\w-]+)'/g)].map((m) => m[1]));
}

/** Chart names a step can ask for: the keys of every `Record<string, ChartFactory>` in src/charts
 *  (each object's charts, and the generic ones that src/charts/index.ts adds). */
async function chartNames() {
  const names = new Set();
  const dir = path.join(ROOT, 'src/charts');
  for (const file of await readdir(dir)) {
    if (!file.endsWith('.ts')) continue;
    const src = await readFile(path.join(dir, file), 'utf8');
    for (const [, body] of src.matchAll(/Record<string,\s*ChartFactory>\s*=\s*\{([^}]*)\}/g)) {
      for (const entry of body.split(',').map((e) => e.trim()).filter((e) => e && !e.startsWith('...'))) {
        const m = /^'([^']+)'\s*:/.exec(entry) ?? /^([A-Za-z_$][\w$]*)\s*(?::|$)/.exec(entry);
        if (m) names.add(m[1]);
      }
    }
  }
  return names;
}

/** Experiment names (`try`) handled in src/pages/tour.ts. */
/** The verbs a film's cues can use: the keys of `CUES` in src/pages/film.ts. */
async function cueNames() {
  const src = await readFile(path.join(ROOT, 'src/pages/film.ts'), 'utf8');
  const body = src.slice(src.indexOf('export const CUES'), src.indexOf('\n};', src.indexOf('export const CUES')));
  const names = new Set();
  for (const m of body.matchAll(/^\s+'?([a-z][a-z-]*)'?: \{ kind:/gm)) names.add(m[1]);
  return names;
}

/** The model as the viewer sees it: hidden nodes left out, positions in model space. */
async function loadModel(thing) {
  const doc = await io.read(path.join(PUBLIC_DIR, thing.model));
  const hidden = new Set(thing.hide ?? []);
  const names = new Set(doc.getRoot().listNodes().map((n) => n.getName()));
  const missingHidden = [...hidden].filter((name) => !names.has(name));
  for (const node of doc.getRoot().listNodes()) if (hidden.has(node.getName())) node.dispose();
  const scene = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0];
  const { min, max } = getBounds(scene);
  const size = max.map((v, i) => v - min[i]);
  const scale = 1 / (0.5 * Math.hypot(...size));
  const offset = [-(min[0] + max[0]) / 2, -min[1], -(min[2] + max[2]) / 2];
  const toModel = (p) => p.map((v, i) => (v + offset[i]) * scale);
  const nodes = new Map();
  const parent = new Map();
  for (const node of doc.getRoot().listNodes()) {
    nodes.set(node.getName(), node);
    for (const child of node.listChildren()) parent.set(child, node);
  }
  const lo = toModel(min);
  const hi = toModel(max);
  return { doc, nodes, parent, lo, hi, realSize: size, toModel, missingHidden };
}

function checkThing(slug, thing, model, orders) {
  const errors = [];
  const warnings = [];
  const err = (where, msg) => errors.push(`${where}: ${msg}`);
  const warn = (where, msg) => warnings.push(`${where}: ${msg}`);
  const isVec = (v) => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite);
  const node = (where, name) => {
    if (typeof name !== 'string' || !model.nodes.has(name)) err(where, `no node "${name}" in ${thing.model}`);
  };
  // A point in model space should sit on the model, give or take a margin for labels just off a surface.
  // Far off (a whole unit, half the model's diagonal, past the margin) it's a slip, such as millimetres
  // pasted where model units belong, and the viewer would hide it past the stage's edge.
  const onModel = (where, p, margin = 0.15) => {
    if (!isVec(p)) return err(where, `not a model-space point: ${JSON.stringify(p)}`);
    const off = Math.max(...p.map((v, i) => Math.max(model.lo[i] - v, v - model.hi[i])));
    if (off <= margin) return;
    const msg = `[${p.map((v) => v.toFixed(3))}] is ${off.toFixed(2)} off the model (bounds [${model.lo.map((v) => v.toFixed(2))}] to [${model.hi.map((v) => v.toFixed(2))}])`;
    (off > margin + 1 ? err : warn)(where, msg);
  };

  for (const key of ['title', 'hook', 'category', 'model', 'credit']) if (!thing[key]) err('content', `missing "${key}"`);
  if (!Array.isArray(thing.summary) || !thing.summary.length) err('content', 'missing "summary" (paragraphs)');
  if (thing.category && !CATEGORIES.has(thing.category)) err('content', `unknown category "${thing.category}" (add it to src/content.ts)`);
  if (!Number.isFinite(thing.order)) err('content', 'missing "order"');
  else if (orders.get(thing.order)?.length > 1) err('content', `order ${thing.order} is shared with ${orders.get(thing.order).filter((s) => s !== slug).join(', ')}`);
  if (!thing.facts?.length) warn('content', 'no facts');
  for (const name of model.missingHidden) err('hide', `no node "${name}" in ${thing.model}`);

  const credit = thing.credit ?? {};
  for (const key of ['title', 'author', 'license', 'licenseUrl', 'source']) if (!credit[key]) err('credit', `missing "${key}"`);
  if (typeof credit.sourceUrl !== 'string') err('credit', 'missing "sourceUrl" (empty string for a model built in code)');
  if (credit.sourceUrl === '' && !thing.build?.generate) warn('credit', 'empty sourceUrl but no build.generate: where does the model come from?');

  // Parts
  const partNodes = new Set();
  const labels = new Map();
  (thing.parts ?? []).forEach((part, i) => {
    const where = `parts[${i}] "${part.label ?? part.node}"`;
    node(where, part.node);
    partNodes.add(part.node);
    for (const w of part.with ?? []) { node(`${where} with`, w); partNodes.add(w); }
    if (!part.label) err(where, 'missing label');
    else if (labels.has(part.label)) warn(where, `label also used by parts[${labels.get(part.label)}]`);
    else labels.set(part.label, i);
    if (!isVec(part.direction) || part.direction.every((v) => v === 0)) err(where, 'direction must be a non-zero vector');
    if (!Number.isFinite(part.distance) || part.distance < 0) err(where, 'distance must be a number ≥ 0');
    if (part.window && !(part.window[0] >= 0 && part.window[1] <= 1 && part.window[0] < part.window[1])) err(where, `window ${JSON.stringify(part.window)} must be [start, end] within 0–1`);
    if (!part.about) warn(where, 'no "about": clicking it shows nothing');
  });
  if (!thing.parts?.length) err('parts', 'no parts');

  // Every mesh belongs to the nearest part above it, or a click on it shows nothing.
  const loose = [];
  for (const [name, n] of model.nodes) {
    if (!n.getMesh()) continue;
    let p = n;
    while (p && !partNodes.has(p.getName())) p = model.parent.get(p);
    if (!p) loose.push(name);
  }
  if (loose.length) err('parts', `${loose.length} mesh${loose.length > 1 ? 'es' : ''} in no part: ${loose.slice(0, 12).join(', ')}${loose.length > 12 ? ', …' : ''}`);

  // Callouts
  (thing.annotations ?? []).forEach((a, i) => {
    const where = `annotations[${i}] "${a.title}"`;
    if (!a.title || !a.text) err(where, 'needs a title and text');
    if (a.node) node(where, a.node);
    onModel(where, a.position);
    if (a.camera && !(isVec(a.camera.position) && isVec(a.camera.target))) err(where, 'camera needs position and target');
    if (a.explode !== undefined && !(a.explode >= 0 && a.explode <= 1)) err(where, 'explode must be 0–1');
  });
  if (!thing.annotations?.length) warn('annotations', 'no callouts');

  // Motions
  (thing.motion ?? []).forEach((m, i) => {
    const where = `motion[${i}] ${m.node}`;
    node(where, m.node);
    if (!isVec(m.axis) || m.axis.every((v) => v === 0)) err(where, 'axis must be a non-zero vector');
    if (m.pivot) onModel(`${where} pivot`, m.pivot, 0.3);
    if (m.crank) node(`${where} crank`, m.crank);
    if (m.cam) node(`${where} cam`, m.cam);
    if (m.rocker) node(`${where} rocker`, m.rocker);
    if (m.coupler) node(`${where} coupler`, m.coupler);
    for (const key of ['pin', 'at']) if (m[key]) onModel(`${where} ${key}`, m[key], 0.3);
  });

  if (!thing.film?.length) warn('film', 'no "How it works" film');
  if (thing.how) err('how', 'the old step-by-step tour: make it a film (references/film.md) and delete `how`');

  // How it works, as a film (references/film.md)
  let filmTime = 0;
  (thing.film ?? []).forEach((shot, i) => {
    const where = `film[${i}] "${shot.chapter}"`;
    if (!shot.chapter || !shot.caption) err(where, 'needs a chapter and a caption');
    if (shot.caption?.length > 110) warn(where, `caption is ${shot.caption.length} characters: keep it to one line (110)`);
    if (!(shot.duration >= 3 && shot.duration <= 10)) warn(where, `lasts ${shot.duration} s: a shot is 3–10 s`);
    filmTime += shot.duration ?? 0;
    for (const key of ['focus', 'frame', 'hide']) for (const name of shot[key] ?? []) node(`${where} ${key}`, name);
    for (const name of Object.keys(shot.spin ?? {})) node(`${where} spin`, name);
    for (const tag of shot.tags ?? []) { node(`${where} tag "${tag.text}"`, tag.node); if (tag.at) onModel(`${where} tag "${tag.text}"`, tag.at); }
    for (const flow of [shot.flow ?? [], ...(shot.flows ?? [])]) {
      for (const p of flow) {
        if (Array.isArray(p)) onModel(`${where} flow`, p, 1);
        else { node(`${where} flow`, p.node); onModel(`${where} flow`, p.at, 1); }
      }
    }
    for (const cue of shot.cues ?? []) {
      if (CUES.size && !CUES.has(cue.do)) err(where, `no cue "${cue.do}" in src/pages/film.ts`);
      if (!(cue.at >= 0 && cue.at + (cue.over ?? 0) <= shot.duration + 1e-6)) warn(where, `cue "${cue.do}" runs past the shot (at ${cue.at} + ${cue.over ?? 0} s of ${shot.duration} s)`);
    }
    if (typeof shot.chart === 'string' && CHARTS.size && !CHARTS.has(shot.chart)) err(where, `no chart "${shot.chart}" in src/charts`);
    if (shot.explode !== undefined && !(shot.explode >= 0 && shot.explode <= 1)) err(where, 'explode must be 0–1');
  });
  if (thing.film?.length && !(filmTime >= 12 && filmTime <= 30)) warn('film', `lasts ${filmTime.toFixed(1)} s: a film is 15–25 s, 30 at most`);
  const focusSets = new Set((thing.film ?? []).map((shot) => JSON.stringify(shot.focus ?? null)));
  if (focusSets.size > 2) warn('film', `${focusSets.size} different focus sets: keep one (two at most), so parts don't flick between solid and glass`);

  for (const [i, jet] of (thing.jets ?? []).entries()) { node(`jets[${i}]`, jet.node); onModel(`jets[${i}]`, jet.at, 0.3); }

  // Text the scaffold left to write.
  const todo = [];
  const walk = (v, where) => {
    if (typeof v === 'string' && /\bTODO\b/.test(v)) todo.push(where);
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${where}[${i}]`));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, where ? `${where}.${k}` : k);
  };
  walk(thing, '');
  if (todo.length) warn('text', `${todo.length} unfinished (TODO): ${todo.slice(0, 6).join(', ')}${todo.length > 6 ? ', …' : ''}`);
  return { errors, warnings };
}

if (listOnly) {
  console.log(`charts (${CHARTS.size}): ${[...CHARTS].sort().join(', ')}`);
  console.log(`film cues (${CUES.size}): ${[...CUES].sort().join(', ')}`);
  console.log(`categories: ${[...CATEGORIES].join(', ')}`);
  process.exit(0);
}

const things = await listThings(only);
const all = await listThings();
const orders = new Map();
for (const { slug, data } of all) orders.set(data.order, [...(orders.get(data.order) ?? []), slug]);

const report = [];
for (const { slug, data } of things) {
  const result = { slug, errors: [], warnings: [] };
  try {
    if (!(await exists(path.join(PUBLIC_DIR, data.model ?? '')))) {
      result.errors.push(`model: ${data.model} not built (npm run models:build -- ${slug})`);
    } else {
      const model = await loadModel(data);
      Object.assign(result, checkThing(slug, data, model, orders));
      result.size = model.realSize.map((v) => +(v * 1000).toFixed(1));
    }
    for (const file of [`${slug}-800.webp`, `${slug}-exploded-800.webp`, `${slug}-thumb.webp`]) {
      if (!(await exists(path.join(PUBLIC_DIR, 'posters', file)))) result.warnings.push(`posters: no ${file} (npm run posters -- ${slug})`);
    }
    for (const key of ['generate', 'augment']) {
      if (data.build?.[key] && !(await exists(path.join(ROOT, data.build[key])))) result.errors.push(`build.${key}: ${data.build[key]} not found`);
    }
    // The standard layout: the content file is written by objects/<slug>/content.mjs, from the truth sheet beside it.
    if (!(await exists(path.join(ROOT, 'objects', slug, 'content.mjs')))) result.errors.push(`layout: no objects/${slug}/content.mjs, so content/${slug}.json can't be rebuilt (npm run reproduce)`);
    if (!(await exists(path.join(ROOT, 'objects', slug, 'TRUTH.md')))) result.warnings.push(`layout: no objects/${slug}/TRUTH.md (the truth sheet; template in .claude/skills/3d-of-things/templates/)`);
  } catch (e) {
    result.errors.push(`could not check: ${e.message}`);
  }
  report.push(result);
}

if (asJson) console.log(JSON.stringify(report, null, 2));
else {
  for (const r of report) {
    const mark = r.errors.length ? '✗' : r.warnings.length ? '△' : '✓';
    console.log(`${mark} ${r.slug}${r.size ? `  (${r.size.join(' × ')} mm)` : ''}`);
    for (const e of r.errors) console.log(`    error   ${e}`);
    for (const w of r.warnings) console.log(`    warning ${w}`);
  }
  const e = report.reduce((n, r) => n + r.errors.length, 0);
  const w = report.reduce((n, r) => n + r.warnings.length, 0);
  console.log(`\n${report.length} checked: ${e} error${e === 1 ? '' : 's'}, ${w} warning${w === 1 ? '' : 's'}`);
}
process.exitCode = report.some((r) => r.errors.length) ? 1 : 0;
