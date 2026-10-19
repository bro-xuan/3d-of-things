// A retractable tape measure, as numbers: the blade paying out of its roll on the drum, the drum's
// turns, the spiral spring winding tighter round its post, the pull that spring puts on the hook, how
// far the cupped blade stands out, and the hook's play. The build lays the blade and the spring out
// with the same sums (objects/tape-measure/tape.mjs); the viewer bends their meshes to these paths
// (src/viewer/strip.ts) and the charts and readouts read them too. Nothing here touches three.js.
//
// Paths are in the model's millimetres, in the plane across the drum's axis (x): a point is (y, z), and
// an angle is measured from +z (out of the mouth) towards +y (up). Pulling the blade out turns the
// drum the positive way.
import { clamp01 } from './clockwork';
import type { Controls } from './filmcamera';

const TAU = Math.PI * 2;

/** The blade as the build laid it out. */
export interface BladeLayout {
  kind: 'tape-blade';
  /** The drum's axis, (y, z). */
  centre: [number, number];
  /** Radius of the blade's innermost turn, on the drum's hub, and what each turn of blade adds to the roll. */
  hub: number;
  pitch: number;
  /** From the hook's end of the blade to its tail on the hub. */
  length: number;
  /** Where the blade leaves its guide in the mouth, (y, z); from there it runs straight out along +z. */
  throat: [number, number];
  /** z of the blade's end (under the hook) with the blade home, and of the case's front. */
  tip: number;
  front: number;
  width: number;
  thickness: number;
  /** Radius of the blade's curve across its width. */
  cup: number;
  /** How far it stands out unsupported past the case's front, and where it folds beyond that: [mm past the
   *  front, how far the rest drops, radians]. */
  standout: number;
  fold: [number, number];
  /** The end of the blade under the hook, riveted flat. */
  flat: number;
  /** The spring, for the pull it puts on the blade. */
  spring: SpringLayout;
  /** The end hook: its thickness (the play it slides through). */
  hook: number;
}

/** The recoil spring as the build laid it out, with the blade home. */
export interface SpringLayout {
  kind: 'tape-spring';
  centre: [number, number];
  /** Radius of the post its inner end hooks on, and of the drum's inside wall its outer end hooks to. */
  post: number;
  wall: number;
  /** Its thickness, and the radius a turn adds where its coils lie packed. */
  thickness: number;
  pitch: number;
  width: number;
  length: number;
  /** Turns from its inner end to its outer end with the blade home, and the angle its inner end sits at. */
  turns: number;
  start: number;
  /** Turns in the free coil between the coils packed on the post and those packed against the wall. */
  loose: number;
  /** Turns it is wound past its free shape with the blade home, and its steel's Young's modulus (N/mm²). */
  preload: number;
  modulus: number;
}

// ------------------------------------------------------------------ the blade

/** Writes a point, (y, z), the way its graduated face looks, (ny, nz), and how much of the blade's curve it
 *  keeps there (1 out in the light, 0 flattened on the roll). */
export type PathAt = (u: number, out: number[]) => number[];

/** The blade with `out` mm pulled out of the mouth: `at(u)` for arc length u from the hook's end, the drum's
 *  angle (its tail's, radians), the roll's radius, and the turns left on it. */
export function bladePath(b: BladeLayout, out: number) {
  const k = b.pitch / TAU;
  const spiralAngle = (w: number) => (Math.sqrt(b.hub * b.hub + 2 * k * Math.max(0, w)) - b.hub) / k;
  const [cy, cz] = b.centre;
  const [ty, tz] = b.throat;
  // From the hook's end back to the throat, straight; then down to the roll, on the line that just touches it.
  const free = b.tip - tz + out;
  const dy = ty - cy;
  const dz = tz - cz;
  const D = Math.hypot(dy, dz);
  let touch = Math.sqrt(Math.max(0, D * D - (b.hub + 10) ** 2));
  let wound = 0;
  let rho = b.hub;
  for (let i = 0; i < 4; i++) {
    wound = Math.max(0, b.length - free - touch);
    rho = b.hub + k * spiralAngle(wound);
    touch = Math.sqrt(Math.max(0, D * D - rho * rho));
  }
  const turned = spiralAngle(wound);
  const phiT = Math.atan2(dy, dz) - Math.acos(Math.min(1, rho / D));
  const T = [cy + rho * Math.sin(phiT), cz + rho * Math.cos(phiT)];
  const dir = [(ty - T[0]) / (touch || 1), (tz - T[1]) / (touch || 1)];
  // Out past its standout the blade folds near the case and the rest drops.
  const unsupported = b.tip + out - b.front;
  const folds = unsupported > b.standout;
  const foldZ = b.front + b.fold[0];
  const [fs, fc] = [Math.sin(b.fold[1]), Math.cos(b.fold[1])];
  const at: PathAt = (u, o) => {
    if (u <= free) {
      const z = tz + free - u;
      if (folds && z > foldZ) {
        const s = z - foldZ;
        o[0] = ty - s * fs;
        o[1] = foldZ + s * fc;
        o[2] = fc;
        o[3] = fs;
      } else {
        o[0] = ty;
        o[1] = z;
        o[2] = 1;
        o[3] = 0;
      }
      o[4] = cupAt(b, z, u);
    } else if (u <= free + touch) {
      const s = u - free;
      o[0] = ty - dir[0] * s;
      o[1] = tz - dir[1] * s;
      // Up for the face is the run's direction turned a quarter the positive way.
      o[2] = dir[1];
      o[3] = -dir[0];
      o[4] = 0;
    } else {
      const theta = spiralAngle(b.length - u);
      const phi = phiT - (turned - theta);
      const r = b.hub + k * theta;
      o[0] = cy + r * Math.sin(phi);
      o[1] = cz + r * Math.cos(phi);
      // On the roll the graduated face looks in, towards the drum's axis.
      o[2] = -Math.sin(phi);
      o[3] = -Math.cos(phi);
      o[4] = 0;
    }
    return o;
  };
  return { at, drum: phiT - turned, roll: rho, turnsOn: turned / TAU, folds };
}

