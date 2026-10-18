// The rangefinder camera's charts: the view in the finder as you focus, the triangle the rangefinder
// closes, how far the lens comes out, the shutter's two curtains in time, the iris at each stop and
// the film winding on. They read the camera's state (src/viewer/filmcamera.ts), the same numbers the
// model's parts move by.
import {
  CURTAIN_TRAVEL,
  FINDER_MAGNIFICATION,
  FRAME_ADVANCE,
  FRAME_WIDTH,
  MAX_EXTENSION,
  NEAREST,
  RANGEFINDER_BASE,
  STOPS,
  STROKES,
  curtainAt,
  distanceLabel,
  extensionFor,
  rangefinderAngle,
  slitWidth,
  speedLabel,
  type CameraState,
} from '../viewer/filmcamera';
import type { ReflexState } from '../viewer/reflexcamera';
import type { ChartFactory } from './index';
import { el, pathOf, plot, setAttrs, sizedSvg } from './svg';

const fmt = (n: number, digits = 1) => n.toLocaleString('en-GB', { maximumFractionDigits: digits, minimumFractionDigits: digits });
/** A camera at rest, before the viewer has loaded: focused at infinity, f/5.6, 1/250, cocked. */
const RESTING: CameraState = { kind: 'rangefinder', focus: Infinity, extension: 0, stop: 4, aperture: 5.6, speed: 1 / 250, cocked: true, running: false, shot: null, curtains: [0, 0], strokes: 0, lever: 0, frames: 0, set: { extension: 0, stop: 4 } };

/** The rangefinder's state, or its resting one before the viewer is there (or if it's some other camera). */
const rangefinder = (s: CameraState | ReflexState | null): CameraState => (s?.kind === 'rangefinder' ? s : RESTING);

/** A standing figure, drawn in ink from its feet at (x, y), `h` tall. */
function figure(parent: SVGElement, x: number, y: number, h: number, cls: string): SVGGElement {
  const g = el('g', { class: cls }, parent);
  const head = h * 0.13;
  el('circle', { cx: x, cy: y - h + head, r: head }, g);
  el('path', { d: `M${x} ${y - h + head * 2}V${y - h * 0.42}M${x - h * 0.2} ${y - h * 0.7}L${x} ${y - h * 0.62}L${x + h * 0.2} ${y - h * 0.7}M${x - h * 0.13} ${y}L${x} ${y - h * 0.42}L${x + h * 0.13} ${y}` }, g);
  return g;
}

// ------------------------------------------------------------- the finder

/** The view through the finder: the scene in ink, and in the middle the rangefinder's patch, its second picture (in
 *  vermilion) slid sideways by the difference between where the lens is focused and where the subject is. */
