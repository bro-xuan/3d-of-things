// Writes content/typewriter.json: the page's text, and where the build put things (objects/typewriter/hints.json, written
// by `npm run models:build -- typewriter`), so no model-space number is pasted by hand. Run it after every build:
//   node objects/typewriter/content.mjs
//
// The typewriter's mechanism is src/viewer/typewriter.ts: the film's `type` cue sets how many letters of the word are
// typed, and it sets the controls the motions below follow. Each animated key's stroke (0–1) drives its key lever,
// sublever, link and type bar through curves sampled here from layout.mjs, whose strokes are the same sums as the
// viewer's; the shared parts follow the stroke under way (`tw_strike`) and the letter spaces moved (`tw_space`).
import { builtInCode, readHints, space, writeContent } from '../../scripts/kit/content.mjs';
import { KEYS, U, L, SWING, NP, UP, chain, swingAt, ubLift, ribbonAt, sub, cross, dot, unit, mul } from './layout.mjs';

const H = readHints('typewriter');
const { pose } = space(H);
const at = (name) => H?.anchors?.[name] ?? (H ? missing(name) : [0, 0.5, 0]);
const pivot = (name) => H?.pivots?.[name] ?? (H ? missing(name) : [0, 0.5, 0]);
const perMm = 1 / (H?.space?.mmPerUnit ?? 283.8);
const r6 = (v) => +v.toFixed(6);
const WORD = U.word;
const LETTERS = [...new Set(WORD)];
const PITCH = U.pitch;
const TEETH = H?.numbers?.teeth ?? 16;

/** A stroke sampled for a curve: [s, f(s)] at even steps, with the ends at rest. */
const SAMPLES = 48;
const sampled = (f) => Array.from({ length: SAMPLES + 1 }, (_, i) => {
  const s = i / SAMPLES;
  return [r6(s), r6(f(s))];
});
const vec = (v, scale = 1) => v.map((c) => r6(c * scale));

/** One key's chain: key lever, sublever, link (turned about a fixed axis and carried by its lower end) and type bar. */
function chainMotions(id) {
  const key = KEYS.find((k) => k.id === id);
  const h = H?.keys?.[id];
  if (!h) return [];
  const control = `tw_key_${id}`;
  const rest = chain(key, 0);
  const v0 = sub(rest.B, rest.A);
  const half = chain(key, 0.5);
  const k = unit(cross(v0, sub(half.B, half.A)));
  const angleOf = (s) => {
    const { A, B } = chain(key, s);
    const v = sub(B, A);
    const p = sub(v, mul(k, dot(v, k)));
    return Math.atan2(dot(cross(v0, p), k), dot(v0, p));
  };
  return [
    { node: `key_${id}`, axis: [1, 0, 0], pivot: h.keyPivot, control, curve: sampled((s) => chain(key, s).kappa / (2 * Math.PI)) },
    { node: `sublever_${id}`, axis: [1, 0, 0], pivot: h.subPivot, control, curve: sampled((s) => chain(key, s).sigma / (2 * Math.PI)) },
    { node: `link_${id}`, axis: vec(k), pivot: h.linkPivot, control, curve: sampled((s) => angleOf(s) / (2 * Math.PI)) },
    ...[0, 1, 2].map((c) => ({ node: `link_${id}`, axis: [1, 0, 0], control, curve: sampled((s) => chain(key, s).A[c] - rest.A[c]), slide: vec([0, 1, 2].map((j) => (j === c ? 1 : 0)), perMm) })),
    { node: `type_bar_${id}`, axis: h.barAxis, pivot: h.barPivot, control, curve: sampled((s) => (SWING * swingAt(s)) / 360) },
  ];
}

/** The ribbon's two runs swing about their spools as the guide lifts the middle. */
const runTurn = (s) => (L.ribbon.lift * ribbonAt(s)) / (H?.numbers?.ribbonRun ?? 90) / (2 * Math.PI);

