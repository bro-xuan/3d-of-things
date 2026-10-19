// "How it works": the mechanism explained one stage at a time. The sheet's card turns into the
// tour's page (what the step says, a chart that runs with the model, something to try) while the
// model shows the step: the parts it's about stay solid and the rest turn to ghosts, the path the
// power takes is drawn through them, and the camera goes where you can see it happen.
import { drawChart, type Chart, type ChartSource } from '../charts';
import { esc, icons, prefersReducedMotion } from '../dom';
import type { Step, Thing } from '../types';
import { FULL_RESERVE, REST_RESERVE } from '../viewer/clockwork';
import * as Rangefinder from '../viewer/filmcamera';
import { STROKES, distanceLabel, slitWidth, speedLabel } from '../viewer/filmcamera';
import * as Reflex from '../viewer/reflexcamera';
import { FLOOR, G, LOW_AIR, MASS, corneringG } from '../viewer/aerocar';
import { tapeTry } from './tapetry';
// Only types: the viewer arrives with three.js, after the page is up.
import type { Viewer } from '../viewer/Viewer';
import { lockTry } from './locktry';

/** Slow motion, for steps that run at full speed, is this fraction of real time. */
const SLOW = 1 / 16;
/** A shutter's run is slowed to last about this long on screen (s), however fast the speed. */
const SHUTTER_ON_SCREEN = 2.6;
/** Per kind of camera: its lens's numbers, the shutter speeds to try (fast enough to need slowing down, to slow enough
 *  to watch at speed) and how far to slow a release so it lasts about SHUTTER_ON_SCREEN. */
const CAMERAS = {
  rangefinder: {
    kind: 'rangefinder' as const,
    stops: Rangefinder.STOPS,
    restStop: Rangefinder.REST_STOP,
    nearest: Rangefinder.NEAREST,
    maxExtension: Rangefinder.MAX_EXTENSION,
    distanceFor: Rangefinder.distanceFor,
    speeds: [1 / 1000, 1 / 250, 1 / 50, 1 / 10, 1],
    slowFor: (speed: number) => Math.min(1, Math.max(1 / 120, (speed + 2 * Rangefinder.CURTAIN_TRAVEL) / SHUTTER_ON_SCREEN)),
  },
  reflex: {
    kind: 'reflex' as const,
    stops: Reflex.STOPS,
    restStop: Reflex.REST_STOP,
    nearest: Reflex.NEAREST,
    maxExtension: Reflex.MAX_EXTENSION,
    distanceFor: Reflex.distanceFor,
    speeds: [1 / 500, 1 / 125, 1 / 30, 1 / 8, 1],
    slowFor: (speed: number) => Math.min(1, Math.max(1 / 120, Reflex.releaseEnds(speed) / 1000 / SHUTTER_ON_SCREEN)),
  },
};

export function tourMarkup(thing: Thing): string {
  const steps = thing.how ?? [];
  // Next names the step it goes to. Every step's wording is stacked in the button, so it's always as wide as the
  // longest and the bar never shifts from one step to the next.
  const nexts = steps.map((_, i) => (steps[i + 1] ? `Next<span class="tour__next-name">: ${esc(steps[i + 1].label)}</span>` : 'Done'));
  return `
    <section class="tour" aria-labelledby="tour-title" hidden>
      <div class="tour__bar">
        <p class="eyebrow tour__eyebrow"><span>How it works</span><span class="tour__count"></span></p>
        <button class="tour__exit" type="button" data-tour="exit">${icons.close}<span>Close</span></button>
      </div>
      <div class="tour__page" aria-live="polite">
        <h2 class="tour__title" id="tour-title" tabindex="-1"></h2>
        <div class="tour__text"></div>
        <div class="tour__try-home"></div>
        <figure class="tour__figure">
          <p class="tour__figure-title"></p>
          <div class="tour__chart"></div>
          <figcaption class="tour__caption"></figcaption>
        </figure>
      </div>
      <div class="tour__try" role="group" aria-label="Try it">
        <div class="tour__try-actions"></div>
        <p class="tour__readout" aria-live="off"></p>
        <button class="tour__toggle" type="button" data-tour="slow" aria-pressed="false">Slow motion</button>
      </div>
      <nav class="tour__nav" aria-label="Steps" hidden>
        <button class="tool tour__back" type="button" data-tour="prev" title="Back (←)" aria-keyshortcuts="ArrowLeft">${icons.back}<span class="visually-hidden">Back</span></button>
        <ol class="tour__steps">
          ${steps
            .map(
              (step, i) => `<li><button class="tour__step" type="button" data-step="${i}" aria-label="${esc(`Step ${i + 1}: ${step.label}`)}">
              <span class="tour__step-num" aria-hidden="true">${i + 1}</span><span class="tour__step-label" aria-hidden="true">${esc(step.label)}</span></button></li>`,
            )
            .join('')}
        </ol>
        <button class="button button--ink tour__next" type="button" data-tour="next"><span class="tour__next-labels">${nexts.map((label) => `<span>${label}</span>`).join('')}</span>${icons.next}</button>
      </nav>
    </section>`;
}

