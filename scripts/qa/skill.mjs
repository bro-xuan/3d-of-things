// The browser checks for the skill's page (skill.html): its live watch loads, winds, slows and
// comes apart from the keyboard, the wheel still scrolls the page over it, and the page holds
// up on a phone and with reduced motion. Run by `npm run qa -- --skill`, and by `--all`.
//
// Output goes to <out>/skill/: skill-*.png contact sheets, one PNG per shot in shots/, and report.json.
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { watchConsole } from './browser.mjs';
import { contactSheet } from './sheet.mjs';

/** Where the skill's page is, given the address the objects are checked at: beside the gallery
 *  (skill.html), or at the mount when the site is baked into another one (…/objects → …). */
export function skillUrl(base) {
  const url = new URL(base);
  url.hash = '';
  if (/\/objects\/?$/.test(url.pathname)) url.pathname = url.pathname.replace(/\/objects\/?$/, '');
  else url.pathname = url.pathname.replace(/[^/]*$/, 'skill.html');
  return url.href;
}

export async function checkSkill({ browser, base, outRoot, renderer, gpu, retina = false }) {
  const t0 = Date.now();
  const out = path.join(outRoot, 'skill');
  await rm(out, { recursive: true, force: true });
  await mkdir(path.join(out, 'shots'), { recursive: true });
  const url = skillUrl(base);
  const checks = [];
  const shots = {};
  const logs = [];
  let shotCount = 0;
  const lines = ['\nskill page'];

  const record = (section, id, ok, detail = '', level = 'fail') => {
    checks.push({ section, id, ok, level: ok ? 'pass' : level, detail });
    if (!ok) lines.push(`  ${level === 'warn' ? '△' : '✗'} ${section} · ${id}${detail ? `: ${detail}` : ''}`);
  };
  const consoleCheck = (section, mark) => {
    const errors = logs.slice(mark).filter((l) => !l.startsWith('[warning]'));
    record(section, 'console', !errors.length, errors.slice(0, 3).join(' | '));
  };
  const shoot = async (page, group, label, options = {}) => {
    const file = path.join(out, 'shots', `${String(++shotCount).padStart(2, '0')}-${group}-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 40)}.png`);
    await page.screenshot({ path: file, ...options });
    (shots[group] ??= []).push({ file, label });
  };
  const readout = (page) => page.locator('.live__readout').textContent();
  const pressed = (page, act) => page.locator(`[data-act="${act}"]`).getAttribute('aria-pressed');
  /** Waits out a move: the viewer marks its element with data-moving while one is under way. */
  const settle = (page) => page.waitForFunction(() => !document.querySelector('.live [data-moving]'), null, { timeout: 10_000, polling: 50 }).catch(() => {});
  const open = async (context) => {
    const page = await context.newPage();
    watchConsole(page, logs);
    const t = Date.now();
    await page.goto(url);
    await page.waitForFunction(() => document.querySelector('.live')?.dataset.state === 'ready', null, { timeout: 60_000 });
    await page.waitForTimeout(400);
    await settle(page);
    return { page, loadMs: Date.now() - t };
  };

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: retina ? 2 : 1 });
  try {
    let mark = logs.length;
    const { page, loadMs } = await open(context);
    record('load', 'live watch ready', true, `${(loadMs / 1000).toFixed(1)} s`);
    consoleCheck('load', mark);
    await shoot(page, 'desktop', 'At the top');

    mark = logs.length;
    const before = await readout(page);
    await page.keyboard.down('w');
    await page.waitForTimeout(1200);
    const winding = await readout(page);
    await shoot(page, 'desktop', 'Winding (W held)');
    await page.keyboard.up('w');
    record('keys', 'W winds', /winding|fully wound/.test(winding) && winding !== before, `"${before}" → "${winding}"`);

    await page.keyboard.press('s');
    await page.waitForTimeout(300);
    const slowed = await readout(page);
    record('keys', 'S slows', /slowed/.test(slowed) && (await pressed(page, 'slow')) === 'true', `"${slowed}"`);
    await page.keyboard.press('s');
    await page.waitForTimeout(300);
    record('keys', 'S again, real time', !/slowed/.test(await readout(page)) && (await pressed(page, 'slow')) === 'false');

    await page.keyboard.press('e');
    await page.waitForTimeout(200);
    await settle(page);
    await page.waitForTimeout(200);
    record('keys', 'E takes it apart', (await pressed(page, 'apart')) === 'true');
    await shoot(page, 'desktop', 'Apart (E)');
    await page.locator('[data-act="apart"]').click();
    await settle(page);
    record('buttons', 'Apart button puts it together', (await pressed(page, 'apart')) === 'false');
    consoleCheck('keys', mark);

    // Over the watch, the wheel scrolls the page: nothing on it zooms.
    const box = await page.locator('.live__viewer').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(500);
    const scrolled = await page.evaluate(() => window.scrollY);
    record('scroll', 'wheel over the watch scrolls the page', scrolled > 100, `scrollY ${Math.round(scrolled)}`);
    await shoot(page, 'desktop', 'Scrolled past it');
  } catch (error) {
    record('load', 'page runs', false, error.message.split('\n')[0]);
  } finally {
    await context.close();
  }

  for (const [label, options] of [
    ['Phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
    ['Reduced motion', { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }],
  ]) {
    const context = await browser.newContext(options);
    try {
      const mark = logs.length;
      const { page } = await open(context);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      record(label.toLowerCase(), 'no sideways scroll', overflow <= 0, `${overflow}px too wide`);
      await shoot(page, 'other', label);
      consoleCheck(label.toLowerCase(), mark);
    } catch (error) {
      record(label.toLowerCase(), 'page runs', false, error.message.split('\n')[0]);
    } finally {
      await context.close();
    }
  }

  const sheets = {};
  for (const [n, group] of ['desktop', 'other'].filter((g) => shots[g]?.length).entries()) {
    const file = path.join(out, `skill-${n + 1}-${group}.png`);
    sheets[group] = await contactSheet(shots[group], file, { columns: group === 'other' ? 2 : 3, width: 560, title: `Skill page · ${group}` });
  }
  const failed = checks.filter((c) => c.level === 'fail');
  const warned = checks.filter((c) => c.level === 'warn');
  const report = { page: url, renderer, gpu, seconds: (Date.now() - t0) / 1000, passed: checks.filter((c) => c.ok).length, failed: failed.length, warnings: warned.length, sheets, checks, console: logs };
  await writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  lines.push(`  ${failed.length ? '✗' : '✓'} ${report.passed} passed, ${failed.length} failed, ${warned.length} warnings · ${report.seconds.toFixed(0)} s`);
  for (const file of Object.values(sheets)) lines.push(`    ${path.relative(process.cwd(), file)}`);
  return { failed: failed.length, lines };
}
