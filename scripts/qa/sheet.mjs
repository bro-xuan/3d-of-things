// Tiles screenshots into labelled contact sheets, so a check run is read as a few images
// instead of dozens.
//
//   await contactSheet(shots, 'out/sheet-tour.png', { columns: 3, width: 640 })
//   // shots: [{ file, label, bad }]; `bad` frames the tile in red.
import sharp from 'sharp';

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export async function contactSheet(shots, out, { columns = 3, width = 640, title = '' } = {}) {
  if (!shots.length) return null;
  const metas = await Promise.all(shots.map((s) => sharp(s.file).metadata()));
  const height = Math.round(width * Math.max(...metas.map((m) => m.height / m.width)));
  const label = 30;
  const gap = 8;
  const head = title ? 44 : 0;
  const rows = Math.ceil(shots.length / columns);
  const W = columns * width + (columns + 1) * gap;
  const H = head + rows * (height + label) + (rows + 1) * gap;
  const tiles = [];
  for (const [i, shot] of shots.entries()) {
    const x = gap + (i % columns) * (width + gap);
    const y = head + gap + Math.floor(i / columns) * (height + label + gap);
    const img = await sharp(shot.file).resize(width, height, { fit: 'contain', background: '#ffffff' }).png().toBuffer();
    tiles.push({ input: img, left: x, top: y });
    const color = shot.bad ? '#c8102e' : '#1b1b19';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${label}">
      <rect width="100%" height="100%" fill="${shot.bad ? '#fde8ea' : '#f2f1ec'}"/>
      <text x="8" y="21" font-family="Helvetica, Arial, sans-serif" font-size="16" fill="${color}">${escape(`${i + 1}. ${shot.label}`.slice(0, 80))}</text></svg>`;
    tiles.push({ input: Buffer.from(svg), left: x, top: y + height });
    if (shot.bad) {
      const frame = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height + label}"><rect x="1.5" y="1.5" width="${width - 3}" height="${height + label - 3}" fill="none" stroke="#c8102e" stroke-width="3"/></svg>`;
      tiles.push({ input: Buffer.from(frame), left: x, top: y });
    }
  }
  if (title) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${head}"><text x="${gap}" y="30" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="bold" fill="#1b1b19">${escape(title)}</text></svg>`;
    tiles.push({ input: Buffer.from(svg), left: 0, top: 0 });
  }
  await sharp({ create: { width: W, height: H, channels: 3, background: '#d9d8d2' } }).composite(tiles).png().toFile(out);
  return out;
}
