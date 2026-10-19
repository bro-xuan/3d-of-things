import { Box3, Object3D, Quaternion, Vector3, type Mesh } from 'three';
import type { Motion, Part } from '../types';
import { amplitudeFor, BEATS_PER_SECOND, clamp01, easeInOutCubic, FULL_RESERVE, palletLean, REST_RESERVE, trainBeats } from './clockwork';

export { clamp01, easeInOutCubic };

const _q = new Quaternion();

export const easeOutQuint = (t: number) => 1 - (1 - t) ** 5;
export const easeInCubic = (t: number) => t * t * t;

/**
 * Owns one node's transform: its rest pose plus an explode offset and a spin
 * about a pivot. Both live in the parent's space, so a gear can slide out of
 * the assembly and keep turning about its own (moved) axle.
 */
export class NodeRig {
  readonly offset = new Vector3();
  /** A second offset on top of the explosion's, for a part lifted out on its own (an experiment). */
  readonly extra = new Vector3();
  /** Where the running mechanism has pushed it (a piston on its crank, a valve off its cam). */
  readonly drive = new Vector3();
  readonly axis = new Vector3(0, 1, 0);
  readonly pivot = new Vector3();
  angle = 0;
  private readonly restPosition: Vector3;
  private readonly restQuaternion: Quaternion;
  private tracker?: Object3D;

  constructor(readonly node: Object3D) {
    this.restPosition = node.position.clone();
    this.restQuaternion = node.quaternion.clone();
  }

  /** A sibling that moves with the explode offset but not the spin, for labels that shouldn't orbit with a turning gear. */
  get follower(): Object3D {
    if (!this.tracker) {
      this.tracker = new Object3D();
      this.node.parent!.add(this.tracker);
      this.tracker.updateMatrixWorld(true);
    }
    return this.tracker;
  }

  /** A model-space point in the parent's space. Only valid while the parent is at rest. */
  pointToParent(point: Vector3): Vector3 {
    return this.node.parent!.worldToLocal(point.clone());
  }

  vectorToParent(vector: Vector3): Vector3 {
    return this.pointToParent(vector).sub(this.pointToParent(new Vector3()));
  }

  apply(): void {
    _q.setFromAxisAngle(this.axis, this.angle);
    this.node.quaternion.copy(_q).multiply(this.restQuaternion);
    this.node.position.copy(this.restPosition).sub(this.pivot).applyQuaternion(_q).add(this.pivot).add(this.offset).add(this.extra).add(this.drive);
    this.tracker?.position.copy(this.offset).add(this.extra).add(this.drive);
  }
}

export class Rigs {
  private readonly rigs = new Map<Object3D, NodeRig>();

  get(node: Object3D): NodeRig {
    let rig = this.rigs.get(node);
    if (!rig) this.rigs.set(node, (rig = new NodeRig(node)));
    return rig;
  }

  /** What a label on this node should hang from: its rig's follower if it moves, otherwise the node itself. */
  anchorFor(node: Object3D): Object3D {
    return this.rigs.get(node)?.follower ?? node;
  }

  /** The rig of a node, if anything moves it. */
  find(node: Object3D): NodeRig | undefined {
    return this.rigs.get(node);
  }

  apply(): void {
    for (const rig of this.rigs.values()) rig.apply();
  }
}

type Resolve = (name: string) => Object3D | undefined;

interface Track {
  rigs: NodeRig[];
  /** Per rig, the offset at the end of each leg (one or two legs). */
  legs: Vector3[][];
  /** Fraction of the window the first leg takes, when there are two. */
  split: number;
  start: number;
  end: number;
}

/** Slides parts out along their directions (and then aside, for parts with a second leg). Stages overlap so the
 *  model comes apart in a sequence rather than all at once; a part's window, if it has one, sets its timing exactly. */
export class Exploder {
  value = 0;
  /** How far each part has travelled, 0–1, in the same order as the parts. */
  readonly progress: number[];
  private readonly tracks: Track[] = [];

