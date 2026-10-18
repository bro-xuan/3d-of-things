// The car builder, shared by the cars built in code: each car's own build step (objects/<slug>/generate.mjs,
// content/<slug>.json → build.generate) runs it on that car's spec (objects/<slug>/spec.mjs), with build.car
// naming the car in the model. The whole car is built here: the lower body and canopy (body.mjs) split into the
// panels that come off along the loft's own rows and stations (so every seam is a clean line), the
// wheel arches cut out, lights and trim picked out of the surface, and under it the battery pack,
// drive units, suspension and wheels (platform.mjs) and the cabin (interior.mjs). It checks that no
// part passes through another, at rest and along the content file's explode, like the cameras' builds.
import { Document, getBounds } from '@gltf-transform/core';
import { KHRMaterialsClearcoat, KHRMaterialsEmissiveStrength, KHRMaterialsIOR, KHRMaterialsTransmission, KHRTextureTransform } from '@gltf-transform/extensions';
import sharp from 'sharp';
import { Geo, lathe } from '../geometry.mjs';
import { put } from '../solids.mjs';
import { Part, checkClashes, checkExplode } from '../parts.mjs';
import { centroid, cut, fromGeo, pick, writePrimitive } from '../surgery.mjs';
import { CANOPY, LOWER, canopy, lowerBody, rowIndex } from './body.mjs';
import { buildPlatform, corners, wheelParts } from './platform.mjs';
import { buildInterior } from './interior.mjs';
import { buildStructure } from './structure.mjs';
import { buildFittings } from './fittings.mjs';
import { buildPowertrain } from './engine.mjs';
import { buildAero } from './aero.mjs';
import { lines } from './loft.mjs';
import { roundedBox } from '../shapes.mjs';

const srgb = (hex) => [0, 2, 4].map((i) => ((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))(parseInt(hex.slice(i + 1, i + 3), 16) / 255));

