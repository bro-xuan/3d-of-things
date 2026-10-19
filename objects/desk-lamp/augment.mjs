// Build step for the desk lamp (content/desk-lamp.json → build.augment): opens Poly Haven's "Desk Lamp Arm 01",
// a spring-balanced lamp of the Anglepoise kind, and makes it work. Millimetres, x across the arm, y up, z from the
// base towards the elbow (the head reaches back over the base, to −z).
//
// Poly Haven rigged the lamp in Blender, but the glTF it serves carries no skin, joints or armature: one node, one
// mesh, two primitives (the lamp and the bulb's glass) made of 49 loose pieces. So the pieces are sorted into the
// arm's real links by where they sit (checked against their centres, so a changed source fails loudly), and the
// links are nested the way they ride on each other. Two things are changed:
//   - The parallelograms are made exact. As modelled the parallel link was 4.6 mm longer than the lower arm and the
//     upper link's pins leaned 7.8° off the upright, which would leave the upper arm out of balance by up to 13%:
//     the link's elbow pin moves 4.5 mm, the upper link and its pins about 5 mm.
//   - The springs were textured cylinders, rigid. They're replaced by coils built here, hooked on the same pins, so
//     the viewer can stretch them (src/viewer/stretch.ts reads each spring's `spring` extras).
// The numbers below are the ones src/viewer/balancedarm.ts balances: change one, change both.
import { surgery, shapes, Part, materialKit, piecesOf, writeNodes, modelSpace, runChecks } from '../../scripts/kit/index.mjs';

/** Pivots and spring pins (mm), from the mesh's pins, trued so both parallelograms are exact. */
export const L = (() => {
  const O1 = [0, 24.3, 0]; // shoulder pin: the lower arm on the base bracket
  const P1 = [0, 40.4, 31.7]; // the parallel link's pin on the base bracket
  const E = [0, 370.1, 274.7]; // elbow pin: lower arm, elbow plates and upper bar
  const H1 = [0, 677.4, -73.4]; // the upper bar's pin in the head bracket
  const a1 = 65.7; // lower springs' anchor, straight above the shoulder pin
  const b1 = 215.8; // their pin along the lower arm
  const a2 = 36.3; // upper springs' anchor (the upper link's pin), straight above the elbow pin
  const b2 = 218.1; // their pin along the upper bar
  const along = (p, q, d) => {
    const v = q.map((c, i) => c - p[i]);
    const l = Math.hypot(...v);
    return p.map((c, i) => +(c + (v[i] / l) * d).toFixed(2));
  };
  const plus = (p, v) => p.map((c, i) => +(c + v[i]).toFixed(2));
  const minus = (p, q) => p.map((c, i) => c - q[i]);
  const A1 = plus(O1, [0, a1, 0]);
  const A2 = plus(E, [0, a2, 0]);
  return {
    O1, P1, E, H1, A1, A2, a1, b1, a2, b2,
    P2: plus(P1, minus(E, O1)), // the link's elbow pin: the parallelogram's fourth corner
    H2: plus(H1, minus(A2, E)), // the upper link's pin in the head bracket
    B1: along(O1, E, b1),
    B2: along(E, H1, b2),
    /** As modelled, before truing: where the moved pins were. */
    model: { P2: [0, 389.6, 309.4], Q: [0, 406.1, 279.6], H2: [0, 714.4, -68.2] },
  };
})();

/** The springs: chrome wire coiled 9 mm across, a hook round its pin at each end. The lower ones lean in, to hang on
 *  their pin between the lower arm's side bars. */
export const SPRING = { wire: 0.6, coil: 3.9, hook: 4.4, shank: 6, pitch: 2.5, lower: { x: [12.3, 5] }, upper: { x: [12.3, 12.3] } };

/** Pairs that touch by design: each spring's hooks on its pins. */
export const CONTACTS = [
  ['lower_spring*', 'base_bracket'], ['lower_spring*', 'lower_arm'],
  ['upper_spring*', 'elbow_plates'], ['upper_spring*', 'upper_bar'],
];

