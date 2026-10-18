// The 2026 Roadster's suction fans and cold-gas thrusters, as numbers, and the car's controls run in
// time. The fans pull the air out from under the sealed floor, so the air above presses the car down
// harder than the air below holds it up; the thrusters let air out of the tanks through nozzles, and
// the jets push the car the other way. The viewer turns the controls this sets into moving parts (the
// fans turning, the skirts dropping, the wing rising: src/viewer/linkage.ts), lifts the whole car for
// a flight and draws the jets (src/viewer/jets.ts); the charts draw from the same numbers. Nothing
// here touches three.js.
import { clamp01, easeInOutCubic } from './clockwork';
import type { Controls } from './filmcamera';

export const G = 9.81;
/** Tesla's figure for the car: under 1,700 kg. */
export const MASS = 1700;
/** The sealed floor between the skirts, m² (from the model: 2.0 m by 1.5 m). */
export const FLOOR = 3.1;
/** The air's pressure at sea level, Pa. */
export const ATMOSPHERE = 101325;
/** What the fans hold the car down with at full power, kg: Musk said they "can pull up to two g's", the car's own
 *  weight again on top of its weight. A little more than it weighs, so it can hang upside down. */
export const FAN_DOWNFORCE = 2000;
/** How far the fans lower the pressure under the floor, Pa: that downforce spread over the floor. */
export const SUCTION = (FAN_DOWNFORCE * G) / FLOOR;
/** Four fans of about 20 kW each. */
export const FAN_KW = 80;
/** The tyres on their own: Tesla quoted 1.26 g. A tyre gives a little less grip per kilo the harder it's pressed. */
export const MU = 1.26;
const LOAD_SENSITIVITY = 0.15;
/** Downforce from the body and the wing (which rises in track mode), kg at 300 km/h; it grows with speed squared. */
export const BODY_AT_300 = 900;

/** Cornering grip, in g, with this much downforce (kg) on top of the car's weight. */
export function corneringG(downforce: number): number {
  const r = 1 + downforce / MASS;
  return MU * (1 - LOAD_SENSITIVITY * (r - 1)) * r;
}

/** Downforce from the body and wing at a speed (km/h), with the wing stowed (0) or up (1), kg. */
export function bodyDownforce(kmh: number, wing: number): number {
  return BODY_AT_300 * (kmh / 300) ** 2 * (0.4 + 0.6 * wing);
}

// ------------------------------------------------------------------ air

/** The Rocket's air store, Tesla's figures: about 600 litres at 10,000 psi (690 bar). */
export const TANK_LITRES = 600;
export const FULL_BAR = 690;
/** At 690 bar and 20 °C air is about 545 kg/m³ (nowhere near an ideal gas): some 327 kg in 600 litres. */
export const FULL_AIR = 327;
/** The regulator feeds the nozzles at 150 bar; below about 180 bar in the tanks it can't keep that up. */
export const FEED_BAR = 150;
export const LOW_BAR = 180;

/** The tanks' pressure (bar) and temperature (K) with this much air left (kg). The air left behind expands as the
 *  rest rushes out, and cools as it does (as a can of spray gets cold), so the pressure falls faster than the air. */
export function tankAt(air: number): { bar: number; kelvin: number } {
  const f = clamp01(air / FULL_AIR);
  return { bar: FULL_BAR * f ** 1.4, kelvin: 293 * f ** 0.4 };
}
/** Air left when the tanks are down to the regulator's limit. */
export const LOW_AIR = FULL_AIR * (LOW_BAR / FULL_BAR) ** (1 / 1.4);

/** How fast the jet leaves a nozzle, m/s: expanding from 150 bar to the air outside, a little slower as the gas in the
 *  tanks cools. About twice the speed of sound. */
export function jetSpeed(kelvin: number): number {
  return 650 * Math.sqrt(kelvin / 293);
}

/** What a group's nozzles push with together at full throttle, N, and how many there are. Tesla's figure for the rear
 *  four (80 kN); the rest are this model's. */
