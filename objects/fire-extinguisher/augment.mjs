// Build step for the fire extinguisher (content/fire-extinguisher.json → build.augment): opens Poly Haven's
// "Korean Fire Extinguisher 01", a stored-pressure powder extinguisher in one mesh, and gives it the insides that
// make it work. Millimetres, x towards the lever's grip, y up, z towards the gauge (the front).
//
// The shell is drawn about 1.28 times too big for the 3.3 kg extinguisher it shows (its gauge, its stand and its
// label are a Korean 3.3 kg unit's), so it is scaled to a real one's 141 mm cylinder first. Its loose pieces are
// sorted into parts by where they sit; the cylinder and its band are cut in half down the middle so the front
// half comes off. What an extinguisher needs inside is generated: the tank's dished bottom, the nitrogen, the
// powder (a stack of slices that telescope down as it empties), the dip tube, the valve's spigot and passages,
// the stem with its seal, the return spring (one node a turn, so it can be squeezed), and the tamper seal.
import { surgery, solids, shapes, geometry, Part, materialKit, piecesOf, writeNodes, modelSpace, runChecks } from '../../scripts/kit/index.mjs';

/** The shell's scale to a real 3.3 kg unit: its cylinder from 181 mm across to 141 mm. */
export const SCALE = 0.78;
const s = (v) => v * SCALE;

/** The numbers that matter (mm, after scaling), from the truth sheet and the mesh. */
export const L = {
  axis: [0, s(29.6)], // the cylinder's axis (x, z)
  wall: 1.6, // the steel cylinder's wall
  valveX: s(-16), // the valve's stem, seal and spring sit under the head's top boss, off the cylinder's axis
  pivot: [s(-26), s(594.5)], // the lever's pin (x, y), along z
  seat: 456, // the valve seat's underside: the seal closes up against it
  stroke: 3.2, // the stem's travel with the lever squeezed home
  stemTop: 481.4, // under the lever's web
  spring: [440.4, 452], // the return spring, bottom and top, closed
  springTurns: 5,
  gauge: [0, s(576), s(65.2)], // the dial's centre
  // The dial, read off the model's texture: 0 to 15 ×0.1 MPa (bar) over 105°, 0 at 75° left of the top.
  dial: { zero: -75, perBar: 7, modelled: 15 }, // the needle as modelled points 15° right of the top
  charge: 9.6, // bar at 20 °C: the needle is turned to it
  tube: { r: 6.5, bore: 5, bottom: 90, top: 424 }, // the dip tube (Ø 13 mm)
  spigot: { r: 19.4, y0: 411, y1: s(560) },
  gasTop: 409,
  slices: 12, // the powder's slices
  powder: { kg: 3.3, density: 0.9 }, // kg/L, bulk (est.)
  pin: { at: [s(8), s(607)], pull: 78 },
};

/** Pairs that touch by design. */
export const CONTACTS = [
  ['cylinder', 'cylinder_front'], ['cylinder*', 'stand'], ['cylinder*', 'hose'], ['cylinder*', 'nozzle'], ['cylinder*', 'valve_body'],
  ['nitrogen', 'powder*'], ['nitrogen', 'dip_tube'], ['nitrogen', 'cylinder*'], ['powder*', 'powder*'], ['powder*', 'cylinder*'], ['dip_tube', 'valve_body'],
  ['valve_stem', 'valve_body'], ['valve_stem', 'squeeze_lever'], ['valve_stem', 'valve_spring*'], ['valve_spring*', 'valve_spring*'], ['valve_spring*', 'valve_body'],
  ['gauge*', 'valve_body'], ['gauge', 'gauge_needle'], ['carry_handle', 'valve_body'], ['carry_handle', 'squeeze_lever'], ['carry_handle', 'safety_pin'],
  ['squeeze_lever', 'valve_body'], ['squeeze_lever', 'safety_pin'], ['safety_pin', 'valve_body'], ['hose', 'valve_body'], ['hose', 'nozzle'], ['stand', 'hose'], ['stand', 'nozzle'],
];

/** The shell's loose pieces (islands of its body mesh), by what they are. */
const ISLAND = {
  carry_handle: [0, 2, 8, 13, 21],
  hose: [1, 10, 11],
  valve_body: [3, 7, 9],
  gauge: [4, 17, 18, 19, 20],
  gauge_needle: [22],
  squeeze_lever: [5],
  safety_pin: [6],
  stand: [12],
  nozzle: [14, 15],
  band: [16],
  cylinder: [23, 24],
};

