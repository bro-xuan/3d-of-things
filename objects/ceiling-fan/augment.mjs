// Build step for the ceiling fan (content/ceiling-fan.json → build.augment): opens Poly Haven's "Ceiling Fan", a
// closed shell and four blades, and gives it the motor a fan really has. Millimetres in the source's frame: y up with
// 0 at the ceiling, the fan hanging below it, x and z across. The shell is cut into the parts that come off: the
// motor housing that turns with the blades, the rotor's underside (where the blade irons bolt on), and the switch cup
// below, which is fixed. Inside, generated from the truth sheet: the hollow fixed shaft hanging from the downrod, the
// stator on it (36 teeth, 18 main and 18 auxiliary coils), the rotor round it (a steel can, a laminated ring and a
// 44-bar aluminium cage) on two ball bearings, and in the switch cup the pull-chain switch, the run capacitor and
// the reverse switch. The field the windings make is drawn as a band of north and south poles in the air gap.
import { surgery, solids, shapes, geometry, Part, materialKit, piecesOf, writeNodes, modelSpace, runChecks, smoothPath } from '../../scripts/kit/index.mjs';

/** The numbers that matter (mm), from the truth sheet (section 4) and the mesh. */
export const L = {
  poles: 18,
  teeth: 36,
  bars: 44,
  /** The rotor's speeds and the field's (120 × 60 Hz ÷ 18 poles), rpm. */
  rpm: { low: 75, medium: 107, high: 151, field: 400 },
  /** The blades' pitch, measured off the mesh. */
  pitch: 13.7,
  shaft: { r: 7.5, bore: 4.5, bottom: -400, yoke: { r: 13, y0: -262, y1: -232 } },
  stator: { r: 94, bore: 34, yoke: 58, shoe: 89.5, tooth: 3.3, tip: 6.7, y0: -341, y1: -321, hub: [-343, -319] },
  coil: { r0: 62, r1: 88, side: 5.0, end: 4.5, clear: 0.1, round: 2.5 },
  field: { r0: 94.2, r1: 94.4 },
  ring: { r0: 94.6, r1: 116 },
  bar: { r1: 101, half: 1.7 },
  endRing: { r0: 95.2, r1: 106, h: 4 },
  can: { r: 119, wall: 3, top: -312, bottom: -352.5, plate: 3.5 },
  lid: { y0: -312, y1: -309 },
  /** Two 6202 ball bearings: 15 bore, 35 outside, 11 wide. */
  bearing: { r0: 7.5, r1: 17.5, w: 11, boss: 22, top: -298, bottom: -363.5 },
  /** Where the shell is cut: the housing above, the rotor's underside between, the switch cup below a gap. */
  cut: { housing: -355, rotor: -362.6, cup: -364.2 },
  /** The bore the parts that slide up the 14.8 mm downrod are given. */
  rodClear: 15.5,
  cup: { plate: [-477, -475.5], plateR: 134, mount: [-392, -389] },
  /** Azimuths (degrees from +x towards +z, so 90 is the front): the pull chain front right, the reverse switch front left. */
  chain: { at: 60, r: 60, bottom: -640, fob: -662 },
  reverse: { at: 120, y: -455 },
  capacitor: { x: [-95, -49], y: [-475.5, -453.5], z: [-15, 15] },
};

/** Pairs that touch by design: bearings on the shaft, the stator's hub on it, the windings on their teeth, the
 *  cage in its ring, the rotor's lid on its can, the blade irons in the rotor's underside, the switch cup's parts. */
export const CONTACTS = [
  ['stator', 'shaft'], ['main_winding', 'stator'], ['aux_winding', 'stator'], ['field', 'stator'],
  ['rotor', 'shaft'], ['motor_housing', 'shaft'], ['motor_housing', 'rotor'], ['cage', 'rotor'],
  ['blade_*', 'rotor'], ['switch_housing', 'shaft'], ['reverse_switch', 'switch_housing'],
  ['switch_cap', 'switch_housing'], ['speed_switch', 'switch_cap'], ['capacitor', 'switch_cap'],
];

