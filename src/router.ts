export type Route =
  | { page: 'gallery'; category: string | null }
  | { page: 'thing'; slug: string }
  | { page: 'about' }
  | { page: 'capture' }
  | { page: 'missing' };

/** Hash routes: #/ (optionally ?c=<category>), #/thing/<slug>, #/about.
 *  Returns null for hashes that aren't routes, such as in-page anchors. */
export function parseHash(hash: string): Route | null {
  if (hash === '' || hash === '#') return { page: 'gallery', category: null };
  if (!hash.startsWith('#/')) return null;
  const [path, query = ''] = hash.slice(2).split('?');
  const segments = path.split('/').filter(Boolean).map(decodeURIComponent);
  if (segments.length === 0) return { page: 'gallery', category: new URLSearchParams(query).get('c') };
  if (segments[0] === 'thing' && segments.length === 2) return { page: 'thing', slug: segments[1] };
  if (segments[0] === 'about' && segments.length === 1) return { page: 'about' };
  if (import.meta.env.DEV && segments[0] === 'capture') return { page: 'capture' };
  return { page: 'missing' };
}

export function galleryHref(category: string | null = null): string {
  return category ? `#/?c=${encodeURIComponent(category)}` : '#/';
}

export function thingHref(slug: string): string {
  return `#/thing/${encodeURIComponent(slug)}`;
}
