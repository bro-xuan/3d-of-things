// Where everything sits in the generated medium-format reflex camera, after the Hasselblad
// 500C/M: a cubic body with interchangeable lens, film magazine and finder. Millimetres in the
// camera frame: x toward the photographer's left (the winding knob is on the right, at -x), y up,
// z forward along the lens; the origin is the middle of the picture on the film.
//
// The numbers that matter optically are the real ones: the lens's flange sits 74.9 mm in front of
// the film, the picture is 56 mm square, and the focusing screen is as far from the mirror as
// the film is, so what's sharp on the screen is sharp on the film.

/** From the lens's seat on the body to the film. */
export const FLANGE = 74.9;
/** The picture: 56 mm square on 120 roll film, 61.5 mm wide. */
export const PICTURE = 56;
export const FILM_WIDTH = 61.5;
/** Frames are spaced 60.5 mm apart along the film (the gap between pictures is 4.5 mm). */
export const FRAME_PITCH = 60.5;

/** The body's shell: a box rounded on its edges, open at the back; its front wall holds the bayonet. */
export const BODY = {
  x: [-44, 44],
  y: [-44, 46],
  z: [3.5, 72.5],
  round: 3,
  wall: 1.6,
  /** The round opening in the front wall, and the one in the right side for the winding knob's coupling. */
  front: 36.5,
  knob: { y: 2, z: 38, r: 21 },
  /** The opening on top that the focusing screen and the finder sit over (x half-width, z range). */
  top: { x: 33, z: [12, 70] },
  /** The open back: the rear plate fills it. */
  back: { x: 40.5, y: [-40.5, 42.5] },
};

/** The chassis inside the shell: the front bayonet plate, the mirror box's walls, the rear plate. */
export const CHASSIS = {
  front: { z: [67.6, 70.4], half: 40 },
  bayonet: { outer: 34, throat: 26.6, face: FLANGE },
  rear: { z: [3.5, 5.0], window: PICTURE / 2 },
  /** The mirror box's side walls (inner faces) and floor. */
  walls: { x: 34.6, thick: 0.8, floor: -33.4 },
  /** The plate on the right wall that carries the winding gears, and the gaps either side of it. */
  mechanism: { x: [-36.4, -35.6] },
};

/** The focusing screen: its matte face is as far from the mirror as the film. */
export const SCREEN = { y: 41, thick: 2.2, half: 28.5, z: [41 - 28.5, 41 + 28.5] };

/** The mirror swings up about its top back edge, to lie flat under the screen while a picture is taken. */
export const MIRROR = {
  hinge: [8.6, SCREEN.y - 8.6], // (z, y)
  length: 58,
  half: 31,
  glass: 1.3,
};

/** The rear flaps (the auxiliary shutter): one hinged at the top of the window, one at the bottom. */
export const FLAPS = { z: 6.3, hinge: 29.6, half: 30, thick: 0.35 };

/** The lens's drive shaft: the key at the front cocks the lens's shutter; a spring inside turns it as the camera fires. */
export const DRIVE = { x: 0, y: -23, z: [52.5, 70.6] };

/** The winding knob on the right side, and the gears behind it. */
export const KNOB = { y: 2, z: 38, r: 23.5, x: [-58.5, -44.6] };

/** The lens (a Planar-type 80 mm f/2.8 in a leaf shutter): stations along z from the flange. */
export const LENS = {
  focal: 80,
  nearest: 0.9,
  /** The bayonet's lugs and the barrel's radius behind the flange. */
  mount: { r: 26.1, z: [64.5, FLANGE] },
  /** Degrees of focusing-ring turn from infinity to the nearest distance. */
  throw: 300,
  /** Degrees of aperture-ring turn per stop, and of speed-ring turn per speed. */
  stopTurn: 15,
  speedTurn: 21,
};

/** The film magazine: behind the body, holding the film flat across the picture. */
export const MAGAZINE = {
  x: [-44, 44],
  y: [-44, 46],
  z: [-41.5, 3.5],
  round: 3.5,
  wall: 1.4,
  /** The dark slide's slot, between the magazine's front and the film. */
  slide: { z: 2.0, thick: 0.3 },
  /** The film's path: rollers above and below the picture, the two spools behind the pressure plate. */
  rollers: { y: 34.2, z: -4.06, r: 4 },
  supply: { y: -27.6, z: -22.5 },
  takeUp: { y: 29.6, z: -22.5 },
  spool: { core: 5.9, flange: 12.6, half: 31.6 },
  pressure: { z: [-2.2, -0.15], half: 31, y: 31 },
};

/** The folding finder on top of the body, folded flat. */
export const FINDER = { x: 40, z: [5.2, 71.8], y: [46, 68.5] };