const finder: ChartFactory = (host, { source, spec }) => {
  const subject = Number(spec.subject ?? 2);
  let ghost: SVGGElement | undefined;
  let far: SVGGElement | undefined;
  let reading: SVGTextElement | undefined;
  let mark: SVGTextElement | undefined;
  let perDegree = 0;
  let shown = NaN;
  const sized = sizedSvg(host, `The view through the viewfinder of someone standing ${distanceLabel(subject)} away, with the rangefinder's patch in the middle. A second picture in the patch slides across as the lens is focused, and lines up with the main view when the focus is right.`, (w, rem) => Math.min(w * 0.66, rem * 15) + rem * 1.2, (svg, w, h, rem) => {
    const fw = w - rem * 0.4;
    const fh = h - rem * 3.4;
    const [x0, y0] = [rem * 0.2, rem * 0.2];
    const cx = x0 + fw / 2;
    const horizon = y0 + fh * 0.62;
    // Drawn about 32° across, a closer view than the finder's own, so the patch's picture can be seen to slide.
    perDegree = fw / 32;
    const clip = el('clipPath', { id: 'finder-field' }, el('defs', {}, svg));
    el('rect', { x: x0, y: y0, width: fw, height: fh, rx: rem * 0.5 }, clip);
    el('rect', { x: x0, y: y0, width: fw, height: fh, rx: rem * 0.5, class: 'chart__dial' }, svg);
    const field = el('g', { 'clip-path': 'url(#finder-field)' }, svg);
    const scene = (parent: SVGElement, cls: string) => {
      const g = el('g', { class: cls }, parent);
      // Hills and a tree, far off.
      el('path', { d: pathOf(plot((t) => Math.sin(t * 2.3) * 0.5 + Math.sin(t * 5.1 + 1) * 0.25, -1.4, 1.4, (t) => cx + t * fw * 0.4, (v) => horizon - fh * 0.08 - v * fh * 0.05, 80)) }, g);
      el('path', { d: `M${cx + fw * 0.3} ${horizon - fh * 0.02}V${horizon - fh * 0.2}M${cx + fw * 0.3 - fh * 0.06} ${horizon - fh * 0.16}L${cx + fw * 0.3} ${horizon - fh * 0.27}L${cx + fw * 0.3 + fh * 0.06} ${horizon - fh * 0.16}` }, g);
      return g;
    };
    // The patch is brighter than the rest of the view; both pictures show in it, the main one and the small window's.
    const [pw, ph] = [fw * 0.2, fh * 0.32];
    const patchBox = { x: cx - pw / 2, y: horizon - ph * 0.85, width: pw, height: ph };
    el('rect', { ...patchBox, class: 'chart__patch' }, field);
    el('line', { x1: x0, x2: x0 + fw, y1: horizon, y2: horizon, class: 'chart__grid' }, field);
    scene(field, 'chart__glyph chart__glyph--thin');
    figure(field, cx, horizon + fh * 0.22, fh * 0.62, 'chart__glyph');
    // The bright frame lines for a 50 mm lens.
    el('rect', { x: x0 + fw * 0.12, y: y0 + fh * 0.1, width: fw * 0.76, height: fh * 0.8, class: 'chart__frame' }, field);
    const patchClip = el('clipPath', { id: 'finder-patch' }, el('defs', {}, svg));
    el('rect', patchBox, patchClip);
    const patch = el('g', { 'clip-path': 'url(#finder-patch)' }, field);
    far = scene(patch, 'chart__glyph chart__glyph--accent chart__glyph--thin');
    ghost = figure(patch, cx, horizon + fh * 0.22, fh * 0.62, 'chart__glyph chart__glyph--accent');
    reading = el('text', { x: x0, y: y0 + fh + rem * 1.25, class: 'chart__tick' }, svg);
    mark = el('text', { x: x0, y: y0 + fh + rem * 2.6, class: 'chart__note chart__note--accent' }, svg);
    shown = NaN;
  });
  const draw = (state: CameraState) => {
    if (!ghost || !far || Math.abs(state.extension - shown) < 1e-4) return;
    shown = state.extension;
    // The small window sits to the right of the finder (seen from behind): a near subject shows to the left until
    // the lens is focused on it.
    const set = rangefinderAngle(state.focus);
    const offset = (target: number) => -(rangefinderAngle(target) - set) * FINDER_MAGNIFICATION * perDegree;
    ghost.setAttribute('transform', `translate(${offset(subject).toFixed(2)} 0)`);
    far.setAttribute('transform', `translate(${offset(Infinity).toFixed(2)} 0)`);
    reading!.textContent = `Focused at ${distanceLabel(state.focus)} · subject ${distanceLabel(subject)}`;
    const off = Math.abs(rangefinderAngle(subject) - set);
    mark!.textContent = off < 0.03 ? 'in focus: the pictures meet' : off < 0.25 ? 'nearly' : '';
  };
  draw(RESTING);
  return {
    title: 'In the viewfinder',
    caption: `The patch in the middle is the view from the small window, 68.5 mm to the side. Its picture of the figure only sits on the main one when the lens is focused at the figure's distance. (The far hills line up at infinity.)`,
    update() {
      draw(rangefinder(source.camera()));
    },
    destroy: sized.dispose,
  };
};

