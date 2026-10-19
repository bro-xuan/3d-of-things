// Writes content/garden-sprinkler.json from the page's text and where the model's parts sit (read from the
// built model, so no model-space number is pasted by hand). Run it after every build:
//   node objects/garden-sprinkler/content.mjs
import { polyHaven, pose, space, writeContent } from '../../scripts/kit/content.mjs';
import { nodeBounds, placer } from '../../scripts/kit/nodes.mjs';

const N = await nodeBounds('garden-sprinkler');
const { centre } = placer(N);
const { M, U } = space({ space: N?.space });
const node = (part) => `garden_sprinkler_01_${part}`;
const [BODY, ARM, LEFT, RIGHT, WHEELS] = ['body_main', 'spinner', 'nozel_left', 'nozel_right', 'wheels'].map(node);

// Points in millimetres in the model's own frame (the swivel's axis is x = 0, z = 0), from its mesh. Each jet runs on
// from its nozzle's tip the way the nozzle points: outwards, 20° up and 13° back against the turn.
const P = {
  connector: M(0, 58, 100),
  column_foot: M(0, 52, 2),
  column_top: M(0, 142, 2),
  hub: M(0, 167, 0),
  arm_left: M(-75, 176, 7),
  arm_right: M(75, 176, -7),
  tip_left: M(-172, 195, 18),
  tip_right: M(172, 195, -18),
  jet_left: M(-222, 214, 30),
  jet_right: M(222, 214, -30),
  wheel: M(150, 37, -110),
};
// The arm turns clockwise seen from above (negative about +y), at about 166 rpm at 2 bar.
const RPM = 166;
const off = (direction, mm, window) => ({ direction, distance: U(mm), window });

/** What stays solid through the film: the arm and its nozzles. The frame and its column are glass, so the water can be
 *  seen coming up inside. Every shot frames the whole sprinkler, with room for the arm as it goes round. */
const SPINNING = [ARM, LEFT, RIGHT];
const WHOLE = [BODY, ARM, WHEELS];
/** The water's way: up the column, through the swivel, out along each half of the arm and away from its nozzle. The
 *  points on the arm go round with it. */
const ride = (part, at) => ({ node: part, at, ride: true });
const water = {
  carries: 'water',
  flow: [P.connector, P.column_foot, P.column_top, P.hub, ride(ARM, P.arm_left), ride(LEFT, P.tip_left), ride(LEFT, P.jet_left)],
  flows: [[P.column_top, P.hub, ride(ARM, P.arm_right), ride(RIGHT, P.tip_right), ride(RIGHT, P.jet_right)]],
};
/** One tag, on the axis, so it stays put while the arm goes round. */
const swivel = [{ node: ARM, text: 'swivel', at: P.column_top }];

writeContent('garden-sprinkler', {
  order: 13,
  title: 'Garden Sprinkler',
  hook: 'No motor: two jets of water push the arm round, the same way a rocket flies.',
  category: 'home',
  summary: [
    'A sprinkler has to spread water over a lawn evenly, using nothing but the pressure in the hose. This one does it with no motor at all: the water leaving the arm pushes it round.',
    'Water from the hose comes up a column in the middle of the wheeled frame and into the arm through a swivel. At each end of the arm a nozzle points the water outwards, a little up and a little sideways.',
    'Squirting water backwards pushes the nozzle forwards, as a rocket’s exhaust pushes the rocket. On this model the arm turns at about 170 rpm, where the push at 2 bar settles once friction and the water’s own swing have taken their share.',
  ],
  model: 'models/garden-sprinkler.glb',
  viewAngle: [-32, 22],
  explodeAngle: [-36, 26],
  facts: [
    { label: 'Jets', value: '19 m/s at 2 bar' },
    { label: 'Water', value: 'about 11 litres a minute' },
    { label: 'Spin', value: 'about 170 rpm' },
    { label: 'Throw', value: 'about 7 m, a circle 14 m across' },
    { label: 'Real size', value: '35 × 20 × 25 cm' },
  ],
  parts: [
    { node: BODY, label: 'Frame and column', group: 'Water in', about: 'The hose screws on at the front. The water turns up the column in the middle to the swivel at its top.', direction: [0, 1, 0], distance: 0 },
    { node: ARM, label: 'Arm', group: 'Spin', about: 'Hollow, with its hub on the column. Water pressure lifts the hub onto a washer that seals the joint and takes the arm’s weight as it turns.', ...off([0, 1, 0], 70, [0.3, 0.7]) },
    { node: LEFT, label: 'Left nozzle', group: 'Jets', about: 'Points the water outwards, 20° up and a little sideways. The sideways part of the jet is what turns the arm.', ...off([-1, 0, 0.09], 50, [0, 0.3]) },
    { node: RIGHT, label: 'Right nozzle', group: 'Jets', about: 'The same as the left one, pointing the other way round, so the two pushes add up to a turn.', ...off([1, 0, -0.09], 50, [0, 0.3]) },
    { node: WHEELS, label: 'Wheels', group: 'Frame', about: 'Two wheels at the back, so it can be pulled by the hose to the next patch of lawn.', ...off([0, -0.6, -0.8], 60, [0.5, 0.8]) },
  ],
  annotations: [
    { title: 'Nozzles', text: 'Each squirts about 5.7 litres a minute at 19 m/s. Pushing the water out backwards pushes the nozzle forwards with about 1.8 newtons: the air plays no part in it.', node: LEFT, position: P.tip_left, camera: pose(P.tip_left, [-40, 30], 2.0, { card: 'left' }) },
    { title: 'Swivel', text: 'The arm’s hub sits on the column. Water pressure lifts it onto a washer, which seals the joint and makes the face it turns on.', node: ARM, position: P.column_top, camera: pose(P.hub, [-26, 36], 2.4) },
    { title: 'Hose connector', text: 'At 3 bar at the tap, about 2 bar is left at the nozzles once the hose, the tap and the swivel have taken their share.', node: BODY, position: P.connector, camera: pose(P.connector, [45, 22], 2.4, { card: 'left' }) },
    { title: 'Wheels', text: 'Pull it by the hose and it rolls to the next patch, still turning.', node: WHEELS, position: P.wheel, camera: pose(centre(WHEELS), [-145, 20], 2.3) },
  ],
  motion: [{ node: ARM, axis: [0, 1, 0], pivot: P.hub, speed: +(-RPM / 60).toFixed(3) }],
  motionLabel: 'Turn on the tap',
  // "How it works" as an animation: the water in, its push on the nozzles, and the arm turning at speed.
  film: [
    {
      chapter: 'Water in',
      caption: 'Turn on the tap and water comes up the column, through the swivel and out along the arm.',
      duration: 6,
      angle: [-52, 24],
      fill: 0.5,
      focus: SPINNING,
      frame: WHOLE,
      run: false,
      ...water,
      tags: swivel,
    },
    {
      chapter: 'The push',
      caption: 'Each nozzle throws water back and to the side, and the water pushes the nozzle forwards.',
      duration: 6,
      angle: [-32, 30],
      fill: 0.5,
      focus: SPINNING,
      frame: WHOLE,
      rate: 0.2,
      ...water,
      tags: swivel,
    },
    {
      chapter: 'The push',
      caption: 'Pushed at both ends, the arm turns at about 170 rpm and waters a circle 14 m across.',
      duration: 6,
      angle: [-14, 36],
      fill: 0.5,
      focus: SPINNING,
      frame: WHOLE,
      ...water,
      tags: swivel,
    },
  ],
  credit: polyHaven('garden_sprinkler_01', 'Garden Sprinkler 01', 'Amal Kumar'),
});

