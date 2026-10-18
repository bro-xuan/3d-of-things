// The reflex camera's charts: the light's path off the mirror to the screen (and, mirror up, to the
// film), the release's sequence in time after the factory's chart, the leaf shutter's opening
// against a focal-plane shutter's slit, the pairs of stop and speed that give the same light, the
// film's frames on the roll, and how far the lens comes out to focus. They read the camera's state
// (src/viewer/reflexcamera.ts), the numbers the model's parts move by.
import {
  FLANGE,
  FRAMES,
  FRAME_PITCH,
  MAX_EXTENSION,
  NEAREST,
  SPEEDS,
  STAGES,
  STOPS,
  REST_SPEED,
  REST_STOP,
  bladeOpening,
  extensionFor,
  lightValue,
  releaseAt,
  releaseEnds,
  speedLabel,
  type ReflexState,
} from '../viewer/reflexcamera';
import type { CameraState } from '../viewer/filmcamera';
import type { ChartFactory } from './index';
import { el, pathOf, plot, setAttrs, sizedSvg } from './svg';

const fmt = (n: number, digits = 1) => n.toLocaleString('en-GB', { maximumFractionDigits: digits, minimumFractionDigits: digits });
const RESTING: ReflexState = {
  kind: 'reflex',
  focus: Infinity,
  extension: 0,
  stop: REST_STOP,
  aperture: STOPS[REST_STOP],
  speed: SPEEDS[REST_SPEED],
  cocked: true,
  running: false,
  shot: null,
  release: { key: 0, blades: 0, iris: 0, mirror: 0, flaps: 0, pressed: 0 },
  winding: null,
  frames: 0,
  slideIn: true,
  preview: false,
  set: { extension: 0, stop: REST_STOP },
};
const reflex = (s: CameraState | ReflexState | null): ReflexState => (s?.kind === 'reflex' ? s : RESTING);
/** Where the mirror crosses the lens's axis, and the screen's height above it (mm): the two make up the flange distance. */
const MIRROR_AT = 41;
const SCREEN_AT = 41;

// -------------------------------------------------------------- the path

