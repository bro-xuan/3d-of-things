// Where did a build's time go? Reads Claude Code session transcripts and splits the active
// time (gaps of over 10 minutes with nothing running count as away) by stage of the standard
// procedure, so each new object's build can be measured and compared.
//
//   npm run timing                                  # the newest session of this project
//   npm run timing -- <session.jsonl> [more.jsonl]
//   npm run timing -- --item reflex-camera=hasselblad|reflex   # only calls that touch it
//   npm run timing -- --since 2026-10-18T09:00 --until 2026-10-18T11:00
//
// Time with a tool running is charged to that tool; the model's own time before a call is
// charged to the call it led to.
import { createReadStream } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';

const IDLE = 10 * 60e3;
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const item = opt('--item');
const since = opt('--since') ? Date.parse(opt('--since')) : -Infinity;
const until = opt('--until') ? Date.parse(opt('--until')) : Infinity;
const files = args.filter((a, i) => a.endsWith('.jsonl') && !['--item', '--since', '--until'].includes(args[i - 1]));
const [itemName, itemPattern] = item ? item.split('=') : [];
const itemRe = item ? new RegExp(itemPattern ?? itemName, 'i') : null;

/** Stages of the standard procedure (see .claude/skills/3d-of-things/references/procedure.md). */
function stageOf(name, input = {}) {
  if (name === 'Bash') {
    const c = String(input.command ?? '');
    if (/capture-posters|npm run (-s )?posters/.test(c)) return ['ship', 'posters'];
    if (/npm run (-s )?(check|qa)\b|check-content|scripts\/qa\//.test(c)) return ['check', 'check & qa runner'];
    if (/playwright|chromium|qa\/|qa-|drive\.mjs|shoot\.mjs|page\.mjs|tour\.mjs|callouts|screenshot|clock-|experiments\.mjs|lighthouse/i.test(c)) return ['check', 'hand-made browser QA'];
    if (/models:build|build-models|\/build\.mjs|generate\.mjs|contacts\.mjs|clash/.test(c)) return ['model', 'model build'];
    if (/content[-\w]*\.mjs/.test(c)) return ['content', 'content build'];
    if (/\btsc\b|typecheck|npm run (-s )?build|vite build/.test(c)) return ['ship', 'typecheck & build'];
    if (/curl|wget|polyhaven|sketchfab|models:fetch|fetch-models/.test(c)) return ['research', 'download'];
    if (/models:inspect|inspect-model|\.glb/.test(c)) return ['model', 'model inspect'];
    if (/^\s*(cd [^&]+&&\s*)?(ls|cat|head|tail|grep|rg|sed -n|wc|find|stat|du|date|echo)\b/.test(c)) return ['orientation', 'look at files'];
    return ['other', 'other commands'];
  }
  if (name === 'Read') return /\.(png|jpe?g|webp)$/i.test(input.file_path ?? '') ? ['check', 'look at screenshots'] : ['orientation', 'read code'];
  if (/^(Edit|Write|MultiEdit|NotebookEdit)$/.test(name)) {
    const p = String(input.file_path ?? '');
    if (/\/content\/|content[-\w]*\.mjs|hints\.json/.test(p)) return ['content', 'write content'];
    if (/\.cache\/|scripts\/qa\//.test(p)) return ['check', 'write QA tools'];
    if (/\/scripts\//.test(p)) return ['model', 'write model code'];
    if (/src\/charts/.test(p)) return ['mechanism', 'write charts'];
    if (/\/src\//.test(p)) return ['mechanism', 'write viewer code'];
    return ['other', 'write other'];
  }
  if (/^(Grep|Glob|LS|ToolSearch)$/.test(name)) return ['orientation', 'look at files'];
  if (/^(WebSearch|WebFetch)$/.test(name)) return ['research', 'web research'];
  if (/^(Agent|Task|SendMessage)$/.test(name)) return ['other', 'subagents'];
  if (/Todo|Task(Create|Update|List)|AskUserQuestion/.test(name)) return ['other', 'planning & questions'];
  return ['other', name];
}

/** The newest session of this project: Claude Code keeps them in ~/.claude/projects/<the path, dashed>/.
 *  A worktree beside the repo (3d-of-things-skill) also finds the repo's own sessions. */
async function newestTranscript() {
  const root = path.join(os.homedir(), '.claude', 'projects');
  const here = process.cwd().replace(/[^a-zA-Z0-9]/g, '-');
  const dirs = (await readdir(root).catch(() => [])).filter((d) => here === d || here.startsWith(`${d}-`));
  const found = [];
  for (const d of dirs) {
    for (const f of (await readdir(path.join(root, d))).filter((f) => f.endsWith('.jsonl'))) {
      found.push([path.join(root, d, f), (await stat(path.join(root, d, f))).mtimeMs]);
    }
  }
  if (!found.length) {
    console.error(`timing: no sessions recorded for ${process.cwd()}; name one: npm run timing -- ~/.claude/projects/<dir>/<session>.jsonl`);
    process.exit(2);
  }
  return found.sort((a, b) => b[1] - a[1])[0][0];
}

async function readEvents(file) {
  const events = [];
  const rl = readline.createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.startsWith('{')) continue;
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    if (!o.timestamp || o.isSidechain) continue;
    const t = Date.parse(o.timestamp);
    if (t < since || t > until) continue;
    const content = o.message?.content;
    if (o.type === 'queue-operation' && o.operation === 'enqueue' && typeof o.content === 'string' && !o.content.startsWith('<')) {
      events.push({ t, kind: 'human' });
    } else if (o.type === 'user' && o.origin?.kind === 'human') {
      events.push({ t, kind: 'human' });
    } else if (o.type === 'user' && Array.isArray(content)) {
      for (const c of content) if (c.type === 'tool_result') events.push({ t, kind: 'result', id: c.tool_use_id });
    } else if (o.type === 'assistant' && Array.isArray(content)) {
      for (const c of content) {
        if (c.type === 'tool_use') events.push({ t, kind: 'tool', id: c.id, name: c.name, input: c.input });
        else events.push({ t, kind: 'model' });
      }
    }
  }
  return events.sort((a, b) => a.t - b.t);
}

const fmt = (ms) => { const m = Math.round(ms / 60e3); return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}` : `${m} min`; };

for (const file of files.length ? files : [await newestTranscript()]) {
  const events = await readEvents(file);
  const ends = new Map(events.filter((e) => e.kind === 'result').map((e) => [e.id, e.t]));
  const tools = events.filter((e) => e.kind === 'tool').map((e) => {
    let end = ends.get(e.id) ?? e.t;
    // Background jobs and anything past a foreground command's 10-minute limit don't own the clock.
    if (e.input?.run_in_background || end - e.t > 11 * 60e3) end = e.t;
    const [stage, what] = stageOf(e.name, e.input);
    return { ...e, end, stage, what, mine: !itemRe || itemRe.test(JSON.stringify(e.input ?? {})) };
  });
  // Calls that don't name the object belong to it when they sit between ones that do.
  if (itemRe) { let last = false; for (const x of tools) { if (itemRe.test(JSON.stringify(x.input ?? {}))) last = true; else if (/^(Edit|Write|Bash)$/.test(x.name) && /content\/|scripts\//.test(JSON.stringify(x.input ?? {}))) last = false; x.mine = last; } }

  const byWhat = new Map();
  const byStage = new Map();
  let active = 0;
  let idle = 0;
  const charge = (x, ms, kind) => {
    if (!x.mine) return;
    active += ms;
    byStage.set(x.stage, (byStage.get(x.stage) ?? 0) + ms);
    const r = byWhat.get(x.what) ?? { stage: x.stage, tool: 0, model: 0, calls: new Set() };
    r[kind] += ms;
    r.calls.add(x.id);
    byWhat.set(x.what, r);
  };
  for (let k = 0; k < events.length - 1; k++) {
    const a = events[k];
    const b = events[k + 1];
    const dt = b.t - a.t;
    if (dt <= 0) continue;
    const running = tools.filter((x) => x.t <= a.t && x.end >= b.t && x.end > x.t);
    if (running.length) charge(running.reduce((p, q) => (q.end - q.t > p.end - p.t ? q : p)), dt, 'tool');
    else if (dt > IDLE || b.kind === 'human') idle += dt;
    else { const next = tools.find((x) => x.t >= b.t); if (next) charge(next, dt, 'model'); }
  }

  const span = events.length ? `${new Date(events[0].t).toISOString().slice(0, 16)} → ${new Date(events.at(-1).t).toISOString().slice(0, 16)}` : 'empty';
  console.log(`\n${path.basename(file)}  ${span}${item ? `  (only ${itemName})` : ''}`);
  console.log(`active ${fmt(active)}${item ? '' : ` · away ${fmt(idle)}`} · ${tools.filter((x) => x.mine).length} tool calls\n`);
  console.log('by stage');
  for (const [stage, ms] of [...byStage].sort((a, b) => b[1] - a[1])) console.log(`  ${stage.padEnd(12)} ${fmt(ms).padStart(8)}  ${(100 * ms / active).toFixed(0).padStart(3)}%`);
  console.log('\nby activity                        total   tool time  model time  calls');
  for (const [what, r] of [...byWhat].sort((a, b) => b[1].tool + b[1].model - (a[1].tool + a[1].model))) {
    const total = r.tool + r.model;
    if (total < 30e3) continue;
    console.log(`  ${`${what} (${r.stage})`.padEnd(32)} ${fmt(total).padStart(7)}  ${fmt(r.tool).padStart(9)}  ${fmt(r.model).padStart(10)}  ${String(r.calls.size).padStart(5)}`);
  }
  const slow = tools.filter((x) => x.mine && x.end > x.t).sort((a, b) => b.end - b.t - (a.end - a.t)).slice(0, 5);
  if (slow.length) {
    console.log('\nslowest calls');
    for (const x of slow) console.log(`  ${fmt(x.end - x.t).padStart(7)}  ${String(x.name === 'Bash' ? x.input.command : `${x.name} ${x.input?.file_path ?? x.input?.description ?? ''}`).replace(/\s+/g, ' ').slice(0, 100)}`);
  }
}
