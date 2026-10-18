// The live watch at the top of the skill's page: the collection's pocket watch, its case turned to
// glass as in the first step of its tour, running in step with your clock. Drag turns it; W winds it,
// S slows time to a twentieth and E takes it apart, from the keyboard or the buttons under it.
// three.js arrives after the poster is up, and the watch stops drawing while it's out of sight.
import watch from '../../content/pocket-watch.json';
import { prefersReducedMotion } from '../dom';
import type { Thing } from '../types';
import { FULL_RESERVE } from '../viewer/clockwork';
import type { Viewer } from '../viewer/Viewer';

const thing = { ...watch, slug: 'pocket-watch' } as unknown as Thing;
const BEATS = 6;

export function mountLive(figure: HTMLElement): void {
  const q = <T extends HTMLElement>(selector: string) => figure.querySelector<T>(selector)!;
  const viewport = q('.live__viewer');
  const readout = q('.live__readout');
  const announce = q('[data-announce]');
  const button = (act: string) => q<HTMLButtonElement>(`[data-act="${act}"]`);

  let viewer: Viewer | null = null;
  let visible = true;
  let slow = false;
  let apart = false;
  let winding = false;
  let wasFull = false;

  const say = (text: string) => (announce.textContent = text);

  function setWinding(on: boolean) {
    if (on === winding || !viewer?.canWind) return;
    winding = on;
    button('wind').classList.toggle('is-held', on);
    viewer.wind(on);
    if (on) say('Winding');
  }

  function toggleSlow() {
    if (!viewer) return;
    slow = !slow;
    button('slow').setAttribute('aria-pressed', String(slow));
    viewer.setSlowMotion(slow);
    say(slow ? 'Slowed to a twentieth' : 'Real time');
  }

  /** The first step of the watch's tour: the case as glass, the movement solid, the power as a red line. */
  function showIdea() {
    const step = thing.how?.[0];
    if (!viewer || !step) return;
    viewer.setFocus(step.focus ?? null);
    viewer.setFlow([step.flow ?? [], ...(step.flows ?? [])], step.carries);
    viewer.showStep(step);
  }

  // Apart, every part is solid, as on the watch's own page; together again, it goes back to the glass case.
  function toggleApart() {
    if (!viewer) return;
    apart = !apart;
    button('apart').setAttribute('aria-pressed', String(apart));
    if (apart) {
      viewer.setFocus(null);
      viewer.setFlow();
      void viewer.animateExplode(1);
    } else showIdea();
    say(apart ? 'Taken apart' : 'Put together');
  }

  function update() {
    const state = viewer?.mechanismState;
    if (!state) return;
    const pace = slow ? `${BEATS * (thing.slowMotion?.rate ?? 0.05)} beats a second, slowed` : `${BEATS} beats a second`;
    const full = state.reserve >= FULL_RESERVE - 0.05;
    const power = full ? `fully wound, ${FULL_RESERVE} h` : `power left ${Math.max(0, Math.round(state.reserve))} h`;
    const text = `${pace} · ${power}${state.winding && !full ? ' · winding' : ''}`;
    if (readout.textContent !== text) readout.textContent = text;
    if (full && !wasFull && winding) say(`Fully wound: ${FULL_RESERVE} hours of running`);
    wasFull = full;
  }

  // The buttons: wind while held, slow and apart toggle.
  const wind = button('wind');
  wind.addEventListener('pointerdown', (event) => {
    wind.setPointerCapture(event.pointerId);
    setWinding(true);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) wind.addEventListener(type, () => setWinding(false));
  wind.addEventListener('keydown', (event) => {
    if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
      event.preventDefault();
      setWinding(true);
    }
  });
  wind.addEventListener('keyup', (event) => {
    if (event.key === ' ' || event.key === 'Enter') setWinding(false);
  });
  button('slow').addEventListener('click', toggleSlow);
  button('apart').addEventListener('click', toggleApart);

  // The same from the keyboard, while the watch is in view.
  document.addEventListener('keydown', (event) => {
    if (!viewer || !visible || event.metaKey || event.ctrlKey || event.altKey) return;
    if ((event.target as Element).closest('input, textarea, select, [contenteditable]')) return;
    const key = event.key.toLowerCase();
    if (key === 'w') {
      event.preventDefault();
      if (!event.repeat) setWinding(true);
    } else if (key === 's' && !event.repeat) toggleSlow();
    else if (key === 'e' && !event.repeat) toggleApart();
  });
  document.addEventListener('keyup', (event) => {
    if (event.key.toLowerCase() === 'w') setWinding(false);
  });
  window.addEventListener('blur', () => setWinding(false));
  viewport.addEventListener('keydown', (event) => {
    const turn = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, -0.08], ArrowDown: [0, 0.08] }[event.key];
    if (!turn || !viewer) return;
    event.preventDefault();
    viewer.orbit(turn[0], turn[1]);
  });

  async function start() {
    figure.dataset.state = 'loading';
    await q<HTMLImageElement>('.live__poster').decode().catch(() => {});
    let ViewerImpl: typeof Viewer;
    try {
      ({ Viewer: ViewerImpl } = await import('../viewer/Viewer'));
      viewer = new ViewerImpl(viewport, { reducedMotion: prefersReducedMotion(), onInteract: () => figure.classList.add('is-touched') });
    } catch (error) {
      // No WebGL, or the viewer didn't arrive: the poster stays.
      console.error(error);
      figure.dataset.state = 'poster';
      return;
    }
    // The page scrolls under the wheel, and under a vertical swipe on a phone: dragging turns the watch, nothing zooms or pans.
    viewer.controls.enableZoom = false;
    viewer.controls.enablePan = false;
    viewport.style.touchAction = 'pan-y';
    try {
      await viewer.load(thing);
    } catch (error) {
      console.error(error);
      viewer.dispose();
      viewer = null;
      figure.dataset.state = 'poster';
      return;
    }
    viewer.reveal();
    showIdea();
    viewer.onFrame(update);
    figure.dataset.state = 'ready';
    for (const element of figure.querySelectorAll('button')) element.disabled = false;
    viewer.setPaused(!visible);
  }

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    viewer?.setPaused(!visible);
    if (!visible) setWinding(false);
  }).observe(figure);

  void start();
}