/** How much of its curve the blade has at z on its straight run and u from its end: flat on the roll and in the
 *  mouth's guide, curving to its full depth by the case's front; flat where the hook is riveted. */
export function cupAt(b: BladeLayout, z: number, u: number): number {
  return clamp01((z - b.throat[1]) / (b.front - b.throat[1])) * clamp01((u - b.flat) / 12);
}

/** How many turns the drum has made with `out` mm pulled out, from the blade home. */
export function drumTurns(b: BladeLayout, out: number): number {
  return (bladePath(b, out).drum - bladePath(b, 0).drum) / TAU;
}

/** The most the blade can come out: all but the turn that stays on the hub. */
export function maxOut(b: BladeLayout): number {
  return b.length - (b.tip - b.throat[1]) - TAU * b.hub - 40;
}

// ------------------------------------------------------------------ the spring

/** How the spring's turns are shared with `wound` more turns in it than with the blade home: packed on the post,
 *  the free coil, packed against the wall. Its length stays the same, so as the drum winds it, turns move from the
 *  wall to the post. */
export function springShare(s: SpringLayout, wound: number) {
  const a = s.post + s.pitch / 2;
  const b = s.wall - s.pitch / 2;
  const p = s.pitch;
  const total = s.turns + wound;
  const length = (inner: number) => {
    const outer = total - s.loose - inner;
    const r1 = a + p * inner;
    const r2 = b - p * outer;
    return TAU * a * inner + Math.PI * p * inner * inner + Math.PI * s.loose * (r1 + r2) + TAU * r2 * outer + Math.PI * p * outer * outer;
  };
  // More turns on the post means less spring used for the same turns, so the length falls as `inner` grows.
  let lo = 0;
  let hi = Math.max(0, total - s.loose);
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    if (length(mid) > s.length) lo = mid;
    else hi = mid;
  }
  const inner = (lo + hi) / 2;
  const outer = Math.max(0, total - s.loose - inner);
  return { inner, outer, total, r1: a + p * inner, r2: b - p * outer, a };
}

/** The spring with `wound` turns more in it than with the blade home: `at(s)` for arc length s from its inner end. */
export function springPath(s: SpringLayout, wound: number) {
  const { inner, outer, r1, r2, a } = springShare(s, wound);
  const p = s.pitch;
  const [cy, cz] = s.centre;
  const L1 = TAU * a * inner + Math.PI * p * inner * inner;
  const L2 = L1 + Math.PI * s.loose * (r1 + r2);
  /** Turns m into a pack starting at radius r0, for arc length l into it (the pack's radius grows p a turn). */
  const turnsFor = (r0: number, l: number) => (Math.sqrt(r0 * r0 + (p * l) / Math.PI) - r0) / p;
  const at: PathAt = (u, o) => {
    let m: number;
    let r: number;
    let slope: number;
    if (u <= L1) {
      m = turnsFor(a, u);
      r = a + p * m;
      slope = p / TAU;
    } else if (u <= L2) {
      // The free coil: its radius grows evenly over its turns, from the post's pack to the wall's.
      const grow = Math.max(1e-6, (r2 - r1) / (s.loose || 1));
      const q = (Math.sqrt(r1 * r1 + (grow * (u - L1)) / Math.PI) - r1) / grow;
      m = inner + Math.min(s.loose, q);
      r = r1 + grow * (m - inner);
      slope = grow / TAU;
    } else {
      m = inner + s.loose + turnsFor(r2, u - L2);
      r = r2 + p * (m - inner - s.loose);
      slope = p / TAU;
    }
    m = Math.min(m, inner + s.loose + outer);
    const phi = s.start + TAU * m;
    const [sn, cs] = [Math.sin(phi), Math.cos(phi)];
    o[0] = cy + r * sn;
    o[1] = cz + r * cs;
    // Outward, across the coil: the tangent (r' along the radius, r across it) turned back a quarter.
    const tY = slope * sn + r * cs;
    const tZ = slope * cs - r * sn;
    const n = Math.hypot(tY, tZ) || 1;
    o[2] = -tZ / n;
    o[3] = tY / n;
    o[4] = 0;
    return o;
  };
  return { at, inner, outer };
}

