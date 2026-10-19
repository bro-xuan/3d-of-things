// A film camera's controls, run in time: the focusing ring turned to a distance, the aperture ring to
// a stop, the shutter fired (its two curtains crossing the frame in milliseconds) and the lever stroked
// to wind on. The numbers are the Leica M3's. The viewer turns the controls into moving parts through
// the content file's motions (src/viewer/linkage.ts), and the charts in "How it works" draw from the
// same numbers. Nothing here touches three.js, so the charts can use it before the viewer has loaded.
import { clamp01, easeInOutCubic } from './clockwork';

/** The early M3's speeds, in seconds (the older series, before 1/30, 1/60, 1/125…). */
export const SHUTTER_SPEEDS = [1, 1 / 2, 1 / 5, 1 / 10, 1 / 25, 1 / 50, 1 / 100, 1 / 250, 1 / 500, 1 / 1000];
/** The aperture ring's f-numbers, a stop apart: each lets in half the light of the one before. */
export const STOPS = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16];
/** The lens is modelled set to f/5.6, focused at infinity. */
export const REST_STOP = 4;
/** How long a curtain takes to cross the frame (s), and how far that is (mm). */
export const CURTAIN_TRAVEL = 0.018;
export const FRAME_WIDTH = 36;
/** The fastest speed at which the whole frame is open at once, for a flash. */
export const FLASH_SYNC = 1 / 50;
/** The rangefinder's windows are this far apart (mm); the viewfinder shows things at this size. */
export const RANGEFINDER_BASE = 68.5;
export const FINDER_MAGNIFICATION = 0.91;
/** The bayonet's cam is cut for a 51.6 mm lens: it moves as far as such a lens does when focusing. */
export const CAM_FOCAL = 51.6;
export const NEAREST = 0.7;
/** Strokes of the lever per frame on early M3s, and how far the film moves per frame (mm, eight perforations). */
export const STROKES = 2;
export const FRAME_ADVANCE = 38;

/** How far the lens comes out (mm) to focus at a distance from the film (m): x·x' = f², the film and subject 2f + x + x' apart. */
export function extensionFor(metres: number): number {
  if (!Number.isFinite(metres) || metres <= 0) return 0;
  const f = CAM_FOCAL;
  const s = metres * 1000 - 2 * f;
  return (s - Math.sqrt(Math.max(0, s * s - 4 * f * f))) / 2;
}

/** The distance (m) a lens extension focuses at; Infinity for none. */
export function distanceFor(extension: number): number {
  if (extension <= 1e-6) return Infinity;
  const f = CAM_FOCAL;
  return (2 * f + extension + (f * f) / extension) / 1000;
}

export const MAX_EXTENSION = extensionFor(NEAREST);

/** The angle (degrees) between the two windows' lines of sight to something this far away (m). */
export const rangefinderAngle = (metres: number) => (Number.isFinite(metres) ? (Math.atan(RANGEFINDER_BASE / (metres * 1000)) * 180) / Math.PI : 0);

/** Where a curtain's edge is, 0 to 1 of the way across the frame, s seconds after it starts: it speeds up as its spring pulls. */
export function curtainAt(s: number): number {
  const t = clamp01(s / CURTAIN_TRAVEL);
  return 0.6 * t + 0.4 * t * t;
}

/** The slit between the curtains (mm) at a speed: the frame is open all at once only from FLASH_SYNC down. */
export const slitWidth = (speed: number) => Math.min(FRAME_WIDTH, (FRAME_WIDTH * speed) / CURTAIN_TRAVEL);

/** "1/250 s", "1 s", "1/2 s". */
export const speedLabel = (s: number) => (s >= 1 ? `${Math.round(s)} s` : `1/${Math.round(1 / s)} s`);
export const stopLabel = (n: number) => `f/${n}`;
export const distanceLabel = (m: number) => (!Number.isFinite(m) ? '∞' : m >= 10 ? `${Math.round(m)} m` : `${m.toFixed(m < 1 ? 2 : 1)} m`);