  constructor(parts: Part[], resolve: Resolve, rigs: Rigs) {
    const stages = [...new Set(parts.map((p) => p.stage ?? 0))].sort((a, b) => a - b);
    const span = stages.length === 1 ? 1 : Math.max(0.3, 1 / stages.length + 0.2);
    for (const part of parts) {
      const index = stages.indexOf(part.stage ?? 0);
      const staged = stages.length === 1 ? 0 : (index / (stages.length - 1)) * (1 - span);
      const [start, end] = part.window ?? [staged, staged + span];
      const travel = [new Vector3(...part.direction).normalize().multiplyScalar(part.distance)];
      if (part.then) travel.push(new Vector3(...part.then.direction).normalize().multiplyScalar(part.then.distance));
      const trackRigs = [part.node, ...(part.with ?? [])]
        .map(resolve)
        .filter((node): node is Object3D => !!node)
        .map((node) => rigs.get(node));
      // Time on each leg follows its length, but a short lift still gets a moment.
      const split = part.then ? Math.max(0.3, part.distance / (part.distance + part.then.distance)) : 1;
      this.tracks.push({ rigs: trackRigs, legs: travel.map((leg) => trackRigs.map((rig) => rig.vectorToParent(leg))), split, start, end });
    }
    this.progress = this.tracks.map(() => 0);
  }

  get isEmpty(): boolean {
    return this.tracks.length === 0;
  }

  set(value: number): void {
    this.value = value;
    this.tracks.forEach((track, k) => {
      const t = clamp01((value - track.start) / (track.end - track.start));
      const first = easeInOutCubic(clamp01(t / track.split));
      const second = track.legs.length > 1 ? easeInOutCubic(clamp01((t - track.split) / (1 - track.split))) : 0;
      track.rigs.forEach((rig, i) => {
        rig.offset.copy(track.legs[0][i]).multiplyScalar(first);
        if (second) rig.offset.addScaledVector(track.legs[1][i], second);
      });
      this.progress[k] = first;
    });
  }
}

type Hand = NonNullable<Motion['clock']>;

/** Beats in one turn of each hand. */
const BEATS_PER_TURN: Record<Hand, number> = { second: 360, minute: 360 * 60, hour: 360 * 60 * 12 };
/** The barrel's arbor stores eight hours per turn: the barrel turns once in 8 hours. */
const HOURS_PER_ARBOR_TURN = 8;
/** How fast the crown turns while it's being wound, in turns a second. */
const WIND_SPEED = 1.2;
/** The fastest a part is drawn turning, in turns a second: any faster and at 60 frames a second it would only flicker. */
const SPIN_CAP = 2.4;

function secondsOfDay(now: Date): number {
  return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds() + now.getMilliseconds() / 1000;
}

/** Where a hand points at rest: its farthest vertex from the pivot, as a clockwise angle from model-space up. */
function restAngle(node: Object3D, pivot: Vector3, axis: Vector3): number {
  const up = new Vector3(0, 1, 0).projectOnPlane(axis).normalize();
  const right = new Vector3().crossVectors(up, axis);
  const tip = new Vector3();
  const v = new Vector3();
  let farthest = -1;
  node.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    const position = mesh.geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      v.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld).sub(pivot).projectOnPlane(axis);
      if (v.lengthSq() > farthest) {
        farthest = v.lengthSq();
        tip.copy(v);
      }
    }
  });
  return Math.atan2(tip.dot(right), tip.dot(up));
}

/**
 * A spiral spring that winds and unwinds about its axis: each vertex turns by the
 * swing angle times how far in it sits, so the inner end follows the balance and the
 * outer end stays at its stud. Works in the mesh's own space, whatever its quantisation.
 */
class Coil {
  private readonly pivot: Vector3;
  private readonly axis: Vector3;
  private readonly e1: Vector3;
  private readonly e2: Vector3;
  /** Per vertex: [along e1, along e2, along the axis, weight], and the same for normals. */
  private readonly rest: Float32Array;
  private readonly restNormals: Float32Array;
  private readonly _v = new Vector3();

