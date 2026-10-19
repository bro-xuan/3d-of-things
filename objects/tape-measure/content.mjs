// Writes content/tape-measure.json from the page's text and where the build put things (objects/tape-measure/
// hints.json), so no model-space number is pasted by hand. Run it after every build:
//   node objects/tape-measure/content.mjs
// The numbers in the words come from the same layout the model and its viewer module run on (tape.mjs).
import { polyHaven, pose, readHints, writeContent } from '../../scripts/kit/content.mjs';
import { L, bladePath, maxOut } from './tape.mjs';

const H = readHints('tape-measure');
const A = H.anchors;
const U = (mm) => +(mm * H.unitPerMm).toFixed(4);
const blade = H.blade;
const spring = blade.spring;
const most = maxOut(blade);
const turnsAt = (mm) => (bladePath(blade, mm).drum - bladePath(blade, 0).drum) / (2 * Math.PI);
const drumTurns = turnsAt(most);
const perTurn = Math.round(most / drumTurns / 10);
const springMetres = (spring.length / 1000).toFixed(1);
const play = L.hook.thickness;
const n = (v, d = 1) => v.toFixed(d);

const off = (direction, distance, window) => ({ direction, distance, window });
const stay = { direction: [0, 1, 0], distance: 0 };

/** What stays solid through the film: the blade and its hook, the drum, the spring and its post, and the lock. The
 *  case's halves and the clip are glass, so the spring can be seen winding inside them. */
const MOVING = ['blade', 'end_hook', 'hook_rivets', 'drum', 'recoil_spring', 'spring_post', 'lock_button', 'brake'];
/** What every shot frames: the case, and the hook wherever it gets to. */
const SHOWN = ['case_left', 'case_right', 'end_hook'];
/** The blade the film pulls out (mm): one turn of the drum, from home (a little more than the average turn, as the roll
 *  is at its fattest). */
const PULLED = (() => {
  let [lo, hi] = [0, 400];
  for (let i = 0; i < 40; i++) [lo, hi] = turnsAt((lo + hi) / 2) < 1 ? [(lo + hi) / 2, hi] : [lo, (lo + hi) / 2];
  return Math.round(hi);
})();
/** The drum's tag goes round with it on its rim, so its one turn shows (the drum itself is a plain ring); the spring's sits
 *  inside that circle, above the post. */
const springTags = [
  { node: 'drum', text: 'drum', at: A.drum_lip, ride: true },
  { node: 'recoil_spring', text: 'spring', at: [A.spring_inner[0], +(A.centre[1] + 0.12).toFixed(3), A.centre[2]] },
];

