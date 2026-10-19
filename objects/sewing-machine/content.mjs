// Writes content/sewing-machine.json: the page's text, and where the build put things (objects/sewing-machine/hints.json,
// written by `npm run models:build -- sewing-machine`), so no model-space number is pasted by hand. Run it after
// every build:   node objects/sewing-machine/content.mjs
//
// Every moving part follows the arm shaft's angle: spins at the gear train's ratios (hints.turns), the needle
// bar and its link as a crank, the take-up lever and the feed's rock shafts as rockers, the feed dog lifted by
// a cam and pushed by a crank. At rest the shaft is at 0: the needle at the top, the feed dog up.
import { builtInCode, readHints, space, writeContent } from '../../scripts/kit/content.mjs';

const H = readHints('sewing-machine');
const { U, pose } = space(H);
/** A named point from the build (model space). Before the first build there are none yet, so a placeholder. */
const at = (name) => H?.anchors?.[name] ?? (H ? missing(name) : [0, 0.5, 0]);
const pivot = (name) => H?.pivots?.[name] ?? (H ? missing(name) : [0, 0.5, 0]);
const T = H?.turns ?? { arm: 1, upright: 2, drive: 2, hook: -2 };
const M = H?.motion;
const S = H?.stitch ?? { stroke: 30, catchDeg: 213, rise: 2.4, lift: 1.5, travel: 4.2, needleOut: 66, takeUpPhase: 50, teeth: { upper: [32, 16] } };

/** Turns a second of the arm shaft: one stitch every two seconds, a slow turn of the hand wheel. */
const SPEED = 0.5;
/** A part that comes off along a direction, over a window of the slider, with an optional second leg. */
const off = (direction, mm, window, then) => ({ direction, distance: U(mm), window, ...(then ? { then: { direction: then[0], distance: U(then[1]) } } : {}) });
const stay = { direction: [0, 1, 0], distance: 0 };

// One stitch, as the timing chart draws it: phase 0 is the arm shaft at rest (needle at the top).
const N = 72;
const phases = Array.from({ length: N + 1 }, (_, i) => i / N);
const r3 = (v) => +v.toFixed(3);
const rad = (deg) => (deg * Math.PI) / 180;
const R = S.stroke / 2;
const LINK = 38;
const needleY = (t) => R * Math.cos(t) + Math.sqrt(LINK ** 2 - (R * Math.sin(t)) ** 2);
const [nTop, nBottom] = [needleY(0), needleY(Math.PI)];
const needle = phases.map((p) => [r3(p), r3((needleY(2 * Math.PI * p) - nBottom) / (nTop - nBottom))]);
// The take-up lever's eye: a swing of ±14° that peaks 40° after the needle's top.
const takeUp = (() => {
  const k = Math.sin(rad(14));
  const ph = rad(S.takeUpPhase);
  const y = (t) => Math.sin(Math.asin(k * Math.sin(t + ph)) - Math.asin(k * Math.sin(ph)));
  const ys = phases.map((p) => y(2 * Math.PI * p));
  const [lo, hi] = [Math.min(...ys), Math.max(...ys)];
  return phases.map((p, i) => [r3(p), r3((ys[i] - lo) / (hi - lo))]);
})();
// The feed dog's lift (the cam's opening over 200° of the turn) and its push (back while it's up).
const half = rad(100);
const openness = (t) => {
  const a = Math.atan2(Math.sin(t), Math.cos(t));
  return Math.abs(a) < half ? 0.5 + 0.5 * Math.cos((Math.PI * a) / half) : 0;
};
const dogUp = phases.map((p) => [r3(p), r3(openness(2 * Math.PI * p))]);
const dogBack = phases.map((p) => [r3(p), r3((1 + Math.sin(2 * Math.PI * p)) / 2)]);
const CATCH = S.catchDeg / 360;
const CAST = Math.min(0.97, CATCH + 135 / 360);

/** Stitch length for a setting of the regulator, in stitches to the inch. */
const mm = (spi) => +(25.4 / spi).toFixed(spi > 20 ? 2 : 1);