async function cellTexture() {
  const s = 128;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><rect width="100%" height="100%" fill="#1b1c1f"/><circle cx="${s / 2}" cy="${s / 2}" r="${s * 0.44}" fill="#9aa0a8"/><circle cx="${s / 2}" cy="${s / 2}" r="${s * 0.36}" fill="#c3c8ce"/><circle cx="${s / 2}" cy="${s / 2}" r="${s * 0.1}" fill="#7d838b"/></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** A radiator's core: rows of fins between the tubes. */
async function finTexture() {
  const [w, h] = [64, 256];
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#2b2e33"/>`;
  for (let y = 2; y < h; y += 6) svg += `<rect x="0" y="${y}" width="${w}" height="2" fill="#8b9096"/>`;
  for (let x = 0; x < w; x += 16) svg += `<rect x="${x}" y="0" width="4" height="${h}" fill="#4a4e55"/>`;
  return sharp(Buffer.from(svg + '</svg>')).png().toBuffer();
}

/** A carbon pressure vessel's skin: fibre wound round it in crossing helices. */
async function windingTexture() {
  const s = 256;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><rect width="100%" height="100%" fill="#18191b"/>`;
  for (let k = -s; k < 2 * s; k += 6) {
    svg += `<line x1="${k}" y1="0" x2="${k + s * 0.6}" y2="${s}" stroke="#2c2e32" stroke-width="2.4"/>`;
    svg += `<line x1="${k}" y1="0" x2="${k - s * 0.6}" y2="${s}" stroke="#242629" stroke-width="1.6"/>`;
  }
  return sharp(Buffer.from(svg + '</svg>')).png().toBuffer();
}

async function screenTexture(car, portrait = false) {
  const [w, h] = portrait ? [512, 768] : [768, 512];
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#16181c"/>`;
  // A map (on the right, or on top of an upright screen), the car and its speed beside it.
  const [mx, my, mw, mh] = portrait ? [0, 0, w, h * 0.62] : [w * 0.36, 0, w * 0.64, h];
  const M = (u, v) => [mx + u * mw, my + v * mh];
  svg += `<rect x="${mx}" y="${my}" width="${mw}" height="${mh}" fill="#20242b"/>`;
  for (const [u1, v1, u2, v2] of [[0.06, 0.2, 1, 0.35], [0.22, 0, 0.4, 1], [0, 0.7, 1, 0.62], [0.69, 0, 0.6, 1]]) svg += `<line x1="${M(u1, v1)[0]}" y1="${M(u1, v1)[1]}" x2="${M(u2, v2)[0]}" y2="${M(u2, v2)[1]}" stroke="#3a4250" stroke-width="10"/>`;
  svg += `<path d="M ${M(0.4, 1).join(' ')} L ${M(0.37, 0.55).join(' ')} L ${M(0.6, 0.3).join(' ')}" fill="none" stroke="#3e7bf4" stroke-width="9"/>`;
  const [cx, top] = portrait ? [w * 0.3, h * 0.62] : [w * 0.18, 0];
  const span = portrait ? h * 0.38 : h;
  svg += `<text x="${cx}" y="${top + span * 0.3}" font-family="Helvetica Neue, Helvetica, Arial" font-size="${portrait ? 72 : 92}" font-weight="600" fill="#f0f2f5" text-anchor="middle">0</text>`;
  svg += `<text x="${cx}" y="${top + span * 0.42}" font-family="Helvetica Neue, Helvetica, Arial" font-size="26" fill="#9aa3b0" text-anchor="middle">km/h</text>`;
  if (portrait) {
    // A row of climate controls along the bottom.
    for (let k = 0; k < 4; k++) svg += `<rect x="${w * (0.08 + k * 0.23)}" y="${h * 0.9}" width="${w * 0.17}" height="${h * 0.06}" rx="10" fill="#2a2f37"/>`;
    svg += `<rect x="${w * 0.56}" y="${top + span * 0.1}" width="${w * 0.34}" height="${span * 0.36}" rx="${w * 0.05}" fill="none" stroke="#9aa3b0" stroke-width="5"/>`;
    svg += `<text x="${w * 0.73}" y="${top + span * 0.62}" font-family="Helvetica Neue, Helvetica, Arial" font-size="24" fill="#9aa3b0" text-anchor="middle">${car}</text></svg>`;
  } else {
    svg += `<rect x="${w * 0.1}" y="${h * 0.52}" width="${w * 0.16}" height="${h * 0.3}" rx="${w * 0.05}" fill="none" stroke="#9aa3b0" stroke-width="5"/>`;
    svg += `<text x="${w * 0.18}" y="${h * 0.93}" font-family="Helvetica Neue, Helvetica, Arial" font-size="24" fill="#9aa3b0" text-anchor="middle">${car}</text></svg>`;
  }
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function materialsFor(doc, spec) {
  const clearcoat = doc.createExtension(KHRMaterialsClearcoat);
  const transmission = doc.createExtension(KHRMaterialsTransmission);
  const ior = doc.createExtension(KHRMaterialsIOR);
  const strength = doc.createExtension(KHRMaterialsEmissiveStrength);
  const transform = doc.createExtension(KHRTextureTransform);
  const material = (name, hex, metallic, roughness) => doc.createMaterial(name).setBaseColorFactor([...srgb(hex), 1]).setMetallicFactor(metallic).setRoughnessFactor(roughness);
  const emissive = (name, hex, glow, power) => material(name, hex, 0, 0.3).setEmissiveFactor(srgb(glow)).setExtension('KHR_materials_emissive_strength', strength.createEmissiveStrength().setEmissiveStrength(power));
  const F = spec.finish ?? {};
  const paint = material('car_paint', spec.paint ?? '#9e0b0f', F.metallic ?? 0.45, F.roughness ?? 0.32).setDoubleSided(true);
  if (F.clearcoat ?? 1) paint.setExtension('KHR_materials_clearcoat', clearcoat.createClearcoat().setClearcoatFactor(F.clearcoat ?? 1).setClearcoatRoughnessFactor(0.04));
  // Glass: a dark smoke, or (`spec.glass`) a tint of its own, such as a gold visor's.
  const G = spec.glass ?? {};
  const glass = material('car_glass', G.colour ?? '#2a2f36', G.metallic ?? 0, G.roughness ?? 0.03)
    .setExtension('KHR_materials_transmission', transmission.createTransmission().setTransmissionFactor(G.transmission ?? 0.82))
    .setExtension('KHR_materials_ior', ior.createIOR().setIOR(1.5))
    .setDoubleSided(true);
  const cells = material('car_cells', '#ffffff', 0.6, 0.4).setBaseColorTexture(doc.createTexture('cells').setImage(await cellTexture()).setMimeType('image/png').setURI('cells.png'));
  // The cells' pattern tiled at the cells' own size across each module (an electric car's).
  const P = spec.pack;
  if (P) {
    const [cols, rows] = P.modules;
    const mw = (2 * P.half - 100) / cols;
    const ml = (P.z[1] - P.z[0] - 60) / rows;
    cells.getBaseColorTextureInfo().setExtension('KHR_texture_transform', transform.createTransform().setScale([mw / (P.cell ?? 22), ml / (P.cell ?? 22)]));
  }
  const screen = material('car_screen', '#ffffff', 0, 0.12).setBaseColorTexture(doc.createTexture('screen').setImage(await screenTexture(spec.name, spec.cabin3d.screen.h > spec.cabin3d.screen.w)).setMimeType('image/png').setURI('screen.png'));
  screen.setEmissiveFactor([0.5, 0.5, 0.5]).setEmissiveTexture(screen.getBaseColorTexture());
  return {
    paint,
    glass,
    trim: material('car_trim', '#121314', 0.1, 0.55),
    gloss: material('car_gloss_black', '#0b0c0d', 0.2, 0.12),
    headlight: emissive('car_headlight', '#dfe8f2', '#e8f2ff', 2.4),
    taillight: emissive('car_taillight', '#5a0508', '#ff1a1a', 2.2),
    well: material('car_wheel_well', '#0c0c0c', 0, 0.95).setDoubleSided(true),
    tyre: material('car_tyre', '#18181a', 0, 0.86),
    rim: material('car_rim', spec.rimColour ?? '#8e9399', spec.rimFinish?.metallic ?? 0.95, spec.rimFinish?.roughness ?? 0.32),
    disc: material('car_disc', '#7d8085', 1, 0.42),
    caliper: material('car_caliper', spec.caliperColour ?? '#b3121a', 0.2, 0.4),
    casting: material('car_casting', '#a9adb3', 0.9, 0.45),
    lamination: material('car_lamination', '#4a4e55', 0.9, 0.38),
    copper: material('car_copper', '#c46a33', 1, 0.3),
    inverter: material('car_inverter', '#b9bdc2', 0.8, 0.35),
    packCase: material('car_pack_case', '#3a3d42', 0.6, 0.5),
    packLid: material('car_pack_lid', '#2a2c30', 0.5, 0.55),
    cells,
    hv: material('car_hv_cable', '#f47b20', 0, 0.55),
    steel: material('car_steel', '#9ea3a9', 1, 0.35),
    damper: material('car_damper', '#1d1e20', 0.4, 0.4),
    spring: material('car_spring', spec.springColour ?? '#c9302c', 0.3, 0.35),
    boot: material('car_cv_boot', '#141415', 0, 0.75),
    carpet: material('car_carpet', '#1b1c1e', 0, 0.95),
    seat: material('car_seat', spec.seatColour ?? '#1a1a1c', 0, 0.6),
    screenFrame: material('car_screen_frame', '#0d0e10', 0.2, 0.3),
    screen,
    mirrorGlass: material('car_mirror_glass', '#dfe4ea', 1, 0.05),
    chrome: material('car_chrome', '#e3e6ea', 1, 0.08),
    rubber: material('car_rubber', '#161617', 0, 0.8),
    ceramic: material('car_ceramic', '#efeeea', 0, 0.35),
    radiator: material('car_radiator', '#ffffff', 0.6, 0.5).setBaseColorTexture(doc.createTexture('fins').setImage(await finTexture()).setMimeType('image/png').setURI('fins.png')),
    exhaust: material('car_exhaust', '#6f6a64', 0.85, 0.55),
    tank: material('car_fuel_tank', '#3b3f44', 0.5, 0.5),
    battery: material('car_battery', '#1d1f22', 0.1, 0.6),
    plate: material('car_plate', '#f2f1ea', 0, 0.5),
    cover: material('car_cover', '#a9adb3', 0.9, 0.45).setDoubleSided(true),
    rimCover: material('car_rim_cover', spec.rims?.cover ?? '#d8d8d4', 0.1, 0.38),
    // The air system's: carbon tanks, polished nozzles, fan blades, valves and braided lines.
    copv: material('car_copv', '#ffffff', 0.3, 0.42).setBaseColorTexture(doc.createTexture('winding').setImage(await windingTexture()).setMimeType('image/png').setURI('winding.png')),
    nozzle: material('car_nozzle', '#b49a7c', 1, 0.24),
    fan: material('car_fan', '#3a3d42', 0.3, 0.45),
    valve: material('car_valve', '#2c3846', 0.7, 0.4),
    airLine: material('car_air_line', '#8b9097', 0.85, 0.45),
  };
}

/** The doors on each side: one range ('door_left') or several named ones ('door_front_left'). */
export const doorsOf = (P) => (P.doors ?? [{ name: '', z: P.door }]).map((d) => ({ ...d, suffix: d.name ? `_${d.name}` : '' }));

/** The station index nearest a z, so seams run along the loft's own edges. */
const stationAt = (zs, z) => zs.reduce((best, v, i) => (Math.abs(v - z) < Math.abs(zs[best] - z) ? i : best), 0);

/** Per triangle of a loft's geo: its station (the lower of its two) and row, and which side (x sign) it's on. */
function triangleCells(loftResult) {
  const { geo, rowOf, stationOf } = loftResult;
  const cells = [];
  for (let t = 0; t < geo.indices.length; t += 3) {
    const vs = [geo.indices[t], geo.indices[t + 1], geo.indices[t + 2]];
    const rows = vs.map((v) => rowOf[v] ?? -1);
    const st = vs.map((v) => stationOf[v] ?? -1);
    const x = vs.reduce((s, v) => s + geo.positions[v * 3], 0) / 3;
    cells.push({ i: Math.min(...st), j: Math.min(...rows), cap: rows.some((r) => r === -1), side: Math.sign(x) || 1, ax: Math.abs(x) });
  }
  return cells;
}

/** A Geo mirrored across x = 0 (its triangles turned over to keep facing out). */
function mirrorX(g) {
  const out = new Geo();
  out.append(g, (p, n) => [[-p[0], p[1], p[2]], [-n[0], n[1], n[2]]]);
  for (let k = 0; k < out.indices.length; k += 3) [out.indices[k + 1], out.indices[k + 2]] = [out.indices[k + 2], out.indices[k + 1]];
  return out;
}

/** The triangles of a geo picked by `keep(t)`, as a plain mesh. */
const subMesh = (geo, keep) => pick(fromGeo(geo), keep);

/** Two plain meshes as one. */
function merged(a, b) {
  const base = a.positions.length / 3;
  return {
    positions: [...a.positions, ...b.positions],
    normals: a.normals && b.normals ? [...a.normals, ...b.normals] : null,
    uvs: a.uvs && b.uvs ? [...a.uvs, ...b.uvs] : null,
    indices: [...a.indices, ...b.indices.map((i) => i + base)],
  };
}

export function buildCar(spec) {
  // A wheel arch's outline about its axle (negative inside): a circle, or a polygon with a flat top.
  const archOf = (c) => {
    const ra = c.size.r + 38;
    const sides = spec.arches?.sides;
    if (!sides) return (p) => Math.hypot(p[1] - c.size.r, p[2] - c.z) - ra;
    const normals = Array.from({ length: sides }, (_, k) => [Math.cos(Math.PI / 2 + (k * 2 * Math.PI) / sides), Math.sin(Math.PI / 2 + (k * 2 * Math.PI) / sides)]);
    return (p) => Math.max(...normals.map(([nz, ny]) => nz * (p[2] - c.z) + ny * (p[1] - c.size.r))) - ra;
  };
  const parts = [];
  const lower = lowerBody(spec);
  const cells = triangleCells(lower);
  const zs = [];
  for (let v = 0; v < lower.geo.vertexCount; v++) if (lower.rowOf[v] === 0) zs[lower.stationOf[v]] = lower.geo.positions[v * 3 + 2];
  const S = (z) => stationAt(zs, z);
  const R = (name) => rowIndex(LOWER, name);
  const P = spec.panels;
  const cabinOpen = (t) => {
    const { i, j } = cells[t];
    const z = zs[i] ?? 0;
    // Under the canopy (from the crown's edge itself, where a canopy sits right on it).
    if (j >= R('crown') + (spec.canopyOnCrown ? 0 : 1) && z > spec.span[0] + 60 && z < spec.span[1] - 40) return true;
    // Underneath, between the bumpers: the battery, motors and suspension are the skateboard's, not the body's.
    return j < R('sill') && z > spec.panels.rearBumper + 40 && z < spec.panels.frontBumper - 40;
  };
  const zone = (t) => {
    const { i, j, cap, side } = cells[t];
    const z = zs[i] ?? 0;
    if (cap) return z > 0 ? 'front_bumper' : 'rear_bumper';
    const sideJ = j >= R('sill') + 2 && j < R('crown') + 2;
    for (const d of doorsOf(P)) if (sideJ && i >= S(d.z[0]) && i < S(d.z[1])) return `door${d.suffix}_${side > 0 ? 'left' : 'right'}`;
    if (j >= R('crown') + 2 && i >= S(P.bonnet[0]) && i < S(P.bonnet[1])) return 'bonnet';
    if (j >= R('crown') + 2 && i >= S(P.boot[0]) && i < S(P.boot[1])) return 'boot';
    if (i >= S(P.frontBumper)) return 'front_bumper';
    if (i < S(P.rearBumper)) return 'rear_bumper';
    return 'body';
  };
  const finish = (t) => {
    const { i, j, ax } = cells[t];
    const z = zs[i] ?? 0;
    const L = spec.lights;
    if (j < R('sill') + 2 && j > R('floor') - 1) return 'trim';
    const rows = (light) => light?.rows && j >= R(light.rows[0]) && j < R(light.rows[1]);
    if (rows(L.head) && z > L.head.z && ax > (L.head.x ?? 0)) return 'headlight';
    if (rows(L.tail) && z < L.tail.z && ax > (L.tail.x ?? 0)) return 'taillight';
    if (rows(L.intake) && z > L.intake.z && ax < (L.intake.x ?? Infinity)) return 'gloss';
    return 'paint';
  };
  const trimLine = spec.trimLine ? lines(spec.trimLine) : null;
  // Holes through the skin (`spec.openings`): a box ({ box: [[x0, x1], [y0, y1], [z0, z1]] }), or a round hole along x, y
  // or z ({ axis, at: the other two coordinates, r, range: [min, max] of |that coordinate| }). Each is one function, negative
  // inside, so the cut lands exactly on its edge.
  const openings = (spec.openings ?? []).map((o) => {
    let f;
    if (o.box) {
      const [[x0, x1], [y0, y1], [z0, z1]] = o.box;
      f = (p) => Math.max(x0 - p[0], p[0] - x1, y0 - p[1], p[1] - y1, z0 - p[2], p[2] - z1);
    } else {
      const a = 'xyz'.indexOf(o.axis);
      const [u, v] = [0, 1, 2].filter((k) => k !== a);
      f = (p) => Math.max(Math.hypot(p[u] - o.at[0], p[v] - o.at[1]) - o.r, o.range[0] - Math.abs(p[a]), Math.abs(p[a]) - o.range[1]);
    }
    return (mesh) => {
      const m = cut(mesh, f);
      return pick(m, (tt) => f(centroid(m, tt)) > 0);
    };
  });
  // Panels, each cut for its wheel arches, then split by finish.
  const groups = new Map();
  for (let t = 0; t < cells.length; t++) {
    if (cabinOpen(t)) continue;
    const key = `${zone(t)}|${finish(t)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(t);
  }
  const wells = [];
  for (const [key, tris] of groups) {
    const [name, material] = key.split('|');
    const set = new Set(tris);
    let mesh = subMesh(lower.geo, (t) => set.has(t));
    let clad = null;
    for (const c of corners(spec)) {
      const xin = Math.abs(c.x) - c.size.half - 45;
      const arch = archOf(c);
      const inArch = (p) => Math.sign(p[0]) === c.s && Math.abs(p[0]) > xin && arch(p) < 0;
      if (!mesh.indices.length) break;
      // Inside the arch and outboard of its inner edge: one continuous function, so the cut lands exactly on both.
      mesh = cut(mesh, (p) => (Math.sign(p[0]) === c.s ? Math.max(xin - Math.abs(p[0]), arch(p)) : 1));
      mesh = pick(mesh, (tt) => !inArch(centroid(mesh, tt)));
      // A band of black cladding round the arch, on a body that has it.
      const trim = spec.arches?.trim;
      if (trim && material === 'paint' && mesh.indices.length) {
        const banded = cut(mesh, (p) => (Math.sign(p[0]) === c.s ? Math.max(xin - Math.abs(p[0]), arch(p) - trim) : 1));
        const near = (tt) => {
          const p = centroid(banded, tt);
          return Math.sign(p[0]) === c.s && Math.abs(p[0]) > xin && arch(p) < trim;
        };
        const band = pick(banded, near);
        if (band.indices.length) clad = clad ? merged(clad, band) : band;
        mesh = pick(banded, (tt) => !near(tt));
      }
    }
    // Carbon below the trim line (`spec.trimLine`, a height along the car): the sills and the lower nose and tail.
    if (trimLine && material === 'paint' && mesh.indices.length) {
      const below = (p) => p[1] - trimLine(p[2]);
      const banded = cut(mesh, below);
      const low = (tt) => below(centroid(banded, tt)) < 0;
      const band = pick(banded, low);
      if (band.indices.length) clad = clad ? merged(clad, band) : band;
      mesh = pick(banded, (tt) => !low(tt));
    }
    for (const o of openings) if (mesh.indices.length) mesh = o(mesh);
    if (clad) for (const o of openings) if (clad.indices.length) clad = o(clad);
    // A light bar straight across the nose or the tail, over the end too: cut cleanly along its edges.
    const bar = material === 'paint' && (name === 'front_bumper' ? spec.lights.head?.bar : name === 'rear_bumper' ? spec.lights.tail?.bar : null);
    let lights = null;
    if (bar && mesh.indices.length) {
      const banded = cut(cut(mesh, (p) => p[1] - bar[0]), (p) => p[1] - bar[1]);
      const lit = (tt) => {
        const y = centroid(banded, tt)[1];
        return y > bar[0] && y < bar[1];
      };
      lights = pick(banded, lit);
      mesh = pick(banded, (tt) => !lit(tt));
    }
    let part = parts.find((p) => p.name === name);
    if (!part) {
      part = new Part(name, { parent: name === 'body' ? undefined : 'body' });
      parts.push(part);
    }
    part.meshes ??= [];
    part.meshes.push({ mesh, key: material });
    if (clad) part.meshes.push({ mesh: clad, key: 'trim' });
    if (lights?.indices.length) part.meshes.push({ mesh: lights, key: name === 'front_bumper' ? 'headlight' : 'taillight' });
  }
  // Wheel wells: black drums over each wheel inside the body.
  const wellPart = new Part('wheel_wells', { parent: 'body' });
  for (const c of corners(spec)) {
    const xin = Math.abs(c.x) - c.size.half - 45;
    const xo = Math.min(xin + 420, lower.curves.width(c.z) - 8);
    const g = new Geo();
    const rw = c.size.r + (spec.arches?.sides ? 38 / Math.cos(Math.PI / spec.arches.sides) + 30 : 46);
    lathe(g, [[rw, c.s * xo], [rw, c.s * xin]], { segments: 48, start: -0.3, length: Math.PI + 0.6 });
    const out = new Geo();
    put(out, g, 'x', [0, c.size.r, c.z]);
    if (c.s > 0) for (let k = 0; k < out.indices.length; k += 3) [out.indices[k + 1], out.indices[k + 2]] = [out.indices[k + 2], out.indices[k + 1]];
    for (let k = 0; k < out.normals.length; k++) out.normals[k] *= -1;
    wellPart.geo('well').append(out);
    wells.push(out);
  }
  parts.push(wellPart);

  // The canopy: windscreen, roof, rear glass, and each door's side window.
  const cab = canopy(spec, { lower: lower.curves });
  const cc = triangleCells(cab);
  const czs = [];
  for (let v = 0; v < cab.geo.vertexCount; v++) if (cab.rowOf[v] === 0) czs[cab.stationOf[v]] = cab.geo.positions[v * 3 + 2];
  const CR = (name) => rowIndex(CANOPY, name);
  const glassZone = (t) => {
    const { i, j, side } = cc[t];
    const z = czs[i] ?? 0;
    // Glass that goes with a door stays inside the door's own seams (the canopy's stations aren't the body's).
    const inDoor = (d) => z >= zs[S(d.z[0])] - 0.5 && (czs[i + 1] ?? Infinity) <= zs[S(d.z[1])] + 0.5;
    if (j >= CR('glassBase') && j < CR('header')) for (const d of doorsOf(P)) if (inDoor(d)) return `window${d.suffix}_${side > 0 ? 'left' : 'right'}`;
    // A falcon-wing door takes its half of the roof up with it.
    if (j >= CR('header')) for (const d of doorsOf(P)) if (d.falcon && inDoor(d)) return `door${d.suffix}_${side > 0 ? 'left' : 'right'}`;
    if (P.roof && j >= CR('header') && z >= P.roof[0] && z < P.roof[1]) return 'roof';
    // A liftback's hatch takes the rear window up with the boot lid.
    if (P.hatch !== undefined && j >= CR('header') && z < P.hatch) return 'boot';
    return 'canopy';
  };
  // A painted roof (the glass only round the sides), from the windscreen's top to the rear window's.
  const glassFinish = (t) => {
    const { i, j } = cc[t];
    const z = czs[i] ?? 0;
    if (spec.windows) {
      const glazed = spec.windows.some((w) => z >= w.z[0] && z < w.z[1] && j >= CR(w.rows[0]) + (w.inset?.[0] ?? 0) && j < CR(w.rows[1]) - (w.inset?.[1] ?? 0));
      return glazed ? 'glass' : 'paint';
    }
    const rules = [...(spec.roofPaint ? [spec.roofPaint] : []), ...(spec.canopyPaint ?? [])];
    const rule = rules.find((r) => j >= CR(r.from ?? 'header') + (r.inset ?? 2) && (r.to === undefined || j < CR(r.to)) && z >= r.z[0] && z < r.z[1]);
    return rule ? (rule.key ?? 'paint') : 'glass';
  };
  const glassGroups = new Map();
  for (let t = 0; t < cc.length; t++) {
    const key = `${glassZone(t)}|${glassFinish(t)}`;
    if (!glassGroups.has(key)) glassGroups.set(key, []);
    glassGroups.get(key).push(t);
  }
  for (const [key, tris] of glassGroups) {
    const [name, material] = key.split('|');
    const set = new Set(tris);
    let part = parts.find((p) => p.name === name);
    if (!part) {
      const parent = name.startsWith('window') ? name.replace('window', 'door') : name === 'body' ? undefined : 'body';
      part = new Part(name, { parent });
      parts.push(part);
    }
    part.meshes ??= [];
    part.meshes.push({ mesh: subMesh(cab.geo, (t) => set.has(t)), key: material });
  }
  if (!parts.find((p) => p.name === 'body')) parts.push(new Part('body'));
  // Door mirrors, on the front doors just behind the windscreen's foot.
  if (spec.mirror) {
    const front = doorsOf(P)[0];
    for (const [side, s] of [['left', 1], ['right', -1]]) {
      const m = spec.mirror;
      const part = new Part(`mirror_${side}`, { parent: `door${front.suffix}_${side}` });
      const w = lower.curves.width(m.z);
      const g = new Geo();
      // The head, swept back, on a short arm out of the door's top.
      roundedBox(g, [w + m.reach * 0.25, w + m.reach], [m.y - m.h / 2, m.y + m.h / 2], [m.z - m.depth, m.z], Math.min(40, m.h * 0.45), { segments: 5 });
      roundedBox(g, [w - 70, w + m.reach * 0.4], [m.y - m.h * 0.4, m.y - m.h * 0.05], [m.z - m.depth * 0.75, m.z - m.depth * 0.25], 16, { segments: 3 });
      part.geo('paint').append(s > 0 ? g : mirrorX(g));
      const glassG = new Geo();
      roundedBox(glassG, [w + 2, w + m.reach - 12], [m.y - m.h / 2 + 10, m.y + m.h / 2 - 10], [m.z - m.depth - 1, m.z - m.depth + 2], 20, { segments: 3 });
      part.geo('mirrorGlass').append(s > 0 ? glassG : mirrorX(glassG));
      parts.push(part);
    }
  }
  if (spec.fittings) {
    for (const [name, byKey] of Object.entries(buildFittings(spec, lower))) {
      const part = parts.find((p) => p.name === name);
      if (!part) throw new Error(`fittings for a part there isn't: ${name}`);
      for (const [key, g] of Object.entries(byKey)) part.geo(key).append(g);
    }
  }
  parts.push(...wheelParts(spec), ...buildPlatform(spec), ...buildInterior(spec), ...buildStructure(spec));
  const powertrain = spec.engine ? buildPowertrain(spec) : null;
  if (powertrain) parts.push(...powertrain.parts);
  const aero = spec.aero ? buildAero(spec) : null;
  if (aero) {
    parts.push(...aero.parts);
    for (const [name, byKey] of Object.entries(aero.extra)) {
      const part = parts.find((p) => p.name === name);
      if (!part) throw new Error(`aero pieces for a part there isn't: ${name}`);
      for (const [key, geos] of Object.entries(byKey)) for (const g of geos) part.geo(key).append(g);
    }
  }
  return { parts, lower, cab, powertrain, aero };
}

/** Parts that touch by design. */
const CONTACTS = [
  ['door_*', 'body'], ['door_*', 'window_*'], ['door_*', 'door_*'], ['mirror_*', '*'], ['door_*', 'canopy'], ['roof', 'window_*'], ['shaft_*', 'front_motor'], ['shaft_*', 'rear_motor*'], ['front_motor_rotor', 'front_motor'], ['rear_motor*', 'rear_motor*'], ['window_*', 'canopy'], ['window_*', 'body'], ['canopy', 'body'], ['roof', 'canopy'], ['roof', 'body'],
  ['bonnet', 'body'], ['boot', 'body'], ['boot', 'canopy'], ['front_bumper', 'body'], ['rear_bumper', 'body'], ['front_bumper', 'bonnet'], ['rear_bumper', 'boot'],
  ['wheel_wells', '*'], ['wheel_*', 'caliper_*'], ['wheel_*', 'upright_*'], ['wheel_*', 'shaft_*'], ['caliper_*', 'upright_*'], ['upright_*', 'arms_*'], ['upright_*', 'shaft_*'],
  ['shaft_*', '*_motor'], ['*_rotor', '*_motor'], ['steering_rack', 'upright_*'], ['hv_cables', '*'], ['modules', 'battery_pack'], ['pack_lid', 'battery_pack'], ['modules', 'pack_lid'],
  ['cylinder_head', 'engine_block'], ['sump', 'engine_block'], ['crankshaft', 'engine_block'], ['rod_*', 'piston_*'], ['rod_*', 'crankshaft'], ['piston_*', 'engine_block'],
  ['valve_*', 'cylinder_head'], ['valve_*', 'camshaft'], ['camshaft', 'cylinder_head'], ['cam_cover', 'cylinder_head'], ['camshaft', 'cam_cover'], ['timing_belt', 'crankshaft'], ['timing_belt', 'camshaft'],
  ['fan', 'crankshaft'], ['intake', 'cylinder_head'], ['exhaust', 'cylinder_head'], ['clutch', 'crankshaft'], ['clutch', 'gear_input'], ['gearbox', 'engine_block'], ['gearbox', 'cabin_floor'],
  ['gear_input', 'gearbox'], ['layshaft', 'gearbox'], ['mainshaft', 'gearbox'], ['gear_*', 'gearbox'], ['gear_*', 'layshaft'], ['gear_*', 'mainshaft'], ['gear_input', 'mainshaft'], ['gear_input', 'crankshaft'],
  ['propshaft', 'mainshaft'], ['propshaft', 'pinion'], ['pinion', 'rear_axle'], ['pinion', 'diff_carrier'], ['diff_carrier', 'rear_axle'], ['spider_*', 'diff_carrier'], ['spider_*', 'rear_axle'], ['spider_*', 'halfshaft_*'],
  ['halfshaft_*', 'rear_axle'], ['halfshaft_*', 'diff_carrier'], ['halfshaft_*', 'wheel_*'], ['rear_springs', 'rear_axle'], ['caliper_*', 'rear_axle'], ['caliper_*', 'halfshaft_*'], ['radiator', 'cylinder_head'], ['radiator', 'engine_block'],
  ['cabin_floor', '*'], ['seats', 'cabin_floor'], ['dashboard', 'cabin_floor'], ['steering_wheel', 'dashboard'], ['arms_*', 'body'], ['arms_*', 'wheel_*'],
  // The suction system and the air store: the duct meets the pack, the skirts seal against each other and the duct,
  // the tanks are joined, and the lines run to everything they feed.
  ['fan_box', 'battery_pack'], ['fan_*', 'fan_box'], ['skirt_*', 'skirt_*'], ['skirt_rear', 'fan_box'], ['air_lines', '*'], ['tank_*', 'tank_*'], ['tank_*', 'pack_lid'], ['tank_*', 'battery_pack'],
  ['thruster_*', 'fan_box'], ['thruster_*', 'body'], ['thruster_*', 'front_bumper'], ['thruster_*', 'rear_bumper'], ['boot', 'body'], ['boot', 'rear_bumper'],
];

/** The powertrain's (or the aero system's) hints in model space: points (3-vectors) through toModel, lengths (mm) scaled;
 *  directions (`axis`, `jet`) stay as they are. */
function inModel(h, toModel, scale) {
  const walk = (v, key) => {
    if (Array.isArray(v) && v.length === 3 && v.every((c) => typeof c === 'number') && key !== 'axis' && key !== 'jet') return toModel(v);
    if (Array.isArray(v)) return v.map((x) => walk(x));
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x, k)]));
    if (typeof v === 'number' && ['r', 'L', 'drop', 'rise'].includes(key)) return +((v / 1000) * scale).toFixed(5);
    return v;
  };
  return walk(h);
}

