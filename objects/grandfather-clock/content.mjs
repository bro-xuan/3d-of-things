// Writes content/grandfather-clock.json from the page's text and where the build put things
// (objects/grandfather-clock/hints.json), so no model-space number is pasted by hand. Run it after every build:
//   node objects/grandfather-clock/content.mjs
import { polyHaven, pose, readHints, space, writeContent } from '../../scripts/kit/content.mjs';

const H = readHints('grandfather-clock');
const { U } = space(H);
const at = (name) => H?.anchors?.[name] ?? (H ? missing(name) : [0, 1, 0]);
const pivot = (name) => H?.pivots?.[name] ?? (H ? missing(name) : [0, 1, 0]);
const T = H?.teeth ?? { great: 96, centrePinion: 8, centre: 60, thirdPinion: 8, third: 56, escapePinion: 7, escape: 30, cannon: 36, minute: 36, minutePinion: 6, hour: 72 };
const off = (direction, mm, window) => ({ direction, distance: U(mm), window });

// The numbers on the page, from the train (truth sheet §4).
const thirdPerHour = T.centre / T.thirdPinion;
const escapePerHour = (T.third / T.escapePinion) * thirdPerHour;
const greatHours = T.great / T.centrePinion;
const hourRatio = (T.minute / T.cannon) * (T.hour / T.minutePinion);
const LENGTH = H?.length ?? 994;
const AMPLITUDE = H?.amplitude ?? 3;
if (escapePerHour !== 60 || hourRatio !== 12) throw new Error(`the train doesn't keep time: escape wheel ${escapePerHour} turns an hour, hour hand ${hourRatio} : 1`);

/** Turns per turn of the seconds hand (the escape wheel, once a minute); positive is clockwise from the front. */
const TRAIN = {
  escape_wheel: 1,
  third_wheel: -T.escapePinion / T.third,
  centre_wheel: 1 / 60,
  great_wheel: -1 / (60 * greatHours),
  cannon_wheel: 1 / 60,
  minute_wheel: -(T.cannon / T.minute) / 60,
  hour_wheel: 1 / (60 * hourRatio),
};

/** What stays solid through the film: everything that moves and what it acts on. The case, the plates and the dial are glass. */
const MOVING = ['weight', 'great_wheel', 'centre_wheel', 'third_wheel', 'escape_wheel', 'anchor', 'crutch', 'pendulum', 'cannon_wheel', 'minute_wheel', 'hour_wheel', 'minute_hand', 'hour_hand', 'seconds_hand'];
/** Every shot at one size, leaning in: from the top of the hood to the pendulum's bob, with the base and the foot of the
 *  trunk below the stage (the owner's exception for tall objects). Exact cameras, one distance, so the size never changes. */
const [TOP, LOW] = [at('hood_top'), at('bob_low')];
/** The middle of the frame, set below the middle of hood-to-bob so the bob clears the caption. */
const FRAME_DOWN = 0.51;
const FILM_TARGET = [0, +(TOP[1] - FRAME_DOWN * (TOP[1] - LOW[1])).toFixed(4), pivot('centre')[2]];
const FILM_DISTANCE = 3.02;
const shotFrom = (angle) => pose(FILM_TARGET, angle, FILM_DISTANCE);

const power = [{ node: 'weight', at: at('weight_mid') }, { node: 'weight', at: at('pulley_left') }, { node: 'weight', at: at('line') }, { node: 'weight', at: at('line_top') }, { node: 'great_wheel', at: at('barrel_mid') }, { node: 'great_wheel', at: at('great_mesh') }];
const trainFlow = [{ node: 'great_wheel', at: at('great_mesh') }, { node: 'centre_wheel', at: at('centre_axis') }, { node: 'centre_wheel', at: at('third_mesh') }, { node: 'third_wheel', at: at('third_axis') }, { node: 'third_wheel', at: at('escape_mesh') }, { node: 'escape_wheel', at: at('escape_axis') }];
const impulse = [{ node: 'escape_wheel', at: at('escape_axis') }, { node: 'anchor', at: at('pallet_right') }, { node: 'anchor', at: at('anchor_axis') }, { node: 'crutch', at: at('fork') }, { node: 'pendulum', at: at('rod') }, { node: 'pendulum', at: at('bob_mid') }];

