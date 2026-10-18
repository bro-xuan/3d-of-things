// Build step for the bicycle pump (content/bicycle-pump.json → build.augment): opens Poly Haven's
// "Tire Pump", a floor pump in one mesh, and gives it the insides that make it work. Millimetres, x across
// the handle, y up, z towards the front. The mesh's loose pieces are sorted into parts by where they sit;
// what a pump needs inside is generated: the piston on the rod with its cup seal, the air's way out of
// the barrel's foot through the base, and the ball valve that keeps the tyre's air from coming back.
import { surgery, solids, shapes, Part, materialKit, piecesOf, writeNodes, modelSpace, runChecks, hiddenDriver } from '../../scripts/kit/index.mjs';

/** The numbers that matter (mm), from the truth sheet and the mesh. */
export const L = {
  axis: [0, -25.5],
  bore: 15,
  rod: 6.5,
  piston: { y0: 47, y1: 71 },
  stroke: 420,
  cap: 506,
  ball: { at: [0, 41, 8.5], r: 3.4 },
  channelY: 26,
};

/** Pairs that touch by design: the barrel in the base, the hose on its fitting, the rod through the cap. */
export const CONTACTS = [
  ['barrel', 'base'], ['barrel', 'top_cap'], ['plunger', 'top_cap'], ['hose', 'base'], ['hose', 'barrel'], ['hose', 'head'],
  ['head', 'barrel'], ['check_valve', 'base'], ['stroke', 'base'],
];

/** Which part a loose piece of the mesh belongs to, by its bounds. */
function partFor({ min, max }) {
  const span = max.map((v, i) => v - min[i]);
  if (min[0] > 45 && min[1] > 300) return 'head';
  if (span[1] > 300 && span[0] > 200) return 'plunger';
  if (span[1] > 300 && max[0] > 50) return 'hose';
  if (span[1] > 300) return 'barrel';
  if (min[1] > 570) return 'plunger';
  if (min[1] > 495) return 'top_cap';
  return 'base';
}

/** A ball of radius r at `at`, turned about a vertical line. */
function ball(geo, at, r, n = 14) {
  const profile = Array.from({ length: n + 1 }, (_, i) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI;
    return [Math.max(0, r * Math.cos(a)), at[1] + r * Math.sin(a)];
  });
  solids.revolve(geo, 'y', at, profile, { segments: 20 });
}

