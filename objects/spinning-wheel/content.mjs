// Writes content/spinning-wheel.json: the page's text, and where the build put things (objects/spinning-wheel/hints.json,
// written by `npm run models:build -- spinning-wheel`), so no model-space number is pasted by hand. Run it after
// every build:   node objects/spinning-wheel/content.mjs
//
// Everything that moves follows the wheel's angle: the flyer and the bobbin spin at the ratios the band's radii give
// (hints.numbers, measured off the model), and the treadle and footman are a four-bar on the wheel's crank
// (`rocker` and `coupler`, src/viewer/fourbar.ts). The bobbin rides on the flyer, so its own spin is the difference.
import { polyHaven, pose, readHints, space, writeContent } from '../../scripts/kit/content.mjs';

const H = readHints('spinning-wheel');
const { U } = space(H);
/** A named point from the build (model space). Before the first build there are none yet, so a placeholder. */
const at = (name) => H?.anchors?.[name] ?? (H ? missing(name) : [0, 0.5, 0]);
const pivot = (name) => H?.pivots?.[name] ?? (H ? missing(name) : [0, 0.5, 0]);
const axis = (name) => H?.axes?.[name] ?? [1, 0, 0];
const N = H?.numbers ?? { wheelDiameter: 600, rimDiameter: 606, flyerWhorl: 50, bobbinWhorl: 45, flyerRatio: 12, bobbinRatio: 13, crankThrow: 64, footmanLength: 576, treadleArm: 312, packageDiameter: 52 };
const fmt = (v, k = 1) => v.toFixed(k).replace(/\.0$/, '');
const cm = (mm) => fmt(mm / 10);

/** Turns a second of the wheel while running: 60 treadles a minute, an easy pace. */
const SPEED = 1;
const flyerRpm = Math.round((N.flyerRatio * SPEED * 60) / 10) * 10;
/** Yarn let in per turn of the wheel at about 4 twists to the inch (the build's yarn): the flyer's turns over the twist. */
const DRAWN_IN_MM = (N.flyerRatio / 4) * 25.4;
/** What the bobbin's lead would wind on per turn of the wheel if the spinner let go: its extra turns round the yarn on it. */
const FREE_WIND_MM = (N.bobbinRatio - N.flyerRatio) * Math.PI * N.packageDiameter;

const off = (direction, mm, window, then) => ({ direction, distance: U(mm), window, ...(then ? { then: { direction: then[0], distance: U(then[1]) } } : {}) });
const stay = { direction: [0, 1, 0], distance: 0 };

/** What stays solid through the film: everything the foot drives, and the yarn. The bench, legs, uprights, the
 *  mother-of-all and its maidens are glass, so the flyer and bobbin show between the maidens. */
const MOVING = ['treadle', 'footman', 'wheel', 'crank', 'drive_band', 'flyer', 'flyer_whorl', 'bobbin', 'yarn', 'leader', 'fibre'];
/** Every shot frames the whole wheel, at one size. */
const WHOLE = ['wheel', 'treadle', 'flyer', 'fibre', 'legs'];
const FILL = 0.7;
/** The power's path: foot, treadle, footman, crank. */
const POWER = [at('treadle_board'), { node: 'treadle', at: at('treadle_pin') }, { node: 'footman', at: at('footman_mid') }, { node: 'wheel', at: at('crank_pin'), ride: true }];
const BAND = [at('rim_top'), at('band_top_wheel'), at('band_top_mid'), at('band_top_flyer'), at('flyer_whorl')];
const YARN = [at('fibre'), at('drafting'), at('yarn_out'), at('orifice')];

