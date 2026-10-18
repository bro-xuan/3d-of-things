// The 2017 Roadster, which this page showed before the 2026 car replaced it, kept as the example of a
// plain electric car on the kit's car builder (no engine, no aero): its text (below), its spec,
// and where the build puts its wheels and motors in model space (it runs the build, without the checks).
// Not part of the site: it writes content/tesla-roadster.json over the live 2026 page, so it runs only when asked to.
//   node objects/tesla-roadster/2017/content.mjs --overwrite
import { writeContent } from '../../../scripts/kit/content.mjs';

if (!process.argv.includes('--overwrite')) {
  console.error('The 2017 Roadster writes content/tesla-roadster.json over the live 2026 page. Pass --overwrite if that is what you want.');
  process.exit(1);
}
import generate from './generate.mjs';
import spec from './spec.mjs';

const car = 'roadster-2';
const { hints: H } = await generate({ data: { build: { car } }, check: 'skip', log: () => {} });

const MM = H.space.mmPerUnit;
const r4 = (v) => +v.toFixed(4);
const M = (x, y, z) => [x, y, z].map((v, i) => r4(H.space.origin[i] + v / MM));
const pose = (target, [az, el], dist) => {
  const a = (az * Math.PI) / 180;
  const e = (el * Math.PI) / 180;
  return { position: [target[0] + dist * Math.cos(e) * Math.sin(a), target[1] + dist * Math.sin(e), target[2] + dist * Math.cos(e) * Math.cos(a)].map(r4), target };
};
const P = (direction, distance, window, extra = {}) => ({ direction, distance, window, ...extra });
const wheelNames = Object.keys(H.wheels);
const motors = Object.keys(H.motors);
const X = [1, 0, 0];
const zf = spec.wheelbase / 2;
const zr = -spec.wheelbase / 2;
const NUMBER = ['No', 'One', 'Two', 'Three', 'Four'];

