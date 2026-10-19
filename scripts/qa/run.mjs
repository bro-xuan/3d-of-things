// The browser checks for an object page, written once and driven by the content file:
// every callout, every step of "How it works" and every experiment is exercised, the page
// is checked on a phone and with reduced motion, and the results come back as a few
// labelled contact sheets, a JSON report and an exit code.
//
//   npm run qa -- reflex-camera            # everything, for one object
//   npm run qa -- --all --quick            # load, rest and tour for every object (regression)
//   npm run qa -- reflex-camera --model    # the model only: views and explode stages (geometry loop)
//   npm run qa -- slug --only tour,try     # some sections: rest, callouts, tour, try, run, phone, motion
//   npm run qa -- slug --url http://localhost:5173   # use a running dev server instead of starting one
//   npm run qa -- --all --deployed --url https://afrodance.fun/3d-of-everything/objects
//                                          # a built or live copy (no dev hooks): load, rest and tour
//   npm run qa -- --all --jobs 4           # objects checked side by side (default 3 with --all)
//   npm run qa -- slug --retina            # shots at 2× (fine detail, README pictures)
//   npm run qa -- --skill                  # the skill's page and its live watch (--all includes it)
//
// Output goes to .cache/qa/<slug>/ (or --out): <slug>-*.png contact sheets, one PNG per shot
// in shots/, and report.json. Read the sheets first; open a single shot only to look closer.
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { listThings, ROOT } from '../lib.mjs';
import { launch, ready, serve, watchConsole } from './browser.mjs';
import { contactSheet } from './sheet.mjs';
import { checkSkill } from './skill.mjs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const valued = new Set(['--only', '--url', '--out', '--jobs']);
const slugs = args.filter((a, i) => !a.startsWith('--') && !valued.has(args[i - 1]));
const ALL_SECTIONS = ['rest', 'callouts', 'tour', 'try', 'run', 'phone', 'motion'];
// A deployed copy has no `window.__viewer`, so only the checks that work through the page itself run.
const deployed = flag('--deployed');
if (deployed && !opt('--url')) {
  console.error('--deployed checks a copy that is already served: add --url <the gallery\'s address>.');
  process.exit(2);
}
const sections = new Set(opt('--only')?.split(',') ?? (flag('--model') ? ['views'] : flag('--quick') || deployed ? ['rest', 'tour'] : ALL_SECTIONS));
const outRoot = path.resolve(ROOT, opt('--out') ?? '.cache/qa');

// Dev warnings that mean the content file and the model disagree: these fail a check.
const FATAL_WARNINGS = /no node named|in no part|no chart called|is missing:|unknown category/;

const skill = flag('--skill') || flag('--all');
const things = flag('--all') || slugs.length ? await listThings(flag('--all') ? [] : slugs) : [];
if (!things.length && !skill) {
  console.error('Name an object (npm run qa -- <slug>), or pass --skill or --all.');
  process.exit(2);
}

const started = Date.now();
const { server, base } = opt('--url') ? { server: null, base: new URL(opt('--url')).href } : await serve();
const { browser, renderer, gpu } = await launch({ gpu: !flag('--software') && process.env.QA_GPU !== '0' });
const what = [things.length && `${things.length} object${things.length > 1 ? 's' : ''}`, skill && "the skill's page"].filter(Boolean).join(' and ');
console.log(`qa: ${what} · ${gpu ? 'GPU' : 'software GL (slow)'}: ${renderer}`);

let failures = 0;
const queue = [...things];
const jobs = Math.max(1, Number(opt('--jobs') ?? (things.length > 1 ? 3 : 1)));
try {
  await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, async () => {
    for (let next = queue.shift(); next; next = queue.shift()) {
      const { failed, lines } = await checkObject(next.slug, next.data);
      failures += failed;
      console.log(lines.join('\n'));
    }
  }));
  if (skill) {
    const { failed, lines } = await checkSkill({ browser, base, outRoot, renderer, gpu, retina: flag('--retina') });
    failures += failed;
    console.log(lines.join('\n'));
  }
} finally {
  await browser.close();
  await server?.close();
}
console.log(`\nqa: ${failures ? `${failures} failing check${failures > 1 ? 's' : ''}` : 'all checks pass'} in ${((Date.now() - started) / 1000).toFixed(0)} s`);
process.exitCode = failures ? 1 : 0;