const PARTS = [
  { node: 'keys', label: 'Keys', group: 'Keys', about: '42 keys on levers pivoted at the back, in four rows, and the space bar. A key goes down about 16 mm, and its lever pulls a wire to its sublever.', direction: [0, 0, 1], distance: 0 },
  { node: 'sublevers', label: 'Sublevers and links', group: 'Keys', about: 'The key lever pulls its sublever down; the sublever pulls a wire link, and the link pulls the type bar’s heel round, starting the swing.', direction: [0, 1, 0], distance: 0 },
  { node: 'type_bars', label: 'Type bars', group: 'Type bars', about: `42 steel bars in a half circle, each with a slug carrying a small and a capital letter. Each swings ${Math.round(SWING)}° on one fulcrum wire to the same spot on the platen.`, direction: [0, 1, 0], distance: 0.08, then: { direction: [0, 0.8, 1], distance: 0.42 }, window: [0.7, 0.92] },
  { node: 'segment', label: 'Segment', group: 'Type bars', about: 'The slotted half ring the bars swing in. Its 42 slots keep each bar in its own plane, so every one lands on exactly the same spot.', direction: [0, 1, 0], distance: 0.2, window: [0.88, 1] },
  { node: 'ribbon', label: 'Ribbon', group: 'Printing', about: 'Half-inch inked cloth, black over red, wound between two spools across the front of the platen.', direction: [0, 1, 0.5], distance: 0.45, window: [0, 0.22] },
  { node: 'ribbon_guide', label: 'Ribbon guide', group: 'Printing', about: 'Lifts the ribbon in front of the printing point as the key goes down, and lets it drop again, so the line being typed stays in sight.', direction: [0, 1, 0.5], distance: 0.45, window: [0, 0.22] },
  { node: 'platen', label: 'Platen', group: 'Printing', about: 'A hard rubber roller 10 inches long, with the paper round it. The ratchet on its end turns it one line, a sixth of an inch, at a time.', direction: [0, 1, 0], distance: 0.22, window: [0.55, 0.75] },
  { node: 'paper', label: 'Paper', group: 'Printing', about: `The sheet, fed round the platen. Each letter lands ${PITCH} mm to the right of the last, because the paper has moved, not the type.`, direction: [0, 1, 0], distance: 0 },
  { node: 'universal_bar', label: 'Universal bar', group: 'Escapement', about: 'A curved bar under the slots that every type bar’s heel lifts near the end of its swing, so one escapement serves all 42 keys.', direction: [0, 1, 0], distance: 0 },
  { node: 'rocker', label: 'Dog rocker', group: 'Escapement', about: 'Carries the two dogs. The universal bar tips it: the loose dog lets the star wheel go on the way down, and the rigid dog on the way back up.', direction: [0, 1, 0], distance: 0 },
  { node: 'escape_wheel', label: 'Star wheel and pinion', group: 'Escapement', about: `A ${TEETH}-tooth star wheel on one shaft with the pinion that runs in the carriage’s rack. One tooth is one letter space.`, direction: [0, 0, 1], distance: 0.012, then: { direction: [0, 1, 0], distance: 0.3 }, window: [0.72, 0.9] },
  { node: 'carriage', label: 'Carriage', group: 'Carriage', about: 'Carries the platen and paper and runs left on a rail at the back. Its lever turns up a new line and pushes it back to the right.', direction: [0, 1, 0], distance: 0.55, window: [0.22, 0.55] },
  { node: 'rack', label: 'Rack', group: 'Carriage', about: `Teeth under the back of the carriage, one every ${PITCH} mm. They turn the pinion as the carriage moves, so the star wheel can hold the carriage back.`, direction: [0, 0, -1], distance: 0.06, window: [0.55, 0.72] },
  { node: 'drawband', label: 'Drawband', group: 'Carriage', about: 'A strap from the mainspring drum to the carriage’s right end. It pulls the carriage to the left all the time.', direction: [1, 0, 0], distance: 0.12, window: [0, 0.18] },
  { node: 'mainspring', label: 'Mainspring drum', group: 'Carriage', about: 'A coiled spring in a drum at the back. Pushing the carriage back to the right winds it; typing lets it unwind a letter space at a time.', direction: [-1, 0, -0.4], distance: 0.16, window: [0.55, 0.75] },
  { node: 'frame', label: 'Frame', group: 'Frame', about: 'The cast-iron body: sides, base, the rail the carriage runs on, and the rods every lever pivots on.', direction: [0, -1, 0], distance: 0 },
];

/** What stays solid through the film: everything the stroke moves and what it acts on. The frame, the carriage's
 *  castings and the segment are glass, so the levers, the escapement and the drawband show through them. */
const MOVING = ['keys', 'sublevers', 'type_bars', 'ribbon', 'ribbon_guide', 'platen', 'paper', 'universal_bar', 'rocker', 'escape_wheel', 'rack', 'drawband', 'mainspring'];
const BODY = ['frame', 'carriage', 'type_bars', 'keys', 'platen'];
/** One stroke of the film's word: letter n (counting from 1) typed over `over` seconds from `start`. */
const stroke = (n, start, over) => ({ at: start, do: 'type', to: n, over });

