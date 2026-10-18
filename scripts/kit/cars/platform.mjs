// What's under a generated electric car's body: the battery pack in the floor (its tray, lid and
// modules of cells), the drive units (motor with its stator windings and rotor, the reduction gears,
// the inverter on top), the half shafts, each corner's suspension and brake, the steering rack, and
// the orange high-voltage cables between them. Car frame as in body.mjs (mm; z forward, x left, y up).
import { Geo, lathe } from '../geometry.mjs';
import { box, plate, revolve, shaft, spur } from '../solids.mjs';
import { Part } from '../parts.mjs';
import { helix, roundRect, roundedBox, tube } from '../shapes.mjs';
import { brakeDisc, caliper, rim, tyre, tyreSize } from './wheels.mjs';
import { put } from '../solids.mjs';

/** The axles: z, track, wheel size; and where each corner's wheel sits. */
export function corners(spec) {
  const out = [];
  for (const [axle, z, track, w] of [['front', spec.wheelbase / 2, spec.track[0], spec.wheels.front], ['rear', -spec.wheelbase / 2, spec.track[1], spec.wheels.rear]]) {
    const size = tyreSize(w);
    for (const [side, s] of [['left', 1], ['right', -1]]) out.push({ axle, side, s, z, x: (s * track) / 2, size, name: `${axle === 'front' ? 'f' : 'r'}${side === 'left' ? 'l' : 'r'}` });
  }
  return out;
}

/** A Geo built along local z, placed with its axle along x at `at`, facing out to the side `s`. */
function onAxle(target, local, at, s) {
  const g = new Geo();
  // Local +z points out of the car on the left (+x), so the right side is mirrored by turning it round.
  const flip = (p, n) => (s > 0 ? [p, n] : [[-p[0], p[1], -p[2]], [-n[0], n[1], -n[2]]]);
  g.append(local, flip);
  return put(target, g, 'x', at);
}

/** The wheels, each spinning on its hub: tyre, rim and brake disc; the caliper rides on the upright. */
export function wheelParts(spec) {
  const parts = [];
  for (const c of corners(spec)) {
    const part = new Part(`wheel_${c.name}`, { extras: { axle: [c.x, c.size.r, c.z] } });
    const at = [c.x, c.size.r, c.z];
    onAxle(part.geo('tyre'), tyre(c.size), at, c.s);
    const r = rim(c.size, spec.rims ?? {});
    onAxle(part.geo('rim'), r, at, c.s);
    if (r.cover) onAxle(part.geo('rimCover'), r.cover, at, c.s);
    parts.push(part);
    // The brake: disc and caliper on the upright (the disc looks the same however it's turned, so it can stay put
    // while the wheel slides off over it).
    // On a live rear axle, the rear brakes ride on the axle's ends instead of uprights.
    const live = spec.rearAxle === 'live' && c.axle === 'rear';
    const cal = new Part(`caliper_${c.name}`, { parent: live ? 'rear_axle' : `upright_${c.name}` });
    const disc = new Geo();
    disc.append(brakeDisc(c.size), (p, n) => [[p[0], p[1], p[2] + 12], n]);
    onAxle(cal.geo('disc'), disc, at, c.s);
    const g = new Geo();
    // Behind the axle (toward the car's middle), seen through the spokes from the side.
    g.append(caliper(c.size, c.axle === 'front' ? 2.4 : 0.7), (p, n) => [[p[0], p[1], p[2] + 12], n]);
    onAxle(cal.geo(spec.calipers ?? 'caliper'), g, at, c.s);
    parts.push(cal);
  }
  return parts;
}

