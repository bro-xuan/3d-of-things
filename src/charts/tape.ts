// A tape measure's chart: what its spring pulls the blade in with, for every length pulled out, from the same sums
// that move the model (src/viewer/tapemeasure.ts). The cursor follows the drum's turning.
import type { ChartFactory } from './index';
import { drumTurns, maxOut, pullAt, type BladeLayout } from '../viewer/tapemeasure';
import { el, pathOf, plot, setAttrs, sizedSvg } from './svg';

const TAU = Math.PI * 2;

/** The blade out (mm) at which the drum has turned `turns` from home: the drum's turns rise steadily with it. */
function outFor(blade: BladeLayout, turns: number): number {
  let [lo, hi] = [0, maxOut(blade)];
  for (let i = 0; i < 32; i++) {
    const mid = (lo + hi) / 2;
    if (drumTurns(blade, mid) < turns) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * The pull on the hook against metres out: the spring tightens a turn at a time, and the roll it pulls through
 * shrinks, so the pull rises all the way out. `blade` is the build's layout (hints.blade); `node` is the drum.
 */
export const tapeSpringChart: ChartFactory = (host, { source, spec }) => {
  const blade = spec.blade as BladeLayout;
  const node = String(spec.node ?? 'drum');
  const most = maxOut(blade);
  const top = Math.ceil(pullAt(blade, most) * 2) / 2;
  let dot: SVGCircleElement | undefined;
  let cursor: SVGLineElement | undefined;
  let value: SVGTextElement | undefined;
  let x = (_mm: number) => 0;
  let y = (_n: number) => 0;
  const sized = sizedSvg(host, String(spec.title ?? 'Spring pull'), (w, rem) => Math.min(w * 0.6, rem * 12.5), (svg, w, h, rem) => {
    const left = rem * 2.2;
    const right = w - rem * 0.8;
    const ceiling = rem * 2.1;
    const floor = h - rem * 2.2;
    x = (mm) => left + (mm / most) * (right - left);
    y = (n) => floor - (n / top) * (floor - ceiling);
    el('text', { x: 0, y: rem * 0.8, class: 'chart__tick' }, svg, 'Pull on the hook, N');
    for (let n = 0; n <= top + 1e-6; n += top > 2 ? 1 : 0.5) {
      el('line', { x1: left - rem * 0.3, x2: right, y1: y(n), y2: y(n), class: 'chart__grid' }, svg);
      el('text', { x: left - rem * 0.5, y: y(n) + rem * 0.28, class: 'chart__tick', 'text-anchor': 'end' }, svg, String(n));
    }
    for (let m = 0; m <= most / 1000 + 1e-6; m += 1) {
      el('text', { x: x(m * 1000), y: floor + rem * 1.1, class: 'chart__tick', 'text-anchor': 'middle' }, svg, `${m} m`);
    }
    el('text', { x: right, y: floor + rem * 2.05, class: 'chart__tick', 'text-anchor': 'end' }, svg, 'Blade out');
    el('path', { d: pathOf(plot((mm) => pullAt(blade, mm), 0, most, x, y, 60)), class: 'chart__line' }, svg);
    cursor = el('line', { x1: 0, x2: 0, y1: ceiling, y2: floor, class: 'chart__cursor-line' }, svg);
    dot = el('circle', { cx: 0, cy: 0, r: rem * 0.24, class: 'chart__dot' }, svg);
    value = el('text', { x: 0, y: 0, class: 'chart__note chart__note--accent' }, svg, '');
  });
  return {
    title: String(spec.title ?? ''),
    caption: String(spec.caption ?? ''),
    update() {
      if (!dot || !cursor || !value) return;
      const mm = outFor(blade, Math.abs(source.angleOf(node)) / TAU);
      const n = pullAt(blade, mm);
      setAttrs(cursor, { x1: x(mm).toFixed(1), x2: x(mm).toFixed(1) });
      setAttrs(dot, { cx: x(mm).toFixed(1), cy: y(n).toFixed(1) });
      setAttrs(value, { x: (x(mm) + (mm > most * 0.7 ? -8 : 8)).toFixed(1), y: (y(n) - 8).toFixed(1), 'text-anchor': mm > most * 0.7 ? 'end' : 'start' });
      value.textContent = `${n.toFixed(2)} N`;
    },
    destroy() {
      sized.dispose();
    },
  };
};

export const tapeCharts: Record<string, ChartFactory> = {
  'tape-spring': tapeSpringChart,
};
