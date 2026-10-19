// "How it works" as a short film: the mechanism at work, shot by shot, with one line of caption under the model for
// each, the way an explainer animation runs. It plays on its own from the start; the bar on the stage pauses it, scrubs
// it, jumps between its chapters and slows it down, and the sheet's card turns into its script, with a chart that runs
// with the model where one helps. Each shot ghosts and tags the parts as a tour step does (src/pages/tour.ts), and its
// cues move the mechanism: a key slides in, a lever is squeezed, a shutter fires. The camera never cuts: it glides on a
// smooth path through each shot's view, arriving as the shot starts, and keeps moving at an even pace to the end.
import { drawChart, type Chart, type ChartSource } from '../charts';
import { esc, icons, prefersReducedMotion } from '../dom';
import type { CameraPose, Cue, Shot, Thing, Vec3 } from '../types';
import type { KeyName } from '../viewer/pintumbler';
import type { FlightKind } from '../viewer/aerocar';
// Only types: the viewer arrives with three.js, after the page is up.
import type { Viewer } from '../viewer/Viewer';

type Value = number | boolean | string;

/** What a cue can do. A `number` moves smoothly to its value (from where it was: `from` reads it off the model at rest);
 *  a `switch` is on or off; a `pick` is one of a few words; an `event` just happens. The mechanism plays each one out. */
interface Verb {
  kind: 'number' | 'switch' | 'pick' | 'event';
  /** For a number: where it is at rest, before any cue has moved it. */
  from?: (viewer: Viewer) => number;
  /** For a pick: the words it takes. */
  words?: readonly string[];
  /** Says which models it works on: true if this one has the mechanism. */
  has: (viewer: Viewer) => boolean;
  apply(viewer: Viewer, value: Value): void;
}

const always = () => true;

