// Build step for the rangefinder camera (content/rangefinder-camera.json → build.augment):
// opens up the Poly Haven Leica M3 and puts a working camera inside it.
//
// The source model is one closed shell (body, top cover and base in one piece), a lens and a
// strap. This cuts the shell into the pieces that come off (top cover, base plate, back door),
// gives them their insides, splits the lens into the parts that move when it's focused, drops
// the strap (keeping its rings), and adds the mechanism: the rangefinder, the shutter, the film
// and its transport (mechanism.mjs). Everything is built in the camera frame: millimetres, the
// source's axes (x across toward the rewind knob, y up, z out through the lens).
import { getBounds } from '@gltf-transform/core';
import { centroid, cut, islandBounds, islands, isEmpty, merge, pick, readMesh, solidify, fromGeo, writePrimitive } from '../../scripts/kit/surgery.mjs';
import { checkClashes, checkExplode } from '../../scripts/kit/parts.mjs';
import { buildMechanism, LENS_AXIS, materialsFor, partHints } from './mechanism.mjs';

/** Where the shell is cut (mm). The seams are where the leatherette meets the top cover and the base plate. */
export const CUT = {
  top: 55.3,
  bottom: 5.2,
  /** The back door: everything behind this plane, within the door's width. */
  doorBack: -15.3,
  doorHalfWidth: 46.85,
  /** The lens: the depth-of-field ring ends at a groove; the bayonet is the outer ring at the back. */
  focusGroove: 27.4,
  bayonetRadius: 18.15,
  bayonetFront: 18.3,
  /** The dark disc the model hides the empty camera behind. */
  blindRadius: 17.6,
};
const WALL = { top: 0.8, body: 1.2, bottom: 1.0 };
/** The tripod socket in the base plate, under the take-up spool (x, z). */
const TRIPOD = [-52.9, 1.0];
/** The top cover's windows and eyepiece (mm): their outline and the plane of their glass. */
const WINDOWS = [
  { x: [-27, -18.5], y: [64.5, 70.2], glass: 17.2 },
  { x: [12, 28.2], y: [61.4, 73.6], glass: 16.4 },
  { x: [35.8, 55.2], y: [60.3, 74.5], glass: 16.4 },
  { x: [36.5, 55], y: [58, 76.5], glass: -16.7 },
];
/** Parts that touch by design: the film on the sprocket's teeth and wound onto the take-up roll, the moving lens on its
 *  arm, the iris blades in the barrel's slot, the advance lever's shaft through the top cover. */
const CONTACTS = [
  ['film', 'sprocket'],
  ['film', 'take_up_spool'],
  ['swinging_lens', 'roller_lever'],
  ['iris_blade_*', 'optics'],
  ['iris_ring', 'optics'],
  ['advance_lever', 'top_plate'],
  ['release_button', 'top_plate'],
  ['rf_cam', 'optics'],
  // Gears in mesh.
  ['advance_gear', 'idler_gear'],
  ['idler_gear', 'sprocket'],
  ['advance_gear', 'spool_idler'],
  ['spool_idler', 'spool_drive'],
];

const radius = ([x, y]) => Math.hypot(x - LENS_AXIS[0], y - LENS_AXIS[1]);