/** The camera from the side: lens, mirror, screen and film, the light's path drawn for where the mirror is. */
const path: ChartFactory = (host, { source }) => {
  let mirror: SVGLineElement | undefined;
  let rays: SVGPathElement[] = [];
  let flaps: SVGLineElement[] = [];
  let label: SVGTextElement | undefined;
  let map = { x: (z: number) => z, y: (y: number) => y };
  let shown = NaN;
  const sized = sizedSvg(host, 'The camera seen from the side. Light from the lens hits the mirror at 45 degrees and goes up to the focusing screen, as far from the mirror as the film is. With the mirror up, the light goes straight on to the film.', (w, rem) => Math.min(w * 0.62, rem * 13), (svg, w, h, rem) => {
    // Camera mm to the drawing: z from the film (0) to past the lens (110), y from the floor (-44) to the hood (70).
    const s = Math.min((w - rem * 1.2) / 128, (h - rem * 2.6) / 112);
    const x0 = rem * 0.8 + 6 * s;
    const yTop = rem * 1.6 + 66 * s;
    map = { x: (z: number) => x0 + z * s, y: (y: number) => yTop - y * s };
    const { x, y } = map;
    // The body's outline, the screen, the film and the lens.
    el('rect', { x: x(3.5), y: y(46), width: (72.5 - 3.5) * s, height: 90 * s, class: 'chart__dial' }, svg);
    el('line', { x1: x(12.5), x2: x(69.5), y1: y(SCREEN_AT), y2: y(SCREEN_AT), class: 'chart__line' }, svg);
    el('text', { x: x(41), y: y(SCREEN_AT) - rem * 0.4, class: 'chart__tick', 'text-anchor': 'middle' }, svg, 'screen');
    el('line', { x1: x(0), x2: x(0), y1: y(28), y2: y(-28), class: 'chart__line' }, svg);
    el('text', { x: x(0) - rem * 0.3, y: y(-28) + rem * 1.1, class: 'chart__tick', 'text-anchor': 'start' }, svg, 'film');
    el('path', { d: `M${x(FLANGE)} ${y(30)}L${x(FLANGE + 58)} ${y(30)}L${x(FLANGE + 58)} ${y(-30)}L${x(FLANGE)} ${y(-30)}Z`, class: 'chart__dial' }, svg);
    el('path', { d: `M${x(FLANGE + 30)} ${y(18)}Q${x(FLANGE + 36)} ${y(0)} ${x(FLANGE + 30)} ${y(-18)}Q${x(FLANGE + 24)} ${y(0)} ${x(FLANGE + 30)} ${y(18)}Z`, class: 'chart__glyph chart__glyph--thin' }, svg);
    el('text', { x: x(FLANGE + 29), y: y(30) - rem * 0.4, class: 'chart__tick', 'text-anchor': 'middle' }, svg, 'lens');
    // Rays (amber), the flaps and the mirror, drawn live.
    rays = [0, 1, 2].map(() => el('path', { class: 'chart__light' }, svg));
    flaps = [el('line', { class: 'chart__line' }, svg), el('line', { class: 'chart__line' }, svg)];
    mirror = el('line', { class: 'chart__hand chart__hand--accent' }, svg);
    el('circle', { cx: x(8.6), cy: y(32.4), r: rem * 0.18, class: 'chart__pin' }, svg);
    label = el('text', { x: w - rem * 0.4, y: rem * 0.9, class: 'chart__note chart__note--accent', 'text-anchor': 'end' }, svg);
    shown = NaN;
  });
  const draw = (s: ReflexState) => {
    if (!mirror || s.release.mirror === shown) return;
    const up = s.release.mirror;
    const flapsOpen = s.release.flaps;
    shown = up;
    const { x, y } = map;
    // The mirror turns about its top back edge, from 45° down to flat under the screen.
    const a = (-45 + 45 * up) * (Math.PI / 180);
    const [hz, hy] = [8.6, 32.4];
    const L = 58;
    setAttrs(mirror, { x1: x(hz), y1: y(hy), x2: x(hz + L * Math.cos(a)), y2: y(hy + L * Math.sin(a)) });
    // The rear flaps swing forward from the window's edges.
    const f = (flapsOpen * Math.PI) / 2;
    setAttrs(flaps[0], { x1: x(6.5), y1: y(29.6), x2: x(6.5 + 29.6 * Math.sin(f)), y2: y(29.6 - 29.6 * Math.cos(f)) });
    setAttrs(flaps[1], { x1: x(6.1), y1: y(-29.6), x2: x(6.1 + 29.6 * Math.sin(f)), y2: y(-29.6 + 29.6 * Math.cos(f)) });
    // Rays from the lens: off the mirror and up, or (mirror up) straight back to the film.
    const offsets = [14, 0, -14];
    offsets.forEach((dy, i) => {
      const start: [number, number] = [x(FLANGE + 22), y(dy * 0.55)];
      if (up < 0.5) {
        // Where a ray at height h meets the mirror (y + z = 41, mirror down): z = 41 - h; then it goes up to the screen.
        const zHit = MIRROR_AT - dy * 0.3;
        const hHit = dy * 0.3;
        rays[i].setAttribute('d', pathOf([start, [x(zHit), y(hHit)], [x(zHit), y(SCREEN_AT)]]));
      } else {
        rays[i].setAttribute('d', flapsOpen > 0.5 ? pathOf([start, [x(0), y(-dy)]]) : pathOf([start, [x(8), y(-dy * 0.85)]]));
      }
    });
    label!.textContent = up < 0.02 ? `${fmt(FLANGE - MIRROR_AT)} + ${fmt(SCREEN_AT)} = ${fmt(FLANGE)} mm, lens to screen` : up >= 0.98 ? (flapsOpen > 0.5 ? 'mirror up, flaps open: light reaches the film' : 'mirror up: the finder goes dark') : 'the mirror swings up';
  };
  draw(RESTING);
  return {
    title: 'Mirror down, mirror up',
    caption: `The screen is exactly as far from the lens as the film is, ${fmt(FLANGE)} mm by way of the mirror, so whatever is sharp on the screen will be sharp in the picture.`,
    update() {
      draw(reflex(source.camera()));
    },
    destroy() {
      rays = [];
      flaps = [];
      sized.dispose();
    },
  };
};

// -------------------------------------------------------------- sequence

/** The release in time, after the factory's chart: the drive key's turn, the mirror, the rear flaps, the lens's shutter
 *  and its iris, each against the same milliseconds, with a cursor at now. */
