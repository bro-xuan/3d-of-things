// The cabin of a generated car: floor and bulkheads, seats, the steering wheel (or a yoke) on its
// column, the dashboard and the centre screen. Laid out from the spec's `cabin` numbers (mm).
import { Geo, lathe } from '../watch/geometry.mjs';
import { box, plate, shaft } from '../camera/solids.mjs';
import { Part } from '../camera/mechanism.mjs';
import { roundRect, roundedBox, tube } from '../hasselblad/shapes.mjs';

/** A seat: cushion, backrest leaning back `recline` degrees, headrest. `at` is the hip point (x, y, z), facing +z. */
function seat(geo, [x, y, z], { width = 520, depth = 500, back = 640, recline = 22, head = true } = {}) {
  roundedBox(geo, [x - width / 2, x + width / 2], [y - 110, y + 20], [z - 60, z + depth - 60], 45, { segments: 4 });
  // The backrest: built upright, then leaned back about the hip.
  const b = new Geo();
  roundedBox(b, [x - width / 2 + 10, x + width / 2 - 10], [y, y + back], [z - 150, z - 40], 45, { segments: 4 });
  if (head) roundedBox(b, [x - 140, x + 140], [y + back + 20, y + back + 200], [z - 140, z - 50], 40, { segments: 4 });
  const a = (recline * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  geo.append(b, (p, n) => {
    const dy = p[1] - y;
    const dz = p[2] - (z - 60);
    return [
      [p[0], y + dy * c + dz * s, z - 60 - dy * s + dz * c],
      [n[0], n[1] * c + n[2] * s, -n[1] * s + n[2] * c],
    ];
  });
  return geo;
}

export function buildInterior(spec) {
  const C = spec.cabin3d;
  const parts = [];
  const floor = new Part('cabin_floor', { parent: 'body' });
  // The floor over the pack, from the firewall to behind the seats, and the bulkhead.
  const T = C.tunnel;
  const [fz0, fz1] = C.floor.z;
  if (!T) {
    plate(floor.geo('carpet'), 'y', { outer: roundRect(0, (fz0 + fz1) / 2, C.floor.half * 2, fz1 - fz0, 40) }, C.floor.y, C.floor.y + 12);
    box(floor.geo('trim'), [-C.floor.half, C.floor.half], [C.floor.y, C.dash.y + 40], [fz1 - 30, fz1], { axis: 'z', chamfer: 6 });
  } else {
    // With an engine in front, a tunnel down the middle for the gearbox and propshaft, through the bulkhead.
    for (const s of [-1, 1]) {
      box(floor.geo('carpet'), s > 0 ? [T.half, C.floor.half] : [-C.floor.half, -T.half], [C.floor.y, C.floor.y + 12], [fz0, fz1]);
      box(floor.geo('carpet'), s > 0 ? [T.half - 12, T.half] : [-T.half, -T.half + 12], [C.floor.y + 12, T.top], [fz0, fz1 - 30], { axis: 'x' });
      box(floor.geo('trim'), s > 0 ? [T.half, C.floor.half] : [-C.floor.half, -T.half], [C.floor.y, C.dash.y + 40], [fz1 - 30, fz1], { axis: 'z' });
    }
    box(floor.geo('carpet'), [-T.half, T.half], [T.top - 12, T.top], [fz0, fz1 - 30]);
    box(floor.geo('trim'), [-T.half, T.half], [T.top, C.dash.y + 40], [fz1 - 30, fz1], { axis: 'z' });
  }
  parts.push(floor);
  const seats = new Part('seats', { parent: 'cabin_floor' });
  for (const s of C.seats) seat(seats.geo('seat'), s.at, s);
  parts.push(seats);
  // The dashboard across, the centre screen, the steering wheel on its column.
  const dash = new Part('dashboard', { parent: 'cabin_floor' });
  roundedBox(dash.geo('trim'), [-C.dash.half, C.dash.half], [C.dash.y - 120, C.dash.y], [C.dash.z - 220, C.dash.z], 40, { segments: 4 });
  // The screen faces the seats (-z), its frame behind it.
  const sc = C.screen;
  roundedBox(dash.geo('screenFrame'), [sc.x - sc.w / 2 - 8, sc.x + sc.w / 2 + 8], [sc.y - sc.h / 2 - 8, sc.y + sc.h / 2 + 8], [sc.z, sc.z + 14], 6, { segments: 2 });
  const panel = new Geo();
  box(panel, [sc.x - sc.w / 2, sc.x + sc.w / 2], [sc.y - sc.h / 2, sc.y + sc.h / 2], [sc.z - 1, sc.z + 1], { axis: 'z' });
  for (let v = 0; v < panel.vertexCount; v++) {
    panel.uvs[v * 2] = 1 - (panel.positions[v * 3] - (sc.x - sc.w / 2)) / sc.w;
    panel.uvs[v * 2 + 1] = 1 - (panel.positions[v * 3 + 1] - (sc.y - sc.h / 2)) / sc.h;
  }
  dash.geo('screen').append(panel);
  parts.push(dash);
  const wheel = new Part('steering_wheel', { parent: 'dashboard' });
  const w = C.wheel;
  const g = new Geo();
  // A rim (torus) of radius w.r, its hub, and three spokes, in its own plane; then tilted toward the driver. A yoke
  // has no top: the rim stops at the two grips, and two spokes go out to them.
  const ringPts = [];
  const [a0, a1] = w.yoke ? [Math.PI * 0.94, Math.PI * 2.06] : [0, Math.PI * 2];
  for (let i = 0; i <= 64; i++) {
    const a = a0 + ((a1 - a0) * i) / 64;
    const flat = w.yoke ? 0.82 : 1;
    ringPts.push([w.r * Math.cos(a), w.r * Math.sin(a) * (Math.sin(a) < 0 ? flat : 1), 0]);
  }
  tube(g, ringPts, 16, { segments: 10, caps: !!w.yoke });
  for (const a of w.yoke ? [0, Math.PI] : [Math.PI / 2 + Math.PI, 0, Math.PI]) tube(g, [[0, 0, -10], [w.r * 0.95 * Math.cos(a), w.r * 0.95 * Math.sin(a), 0]], 12, { segments: 8 });
  lathe(g, [[0, -30], [60, -30], [60, 10], [0, 10]].reverse(), { segments: 24 });
  const tilt = (w.tilt * Math.PI) / 180;
  wheel.geo('trim').append(g, (p, n) => {
    const y = p[1] * Math.cos(tilt) - p[2] * Math.sin(tilt);
    const zz = p[1] * Math.sin(tilt) + p[2] * Math.cos(tilt);
    const ny = n[1] * Math.cos(tilt) - n[2] * Math.sin(tilt);
    const nz = n[1] * Math.sin(tilt) + n[2] * Math.cos(tilt);
    return [[w.at[0] + p[0], w.at[1] + y, w.at[2] - zz], [n[0], ny, -nz]];
  });
  shaft(wheel.geo('trim'), 'z', [w.at[0], w.at[1] - 40, 0], [[30, w.at[2] - 10], [30, C.dash.z - 60]], { segments: 14 });
  parts.push(wheel);
  return parts;
}