/** The cylinder's outside, (r, y) up its wall, measured on the shell (mm, before scaling). */
const OUTSIDE = [[90.6, 114], [90.6, 448], [89.2, 468], [85.3, 484], [78.6, 500], [69.4, 512], [57.5, 522], [42.9, 528], [32.2, 532], [29.9, 534], [29.1, 536], [29.1, 548]];

/** The cylinder's inside radius at height y (mm), less `gap`. */
function insideAt(y, gap = 0) {
  const pts = OUTSIDE.map(([r, h]) => [s(r), s(h)]);
  if (y <= pts[0][1]) return pts[0][0] - L.wall - gap;
  for (let i = 1; i < pts.length; i++) {
    const [r0, y0] = pts[i - 1];
    const [r1, y1] = pts[i];
    if (y <= y1) {
      const r = r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
      // On the shoulder the wall slopes, so the same thickness takes more radius.
      const slope = Math.abs((r1 - r0) / (y1 - y0));
      return r - (L.wall + gap) * Math.sqrt(1 + slope * slope);
    }
  }
  return pts[pts.length - 1][0] - L.wall - gap;
}

/** The tank's dished bottom, (r, y) across its top face. */
const DISH = [[0, 78], [30, 79], [50, 81.5], [62, 85], [insideAt(89), 89]];
const dishAt = (r) => {
  for (let i = 1; i < DISH.length; i++) if (r <= DISH[i][0]) return DISH[i - 1][1] + ((DISH[i][1] - DISH[i - 1][1]) * (r - DISH[i - 1][0])) / (DISH[i][0] - DISH[i - 1][0]);
  return DISH[DISH.length - 1][1];
};

/**
 * The back half of a solid of revolution about the cylinder's axis between y0 and y1: the inside (less `gap`) round a
 * bore, its foot on the dish, cut like the cylinder so the dip tube shows in its groove. The cut faces are capped, and
 * turned `tilt` radians back from the cylinder's cut, so slices that slide into each other never share a face.
 */
function column(geo, y0, y1, { gap, bore, foot = false, steps = 24, tilt = 0 }) {
  const ys = Array.from({ length: steps + 1 }, (_, i) => y0 + ((y1 - y0) * i) / steps);
  const outer = ys.map((y) => [insideAt(y, gap), y]);
  let bottom = [[bore, y0], [insideAt(y0, gap), y0]];
  if (foot) {
    const rim = insideAt(y0 + 12, gap);
    bottom = Array.from({ length: 9 }, (_, i) => {
      const r = bore + ((rim - bore) * i) / 8;
      return [r, dishAt(r + gap) + gap];
    });
    // Up the wall from where the foot meets it.
    const from = bottom[bottom.length - 1][1];
    outer.splice(0, outer.length, ...ys.filter((y) => y > from + 0.5).map((y) => [insideAt(y, gap), y]));
  }
  const profile = [...bottom, ...outer.filter((p, i) => foot || i > 0), [bore, y1], bottom[0]];
  const [ax, az] = L.axis;
  solids.revolve(geo, 'y', [ax, 0, az], profile, { segments: 40, start: tilt, length: Math.PI - 2 * tilt });
  // A revolve about y puts angle a at (ax + r cos a, y, az − r sin a); each cut face is the profile, flat, facing out.
  for (const [a, dir] of [[tilt, 1], [Math.PI - tilt, -1]]) {
    const face = new geometry.Geo();
    geometry.flat(face, [{ outer: profile.slice(0, -1) }], 0, dir);
    const [c, sn] = [Math.cos(a), Math.sin(a)];
    geo.append(face, ([r, y, w], [nr, ny, nw]) => [[ax + r * c + w * sn, y, az - r * sn + w * c], [nr * c + nw * sn, ny, -nr * sn + nw * c]]);
  }
}

/** The cavity's volume (L) from y0 to y1 round the dip tube, above the dish. */
function volume(y0, y1, n = 400) {
  let v = 0;
  const dy = (y1 - y0) / n;
  for (let i = 0; i < n; i++) {
    const y = y0 + dy * (i + 0.5);
    // Out from the dip tube to the wall, or to where the dish has risen to this height.
    let r = L.tube.r;
    const wall = insideAt(y);
    while (r < wall && dishAt(r) < y) r += 0.1;
    v += Math.PI * (r * r - L.tube.r ** 2) * dy;
  }
  return v / 1e6;
}