// ------------------------------------------------------------ the triangle

/** Seen from above: the two windows 68.5 mm apart, and the small window's line of sight swung in until it meets the
 *  subject straight ahead of the finder. Distances are squeezed so the near ones have room. */
const triangle: ChartFactory = (host, { source, spec }) => {
  const subject = Number(spec.subject ?? 2);
  let ray: SVGLineElement | undefined;
  let hit: SVGCircleElement | undefined;
  let angle: SVGTextElement | undefined;
  let y = (_m: number) => 0;
  let ends = { rf: [0, 0], vf: [0, 0] };
  let shown = NaN;
  const sized = sizedSvg(host, 'The rangefinder from above: the viewfinder looks straight ahead; the small window, 68.5 mm to the side, looks in at an angle set by the lens. When its line meets the subject, the lens is focused there.', (w, rem) => Math.min(w * 0.75, rem * 15), (svg, w, h, rem) => {
    const bottom = h - rem * 2.6;
    const top = rem * 1.2;
    // A squeezed scale: infinity at the top, the nearest focus low down.
    y = (m) => bottom - (bottom - top) * (Number.isFinite(m) ? 1 - 0.55 / m : 1);
    const [vx, rx] = [w * 0.62, w * 0.3];
    ends = { rf: [rx, bottom], vf: [vx, bottom] };
    el('rect', { x: rx - rem * 1.4, y: bottom, width: vx - rx + rem * 2.8, height: rem * 1.1, rx: rem * 0.25, class: 'chart__dial' }, svg);
    el('text', { x: (rx + vx) / 2, y: bottom + rem * 2.25, class: 'chart__tick', 'text-anchor': 'middle' }, svg, `${RANGEFINDER_BASE} mm`);
    el('text', { x: rx, y: bottom + rem * 0.8, class: 'chart__tick', 'text-anchor': 'middle' }, svg, 'RF');
    el('text', { x: vx, y: bottom + rem * 0.8, class: 'chart__tick', 'text-anchor': 'middle' }, svg, 'VF');
    for (const m of [NEAREST, 1, 2, 5, Infinity]) {
      el('line', { x1: vx + rem * 0.3, x2: vx + rem * 0.8, y1: y(m), y2: y(m), class: 'chart__axis' }, svg);
      el('text', { x: vx + rem * 1.1, y: y(m) + rem * 0.28, class: 'chart__tick' }, svg, distanceLabel(m));
    }
    el('line', { x1: vx, x2: vx, y1: bottom, y2: top - rem * 0.3, class: 'chart__line' }, svg);
    figure(svg, vx, y(subject), rem * 1.6, 'chart__glyph');
    ray = el('line', { x1: rx, y1: bottom, class: 'chart__flow' }, svg);
    hit = el('circle', { r: rem * 0.3, class: 'chart__dot' }, svg);
    angle = el('text', { x: rx - rem * 0.5, y: bottom - rem * 0.7, class: 'chart__value', 'text-anchor': 'end' }, svg);
    shown = NaN;
  });
  const draw = (state: CameraState) => {
    if (!ray || Math.abs(state.extension - shown) < 1e-4) return;
    shown = state.extension;
    const meet = y(state.focus);
    const [rx, ry] = ends.rf;
    const [vx] = ends.vf;
    // Carry the line on past the finder's axis a little, so it reads as a line of sight.
    setAttrs(ray, { x2: (vx + (vx - rx) * 0.12).toFixed(1), y2: (meet + (meet - ry) * 0.12).toFixed(1) });
    setAttrs(hit, { cx: vx, cy: meet.toFixed(1) });
    angle!.textContent = `${fmt(rangefinderAngle(state.focus), 2)}°`;
    hit!.classList.toggle('chart__dot--ink', Math.abs(rangefinderAngle(state.focus) - rangefinderAngle(subject)) > 0.03);
  };
  draw(RESTING);
  return {
    title: 'The triangle',
    caption: 'Base and angle fix the distance, as a surveyor measures across a river: 68.5 mm and 1.96° put the figure 2 m off. The lens’s cam sets the angle; seeing the pictures meet tells you it’s right.',
    update() {
      draw(rangefinder(source.camera()));
    },
    destroy: sized.dispose,
  };
};

