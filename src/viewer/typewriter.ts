// A manual typewriter, after the Underwood Standard No. 5 in objects/typewriter: a word typed one stroke at a time. A
// stroke presses a key 16 mm, and its type bar swings 123° up through the segment until the slug hits the ribbon onto
// the paper. Near the end of the swing the bar's heel lifts the universal bar, which rocks the escapement's dogs: on the
// way down the loose dog lets the star wheel's tooth drop onto the rigid dog (a tenth of a step); on the way up the
// rigid dog lets it go, and the carriage moves the rest of one letter space, 2.54 mm. Nothing here pushes the carriage:
// the mainspring pulls it to the left all the time, and the stroke only lets go of it, one tooth at a time.
//
// This sets the content's controls (src/viewer/linkage.ts): `tw_key_<letter>` (that key's stroke, 0–1, for its key,
// sublever, link and type bar), `tw_strike` (the stroke under way, 0–1: universal bar, rocker, ribbon guide),
// `tw_space` (letter spaces the carriage has moved: carriage, star wheel, mainspring drum) and `tw_ink_<n>` (the n-th
// letter on the paper, 0 or 1). The numbers are src/viewer/underwood.json, which the model's build reads too. No three.js.
import U from './underwood.json';
import type { Controls } from './filmcamera';

export const WORD = U.word;
/** One letter space (pica, ten to the inch), mm. */
export const PITCH = U.pitch;
export const TEETH = U.wheel.teeth;
const RAD = Math.PI / 180;
/** The type bar's swing (degrees): from 5° below level, pointing at the typist, until its slug meets the paper above
 *  the segment's centre. */
export const SWING = 180 - Math.atan2(Math.sqrt(U.bar ** 2 - U.segmentR ** 2), U.segmentR) / RAD - U.rest;

const clamp = (x: number) => Math.min(1, Math.max(0, x));
/** The key's travel (0–1 of its 16 mm) through one stroke, s from 0 to 1: down, the strike at ½, back up. */
export const dipAt = (s: number) => Math.sin(Math.PI * clamp(s));
/** How far through its swing the type bar is (0–1): it gathers speed towards the paper. */
export const swingAt = (s: number) => dipAt(s) ** U.throw;
/** The swing (0–1) at which the slug is `mm` short of the paper. */
const swingShort = (mm: number) => 1 - mm / (U.bar * SWING * RAD);
/** Where in the stroke the bar passes that point of its swing, on the way down or back up. */
const strokeAt = (swing: number, up: boolean) => {
  const s = Math.asin(swing ** (1 / U.throw)) / Math.PI;
  return up ? 1 - s : s;
};
/** The loose dog lets go as the slug comes within ⅛ inch of the paper; the rigid dog once the universal bar is back. */
export const TRIP = strokeAt(swingShort(U.trip), false);
export const RELEASE = strokeAt(swingShort(U.pickup), true);
/** The share of a letter space the wheel turns on the way down: the tooth drops 0.025 inch onto the rigid dog. */
export const DROP = U.wheel.drop / ((2 * Math.PI * U.wheel.r) / TEETH);
/** Letter spaces (0–1) the carriage has moved, s through a stroke: the drop, then the rest. Each is a snap, the spring's. */
export function stepAt(s: number): number {
  const snap = (x: number) => {
    const t = clamp(x / U.snap);
    return t * t * (3 - 2 * t);
  };
  return DROP * snap(s - TRIP) + (1 - DROP) * snap(s - RELEASE);
}
/** The ink is on the paper from the strike. */
const INK = 0.5;
const LETTERS = [...new Set(WORD)];

export interface TypewriterState {
  kind: 'typewriter';
  /** Letters typed, the one under way as a fraction (2.5: the third letter's strike). */
  typed: number;
  /** Letter spaces the carriage has moved to the left (× 2.54 mm). */
  spaces: number;
  /** The letter under way, if any, and how far through its stroke (0–1). */
  letter: string | null;
  stroke: number;
}

export class Typewriter {
  readonly kind = 'typewriter';
  private typed = 0;

  constructor(private readonly controls: Controls) {
    this.push();
  }

  /** The letter under way (its index in the word) and how far through its stroke. */
  private get stroke(): [number, number] {
    const k = Math.min(WORD.length - 1, Math.floor(this.typed));
    return [k, this.typed - k];
  }

  get state(): TypewriterState {
    const [k, s] = this.stroke;
    const busy = s > 0 && s < 1;
    return { kind: 'typewriter', typed: this.typed, spaces: k + stepAt(s), letter: busy ? WORD[k] : null, stroke: busy ? s : 0 };
  }

  /** Types the word up to `n` letters; a fraction is a stroke under way. */
  setTyped(n: number): void {
    const next = Math.min(WORD.length, Math.max(0, n));
    if (next === this.typed) return;
    this.typed = next;
    this.push();
  }

  reset(): void {
    this.typed = 0;
    this.push();
  }

  /** Nothing moves on its own: the film's cue sets the strokes. */
  tick(): boolean {
    return false;
  }

  private push(): void {
    const [k, s] = this.stroke;
    for (const letter of LETTERS) this.controls.set(`tw_key_${letter}`, letter === WORD[k] ? s : 0);
    this.controls.set('tw_strike', s);
    this.controls.set('tw_space', k + stepAt(s));
    for (let n = 0; n < WORD.length; n++) this.controls.set(`tw_ink_${n}`, n < k || (n === k && s >= INK) ? 1 : 0);
  }
}
