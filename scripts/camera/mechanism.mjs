// The rangefinder camera's insides, generated: the shutter's two cloth curtains on their
// rollers, the film from its cassette across the gate to the take-up spool, the sprocket and
// the gears the advance lever turns, the rangefinder's optics and the roller that couples them
// to the lens, and the lens's iris and rangefinder cam.
//
// Camera frame: millimetres, the Poly Haven model's axes: x across the body toward the rewind
// knob, y up from the base, z forward along the lens. The layout follows the Leica M3: the
// film plane sits 27.8 mm behind the bayonet's face, the rangefinder window 68.5 mm from the
// viewfinder's, and the shutter's curtains run across the frame just in front of the film.
import { BufferAttribute, BufferGeometry, Matrix4 } from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import { KHRMaterialsIOR, KHRMaterialsTransmission, KHRTextureTransform } from '@gltf-transform/extensions';
import { Geo, alongAxis, circle, contours, cw, extrude, lathe, sd } from '../watch/geometry.mjs';
import { box, localCentre, plate, put, rect, revolve, ring, shaft, spur } from './solids.mjs';
import { FILM, filmTexture } from './textures.mjs';

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

/** The lens's axis (x, y) and the bayonet's face (z). */
export const LENS_AXIS = [9.95, 33.8];
export const FLANGE = 17.4;
/** The film's emulsion lies the M bayonet's flange focal distance behind the flange; its middle a hair behind that. */
export const FILM_PLANE = FLANGE - 27.8;
const FILM_MID = FILM_PLANE - 0.065;
const FILM_Y = [LENS_AXIS[1] - FILM.width / 2, LENS_AXIS[1] + FILM.width / 2];
/** The 24 × 36 mm frame, centred on the lens. */
export const GATE = { x: [LENS_AXIS[0] - 18, LENS_AXIS[0] + 18], y: [LENS_AXIS[1] - 12, LENS_AXIS[1] + 12] };

/** Focal length the M bayonet's rangefinder cam is cut for: the cam moves as far as this lens would. */
export const CAM_FOCAL = 51.6;
/** Lens extension (mm) to focus at a distance from the film (mm): x·x' = f², with the film and subject 2f + x + x' apart. */
export function extensionFor(distance) {
  const f = CAM_FOCAL;
  const s = distance - 2 * f;
  return (s - Math.sqrt(s * s - 4 * f * f)) / 2;
}
export const NEAREST = 700;
export const MAX_EXTENSION = extensionFor(NEAREST);

/** Where the parts sit. Vertical axes are given as [x, z]. */
export const L = {
  // Film transport. The sprocket meters one frame (eight perforations, 38 mm) a turn.
  sprocket: [-28, FILM_MID + FILM.frame / TAU],
  sprocketRadius: FILM.frame / TAU,
  cassette: [52.55, 0.55],
  cassetteRadius: 12.4,
  cassetteRoll: 9.0,
  takeUp: [-52.52, 0.57],
  takeUpCore: 6.5,
  takeUpRoll: 7.2,
  // The advance lever turns about the shutter release (the release button sits in its hub).
  lever: [-43.7, 5.8],
  gearDeck: [55.6, 56.4],
  /** The take-up drive's gear, a level up so it clears the lever's gear. */
  upperDeck: [56.8, 57.6],
  module: 0.5,
  teeth: { lever: 26, idler: 17, sprocket: 20, spoolIdler: 10, spool: 15 },
  // Rangefinder: the beam runs along x at this height and depth, from the window's prism to the beam splitter.
  beam: { y: 67.35, z: 9.0 },
  rfWindow: -22.65,
  viewfinder: 45.5,
  illumination: 20.1,
  mask: 25.45,
  collimator: 31.2,
  /** The roller lever's vertical shaft, and the roller on its arm (on the lens's cam, at 100° round the mount). */
  rfShaft: [-12, 7.5],
  roller: { r: 16.6, angle: 100 * DEG, radius: 1.4 },
  swingingLens: [-16.5, 9.0],
  // The body casting.
  deck: [53.4, 54.4],
  floor: [5.8, 6.8],
  lightBox: { x: [-8.8, 28.7], y: [21.0, 46.6], z: [-2.3, 4.5], wall: 0.8 },
  bulkhead: [4.5, 5.5],
  /** The body's inside, round its walls (a stadium in x–z): ends of this radius about these centres. */
  inside: { ends: [-52.55, 52.55], z: 0.55, radius: 14.0 },
};
L.roller.at = [LENS_AXIS[0] + L.roller.r * Math.cos(L.roller.angle), LENS_AXIS[1] + L.roller.r * Math.sin(L.roller.angle)];
L.camRest = 10.6;
L.roller.z = L.camRest - L.roller.radius - 0.05;

// ------------------------------------------------------------------ curtains

/** Cloth thickness, and how much a roll grows per turn. */
const CLOTH = 0.15;
const LAYER = 0.16;
const ROLLER = 2.18;
const SPIRAL_BASE = ROLLER + CLOTH / 2 + 0.02;
const CLOTH_Y = [19.4, 48.2];
const TAPE_Y = [[19.4, 20.8], [46.8, 48.2]];
const ROLLER_Y = [19.0, 48.6];
/** The edge positions: cocked, at the frame's start side (overlapping a little); run, past its far side. */
const EDGE = { cocked: GATE.x[0] - 1.0, run: GATE.x[1] + 1.0 };

/**
 * The two curtains. Each is a cloth wound on its home roller with tapes from its edge bar to
 * the far roller: the first curtain covers the frame when cocked and its spring roller pulls
 * it clear; the second, wound up on the cocking side, follows it across after the exposure.
 */
export const CURTAINS = {
  first_curtain: { home: { x: 30.4, z: -5.5 }, far: { x: -11.4, z: -5.5 }, edge: [EDGE.cocked, EDGE.run], cloth: 41.0, tapes: 41.9 },
  second_curtain: { home: { x: -17.0, z: -6.2 }, far: { x: 35.9, z: -6.2 }, edge: [EDGE.cocked + 0.5, EDGE.run], cloth: 47.5, tapes: 46.0 },
};
const K = LAYER / TAU;
/** Angle wound from a roll's innermost point to arc length u along an Archimedean spiral. */
const spiralAngle = (u) => (Math.sqrt(SPIRAL_BASE * SPIRAL_BASE + 2 * K * Math.max(0, u)) - SPIRAL_BASE) / K;

/**
 * Where a curtain lies with its edge bar at x = edge: for arc length u from its home roller's
 * innermost turn, the point in the x–z plane, and the direction its front face looks. The
 * viewer runs the same sums (src/viewer/cloth.ts) to animate it.
 */
export function clothPath(c, edge) {
  const sigma = Math.sign(c.far.x - c.home.x);
  const wHome = c.cloth - Math.abs(edge - c.home.x);
  const span = Math.abs(c.far.x - c.home.x);
  const wFar = c.cloth + c.tapes - wHome - span;
  const tHome = spiralAngle(wHome);
  const tFar = spiralAngle(wFar);
  const pHome = [c.home.x, c.home.z - (SPIRAL_BASE + K * tHome)];
  const pFar = [c.far.x, c.far.z - (SPIRAL_BASE + K * tFar)];
  const dir = [(pFar[0] - pHome[0]) / span, (pFar[1] - pHome[1]) / span];
  const flatNormal = [-dir[1] * sigma, dir[0] * sigma];
  const at = (u) => {
    if (u <= wHome) {
      const t = spiralAngle(u);
      const rho = SPIRAL_BASE + K * t;
      const phi = -Math.PI / 2 - sigma * (tHome - t);
      return { p: [c.home.x + rho * Math.cos(phi), c.home.z + rho * Math.sin(phi)], n: [-Math.cos(phi), -Math.sin(phi)] };
    }
    if (u >= wHome + span) {
      const t = spiralAngle(c.cloth + c.tapes - u);
      const rho = SPIRAL_BASE + K * t;
      const phi = -Math.PI / 2 + sigma * (tFar - t);
      return { p: [c.far.x + rho * Math.cos(phi), c.far.z + rho * Math.sin(phi)], n: [-Math.cos(phi), -Math.sin(phi)] };
    }
    const s = u - wHome;
    return { p: [pHome[0] + dir[0] * s, pHome[1] + dir[1] * s], n: flatNormal };
  };
  /** How far each roller has turned (radians about +y) from the cocked state. */
  return { at, home: sigma * tHome, far: -sigma * tFar };
}