interface TourOptions {
  /** The tour opened or closed: the page swaps the sheet over. */
  onToggle(on: boolean): void;
  /** Where the step's controls go on wide screens: on the stage, by the model. */
  stageSlot: HTMLElement;
  /** The stage. The step bar (back, the steps, next) stands on it, by the model on every screen; on phones the
   *  page scrolls under it. */
  stage: HTMLElement;
  /** Narrow screens keep the step's controls in the tour's page, under the text. */
  narrow: MediaQueryList;
}

export class Tour {
  /** The step on show, or -1 when the tour is closed. */
  index = -1;
  private viewer: Viewer | null = null;
  private chart: Chart | null = null;
  private stopFrames: (() => void) | null = null;
  private frame = 0;
  private slow = false;
  /** The chosen one of a step's `speeds`. */
  private selected = 0;
  /** Undoes whatever the current step's experiment left switched on. */
  private undoTry: (() => void) | null = null;
  private readouts: (() => void)[] = [];
  private readonly steps: Step[];
  /** The step's controls (something to try, slow motion): by the model on wide screens. */
  private readonly tryBox: HTMLElement;
  /** Back, the steps and next: on the stage, in the same place on every step. */
  private readonly bar: HTMLElement;
  private readonly q = <T extends Element = HTMLElement>(selector: string) =>
    (this.root.querySelector<T>(selector) ?? this.tryBox.querySelector<T>(selector) ?? this.bar.querySelector<T>(selector))!;
  private readonly place = () => (this.options.narrow.matches ? this.q('.tour__try-home') : this.options.stageSlot).append(this.tryBox);
  /** On wide screens the step's controls take the stage's other bottom corner from the bar, or stand over the bar
   *  where the stage is too narrow for both. (Layout boxes, so the bar's entrance doesn't count.) */
  private readonly fit = () => {
    if (!this.active || this.options.narrow.matches) return;
    const slot = this.options.stageSlot;
    const gap = parseFloat(getComputedStyle(document.documentElement).fontSize);
    slot.classList.toggle('is-over', slot.offsetLeft + slot.offsetWidth + gap > this.bar.offsetLeft);
  };
  private readonly sizes = new ResizeObserver(this.fit);

  constructor(
    readonly root: HTMLElement,
    private readonly thing: Thing,
    private readonly options: TourOptions,
  ) {
    this.steps = thing.how ?? [];
    this.tryBox = root.querySelector('.tour__try')!;
    this.tryBox.hidden = true;
    this.bar = root.querySelector('.tour__nav')!;
    options.stage.append(this.bar);
    this.place();
    options.narrow.addEventListener('change', this.place);
    // The bar's own size too: it changes as it shows, and if the type comes in late.
    this.sizes.observe(options.stage);
    this.sizes.observe(this.bar);
    this.tryBox.addEventListener('click', (event) => {
      if ((event.target as Element).closest('[data-tour="slow"]')) this.setSlow(!this.slow);
    });
    document.addEventListener('keydown', this.onKey);
    root.addEventListener('click', (event) => {
      const target = event.target as Element;
      const step = target.closest<HTMLElement>('[data-step]');
      if (step) return this.go(Number(step.dataset.step));
      if (target.closest('[data-tour="exit"]')) this.stop();
    });
    // Stepping on from the bar keeps keyboard focus on it, to carry on from.
    this.bar.addEventListener('click', (event) => {
      const target = event.target as Element;
      const step = target.closest<HTMLElement>('[data-step]');
      if (step) return this.go(Number(step.dataset.step), { focus: false });
      const action = target.closest<HTMLElement>('[data-tour]')?.dataset.tour;
      if (action === 'prev') this.go(this.index - 1, { focus: false });
      else if (action === 'next') this.index < this.steps.length - 1 ? this.go(this.index + 1, { focus: false }) : this.stop();
    });
  }

