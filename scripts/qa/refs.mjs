// Sets the model beside photographs of the real thing, seen from the same place and at the same size, so a model that
// has drifted from the object it explains shows as a shape on a sheet instead of a feeling. After Wes Bos's
// scan-to-threejs, which renders a room from the pose of every photo taken while it was scanned; here the photos come
// from anywhere, so the view is either square on to a face or found by fitting the model's outline to the photo's.
//
//   npm run qa -- reflex-camera --ref
//
// objects/<slug>/refs.json lists the references:
//   { "refs": [{ "id": "left", "url": "https://upload.wikimedia.org/…", "source": "https://commons.wikimedia.org/wiki/File:…",
//                "credit": "Kenny Louie, CC BY 2.0", "view": "left", "ignore": [[x0, y0, x1, y1]], "note": "…" }] }
//
//   view       "front", "back", "left", "right" (seen from +x, as the drawings' side view) or "top": orthographic,
//              for a maker's drawing, a patent figure or a photo taken square on from far off;
//              { "azimuth": 30, "elevation": 15, "fov": 20 }: a camera, in degrees, as `viewAngle`;
//              "find", or { "find": { "azimuth": [min, max], "elevation": [min, max], "fov": [min, max] } }: search for
//              the camera that best fits the photo's outline, then pin what it prints.
//   file       a local image instead of `url` (relative to the repository)
//   crop       [x0, y0, x1, y1]: the part of the image to use, in its pixels
//   ignore     rectangles, in the image's pixels, left out of the comparison: a hand, a strap, a lens shade the model
//              doesn't have, a hood that's up in the photo and folded on the model
//   tolerance  how far (0–255) the background may stray from the colour round the image's edge (default 40)
//   fit        scale the model to the photo by "area" (default), "width" or "height"
//
// Images are downloaded into .cache/refs/<slug>/ and never committed: a reference is only looked at, not shipped.
//
// Each reference gets four tiles: the photo; the model from the same view at the same size; the photo with the
// model's outline over it in red; and where the two differ (blue: the real thing has it and the model doesn't; red:
// the model has it and the real thing doesn't). Like scan-to-threejs, this only lines them up, and reading the sheet
// is the check. Two numbers help: how much of the two outlines overlap, and how far the model's proportions are off.
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { ROOT } from '../lib.mjs';

/** The longest side a photo is compared at, and at which the camera search compares outlines. */
const WORK = 720;
const SEARCH = 128;
/** The size the model is drawn at for the tiles (the canvas may make it smaller). */
const STILL = 800;
const TILE = 520;
const FACES = new Set(['front', 'back', 'left', 'right', 'top']);
const OPPOSITE = { front: 'back', back: 'front', left: 'right', right: 'left' };
/** Below these the sheet's tile is framed in red and a warning is printed. */
const OVERLAP_WARN = 0.85;
const PROPORTION_WARN = 0.05;
const AGENT = '3d-of-things-qa (https://github.com/bro-xuan/3d-of-things)';