export interface CameraState {
  kind: 'rangefinder';
  /** The distance focused on (m, Infinity at infinity) and how far the lens is out for it (mm). */
  focus: number;
  extension: number;
  /** Which stop the aperture ring is at (0 is f/1.4; between stops while it turns), and its f-number. */
  stop: number;
  aperture: number;
  /** The speed set (s). */
  speed: number;
  /** Ready to fire: the curtains are wound back. */
  cocked: boolean;
  /** The curtains are running across, from the release until the second has crossed. */
  running: boolean;
  /** Shutter time (s, slowed in slow motion) since the release was last pressed, or null since cocking. */
  shot: number | null;
  /** How far each curtain is across the frame, 0 to 1. */
  curtains: [number, number];
  /** Strokes made toward the next frame, the lever's swing (0–1) and the frames wound on so far. */
  strokes: number;
  lever: number;
  frames: number;
  /** Where the rings are being turned to: the lens's extension (mm) and the stop. */
  set: { extension: number; stop: number };
}

/** Whatever moves the parts: the linkage, which takes each control's value. */
export interface Controls {
  set(control: string, value: number): void;
}

/** A stroke of the lever: out in 0.45 s, back in 0.3 s. */
const STROKE_OUT = 0.45;
const STROKE_BACK = 0.3;

export class FilmCamera {
  readonly kind = 'rangefinder';
  /** Shutter time per real second: less than 1 is slow motion (a curtain's 18 ms made visible). */
  rate = 1;
  /** Called as each curtain sets off and arrives, and on each tooth of the lever's ratchet (for sound). */
  onShutter?: (curtain: 0 | 1, event: 'start' | 'stop') => void;
  onRatchet?: () => void;
  private extension = 0;
  private extensionTarget = 0;
  private stop = REST_STOP;
  private stopTarget = REST_STOP;
  private speed = 1 / 250;
  private cocked = true;
  /** The curtains are running: from the release until the second one has crossed. */
  private running = false;
  private shot: number | null = null;
  private pressed = 0;
  private curtains: [number, number] = [0, 0];
  private stroke: { t: number; film: number; curtains: [number, number]; cocks: boolean } | null = null;
  private strokes = 0;
  private lever = 0;
  private frames = 0;
  private ratchetTeeth = 0;

  constructor(private readonly controls: Controls) {
    this.push();
  }

  /** Turns the focusing ring to a distance (m; Infinity or 0 for infinity), or straight there with `immediate`. */
  focusAt(metres: number, immediate = false): void {
    this.extensionTarget = Math.min(MAX_EXTENSION, extensionFor(metres || Infinity));
    if (immediate) this.extension = this.extensionTarget;
  }

  /** Turns the aperture ring to a stop (0 for f/1.4 … 7 for f/16). */
  setStop(stop: number, immediate = false): void {
    this.stopTarget = Math.min(STOPS.length - 1, Math.max(0, stop));
    if (immediate) this.stop = this.stopTarget;
  }

  setSpeed(seconds: number): void {
    this.speed = seconds;
  }

  /** Back to rest at once, as the model is built: focused at infinity, at the rest stop, wound and ready (a film seeking). */
  reset(): void {
    this.extension = this.extensionTarget = 0;
    this.stop = this.stopTarget = REST_STOP;
    this.speed = 1 / 250;
    this.cocked = true;
    this.running = false;
    this.shot = null;
    this.pressed = 0;
    this.curtains = [0, 0];
    this.stroke = null;
    this.strokes = this.lever = this.frames = this.ratchetTeeth = 0;
    this.push();
  }

  /** Presses the release: the first curtain runs, and the second follows after the speed set. False if not wound on. */
  fire(): boolean {
    if (!this.cocked || this.stroke) return false;
    this.cocked = false;
    this.running = true;
    this.shot = 0;
    this.pressed = 1;
    this.onShutter?.(0, 'start');
    return true;
  }

