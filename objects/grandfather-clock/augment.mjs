// Build step for the grandfather clock (content/grandfather-clock.json → build.augment): opens Poly Haven's "Vintage
// Grandfather Clock 01", a closed case with a dial and two hands, and puts a working eight-day movement inside it.
// Millimetres in the source's frame: x to the clock's right, y up from the floor, z out through the dial.
//
// The case's loose pieces are sorted by where they sit. The hood is cut free of its back (which stays on the case as
// the backboard's frame) so it can slide forward off the case, as a real hood does; the trunk's front board is cut out
// as the door. Both get a wall's thickness (surgery.solidify). The dark panel that faked the hood's inside goes. The
// movement (movement.mjs) is generated from the truth sheet's numbers.
import { surgery, solids, Part, materialKit, piecesOf, writeNodes, modelSpace, runChecks } from '../../scripts/kit/index.mjs';
import { CONTACTS as MOVEMENT_CONTACTS, L, TEETH, buildMovement } from './movement.mjs';

export { L };

/** Pairs that touch by design (movement.mjs lists the movement's). */
export const CONTACTS = MOVEMENT_CONTACTS;

/** Where the shell is cut (mm). */
const CUT = {
  /** The hood's back: behind this the frame round the back window stays with the case. */
  hoodBack: -135,
  /** Anything of the hood below this, inside its walls, is the board across its bottom. */
  hoodFloor: 1545,
  /** The trunk's door: its front board and panel, in front of the columns' backs. */
  doorZ: 100,
  doorHalfWidth: 178,
};

/** The shell's hands sit flush with each other on the dial; the seconds hand now goes under them. */
const HAND_LIFT = { hour_hand: 1, minute_hand: 2.5 };

/** Which part a loose piece of the case belongs to, by its bounds (mm). */
function partFor({ min, max, centre, size }) {
  const [cx, cy] = centre;
  if (max[2] < -140 && min[1] > 1550 && size[0] > 300 && size[2] < 15) return null; // the dark panel faking the hood's inside
  if (Math.abs(cx) < 1.5 && Math.abs(cy - L.centre[1]) < 2 && size[0] < 30) return max[2] <= 119.5 ? 'hour_hand' : 'minute_hand';
  if (Math.abs(cx - L.great[0]) < 2 && Math.abs(cy - L.centre[1]) < 2 && size[0] < 10) return 'great_wheel'; // its winding square
  if (min[2] >= 99 && max[2] <= 126 && min[1] > 1515 && max[1] < 2075 && Math.abs(cx) < 215) return 'dial';
  if (min[1] >= 1500) {
    if (max[2] < -140) return 'case';
    return size[2] > 300 ? 'hood_cut' : 'hood';
  }
  if (size[1] > 900 && size[0] > 450) return 'trunk_cut';
  if (max[1] <= 449) return 'base';
  if (min[1] > 440 && max[1] < 1440 && min[2] > 125 && size[0] < 30) return 'trunk_door'; // its hinges and keyhole
  return 'case';
}

