// Writes content/cassette-player.json from the page's text and where the build put things
// (objects/cassette-player/hints.json), so no model-space number is pasted by hand. Run it after every build:
//   node objects/cassette-player/content.mjs
//
// Every speed on the page comes from the hints (augment.mjs works them out from the truth sheet's numbers), and the
// charts' figures from the same formulas, below.
import { polyHaven, pose, readHints, space, writeContent } from '../../scripts/kit/content.mjs';

const H = readHints('cassette-player');
const { U } = space(H);
const at = (name) => H?.anchors?.[name] ?? (H ? missing(name) : [0, 0.5, 0]);
const pivot = (name) => H?.pivots?.[name] ?? (H ? missing(name) : [0, 0.5, 0]);
const S = H?.speeds ?? { motor: 40, capstan: 7.58, pinch: -1.68, clutch: 1, takeup: -0.49, supply: -0.34 };
const N = H?.numbers ?? { capstanRpm: 455, beltRatio: 5.28, takeupR: 15.6, supplyR: 22.1, flywheelD: 23.7, motorPulleyD: 4 };
const off = (direction, mm, window, extra = {}) => ({ direction, distance: U(mm), window, ...extra });
const up = (p, mm) => [p[0], p[1], +(p[2] + U(mm)).toFixed(4)];
const rpm = (turns) => Math.round(Math.abs(turns) * 60);
const Z = [0, 0, 1];

// The reels through one side of a C60 (truth sheet, section 4): hub radius 11 mm, 1530 mm² of tape.
const V = 47.625;
const pack = (f) => Math.sqrt(121 + (f * 1530) / Math.PI);
const reelRpm = (r) => +((V / (2 * Math.PI * r)) * 60).toFixed(1);
const side = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ f, takeup: reelRpm(pack(f)), supply: reelRpm(pack(1 - f)) }));
// Wavelength on the tape (µm) for a note of f hertz.
const wave = (f) => +((V / f) * 1000).toFixed(1);

// Explode states the tour and callouts use: lid and back cover off; the front case off too, the cassette still playing;
// the cassette lifted out; the cassette opened.
const OPEN = 0.15;
const FRONT_OFF = 0.29;
const LIFTED = 0.53;
const INSIDE = 0.67;
const CASSETTE_LIFT = 70;
const lifted = (p) => up(p, CASSETTE_LIFT);