// ----------------------------------------------------------------- focus

/** How far the lens comes out for each distance: nothing for infinity, 4.5 mm for the nearest 0.7 m. */
const extension: ChartFactory = (host, { source }) => {
  let dot: SVGGElement | undefined;
  let reading: SVGTextElement | undefined;
  let x = (_m: number) => 0;
  let yOf = (_e: number) => 0;
  let edge = { flip: Infinity, nudge: 0 };
  let shown = NaN;
  const sized = sizedSvg(host, 'How far the lens comes forward to focus, against the distance focused on: 4.5 mm at 0.7 metres, 3 mm at one metre, 1.4 mm at two, falling away to nothing at infinity.', (w, rem) => Math.min(w * 0.55, rem * 11.5), (svg, w, h, rem) => {
    const left = rem * 2.4;
    const right = w - rem * 1.6;
    const top = rem * 1.6;
    const bottom = h - rem * 2.3;
    // Distance on a log scale from the nearest focus to 30 m, with infinity just beyond.
    const [lo, hi] = [Math.log10(NEAREST), Math.log10(30)];
    x = (m) => (Number.isFinite(m) ? left + ((Math.log10(m) - lo) / (hi - lo)) * (right - left - rem * 1.6) : right);
    yOf = (e) => bottom - (e / 5) * (bottom - top);
    el('text', { x: 0, y: rem * 0.8, class: 'chart__tick' }, svg, 'Lens out, mm');
    for (const e of [0, 1, 2, 3, 4, 5]) {
      el('line', { x1: left - rem * 0.3, x2: right, y1: yOf(e), y2: yOf(e), class: e ? 'chart__grid' : 'chart__axis' }, svg);
      el('text', { x: left - rem * 0.5, y: yOf(e) + rem * 0.28, class: 'chart__tick', 'text-anchor': 'end' }, svg, String(e));
    }
    for (const [m, label] of [[NEAREST, '0.7'], [1, '1'], [2, '2'], [5, '5'], [10, '10 m'], [Infinity, '∞']] as const) {
      el('text', { x: x(m), y: bottom + rem * 1.25, class: 'chart__tick', 'text-anchor': 'middle' }, svg, label);
    }
    el('path', { d: pathOf(plot((t) => extensionFor(10 ** t), lo, hi, (t) => x(10 ** t), yOf, 160)), class: 'chart__line' }, svg);
    el('path', { d: pathOf([[x(30), yOf(extensionFor(30))], [right, yOf(0)]]), class: 'chart__line chart__line--dashed' }, svg);
    el('text', { x: x(1) + rem * 0.4, y: yOf(extensionFor(1)) - rem * 0.4, class: 'chart__note' }, svg, 'near things need the lens further out');
    dot = el('g', { class: 'chart__cursor' }, svg);
    el('circle', { r: rem * 0.3, class: 'chart__dot' }, dot);
    reading = el('text', { x: rem * 0.6, y: -rem * 0.5, class: 'chart__value' }, dot);
    edge = { flip: w - rem * 4.2, nudge: rem * 0.6 };
    shown = NaN;
  });
  const draw = (state: CameraState) => {
    if (!dot || Math.abs(state.extension - shown) < 1e-4) return;
    shown = state.extension;
    const m = Number.isFinite(state.focus) && state.focus <= 30 ? state.focus : Infinity;
    dot.setAttribute('transform', `translate(${x(m).toFixed(1)} ${yOf(state.extension).toFixed(1)})`);
    // Near the right edge the reading goes on the dot's other side, so it stays on the page.
    const flip = x(m) > edge.flip;
    setAttrs(reading!, { x: flip ? -edge.nudge : edge.nudge, 'text-anchor': flip ? 'end' : 'start' });
    reading!.textContent = `${fmt(state.extension, 2)} mm`;
  };
  draw(RESTING);
  return {
    title: 'How far the lens moves',
    caption: `A lens focuses on infinity at its focal length; anything nearer forms its image further back, so the glass has to come forward, ${fmt(MAX_EXTENSION)} mm for the nearest 0.7 m. The rangefinder’s cam moves exactly as far.`,
    update() {
      draw(rangefinder(source.camera()));
    },
    destroy: sized.dispose,
  };
};

