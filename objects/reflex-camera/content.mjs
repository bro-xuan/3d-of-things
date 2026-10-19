// Writes content/reflex-camera.json from the page's text and where the build put things
// (objects/reflex-camera/hints.json, written by `npm run models:build -- reflex-camera`): the motions' pivots, gears
// and rates come from the hints, and the callouts, tags and the film's rays and power paths are given in millimetres
// in the camera's frame (M); only the explode and camera distances are in model units. Run it after every build:
//   node objects/reflex-camera/content.mjs
import { builtInCode, pose, r4, readHints, space, writeContent } from '../../scripts/kit/content.mjs';

const H = readHints('reflex-camera');
/** Model space from the camera frame's millimetres. */
const { M, U, mmPerUnit: MM } = space(H);
const P = (direction, distance, window, extra = {}) => ({ direction, distance, window, ...extra });

const parts = [
  { node: 'lens', label: 'Lens', group: 'Lens', about: 'An 80 mm f/2.8 of the Planar type, seven glasses in five groups, with its own shutter between them. It turns off the body on a bayonet.', ...P([0, 0, 1], 0.78, [0, 0.2]) },
  { node: 'optics', label: 'Optical unit', group: 'Lens', about: 'The glass with the shutter and iris between it, in a housing carrying the speed and aperture rings. Focusing moves all of it forward on a helicoid.', ...P([0, 0, 1], 0.2, [0.62, 0.8]) },
  { node: 'focus_ring', label: 'Focusing ring', group: 'Lens', about: 'Turned 300° from infinity to 0.9 m, it screws the optical unit out 8.75 mm. The distance scale on it reads against the depth-of-field ring.', ...P([0, 0, 1], 0.12, [0.7, 0.88]) },
  { node: 'shell', label: 'Body shell', group: 'Body', about: 'An aluminium casting, chrome outside and leatherette on the sides. Everything that works is on the chassis inside, which slides out of the back.', ...P([0, 0, 1], 0.64, [0.38, 0.58]) },
  { node: 'knob', label: 'Winding knob', group: 'Body', about: 'One turn does everything: it lowers the mirror, turns the drive key back to cock the lens’s shutter, and winds the film on in the magazine.', ...P([-1, 0, 0], 0.4, [0.1, 0.3]) },
  { node: 'front_plate', label: 'Bayonet plate', group: 'Body', about: 'The front of the chassis: the bayonet the lens locks into, and at the bottom of its throat the drive key, on a shaft with the spring that turns it as the camera fires.', ...P([0, 1, 0], 0, [0, 1]) },
  { node: 'chassis', label: 'Mirror box', group: 'Body', about: 'Black inside so no light bounces about. The mirror hangs from its top back corner; the focusing screen sits in a frame on top.', ...P([0, 1, 0], 0, [0, 1]) },
  { node: 'mechanism_plate', label: 'Winding gears', group: 'Body', about: 'A brass plate on the right-hand wall with the train from the knob: an idler to the drive key’s cross shaft, the barrel that powers the rear flaps, and the gear that reaches into the magazine.', ...P([-1, 0, 0], 0.18, [0.6, 0.76]) },
  { node: 'rear_plate', label: 'Rear flaps', group: 'Body', about: 'The back of the chassis, with the picture’s window and two hinged flaps behind the mirror that keep the film dark while you look through the lens.', ...P([0, 0, -1], 0.2, [0.56, 0.72]) },
  { node: 'finder', label: 'Folding hood', group: 'Finder', about: 'Folded flat it protects the screen; opened, it shades it, and a magnifier inside flips up for focusing.', ...P([0, 1, 0], 0.3, [0.04, 0.2]) },
  { node: 'screen', label: 'Focusing screen', group: 'Finder', about: 'Ground glass, its matte face exactly as far from the lens as the film, by way of the mirror: what is sharp here is sharp on the film.', ...P([0, 1, 0], 0.22, [0.22, 0.38]) },
  { node: 'magazine', label: 'Film magazine', group: 'Magazine', about: 'A box of film that hooks onto the back of the body. With its dark slide in, it can come off in the middle of a roll.', ...P([0, 0, -1], 0.35, [0.06, 0.24]) },
  { node: 'dark_slide', label: 'Dark slide', group: 'Magazine', about: 'A thin steel sheet in front of the film. While it is in, the film is safe and the camera won’t fire.', ...P([0, 1, 0], 0.42, [0.26, 0.4]) },
  { node: 'insert', label: 'Film insert', group: 'Magazine', about: 'Slides out of the left side to load: two 120 spools, the rollers the film turns over, and the pressure plate that holds it flat.', ...P([1, 0, 0], 0.72, [0.3, 0.5]) },
];