const sequence: ChartFactory = (host, { source }) => {
  let cursor: SVGGElement | undefined;
  let rows: SVGPathElement[] = [];
  let axisEnd: SVGTextElement | undefined;
  let layout = { left: 0, right: 0, rowTop: (_i: number) => 0, rowH: 0 };
  let shownSpeed = NaN;
  let span = 1;
  const names = ['Drive key', 'Mirror', 'Rear flaps', 'Lens shutter', 'Iris'];
  const sized = sizedSvg(host, 'The release step by step against time: the drive key turns, the lens closes and stops down, the mirror swings up, the rear flaps open, the lens’s shutter opens for the exposure, and the flaps close again.', (_w, rem) => rem * (1.8 + names.length * 2.3) + rem * 1.6, (svg, w, _h, rem) => {
    const left = rem * 6.2;
    const right = w - rem * 0.6;
    const rowH = rem * 1.5;
    const rowTop = (i: number) => rem * 1.2 + i * rem * 2.3;
    layout = { left, right, rowTop, rowH };
    names.forEach((name, i) => {
      el('text', { x: 0, y: rowTop(i) + rowH * 0.62, class: 'chart__tick' }, svg, name);
      el('line', { x1: left, x2: right, y1: rowTop(i) + rowH, y2: rowTop(i) + rowH, class: 'chart__axis' }, svg);
      el('line', { x1: left, x2: right, y1: rowTop(i), y2: rowTop(i), class: 'chart__grid' }, svg);
    });
    rows = names.map(() => el('path', { class: 'chart__line' }, svg));
    const bottom = rowTop(names.length - 1) + rowH;
    el('text', { x: left, y: bottom + rem * 1.25, class: 'chart__tick' }, svg, '0');
    axisEnd = el('text', { x: right, y: bottom + rem * 1.25, class: 'chart__tick', 'text-anchor': 'end' }, svg);
    cursor = el('g', { class: 'chart__cursor' }, svg);
    el('line', { y1: rowTop(0) - rem * 0.3, y2: bottom, class: 'chart__cursor-line' }, cursor);
    shownSpeed = NaN;
  });
  const draw = (s: ReflexState) => {
    if (!cursor) return;
    const { left, right, rowTop, rowH } = layout;
    if (s.speed !== shownSpeed) {
      shownSpeed = s.speed;
      span = releaseEnds(s.speed) * 1.06;
      const x = (t: number) => left + (t / span) * (right - left);
      const value = (i: number, t: number) => {
        const v = releaseAt(t, s.speed);
        return [v.key / (30 / 35), v.mirror, v.flaps, 1 - v.blades, 1 - v.iris][i];
      };
      rows.forEach((row, i) => {
        row.setAttribute('d', pathOf(plot((t) => value(i, t), 0, span, x, (v) => rowTop(i) + rowH - v * rowH, 360)));
      });
      axisEnd!.textContent = span >= 100 ? `${Math.round(span)} ms` : `${fmt(span)} ms`;
    }
    const t = s.shot;
    cursor.style.display = t === null ? 'none' : '';
    if (t !== null) cursor.setAttribute('transform', `translate(${(left + (Math.min(t, span) / span) * (right - left)).toFixed(1)} 0)`);
  };
  draw(RESTING);
  return {
    title: 'Pressing the release',
    caption: `First the lens closes and the mirror lifts out of the way, then the flaps open; only then, ${STAGES.fire} ms in, does the shutter open, for ${speedLabel(SPEEDS[REST_SPEED])} here. The key’s angles are the factory’s: 117°, 268° as it fires, 309° at the end.`,
    update() {
      draw(reflex(source.camera()));
    },
    destroy() {
      rows = [];
      sized.dispose();
    },
  };
};

// ---------------------------------------------------------------- leaf

/** The leaf shutter's opening against time at the speed set: the whole picture opens at once, unlike a focal-plane
 *  shutter's slit, so a flash can go off at any speed. */