// --------------------------------------------------------------- shutter

/** The two curtains' edges across the frame against time, at the speed set: the gap between them is the slit, the
 *  same width all the way across, and its time over any point is the exposure. */
const shutter: ChartFactory = (host, { source }) => {
  let cursor: SVGGElement | undefined;
  let curves: SVGPathElement[] = [];
  let band: SVGPathElement | undefined;
  let note: SVGTextElement | undefined;
  let axisEnd: SVGTextElement | undefined;
  let geometry = { left: 0, right: 0, top: 0, bottom: 0 };
  let shownSpeed = NaN;
  let span = 1;
  const sized = sizedSvg(host, 'How the shutter’s two curtains cross the frame over time: the first sets off, the second follows after the exposure time, and between them a slit of light sweeps across the film.', (w, rem) => Math.min(w * 0.6, rem * 12.5), (svg, w, h, rem) => {
    const left = rem * 2.6;
    const right = w - rem * 0.6;
    const top = rem * 1.7;
    const bottom = h - rem * 2.3;
    geometry = { left, right, top, bottom };
    el('text', { x: 0, y: rem * 0.8, class: 'chart__tick' }, svg, 'Across the frame, mm');
    for (const mm of [0, 18, 36]) {
      el('line', { x1: left - rem * 0.3, x2: right, y1: bottom - (mm / FRAME_WIDTH) * (bottom - top), y2: bottom - (mm / FRAME_WIDTH) * (bottom - top), class: mm ? 'chart__grid' : 'chart__axis' }, svg);
      el('text', { x: left - rem * 0.5, y: bottom - (mm / FRAME_WIDTH) * (bottom - top) + rem * 0.28, class: 'chart__tick', 'text-anchor': 'end' }, svg, String(mm));
    }
    el('text', { x: left, y: bottom + rem * 1.25, class: 'chart__tick' }, svg, '0');
    axisEnd = el('text', { x: right, y: bottom + rem * 1.25, class: 'chart__tick', 'text-anchor': 'end' }, svg);
    band = el('path', { class: 'chart__area' }, svg);
    curves = [el('path', { class: 'chart__line' }, svg), el('path', { class: 'chart__line chart__line--dashed' }, svg)];
    note = el('text', { x: right, y: top - rem * 0.5, class: 'chart__note chart__note--accent', 'text-anchor': 'end' }, svg);
    cursor = el('g', { class: 'chart__cursor' }, svg);
    el('line', { y1: top, y2: bottom, class: 'chart__cursor-line' }, cursor);
    shownSpeed = NaN;
  });
  const draw = (state: CameraState) => {
    if (!band || !cursor) return;
    const { left, right, top, bottom } = geometry;
    if (state.speed !== shownSpeed) {
      shownSpeed = state.speed;
      span = (state.speed + CURTAIN_TRAVEL) * 1.08;
      const x = (t: number) => left + (t / span) * (right - left);
      const y = (f: number) => bottom - f * (bottom - top);
      const first = plot((t) => curtainAt(t), 0, CURTAIN_TRAVEL, x, y, 60);
      const second = plot((t) => curtainAt(t - state.speed), state.speed, state.speed + CURTAIN_TRAVEL, x, y, 60);
      curves[0].setAttribute('d', pathOf([[x(0), y(0)], ...first, [x(span), y(1)]]));
      curves[1].setAttribute('d', pathOf([[x(0), y(0)], [x(state.speed), y(0)], ...second, [x(span), y(1)]]));
      band.setAttribute('d', `${pathOf([...first, [x(state.speed + CURTAIN_TRAVEL), y(1)], ...[...second].reverse(), [x(state.speed), y(0)]])}Z`);
      const ms = span * 1000;
      axisEnd!.textContent = ms >= 100 ? `${Math.round(ms)} ms` : `${fmt(ms)} ms`;
      const slit = slitWidth(state.speed);
      note!.textContent = slit >= FRAME_WIDTH ? `${speedLabel(state.speed)}: the whole frame open at once` : `${speedLabel(state.speed)}: a ${fmt(slit)} mm slit`;
    }
    const t = state.shot;
    cursor.style.display = t === null ? 'none' : '';
    if (t !== null) cursor.setAttribute('transform', `translate(${(left + (Math.min(t, span) / span) * (right - left)).toFixed(1)} 0)`);
  };
  draw(RESTING);
  return {
    title: 'Two curtains, one slit',
    caption: 'The first curtain (solid) uncovers the film, the second (dashed) follows after the exposure time. Every part of the frame gets the same time in the light; at fast speeds it never sees the whole frame open at once.',
    update() {
      draw(rangefinder(source.camera()));
    },
    destroy() {
      curves = [];
      sized.dispose();
    },
  };
};