/** Per car: its page's text, the tour's own steps and callouts, and anything said differently about its parts. */
const CARS = {
  'roadster-2': {
    slug: 'tesla-roadster',
    order: 9,
    title: 'Tesla Roadster',
    hook: 'Three motors and a battery in the floor: the second Roadster, as Tesla showed it in 2017.',
    summary: [
      'Tesla’s second Roadster was shown in 2017 as a low 2+2 with a glass roof that lifts off and stows in the boot. It has never been sold; the figures for it are Tesla’s own claims: 0 to 60 mph in 1.9 seconds, a 200 kWh battery and 620 miles (1,000 km) of range.',
      'Like every Tesla it is a skateboard underneath: a flat battery pack of thousands of cells fills the floor between the axles, and electric motors sit at the wheels, one at the front and one for each rear wheel. There is no gearbox to shift, no engine to start; each motor drives its wheels through a single reduction gear.',
      'This model was built in code for this site from the prototype’s proportions. Tesla hasn’t published drawings of its insides, so the layout under the body shows how cars like it are built rather than its exact parts.',
    ],
    facts: [
      { label: 'Motors', value: 'Three: one front, one for each rear wheel' },
      { label: 'Battery', value: '200 kWh (claimed)' },
      { label: '0–60 mph', value: '1.9 s (claimed)' },
      { label: 'Range', value: '620 miles, 1,000 km (claimed)' },
      { label: 'Seats', value: '2 + 2' },
      { label: 'Shown', value: '2017, as a prototype' },
    ],
    viewAngle: [-42, 14],
    explodeAngle: [-48, 24],
    pack: { kwh: 200, cellWh: 18, note: 'Tesla quoted 200 kWh for this car, enough to run an average home for a week. Its range comes from that and how little energy it uses: a low, smooth body cuts the air resistance, the biggest load at speed.' },
    weight: { shares: [30, 28, 22, 11, 9], of: 'an electric sports car’s' },
    credit: { title: 'Tesla Roadster, after Tesla’s 2017 prototype', text: 'Proportions from the 2017 prototype’s photographs, and Tesla’s published figures. The layout under the body is generic: Tesla hasn’t published this car’s.' },
    about: {
      door: 'A long frameless door, its window part of it.',
      boot: 'Over the rear boot, behind the rear seats.',
      rear_bumper: 'The rear light bar runs across it.',
      body: 'The shell, the windscreen and the cabin: it lifts off the skateboard of battery, motors and wheels underneath.',
      wheel: (n) => (n[0] === 'f' ? '19-inch, on 245/35 tyres.' : '20-inch, on wide 325/30 tyres that put the rear motors’ torque down.'),
      brake: 'A split-spoke wheel over a ventilated disc and its caliper.',
    },
    callouts: () => [
      { title: 'Front motor', text: 'Drives the front wheels through a single reduction gear; its inverter sits on top.', node: 'drive', position: M(0, 560, zf + 170), explode: 0.6, camera: pose(M(0, 350, zf + 125), [-30, 28], 0.85) },
      { title: 'Rear motors', text: 'One for each rear wheel, so the car can push the outside wheel harder in a bend.', node: 'drive', position: M(190, 580, zr - 170), explode: 0.6, camera: pose(M(0, 350, zr - 125), [-140, 28], 0.85) },
      { title: 'Glass roof', text: 'The targa panel lifts out and stows in the boot.', node: 'roof', position: M(0, 1150, -200), camera: pose(M(0, 1000, -200), [-40, 40], 1.4) },
    ],
    extra: () => [
      {
        label: 'Torque',
        title: 'Pushing each rear wheel',
        text: [
          'With a motor for each rear wheel, there’s no differential: the car can drive the outside wheel harder than the inside one in a bend, steering it with torque as well as the wheel. Tesla called it torque vectoring.',
          'Three motors together give the claimed 10,000 N·m at the wheels (after the gears) and 0 to 60 mph in 1.9 seconds, faster than any production car when it was shown.',
        ],
        angle: [-150, 26],
        fill: 0.8,
        explode: 0.6,
        focus: ['rear_motor_left', 'rear_motor_right', 'rear_motor_left_rotor', 'rear_motor_right_rotor', 'shaft_rl', 'shaft_rr', 'wheel_rl', 'wheel_rr'],
        tags: [
          { node: 'wheel_rl', text: 'Outside wheel: more', at: M(830, 700, zr) },
          { node: 'wheel_rr', text: 'Inside wheel: less', at: M(-830, 700, zr) },
        ],
        try: 'run',
        count: [{ node: 'rear_motor_left_rotor', label: 'Left motor' }, { node: 'rear_motor_right_rotor', label: 'Right motor' }],
      },
    ],
  },
};
const C = CARS[car];
const about = C.about ?? {};

