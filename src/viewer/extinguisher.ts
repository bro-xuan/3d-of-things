// A stored-pressure powder extinguisher: nitrogen at about 9.6 bar shares the tank with 3.3 kg of powder. Pull the
// pin, squeeze the lever, and the stem takes the seal off its seat: the gas pushes the powder up the dip tube and out
// of the hose, and the gas itself leaves with it, so the pressure falls as the powder goes. Upside down, the dip
// tube's mouth is in the gas, so only nitrogen comes out and the powder stays behind.
//
// No three.js here: the charts and readouts read the same functions. The numbers are the truth sheet's
// (objects/fire-extinguisher/TRUTH.md); the volumes are the model's (its hints).
import type { Controls } from './filmcamera';

/** Atmospheric pressure, bar; the gauge reads above it. */
export const ATM = 1.013;
/** Nitrogen's gas constant, J/(kg·K); the tank stays near room temperature (the powder holds the heat). */
const R_N2 = 296.8;
const T = 293.15;
/** The charge at 20 °C: gauge pressure (bar) and powder (kg). */
export const CHARGE_BAR = 9.6;
export const POWDER_KG = 3.3;
/** The gauge's green band (bar): the pressures it is ready to use at. */
export const GREEN: [number, number] = [7, 9.8];
/** The tank's volume, and the powder's bulk and particle densities (kg/L). */
export const TANK_L = 4.68;
const BULK = 0.9;
const PARTICLE = 1.8;
/** Powder the dip tube can't reach: what lies below its mouth, 12 mm off the bottom (kg, from the model). */
export const RESIDUAL_KG = 0.1;
/** How fast the powder leaves at the full charge (kg/s); it falls with the square root of the pressure. */
const FLOW = 0.48;
/** Kilograms of powder that carry one kilogram of nitrogen out with them. */
const LOADING = 130;
/** The nozzle's throat (m², with its discharge coefficient), for gas alone. */
const THROAT = 12.8e-6;
const GAMMA = 1.4;
/** The stem's travel is the lever's 0 to 1; how fast a hand squeezes it home or lets it go (per second). */
const SQUEEZE = 6;
const PULL = 3;

/** The nitrogen's volume (L) with `kg` of powder in the tank: the tank less the powder's grains themselves. */
export const gasLitres = (kg: number) => TANK_L - kg / PARTICLE;
/** Nitrogen in the full tank (kg). */
export const N2_KG = ((CHARGE_BAR + ATM) * 1e5 * gasLitres(POWDER_KG) * 1e-3) / (R_N2 * T);
/** Gauge pressure (bar) with `gas` kg of nitrogen and `kg` of powder in the tank. */
export const barFor = (gas: number, kg: number) => Math.max(0, (gas * R_N2 * T) / (gasLitres(kg) * 1e-3) / 1e5 - ATM);
/** How full the powder is (0–1) as a share of its height in the tank, for the model's level. */
export const levelOf = (kg: number) => kg / POWDER_KG;
/** The powder's volume, L. */
export const POWDER_L = POWDER_KG / BULK;

/** Gas alone through the nozzle (kg/s), choked while the tank is above 1.9 times the air outside. */
function gasFlow(bar: number): number {
  const p = (bar + ATM) * 1e5;
  const r = (ATM * 1e5) / p;
  const crit = Math.pow(2 / (GAMMA + 1), GAMMA / (GAMMA - 1));
  if (r <= crit) return THROAT * p * Math.sqrt(GAMMA / (R_N2 * T)) * Math.pow(2 / (GAMMA + 1), (GAMMA + 1) / (2 * (GAMMA - 1)));
  if (r >= 1) return 0;
  return THROAT * p * Math.sqrt(((2 * GAMMA) / ((GAMMA - 1) * R_N2 * T)) * (r ** (2 / GAMMA) - r ** ((GAMMA + 1) / GAMMA)));
}

export interface Tank {
  /** Powder and nitrogen left, kg. */
  powder: number;
  gas: number;
}

/** One step of an open valve: what leaves in dt seconds, upright or upside down. Returns the powder's rate (kg/s). */
export function discharge(tank: Tank, dt: number, inverted = false): number {
  const bar = barFor(tank.gas, tank.powder);
  // Powder only while the dip tube's mouth is in it; then the gas blows straight through.
  if (!inverted && tank.powder > RESIDUAL_KG && bar > 0.02) {
    const rate = Math.min(FLOW * Math.sqrt(bar / CHARGE_BAR), (tank.powder - RESIDUAL_KG) / dt);
    tank.powder -= rate * dt;
    tank.gas = Math.max(0, tank.gas - (rate / LOADING) * dt);
    return rate;
  }
  tank.gas = Math.max(0, tank.gas - Math.min(gasFlow(bar), tank.gas / dt) * dt);
  return 0;
}

