// The body of the generated medium-format reflex camera: the cast shell with its leatherette,
// and the chassis inside it (front bayonet plate, mirror box, rear plate), the mirror, the two
// rear flaps, the focusing screen, the winding knob with the gears on the right-hand wall, the
// lens's drive shaft and the coupling that winds the magazine. See layout.mjs for the frame.
import { Geo, circle, cw } from '../watch/geometry.mjs';
import { box, plate, rect, revolve, ring, shaft, spur } from '../camera/solids.mjs';
import { Part } from '../camera/mechanism.mjs';
import { cut, fromGeo, pick, solidify, centroid } from '../camera/surgery.mjs';
import { BODY, CHASSIS, DRIVE, FLAPS, KNOB, MIRROR, SCREEN } from './layout.mjs';
import { conicalGear, flutes, helix, openHoles, roundRect, roundedBox, sdCircle, sdRect, tube } from './shapes.mjs';

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

/** A plain mesh ({positions, normals, uvs, indices}) as a Geo. */
function toGeo(mesh) {
  const g = new Geo();
  g.positions = [...mesh.positions];
  g.normals = [...mesh.normals];
  g.uvs = [...mesh.uvs];
  g.indices = [...mesh.indices];
  return g;
}

/** The gears on the mechanism plate (y, z on the right wall; teeth at module 0.65). Their centres are spaced so each pair meshes. */
export const TRAIN = (() => {
  const m = 0.65;
  const r = (teeth) => (m * teeth) / 2;
  const wind = { y: KNOB.y, z: KNOB.z, teeth: 30 };
  const cross = { y: DRIVE.y, z: 49.5, teeth: 35 };
  // An idler between the winding gear and the drive shaft's cross gear: on both pitch circles' sum.
  const idler = { teeth: 16 };
  {
    const d1 = r(wind.teeth) + r(idler.teeth);
    const d2 = r(cross.teeth) + r(idler.teeth);
    const dy = cross.y - wind.y;
    const dz = cross.z - wind.z;
    const D = Math.hypot(dy, dz);
    const a = (d1 * d1 - d2 * d2 + D * D) / (2 * D);
    const h = Math.sqrt(d1 * d1 - a * a);
    const [uy, uz] = [dy / D, dz / D];
    idler.y = wind.y + a * uy - h * uz;
    idler.z = wind.z + a * uz + h * uy;
  }
  // The flaps' spring barrel, meshing with the winding gear up and behind it.
  const aux = { teeth: 32 };
  {
    const d = r(wind.teeth) + r(aux.teeth);
    const dir = [18, -16];
    const l = Math.hypot(...dir);
    aux.y = wind.y + (dir[0] / l) * d;
    aux.z = wind.z + (dir[1] / l) * d;
  }
  // The magazine's drive, off the barrel: low enough at the back that its teeth reach through the rear plate.
  const magazine = { teeth: 20, z: 8.5 };
  {
    const d = r(aux.teeth) + r(magazine.teeth);
    magazine.y = aux.y + Math.sqrt(d * d - (magazine.z - aux.z) ** 2);
  }
  for (const g of [wind, cross, idler, aux, magazine]) g.r = r(g.teeth);
  return { module: m, wind, cross, idler, aux, magazine };
})();

/** Where the gears' faces sit across x, on the outside of the mechanism plate. */
export const GEAR_X = [-38.3, -37.3];
/** The mirror box's walls start here, in front of the rear flaps' hinges. */
const WALL_BACK = 7.5;
/** The release button's centre on the front (x, y). */
const RELEASE = [-35.4, -36.6];

