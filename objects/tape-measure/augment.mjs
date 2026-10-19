// Build step for the tape measure (content/tape-measure.json → build.augment): opens Poly Haven's
// "Measuring Tape 01", a 3 m tape in one mesh, and builds what's inside it. Millimetres in the model's
// frame: x across the case (the drum's axis), y up, z out of the mouth. The case is cut into its two
// halves at the parting line and given walls; the fake inside of the mouth goes, and a slot opens under
// the lock button for the brake. Generated from the truth sheet (tape.mjs holds the numbers): the drum
// on its post, the blade wound on the drum and out through the mouth, the spiral spring inside the drum,
// the end hook with its rivets in slots, and the brake shoe under the button. The blade and the spring
// carry their layouts for the viewer, which bends them as the blade comes out (src/viewer/strip.ts).
import { surgery, solids, Part, materialKit, piecesOf, writeNodes, modelSpace, runChecks } from '../../scripts/kit/index.mjs';
import { L, bladeLayout, springLayout, bladePath, springPath, stripGeo, maxOut } from './tape.mjs';
import { bladeScale, PRINTED } from './scale.mjs';

/** The first stretch of blade carries the numbered centimetres; past it a 10 cm tile of ticks repeats. */
const NUMBERED = 256;
const TILE = 100;

/** Pairs that touch by design. */
export const CONTACTS = [
  ['case_left', 'case_right'],
  ['belt_clip', 'case_right'],
  ['lock_button', 'case_*'],
  ['brake', 'lock_button'],
  ['drum', 'blade'],
  ['recoil_spring', 'drum'],
  ['recoil_spring', 'spring_post'],
  ['spring_post', 'case_right'],
  ['hook_rivets', 'blade'],
  ['hook_rivets', 'end_hook'],
];

/** The front slope the lock button sits in: up the slope and out of it, as (y, z). */
const SLOPE = { up: [0.848, -0.53], out: [0.53, 0.848] };
/** The slot under the button for the brake's stem: along the slope (s) and across (x). */
const SLOT = { s: [18, 22], x: 3, n: [45, 47.4] };
/** The opening behind the mouth that the blade and the hook's leg run through (the source's was a 7 mm slot). */
const MOUTH = { x: 10.3, y: [10.4, 15.0], z: [13, 29.5] };
/** The mouth's lower lip thins to half a millimetre at its front: it keeps the source's skin, with no wall inside. */
const lip = (c) => Math.abs(c[0]) < 13 && c[2] > 29 && c[1] < 11.2;
/** How far the button presses in to lock. */
export const PRESS = 2;

const onSlope = (s, n) => [s * SLOPE.up[0] + n * SLOPE.out[0], s * SLOPE.up[1] + n * SLOPE.out[1]];
const along = ([, y, z]) => y * SLOPE.up[0] + z * SLOPE.up[1];
const outOf = ([, y, z]) => y * SLOPE.out[0] + z * SLOPE.out[1];

/** Which loose piece of the source mesh is which, by its bounds. */
function pieceFor({ min, max, size, triangles }) {
  if (size[2] > 80 && size[0] < 10) return 'strap';
  if (triangles > 1000) return 'case';
  if (min[0] > 17) return 'belt_clip';
  if (min[1] > 25 && size[0] > 15) return 'lock_button';
  if (max[1] < 8 && size[0] > 15) return 'case';
  if (size[0] > 19 && min[1] < 4) return 'hook';
  return 'rivets';
}

/** A disc or ring across x: radius r0..r1 between x0 and x1, about the drum's axis. */
function ring(geo, r0, r1, x0, x1, segments = 160) {
  const [cy, cz] = L.centre;
  solids.revolve(geo, 'x', [0, cy, cz], [[r0, x0], [r1, x0], [r1, x1], [r0, x1]], { segments, crease: 30 });
}