  constructor(
    readonly mesh: Mesh,
    pivotWorld: Vector3,
    axisWorld: Vector3,
  ) {
    const toLocal = mesh.matrixWorld.clone().invert();
    this.pivot = pivotWorld.clone().applyMatrix4(toLocal);
    this.axis = pivotWorld.clone().add(axisWorld).applyMatrix4(toLocal).sub(this.pivot).normalize();
    this.e1 = new Vector3().crossVectors(this.axis, Math.abs(this.axis.x) < 0.9 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0)).normalize();
    this.e2 = new Vector3().crossVectors(this.axis, this.e1);
    const { position, normal } = mesh.geometry.attributes;
    const n = position.count;
    this.rest = new Float32Array(n * 4);
    this.restNormals = new Float32Array(n * 3);
    let inner = Infinity;
    let outer = 0;
    for (let i = 0; i < n; i++) {
      const v = this._v.fromBufferAttribute(position, i).sub(this.pivot);
      const a = v.dot(this.e1);
      const b = v.dot(this.e2);
      this.rest.set([a, b, v.dot(this.axis)], i * 4);
      const r = Math.hypot(a, b);
      inner = Math.min(inner, r);
      outer = Math.max(outer, r);
      const m = this._v.fromBufferAttribute(normal, i);
      this.restNormals.set([m.dot(this.e1), m.dot(this.e2), m.dot(this.axis)], i * 3);
    }
    for (let i = 0; i < n; i++) {
      const r = Math.hypot(this.rest[i * 4], this.rest[i * 4 + 1]);
      this.rest[i * 4 + 3] = clamp01((outer - r) / (outer - inner || 1));
    }
  }

  apply(angle: number): void {
    const { position, normal } = this.mesh.geometry.attributes;
    const { pivot, axis, e1, e2, rest, restNormals, _v: v } = this;
    for (let i = 0; i < position.count; i++) {
      const turn = angle * rest[i * 4 + 3];
      const c = Math.cos(turn);
      const s = Math.sin(turn);
      const [a, b, h] = [rest[i * 4], rest[i * 4 + 1], rest[i * 4 + 2]];
      v.copy(pivot).addScaledVector(e1, a * c - b * s).addScaledVector(e2, a * s + b * c).addScaledVector(axis, h);
      position.setXYZ(i, v.x, v.y, v.z);
      const [na, nb, nh] = [restNormals[i * 3], restNormals[i * 3 + 1], restNormals[i * 3 + 2]];
      v.set(0, 0, 0).addScaledVector(e1, na * c - nb * s).addScaledVector(e2, na * s + nb * c).addScaledVector(axis, nh);
      normal.setXYZ(i, v.x, v.y, v.z);
    }
    position.needsUpdate = true;
    normal.needsUpdate = true;
  }
}

/** What a clock-driven mechanism is doing right now, for charts and readouts. */
export interface MechanismState {
  /** The escapement's beat count: it ticks as it passes each whole number. */
  beat: number;
  /** How fast the clock runs, as a fraction of real time (0 while stopped). */
  rate: number;
  /** Hours of running left in the mainspring. */
  reserve: number;
  /** The balance's swing, in degrees either side, and where it is in that swing. */
  amplitude: number;
  swing: number;
  held: boolean;
  /** The pallet fork is out and the train is running free. */
  loose: boolean;
  winding: boolean;
}

/**
 * Turning parts: gears and reels while running, and anything driven by the visitor's
 * clock (hands always; a watch's train, escapement and balance too). Clock-driven parts
 * all follow one beat count, so they stay in mesh at any time of day, and in slow motion.
 * A watch can also be wound, held still by its balance, and let run free with its
 * pallet fork out, for "How it works".
 */
/** How far open a valve is (0–1) with its cam's nose `nose` radians round from it, over `half` either side. */
function openness(nose: number, half: number): number {
  const a = Math.atan2(Math.sin(nose), Math.cos(nose));
  return Math.abs(a) < half ? 0.5 + 0.5 * Math.cos((Math.PI * a) / half) : 0;
}