/** Compares the open page's model with each of the object's references; returns tiles for the sheet and the numbers. */
export async function checkRefs({ page, slug, out, record, lines }) {
  const file = path.join(ROOT, 'objects', slug, 'refs.json');
  let refs;
  try {
    refs = JSON.parse(await readFile(file, 'utf8')).refs ?? [];
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    record('ref', 'references', false, `none yet: list some in objects/${slug}/refs.json (references/qa.md, "Against the real thing")`, 'warn');
    return { tiles: [], results: [] };
  }
  await page.evaluate(() => window.__viewer.setExplode(0));
  const tiles = [];
  const results = [];
  for (const ref of refs) {
    const problem = invalid(ref);
    if (problem) {
      record('ref', ref.id ?? '?', false, problem);
      continue;
    }
    try {
      const photo = await readPhoto(await fetchImage(slug, ref), ref);
      const share = photo.area / (photo.width * photo.height);
      if (share < 0.01 || share > 0.92) {
        record('ref', `${ref.id}: outline`, false, `couldn't tell the object from its background (${Math.round(share * 100)}% of the picture): set crop or tolerance, or use a photo on a plain background`);
        continue;
      }
      let view = ref.view;
      let alternatives = [];
      if (view === 'find' || view?.find) {
        const [best, ...others] = await findCamera(page, photo, view.find ?? {});
        view = best.view;
        const pin = `"view": { "azimuth": ${view.azimuth}, "elevation": ${view.elevation}, "fov": ${view.fov} }`;
        lines.push(`    ${ref.id}: found the camera (overlap ${(best.overlap * 100).toFixed(0)}% at the search's size); if the sheet agrees, pin it: ${pin}`);
        // Close seconds from elsewhere mean the outline alone can't tell: look, then pin or narrow the search.
        alternatives = others.filter((o) => o.overlap > best.overlap - 0.03);
        for (const other of alternatives) {
          lines.push(`      it fits nearly as well at azimuth ${other.view.azimuth}°, elevation ${other.view.elevation}°, fov ${other.view.fov}° (${(other.overlap * 100).toFixed(0)}%)`);
        }
      }
      const model = await still(page, view);
      const result = compare(photo, model, ref.fit ?? 'area');
      // Which side is "left" is easy to get backwards (a camera's own left is the side seen from +x, the model's right).
      if (OPPOSITE[view]) {
        const other = compare(photo, await still(page, OPPOSITE[view]), ref.fit ?? 'area');
        if (other.overlap > result.overlap + 0.05) {
          record('ref', `${ref.id}: view`, false, `"${OPPOSITE[view]}" fits better (${(other.overlap * 100).toFixed(0)}% overlap against ${(result.overlap * 100).toFixed(0)}%): the photo may show the other face`, 'warn');
        }
      }
      const overlapOk = result.overlap >= OVERLAP_WARN;
      const proportionOk = Math.abs(result.proportion) <= PROPORTION_WARN;
      record('ref', `${ref.id}: overlap`, overlapOk, `${(result.overlap * 100).toFixed(0)}% of the outlines overlap (${OVERLAP_WARN * 100}% wanted): read the sheet`, 'warn');
      record('ref', `${ref.id}: proportions`, proportionOk, proportionText(result.proportion), 'warn');
      const made = await drawTiles(photo, model, result, path.join(out, 'shots'), ref.id);
      const credit = ref.credit ? ` (${ref.credit})` : '';
      tiles.push(
        { file: made.photo, label: `${ref.id}: the real thing${credit}` },
        { file: made.model, label: `${ref.id}: the model, ${describe(view)}` },
        { file: made.overlay, label: `${ref.id}: the model's outline (red) on the photo` },
        { file: made.difference, label: `${ref.id}: ${(result.overlap * 100).toFixed(0)}% overlap · ${proportionText(result.proportion)}`, bad: !overlapOk || !proportionOk },
      );
      // The near seconds drawn too, so the right one can be picked by eye and pinned.
      for (const [n, other] of alternatives.entries()) {
        const drawn = await drawTiles(photo, await still(page, other.view), compare(photo, await still(page, other.view), ref.fit ?? 'area'), path.join(out, 'shots'), `${ref.id}-or-${n + 1}`, ['model']);
        tiles.push({ file: drawn.model, label: `${ref.id}: or ${describe(other.view)}? (${(other.overlap * 100).toFixed(0)}%)` });
      }
      results.push({ id: ref.id, view, overlap: round(result.overlap), proportion: round(result.proportion), scale: round(result.s), alternatives: alternatives.map((a) => a.view) });
    } catch (error) {
      record('ref', ref.id, false, error.message.split('\n')[0]);
    }
  }
  return { tiles, results };
}

/** The model drawn from a view at STILL pixels (or the canvas's size), as RGBA. */
async function still(page, view) {
  const drawn = await page.evaluate(([v, size]) => {
    const { width, height, pixels } = window.__viewer.still(v, size, size);
    let text = '';
    for (let i = 0; i < pixels.length; i += 0x8000) text += String.fromCharCode.apply(null, pixels.subarray(i, i + 0x8000));
    return { width, height, data: btoa(text) };
  }, [view, STILL]);
  return { width: drawn.width, height: drawn.height, rgba: Buffer.from(drawn.data, 'base64') };
}

