// A car's body in two lofts, as designers draw one: the lower body (sills, the barrel of the sides,
// the shoulders and wings, and the lids across the top: bonnet, scuttle, deck) and the canopy sitting
// on it (windscreen, side glass, roof and rear glass), each a run of cross-sections along the car
// through key points that follow (z, value) curves. Millimetres in the car frame: z forward along the
// car, x to its left, y up from the ground; z = 0 is midway between the axles.
import { Geo } from '../geometry.mjs';
import { curve, computeNormals, lines } from './loft.mjs';

/** Centripetal Catmull–Rom through 2D points with a fixed count of samples per segment. */
function spline(points, counts) {
  const out = [];
  const P = [points[0], ...points, points[points.length - 1]];
  const dist = (a, b) => Math.max(1e-6, Math.hypot(b[0] - a[0], b[1] - a[1]) ** 0.5);
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    const t1 = dist(p0, p1);
    const t2 = t1 + dist(p1, p2);
    const t3 = t2 + dist(p2, p3);
    const n = counts[i - 1];
    for (let k = 0; k < n; k++) {
      const t = t1 + ((t2 - t1) * k) / n;
      const lerp = (a, b, ta, tb) => [0, 1].map((c) => ((tb - t) * a[c] + (t - ta) * b[c]) / (tb - ta));
      const A1 = lerp(p0, p1, 0, t1);
      const A2 = lerp(p1, p2, t1, t2);
      const A3 = lerp(p2, p3, t2, t3);
      const B1 = lerp(A1, A2, 0, t2);
      const B2 = lerp(A2, A3, t1, t3);
      out.push(lerp(B1, B2, t1, t2));
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

/** Straight lines through 2D points, with a fixed count of samples along each: a faceted section. */
function polyline(points, counts) {
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [a, b] = [points[i], points[i + 1]];
    for (let k = 0; k < counts[i]; k++) out.push([a[0] + ((b[0] - a[0]) * k) / counts[i], a[1] + ((b[1] - a[1]) * k) / counts[i]]);
  }
  out.push(points[points.length - 1]);
  return out;
}

/**
 * A mirrored loft: `section(z)` gives the left half's key points from the bottom middle round to the
 * top middle (x ≥ 0), with `counts` samples between each pair. Returns a Geo with each vertex's row
 * (for materials and creases) and station index, both sides and end caps; `creases` are rows whose
 * normals don't blend across.
 */
export function loft({ z0, z1, stations, section, counts, creases = [], caps = true, capBulge = [0, 0], bunch = 0.8, openBottom = false, facets = false }) {
  const geo = new Geo();
  const rows = counts.reduce((a, b) => a + b, 0);
  const rowOf = [];
  const stationOf = [];
  const ring = [];
  for (let i = 0; i <= stations; i++) {
    const s = i / stations;
    const e = 0.5 - 0.5 * Math.cos(Math.PI * s);
    const z = z0 + (z1 - z0) * ((1 - bunch) * s + bunch * e);
    const pts = (facets ? polyline : spline)(section(z), counts);
    const left = pts.map(([x, y], j) => {
      rowOf.push(j);
      stationOf.push(i);
      return geo.vertex([x, y, z], [0, 0, 1], [s, (0.5 * j) / rows]);
    });
    const right = pts.map(([x, y], j) => {
      if ((j === 0 && !openBottom) || j === rows) return left[j];
      rowOf.push(j);
      stationOf.push(i);
      return geo.vertex([-x, y, z], [0, 0, 1], [s, 1 - (0.5 * j) / rows]);
    });
    ring.push({ z, left, right });
  }
  for (let i = 0; i < stations; i++) {
    const [a, b] = [ring[i], ring[i + 1]];
    for (let j = 0; j < rows; j++) {
      const q = [a.left[j], a.left[j + 1], b.left[j + 1], b.left[j]];
      geo.indices.push(q[0], q[2], q[3], q[0], q[1], q[2]);
      const r = [a.right[j], a.right[j + 1], b.right[j + 1], b.right[j]];
      geo.indices.push(r[0], r[3], r[2], r[0], r[2], r[1]);
    }
  }
  if (caps) {
    for (const [i, dir] of [[0, -1], [stations, 1]]) {
      const { z, left, right } = ring[i];
      const loop = [...left, ...right.slice(1, -1).reverse()];
      const n = loop.length;
      const cy = loop.reduce((sum, v) => sum + geo.positions[v * 3 + 1], 0) / n;
      // Rounded out by `bulge` mm over a band round its edge (flat in the middle, like a car's tail), in
      // rings toward the middle, so a tail or nose isn't a slab with a sharp edge.
      const bulge = (dir > 0 ? capBulge[1] : capBulge[0]) ?? 0;
      const steps = bulge ? [0.04, 0.1, 0.18, 0.28, 0.4, 0.6, 0.8] : [];
      const own = (p) => {
        rowOf.push(-1);
        stationOf.push(i);
        return geo.vertex(p, [0, 0, dir]);
      };
      let prev = loop.map((v) => own(geo.positions.slice(v * 3, v * 3 + 3)));
      const base = loop.map((v) => geo.positions.slice(v * 3, v * 3 + 3));
      for (const f of steps) {
        const cur = base.map((p) => own([p[0] * (1 - f), p[1] + (cy - p[1]) * f, z + dir * bulge * Math.sin((Math.min(1, f / 0.42) * Math.PI) / 2)]));
        for (let m = 0; m < n; m++) {
          const [a, b, c, d] = [prev[m], prev[(m + 1) % n], cur[(m + 1) % n], cur[m]];
          if (dir > 0) geo.indices.push(d, a, b, d, b, c);
          else geo.indices.push(d, b, a, d, c, b);
        }
        prev = cur;
      }
      const centre = own([0, cy, z + dir * bulge]);
      for (let k = 0; k < n; k++) {
        const [p, q] = [prev[k], prev[(k + 1) % n]];
        if (dir > 0) geo.indices.push(centre, p, q);
        else geo.indices.push(centre, q, p);
      }
    }
  }
  computeNormals(geo, {
    creases,
    rowOf: (v) => rowOf[v],
    onCopy: (v, c) => {
      rowOf[c] = rowOf[v];
      stationOf[c] = stationOf[v];
    },
  });
  return { geo, rowOf, stationOf, rows };
}

/** Row counts of the lower body's section and the names of its key rows. */
export const LOWER = { counts: [8, 6, 8, 10, 8, 6, 6, 10, 8], names: ['bottom', 'floor', 'sill', 'lower', 'side', 'roll', 'belt', 'crown', 'lid', 'middle'] };
export const CANOPY = { counts: [6, 12, 8, 8], names: ['foot', 'footOut', 'glassBase', 'header', 'middle'] };
/** Every key row but the first and last: where a faceted body's flat panels meet. */
const keyRows = (layout) => layout.names.slice(1, -1).map((n) => rowIndex(layout, n));

export function rowIndex(layout, name) {
  let j = 0;
  for (let i = 0; i < layout.names.length; i++) {
    if (layout.names[i] === name) return j;
    j += layout.counts[i] ?? 0;
  }
  return -1;
}

/**
 * The lower body from a spec: curves `bottom`, `width` (half-width at the widest), `shoulder`
 * (fraction from bottom to belt where it's widest), `sill` (how far the sill tucks in), `roll` (how far
 * the side rolls in to the beltline crease), `belt` (the crease's height), `crown` and `crownIn` (the
 * wings' crowns: height, and how far in from the side), and `lid` (the height of the bonnet, scuttle and
 * deck down the middle).
 */
export function lowerBody(spec, { stations = 200 } = {}) {
  const fit = spec.facets ? lines : curve;
  const c = Object.fromEntries(['bottom', 'width', 'shoulder', 'sill', 'roll', 'belt', 'crown', 'crownIn', 'lid'].map((k) => [k, fit(spec[k])]));
  const section = (z) => {
    const yb = c.bottom(z);
    const w = Math.max(20, c.width(z));
    const yl = Math.max(yb + 60, c.belt(z));
    const ys = yb + (yl - yb) * c.shoulder(z);
    const ws = Math.max(15, w - Math.min(c.sill(z), w * 0.25));
    const rb = Math.min(55, (ys - yb) * 0.5);
    const roll = Math.min(c.roll(z), (yl - ys) * 0.7, w * 0.2);
    // A body can have its crown below the beltline's crease (a fender top sloping down inward); otherwise just above it.
    const yc = spec.dropCrown ? c.crown(z) : Math.max(yl + 4, c.crown(z));
    const wc = Math.max(10, w - Math.min(c.crownIn(z), w * 0.45));
    const yt = Math.max(yb + 70, c.lid(z));
    return [
      [0, yb],
      [ws * 0.62, yb],
      [ws - rb * 0.3, yb + rb * 0.28],
      [ws + (w - ws) * 0.6, yb + (ys - yb) * 0.42],
      [w, ys],
      [w - roll * 0.45, ys + (yl - ys) * 0.62],
      [w - roll, yl],
      [wc, yc],
      [wc * 0.45, yt + (yc - yt) * 0.22],
      [0, yt],
    ];
  };
  // A domed end (`bulge`: [tail, nose] mm) stays inside the car's length.
  const [tail, nose] = spec.bulge ?? [0, 0];
  return { ...loft({ z0: spec.length[0] + tail, z1: spec.length[1] - nose, stations, section, counts: LOWER.counts, creases: spec.facets ? keyRows(LOWER) : (spec.creases ?? ['belt']).map((n) => rowIndex(LOWER, n)), capBulge: [tail, nose], facets: spec.facets }), curves: c };
}

/**
 * The canopy: from `span` [rear, front] along z, its foot (`foot`: height where it meets the lower body,
 * `footWidth`), the glass's base line (`glassBase` height and `glassWidth`), and the roof (`roof` height
 * down the middle, `roofWidth`). At its ends it closes down onto the deck and the scuttle.
 */
export function canopy(spec, { stations = 140, lower = null } = {}) {
  const fit = spec.facets ? lines : curve;
  const c = Object.fromEntries(['foot', 'footWidth', 'glassBase', 'glassWidth', 'roof', 'roofWidth'].filter((k) => spec[k]).map((k) => [k, fit(spec[k])]));
  // On a body whose canopy sits on the lower body's crown (`canopyOnCrown`), its foot follows the crown's edge exactly,
  // given the lower body's curves, so the glass meets the paint along a clean line.
  if (spec.canopyOnCrown && lower) {
    const crownX = (z) => Math.max(10, lower.width(z)) - Math.min(lower.crownIn(z), Math.max(10, lower.width(z)) * 0.45);
    c.foot = (z) => lower.crown(z);
    c.footWidth = crownX;
    c.glassBase = (z) => lower.crown(z) + 2;
    c.glassWidth = (z) => crownX(z) - 2;
  }
  const section = (z) => {
    const yf = c.foot(z);
    const wf = Math.max(20, c.footWidth(z));
    const yg = Math.max(yf + 2, c.glassBase(z));
    const wg = Math.max(15, Math.min(wf, c.glassWidth(z)));
    const yr = Math.max(yg + 4, c.roof(z));
    const wr = Math.max(10, Math.min(wg - 5, c.roofWidth(z)));
    const rr = spec.facets ? 0 : Math.min(110, (yr - yg) * 0.42, wr * 0.45);
    // Open underneath: from the foot (sunk into the lower body) up the glass to the roof.
    return [
      [wf - 4, yf - 40],
      [wf, yf - 30],
      [wg, yg],
      [wr + rr * 0.32, yr - rr * 0.55],
      [0, yr],
    ];
  };
  return { ...loft({ z0: spec.span[0], z1: spec.span[1], stations, section, counts: CANOPY.counts, creases: spec.facets ? keyRows(CANOPY) : [rowIndex(CANOPY, 'glassBase')], caps: false, bunch: 0.6, openBottom: true, facets: spec.facets }), curves: c };
}
