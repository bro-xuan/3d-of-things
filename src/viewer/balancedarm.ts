// A spring-balanced lamp's arm (the desk lamp), as numbers, and the arm's two angles moved in time. Each arm turns
// about a pin; a pair of springs runs from an anchor straight above that pin to a pin along the arm. A spring whose
// pull is proportional to its whole length (a "zero-length" spring, wound with initial tension: G. Carwardine,
// GB 404,615, 1932) pulls with a torque k·a·b·sin θ about the pivot, and the weight the arm carries pulls the other
// way with m·g·L·sin θ: with k·a·b = m·g·L they cancel at every angle. The parallelograms make the two arms
// independent: the elbow plates and the head bracket only shift, never turn, so the upper springs' anchor stays
// above the elbow pin and the head keeps its angle. The viewer turns the controls this sets into moving parts
// (src/viewer/linkage.ts) and stretches the springs (src/viewer/stretch.ts); the chart and readouts read the same
// functions. Nothing here touches three.js. The geometry is the model's (objects/desk-lamp/augment.mjs, L).
import type { Controls } from './filmcamera';

export const G = 9.81;

/** One arm: metres, kilograms, degrees from upright. */
export interface ArmSpec {
  name: 'lower' | 'upper';
  /** Pivot pin to the next pin. */
  length: number;
  /** The springs' anchor, straight above the pivot, and their pin along the arm. */
  a: number;
  b: number;
  /** A spring's length, pin to pin, with its coils closed: an ordinary spring of the same rate would pull nothing
   *  shorter than this. */
  closed: number;
  /** As modelled, and how far a hand can move it. */
  rest: number;
  min: number;
  max: number;
  /** What it carries, as masses at a distance from its pivot (m): the torque they make is what the springs answer. */
  loads: { label: string; kg: number; at: number }[];
  /** How much a falling arm is held back by the air and its joints, N·m per rad/s (only when the springs are off). */
  drag: number;
}

const HEAD = 0.4;
const UPPER_BARS = 0.2;
const SPRINGS = 0.04;
const ELBOW = 0.06;

/** The upper arm: from the elbow pin to the head bracket. The head moves on the parallelogram, always 464 mm out. */
export const UPPER: ArmSpec = {
  name: 'upper',
  length: 0.4643,
  a: 0.0363,
  b: 0.2181,
  closed: 0.1048,
  rest: 48.56,
  min: 25,
  max: 85,
  loads: [
    { label: 'Head (shade, bulb, holder)', kg: HEAD, at: 0.4643 },
    { label: 'Two upper bars', kg: UPPER_BARS, at: 0.4643 / 2 },
    { label: 'Half its springs', kg: SPRINGS / 2, at: 0.2181 },
  ],
  drag: 4,
};

/** The lower arm: from the shoulder pin to the elbow. It carries everything above the elbow, all 442 mm out. */
export const LOWER: ArmSpec = {
  name: 'lower',
  length: 0.4416,
  a: 0.0657,
  b: 0.2158,
  closed: 0.0916,
  rest: 38.46,
  min: 20,
  max: 60,
  loads: [
    { label: 'Everything above the elbow', kg: HEAD + UPPER_BARS + SPRINGS + ELBOW, at: 0.4416 },
    { label: 'Lower arm and parallel link', kg: 0.25 + 0.1, at: 0.4416 / 2 },
    { label: 'Half its springs', kg: SPRINGS / 2, at: 0.2158 },
  ],
  drag: 6,
};

export const ARMS = [LOWER, UPPER] as const;

const RAD = Math.PI / 180;

/** The weight's torque about the pivot at sin θ = 1, N·m: g × Σ mass × distance. */
export function weightMoment(arm: ArmSpec): number {
  return G * arm.loads.reduce((sum, { kg, at }) => sum + kg * at, 0);
}

/** The springs' rate for balance, N/m for the pair: k = m·g·L / (a·b). */
export function springRate(arm: ArmSpec): number {
  return weightMoment(arm) / (arm.a * arm.b);
}

/** The weight's torque at θ degrees from upright, N·m (pulling the arm down). */
export function weightTorque(arm: ArmSpec, deg: number): number {
  return weightMoment(arm) * Math.sin(deg * RAD);
}

/** A spring's length, pin to pin, m: the triangle's third side. */
export function springLength(arm: ArmSpec, deg: number): number {
  return Math.sqrt(arm.a * arm.a + arm.b * arm.b - 2 * arm.a * arm.b * Math.cos(deg * RAD));
}

/** The pair's pull, N: proportional to the whole length for zero-length springs; an ordinary spring of the same rate
 *  only pulls once stretched past its closed length. */
export function springPull(arm: ArmSpec, deg: number, kind: 'zero' | 'ordinary' = 'zero'): number {
  const length = springLength(arm, deg);
  return springRate(arm) * (kind === 'zero' ? length : Math.max(0, length - arm.closed));
}