/** Every cue a film can use. Add one here (and a line in references/film.md) for a new mechanism. */
export const CUES: Record<string, Verb> = {
  // Anything with parts that come apart.
  explode: { kind: 'number', from: (v) => v.explodeValue, has: always, apply: (v, x) => v.setExplode(x as number) },
  // A lock: which key is in (the module slides keys in and out), how far in, and how far it's turned (degrees).
  key: { kind: 'pick', words: ['right', 'wrong', 'none'], has: (v) => !!v.lockState, apply: (v, x) => v.chooseKey(x as KeyName) },
  insert: { kind: 'number', from: (v) => v.lockState?.insert ?? 1, has: (v) => !!v.lockState, apply: (v, x) => v.insertKey(x as number) },
  turn: { kind: 'number', from: (v) => v.lockState?.angle ?? 0, has: (v) => !!v.lockState, apply: (v, x) => v.setKeyAngle(x as number) },
  // A balanced arm: its two angles (degrees from upright), and its springs on or off their pins.
  'arm-lower': { kind: 'number', from: (v) => v.armState?.lower ?? 0, has: (v) => !!v.armState, apply: (v, x) => v.setArm(x as number, null) },
  'arm-upper': { kind: 'number', from: (v) => v.armState?.upper ?? 0, has: (v) => !!v.armState, apply: (v, x) => v.setArm(null, x as number) },
  springs: { kind: 'switch', has: (v) => !!v.armState, apply: (v, x) => v.hookSprings(!!x) },
  // A tape measure: the blade out (mm), let go, the lock, the hook on an edge.
  'tape-out': { kind: 'number', from: (v) => v.tapeState?.out ?? 0, has: (v) => !!v.tapeState, apply: (v, x) => v.setTapeOut(x as number) },
  'tape-let-go': { kind: 'event', has: (v) => !!v.tapeState, apply: (v) => v.letGoTape() },
  'tape-lock': { kind: 'switch', has: (v) => !!v.tapeState, apply: (v, x) => v.setTapeLock(!!x) },
  'tape-hook': { kind: 'switch', has: (v) => !!v.tapeState, apply: (v, x) => v.setTapeHook(!!x) },
  // An extinguisher: the pin out, the lever squeezed, held upside down, filled again.
  pin: { kind: 'switch', has: (v) => !!v.extinguisherState, apply: (v, x) => v.pullPin(!!x) },
  squeeze: { kind: 'switch', has: (v) => !!v.extinguisherState, apply: (v, x) => v.squeezeLever(!!x) },
  invert: { kind: 'switch', has: (v) => !!v.extinguisherState, apply: (v, x) => v.invertExtinguisher(!!x) },
  recharge: { kind: 'event', has: (v) => !!v.extinguisherState, apply: (v) => v.rechargeExtinguisher() },
  // A camera: focus (metres; 0 is infinity), the aperture ring (stops from wide open), the shutter speed (s), the
  // release, a stroke of the advance lever, a reflex's dark slide.
  focus: { kind: 'number', from: (v) => finite(v.cameraState?.focus), has: (v) => !!v.cameraState, apply: (v, x) => v.focusAt((x as number) || Infinity) },
  stop: { kind: 'number', from: (v) => v.cameraState?.stop ?? 0, has: (v) => !!v.cameraState, apply: (v, x) => v.setStop(x as number) },
  speed: { kind: 'pick', has: (v) => !!v.cameraState, apply: (v, x) => v.setShutterSpeed(Number(x)) },
  fire: { kind: 'event', has: (v) => !!v.cameraState, apply: (v) => v.fire() },
  'wind-on': { kind: 'event', has: (v) => !!v.cameraState, apply: (v) => v.windOn() },
  slide: { kind: 'switch', has: (v) => !!v.cameraState, apply: (v, x) => v.setDarkSlide(!!x) },
  preview: { kind: 'switch', has: (v) => !!v.cameraState, apply: (v, x) => v.setStopPreview(!!x) },
  // A car with fans and thrusters: the fans, the road speed (km/h), the rear thrusters, a hop or a roll.
  fans: { kind: 'switch', has: (v) => !!v.aeroState, apply: (v, x) => v.setFans(!!x) },
  wing: { kind: 'switch', has: (v) => !!v.aeroState, apply: (v, x) => v.setWing(!!x) },
  'road-speed': { kind: 'number', from: (v) => v.aeroState?.speed ?? 0, has: (v) => !!v.aeroState, apply: (v, x) => v.setRoadSpeed(x as number) },
  thrust: { kind: 'switch', has: (v) => !!v.aeroState, apply: (v, x) => v.fireThrusters(!!x) },
  fly: { kind: 'pick', words: ['hop', 'roll'], has: (v) => !!v.aeroState, apply: (v, x) => v.fly(x as FlightKind) },
  // Clockwork: the crown turning, the balance held still, the pallet fork taken out.
  wind: { kind: 'switch', has: (v) => v.canWind, apply: (v, x) => v.wind(!!x) },
  hold: { kind: 'switch', has: (v) => !!v.mechanismState, apply: (v, x) => v.hold(!!x) },
  loose: { kind: 'switch', has: (v) => !!v.mechanismState, apply: (v, x) => v.setLoose(!!x) },
};

/** A camera focused at infinity reads 0, as the cue takes it. */
function finite(metres: number | undefined): number {
  return metres === undefined || !Number.isFinite(metres) ? 0 : metres;
}

/** How far a shot stands above the frame's middle (a fraction of its height), clear of the caption and the bar. */
const LIFT = 0.1;
/** How much of the frame a shot's parts fill unless it says: a little less than a tour step, for the caption and bar. */
const FILL = 0.5;
/** Degrees the camera drifts round on through the last shot, so it never comes to a stop mid-film. */
const DRIFT = 12;
/** Seconds the camera takes to fly to the film's first view, and to glide back to its path after the visitor has moved it. */
const INTRO = 1.1;
const REJOIN = 0.9;
/** Speeds to play at, in turn. */
const SPEEDS = [1, 0.5, 0.25];
/** Seconds of the model's own time run at once per step when seeking. */
const SEEK_STEP = 1 / 30;

interface Timed extends Cue {
  /** Seconds from the film's start. */
  time: number;
}

/** One cue's move of a number, eased from wherever the mechanism has it when the move starts (read then, as a cue
 *  that's an event, like a key taken out, may have moved it since the last). */
