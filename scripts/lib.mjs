// Shared helpers for the model pipeline scripts.
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CONTENT_DIR = path.join(ROOT, 'content');
export const CACHE_DIR = path.join(ROOT, '.cache', 'sources');
export const PUBLIC_DIR = path.join(ROOT, 'public');

/** Every content file, as `{ slug, file, data }`, optionally filtered by slug. */
export async function listThings(onlySlugs = []) {
  const files = (await readdir(CONTENT_DIR)).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
  const things = [];
  for (const file of files.sort()) {
    const slug = file.replace(/\.json$/, '');
    if (onlySlugs.length && !onlySlugs.includes(slug)) continue;
    const data = JSON.parse(await readFile(path.join(CONTENT_DIR, file), 'utf8'));
    things.push({ slug, file, data });
  }
  return things;
}

/** Poly Haven asset id from a source URL like https://polyhaven.com/a/<id>, or null. */
export function polyHavenId(sourceUrl = '') {
  const match = /^https:\/\/polyhaven\.com\/a\/([\w-]+)\/?$/.exec(sourceUrl);
  return match ? match[1] : null;
}

/** Where the downloaded source for a Poly Haven asset lives. */
export function polyHavenCacheDir(id) {
  return path.join(CACHE_DIR, 'polyhaven', id);
}
