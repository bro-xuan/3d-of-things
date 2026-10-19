// Helpers for an object's content builder (objects/<slug>/content.mjs), which writes
// content/<slug>.json from the object's text and the build's hints, so no model-space number
// is ever pasted by hand. Lifted from the cars' content builders (objects/family-car/content.mjs and the rest).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const r4 = (v) => +v.toFixed(4);

/** The hints the last `npm run models:build -- <slug>` wrote (build.hints in the content file), or null before the first build. */
export function readHints(slug) {
  const file = path.join(ROOT, 'objects', slug, 'hints.json');
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
}

/**
 * Model-space helpers from the hints' `space` (where the object's origin lands, and how many mm
 * make one model unit):
 *   M(x, y, z)      a point given in mm in the object's frame
 *   U(mm)           a length
 *   pose(target, [azimuth, elevation], distance, { card })   a camera looking at target (azimuth 0 looks from +z)
 */
export function space(H) {
  const { origin, mmPerUnit } = H?.space ?? { origin: [0, 0.5, 0], mmPerUnit: 100 };
  const M = (x, y, z) => [x, y, z].map((v, i) => r4(origin[i] + v / mmPerUnit));
  const U = (mm) => r4(mm / mmPerUnit);
  return { M, U, pose, mmPerUnit, origin };
}

/** How far off centre (a share of the camera's distance) `card` puts a callout's point: about 12% of the frame's width. */
const CARD_SHIFT = 0.08;

/**
 * A camera at [azimuth, elevation] degrees and `distance` from target (model units). A callout's card opens beside its
 * point, on the roomier side (left once the point is past 55% of the frame); `card: 'left'` or `'right'` frames the
 * point off centre so the card lands on that side, over empty background rather than the part it describes.
 */
export function pose(target, [az, el], distance, { card } = {}) {
  const a = (az * Math.PI) / 180;
  const e = (el * Math.PI) / 180;
  // The screen's right, level: the way the camera looks, crossed with up.
  const right = [Math.cos(a), 0, -Math.sin(a)];
  const shift = card === 'left' ? -CARD_SHIFT * distance : card === 'right' ? CARD_SHIFT * distance : 0;
  const aim = target.map((v, i) => v + shift * right[i]);
  return { position: [aim[0] + distance * Math.cos(e) * Math.sin(a), aim[1] + distance * Math.sin(e), aim[2] + distance * Math.cos(e) * Math.cos(a)].map(r4), target: aim.map(r4) };
}

/** Credit for a Poly Haven model (all CC0). Check the author against the API: `npm run models:fetch` does. */
export function polyHaven(id, title, author, extra) {
  return { title, author, license: 'CC0 1.0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/', source: 'Poly Haven', sourceUrl: `https://polyhaven.com/a/${id}`, ...(extra ? { extra } : {}) };
}

/** Credit for a model built in code for this site; `sources` says what it was laid out from. */
export function builtInCode(title, sources) {
  return { title, author: '3D of Things', license: 'CC0 1.0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/', source: 'built in code for this site', sourceUrl: '', extra: { label: 'Sources', text: sources } };
}

/** Writes content/<slug>.json (two-space JSON, as the other content files). */
export function writeContent(slug, thing) {
  const file = path.join(ROOT, 'content', `${slug}.json`);
  writeFileSync(file, JSON.stringify(thing, null, 2) + '\n');
  console.log(`wrote content/${slug}.json: ${thing.parts?.length ?? 0} parts, ${thing.annotations?.length ?? 0} callouts, ${thing.film?.length ? `a film of ${thing.film.reduce((t, shot) => t + shot.duration, 0)} s` : `${thing.how?.length ?? 0} steps`}`);
}
