import { categoryLabel, figure, getThing, partLetter, posterSrcset, posterUrl, things, thumbUrl } from '../content';
import { esc, icons, prefersReducedMotion, type Page } from '../dom';
import { thingHref } from '../router';
import type { Part, Thing } from '../types';
import { sound } from '../sound';
import { drawingScale, showDrawings } from './drawings';
import { theatre } from './theatre';
import { Tour, tourMarkup } from './tour';
// Only types: three.js arrives in its own chunk once the page (and its poster) is up.
import type { Drawing, LookMode, Viewer } from '../viewer/Viewer';
import { missing } from './missing';

function partItem(part: Part, i: number): string {
  return `<li><button class="parts__item" type="button" data-part="${i}"><span class="parts__letter">${partLetter(i)}</span>${esc(part.label)}</button></li>`;
}

/** The parts legend: one list, or a list per group when the content file groups its parts. */
function partsLegend(parts: Part[]): string {
  if (!parts.some((part) => part.group)) return `<ol class="parts" aria-label="Parts">${parts.map(partItem).join('')}</ol>`;
  const groups: { name: string; items: string[] }[] = [];
  parts.forEach((part, i) => {
    const name = part.group ?? '';
    if (groups[groups.length - 1]?.name !== name) groups.push({ name, items: [] });
    groups[groups.length - 1].items.push(partItem(part, i));
  });
  return `<div class="parts-groups">${groups
    .map(({ name, items }) => `<div class="parts-group"><h3 class="parts-group__heading">${esc(name)}</h3><ol class="parts" aria-label="${esc(name)}">${items.join('')}</ol></div>`)
    .join('')}</div>`;
}

/** Every object in order, as a cut-out on a card: the one on show is marked, and picking another hands the model over to it. */
function tray(current: Thing): string {
  const items = things.map(
    (thing, i) => `
      <li><a class="tray__item" href="${thingHref(thing.slug)}" data-slug="${esc(thing.slug)}" data-index="${i}"${thing === current ? ' aria-current="page"' : ''}>
        <span class="tray__fig" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <img class="tray__img" src="${thumbUrl(thing)}" alt="" width="240" height="240" decoding="async">
        <span class="tray__title">${esc(thing.title)}</span>
      </a></li>`,
  );
  return `<nav class="tray" aria-label="All objects"><ol>${items.join('')}</ol></nav>`;
}

/** Scale bars come in round lengths: 1, 2 or 5 times a power of ten. */
function roundLength(most: number): number {
  const power = 10 ** Math.floor(Math.log10(most));
  return [5, 2, 1].map((n) => n * power).find((length) => length <= most)!;
}

function lengthLabel(metres: number): string {
  const mm = Math.round(metres * 1000);
  return mm >= 1000 ? `${mm / 1000} m` : mm >= 10 ? `${mm / 10} cm` : `${mm} mm`;
}

