// The glue every model built in code needs, written once: materials, parts into glTF nodes,
// model space, and the clash and explode checks. Lifted from objects/reflex-camera/generate.mjs
// and scripts/kit/cars/generate.mjs, which keep their own copies so their models don't change.
import { Document, getBounds } from '@gltf-transform/core';
import { KHRMaterialsIOR, KHRMaterialsTransmission, KHRTextureTransform } from '@gltf-transform/extensions';
import { fromGeo, merge, writePrimitive } from './surgery.mjs';
import { Part, checkClashes, checkExplode } from './parts.mjs';
import { box } from './solids.mjs';

/** A '#rrggbb' colour as linear RGB, as glTF wants it. */
export const srgb = (hex) => [0, 2, 4].map((i) => ((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))(parseInt(hex.slice(i + 1, i + 3), 16) / 255));

/** Material makers for one document. Name materials after the object (`leica_chrome`), since names are global in the viewer. */
export function materialKit(doc) {
  let transmission;
  let ior;
  let transform;
  const material = (name, hex, metallic = 0, roughness = 0.5) =>
    doc.createMaterial(name).setBaseColorFactor([...srgb(hex), 1]).setMetallicFactor(metallic).setRoughnessFactor(roughness);
  const texture = (name, png) => doc.createTexture(name).setImage(png).setMimeType('image/png').setURI(`${name}.png`);
  const textured = (name, png, metallic = 0, roughness = 0.5) => material(name, '#ffffff', metallic, roughness).setBaseColorTexture(texture(name, png));
  const glass = (name, hex = '#f4f6ff', { index = 1.52 } = {}) => {
    transmission ??= doc.createExtension(KHRMaterialsTransmission);
    ior ??= doc.createExtension(KHRMaterialsIOR);
    return material(name, hex, 0, 0.02)
      .setExtension('KHR_materials_transmission', transmission.createTransmission().setTransmissionFactor(1))
      .setExtension('KHR_materials_ior', ior.createIOR().setIOR(index));
  };
  /** Tiles a texture slot: `tile(material.getNormalTextureInfo(), [22, 22])`. */
  const tile = (info, scale) => {
    transform ??= doc.createExtension(KHRTextureTransform);
    info.setExtension('KHR_texture_transform', transform.createTransform().setScale(scale));
  };
  return { material, texture, textured, glass, tile };
}

/** Adds each part's meshes to `pieces` (name → [{ mesh, material, key, generated }]), the form the
 *  checks and writeNodes take. A downloaded model's pieces (from surgery.readMesh) go in the same map
 *  with `generated: false`, so generated parts are checked against them. */
export function piecesOf(parts, M, pieces = new Map()) {
  for (const part of parts) {
    const list = pieces.get(part.name) ?? [];
    for (const [key, geo] of part.geos) {
      if (!geo.indices?.length) continue;
      if (!M[key]) throw new Error(`no material "${key}" (part ${part.name})`);
      const mesh = fromGeo(geo);
      if (part.uv1?.has(geo)) mesh.uv1 = part.uv1.get(geo);
      list.push({ mesh, material: M[key], key, generated: true });
    }
    pieces.set(part.name, list);
  }
  return pieces;
}

/** One node per piece (and per part with no meshes of its own), one primitive per material, nested by
 *  `parentOf(name)`, with each part's `extras` passed on to the viewer. */
export function writeNodes(doc, scene, pieces, { parts = [], parentOf = () => undefined } = {}) {
  const buffer = doc.getRoot().listBuffers()[0] ?? doc.createBuffer();
  const hasUVs = (material) => !!material.getBaseColorTexture() || !!material.getNormalTexture();
  const nodes = new Map();
  for (const [name, list] of pieces) {
    const node = doc.createNode(name);
    if (list.length) {
      const byMaterial = new Map();
      for (const { mesh, material } of list) byMaterial.set(material, [...(byMaterial.get(material) ?? []), mesh]);
      const mesh = doc.createMesh(name);
      for (const [material, meshes] of byMaterial) {
        const merged = meshes.length > 1 ? merge(...meshes) : meshes[0];
        mesh.addPrimitive(writePrimitive(doc, buffer, merged, material, { uvs: hasUVs(material), uv1: merged.uv1 ?? null }));
      }
      node.setMesh(mesh);
    }
    nodes.set(name, node);
  }
  for (const part of parts) {
    if (!nodes.has(part.name)) nodes.set(part.name, doc.createNode(part.name));
    if (part.extras) nodes.get(part.name).setExtras(part.extras);
  }
  for (const [name, node] of nodes) {
    const parent = parentOf(name);
    if (parent && !nodes.has(parent)) throw new Error(`${name} rides on "${parent}", which isn't a part`);
    (parent ? nodes.get(parent) : scene).addChild(node);
  }
  return nodes;
}

