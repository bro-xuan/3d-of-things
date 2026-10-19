// Writes content/microscope.json. Converted key for key on 18 October 2026 from the hand-written JSON the page
// shipped with (its "How it works" is now a film). Its positions and cameras are still typed in model
// space, as they were in the JSON: when the model changes, place them from the model with placer(nodeBounds(...))
// (scripts/kit/nodes.mjs), as the newer objects' builders do.
//   node objects/microscope/content.mjs
import { writeContent } from '../../scripts/kit/content.mjs';

/** What stays solid through the film: the mirror and the lenses the light goes through (the condenser, the objectives
 *  on their turret, the tube with its eyepiece). The arm and stage, the foot, the mirror's arm and the focus knobs
 *  are glass. */
const SOLID = ['vintage_microscope_mirror_base', 'vintage_microscope_condenser', 'vintage_microscope_revolver', 'vintage_microscope_eye_piece'];
/** The light's path: from a window to the mirror, straight up through the condenser to the slide, through the
 *  objective to the image it forms in the tube, and out of the eyepiece. */
const LIGHT = [
  [-0.58, 0.44, 0.42],
  [0, 0.18, 0.113],
  { node: 'vintage_microscope_condenser', at: [0, 0.5, 0.113] },
  [0, 0.715, 0.113],
  { node: 'vintage_microscope_revolver', at: [0, 0.83, 0.113] },
  { node: 'vintage_microscope_eye_piece', at: [0, 1.3, 0.113] },
  { node: 'vintage_microscope_eye_piece', at: [0, 1.72, 0.113] },
  [0, 1.98, 0.113],
];

