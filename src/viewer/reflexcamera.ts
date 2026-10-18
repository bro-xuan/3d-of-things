// A medium-format reflex camera's controls, run in time, after the Hasselblad 500C/M. Pressing the
// release sets off a sequence (from the timing chart in the factory's service manual): the lens's
// shutter, open while you look through the camera, closes; the iris closes down to the stop set; the
// mirror swings up out of the light; the two rear flaps open; then the shutter fires. Letting go
// of the release closes the flaps again, and the mirror stays up until the knob is wound: one turn
// lowers it, cocks the lens's shutter (which opens it, and the iris, for viewing) and winds on a
// frame. The viewer turns the controls into moving parts through the content file's motions
// (src/viewer/linkage.ts); the charts draw from the same numbers. Nothing here touches three.js.
import { clamp01, easeInOutCubic } from './clockwork';
import type { Controls } from './filmcamera';

/** The lens's f-numbers and the shutter's speeds, in ring order. */
export const STOPS = [2.8, 4, 5.6, 8, 11, 16, 22];
export const SPEEDS = [1, 1 / 2, 1 / 4, 1 / 8, 1 / 15, 1 / 30, 1 / 60, 1 / 125, 1 / 250, 1 / 500];
/** Set at rest: f/8, 1/125 s, focused at infinity. */
export const REST_STOP = 3;
export const REST_SPEED = 7;
/** The 80 mm lens focuses down to 0.9 m. */
export const FOCAL = 80;
export const NEAREST = 0.9;
/** From the lens's seat to the film, and the picture's side (mm). */
export const FLANGE = 74.9;
export const PICTURE = 56;
/** Film: 120 roll film, twelve frames 60.5 mm apart. */
export const FRAME_PITCH = 60.5;
export const FRAMES = 12;
/** One release turns the drive key 30/35 of a turn (309°); one turn of the knob turns it back. */
export const KEY_TURN = 30 / 35;

/** How far the glass comes out (mm) to focus at a distance (m). */
export function extensionFor(metres: number): number {
  if (!Number.isFinite(metres) || metres <= 0) return 0;
  const s = metres * 1000 - 2 * FOCAL;
  return (s - Math.sqrt(Math.max(0, s * s - 4 * FOCAL * FOCAL))) / 2;
}
export function distanceFor(extension: number): number {
  if (extension <= 1e-6) return Infinity;
  return (2 * FOCAL + extension + (FOCAL * FOCAL) / extension) / 1000;
}
export const MAX_EXTENSION = extensionFor(NEAREST);

/** Light value (EV at ISO 100) for an f-number and a time: each step is half or double the light. */
export const lightValue = (n: number, seconds: number) => Math.log2((n * n) / seconds);

/**
 * The release, in milliseconds from pressing it, after the service manual's chart: when each part
 * moves. The key's angles are the manual's (117° pre-released, 268° as the shutter fires, 309°
 * fully released); the times are this model's.
 */
export const STAGES = {
  /** The lens's shutter closes and the key turns to its pre-released position. */
  closing: [0, 9] as const,
  key1: [0, 14] as const,
  /** The iris closes down to the stop set. */
  stopping: [2, 32] as const,
  /** The mirror swings up, then the rear flaps open. */
  mirror: [12, 34] as const,
  flaps: [31, 45] as const,
  /** The key turns on, and at 268° lets the shutter go. */
  key2: [45, 50] as const,
  fire: 50,
  /** How long the blades take to swing open, and to swing shut (ms). */
  blade: 1.8,
  /** After the exposure the release is let go: the flaps close and the key turns on to 309°. */
  letGo: 6,
  closeFlaps: 16,
};
const KEY_PRE = 117 / 360;
const KEY_FIRE = 268 / 360;

export interface ReleaseValues {
  /** Drive key (turns), shutter blades (0 open, 1 shut), iris (0 open for viewing, 1 at the stop set), mirror and flaps (0–1). */
  key: number;
  blades: number;
  iris: number;
  mirror: number;
  flaps: number;
  /** The release button: 0 up, 1 pressed. */
  pressed: number;
}

/** The blades' opening, 0 to 1, t ms after they let go at a speed: open over `blade` ms, held, shut over `blade` ms. */
export function bladeOpening(t: number, speed: number): number {
  const tau = STAGES.blade;
  const d = speed * 1000 + tau;
  if (t <= 0 || t >= d) return 0;
  return Math.min(1, t / tau, (d - t) / tau);
}

/** When the release is let go (ms after pressing): just after the shutter shuts. */
export const letGoAt = (speed: number) => STAGES.fire + speed * 1000 + STAGES.blade + STAGES.letGo;
/** When everything has stopped moving (ms). */
export const releaseEnds = (speed: number) => letGoAt(speed) + STAGES.closeFlaps;

const span = (t: number, [a, b]: readonly [number, number]) => clamp01((t - a) / (b - a));

