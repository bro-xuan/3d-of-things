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
/** The drum's speed washing, and spinning (rpm). */
const WASH = 54;
const SPIN = 1400;
/** A part that comes off along a direction, over a window of the slider. */
const off = (direction, mm, window) => ({ direction, distance: U(mm), window });

/** What stays solid through the film: the drum and everything that turns it, and the pump's impeller. The cabinet, the
 *  tub, the motor's casing and the pump's body are glass, so the drive and the drum can be seen working inside. */
const MOVING = ['drum', 'spider', 'pulley', 'belt', 'motor_rotor', 'pump_impeller'];
/** Every shot is framed on the whole cabinet, so the camera stays at one distance and only goes round. */
const CABINET = ['frame'];
/** The water's way in, from the valve through the drawer to the tub; and out, from the sump through the pump to the drain. */
const waterIn = [at('valve_in'), at('valve'), at('fill_top'), at('dispenser_in'), at('dispenser'), at('dispenser_out'), at('tub_inlet')];
const waterOut = [at('sump'), at('pump'), at('pump_out'), at('drain_low'), at('drain_back'), at('drain_top')];
/** The power's path: from the motor, round the belt to the drum's pulley and in along its shaft. */
const powerPath = [at('motor_side'), at('motor_pulley'), at('belt_mid'), at('pulley_side'), at('shaft')];
/** On spin the drum, its pulley and the motor turn this many times faster than washing, shown at this much of real time. */
const spinning = +(SPIN / WASH).toFixed(3);
const SPIN_RATE = 0.15;

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
  // "How it works" as an animation: water in, the motor turning the drum through the belt, the wash, then the spin.
  film: [
    {
      chapter: 'Fill',
      caption: 'Water from the valve runs through the detergent drawer and carries the powder into the tub.',
      duration: 5,
      angle: [165, 34],
      fill: 0.6,
      run: false,
      focus: MOVING,
      frame: CABINET,
      carries: 'water',
      flow: waterIn,
      tags: [
        { node: 'inlet_valve', text: 'inlet valve', at: at('valve') },
        { node: 'drawer', text: 'drawer', at: at('drawer') },
      ],
    },
    {
      chapter: 'Wash',
      caption: `The motor under the tub drives the drum by a belt, turning ${RATIO.toFixed(1)} times for each turn of the drum.`,
      duration: 6,
      angle: [140, 12],
      fill: 0.6,
      spin: { pump_impeller: 0 },
      focus: MOVING,
      frame: CABINET,
      flow: powerPath,
      tags: [
        { node: 'motor_rotor', text: 'motor', at: at('motor') },
        { node: 'pulley', text: 'drum pulley', at: at('pulley') },
      ],
    },
    {
      chapter: 'Wash',
      caption: `At ${WASH} rpm its three ridges lift the clothes up the side and drop them back through the water.`,
      duration: 6,
      angle: [80, 14],
      fill: 0.6,
      spin: { pump_impeller: 0 },
      focus: MOVING,
      frame: CABINET,
      tags: [{ node: 'drum', text: 'ridge', at: at('lifter') }],
    },
    {
      chapter: 'Spin',
      caption: `At ${SPIN.toLocaleString('en-GB')} rpm the water flies out through the holes, and the pump sends it down the drain.`,
      duration: 6,
      angle: [30, 10],
      fill: 0.6,
      rate: SPIN_RATE,
      spin: { drum: spinning, pulley: spinning, motor_rotor: spinning, pump_impeller: +(1 / SPIN_RATE).toFixed(3) },
      focus: MOVING,
      frame: CABINET,
      carries: 'water',
      flow: waterOut,
      tags: [{ node: 'drain_pump', text: 'drain pump', at: at('pump') }],
    },
  ],
  credit: builtInCode('Washing machine, a typical European front-loader', 'Laid out from manufacturers’ published dimensions, service manuals and spare-parts drawings for 7 kg, 1,400 rpm belt-driven machines; no particular make.'),
  build: { generate: 'objects/washing-machine/generate.mjs', hints: 'objects/washing-machine/hints.json' },
});

function missing(name) {
  throw new Error(`objects/washing-machine/hints.json has no "${name}": add it to the hints generate.mjs returns, then npm run models:build -- washing-machine`);
}