async function checkObject(slug, thing) {
  const t0 = Date.now();
  const out = path.join(outRoot, slug);
  await rm(out, { recursive: true, force: true });
  await mkdir(path.join(out, 'shots'), { recursive: true });
  const checks = [];
  const sheets = {};
  const shots = {};
  const logs = [];
  let shotCount = 0;
  // Printed when the object is done, so objects checked side by side don't interleave.
  const lines = [`\n${slug}`];

  const record = (section, id, ok, detail = '', level = 'fail') => {
    checks.push({ section, id, ok, level: ok ? 'pass' : level, detail });
    if (!ok) lines.push(`  ${level === 'warn' ? '△' : '✗'} ${section} · ${id}${detail ? `: ${detail}` : ''}`);
  };
  /** Console messages since `mark`, split into ones that fail and ones that only warn. */
  const consoleSince = (mark) => {
    const lines = logs.slice(mark);
    return {
      fatal: lines.filter((l) => !l.startsWith('[warning]') || FATAL_WARNINGS.test(l)),
      soft: lines.filter((l) => l.startsWith('[warning]') && !FATAL_WARNINGS.test(l)),
    };
  };
  const consoleCheck = (section, id, mark) => {
    const { fatal, soft } = consoleSince(mark);
    record(section, `${id}: console`, !fatal.length, fatal.slice(0, 3).join(' | '));
    if (soft.length) record(section, `${id}: console warnings`, false, soft.slice(0, 3).join(' | '), 'warn');
  };
  const shoot = async (page, group, label, bad = false) => {
    const file = path.join(out, 'shots', `${String(++shotCount).padStart(2, '0')}-${group}-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 40)}.png`);
    await page.screenshot({ path: file });
    (shots[group] ??= []).push({ file, label, bad });
  };
  const settle = async (page, extra = 150) => {
    // A built copy has no __viewer; the stage carries data-moving instead.
    await page.waitForFunction(() => (window.__viewer ? window.__viewer.tweens.length === 0 : !document.querySelector('[data-moving]')), null, { timeout: 10_000, polling: 50 }).catch(() => {});
    await page.waitForTimeout(extra);
  };
  /** "How it works" as a film: it opens and plays on its own; each shot is held a little before its end (dev) or
   *  jumped to from the script (a built copy) and shot, with its caption and tags checked; Esc closes it. */
  const checkFilm = async (page, film) => {
    let mark = logs.length;
    await page.locator('[data-action="how"]').click();
    await page.waitForSelector('.thing[data-touring]', { timeout: 5000 });
    await page.waitForTimeout(1500);
    const dev = await page.evaluate(() => !!window.__film);
    const total = film.reduce((sum, shot) => sum + shot.duration, 0);
    record('film', 'length', total >= 12 && total <= 30, `${total.toFixed(1)} s (15–25, 30 at most)`, 'warn');
    if (dev) {
      const playing = await page.evaluate(() => window.__film.status);
      record('film', 'plays on opening', playing.playing && playing.time > 0.3, `playing ${playing.playing}, at ${playing.time.toFixed(2)} s`);
    }
    let start = 0;
    for (const [i, shot] of film.entries()) {
      mark = logs.length;
      const where = `${i + 1} "${shot.chapter}: ${shot.caption.slice(0, 40)}"`;
      if (dev) {
        await page.evaluate((t) => window.__film.hold(t), start + shot.duration * 0.85);
        // Flow lines draw themselves in.
        await settle(page, shot.flow || shot.flows ? 1600 : 300);
      } else {
        await page.locator(`.film__line[data-shot="${i}"]`).click();
        await page.waitForTimeout(Math.min(2500, shot.duration * 600));
      }
      const state = await page.evaluate(() => {
        const tags = [...document.querySelectorAll('.step-tag')].filter((t) => getComputedStyle(t).display !== 'none');
        const caption = document.querySelector('.film__caption-text');
        const r = caption?.getBoundingClientRect();
        return {
          caption: caption?.textContent ?? '',
          inside: !!r && r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
          tags: tags.length,
          offstage: tags.filter((t) => t.classList.contains('is-offstage')).map((t) => t.textContent.trim()),
          chart: !!document.querySelector('.film__figure:not([hidden]) .tour__chart svg, .film__figure:not([hidden]) .tour__chart canvas'),
        };
      });
      record('film', `${where}: caption`, state.caption === shot.caption, `shows "${state.caption.slice(0, 60)}"`);
      record('film', `${where}: caption on screen`, state.inside, 'the caption runs off the window');
      record('film', `${where}: caption length`, shot.caption.length <= 110, `${shot.caption.length} characters (110 at most)`, 'warn');
      const tagsWanted = shot.tags?.length ?? 0;
      record('film', `${where}: tags`, state.tags === tagsWanted, `${state.tags} of ${tagsWanted} tags shown (a tag on an unknown node is dropped)`);
      if (state.offstage.length) record('film', `${where}: tags off the stage`, false, state.offstage.join(', '), 'warn');
      if (shot.chart) record('film', `${where}: chart`, state.chart, `chart ${JSON.stringify(typeof shot.chart === 'string' ? shot.chart : shot.chart.type)} didn't draw`);
      consoleCheck('film', where, mark);
      if (!dev) await shoot(page, 'film', `${i + 1} ${shot.chapter}`, state.caption !== shot.caption);
      start += shot.duration;
    }
    if (dev) {
      // A strip through the whole film at even steps: the camera should glide from frame to frame, never jump.
      const step = total / Math.max(8, Math.min(16, Math.round(total / 1.5)));
      for (let t = 0; t <= total + 1e-6; t += step) {
        await page.evaluate((at) => window.__film.hold(at), Math.min(t, total));
        await settle(page, 250);
        const at = `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}.${Math.floor((t % 1) * 10)}`;
        await shoot(page, 'film', at);
      }
    }
    if (dev) {
      // Played through from a moment to the end, it stops there.
      await page.evaluate((t) => { window.__film.hold(t); }, total - 0.4);
      await page.locator('[data-film="play"]').click();
      await page.waitForTimeout(1200);
      const end = await page.evaluate(() => window.__film.status);
      record('film', 'stops at the end', !end.playing && end.time >= end.total - 0.01, `playing ${end.playing}, at ${end.time.toFixed(2)} of ${end.total} s`);
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    record('film', 'Esc closes the film', !(await page.locator('.thing[data-touring]').count()), 'still open after Esc');
    await settle(page);
  };

  /** Opens the object page and waits for the model, the opening move and the drawings. */
  const open = async (context) => {
    const page = await context.newPage();
    watchConsole(page, logs);
    const t = Date.now();
    await page.goto(`${base}#/thing/${slug}`);
    await ready(page, { hooks: !deployed });
    await page.waitForTimeout(400);
    await settle(page);
    await page.waitForFunction(() => document.querySelectorAll('.stage__drawings svg, .drawings__views svg').length > 0, null, { timeout: 4000 }).catch(() => {});
    await settle(page);
    return { page, loadMs: Date.now() - t };
  };
  const desktop = () => browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: flag('--retina') ? 2 : 1 });

  const context = await desktop();
  let page;
  try {
    let mark = logs.length;
    const opened = await open(context);
    page = opened.page;
    record('load', 'model loads', true, `${(opened.loadMs / 1000).toFixed(1)} s`);
    consoleCheck('load', 'page', mark);

    if (sections.has('rest') || sections.has('views')) {
      await shoot(page, 'rest', 'At rest');
      const drawings = await page.locator('.stage__drawings svg').count();
      record('rest', 'drawings drawn', drawings >= 1, `${drawings} views`, 'warn');
      if (sections.has('views')) {
        for (const view of ['front', 'side', 'top']) {
          await page.evaluate((v) => window.__viewer.lookFrom(v), view);
          await settle(page);
          await shoot(page, 'rest', `From the ${view}`);
        }
        await page.evaluate(() => window.__viewer.resetView());
        await settle(page);
      }
      await page.locator('.view-card[data-look="wireframe"]').click();
      await settle(page, 300);
      await shoot(page, 'rest', 'Wireframe');
      await page.locator('.view-card[data-look="rendered"]').click();
      await settle(page, 300);
      for (const value of deployed ? [] : sections.has('views') ? [0.25, 0.5, 0.75, 1] : [0.5, 1]) {
        mark = logs.length;
        await page.evaluate((v) => window.__viewer.setExplode(v), value);
        await page.waitForTimeout(250);
        await shoot(page, 'rest', `Apart ${Math.round(value * 100)}%`);
        consoleCheck('rest', `apart ${value}`, mark);
      }
      if (!deployed) await page.evaluate(() => window.__viewer.setExplode(0));
      await page.waitForTimeout(200);
    }

    if (sections.has('callouts')) {
      for (const [i, a] of (thing.annotations ?? []).entries()) {
        mark = logs.length;
        await page.locator(`[data-callout="${i}"]`).click();
        await settle(page, 250);
        const state = await page.evaluate(() => {
          const card = document.querySelector('.scene-card');
          const r = card?.getBoundingClientRect();
          const visible = !!card && r.width > 0 && getComputedStyle(card).visibility !== 'hidden' && getComputedStyle(card).display !== 'none';
          return { visible, inside: !!r && r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, explode: window.__viewer.explodeValue };
        });
        const where = `${i + 1} "${a.title}"`;
        if (state.visible) record('callouts', `${where}: card on screen`, state.inside, 'card runs off the window');
        if (a.explode !== undefined) record('callouts', `${where}: opens to ${a.explode}`, Math.abs(state.explode - a.explode) < 0.03, `explode is ${state.explode.toFixed(2)}`);
        consoleCheck('callouts', where, mark);
        await shoot(page, 'callouts', `${a.title}`, !state.inside && state.visible);
      }
      const head = page.locator('[data-callout][aria-expanded="true"]');
      if (await head.count()) await head.first().click();
      await page.evaluate(() => { window.__viewer.hideCard?.(); window.__viewer.setExplode(0); });
      await settle(page);
    }

    const film = thing.film ?? [];
    if (film.length && sections.has('tour')) await checkFilm(page, film);
    const steps = film.length ? [] : thing.how ?? [];
    const wantsTour = steps.length && (sections.has('tour') || sections.has('try'));
    if (wantsTour) {
      await page.locator('[data-action="how"]').click();
      await page.waitForSelector('.thing[data-touring]', { timeout: 5000 });
      for (const [i, step] of steps.entries()) {
        mark = logs.length;
        await page.locator(`.tour__step[data-step="${i}"]`).click();
        await settle(page, 450);
        const where = `${i + 1} "${step.label}"`;
        const state = await page.evaluate(() => {
          const rect = (el) => el?.getBoundingClientRect();
          const overlap = (a, b) => a && b && a.width && b.width && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
          const page = rect(document.querySelector('.tour__page'));
          const tags = [...document.querySelectorAll('.step-tag')].filter((t) => getComputedStyle(t).display !== 'none');
          // An inline SVG clips what lies outside it, so only the part of a label inside its SVG can show.
          const chartText = [...document.querySelectorAll('.tour__chart svg text')].filter((t) => {
            const r = t.getBoundingClientRect();
            const box = t.closest('svg').getBoundingClientRect();
            const left = Math.max(r.left, box.left);
            const right = Math.min(r.right, box.right);
            return r.width && page && right > left && (left < page.left - 2 || right > page.right + 2);
          });
          const tryBox = document.querySelector('.tour__try');
          const tryShown = tryBox && getComputedStyle(tryBox).display !== 'none' && rect(tryBox).width > 0;
          return {
            text: document.querySelector('.tour__page')?.textContent ?? '',
            tags: tags.length,
            offstage: tags.filter((t) => t.classList.contains('is-offstage')).map((t) => t.textContent.trim()),
            chart: !!document.querySelector('.tour__chart svg, .tour__chart canvas'),
            chartOverflow: chartText.map((t) => t.textContent.trim()).slice(0, 3),
            tryShown,
            tryControls: tryBox ? tryBox.querySelectorAll('.tour__try-actions button, .tour__try-actions input').length : 0,
            tryOverNav: tryShown && overlap(rect(tryBox), rect(document.querySelector('.tour__nav'))),
          };
        });
        record('tour', `${where}: title`, state.text.includes(step.title), `page doesn't show "${step.title}"`);
        const tagsWanted = step.tags?.length ?? 0;
        record('tour', `${where}: tags`, state.tags === tagsWanted, `${state.tags} of ${tagsWanted} tags shown (a tag on an unknown node is dropped)`);
        if (state.offstage.length) record('tour', `${where}: tags off the stage`, false, state.offstage.join(', '), 'warn');
        if (step.chart) record('tour', `${where}: chart`, state.chart, `chart ${JSON.stringify(typeof step.chart === 'string' ? step.chart : step.chart.type)} didn't draw`);
        if (state.chartOverflow.length) record('tour', `${where}: chart text past the column`, false, state.chartOverflow.join(', '), 'warn');
        if (step.try) {
          record('tour', `${where}: try "${step.try}" has controls`, state.tryShown && state.tryControls > 0, 'nothing to try');
          record('tour', `${where}: try box clear of the step bar`, !state.tryOverNav, 'the try box covers the step bar');
        }
        consoleCheck('tour', where, mark);
        await shoot(page, 'tour', `${step.label}`, state.text && !state.text.includes(step.title));
        if (step.try && sections.has('try')) await tryExperiment(page, i, step);
      }
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      record('tour', 'Esc closes the tour', !(await page.locator('.thing[data-touring]').count()), 'still touring after Esc');
      await settle(page);
    }

    if (sections.has('run') && (await page.locator('[data-action="run"]').count())) {
      mark = logs.length;
      const spinning = (thing.motion ?? []).find((m) => m.speed !== undefined && !m.inside)?.node;
      const before = spinning ? await page.evaluate((n) => window.__viewer.angleOf(n), spinning) : 0;
      await page.locator('[data-action="run"]').click();
      await page.waitForTimeout(1200);
      await shoot(page, 'tour', 'Running');
      if (spinning && !thing.slowMotion) {
        const after = await page.evaluate((n) => window.__viewer.angleOf(n), spinning);
        record('run', `"${spinning}" turns`, Math.abs(after - before) > 1e-3, 'run pressed, but it did not move');
      }
      await page.locator('[data-action="run"]').click();
      consoleCheck('run', 'run', mark);
    }

    async function tryExperiment(page, i, step) {
      const group = `try ${i + 1} ${step.try}`;
      const readout = () => page.locator('.tour__readout').textContent().then((t) => t?.trim() ?? '');
      const seen = new Set([await readout()]);
      const box = page.locator('.tour__try-actions');
      const holds = box.locator('.button--hold');
      for (let k = 0; k < Math.min(await holds.count(), 2); k++) {
        const b = holds.nth(k);
        await b.scrollIntoViewIfNeeded();
        const r = await b.boundingBox();
        if (!r) continue;
        await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(1500);
        seen.add(await readout());
        await shoot(page, group, `holding ${(await b.textContent()).trim()}`);
        await page.mouse.up();
        await page.waitForTimeout(300);
      }
      const sliders = box.locator('input[type="range"]');
      for (let k = 0; k < Math.min(await sliders.count(), 2); k++) {
        for (const end of ['min', 'max']) {
          await sliders.nth(k).evaluate((el, end) => {
            el.value = el[end] || (end === 'min' ? '0' : '100');
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }, end);
          await settle(page, 700);
          seen.add(await readout());
          await shoot(page, group, `slider ${k + 1} at ${end}`);
        }
      }
      const choices = box.locator('.tour__choice');
      for (let k = 0; k < Math.min(await choices.count(), 3); k++) {
        await choices.nth(k).click();
        await page.waitForTimeout(600);
        seen.add(await readout());
        await shoot(page, group, `choice ${(await choices.nth(k).textContent()).trim()}`);
      }
      const buttons = box.locator('button:not(.button--hold):not(.tour__choice)');
      for (let k = 0; k < Math.min(await buttons.count(), 3); k++) {
        const b = buttons.nth(k);
        if (!(await b.isEnabled())) continue;
        const label = ((await b.getAttribute('aria-label')) ?? (await b.textContent()) ?? '').trim();
        await b.click();
        await page.waitForTimeout(1200);
        seen.add(await readout());
        await shoot(page, group, `pressed ${label}`);
      }
      seen.delete('');
      record('try', `${i + 1} "${step.try}": readout responds`, seen.size > 1, seen.size ? `readout stayed "${[...seen][0]}"` : 'no readout', seen.size ? 'fail' : 'warn');
    }
  } catch (error) {
    record('load', 'page runs', false, error.message.split('\n')[0]);
    if (page) await shoot(page, 'rest', 'Error').catch(() => {});
  } finally {
    await context.close();
  }

  if (sections.has('phone')) {
    const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    try {
      const mark = logs.length;
      const { page } = await open(phone);
      await shoot(page, 'phone', 'Phone at rest');
      const wide = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      record('phone', 'no sideways scroll', wide <= 1, `page is ${wide}px wider than the screen`);
      if (thing.film?.length || thing.how?.length) {
        await page.locator('[data-action="how"]').click();
        await settle(page, thing.film?.length ? 2500 : 450);
        await shoot(page, 'phone', `Phone: ${thing.film?.length ? thing.film[0].chapter : thing.how[0].label}`);
      }
      consoleCheck('phone', 'phone', mark);
    } catch (error) {
      record('phone', 'page runs', false, error.message.split('\n')[0]);
    } finally {
      await phone.close();
    }
  }

  if (sections.has('motion')) {
    const still = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    try {
      const mark = logs.length;
      const { page } = await open(still);
      await page.evaluate(() => window.__viewer.animateExplode(1));
      await page.waitForTimeout(400);
      await shoot(page, 'phone', 'Reduced motion, apart');
      consoleCheck('motion', 'reduced motion', mark);
    } catch (error) {
      record('motion', 'page runs', false, error.message.split('\n')[0]);
    } finally {
      await still.close();
    }
  }

  const order = ['rest', 'callouts', 'film', 'tour', ...Object.keys(shots).filter((g) => g.startsWith('try ')), 'phone'];
  for (const [n, group] of order.filter((g) => shots[g]?.length).entries()) {
    const file = path.join(out, `${slug}-${n + 1}-${group.replace(/[^a-z0-9]+/gi, '-')}.png`);
    sheets[group] = await contactSheet(shots[group], file, { columns: group === 'phone' || group === 'film' ? 4 : 3, width: group === 'phone' ? 300 : group === 'film' ? 440 : 560, title: `${thing.title} · ${group}` });
  }
  const failed = checks.filter((c) => c.level === 'fail');
  const warned = checks.filter((c) => c.level === 'warn');
  const report = { slug, renderer, gpu, seconds: (Date.now() - t0) / 1000, passed: checks.filter((c) => c.ok).length, failed: failed.length, warnings: warned.length, sheets, checks, console: logs };
  await writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  lines.push(`  ${failed.length ? '✗' : '✓'} ${report.passed} passed, ${failed.length} failed, ${warned.length} warnings · ${report.seconds.toFixed(0)} s`);
  for (const file of Object.values(sheets)) lines.push(`    ${path.relative(process.cwd(), file)}`);
  return { failed: failed.length, lines };
}