export default async function augment(doc, { data, check = true, log = console.log } = {}) {
  const root = doc.getRoot();
  const scene = root.getDefaultScene() ?? root.listScenes()[0];
  const sources = root.listNodes().filter((n) => n.getMesh());
  const named = (suffix) => sources.find((n) => n.getName().endsWith(suffix));
  const bodyNode = named('_Body');
  const [bodyPrim, glassPrim] = ['vintage_grandfather_clock_01', 'vintage_grandfather_clock_01_glass'].map((m) => bodyNode.getMesh().listPrimitives().find((p) => p.getMaterial()?.getName() === m));
  const skin = bodyPrim.getMaterial();

  const kit = materialKit(doc);
  const M = {
    brass: kit.material('grandfather_brass', '#c9a24c', 1, 0.32),
    steel: kit.material('grandfather_steel', '#b7bcc2', 1, 0.28),
    blued: kit.material('grandfather_blued_steel', '#24315c', 1, 0.3),
    spring: kit.material('grandfather_spring', '#8d949c', 1, 0.3),
    bob: kit.material('grandfather_bob', '#d2a952', 1, 0.24),
    lead: kit.material('grandfather_lead', '#6c6f73', 0.35, 0.62),
    gut: kit.material('grandfather_gut', '#cdb58a', 0, 0.55),
    oak: kit.material('grandfather_oak', '#6e4426', 0, 0.7),
    inside: kit.material('grandfather_case_inside', '#4c2c18', 0, 0.78),
    glass: kit.glass('grandfather_glass'),
  };

  const pieces = new Map();
  const put = (name, mesh, material, key, generated = false) => {
    if (!mesh.indices.length) return;
    const list = pieces.get(name) ?? [];
    list.push({ mesh, material, key, generated });
    pieces.set(name, list);
  };

  // ------------------------------------------------------------------ the case
  const body = surgery.readMesh(bodyPrim);
  const ids = surgery.islands(body);
  const bounds = surgery.islandBounds(body, ids);
  const sorted = new Map();
  bounds.forEach((b, i) => {
    if (!b) return;
    const name = partFor(b);
    if (!name) return;
    sorted.set(name, [...(sorted.get(name) ?? []), i]);
  });
  const islandsOf = (name) => surgery.pick(body, (t) => (sorted.get(name) ?? []).includes(ids[t]));
  for (const name of ['hood', 'case', 'base', 'trunk_door', 'dial', 'great_wheel']) put(name, islandsOf(name), skin, 'skin');
  for (const name of ['hour_hand', 'minute_hand']) put(name, lift(islandsOf(name), HAND_LIFT[name]), skin, 'skin');

  // The hood: cut from its back, which stays on the case, and without the board across its bottom (a real hood is
  // open there, over the trunk's top); it gets its wall's thickness.
  const whole = islandsOf('hood_cut');
  const floor = (t) => {
    const [x, y, z] = surgery.centroid(whole, t);
    return y < CUT.hoodFloor && Math.abs(x) < 228 && z > -150 && z < 125;
  };
  const hood = surgery.cut(surgery.pick(whole, (t) => !floor(t)), ([, , z]) => z - CUT.hoodBack);
  const front = (mesh) => (t) => surgery.centroid(mesh, t)[2] > CUT.hoodBack;
  const hoodFront = surgery.pick(hood, front(hood));
  put('hood', hoodFront, skin, 'skin');
  put('case', surgery.pick(hood, (t) => !front(hood)(t)), skin, 'skin');
  put('hood', surgery.fromGeo(surgery.solidify(hoodFront, 9)), M.inside, 'inside');
  put('hood', surgery.readMesh(glassPrim), M.glass, 'glass');

  // The trunk: its front board is the door; the rest gets an inside.
  const trunk = islandsOf('trunk_cut');
  const isDoor = (t) => {
    const [x, , z] = surgery.centroid(trunk, t);
    return z > CUT.doorZ && Math.abs(x) < CUT.doorHalfWidth;
  };
  const door = surgery.pick(trunk, isDoor);
  const walls = surgery.pick(trunk, (t) => !isDoor(t));
  put('trunk_door', door, skin, 'skin');
  put('trunk_door', surgery.fromGeo(surgery.solidify(door, 16)), M.inside, 'inside');
  put('case', walls, skin, 'skin');
  put('case', surgery.fromGeo(surgery.solidify(walls, 16)), M.inside, 'inside');

  // The shell's hands: their meshes are in their nodes' frame, at the dial's centre.
  for (const [name, suffix] of [['hour_hand', '_HourHand'], ['minute_hand', '_MinuteHand']]) {
    const node = named(suffix);
    const [tx, ty, tz] = node.getTranslation().map((v) => v * 1000);
    const mesh = surgery.readMesh(node.getMesh().listPrimitives()[0]);
    for (let i = 0; i < mesh.positions.length; i += 3) {
      mesh.positions[i] += tx;
      mesh.positions[i + 1] += ty;
      mesh.positions[i + 2] += tz + HAND_LIFT[name];
    }
    put(name, mesh, skin, 'skin');
  }

  // ------------------------------------------------------------------ the movement
  const { parts } = buildMovement();
  // The dial's four feet, pinned through the front plate.
  const feet = new Part('dial');
  for (const [x, y] of [[-100, 1682], [100, 1682], [-100, 1830], [100, 1830]]) solids.shaft(feet.geo('brass'), 'z', [x, y, 0], [[2.6, L.front[1]], [2.6, L.dialBack]], { segments: 16 });
  parts.push(feet);
  piecesOf(parts, M, pieces);
  const parentOf = () => undefined;
  writeNodes(doc, scene, pieces, { parts, parentOf });
  for (const node of sources) node.dispose();

  const { toModel, space, mmPerUnit, realSize, unit } = modelSpace(scene);
  runChecks({ label: 'grandfather clock', pieces, contacts: CONTACTS, data, parentOf, mmPerUnit, check, log });
  log(`  grandfather clock: ${pieces.size} parts, ${realSize.join(' × ')} mm; escape wheel ${L.escape.map((v) => v.toFixed(1)).join(', ')}, anchor arbor y ${L.anchor[1].toFixed(1)}, bob at y ${L.pendulum.bobY.toFixed(1)}`);

  const P = (x, y, z) => toModel([x, y, z]);
  const [cx, cy] = L.centre;
  const [gx, gy] = L.great;
  const [tx, ty] = L.third;
  const [ex, ey] = L.escape;
  const [ax, ay] = L.anchor;
  const [mx, my] = L.minuteWheel;
  const W = L.weight;
  const pz = L.pendulum.z;
  const by = L.pendulum.bobY;
  const mid = (z) => (z[0] + z[1]) / 2;
  const deg = (dy, dx) => (Math.atan2(dy, dx) * 180) / Math.PI;
  const onRim = ([x, y], r, a, z) => P(x + r * Math.cos((a * Math.PI) / 180), y + r * Math.sin((a * Math.PI) / 180), z);
  return {
    space,
    pivots: {
      centre: P(cx, cy, 60),
      great: P(gx, gy, 60),
      third: P(tx, ty, 60),
      escape: P(ex, ey, 60),
      anchor: P(ax, ay, 60),
      pendulum: P(ax, ay, pz),
      minuteWheel: P(mx, my, 100),
      hands: P(cx, cy, 120),
    },
    anchors: {
      // Case
      hood: P(-150, 1990, 150),
      hood_front: P(0, 1800, 160),
      door: P(-80, 1000, 142),
      door_mid: P(0, 950, 140),
      base: P(0, 250, 200),
      seatboard: P(-160, L.seatboard.y[1], 80),
      // Power
      weight: P(W.pulleyX + W.r, W.pulleyY - 37 - W.h / 2, W.z),
      weight_mid: P(W.pulleyX, W.pulleyY - 37 - W.h / 2, W.z),
      pulley: P(W.pulleyX, W.pulleyY - W.pulleyR, W.z),
      pulley_left: P(L.lineLeftX, W.pulleyY, W.z),
      line: P(L.lineLeftX, 1500, W.z),
      line_top: P(L.lineLeftX, gy, W.z),
      barrel: P(gx - L.barrel.r, gy + 12, W.z + 10),
      barrel_mid: P(gx, gy, mid(L.barrel.z)),
      great_wheel: onRim(L.great, 50, 20, L.greatZ[1]),
      great_mesh: onRim(L.great, 0.5 * L.modules.great * TEETH.great, 180, mid(L.greatZ)),
      winding_square: P(gx, gy, 118),
      // Train
      centre_wheel: onRim(L.centre, 30, 200, L.centreWheelZ[1]),
      centre_axis: P(cx, cy, mid(L.centreWheelZ)),
      third_mesh: onRim(L.centre, 33, deg(ty - cy, tx - cx), mid(L.centreWheelZ)),
      third_wheel: onRim(L.third, 26, 160, L.thirdWheelZ[1]),
      third_axis: P(tx, ty, mid(L.thirdWheelZ)),
      escape_mesh: onRim(L.third, 29.4, deg(ey - ty, ex - tx), mid(L.thirdWheelZ)),
      escape_wheel: onRim(L.escape, 27, -30, L.escapeWheelZ[1]),
      escape_axis: P(ex, ey, mid(L.escapeWheelZ)),
      // Escapement
      pallet_left: onRim(L.escape, 31, 135, L.anchorZ[1]),
      pallet_right: onRim(L.escape, 31, 45, L.anchorZ[1]),
      anchor: P(ax + 12, ay - 6, L.anchorZ[1]),
      anchor_axis: P(ax, ay, mid(L.anchorZ)),
      crutch: P(ax + 2, 1760, 3.6),
      fork: P(ax, 1695, pz),
      suspension: P(ax, ay + 4, pz),
      rod: P(0, 1300, pz),
      bob: P(L.pendulum.bobR * 0.7, by + 20, pz + L.pendulum.bobHalf),
      bob_mid: P(0, by, pz),
      // The film frames from here to the top of the hood.
      bob_low: P(0, by - L.pendulum.bobR, pz),
      hood_top: P(0, 2190.6, 0),
      rating_nut: P(5.5, by - L.pendulum.bobR - 12, pz),
      // Hands
      cannon: onRim(L.centre, 14, 60, L.cannonZ[1]),
      minute_wheel: onRim(L.minuteWheel, 13, 200, L.cannonZ[1]),
      hour_wheel: onRim(L.centre, 24, -40, L.hourZ[1]),
      dial: P(-120, 1640, 118),
      dial_centre: P(cx, cy, 118),
      seconds_hand: P(ex, ey + 22, 119),
      minute_hand: P(cx - 40, cy - 40, 121),
      hour_hand: P(cx - 40, cy + 36, 120.5),
      // Frame
      front_plate: P(-105, 1700, L.front[1]),
      back_plate: P(-105, 1700, L.back[1]),
      back_cock: P(8, ay + 11, -6),
    },
    teeth: TEETH,
    length: L.pendulum.length,
    amplitude: L.pendulum.amplitude,
    unitPerMm: unit(1),
  };
}

/** A mesh moved forward (towards the viewer) by dz mm. */
function lift(mesh, dz) {
  for (let i = 2; i < mesh.positions.length; i += 3) mesh.positions[i] += dz;
  return mesh;
}