writeContent('microscope', {
  order: 4,
  title: 'Microscope',
  hook: 'Two lenses in a tube: one magnifies the specimen, the other magnifies that image again.',
  category: 'optics',
  summary: [
    'A compound microscope magnifies in two stages. The objective lens, just above the specimen, forms an enlarged image inside the tube, and the eyepiece at the top magnifies that image again.',
    'The two multiply: a 40× objective under a 10× eyepiece gives 400×. Before built-in lamps, a mirror under the stage caught daylight and sent it up through the specimen, which is why slides are made thin enough to see through.',
  ],
  model: 'models/microscope.glb',
  viewAngle: [35, 12],
  facts: [{ label: 'Magnification', value: 'Objective × eyepiece' }, { label: 'Light source', value: 'A mirror' }, { label: 'Real size', value: '40 cm tall' }],
  parts: [
    {
      node: 'vintage_microscope_eye_piece',
      label: 'Tube & eyepiece',
      about: 'The eyepiece at the top magnifies the image the objective has formed inside the tube.',
      direction: [0, 1, 0],
      distance: 0.4,
      stage: 1,
    },
    {
      node: 'vintage_microscope_revolver',
      label: 'Objectives',
      about: 'Lenses of different strengths on a turret. Turn it to click a new one into line over the slide.',
      direction: [0, -0.1, 1],
      distance: 0.4,
      stage: 1,
    },
    {
      node: 'vintage_microscope_adjustment',
      label: 'Focus knobs',
      about: 'Turn a small gear against a toothed rack, raising or lowering the whole tube to focus.',
      direction: [0, 0.2, -1],
      distance: 0.32,
      stage: 0,
    },
    {
      node: 'vintage_microscope_condenser',
      label: 'Condenser',
      about: 'A lens under the stage that gathers the mirror’s light and spreads it evenly over the specimen.',
      direction: [0, 0, 1],
      distance: 0.5,
      stage: 2,
    },
    { node: 'vintage_microscope_mirror_arm', label: 'Mirror arm', about: 'Holds the mirror under the stage and lets it swing to catch the light.', direction: [0, 0, 1], distance: 0.42, stage: 2 },
    { node: 'vintage_microscope_mirror_base', label: 'Mirror', about: 'Tilt it toward a window or lamp to bounce light up through the specimen.', direction: [0, 0.15, 1], distance: 0.62, stage: 2 },
    {
      node: 'vintage_microscope_rack_mount_support',
      label: 'Arm & stage',
      about: 'The arm carries the tube and focus gear; the stage is the round table the slide sits on.',
      direction: [0, 1, 0],
      distance: 0,
    },
    { node: 'vintage_microscope_base', label: 'Foot', about: 'A heavy horseshoe base that keeps the microscope steady while you focus.', direction: [0, 1, 0], distance: 0 },
  ],
  annotations: [
    {
      title: 'Eyepiece',
      text: 'The lens you look into magnifies the image the objective has already made, usually by 10×. Swap in a stronger eyepiece and the whole view scales up.',
      node: 'vintage_microscope_eye_piece',
      position: [0.007, 1.684, 0.188],
      camera: { position: [0.482, 1.969, 1.138], target: [0.007, 1.684, 0.188] },
    },
    {
      title: 'Objectives',
      text: 'Three objectives of different strengths screw into a turret called the nosepiece. Turning it clicks a new one into line, changing magnification without moving the slide.',
      node: 'vintage_microscope_revolver',
      position: [0.007, 0.877, 0.242],
      camera: { position: [0.378, 0.877, 1.17], target: [0.007, 0.877, 0.242] },
    },
    {
      title: 'Stage',
      text: 'The slide sits on this round table, over a hole that lets light come up from below.',
      node: 'vintage_microscope_rack_mount_support',
      position: [0.097, 0.71, 0.194],
      camera: { position: [0.455, 1.426, 1.088], target: [0.097, 0.71, 0.194] },
    },
    {
      title: 'Coarse focus',
      text: 'These knobs turn a small gear against a toothed rack, raising or lowering the whole tube until the specimen comes into focus.',
      node: 'vintage_microscope_adjustment',
      position: [0.171, 1.329, -0.01],
      camera: { position: [1.084, 1.512, 0.355], target: [0.171, 1.329, -0.01] },
    },
    {
      title: 'Condenser',
      text: 'A lens under the stage gathers light from the mirror and concentrates it on the specimen, so the field of view is evenly lit.',
      node: 'vintage_microscope_condenser',
      position: [0.021, 0.519, 0.181],
      camera: { position: [0.391, 0.427, 1.106], target: [0.021, 0.519, 0.181] },
    },
    {
      title: 'Mirror',
      text: 'Tilt it toward a window or lamp and it bounces light straight up through the condenser and the specimen.',
      node: 'vintage_microscope_mirror_base',
      position: [0.02, 0.233, 0.206],
      camera: { position: [0.363, 0.619, 1.063], target: [0.02, 0.233, 0.206] },
    },
  ],
  // "How it works" as a film: the light up through the microscope, from the mirror to the eye.
  film: [
    {
      chapter: 'Light',
      caption: 'The mirror catches daylight and sends it up through the condenser onto the slide.',
      duration: 6,
      angle: [20, 8],
      fill: 0.74,
      focus: SOLID,
      carries: 'light',
      flow: LIGHT.slice(0, 4),
      tags: [
        { node: 'vintage_microscope_mirror_base', text: 'mirror', at: [0.1, 0.2, 0.2] },
        { node: 'vintage_microscope_rack_mount_support', text: 'slide', at: [0.12, 0.72, 0.2] },
      ],
    },
    {
      chapter: 'Objective',
      caption: 'Just above the slide, the objective forms an enlarged image inside the tube.',
      duration: 6,
      angle: [38, 12],
      fill: 0.74,
      focus: SOLID,
      carries: 'light',
      flow: LIGHT.slice(0, 6),
      tags: [
        { node: 'vintage_microscope_revolver', text: 'objective', at: [0.06, 0.84, 0.15] },
        { node: 'vintage_microscope_eye_piece', text: 'image', at: [0.07, 1.3, 0.15] },
      ],
    },
    {
      chapter: 'Eyepiece',
      caption: 'The eyepiece magnifies it again: a 10× objective under a 10× eyepiece makes 100×.',
      duration: 6.5,
      angle: [56, 16],
      fill: 0.74,
      focus: SOLID,
      carries: 'light',
      flow: LIGHT,
      tags: [{ node: 'vintage_microscope_eye_piece', text: 'eyepiece', at: [0.07, 1.7, 0.15] }],
    },
  ],
  credit: {
    title: 'Vintage Microscope',
    author: 'Luis José Fernández Rodríguez',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    source: 'Poly Haven',
    sourceUrl: 'https://polyhaven.com/a/vintage_microscope',
  },
});