/** The extras a curtain's node carries, for the viewer's cloth (camera-frame mm). */
function clothExtras(name) {
  const c = CURTAINS[name];
  return { cloth: { ...c, base: SPIRAL_BASE, layer: LAYER, uSpan: U_SPAN, wSpan: W_SPAN } };
}
/** A curtain's _CLOTH attribute packs each vertex's arc length and its offset from the cloth's middle into 0..1. */
const U_SPAN = 100;
const W_SPAN = 1;

/** A curtain: cloth, edge bar and tapes, built along u and laid out as clothPath has it at rest. */
function curtain(name, parent) {
  const c = CURTAINS[name];
  const part = new Part(name, { parent, extras: clothExtras(name) });
  const path = clothPath(c, c.edge[0]);
  const uv1 = new Map();
  const strip = (key, u0, u1, y0, y1, half, step = 0.25) => {
    const geo = part.geo(key);
    const list = uv1.get(geo) ?? [];
    uv1.set(geo, list);
    const us = [];
    for (let u = u0; u < u1; u += step) us.push(u);
    us.push(u1);
    const vertex = (u, w, y, normal) => {
      const { p, n } = path.at(u);
      const pos = [p[0] + n[0] * w, y, p[1] + n[1] * w];
      const m = normal === 'face' ? [n[0] * Math.sign(w), 0, n[1] * Math.sign(w)] : normal;
      list.push(u / U_SPAN, (w / W_SPAN + 1) / 2);
      return geo.vertex(pos, m);
    };
    // Front and back faces.
    for (const w of [half, -half]) {
      const row = us.map((u) => [vertex(u, w, y0, 'face'), vertex(u, w, y1, 'face')]);
      for (let i = 0; i < us.length - 1; i++) {
        const [a, b] = row[i];
        const [c2, d] = row[i + 1];
        const { n } = path.at(us[i]);
        const facing = [n[0] * Math.sign(w), 0, n[1] * Math.sign(w)];
        geo.tri(a, c2, d, facing);
        geo.tri(a, d, b, facing);
      }
    }
    // Top and bottom edges.
    for (const [y, ny] of [[y0, -1], [y1, 1]]) {
      const row = us.map((u) => [vertex(u, half, y, [0, ny, 0]), vertex(u, -half, y, [0, ny, 0])]);
      for (let i = 0; i < us.length - 1; i++) {
        const [a, b] = row[i];
        const [c2, d] = row[i + 1];
        geo.tri(a, c2, d, [0, ny, 0]);
        geo.tri(a, d, b, [0, ny, 0]);
      }
    }
  };
  strip('cloth', 0, c.cloth, CLOTH_Y[0], CLOTH_Y[1], CLOTH / 2);
  for (const [y0, y1] of TAPE_Y) strip('tape', c.cloth, c.cloth + c.tapes, y0, y1, 0.06);
  // The edge bar: rigid, always on the flat run.
  strip('paint', c.cloth - 0.5, c.cloth + 0.7, CLOTH_Y[0] - 0.2, CLOTH_Y[1] + 0.2, 0.25, 0.3);
  part.uv1 = uv1;
  return part;
}

// ------------------------------------------------------------------ materials

const srgb = (hex) => [0, 2, 4].map((i) => ((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))(parseInt(hex.slice(i + 1, i + 3), 16) / 255));

/** Materials for the parts the build adds, by key. */
export async function materialsFor(doc) {
  const transmission = doc.createExtension(KHRMaterialsTransmission);
  const ior = doc.createExtension(KHRMaterialsIOR);
  const transform = doc.createExtension(KHRTextureTransform);
  const material = (name, hex, metallic, roughness) =>
    doc.createMaterial(name).setBaseColorFactor([...srgb(hex), 1]).setMetallicFactor(metallic).setRoughnessFactor(roughness);
  const glass = (name, hex) =>
    material(name, hex, 0, 0.02)
      .setExtension('KHR_materials_transmission', transmission.createTransmission().setTransmissionFactor(1))
      .setExtension('KHR_materials_ior', ior.createIOR().setIOR(1.52));
  const filmImage = doc.createTexture('film_perforations').setImage(await filmTexture()).setMimeType('image/png').setURI('film_perforations.png');
  const film = material('camera_film', '#ffffff', 0, 0.36).setBaseColorTexture(filmImage).setAlphaMode('MASK').setAlphaCutoff(0.5).setDoubleSided(true);
  // The strip's u runs 0..1 along its whole length; the transform repeats one frame per 38 mm.
  film.getBaseColorTextureInfo().setExtension('KHR_texture_transform', transform.createTransform().setScale([FILM_STRIP.length / FILM.frame, 1]).setOffset([FILM_STRIP.phase, 0]));
  return {
    // The top cover and base plate are pressed brass, painted outside; the body is a casting, black inside.
    inside: material('camera_inside_brass', '#a8874f', 1, 0.5),
    casting: material('camera_casting', '#2c2d2f', 0.5, 0.6),
    matte: material('camera_matte_black', '#101010', 0, 0.92),
    paint: material('camera_black_paint', '#161618', 0.15, 0.42),
    chrome: material('camera_chrome', '#d9dadc', 1, 0.16),
    steel: material('camera_steel', '#b8bcc3', 1, 0.3),
    brass: material('camera_brass', '#cfa75c', 1, 0.32),
    cloth: material('camera_curtain', '#1d1d20', 0, 0.55).setDoubleSided(true),
    tape: material('camera_ribbon', '#2a2a2d', 0, 0.7),
    film,
    filmRoll: material('camera_film_roll', '#4f3d30', 0, 0.4),
    tin: material('camera_cassette', '#a2a6ad', 1, 0.36),
    velvet: material('camera_velvet', '#0b0b0b', 0, 1),
    mirror: material('camera_mirror', '#eceef0', 1, 0.04),
    glass: glass('camera_optical_glass', '#eef5f3'),
    frosted: material('camera_frosted_glass', '#e3e3de', 0, 0.8),
    blackGlass: material('camera_pressure_glass', '#0c0c0d', 0, 0.06),
  };
}

/** A generated part: geometry by material key, all in the camera frame. */
export class Part {
  constructor(name, { parent, extras } = {}) {
    this.name = name;
    this.parent = parent;
    this.extras = extras;
    this.geos = new Map();
    /** Per Geo, _CLOTH values (two a vertex), for parts the viewer deforms. */
    this.uv1 = null;
  }

  geo(material) {
    if (!this.geos.has(material)) this.geos.set(material, new Geo());
    return this.geos.get(material);
  }
}

// ---------------------------------------------------------------- the film

