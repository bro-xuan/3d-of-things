// The generator kit: one import for everything a model built in code needs. The building
// blocks stay where the objects that grew them keep them (so those models rebuild byte for
// byte); this file names them, and assemble.mjs and content.mjs hold the glue each generator
// used to copy. New objects import from here only.
//
//   import { geometry, solids, shapes, gears, Part, assemble, modelSpace, runChecks } from '../../scripts/kit/index.mjs';
//
// Units: millimetres, in the object's own frame (x to its right, y up, z towards its front);
// assemble() writes metres, which the viewer's scale bar and drawings rely on.

/** Meshes from scratch: Geo (an indexed mesh), extrude, flat, lathe, cylinder, turned, ribbon, spiral,
 *  2D loops (circle, inset, ccw/cw, pointInLoop), contours of a 2D distance field (sd, smin), place, alongAxis. */
export * as geometry from '../watch/geometry.mjs';

/** Gear outlines with real tooth counts (gear, escapeWheel), spoked wheels (windows, wheelHoles), polar. */
export * as gears from '../watch/shapes.mjs';

/** Solids along any axis: put, plate, rect, box, hole, ring, shaft, revolve, spur (a gear on an axis), localCentre. */
export * as solids from '../camera/solids.mjs';

/** Cast and machined shapes: roundedBox, flutes (knurling), band and face (engraved rings), roundRect,
 *  projectUVs, tube (wires, springs, cables along a path), helix, conicalGear, gearOutline, openHoles, sdCircle, sdRect. */
export * as shapes from '../hasselblad/shapes.mjs';

/** Cutting a downloaded shell open: readMesh, cut, islands, islandBounds, pick, merge, solidify (thicken inward
 *  with rims on the cut edges), fromGeo, writePrimitive. */
export * as surgery from '../camera/surgery.mjs';

/** Painted textures (PNG buffers): leatherGrain, engraving (SVG scales), screenMarkings, rollFilm. */
export * as textures from '../hasselblad/textures.mjs';

/** Watch finishes as normal maps: genevaStripes, perlage. */
export * as finishes from '../watch/textures.mjs';

/** Lofted bodies through profile curves (a car's shell): loft, with curve (monotone cubic) and lines. */
export { loft } from '../cars/body.mjs';
export { curve, lines } from '../cars/loft.mjs';

/** Wheels: tyreSize, tyre, rim, brakeDisc, caliper. */
export * as wheels from '../cars/wheels.mjs';

/** A part (a glTF node): `new Part(name, { parent, extras })`, then `part.geo(materialKey)` for its meshes.
 *  The checks, and optics helpers (thin-lens extension, iris blade angle) and cloth curtains. */
export { Part, checkClashes, checkExplode, clothPath, extensionFor, irisAngle } from '../camera/mechanism.mjs';

export { srgb, materialKit, piecesOf, writeNodes, assemble, modelSpace, runChecks, inModel, hiddenDriver } from './assemble.mjs';
export { meshPhase, centreDistance } from './gearing.mjs';

/** Paths for hoses, cables and belts: smoothPath(points) through 3D points, beltPath(a, b) round two pulleys. */
export { smoothPath, beltPath } from './paths.mjs';
