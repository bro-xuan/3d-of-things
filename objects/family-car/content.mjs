// Writes content/family-car.json, the content file for a car with an engine (a spec with an `engine`): its
// text, its parts and how they come off, its motions (pistons on the crank, valves on the cam, the gearbox,
// the differential), its callouts and its "How it works" film. It runs the build (without the checks) for where
// the wheels, the engine's moving parts and the gears sit in model space.
//   node objects/family-car/content.mjs
import { writeContent } from '../../scripts/kit/content.mjs';
import { GEARS, LIFT, DURATION, ratio } from '../../scripts/kit/cars/engine.mjs';
import generate from './generate.mjs';
import spec from './spec.mjs';

const car = 'family-car';
const { hints: H } = await generate({ data: { build: { car } }, check: 'skip', log: () => {} });
const { slug, ...thing } = petrolContent({ car, spec, H });
writeContent(slug, thing);

function petrolContent({ car, spec, H }) {
  const MM = H.space.mmPerUnit;
  const r4 = (v) => +v.toFixed(4);
  const M = (x, y, z) => [x, y, z].map((v, i) => r4(H.space.origin[i] + v / MM));
  const U = (mm) => r4(mm / MM);
  const pose = (target, [az, el], dist) => {
    const a = (az * Math.PI) / 180;
    const e = (el * Math.PI) / 180;
    return { position: [target[0] + dist * Math.cos(e) * Math.sin(a), target[1] + dist * Math.sin(e), target[2] + dist * Math.cos(e) * Math.cos(a)].map(r4), target };
  };
  const P = (direction, distance, window, extra = {}) => ({ direction, distance, window, ...extra });
  const X = [1, 0, 0];
  const Z = [0, 0, 1];
  const E = H.engine;
  const eng = spec.engine;
  const zf = spec.wheelbase / 2;
  const zr = -spec.wheelbase / 2;
  const zRear = eng.front - 70 - 3 * eng.spacing - 70;
  const axleY = H.wheels.rl.radius;

  // Speeds (turns a second): the engine at a steady 2, the rest in fourth gear.
  const crank = 2;
  const final = GEARS.final[1] / GEARS.final[0];
  const wheel = crank / final;
  const ratios = { first: ratio(...GEARS.first), second: ratio(...GEARS.second), third: ratio(...GEARS.third), fourth: 1 };
  const layshaft = (-crank * GEARS.mesh[1]) / GEARS.mesh[0];
  const bend = 0.15;
  const spider = bend * wheel * (16 / 10);

  const doors = spec.panels.doors.flatMap((d) => ['left', 'right'].map((side) => ({ node: `door_${d.name}_${side}`, side, label: `${side === 'left' ? 'Left' : 'Right'} ${d.name} door` })));
  const wheelNames = ['fl', 'fr', 'rl', 'rr'];
  const parts = [
    ...doors.map((d) => ({ node: d.node, label: d.label, group: 'Body', about: 'A door, with its window in a steel frame.', ...P([d.side === 'left' ? 1 : -1, 0.15, 0], 0.32, [0, 0.22]) })),
    { node: 'bonnet', label: 'Bonnet', group: 'Body', about: 'Over the engine.', ...P([0, 1, 0.3], 0.2, [0.08, 0.26]) },
    { node: 'boot', label: 'Boot lid', group: 'Body', about: 'Over the boot; the fuel tank is under its floor.', ...P([0, 1, -0.3], 0.2, [0.08, 0.26]) },
    { node: 'front_bumper', label: 'Front', group: 'Body', about: 'The nose: the grille, the headlamps and a chrome bumper wrapped round its corners.', ...P([0, 0, 1], 0.22, [0.16, 0.34]) },
    { node: 'rear_bumper', label: 'Tail', group: 'Body', about: 'The tail lamps, the number plate and the rear bumper.', ...P([0, 0, -1], 0.22, [0.16, 0.34]) },
    { node: 'body', label: 'Body', group: 'Body', about: 'The steel shell, the glass and the cabin: it lifts off the engine, the gearbox and the axles underneath.', ...P([0, 1, 0], 0.36, [0.4, 0.62]) },
    { node: 'radiator', label: 'Radiator', group: 'Engine', about: 'Hot water from the engine runs down its tubes and is cooled by the air through its fins.', ...P([0, 0, 1], 0.12, [0.6, 0.7]) },
    { node: 'fan', label: 'Fan', group: 'Engine', about: 'On the crankshaft’s nose: it pulls air through the radiator when the car is going slowly.', ...P([0, 0, 1], 0.06, [0.62, 0.7]) },
    { node: 'timing_belt', label: 'Timing belt', group: 'Engine', about: 'A toothed belt from the crankshaft to the camshaft, whose pulley is twice the size: the camshaft turns at half the crankshaft’s speed.', ...P([0, 0, 1], 0.03, [0.66, 0.72]) },
    { node: 'cam_cover', label: 'Cam cover', group: 'Engine', about: 'Keeps the oil in, over the camshaft.', ...P([0, 1, 0], 0.11, [0.66, 0.74]) },
    { node: 'camshaft', label: 'Camshaft', group: 'Engine', about: 'A lobe over each valve, set round the shaft so each opens at its moment; it turns once for every two turns of the crankshaft.', ...P([0, 1, 0], 0.075, [0.72, 0.8]) },
    { node: 'cylinder_head', label: 'Cylinder head', group: 'Engine', about: 'Over the cylinders: the valves, two to a cylinder, and the spark plugs.', ...P([0, 1, 0], 0.05, [0.76, 0.86]) },
    { node: 'engine_block', label: 'Engine block', group: 'Engine', about: 'Cast iron: four cylinders in a row, the crankshaft in its bearings underneath.', ...P([0, 1, 0], 0, [0, 1]) },
    { node: 'piston_1', label: 'Pistons and rods', group: 'Engine', about: 'Four pistons with their rings, each on a connecting rod down to its crankpin.', with: ['piston_2', 'piston_3', 'piston_4', 'rod_1', 'rod_2', 'rod_3', 'rod_4'], ...P([0, 1, 0], 0, [0, 1]) },
    { node: 'crankshaft', label: 'Crankshaft', group: 'Engine', about: 'Turns the pistons’ up and down into turning: a crankpin for each rod with a counterweight opposite, the flywheel at the back.', ...P([0, 1, 0], 0, [0, 1]) },
    { node: 'sump', label: 'Sump', group: 'Engine', about: 'The oil, under the crankshaft.', ...P([0, -1, 0], 0.04, [0.62, 0.72]) },
    { node: 'intake', label: 'Intake', group: 'Engine', about: 'Air comes in through the filter and along the runners, petrol is added, and the mixture goes into the cylinders.', ...P([1, 0, 0], 0.05, [0.7, 0.8]) },
    { node: 'exhaust', label: 'Exhaust', group: 'Engine', about: 'The burnt gas from each cylinder, through the catalytic converter and the silencer to the tailpipe.', ...P([0, 1, 0], 0, [0, 1]) },
    { node: 'battery', label: 'Battery', group: 'Engine', about: 'Twelve volts for the starter motor, the sparks and the lights.', ...P([0, 1, 0], 0.05, [0.6, 0.7]) },
    { node: 'propshaft', label: 'Propshaft', group: 'Drivetrain', about: 'Takes the drive back from the gearbox to the rear axle, with a universal joint at each end so the axle can move on its springs.', ...P([0, -1, 0], 0.06, [0.6, 0.68]) },
    { node: 'gearbox', label: 'Gearbox', group: 'Drivetrain', about: 'Four forward gears in a cast case; the lever moves the selectors inside.', ...P([0, 0.55, -1], 0.1, [0.68, 0.8]) },
    { node: 'gear_input', label: 'Gears', group: 'Drivetrain', about: 'The input shaft drives the layshaft below it; the layshaft’s gears drive a gear for each speed, turning freely on the main shaft until one is locked to it.', with: ['layshaft', 'mainshaft', 'gear_1', 'gear_2', 'gear_3'], ...P([0, 1, 0], 0, [0, 1]) },
    { node: 'clutch', label: 'Clutch', group: 'Drivetrain', about: 'Springs press its disc against the flywheel; pressing the pedal lets it go, to change gear or to stop.', ...P([0, 0, -1], 0.05, [0.8, 0.88]) },
    { node: 'rear_axle', label: 'Rear axle', group: 'Drivetrain', about: 'The axle’s casing: the differential in its middle, the half shafts in its tubes.', ...P([0, 1, 0], 0, [0, 1]) },
    { node: 'diff_carrier', label: 'Differential', group: 'Drivetrain', about: 'The pinion turns the crown wheel and the carrier with it; the spider gears in the carrier share the drive between the two half shafts.', with: ['pinion', 'spider_1', 'spider_2'], ...P([0, 1, 0], 0, [0, 1]) },
    { node: 'halfshaft_left', label: 'Half shafts', group: 'Drivetrain', about: 'From the differential out to the wheels, inside the axle’s tubes.', with: ['halfshaft_right'], ...P([0, 1, 0], 0, [0, 1]) },
    { node: 'rear_springs', label: 'Rear springs', group: 'Chassis', about: 'Leaf springs and dampers: the axle hangs from the body on them.', ...P([0, 1, 0], 0, [0, 1]) },
    { node: 'suspension', label: 'Front suspension', group: 'Chassis', about: 'At each front corner, two wishbones hold the wheel’s upright, with a coil spring round the damper; the steering rack turns the uprights.', ...P([0, 1, 0], 0, [0, 1]) },
    { node: 'fuel_tank', label: 'Fuel tank', group: 'Chassis', about: 'The petrol, under the boot floor.', ...P([0, 1, 0], 0, [0, 1]) },
    ...wheelNames.map((n) => ({ node: `wheel_${n}`, label: `${n[0] === 'f' ? 'Front' : 'Rear'} ${n[1] === 'l' ? 'left' : 'right'} wheel`, group: 'Chassis', about: '14-inch steel wheels with hubcaps, on 185/70 tyres.', ...P([n[1] === 'l' ? 1 : -1, 0, 0], 0.15, [0.22, 0.38]) })),
  ];

  const propAxis = E.prop.front.map((v, i) => v - E.prop.rear[i]);
  const len = Math.hypot(...propAxis);
  const motion = [
    ...wheelNames.map((n) => ({ node: `wheel_${n}`, axis: X, pivot: H.wheels[n].axle, speed: r4(wheel) })),
    { node: 'crankshaft', axis: Z, pivot: E.crank, speed: crank, inside: true },
    { node: 'fan', axis: Z, pivot: E.fan, speed: crank },
    { node: 'clutch', axis: Z, pivot: E.clutch, speed: crank, inside: true },
    { node: 'camshaft', axis: Z, pivot: E.cam, speed: crank / 2, inside: true },
    ...E.pistons.flatMap((p) => [
      { node: p.node, axis: Z, crank: 'crankshaft', along: [0, 1, 0], throw: E.r, rod: E.L, phase: p.phase },
      { node: p.rod, axis: Z, pivot: p.pin, crank: 'crankshaft', along: [0, 1, 0], throw: E.r, rod: E.L, phase: p.phase, rocks: true },
    ]),
    ...E.valves.map((v) => ({ node: v.node, axis: Z, cam: 'camshaft', along: [0, -1, 0], lift: U(LIFT), phase: v.phase, duration: DURATION })),
    { node: 'gear_input', axis: Z, pivot: E.gearbox.main, speed: crank, inside: true },
    { node: 'layshaft', axis: Z, pivot: E.gearbox.lay, speed: r4(layshaft), inside: true },
    { node: 'gear_3', axis: Z, pivot: E.gearbox.main, speed: r4(crank / ratios.third), inside: true },
    { node: 'gear_2', axis: Z, pivot: E.gearbox.main, speed: r4(crank / ratios.second), inside: true },
    { node: 'gear_1', axis: Z, pivot: E.gearbox.main, speed: r4(crank / ratios.first), inside: true },
    { node: 'mainshaft', axis: Z, pivot: E.gearbox.main, speed: crank, inside: true },
    { node: 'propshaft', axis: propAxis.map((v) => r4(v / len)), pivot: E.prop.front, speed: crank },
    { node: 'pinion', axis: Z, pivot: E.diff.pinion, speed: crank, inside: true },
    { node: 'diff_carrier', axis: X, pivot: E.diff.centre, speed: r4(wheel), inside: true },
    { node: 'spider_1', axis: [0, 1, 0], pivot: E.diff.centre, speed: r4(spider), inside: true },
    { node: 'spider_2', axis: [0, 1, 0], pivot: E.diff.centre, speed: r4(-spider), inside: true },
    { node: 'halfshaft_left', axis: X, pivot: E.diff.centre, speed: r4(wheel), inside: true },
    { node: 'halfshaft_right', axis: X, pivot: E.diff.centre, speed: r4(wheel), inside: true },
  ];

  const engineTop = M(0, 760, 1650);
  const annotations = [
    { title: 'Pistons', text: 'Four of them, pushed down in turn by burning petrol; their rods turn the crankshaft.', node: 'piston_1', position: M(0, 640, 1772), explode: 0.9, camera: pose(M(0, 520, 1620), [-35, 40], 0.75) },
    { title: 'Camshaft', text: 'Turned by the toothed belt at half the crankshaft’s speed; its lobes open the valves.', node: 'camshaft', position: M(0, 930, 1650), explode: 0.9, camera: pose(engineTop, [-40, 30], 0.85) },
    { title: 'Gearbox', text: 'Four forward gears: the layshaft below the main shaft, a gear on it for each speed.', node: 'gearbox', position: M(0, 470, 1150), explode: 0.6, camera: pose(M(0, 360, 1150), [-60, 24], 0.8) },
    { title: 'Differential', text: 'In the middle of the rear axle: the pinion turns the crown wheel, and the spider gears let the wheels turn at different speeds.', node: 'rear_axle', position: M(0, 470, zr), explode: 0.6, camera: pose(M(0, 330, zr), [-140, 26], 0.8) },
    { title: 'Radiator', text: 'The engine’s water, cooled by the air through the grille and the fan.', node: 'radiator', position: M(0, 760, 2070), explode: 0.6, camera: pose(M(0, 520, 2000), [-30, 20], 0.9) },
    { title: 'Exhaust', text: 'Burnt gas out through the catalytic converter and the silencer.', node: 'exhaust', position: M(-200, 300, 0), explode: 0.6, camera: pose(M(-200, 260, -200), [-70, 18], 1.3) },
  ];

  // The power's path: from the crankshaft back through the clutch, the gearbox and the propshaft to the pinion, round
  // the crown wheel and out along a half shaft to each rear wheel.
  const flowPath = [
    { node: 'crankshaft', at: M(0, eng.yc, 1600) },
    { node: 'clutch', at: M(0, eng.yc, zRear - 60) },
    { node: 'mainshaft', at: M(0, eng.yc, 1100) },
    { node: 'propshaft', at: M(0, (eng.yc + axleY) / 2, 0) },
    { node: 'pinion', at: M(0, axleY, zr + 160) },
    { node: 'diff_carrier', at: M(0, axleY, zr) },
    { node: 'halfshaft_left', at: M(420, axleY, zr) },
    { node: 'wheel_rl', at: M(spec.track[1] / 2, axleY, zr) },
  ];
  const otherWheel = [
    { node: 'diff_carrier', at: M(0, axleY, zr) },
    { node: 'halfshaft_right', at: M(-420, axleY, zr) },
    { node: 'wheel_rr', at: M(-spec.track[1] / 2, axleY, zr) },
  ];
  // "How it works" as a film: the engine turning the rear wheels, the camera following the power back along the car.
  // What stays solid: everything the engine turns, from the pistons to the rear wheels. The body, the engine block and
  // head, the gearbox case and the axle casing are glass; so are the front wheels, which only roll.
  const MOVING = [
    ...E.pistons.flatMap((p) => [p.node, p.rod]),
    'crankshaft',
    'camshaft',
    ...E.valves.map((v) => v.node),
    'clutch',
    'gear_input',
    'layshaft',
    'mainshaft',
    'gear_1',
    'gear_2',
    'gear_3',
    'propshaft',
    'pinion',
    'diff_carrier',
    'spider_1',
    'spider_2',
    'halfshaft_left',
    'halfshaft_right',
    'wheel_rl',
    'wheel_rr',
  ];
  // Every shot frames the whole car, so none of it runs over the script beside the stage.
  const WHOLE = ['body', 'front_bumper', 'rear_bumper', ...wheelNames.map((n) => `wheel_${n}`)];
  // Slowed down so the pistons can be followed, the same all through; straight ahead, so the spider gears stay still.
  const pace = { focus: MOVING, rate: 0.4, spin: { spider_1: 0, spider_2: 0 } };
  const film = [
    {
      chapter: 'Engine',
      caption: 'Petrol burns above each piston in turn and drives it down, turning the crankshaft.',
      duration: 6.5,
      angle: [44, 34],
      fill: 0.84,
      ...pace,
      frame: WHOLE,
      tags: [
        { node: 'piston_1', text: 'pistons', at: M(0, 640, eng.front - 70) },
        { node: 'crankshaft', text: 'crankshaft', at: M(0, eng.yc - 70, zRear + 40) },
      ],
    },
    {
      chapter: 'Drive',
      caption: 'Through the clutch and gearbox, the propshaft carries the turn back under the floor.',
      duration: 6,
      angle: [80, 32],
      fill: 0.84,
      ...pace,
      frame: WHOLE,
      flow: flowPath.slice(0, 5),
      tags: [
        { node: 'mainshaft', text: 'gearbox', at: M(0, eng.yc + 70, 1100) },
        { node: 'propshaft', text: 'propshaft', at: M(0, (eng.yc + axleY) / 2 + 40, 0) },
      ],
    },
    {
      chapter: 'Drive',
      caption: 'At the back the pinion turns the crown wheel, and the half shafts turn the rear wheels.',
      duration: 6.5,
      angle: [118, 30],
      fill: 0.84,
      ...pace,
      frame: WHOLE,
      flow: flowPath,
      flows: [otherWheel],
      tags: [
        { node: 'diff_carrier', text: 'crown wheel', at: M(60, axleY + 120, zr) },
        { node: 'halfshaft_left', text: 'half shaft', at: M(380, axleY + 30, zr) },
      ],
    },
  ];

  return {
    slug: 'family-car',
    order: 10,
    title: 'Family Car',
    hook: 'How an ordinary car works: four pistons on a crankshaft, a gearbox, a propshaft and a differential.',
    category: 'cars',
    summary: [
      'For most of the twentieth century a car was built like this: an engine at the front, burning petrol in four cylinders, and its power taken back to the rear wheels through a clutch, a gearbox, a long propshaft and a differential in the rear axle. This one is of no particular make, a family saloon of the 1970s or 80s, but its parts are the ones almost every car of the time had.',
      'In the engine, four pistons are pushed down in turn by burning petrol and air, and their connecting rods turn the crankshaft. A camshaft, driven by a toothed belt at half the crankshaft’s speed, opens each cylinder’s valves at the right moment of its four strokes. The gearbox trades speed for pulling power, and the differential lets the rear wheels turn at different speeds in a bend.',
      'This model was built in code for this site; its sizes are those of a typical saloon of the time.',
    ],
    model: 'models/family-car.glb',
    viewAngle: [-40, 12],
    explodeAngle: [-46, 26],
    explodeDuration: 2400,
    motionLabel: 'Drive',
    facts: [
      { label: 'Engine', value: 'Two litres, four cylinders in a row' },
      { label: 'Bore × stroke', value: `${eng.bore} × ${eng.stroke} mm` },
      { label: 'Gearbox', value: 'Four forward speeds' },
      { label: 'Final drive', value: `${final.toFixed(1)} : 1 (${GEARS.final[0]} and ${GEARS.final[1]} teeth)` },
      { label: 'Layout', value: 'Engine at the front, rear-wheel drive' },
      { label: 'Size', value: `${(spec.length[1] - spec.length[0]).toLocaleString('en-GB')} mm long on a ${spec.wheelbase.toLocaleString('en-GB')} mm wheelbase` },
    ],
    parts,
    annotations,
    motion,
    film,
    credit: {
      title: 'Family Car, built in code',
      author: '3D of Things',
      license: 'CC0 1.0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      source: 'built in code for this site',
      sourceUrl: '',
      extra: { label: 'Sources', text: 'The layout and sizes of a typical rear-wheel-drive saloon of the 1970s and 80s; no particular make.' },
    },
    build: { generate: 'objects/family-car/generate.mjs', car },
  };
}
