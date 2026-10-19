// Charts for a pin tumbler lock (src/viewer/pintumbler.ts): the five pin stacks cut through down the keyway, moving as the
// model's do, with the shear line and the key's cuts under them; and the bolt's travel through the key's quarter turn.
import type { ChartFactory } from './index';
import { el, pathOf, plot, setAttrs, sizedSvg } from './svg';
import { BITTING, BLADE, BOTTOM, CHAMBER_TOP, CUTS, DRIVER, PIN, PLUG_R, THROW, TURN, boltTravel, keyPinLength, profile, type LockState } from '../viewer/pintumbler';
import KW1 from '../viewer/kw1.json';

/** Where the key goes when it's all the way out (mm), as the lock's module has it. */
const OUT = KW1.drawn.out;
const BORE = KW1.drawn.boreR;
const CEILING = KW1.drawn.ceiling;
const HOLE = KW1.drawn.holeR;
const TIP = KW1.drawn.tipR;
const BLANK = KW1.depths[0] * KW1.inch;
/** The section's window, mm: along the plug from in front of its face, and up from below the key to above the chambers. */
const Z = [-4.5, 28.5];
const Y = [-9.6, 19.6];
const LENGTH = 26.6;

/** The pin stacks as the key in the lock leaves them: a pin across the dashed shear line holds the plug. */
const lockPinsChart: ChartFactory = (host, { source, spec }) => {
  const lock = () => source.lock?.() ?? null;
  let parts: { key: SVGPathElement; plugTop: SVGGElement; turned: SVGTextElement; legend: SVGTextElement; stacks: { keyPin: SVGPathElement; driver: SVGRectElement; spring: SVGPathElement; label: SVGTextElement }[] } | undefined;
  let x = (_z: number) => 0;
  let y = (_y: number) => 0;
  let k = 1;
  let drawn = '';
  const sized = sizedSvg(host, String(spec.title ?? 'Pin stacks'), (w, rem) => Math.min(w * 0.82, rem * 17), (svg, w, h, rem) => {
    k = Math.min((w - rem * 0.4) / (Z[1] - Z[0]), (h - rem * 0.2) / (Y[1] - Y[0]));
    const left = (w - k * (Z[1] - Z[0])) / 2;
    x = (z) => left + (z - Z[0]) * k;
    y = (v) => rem * 0.1 + (Y[1] - v) * k;
    const rect = (z0: number, z1: number, y0: number, y1: number, cls: string, parent: Element = svg) =>
      el('rect', { x: x(z0), y: y(y1), width: (z1 - z0) * k, height: (y1 - y0) * k, class: cls }, parent);
    // The housing above the bore and below it, with its chambers; the plug's roof over the keyway, with its holes.
    rect(0, LENGTH, BORE, CHAMBER_TOP, 'chart__rotor');
    rect(0, LENGTH, Y[0] + 1.6, -BORE, 'chart__rotor');
    const plugTop = el('g', {}, svg);
    rect(0, LENGTH, CEILING, PLUG_R, 'chart__rotor', plugTop);
    rect(LENGTH - 0.6, LENGTH, -PLUG_R, CEILING, 'chart__rotor', plugTop);
    CUTS.forEach((c, i) => {
      rect(c - HOLE, c + HOLE, BORE - 0.05, CHAMBER_TOP, 'chart__dial');
      rect(c - HOLE, c + HOLE, CEILING - 0.05, PLUG_R + 0.05, 'chart__dial', plugTop);
      el('text', { x: x(c), y: y(CHAMBER_TOP) - rem * 0.3, class: 'chart__tick', 'text-anchor': 'middle' }, svg, String(i + 1));
    });
    const key = el('path', { class: 'chart__area chart__line--ghost' }, svg);
    const stacks = CUTS.map(() => ({
      keyPin: el('path', { class: 'chart__rotor-bar' }, svg),
      driver: el('rect', { class: 'chart__rotor-pole' }, svg),
      spring: el('path', { class: 'chart__glyph chart__glyph--thin' }, svg),
      label: el('text', { class: 'chart__tick', 'text-anchor': 'middle' }, svg),
    }));
    // The shear line: the plug's surface, where every split has to be.
    el('line', { x1: x(Z[0] + 0.5), x2: x(Z[1]), y1: y(PLUG_R), y2: y(PLUG_R), class: 'chart__line chart__line--live chart__line--dashed' }, svg);
    el('text', { x: x(Z[1]), y: y(PLUG_R) - rem * 0.35, class: 'chart__note chart__note--accent', 'text-anchor': 'end' }, svg, 'shear line');
    el('text', { x: x(Z[0] + 0.3), y: y(CHAMBER_TOP) - rem * 0.3, class: 'chart__tick' }, svg, 'housing');
    el('text', { x: x(Z[0] + 0.3), y: y(CEILING + 0.6), class: 'chart__tick' }, svg, 'plug');
    const turned = el('text', { x: x(LENGTH / 2), y: y(0.3), class: 'chart__note', 'text-anchor': 'middle' }, svg);
    const legend = el('text', { x: x(Z[0] + 0.3), y: y(Y[0] + 0.5), class: 'chart__tick' }, svg);
    parts = { key, plugTop, turned, legend, stacks };
    drawn = '';
  });

  const draw = (s: LockState) => {
    if (!parts) return;
    const signature = JSON.stringify([s.key, s.insert.toFixed(4), Math.round(s.angle), s.stacks.map((t) => t.tip.toFixed(3))]);
    if (signature === drawn) return;
    drawn = signature;
    const fade = Math.max(0.12, 1 - s.angle / 25);
    // The key, from where its shoulder is to its tip, cut off at the section's edge.
    const offset = (1 - s.insert) * OUT;
    if (s.key === 'none') setAttrs(parts.key, { d: '' });
    else {
      const bitting = BITTING[s.key];
      const top: [number, number][] = [];
      const start = Math.max(-6, Z[0] + offset);
      for (let a = start; a <= BLADE + 1e-6; a += 0.2) {
        const edge = a < 0 ? BLANK + 2 : profile(bitting, a);
        top.push([x(a - offset), y(BOTTOM + edge)]);
      }
      top.push([x(BLADE - offset), y(BOTTOM + 1)], [x(BLADE - 1 - offset), y(BOTTOM)], [x(start - offset), y(BOTTOM)]);
      setAttrs(parts.key, { d: `${pathOf(top)}Z`, opacity: fade });
    }
    setAttrs(parts.plugTop, { opacity: fade });
    parts.turned.textContent = s.angle > 1 ? `turned ${Math.round(s.angle)}°: plug, key and key pins have gone round` : '';
    const r = PIN / 2;
    s.stacks.forEach((t, i) => {
      const p = parts!.stacks[i];
      const c = CUTS[i];
      const tip = BOTTOM + t.tip;
      const top = tip + keyPinLength(t.pin);
      const cone = r - TIP;
      setAttrs(p.keyPin, {
        d: `${pathOf([[x(c - r), y(tip + cone)], [x(c - TIP), y(tip)], [x(c + TIP), y(tip)], [x(c + r), y(tip + cone)], [x(c + r), y(top)], [x(c - r), y(top)]])}Z`,
        class: t.crossing === 'key' ? 'chart__bar is-picked' : 'chart__rotor-bar',
        opacity: fade,
      });
      // With the plug turned, the drivers sit on its surface at the line.
      const driverBottom = s.angle > 1 ? PLUG_R : top;
      setAttrs(p.driver, { x: x(c - r), y: y(driverBottom + DRIVER), width: 2 * r * k, height: DRIVER * k, class: t.crossing === 'driver' ? 'chart__bar is-picked' : 'chart__rotor-pole' });
      const y0 = driverBottom + DRIVER;
      const zig: [number, number][] = [];
      for (let n = 0; n <= 16; n++) zig.push([x(c + (n === 0 || n === 16 ? 0 : n % 2 ? 1.05 : -1.05)), y(y0 + ((CHAMBER_TOP - y0) * n) / 16)]);
      setAttrs(p.spring, { d: pathOf(zig) });
      p.label.setAttribute('x', String(x(c)));
      p.label.setAttribute('y', String(y(Y[0] + 0.5)));
      p.label.setAttribute('class', t.crossing ? 'chart__value' : 'chart__tick');
      p.label.textContent = t.crossing ? Math.abs(t.split).toFixed(1) : t.cut ? String(t.cut) : '';
    });
    const off = s.stacks.some((t) => t.crossing);
    parts.legend.textContent = off ? 'mm off' : s.stacks.some((t) => t.cut) ? 'cut' : '';
    parts.legend.setAttribute('class', off ? 'chart__value' : 'chart__tick');
  };

  return {
    title: String(spec.title ?? 'The pin stacks, cut through'),
    caption: String(spec.caption ?? 'Each stack as the key in the lock leaves it. A pin across the dashed shear line holds the plug; the numbers are how far, in mm.'),
    update() {
      const s = lock();
      if (s) draw(s);
    },
    destroy() {
      parts = undefined;
      sized.dispose();
    },
  };
};