export class Mechanism {
  running = false;
  /** Multiplies the speed of parts that spin while running (a crank turned slowly). */
  spinRate = 1;
  /** Whether time lost to slow motion or a stopped balance is made up as soon as the clock is back at full speed. */
  catchUp = true;
  /** A finger on the balance: everything stops where it is. */
  held = false;
  /** Hours of running left in the mainspring. */
  reserve = REST_RESERVE;
  /** The escapement's beat count, as of the last tick. */
  beat = 0;
  /** Called on each tick of the escapement (at most once a frame), and as each ratchet tooth clicks past while winding. */
  onBeat?: (beat: number) => void;
  onClick?: () => void;
  /** Seconds the spinning parts have run, at their speed. */
  time = 0;
  private readonly spins: { rig: NodeRig; speed: number; factor: number }[] = [];
  private readonly hands: { rig: NodeRig; hand: Hand; rest: number }[] = [];
  private readonly trains: { rig: NodeRig; train: number; inside: boolean }[] = [];
  private readonly swings: { rig: NodeRig; swing: 'balance' | 'pallet'; amplitude: number; inside: boolean }[] = [];
  private readonly coils: { coil: Coil; amplitude: number; inside: boolean; angle: number }[] = [];
  private readonly winders: { rig: NodeRig; turns: number }[] = [];
  private readonly windCoils: { coil: Coil; turns: number; angle: number }[] = [];
  private readonly pawls: { rig: NodeRig; teeth: number; turns: number; amplitude: number }[] = [];
  /** Pistons and their rods on a crank, and valves on a camshaft's cams. */
  private readonly sliders: { rig: NodeRig; crank: NodeRig; along: Vector3; r: number; l: number; phase: number; rocks: boolean }[] = [];
  private readonly cams: { rig: NodeRig; cam: NodeRig; along: Vector3; lift: number; phase: number; half: number; rest: number }[] = [];
  /** Slow motion: the clock runs at `rate` of real time and falls behind by `lag` seconds, then catches up. */
  private rate = 1;
  private targetRate = 1;
  private lag = 0;
  /** The visitor's time at the last tick (ms): a paused film gives no time, while the clock on the wall goes on. */
  private wall: number | null = null;
  /** Turns of the crown so far, and how fast it's turning. */
  private crown = 0;
  private windSpeed = 0;
  private windTarget = 0;
  private clicks = 0;
  /** With the pallet fork out the train runs away; `beats` is how far it has run. */
  private loose: { t: number; from: number; beats: number; back: boolean } | null = null;
  /** Turns each part has made while running free, on top of where the beat puts it. */
  private readonly free = new Map<NodeRig, number>();
  /** How much of its swing the balance keeps: it dies away when nothing drives it. */
  private life = 1;
  /** The balance's phase (radians): locked to the beat, except while it swings free with the fork out. */
  private phase = 0;
  /** Beats a second: a watch's six, or what a motion's `beats` says (a seconds pendulum beats once a second). */
  private readonly perSecond: number;

