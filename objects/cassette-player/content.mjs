// Writes content/cassette-player.json from the page's text and where the build put things
// (objects/cassette-player/hints.json), so no model-space number is pasted by hand. Run it after every build:
//   node objects/cassette-player/content.mjs
//
// Every speed on the page comes from the hints (augment.mjs works them out from the truth sheet's numbers).
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

// Explode states the callouts use: lid and back cover off; the front case off too, the cassette still playing;
// the cassette lifted out; the cassette opened.
const OPEN = 0.15;
const FRONT_OFF = 0.29;
const LIFTED = 0.53;
const INSIDE = 0.67;
const CASSETTE_LIFT = 70;
const lifted = (p) => up(p, CASSETTE_LIFT);

/** What stays solid through the film: the drive from the motor to the capstan, the tape and what it runs over, and the
 *  reels and their spindles. The case, the deck and the cassette's shell are glass. */
const MOVING = ['motor', 'belts', 'flywheel', 'pinch_roller', 'tape', 'head', 'pressure_pad', 'supply_reel', 'takeup_reel', 'supply_spindle', 'takeup_spindle', 'clutch'];
/** Every shot frames the whole player at one size; the camera goes round it, and the solid transport inside does the work. */
const WHOLE = ['front_case', 'back_cover', 'lid'];
const FILL = 0.7;
/** The film runs at a quarter of real speed: the capstan's 7.6 turns a second are a blur. */
const RATE = 0.25;

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
  // "How it works" as a film: the motor spins the capstan, the capstan pulls the tape past the head, and the take-up
  // reel winds in what comes through. All of it a quarter of real speed, so the capstan can be seen turning.
  film: [
    {
      chapter: 'Drive',
      caption: 'A belt from the motor turns the brass flywheel; its 2 mm steel shaft is the capstan.',
      duration: 5,
      angle: [-70, 16],
      fill: FILL,
      rate: RATE,
      focus: MOVING,
      frame: WHOLE,
      flow: [at('motor_pulley'), at('belt'), at('flywheel'), at('capstan_low')],
      tags: [
        { node: 'motor', text: 'motor', at: at('motor') },
        { node: 'flywheel', text: 'flywheel', at: at('flywheel') },
      ],
    },
    {
      chapter: 'Drive',
      caption: 'The pinch roller squeezes the tape onto the capstan, so the tape moves at exactly 4.76 cm/s.',
      duration: 5,
      angle: [-50, 20],
      fill: FILL,
      rate: RATE,
      focus: MOVING,
      frame: WHOLE,
      tags: [
        { node: 'flywheel', text: 'capstan', at: at('capstan') },
        { node: 'pinch_roller', text: 'pinch roller', at: at('pinch_arm') },
      ],
    },
    {
      chapter: 'Tape',
      caption: 'The tape’s magnetised coating sweeps past the head’s tiny gap and makes a voltage: the music.',
      duration: 5,
      angle: [-30, 24],
      fill: FILL,
      rate: RATE,
      focus: MOVING,
      frame: WHOLE,
      tags: [{ node: 'head', text: 'head', at: at('head_face') }],
    },
    {
      chapter: 'Tape',
      caption: 'The take-up reel only winds in what the capstan lets through, slowing down as it fills.',
      duration: 5,
      angle: [-10, 28],
      fill: FILL,
      rate: RATE,
      focus: MOVING,
      frame: WHOLE,
      tags: [{ node: 'takeup_reel', text: 'take-up reel', at: at('takeup_pack') }],
    },
  ],
  motionLabel: 'Play',
  credit: polyHaven('portable_cassette_player', 'Portable Cassette Player', 'Mateusz Sadek', {
    label: 'Built for this site',
    text: 'The transport inside: deck, capstan and flywheel, belts, motor, cells, pinch roller, head, slip clutch and spindles, and the cassette’s reels, tape, guide rollers and pressure pad. Sizes are typical of personal players, not one model’s; the keys, the play mechanism, the amplifier and the radio’s circuit are left out, and the take-up is drawn with its own belt.',
  }),
  build: { augment: 'objects/cassette-player/augment.mjs', hints: 'objects/cassette-player/hints.json' },
});

function missing(name) {
  throw new Error(`objects/cassette-player/hints.json has no "${name}": add it to the hints augment.mjs returns, then npm run models:build -- cassette-player`);
}
