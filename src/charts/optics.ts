// Charts for the optical objects: what happens to the picture on its way through.
import type { ChartFactory } from './index';
import { el, sizedSvg } from './svg';

/** A letter F in a circle of view, turned and scaled: how the picture looks at a stage of the light path. */
function view(svg: SVGSVGElement, cx: number, cy: number, r: number, { flip = false, scale = 1 } = {}) {
  el('circle', { cx, cy, r, class: 'chart__dial' }, svg);
  const g = el('g', { transform: `translate(${cx} ${cy}) scale(${(flip ? -1 : 1) * scale} ${(flip ? -1 : 1) * scale})` }, svg);
  // An F: a stem and two arms, so upside down and back to front can't be confused.
  const u = r * 0.42;
  el('path', { d: `M${-u * 0.5} ${u}V${-u}H${u * 0.7}M${-u * 0.5} ${-u * 0.05}H${u * 0.4}`, class: 'chart__glyph' }, g);
}

/** Through a pair of binoculars: the objective turns the picture over, the prisms turn it back, the eyepiece enlarges it. */
const binoculars: ChartFactory = (host) => {
  const sized = sizedSvg(host, 'The picture through a pair of binoculars: upside down and back to front after the objective, the right way round after the four reflections in the prisms, then enlarged by the eyepiece.', (w, rem) => Math.min(w * 0.42, rem * 9), (svg, w, _h, rem) => {
    const r = Math.min(rem * 2.2, w * 0.11);
    const cy = r + rem * 0.4;
    const stages = [
      { x: w * 0.16, flip: true, scale: 1, name: 'Objective', note: 'upside down' },
      { x: w * 0.5, flip: false, scale: 1, name: 'Prisms', note: '4 reflections' },
      { x: w * 0.84, flip: false, scale: 1.45, name: 'Eyepiece', note: 'enlarged' },
    ];
    stages.forEach((stage, i) => {
      view(svg, stage.x, cy, r, stage);
      el('text', { x: stage.x, y: cy + r + rem * 1.15, class: 'chart__name chart__name--small', 'text-anchor': 'middle' }, svg, stage.name);
      el('text', { x: stage.x, y: cy + r + rem * 2.15, class: 'chart__note', 'text-anchor': 'middle' }, svg, stage.note);
      if (i > 0) {
        const x0 = stages[i - 1].x + r + rem * 0.4;
        const x1 = stage.x - r - rem * 0.4;
        el('path', { d: `M${x0} ${cy}H${x1}M${x1 - 5} ${cy - 4}L${x1} ${cy}L${x1 - 5} ${cy + 4}`, class: 'chart__light' }, svg);
      }
    });
  });
  return {
    title: 'What the picture does',
    caption: 'A lens alone shows the world upside down and back to front. Each prism turns it over one way, so after both the picture is the right way round, and only then does the eyepiece enlarge it.',
    destroy: sized.dispose,
  };
};

export const opticsCharts: Record<string, ChartFactory> = {
  'binoculars-image': binoculars,
};
