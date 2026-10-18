// The Roadster's charts: the air's pressure above and below the car with the fans running, its downforce against
// speed, the air's speed through a thruster's nozzle, and the lift nozzles' thrust against the car's weight through a
// flight. They read the car's state (src/viewer/aerocar.ts), the same numbers the model runs on.
import {
  ATMOSPHERE,
  FAN_DOWNFORCE,
  FEED_BAR,
  FLIGHTS,
  FLOOR,
  G,
  MASS,
  bodyDownforce,
  corneringG,
  flightLength,
  nozzleMach,
  nozzleRadius,
  nozzleState,
  type AeroState,
  type FlightKind,
} from '../viewer/aerocar';
import type { ChartFactory } from './index';
import { el, pathOf, plot, setAttrs, sizedSvg } from './svg';

const kg = (n: number) => (Math.round(n / 10) * 10).toLocaleString('en-GB');
const kPa = (pa: number) => (pa / 1000).toLocaleString('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// -------------------------------------------------------------- suction

/** The air's pressure on top of the car and under its floor, as two bars from nothing, with the fans' difference between
 *  them and what it comes to over the floor. */
const suction: ChartFactory = (host, { source, spec }) => {
  let under: SVGRectElement | undefined;
  let gap: SVGPathElement | undefined;
  let underLabel: SVGTextElement | undefined;
  let sum: SVGTextElement | undefined;
  let sum2: SVGTextElement | undefined;
  let map = { x: (_pa: number) => 0, row: (_i: number) => 0, barH: 0, rem: 16 };
  let shown = NaN;
  const sized = sizedSvg(host, 'Two bars: the air’s pressure on top of the car, and under its floor. With the fans running, the pressure underneath is a few percent lower, and that difference over the floor holds the car down.', (_w, rem) => rem * 9.4, (svg, w, _h, rem) => {
    const left = rem * 6.2;
    const right = w - rem * 2.4;
    const x = (pa: number) => left + (pa / ATMOSPHERE) * (right - left);
    const barH = rem * 1.15;
    const row = (i: number) => rem * 1.2 + i * rem * 2.2;
    map = { x, row, barH, rem };
    el('line', { x1: x(0), x2: x(0), y1: row(0) - rem * 0.3, y2: row(1) + barH + rem * 0.3, class: 'chart__axis' }, svg);
    for (const pa of [0, 50000, 100000]) el('text', { x: x(pa), y: row(1) + barH + rem * 1.05, class: 'chart__tick', 'text-anchor': 'middle' }, svg, `${pa / 1000} kPa`);
    el('text', { x: left - rem * 0.4, y: row(0) + barH * 0.72, class: 'chart__name chart__name--small', 'text-anchor': 'end' }, svg, 'On top');
    el('text', { x: left - rem * 0.4, y: row(1) + barH * 0.72, class: 'chart__name chart__name--small', 'text-anchor': 'end' }, svg, 'Underneath');
    el('rect', { x: x(0), y: row(0), width: x(ATMOSPHERE) - x(0), height: barH, class: 'chart__bar' }, svg);
    el('text', { x: x(ATMOSPHERE) - rem * 0.4, y: row(0) + barH * 0.72, class: 'chart__value chart__value--ink', 'text-anchor': 'end' }, svg, `${kPa(ATMOSPHERE)} kPa`);
    under = el('rect', { x: x(0), y: row(1), width: x(ATMOSPHERE) - x(0), height: barH, class: 'chart__bar is-picked' }, svg);
    underLabel = el('text', { x: 0, y: row(1) + barH * 0.72, class: 'chart__value chart__tick--paper', 'text-anchor': 'end' }, svg);
    gap = el('path', { class: 'chart__flow' }, svg);
    // From the chart's left edge: the lines are as long as the bars and their names together.
    sum = el('text', { x: 0, y: row(1) + barH + rem * 2.4, class: 'chart__note chart__note--accent' }, svg);
    sum2 = el('text', { x: 0, y: row(1) + barH + rem * 3.5, class: 'chart__note chart__note--accent' }, svg);
    shown = NaN;
  });
  const draw = (s: AeroState | null) => {
    const dp = s?.suction ?? 0;
    if (!under || Math.abs(dp - shown) < 1) return;
    shown = dp;
    const { x, row, barH, rem } = map;
    const p = ATMOSPHERE - dp;
    setAttrs(under, { width: (x(p) - x(0)).toFixed(1) });
    setAttrs(underLabel!, { x: (x(p) - rem * 0.4).toFixed(1) });
    underLabel!.textContent = `${kPa(p)} kPa`;
    // A bracket between the two bars' ends: the difference.
    const xe = x(ATMOSPHERE);
    const xp = x(p);
    setAttrs(gap!, { d: dp > 50 ? `M${xp} ${row(1) + barH * 0.5}L${xe + rem * 0.5} ${row(1) + barH * 0.5}L${xe + rem * 0.5} ${row(0) + barH * 0.5}L${xe} ${row(0) + barH * 0.5}` : '' });
    const down = (dp * FLOOR) / G;
    sum!.textContent = dp > 50 ? `${kPa(dp)} kPa less, over ${FLOOR} m² of floor:` : 'Fans off: the same pressure on both sides';
    sum2!.textContent = dp > 50 ? `${kg(down)} kg down; it weighs ${kg(MASS)} kg` : `${kPa(ATMOSPHERE)} kPa: 10 tonnes a square metre`;
  };
  draw(null);
  return {
    title: String(spec.title ?? ''),
    caption: String(spec.caption ?? ''),
    update() {
      draw(source.aero());
    },
    destroy() {
      sized.dispose();
    },
  };
};

// -------------------------------------------------------------- downforce

/** Downforce against road speed: the fans' (the same at any speed), the body's and the wing's (growing with speed squared;
 *  the wing rises above 120 km/h), and the two together; the car's weight; a cursor at the speed set. */
const downforce: ChartFactory = (host, { source, spec }) => {
  const TOP = 300;
  const MAX = 3500;
  let cursor: SVGGElement | undefined;
  let dots: SVGCircleElement[] = [];
  let note: SVGTextElement | undefined;
  let fansLine: SVGPathElement | undefined;
  let totalLine: SVGPathElement | undefined;
  let map = { x: (_v: number) => 0, y: (_k: number) => 0, rem: 16, w: 0 };
  let shown = '';
  const wingAt = (v: number) => (v > 120 ? 1 : 0);
  const sized = sizedSvg(host, 'Downforce against speed: the fans give the same at any speed, the body and wing give more the faster it goes, and the two together. A dashed line marks the car’s weight.', (w, rem) => Math.min(w * 0.62, rem * 13), (svg, w, h, rem) => {
    const left = rem * 2.9;
    const right = w - rem * 0.6;
    const top = rem * 1.4;
    const bottom = h - rem * 1.9;
    const x = (v: number) => left + (v / TOP) * (right - left);
    const y = (k: number) => bottom - (k / MAX) * (bottom - top);
    map = { x, y, rem, w };
    el('text', { x: 0, y: rem * 0.8, class: 'chart__tick' }, svg, 'kg down');
    for (const k of [0, 1000, 2000, 3000]) {
      el('line', { x1: left, x2: right, y1: y(k), y2: y(k), class: 'chart__grid' }, svg);
      el('text', { x: left - rem * 0.4, y: y(k) + rem * 0.28, class: 'chart__tick', 'text-anchor': 'end' }, svg, k.toLocaleString('en-GB'));
    }
    for (const v of [0, 100, 200, 300]) el('text', { x: x(v), y: bottom + rem * 1.1, class: 'chart__tick', 'text-anchor': 'middle' }, svg, `${v}`);
    el('text', { x: right, y: bottom + rem * 1.1 + rem * 0.05, class: 'chart__tick', 'text-anchor': 'end' }, svg, 'km/h');
    el('line', { x1: left, x2: right, y1: y(MASS), y2: y(MASS), class: 'chart__line chart__line--dashed' }, svg);
    el('text', { x: x(4), y: y(MASS) - rem * 0.4, class: 'chart__tick' }, svg, 'its weight');
    el('path', { d: pathOf(plot((v) => bodyDownforce(v, wingAt(v)), 0, TOP, x, y)), class: 'chart__line chart__line--ghost' }, svg);
    el('text', { x: x(TOP) - rem * 0.2, y: y(bodyDownforce(TOP, 1)) + rem * 1.1, class: 'chart__tick', 'text-anchor': 'end' }, svg, 'body and wing');
    fansLine = el('path', { class: 'chart__line' }, svg);
    totalLine = el('path', { class: 'chart__line chart__line--live' }, svg);
    cursor = el('g', { class: 'chart__cursor' }, svg);
    el('line', { x1: 0, x2: 0, y1: top, y2: bottom, class: 'chart__cursor-line' }, cursor);
    dots = [0, 1].map(() => el('circle', { cx: 0, cy: 0, r: rem * 0.22, class: 'chart__dot' }, svg));
    note = el('text', { x: right, y: rem * 0.8, class: 'chart__note chart__note--accent', 'text-anchor': 'end' }, svg);
    shown = '';
  });
  const draw = (s: AeroState | null) => {
    const fans = s ? (s.suction * FLOOR) / G : FAN_DOWNFORCE;
    const v = s?.speed ?? 0;
    const key = `${Math.round(fans)}|${v}|${map.w}`;
    if (!cursor || key === shown) return;
    shown = key;
    const { x, y, rem } = map;
    setAttrs(fansLine!, { d: pathOf([[x(0), y(fans)], [x(TOP), y(fans)]]) });
    setAttrs(totalLine!, { d: pathOf(plot((u) => fans + bodyDownforce(u, wingAt(u)), 0, TOP, x, y)) });
    const total = fans + bodyDownforce(v, wingAt(v));
    cursor.setAttribute('transform', `translate(${x(v).toFixed(1)} 0)`);
    setAttrs(dots[0], { cx: x(v).toFixed(1), cy: y(fans).toFixed(1) });
    setAttrs(dots[1], { cx: x(v).toFixed(1), cy: y(total).toFixed(1) });
    note!.textContent = `${kg(total)} kg · ${corneringG(total).toFixed(1)} g`;
    void rem;
  };
  draw(null);
  return {
    title: String(spec.title ?? ''),
    caption: String(spec.caption ?? ''),
    update() {
      draw(source.aero());
    },
    destroy() {
      dots = [];
      sized.dispose();
    },
  };
};

// -------------------------------------------------------------- nozzle

/** A nozzle from the side, the air going through it as dots (they speed up through the throat while it fires), and
 *  under it the air's speed along it, with its pressure. */
const nozzle: ChartFactory = (host, { source, spec }) => {
  const N = 26;
  const xs = Array.from({ length: N }, (_, i) => i / N);
  let dots: SVGCircleElement[] = [];
  let map = { x: (_u: number) => 0, cy: 0, k: 0 };
  let live = false;
  /** Each dot's height across the bore, as a fraction of it, so they fill it. */
  const lanes = xs.map((_, i) => ((i * 7) % N) / N - 0.5);
  // The air's speed along the nozzle, from its Mach number.
  const speed = (u: number) => nozzleState(nozzleMach(u)).speed;
  const pressure = (u: number) => nozzleState(nozzleMach(u)).bar;
  const exit = nozzleState(nozzleMach(1));
  const throat = nozzleState(1);
  const sized = sizedSvg(host, 'A nozzle from the side: air comes in from the left, narrows to the throat, and leaves on the right much faster. Below it, the air’s speed rising and its pressure falling along the nozzle.', (w, rem) => Math.min(w * 0.7, rem * 15), (svg, w, h, rem) => {
    const left = rem * 2.2;
    const right = w - rem * 2.2;
    const x = (u: number) => left + u * (right - left);
    const cy = rem * 3.0;
    const k = rem * 0.52;
    map = { x, cy, k };
    // The walls.
    const wall = (sign: number) => pathOf(plot((u) => sign * nozzleRadius(u), 0, 1, x, (r) => cy + r * k, 80));
    el('path', { d: wall(-1), class: 'chart__line' }, svg);
    el('path', { d: wall(1), class: 'chart__line' }, svg);
    el('line', { x1: x(0.48), x2: x(0.48), y1: cy - k * 1.7, y2: cy + k * 1.7, class: 'chart__cursor-line' }, svg);
    el('text', { x: x(0.48), y: cy - k * 2.2, class: 'chart__tick', 'text-anchor': 'middle' }, svg, 'throat');
    el('text', { x: x(0), y: cy - k * 3.1, class: 'chart__tick', 'text-anchor': 'start' }, svg, `in at ${FEED_BAR} bar`);
    el('text', { x: x(1), y: cy - k * 3.6, class: 'chart__tick', 'text-anchor': 'end' }, svg, 'out');
    dots = xs.map(() => el('circle', { cx: 0, cy: 0, r: rem * 0.13, class: 'chart__dot chart__dot--air' }, svg));
    // The air's speed along it (and its pressure, dashed), on the same run.
    const top = cy + k * 4.6;
    const bottom = h - rem * 2.1;
    const ySpeed = (v: number) => bottom - (v / 700) * (bottom - top);
    const yBar = (b: number) => bottom - (b / FEED_BAR) * (bottom - top);
    el('line', { x1: left, x2: right, y1: bottom, y2: bottom, class: 'chart__axis' }, svg);
    el('path', { d: pathOf(plot(pressure, 0, 1, x, yBar, 120)), class: 'chart__line chart__line--dashed' }, svg);
    el('path', { d: pathOf(plot(speed, 0, 1, x, ySpeed, 120)), class: 'chart__line chart__line--live' }, svg);
    el('text', { x: x(0.02), y: yBar(FEED_BAR) - rem * 0.4, class: 'chart__tick' }, svg, 'pressure');
    el('text', { x: x(0.98), y: ySpeed(exit.speed) - rem * 0.5, class: 'chart__note chart__note--accent', 'text-anchor': 'end' }, svg, `${Math.round(exit.speed)} m/s`);
    // On two lines: there's only half the run past the throat to set it in.
    const sound = el('text', { x: x(0.48) + rem * 0.3, y: ySpeed(throat.speed) + rem * 1.1, class: 'chart__tick' }, svg, `${Math.round(throat.speed)} m/s,`);
    el('tspan', { x: x(0.48) + rem * 0.3, dy: '1.2em' }, sound, 'the speed of sound');
    el('text', { x: x(1), y: bottom + rem * 1.1, class: 'chart__tick', 'text-anchor': 'end' }, svg, `${Math.round(exit.bar)} bar, ${Math.round(exit.kelvin - 273)} °C`);
    el('text', { x: x(0), y: bottom + rem * 1.1, class: 'chart__tick' }, svg, 'speed');
    place();
  });
  /** Each dot where it is along the nozzle. */
  function place(): void {
    const { x, cy, k } = map;
    dots.forEach((dot, i) => {
      const u = xs[i];
      setAttrs(dot, { cx: x(u).toFixed(1), cy: (cy + lanes[i] * 1.6 * nozzleRadius(u) * k).toFixed(1) });
    });
  }
  let last = performance.now();
  return {
    title: String(spec.title ?? ''),
    caption: String(spec.caption ?? ''),
    update() {
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const s = source.aero();
      const firing = !!s && s.rear > 0.05;
      if (firing !== live) {
        live = firing;
        for (const dot of dots) dot.classList.toggle('is-still', !firing);
      }
      if (!firing) return;
      // Each dot moves at the air's speed where it is (scaled to cross in about a second at the exit).
      for (let i = 0; i < N; i++) {
        xs[i] += (speed(xs[i]) / 700) * dt * 0.9 * s!.rear;
        if (xs[i] >= 1) xs[i] -= 1;
      }
      place();
    },
    destroy() {
      dots = [];
      sized.dispose();
    },
  };
};

// -------------------------------------------------------------- flight

/** The lift nozzles' thrust through a flight against the car's weight, with its height, and a cursor at now. */
const flight: ChartFactory = (host, { source, spec }) => {
  let kind: FlightKind = 'hop';
  let cursor: SVGGElement | undefined;
  let dots: SVGCircleElement[] = [];
  let map = { x: (_t: number) => 0, yN: (_n: number) => 0, yH: (_h: number) => 0 };
  const build = (svg: SVGSVGElement, w: number, h: number, rem: number) => {
    const frames = FLIGHTS[kind];
    const left = rem * 2.6;
    const right = w - rem * 2.4;
    const top = rem * 1.5;
    const bottom = h - rem * 1.9;
    const end = flightLength(kind);
    const x = (t: number) => left + (t / end) * (right - left);
    const yN = (n: number) => bottom - (n / 50000) * (bottom - top);
    const yH = (m: number) => bottom - (m / 3.5) * (bottom - top);
    map = { x, yN, yH };
    el('text', { x: 0, y: rem * 0.8, class: 'chart__tick' }, svg, 'thrust, kN');
    el('text', { x: w, y: rem * 0.8, class: 'chart__tick', 'text-anchor': 'end' }, svg, 'height, m');
    for (const n of [0, 25000, 50000]) {
      el('line', { x1: left, x2: right, y1: yN(n), y2: yN(n), class: 'chart__grid' }, svg);
      el('text', { x: left - rem * 0.4, y: yN(n) + rem * 0.28, class: 'chart__tick', 'text-anchor': 'end' }, svg, `${n / 1000}`);
    }
    for (const m of [0, 1, 2, 3]) el('text', { x: right + rem * 0.4, y: yH(m) + rem * 0.28, class: 'chart__tick' }, svg, `${m}`);
    for (let t = 0; t <= end; t += 1) el('text', { x: x(t), y: bottom + rem * 1.1, class: 'chart__tick', 'text-anchor': 'middle' }, svg, `${t} s`);
    el('path', { d: pathOf(frames.map((f) => [x(f.t), yN(f.weight)])), class: 'chart__line chart__line--dashed' }, svg);
    el('path', { d: pathOf(frames.map((f) => [x(f.t), yH(f.height)])), class: 'chart__line chart__line--ghost' }, svg);
    el('path', { d: pathOf(frames.map((f) => [x(f.t), yN(f.thrust)])), class: 'chart__line chart__line--live' }, svg);
    // What it's doing, at a few moments.
    const notes: [number, string][] = kind === 'hop' ? [[0.8, 'climbs'], [2.0, 'hovers'], [3.0, 'sinks'], [3.75, 'caught']] : [[0.65, 'climbs'], [1.45, 'rolls'], [2.5, 'caught']];
    for (const [t, text] of notes) {
      const f = frames[Math.min(frames.length - 1, Math.round(t * 60))];
      el('text', { x: x(t), y: Math.min(yN(f.thrust), yN(f.weight)) - rem * 0.5, class: 'chart__note chart__note--accent', 'text-anchor': 'middle' }, svg, text);
    }
    cursor = el('g', { class: 'chart__cursor' }, svg);
    el('line', { x1: 0, x2: 0, y1: top, y2: bottom, class: 'chart__cursor-line' }, cursor);
    cursor.style.display = 'none';
    dots = [0, 1].map(() => el('circle', { cx: 0, cy: 0, r: rem * 0.22, class: 'chart__dot' }, svg));
    for (const dot of dots) dot.style.display = 'none';
  };
  let sized = sizedSvg(host, 'The lift nozzles’ push through a flight, against the car’s weight, and its height.', (w, rem) => Math.min(w * 0.55, rem * 11.5), build);
  return {
    title: String(spec.title ?? ''),
    caption: String(spec.caption ?? ''),
    update() {
      const f = source.aero()?.flight;
      if (f && f.kind !== kind) {
        // A barrel roll after a hop (or the other way round): draw that flight instead.
        kind = f.kind;
        sized.dispose();
        sized = sizedSvg(host, 'The lift nozzles’ push through a flight, against the car’s weight, and its height.', (w, rem) => Math.min(w * 0.55, rem * 11.5), build);
      }
      if (!cursor) return;
      const on = !!f;
      cursor.style.display = on ? '' : 'none';
      for (const dot of dots) dot.style.display = on ? '' : 'none';
      if (!f) return;
      const { x, yN, yH } = map;
      cursor.setAttribute('transform', `translate(${x(f.t).toFixed(1)} 0)`);
      setAttrs(dots[0], { cx: x(f.t).toFixed(1), cy: yN(f.thrust).toFixed(1) });
      setAttrs(dots[1], { cx: x(f.t).toFixed(1), cy: yH(f.height).toFixed(1) });
    },
    destroy() {
      dots = [];
      sized.dispose();
    },
  };
};

export const roadsterCharts: Record<string, ChartFactory> = { suction, downforce, nozzle, flight };
