// A pin tumbler lock's chart: its five pin stacks seen from the side, standing on the key in the lock,
// against the shear line, live from the lock's module (src/viewer/pinlock.ts), so the stacks rise and fall
// as the key slides and the one across the line shows up.
import type { ChartFactory } from './index';
import { el, pathOf, setAttrs, sizedSvg } from './svg';
import { KEYS, LOCK, cutAt, driverPinLength, keyHeight, keyLow, keyPinLength, pinPoint } from '../viewer/pinlock';

/** From the plug's face (mm) to just past the key's tip, and from the blade's bottom to the chambers' tops. */
const S0 = -3;
const S1 = 31;
const Y1 = 24.6;
/** The chambers' tops above the blade's bottom (the shell's top is 18 mm over the plug's middle). */
const TOP = LOCK.plug / 2 + 18;

const stacks: ChartFactory = (host, { source }) => {
  let pins: { key: SVGRectElement; driver: SVGRectElement; spring: SVGPathElement; depth: SVGTextElement }[] = [];
  let keyPath: SVGPathElement | undefined;
  let x = (_s: number) => 0;
  let y = (_h: number) => 0;
  let k = 1;
  let drawn = '';
  const sized = sizedSvg(host, 'The five pin stacks against the shear line', (w, rem) => Math.min(w * 0.72, rem * 14), (svg, w, h, rem) => {
    const top = rem * 0.9;
    const bottom = h - rem * 1.6;
    k = Math.min((w - rem * 0.4) / (S1 - S0), (bottom - top) / Y1);
    const left = (w - k * (S1 - S0)) / 2;
    x = (s) => left + (s - S0) * k;
    y = (v) => bottom - v * k;
    // The plug (up to the shear line) and the shell's chambers above it.
    el('rect', { x: x(0), y: y(LOCK.plug), width: x(30) - x(0), height: LOCK.plug * k, class: 'chart__band' }, svg);
    el('line', { x1: x(S0), x2: x(S1), y1: y(LOCK.plug), y2: y(LOCK.plug), class: 'chart__line chart__line--dashed' }, svg);
    el('text', { x: x(S1), y: y(LOCK.plug) - rem * 0.3, class: 'chart__note chart__note--accent', 'text-anchor': 'end' }, svg, 'shear line');
    el('text', { x: x(S0), y: y(LOCK.plug) + rem * 0.95, class: 'chart__tick' }, svg, 'plug');
    el('text', { x: x(S0), y: y(LOCK.plug) - rem * 0.3, class: 'chart__tick' }, svg, 'shell');
    el('line', { x1: x(0), x2: x(0), y1: y(0), y2: y(TOP), class: 'chart__axis' }, svg);
    keyPath = el('path', { class: 'chart__bar' }, svg);
    pins = KEYS.right.map((depth, i) => {
      const cx = x(cutAt(i));
      const half = (LOCK.pin / 2) * k;
      el('rect', { x: cx - half - 1, y: y(TOP), width: 2 * half + 2, height: (TOP - LOCK.plug) * k, class: 'chart__frame' }, svg);
      const spring = el('path', { class: 'chart__frame' }, svg);
      const driver = el('rect', { x: cx - half, width: 2 * half, height: driverPinLength(depth) * k, class: 'chart__bar' }, svg);
      const key = el('rect', { x: cx - half, width: 2 * half, height: keyPinLength(depth) * k, class: 'chart__bar' }, svg);
      const label = el('text', { x: cx, y: h - rem * 0.4, class: 'chart__tick', 'text-anchor': 'middle' }, svg, String(depth));
      return { key, driver, spring, depth: label };
    });
    drawn = '';
  });

  const draw = () => {
    const s = source.lock?.();
    if (!s || !keyPath) return;
    const sig = `${s.key}${s.out.toFixed(3)}${sized.svg.getAttribute('width')}`;
    if (sig === drawn) return;
    drawn = sig;
    const bitting = KEYS[s.key];
    // The key, slid out by s.out: its outline between the face and the tip.
    const top: [number, number][] = [];
    const low: [number, number][] = [];
    for (let p = Math.max(S0, -s.out); p <= Math.min(S1, LOCK.tipEnd - s.out) + 1e-9; p += 0.1) {
      const h = keyHeight(bitting, Math.min(LOCK.tipEnd, p + s.out));
      if (!Number.isFinite(h)) continue;
      top.push([x(p), y(h)]);
      low.push([x(p), y(keyLow(p + s.out))]);
    }
    keyPath.setAttribute('d', top.length ? `${pathOf([...top, ...low.reverse()])}Z` : '');
    KEYS.right.forEach((depth, i) => {
      const pin = pins[i];
      const point = pinPoint(bitting, i, s.out);
      const split = point + keyPinLength(depth);
      const cap = split + driverPinLength(depth);
      const gap = s.gaps[i] ?? 0;
      setAttrs(pin.key, { y: y(split) });
      setAttrs(pin.driver, { y: y(cap) });
      pin.key.classList.toggle('is-picked', gap > LOCK.tolerance);
      pin.driver.classList.toggle('is-picked', gap < -LOCK.tolerance);
      // The spring, a zigzag from the driver pin's top to the chamber's.
      const cx = x(cutAt(i));
      const half = (LOCK.pin / 2) * k * 0.8;
      const zig: [number, number][] = [];
      const n = 9;
      for (let j = 0; j <= n; j++) zig.push([cx + (j === 0 || j === n ? 0 : j % 2 ? half : -half), y(cap + ((TOP - cap) * j) / n)]);
      pin.spring.setAttribute('d', pathOf(zig));
      pin.depth.textContent = `${bitting[i]}`;
    });
  };
  draw();
  return {
    title: 'The pin stacks, from the side',
    caption: 'Each stack stands on the key’s edge. A pin picked out in colour is across the shear line, and holds the plug.',
    update: draw,
    destroy() {
      pins = [];
      sized.dispose();
    },
  };
};

export const lockCharts: Record<string, ChartFactory> = { 'lock-stacks': stacks };