interface Segment {
  verb: string;
  start: number;
  end: number;
  from: number | null;
  to: number;
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

function clock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** The film's chapters: runs of shots with the same chapter, with their shots (`first` up to `after`) and where each
 *  starts and ends (s). */
function chapters(shots: Shot[]): { name: string; first: number; after: number; start: number; end: number }[] {
  const out: { name: string; first: number; after: number; start: number; end: number }[] = [];
  let t = 0;
  shots.forEach((shot, i) => {
    const last = out[out.length - 1];
    if (last && last.name === shot.chapter) Object.assign(last, { after: i + 1, end: t + shot.duration });
    else out.push({ name: shot.chapter, first: i, after: i + 1, start: t, end: t + shot.duration });
    t += shot.duration;
  });
  return out;
}

/** A view on the camera's path: a moment, and the camera there as numbers that blend smoothly (the target, and the
 *  camera's distance as a log, height angle and heading round it, unwound so it turns the short way). */
interface Key {
  time: number;
  p: number[];
}

function keyFor(time: number, pose: CameraPose, heading?: number): Key {
  const [x, y, z] = pose.position.map((c, i) => c - pose.target[i]);
  const radius = Math.hypot(x, y, z);
  let theta = Math.atan2(x, z);
  if (heading !== undefined) theta += Math.round((heading - theta) / (2 * Math.PI)) * 2 * Math.PI;
  return { time, p: [...pose.target, Math.log(radius), Math.acos(Math.min(1, Math.max(-1, y / radius))), theta] };
}

function poseOf(p: number[]): CameraPose {
  const [tx, ty, tz, logR, phi, theta] = p;
  const r = Math.exp(logR);
  const target: Vec3 = [tx, ty, tz];
  return { target, position: [tx + r * Math.sin(phi) * Math.sin(theta), ty + r * Math.cos(phi), tz + r * Math.sin(phi) * Math.cos(theta)] };
}

/** Where the camera is at a moment: a smooth curve through the keys (cubic Hermite, each key's slope set by its
 *  neighbours, so it never jerks), starting and ending at rest. */
function along(keys: Key[], time: number): CameraPose {
  if (keys.length === 1 || time <= keys[0].time) return poseOf(keys[0].p);
  const last = keys[keys.length - 1];
  if (time >= last.time) return poseOf(last.p);
  let i = 0;
  while (time > keys[i + 1].time) i++;
  const [a, b] = [keys[i], keys[i + 1]];
  const span = b.time - a.time;
  const slope = (k: number) => {
    if (k <= 0 || k >= keys.length - 1) return a.p.map(() => 0);
    const [before, after] = [keys[k - 1], keys[k + 1]];
    return after.p.map((v, j) => (v - before.p[j]) / (after.time - before.time));
  };
  const [ma, mb] = [slope(i), slope(i + 1)];
  const u = (time - a.time) / span;
  const [h00, h10, h01, h11] = [2 * u ** 3 - 3 * u ** 2 + 1, u ** 3 - 2 * u ** 2 + u, -2 * u ** 3 + 3 * u ** 2, u ** 3 - u ** 2];
  return poseOf(a.p.map((v, j) => h00 * v + h10 * span * ma[j] + h01 * b.p[j] + h11 * span * mb[j]));
}

function mix(a: CameraPose, b: CameraPose, t: number): CameraPose {
  const lerp = (u: Vec3, v: Vec3) => u.map((c, i) => c + (v[i] - c) * t) as Vec3;
  return { position: lerp(a.position, b.position), target: lerp(a.target, b.target) };
}

export function filmMarkup(thing: Thing): string {
  const shots = thing.film ?? [];
  const parts = chapters(shots);
  const total = shots.reduce((sum, shot) => sum + shot.duration, 0);
  let t = 0;
  const starts = shots.map((shot) => ((t += shot.duration), t - shot.duration));
  return `
    <section class="tour film" aria-labelledby="film-title" hidden>
      <div class="tour__bar">
        <p class="eyebrow tour__eyebrow"><span>How it works</span><span class="film__count"></span></p>
        <button class="tour__exit" type="button" data-film="exit">${icons.close}<span>Close</span></button>
      </div>
      <div class="film__page">
        <h2 class="tour__title" id="film-title" tabindex="-1"></h2>
        <ol class="film__script">
          ${parts
            .map(
              (part) => `<li class="film__part"><p class="film__part-name">${esc(part.name)}</p><ol>${shots
                .slice(part.first, part.after)
                .map((shot, k) => {
                  const i = part.first + k;
                  return `<li><button class="film__line" type="button" data-shot="${i}"><span class="film__at">${clock(starts[i])}</span><span class="film__said">${esc(shot.caption)}</span></button></li>`;
                })
                .join('')}</ol></li>`,
            )
            .join('')}
        </ol>
        <figure class="tour__figure film__figure" hidden>
          <p class="tour__figure-title"></p>
          <div class="tour__chart"></div>
          <figcaption class="tour__caption"></figcaption>
        </figure>
      </div>
      <div class="film__caption" aria-hidden="true" hidden><p class="film__caption-text"></p></div>
      <div class="film__bar" role="group" aria-label="Film" hidden>
        <button class="film__play" type="button" data-film="play" title="Play (Space)" aria-keyshortcuts="Space">${icons.play}<span class="visually-hidden">Play</span></button>
        <div class="film__track" role="slider" tabindex="0" aria-label="Time" aria-valuemin="0" aria-valuemax="${Math.round(total)}" aria-valuenow="0" aria-valuetext="0:00">
          ${parts
            .map(
              (part) =>
                `<span class="film__chapter" style="flex-grow: ${(part.end - part.start).toFixed(2)}"><span class="film__chapter-bar"><span class="film__chapter-fill"></span></span><span class="film__chapter-name">${esc(part.name)}</span></span>`,
            )
            .join('')}
        </div>
        <span class="film__time" aria-hidden="true">0:00 / ${clock(total)}</span>
        <button class="film__speed" type="button" data-film="speed" title="Playback speed">1×</button>
      </div>
    </section>`;
}

interface FilmOptions {
  /** The film opened or closed: the page swaps the sheet over. */
  onToggle(on: boolean): void;
  /** The stage: the film's bar and caption stand on it. */
  stage: HTMLElement;
}

export class Film {
  /** The shot on show, or -1 when the film is closed. */
  index = -1;
  private viewer: Viewer | null = null;
  private readonly shots: Shot[];
  private readonly starts: number[];
  private readonly total: number;
  private readonly parts: ReturnType<typeof chapters>;
  /** Every cue that isn't a number, in the order they happen. */
  private events: Timed[] = [];
  private segments: Segment[] = [];
  private time = 0;
  private playing = false;
  private speedIndex = 0;
  private chart: Chart | null = null;
  private chartKey = '';
  private stopFrames: (() => void) | null = null;
  private dragging = false;
  /** The camera's path: one key where each shot starts, and one at the end. */
  private keys: Key[] = [];
  /** The camera follows its path (false while it flies in at the start, or after the visitor has moved it). */
  private following = false;
  /** Where the camera was when playing picked up again after the visitor moved it, and how far it's glided back since. */
  private rejoin: { from: CameraPose; t: number } | null = null;
  /** What the model was last given, so a shot that keeps the same focus, path or tags doesn't make them flash. */
  private shown = { focus: '', flow: '', tags: '' };
  private readonly bar: HTMLElement;
  private readonly caption: HTMLElement;
  private readonly track: HTMLElement;
  private readonly q = <T extends Element = HTMLElement>(selector: string) =>
    (this.root.querySelector<T>(selector) ?? this.bar.querySelector<T>(selector) ?? this.caption.querySelector<T>(selector))!;