/** Everything the release moves, t ms after it was pressed, at a speed (s). */
export function releaseAt(t: number, speed: number): ReleaseValues {
  const after = Math.max(0, t - letGoAt(speed));
  const letGo = clamp01(after / STAGES.closeFlaps);
  const keyFinal = KEY_TURN;
  let key = KEY_PRE * easeInOutCubic(span(t, STAGES.key1));
  if (t > STAGES.key2[0]) key = KEY_PRE + (KEY_FIRE - KEY_PRE) * easeInOutCubic(span(t, STAGES.key2));
  if (after > 0) key = KEY_FIRE + (keyFinal - KEY_FIRE) * easeInOutCubic(letGo);
  const closing = easeInOutCubic(span(t, STAGES.closing));
  const blades = t < STAGES.fire ? closing : 1 - bladeOpening(t - STAGES.fire, speed);
  // The mirror speeds up as its spring pulls, and stops against its pads.
  const m = span(t, STAGES.mirror);
  const mirror = m * m * (3 - 2 * m);
  const flapsOpen = easeInOutCubic(span(t, STAGES.flaps));
  const flaps = after > 0 ? flapsOpen * (1 - easeInOutCubic(letGo)) : flapsOpen;
  const pressed = Math.min(clamp01(t / 3), 1 - clamp01(after / 12));
  return { key, blades, iris: easeInOutCubic(span(t, STAGES.stopping)), mirror, flaps, pressed };
}

/** One turn of the knob: how long it takes (s), and what each part does over its course (u, 0 to 1). */
export const WIND_TIME = 0.9;
export function windAt(u: number) {
  const e = easeInOutCubic(clamp01(u));
  return {
    knob: e,
    key: KEY_TURN * (1 - e),
    // The mirror cam lowers the mirror over the first half of the turn.
    mirror: 1 - easeInOutCubic(clamp01(u / 0.5)),
    film: easeInOutCubic(clamp01((u - 0.15) / 0.7)),
    // At the end of the turn the lens is cocked: its shutter and iris open for viewing.
    open: easeInOutCubic(clamp01((u - 0.86) / 0.14)),
  };
}

export type ReflexEvent = 'mirror' | 'slap' | 'fire' | 'flaps';

export interface ReflexState {
  kind: 'reflex';
  focus: number;
  extension: number;
  /** The stop the aperture ring is set to (0 is f/2.8), its f-number, and the speed set (s). */
  stop: number;
  aperture: number;
  speed: number;
  /** Ready to fire: wound, and nothing moving. */
  cocked: boolean;
  /** The release's sequence is running. */
  running: boolean;
  /** Shutter-time ms since the release was pressed, or null since winding. */
  shot: number | null;
  /** What the release has moved: key (turns), blades, iris, mirror, flaps. */
  release: ReleaseValues;
  /** The knob's turn under way (0–1), or null. */
  winding: number | null;
  /** Frames wound on, and whether the dark slide is in. */
  frames: number;
  slideIn: boolean;
  /** Whether the iris is closed down to the stop set while looking (the preview), and where the rings are being turned to. */
  preview: boolean;
  set: { extension: number; stop: number };
}

const SLIDE_TIME = 0.6;

export class ReflexCamera {
  readonly kind = 'reflex';
  /** Shutter time per real second: less than 1 is slow motion. */
  rate = 1;
  /** Called as the mirror sets off and as it lands, as the shutter fires and as the flaps close (for sound). */
  onEvent?: (event: ReflexEvent) => void;
  onRatchet?: () => void;
  private extension = 0;
  private extensionTarget = 0;
  private stop = REST_STOP;
  private stopTarget = REST_STOP;
  private speed = SPEEDS[REST_SPEED];
  private cocked = true;
  private shot: number | null = null;
  private values: ReleaseValues = { key: 0, blades: 0, iris: 0, mirror: 0, flaps: 0, pressed: 0 };
  private wind: { t: number; from: number; frames: number } | null = null;
  private turns = 0;
  private frames = 0;
  private ratchetTeeth = 0;
  private slide = 0;
  private slideTarget = 0;
  private preview = false;
  private irisOpen = 0;

  constructor(private readonly controls: Controls) {
    this.push();
  }

  get state(): ReflexState {
    return {
      kind: 'reflex',
      focus: distanceFor(this.extension),
      extension: this.extension,
      stop: this.stop,
      aperture: STOPS[Math.round(this.stop)],
      speed: this.speed,
      cocked: this.cocked,
      running: this.running,
      shot: this.shot,
      release: { ...this.values },
      winding: this.wind ? clamp01(this.wind.t / WIND_TIME) : null,
      frames: this.frames,
      slideIn: this.slideTarget < 0.5,
      preview: this.preview,
      set: { extension: this.extensionTarget, stop: this.stopTarget },
    };
  }

  get running(): boolean {
    return this.shot !== null && this.shot < releaseEnds(this.speed);
  }

  focusAt(metres: number, immediate = false): void {
    this.extensionTarget = Math.min(MAX_EXTENSION, extensionFor(metres || Infinity));
    if (immediate) this.extension = this.extensionTarget;
  }

