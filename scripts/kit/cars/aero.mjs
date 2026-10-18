// The 2026 Roadster's suction fans and cold-gas thrusters, and what feeds them: skirts round the sealed
// floor, the duct from an inlet in the floor between the rear wheels up to four fans in the tail (as in
// Tesla's "Electric Fan Car" patent), the carbon air tanks, the compressor that fills them, the valve
// block and the lines out to ten nozzles. Car frame as in body.mjs (mm; z forward, x left, y up).
import { Geo, alongAxis, lathe } from '../geometry.mjs';
import { box, plate, put, ring, rect, shaft } from '../solids.mjs';
import { Part } from '../parts.mjs';
import { roundedBox, tube } from '../shapes.mjs';

const TAU = Math.PI * 2;
const add = (a, b) => a.map((v, i) => v + b[i]);
const scale = (a, s) => a.map((v) => v * s);

/** Six faces through eight corners (bottom four, then the top four above them), each face flat-shaded. */
function hexa(geo, [a, b, c, d, e, f, g, h]) {
  const face = (p, q, r, s) => {
    const u = q.map((v, i) => v - p[i]);
    const w = s.map((v, i) => v - p[i]);
    const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    const l = Math.hypot(...n) || 1;
    const nn = n.map((v) => v / l);
    const ids = [p, q, r, s].map((x) => geo.vertex(x, nn));
    geo.quad(...ids);
  };
  face(a, d, c, b);
  face(e, f, g, h);
  face(a, b, f, e);
  face(b, c, g, f);
  face(c, d, h, g);
  face(d, a, e, h);
  return geo;
}

/**
 * A fan's rotor on its own axis (local z, blowing toward -z): a spinner and `blades` thin blades,
 * twisted from steep at the root to flat at the tip, as an axial fan's are.
 */
function fanRotor({ r, blades, hub = r * 0.36 }) {
  const geo = new Geo();
  lathe(geo, [[0, -26], [hub, -26], [hub, 16], [hub * 0.62, 34], [0, 40]], { segments: 40 });
  for (let k = 0; k < blades; k++) {
    const a0 = (k / blades) * TAU;
    const rings = [];
    const steps = 8;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const rho = hub - 4 + (r - 4 - (hub - 4)) * t;
      const beta = (58 - 30 * t) * (Math.PI / 180);
      const chord = 52 - 14 * t;
      // A little sweep back toward the tip.
      const a = a0 + 0.18 * t * t;
      const radial = [Math.cos(a), Math.sin(a), 0];
      const tang = [-Math.sin(a), Math.cos(a), 0];
      const along = add(scale(tang, Math.cos(beta)), [0, 0, Math.sin(beta)]);
      const across = add(scale(tang, -Math.sin(beta)), [0, 0, Math.cos(beta)]);
      const c = scale(radial, rho);
      const th = 2.4 - 1.2 * t;
      rings.push([add(add(c, scale(along, chord / 2)), scale(across, th)), add(add(c, scale(along, -chord / 2)), scale(across, th)), add(add(c, scale(along, -chord / 2)), scale(across, -th)), add(add(c, scale(along, chord / 2)), scale(across, -th))]);
    }
    for (let s = 0; s < steps; s++) hexa(geo, [...rings[s], ...rings[s + 1]]);
  }
  return geo;
}

/** A pressure vessel along local z: a cylinder of radius r with round domes, `length` long overall, and a boss at each pole. */
function vessel(r, length) {
  const geo = new Geo();
  const half = length / 2;
  const prof = [[0, -half - 34], [34, -half - 34], [34, -half + 6]];
  // The domes in even steps of angle, the straight between them in even steps of length, so the winding's
  // texture runs evenly over both.
  for (let i = 0; i <= 10; i++) {
    const a = (Math.PI / 2) * (i / 10);
    const rr = Math.max(36, r * Math.sin(a));
    prof.push([rr, -half + r - r * Math.cos(a)]);
  }
  for (let i = 1; i < 8; i++) prof.push([r, -half + r + ((length - 2 * r) * i) / 8]);
  for (let i = 10; i >= 0; i--) {
    const a = (Math.PI / 2) * (i / 10);
    const rr = Math.max(36, r * Math.sin(a));
    prof.push([rr, half - r + r * Math.cos(a)]);
  }
  prof.push([34, half - 6], [34, half + 34], [0, half + 34]);
  lathe(geo, prof, { segments: 64, crease: 50 });
  // UVs: round the tank, and along it by length, so the winding's stripes keep their pitch.
  for (let v = 0; v < geo.vertexCount; v++) geo.uvs[v * 2 + 1] = (geo.positions[v * 3 + 2] + half) / 400;
  return geo;
}