export default async function generate({ data, spec, log = console.log, check = true } = {}) {
  const name = data?.build?.car;
  if (!name) throw new Error('build.car names no car');
  if (!spec) throw new Error(`${name}: no spec (a car's build step passes its objects/<slug>/spec.mjs)`);
  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene(name);
  doc.getRoot().setDefaultScene(scene);
  const M = await materialsFor(doc, spec);
  const built = buildCar(spec);
  const { parts } = built;

  const pieces = new Map();
  for (const part of parts) {
    const list = [];
    for (const [key, geo] of part.geos) if (!geo.isEmpty) list.push({ mesh: fromGeo(geo), material: M[key], key, generated: true });
    for (const m of part.meshes ?? []) if (m.mesh.indices.length) list.push({ mesh: m.mesh, material: M[m.key], key: m.key, generated: true });
    for (const e of list) if (!e.material) throw new Error(`no material "${e.key}" (part ${part.name})`);
    pieces.set(part.name, (pieces.get(part.name) ?? []).concat(list));
  }
  const nodes = new Map();
  for (const part of parts) {
    if (nodes.has(part.name)) continue;
    const node = doc.createNode(part.name);
    const list = pieces.get(part.name) ?? [];
    if (list.length) {
      const mesh = doc.createMesh(part.name);
      const byMat = new Map();
      for (const e of list) {
        if (!byMat.has(e.material)) byMat.set(e.material, []);
        byMat.get(e.material).push(e.mesh);
      }
      for (const [material, meshes] of byMat) {
        const merged = { positions: [], normals: [], uvs: [], indices: [] };
        for (const m of meshes) {
          const base = merged.positions.length / 3;
          merged.positions.push(...m.positions);
          merged.normals.push(...m.normals);
          merged.uvs.push(...(m.uvs ?? new Array((m.positions.length / 3) * 2).fill(0)));
          for (const i of m.indices) merged.indices.push(i + base);
        }
        mesh.addPrimitive(writePrimitive(doc, buffer, merged, material, { uvs: !!material.getBaseColorTexture() || !!material.getNormalTexture() }));
      }
      node.setMesh(mesh);
    }
    if (part.extras) node.setExtras(part.extras);
    nodes.set(part.name, node);
  }
  const parentOf = (n) => parts.find((p) => p.name === n)?.parent;
  for (const [n, node] of nodes) {
    const parent = parentOf(n);
    (parent && nodes.get(parent) ? nodes.get(parent) : scene).addChild(node);
  }
  const bounds = getBounds(scene);
  const size = bounds.max.map((v, i) => v - bounds.min[i]);
  const scale = 1 / (0.5 * Math.hypot(...size));
  const offset = [-(bounds.min[0] + bounds.max[0]) / 2, -bounds.min[1], -(bounds.min[2] + bounds.max[2]) / 2];
  const toModel = (mm) => mm.map((v, i) => +(((v / 1000 + offset[i]) * scale).toFixed(4)));
  const fail = (message) => {
    if (check) throw new Error(message);
    log(`  (not checked) ${message}`);
  };
  if (check !== 'skip') {
    const clashes = checkClashes(pieces, { ignore: CONTACTS });
    if (clashes.length) fail(`${name}: parts collide\n  ${clashes.join('\n  ')}`);
    if (data?.parts?.length) {
      const route = checkExplode(pieces, data.parts, parentOf, 1000 / scale);
      if (route.length) fail(`${name}: the explode in the content file collides\n  ${route.join('\n  ')}`);
    }
  }
  log(`  ${name}: ${nodes.size} nodes, ${size.map((v) => (v * 1000).toFixed(0)).join(' × ')} mm`);
  const hints = {
    space: { origin: toModel([0, 0, 0]), mmPerUnit: +(1 / scale).toFixed(6) * 1000 },
    wheels: Object.fromEntries(corners(spec).map((c) => [c.name, { axle: toModel([c.x, c.size.r, c.z]), radius: +(c.size.r).toFixed(1) }])),
    ...(built.powertrain ? { engine: inModel(built.powertrain.hints, toModel, scale) } : {}),
    ...(built.aero ? { aero: inModel(built.aero.hints, toModel, scale) } : {}),
    motors: Object.fromEntries((spec.motors ?? []).map((m) => {
      const axleZ = (m.axle === 'front' ? 1 : -1) * (spec.wheelbase / 2);
      const corner = corners(spec).find((c) => c.axle === m.axle);
      return [m.name, toModel([m.x ?? 0, corner.size.r + (m.y ?? 20), axleZ + (m.dz ?? (m.axle === 'front' ? 170 : -170))])];
    })),
  };
  return { doc, hints };
}
