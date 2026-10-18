// What a car of the old kind has bolted to its ends and doors rather than moulded into its panels: chrome
// bumpers that wrap round the corners, a grille, square headlamps in chrome bezels, tail lamps, a number
// plate and door handles. Each goes on the panel it comes off with (millimetres in the car frame).
import { Geo } from '../watch/geometry.mjs';
import { box } from '../camera/solids.mjs';
import { roundedBox } from '../hasselblad/shapes.mjs';

/** A lens in a chrome bezel, standing proud of an end face at z (facing out along `dir`). */
function lamp(parts, key, [x0, x1], [y0, y1], z, dir) {
  const bezel = 9;
  const [za, zb] = dir > 0 ? [z - 4, z + 12] : [z - 12, z + 4];
  roundedBox(parts.chrome, [x0 - bezel, x1 + bezel], [y0 - bezel, y1 + bezel], [za, zb], 6, { segments: 2 });
  const [la, lb] = dir > 0 ? [zb - 1, zb + 4] : [za - 4, za + 1];
  roundedBox(parts[key], [x0, x1], [y0, y1], [la, lb], 4, { segments: 2 });
}

/**
 * The fittings for a spec with `fittings`, as { part name: { material key: Geo } }. `lower` is the lower body's loft
 * (for its curves: how wide and high it is along the car).
 */
export function buildFittings(spec, lower) {
  const F = spec.fittings;
  const out = {};
  const geos = (name) => {
    out[name] ??= {};
    return new Proxy(out[name], { get: (t, key) => (t[key] ??= new Geo()) });
  };
  const [zTail, zNose] = spec.length;
  const w = lower.curves.width;
  for (const [name, z, dir] of [['front_bumper', zNose, 1], ['rear_bumper', zTail, -1]]) {
    const g = geos(name);
    // The bumper: a bar across the end, wrapping back round the corners.
    const B = F.bumper;
    // As wide as the wrap-round ends, so it runs straight into them.
    const half = w(z - dir * B.wrap) + 40;
    const [za, zb] = dir > 0 ? [z - 25, z + B.reach] : [z - B.reach, z + 25];
    roundedBox(g.chrome, [-half, half], B.y, [za, zb], 30, { segments: 4 });
    for (const s of [-1, 1]) {
      const zc = z - dir * B.wrap;
      const [a, b] = dir > 0 ? [zc, z] : [z, zc];
      const wa = w(zc) + 6;
      roundedBox(g.chrome, s > 0 ? [wa, wa + 34] : [-wa - 34, -wa], [B.y[0] + 8, B.y[1] - 8], [a, b], 14, { segments: 3 });
    }
    // Rubber over-riders, and the lamps.
    for (const s of [-1, 1]) roundedBox(g.rubber, s > 0 ? [half * 0.42, half * 0.42 + 60] : [-half * 0.42 - 60, -half * 0.42], [B.y[0] - 10, B.y[1] + 25], dir > 0 ? [zb - 10, zb + 22] : [za - 22, za + 10], 12, { segments: 3 });
    if (dir > 0) {
      // The grille: a black panel with chrome slats in a chrome surround, and a headlamp either side of it.
      const G = F.grille;
      roundedBox(g.gloss, [-G.x, G.x], G.y, [z - 4, z + 6], 6, { segments: 2 });
      const slats = 5;
      for (let k = 0; k < slats; k++) {
        const y = G.y[0] + ((G.y[1] - G.y[0]) * (k + 0.5)) / slats;
        box(g.chrome, [-G.x + 10, G.x - 10], [y - 5, y + 5], [z + 4, z + 13], { axis: 'z' });
      }
      roundedBox(g.chrome, [-G.x - 14, G.x + 14], [G.y[1], G.y[1] + 12], [z - 4, z + 14], 5, { segments: 2 });
      roundedBox(g.chrome, [-G.x - 14, G.x + 14], [G.y[0] - 12, G.y[0]], [z - 4, z + 14], 5, { segments: 2 });
      for (const s of [-1, 1]) {
        const [x0, x1] = F.headlamps.x;
        lamp(g, 'headlight', s > 0 ? [x0, x1] : [-x1, -x0], F.headlamps.y, z, 1);
      }
    } else {
      for (const s of [-1, 1]) {
        const [x0, x1] = F.taillamps.x;
        lamp(g, 'taillight', s > 0 ? [x0, x1] : [-x1, -x0], F.taillamps.y, z, -1);
      }
      // The number plate.
      roundedBox(g.plate, [-F.plate.x, F.plate.x], F.plate.y, [z - 8, z + 2], 8, { segments: 2 });
    }
  }
  // Door handles: a short chrome bar near each door's back edge, proud of its skin.
  for (const [i, d] of (spec.panels.doors ?? []).entries()) {
    const zh = F.handles.z[i];
    if (zh === undefined) continue;
    for (const [side, s] of [['left', 1], ['right', -1]]) {
      const g = geos(`door_${d.name}_${side}`);
      // The skin a little below the shoulder, where the side has begun to roll in.
      const x = w(zh) - 0.7 * lower.curves.roll(zh) - 3;
      roundedBox(g.chrome, s > 0 ? [x, x + 16] : [-x - 16, -x], [F.handles.y - 9, F.handles.y + 9], [zh - 70, zh + 70], 7, { segments: 3 });
    }
  }
  return out;
}