const rad = (deg) => (deg * Math.PI) / 180;
/** A point at radius r, azimuth a (degrees from +x towards +z), height y. */
export const polar = (r, a, y) => [r * Math.cos(rad(a)), y, r * Math.sin(rad(a))];
/** A point given along azimuth a (x out, z across), turned into place. */
const local = (a, [x, y, z]) => [x * Math.cos(rad(a)) - z * Math.sin(rad(a)), y, x * Math.sin(rad(a)) + z * Math.cos(rad(a))];
/** Turns a mesh built along +x about the vertical axis to azimuth a. */
const turn = (a) => (p, n) => [local(a, p), local(a, n)];
/** Builds with `make(geo)` along +x, then appends it to `geo` turned to azimuth a. */
const at = (geo, a, make) => {
  const built = new geometry.Geo();
  make(built);
  geo.append(built, turn(a));
};

/** The stator's outline in (x, z): a yoke ring with 36 teeth, each a stem and a wider shoe at the air gap. */
function statorOutline() {
  const { r, yoke, shoe, tooth, tip } = L.stator;
  const loop = [];
  const pitch = (2 * Math.PI) / L.teeth;
  const stem = Math.asin(tooth / yoke);
  for (let k = 0; k < L.teeth; k++) {
    const a = k * pitch;
    const p = (rr, t) => [rr * Math.cos(a) - t * Math.sin(a), rr * Math.sin(a) + t * Math.cos(a)];
    // Up the tooth's near side, round its shoe, down its far side (anticlockwise), then the slot's floor to the next.
    loop.push(p(Math.sqrt(yoke * yoke - tooth * tooth), -tooth), p(shoe - 1.2, -tooth), p(shoe, -tip));
    const b0 = Math.asin(tip / r);
    for (let i = 0; i <= 6; i++) {
      const b = a - b0 + (i / 6) * 2 * b0;
      loop.push([r * Math.cos(b), r * Math.sin(b)]);
    }
    loop.push(p(shoe, tip), p(shoe - 1.2, tooth), p(Math.sqrt(yoke * yoke - tooth * tooth), tooth));
    for (let i = 1; i < 4; i++) {
      const b = a + stem + (i / 4) * (pitch - 2 * stem);
      loop.push([yoke * Math.cos(b), yoke * Math.sin(b)]);
    }
  }
  return loop;
}

/** The rotor ring's bore in (x, z): a circle with a slot for each of the 44 bars, open to the air gap. */
function ringBore() {
  const { r0 } = L.ring;
  const { r1, half } = L.bar;
  const step = (2 * Math.PI) / L.bars;
  const loop = [];
  for (let k = 0; k < L.bars; k++) {
    const a = (k + 0.5) * step;
    const q = (rr, w) => [rr * Math.cos(a) - w * Math.sin(a), rr * Math.sin(a) + w * Math.cos(a)];
    const edge = half / r0;
    for (let i = 0; i < 4; i++) {
      const b = a - step / 2 + (i / 4) * (step / 2 - edge);
      loop.push([r0 * Math.cos(b), r0 * Math.sin(b)]);
    }
    const inner = Math.sqrt(r0 * r0 - half * half);
    loop.push(q(inner, -half), q(r1, -half), q(r1, half), q(inner, half));
    for (let i = 1; i < 4; i++) {
      const b = a + edge + (i / 4) * (step / 2 - edge);
      loop.push([r0 * Math.cos(b), r0 * Math.sin(b)]);
    }
  }
  return loop;
}

/** A sealed ball bearing between y0 and y1: steel rings, black seals over the balls. */
function bearing(part, y0, y1) {
  const { r0, r1 } = L.bearing;
  solids.shaft(part.geo('bearing'), 'y', [0, 0, 0], [[r1, y0], [r1, y1]], { bore: r1 - 2.6, segments: 40 });
  solids.shaft(part.geo('bearing'), 'y', [0, 0, 0], [[r0 + 2.4, y0], [r0 + 2.4, y1]], { bore: r0, segments: 32 });
  for (const y of [y0 + 0.6, y1 - 0.6]) solids.shaft(part.geo('seal'), 'y', [0, 0, 0], [[r1 - 2.6, y - 0.3], [r1 - 2.6, y + 0.3]], { bore: r0 + 2.4, segments: 40 });
}