function buildInsides() {
  const [cy, cz] = L.centre;
  const spring = springLayout();
  const blade = bladeLayout(spring);
  const parts = [];

  // The drum: a hub the blade winds on, its inside the spring's barrel; a flange on the closed side, a lip on the open one.
  const drum = new Part('drum');
  const hubOut = L.blade.hub - L.blade.thickness / 2 - 0.05;
  ring(drum.geo('drum'), spring.wall + 0.03, hubOut, L.drum.open[1], L.drum.closed[0]);
  ring(drum.geo('drum'), L.drum.bore, L.drum.flange, L.drum.closed[0], L.drum.closed[1]);
  ring(drum.geo('drum'), spring.wall + 0.4, L.blade.hub + 1.2, L.drum.open[0], L.drum.open[1]);
  parts.push(drum);

  // The blade, wound on the hub and out through the mouth to the hook: its numbered start and the rest, printed.
  const bladePart = new Part('blade', { extras: { strip: blade } });
  const half = L.blade.width / 2;
  // The top face printed (read from above, the hook to the left), the back and edges plain.
  const across = (x, side) => (side > 0 ? ((x + half) / L.blade.width) * PRINTED : (1 + PRINTED) / 2);
  const xs = [-half, -half / 2, 0, half / 2, half];
  const start = stripGeo(blade, bladePath(blade, 0).at, { step: L.blade.step, xs, from: 0, to: NUMBERED, uv: (u, x, side) => [u / NUMBERED, across(x, side)] });
  const rest = stripGeo(blade, bladePath(blade, 0).at, { step: L.blade.step, xs, from: NUMBERED, uv: (u, x, side) => [(u - NUMBERED) / TILE, across(x, side)] });
  bladePart.geos.set('blade_start', start.geo);
  bladePart.geos.set('blade', rest.geo);
  bladePart.uv1 = new Map([[start.geo, start.values], [rest.geo, rest.values]]);
  parts.push(bladePart);

  // The spring, from the post to the drum's wall.
  const springPart = new Part('recoil_spring', { extras: { strip: spring } });
  const sw = L.spring.width / 2;
  const { geo: springGeo, values: springValues } = stripGeo(spring, springPath(spring, 0).at, { step: L.spring.step, xs: [-sw, sw] });
  springPart.geos.set('spring', springGeo);
  springPart.uv1 = new Map([[springGeo, springValues]]);
  parts.push(springPart);

  // The end hook: its leg along the blade with a slot for each rivet, its lip down the front.
  const h = L.hook;
  const top = L.blade.throat[0] + L.blade.thickness / 2 + 0.04;
  const legY = [top, top + h.thickness];
  const hook = new Part('end_hook');
  const hw = h.width / 2;
  const slots = h.rivets.map((z) => solids.rect([-(h.shank + 0.05), h.shank + 0.05], [z - h.shank - h.thickness - 0.05, z + h.shank + 0.05], h.shank));
  solids.plate(hook.geo('hook'), 'y', { outer: solids.rect([-hw, hw], [h.leg[0], h.leg[1]], 0.8), holes: slots.map((loop) => loop.slice().reverse()) }, legY[0], legY[1]);
  solids.box(hook.geo('hook'), [-hw, hw], [h.lip[0], legY[1]], [h.leg[1], h.leg[1] + h.thickness]);
  parts.push(hook);

  // The rivets, fixed in the blade: a shank through it and the hook's slot, a domed head on top.
  const rivets = new Part('hook_rivets');
  for (const z of h.rivets) {
    solids.shaft(rivets.geo('rivet'), 'y', [0, 0, z], [[h.shank, L.blade.throat[0] - 0.05], [h.shank, legY[1]], [h.head, legY[1]], [h.head * 0.92, legY[1] + 0.35], [h.head * 0.6, legY[1] + 0.7], [0.01, legY[1] + 0.82]], { segments: 28 });
  }
  parts.push(rivets);

  // The brake, on the button: a stem down through the slot, an arm inside the front wall, a shoe over the blade.
  const brake = new Part('brake', { parent: 'lock_button' });
  const stemS = [18.8, 21.2];
  const stemN = [42.4, 46.72];
  const corners = [[stemS[0], stemN[0]], [stemS[1], stemN[0]], [stemS[1], stemN[1]], [stemS[0], stemN[1]]].map(([s, n]) => onSlope(s, n));
  const ccw = (loop) => (loop.reduce((acc, [x0, y0], i) => { const [x1, y1] = loop[(i + 1) % loop.length]; return acc + x0 * y1 - x1 * y0; }, 0) > 0 ? loop : loop.slice().reverse());
  solids.plate(brake.geo('brake'), 'x', { outer: ccw(corners.map(([y, z]) => [z, y])) }, -2.5, 2.5);
  const A = onSlope(20, stemN[0] + 0.6);
  const shoe = { y: [L.blade.throat[0] + L.blade.thickness / 2 + PRESS * SLOPE.out[0] + 0.02, 14.4], z: [12.5, 20.3] };
  const B = [shoe.y[1] - 0.4, 19.4];
  const d = [B[0] - A[0], B[1] - A[1]];
  const len = Math.hypot(...d);
  const w = 1.2;
  const nrm = [-d[1] / len, d[0] / len];
  const arm = [[A[0] + nrm[0] * w, A[1] + nrm[1] * w], [B[0] + nrm[0] * w, B[1] + nrm[1] * w], [B[0] - nrm[0] * w, B[1] - nrm[1] * w], [A[0] - nrm[0] * w, A[1] - nrm[1] * w]];
  solids.plate(brake.geo('brake'), 'x', { outer: ccw(arm.map(([y, z]) => [z, y])) }, -2, 2);
  solids.box(brake.geo('shoe'), [-4.5, 4.5], shoe.y, shoe.z, { round: 0.6, axis: 'y' });
  parts.push(brake);

  // The post the spring's inner end hooks on and the drum turns about: moulded into the right half (its own part here,
  // so it stays in the drum when the case comes apart), seated in a boss on that half's wall.
  const post = new Part('spring_post');
  solids.shaft(post.geo('post'), 'x', [0, cy, cz], [[L.spring.post, -15.2], [L.spring.post, L.case.inside + 0.3]], { segments: 40 });
  parts.push(post);
  // In the right half: the post's boss, and the mouth's guide the blade runs out on.
  const right = new Part('case_right');
  solids.shaft(right.geo('case_inside'), 'x', [0, cy, cz], [[7.2, 12.6], [7.2, L.case.inside + 0.3]], { bore: L.spring.post + 0.02, segments: 40 });
  const ledgeTop = L.blade.throat[0] - L.blade.thickness / 2 - 0.06;
  solids.box(right.geo('case_inside'), [-10.2, 10.2], [ledgeTop - 1.6, ledgeTop], [L.blade.throat[1], 28.2]);
  solids.box(right.geo('case_inside'), [1, 3], [5.6, ledgeTop - 1.5], [12, 26]);
  parts.push(right);

  return { parts, blade, spring, legY, shoe };
}

