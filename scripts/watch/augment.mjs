// Build step for the pocket watch (content/pocket-watch.json → build.augment):
// opens the Poly Haven case and puts a working movement inside it.
//
// The source model is a closed case with three hands. This splits the case into the
// pieces that come apart (crystal, dial, case back, crown), adds the inside surfaces,
// and adds a generated movement whose node names the content file refers to. Model
// space must not change, so the scene's bounds are checked before and after.
import { getBounds } from '@gltf-transform/core';
import { KHRMaterialsClearcoat, KHRMaterialsIOR, KHRTextureTransform } from '@gltf-transform/extensions';
import { PLATE, buildMovement, clashes, explodeClashes, flowPaths, layout } from './movement.mjs';
import { genevaStripes, perlage } from './textures.mjs';
import { caseSurfaces, cutCase } from './watchcase.mjs';

const STRIPE = { width: 2.6, angle: (24 * Math.PI) / 180 };
const PERLAGE_TILE = 3.6;
/** Finish UVs span this square (mm) round the axis as 0..1; texture transforms do the tiling. */
const UV_SPAN = 64;

const srgb = (hex) => [0, 2, 4].map((i) => ((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))(parseInt(hex.slice(i + 1, i + 3), 16) / 255));

export default async function augment(doc, { data, log = console.log } = {}) {
  const root = doc.getRoot();
  const scene = root.getDefaultScene() ?? root.listScenes()[0];
  const before = getBounds(scene);
  const size = before.max.map((v, i) => v - before.min[i]);
  const scale = 1 / (0.5 * Math.hypot(...size));
  const offset = [-(before.min[0] + before.max[0]) / 2, -before.min[1], -(before.min[2] + before.max[2]) / 2];
  const toModel = (p) => p.map((v, i) => (v + offset[i]) * scale);
  // The movement frame: mm, origin on the hands' axis (the source origin), z = 0 at the dial's back.
  const dialBackSrcZ = 0.036 / scale - offset[2];
  const frameToSrc = ([x, y, z]) => [x / 1000, y / 1000, z / 1000 + dialBackSrcZ];
  const modelToFrame = ([x, y, z]) => [(x / scale - offset[0]) * 1000, (y / scale - offset[1]) * 1000, (z / scale - offset[2] - dialBackSrcZ) * 1000];
  const axisModel = toModel([0, 0, 0]);

  const watch = root.listNodes().find((n) => n.getName() === 'vintage_pocket_watch');
  const prims = watch.getMesh().listPrimitives();
  const byMaterial = (name) => prims.find((p) => p.getMaterial()?.getName() === name);
  const body = byMaterial('vintage_pocket_watch');
  const glass = byMaterial('vintage_pocket_watch_glass');
  const hub = byMaterial('vintage_pocket_watch_hands');
  const buffer = root.listBuffers()[0];

  // ---------------------------------------------------------------- case cuts
  const shellPositions = [];
  const pos = body.getAttribute('POSITION');
  for (let i = 0; i < pos.getCount(); i++) shellPositions.push(toModel(pos.getElement(i, [])));
  const cut = cutCase({ positions: shellPositions, indices: [...body.getIndices().getArray()] }, axisModel);
  const subPrimitive = (prim, tris) => {
    const indices = prim.getIndices().getArray();
    const map = new Map();
    const order = [];
    const out = [];
    for (const t of tris) {
      for (let k = 0; k < 3; k++) {
        const v = indices[t * 3 + k];
        if (!map.has(v)) {
          map.set(v, order.length);
          order.push(v);
        }
        out.push(map.get(v));
      }
    }
    const next = doc.createPrimitive().setMaterial(prim.getMaterial());
    for (const semantic of prim.listSemantics()) {
      const acc = prim.getAttribute(semantic);
      const n = acc.getElementSize();
      const src = acc.getArray();
      const arr = new src.constructor(order.length * n);
      order.forEach((v, i) => {
        for (let c = 0; c < n; c++) arr[i * n + c] = src[v * n + c];
      });
      next.setAttribute(semantic, doc.createAccessor().setType(acc.getType()).setArray(arr).setNormalized(acc.getNormalized()).setBuffer(buffer));
    }
    next.setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(out)).setBuffer(buffer));
    return next;
  };

  // ------------------------------------------------------------- materials
  const clearcoat = doc.createExtension(KHRMaterialsClearcoat);
  const ior = doc.createExtension(KHRMaterialsIOR);
  const material = (name, hex, metallic, roughness) =>
    doc.createMaterial(name).setBaseColorFactor([...srgb(hex), 1]).setMetallicFactor(metallic).setRoughnessFactor(roughness);
  const stripes = doc.createTexture('geneva_stripes').setImage(await genevaStripes()).setMimeType('image/png').setURI('geneva_stripes.png');
  const pearls = doc.createTexture('perlage').setImage(await perlage()).setMimeType('image/png').setURI('perlage.png');
  const materials = {
    bridge: material('movement_bridge', '#d9dadc', 1, 0.3).setNormalTexture(stripes).setNormalScale(0.9),
    plate: material('movement_plate', '#d4d5d7', 1, 0.36).setNormalTexture(pearls).setNormalScale(0.5),
    nickel: material('movement_polished', '#e2e3e5', 1, 0.13),
    satin: material('movement_satin', '#d6d7d9', 1, 0.34),
    gilt: material('movement_gilt', '#e6bd72', 1, 0.3),
    steel: material('movement_steel', '#cdd0d5', 1, 0.16),
    blued: material('movement_blued_steel', '#2c4fb8', 1, 0.24),
    spring: material('movement_mainspring', '#4b5468', 1, 0.34),
    ruby: material('movement_jewel', '#a3122d', 0, 0.06).setEmissiveFactor(srgb('#2a0208')),
    dial_back: material('dial_back', '#c39a68', 1, 0.48),
    case_inside: material('case_inside', '#a4835f', 1, 0.42),
  };
  materials.ruby.setExtension('KHR_materials_clearcoat', clearcoat.createClearcoat().setClearcoatFactor(1).setClearcoatRoughnessFactor(0.04));
  // Tile the finishes with texture transforms, so the UVs stay in 0..1 and can be quantised.
  const transform = doc.createExtension(KHRTextureTransform);
  materials.bridge.getNormalTextureInfo().setExtension('KHR_texture_transform', transform.createTransform().setScale([UV_SPAN / STRIPE.width, UV_SPAN / STRIPE.width]));
  materials.plate.getNormalTextureInfo().setExtension('KHR_texture_transform', transform.createTransform().setScale([UV_SPAN / PERLAGE_TILE, UV_SPAN / PERLAGE_TILE]));
  materials.ruby.setExtension('KHR_materials_ior', ior.createIOR().setIOR(1.76));

  // Finishes are mapped from the movement's own coordinates, so stripes run straight across every bridge.
  const span = ([u, v]) => [u / UV_SPAN + 0.5, v / UV_SPAN + 0.5];
  const uvFor = {
    bridge: ([x, y]) => span([x * Math.cos(STRIPE.angle) + y * Math.sin(STRIPE.angle), -x * Math.sin(STRIPE.angle) + y * Math.cos(STRIPE.angle)]),
    plate: span,
  };

  /** A glTF primitive from a frame-space Geo, relative to `origin` (frame mm). */
  const primitive = (geo, key, origin = [0, 0, 0]) => {
    const n = geo.vertexCount;
    const positions = new Float32Array(n * 3);
    const normals = new Float32Array(n * 3);
    // Only finishes with a texture need UVs.
    const uv = uvFor[key];
    const uvs = uv ? new Float32Array(n * 2) : null;
    for (let i = 0; i < n; i++) {
      for (let c = 0; c < 3; c++) {
        positions[i * 3 + c] = geo.positions[i * 3 + c] / 1000;
        normals[i * 3 + c] = geo.normals[i * 3 + c];
      }
      if (uvs) uvs.set(uv([geo.positions[i * 3] + origin[0], geo.positions[i * 3 + 1] + origin[1]]), i * 2);
    }
    const accessor = (type, array) => doc.createAccessor().setType(type).setArray(array).setBuffer(buffer);
    const prim = doc
      .createPrimitive()
      .setMaterial(materials[key])
      .setAttribute('POSITION', accessor('VEC3', positions))
      .setAttribute('NORMAL', accessor('VEC3', normals))
      .setIndices(accessor('SCALAR', new Uint32Array(geo.indices)));
    if (uvs) prim.setAttribute('TEXCOORD_0', accessor('VEC2', uvs));
    return prim;
  };
  /** A node holding these primitives; unparented unless added to the scene. */
  const makeNode = (name, primitives, translation = [0, 0, 0]) => {
    const mesh = doc.createMesh(name);
    for (const p of primitives) mesh.addPrimitive(p);
    return doc.createNode(name).setMesh(mesh).setTranslation(translation);
  };
  const addNode = (name, primitives, translation) => {
    const node = makeNode(name, primitives, translation);
    scene.addChild(node);
    return node;
  };

  // ----------------------------------------------------------- case pieces
  // Pieces cut from the shell stay in source space. New surfaces are built in the movement
  // frame and hang from their piece in a child placed at the frame's origin.
  const toFrameRZ = ([r, z]) => {
    const [x, , fz] = modelToFrame([axisModel[0] + r, axisModel[1], z]);
    return [x, fz];
  };
  const surfaces = caseSurfaces(cut, toFrameRZ, { plateFront: PLATE.front });
  const frameOrigin = frameToSrc([0, 0, 0]);
  watch.setName('case');
  const caseMesh = watch.getMesh();
  for (const p of prims) caseMesh.removePrimitive(p);
  caseMesh.addPrimitive(subPrimitive(body, cut.pieces.case));
  watch.addChild(makeNode('case_inside', [primitive(surfaces.inside, 'case_inside')], frameOrigin));
  addNode('case_back', [subPrimitive(body, cut.pieces.back)]).addChild(makeNode('case_back_inside', [primitive(surfaces.backInside, 'case_inside')], frameOrigin));
  addNode('dial', [subPrimitive(body, cut.pieces.dial)]).addChild(makeNode('dial_back', [primitive(surfaces.dialBack, 'dial_back')], frameOrigin));
  addNode('crown', [subPrimitive(body, cut.pieces.crown)]);
  addNode('crystal', [glass]);
  addNode('hand_cap', [hub]);
  body.dispose();

  // ------------------------------------------------------------- movement
  const stemZ = modelToFrame(cut.crownCentre)[2];
  const L = layout({ stemZ });
  const parts = buildMovement(L);
  const found = clashes(parts, { ignore: [['ratchet_wheel', 'crown_wheel'], ['ratchet_wheel', 'ratchet_click'], ['escape_wheel', 'pallet_fork']] });
  if (found.length) throw new Error(`watch movement: parts collide\n  ${found.join('\n  ')}`);
  // Everything has to fit inside the case back.
  for (const part of parts) {
    for (const geo of part.geos.values()) {
      for (let i = 0; i < geo.vertexCount; i++) {
        const x = geo.positions[i * 3] + part.origin[0];
        const y = geo.positions[i * 3 + 1] + part.origin[1];
        const z = geo.positions[i * 3 + 2] + part.origin[2];
        const r = Math.hypot(x, y);
        if (part.name !== 'winding_stem' && r < surfaces.rBand && z < surfaces.zBackAt(r) + 0.6 + 0.05) {
          throw new Error(`watch movement: ${part.name} reaches the case back at r=${r.toFixed(2)} z=${z.toFixed(2)}`);
        }
      }
    }
  }
  // And they have to come apart without passing through each other, as the content file moves them.
  if (data?.parts) {
    const path = explodeClashes(parts, data.parts, 1000 / scale);
    if (path.length) throw new Error(`watch movement: the explode in the content file collides\n  ${path.join('\n  ')}`);
  }
  for (const part of parts) {
    addNode(part.name, [...part.geos.entries()].filter(([, g]) => !g.isEmpty).map(([key, geo]) => primitive(geo, key, part.origin)), frameToSrc(part.origin));
  }

  const after = getBounds(scene);
  const drift = Math.max(...after.min.map((v, i) => Math.abs(v - before.min[i])), ...after.max.map((v, i) => Math.abs(v - before.max[i])));
  if (drift > 1e-6) throw new Error(`watch: the scene's bounds moved by ${drift} m, which would shift model space`);

  const hints = movementHints(L, (p) => toModel(frameToSrc(p)));
  log(`  movement: ${parts.length} parts, stem at z=${stemZ.toFixed(2)} mm, model bounds unchanged`);
  return hints;
}

/** Model-space numbers the content file needs: axes for the moving parts. */
function movementHints(L, toModel) {
  const round = (v) => v.map((x) => +x.toFixed(4));
  return {
    pivots: {
      centre: round(toModel([...L.centre, 0])),
      third: round(toModel([...L.third, 0])),
      escape: round(toModel([...L.escape, 0])),
      pallet: round(toModel([...L.pallet, 0])),
      balance: round(toModel([...L.balance, 0])),
      barrel: round(toModel([...L.barrel, 0])),
      minuteWheel: round(toModel([...L.minuteWheel, 0])),
      crownWheel: round(toModel([...L.crownWheel, 0])),
      click: round(toModel([...L.clickPivot, 0])),
      stem: round(toModel([0, L.pinionY, L.stemZ])),
    },
    // The paths the power takes, for the steps of "How it works" (content "flow").
    flow: Object.fromEntries(Object.entries(flowPaths(L)).map(([name, path]) => [name, path.map(({ part, at }) => ({ node: part, at: round(toModel(at)) }))])),
  };
}