/** Where the powder's top sits, and the tank's volumes (L). */
function charge() {
  const floor = dishAt(0);
  const total = volume(floor, L.spigot.y0);
  const powder = L.powder.kg / L.powder.density;
  let top = floor + 20;
  while (volume(floor, top) < powder) top += 0.25;
  // What the dip tube can't reach: the powder below its mouth.
  const residual = volume(floor, L.tube.bottom) * L.powder.density;
  return { total, powder, gas: total - powder, top, floor, residual };
}

/** The needle as modelled, turned about the dial's centre to point at the charge's pressure. */
function turnNeedle(mesh) {
  const { zero, perBar, modelled } = L.dial;
  // Clockwise seen from the front is a negative turn about z.
  const a = ((modelled - (zero + perBar * L.charge)) * Math.PI) / 180;
  const [cx, cy] = L.gauge;
  const [c, sn] = [Math.cos(a), Math.sin(a)];
  const turn = (v, i, o) => [o[i] * c - o[i + 1] * sn, o[i] * sn + o[i + 1] * c];
  const positions = [...mesh.positions];
  const normals = mesh.normals ? [...mesh.normals] : null;
  for (let i = 0; i < positions.length; i += 3) {
    const [x, y] = turn(null, 0, [positions[i] - cx, positions[i + 1] - cy]);
    positions[i] = x + cx;
    positions[i + 1] = y + cy;
    if (normals) [normals[i], normals[i + 1]] = turn(null, i, normals);
  }
  return { ...mesh, positions, normals };
}

/** How far the lever turns (radians) to push the stem down its stroke: its web touches the stem's top. */
function leverAngle() {
  const [dx, dy] = [L.valveX - L.pivot[0], L.stemTop - L.pivot[1]];
  let a = 0;
  while (dx * Math.sin(a) + dy * (1 - Math.cos(a)) < L.stroke) a += 1e-4;
  return a;
}

