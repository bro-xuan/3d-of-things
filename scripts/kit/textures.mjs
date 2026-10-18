// Textures first written for the generated medium-format camera: a tiling normal map for the leatherette's
// pebble grain, the lens's engraved scales and the focusing screen's markings (drawn as SVG and
// rasterised), all encoded as PNG (the build re-encodes them as WebP).
import sharp from 'sharp';

const TAU = Math.PI * 2;

/** A small hash → [0, 1). */
function hash(i, j, seed = 0) {
  const s = Math.sin(i * 127.1 + j * 311.7 + seed * 74.7) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Pebble grain: a jittered grid of cells, each a low dome, with narrow valleys between them
 * (distance to the nearest cell border, as in a Voronoi diagram). Tiles seamlessly. The normal
 * map is in glTF's tangent space (+x along u, +y along v, +z out of the surface).
 */
export function leatherGrain(size = 512, cells = 30, depth = 2.4) {
  const height = new Float32Array(size * size);
  const pts = [];
  for (let j = 0; j < cells; j++) for (let i = 0; i < cells; i++) pts.push([(i + 0.15 + 0.7 * hash(i, j)) / cells, (j + 0.15 + 0.7 * hash(i, j, 1)) / cells, 0.6 + 0.4 * hash(i, j, 2)]);
  const cell = 1 / cells;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size;
      const v = (y + 0.5) / size;
      const ci = Math.floor(u * cells);
      const cj = Math.floor(v * cells);
      let d1 = Infinity;
      let d2 = Infinity;
      let lift = 1;
      for (let dj = -2; dj <= 2; dj++) {
        for (let di = -2; di <= 2; di++) {
          const i = (((ci + di) % cells) + cells) % cells;
          const j = (((cj + dj) % cells) + cells) % cells;
          const [px, py, h] = pts[j * cells + i];
          // The neighbour's point, moved by whole tiles to sit next to this cell.
          const qx = px + Math.floor((ci + di) / cells);
          const qy = py + Math.floor((cj + dj) / cells);
          const d = Math.hypot(u - qx, v - qy);
          if (d < d1) {
            d2 = d1;
            d1 = d;
            lift = h;
          } else if (d < d2) d2 = d;
        }
      }
      const border = (d2 - d1) / cell; // 0 on a border, ~0.5+ in a cell's middle
      const valley = Math.min(1, border / 0.22);
      const dome = 1 - Math.min(1, d1 / (cell * 0.8)) ** 2;
      height[y * size + x] = (0.55 * Math.sqrt(valley) + 0.45 * dome) * lift;
    }
  }
  const data = Buffer.alloc(size * size * 3);
  const at = (x, y) => height[(((y % size) + size) % size) * size + (((x % size) + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * depth;
      const dy = (at(x, y + 1) - at(x, y - 1)) * depth;
      const n = [-dx, -dy, 1];
      const l = Math.hypot(...n);
      const o = (y * size + x) * 3;
      data[o] = Math.round((n[0] / l / 2 + 0.5) * 255);
      data[o + 1] = Math.round((n[1] / l / 2 + 0.5) * 255);
      data[o + 2] = Math.round((n[2] / l / 2 + 0.5) * 255);
    }
  }
  return sharp(data, { raw: { width: size, height: size, channels: 3 } }).png().toBuffer();
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

/**
 * An engraved band, unrolled: u runs once round the ring (0..1 across the image), v across it.
 * `marks` are { at (turns, 0..1 round from +x toward +y), text, colour, size (px), y (0..1 down
 * the band), anchor, weight, tick: [y0, y1] }. The ring's metal shows through `background`.
 */
export function engraving({ width = 2048, height = 96, background = '#141414', marks = [], lines = [] }) {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${background}"/>`;
  for (const { y, colour = '#ddd', w = 1.5, from = 0, to = 1 } of lines) {
    svg += `<line x1="${from * width}" y1="${y * height}" x2="${to * width}" y2="${y * height}" stroke="${colour}" stroke-width="${w}"/>`;
  }
  for (const m of marks) {
    // A mark at u is drawn twice near the seam so it isn't cut in half where the band closes.
    for (const shift of [0, -1, 1]) {
      const x = (((m.at % 1) + 1) % 1 + shift) * width;
      if (x < -200 || x > width + 200) continue;
      if (m.tick) svg += `<line x1="${x}" y1="${m.tick[0] * height}" x2="${x}" y2="${m.tick[1] * height}" stroke="${m.colour ?? '#ddd'}" stroke-width="${m.w ?? 2}"/>`;
      if (m.dot) svg += `<circle cx="${x}" cy="${m.dot[0] * height}" r="${m.dot[1]}" fill="${m.colour ?? '#ddd'}"/>`;
      if (m.diamond) svg += `<path d="M${x} ${m.diamond[0] * height - m.diamond[1]} l${m.diamond[1]} ${m.diamond[1]} l${-m.diamond[1]} ${m.diamond[1]} l${-m.diamond[1]} ${-m.diamond[1]}z" fill="${m.colour ?? '#ddd'}"/>`;
      if (m.text !== undefined) {
        svg += `<text x="${x}" y="${(m.y ?? 0.6) * height}" font-family="${m.font ?? 'Helvetica Neue, Helvetica, Arial'}" font-size="${m.size ?? 30}" font-weight="${m.weight ?? 500}" fill="${m.colour ?? '#ddd'}" text-anchor="${m.anchor ?? 'middle'}" dominant-baseline="middle" letter-spacing="${m.spacing ?? 0}">${esc(m.text)}</text>`;
      }
    }
  }
  svg += '</svg>';
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** The focusing screen from above: matte, with the 6 × 6 frame's corners, a cross and the centre's circle. u across x, v along z. */
export function screenMarkings(size = 1024) {
  const s = size;
  const c = s / 2;
  const line = (x1, y1, x2, y2, w = 2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#6f6f6a" stroke-width="${w}"/>`;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><rect width="100%" height="100%" fill="#d9d8d1"/>`;
  svg += line(c - s * 0.06, c, c + s * 0.06, c) + line(c, c - s * 0.06, c, c + s * 0.06);
  svg += `<circle cx="${c}" cy="${c}" r="${s * 0.09}" fill="none" stroke="#6f6f6a" stroke-width="2"/>`;
  // Grid lines a third of the way across, as on later screens.
  for (const k of [1 / 3, 2 / 3]) svg += line(s * 0.04 + k * s * 0.92, s * 0.04, s * 0.04 + k * s * 0.92, s * 0.96, 1) + line(s * 0.04, s * 0.04 + k * s * 0.92, s * 0.96, s * 0.04 + k * s * 0.92, 1);
  svg += `<rect x="${s * 0.04}" y="${s * 0.04}" width="${s * 0.92}" height="${s * 0.92}" fill="none" stroke="#6f6f6a" stroke-width="3"/>`;
  svg += '</svg>';
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * 120 film in the magazine, seen from the lens: emulsion with a faint edge, and the frames
 * already exposed showing as slightly darker squares. One tile is one frame's pitch along u.
 */
export function rollFilm({ pitch = 60.5, frame = 56, width = 61.5, pxPerMm = 8 } = {}) {
  const w = Math.round(pitch * pxPerMm);
  const h = Math.round(width * pxPerMm);
  const gap = ((pitch - frame) / 2) * pxPerMm;
  const margin = ((width - frame) / 2) * pxPerMm;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#5b4a3c"/>`;
  svg += `<rect x="${gap}" y="${margin}" width="${frame * pxPerMm}" height="${frame * pxPerMm}" fill="#4a3b30"/>`;
  svg += '</svg>';
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export { TAU };