function invalid(ref) {
  if (!/^[a-z0-9-]+$/.test(ref.id ?? '')) return 'each reference needs an id: lowercase letters, digits and hyphens';
  if (!ref.url && !ref.file) return 'give a url or a file';
  const v = ref.view;
  const camera = v && typeof v === 'object' && !v.find && ['azimuth', 'elevation', 'fov'].every((k) => Number.isFinite(v[k]));
  if (!FACES.has(v) && v !== 'find' && !v?.find && !camera) return `view ${JSON.stringify(v)}: a face (${[...FACES].join(', ')}), { azimuth, elevation, fov } or "find"`;
  if (ref.fit && !['area', 'width', 'height'].includes(ref.fit)) return `fit "${ref.fit}": area, width or height`;
  return null;
}

async function fetchImage(slug, ref) {
  if (ref.file) return path.resolve(ROOT, ref.file);
  const ext = path.extname(new URL(ref.url).pathname).toLowerCase() || '.jpg';
  const file = path.join(ROOT, '.cache', 'refs', slug, `${ref.id}${ext}`);
  try {
    await access(file);
    return file;
  } catch {}
  const response = await fetch(ref.url, { headers: { 'User-Agent': AGENT } });
  if (!response.ok) throw new Error(`couldn't download ${ref.url}: ${response.status}`);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, Buffer.from(await response.arrayBuffer()));
  return file;
}

/** The photo, upright, cropped and at most WORK pixels across, with the object's outline: everything not joined to the
 *  picture's edge through background. `mask` is 1 for the object, 0 for background, 2 where it's ignored. */
async function readPhoto(file, ref) {
  const upright = await sharp(file).rotate().toBuffer();
  const meta = await sharp(upright).metadata();
  const [x0, y0, x1, y1] = ref.crop ?? [0, 0, meta.width, meta.height];
  const k = Math.min(1, WORK / Math.max(x1 - x0, y1 - y0));
  const { data, info } = await sharp(upright)
    .extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 })
    .resize(Math.round((x1 - x0) * k), Math.round((y1 - y0) * k))
    .flatten({ background: '#ffffff' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const smooth = (await sharp(data, { raw: { width, height, channels: 3 } }).blur(1.2).raw().toBuffer());
  const mask = separate(smooth, width, height, ref.tolerance ?? 40);
  let area = 0;
  for (const [a, b, c, d] of ref.ignore ?? []) {
    const r = [a, b, c, d].map((v, i) => Math.round((v - (i % 2 ? y0 : x0)) * k));
    for (let y = Math.max(0, r[1]); y < Math.min(height, r[3]); y++) for (let x = Math.max(0, r[0]); x < Math.min(width, r[2]); x++) mask[y * width + x] = 2;
  }
  for (const v of mask) if (v === 1) area++;
  return { width, height, rgb: data, mask, area };
}

/** Background is whatever joins the picture's edge in small steps of colour without straying far from the backdrop
 *  (a smooth fit to the edge's colours, so a studio sweep's gradient is still backdrop); the object is the rest,
 *  keeping only pieces of a size with the largest (no specks, no text). */
function separate(rgb, w, h, tolerance) {
  const border = [];
  for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) border.push(y * w, y * w + w - 1);
  const backdrop = fitBackdrop(rgb, w, h, border);
  const far = (i) => {
    const b = backdrop(i % w, Math.floor(i / w));
    return Math.hypot(rgb[i * 3] - b[0], rgb[i * 3 + 1] - b[1], rgb[i * 3 + 2] - b[2]) > tolerance;
  };
  const step = Math.max(6, tolerance / 4);
  const near = (i, j) => Math.hypot(rgb[i * 3] - rgb[j * 3], rgb[i * 3 + 1] - rgb[j * 3 + 1], rgb[i * 3 + 2] - rgb[j * 3 + 2]) <= step;
  const background = new Uint8Array(w * h);
  const stack = border.filter((i) => !far(i));
  for (const i of stack) background[i] = 1;
  while (stack.length) {
    const i = stack.pop();
    const x = i % w;
    for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
      if (j < 0 || j >= w * h || background[j] || far(j) || !near(i, j)) continue;
      background[j] = 1;
      stack.push(j);
    }
  }
  // Pieces of the object, by size.
  const label = new Int32Array(w * h).fill(-1);
  const sizes = [];
  for (let start = 0; start < w * h; start++) {
    if (background[start] || label[start] >= 0) continue;
    const id = sizes.length;
    let size = 0;
    const queue = [start];
    label[start] = id;
    while (queue.length) {
      const i = queue.pop();
      size++;
      const x = i % w;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
        if (j < 0 || j >= w * h || background[j] || label[j] >= 0) continue;
        label[j] = id;
        queue.push(j);
      }
    }
    sizes.push(size);
  }
  const keep = 0.05 * Math.max(0, ...sizes);
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) if (label[i] >= 0 && sizes[label[i]] >= keep) mask[i] = 1;
  return mask;
}