// Doors (and their windows and mirrors) from the spec's panels.
const doorList = (spec.panels.doors ?? [{ name: '' }]).flatMap((d) =>
  ['left', 'right'].map((side) => ({ node: `door${d.name ? `_${d.name}` : ''}_${side}`, side, label: `${side === 'left' ? 'Left' : 'Right'}${d.name ? ` ${d.name}` : ''} ${d.falcon ? 'falcon wing' : 'door'}`, front: !d.name || d.name === 'front', falcon: d.falcon })),
);
const falcon = doorList.some((d) => d.falcon);
/** Where an explode value (a part's window, a step's or a callout's) lands once falcon wings have had 0 to 0.3 to themselves. */
const W = (v) => (falcon ? +(0.3 + 0.7 * v).toFixed(3) : v);
const motorWord = motors.length === 1 ? 'The motor, with its' : `${NUMBER[motors.length]} motors, each with its`;
const parts = [
  ...doorList.map((d) => {
    const s = d.side === 'left' ? 1 : -1;
    // A falcon wing steps out off the body, then rises, as its hinges in the roof would take it.
    if (d.falcon) return { node: d.node, label: d.label, group: 'Body', about: about.falcon ?? 'A falcon-wing door: hinged at the middle of the roof, it takes its part of the roof up with it.', ...P([s, 0, 0], 0.05, [0, 0.3], { then: { direction: [s * 0.3, 1, 0], distance: 0.3 } }) };
    // Beside a falcon wing, a door also leans forward, clear of the wing's edge as they part.
    const lean = doorList.some((o) => o.falcon) ? 0.25 : 0;
    return { node: d.node, label: d.label, group: 'Body', about: about.door ?? (d.front ? 'A door, with its window and the mirror.' : 'A door, with its window.'), ...P([s, 0.15, lean], 0.32, [0, 0.22]) };
  }),
  ...(spec.panels.roof ? [{ node: 'roof', label: 'Glass roof', group: 'Body', about: about.roof ?? 'The targa panel: it lifts out, and stows in the boot.', ...P([0, 1, 0], 0.22, [0.06, 0.24]) }] : []),
  { node: 'bonnet', label: 'Front lid', group: 'Body', about: about.bonnet ?? 'There is no engine under it: just a front boot, the “frunk”.', ...P([0, 1, 0.3], 0.2, [0.08, 0.26]) },
  { node: 'boot', label: 'Boot lid', group: 'Body', about: about.boot ?? 'Over the rear boot.', ...P([0, 1, -0.3], 0.2, [0.08, 0.26]) },
  { node: 'front_bumper', label: 'Front', group: 'Body', about: about.front_bumper ?? 'The nose: headlights at its corners and an opening low down for the air that cools the battery and motors.', ...P([0, 0, 1], 0.22, [0.16, 0.34]) },
  { node: 'rear_bumper', label: 'Tail', group: 'Body', about: about.rear_bumper ?? 'With the rear lights across it.', ...P([0, 0, -1], 0.22, [0.16, 0.34]) },
  { node: 'body', label: 'Body', group: 'Body', about: about.body ?? 'The shell, the glass and the cabin: it lifts off the skateboard of battery, motors and wheels underneath.', ...P([0, 1, 0], 0.36, [0.4, 0.62]) },
  { node: 'battery_pack', label: 'Battery pack', group: 'Skateboard', about: about.battery ?? 'A flat tray in the floor between the axles, full of modules of cells: the heaviest thing in the car, as low down as it can be.', ...P([0, 1, 0], 0, [0, 1]) },
  { node: 'pack_lid', label: 'Pack lid', group: 'Skateboard', about: 'Seals the pack against water and dirt; the car’s floor sits on it.', ...P([0, 1, 0], 0.11, [0.66, 0.84]) },
  { node: 'drive', label: motors.length === 1 ? 'Drive unit' : 'Drive units', group: 'Skateboard', about: `${motorWord} inverter on top and a reduction gear beside it.`, ...P([0, 1, 0], 0, [0, 1]) },
  { node: 'suspension', label: 'Suspension', group: 'Skateboard', about: 'At each corner, two wishbones hold the wheel’s upright and a coil-over damper carries the car.', ...P([0, 1, 0], 0, [0, 1]) },
  ...wheelNames.map((n) => ({ node: `wheel_${n}`, label: `${n[0] === 'f' ? 'Front' : 'Rear'} ${n[1] === 'l' ? 'left' : 'right'} wheel`, group: 'Wheels', about: about.wheel(n), ...P([n[1] === 'l' ? 1 : -1, 0, 0], 0.15, [0.22, 0.38]) })),
];

for (const p of parts) if (falcon && !p.then) p.window = p.window.map(W);

/** Motor turns for each turn of its wheels (the reduction gear), and the words for it. */
const ratio = C.ratio ?? 9;
const times = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][Math.round(ratio)];
const driven = (n) => spec.motors.some((m) => m.axle === (n[0] === 'f' ? 'front' : 'rear'));
const motion = [
  // Rolling forward: a positive turn about +x carries a wheel's top forward.
  ...wheelNames.map((n) => ({ node: `wheel_${n}`, axis: X, pivot: H.wheels[n].axle, speed: 1 })),
  ...wheelNames.filter(driven).map((n) => ({ node: `shaft_${n}`, axis: X, pivot: H.wheels[n].axle, speed: 1, inside: true })),
  ...Object.entries(H.motors).map(([name, at]) => ({ node: `${name}_rotor`, axis: X, pivot: at, speed: ratio, inside: true })),
];

