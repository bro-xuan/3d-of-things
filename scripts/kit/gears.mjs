// 2D outlines for watch parts: wheel and pinion teeth, the escape wheel's club
// teeth, and the windows that lighten a wheel. Millimetres, anticlockwise.
import { circle, contours, cw, sd } from './geometry.mjs';

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

/**
 * Teeth in the style of watch gearing: radial flanks below the pitch circle and
 * rounded (pinion) or slightly pointed (wheel) tips above it. Tooth 0 is centred on
 * `phase` (radians). Wheel tips reach into pinion spaces and vice versa without touching.
 */
export function gear({ teeth, module: m, kind = 'wheel', phase = 0, tipSamples = teeth > 30 ? 4 : 6 }) {
  const wheel = kind === 'wheel';
  const R = (m * teeth) / 2;
  const pitch = TAU / teeth;
  const thickness = (wheel ? 0.5 : 0.4) * Math.PI * m; // arc length at the pitch circle
  const addendum = wheel ? 1.3 * m : thickness / 2;
  const dedendum = wheel ? 1.45 * m : 1.75 * m;
  const root = R - dedendum;
  const halfAngle = thickness / 2 / R;
  const pointed = wheel ? 0.8 : 1;
  const pts = [];
  for (let k = 0; k < teeth; k++) {
    const c = phase + k * pitch;
    // Root, leading into this tooth.
    const prevRight = c - pitch + halfAngle;
    pts.push(polar(root, prevRight + (c - halfAngle - prevRight) * 0.5));
    // Up the left flank, round the tip, down the right flank.
    pts.push(polar(root, c - halfAngle));
    for (let i = 0; i <= tipSamples; i++) {
      const phi = (i / tipSamples) * (Math.PI / 2);
      const r = R + addendum * Math.sin(phi);
      const w = (thickness / 2) * Math.cos(phi) ** pointed;
      if (i === tipSamples) pts.push(polar(r, c));
      else pts.push(polar(r, c - w / r));
    }
    for (let i = tipSamples - 1; i >= 0; i--) {
      const phi = (i / tipSamples) * (Math.PI / 2);
      const r = R + addendum * Math.sin(phi);
      const w = (thickness / 2) * Math.cos(phi) ** pointed;
      pts.push(polar(r, c + w / r));
    }
    pts.push(polar(root, c + halfAngle));
  }
  return { outline: pts, pitchRadius: R, tipRadius: R + addendum, rootRadius: root };
}

/**
 * A Swiss lever escape wheel: fifteen club teeth leaning the way the wheel turns
 * (anticlockwise here). Tooth 0's locking corner sits at `phase`.
 */
export function escapeWheel({ teeth = 15, tip = 3.6, root = 2.72, phase = 0 }) {
  const pitch = TAU / teeth;
  const pts = [];
  for (let k = 0; k < teeth; k++) {
    const c = phase + k * pitch; // locking corner
    const back = [
      [root, c - 16 * DEG],
      [root + 0.2, c - 14.2 * DEG],
      [root + 0.42, c - 11.6 * DEG],
      [root + 0.6, c - 8.6 * DEG],
      [tip - 0.2, c - 5.4 * DEG], // heel of the club
    ];
    const club = [
      [tip - 0.13, c - 3.5 * DEG],
      [tip - 0.05, c - 1.6 * DEG],
      [tip, c],
    ];
    const lockingFace = [
      [tip - 0.32, c - 1.4 * DEG],
      [root + 0.25, c - 3.3 * DEG],
      [root, c - 4 * DEG],
    ];
    const space = [[root, c + 2 * DEG]];
    for (const [r, a] of [...back, ...club, ...lockingFace, ...space]) pts.push(polar(r, a));
  }
  return { outline: pts, tipRadius: tip, rootRadius: root };
}

/** SDF of the windows between the spokes of a wheel: negative inside a window. */
export function windows({ rim, hub, spokes, width, phase = 0, fillet = 0.22, curve = 0 }) {
  const arms = Array.from({ length: spokes }, (_, k) => {
    const a = phase + (k * TAU) / spokes;
    if (!curve) return sd.capsule([0, 0], polar(rim + 1, a), width / 2);
    // A gently swept spoke: two capsules meeting at a bend.
    const mid = polar((hub + rim) / 2, a + curve);
    return sd.smooth(0.3, sd.capsule(polar(hub * 0.5, a), mid, width / 2), sd.capsule(mid, polar(rim + 1, a), width / 2));
  });
  const body = sd.smooth(fillet, sd.circle([0, 0], hub), ...arms);
  return sd.smoothSubtract(fillet, sd.circle([0, 0], rim), body);
}

/** Holes (clockwise loops) for a wheel: its windows plus the arbor hole. */
export function wheelHoles({ rim, hub, spokes, width, phase = 0, fillet, curve, bore = 0, cell = 0.03 }) {
  const holes = [];
  if (spokes) {
    const sdf = windows({ rim, hub, spokes, width, phase, fillet, curve });
    for (const shape of contours(sdf, { min: [-rim - 0.2, -rim - 0.2], max: [rim + 0.2, rim + 0.2] }, cell, Math.max(0.04, rim / 70))) {
      holes.push(cw(shape.outer));
    }
  }
  if (bore) holes.push(cw(circle(bore)));
  return holes;
}

export function polar(r, a) {
  return [r * Math.cos(a), r * Math.sin(a)];
}
