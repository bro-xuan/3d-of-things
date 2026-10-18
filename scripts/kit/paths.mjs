// Paths for hoses, cables and belts: a smooth curve through a few points, and the loop a belt
// makes round two pulleys. Millimetres; feed them to shapes.tube or geometry.ribbon.

/** A smooth path through `points` (3D), as centripetal Catmull–Rom segments of `steps` points each. */
export function smoothPath(points, { steps = 10 } = {}) {
  if (points.length < 3) return points.map((p) => [...p]);
  const P = [points[0].map((v, i) => 2 * v - points[1][i]), ...points, points.at(-1).map((v, i) => 2 * v - points.at(-2)[i])];
  const out = [];
  const dist = (a, b) => Math.max(1e-6, Math.hypot(...a.map((v, i) => v - b[i])) ** 0.5);
  for (let k = 1; k < P.length - 2; k++) {
    const [p0, p1, p2, p3] = [P[k - 1], P[k], P[k + 1], P[k + 2]];
    const t1 = dist(p0, p1);
    const t2 = t1 + dist(p1, p2);
    const t3 = t2 + dist(p2, p3);
    for (let s = 0; s < steps; s++) {
      const t = t1 + ((t2 - t1) * s) / steps;
      const lerp = (a, b, ta, tb) => a.map((v, i) => ((tb - t) / (tb - ta)) * v + ((t - ta) / (tb - ta)) * b[i]);
      const a1 = lerp(p0, p1, 0, t1);
      const a2 = lerp(p1, p2, t1, t2);
      const a3 = lerp(p2, p3, t2, t3);
      const b1 = lerp(a1, a2, 0, t2);
      const b2 = lerp(a2, a3, t1, t3);
      out.push(lerp(b1, b2, t1, t2));
    }
  }
  out.push([...points.at(-1)]);
  return out;
}

/**
 * The centreline of a belt round two pulleys in one plane, as a closed loop of 2D points: straight runs
 * on the outer tangents and arcs round each pulley. `a` and `b` are { center: [u, v], r } (the radius
 * the belt's centreline runs at). Returns { path, length }.
 */
export function beltPath(a, b, { samples = 48 } = {}) {
  const [dx, dy] = [b.center[0] - a.center[0], b.center[1] - a.center[1]];
  const d = Math.hypot(dx, dy);
  const base = Math.atan2(dy, dx);
  // Outer tangents: the belt leaves each pulley at the angle base ± (90° + asin((ra − rb) / d)).
  const phi = Math.acos((a.r - b.r) / d);
  const arc = (c, r, from, to) => {
    const n = Math.max(2, Math.round((Math.abs(to - from) / (2 * Math.PI)) * samples));
    return Array.from({ length: n + 1 }, (_, i) => {
      const t = from + ((to - from) * i) / n;
      return [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)];
    });
  };
  // Round the big pulley the long way (2π − 2φ), round the small one the short way (2φ).
  const aArc = arc(a.center, a.r, base + phi, base + 2 * Math.PI - phi);
  const bArc = arc(b.center, b.r, base - phi, base + phi);
  const path = [...aArc, ...bArc, aArc[0]];
  let length = 0;
  for (let i = 1; i < path.length; i++) length += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
  return { path, length };
}