const leaf: ChartFactory = (host, { source }) => {
  let curve: SVGPathElement | undefined;
  let area: SVGPathElement | undefined;
  let note: SVGTextElement | undefined;
  let axisEnd: SVGTextElement | undefined;
  let g = { left: 0, right: 0, top: 0, bottom: 0 };
  let shown = NaN;
  const sized = sizedSvg(host, 'How far the leaf shutter is open against time: its blades swing open, stay open for the exposure and swing shut, uncovering the whole picture at once.', (w, rem) => Math.min(w * 0.5, rem * 10), (svg, w, h, rem) => {
    const left = rem * 2.6;
    const right = w - rem * 0.6;
    const top = rem * 1.7;
    const bottom = h - rem * 2.3;
    g = { left, right, top, bottom };
    el('text', { x: 0, y: rem * 0.8, class: 'chart__tick' }, svg, 'Open, %');
    for (const p of [0, 50, 100]) {
      const yy = bottom - (p / 100) * (bottom - top);
      el('line', { x1: left - rem * 0.3, x2: right, y1: yy, y2: yy, class: p ? 'chart__grid' : 'chart__axis' }, svg);
      el('text', { x: left - rem * 0.5, y: yy + rem * 0.28, class: 'chart__tick', 'text-anchor': 'end' }, svg, String(p));
    }
    el('text', { x: left, y: bottom + rem * 1.25, class: 'chart__tick' }, svg, '0');
    axisEnd = el('text', { x: right, y: bottom + rem * 1.25, class: 'chart__tick', 'text-anchor': 'end' }, svg);
    area = el('path', { class: 'chart__area' }, svg);
    curve = el('path', { class: 'chart__line' }, svg);
    note = el('text', { x: right, y: top - rem * 0.5, class: 'chart__note chart__note--accent', 'text-anchor': 'end' }, svg);
    shown = NaN;
  });
  const draw = (s: ReflexState) => {
    if (!curve || s.speed === shown) return;
    shown = s.speed;
    const { left, right, top, bottom } = g;
    const total = (s.speed * 1000 + STAGES.blade) * 1.25;
    const x = (t: number) => left + (t / total) * (right - left);
    const y = (v: number) => bottom - v * (bottom - top);
    const pts = plot((t) => bladeOpening(t, s.speed), 0, total, x, y, 200);
    curve.setAttribute('d', pathOf(pts));
    area!.setAttribute('d', `${pathOf([[x(0), y(0)], ...pts, [x(total), y(0)]])}Z`);
    axisEnd!.textContent = total >= 100 ? `${Math.round(total)} ms` : `${fmt(total)} ms`;
    note!.textContent = `${speedLabel(s.speed)}: all of the picture at once`;
  };
  draw(RESTING);
  return {
    title: 'A shutter in the lens',
    caption: 'Five blades swing open from the middle and shut again, so the whole picture is lit at the same moment. A focal-plane shutter only does that up to 1/50 s; a leaf shutter can take a flash at every speed.',
    update() {
      draw(reflex(source.camera()));
    },
    destroy: sized.dispose,
  };
};

// ------------------------------------------------------------------ light

/** Stops against speeds: the cells that let in the same light as the pair set, a diagonal, with the pair marked. */
const pairs: ChartFactory = (host, { source }) => {
  let cells: SVGRectElement[] = [];
  let mark: SVGCircleElement | undefined;
  let note: SVGTextElement | undefined;
  let grid = { left: 0, top: 0, cw: 0, ch: 0 };
  let shown = '';
  const speeds = SPEEDS.slice(2);
  const sized = sizedSvg(host, 'Every pair of aperture and shutter speed, with the pairs that let in the same light as the one set shown along a diagonal.', (_w, rem) => rem * 1.8 + speeds.length * rem * 1.05 + rem * 2.7, (svg, w, _h, rem) => {
    const left = rem * 2.6;
    const top = rem * 1.4;
    const cw = (w - left - rem * 0.4) / STOPS.length;
    const ch = rem * 1.05;
    grid = { left, top, cw, ch };
    cells = [];
    speeds.forEach((sp, j) => {
      el('text', { x: left - rem * 0.4, y: top + j * ch + ch * 0.7, class: 'chart__tick', 'text-anchor': 'end' }, svg, sp >= 1 ? '1' : `1/${Math.round(1 / sp)}`);
      STOPS.forEach((_n, i) => cells.push(el('rect', { x: left + i * cw + 1, y: top + j * ch + 1, width: cw - 2, height: ch - 2, class: 'chart__bar' }, svg)));
    });
    STOPS.forEach((n, i) => el('text', { x: left + i * cw + cw / 2, y: top - rem * 0.35, class: 'chart__tick', 'text-anchor': 'middle' }, svg, String(n)));
    mark = el('circle', { r: Math.min(cw, ch) * 0.28, class: 'chart__dot' }, svg);
    // The setting on one line and what it means on the next: on one, it runs off the page.
    note = el('text', { x: left, y: top + speeds.length * ch + rem * 1.2, class: 'chart__note' }, svg);
    el('text', { x: left, y: top + speeds.length * ch + rem * 2.3, class: 'chart__note' }, svg, 'the same as every marked pair');
    shown = '';
  });
  const draw = (s: ReflexState) => {
    if (!mark) return;
    const stop = Math.round(s.set.stop);
    const key = `${stop}:${s.speed}`;
    if (key === shown) return;
    shown = key;
    const ev = Math.round(lightValue(STOPS[stop], s.speed));
    speeds.forEach((sp, j) => STOPS.forEach((n, i) => cells[j * STOPS.length + i].classList.toggle('is-picked', Math.round(lightValue(n, sp)) === ev)));
    const j = speeds.indexOf(s.speed);
    const { left, top, cw, ch } = grid;
    mark.style.display = j < 0 ? 'none' : '';
    if (j >= 0) setAttrs(mark, { cx: left + stop * cw + cw / 2, cy: top + j * ch + ch / 2 });
    note!.textContent = `f/${STOPS[stop]} at ${speedLabel(s.speed)}: light value ${ev},`;
  };
  draw(RESTING);
  return {
    title: 'The same light, many ways',
    caption: 'Each stop smaller halves the light and each speed slower doubles it, so the marked pairs all expose the film alike. The lens’s rings can be locked together to step along this diagonal.',
    update() {
      draw(reflex(source.camera()));
    },
    destroy() {
      cells = [];
      sized.dispose();
    },
  };
};

