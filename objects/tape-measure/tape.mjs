// The tape measure's numbers and the paths its blade and spring lie along, for the build. Millimetres in the
// Poly Haven model's frame: x across the case (the drum's axis), y up, z out of the mouth. A path point is
// (y, z) and an angle runs from +z towards +y. These are the same sums as src/viewer/tapemeasure.ts, which
// bends the meshes as the blade comes out: keep the two in step.
import { Geo } from '../../scripts/kit/geometry.mjs';

const TAU = Math.PI * 2;

/** From the truth sheet (TRUTH.md, section 4) and the model's case. */
export const L = {
  /** The drum's axis, (y, z): where the belt clip's screw goes into the case. */
  centre: [38.05, -2.7],
  blade: {
    /** 3 m graduated, plus what runs from the hook's end to the zero (none: the zero is the hook) and the tail that
     *  stays wound on the hub. */
    graduated: 3000,
    width: 19,
    thickness: 0.13,
    /** Radius of the curve across its width. */
    cup: 22,
    /** What a turn adds to the roll: the steel and its lacquer, wound flat. */
    pitch: 0.15,
    /** Radius of its innermost turn, on the drum's hub. */
    hub: 22,
    /** Where it leaves its guide in the mouth, (y, z), and its end under the hook with the blade home. */
    throat: [11.35, 10],
    tip: 38.9,
    /** The case's front, where it starts standing out unsupported. */
    front: 38,
    /** The maker's standout for a 19 mm blade, and where it folds past it (mm past the front, how far the rest drops). */
    standout: 1600,
    fold: [45, 1.15],
    /** The end of the blade under the hook is riveted flat. */
    flat: 22,
    /** Arc length between the blade's cross-sections, mm. */
    step: 1.6,
  },
  spring: {
    post: 5,
    thickness: 0.13,
    /** Where the coils lie packed: the steel and a film of grease. */
    pitch: 0.15,
    width: 16,
    /** Turns wound into it past its free shape with the blade home, so it still pulls the hook in. */
    preload: 12,
    /** The free coil between the packs. */
    loose: 1,
    modulus: 206000,
    step: 1.4,
    /** The angle of its inner end on the post. */
    start: Math.PI * 0.75,
  },
  hook: {
    thickness: 0.9,
    width: 19.8,
    /** Its leg along the blade (z) and its lip down the front, from the source model. */
    leg: [20.7, 39.1],
    lip: [3.4, 12.35],
    /** The blade's end lies this far behind the hook's outside face, the true zero (lip 0.9 mm and a 0.2 mm gap). */
    zero: 1.1,
    /** Rivet centres along the blade, their shanks' radius and their heads'. */
    rivets: [24.2, 33.2],
    shank: 1.2,
    head: 2.1,
  },
  drum: {
    /** The hub's wall, inside the blade's first turn; its inside is the spring's barrel. */
    wall: 2.1,
    /** Faces across x: the closed side (with its flange) on the right half's side, and the open side's lip on the
     *  label's side, where the spring goes in. */
    closed: [10.4, 11.4],
    open: [-11.2, -10.4],
    flange: 26.2,
    bore: 5.35,
  },
  case: { wall: 2.0, inside: 15.6 },
};

// ------------------------------------------------------------------ layouts (the viewer reads these from the nodes)

export function bladeLayout(spring) {
  const b = L.blade;
  const length = b.graduated + (b.tip - b.throat[1]) + TAU * b.hub + 60;
  return {
    kind: 'tape-blade',
    centre: L.centre,
    hub: b.hub,
    pitch: b.pitch,
    length,
    throat: b.throat,
    tip: b.tip,
    front: b.front,
    width: b.width,
    thickness: b.thickness,
    cup: b.cup,
    standout: b.standout,
    fold: b.fold,
    flat: b.flat,
    spring,
    hook: L.hook.thickness,
    uSpan: length,
    fSpan: b.thickness / 2,
    x0: 0,
  };
}

/** The blade's turns on the drum from home to all the way out, so the spring can be made long enough. */
export function bladeTurns() {
  const layout = bladeLayout(null);
  return (bladePath(layout, maxOut(layout)).drum - bladePath(layout, 0).drum) / TAU;
}

/** The spring: as long as fills half its barrel (the most turns a spiral spring can give), with the blade home
 *  wound `preload` turns past free. */