writeContent('cassette-player', {
  order: 14,
  title: 'Personal Cassette Player',
  hook: 'A 2 mm steel pin pulls the tape past the head at 4.76 cm/s; the reels only keep it taut.',
  category: 'sound',
  summary: [
    'A cassette player has to drag a narrow tape past its head at exactly 4.76 centimetres a second, or the music goes sharp or flat, and a pocket player must do it on two AA cells while being carried about. It does it by squeezing the tape between a steel pin turning at a steady speed and a rubber roller: the tape can only move as fast as the pin’s surface.',
    'The cells drive a small motor, which a rubber belt connects to a brass flywheel; the flywheel’s shaft is the capstan, and a spring presses the pinch roller against it with the tape between. A second belt turns the take-up spindle through a felt slip clutch, which only keeps the tape taut. Inside the cassette, a felt pad presses the tape against the playback head.',
    'So the capstan sets the speed and the reels follow: as the take-up reel fills, it slows down, from 41 to 18 turns a minute over one side. On this model everything turns at its real speed for a C60 a quarter of the way through side A, and the radio on the front panel is left as modelled.',
  ],
  model: 'models/cassette-player.glb',
  viewAngle: [-28, 14],
  explodeAngle: [-64, 16],
  explodeDuration: 3000,
  facts: [
    { label: 'Tape speed', value: '4.76 cm/s, set by the capstan' },
    { label: 'Capstan', value: `2 mm across, ${Math.round(N.capstanRpm)} turns a minute` },
    { label: 'Take-up reel', value: 'slows from 41 to 18 rpm over a side' },
    { label: 'Power', value: 'two AA cells, a 2,400 rpm motor' },
    { label: 'Real size', value: '10 × 13 × 4 cm' },
  ],
  parts: [
    { node: 'lid', label: 'Lid', group: 'Case', about: 'The cassette door, with a window onto the reels. Shut, it holds the cassette down over the spindles and the capstan.', ...off(Z, 35, [0, 0.12], { then: { direction: [1, 0, 0], distance: U(75) } }) },
    { node: 'back_cover', label: 'Back cover', group: 'Case', about: 'The back half of the case. The bulge in the middle holds the two AA cells.', ...off([0, 0, -1], 55, [0.02, 0.14]) },
    { node: 'front_case', label: 'Front case', group: 'Case', about: 'The front half: the cassette well, the keys on top and, on the left, the AM/FM radio’s dial, band switch and tuning wheel.', ...off(Z, 45, [0.16, 0.28]) },
    { node: 'deck', label: 'Deck', group: 'Case', about: 'A steel plate that holds the transport in line: the capstan’s bearing, the spindles, the head and the pinch roller’s post.', direction: Z, distance: 0 },
    { node: 'batteries', label: 'Batteries', group: 'Power', about: 'Two AA cells in series: 3 volts for the motor, the amplifier and the radio.', ...off([0, 0, -1], 40, [0.7, 0.82]) },
    { node: 'motor', label: 'Motor', group: 'Power', about: `A small DC motor whose electronic governor holds it at about 2,400 turns a minute. Its ${N.motorPulleyD} mm pulley drives the belt.`, ...off([0, 0, -1], 32, [0.72, 0.84]) },
    { node: 'belts', label: 'Belts', group: 'Power', about: `Thin rubber belts: one from the motor to the flywheel, slowing it ${N.beltRatio} times; one, crossed so the clutch turns the other way, from the capstan’s shaft to the take-up clutch.`, ...off([0, 0, -1], 22, [0.76, 0.88]) },
    { node: 'flywheel', label: 'Flywheel and capstan', group: 'Capstan', about: `A ${N.flywheelD} mm brass flywheel on a 2 mm steel shaft. The shaft is the capstan: at ${Math.round(N.capstanRpm)} turns a minute its surface moves at exactly 4.76 cm/s.`, ...off([0, 0, -1], 10, [0.88, 0.95]) },
    { node: 'pinch_roller', label: 'Pinch roller', group: 'Capstan', about: 'A 9 mm rubber roller on a sprung arm. It squeezes the tape against the capstan, so the tape can’t slip: it turns only because the tape does.', ...off([-0.7, 0.71, 0], 3.3, [0.3, 0.38]) },
    { node: 'clutch', label: 'Slip clutch', group: 'Take-up', about: 'The take-up belt’s big pulley and a felt ring. It turns once a second, faster than the reel ever needs, and slips on the felt.', ...off([0, 0, -1], 12, [0.9, 0.97]) },
    { node: 'takeup_spindle', label: 'Take-up spindle', group: 'Take-up', about: 'Sits on the clutch’s felt and turns the take-up reel. The drag of the felt, 18 to 30 gram-centimetres, keeps the tape taut.', ...off(Z, 22, [0.9, 1]) },
    { node: 'supply_spindle', label: 'Supply spindle', group: 'Take-up', about: 'Turns freely under the supply reel, which the tape pulls round against a light drag.', ...off(Z, 22, [0.9, 1]) },
    { node: 'cassette_back', label: 'Cassette', group: 'Cassette', about: 'A Philips compact cassette: two reels of tape 3.81 mm wide in a shell 10 cm long. This is its back half, with the corner guide rollers.', ...off(Z, CASSETTE_LIFT, [0.4, 0.52]) },
    { node: 'cassette_front', label: 'Cassette front', group: 'Cassette', about: 'The front half of the shell, with side A’s label. The two halves are screwed together.', ...off(Z, 10, [0.54, 0.66], { then: { direction: [1, 0, 0], distance: U(62) } }) },
    { node: 'supply_reel', label: 'Supply reel', group: 'Cassette', about: `The full reel at the start of a side. A quarter of the way through a C60 its pack is ${Math.round(N.supplyR * 2)} mm across and turns ${rpm(S.supply)} times a minute.`, ...off(Z, 10, [0.68, 0.78]) },
    { node: 'takeup_reel', label: 'Take-up reel', group: 'Cassette', about: `Winds up what the capstan delivers. Its pack is ${Math.round(N.takeupR * 2)} mm across here and turns ${rpm(S.takeup)} times a minute, slowing as it grows.`, ...off(Z, 10, [0.68, 0.78]) },
    { node: 'tape', label: 'Tape', group: 'Cassette', about: 'Plastic film 3.81 mm wide and 17 µm thick (drawn thicker here), coated with iron oxide. Side A’s two tracks are on one half of it.', direction: Z, distance: 0 },
    { node: 'pressure_pad', label: 'Pressure pad', group: 'Cassette', about: 'Felt on a bronze leaf spring, inside the cassette. It presses the tape onto the head with 0.1 to 0.2 newtons.', ...off(Z, 8, [0.68, 0.78]) },
    { node: 'head', label: 'Playback head', group: 'Sound', about: 'Two tiny electromagnets with a gap about a micron wide. The magnetised tape passing the gap makes a voltage in their coils: the music, for the amplifier.', ...off([-1, 0, 0], 3, [0.3, 0.38]) },
  ],
  annotations: [
    { title: 'Batteries', text: 'Two AA cells give 3 volts: power for the motor, the amplifier and the radio.', node: 'batteries', position: at('cells'), explode: OPEN, camera: pose(at('cells'), [-118, 22], 2.3) },
    { title: 'Motor', text: 'An electronic governor holds the motor at about 2,400 turns a minute whatever the cells’ voltage, so the pitch doesn’t sag as they run down.', node: 'motor', position: at('motor'), explode: OPEN, camera: pose(at('motor'), [-120, 18], 2.1) },
    { title: 'Belt and flywheel', text: `The belt slows the motor ${N.beltRatio} times. The flywheel’s weight carries it through the motor’s small jerks: without it, music wobbles in pitch.`, node: 'flywheel', position: at('flywheel'), explode: OPEN, camera: pose(at('flywheel_face'), [-125, 14], 2.0) },
    { title: 'Capstan', text: `This 2 mm pin sets the tape’s speed, not the reels. It turns ${Math.round(N.capstanRpm)} times a minute, and each turn moves 6.3 mm of tape: 4.76 cm a second.`, node: 'flywheel', position: at('capstan_low'), explode: LIFTED, camera: pose(at('capstan_low'), [-25, 62], 1.9) },
    { title: 'Pinch roller', text: 'A spring presses the rubber roller against the capstan with the tape in between, so the tape can’t slip and moves exactly as fast as the capstan’s surface.', node: 'pinch_roller', position: at('pinch'), explode: FRONT_OFF, camera: pose(at('pinch'), [-60, 30], 2.0) },
    { title: 'Slip clutch', text: 'The take-up drive turns faster than the reel ever needs and slips on felt. The felt’s drag only keeps the tape taut; the capstan decides how much there is to wind.', node: 'clutch', position: at('clutch'), explode: OPEN, camera: pose(at('clutch'), [-128, 18], 2.0) },
    { title: 'Pressure pad', text: 'Inside the cassette, felt on a springy bronze strip presses the tape against the head, with about a tenth of a newton.', node: 'pressure_pad', position: at('pad'), explode: INSIDE, camera: pose(lifted(at('pad')), [-30, 35], 1.8) },
    { title: 'Playback head', text: 'The tape’s magnetised oxide passes a gap about a micron wide and makes a tiny voltage in the head’s coils, one coil for each stereo track.', node: 'head', position: at('head'), explode: FRONT_OFF, camera: pose(at('head'), [-70, 32], 2.0) },
    { title: 'Radio', text: 'The same player is a radio: AM from 530 to 1,600 kHz and FM from 88 to 108 MHz on the dial, picked with the switch above it.', node: 'front_case', position: at('dial'), explode: 0, camera: pose(at('dial'), [-15, 6], 2.2) },
  ],
  motion: [
    { node: 'motor_pulley', axis: Z, pivot: pivot('motor'), speed: S.motor },
    { node: 'flywheel', axis: Z, pivot: pivot('capstan'), speed: S.capstan },
    { node: 'pinch_wheel', axis: Z, pivot: pivot('pinch'), speed: S.pinch },
    { node: 'clutch', axis: Z, pivot: pivot('clutch'), speed: S.clutch },
    { node: 'takeup_spindle', axis: Z, pivot: pivot('takeup'), speed: S.takeup },
    { node: 'takeup_reel', axis: Z, pivot: pivot('takeup'), speed: S.takeup },
    { node: 'supply_spindle', axis: Z, pivot: pivot('supply'), speed: S.supply },
    { node: 'supply_reel', axis: Z, pivot: pivot('supply'), speed: S.supply },
  ],
  motionLabel: 'Play',
  how: [
    {
      label: 'The idea',
      title: 'A steel pin sets the pace',
      text: [
        'It looks as if the reels pull the tape through. They can’t: as one reel fills and the other empties their sizes change, so no steady turning of a reel could keep the tape at one speed. The speed is set where the tape is squeezed between the capstan, a 2 mm steel pin, and a rubber roller.',
        `The motor turns the capstan at a steady ${Math.round(N.capstanRpm)} turns a minute through a belt and a flywheel, and the tape moves exactly as fast as its surface. Press Play to run it.`,
      ],
      angle: [-34, 16],
      explode: OPEN,
      fill: 0.8,
      focus: ['flywheel', 'pinch_roller', 'tape', 'takeup_reel', 'supply_reel', 'head', 'motor', 'belts'],
      flow: [at('motor_pulley'), at('belt'), at('flywheel'), at('capstan_low'), at('capstan_tape'), at('tape_low'), at('roller_bottom'), at('takeup_pack')],
      tags: [
        { node: 'flywheel', text: 'Capstan', at: at('capstan_tape') },
        { node: 'takeup_reel', text: 'Take-up reel', at: at('takeup_pack') },
      ],
    },
    {
      label: 'Power',
      title: 'From the cells to the flywheel',
      text: [
        `Two AA cells drive a small motor that an electronic governor holds at about 2,400 turns a minute. A thin rubber belt from its ${N.motorPulleyD} mm pulley to the ${N.flywheelD} mm flywheel slows that ${N.beltRatio} times, to ${Math.round(N.capstanRpm)}.`,
        'The flywheel is heavy for its size on purpose: the motor’s small jerks can’t change its speed quickly, and a steady capstan means a steady pitch. Hold the button to run it and count the turns.',
      ],
      angle: [-122, 18],
      explode: OPEN,
      fill: 0.78,
      rate: 0.1,
      focus: ['batteries', 'motor', 'belts', 'flywheel'],
      flow: [at('cells_end'), at('motor'), at('motor_pulley'), at('belt'), at('flywheel')],
      tags: [
        { node: 'motor', text: '2,400 rpm', at: at('motor') },
        { node: 'flywheel', text: `${Math.round(N.capstanRpm)} rpm`, at: at('flywheel') },
      ],
      chart: {
        type: 'ladder',
        title: 'Turns a minute, motor to reels',
        caption: 'The dials turn with the parts, slowed down. The capstan is fixed by the belt; the reels’ speeds are for a quarter of the way through a C60.',
        unit: 'Turns a minute',
        scale: 'log',
        rungs: [
          { name: 'Motor', value: rpm(S.motor), note: '2,400 rpm', node: 'motor_pulley' },
          { name: 'Capstan', value: rpm(S.capstan), note: `${rpm(S.capstan)} rpm`, step: `÷${N.beltRatio}`, node: 'flywheel' },
          { name: 'Clutch', value: rpm(S.clutch), note: `${rpm(S.clutch)} rpm`, node: 'clutch' },
          { name: 'Take-up reel', value: rpm(S.takeup), note: `${rpm(S.takeup)} rpm`, node: 'takeup_spindle' },
          { name: 'Supply reel', value: rpm(S.supply), note: `${rpm(S.supply)} rpm`, node: 'supply_spindle' },
        ],
      },
      try: 'run',
      count: [{ node: 'motor_pulley', label: 'Motor' }, { node: 'flywheel', label: 'Capstan' }],
    },
    {
      label: 'Capstan',
      title: 'Squeezed between steel and rubber',
      text: [
        'A spring presses the rubber pinch roller against the capstan with the tape between them. The tape can’t slip, so it moves at the capstan’s surface speed: 6.3 mm for every turn, 7.6 turns a second, 4.76 cm a second.',
        'The pinch roller is driven by the tape, not by the motor. Here the cassette’s shell is see-through: watch the capstan turn at a tenth of its speed.',
      ],
      angle: [-48, 26],
      explode: OPEN,
      fill: 0.72,
      rate: 0.1,
      focus: ['flywheel', 'pinch_roller', 'tape', 'head'],
      frame: ['pinch_roller', 'head', 'tape'],
      flow: [at('capstan_low'), at('capstan_tape'), at('tape_low')],
      tags: [
        { node: 'flywheel', text: `2 mm capstan, ${Math.round(N.capstanRpm)} rpm`, at: at('capstan_tape') },
        { node: 'pinch_roller', text: 'Pinch roller', at: at('pinch') },
      ],
    },
    {
      label: 'Head',
      title: 'Magnetised tape past a tiny gap',
      text: [
        'Inside the cassette a felt pad on a bronze spring presses the tape onto the playback head with about a tenth of a newton. As the magnetised oxide sweeps past the head’s gap, about a micron wide, it makes a tiny voltage in the coils: one coil for each stereo track.',
        'Because the speed is fixed, every note has its length on the tape: a 1 kHz tone is 47.6 µm, a 10 kHz one under 5 µm. Run the tape fast or slow and every note changes pitch with it.',
      ],
      angle: [-62, 20],
      explode: OPEN,
      fill: 0.62,
      focus: ['head', 'pressure_pad', 'tape'],
      frame: ['head', 'pressure_pad'],
      flow: [at('tape_mid'), at('head_face'), at('head_wires')],
      tags: [
        { node: 'head', text: 'Gap ≈ 1 µm', at: at('head_face') },
        { node: 'pressure_pad', text: 'Pressure pad', at: at('pad_spring') },
      ],
      chart: {
        type: 'bars',
        title: 'One wave of a note, on the tape',
        caption: 'Length = 4.76 cm/s ÷ frequency. The head’s gap has to be shorter than the shortest of them.',
        unit: 'Micrometres',
        bars: [
          { label: '1 kHz', value: wave(1000) },
          { label: '5 kHz', value: wave(5000) },
          { label: '10 kHz', value: wave(10000) },
          { label: '15 kHz', value: wave(15000) },
          { label: 'Gap', value: 1, note: 'about' },
        ],
      },
    },
    {
      label: 'Take-up',
      title: 'A clutch that always slips',
      text: [
        'The take-up reel can’t be driven at a fixed speed, because the right speed keeps changing. So a second belt, crossed to turn it the other way from the capstan, spins a pulley with a felt ring once a second, faster than the reel ever needs, and the spindle sits on the felt and is dragged round.',
        'The felt’s drag, 18 to 30 gram-centimetres in Sony’s service figures, keeps the tape taut without pulling it: the reel winds only as much tape as the capstan lets through, and the clutch slips the rest.',
      ],
      angle: [-128, 20],
      explode: OPEN,
      fill: 0.75,
      rate: 0.2,
      focus: ['flywheel', 'belts', 'clutch', 'takeup_spindle'],
      frame: ['clutch', 'flywheel'],
      flow: [at('flywheel'), at('takeup_belt'), at('clutch'), at('felt'), at('takeup_table')],
      tags: [
        { node: 'clutch', text: `${rpm(S.clutch)} rpm`, at: at('clutch') },
        { node: 'takeup_spindle', text: `${rpm(S.takeup)} rpm`, at: at('takeup_table') },
      ],
    },
    {
      label: 'Reels',
      title: 'The reels follow the tape',
      text: [
        `Inside the cassette the tape runs from the supply reel round a guide roller, past the head and the capstan, round another roller and onto the take-up reel. A quarter of the way through a C60 the take-up pack is ${Math.round(N.takeupR * 2)} mm across and turns ${rpm(S.takeup)} times a minute; the fuller supply reel, ${Math.round(N.supplyR * 2)} mm, turns ${rpm(S.supply)}.`,
        'Over one side the take-up reel slows from 41 to 18 turns a minute as its pack grows, and the supply reel speeds up from 18 to 41, while the capstan keeps the same 455. Hold the button and count: the capstan turns about 16 times for each turn of the take-up reel.',
      ],
      angle: [-20, 30],
      explode: INSIDE,
      fill: 0.75,
      rate: 0.5,
      focus: ['supply_reel', 'takeup_reel', 'tape', 'pressure_pad'],
      frame: ['supply_reel', 'takeup_reel', 'tape'],
      carries: 'power',
      flow: ['supply_pack', 'roller_top', 'tape_mid', 'tape_low', 'roller_bottom', 'takeup_pack'].map((name) => ({ node: 'cassette_back', at: at(name) })),
      tags: [
        { node: 'supply_reel', text: `${rpm(S.supply)} rpm`, at: at('supply_hub') },
        { node: 'takeup_reel', text: `${rpm(S.takeup)} rpm`, at: at('takeup_hub') },
      ],
      chart: {
        type: 'bars',
        title: 'Take-up reel through one side of a C60',
        caption: `Its speed falls as its pack grows, while the supply reel’s rises from ${Math.round(side[0].supply)} to ${Math.round(side[4].supply)}; the capstan stays at 455 rpm. The marked bar is the model.`,
        unit: 'Turns a minute',
        bars: side.map(({ f, takeup }) => ({ label: ['Start', '¼', '½', '¾', 'End'][f * 4], value: takeup })),
        picked: 1,
      },
      try: 'run',
      count: [{ node: 'flywheel', label: 'Capstan' }, { node: 'takeup_spindle', label: 'Take-up reel' }],
    },
  ],
  credit: polyHaven('portable_cassette_player', 'Portable Cassette Player', 'Mateusz Sadek', {
    label: 'Built for this site',
    text: 'The transport inside: deck, capstan and flywheel, belts, motor, cells, pinch roller, head, slip clutch and spindles, and the cassette’s reels, tape, guide rollers and pressure pad. Sizes are typical of personal players, not one model’s; the keys, the play mechanism, the amplifier and the radio’s circuit are left out, and the take-up is drawn with its own belt.',
  }),
  build: { augment: 'objects/cassette-player/augment.mjs', hints: 'objects/cassette-player/hints.json' },
});

function missing(name) {
  throw new Error(`objects/cassette-player/hints.json has no "${name}": add it to the hints augment.mjs returns, then npm run models:build -- cassette-player`);
}