const halfTrack = spec.track[0] / 2;
// The cables leave the pack at its front if a motor is there, else at its back.
const cableDir = spec.motors.some((m) => m.axle === 'front') ? 1 : -1;
const cableEnd = cableDir > 0 ? spec.pack.z[1] : spec.pack.z[0];
const annotations = [
  ...(C.packBehindSeats ? [] : [{ title: 'Battery in the floor', text: 'Thousands of cells in modules, in a flat pack between the axles: the car’s weight sits as low as it can.', node: 'battery_pack', position: M(spec.pack.half - 140, spec.pack.y[1], -300), explode: W(0.6), camera: pose(M(0, 200, 0), [-50, 32], 1.7) }]),
  ...C.callouts(),
  { title: 'High-voltage cables', text: 'Orange by rule: the battery’s direct current, hundreds of volts, to each inverter.', node: 'battery_pack', position: M(0, spec.pack.y[1] + 70, cableEnd + 100 * cableDir), explode: W(0.6), camera: pose(M(0, spec.pack.y[1] + 40, cableEnd + 150 * cableDir), [cableDir > 0 ? -60 : -120, 40], 0.75) },
  { title: 'Wheel and brake', text: about.brake ?? 'A ventilated disc and its caliper behind the wheel, on the upright the suspension holds.', node: 'wheel_fl', position: M(halfTrack + 145, 330, zf), camera: pose(M(halfTrack + 55, 330, zf), [90, 8], 0.75) },
];

