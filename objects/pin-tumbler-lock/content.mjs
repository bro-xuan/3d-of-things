// Writes content/pin-tumbler-lock.json: the page's text, and where the build put things (objects/pin-tumbler-lock/hints.json,
// written by `npm run models:build -- pin-tumbler-lock`), so no model-space number is pasted by hand. Run it after
// every build:   node objects/pin-tumbler-lock/content.mjs
//
// The lock's mechanism is src/viewer/pintumbler.ts: it sets the controls the motions below follow (the keys' places, each
// stack's lift in mm, the plug's angle in degrees). Its numbers, and the bitting the text quotes, come from
// src/viewer/kw1.json, the same file the build reads.
import { readFileSync } from 'node:fs';
import { builtInCode, readHints, space, writeContent } from '../../scripts/kit/content.mjs';

const H = readHints('pin-tumbler-lock');
const { pose } = space(H);
const at = (name) => H?.anchors?.[name] ?? (H ? missing(name) : [0, 0.5, 0]);
const pivot = (name) => H?.pivots?.[name] ?? (H ? missing(name) : [0, 0.5, 0]);
const KW1 = JSON.parse(readFileSync(new URL('../../src/viewer/kw1.json', import.meta.url), 'utf8'));
const D = KW1.drawn;
const mm = (v) => +v.toFixed(2);
/** Model units per mm, for the controls' slides; the stacks' points, by stack. */
const perMm = H?.perMm ?? 0.0144;
const stacks = H?.anchors?.stacks ?? [0, 1, 2, 3, 4].map(() => ({ tip: [0, 0.5, 0], shear: [0, 0.5, 0], driverTop: [0, 0.5, 0], spring: [0, 0.5, 0], side: [0, 0.5, 0] }));
const coilShare = H?.coilShare ?? [];
const RIGHT = KW1.keys.right;
const WRONG = KW1.keys.wrong;
const crank = D.throw / Math.SQRT2;
/** The bolt's travel for the plug's angle (the drive's crank pin from 45° left of the top), as src/viewer/pintumbler.ts has it. */
const bolt = (deg) => crank * (Math.sin(((deg - 45) * Math.PI) / 180) + Math.SQRT1_2);

const PARTS = [
  { node: 'key', label: 'Key', group: 'Key', about: `A brass KW1 key cut ${RIGHT.join('-')}: five cuts 0.150 inch apart, each one of six depths. It slides in to its shoulder and turns with the plug.`, direction: [0, 0, 1], distance: 0.5, window: [0.62, 0.8] },
  { node: 'wrong_key', label: 'Wrong key', group: 'Key', about: `The same blank cut ${WRONG.join('-')}. Two cuts are two steps off, so two stacks miss the line: it goes in just as far, and won’t turn.`, direction: [-1, 0, 0], distance: 0.25, window: [0, 0.18] },
  { node: 'key_pins', label: 'Key pins', group: 'Pin stacks', about: 'Five brass pins in holes across the plug, pointed to ride the key’s cuts. Each is as much longer as its cut is deeper, and they turn with the plug.', direction: [0, 1, 0], distance: 0.3, window: [0.5, 0.68] },
  { node: 'driver_pins', label: 'Driver pins', group: 'Pin stacks', about: 'Five identical pins, 0.180 inch long, in the housing’s chambers. With no key they sit half in the plug and half in the housing, and hold it.', direction: [0, 1, 0], distance: 0.36, window: [0.38, 0.56] },
  { node: 'springs', label: 'Springs', group: 'Pin stacks', about: 'One small coil spring over each driver pushes its stack down onto the key, or into the plug when there is none.', direction: [0, 1, 0], distance: 0.52, window: [0.25, 0.43] },
  { node: 'plug', label: 'Plug', group: 'Plug', about: 'The brass cylinder you turn, 12.65 mm across, with the keyway broached through it. Its surface is the shear line.', direction: [0, 0, 1], distance: 0.68, window: [0.75, 0.95] },
  { node: 'tailpiece', label: 'Tailpiece', group: 'Plug', about: 'A flat steel bar fixed to the plug’s tail. It carries the turn back through the door to the bolt’s drive.', direction: [0, 0, 1], distance: 0 },
  { node: 'retainer', label: 'Plug retainer', group: 'Plug', about: 'A C-shaped clip in a groove on the plug’s tail, holding it in the housing. Spring it off and the plug slides out of the front: the first step in rekeying.', direction: [0, 1, 0], distance: 0.2, window: [0.38, 0.56] },
  { node: 'drive', label: 'Drive', group: 'Bolt', about: 'Turned by the tailpiece. Its crank pin swings a quarter turn in a slot in the bolt’s tail.', direction: [0, 0, 1], distance: 0.2, window: [0.25, 0.43] },
  { node: 'bolt', label: 'Bolt', group: 'Bolt', about: 'Thrown 25.4 mm (one inch) out of the door’s edge into the frame by the quarter turn, and drawn back by turning back.', direction: [1, 0, 0], distance: 0 },
  { node: 'latch_case', label: 'Latch case', group: 'Bolt', about: 'The tube that guides the bolt, 60.3 mm (2⅜ inch) from the cylinder to the door’s edge, and the plates the drive works between.', direction: [0, 0, -1], distance: 0.5, window: [0, 0.18] },
  { node: 'latch_cover', label: 'Latch cover', group: 'Bolt', about: 'The plate on the cylinder’s side of the drive.', direction: [0, 1, 0], distance: 0.55, window: [0.12, 0.3] },
  { node: 'spring_cover', label: 'Spring cover', group: 'Housing', about: 'A thin brass strip snapped over the chambers’ tops. It holds the springs in; off it comes when the lock is rekeyed.', direction: [0, 1, 0], distance: 0.68, window: [0.12, 0.3] },
  { node: 'housing', label: 'Housing', group: 'Housing', about: 'The fixed brass shell. The plug turns in its bore, and the five chambers are drilled up through its ridge.', direction: [0, -1, 0], distance: 0 },
];