const lensAxis = H.lensAxis;
const about = (node, axis, pivot) => ({ node, axis, pivot });
const X = [1, 0, 0];
const Z = [0, 0, 1];
const takeUp = -H.spools.perFrame.takeUp;
const motion = [
  // The lens: focusing slides the optical unit out and turns the ring; the rings turn a step a stop or a speed.
  { node: 'optics', control: 'focus', axis: Z, slide: [0, 0, U(1)] },
  { ...about('focus_ring', Z, lensAxis), control: 'focus', turn: r4(-(H.focus.throw / 360) / H.focus.maxExtension) },
  { ...about('aperture_ring', Z, lensAxis), control: 'aperture', turn: r4(-15 / 360), from: H.rest.stop },
  { ...about('speed_ring', Z, lensAxis), control: 'speed', turn: r4(-21 / 360), from: H.rest.speed },
  ...H.irisPivots.map((pivot, k) => ({ ...about(`iris_blade_${k}`, Z, pivot), control: 'iris', curve: H.irisCurve })),
  ...H.shutterPivots.map((pivot, k) => ({ ...about(`shutter_blade_${k}`, Z, pivot), control: 'blades', turn: H.shutterTurn })),
  // The release: the mirror up about its top back edge, the flaps out about their hinges, the key round.
  { ...about('mirror', X, H.mirrorHinge), control: 'mirror', turn: -0.125 },
  { ...about('flap_upper', X, H.flapUpper), control: 'flaps', turn: -0.25 },
  { ...about('flap_lower', X, H.flapLower), control: 'flaps', turn: 0.25 },
  { ...about('drive_shaft', Z, H.drive), control: 'key', turn: 1 },
  { ...about('cross_shaft', X, H.gears.cross.at), control: 'key', turn: -1 },
  { ...about('idler_gear', X, H.gears.idler.at), control: 'key', turn: r4(35 / 16) },
  { ...about('wind_gear', X, H.gears.wind.at), control: 'key', turn: r4(-35 / 30) },
  { ...about('flap_barrel', X, H.gears.aux.at), control: 'key', turn: r4(35 / 32) },
  { ...about('magazine_gear', X, H.gears.magazine.at), control: 'key', turn: -1.75 },
  { ...about('magazine_input', X, H.magazineGears.input.at), control: 'key', turn: 2.5 },
  { node: 'release_button', control: 'release', axis: Z, slide: [0, 0, U(-2.5)] },
  // Winding: the knob, and the film a frame along.
  { ...about('knob', X, H.knob), control: 'wind', turn: 1 },
  { ...about('spool_drive', X, H.magazineGears.spool.at), control: 'film', turn: r4(takeUp) },
  { ...about('magazine_idler', X, H.magazineGears.idler.at), control: 'film', turn: r4((-takeUp * 24) / 16) },
  { ...about('take_up_spool', X, H.spools.takeUp), control: 'film', turn: r4(takeUp) },
  { ...about('supply_spool', X, H.spools.supply), control: 'film', turn: r4(-H.spools.perFrame.supply) },
  { node: 'film', control: 'film', axis: [0, 1, 0], scroll: -1 },
  { ...about('frame_counter', X, H.counter), control: 'film', turn: r4(1 / 12) },
  { node: 'dark_slide', control: 'slide', axis: [0, 1, 0], slide: [0, H.darkSlide.lift, 0] },
];

