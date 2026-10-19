// Writes content/__SLUG__.json: the page's text, and where the build put things (objects/__SLUG__/hints.json,
// written by `npm run models:build -- __SLUG__`), so no model-space number is pasted by hand. Run it after
// every build:   node objects/__SLUG__/content.mjs
//
// It starts as the demo's content (see generate.mjs). Rewrite it from the truth sheet; the field-by-field
// guide is .claude/skills/3d-of-things/references/content.md, the voice is in references/explaining.md.
import { builtInCode, readHints, space, writeContent } from '../../scripts/kit/content.mjs';

const H = readHints('__SLUG__');
const { pose } = space(H);
/** A named point from the build (model space). Before the first build there are none yet, so a placeholder. */
const at = (name) => H?.anchors?.[name] ?? (H ? missing(name) : [0, 0.5, 0]);
const pivot = (name) => H?.pivots?.[name] ?? (H ? missing(name) : [0, 0.5, 0]);
const ratio = (H?.teeth?.large ?? 40) / (H?.teeth?.small ?? 16);

writeContent('__SLUG__', {
  order: __ORDER__,
  title: '__TITLE__',
  hook: 'Every turn of the crank turns the small gear two and a half times.',
  category: '__CATEGORY__',
  summary: [
    'A gear pair trades turns for force. A big gear driving a small one makes it spin faster but push less hard; the other way round, it turns slower and harder.',
    'Here a crank turns a 40-tooth gear, and its teeth push a 16-tooth gear round the other way.',
    'Every tooth of the large gear that goes by moves the small gear on by one tooth, so one turn of the crank turns the small gear 40 ÷ 16 = 2½ times. Turn the crank and count.',
  ],
  model: 'models/__SLUG__.glb',
  viewAngle: [-28, 16],
  explodeAngle: [-40, 22],
  facts: [
    { label: 'Ratio', value: '40 : 16, or 2½ to 1' },
    { label: 'Tooth size', value: 'Module 1.5 mm' },
    { label: 'Parts', value: '5' },
  ],
  // In energy-chain order, grouped. Outer parts come off first (lower stage).
  parts: [
    { node: 'crank', label: 'Crank', group: 'Drive', about: 'Your hand turns it. It rides on the large gear, so the gear turns with it, one turn for one.', direction: [0, 0, 1], distance: 0.3, stage: 0 },
    { node: 'gear_large', label: 'Large gear', group: 'Gears', about: '40 teeth. Each one that goes by pushes the small gear on by one tooth.', direction: [0, 0, 1], distance: 0.35, stage: 1 },
    { node: 'gear_small', label: 'Small gear', group: 'Gears', about: '16 teeth, so it turns 2½ times for each turn of the large gear, the other way round.', direction: [0, 0, 1], distance: 0.6, stage: 1 },
    { node: 'upright', label: 'Upright', group: 'Frame', about: 'Holds the two shafts exactly 42 mm apart, the distance at which the teeth mesh.', direction: [0, 0, -1], distance: 0.25, stage: 2 },
    { node: 'base', label: 'Base', group: 'Frame', about: 'Carries the upright.', direction: [0, -1, 0], distance: 0, stage: 2 },
  ],
  annotations: [
    { title: 'Crank', text: 'Turning the handle turns the large gear with it: the crank is fixed to its shaft.', node: 'crank', ride: true, position: at('handle'), camera: pose(at('handle'), [-24, 18], 1.5) },
    { title: 'Gear ratio', text: 'The small gear has 16 teeth to the large gear’s 40, so it turns 2½ times as fast, and the other way round.', node: 'gear_small', position: at('small_face'), camera: pose(at('mesh'), [-8, 10], 1.9) },
  ],
  motion: [
    { node: 'gear_large', axis: [0, 0, 1], pivot: pivot('gear_large'), speed: 0.25 },
    { node: 'gear_small', axis: [0, 0, 1], pivot: pivot('gear_small'), speed: -0.25 * ratio },
  ],
  motionLabel: 'Turn the crank',
  // "How it works": the mechanism doing its job once, start to finish, as a film (references/film.md). One focus for
  // the whole film (casings glass, moving parts solid); the camera glides from each shot's view to the next.
  film: [
    {
      chapter: 'The crank',
      caption: 'Turn the crank and the large gear turns with it.',
      duration: 6,
      angle: [-30, 16],
      focus: ['crank', 'gear_large', 'gear_small'],
      flow: [{ node: 'crank', at: at('handle') }, { node: 'gear_large', at: at('large_face') }],
      tags: [{ node: 'gear_large', text: '40 teeth', at: at('large_top') }],
    },
    {
      chapter: 'The gears',
      caption: 'Its 40 teeth push the 16-tooth gear round two and a half times for every turn.',
      duration: 7,
      angle: [-8, 12],
      focus: ['crank', 'gear_large', 'gear_small'],
      frame: ['gear_large', 'gear_small'],
      flow: [{ node: 'crank', at: at('handle') }, { node: 'gear_large', at: at('large_face') }, { node: 'gear_small', at: at('small_face') }],
      tags: [{ node: 'gear_small', text: '16 teeth', at: at('small_top') }],
    },
  ],
  credit: builtInCode('__TITLE__', 'A demonstration made by the scaffold: replace with what this object was laid out from.'),
  build: { generate: 'objects/__SLUG__/generate.mjs', hints: 'objects/__SLUG__/hints.json' },
});

function missing(name) {
  throw new Error(`objects/__SLUG__/hints.json has no "${name}": add it to the hints generate.mjs returns, then npm run models:build -- __SLUG__`);
}
