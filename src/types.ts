/** A point or direction in model space: x/z centred on the model, y = 0 at its
 *  lowest point, scaled so half the bounding-box diagonal is 1 unit.
 *  `npm run models:inspect -- <slug>` prints part bounds in this space. */
export type Vec3 = [number, number, number];

export interface CameraPose {
  position: Vec3;
  target: Vec3;
}

export interface Part {
  /** glTF node name. */
  node: string;
  /** Short name, shown in the parts legend and on hover. */
  label: string;
  /** Direction the part travels when exploded (any length). */
  direction: Vec3;
  /** How far it travels at full explosion, in model units. */
  distance: number;
  /** Parts with a lower stage come off first. Defaults to 0. */
  stage?: number;
  /** When it moves, as [start, end] fractions of the slider, instead of the timing its stage gives it.
   *  Gaps between windows hold the model still at a useful half-open state. */
  window?: [number, number];
  /** A second leg after the first, in the same window: lift a part clear, then move it aside. */
  then?: { direction: Vec3; distance: number };
  /** Heading the part is listed under in the parts legend. Consecutive parts share a heading. */
  group?: string;
  /** One or two sentences on what the part does, shown beside it when it's clicked. */
  about?: string;
  /** Other nodes that travel with this part. */
  with?: string[];
}

export interface Annotation {
  title: string;
  text: string;
  /** Hotspot position at the assembled state. */
  position: Vec3;
  /** If set, the hotspot rides along with this node when the model explodes. */
  node?: string;
  /** Also turn with the node when the mechanism runs (for slow parts, like a crank handle). */
  ride?: boolean;
  /** Where the camera goes when the callout is selected. */
  camera?: CameraPose;
  /** Take the model apart this far (0–1) when the callout is selected, for things only visible inside.
   *  The camera pose is then for that state. */
  explode?: number;
}

export interface Motion {
  node: string;
  /** Rotation axis. */
  axis: Vec3;
  /** A point on the axis. Defaults to the centre of the node's bounds. */
  pivot?: Vec3;
  /** Turns per second while the mechanism runs; negative turns the other way. */
  speed?: number;
  /** Drive the node from the visitor's clock instead (a clock hand). */
  clock?: 'hour' | 'minute' | 'second';
  /** A wheel in a clock's train: turns per turn of the seconds hand, negative for the other way.
   *  It steps with the escapement's beat and keeps the phase it was modelled with. */
  train?: number;
  /** Swing back and forth with the beat: a balance wheel ('balance', a sine), a pallet fork
   *  ('pallet', flicking across on every beat), or a hairspring ('coil', which winds and unwinds
   *  with the balance: its inner coils turn with it, the outer end stays put). */
  swing?: 'balance' | 'pallet' | 'coil';
  /** Degrees either side of rest, for `swing` and `pawl`. */
  amplitude?: number;
  /** Turned by winding the crown: turns per turn of the crown, negative for the other way. */
  wind?: number;
  /** With `wind`: a spiral spring whose inner coils turn as it's wound while its outer end stays put (a mainspring). */
  coil?: boolean;
  /** A click: instead of turning, it rocks by `amplitude` as each tooth of a ratchet with this many teeth
   *  goes by, the ratchet turning `wind` turns per turn of the crown. */
  pawl?: number;
  /** Only animate while the inside can be seen (the model is apart, or seen through during a step of "How it works"). */
  inside?: boolean;
  /** Moved by one of the mechanism's controls instead of by time: a camera's `focus` (lens extension, mm), `aperture`
   *  (stops from wide open), `curtain1` and `curtain2` (0 cocked to 1 run), `lever` (0–1 of a stroke), `film`
   *  (frames wound on) or `release` (0–1); a desk lamp's `arm_lower` and `arm_upper` (src/viewer/balancedarm.ts); a
   *  lock's `lock-key`, `lock-wrong` and `lock-turn` (src/viewer/pintumbler.ts); an extinguisher's `ext_pin` and `ext_lever`
   *  (0–1), `ext_bar` (gauge bar) or `ext_used` (0–1 of the powder gone). See src/viewer/linkage.ts. */
  control?: string;
  /** With `control`: turns per unit of the control, counted from `from` (default 0). */
  turn?: number;
  from?: number;
  /** With `control`: [control, turns] points joined by straight lines, instead of `turn` (a blade's swing for each stop). */
  curve?: [number, number][];
  /** With `control`: a slide along this model-space vector per unit of the control (the same `from` and `curve`). */
  slide?: Vec3;
  /** With `control`: a curtain of cloth wound between two rollers; its node carries the layout (from the build). */
  cloth?: boolean;
  /** With `control`: film whose picture moves along it, this many tiles of its texture per unit of the control. */
  scroll?: number;
  /** With `control`: a strip of steel bent along a path as the control moves (a tape measure's blade paying out, its
   *  spring winding: `tape_out` mm, `tape_drum` turns); its node carries the layout (from the build). */
  strip?: boolean;
  /** Driven by the crank on the node named here (one that spins) instead of turning itself: a piston slides along
   *  `along` as the crankpin goes round (`throw` and `rod`, the crank's radius and the rod's length, in model units;
   *  `phase`, the crankpin's angle from the top in degrees with the crank at rest), and with `rocks` a connecting rod
   *  slides with its piston and swings about its pin (`pivot`, with `axis` along the crank). */
  crank?: string;
  /** Pushed open by a cam on the node named here (a camshaft that spins): a valve slides along `along` by `lift`
   *  (model units) while the cam's nose goes by, over `duration` degrees of its turn; `phase` is the nose's angle
   *  from the valve, in the cam's turning direction, with the camshaft at rest. */
  cam?: string;
  along?: Vec3;
  throw?: number;
  rod?: number;
  phase?: number;
  rocks?: boolean;
  lift?: number;
  duration?: number;
}

