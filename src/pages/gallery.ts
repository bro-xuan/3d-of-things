import { categories, categoryLabel, figure, posterSrcset, posterUrl, things } from '../content';
import { esc, type Page } from '../dom';
import { galleryHref, thingHref, type Route } from '../router';
import type { Thing } from '../types';

/**
 * Column spans for n plates in a three-column grid. Rows alternate between a
 * wide-and-narrow pair and three narrow plates, and the last row is always
 * full, so a filtered list never leaves holes.
 */
export function plateSpans(n: number): number[] {
  const pattern = [[2, 1], [1, 1, 1], [1, 2], [1, 1, 1]];
  const spans: number[] = [];
  for (let row = 0; spans.length < n; row++) {
    const remaining = n - spans.length;
    let next = pattern[row % pattern.length];
    if (remaining < next.length) next = remaining === 1 ? [3] : remaining === 2 ? (row % 2 ? [1, 2] : [2, 1]) : [1, 1, 1];
    spans.push(...next);
  }
  return spans;
}

const SIZES: Record<number, string> = {
  1: '(max-width: 40rem) 92vw, (max-width: 64rem) 46vw, 31vw',
  2: '(max-width: 40rem) 92vw, (max-width: 64rem) 46vw, 31vw',
  3: '(max-width: 40rem) 46vw, 31vw',
};

function poster(thing: Thing, span: number, exploded: boolean, eager: boolean): string {
  // Exploded posters only show on hover (or in full-width plates), so they always load lazily;
  // on touch screens CSS hides them and the browser never fetches them.
  const loading = eager && !exploded ? 'eager' : 'lazy';
  return `<img class="plate__img plate__img--${exploded ? 'apart' : 'together'}" src="${posterUrl(thing, 800, exploded)}"
    srcset="${posterSrcset(thing, exploded)}" sizes="${SIZES[span]}" width="1280" height="1280" alt="" loading="${loading}" decoding="async"
    ${eager && !exploded ? 'fetchpriority="high"' : ''}>`;
}

function plate(thing: Thing, span: number, index: number, eager: boolean): string {
  return `
    <li class="plate plate--span-${span}" style="--i:${index}">
      <a class="plate__link" href="${thingHref(thing.slug)}" data-slug="${esc(thing.slug)}">
        <div class="plate__frame">
          ${poster(thing, span, false, eager)}
          ${poster(thing, span, true, eager)}
          <span class="plate__fig">${figure(thing)}</span>
        </div>
        <div class="plate__caption">
          <p class="plate__kind">${esc(categoryLabel(thing.category))}</p>
          <h2 class="plate__title">${esc(thing.title)}</h2>
          <p class="plate__hook">${esc(thing.hook)}</p>
        </div>
      </a>
    </li>`;
}

export function gallery(main: HTMLElement, route: Extract<Route, { page: 'gallery' }>, { entering = false } = {}): Page {
  main.innerHTML = `
    <div class="gallery${entering ? ' is-entering' : ''}">
      <section class="intro">
        <h1 class="intro__title" tabindex="-1">How things work, <em>taken&nbsp;apart.</em></h1>
        <p class="intro__lede">Real machines you can turn over, look inside and pull to pieces in your browser, with numbered callouts that explain what each part does.</p>
      </section>
      <nav class="filters" aria-label="Filter by kind"></nav>
      <ol class="plates" aria-label="Objects"></ol>
    </div>`;
  const filters = main.querySelector<HTMLElement>('.filters')!;
  const list = main.querySelector<HTMLOListElement>('.plates')!;

  function show(category: string | null) {
    const active = categories.some((c) => c.id === category) ? category : null;
    const tabs = [{ id: null, label: 'All' }, ...categories].map(({ id, label }) => {
      const count = id ? things.filter((t) => t.category === id).length : things.length;
      return `<a href="${galleryHref(id)}" ${id === active ? 'aria-current="true"' : ''}>${esc(label)}<span class="filters__count">${count}</span></a>`;
    });
    filters.innerHTML = tabs.join('');
    const shown = things.filter((t) => !active || t.category === active);
    const spans = plateSpans(shown.length);
    list.innerHTML = shown.map((thing, i) => plate(thing, spans[i], i, i < 3)).join('');
  }

  // Name the clicked poster so the view transition can carry it into the object page.
  list.addEventListener('click', (event) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('.plate__link');
    const img = link?.querySelector<HTMLElement>('.plate__img--together');
    if (!img) return;
    // Only one element may carry the name, e.g. after a cmd-click that didn't navigate.
    for (const other of list.querySelectorAll<HTMLElement>('.plate__img')) other.style.viewTransitionName = '';
    img.style.viewTransitionName = 'poster';
  });

  // Start fetching the 3D viewer (three.js) as soon as someone shows interest in an object.
  const prefetch = (event: Event) => {
    if (!(event.target as Element).closest?.('.plate__link')) return;
    void import('../viewer/Viewer');
    for (const type of ['pointerover', 'focusin', 'touchstart']) list.removeEventListener(type, prefetch);
  };
  for (const type of ['pointerover', 'focusin', 'touchstart']) list.addEventListener(type, prefetch, { passive: true });

  show(route.category);
  return {
    title: '3D of Things · How machines work, taken apart',
    update(next) {
      if (next.page !== 'gallery') return false;
      show(next.category);
      return true;
    },
  };
}
