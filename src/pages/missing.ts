import type { Page } from '../dom';

export function missing(main: HTMLElement): Page {
  main.innerHTML = `
    <div class="missing">
      <p class="eyebrow">Fig. 404</p>
      <h1 class="missing__title" tabindex="-1">Nothing on this shelf.</h1>
      <p>That page doesn't exist, or the object has moved.</p>
      <p><a class="button" href="#/">Back to the index</a></p>
    </div>`;
  return { title: 'Not found · 3D of Things' };
}
