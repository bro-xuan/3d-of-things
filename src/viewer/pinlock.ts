// A pin tumbler lock's key, pin stacks and plug, as numbers, and the lock run in time. The key's top
// edge is worked out from its bitting the way a key machine cuts it (Schlage Classic: 100° cuts with a
// .031" flat, .1562" apart, .015" a step); each pin stack's point rides that edge as the key slides, so
// every stack rises and falls over the cuts; and the plug turns only when every stack's gap is on the
// shear line. The viewer turns the controls this sets into moving parts (src/viewer/linkage.ts): the
// keys slide, the pins and the springs' coils follow their stacks, the plug turns. The charts draw
// from the same functions. Nothing here touches three.js, and nothing is imported but types, so the
// model's build step (objects/door-lock/generate.mjs) reads the same numbers.
import type { Controls } from './filmcamera';

const INCH = 25.4;

/** The lock's numbers, mm: Schlage Classic keying, from the maker's service manual (objects/door-lock/TRUTH.md). */
export const LOCK = {
  /** Pin stacks, and the pins' diameter (.115"). */
  pins: 5,
  pin: 0.115 * INCH,
  /** From the key's shoulder to the first cut's centre (.231"), and from cut to cut (.1562"). */
  firstCut: 0.231 * INCH,
  spacing: 0.1562 * INCH,
  /** A depth step (.015"); depth 0's root is .335" above the blade's bottom, depth 9's .200". */
  step: 0.015 * INCH,
  root0: 0.335 * INCH,
  /** The blade's height (.343"). */
  blade: 0.343 * INCH,
  /** The cutter: 100° with a .031" flat. */
  cutter: 100,
  flat: 0.031 * INCH,
  /** No two neighbouring cuts more than 7 steps apart. */
  macs: 7,
  /** The plug's diameter, about ½": the shear line is its surface. */
  plug: 0.5 * INCH,
  /** The key's tip (this model's): the top edge runs down from tipTop to tipHigh at the end (tipEnd, from the shoulder), the
   *  bottom edge up from tipBottom to tipLow. */
  tipTop: 24.8,
  tipBottom: 27.4,
  tipEnd: 28.6,
  tipHigh: 3.4,
  tipLow: 1.4,
  /** A key pin's point (this model's): a flat this wide (radius), then a cone this tall out to the pin's full width, about
   *  as steep as the cutter's sides. */
  pinFlat: 0.3,
  pinCone: 0.95,
  /** With no key under it, a stack's point drops to this height above the blade's bottom, onto the ledge of its hole. */
  drop: 4.15,
  /** How far the plug turns before a pin across the shear line stops it (degrees), and how far the key turns it to throw
   *  the bolt (a quarter turn). */
  play: 1.2,
  throw: 90,
  /** How far a stack's gap may sit from the shear line and still let the plug turn (mm; Schlage cut depths are held to
   *  +.002"). */
  tolerance: 0.06,
  /** How far a key is drawn out to change keys (mm), and how far apart the two keys sit then. */
  out: 32,
  apart: 26,
};

/** The key that opens it, and one that doesn't: cuts read from the bow to the tip. */
export const KEYS = { right: [2, 7, 4, 9, 5], wrong: [2, 7, 4, 6, 5] } as const;
export type KeyName = keyof typeof KEYS;
export type Bitting = readonly number[];

/** A cut's root above the blade's bottom (mm). */
export const rootDepth = (depth: number) => LOCK.root0 - LOCK.step * depth;
/** A bottom pin's length for a cut (.165" for a 0, .015" more a step), and the top pin the manual pairs with it. */
export const keyPinLength = (depth: number) => (0.165 + 0.015 * depth) * INCH;
export const driverPinLength = (depth: number) => (depth <= 3 ? 0.235 : depth <= 6 ? 0.2 : 0.165) * INCH;
/** Where cut i (from 0, at the bow) is, from the shoulder (mm). */
export const cutAt = (i: number) => LOCK.firstCut + LOCK.spacing * i;
/** How fast a cut's flank rises, mm up per mm along: a 100° cutter's sides are 50° off the vertical. */
const FLANK = 1 / Math.tan(((LOCK.cutter / 2) * Math.PI) / 180);

