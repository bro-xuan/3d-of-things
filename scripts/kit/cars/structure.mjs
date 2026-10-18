// Pieces of a generated car's body structure that a spec can ask for, hanging from the body: a single
// cast rear underbody (`casting`, as in the Model Y), the heat pump's module under the front boot
// (`heatPump`) and a pickup's bed (`bed`). Millimetres in the car frame.
import { Geo } from '../geometry.mjs';
import { box, shaft } from '../solids.mjs';
import { Part } from '../parts.mjs';
import { roundedBox, tube } from '../shapes.mjs';

/** The cast rear underbody: a floor with a deep ribbed grid underneath and rails down its sides. */
function casting(spec) {
  const C = spec.casting;
  const part = new Part('rear_casting', { parent: 'body' });
  const g = part.geo('casting');
  const [z0, z1] = C.z;
  const { half, y } = C;
  const depth = C.depth ?? 70;
  roundedBox(g, [-half, half], [y, y + 12], [z0, z1], 6, { segments: 2 });
  // Side rails, and the ribs between them: across and along, as a casting's are.
  for (const s of [-1, 1]) roundedBox(g, s > 0 ? [half - 46, half] : [-half, -half + 46], [y - depth, y + 40], [z0, z1], 8, { segments: 2 });
  const across = C.ribs ?? 5;
  for (let k = 0; k <= across; k++) {
    const z = z0 + 14 + ((z1 - z0 - 28) * k) / across;
    box(g, [-half + 40, half - 40], [y - depth + 14, y], [z - 7, z + 7], { axis: 'z' });
  }
  for (const x of [-half * 0.5, 0, half * 0.5]) box(g, [x - 7, x + 7], [y - depth + 14, y], [z0 + 10, z1 - 10], { axis: 'x' });
  // Shallower ribs on top too, round pockets, as the casting's upper face has.
  for (let k = 0; k <= across * 2; k++) {
    const z = z0 + 14 + ((z1 - z0 - 28) * k) / (across * 2);
    box(g, [-half + 40, half - 40], [y + 12, y + 34], [z - 5, z + 5], { axis: 'z' });
  }
  for (const x of [-half * 0.75, -half * 0.25, half * 0.25, half * 0.75]) box(g, [x - 5, x + 5], [y + 12, y + 34], [z0 + 10, z1 - 10], { axis: 'x' });
  return part;
}

/** The heat pump's module: a block of valves and a pump, with coolant hoses out of it. */
function heatPump(spec) {
  const H = spec.heatPump;
  const part = new Part('heat_pump', { parent: 'body' });
  const [x, y, z] = H.at;
  const [w, h, d] = H.size ?? [420, 170, 200];
  roundedBox(part.geo('casting'), [x - w / 2, x + w / 2], [y - h / 2, y + h / 2], [z - d / 2, z + d / 2], 18, { segments: 3 });
  // The many-way valve on top (Tesla's "octovalve"), and the pump beside it.
  shaft(part.geo('inverter'), 'y', [x - w * 0.18, 0, z], [[62, y + h / 2 - 4], [62, y + h / 2 + 46]], { segments: 28 });
  shaft(part.geo('damper'), 'x', [0, y - 10, z + d * 0.18], [[42, x + w / 2 - 4], [42, x + w / 2 + 70]], { segments: 20 });
  const hoses = new Geo();
  for (const [dx, dz] of [[-0.3, -1], [0.05, -1], [0.3, -1], [-0.35, 1], [0.25, 1]]) {
    const start = [x + dx * w, y - h * 0.15, z + (dz * d) / 2];
    tube(hoses, [start, [start[0], start[1] - 30, start[2] + dz * 60], [start[0] * 1.15, start[1] - 70, start[2] + dz * 110]], 13, { segments: 10 });
  }
  part.geo('boot').append(hoses);
  return part;
}

/** A pickup's bed: a floor between the wheel wells, and walls up to where its cover sits. */
function bed(spec) {
  const B = spec.bed;
  const part = new Part('bed', { parent: 'body' });
  const g = part.geo('trim');
  const [z0, z1] = B.z;
  const t = 10;
  roundedBox(g, [-B.half, B.half], [B.y, B.y + t], [z0, z1], 3, { segments: 1 });
  for (const s of [-1, 1]) roundedBox(g, s > 0 ? [B.half - t, B.half] : [-B.half, -B.half + t], [B.y + t, B.top], [z0, z1], 3, { segments: 1 });
  for (const z of [z0, z1 - t]) roundedBox(g, [-B.half + t, B.half - t], [B.y + t, B.top], [z, z + t], 3, { segments: 1 });
  return part;
}

export function buildStructure(spec) {
  const parts = [];
  if (spec.casting) parts.push(casting(spec));
  if (spec.heatPump) parts.push(heatPump(spec));
  if (spec.bed) parts.push(bed(spec));
  return parts;
}
