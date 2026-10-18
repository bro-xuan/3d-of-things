// Opens up the Poly Haven case. Its body is one closed shell, so the back, the dial
// and the crown are cut out along existing edge loops, and the surfaces a closed
// shell never needed (the inside of the case and back, the back of the dial) are
// turned from the case's own profile.
import { Geo, cylinder, lathe } from '../../scripts/kit/geometry.mjs';

/** Model-space limits of the cuts, read off the mesh (see the content README notes). */
const DIAL_RADIUS = 0.396; // the chapter ring ends on a loop at r = 0.394; the bezel starts at 0.408
const BACK_Z = -0.0435; // the band's lowest loop is at z = -0.044
const WALL = 0.6; // mm, thickness given to the new inner surfaces

/**
 * @param shell { positions: model-space [x,y,z][], indices, uvs } of the body primitive
 * @returns triangle index lists for each piece, plus profiles for the new surfaces (model space)
 */
export function cutCase(shell, axis) {
  const { positions: P, indices: I } = shell;
  const r = (p) => Math.hypot(p[0] - axis[0], p[1] - axis[1]);
  // Islands, welding coincident vertices.
  const key = new Map();
  const rep = P.map((p, i) => {
    const k = p.map((v) => Math.round(v * 1e5)).join();
    if (!key.has(k)) key.set(k, i);
    return key.get(k);
  });
  const parent = P.map((_, i) => i);
  const find = (i) => {
    while (parent[i] !== i) i = parent[i] = parent[parent[i]];
    return i;
  };
  for (let t = 0; t < I.length; t += 3) {
    const [a, b, c] = [I[t], I[t + 1], I[t + 2]].map((v) => find(rep[v]));
    parent[a] = b;
    parent[find(c)] = find(b);
  }
  const islands = new Map();
  for (let t = 0; t < I.length / 3; t++) {
    const id = find(rep[I[t * 3]]);
    if (!islands.has(id)) islands.set(id, { tris: [], min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] });
    const island = islands.get(id);
    island.tris.push(t);
    for (let k = 0; k < 3; k++) {
      const p = P[I[t * 3 + k]];
      for (let d = 0; d < 3; d++) {
        island.min[d] = Math.min(island.min[d], p[d]);
        island.max[d] = Math.max(island.max[d], p[d]);
      }
    }
  }
  const list = [...islands.values()].sort((a, b) => b.tris.length - a.tris.length);
  const body = list[0];
  // The crown: the knurled cylinder above the pendant, deep in z (the bow ring is flat).
  const crown = list.find((s) => s !== body && s.min[1] > 1.3 && s.max[2] - s.min[2] > 0.1 && s.max[0] - s.min[0] < 0.2);
  if (!crown) throw new Error('watch case: crown island not found');

  const pieces = { case: [], back: [], dial: [], crown: crown.tris };
  for (const s of list) {
    if (s === crown) continue;
    if (s !== body) {
      pieces.case.push(...s.tris);
      continue;
    }
    for (const t of s.tris) {
      const v = [0, 1, 2].map((k) => P[I[t * 3 + k]]);
      if (v.every((p) => p[2] > 0.03 && r(p) <= DIAL_RADIUS)) pieces.dial.push(t);
      else if (v.every((p) => p[2] <= BACK_Z)) pieces.back.push(t);
      else pieces.case.push(t);
    }
  }

  // Outer profiles, as the highest (front) and lowest (back) point in each ring of radius.
  const bins = new Map();
  for (const p of P) {
    if (p[1] > 1.21) continue;
    const k = Math.round(r(p) / 0.004);
    const b = bins.get(k) ?? { front: -Infinity, back: Infinity };
    if (p[2] > 0.03) b.front = Math.max(b.front, p[2]);
    if (p[2] < BACK_Z + 0.001) b.back = Math.min(b.back, p[2]);
    bins.set(k, b);
  }
  const profile = (which, from, to) =>
    [...bins.entries()]
      .map(([k, b]) => [k * 0.004, b[which]])
      .filter(([rr, z]) => rr >= from && rr <= to && Number.isFinite(z))
      .sort((a, b) => a[0] - b[0]);
  const bandOuter = Math.max(...P.filter((p) => Math.abs(p[2] - BACK_Z) < 0.002 && p[1] < 1.1).map(r));
  return {
    pieces,
    crownCentre: crown.min.map((v, d) => (v + crown.max[d]) / 2),
    front: profile('front', DIAL_RADIUS - 0.004, 0.575),
    back: profile('back', 0, 0.6),
    bandOuter,
    dialRadius: 0.394,
    backZ: BACK_Z,
  };
}