/** Every loose piece of the source mesh, by its number, the part it goes to and its centre (mm) as modelled. */
const PIECES = [
  [0, 'elbow_plates', [6.1, 387.9, 293.8]], [1, 'elbow_plates', [-6.1, 387.9, 293.8]],
  [2, 'lower_arm', [18.4, 197.2, 137.6]], [3, 'lower_arm', [-18.4, 197.2, 137.6]],
  [4, 'upper_link', [0, 560.3, 105.4]], [5, 'upper_bar', [0, 524, 100.5]], [6, 'lower_link', [0, 215.1, 170.7]],
  [7, 'elbow_plates', [0, 406.1, 279.6]], [8, 'head_bracket', [0, 714.4, -68.2]], [9, 'head_bracket', [0, 677.4, -73.4]],
  [10, 'elbow_plates', [-3.7, 370.1, 274.7]], [11, 'elbow_plates', [0, 389.6, 309.4]], [12, 'head_bracket', [0, 694.9, -100.9]],
  [13, 'lower_arm', [0, 193.2, 134.3]], [14, 'base_bracket', [0, 24.3, 0]], [15, 'base_bracket', [12.4, 90, 0.6]],
  [16, 'base_bracket', [-12.4, 90, 0.6]], [17, 'upper_bar', [0, 514.6, 111.4]], [18, 'base_bracket', [0, 9.1, 32.1]],
  [19, 'shade', [0.3, 696.6, -113.8]], [20, 'shade', [-17.6, 693.8, -199.3]], [21, 'shade', [8.5, 727.3, -120.9]],
  // The modelled springs (cylinders with a coil texture) and their hooks, replaced below.
  ...[22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33].map((i) => [i, null, null]),
  [34, 'clamp_screw', [0, -54.1, 1.7]], [35, 'clamp_screw', [0, -83.9, 9.5]], [36, 'base_bracket', [0, 19.8, 41.7]],
  [37, 'base_bracket', [0, 40.4, 31.7]], [38, 'lamp_holder', [16.3, 761.4, -143.1]], [39, 'bulb', [12.4, 745.9, -150.5]],
  [40, 'upper_link', [0, 710.6, -56.3]], [41, 'upper_link', [0, 417.3, 274.1]], [42, 'lower_link', [0, 389.1, 302.6]],
  [43, 'head_bracket', [6.1, 695.5, -85]], [44, 'head_bracket', [-6.1, 695.5, -85]], [45, 'base_bracket', [0, 49.4, 18.2]],
  [46, 'clamp', [0, -28.3, 11.8]], [47, 'head_bracket', [5.9, 734.7, -94]], [48, 'elbow_plates', [-0.1, 406.3, 288]],
];

/** What each part rides on: moving a link moves everything on it. */
export const PARENT = {
  lower_arm: 'base_bracket', lower_link: 'base_bracket', lower_spring_left: 'base_bracket', lower_spring_right: 'base_bracket',
  elbow_plates: 'lower_arm', upper_bar: 'elbow_plates', upper_link: 'elbow_plates', upper_spring_left: 'elbow_plates', upper_spring_right: 'elbow_plates',
  head_bracket: 'upper_bar', shade: 'head_bracket', bulb: 'shade', lamp_holder: 'shade',
  clamp_screw: 'clamp',
};

/** A map of the y–z plane taking p0 to q0 and p1 to q1 (a turn, a scale and a shift), applied to a mesh in place. */
function remap(mesh, [p0, p1], [q0, q1]) {
  const v = [p1[1] - p0[1], p1[2] - p0[2]];
  const w = [q1[1] - q0[1], q1[2] - q0[2]];
  const s = Math.hypot(...w) / Math.hypot(...v);
  const turn = Math.atan2(w[1], w[0]) - Math.atan2(v[1], v[0]);
  const [c, n] = [Math.cos(turn), Math.sin(turn)];
  for (let i = 0; i < mesh.positions.length; i += 3) {
    const y = mesh.positions[i + 1] - p0[1];
    const z = mesh.positions[i + 2] - p0[2];
    mesh.positions[i + 1] = q0[1] + s * (c * y - n * z);
    mesh.positions[i + 2] = q0[2] + s * (n * y + c * z);
    if (mesh.normals) {
      const [ny, nz] = [mesh.normals[i + 1], mesh.normals[i + 2]];
      mesh.normals[i + 1] = c * ny - n * nz;
      mesh.normals[i + 2] = n * ny + c * nz;
    }
  }
}