  constructor(
    readonly root: HTMLElement,
    private readonly thing: Thing,
    private readonly options: FilmOptions,
  ) {
    this.shots = thing.film ?? [];
    let t = 0;
    this.starts = this.shots.map((shot) => ((t += shot.duration), t - shot.duration));
    this.total = t;
    this.parts = chapters(this.shots);
    this.bar = root.querySelector('.film__bar')!;
    this.caption = root.querySelector('.film__caption')!;
    this.track = this.bar.querySelector('.film__track')!;
    options.stage.append(this.caption, this.bar);
    document.addEventListener('keydown', this.onKey);
    root.addEventListener('click', (event) => {
      const target = event.target as Element;
      const line = target.closest<HTMLElement>('[data-shot]');
      if (line) return this.jump(Number(line.dataset.shot));
      if (target.closest('[data-film="exit"]')) this.stop();
    });
    this.bar.addEventListener('click', (event) => {
      const action = (event.target as Element).closest<HTMLElement>('[data-film]')?.dataset.film;
      if (action === 'play') this.toggle();
      else if (action === 'speed') this.cycleSpeed();
    });
    this.track.addEventListener('pointerdown', this.onPointer);
    // Taking hold of the model pauses the film, the way a video stops for you to look; playing again glides back.
    const takeHold = (event: Event) => {
      if (!this.active || !this.playing || (event.target as Element).closest('.film__bar, button, a')) return;
      this.setPlaying(false);
      this.following = false;
    };
    options.stage.addEventListener('pointerdown', takeHold);
    options.stage.addEventListener('wheel', takeHold, { passive: true });
    this.track.addEventListener('keydown', (event) => {
      const way = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        this.seek(event.key === 'Home' ? 0 : this.total);
      } else if (way) {
        event.preventDefault();
        event.stopPropagation();
        this.seek(this.time + way * 2);
      }
    });
  }

