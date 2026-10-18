// Building blocks first written for the rangefinder camera's generated parts, on top of geometry.mjs: plates
// extruded from outlines across any of the camera's axes, turned parts and gears on vertical
// or horizontal axes, and boxes. Outlines are given in the camera frame's own coordinates for
// that axis: (x, y) for a plate across z, (x, z) for one across y, (z, y) for one across x.
import { Geo, circle, cw, extrude, lathe, turned } from './geometry.mjs';
import { gear } from './gears.mjs';

/**
 * Proper rotations taking a part built in a local frame (outline in u, v, depth along w) to
 * the camera frame with w along the named axis.
 */
const FRAMES = {
  z: { map: (p) => p, local: ([x, y]) => [x, y] },
  y: { map: ([u, v, w]) => [u, w, -v], local: ([x, z]) => [x, -z] },
  x: { map: ([u, v, w]) => [w, v, -u], local: ([z, y]) => [-z, y] },
};

/** Appends `local` to `geo`, turned so its w axis runs along `axis` and moved by `offset`. */
export function put(geo, local, axis = 'z', offset = [0, 0, 0]) {
  const { map } = FRAMES[axis];
  geo.append(local, (p, n) => [map(p).map((v, i) => v + offset[i]), map(n)]);
  return geo;
}

/** An outline (camera coordinates for the axis) as a local loop. */
export const toLocal = (axis, loop) => loop.map(FRAMES[axis].local);

/**
 * A plate across `axis` from w0 to w1, cut to `shapes` ({ outer, holes } in the axis's camera
 * coordinates). Options as for extrude (chamfer, chamferBottom, top, bottom).
 */
export function plate(geo, axis, shapes, w0, w1, opts = {}) {
  const local = new Geo();
  const converted = [].concat(shapes).map(({ outer, holes = [] }) => ({ outer: toLocal(axis, outer), holes: holes.map((h) => toLocal(axis, h)) }));
  extrude(local, local, converted, Math.min(w0, w1), Math.max(w0, w1), { crease: 35, ...opts });
  return put(geo, local, axis);
}

/** A rectangle [a0, a1] × [b0, b1] as a loop, rounded at the corners by `round`. */
export function rect([a0, a1], [b0, b1], round = 0) {
  if (!round) return [[a0, b0], [a1, b0], [a1, b1], [a0, b1]];
  const pts = [];
  const corners = [[a1 - round, b0 + round, -90], [a1 - round, b1 - round, 0], [a0 + round, b1 - round, 90], [a0 + round, b0 + round, 180]];
  for (const [cx, cy, start] of corners) {
    for (let i = 0; i <= 6; i++) {
      const a = ((start + i * 15) * Math.PI) / 180;
      pts.push([cx + round * Math.cos(a), cy + round * Math.sin(a)]);
    }
  }
  return pts;
}

/** A box between corners, with bevelled vertical edges if `round`. */
export function box(geo, [x0, x1], [y0, y1], [z0, z1], { round = 0, chamfer = 0, axis = 'y' } = {}) {
  if (axis === 'y') return plate(geo, 'y', { outer: rect([x0, x1], [z0, z1], round) }, y0, y1, { chamfer, chamferBottom: chamfer });
  if (axis === 'z') return plate(geo, 'z', { outer: rect([x0, x1], [y0, y1], round) }, z0, z1, { chamfer, chamferBottom: chamfer });
  return plate(geo, 'x', { outer: rect([z0, z1], [y0, y1], round) }, x0, x1, { chamfer, chamferBottom: chamfer });
}

/** A loop with its points reversed, as a hole. */
export const hole = (loop) => cw(loop);

/** A circle of radius r at (a, b) in the axis's camera coordinates. */
export const ring = (r, a = 0, b = 0, segments) => circle(r, a, b, segments ?? Math.max(24, Math.ceil(r * 24)));

/**
 * A turned part along `axis` (x, y or z) through the point `at` (camera mm): `stations` are
 * [radius, position along the axis] as for turned(), the position measured in camera
 * coordinates along that axis.
 */
export function shaft(geo, axis, at, stations, { bore = 0, segments = 32 } = {}) {
  const local = new Geo();
  turned(local, stations, { bore, segments });
  const offset = [...at];
  offset['xyz'.indexOf(axis)] = 0;
  return put(geo, local, axis, offset);
}

/** A lathe profile ([r, position along the axis]) revolved about an axis line through `at`. */
export function revolve(geo, axis, at, profile, { segments = 48, crease = 40, start, length } = {}) {
  const local = new Geo();
  lathe(local, profile, { segments, crease, start, length });
  const offset = [...at];
  offset['xyz'.indexOf(axis)] = 0;
  return put(geo, local, axis, offset);
}

/**
 * A spur gear on an axis through `at`, between w0 and w1 along it. `phase` turns tooth 0 (in
 * the local frame); see localCentre for meshing.
 */
export function spur(geo, axis, at, { teeth, module, phase = 0, bore = 0, hub = 0 }, w0, w1) {
  const g = gear({ teeth, module, phase });
  const local = new Geo();
  const holes = bore ? [cw(circle(bore, 0, 0, 24))] : [];
  extrude(local, local, { outer: g.outline, holes }, Math.min(w0, w1), Math.max(w0, w1), { crease: 30, chamfer: Math.min(0.08, module * 0.2), chamferBottom: Math.min(0.08, module * 0.2) });
  if (hub) turned(local, [[hub, Math.min(w0, w1) - 0.3], [hub, Math.max(w0, w1) + 0.3]], { bore, segments: 24 });
  const offset = [...at];
  offset['xyz'.indexOf(axis)] = 0;
  put(geo, local, axis, offset);
  return g;
}

/** Where a camera-frame point on a plane across `axis` lands in that axis's local (u, v): for meshing gears. */
export function localCentre(axis, at) {
  const [x, y, z] = at;
  return axis === 'y' ? FRAMES.y.local([x, z]) : axis === 'z' ? [x, y] : FRAMES.x.local([z, y]);
}
