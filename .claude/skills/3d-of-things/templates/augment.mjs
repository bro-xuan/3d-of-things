// Build step for __TITLE__ (content/__SLUG__.json → build.augment): opens the downloaded model and
// gives it the insides a closed shell never had. It runs on the Poly Haven glTF before compression.
//
// It starts as a pass-through, so the page works from the first build. The usual shape, from the
// Leica's (scripts/camera/augment.mjs, the full example) and the watch's (scripts/watch/augment.mjs):
//   1. Read the shell's meshes as pieces in mm: surgery.readMesh(primitive), with { generated: false }.
//   2. Cut them along planes into the parts that come off (surgery.cut, then surgery.pick by side),
//      and thicken each cut piece inward with a rim on its cut edge (surgery.solidify), so it isn't hollow.
//   3. Build the insides as Parts with the kit from the truth sheet's numbers (generate.mjs's demo shows how).
//   4. piecesOf(parts, M, pieces), writeNodes(doc, scene, pieces, { parts, parentOf }), dispose the source's
//      own nodes, then runChecks() and return hints: pivots and anchors in model space, by name.
import { modelSpace } from '../../scripts/kit/index.mjs';

/** Pairs that touch by design; the clash check lets these be. 'name*' matches a prefix. */
export const CONTACTS = [];

export default async function augment(doc) {
  const scene = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0];
  const { space } = modelSpace(scene);
  return { space, pivots: {}, anchors: {} };
}
