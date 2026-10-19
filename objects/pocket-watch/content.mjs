// Writes content/pocket-watch.json from the page's text and where the build put things
// (objects/pocket-watch/hints.json, written by `npm run models:build -- pocket-watch`): the moving parts' pivots and
// the film's power path come from the hints, and the callouts inside the case are placed from the movement's layout
// (movement.mjs), so they stay on their parts while the explode is tuned. Still typed in model space: the movement
// frame's scale and origin (K and M; the hints don't carry them), the hands' pivot, the two callouts on the case
// (crown and bow) and the film's tags. Run it after every build:
//   node objects/pocket-watch/content.mjs
import { polyHaven, pose, readHints, writeContent } from '../../scripts/kit/content.mjs';
import { layout, zh } from './movement.mjs';

const H = readHints('pocket-watch');
// The stem's height is where augment.mjs finds the crown; nothing placed here depends on it.
const L = layout({ stemZ: -2.07 });
const K = 0.0196745; // model units per mm
const r4 = (v) => +v.toFixed(4);
const M = (x, y, z) => [r4(x * K - 0.001832), r4(y * K + 0.60432), r4(z * K + 0.036)];
const at = ([x, y], h) => M(x, y, zh(h));
const shift = (p, d) => p.map((v, i) => r4(v + d[i]));
const BACK = [0, 0, -1];
const FRONT = [0, 0, 1];