const STACKS = ['key_pins', 'driver_pins', 'springs'];
const LOCK = ['plug', ...STACKS];
/** What stays solid through the film: the key and the pins it lifts, and the parts the turn drives. The plug, the
 *  housing and the latch's case are glass, so the key's cuts can be seen lifting the pins inside them. */
const MOVING = ['key', ...STACKS, 'tailpiece', 'drive', 'bolt'];

/** The power's path: from the hand on the key's bow, through the blade and plug, down the tailpiece, round the drive to the bolt. */
const powerPath = [
  { node: 'key', at: at('key_bow'), ride: true },
  { node: 'key', at: at('key_blade'), ride: true },
  { node: 'plug', at: at('plug_top'), ride: true },
  { node: 'tailpiece', at: at('tail_start'), ride: true },
  { node: 'drive', at: at('drive'), ride: true },
  { node: 'drive', at: at('crank_pin'), ride: true },
  { node: 'bolt', at: at('bolt_back'), ride: true },
  { node: 'bolt', at: at('bolt_face'), ride: true },
];

/** The shear line, drawn across the five stacks on the housing (it stays put as the plug turns), a little past each end. */
const shearLine = (() => {
  const [a, b] = [stacks[0].shear, stacks[4].shear];
  const past = (from, to) => from.map((c, i) => +(c + (from[i] - to[i]) * 0.18).toFixed(4));
  return [{ node: 'housing', at: past(a, b) }, { node: 'housing', at: past(b, a) }];
})();

/** Where a part has got to with the model this far apart (model units), by the viewer's timing: for cameras on parts that have moved. */
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const apart = (node, v, point) => {
  const p = PARTS.find((q) => q.node === node);
  const t = Math.min(1, Math.max(0, (v - p.window[0]) / (p.window[1] - p.window[0])));
  const len = Math.hypot(...p.direction);
  return point.map((c, i) => +(c + (p.direction[i] / len) * p.distance * ease(t)).toFixed(4));
};