  constructor(motions: Motion[], resolve: Resolve, rigs: Rigs) {
    this.perSecond = motions.find((m) => m.beats)?.beats ?? BEATS_PER_SECOND;
    for (const motion of motions) {
      // Parts on a control (a camera's focus, its shutter) are moved by the Linkage instead.
      if (motion.control) continue;
      const node = resolve(motion.node);
      if (!node) continue;
      const axis = new Vector3(...motion.axis).normalize();
      const pivot = motion.pivot ? new Vector3(...motion.pivot) : new Box3().setFromObject(node, true).getCenter(new Vector3());
      const inside = !!motion.inside;
      const amplitude = ((motion.amplitude ?? 0) * Math.PI) / 180;
      if (motion.swing === 'coil' || motion.coil) {
        // Deformed in place, so it needs no rig.
        node.traverse((object) => {
          const mesh = object as Mesh;
          if (!mesh.isMesh) return;
          if (motion.coil) this.windCoils.push({ coil: new Coil(mesh, pivot, axis), turns: motion.wind ?? 0, angle: NaN });
          else this.coils.push({ coil: new Coil(mesh, pivot, axis), amplitude, inside, angle: NaN });
        });
        continue;
      }
      const rig = rigs.get(node);
      rig.axis.copy(rig.vectorToParent(axis).normalize());
      rig.pivot.copy(rig.pointToParent(pivot));
      const driverName = motion.crank ?? motion.cam;
      const driver = driverName ? resolve(driverName) : undefined;
      if (driver) {
        // A model-space unit vector in the parent's frame: its length carries the scale, so `throw`, `rod` and `lift`
        // (model units) move the part the right distance whatever the parent's units.
        const along = rig.vectorToParent(new Vector3(...(motion.along ?? [0, 1, 0])).normalize());
        const phase = ((motion.phase ?? 0) * Math.PI) / 180;
        if (motion.crank) this.sliders.push({ rig, crank: rigs.get(driver), along, r: motion.throw ?? 0, l: motion.rod ?? 1, phase, rocks: !!motion.rocks });
        else {
          const half = (((motion.duration ?? 120) / 2) * Math.PI) / 180;
          this.cams.push({ rig, cam: rigs.get(driver), along, lift: motion.lift ?? 0, phase, half, rest: openness(phase, half) });
        }
        continue;
      }
      if (motion.pawl) this.pawls.push({ rig, teeth: motion.pawl, turns: motion.wind ?? 0, amplitude });
      else if (motion.wind !== undefined) this.winders.push({ rig, turns: motion.wind });
      else if (motion.clock) this.hands.push({ rig, hand: motion.clock, rest: restAngle(node, pivot, axis) });
      else if (motion.train !== undefined) this.trains.push({ rig, train: motion.train, inside });
      else if (motion.swing) this.swings.push({ rig, swing: motion.swing, amplitude, inside });
      else this.spins.push({ rig, speed: motion.speed ?? 0.5, factor: 1 });
    }
  }

  get canRun(): boolean {
    return this.spins.length > 0;
  }

  /** Scales the speed of spinning parts on these nodes (all of them, with null): a belt moved to other pulleys. */
  setSpinFactor(nodes: Set<Object3D> | null, factor: number): void {
    for (const spin of this.spins) if (!nodes || nodes.has(spin.rig.node)) spin.factor = factor;
  }

  /** Whether there's a crown to wind. */
  get canWind(): boolean {
    return this.windCoils.length > 0;
  }

  /** Meshes whose vertices move every frame (they can't keep a raycast index). */
  get deforming(): Mesh[] {
    return [...this.coils, ...this.windCoils].map(({ coil }) => coil.mesh);
  }

  /** Hours stored per turn of the crown: the arbor turns `wind` times per turn of it. */
  private get hoursPerCrownTurn(): number {
    return Math.abs(this.windCoils[0]?.turns ?? 0) * HOURS_PER_ARBOR_TURN;
  }

  get state(): MechanismState {
    const balance = this.swings.find((s) => s.swing === 'balance');
    const rest = ((balance?.amplitude ?? 0) * 180) / Math.PI;
    const amplitude = amplitudeFor(this.reserve, rest) * this.life;
    return {
      beat: this.beat,
      rate: this.rate,
      reserve: this.reserve,
      amplitude,
      swing: amplitude * Math.sin(this.phase),
      held: this.held,
      loose: !!this.loose && !this.loose.back,
      winding: this.windTarget > 0,
    };
  }

  /** Slows clock-driven motion to `rate` of real time, or (with 1) lets it catch back up. */
  setRate(rate: number, immediate = false): void {
    this.targetRate = rate;
    if (immediate) {
      this.rate = rate;
      if (rate === 1 && this.catchUp) this.lag = 0;
    }
  }

  /** Turns the crown while `on`, until the spring is fully wound. */
  setWinding(on: boolean): void {
    this.windTarget = on && this.reserve < FULL_RESERVE ? WIND_SPEED : 0;
  }

  /** Takes the pallet fork out, so the train runs away and the spring spends itself; or (false) puts it back and winds the spring again. */
  setLoose(on: boolean): void {
    if (on && !this.loose) {
      this.loose = { t: 0, from: Math.max(this.reserve, 1), beats: 0, back: false };
      for (const { rig } of [...this.trains, ...this.hands]) this.free.set(rig, this.free.get(rig) ?? 0);
    } else if (!on && this.loose && !this.loose.back) {
      this.loose.back = true;
      // Unwind each part the short way round to where the beat has it.
      for (const [rig, turned] of this.free) this.free.set(rig, Math.atan2(Math.sin(turned), Math.cos(turned)));
    }
  }

