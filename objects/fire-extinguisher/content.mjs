// Writes content/fire-extinguisher.json from the page's text and where the build put things
// (objects/fire-extinguisher/hints.json), so no model-space number is pasted by hand. Run it after every build:
//   node objects/fire-extinguisher/content.mjs
//
// What moves is driven by src/viewer/extinguisher.ts through four controls: ext_pin (the safety pin, 0–1 pulled),
// ext_lever (the lever, the stem and the spring's turns, 0–1 squeezed), ext_bar (the gauge's needle, in bar) and
// ext_used (the powder's slices, 0–1 of the charge gone). The numbers in the text are the truth sheet's.
import { polyHaven, pose, readHints, space, writeContent } from '../../scripts/kit/content.mjs';

const H = readHints('fire-extinguisher');
const { U } = space(H);
const at = (name) => H?.anchors?.[name] ?? (H ? missing(name) : [0, 0.5, 0]);
const pivot = (name) => H?.pivots?.[name] ?? (H ? missing(name) : [0, 0.5, 0]);
const off = (direction, mm, window) => ({ direction, distance: U(mm), window });
const r3 = (v) => +v.toFixed(3);

const LEVER = H?.lever?.degrees ?? 17.7;
const STROKE = H?.stroke ?? 3.2;
const DIAL = H?.dial ?? { perBar: 7, charge: 9.6 };
const TURNS = H?.spring?.turns ?? 5;
const CHARGE = H?.charge ?? { top: 329, floor: 78, residualKg: 0.1 };

// The powder's slices telescope: as the charge goes (ext_used 0 to 1) the level falls from its top to the floor, and
// each slice above it slides down inside the one below, its top a hair under the wider slice's, never past the dish.
const slices = H?.slices ?? [];
const fall = CHARGE.top - CHARGE.floor;
const EPS = 0.2;
const powderMotions = slices.slice(1).map(({ name, y0, y1 }, i) => {
  const k = i + 1;
  const start = Math.max(0, (CHARGE.top - y1 + EPS * (slices.length - 1 - k)) / fall);
  const cap = y0 - 89.5;
  return { node: name, axis: [0, 1, 0], control: 'ext_used', slide: [0, -1, 0], curve: [[0, 0], [r3(start), 0], [r3(start + cap / fall), U(cap)]] };
});

// The gauge at other temperatures: the nitrogen's absolute pressure goes with its absolute temperature.
const atTemp = (c) => ((DIAL.charge + 1.013) * (273.15 + c)) / 293.15 - 1.013;