/** How high a key's top edge is above its blade's bottom at s mm from the shoulder; −Infinity where there's no key. */
export function keyHeight(bitting: Bitting, s: number): number {
  if (s < 0 || s > LOCK.tipEnd) return -Infinity;
  let h = LOCK.blade;
  bitting.forEach((depth, i) => {
    h = Math.min(h, rootDepth(depth) + Math.max(0, Math.abs(s - cutAt(i)) - LOCK.flat / 2) * FLANK);
  });
  if (s > LOCK.tipTop) h = Math.min(h, LOCK.blade - ((s - LOCK.tipTop) * (LOCK.blade - LOCK.tipHigh)) / (LOCK.tipEnd - LOCK.tipTop));
  return h;
}

/** How high the key's bottom edge is at s (it rises into the tip). */
export const keyLow = (s: number) => (s > LOCK.tipBottom ? ((s - LOCK.tipBottom) * LOCK.tipLow) / (LOCK.tipEnd - LOCK.tipBottom) : 0);

/** The key's top edge from the shoulder to the tip, as [s, height] points (mm), for drawing it. */
export function keyEdge(bitting: Bitting, step = 0.1): [number, number][] {
  const points: [number, number][] = [];
  for (let s = 0; s <= LOCK.tipEnd + 1e-9; s += step) points.push([s, keyHeight(bitting, s)]);
  return points;
}

/** How far a key pin's cone has risen at d mm from its middle. */
const coneAt = (d: number) => (Math.max(0, Math.abs(d) - LOCK.pinFlat) * LOCK.pinCone) / (LOCK.pin / 2 - LOCK.pinFlat);

/** Where stack i's point sits above the blade's bottom (mm), with this key drawn out by `out` mm (0 is all the way in): as high
 *  as the key's edge pushes any part of the pin's cone, which on a cut's flat is the flat itself. */
export function pinPoint(bitting: Bitting, i: number, out: number): number {
  const s = cutAt(i) + out;
  const r = LOCK.pin / 2;
  let h = LOCK.drop;
  for (let d = -r; d <= r + 1e-9; d += r / 12) h = Math.max(h, keyHeight(bitting, s + d) - coneAt(d));
  return h;
}

/** Stack i's gap (between its key pin and its driver pin) against the shear line, mm: + is up into the shell (the key pin
 *  across), − down into the plug (the driver pin across). The lock is pinned for the right key. */
export function gapAt(bitting: Bitting, i: number, out: number): number {
  return pinPoint(bitting, i, out) + keyPinLength(KEYS.right[i]) - LOCK.plug;
}

/** Whether this key, all the way in, lets the plug turn. */
export const opens = (bitting: Bitting) => bitting.every((_, i) => Math.abs(gapAt(bitting, i, 0)) <= LOCK.tolerance);

export interface LockState {
  kind: 'pinlock';
  /** The key at the lock. */
  key: KeyName;
  /** How far it's drawn out, mm (0 is all the way in). */
  out: number;
  /** The plug's turn, degrees. */
  turn: number;
  /** Each stack's gap against the shear line, mm (+ up into the shell). */
  gaps: number[];
  /** Each stack's point above the blade's bottom, mm. */
  points: number[];
  /** The key is all the way in and every gap is on the shear line. */
  free: boolean;
  /** The first stack across the shear line, from the bow (0–4), or −1. */
  blocking: number;
  /** The keys are changing places. */
  busy: boolean;
  turning: boolean;
}

/** Key slides at 45 mm/s, the keys change places in 0.6 s, the plug turns at a quarter turn in 0.45 s. */
const SLIDE = 45;
const SWAP = 1 / 0.6;
const TURN = 90 / 0.45;

const approach = (value: number, target: number, step: number) => (Math.abs(target - value) <= step ? target : value + Math.sign(target - value) * step);

/**
 * The lock in time: a key slides in or out (to a slider's value), the keys change places, and the plug turns while the
 * key is held turned, as far as the pins let it, and springs back when it's let go. Rests with the right key in.
 */