  /** Beats in one turn of a hand, at this clock's beat. */
  private perTurn(hand: Hand): number {
    return (BEATS_PER_TURN[hand] * this.perSecond) / BEATS_PER_SECOND;
  }

  /** Beats a second while running free: the spring's pull spins the train up, then dies away as the hours run out. */
  private looseSpeed(t: number, from: number): number {
    const [rise, fall] = [0.35, 1.5];
    const total = from * 3600 * this.perSecond;
    return (total / (fall - (rise * fall) / (rise + fall))) * (1 - Math.exp(-t / rise)) * Math.exp(-t / fall);
  }

  /** Pistons and rods where their crank has them, valves where their cams do. */
  private follow(): void {
    // The crankpin's height above the crank's axis, plus the rod's reach up to the piston's pin.
    const height = (t: number, r: number, l: number) => r * Math.cos(t) + Math.sqrt(Math.max(0, l * l - (r * Math.sin(t)) ** 2));
    for (const s of this.sliders) {
      const t = s.crank.angle + s.phase;
      s.rig.drive.copy(s.along).multiplyScalar(height(t, s.r, s.l) - height(s.phase, s.r, s.l));
      if (s.rocks) s.rig.angle = -(Math.asin((s.r * Math.sin(t)) / s.l) - Math.asin((s.r * Math.sin(s.phase)) / s.l));
    }
    // From where the valve was modelled: as open as its cam had it with the camshaft at rest.
    for (const c of this.cams) c.rig.drive.copy(c.along).multiplyScalar(c.lift * (openness(c.cam.angle + c.phase, c.half) - c.rest));
  }

