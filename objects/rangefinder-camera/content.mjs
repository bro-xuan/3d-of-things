// Writes content/rangefinder-camera.json from the page's text and where the build put things
// (objects/rangefinder-camera/hints.json, written by `npm run models:build -- rangefinder-camera`): the motions'
// pivots, curves and rates come from the hints, and the film's power path and tags are given in millimetres in the
// camera's frame (M). The callouts' positions and cameras, and the explode distances, are still typed in model
// space. Run it after every build:
//   node objects/rangefinder-camera/content.mjs
import { polyHaven, readHints, space, writeContent } from '../../scripts/kit/content.mjs';

const P = (direction, distance, extra = {}) => ({ direction, distance, ...extra });
const still = { direction: [0, 1, 0], distance: 0 };
const H = readHints('rangefinder-camera');
// Model space from the camera frame's millimetres.
const { M, mmPerUnit: MM } = space(H);
const lensAxis = { axis: [0, 0, 1], pivot: H.lens.pivot };
const up = (pivot) => ({ axis: [0, 1, 0], pivot });
const frame = 1; // the film control counts frames
const leverTurns = 20 / 26; // the lever's gear per frame: the sprocket's 20 teeth over its 26
const motion = [
  // Focusing: the optics screw forward, the ring turns 19.4° per mm, the roller arm follows the cam.
  { node: 'optics', control: 'focus', axis: [0, 0, 1], slide: [0, 0, +(1 / MM).toFixed(6)] },
  { node: 'focus_ring', control: 'focus', ...lensAxis, turn: +(19.4 / 360).toFixed(5) },
  { node: 'roller_lever', control: 'focus', ...up(H.rollerLever.pivot), turn: +(-0.2405 / (2 * Math.PI) / H.lens.maxExtension).toFixed(6) },
  { node: 'frame_mask', control: 'focus', axis: [0, 0, 1], slide: [0, +(-0.7 / H.lens.maxExtension / MM).toFixed(6), +(-0.4 / H.lens.maxExtension / MM).toFixed(6)] },
  // The aperture ring: 16.2° a stop; the blades swing in on their pins.
  { node: 'aperture_ring', control: 'aperture', ...lensAxis, turn: -0.045, from: 4 },
  ...H.iris.map((pivot, k) => ({ node: `iris_blade_${k}`, control: 'aperture', axis: [0, 0, 1], pivot, curve: H.irisCurve })),
  // The shutter: each curtain rolls off one roller onto the other.
  { node: 'first_curtain', control: 'curtain1', axis: [0, 1, 0], cloth: true },
  { node: 'second_curtain', control: 'curtain2', axis: [0, 1, 0], cloth: true },
  ...['roller_b1', 'roller_a1'].map((node) => ({ node, control: 'curtain1', ...up(H.rollers[node].pivot), curve: H.rollers[node].curve })),
  ...['roller_a2', 'roller_b2'].map((node) => ({ node, control: 'curtain2', ...up(H.rollers[node].pivot), curve: H.rollers[node].curve })),
  // The advance: a frame per two strokes of the lever.
  { node: 'advance_lever', control: 'lever', ...up(H.lever), turn: +(138.5 / 360).toFixed(4) },
  { node: 'release_button', control: 'release', axis: [0, 1, 0], slide: [0, +(-1.2 / MM).toFixed(5), 0] },
  { node: 'film', control: 'film', axis: [0, 1, 0], scroll: -1 },
  { node: 'sprocket', control: 'film', ...up(H.sprocket), turn: frame },
  { node: 'advance_gear', control: 'film', ...up(H.lever), turn: +leverTurns.toFixed(4) },
  { node: 'idler_gear', control: 'film', ...up(H.idler), turn: +(-leverTurns * 26 / 17).toFixed(4) },
  { node: 'spool_idler', control: 'film', ...up(H.spoolIdler), turn: +(-leverTurns * 26 / 10).toFixed(4) },
  { node: 'spool_drive', control: 'film', ...up(H.takeUp), turn: +(leverTurns * 26 / 15).toFixed(4) },
  { node: 'take_up_spool', control: 'film', ...up(H.takeUp), turn: H.film.perTurn.takeUp },
  { node: 'cassette_spool', control: 'film', ...up(H.cassette), turn: H.film.perTurn.cassette },
];
/** The lens's axis, x and y in mm. */
const AX = [9.95, 33.8];
const fromModel = (p) => p.map((v, i) => (v - H.space.origin[i]) * H.space.mmPerUnit);
const idler = fromModel(H.idler);

