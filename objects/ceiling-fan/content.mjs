// Writes content/ceiling-fan.json from the page's text and where the build put things (objects/ceiling-fan/hints.json),
// so no model-space number is pasted by hand. Run it after every build:
//   node objects/ceiling-fan/content.mjs
import { polyHaven, pose, readHints, space, writeContent } from '../../scripts/kit/content.mjs';

const H = readHints('ceiling-fan');
const { U } = space(H);
const at = (name) => H?.anchors?.[name] ?? (H ? missing(name) : [0, 0.3, 0]);
const pivot = (name) => H?.pivots?.[name] ?? (H ? missing(name) : [0, 0.3, 0]);
const off = (direction, mm, stage) => ({ direction, distance: U(mm), stage });
/** How far the switch cap drops when the model comes apart. Its chain is the lowest point, and the viewer keeps the lowest
 *  point on the floor, so the whole model apart stands that much higher. */
const CAP_DROP = 460;
/** Where an anchor is once the model is apart: moved down with its part (mm), and up with the whole. */
const apart = (name, mm = 0) => at(name).map((v, i) => (i === 1 ? +(v - U(mm) + U(CAP_DROP)).toFixed(4) : v));

/** The truth sheet's numbers (section 4): the Hampton Bay Bayfield's speeds and watts (the maker's figures), 120 V 60 Hz,
 *  18 poles (an estimate), and the blades' pitch as measured off the mesh. */
const RPM = H?.rpm ?? { low: 75, medium: 107, high: 151, field: 400 };
const WATTS = { low: 12, medium: 24, high: 51 };
const POLES = H?.poles ?? 18;
const FIELD_RPM = (120 * 60) / POLES;
const SLIP = Math.round((1 - RPM.high / FIELD_RPM) * 100);
const PITCH = H?.pitch ?? 13.7;
/** The blade tips' speed on high, from the mesh's 731 mm tip radius. */
const TIP_SPEED = ((2 * Math.PI * 0.731 * RPM.high) / 60).toFixed(1);

/** Anticlockwise seen from below (the summer setting, air down): about the downward axis. */
const DOWN = [0, -1, 0];
const turns = (rpm) => +(rpm / 60).toFixed(4);
/** Everything that turns with the rotor turns at its speed; the field turns at the synchronous speed. */
const TURNING = ['rotor', 'motor_housing'];

/** Solid through the film: what carries the current and what it moves. The canopy, the covers, the switch cup and the
 *  rotor's can are glass, so the windings, the field and the cage show through. */
const INSIDE = ['shaft', 'stator', 'main_winding', 'aux_winding', 'cage', 'speed_switch', 'capacitor', 'reverse_switch'];
/** The blades stay glass while the current, the field and the rotor are the story, so they don't hide the motor, and
 *  turn solid for the air: the one change of focus, at the chapter break where the subject changes. */
const BLADES = ['blade_1', 'blade_2', 'blade_3', 'blade_4'];
/** Slowed twenty times, so the field's poles can be followed: the rotor then turns once every eight seconds. */
const RATE = 0.05;
/** Where the camera looks in every shot, and from how far: leaning in on the motor and the switch cup, with the blade
 *  tips near the stage's sides, a little above its middle so the caption has room. One distance all through, and exact
 *  cameras, because the spinning blades' box changes width as the camera goes round. A little below the motor for the
 *  first three shots, so the field shows through the glass housing above the switch cup. */
const WHOLE = [0, H ? +(H.anchors.shaft_end[1] - 0.03).toFixed(4) : 0.21, 0];
const DISTANCE = 2.45;
const view = (angle) => pose(WHOLE, angle, DISTANCE);
/** The current's way: down the rod and the hollow shaft to the switch cup, through the pull-chain switch, and back up
 *  the shaft to the windings, the auxiliary winding's share through the capacitor. */
const mains = [at('canopy_centre'), at('downrod_centre'), at('shaft_centre'), at('shaft_end'), { node: 'speed_switch', at: at('speed_switch') }];
const toWindings = [{ node: 'speed_switch', at: at('speed_switch') }, { node: 'capacitor', at: at('capacitor') }, at('shaft_end'), at('shaft_motor'), at('aux_coil')];
const direct = [at('shaft_motor'), at('main_coil')];
/** The air: drawn down through the blades' disc on either side of the motor. */
const air = (k) => [0, 1, 2].map((i) => at(`air_${k}_${i}`));