/** The shell: a rounded box with its front, top, right-side and back opened, thickened inward. */
function shell() {
  const part = new Part('shell');
  // Fine enough across the faces for the round openings to cut cleanly.
  const outer = roundedBox(new Geo(), BODY.x, BODY.y, BODY.z, BODY.round, { segments: 6, flat: 2.4, uvSpan: 100 });
  let mesh = fromGeo(outer);
  const front = BODY.z[1];
  const { knob, top, back } = BODY;
  // Each opening is cut along its outline, then the triangles inside it are dropped.
  mesh = openHoles(mesh, [
    { axis: 'z', level: front, sdf: sdCircle(0, 0, BODY.front) },
    { axis: 'z', level: front, sdf: sdCircle(RELEASE[0], RELEASE[1], 3.75) },
    { axis: 'x', level: BODY.x[0], sdf: sdCircle(knob.y, knob.z, knob.r) },
    { axis: 'y', level: BODY.y[1], sdf: sdRect(0, (top.z[0] + top.z[1]) / 2, top.x, (top.z[1] - top.z[0]) / 2) },
    { axis: 'z', level: BODY.z[0], sdf: sdRect(0, (back.y[0] + back.y[1]) / 2, back.x, (back.y[1] - back.y[0]) / 2) },
  ]);
  part.geo('chrome').append(toGeo(mesh));
  part.geo('blackInside').append(solidify(mesh, BODY.wall, { maxOffset: BODY.wall * 2 }));

  // Leatherette on the sides and across the front above the lens, a little proud of the metal.
  const L = 0.45;
  const sideOutline = roundRect(38, -0.5, 58, 79, 2.5);
  plate(part.geo('leather'), 'x', { outer: sideOutline.map(([z, y]) => [z, y]), holes: [cw(ring(KNOB.r + 1.2, knob.z, knob.y))] }, BODY.x[0] - L, BODY.x[0] + 0.05, { chamfer: 0.2 });
  plate(part.geo('leather'), 'x', { outer: sideOutline.map(([z, y]) => [z, y]) }, BODY.x[1] - 0.05, BODY.x[1] + L, { chamfer: 0.2 });
  plate(part.geo('leather'), 'z', { outer: roundRect(0, 39.9, 58, 4.4, 1.2) }, front - 0.05, front + L, { chamfer: 0.15 });
  // A blank name plate on it.
  plate(part.geo('chrome'), 'z', { outer: roundRect(0, 39.9, 26, 2.6, 0.6) }, front + L, front + L + 0.35, { chamfer: 0.1 });

  // The base: the quick-coupling plate and the tripod socket's boss.
  const base = BODY.y[0];
  plate(part.geo('chrome'), 'y', { outer: roundRect(0, 38, 50, 46, 3), holes: [cw(ring(5.2, 0, 38))] }, base - 1.4, base + 0.05, { chamfer: 0.4 });
  revolve(part.geo('blackInside'), 'y', [0, 0, 38], [[0, base - 1.0], [4.4, base - 1.0], [4.4, base + 2.3], [0, base + 2.3]], { segments: 32 });
  // Strap lugs on both sides, near the top front, and the accessory rail on the left.
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? BODY.x[0] - L : BODY.x[1] + L;
    shaft(part.geo('chrome'), 'x', [0, 31, 61.5], [[2.4, x0], [2.4, x0 + side * 1.6], [3.2, x0 + side * 2.2], [3.2, x0 + side * 3.2]].map(([r, x]) => [r, x]), { segments: 24 });
  }
  box(part.geo('chrome'), [BODY.x[1] + L, BODY.x[1] + L + 1.6], [14, 22], [50, 66], { axis: 'x', chamfer: 0.3 });
  return part;
}

