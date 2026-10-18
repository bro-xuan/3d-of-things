// Charts for the cars: an electric motor seen end-on, the inverter's three currents lighting its coils
// in turn so that their field goes round, and the rotor following it as the model drives.
import type { ChartFactory } from './index';
import { el, pathOf, plot, setAttrs, sizedSvg } from './svg';

const TAU = Math.PI * 2;
const mod = (a: number, n: number) => ((a % n) + n) % n;
const deg = (a: number) => (a * 180) / Math.PI;

/**
 * The stator's six coils (three phases, each with its return opposite), lit by the current in them; the
 * field they make (accent) points where those currents add up. A magnet rotor turns locked a little
 * behind the field; an induction rotor turns a little slower than it, so the field slowly laps it: the
 * slip that induces the rotor's currents. Beside it, the three currents through one turn of the field,
 * with where they are now. `node` is the rotor; `slow` divides its turning so the eye can follow it;
 * `regen` shows it braking, as a generator, the rotor ahead of the field.
 */
export const motorFieldChart: ChartFactory = (host, { source, spec }) => {
  const node = String(spec.node ?? '');
  const induction = spec.kind === 'induction';
  const slow = Number(spec.slow ?? 1);
  const slip = Number(spec.slip ?? 0.06);
  const lag = (Number(spec.lag ?? 25) * Math.PI) / 180;
  // Braking, the motor a generator: the rotor runs ahead of the field instead of behind it.
  const ahead = spec.regen ? -1 : 1;
  let coils: { shape: SVGCircleElement; phase: number; sign: number }[] = [];
  let dots: SVGCircleElement[] = [];
  let field: SVGGElement | undefined;
  let rotor: SVGGElement | undefined;
  let cursor: SVGGElement | undefined;
  let cx = 0;
  let cy = 0;
  let x = (_t: number) => 0;
  let y = (_v: number) => 0;
  const current = (phase: number, angle: number) => Math.cos(angle - (phase * TAU) / 3);
  const sized = sizedSvg(host, String(spec.title ?? 'Motor'), (w, rem) => Math.min(w * 0.48, rem * 10), (svg, w, h, rem) => {
    const R = Math.min(h / 2 - rem * 1.05, w * 0.2);
    cx = R + rem * 1.05;
    cy = h / 2;
    el('circle', { cx, cy, r: R, class: 'chart__dial' }, svg);
    el('circle', { cx, cy, r: R * 0.64, class: 'chart__frame' }, svg);
    coils = [];
    for (let k = 0; k < 6; k++) {
      const phase = k % 3;
      const sign = k < 3 ? 1 : -1;
      // A phase's field points across its coil, a quarter turn from the side its current comes up through.
      const a = (phase * TAU) / 3 + Math.PI / 2 + (sign < 0 ? Math.PI : 0);
      const [px, py] = [cx + Math.cos(a) * R * 0.82, cy - Math.sin(a) * R * 0.82];
      coils.push({ shape: el('circle', { cx: px, cy: py, r: R * 0.13, class: 'chart__coil' }, svg), phase, sign });
      if (sign > 0) el('text', { x: cx + Math.cos(a) * (R + rem * 0.55), y: cy - Math.sin(a) * (R + rem * 0.55) + rem * 0.28, class: 'chart__tick', 'text-anchor': 'middle' }, svg, 'ABC'[phase]);
    }
    // The rotor, drawn pointing right (angle 0) and turned in update().
    rotor = el('g', {}, svg);
    const r = R * 0.5;
    el('circle', { cx, cy, r, class: 'chart__rotor' }, rotor);
    if (induction) {
      // Bars of a squirrel cage round its rim, one of them marked so its turning shows.
      for (let k = 0; k < 12; k++) {
        const a = (k * TAU) / 12;
        el('circle', { cx: cx + Math.cos(a) * r * 0.78, cy: cy - Math.sin(a) * r * 0.78, r: r * 0.1, class: k === 0 ? 'chart__rotor-pole' : 'chart__rotor-bar' }, rotor);
      }
    } else {
      // A magnet: its north half dark, pointing along the rotor's angle.
      el('path', { d: `M${cx} ${cy - r}A${r} ${r} 0 0 1 ${cx} ${cy + r}Z`, class: 'chart__rotor-pole' }, rotor);
      el('text', { x: cx + r * 0.5, y: cy + rem * 0.28, class: 'chart__tick chart__tick--paper', 'text-anchor': 'middle' }, rotor, 'N');
      el('text', { x: cx - r * 0.5, y: cy + rem * 0.28, class: 'chart__tick', 'text-anchor': 'middle' }, rotor, 'S');
    }
    el('circle', { cx, cy, r: 2, class: 'chart__pin' }, rotor);
    field = el('g', {}, svg);
    const tip = cx + R * 0.6;
    el('line', { x1: cx, y1: cy, x2: tip - rem * 0.45, y2: cy, class: 'chart__hand chart__hand--accent chart__hand--wide' }, field);
    el('path', { d: `M${tip} ${cy}L${tip - rem * 0.6} ${cy - rem * 0.32}L${tip - rem * 0.6} ${cy + rem * 0.32}Z`, class: 'chart__arrowhead--accent' }, field);

    // The three currents through one turn of the field.
    const left = cx + R + rem * 1.9;
    const right = w - rem * 0.4;
    const amp = h * 0.3;
    x = (t) => left + (t / TAU) * (right - left);
    y = (v) => cy + rem * 0.35 - v * amp;
    el('text', { x: left, y: rem * 0.8, class: 'chart__tick' }, svg, 'Current in each coil');
    el('line', { x1: left, x2: right, y1: y(0), y2: y(0), class: 'chart__grid' }, svg);
    const styles = ['chart__line', 'chart__line chart__line--dashed', 'chart__line chart__line--dotted'];
    for (let p = 0; p < 3; p++) {
      el('path', { d: pathOf(plot((t) => current(p, t), 0, TAU, x, y, 120)), class: styles[p] }, svg);
      el('text', { x: x((p * TAU) / 3) + (p ? 0 : rem * 0.5), y: y(1) - rem * 0.45, class: 'chart__tick', 'text-anchor': 'middle' }, svg, 'ABC'[p]);
    }
    cursor = el('g', { class: 'chart__cursor' }, svg);
    el('line', { x1: 0, x2: 0, y1: y(1.08), y2: y(-1.08), class: 'chart__cursor-line' }, cursor);
    dots = [0, 1, 2].map(() => el('circle', { cx: 0, cy: 0, r: rem * 0.2, class: 'chart__dot' }, svg));
  });
  return {
    title: String(spec.title ?? ''),
    caption: String(spec.caption ?? ''),
    update() {
      if (!rotor || !field || !cursor) return;
      const turned = source.angleOf(node) / slow;
      const fieldAngle = induction ? turned * (1 + ahead * slip) : turned + ahead * lag;
      // SVG turns clockwise; these angles go anticlockwise, as the coils' letters do.
      rotor.setAttribute('transform', `rotate(${(-deg(turned)).toFixed(2)} ${cx} ${cy})`);
      field.setAttribute('transform', `rotate(${(-deg(fieldAngle)).toFixed(2)} ${cx} ${cy})`);
      for (const coil of coils) {
        const i = coil.sign * current(coil.phase, fieldAngle);
        coil.shape.classList.toggle('chart__coil--return', i < 0);
        coil.shape.setAttribute('fill-opacity', (0.15 + 0.85 * Math.abs(i)).toFixed(2));
      }
      const phase = mod(fieldAngle, TAU);
      cursor.setAttribute('transform', `translate(${x(phase).toFixed(1)} 0)`);
      dots.forEach((dot, p) => setAttrs(dot, { cx: x(phase).toFixed(1), cy: y(current(p, phase)).toFixed(1) }));
    },
    destroy() {
      coils = [];
      dots = [];
      sized.dispose();
    },
  };
};

export const carCharts: Record<string, ChartFactory> = {
  'motor-field': motorFieldChart,
};