writeContent('ceiling-fan', {
  order: 22,
  title: 'Ceiling Fan',
  hook: 'An inside-out motor: the windings hang still on the shaft and the outside turns round them, blades and all.',
  category: 'home',
  summary: [
    'A ceiling fan keeps people cool for the power of a light bulb, by moving air over them instead of chilling it. Its motor is an induction motor turned inside out: the coils stay still on a shaft hanging from the ceiling, and the steel shell round them turns and carries the blades, with no gears in between.',
    `Mains comes down the rod to a cup under the motor, where a pull-chain switch, a capacitor and a reverse switch sit. The stator inside the housing has ${H?.teeth ?? 36} teeth and two windings: the main winding on every other tooth, and the auxiliary winding, fed through the capacitor, on the teeth between. Round them turns the rotor, a steel can lined with laminated steel and ${H?.bars ?? 44} aluminium bars, on two ball bearings.`,
    `The capacitor makes the auxiliary winding’s current peak a quarter of a cycle before the main winding’s, so the north and south poles step round the stator: a field turning at ${FIELD_RPM} rpm. It drives currents round the rotor’s bars and drags the rotor after it, at ${RPM.high} rpm on high; the four blades, pitched at ${PITCH}°, push the air down. On this model the field, the rotor and the blades turn at those speeds.`,
  ],
  model: 'models/ceiling-fan.glb',
  viewAngle: [-30, 14],
  explodeAngle: [-30, 16],
  explodeDuration: 2800,
  facts: [
    { label: 'Speeds', value: `${RPM.low}, ${RPM.medium} and ${RPM.high} rpm` },
    { label: 'Power', value: `${WATTS.low}, ${WATTS.medium} and ${WATTS.high} W` },
    { label: 'Field', value: `${POLES} poles, ${FIELD_RPM} rpm at 60 Hz` },
    { label: 'Blade pitch', value: `${PITCH}°` },
    { label: 'Real size', value: '146 cm across, 52 cm ceiling to cap' },
  ],
  parts: [
    { node: 'canopy', label: 'Canopy and downrod', group: 'Mains', about: 'The canopy covers the box in the ceiling the fan hangs from; the mains comes down inside the hollow rod. Neither moves.', direction: [0, 1, 0], distance: 0 },
    { node: 'coupling_cover', label: 'Coupling cover', group: 'Mains', about: 'Hides the joint where the downrod’s foot is pinned to the motor’s shaft. It stays still while the housing just below it turns.', ...off([0, 1, 0], 160, 1) },
    { node: 'switch_housing', label: 'Switch cup', group: 'Switches', about: 'Hangs from the bottom of the fixed shaft, under the turning motor, so its switches stay put. Less than 2 mm separates it from the rotor.', ...off([0, -1, 0], 220, 0) },
    { node: 'speed_switch', label: 'Pull-chain switch', group: 'Switches', about: 'Each pull steps it round: high, medium, low, off. Each speed puts a different capacitor in series with the motor, or none.', direction: [0, 1, 0], distance: 0 },
    { node: 'capacitor', label: 'Capacitor', group: 'Switches', about: 'Three capacitors in one block of metallised plastic film: 4.5, 5 and 6 µF at 250 V. One runs the auxiliary winding; the others slow the motor.', direction: [0, 1, 0], distance: 0 },
    { node: 'reverse_switch', label: 'Reverse switch', group: 'Switches', about: 'Swaps which winding the capacitor feeds, so the field, the rotor and the blades turn the other way and lift the air instead.', direction: [0, 1, 0], distance: 0 },
    { node: 'switch_cap', label: 'Switch cap', group: 'Switches', about: 'Closes the cup. The switch plate inside carries the pull-chain switch and the capacitor; the chain comes out through it.', ...off([0, -1, 0], CAP_DROP, 0) },
    { node: 'shaft', label: 'Shaft', group: 'Stator', about: 'Hollow and fixed: it hangs from the downrod, carries the stator, and the motor’s leads run down inside it to the switch cup.', direction: [0, 1, 0], distance: 0 },
    { node: 'stator', label: 'Stator core', group: 'Stator', about: `A stack of thin steel sheets, 188 mm across and 20 mm thick, with ${H?.teeth ?? 36} teeth, held on the shaft by an aluminium hub. The red and blue band round it is the field, drawn: north and south poles at one instant.`, direction: [0, 1, 0], distance: 0 },
    { node: 'main_winding', label: 'Main winding', group: 'Stator', about: `${POLES} coils of enamelled copper, on every other tooth, wound so that neighbours make opposite poles. It takes the mains straight from the switch.`, direction: [0, 1, 0], distance: 0 },
    { node: 'aux_winding', label: 'Auxiliary winding', group: 'Stator', about: `${POLES} coils on the teeth in between, fed through the capacitor (red here to tell them apart). Their current peaks a quarter of a cycle early.`, direction: [0, 1, 0], distance: 0 },
    { node: 'rotor', label: 'Rotor', group: 'Rotor', about: 'A steel can round the stator, lined with a ring of laminated steel, on two 6202 ball bearings. The blade irons bolt to its underside.', ...off([0, -1, 0], 130, 3) },
    { node: 'cage', label: 'Squirrel cage', group: 'Rotor', about: `${H?.bars ?? 44} aluminium bars through the rotor’s ring, joined by a ring at each end. No wire reaches them: the field makes the currents in them.`, direction: [0, 1, 0], distance: 0 },
    { node: 'motor_housing', label: 'Motor housing', group: 'Rotor', about: `The painted cover, with the rotor’s lid and its top bearing inside. It turns with the rotor, at up to ${RPM.high} rpm.`, ...off([0, 1, 0], 45, 2) },
    ...[1, 2, 3, 4].map((k) => ({
      node: `blade_${k}`,
      label: `Blade ${k}`,
      group: 'Blades',
      about: k === 1
        ? `Each of the four blades is screwed to a steel blade iron that holds it at ${PITCH}°, leading edge high, so it pushes air down as it turns.`
        : `One of four, a quarter turn on from blade ${k - 1}, on its own blade iron.`,
      direction: DOWN,
      distance: U(9),
      stage: 1,
      then: { direction: H?.blades?.[`blade_${k}`] ?? [0, 0, 1], distance: U(330) },
    })),
  ],
  annotations: [
    {
      title: 'Pull chain',
      text: `Each pull steps the switch: high, medium, low, off. On low a 5 µF capacitor in series takes up about half the 120 volts and the fan draws ${WATTS.low} W; on high nothing is in the way and it draws ${WATTS.high} W.`,
      node: 'speed_switch',
      position: at('chain_top'),
      camera: pose(at('cup_low'), [-20, 8], 1.15, { card: 'right' }),
    },
    {
      title: 'Capacitor',
      text: 'A capacitor’s current runs ahead of its voltage. Through it, the auxiliary winding’s current peaks a quarter of a cycle, about 4 ms, before the main winding’s.',
      node: 'capacitor',
      position: at('capacitor'),
      explode: 1,
      camera: pose(apart('capacitor', CAP_DROP), [-40, 34], 0.95, { card: 'right' }),
    },
    {
      title: 'Two windings',
      text: `Main coils on every other tooth, auxiliary coils between, 10° apart. With ${POLES} poles, 10° is a quarter of a cycle: two currents a quarter of a cycle apart, in coils a quarter of a cycle apart.`,
      node: 'main_winding',
      position: at('main_coil_low'),
      explode: 1,
      camera: pose(apart('main_coil_low'), [-20, -20], 0.8, { card: 'right' }),
    },
    {
      title: 'Rotating field',
      text: `Red north, blue south, nine of each. Every half cycle the pattern moves on one pole, 120 times a second, so the field goes round at ${FIELD_RPM} rpm.`,
      node: 'stator',
      position: at('field'),
      explode: 1,
      camera: pose(apart('field'), [-15, 12], 0.8, { card: 'right' }),
    },
    {
      title: 'Squirrel cage',
      text: `The field sweeps through ${H?.bars ?? 44} aluminium bars and drives currents round them through the end rings; in the field those currents are pushed sideways, so the rotor follows. It never catches up: at ${RPM.high} rpm it slips ${SLIP}% behind.`,
      node: 'cage',
      position: at('bars'),
      explode: 1,
      camera: pose(apart('bars', 130), [-15, 20], 0.85, { card: 'right' }),
    },
    {
      title: 'Inside out',
      text: 'In most motors the rotor spins inside the coils. Here the can round them turns, on two ball bearings, and the blade irons bolt straight to it: no gears, no belt.',
      node: 'rotor',
      position: at('rotor_underside'),
      explode: 0,
      camera: pose(at('housing'), [-25, -10], 1.3, { card: 'right' }),
    },
    {
      title: 'Blades',
      text: `Four blades at ${PITCH}°, leading edge high. Turning anticlockwise seen from below at ${RPM.high} rpm, tips at ${TIP_SPEED} m/s, they push a column of air down into the room.`,
      node: 'blade_1',
      ride: true,
      position: at('blade'),
      explode: 0,
      camera: pose(at('blade_root'), [-30, 26], 2, { card: 'right' }),
    },
    {
      title: 'It doesn’t cool the air',
      text: `A fan cools people, not rooms: all ${WATTS.high} W it draws ends up as heat in the room. Air moving at 0.5 m/s takes heat off skin and dries sweat faster, so it feels about 2 °C cooler. In an empty room, switch it off.`,
      node: 'motor_housing',
      position: at('housing'),
      explode: 0,
      camera: pose(at('housing'), [-35, 18], 2.4, { card: 'right' }),
    },
  ],
  motion: [
    ...TURNING.map((node) => ({ node, axis: DOWN, pivot: pivot('axis'), speed: turns(RPM.high) })),
    { node: 'field', axis: DOWN, pivot: pivot('axis'), speed: turns(FIELD_RPM) },
  ],
  motionLabel: 'Switch on',
  // "How it works" as an animation, slowed twenty times: the current reaches the windings, the field starts turning,
  // the rotor is dragged after it, and the blades push the air down.
  film: [
    {
      chapter: 'Current',
      caption: '120 V comes down to the switch cup, then up to the windings: one direct, one through the capacitor.',
      duration: 5,
      camera: view([-40, -8]),
      rate: RATE,
      focus: INSIDE,
      spin: { rotor: 0, motor_housing: 0, field: 0 },
      flows: [mains, toWindings, direct],
      tags: [{ node: 'capacitor', text: 'capacitor', at: at('capacitor') }],
    },
    {
      chapter: 'Field',
      caption: `The capacitor puts the two currents a quarter-cycle apart, so the poles march round: a field at ${FIELD_RPM} rpm.`,
      duration: 6,
      camera: view([-20, -8]),
      rate: RATE,
      focus: INSIDE,
      spin: { rotor: 0.25, motor_housing: 0.25, field: 1 },
      tags: [{ node: 'stator', text: 'rotating field', at: at('field_tag') }],
    },
    {
      chapter: 'Rotor',
      caption: `It sweeps through the cage’s bars; the currents it drives in them drag the rotor after it at ${RPM.high} rpm.`,
      duration: 6,
      camera: view([0, -8]),
      rate: RATE,
      focus: INSIDE,
      tags: [{ node: 'cage', text: 'cage', at: at('cage_tag') }],
    },
    {
      chapter: 'Air',
      caption: `Pitched at ${PITCH}°, leading edge high, the four blades push a column of air down into the room.`,
      duration: 5,
      camera: view([20, 6]),
      rate: RATE,
      focus: [...INSIDE, ...BLADES],
      carries: 'air',
      flows: [0, 1, 2, 3].map(air),
    },
  ],
  credit: polyHaven('ceiling_fan', 'Ceiling Fan', 'Ulan Cabanilla', {
    label: 'Built for this site',
    text: `The shell cut open, and the blades mirrored so they pitch like a US fan’s. The motor (fixed hollow shaft, stator with its two windings, rotor with its cage, two bearings) and the switch cup’s pull-chain switch, capacitor and reverse switch, at typical sizes; the ${POLES} poles, ${H?.bars ?? 44} bars and stator size are estimates, and the windings are drawn as solid coils. Speeds and watts are the maker’s figures for a 52-inch Hampton Bay Bayfield; the red and blue band is the field, drawn.`,
  }),
  build: { augment: 'objects/ceiling-fan/augment.mjs', hints: 'objects/ceiling-fan/hints.json' },
});

function missing(name) {
  throw new Error(`objects/ceiling-fan/hints.json has no "${name}": add it to the hints augment.mjs returns, then npm run models:build -- ceiling-fan`);
}