  get active(): boolean {
    return this.index >= 0;
  }

  /** For checks: where the film is (s), how long it is, whether it's playing, and the caption on show. */
  get status(): { time: number; total: number; playing: boolean; shot: number; caption: string } {
    return { time: this.time, total: this.total, playing: this.playing, shot: this.index, caption: this.shots[this.index]?.caption ?? '' };
  }

  /** For checks: goes to a moment and holds it there. */
  hold(time: number): void {
    this.setPlaying(false);
    this.seek(time);
  }

  /** The viewer is ready: start the film if it was opened before the model loaded. */
  attach(viewer: Viewer): void {
    this.viewer = viewer;
    if (this.active) this.begin();
  }

  start(): void {
    if (!this.shots.length || this.active) return;
    this.index = 0;
    this.root.hidden = this.bar.hidden = this.caption.hidden = false;
    this.options.onToggle(true);
    this.showShot(0);
    this.q('.tour__title').focus({ preventScroll: true });
    if (this.viewer) this.begin();
  }

  /** From the top, with the model at rest: the cues and the camera's path are laid out against it, the camera flies to
   *  the first view, and it plays (unless motion is reduced). */
  private begin(): void {
    const viewer = this.viewer!;
    viewer.setTouring(true);
    viewer.closeUpShift.set(0, -LIFT);
    viewer.resetMechanisms();
    this.compile(viewer);
    this.stopFrames?.();
    this.stopFrames = viewer.onFrame((dt) => this.tick(dt));
    this.following = false;
    this.seek(0);
    const index = this.index;
    void viewer.flyToPose(along(this.keys, 0), INTRO * 1000).then(() => {
      if (this.index !== index || this.following || this.time > 0) return;
      this.following = true;
      this.setPlaying(!prefersReducedMotion());
    });
  }

  stop(): void {
    if (!this.active) return;
    this.index = -1;
    this.following = false;
    this.rejoin = null;
    this.shown = { focus: '', flow: '', tags: '' };
    this.setPlaying(false);
    this.stopFrames?.();
    this.stopFrames = null;
    this.chart?.destroy();
    this.chart = null;
    this.chartKey = '';
    this.root.hidden = this.bar.hidden = this.caption.hidden = true;
    this.options.onToggle(false);
    const viewer = this.viewer;
    if (viewer) {
      viewer.setTouring(false);
      viewer.closeUpShift.set(0, 0);
      viewer.setRate(1);
      viewer.setRunning(false);
      viewer.setSpinFactor(null);
      if (viewer.explodeValue > 0.005) void viewer.animateExplode(0, { camera: false });
      void viewer.resetView();
    }
  }

  /** Jumps to the start of a chapter (by number, from 0), and plays on from there. */
  go(chapter: number): void {
    const part = this.parts[chapter];
    if (part) this.jump(part.first);
  }

  /** Jumps to the start of a shot, and plays on from there: the camera glides over to it rather than cutting. */
  private jump(index: number): void {
    if (index < 0 || index >= this.shots.length || !this.viewer) return;
    const from = this.viewer.currentPose();
    this.seek(this.starts[index] + 0.001, { camera: false });
    this.following = true;
    this.rejoin = { from, t: 0 };
    this.setPlaying(true);
  }

  // -------------------------------------------------------------- the cues

