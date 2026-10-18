// Build step for __TITLE__ (content/__SLUG__.json → build.generate). The whole model is built
// here with the kit, in millimetres in the object's frame: x to its right, y up, z towards its
// front. One Part is one node the viewer can take apart; part.geo(key) adds meshes in material `key`.
//
// It starts as a working demo (a crank turns a 40-tooth gear, which drives a 16-tooth one) so the
// page runs end to end from the first minute. Replace it part by part with the object from the
// truth sheet, keeping the shape: numbers (L) → buildParts() → generate() → hints.
import { solids, shapes, Part, assemble, modelSpace, runChecks, meshPhase, centreDistance } from '../../scripts/kit/index.mjs';

/** The numbers that matter, in mm. The content builder gets them through the hints, never by hand. */
export const L = {
  module: 1.5,
  large: { teeth: 40, at: [-22, 55] },
  small: { teeth: 16 },
  gearZ: [-23, -17],
  plateZ: [-30, -24],
  handle: 27,
};
L.small.at = [L.large.at[0] + centreDistance(L.module, L.large.teeth, L.small.teeth), L.large.at[1]];

/** Pairs that touch by design (gears in mesh, a part on its mount, a shaft in its plate); the clash check
 *  lets these be, and fails on any other contact. 'name*' matches a prefix. */
export const CONTACTS = [
  ['gear_large', 'gear_small'],
  ['upright', 'base'],
  ['gear_large', 'upright'],
  ['gear_small', 'upright'],
  ['crank', 'gear_large'],
];

export function buildParts() {
  const base = new Part('base');
  shapes.roundedBox(base.geo('paint'), [-75, 75], [0, 10], [-34, 34], 3);

  const upright = new Part('upright');
  solids.box(upright.geo('paint'), [-70, 70], [10, 100], L.plateZ, { round: 4, axis: 'z' });

  const large = new Part('gear_large');
  const a = { center: L.large.at, teeth: L.large.teeth, module: L.module, phase: 0 };
  solids.spur(large.geo('brass'), 'z', [...L.large.at, 0], a, ...L.gearZ);
  solids.shaft(large.geo('steel'), 'z', [...L.large.at, 0], [[3, L.plateZ[1]], [3, -12]]);

  const small = new Part('gear_small');
  const phase = meshPhase(a, { center: L.small.at, teeth: L.small.teeth, module: L.module });
  solids.spur(small.geo('brass'), 'z', [...L.small.at, 0], { teeth: L.small.teeth, module: L.module, phase }, ...L.gearZ);
  solids.shaft(small.geo('steel'), 'z', [...L.small.at, 0], [[2.5, L.plateZ[1]], [2.5, -14]]);

  // The crank rides on the large gear (its node is the gear's child), so it turns with it.
  const crank = new Part('crank', { parent: 'gear_large' });
  const [cx, cy] = L.large.at;
  solids.box(crank.geo('steel'), [cx - 3.5, cx + 3.5], [cy - 3.5, cy + L.handle + 3], [-12, -9], { round: 2, axis: 'z' });
  solids.shaft(crank.geo('wood'), 'z', [cx, cy + L.handle, 0], [[4, -9], [4.6, 2], [4, 14]]);

  return [base, upright, large, small, crank];
}

export default async function generate({ data, check = true, log = console.log } = {}) {
  const parts = buildParts();
  const { doc, scene, nodes, pieces, parentOf } = await assemble({
    name: '__SLUG__',
    parts,
    // Material names are global in the viewer: prefix them with the object.
    materials: (doc, { material }) => ({
      paint: material('__SLUG___paint', '#2f3337', 0.3, 0.55),
      brass: material('__SLUG___brass', '#c9a04a', 1, 0.32),
      steel: material('__SLUG___steel', '#c3c7cc', 1, 0.28),
      wood: material('__SLUG___wood', '#6b3f22', 0, 0.62),
    }),
  });
  const { toModel, space, mmPerUnit, realSize } = modelSpace(scene);
  runChecks({ label: '__SLUG__', pieces, contacts: CONTACTS, data, parentOf, mmPerUnit, check, log });
  log(`  __SLUG__: ${nodes.size} nodes, ${realSize.join(' × ')} mm`);
  // Everything the content file places, in model space and by name: pivots for motions, anchors for
  // callouts, tags and flow lines. The content builder refers to these names and never types a coordinate.
  const [cx, cy] = L.large.at;
  const [sx, sy] = L.small.at;
  return {
    doc,
    hints: {
      space,
      pivots: { gear_large: toModel([cx, cy, -20]), gear_small: toModel([sx, sy, -20]) },
      anchors: {
        handle: toModel([cx, cy + L.handle, 14]),
        large_face: toModel([cx, cy, -17]),
        small_face: toModel([sx, sy, -17]),
        large_top: toModel([cx, cy + 33, -17]),
        small_top: toModel([sx, sy + 15, -17]),
        mesh: toModel([(cx + sx) / 2, cy, -20]),
      },
      teeth: { large: L.large.teeth, small: L.small.teeth },
    },
  };
}