export function springLayout() {
  const s = L.spring;
  const post = s.post;
  const wall = L.blade.hub - L.blade.thickness / 2 - 0.05 - L.drum.wall;
  const length = Math.round((Math.PI * (wall * wall - post * post)) / (2 * s.pitch));
  const base = { kind: 'tape-spring', centre: L.centre, post, wall, thickness: s.thickness, pitch: s.pitch, width: s.width, length, start: s.start, loose: s.loose, preload: s.preload, modulus: s.modulus, uSpan: length, fSpan: s.thickness / 2, x0: 0 };
  // The turns from end to end with the blade home: a turn and a half packed on the post.
  let lo = 1;
  let hi = 400;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (springShare({ ...base, turns: mid }, 0).inner < 1.5) lo = mid;
    else hi = mid;
  }
  return { ...base, turns: +((lo + hi) / 2).toFixed(4) };
}

// ------------------------------------------------------------------ paths (as src/viewer/tapemeasure.ts)

export function bladePath(b, out) {
  const k = b.pitch / TAU;
  const spiralAngle = (w) => (Math.sqrt(b.hub * b.hub + 2 * k * Math.max(0, w)) - b.hub) / k;
  const [cy, cz] = b.centre;
  const [ty, tz] = b.throat;
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
  const unsupported = b.tip + out - b.front;
  const folds = unsupported > b.standout;
  const foldZ = b.front + b.fold[0];
  const [fs, fc] = [Math.sin(b.fold[1]), Math.cos(b.fold[1])];
  const at = (u, o) => {
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
      o[2] = dir[1];
      o[3] = -dir[0];
      o[4] = 0;
    } else {
      const theta = spiralAngle(b.length - u);
      const phi = phiT - (turned - theta);
      const r = b.hub + k * theta;
      o[0] = cy + r * Math.sin(phi);
      o[1] = cz + r * Math.cos(phi);
      o[2] = -Math.sin(phi);
      o[3] = -Math.cos(phi);
      o[4] = 0;
    }
    return o;
  };
  return { at, drum: phiT - turned, roll: rho, turnsOn: turned / TAU, folds, touchPoint: T };
}

/** How much of its curve the blade has at z (straight run) and u from its end: flat on the roll and in the mouth's
 *  guide, curving to its full depth by the case's front; flat where the hook is riveted. */
export function cupAt(b, z, u) {
  const clamp = (t) => Math.min(1, Math.max(0, t));
  return clamp((z - b.throat[1]) / (b.front - b.throat[1])) * clamp((u - b.flat) / 12);
}

export function maxOut(b) {
  return b.length - (b.tip - b.throat[1]) - TAU * b.hub - 40;
}