export default async function augment(doc, { data, log = console.log, check = true } = {}) {
  const root = doc.getRoot();
  const scene = root.getDefaultScene() ?? root.listScenes()[0];
  const buffer = root.listBuffers()[0];
  const node = (name) => root.listNodes().find((n) => n.getName() === name);
  const camera = node('Camera_01');
  const strap = node('Camera_01_strap');
  const prims = camera.getMesh().listPrimitives();
  const byMaterial = (name) => prims.find((p) => p.getMaterial()?.getName() === name);
  const shellPrim = byMaterial('Camera_01_body');
  const glassPrim = byMaterial('Camera_01_lens');
  const lensPrim = byMaterial('Camera_01_lens_body');
  const mountPrim = byMaterial('Camera_01_strap');
  const shellMaterial = shellPrim.getMaterial();
  const glassMaterial = glassPrim.getMaterial();
  const lensMaterial = lensPrim.getMaterial();
  const M = await materialsFor(doc);

  const pieces = new Map();
  /** Adds a mesh to a named piece, with the material it's drawn in. */
  const put = (name, mesh, material, generated = false) => {
    if (isEmpty(mesh)) return;
    if (!pieces.has(name)) pieces.set(name, []);
    pieces.get(name).push({ mesh, material, generated });
  };

  // ------------------------------------------------------------------ shell
  // Small islands go whole to the piece they sit on; only the big shell island is cut.
  const shell = readMesh(shellPrim);
  const shellIslands = islands(shell);
  const shellBounds = islandBounds(shell, shellIslands);
  const main = shellBounds.reduce((best, b, i) => (b.triangles > shellBounds[best].triangles ? i : best), 0);
  const named = (b) => {
    const [x, y, z] = b.centre;
    const near = (cx, cz, r = 1.5) => Math.hypot(x - cx, z - cz) < r && y > CUT.top;
    if (near(-17.85, 1.45)) return 'speed_dial';
    if (near(-43.7, 5.8)) return 'release_button';
    if (near(61.75, 0.95)) return 'rewind_knob';
    if (y > CUT.top && b.size[0] > 30 && b.size[2] > 25) return 'advance_lever';
    if (y > CUT.top) return 'top_plate';
    if (y < CUT.bottom + 1) return 'bottom_plate';
    if (z < -15 && Math.abs(x) < CUT.doorHalfWidth) return 'back_door';
    return 'body';
  };
  // The windows were dark boxes behind their glass; they become openings, so the optics behind them show.
  const behindGlass = (t) => {
    const [x, y, z] = centroid(shell, t);
    return WINDOWS.some((w) => x > w.x[0] && x < w.x[1] && y > w.y[0] && y < w.y[1] && (w.glass > 0 ? z < w.glass - 0.3 && z > 0 : z > w.glass + 0.3 && z < 0));
  };
  const cutShell = cut(cut(pick(shell, (t) => shellIslands[t] === main && !behindGlass(t)), ([, y]) => y - CUT.top), ([, y]) => y - CUT.bottom);
  const region = (t) => {
    const [x, y, z] = centroid(cutShell, t);
    // The tripod socket's tube rises into the take-up chamber; it is part of the base plate.
    if (y < 8 && Math.hypot(x - TRIPOD[0], z - TRIPOD[1]) < 5.2) return 'bottom_plate';
    if (y > CUT.top) return 'top_plate';
    if (y < CUT.bottom) return 'bottom_plate';
    if (z < CUT.doorBack && Math.abs(x) < CUT.doorHalfWidth) return 'back_door';
    return 'body';
  };
  const shellPieces = {};
  for (const name of ['top_plate', 'body', 'bottom_plate', 'back_door']) shellPieces[name] = pick(cutShell, (t) => region(t) === name);
  // The door's inside face was the body's back under it: plain paint, not leatherette.
  const doorInside = (t) => {
    const door = shellPieces.back_door;
    const [a, b, c] = [0, 1, 2].map((k) => door.indices[t * 3 + k]);
    const p = [a, b, c].map((v) => door.positions.slice(v * 3, v * 3 + 3));
    const nz = (p[1][0] - p[0][0]) * (p[2][1] - p[0][1]) - (p[1][1] - p[0][1]) * (p[2][0] - p[0][0]);
    return centroid(door, t)[2] > -15.6 && nz > 0;
  };
  put('back_door', pick(shellPieces.back_door, (t) => !doorInside(t)), shellMaterial);
  put('back_door', pick(shellPieces.back_door, doorInside), M.paint);
  for (const name of ['top_plate', 'body', 'bottom_plate']) put(name, shellPieces[name], shellMaterial);
  shellBounds.forEach((b, i) => {
    if (i !== main) put(named(b), pick(shell, (t) => shellIslands[t] === i), shellMaterial);
  });
  // The pieces that came off get their insides: a cover, a casting and a base plate of real thickness.
  put('top_plate', fromGeo(solidify(shellPieces.top_plate, WALL.top)), M.inside);
  put('body', fromGeo(solidify(shellPieces.body, WALL.body)), M.casting);
  put('bottom_plate', fromGeo(solidify(shellPieces.bottom_plate, WALL.bottom)), M.inside);

  // ------------------------------------------------------------------- glass
  const glass = readMesh(glassPrim);
  const glassIslands = islands(glass);
  islandBounds(glass, glassIslands).forEach((b, i) => {
    const element = radius(b.centre) < 2 && b.centre[2] > 10;
    put(element ? 'optics' : 'top_plate', pick(glass, (t) => glassIslands[t] === i), glassMaterial);
  });

  // -------------------------------------------------------------------- lens
  // The focusing ring turns and the optical unit slides forward inside the bayonet; the
  // depth-of-field ring and the bayonet stay put.
  const lens = readMesh(lensPrim);
  const lensIslands = islands(lens);
  const lensBounds = islandBounds(lens, lensIslands);
  lensBounds.forEach((b, i) => {
    const mesh = pick(lens, (t) => lensIslands[t] === i);
    if (b.size[0] < 5) put('lens', mesh, lensMaterial); // the red index dot, on the fixed ring
    else if (b.size[0] < 20) put('focus_ring', mesh, lensMaterial); // the focusing tab
    else if (b.min[2] > 53) put('hood', mesh, lensMaterial);
    else if (b.min[2] > 41.5 && b.max[2] < 52) put('aperture_ring', mesh, lensMaterial);
    else if (b.min[2] > 17 && b.max[2] < 43) {
      const ring = cut(mesh, ([, , z]) => z - CUT.focusGroove);
      put('lens', pick(ring, (t) => centroid(ring, t)[2] < CUT.focusGroove), lensMaterial);
      put('focus_ring', pick(ring, (t) => centroid(ring, t)[2] >= CUT.focusGroove), lensMaterial);
    } else {
      // The inner barrel: its outer rings at the back are the bayonet, the rest holds the glass.
      const fixed = (t) => {
        const c = centroid(mesh, t);
        return c[2] < CUT.bayonetFront && radius(c) > CUT.bayonetRadius;
      };
      put('lens', pick(mesh, fixed), lensMaterial);
      put('optics', pick(mesh, (t) => !fixed(t)), lensMaterial);
    }
  });
  // The mount ring, without the dark disc that hid the empty camera behind the lens. It and the strap's rings were
  // drawn with the strap's textures; plain paint and chrome do, and the strap's textures can go.
  const mount = readMesh(mountPrim);
  put('lens', pick(mount, (t) => radius(centroid(mount, t)) > CUT.blindRadius), M.paint);

  // ------------------------------------------------------------------- strap
  // The strap lies on the table in front of the camera; its split rings stay on the lugs.
  const strapMesh = readMesh(strap.getMesh().listPrimitives()[0]);
  const strapIslands = islands(strapMesh);
  const strapBounds = islandBounds(strapMesh, strapIslands);
  const strapMain = strapBounds.reduce((best, b, i) => (b.triangles > strapBounds[best].triangles ? i : best), 0);
  strapBounds.forEach((b, i) => {
    if (i !== strapMain) put('body', pick(strapMesh, (t) => strapIslands[t] === i), M.chrome);
  });

  // --------------------------------------------------------------- mechanism
  const parts = buildMechanism();
  for (const part of parts) {
    for (const [key, geo] of part.geos) {
      if (geo.isEmpty) continue;
      const mesh = fromGeo(geo);
      if (part.uv1?.has(geo)) mesh.uv1 = part.uv1.get(geo);
      put(part.name, mesh, M[key], true);
    }
  }

  // ------------------------------------------------------------------- nodes
  // The source's own nodes go; every piece becomes a node at the camera's origin, nested as
  // the parts ride on each other (a dial on the top cover, the hood on the optics).
  const PARENT = {
    speed_dial: 'top_plate', release_button: 'top_plate', advance_lever: 'top_plate', rewind_knob: 'top_plate',
    focus_ring: 'lens', optics: 'lens', aperture_ring: 'optics', hood: 'optics',
    ...Object.fromEntries(parts.filter((p) => p.parent).map((p) => [p.name, p.parent])),
  };
  const nodes = new Map();
  for (const [name, list] of pieces) {
    const mesh = doc.createMesh(name);
    // One primitive per material.
    const byMat = new Map();
    for (const { mesh: m, material } of list) {
      if (!byMat.has(material)) byMat.set(material, []);
      byMat.get(material).push(m);
    }
    for (const [material, meshes] of byMat) {
      const merged = merge(...meshes);
      mesh.addPrimitive(writePrimitive(doc, buffer, merged, material, { uvs: !!material.getBaseColorTexture() || !!material.getNormalTexture(), uv1: merged.uv1 }));
    }
    nodes.set(name, doc.createNode(name).setMesh(mesh));
  }
  for (const part of parts) {
    if (!nodes.has(part.name)) nodes.set(part.name, doc.createNode(part.name));
    if (part.extras) nodes.get(part.name).setExtras(part.extras);
  }
  for (const [name, n] of nodes) {
    const parent = PARENT[name] && nodes.get(PARENT[name]);
    (parent ?? scene).addChild(n);
  }
  camera.dispose();
  strap.dispose();
  for (const p of [shellPrim, glassPrim, lensPrim, mountPrim]) p.dispose();
  strap.getMesh()?.dispose();

  const bounds = getBounds(scene);
  const size = bounds.max.map((v, i) => v - bounds.min[i]);
  const scale = 1 / (0.5 * Math.hypot(...size));
  const offset = [-(bounds.min[0] + bounds.max[0]) / 2, -bounds.min[1], -(bounds.min[2] + bounds.max[2]) / 2];
  const toModel = (mm) => mm.map((v, i) => +(((v / 1000 + offset[i]) * scale).toFixed(4)));

  // ------------------------------------------------------------------ checks
  // Generated parts mustn't overlap anything, and the content file's explode mustn't pass one piece through another.
  const fail = (message) => {
    if (check) throw new Error(message);
    log(`  (not checked) ${message}`);
  };
  const clashes = checkClashes(pieces, { ignore: CONTACTS });
  if (clashes.length) fail(`camera: parts collide\n  ${clashes.join('\n  ')}`);
  if (data?.parts?.length) {
    const path = checkExplode(pieces, data.parts, (name) => PARENT[name], 1000 / scale);
    if (path.length) fail(`camera: the explode in the content file collides\n  ${path.join('\n  ')}`);
  }
  log(`  camera: ${nodes.size} nodes, ${size.map((v) => (v * 1000).toFixed(1)).join(' × ')} mm`);
  return partHints(toModel, scale);
}
