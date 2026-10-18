// Writes content/bicycle-pump.json from the page's text and where the build put things
// (objects/bicycle-pump/hints.json), so no model-space number is pasted by hand. Run it after every build:
//   node objects/bicycle-pump/content.mjs
import { polyHaven, pose, readHints, space, writeContent } from '../../scripts/kit/content.mjs';

const H = readHints('bicycle-pump');
const { U } = space(H);
const at = (name) => H?.anchors?.[name] ?? (H ? missing(name) : [0, 0.5, 0]);
const pivot = (name) => H?.pivots?.[name] ?? (H ? missing(name) : [0, 0.5, 0]);
const STROKE = H?.stroke ?? 420;
const off = (direction, mm, window) => ({ direction, distance: U(mm), window });

// One stroke, as the timing chart draws it: phase 0 with the handle up, 0.5 at the bottom, 1 up again.
// The barrel's pressure for a tyre at 6 bar, the air staying cool (a slow stroke).
const TYRE = 6;
const N = 48;
const phases = Array.from({ length: N + 1 }, (_, i) => i / N);
const handle = phases.map((p) => [p, +((1 + Math.cos(2 * Math.PI * p)) / 2).toFixed(3)]);
const down = (p) => (p >= 0.5 ? 0 : (1 - Math.cos(2 * Math.PI * p)) / 2);
const pressure = phases.map((p) => [p, p > 0.5 ? 0 : +Math.min(1, (1 / Math.max(1 / (TYRE + 1), 1 - down(p)) - 1) / TYRE).toFixed(3)]);
const opens = Math.acos(1 - 2 * (TYRE / (TYRE + 1))) / (2 * Math.PI);
const r3 = (v) => +v.toFixed(3);

