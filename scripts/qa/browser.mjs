// Headless Chromium for the checks and the posters. On a Mac it draws with the GPU through
// Metal, 20–25 times faster than software WebGL (SwiftShader: ~460 ms a frame at 1440 × 900
// @2x, against ~20 ms), with the same picture. Where there's no GPU it falls back to SwiftShader.
//
//   const { browser, renderer } = await launch();
//   const { server, base } = await serve();
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { ROOT } from '../lib.mjs';

const GPU = ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'];
// --disable-gpu, or Chromium on a Mac keeps drawing with Metal.
const SOFTWARE = ['--disable-gpu', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const isSoftware = (renderer) => /swiftshader|llvmpipe|software|none/i.test(renderer);

/** The WebGL renderer a browser ends up with, e.g. "ANGLE (Apple, ANGLE Metal Renderer: Apple M3, …)". */
async function rendererOf(browser) {
  const page = await browser.newPage();
  const renderer = await page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return 'none';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  });
  await page.close();
  return renderer;
}

/** Launches headless Chromium on the GPU if it can, else with SwiftShader. `QA_GPU=0` forces software. */
export async function launch({ gpu = process.env.QA_GPU !== '0' } = {}) {
  if (gpu) {
    const browser = await chromium.launch({ headless: true, args: GPU });
    const renderer = await rendererOf(browser);
    if (!isSoftware(renderer)) return { browser, renderer, gpu: true };
    await browser.close();
  }
  const browser = await chromium.launch({ headless: true, args: SOFTWARE });
  return { browser, renderer: await rendererOf(browser), gpu: false };
}

/** A Vite dev server on the project (the debug hooks, `window.__viewer`, are dev-only). Port is a
 *  preference: Vite takes the next free one, so this never fights the dev server you're running. */
export async function serve(port = 5399) {
  const server = await createServer({ root: ROOT, logLevel: 'warn', server: { port } });
  await server.listen();
  return { server, base: server.resolvedUrls.local[0] };
}

/** Collects console errors and warnings, page errors and failed requests, without GPU driver noise. */
export function watchConsole(page, into = []) {
  page.on('console', (m) => {
    if ((m.type() === 'error' || m.type() === 'warning') && !/GPU stall|GroupMarkerNotSet|WebGL: too many errors/.test(m.text())) {
      into.push(`[${m.type()}] ${m.text().slice(0, 300)}`);
    }
  });
  page.on('pageerror', (e) => into.push(`[pageerror] ${e.message.slice(0, 300)}`));
  page.on('requestfailed', (r) => into.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText ?? ''}`));
  return into;
}

/** Waits until an object page has its model in and, on a dev server, the viewer exposed on `window.__viewer`. */
export async function ready(page, { timeout = 60_000, hooks = true } = {}) {
  await page.waitForFunction((hooks) => (!hooks || window.__viewer) && document.querySelector('[data-state="ready"]'), hooks, { timeout });
}