// ------------------------------------------------------------------ film
/** What stays solid through the film: the lens and what focusing moves, the curtains and their rollers, and the film
 *  with what winds it on. The body, the top cover, the back and the cassette are glass, so the gate shows through. */
const MOVING = ['optics', 'focus_ring', 'roller_lever', 'swinging_lens', 'release_button', 'first_curtain', 'second_curtain', 'roller_a1', 'film', 'cassette_spool', 'sprocket', 'take_up_spool', 'advance_gear', 'advance_lever'];
/** The shutter in slow motion: its 28 ms run at 1/100 s (18 ms a curtain, the second 10 ms behind) takes 3.4 s. The
 *  same in every shot, so the film runs the same however it's reached. */
const SLOW = 1 / 120;
/** The power's path as the lever winds on: from the lever, through the idler to the sprocket, along the film to the take-up spool. */
const windPath = [
  { node: 'advance_lever', at: M(-24, 75.2, -9), ride: true },
  { node: 'advance_lever', at: M(-43.7, 70, 5.8) },
  M(-43.7, 56, 5.8),
  M(idler[0], 56, idler[2]),
  M(-28, 56, -4.4),
  M(-28, 33.8, -10.6),
  M(-53, 33.8, -6.6),
];
const film = [
  {
    chapter: 'Focus',
    caption: 'Turning the ring screws the lens out to focus at 1 m; its cam sets the rangefinder to match.',
    duration: 6,
    angle: [48, 22],
    fill: 0.55,
    rate: SLOW,
    focus: MOVING,
    frame: ['optics', 'focus_ring', 'roller_lever', 'swinging_lens'],
    tags: [
      { node: 'focus_ring', text: 'focusing ring', at: M(AX[0], AX[1] + 27, 32) },
      { node: 'roller_lever', text: 'cam and roller', at: M(7.1, 52.4, 9.2), ride: true },
    ],
    cues: [
      { at: 0, do: 'speed', to: 1 / 100 },
      { at: 1, do: 'focus', to: 1, over: 4 },
    ],
  },
  {
    chapter: 'Fire',
    caption: 'The release lets the first curtain uncover the film; 1/100 s later the second covers it.',
    duration: 6,
    angle: [12, 46],
    fill: 0.6,
    rate: SLOW,
    focus: MOVING,
    frame: ['film'],
    tags: [
      { node: 'first_curtain', text: 'first curtain', at: M(14, 47, -8) },
      { node: 'second_curtain', text: 'second curtain', at: M(-15, 21, -8.6) },
    ],
    cues: [{ at: 1, do: 'fire' }],
  },
  {
    chapter: 'Wind on',
    caption: 'Two strokes of the lever pull the next frame across and wind both curtains back.',
    duration: 6,
    angle: [-22, 44],
    fill: 0.6,
    rate: SLOW,
    focus: MOVING,
    frame: ['film', 'advance_lever'],
    flow: windPath,
    tags: [
      { node: 'advance_lever', text: 'advance lever', at: M(-26, 77.5, -10), ride: true },
      { node: 'sprocket', text: 'sprocket', at: M(-28, 52, -11.6) },
    ],
    cues: [
      { at: 1, do: 'wind-on' },
      { at: 3, do: 'wind-on' },
    ],
  },
];
writeContent('rangefinder-camera', {
  order: 7,
  title: 'Rangefinder Camera',
  hook: 'Two windows a hand’s width apart find the distance; two cloth curtains race across the film to take the picture.',
  category: 'cameras',
  summary: [
    'A rangefinder camera finds the distance the way a surveyor does. Two windows on its front look at the same subject from 68.5 mm apart. In the viewfinder the second view shows as a bright patch over the first, and turning the focusing ring swings that patch across until the two images lie on top of each other. At that moment the lens is focused.',
    'This one is a Leica M3 from 1955, the camera that set the pattern for the type. Behind the lens two curtains of rubberised cloth run across the film one after the other, and the gap between them is the exposure, down to a thousandth of a second. Two strokes of the lever wind the film on one frame and cock the shutter again.',
  ],
  model: 'models/rangefinder-camera.glb',
  viewAngle: [-28, 16],
  explodeAngle: [-66, 14],
  explodeDuration: 3200,
  facts: [
    { label: 'Model', value: 'Leica M3, 1955' },
    { label: 'Shutter', value: 'Cloth, 1 s to 1/1000 s' },
    { label: 'Rangefinder base', value: '68.5 mm' },
    { label: 'Real size', value: '14 cm wide' },
  ],
  parts: [
    // Lens
    { node: 'lens', label: 'Lens mount', group: 'Lens', about: 'The bayonet that locks the lens to the camera, with the depth-of-field scale on its fixed ring. Everything else in the lens turns or slides inside it.', ...P([0, 0, 1], 0.5, { window: [0, 0.2] }) },
    { node: 'focus_ring', label: 'Focusing ring', group: 'Lens', about: 'Turns a fine thread (a helicoid) that screws the optical unit forward: 4.5 mm out for the nearest focus, 0.7 m. The distance scale is printed on it.', ...still },
    { node: 'aperture_ring', label: 'Aperture ring', group: 'Lens', about: 'Sets the iris, from f/1.4 wide open to f/16. Each click lets in half the light of the one before.', ...still },
    { node: 'hood', label: 'Lens hood', group: 'Lens', about: 'A short tube that keeps stray light from glancing into the front glass.', ...P([0, 0, 1], 0.17, { window: [0.72, 0.9] }) },
    { node: 'optics', label: 'Optical unit', group: 'Lens', about: 'Eight glass elements in a barrel. They bend the light from each point of the subject back to a point on the film, making the picture.', ...still },
    { node: 'iris_blade_0', with: ['iris_blade_1', 'iris_blade_2', 'iris_blade_3', 'iris_blade_4', 'iris_blade_5', 'iris_blade_6', 'iris_blade_7', 'iris_blade_8', 'iris_ring'], label: 'Iris', group: 'Lens', about: 'Nine thin blades on pins. Turning the aperture ring swings them in together, closing a round hole in the middle of the lens.', ...still },
    { node: 'rf_cam', label: 'Rangefinder cam', group: 'Lens', about: 'A curved face on the back of the optical unit. As the lens comes forward to focus close, it pushes the camera’s roller with it.', ...still },
    // Rangefinder
    { node: 'rangefinder', label: 'Rangefinder optics', group: 'Rangefinder', about: 'The prism behind the small window sends its view across the camera to a beam splitter behind the eyepiece, which lays it over the main view as a bright patch.', ...still },
    { node: 'roller_lever', label: 'Roller arm', group: 'Rangefinder', about: 'Rides on the lens’s cam. As the lens comes forward the arm turns on its shaft, and the same shaft swings the moving lens above.', ...still },
    { node: 'swinging_lens', label: 'Moving lens', group: 'Rangefinder', about: 'A small lens in the rangefinder’s beam. Swung a millimetre aside, it tilts the second view by up to 5.6°, which is what slides the patch’s image across.', ...still },
    { node: 'frame_mask', label: 'Frame-line mask', group: 'Rangefinder', about: 'A plate with the outline of the picture cut in it. Light from the frosted window shines through, so a bright frame floats in the viewfinder, and the mask shifts as you focus to allow for the finder sitting above the lens.', ...still },
    // Shutter
    { node: 'shutter', label: 'Shutter', group: 'Shutter', about: 'A frame holding the curtains’ rollers just in front of the film, and the gate: the 24 × 36 mm opening that sets the size of each picture.', ...P([0, 0, -1], 0.28, { window: [0.58, 0.8] }) },
    { node: 'first_curtain', label: 'First curtain', group: 'Shutter', about: 'Covers the film until the shutter fires, then is pulled clear by its spring roller in under a fiftieth of a second.', ...still },
    { node: 'second_curtain', label: 'Second curtain', group: 'Shutter', about: 'Follows the first one across, after a delay set by the speed dial, and covers the film again. The gap between them is the exposure.', ...still },
    { node: 'roller_a1', with: ['roller_a2', 'roller_b1', 'roller_b2'], label: 'Curtain rollers', group: 'Shutter', about: 'Each curtain runs between two rollers: one carries the cloth, the other the tapes from its edge. Springs in the rollers pull the curtains across; the advance lever winds them back.', ...still },
    // Film
    { node: 'film_cassette', label: 'Film cassette', group: 'Film', about: 'A light-tight tin with the unexposed film rolled up inside. The film comes out through a slot lined with velvet.', ...P([0, 0, -1], 0.01, { then: { direction: [0, -1, 0], distance: 0.52 }, window: [0.36, 0.56] }) },
    { node: 'film', label: 'Film', group: 'Film', about: '35 mm film: each picture is 24 × 36 mm, and the holes along both edges, eight per frame, let the sprocket pull it exactly one frame at a time.', ...P([0, 0, -1], 0.01, { then: { direction: [0, -1, 0], distance: 0.52 }, window: [0.36, 0.56] }) },
    { node: 'take_up_spool', label: 'Take-up spool', group: 'Film', about: 'Winds up the film as it is exposed. It is driven a little faster than the film moves, through a slipping clutch, so the film stays taut.', ...P([0, 0, -1], 0.01, { then: { direction: [0, -1, 0], distance: 0.52 }, window: [0.36, 0.56] }) },
    { node: 'sprocket', label: 'Sprocket', group: 'Film', about: 'Its teeth sit in the film’s holes. One turn moves the film 38 mm, one frame, whatever the size of the rolls either side.', ...still },
    { node: 'pressure_plate', label: 'Pressure plate', group: 'Film', about: 'A plate of glass on springs (metal on later cameras) that holds the film flat against the rails in the focal plane.', ...still },
    // Controls
    { node: 'top_plate', label: 'Top cover', group: 'Controls', about: 'A brass cover over the rangefinder and the advance gears, carrying the windows, the dials and the accessory shoe.', ...P([0, 1, 0], 0.24, { window: [0.24, 0.46] }) },
    { node: 'speed_dial', label: 'Shutter speed dial', group: 'Controls', about: 'Sets the delay between the two curtains: 1 second to 1/1000. It doesn’t turn when the shutter fires.', ...P([0, 1, 0], 0.13, { window: [0.46, 0.64] }) },
    { node: 'release_button', label: 'Shutter release', group: 'Controls', about: 'Pressing it lets go of the first curtain. It sits in the middle of the advance lever’s hub.', ...P([0, 1, 0], 0.13, { window: [0.46, 0.64] }) },
    { node: 'advance_lever', label: 'Advance lever', group: 'Controls', about: 'Two strokes on this early M3 wind the film on one frame and rewind both shutter curtains, ready for the next picture.', ...P([0, 1, 0], 0.13, { window: [0.46, 0.64] }) },
    { node: 'advance_gear', with: ['idler_gear', 'spool_idler', 'spool_drive'], label: 'Advance gears', group: 'Controls', about: 'Carry the lever’s stroke to the sprocket and, through a second idler, to the take-up spool.', ...still },
    { node: 'rewind_knob', label: 'Rewind knob', group: 'Controls', about: 'Turned at the end of the roll to wind the film back into its cassette.', ...P([0, 1, 0], 0.13, { window: [0.46, 0.64] }) },
    // Body
    { node: 'body', label: 'Body', group: 'Body', about: 'A casting with chambers for the cassette and the take-up spool at either end, the shutter in the middle and the lens mount in front.', ...still },
    { node: 'back_door', label: 'Back door', group: 'Body', about: 'Lifts up when the base plate is off, so the film can be threaded across the gate. It carries the pressure plate.', ...P([0, 0, -1], 0.36, { then: { direction: [0, 1, 0], distance: 0.55 }, window: [0.14, 0.36] }) },
    { node: 'bottom_plate', label: 'Base plate', group: 'Body', about: 'The M3 loads from the bottom: turn the key and the whole base comes away, and the film goes in from below.', ...P([0, -1, 0], 0.24, { then: { direction: [0, 0, 1], distance: 0.52 }, window: [0.06, 0.3] }) },
  ],
  annotations: [
    { title: 'Rangefinder window', text: 'The small window sees the subject from 68.5 mm to the side of the viewfinder. A prism behind it sends that view across the camera to the eyepiece, where it appears as a bright patch in the middle of the finder.', node: 'top_plate', position: [-0.237, 0.684, -0.083], camera: { position: [-0.512, 0.809, 0.765], target: [-0.237, 0.684, -0.083] } },
    { title: 'Viewfinder window', text: 'You look straight through here and the eyepiece, at nearly life size (0.91×), so you can keep both eyes open. The frosted window beside it lights the frame lines that show what the lens takes in.', node: 'top_plate', position: [0.46, 0.685, -0.093], camera: { position: [0.841, 0.85, 0.762], target: [0.46, 0.685, -0.093] } },
    { title: 'Focusing ring', text: 'Turning it a quarter turn takes the focus from infinity in to 0.7 m, screwing the glass 4.5 mm forward. The rangefinder follows it through a cam on the back of the lens.', node: 'focus_ring', position: [0.096, 0.602, 0.061], camera: { position: [-0.278, 1.187, 0.709], target: [0.096, 0.602, 0.061] } },
    { title: 'Aperture ring', text: 'Marked 1.4 to 16. Each step halves the area of the hole in the iris, and so the light reaching the film.', node: 'aperture_ring', position: [0.096, 0.605, 0.236], camera: { position: [0.499, 1.108, 0.934], target: [0.096, 0.605, 0.236] } },
    { title: 'Shutter speed dial', text: 'B, then 1 second down to 1/1000, in the older series this early camera has (1/25, 1/50, 1/100…). It sets how long the second curtain waits before it follows the first.', node: 'speed_dial', position: [-0.188, 0.79, -0.249], camera: { position: [-0.524, 1.46, 0.152], target: [-0.188, 0.79, -0.249] } },
    { title: 'Advance lever', text: 'Swing it out twice to wind on a frame. The same strokes rewind the shutter, so you can’t take two pictures on one frame by mistake.', node: 'advance_lever', position: [-0.33, 0.78, -0.29], camera: { position: [-0.654, 1.405, -0.851], target: [-0.33, 0.78, -0.29] } },
    { title: 'Shutter curtains', text: 'Behind the lens, two cloth curtains sit just in front of the film. Firing, the first runs across in about 18 ms; the second follows after the exposure time. At 1/1000 s only a 2 mm slit of light sweeps across the frame.', node: 'shutter', position: [0.096, 0.341, -0.36], explode: 0.57, camera: { position: [-0.1, 1.04, -2.05], target: [0.096, 0.729, -0.36] } },
  ],
  credit: polyHaven('Camera_01', 'Camera 01', 'Rajil Jose Macatangay', { label: 'Insides', text: 'The shutter, film transport, rangefinder optics and iris were built for 3D of Things after the Leica M3, and fitted inside the model.' }),
  build: { augment: 'objects/rangefinder-camera/augment.mjs', hints: 'objects/rangefinder-camera/hints.json' },
  motion,
  film,
});
