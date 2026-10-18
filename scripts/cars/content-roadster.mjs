// The content file for the 2026 Roadster (a spec with `aero`): its text, its parts and how they come off, its
// motions (the wheels and motors; the fans, skirts and wing on the suction system's controls), where its ten nozzles
// are and which way their jets go, its callouts and its "How it works". Called by content.mjs, which runs the build
// for the hints. The numbers in the text come from src/viewer/aerocar.ts, which the viewer and the charts run on.
export function roadsterContent({ car, spec, H }) {
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
  const A = H.aero;
  const X = [1, 0, 0];
  const zr = -spec.wheelbase / 2;
  const wheelNames = ['fl', 'fr', 'rl', 'rr'];
  const nozzles = (group) => A.thrusters.filter((t) => t.group === group).map((t) => t.node);
  const [rear, lift, yaw] = [nozzles('rear'), nozzles('down'), nozzles('yaw')];
  const fans = A.fans.map((f) => f.node);
  const tanks = A.tanks.map((t) => t.node);
  const skirts = ['skirt_left', 'skirt_right', 'skirt_front', 'skirt_rear'];
  const litres = A.tanks.reduce((s, t) => s + t.litres, 0);

  const parts = [
    ...['left', 'right'].map((side) => ({ node: `door_${side}`, label: `${side === 'left' ? 'Left' : 'Right'} door`, group: 'Body', about: 'A scissor door: hinged at its front edge, it swings up.', ...P([side === 'left' ? 1 : -1, 0.15, 0], 0.32, [0, 0.22]) })),
    { node: 'bonnet', label: 'Front lid', group: 'Body', about: 'Over the front boot, where the compressor that fills the air tanks is.', ...P([0, 1, 0.3], 0.2, [0.08, 0.26]) },
    { node: 'boot', label: 'Rear wing', group: 'Body', about: 'The deck behind the glass is the wing: in track mode it rises on two struts and tilts, its front edge down, to press the tail down at speed.', ...P([0, 1, 0], 0.2, [0.08, 0.26]) },
    { node: 'front_bumper', label: 'Nose', group: 'Body', about: 'The light bar across it, an intake underneath, and in its sides the two yaw nozzles.', ...P([0, 0, 1], 0.22, [0.16, 0.34]) },
    { node: 'rear_bumper', label: 'Tail', group: 'Body', about: 'The light bar across it, and the opening where the fans blow out and the rear nozzles fire.', ...P([0, 0, -1], 0.22, [0.16, 0.34]) },
    { node: 'body', label: 'Body', group: 'Body', about: 'The shell, the gold-tinted glass and the cabin: it lifts off the battery, the fans, the air tanks and the nozzles underneath.', ...P([0, 1, 0], 0.36, [0.4, 0.62]) },
    { node: 'fan_box', label: 'Suction fans', group: 'Suction', about: 'Four electric fans of about 20 kW each, in the tail. A duct from an inlet in the floor between the rear wheels feeds them the air from under the car, and they blow it out of the back.', ...P([0, 0, -1], 0.1, [0.66, 0.84]) },
    { node: 'skirts', label: 'Skirts', group: 'Suction', about: 'Carbon blades round the sealed floor. When the fans run they drop to just above the road, so air can only seep in under their edges.', ...P([0, 1, 0], 0, [0, 1]) },
    { node: 'air_tanks', label: 'Air tanks', group: 'Air', about: `Carbon-wound tanks, about ${Math.round(litres / 10) * 10} litres in all at 690 bar (10,000 psi): one across the car behind the seat, one in the passenger’s place.`, ...P([0, 1, 0], 0.1, [0.66, 0.84]) },
    { node: 'compressor', label: 'Compressor', group: 'Air', about: 'An electric pump that fills the tanks from the battery. Tesla says six or seven hours for now, and wants it down to half an hour.', ...P([0, 1, 0], 0.12, [0.66, 0.84]) },
    { node: 'air_lines', label: 'Valves and lines', group: 'Air', about: 'Lines from the tanks to a valve block on the main tank’s back, and out to every nozzle; each nozzle has its own fast electric valve.', ...P([0, 1, 0], 0, [0, 1]) },
    { node: rear[0], label: 'Rear thrusters', group: 'Air', about: 'Four nozzles in the tail, about 80 kN between them: four or five times the push the tyres can give.', with: rear.slice(1), ...P([0, 1, 0], 0, [0, 1]) },
    { node: lift[0], label: 'Lift thrusters', group: 'Air', about: 'One at each corner, blowing straight down: together they can lift the car off the ground.', with: lift.slice(1), ...P([0, 1, 0], 0, [0, 1]) },
    { node: yaw[0], label: 'Yaw thrusters', group: 'Air', about: 'One in each side of the nose: they turn the car about its middle, in the air or on the ground.', with: yaw.slice(1), ...P([0, 1, 0], 0, [0, 1]) },
    { node: 'battery_pack', label: 'Battery pack', group: 'Skateboard', about: 'A thick tray of 4680 cells in the floor, at 800 to 1,000 volts; the seat sits on it.', ...P([0, 1, 0], 0, [0, 1]) },
    { node: 'pack_lid', label: 'Pack lid', group: 'Skateboard', about: 'Seals the pack; the cabin floor, the seat and the passenger’s tank sit on it.', ...P([0, 1, 0], 0, [0, 1]) },
    { node: 'drive', label: 'Rear motors', group: 'Skateboard', about: 'A motor for each rear wheel, each with its inverter on top and a reduction gear beside it. Over a megawatt between them, Tesla says.', ...P([0, 1, 0], 0, [0, 1]) },
    { node: 'suspension', label: 'Suspension', group: 'Skateboard', about: 'Double wishbones and a coil-over at each corner; the front wheels are steered by wire, from a yoke.', ...P([0, 1, 0], 0, [0, 1]) },
    ...wheelNames.map((n) => ({ node: `wheel_${n}`, label: `${n[0] === 'f' ? 'Front' : 'Rear'} ${n[1] === 'l' ? 'left' : 'right'} wheel`, group: 'Wheels', about: n[0] === 'f' ? '20-inch, on 255/30 tyres.' : '21-inch, on wide 325/30 tyres.', ...P([n[1] === 'l' ? 1 : -1, 0, 0], 0.15, [0.22, 0.38]) })),
  ];

  // The wheels and the motors; the fans turn by their control, the skirts slide down and the wing rises and tilts by theirs.
  const ratio = 9;
  const fanAxis = [0, 0, 1];
  const motion = [
    ...wheelNames.map((n) => ({ node: `wheel_${n}`, axis: X, pivot: H.wheels[n].axle, speed: 1 })),
    ...['rl', 'rr'].map((n) => ({ node: `shaft_${n}`, axis: X, pivot: H.wheels[n].axle, speed: 1, inside: true })),
    ...Object.entries(H.motors).map(([name, at]) => ({ node: `${name}_rotor`, axis: X, pivot: at, speed: ratio, inside: true })),
    ...A.fans.map((f) => ({ node: f.node, axis: fanAxis, pivot: f.axle, control: 'fan', turn: 1 })),
    { node: 'skirts', axis: X, control: 'skirts', slide: [0, -A.skirts.drop, 0] },
    { node: 'boot', axis: X, control: 'wing', slide: [0, A.wing.rise, 0] },
    { node: 'boot', axis: X, pivot: A.wing.pivot, control: 'wing', turn: r4(-A.wing.pitch / 360) },
  ];

  // Where each nozzle's jet comes out and which way it goes: the lift ones front left, front right, rear left, rear right.
  const jets = A.thrusters.map((t) => ({ node: t.node, at: t.exit, dir: t.jet, group: t.group === 'down' ? 'lift' : t.group }));

  const annotations = [
    { title: 'Suction fans', text: 'Four fans pull the air out from under the floor and blow it out of the back.', node: 'fan_box', position: M(155, 275, -1990), camera: pose(M(0, 300, -1900), [180, 12], 1.0) },
    { title: 'Skirts', text: 'They drop to just above the road while the fans run, to seal the floor.', node: 'skirts', position: M(776, 140, 0), camera: pose(M(600, 200, 0), [80, 6], 1.1) },
    { title: 'Air tanks', text: `About ${Math.round(litres / 10) * 10} litres of air at 690 bar, in carbon-wound tanks.`, node: 'air_tanks', position: M(-350, 885, 170), explode: 0.64, camera: pose(M(-100, 650, -250), [-72, 10], 1.45) },
    { title: 'Rear thrusters', text: 'Four nozzles, about 80 kN together.', node: rear[1], position: M(-135, 520, -2030), camera: pose(M(0, 450, -1950), [160, 10], 0.9) },
    { title: 'Lift thrusters', text: 'One at each corner, blowing down.', node: lift[0], position: M(700, 120, 1900), camera: pose(M(600, 250, 1800), [40, 4], 1.0) },
    { title: 'Yaw thrusters', text: 'In the sides of the nose: they turn the car.', node: yaw[0], position: M(870, 300, 2020), camera: pose(M(700, 320, 1900), [70, 8], 0.9) },
    { title: 'Compressor', text: 'Fills the tanks from the battery.', node: 'compressor', position: M(0, 560, 1880), explode: 0.3, camera: pose(M(0, 350, 1800), [-25, 40], 0.9) },
    { title: 'Rear wing', text: 'Hidden in the deck; it rises in track mode.', node: 'boot', position: M(0, 880, -1900), camera: pose(M(0, 800, -1700), [-150, 26], 1.2) },
  ];

  // Paths the air takes, model space: in under the skirts, along the floor, up the duct, through the fans and out.
  const D = A.duct;
  const suctionFlows = [
    [M(980, 40, 400), M(760, 60, 300), M(400, 70, -300), { node: 'fan_box', at: D.inlet }, { node: 'fan_box', at: M(0, 200, -1300) }, { node: 'fan_box', at: D.up }, { node: 'fan_box', at: M(155, 275, -1900) }, M(155, 275, -2400)],
    [M(-980, 40, 700), M(-760, 60, 600), M(-400, 70, -100), { node: 'fan_box', at: M(-200, 110, -950) }, { node: 'fan_box', at: M(-250, 200, -1350) }, { node: 'fan_box', at: M(-400, 330, -1720) }, { node: 'fan_box', at: M(-465, 275, -1900) }, M(-465, 275, -2400)],
  ];
  const T = A.tanks;
  const tankFlow = [{ node: 'compressor', at: A.compressor }, { node: 'air_lines', at: M(-200, 220, 1200) }, { node: 'air_lines', at: M(-320, 430, 900) }, { node: T[1].node, at: T[1].centre }, { node: T[0].node, at: M(-340, 690, -830) }, { node: T[0].node, at: T[0].centre }];
  const thrustFlows = [rear[1], rear[2]].map((n) => {
    const t = A.thrusters.find((h) => h.node === n);
    return [{ node: T[0].node, at: T[0].centre }, { node: 'air_lines', at: A.manifold }, { node: 'air_lines', at: M(0, 640, -1650) }, { node: n, at: t.inlet }, { node: n, at: t.exit }, M(t.exit[0] * MM, 520, -2600)];
  });
  const allThrusters = [...rear, ...lift, ...yaw];
  const motors = Object.keys(H.motors);

  const how = [
    {
      label: 'Inside',
      title: 'Fans, air and a battery',
      text: [
        'Under the gold glass the new Roadster is three systems. A battery of 4680 cells fills the floor and drives two motors at the back, one for each rear wheel. In the tail, four electric fans pull the air out from under the car’s sealed floor. And about 600 litres of air, squeezed to 690 bar in carbon tanks behind the seat and in the passenger’s place, feeds ten nozzles round the car.',
        'The fans hold it down; the air pushes it along, or (on the Rocket, shown here) lifts it off the ground. The two work against each other, so the rest of the tour takes them one at a time.',
      ],
      angle: [-55, 32],
      fill: 0.88,
      // The car stands still in this step (and in the suction, air and flight steps): its wheels don't turn.
      rate: 0,
      focus: ['battery_pack', 'modules', 'drive', ...motors, ...motors.map((m) => `${m}_rotor`), 'fan_box', ...fans, 'skirts', ...skirts, 'air_tanks', ...tanks, 'compressor', 'air_lines', ...allThrusters],
      tags: [
        { node: 'battery_pack', text: 'Battery', at: M(300, 340, 300) },
        { node: 'drive', text: 'Rear motors', at: M(-320, 700, zr) },
        { node: 'fan_box', text: 'Fans', at: M(-560, 300, -2000) },
        { node: tanks[1], text: 'Air tanks', at: M(-350, 900, 300) },
        { node: 'compressor', text: 'Compressor', at: M(0, 520, 1880) },
        { node: lift[0], text: 'Lift nozzles', at: M(700, 500, 1900) },
      ],
      chart: {
        type: 'bars',
        title: 'Nought to 60 mph, as claimed',
        caption: 'Tesla’s figures. The fans’ grip takes the Performance to 1.6 s with no thrusters; the air takes off as much again.',
        unit: 'seconds',
        bars: [
          { label: '2017 claim', value: 1.9 },
          { label: 'Performance', value: 1.6 },
          { label: 'Thrust', value: 0.9 },
          { label: 'Rocket', value: 0.59 },
        ],
      },
    },
    {
      label: 'Motors',
      title: 'Two motors, one for each rear wheel',
      text: [
        'Each motor is a ring of copper windings round a magnet rotor. The inverter on top turns the battery’s direct current into three-phase alternating current, and the faster it alternates, the faster the rotor turns. A reduction gear slows it about nine times for its wheel, and multiplies its torque as much.',
        'With a motor for each rear wheel, the car can push the outside wheel harder in a bend; the front wheels are steered by wire, from a yoke. Hold Drive and count: nine turns of a motor for one of its wheels.',
      ],
      angle: [-140, 24],
      fill: 0.8,
      focus: [...motors, ...motors.map((m) => `${m}_rotor`), 'shaft_rl', 'shaft_rr', 'wheel_rl', 'wheel_rr'],
      frame: [...motors, 'wheel_rl', 'wheel_rr'],
      try: 'run',
      count: [{ node: `${motors[0]}_rotor`, label: 'Motor' }, { node: 'wheel_rl', label: 'Wheel' }],
      chart: { type: 'motor-field', title: 'A magnet motor, end-on', caption: 'The three currents rise and fall in turn (red one way, black the other), so their field goes round; the rotor’s magnet follows it, just behind. Slowed nine times.', node: `${motors[0]}_rotor`, kind: 'magnet', slow: ratio },
    },
    {
      label: 'Suction',
      title: 'Sucked onto the road',
      text: [
        'The air presses on everything, about ten tonnes on every square metre. Under a parked car it pushes up as hard as it presses down on top. The Roadster’s fans pull the air out from under its floor faster than it can leak back in, so the pressure there drops, and the air on top wins.',
        'It takes very little: 6 kPa less underneath, a sixteenth of the air’s pressure, over 3 m² of floor is two tonnes of downforce, more than the car weighs, moving or not. The skirts drop to the road so air can only seep in under their edges; the fans’ 80 kW mostly pumps that leak away.',
      ],
      angle: [-125, 10],
      fill: 0.82,
      rate: 0,
      focus: ['fan_box', ...fans, 'skirts', ...skirts, 'battery_pack', 'wheel_rl', 'wheel_rr', 'wheel_fl', 'wheel_fr'],
      flows: suctionFlows,
      carries: 'air',
      tags: [
        { node: 'battery_pack', text: 'Low pressure under the floor', at: M(0, 60, -200) },
        { node: 'skirt_left', text: 'Skirt', ride: false, at: M(776, 120, 500) },
        { node: 'fan_box', text: 'Air out', at: M(0, 300, -2150) },
      ],
      chart: { type: 'suction', title: 'Pressure above and below', caption: 'The air presses down on top and up underneath; with the fans running there’s less underneath, and the difference holds the car down. Switch them on and watch.' },
      try: 'suction',
    },
    {
      label: 'Grip',
      title: 'Downforce without speed',
      text: [
        'A racing car’s wings make downforce from the air rushing past, so it grows with the square of the speed: at a crawl there’s next to none. The fans’ pull is the same standing still as at 300 km/h. That’s how the Roadster drove up a ramp that curled over until it was upside down.',
        'Pressed down harder, the tyres can push sideways harder before they slide: Tesla quotes over 2 g in a bend, against 1.26 g on the tyres alone (not quite double, as a tyre grips a little less for each extra kilo). In track mode a wing rises out of the deck.',
      ],
      angle: [-150, 20],
      fill: 0.85,
      focus: ['boot', 'fan_box', ...fans, 'skirts', ...skirts, 'wheel_rl', 'wheel_rr', 'wheel_fl', 'wheel_fr'],
      chart: { type: 'downforce', title: 'Downforce and speed', caption: 'The fans’ pull is the same at any speed; the body’s and the wing’s grows with speed squared. Above the dashed line, the car could drive upside down.' },
      try: 'grip',
    },
    {
      label: 'Air',
      title: 'Air at 690 bar',
      text: [
        'The thrusters burn nothing: they run on air. A compressor in the front boot pumps it, on power from the battery, into the tanks until it’s at 690 bar (10,000 psi), as high as a hydrogen car’s tank and three times a diver’s. Air that squeezed is half as dense as water: 600 litres of it weigh about 320 kg, four people’s worth.',
        'The tanks are carbon fibre wound over a thin liner, as SpaceX’s rockets’ are: strong enough for the pressure and far lighter than steel. Filling them takes six or seven hours today; Tesla wants it down to half an hour.',
      ],
      angle: [-35, 38],
      fill: 0.82,
      rate: 0,
      focus: ['air_tanks', ...tanks, 'compressor', 'air_lines'],
      flow: tankFlow,
      carries: 'air',
      tags: [
        { node: tanks[0], text: 'Behind the seat', at: M(400, 1040, -830) },
        { node: tanks[1], text: 'In the passenger’s place', at: M(-340, 880, 300) },
        { node: 'compressor', text: 'Compressor', at: M(0, 520, 1880) },
      ],
      chart: {
        type: 'ladder',
        title: 'How hard the air is squeezed',
        caption: 'Pressure in bar, on a scale where each line is ten times the last: the Roadster’s tanks hold air at nearly three hundred times a car tyre’s pressure.',
        unit: 'bar',
        scale: 'log',
        rungs: [
          { name: 'Car tyre', value: 2.4, note: '2.4 bar' },
          { name: 'Diver’s tank', value: 230, note: '230 bar' },
          { name: 'Hydrogen car', value: 700, note: '700 bar' },
          { name: 'Roadster', value: 690, note: '690 bar' },
        ],
      },
    },
    {
      label: 'Thrusters',
      title: 'A rocket without fire',
      text: [
        'Open a valve and the air rushes out through a nozzle shaped like a rocket engine’s. It narrows to a throat, where the air reaches the speed of sound, then widens, and the air speeds up to twice that as its pressure falls to the air’s outside. Throwing air backwards pushes the car forwards, as a balloon flies off when you let it go. The jet leaves at about −200 °C: its white cloud is the moisture round it freezing.',
        'The four rear nozzles push with about 80 kN, four or five times what the tyres can, and need no grip to do it: 0 to 60 mph in under 0.59 s, Tesla says. At full blast the air lasts about a second and a half.',
      ],
      camera: pose(M(0, 480, -2650), [-150, 12], 2.3),
      focus: [...rear, 'air_lines', 'air_tanks', ...tanks, 'fan_box'],
      frame: [...rear, tanks[0]],
      flows: thrustFlows,
      carries: 'air',
      chart: { type: 'nozzle', title: 'Through a nozzle', caption: 'The air’s speed (and its pressure) from the valve to the open air: below the speed of sound until the throat, above it after. Fire, and watch the air go through.' },
      try: 'thrust',
    },
    {
      label: 'Flight',
      title: 'Lifting off',
      text: [
        'Downforce and flight pull opposite ways, so before a jump the fans stop and the skirts tuck up. Then the four lift nozzles, one at each corner, blow straight down. When their push is more than the car weighs, it climbs; equal to it, it hovers. Like a drone, it stays level because a computer trims each valve many times a second; the two nozzles in the nose turn it.',
        'Hovering takes about 20 kN, some 30 kg of air a second, so the tanks last seconds: a jump, not a journey. At the launch it jumped over five other Teslas, then 27 feet up with a barrel roll; the hops here are smaller, worked out from the same numbers.',
      ],
      camera: pose(M(-250, 1600, -700), [-58, 9], 5.4),
      rate: 0,
      chart: { type: 'flight', title: 'Thrust and weight', caption: 'The lift nozzles’ push (red) against the car’s weight (dashed): above it the car climbs, on it it hovers, below it it falls; a hard push catches it before it lands.' },
      try: 'fly',
    },
  ];

  return {
    slug: 'tesla-roadster',
    order: 9,
    title: 'Tesla Roadster',
    hook: 'Fans that suck it onto the road and air thrusters that make it fly: the Roadster Tesla showed in 2026.',
    category: 'cars',
    summary: [
      'Tesla showed its new Roadster on 15 October 2026, nine years after the first prototype, in three trims: the Performance, with fans that suck it onto the road; the Thrust, which adds cold-gas thrusters at the back; and the Rocket, shown here, with ten thrusters round it and a tank where the passenger would sit. It flies, for a few seconds at a time, and isn’t allowed on public roads.',
      'Under the tail, four electric fans pull the air out from under the sealed floor, so the air above presses the car down even when it’s standing still: enough, Tesla says, to drive upside down. And it carries about 600 litres of air squeezed to 690 bar; let out through nozzles like a rocket’s, it shoves the car forward, or lifts it off the ground.',
      'The figures are Tesla’s claims (0 to 60 mph in under 0.59 seconds for the Rocket, over 230 mph); production is planned for 2028. This model was built in code from the launch’s photographs. Tesla hasn’t published drawings of its insides, so the fans, tanks and nozzles are laid out from its descriptions and its fan-car patent, not from the real parts.',
    ],
    model: 'models/tesla-roadster.glb',
    viewAngle: [-40, 14],
    explodeAngle: [-48, 26],
    explodeDuration: 1800,
    motionLabel: 'Drive',
    facts: [
      { label: 'Shown', value: '15 October 2026' },
      { label: 'Trim', value: 'Rocket (one seat, not road-legal)' },
      { label: 'Suction', value: 'Four fans, about 80 kW' },
      { label: 'Air', value: 'About 600 litres at 690 bar' },
      { label: 'Thrusters', value: 'Ten: four rear, four lift, two yaw' },
      { label: '0–60 mph', value: 'Under 0.59 s (claimed)' },
      { label: 'Production', value: '2028 (planned)' },
    ],
    parts,
    annotations,
    motion,
    jets,
    how,
    credit: {
      title: 'Tesla Roadster (2026), after Tesla’s launch photographs',
      author: '3D of Things',
      license: 'CC0 1.0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      source: 'built in code for this site',
      sourceUrl: '',
      extra: { label: 'Sources', text: 'Proportions from Tesla’s launch photographs (October 2026); the suction system after Tesla’s “Electric Fan Car” patent (US 12,746,987); figures from Tesla, Electrek and The EV Report. The layout of the tanks, lines and nozzles is this model’s.' },
    },
    build: { generate: 'scripts/cars/generate.mjs', car },
  };
}
