// Small tiling normal maps for the movement's finishes, drawn pixel by pixel and
// encoded as PNG (the build re-encodes them as WebP). Tangent space follows glTF:
// +x along u, +y along v, +z out of the surface.
import sharp from 'sharp';

function encode(width, height, normalAt) {
  const data = Buffer.alloc(width * height * 3);
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const [nx, ny, nz] = normalAt((i + 0.5) / width, (j + 0.5) / height);
      const l = Math.hypot(nx, ny, nz);
      const o = (j * width + i) * 3;
      data[o] = Math.round(((nx / l) * 0.5 + 0.5) * 255);
      data[o + 1] = Math.round(((ny / l) * 0.5 + 0.5) * 255);
      data[o + 2] = Math.round(((nz / l) * 0.5 + 0.5) * 255);
    }
  }
  return sharp(data, { raw: { width, height, channels: 3 } }).png().toBuffer();
}

/**
 * Côtes de Genève: one stripe per tile across u. Each stripe is a shallow cut that
 * tilts from one edge to the other, so neighbouring stripes catch the light in turn.
 */
export function genevaStripes(size = 256) {
  return encode(size, size / 4, (u) => {
    const slope = 0.2 * (1 - 2 * u); // tilt sweeps across the stripe
    const edge = Math.min(u, 1 - u) < 0.025 ? 0.35 * Math.sign(0.5 - u) : 0; // crisp ridge between stripes
    return [-(slope + edge), 0, 1];
  });
}

/**
 * Perlage: overlapping circular spots laid in staggered rows, each later spot
 * covering the one before. Each spot is a shallow cone with fine circular grain.
 * The tile holds `rows` rows of `rows` spots and repeats seamlessly.
 */
export function perlage(size = 256, rows = 6) {
  const step = 1 / rows;
  const radius = step * 0.72;
  return encode(size, size, (u, v) => {
    // Find the spot drawn last among those covering this point: highest row, then highest column.
    let best = null;
    for (let dj = -2; dj <= 2; dj++) {
      for (let di = -2; di <= 2; di++) {
        const row = Math.floor(v / step) + dj;
        const shift = ((row % 2) + 2) % 2 ? step / 2 : 0;
        const col = Math.floor((u - shift) / step) + di;
        const cx = col * step + shift + step / 2;
        const cy = row * step + step / 2;
        const dx = u - cx;
        const dy = v - cy;
        const r = Math.hypot(dx, dy);
        if (r > radius) continue;
        if (!best || row > best.row || (row === best.row && col > best.col)) best = { row, col, dx, dy, r };
      }
    }
    if (!best) return [0, 0, 1];
    const { dx, dy, r } = best;
    const t = r / radius;
    // A cone rising toward the rim, with rings of grain on top.
    const tilt = 0.16 * t + 0.05 * Math.sin(t * Math.PI * 9);
    return r > 1e-6 ? [(-dx / r) * tilt, (-dy / r) * tilt, 1] : [0, 0, 1];
  });
}
