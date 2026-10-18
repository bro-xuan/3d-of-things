// Writes content/washing-machine.json: the page's text, and where the build put things
// (objects/washing-machine/hints.json, written by `npm run models:build -- washing-machine`), so no
// model-space number is pasted by hand. Run it after every build:
//   node objects/washing-machine/content.mjs
import { builtInCode, readHints, space, writeContent } from '../../scripts/kit/content.mjs';

const H = readHints('washing-machine');
const { U, pose } = space(H);
/** A named point from the build (model space). Before the first build there are none yet, so a placeholder. */
const at = (name) => H?.anchors?.[name] ?? (H ? missing(name) : [0, 0.5, 0]);
const pivot = (name) => H?.pivots?.[name] ?? (H ? missing(name) : [0, 0.5, 0]);
const RATIO = H?.ratio ?? 10.77;
/** Turns a second at a drum speed in rpm. */
const tps = (rpm) => +(rpm / 60).toFixed(3);
/** g at the drum's wall at a speed in rpm. */
const g = (rpm) => +(((rpm * Math.PI) / 30) ** 2 * ((H?.drumRadius ?? 235) / 1000) / 9.81).toFixed(rpm < 100 ? 2 : 0);
const WASH = 54;
/** A part that comes off along a direction, over a window of the slider. */
const off = (direction, mm, window) => ({ direction, distance: U(mm), window });

