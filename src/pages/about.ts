import { figure, things } from '../content';
import { esc, type Page } from '../dom';
import { thingHref } from '../router';

export function about(main: HTMLElement): Page {
  const credits = things
    .map(
      (t) => `
      <tr>
        <th scope="row"><a href="${thingHref(t.slug)}">${esc(t.title)}</a><span class="about__fig">${figure(t)}</span></th>
        <td>${t.credit.sourceUrl ? `<a href="${esc(t.credit.sourceUrl)}" rel="noopener" target="_blank">${esc(t.credit.title)}</a>` : esc(t.credit.title)} · ${esc(t.credit.source)}</td>
        <td>${esc(t.credit.author)}</td>
        <td><a href="${esc(t.credit.licenseUrl)}" rel="license noopener" target="_blank">${esc(t.credit.license)}</a></td>
      </tr>`,
    )
    .join('');

  main.innerHTML = `
    <div class="about">
      <p class="eyebrow"><span>About</span></p>
      <h1 class="about__title" tabindex="-1">A small library of machines, <em>taken apart.</em></h1>
      <div class="prose about__lede">
        <p>3D of Things is a free collection of real objects you can turn over, look inside and pull to pieces in your browser. Each one comes with a short explainer and numbered callouts, so you can see what a part does, not just what it looks like.</p>
      </div>

      <section aria-labelledby="use-heading">
        <h2 class="section-label" id="use-heading">How to use it</h2>
        <dl class="about__how">
          <div><dt>Turn it over</dt><dd>Drag to rotate. Scroll or pinch to zoom, right-drag or two-finger drag to pan.</dd></div>
          <div><dt>Look closer</dt><dd>Turn on Labels and numbered markers sit on the parts worth knowing about. Pick one, on the model or in the list, and the camera flies to it. Click any part to see what it does.</dd></div>
          <div><dt>Take it apart</dt><dd>The slider beside the model pulls the parts away from each other. With Labels on, lettered tags name each part; hover one to light it up.</dd></div>
          <div><dt>See how it works</dt><dd>“How it works” walks through the mechanism a stage at a time: the parts it’s about stay solid while the rest turn to glass, a red line traces the power (or an amber one the light), and a chart runs in step with the model. Some stages have something to try, like winding the watch, taking its pallet fork out, or firing the camera’s shutter in slow motion.</dd></div>
          <div><dt>Draw it in lines</dt><dd>The cards at the top right switch between the model as rendered and as a wireframe: a scan line comes down it and redraws it in ink, hidden edges and all. Beside the model, its drawings show it from the top, front and side at its real size; pick one and the model turns to match.</dd></div>
          <div><dt>Keyboard</dt><dd>Focus the 3D view, then use the arrow keys to turn, + and − to zoom, E to take it apart, W for wireframe, L for labels, 1–9 for callouts (or steps, in “How it works”) and Esc to reset.</dd></div>
        </dl>
      </section>

      <section aria-labelledby="credits-heading">
        <h2 class="section-label" id="credits-heading">Where the models come from</h2>
        <p class="about__note">Every model is free to use, under CC0 (public domain) or CC BY. Their makers are credited on each object’s page and here; the one with no maker was built in code for this site. The explanations are written for this site.</p>
        <div class="about__table-wrap">
          <table class="about__credits">
            <thead><tr><th scope="col">Object</th><th scope="col">Model</th><th scope="col">Made by</th><th scope="col">License</th></tr></thead>
            <tbody>${credits}</tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="built-heading">
        <h2 class="section-label" id="built-heading">How it’s made</h2>
        <p class="about__note">A static site: <a href="https://threejs.org" rel="noopener" target="_blank">three.js</a> for the 3D, TypeScript and Vite for the rest. Models are compressed with <a href="https://gltf-transform.dev" rel="noopener" target="_blank">glTF Transform</a> (meshopt geometry, WebP textures) and only load when you open an object. Type is set in Fraunces, Instrument Sans and IBM Plex Mono.</p>
      </section>
    </div>`;
  return { title: 'About · 3D of Things' };
}