writeContent('pin-tumbler-lock', {
  order: 15,
  title: 'Pin Tumbler Lock',
  hook: 'The key works nothing inside: it lifts five pins, each to within a tenth of a millimetre of one line.',
  category: 'home',
  summary: [
    'A door lock has to let one key turn it and refuse every other, with nothing to wind or power. The pin tumbler does it with a brass plug that turns inside a fixed housing, and five stacks of pins in holes drilled across the gap between them. Each stack is two pins on a spring. Unless the split between them lies exactly on the gap, the shear line, one pin bridges it and the plug can’t turn.',
    'This is a Kwikset KW1 cylinder, the common American house lock, keyed to the example in Kwikset’s own rekeying manual, 4-3-6-4-3. Its five key pins come in six lengths 0.023 inch apart; the five driver pins above them are all 0.180 inch long. Its tailpiece runs back to a deadbolt, whose bolt a quarter turn throws 25.4 mm.',
    'The key doesn’t work a mechanism. Its cuts are heights: pushing it in, each pin rides up and down the cuts until it settles in its own, and the right cut lifts its stack so the split sits on the line. Then your wrist turns the plug, and the plug throws the bolt. Here you can push the key in by hand, try a wrong one, and turn.',
  ],
  model: 'models/pin-tumbler-lock.glb',
  viewAngle: [-42, 22],
  explodeAngle: [-58, 26],
  explodeDuration: 2800,
  facts: [
    { label: 'Pin stacks', value: '5, key pins in 6 lengths' },
    { label: 'Cut spacing', value: '0.150 in (3.81 mm)' },
    { label: 'Depth step', value: '0.023 in (0.58 mm)' },
    { label: 'Combinations', value: '6⁵ = 7,776 in theory' },
    { label: 'Bolt throw', value: '25.4 mm in a quarter turn' },
    { label: 'Plug', value: '12.65 mm across' },
  ],
  // In energy-chain order, grouped. Outer parts come off first.
  parts: PARTS,
  annotations: [
        { title: 'The key', text: `Five cuts 0.150 inch apart, each one of six depths 0.023 inch apart: ${RIGHT.join('-')}. They are heights, not a code: each lifts one stack of pins to one line.`, node: 'key', position: at('key_bow'), explode: 0, camera: pose(at('key_blade'), [35, 16], 2.1, { card: 'left' }) },
        { title: 'Key pins', text: 'One length for each depth of cut. A deeper cut gets a longer pin, so that cut and pin always add up to 0.501 inch and every pin’s top stops at the same height.', node: 'key_pins', position: stacks[2].shear, explode: 0.7, camera: pose(apart('key_pins', 0.7, stacks[2].shear), [72, 22], 1.45) },
        { title: 'The shear line', text: 'The key works nothing inside. These drivers lock the plug by sitting across its surface, and the key only lifts each stack until its split lies exactly there. One cut 0.58 mm out and a pin still bridges it.', node: 'driver_pins', position: stacks[1].shear, explode: 0.56, camera: pose(apart('driver_pins', 0.56, stacks[1].shear), [70, 24], 1.45) },
        { title: 'Springs', text: 'Each pushes its stack down: onto the key as it slides in, so the pins ride its cuts, and into the plug when the key comes out.', node: 'springs', position: stacks[3].spring, explode: 0.43, camera: pose(apart('springs', 0.43, stacks[3].spring), [68, 22], 1.5) },
        { title: 'Plug', text: 'With every split on the line nothing holds it, and the plug turns in the housing’s bore. The key pins turn with it; the drivers stay behind, sitting on its surface.', node: 'plug', position: at('plug_face'), explode: 0, camera: pose(at('plug_face'), [-24, 14], 1.7, { card: 'right' }) },
            { title: 'Tailpiece and drive', text: 'The plug’s turn goes back through the door on a flat steel bar to the deadbolt’s drive, whose crank pin swings in a slot in the bolt’s tail.', node: 'drive', position: at('drive'), explode: 0.3, camera: pose(apart('latch_case', 0.3, apart('drive', 0.3, at('drive'))), [46, 32], 2.4, { card: 'left' }) },
        { title: 'Bolt', text: 'A quarter turn throws it 25.4 mm (one inch) into the door frame. The crank pushes hardest in the middle of the turn.', node: 'bolt', position: at('bolt_top'), explode: 0, camera: pose(at('bolt_top'), [42, 24], 2.0, { card: 'left' }) },
  ],
  motion: [
    { node: 'plug', axis: [0, 0, 1], pivot: pivot('plug'), control: 'lock-turn', turn: -1 / 360 },
    { node: 'drive', axis: [0, 0, 1], pivot: pivot('drive'), control: 'lock-turn', turn: -1 / 360 },
    { node: 'bolt', axis: [1, 0, 0], control: 'lock-turn', curve: [0, 10, 20, 30, 40, 45, 50, 60, 70, 80, 90].map((d) => [d, mm(bolt(d))]), slide: [perMm, 0, 0] },
    // The right key: 0 in, 1 out in front of the plug, 2 aside. The wrong key: 0 beside the lock, 1 out, 2 in front of the keyway, 3 in.
    { node: 'key', axis: [0, 0, 1], control: 'lock-key', curve: [[0, 0], [1, D.out], [2, D.out]], slide: [0, 0, perMm] },
    { node: 'key', axis: [1, 0, 0], control: 'lock-key', curve: [[0, 0], [1, 0], [2, D.aside]], slide: [perMm, 0, 0] },
    { node: 'wrong_key', axis: [1, 0, 0], control: 'lock-wrong', curve: [[0, 0], [1, 0], [2, D.aside], [3, D.aside]], slide: [perMm, 0, 0] },
    { node: 'wrong_key', axis: [0, 0, 1], control: 'lock-wrong', curve: [[0, 0], [1, D.out], [2, D.out], [3, 0]], slide: [0, 0, perMm] },
    // Each stack rises and falls with the key under it (mm from where the right key holds it); a spring's coils share the move.
    ...[1, 2, 3, 4, 5].flatMap((n) => [
      { node: `key_pin_${n}`, axis: [0, 1, 0], control: `lock-pin-${n}`, slide: [0, perMm, 0] },
      { node: `driver_${n}`, axis: [0, 1, 0], control: `lock-pin-${n}`, slide: [0, perMm, 0] },
      ...coilShare.map((share, k) => ({ node: `coil_${n}_${k}`, axis: [0, 1, 0], control: `lock-pin-${n}`, slide: [0, +(perMm * share).toFixed(6), 0] })),
    ]),
  ],
  // "How it works" as an animation: the key out, in, turned, and a wrong one refused.
  film: [
    {
      chapter: 'The key',
      caption: 'Slide the key in. Each cut lifts a pair of pins to its own height.',
      duration: 6,
      angle: [-114, 10],
      fill: 0.56,
      focus: MOVING,
      frame: [...LOCK, 'key'],
      hide: ['wrong_key'],
      tags: [
        { node: 'springs', text: 'springs' },
        { node: 'driver_pins', text: 'top pins' },
        { node: 'key_pins', text: 'bottom pins' },
      ],
      cues: [
        { at: 0, do: 'insert', to: 0 },
        { at: 0.5, do: 'insert', to: 1, over: 4.5 },
      ],
    },
    {
      chapter: 'The key',
      caption: 'With the right key, the gap in every pair lines up with the edge of the plug.',
      duration: 5,
      angle: [-98, 14],
      fill: 0.5,
      focus: MOVING,
      frame: LOCK,
      hide: ['wrong_key'],
      flow: shearLine,
      tags: [{ node: 'driver_pins', text: 'shear line', at: stacks[4].shear }],
    },
    {
      chapter: 'Turn',
      caption: 'Nothing pins the plug now, so it turns with the key and its tailpiece throws the bolt.',
      duration: 7.5,
      angle: [-40, 24],
      fill: 0.74,
      focus: MOVING,
      frame: [...LOCK, 'key', 'tailpiece', 'drive', 'bolt'],
      hide: ['wrong_key'],
      flow: powerPath,
      tags: [
        { node: 'plug', text: 'plug' },
        { node: 'bolt', text: 'bolt' },
      ],
      cues: [{ at: 1, do: 'turn', to: 90, over: 4.5 }],
    },
  ],
  credit: builtInCode(
    'Pin tumbler lock: a Kwikset KW1 cylinder and 660-type deadbolt',
    'Kwikset Rekeying Manual (2013); LockWiki, “Kwikset Classic” (KW1 depths, spacing and pin lengths, CC BY); Kwikset 660 specifications (1 inch throw, 2⅜ inch backset). Simplified: a plain keyway, springs as separate coils, and the bolt’s drive drawn as a crank in a slot.',
  ),
  build: { generate: 'objects/pin-tumbler-lock/generate.mjs', hints: 'objects/pin-tumbler-lock/hints.json' },
});

function missing(name) {
  throw new Error(`objects/pin-tumbler-lock/hints.json has no "${name}": add it to the hints generate.mjs returns, then npm run models:build -- pin-tumbler-lock`);
}