/** The front bayonet plate, with the bayonet ring the lens locks into, the drive shaft's bearing and the lens catch. */
function frontPlate() {
  const part = new Part('front_plate');
  const { front, bayonet } = CHASSIS;
  plate(part.geo('chrome'), 'z', { outer: roundRect(0, 0, front.half * 2, front.half * 2, 3), holes: [cw(ring(bayonet.throat, 0, 0, 96)), cw(ring(1.5, RELEASE[0], RELEASE[1]))] }, front.z[0], front.z[1], { chamfer: 0.3 });
  // The ring: a stepped face with the bayonet's lugs inside its throat.
  revolve(
    part.geo('chrome'),
    'z',
    [0, 0, 0],
    [
      [bayonet.throat, front.z[1]],
      [bayonet.outer, front.z[1]],
      [bayonet.outer, bayonet.face - 0.6],
      [bayonet.outer - 0.6, bayonet.face],
      [bayonet.throat + 1.6, bayonet.face],
      [bayonet.throat + 1.6, bayonet.face - 1.1],
      [bayonet.throat, bayonet.face - 1.1],
      [bayonet.throat, front.z[1]],
    ],
    { segments: 120 },
  );
  // Four lugs the lens's lugs turn in behind.
  for (let k = 0; k < 4; k++) {
    const a0 = (k * 90 + 22) * DEG;
    const a1 = (k * 90 + 58) * DEG;
    const outline = [];
    for (let i = 0; i <= 8; i++) outline.push([(bayonet.throat + 0.05) * Math.cos(a0 + ((a1 - a0) * i) / 8), (bayonet.throat + 0.05) * Math.sin(a0 + ((a1 - a0) * i) / 8)]);
    for (let i = 8; i >= 0; i--) outline.push([(bayonet.throat - 1.3) * Math.cos(a0 + ((a1 - a0) * i) / 8), (bayonet.throat - 1.3) * Math.sin(a0 + ((a1 - a0) * i) / 8)]);
    plate(part.geo('chrome'), 'z', { outer: outline }, bayonet.face - 2.4, bayonet.face - 1.3, { chamfer: 0.15 });
  }
  // The red index for lining the lens up, at the top of the ring's face.
  plate(part.geo('red'), 'z', { outer: ring(0.75, 0, bayonet.outer - 2.2) }, bayonet.face - 0.05, bayonet.face + 0.04);
  // Inside the throat: flocked black, so no light bounces off it.
  revolve(part.geo('flock'), 'z', [0, 0, 0], [[bayonet.throat - 0.02, bayonet.face - 2.4], [bayonet.throat - 0.02, front.z[0] - 0.4]], { segments: 96 });
  return part;
}

/** The drive shaft: its key at the bottom of the throat turns the lens's shutter-cocking shaft; a coil spring round it powers the release. */
function driveShaft() {
  const part = new Part('drive_shaft', { parent: 'front_plate' });
  const at = [DRIVE.x, DRIVE.y, 0];
  shaft(part.geo('steel'), 'z', at, [[1.25, DRIVE.z[0]], [1.25, DRIVE.z[1] - 1.2]], { segments: 18 });
  // The key: a disc with a slot across it, which the lens's coupling drops into.
  const key = [[0, DRIVE.z[1] - 1.2], [3.3, DRIVE.z[1] - 1.2], [3.3, DRIVE.z[1]], [0, DRIVE.z[1]]];
  revolve(part.geo('steel'), 'z', at, key, { segments: 32 });
  box(part.geo('black'), [DRIVE.x - 3.35, DRIVE.x + 3.35], [DRIVE.y - 0.45, DRIVE.y + 0.45], [DRIVE.z[1] - 0.5, DRIVE.z[1] + 0.02], { axis: 'z' });
  // The drive spring, wound round the shaft between two collars.
  for (const z of [55.6, 66.4]) revolve(part.geo('steel'), 'z', at, [[0, z - 0.6], [3.9, z - 0.6], [3.9, z + 0.6], [0, z + 0.6]], { segments: 28 });
  tube(part.geo('spring'), helix('z', at, 3.2, 56.4, 65.6, 9), 0.42, { segments: 8 });
  // A bevel gear at the back, meshing with the cross shaft's.
  conicalGear(part.geo('brass'), 'z', at, { teeth: 16, module: 0.65 }, 52.6, 55.4, 0.55, 1.0, 1.3);
  return part;
}

/** The cross shaft from the right-hand wall to the drive shaft's bevel gear. */
function crossShaft() {
  const part = new Part('cross_shaft', { parent: 'mechanism_plate' });
  const { cross } = TRAIN;
  const at = [0, cross.y, cross.z];
  shaft(part.geo('steel'), 'x', at, [[1.1, -39], [1.1, -3.4]], { segments: 18 });
  conicalGear(part.geo('brass'), 'x', at, { teeth: 16, module: 0.65, phase: Math.PI / 16 }, -2.6, -5.4, 0.55, 1.0, 1.1);
  spur(part.geo('brass'), 'x', at, { teeth: cross.teeth, module: TRAIN.module, phase: 0, hub: 2.6, bore: 1.1 }, GEAR_X[0], GEAR_X[1]);
  return part;
}

