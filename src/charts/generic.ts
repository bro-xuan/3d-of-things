// Charts any object can use, set up from its content file: a ladder of speeds (or sizes) from one
// part to the next, and a timing diagram of parts that move in turns.
import type { ChartFactory } from './index';
import { el, pathOf, setAttrs, sizedSvg } from './svg';

const mod = (a: number, n: number) => ((a % n) + n) % n;

interface Rung {
  name: string;
  value: number;
  /** A short line under the name, e.g. "1 turn". */
  note?: string;
  /** The step up to this rung, e.g. "×3⅓". */
  step?: string;
  /** A node whose turning a little dial under the rung follows. */
  node?: string;
}

/** Rungs from one part to the next on a linear or log scale, with what each step multiplies by. */
export const ladderChart: ChartFactory = (host, { source, spec }) => {
  const rungs = (spec.rungs as Rung[]) ?? [];
  const log = spec.scale === 'log';
  const unit = String(spec.unit ?? '');
  let hands: { line: SVGLineElement; cx: number; cy: number; r: number; node: string }[] = [];
  const sized = sizedSvg(host, String(spec.label ?? spec.title ?? 'Chart'), (w, rem) => Math.min(w * 0.6, rem * 13) + (rungs.some((r) => r.node) ? rem : 0), (svg, w, h, rem) => {
    const left = rem * 2.4;
    const right = w - rem * 1.2;
    const top = rem * (unit ? 2.3 : 1.2);
    const withDials = rungs.some((r) => r.node);
    const bottom = h - rem * (withDials ? 4.3 : 2.6);
    const values = rungs.map((r) => r.value);
    const [lo, hi] = log ? [Math.floor(Math.log10(Math.min(...values))), Math.ceil(Math.log10(Math.max(...values)))] : [0, Math.max(...values) * 1.08];
    const x = (i: number) => left + (rungs.length === 1 ? 0.5 : i / (rungs.length - 1)) * (right - left);
    const y = (v: number) => bottom - (((log ? Math.log10(v) : v) - lo) / (hi - lo || 1)) * (bottom - top);
    if (unit) el('text', { x: 0, y: rem * 0.8, class: 'chart__tick' }, svg, unit);
    const ticks = log ? Array.from({ length: hi - lo + 1 }, (_, k) => 10 ** (lo + k)) : (spec.ticks as number[]) ?? [0, hi / 2, hi].map((v) => Math.round(v));
    for (const value of ticks) {
      el('line', { x1: left - rem * 0.4, x2: right + rem * 0.6, y1: y(value), y2: y(value), class: 'chart__grid' }, svg);
      el('text', { x: left - rem * 0.6, y: y(value) + rem * 0.28, class: 'chart__tick', 'text-anchor': 'end' }, svg, value.toLocaleString('en-GB'));
    }
    const points = rungs.map((rung, i) => [x(i), y(rung.value)] as [number, number]);
    el('path', { d: pathOf(points), class: 'chart__line' }, svg);
    hands = [];
    rungs.forEach((rung, i) => {
      const [px, py] = points[i];
      el('circle', { cx: px, cy: py, r: rem * 0.22, class: 'chart__dot chart__dot--ink' }, svg);
      if (rung.step && i > 0) {
        const [qx, qy] = points[i - 1];
        el('text', { x: (px + qx) / 2 - rem * 0.3, y: (py + qy) / 2 - rem * 0.2, class: 'chart__note chart__note--accent', 'text-anchor': 'end' }, svg, rung.step);
      }
      let below = bottom + rem * 1.25;
      if (withDials) {
        const r = rem * 0.62;
        const cy = bottom + rem * 1.35;
        if (rung.node) {
          el('circle', { cx: px, cy, r, class: 'chart__dial' }, svg);
          el('circle', { cx: px, cy, r: 1.5, class: 'chart__pin' }, svg);
          hands.push({ line: el('line', { x1: px, y1: cy, x2: px, y2: cy - r * 0.86, class: 'chart__hand' }, svg), cx: px, cy, r: r * 0.86, node: rung.node });
        }
        below = cy + r + rem * 1.05;
      }
      el('text', { x: px, y: below, class: 'chart__name chart__name--small', 'text-anchor': 'middle' }, svg, rung.name);
      if (rung.note) el('text', { x: px, y: below + rem, class: 'chart__tick', 'text-anchor': 'middle' }, svg, rung.note);
    });
  });
  return {
    title: String(spec.title ?? ''),
    caption: String(spec.caption ?? ''),
    update() {
      for (const hand of hands) {
        const angle = source.angleOf(hand.node) * (spec.flip ? -1 : 1);
        setAttrs(hand.line, { x2: (hand.cx + Math.sin(angle) * hand.r).toFixed(2), y2: (hand.cy - Math.cos(angle) * hand.r).toFixed(2) });
      }
    },
    destroy() {
      hands = [];
      sized.dispose();
    },
  };
};

interface Lane {
  name: string;
  /** The lane's level through one cycle, as [phase 0–1, level 0–1] corners joined by straight lines. */
  points: [number, number][];
  /** Labels along the lane, as [phase, text]. */
  notes?: [number, string][];
}

