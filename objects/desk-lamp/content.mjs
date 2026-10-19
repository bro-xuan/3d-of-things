// Writes content/desk-lamp.json from the page's text and where the build put the lamp's pins and pivots
// (objects/desk-lamp/hints.json, written by `npm run models:build -- desk-lamp`). Run it after every build:
//   node objects/desk-lamp/content.mjs
// The arm moves by four controls that src/viewer/balancedarm.ts sets from the arm's two angles: `arm_lower` and
// `arm_upper` (degrees from the pose as modelled) and each spring pair's swing about its anchor. The numbers in the
// words are that module's (and the truth sheet's): 3.83 and 2.32 N·m at sin θ = 1, 270 and 293 N/m a pair.
import { polyHaven, pose, readHints, writeContent } from '../../scripts/kit/content.mjs';

const H = readHints('desk-lamp');
const at = (name) => H.anchors[name];
const pivot = (name) => H.pivots[name];
const PER_DEGREE = 1 / 360;

/** The lower arm and its parallel link turn about their base pins; the elbow plates ride on the arm and turn back as
 *  far, so they only shift (the parallelogram); the same again for the upper arm and the head bracket. */
const motion = [
  { node: 'lower_arm', axis: [1, 0, 0], pivot: pivot('shoulder'), control: 'arm_lower', turn: PER_DEGREE },
  { node: 'lower_link', axis: [1, 0, 0], pivot: pivot('link'), control: 'arm_lower', turn: PER_DEGREE },
  { node: 'elbow_plates', axis: [1, 0, 0], pivot: pivot('elbow'), control: 'arm_lower', turn: -PER_DEGREE },
  { node: 'upper_bar', axis: [-1, 0, 0], pivot: pivot('elbow'), control: 'arm_upper', turn: PER_DEGREE },
  { node: 'upper_link', axis: [-1, 0, 0], pivot: pivot('upper_link'), control: 'arm_upper', turn: PER_DEGREE },
  { node: 'head_bracket', axis: [-1, 0, 0], pivot: pivot('head'), control: 'arm_upper', turn: -PER_DEGREE },
  ...['left', 'right'].flatMap((side) => [
    { node: `lower_spring_${side}`, axis: [1, 0, 0], pivot: pivot('lower_anchor'), control: 'arm_spring_lower', turn: PER_DEGREE },
    { node: `upper_spring_${side}`, axis: [-1, 0, 0], pivot: pivot('upper_anchor'), control: 'arm_spring_upper', turn: PER_DEGREE },
  ]),
];

const SPRINGS = ['upper_spring_left', 'upper_spring_right', 'lower_spring_left', 'lower_spring_right'];
const UPPER_ARM = ['head_bracket', 'upper_bar', 'upper_link'];
const LOWER_ARM = ['elbow_plates', 'lower_arm', 'lower_link'];
const HEAD = ['shade', 'bulb', 'lamp_holder'];
const BASE = ['base_bracket', 'clamp', 'clamp_screw'];
const shadeAxis = [0, -0.83, -0.56];

/** The weight's way down to the desk: head, upper arm, elbow, lower arm, shoulder, clamp. */
const weightPath = [
  { node: 'shade', at: at('bulb'), ride: true },
  { node: 'head_bracket', at: at('head'), ride: true },
  { node: 'upper_bar', at: at('upper_bar'), ride: true },
  { node: 'elbow_plates', at: at('elbow'), ride: true },
  { node: 'lower_arm', at: at('lower_arm'), ride: true },
  { node: 'base_bracket', at: at('shoulder') },
  { node: 'clamp', at: at('clamp') },
];

const torqueChart = (caption) => ({
  type: 'arm-torque',
  title: 'Torque about each pivot',
  caption,
});

