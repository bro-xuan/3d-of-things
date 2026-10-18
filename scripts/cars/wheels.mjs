// Wheels for the generated cars: a tyre with tread grooves and rounded shoulders, a cast rim with
// spokes, the brake disc and its caliper. Built along the axle (local z) and placed by the caller.
import { Geo, circle, contours, cw, extrude, lathe, sd } from '../watch/geometry.mjs';

/** Sizes from an ISO tyre size: rim diameter (in), section width (mm) and aspect ratio (%). */
export function tyreSize({ rim, width, profile }) {
  const rr = (rim * 25.4) / 2;
  return { r: rr + (width * profile) / 100, rr, half: width / 2 };
}

/** A tyre on the local z axis, centred at z = 0: tread with grooves, shoulders, sidewalls down to the bead. */
export function tyre(size, { grooves = 4 } = {}) {
  const geo = new Geo();
  const { r, rr, half } = size;
  const side = r - rr;
  const p = [];
  // Inner bead, out the sidewall (bulging a little), round the shoulder, across the tread (grooved), and back.
  p.push([rr + 2, -half + 6]);
  p.push([rr + side * 0.35, -half - 4]);
  p.push([rr + side * 0.75, -half - 2]);
  p.push([r - 18, -half + 10]);
  p.push([r - 4, -half + 26]);
  const tread = half * 2 - 52;
  for (let g = 0; g <= grooves; g++) {
    const z = -half + 26 + (tread * g) / grooves;
    if (g > 0) p.push([r - 7, z - 4], [r - 7, z]);
    if (g < grooves) p.push([r, z + 5], [r, z + tread / grooves - 5]);
    else p.push([r - 4, z]);
  }
  p.push([r - 18, half - 10]);
  p.push([rr + side * 0.75, half + 2]);
  p.push([rr + side * 0.35, half + 4]);
  p.push([rr + 2, half - 6]);
  lathe(geo, p, { segments: 96, crease: 30 });
  return geo;
}