// ------------------------------------------------------------------ explode plan
// Windows leave two still points: the case open (0.17–0.21) and the bridges lifted with
// the train running in place (0.47–0.52).
const OPEN = 0.19;
const RUNNING = 0.5;
const parts = [
  // Winding
  { node: 'winding_stem', label: 'Crown & stem', about: 'Turn the crown and the stem carries your twist into the movement, to wind the mainspring.', group: 'Winding', direction: [0, 1, 0], distance: 0.55, window: [0.03, 0.17], with: ['crown'] },
  { node: 'crown_wheel', label: 'Crown wheel', about: 'Takes the turn from the winding pinion on the stem and passes it on to the ratchet wheel.', group: 'Winding', direction: BACK, distance: 0.16, then: { direction: [-0.25, 0.85, -1], distance: 1.0 }, window: [0.21, 0.43] },
  { node: 'ratchet_click', label: 'Ratchet wheel & click', about: 'The ratchet wheel turns the barrel’s arbor as you wind. The sprung click drops into its teeth, so the spring can’t unwind backwards.', group: 'Winding', direction: BACK, distance: 0.16, then: { direction: [-0.25, 0.85, -1], distance: 1.0 }, window: [0.21, 0.43], with: ['ratchet_wheel'] },
  // Power
  { node: 'mainspring', label: 'Mainspring', about: 'A long coiled strip of hardened steel: the watch’s whole store of energy.', group: 'Power', direction: BACK, distance: 0.22, window: [0.7, 0.9] },
  { node: 'barrel', label: 'Barrel', about: 'The drum the mainspring lives in. As the spring relaxes it turns the barrel, and the barrel’s teeth drive the train.', group: 'Power', direction: BACK, distance: 0.1, window: [0.76, 0.95] },
  // Gear train: lower wheels come out later and travel less, so nothing passes through anything.
  { node: 'centre_wheel', label: 'Centre wheel', about: 'Turns once an hour. Its arbor carries the cannon pinion, and with it the minute hand.', group: 'Gear train', direction: BACK, distance: 0.33, window: [0.64, 0.86] },
  { node: 'third_wheel', label: 'Third wheel', about: 'Passes the centre wheel’s motion on to the fourth wheel’s pinion, speeding it up seven and a half times.', group: 'Gear train', direction: BACK, distance: 0.44, window: [0.62, 0.84] },
  { node: 'fourth_wheel', label: 'Fourth wheel', about: 'Turns once a minute, and carries the seconds hand on its long arbor.', group: 'Gear train', direction: BACK, distance: 0.55, window: [0.6, 0.82] },
  // Escapement
  { node: 'escape_wheel', label: 'Escape wheel', about: 'Fifteen club-shaped teeth, let past by the pallet fork half a tooth at a time.', group: 'Escapement', direction: BACK, distance: 0.66, window: [0.57, 0.78] },
  { node: 'pallet_fork', label: 'Pallet fork', about: 'Rocks to and fro on every tick: its red pallets lock and release the escape wheel, and its forked end kicks the balance.', group: 'Escapement', direction: BACK, distance: 0.62, window: [0.57, 0.78] },
  // Balance
  { node: 'balance_wheel', label: 'Balance wheel', about: 'Swings back and forth three times a second. Its steady rhythm is what sets the watch’s rate.', group: 'Balance', direction: BACK, distance: 0.9, window: [0.53, 0.74] },
  { node: 'hairspring', label: 'Hairspring', about: 'A fine blued spiral that pulls the balance back each time it swings out. Its stiffness sets the beat.', group: 'Balance', direction: BACK, distance: 1.02, window: [0.52, 0.72] },
  // Hands
  { node: 'cannon_pinion', label: 'Cannon pinion', about: 'A tube that grips the centre wheel’s arbor. It carries the minute hand and drives the motion works.', group: 'Hands', direction: FRONT, distance: 0.18, window: [0.62, 0.82] },
  { node: 'minute_wheel', label: 'Minute wheel', about: 'Gears the cannon pinion down for the hour wheel; between them they slow it twelve times.', group: 'Hands', direction: FRONT, distance: 0.3, window: [0.6, 0.8] },
  { node: 'hour_wheel', label: 'Hour wheel', about: 'Turns once every twelve hours and carries the hour hand on its tube.', group: 'Hands', direction: FRONT, distance: 0.42, window: [0.58, 0.78] },
  { node: 'dial', label: 'Dial', about: 'The enamel face and its ring of Roman numerals, held to the main plate by two small feet.', group: 'Hands', direction: [-0.3, 0, 1], distance: 0.78, window: [0.52, 0.7] },
  { node: 'vintage_pocket_watch_hour_hand', label: 'Hour hand', about: 'Rides on the hour wheel’s tube, going round twice a day.', group: 'Hands', direction: FRONT, distance: 0.76, window: [0.23, 0.42] },
  { node: 'vintage_pocket_watch_minute_hand', label: 'Minute hand', about: 'Rides on the cannon pinion, once round every hour.', group: 'Hands', direction: FRONT, distance: 0.88, window: [0.22, 0.41] },
  { node: 'vintage_pocket_watch_second_hand', label: 'Seconds hand', about: 'Sits on the tip of the fourth wheel’s arbor and steps forward six times a second.', group: 'Hands', direction: FRONT, distance: 1.0, window: [0.21, 0.4], with: ['hand_cap'] },
  // Frame
  { node: 'main_plate', label: 'Main plate', about: 'The foundation: wheels pivot in its jewels, the bridges are screwed to it, and the dial sits on its other side.', group: 'Frame', direction: BACK, distance: 0, with: ['winding_pinion'] },
  { node: 'barrel_bridge', label: 'Barrel bridge', about: 'Holds the barrel’s arbor, and carries the winding wheels on top.', group: 'Frame', direction: BACK, distance: 0.1, then: { direction: [-0.25, 0.85, -1], distance: 0.85 }, window: [0.23, 0.45] },
  { node: 'train_bridge', label: 'Train bridge', about: 'Holds the top pivots of the third, fourth and escape wheels, each in a jewel in a gold setting.', group: 'Frame', direction: BACK, distance: 0.12, then: { direction: [-0.9, -0.15, -1], distance: 1.05 }, window: [0.22, 0.44] },
  { node: 'pallet_bridge', label: 'Pallet bridge', about: 'A small bridge holding the pallet fork’s top pivot, tucked in under the balance.', group: 'Frame', direction: BACK, distance: 0.78, window: [0.55, 0.76] },
  { node: 'balance_cock', label: 'Balance cock', about: 'Holds the balance’s top pivot and the hairspring’s outer end. The little arm on top, the regulator, adjusts the rate.', group: 'Frame', direction: BACK, distance: 0.12, then: { direction: [0.85, -0.1, -1], distance: 1.15 }, window: [0.21, 0.43] },
  // Case
  { node: 'case', label: 'Case', about: 'The engraved shell the movement sits in. The stem runs up through the pendant at the top to the crown, and the bow above holds the chain.', group: 'Case', direction: BACK, distance: 0 },
  { node: 'case_back', label: 'Case back', about: 'Closes the case, keeping dust and damp away from the oiled pivots.', group: 'Case', direction: BACK, distance: 0.2, then: { direction: [-0.75, 0.1, -1], distance: 1.35 }, window: [0, 0.17] },
  { node: 'crystal', label: 'Crystal', about: 'The glass over the dial. It comes off first, to get at the hands.', group: 'Case', direction: FRONT, distance: 1.25, window: [0, 0.14] },
];