/** The chassis: the mirror box's walls and floor, black inside, and the screen's frame on top. */
function chassis() {
  const part = new Part('chassis');
  const { walls, front, rear } = CHASSIS;
  const z0 = WALL_BACK;
  const z1 = front.z[0];
  for (const side of [-1, 1]) {
    const x0 = side * walls.x;
    const x1 = side * (walls.x + walls.thick);
    // The right wall has holes for the shafts through it.
    const holes = side < 0 ? [cw(ring(1.6, TRAIN.cross.z, TRAIN.cross.y))] : [];
    plate(part.geo('flock'), 'x', { outer: rect([z0, z1], [walls.floor, SCREEN.y - 1.6]), holes }, Math.min(x0, x1), Math.max(x0, x1));
  }
  box(part.geo('flock'), [-walls.x - walls.thick, walls.x + walls.thick], [walls.floor - walls.thick, walls.floor], [z0, z1], { axis: 'y' });
  // The screen's frame: a black rim the screen rests on, with its front and back lips.
  const frame = { x: 33.2, z: [10.6, 70.3], y: [SCREEN.y - 1.6, SCREEN.y] };
  const inner = { x: SCREEN.half - 1.0, z: [SCREEN.z[0] + 1.0, SCREEN.z[1] - 1.0] };
  plate(part.geo('black'), 'y', { outer: rect([-frame.x, frame.x], [frame.z[0], frame.z[1]]).map(([x, z]) => [x, z]), holes: [cw(rect([-inner.x, inner.x], inner.z))] }, frame.y[0], frame.y[1], { chamfer: 0.2 });
  // Light seals: foam strips round the screen.
  for (const [xs, zs] of [[[-SCREEN.half - 1.4, SCREEN.half + 1.4], [SCREEN.z[0] - 1.4, SCREEN.z[0] - 0.2]], [[-SCREEN.half - 1.4, SCREEN.half + 1.4], [SCREEN.z[1] + 0.2, SCREEN.z[1] + 1.4]]]) {
    box(part.geo('foam'), xs, [SCREEN.y, SCREEN.y + 1.2], zs, { axis: 'y' });
  }
  // The mirror's hinge brackets on the side walls.
  for (const side of [-1, 1]) box(part.geo('black'), [side * (walls.x - 1.6), side * walls.x].sort((a, b) => a - b), [MIRROR.hinge[1] - 3, MIRROR.hinge[1] + 3], [WALL_BACK, MIRROR.hinge[0] + 3], { axis: 'x' });
  return part;
}

/** The rear plate: the frame the magazine hangs on, with the picture's window and the hooks at the bottom. */
function rearPlate() {
  const part = new Part('rear_plate');
  const { rear } = CHASSIS;
  const w = rear.window;
  const { back } = BODY;
  const g = TRAIN.magazine;
  const gearSlot = cw(rect([GEAR_X[0] - 0.5, GEAR_X[1] + 0.5], [g.y - g.r - 1.6, g.y + g.r + 1.6]));
  plate(part.geo('chrome'), 'z', { outer: rect([-back.x + 0.15, back.x - 0.15], [back.y[0] + 0.15, back.y[1] - 0.15]), holes: [cw(rect([-w, w], [-w, w])), gearSlot] }, rear.z[0], rear.z[1], { chamfer: 0.2 });
  // The window's edges are black, and so is the plate round them inside.
  plate(part.geo('flock'), 'z', { outer: rect([-w - 3, w + 3], [-w - 3, w + 3]), holes: [cw(rect([-w, w], [-w, w]))] }, rear.z[1], rear.z[1] + 0.05);
  // Hooks at the bottom for the magazine's lower edge, and the catch at the top.
  for (const x of [-30, 30]) {
    plate(part.geo('chrome'), 'x', { outer: [[rear.z[0], -38.6], [rear.z[0], -40.2], [rear.z[0] - 1.15, -40.2], [rear.z[0] - 1.15, -38.0], [rear.z[0] - 0.7, -38.0], [rear.z[0] - 0.7, -38.6]] }, x - 3, x + 3, { chamfer: 0.12 });
  }
  box(part.geo('chrome'), [-7, 7], [back.y[1] - 2.4, back.y[1] - 0.4], [rear.z[0] - 0.7, rear.z[0]], { axis: 'z', round: 0.6 });
  // Brackets the flaps' hinge rods turn in.
  for (const x of [-31.5, 31.5]) {
    for (const [y, z] of [[FLAPS.hinge, FLAPS.z + 0.25], [-FLAPS.hinge, FLAPS.z - 0.25]]) {
      box(part.geo('black'), [x - 1.2, x + 1.2], [y - 1.6, y + 1.6], [rear.z[1], z + 1.1], { axis: 'z' });
    }
  }
  return part;
}