  /** Lays the cues out on the film's clock: the switches and events in order, and each number's path between its values. */
  private compile(viewer: Viewer): void {
    const timed: Timed[] = this.shots.flatMap((shot, i) => (shot.cues ?? []).map((cue) => ({ ...cue, time: this.starts[i] + cue.at })));
    timed.sort((a, b) => a.time - b.time);
    const known = timed.filter((cue) => {
      const verb = CUES[cue.do];
      if (verb?.has(viewer)) return true;
      if (import.meta.env.DEV) console.warn(`${this.thing.slug}: the film's cue "${cue.do}" ${verb ? "doesn't fit this model" : 'is unknown'}`);
      return false;
    });
    this.events = known.filter((cue) => CUES[cue.do].kind !== 'number');
    this.segments = known
      .filter((cue) => CUES[cue.do].kind === 'number')
      .map((cue) => ({ verb: cue.do, start: cue.time, end: cue.time + (cue.over ?? 0), from: null, to: Number(cue.to) }));
    // The camera arrives at each shot's view as it starts, and drifts on round the last one to the end. Each view frames
    // its parts where they are as the shot starts and where its cues have taken them by its end.
    const views = this.shots.map((shot, i) => {
      this.seek(this.starts[i] + 1e-3, { camera: false });
      const [a0, a1] = viewer.framedBox(shot);
      this.seek(this.starts[i] + shot.duration - 1e-3, { camera: false });
      const [b0, b1] = viewer.framedBox(shot);
      const box: [Vec3, Vec3] = [a0.map((v, k) => Math.min(v, b0[k])) as Vec3, a1.map((v, k) => Math.max(v, b1[k])) as Vec3];
      return viewer.stepPose({ ...shot, fill: shot.fill ?? FILL }, box);
    });
    this.keys = [];
    views.forEach((pose, i) => this.keys.push(keyFor(this.starts[i], pose, this.keys[i - 1]?.p[5])));
    const last = this.keys[this.keys.length - 1];
    if (last) this.keys.push({ time: this.total, p: last.p.map((v, j) => (j === 5 ? v + (DRIFT * Math.PI) / 180 : v)) });
  }

  /** The numbers' values at a moment, for the ones a cue has moved (or is moving) by then. */
  private numbersAt(time: number, since = -Infinity): Map<string, number> {
    const values = new Map<string, number>();
    for (const s of this.segments) {
      // A segment over before `since` was applied already; one not started yet waits.
      if (s.start > time || s.end < since) continue;
      s.from ??= CUES[s.verb].from!(this.viewer!);
      const t = s.end > s.start ? Math.min(1, (time - s.start) / (s.end - s.start)) : 1;
      values.set(s.verb, s.from + (s.to - s.from) * ease(t));
    }
    return values;
  }

  private fire(cue: Timed): void {
    const viewer = this.viewer;
    if (viewer) CUES[cue.do].apply(viewer, cue.to ?? true);
  }

  /** Moves the film's clock from one moment to the next as it plays: the events between go off, the numbers move. */
  private advance(from: number, to: number): void {
    const viewer = this.viewer!;
    for (const cue of this.events) if (cue.time > from && cue.time <= to) this.fire(cue);
    for (const [verb, value] of this.numbersAt(to, from)) CUES[verb].apply(viewer, value);
  }

  /** Goes to a moment: the model is put back to rest and everything before it is played through at once, without drawing. */
  seek(time: number, { camera = true } = {}): void {
    const viewer = this.viewer;
    time = Math.min(this.total, Math.max(0, time));
    if (!viewer) {
      this.time = time;
      return;
    }
    viewer.resetMechanisms();
    for (const s of this.segments) s.from = null;
    let t = 0;
    let before = -Infinity;
    const fired = new Set<Timed>();
    while (true) {
      for (const cue of this.events) if (!fired.has(cue) && cue.time <= t) {
        fired.add(cue);
        this.fire(cue);
      }
      for (const [verb, value] of this.numbersAt(t, before)) CUES[verb].apply(viewer, value);
      if (t >= time) break;
      const step = Math.min(SEEK_STEP, time - t);
      viewer.simulate(step);
      before = t;
      t += step;
    }
    viewer.simulate(0);
    this.time = time;
    const index = this.shotAt(time);
    this.showShot(index, { instant: true });
    // Picked up from a moment, the camera is where the path has it then.
    if (camera && this.keys.length && (this.following || time > 0)) {
      this.following = true;
      this.rejoin = null;
      viewer.followPose(along(this.keys, time));
    }
    this.paint();
  }

  private shotAt(time: number): number {
    let index = 0;
    for (let i = 0; i < this.shots.length; i++) if (time >= this.starts[i] - 1e-6) index = i;
    return index;
  }

  // -------------------------------------------------------------- playing

