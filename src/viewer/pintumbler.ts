// A pin tumbler lock, after the Kwikset KW1 cylinder in objects/pin-tumbler-lock: which key is in the plug and how far,
// where each pin stack rides on that key's cuts, and whether the plug will turn. Each stack is a key pin under a driver
// pin, pushed down by a spring. The plug turns only if the split between the two lies on the shear line (the plug's
// surface) in every stack; then a quarter turn throws the deadbolt's bolt through its crank. The numbers are the lock
// trade's (src/viewer/kw1.json, which the model's build reads too). This sets the content's controls (src/viewer/linkage.ts):
// `lock-key` and `lock-wrong` (where the two keys are), `lock-pin-1`…`lock-pin-5` (each stack's lift, mm, from where the
// right key holds it) and `lock-turn` (the plug's angle, degrees). The charts draw from the same functions. No three.js.
import KW1 from './kw1.json';
import type { Controls } from './filmcamera';

export type KeyName = 'right' | 'wrong' | 'none';

const IN = KW1.inch;
const D = KW1.drawn;
/** The plug's radius: its surface is the shear line. */
export const PLUG_R = (KW1.plug / 2) * IN;
/** A cut's depth plus its key pin's length: .501", the same for every number. */
export const STACK = (KW1.depths[1] + KW1.keyPins[1]) * IN;
/** The key's bottom edge, measured from the plug's axis. */
export const BOTTOM = PLUG_R - STACK;
export const PIN = KW1.pin * IN;
export const DRIVER = KW1.driver * IN;
/** One step of depth (.023"). */
export const STEP = (KW1.depths[1] - KW1.depths[2]) * IN;
/** The cuts' distances from the key's shoulder, which are the stacks' distances from the plug's face. */
export const CUTS = KW1.cuts.map((c) => c * IN);
export const BITTING = { right: KW1.keys.right, wrong: KW1.keys.wrong };
export const TOLERANCE = D.tolerance;
export const TURN = D.turn;
export const THROW = D.throw;
export const BLADE = D.blade;
export const CHAMBER_TOP = D.chamberTop;
/** Where a key pin's point rests with no key under it: its 45° point on the keyway's step. */
export const REST_TIP = D.ledge - (D.lowHalf - D.tipR);
const BLANK = KW1.depths[0] * IN;
const FLAT = KW1.flat * IN;
/** A cut's depth, mm above the key's bottom edge. */
export const depth = (cut: number) => KW1.depths[cut] * IN;
/** A key pin's length, mm, by its number. */
export const keyPinLength = (cut: number) => KW1.keyPins[cut] * IN;

/** The key's top edge, mm above its bottom edge, s mm from its shoulder: the blank cut by a 90° cutter with a flat, and the tip's ramp. */
export function profile(bitting: number[], s: number): number {
  if (s < 0 || s > BLADE) return -Infinity;
  let h = BLANK;
  bitting.forEach((cut, i) => {
    h = Math.min(h, depth(cut) + Math.max(0, Math.abs(s - CUTS[i]) - FLAT / 2));
  });
  return Math.min(h, D.tipHeight + ((BLADE - s) * (BLANK - D.tipHeight)) / D.tipLength);
}

/** The bolt's travel (mm) with the plug turned `deg` degrees: the drive's crank pin swings from 45° left of the top to 45° right. */
export const boltTravel = (deg: number) => (THROW / Math.SQRT2) * (Math.sin(((deg - 45) * Math.PI) / 180) + Math.SQRT1_2);

export interface Stack {
  /** The key pin's number (its length), which the right key's cut matches. */
  pin: number;
  /** The cut under the key pin's point, or null if no key's cut is under it. */
  cut: number | null;
  /** The key pin's point, mm above the key's bottom edge. */
  tip: number;
  /** The split between key pin and driver, mm above the shear line: + the key pin bridges it, − the driver does. */
  split: number;
  crossing: 'key' | 'driver' | null;
}

export interface LockState {
  kind: 'pintumbler';
  /** The key in the keyway (or none). */
  key: KeyName;
  /** The key asked for. */
  wanted: KeyName;
  /** How far the key in the keyway is in, 0–1 (1: up to its shoulder). */
  insert: number;
  /** The plug's angle, degrees clockwise seen from the front. */
  angle: number;
  /** The bolt's travel, mm. */
  bolt: number;
  stacks: Stack[];
  /** Every split within the tolerance of the shear line. */
  clear: boolean;
  /** A turn asked for and refused: a pin bridges the line. */
  blocked: boolean;
  /** Keys on the move. */
  busy: boolean;
}

/** Where the keys are: the right key 0 in, 1 out in front, 2 aside; the wrong key 0 beside the lock, 1 out, 2 in front of the keyway, 3 in. */
type Leg = { which: 'right' | 'wrong'; to: number };
/** Seconds for a leg: in and out slowly, so the pins can be seen riding the cuts; sideways quickly. */
const legTime = ({ which, to }: Leg, from: number) => ((which === 'right' && Math.max(from, to) <= 1) || (which === 'wrong' && Math.min(from, to) >= 2) ? 1.3 : 0.5);
const TURN_RATE = 150;

export class PinTumbler {
  readonly kind = 'pintumbler';
  private right = 0;
  private wrong = 0;
  private angle = 0;
  private wantTurn = false;
  /** An angle the plug is held at from outside (a film turning it), in place of a whole turn or none. */
  private aim: number | null = null;
  private refused = false;
  private wanted: KeyName = 'right';
  private plan: Leg[] = [];
  private legFrom = 0;
  private legT = 0;

  constructor(private readonly controls: Controls) {
    this.push();
  }