// ------------------------------------------------------------------ motion
const axis = [0, 0, 1];
const pivot = (name) => H.pivots[name];
const stem = { axis: [0, 1, 0], pivot: pivot('stem') };
// The crown's pinion against the crown wheel; the crown wheel and the ratchet wheel are the same size.
const wind = r4(L.windingPinionTeeth / L.crownTeeth);
const motion = [
  // The hands, on the clock (their pivot as the first page had it).
  { node: 'vintage_pocket_watch_hour_hand', axis, pivot: [-0.002, 0.604, 0], clock: 'hour' },
  { node: 'vintage_pocket_watch_minute_hand', axis, pivot: [-0.002, 0.604, 0], clock: 'minute' },
  { node: 'vintage_pocket_watch_second_hand', axis, pivot: [-0.002, 0.604, 0], clock: 'second' },
  { node: 'barrel', axis, pivot: pivot('barrel'), train: -1 / 480, inside: true },
  { node: 'centre_wheel', axis, pivot: pivot('centre'), train: 1 / 60, inside: true },
  { node: 'third_wheel', axis, pivot: pivot('third'), train: -2 / 15, inside: true },
  { node: 'fourth_wheel', axis, pivot: pivot('centre'), train: 1, inside: true },
  { node: 'escape_wheel', axis, pivot: pivot('escape'), train: -12, inside: true },
  { node: 'pallet_fork', axis, pivot: pivot('pallet'), swing: 'pallet', amplitude: 5.5, inside: true },
  { node: 'balance_wheel', axis, pivot: pivot('balance'), swing: 'balance', amplitude: 250, inside: true },
  { node: 'hairspring', axis, pivot: pivot('balance'), swing: 'coil', amplitude: 250, inside: true },
  { node: 'cannon_pinion', axis, pivot: pivot('centre'), train: 1 / 60, inside: true },
  { node: 'minute_wheel', axis, pivot: pivot('minuteWheel'), train: -1 / 180, inside: true },
  { node: 'hour_wheel', axis, pivot: pivot('centre'), train: 1 / 720, inside: true },
  // Winding: the crown turns the stem and its pinion, the pinion the crown wheel, and that the ratchet on the barrel's arbor.
  { node: 'crown', ...stem, wind: -1 },
  { node: 'winding_stem', ...stem, wind: -1 },
  { node: 'winding_pinion', ...stem, wind: -1 },
  { node: 'crown_wheel', axis, pivot: pivot('crownWheel'), wind: -wind },
  { node: 'ratchet_wheel', axis, pivot: pivot('barrel'), wind },
  { node: 'ratchet_click', axis, pivot: pivot('click'), wind, pawl: L.ratchetTeeth, amplitude: 5 },
  { node: 'mainspring', axis, pivot: pivot('barrel'), wind, coil: true },
];

