// A family car of no particular make, as most were built for most of the 20th century: a three-box saloon
// with a petrol engine at the front driving the rear wheels through a gearbox, a propshaft and a
// differential in a live rear axle. Proportions of a typical 1970s–80s saloon (mm).
const arc = (tip, depth, w0, w1, n = 7) => Array.from({ length: n }, (_, i) => {
  const t = i / (n - 1);
  return [tip - Math.sign(tip) * depth * (1 - Math.cos((t * Math.PI) / 2)), w0 + (w1 - w0) * Math.sin((t * Math.PI) / 2)];
});
export default {
  name: 'Family car',
  length: [-2250, 2250],
  wheelbase: 2650,
  track: [1440, 1440],
  wheels: { front: { rim: 14, width: 185, profile: 70 }, rear: { rim: 14, width: 185, profile: 70 } },
  // The lower body: slab sides with a crisp shoulder, a flat bonnet and boot, upright ends.
  bottom: [[2250, 330], [2220, 230], [2120, 165], [1900, 150], [-1900, 150], [-2120, 175], [-2220, 240], [-2250, 330]],
  width: [...arc(2250, 140, 780, 860), [1325, 862], [0, 860], [-1325, 862], ...arc(-2250, 140, 790, 860).reverse()],
  shoulder: [[-2250, 0.6], [2250, 0.6]],
  sill: [[-2250, 40], [-1325, 45], [0, 70], [1325, 45], [2250, 40]],
  roll: [[-2250, 25], [2250, 25]],
  belt: [[2250, 760], [2100, 770], [1325, 790], [1000, 800], [0, 815], [-1325, 830], [-2250, 820]],
  crown: [[2250, 766], [2100, 776], [1325, 796], [1000, 806], [0, 821], [-1325, 836], [-2250, 826]],
  crownIn: [[-2250, 35], [2250, 35]],
  lid: [[2250, 775], [2150, 790], [1800, 805], [1300, 818], [1050, 830], [0, 840], [-1250, 870], [-1600, 875], [-2100, 870], [-2250, 845]],
  creases: ['belt', 'crown'],
  // The canopy: a steel roof on pillars, glass only in the windows.
  span: [-1250, 1000],
  foot: [[1000, 828], [500, 835], [0, 838], [-700, 850], [-1250, 866]],
  footWidth: [[1000, 790], [0, 815], [-1250, 790]],
  glassBase: [[1000, 832], [500, 840], [0, 843], [-700, 855], [-1250, 870]],
  glassWidth: [[1000, 780], [0, 805], [-1250, 780]],
  roof: [[1000, 836], [800, 1000], [550, 1210], [350, 1360], [200, 1395], [0, 1400], [-500, 1398], [-750, 1370], [-950, 1200], [-1150, 990], [-1250, 874]],
  roofWidth: [[1000, 740], [300, 690], [0, 680], [-700, 670], [-1250, 720]],
  windows: [
    { z: [330, 990], rows: ['header', 'middle'], inset: [1, 0] },
    { z: [-1240, -760], rows: ['header', 'middle'], inset: [1, 0] },
    { z: [-30, 560], rows: ['glassBase', 'header'], inset: [1, 1] },
    { z: [-560, -90], rows: ['glassBase', 'header'], inset: [1, 1] },
  ],
  panels: {
    doors: [{ name: 'front', z: [-60, 960] }, { name: 'rear', z: [-920, -60] }],
    bonnet: [1050, 2200],
    boot: [-2200, -1280],
    frontBumper: 2210,
    rearBumper: -2210,
  },
  // Lamps, grille and chrome bumpers are fitted to the ends (fittings.mjs), not picked out of the surface.
  lights: {},
  fittings: {
    bumper: { y: [300, 395], reach: 70, wrap: 190 },
    grille: { x: 360, y: [520, 662] },
    headlamps: { x: [410, 700], y: [540, 662] },
    taillamps: { x: [420, 800], y: [600, 760] },
    plate: { x: 260, y: [470, 580] },
    handles: { y: 770, z: [40, -820] },
  },
  mirror: { z: 900, y: 860, h: 80, depth: 130, reach: 110 },
  paint: '#2d5a43',
  rimColour: '#c9ccd0',
  caliperColour: '#3a3c40',
  rims: { spokes: 8, style: 'aero' },
  armsInboard: { front: 330 },
  rearAxle: 'live',
  steering: { z: 1175, y: 190, half: 290, rise: 75 },
  // A two-litre four at the front, a four-speed gearbox behind it, the propshaft to the rear axle.
  engine: { yc: 360, front: 1842, bore: 88, stroke: 82, rod: 140, spacing: 96 },
  cabin3d: {
    floor: { y: 300, half: 740, z: [-1000, 900] },
    tunnel: { half: 150, top: 490 },
    dash: { y: 880, half: 700, z: 900 },
    screen: { x: 0, y: 760, z: 678, w: 180, h: 50 },
    wheel: { at: [380, 820, 560], r: 190, tilt: 24 },
    seats: [
      { at: [400, 470, -120], width: 480, depth: 500, back: 600, recline: 20 },
      { at: [-400, 470, -120], width: 480, depth: 500, back: 600, recline: 20 },
      { at: [0, 620, -740], width: 1180, depth: 470, back: 520, recline: 24, head: false },
    ],
  },
};