export function buildInsides() {
  const [ax, az] = L.axis;
  const C = charge();
  const parts = [];
  const part = (name, parent) => {
    const p = new Part(name, parent ? { parent } : {});
    parts.push(p);
    return p;
  };

  // The tank's dished bottom, in two halves that go with the cylinder's two halves (angle π to 2π about y is +z).
  const dish = (geo, start) => {
    const under = [...DISH].reverse().map(([r, y]) => [r, y - L.wall]);
    solids.revolve(geo, 'y', [ax, 0, az], [...DISH, ...under, DISH[0]], { segments: 32, start, length: Math.PI });
  };
  dish(part('cylinder').geo('inside'), 0);
  dish(part('cylinder_front').geo('inside'), Math.PI);

  // Nitrogen: it fills the whole tank, the gaps between the powder's grains as well as the space above it.
  column(part('nitrogen').geo('gas'), C.floor, L.gasTop, { gap: 0.4, bore: L.tube.r + 0.4, foot: true, steps: 40 });

  // The powder, as slices that telescope into each other: each a little narrower than the one below, so as the level
  // falls, a slice slides down inside the one under it and only the top face shows.
  const step = (C.top - C.floor) / L.slices;
  const sliceGap = 0.35;
  const slices = [];
  for (let k = 0; k < L.slices; k++) {
    const p = part(k ? `powder_${k}` : 'powder', k ? 'powder' : undefined);
    const y0 = C.floor + step * k;
    column(p.geo('powder'), y0, y0 + step, { gap: 0.9 + sliceGap * k, bore: L.tube.r + 0.9 + sliceGap * k, foot: k === 0, steps: 6, tilt: 0.004 * (k + 1) });
    slices.push({ name: p.name, y0, y1: y0 + step });
  }

  // The dip tube, from just off the bottom up into the valve's spigot.
  const tube = part('dip_tube');
  solids.shaft(tube.geo('tube'), 'y', [ax, 0, az], [[L.tube.r, L.tube.bottom], [L.tube.r, L.tube.top]], { bore: L.tube.bore, segments: 28 });

  // The valve body's insides: the spigot screwed into the neck with its O-ring, the passage from the dip tube to the
  // chamber under the seat, the seat, the outlet to the hose, and the gauge's tapping.
  const valve = part('valve_body');
  solids.shaft(valve.geo('steel'), 'y', [ax, 0, az], [[L.spigot.r, L.spigot.y0], [L.spigot.r, L.spigot.y1 - 0.5]], { bore: L.tube.r + 0.3, segments: 40 });
  solids.revolve(valve.geo('rubber'), 'y', [ax, 0, az], [[L.spigot.r, 423.5], [insideAt(425) - 0.1, 424.2], [insideAt(425) - 0.1, 425.8], [L.spigot.r, 426.5], [L.spigot.r, 423.5]], { segments: 40 });
  const vx = L.valveX;
  const channel = valve.geo('channel');
  shapes.tube(channel, [[ax, L.tube.top + 1, az], [ax, 437, az], [vx, 439.5, az]], 2.6, { segments: 10 });
  shapes.tube(channel, [[vx, L.seat + 3, az], [vx - 9, L.seat + 3, az], [s(-35), s(576), az]], 2.2, { segments: 10 });
  shapes.tube(channel, [[vx, 446, az + 3], [vx * 0.5, 447.5, az + 10], [0, L.gauge[1], s(56)]], 1.1, { segments: 8 });
  solids.shaft(valve.geo('brass'), 'y', [vx, 0, az], [[6.6, L.seat], [6.6, L.seat + 1.6]], { bore: 3, segments: 28 });
  solids.shaft(valve.geo('brass'), 'y', [vx, 0, az], [[6.0, L.spring[0] - 1.4], [6.0, L.spring[0]]], { bore: 2.2, segments: 28 });

  // The stem: pushed down by the lever, it takes the seal off its seat. Its seal is a rubber disc on its foot.
  const stem = part('valve_stem', 'valve_body');
  solids.shaft(stem.geo('steel'), 'y', [vx, 0, az], [[2.2, L.seat - 4], [2.2, L.stemTop - 0.6], [1.6, L.stemTop]], { segments: 20 });
  solids.shaft(stem.geo('rubber'), 'y', [vx, 0, az], [[5.8, L.seat - 3.4], [5.8, L.seat]], { segments: 28 });
  solids.shaft(stem.geo('steel'), 'y', [vx, 0, az], [[4.6, L.spring[1]], [4.6, L.seat - 3.4]], { segments: 24 });

  // The return spring, a turn a node: each turn is moved its share of the stroke, so the spring squeezes up.
  const [sy0, sy1] = L.spring;
  const pitch = (sy1 - sy0) / L.springTurns;
  for (let k = 0; k < L.springTurns; k++) {
    const p = part(k ? `valve_spring_${k}` : 'valve_spring', k ? 'valve_spring' : 'valve_body');
    shapes.tube(p.geo('spring'), shapes.helix('y', [vx, 0, az], 3.9, sy0 + 0.55 + pitch * k, sy0 + 0.55 + pitch * (k + 1) - 0.05, 1, 28), 0.5, { segments: 8 });
  }

  // The tamper seal: a plastic tie through the pin's ring and round the handle, with its tag.
  const pin = part('safety_pin', 'valve_body');
  shapes.tube(pin.geo('seal'), [[s(-9), s(612), s(2)], [s(-13), s(606), s(9)], [s(-14), s(598), s(13)], [s(-13), s(590), s(13.6)]], 0.55, { segments: 8 });
  solids.shaft(pin.geo('seal'), 'z', [s(-13), s(586), 0], [[4.2, s(12.2)], [4.2, s(14.2)]], { segments: 20 });

  part('carry_handle', 'valve_body');
  part('squeeze_lever', 'valve_body');
  part('gauge', 'valve_body');
  part('gauge_needle', 'gauge');
  part('hose');
  part('nozzle', 'hose');
  part('stand');
  return { parts, C, slices, step, sliceGap, pitch };
}

