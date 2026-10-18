// Writes content/__SLUG__.json from the page's text and where the model's parts sit (read from the
// built model, so no model-space number is pasted by hand). Run it after every build:
//   node objects/__SLUG__/content.mjs
//
// The parts below were listed by the scaffold from the model's nodes: rename them, group them in the
// energy chain's order, give each an `about`, and set how each comes off. The field-by-field guide is
// .claude/skills/3d-of-things/references/content.md; the voice is in references/explaining.md.
import { polyHaven, pose, readHints, writeContent } from '../../scripts/kit/content.mjs';
import { nodeBounds, placer } from '../../scripts/kit/nodes.mjs';

const N = await nodeBounds('__SLUG__');
const { centre, top, front } = placer(N);
const H = readHints('__SLUG__');

writeContent('__SLUG__', {
  order: __ORDER__,
  title: '__TITLE__',
  hook: 'TODO: the mechanism’s surprise, in one line.',
  category: '__CATEGORY__',
  summary: ['TODO: the problem it solves, and its one big idea.', 'TODO: the parts that do it, in the order the energy flows.', 'TODO: the process, and what moves on this model.'],
  model: 'models/__SLUG__.glb',
  viewAngle: [-30, 18],
  facts: [],
  parts: [
__PARTS__
  ],
  annotations: [],
  motion: [],
  how: [],
  credit: polyHaven('__PH_ID__', '__PH_NAME__', '__PH_AUTHORS__'),
__BUILD__});

// Keep the helpers in use while the text is still to be written (remove once they are).
void [centre, top, front, pose, H];