export interface Fact {
  label: string;
  value: string;
}

/** A label on the model during a step of "How it works", such as a wheel's speed. */
export interface Tag {
  /** The node it rides with (and sits on, unless `at` is given). */
  node: string;
  text: string;
  /** Model-space point to pin it to, at the assembled state; defaults to the node's middle. */
  at?: Vec3;
  /** Go round with the node as it turns (a label on a crank's handle). */
  ride?: boolean;
}

/** One chapter of "How it works": what the model shows, and what the panel says, while it's on. */
export interface Step {
  /** Short heading for the stepper, e.g. "Power". */
  label: string;
  title: string;
  /** The explanation, as paragraphs. */
  text: string[];
  /** The angle to see the step from, as [azimuth, elevation] in degrees (azimuth 0 looks from +z): the camera
   *  frames the parts in focus from there. */
  angle?: [number, number];
  /** How much of the frame the parts in focus fill (default 0.75). */
  fill?: number;
  /** An exact camera instead, framed on the stage's middle like a callout's. */
  camera?: CameraPose;
  /** How far apart the model is (0–1) during the step. Defaults to 0. */
  explode?: number;
  /** Parts that stay solid (any of their nodes). The rest turn to see-through ghosts, or to faint lines in wireframe. */
  focus?: string[];
  /** Parts to frame, if not the ones in focus (say, a small wheel and not the long hands on it). */
  frame?: string[];
  /** Parts left out of the picture altogether while the step is on (a dial in the way). */
  hide?: string[];
  /** The path the power (or the light) takes: model-space points at the assembled state, each riding
   *  with a node if one is named (so the path follows the parts as the model comes apart). */
  flow?: FlowPoint[];
  /** More paths drawn the same way (the second barrel of a pair of binoculars). */
  flows?: FlowPoint[][];
  /** What the path is: power (a vermilion line, smoothed), light (amber rays, straight between reflections), air (a blue
   *  line, smoothed) or water (a teal line, smoothed). Default power. */
  carries?: 'power' | 'light' | 'air' | 'water';
  /** Labels on parts. */
  tags?: Tag[];
  /** How fast the mechanism runs: 1 is real time, less is slow motion. Defaults to 1. */
  rate?: number;
  /** A chart under the text: one drawn for this object, by name, or a generic one with its settings
   *  (`{ "type": "ladder", ... }`; see src/charts). */
  chart?: string | ({ type: string } & Record<string, unknown>);
  /** An experiment to try (see src/pages/tour.ts): 'wind', 'loose' and 'hold' for a watch, 'run' (hold to run a
   *  crank or motor) and 'speeds' (pick one of `speeds`) for anything that spins, for a camera 'focus',
   *  'aperture', 'shutter' (pick a speed and fire) and 'advance' (wind on a frame), and for a car with fans and
   *  thrusters 'suction' (switch the fans on), 'grip' (pick a speed), 'thrust' (fire the rear thrusters) and 'fly'; for a desk lamp 'arm' (move
   *  each arm) and 'unhook' (hold the springs off), for a lock 'lock-insert' (push the key in) and 'lock-turn'
   *  (pick a key and turn), and for an extinguisher 'discharge' (pull the pin, squeeze, upright or upside down;
   *  'squeeze' starts with the pin out). */
  try?: string;
  /** For 'run': turns to count while it runs, e.g. the crank's and the bit's. */
  count?: { node: string; label: string }[];
  /** For 'speeds': the choices, each scaling how fast the `spin` nodes turn, or (`factors`) each node by its own amount
   *  (a differential in a bend: one wheel faster, the other slower). */
  speeds?: { label: string; factor: number; note: string; factors?: Record<string, number> }[];
  spin?: string[];
  /** A camera's settings as the step starts: focus distance (metres; 0 for infinity), the aperture's f-number and the
   *  shutter speed (seconds). Settings a step doesn't name stay as they were. */
  settings?: { focus?: number; aperture?: number; speed?: number; slide?: 'in' | 'out' };
}