// ------------------------------------------------------------------ callouts
const mainspringAt = at(L.barrel.map((v, i) => v + [-2.2, 3.4][i]), 0.42);
const trainAt = at([-2.2, -1.6], 1.75);
const escapeAt = at([1.6, -8.8], 2.0);
const balanceAt = at(L.balance, 3.4);
const jewelsAt = at([-1.5, -1.0], 2.0);
const motionWorksAt = M(-1.6, 0.4, -0.5);
const annotations = [
  {
    title: 'Crown',
    text: 'Turning the crown winds the mainspring through a little gear train of its own: a pinion on the stem turns the crown wheel, which turns the ratchet wheel on the barrel’s arbor. A sprung click lets the ratchet turn one way only, so the spring can’t unwind back through your fingers.',
    position: [0.024, 1.329, 0.096],
    camera: { position: [0.346, 1.57, 0.901], target: [0.024, 1.329, 0.096] },
    node: 'crown',
  },
  {
    title: 'Mainspring',
    text: 'The power: a strip of hardened steel about half a metre long, coiled inside the barrel. Winding pulls it tight round the arbor; as it relaxes it turns the barrel, about once every eight hours, and the barrel’s teeth drive everything else. A full wind lasts around 40 hours.',
    position: mainspringAt,
    node: 'mainspring',
    explode: RUNNING,
    camera: pose(mainspringAt, [196, 34], 1.3),
  },
  {
    title: 'Gear train',
    text: 'With the bridges lifted off you can watch the train run. Each wheel drives a much smaller pinion on the next, so the speed multiplies: the centre wheel turns once an hour and carries the minute hand, the fourth wheel once a minute for the seconds hand, the escape wheel twelve times a minute.',
    position: trainAt,
    node: 'fourth_wheel',
    explode: RUNNING,
    camera: pose(trainAt, [205, 30], 1.55),
  },
  {
    title: 'Escapement',
    text: 'Left alone, the train would spin out in seconds. The pallet fork holds it: its two red pallets take turns catching the escape wheel. Each swing of the balance knocks the fork across, the wheel slips half a tooth, and its tooth pushes the pallet, giving the balance a small kick. That’s the tick.',
    position: escapeAt,
    node: 'escape_wheel',
    explode: RUNNING,
    camera: pose(escapeAt, [172, 32], 0.78),
  },
  {
    title: 'Balance',
    text: 'This is what keeps time. The balance swings back and forth three times a second, and the hairspring pulls it back each time. The rate comes from the wheel and the spring, not the mainspring: wind it tighter and it still ticks at the same speed. The arm on the cock adjusts the spring to regulate it.',
    position: balanceAt,
    node: 'balance_wheel',
    explode: RUNNING,
    camera: pose(balanceAt, [152, 34], 1.05),
  },
  {
    title: 'Hands',
    text: 'All three hands share one centre. Under the dial, the cannon pinion turns with the centre wheel, once an hour, and carries the minute hand. Two more wheels gear that down twelve times for the hour hand’s tube. The seconds hand rides on the fourth wheel’s arbor, which runs up through both.',
    position: motionWorksAt,
    node: 'hour_wheel',
    explode: 1,
    camera: pose(shift(motionWorksAt, [0, 0, 0.3]), [38, 20], 1.15),
  },
  {
    title: 'Jewels',
    text: 'The red dots are synthetic rubies, drilled to hold the steel pivots of the faster-turning arbors. They’re hard and smooth, so the pivots barely wear and need only a trace of oil. A good watch has fifteen or so, which is why old dials boast “17 jewels”.',
    position: jewelsAt,
    node: 'train_bridge',
    explode: OPEN,
    camera: pose(jewelsAt, [196, 30], 1.95),
  },
  {
    title: 'Bow',
    text: 'The chain clips on here. Pocket watches lived in waistcoat pockets, chained to a buttonhole so a dropped watch never hit the floor.',
    position: [0.183, 1.504, 0.01],
    camera: { position: [0.528, 1.849, 0.996], target: [0.183, 1.504, 0.01] },
  },
];