writeContent('typewriter', {
  order: 23,
  title: 'Typewriter',
  hook: 'Nothing pushes the carriage: a spring pulls it all the time, and each key lets it go one letter.',
  category: 'gears',
  summary: [
    'A typewriter has to print every letter as cleanly as type, as fast as a typist’s fingers, and put each one exactly a space after the last. The Underwood’s idea was to throw every letter at the same spot: its 42 type bars lie in a half circle and each swings up to one printing point on the front of the platen, where the typist can see it land. The paper moves, not the type.',
    'This is an Underwood Standard No. 5, the front-strike “visible writer” made from 1900 to the early 1930s, close to four million of them. Each key works a lever, a sublever and a link that swing its type bar up through a slot in the segment. Behind, the carriage holds the platen, a rubber roller with the paper round it; a spring in a drum pulls the carriage to the left, and an escapement lets it go one tooth at a time.',
    `Press a key about 16 mm and its bar swings ${Math.round(SWING)}° and hits the ribbon onto the paper. As it arrives, its heel lifts the universal bar, which rocks the escapement’s two dogs: the star wheel slips one tooth, and the carriage moves one letter space, ${PITCH} mm, to the left. How it works types a word on the top row of keys.`,
  ],
  model: 'models/typewriter.glb',
  viewAngle: [-30, 22],
  explodeAngle: [-34, 30],
  explodeDuration: 2600,
  facts: [
    { label: 'Keys', value: '42, for 84 characters' },
    { label: 'Letter space', value: `${PITCH} mm (pica, 10 to the inch)` },
    { label: 'Type bar swing', value: `${Math.round(SWING)}°, all to one point` },
    { label: 'Escapement', value: `${TEETH}-tooth star wheel, a tooth a letter` },
    { label: 'Platen', value: '10 inches, 6 lines to the inch' },
    { label: 'Weight', value: '13.1 kg' },
  ],
  parts: PARTS,
  annotations: [
    { title: 'Key', text: 'Press a key about 16 mm. Its lever pulls the sublever, the sublever pulls a link, and the link swings the type bar up out of the basket.', node: 'keys', position: at('keyboard'), camera: pose(at('keyboard'), [-24, 34], 2.1) },
    { title: 'One printing point', text: `Each bar swings ${Math.round(SWING)}° up through its own slot in the segment, and all 42 meet at one spot on the platen, so every letter lands in the same place.`, node: 'type_bars', position: at('bars'), camera: pose(at('segment'), [-36, 32], 2.1) },
    { title: 'Ribbon', text: 'The slug strikes the ribbon onto the paper. The ribbon guide lifts the ribbon just before, and drops it after, so the line being typed stays in sight.', node: 'ribbon_guide', position: at('guide'), camera: pose(at('printing'), [-22, 16], 1.7) },
    { title: 'Universal bar', text: 'As the slug comes within an inch of the paper, the bar’s heel lifts the universal bar. Every key works through it, so one escapement serves them all.', node: 'universal_bar', position: at('ubar'), explode: 0.96, camera: pose(at('ubar'), [24, 42], 1.9) },
    { title: 'Escapement', text: `Two dogs on a rocker hold a ${TEETH}-tooth star wheel. On the way down the loose dog lets a tooth slip a tenth of a step onto the rigid dog; on the way up the rigid dog lets go, and the wheel turns the rest.`, node: 'escape_wheel', position: at('wheel'), explode: 0.62, camera: pose(at('wheel'), [24, 46], 1.5) },
    { title: 'Not pushed, let go', text: `The key doesn’t push the carriage. The mainspring pulls it left all the time through the drawband; each stroke only lets the escapement release it one tooth, ${PITCH} mm. So every space is the same, however hard the key is hit.`, node: 'mainspring', position: at('drum'), explode: 0, camera: pose(at('drum'), [-130, 26], 2.2, { card: 'right' }) },
    { title: 'Carriage return', text: 'The lever on the left turns the platen up a line and pushes the carriage back to the right, which winds the mainspring for the next line.', node: 'carriage', position: at('carriage'), explode: 0, camera: pose(at('carriage'), [-50, 22], 2.2, { card: 'right' }) },
  ],
  motion: [
    ...LETTERS.flatMap(chainMotions),
    { node: 'universal_bar', axis: [0, 1, 0], control: 'tw_strike', curve: sampled(ubLift), slide: [0, r6(perMm), 0] },
    { node: 'rocker', axis: [1, 0, 0], pivot: pivot('rocker'), control: 'tw_strike', curve: sampled((s) => -ubLift(s) / (H?.numbers?.rockerArm ?? 7) / (2 * Math.PI)) },
    { node: 'ribbon_guide', axis: [0, 1, 0], control: 'tw_strike', curve: sampled((s) => L.ribbon.lift * ribbonAt(s)), slide: vec(UP, perMm) },
    { node: 'ribbon_centre', axis: [0, 1, 0], control: 'tw_strike', curve: sampled((s) => L.ribbon.lift * ribbonAt(s)), slide: vec(UP, perMm) },
    { node: 'ribbon_left', axis: vec(NP), pivot: pivot('ribbon_left'), control: 'tw_strike', curve: sampled(runTurn) },
    { node: 'ribbon_right', axis: vec(NP), pivot: pivot('ribbon_right'), control: 'tw_strike', curve: sampled((s) => -runTurn(s)) },
    { node: 'carriage', axis: [1, 0, 0], control: 'tw_space', slide: [r6(-PITCH * perMm), 0, 0] },
    { node: 'escape_wheel', axis: [0, 0, 1], pivot: pivot('wheel'), control: 'tw_space', turn: r6(1 / TEETH) },
    { node: 'mainspring_drum', axis: [0, 1, 0], pivot: pivot('drum'), control: 'tw_space', turn: r6(-PITCH / (2 * Math.PI * (H?.numbers?.drum ?? 20))) },
    ...[...WORD].map((_, n) => ({ node: `ink_${n}`, axis: [0, 1, 0], control: `tw_ink_${n}`, slide: vec(NP, (L.ink.r[1] - L.ink.r[0]) * perMm) })),
  ],
  // "How it works": the word typed on the top row, one key at a time, then the rest of it at a typist's pace.
  film: [
    {
      chapter: 'The key',
      caption: 'Press a key and its lever, sublever and link swing the type bar up out of the basket.',
      duration: 5.5,
      angle: [30, 26],
      fill: 0.66,
      focus: MOVING,
      frame: BODY,
      tags: [
        { node: 'key_t', text: 'key', at: H?.keys?.t?.top },
        { node: 'type_bars', text: 'type bars', at: at('bars') },
      ],
      cues: [stroke(1, 0.8, 3.6)],
    },
    {
      chapter: 'The strike',
      caption: 'All 42 bars meet at one spot: the slug strikes the ribbon onto the paper.',
      duration: 5.5,
      angle: [0, 16],
      fill: 0.66,
      focus: MOVING,
      frame: BODY,
      tags: [
        { node: 'ribbon_guide', text: 'ribbon', at: at('guide') },
        { node: 'platen', text: 'platen', at: at('platen') },
      ],
      cues: [stroke(2, 0.6, 3.6)],
    },
    {
      chapter: 'The escapement',
      caption: 'The bar’s heel lifts the universal bar, and the dogs let the star wheel turn one tooth.',
      duration: 6,
      angle: [-25, 9],
      fill: 0.66,
      focus: MOVING,
      frame: BODY,
      tags: [
        { node: 'universal_bar', text: 'universal bar', at: at('ubar') },
        { node: 'escape_wheel', text: 'star wheel', at: at('wheel') },
      ],
      cues: [stroke(3, 0.6, 4.2)],
    },
    {
      chapter: 'The carriage',
      caption: `A spring pulls the carriage left all the time; each key only lets it go ${PITCH} mm.`,
      duration: 6,
      angle: [-55, 22],
      fill: 0.66,
      focus: MOVING,
      frame: BODY,
      carries: 'power',
      flow: [
        { node: 'mainspring_drum', at: at('drum') },
        { node: 'drawband', at: at('band'), ride: true },
        { node: 'carriage', at: at('carriage'), ride: true },
      ],
      tags: [{ node: 'mainspring', text: 'mainspring', at: at('drum') }],
      cues: [4, 5, 6, 7, 8, 9, 10].map((n, i) => stroke(n, +(0.5 + i * 0.68).toFixed(2), 0.62)),
    },
  ],
  credit: builtInCode('Typewriter', 'Laid out from the US Army’s Underwood repair manual (TM 10-601), Underwood’s patents and museum records of the No. 5. The bars’ swing, the segment, the escapement’s tooth counts and the spring’s pull are estimates; the shift, margin stops, bell, tabulator and ribbon feed are left out, and only the keys of the word move.'),
  build: { generate: 'objects/typewriter/generate.mjs', hints: 'objects/typewriter/hints.json' },
});

function missing(name) {
  throw new Error(`objects/typewriter/hints.json has no "${name}": add it to the hints generate.mjs returns, then npm run models:build -- typewriter`);
}
