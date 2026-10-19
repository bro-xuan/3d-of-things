// Writes the parts table (section 6) and the film table (section 8) of objects/<slug>/TRUTH.md from what was
// built: content/<slug>.json and the model's node tree. Run it at stage 7, so the sheet records the object as
// shipped (the plan may have gone straight into content.mjs):
//   npm run truth -- <slug>
// Only the tables are replaced; any notes around them stay.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nodeBounds } from './kit/nodes.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2];
if (!slug) {
  console.error('usage: npm run truth -- <slug>');
  process.exit(1);
}
const sheetFile = path.join(ROOT, 'objects', slug, 'TRUTH.md');
const contentFile = path.join(ROOT, 'content', `${slug}.json`);
for (const file of [sheetFile, contentFile]) {
  if (!existsSync(file)) {
    console.error(`no ${path.relative(ROOT, file)}`);
    process.exit(1);
  }
}
const thing = JSON.parse(readFileSync(contentFile, 'utf8'));
const N = await nodeBounds(slug);

const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
const row = (cells) => `| ${cells.map(cell).join(' | ')} |`;
const table = (head, rows) => [row(head), `|${head.map(() => '---').join('|')}|`, ...rows.map(row)].join('\n');
const labelOf = new Map((thing.parts ?? []).map((p) => [p.node, p.label]));
const name = (node) => labelOf.get(node) ?? node;
const motions = thing.motion ?? [];

/** How a node moves: by its own motion, or with the moving node it hangs from. */
function movesBy(node) {
  const m = motions.find((x) => x.node === node);
  if (m?.crank) return `crank on ${name(m.crank)}`;
  if (m?.cam) return `cam on ${name(m.cam)}`;
  if (m?.control) return `control: ${m.control}`;
  if (m?.clock) return `clock: ${m.clock}`;
  if (m?.train !== undefined) return `clock train, ${m.train} turns a minute`;
  if (m?.swing) return `swing: ${m.swing}`;
  if (m?.wind !== undefined) return 'winding';
  if (m?.speed) return `time, ${+(Math.abs(m.speed) * 60).toFixed(1)} rpm`;
  for (let p = N?.get(node)?.parent; p; p = N.get(p)?.parent) if (motions.some((x) => x.node === p)) return `with ${name(p)}`;
  return '–';
}

const parts = table(
  ['Group', 'Node', 'Label', 'About (one line)', 'Moves by'],
  (thing.parts ?? []).map((p) => [p.group ?? '', `\`${p.node}\``, p.label, p.about, movesBy(p.node)]),
);

const cues = (shot) => (shot.cues ?? []).map((c) => `${c.at} s ${c.do}${c.to !== undefined ? ` → ${c.to}` : ''}${c.over ? ` over ${c.over} s` : ''}`).join('; ');
let clock = 0;
const film = table(
  ['At', 'Chapter', 'Caption', 'Seconds', 'Cues'],
  (thing.film ?? []).map((s) => [`${(clock += s.duration) - s.duration} s`, s.chapter, s.caption, s.duration, cues(s)]),
);

/** Replaces the first table in the section under the heading that starts `## <n>.` (or adds one after its heading). */
function replaceTable(text, n, body) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.startsWith(`## ${n}.`));
  if (start < 0) throw new Error(`no section ${n} in ${path.relative(ROOT, sheetFile)}`);
  let end = lines.findIndex((l, i) => i > start && l.startsWith('## '));
  if (end < 0) end = lines.length;
  const first = lines.findIndex((l, i) => i > start && i < end && l.startsWith('|'));
  if (first < 0) {
    lines.splice(start + 1, 0, '', body);
    return lines.join('\n');
  }
  let last = first;
  while (last + 1 < end && lines[last + 1].startsWith('|')) last++;
  lines.splice(first, last - first + 1, body);
  return lines.join('\n');
}

let sheet = readFileSync(sheetFile, 'utf8');
sheet = replaceTable(sheet, 6, parts);
sheet = replaceTable(sheet, 8, film);
writeFileSync(sheetFile, sheet);
console.log(`${path.relative(ROOT, sheetFile)}: ${thing.parts?.length ?? 0} parts, a film of ${clock} s in ${thing.film?.length ?? 0} shots`);