// ------------------------------------------------------------------ iris

/** The hole the iris leaves at each f-number, to scale, and the light each lets through. */
const iris: ChartFactory = (host, { source }) => {
  let holes: SVGCircleElement[] = [];
  let shown = -1;
  const sized = sizedSvg(host, 'The opening of the iris at each stop from f/1.4 to f/16, drawn to scale: each step down halves the area and so the light.', (w, rem) => Math.min(w * 0.36, rem * 8), (svg, w, h, rem) => {
    const slot = w / STOPS.length;
    const r0 = Math.min(slot * 0.45, (h - rem * 3) / 2);
    const cy = r0 + rem * 0.3;
    holes = STOPS.map((n, i) => {
      const cx = slot * (i + 0.5);
      const hole = el('circle', { cx, cy, r: (r0 * STOPS[0]) / n, class: 'chart__bar' }, svg);
      el('text', { x: cx, y: cy + r0 + rem * 1.2, class: 'chart__name chart__name--small', 'text-anchor': 'middle' }, svg, String(n));
      el('text', { x: cx, y: cy + r0 + rem * 2.2, class: 'chart__tick', 'text-anchor': 'middle' }, svg, i === 0 ? '1' : `1/${2 ** i}`);
      return hole;
    });
    shown = -1;
  });
  const draw = (state: CameraState) => {
    const stop = Math.round(state.stop);
    if (stop === shown) return;
    shown = stop;
    holes.forEach((hole, i) => hole.classList.toggle('is-picked', i === stop));
  };
  draw(RESTING);
  return {
    title: 'Stops',
    caption: 'f-numbers are the focal length over the hole’s width, so f/2.8 is a 18 mm hole on a 50 mm lens. Each stop is √2 smaller and lets in half the light, which the shutter can make up by staying open twice as long.',
    update() {
      draw(rangefinder(source.camera()));
    },
    destroy() {
      holes = [];
      sized.dispose();
    },
  };
};

// ------------------------------------------------------------------ film