export function buildInsides() {
  const { y0, y1 } = L.stator;

  const shaft = new Part('shaft');
  const { yoke } = L.shaft;
  // The yoke goes up inside the downrod; below it the hollow shaft the motor hangs on, its leads running down inside.
  solids.shaft(shaft.geo('shaft'), 'y', [0, 0, 0], [[L.shaft.r, L.shaft.bottom], [L.shaft.r, yoke.y0], [yoke.r, yoke.y0], [yoke.r, yoke.y1]], { bore: L.shaft.bore, segments: 32 });

  const stator = new Part('stator');
  solids.plate(stator.geo('core'), 'y', { outer: statorOutline(), holes: [solids.ring(L.stator.bore, 0, 0, 72)] }, y0, y1);
  solids.shaft(stator.geo('aluminium'), 'y', [0, 0, 0], [[L.stator.bore, L.stator.hub[0]], [L.stator.bore, L.stator.hub[1]]], { bore: L.shaft.r, segments: 48 });

  // The field: nine north and nine south poles round the air gap, as the two windings make them at one instant.
  const field = new Part('field', { parent: 'stator' });
  for (let k = 0; k < L.poles; k++) {
    solids.revolve(field.geo(k % 2 ? 'south' : 'north'), 'y', [0, 0, 0], [[L.field.r0, y0], [L.field.r1, y0], [L.field.r1, y1], [L.field.r0, y1], [L.field.r0, y0]], {
      segments: 6,
      start: (k / L.poles) * 2 * Math.PI,
      length: (2 * Math.PI) / L.poles,
      crease: 10,
    });
  }

  // One coil round every tooth: the main winding on the even teeth, the auxiliary on the odd ones, 10° apart, which
  // for 18 poles is a quarter of a cycle.
  const main = new Part('main_winding');
  const aux = new Part('aux_winding');
  const { r0, r1, side, end, clear, round } = L.coil;
  for (let k = 0; k < L.teeth; k++) {
    const part = k % 2 ? aux : main;
    at(part.geo(k % 2 ? 'aux' : 'copper'), (k / L.teeth) * 360, (g) =>
      solids.plate(g, 'x', {
        outer: solids.rect([-side, side], [y0 - end, y1 + end], round),
        holes: [solids.rect([-L.stator.tooth - clear, L.stator.tooth + clear], [y0 - clear, y1 + clear])],
      }, r0, r1),
    );
  }

  // The rotor: a steel can, its laminated ring pressed in, the bottom bearing in its floor.
  const rotor = new Part('rotor');
  const { can } = L;
  solids.shaft(rotor.geo('steel'), 'y', [0, 0, 0], [[can.r, can.bottom], [can.r, can.top]], { bore: can.r - can.wall, segments: 96 });
  solids.shaft(rotor.geo('steel'), 'y', [0, 0, 0], [[can.r, can.bottom], [can.r, can.bottom + can.plate]], { bore: L.bearing.r1, segments: 96 });
  solids.shaft(rotor.geo('steel'), 'y', [0, 0, 0], [[L.bearing.boss, L.bearing.bottom], [L.bearing.boss, can.bottom]], { bore: L.bearing.r1, segments: 40 });
  solids.plate(rotor.geo('core'), 'y', { outer: solids.ring(L.ring.r1, 0, 0, 132), holes: [ringBore()] }, y0, y1);
  bearing(rotor, L.bearing.bottom + 0.5, L.bearing.bottom + 0.5 + L.bearing.w);

  // The cage: 44 aluminium bars in the ring's slots, shorted together by a ring at each end.
  const cage = new Part('cage', { parent: 'rotor' });
  for (let k = 0; k < L.bars; k++) {
    at(cage.geo('aluminium'), ((k + 0.5) / L.bars) * 360, (g) => solids.box(g, [Math.sqrt(L.ring.r0 ** 2 - L.bar.half ** 2), L.bar.r1], [y0, y1], [-L.bar.half, L.bar.half]));
  }
  const { endRing } = L;
  for (const [a, b] of [[y0 - endRing.h, y0], [y1, y1 + endRing.h]]) solids.shaft(cage.geo('aluminium'), 'y', [0, 0, 0], [[endRing.r1, a], [endRing.r1, b]], { bore: endRing.r0, segments: 96 });

  // The can's lid with the top bearing: it turns with the housing, which carries it.
  const lid = new Part('motor_housing');
  solids.shaft(lid.geo('steel'), 'y', [0, 0, 0], [[can.r, L.lid.y0], [can.r, L.lid.y1]], { bore: L.bearing.r1, segments: 96 });
  solids.shaft(lid.geo('steel'), 'y', [0, 0, 0], [[L.bearing.boss, L.lid.y1], [L.bearing.boss, L.bearing.top]], { bore: L.bearing.r1, segments: 40 });
  bearing(lid, L.bearing.top - L.bearing.w - 0.5, L.bearing.top - 0.5);

  // The switch cup: its mounting plate and nut on the shaft's end, and the reverse switch in its wall.
  const cup = new Part('switch_housing');
  solids.shaft(cup.geo('steel'), 'y', [0, 0, 0], [[62, L.cup.mount[0]], [62, L.cup.mount[1]]], { bore: L.shaft.r + 0.1, segments: 64 });
  solids.shaft(cup.geo('steel'), 'y', [0, 0, 0], [[12, L.cup.mount[0] - 4], [12, L.cup.mount[0]]], { bore: L.shaft.r + 0.1, segments: 6 });

  const reverse = new Part('reverse_switch', { parent: 'switch_housing' });
  at(reverse.geo('plastic'), L.reverse.at, (g) => {
    solids.box(g, [143, 156.8], [L.reverse.y - 7, L.reverse.y + 7], [-10, 10]);
    // The slider, out through its slot, at the summer end.
    solids.box(g, [156.8, 163.5], [L.reverse.y - 3, L.reverse.y + 3], [-6.5, -1.5], { round: 0.8 });
  });

  // On the cap: the switch plate, the pull-chain switch with its chain, the capacitor and the leads.
  const cap = new Part('switch_cap');
  const chainAt = polar(L.chain.r, L.chain.at, 0);
  solids.plate(cap.geo('steel'), 'y', { outer: solids.ring(L.cup.plateR, 0, 0, 96), holes: [solids.ring(3, chainAt[0], chainAt[2], 16)] }, ...L.cup.plate);

  const speed = new Part('speed_switch', { parent: 'switch_cap' });
  const [plateLow, plateTop] = L.cup.plate;
  solids.shaft(speed.geo('plastic'), 'y', chainAt, [[12, plateTop], [12, plateTop + 18]], { segments: 32 });
  solids.box(speed.geo('brass'), [chainAt[0] - 5, chainAt[0] + 5], [plateTop + 18, plateTop + 21], [chainAt[2] - 5, chainAt[2] + 5]);
  // A ball chain: 3.2 mm balls every 4 mm on a thin wire, and the fob at its end.
  solids.shaft(speed.geo('brass'), 'y', chainAt, [[0.5, L.chain.bottom], [0.5, plateTop + 2]], { segments: 6 });
  for (let y = plateLow - 3; y > L.chain.bottom; y -= 4) {
    solids.revolve(speed.geo('brass'), 'y', chainAt, Array.from({ length: 7 }, (_, i) => [1.6 * Math.sin((i / 6) * Math.PI), y - 1.6 * Math.cos((i / 6) * Math.PI)]), { segments: 10 });
  }
  solids.shaft(speed.geo('plastic'), 'y', chainAt, [[1.5, L.chain.fob], [4.5, L.chain.fob + 4], [4.5, L.chain.bottom - 2], [1.5, L.chain.bottom]], { segments: 20 });

  const capacitor = new Part('capacitor', { parent: 'switch_cap' });
  const C = L.capacitor;
  shapes.roundedBox(capacitor.geo('capacitor'), C.x, C.y, C.z, 2.5);
  const lead = (colour, points) => shapes.tube(capacitor.geo(colour), smoothPath(points, { steps: 8 }), 1, { segments: 8 });
  const out = L.shaft.bottom - 1;
  // Mains from the shaft to the switch; the switch to the capacitor; the capacitor back to the auxiliary winding's
  // lead; and the reverse switch's lead.
  lead('wire_black', [[0, out, 0], [6, -420, 10], [24, -446, 42], [chainAt[0], -452.5, chainAt[2] - 2]]);
  lead('wire_red', [[chainAt[0] - 4, -452.5, chainAt[2] - 4], [0, -440, 20], [-55, -446, 6], [-58, C.y[1] + 1, 6]]);
  lead('wire_blue', [[-86, C.y[1] + 1, -6], [-60, -440, -12], [-6, -420, -4], [-1.5, out, -1.5]]);
  lead('wire_white', [[1.5, out, 1.5], [-10, -425, 30], [-50, -446, 80], polar(138, L.reverse.at, -452)]);

  return [shaft, stator, field, main, aux, rotor, cage, lid, cup, reverse, cap, speed, capacitor];
}

