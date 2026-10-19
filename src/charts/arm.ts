// A balanced arm's chart: the weight's torque about each pivot against the arm's angle, the springs' torque on top of
// it (the same curve: that is the balance), and what springs of the same rate without initial tension would give. Dots
// mark where the arm is. It reads the arm's state (src/viewer/balancedarm.ts), the same numbers the model moves by.
import { ARMS, springTorque, weightMoment, weightTorque, type ArmSpec, type ArmState } from '../viewer/balancedarm';
import type { ChartFactory } from './index';
import { el, pathOf, plot, setAttrs, sizedSvg } from './svg';

const nm = (v: number) => v.toFixed(1);

const armTorque: ChartFactory = (host, { source, spec }) => {
  const TOP = 4;
  let dots: { arm: ArmSpec; weight: SVGCircleElement; springs: SVGCircleElement }[] = [];
  let note: SVGTextElement | undefined;
  let map = { x: (_d: number) => 0, y: (_v: number) => 0 };
  let shown = '';
  const sized = sizedSvg(
    host,
    'The torque the weight puts on each arm, against the arm’s angle from upright: a sine curve, largest with the arm level. The springs’ torque lies exactly on it at every angle. Springs without initial tension would give well under half as much.',
    (w, rem) => Math.min(w * 0.7, rem * 14.6),
    (svg, w, h, rem) => {
      const left = rem * 2.4;
      const right = w - rem * 4.6;
      const top = rem * 1.5;
      const bottom = h - rem * 2.7;
      const x = (d: number) => left + (d / 90) * (right - left);
      const y = (v: number) => bottom - (v / TOP) * (bottom - top);
      map = { x, y };
      el('text', { x: 0, y: rem * 0.8, class: 'chart__tick' }, svg, 'N·m');
      for (const v of [0, 1, 2, 3, 4]) {
        el('line', { x1: left, x2: right, y1: y(v), y2: y(v), class: 'chart__grid' }, svg);
        el('text', { x: left - rem * 0.4, y: y(v) + rem * 0.28, class: 'chart__tick', 'text-anchor': 'end' }, svg, `${v}`);
      }
      for (const d of [0, 30, 60, 90]) el('text', { x: x(d), y: bottom + rem * 1.1, class: 'chart__tick', 'text-anchor': 'middle' }, svg, `${d}°`);
      el('text', { x: (left + right) / 2, y: bottom + rem * 2.3, class: 'chart__tick', 'text-anchor': 'middle' }, svg, 'the arm’s angle from upright');
      for (const arm of ARMS) {
        el('path', { d: pathOf(plot((d) => springTorque(arm, d, 'ordinary'), 0, 90, x, y, 90)), class: 'chart__line chart__line--ghost chart__line--dotted' }, svg);
        el('path', { d: pathOf(plot((d) => weightTorque(arm, d), 0, 90, x, y, 90)), class: 'chart__line' }, svg);
        el('path', { d: pathOf(plot((d) => springTorque(arm, d), 0, 90, x, y, 90)), class: 'chart__line chart__line--live chart__line--dashed' }, svg);
        el('text', { x: right + rem * 0.4, y: y(weightMoment(arm)) + rem * 0.3, class: 'chart__name chart__name--small' }, svg, `${arm.name} arm`);
      }
      el('text', { x: right, y: y(0.3), class: 'chart__tick', 'text-anchor': 'end' }, svg, 'dots: no initial tension');
      dots = ARMS.map((arm) => ({
        arm,
        weight: el('circle', { cx: 0, cy: 0, r: rem * 0.3, class: 'chart__dot chart__dot--ink' }, svg),
        springs: el('circle', { cx: 0, cy: 0, r: rem * 0.2, class: 'chart__dot' }, svg),
      }));
      note = el('text', { x: right, y: rem * 0.8, class: 'chart__note chart__note--accent', 'text-anchor': 'end' }, svg);
      shown = '';
    },
  );
  const draw = (s: ArmState | null) => {
    const angles = { lower: s?.lower ?? ARMS[0].rest, upper: s?.upper ?? ARMS[1].rest };
    const hooked = s?.hooked ?? true;
    const key = `${angles.lower.toFixed(2)}|${angles.upper.toFixed(2)}|${hooked}|${dots.length}`;
    if (!note || key === shown) return;
    shown = key;
    const { x, y } = map;
    for (const { arm, weight, springs } of dots) {
      const d = angles[arm.name];
      setAttrs(weight, { cx: x(d).toFixed(1), cy: y(weightTorque(arm, d)).toFixed(1) });
      setAttrs(springs, { cx: x(d).toFixed(1), cy: y(hooked ? springTorque(arm, d) : 0).toFixed(1) });
    }
    const [l, u] = ARMS.map((arm) => weightTorque(arm, angles[arm.name]));
    note.textContent = hooked ? `balanced: ${nm(l)} and ${nm(u)} N·m` : `springs off: ${nm(l)} and ${nm(u)} N·m`;
  };
  draw(null);
  return {
    title: String(spec.title ?? ''),
    caption: String(spec.caption ?? ''),
    update() {
      draw(source.arm?.() ?? null);
    },
    destroy() {
      dots = [];
      sized.dispose();
    },
  };
};

export const armCharts: Record<string, ChartFactory> = { 'arm-torque': armTorque };