/**
 * A cold-gas nozzle on its own axis (local z), the jet leaving along +z from its exit at z = 0: the
 * chamber, a throat narrowing to a third of it, then the bell widening to the exit (a de Laval nozzle).
 */
export const NOZZLE = { chamber: 38, throat: 15, exit: 52, length: 262 };
function nozzle() {
  const { chamber: rc, throat: rt, exit: re, length: L } = NOZZLE;
  const outer = [
    [0, -L],
    [rc, -L],
    [rc + 3, -L + 6],
    [rc + 3, -L + 70],
    [rc - 4, -L + 96],
    [rt + 6, -L + 124],
    [rt + 5, -L + 134],
    [rt + 11, -L + 158],
    [rt + 22, -L + 196],
    [re - 3, -L + 238],
    [re + 4, -4],
    [re + 4, 0],
  ];
  // Back in along the inside of the bell to the throat, which closes it off.
  const inner = [
    [re, 0],
    [re - 6, -26],
    [rt + 18, -L + 196],
    [rt + 7, -L + 158],
    [rt, -L + 134],
    [0, -L + 134],
  ];
  const geo = new Geo();
  lathe(geo, [...outer, ...inner], { segments: 40, crease: 35 });
  return geo;
}

/** A tube's path with its corners rounded off (radius r), so lines bend like hoses. */
function bends(points, r = 60, steps = 5) {
  const out = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const [a, b, c] = [points[i - 1], points[i], points[i + 1]];
    const da = b.map((v, k) => v - a[k]);
    const dc = c.map((v, k) => v - b[k]);
    const la = Math.hypot(...da);
    const lc = Math.hypot(...dc);
    const rr = Math.min(r, la / 2, lc / 2);
    const p = b.map((v, k) => v - (da[k] / la) * rr);
    const q = b.map((v, k) => v + (dc[k] / lc) * rr);
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      // A quadratic Bézier through the corner.
      out.push(p.map((v, k) => (1 - t) ** 2 * v + 2 * (1 - t) * t * b[k] + t * t * q[k]));
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

export function buildAero(spec) {
  const A = spec.aero;
  const parts = [];
  const hints = { thrusters: [], fans: [], tanks: [] };

  // ------------------------------------------------------------ suction
  const fanBox = new Part('fan_box');
  const D = A.duct;
  const B = A.box;
  const F = A.fans;
  // The duct: from the inlet in the floor, back under the motors, then up into the box behind the fans.
  const ramp = -1560;
  for (const s of [-1, 1]) {
    const x0 = s * D.half;
    plate(fanBox.geo('trim'), 'x', { outer: [[D.inlet[1], 110], [D.inlet[1], D.top], [ramp, D.top], [D.z1, B.y[1]], [D.z1, 110]] }, x0 - 4, x0 + 4);
  }
  box(fanBox.geo('trim'), [-D.half, D.half], [110, 118], [D.z1, D.inlet[0]]);
  box(fanBox.geo('trim'), [-D.half, D.half], [110, D.top], [D.inlet[1] - 8, D.inlet[1]], { axis: 'z' });
  // The roof, flat under the motors, then sloping up to the top of the box.
  hexa(fanBox.geo('trim'), [
    [-D.half, D.top - 8, D.inlet[1]], [D.half, D.top - 8, D.inlet[1]], [D.half, D.top - 8, ramp], [-D.half, D.top - 8, ramp],
    [-D.half, D.top, D.inlet[1]], [D.half, D.top, D.inlet[1]], [D.half, D.top, ramp], [-D.half, D.top, ramp],
  ]);
  hexa(fanBox.geo('trim'), [
    [-D.half, D.top - 8, ramp], [D.half, D.top - 8, ramp], [D.half, B.y[1] - 8, D.z1], [-D.half, B.y[1] - 8, D.z1],
    [-D.half, D.top, ramp], [D.half, D.top, ramp], [D.half, B.y[1], D.z1], [-D.half, B.y[1], D.z1],
  ]);
  // The box: walls, top and floor round the four fans, a bulkhead where the duct comes in, and three strakes between the fans.
  for (const s of [-1, 1]) box(fanBox.geo('trim'), s > 0 ? [B.half - 8, B.half] : [-B.half, -B.half + 8], B.y, B.z, { axis: 'x' });
  box(fanBox.geo('trim'), [-B.half, B.half], [B.y[1] - 8, B.y[1]], B.z);
  box(fanBox.geo('trim'), [-B.half, B.half], [B.y[0], B.y[0] + 8], B.z);
  for (const s of [-1, 1]) box(fanBox.geo('trim'), s > 0 ? [D.half, B.half] : [-B.half, -D.half], B.y, [B.z[1] - 8, B.z[1]], { axis: 'z' });
  for (const x of [-310, 0, 310]) box(fanBox.geo('trim'), [x - 5, x + 5], [B.y[0] + 8, B.y[1] - 8], [B.z[0], F.z[1] - 10], { axis: 'x' });
  // Each fan's shroud, and behind its rotor the motor on five vanes.
  const fanZ = (F.z[0] + F.z[1]) / 2;
  for (const x of F.x) {
    shaft(fanBox.geo('trim'), 'z', [x, F.y, 0], [[F.r + 2, F.z[0]], [F.r + 2, F.z[1]]], { bore: F.r + 2 - 8, segments: 48 });
    const lip = new Geo();
    lathe(lip, [[F.r + 2, F.z[1]], [F.r + 16, F.z[1] + 10], [F.r + 16, F.z[1] + 14], [F.r + 6, F.z[1] + 14]].map(([r, z]) => [r, z]), { segments: 48 });
    put(fanBox.geo('trim'), lip, 'z', [x, F.y, 0]);
    shaft(fanBox.geo('lamination'), 'z', [x, F.y, 0], [[F.r * 0.3, F.z[0] + 4], [F.r * 0.34, fanZ - 34], [F.r * 0.3, fanZ - 30]], { segments: 32 });
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * TAU + 0.3;
      const p0 = [x + Math.cos(a) * F.r * 0.3, F.y + Math.sin(a) * F.r * 0.3];
      const p1 = [x + Math.cos(a) * (F.r + 2), F.y + Math.sin(a) * (F.r + 2)];
      tube(fanBox.geo('trim'), [[p0[0], p0[1], F.z[0] + 30], [p1[0], p1[1], F.z[0] + 30]], 5, { segments: 6 });
    }
  }
  // The frame across the tail above the fans, with the four rear nozzles through it.
  const rear = A.thrusters.filter((t) => t.group === 'rear');
  plate(fanBox.geo('trim'), 'z', { outer: rect([-B.half, B.half], [B.y[1], 600]), holes: rear.map((t) => ring(60, t.exit[0], t.exit[1], 40)) }, B.z[0], B.z[0] + 12);
  parts.push(fanBox);
  F.x.forEach((x, i) => {
    const part = new Part(`fan_${i + 1}`, { parent: 'fan_box', extras: { axis: [x, F.y, fanZ] } });
    put(part.geo('fan'), fanRotor({ r: F.r - 4, blades: F.blades }), 'z', [x, F.y, fanZ]);
    parts.push(part);
    hints.fans.push({ node: `fan_${i + 1}`, axle: [x, F.y, fanZ] });
  });

  // The skirts round the sealed floor, tucked up inside the sills until the fans run.
  const S = A.seal;
  const skirts = new Part('skirts');
  parts.push(skirts);
  const skirt = (name, xr, zr) => {
    const part = new Part(name, { parent: 'skirts' });
    box(part.geo('trim'), xr, [118, 250], zr);
    parts.push(part);
  };
  skirt('skirt_left', [S.half - 6, S.half + 6], [S.z[0] + 12, S.z[1] - 12]);
  skirt('skirt_right', [-S.half - 6, -S.half + 6], [S.z[0] + 12, S.z[1] - 12]);
  skirt('skirt_front', [-S.half - 6, S.half + 6], [S.z[1] - 12, S.z[1]]);
  skirt('skirt_rear', [-S.half - 6, S.half + 6], [S.z[0], S.z[0] + 12]);

  // ------------------------------------------------------------ air
  const tanks = new Part('air_tanks');
  parts.push(tanks);
  for (const t of A.tanks) {
    const part = new Part(t.name, { parent: 'air_tanks' });
    put(part.geo('copv'), vessel(t.r, t.length), t.axis, t.axis === 'x' ? [0, t.at[1], t.at[2]] : [t.at[0], t.at[1], 0]);
    // Moved along its axis to its place, then two straps and brackets down to the floor.
    const along = t.axis === 'x' ? 0 : 2;
    const g = part.geo('copv');
    for (let v = 0; v < g.vertexCount; v++) g.positions[v * 3 + along] += t.at[along];
    const straps = new Geo();
    for (const s of [-1, 1]) {
      const w = t.at[along] + s * (t.length / 2 - t.r - 40);
      shaft(straps, t.axis, t.at, [[t.r + 4, w - 22], [t.r + 4, w + 22]], { bore: t.r - 6, segments: 64 });
      const foot = t.at[1] - t.r - 14;
      const across = t.axis === 'x' ? [w - 22, w + 22] : [t.at[0] - t.r * 0.7, t.at[0] + t.r * 0.7];
      const lengthwise = t.axis === 'x' ? [t.at[2] - t.r * 0.7, t.at[2] + t.r * 0.7] : [w - 22, w + 22];
      box(straps, across, [foot, t.at[1] - t.r * 0.55], lengthwise);
    }
    part.geo('steel').append(straps);
    const r = t.r / 1000;
    const litres = Math.round(1000 * (Math.PI * r * r * (t.length / 1000 - 2 * r) + (4 / 3) * Math.PI * r ** 3));
    hints.tanks.push({ node: t.name, centre: t.at, litres });
    parts.push(part);
  }

  // The compressor that fills them, in the front boot: a motor driving a stack of piston stages, and its air filter.
  const C = A.compressor.at;
  const compressor = new Part('compressor');
  roundedBox(compressor.geo('casting'), [C[0] - 200, C[0] + 200], [C[1] - 120, C[1] + 70], [C[2] - 100, C[2] + 100], 24, { segments: 3 });
  shaft(compressor.geo('lamination'), 'x', [0, C[1] + 145, C[2]], [[72, C[0] - 190], [72, C[0] + 80]], { segments: 40 });
  shaft(compressor.geo('inverter'), 'x', [0, C[1] + 145, C[2]], [[76, C[0] - 200], [76, C[0] - 160]], { segments: 40 });
  // Two finned cylinders, the second stage smaller.
  for (const [dx, r, h] of [[100, 40, 120], [170, 30, 90]]) {
    shaft(compressor.geo('casting'), 'y', [C[0] + dx, 0, C[2]], [[r * 0.7, C[1] + 70], [r * 0.7, C[1] + 70 + h]], { segments: 24 });
    for (let f = 0; f < 6; f++) shaft(compressor.geo('casting'), 'y', [C[0] + dx, 0, C[2]], [[r, C[1] + 74 + f * (h / 6)], [r, C[1] + 74 + f * (h / 6) + h / 14]], { segments: 28 });
  }
  shaft(compressor.geo('rubber'), 'z', [C[0] - 120, C[1] + 20, 0], [[60, C[2] + 100], [60, C[2] + 190]], { segments: 32 });
  parts.push(compressor);

  // The valve block behind the tanks: a regulator and a valve for each group of nozzles.
  const Mf = A.manifold.at;
  const lines = new Part('air_lines');
  roundedBox(lines.geo('casting'), [Mf[0] - 60, Mf[0] + 60], [Mf[1] - 40, Mf[1] + 50], [Mf[2] - 30, Mf[2] + 30], 10, { segments: 2 });
  for (const dx of [-36, 0, 36]) shaft(lines.geo('valve'), 'y', [Mf[0] + dx, 0, Mf[2]], [[14, Mf[1] + 50], [14, Mf[1] + 92]], { segments: 18 });
  parts.push(lines);

  // ------------------------------------------------------------ thrusters
  const NZ = nozzle();
  for (const t of A.thrusters) {
    const part = new Part(t.name, { parent: 'thrusters', extras: { jet: t.jet } });
    part.geo('nozzle').append(NZ, alongAxis(t.jet, t.exit));
    // The valve upstream of the chamber, with its electric actuator on the side.
    const up = t.exit.map((v, i) => v - t.jet[i] * NOZZLE.length);
    const valve = new Geo();
    lathe(valve, [[0, -70], [30, -70], [32, -64], [32, -6], [24, 0], [0, 0]], { segments: 28 });
    part.geo('valve').append(valve, alongAxis(t.jet, up));
    const actuator = new Geo();
    roundedBox(actuator, [30, 74], [-24, 24], [-62, -14], 6, { segments: 2 });
    part.geo('inverter').append(actuator, alongAxis(t.jet, up, t.group === 'rear' ? Math.PI / 2 : 0));
    parts.push(part);
    hints.thrusters.push({ node: t.name, group: t.group, exit: t.exit, jet: t.jet, inlet: up.map((v, i) => v - t.jet[i] * 70) });
  }
  parts.push(new Part('thrusters'));

  // The lines. The two tanks are joined where they meet, the valve block sits on the main tank's back and feeds
  // the rear nozzles; the passenger tank's front end feeds the nose's; the compressor's line comes back to it.
  const R = (...pts) => tube(lines.geo('airLine'), bends(pts, 70), 9, { segments: 10 });
  const main = A.tanks[0];
  const seat = A.tanks[1];
  const seatBack = seat.at[2] - seat.length / 2 - 34;
  const seatFront = seat.at[2] + seat.length / 2 + 34;
  R([seat.at[0], seat.at[1], seatBack + 4], [seat.at[0], seat.at[1], seatBack - 40]);
  R([0, Mf[1] + 20, main.at[2] - main.r + 6], [0, Mf[1] + 20, Mf[2] + 28]);
  const into = (t) => t.inlet;
  for (const t of hints.thrusters.filter((h) => h.group === 'rear')) R([Mf[0], Mf[1] - 10, Mf[2] - 28], [0, 640, -1650], [t.inlet[0], 640, -1650], [t.inlet[0], t.inlet[1] + 60, t.inlet[2] + 30], into(t));
  for (const t of hints.thrusters.filter((h) => h.group === 'down' && h.exit[2] < 0)) R([Mf[0] + Math.sign(t.exit[0]) * 30, Mf[1] - 30, Mf[2] - 28], [Math.sign(t.exit[0]) * 30, 610, -1800], [t.inlet[0], 610, -1800], [t.inlet[0], 610, t.inlet[2]], into(t));
  // From the passenger tank's front, down under the dash and the steering rack to the nose.
  const nose = [[seat.at[0], seat.at[1] - 40, seatFront - 4], [seat.at[0], 430, seatFront + 10], [seat.at[0], 400, 1100], [seat.at[0], 400, 1700]];
  for (const t of hints.thrusters.filter((h) => h.exit[2] > 0)) {
    const s = Math.sign(t.exit[0]);
    const end = t.group === 'down' ? [[t.inlet[0], 400, 1770], [t.inlet[0], t.inlet[1] + 40, t.inlet[2] - 20], into(t)] : [[t.inlet[0] - s * 60, 400, 1790], [t.inlet[0] - s * 40, t.inlet[1], t.inlet[2] - 20], into(t)];
    R(...nose, ...end);
  }
  // The compressor's line, under the steering rack and back to the passenger tank's front end.
  R([C[0] + 120, C[1] - 120, C[2] - 60], [120, 200, 1500], [-200, 220, 1200], [seat.at[0] + 60, 400, 1100], [seat.at[0] + 10, 400, 1100]);

  // The wing: the deck behind the glass rises on two struts. A carbon skin under it and the struts go with it;
  // a dark tray stays in the body under where it was.
  const wingParts = {};
  const P = spec.panels;
  const wz = [P.boot[0] + 10, P.boot[1] - 10];
  const wingAt = (wz[0] + wz[1]) / 2;
  const under = new Geo();
  box(under, [-700, 700], [818, 826], wz, { axis: 'y' });
  const struts = new Geo();
  for (const x of [-270, 270]) {
    const path = bends([[x, 820, wingAt + 40], [x, 640, wingAt + 70], [x, 450, wingAt - 10]], 90, 6);
    tube(struts, path, 16, { segments: 10 });
  }
  wingParts.boot = { trim: [under, struts] };
  const tray = new Geo();
  box(tray, [-712, 712], [772, 780], [P.boot[0] + 4, P.boot[1] - 4], { axis: 'y' });
  wingParts.body = { trim: [tray] };
  hints.wing = { node: 'boot', pivot: [0, 840, wingAt], rise: spec.wing.rise, pitch: spec.wing.pitch };
  hints.skirts = { node: 'skirts', drop: A.skirtDrop };
  hints.seal = { z: S.z, half: S.half, area: +((((S.z[1] - S.z[0]) / 1000) * (2 * S.half)) / 1000).toFixed(2) };
  hints.duct = { inlet: [0, 110, (D.inlet[0] + D.inlet[1]) / 2], up: [0, 380, -1700], fans: F.x.map((x) => [x, F.y, F.z[0]]) };
  hints.compressor = C;
  hints.manifold = Mf;
  return { parts, extra: wingParts, hints };
}
