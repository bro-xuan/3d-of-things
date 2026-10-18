// The drivetrain of a car with an engine, laid out the classic way: an inline four at the front (block, head,
// crankshaft, pistons on their rods, an overhead camshaft opening the valves, the toothed belt between them),
// the flywheel and clutch, a four-speed gearbox (input shaft, layshaft, the main shaft's gears), the propshaft,
// and a live rear axle with the differential in it (pinion, crown wheel, the carrier's spider gears, the half
// shafts) on leaf springs; with the radiator and fan, the intake, the exhaust, the fuel tank and the battery.
// Millimetres in the car frame (z forward, x left, y up). Returns the parts and where the moving ones turn.
import { Geo, contours, sd } from '../watch/geometry.mjs';
import { box, plate, rect, ring, shaft, spur } from '../camera/solids.mjs';
import { Part } from '../camera/mechanism.mjs';
import { conicalGear, roundedBox, tube } from '../hasselblad/shapes.mjs';
import { corners } from './platform.mjs';

/** Firing order 1-3-4-2: where in the four-stroke cycle (crank degrees) each cylinder fires. */
export const FIRING = [0, 540, 180, 360];
/** Gear ratios (input turns per output turn) and teeth, layshaft side first: constant mesh, then 3rd, 2nd, 1st. */
export const GEARS = { mesh: [30, 20], third: [26, 24], second: [21, 29], first: [15, 35], module: 3, final: [10, 39] };
export const ratio = (lay, main) => (GEARS.mesh[0] / GEARS.mesh[1]) * (main / lay);
/** A valve's lift (mm), and how far open it is with its cam's nose `nose` degrees round from it (as the viewer has it). */
export const LIFT = 9;
export const DURATION = 120;
export function openness(nose) {
  const a = (((nose % 360) + 540) % 360) - 180;
  return Math.abs(a) < DURATION / 2 ? 0.5 + 0.5 * Math.cos((Math.PI * a) / (DURATION / 2)) : 0;
}

/** A flat outline from a signed-distance function, extruded across z from z0 to z1 (a crank web, a fan). */
function web(geo, f, [min, max], z0, z1, cell = 1.5) {
  plate(geo, 'z', contours(f, { min, max }, cell, cell * 1.6), z0, z1);
}