function template(thing: Thing): string {
  const index = things.indexOf(thing);
  const prev = things[(index - 1 + things.length) % things.length];
  const next = things[(index + 1) % things.length];
  const canRun = thing.motion?.some((m) => m.speed !== undefined) || !!thing.slowMotion;
  // Things with an escapement tick, or a shutter that clicks: they get a sound switch.
  const ticks = !!thing.motion?.some((m) => m.swing === 'pallet' || m.cloth);
  const how = thing.how ?? [];
  const { credit } = thing;

  return `
  <article class="thing">
    <div class="stage" data-state="loading">
      <div class="viewer" tabindex="0" role="application" aria-roledescription="3D viewer"
        aria-label="${esc(thing.title)}, interactive 3D model" aria-describedby="viewer-help"></div>
      <img class="stage__poster" src="${posterUrl(thing, 800)}" srcset="${posterSrcset(thing)}"
        sizes="(max-width: 52rem) 100vw, 69vw" alt="" fetchpriority="high" style="view-transition-name: poster">
      <span class="stage__marks" aria-hidden="true"></span>
      ${tray(thing)}
      <div class="stage__status" role="status">
        <span class="stage__meter"><span class="stage__meter-fill"></span></span>
        <span class="stage__status-text">Loading model</span>
        <button class="button stage__retry" type="button" data-action="retry" hidden>Try again</button>
      </div>
      <div class="stage__foot">
        <div class="scale" aria-hidden="true"><span class="scale__bar"></span><span class="scale__label"></span></div>
        <p class="stage__hint" id="viewer-help">
          <span class="stage__hint-pointer">Drag to turn · Scroll to zoom · Right-drag to pan</span>
          <span class="stage__hint-touch">Drag to turn · Pinch to zoom · Two fingers to pan</span>
          <span class="stage__hint-keys">Arrow keys turn · + and − zoom · E takes it apart · W draws it in lines · L shows labels · 1–${Math.min(9, thing.annotations.length)} jump to callouts · Esc resets</span>
        </p>
      </div>
      <div class="stage__try"></div>
      <div class="stage__left">
        <div class="controls" role="group" aria-label="Controls">
          ${
            how.length
              ? `<button class="controls__how" type="button" data-action="how" aria-describedby="how-note">How it works</button>
          <p class="controls__note" id="how-note">${how.length} steps, with the model running</p>`
              : ''
          }
          ${
            thing.parts.length
              ? `<div class="controls__apart">
            <div class="controls__apart-head">
              <button class="controls__label" type="button" data-action="explode" aria-keyshortcuts="E"><span>Take it apart</span></button>
              <span class="controls__value" aria-hidden="true">assembled</span>
            </div>
            <input class="explode__range controls__range" type="range" min="0" max="100" step="1" value="0" aria-label="How far apart" aria-valuetext="Assembled">
          </div>`
              : ''
          }
          <div class="controls__toggles">
            ${canRun ? `<button class="controls__toggle" type="button" data-action="run" aria-pressed="false"><span>${esc(thing.motionLabel ?? 'Run it')}</span></button>` : ''}
            <button class="controls__toggle" type="button" data-action="labels" aria-pressed="false" aria-keyshortcuts="L"><span>Labels</span></button>
          </div>
        </div>
      </div>
      <div class="stage__right">
        <div class="stage__drawings" role="group" aria-label="Drawings: the top, front and side, at the model's real size"></div>
      </div>
      <div class="stage__corner">
        <div class="views" role="group" aria-label="How the model is drawn">
          <button class="view-card" type="button" data-look="rendered" aria-pressed="true">
            <span class="view-card__thumb"><img src="${thumbUrl(thing)}" alt="" width="240" height="240" decoding="async"></span>
            <span class="view-card__name">Rendered</span>
          </button>
          <button class="view-card view-card--lines" type="button" data-look="wireframe" aria-pressed="false" aria-keyshortcuts="W">
            <span class="view-card__thumb"><img class="view-card__lines" src="${thumbUrl(thing)}" alt="" width="240" height="240" decoding="async"><span class="view-card__scan" aria-hidden="true"></span></span>
            <span class="view-card__name">Wireframe <kbd aria-hidden="true">W</kbd></span>
          </button>
        </div>
        <div class="stage__tools">
          <button class="tool" type="button" data-action="reset" title="Reset view">${icons.reset}<span class="visually-hidden">Reset view</span></button>
          <button class="tool" type="button" data-action="fullscreen" title="Full screen" hidden>${icons.expand}<span class="visually-hidden">Full screen</span></button>
          ${ticks ? `<button class="tool" type="button" data-action="sound" aria-pressed="false" title="Sound">${icons.mute}<span class="visually-hidden">Sound</span></button>` : ''}
        </div>
      </div>
      <div class="stage__caption" aria-hidden="true">
        <span class="stage__caption-num"></span>
        <div><p class="stage__caption-title"></p><p class="stage__caption-text"></p></div>
        <button class="stage__caption-close" type="button" data-action="close-callout" tabindex="-1">${icons.close}<span class="visually-hidden">Close</span></button>
      </div>
    </div>

    <div class="sheet">
      <div class="sheet__page">
      <header>
        <p class="eyebrow"><span>${figure(thing)}</span><span>${esc(categoryLabel(thing.category))}</span></p>
        <h1 class="sheet__title" tabindex="-1">${esc(thing.title)}</h1>
        <p class="sheet__hook">${esc(thing.hook)}</p>
      </header>

      <div class="sheet__controls"></div>

      <div class="prose">${thing.summary.map((p) => `<p>${esc(p)}</p>`).join('')}</div>

      ${
        thing.facts?.length
          ? `<dl class="facts">${thing.facts.map((f) => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join('')}</dl>`
          : ''
      }

      ${
        thing.parts.length
          ? `<section aria-labelledby="apart-heading">
        <h2 class="section-label" id="apart-heading">Parts</h2>
        ${partsLegend(thing.parts)}
      </section>`
          : ''
      }

      <section aria-labelledby="callouts-heading">
        <h2 class="section-label" id="callouts-heading">Up close</h2>
        <ol class="callouts">
          ${thing.annotations
            .map(
              (a, i) => `
            <li class="callout">
              <button class="callout__head" type="button" aria-expanded="false" aria-controls="callout-${i}" data-callout="${i}">
                <span class="callout__num">${i + 1}</span><span class="callout__title">${esc(a.title)}</span>
              </button>
              <div class="callout__body" id="callout-${i}"><div><p>${esc(a.text)}</p></div></div>
            </li>`,
            )
            .join('')}
        </ol>
      </section>

      <section aria-labelledby="drawings-heading" class="drawings">
        <h2 class="section-label" id="drawings-heading">Drawings</h2>
        <div class="drawings__views"><p class="drawings__wait">Drawn from the model, front, side and top.</p></div>
      </section>

      <footer class="credit">
        <p><span class="credit__label">Model</span> ${
          credit.sourceUrl
            ? `<a href="${esc(credit.sourceUrl)}" rel="noopener" target="_blank">${esc(credit.title)}</a> by ${esc(credit.author)}, from ${esc(credit.source)}.`
            : `${esc(credit.title)}, built in code by ${esc(credit.author)}.`
        }
          Licensed <a href="${esc(credit.licenseUrl)}" rel="license noopener" target="_blank">${esc(credit.license)}</a>.</p>
        ${credit.extra ? `<p><span class="credit__label">${esc(credit.extra.label)}</span> ${esc(credit.extra.text)}</p>` : ''}
        <p><span class="credit__label">Text</span> Written for 3D of Things.</p>
      </footer>

      <nav class="pager" aria-label="More objects">
        <a href="${thingHref(prev.slug)}" data-slug="${esc(prev.slug)}"><span class="pager__dir">← ${figure(prev)}</span><span class="pager__title">${esc(prev.title)}</span></a>
        <a href="${thingHref(next.slug)}" data-slug="${esc(next.slug)}"><span class="pager__dir">${figure(next)} →</span><span class="pager__title">${esc(next.title)}</span></a>
      </nav>
      </div>
      ${how.length ? tourMarkup(thing) : ''}
    </div>
  </article>`;
}

export function thingPage(main: HTMLElement, slug: string): Page {
  const thing = getThing(slug);
  if (!thing) return missing(main);
  main.innerHTML = template(thing);

  const q = <T extends Element = HTMLElement>(selector: string) => main.querySelector<T>(selector);
  const stage = q('.stage')!;
  const viewport = q('.viewer')!;
  const statusText = q('.stage__status-text')!;
  const meter = q('.stage__meter-fill')!;
  const range = q<HTMLInputElement>('.explode__range');
  const explodeButton = q<HTMLButtonElement>('[data-action="explode"]');
  const runButton = q<HTMLButtonElement>('[data-action="run"]');
  const fullscreenButton = q<HTMLButtonElement>('[data-action="fullscreen"]')!;
  const caption = q('.stage__caption')!;
  const calloutList = q('.callouts')!;
  const calloutItems = [...main.querySelectorAll<HTMLElement>('.callout')];
  const partItems = [...main.querySelectorAll<HTMLElement>('.parts__item')];
  const narrow = matchMedia('(max-width: 52rem)');
  let active: number | null = null;
  let viewer: Viewer | null = null;
  let destroyed = false;
  // The 3D layer joins the page now, so a model leaving the last object stays on screen while this one loads.
  theatre.adopt(q('.thing')!, stage);
  if (theatre.handingOver) stage.classList.add('is-handover');

  // ------------------------------------------------------------- callouts
  function select(index: number | null, { fly = true } = {}) {
    if (index !== null && (index < 0 || index >= thing!.annotations.length)) return;
    active = index;
    calloutItems.forEach((item, i) => {
      item.classList.toggle('is-open', i === index);
      item.querySelector('.callout__head')!.setAttribute('aria-expanded', String(i === index));
    });
    // On wide screens the text shows on the model, beside the part; the panel keeps it for screen readers.
    calloutList.classList.toggle('is-on-model', index !== null && !narrow.matches);
    if (index === null) {
      caption.classList.remove('is-visible');
      viewer?.hideCard();
    } else {
      const annotation = thing!.annotations[index];
      showCaption(String(index + 1), annotation.title, annotation.text);
      if (!narrow.matches) viewer?.showCard({ mark: String(index + 1), kind: 'callout', title: annotation.title, text: annotation.text }, { callout: index });
      // On phones the panel scrolls under the sticky viewer: bring the text into view.
      if (narrow.matches) calloutItems[index].scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
    if (fly) viewer?.focusCallout(index);
  }

  /** The text card over the bottom of the stage, on narrow screens. */
  function showCaption(mark: string, title: string, text: string) {
    caption.querySelector('.stage__caption-num')!.textContent = mark;
    caption.querySelector('.stage__caption-title')!.textContent = title;
    caption.querySelector('.stage__caption-text')!.textContent = text;
    caption.classList.add('is-visible');
  }

  /** A part picked on the model or in the legend: its callout if one explains it, otherwise its name and what it does. */
  function pickPart(index: number | null) {
    if (index === null) return select(null, { fly: false });
    const callout = viewer?.calloutForPart(index) ?? null;
    if (callout !== null) return select(callout, { fly: false });
    select(null, { fly: false });
    const part = thing!.parts[index];
    showCaption(partLetter(index), part.label, part.about ?? '');
    if (!narrow.matches) viewer?.showCard({ mark: partLetter(index), kind: 'part', title: part.label, text: part.about, eyebrow: part.group }, { part: index });
  }

  main.querySelector('.callouts')!.addEventListener('click', (event) => {
    const head = (event.target as Element).closest<HTMLElement>('[data-callout]');
    if (!head) return;
    const index = Number(head.dataset.callout);
    select(active === index ? null : index);
  });

  // ---------------------------------------------------------------- explode
  function showExplode(value: number) {
    if (!range) return;
    range.value = String(Math.round(value * 100));
    range.style.setProperty('--fill', `${value * 100}%`);
    const text = value <= 0 ? 'Assembled' : value >= 1 ? 'Fully exploded' : `${Math.round(value * 100)}% apart`;
    range.setAttribute('aria-valuetext', text);
    const readout = q('.controls__value');
    if (readout) readout.textContent = value <= 0 ? 'assembled' : value >= 1 ? 'all apart' : `${Math.round(value * 100)}% apart`;
    const label = explodeButton?.querySelector('span');
    if (label) label.textContent = value > 0.5 ? 'Put it back together' : 'Take it apart';
  }

  range?.addEventListener('input', () => viewer?.setExplode(Number(range.value) / 100));
  explodeButton?.addEventListener('click', () => toggleExplode());
  function toggleExplode() {
    if (viewer) void viewer.animateExplode(viewer.explodeValue > 0.5 ? 0 : 1);
  }

  runButton?.addEventListener('click', () => {
    const running = runButton.getAttribute('aria-pressed') !== 'true';
    runButton.setAttribute('aria-pressed', String(running));
    runButton.querySelector('svg')?.replaceWith(document.createRange().createContextualFragment(running ? icons.pause : icons.play));
    if (!viewer) return;
    const slow = thing.slowMotion;
    if (!slow) {
      viewer.setRunning(running);
      return;
    }
    // A clock can't be stopped, only slowed: open it up first so there's something to watch.
    viewer.setSlowMotion(running);
    if (running && slow.explode !== undefined && viewer.explodeValue < 0.1) void viewer.animateExplode(slow.explode);
  });

  // ------------------------------------------------------------------ looks
  let look: LookMode = 'rendered';
  const lookButtons = [...main.querySelectorAll<HTMLButtonElement>('.view-card[data-look]')];
  function setLook(mode: LookMode) {
    look = mode;
    viewer?.setLook(mode);
    for (const button of lookButtons) button.setAttribute('aria-pressed', String(button.dataset.look === mode));
    stage.dataset.look = mode;
  }
  for (const button of lookButtons) button.addEventListener('click', () => setLook(button.dataset.look as LookMode));

  const soundButton = q<HTMLButtonElement>('[data-action="sound"]');
  const showSound = (on: boolean) => {
    if (!soundButton) return;
    soundButton.setAttribute('aria-pressed', String(on));
    soundButton.querySelector('svg')!.outerHTML = on ? icons.sound : icons.mute;
  };
  soundButton?.addEventListener('click', () => sound.set(!sound.on));
  const stopSound = sound.subscribe(showSound);
  showSound(sound.on);

  // ----------------------------------------------------------------- labels
  // The model starts clean: callout numbers and part letters show only when asked for (the choice is remembered).
  const LABELS_KEY = '3d-of-things:labels';
  let labelsOn = false;
  try {
    labelsOn = localStorage.getItem(LABELS_KEY) === 'on';
  } catch {
    labelsOn = false;
  }
  const labelsButton = q<HTMLButtonElement>('[data-action="labels"]');
  function setLabels(on: boolean) {
    labelsOn = on;
    viewer?.setLabels(on);
    labelsButton?.setAttribute('aria-pressed', String(on));
    try {
      localStorage.setItem(LABELS_KEY, on ? 'on' : 'off');
    } catch {
      // Not remembered in a private window; still works for this visit.
    }
  }
  labelsButton?.addEventListener('click', () => setLabels(!labelsOn));
  labelsButton?.setAttribute('aria-pressed', String(labelsOn));

  // On phones the controls sit in the sheet, just under the model; on wide screens on the stage, under the drawings.
  const controls = q('.controls')!;
  const placeControls = () => (narrow.matches ? q('.sheet__controls')! : q('.stage__left')!).append(controls);
  // So the model stands centred between the columns: the room each side keeps clear is read by the viewer.
  placeControls();
  narrow.addEventListener('change', placeControls);

  // ----------------------------------------------------------- how it works
  const tourRoot = q('.tour');
  const tour = tourRoot
    ? new Tour(tourRoot, thing, {
        onToggle: (on) => {
          q('.thing')!.toggleAttribute('data-touring', on);
          select(null, { fly: false });
          // The tour runs (and stops) the mechanism itself: the sheet's run button starts from off again.
          if (runButton && runButton.getAttribute('aria-pressed') === 'true') {
            runButton.setAttribute('aria-pressed', 'false');
            runButton.querySelector('svg')?.replaceWith(document.createRange().createContextualFragment(icons.play));
            if (thing.slowMotion) viewer?.setSlowMotion(false);
          }
          if (on) q('.sheet')!.scrollTo({ top: 0 });
          else q<HTMLButtonElement>('[data-action="how"]')?.focus({ preventScroll: true });
          // On phones the tour is in the sheet under the model: bring it up.
          if (on && narrow.matches) tourRoot.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
        },
        stageSlot: q('.stage__try')!,
        stage,
        narrow,
      })
    : null;
  q('[data-action="how"]')?.addEventListener('click', () => tour?.start(0));

  // -------------------------------------------------------------- drawings
  // Printed on the stage's paper beside the model on wide screens (on phones, in the sheet), and drawn by the
  // viewer once the model is in. Picking a view turns the model to match it.
  const drawingsHost = () => (narrow.matches ? q('.drawings__views')! : q('.stage__drawings')!);
  const drawingsHeight = (host: HTMLElement) => (host.classList.contains('stage__drawings') ? host.clientHeight : rem * 32);
  let drawings: Drawing[] = [];
  let takeDrawingsDown: (() => void) | null = null;
  function placeDrawings() {
    takeDrawingsDown?.();
    takeDrawingsDown = null;
    if (!drawings.length) return;
    const host = drawingsHost();
    takeDrawingsDown = showDrawings(host, drawings, { maxHeight: () => drawingsHeight(host), onView: (view) => void viewer?.lookFrom(view) });
  }
  narrow.addEventListener('change', placeDrawings);
  async function drawUp(ready: Viewer) {
    const host = drawingsHost();
    const size = ready.realSize;
    const scale = drawingScale(size, host.clientWidth || rem * 20, drawingsHeight(host) || rem * 32, rem);
    drawings = await ready.drawings(scale * Math.min(devicePixelRatio, 2));
    if (destroyed) return;
    placeDrawings();
    // The wireframe card shows the model as it'll look, drawn now that its lines exist.
    const url = await ready.wireframeThumbnail(120);
    const image = q<HTMLImageElement>('.view-card__lines');
    if (url && image && !destroyed) {
      image.src = url;
      image.classList.add('is-drawn');
    }
  }

  // ------------------------------------------------------------------ parts
  function markPart(index: number | null) {
    partItems.forEach((item, i) => item.classList.toggle('is-highlighted', i === index));
  }
  for (const item of partItems) {
    const index = Number(item.dataset.part);
    item.addEventListener('pointerenter', () => viewer?.highlightPart(index));
    item.addEventListener('pointerleave', () => viewer?.highlightPart(null));
    item.addEventListener('focus', () => viewer?.highlightPart(index));
    item.addEventListener('blur', () => viewer?.highlightPart(null));
    item.addEventListener('click', () => {
      viewer?.focusPart(index);
      pickPart(index);
    });
  }

  // -------------------------------------------------------------- scale bar
  const scaleBar = q('.scale__bar')!;
  const scaleLabel = q('.scale__label')!;
  let rem = 16;
  const measureRem = () => (rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16);
  measureRem();
  addEventListener('resize', measureRem);
  /** The longest round length that fits in about 7rem, drawn to the model's real size. */
  function showScale(pixelsPerMetre: number) {
    const metres = roundLength((7 * rem) / pixelsPerMetre);
    scaleBar.style.width = `${(metres * pixelsPerMetre).toFixed(1)}px`;
    const label = lengthLabel(metres);
    if (scaleLabel.textContent !== label) scaleLabel.textContent = label;
  }

  // ------------------------------------------------------------------ tools
  q('[data-action="reset"]')!.addEventListener('click', () => {
    select(null, { fly: false });
    void viewer?.resetView();
  });
  q('[data-action="close-callout"]')!.addEventListener('click', () => select(null));
  if (document.fullscreenEnabled) {
    fullscreenButton.hidden = false;
    fullscreenButton.addEventListener('click', () => {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void stage.requestFullscreen();
    });
  }
  const onFullscreen = () => {
    const on = document.fullscreenElement === stage;
    fullscreenButton.innerHTML = `${on ? icons.collapse : icons.expand}<span class="visually-hidden">${on ? 'Exit full screen' : 'Full screen'}</span>`;
    fullscreenButton.title = on ? 'Exit full screen' : 'Full screen';
  };
  document.addEventListener('fullscreenchange', onFullscreen);

  // Keyboard control while the viewer has focus.
  viewport.addEventListener('keydown', (event) => {
    if (!viewer || event.metaKey || event.ctrlKey || event.altKey) return;
    const step = Math.PI / 12;
    const actions: Record<string, () => void> = {
      ArrowLeft: () => viewer!.orbit(-step, 0),
      ArrowRight: () => viewer!.orbit(step, 0),
      ArrowUp: () => viewer!.orbit(0, -step),
      ArrowDown: () => viewer!.orbit(0, step),
      '+': () => viewer!.zoom(0.8),
      '=': () => viewer!.zoom(0.8),
      '-': () => viewer!.zoom(1.25),
      Escape: () => {
        if (tour?.active) return tour.stop();
        select(null, { fly: false });
        void viewer!.resetView();
      },
      e: toggleExplode,
      E: toggleExplode,
      w: () => setLook(look === 'wireframe' ? 'rendered' : 'wireframe'),
      W: () => setLook(look === 'wireframe' ? 'rendered' : 'wireframe'),
      l: () => setLabels(!labelsOn),
      L: () => setLabels(!labelsOn),
    };
    const digit = /^[1-9]$/.test(event.key) ? Number(event.key) - 1 : null;
    // Keys keep focus on the model: a step picked by number doesn't move it to the panel.
    const action = actions[event.key] ?? (digit === null ? null : tour?.active ? () => tour.go(digit, { focus: false }) : () => select(digit));
    if (!action) return;
    event.preventDefault();
    action();
  });

  // ----------------------------------------------------------------- viewer
  async function start() {
    stage.dataset.state = 'loading';
    q<HTMLButtonElement>('[data-action="retry"]')!.hidden = true;
    statusText.textContent = 'Loading model';
    // Let the poster land first: it's what you look at while the model streams in.
    await q<HTMLImageElement>('.stage__poster')!.decode().catch(() => {});
    let ViewerImpl: typeof Viewer;
    try {
      ({ Viewer: ViewerImpl } = await import('../viewer/Viewer'));
    } catch (error) {
      console.error(error);
      stage.dataset.state = 'error';
      statusText.textContent = 'The viewer didn’t load. Check your connection and try again.';
      q<HTMLButtonElement>('[data-action="retry"]')!.hidden = false;
      return;
    }
    if (destroyed) return;
    try {
      viewer = theatre.open(ViewerImpl, thing!.slug, viewport, {
        reducedMotion: prefersReducedMotion(),
        onSelect: (index) => select(active === index ? null : index),
        onExplode: showExplode,
        onHoverPart: markPart,
        onPick: pickPart,
        onInteract: () => q('.stage__hint')?.classList.add('is-dismissed'),
        onScale: showScale,
      });
    } catch {
      stage.dataset.state = 'unsupported';
      statusText.textContent = 'This browser can’t show 3D (WebGL is off or unavailable). Here’s a still instead.';
      return;
    }
    try {
      await viewer.load(thing!, (fraction) => {
        stage.toggleAttribute('data-indeterminate', fraction === null);
        if (fraction !== null) {
          meter.style.setProperty('--progress', String(fraction));
          statusText.textContent = fraction < 1 ? `Loading model · ${Math.round(fraction * 100)}%` : 'Assembling';
        }
      });
      if (destroyed) return;
      stage.dataset.state = 'ready';
      statusText.textContent = `${thing!.title} loaded`;
      // For authoring content: __viewer.probe(node, from), __viewer.pick(x, y), __viewer.currentPose().
      if (import.meta.env.DEV) Object.assign(window, { __viewer: viewer });
      if (look !== 'rendered') viewer.setLook(look, { animate: false });
      viewer.setLabels(labelsOn);
      viewer.setSounds({ beat: (beat) => sound.tick(beat), click: () => sound.ratchet(), shutter: (curtain, event) => sound.shutter(curtain, event) });
      const ready = viewer;
      void theatre.show(viewer, thing!.slug).then(() => {
        tour?.attach(ready);
        // Out of the way of the opening move: drawing the lines takes a moment on slow machines. (A busy
        // render loop can leave no idle time at all, so it doesn't wait for long.)
        if ('requestIdleCallback' in window) requestIdleCallback(() => void drawUp(ready), { timeout: 1200 });
        else setTimeout(() => void drawUp(ready), 300);
      });
    } catch (error) {
      console.error(error);
      stage.dataset.state = 'error';
      statusText.textContent = 'The model didn’t load. Check your connection and try again.';
      q<HTMLButtonElement>('[data-action="retry"]')!.hidden = false;
    }
  }
  q('[data-action="retry"]')!.addEventListener('click', () => void start());
  void start();

  // Fetch an object's model when someone reaches for it in the tray or the pager, so the hand-over is quick.
  const fetched = new Set<string>();
  const prefetch = (event: Event) => {
    const slug = (event.target as Element).closest<HTMLAnchorElement>('a')?.dataset.slug;
    const model = slug && slug !== thing.slug && getThing(slug)?.model;
    if (!model || fetched.has(model)) return;
    fetched.add(model);
    void fetch(model).catch(() => {});
  };
  for (const element of [q('.tray')!, q('.pager')!]) {
    for (const type of ['pointerover', 'focusin', 'touchstart']) element.addEventListener(type, prefetch, { passive: true });
  }

  // The tray shows the objects in order, so one picked there comes in from its side of this one.
  const here = things.indexOf(thing);
  q('.tray')!.addEventListener('click', (event) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('.tray__item');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const to = Number(link.dataset.index);
    if (to !== here) theatre.comeFrom(to > here ? 1 : -1);
  });

  return {
    title: `${thing.title} · 3D of Things`,
    destroy(next) {
      destroyed = true;
      tour?.destroy();
      stopSound();
      narrow.removeEventListener('change', placeDrawings);
      narrow.removeEventListener('change', placeControls);
      takeDrawingsDown?.();
      for (const drawing of drawings) URL.revokeObjectURL(drawing.url);
      document.removeEventListener('fullscreenchange', onFullscreen);
      removeEventListener('resize', measureRem);
      if (document.fullscreenElement) void document.exitFullscreen();
      // Going to another object, this model slides out as that one slides in.
      theatre.release(next.page === 'thing' ? next.slug : null);
    },
  };
}