/** Lanes of parts that move in turns through one cycle (a projector's claw and shutter), with a cursor that runs as the mechanism does. */
export const timingChart: ChartFactory = (host, { source, spec }) => {
  const lanes = (spec.lanes as Lane[]) ?? [];
  const bands = (spec.bands as [number, number, string][]) ?? [];
  /** Cycles per turn of the node the cursor follows. */
  const perTurn = Number(spec.perTurn ?? 1);
  const node = spec.node as string | undefined;
  let cursor: SVGGElement | undefined;
  let x = (_p: number) => 0;
  const sized = sizedSvg(host, String(spec.label ?? spec.title ?? 'Timing'), (_w, rem) => rem * (1.6 + lanes.length * 3.6), (svg, w, h, rem) => {
    const left = rem * 0.2;
    const right = w - rem * 0.2;
    x = (p) => left + p * (right - left);
    for (const [a, b, text] of bands) {
      el('rect', { x: x(a), y: rem * 1.5, width: x(b) - x(a), height: h - rem * 1.5, class: 'chart__band' }, svg);
      el('text', { x: x((a + b) / 2), y: rem * 1.05, class: 'chart__note chart__note--accent', 'text-anchor': 'middle' }, svg, text);
    }
    const band = rem * 1.8;
    lanes.forEach((lane, i) => {
      const top = rem * 1.5 + i * (band + rem * 1.8) + rem * 1.1;
      const yOf = (v: number) => top + band - v * band;
      el('text', { x: left, y: top - rem * 0.45, class: 'chart__name chart__name--small' }, svg, lane.name);
      el('line', { x1: left, x2: right, y1: yOf(0), y2: yOf(0), class: 'chart__grid' }, svg);
      el('path', { d: pathOf(lane.points.map(([p, v]) => [x(p), yOf(v)])), class: 'chart__line' }, svg);
      for (const [p, text] of lane.notes ?? []) el('text', { x: x(p), y: top - rem * 0.45, class: 'chart__note', 'text-anchor': 'middle' }, svg, text);
    });
    cursor = el('g', { class: 'chart__cursor' }, svg);
    el('line', { y1: rem * 1.5, y2: h, class: 'chart__cursor-line' }, cursor);
  });
  return {
    title: String(spec.title ?? ''),
    caption: String(spec.caption ?? ''),
    update() {
      if (!cursor || !node) return;
      const phase = mod((Math.abs(source.angleOf(node)) / (Math.PI * 2)) * perTurn, 1);
      cursor.setAttribute('transform', `translate(${x(phase).toFixed(1)} 0)`);
    },
    destroy: sized.dispose,
  };
};

interface Bar {
  label: string;
  value: number;
  /** A line under the label. */
  note?: string;
}

/** Bars side by side, with their values; picks out the chosen one of the step's \`speeds\` with \`"follow": "selected"\`. */
export const barsChart: ChartFactory = (host, { source, spec }) => {
  const bars = (spec.bars as Bar[]) ?? [];
  const unit = String(spec.unit ?? '');
  const follow = spec.follow === 'selected';
  let rects: SVGRectElement[] = [];
  let shown = -1;
  const sized = sizedSvg(host, String(spec.label ?? spec.title ?? 'Chart'), (w, rem) => Math.min(w * 0.55, rem * 11), (svg, w, h, rem) => {
    const top = rem * 1.7;
    const bottom = h - rem * (bars.some((b) => b.note) ? 2.7 : 1.7);
    const max = Math.max(...bars.map((b) => b.value)) * 1.05;
    const slot = w / bars.length;
    const width = Math.min(slot * 0.56, rem * 3.2);
    if (unit) el('text', { x: 0, y: rem * 0.8, class: 'chart__tick' }, svg, unit);
    el('line', { x1: 0, x2: w, y1: bottom, y2: bottom, class: 'chart__axis' }, svg);
    rects = bars.map((bar, i) => {
      const cx = slot * (i + 0.5);
      const y = bottom - (bar.value / max) * (bottom - top);
      const rect = el('rect', { x: cx - width / 2, y, width, height: bottom - y, class: 'chart__bar' }, svg);
      el('text', { x: cx, y: y - rem * 0.35, class: 'chart__value chart__value--ink', 'text-anchor': 'middle' }, svg, bar.value.toLocaleString('en-GB', { maximumFractionDigits: 2 }));
      el('text', { x: cx, y: bottom + rem * 1.1, class: 'chart__name chart__name--small', 'text-anchor': 'middle' }, svg, bar.label);
      if (bar.note) el('text', { x: cx, y: bottom + rem * 2.1, class: 'chart__tick', 'text-anchor': 'middle' }, svg, bar.note);
      return rect;
    });
    shown = -1;
  });
  const pick = (index: number) => {
    if (index === shown) return;
    shown = index;
    rects.forEach((rect, i) => rect.classList.toggle('is-picked', i === index));
  };
  if (spec.picked !== undefined) pick(Number(spec.picked));
  return {
    title: String(spec.title ?? ''),
    caption: String(spec.caption ?? ''),
    update() {
      if (follow) pick(source.selected());
    },
    destroy: sized.dispose,
  };
};