/** Which piece of the shell a loose island of the body is, by its bounds. */
function shellPart({ min, max, size }) {
  if (max[1] > -1) return 'canopy';
  if (size[1] > 200) return 'downrod';
  if (size[0] < 40) return 'collar';
  if (min[1] < -500) return 'cap';
  if (size[1] > 150) return 'housing';
  return 'coupling';
}

/** The middle of a mesh's cross-section at radius r from the axis (a point inside a thin blade, on its surface). */
function middleAt(mesh, r, band = 12) {
  const near = [];
  for (let i = 0; i < mesh.positions.length; i += 3) {
    const p = mesh.positions.slice(i, i + 3);
    if (Math.abs(Math.hypot(p[0], p[2]) - r) < band) near.push(p);
  }
  return [0, 1, 2].map((d) => near.reduce((s, p) => s + p[d], 0) / near.length);
}

export default async function augment(doc, { data, check = true, log = console.log } = {}) {
  const root = doc.getRoot();
  const scene = root.getDefaultScene() ?? root.listScenes()[0];
  const [bodyNode, bladesNode] = ['ceiling_fan', 'ceiling_fan_blades'].map((name) => root.listNodes().find((n) => n.getName() === name));
  const bodyPrim = bodyNode.getMesh().listPrimitives()[0];
  const skin = bodyPrim.getMaterial();
  const body = surgery.readMesh(bodyPrim);
  const blades = surgery.readMesh(bladesNode.getMesh().listPrimitives()[0]);

  const kit = materialKit(doc);
  const M = {
    inside: kit.material('fan_inside', '#5f5a54', 0.4, 0.6),
    shaft: kit.material('fan_shaft', '#a9aeb4', 1, 0.3),
    core: kit.material('fan_laminations', '#62676d', 0.8, 0.45),
    aluminium: kit.material('fan_aluminium', '#cfd2d6', 0.9, 0.35),
    copper: kit.material('fan_copper', '#c47a3c', 1, 0.32),
    aux: kit.material('fan_red_enamel', '#a3402a', 0.7, 0.3),
    north: kit.material('fan_field_north', '#e8502a', 0, 0.6).setEmissiveFactor([0.75, 0.16, 0.06]),
    south: kit.material('fan_field_south', '#2f6fdb', 0, 0.6).setEmissiveFactor([0.06, 0.2, 0.75]),
    steel: kit.material('fan_steel', '#8d9298', 0.85, 0.42),
    bearing: kit.material('fan_bearing', '#d6dadf', 1, 0.2),
    seal: kit.material('fan_seal', '#202122', 0, 0.6),
    plastic: kit.material('fan_plastic', '#1f2022', 0, 0.55),
    brass: kit.material('fan_brass', '#c39b4c', 1, 0.3),
    capacitor: kit.material('fan_capacitor', '#2b2e33', 0, 0.45),
    wire_black: kit.material('fan_wire_black', '#18191a', 0, 0.5),
    wire_white: kit.material('fan_wire_white', '#e4e2dc', 0, 0.5),
    wire_red: kit.material('fan_wire_red', '#b3261e', 0, 0.5),
    wire_blue: kit.material('fan_wire_blue', '#2459b8', 0, 0.5),
  };

  const pieces = new Map();
  const put = (name, mesh, material = skin) => {
    if (!pieces.has(name)) pieces.set(name, []);
    if (mesh.indices.length) pieces.get(name).push({ mesh, material, key: 'skin', generated: false });
  };
  const radius = (p) => Math.hypot(p[0], p[2]);
  const shell = (name, mesh, thickness) => {
    put(name, mesh);
    put(name, surgery.fromGeo(surgery.solidify(mesh, thickness)), M.inside);
  };

  // ------------------------------------------------------------------ the shell
  const ids = surgery.islands(body);
  const bounds = surgery.islandBounds(body, ids);
  const island = (name) => surgery.pick(body, (t) => shellPart(bounds[ids[t]]) === name);
  put('canopy', island('canopy'));
  put('canopy', island('downrod'));

  // The coupling cover and the trim ring on top of it, which slide up the downrod (14.8 mm) to show the joint: a hole in
  // its floor wide enough to pass the rod, and the ring's bore eased out from 14.9 to 15.5 mm so it clears it.
  const shaftHole = (r, below) => (p) => (p[1] < below ? radius(p) - r : 1);
  let coupling = surgery.cut(island('coupling'), shaftHole(L.rodClear, -286));
  coupling = surgery.pick(coupling, (t) => shaftHole(L.rodClear, -286)(surgery.centroid(coupling, t)) >= 0);
  shell('coupling_cover', coupling, 1.2);
  const collar = island('collar');
  for (let i = 0; i < collar.positions.length; i += 3) {
    const r = Math.hypot(collar.positions[i], collar.positions[i + 2]);
    if (r < L.rodClear) for (const d of [0, 2]) collar.positions[i + d] *= L.rodClear / r;
  }
  put('coupling_cover', collar);

  // The housing: cut into the cover (it turns with the rotor), the rotor's underside, and the switch cup, with a gap
  // between what turns and what doesn't. The floor the model closes the cup with is dropped, the cover gets a hole
  // for the shaft and the cup a slot for the reverse switch.
  let housing = island('housing');
  housing = surgery.pick(housing, (t) => { const c = surgery.centroid(housing, t); return !(Math.abs(c[1] + 461.3) < 0.5 && radius(c) < 141); });
  for (const y of Object.values(L.cut)) housing = surgery.cut(housing, (p) => p[1] - y);
  const topHole = (p) => (p[1] > -290 ? radius(p) - 17 : 1);
  housing = surgery.cut(housing, topHole);
  const slot = (p) => {
    const a = rad(L.reverse.at);
    const along = p[0] * Math.cos(a) + p[2] * Math.sin(a);
    const across = -p[0] * Math.sin(a) + p[2] * Math.cos(a);
    return along > 150 ? Math.max(Math.abs(p[1] - L.reverse.y) - 4, Math.abs(across + 4) - 4) : 1;
  };
  housing = surgery.cut(housing, slot);
  const region = (t) => {
    const c = surgery.centroid(housing, t);
    if (topHole(c) < 0 || slot(c) < 0) return null;
    if (c[1] > L.cut.housing) return 'motor_housing';
    if (c[1] > L.cut.rotor) return 'rotor';
    if (c[1] > L.cut.cup) return null;
    return 'switch_housing';
  };
  for (const name of ['motor_housing', 'rotor', 'switch_housing']) shell(name, surgery.pick(housing, (t) => region(t) === name), 1.5);

  // The cap under the cup, with the pull chain's hole.
  const chainAt = polar(L.chain.r, L.chain.at, 0);
  const chainHole = (p) => (p[1] < -500 ? Math.hypot(p[0] - chainAt[0], p[2] - chainAt[2]) - 3.2 : 1);
  let cap = surgery.cut(island('cap'), chainHole);
  cap = surgery.pick(cap, (t) => chainHole(surgery.centroid(cap, t)) >= 0);
  shell('switch_cap', cap, 1.5);

  // The blades, mirrored so they pitch the way a US fan's do (air down when they turn anticlockwise seen from below),
  // each with its blade iron, numbered round from the front.
  const mirrored = {
    positions: blades.positions.map((v, i) => (i % 3 === 0 ? -v : v)),
    normals: blades.normals.map((v, i) => (i % 3 === 0 ? -v : v)),
    uvs: blades.uvs,
    indices: blades.indices.map((v, i, all) => (i % 3 === 1 ? all[i + 1] : i % 3 === 2 ? all[i - 1] : v)),
  };
  const bladeIds = surgery.islands(mirrored);
  const bladeBounds = surgery.islandBounds(mirrored, bladeIds);
  const azimuth = (b) => ((Math.atan2(b.centre[2], b.centre[0]) * 180) / Math.PI + 360) % 360;
  const bladeName = (b) => `blade_${(Math.round((azimuth(b) - 90) / 90 + 4) % 4) + 1}`;
  const bladeMesh = {};
  const ironMesh = {};
  bladeBounds.forEach((b, i) => {
    const name = bladeName(b);
    const mesh = surgery.pick(mirrored, (t) => bladeIds[t] === i);
    put(name, mesh);
    if (b.size[0] > 400 || b.size[2] > 400) bladeMesh[name] = { mesh, azimuth: azimuth(b) };
    else ironMesh[name] = mesh;
  });

  // ------------------------------------------------------------------ the insides
  const parts = buildInsides();
  piecesOf(parts, M, pieces);
  const PARENT = {
    cage: 'rotor', field: 'stator', reverse_switch: 'switch_housing', speed_switch: 'switch_cap', capacitor: 'switch_cap',
    blade_1: 'rotor', blade_2: 'rotor', blade_3: 'rotor', blade_4: 'rotor',
  };
  const parentOf = (name) => PARENT[name];
  writeNodes(doc, scene, pieces, { parts, parentOf });
  bodyNode.dispose();
  bladesNode.dispose();

  const { toModel, space, mmPerUnit, realSize, unit } = modelSpace(scene);
  runChecks({ label: 'ceiling fan', pieces, contacts: CONTACTS, data, parentOf, mmPerUnit, check, log });
  log(`  ceiling fan: ${pieces.size} parts, ${realSize.join(' × ')} mm`);

  // ------------------------------------------------------------------ hints
  const { y0, y1 } = L.stator;
  const mid = (y0 + y1) / 2;
  const front = 90;
  const bar = ((Math.round((front / 360) * L.bars - 0.5) + 0.5) / L.bars) * 360;
  const anchors = {
    canopy: [0, -25, 125],
    downrod: [0, -150, 14.8],
    coupling_cover: [0, -282, 55],
    housing: [0, -330, 133.8],
    housing_top: [0, -301, 93],
    shaft_top: [0, -250, L.shaft.yoke.r],
    shaft: [0, -300, L.shaft.r],
    shaft_low: [0, -380, L.shaft.r],
    shaft_end: [0, L.shaft.bottom, 0],
    stator: polar(L.stator.r, front, mid),
    stator_top: polar(46, front, y1),
    hub: polar(L.stator.bore, front - 30, L.stator.hub[1]),
    main_coil: polar(75, front + 10, y1 + L.coil.end),
    aux_coil: polar(75, front, y1 + L.coil.end),
    main_coil_low: polar(75, front + 10, y0 - L.coil.end),
    aux_coil_low: polar(75, front, y0 - L.coil.end),
    field: polar(L.field.r1, front, mid),
    field_left: polar(L.field.r1, 165, mid),
    // Tags either side of the motor as the film sees it: the main winding's coil on a tooth to the left (an even
    // tooth), the auxiliary's to the right (an odd one), the cage's bars to the right.
    main_coil_left: polar(75, 160, y1 + L.coil.end),
    aux_coil_right: polar(75, 50, y1 + L.coil.end),
    bars_right: polar(L.bar.r1 - 4, ((Math.round((50 / 360) * L.bars - 0.5) + 0.5) / L.bars) * 360, mid),
    // The film's labels sit at the motor's right-hand edge as its camera sees it (a quarter turn less 20° from the side
    // facing it), so the label runs off to the right instead of over the field: the field in shot 2, from 20° left of
    // the front, and a bar of the cage in shot 3, from the front.
    field_tag: polar(L.field.r1, 40, mid),
    cage_tag: polar(L.bar.r1 - 4, ((Math.round((20 / 360) * L.bars - 0.5) + 0.5) / L.bars) * 360, mid),
    bars: polar(L.bar.r1 - 4, bar, mid),
    cage_ring: polar(100, front, y1 + L.endRing.h),
    rotor_ring: polar(L.ring.r1 - 4, front, y1),
    rotor_can: polar(L.can.r, front, mid),
    rotor_floor: polar(60, front, L.can.bottom),
    rotor_underside: polar(90, front, -361.9),
    bearing_top: polar(L.bearing.boss, front, L.bearing.top - 5),
    bearing_bottom: polar(L.bearing.boss, front, L.bearing.bottom + 5),
    cup: polar(159, front, -455),
    cup_low: polar(158, front, -470),
    cup_mount: polar(40, front, L.cup.mount[1]),
    reverse_switch: local(L.reverse.at, [163.5, L.reverse.y, -4]),
    speed_switch: polar(L.chain.r, L.chain.at, L.cup.plate[1] + 21),
    chain: polar(L.chain.r, L.chain.at, -580),
    chain_top: polar(L.chain.r, L.chain.at, -490),
    fob: polar(L.chain.r + 4.5, L.chain.at, -652),
    capacitor: [(L.capacitor.x[0] + L.capacitor.x[1]) / 2, L.capacitor.y[1], 0],
    capacitor_front: [(L.capacitor.x[0] + L.capacitor.x[1]) / 2, (L.capacitor.y[0] + L.capacitor.y[1]) / 2, L.capacitor.z[1]],
    cap: polar(100, front, -501),
    blade_root: middleAt(bladeMesh.blade_1.mesh, 260),
    blade: middleAt(bladeMesh.blade_1.mesh, 450),
    blade_tip: middleAt(bladeMesh.blade_1.mesh, 680),
    blade_right: middleAt(bladeMesh.blade_4.mesh, 450),
    blade_left: middleAt(bladeMesh.blade_2.mesh, 450),
    blade_back: middleAt(bladeMesh.blade_3.mesh, 450),
    blade_iron: middleAt(ironMesh.blade_1, 160),
    // The current's way down the middle, and the air's down through the blades' disc either side of the motor.
    canopy_centre: [0, -10, 0],
    downrod_centre: [0, -150, 0],
    shaft_centre: [0, -290, 0],
    shaft_motor: [0, mid, 0],
    ...Object.fromEntries([45, 135, 225, 315].flatMap((a, k) => [-180, -400, -580].map((y, i) => [`air_${k}_${i}`, polar(520, a, y)]))),
  };
  const toModelAll = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, toModel(v)]));
  return {
    space,
    pivots: { axis: toModel([0, mid, 0]) },
    anchors: toModelAll(anchors),
    /** Each blade's way out from the axis, for the explode. */
    blades: Object.fromEntries(Object.entries(bladeMesh).map(([name, { azimuth: a }]) => [name, [+Math.cos(rad(a)).toFixed(3), 0, +Math.sin(rad(a)).toFixed(3)]])),
    poles: L.poles,
    teeth: L.teeth,
    bars: L.bars,
    rpm: L.rpm,
    pitch: L.pitch,
    unitPerMm: unit(1),
  };
}