export function buildPowertrain(spec) {
  const E = spec.engine;
  const r = E.stroke / 2;
  const L = E.rod;
  const yc = E.yc;
  const zFront = E.front;
  const zc = [0, 1, 2, 3].map((k) => zFront - 70 - k * E.spacing);
  const zRear = zc[3] - 70;
  const phases = [0, Math.PI, Math.PI, 0];
  const deck = yc + r + L + 30;
  const pinY = (phi) => yc + r * Math.cos(phi) + Math.sqrt(L * L - (r * Math.sin(phi)) ** 2);
  const headTop = deck + 112;
  const yt = deck + 120;
  const yCam = yt + 18.5;
  const parts = [];
  const hints = { crank: [0, yc, zFront], cam: [0, yCam, zFront], r, L, pistons: [], valves: [] };

  // The block: walls, the deck with its four bores and their liners, and the bulkheads the crank runs in.
  const block = new Part('engine_block');
  const bg = block.geo('casting');
  for (const s of [-1, 1]) box(bg, s > 0 ? [88, 100] : [-100, -88], [yc - 30, deck], [zRear, zFront], { axis: 'x' });
  for (const [z0, z1] of [[zFront - 12, zFront], [zRear, zRear + 12]]) plate(bg, 'z', { outer: rect([-88, 88], [yc - 30, deck]), holes: [ring(31, 0, yc)] }, z0, z1);
  plate(bg, 'y', { outer: rect([-100, 100], [zRear, zFront]), holes: zc.map((z) => ring(E.bore / 2, 0, z)) }, deck - 14, deck);
  for (const z of zc) shaft(bg, 'y', [0, 0, z], [[E.bore / 2 + 6, yc + 70], [E.bore / 2 + 6, deck - 14]], { bore: E.bore / 2, segments: 40 });
  for (let k = 0; k < 3; k++) {
    const zb = (zc[k] + zc[k + 1]) / 2;
    plate(bg, 'z', { outer: rect([-88, 88], [yc - 30, yc + 70]), holes: [ring(31, 0, yc)] }, zb - 8, zb + 8);
  }
  parts.push(block);

  // The sump: an open tray of oil under the block.
  const sump = new Part('sump');
  const sg = sump.geo('casting');
  const [sz0, sz1] = [zRear + 10, zFront - 10];
  box(sg, [-95, 95], [yc - 140, yc - 132], [sz0, sz1]);
  for (const s of [-1, 1]) box(sg, s > 0 ? [89, 95] : [-95, -89], [yc - 132, yc - 30], [sz0, sz1], { axis: 'x' });
  for (const [z0, z1] of [[sz0, sz0 + 6], [sz1 - 6, sz1]]) box(sg, [-89, 89], [yc - 132, yc - 30], [z0, z1], { axis: 'z' });
  parts.push(sump);

  // The crankshaft: main journals between the throws, a crankpin and two webs (with counterweights) at each
  // cylinder, the timing pulley at the front, and the flywheel with its starter ring at the back.
  const crank = new Part('crankshaft');
  const cg = crank.geo('steel');
  zc.forEach((z, k) => {
    const phi = phases[k];
    const pin = [-r * Math.sin(phi), yc + r * Math.cos(phi)];
    shaft(cg, 'z', [pin[0], pin[1], 0], [[22, z - 13], [22, z + 13]], { segments: 28 });
    const u = [-Math.sin(phi), Math.cos(phi)];
    // Counterweights opposite the pin, small enough to clear the pistons' skirts at the bottom of the stroke.
    const counter = sd.intersect(sd.circle([0, yc], 58), ([x, y]) => x * u[0] + (y - yc) * u[1] + 6);
    const f = sd.union(sd.capsule([0, yc], pin, 34, 28), counter);
    for (const [z0, z1] of [[z - 25, z - 13], [z + 13, z + 25]]) web(cg, f, [[-80, yc - 80], [80, yc + 80]], z0, z1);
    hints.pistons.push({ node: `piston_${k + 1}`, rod: `rod_${k + 1}`, pin: [0, pinY(phi), z], phase: (phi * 180) / Math.PI });
  });
  // Main shaft between the throws, and out through the block's ends.
  for (let k = 0; k < 3; k++) shaft(cg, 'z', [0, yc, 0], [[28, zc[k + 1] + 25], [28, zc[k] - 25]], { segments: 32 });
  shaft(cg, 'z', [0, yc, 0], [[28, zc[0] + 25], [28, zFront + 4], [20, zFront + 4], [20, zFront + 84]], { segments: 32 });
  shaft(cg, 'z', [0, yc, 0], [[45, zRear - 14], [45, zRear - 4], [28, zRear - 4], [28, zc[3] - 25]], { segments: 32 });
  spur(cg, 'z', [0, yc, 0], { teeth: 20, module: 2.6, phase: Math.PI / 2 }, zFront + 16, zFront + 36);
  shaft(crank.geo('casting'), 'z', [0, yc, 0], [[132, zRear - 42], [132, zRear - 14]], { bore: 20, segments: 64 });
  spur(cg, 'z', [0, yc, 0], { teeth: 110, module: 2.5 }, zRear - 40, zRear - 28);
  parts.push(crank);

  // Pistons, each with its gudgeon pin, and the rods from the pins down round the crankpins.
  zc.forEach((z, k) => {
    const phi = phases[k];
    const py = pinY(phi);
    const piston = new Part(`piston_${k + 1}`);
    shaft(piston.geo('casting'), 'y', [0, 0, z], [[E.bore / 2 - 0.5, py - 32], [E.bore / 2 - 0.5, py + 10], [E.bore / 2 - 1.5, py + 12], [E.bore / 2 - 1.5, py + 18]], { segments: 40 });
    for (const y of [py + 2, py + 7]) shaft(piston.geo('steel'), 'y', [0, 0, z], [[E.bore / 2 - 0.2, y], [E.bore / 2 - 0.2, y + 2]], { segments: 40 });
    shaft(piston.geo('steel'), 'x', [0, py, z], [[11, -36], [11, 36]], { segments: 20 });
    parts.push(piston);
    const rod = new Part(`rod_${k + 1}`);
    const pin = [-r * Math.sin(phi), yc + r * Math.cos(phi)];
    const f = sd.subtract(sd.capsule(pin, [0, py], 30, 16), sd.circle(pin, 22.5), sd.circle([0, py], 11.5));
    web(rod.geo('steel'), f, [[-80, yc - 80], [80, py + 30]], z - 11, z + 11, 1.2);
    parts.push(rod);
  });

  // The head, with a spark plug for each cylinder; the valves in it, two to a cylinder under the camshaft.
  const head = new Part('cylinder_head');
  roundedBox(head.geo('casting'), [-95, 95], [deck, headTop], [zRear, zFront], 8, { segments: 2 });
  zc.forEach((z) => {
    shaft(head.geo('steel'), 'y', [-70, 0, z], [[7, deck + 30], [7, headTop + 4], [10, headTop + 4], [10, headTop + 16]], { segments: 16 });
    shaft(head.geo('ceramic'), 'y', [-70, 0, z], [[6, headTop + 16], [6, headTop + 56], [3, headTop + 56], [3, headTop + 66]], { segments: 16 });
  });
  parts.push(head);
  // Each cylinder's intake valve is fully open a quarter of the camshaft's turn after its exhaust valve.
  zc.forEach((z, k) => {
    for (const [kind, x, dz, R, centre] of [['in', 12, 20, 17, 225], ['ex', -12, -20, 15, 135]]) {
      const name = `valve_${kind}_${k + 1}`;
      const valve = new Part(name, { parent: 'cylinder_head' });
      const zv = z + dz;
      const open = (centre + FIRING[k] / 2) % 360;
      // Where the cam holds it with the camshaft at rest (some are always partway open).
      const down = LIFT * openness(-open);
      shaft(valve.geo('steel'), 'y', [x, 0, zv], [[R, deck + 5], [R, deck + 8], [3.5, deck + 15], [3.5, yt - 18]].map(([a, b]) => [a, b - down]), { segments: 24 });
      shaft(valve.geo('casting'), 'y', [x, 0, zv], [[14, yt - 18 - down], [14, yt - down]], { segments: 24 });
      parts.push(valve);
      hints.valves.push({ node: name, at: [x, yt, zv], phase: -open, z: zv });
    }
  });

  // The camshaft: a lobe over each valve, its nose round so the valve opens as the cycle says; the toothed
  // pulley twice the crank's, so it turns once for every two turns of the crank.
  const cam = new Part('camshaft');
  const kg = cam.geo('steel');
  shaft(kg, 'z', [0, yCam, 0], [[14, zRear + 15], [14, zFront + 40]], { segments: 24 });
  for (const v of hints.valves) {
    const psi = (v.phase * Math.PI) / 180;
    const u = [Math.sin(psi), -Math.cos(psi)];
    web(kg, sd.capsule([0, yCam], [17 * u[0], yCam + 17 * u[1]], 18, 10), [[-40, yCam - 40], [40, yCam + 40]], v.z - 8, v.z + 8, 1);
  }
  spur(kg, 'z', [0, yCam, 0], { teeth: 40, module: 2.6, phase: Math.PI / 2 }, zFront + 16, zFront + 36);
  parts.push(cam);

  // The cover over the camshaft (a shell, open underneath), and the toothed belt round the two pulleys.
  const cover = new Part('cam_cover');
  roundedBox(cover.geo('cover'), [-55, 55], [headTop, headTop + 75], [zRear + 12, zFront - 12], 18, { segments: 4, faces: ['+x', '-x', '+y', '+z', '-z'] });
  parts.push(cover);
  const belt = new Part('timing_belt');
  const beltShape = sd.subtract(sd.capsule([0, yc], [0, yCam], 34.5, 60.5), sd.capsule([0, yc], [0, yCam], 29.5, 55.5));
  web(belt.geo('rubber'), beltShape, [[-70, yc - 40], [70, yCam + 70]], zFront + 18, zFront + 34, 1.2);
  parts.push(belt);

  // The fan on the crank's nose, and the radiator in front of it with its hoses to the engine.
  const fan = new Part('fan');
  const blades = sd.union(...[1, 3, 5, 7].map((k) => sd.capsule([0, yc], [170 * Math.cos((k * Math.PI) / 4), yc + 170 * Math.sin((k * Math.PI) / 4)], 26, 18)), sd.circle([0, yc], 42));
  web(fan.geo('trim'), blades, [[-200, yc - 200], [200, yc + 200]], zFront + 94, zFront + 102, 3);
  shaft(fan.geo('steel'), 'z', [0, yc, 0], [[30, zFront + 84], [30, zFront + 108]], { segments: 24 });
  parts.push(fan);
  hints.fan = [0, yc, zFront + 100];
  const rad = new Part('radiator');
  const zr0 = zFront + 208;
  roundedBox(rad.geo('radiator'), [-320, 320], [330, 700], [zr0, zr0 + 30], 6, { segments: 2 });
  for (const [y0, y1] of [[300, 330], [700, 736]]) roundedBox(rad.geo('trim'), [-332, 332], [y0, y1], [zr0 - 4, zr0 + 34], 10, { segments: 2 });
  // The hoses meet the engine square on, outside the timing belt.
  // The hoses stay with the engine when the radiator comes away, clear of the fan's sweep.
  tube(block.geo('rubber'), [[-200, 718, zr0 - 4], [-140, 690, zFront + 110], [-82, deck + 70, zFront + 40], [-82, deck + 70, zFront + 2]], 18, { segments: 12 });
  tube(block.geo('rubber'), [[260, 315, zr0 - 4], [230, 330, zFront + 98], [82, yc + 70, zFront + 40], [82, yc + 70, zFront + 2]], 18, { segments: 12 });
  parts.push(rad);

  // The intake: four runners from the head's left side to a plenum, and the air filter beside it.
  const intake = new Part('intake');
  const ig = intake.geo('casting');
  roundedBox(ig, [150, 215], [deck - 10, deck + 80], [zRear + 30, zFront - 40], 14, { segments: 3 });
  for (const z of zc) tube(ig, [[95, deck + 45, z], [125, deck + 50, z], [152, deck + 40, z]], 18, { segments: 12 });
  roundedBox(intake.geo('trim'), [215, 380], [deck + 4, deck + 110], [zRear + 66, zFront - 80], 16, { segments: 3 });
  parts.push(intake);

  // The exhaust: the manifold's four pipes from the head's right side, down under the car, over the rear axle
  // to the silencer and out at the back.
  const exhaust = new Part('exhaust');
  const xg = exhaust.geo('exhaust');
  const collector = [-215, 400, zRear + 20];
  for (const z of zc) tube(xg, [[-95, deck + 40, z], [-150, deck, z], [-195, deck - 90, (z + collector[2]) / 2], collector], 19, { segments: 12 });
  const zAxle = -spec.wheelbase / 2;
  // Out round the bell housing (which comes away backwards), then under the floor.
  const route = [collector, [-232, 340, 1250], [-212, 295, 1100], [-185, 232, 900], [-180, 232, 260]];
  tube(xg, route, 24, { segments: 14 });
  roundedBox(xg, [-250, -110], [196, 268], [-280, 260], 30, { segments: 4 });
  tube(xg, [[-180, 232, -280], [-180, 232, -700], [-300, 262, -1000], [-360, 420, zAxle + 120], [-360, 420, zAxle - 120], [-360, 300, zAxle - 330], [-360, 262, -1960]], 24, { segments: 14 });
  // The silencer and its tailpipe stop short of the tail's closed underside, which the body takes with it.
  roundedBox(xg, [-520, -220], [196, 320], [-2130, -1960], 40, { segments: 4 });
  tube(xg, [[-430, 228, -2118], [-430, 200, -2134]], 20, { segments: 14 });
  parts.push(exhaust);

  // The fuel tank under the boot floor, and the battery for the starter and lights by the radiator.
  const tank = new Part('fuel_tank');
  roundedBox(tank.geo('tank'), [-150, 460], [300, 500], [-1950, -1600], 30, { segments: 4 });
  tube(tank.geo('rubber'), [[400, 480, -1700], [640, 650, -1740], [780, 740, -1760]], 22, { segments: 12 });
  parts.push(tank);
  const battery = new Part('battery');
  roundedBox(battery.geo('battery'), [380, 580], [540, 720], [1860, 2020], 10, { segments: 2 });
  for (const [x, key] of [[420, 'copper'], [540, 'steel']]) shaft(battery.geo(key), 'y', [x, 0, 1900], [[11, 720], [11, 742]], { segments: 16 });
  parts.push(battery);

  // The clutch: pressure plate and disc, pressed against the flywheel.
  const clutch = new Part('clutch');
  shaft(clutch.geo('steel'), 'z', [0, yc, 0], [[126, zRear - 78], [126, zRear - 52]], { bore: 40, segments: 56 });
  shaft(clutch.geo('trim'), 'z', [0, yc, 0], [[110, zRear - 52], [110, zRear - 43]], { bore: 30, segments: 56 });
  parts.push(clutch);
  hints.clutch = [0, yc, zRear - 60];

  // The gearbox: bell housing and case, the shafts and gears inside them, and the lever.
  const box0 = 960;
  const box1 = zRear - 114;
  const gearbox = new Part('gearbox');
  const gg = gearbox.geo('cover');
  shaft(gg, 'z', [0, yc, 0], [[178, box1], [178, zRear]], { bore: 172, segments: 64 });
  plate(gg, 'z', { outer: ring(178, 0, yc, 64), holes: [ring(20, 0, yc)] }, box1 - 6, box1);
  for (const s of [-1, 1]) box(gg, s > 0 ? [72, 78] : [-78, -72], [yc - 135, yc + 70], [box0, box1 - 6], { axis: 'x' });
  for (const [y0, y1] of [[yc - 135, yc - 129], [yc + 64, yc + 70]]) box(gg, [-72, 72], [y0, y1], [box0, box1 - 6]);
  plate(gg, 'z', { outer: rect([-72, 72], [yc - 129, yc + 64]), holes: [ring(20, 0, yc)] }, box0, box0 + 6);
  shaft(gg, 'z', [0, yc, 0], [[45, 860], [45, box0]], { bore: 25, segments: 32 });
  tube(gearbox.geo('steel'), [[0, yc + 70, 1000], [0, 470, 860], [0, 690, 760]], 9, { segments: 10 });
  shaft(gearbox.geo('trim'), 'y', [0, 0, 760], [[20, 682], [20, 716]], { segments: 18 });
  parts.push(gearbox);
  const m = GEARS.module;
  const yl = yc - 75;
  const at = { constant: [box1 - 35, box1 - 10], third: [box1 - 105, box1 - 80], second: [box1 - 195, box1 - 170], first: [box1 - 285, box1 - 260] };
  // A tooth pointing down on a gear above meets a gap on the gear below.
  const down = -Math.PI / 2;
  const upGap = (teeth) => Math.PI / 2 + Math.PI / teeth;
  const input = new Part('gear_input', { parent: 'gearbox' });
  shaft(input.geo('steel'), 'z', [0, yc, 0], [[18, box1 - 38], [18, zRear - 40]], { segments: 24 });
  spur(input.geo('steel'), 'z', [0, yc, 0], { teeth: GEARS.mesh[1], module: m, phase: down }, ...at.constant);
  parts.push(input);
  const lay = new Part('layshaft', { parent: 'gearbox' });
  shaft(lay.geo('steel'), 'z', [0, yl, 0], [[16, box0 + 10], [16, box1 - 8]], { segments: 24 });
  for (const [key, [lt]] of [['constant', GEARS.mesh], ['third', GEARS.third], ['second', GEARS.second], ['first', GEARS.first]]) spur(lay.geo('steel'), 'z', [0, yl, 0], { teeth: lt, module: m, phase: upGap(lt) }, ...at[key]);
  parts.push(lay);
  const main = new Part('mainshaft', { parent: 'gearbox' });
  shaft(main.geo('steel'), 'z', [0, yc, 0], [[45, 846], [45, 858], [18, 858], [18, box1 - 41]], { segments: 28 });
  for (const [z0, z1] of [[at.third[1] + 8, at.constant[0] - 6], [at.first[1] + 20, at.second[0] - 20]]) shaft(main.geo('casting'), 'z', [0, yc, 0], [[32, z0], [32, z1]], { segments: 28 });
  parts.push(main);
  for (const [key, [, mt]] of [['third', GEARS.third], ['second', GEARS.second], ['first', GEARS.first]]) {
    const gear = new Part(`gear_${key === 'first' ? 1 : key === 'second' ? 2 : 3}`, { parent: 'gearbox' });
    spur(gear.geo('steel'), 'z', [0, yc, 0], { teeth: mt, module: m, phase: down, bore: 18.5 }, ...at[key]);
    parts.push(gear);
  }
  hints.gearbox = { main: [0, yc, 1000], lay: [0, yl, 1000] };

  // The propshaft, from the gearbox's output to the differential's pinion, with a universal joint at each end.
  const axleY = corners(spec).find((c) => c.axle === 'rear').size.r;
  const pFront = [0, yc, 846];
  const pRear = [0, axleY, zAxle + 175];
  const prop = new Part('propshaft');
  tube(prop.geo('steel'), [[pFront[0], pFront[1], pFront[2] - 28], [pRear[0], pRear[1], pRear[2] + 28]], 30, { segments: 20 });
  for (const [p, dir] of [[pFront, -1], [pRear, 1]]) {
    const [f0, f1] = dir < 0 ? [p[2] - 12, p[2]] : [p[2] - 2, p[2] + 10];
    shaft(prop.geo('steel'), 'z', [0, p[1], 0], [[45, f0], [45, f1]], { segments: 24 });
    const zx = dir < 0 ? f0 - 10 : f1 + 10;
    roundedBox(prop.geo('casting'), [-38, 38], [p[1] - 8, p[1] + 8], [zx - 8, zx + 8], 4, { segments: 2 });
  }
  parts.push(prop);
  hints.prop = { front: pFront, rear: pRear };

  // The live rear axle: the banjo housing with tubes out to the wheels, the pinion's nose, leaf springs under it.
  const halfTrack = spec.track[1] / 2;
  const axle = new Part('rear_axle');
  const ag = axle.geo('casting');
  const centre = [0, axleY, zAxle];
  shaft(ag, 'x', centre, [[60, -100], [118, -70], [135, -30], [135, 30], [118, 70], [60, 100]], { segments: 48 });
  shaft(ag, 'x', centre, [[40, 95], [40, halfTrack - 95]], { segments: 28 });
  shaft(ag, 'x', centre, [[40, -halfTrack + 95], [40, -95]], { segments: 28 });
  shaft(ag, 'z', [0, axleY, 0], [[70, zAxle + 60], [55, zAxle + 140], [42, zAxle + 160]], { segments: 32 });
  parts.push(axle);
  const springs = new Part('rear_springs');
  for (const s of [-1, 1]) {
    const x0 = s * 520;
    const half = 600;
    for (let k = 0; k < 4; k++) {
      const len = half * (1 - k * 0.2);
      const top = (z) => axleY - 40 - k * 8 + 70 * ((z - zAxle) / half) ** 2;
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const z = zAxle - len + (2 * len * i) / 24;
        pts.push([z, top(z)]);
      }
      const outline = [...pts, ...pts.reverse().map(([z, y]) => [z, y - 7])];
      plate(springs.geo('steel'), 'x', { outer: outline }, x0 - 27, x0 + 27);
    }
    for (const z of [zAxle - half, zAxle + half]) {
      shaft(springs.geo('rubber'), 'x', [0, axleY + 30, z], [[15, x0 - 30], [15, x0 + 30]], { segments: 16 });
      box(springs.geo('steel'), [x0 - 20, x0 + 20], [axleY + 30, axleY + 110], [z - 12, z + 12]);
    }
    // A damper from the axle up to the body, behind the axle.
    tube(springs.geo('damper'), [[s * 430, axleY - 10, zAxle - 50], [s * 430, axleY + 250, zAxle - 175]], 20, { segments: 12 });
  }
  parts.push(springs);

  // The differential: the pinion on the propshaft's end turns the crown wheel, which turns the carrier; the
  // spider gears in the carrier turn the side gears on the half shafts, and let them turn at different speeds.
  const [pt, ct] = GEARS.final;
  const pm = 5.5;
  const pinion = new Part('pinion');
  conicalGear(pinion.geo('steel'), 'z', [0, axleY, 0], { teeth: pt, module: pm }, zAxle + 112, zAxle + 150, 0.72, 1, 0);
  shaft(pinion.geo('steel'), 'z', [0, axleY, 0], [[18, zAxle + 150], [18, pRear[2] - 14], [40, pRear[2] - 14], [40, pRear[2] - 4]], { segments: 24 });
  parts.push(pinion);
  const carrier = new Part('diff_carrier');
  conicalGear(carrier.geo('steel'), 'x', centre, { teeth: ct, module: pm }, 28, 54, 1, 0.84, 62);
  shaft(carrier.geo('casting'), 'x', centre, [[50, -46], [62, -24], [62, 28], [46, 40]], { segments: 40 });
  shaft(carrier.geo('steel'), 'y', [0, 0, zAxle], [[8, axleY - 58], [8, axleY + 58]], { segments: 16 });
  parts.push(carrier);
  for (const [i, s] of [[1, 1], [2, -1]]) {
    const spider = new Part(`spider_${i}`, { parent: 'diff_carrier' });
    const [w0, w1] = s > 0 ? [axleY + 36, axleY + 54] : [axleY - 36, axleY - 54];
    conicalGear(spider.geo('steel'), 'y', [0, 0, zAxle], { teeth: 10, module: 4 }, w0, w1, 0.7, 1, 8.5);
    parts.push(spider);
  }
  for (const [side, s] of [['left', 1], ['right', -1]]) {
    const hs = new Part(`halfshaft_${side}`);
    shaft(hs.geo('steel'), 'x', centre, s > 0 ? [[15, 60], [15, halfTrack - 70]] : [[15, -halfTrack + 70], [15, -60]], { segments: 20 });
    conicalGear(hs.geo('steel'), 'x', centre, { teeth: 16, module: 4 }, s * 38, s * 66, 0.7, 1, 0);
    shaft(hs.geo('steel'), 'x', centre, s > 0 ? [[55, halfTrack - 70], [55, halfTrack - 58]] : [[55, -halfTrack + 58], [55, -halfTrack + 70]], { segments: 28 });
    parts.push(hs);
  }
  hints.diff = { centre, pinion: [0, axleY, zAxle + 130] };
  return { parts, hints };
}