export const GROUPS = {
  rear: { thrust: 80000, nozzles: 4 },
  lift: { thrust: 48000, nozzles: 4 },
  yaw: { thrust: 6000, nozzles: 2 },
};

/** How much of a group's thrust the tanks can still give: all of it down to the regulator's limit, then less. */
export function thrustLeft(air: number): number {
  const { bar } = tankAt(air);
  return bar >= LOW_BAR ? 1 : clamp01((bar - 1) / (LOW_BAR - 1)) ** 1.2;
}

// ------------------------------------------------------------------ the nozzle

/** A de Laval nozzle's shape along its length (0 at the chamber, 1 at the exit): its radius over the throat's. */
export function nozzleRadius(x: number): number {
  const throat = 0.48;
  if (x <= throat) return 1 + 1.55 * (0.5 - 0.5 * Math.cos(Math.PI * (1 - x / throat)));
  const u = (x - throat) / (1 - throat);
  return 1 + 2.4 * Math.sqrt(u) * (0.75 + 0.25 * u);
}

/** The air's Mach number along the nozzle, from the area ratio (subsonic before the throat, supersonic after). */
export function nozzleMach(x: number): number {
  const ratio = nozzleRadius(x) ** 2;
  const supersonic = x > 0.48;
  const area = (m: number) => (1 / m) * ((2 / 2.4) * (1 + 0.2 * m * m)) ** 3;
  let lo = supersonic ? 1 : 1e-3;
  let hi = supersonic ? 8 : 1;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    const f = area(mid) - ratio;
    if (supersonic ? f > 0 : f < 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

/** Pressure (bar) and temperature (K) of the air at a Mach number, fed at 150 bar and 293 K. */
export function nozzleState(mach: number, kelvin = 293): { bar: number; kelvin: number; speed: number } {
  const t = 1 + 0.2 * mach * mach;
  const T = kelvin / t;
  return { bar: FEED_BAR / t ** 3.5, kelvin: T, speed: mach * Math.sqrt(1.4 * 287 * T) };
}

// ------------------------------------------------------------------ a flight

export type FlightKind = 'hop' | 'roll';

/** One moment of a flight: the car's height (m) and turn, each lift nozzle's throttle (front left, front right, rear
 *  left, rear right), the yaw nozzles' (left, right), and the fans and skirts (wound down for take-off). */
export interface FlightFrame {
  t: number;
  height: number;
  climb: number;
  roll: number;
  pitch: number;
  heading: number;
  lift: [number, number, number, number];
  yaw: [number, number];
  fans: number;
  /** Total lift thrust, N, and the car's weight with its air, N. */
  thrust: number;
  weight: number;
  air: number;
}

const STEP = 1 / 60;
const S = (t: number) => easeInOutCubic(clamp01(t));
/** A gentler ease for planned climbs and descents (its acceleration stays within what the nozzles can give). */
const C = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(t));

/**
 * A flight, worked out step by step: the car's computer throttles the four lift nozzles to follow a planned height
 * (keeping it level, as a drone does), within what they can give; in a barrel roll it kicks one side up, flies
 * round with them shut (upside down they'd push it at the ground), and catches it on the way down.
 */
function fly(kind: FlightKind): FlightFrame[] {
  const frames: FlightFrame[] = [];
  let h = 0;
  let v = 0;
  let air = FULL_AIR;
  const hop = kind === 'hop';
  // When it leaves the ground, when it's back, and the plan between.
  const lift = 0.35;
  // A barrel roll needs it going up fast as the roll starts, so it's still in the air when it comes round.
  let caught = 0;
  let valve = 0;
  const plan = (t: number): number => {
    if (hop) {
      if (t < 1.5) return 2.0 * C((t - lift) / (1.5 - lift));
      if (t < 2.5) return 2.0;
      return 2.0 * (1 - C((t - 2.5) / 1.5));
    }
    if (t < 1.0) return 1.6 * clamp01((t - lift) / (1.0 - lift)) ** 2;
    return caught * (1 - C((t - 1.95) / 1.5));
  };
  const end = hop ? 4.3 : 4.0;
  // After this, once it's down, the nozzles shut.
  const landing = hop ? 3.95 : 3.6;
  for (let t = 0; t <= end + 1e-9; t += STEP) {
    const mass = MASS + air;
    const weight = mass * G;
    const left = thrustLeft(air);
    let roll = 0;
    let throttle = 0;
    let split = 0;
    const ballistic = !hop && t >= 1.0 && t < 1.95;
    if (!hop && !ballistic && t >= 1.95 && !caught) caught = h;
    if (ballistic) {
      // Round it goes: a kick up on the left at the start, one on the right to stop it, nothing in between.
      roll = Math.PI * 2 * S((t - 1.0) / 0.92);
      throttle = t < 1.1 || t > 1.84 ? 0.5 : 0;
      valve = 0;
      split = t < 1.12 ? 1 : -1;
      v -= G * STEP;
      h += v * STEP;
    } else if (t >= lift - 0.05 && !(t > landing && h <= 0.03)) {
      // Follow the plan: thrust for the weight and the planned acceleration, plus a push back toward the planned
      // height and climb.
      const target = plan(t);
      const climb = (plan(t + STEP) - plan(t - STEP)) / (2 * STEP);
      const accel = (plan(t + STEP) - 2 * target + plan(t - STEP)) / (STEP * STEP);
      const want = mass * (G + accel + 16 * (target - h) + 8 * (climb - v));
      // The valves take a moment to open and close, so the throttle follows what's asked of it over about 40 ms.
      valve += (clamp01(want / (GROUPS.lift.thrust * left)) - valve) * (1 - Math.exp(-STEP / 0.04));
      throttle = valve;
      const push = throttle * GROUPS.lift.thrust * left;
      v += (push / mass - G) * STEP;
      h += v * STEP;
      if (h < 0) {
        h = 0;
        v = Math.max(0, v);
      }
    } else if (h > 0) {
      // The nozzles shut a hair above the ground: it settles onto its wheels.
      v -= G * STEP;
      h = Math.max(0, h + v * STEP);
      if (h === 0) v = 0;
    }
    const thrust = throttle * GROUPS.lift.thrust * left;
    air = Math.max(0, air - (thrust / jetSpeed(tankAt(air).kelvin)) * STEP);
    // A slight nod while it hovers, the throttles trimming it level; and a turn on the yaw nozzles.
    const nod = hop && t > 1.3 && t < 2.6 ? 0.016 * Math.sin((t - 1.3) * 7) * Math.sin(Math.PI * clamp01((t - 1.3) / 1.3)) : 0;
    const heading = hop ? 0.32 * (S((t - 1.5) / 0.6) - S((t - 2.6) / 0.6)) : 0;
    const yawL = hop && ((t > 1.45 && t < 1.7) || (t > 2.95 && t < 3.2)) ? 1 : 0;
    const yawR = hop && ((t > 1.95 && t < 2.2) || (t > 2.55 && t < 2.8)) ? 1 : 0;
    const each = throttle;
    const front = each * (1 - nod * 12);
    const rear = each * (1 + nod * 12);
    const sideL = split > 0 ? 1 : split < 0 ? 0.15 : 1;
    const sideR = split < 0 ? 1 : split > 0 ? 0.15 : 1;
    frames.push({
      t,
      height: Math.max(0, h),
      climb: v,
      roll,
      pitch: nod,
      heading,
      lift: [clamp01(front * sideL), clamp01(front * sideR), clamp01(rear * sideL), clamp01(rear * sideR)],
      yaw: [yawL, yawR],
      fans: 1 - clamp01(t / 0.3),
      thrust,
      weight,
      air,
    });
  }
  return frames;
}

/** Both flights, worked out once. */
export const FLIGHTS: Record<FlightKind, FlightFrame[]> = { hop: fly('hop'), roll: fly('roll') };

/** A flight's frame at a time, between the worked-out steps. */
export function flightAt(kind: FlightKind, t: number): FlightFrame {
  const frames = FLIGHTS[kind];
  const i = Math.min(frames.length - 1, Math.max(0, Math.floor(t / STEP)));
  return frames[i];
}

export const flightLength = (kind: FlightKind) => FLIGHTS[kind][FLIGHTS[kind].length - 1].t;

// ------------------------------------------------------------------ a standing start

/** How hard the tyres alone can push it off the line, m/s²: 0 to 60 mph in about 2.3 s, or (with the fans holding it
 *  down) in the 1.6 s Tesla quotes for the Performance. */
export const LAUNCH = { plain: 11.7, suction: 16.8 };
export const SIXTY = 26.82;
/** Over 230 mph, Tesla says. */
export const TOP_SPEED = 103;

// ------------------------------------------------------------------ the car

export interface AeroState {
  kind: 'aero';
  /** How fast the fans are running (0–1), and whether they're switched on. */
  fans: number;
  fansOn: boolean;
  /** The skirts: 0 tucked up, 1 down at the road. The wing: 0 stowed, 1 up. */
  skirts: number;
  wing: number;
  /** The road speed set for the grip chart, km/h. */
  speed: number;
  /** Suction under the floor, Pa, and the downforce it and the body make, kg. */
  suction: number;
  downforce: number;
  /** The air store: kg left, and its pressure and temperature. */
  air: number;
  bar: number;
  kelvin: number;
  /** The rear nozzles firing (0–1), each lift nozzle, the yaw pair. */
  rear: number;
  lift: [number, number, number, number];
  yaw: [number, number];
  /** A standing start on the rear thrusters: seconds since the go, speed (m/s), when it passed 60 mph (or null). */
  run: { t: number; v: number; sixty: number | null; firing: boolean } | null;
  /** A flight under way. */
  flight: (FlightFrame & { kind: FlightKind }) | null;
}

const FAN_SPIN = 0.55;
/** The fans' turning as drawn, turns a second at full power (a real one turns hundreds of times a second). */
const FAN_TURNS = 3.2;

export class AeroCar {
  readonly kind = 'aero';
  private fans = 0;
  private fansOn = false;
  private skirts = 0;
  private wing = 0;
  private wingUp = false;
  private speed = 0;
  private turns = 0;
  private air = FULL_AIR;
  private rear = 0;
  private run: AeroState['run'] = null;
  private flight: { kind: FlightKind; t: number } | null = null;
  private frame: (FlightFrame & { kind: FlightKind }) | null = null;

  constructor(private readonly controls: Controls) {
    this.push();
  }

  get state(): AeroState {
    const { bar, kelvin } = tankAt(this.air);
    const suction = SUCTION * this.fans;
    const f = this.frame;
    return {
      kind: 'aero',
      fans: this.fans,
      fansOn: this.fansOn,
      skirts: this.skirts,
      wing: this.wing,
      speed: this.speed,
      suction,
      downforce: (suction * FLOOR) / G + bodyDownforce(this.speed, this.wing),
      air: this.air,
      bar,
      kelvin,
      rear: this.rear,
      lift: f ? f.lift : [0, 0, 0, 0],
      yaw: f ? f.yaw : [0, 0],
      run: this.run ? { ...this.run } : null,
      flight: f,
    };
  }

  get busy(): boolean {
    return !!this.flight;
  }

  setFans(on: boolean): void {
    if (this.flight) return;
    this.fansOn = on;
  }

  /** The road speed for the grip chart (km/h): the wing comes up above 120 km/h, as in track mode, and down below 90. */
  setSpeed(kmh: number): void {
    this.speed = Math.max(0, kmh);
    if (kmh > 120) this.wingUp = true;
    else if (kmh < 90) this.wingUp = false;
  }

  setWing(up: boolean): void {
    this.wingUp = up;
  }

  /** Holds the rear thrusters open from a standstill (a launch), or shuts them. */
  fire(on: boolean): void {
    if (this.flight) return;
    // From a standstill, or carrying on if it's still rolling from the last go.
    if (on && !this.run) this.run = { t: 0, v: 0, sixty: null, firing: true };
    else if (this.run) this.run.firing = on;
  }

  /** Starts a flight: a hop, or a barrel roll. False if one is already under way or the air is too low. */
  fly(kind: FlightKind): boolean {
    if (this.flight || this.air < LOW_AIR + 60) return false;
    this.run = null;
    this.rear = 0;
    this.flight = { kind, t: 0 };
    return true;
  }

  /** Fills the tanks again (the compressor takes hours; here, at once). */
  refill(): void {
    if (!this.flight && !this.run?.firing) this.air = FULL_AIR;
  }

  /** Back to the car at rest: fans off, wing down, on the ground, tanks full. */
  reset(): void {
    this.fansOn = false;
    this.wingUp = false;
    this.speed = 0;
    this.run = null;
    this.flight = null;
    this.frame = null;
    this.rear = 0;
    this.air = FULL_AIR;
  }

  /** Advances by dt seconds; returns whether anything moved. */
  tick(dt: number): boolean {
    const before = this.signature();
    // A flight: played from the worked-out steps, its air taken from the tanks.
    if (this.flight) {
      const kind = this.flight.kind;
      const t0 = this.flight.t;
      this.flight.t += dt;
      const was = flightAt(kind, t0);
      const now = flightAt(kind, this.flight.t);
      this.air = Math.max(0, this.air - (was.air - now.air));
      this.frame = { ...now, kind };
      this.fansOn = false;
      if (this.flight.t >= flightLength(kind)) {
        this.flight = null;
        this.frame = null;
      }
    }
    // The fans spin up and down over a moment; the skirts drop once they're going, and lift when they stop.
    const target = this.fansOn ? 1 : 0;
    this.fans += (target - this.fans) * (1 - Math.exp(-dt / FAN_SPIN));
    if (Math.abs(target - this.fans) < 1e-3) this.fans = target;
    const skirtTarget = this.fans > 0.15 && !this.flight ? 1 : 0;
    this.skirts = skirtTarget > this.skirts ? Math.min(1, this.skirts + dt / 0.35) : Math.max(0, this.skirts - dt / 0.25);
    this.turns += this.fans * FAN_TURNS * dt;
    this.wing = this.wingUp ? Math.min(1, this.wing + dt / 0.8) : Math.max(0, this.wing - dt / 0.8);
    // The rear thrusters: full throttle while held (while the air lasts), the car gathering speed.
    const run = this.run;
    if (run) {
      const left = thrustLeft(this.air);
      this.rear = run.firing && this.air > 1 ? left : Math.max(0, this.rear - dt / 0.08);
      const thrust = GROUPS.rear.thrust * this.rear;
      this.air = Math.max(0, this.air - (thrust / jetSpeed(tankAt(this.air).kelvin)) * dt);
      const tyres = run.v < SIXTY * 2 ? (this.fans > 0.5 ? LAUNCH.suction : LAUNCH.plain) : 2;
      // Let go, it brakes (at about 1 g, as hard as it can on its tyres).
      const a = run.firing ? tyres + thrust / (MASS + this.air) : -G;
      const v0 = run.v;
      run.v = Math.min(TOP_SPEED, Math.max(0, run.v + a * dt));
      if (run.firing) run.t += dt;
      if (run.sixty === null && v0 < SIXTY && run.v >= SIXTY) run.sixty = run.t - (run.v - SIXTY) / Math.max(1e-6, a);
      if (!run.firing && run.v <= 0) this.run = null;
    } else {
      this.rear = Math.max(0, this.rear - dt / 0.08);
    }
    this.push();
    return before !== this.signature();
  }

  private signature(): string {
    const f = this.frame;
    return [this.fans, this.skirts, this.wing, this.turns, this.rear, this.air, this.run?.v, f?.t].join();
  }

  private push(): void {
    const c = this.controls;
    c.set('fan', this.turns);
    c.set('skirts', easeInOutCubic(this.skirts));
    c.set('wing', easeInOutCubic(this.wing));
  }
}