writeContent('desk-lamp', {
  order: 16,
  title: 'Desk Lamp',
  hook: 'Its springs balance the head’s weight at every angle, so the arm stays wherever you let it go.',
  category: 'home',
  summary: [
    'A desk lamp has to put its light anywhere within reach and stay there, without a knob to tighten at every joint. George Carwardine’s answer, patented in 1932, was a spring whose pull grows with its whole length, hung from a point straight above each pivot. Its torque then rises and falls with the arm’s angle exactly as the weight’s does, and the two cancel everywhere.',
    'The head hangs on a bracket at the end of the upper arm, two bars that make a parallelogram and keep it at one angle. Two springs from a pin above the elbow pivot answer the upper arm. The elbow plates are the far side of a second parallelogram, the lower arm and its parallel link, so they never turn; two more springs from a pin above the shoulder answer everything above it, and the clamp takes it all into the desk.',
    'Move the head and each arm turns about its pin while its springs stretch or shorten, storing exactly the energy the head gives up. Here the arm moves on sliders, the springs stretch with it and the chart plots both torques from the same numbers; hold the springs off and the arm drops. The masses are estimates and the springs ideal, and the model’s two parallelograms were trued by up to 5 mm.',
  ],
  model: 'models/desk-lamp.glb',
  viewAngle: [-62, 12],
  explodeAngle: [-38, 16],
  explodeDuration: 2200,
  facts: [
    { label: 'Size', value: '89 cm tall, 61 cm deep as posed' },
    { label: 'Arms', value: '442 mm and 464 mm, pin to pin' },
    { label: 'Springs', value: 'Two pairs: 270 and 293 N/m' },
    { label: 'Balance', value: 'k·a·b = m·g·L, at every angle' },
    { label: 'Principle', value: 'G. Carwardine, GB 404,615, 1932' },
  ],
  parts: [
    { node: 'shade', label: 'Shade', group: 'The load', about: 'A steel cone that throws the light down and keeps it out of your eyes. Its own knuckle on the bracket tilts it and holds it by friction: the one joint here that friction does hold.', direction: [0, 0.15, -1], distance: 0.13, stage: 1 },
    { node: 'bulb', label: 'Bulb', group: 'The load', about: 'A pear-shaped E27 bulb, a few tens of grams of the head’s 0.4 kg (an estimate).', direction: shadeAxis, distance: 0.2, stage: 0 },
    { node: 'lamp_holder', label: 'Lamp holder', group: 'The load', about: 'The E27 holder the bulb screws into. Its cable loops out of the shade’s back and along the arm.', direction: shadeAxis, distance: 0, stage: 1 },
    { node: 'head_bracket', label: 'Head bracket', group: 'Upper arm', about: 'Two plates pinned to both upper bars. The bars stay parallel, so the bracket shifts as the arm moves but never turns: the head keeps the angle you gave it.', direction: [0, 0.66, -0.75], distance: 0.06, stage: 2 },
    { node: 'upper_bar', label: 'Upper bar', group: 'Upper arm', about: 'The lower of the upper arm’s two bars, 464 mm pin to pin. It turns about the elbow pin, and the upper springs pull on a pin 218 mm along it.', direction: [0, 1, 0], distance: 0, stage: 3 },
    { node: 'upper_link', label: 'Upper link', group: 'Upper arm', about: 'The upper bar’s partner, pinned 36 mm above it at both ends. The two make a parallelogram that carries the head level.', direction: [0, 1, 0], distance: 0, stage: 3 },
    { node: 'upper_spring_left', label: 'Upper spring, left', group: 'Upper springs', about: 'One of the upper pair: from the pin 36.3 mm straight above the elbow pivot to the pin 218 mm along the upper bar. Wound with initial tension, it pulls in proportion to its whole length.', direction: [0, 1, 0], distance: 0, stage: 3 },
    { node: 'upper_spring_right', label: 'Upper spring, right', group: 'Upper springs', about: 'The other of the upper pair. Between them they pull with 293 N for every metre of their length: 57 N as modelled.', direction: [0, 1, 0], distance: 0, stage: 3 },
    { node: 'elbow_plates', label: 'Elbow plates', group: 'Lower arm', about: 'The plates that join the arms. They’re the far side of the lower parallelogram, so they never turn, and the upper springs’ anchor stays straight above the elbow pivot.', direction: [0, 0.78, 0.62], distance: 0.05, stage: 3 },
    { node: 'lower_arm', label: 'Lower arm', group: 'Lower arm', about: 'Two side bars, 442 mm from the shoulder pin to the elbow. Everything above the elbow, about 0.7 kg, hangs on its far end.', direction: [0, 1, 0], distance: 0, stage: 3 },
    { node: 'lower_link', label: 'Parallel link', group: 'Lower arm', about: 'A bar the same length as the lower arm, pinned to the base bracket and the elbow plates. It keeps the plates from turning as the lower arm moves.', direction: [0, 1, 0], distance: 0, stage: 3 },
    { node: 'lower_spring_left', label: 'Lower spring, left', group: 'Lower springs', about: 'One of the lower pair: from a pin 65.7 mm straight above the shoulder pin to the pin 216 mm along the lower arm.', direction: [0, 1, 0], distance: 0, stage: 3 },
    { node: 'lower_spring_right', label: 'Lower spring, right', group: 'Lower springs', about: 'The other of the lower pair. Between them they pull with 270 N for every metre of their length: 46 N as modelled.', direction: [0, 1, 0], distance: 0, stage: 3 },
    { node: 'base_bracket', label: 'Base bracket', group: 'Base', about: 'The fixed side of the lower parallelogram: it carries the shoulder pin, the parallel link’s pin and the lower springs’ anchors, and turns on the clamp.', direction: [0, 1, 0], distance: 0, stage: 3 },
    { node: 'clamp', label: 'Clamp', group: 'Base', about: 'A screw clamp for the desk’s edge. The springs’ pull and the lamp’s weight go into the desk here.', direction: [0, 1, 0], distance: 0, stage: 3 },
    { node: 'clamp_screw', label: 'Clamp screw', group: 'Base', about: 'Turned up under the desk by its tommy bar, it squeezes the desk top against the clamp’s upper jaw.', direction: [0, 1, 0], distance: 0, stage: 3 },
  ],
  annotations: [
    {
      title: 'The load',
      text: 'The head (shade, bulb and holder) weighs about 0.4 kg and hangs 464 mm out from the elbow. Its pull about the elbow pin is 2.32 N·m times the sine of the upper arm’s angle from upright: nothing standing up, most lying level.',
      position: at('shade_top'),
      node: 'shade',
      camera: pose(at('shade'), [-55, 18], 1.8, { card: 'right' }),
    },
    {
      title: 'A head that keeps its angle',
      text: 'The upper arm is two bars pinned 36 mm apart at both ends, a parallelogram, so the head bracket shifts but never turns. Move the arm and the light still points the way you aimed it.',
      position: at('head_link'),
      node: 'head_bracket',
      camera: pose(at('head'), [-80, 12], 1.5, { card: 'right' }),
    },
    {
      title: 'Upper springs',
      text: 'Two springs from a pin straight above the elbow pivot to a pin 218 mm along the upper bar. Their torque about the elbow is k × 36.3 mm × 218 mm × sin ψ; at 293 N/m that is 2.32 N·m × sin ψ, the weight’s own curve.',
      position: at('upper_spring'),
      node: 'upper_spring_right',
      camera: pose(at('upper_spring'), [-70, 15], 1.6, { card: 'left' }),
    },
    {
      title: 'Pull in proportion to length',
      text: 'The springs are wound with initial tension: their coils stay pressed together until pulled as hard as their rate times their closed length. Past that, the pull is proportional to the whole length, as if the spring could shorten to nothing. An ordinary spring of the same rate would hold under half the weight.',
      position: at('upper_pin'),
      node: 'upper_bar',
      camera: pose(at('upper_pin'), [-75, 8], 1.3, { card: 'left' }),
    },
    {
      title: 'Elbow plates that never turn',
      text: 'The elbow plates are the far side of the lower parallelogram (lower arm, parallel link, base bracket), so they move but never turn. That keeps the upper springs’ anchor straight above the elbow pivot, as the balance needs, whatever the lower arm does.',
      position: at('link_elbow'),
      node: 'elbow_plates',
      camera: pose(at('elbow'), [-85, 10], 1.4, { card: 'left' }),
    },
    {
      title: 'Lower springs',
      text: 'Two springs from a pin 65.7 mm above the shoulder pivot to a pin 216 mm along the lower arm. They answer everything above the shoulder, 3.83 N·m × sin θ, with 270 N/m between them.',
      position: at('lower_spring'),
      node: 'lower_spring_right',
      camera: pose(at('lower_spring'), [-65, 15], 1.6, { card: 'right' }),
    },
    {
      title: 'Not friction',
      text: 'The joints aren’t stiff: the springs carry the whole weight at every angle, and the pins turn freely. Held by friction alone, the shoulder would need to grip with up to 3.8 N·m, and you’d fight that grip every time you moved the lamp.',
      position: at('shoulder'),
      node: 'base_bracket',
      camera: pose(at('base'), [-60, 15], 1.4, { card: 'right' }),
    },
    {
      title: 'Into the desk',
      text: 'The bracket turns on the clamp, and the screw squeezes the desk top between the jaws. The springs’ pull and the lamp’s weight both end here.',
      position: at('clamp'),
      node: 'clamp',
      camera: pose(at('clamp'), [-40, 15], 1.3, { card: 'right' }),
    },
  ],
  motion,
  how: [
    {
      label: 'The idea',
      title: 'Weightless, not held',
      text: [
        'The head’s weight comes down the arm to the clamp, and at each pivot a pair of springs answers it. Their pull is set so that their torque matches the weight’s at every angle, not just one: wherever you leave the head, nothing is left over to move it.',
        'The upper arm carries 0.4 kg of head 464 mm out; the lower arm carries everything above the elbow, about 0.7 kg, 442 mm out. Four springs, no counterweight, and joints that turn freely.',
      ],
      angle: [-62, 12],
      fill: 0.8,
      flow: weightPath,
      tags: [
        { node: 'shade', text: '0.4 kg', at: at('shade_top') },
        { node: 'upper_spring_right', text: 'upper springs', at: at('upper_spring') },
        { node: 'lower_spring_right', text: 'lower springs', at: at('lower_spring') },
      ],
    },
    {
      label: 'The load',
      title: 'The weight pulls hardest with the arm level',
      text: [
        'About the elbow pin, the head pulls with its weight times its sideways distance from the pin: 0.4 kg × 9.81 × 464 mm × sin ψ, where ψ is the upper arm’s angle from upright. Upright the head sits over the pin and pulls nothing; level, it pulls 1.8 N·m, and the bars add 0.5 more.',
        'That sine is what the springs have to copy. Any spring that pulled harder at one angle and softer at another would leave the head drifting up or down.',
      ],
      angle: [-70, 14],
      fill: 0.7,
      focus: [...HEAD, 'head_bracket', 'upper_bar', 'upper_link'],
      tags: [
        { node: 'shade', text: '0.4 kg', at: at('shade_top') },
        { node: 'upper_bar', text: '464 mm', at: at('upper_bar') },
      ],
    },
    {
      label: 'Springs',
      title: 'A spring that pulls in proportion to its length',
      text: [
        'Each pair hangs from a pin straight above its pivot, a above it, and pulls on a pin b along the arm. If its pull is k times its whole length, its torque about the pivot works out at k·a·b·sin ψ: the same sine as the weight’s. Choose k·a·b = m·g·L and the two cancel at every angle.',
        'For the upper arm a is 36.3 mm and b 218 mm, so the pair needs 293 N/m. Move the arms and watch the springs stretch and both torques move together on the chart.',
      ],
      angle: [-78, 10],
      fill: 0.62,
      focus: ['upper_spring_left', 'upper_spring_right', 'upper_bar', 'elbow_plates'],
      frame: [...HEAD, ...UPPER_ARM, ...LOWER_ARM, ...BASE],
      chart: torqueChart('Solid, the weight’s torque; dashed, the springs’. They lie on one another at every angle. Dotted: springs of the same rate without initial tension.'),
      try: 'arm',
      tags: [
        { node: 'upper_spring_right', text: 'k = 293 N/m', at: at('upper_spring'), ride: true },
        { node: 'elbow_plates', text: 'a = 36.3 mm', at: at('upper_anchor'), ride: true },
      ],
    },
    {
      label: 'Parallelograms',
      title: 'Two parallelograms keep the head level and the anchors upright',
      text: [
        'Each arm is a pair of bars of equal length, pinned at both ends: a parallelogram. As it swings, the part at its far end shifts without turning. The head bracket keeps the head’s angle, and the elbow plates keep the upper springs’ anchor straight above the elbow pivot.',
        'That makes the two arms independent. Move the lower arm and the upper arm’s balance doesn’t change, because nothing it hangs from has turned.',
      ],
      angle: [-80, 8],
      fill: 0.55,
      focus: [...UPPER_ARM, ...LOWER_ARM, 'base_bracket'],
      frame: [...HEAD, ...UPPER_ARM, ...LOWER_ARM, ...BASE],
      tags: [
        { node: 'head_bracket', text: 'shifts, never turns', at: at('head_link') },
        { node: 'elbow_plates', text: 'shifts, never turns', at: at('link_elbow') },
      ],
    },
    {
      label: 'Lower arm',
      title: 'The lower springs carry everything above the elbow',
      text: [
        'The lower arm carries the head, the upper arm and the elbow, about 0.7 kg at its end and its own bars along it: 3.83 N·m × sin θ about the shoulder pin. Its springs hang 65.7 mm above the pin and pull 216 mm along the arm, so the pair needs 270 N/m.',
        'At the pose modelled, 38° from upright, that is 2.4 N·m each way, and the springs pull 46 N between them.',
      ],
      angle: [-66, 12],
      fill: 0.7,
      focus: ['lower_spring_left', 'lower_spring_right', 'lower_arm', 'lower_link', 'base_bracket'],
      chart: torqueChart('The lower arm’s curve is the taller: it carries more. The dots mark the arms’ angles now.'),
      tags: [
        { node: 'lower_spring_right', text: 'k = 270 N/m', at: at('lower_spring') },
        { node: 'base_bracket', text: 'a = 65.7 mm', at: at('lower_anchor') },
      ],
    },
    {
      label: 'Not friction',
      title: 'Unhook the springs and it falls',
      text: [
        'It looks as if stiff joints hold the arm where you leave it, but the pins turn freely: the springs carry all the weight. Hold the springs off and the weight has nothing to answer it, and the arm drops to its stops. Let go and the springs are back on: it stays wherever it got to, because it balances there too.',
        'To hold the arm by friction alone, the shoulder would have to grip with up to 3.8 N·m, and every move would mean forcing it.',
      ],
      angle: [-64, 12],
      fill: 0.62,
      frame: [...HEAD, ...UPPER_ARM, ...LOWER_ARM, ...BASE],
      chart: torqueChart('With the springs off, their dots drop to nothing while the weight’s stay on the curve.'),
      try: 'unhook',
    },
  ],
  credit: polyHaven('desk_lamp_arm_01', 'Desk Lamp Arm 01', 'Kuutti Siitonen (modelling and texturing) & Yann Kervran (rigging)', {
    label: 'Changed for this site',
    text: 'Cut into its links and pinned to move; the springs rebuilt as coils that stretch; both parallelograms trued (pins moved up to 5 mm). Balance after G. Carwardine, GB 404,615 (1932), and M. J. French & M. B. Widden (2000); masses estimated.',
  }),
  build: { augment: 'objects/desk-lamp/augment.mjs', hints: 'objects/desk-lamp/hints.json' },
});
