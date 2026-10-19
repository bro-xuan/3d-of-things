// Writes content/binoculars.json. Converted key for key on 18 October 2026 from the hand-written JSON the page
// shipped with (its "How it works" is now a film). Its positions and cameras are still typed in model
// space, as they were in the JSON: when the model changes, place them from the model with placer(nodeBounds(...))
// (scripts/kit/nodes.mjs), as the newer objects' builders do.
//   node objects/binoculars/content.mjs
import { writeContent } from '../../scripts/kit/content.mjs';

const BARRELS = ['vintage_binocular_left_prism', 'vintage_binocular_right_prism'];
/** What stays solid through the film: the eyepieces (and the right one's diopter ring). The barrels, which hold the
 *  objectives and the prisms, the hinge and the focus wheel are glass, so the light can be seen inside. */
const SOLID = ['vintage_binocular_left_lens', 'vintage_binocular_right_lens', 'vintage_binocular_diopter'];
/** The whole pair, framed the same in every shot so the camera never moves in or out. */
const WHOLE = [...BARRELS, ...SOLID];
/** The light's path through the left barrel: in through the objective, back to the first prism, which turns it up and
 *  forward, to the second, which turns it in and back, and on through the eyepiece. */
const LIGHT = [[0.43, 0.24, 0.88], [0.43, 0.24, 0.66], [0.43, 0.24, -0.02], [0.335, 0.335, -0.02], [0.335, 0.335, 0.36], [0.241, 0.211, 0.36], [0.241, 0.211, -0.5], [0.241, 0.211, -0.8]];
/** The same path through the right barrel. */
const mirror = (path) => path.map(([x, y, z]) => [-x, y, z]);