writeContent('fire-extinguisher', {
  order: 18,
  title: 'Fire Extinguisher',
  hook: 'Thirty-five grams of nitrogen push out three kilograms of powder, and only the powder fights the fire.',
  category: 'home',
  summary: [
    'A fire caught in its first minute can be put out by one person, if what they grab works at once, years after it was filled. A stored-pressure extinguisher keeps its push ready inside: nitrogen at about 9.6 bar shares a steel tank with 3.3 kg of powder, so pulling a pin and squeezing a lever is all it takes.',
    'The gas presses on the powder. Squeezing the lever pushes a stem 3 mm down into the valve and takes a rubber seal off its seat; the powder, stirred into the gas, is driven up a dip tube from near the bottom of the tank, through the valve and out of the hose. A gauge on the valve shows the gas’s pressure the whole time it waits.',
    'The nitrogen leaves with the powder, so the pressure falls as the tank empties: from 9.6 bar to about 1 bar in eleven seconds, by which time the powder has gone. On this model the pin, the lever, the stem and its spring, the gauge’s needle and the powder’s level all follow that discharge.',
  ],
  model: 'models/fire-extinguisher.glb',
  viewAngle: [-32, 12],
  explodeAngle: [-40, 14],
  explodeDuration: 2800,
  facts: [
    { label: 'Charge', value: '3.3 kg of ABC powder' },
    { label: 'Push', value: 'about 35 g of nitrogen at 9.6 bar' },
    { label: 'Empties in', value: 'about 11 seconds' },
    { label: 'Reaches', value: '4 to 6 m, makers say' },
    { label: 'Weight, full', value: 'about 5.2 kg' },
  ],
  parts: [
    { node: 'cylinder', label: 'Cylinder', group: 'Store', about: 'A pressed-steel tank 141 mm across that holds 4.7 litres. Makers test it to twice the charge’s pressure.', direction: [0, 1, 0], distance: 0 },
    { node: 'cylinder_front', label: 'Cylinder, front half', group: 'Store', about: 'Cut away on this model so the powder and the dip tube inside can be seen.', ...off([0, 0, 1], 30, [0.3, 0.6]), then: { direction: [1, 0, 0], distance: U(150) } },
    { node: 'stand', label: 'Stand', group: 'Store', about: 'Keeps it upright and in plain sight. 소화기, on its front, is Korean for fire extinguisher.', ...off([0, -1, 0], 55, [0, 0.3]) },
    { node: 'nitrogen', label: 'Nitrogen', group: 'Push', about: 'About 35 g of dry nitrogen at 9.6 bar: a litre above the powder and nearly two more in the gaps between its grains. It only pushes.', direction: [0, 1, 0], distance: 0 },
    { node: 'gauge', label: 'Gauge', group: 'Push', about: 'Reads the nitrogen’s pressure all the time, in tenths of a megapascal (bar). Green, 7 to 9.8 bar, means ready.', ...off([0, 0, 1], 30, [0.6, 0.9]) },
    { node: 'powder', label: 'Powder', group: 'Charge', about: '3.3 kg of ABC powder, mostly monoammonium phosphate, ground fine and coated so it pours like a liquid when the gas stirs it.', direction: [0, 1, 0], distance: 0 },
    { node: 'dip_tube', label: 'Dip tube', group: 'Charge', about: 'A tube 13 mm across from the valve to 12 mm off the bottom. Everything that comes out comes up it, so it only works upright.', direction: [0, 1, 0], distance: 0 },
    { node: 'valve_body', label: 'Valve body', group: 'Valve', about: 'Screwed into the tank’s neck with an O-ring. Inside it are the seat, the stem’s seal, the spring and the passages to the hose and the gauge.', direction: [0, 1, 0], distance: 0 },
    { node: 'valve_stem', label: 'Stem and seal', group: 'Valve', about: `The tank’s pressure and the spring hold its rubber seal up against the seat. The lever pushes it ${STROKE} mm down to open it.`, direction: [0, 1, 0], distance: 0 },
    { node: 'valve_spring', label: 'Return spring', group: 'Valve', about: 'Shuts the valve again when the lever is let go, so a burst can be stopped and started.', direction: [0, 1, 0], distance: 0 },
    { node: 'safety_pin', label: 'Safety pin', group: 'Hand', about: 'Goes through the handle and the lever so the lever can’t move. The plastic tie on it shows whether it has been pulled.', ...off([0, 0, -1], 70, [0, 0.25]) },
    { node: 'squeeze_lever', label: 'Squeeze lever', group: 'Hand', about: `Turns on a pin at the back of the head. ${Math.round(LEVER)}° of travel pushes the stem ${STROKE} mm; the grip is twelve times as far from the pin as the stem is.`, direction: [0, 1, 0], distance: 0 },
    { node: 'carry_handle', label: 'Carry handle', group: 'Hand', about: 'Fixed to the head. Carry it by this, and squeeze the lever down towards it.', direction: [0, 1, 0], distance: 0 },
    { node: 'hose', label: 'Hose', group: 'Out', about: 'About 35 cm of rubber hose from the side of the valve, so the jet can be aimed without lifting the tank.', ...off([-1, 0, 0], 70, [0.05, 0.35]) },
    { node: 'nozzle', label: 'Nozzle', group: 'Out', about: 'Narrows the stream into a jet that throws the powder 4 to 6 m. Clipped to the band until it’s needed.', direction: [0, 1, 0], distance: 0 },
  ],
  annotations: [
    { title: 'Gauge', text: `The needle shows the nitrogen’s pressure: ${DIAL.charge} bar, in the green. It moves with the weather too: the same charge reads ${atTemp(-20).toFixed(1)} bar at −20 °C and ${atTemp(40).toFixed(1)} at 40 °C.`, node: 'gauge', position: at('gauge'), explode: 0, camera: pose(at('gauge'), [-8, 6], 0.42, { card: 'right' }) },
    { title: 'Nitrogen', text: 'About 35 grams of it, at nearly ten times the pressure outside. It fills the space above the powder and the gaps between its grains, and pushes on all of it.', node: 'nitrogen', position: at('gas_face'), explode: 0.6, camera: pose(at('gas_mid'), [-28, 8], 1.7, { card: 'right' }) },
    { title: 'Powder', text: 'Three kilograms of ABC powder, which is what actually puts the fire out: it stops the flames’ chemistry, and on wood or paper it melts at about 190 °C into a crust that keeps the air off.', node: 'powder', position: at('powder_face_at'), explode: 0.6, camera: pose(at('powder_top'), [-28, 12], 1.8, { card: 'right' }) },
    { title: 'Dip tube', text: 'Its mouth sits 12 mm off the bottom, in the powder. Upside down, it would be in the gas instead: the nitrogen would rush out in two or three seconds and leave the powder behind.', node: 'dip_tube', position: at('tube_face'), explode: 0.6, camera: pose(at('tube_mid'), [-24, 4], 1.8, { card: 'right' }) },
    { title: 'Safety pin', text: 'Pull it first: it runs through the handle and the lever and stops the lever moving. The plastic tie breaks as it comes out, so a used extinguisher can be told at a glance.', node: 'safety_pin', position: at('pin_back'), explode: 0, camera: pose(at('pin_back'), [-150, 18], 0.55, { card: 'left' }) },
    { title: 'Lever and valve', text: `Squeezing the lever turns it ${Math.round(LEVER)}° about its pin and pushes the stem ${STROKE} mm into the valve. That takes the seal off its seat, and the powder rushes past; let go and the spring and the pressure close it.`, node: 'squeeze_lever', position: at('lever_top'), explode: 0, camera: pose(at('head'), [-24, 14], 0.6, { card: 'right' }) },
    { title: 'Hose and nozzle', text: 'Aim at the base of the flames from about two and a half metres away and sweep from side to side. There are only about eleven seconds of powder.', node: 'nozzle', position: at('nozzle_face'), explode: 0, camera: pose(at('nozzle'), [-75, 6], 0.8, { card: 'left' }) },
  ],
  motion: [
    { node: 'squeeze_lever', axis: [0, 0, 1], pivot: pivot('lever'), control: 'ext_lever', turn: r3(-LEVER / 360) },
    { node: 'valve_stem', axis: [0, 1, 0], control: 'ext_lever', slide: [0, -U(STROKE), 0] },
    { node: 'valve_spring', axis: [0, 1, 0], control: 'ext_lever', slide: [0, -U((STROKE * 0.5) / TURNS), 0] },
    ...Array.from({ length: TURNS - 1 }, (_, i) => ({ node: `valve_spring_${i + 1}`, axis: [0, 1, 0], control: 'ext_lever', slide: [0, -U((STROKE * (i + 1)) / TURNS), 0] })),
    { node: 'safety_pin', axis: [0, 0, 1], control: 'ext_pin', slide: [0, 0, -U(H?.pin ?? 78)] },
    { node: 'gauge_needle', axis: [0, 0, 1], pivot: pivot('needle'), control: 'ext_bar', turn: r3(-DIAL.perBar / 360), from: DIAL.charge },
    ...powderMotions,
  ],
  how: [
    {
      label: 'The idea',
      title: 'Gas pushes, powder puts it out',
      text: [
        'Inside the red tank, nitrogen at nearly ten times the pressure of the air outside sits on top of 3.3 kg of powder. Open the valve and the gas drives the powder up a tube and out of the hose.',
        'Nothing has to be pumped, lit or switched on: the push was put in when it was filled, and it waits there for years.',
      ],
      angle: [-34, 10],
      fill: 0.82,
      focus: ['nitrogen', 'powder', 'dip_tube', 'valve_body', 'hose', 'nozzle'],
      flow: [at('gas_mid'), at('powder_top'), at('tube_foot'), at('tube_mid'), at('tube_top'), at('chamber'), at('outlet'), at('outlet_end'), at('hose_top'), at('hose_mid'), at('hose_low'), at('nozzle'), at('nozzle_tip'), at('jet')],
      tags: [
        { node: 'nitrogen', text: 'Nitrogen, 9.6 bar', at: at('gas_face') },
        { node: 'powder', text: 'Powder, 3.3 kg', at: at('powder_face_at') },
      ],
    },
    {
      label: 'Push',
      title: 'Thirty-five grams of gas',
      text: [
        'The nitrogen is a litre above the powder and nearly two more in the gaps between its grains: about 35 g of it, pressed to 9.6 bar. It is dry, because damp would cake the powder, and it is inert, so it can wait years without reacting with anything.',
        `The gauge reads it all the time. Green, from 7 to 9.8 bar, means ready; below that it has leaked. Warmth moves the needle too: ${atTemp(40).toFixed(1)} bar on a 40 °C day, ${atTemp(-20).toFixed(1)} at −20 °C, with nothing lost.`,
      ],
      angle: [-18, 8],
      fill: 0.8,
      focus: ['nitrogen', 'gauge', 'valve_body'],
      carries: 'air',
      flows: [
        [at('gas_mid'), at('powder_top')],
        [at('gas_mid'), at('spigot'), at('chamber'), at('gauge_tap'), { node: 'gauge', at: at('gauge') }],
      ],
      tags: [
        { node: 'gauge', text: `${DIAL.charge} bar`, at: at('gauge') },
        { node: 'nitrogen', text: '≈ 35 g of nitrogen', at: at('gas_face') },
      ],
    },
    {
      label: 'Up',
      title: 'Up the dip tube from the bottom',
      text: [
        'The gas presses down on the powder’s surface, and the only way out is the dip tube’s mouth, 12 mm off the bottom. Stirred into the gas, the powder flows like a liquid up the 13 mm tube and into the valve.',
        `So the powder comes out first and the gas behind it. About ${CHARGE.residualKg.toFixed(1)} kg below the tube’s mouth never gets out.`,
      ],
      angle: [-40, 6],
      fill: 0.8,
      focus: ['powder', 'dip_tube'],
      flow: [at('powder_top'), at('tube_foot'), at('tube_mid'), at('tube_top'), at('spigot')],
      tags: [
        { node: 'dip_tube', text: 'Dip tube, 13 mm', at: at('tube_face') },
        { node: 'dip_tube', text: 'Mouth, 12 mm off the bottom', at: at('tube_foot') },
      ],
    },
    {
      label: 'Valve',
      title: 'Pin out, lever down, seal open',
      text: [
        `The safety pin locks the lever. With it out, squeezing turns the lever ${Math.round(LEVER)}° about its pin at the back of the head, and the lever pushes the stem ${STROKE} mm down. The rubber seal on the stem’s foot leaves its seat and the powder rushes past to the hose.`,
        'Let go, and the spring and the tank’s own pressure push the seal back up: a burst can be stopped and started. Try it, and watch the stem and the spring.',
      ],
      angle: [-26, 12],
      fill: 0.78,
      focus: ['valve_stem', 'valve_spring', 'squeeze_lever', 'safety_pin'],
      frame: ['valve_body', 'squeeze_lever', 'safety_pin'],
      flow: [at('spigot'), at('chamber'), { node: 'valve_stem', at: at('seat') }, at('outlet'), at('outlet_end')],
      tags: [
        { node: 'valve_stem', text: 'Seal', at: at('seat') },
        { node: 'valve_spring', text: 'Spring', at: at('spring') },
        { node: 'safety_pin', text: 'Pin', at: at('pin_back') },
      ],
      try: 'discharge',
    },
    {
      label: 'Empty',
      title: 'The gas only pushes',
      text: [
        'The nitrogen leaves with the powder, so the pressure falls as the tank empties: from 9.6 bar to about 1 bar in eleven seconds, by when the powder has gone. Hold the lever and watch the needle drop and the level fall.',
        'It is easy to think the gas puts the fire out. It doesn’t: turn the extinguisher upside down and the dip tube’s mouth is in the gas, which rushes out in two or three seconds and leaves every gram of powder behind.',
      ],
      angle: [-30, 8],
      fill: 0.82,
      focus: ['powder', 'dip_tube', 'gauge', 'valve_body', 'squeeze_lever', 'valve_stem'],
      flow: [at('powder_top'), at('tube_foot'), at('tube_mid'), at('tube_top'), at('chamber'), at('outlet_end')],
      tags: [{ node: 'gauge', text: 'Gauge', at: at('gauge') }],
      chart: {
        type: 'extinguisher-discharge',
        title: 'Pressure as it empties',
        caption: 'The gauge against seconds with the lever held: upright the powder goes first and the pressure falls with it; upside down only the nitrogen comes out. The dot follows the model.',
      },
      try: 'squeeze',
    },
    {
      label: 'Out',
      title: 'Powder on the flames',
      text: [
        'At the nozzle the gas expands and throws the powder 4 to 6 m as a cloud. Aimed at the base of the flames and swept from side to side, it settles on the fuel and gets into the flames themselves.',
        'Monoammonium phosphate breaks the chain of reactions that keeps a flame alight, and on wood, paper or cloth it melts at about 190 °C into a sticky crust that keeps the air off. It doesn’t conduct, so it is safe on electrical fires: A, B and C.',
      ],
      angle: [-48, 6],
      fill: 0.82,
      focus: ['hose', 'nozzle', 'valve_body'],
      flow: [at('outlet_end'), at('hose_top'), at('hose_mid'), at('hose_low'), at('nozzle'), at('nozzle_tip'), at('jet')],
      tags: [{ node: 'nozzle', text: '4–6 m', at: at('nozzle_tip') }],
    },
  ],
  credit: polyHaven('korean_fire_extinguisher_01', 'Korean Fire Extinguisher 01', 'UM JOORIN', {
    label: 'Built for this site',
    text: 'The shell scaled to a real 3.3 kg extinguisher (141 mm across) and cut open; the nitrogen, the powder, the dip tube, the valve’s stem, seal, spring and passages, and the tamper seal. The discharge is a simple model: the gas stays at room temperature and leaves with the powder in a fixed proportion.',
  }),
  build: { augment: 'objects/fire-extinguisher/augment.mjs', hints: 'objects/fire-extinguisher/hints.json' },
});

function missing(name) {
  throw new Error(`objects/fire-extinguisher/hints.json has no "${name}": add it to the hints augment.mjs returns, then npm run models:build -- fire-extinguisher`);
}