const shift = (mesh, d) => {
  for (let i = 0; i < mesh.positions.length; i += 3) for (let k = 0; k < 3; k++) mesh.positions[i + k] += d[k];
};

/** A coil spring's wire from its hook round the pin at `a` to its hook round the pin at `b`: the centreline, its
 *  axis, and where along a→b the coil starts and ends (the viewer spreads the coil and carries the far hook). */
export function springPath(a, b, { coil = SPRING.coil, hook = SPRING.hook, shank = SPRING.shank, pitch = SPRING.pitch } = {}) {
  const d = b.map((c, i) => c - a[i]);
  const length = Math.hypot(...d);
  const u = d.map((c) => c / length);
  // n: across the spring in the plane the arm moves in; m: along the pins.
  let n = [0, -u[2], u[1]];
  const nl = Math.hypot(...n);
  n = n.map((c) => c / nl);
  const m = [u[1] * n[2] - u[2] * n[1], u[2] * n[0] - u[0] * n[2], u[0] * n[1] - u[1] * n[0]];
  const at = (t, p = 0, q = 0) => a.map((c, i) => c + u[i] * t + n[i] * p + m[i] * q);
  const t0 = hook + shank;
  const t1 = length - hook - shank;
  const turns = Math.round((t1 - t0) / pitch);
  const pts = [];
  // The near hook: once round the pin, leaving it on the spring's axis.
  for (let k = 0; k <= 16; k++) {
    const g = Math.PI * 2 * (k / 16);
    pts.push(at(hook * Math.cos(g), hook * Math.sin(g)));
  }
  // The coil, starting and ending on the same side so the shanks run straight in.
  const steps = turns * 12;
  for (let k = 0; k <= steps; k++) {
    const g = Math.PI * 2 * turns * (k / steps);
    pts.push(at(t0 + ((t1 - t0) * k) / steps, coil * Math.cos(g), coil * Math.sin(g)));
  }
  // The far hook, round its pin.
  for (let k = 0; k <= 16; k++) {
    const g = Math.PI + Math.PI * 2 * (k / 16);
    pts.push(at(length + hook * Math.cos(g), hook * Math.sin(g)));
  }
  return { pts, u, length, coil: [t0, t1], turns };
}

export function buildSprings() {
  const parts = [];
  for (const [arm, from, to] of [['lower', L.A1, L.B1], ['upper', L.A2, L.B2]]) {
    for (const side of ['left', 'right']) {
      const sign = side === 'right' ? 1 : -1;
      const [xa, xb] = SPRING[arm].x;
      const a = [sign * xa, from[1], from[2]];
      const b = [sign * xb, to[1], to[2]];
      const { pts, u, coil, turns } = springPath(a, b);
      const span = Math.hypot(b[1] - a[1], b[2] - a[2]);
      const name = `${arm}_spring_${side}`;
      const spring = { arm, anchor: a, axis: u.map((c) => +c.toFixed(6)), coil: coil.map((t) => +t.toFixed(2)), span: +span.toFixed(2), turns };
      const part = new Part(name, { parent: PARENT[name], extras: { spring } });
      shapes.tube(part.geo('spring'), pts, SPRING.wire, { segments: 6 });
      parts.push(part);
    }
  }
  return parts;
}