  /** The tour's keys, from anywhere on the page: Esc closes it, and ← and → go back and on, except on the model (its
   *  arrows turn it) and on controls that take arrows themselves. */
  private readonly onKey = (event: KeyboardEvent) => {
    if (!this.active || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      return this.stop();
    }
    const way = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!way || event.shiftKey || (event.target as Element).closest('input, select, textarea, [contenteditable], [role="radiogroup"], [role="application"]')) return;
    event.preventDefault();
    // The last step stays put: Done (or Esc) closes the tour.
    if (this.index + way < this.steps.length) this.go(this.index + way, { focus: false });
  };

  get active(): boolean {
    return this.index >= 0;
  }

  /** The viewer is ready: show the step the tour is on, if it was opened before the model loaded. */
  attach(viewer: Viewer): void {
    this.viewer = viewer;
    if (this.active) {
      this.enterViewer();
      this.applyStep();
    }
  }

  start(index = 0): void {
    if (!this.steps.length) return;
    const opening = !this.active;
    if (opening) {
      this.root.hidden = this.bar.hidden = false;
      this.options.onToggle(true);
      this.enterViewer();
    }
    this.go(index, { focus: opening });
    this.fit();
  }

  private enterViewer(): void {
    // The parts a step is about stay solid and everything else turns to glass, so you can see them work.
    this.viewer?.setTouring(true);
  }

  stop(): void {
    if (!this.active) return;
    this.index = -1;
    this.clearStep();
    this.root.hidden = this.tryBox.hidden = this.bar.hidden = true;
    this.options.onToggle(false);
    if (this.viewer) {
      this.viewer.setTouring(false);
      this.viewer.setRate(1);
      this.viewer.setRunning(false);
      this.viewer.setSpinFactor(null);
      if (this.viewer.explodeValue > 0.005) void this.viewer.animateExplode(0, { camera: false });
      void this.viewer.resetView();
    }
  }

  go(index: number, { focus = true } = {}): void {
    if (index < 0 || index >= this.steps.length) return;
    this.clearStep();
    this.index = index;
    const step = this.steps[index];
    const last = index === this.steps.length - 1;
    this.q('.tour__count').textContent = `${index + 1} of ${this.steps.length}`;
    this.bar.querySelectorAll<HTMLElement>('.tour__step').forEach((button, i) => {
      if (i === index) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
      button.classList.toggle('is-done', i < index);
    });
    // The rule the steps stand on is inked in as far as this one.
    this.q('.tour__steps').style.setProperty('--at', String(index / Math.max(1, this.steps.length - 1)));
    const title = this.q('.tour__title');
    title.textContent = step.title;
    this.q('.tour__text').innerHTML = step.text.map((p) => `<p>${esc(p)}</p>`).join('');
    const prev = this.q<HTMLButtonElement>('[data-tour="prev"]');
    const next = this.q<HTMLButtonElement>('[data-tour="next"]');
    // There's no going back from the first step: keyboard focus on Back moves along to Next.
    if (index === 0 && document.activeElement === prev) next.focus({ preventScroll: true });
    prev.disabled = index === 0;
    [...this.q('.tour__next-labels').children].forEach((label, i) => label.classList.toggle('is-on', i === index));
    next.querySelector('svg')!.outerHTML = last ? icons.check : icons.next;
    next.title = last ? 'Close the tour (Esc)' : 'Next step (→)';
    next.setAttribute('aria-keyshortcuts', last ? 'Escape' : 'ArrowRight');

    // The chart, running with the model.
    const figure = this.q('.tour__figure');
    figure.hidden = !step.chart;
    if (step.chart) {
      const source: ChartSource = {
        state: () => this.viewer?.mechanismState ?? null,
        camera: () => this.viewer?.cameraState ?? null,
        aero: () => this.viewer?.aeroState ?? null,
        lock: () => this.viewer?.lockState ?? null,
        extinguisher: () => this.viewer?.extinguisherState ?? null,
        angleOf: (node) => this.viewer?.angleOf(node) ?? 0,
        time: () => this.viewer?.runTime ?? 0,
        selected: () => this.selected,
      };
      this.chart = drawChart(step.chart, this.q('.tour__chart'), { source, thing: this.thing, go: (i) => this.go(i) });
      this.q('.tour__figure-title').textContent = this.chart?.title ?? '';
      this.q('.tour__caption').textContent = this.chart?.caption ?? '';
      figure.hidden = !this.chart;
    }
    this.applySettings(step);
    this.renderTry(step);
    this.slow = (step.rate ?? 1) < 1;
    const slow = this.q<HTMLButtonElement>('[data-tour="slow"]');
    slow.setAttribute('aria-pressed', String(this.slow));
    // Only clockwork can be slowed down (a crank turns as fast as it's turned).
    slow.hidden = !this.thing.slowMotion;
    this.tryBox.hidden = slow.hidden && !step.try;
    this.applyStep();
    this.startFrames();
    this.turnPage();
    // Opened, or stepped on from the page (a chart), keyboard focus goes to the new title.
    if (focus) title.focus({ preventScroll: true });
  }

  /** Starts the new step's page from the top, and fades it in: it changes under a bar that stays put. Wide screens
   *  scroll the sheet; on phones the page scrolls under the model, so the tour's top comes back up to just under it. */
  private turnPage(): void {
    const motion = !prefersReducedMotion();
    if (!this.options.narrow.matches) this.root.closest('.sheet')?.scrollTo({ top: 0 });
    else if (this.root.getBoundingClientRect().top < this.options.stage.getBoundingClientRect().bottom) {
      this.root.scrollIntoView({ block: 'start', behavior: motion ? 'smooth' : 'auto' });
    }
    if (motion) this.q('.tour__page').animate([{ opacity: 0, translate: '0 0.4rem' }, { opacity: 1, translate: '0 0' }], { duration: 320, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
  }

  /** What the model does for the current step. */
  private applyStep(): void {
    const viewer = this.viewer;
    const step = this.steps[this.index];
    if (!viewer || !step) return;
    viewer.setFocus(step.focus ?? null);
    this.applySettings(step);
    viewer.setFlow([step.flow ?? [], ...(step.flows ?? [])], step.carries);
    viewer.setTags(step.tags ?? null);
    viewer.setRate(this.rate(step));
    // Cranks and motors run through a step, unless the step has you turn it yourself.
    if (viewer.canRun) {
      viewer.setSpinFactor(null);
      if (step.speeds && step.spin) this.spinFor(step, this.selected);
      viewer.setRunning(step.try !== 'run' && (step.rate ?? 1) > 0);
    }
    viewer.showStep(step);
  }

  /** Sets the step's spinning parts to one of its `speeds`: all by one factor, or each by its own. */
  private spinFor(step: Step, i: number): void {
    const option = step.speeds?.[i];
    if (!option || !step.spin || !this.viewer) return;
    if (!option.factors) this.viewer.setSpinFactor(step.spin, option.factor);
    else for (const node of step.spin) this.viewer.setSpinFactor([node], option.factors[node] ?? option.factor);
  }

  /** A camera's settings for the step: focus, aperture, shutter speed. */
  private applySettings(step: Step): void {
    const viewer = this.viewer;
    const settings = step.settings;
    if (!viewer || !settings) return;
    if (settings.focus !== undefined) viewer.focusAt(settings.focus || Infinity);
    if (settings.aperture !== undefined) viewer.setStop(Math.max(0, this.cameraSpec().stops.indexOf(settings.aperture)));
    if (settings.slide !== undefined) viewer.setDarkSlide(settings.slide === 'out');
    if (settings.speed !== undefined) viewer.setShutterSpeed(settings.speed);
  }

  /** The numbers for the camera on show (a rangefinder's until the viewer says otherwise). */
  private cameraSpec() {
    return CAMERAS[this.viewer?.cameraState?.kind ?? (this.thing.motion?.some((m) => m.control === 'mirror') ? 'reflex' : 'rangefinder')];
  }

  private rate(step: Step): number {
    const rate = step.rate ?? 1;
    return this.slow ? (rate < 1 ? rate : SLOW) : 1;
  }

  private setSlow(on: boolean): void {
    this.slow = on;
    this.q('[data-tour="slow"]').setAttribute('aria-pressed', String(on));
    const step = this.steps[this.index];
    if (step) this.viewer?.setRate(this.rate(step));
  }

  private clearStep(): void {
    this.undoTry?.();
    this.undoTry = null;
    this.readouts = [];
    this.chart?.destroy();
    this.chart = null;
    this.stopFrames?.();
    this.stopFrames = null;
    cancelAnimationFrame(this.frame);
    this.q('.tour__try-actions').replaceChildren();
    this.q('.tour__readout').textContent = '';
  }

  /** Charts and readouts follow the model frame by frame: in step with the viewer once it's there, on their own until then. */
  private startFrames(): void {
    const tick = () => {
      this.chart?.update?.();
      for (const readout of this.readouts) readout();
    };
    if (this.viewer) {
      this.stopFrames = this.viewer.onFrame(tick);
    } else {
      const loop = () => {
        if (this.viewer) return this.startFrames();
        tick();
        this.frame = requestAnimationFrame(loop);
      };
      this.frame = requestAnimationFrame(loop);
    }
  }

  // ------------------------------------------------------------ experiments

  private renderTry(step: Step): void {
    const host = this.q('.tour__try-actions');
    const kind = step.try;
    if (!kind) return;
    const out = this.q('.tour__readout');
    const readout = (text: () => string) => {
      this.readouts.push(() => {
        const value = text();
        if (out.textContent !== value) out.textContent = value;
      });
    };
    const state = () => this.viewer?.mechanismState ?? null;
    const hours = (h: number) => `${Math.max(0, Math.round(h))} h`;

    if (kind === 'wind') {
      const button = holdButton('Wind the crown', 'Press and hold to wind', (on) => this.viewer?.wind(on));
      host.append(button);
      readout(() => {
        const s = state();
        if (!s) return '';
        if (s.reserve >= FULL_RESERVE - 0.05) return `Fully wound: ${hours(FULL_RESERVE)} of running`;
        return `Power left: ${hours(s.reserve)}${s.winding ? ' · winding' : ''}`;
      });
      this.undoTry = () => this.viewer?.wind(false);
    } else if (kind === 'loose') {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'button button--try';
      button.setAttribute('aria-pressed', 'false');
      const label = (out: boolean) => (button.innerHTML = `${out ? icons.reset : icons.lift}<span>${out ? 'Put the fork back' : 'Take out the pallet fork'}</span>`);
      label(false);
      let out = false;
      button.addEventListener('click', () => {
        out = !out;
        button.setAttribute('aria-pressed', String(out));
        label(out);
        this.viewer?.setLoose(out);
        // A runaway is a sight to see at full speed.
        if (out) this.setSlow(false);
      });
      host.append(button);
      readout(() => {
        const s = state();
        if (!s) return '';
        if (s.loose) return s.reserve > 0.5 ? `Running free · power left ${hours(s.reserve)}` : 'Run down: forty hours gone in seconds';
        return out ? '' : `Power left: ${hours(s.reserve)}`;
      });
      this.undoTry = () => {
        if (out) this.viewer?.setLoose(false);
      };
    } else if (kind === 'run') {
      host.append(holdButton(this.thing.motionLabel ?? 'Run it', 'Press and hold', (on) => this.viewer?.setRunning(on)));
      const counts = step.count ?? [];
      const from = counts.map(({ node }) => this.viewer?.angleOf(node) ?? 0);
      readout(() =>
        counts
          .map(({ node, label }, i) => {
            const turns = Math.abs((this.viewer?.angleOf(node) ?? 0) - from[i]) / (Math.PI * 2);
            return `${label} ${turns.toFixed(1)} ${turns >= 0.95 && turns < 1.05 ? 'turn' : 'turns'}`;
          })
          .join(' · '),
      );
      this.undoTry = () => this.viewer?.setRunning(false);
    } else if (kind === 'speeds') {
      const options = step.speeds ?? [];
      const group = document.createElement('div');
      group.className = 'tour__choices';
      group.setAttribute('role', 'radiogroup');
      group.setAttribute('aria-label', step.label ?? 'Speeds');
      const choose = (i: number) => {
        this.selected = i;
        group.querySelectorAll('button').forEach((b, k) => b.setAttribute('aria-checked', String(k === i)));
        if (step.spin) this.spinFor(step, i);
      };
      options.forEach((option, i) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'tour__choice';
        button.setAttribute('role', 'radio');
        button.textContent = option.label;
        button.addEventListener('click', () => choose(i));
        group.append(button);
      });
      host.append(group);
      choose(Math.min(this.selected, options.length - 1));
      readout(() => options[this.selected]?.note ?? '');
      this.undoTry = () => this.viewer?.setSpinFactor(null);
    } else if (kind === 'focus' || kind === 'aperture') {
      // The lens's rings, as sliders: the focusing ring in even steps of the lens's travel (its scale is spaced so
      // too), the aperture ring from stop to stop. A reflex lens stays open for viewing: its iris closes to the stop
      // set while the slider is held here, as with the camera's preview.
      const focus = kind === 'focus';
      const spec = this.cameraSpec();
      const camera = this.viewer?.cameraState;
      const label = document.createElement('label');
      label.className = 'tour__slider';
      const value = focus ? Math.round(((camera?.set.extension ?? 0) / spec.maxExtension) * 1000) : Math.round(camera?.set.stop ?? spec.restStop);
      const last = spec.stops.length - 1;
      label.innerHTML = focus
        ? `<span>Focusing ring · ∞ to ${spec.nearest} m</span><input type="range" min="0" max="1000" step="1" value="${value}">`
        : `<span>Aperture ring · f/${spec.stops[0]} to f/${spec.stops[last]}</span><input type="range" min="0" max="${last}" step="1" value="${value}">`;
      const input = label.querySelector('input')!;
      const say = () => {
        const v = Number(input.value);
        input.setAttribute('aria-valuetext', focus ? `Focused at ${distanceLabel(spec.distanceFor((v / 1000) * spec.maxExtension))}` : `f/${spec.stops[v]}`);
      };
      input.addEventListener('input', () => {
        const v = Number(input.value);
        if (focus) this.viewer?.focusAt(spec.distanceFor((v / 1000) * spec.maxExtension));
        else this.viewer?.setStop(v);
        say();
      });
      say();
      host.append(label);
      if (!focus && spec.kind === 'reflex') {
        this.viewer?.setStopPreview(true);
        this.undoTry = () => this.viewer?.setStopPreview(false);
      }
      readout(() => {
        const s = this.viewer?.cameraState;
        if (!s) return '';
        if (focus) return `Focused at ${distanceLabel(s.focus)} · glass ${s.extension.toFixed(2)} mm out`;
        const stop = Math.round(s.stop);
        return `f/${spec.stops[stop]} · ${stop === 0 ? 'wide open' : `1/${2 ** stop} of the light at f/${spec.stops[0]}`}`;
      });
    } else if (kind === 'shutter' || kind === 'advance') {
      // Firing and winding on. The shutter step slows the shutter so it can be watched; the advance step takes pictures
      // at full speed and winds on.
      const shutter = kind === 'shutter';
      const spec = this.cameraSpec();
      const camera = () => this.viewer?.cameraState ?? null;
      let pending = 0;
      const button = (icon: string, text: string, act: () => void) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'button button--try';
        b.innerHTML = `${icon}<span>${esc(text)}</span>`;
        b.addEventListener('click', act);
        host.append(b);
        return b;
      };
      if (shutter) {
        const group = document.createElement('div');
        group.className = 'tour__choices';
        group.setAttribute('role', 'radiogroup');
        group.setAttribute('aria-label', 'Shutter speed');
        const choose = (speed: number) => {
          this.viewer?.setShutterSpeed(speed);
          this.viewer?.setRate(spec.slowFor(speed));
          group.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(Number(b.dataset.speed) === speed)));
        };
        for (const speed of spec.speeds) {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'tour__choice';
          b.setAttribute('role', 'radio');
          b.dataset.speed = String(speed);
          b.textContent = speed >= 1 ? '1 s' : `1/${Math.round(1 / speed)}`;
          b.addEventListener('click', () => choose(speed));
          group.append(b);
        }
        host.append(group);
        const now = camera()?.speed ?? spec.speeds[1];
        choose(spec.speeds.reduce((best, s) => (Math.abs(Math.log(s / now)) < Math.abs(Math.log(best / now)) ? s : best)));
      } else {
        this.viewer?.setRate(1);
      }
      // An unwound shutter won't fire: the readout says to wind on.
      button(icons.release, shutter ? 'Fire' : 'Take a picture', () => void this.viewer?.fire());
      if (spec.kind === 'reflex') {
        button(icons.stroke, 'Turn the knob', () => void this.viewer?.windOn());
      } else {
        button(icons.stroke, shutter ? 'Wind on' : 'Stroke the lever', () => {
          if (this.viewer?.windOn()) pending = shutter ? STROKES - 1 : 0;
        });
        // Strokes queued up (both strokes, for "Wind on" in the shutter step) follow each other.
        this.readouts.push(() => {
          const s = camera();
          if (!pending || !s || s.kind !== 'rangefinder' || s.lever > 0 || s.running) return;
          if (s.cocked) pending = 0;
          else if (this.viewer?.windOn()) pending--;
        });
      }
      readout(() => {
        const s = camera();
        if (!s) return '';
        if (s.kind === 'reflex') {
          if (s.winding !== null) return 'One turn: the mirror comes down, the lens is cocked and the film winds on';
          if (s.slideIn && s.cocked) return 'The dark slide is in, so the release is locked';
          if (s.running) return shutter ? `${releaseStage(s.shot ?? 0, s.speed)} · slowed ${Math.round(1 / spec.slowFor(s.speed))}×` : 'Ker-chunk';
          if (!s.cocked) return shutter ? 'Taken. The finder is dark: turn the knob to wind on.' : `Frame ${Math.round(s.frames) + 1} taken · one turn of the knob to the next`;
          return shutter ? `${speedLabel(s.speed)} at f/${s.aperture}: press Fire` : `Frame ${Math.round(s.frames) + 1} ready · press the release`;
        }
        const slit = slitWidth(s.speed);
        const sweep = slit >= 36 ? 'the whole frame open' : `a ${slit.toFixed(1)} mm slit`;
        if (s.lever > 0 || s.strokes) return `Winding on · stroke ${Math.min(STROKES, s.strokes + (s.lever > 0 ? 1 : 0))} of ${STROKES}`;
        if (s.running) return shutter ? `${speedLabel(s.speed)}: ${sweep}, slowed ${Math.round(1 / spec.slowFor(s.speed))}×` : 'Click';
        if (!s.cocked) return shutter ? 'Taken. Wind on to cock the shutter again.' : `Frame ${Math.round(s.frames) + 1} taken · two strokes to the next`;
        return shutter ? `${speedLabel(s.speed)}: ${sweep} crosses the film` : `Frame ${Math.round(s.frames) + 1} ready · press the release`;
      });
      this.undoTry = () => this.viewer?.setRate(1);
    } else if (kind === 'slide') {
      // A reflex camera's magazine: the dark slide in front of the film, which has to be in to take the magazine off.
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'button button--try';
      const label = (out: boolean) => (b.innerHTML = `${out ? icons.reset : icons.lift}<span>${out ? 'Put the dark slide back' : 'Pull out the dark slide'}</span>`);
      let out = !(this.viewer?.cameraState?.kind === 'reflex' && this.viewer.cameraState.slideIn);
      label(out);
      b.setAttribute('aria-pressed', String(out));
      b.addEventListener('click', () => {
        out = !out;
        b.setAttribute('aria-pressed', String(out));
        label(out);
        this.viewer?.setDarkSlide(out);
      });
      host.append(b);
      readout(() => {
        const s = this.viewer?.cameraState;
        if (!s || s.kind !== 'reflex') return '';
        return s.slideIn ? 'Slide in: the film is covered, the release locked, and the magazine can come off' : 'Slide out: the film is open to the lens, ready to shoot';
      });
    } else if (kind === 'suction' || kind === 'grip') {
      // A car's suction fans: switched on, they spin up, the skirts drop and the pressure under the floor falls. For grip, a
      // road speed too: the fans' pull stays the same, the body's and the wing's grows with it.
      const aero = () => this.viewer?.aeroState ?? null;
      const kg = (n: number) => `${(Math.round(n / 10) * 10).toLocaleString('en-GB')} kg`;
      if (kind === 'suction') {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'button button--try';
        let on = !!aero()?.fansOn;
        const label = () => {
          b.innerHTML = `${icons.fan}<span>${on ? 'Switch the fans off' : 'Switch the fans on'}</span>`;
          b.setAttribute('aria-pressed', String(on));
        };
        label();
        b.addEventListener('click', () => {
          on = !on;
          label();
          this.viewer?.setFans(on);
        });
        host.append(b);
        readout(() => {
          const s = aero();
          if (!s) return '';
          if (s.fans < 0.02) return 'Fans off: the air pushes up under the floor as hard as it presses down on top';
          const down = (s.suction * FLOOR) / G;
          return `${(s.suction / 1000).toFixed(1)} kPa less underneath, over ${FLOOR} m²: ${kg(down)} holding it down${s.skirts < 0.95 ? ' · skirts dropping' : `, ${(down / MASS).toFixed(1)}× its weight`}`;
        });
        this.undoTry = () => this.viewer?.setFans(false);
      } else {
        this.viewer?.setFans(true);
        const label = document.createElement('label');
        label.className = 'tour__slider';
        const start = aero()?.speed ?? 0;
        label.innerHTML = `<span>Road speed · 0 to 300 km/h</span><input type="range" min="0" max="300" step="5" value="${start}">`;
        const input = label.querySelector('input')!;
        const say = () => input.setAttribute('aria-valuetext', `${input.value} km/h`);
        input.addEventListener('input', () => {
          this.viewer?.setRoadSpeed(Number(input.value));
          say();
        });
        say();
        host.append(label);
        // The wheels turn with the road speed.
        this.readouts.push(() => {
          const v = (aero()?.speed ?? 0) / 3.6;
          this.viewer?.setRunning(v > 0.05);
          this.viewer?.setSpinFactor(null, Math.min(4, v / 2.2));
        });
        readout(() => {
          const s = aero();
          if (!s) return '';
          const fans = (s.suction * FLOOR) / G;
          const body = s.downforce - fans;
          return `At ${Math.round(s.speed)} km/h: fans ${kg(fans)} + body and wing ${kg(body)} = ${kg(s.downforce)} down · grip for ${corneringG(s.downforce).toFixed(1)} g${s.wing > 0.5 ? ' · wing up' : ''}`;
        });
        this.undoTry = () => {
          this.viewer?.setFans(false);
          this.viewer?.setRoadSpeed(0);
          this.viewer?.setRunning(false);
          this.viewer?.setSpinFactor(null);
        };
      }
    } else if (kind === 'thrust' || kind === 'fly') {
      // A car's thrusters: the rear ones held open for a standing start, or the lift ones for a flight. The air comes out
      // of the tanks as they go; a button fills them again.
      const aero = () => this.viewer?.aeroState ?? null;
      const button = (icon: string, text: string, act: () => void) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'button button--try';
        b.innerHTML = `${icon}<span>${esc(text)}</span>`;
        b.addEventListener('click', act);
        host.append(b);
        return b;
      };
      const tanks = (s: NonNullable<ReturnType<typeof aero>>) => `tanks at ${Math.round(s.bar)} bar, ${Math.round(s.air)} kg of air left`;
      if (kind === 'thrust') {
        host.append(holdButton('Fire the rear thrusters', 'Press and hold to fire', (on) => this.viewer?.fireThrusters(on)));
        // The wheels and motors turn with the car's speed while it runs.
        this.viewer?.setRate(1);
        this.readouts.push(() => {
          const run = aero()?.run;
          this.viewer?.setRunning(!!run && run.v > 0.05);
          if (run) this.viewer?.setSpinFactor(null, Math.min(4, run.v / 2.2));
        });
        readout(() => {
          const s = aero();
          if (!s) return '';
          const run = s.run;
          if (!run) return s.air < LOW_AIR + 5 ? `Out of air: ${tanks(s)}. Refill to fire again.` : `Standing still · ${tanks(s)}`;
          const sixty = run.sixty === null ? '' : `0 to 60 mph in ${run.sixty.toFixed(2)} s · `;
          return `${sixty}${Math.round(run.v * 3.6)} km/h · ${tanks(s)}${run.firing && s.rear < 0.99 ? ' · thrust falling' : ''}`;
        });
        this.undoTry = () => {
          this.viewer?.fireThrusters(false);
          this.viewer?.setRunning(false);
          this.viewer?.setSpinFactor(null);
          this.viewer?.refillAir();
        };
      } else {
        button(icons.lift, 'Hop', () => this.viewer?.fly('hop'));
        button(icons.stroke, 'Barrel roll', () => this.viewer?.fly('roll'));
        readout(() => {
          const s = aero();
          if (!s) return '';
          const f = s.flight;
          if (!f) return s.air < LOW_AIR + 60 ? `Not enough air for another: ${tanks(s)}. Refill to fly again.` : `On the ground · ${tanks(s)}`;
          if (f.t < 0.35) return 'Fans off, skirts up';
          return `${f.height.toFixed(1)} m up · lift ${(f.thrust / 1000).toFixed(0)} kN against its weight of ${(f.weight / 1000).toFixed(0)} kN · ${Math.round(s.air)} kg of air left`;
        });
        this.undoTry = () => this.viewer?.refillAir();
      }
      button(icons.reset, 'Refill the tanks', () => this.viewer?.refillAir());
    } else if (kind === 'lock-insert' || kind === 'lock-turn' || kind === 'lock-keys') {
      // A pin tumbler lock's key: src/pages/locktry.ts.
      this.undoTry = lockTry(kind, host, readout, () => this.viewer, holdButton);
    } else if (kind === 'tape-pull' || kind === 'tape-lock' || kind === 'tape-standout' || kind === 'tape-hook') {
      // A tape measure's blade, lock and hook (src/pages/tapetry.ts).
      this.undoTry = tapeTry(kind, host, readout, () => this.viewer);
    } else if (kind === 'discharge' || kind === 'squeeze') {
      // An extinguisher: pull the pin, squeeze the lever and watch the pressure and the powder fall; held upside down,
      // only the nitrogen comes out. 'squeeze' starts with the pin already out.
      const ext = () => this.viewer?.extinguisherState ?? null;
      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'button button--try';
      const pinLabel = (out: boolean) => (pin.innerHTML = `${out ? icons.reset : icons.lift}<span>${out ? 'Put the pin back' : 'Pull the pin'}</span>`);
      let pulled = kind === 'squeeze';
      this.viewer?.pullPin(pulled);
      pinLabel(pulled);
      pin.addEventListener('click', () => {
        pulled = !pulled;
        this.viewer?.pullPin(pulled);
        pinLabel(pulled);
      });
      host.append(pin, holdButton('Squeeze the lever', 'Press and hold to squeeze', (on) => this.viewer?.squeezeLever(on)));
      const group = document.createElement('div');
      group.className = 'tour__choices';
      group.setAttribute('role', 'radiogroup');
      group.setAttribute('aria-label', 'Which way up');
      const choose = (down: boolean) => {
        this.viewer?.invertExtinguisher(down);
        group.querySelectorAll('button').forEach((b, k) => b.setAttribute('aria-checked', String(k === (down ? 1 : 0))));
      };
      ['Upright', 'Upside down'].forEach((text, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'tour__choice';
        b.setAttribute('role', 'radio');
        b.textContent = text;
        b.addEventListener('click', () => choose(i === 1));
        group.append(b);
      });
      host.append(group);
      choose(false);
      const recharge = document.createElement('button');
      recharge.type = 'button';
      recharge.className = 'button button--try';
      recharge.innerHTML = `${icons.reset}<span>Recharge</span>`;
      recharge.addEventListener('click', () => this.viewer?.rechargeExtinguisher());
      host.append(recharge);
      readout(() => {
        const s = ext();
        if (!s) return '';
        const left = `${s.bar.toFixed(1)} bar · ${s.powder.toFixed(2)} kg of powder left`;
        if (s.blocked) return `The pin holds the lever: pull it first · ${left}`;
        if (s.rate > 0) return `Powder out at ${s.rate.toFixed(2)} kg/s · ${left} · ${s.seconds.toFixed(1)} s`;
        if (s.gasOnly) return s.inverted ? `Upside down: only nitrogen comes out · ${left}` : `The powder is spent: the last nitrogen blows through · ${left}`;
        if (s.bar < 0.05) return `Empty · ${s.powder.toFixed(2)} kg of powder stays behind · Recharge to try again`;
        return `${s.bar >= 7 && s.bar <= 9.8 ? 'In the green' : 'Out of the green'} · ${left}${s.seconds > 0 ? ` · ${s.seconds.toFixed(1)} s used` : ''}`;
      });
      this.undoTry = () => {
        this.viewer?.squeezeLever(false);
        this.viewer?.invertExtinguisher(false);
        this.viewer?.pullPin(false);
        this.viewer?.rechargeExtinguisher();
      };
    } else if (kind === 'hold') {
      host.append(holdButton('Hold the balance', 'Press and hold to stop the balance', (on) => this.viewer?.hold(on)));
      const label = document.createElement('label');
      label.className = 'tour__slider';
      label.innerHTML = `<span>Hours since winding</span><input type="range" min="0" max="${FULL_RESERVE - 1}" step="1" value="${FULL_RESERVE - REST_RESERVE}">`;
      const input = label.querySelector('input')!;
      input.addEventListener('input', () => this.viewer?.setReserve(FULL_RESERVE - Number(input.value)));
      host.append(label);
      readout(() => {
        const s = state();
        if (!s) return '';
        if (s.held) return 'Held: the whole watch waits for the balance';
        return `Swing ±${Math.round(s.amplitude)}° · still 6 beats a second`;
      });
      const before = state()?.reserve ?? REST_RESERVE;
      this.undoTry = () => {
        this.viewer?.hold(false);
        this.viewer?.setReserve(before);
      };
    }
  }

  destroy(): void {
    this.clearStep();
    this.options.narrow.removeEventListener('change', this.place);
    document.removeEventListener('keydown', this.onKey);
    this.sizes.disconnect();
    this.tryBox.remove();
    this.bar.remove();
  }
}