writeContent('bicycle-pump', {
  order: 12,
  title: 'Bicycle Pump',
  hook: 'Air only goes into the tyre at the very end of each push, once the barrel’s pressure beats the tyre’s.',
  category: 'home',
  summary: [
    'A tyre is already full of air, at six or seven times the pressure around it, and a pump has to push more in. It does that by squeezing a barrel of air until it is at a higher pressure than the tyre, then letting it through a one-way valve.',
    'Pushing the handle drives a piston down the barrel. A rubber cup on the piston seals as it goes down and folds to let air past on the way back up; a ball valve in the base lets the air out to the hose and stops the tyre’s air coming back.',
    'So air only flows into the tyre in the last part of each stroke, and pumping gets harder as the tyre fills: at 6 bar the piston needs 424 newtons, the weight of 43 kg. On this model the handle, the piston and the valve move with the stroke’s real timing.',
  ],
  model: 'models/bicycle-pump.glb',
  viewAngle: [-28, 12],
  explodeAngle: [-34, 14],
  explodeDuration: 2400,
  facts: [
    { label: 'Bore', value: '30 mm' },
    { label: 'Stroke', value: `${STROKE / 10} cm, about 300 cm³ of air` },
    { label: 'Push at 6 bar', value: '424 N, like 43 kg' },
    { label: 'Road tyre', value: 'about 24 strokes to 7 bar' },
    { label: 'Real size', value: '26 × 58 cm' },
  ],
  parts: [
    { node: 'plunger', label: 'Handle and piston', group: 'Push', about: 'The T-handle, its rod and, at the rod’s foot, the piston with its rubber cup. Your weight goes down the rod.', ...off([0, 1, 0], 200, [0, 0.45]) },
    { node: 'top_cap', label: 'Top cap', group: 'Push', about: 'Guides the rod. Air gets into the barrel round it on every upstroke. Unscrew it and the whole plunger lifts out.', ...off([0, 1, 0], 200, [0, 0.45]) },
    { node: 'barrel', label: 'Barrel', group: 'Squeeze', about: 'A tube 30 mm across inside. A full stroke sweeps about 300 cm³ of air.', direction: [0, 1, 0], distance: 0 },
    { node: 'base', label: 'Base', group: 'Valve', about: 'You stand on it. A passage inside takes the air from the barrel’s foot across to the hose.', ...off([0, -1, 0], 120, [0.6, 0.85]) },
    { node: 'check_valve', label: 'Ball valve', group: 'Valve', about: 'A rubber ball on a seat in the outlet. Air lifts it to get out; between strokes the tyre’s pressure presses it back down.', direction: [0, 1, 0], distance: 0 },
    { node: 'hose', label: 'Hose', group: 'Out', about: 'Carries the air from the base to the head. It holds the tyre’s pressure between strokes.', ...off([0, 0, 1], 90, [0.5, 0.7]) },
    { node: 'head', label: 'Head', group: 'Out', about: 'A lever squeezes a rubber gasket round the tyre’s valve stem. A pin inside holds a Schrader valve open; a Presta valve is pushed open by the pump’s own air.', ...off([1, 0, 0], 140, [0.45, 0.62]) },
  ],
  annotations: [
    { title: 'Handle', text: 'Two hands and most of your weight. At 6 bar the piston needs 424 newtons to move, and every bar more adds another 71.', node: 'plunger', ride: true, position: at('handle'), camera: pose(at('handle_mid'), [-24, 18], 0.9) },
    { title: 'Top cap', text: 'The rod slides through it. On every upstroke air comes in here, round the rod, into the barrel above the piston.', node: 'top_cap', position: at('cap_side'), camera: pose(at('cap'), [-30, 20], 0.55) },
    { title: 'Piston and cup', text: 'The rubber cup’s lip faces down. Going down, the squeezed air presses it against the barrel and it seals; coming up, it folds inward and lets air past.', node: 'plunger', position: at('cup'), explode: 0.45, camera: pose(at('cup'), [-26, 10], 0.5) },
    { title: 'Barrel', text: `30 mm across inside and ${STROKE / 10} cm of stroke: about 300 cm³ of air each time, squeezed into a tyre that already holds a litre or more.`, node: 'barrel', position: at('barrel_low'), camera: pose(at('barrel'), [-30, 8], 1.4) },
    { title: 'Ball valve', text: 'Hidden in the base, under the hose: a rubber ball on a seat. It only lifts when the air in the barrel is at a higher pressure than the tyre’s.', node: 'base', position: at('fitting_top'), camera: pose(at('fitting_top'), [-36, 24], 0.6) },
    { title: 'Head', text: 'The lever presses a gasket round the valve stem so the air can only go one way, into the tyre.', node: 'head', position: at('head'), camera: pose(at('head'), [30, 10], 0.45) },
  ],
  motion: [
    { node: 'stroke', axis: [1, 0, 0], pivot: pivot('stroke'), speed: 0.5 },
    { node: 'plunger', axis: [1, 0, 0], crank: 'stroke', along: [0, 1, 0], throw: U(STROKE / 2), rod: U(4000), phase: 0 },
    { node: 'check_valve', axis: [1, 0, 0], cam: 'stroke', along: [0, 1, 0], lift: U(2), phase: -158, duration: 44 },
  ],
  motionLabel: 'Pump',
  how: [
    {
      label: 'The idea',
      title: 'Squeezing air into air',
      text: [
        'A road bike’s tyre holds air at about 7 bar, seven times the pressure of the air outside. To get more in, the pump has to squeeze its own air until it is at an even higher pressure, and then open a door to the tyre.',
        'That is all a pump is: a barrel, a piston to squeeze, and a valve that only opens one way.',
      ],
      angle: [-26, 12],
      focus: ['plunger', 'barrel'],
      tags: [
        { node: 'barrel', text: '30 mm bore', at: at('barrel') },
        { node: 'plunger', text: 'Piston', at: at('piston') },
      ],
    },
    {
      label: 'Push',
      title: 'Your weight on 7 cm²',
      text: [
        'The piston’s face is 7 cm². The air under it pushes back with the pressure times that area, so at 6 bar the handle needs 424 newtons: the weight of 43 kg. At 8 bar it needs 565, nearly all of a 70 kg rider.',
        'That, not the pump, is what limits a floor pump: you stand on the base and lean your weight on the handle. Hold the button and pump.',
      ],
      angle: [-24, 10],
      fill: 0.78,
      focus: ['plunger', 'barrel', 'top_cap'],
      flow: [at('handle_mid'), at('rod'), at('barrel_top'), { node: 'plunger', at: at('piston') }],
      chart: {
        type: 'bars',
        title: 'Push needed on the handle',
        caption: 'Pressure times the piston’s 7.07 cm², against a 70 kg person’s weight.',
        unit: 'Newtons',
        bars: [
          { label: '2 bar', value: 141 },
          { label: '4 bar', value: 283 },
          { label: '6 bar', value: 424 },
          { label: '8 bar', value: 565 },
          { label: '70 kg', value: 687, note: 'body weight' },
        ],
        picked: 2,
      },
      try: 'run',
      count: [{ node: 'stroke', label: 'Strokes' }],
    },
    {
      label: 'Squeeze',
      title: 'The valve opens at the very end',
      text: [
        `Going down, the piston squeezes the barrel’s air into less and less room. Its pressure only passes the tyre’s, ${TYRE} bar, once the air is in a seventh of its first volume: after about 86% of the stroke. Until then the ball valve stays shut and nothing goes in.`,
        'So most of each push only squeezes; the last 6 cm or so actually fill the tyre. The fuller the tyre, the later the valve opens.',
      ],
      angle: [-20, 8],
      fill: 0.8,
      rate: 0.4,
      focus: ['plunger', 'barrel', 'check_valve'],
      carries: 'air',
      flow: [{ node: 'plunger', at: at('below_piston') }, at('barrel_foot'), at('channel'), { node: 'check_valve', at: at('ball') }],
      tags: [{ node: 'check_valve', text: 'Ball valve', at: at('ball') }],
      chart: {
        type: 'timing',
        title: 'One stroke, slowed down',
        caption: `The air under the piston against a tyre at ${TYRE} bar: the valve opens only when the barrel catches up. The cursor follows the pump.`,
        node: 'stroke',
        perTurn: 1,
        bands: [[r3(opens), 0.5, 'into the tyre']],
        lanes: [
          { name: 'Handle', points: handle, notes: [[0.25, 'down'], [0.75, 'up']] },
          { name: 'Barrel’s air', points: pressure, notes: [[r3(opens), `${TYRE} bar`]] },
          { name: 'Valve open', points: [[0, 0], [r3(opens - 0.005), 0], [r3(opens), 1], [0.495, 1], [0.5, 0], [1, 0]] },
        ],
      },
    },
    {
      label: 'Refill',
      title: 'The cup folds on the way up',
      text: [
        'Pulling the handle up leaves a growing empty space under the piston. The cup’s lip faces down, so now it folds inward and lets air past from above, where it came in round the rod at the top cap.',
        'Going down again, the squeezed air pushes the lip out against the barrel’s wall and it seals: the cup is the pump’s inlet valve.',
      ],
      angle: [-28, 14],
      fill: 0.78,
      focus: ['plunger', 'top_cap', 'barrel'],
      carries: 'air',
      flow: [at('cap'), at('barrel_top'), { node: 'plunger', at: at('piston') }, { node: 'plunger', at: at('below_piston') }],
      tags: [
        { node: 'plunger', text: 'Cup seal', at: at('cup') },
        { node: 'top_cap', text: 'Air in', at: at('cap_side') },
      ],
    },
    {
      label: 'Out',
      title: 'Through the ball, the hose and the head',
      text: [
        'Once the ball lifts, the air runs across the base, up the hose and through the head into the tyre’s valve. Between strokes the tyre’s pressure pushes the ball back on its seat, so nothing leaks back while you lift the handle.',
        'The head’s lever squeezes a gasket round the valve stem. A Schrader valve, as on a car, is held open by a pin in the head; a Presta valve opens when the pump’s pressure beats the tyre’s.',
      ],
      angle: [26, 14],
      fill: 0.82,
      focus: ['base', 'check_valve', 'hose', 'head'],
      carries: 'air',
      flow: [at('barrel_foot'), at('channel'), { node: 'check_valve', at: at('ball') }, at('fitting_top'), at('hose_up'), at('hose_top'), at('head')],
      tags: [
        { node: 'head', text: 'Head', at: at('head') },
        { node: 'check_valve', text: 'Ball valve', at: at('ball') },
      ],
    },
    {
      label: 'Filling',
      title: 'Two dozen strokes for a road tyre',
      text: [
        'A road tyre holds about a litre of air; to bring it to 7 bar the pump has to push in seven more litres of outside air, about 24 strokes. A wide mountain-bike tyre holds five times as much, but needs only 2 bar.',
        'Squeezing warms the air, by a couple of hundred degrees for an instant at the barrel’s foot, though it is only a fraction of a gram. After a whole tyre the bottom of the barrel feels warm.',
      ],
      angle: [-30, 10],
      focus: ['barrel', 'base', 'plunger'],
      chart: {
        type: 'bars',
        title: 'Strokes to fill',
        caption: 'From flat, with about 300 cm³ of outside air a stroke.',
        unit: 'Strokes',
        bars: [
          { label: 'Road 700×25', value: 24, note: '7 bar' },
          { label: 'MTB 29×2.3', value: 35, note: '2 bar' },
        ],
      },
    },
  ],
  credit: polyHaven('tire_pump', 'Tire Pump', 'Garrison Gager', { label: 'Built for this site', text: 'The piston and its cup seal, the passage through the base and the ball valve.' }),
  build: { augment: 'objects/bicycle-pump/augment.mjs', hints: 'objects/bicycle-pump/hints.json' },
});

function missing(name) {
  throw new Error(`objects/bicycle-pump/hints.json has no "${name}": add it to the hints augment.mjs returns, then npm run models:build -- bicycle-pump`);
}