writeContent('binoculars', {
  order: 3,
  title: 'Binoculars',
  hook: 'Two small telescopes side by side, with prisms that fold the light and turn the picture the right way up.',
  category: 'optics',
  summary: [
    'Each half of a pair of binoculars is a small telescope. The large objective lens at the front gathers light and forms an image inside the barrel, and the eyepiece magnifies that image for your eye.',
    'A simple telescope shows the world upside down. In these Porro-prism binoculars, two prisms in each barrel bounce the light four times, turning the image upright and folding a long light path into a short body. The fold is also why the front lenses sit wider apart than the eyepieces.',
  ],
  model: 'models/binoculars.glb',
  viewAngle: [-38, 26],
  facts: [{ label: 'Design', value: 'Porro prism' }, { label: 'Reflections', value: '4 per side' }, { label: 'Real size', value: '20 cm long' }],
  parts: [
    {
      node: 'vintage_binocular_left_prism',
      label: 'Left barrel',
      about: 'One of the two small telescopes: the objective lens at the front, a pair of Porro prisms in the bulge.',
      direction: [1, 0, 0],
      distance: 0.2,
      stage: 0,
    },
    {
      node: 'vintage_binocular_right_prism',
      label: 'Right barrel',
      about: 'The second telescope, a mirror image of the first, with its own objective lens and prisms.',
      direction: [-1, 0, 0],
      distance: 0.2,
      stage: 0,
    },
    {
      node: 'vintage_binocular_left_lens',
      label: 'Left eyepiece',
      about: 'Lenses that magnify the image formed inside the barrel. The focus wheel moves both eyepieces together.',
      direction: [0.2, 0, -0.4],
      distance: 0.447,
      stage: 0,
    },
    {
      node: 'vintage_binocular_right_lens',
      label: 'Right eyepiece',
      about: 'Like the left one, but with its own diopter ring, to make up for the difference between your eyes.',
      direction: [-0.2, 0, -0.4],
      distance: 0.447,
      stage: 0,
    },
    {
      node: 'vintage_binocular_diopter',
      label: 'Diopter ring',
      about: 'Sharpens the right eyepiece on its own, once the focus wheel has set the left.',
      direction: [-0.2, 0, -0.62],
      distance: 0.651,
      stage: 1,
    },
    { node: 'vintage_binocular_focus', label: 'Focus wheel', about: 'Slides both eyepieces in or out together, to focus near or far.', direction: [0, 1, 0], distance: 0.25, stage: 1 },
    { node: 'vintage_binocular_eye_relief', label: 'Hinge cap', about: 'Caps the central hinge that the two halves pivot on.', direction: [0, 0.5, -1], distance: 0.3, stage: 1 },
    { node: 'vintage_binocular_middle', label: 'Hinge', about: 'Lets the two halves swing to match the distance between your eyes.', direction: [0, 1, 0], distance: 0 },
  ],
  annotations: [
    {
      title: 'Objective lens',
      text: 'The big front lens gathers light and focuses it into an image inside the barrel. Its width matters most in poor light: a wider lens collects more, so the view stays bright at dusk.',
      node: 'vintage_binocular_left_prism',
      position: [0.43, 0.24, 0.7],
      camera: { position: [0.877, 0.613, 2.106], target: [0.43, 0.24, 0.7] },
    },
    {
      title: 'Porro prisms',
      text: 'Inside each barrel\'s bulge, two right-angled glass prisms each reflect the light twice. Four reflections in all turn the image upright and the right way round, and fold the path so the barrel can be short.',
      node: 'vintage_binocular_left_prism',
      position: [0.356, 0.471, -0.1],
      camera: { position: [1.071, 1.758, 0.186], target: [0.356, 0.471, -0.1] },
    },
    {
      title: 'Eyepiece',
      text: 'A cluster of small lenses that works like a magnifying glass on the image the objective formed. Magnification is the objective\'s focal length divided by the eyepiece\'s.',
      node: 'vintage_binocular_left_lens',
      position: [0.169, 0.254, -0.649],
      camera: { position: [0.545, 0.63, -1.724], target: [0.169, 0.254, -0.649] },
    },
    {
      title: 'Focus wheel',
      text: 'Turning the centre wheel slides both eyepieces in or out together, sharpening near or distant subjects at once.',
      node: 'vintage_binocular_focus',
      position: [0, 0.47, -0.061],
      camera: { position: [0.194, 1.438, -0.545], target: [0, 0.47, -0.061] },
    },
    {
      title: 'Diopter ring',
      text: 'Most people\'s eyes differ slightly. Focus the left side with the wheel, then turn this ring to sharpen the right eyepiece on its own.',
      node: 'vintage_binocular_diopter',
      position: [-0.208, 0.189, -0.39],
      camera: { position: [-0.695, 0.513, -1.201], target: [-0.208, 0.189, -0.39] },
    },
    {
      title: 'Hinge',
      text: 'The two halves pivot on a central hinge so you can match their spacing to the distance between your eyes, typically 56 to 74 mm.',
      node: 'vintage_binocular_middle',
      position: [0, 0.374, 0.162],
      camera: { position: [0, 1.043, 1.277], target: [0, 0.374, 0.162] },
    },
  ],
  // "How it works" as a film: the light through one barrel and the other, from the objective to the eye.
  film: [
    {
      chapter: 'Objective',
      caption: 'The big front lens gathers the light and forms an upside-down image inside the barrel.',
      duration: 6,
      angle: [64, 28],
      fill: 0.78,
      focus: SOLID,
      frame: WHOLE,
      carries: 'light',
      flow: LIGHT.slice(0, 3),
      flows: [mirror(LIGHT.slice(0, 3))],
      tags: [{ node: 'vintage_binocular_left_prism', text: 'objective lens', at: [0.43, 0.42, 0.68] }],
    },
    {
      chapter: 'Prisms',
      caption: 'Two prisms bounce it four times, turning the picture upright and folding the path short.',
      duration: 6.5,
      angle: [92, 40],
      fill: 0.64,
      focus: SOLID,
      frame: WHOLE,
      carries: 'light',
      flow: LIGHT.slice(0, 6),
      flows: [mirror(LIGHT.slice(0, 6))],
      tags: [
        { node: 'vintage_binocular_left_prism', text: 'first prism', at: [0.39, 0.4, -0.02] },
        { node: 'vintage_binocular_left_prism', text: 'second prism', at: [0.29, 0.4, 0.36] },
      ],
    },
    {
      chapter: 'Eyepiece',
      caption: 'The eyepiece magnifies that upright image, about seven times, for your eye.',
      duration: 6,
      angle: [120, 28],
      fill: 0.78,
      focus: SOLID,
      frame: WHOLE,
      carries: 'light',
      flow: LIGHT,
      flows: [mirror(LIGHT)],
      tags: [{ node: 'vintage_binocular_left_lens', text: 'eyepiece', at: [0.241, 0.33, -0.55] }],
    },
  ],
  credit: {
    title: 'Vintage Binoculars',
    author: 'Luke',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    source: 'Poly Haven',
    sourceUrl: 'https://polyhaven.com/a/vintage_binocular',
  },
});