writeContent('washing-machine', {
  order: 11,
  title: 'Washing Machine',
  hook: 'Washes by dropping your clothes about fifty times a minute, then spins at 1,400 to throw the water out.',
  category: 'home',
  summary: [
    'Getting dirt out of cloth takes four things: something to loosen it, heat, time and movement. A washing machine brings all four, and the movement is the clever part: the clothes are washed by falling.',
    'A valve lets water in through the detergent drawer, and a heater under the drum warms it. A motor under the tub turns the drum through a belt, three ridges inside lift the clothes, and the tub that holds the water hangs on springs, stands on dampers and carries a block of concrete. A pump empties it.',
    'Below about 60 turns a minute the clothes tumble through the water; above that they are pinned to the drum’s wall, which is what spinning uses to fling the water out through the holes. On this model the drum, the belt and the motor turn at their real ratio.',
  ],
  model: 'models/washing-machine.glb',
  viewAngle: [-30, 14],
  explodeAngle: [-38, 18],
  explodeDuration: 3000,
  facts: [
    { label: 'Load', value: '8 kg of dry washing' },
    { label: 'Drum', value: `${Math.round(H?.drumLitres ?? 57)} litres, 47 cm across` },
    { label: 'Spin', value: 'up to 1,400 rpm' },
    { label: 'Belt', value: `motor turns ${RATIO.toFixed(1)}× faster` },
    { label: 'Real size', value: '60 × 85 × 60 cm' },
  ],
  // In the order the energy goes, grouped. The panels come off first, the drum last.
  parts: [
    { node: 'fascia', label: 'Control panel', group: 'Controls', about: 'The programme dial and the display. Behind it a circuit board runs the programme: when to open the valve, heat, turn the drum and pump.', ...off([0, 0, 1], 450, [0.22, 0.42]) },
    { node: 'control_board', label: 'Control board', group: 'Controls', about: 'The machine’s timer: it reads the water level and temperature and switches the valve, the heater, the motor and the pump in turn.', ...off([0, 1, 0], 160, [0.4, 0.55]) },
    { node: 'inlet_valve', label: 'Inlet valve', group: 'Water in', about: 'Two electric valves on the cold supply. Each one feeds a different compartment of the drawer, so the right powder goes in at the right time.', direction: [0, 1, 0], distance: 0 },
    { node: 'drawer', label: 'Detergent drawer', group: 'Water in', about: 'Three compartments: prewash, main wash and softener. Water from the valve sluices one out at a time, down into the tub.', ...off([0, 0, 1], 380, [0.03, 0.2]) },
    { node: 'dispenser', label: 'Drawer housing', group: 'Water in', about: 'The box the drawer slides into. Water runs out of its back, down a wide hose into the top of the tub.', ...off([0, 1, 0], 250, [0.22, 0.4]) },
    { node: 'hoses', label: 'Hoses', group: 'Water in', about: 'Valve to drawer, drawer to tub, tub to pump and pump to the drain. The drain hose rises above the water level before it leaves, so the tub can’t siphon itself empty.', direction: [0, 1, 0], distance: 0 },
    { node: 'heater', label: 'Heater', group: 'Water in', about: 'A 2 kW element in the sump, under the drum, where the water lies. A sensor beside it tells the board when the water is warm enough.', direction: [0, 0, 1], distance: 0 },
    { node: 'motor', label: 'Motor', group: 'Drive', about: 'A small, fast motor bolted under the tub, so it swings with it. Carbon brushes feed its spinning coils.', direction: [0, 1, 0], distance: 0 },
    { node: 'motor_rotor', label: 'Motor’s rotor', group: 'Drive', about: `The part that turns, with a small pulley on its end. It runs about ${RATIO.toFixed(1)} times as fast as the drum.`, direction: [0, 1, 0], distance: 0 },
    { node: 'belt', label: 'Belt', group: 'Drive', about: 'A ribbed rubber belt from the motor’s small pulley to the drum’s big one: a gearbox in one part.', direction: [0, 1, 0], distance: 0 },
    { node: 'pulley', label: 'Drum pulley', group: 'Drive', about: 'Bolted to the end of the drum’s shaft, behind the tub. Its size against the motor’s pulley sets the ratio.', direction: [0, 1, 0], distance: 0 },
    { node: 'drum', label: 'Drum', group: 'Drum', about: 'Stainless steel, punched with small holes. Water gets in and out through them; clothes can’t.', ...off([0, 0, 1], 280, [0.74, 0.96]) },
    { node: 'spider', label: 'Spider and shaft', group: 'Drum', about: 'A three-armed aluminium casting on the drum’s back, with the steel shaft that runs through the tub’s bearings to the pulley.', direction: [0, 0, 1], distance: 0 },
    { node: 'tub_front', label: 'Tub, front half', group: 'Suspension', about: 'The outer drum that holds the water. It doesn’t turn, but it swings on its springs. The sump and the heater are in its bottom.', ...off([0, 0, 1], 460, [0.5, 0.72]) },
    { node: 'tub_rear', label: 'Tub, back half', group: 'Suspension', about: 'Carries the bearings in its hub, the motor underneath and the springs’ lugs on top.', direction: [0, 1, 0], distance: 0 },
    { node: 'bearings', label: 'Bearings', group: 'Suspension', about: 'Two ball bearings in the tub’s hub carry the drum’s shaft, sealed against the water inside.', direction: [0, 1, 0], distance: 0 },
    { node: 'springs', label: 'Springs', group: 'Suspension', about: 'The tub hangs from the cabinet’s top on two springs. They let it swing a few millimetres while the drum spins, so the cabinet doesn’t.', direction: [0, 1, 0], distance: 0 },
    { node: 'dampers', label: 'Dampers', group: 'Suspension', about: 'Two friction struts under the tub. They soak up the swinging, most of all as the drum speeds up through the speed where the tub would rock hardest.', direction: [0, 1, 0], distance: 0 },
    { node: 'counterweight', label: 'Counterweight', group: 'Suspension', about: 'A block of concrete on the tub’s top, about 12.5 kg. It makes the swinging mass heavy, so an uneven load shakes it less.', ...off([0, 1, 0], 230, [0.42, 0.58]) },
    { node: 'front_weight', label: 'Front counterweight', group: 'Suspension', about: 'A second block round the tub’s mouth, about 12.5 kg, which also brings the swinging mass’s centre forward, under the door.', direction: [0, 0, 1], distance: 0 },
    { node: 'bellows', label: 'Door seal', group: 'Suspension', about: 'A rubber bellows from the tub’s mouth to the cabinet’s front. It keeps the water in and lets the tub move while the cabinet stands still.', ...off([0, 0, 1], 520, [0.44, 0.66]) },
    { node: 'drain_pump', label: 'Drain pump', group: 'Water out', about: 'A small pump under the front, with a filter you can unscrew behind the flap to catch coins and buttons.', ...off([0, 0, 1], 250, [0.5, 0.7]) },
    { node: 'pump_impeller', label: 'Impeller', group: 'Water out', about: 'Four vanes spun by the pump’s motor fling the water out to the drain hose.', direction: [0, 0, 1], distance: 0 },
    { node: 'door', label: 'Door', group: 'Cabinet', about: 'Its glass bowl reaches back into the seal and presses against it, so the water stays in the drum.', ...off([0, 0, 1], 140, [0.1, 0.32]), then: { direction: [1, 0, 0.2], distance: U(600) } },
    { node: 'front_panel', label: 'Front panel', group: 'Cabinet', about: 'Enamelled steel with the door’s opening and the pump’s flap.', ...off([0, 0, 1], 570, [0.22, 0.42]) },
    { node: 'top_lid', label: 'Worktop', group: 'Cabinet', about: 'Two screws at the back hold it; it is the first thing off in a repair.', ...off([0, 1, 0], 300, [0, 0.18]) },
    { node: 'side_left', label: 'Left side', group: 'Cabinet', about: 'Enamelled sheet steel on a frame.', ...off([-1, 0, 0], 330, [0, 0.18]) },
    { node: 'side_right', label: 'Right side', group: 'Cabinet', about: 'Enamelled sheet steel on a frame.', ...off([1, 0, 0], 330, [0, 0.18]) },
    { node: 'back_panel', label: 'Back panel', group: 'Cabinet', about: 'The water and the drain hose pass through it.', ...off([0, 0, -1], 330, [0, 0.18]) },
    { node: 'frame', label: 'Frame', group: 'Cabinet', about: 'A base with four corner posts and two top rails, from which the springs hang.', direction: [0, 1, 0], distance: 0 },
  ],
  annotations: [
    { title: 'Detergent drawer', text: 'Water from the valve runs through one compartment at a time and carries its powder down into the tub: prewash, main wash, then softener for the last rinse.', node: 'drawer', position: at('drawer'), camera: pose(at('drawer'), [-28, 24], 0.75) },
    { title: 'Door and seal', text: 'The glass bowl reaches back into a rubber bellows and presses on it. The bellows keeps the water in while letting the tub swing on its springs.', node: 'door', position: at('door'), camera: pose(at('door'), [-22, 8], 1.1) },
    { title: 'Drum and lifters', text: 'Three ridges inside lift the clothes as the drum turns and drop them back into the water. That fall, over and over, is most of the washing.', node: 'drum', position: at('lifter'), explode: 0.73, camera: pose(at('drum_centre'), [-20, 12], 0.62) },
    { title: 'Heater', text: 'A 2 kW element lies in the sump under the drum, where the water collects. Warming the water itself from 15 to 40 °C takes about ten minutes; with the clothes, drum and tub soaking up heat as well, nearer twenty.', node: 'heater', position: at('heater_flange'), explode: 0.42, camera: pose(at('heater_flange'), [-26, 8], 0.8) },
    { title: 'Motor and belt', text: `A small fast motor under the tub drives the drum through a belt. Its pulley is ${RATIO.toFixed(1)} times smaller than the drum’s, so at 1,400 rpm on the drum the motor runs at about 15,000.`, node: 'motor', position: at('motor_side'), explode: 0.2, camera: pose(at('motor'), [-120, -10], 0.8) },
    { title: 'Springs and dampers', text: 'The tub hangs on two springs and stands on two friction dampers. Together they let it shake a few millimetres while the cabinet stays put.', node: 'springs', position: at('damper_left'), explode: 0.73, camera: pose(at('suspension_left'), [-35, 8], 1.8) },
    { title: 'Counterweight', text: 'About 25 kg of concrete in two blocks, on top and round the front. It doesn’t hold the machine down: it rides on the springs with the tub and makes it heavy, so a lopsided load moves it less.', node: 'counterweight', position: at('counterweight'), explode: 0.42, camera: pose(at('counterweight'), [-80, 35], 1.8) },
    { title: 'Drain pump', text: 'A small pump under the front empties the tub between washes and during the spin. The filter behind the flap catches coins, buttons and hair grips before they reach it.', node: 'drain_pump', position: at('pump'), explode: 0.42, camera: pose(at('pump'), [24, 14], 0.85) },
  ],
  motion: [
    { node: 'drum', axis: [0, 0, 1], pivot: pivot('drum'), speed: tps(WASH) },
    { node: 'pulley', axis: [0, 0, 1], pivot: pivot('drum'), speed: tps(WASH) },
    { node: 'motor_rotor', axis: [0, 0, 1], pivot: pivot('motor'), speed: +(tps(WASH) * RATIO).toFixed(3) },
    { node: 'pump_impeller', axis: [0, 0, 1], pivot: pivot('impeller'), speed: 3 },
  ],
  motionLabel: 'Run the drum',
  how: [
    {
      label: 'The idea',
      title: 'Washed by falling',
      text: [
        'A wash needs four things: detergent to loosen the dirt, heat, time, and movement to work the water through the cloth. The machine supplies them one after another, under the board’s control.',
        'The movement comes from the drum. Turning slowly, about ten seconds one way, a pause, then ten seconds the other, its three ridges carry the clothes up the side and let them fall back through the water.',
      ],
      angle: [-26, 16],
      focus: ['drum', 'spider', 'tub_front', 'tub_rear'],
      tags: [{ node: 'drum', text: `${Math.round(H?.drumLitres ?? 57)} litre drum`, at: at('drum_top') }],
      chart: {
        type: 'timing',
        title: 'A 40 °C cotton wash',
        caption: 'Roughly what the board switches, and when, over about two and a half hours.',
        lanes: [
          { name: 'Water in', points: [[0, 0], [0.01, 1], [0.05, 1], [0.06, 0], [0.56, 0], [0.57, 1], [0.6, 1], [0.61, 0], [0.7, 0], [0.71, 1], [0.74, 1], [0.75, 0], [1, 0]] },
          { name: 'Heater', points: [[0, 0], [0.06, 0], [0.07, 1], [0.2, 1], [0.21, 0], [1, 0]] },
          { name: 'Drum', points: [[0, 0.3], [0.54, 0.3], [0.55, 0.15], [0.57, 0.3], [0.68, 0.3], [0.69, 0.15], [0.71, 0.3], [0.82, 0.3], [0.83, 0.45], [0.86, 0.45], [0.88, 1], [0.97, 1], [1, 0]], notes: [[0.3, 'tumble'], [0.92, 'spin']] },
          { name: 'Pump', points: [[0, 0], [0.54, 0], [0.55, 1], [0.57, 0], [0.68, 0], [0.69, 1], [0.71, 0], [0.82, 0], [0.83, 1], [0.98, 1], [0.99, 0], [1, 0]] },
        ],
        bands: [[0.88, 0.97, 'spin']],
      },
    },
    {
      label: 'Water in',
      title: 'In through the drawer',
      text: [
        'The board opens an inlet valve. Mains pressure pushes water through the drawer, through whichever compartment that valve feeds, and the powder goes down the hose with it into the tub.',
        'A pressure sensor on a thin tube from the sump feels the water’s depth and closes the valve. A wash uses about 12 litres at a time; the whole programme about 45.',
      ],
      angle: [-34, 22],
      focus: ['inlet_valve', 'hoses', 'dispenser', 'drawer'],
      carries: 'water',
      flow: [at('valve_in'), at('valve'), at('fill_top'), at('dispenser_in'), at('dispenser'), at('dispenser_out'), at('tub_inlet')],
      tags: [
        { node: 'inlet_valve', text: 'Inlet valve', at: at('valve') },
        { node: 'drawer', text: 'Main wash compartment', at: at('drawer') },
      ],
    },
    {
      label: 'Heat',
      title: 'Heated in the sump',
      text: [
        'The heater lies in the sump, the pocket at the bottom of the tub where the water collects under the drum. A sensor beside it reports the temperature to the board, which switches the heater off when the water is warm enough.',
        'Heating takes most of a wash’s electricity: warming 12 litres by 25 degrees takes about 1.3 MJ, a third of a kilowatt-hour. A 90 °C wash needs three times as much.',
      ],
      angle: [-18, 10],
      fill: 0.7,
      focus: ['heater'],
      frame: ['tub_front'],
      tags: [{ node: 'heater', text: '2 kW element', at: at('heater') }],
      chart: {
        type: 'bars',
        title: 'Minutes to heat the water',
        caption: 'Twelve litres from 15 °C with a 2 kW heater, ignoring what the drum and tub soak up.',
        unit: 'Minutes',
        bars: [
          { label: '30 °C', value: 6.3 },
          { label: '40 °C', value: 10.5 },
          { label: '60 °C', value: 18.8 },
          { label: '90 °C', value: 31.4 },
        ],
        picked: 1,
      },
    },
    {
      label: 'Drive',
      title: 'A belt for a gearbox',
      text: [
        `The motor under the tub turns fast and weakly; the drum needs to turn slowly and hard. A belt from the motor’s small pulley to the drum’s big one trades one for the other: the motor turns ${RATIO.toFixed(1)} times for each turn of the drum.`,
        'Hold the button and count. At the full 1,400 rpm spin the motor is doing about 15,000.',
      ],
      angle: [-150, 14],
      fill: 0.72,
      focus: ['motor', 'motor_rotor', 'belt', 'pulley', 'spider'],
      flow: [at('motor_side'), at('motor_pulley'), at('belt_mid'), at('pulley_side'), at('shaft')],
      tags: [
        { node: 'motor_rotor', text: 'Motor', at: at('motor') },
        { node: 'pulley', text: 'Drum pulley', at: at('pulley') },
      ],
      chart: {
        type: 'ladder',
        title: 'Turns a minute, motor to drum',
        caption: `The belt divides the motor’s speed by ${RATIO.toFixed(1)}: the dials turn with the motor and the drum.`,
        unit: 'Turns a minute at full spin',
        ticks: [0, 5000, 10000, 15000],
        rungs: [
          { name: 'Motor', value: Math.round(1400 * RATIO), note: `${Math.round(1400 * RATIO).toLocaleString('en-GB')} rpm`, node: 'motor_rotor' },
          { name: 'Drum', value: 1400, note: '1,400 rpm', step: `÷${RATIO.toFixed(1)}`, node: 'drum' },
        ],
      },
      try: 'run',
      count: [{ node: 'motor_rotor', label: 'Motor' }, { node: 'drum', label: 'Drum' }],
    },
    {
      label: 'Tumble or spin',
      title: 'Below 62 rpm it washes, above it it spins',
      text: [
        `At ${WASH} rpm the clothes ride up the side and fall off before the top: the drum’s wall pushes them round with less than their own weight. At about 62 rpm it pushes with exactly their weight, and from there up they stay pinned to the wall and stop moving.`,
        `That is why spinning doesn’t wash. Its job is the opposite: at 1,400 rpm the wall presses the clothes outward with about ${g(1400)} times their weight, and the water, free to move, flies out through the holes. Pick a speed.`,
      ],
      angle: [-12, 8],
      fill: 0.8,
      rate: 0.15,
      focus: ['drum', 'spider'],
      tags: [{ node: 'drum', text: 'Lifter', at: at('lifter') }],
      chart: {
        type: 'ladder',
        title: 'How hard the wall pushes',
        caption: 'Times the clothes’ own weight, at the drum’s wall; above 1 they can’t fall.',
        unit: 'Times their weight (g)',
        scale: 'log',
        rungs: [
          { name: `${WASH} rpm`, value: g(WASH), note: `${g(WASH)} g` },
          { name: '90 rpm', value: g(90), note: `${g(90)} g` },
          { name: '800 rpm', value: g(800), note: `${g(800)} g` },
          { name: '1,400 rpm', value: g(1400), note: `${g(1400)} g` },
        ],
      },
      try: 'speeds',
      spin: ['drum', 'pulley', 'motor_rotor'],
      speeds: [
        { label: `${WASH} rpm`, factor: 1, note: 'Washing: the clothes are lifted and fall back through the water.' },
        { label: '90 rpm', factor: 90 / WASH, note: 'Spreading the load: pinned to the wall, the clothes settle evenly before the spin.' },
        { label: '800 rpm', factor: 800 / WASH, note: 'Spinning: 168 times their weight presses the water out through the holes.' },
        { label: '1,400 rpm', factor: 1400 / WASH, note: 'Full spin: about 500 times their weight. Shown slowed down.' },
      ],
    },
    {
      label: 'Suspension',
      title: 'A heavy tub on springs',
      text: [
        'A load is never quite even. Half a kilo of wet jeans off-centre at 1,400 rpm pulls on the tub with about 2,500 newtons, a quarter of a tonne, changing direction 23 times a second. The tub hangs on springs and stands on dampers so that it can swing instead of the cabinet.',
        'The concrete is there for that swing, not to hold the machine down: once the drum is turning fast, the tub moves by about the off-centre mass times its distance divided by the whole swinging mass. Make the tub heavier and it shakes less.',
      ],
      angle: [-48, 14],
      fill: 0.75,
      focus: ['springs', 'dampers', 'counterweight', 'front_weight', 'tub_front', 'tub_rear'],
      tags: [
        { node: 'springs', text: 'Spring', at: at('spring_left') },
        { node: 'dampers', text: 'Damper', at: at('damper_left') },
        { node: 'counterweight', text: 'Concrete', at: at('counterweight') },
      ],
      chart: {
        type: 'bars',
        title: 'How far the tub shakes at full spin',
        caption: 'Half a kilo off-centre on a 23.5 cm drum, with the wet washing; the tub, drum and motor weigh about 20 kg.',
        unit: 'Shake, mm',
        bars: [
          { label: 'No concrete', value: 3.7, note: '32 kg swinging' },
          { label: 'With 25 kg', value: 2.1, note: '57 kg swinging' },
        ],
        picked: 1,
      },
    },
    {
      label: 'Water out',
      title: 'Pumped out, then spun',
      text: [
        'Between stages and all through the spin, the pump under the front empties the sump. It pushes the water up the hose to above the tub’s water line before it drops to the drain, so nothing siphons out while the machine fills.',
        'The faster the spin, the less water stays in the clothes, and the less the dryer or the washing line has to do. Spin speed is on the energy label for that reason.',
      ],
      angle: [38, 10],
      fill: 0.75,
      focus: ['drain_pump', 'pump_impeller', 'hoses', 'tub_front'],
      carries: 'water',
      flow: [at('sump'), at('pump'), at('pump_out'), at('drain_low'), at('drain_back'), at('drain_top')],
      tags: [
        { node: 'drain_pump', text: 'Drain pump', at: at('pump') },
        { node: 'drain_pump', text: 'Filter', at: at('pump_filter') },
      ],
      chart: {
        type: 'bars',
        title: 'Water left in the clothes',
        caption: 'As a share of their dry weight, after the spin; typical figures, and makers quote 52–54 % at 1,400.',
        unit: '% of dry weight',
        bars: [
          { label: '800', value: 75 },
          { label: '1,000', value: 62 },
          { label: '1,200', value: 57 },
          { label: '1,400', value: 53 },
        ],
        picked: 3,
      },
    },
  ],
  credit: builtInCode('Washing machine, a typical European front-loader', 'Laid out from manufacturers’ published dimensions, service manuals and spare-parts drawings for 7 kg, 1,400 rpm belt-driven machines; no particular make.'),
  build: { generate: 'objects/washing-machine/generate.mjs', hints: 'objects/washing-machine/hints.json' },
});

function missing(name) {
  throw new Error(`objects/washing-machine/hints.json has no "${name}": add it to the hints generate.mjs returns, then npm run models:build -- washing-machine`);
}
