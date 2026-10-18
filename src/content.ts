import { asset } from './asset';
import type { CategoryId, Thing } from './types';

export const categories: { id: CategoryId; label: string }[] = [
  { id: 'gears', label: 'Gears & drives' },
  { id: 'optics', label: 'Optics' },
  { id: 'time', label: 'Timekeeping' },
  { id: 'cameras', label: 'Cameras' },
  { id: 'cars', label: 'Cars' },
  { id: 'home', label: 'Home & garden' },
];

const files = import.meta.glob<Omit<Thing, 'slug'>>('../content/*.json', { eager: true, import: 'default' });

/** Every object, in gallery order. Adding one = a .glb in public/models plus a JSON file in content/. */
export const things: Thing[] = Object.entries(files)
  .map(([file, data]) => ({ ...data, slug: file.split('/').pop()!.replace(/\.json$/, '') }))
  .filter((thing) => !thing.slug.startsWith('_'))
  .sort((a, b) => a.order - b.order);

export function getThing(slug: string): Thing | undefined {
  return things.find((thing) => thing.slug === slug);
}

export function categoryLabel(id: CategoryId): string {
  return categories.find((c) => c.id === id)?.label ?? id;
}

/** "Fig. 03" — the plate number used across the site. */
export function figure(thing: Thing): string {
  return `Fig. ${String(things.indexOf(thing) + 1).padStart(2, '0')}`;
}

/** Posters are rendered by `npm run posters` into public/posters/, at these widths. */
export const POSTER_SIZES = [800, 1280] as const;

export function posterUrl(thing: Thing, size: (typeof POSTER_SIZES)[number], exploded = false): string {
  return asset(`posters/${thing.slug}${exploded ? '-exploded' : ''}-${size}.webp`);
}

export function posterSrcset(thing: Thing, exploded = false): string {
  return POSTER_SIZES.map((size) => `${posterUrl(thing, size, exploded)} ${size}w`).join(', ');
}

/** A small cut-out of the assembled poster, trimmed to the object (for the object tray). */
export function thumbUrl(thing: Thing): string {
  return asset(`posters/${thing.slug}-thumb.webp`);
}

/** Letters tag the parts of an exploded model: A, B, C… and on past Z as AA, AB…, as on a drawing. */
export const partLetter = (index: number): string => (index >= 26 ? partLetter(Math.floor(index / 26) - 1) : '') + String.fromCharCode(65 + (index % 26));

if (import.meta.env.DEV) {
  for (const thing of things) {
    const missing = (['title', 'hook', 'category', 'summary', 'model', 'credit'] as const).filter((key) => !thing[key]);
    if (missing.length) console.warn(`content/${thing.slug}.json is missing: ${missing.join(', ')}`);
    if (!categories.some((c) => c.id === thing.category)) console.warn(`content/${thing.slug}.json has unknown category "${thing.category}"`);
  }
}