/** A cast rim on the local z axis: the barrel inside the tyre, a face of `spokes` spokes, the hub. Outer face at +z. */
export function rim(size, { spokes = 10, dish = 22, style = 'split' } = {}) {
  const geo = new Geo();
  const { rr, half } = size;
  // The barrel, from the inner flange to the outer.
  lathe(geo, [[rr - 14, -half + 4], [rr + 6, -half + 4], [rr + 6, half - 6], [rr - 14, half - 6], [rr - 14, -half + 4]], { segments: 96 });
  // The face: an outer ring, a hub and the spokes between, as one outline.
  const R = rr - 12;
  const arms = [];
  for (let k = 0; k < spokes; k++) {
    const a = (k / spokes) * Math.PI * 2;
    const d = [Math.cos(a), Math.sin(a)];
    if (style === 'split') {
      // Twinned spokes, splitting toward the rim.
      for (const s of [-1, 1]) {
        const b = a + s * (Math.PI / spokes) * 0.28;
        arms.push(sd.capsule([d[0] * R * 0.28, d[1] * R * 0.28], [Math.cos(b) * (R + 4), Math.sin(b) * (R + 4)], 9, 6));
      }
    } else {
      arms.push(sd.capsule([d[0] * R * 0.25, d[1] * R * 0.25], [d[0] * (R + 4), d[1] * (R + 4)], 16, 11));
    }
  }
  if (style === 'disc') {
    // A flat cover across the rim (in its own colour, returned as `geo.cover`), and `spokes` dark blades standing
    // proud of it from the hub to the rim.
    const cover = new Geo();
    extrude(cover, cover, contours(sd.circle([0, 0], R + 6), { min: [-R - 10, -R - 10], max: [R + 10, R + 10] }, 1.6, 2.4), half - 22 - 16, half - 22 - 6, { chamfer: 2, crease: 40 });
    const blades = [];
    for (let k = 0; k < spokes; k++) {
      const a = (k / spokes) * Math.PI * 2;
      blades.push(sd.capsule([Math.cos(a) * R * 0.2, Math.sin(a) * R * 0.2], [Math.cos(a) * (R + 2), Math.sin(a) * (R + 2)], 26, 14));
    }
    const local = new Geo();
    extrude(local, local, contours(sd.smooth(8, sd.circle([0, 0], R * 0.24), ...blades), { min: [-R - 10, -R - 10], max: [R + 10, R + 10] }, 1.4, 2.2), half - 22 - 10, half - 22 + 4, { chamfer: 2, crease: 40 });
    geo.append(local);
    lathe(geo, [[0, half - 14], [R * 0.13, half - 14], [R * 0.16, half - 24], [R * 0.16, half - 60], [0, half - 60]].reverse(), { segments: 40 });
    geo.cover = cover;
    return geo;
  }
  if (style === 'aero') {
    // A smooth cover: solid, with a few short slots toward the rim.
    const slots = [];
    for (let k = 0; k < spokes; k++) {
      const a = (k / spokes) * Math.PI * 2;
      slots.push(sd.capsule([Math.cos(a) * R * 0.62, Math.sin(a) * R * 0.62], [Math.cos(a + 0.42) * R * 0.86, Math.sin(a + 0.42) * R * 0.86], R * 0.07));
    }
    const cover = sd.subtract(sd.circle([0, 0], R + 6), ...slots);
    const local = new Geo();
    extrude(local, local, contours(cover, { min: [-R - 10, -R - 10], max: [R + 10, R + 10] }, 1.6, 2.4), half - 22 - 10, half - 22, { chamfer: 3, crease: 40 });
    for (let i = 0; i < local.vertexCount; i++) {
      const rho = Math.hypot(local.positions[i * 3], local.positions[i * 3 + 1]) / R;
      local.positions[i * 3 + 2] -= dish * 0.5 * (1 - Math.min(1, rho)) ** 2;
    }
    geo.append(local);
    return geo;
  }
  const face = sd.smooth(10, sd.circle([0, 0], R * 0.3), ...arms);
  const ring = sd.subtract(sd.circle([0, 0], R + 6), sd.circle([0, 0], R - 14));
  const shape = sd.smooth(8, face, ring);
  const outlines = contours(shape, { min: [-R - 10, -R - 10], max: [R + 10, R + 10] }, 1.4, 2.2);
  const local = new Geo();
  extrude(local, local, outlines, half - 22 - 18, half - 22, { chamfer: 2, crease: 40 });
  // Dish the face: spokes sink toward the hub.
  for (let i = 0; i < local.vertexCount; i++) {
    const x = local.positions[i * 3];
    const y = local.positions[i * 3 + 1];
    const rho = Math.hypot(x, y) / R;
    local.positions[i * 3 + 2] -= dish * (1 - Math.min(1, rho)) ** 1.5;
  }
  geo.append(local);
  // The hub and the cap.
  lathe(geo, [[0, half - 8 - dish], [R * 0.2, half - 8 - dish], [R * 0.24, half - 18 - dish], [R * 0.24, half - 60 - dish], [0, half - 60 - dish]].reverse(), { segments: 48 });
  return geo;
}

/** The brake disc on the local z axis, inboard of the rim's face. */
export function brakeDisc(size) {
  const geo = new Geo();
  const r = size.rr - 42;
  lathe(geo, [[r * 0.45, -14], [r, -14], [r, 14], [r * 0.45, 14], [r * 0.45, -14]], { segments: 72 });
  lathe(geo, [[0, 20], [r * 0.46, 20], [r * 0.46, -30], [0, -30]].reverse(), { segments: 40 });
  return geo;
}

/** A brake caliper astride the disc's rim, at `angle` round the axle: a block in local coordinates. */
export function caliper(size, angle = 0.7) {
  const geo = new Geo();
  const r = size.rr - 42;
  const outline = [];
  for (let i = 0; i <= 12; i++) {
    const a = angle - 0.45 + (0.9 * i) / 12;
    outline.push([(r + 18) * Math.cos(a), (r + 18) * Math.sin(a)]);
  }
  for (let i = 12; i >= 0; i--) {
    const a = angle - 0.45 + (0.9 * i) / 12;
    outline.push([(r - 52) * Math.cos(a), (r - 52) * Math.sin(a)]);
  }
  extrude(geo, geo, { outer: outline }, -34, 34, { chamfer: 6, chamferBottom: 6 });
  void circle;
  void cw;
  return geo;
}