export function springShare(s, wound) {
  const a = s.post + s.pitch / 2;
  const b = s.wall - s.pitch / 2;
  const p = s.pitch;
  const total = s.turns + wound;
  const length = (inner) => {
    const outer = total - s.loose - inner;
    const r1 = a + p * inner;
    const r2 = b - p * outer;
    return TAU * a * inner + Math.PI * p * inner * inner + Math.PI * s.loose * (r1 + r2) + TAU * r2 * outer + Math.PI * p * outer * outer;
  };
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

export function springPath(s, wound) {
  const { inner, outer, r1, r2, a } = springShare(s, wound);
  const p = s.pitch;
  const [cy, cz] = s.centre;
  const L1 = TAU * a * inner + Math.PI * p * inner * inner;
  const L2 = L1 + Math.PI * s.loose * (r1 + r2);
  const turnsFor = (r0, l) => (Math.sqrt(r0 * r0 + (p * l) / Math.PI) - r0) / p;
  const at = (u, o) => {
    let m;
    let r;
    let slope;
    if (u <= L1) {
      m = turnsFor(a, u);
      r = a + p * m;
      slope = p / TAU;
    } else if (u <= L2) {
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
    const tY = slope * sn + r * cs;
    const tZ = slope * cs - r * sn;
    const n = Math.hypot(tY, tZ) || 1;
    o[2] = -tZ / n;
    o[3] = tY / n;
    o[4] = 0;
    return o;
  };
  return { at, inner, outer, end: s.start + TAU * (inner + s.loose + outer) };
}

/** The spring's torque, N·mm, `wound` turns past home (E·b·t³·θ / 12L, θ from its free shape). */
export function springTorque(s, wound) {
  return (s.modulus * s.width * s.thickness ** 3 * TAU * (s.preload + wound)) / (12 * s.length);
}

// ------------------------------------------------------------------ meshes

const cupLift = (layout, x) => {
  if (layout.kind !== 'tape-blade') return 0;
  const d = Math.min(Math.abs(x - (layout.x0 ?? 0)), layout.cup * 0.99);
  return layout.cup - Math.sqrt(layout.cup * layout.cup - d * d);
};
const cupSlope = (layout, x) => {
  if (layout.kind !== 'tape-blade') return 0;
  const d = x - (layout.x0 ?? 0);
  return d / Math.sqrt(layout.cup * layout.cup - d * d);
};

/**
 * A strip of steel along `at` at rest, from arc length `from` to `to`: cross-sections every `step`, faces across x at `xs` on its two
 * sides (offset ±thickness/2, plus the blade's curve), and its two edges. Returns the Geo and its _CLOTH values
 * (arc length / uSpan, offset across the thickness packed into 0..1), which the viewer bends it by
 * (src/viewer/strip.ts). `uv(u, x, side)` maps the texture: side 1 on the top face, -1 on the back, 0 on the edges.
 */
export function stripGeo(layout, at, { step, xs, uv = () => [0, 0], from = 0, to = layout.uSpan }) {
  const geo = new Geo();
  const values = [];
  const o = [0, 0, 0, 0, 0];
  const n = Math.ceil((to - from) / step);
  const half = layout.fSpan;
  const rows = [];
  for (let i = 0; i <= n; i++) {
    const u = Math.min(to, from + i * step);
    at(u, o);
    const [py, pz, ny, nz, k] = o;
    const row = { top: [], bottom: [], edges: [] };
    for (const side of [1, -1]) {
      for (const x of xs) {
        const off = side * half + cupLift(layout, x) * k;
        const c = k * cupSlope(layout, x);
        const len = Math.hypot(1, c);
        const normal = [(-side * c) / len, (side * ny) / len, (side * nz) / len];
        const index = geo.vertex([x, py + ny * off, pz + nz * off], normal, uv(u, x, side));
        values.push(u / layout.uSpan, (side + 1) / 2);
        (side > 0 ? row.top : row.bottom).push(index);
      }
    }
    for (const [x, sx] of [[xs[0], -1], [xs[xs.length - 1], 1]]) {
      for (const side of [1, -1]) {
        const off = side * half + cupLift(layout, x) * k;
        const index = geo.vertex([x, py + ny * off, pz + nz * off], [sx, 0, 0], uv(u, x, 0));
        values.push(u / layout.uSpan, (side + 1) / 2);
        row.edges.push(index);
      }
    }
    rows.push(row);
  }
  for (let i = 0; i < n; i++) {
    const [r0, r1] = [rows[i], rows[i + 1]];
    for (let j = 0; j < xs.length - 1; j++) {
      geo.indices.push(r0.top[j], r0.top[j + 1], r1.top[j + 1], r0.top[j], r1.top[j + 1], r1.top[j]);
      geo.indices.push(r0.bottom[j], r1.bottom[j + 1], r0.bottom[j + 1], r0.bottom[j], r1.bottom[j], r1.bottom[j + 1]);
    }
    // Edges: [x-: top, bottom], [x+: top, bottom].
    geo.indices.push(r0.edges[0], r1.edges[1], r0.edges[1], r0.edges[0], r1.edges[0], r1.edges[1]);
    geo.indices.push(r0.edges[2], r0.edges[3], r1.edges[3], r0.edges[2], r1.edges[3], r1.edges[2]);
  }
  fixWinding(geo);
  return { geo, values };
}

/** Turns each triangle to face the way its first vertex's normal points (the strip's sides wind both ways). */
function fixWinding(geo) {
  const P = geo.positions;
  const N = geo.normals;
  for (let t = 0; t < geo.indices.length; t += 3) {
    const [a, b, c] = geo.indices.slice(t, t + 3);
    const u = [0, 1, 2].map((k) => P[b * 3 + k] - P[a * 3 + k]);
    const v = [0, 1, 2].map((k) => P[c * 3 + k] - P[a * 3 + k]);
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const m = [0, 1, 2].map((k) => N[a * 3 + k] + N[b * 3 + k] + N[c * 3 + k]);
    if (n[0] * m[0] + n[1] * m[1] + n[2] * m[2] < 0) [geo.indices[t + 1], geo.indices[t + 2]] = [c, b];
  }
}