/** What a reflex camera's release is doing, t ms after it was pressed. */
function releaseStage(t: number, speed: number): string {
  const { STAGES } = Reflex;
  if (t < STAGES.closing[1]) return 'the lens’s shutter closes';
  if (t < STAGES.mirror[1]) return 'the mirror swings up';
  if (t < STAGES.flaps[1]) return 'the rear flaps open';
  if (t < STAGES.fire) return 'the key lets the shutter go';
  if (t < STAGES.fire + speed * 1000 + STAGES.blade) return `the shutter is open, ${speedLabel(speed)}`;
  return 'let go: the flaps close again';
}

/** A button that does something for as long as it's held down, by pointer or by Space or Enter. */
function holdButton(text: string, hint: string, set: (on: boolean) => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'button button--try button--hold';
  button.title = hint;
  button.innerHTML = `${icons.hold}<span>${esc(text)}</span>`;
  let down = false;
  const press = (on: boolean) => {
    if (on === down) return;
    down = on;
    button.classList.toggle('is-held', on);
    set(on);
  };
  button.addEventListener('pointerdown', (event) => {
    button.setPointerCapture(event.pointerId);
    press(true);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, () => press(false));
  button.addEventListener('keydown', (event) => {
    if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
      event.preventDefault();
      press(true);
    }
  });
  button.addEventListener('keyup', (event) => {
    if (event.key === ' ' || event.key === 'Enter') press(false);
  });
  button.addEventListener('blur', () => press(false));
  // Touch: no long-press menu or selection while holding.
  button.addEventListener('contextmenu', (event) => event.preventDefault());
  return button;
}