export default async function augment(doc, { data, check = true, log = console.log } = {}) {
  const root = doc.getRoot();
  const scene = root.getDefaultScene() ?? root.listScenes()[0];
  const source = root.listNodes().find((n) => n.getMesh());
  const [shell, glass] = source.getMesh().listPrimitives();
  const lacquer = shell.getMaterial();
  const mesh = surgery.readMesh(shell);
  const ids = surgery.islands(mesh);
  const bounds = surgery.islandBounds(mesh, ids);
  if (bounds.length !== PIECES.length) throw new Error(`desk lamp: the source has ${bounds.length} pieces, not ${PIECES.length}: has it changed?`);

  const pieces = new Map();
  const add = (name, entry) => pieces.set(name, [...(pieces.get(name) ?? []), entry]);
  const byIndex = new Map();
  for (const [i, name, centre] of PIECES) {
    if (!name) continue;
    const off = Math.hypot(...bounds[i].centre.map((c, k) => c - centre[k]));
    if (off > 1) throw new Error(`desk lamp: piece ${i} (${name}) is ${off.toFixed(1)} mm from where it was modelled: has the source changed?`);
    const piece = surgery.pick(mesh, (t) => ids[t] === i);
    byIndex.set(i, piece);
    add(name, { mesh: piece, material: lacquer, key: 'lacquer', generated: false });
  }
  add('bulb', { mesh: surgery.readMesh(glass), material: glass.getMaterial(), key: 'glass', generated: false });

  // True the parallelograms: the parallel link (bar and stop) onto its new elbow pin; the upper link (bar and clips)
  // and its two pins onto theirs.
  for (const i of [6, 42]) remap(byIndex.get(i), [L.P1, L.model.P2], [L.P1, L.P2]);
  shift(byIndex.get(11), L.P2.map((c, k) => c - L.model.P2[k]));
  for (const i of [4, 40, 41]) remap(byIndex.get(i), [L.model.Q, L.model.H2], [L.A2, L.H2]);
  shift(byIndex.get(7), L.A2.map((c, k) => c - L.model.Q[k]));
  shift(byIndex.get(8), L.H2.map((c, k) => c - L.model.H2[k]));

  const kit = materialKit(doc);
  const M = { spring: kit.material('lamp_spring_steel', '#c7cacd', 1, 0.28) };
  const springs = buildSprings();
  piecesOf(springs, M, pieces);
  const parentOf = (n) => PARENT[n];
  writeNodes(doc, scene, pieces, { parts: springs, parentOf });
  source.dispose();

  const { toModel, space, mmPerUnit, realSize, unit } = modelSpace(scene);
  runChecks({ label: 'desk lamp', pieces, contacts: CONTACTS, data, parentOf, mmPerUnit, check, log });
  log(`  desk lamp: ${pieces.size} parts, ${realSize.join(' × ')} mm`);

  const at = (p, x = 0) => toModel([x, p[1], p[2]]);
  const mid = (p, q, x = 0) => toModel([x, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2]);
  return {
    space,
    pivots: { shoulder: at(L.O1), link: at(L.P1), elbow: at(L.E), upper_link: at(L.A2), head: at(L.H1), lower_anchor: at(L.A1), upper_anchor: at(L.A2) },
    anchors: {
      shoulder: at(L.O1, 30), lower_anchor: at(L.A1, 22), lower_pin: at(L.B1, 20), elbow: at(L.E, 26), link_elbow: at(L.P2, 10),
      upper_anchor: at(L.A2, 20), upper_pin: at(L.B2, 20), head: at(L.H1, 10), head_link: at(L.H2, 10),
      lower_spring: mid(L.A1, L.B1, 10), upper_spring: mid(L.A2, L.B2, 18),
      lower_arm: mid(L.O1, L.E, 27), lower_link: mid(L.P1, L.P2, 5), upper_bar: mid(L.E, L.H1, 5), upper_link: mid(L.A2, L.H2, 5),
      shade: toModel([-17.6, 693.8, -199.3]), shade_top: toModel([10, 790, -150]), shade_mouth: toModel([-18, 615, -235]),
      bulb: toModel([-4.5, 695.5, -176.5]), holder: toModel([16.3, 761.4, -143.1]),
      base: toModel([0, 60, 25]), clamp: toModel([0, -28, 40]), screw: toModel([0, -84, 9.5]),
    },
    unitPerMm: unit(1),
  };
}