  /** The key in the keyway and how far in: the right key until it's out, then the wrong one once it's past the keyway's mouth. */
  private get inKeyway(): { key: KeyName; insert: number } {
    if (this.right < 1) return { key: 'right', insert: 1 - this.right };
    if (this.wrong > 2) return { key: 'wrong', insert: this.wrong - 2 };
    return { key: 'none', insert: 0 };
  }

  get stacks(): Stack[] {
    const { key, insert } = this.inKeyway;
    const bitting = key === 'none' ? null : BITTING[key];
    const offset = (1 - insert) * D.out;
    return BITTING.right.map((pin, i) => {
      const s = CUTS[i] + offset;
      const edge = bitting ? profile(bitting, s) : -Infinity;
      const tip = Math.max(REST_TIP - BOTTOM, edge);
      const onCut = bitting && insert > 0.999 ? bitting[i] : null;
      const split = tip + keyPinLength(pin) - STACK;
      const crossing = split > TOLERANCE ? 'key' : split < -TOLERANCE ? 'driver' : null;
      return { pin, cut: onCut, tip, split, crossing };
    });
  }

  get state(): LockState {
    const stacks = this.stacks;
    const { key, insert } = this.inKeyway;
    const clear = stacks.every((s) => !s.crossing);
    return { kind: 'pintumbler', key, wanted: this.wanted, insert, angle: this.angle, bolt: boltTravel(this.angle), stacks, clear, blocked: this.refused, busy: this.plan.length > 0 };
  }

  /** Puts a key in (the other comes out and goes aside), or takes them both out. */
  choose(key: KeyName, instant = false): void {
    this.wanted = key;
    this.refused = false;
    this.wantTurn = false;
    const legs: Leg[] = [];
    const at = { right: this.right, wrong: this.wrong };
    const go = (which: 'right' | 'wrong', to: number) => {
      if (Math.abs(at[which] - to) < 1e-6) return;
      legs.push({ which, to });
      at[which] = to;
    };
    if (key !== 'right') {
      if (at.right < 1) go('right', 1);
      if (key === 'wrong') go('right', 2);
    }
    if (key !== 'wrong') {
      if (at.wrong > 2) go('wrong', 2);
      if (at.wrong > 1) go('wrong', 1);
      go('wrong', 0);
    }
    if (key === 'right') {
      if (at.right > 1) go('right', 1);
      go('right', 0);
    }
    if (key === 'wrong') {
      if (at.wrong < 1) go('wrong', 1);
      if (at.wrong < 2) go('wrong', 2);
      go('wrong', 3);
    }
    this.plan = legs;
    this.legT = 0;
    this.legFrom = legs.length ? this[legs[0].which] : 0;
    if (instant) {
      this.angle = 0;
      for (const leg of legs) this[leg.which] = leg.to;
      this.plan = [];
      this.push();
    }
  }

  /** Slides the key in the keyway (the right one if there's none) to this fraction of the way in. */
  setInsert(fraction: number): void {
    // Not while the plug is turned or the keys are being changed.
    if (this.angle > 0.01 || this.plan.length) return;
    const f = Math.min(1, Math.max(0, fraction));
    this.refused = false;
    if (this.right <= 1) this.right = 1 - f;
    else if (this.wrong >= 2) this.wrong = 2 + f;
    else return;
    this.push();
  }

  /** Tries to turn the plug a quarter turn (or turns it back). It only goes if every split is on the line. */
  turn(on: boolean): void {
    this.wantTurn = on;
    this.aim = null;
    if (!on) this.refused = false;
  }

  /** Holds the plug at this angle (degrees), as a hand turning it slowly would: only past square if every split is on the line. */
  setAngle(deg: number): void {
    const s = this.state;
    const to = Math.min(TURN, Math.max(0, deg));
    if (to > 0.01 && !(s.clear && s.insert > 0.999) && !this.angle) {
      this.refused = true;
      return;
    }
    this.aim = this.angle = to;
    this.wantTurn = to > 0;
    this.push();
  }

  /** Back to rest: the right key in, the plug square, the wrong key beside the lock. */
  reset(): void {
    this.aim = null;
    this.choose('right', true);
  }

  tick(dt: number): boolean {
    const before = [this.right, this.wrong, this.angle, +this.refused].join();
    // Keys only move with the plug square: turn it back first.
    const target = this.plan.length ? 0 : (this.aim ?? (this.wantTurn ? TURN : 0));
    if (target > this.angle) {
      const s = this.state;
      if (s.clear && s.insert > 0.999) this.angle = Math.min(target, this.angle + TURN_RATE * dt);
      else this.refused = true;
    } else if (target < this.angle) {
      this.angle = Math.max(target, this.angle - TURN_RATE * dt);
    }
    if (this.plan.length && this.angle <= 0) {
      const leg = this.plan[0];
      const time = legTime(leg, this.legFrom);
      this.legT = Math.min(1, this.legT + dt / time);
      const e = this.legT < 0.5 ? 2 * this.legT * this.legT : 1 - (-2 * this.legT + 2) ** 2 / 2;
      this[leg.which] = this.legFrom + (leg.to - this.legFrom) * e;
      if (this.legT >= 1) {
        this[leg.which] = leg.to;
        this.plan.shift();
        this.legT = 0;
        if (this.plan.length) this.legFrom = this[this.plan[0].which];
      }
    }
    this.push();
    return before !== [this.right, this.wrong, this.angle, +this.refused].join();
  }

  private push(): void {
    this.controls.set('lock-key', this.right);
    this.controls.set('lock-wrong', this.wrong);
    const rest = BITTING.right.map((cut) => depth(cut));
    this.stacks.forEach((s, i) => this.controls.set(`lock-pin-${i + 1}`, s.tip - rest[i]));
    this.controls.set('lock-turn', this.angle);
  }
}