const annotations = [
  { title: 'Shutter in the lens', text: 'Five thin blades between the glass, open while you look. Pressing the release shuts them, and they open again only for the exposure.', node: 'optics', position: M(0, 20, 96), camera: pose(M(0, 0, 112), [24, 16], 1.6) },
  { title: 'Mirror', text: 'A front-silvered mirror at 45° throws the lens’s picture up to the screen. It swings up flat under the screen to let the light through to the film.', node: 'chassis', position: M(-14, 12, 29), explode: 0.24, camera: pose(M(0, 4, 46), [12, 14], 1.65) },
  { title: 'Rear flaps', text: 'The lens’s shutter is open while you look, so the body has two flaps of its own in front of the film. They open after the mirror is up and close as you let go of the release.', node: 'rear_plate', position: M(18, 14, 6.6), explode: 0.24, camera: pose(M(0, 2, 4), [165, 42], 2.0) },
  { title: 'Winding knob', text: 'One turn lowers the mirror, cocks the lens’s shutter through the drive key, and winds the film a frame on.', node: 'knob', position: M(-58, 14, 30), camera: pose(M(-56, 2, 38), [-82, 10], 1.45) },
  { title: 'Drive key', text: 'At the bottom of the throat: a slotted key that couples the body to the lens. A spring turns it 309° as the camera fires; the knob turns it back.', node: 'front_plate', position: M(0, -23, 71), explode: 0.25, camera: pose(M(0, -12, 74), [16, 22], 1.25) },
  { title: 'Dark slide', text: 'Pull it out to shoot; push it in to take the magazine off without fogging the film. The camera won’t fire with it in.', node: 'dark_slide', position: M(30, 50, 2), camera: pose(M(0, 36, -24), [-150, 30], 1.8) },
  { title: 'Film insert', text: 'Twelve frames of 120 film run up from the bottom spool, across the picture window and onto the top one. The insert slides out of the side to load it.', node: 'insert', position: M(0, -6, -14), explode: 0.55, camera: pose(M(70, 0, -60), [118, 20], 2.3) },
  { title: 'Focusing screen', text: 'Ground glass on top of the mirror box. You look down at the picture on it, the right way up but reversed left to right.', node: 'screen', position: M(20, 43.2, 52), explode: 0.4, camera: pose(M(0, 66, 41), [-34, 20], 1.75) },
];

// ------------------------------------------------------------------ film
const lensNodes = ['lens', 'optics', 'focus_ring'];
const blades = [...Array.from({ length: 5 }, (_, k) => `shutter_blade_${k}`), ...Array.from({ length: 5 }, (_, k) => `iris_blade_${k}`)];
/** A ray from in front of the lens to the mirror and up to the screen: at height h (mm) entering, bent to hit the mirror at m. */
const reflexRay = (h, m) => {
  const zm = 41 - m;
  return [M(0, h, 160), M(0, h * 0.82, 128), M(0, m, zm), M(0, 41.6, zm)];
};
// The power path, in mm: the knob, its gear, the idler, the cross gear, along the cross shaft to the drive shaft and its key.
const mm = (p) => p.map((v, i) => (v - H.space.origin[i]) * MM);
const G = (name) => mm(H.gears[name].at);
const flowTo = (node, mm) => ({ node, at: M(...mm) });
const windPath = [
  flowTo('knob', [-57, 2, 38]),
  flowTo('wind_gear', [-37.8, 2, 38]),
  flowTo('idler_gear', G('idler')),
  flowTo('cross_shaft', G('cross')),
  flowTo('cross_shaft', [-6, -23, 49.5]),
  flowTo('drive_shaft', [0, -23, 54]),
  flowTo('drive_shaft', [0, -23, 70.4]),
];
const magazinePath = [
  flowTo('wind_gear', [-37.8, 2, 38]),
  flowTo('flap_barrel', G('aux')),
  flowTo('magazine_gear', G('magazine')),
  flowTo('magazine_input', mm(H.magazineGears.input.at)),
  flowTo('spool_drive', [-37.8, 30.4, -22.5]),
  flowTo('take_up_spool', [0, 30.4, -22.5]),
];

/** What stays solid through the film: the lens's glass and what the release and the knob move, and the film. The body,
 *  the mirror box, the lens's mount, the finder and the magazine are glass, so the mirror and the flaps show. The dark
 *  slide is pulled out as the film starts, and left out of the picture. */
const MOVING = [
  'optics',
  'focus_ring',
  ...blades,
  'mirror',
  'flap_upper',
  'flap_lower',
  'release_button',
  'knob',
  'wind_gear',
  'idler_gear',
  'cross_shaft',
  'drive_shaft',
  'flap_barrel',
  'magazine_gear',
  'magazine_input',
  'magazine_idler',
  'spool_drive',
  'take_up_spool',
  'supply_spool',
  'film',
];
/** The release in slow motion: its 82 ms at 1/125 s takes 3.3 s. The same in every shot, so the film runs the same however
 *  it's reached. */
