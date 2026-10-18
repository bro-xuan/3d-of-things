// The folding finder that sits on top of the generated reflex camera, folded flat: a black
// box whose lid springs up into a hood, with a magnifier inside for focusing on the screen.
import { Geo, cw } from '../../scripts/kit/geometry.mjs';
import { box, plate, rect, revolve, shaft } from '../../scripts/kit/solids.mjs';
import { Part } from '../../scripts/kit/parts.mjs';
import { fromGeo, pick, solidify, centroid } from '../../scripts/kit/surgery.mjs';
import { FINDER, SCREEN } from './layout.mjs';
import { roundRect, roundedBox } from '../../scripts/kit/shapes.mjs';

function toGeo(mesh) {
  const g = new Geo();
  g.positions = [...mesh.positions];
  g.normals = [...mesh.normals];
  g.uvs = [...mesh.uvs];
  g.indices = [...mesh.indices];
  return g;
}

export function buildFinder() {
  const part = new Part('finder');
  const F = FINDER;
  const x = [-F.x, F.x];
  // The folded hood: a rounded black box, open underneath over the screen.
  let mesh = fromGeo(roundedBox(new Geo(), x, F.y, F.z, 2.6, { segments: 5, flat: 3 }));
  const hole = { x: SCREEN.half + 0.5, z: [SCREEN.z[0] - 0.5, SCREEN.z[1] + 0.5] };
  mesh = pick(mesh, (t) => {
    const [px, py, pz] = centroid(mesh, t);
    return !(py < F.y[0] + 0.6 && Math.abs(px) < hole.x && pz > hole.z[0] && pz < hole.z[1]);
  });
  part.geo('finderBlack').append(toGeo(mesh));
  part.geo('blackInside').append(solidify(mesh, 1.0, { maxOffset: 2 }));
  // The lid's raised panel, and the catch at the front that lets the hood spring up.
  plate(part.geo('finderBlack'), 'y', { outer: roundRect(0, (F.z[0] + F.z[1]) / 2, 2 * F.x - 9, F.z[1] - F.z[0] - 9, 2.2) }, F.y[1] - 0.05, F.y[1] + 0.5, { chamfer: 0.4 });
  box(part.geo('chrome'), [-6, 6], [F.y[1] - 9, F.y[1] - 2.6], [F.z[1] - 0.1, F.z[1] + 1.1], { axis: 'z', round: 0.8 });
  // Chrome runners along the bottom edges, which slide into the body's rails.
  for (const s of [-1, 1]) box(part.geo('chrome'), [s > 0 ? F.x - 3.2 : -F.x + 0.6, s > 0 ? F.x - 0.6 : -F.x + 3.2], [F.y[0] - 0.01, F.y[0] + 1.6], [F.z[0] + 2, F.z[1] - 2], { axis: 'y' });
  // Inside, folded flat: the hood's side panels and the magnifier in its frame.
  for (const y of [F.y[0] + 4.4, F.y[0] + 6.2]) plate(part.geo('black'), 'y', { outer: roundRect(0, (F.z[0] + F.z[1]) / 2, 2 * F.x - 6, F.z[1] - F.z[0] - 6, 2), holes: [cw(roundRect(0, (F.z[0] + F.z[1]) / 2, 2 * F.x - 12, F.z[1] - F.z[0] - 12, 1.5))] }, y, y + 0.4);
  const mid = (F.z[0] + F.z[1]) / 2;
  revolve(part.geo('black'), 'y', [0, 0, mid], [[17.4, F.y[0] + 9.2], [20.2, F.y[0] + 9.2], [20.2, F.y[0] + 11.6], [17.4, F.y[0] + 11.6], [17.4, F.y[0] + 9.2]], { segments: 64 });
  revolve(part.geo('glass'), 'y', [0, 0, mid], [[0, F.y[0] + 9.6], [17.6, F.y[0] + 9.6], [17.6, F.y[0] + 10.4], [12, F.y[0] + 11.6], [0, F.y[0] + 12.1]], { segments: 64 });
  return [part];
}
