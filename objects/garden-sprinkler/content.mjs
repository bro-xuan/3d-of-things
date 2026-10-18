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

// Points in millimetres in the model's own frame (the swivel's axis is x = 0, z = 0), from its mesh.
const P = {
  connector: M(0, 58, 100),
  column_foot: M(0, 52, 2),
  column_top: M(0, 142, 2),
  hub: M(0, 167, 0),
  arm_left: M(-75, 176, 7),
  arm_right: M(75, 176, -7),
  tip_left: M(-172, 195, 18),
  tip_right: M(172, 195, -18),
  wheel: M(150, 37, -110),
};
// The arm turns clockwise seen from above (negative about +y), at about 166 rpm at 2 bar.
const RPM = 166;
const off = (direction, mm, window) => ({ direction, distance: U(mm), window });

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
  how: [
    {
      label: 'The idea',
      title: 'Pushed round by its own water',
      text: [
        'Water comes up the column into the arm and leaves through the two nozzles. Each nozzle throws its water outwards and a little sideways, and as it does, the water pushes back on it.',
        'The two pushes point opposite ways at opposite ends of the arm, so together they turn it. Nothing else drives it: no motor, no gears.',
      ],
      angle: [-30, 26],
      focus: [ARM, LEFT, RIGHT],
      carries: 'water',
      flow: [P.connector, P.column_foot, P.column_top, P.hub, { node: ARM, at: P.arm_left, ride: true }, { node: LEFT, at: P.tip_left, ride: true }],
      flows: [[P.column_top, P.hub, { node: ARM, at: P.arm_right, ride: true }, { node: RIGHT, at: P.tip_right, ride: true }]],
      tags: [{ node: LEFT, text: '19 m/s jet', at: P.tip_left }],
    },
    {
      label: 'Water in',
      title: 'Up the column, through the swivel',
      text: [
        'The hose screws on at the front of the frame. The water turns up the column in the middle and into the arm’s hub, which turns on the top of the column.',
        'At 3 bar at the tap, about 2 bar is left by the time the water reaches the nozzles, and the two of them pass about 11 litres a minute.',
      ],
      angle: [-12, 18],
      focus: [BODY, ARM],
      carries: 'water',
      flow: [P.connector, P.column_foot, P.column_top, P.hub],
      tags: [
        { node: BODY, text: 'Hose in', at: P.connector },
        { node: ARM, text: 'Swivel', at: P.column_top },
      ],
    },
    {
      label: 'The push',
      title: 'A rocket on a stick',
      text: [
        'A nozzle squirting water backwards is pushed forwards, just as a rocket is pushed by its exhaust: it is the water leaving that pushes, not the water pressing on the air. A sprinkler would turn in a vacuum.',
        'More pressure means faster jets and a harder push, so the arm turns faster and the water goes further. Pick a pressure.',
      ],
      angle: [-34, 30],
      fill: 0.8,
      focus: [ARM, LEFT, RIGHT],
      chart: {
        type: 'bars',
        title: 'How far it throws',
        caption: 'From the middle to where 2 mm drops land, in still air.',
        unit: 'Metres',
        follow: 'selected',
        bars: [
          { label: '1 bar', value: 5.2, note: '82 rpm' },
          { label: '2 bar', value: 6.8, note: '166 rpm' },
          { label: '3 bar', value: 7.8, note: '224 rpm' },
        ],
      },
      try: 'speeds',
      spin: [ARM],
      speeds: [
        { label: '1 bar', factor: 82 / RPM, note: 'Jets at 14 m/s, 0.9 N each: the arm turns at about 80 rpm.' },
        { label: '2 bar', factor: 1, note: 'Jets at 19 m/s, 1.8 N each: about 170 rpm, water out to 7 m.' },
        { label: '3 bar', factor: 224 / RPM, note: 'Jets at 24 m/s, 2.7 N each: about 220 rpm, water out to nearly 8 m.' },
      ],
    },
    {
      label: 'Speed',
      title: 'Where the push goes',
      text: [
        'Why doesn’t the arm spin faster and faster? Every drop entering at the middle has to be swung out to the tip at the arm’s speed, and that takes most of the push: at 166 rpm about three quarters of it. Friction in the swivel takes most of the rest.',
        'Turned fully sideways, the same nozzles would spin the arm at well over 1,000 rpm, but the faster they move, the more their own speed cancels the jets’ and the water drops short. A slight angle throws further.',
      ],
      angle: [-30, 34],
      focus: [ARM, LEFT, RIGHT, BODY],
      chart: {
        type: 'bars',
        title: 'Where the push goes at 166 rpm',
        caption: 'Shares of the jets’ turning push, 0.13 N·m in all.',
        unit: '% of the push',
        bars: [
          { label: 'Swinging water out', value: 76 },
          { label: 'Swivel friction', value: 23 },
          { label: 'Air on the arm', value: 1.5 },
        ],
        picked: 0,
      },
    },
    {
      label: 'Throw',
      title: '20° up and a little to the side',
      text: [
        'Water needs height to travel, so the nozzles tip up 20°. With no air it would carry 25 m; drag on the drops brings it down to about 7 m, a wetted circle 14 m across.',
        'Run backwards, sucking water in, a sprinkler turns the other way, about 40 times slower: a puzzle Feynman posed, settled by experiment in 2024.',
      ],
      angle: [-36, 18],
      focus: [ARM, LEFT, RIGHT],
      carries: 'water',
      flow: [P.hub, { node: ARM, at: P.arm_left, ride: true }, { node: LEFT, at: P.tip_left, ride: true }],
      chart: {
        type: 'bars',
        title: 'Turning the nozzles sideways',
        caption: 'The more sideways the nozzles point, the faster the arm turns and the shorter the throw (2 bar, 2 mm drops).',
        unit: 'Metres thrown',
        bars: [
          { label: '13°', value: 6.8, note: '166 rpm' },
          { label: '60°', value: 6.4, note: '1,063 rpm' },
          { label: '75°', value: 5.0, note: '1,347 rpm' },
          { label: '90°', value: 2.5, note: '1,474 rpm' },
        ],
        picked: 0,
      },
    },
  ],
  credit: polyHaven('garden_sprinkler_01', 'Garden Sprinkler 01', 'Amal Kumar'),
});