/**
 * A whole model from parts (an object built in code): a new document, its materials
 * (`materials(doc, kit)` returns `{ key: material }` for every key the parts use), one node per
 * part nested by `part.parent`. Returns the document and what the checks need.
 */
export async function assemble({ name, parts, materials }) {
  const doc = new Document();
  doc.createBuffer();
  const scene = doc.createScene(name);
  doc.getRoot().setDefaultScene(scene);
  const M = await materials(doc, materialKit(doc));
  const pieces = piecesOf(parts, M);
  const parentOf = (n) => parts.find((p) => p.name === n)?.parent;
  const nodes = writeNodes(doc, scene, pieces, { parts, parentOf });
  return { doc, scene, nodes, pieces, parentOf, M };
}

/**
 * A node that only turns, to drive other parts: crank and cam motions in the content follow its angle
 * (a pump's piston and valve, a sewing machine's needle). The build's prune() drops empty nodes, so it
 * carries a 1.5 mm cube; hide that inside `parent`, whose part its mesh then belongs to.
 */
export function hiddenDriver(name, { parent, at, material = 'dark' }) {
  const part = new Part(name, { parent });
  box(part.geo(material), [at[0] - 0.75, at[0] + 0.75], [at[1] - 0.75, at[1] + 0.75], [at[2] - 0.75, at[2] + 0.75]);
  return part;
}

/**
 * Model space, the space content files use: x and z centred on the model, y = 0 at its lowest point,
 * scaled so half the bounding box's diagonal is 1. `toModel([x, y, z])` takes millimetres in the
 * object's frame; `unit(mm)` turns a length into model units.
 */
export function modelSpace(scene) {
  const { min, max } = getBounds(scene);
  const size = max.map((v, i) => v - min[i]);
  const scale = 1 / (0.5 * Math.hypot(...size));
  const offset = [-(min[0] + max[0]) / 2, -min[1], -(min[2] + max[2]) / 2];
  const toModel = (mm) => mm.map((v, i) => +(((v / 1000 + offset[i]) * scale).toFixed(4)));
  const unit = (mm) => +((mm / 1000) * scale).toFixed(5);
  const mmPerUnit = +(1000 / scale).toFixed(3);
  return { size, scale, offset, toModel, unit, mmPerUnit, space: { origin: toModel([0, 0, 0]), mmPerUnit }, realSize: size.map((v) => +(v * 1000).toFixed(1)) };
}

/** Hints in model space: points (3-vectors) through toModel, lengths named in `lengths` scaled; directions
 *  (`axis`, `dir`, `jet`) stay as they are. From scripts/kit/cars/generate.mjs. */
export function inModel(h, { toModel, scale }, lengths = ['r', 'L', 'drop', 'rise', 'lift', 'throw', 'rod']) {
  const walk = (v, key) => {
    if (Array.isArray(v) && v.length === 3 && v.every((c) => typeof c === 'number') && !['axis', 'dir', 'jet'].includes(key)) return toModel(v);
    if (Array.isArray(v)) return v.map((x) => walk(x));
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x, k)]));
    if (typeof v === 'number' && lengths.includes(key)) return +((v / 1000) * scale).toFixed(5);
    return v;
  };
  return walk(h);
}

/**
 * The build's checks: no generated part crosses another at rest, and (once the content file has
 * parts) the explode in it passes nothing through anything. `contacts` lists pairs that touch by
 * design (gears in mesh, a pin in its hole; 'name*' matches a prefix). `check`: true fails the build,
 * false only logs, 'skip' skips (for content builders that just want the hints).
 */
export function runChecks({ label, pieces, contacts = [], data, parentOf, mmPerUnit, check = true, log = console.log }) {
  if (check === 'skip') return;
  const fail = (message) => {
    if (check) throw new Error(message);
    log(`  (not checked) ${message}`);
  };
  const clashes = checkClashes(pieces, { ignore: contacts });
  if (clashes.length) fail(`${label}: parts collide\n  ${clashes.join('\n  ')}`);
  if (data?.parts?.length) {
    const path = checkExplode(pieces, data.parts, parentOf, mmPerUnit);
    if (path.length) fail(`${label}: the explode in the content file collides\n  ${path.join('\n  ')}`);
  }
}