/** A full discharge with the lever held: pressure (bar) and powder (kg) every `step` seconds, until the gas is spent. */
export function dischargeCurve(inverted = false, step = 0.1): { t: number; bar: number; kg: number }[] {
  const tank: Tank = { powder: POWDER_KG, gas: N2_KG };
  const out = [{ t: 0, bar: CHARGE_BAR, kg: POWDER_KG }];
  const dt = 0.005;
  let t = 0;
  while (t < 40) {
    for (let i = 0; i < step / dt; i++) discharge(tank, dt, inverted);
    t += step;
    const bar = barFor(tank.gas, tank.powder);
    out.push({ t: +t.toFixed(2), bar, kg: tank.powder });
    if (bar < 0.02) break;
  }
  return out;
}

/** When the powder stops coming out, holding the lever from full (s). */
export const POWDER_SECONDS = (() => {
  const curve = dischargeCurve();
  return curve.find((p) => p.kg <= RESIDUAL_KG + 1e-6)?.t ?? curve[curve.length - 1].t;
})();

export interface ExtinguisherState {
  kind: 'extinguisher';
  /** The safety pin: 0 in, 1 pulled out. */
  pin: number;
  /** The lever (and the stem): 0 at rest, 1 squeezed home. */
  lever: number;
  /** Gauge pressure, bar; powder and nitrogen left, kg. */
  bar: number;
  powder: number;
  gas: number;
  /** Powder leaving now, kg/s; whether gas alone is coming out. */
  rate: number;
  gasOnly: boolean;
  /** Seconds the valve has been open. */
  seconds: number;
  /** Held upside down. */
  inverted: boolean;
  /** The hand squeezes but the pin holds the lever. */
  blocked: boolean;
}

export class Extinguisher {
  readonly kind = 'extinguisher';
  private readonly tank: Tank = { powder: POWDER_KG, gas: N2_KG };
  private pin = 0;
  private pinTarget = 0;
  private lever = 0;
  private squeezing = false;
  private inverted = false;
  private rate = 0;
  private gasOnly = false;
  private seconds = 0;

  constructor(private readonly controls: Controls) {
    this.push();
  }

  get state(): ExtinguisherState {
    return {
      kind: 'extinguisher',
      pin: this.pin,
      lever: this.lever,
      bar: barFor(this.tank.gas, this.tank.powder),
      powder: this.tank.powder,
      gas: this.tank.gas,
      rate: this.rate,
      gasOnly: this.gasOnly,
      seconds: this.seconds,
      inverted: this.inverted,
      blocked: this.squeezing && this.pin < 1,
    };
  }

  /** Pulls the safety pin out (or puts it back, which also lets go of the lever). */
  pullPin(out = true): void {
    this.pinTarget = out ? 1 : 0;
    if (!out) this.squeezing = false;
  }

  /** Squeezes the lever while `on`; it only moves once the pin is out. */
  squeeze(on: boolean): void {
    this.squeezing = on;
  }

  /** Holds it upside down: the dip tube's mouth is then in the gas. */
  setInverted(on: boolean): void {
    this.inverted = on;
  }

  /** Recharged: powder and nitrogen back in, a new pin and seal. */
  refill(): void {
    this.tank.powder = POWDER_KG;
    this.tank.gas = N2_KG;
    this.seconds = 0;
    this.rate = 0;
    this.gasOnly = false;
    this.push();
  }

  reset(): void {
    this.squeezing = false;
    this.inverted = false;
    this.pinTarget = 0;
    this.pin = 0;
    this.lever = 0;
    this.refill();
  }

  tick(dt: number): boolean {
    dt = Math.min(dt, 0.1);
    const before = [this.pin, this.lever, this.tank.powder, this.tank.gas];
    this.pin += Math.sign(this.pinTarget - this.pin) * Math.min(Math.abs(this.pinTarget - this.pin), PULL * dt);
    const target = this.squeezing && this.pin >= 1 ? 1 : 0;
    this.lever += Math.sign(target - this.lever) * Math.min(Math.abs(target - this.lever), SQUEEZE * dt);
    // The seal is off its seat once the stem has taken up its first fifth of travel.
    const open = Math.max(0, (this.lever - 0.2) / 0.8);
    this.rate = 0;
    this.gasOnly = false;
    if (open > 0 && this.tank.gas > 0) {
      const steps = Math.ceil(dt / 0.005);
      let powder = 0;
      for (let i = 0; i < steps; i++) {
        const out = discharge(this.tank, (dt / steps) * open, this.inverted);
        powder += out / steps;
      }
      this.rate = powder * open;
      this.gasOnly = this.rate === 0 && barFor(this.tank.gas, this.tank.powder) > 0.02;
      this.seconds += dt * open;
    }
    const moved = [this.pin, this.lever, this.tank.powder, this.tank.gas].some((v, i) => v !== before[i]);
    if (moved) this.push();
    return moved;
  }

  private push(): void {
    this.controls.set('ext_pin', this.pin);
    this.controls.set('ext_lever', this.lever);
    this.controls.set('ext_bar', barFor(this.tank.gas, this.tank.powder));
    this.controls.set('ext_used', 1 - levelOf(this.tank.powder));
  }
}