export default async function augment(doc, { data, check = true, log = console.log } = {}) {
  const root = doc.getRoot();
  const scene = root.getDefaultScene() ?? root.listScenes()[0];
  const source = root.listNodes().find((n) => n.getMesh());
  const prim = source.getMesh().listPrimitives()[0];
  const skin = prim.getMaterial();
  const mesh = surgery.readMesh(prim);
  const ids = surgery.islands(mesh);
  const bounds = surgery.islandBounds(mesh, ids);
  const kinds = bounds.map((b) => pieceFor(b));
  const islandsOf = (kind) => surgery.pick(mesh, (t) => kinds[ids[t]] === kind);

  // The case: the dark wedge that faked the mouth's inside goes and the wall behind the mouth opens, a slot opens under
  // the button, and it's cut in two at the parting line, each half given a 2 mm wall.
  let shell = islandsOf('case');
  for (const f of [(p) => p[0] + MOUTH.x, (p) => p[0] - MOUTH.x, (p) => p[1] - MOUTH.y[0], (p) => p[1] - MOUTH.y[1]]) shell = surgery.cut(shell, f);
  const mouthFake = (c) => Math.abs(c[0]) < MOUTH.x && c[1] > MOUTH.y[0] && c[1] < MOUTH.y[1] && c[2] > MOUTH.z[0] && c[2] < MOUTH.z[1];
  shell = surgery.pick(shell, (t) => !mouthFake(surgery.centroid(shell, t)));
  for (const f of [(p) => p[0] + SLOT.x, (p) => p[0] - SLOT.x, (p) => along(p) - SLOT.s[0], (p) => along(p) - SLOT.s[1]]) shell = surgery.cut(shell, f);
  const inSlot = (c) => Math.abs(c[0]) < SLOT.x && along(c) > SLOT.s[0] && along(c) < SLOT.s[1] && outOf(c) > SLOT.n[0] && outOf(c) < SLOT.n[1];
  shell = surgery.pick(shell, (t) => !inSlot(surgery.centroid(shell, t)));
  shell = surgery.cut(shell, (p) => p[0]);
  const halves = {
    case_left: surgery.pick(shell, (t) => surgery.centroid(shell, t)[0] < 0),
    case_right: surgery.pick(shell, (t) => surgery.centroid(shell, t)[0] >= 0),
  };

  const kit = materialKit(doc);
  const M = {
    case_inside: kit.material('tape_case_inside', '#2b2d30', 0, 0.7),
    post: kit.material('tape_post', '#34373b', 0, 0.6),
    drum: kit.material('tape_drum', '#d9d4c7', 0, 0.55),
    blade_start: kit.textured('tape_blade_start', await bladeScale({ from: 0, to: NUMBERED, width: L.blade.width, pxPerMm: 8, zero: L.hook.zero, numbers: true }), 0.3, 0.4).setDoubleSided(true),
    blade: kit.textured('tape_blade', await bladeScale({ from: NUMBERED, to: NUMBERED + TILE, width: L.blade.width, pxPerMm: 10.24, zero: L.hook.zero, numbers: false }), 0.3, 0.4).setDoubleSided(true),
    spring: kit.material('tape_spring', '#3c4250', 0.9, 0.32).setDoubleSided(true),
    hook: kit.material('tape_hook', '#b9bcc0', 1, 0.3),
    rivet: kit.material('tape_rivet', '#c9ccd0', 1, 0.25),
    brake: kit.material('tape_brake', '#e3c11f', 0, 0.45),
    shoe: kit.material('tape_shoe', '#2a2a2a', 0, 0.8),
  };

  const pieces = new Map();
  const put = (name, m, material, generated = false) => {
    const list = pieces.get(name) ?? [];
    list.push({ mesh: m, material, key: material === skin ? 'skin' : 'inside', generated });
    pieces.set(name, list);
  };
  for (const [name, half] of Object.entries(halves)) {
    put(name, half, skin);
    const walled = surgery.pick(half, (t) => !lip(surgery.centroid(half, t)));
    put(name, surgery.fromGeo(surgery.solidify(walled, L.case.wall)), M.case_inside, true);
  }
  put('belt_clip', islandsOf('belt_clip'), skin);
  put('lock_button', islandsOf('lock_button'), skin);
  // The source's hook and rivets are replaced by ones with slots; its strap is left off.

  const { parts, blade, spring, legY, shoe } = buildInsides();
  piecesOf(parts, M, pieces);
  const PARENT = { brake: 'lock_button', belt_clip: 'case_right' };
  const parentOf = (n) => PARENT[n];
  writeNodes(doc, scene, pieces, { parts, parentOf });
  source.dispose();

  const { toModel, space, mmPerUnit, realSize, unit } = modelSpace(scene);
  runChecks({ label: 'tape measure', pieces, contacts: CONTACTS, data, parentOf, mmPerUnit, check, log });
  const turns = (bladePath(blade, maxOut(blade)).drum - bladePath(blade, 0).drum) / (2 * Math.PI);
  log(`  tape measure: ${pieces.size} parts, ${realSize.join(' × ')} mm; blade ${blade.length.toFixed(0)} mm, ${turns.toFixed(1)} drum turns; spring ${spring.length} mm, ${spring.turns.toFixed(1)} turns at home`);

  const [cy, cz] = L.centre;
  const rest = bladePath(blade, 0);
  const roll = rest.roll;
  const at = (s, n, x = 0) => toModel([x, ...onSlope(s, n)]);
  return {
    space,
    unitPerMm: unit(1),
    pivots: { drum: toModel([0, cy, cz]) },
    /** Model-space directions: out of the mouth, and the button's press. */
    out: [0, 0, 1],
    press: [0, -SLOPE.out[0], -SLOPE.out[1]],
    pressMm: PRESS,
    blade,
    anchors: {
      hook_lip: toModel([0, 7, L.hook.leg[1] + L.hook.thickness]),
      hook_top: toModel([0, legY[1], 36]),
      rivet: toModel([0, legY[1] + 0.8, L.hook.rivets[1]]),
      rivet_back: toModel([0, legY[1] + 0.8, L.hook.rivets[0]]),
      blade_tip: toModel([0, L.blade.throat[0], L.blade.tip]),
      mouth: toModel([0, L.blade.throat[0] + 0.1, 28.6]),
      throat: toModel([0, L.blade.throat[0], L.blade.throat[1]]),
      touch: toModel([0, rest.touchPoint[0], rest.touchPoint[1]]),
      roll_bottom: toModel([0, cy - roll, cz]),
      roll_front: toModel([0, cy, cz + roll]),
      roll_top: toModel([0, cy + roll, cz]),
      roll_side: toModel([-L.blade.width / 2, cy + roll * 0.7, cz - roll * 0.7]),
      drum_flange: toModel([L.drum.closed[1], cy + L.drum.flange * 0.8, cz - L.drum.flange * 0.4]),
      drum_lip: toModel([L.drum.open[0], cy - L.blade.hub * 0.75, cz + L.blade.hub * 0.6]),
      spring_side: toModel([-L.spring.width / 2, cy + spring.wall * 0.62, cz - spring.wall * 0.62]),
      spring_outer: toModel([-L.spring.width / 2, cy - spring.wall + 1, cz]),
      spring_inner: toModel([-L.spring.width / 2, cy + L.spring.post + 1.5, cz]),
      post: toModel([-14, cy + L.spring.post, cz]),
      centre: toModel([0, cy, cz]),
      button: at(26, 52.4),
      button_low: at(9, 52.4),
      stem: at(20, 44),
      shoe: toModel([0, shoe.y[1], (shoe.z[0] + shoe.z[1]) / 2]),
      shoe_front: toModel([4.5, (shoe.y[0] + shoe.y[1]) / 2, shoe.z[1]]),
      clip: toModel([23, 47, -6]),
      case_left: toModel([-17.6, 42, -16]),
      case_right: toModel([17.6, 30, -24]),
      case_top: toModel([0, 73.6, -6]),
      front: toModel([0, 11.5, 60]),
      ahead: toModel([0, 11.5, 140]),
    },
  };
}