/** Each corner's suspension: upright, lower and upper arms, a coil-over damper; and the half shafts. */
export function suspensionParts(spec) {
  const parts = [];
  for (const c of corners(spec)) {
    // A live rear axle has its own springs (engine.mjs).
    if (spec.rearAxle === 'live' && c.axle === 'rear') continue;
    const { r, rr, half } = c.size;
    const xo = c.x - c.s * (half - 70);
    const up = new Part(`upright_${c.name}`, { parent: 'suspension' });
    // The upright: from the lower ball joint to the upper, inside the rim.
    tube(up.geo('casting'), [[xo, r - rr * 0.62, c.z], [xo - c.s * 18, r, c.z - 20], [xo - c.s * 36, r + rr * 0.62, c.z]], 26, { segments: 12 });
    shaft(up.geo('casting'), 'x', [0, r, c.z], [[48, xo - c.s * 20], [48, xo + c.s * 20]].map(([a, b]) => [a, b]), { segments: 24 });
    parts.push(up);
    const arms = new Part(`arms_${c.name}`, { parent: 'suspension' });
    const inboard = c.s * (spec.armsInboard?.[c.axle] ?? 330);
    const yl = r - rr * 0.62;
    const yu = r + rr * 0.62;
    for (const [y, x0, len] of [[yl, inboard, 0], [yu, inboard + c.s * 60, 0]]) {
      for (const dz of [-170, 170]) tube(arms.geo('steel'), [[x0, y + (y === yl ? -20 : 10), c.z + dz], [xo - c.s * (y === yl ? 0 : 36), y, c.z]], 15, { segments: 10 });
      void len;
    }
    // The coil-over: damper body, spring, and its top mount on the body.
    // Dampers ahead of the front axle (the steering's tie rods run behind it) and behind the rear.
    const dz = c.axle === 'front' ? 1 : -1;
    const out = c.axle === 'front' ? 0 : 35;
    // How far off the axle line (a small car's springs come close to its half shafts).
    const off = spec.dampers?.[c.axle] ?? 95;
    const bottom = [c.x - c.s * (half + 110 - out), yl + 30, c.z + dz * off];
    const topAt = [c.x - c.s * (half + 190 - out), yu + 170, c.z + dz * (off + 20)];
    tube(arms.geo('damper'), [bottom, topAt], 24, { segments: 14 });
    const axis = topAt.map((v, i) => v - bottom[i]);
    const len = Math.hypot(...axis);
    const coil = helix('y', [0, 0, 0], 52, len * 0.15, len * 0.9, 7).map((p) => {
      // Lay the helix along the damper.
      const u = axis.map((v) => v / len);
      const ref = Math.abs(u[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      const a = [u[1] * ref[2] - u[2] * ref[1], u[2] * ref[0] - u[0] * ref[2], u[0] * ref[1] - u[1] * ref[0]];
      const la = Math.hypot(...a);
      const ax = a.map((v) => v / la);
      const ay = [u[1] * ax[2] - u[2] * ax[1], u[2] * ax[0] - u[0] * ax[2], u[0] * ax[1] - u[1] * ax[0]];
      return [0, 1, 2].map((k) => bottom[k] + u[k] * p[1] + ax[k] * p[0] + ay[k] * p[2]);
    });
    tube(arms.geo('spring'), coil, 8, { segments: 8 });
    parts.push(arms);
  }
  return parts;
}

/** A drive unit: motor (stator and windings in a housing, the rotor inside), reduction gears and inverter. Axis along x. */
function driveUnit(name, { x, y, z, length = 250, radius = 112, gearSide = 1, parent = 'drive' }) {
  const parts = [];
  const unit = new Part(name, { parent });
  const x0 = x - length / 2;
  const x1 = x + length / 2;
  // The housing, finned, with end bells.
  const housing = new Geo();
  lathe(housing, [[radius - 18, x0 - 10], [radius + 4, x0 - 10], [radius + 4, x0 + 12], [radius + 12, x0 + 20], [radius + 12, x1 - 20], [radius + 4, x1 - 12], [radius + 4, x1 + 10], [radius - 18, x1 + 10], [radius - 18, x0 - 10]], { segments: 64 });
  put(unit.geo('casting'), housing, 'x', [0, y, z]);
  // Stator laminations and the copper end turns, inside.
  shaft(unit.geo('lamination'), 'x', [0, y, z], [[radius - 20, x0 + 30], [radius - 20, x1 - 30]], { bore: radius * 0.55, segments: 48 });
  for (const xe of [x0 + 18, x1 - 18]) shaft(unit.geo('copper'), 'x', [0, y, z], [[radius - 26, xe - 14], [radius - 22, xe], [radius - 26, xe + 14]], { bore: radius * 0.56, segments: 48 });
  // The gearbox beside it: a case, and the output on the axle line below.
  const gx = gearSide > 0 ? x1 + 10 : x0 - 10;
  const g0 = Math.min(gx, gx + gearSide * 150);
  const g1 = Math.max(gx, gx + gearSide * 150);
  roundedBox(unit.geo('casting'), [g0, g1], [y - radius - 70, y + radius + 30], [z - radius - 40, z + radius + 30], 30, { segments: 4 });
  // The inverter on top, where the orange cables come in.
  roundedBox(unit.geo('inverter'), [x0 + 10, x1 - 10], [y + radius + 4, y + radius + 70], [z - radius * 0.8, z + radius * 0.6], 14, { segments: 3 });
  parts.push(unit);
  // The rotor turns: a drum of laminations on its shaft.
  const rotor = new Part(`${name}_rotor`, { parent: name, extras: { axis: [x, y, z] } });
  shaft(rotor.geo('lamination'), 'x', [0, y, z], [[radius * 0.53, x0 + 32], [radius * 0.53, x1 - 32]], { bore: 18, segments: 40 });
  shaft(rotor.geo('steel'), 'x', [0, y, z], [[18, x0 - 6], [18, x1 + 6]], { segments: 16 });
  parts.push(rotor);
  return { parts, output: [gearSide > 0 ? g1 : g0, y - radius - 20, z] };
}

/** The battery pack: a tray and a lid, the modules in rows (their cells drawn on top), and the cables out of it. */
export function packParts(spec) {
  const P = spec.pack;
  const parts = [];
  const tray = new Part('battery_pack');
  roundedBox(tray.geo('packCase'), [-P.half, P.half], [P.y[0], P.y[1] - 8], P.z, 26, { segments: 4, faces: ['+x', '-x', '-y', '+z', '-z'] });
  parts.push(tray);
  const lid = new Part('pack_lid', { parent: 'battery_pack' });
  plate(lid.geo('packLid'), 'y', { outer: roundRect(0, (P.z[0] + P.z[1]) / 2, 2 * P.half - 4, P.z[1] - P.z[0] - 4, 24) }, P.y[1] - 8, P.y[1], { chamfer: 3 });
  parts.push(lid);
  // Modules, with a gap down the middle for the cables and coolant.
  const mods = new Part('modules', { parent: 'battery_pack' });
  const [cols, rows] = P.modules;
  const gap = 40;
  const mw = (2 * P.half - 60 - gap) / cols;
  const ml = (P.z[1] - P.z[0] - 60) / rows;
  for (let i = 0; i < cols; i++) {
    const xa = -P.half + 30 + i * mw + (i >= cols / 2 ? gap : 0);
    for (let j = 0; j < rows; j++) {
      const za = P.z[0] + 30 + j * ml;
      const geo = new Geo();
      box(geo, [xa + 6, xa + mw - 6], [P.y[0] + 14, P.y[1] - 22], [za + 6, za + ml - 6], { axis: 'y', chamfer: 3 });
      // The top face's uv covers 0..1 across the module, for the cells' texture.
      for (let v = 0; v < geo.vertexCount; v++) {
        geo.uvs[v * 2] = (geo.positions[v * 3] - xa) / mw;
        geo.uvs[v * 2 + 1] = (geo.positions[v * 3 + 2] - za) / ml;
      }
      mods.geo('cells').append(geo);
    }
  }
  parts.push(mods);
  return parts;
}

/** All of it: the pack, the drive units (one per motor in the spec), the half shafts, suspension, steering and cables. */
export function buildPlatform(spec) {
  // An electric car's pack and motors; a car with an engine has neither (its drivetrain is engine.mjs's).
  const parts = spec.pack ? [...packParts(spec)] : [];
  const drive = new Part('drive');
  parts.push(drive);
  const susp = new Part('suspension');
  parts.push(susp);
  const outputs = [];
  for (const m of spec.motors ?? []) {
    const axleZ = (m.axle === 'front' ? 1 : -1) * (spec.wheelbase / 2);
    const corner = corners(spec).find((c) => c.axle === m.axle);
    const y = corner.size.r + (m.y ?? 20);
    const z = axleZ + (m.dz ?? (m.axle === 'front' ? 170 : -170));
    const { parts: unit, output } = driveUnit(m.name, { x: m.x ?? 0, y, z, length: m.length ?? 250, radius: m.radius ?? 112, gearSide: m.gearSide ?? 1 });
    parts.push(...unit);
    outputs.push({ m, output, axleZ, y: corner.size.r });
  }
  // Half shafts from each unit's output to the wheels it drives, turning with them.
  for (const { m, axleZ, y } of outputs) {
    const sides = m.wheels ?? ['left', 'right'];
    for (const side of sides) {
      const c = corners(spec).find((cc) => cc.axle === m.axle && cc.side === side);
      const part = new Part(`shaft_${c.name}`, { parent: 'drive', extras: { axle: [c.x, y, axleZ] } });
      const inner = c.s * (m.x ? Math.abs(m.x) * 0 + 180 : 160);
      const outer = c.x - c.s * (c.size.half + 10);
      shaft(part.geo('steel'), 'x', [0, y, axleZ], [[22, Math.min(inner, outer)], [22, Math.max(inner, outer)]], { segments: 16 });
      for (const xb of [inner + c.s * 40, outer - c.s * 50]) shaft(part.geo('boot'), 'x', [0, y, axleZ], [[34, xb - 40], [44, xb - 20], [36, xb], [44, xb + 20], [34, xb + 40]], { segments: 20 });
      parts.push(part);
    }
  }
  parts.push(...suspensionParts(spec));
  // The steering rack, across in front of the front axle, with tie rods out to the uprights.
  const front = corners(spec).filter((c) => c.axle === 'front');
  const steer = new Part('steering_rack', { parent: 'suspension' });
  const rz = spec.steering?.z ?? spec.wheelbase / 2 - 150;
  const ry = spec.steering?.y ?? front[0].size.r + 10;
  // A shorter rack, and tie rods rising to the steering arms, where an engine and its arms crowd it.
  const rh = spec.steering?.half ?? 360;
  const rise = spec.steering?.rise ?? 0;
  shaft(steer.geo('casting'), 'x', [0, ry, rz], [[30, -rh], [30, rh]], { segments: 18 });
  for (const c of front) tube(steer.geo('steel'), [[c.s * rh, ry, rz], [c.x - c.s * (c.size.half + 40), ry + rise, rz + 60]], 12, { segments: 8 });
  parts.push(steer);
  // High-voltage cables, orange: from the pack's front and back to each inverter.
  const cables = new Part('hv_cables', { parent: 'battery_pack' });
  for (const { m } of outputs) {
    const unit = parts.find((p) => p.name === m.name);
    void unit;
    const axleZ = (m.axle === 'front' ? 1 : -1) * (spec.wheelbase / 2);
    const z = axleZ + (m.dz ?? (m.axle === 'front' ? 170 : -170));
    const corner = corners(spec).find((c) => c.axle === m.axle);
    const y = corner.size.r + (m.y ?? 20) + (m.radius ?? 112) + 40;
    const edge = m.axle === 'front' ? spec.pack.z[1] : spec.pack.z[0];
    for (const dx of [-30, 30]) {
      const x0 = (m.x ?? 0) + dx;
      // Out of the pack's end near its top (or, for a tall pack, partway up), and down to the inverter.
      const yc = spec.pack.cableY ?? spec.pack.y[1] - 30;
      tube(cables.geo('hv'), [[dx * 2, yc, edge], [dx * 2, yc + 60, edge + Math.sign(z) * 80], [x0, y - 20, z - Math.sign(z) * 120], [x0, y, z]], 11, { segments: 10 });
    }
  }
  if (spec.pack) parts.push(cables);
  void spur;
  return parts;
}
