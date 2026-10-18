// Textures for the camera's generated parts, drawn pixel by pixel and encoded as PNG (the
// build re-encodes them as WebP).
import sharp from 'sharp';

/** 35 mm film, one frame's length (38 mm, eight perforations a side) per tile across u. */
export const FILM = {
  width: 35,
  frame: 38,
  pitch: 4.75,
  /** Perforations: 2.79 mm along the film, 1.98 mm across, their outer edge 2.01 mm in from the film's edge. */
  hole: { along: 2.79, across: 1.98, inset: 2.01, round: 0.51 },
};

/**
 * The film's face: a warm grey-brown emulsion with the perforations cut out (alpha 0), and the
 * thin unexposed margin a shade lighter. u runs along the film (one frame per tile), v across it.
 */
export function filmTexture(pixelsPerMm = 24) {
  const width = Math.round(FILM.frame * pixelsPerMm);
  const height = Math.round(FILM.width * pixelsPerMm);
  const data = Buffer.alloc(width * height * 4);
  const { along, across, inset, round } = FILM.hole;
  const holeAt = (x, y) => {
    // Distance outside a rounded rectangle (negative inside).
    const px = ((x % FILM.pitch) + FILM.pitch) % FILM.pitch - FILM.pitch / 2;
    for (const cy of [inset + across / 2, FILM.width - inset - across / 2]) {
      const qx = Math.abs(px) - along / 2 + round;
      const qy = Math.abs(y - cy) - across / 2 + round;
      const d = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - round;
      if (d < 0) return true;
    }
    return false;
  };
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const x = ((i + 0.5) / width) * FILM.frame;
      const y = ((j + 0.5) / height) * FILM.width;
      const o = (j * width + i) * 4;
      if (holeAt(x, y)) {
        data[o + 3] = 0;
        continue;
      }
      const margin = y < 5.2 || y > FILM.width - 5.2;
      // A faint grain so the emulsion isn't a flat fill.
      const grain = ((Math.sin(i * 12.9898 + j * 78.233) * 43758.5453) % 1) * 6;
      const [r, g, b] = margin ? [96, 78, 64] : [82, 66, 54];
      data[o] = Math.max(0, Math.min(255, r + grain));
      data[o + 1] = Math.max(0, Math.min(255, g + grain));
      data[o + 2] = Math.max(0, Math.min(255, b + grain));
      data[o + 3] = 255;
    }
  }
  return sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer();
}
