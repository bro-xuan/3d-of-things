// Writes content/door-lock.json: the page's text, and where the build put things (objects/door-lock/hints.json,
// written by `npm run models:build -- door-lock`), so no model-space number is pasted by hand. Run it after
// every build:   node objects/door-lock/content.mjs
//
// The keying numbers in the text come from the lock's module (src/viewer/pinlock.ts), the same ones the
// generator cut the key and the pins from and the viewer runs.
import { builtInCode, readHints, space, writeContent } from '../../scripts/kit/content.mjs';
import { LOCK, KEYS, rootDepth, keyPinLength, driverPinLength } from '../../src/viewer/pinlock.ts';

const H = readHints('door-lock');
const { U, pose } = space(H);
/** A named point from the build (model space). Before the first build there are none yet, so a placeholder. */
const at = (name) => H?.anchors?.[name] ?? (H ? missing(name) : [0, 0.5, 0]);
const pivot = (name) => H?.pivots?.[name] ?? (H ? missing(name) : [0, 0.5, 0]);
const mm = (v, d = 2) => `${v.toFixed(d)} mm`;
const code = (bitting) => bitting.join('-');
/** How deep cut i goes into the blade, from its top (mm). */
const cutDepth = (depth) => LOCK.blade - rootDepth(depth);
const PINS = KEYS.right.map((_, i) => i + 1);
const COILS = H?.coils ?? 6;
const off = (direction, distance, window) => ({ direction, distance: U(distance), window });

const ORDINAL = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
const pins = (prefix) => PINS.map((n) => `${prefix}_${n}`);