/** A point on a flow path: in model space, riding with a node if one is named (and turning with it, with `ride`,
 *  for a point on a crank that goes round). */
export type FlowPoint = Vec3 | { node: string; at: Vec3; ride?: boolean };

export interface Credit {
  /** Title of the model at its source. */
  title: string;
  author: string;
  license: string;
  licenseUrl: string;
  source: string;
  /** Where the model came from; empty for one built in code here. */
  sourceUrl: string;
  /** A second credit line for parts not from the source, e.g. ones built for this site. */
  extra?: { label: string; text: string };
}

/** A nozzle that blows a jet (a car's cold-gas thruster): where its exit is (model space, assembled) and which way the
 *  jet goes; the viewer draws the jet while the nozzle fires. */
export interface Jet {
  /** The node it's part of: the jet rides with it. */
  node: string;
  at: Vec3;
  dir: Vec3;
  /** Which nozzles fire together: the rear ones, the lift ones (front left, front right, rear left, rear right, in order)
   *  or the yaw pair (left, right). */
  group: 'rear' | 'lift' | 'yaw';
}

export type CategoryId = 'gears' | 'optics' | 'time' | 'cameras' | 'cars' | 'home' | 'sound';

export interface Thing {
  slug: string;
  order: number;
  title: string;
  /** One line for the gallery card. */
  hook: string;
  category: CategoryId;
  /** The explainer, as paragraphs. */
  summary: string[];
  /** Path under public/, or an absolute URL. */
  model: string;
  /** Nodes to leave out of the scene (and out of model-space bounds). */
  hide?: string[];
  /** Starting camera angle as [azimuth, elevation] in degrees (azimuth 0 looks from +z); the distance is fitted to the model. */
  viewAngle?: [number, number];
  /** Exact starting camera, overriding viewAngle. */
  view?: CameraPose;
  /** Angle to swing to when taking the model apart, for models whose parts would otherwise come straight at the camera. */
  explodeAngle?: [number, number];
  facts?: Fact[];
  parts: Part[];
  annotations: Annotation[];
  motion?: Motion[];
  /** Label for the run button, e.g. "Turn the crank". */
  motionLabel?: string;
  /** For clock-driven mechanisms, the run button slows time down instead: to this fraction of real
   *  speed, taking the model apart to `explode` first if it's closed. */
  slowMotion?: { rate: number; explode?: number };
  /** How long "Take it apart" takes, in milliseconds (default 1300). */
  explodeDuration?: number;
  /** "How it works": the mechanism explained one stage at a time. */
  how?: Step[];
  /** Nozzles that blow jets (the Roadster's thrusters). */
  jets?: Jet[];
  credit: Credit;
}