writeContent('tape-measure', {
  order: 19,
  title: 'Tape Measure',
  hook: `Pull out three metres and you wind a spring ${Math.round(drumTurns)} turns tighter; let go and it winds the blade back in.`,
  category: 'home',
  summary: [
    'A tape measure has to fit three metres of ruler in a pocket and bring it back by itself. It does both with steel: a blade curved across its width, stiff enough to stand out in the air yet flat enough to coil, and a spring that keeps the pull you put into it.',
    'Your pull on the hook draws the blade off a drum, and the drum carries the outer end of a flat spiral spring round a post fixed in the case. A shoe under the front button can pinch the blade to hold it, and the hook on its end slides on its rivets.',
    `Pull all 3 m out and the drum turns ${n(drumTurns)} times, moving the spring's coils off the drum's wall and onto the post; let go and the spring turns it back. Here the blade, drum and spring move together from one set of sums, and the hook slides by its own ${play} mm as it is pulled.`,
  ],
  model: 'models/tape-measure.glb',
  viewAngle: [-35, 16],
  explodeAngle: [-58, 18],
  explodeDuration: 2600,
  facts: [
    { label: 'Blade', value: '3 m × 19 mm steel, 0.13 mm thick' },
    { label: 'Drum', value: `${n(drumTurns)} turns from home to 3 m` },
    { label: 'Accuracy', value: 'Class II: ±0.9 mm over 3 m' },
    { label: 'Hook play', value: `${play} mm, its own thickness` },
    { label: 'Standout', value: '1.4–1.85 m for a 19 mm blade' },
    { label: 'Real size', value: '41 × 74 × 85 mm' },
  ],
  parts: [
    { node: 'end_hook', label: 'End hook', group: 'Your pull', about: `Where your pull goes in: ${play} mm of steel riveted to the blade's end. It slides on its rivets by exactly its own thickness, so the zero is right whether it's hooked or pushed.`, ...off([0, 0, 1], 0.35, [0.6, 0.85]) },
    { node: 'hook_rivets', label: 'Rivets', group: 'Your pull', about: `Two rivets fixed in the blade, running in slots in the hook ${play} mm longer than they are.`, ...off([0, 1, 0], 0.2, [0.5, 0.7]) },
    { node: 'blade', label: 'Blade', group: 'Blade', about: `3 m of steel 0.13 mm thick and 19 mm wide, curved across its width. On the drum it lies flat, about ${Math.round(drumTurns)} turns deep; out in the air the curve stiffens it.`, ...stay },
    { node: 'drum', label: 'Drum', group: 'Drum', about: `A 44 mm hub with the blade's tail fixed to it. About ${perTurn} cm of blade turns it once; inside is the spring's barrel.`, ...stay },
    { node: 'recoil_spring', label: 'Recoil spring', group: 'Spring', about: `${springMetres} m of spring steel 0.13 mm thick and 16 mm wide, coiled ${Math.round(spring.turns)} turns deep in the drum: its inner end on the post, its outer end on the drum.`, ...off([-1, 0, 0], 0.45, [0.75, 1]) },
    { node: 'spring_post', label: 'Spring post', group: 'Spring', about: "Moulded into the right half of the case: the spring's inner end hooks on it and the drum turns round it. It never moves, so the drum's turning winds the spring.", ...off([1, 0, 0], 0.5, [0.8, 1]) },
    { node: 'lock_button', label: 'Lock button', group: 'Lock', about: 'Press it 2 mm into its recess and the shoe under it drops onto the blade.', ...off([0, 0.6, 0.8], 0.55, [0.4, 0.65]) },
    { node: 'brake', label: 'Brake shoe', group: 'Lock', about: "An arm from the button down inside the case's front wall, ending in a shoe just over the blade behind the mouth. Locked, it pinches the blade against the guide under it.", ...stay },
    { node: 'case_left', label: 'Case, left half', group: 'Case', about: 'One of two moulded halves under a rubber skin; this one carries the label.', ...off([-1, 0, 0], 0.6, [0.1, 0.45]), then: { direction: [0, 0, -1], distance: 1.1 } },
    { node: 'case_right', label: 'Case, right half', group: 'Case', about: "The other half: the spring's post stands from its wall, and the guide the blade runs out on is moulded into it.", ...off([1, 0, 0], 0.75, [0.1, 0.45]) },
    { node: 'belt_clip', label: 'Belt clip', group: 'Case', about: "Sprung steel, screwed to the case where the spring's post is.", ...off([1, 0, 0], 0.25, [0, 0.25]) },
  ],
  annotations: [
    {
      title: 'The end hook',
      text: `Your pull starts here, on ${play} mm of steel riveted to the end of the blade. It is loose on purpose (number 6).`,
      position: A.hook_lip,
      node: 'end_hook',
      camera: pose(A.hook_top, [40, 18], 1.6, { card: 'left' }),
    },
    {
      title: 'The blade',
      text: `Steel 0.13 mm thick and 19 mm wide, curved across its width. It leaves the drum's roll at the bottom and runs out through a guide in the mouth; on the roll it lies flat, ${Math.round(drumTurns)} turns deep.`,
      position: A.roll_side,
      node: 'blade',
      explode: 0.45,
      camera: pose(A.roll_front, [-70, 16], 2.4),
    },
    {
      title: 'The drum',
      text: `The blade's tail is fixed to this 44 mm hub, so every ${perTurn} cm or so you pull turns it once: ${n(drumTurns)} turns for the whole 3 m.`,
      position: A.drum_lip,
      node: 'drum',
      explode: 0.45,
      camera: pose(A.centre, [-75, 10], 2.5),
    },
    {
      title: 'The recoil spring',
      text: `${springMetres} m of spring steel inside the drum, its inner end on a post fixed to the case and its outer end on the drum. Pull the blade out and the drum winds it tighter, its coils moving off the drum's wall onto the post.`,
      position: A.spring_side,
      node: 'recoil_spring',
      explode: 0.45,
      camera: pose(A.centre, [-88, 6], 2.2),
    },
    {
      title: 'The lock',
      text: 'Press the button 2 mm and a shoe on its arm drops onto the blade just behind the mouth, pinching it against the guide under it. The spring can no longer pull it in.',
      position: A.button,
      node: 'lock_button',
      camera: pose(A.stem, [-55, 20], 2.4, { card: 'left' }),
    },
    {
      title: 'The loose hook is meant to be',
      text: `It isn't worn. The rivets run in slots ${play} mm longer than they are, so the hook slides by exactly its own thickness: out when you hook an edge, in when you push against a wall. Both readings start at the true zero.`,
      position: A.rivet,
      node: 'hook_rivets',
      camera: pose(A.rivet, [25, 40], 1.4, { card: 'left' }),
    },
    {
      title: 'The case',
      text: "Two moulded halves under a rubber skin. The right one carries the spring's post and the guide the blade runs out on.",
      position: A.case_left,
      node: 'case_left',
      camera: pose(A.centre, [-70, 12], 2.6),
    },
    {
      title: 'The belt clip',
      text: "Sprung steel, held by one screw into the case where the spring's post stands.",
      position: A.clip,
      node: 'belt_clip',
      camera: pose(A.clip, [110, 12], 2.4),
    },
  ],
  motion: [
    { node: 'drum', control: 'tape_drum', turn: 1, axis: [-1, 0, 0], pivot: H.pivots.drum },
    { node: 'blade', control: 'tape_out', strip: true, axis: [1, 0, 0] },
    { node: 'recoil_spring', control: 'tape_drum', strip: true, axis: [1, 0, 0] },
    { node: 'end_hook', control: 'tape_out', axis: [0, 0, 1], slide: [0, 0, U(1)] },
    { node: 'end_hook', control: 'tape_hook', axis: [0, 0, 1], slide: [0, 0, U(play)] },
    { node: 'hook_rivets', control: 'tape_out', axis: [0, 0, 1], slide: [0, 0, U(1)] },
    { node: 'lock_button', control: 'tape_lock', axis: [1, 0, 0], slide: H.press.map((c) => +(c * U(H.pressMm)).toFixed(5)) },
  ],
  // "How it works" as an animation: the blade pulled out a turn's worth, the lock on, and the blade wound back in. Every
  // shot frames the case and the hook out as far as it goes, so the camera only goes round.
  film: [
    {
      chapter: 'Pull',
      caption: `Pull out ${Math.round(PULLED / 10)} cm of blade and the drum turns once, winding the spring inside a turn tighter.`,
      duration: 7,
      angle: [-80, 14],
      fill: 0.85,
      focus: MOVING,
      frame: SHOWN,
      tags: springTags,
      cues: [{ at: 0.8, do: 'tape-out', to: PULLED, over: 4.5 }],
    },
    {
      chapter: 'Lock',
      caption: 'Press the lock and a shoe pinches the blade against its guide, so it stays out.',
      duration: 5,
      angle: [-62, 20],
      fill: 0.85,
      focus: MOVING,
      frame: SHOWN,
      tags: [
        { node: 'lock_button', text: 'lock', at: A.button },
        { node: 'brake', text: 'shoe', at: A.shoe },
      ],
      cues: [{ at: 1, do: 'tape-lock', to: true }],
    },
    {
      chapter: 'Let go',
      caption: 'Let the lock off and the spring unwinds, turning the drum back and reeling the blade in.',
      duration: 6,
      angle: [-46, 16],
      fill: 0.85,
      focus: MOVING,
      frame: SHOWN,
      tags: springTags,
      cues: [
        { at: 0.8, do: 'tape-lock', to: false },
        { at: 1, do: 'tape-out', to: 0, over: 3.5 },
      ],
    },
  ],
  credit: polyHaven('measuring_tape_01', 'Measuring Tape 01', 'Kuutti Siitonen', {
    label: 'Built for this site',
    text: "The case cut into its halves and given walls, the mouth opened; the blade, drum, spring and its post, hook with slotted rivets and brake generated from a Stanley PowerLock 3 m × 19 mm and its patents. The blade's curve, the spring's size and pull, and the lock as a press are this model's own; the wrist strap is left off.",
  }),
  build: { augment: 'objects/tape-measure/augment.mjs', hints: 'objects/tape-measure/hints.json' },
});