export function buildInsides() {
  const [x, z] = L.axis;
  const plunger = new Part('plunger');
  // The rod in the mesh stops short of the barrel's foot: carry it down to the piston.
  solids.shaft(plunger.geo('steel'), 'y', [x, 0, z], [[L.rod, L.piston.y1], [L.rod, 104]]);
  // The piston: an aluminium plug, and under it the rubber cup with its lip facing down.
  solids.shaft(plunger.geo('aluminium'), 'y', [x, 0, z], [[12.5, L.piston.y1 - 10], [12.5, L.piston.y1]]);
  solids.revolve(plunger.geo('rubber'), 'y', [x, 0, z], [[9.5, L.piston.y1 - 10], [9.5, L.piston.y0 + 6], [13.2, L.piston.y0], [L.bore - 0.4, L.piston.y0], [11.6, L.piston.y1 - 9], [11.6, L.piston.y1 - 10]], { segments: 40 });
  solids.shaft(plunger.geo('steel'), 'y', [x, 0, z], [[4, L.piston.y0 + 4], [4, L.piston.y1 - 10]]);

  const base = new Part('base');
  // The air's way out: across the base from the barrel's foot to the outlet under the hose, a seat for the ball.
  shapes.tube(base.geo('dark'), [[x, 30, z], [x, L.channelY, z], [x, L.channelY, L.ball.at[2]], [x, L.ball.at[1] - L.ball.r - 3, L.ball.at[2]]], 2.2, { segments: 10 });
  solids.shaft(base.geo('brass'), 'y', [L.ball.at[0], 0, L.ball.at[2]], [[3.6, L.ball.at[1] - L.ball.r - 1], [3.6, L.ball.at[1] - L.ball.r + 0.2]]);

  const valve = new Part('check_valve', { parent: 'base' });
  ball(valve.geo('ball'), L.ball.at, L.ball.r);

  // Turns once for each stroke; the plunger and the valve follow it (crank and cam motions in the content).
  const stroke = hiddenDriver('stroke', { parent: 'base', at: [x, 12, z] });
  return [plunger, base, valve, stroke];
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

  // The mesh's own pieces, sorted into parts; they keep the model's textured material.
  const pieces = new Map();
  bounds.forEach((b, i) => {
    if (!b) return;
    const name = partFor(b);
    const list = pieces.get(name) ?? [];
    list.push({ mesh: surgery.pick(mesh, (t) => ids[t] === i), material: skin, key: 'skin', generated: false });
    pieces.set(name, list);
  });

  const kit = materialKit(doc);
  const M = {
    steel: kit.material('pump_steel', '#b8bdc2', 1, 0.3),
    aluminium: kit.material('pump_aluminium', '#c4c8cc', 1, 0.4),
    rubber: kit.material('pump_rubber', '#262728', 0, 0.75),
    dark: kit.material('pump_channel', '#3a3c3e', 0, 0.6),
    brass: kit.material('pump_brass', '#c49a45', 1, 0.35),
    ball: kit.material('pump_ball', '#1b1c1d', 0, 0.4),
  };
  const parts = buildInsides();
  piecesOf(parts, M, pieces);
  // Poly Haven modelled the handle pushed down. Stand it at the top of its stroke instead, so every view of the
  // model holds the whole stroke (the content's crank then drives it down from here).
  for (const piece of pieces.get('plunger')) for (let i = 1; i < piece.mesh.positions.length; i += 3) piece.mesh.positions[i] += L.stroke;
  for (const name of ['barrel', 'top_cap', 'hose', 'head']) if (!pieces.has(name)) pieces.set(name, []);
  const parentOf = (n) => parts.find((p) => p.name === n)?.parent;
  writeNodes(doc, scene, pieces, { parts, parentOf });
  source.dispose();

  const { toModel, space, mmPerUnit, realSize, unit } = modelSpace(scene);
  runChecks({ label: 'bicycle pump', pieces, contacts: CONTACTS, data, parentOf, mmPerUnit, check, log });
  log(`  bicycle pump: ${pieces.size} parts, ${realSize.join(' × ')} mm`);

  const [x, z] = L.axis;
  return {
    space,
    pivots: { stroke: toModel([x, 300, z]) },
    anchors: {
      handle: toModel([90, 575 + L.stroke, z]),
      handle_mid: toModel([0, 570 + L.stroke, z]),
      rod: toModel([x, 700, z]),
      cap: toModel([x, 524, z]),
      cap_side: toModel([x + 18, 515, z]),
      barrel: toModel([x + 16.5, 300, z]),
      barrel_top: toModel([x, 480, z]),
      piston: toModel([x + L.bore, L.piston.y1 - 6 + L.stroke, z]),
      cup: toModel([x + L.bore, L.piston.y0 + 3 + L.stroke, z]),
      below_piston: toModel([x, L.piston.y0 - 4 + L.stroke, z]),
      barrel_low: toModel([x + 16.5, 140, z]),
      barrel_foot: toModel([x, 30, z]),
      channel: toModel([x, L.channelY, -8]),
      ball: toModel(L.ball.at),
      fitting_top: toModel([L.ball.at[0], 60, L.ball.at[2]]),
      hose_up: toModel([30, 300, 0]),
      hose_top: toModel([60, 545, 0]),
      head: toModel([80, 425, -8]),
      base: toModel([95, 20, 0]),
      foot: toModel([-95, 10, 0]),
    },
    stroke: L.stroke,
    unitPerMm: unit(1),
  };
}
