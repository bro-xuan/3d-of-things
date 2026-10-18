// The pocket watch's charts: what each stage of the movement does, drawn from the same numbers
// the model runs on (src/viewer/clockwork.ts).
import { amplitudeFor, BEATS_PER_SECOND, FULL_RESERVE, IMPULSE, palletLean, REST_RESERVE, springTorque, trainBeats } from '../viewer/clockwork';
import type { ChartFactory } from './index';
import { el, pathOf, plot, setAttrs, sizedSvg } from './svg';

const TAU = Math.PI * 2;
const mod = (a: number, n: number) => ((a % n) + n) % n;
const fmt = (n: number) => n.toLocaleString('en-GB', { maximumFractionDigits: 1 });

/** The swing the content gives the balance (degrees either side) when the spring has its rest reserve. */
const REST_SWING = 250;

// ------------------------------------------------------------------ the chain

/** The movement as a chain of stages: energy one way, timing back from the balance. Each stage opens its step. */
const chain: ChartFactory = (host, { go }) => {
  const sized = sizedSvg(host, 'The stages of a watch: power, gear train, escapement and balance in a chain, with the hands driven from the train.', (w, rem) => Math.min(w * 0.52, rem * 11.5), (svg, w, h, rem) => {
    const defs = el('defs', {}, svg);
    for (const [id, cls] of [['arrow-power', 'chart__arrowhead--accent'], ['arrow-time', 'chart__arrowhead']] as const) {
      const marker = el('marker', { id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
      el('path', { d: 'M0 0L10 5L0 10z', class: cls }, marker);
    }
    const cols = 3;
    const bw = (w - rem * 2.2) / cols;
    const bh = rem * 3.1;
    const gx = (w - bw * cols) / (cols - 1);
    const rows = [rem * 0.3, h - bh - rem * 0.3];
    const box = (col: number, row: number, step: number, name: string) => {
      const x = col * (bw + gx);
      const y = rows[row];
      const g = el('g', { class: 'chart__node', 'data-step': step }, svg);
      el('rect', { x: x + 0.5, y: y + 0.5, width: bw - 1, height: bh - 1, rx: rem * 0.3 }, g);
      el('text', { x: x + rem * 0.6, y: y + rem * 1.25, class: 'chart__index' }, g, String(step + 1).padStart(2, '0'));
      el('text', { x: x + rem * 0.6, y: y + rem * 2.45, class: 'chart__name' }, g, name);
      g.addEventListener('click', () => go(step));
      return { x, y, cx: x + bw / 2, cy: y + bh / 2 };
    };
    const power = box(0, 0, 1, 'Power');
    const train = box(1, 0, 2, 'Gear train');
    const escape = box(2, 0, 3, 'Escapement');
    const hands = box(1, 1, 5, 'Hands');
    const balance = box(2, 1, 4, 'Balance');
    const arrow = (d: string, cls: string, marker: string) => el('path', { d, class: cls, 'marker-end': `url(#${marker})` }, svg);
    arrow(pathOf([[power.x + bw + 3, power.cy], [train.x - 4, train.cy]]), 'chart__flow', 'arrow-power');
    arrow(pathOf([[train.x + bw + 3, train.cy], [escape.x - 4, escape.cy]]), 'chart__flow', 'arrow-power');
    arrow(pathOf([[train.cx, train.y + bh + 3], [hands.cx, hands.y - 4]]), 'chart__flow', 'arrow-power');
    // Energy goes down to the balance; timing comes back up from it.
    arrow(pathOf([[escape.cx - rem * 0.8, escape.y + bh + 3], [balance.cx - rem * 0.8, balance.y - 4]]), 'chart__flow', 'arrow-power');
    arrow(pathOf([[balance.cx + rem * 0.8, balance.y - 3], [escape.cx + rem * 0.8, escape.y + bh + 4]]), 'chart__time', 'arrow-time');
    const midY = (escape.y + bh + balance.y) / 2;
    el('text', { x: escape.cx + rem * 1.3, y: midY + rem * 0.3, class: 'chart__note' }, svg, 'timing');
    el('text', { x: escape.cx - rem * 1.3, y: midY + rem * 0.3, class: 'chart__note chart__note--accent', 'text-anchor': 'end' }, svg, 'push');
  });
  return {
    title: 'The chain',
    caption: 'Energy runs one way, from the spring to the balance. Timing runs back: the balance decides when the escapement lets the train move. Pick a stage to see it.',
    destroy: sized.dispose,
  };
};

// ------------------------------------------------------------------ power

/** The mainspring's pull from fully wound to run down, with where the watch is now. */
const power: ChartFactory = (host, { source }) => {
  let marker: SVGGElement | undefined;
  let reading: SVGTextElement | undefined;
  let fill: SVGPathElement | undefined;
  let x = (_h: number) => 0;
  let y = (_t: number) => 0;
  let shown = NaN;
  const sized = sizedSvg(host, 'How hard the mainspring pulls over the 40 hours of a full wind: hardest just after winding, steady through the middle, fading at the end.', (w, rem) => Math.min(w * 0.5, rem * 10.5), (svg, w, h, rem) => {
    const left = rem * 0.2;
    const right = w - rem * 0.4;
    const top = rem * 1.3;
    const bottom = h - rem * 1.6;
    x = (hours) => left + (hours / FULL_RESERVE) * (right - left);
    y = (torque) => bottom - torque * (bottom - top);
    for (const t of [0.5, 1]) el('line', { x1: left, x2: right, y1: y(t), y2: y(t), class: 'chart__grid' }, svg);
    el('line', { x1: left, x2: right, y1: bottom, y2: bottom, class: 'chart__axis' }, svg);
    for (const hours of [0, 40]) {
      el('line', { x1: x(hours), x2: x(hours), y1: bottom, y2: bottom + 4, class: 'chart__axis' }, svg);
      el('text', { x: x(hours), y: bottom + rem * 1.2, class: 'chart__tick', 'text-anchor': hours === 0 ? 'start' : hours === 40 ? 'end' : 'middle' }, svg, hours === 40 ? '40 h' : String(hours));
    }
    const curve = plot((used) => springTorque(FULL_RESERVE - used), 0, FULL_RESERVE, x, y);
    fill = el('path', { class: 'chart__area' }, svg);
    el('path', { d: pathOf(curve), class: 'chart__line' }, svg);
    el('text', { x: x(21), y: y(springTorque(19)) + rem * 1.3, class: 'chart__note', 'text-anchor': 'middle' }, svg, 'a long, steady middle');
    el('text', { x: x(39.3), y: y(0.42), class: 'chart__note', 'text-anchor': 'end' }, svg, 'stops');
    el('text', { x: (left + right) / 2, y: bottom + rem * 1.2, class: 'chart__tick', 'text-anchor': 'middle' }, svg, 'hours since winding');
    marker = el('g', { class: 'chart__cursor' }, svg);
    el('line', { y1: top - rem * 0.2, y2: bottom, class: 'chart__cursor-line' }, marker);
    el('circle', { r: rem * 0.28, class: 'chart__dot' }, marker);
    reading = el('text', { y: top - rem * 0.35, class: 'chart__value', 'text-anchor': 'middle' }, marker);
    shown = NaN;
  });
  const draw = (reserve: number) => {
    if (!marker || Math.abs(reserve - shown) < 0.02) return;
    shown = reserve;
    const used = FULL_RESERVE - reserve;
    const torque = springTorque(reserve);
    marker.setAttribute('transform', `translate(${x(used).toFixed(1)} 0)`);
    setAttrs(marker.querySelector('circle')!, { cy: y(torque) });
    reading!.textContent = `${fmt(Math.round(reserve * 10) / 10)} h left`;
    // Shade what's still in the spring: from now to the end.
    const rest = plot((u) => springTorque(FULL_RESERVE - u), used, FULL_RESERVE, x, y, 80);
    fill!.setAttribute('d', `${pathOf([[x(used), y(0)], ...rest, [x(FULL_RESERVE), y(0)]])}Z`);
  };
  draw(REST_RESERVE);
  return {
    title: 'In the barrel',
    caption: 'The spring pulls hardest just after winding and fades at the end; the watch runs on the long middle. Each turn of the crown puts in about three hours.',
    update() {
      const state = source.state();
      if (state) draw(state.reserve);
    },
    destroy: sized.dispose,
  };
};

// ------------------------------------------------------------------ the train

const RUNGS = [
  { node: 'barrel', name: 'Barrel', perHour: 1 / 8, every: '8 h' },
  { node: 'centre_wheel', name: 'Centre', perHour: 1, every: '1 h', step: '×8', mesh: '80:10' },
  { node: 'third_wheel', name: 'Third', perHour: 8, every: '7½ min', step: '×8', mesh: '80:10' },
  { node: 'fourth_wheel', name: 'Fourth', perHour: 60, every: '1 min', step: '×7½', mesh: '75:10' },
  { node: 'escape_wheel', name: 'Escape', perHour: 720, every: '5 s', step: '×12', mesh: '84:7' },
  { node: 'balance_wheel', name: 'Balance', perHour: 10800, every: '⅓ s', step: '×15', mesh: '15 teeth' },
];

/** How fast each wheel turns, on a log scale, with a little dial under each that turns with the wheel. */
const train: ChartFactory = (host, { source }) => {
  let hands: { line: SVGLineElement; cx: number; cy: number; r: number }[] = [];
  const sized = sizedSvg(host, 'How fast each wheel of the train turns, from the barrel at one turn in eight hours to the balance at three swings a second.', (w, rem) => Math.min(w * 0.72, rem * 15.5), (svg, w, h, rem) => {
    const left = rem * 2.7;
    const right = w - rem * 1.2;
    const top = rem * 1.6;
    const bottom = h - rem * 4.3;
    const [lo, hi] = [-1, 4.2];
    const x = (i: number) => left + (i / (RUNGS.length - 1)) * (right - left);
    const y = (perHour: number) => bottom - ((Math.log10(perHour) - lo) / (hi - lo)) * (bottom - top);
    el('text', { x: 0, y: rem * 0.8, class: 'chart__tick' }, svg, 'Turns an hour');
    for (let p = -1; p <= 4; p++) {
      const value = 10 ** p;
      el('line', { x1: left - rem * 0.4, x2: right + rem * 0.6, y1: y(value), y2: y(value), class: 'chart__grid' }, svg);
      el('text', { x: left - rem * 0.6, y: y(value) + rem * 0.28, class: 'chart__tick', 'text-anchor': 'end' }, svg, p < 0 ? '0.1' : value.toLocaleString('en-GB'));
    }
    const points = RUNGS.map((rung, i) => [x(i), y(rung.perHour)] as [number, number]);
    el('path', { d: pathOf(points), class: 'chart__line' }, svg);
    RUNGS.forEach((rung, i) => {
      const [px, py] = points[i];
      el('circle', { cx: px, cy: py, r: rem * 0.22, class: 'chart__dot chart__dot--ink' }, svg);
      if (rung.step) {
        const [qx, qy] = points[i - 1];
        el('text', { x: (px + qx) / 2 - rem * 0.3, y: (py + qy) / 2 - rem * 0.2, class: 'chart__note chart__note--accent', 'text-anchor': 'end' }, svg, rung.step);
      }
      // A small dial that turns with the wheel, then its name and how long a turn takes.
      const cy = bottom + rem * 1.35;
      const r = rem * 0.62;
      el('circle', { cx: px, cy, r, class: 'chart__dial' }, svg);
      el('circle', { cx: px, cy, r: 1.5, class: 'chart__pin' }, svg);
      hands[i] = { line: el('line', { x1: px, y1: cy, x2: px, y2: cy - r * 0.86, class: 'chart__hand' }, svg), cx: px, cy, r: r * 0.86 };
      el('text', { x: px, y: cy + r + rem * 1.05, class: 'chart__name chart__name--small', 'text-anchor': 'middle' }, svg, rung.name);
      el('text', { x: px, y: cy + r + rem * 2.05, class: 'chart__tick', 'text-anchor': 'middle' }, svg, rung.every);
    });
  });
  return {
    title: 'Speed, mesh by mesh',
    caption: 'Every mesh is a big wheel driving a small pinion, so the speed multiplies (80 teeth on 10 leaves is ×8) and the force divides. From the barrel to the balance it adds up to 86,400 times.',
    update() {
      const state = source.state();
      RUNGS.forEach((rung, i) => {
        const hand = hands[i];
        if (!hand) return;
        // Wheels show how far they've turned, as seen from the back of the movement; the balance swings its hand to and fro.
        const angle = rung.node === 'balance_wheel' ? ((state?.swing ?? 0) * Math.PI) / 180 : source.angleOf(rung.node);
        setAttrs(hand.line, { x2: (hand.cx + Math.sin(angle) * hand.r).toFixed(2), y2: (hand.cy - Math.cos(angle) * hand.r).toFixed(2) });
      });
    },
    destroy() {
      hands = [];
      sized.dispose();
    },
  };
};

// ------------------------------------------------------------------ escapement

/** One full swing of the balance (two beats), lane by lane: the balance, the pallet fork and the escape wheel. */
const escapement: ChartFactory = (host, { source }) => {
  let cursor: SVGGElement | undefined;
  let dots: SVGCircleElement[] = [];
  let x = (_b: number) => 0;
  let lanes: ((b: number) => number)[] = [];
  const sized = sizedSvg(host, 'Timing of the escapement over two beats: the balance swings smoothly, the pallet fork flicks across and the escape wheel jumps only while the balance passes through the middle.', (_w, rem) => rem * 12.4, (svg, w, h, rem) => {
    const left = rem * 0.2;
    const right = w - rem * 0.2;
    x = (b) => left + ((b + 0.5) / 2) * (right - left);
    const band = rem * 1.85;
    const laneTop = (i: number) => rem * 1.5 + i * (band + rem * 1.6) + rem * 1.05;
    // The strips where it all happens: each beat's unlock, push and drop.
    for (const k of [0, 1]) {
      el('rect', { x: x(k - IMPULSE / 2), y: rem * 1.5, width: x(k + IMPULSE / 2) - x(k - IMPULSE / 2), height: h - rem * 1.5, class: 'chart__band' }, svg);
      el('text', { x: x(k), y: rem * 1.05, class: 'chart__note chart__note--accent', 'text-anchor': 'middle' }, svg, 'tick');
    }
    const defs: { name: string; f: (b: number) => number; note: [number, string]; scale: number }[] = [
      { name: 'Balance', f: (b) => Math.sin(Math.PI * b), note: [0.5, 'swings free'], scale: 0.92 },
      { name: 'Pallet fork', f: (b) => palletLean(b), note: [0.5, 'resting on a pin'], scale: 0.7 },
      { name: 'Escape wheel', f: (b) => trainBeats(b) - trainBeats(-0.5) - 1, note: [0.5, 'locked'], scale: 0.85 },
    ];
    lanes = defs.map((lane, i) => {
      const top = laneTop(i);
      const mid = top + band / 2;
      const yOf = (v: number) => mid - v * (band / 2) * lane.scale;
      el('text', { x: left, y: top - rem * 0.45, class: 'chart__name chart__name--small' }, svg, lane.name);
      el('line', { x1: left, x2: right, y1: mid, y2: mid, class: 'chart__grid' }, svg);
      el('path', { d: pathOf(plot(lane.f, -0.5, 1.5, x, yOf, 320)), class: 'chart__line' }, svg);
      const [at, text] = lane.note;
      el('text', { x: x(at), y: yOf(lane.f(at)) - rem * 0.5, class: 'chart__note', 'text-anchor': 'middle' }, svg, text);
      return (b: number) => yOf(lane.f(b));
    });
    cursor = el('g', { class: 'chart__cursor' }, svg);
    el('line', { y1: rem * 1.5, y2: h, class: 'chart__cursor-line' }, cursor);
    dots = lanes.map(() => el('circle', { r: rem * 0.26, class: 'chart__dot' }, svg));
  });
  return {
    title: 'One swing, slowed down',
    caption: 'A full swing of the balance is two beats. Only as it passes through the middle (the shaded strips) does the fork flick across and the escape wheel jump half a tooth; the rest of the time the train is locked.',
    update() {
      const state = source.state();
      if (!state || !cursor) return;
      const b = mod(state.beat + 0.5, 2) - 0.5;
      cursor.setAttribute('transform', `translate(${x(b).toFixed(1)} 0)`);
      lanes.forEach((lane, i) => setAttrs(dots[i], { cx: x(b).toFixed(1), cy: lane(b).toFixed(1) }));
    },
    destroy() {
      dots = [];
      sized.dispose();
    },
  };
};

// ------------------------------------------------------------------ balance

/** A second of the balance's swing, fully wound, nearly run down, and as it is now: different swings, the same beat. */
const balance: ChartFactory = (host, { source }) => {
  let live: SVGPathElement | undefined;
  let dot: SVGCircleElement | undefined;
  let x = (_t: number) => 0;
  let y = (_deg: number) => 0;
  let shown = NaN;
  const sized = sizedSvg(host, 'The balance swinging over one second: fully wound it swings further than when nearly run down, but both cross the middle at the same moments, six times a second.', (w, rem) => Math.min(w * 0.6, rem * 12), (svg, w, h, rem) => {
    const left = rem * 2.6;
    const right = w - rem * 0.3;
    const top = rem * 1.6;
    const bottom = h - rem * 1.7;
    x = (t) => left + t * (right - left);
    y = (deg) => (top + bottom) / 2 - (deg / 330) * ((bottom - top) / 2);
    for (const deg of [-300, 0, 300]) {
      el('line', { x1: left, x2: right, y1: y(deg), y2: y(deg), class: deg ? 'chart__grid' : 'chart__axis' }, svg);
      el('text', { x: left - rem * 0.45, y: y(deg) + rem * 0.28, class: 'chart__tick', 'text-anchor': 'end' }, svg, deg ? `${deg > 0 ? '+' : '−'}300°` : '0°');
    }
    for (const t of [0, 0.5, 1]) el('text', { x: x(t), y: bottom + rem * 1.3, class: 'chart__tick', 'text-anchor': t === 0 ? 'start' : t === 1 ? 'end' : 'middle' }, svg, t === 0 ? '0' : t === 1 ? '1 s' : '½ s');
    const swing = (amplitude: number) => plot((t) => amplitude * Math.sin(Math.PI * BEATS_PER_SECOND * t), 0, 1, x, y, 300);
    const full = amplitudeFor(FULL_RESERVE, REST_SWING);
    const low = amplitudeFor(2, REST_SWING);
    el('path', { d: pathOf(swing(full)), class: 'chart__line chart__line--ghost' }, svg);
    el('path', { d: pathOf(swing(low)), class: 'chart__line chart__line--ghost chart__line--dashed' }, svg);
    // A key along the top: the two references, and the swing as it is now.
    const key = [
      { cls: 'chart__line chart__line--ghost', text: 'just wound' },
      { cls: 'chart__line chart__line--ghost chart__line--dashed', text: 'nearly run down' },
      { cls: 'chart__line chart__line--live', text: 'now' },
    ];
    let kx = left;
    for (const { cls, text } of key) {
      el('path', { d: pathOf([[kx, rem * 0.5], [kx + rem * 1.1, rem * 0.5]]), class: cls }, svg);
      const label = el('text', { x: kx + rem * 1.4, y: rem * 0.78, class: 'chart__note' }, svg, text);
      kx += rem * 1.4 + label.getComputedTextLength() + rem * 0.9;
    }
    // A tick where each push comes: as the balance passes the middle.
    for (let k = 0; k <= BEATS_PER_SECOND; k++) el('line', { x1: x(k / 6), x2: x(k / 6), y1: y(0) - rem * 0.35, y2: y(0) + rem * 0.35, class: 'chart__tickmark' }, svg);
    live = el('path', { class: 'chart__line chart__line--live' }, svg);
    dot = el('circle', { r: rem * 0.28, class: 'chart__dot' }, svg);
    shown = NaN;
  });
  const draw = (amplitude: number) => {
    if (!live || Math.abs(amplitude - shown) < 0.5) return;
    shown = amplitude;
    live.setAttribute('d', pathOf(plot((t) => amplitude * Math.sin(Math.PI * BEATS_PER_SECOND * t), 0, 1, x, y, 300)));
  };
  draw(REST_SWING);
  return {
    title: 'The swing',
    caption: 'However far it swings, each swing takes the same time: the curves cross the middle together, six times a second. So the rate holds as the spring runs down.',
    update() {
      const state = source.state();
      if (!state || !dot) return;
      draw(state.amplitude);
      const t = mod(state.beat, BEATS_PER_SECOND) / BEATS_PER_SECOND;
      setAttrs(dot, { cx: x(t).toFixed(1), cy: y(state.swing).toFixed(1) });
    },
    destroy: sized.dispose,
  };
};

// ------------------------------------------------------------------ hands

/** The three hands on dials of their own, and the two meshes that make the hour hand twelve times slower than the minute hand. */
const hands: ChartFactory = (host, { source }) => {
  let dialHands: { line: SVGLineElement; cx: number; cy: number; r: number; per: number }[] = [];
  const sized = sizedSvg(host, 'The seconds, minute and hour hands, and the motion works: the cannon pinion of 12 drives the minute wheel of 36, and its pinion of 10 drives the hour wheel of 40.', (w, rem) => Math.min(rem * 1.9, w * 0.107) * 2 + rem * 6.6, (svg, w, h, rem) => {
    const dials = [
      { name: 'Seconds', per: 360, note: 'fourth wheel' },
      { name: 'Minutes', per: 360 * 60, note: 'cannon pinion' },
      { name: 'Hours', per: 360 * 60 * 12, note: 'hour wheel' },
    ];
    const r = Math.min(rem * 1.9, w * 0.107);
    dialHands = dials.map((dial, i) => {
      const cx = (w / dials.length) * (i + 0.5);
      const cy = r + rem * 0.4;
      el('circle', { cx, cy, r, class: 'chart__dial' }, svg);
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * TAU;
        const r0 = k % 3 ? r * 0.86 : r * 0.78;
        el('line', { x1: cx + Math.sin(a) * r0, y1: cy - Math.cos(a) * r0, x2: cx + Math.sin(a) * r * 0.96, y2: cy - Math.cos(a) * r * 0.96, class: 'chart__axis' }, svg);
      }
      el('circle', { cx, cy, r: 2, class: 'chart__pin' }, svg);
      el('text', { x: cx, y: cy + r + rem * 1.15, class: 'chart__name chart__name--small', 'text-anchor': 'middle' }, svg, dial.name);
      el('text', { x: cx, y: cy + r + rem * 2.15, class: 'chart__note', 'text-anchor': 'middle' }, svg, dial.note);
      return { line: el('line', { x1: cx, y1: cy, x2: cx, y2: cy - r * 0.8, class: 'chart__hand chart__hand--accent' }, svg), cx, cy, r: r * 0.8, per: dial.per };
    });
    // The motion works: 12 drives 36 (÷3), then the minute wheel's pinion of 10 drives 40 (÷4).
    const meshes = [
      ['Cannon pinion 12', 'minute wheel 36', '÷3'],
      ['Minute pinion 10', 'hour wheel 40', '÷4'],
    ];
    meshes.forEach(([from, to, ratio], i) => {
      const yy = h - rem * (2.35 - i * 1.45);
      el('line', { x1: 0, x2: w, y1: yy - rem * 1.05, y2: yy - rem * 1.05, class: 'chart__grid' }, svg);
      el('text', { x: 0, y: yy, class: 'chart__tick' }, svg, `${from} → ${to}`);
      el('text', { x: w, y: yy, class: 'chart__note chart__note--accent', 'text-anchor': 'end' }, svg, ratio);
    });
  });
  return {
    title: 'Under the dial',
    caption: 'Every hand turns at a fixed fraction of the seconds hand’s speed. The cannon pinion’s 12 teeth on the minute wheel’s 36 make ÷3, and 10 on 40 make ÷4: the hour hand goes twelve times slower than the minute hand.',
    update() {
      const state = source.state();
      if (!state) return;
      const beats = trainBeats(state.beat);
      for (const { line, cx, cy, r, per } of dialHands) {
        const a = mod(beats / per, 1) * TAU;
        setAttrs(line, { x2: (cx + Math.sin(a) * r).toFixed(2), y2: (cy - Math.cos(a) * r).toFixed(2) });
      }
    },
    destroy() {
      dialHands = [];
      sized.dispose();
    },
  };
};

export const watchCharts: Record<string, ChartFactory> = {
  'watch-chain': chain,
  'watch-power': power,
  'watch-train': train,
  'watch-escapement': escapement,
  'watch-balance': balance,
  'watch-hands': hands,
};