// ------------------------------------------------------------------ film
// What stays solid through the film: the mainspring and every wheel it drives, down to the balance and up to the
// hands. The case, the dial, the plate, the bridges and the barrel are glass, so the train shows through them.
const MOVING = [
  'mainspring',
  'centre_wheel',
  'third_wheel',
  'fourth_wheel',
  'escape_wheel',
  'pallet_fork',
  'balance_wheel',
  'hairspring',
  'cannon_pinion',
  'minute_wheel',
  'hour_wheel',
  'vintage_pocket_watch_hour_hand',
  'vintage_pocket_watch_minute_hand',
  'vintage_pocket_watch_second_hand',
];
/** Every shot frames the whole watch at one size; the camera goes round it, and the solid train inside does the work. */
const WHOLE = ['case'];
const FILL = 0.76;
/** The escapement in slow motion: a tenth of real speed, a tick every 1.7 s. */
const SLOW = 0.1;
// The power's path, from movement.mjs `flowPaths` by way of the hints: from the mainspring through the barrel's teeth
// and the train to the escape wheel (the power path's last three points, then the train's less the two it repeats).
const { power, train } = H.flow;
const chain = [...power.slice(-3), ...train.slice(2)];

const film = [
  {
    chapter: 'Power',
    caption: 'The wound mainspring turns the barrel, and its teeth drive the train of wheels.',
    duration: 6,
    angle: [-50, 18],
    fill: FILL,
    focus: MOVING,
    frame: WHOLE,
    flow: chain,
    tags: [{ node: 'mainspring', text: 'mainspring', at: [0.11, 0.84, -0.007] }],
  },
  {
    chapter: 'Escapement',
    caption: 'Slowed ten times: each swing of the balance lets the escape wheel slip half a tooth, a tick.',
    duration: 6,
    angle: [-24, 14],
    fill: FILL,
    rate: SLOW,
    focus: MOVING,
    frame: WHOLE,
    tags: [
      { node: 'escape_wheel', text: 'escape wheel', at: [0.05, 0.51, -0.05] },
      { node: 'pallet_fork', text: 'pallet fork', at: [0.14, 0.4, -0.05] },
    ],
  },
  {
    chapter: 'Escapement',
    caption: 'The hairspring swings the balance to and fro three times a second: that sets the pace.',
    duration: 6,
    angle: [0, 12],
    fill: FILL,
    rate: SLOW,
    focus: MOVING,
    frame: WHOLE,
    tags: [{ node: 'balance_wheel', text: 'balance', at: [0.3, 0.3, -0.05] }],
  },
  {
    chapter: 'Hands',
    caption: 'The train turns the hands: the seconds hand once a minute, the minute hand once an hour.',
    duration: 6,
    angle: [24, 10],
    fill: FILL,
    focus: MOVING,
    frame: WHOLE,
    tags: [{ node: 'vintage_pocket_watch_second_hand', text: 'seconds hand', at: [-0.09, 0.68, 0.048], ride: true }],
  },
];

writeContent('pocket-watch', {
  order: 2,
  title: 'Pocket Watch',
  hook: 'A wound spring does the pushing; a little wheel swinging back and forth sets the pace.',
  category: 'time',
  summary: [
    'A pocket watch has to keep time in a pocket, at any angle, with no pendulum and no plug. It does it with stored energy let out in tiny, even steps.',
    'Winding the crown coils the mainspring. As the spring relaxes it turns a train of gears that would spin out in seconds if nothing held it back. The escapement holds it back, letting the train move one tooth at a time.',
    'The pace comes from the balance, a wheel on a hairspring that swings back and forth at a steady rate. Each swing unlocks the escapement for one tick and gets a small push in return, which keeps it swinging. The hands on this model show your current time.',
  ],
  model: 'models/pocket-watch.glb',
  viewAngle: [22, 8],
  facts: [
    { label: 'Power', value: 'Mainspring, about 40 hours' },
    { label: 'Beat', value: '6 ticks a second' },
    { label: 'Parts shown', value: '26' },
    { label: 'Real size', value: '6 cm across' },
  ],
  parts,
  motion,
  film,
  annotations,
  credit: polyHaven('vintage_pocket_watch', 'Vintage Pocket Watch', 'Tal Swicegood', { label: 'Movement', text: 'Built for 3D of Things from real tooth counts, and fitted inside the case.' }),
  explodeAngle: [122, 17],
  build: { augment: 'objects/pocket-watch/augment.mjs', hints: 'objects/pocket-watch/hints.json' },
  motionLabel: 'Slow motion',
  slowMotion: { rate: 0.05, explode: RUNNING },
  explodeDuration: 2800,
});
