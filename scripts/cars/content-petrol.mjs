// The content file for a car with an engine (scripts/cars/specs with an `engine`): its text, its parts and
// how they come off, its motions (pistons on the crank, valves on the cam, the gearbox, the differential),
// its callouts and its "How it works". Called by content.mjs, which runs the build for the hints.
import { FIRING, GEARS, LIFT, DURATION, ratio } from './engine.mjs';

export function petrolContent({ car, spec, H }) {
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

  // The four strokes of each cylinder through one turn of the camshaft (two of the crank), as the piston's height.
  const height = (t) => E.r * Math.cos(t) + Math.sqrt(E.L ** 2 - (E.r * Math.sin(t)) ** 2);
  const [hMin, hMax] = [height(Math.PI), height(0)];
  const lanes = E.pistons.map((p, k) => {
    const f = FIRING[k];
    const points = [];
    for (let deg = 0; deg <= 720; deg += 15) points.push([r4(deg / 720), r4((height(((deg + p.phase) * Math.PI) / 180) - hMin) / (hMax - hMin))]);
    const at = (d) => r4((((f + d) % 720) + 720) % 720 / 720);
    return { name: `${k + 1}`, points, notes: [[at(90), 'Power'], [at(270), 'Exhaust'], [at(450), 'Intake'], [at(630), 'Squeeze']] };
  });
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
  const drive = ['mainshaft', 'propshaft', 'pinion', 'diff_carrier', 'halfshaft_left', 'halfshaft_right', ...wheelNames.map((n) => `wheel_${n}`)];
  const outer = (side) => ({ [`halfshaft_${side}`]: 1 + bend, [`wheel_r${side[0]}`]: 1 + bend, [`wheel_f${side[0]}`]: 1 + bend });
  const inner = (side) => ({ [`halfshaft_${side}`]: 1 - bend, [`wheel_r${side[0]}`]: 1 - bend, [`wheel_f${side[0]}`]: 1 - bend });
  const how = [
    {
      label: 'Layout',
      title: 'From the engine to the rear wheels',
      text: [
        'The engine at the front makes the power. It goes back through the clutch and the gearbox, along the propshaft under the floor, and into the rear axle, where the differential turns it through a right angle and out along the half shafts to the wheels.',
        'A car like this carries its own fuel and has to cool itself: the tank is under the boot, the radiator in the nose, the exhaust runs the length of the car, and a battery starts it all.',
      ],
      angle: [-40, 26],
      fill: 0.9,
      explode: 0.6,
      flow: flowPath,
      focus: ['engine_block', 'cylinder_head', 'crankshaft', 'clutch', 'gearbox', 'propshaft', 'rear_axle', 'diff_carrier', 'halfshaft_left', 'wheel_rl', 'wheel_rr', 'radiator', 'fuel_tank', 'exhaust'],
      chart: { type: 'bars', title: 'Where the petrol’s energy goes', caption: 'Rough shares at a steady speed: only about a quarter of the energy in the fuel ends up turning the wheels.', unit: '% of the fuel’s energy', bars: [{ label: 'Wheels', value: 25 }, { label: 'Exhaust', value: 35 }, { label: 'Cooling', value: 30 }, { label: 'Friction', value: 10 }], picked: 0 },
    },
    {
      label: 'Four strokes',
      title: 'Suck, squeeze, bang, blow',
      text: [
        'Each cylinder works in four strokes, two turns of the crankshaft. The piston goes down with the intake valve open, drawing in air and petrol; comes up with both valves shut, squeezing them; the spark plug fires and the burning mixture drives it down, the only stroke that does any work; and it comes up again with the exhaust valve open, pushing the burnt gas out.',
        'The four cylinders fire in the order 1, 3, 4, 2, one every half turn, so one of them is always on its power stroke. The camshaft turns once for every two turns of the crankshaft, and its lobes open each valve at its moment.',
      ],
      angle: [-35, 28],
      fill: 0.75,
      explode: 0.6,
      rate: 0.35,
      focus: ['piston_1', 'crankshaft', 'camshaft', ...E.valves.map((v) => v.node)],
      frame: ['engine_block', 'cylinder_head'],
      tags: [
        { node: 'camshaft', text: 'Camshaft', at: M(0, 750, zRear + 40) },
        { node: 'crankshaft', text: 'Crankshaft', at: M(0, eng.yc - 70, zRear + 40) },
        { node: 'piston_1', text: 'Cylinder 1', at: M(0, 640, eng.front - 70) },
      ],
      try: 'run',
      count: [{ node: 'crankshaft', label: 'Crankshaft' }, { node: 'camshaft', label: 'Camshaft' }],
      chart: { type: 'timing', title: 'The four strokes, cylinder by cylinder', caption: 'Each line is a piston’s height, cylinders 1 to 4 from the front, through one turn of the camshaft. They fire 1, 3, 4, 2, so a power stroke starts every half turn of the crank.', node: 'camshaft', perTurn: 1, lanes },
    },
    {
      label: 'Gearbox',
      title: 'Gears for pulling, and for speed',
      text: [
        'An engine only works well over a band of speeds, so the gearbox lets it turn faster than the wheels when the car needs to pull (in first, three and a half turns of the engine for each turn of the propshaft) and at the same speed when it cruises (in fourth, the input and the output locked together).',
        'All the gears are always in mesh. The layshaft below is driven by the input shaft, and its gears drive one gear for each speed, turning freely on the main shaft; choosing a gear locks that one to the shaft. Pick a gear and watch the propshaft.',
      ],
      angle: [-55, 24],
      fill: 0.7,
      explode: 0.6,
      focus: ['gear_input', 'layshaft', 'mainshaft', 'gear_1', 'gear_2', 'gear_3', 'propshaft', 'clutch'],
      frame: ['gearbox'],
      tags: [
        { node: 'layshaft', text: 'Layshaft', at: M(0, eng.yc - 140, 1100) },
        { node: 'gear_1', text: '1st', at: M(0, eng.yc + 70, 1015) },
        { node: 'gear_input', text: 'Input', at: M(0, eng.yc + 70, 1290) },
      ],
      try: 'speeds',
      spin: drive,
      speeds: [
        { label: '1st', factor: r4(1 / ratios.first), note: `${ratios.first.toFixed(1)} turns of the engine for one of the propshaft` },
        { label: '2nd', factor: r4(1 / ratios.second), note: `${ratios.second.toFixed(2)} to 1` },
        { label: '3rd', factor: r4(1 / ratios.third), note: `${ratios.third.toFixed(2)} to 1` },
        { label: '4th', factor: 1, note: 'Direct: the input and the output locked together' },
      ],
      chart: { type: 'bars', title: 'Engine turns for each turn of the propshaft', caption: 'In first the engine turns three and a half times for each turn of the propshaft, so the wheels get three and a half times its pull.', unit: 'Ratio', follow: 'selected', bars: [{ label: '1st', value: +ratios.first.toFixed(2) }, { label: '2nd', value: +ratios.second.toFixed(2) }, { label: '3rd', value: +ratios.third.toFixed(2) }, { label: '4th', value: 1 }] },
    },
    {
      label: 'Differential',
      title: 'Letting the wheels turn at different speeds',
      text: [
        'In a bend the outside wheel travels further than the inside one, so it has to turn faster. The propshaft’s pinion turns the crown wheel and the carrier with it; in the carrier, the spider gears drive the half shafts’ gears. Straight ahead the spiders don’t turn and both shafts go round with the carrier; in a bend the spiders roll round, and one shaft gains what the other loses.',
        'The pinion has ten teeth and the crown wheel thirty-nine: the last reduction between the engine and the wheels, 3.9 to 1.',
      ],
      angle: [-150, 30],
      fill: 0.7,
      explode: 0.6,
      focus: ['diff_carrier', 'pinion', 'spider_1', 'spider_2', 'halfshaft_left', 'halfshaft_right', 'wheel_rl', 'wheel_rr', 'propshaft'],
      frame: ['rear_axle', 'wheel_rl', 'wheel_rr'],
      tags: [
        { node: 'pinion', text: 'Pinion', at: M(0, axleY + 60, zr + 150) },
        { node: 'diff_carrier', text: 'Crown wheel', at: M(60, axleY + 120, zr) },
        { node: 'spider_1', text: 'Spider gears', at: M(0, axleY + 70, zr - 40) },
      ],
      try: 'speeds',
      spin: ['halfshaft_left', 'halfshaft_right', 'wheel_rl', 'wheel_rr', 'wheel_fl', 'wheel_fr', 'spider_1', 'spider_2'],
      speeds: [
        { label: 'Straight', factor: 1, note: 'Both wheels at the carrier’s speed; the spider gears still', factors: { spider_1: 0, spider_2: 0 } },
        { label: 'Bend left', factor: 1, note: 'The right wheel outside, faster; the left one slower', factors: { ...outer('right'), ...inner('left'), spider_1: -1, spider_2: -1 } },
        { label: 'Bend right', factor: 1, note: 'The left wheel outside, faster; the right one slower', factors: { ...outer('left'), ...inner('right'), spider_1: 1, spider_2: 1 } },
      ],
      chart: { type: 'ladder', title: 'The two wheels and the crown wheel', caption: 'The dials turn with the half shafts and the crown wheel: in a bend, the outside wheel runs ahead of the crown wheel by as much as the inside one falls behind.', unit: 'Turns a second', rungs: [{ name: 'Left wheel', value: 1, node: 'halfshaft_left' }, { name: 'Crown wheel', value: 1, node: 'diff_carrier' }, { name: 'Right wheel', value: 1, node: 'halfshaft_right' }] },
    },
    {
      label: 'Cooling',
      title: 'Throwing heat away',
      text: [
        'Burning petrol in the cylinders makes far more heat than work, and the engine would seize without a way to get rid of it. Water is pumped round passages in the block and the head, then through the radiator in the nose, where the air coming through the grille (and pulled by the fan) cools it.',
        'About as much of the fuel’s energy goes into the radiator as goes out of the exhaust, and each of them is more than turns the wheels.',
      ],
      angle: [-75, 26],
      fill: 0.75,
      explode: 0.6,
      focus: ['radiator', 'fan', 'engine_block', 'cylinder_head'],
      frame: ['radiator', 'fan', 'engine_block'],
      tags: [{ node: 'radiator', text: 'Radiator', at: M(0, 760, 2070) }, { node: 'fan', text: 'Fan', at: M(0, eng.yc + 200, eng.front + 100) }],
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
    how,
    credit: {
      title: 'Family Car, built in code',
      author: '3D of Things',
      license: 'CC0 1.0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      source: 'built in code for this site',
      sourceUrl: '',
      extra: { label: 'Sources', text: 'The layout and sizes of a typical rear-wheel-drive saloon of the 1970s and 80s; no particular make.' },
    },
    build: { generate: 'scripts/cars/generate.mjs', car },
  };
}