/** The springs' torque about the pivot, N·m (holding the arm up): the pull times its lever, a·b·sin θ / length. */
export function springTorque(arm: ArmSpec, deg: number, kind: 'zero' | 'ordinary' = 'zero'): number {
  const length = springLength(arm, deg);
  return length > 0 ? (springPull(arm, deg, kind) * arm.a * arm.b * Math.sin(deg * RAD)) / length : 0;
}

/** Which way a spring points, degrees from upright, from its anchor to its pin. */
export function springSwing(arm: ArmSpec, deg: number): number {
  return Math.atan2(arm.b * Math.sin(deg * RAD), arm.b * Math.cos(deg * RAD) - arm.a) / RAD;
}

export interface ArmState {
  kind: 'arm';
  /** Degrees from upright. */
  lower: number;
  upper: number;
  /** Whether the springs are on their pins. */
  hooked: boolean;
  /** Torques about each pivot, N·m: the weight's and the springs'. */
  torque: { lower: { weight: number; springs: number }; upper: { weight: number; springs: number } };
  /** Each spring pair's length (mm, pin to pin, in the arm's plane; off their pins, as they were when unhooked) and
   *  pull (N). */
  springs: { lower: { length: number; pull: number }; upper: { length: number; pull: number } };
}

/** How fast a hand moves the arm to where it's set, degrees a second. */
const HAND = 80;

/** The arm's angles, moved to where they're set, or falling when the springs are off; the controls that move its
 *  parts follow. */
export class BalancedArm {
  readonly kind = 'arm';
  private angles = { lower: LOWER.rest, upper: UPPER.rest };
  private targets = { lower: LOWER.rest, upper: UPPER.rest };
  private hooked = true;
  /** Where the springs were last on their pins: off them, they stay as they were. */
  private springAt = { lower: LOWER.rest, upper: UPPER.rest };

  constructor(private readonly controls: Controls) {
    this.push();
  }

  get state(): ArmState {
    const { lower, upper } = this.angles;
    const on = this.hooked ? 1 : 0;
    return {
      kind: 'arm',
      lower,
      upper,
      hooked: this.hooked,
      torque: {
        lower: { weight: weightTorque(LOWER, lower), springs: on * springTorque(LOWER, lower) },
        upper: { weight: weightTorque(UPPER, upper), springs: on * springTorque(UPPER, upper) },
      },
      springs: {
        lower: { length: springLength(LOWER, this.springAt.lower) * 1000, pull: on * springPull(LOWER, lower) },
        upper: { length: springLength(UPPER, this.springAt.upper) * 1000, pull: on * springPull(UPPER, upper) },
      },
    };
  }

  /** Moves the arms to these angles (degrees from upright; null leaves one as it is), at a hand's pace or at once. */
  set(lower: number | null, upper: number | null, now = false): void {
    if (lower !== null) this.targets.lower = clamp(lower, LOWER.min, LOWER.max);
    if (upper !== null) this.targets.upper = clamp(upper, UPPER.min, UPPER.max);
    if (now) {
      this.angles = { ...this.targets };
      this.push();
    }
  }

  /** Hooks the springs on or off. Off, the weight has nothing to answer it and the arm falls to its stops; on again, it
   *  stays wherever it got to. */
  hook(on: boolean): void {
    if (on === this.hooked) return;
    this.hooked = on;
    if (on) {
      this.targets = { ...this.angles };
      this.push();
    }
  }

  /** Back to the pose as modelled, springs on. */
  reset(now = false): void {
    this.hooked = true;
    this.set(LOWER.rest, UPPER.rest, now);
  }

  tick(dt: number): boolean {
    if (dt <= 0) return false;
    let moved = false;
    for (const arm of ARMS) {
      const from = this.angles[arm.name];
      let to: number;
      if (this.hooked) {
        const gap = this.targets[arm.name] - from;
        to = Math.abs(gap) <= HAND * dt ? this.targets[arm.name] : from + Math.sign(gap) * HAND * dt;
      } else {
        // Nothing holds it but the drag: it falls at the speed that drag allows, to its stop.
        const speed = weightTorque(arm, from) / arm.drag / RAD;
        to = clamp(from + speed * dt, arm.min, arm.max);
      }
      if (to !== from) {
        this.angles[arm.name] = to;
        moved = true;
      }
    }
    if (moved) this.push();
    return moved;
  }

  private push(): void {
    const { lower, upper } = this.angles;
    this.controls.set('arm_lower', lower - LOWER.rest);
    this.controls.set('arm_upper', upper - UPPER.rest);
    if (this.hooked) this.springAt = { lower, upper };
    this.controls.set('arm_spring_lower', springSwing(LOWER, this.springAt.lower) - springSwing(LOWER, LOWER.rest));
    this.controls.set('arm_spring_upper', springSwing(UPPER, this.springAt.upper) - springSwing(UPPER, UPPER.rest));
  }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