/** Smooths a profile by averaging neighbours, keeping the ends. */
function smooth(points, passes = 2) {
  let pts = points;
  for (let n = 0; n < passes; n++) pts = pts.map((p, i) => (i === 0 || i === pts.length - 1 ? p : [p[0], (pts[i - 1][1] + p[1] + pts[i + 1][1]) / 3]));
  return pts;
}

/**
 * The new surfaces, in the movement frame (mm). `toFrame` maps a model-space [r, z]
 * (radius from the hands' axis, z) to frame [r, z].
 */
export function caseSurfaces(cut, toFrame, { plateFront }) {
  const front = smooth(cut.front.map(toFrame));
  const back = smooth(cut.back.map(toFrame));
  const [rDial] = toFrame([cut.dialRadius, 0]);
  const [rBand, zCut] = toFrame([0.574, cut.backZ]);
  const [rOuter] = toFrame([cut.bandOuter, cut.backZ]);
  const zFrontAt = (rr) => interpolate(front, rr);
  const zBackAt = (rr) => interpolate(back, rr);

  // Inside of the case: the dial opening's wall, under the bezel, down the band, and the rim the back sits on.
  const inside = new Geo();
  const under = [];
  for (let rr = rDial; rr < rBand - 0.6; rr += 0.9) under.push([rr, zFrontAt(rr) - WALL]);
  const zTop = Math.min(zFrontAt(rBand - 0.6) - WALL, under[under.length - 1][1]);
  lathe(inside, [[rDial, zFrontAt(rDial)], ...under, [rBand, zTop - 0.4], [rBand, zCut], [rOuter, zCut]], { segments: 120, crease: 30 });

  // Inside of the back: its rim, a short wall, then the dome.
  const backInside = new Geo();
  const dome = [];
  for (let rr = rBand - 0.5; rr > 0.4; rr -= 1.2) dome.push([rr, zBackAt(rr) + WALL]);
  lathe(backInside, [[rOuter, zCut], [rBand, zCut], [rBand, Math.min(zCut - 0.2, zBackAt(rBand) + WALL)], ...dome, [0, zBackAt(0) + WALL]], { segments: 120, crease: 30 });

  // Back of the dial: a plate with a wall up to the chapter ring's edge, and two feet.
  const dialBack = new Geo();
  lathe(dialBack, [[0, 0], [rDial, 0], [rDial, zFrontAt(rDial)]], { segments: 120, crease: 30 });
  for (const a of [70, 250]) {
    const foot = new Geo();
    cylinder(foot, 0.35, plateFront, 0, { segments: 16 });
    dialBack.append(foot, (p, n) => [[p[0] + 17 * Math.cos((a * Math.PI) / 180), p[1] + 17 * Math.sin((a * Math.PI) / 180), p[2]], n]);
  }
  return { inside, backInside, dialBack, rDial, rBand, zCut, zFrontAt, zBackAt };
}

function interpolate(points, x) {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    if (x <= points[i][0]) {
      const [x0, y0] = points[i - 1];
      const [x1, y1] = points[i];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0 || 1);
    }
  }
  return points[points.length - 1][1];
}