/** The backdrop's colour anywhere in the picture: a quadratic in x and y fitted to the edge's pixels, fitted again
 *  without the quarter that fit worst (where the object or its shadow reaches the edge). */
function fitBackdrop(rgb, w, h, border) {
  const basis = (x, y) => {
    const u = x / w - 0.5;
    const v = y / h - 0.5;
    return [1, u, v, u * u, u * v, v * v];
  };
  const fit = (pixels) => [0, 1, 2].map((c) => {
    const A = Array.from({ length: 6 }, () => new Array(7).fill(0));
    for (const i of pixels) {
      const f = basis(i % w, Math.floor(i / w));
      for (let r = 0; r < 6; r++) {
        for (let k = 0; k < 6; k++) A[r][k] += f[r] * f[k];
        A[r][6] += f[r] * rgb[i * 3 + c];
      }
    }
    // Gaussian elimination with partial pivoting.
    for (let col = 0; col < 6; col++) {
      let pivot = col;
      for (let r = col + 1; r < 6; r++) if (Math.abs(A[r][col]) > Math.abs(A[pivot][col])) pivot = r;
      [A[col], A[pivot]] = [A[pivot], A[col]];
      for (let r = 0; r < 6; r++) {
        if (r === col || !A[col][col]) continue;
        const factor = A[r][col] / A[col][col];
        for (let k = col; k < 7; k++) A[r][k] -= factor * A[col][k];
      }
    }
    return A.map((row, r) => (row[r] ? row[6] / row[r] : 0));
  });
  const at = (coefficients) => (x, y) => {
    const f = basis(x, y);
    return coefficients.map((c) => c.reduce((sum, a, k) => sum + a * f[k], 0));
  };
  const first = at(fit(border));
  const residual = (i) => {
    const b = first(i % w, Math.floor(i / w));
    return Math.hypot(rgb[i * 3] - b[0], rgb[i * 3 + 1] - b[1], rgb[i * 3 + 2] - b[2]);
  };
  const kept = border.map((i) => [i, residual(i)]).sort((a, b) => a[1] - b[1]).slice(0, Math.ceil(border.length * 0.75)).map(([i]) => i);
  return at(fit(kept));
}

/** Searches for the camera whose view of the model has the outline most like the photo's: a coarse grid of azimuths,
 *  elevations and fields of view, then a finer search round the best few. Each outline is scaled and moved onto the
 *  photo's (by area and centre) before they're compared, so only the camera's direction and lens are searched. */