writeContent('door-lock', {
  order: 16,
  title: 'Pin Tumbler Lock',
  hook: 'Five pin stacks, each split at its own height: only the right key lifts every split to one line.',
  category: 'home',
  summary: [
    'A door lock has to know one key from thousands of others, with no power, for decades. A pin tumbler lock does it with a line: the plug that turns with the key can only turn while nothing crosses the thin gap between it and the shell round it.',
    'Five stacks of pins sit in holes drilled across that gap, pushed down by springs, and each stack is split in two at a different height. The key’s cuts lift each stack by just the right amount to bring every split onto the gap. Then the plug turns, and its tailpiece turns the deadbolt.',
    `This one is laid out from Schlage’s published keying figures: cuts ${mm(LOCK.spacing)} apart, ten depths ${mm(LOCK.step, 3)} apart, pins ${mm(LOCK.pin)} across. On the model the key slides in and the pins ride its edge, worked out from the same figures; try the right key and a wrong one.`,
  ],
  model: 'models/door-lock.glb',
  viewAngle: [-38, 22],
  explodeAngle: [-46, 24],
  explodeDuration: 3000,
  facts: [
    { label: 'Pin stacks', value: `5, each pin ${mm(LOCK.pin)} across` },
    { label: 'Cut depths', value: `10, ${mm(LOCK.step, 3)} (.015 in) apart` },
    { label: 'This key', value: code(KEYS.right) },
    { label: 'Plug', value: '12.7 mm (½ in) across' },
    { label: 'Combinations', value: 'up to 100,000' },
    { label: 'Real size', value: 'shell 17 × 27 × 30 mm, key 54 mm' },
  ],
  // In the order the energy goes: the key, the pin stacks, the plug in its shell, then what it turns.
  parts: [
    { node: 'key', label: 'Key', group: 'Key', about: `Nickel silver, cut ${code(KEYS.right)} from bow to tip. Its shoulder stops it against the plug’s face, so each cut ends up under its own pin.`, ...off([0, 0, 1], 70, [0.66, 0.82]) },
    { node: 'wrong_key', label: 'Wrong key', group: 'Key', about: `The same blank cut ${code(KEYS.wrong)}: its fourth cut is three steps, ${mm(3 * LOCK.step)}, shallower than it should be.`, direction: [1, 0, 0], distance: 0 },
    { node: 'spring_cover', label: 'Spring cover', group: 'Pin stacks', about: 'A strip pressed over the tops of the shell’s five chambers. The springs push against it.', ...off([0, 1, 0], 29, [0.2, 0.36]) },
    { node: 'springs', label: 'Springs', group: 'Pin stacks', about: 'Five small coil springs, one on each stack. They push every stack down, so with no key in, each driver pin drops across into the plug.', ...off([0, 1, 0], 27, [0.3, 0.46]) },
    ...KEYS.right.map((depth, i) => ({
      node: `driver_pin_${i + 1}`,
      label: `Driver pin ${i + 1}`,
      group: 'Pin stacks',
      about: `Steel, ${mm(driverPinLength(depth))}. The maker pairs long driver pins with shallow cuts and short ones with deep cuts, so every stack is close to the same height${i === 0 ? '. With no key in, it sits half in the plug and holds it' : ''}.`,
      ...off([0, 1, 0], 23, [0.4, 0.56]),
    })),
    ...KEYS.right.map((depth, i) => ({
      node: `key_pin_${i + 1}`,
      label: `Key pin ${i + 1}`,
      group: 'Pin stacks',
      about: `${ORDINAL[i]} key pin: ${mm(keyPinLength(depth))}, for a ${depth} cut. Its tip rides the key; its top has to end exactly at the plug’s surface.`,
      ...off([0, 1, 0], 21, [0.5, 0.66]),
    })),
    { node: 'plug', label: 'Plug', group: 'Plug and shell', about: 'The part that turns: brass, 12.7 mm across, with the keyway up its middle and five holes drilled down into it. Only it and what’s in it turn with the key.', ...off([0, 0, 1], 40, [0.82, 0.98]) },
    { node: 'shell', label: 'Shell', group: 'Plug and shell', about: 'The fixed body. The plug turns in its bore; the five chambers drilled up through the ridge on top hold the driver pins and springs.', direction: [0, -1, 0], distance: 0 },
    { node: 'retaining_clip', label: 'Retaining clip', group: 'Output', about: 'A spring-steel horseshoe in a groove on the plug’s tail. It stops the plug sliding out of the front; take it off and the plug comes out, which is how a locksmith rekeys a lock.', ...off([0, -1, 0], 22, [0.1, 0.28]) },
    { node: 'tailpiece', label: 'Tailpiece', group: 'Output', about: 'A flat steel bar in the slot across the plug’s tail. It reaches through the door to the deadbolt, and a quarter turn of it throws the bolt.', ...off([0, 0, -1], 30, [0, 0.18]) },
  ],
  annotations: [
    { title: 'Key', text: `The only part you push. Its five cuts, ${mm(LOCK.spacing)} apart, are ground to depths in steps of ${mm(LOCK.step, 3)}: one depth for each pin stack.`, node: 'key', position: at('key_bow'), explode: 0, camera: pose(at('key_blade'), [-34, 20], 3.4) },
    { title: 'Pin stacks', text: 'Each of the five holes holds a key pin, a driver pin and a spring. The key pins are cut to this key; the driver pins sit on them, pushed down.', node: 'driver_pin_2', position: at('driver_2'), explode: 0.52, camera: pose(at('above'), [-62, 14], 4.2) },
    { title: 'Springs', text: 'Each spring pushes its stack down onto the key. Pull the key out and they push every driver pin across into the plug, which locks it.', node: 'springs', position: at('spring_3'), explode: 0.4, camera: pose(at('above'), [-56, 16], 3.8) },
    { title: 'Shear line', text: 'Where the plug meets the shell: here, the edge of the brass plug in the face. With the right key all the way in, the split in every stack lands on it, to within a few hundredths of a millimetre.', node: 'plug', position: at('shear_face'), explode: 0, camera: pose(at('plug_face'), [-22, 12], 2.4) },
    { title: 'Plug', text: 'Turns as soon as nothing crosses the shear line. The key only lines the splits up; your wrist does the turning, and all the work on the bolt.', node: 'plug', position: at('plug_side'), explode: 0.9, camera: pose(at('centre'), [-50, 16], 4.6) },
    { title: 'Retaining clip', text: 'Holds the plug in from behind. A locksmith takes it off to slide the plug out and fit pins for a new key.', node: 'retaining_clip', position: at('clip_side'), explode: 0, camera: pose(at('plug_back'), [-150, 12], 3.4, { card: 'right' }) },
    { title: 'Tailpiece', text: 'Turns with the plug and carries the turn through the door. In a deadbolt a quarter turn of it throws the bolt.', node: 'tailpiece', position: at('tailpiece'), explode: 0, camera: pose(at('tail'), [-125, 22], 3.6, { card: 'right' }) },
  ],
  motion: [
    { node: 'plug', axis: [0, 0, 1], pivot: pivot('plug'), control: 'lockTurn', turn: -1 },
    { node: 'key', axis: [0, 0, 1], control: 'lockKey', slide: [0, 0, U(1)] },
    { node: 'key', axis: [0, 0, 1], control: 'lockSwap', slide: [-U(LOCK.apart), 0, 0] },
    { node: 'wrong_key', axis: [0, 0, 1], control: 'lockWrong', slide: [0, 0, -U(1)] },
    { node: 'wrong_key', axis: [0, 0, 1], control: 'lockSwap', slide: [-U(LOCK.apart), 0, 0] },
    ...PINS.flatMap((n) => [
      { node: `key_pin_${n}`, axis: [0, 1, 0], control: `lockPin${n}`, slide: [0, U(1), 0] },
      { node: `driver_pin_${n}`, axis: [0, 1, 0], control: `lockPin${n}`, slide: [0, U(1), 0] },
      // A spring's coils close up evenly: the bottom one goes with the driver pin, the top one hardly moves.
      ...Array.from({ length: COILS }, (_, k) => ({ node: `spring_${n}_${k}`, axis: [0, 1, 0], control: `lockPin${n}`, slide: [0, +(U(1) * (1 - (k + 0.5) / COILS)).toFixed(5), 0] })),
    ]),
  ],
  how: [
    {
      label: 'The idea',
      title: 'Five split pins and one line',
      text: [
        'The plug, the brass cylinder the key goes into, turns inside a fixed shell. Five stacks of pins cross the line between them, each pushed down by a spring, and each stack is split in two at a different height.',
        'With no key, the upper pins reach down into the plug and hold it. The right key lifts each stack until its split sits exactly on that line, the shear line. Then nothing crosses it, and the plug can turn.',
      ],
      angle: [72, 12],
      fill: 0.8,
      focus: ['key', 'plug', ...pins('key_pin'), ...pins('driver_pin'), 'springs', 'tailpiece'],
      flow: [{ node: 'key', at: at('key_bow') }, { node: 'key', at: at('key_blade') }, at('centre'), at('tail'), at('tailpiece_end')],
      tags: [{ node: 'plug', text: 'Shear line', at: at('shear_top') }],
      chart: 'lock-stacks',
    },
    {
      label: 'Key in',
      title: 'The blade lifts every stack in turn',
      text: [
        'As the key slides in, its tip pushes each stack up against its spring, and every stack rises and falls over the cuts as they pass under it. The springs keep each key pin pressed on the key’s edge all the way.',
        'Slide the key in and out. Only in the last fraction of a millimetre, with the shoulder against the plug’s face, does each cut sit under its own pin.',
      ],
      angle: [86, 6],
      fill: 0.85,
      focus: ['key', ...pins('key_pin'), ...pins('driver_pin'), 'springs'],
      frame: ['plug', ...pins('key_pin'), ...pins('driver_pin')],
      chart: 'lock-stacks',
      try: 'lock-insert',
    },
    {
      label: 'The cuts',
      title: 'Ten depths, 0.38 mm apart',
      text: [
        `Each cut is ground with a 100° cutter to one of ten depths, ${mm(LOCK.step, 3)} apart. This key is cut ${code(KEYS.right)}: depth 2 at the bow, depth 9, the deepest, fourth.`,
        `The pins are cut to match. A key pin is ${mm(LOCK.step, 3)} longer for each step deeper its cut is, so its top always lands at the same height: on the shear line, ${mm(LOCK.plug / 2)} above the plug’s middle.`,
      ],
      angle: [90, 4],
      fill: 0.8,
      focus: ['key', ...pins('key_pin')],
      tags: KEYS.right.map((depth, i) => ({ node: 'key', text: `${depth}`, at: at(`cut_${i + 1}`) })),
      chart: {
        type: 'bars',
        title: 'How deep each cut goes',
        caption: `Into the blade from its top edge, cut by cut from the bow: ${code(KEYS.right)}.`,
        unit: 'Depth, mm',
        bars: KEYS.right.map((depth, i) => ({ label: `${i + 1}`, value: +cutDepth(depth).toFixed(2), note: `depth ${depth}` })),
        picked: 3,
      },
    },
    {
      label: 'Shear line',
      title: 'Five splits on one line',
      text: [
        'With the key all the way in, every key pin’s top and every driver pin’s bottom meet exactly at the plug’s surface. Nothing crosses from the shell into the plug.',
        `Cut depth plus key pin is ${mm(LOCK.plug)} for every depth, the plug’s diameter, and Schlage cuts its depths to within 0.05 mm. Keys that mustn’t open each other’s locks differ by at least two steps, ${mm(2 * LOCK.step)}, somewhere: one step is too close to be sure of.`,
      ],
      angle: [90, 3],
      fill: 0.62,
      focus: [...pins('key_pin'), ...pins('driver_pin')],
      frame: [...pins('key_pin'), ...pins('driver_pin')],
      tags: [{ node: 'plug', text: 'Shear line', at: at('gap_1') }],
      chart: 'lock-stacks',
    },
    {
      label: 'Turn',
      title: 'Your wrist does the work',
      text: [
        'It is easy to think the key opens the lock by pushing something. It doesn’t: pushing it in only lines the splits up. The turning is yours. The key turns the plug, the key pins ride round in it, and the driver pins stay behind in the shell.',
        'The plug’s tail turns the tailpiece, and in a deadbolt a quarter turn of the tailpiece throws the bolt. Hold the button to turn the key.',
      ],
      angle: [30, 18],
      fill: 0.78,
      focus: ['key', 'plug', ...pins('key_pin'), 'tailpiece', 'retaining_clip'],
      flow: [{ node: 'key', at: at('key_bow') }, at('plug_face'), at('centre'), at('tail'), at('tailpiece_end')],
      try: 'lock-turn',
    },
    {
      label: 'Wrong key',
      title: 'One cut off, and nothing turns',
      text: [
        `The wrong key is cut ${code(KEYS.wrong)}. Four cuts match; the fourth is three steps too shallow, so it lifts the fourth key pin ${mm(3 * LOCK.step)} too high, across the shear line into the shell.`,
        'Push as hard as you like: the plug moves a degree or so and stops on that one pin. Change keys, then hold to turn.',
      ],
      angle: [76, 10],
      fill: 0.85,
      focus: ['key', 'wrong_key', ...pins('key_pin'), ...pins('driver_pin')],
      frame: ['plug', ...pins('driver_pin')],
      chart: 'lock-stacks',
      try: 'lock-keys',
    },
  ],
  credit: builtInCode(
    'Pin tumbler deadbolt cylinder, five pins',
    'Keyed to Schlage Classic specifications from the maker’s service manuals (Allegion): cut spacing, depths, pin lengths and plug size. Simplified: the keyway is a plain slot without the C profile’s wards, the shell is shown without the deadbolt’s housing and trim, the bolt is left out, and the springs are drawn as six even coils. No particular Schlage part; Schlage is named only for its published numbers.',
  ),
  build: { generate: 'objects/door-lock/generate.mjs', hints: 'objects/door-lock/hints.json' },
});

function missing(name) {
  throw new Error(`objects/door-lock/hints.json has no "${name}": add it to the hints generate.mjs returns, then npm run models:build -- door-lock`);
}