/** A rear flap: a thin black blade on a rod along its hinged edge, with a crank on the rod's right end. */
function flap(name, sign) {
  const part = new Part(name, { parent: 'rear_plate' });
  const hingeY = sign * FLAPS.hinge;
  const z = FLAPS.z + sign * 0.25;
  // The upper flap reaches down past the middle, over the lower one's edge.
  const edge = sign > 0 ? -0.6 : 0.6;
  plate(part.geo('flap'), 'z', { outer: roundRect(0, (hingeY + edge) / 2, FLAPS.half * 2, Math.abs(hingeY - edge), 0.4) }, z - FLAPS.thick / 2, z + FLAPS.thick / 2);
  shaft(part.geo('steel'), 'x', [0, hingeY, z], [[0.7, -32.4], [0.7, 32.4]], { segments: 12 });
  // Knuckles where the blade wraps the rod.
  for (const x0 of [-28, -6, 16]) shaft(part.geo('flap'), 'x', [0, hingeY, z], [[1.05, x0], [1.05, x0 + 10]], { segments: 14 });
  return part;
}

/** The mirror on its frame, hinged at its top back edge; the pin on its right side is where the actuating lever takes hold. */
function mirror() {
  const part = new Part('mirror', { parent: 'chassis' });
  const [hz, hy] = MIRROR.hinge;
  // Built flat (along +z from the hinge, mirror face up), then laid at 45° about the hinge.
  const flat = new Part('mirror_flat');
  const L = MIRROR.length;
  const H = MIRROR.half;
  box(flat.geo('black'), [-H - 0.6, H + 0.6], [hy - 2.2, hy - MIRROR.glass], [hz + 1.4, hz + L], { axis: 'y', chamfer: 0.2 });
  box(flat.geo('mirror'), [-H, H], [hy - MIRROR.glass, hy], [hz + 1.4, hz + L - 0.4], { axis: 'y' });
  // The hinge's pins and the drive pin.
  for (const side of [-1, 1]) shaft(flat.geo('steel'), 'x', [0, hy, hz], [[0.8, side * (H + 0.4)], [0.8, side * (H + 2.8)]], { segments: 12 });
  shaft(flat.geo('steel'), 'x', [0, hy - 1.8, hz + 13], [[0.9, -H - 0.6], [0.9, -H - 2.4]], { segments: 12 });
  // Felt pads under it, where it rests against the screen frame when up.
  for (const [x, z] of [[-24, hz + L - 6], [24, hz + L - 6], [0, hz + 8]]) revolve(flat.geo('foam'), 'y', [x, 0, z], [[0, hy - 3.2], [1.6, hy - 3.2], [1.6, hy - 2.2], [0, hy - 2.2]], { segments: 14 });
  // Lay it down at 45°: rotate about x through the hinge so +z goes down and forward.
  const c = Math.cos(45 * DEG);
  const s = Math.sin(45 * DEG);
  const turn = (p, n) => {
    const y = p[1] - hy;
    const z = p[2] - hz;
    return [
      [p[0], hy + y * c - z * s, hz + y * s + z * c],
      [n[0], n[1] * c - n[2] * s, n[1] * s + n[2] * c],
    ];
  };
  for (const [key, geo] of flat.geos) part.geo(key).append(geo, turn);
  return part;
}

/** The focusing screen: ground glass, its matte face as far from the mirror as the film is. */
function screen() {
  const part = new Part('screen', { parent: 'chassis' });
  const geo = new Geo();
  box(geo, [-SCREEN.half, SCREEN.half], [SCREEN.y, SCREEN.y + SCREEN.thick], SCREEN.z, { axis: 'y', chamfer: 0.15 });
  // The markings face up: uv across x and along z on the top face.
  for (let i = 0; i < geo.vertexCount; i++) {
    const [x, , z] = geo.positions.slice(i * 3, i * 3 + 3);
    geo.uvs[i * 2] = (x + SCREEN.half) / (SCREEN.half * 2);
    geo.uvs[i * 2 + 1] = 1 - (z - SCREEN.z[0]) / (SCREEN.z[1] - SCREEN.z[0]);
  }
  part.geo('screen').append(geo);
  return part;
}

