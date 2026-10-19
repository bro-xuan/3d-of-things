// Writes content/hand-drill.json. Converted key for key on 18 October 2026 from the hand-written JSON the page
// shipped with, so it writes the same file byte for byte. Its positions and cameras are still typed in model
// space, as they were in the JSON: when the model changes, place them from the model with placer(nodeBounds(...))
// (scripts/kit/nodes.mjs), as the newer objects' builders do.
//   node objects/hand-drill/content.mjs
import { writeContent } from '../../scripts/kit/content.mjs';

/** What stays solid through the film: the crank and its wheel, the two pinions, the chuck and bit. The frame is glass. */
const MOVING = ['vintage_hand_drill_crank', 'vintage_hand_drill_cog1', 'vintage_hand_drill_cog2', 'vintage_hand_drill_head'];
/** Every shot frames the whole drill, top handle to bit, on parts whose box doesn't change as they turn (the crank's
 *  handle would swing it about), at one size: the camera only goes round. */
const WHOLE = ['vintage_hand_drill', 'vintage_hand_drill_head'];
const FILL = 0.68;

/** The power's path: from the hand on the handle, round the crank to its axle, down the wheel to where its teeth meet the
 *  pinion, and down the spindle through the chuck to the bit's tip. */
const powerPath = [
  { node: 'vintage_hand_drill_crank', at: [0.212, 0.508, 0.262], ride: true },
  { node: 'vintage_hand_drill_crank', at: [0.08, 0.72, 0.2], ride: true },
  { node: 'vintage_hand_drill_crank', at: [-0.014, 0.908, 0.16], ride: true },
  { node: 'vintage_hand_drill_crank', at: [-0.014, 0.8, 0.062] },
  { node: 'vintage_hand_drill_cog2', at: [-0.013, 0.69, 0.062] },
  { node: 'vintage_hand_drill_cog2', at: [-0.013, 0.689, -0.006] },
  { node: 'vintage_hand_drill_head', at: [-0.013, 0.5, -0.006] },
  { node: 'vintage_hand_drill_head', at: [-0.013, 0.03, -0.006] },
];

