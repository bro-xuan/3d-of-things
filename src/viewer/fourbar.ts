// A four-bar linkage in space: a crank turning on its axis, a rocker (a treadle) swinging on its hinge, and the link
// (a footman) joining the crank's pin to a pin on the rocker. Written for the spinning wheel's treadle: the foot
// rocks the treadle, the footman pulls the crank round. Given the crank's angle, the rocker's angle is the one that
// keeps its pin exactly the link's length from the crank's pin, so nothing comes apart as it goes round.
// Plain numbers, no three.js: points and axes are [x, y, z] in one frame, angles in radians.

export type V3 = [number, number, number];

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const length = (a: V3) => Math.hypot(a[0], a[1], a[2]);

/** `point` turned by `angle` about the line through `pivot` along the unit vector `axis` (right-handed). */
export function turnAbout(point: V3, pivot: V3, axis: V3, angle: number): V3 {
  const v = sub(point, pivot);
  const along = mul(axis, dot(v, axis));
  const across = sub(v, along);
  return add(pivot, add(along, add(mul(across, Math.cos(angle)), mul(cross(axis, across), Math.sin(angle)))));
}

/**
 * The rocker's angle about its `axis` through `pivot` that puts its point `at` (as it is at angle 0) exactly `link`
 * from `pin`; of the two that do, the one nearer `previous`. If the link can't reach (it never should), the nearest
 * it can get.
 */
export function rockerAngle(pin: V3, pivot: V3, axis: V3, at: V3, link: number, previous: number): number {
  // at(θ) = pivot + along + cos θ · across + sin θ · (axis × across); |at(θ) − pin|² = link² is a cos θ + b sin θ = k.
  const v = sub(at, pivot);
  const across = sub(v, mul(axis, dot(v, axis)));
  const side = cross(axis, across);
  const c = sub(add(pivot, mul(axis, dot(v, axis))), pin);
  const a = 2 * dot(c, across);
  const b = 2 * dot(c, side);
  const k = link * link - dot(c, c) - dot(across, across);
  const r = Math.hypot(a, b);
  const phi = Math.atan2(b, a);
  const spread = Math.acos(Math.max(-1, Math.min(1, k / (r || 1))));
  const near = (theta: number) => Math.abs(Math.atan2(Math.sin(theta - previous), Math.cos(theta - previous)));
  const one = phi + spread;
  const other = phi - spread;
  const pick = near(one) <= near(other) ? one : other;
  // Keep counting from where it was, so the angle doesn't jump by a turn.
  return previous + Math.atan2(Math.sin(pick - previous), Math.cos(pick - previous));
}

/**
 * Where the link goes: it hangs from the rocker's pin (moved from `foot` to `footNow`) and points at the crank's pin
 * (from `top` to `topNow`), turned the least way that does it. Returns the turn as an axis and angle about `foot`, and
 * the slide that then takes `foot` to `footNow`.
 */
export function linkPose(foot: V3, top: V3, footNow: V3, topNow: V3): { axis: V3; angle: number; slide: V3 } {
  const from = sub(top, foot);
  const to = sub(topNow, footNow);
  const f = mul(from, 1 / (length(from) || 1));
  const t = mul(to, 1 / (length(to) || 1));
  const axis = cross(f, t);
  const s = length(axis);
  const angle = Math.atan2(s, dot(f, t));
  return { axis: s > 1e-9 ? mul(axis, 1 / s) : [0, 1, 0], angle: s > 1e-9 ? angle : 0, slide: sub(footNow, foot) };
}