const SLOW = 1 / 40;
const film = [
  {
    chapter: 'Focus',
    caption: 'Focusing screws the lens out until the picture the mirror throws up to the screen is sharp.',
    duration: 6,
    angle: [-56, 28],
    fill: 0.6,
    rate: SLOW,
    focus: MOVING,
    frame: [...lensNodes, 'mirror', 'screen'],
    hide: ['dark_slide'],
    carries: 'light',
    flow: reflexRay(12, 6),
    flows: [reflexRay(0, 0), reflexRay(-12, -6)],
    tags: [
      { node: 'mirror', text: 'mirror', at: M(-30, 14, 27), ride: true },
      { node: 'screen', text: 'screen', at: M(-30, 43.2, 60) },
    ],
    cues: [
      { at: 0, do: 'slide', to: true },
      { at: 1, do: 'focus', to: 2, over: 4 },
    ],
  },
  {
    chapter: 'Fire',
    caption: 'The release flips up the mirror and opens the flaps, and only then fires the lens’s shutter.',
    duration: 6,
    angle: [-80, 34],
    fill: 0.6,
    rate: SLOW,
    focus: MOVING,
    frame: ['mirror', 'flap_upper', 'flap_lower', 'optics'],
    hide: ['dark_slide'],
    tags: [
      { node: 'mirror', text: 'mirror', at: M(-30, 14, 27), ride: true },
      { node: 'flap_upper', text: 'rear flaps', at: M(-30, 20, 6.6), ride: true },
    ],
    cues: [{ at: 1, do: 'fire' }],
  },
  {
    chapter: 'Wind on',
    caption: 'One turn of the knob lowers the mirror, cocks the shutter and winds the film on a frame.',
    duration: 6,
    angle: [-104, 28],
    fill: 0.6,
    rate: SLOW,
    focus: MOVING,
    frame: ['knob', 'mechanism_plate', 'drive_shaft', 'take_up_spool'],
    hide: ['dark_slide'],
    flow: windPath,
    flows: [magazinePath],
    tags: [
      { node: 'knob', text: 'knob' },
      { node: 'drive_shaft', text: 'drive key', at: M(0, -23, 71) },
    ],
    cues: [{ at: 1, do: 'wind-on' }],
  },
];

writeContent('reflex-camera', {
  order: 8,
  title: 'Medium-Format SLR',
  hook: 'A cube of a camera: a mirror, two flaps and a shutter in the lens, all reset by one turn of a knob.',
  category: 'cameras',
  summary: [
    'Hasselblad’s 500C/M of 1970 is a camera built from parts that come off: a body with a mirror, a lens with its own shutter, a magazine of film and a folding finder. Change magazines and you change films halfway through a roll; change finders and you can hold it at eye level. Electric Hasselblads of the same family took the pictures on the Moon.',
    'Looking down into the hood you see the picture on a ground-glass screen, thrown up by the mirror. Pressing the release sets off a chain of events in a few hundredths of a second: the lens shuts, the mirror flies up, two flaps behind it open, and only then does the shutter in the lens open. One turn of the knob on the side resets the lot and winds on the film.',
    'This model was built in code for this site, after the factory service manual’s exploded views and timing chart and the camera’s published dimensions, and its parts move as that chart says they do.',
  ],
  model: 'models/reflex-camera.glb',
  viewAngle: [-38, 16],
  explodeAngle: [-56, 22],
  explodeDuration: 1700,
  facts: [
    { label: 'Film', value: '120 roll film, twelve 56 × 56 mm frames' },
    { label: 'Lens', value: '80 mm f/2.8, 7 glasses in 5 groups' },
    { label: 'Shutter', value: 'In the lens: 1 s to 1/500 s, flash at every speed' },
    { label: 'Lens to film', value: '74.9 mm' },
    { label: 'Made', value: '1970–1994 (500C/M)' },
    { label: 'Size', value: '110 × 114 × 176 mm with lens and magazine' },
  ],
  parts,
  annotations,
  motion,
  film,
  credit: builtInCode('Medium-format SLR, after the Hasselblad 500C/M', 'Laid out from the 500C/M’s published dimensions and the factory service manual’s exploded views and release-sequence chart.'),
  build: { generate: 'objects/reflex-camera/generate.mjs', hints: 'objects/reflex-camera/hints.json' },
});
