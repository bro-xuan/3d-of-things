// Charts for a stored-pressure extinguisher: its pressure falling as the powder leaves, read from the same discharge
// that empties the model (src/viewer/extinguisher.ts).
import type { ChartFactory } from './index';
import { CHARGE_BAR, GREEN, POWDER_KG, RESIDUAL_KG, POWDER_SECONDS, dischargeCurve } from '../viewer/extinguisher';
import { el, pathOf, setAttrs, sizedSvg } from './svg';

/** Gauge pressure and powder left against seconds with the lever held, upright and upside down; a dot follows the model. */
const discharge: ChartFactory = (host, { source, spec }) => {
  const upright = dischargeCurve(false);
  const inverted = dischargeCurve(true);
  const span = Math.ceil(upright[upright.length - 1].t + 1);
  let dot: SVGCircleElement | undefined;
  let line: SVGLineElement | undefined;
  let map = { x: (_t: number) => 0, y: (_b: number) => 0, top: 0, bottom: 0 };
  const sized = sizedSvg(host, `The extinguisher's pressure against time with the lever held: from ${CHARGE_BAR} bar it falls as the powder leaves and the nitrogen goes with it, until the powder is spent after about ${Math.round(POWDER_SECONDS)} seconds. Upside down, only nitrogen comes out, and the pressure is gone in two or three seconds.`, (w, rem) => Math.min(w * 0.62, rem * 14), (svg, w, h, rem) => {
    const left = rem * 2.2;
    const right = w - rem * 0.8;
    const top = rem * 1.8;
    const bottom = h - rem * 2.2;
    const x = (t: number) => left + (t / span) * (right - left);
    const y = (bar: number) => bottom - (bar / 12) * (bottom - top);
    const yKg = (kg: number) => bottom - (kg / POWDER_KG) * (bottom - top) * (CHARGE_BAR / 12);
    map = { x, y, top, bottom };
    el('text', { x: 0, y: rem * 0.8, class: 'chart__tick' }, svg, 'Bar on the gauge');
    // The gauge's green band.
    el('rect', { x: left, y: y(GREEN[1]), width: right - left, height: y(GREEN[0]) - y(GREEN[1]), class: 'chart__band' }, svg);
    el('text', { x: right - rem * 0.2, y: y(GREEN[1]) - rem * 0.3, class: 'chart__tick', 'text-anchor': 'end' }, svg, 'green band');
    for (const bar of [0, 5, 10]) {
      el('line', { x1: left, x2: right, y1: y(bar), y2: y(bar), class: bar ? 'chart__grid' : 'chart__axis' }, svg);
      el('text', { x: left - rem * 0.5, y: y(bar) + rem * 0.28, class: 'chart__tick', 'text-anchor': 'end' }, svg, String(bar));
    }
    for (let t = 0; t <= span; t += 5) el('text', { x: x(t), y: bottom + rem * 1.15, class: 'chart__tick', 'text-anchor': 'middle' }, svg, `${t} s`);
    // Powder left, on the same height as the full charge's pressure.
    el('path', { d: pathOf(upright.map((p) => [x(p.t), yKg(p.kg)])), class: 'chart__line chart__line--dotted' }, svg);
    el('text', { x: x(0) + rem * 0.4, y: yKg(POWDER_KG) - rem * 0.45, class: 'chart__tick' }, svg, `${POWDER_KG} kg of powder`);
    const end = upright.find((p) => p.kg <= RESIDUAL_KG + 1e-6) ?? upright[upright.length - 1];
    el('text', { x: x(end.t) + rem * 0.3, y: yKg(end.kg) - rem * 0.5, class: 'chart__tick' }, svg, `${RESIDUAL_KG.toFixed(2)} kg stays`);
    // Upside down: gas alone.
    el('path', { d: pathOf(inverted.map((p) => [x(p.t), y(p.bar)])), class: 'chart__line chart__line--dashed' }, svg);
    const flip = inverted.find((p) => p.bar < 2.5) ?? inverted[inverted.length - 1];
    el('text', { x: x(flip.t) + rem * 0.5, y: y(flip.bar) - rem * 0.2, class: 'chart__note' }, svg, 'upside down');
    // Upright: the pressure falls as the powder goes.
    el('path', { d: pathOf(upright.map((p) => [x(p.t), y(p.bar)])), class: 'chart__line chart__line--live' }, svg);
    const mid = upright[Math.round(upright.length * 0.45)];
    el('text', { x: x(mid.t) + rem * 0.4, y: y(mid.bar) - rem * 0.5, class: 'chart__note chart__note--accent' }, svg, 'upright');
    line = el('line', { x1: x(0), x2: x(0), y1: top, y2: bottom, class: 'chart__cursor-line' }, svg);
    dot = el('circle', { cx: x(0), cy: y(CHARGE_BAR), r: rem * 0.28, class: 'chart__dot' }, svg);
  });
  return {
    title: String(spec.title ?? 'Pressure as it empties'),
    caption: String(spec.caption ?? ''),
    update() {
      const s = source.extinguisher();
      if (!s || !dot || !line) return;
      const t = Math.min(span, s.seconds);
      setAttrs(dot, { cx: map.x(t).toFixed(1), cy: map.y(s.bar).toFixed(1) });
      setAttrs(line, { x1: map.x(t).toFixed(1), x2: map.x(t).toFixed(1) });
    },
    destroy() {
      dot = undefined;
      line = undefined;
      sized.dispose();
    },
  };
};

export const extinguisherCharts: Record<string, ChartFactory> = {
  'extinguisher-discharge': discharge,
};
