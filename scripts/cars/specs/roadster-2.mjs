// The second Tesla Roadster, as shown in 2017: a low 2+2 with a removable glass roof. Tesla hasn't
// published its dimensions; these are estimates from the prototype's photographs (mm).
const arc = (tip, depth, w0, w1, n = 7) => Array.from({ length: n }, (_, i) => {
  // A bumper's plan: an arc from the tip back `depth` mm, from half-width w0 to w1.
  const t = i / (n - 1);
  return [tip - Math.sign(tip) * depth * (1 - Math.cos((t * Math.PI) / 2)), w0 + (w1 - w0) * Math.sin((t * Math.PI) / 2)];
});
export default {
  name: 'Roadster (2017)',
  length: [-2190, 2190],
  wheelbase: 2650,
  track: [1690, 1650],
  wheels: { front: { rim: 19, width: 245, profile: 35 }, rear: { rim: 20, width: 325, profile: 30 } },
  // The lower body.
  bottom: [[2190, 330], [2165, 210], [2080, 145], [1800, 118], [-1750, 118], [-2080, 240], [-2190, 440]],
  width: [...arc(2190, 420, 330, 935), [1700, 965], [1325, 990], [900, 955], [0, 918], [-800, 975], [-1325, 1015], [-1800, 995], ...arc(-2190, 330, 600, 930).reverse()],
  shoulder: [[-2190, 0.5], [-1325, 0.55], [0, 0.42], [1325, 0.5], [2190, 0.45]],
  sill: [[-2190, 50], [-1325, 60], [-700, 120], [0, 135], [700, 120], [1325, 60], [2190, 50]],
  roll: [[-2190, 40], [-1325, 70], [0, 60], [1325, 60], [2190, 30]],
  belt: [[2190, 370], [2100, 445], [1900, 520], [1600, 590], [1300, 655], [1000, 700], [600, 755], [0, 788], [-800, 815], [-1400, 840], [-1900, 845], [-2190, 835]],
  crown: [[2190, 380], [2120, 505], [1900, 640], [1500, 745], [1325, 765], [1000, 760], [0, 800], [-900, 865], [-1325, 905], [-1750, 890], [-2100, 870], [-2190, 845]],
  crownIn: [[2190, 40], [1700, 130], [1325, 160], [700, 170], [0, 160], [-800, 205], [-1325, 230], [-1900, 160], [-2190, 90]],
  lid: [[2190, 350], [2160, 420], [2080, 480], [1900, 545], [1600, 610], [1250, 670], [1050, 700], [600, 760], [0, 790], [-900, 840], [-1500, 900], [-1800, 905], [-2100, 885], [-2190, 840]],
  // The canopy: windscreen foot at the scuttle, rear glass foot on the deck.
  span: [-1520, 1080],
  foot: [[1080, 690], [800, 735], [0, 780], [-900, 830], [-1520, 890]],
  footWidth: [[1080, 690], [600, 735], [0, 760], [-800, 760], [-1200, 680], [-1520, 520]],
  glassBase: [[1080, 690], [900, 760], [600, 800], [0, 815], [-900, 850], [-1300, 880], [-1520, 892]],
  glassWidth: [[1080, 680], [600, 728], [0, 748], [-800, 748], [-1200, 670], [-1520, 510]],
  roof: [[1080, 696], [900, 790], [600, 935], [200, 1090], [-250, 1148], [-650, 1130], [-1050, 1050], [-1350, 960], [-1520, 896]],
  roofWidth: [[1080, 670], [700, 650], [0, 590], [-600, 560], [-1100, 470], [-1520, 380]],
  // Panels that come off, as z ranges along the car; seams run along the loft's stations and rows.
  panels: { door: [-380, 930], bonnet: [1130, 2040], boot: [-2050, -1580], frontBumper: 2030, rearBumper: -2070, roof: [-560, 150] },
  lights: { head: { z: 1890, x: 420, rows: ['roll', 'crown'] }, tail: { z: -2090, rows: ['belt', 'crown'] }, intake: { z: 2040, x: 720, rows: ['floor', 'side'] } },
  paint: '#9e0b0f',
  armsInboard: { front: 330, rear: 500 },
  rimColour: '#3b3e43',
  rims: { spokes: 10, style: 'split' },
  // The battery in the floor and the three motors: one in front, one for each rear wheel.
  pack: { z: [-1010, 1000], half: 640, y: [128, 250], modules: [4, 8], cell: 22 },
  motors: [
    { name: 'front_motor', axle: 'front', x: 0, gearSide: 1 },
    { name: 'rear_motor_left', axle: 'rear', x: 190, y: 40, length: 220, gearSide: 1, wheels: ['left'] },
    { name: 'rear_motor_right', axle: 'rear', x: -190, y: 40, length: 220, gearSide: -1, wheels: ['right'] },
  ],
  cabin3d: {
    floor: { y: 255, half: 690, z: [-1090, 880] },
    dash: { y: 720, half: 640, z: 760 },
    screen: { x: 0, y: 770, z: 600, w: 330, h: 210 },
    wheel: { at: [340, 690, 470], r: 175, tilt: 22 },
    seats: [
      { at: [330, 360, -110], width: 520, depth: 520, back: 560, recline: 24 },
      { at: [-330, 360, -110], width: 520, depth: 520, back: 560, recline: 24 },
      { at: [300, 400, -860], width: 440, depth: 380, back: 470, recline: 18, head: false },
      { at: [-300, 400, -860], width: 440, depth: 380, back: 470, recline: 18, head: false },
    ],
  },
};