  /** Advances by dt seconds; returns whether anything moved. `visible` says whether the inside can be seen. */
  tick(dt: number, now: Date, visible = true): boolean {
    let moved = false;
    if (this.running) {
      this.time += dt * this.spinRate;
      for (const spin of this.spins) spin.rig.angle += dt * this.spinRate * spin.speed * spin.factor * Math.PI * 2;
      moved = this.spins.length > 0;
      this.follow();
    }

    // Free running, then putting it back.
    const loose = this.loose;
    if (loose && !loose.back) {
      loose.t += dt;
      const speed = this.looseSpeed(loose.t, loose.from);
      loose.beats += speed * dt;
      this.reserve = Math.max(0, loose.from * (1 - loose.beats / (loose.from * 3600 * this.perSecond)));
      const cap = SPIN_CAP * Math.PI * 2;
      const spin = (rig: NodeRig, perBeat: number) => {
        const w = Math.min(Math.abs(perBeat) * speed * Math.PI * 2, cap) * -Math.sign(perBeat);
        this.free.set(rig, (this.free.get(rig) ?? 0) + w * dt);
      };
      for (const { rig, train } of this.trains) spin(rig, train / this.perTurn('second'));
      for (const { rig, hand } of this.hands) spin(rig, 1 / this.perTurn(hand));
    } else if (loose) {
      let settled = true;
      for (const [rig, turned] of this.free) {
        const next = turned * Math.exp(-dt / 0.2);
        this.free.set(rig, Math.abs(next) < 1e-3 ? 0 : next);
        settled &&= Math.abs(next) < 1e-3;
      }
      this.reserve += (loose.from - this.reserve) * (1 - Math.exp(-dt / 0.3));
      if (settled && Math.abs(loose.from - this.reserve) < 0.01) {
        this.reserve = loose.from;
        this.loose = null;
      }
      moved = true;
    }

    // Winding: the crown and the wheels it turns, while the spring takes up the hours.
    this.windSpeed += (this.windTarget - this.windSpeed) * (1 - Math.exp(-dt / 0.12));
    if (this.windSpeed > 1e-4 && !this.loose) {
      let turn = this.windSpeed * dt;
      const room = (FULL_RESERVE - this.reserve) / (this.hoursPerCrownTurn || 1);
      if (turn >= room) {
        turn = Math.max(0, room);
        this.windTarget = this.windSpeed = 0;
      }
      this.crown += turn;
      this.reserve = Math.min(FULL_RESERVE, this.reserve + turn * this.hoursPerCrownTurn);
    }

    const stopped = this.held || (!!this.loose && !this.loose.back) || this.reserve <= 0;
    if (stopped && this.held) this.rate = 0;
    const target = stopped ? 0 : this.targetRate;
    this.rate += (target - this.rate) * (1 - Math.exp(-dt / (target === 0 ? 0.08 : 0.25)));
    // Held back, it falls behind by however much real time went by, less what it ran: paused, slowed or sped up.
    const elapsed = this.wall === null ? dt : (now.getTime() - this.wall) / 1000;
    this.wall = now.getTime();
    if (target < 1 || !this.catchUp) this.lag += elapsed - this.rate * dt;
    else this.lag = this.lag < 1e-3 ? 0 : this.lag * Math.exp(-dt / 0.3);
    const beat = (secondsOfDay(now) - this.lag) * this.perSecond;
    if (Math.floor(beat) > Math.floor(this.beat) && Math.floor(beat) - Math.floor(this.beat) < 3) this.onBeat?.(Math.floor(beat));
    this.beat = beat;
    const beats = trainBeats(beat);

    // The balance swings with the beat; with the fork out it swings on its own, dying away. A spent spring lets it settle.
    const driven = !stopped || this.held;
    this.life += ((driven ? 1 : 0) - this.life) * (1 - Math.exp(-dt / (driven ? 0.6 : 1.1)));
    if (this.loose && !this.loose.back) this.phase += Math.PI * this.perSecond * dt;
    else this.phase = Math.PI * beat;
    const lively = (rest: number) => ((amplitudeFor(this.reserve, (rest * 180) / Math.PI) * Math.PI) / 180) * this.life;

    const turn = (rig: NodeRig, angle: number) => {
      if (angle === rig.angle) return;
      rig.angle = angle;
      moved = true;
    };
    const free = (rig: NodeRig) => this.free.get(rig) ?? 0;
    // A positive angle turns anticlockwise about the axis, so clockwise travel is negative.
    for (const { rig, hand, rest } of this.hands) turn(rig, rest - (beats / this.perTurn(hand)) * Math.PI * 2 + free(rig));
    for (const { rig, train, inside } of this.trains) if (visible || !inside) turn(rig, -train * (beats / this.perTurn('second')) * Math.PI * 2 + free(rig));
    for (const { rig, swing, amplitude, inside } of this.swings) {
      if (!visible && inside) continue;
      turn(rig, swing === 'balance' ? lively(amplitude) * Math.sin(this.phase) : amplitude * palletLean(beat));
    }
    for (const entry of this.coils) {
      if (!visible && entry.inside) continue;
      const angle = lively(entry.amplitude) * Math.sin(this.phase);
      if (angle === entry.angle) continue;
      entry.angle = angle;
      entry.coil.apply(angle);
      moved = true;
    }

    // The crown's train, and the mainspring coiling round its arbor as the hours go in (and out).
    for (const { rig, turns } of this.winders) turn(rig, this.crown * turns * Math.PI * 2);
    for (const { rig, teeth, turns, amplitude } of this.pawls) {
      // The click rides up the back of each tooth, then drops into the next gap.
      const teethPast = this.crown * Math.abs(turns) * teeth;
      const f = teethPast - Math.floor(teethPast);
      turn(rig, amplitude * (f < 0.8 ? f / 0.8 : 1 - (f - 0.8) / 0.2));
      if (Math.floor(teethPast) > this.clicks) {
        this.clicks = Math.floor(teethPast);
        this.onClick?.();
      }
    }
    for (const entry of this.windCoils) {
      if (!visible) continue;
      const angle = Math.sign(entry.turns) * ((this.reserve - REST_RESERVE) / HOURS_PER_ARBOR_TURN) * Math.PI * 2;
      if (Math.abs(angle - entry.angle) < 1e-5) continue;
      entry.angle = angle;
      entry.coil.apply(angle);
      moved = true;
    }
    return moved;
  }
}