async function findCamera(page, photo, ranges) {
  const k = SEARCH / Math.max(photo.width, photo.height);
  const w = Math.max(1, Math.round(photo.width * k));
  const h = Math.max(1, Math.round(photo.height * k));
  const small = new Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) small[y * w + x] = photo.mask[Math.min(photo.height - 1, Math.floor((y + 0.5) / k)) * photo.width + Math.min(photo.width - 1, Math.floor((x + 0.5) / k))];
  return page.evaluate(({ w, h, small, ranges, size }) => {
    const [azMin, azMax] = ranges.azimuth ?? [-180, 180];
    const [elMin, elMax] = ranges.elevation ?? [-15, 45];
    const [fovMin, fovMax] = ranges.fov ?? [8, 50];
    let photoArea = 0;
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < small.length; i++) if (small[i] === 1) { photoArea++; cx += i % w; cy += Math.floor(i / w); }
    cx /= photoArea;
    cy /= photoArea;
    const cache = new Map();
    const score = (view) => {
      const key = `${view.azimuth.toFixed(2)},${view.elevation.toFixed(2)},${view.fov.toFixed(2)}`;
      if (cache.has(key)) return cache.get(key);
      const still = window.__viewer.still(view, size, size);
      const { width: mw, height: mh, pixels } = still;
      let area = 0;
      let mx = 0;
      let my = 0;
      for (let i = 0; i < mw * mh; i++) if (pixels[i * 4 + 3] > 64) { area++; mx += i % mw; my += Math.floor(i / mw); }
      if (!area) return 0;
      mx /= area;
      my /= area;
      const s = Math.sqrt(photoArea / area);
      let both = 0;
      let ignored = 0;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const u = Math.round((x - cx) / s + mx);
          const v = Math.round((y - cy) / s + my);
          const inModel = u >= 0 && v >= 0 && u < mw && v < mh && pixels[(v * mw + u) * 4 + 3] > 64;
          const p = small[y * w + x];
          if (p === 2) { if (inModel) ignored++; continue; }
          if (p === 1 && inModel) both++;
        }
      }
      const modelArea = area * s * s - ignored;
      const overlap = both / (photoArea + modelArea - both);
      cache.set(key, overlap);
      return overlap;
    };
    const grid = [];
    const full = azMax - azMin >= 360;
    for (let az = azMin; full ? az < azMax : az <= azMax + 1e-6; az += 15) {
      for (let el = elMin; el <= elMax + 1e-6; el += 10) {
        for (const fov of [10, 20, 35, 50].filter((f) => f >= fovMin && f <= fovMax).concat(fovMin > 10 || fovMax < 10 ? [(fovMin + fovMax) / 2] : [])) {
          const view = { azimuth: az, elevation: el, fov };
          grid.push({ view, overlap: score(view) });
        }
      }
    }
    grid.sort((a, b) => b.overlap - a.overlap);
    // Refined from the best few that point different ways: an outline can fit from more than one side.
    const apart = (a, b) => Math.hypot(((a.azimuth - b.azimuth + 540) % 360) - 180, a.elevation - b.elevation) > 20;
    const starts = [];
    for (const g of grid) if (starts.length < 6 && starts.every((s) => apart(s.view, g.view))) starts.push(g);
    const found = [];
    for (const start of starts) {
      let at = start;
      let steps = { azimuth: 7.5, elevation: 5, fov: 1.3 };
      while (steps.azimuth > 0.4) {
        let moved = false;
        for (const [key, sign] of [['azimuth', 1], ['azimuth', -1], ['elevation', 1], ['elevation', -1], ['fov', 1], ['fov', -1]]) {
          const view = { ...at.view };
          if (key === 'fov') view.fov = Math.min(fovMax, Math.max(fovMin, sign > 0 ? view.fov * steps.fov : view.fov / steps.fov));
          else view[key] += sign * steps[key];
          view.elevation = Math.min(elMax, Math.max(elMin, view.elevation));
          if (!full) view.azimuth = Math.min(azMax, Math.max(azMin, view.azimuth));
          const overlap = score(view);
          if (overlap > at.overlap + 1e-4) { at = { view, overlap }; moved = true; }
        }
        if (!moved) steps = { azimuth: steps.azimuth / 2, elevation: steps.elevation / 2, fov: 1 + (steps.fov - 1) / 2 };
      }
      found.push(at);
    }
    const tidy = (n, d) => Math.round(n * d) / d;
    return found
      .sort((a, b) => b.overlap - a.overlap)
      .map(({ view, overlap }) => ({ view: { azimuth: tidy(((view.azimuth + 540) % 360) - 180, 2), elevation: tidy(view.elevation, 2), fov: tidy(view.fov, 10) }, overlap }));
  }, { w, h, small, ranges, size: SEARCH });
}

/** Lines the model's outline up with the photo's: scaled by area (or width or height) and moved centre to centre, then
 *  nudged to the best overlap. Returns the transform (photo = s · model + t) and the two numbers. */