export default async function augment(doc, { data, check = true, log = console.log } = {}) {
  const root = doc.getRoot();
  const scene = root.getDefaultScene() ?? root.listScenes()[0];
  const source = root.listNodes().find((n) => n.getMesh());
  const prims = source.getMesh().listPrimitives();
  const byName = (key) => prims.find((p) => p.getMaterial()?.getName().endsWith(key));
  const scaled = (mesh) => ({ ...mesh, positions: mesh.positions.map((v) => v * SCALE) });
  const body = scaled(surgery.readMesh(byName('_body')));
  const glass = scaled(surgery.readMesh(byName('_glass')));
  const paper = scaled(surgery.readMesh(byName('_paper')));
  const skin = byName('_body').getMaterial();
  const ids = surgery.islands(body);

  const kit = materialKit(doc);
  const M = {
    inside: kit.material('extinguisher_inside', '#8d9094', 0.6, 0.55),
    // A faint blue veil rather than glass: the powder under it keeps its colour.
    gas: kit.material('extinguisher_nitrogen', '#8fbbe8', 0, 0.2).setAlpha(0.2).setAlphaMode('BLEND'),
    powder: kit.material('extinguisher_powder', '#e9c9c2', 0, 0.95),
    tube: kit.material('extinguisher_tube', '#d9dbd6', 0, 0.45),
    brass: kit.material('extinguisher_brass', '#c49a45', 1, 0.35),
    channel: kit.material('extinguisher_channel', '#2c2d2f', 0, 0.6),
    rubber: kit.material('extinguisher_rubber', '#1c1d1e', 0, 0.75),
    steel: kit.material('extinguisher_steel', '#c3c7cb', 1, 0.3),
    spring: kit.material('extinguisher_spring', '#9ea3a8', 1, 0.35),
    seal: kit.material('extinguisher_seal', '#e8c22e', 0, 0.5),
  };

  const pieces = new Map();
  const put = (name, mesh, material, key) => {
    if (!mesh.indices.length) return;
    const list = pieces.get(name) ?? [];
    list.push({ mesh, material, key, generated: false });
    pieces.set(name, list);
  };
  const island = (i) => surgery.pick(body, (t) => ids[t] === i);
  const az = L.axis[1];
  const front = (mesh) => (t) => surgery.centroid(mesh, t)[2] > az;

  for (const [name, list] of Object.entries(ISLAND)) {
    if (name === 'band' || name === 'cylinder') continue;
    for (const i of list) put(name, name === 'gauge_needle' ? turnNeedle(island(i)) : island(i), skin, 'skin');
  }
  // The cylinder, cut down its middle; each half gets its wall's thickness and a rim on the cut.
  const shell = surgery.cut(surgery.merge(...ISLAND.cylinder.map(island)), ([, , z]) => z - az);
  for (const [name, keep] of [['cylinder_front', front(shell)], ['cylinder', (t) => !front(shell)(t)]]) {
    const half = surgery.pick(shell, keep);
    put(name, half, skin, 'skin');
    put(name, surgery.fromGeo(surgery.solidify(half, L.wall)), M.inside, 'inside');
  }
  // The band: its loop that holds the nozzle goes with the hose; its ring is cut with the cylinder.
  const clipAt = s(-95.5);
  const band = surgery.cut(surgery.cut(island(ISLAND.band[0]), ([x]) => x - clipAt), ([, , z]) => z - az);
  const x = (t) => surgery.centroid(band, t)[0];
  put('nozzle', surgery.pick(band, (t) => x(t) < clipAt), skin, 'skin');
  put('cylinder_front', surgery.pick(band, (t) => x(t) >= clipAt && front(band)(t)), skin, 'skin');
  put('cylinder', surgery.pick(band, (t) => x(t) >= clipAt && !front(band)(t)), skin, 'skin');
  // The gauge's glass, and the service tag that hangs from the valve's collar.
  put('gauge', glass, byName('_glass').getMaterial(), 'glass');
  put('valve_body', paper, byName('_paper').getMaterial(), 'paper');

  const { parts, C, slices, step, sliceGap, pitch } = buildInsides();
  piecesOf(parts, M, pieces);
  const parentOf = (n) => parts.find((p) => p.name === n)?.parent;
  writeNodes(doc, scene, pieces, { parts, parentOf });
  source.dispose();

  const { toModel, space, mmPerUnit, realSize, unit } = modelSpace(scene);
  runChecks({ label: 'fire extinguisher', pieces, contacts: CONTACTS, data, parentOf, mmPerUnit, check, log });
  log(`  fire extinguisher: ${pieces.size} parts, ${realSize.join(' × ')} mm; tank ${C.total.toFixed(2)} L, powder ${C.powder.toFixed(2)} L to y ${C.top.toFixed(1)}, nitrogen ${C.gas.toFixed(2)} L, ${C.residual.toFixed(2)} kg below the dip tube`);

  const [ax] = L.axis;
  const vx = L.valveX;
  const g = L.gauge;
  const P = (px, py, pz) => toModel([px, py, pz]);
  const onFace = (r, y, a = (-35 * Math.PI) / 180) => P(ax + r * Math.sin(a), y, az + r * Math.cos(a));
  return {
    space,
    pivots: {
      lever: P(L.pivot[0], L.pivot[1], az),
      needle: P(g[0], g[1], g[2]),
    },
    anchors: {
      // The charge.
      gas_top: P(ax + 30, (C.top + L.gasTop) / 2 + 6, az + 25),
      gas_mid: P(ax, (C.top + L.gasTop) / 2, az),
      powder_top: P(ax + 35, C.top, az + 20),
      powder_face: P(ax + 30, C.top - 40, az + insideAt(C.top - 40) * 0.55),
      powder_low: P(ax - 30, C.floor + 40, az + 30),
      floor: P(ax, C.floor + 2, az),
      // Up the dip tube and through the valve.
      tube_foot: P(ax, L.tube.bottom + 2, az),
      tube_mid: P(ax, 250, az),
      tube_top: P(ax, L.tube.top - 4, az),
      tube_side: P(ax + L.tube.r, 250, az + 2),
      spigot: P(ax, 436, az),
      chamber: P(vx, 446, az),
      seat: P(vx, L.seat + 1, az),
      outlet: P(vx - 9, L.seat + 3, az),
      outlet_end: P(s(-35), s(576), az),
      stem_top: P(vx, L.stemTop - 1, az),
      spring: P(vx, (L.spring[0] + L.spring[1]) / 2, az),
      // The hand's parts.
      lever_grip: P(s(95), s(655), az),
      lever_mid: P(s(30), s(640), az),
      lever_web: P(vx, L.stemTop + 2, az),
      pivot: P(L.pivot[0], L.pivot[1], s(44)),
      handle_grip: P(s(95), s(570), az),
      pin_ring: P(s(-1.5), s(612), s(-6)),
      pin: P(L.pin.at[0], L.pin.at[1], s(45)),
      seal: P(s(-13), s(586), s(14.2)),
      // The gauge.
      gauge: P(g[0], g[1], s(72)),
      gauge_face: P(g[0] + 6, g[1] + 6, s(70)),
      gauge_tap: P(0, g[1], s(56)),
      // Out.
      hose_top: P(s(-60), s(586), s(29)),
      hose_mid: P(s(-120), s(450), s(32)),
      hose_low: P(s(-104), s(300), s(36)),
      nozzle: P(s(-104), s(200), s(48)),
      nozzle_tip: P(s(-104), s(162), s(32)),
      jet: P(s(-104), s(60), s(32)),
      // The outside.
      cylinder: P(ax + s(60), s(320), az + s(65)),
      cylinder_mid: P(ax, s(320), az),
      label: P(ax + s(30), s(380), az + s(86)),
      neck: P(ax + 18, s(540), az + 14),
      head: P(s(-10), s(590), az),
      stand: P(0, s(120), s(150)),
      stand_front: P(0, s(64), s(244)),
      top: P(ax, s(650), az),
      // On the parts' faces, for the callouts' markers: seen from 35° to the left of the front.
      gas_face: onFace(insideAt((C.top + L.gasTop) / 2, 0.4), (C.top + L.gasTop) / 2),
      powder_face_at: onFace(insideAt(C.top - 70, 0.9 + 0.35 * L.slices * (1 - 70 / (C.top - C.floor))), C.top - 70),
      tube_face: onFace(L.tube.r, 200),
      head_face: P(s(-22), s(575), s(56.9)),
      pin_back: P(s(4.1), s(613), s(-20)),
      lever_top: P(s(80), s(653.9), az),
      hose_face: P(s(-118), s(450), s(41.6)),
      nozzle_face: P(s(-104), s(200), s(43.5)),
      cylinder_face: P(ax, s(330), az + s(90.6)),
      stand_face: P(s(-60), s(60), s(242)),
    },
    lever: { degrees: +((leverAngle() * 180) / Math.PI).toFixed(2) },
    dial: { ...L.dial, charge: L.charge },
    stroke: L.stroke,
    spring: { turns: L.springTurns, pitch, length: L.spring[1] - L.spring[0] },
    pin: L.pin.pull,
    charge: { totalL: +C.total.toFixed(3), powderL: +C.powder.toFixed(3), gasL: +C.gas.toFixed(3), residualKg: +C.residual.toFixed(3), top: C.top, floor: C.floor },
    slices: slices.map(({ name, y0, y1 }) => ({ name, y0: +y0.toFixed(2), y1: +y1.toFixed(2) })),
    sliceStep: step,
    sliceGap,
    unitPerMm: unit(1),
  };
}