  private tick(dt: number): void {
    if (!this.playing || this.dragging) return;
    const next = Math.min(this.total, this.time + dt * SPEEDS[this.speedIndex]);
    this.advance(this.time, next);
    this.time = next;
    const index = this.shotAt(next);
    if (index !== this.index) this.showShot(index);
    if (this.following && this.viewer) {
      let pose = along(this.keys, next);
      if (this.rejoin) {
        this.rejoin.t = Math.min(1, this.rejoin.t + dt / REJOIN);
        pose = mix(this.rejoin.from, pose, ease(this.rejoin.t));
        if (this.rejoin.t >= 1) this.rejoin = null;
      }
      this.viewer.followPose(pose);
    }
    this.chart?.update?.();
    if (next >= this.total) this.setPlaying(false);
    this.paint();
  }

  private toggle(): void {
    if (!this.playing && this.time >= this.total - 1e-3) this.seek(0);
    this.setPlaying(!this.playing);
  }

  private setPlaying(on: boolean): void {
    if (on && !this.following && this.viewer && this.keys.length) {
      this.following = true;
      this.rejoin = { from: this.viewer.currentPose(), t: 0 };
    }
    this.playing = on;
    if (this.viewer) this.viewer.timeScale = on ? SPEEDS[this.speedIndex] : 0;
    const button = this.bar.querySelector<HTMLButtonElement>('[data-film="play"]')!;
    const ended = !on && this.time >= this.total - 1e-3;
    const label = on ? 'Pause' : ended ? 'Play again' : 'Play';
    button.innerHTML = `${on ? icons.pause : ended ? icons.reset : icons.play}<span class="visually-hidden">${label}</span>`;
    button.title = `${label} (Space)`;
    this.bar.toggleAttribute('data-playing', on);
  }

  private cycleSpeed(): void {
    this.speedIndex = (this.speedIndex + 1) % SPEEDS.length;
    const speed = SPEEDS[this.speedIndex];
    this.q('[data-film="speed"]').textContent = speed === 1 ? '1×' : speed === 0.5 ? '½×' : '¼×';
    if (this.playing && this.viewer) this.viewer.timeScale = speed;
  }

  /** The bar and the script follow the clock. */
  private paint(): void {
    const time = this.time;
    this.q('.film__time').textContent = `${clock(time)} / ${clock(this.total)}`;
    this.track.setAttribute('aria-valuenow', String(Math.round(time)));
    this.track.setAttribute('aria-valuetext', `${clock(time)}, ${this.shots[this.index]?.chapter ?? ''}`);
    this.track.querySelectorAll<HTMLElement>('.film__chapter').forEach((el, i) => {
      const part = this.parts[i];
      const done = Math.min(1, Math.max(0, (time - part.start) / (part.end - part.start)));
      el.style.setProperty('--done', done.toFixed(4));
      el.classList.toggle('is-on', time >= part.start && (time < part.end || i === this.parts.length - 1));
    });
  }

  // -------------------------------------------------------------- shots