/** How far the bolt is out through the key's quarter turn: the drive's crank pushes it hardest at the middle of the turn. */
const lockBoltChart: ChartFactory = (host, { source, spec }) => {
  const lock = () => source.lock?.() ?? null;
  let dot: SVGCircleElement | undefined;
  let x = (_a: number) => 0;
  let y = (_v: number) => 0;
  const sized = sizedSvg(host, String(spec.title ?? 'The bolt'), (w, rem) => Math.min(w * 0.5, rem * 10.5), (svg, w, h, rem) => {
    const left = rem * 2.4;
    const right = w - rem * 0.8;
    const top = rem * 1.6;
    const bottom = h - rem * 2.3;
    x = (a) => left + (a / TURN) * (right - left);
    y = (v) => bottom - (v / THROW) * (bottom - top);
    el('text', { x: 0, y: rem * 0.8, class: 'chart__tick' }, svg, 'Bolt out, mm');
    for (const v of [0, THROW / 2, THROW]) {
      el('line', { x1: left, x2: right, y1: y(v), y2: y(v), class: 'chart__grid' }, svg);
      el('text', { x: left - rem * 0.5, y: y(v) + rem * 0.28, class: 'chart__tick', 'text-anchor': 'end' }, svg, v.toLocaleString('en-GB', { maximumFractionDigits: 1 }));
    }
    for (const a of [0, TURN / 2, TURN]) el('text', { x: x(a), y: bottom + rem * 1.1, class: 'chart__tick', 'text-anchor': 'middle' }, svg, `${a}°`);
    el('text', { x: (left + right) / 2, y: bottom + rem * 2.1, class: 'chart__name chart__name--small', 'text-anchor': 'middle' }, svg, 'Key turned');
    el('path', { d: pathOf(plot(boltTravel, 0, TURN, x, y, 90)), class: 'chart__line' }, svg);
    dot = el('circle', { cx: x(0), cy: y(0), r: rem * 0.3, class: 'chart__dot' }, svg);
  });
  return {
    title: String(spec.title ?? 'A quarter turn, a 25.4 mm throw'),
    caption: String(spec.caption ?? 'The drive’s crank pin swings from 45° left of the top to 45° right, so the bolt moves fastest in the middle of the turn.'),
    update() {
      const s = lock();
      if (s && dot) setAttrs(dot, { cx: x(s.angle).toFixed(1), cy: y(s.bolt).toFixed(1) });
    },
    destroy() {
      dot = undefined;
      sized.dispose();
    },
  };
};

export const lockCharts: Record<string, ChartFactory> = {
  'lock-pins': lockPinsChart,
  'lock-bolt': lockBoltChart,
};