/** The spring's torque, N·mm, with `wound` turns in it more than with the blade home: a flat spiral spring's,
 *  E·b·t³·θ / 12L, θ counted from its free shape. */
export function springTorque(s: SpringLayout, wound: number): number {
  return (s.modulus * s.width * s.thickness ** 3 * TAU * (s.preload + wound)) / (12 * s.length);
}

/** What the spring pulls the blade in with, N, at `out` mm: its torque through the roll's radius. */
export function pullAt(b: BladeLayout, out: number): number {
  const path = bladePath(b, out);
  return springTorque(b.spring, drumTurns(b, out)) / path.roll;
}

// ------------------------------------------------------------------ the controller

export interface TapeState {
  kind: 'tape';
  /** Blade out of the mouth, mm; the most it can come out. */
  out: number;
  max: number;
  /** Turns the drum has made from home, and those left of blade on it. */
  drum: number;
  onRoll: number;
  /** The spring's torque (N·mm) and the pull it puts on the hook (N). */
  torque: number;
  pull: number;
  /** The lock is on; the blade is running back in. */
  locked: boolean;
  returning: boolean;
  /** The hook pushed against something (0) or hooked over an edge and pulled (1). */
  hook: number;
  /** Its play, mm, and how far the blade stands out before it folds. */
  play: number;
  standout: number;
  /** Past its standout, folded. */
  folded: boolean;
  unsupported: number;
}

/** How fast the blade runs back in when it's let go, mm a second (a brisk return; real ones vary). */
const RETURN_SPEED = 1800;

/** The tape measure's controls: `tape_out` (blade out, mm), `tape_drum` (the drum's turns), `tape_hook` (0 pushed,
 *  1 hooked) and `tape_lock` (0 free, 1 on). */
export class TapeMeasure {
  readonly kind = 'tape';
  private out = 0;
  private hook = 0;
  private lock = 0;
  private lockTarget = 0;
  private hookTarget = 0;
  private returning = false;

  constructor(
    private readonly controls: Controls,
    readonly blade: BladeLayout,
  ) {
    this.push();
  }

  get state(): TapeState {
    const b = this.blade;
    const path = bladePath(b, this.out);
    const drum = drumTurns(b, this.out);
    const torque = springTorque(b.spring, drum);
    const unsupported = Math.max(0, b.tip + this.out - b.front);
    return {
      kind: 'tape',
      out: this.out,
      max: maxOut(b),
      drum,
      onRoll: path.turnsOn,
      torque,
      pull: torque / path.roll,
      locked: this.lockTarget > 0.5,
      returning: this.returning,
      hook: this.hook,
      play: b.hook,
      standout: b.standout,
      folded: path.folds,
      unsupported,
    };
  }

  /** Pulls the blade to `mm` out (unless the lock holds it). Pulling it hooks the hook; home, the case pushes it in. */
  setOut(mm: number): void {
    if (this.lockTarget > 0.5) return;
    this.returning = false;
    this.out = Math.min(maxOut(this.blade), Math.max(0, mm));
    this.hookTarget = this.out > 1 ? 1 : 0;
    this.push();
  }

  /** Lets go of the blade: unless the lock is on, the spring winds it back in. */
  letGo(): void {
    if (this.lockTarget > 0.5 || this.out <= 0) return;
    this.returning = true;
  }

  setLock(on: boolean): void {
    this.lockTarget = on ? 1 : 0;
    if (on) this.returning = false;
  }

  /** The hook pushed against a wall (false) or hooked over an edge and pulled (true). */
  setHook(hooked: boolean): void {
    this.hookTarget = hooked ? 1 : 0;
  }

  reset(): void {
    this.out = this.hook = this.hookTarget = this.lock = this.lockTarget = 0;
    this.returning = false;
    this.push();
  }

  tick(dt: number): boolean {
    let moved = false;
    if (this.returning) {
      // The spring winds it in, slowing as the hook comes home.
      const v = RETURN_SPEED * (0.35 + 0.65 * clamp01(this.out / 300));
      this.out = Math.max(0, this.out - v * dt);
      if (this.out === 0) {
        this.returning = false;
        this.hookTarget = 0;
      }
      moved = true;
    }
    const ease = 1 - Math.exp(-dt / 0.06);
    for (const key of ['hook', 'lock'] as const) {
      const target = key === 'hook' ? this.hookTarget : this.lockTarget;
      const now = this[key];
      if (Math.abs(target - now) < 1e-3) {
        if (now !== target) {
          this[key] = target;
          moved = true;
        }
        continue;
      }
      this[key] = now + (target - now) * ease;
      moved = true;
    }
    if (moved) this.push();
    return moved;
  }

  private push(): void {
    this.controls.set('tape_out', this.out);
    this.controls.set('tape_drum', drumTurns(this.blade, this.out));
    this.controls.set('tape_hook', this.hook);
    this.controls.set('tape_lock', this.lock);
  }
}