// ------------------------------------------------------------------- roll

/** The roll of 120 film: twelve 56 mm frames 60.5 mm apart, the ones taken shaded, sliding along as it winds. */
const roll: ChartFactory = (host, { source }) => {
  let strip: SVGGElement | undefined;
  let cellsTaken: SVGRectElement[] = [];
  let reading: SVGTextElement | undefined;
  let scale = 1;
  let gate = 0;
  let shown = NaN;
  const sized = sizedSvg(host, 'The roll of film as it winds past the picture window: twelve square frames, each taken one shaded, the film moving one frame along for each turn of the knob.', (w, rem) => (w - rem * 0.8) / (FRAME_PITCH * 3.4) * 61.5 + rem * 3.6, (svg, w, h, rem) => {
    scale = (w - rem * 0.8) / (FRAME_PITCH * 3.4);
    gate = w / 2;
    const y0 = rem * 1.4;
    const fh = 56 * scale;
    // The roll is seen through a window the chart's width, as the 35 mm strip is.
    const clip = el('clipPath', { id: 'roll-window' }, el('defs', {}, svg));
    el('rect', { x: rem * 0.2, y: 0, width: w - rem * 0.4, height: h }, clip);
    strip = el('g', {}, el('g', { 'clip-path': 'url(#roll-window)' }, svg));
    el('rect', { x: -FRAME_PITCH * scale * 0.5, y: y0 - 2.75 * scale, width: FRAME_PITCH * FRAMES * scale, height: (56 + 5.5) * scale, class: 'chart__film' }, strip);
    cellsTaken = Array.from({ length: FRAMES }, (_, k) => {
      const c = el('rect', { x: k * FRAME_PITCH * scale - 28 * scale, y: y0, width: 56 * scale, height: fh, class: 'chart__frame-cell' }, strip!);
      el('text', { x: k * FRAME_PITCH * scale, y: y0 + fh / 2 + rem * 0.3, class: 'chart__film-label', 'text-anchor': 'middle' }, strip!, String(k + 1));
      return c;
    });
    el('rect', { x: gate - 28 * scale, y: y0 - rem * 0.25, width: 56 * scale, height: fh + rem * 0.5, class: 'chart__gate' }, svg);
    reading = el('text', { x: gate, y: y0 + fh + rem * 1.25, class: 'chart__value chart__value--ink', 'text-anchor': 'middle' }, svg);
    shown = NaN;
  });
  const draw = (s: ReflexState) => {
    if (!strip || s.frames === shown) return;
    shown = s.frames;
    strip.setAttribute('transform', `translate(${(gate - s.frames * FRAME_PITCH * scale).toFixed(1)} 0)`);
    const taken = s.cocked ? Math.floor(s.frames + 1e-6) : Math.floor(s.frames + 1e-6) + 1;
    cellsTaken.forEach((c, k) => c.classList.toggle('is-picked', k < taken));
    const n = Math.min(FRAMES, Math.round(s.frames) + 1);
    reading!.textContent = s.winding !== null ? 'winding on' : `frame ${n} of ${FRAMES} in the window`;
  };
  draw(RESTING);
  return {
    title: 'Twelve on a roll',
    caption: `Each turn of the knob winds the film on ${fmt(FRAME_PITCH)} mm: a 56 mm square and a narrow gap. The magazine counts the frames, so the gaps stay even as the take-up spool fills.`,
    update() {
      draw(reflex(source.camera()));
    },
    destroy() {
      cellsTaken = [];
      sized.dispose();
    },
  };
};

