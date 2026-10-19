// Writes content/tesla-roadster.json, the content file for the 2026 Roadster (a spec with `aero`): its text, its
// parts and how they come off, its motions (the wheels and motors; the fans, skirts and wing on the suction system's
// controls), where its ten nozzles are and which way their jets go, its callouts and its "How it works" film. It runs the
// build (without the checks) for where things sit in model space. The numbers in the text come from
// src/viewer/aerocar.ts, which the viewer and the charts run on.
//   node objects/tesla-roadster/content.mjs
import { writeContent } from '../../scripts/kit/content.mjs';
import generate from './generate.mjs';
import spec from './spec.mjs';

const car = 'roadster';
const { hints: H } = await generate({ data: { build: { car } }, check: 'skip', log: () => {} });
const { slug, ...thing } = roadsterContent({ car, spec, H });
writeContent(slug, thing);

function roadsterContent({ car, spec, H }) {
  const MM = H.space.mmPerUnit;
  const r4 = (v) => +v.toFixed(4);
  const M = (x, y, z) => [x, y, z].map((v, i) => r4(H.space.origin[i] + v / MM));
  const U = (mm) => r4(mm / MM);
  const pose = (target, [az, el], dist) => {
    const a = (az * Math.PI) / 180;
    const e = (el * Math.PI) / 180;
    return { position: [target[0] + dist * Math.cos(e) * Math.sin(a), target[1] + dist * Math.sin(e), target[2] + dist * Math.cos(e) * Math.cos(a)].map(r4), target };
  };
  const P = (direction, distance, window, extra = {}) => ({ direction, distance, window, ...extra });
  const A = H.aero;
  const X = [1, 0, 0];
  const zr = -spec.wheelbase / 2;
  const wheelNames = ['fl', 'fr', 'rl', 'rr'];
  const nozzles = (group) => A.thrusters.filter((t) => t.group === group).map((t) => t.node);
  const [rear, lift, yaw] = [nozzles('rear'), nozzles('down'), nozzles('yaw')];
  const fans = A.fans.map((f) => f.node);
  const litres = A.tanks.reduce((s, t) => s + t.litres, 0);

  const parts = [
    ...['left', 'right'].map((side) => ({ node: `door_${side}`, label: `${side === 'left' ? 'Left' : 'Right'} door`, group: 'Body', about: 'A scissor door: hinged at its front edge, it swings up.', ...P([side === 'left' ? 1 : -1, 0.15, 0], 0.32, [0, 0.22]) })),
    { node: 'bonnet', label: 'Front lid', group: 'Body', about: 'Over the front boot, where the compressor that fills the air tanks is.', ...P([0, 1, 0.3], 0.2, [0.08, 0.26]) },
    { node: 'boot', label: 'Rear wing', group: 'Body', about: 'The deck behind the glass is the wing: in track mode it rises on two struts and tilts, its front edge down, to press the tail down at speed.', ...P([0, 1, 0], 0.2, [0.08, 0.26]) },
    { node: 'front_bumper', label: 'Nose', group: 'Body', about: 'The light bar across it, an intake underneath, and in its sides the two yaw nozzles.', ...P([0, 0, 1], 0.22, [0.16, 0.34]) },
    { node: 'rear_bumper', label: 'Tail', group: 'Body', about: 'The light bar across it, and the opening where the fans blow out and the rear nozzles fire.', ...P([0, 0, -1], 0.22, [0.16, 0.34]) },
    { node: 'body', label: 'Body', group: 'Body', about: 'The shell, the gold-tinted glass and the cabin: it lifts off the battery, the fans, the air tanks and the nozzles underneath.', ...P([0, 1, 0], 0.36, [0.4, 0.62]) },
    { node: 'fan_box', label: 'Suction fans', group: 'Suction', about: 'Four electric fans of about 20 kW each, in the tail. A duct from an inlet in the floor between the rear wheels feeds them the air from under the car, and they blow it out of the back.', ...P([0, 0, -1], 0.1, [0.66, 0.84]) },
    { node: 'skirts', label: 'Skirts', group: 'Suction', about: 'Carbon blades round the sealed floor. When the fans run they drop to just above the road, so air can only seep in under their edges.', ...P([0, 1, 0], 0, [0, 1]) },
    { node: 'air_tanks', label: 'Air tanks', group: 'Air', about: `Carbon-wound tanks, about ${Math.round(litres / 10) * 10} litres in all at 690 bar (10,000 psi): one across the car behind the seat, one in the passenger’s place.`, ...P([0, 1, 0], 0.1, [0.66, 0.84]) },
    { node: 'compressor', label: 'Compressor', group: 'Air', about: 'An electric pump that fills the tanks from the battery. Tesla says six or seven hours for now, and wants it down to half an hour.', ...P([0, 1, 0], 0.12, [0.66, 0.84]) },
    { node: 'air_lines', label: 'Valves and lines', group: 'Air', about: 'Lines from the tanks to a valve block on the main tank’s back, and out to every nozzle; each nozzle has its own fast electric valve.', ...P([0, 1, 0], 0, [0, 1]) },
    { node: rear[0], label: 'Rear thrusters', group: 'Air', about: 'Four nozzles in the tail, about 80 kN between them: four or five times the push the tyres can give.', with: rear.slice(1), ...P([0, 1, 0], 0, [0, 1]) },
    { node: lift[0], label: 'Lift thrusters', group: 'Air', about: 'One at each corner, blowing straight down: together they can lift the car off the ground.', with: lift.slice(1), ...P([0, 1, 0], 0, [0, 1]) },
    { node: yaw[0], label: 'Yaw thrusters', group: 'Air', about: 'One in each side of the nose: they turn the car about its middle, in the air or on the ground.', with: yaw.slice(1), ...P([0, 1, 0], 0, [0, 1]) },
    { node: 'battery_pack', label: 'Battery pack', group: 'Skateboard', about: 'A thick tray of 4680 cells in the floor, at 800 to 1,000 volts; the seat sits on it.', ...P([0, 1, 0], 0, [0, 1]) },
    { node: 'pack_lid', label: 'Pack lid', group: 'Skateboard', about: 'Seals the pack; the cabin floor, the seat and the passenger’s tank sit on it.', ...P([0, 1, 0], 0, [0, 1]) },
    { node: 'drive', label: 'Rear motors', group: 'Skateboard', about: 'A motor for each rear wheel, each with its inverter on top and a reduction gear beside it. Over a megawatt between them, Tesla says.', ...P([0, 1, 0], 0, [0, 1]) },
    { node: 'suspension', label: 'Suspension', group: 'Skateboard', about: 'Double wishbones and a coil-over at each corner; the front wheels are steered by wire, from a yoke.', ...P([0, 1, 0], 0, [0, 1]) },
    ...wheelNames.map((n) => ({ node: `wheel_${n}`, label: `${n[0] === 'f' ? 'Front' : 'Rear'} ${n[1] === 'l' ? 'left' : 'right'} wheel`, group: 'Wheels', about: n[0] === 'f' ? '20-inch, on 255/30 tyres.' : '21-inch, on wide 325/30 tyres.', ...P([n[1] === 'l' ? 1 : -1, 0, 0], 0.15, [0.22, 0.38]) })),
  ];

  // The wheels and the motors; the fans turn by their control, the skirts slide down and the wing rises and tilts by theirs.
  const ratio = 9;
  const fanAxis = [0, 0, 1];
  const motion = [
    ...wheelNames.map((n) => ({ node: `wheel_${n}`, axis: X, pivot: H.wheels[n].axle, speed: 1 })),
    ...['rl', 'rr'].map((n) => ({ node: `shaft_${n}`, axis: X, pivot: H.wheels[n].axle, speed: 1, inside: true })),
    ...Object.entries(H.motors).map(([name, at]) => ({ node: `${name}_rotor`, axis: X, pivot: at, speed: ratio, inside: true })),
    ...A.fans.map((f) => ({ node: f.node, axis: fanAxis, pivot: f.axle, control: 'fan', turn: 1 })),
    { node: 'skirts', axis: X, control: 'skirts', slide: [0, -A.skirts.drop, 0] },
    { node: 'boot', axis: X, control: 'wing', slide: [0, A.wing.rise, 0] },
    { node: 'boot', axis: X, pivot: A.wing.pivot, control: 'wing', turn: r4(-A.wing.pitch / 360) },
  ];

  // Where each nozzle's jet comes out and which way it goes: the lift ones front left, front right, rear left, rear right.
  const jets = A.thrusters.map((t) => ({ node: t.node, at: t.exit, dir: t.jet, group: t.group === 'down' ? 'lift' : t.group }));

  const annotations = [
    { title: 'Suction fans', text: 'Four fans pull the air out from under the floor and blow it out of the back.', node: 'fan_box', position: M(155, 275, -1990), camera: pose(M(0, 300, -1900), [180, 12], 1.0) },
    { title: 'Skirts', text: 'They drop to just above the road while the fans run, to seal the floor.', node: 'skirts', position: M(776, 140, 0), camera: pose(M(600, 200, 0), [80, 6], 1.1) },
    { title: 'Air tanks', text: `About ${Math.round(litres / 10) * 10} litres of air at 690 bar, in carbon-wound tanks.`, node: 'air_tanks', position: M(-350, 885, 170), explode: 0.64, camera: pose(M(-100, 650, -250), [-72, 10], 1.45) },
    { title: 'Rear thrusters', text: 'Four nozzles, about 80 kN together.', node: rear[1], position: M(-135, 520, -2030), camera: pose(M(0, 450, -1950), [160, 10], 0.9) },
    { title: 'Lift thrusters', text: 'One at each corner, blowing down.', node: lift[0], position: M(700, 120, 1900), camera: pose(M(600, 250, 1800), [40, 4], 1.0) },
    { title: 'Yaw thrusters', text: 'In the sides of the nose: they turn the car.', node: yaw[0], position: M(870, 300, 2020), camera: pose(M(700, 320, 1900), [70, 8], 0.9) },
    { title: 'Compressor', text: 'Fills the tanks from the battery.', node: 'compressor', position: M(0, 560, 1880), explode: 0.3, camera: pose(M(0, 350, 1800), [-25, 40], 0.9) },
    { title: 'Rear wing', text: 'Hidden in the deck; it rises in track mode.', node: 'boot', position: M(0, 880, -1900), camera: pose(M(0, 800, -1700), [-150, 26], 1.2) },
  ];

  // Paths the air takes, model space: in under the skirts, along the floor, up the duct, through the fans and out.
  const D = A.duct;
  const suctionFlows = [
    [M(980, 40, 400), M(760, 60, 300), M(400, 70, -300), { node: 'fan_box', at: D.inlet }, { node: 'fan_box', at: M(0, 200, -1300) }, { node: 'fan_box', at: D.up }, { node: 'fan_box', at: M(155, 275, -1900) }, M(155, 275, -2400)],
    [M(-980, 40, 700), M(-760, 60, 600), M(-400, 70, -100), { node: 'fan_box', at: M(-200, 110, -950) }, { node: 'fan_box', at: M(-250, 200, -1350) }, { node: 'fan_box', at: M(-400, 330, -1720) }, { node: 'fan_box', at: M(-465, 275, -1900) }, M(-465, 275, -2400)],
  ];
  const T = A.tanks;
  const thrustFlows = [rear[1], rear[2]].map((n) => {
    const t = A.thrusters.find((h) => h.node === n);
    return [{ node: T[0].node, at: T[0].centre }, { node: 'air_lines', at: A.manifold }, { node: 'air_lines', at: M(0, 640, -1650) }, { node: n, at: t.inlet }, { node: n, at: t.exit }, M(t.exit[0] * MM, 520, -2600)];
  });
  const motors = Object.keys(H.motors);

  // "How it works" as a film: the motors drive the rear wheels, the fans suck the car onto the road, and the rear
  // thrusters fire. What stays solid: the motors' rotors and what they turn, the wheels, the fans, the rear nozzles. The
  // body, the motors' cases, the fans' box, the skirts, the tanks and the lines are glass. (With the front wheels solid
  // too, the parts in focus span the car, so its glass front doesn't fade into a smudge over its own shadow.)
  const MOVING = [...motors.map((m) => `${m}_rotor`), 'shaft_rl', 'shaft_rr', ...wheelNames.map((n) => `wheel_${n}`), ...fans, ...rear];
  // Every shot frames the whole car, so none of it runs over the script beside the stage.
  const WHOLE = ['body', 'front_bumper', 'rear_bumper', ...wheelNames.map((n) => `wheel_${n}`)];
  // Slowed down by half, all through, so the motors (nine turns to the wheel's one) can be followed.
  const pace = { focus: MOVING, rate: 0.5 };
  const film = [
    {
      chapter: 'Drive',
      caption: 'The battery drives a motor for each rear wheel, geared down nine times to turn it.',
      duration: 6,
      angle: [-60, 30],
      fill: 0.84,
      ...pace,
      frame: WHOLE,
      tags: [{ node: 'drive', text: 'rear motors', at: M(-320, 700, zr) }],
    },
    {
      chapter: 'Grip',
      caption: 'Four fans in the tail pull the air from under the floor, so the air above holds it down.',
      duration: 6.5,
      angle: [-95, 14],
      fill: 0.84,
      ...pace,
      frame: WHOLE,
      flows: suctionFlows,
      carries: 'air',
      tags: [
        { node: 'fan_box', text: 'fans', at: M(0, 300, -2150) },
        { node: 'battery_pack', text: 'low pressure', at: M(0, 60, -200) },
      ],
      cues: [{ at: 0.8, do: 'fans', to: true }],
    },
    {
      chapter: 'Thrust',
      caption: 'Air at 690 bar from the tanks blasts out of four rear nozzles, shoving the car forward.',
      duration: 6,
      angle: [-125, 18],
      fill: 0.84,
      ...pace,
      frame: WHOLE,
      flows: thrustFlows,
      carries: 'air',
      tags: [
        { node: T[0].node, text: 'air tank', at: M(400, 1040, -830) },
        { node: rear[1], text: 'nozzles', at: M(-135, 520, -2030) },
      ],
      cues: [
        { at: 1, do: 'thrust', to: true },
        { at: 3, do: 'thrust', to: false },
      ],
    },
  ];

  return {
    slug: 'tesla-roadster',
    order: 9,
    title: 'Tesla Roadster',
    hook: 'Fans that suck it onto the road and air thrusters that make it fly: the Roadster Tesla showed in 2026.',
    category: 'cars',
    summary: [
      'Tesla showed its new Roadster on 15 October 2026, nine years after the first prototype, in three trims: the Performance, with fans that suck it onto the road; the Thrust, which adds cold-gas thrusters at the back; and the Rocket, shown here, with ten thrusters round it and a tank where the passenger would sit. It flies, for a few seconds at a time, and isn’t allowed on public roads.',
      'Under the tail, four electric fans pull the air out from under the sealed floor, so the air above presses the car down even when it’s standing still: enough, Tesla says, to drive upside down. And it carries about 600 litres of air squeezed to 690 bar; let out through nozzles like a rocket’s, it shoves the car forward, or lifts it off the ground.',
      'The figures are Tesla’s claims (0 to 60 mph in under 0.59 seconds for the Rocket, over 230 mph); production is planned for 2028. This model was built in code from the launch’s photographs. Tesla hasn’t published drawings of its insides, so the fans, tanks and nozzles are laid out from its descriptions and its fan-car patent, not from the real parts.',
    ],
    model: 'models/tesla-roadster.glb',
    viewAngle: [-40, 14],
    explodeAngle: [-48, 26],
    explodeDuration: 1800,
    motionLabel: 'Drive',
    facts: [
      { label: 'Shown', value: '15 October 2026' },
      { label: 'Trim', value: 'Rocket (one seat, not road-legal)' },
      { label: 'Suction', value: 'Four fans, about 80 kW' },
      { label: 'Air', value: 'About 600 litres at 690 bar' },
      { label: 'Thrusters', value: 'Ten: four rear, four lift, two yaw' },
      { label: '0–60 mph', value: 'Under 0.59 s (claimed)' },
      { label: 'Production', value: '2028 (planned)' },
    ],
    parts,
    annotations,
    motion,
    jets,
    film,
    credit: {
      title: 'Tesla Roadster (2026), after Tesla’s launch photographs',
      author: '3D of Things',
      license: 'CC0 1.0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      source: 'built in code for this site',
      sourceUrl: '',
      extra: { label: 'Sources', text: 'Proportions from Tesla’s launch photographs (October 2026); the suction system after Tesla’s “Electric Fan Car” patent (US 12,746,987); figures from Tesla, Electrek and The EV Report. The layout of the tanks, lines and nozzles is this model’s.' },
    },
    build: { generate: 'objects/tesla-roadster/generate.mjs', car },
  };
}