export class PinLock {
  readonly kind = 'pinlock';
  /** The key at the lock, and how far it's out; the swap runs 0 (right key at the lock) to 1 (wrong key). */
  private key: KeyName = 'right';
  private out = 0;
  private outTarget = 0;
  private swap = 0;
  private turn = 0;
  private turning = false;
  /** Waiting to come in once the keys have changed places. */
  private wanted: KeyName = 'right';

  private readonly controls: Controls;

  constructor(controls: Controls) {
    this.controls = controls;
    this.push();
  }

  get state(): LockState {
    const bitting = KEYS[this.key];
    const gaps = bitting.map((_, i) => gapAt(bitting, i, this.out));
    const points = bitting.map((_, i) => pinPoint(bitting, i, this.out));
    const blocking = this.out > 0.01 ? -1 : gaps.findIndex((g) => Math.abs(g) > LOCK.tolerance);
    return {
      kind: 'pinlock',
      key: this.key,
      out: this.out,
      turn: this.turn,
      gaps,
      points,
      free: this.out <= 0.01 && blocking < 0,
      blocking,
      busy: this.wanted !== this.key || this.swap !== (this.key === 'right' ? 0 : 1) || this.out !== this.outTarget,
      turning: this.turning,
    };
  }

  /** Slides the key at the lock to `out` mm (a slider): only while the plug is straight. */
  setOut(out: number): void {
    if (this.wanted !== this.key) return;
    this.outTarget = Math.min(LOCK.out, Math.max(0, out));
  }

  /** Holds the key turned, or lets it go. */
  setTurning(on: boolean): void {
    this.turning = on;
  }

  /** Puts this key in the lock: the other comes out and they change places first. */
  choose(key: KeyName): void {
    this.wanted = key;
    this.turning = false;
    if (key === this.key) this.outTarget = 0;
  }

  /** Back to rest: the right key in, the plug straight. */
  reset(): void {
    this.key = this.wanted = 'right';
    this.out = this.outTarget = this.swap = this.turn = 0;
    this.turning = false;
    this.push();
  }

  /** Moves the lock on by dt seconds; returns whether anything moved. */
  tick(dt: number): boolean {
    const before = [this.out, this.swap, this.turn, this.key].join();
    const straight = Math.abs(this.turn) < 1e-6;
    if (this.wanted !== this.key) {
      // Turn back, draw the key out, change places.
      if (!straight) this.turn = approach(this.turn, 0, TURN * dt);
      else if (this.out < LOCK.out) this.out = this.outTarget = approach(this.out, LOCK.out, SLIDE * dt);
      else {
        this.swap = approach(this.swap, this.wanted === 'right' ? 0 : 1, SWAP * dt);
        if (this.swap === (this.wanted === 'right' ? 0 : 1)) {
          this.key = this.wanted;
          this.outTarget = 0;
        }
      }
    } else {
      // The key slides only with the plug straight. The plug turns only with the key all the way in, and with a pin
      // across the shear line it gets no further than the play.
      if (straight) this.out = approach(this.out, this.outTarget, SLIDE * dt);
      const home = this.out <= 0.01 && this.outTarget <= 0.01;
      const free = home && this.state.free;
      const target = this.turning && home ? (free ? LOCK.throw : LOCK.play) : 0;
      this.turn = approach(this.turn, target, TURN * dt * (free || !target ? 1 : 0.1));
    }
    const moved = before !== [this.out, this.swap, this.turn, this.key].join();
    if (moved) this.push();
    return moved;
  }

  /** Sets the controls the content file's motions follow. */
  private push(): void {
    const { controls } = this;
    const bitting = KEYS[this.key];
    controls.set('lockKey', this.key === 'right' ? this.out : LOCK.out);
    controls.set('lockWrong', this.key === 'wrong' ? LOCK.out - this.out : 0);
    controls.set('lockSwap', this.swap);
    controls.set('lockTurn', this.turn / 360);
    for (let i = 0; i < LOCK.pins; i++) controls.set(`lockPin${i + 1}`, pinPoint(bitting, i, this.out) - rootDepth(KEYS.right[i]));
  }
}