// ---------------------------------------------------------------- focus

/** How far the lens comes out to focus, against distance, with the setting marked. */
const focus: ChartFactory = (host, { source }) => {
  let dot: SVGGElement | undefined;
  let reading: SVGTextElement | undefined;
  let x = (_m: number) => 0;
  let yOf = (_e: number) => 0;
  let edge = { flip: Infinity, nudge: 0 };
  let shown = NaN;
  const top = Math.ceil(MAX_EXTENSION);
  const sized = sizedSvg(host, `How far the lens comes forward to focus, against the distance focused on: ${fmt(MAX_EXTENSION)} mm at ${NEAREST} metres, falling away to nothing at infinity.`, (w, rem) => Math.min(w * 0.55, rem * 11.5), (svg, w, h, rem) => {
    const left = rem * 2.4;
    const right = w - rem * 1.6;
    const t0 = rem * 1.6;
    const bottom = h - rem * 2.3;
    const [lo, hi] = [Math.log10(NEAREST), Math.log10(50)];
    x = (m) => (Number.isFinite(m) ? left + ((Math.log10(m) - lo) / (hi - lo)) * (right - left - rem * 1.6) : right);
    yOf = (e) => bottom - (e / top) * (bottom - t0);
    el('text', { x: 0, y: rem * 0.8, class: 'chart__tick' }, svg, 'Lens out, mm');
    for (let e = 0; e <= top; e += 2) {
      el('line', { x1: left - rem * 0.3, x2: right, y1: yOf(e), y2: yOf(e), class: e ? 'chart__grid' : 'chart__axis' }, svg);
      el('text', { x: left - rem * 0.5, y: yOf(e) + rem * 0.28, class: 'chart__tick', 'text-anchor': 'end' }, svg, String(e));
    }
    for (const [m, label] of [[NEAREST, '0.9'], [2, '2'], [5, '5'], [20, '20 m'], [Infinity, '∞']] as const) {
      el('text', { x: x(m), y: bottom + rem * 1.25, class: 'chart__tick', 'text-anchor': 'middle' }, svg, label);
    }
    el('path', { d: pathOf(plot((t) => extensionFor(10 ** t), lo, hi, (t) => x(10 ** t), yOf, 160)), class: 'chart__line' }, svg);
    el('path', { d: pathOf([[x(50), yOf(extensionFor(50))], [right, yOf(0)]]), class: 'chart__line chart__line--dashed' }, svg);
    dot = el('g', { class: 'chart__cursor' }, svg);
    el('circle', { r: rem * 0.3, class: 'chart__dot' }, dot);
    reading = el('text', { x: rem * 0.6, y: -rem * 0.5, class: 'chart__value' }, dot);
    edge = { flip: w - rem * 4.2, nudge: rem * 0.6 };
    shown = NaN;
  });
  const draw = (s: ReflexState) => {
    if (!dot || Math.abs(s.extension - shown) < 1e-4) return;
    shown = s.extension;
    const m = Number.isFinite(s.focus) && s.focus <= 50 ? s.focus : Infinity;
    dot.setAttribute('transform', `translate(${x(m).toFixed(1)} ${yOf(s.extension).toFixed(1)})`);
    // Near the right edge the reading goes on the dot's other side, so it stays on the page.
    const flip = x(m) > edge.flip;
    setAttrs(reading!, { x: flip ? -edge.nudge : edge.nudge, 'text-anchor': flip ? 'end' : 'start' });
    reading!.textContent = `${fmt(s.extension, 2)} mm`;
  };
  draw(RESTING);
  return {
    title: 'How far the glass moves',
    caption: `An 80 mm lens focuses on infinity 80 mm from the film; nearer things form their image further back, so the glass comes forward, ${fmt(MAX_EXTENSION)} mm for the nearest ${NEAREST} m.`,
    update() {
      draw(reflex(source.camera()));
    },
    destroy: sized.dispose,
  };
};

export const reflexCharts: Record<string, ChartFactory> = {
  'reflex-path': path,
  'release-sequence': sequence,
  'leaf-shutter': leaf,
  'light-pairs': pairs,
  'film-roll': roll,
  'reflex-focus': focus,
};