writeContent('sewing-machine', {
  order: 14,
  title: 'Sewing Machine',
  hook: 'The needle never takes its thread through: a hook underneath carries each loop right round the bobbin.',
  category: 'gears',
  summary: [
    'A hand needle drags its whole length of thread through the cloth at every stitch, so it can’t go fast. A sewing machine never lets go of either thread: the needle pushes a loop of the top thread down through the cloth, and a hook underneath locks it round a second thread from a bobbin.',
    'In this Singer 201-2 of the 1930s one shaft along the arm turns once per stitch. A crank on its end drives the needle bar and a lever pays out and pulls up the thread; bevel gears down the pillar and along the bed turn the hook under the needle plate twice per stitch; an eccentric and a cam on the same shaft work the feed dog that moves the cloth on.',
    'Each stitch, the needle goes down, the hook catches its loop and takes it round the bobbin, the take-up lever pulls the two threads tight inside the cloth, and the feed dog carries the cloth one stitch length back. On this model every part moves from that one shaft’s angle, at Singer’s 2 : 1 for the hook; the gear teeth and the head’s size are drawn, not measured.',
  ],
  model: 'models/sewing-machine.glb',
  viewAngle: [-32, 16],
  explodeAngle: [-38, 24],
  explodeDuration: 2800,
  facts: [
    { label: 'Model', value: 'Singer 201-2, USA, 1935–57' },
    { label: 'Stitch', value: 'Lockstitch, 6 to 30 to the inch (4.2–0.85 mm)' },
    { label: 'Hook', value: '2 turns for every stitch' },
    { label: 'Needle', value: 'System 15×1, threaded right to left' },
    { label: 'Weight', value: 'About 13.6 kg, the cast-iron head' },
  ],
  // In energy-chain order, grouped. Covers come off first, then the plates, then the bobbin; the drive stays.
  parts: [
    { node: 'motor', label: 'Motor', group: 'Power', about: 'Singer’s built-on motor, on the back of the arm. A spiral gear on its shaft turns a gear on the balance wheel’s hub; a knee lever sets its speed.', ...off([0, 0, -1], 90, [0.6, 0.8]) },
    { node: 'balance_wheel', label: 'Balance wheel', group: 'Power', about: 'On the arm shaft’s right end: one turn, one stitch. Turn it by hand towards you; the knob on its face frees it from the shaft to wind a bobbin.', ...off([1, 0, 0], 70, [0.55, 0.75]) },
    { node: 'arm_shaft', label: 'Arm shaft', group: 'Arm shaft', about: 'Runs the length of the arm and turns once per stitch. Everything else is timed from it: the crank at its left end, the feed cam and eccentric, the bevel gear.', ...stay },
    { node: 'needle_link', label: 'Needle-bar link', group: 'Arm shaft', about: 'Joins the crank’s pin to a stud on the needle bar, turning the crank’s circle into the bar’s straight 30 mm stroke.', ...stay },
    { node: 'needle_bar', label: 'Needle bar', group: 'Arm shaft', about: 'Slides up and down in two bushings in the head, the needle clamped at its foot.', ...stay },
    { node: 'needle', label: 'Needle', group: 'Arm shaft', about: 'A 15×1 needle, flat side to the left. The thread runs in a groove down its front and through the eye near the point, so the needle carries a loop, not an end.', ...stay },
    { node: 'take_up_lever', label: 'Take-up lever', group: 'Arm shaft', about: 'Rocks in the head with the crank. It lets thread down while the hook carries the loop round the bobbin, then pulls the slack back up to set the stitch.', ...stay },
    { node: 'upright_shaft', label: 'Upright shaft', group: 'To the hook', about: 'Runs down inside the pillar. The bevel gear at its top is half the size of the arm shaft’s, so it turns twice per stitch.', ...stay },
    { node: 'hook_drive_shaft', label: 'Hook driving shaft', group: 'To the hook', about: 'Runs along the underside of the bed from the pillar to the hook, with a bevel gear at each end.', ...stay },
    { node: 'hook', label: 'Rotating hook', group: 'To the hook', about: 'A steel cup turning on a vertical shaft, twice per stitch. Its sharp beak passes the needle just above the eye and catches the loop of thread there.', ...stay },
    { node: 'bobbin_case', label: 'Bobbin case', group: 'Stitch', about: 'Sits in the hook but doesn’t turn: a finger on its rim rests in a notch. The loop goes right round it, and its spring sets the bobbin thread’s tension.', ...stay },
    { node: 'bobbin', label: 'Bobbin', group: 'Stitch', about: 'A class 66 bobbin, 20.5 mm across, holding the lower thread. It drops in from above when the slide plate is drawn back.', ...off([0, 1, 0], 55, [0.6, 0.85], [[-1, 0, 0], 50]) },
    { node: 'tension', label: 'Tension', group: 'Stitch', about: 'Two discs squeeze the top thread; the numbered nut sets how hard. The little check spring takes up the slack as the needle comes down.', ...off([0, 0, 1], 150, [0, 0.2]) },
    { node: 'spool', label: 'Spool', group: 'Stitch', about: 'The top thread, on its pin on top of the arm.', ...off([0, 1, 0], 70, [0, 0.2]) },
    { node: 'presser_foot', label: 'Presser foot', group: 'Stitch', about: 'Holds the cloth down on the feed dog while it moves, and lifts with its bar when you raise the lever behind the head.', ...off([0, 1, 0], 8, [0.2, 0.35]) },
    { node: 'feed_rod', label: 'Feed connecting rod', group: 'Feed', about: 'Hangs from the feed-lifting eccentric on the arm shaft and works the lifting rock shaft under the bed.', ...stay },
    { node: 'feed_fork', label: 'Feed forked connection', group: 'Feed', about: 'Straddles the feed cam on the arm shaft; the stitch regulator sets how far it swings, and so how far the cloth moves.', ...stay },
    { node: 'feed_lift_shaft', label: 'Feed lifting rock shaft', group: 'Feed', about: 'Rocks a few degrees under the bed; its arm lifts the feed bar so the teeth rise through the plate.', ...stay },
    { node: 'feed_rock_shaft', label: 'Feed rock shaft', group: 'Feed', about: 'Rocks under the bed; its arm pushes the feed bar back while the teeth are up, then forward again.', ...stay },
    { node: 'feed_dog', label: 'Feed dog', group: 'Feed', about: 'Two rows of teeth on the feed bar. Up, back, down, forward: they grip the cloth from below and walk it on one stitch at a time.', ...stay },
    { node: 'stitch_lever', label: 'Stitch regulator', group: 'Feed', about: 'Set from 6 to 30 stitches to the inch. Pushed to the top it reverses the feed, and the same stitch is sewn backwards.', ...off([0, 0, 1], 140, [0, 0.2]) },
    { node: 'arm_front', label: 'Arm, front half', group: 'Frame', about: 'The arm is one hollow iron casting with the bed. Its front half lifts away here, as on the Science Museum’s sectioned 201K, to show the shafts inside.', ...off([0, 0, 1], 35, [0.1, 0.42], [[0, 1, 0], 210]) },
    { node: 'face_plate', label: 'Face plate', group: 'Frame', about: 'Covers the head’s end, where the needle bar, presser bar and take-up lever work.', ...off([-1, 0, 0], 60, [0, 0.3]) },
    { node: 'needle_plate', label: 'Needle plate', group: 'Frame', about: 'The needle goes through its hole and the feed dog’s teeth come up through its slots.', ...off([0, 1, 0], 6, [0.35, 0.6], [[1, 0, 0], 90]) },
    { node: 'slide_plate', label: 'Slide plate', group: 'Frame', about: 'Slides to the left to get at the bobbin.', ...off([0, 1, 0], 6, [0.3, 0.55], [[-1, 0, 0], 70]) },
    { node: 'bed', label: 'Bed and arm', group: 'Frame', about: 'One japanned iron casting: the bed, the pillar and the back of the arm, with bushings for every shaft.', ...stay },
  ],
  annotations: [
    { title: 'Balance wheel', text: 'One turn of the wheel is one stitch. The motor drives it through a gear on its hub; by hand, always turn it towards you.', node: 'balance_wheel', position: at('wheel_top'), explode: 0, camera: pose(at('wheel_knob'), [58, 14], 1.5, { card: 'left' }) },
    { title: 'Needle-bar crank', text: 'A crank on the arm shaft’s end and a short link drive the needle bar through a 30 mm stroke, once per turn.', node: 'arm_shaft', position: at('crank_pin'), explode: 0.45, camera: pose(at('link'), [-12, 6], 1.1, { card: 'right' }) },
    { title: 'Take-up lever', text: 'It pays out thread while the hook takes the loop round the bobbin, then snatches it back up, pulling the two threads tight in the middle of the cloth.', node: 'take_up_lever', position: at('take_up_eye'), explode: 0, camera: pose(at('take_up_eye'), [-20, 10], 1.2, { card: 'right' }) },
    { title: 'Tension', text: 'The top thread runs between two discs pressed together by the numbered nut, 0 to 9. Tighter pulls the lock up towards the top of the cloth.', node: 'tension', position: at('tension'), explode: 0, camera: pose(at('tension_face'), [-10, 8], 1.0, { card: 'right' }) },
    { title: 'Twice as fast', text: 'At the top of the pillar a bevel gear on the arm shaft drives one half its size, so the upright shaft, the shaft under the bed and the hook all turn twice per stitch.', node: 'upright_shaft', position: at('bevel_top'), explode: 0.45, camera: pose(at('bevel_top'), [-25, 12], 1.0, { card: 'left' }) },
    { title: 'No knot', text: 'The hook’s beak catches the needle’s loop and carries it right round the bobbin case. The take-up lever pulls it up with the bobbin thread inside it: two threads interlocked: a lock, not a knot.', node: 'hook', position: at('beak'), explode: 0.58, camera: pose(at('hook_axis'), [-20, 62], 0.75, { card: 'right' }) },
    { title: 'Bobbin', text: 'The lower thread, on a class 66 bobbin 20.5 mm across. It sits in a case that the hook turns round but never touches.', node: 'bobbin', position: at('bobbin'), explode: 0.58, camera: pose(at('bobbin'), [-30, 55], 0.8, { card: 'right' }) },
    { title: 'Feed dog', text: 'Its teeth rise through the plate, push the cloth back one stitch length, drop below the plate and come forward again: the four-motion feed.', node: 'feed_dog', position: at('feed_dog'), explode: 0.58, camera: pose(at('needle_hole'), [-20, 20], 0.7, { card: 'right' }) },
    { title: 'Stitch regulator', text: 'Sets how far the feed dog moves: from 6 stitches to the inch (4.2 mm) down to 30 (0.85 mm). At the top of its slot it sews in reverse.', node: 'stitch_lever', position: at('stitch_lever'), explode: 0, camera: pose(at('stitch_plate'), [-15, 6], 1.0, { card: 'left' }) },
  ],
  motion: [
    { node: 'arm_shaft', axis: [1, 0, 0], pivot: pivot('arm_shaft'), speed: SPEED },
    { node: 'balance_wheel', axis: [1, 0, 0], pivot: pivot('balance_wheel'), speed: SPEED },
    { node: 'upright_shaft', axis: [0, 1, 0], pivot: pivot('upright_shaft'), speed: SPEED * T.upright },
    { node: 'hook_drive_shaft', axis: [1, 0, 0], pivot: pivot('hook_drive_shaft'), speed: SPEED * T.drive },
    { node: 'hook', axis: [0, 1, 0], pivot: pivot('hook'), speed: SPEED * T.hook },
    { node: 'needle_bar', axis: [0, 1, 0], pivot: pivot('needle_bar'), crank: 'arm_shaft', along: [0, -1, 0], throw: M?.needle.throw ?? 0.05, rod: M?.needle.rod ?? 0.15, phase: 180 },
    { node: 'needle_link', axis: [1, 0, 0], pivot: pivot('needle_link'), crank: 'arm_shaft', along: [0, -1, 0], throw: M?.needle.throw ?? 0.05, rod: M?.needle.rod ?? 0.15, phase: 180, rocks: true },
    { node: 'take_up_lever', axis: [1, 0, 0], pivot: pivot('take_up_lever'), crank: 'arm_shaft', along: [1, 0, 0], throw: M?.takeUp.throw ?? 0.0005, rod: M?.takeUp.rod ?? 0.002, phase: S.takeUpPhase, rocks: true },
    { node: 'feed_rod', axis: [1, 0, 0], pivot: pivot('feed_rod'), crank: 'arm_shaft', along: [0, -1, 0], throw: M?.rod.throw ?? 0.003, rod: M?.rod.rod ?? 0.7, phase: 180, rocks: true },
    { node: 'feed_fork', axis: [1, 0, 0], pivot: pivot('feed_fork'), crank: 'arm_shaft', along: [1, 0, 0], throw: M?.fork.throw ?? 0.00003, rod: M?.fork.rod ?? 0.002, phase: 180, rocks: true },
    { node: 'feed_rock_shaft', axis: [1, 0, 0], pivot: pivot('feed_rock_shaft'), crank: 'arm_shaft', along: [1, 0, 0], throw: M?.rock.throw ?? 0.0004, rod: M?.rock.rod ?? 0.002, phase: 0, rocks: true },
    { node: 'feed_lift_shaft', axis: [1, 0, 0], pivot: pivot('feed_lift_shaft'), crank: 'arm_shaft', along: [1, 0, 0], throw: M?.lift.throw ?? 0.00005, rod: M?.lift.rod ?? 0.002, phase: 90, rocks: true },
    { node: 'feed_lifter', axis: [0, 1, 0], pivot: pivot('feed_lifter'), cam: 'arm_shaft', along: [0, 1, 0], lift: M?.feed.lift ?? 0.006, phase: 0, duration: M?.feed.duration ?? 200 },
    { node: 'feed_dog', axis: [0, 0, 1], pivot: pivot('feed_dog'), crank: 'arm_shaft', along: [0, 0, 1], throw: M?.feed.throw ?? 0.008, rod: M?.feed.rod ?? 1, phase: 90 },
  ],
  motionLabel: 'Turn the wheel',
  how: [
    {
      label: 'The idea',
      title: 'Two threads, locked inside the cloth',
      text: [
        'The needle takes a loop of the top thread down through the cloth; under the plate the hook catches it and takes it round the bobbin; the take-up lever pulls it back up with the bobbin thread inside it; the feed dog moves the cloth on. Then again.',
        `All four are timed by one shaft turning once per stitch. Follow the cursor: the hook meets the needle ${Math.round(S.catchDeg - 180)}° after the bottom of its stroke, when it has risen ${S.rise} mm and the thread has bulged into a loop beside it.`,
      ],
      angle: [-35, 22],
      explode: 0.58,
      rate: 0.25,
      focus: ['needle_bar', 'needle', 'needle_link', 'take_up_lever', 'hook', 'bobbin_case', 'bobbin', 'feed_dog', 'arm_shaft'],
      frame: ['needle_bar', 'needle', 'take_up_lever', 'hook', 'feed_dog'],
      tags: [
        { node: 'needle', text: 'needle: 1 stroke', at: at('needle') },
        { node: 'hook', text: 'hook: 2 turns', at: at('hook') },
        { node: 'take_up_lever', text: 'take-up', at: at('take_up_eye') },
      ],
      chart: {
        type: 'timing',
        title: 'One stitch, slowed down',
        caption: 'Every part, through one turn of the arm shaft. The hook catches the loop just after the needle’s lowest point; the feed only moves the cloth while the needle is out of it.',
        node: 'arm_shaft',
        perTurn: 1,
        bands: [[r3(CATCH), r3(CAST), 'loop round the bobbin']],
        lanes: [
          { name: 'Needle', points: needle },
          { name: 'Take-up lever', points: takeUp },
          { name: 'Feed dog up', points: dogUp },
          { name: 'Feed dog back', points: dogBack },
        ],
      },
    },
    {
      label: 'Power',
      title: 'One turn of the wheel, one stitch',
      text: [
        'The motor on the back of the arm turns the balance wheel through a pair of gears hidden under its cover; the wheel is fixed to the arm shaft, so a turn of the wheel by hand does just the same. Everything else hangs off that shaft.',
        'Hold the button and count: each turn of the shaft is one stitch. At full speed the motor runs it at hundreds of stitches a minute; here it turns once every two seconds.',
      ],
      angle: [125, 18],
      explode: 0.45,
      focus: ['motor', 'balance_wheel', 'arm_shaft'],
      flow: [at('motor_end'), at('wheel_hub'), at('arm_shaft_right'), at('arm_shaft_mid'), at('crank')],
      tags: [{ node: 'balance_wheel', text: '1 turn = 1 stitch', at: at('wheel_top') }],
      try: 'run',
      count: [{ node: 'arm_shaft', label: 'Stitches' }],
    },
    {
      label: 'Needle',
      title: 'A crank drives the needle; a lever feeds it thread',
      text: [
        'The crank on the arm shaft’s left end swings the link, and the link drives the needle bar through a 30 mm stroke. Beside it the take-up lever rocks: down while the needle and hook need thread, up to pull the stitch tight.',
        'The top thread comes from the spool, between the tension discs, through the eye of the take-up lever and down to the needle. The needle’s eye goes below the cloth with a loop of it; the needle itself never lets go.',
      ],
      angle: [-22, 10],
      explode: 0.45,
      rate: 0.35,
      focus: ['arm_shaft', 'needle_link', 'needle_bar', 'needle', 'take_up_lever'],
      flow: [at('arm_shaft_mid'), at('crank'), { node: 'needle_link', at: at('link'), ride: true }, { node: 'needle_bar', at: at('needle_bar'), ride: true }, { node: 'needle', at: at('needle_point'), ride: true }],
      tags: [
        { node: 'needle_bar', text: '30 mm stroke', at: at('needle_bar') },
        { node: 'take_up_lever', text: 'take-up lever', at: at('take_up_eye') },
      ],
    },
    {
      label: 'To the hook',
      title: 'Gears turn the hook twice for every stitch',
      text: [
        'At the top of the pillar a bevel gear on the arm shaft drives a gear half its size on the upright shaft. At the bottom a second pair turns the drive along the underside of the bed, and a third pair turns the hook on its vertical shaft.',
        'Singer’s manual gives the hook two turns to each stroke of the needle bar. One turn catches a loop; on the other the beak passes the needle while it’s up and catches nothing. Count them.',
      ],
      angle: [-30, -18],
      explode: 0.45,
      focus: ['arm_shaft', 'upright_shaft', 'hook_drive_shaft', 'hook'],
      flow: [at('arm_shaft_mid'), at('bevel_top'), at('upright'), at('bevel_bottom'), at('drive_mid'), at('hook_gears'), at('hook_axis')],
      tags: [
        { node: 'upright_shaft', text: '2 turns a stitch', at: at('upright') },
        { node: 'hook', text: '2 turns a stitch', at: at('hook') },
      ],
      chart: {
        type: 'ladder',
        title: 'Turns, for one stitch',
        caption: `The 2 : 1 is Singer’s; Singer published no tooth counts, so it is drawn here as ${S.teeth.upper[0]} teeth driving ${S.teeth.upper[1]} at the top, and 1 : 1 below.`,
        unit: 'Turns, for one turn of the arm shaft',
        ticks: [0, 1, 2],
        rungs: [
          { name: 'Arm shaft', value: 1, note: '1 turn', node: 'arm_shaft' },
          { name: 'Upright shaft', value: Math.abs(T.upright), note: '2 turns', step: '×2', node: 'upright_shaft' },
          { name: 'Hook driving shaft', value: Math.abs(T.drive), note: '2 turns', step: '×1', node: 'hook_drive_shaft' },
          { name: 'Hook', value: Math.abs(T.hook), note: '2 turns', step: '×1', node: 'hook' },
        ],
      },
      try: 'run',
      count: [{ node: 'arm_shaft', label: 'Stitches' }, { node: 'hook', label: 'Hook turns' }],
    },
    {
      label: 'The stitch',
      title: 'No knot: the hook takes the loop round the bobbin',
      text: [
        'It looks as if the needle must carry the thread through and back, or tie a knot underneath. It does neither. As the needle starts back up, the thread beside it bulges into a loop; the hook’s beak catches the loop and carries it right round the bobbin case, the take-up lever pulls it up, and the bobbin thread is left lying inside it.',
        'The two threads interlock in the middle of the cloth, and neither has a free end: the stitch is a lock, not a knot. That’s why the case sits still in the hook, held by a finger: the loop has to pass all the way round it.',
      ],
      angle: [-40, 40],
      explode: 0.58,
      rate: 0.12,
      fill: 0.6,
      focus: ['hook', 'bobbin_case', 'bobbin', 'needle', 'needle_bar', 'feed_dog'],
      frame: ['hook', 'bobbin_case', 'needle'],
      tags: [
        { node: 'hook', text: 'beak', at: at('beak'), ride: true },
        { node: 'bobbin', text: 'bobbin thread', at: at('bobbin') },
      ],
      chart: {
        type: 'timing',
        title: 'The loop’s trip round the bobbin',
        caption: 'The beak meets the needle just after its lowest point and has the loop round the case before the take-up lever pulls it up.',
        node: 'arm_shaft',
        perTurn: 1,
        bands: [[r3(CATCH), r3(CAST), 'loop round the bobbin']],
        lanes: [
          { name: 'Needle', points: needle, notes: [[r3(CATCH), 'caught']] },
          { name: 'Take-up lever', points: takeUp },
        ],
      },
    },
    {
      label: 'Feed',
      title: 'Up, back, down, forward',
      text: [
        'An eccentric on the arm shaft rocks the lifting shaft under the bed, which raises the feed dog’s teeth through the plate; the feed cam and the forked connection rock the other shaft, which pushes the dog back. Up, back, down, forward: it grips the cloth from below and walks it on.',
        `The stitch regulator sets how far the dog travels, from ${S.travel} mm (6 stitches to the inch, as on this model) down to 0.85 mm. The cloth only moves while the needle is out of it.`,
      ],
      angle: [-24, -12],
      explode: 0.45,
      rate: 0.35,
      focus: ['arm_shaft', 'feed_rod', 'feed_fork', 'feed_lift_shaft', 'feed_rock_shaft', 'feed_dog', 'stitch_lever'],
      flow: [at('feed_cam'), at('feed_fork'), at('rock_shaft'), at('rock_arm'), { node: 'feed_dog', at: at('feed_teeth'), ride: true }],
      tags: [
        { node: 'feed_dog', text: `${S.travel} mm a stitch`, at: at('feed_dog') },
        { node: 'feed_lift_shaft', text: 'lifts', at: at('lift_shaft') },
        { node: 'feed_rock_shaft', text: 'pushes', at: at('rock_shaft') },
      ],
      chart: {
        type: 'bars',
        title: 'Stitch length',
        caption: 'Millimetres per stitch at the regulator’s settings. This model runs at the longest, 6 to the inch.',
        unit: 'mm a stitch, by stitches to the inch',
        picked: 0,
        bars: [6, 8, 10, 12, 16, 20, 30].map((spi) => ({ label: String(spi), value: mm(spi) })),
      },
    },
  ],
  credit: builtInCode(
    'Sewing machine, a Singer 201-2',
    'Laid out from Singer’s Adjuster’s Manual for the 201 (Form 18962, 1936) and the 201-2 instruction book (Form 20340, 1951), with the Science Museum’s 201K records. The head’s size, the needle stroke and the gear teeth are drawn, not measured; the take-up lever rocks smoothly in time with the crank, its drive link left out. Singer is a trademark of its owner; this illustration has nothing to do with the company.',
  ),
  build: { generate: 'objects/sewing-machine/generate.mjs', hints: 'objects/sewing-machine/hints.json' },
});

function missing(name) {
  throw new Error(`objects/sewing-machine/hints.json has no "${name}": add it to the hints generate.mjs returns, then npm run models:build -- sewing-machine`);
}