function compare(photo, model, fit) {
  const inModel = (u, v) => {
    const x = Math.round(u);
    const y = Math.round(v);
    return x >= 0 && y >= 0 && x < model.width && y < model.height && model.rgba[(y * model.width + x) * 4 + 3] > 64;
  };
  const stats = (inside, w, h) => {
    let area = 0, cx = 0, cy = 0, x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (inside(x, y)) {
      area++; cx += x; cy += y;
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + 1); y1 = Math.max(y1, y + 1);
    }
    return { area, cx: cx / area, cy: cy / area, x0, y0, x1, y1 };
  };
  const p = stats((x, y) => photo.mask[y * photo.width + x] === 1, photo.width, photo.height);
  const m = stats(inModel, model.width, model.height);
  if (!m.area) throw new Error('the model drew nothing from this view');
  const s0 = fit === 'width' ? (p.x1 - p.x0) / (m.x1 - m.x0) : fit === 'height' ? (p.y1 - p.y0) / (m.y1 - m.y0) : Math.sqrt(p.area / m.area);
  // Measured over a frame round both outlines; pixels past the photo's edge are background there.
  const measure = ({ s, tx, ty }, stride = 1) => {
    const fx0 = Math.floor(Math.min(p.x0, tx + s * m.x0)) - 2;
    const fy0 = Math.floor(Math.min(p.y0, ty + s * m.y0)) - 2;
    const fx1 = Math.ceil(Math.max(p.x1, tx + s * m.x1)) + 2;
    const fy1 = Math.ceil(Math.max(p.y1, ty + s * m.y1)) + 2;
    let both = 0, photoOnly = 0, modelOnly = 0;
    let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
    for (let y = fy0; y < fy1; y += stride) {
      for (let x = fx0; x < fx1; x += stride) {
        const inside = x >= 0 && y >= 0 && x < photo.width && y < photo.height;
        const q = inside ? photo.mask[y * photo.width + x] : 0;
        if (q === 2) continue;
        const mm = inModel((x - tx) / s, (y - ty) / s);
        if (mm) { bx0 = Math.min(bx0, x); by0 = Math.min(by0, y); bx1 = Math.max(bx1, x + 1); by1 = Math.max(by1, y + 1); }
        if (q === 1 && mm) both++;
        else if (q === 1) photoOnly++;
        else if (mm) modelOnly++;
      }
    }
    return { overlap: both / (both + photoOnly + modelOnly), box: [bx0, by0, bx1, by1] };
  };
  let at = { s: s0, tx: p.cx - s0 * m.cx, ty: p.cy - s0 * m.cy };
  let score = measure(at, 2).overlap;
  let steps = { s: fit === 'area' ? 0.04 : 0, t: 6 };
  while (steps.t > 0.4) {
    let moved = false;
    const tries = [{ tx: steps.t }, { tx: -steps.t }, { ty: steps.t }, { ty: -steps.t }];
    if (steps.s) tries.push({ s: steps.s }, { s: -steps.s });
    for (const d of tries) {
      const next = { s: at.s * (1 + (d.s ?? 0)), tx: at.tx + (d.tx ?? 0), ty: at.ty + (d.ty ?? 0) };
      if (d.s) {
        // Scale about the photo's centre of mass, so the outline doesn't slide off.
        next.tx = p.cx - (p.cx - at.tx) * (1 + d.s);
        next.ty = p.cy - (p.cy - at.ty) * (1 + d.s);
      }
      const o = measure(next, 2).overlap;
      if (o > score + 1e-5) { at = next; score = o; moved = true; }
    }
    if (!moved) steps = { s: steps.s / 2, t: steps.t / 2 };
  }
  const { overlap, box } = measure(at);
  // Proportions from the bounding boxes, leaving out what's ignored (the model's box only counts pixels outside it).
  const photoBox = [p.x0, p.y0, p.x1, p.y1];
  const proportion = ((box[2] - box[0]) / (box[3] - box[1])) / ((photoBox[2] - photoBox[0]) / (photoBox[3] - photoBox[1])) - 1;
  return { ...at, overlap, proportion, photoBox, modelBox: box };
}

