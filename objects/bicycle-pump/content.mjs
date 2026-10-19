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

/** What stays solid through the film: the handle and piston, and the ball valve. The barrel, the top cap, the base, the
 *  hose and the head are glass, so the piston and the valve can be seen working inside. */
const MOVING = ['plunger', 'check_valve'];
/** Slow enough to follow a stroke: down in two seconds, up in two. */
const RATE = 0.5;
/** Where the camera looks, in every shot: the pump's middle, from far enough that the handle at the top of its stroke
 *  and the base are both in frame. Exact cameras, since a frame round the plunger would depend on where in its stroke it
 *  was when the film started. */
const WHOLE = [0, 0.95, -0.031];
const DISTANCE = 5.8;
/** The ball valve and the head, on through both shots of the air going out. */
const OUTLET_TAGS = [
  { node: 'check_valve', text: 'ball valve', at: at('ball') },
  { node: 'head', text: 'head', at: at('head') },
];
/** The air's way: squeezed down the barrel to the ball valve; on through the base, up the hose and out of the head;
 *  and in at the top cap, past the piston's cup, on the way up. */
const squeezed = [{ node: 'plunger', at: at('below_piston') }, at('barrel_foot'), at('channel'), { node: 'check_valve', at: at('ball') }];
const out = [at('barrel_foot'), at('channel'), { node: 'check_valve', at: at('ball') }, at('fitting_top'), at('hose_up'), at('hose_top'), at('head')];
const refill = [at('cap'), at('barrel_top'), { node: 'plunger', at: at('piston') }, { node: 'plunger', at: at('below_piston') }];

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
  // "How it works" as an animation: the piston squeezes the air down, the ball valve lets it out to the tyre, and the
  // cup lets the barrel fill again on the way up. The pump keeps stroking through every shot.
  film: [
    {
      chapter: 'Push',
      caption: 'Pushing the handle drives the piston down the barrel, squeezing the air beneath it.',
      duration: 6,
      camera: pose(WHOLE, [-30, 10], DISTANCE),
      rate: RATE,
      focus: MOVING,
      tags: [{ node: 'plunger', text: 'piston', at: at('piston') }],
    },
    {
      chapter: 'Push',
      caption: 'Near the bottom the air beats the tyre’s pressure, and lifts the ball valve to get out.',
      duration: 6,
      camera: pose(WHOLE, [-5, 12], DISTANCE),
      rate: RATE,
      focus: MOVING,
      carries: 'air',
      flow: squeezed,
      tags: OUTLET_TAGS,
    },
    {
      chapter: 'Out',
      caption: 'It runs up the hose and through the head into the tyre; the ball stops it coming back.',
      duration: 6,
      camera: pose(WHOLE, [22, 14], DISTANCE),
      rate: RATE,
      focus: MOVING,
      carries: 'air',
      flow: out,
      tags: OUTLET_TAGS,
    },
    {
      chapter: 'Refill',
      caption: 'Pulling up, the piston’s cup folds and lets air in round the rod to fill the barrel again.',
      duration: 6,
      camera: pose(WHOLE, [48, 14], DISTANCE),
      rate: RATE,
      focus: MOVING,
      carries: 'air',
      flow: refill,
      tags: [
        { node: 'top_cap', text: 'air in', at: at('cap_side') },
        { node: 'plunger', text: 'cup', at: at('cup') },
      ],
    },
  ],
  credit: polyHaven('tire_pump', 'Tire Pump', 'Garrison Gager', { label: 'Built for this site', text: 'The piston and its cup seal, the passage through the base and the ball valve.' }),
  build: { augment: 'objects/bicycle-pump/augment.mjs', hints: 'objects/bicycle-pump/hints.json' },
});

function missing(name) {
  throw new Error(`objects/bicycle-pump/hints.json has no "${name}": add it to the hints augment.mjs returns, then npm run models:build -- bicycle-pump`);
}