/** The strip's path from the cassette's roll to the take-up roll, in x–z: straight runs and arcs. */
const FILM_STRIP = (() => {
  const pts = [];
  const add = (p) => pts.push(p);
  // Off the cassette's roll toward its mouth.
  const lip = [43.5, FILM_MID];
  const c = L.cassette;
  const toLip = [lip[0] - c[0], lip[1] - c[1]];
  const d = Math.hypot(...toLip);
  const leave = Math.atan2(toLip[1], toLip[0]) + Math.acos(L.cassetteRoll / d);
  const rollPoint = (a) => [c[0] + L.cassetteRoll * Math.cos(a), c[1] + L.cassetteRoll * Math.sin(a)];
  for (let a = leave + 50 * DEG; a >= leave; a -= 2 * DEG) add(rollPoint(a));
  add(rollPoint(leave));
  add(lip);
  // Across the gate to the sprocket, round its back, then on to the take-up roll's back.
  const s = L.sprocket;
  const R1 = L.sprocketRadius;
  const t = L.takeUp;
  const R2 = L.takeUpRoll + 0.075;
  const dx = t[0] - s[0];
  const dz = t[1] - s[1];
  const dist = Math.hypot(dx, dz);
  const u = [dx / dist, dz / dist];
  // The external tangent on the back of both: the same normal n at each, with n·u = (R1 − R2) / distance.
  const along = (R1 - R2) / dist;
  const across = Math.sqrt(1 - along * along);
  const candidates = [[-u[1], u[0]], [u[1], -u[0]]].map(([px, pz]) => [along * u[0] + across * px, along * u[1] + across * pz]);
  const normal = candidates[0][1] < candidates[1][1] ? candidates[0] : candidates[1];
  const tangentAngle = Math.atan2(normal[1], normal[0]);
  for (let a = -90 * DEG; a >= tangentAngle; a -= 1.5 * DEG) add([s[0] + R1 * Math.cos(a), s[1] + R1 * Math.sin(a)]);
  add([s[0] + R1 * normal[0], s[1] + R1 * normal[1]]);
  // Round the take-up roll, a quarter turn and a bit, onto the film already wound there.
  for (let a = tangentAngle; a >= tangentAngle - 110 * DEG; a -= 2 * DEG) add([t[0] + R2 * Math.cos(a), t[1] + R2 * Math.sin(a)]);
  const lengths = [0];
  for (let i = 1; i < pts.length; i++) lengths.push(lengths[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  // Line the perforations up with the sprocket's teeth: a hole centred where the film meets the sprocket's back.
  const bottom = pts.findIndex((p) => Math.abs(p[0] - s[0]) < 1e-6 && p[1] < s[1]);
  const length = lengths[lengths.length - 1];
  const holeOffset = FILM.pitch / 2;
  const phase = (((holeOffset - lengths[bottom]) / FILM.frame) % 1 + 1) % 1;
  return { pts, lengths, length, phase, tangentAngle, rollLeave: leave, mouth: { from: rollPoint(leave), to: lip } };
})();

function filmParts() {
  const parts = [];

  // The strip itself: a front and a back face, uv along its length and across its width.
  const strip = new Part('film');
  {
    const geo = strip.geo('film');
    const { pts, lengths, length } = FILM_STRIP;
    const half = 0.065;
    for (const side of [1, -1]) {
      const rows = pts.map((p, i) => {
        const a = pts[Math.max(0, i - 1)];
        const b = pts[Math.min(pts.length - 1, i + 1)];
        const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        // The normal on the lens's side of the path: the path runs −x along the gate, so +z is to its right.
        const m = [-(b[1] - a[1]) / l, (b[0] - a[0]) / l].map((v) => -v);
        const q = [p[0] + m[0] * half * side, p[1] + m[1] * half * side];
        const normal = [m[0] * side, 0, m[1] * side];
        const u = lengths[i] / length;
        return [geo.vertex([q[0], FILM_Y[0], q[1]], normal, [u, 0]), geo.vertex([q[0], FILM_Y[1], q[1]], normal, [u, 1])];
      });
      for (let i = 0; i < rows.length - 1; i++) {
        const [a, b] = rows[i];
        const [c, d] = rows[i + 1];
        const normal = geo.normals.slice(a * 3, a * 3 + 3);
        geo.tri(a, c, d, normal);
        geo.tri(a, d, b, normal);
      }
    }
  }
  parts.push(strip);

  // The cassette: a tin shell with caps and a velvet-lined mouth, and inside it the spool with the film still to come.
  const cassette = new Part('film_cassette');
  {
    const [cx, cz] = L.cassette;
    const shell = [FILM_Y[0] - 1.75, FILM_Y[1] + 1.75];
    // Where the film's way out (from its roll to the mouth) crosses the shell.
    const { mouth } = FILM_STRIP;
    const dir = [mouth.to[0] - mouth.from[0], mouth.to[1] - mouth.from[1]];
    const len = Math.hypot(...dir);
    const u = [dir[0] / len, dir[1] / len];
    const n = [-u[1], u[0]];
    let t = 0;
    while (Math.hypot(mouth.from[0] + u[0] * t - cx, mouth.from[1] + u[1] * t - cz) < 12.2) t += 0.01;
    const cross = Math.atan2(mouth.from[1] + u[1] * t - cz, mouth.from[0] + u[0] * t - cx);
    // Lathe angles run the other way round from the camera's x–z angles.
    const gap = 1.6 / 12.2;
    revolve(cassette.geo('tin'), 'y', [cx, 0, cz], [[12.0, shell[1] - 0.5], [12.0, shell[0] + 0.5], [L.cassetteRadius, shell[0] + 0.5], [L.cassetteRadius, shell[1] - 0.5], [12.0, shell[1] - 0.5]], { segments: 72, start: -cross + gap, length: TAU - 2 * gap });
    for (const [y0, y1] of [[shell[0], shell[0] + 0.5], [shell[1] - 0.5, shell[1]]]) {
      revolve(cassette.geo('tin'), 'y', [cx, 0, cz], [[3.15, y1], [3.15, y0], [12.6, y0], [12.6, y1], [3.15, y1]], { segments: 72 });
    }
    // The mouth: velvet lips either side of the film, backed by tin, from inside the shell to where the film comes out.
    const lip = (w0, w1, key) => {
      const s0 = t - 0.9;
      const at = (s, w) => [mouth.from[0] + u[0] * s + n[0] * w, mouth.from[1] + u[1] * s + n[1] * w];
      plate(cassette.geo(key), 'y', { outer: [at(s0, w0), at(len, w0), at(len, w1), at(s0, w1)] }, shell[0] + 0.5, shell[1] - 0.5);
    };
    lip(0.13, 0.55, 'velvet');
    lip(-0.55, -0.13, 'velvet');
    lip(0.55, 0.95, 'tin');
    lip(-0.95, -0.55, 'tin');
  }
  parts.push(cassette);
  const spool = new Part('cassette_spool', { parent: 'film_cassette' });
  {
    const [cx, cz] = L.cassette;
    shaft(spool.geo('paint'), 'y', [cx, 0, cz], [[2.9, FILM_Y[0] - 2.9], [2.9, FILM_Y[0] - 1.2], [3.4, FILM_Y[0] - 1.2], [3.4, FILM_Y[1] + 1.2], [2.9, FILM_Y[1] + 1.2], [2.9, FILM_Y[1] + 1.95]]);
    // The film still on it, cut away where the strip leaves the roll.
    revolve(spool.geo('filmRoll'), 'y', [cx, 0, cz], [[3.45, FILM_Y[1]], [3.45, FILM_Y[0]], [L.cassetteRoll - 0.08, FILM_Y[0]], [L.cassetteRoll - 0.08, FILM_Y[1]], [3.45, FILM_Y[1]]], { segments: 72 });
  }
  parts.push(spool);

  // The take-up spool, with the frames already taken wound on it.
  const takeUp = new Part('take_up_spool');
  {
    const [tx, tz] = L.takeUp;
    shaft(takeUp.geo('paint'), 'y', [tx, 0, tz], [[L.takeUpCore, FILM_Y[0] - 0.4], [L.takeUpCore, FILM_Y[1] + 0.4]]);
    for (const [y0, y1] of [[FILM_Y[0] - 1.2, FILM_Y[0] - 0.4], [FILM_Y[1] + 0.4, FILM_Y[1] + 1.2]]) {
      revolve(takeUp.geo('chrome'), 'y', [tx, 0, tz], [[1.0, y1], [1.0, y0], [9.2, y0], [9.2, y1], [1.0, y1]], { segments: 64 });
    }
    shaft(takeUp.geo('chrome'), 'y', [tx, 0, tz], [[2.4, FILM_Y[1] + 1.2], [2.4, FILM_Y[1] + 1.75]]);
    revolve(takeUp.geo('filmRoll'), 'y', [tx, 0, tz], [[L.takeUpCore + 0.02, FILM_Y[1]], [L.takeUpCore + 0.02, FILM_Y[0]], [L.takeUpRoll, FILM_Y[0]], [L.takeUpRoll, FILM_Y[1]], [L.takeUpCore + 0.02, FILM_Y[1]]], { segments: 72 });
  }
  parts.push(takeUp);

  // The sprocket: a hub with a toothed rim at each row of perforations, its shaft up through the deck to its gear.
  const sprocket = new Part('sprocket');
  {
    const [sx, sz] = L.sprocket;
    const rim = L.sprocketRadius - 0.065 - 0.035;
    const rows = [FILM_Y[0] + FILM.hole.inset + FILM.hole.across / 2, FILM_Y[1] - FILM.hole.inset - FILM.hole.across / 2];
    shaft(sprocket.geo('steel'), 'y', [sx, 0, sz], [[3.0, rows[0] - 2.4], [3.0, rows[1] + 2.4]]);
    for (const y of rows) {
      shaft(sprocket.geo('steel'), 'y', [sx, 0, sz], [[rim, y - 2.1], [rim, y + 2.1]], { segments: 64 });
      for (let k = 0; k < 8; k++) {
        const a = -90 * DEG + (k * TAU) / 8;
        const tooth = new Geo();
        // A tooth: rounded top, narrower than the perforation it sits in.
        extrude(tooth, tooth, { outer: rect([-0.65, 0.65], [-0.95, 0.95], 0.3) }, 0, 0.9, { chamfer: 0.25 });
        sprocket.geo('steel').append(tooth, alongAxis([Math.cos(a), 0, Math.sin(a)], [sx + (rim - 0.05) * Math.cos(a), y, sz + (rim - 0.05) * Math.sin(a)]));
      }
    }
    shaft(sprocket.geo('steel'), 'y', [sx, 0, sz], [[1.0, rows[1] + 2.4], [1.0, L.gearDeck[1] + 0.2]]);
    sprocket.gear = spur(sprocket.geo('brass'), 'y', [sx, 0, sz], { teeth: L.teeth.sprocket, module: L.module, phase: PHASE.sprocket, bore: 1.0 }, L.gearDeck[0], L.gearDeck[1]);
  }
  parts.push(sprocket);
  return parts;
}

// ------------------------------------------------------------- the advance

/** Gear phases so the advance train's teeth fall between each other at rest. */
const PHASE = {};
const GEARS = (() => {
  const r = (teeth) => (teeth * L.module) / 2;
  const meet = (a, ra, b, rb, side) => {
    // The point at distances ra and rb from a and b (a triangle), on one side of the line a → b.
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const x = (ra * ra - rb * rb + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, ra * ra - x * x));
    const u = [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
    return [a[0] + u[0] * x - u[1] * h * side, a[1] + u[1] * x + u[0] * h * side];
  };
  const idler = meet(L.lever, r(L.teeth.lever) + r(L.teeth.idler), L.sprocket, r(L.teeth.idler) + r(L.teeth.sprocket), -1);
  const spoolIdler = meet(L.lever, r(L.teeth.lever) + r(L.teeth.spoolIdler), L.takeUp, r(L.teeth.spoolIdler) + r(L.teeth.spool), 1);
  return { idler, spoolIdler };
})();
(() => {
  const g = (teeth, at, phase) => ({ teeth, module: L.module, center: localCentre('y', [at[0], 0, at[1]]), phase });
  const meshPhase = (a, b) => {
    const beta = Math.atan2(b.center[1] - a.center[1], b.center[0] - a.center[0]);
    const pitchA = TAU / a.teeth;
    const k = Math.round((beta - a.phase) / pitchA);
    const thetaA = a.phase + k * pitchA;
    const rA = (a.module * a.teeth) / 2;
    const rB = (b.module * b.teeth) / 2;
    return beta + Math.PI - ((thetaA - beta) * rA) / rB + Math.PI / b.teeth;
  };
  PHASE.lever = 0;
  const lever = g(L.teeth.lever, L.lever, 0);
  PHASE.idler = meshPhase(lever, g(L.teeth.idler, GEARS.idler));
  PHASE.sprocket = meshPhase(g(L.teeth.idler, GEARS.idler, PHASE.idler), g(L.teeth.sprocket, L.sprocket));
  PHASE.spoolIdler = meshPhase(lever, g(L.teeth.spoolIdler, GEARS.spoolIdler));
  PHASE.spool = meshPhase(g(L.teeth.spoolIdler, GEARS.spoolIdler, PHASE.spoolIdler), g(L.teeth.spool, L.takeUp));
})();

function advanceParts() {
  const parts = [];
  const [lx, lz] = L.lever;
  // The lever's hollow shaft, down from its hub through the top cover to the gear it drives, and the release's plunger inside it.
  const lever = new Part('advance_lever');
  shaft(lever.geo('chrome'), 'y', [lx, 0, lz], [[1.6, L.gearDeck[0] + 0.05], [1.6, 73.45]], { bore: 0.85 });
  parts.push(lever);
  const release = new Part('release_button');
  shaft(release.geo('chrome'), 'y', [lx, 0, lz], [[0.7, L.gearDeck[0] - 0.4], [0.7, 71.4]]);
  parts.push(release);

  const gear = new Part('advance_gear');
  spur(gear.geo('brass'), 'y', [lx, 0, lz], { teeth: L.teeth.lever, module: L.module, phase: PHASE.lever, bore: 1.7 }, L.gearDeck[0], L.gearDeck[1]);
  shaft(gear.geo('brass'), 'y', [lx, 0, lz], [[2.7, L.deck[1] + 0.05], [2.7, L.gearDeck[0]]], { bore: 1.7 });
  parts.push(gear);

  const idler = new Part('idler_gear');
  spur(idler.geo('brass'), 'y', [GEARS.idler[0], 0, GEARS.idler[1]], { teeth: L.teeth.idler, module: L.module, phase: PHASE.idler, bore: 0 }, L.gearDeck[0], L.gearDeck[1]);
  shaft(idler.geo('steel'), 'y', [GEARS.idler[0], 0, GEARS.idler[1]], [[1.2, L.deck[1] + 0.05], [1.2, L.gearDeck[1] + 0.35]]);
  parts.push(idler);

  const spoolIdler = new Part('spool_idler');
  spur(spoolIdler.geo('brass'), 'y', [GEARS.spoolIdler[0], 0, GEARS.spoolIdler[1]], { teeth: L.teeth.spoolIdler, module: L.module, phase: PHASE.spoolIdler }, L.gearDeck[0], L.upperDeck[1]);
  shaft(spoolIdler.geo('steel'), 'y', [GEARS.spoolIdler[0], 0, GEARS.spoolIdler[1]], [[0.9, L.deck[1] + 0.05], [0.9, L.upperDeck[1] + 0.35]]);
  parts.push(spoolIdler);

  // The take-up drive: a gear and a shaft down through the deck, keyed into the spool's top through a slipping clutch.
  const drive = new Part('spool_drive');
  const [tx, tz] = L.takeUp;
  spur(drive.geo('brass'), 'y', [tx, 0, tz], { teeth: L.teeth.spool, module: L.module, phase: PHASE.spool, bore: 0 }, L.upperDeck[0], L.upperDeck[1]);
  shaft(drive.geo('steel'), 'y', [tx, 0, tz], [[1.0, FILM_Y[1] + 1.8], [1.0, L.upperDeck[0]], [1.6, L.upperDeck[0]], [1.6, L.upperDeck[1] + 0.3]]);
  parts.push(drive);
  return parts;
}

// ------------------------------------------------------------ the shutter

export const ROLLERS = {
  roller_b1: { curtain: 'first_curtain', end: 'home' },
  roller_a1: { curtain: 'first_curtain', end: 'far' },
  roller_a2: { curtain: 'second_curtain', end: 'home' },
  roller_b2: { curtain: 'second_curtain', end: 'far' },
};
const rollerAt = (name) => CURTAINS[ROLLERS[name].curtain][ROLLERS[name].end];

function shutterParts() {
  const parts = [];
  const unit = new Part('shutter');
  // The gate: a plate with the 24 × 36 mm frame cut in it, rails along the film's edges to hold it flat.
  const gatePlate = { x: [-12.0, 32.0], y: [15.2, 52.4], z: [FILM_PLANE + 0.15, -9.1] };
  plate(unit.geo('paint'), 'z', { outer: rect(gatePlate.x, gatePlate.y, 1.0), holes: [cw(rect(GATE.x, GATE.y, 0.4))] }, gatePlate.z[0], gatePlate.z[1], { chamfer: 0.15 });
  for (const y of [[FILM_Y[0] + 0.1, FILM_Y[0] + 1.7], [FILM_Y[1] - 1.7, FILM_Y[1] - 0.1]]) box(unit.geo('chrome'), gatePlate.x, y, [FILM_PLANE, FILM_PLANE + 0.16]);
  for (const y of [[GATE.y[0] - 1.2, GATE.y[0]], [GATE.y[1], GATE.y[1] + 1.2]]) box(unit.geo('chrome'), [GATE.x[0], GATE.x[1]], y, [FILM_PLANE + 0.07, FILM_PLANE + 0.16]);
  // The crate: plates above and below the rollers, holding their axles, and the housings for the springs and the cocking gears.
  const crateX = [-19.9, 38.2];
  const crateZ = [-8.95, -2.45];
  const axleHoles = Object.keys(ROLLERS).map((name) => cw(ring(0.7, rollerAt(name).x, rollerAt(name).z)));
  for (const y of [[17.8, 18.6], [49.0, 49.8]]) plate(unit.geo('paint'), 'y', { outer: rect(crateX, crateZ, 0.8), holes: axleHoles }, y[0], y[1], { chamfer: 0.12 });
  box(unit.geo('paint'), [-19.9, -8.9], [49.8, 53.1], crateZ, { round: 0.8, chamfer: 0.2 });
  box(unit.geo('paint'), [29.6, 38.2], [49.8, 53.1], crateZ, { round: 0.8, chamfer: 0.2 });
  parts.push(unit);

  for (const name of Object.keys(ROLLERS)) {
    const at = rollerAt(name);
    const roller = new Part(name, { parent: 'shutter' });
    shaft(roller.geo('steel'), 'y', [at.x, 0, at.z], [[0.55, 18.0], [0.55, ROLLER_Y[0]], [ROLLER, ROLLER_Y[0]], [ROLLER, ROLLER_Y[1]], [0.55, ROLLER_Y[1]], [0.55, 49.6]], { segments: 40 });
    // A screw slot in each end, so a turn can be seen.
    box(roller.geo('paint'), [at.x - 1.6, at.x + 1.6], [ROLLER_Y[1] - 0.02, ROLLER_Y[1] + 0.12], [at.z - 0.18, at.z + 0.18]);
    parts.push(roller);
  }
  parts.push(curtain('first_curtain', 'shutter'), curtain('second_curtain', 'shutter'));
  return parts;
}

// --------------------------------------------------------- the rangefinder

function rangefinderParts() {
  const parts = [];
  const { y: by, z: bz } = L.beam;
  const unit = new Part('rangefinder');
  // A chassis along the top, with the eyepiece's arm going back, on posts from the deck.
  const chassis = [57.6, 58.4];
  // Its front edge stays clear of the ring round the mount, which reaches inside the top cover.
  const outline = sd.smooth(0.8, sd.box([(L.rfWindow - 5 + L.viewfinder + 5) / 2, 8.1], [(L.viewfinder + 5 - (L.rfWindow - 5)) / 2, 5.1]), sd.box([L.viewfinder, -5.4], [5, 8.75]));
  const ring = sd.box([LENS_AXIS[0] + 0.5, 14.5], [14.5, 2.2], 0, 0.6);
  const shapes = contours((p) => Math.max(outline(p), -ring(p), -sd.circle(L.rfShaft, 1.25)(p)), { min: [-29, -15.5], max: [52, 16] }, 0.1, 0.2);
  plate(unit.geo('casting'), 'y', shapes, chassis[0], chassis[1], { chamfer: 0.15 });
  for (const [x, z] of [[-24, 4.2], [-2, 4.2], [36, 4.2], [L.viewfinder, -11.5]]) shaft(unit.geo('casting'), 'y', [x, 0, z], [[1.0, L.deck[1] + 0.05], [1.0, chassis[0]]]);

  // The window's prism turns the light from the rangefinder window along the beam.
  const prism = (geo, corners, y0, y1) => plate(geo, 'y', { outer: corners }, y0, y1);
  const p = 3.5;
  prism(unit.geo('glass'), [[L.rfWindow - p, bz + p], [L.rfWindow + p, bz + p], [L.rfWindow + p, bz - p]], by - p, by + p);
  box(unit.geo('paint'), [L.rfWindow - 3.2, L.rfWindow + 3.4], [chassis[1], by - p - 0.05], [bz - 2.5, bz + 3.2], { round: 0.6 });

  // The mirror behind the frosted window sends the frame lines along the beam; the beam goes through a hole in it.
  {
    const mirror = new Geo();
    extrude(mirror, mirror, { outer: rect([-4.5, 4.5], [-4.6, 4.6], 0.4), holes: [cw(circle(1.2, 0, 0, 32))] }, -0.3, 0.3, { chamfer: 0.08 });
    unit.geo('mirror').append(mirror, alongAxis([Math.SQRT1_2, 0, Math.SQRT1_2], [L.illumination, by, bz]));
    box(unit.geo('paint'), [L.illumination - 2.2, L.illumination + 2.2], [chassis[1], by - 4.7], [bz - 2.4, bz + 2.4], { round: 0.5 });
  }

  // The collimator, the beam splitter (two prisms cemented on the half-silvered diagonal) and the finder's two lenses.
  const lens = (geo, axis, at, r, thickness, sag) => {
    const profile = [[0, -thickness / 2 - sag], [r, -thickness / 2], [r, thickness / 2], [0, thickness / 2 + sag]];
    revolve(geo, axis, at, profile.map(([rr, w]) => [rr, w + at['xyz'.indexOf(axis)]]), { segments: 48, crease: 50 });
  };
  lens(unit.geo('glass'), 'x', [L.collimator, by, bz], 4.0, 1.4, 0.45);
  revolve(unit.geo('paint'), 'x', [L.collimator, by, bz], [[4.05, L.collimator + 1.1], [4.05, L.collimator - 1.1], [4.8, L.collimator - 1.1], [4.8, L.collimator + 1.1], [4.05, L.collimator + 1.1]], { segments: 48 });
  box(unit.geo('paint'), [L.collimator - 1.0, L.collimator + 1.0], [chassis[1], by - 4.75], [bz - 1.2, bz + 1.2]);
  const v = L.viewfinder;
  const h = 4;
  prism(unit.geo('glass'), [[v - h, bz - h], [v - h, bz + h - 0.02], [v + h - 0.02, bz - h]], by - h, by + h);
  prism(unit.geo('glass'), [[v - h + 0.02, bz + h], [v + h, bz + h], [v + h, bz - h + 0.02]], by - h, by + h);
  box(unit.geo('paint'), [v - h, v + h], [chassis[1], by - h - 0.05], [bz - h, bz + h], { round: 0.5 });
  const objective = [13.4, 14.8];
  revolve(unit.geo('glass'), 'z', [v, by, 0], [[0, objective[0] + 0.55], [6.0, objective[0]], [6.0, objective[1]], [0, objective[1] - 0.55]], { segments: 48 });
  const eyepiece = [-13.6, -12.2];
  lens(unit.geo('glass'), 'z', [v, by, (eyepiece[0] + eyepiece[1]) / 2], 4.6, 1.0, 0.4);
  for (const [z0, z1, r] of [[objective[0] - 0.3, objective[1], 6.0], [eyepiece[0] - 0.2, eyepiece[1] + 0.2, 4.6]]) {
    revolve(unit.geo('paint'), 'z', [v, by, 0], [[r + 0.05, z1], [r + 0.05, z0], [r + 0.7, z0], [r + 0.7, z1], [r + 0.05, z1]], { segments: 48 });
  }
  box(unit.geo('paint'), [v - 1.0, v + 1.0], [chassis[1], by - 6.7], [objective[0] - 0.3, objective[1]]);
  box(unit.geo('paint'), [v - 1.0, v + 1.0], [chassis[1], by - 5.3], [eyepiece[0] - 0.2, eyepiece[1] + 0.2]);
  parts.push(unit);

  // The frosted glass behind the frame-line window, in the top cover: it lights the frame lines evenly.
  const frosted = new Part('top_plate');
  box(frosted.geo('frosted'), [12.9, 27.3], [62.2, 72.8], [15.75, 16.2]);
  parts.push(frosted);

  // The frame-line mask: the 50 mm frame cut as bright lines, and the hole the rangefinder's patch comes through.
  const mask = new Part('frame_mask');
  {
    const [w, hh, line] = [4.2, 2.8, 0.22];
    const frame = sd.subtract(sd.box([bz, by], [w, hh]), sd.box([bz, by], [w - line, hh - line]));
    const gaps = sd.union(sd.box([bz, by], [0.6, hh + 1]), sd.box([bz, by], [w + 1, 0.5]));
    const sdf = sd.subtract(sd.box([bz, by], [4.4, 4.45], 0, 0.3), sd.subtract(frame, gaps), sd.circle([bz, by], 1.2));
    const shapes2 = contours(sdf, { min: [bz - 5, by - 5], max: [bz + 5, by + 5] }, 0.03, 0.06);
    plate(mask.geo('paint'), 'x', shapes2, L.mask - 0.15, L.mask + 0.15);
    box(mask.geo('paint'), [L.mask - 0.8, L.mask + 0.8], [chassis[1] + 0.05, by - 4.5], [bz - 3.5, bz + 3.5]);
  }
  parts.push(mask);

  // The roller lever: a shaft standing in the deck; its lower arm reaches into the lens throat to the roller on the
  // lens's cam, its upper arm carries the moving lens in the rangefinder's beam. Both arms turn together.
  const lever = new Part('roller_lever');
  {
    const [sx, sz] = L.rfShaft;
    const top = by - 3.75;
    shaft(lever.geo('steel'), 'y', [sx, 0, sz], [[0.5, 48.9], [0.8, 49.4], [0.8, top], [0.5, top + 0.3]]);
    const arm = (from, to, y0, y1, width) => {
      const lo = [Math.min(from[0], to[0]) - width, Math.min(from[1], to[1]) - width];
      const hi = [Math.max(from[0], to[0]) + width, Math.max(from[1], to[1]) + width];
      plate(lever.geo('steel'), 'y', contours(sd.capsule(from, to, width / 2), { min: lo, max: hi }, 0.05, 0.12), y0, y1, { chamfer: 0.15 });
    };
    const [rx, ry] = L.roller.at;
    arm(L.rfShaft, [rx, L.roller.z], ry - 0.55, ry + 0.55, 2.0);
    arm(L.rfShaft, L.swingingLens, top - 0.8, top, 1.8);
    // The roller, on an axle across the arm's end.
    const radial = [Math.cos(L.roller.angle), Math.sin(L.roller.angle), 0];
    const wheel = new Geo();
    lathe(wheel, [[0.3, 0.6], [0.3, -0.6], [L.roller.radius, -0.6], [L.roller.radius, 0.6], [0.3, 0.6]], { segments: 32 });
    lever.geo('chrome').append(wheel, alongAxis(radial, [rx, ry, L.roller.z]));
  }
  parts.push(lever);
  const moving = new Part('swinging_lens', { parent: 'roller_lever' });
  {
    const [mx, mz] = L.swingingLens;
    lens(moving.geo('glass'), 'x', [mx, by, mz], 2.45, 1.2, 0.3);
    revolve(moving.geo('steel'), 'x', [mx, by, mz], [[2.5, mx + 0.9], [2.5, mx - 0.9], [3.1, mx - 0.9], [3.1, mx + 0.9], [2.5, mx + 0.9]], { segments: 40 });
  }
  parts.push(moving);
  return parts;
}

// ----------------------------------------------------------------- the lens

/** The iris: nine blades pivoting on pins round the barrel; the opening's radius at f/1.4 fills the stop. Open, the
 *  blades lie in the barrel's wall, out to `outer`; closing, their far ends swing out into the gap under the aperture
 *  ring, never past `reach`. */
export const IRIS = { blades: 9, z: 44.18, pivot: 16.4, edge: 12.5, outer: 17.5, reach: 23.2, thickness: 0.024, step: 0.03 };
export const STOPS = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16];
/** How far a blade turns about its pivot (radians) for the opening at f-number n. */
export function irisAngle(n) {
  const radius = IRIS.edge * (STOPS[0] / n);
  return 2 * Math.asin((IRIS.edge - radius) / (2 * IRIS.pivot));
}
/** The lens is modelled set to f/5.6. */
export const REST_STOP = 4;

function lensParts() {
  const parts = [];
  const [ax, ay] = LENS_AXIS;
  // The rangefinder cam: a block on the back of the optical unit that pushes the roller as the lens comes forward.
  const optics = new Part('rf_cam', { parent: 'optics' });
  {
    const arc = [];
    for (let a = 80; a <= 120; a += 2) arc.push([ax + 17.4 * Math.cos(a * DEG), ay + 17.4 * Math.sin(a * DEG)]);
    for (let a = 120; a >= 80; a -= 2) arc.push([ax + 15.9 * Math.cos(a * DEG), ay + 15.9 * Math.sin(a * DEG)]);
    plate(optics.geo('chrome'), 'z', { outer: arc }, L.camRest, 11.45, { chamfer: 0.12 });
  }
  parts.push(optics);

  // The fixed ring the blades lie against, in the barrel's wall: it closes the corners between them, outside the bore.
  const ring = new Part('iris_ring', { parent: 'optics' });
  revolve(ring.geo('paint'), 'z', [ax, ay, 0], [[12.9, IRIS.z - 0.02], [12.9, IRIS.z - 0.12], [IRIS.outer, IRIS.z - 0.12], [IRIS.outer, IRIS.z - 0.02], [12.9, IRIS.z - 0.02]], { segments: 96 });
  parts.push(ring);

  // The blades, each stacked a hair in front of the last. Each is cut so that, turning on its pin, it stays inside the
  // barrel at every stop.
  const rest = irisAngle(STOPS[REST_STOP]);
  const turns = Array.from({ length: 9 }, (_, i) => (irisAngle(STOPS[STOPS.length - 1]) * i) / 8);
  for (let k = 0; k < IRIS.blades; k++) {
    const psi = 90 * DEG + (k * TAU) / IRIS.blades;
    const P = [IRIS.pivot * Math.cos(psi), IRIS.pivot * Math.sin(psi)];
    const turn = (q, th) => {
      // Closing turns the blade anticlockwise (seen from the front) about its pin, so its edge sweeps in over the opening.
      const c = Math.cos(th);
      const s = Math.sin(th);
      const d = [q[0] - P[0], q[1] - P[1]];
      return [P[0] + d[0] * c - d[1] * s, P[1] + d[0] * s + d[1] * c];
    };
    const span = (q) => {
      // The blade's sector: from well behind its pin round 160° ahead of it, so closed down the blades still overlap.
      const a = Math.atan2(q[1], q[0]);
      const rel = Math.atan2(Math.sin(a - psi), Math.cos(a - psi));
      return Math.max(-40 * DEG - rel, rel - 160 * DEG) * 12;
    };
    const blade = (q) => {
      const r = Math.hypot(...q);
      let d = Math.max(IRIS.edge - r, r - IRIS.outer, span(q));
      for (const th of turns) d = Math.max(d, Math.hypot(...turn(q, th)) - IRIS.reach);
      return d;
    };
    // Shaped at rest-open, then turned to the f/5.6 the lens is set at. Only the outline: the pin covers its hole, and
    // the clip can leave specks inside the blade that would show as pinholes of light.
    const shapes = contours(blade, { min: [-IRIS.outer - 1, -IRIS.outer - 1], max: [IRIS.outer + 1, IRIS.outer + 1] }, 0.06, 0.1).map(({ outer }) => ({ outer, holes: [] }));
    const part = new Part(`iris_blade_${k}`, { parent: 'optics', extras: { pivot: [ax + P[0], ay + P[1]] } });
    const z = IRIS.z + k * IRIS.step;
    const local = new Geo();
    extrude(local, local, shapes, z, z + IRIS.thickness);
    part.geo('paint').append(local, (pp, n) => {
      const [x, y] = turn([pp[0], pp[1]], rest);
      const c = Math.cos(rest);
      const s = Math.sin(rest);
      return [[x + ax, y + ay, pp[2]], [n[0] * c - n[1] * s, n[0] * s + n[1] * c, n[2]]];
    });
    // The pin it turns on.
    shaft(part.geo('steel'), 'z', [ax + P[0], ay + P[1], 0], [[0.38, z - 0.004], [0.38, z + IRIS.thickness + 0.004]], { segments: 16 });
    parts.push(part);
  }
  return parts;
}

// ------------------------------------------------------------ the casting

function castingParts() {
  const body = new Part('body_casting', { parent: 'body' });
  const { lightBox: lb } = L;
  // The light box: a black tunnel from the lens throat back to the shutter.
  const [x0, x1] = lb.x;
  const [y0, y1] = lb.y;
  const w = lb.wall;
  box(body.geo('matte'), [x0 - w, x1 + w], [y1, y1 + w], lb.z);
  box(body.geo('matte'), [x0 - w, x1 + w], [y0 - w, y0], lb.z);
  box(body.geo('matte'), [x0 - w, x0], [y0, y1], lb.z);
  box(body.geo('matte'), [x1, x1 + w], [y0, y1], lb.z);
  // The bulkhead behind the throat, with the light box's mouth in it.
  const bulk = (p) => Math.max(sd.circle(LENS_AXIS, 22.2)(p), p[1] - 53.2, -sd.box([(x0 + x1) / 2, (y0 + y1) / 2], [(x1 - x0) / 2, (y1 - y0) / 2])(p));
  plate(body.geo('matte'), 'z', contours(bulk, { min: [-14, 10], max: [34, 54] }, 0.1, 0.2), L.bulkhead[0], L.bulkhead[1]);

  // The deck: the casting's top, under the top cover, with holes for the shafts that come up through it.
  const { ends, z: cz, radius } = L.inside;
  const holes = [[L.rfShaft, 1.25], [L.sprocket, 1.25], [L.lever, 2.1], [L.takeUp, 1.4], [L.cassette, 4.6]];
  // The throat and the raised ring round the mount come up past the deck's level at the front.
  const throat = sd.box([LENS_AXIS[0], 14.0], [25.5, 4.5], 0, 1.5);
  const deck = (p) => Math.max(sd.capsule([ends[0], cz], [ends[1], cz], radius)(p), -throat(p), ...holes.map(([at, r]) => -sd.circle(at, r)(p)));
  plate(body.geo('casting'), 'y', contours(deck, { min: [-68, -15], max: [68, 16] }, 0.12, 0.24), L.deck[0], L.deck[1], { chamfer: 0.2 });

  // A floor under the shutter, between the film chambers, stopping short of the film's path.
  box(body.geo('casting'), [-38.0, 38.5], L.floor, [FILM_PLANE + 0.8, 15.2]);

  // The film chambers' walls: round the cassette, and round the take-up spool, open where the film runs.
  const chamber = ([cx, czz], r0, r1, a0, a1) => {
    const pts = [];
    for (let a = a0; a <= a1 + 1e-9; a += 3) pts.push([cx + r1 * Math.cos(a * DEG), czz + r1 * Math.sin(a * DEG)]);
    for (let a = a1; a >= a0 - 1e-9; a -= 3) pts.push([cx + r0 * Math.cos(a * DEG), czz + r0 * Math.sin(a * DEG)]);
    plate(body.geo('casting'), 'y', { outer: pts }, L.floor[1], L.deck[0]);
  };
  chamber(L.cassette, 13.8, 14.6, 90, 222);
  chamber(L.takeUp, 12.2, 13.0, -25, 92);
  return [body];
}

// ------------------------------------------------------------ the door

function doorParts() {
  // The pressure plate (glass, on early M3s) holds the film flat against the rails, on springs from the back door.
  const part = new Part('pressure_plate', { parent: 'back_door' });
  const x = [-17.0, 37.0];
  const y = [FILM_Y[0] + 0.3, FILM_Y[1] - 0.3];
  const front = FILM_PLANE - 0.2;
  box(part.geo('blackGlass'), x, y, [front - 1.6, front], { axis: 'z', round: 1.4 });
  plate(part.geo('chrome'), 'z', { outer: rect([x[0] - 0.6, x[1] + 0.6], [y[0] - 0.6, y[1] + 0.6], 1.8), holes: [cw(rect(x, y, 1.4))] }, front - 1.9, front - 0.1);
  for (const [px, py] of [[-12, 22], [32, 22], [-12, 45.6], [32, 45.6]]) shaft(part.geo('steel'), 'z', [px, py, 0], [[0.9, -15.35], [0.9, front - 1.6]]);
  return [part];
}

export function buildMechanism() {
  return [...castingParts(), ...shutterParts(), ...filmParts(), ...advanceParts(), ...rangefinderParts(), ...lensParts(), ...doorParts()];
}

// ------------------------------------------------------------------- hints

/** Model-space numbers for the content file's motions: pivots, axes and how far each part turns. */
export function partHints(toModel, scale) {
  const vertical = ([x, z]) => toModel([x, 0, z]);
  const round = (v, d = 4) => +v.toFixed(d);
  const rollers = Object.fromEntries(
    Object.keys(ROLLERS).map((name) => {
      const { curtain: c, end } = ROLLERS[name];
      const cfg = CURTAINS[c];
      const rest = clothPath(cfg, cfg.edge[0])[end];
      const curve = Array.from({ length: 11 }, (_, i) => {
        const e = cfg.edge[0] + ((cfg.edge[1] - cfg.edge[0]) * i) / 10;
        return [i / 10, round((clothPath(cfg, e)[end] - rest) / TAU)];
      });
      return [name, { pivot: vertical([rollerAt(name).x, rollerAt(name).z]), curve }];
    }),
  );
  const restIris = irisAngle(STOPS[REST_STOP]);
  return {
    /** Model space from the camera frame: origin + mm / mmPerUnit. */
    space: { origin: toModel([0, 0, 0]), mmPerUnit: round(1 / scale, 6) * 1000 },
    lens: { pivot: toModel([...LENS_AXIS, 40]), slide: round((MAX_EXTENSION / 1000) * scale, 5), maxExtension: round(MAX_EXTENSION, 3) },
    rollerLever: { pivot: vertical(L.rfShaft) },
    frameMask: toModel([L.mask, L.beam.y, L.beam.z]),
    lever: vertical(L.lever),
    idler: vertical(GEARS.idler),
    spoolIdler: vertical(GEARS.spoolIdler),
    sprocket: vertical(L.sprocket),
    takeUp: vertical(L.takeUp),
    cassette: vertical(L.cassette),
    rollers,
    iris: Array.from({ length: IRIS.blades }, (_, k) => {
      const psi = 90 * DEG + (k * TAU) / IRIS.blades;
      return toModel([LENS_AXIS[0] + IRIS.pivot * Math.cos(psi), LENS_AXIS[1] + IRIS.pivot * Math.sin(psi), IRIS.z]);
    }),
    irisCurve: STOPS.map((n, s) => [s, round((irisAngle(n) - restIris) / TAU)]),
    film: { length: round(FILM_STRIP.length, 2), perTurn: { sprocket: 1, cassette: round(FILM.frame / (TAU * L.cassetteRoll), 4), takeUp: round(FILM.frame / (TAU * L.takeUpRoll), 4) } },
    gears: { idler: -L.teeth.lever / L.teeth.idler, spoolIdler: -L.teeth.lever / L.teeth.spoolIdler, spool: L.teeth.lever / L.teeth.spool, sprocket: L.teeth.lever / L.teeth.sprocket },
  };
}

// ------------------------------------------------------------------ checks

/** A BVH of some meshes (mm), with its bounds; null if there are none. */
function indexMeshes(meshes) {
  const positions = [];
  const indices = [];
  for (const mesh of meshes) {
    const base = positions.length / 3;
    positions.push(...mesh.positions);
    for (const i of mesh.indices) indices.push(i + base);
  }
  if (!indices.length) return null;
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setIndex(indices);
  geometry.computeBoundingBox();
  return { geometry, bvh: new MeshBVH(geometry), box: geometry.boundingBox };
}

/** Per piece: a BVH of all its meshes, and one of the generated ones (which are the ones checked at rest). */
function indexPieces(pieces) {
  const out = new Map();
  for (const [name, list] of pieces) {
    const all = indexMeshes(list.map((e) => e.mesh));
    if (!all) continue;
    out.set(name, { ...all, generated: indexMeshes(list.filter((e) => e.generated).map((e) => e.mesh)) });
  }
  return out;
}

/** Where two indexed meshes first cross (a point in A's frame, mm), with B moved by `matrix`; null if they don't. */
function contact(A, B, matrix = new Matrix4()) {
  let at = null;
  A.bvh.bvhcast(B.bvh, matrix, {
    intersectsTriangles(t1, t2) {
      if (!t1.intersectsTriangle(t2)) return false;
      at = [t1.a, t1.b, t1.c].reduce((m, p) => [m[0] + p.x / 3, m[1] + p.y / 3, m[2] + p.z / 3], [0, 0, 0]);
      return true;
    },
  });
  return at;
}
const where = (p) => `[${p.map((v) => v.toFixed(1)).join(', ')}]`;

const overlap = (a, b, sa = [0, 0, 0], sb = [0, 0, 0]) =>
  a.min.x + sa[0] < b.max.x + sb[0] && b.min.x + sb[0] < a.max.x + sa[0] && a.min.y + sa[1] < b.max.y + sb[1] && b.min.y + sb[1] < a.max.y + sa[1] && a.min.z + sa[2] < b.max.z + sb[2] && b.min.z + sb[2] < a.max.z + sa[2];

/** Generated meshes that cross anything in another piece, at rest. `ignore` lists pairs in contact by design ('name*' matches a prefix). */
export function checkClashes(pieces, { ignore = [] } = {}) {
  const index = indexPieces(pieces);
  const names = [...index.keys()];
  const found = [];
  const matches = (pattern, name) => (pattern.endsWith('*') ? name.startsWith(pattern.slice(0, -1)) : pattern === name);
  const allowed = (a, b) => ignore.some(([x, y]) => (matches(x, a) && matches(y, b)) || (matches(x, b) && matches(y, a)));
  for (let i = 0; i < names.length; i++) {
    for (let k = i + 1; k < names.length; k++) {
      const [a, b] = [names[i], names[k]];
      if (allowed(a, b)) continue;
      const A = index.get(a);
      const B = index.get(b);
      if (!overlap(A.box, B.box)) continue;
      const at = (A.generated && overlap(A.generated.box, B.box) && contact(A.generated, B)) || (B.generated && overlap(B.generated.box, A.box) && contact(B.generated, A));
      if (at) found.push(`${a} × ${b} near ${where(at)}`);
    }
  }
  return found;
}

/**
 * Whether the explode in the content file would pass one piece through another. Uses the
 * viewer's timing (see Exploder in src/viewer/rig.ts); pieces nested in another ride with it.
 * Pairs that touch at rest (a lid on its box) are only checked once they've moved apart.
 */
export function checkExplode(pieces, contentParts, parentOf, mmPerUnit, { samples = 160 } = {}) {
  const index = indexPieces(pieces);
  const clamp = (x) => Math.min(1, Math.max(0, x));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  const stages = [...new Set(contentParts.map((p) => p.stage ?? 0))].sort((a, b) => a - b);
  const span = stages.length === 1 ? 1 : Math.max(0.3, 1 / stages.length + 0.2);
  const byNode = new Map();
  for (const p of contentParts) {
    const i = stages.indexOf(p.stage ?? 0);
    const staged = stages.length === 1 ? 0 : (i / (stages.length - 1)) * (1 - span);
    const window = p.window ?? [staged, staged + span];
    for (const name of [p.node, ...(p.with ?? [])]) byNode.set(name, { ...p, window });
  }
  const leg = (d, distance, e) => d.map((c) => (c / Math.hypot(...d)) * distance * mmPerUnit * e);
  const own = (name, v) => {
    const p = byNode.get(name);
    if (!p) return [0, 0, 0];
    const t = clamp((v - p.window[0]) / (p.window[1] - p.window[0]));
    const split = p.then ? Math.max(0.3, p.distance / (p.distance + p.then.distance)) : 1;
    const first = leg(p.direction, p.distance, ease(clamp(t / split)));
    const second = p.then ? leg(p.then.direction, p.then.distance, ease(clamp((t - split) / (1 - split)))) : [0, 0, 0];
    return first.map((c, i) => c + second[i]);
  };
  const offsetAt = (name, v) => {
    const o = own(name, v);
    const parent = parentOf(name);
    if (!parent) return o;
    const p = offsetAt(parent, v);
    return o.map((c, i) => c + p[i]);
  };
  const names = [...index.keys()];
  const found = [];
  const m = new Matrix4();
  for (let i = 0; i < names.length; i++) {
    for (let k = i + 1; k < names.length; k++) {
      const [a, b] = [names[i], names[k]];
      const A = index.get(a);
      const B = index.get(b);
      let touching = overlap(A.box, B.box) && !!contact(A, B);
      for (let s = 1; s <= samples; s++) {
        const v = s / samples;
        const oa = offsetAt(a, v);
        const ob = offsetAt(b, v);
        if (oa.every((c, j) => Math.abs(c - ob[j]) < 1e-9)) continue;
        if (!overlap(A.box, B.box, oa, ob)) {
          touching = false;
          continue;
        }
        const hit = contact(A, B, m.makeTranslation(ob[0] - oa[0], ob[1] - oa[1], ob[2] - oa[2]));
        if (hit && !touching) {
          found.push(`${a} passes through ${b} at slider ${v.toFixed(2)}, near ${where(hit)} (${a}'s rest frame)`);
          break;
        }
        if (!hit) touching = false;
      }
    }
  }
  return found;
}