  /** One stroke of the lever: half a frame of film on, and the curtains half wound back. False if there's nothing to wind. */
  windOn(): boolean {
    if (this.cocked || this.stroke || this.firing) return false;
    const share = 1 / STROKES;
    const left = 1 - this.strokes * share;
    this.stroke = { t: 0, film: this.frames, curtains: [left, left], cocks: this.strokes === STROKES - 1 };
    return true;
  }

  /** Whether the curtains are on their way across. */
  get firing(): boolean {
    return this.running;
  }

  get state(): CameraState {
    return {
      kind: 'rangefinder',
      focus: distanceFor(this.extension),
      extension: this.extension,
      stop: this.stop,
      aperture: STOPS[Math.round(this.stop)],
      speed: this.speed,
      cocked: this.cocked,
      running: this.running,
      shot: this.shot,
      curtains: [...this.curtains],
      strokes: this.strokes,
      lever: this.lever,
      frames: this.frames,
      set: { extension: this.extensionTarget, stop: this.stopTarget },
    };
  }

  /** Advances by dt real seconds; returns whether anything moved. */
  tick(dt: number): boolean {
    const before = [this.extension, this.stop, this.curtains[0], this.curtains[1], this.lever, this.frames, this.pressed].join();
    // The rings turn under the hand: a quick, smooth catch-up to where they're set.
    const follow = 1 - Math.exp(-dt / 0.09);
    this.extension += (this.extensionTarget - this.extension) * follow;
    if (Math.abs(this.extensionTarget - this.extension) < 1e-4) this.extension = this.extensionTarget;
    this.stop += (this.stopTarget - this.stop) * follow;
    if (Math.abs(this.stopTarget - this.stop) < 1e-4) this.stop = this.stopTarget;

    // The shutter, in its own (possibly slowed) time.
    if (this.shot !== null) {
      // Kept counting after the run, for the timing chart's cursor.
      this.shot += dt * this.rate;
      if (this.running) {
        const was = [...this.curtains];
        this.curtains = [curtainAt(this.shot), curtainAt(this.shot - this.speed)];
        if (was[1] === 0 && this.shot >= this.speed) this.onShutter?.(1, 'start');
        for (const k of [0, 1] as const) if (was[k] < 1 && this.curtains[k] >= 1) this.onShutter?.(k, 'stop');
        this.running = this.curtains[1] < 1;
      }
    }
    // The release button springs back up once it has let go.
    if (this.pressed > 0) this.pressed = Math.max(0, this.pressed - dt / 0.18);

    // The lever: out (winding), then back on its spring.
    const stroke = this.stroke;
    if (stroke) {
      stroke.t += dt;
      const out = clamp01(stroke.t / STROKE_OUT);
      const back = clamp01((stroke.t - STROKE_OUT) / STROKE_BACK);
      const wound = easeInOutCubic(out);
      this.lever = wound * (1 - easeInOutCubic(back));
      const share = 1 / STROKES;
      this.frames = stroke.film + share * wound;
      // The curtains come back across together, overlapping, so no light gets in.
      this.curtains = [stroke.curtains[0] - share * wound, stroke.curtains[1] - share * wound];
      const teeth = Math.floor(wound * 12);
      if (teeth > this.ratchetTeeth) {
        this.ratchetTeeth = teeth;
        this.onRatchet?.();
      }
      if (back >= 1) {
        this.stroke = null;
        this.ratchetTeeth = 0;
        this.lever = 0;
        this.strokes += 1;
        if (stroke.cocks) {
          this.strokes = 0;
          this.cocked = true;
          this.shot = null;
          this.curtains = [0, 0];
          this.frames = Math.round(this.frames);
        }
      }
    }
    this.push();
    return before !== [this.extension, this.stop, this.curtains[0], this.curtains[1], this.lever, this.frames, this.pressed].join();
  }

  private push(): void {
    const c = this.controls;
    c.set('focus', this.extension);
    c.set('aperture', this.stop);
    c.set('curtain1', this.curtains[0]);
    c.set('curtain2', this.curtains[1]);
    c.set('lever', this.lever);
    c.set('film', this.frames);
    c.set('release', this.pressed);
  }
}