writeContent('hand-drill', {
  order: 1,
  title: 'Hand Drill',
  hook: 'Every turn of the handle spins the bit three and a third times.',
  category: 'gears',
  summary: [
    'A hand drill is a gearbox you can see through. The handle turns a large wheel with 80 teeth cut into its face, and those teeth drive a 24-tooth pinion on the spindle that carries the chuck.',
    '80 divided by 24 is 3⅓, so each turn of the handle turns the bit three and a third times. The price is torque: the bit gets less twisting force than your hand puts in, a good trade for drilling small holes in wood, where speed matters more than force.',
  ],
  model: 'models/hand-drill.glb',
  viewAngle: [-24, 12],
  facts: [{ label: 'Gear ratio', value: '80 : 24 teeth' }, { label: 'Bit turns per crank', value: '3⅓' }, { label: 'Real size', value: '49 cm tall' }],
  parts: [
    {
      node: 'vintage_hand_drill_crank',
      label: 'Crank & drive wheel',
      about: 'The crank turns the big wheel, whose 80 teeth, cut into its face, drive the pinions.',
      direction: [0, 0, 1],
      distance: 0.5,
      stage: 0,
    },
    {
      node: 'vintage_hand_drill_cog1',
      label: 'Idler pinion',
      about: 'Meshes with the top of the wheel to keep its teeth engaged. It drives nothing.',
      direction: [0, 0.35, 1],
      distance: 0.26,
      stage: 1,
    },
    {
      node: 'vintage_hand_drill_cog2',
      label: 'Drive pinion',
      about: '24 teeth on the spindle: it turns three and a third times for every turn of the handle.',
      direction: [0, -1, 0],
      distance: 0.18,
      stage: 1,
    },
    {
      node: 'vintage_hand_drill_head',
      label: 'Chuck & bit',
      about: 'Jaws inside the sleeve close round the bit’s shank and keep it centred on the spindle.',
      direction: [0, -1, 0],
      distance: 0.36,
      stage: 1,
    },
    { node: 'vintage_hand_drill', label: 'Frame & handle', about: 'The frame holds the gears in mesh. You push on the handle while you crank.', direction: [0, 1, 0], distance: 0 },
  ],
  motion: [
    { node: 'vintage_hand_drill_crank', axis: [0, 0, 1], pivot: [-0.014, 0.908, 0.07], speed: -0.4 },
    { node: 'vintage_hand_drill_cog2', axis: [0, 1, 0], pivot: [-0.013, 0.689, -0.006], speed: -1.3333 },
    { node: 'vintage_hand_drill_head', axis: [0, 1, 0], pivot: [-0.013, 0.3, -0.006], speed: -1.3333 },
    { node: 'vintage_hand_drill_cog1', axis: [0, 1, 0], pivot: [-0.013, 1.144, -0.006], speed: 1.3333 },
  ],
  motionLabel: 'Turn the crank',
  // "How it works" as an animation: the crank turns the wheel, its teeth spin the pinion, the pinion the bit.
  film: [
    {
      chapter: 'Crank',
      caption: 'Your hand on the crank turns the big wheel round, once for every turn of the handle.',
      duration: 6,
      angle: [-55, 12],
      fill: FILL,
      focus: MOVING,
      frame: WHOLE,
      flow: powerPath,
      tags: [{ node: 'vintage_hand_drill_crank', text: 'handle', at: [0.212, 0.508, 0.262], ride: true }],
    },
    {
      chapter: 'Gears',
      caption: 'Its 80 face teeth turn the 24-tooth pinion on the spindle 3⅓ times for every turn.',
      duration: 7,
      angle: [-110, 14],
      fill: FILL,
      focus: MOVING,
      frame: WHOLE,
      flow: powerPath,
      tags: [
        { node: 'vintage_hand_drill_crank', text: '80 teeth', at: [-0.2, 0.86, 0.06] },
        { node: 'vintage_hand_drill_cog2', text: '24 teeth', at: [-0.07, 0.66, -0.006] },
      ],
    },
    {
      chapter: 'Bit',
      caption: 'The chuck turns with the spindle, so the bit spins 3⅓ times as fast as your hand.',
      duration: 6,
      angle: [-155, 10],
      fill: FILL,
      focus: MOVING,
      frame: WHOLE,
      flow: powerPath,
      tags: [
        { node: 'vintage_hand_drill_cog2', text: '24 teeth', at: [-0.07, 0.66, -0.006] },
        { node: 'vintage_hand_drill_head', text: 'bit', at: [0, 0.12, 0] },
      ],
    },
  ],
  annotations: [
    {
      title: 'Crank handle',
      text: 'Your arm is the motor. The crank arm is a lever, so the further the handle sits from the axle, the more turning force each push gives the wheel.',
      node: 'vintage_hand_drill_crank',
      position: [0.202, 0.505, 0.235],
      camera: { position: [-0.008, 0.767, 1.283], target: [0.202, 0.505, 0.235] },
      ride: true,
    },
    {
      title: 'Face gear',
      text: 'The big wheel carries its 80 teeth on its back face rather than its rim. That lets it mesh with pinions whose shafts run at right angles to its own, turning the sideways crank into the drill\'s vertical spin.',
      node: 'vintage_hand_drill_crank',
      position: [-0.168, 1.072, 0.064],
      camera: { position: [-0.772, 1.324, -0.942], target: [-0.168, 1.072, 0.064] },
    },
    {
      title: 'Drive pinion',
      text: 'This 24-tooth pinion is fixed to the spindle. It has to turn 80 ÷ 24 = 3⅓ times to let one full turn of the wheel\'s teeth go by, and the chuck below turns with it.',
      node: 'vintage_hand_drill_cog2',
      position: [0.038, 0.689, -0.006],
      camera: { position: [0.754, 0.779, -0.543], target: [0.038, 0.689, -0.006] },
    },
    {
      title: 'Idler pinion',
      text: 'A second pinion meshes with the top of the wheel and turns the opposite way. It drives nothing: it supports the wheel so the teeth stay meshed when you lean on the drill.',
      node: 'vintage_hand_drill_cog1',
      position: [0.036, 1.154, -0.006],
      camera: { position: [0.763, 1.427, -0.461], target: [0.036, 1.154, -0.006] },
    },
    {
      title: 'Chuck',
      text: 'Jaws inside the knurled sleeve close around the bit\'s shank when you twist the sleeve, holding it centred on the spindle.',
      node: 'vintage_hand_drill_head',
      position: [0.014, 0.425, 0.047],
      camera: { position: [0.457, 0.558, 0.933], target: [0.014, 0.425, 0.047] },
    },
    {
      title: 'Handle',
      text: 'You push down on the top handle while you crank. The gears supply the speed; the pressure that makes the bit bite into the wood comes from you.',
      node: 'vintage_hand_drill',
      position: [0.01, 1.626, 0.052],
      camera: { position: [0.582, 1.855, 1.197], target: [0.01, 1.626, 0.052] },
    },
  ],
  credit: {
    title: 'Vintage Hand Drill',
    author: 'Yann Kervran & Benjamin McDonnell',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    source: 'Poly Haven',
    sourceUrl: 'https://polyhaven.com/a/vintage_hand_drill',
  },
});