/** The strip in the gate, frames and perforations, moving on as the lever is stroked; the frame count above it. */
const film: ChartFactory = (host, { source }) => {
  let strip: SVGGElement | undefined;
  let count: SVGTextElement | undefined;
  let stroke: SVGTextElement | undefined;
  let mm = 1;
  let shown = NaN;
  const sized = sizedSvg(host, 'A strip of 35 mm film in the camera’s gate: each frame is 24 by 36 mm and 8 perforations long, and two strokes of the lever pull the next one into place.', (w, rem) => rem * 4.2 + 35 * ((w * 0.9) / (FRAME_ADVANCE * 2.4)), (svg, w, _h, rem) => {
    mm = (w * 0.9) / (FRAME_ADVANCE * 2.4);
    const cx = w / 2;
    const top = rem * 1.6;
    const height = 35 * mm;
    const clip = el('clipPath', { id: 'film-window' }, el('defs', {}, svg));
    el('rect', { x: rem * 0.2, y: top, width: w - rem * 0.4, height }, clip);
    const window = el('g', { 'clip-path': 'url(#film-window)' }, svg);
    strip = el('g', {}, window);
    // Frames to either side of the gate, seen from behind the camera: new film comes in from the cassette on the
    // left, frames already taken go on to the take-up spool on the right. Numbered from the one in the gate.
    for (let k = -4; k <= 3; k++) {
      const x = cx - 19 * mm + k * FRAME_ADVANCE * mm;
      el('rect', { x, y: top, width: FRAME_ADVANCE * mm, height, class: 'chart__film' }, strip);
      el('rect', { x: x + mm, y: top + 5.5 * mm, width: 36 * mm, height: 24 * mm, class: 'chart__frame-cell' }, strip);
      el('text', { x: x + 19 * mm, y: top + 17.5 * mm + rem * 0.3, class: 'chart__film-label', 'text-anchor': 'middle', 'data-frame': k }, strip);
      for (let p = 0; p < 8; p++) {
        for (const py of [2.01, 35 - 2.01 - 1.98]) el('rect', { x: x + (p * 4.75 + 0.98) * mm, y: top + py * mm, width: 2.79 * mm, height: 1.98 * mm, rx: 0.5 * mm, class: 'chart__perf' }, strip);
      }
    }
    // The gate: the frame being exposed.
    el('rect', { x: cx - 18 * mm, y: top + 5.5 * mm, width: 36 * mm, height: 24 * mm, class: 'chart__gate' }, svg);
    count = el('text', { x: cx, y: rem * 1.0, class: 'chart__value', 'text-anchor': 'middle' }, svg);
    stroke = el('text', { x: cx, y: top + height + rem * 1.3, class: 'chart__note', 'text-anchor': 'middle' }, svg);
    shown = NaN;
  });
  const draw = (state: CameraState) => {
    if (!strip || state.frames === shown) return;
    shown = state.frames;
    strip.setAttribute('transform', `translate(${((state.frames % 1) * FRAME_ADVANCE * mm).toFixed(2)} 0)`);
    const current = Math.floor(state.frames + 1e-6);
    // Frames before the first are the film's leader: no number.
    strip.querySelectorAll<SVGTextElement>('[data-frame]').forEach((label) => {
      const frame = current + 1 - Number(label.dataset.frame);
      label.textContent = frame >= 1 ? String(frame) : '';
    });
    count!.textContent = `Frame ${current + 1}`;
    stroke!.textContent = state.strokes || state.lever > 0 ? `stroke ${Math.min(STROKES, state.strokes + (state.lever > 0 ? 1 : 0))} of ${STROKES}` : state.cocked ? 'ready' : 'taken: wind on';
  };
  draw(RESTING);
  return {
    title: 'Winding on',
    caption: 'A frame is 36 mm long with a 2 mm gap: 38 mm, which is eight perforations and one turn of the sprocket. The early M3 takes two strokes of the lever for it.',
    update() {
      draw(rangefinder(source.camera()));
    },
    destroy: sized.dispose,
  };
};

export const cameraCharts: Record<string, ChartFactory> = {
  'rangefinder-view': finder,
  'rangefinder-triangle': triangle,
  'focus-extension': extension,
  'shutter-timing': shutter,
  'iris-stops': iris,
  'film-advance': film,
};