writeContent('grandfather-clock', {
  order: 20,
  title: 'Grandfather Clock',
  hook: 'A falling weight does all the work; the pendulum only lets it out, half a tooth every second.',
  category: 'time',
  summary: [
    'A longcase clock keeps a household’s time to the second for a week on one winding, with nothing to tend but a key. It runs on gravity: a weight sinking slowly down the case supplies the energy, and a pendulum a metre long decides how fast it may be spent.',
    `The weight hangs on a gut line wound round a barrel. The barrel’s great wheel drives a train of wheels: the centre wheel, which carries the minute hand round once an hour, then the third wheel, then the escape wheel, whose ${T.escape} teeth go round once a minute. The anchor rocks with the pendulum and lets the escape wheel on half a tooth at each swing, and the motion work behind the dial turns the hour hand ${hourRatio} times slower than the minute hand.`,
    `A pendulum ${LENGTH} mm long swings once a second whatever its bob weighs, because its period depends only on its length. The weight sinks about 6.7 mm an hour; at each tick a tooth gives the pendulum a small push to make up what the air took. On this model the pendulum swings, the train ticks and the hands keep your time. The pocket watch does the same job with a coiled spring and a balance wheel beating six times a second.`,
  ],
  model: 'models/grandfather-clock.glb',
  viewAngle: [-26, 8],
  explodeAngle: [-48, 8],
  explodeDuration: 3200,
  facts: [
    { label: 'Power', value: '5.7 kg weight, falling 6.7 mm an hour' },
    { label: 'Pendulum', value: `${LENGTH} mm, a swing every second` },
    { label: 'Going train', value: `${T.great} → ${T.centrePinion}, ${T.centre} → ${T.thirdPinion}, ${T.third} → ${T.escapePinion}, escape wheel ${T.escape}` },
    { label: 'Runs', value: '8 days on 16 turns of the key' },
    { label: 'Real size', value: '63 × 219 × 43 cm' },
  ],
  parts: [
    { node: 'weight', label: 'Weight, pulley and line', group: 'Power', about: 'A 5.7 kg cylinder of lead hung on a pulley in a loop of gut line. The pulley halves its pull to 28 N and its fall to 6.7 mm an hour, so it lasts eight days.', ...off([0, -1, 0], 300, [0.2, 0.3]) },
    { node: 'great_wheel', label: 'Barrel and great wheel', group: 'Power', about: `The line is wound on a barrel 51 mm across. Its ${T.great}-tooth great wheel turns once in ${greatHours} hours; a ratchet and click let the key wind the barrel back without turning the wheel.`, ...off([0, 0, 1], 200, [0.66, 0.76]) },
    { node: 'centre_wheel', label: 'Centre wheel', group: 'Train', about: `Its ${T.centrePinion}-leaf pinion is driven by the great wheel, so it turns once an hour; its arbor comes through the front plate and carries the minute hand.`, ...off([0, 0, 1], 110, [0.8, 0.92]) },
    { node: 'third_wheel', label: 'Third wheel', group: 'Train', about: `${T.centre} teeth on ${T.thirdPinion} leaves: seven and a half turns an hour. Its ${T.third} teeth drive the escape wheel’s ${T.escapePinion}-leaf pinion eight times as fast.`, ...off([0, 0, 1], 150, [0.72, 0.84]) },
    { node: 'escape_wheel', label: 'Escape wheel', group: 'Train', about: `${T.escape} pointed teeth, once round a minute. It would race round under the weight’s pull if the anchor didn’t hold it.`, ...off([0, 0, 1], 190, [0.64, 0.74]) },
    { node: 'anchor', label: 'Anchor', group: 'Escapement', about: 'Two steel pallets on one arbor, straddling seven and a half teeth. As it rocks, one pallet lets a tooth go and the other catches the next.', ...off([0, 0, 1], 200, [0.62, 0.72]) },
    { node: 'crutch', label: 'Crutch', group: 'Escapement', about: 'An arm down from the anchor’s arbor, behind the movement, with a fork round the pendulum rod: it carries the swing to the anchor and the push back to the pendulum.', ...off([0, 0, -1], 50, [0.68, 0.76]) },
    { node: 'pendulum', label: 'Pendulum', group: 'Escapement', about: `A steel rod and a brass-faced lead bob, hung on a thin steel spring: ${LENGTH} mm from the spring to the bob’s centre, so each swing takes one second.`, ...off([0, 0, -1], 100, [0.6, 0.68]) },
    { node: 'cannon_wheel', label: 'Cannon wheel', group: 'Hands', about: `A ${T.cannon}-tooth wheel on a pipe, friction-tight on the centre arbor: it carries the minute hand, and slips when you set the hands.`, ...off([0, 0, 1], 330, [0.44, 0.52]) },
    { node: 'minute_wheel', label: 'Minute wheel', group: 'Hands', about: `${T.cannon} teeth to ${T.minute}: it turns once an hour on a stud, and its ${T.minutePinion}-leaf pinion drives the hour wheel.`, ...off([0, 0, 1], 330, [0.44, 0.52]) },
    { node: 'hour_wheel', label: 'Hour wheel', group: 'Hands', about: `${T.hour} teeth driven by ${T.minutePinion}: once round in ${hourRatio} hours. Its pipe, round the cannon’s, carries the hour hand.`, ...off([0, 0, 1], 330, [0.44, 0.52]) },
    { node: 'seconds_hand', label: 'Seconds hand', group: 'Hands', about: 'On the escape wheel’s arbor: it steps once a second with the tick, and goes round once a minute.', ...off([0, 0, 1], 340, [0.2, 0.32]), then: { direction: [-1, 0, 0], distance: U(800) } },
    { node: 'minute_hand', label: 'Minute hand', group: 'Hands', about: 'On the cannon wheel: once round an hour.', ...off([0, 0, 1], 340, [0.2, 0.32]), then: { direction: [-1, 0, 0], distance: U(800) } },
    { node: 'hour_hand', label: 'Hour hand', group: 'Hands', about: 'On the hour wheel’s pipe: once round in twelve hours.', ...off([0, 0, 1], 340, [0.2, 0.32]), then: { direction: [-1, 0, 0], distance: U(800) } },
    { node: 'dial', label: 'Dial', group: 'Hands', about: 'A brass plate with a silvered chapter ring and a moon in the arch, pinned to the front plate on four feet. Two winding squares come through it.', ...off([0, 0, 1], 300, [0.28, 0.42]), then: { direction: [-1, 0, 0], distance: U(800) } },
    { node: 'front_plate', label: 'Front plate', group: 'Frame', about: 'Brass, with the wheels’ front pivots in it. Take it off and the train lifts out.', ...off([0, 0, 1], 130, [0.5, 0.6]), then: { direction: [0, 1, 0], distance: U(330) } },
    { node: 'frame', label: 'Back plate, pillars and cock', group: 'Frame', about: 'The back plate and four turned pillars hold the wheels; the cock behind it carries the pendulum’s spring.', direction: [0, 0, 1], distance: 0 },
    { node: 'hood', label: 'Hood', group: 'Case', about: 'Slides forward off the case to reach the movement. Its glazed door opens to wind the clock and set the hands.', ...off([0, 0, 1], 450, [0, 0.14]), then: { direction: [1, 0, 0], distance: U(700) } },
    { node: 'trunk_door', label: 'Trunk door', group: 'Case', about: 'Opens on the weight and the pendulum, to start it swinging or adjust its rating nut.', ...off([0, 0, 1], 260, [0.04, 0.18]), then: { direction: [1, 0, 0], distance: U(380) } },
    { node: 'base', label: 'Base', group: 'Case', about: 'The plinth the trunk stands on, on four bracket feet.', direction: [0, 0, 1], distance: 0 },
    { node: 'case', label: 'Case and seatboard', group: 'Case', about: 'The trunk is tall for two reasons: a pendulum a metre long, and room for the weight to fall 1.3 m in eight days. The movement stands on a seatboard across its top.', direction: [0, 0, 1], distance: 0 },
  ],
  annotations: [
    { title: 'The weight', text: 'All the clock’s energy: 5.7 kg of lead, sinking 6.7 mm an hour on a pulley that halves its fall. About a tenth of a milliwatt, and 1.3 m of drop in eight days.', node: 'weight', position: at('weight'), explode: 0.19, camera: pose(at('weight_mid'), [-30, 6], 1.0) },
    { title: 'Barrel and great wheel', text: `The line is wound on the barrel, which the weight turns once in ${greatHours} hours. Winding turns the barrel back against a ratchet and click: sixteen turns of the key for eight days.`, node: 'great_wheel', position: at('great_wheel'), explode: 0.61, camera: pose(at('barrel_mid'), [-52, 14], 0.62) },
    { title: 'Centre wheel', text: `Once an hour, with the minute hand on its arbor. Its ${T.centre} teeth turn the third wheel’s ${T.thirdPinion}-leaf pinion, and the third wheel turns the escape wheel: 7½ × 8 = 60 turns an hour.`, node: 'centre_wheel', position: at('centre_wheel'), explode: 0.61, camera: pose(at('centre_axis'), [-58, 12], 0.55) },
    { title: 'Escapement', text: `The anchor’s pallets straddle 7½ of the escape wheel’s ${T.escape} teeth. Each swing lets the wheel on half a tooth, and the tooth pushes the pallet as it goes: that push keeps the pendulum swinging, and makes the tick.`, node: 'anchor', position: at('anchor'), explode: 0.61, camera: pose(at('escape_axis'), [-34, 16], 0.55) },
    { title: 'The pendulum doesn’t drive it', text: 'It only paces it. The weight supplies all the energy; each tooth gives the pendulum at most 0.1 mJ, under 1% of the 13 mJ in its swing, to replace what the air and spring took. Without the weight the swing dies away; without the pendulum the train races.', node: 'pendulum', position: at('bob'), explode: 0.19, camera: pose(at('bob_mid'), [-26, 6], 1.0) },
    { title: 'Length sets the beat', text: `${LENGTH} mm from the spring to the bob’s centre gives a swing of one second at ±${AMPLITUDE}°, whatever the bob weighs. Screw the rating nut up 1 mm and the clock gains about 43 seconds a day.`, node: 'pendulum', position: at('rating_nut'), explode: 0.19, camera: pose(at('bob_mid'), [-8, 4], 0.75) },
    { title: 'Motion work', text: `Behind the dial, the cannon wheel on the centre arbor turns the minute wheel; its ${T.minutePinion}-leaf pinion turns the ${T.hour}-tooth hour wheel once in ${hourRatio} hours. The cannon is only friction-tight, so pushing the minute hand round sets the time.`, node: 'hour_wheel', position: at('hour_wheel'), explode: 0.43, camera: pose(at('dial_centre'), [-48, 10], 0.5) },
    { title: 'Why it’s so tall', text: 'The trunk holds a metre of pendulum and room for the weight to fall 1.3 m in eight days. The hood slides forward to reach the movement; the trunk door opens on the weight and pendulum.', node: 'case', position: at('door'), explode: 0, camera: pose([0, 0.95, 0], [-30, 8], 4.6) },
  ],
  motion: [
    { node: 'hour_hand', axis: [0, 0, 1], pivot: pivot('hands'), clock: 'hour' },
    { node: 'minute_hand', axis: [0, 0, 1], pivot: pivot('hands'), clock: 'minute' },
    { node: 'seconds_hand', axis: [0, 0, 1], pivot: pivot('escape'), clock: 'second' },
    ...Object.entries({ great_wheel: 'great', centre_wheel: 'centre', third_wheel: 'third', escape_wheel: 'escape', cannon_wheel: 'centre', minute_wheel: 'minuteWheel', hour_wheel: 'centre' }).map(([node, axisAt]) => ({
      node,
      axis: [0, 0, 1],
      pivot: pivot(axisAt),
      train: +TRAIN[node].toFixed(8),
      inside: true,
    })),
    // The pendulum beats once a second, and the anchor and crutch rock with it about the same line.
    { node: 'pendulum', axis: [0, 0, 1], pivot: pivot('pendulum'), swing: 'balance', amplitude: AMPLITUDE, beats: 1, inside: true },
    { node: 'anchor', axis: [0, 0, 1], pivot: pivot('anchor'), swing: 'balance', amplitude: AMPLITUDE, inside: true },
    { node: 'crutch', axis: [0, 0, 1], pivot: pivot('anchor'), swing: 'balance', amplitude: AMPLITUDE, inside: true },
  ],
  // "How it works": the energy from the weight to the hands, in real time. The pendulum swings and the escape wheel
  // ticks; the slower wheels turn too slowly to see, so the power's path is drawn along them.
  film: [
    {
      chapter: 'Power',
      caption: 'The 5.7 kg weight pulls on its line and turns the barrel, once every twelve hours.',
      duration: 6,
      camera: shotFrom([-34, 6]),
      focus: MOVING,
      carries: 'power',
      flow: power,
      tags: [
        { node: 'weight', text: 'weight', at: at('weight') },
        { node: 'great_wheel', text: 'barrel', at: at('barrel') },
      ],
    },
    {
      chapter: 'Train',
      caption: 'Its wheels pass the pull on: the centre wheel turns once an hour, the escape wheel once a minute.',
      duration: 6,
      camera: shotFrom([-12, 7]),
      focus: MOVING,
      carries: 'power',
      flow: trainFlow,
      tags: [
        { node: 'centre_wheel', text: 'centre wheel', at: at('centre_wheel') },
        { node: 'escape_wheel', text: 'escape wheel', at: at('escape_wheel') },
      ],
    },
    {
      chapter: 'Pendulum',
      caption: 'Each one-second swing rocks the anchor and lets the escape wheel on by half a tooth.',
      duration: 6,
      camera: shotFrom([12, 7]),
      focus: MOVING,
      carries: 'power',
      flow: impulse,
      tags: [
        { node: 'anchor', text: 'anchor', at: at('anchor') },
        { node: 'pendulum', text: 'pendulum', at: at('bob') },
      ],
    },
    {
      chapter: 'Hands',
      caption: 'The centre wheel carries the minute hand; the motion work turns the hour hand 12 times slower.',
      duration: 5,
      camera: shotFrom([34, 7]),
      focus: MOVING,
      tags: [
        { node: 'minute_hand', text: 'minute hand', at: at('minute_hand') },
        { node: 'hour_wheel', text: 'motion work', at: at('hour_wheel') },
      ],
    },
  ],
  credit: polyHaven('vintage_grandfather_clock_01', 'Vintage Grandfather Clock 01', 'Yann Kervran & James Ray Cock', {
    label: 'Built for this site',
    text: 'The movement inside: the going train, anchor escapement, seconds pendulum, motion work, weight, pulley and line, laid out from the British Museum’s records of London eight-day clocks (Draper, Markwick, Knibb). The strike train, its weight and bell are left out; the tooth shapes are simplified.',
  }),
  build: { augment: 'objects/grandfather-clock/augment.mjs', hints: 'objects/grandfather-clock/hints.json' },
});

function missing(name) {
  throw new Error(`objects/grandfather-clock/hints.json has no "${name}": add it to the hints augment.mjs returns, then npm run models:build -- grandfather-clock`);
}