  setStop(stop: number, immediate = false): void {
    this.stopTarget = Math.min(STOPS.length - 1, Math.max(0, stop));
    if (immediate) this.stop = this.stopTarget;
  }

  setSpeed(seconds: number): void {
    if (!this.running) this.speed = seconds;
  }

  /** Closes the iris down to the stop set while looking, to see the depth of field (or opens it again). */
  setPreview(on: boolean): void {
    this.preview = on;
  }

  /** Pulls the dark slide out (so the film can be exposed) or pushes it back in. */
  setSlide(out: boolean): void {
    this.slideTarget = out ? 1 : 0;
  }

  /** Presses the release. False if it's not wound, or the dark slide is in (the release is blocked then). */
  fire(): boolean {
    if (!this.cocked || this.wind || this.slideTarget < 0.5 || this.slide < 0.99) return false;
    this.cocked = false;
    this.shot = 0;
    this.onEvent?.('mirror');
    return true;
  }

  /** One turn of the winding knob. False if there's nothing to wind, or the release is still running. */
  windOn(): boolean {
    if (this.cocked || this.wind || this.running) return false;
    this.wind = { t: 0, from: this.turns, frames: this.frames };
    this.ratchetTeeth = 0;
    return true;
  }

  get firing(): boolean {
    return this.running;
  }

  /** Advances by dt real seconds; returns whether anything moved. */
  tick(dt: number): boolean {
    const before = this.signature();
    const follow = 1 - Math.exp(-dt / 0.09);
    this.extension += (this.extensionTarget - this.extension) * follow;
    if (Math.abs(this.extensionTarget - this.extension) < 1e-4) this.extension = this.extensionTarget;
    this.stop += (this.stopTarget - this.stop) * follow;
    if (Math.abs(this.stopTarget - this.stop) < 1e-4) this.stop = this.stopTarget;
    // The dark slide slides out or in over a moment.
    if (this.slide !== this.slideTarget) this.slide = this.slideTarget > this.slide ? Math.min(1, this.slide + dt / SLIDE_TIME) : Math.max(0, this.slide - dt / SLIDE_TIME);

    if (this.shot !== null) {
      const was = this.values;
      const t0 = this.shot;
      this.shot += dt * this.rate * 1000;
      this.values = releaseAt(this.shot, this.speed);
      if (was.mirror < 1 && this.values.mirror >= 1) this.onEvent?.('slap');
      if (t0 < STAGES.fire && this.shot >= STAGES.fire) this.onEvent?.('fire');
      if (was.flaps > 0.5 && this.values.flaps <= 0.5) this.onEvent?.('flaps');
    }

    const w = this.wind;
    if (w) {
      w.t += dt;
      const u = clamp01(w.t / WIND_TIME);
      const v = windAt(u);
      this.turns = w.from + v.knob;
      this.frames = w.frames + v.film;
      this.values = { key: v.key, blades: 1 - v.open, iris: 1 - v.open, mirror: Math.min(this.values.mirror, v.mirror), flaps: 0, pressed: 0 };
      const teeth = Math.floor(v.knob * 24);
      if (teeth > this.ratchetTeeth) {
        this.ratchetTeeth = teeth;
        this.onRatchet?.();
      }
      if (u >= 1) {
        this.wind = null;
        this.cocked = true;
        this.shot = null;
        this.turns = Math.round(this.turns);
        this.frames = Math.round(this.frames);
        this.values = { key: 0, blades: 0, iris: 0, mirror: 0, flaps: 0, pressed: 0 };
      }
    }
    // The iris: open for viewing, closed down to the stop set as the release runs (or while previewing).
    if (this.shot !== null || this.wind) this.irisOpen = this.values.iris;
    else this.irisOpen += ((this.preview ? 1 : 0) - this.irisOpen) * follow;
    this.push();
    return before !== this.signature();
  }

  private signature(): string {
    const v = this.values;
    return [this.extension, this.stop, this.slide, v.key, v.blades, v.iris, v.mirror, v.flaps, v.pressed, this.turns, this.frames, this.irisOpen].join();
  }

  private push(): void {
    const c = this.controls;
    const v = this.values;
    c.set('focus', this.extension);
    c.set('aperture', this.stop);
    // The iris sits between wide open (stop 0) and the stop set.
    c.set('iris', this.stop * this.irisOpen);
    c.set('speed', SPEEDS.indexOf(this.speed));
    c.set('blades', v.blades);
    c.set('mirror', v.mirror);
    c.set('flaps', v.flaps);
    c.set('key', v.key);
    c.set('wind', this.turns);
    c.set('film', this.frames);
    c.set('release', v.pressed);
    c.set('slide', this.slide);
  }
}

/** "1/125 s", "1 s". */
export const speedLabel = (s: number) => (s >= 1 ? `${Math.round(s)} s` : `1/${Math.round(1 / s)} s`);
