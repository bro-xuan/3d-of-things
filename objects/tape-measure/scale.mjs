// The blade's printing, drawn as SVG and rasterised to PNG (the build re-encodes it as WebP): a tick every
// millimetre, longer every 5 and 10 mm, from both edges, and the centimetres numbered. u runs along the blade from
// its end under the hook; the marks are laid out from the true zero, the hook's outside face, `zero` mm beyond it.
// The printed face takes the top PRINTED of the image's height; below it is plain yellow, for the blade's back.
import sharp from 'sharp';

const YELLOW = '#efc31b';
const INK = '#141414';
const RED = '#c4231c';
/** How much of the image's height is the printed face (v from 0 to this); the rest is the plain back. */
export const PRINTED = 0.8;

/**
 * The stretch of blade from u = `from` to `to` (mm), `pxPerMm` across and along. With `numbers`, each centimetre
 * gets its number (red every 10 cm); without, it is a tile that repeats every (to − from) mm, which must be a
 * whole number of centimetres so its marks line up from one tile to the next.
 */
export function bladeScale({ from, to, width, pxPerMm, zero, numbers }) {
  const W = Math.round((to - from) * pxPerMm);
  const H = Math.round(width * pxPerMm);
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${Math.round(H / PRINTED)}"><rect width="100%" height="100%" fill="${YELLOW}"/>`;
  for (let d = Math.ceil(from + zero); d - zero < to; d++) {
    const x = (d - zero - from) * pxPerMm;
    const len = (d % 10 === 0 ? 0.3 : d % 5 === 0 ? 0.2 : 0.12) * H;
    const w = d % 10 === 0 ? 0.32 * pxPerMm : 0.18 * pxPerMm;
    svg += `<line x1="${x.toFixed(1)}" y1="0" x2="${x.toFixed(1)}" y2="${len.toFixed(1)}" stroke="${INK}" stroke-width="${w.toFixed(2)}"/>`;
    svg += `<line x1="${x.toFixed(1)}" y1="${(H - len).toFixed(1)}" x2="${x.toFixed(1)}" y2="${H}" stroke="${INK}" stroke-width="${w.toFixed(2)}"/>`;
    if (numbers && d % 10 === 0) {
      const cm = d / 10;
      svg += `<text x="${(x - 0.6 * pxPerMm).toFixed(1)}" y="${(H * 0.52).toFixed(1)}" font-family="Helvetica Neue, Helvetica, Arial" font-weight="700" font-size="${(H * 0.36).toFixed(1)}" fill="${cm % 10 === 0 ? RED : INK}" text-anchor="end" dominant-baseline="middle">${cm}</text>`;
    }
  }
  svg += '</svg>';
  return sharp(Buffer.from(svg)).png().toBuffer();
}