/** The winding knob: a big knurled chrome knob with a fold-out crank, on the shaft into the gear housing. */
function knob() {
  const part = new Part('knob');
  const at = [0, KNOB.y, KNOB.z];
  const [xIn, xOut] = [KNOB.x[1], KNOB.x[0]];
  // The coupling into the side.
  shaft(part.geo('chrome'), 'x', at, [[7.6, -40.6], [7.6, xIn + 0.2]], { segments: 40 });
  // The knurled rim and the face.
  const rimX = [xIn - 0.6, xIn - 9.2];
  plate(part.geo('chrome'), 'x', { outer: flutes(KNOB.r, 0.55, 72, { a: KNOB.z, b: KNOB.y }) }, rimX[1], rimX[0], { chamfer: 0.5, chamferBottom: 0.5 });
  revolve(part.geo('chrome'), 'x', at, [[0, rimX[0]], [KNOB.r - 2.4, rimX[0]], [KNOB.r - 2.4, xIn], [0, xIn]], { segments: 72 });
  revolve(part.geo('chrome'), 'x', at, [[0, rimX[1] - 1.0], [KNOB.r - 2.2, rimX[1] - 1.0], [KNOB.r - 1.2, rimX[1]], [0, rimX[1]]], { segments: 72 });
  plate(part.geo('leather'), 'x', { outer: ring(KNOB.r - 4.5, KNOB.z, KNOB.y, 72) }, rimX[1] - 1.45, rimX[1] - 0.95);
  // The crank, folded into the face: an arm from the hub with a little handle at its end.
  revolve(part.geo('chrome'), 'x', at, [[0, rimX[1] - 4.2], [3.2, rimX[1] - 4.2], [4.2, rimX[1] - 3.6], [4.2, rimX[1] - 1.0], [0, rimX[1] - 1.0]], { segments: 40 });
  const arm = roundRect(KNOB.z, KNOB.y - 9, 6.2, 19, 3.1).map(([z, y]) => [z, y]);
  plate(part.geo('chrome'), 'x', { outer: arm }, rimX[1] - 3.4, rimX[1] - 1.5, { chamfer: 0.4 });
  shaft(part.geo('black'), 'x', [0, KNOB.y - 16.2, KNOB.z], [[2.3, rimX[1] - 3.4], [2.6, rimX[1] - 5.4], [2.2, rimX[1] - 7.6], [0.01, rimX[1] - 7.8]].map(([r, x]) => [r, x]), { segments: 24 });
  return part;
}

/** The gears on the mechanism plate, each its own part so it can turn. */
function trainParts() {
  const parts = [];
  const { idler, aux, magazine } = TRAIN;
  const plateP = new Part('mechanism_plate', { parent: 'chassis' });
  const [x0, x1] = CHASSIS.mechanism.x;
  const holes = [idler, aux, TRAIN.wind, TRAIN.cross].map((g) => cw(ring(g === TRAIN.wind ? 3.6 : 1.4, g.z, g.y)));
  plate(plateP.geo('brassPlate'), 'x', { outer: roundRect(35.6, 0, 60.4, 70, 4), holes }, x0, x1, { chamfer: 0.2 });
  // Pillars holding it off the wall, and the posts the gears turn on.
  for (const [y, z] of [[-31, 10], [31, 13], [-31, 61], [31, 61]]) shaft(plateP.geo('steel'), 'x', [0, y, z], [[1.2, CHASSIS.walls.x * -1 - CHASSIS.walls.thick], [1.2, x0]], { segments: 12 });
  parts.push(plateP);

  const gearPart = (name, g, extra) => {
    const part = new Part(name, { parent: 'mechanism_plate' });
    spur(part.geo('brass'), 'x', [0, g.y, g.z], { teeth: g.teeth, module: TRAIN.module, hub: 1.8, bore: 0.9 }, GEAR_X[0], GEAR_X[1]);
    shaft(part.geo('steel'), 'x', [0, g.y, g.z], [[0.9, x0 - 0.05], [0.9, GEAR_X[0] - 0.9]], { segments: 12 });
    extra?.(part);
    parts.push(part);
  };
  // The winding gear, behind the knob: the ratchet in its housing lets it turn back as the camera fires, the knob staying put.
  {
    const part = new Part('wind_gear', { parent: 'mechanism_plate' });
    const at = [0, TRAIN.wind.y, TRAIN.wind.z];
    spur(part.geo('brass'), 'x', at, { teeth: TRAIN.wind.teeth, module: TRAIN.module, hub: 3.4, bore: 1.4 }, GEAR_X[0], GEAR_X[1]);
    revolve(part.geo('steel'), 'x', at, [[0, -40.3], [8.6, -40.3], [8.6, GEAR_X[0] - 0.2], [0, GEAR_X[0] - 0.2]], { segments: 40 });
    shaft(part.geo('steel'), 'x', at, [[1.4, x0 - 0.05], [1.4, GEAR_X[0]]], { segments: 14 });
    parts.push(part);
  }
  gearPart('idler_gear', idler);
  // The flaps' barrel: a drum with a coiled spring inside, behind its gear.
  gearPart('flap_barrel', aux, (part) => {
    revolve(part.geo('steel'), 'x', [0, aux.y, aux.z], [[0, GEAR_X[0] - 0.6], [aux.r - 2.6, GEAR_X[0] - 0.6], [aux.r - 2.6, GEAR_X[0] - 1.9], [aux.r - 1.8, GEAR_X[0] - 1.9], [aux.r - 1.8, GEAR_X[0] - 0.05], [0, GEAR_X[0] - 0.05]], { segments: 48 });
  });
  // Its teeth reach back through the rear plate, into the magazine's gear.
  gearPart('magazine_gear', magazine);
  return parts;
}

