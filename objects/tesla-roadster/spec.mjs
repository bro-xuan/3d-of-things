// The Tesla Roadster as shown on 15 October 2026, in its Rocket trim: one seat, the passenger's place
// taken by an air tank, fans under the tail that suck it down onto the road and ten cold-gas
// thrusters round it. Tesla hasn't published its dimensions; these are measured off its press
// photographs (side, top and rear), scaled by the wheels (mm). The body is drawn in flat facets,
// like the Cybertruck it takes after.
export default {
  name: 'Roadster (2026)',
  facets: true,
  // The fenders' tops slope down inward to the windscreen's foot, below their outer crease.
  dropCrown: true,
  length: [-2030, 2210],
  wheelbase: 2800,
  track: [1580, 1560],
  wheels: { front: { rim: 20, width: 255, profile: 30 }, rear: { rim: 21, width: 325, profile: 30 } },
  // The lower body: a long pointed nose, flat sides leaning in a little, a beltline that climbs to the tail.
  bottom: [[2210, 140], [2100, 120], [1900, 108], [-1700, 105], [-1900, 130], [-2030, 230]],
  width: [[2210, 560], [2180, 700], [2120, 800], [2040, 855], [1880, 900], [1640, 925], [1400, 935], [1100, 930], [700, 912], [0, 885], [-600, 900], [-1000, 930], [-1250, 950], [-1700, 955], [-1900, 948], [-2000, 935], [-2030, 900]],
  shoulder: [[-2030, 0.45], [-1400, 0.4], [0, 0.35], [1400, 0.4], [2210, 0.45]],
  sill: [[-2030, 40], [-1400, 50], [0, 70], [1400, 50], [2210, 40]],
  roll: [[-2030, 20], [-1400, 40], [0, 45], [1400, 35], [2210, 20]],
  belt: [[2210, 445], [2100, 500], [1900, 592], [1700, 668], [1560, 712], [1400, 740], [1100, 738], [700, 735], [0, 742], [-500, 785], [-1000, 822], [-1400, 840], [-1800, 834], [-2030, 822]],
  crown: [[2210, 455], [2100, 505], [1900, 590], [1700, 645], [1560, 672], [1450, 705], [1400, 718], [1250, 735], [1100, 742], [700, 745], [0, 762], [-500, 808], [-1000, 848], [-1400, 866], [-1800, 860], [-2030, 845]],
  crownIn: [[2210, 60], [2000, 120], [1800, 220], [1560, 300], [1400, 200], [1200, 120], [1000, 70], [0, 60], [-900, 110], [-1400, 200], [-1800, 220], [-2030, 200]],
  lid: [[2210, 462], [2100, 505], [1900, 580], [1700, 635], [1560, 664], [1300, 712], [0, 760], [-1600, 862], [-1800, 858], [-2030, 846]],
  // The canopy: one long gold-tinted glass from the windscreen almost to the tail, painted down its
  // sides behind the doors (the sails) and at the A-pillars.
  span: [-1760, 1560],
  canopyOnCrown: true,
  roof: [[1560, 668], [1300, 770], [1000, 880], [700, 985], [400, 1075], [150, 1115], [0, 1125], [-300, 1122], [-600, 1100], [-900, 1065], [-1200, 1015], [-1450, 960], [-1760, 880]],
  roofWidth: [[1560, 560], [1300, 620], [800, 625], [0, 600], [-600, 570], [-1000, 530], [-1400, 480], [-1760, 440]],
  canopyPaint: [
    { z: [-1800, -950], from: 'footOut', inset: 0, to: 'header' },
    { z: [985, 1035], from: 'footOut', inset: 0, to: 'header', key: 'trim' },
  ],
  // Scissor doors; the deck behind the glass is the rear wing, which rises out of it.
  panels: { door: [-420, 990], bonnet: [1560, 2130], boot: [-2010, -1790], frontBumper: 2130, rearBumper: -1990 },
  wing: { rise: 380, pitch: -12 },
  // A light bar across the nose and another across the tail; the nose's lower edge black.
  lights: { head: { bar: [420, 442] }, tail: { bar: [790, 812] }, intake: { z: 2140, x: 760, rows: ['floor', 'lower'] } },
  // Openings through the skin: the tail's diffuser, where the fans and the rear nozzles are, and the nose's sides for the
  // yaw nozzles.
  openings: [
    { box: [[-640, 640], [95, 600], [-2100, -1760]] },
    { axis: 'x', at: [300, 1990], r: 60, range: [600, 1000] },
  ],
  // Carbon below this line along the sides (the sills, where the skirts are).
  trimLine: [[2210, 250], [1400, 245], [800, 250], [0, 270], [-500, 300], [-1000, 360], [-1400, 380], [-2030, 380]],
  paint: '#e7e5e0',
  finish: { metallic: 0.05, roughness: 0.42, clearcoat: 0.5 },
  glass: { colour: '#6b4f2c', metallic: 0.5, roughness: 0.06, transmission: 0.55 },
  rimColour: '#2a2c30',
  rimFinish: { metallic: 0.35, roughness: 0.45 },
  rims: { spokes: 6, style: 'disc', cover: '#e9e7e2' },
  caliperColour: '#1d1e20',
  springColour: '#c9a24a',
  seatColour: '#d9d7d2',
  armsInboard: { front: 330, rear: 500 },
  // A thick pack of 4680 cells in the floor (two layers: the seat sits on it).
  pack: { z: [-900, 980], half: 600, y: [105, 330], modules: [2, 5], cell: 46 },
  // Rear-wheel drive: a motor for each rear wheel, on the axle line and up out of the way of the fans' duct.
  motors: [
    { name: 'rear_motor_left', axle: 'rear', x: 140, y: 180, dz: 0, length: 190, gearSide: 1, wheels: ['left'] },
    { name: 'rear_motor_right', axle: 'rear', x: -140, y: 180, dz: 0, length: 190, gearSide: -1, wheels: ['right'] },
  ],
  // The suction system, the air store and the thrusters (aero.mjs).
  aero: {
    // The sealed floor between the skirts, and the duct from its back edge to the fans.
    seal: { z: [-998, 997], half: 770 },
    duct: { inlet: [-980, -900], half: 450, top: 300, z1: -1770 },
    fans: { x: [-465, -155, 155, 465], y: 275, r: 125, z: [-1960, -1800], blades: 9 },
    box: { half: 630, y: [110, 440], z: [-1990, -1770] },
    skirtDrop: 95,
    // Carbon tanks: one across the car behind the seat, one where a passenger would sit (litres from their sizes).
    tanks: [
      { name: 'tank_main', axis: 'x', at: [0, 690, -830], r: 350, length: 1160 },
      { name: 'tank_seat', axis: 'z', at: [-350, 615, 170], r: 270, length: 1220 },
    ],
    compressor: { at: [0, 270, 1880] },
    manifold: { at: [0, 650, -1210] },
    // The ten thrusters: nozzle exit, which way the jet goes, and its group.
    thrusters: [
      ...[-405, -135, 135, 405].map((x, i) => ({ name: `thruster_rear_${i + 1}`, group: 'rear', exit: [x, 520, -2022], jet: [0, 0, -1] })),
      ...[[700, 1870], [-700, 1870], [735, -1880], [-735, -1880]].map(([x, z], i) => ({ name: `thruster_down_${i + 1}`, group: 'down', exit: [x, 150, z], jet: [0, -1, 0] })),
      { name: 'thruster_yaw_left', group: 'yaw', exit: [785, 300, 1990], jet: [1, 0, 0] },
      { name: 'thruster_yaw_right', group: 'yaw', exit: [-785, 300, 1990], jet: [-1, 0, 0] },
    ],
  },
  cabin3d: {
    floor: { y: 340, half: 720, z: [-460, 1040] },
    dash: { y: 700, half: 680, z: 1050 },
    screen: { x: 0, y: 760, z: 880, w: 360, h: 220 },
    wheel: { at: [330, 640, 640], r: 165, tilt: 24, yoke: true },
    seats: [{ at: [330, 455, -160], width: 520, depth: 500, back: 620, recline: 24, head: false }],
  },
};
