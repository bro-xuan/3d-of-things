// The timing of a watch's escapement and mainspring, as plain numbers. The viewer's mechanism
// moves the parts by these, and the charts in "How it works" draw them, so the two always agree.
// Nothing here touches three.js, so the page can draw charts before the viewer has loaded.

export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Clock-driven mechanisms beat 21,600 times an hour: the seconds hand steps six times a second. */
export const BEATS_PER_SECOND = 6;
/** Fraction of a beat the escapement spends unlocking, giving its push and locking again. */
export const IMPULSE = 0.12;
/** Hours a full wind runs for. */
export const FULL_RESERVE = 40;
/** The model's mainspring is drawn part wound, with this many hours in it. */
export const REST_RESERVE = 30;

/** How far a clock's train has moved, in beats: locked between beats, with a quick eased step centred on each one. */
export function trainBeats(beat: number): number {
  const q = beat + IMPULSE / 2;
  const n = Math.floor(q);
  const f = q - n;
  return n - 1 + (f < IMPULSE ? easeInOutCubic(f / IMPULSE) : 1);
}

/** The pallet fork's lean, from -1 to 1: it flicks across during each impulse, the other way on alternate beats. */
export function palletLean(beat: number): number {
  const q = beat + IMPULSE / 2;
  const n = Math.floor(q);
  const f = q - n;
  const parity = n % 2 === 0 ? 1 : -1;
  return f < IMPULSE ? parity * (1 - 2 * easeInOutCubic(f / IMPULSE)) : -parity;
}

/** How hard the mainspring pulls with this many hours left in it, 0 to 1: hardest just after winding, then a long,
 *  gently falling middle, then it fades. */
export function springTorque(hours: number): number {
  if (hours <= 0) return 0;
  const used = FULL_RESERVE - Math.min(hours, FULL_RESERVE);
  return clamp01((0.86 - (0.2 * used) / FULL_RESERVE + 0.14 * Math.exp(-used / 3)) * (1 - Math.exp(-hours / 1.6)));
}

/** The balance's swing, in degrees either side, with this much torque behind it: smaller as the spring runs down. */
export function swingFor(torque: number): number {
  return torque <= 0 ? 0 : 130 + 175 * torque;
}

/** The swing for this many hours left, scaled so that `rest` degrees is the swing with the rest reserve. */
export function amplitudeFor(hours: number, rest: number): number {
  return (rest * swingFor(springTorque(hours))) / swingFor(springTorque(REST_RESERVE));
}