/** The coupling at the back that winds the magazine: a slotted key on a shaft from the gears. */
function magazineDrive() {
  const part = new Part('magazine_drive', { parent: 'rear_plate' });
  const { magazine } = TRAIN;
  // The shaft runs back along z beside the window, from a bevel meshing with the magazine gear's.
  const at = [-31.6, magazine.y, 0];
  shaft(part.geo('steel'), 'z', at, [[1.0, CHASSIS.rear.z[0] - 0.4], [1.0, magazine.z - 1.4]], { segments: 14 });
  conicalGear(part.geo('brass'), 'z', at, { teeth: 14, module: 0.6, phase: Math.PI / 14 }, magazine.z - 3.4, magazine.z - 1.2, 0.6, 1.0, 1.0);
  revolve(part.geo('steel'), 'z', at, [[0, CHASSIS.rear.z[0] - 0.4], [2.6, CHASSIS.rear.z[0] - 0.4], [2.6, CHASSIS.rear.z[0] + 0.9], [0, CHASSIS.rear.z[0] + 0.9]], { segments: 24 });
  box(part.geo('black'), [at[0] - 2.65, at[0] + 2.65], [at[1] - 0.35, at[1] + 0.35], [CHASSIS.rear.z[0] - 0.45, CHASSIS.rear.z[0] - 0.1], { axis: 'z' });
  return part;
}

/** The release button on the front, at the bottom on the photographer's right, and the rod it pushes. */
function releaseButton() {
  const part = new Part('release_button', { parent: 'shell' });
  const at = [...RELEASE, 0];
  const front = BODY.z[1];
  shaft(part.geo('chrome'), 'z', at, [[3.5, front - 0.4], [3.5, front + 2.6], [3.0, front + 3.6], [2.0, front + 3.9]], { segments: 32 });
  plate(part.geo('black'), 'z', { outer: ring(1.2, at[0], at[1]) }, front + 3.85, front + 3.95);
  shaft(part.geo('steel'), 'z', at, [[1.0, CHASSIS.front.z[0] - 8], [1.0, front - 0.4]], { segments: 12 });
  return part;
}

/** The lens release catch, on the front at the top right. */
function lensCatch(part) {
  const at = [-34.4, 33.6, 0];
  shaft(part.geo('chrome'), 'z', at, [[2.6, BODY.z[1] - 0.3], [2.6, BODY.z[1] + 1.4], [2.1, BODY.z[1] + 1.9]], { segments: 28 });
}

export function buildBody() {
  const shellPart = shell();
  lensCatch(shellPart);
  return [
    shellPart,
    frontPlate(),
    driveShaft(),
    crossShaft(),
    chassis(),
    rearPlate(),
    flap('flap_upper', 1),
    flap('flap_lower', -1),
    mirror(),
    screen(),
    knob(),
    ...trainParts(),
    releaseButton(),
  ];
}