  /** What the model shows for a shot, and what the caption and the script say. */
  private showShot(index: number, { instant = false } = {}): void {
    const shot = this.shots[index];
    if (!shot) return;
    const changed = index !== this.index;
    this.index = index;
    const viewer = this.viewer;
    if (viewer) {
      const focus = JSON.stringify(shot.focus ?? null);
      const flow = JSON.stringify([shot.flow, shot.flows, shot.carries]);
      const tags = JSON.stringify(shot.tags ?? null);
      if (focus !== this.shown.focus) viewer.setFocus(shot.focus ?? null);
      if (flow !== this.shown.flow) viewer.setFlow([shot.flow ?? [], ...(shot.flows ?? [])], shot.carries);
      if (tags !== this.shown.tags) viewer.setTags(shot.tags ?? null);
      this.shown = { focus, flow, tags };
      viewer.setRate(shot.rate ?? 1);
      if (viewer.canRun) {
        viewer.setSpinFactor(null);
        for (const [node, factor] of Object.entries(shot.spin ?? {})) viewer.setSpinFactor([node], factor);
        viewer.setRunning(shot.run !== false);
      }
      viewer.showStep(shot, { instant, camera: false });
    }
    const text = this.q('.film__caption-text');
    if (text.textContent !== shot.caption) {
      text.textContent = shot.caption;
      if (changed && !instant && !prefersReducedMotion()) {
        text.animate([{ opacity: 0, translate: '0 0.35rem' }, { opacity: 1, translate: '0 0' }], { duration: 380, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      }
    }
    this.q('.tour__title').textContent = shot.chapter;
    this.q('.film__count').textContent = `${this.parts.findIndex((p) => index >= p.first && index < p.after) + 1} of ${this.parts.length}`;
    this.root.querySelectorAll<HTMLElement>('.film__line').forEach((line) => {
      const on = Number(line.dataset.shot) === index;
      if (on) line.setAttribute('aria-current', 'step');
      else line.removeAttribute('aria-current');
    });
    if (changed) this.root.querySelector('.film__line[aria-current]')?.scrollIntoView({ block: 'nearest', behavior: instant ? 'auto' : 'smooth' });
    this.showChart(shot);
  }

  /** The shot's chart, kept as it is while the next shot wants the same one. */
  private showChart(shot: Shot): void {
    const key = shot.chart ? JSON.stringify(shot.chart) : '';
    if (key === this.chartKey) return;
    this.chartKey = key;
    this.chart?.destroy();
    this.chart = null;
    const figure = this.q('.film__figure');
    figure.hidden = !shot.chart;
    if (!shot.chart) return;
    const source: ChartSource = {
      state: () => this.viewer?.mechanismState ?? null,
      camera: () => this.viewer?.cameraState ?? null,
      aero: () => this.viewer?.aeroState ?? null,
      arm: () => this.viewer?.armState ?? null,
      lock: () => this.viewer?.lockState ?? null,
      extinguisher: () => this.viewer?.extinguisherState ?? null,
      angleOf: (node) => this.viewer?.angleOf(node) ?? 0,
      time: () => this.viewer?.runTime ?? 0,
      selected: () => 0,
    };
    this.chart = drawChart(shot.chart, this.q('.tour__chart'), { source, thing: this.thing, go: (i) => this.jump(i) });
    this.q('.tour__figure-title').textContent = this.chart?.title ?? '';
    this.q('.tour__caption').textContent = this.chart?.caption ?? '';
    figure.hidden = !this.chart;
  }

  // -------------------------------------------------------------- input

  /** Dragging along the bar scrubs through the film; it plays on from there if it was playing. */
  private readonly onPointer = (event: PointerEvent) => {
    if (event.button !== 0) return;
    event.preventDefault();
    this.track.setPointerCapture(event.pointerId);
    this.dragging = true;
    const wasPlaying = this.playing;
    if (this.viewer) this.viewer.timeScale = 0;
    let queued = 0;
    const at = (e: PointerEvent) => {
      const r = this.track.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      // The chapters' widths follow their lengths, gaps aside: near enough to map straight across.
      cancelAnimationFrame(queued);
      queued = requestAnimationFrame(() => this.seek(x * this.total));
    };
    at(event);
    const move = (e: PointerEvent) => at(e);
    const up = (e: PointerEvent) => {
      this.track.removeEventListener('pointermove', move);
      this.track.removeEventListener('pointerup', up);
      this.track.removeEventListener('pointercancel', up);
      cancelAnimationFrame(queued);
      at(e);
      requestAnimationFrame(() => {
        this.dragging = false;
        this.setPlaying(wasPlaying && this.time < this.total);
      });
    };
    this.track.addEventListener('pointermove', move);
    this.track.addEventListener('pointerup', up);
    this.track.addEventListener('pointercancel', up);
  };

  /** Space plays and pauses, ← and → go back and on a chapter, Esc closes; not on the model or controls that take keys. */
  private readonly onKey = (event: KeyboardEvent) => {
    if (!this.active || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      return this.stop();
    }
    const target = event.target as Element;
    if (target.closest('input, select, textarea, [contenteditable], [role="radiogroup"], [role="slider"]')) return;
    if (event.key === ' ' && !target.closest('button, a')) {
      event.preventDefault();
      return this.toggle();
    }
    const way = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!way || event.shiftKey || target.closest('[role="application"]')) return;
    event.preventDefault();
    const current = this.parts.findIndex((p) => this.time >= p.start && this.time < p.end);
    // Back goes to the start of this chapter first, unless it's only just begun.
    const here = current < 0 ? this.parts.length - 1 : current;
    const to = way > 0 ? here + 1 : this.time - this.parts[here].start > 1.5 ? here : here - 1;
    this.go(to);
  };

  destroy(): void {
    this.stop();
    document.removeEventListener('keydown', this.onKey);
    this.bar.remove();
    this.caption.remove();
  }
}