/** The four tiles, each the same frame round both outlines, as PNGs. */
async function drawTiles(photo, model, { s, tx, ty, photoBox, modelBox }, dir, id, names = ['photo', 'model', 'overlay', 'difference']) {
  const margin = 0.06 * Math.max(photoBox[2] - photoBox[0], photoBox[3] - photoBox[1]);
  const fx0 = Math.min(photoBox[0], modelBox[0]) - margin;
  const fy0 = Math.min(photoBox[1], modelBox[1]) - margin;
  const fx1 = Math.max(photoBox[2], modelBox[2]) + margin;
  const fy1 = Math.max(photoBox[3], modelBox[3]) + margin;
  const k = TILE / Math.max(fx1 - fx0, fy1 - fy0);
  const W = Math.round((fx1 - fx0) * k);
  const H = Math.round((fy1 - fy0) * k);
  const tiles = { photo: Buffer.alloc(W * H * 3), model: Buffer.alloc(W * H * 3), overlay: Buffer.alloc(W * H * 3), difference: Buffer.alloc(W * H * 3) };
  const inModel = new Uint8Array(W * H);
  const sample = (img, w, h, channels, x, y, c) => {
    // Bilinear, clamped.
    const x0 = Math.max(0, Math.min(w - 1, Math.floor(x)));
    const y0 = Math.max(0, Math.min(h - 1, Math.floor(y)));
    const x1 = Math.min(w - 1, x0 + 1);
    const y1 = Math.min(h - 1, y0 + 1);
    const ax = Math.max(0, Math.min(1, x - x0));
    const ay = Math.max(0, Math.min(1, y - y0));
    const at = (xx, yy) => img[(yy * w + xx) * channels + c];
    return (at(x0, y0) * (1 - ax) + at(x1, y0) * ax) * (1 - ay) + (at(x0, y1) * (1 - ax) + at(x1, y1) * ax) * ay;
  };
  const put = (buffer, i, [r, g, b]) => { buffer[i * 3] = r; buffer[i * 3 + 1] = g; buffer[i * 3 + 2] = b; };
  for (let Y = 0; Y < H; Y++) {
    for (let X = 0; X < W; X++) {
      const i = Y * W + X;
      const x = fx0 + (X + 0.5) / k;
      const y = fy0 + (Y + 0.5) / k;
      const inPhoto = x >= 0 && y >= 0 && x < photo.width && y < photo.height;
      const q = inPhoto ? photo.mask[Math.floor(y) * photo.width + Math.floor(x)] : 0;
      const colour = inPhoto ? [0, 1, 2].map((c) => sample(photo.rgb, photo.width, photo.height, 3, x - 0.5, y - 0.5, c)) : [255, 255, 255];
      put(tiles.photo, i, colour);
      const u = (x - tx) / s - 0.5;
      const v = (y - ty) / s - 0.5;
      const inside = u >= -0.5 && v >= -0.5 && u < model.width - 0.5 && v < model.height - 0.5;
      const rgba = inside ? [0, 1, 2, 3].map((c) => sample(model.rgba, model.width, model.height, 4, u, v, c)) : [0, 0, 0, 0];
      // Premultiplied, over white.
      put(tiles.model, i, [0, 1, 2].map((c) => Math.min(255, rgba[c] + 255 - rgba[3])));
      inModel[i] = rgba[3] > 64 ? 1 : 0;
      const grey = (colour[0] + colour[1] + colour[2]) / 3;
      put(tiles.overlay, i, colour.map((c) => 0.35 * (0.5 * c + 0.5 * grey) + 0.65 * 255));
      const hatch = q === 2 && (X + Y) % 10 < 2;
      put(tiles.difference, i, q === 2 ? (hatch ? [200, 200, 196] : [246, 246, 244]) : q === 1 && inModel[i] ? [200, 199, 193] : q === 1 ? [47, 111, 222] : inModel[i] ? [217, 65, 46] : [255, 255, 255]);
      if (hatch) put(tiles.overlay, i, [200, 200, 196]);
    }
  }
  // The model's outline, two pixels wide.
  for (let Y = 1; Y < H - 1; Y++) {
    for (let X = 1; X < W - 1; X++) {
      const i = Y * W + X;
      if (inModel[i] && (!inModel[i - 1] || !inModel[i + 1] || !inModel[i - W] || !inModel[i + W])) {
        for (const j of [i, i + 1, i + W]) put(tiles.overlay, j, [214, 32, 27]);
      }
    }
  }
  const files = {};
  for (const name of names) {
    const buffer = tiles[name];
    files[name] = path.join(dir, `ref-${id}-${name}.png`);
    await sharp(buffer, { raw: { width: W, height: H, channels: 3 } }).png().toFile(files[name]);
  }
  return files;
}

function describe(view) {
  if (typeof view === 'string') return view === 'top' ? 'from above' : `from the ${view}`;
  return `at ${view.azimuth}°, ${view.elevation}° up, ${view.fov}° lens`;
}

function proportionText(p) {
  const pct = Math.abs(p * 100).toFixed(0);
  if (pct === '0') return 'proportions match';
  return `${pct}% ${p > 0 ? 'wider' : 'narrower'} for its height than the real thing`;
}

const round = (n) => Math.round(n * 1000) / 1000;