writeContent('spinning-wheel', {
  order: 21,
  title: 'Spinning Wheel',
  hook: 'The yarn only winds on because the bobbin turns a little faster than the flyer that twists it.',
  category: 'gears',
  summary: [
    'Fibre becomes yarn by twist: drawn out thin and twisted, its short fibres grip one another. A hand spindle twists in bursts and then stops while the spinner winds the yarn on. The flyer wheel does both at once and never stops, and from the sixteenth century it spread across Europe.',
    `On this Saxony wheel the foot rocks a treadle; a wooden rod, the footman, joins it to a crank on the wheel’s axle, and the ${cm(N.rimDiameter)} cm wheel keeps itself turning. One long band, doubled into two loops, runs from its rim to two whorls: one on the flyer, the U-shaped arm that puts in the twist, and one on the bobbin, which turns loose on the flyer’s shaft.`,
    `The yarn comes in at the orifice, out through a hole in the side of the shaft, along the flyer’s arm over a hook and onto the bobbin. Each turn of the flyer puts one twist in it. Where the band runs, the bobbin’s whorl is ${fmt(N.bobbinWhorl)} mm across and the flyer’s ${fmt(N.flyerWhorl)} mm, so for each turn of the wheel the flyer turns ${fmt(N.flyerRatio)} times and the bobbin ${fmt(N.bobbinRatio)}: the difference winds the yarn on. Those sizes are measured off this model; the spinner’s hands set the pace.`,
  ],
  model: 'models/spinning-wheel.glb',
  viewAngle: [-35, 16],
  explodeAngle: [-50, 22],
  explodeDuration: 2800,
  facts: [
    { label: 'Type', value: 'Saxony flyer wheel, double drive' },
    { label: 'Wheel', value: `${cm(N.rimDiameter)} cm, 12 spokes` },
    { label: 'Ratios', value: `Flyer ${fmt(N.flyerRatio)} : 1, bobbin ${fmt(N.bobbinRatio)} : 1` },
    { label: 'Flyer speed', value: `About ${flyerRpm} rpm at 60 treadles a minute` },
    { label: 'Crank', value: `${fmt(N.crankThrow, 0)} mm throw, footman ${cm(N.footmanLength)} cm` },
    { label: 'Size', value: '49 × 97 × 102 cm, without the fibre' },
  ],
  // In energy-chain order, grouped. The fibre and the tension screw come off first, then the front maiden slides off the
  // orifice and lifts out, so the flyer can be moved inside the band's loops, clear of the whorls, and slid out
  // sideways; then its whorl and bobbin come off it. The band is tied on round the wheel, so it stays, and with it the
  // mother-of-all beneath its loops.
  parts: [
    { node: 'treadle', label: 'Treadle', group: 'Foot', about: 'A triangular frame on the floor, hinged on two pins along its inner bar. The foot rocks it; its far corner carries the footman.', ...stay },
    { node: 'footman', label: 'Footman', group: 'Foot', about: `A wooden rod ${cm(N.footmanLength)} cm long from the treadle’s corner up to the crank. It only pulls: the foot pushes the crank down past the bottom and the wheel carries it over the top.`, ...stay },
    { node: 'wheel', label: 'Drive wheel', group: 'Wheel', about: `Twelve spokes and a rim ${cm(N.rimDiameter)} cm across, grooved for the band. Its weight keeps it turning between pushes of the foot, carrying the crank over the points where the footman can’t pull it.`, ...stay },
    { node: 'crank', label: 'Crank', group: 'Wheel', about: `An iron crank on the axle’s end, ${fmt(N.crankThrow, 0)} mm from the axle to its pin. The footman hangs from the pin.`, ...stay },
    { node: 'uprights', label: 'Uprights', group: 'Wheel', about: 'Four turned posts, two each side, wedged through the bench; the axle turns in bearings at their tops.', ...stay },
    { node: 'drive_band', label: 'Drive band', group: 'Band', about: 'One cotton cord, about 1.6 mm thick, going twice round the wheel’s rim: one loop on the flyer’s whorl, one on the bobbin’s. It is tied on, and the tension screw tightens both loops at once.', ...stay },
    { node: 'flyer', label: 'Flyer', group: 'Flyer and bobbin', about: 'A U of wood on a hollow shaft. The yarn enters at the orifice, leaves by a hole in the shaft’s side and runs along an arm over one of its eleven hooks. Every turn of the flyer puts one twist in the yarn.', ...off([0, 0, 1], 60, [0.4, 0.75], [[-1, 0, 0], 330]) },
    { node: 'flyer_whorl', label: 'Flyer whorl', group: 'Flyer and bobbin', about: `A grooved pulley screwed onto the shaft’s back end. The band runs in its ${fmt(N.flyerWhorl)} mm groove; a smaller groove beside it would turn the flyer faster.`, ...off([1, 0, 0], 120, [0.75, 0.88]) },
    { node: 'bobbin', label: 'Bobbin', group: 'Flyer and bobbin', about: `It turns loose on the flyer’s shaft, driven by its own whorl, ${fmt(N.bobbinWhorl)} mm in the groove: smaller than the flyer’s, so it turns faster and winds the yarn on.`, ...off([0, -1, 0], 140, [0.8, 0.95]) },
    { node: 'yarn', label: 'Yarn', group: 'Flyer and bobbin', about: 'A singles yarn of about 4 twists to the inch, from the drafting zone through the orifice and over a hook onto the bobbin.', ...stay },
    { node: 'fibre', label: 'Fibre', group: 'Flyer and bobbin', about: 'Prepared wool, held in the spinner’s hands (not shown) and drawn out thin as the twist runs up into it.', ...off([0, 0.3, 1], 220, [0, 0.2]) },
    { node: 'leader', label: 'Yarn at the orifice', group: 'Flyer and bobbin', about: 'The yarn between the orifice and the spinner’s hands. It turns with the flyer, and each turn puts in one twist, which runs up into the fibre being drawn out.', ...off([0, 0.3, 1], 220, [0, 0.2]) },
    { node: 'front_maiden', label: 'Front maiden', group: 'Mounting', about: 'The post holding the orifice end in a leather bearing. It turns in the mother-of-all to let the flyer out.', ...off([-1, 0, 0], 45, [0.2, 0.4], [[0, 1, 0], 280]) },
    { node: 'back_maiden', label: 'Back maiden', group: 'Mounting', about: 'Holds the shaft’s back end in a leather bearing, just behind the whorl.', ...stay },
    { node: 'mother_of_all', label: 'Mother-of-all', group: 'Mounting', about: 'The bar the maidens stand in, on a post through a slot in the bench. Sliding it away from the wheel tightens the band.', ...stay },
    { node: 'tension_screw', label: 'Tension screw', group: 'Mounting', about: 'A wooden screw through the end of the bench into the mother-of-all’s post. Turning the knob moves the flyer away from the wheel or towards it.', direction: (H?.axes?.screw ?? [0, 0, 1]).map((v) => -v), distance: U(120), window: [0, 0.25] },
    { node: 'table', label: 'Bench', group: 'Frame', about: 'The slanting bench that carries everything: the uprights at its low end, the mother-of-all at its high end.', ...stay },
    { node: 'legs', label: 'Legs', group: 'Frame', about: 'Three turned legs, the front one long, and a rail along the floor that the treadle hinges against.', ...stay },
  ],
  annotations: [
    { title: 'Treadle', text: `The foot rocks the treadle on its hinge. Its far corner, ${cm(N.treadleArm)} cm from the hinge, rises and falls ${cm(2 * N.crankThrow)} cm with the crank.`, node: 'treadle', position: at('treadle_board'), explode: 0, camera: pose(at('treadle_board'), [120, 35], 5, { card: 'left' }) },
    { title: 'Footman and crank', text: `The footman turns the treadle’s rocking into the crank’s circle, as a connecting rod does in an engine. The crank throws ${fmt(N.crankThrow, 0)} mm, so the wheel turns once for each push.`, node: 'footman', position: at('footman_mid'), explode: 0, camera: pose(at('footman_mid'), [95, 10], 5, { card: 'left' }) },
    { title: 'Flywheel', text: 'The foot can only pull the crank down. The heavy rim carries it on round, over the top and bottom where the footman has no leverage, so the flyer turns steadily.', node: 'wheel', position: at('rim_back'), explode: 0, camera: pose(at('rim_back'), [80, 10], 6, { card: 'left' }) },
    { title: 'Double drive', text: `One band, doubled: a loop to each whorl. The rim’s ${cm(N.wheelDiameter)} cm against whorls of ${fmt(N.flyerWhorl)} and ${fmt(N.bobbinWhorl)} mm gives ${fmt(N.flyerRatio)} turns of the flyer and ${fmt(N.bobbinRatio)} of the bobbin per turn of the wheel.`, node: 'drive_band', position: at('band_top_wheel'), explode: 0, camera: pose(at('band_top_wheel'), [-80, 15], 5, { card: 'right' }) },
    { title: 'Twist', text: `The flyer turns about ${flyerRpm} times a minute, and the yarn between the orifice and the spinner’s hands turns with it: each turn is one twist, which runs up into the drawn-out fibre and locks it into yarn.`, node: 'flyer', position: at('orifice'), explode: 0, camera: pose(at('orifice'), [-150, 15], 3.6, { card: 'right' }) },
    { title: 'Not the wheel, the flyer', text: 'The big wheel twists nothing: it only drives. The flyer twists the yarn, and the yarn winds on only because the bobbin turns faster than the flyer. Turning together, they’d twist the yarn but never take it in.', node: 'bobbin', position: at('bobbin'), explode: 0, camera: pose(at('bobbin'), [-140, 30], 3.2, { card: 'right' }) },
    { title: 'Winding on', text: `Free to run, the bobbin’s lead would wind on about ${cm(FREE_WIND_MM)} cm of yarn per turn of the wheel. The spinner lets in about ${cm(DRAWN_IN_MM)} cm, about 4 twists to the inch, holding the yarn back so the band slips on the bobbin’s whorl.`, node: 'bobbin', position: at('bobbin_whorl'), explode: 0, camera: pose(at('bobbin_whorl'), [170, 30], 3.2, { card: 'left' }) },
    { title: 'Hooks', text: 'The yarn winds on wherever its hook is. The spinner moves it from hook to hook along the arm to fill the bobbin evenly.', node: 'flyer', position: at('hook'), explode: 0, camera: pose(at('hook'), [-125, 45], 2.8, { card: 'right' }) },
    { title: 'Tension', text: 'Turning the knob screws the mother-of-all away from the wheel, stretching both loops of the band. Tighter, the bobbin slips less and pulls the yarn in harder.', node: 'tension_screw', position: at('tension_knob'), explode: 0, camera: pose(at('tension_knob'), [-150, 20], 4, { card: 'right' }) },
  ],
  motion: [
    { node: 'wheel', axis: axis('wheel'), pivot: pivot('wheel'), speed: SPEED },
    { node: 'flyer', axis: axis('flyer'), pivot: pivot('flyer'), speed: SPEED * N.flyerRatio },
    // On the flyer's shaft, so its own spin is what it gains on the flyer.
    { node: 'bobbin', axis: axis('flyer'), pivot: pivot('flyer'), speed: +(SPEED * (N.bobbinRatio - N.flyerRatio)).toFixed(4) },
    { node: 'treadle', axis: axis('treadle'), pivot: pivot('treadle'), rocker: 'wheel', pin: H?.linkage?.pin ?? [0, 0.5, 0], at: H?.linkage?.foot ?? [0, 0, 0] },
    { node: 'footman', axis: [1, 0, 0], coupler: 'treadle' },
  ],
  motionLabel: 'Treadle',
  // "How it works" as an animation: the foot drives the wheel, the band drives the flyer and bobbin, the flyer twists,
  // and, slowed right down, the bobbin gains on the flyer and winds the yarn on.
  film: [
    {
      chapter: 'Treadle',
      caption: 'Each push of the foot rocks the treadle, and the footman pulls the crank round.',
      duration: 5,
      angle: [-40, 20],
      fill: FILL,
      rate: 0.6,
      focus: MOVING,
      frame: WHOLE,
      flow: POWER,
      tags: [{ node: 'treadle', text: 'treadle', at: at('treadle_board') }, { node: 'footman', text: 'footman', at: at('footman_mid') }],
    },
    {
      chapter: 'Band',
      caption: 'The heavy wheel keeps turning, and one doubled band takes it to the flyer and the bobbin.',
      duration: 5,
      angle: [-72, 14],
      fill: FILL,
      rate: 0.6,
      focus: MOVING,
      frame: WHOLE,
      flow: BAND,
      tags: [{ node: 'drive_band', text: 'band', at: at('band_top_mid') }],
    },
    {
      chapter: 'Twist',
      caption: `The flyer turns ${fmt(N.flyerRatio)} times a turn of the wheel, and each turn twists the yarn once.`,
      duration: 5,
      angle: [-102, 16],
      fill: FILL,
      rate: 0.3,
      focus: MOVING,
      frame: WHOLE,
      flow: YARN,
      carries: 'light',
      tags: [{ node: 'flyer', text: 'flyer', at: at('flyer_yoke') }, { node: 'fibre', text: 'fibre', at: at('fibre') }],
    },
    {
      chapter: 'Wind on',
      caption: 'Slowed down: the bobbin’s smaller whorl turns it faster than the flyer, so the yarn winds on.',
      duration: 6,
      angle: [-128, 24],
      fill: FILL,
      rate: 0.04,
      focus: MOVING,
      frame: WHOLE,
      tags: [{ node: 'flyer', text: 'flyer', at: at('flyer_tip'), ride: true }, { node: 'bobbin', text: 'bobbin', at: at('bobbin_rim'), ride: true }],
    },
  ],
  credit: polyHaven('spinning_wheel_01', 'Spinning Wheel 01', 'Sofia Pahaoja', {
    label: 'Built for this site',
    text: 'The model’s one mesh sorted into its parts and set turning on its own axles; the yarn, the fibre being drafted and the tension screw’s thread. The drive ratios come from the band’s grooves as modelled; the yarn is drawn at about 4 twists to the inch, and its twist shows as the flyer turns it.',
  }),
  build: { augment: 'objects/spinning-wheel/augment.mjs', hints: 'objects/spinning-wheel/hints.json' },
});

function missing(name) {
  throw new Error(`objects/spinning-wheel/hints.json has no "${name}": add it to the hints augment.mjs returns, then npm run models:build -- spinning-wheel`);
}