// The skateboard's tags: one for the battery and one for each axle's motors.
const byAxle = {};
for (const m of spec.motors) (byAxle[m.axle] ??= []).push(H.motors[m.name]);
const motorTags = Object.entries(byAxle).map(([axle, at]) => ({
  node: 'drive',
  text: `${axle === 'front' ? 'Front' : 'Rear'} motor${at.length > 1 ? 's' : ''}`,
  at: [0, 1, 2].map((i) => r4(i === 0 ? 0 : at.reduce((s, p) => s + p[i], 0) / at.length + (i === 1 ? 230 / MM : 0))),
}));
const allMotorNodes = [...motors, ...motors.map((m) => `${m}_rotor`)];
const mainMotor = motors.includes('front_motor') ? 'front_motor' : motors[0];
const mainWheel = mainMotor.startsWith('rear') ? 'wheel_rl' : 'wheel_fl';
const mainKind = spec.motors.find((m) => m.name === mainMotor)?.kind ?? 'magnet';
const modules = spec.pack.modules[0] * spec.pack.modules[1];
const perModule = C.pack.perModule ?? Math.round((C.pack.kwh * 1000) / modules / C.pack.cellWh);
const moduleKwh = (perModule * C.pack.cellWh) / 1000;
const how = [
  C.first?.() ?? {
    label: 'Skateboard',
    title: 'A battery for a floor',
    text: [
      'Take the body off and an electric car is a skateboard: a flat battery pack filling the floor between the axles, motors at the wheels, and the wheels and their suspension at the corners. Nothing has to sit between the seats or under the bonnet, which is why the front holds a boot instead.',
      'The pack is the car’s heaviest part by far. Low down in the middle, it gives a centre of gravity lower than any engine-driven car’s, which helps it corner flat.',
    ],
    angle: [-40, 26],
    fill: 0.85,
    focus: ['battery_pack', 'modules', 'pack_lid', 'drive', ...allMotorNodes, ...wheelNames.map((n) => `wheel_${n}`), 'suspension'],
    tags: [{ node: 'battery_pack', text: 'Battery', at: M(0, spec.pack.y[1] + 10, 0) }, ...motorTags],
    chart: {
      type: 'bars',
      title: 'Where the weight is',
      caption: `Rough shares of ${C.weight.of} weight: the battery is a quarter or more of it, all in the floor.`,
      unit: '% of the car',
      bars: ['Battery', 'Body', 'Chassis', 'Cabin', 'Motors'].map((label, i) => ({ label, value: C.weight.shares[i] })),
    },
  },
  {
    label: 'Battery',
    title: C.pack.title ?? 'Thousands of cells',
    text: [
      C.pack.lead ?? 'The pack is made of thousands of small cylindrical cells, much like a torch’s batteries, wired together in modules: in series to raise the voltage to hundreds of volts, in parallel to share the current. A battery management system watches every group’s voltage and temperature, and coolant runs between the modules.',
      C.pack.note,
    ],
    angle: [-30, 42],
    fill: 0.8,
    explode: W(0.9),
    focus: ['battery_pack', 'modules', 'hv_cables'],
    tags: [{ node: 'modules', text: C.pack.modulesTag ?? 'Modules of cells', at: M(0, spec.pack.y[1] - 10, (spec.pack.z[0] + spec.pack.z[1]) / 2 + 300 * (spec.pack.z[1] - spec.pack.z[0] > 1500 ? 1 : 0)) }],
    chart: {
      type: 'ladder',
      title: 'From cell to car',
      caption: C.pack.cells ? 'One step: the cells straight into the pack.' : 'Each step multiplies: cells into modules, modules into the pack.',
      unit: 'Energy, kWh',
      scale: 'log',
      // Straight from cell to pack when the cells aren't grouped in modules worth counting.
      rungs: C.pack.cells
        ? [
            { name: 'One cell', value: C.pack.cellWh / 1000, note: `${C.pack.cellWh} Wh` },
            { name: 'The pack', value: C.pack.kwh, step: `×${C.pack.cells.toLocaleString('en-GB')}`, note: `${C.pack.kwh} kWh` },
          ]
        : [
            { name: 'One cell', value: C.pack.cellWh / 1000, note: `${C.pack.cellWh} Wh` },
            { name: C.pack.moduleName ?? 'A module', value: +moduleKwh.toFixed(2), step: `×${perModule.toLocaleString('en-GB')}`, note: `${moduleKwh < 10 ? moduleKwh.toFixed(1) : Math.round(moduleKwh)} kWh` },
            { name: 'The pack', value: C.pack.kwh, step: `×${modules}`, note: `${C.pack.kwh} kWh` },
          ],
    },
  },
  {
    label: 'Motors',
    title: motors.length === 1 ? 'A motor and one gear' : `${NUMBER[motors.length]} motors, one gear each`,
    text: [
      'Each motor is a stator, a ring of copper windings, around a rotor on the shaft. The inverter on top turns the battery’s direct current into three-phase alternating current, and the faster it alternates, the faster the rotor turns: there are no gears to change, from a standstill to full speed.',
      `The motor turns much faster than the wheels, so a single reduction gear slows it by about ${times} times and multiplies its torque as much. Hold Drive and count: ${times} turns of a motor for one of its wheels.`,
    ],
    angle: [-60, 22],
    fill: 0.8,
    explode: W(0.6),
    focus: [...allMotorNodes, ...wheelNames.filter(driven).map((n) => `shaft_${n}`), ...wheelNames.map((n) => `wheel_${n}`)],
    frame: [...motors],
    try: 'run',
    count: [{ node: `${mainMotor}_rotor`, label: 'Motor' }, { node: mainWheel, label: 'Wheel' }],
    chart: {
      type: 'motor-field',
      title: mainKind === 'induction' ? 'An induction motor, end-on' : 'A magnet motor, end-on',
      caption:
        mainKind === 'induction'
          ? `The three currents rise and fall in turn (red one way, black the other), so their field goes round; it drags the rotor after it, always a little slower, and that slip is what makes current flow in the rotor’s bars. Slowed ${times} times.`
          : `The three currents rise and fall in turn (red one way, black the other), so their field goes round; the rotor’s magnet follows it, just behind. Slowed ${times} times.`,
      node: `${mainMotor}_rotor`,
      kind: mainKind,
      slow: ratio,
    },
  },
  ...C.extra(),
];

const thing = {
  order: C.order,
  title: C.title,
  hook: C.hook,
  category: 'cars',
  summary: C.summary,
  model: `models/${C.slug}.glb`,
  viewAngle: C.viewAngle,
  explodeAngle: C.explodeAngle,
  explodeDuration: 1800,
  motionLabel: 'Drive',
  facts: C.facts,
  parts,
  annotations,
  motion,
  how,
  credit: {
    title: C.credit.title,
    author: '3D of Things',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    source: 'built in code for this site',
    sourceUrl: '',
    extra: { label: 'Sources', text: C.credit.text },
  },
  build: { generate: 'objects/tesla-roadster/2017/generate.mjs', car },
};
writeContent(C.slug, thing);
