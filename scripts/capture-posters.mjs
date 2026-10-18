// Renders the gallery posters (assembled and exploded, 800 and 1280 px WebP)
// into public/posters/, then the object tray's thumbnails from them. Starts its
// own Vite dev server and drives the dev-only #/capture page in headless
// Chromium, on the GPU when there is one (scripts/qa/browser.mjs).
//
//   npm run posters               # every object
//   npm run posters -- slug       # just one
//   npm run posters -- --thumbs   # only remake the thumbnails from the posters there are
//
// Needs a Playwright Chromium build: `npx playwright install chromium` if missing.
import path from 'node:path';
import { createServer } from 'vite';
import sharp from 'sharp';
import { listThings, PUBLIC_DIR, ROOT } from './lib.mjs';
import { launch } from './qa/browser.mjs';

const args = process.argv.slice(2);
const only = args.find((arg) => !arg.startsWith('--'));

/** The tray's thumbnails: each assembled poster trimmed to the object (and its shadow), on a transparent square. */
async function makeThumbs() {
  const dir = path.join(PUBLIC_DIR, 'posters');
  for (const { slug } of await listThings(only ? [only] : [])) {
    await sharp(path.join(dir, `${slug}-1280.webp`))
      .trim()
      .resize(240, 240, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 88, alphaQuality: 90 })
      .toFile(path.join(dir, `${slug}-thumb.webp`));
    console.log(`✓ ${slug}-thumb`);
  }
}

if (args.includes('--thumbs')) {
  await makeThumbs();
  process.exit(0);
}

const server = await createServer({ root: ROOT, logLevel: 'warn', server: { port: 5299 } });
await server.listen();
const base = server.resolvedUrls.local[0];
const { browser, renderer } = await launch();
console.log(`rendering with ${renderer}`);

try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1400 } });
  page.on('pageerror', (error) => console.error('page error:', error.message));
  await page.goto(`${base}#/capture${only ? `?only=${only}` : ''}`);
  const log = page.locator('.capture__log li');
  let printed = 0;
  // Software rendering (no GPU) is slow: allow a couple of minutes per object.
  const deadline = Date.now() + 10 * 60_000;
  while (Date.now() < deadline) {
    const lines = await log.allTextContents();
    for (const line of lines.slice(printed)) console.log(line);
    printed = lines.length;
    if (lines.at(-1) === 'done') break;
    await page.waitForTimeout(500);
  }
  const failed = (await log.allTextContents()).filter((line) => line.startsWith('✗'));
  process.exitCode = failed.length ? 1 : 0;
} finally {
  await browser.close();
  await server.close();
}
if (!process.exitCode) await makeThumbs();
