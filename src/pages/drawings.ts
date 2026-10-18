// The object's drawings: front, side and top views drawn by the viewer as ink line drawings, at one
// scale and dimensioned at the model's real size. They're laid out as on a draughtsman's sheet (the
// top view above the front, the side view beside it) or, where it makes them bigger, stacked one under
// another, as a plate's column of views is.
import { el, setAttrs, sizedSvg } from '../charts/svg';
// Only the type: the viewer draws them once it has loaded.
import type { Drawing } from '../viewer/Viewer';

type View = Drawing['view'];
type Size = { x: number; y: number; z: number };
type Box = { x: number; y: number; w: number; h: number };

/** A length as a draughtsman would letter it: millimetres when small, centimetres otherwise. */
function measure(metres: number): string {
  const mm = metres * 1000;
  if (mm < 20) return `${Math.round(mm)} mm`;
  const cm = mm / 10;
  return `${cm < 10 ? cm.toFixed(1) : Math.round(cm)} cm`;
}

/** Room for lettering: the height dimension on the left, a width under a view, a name over it, the gap between views. */
const room = (rem: number) => ({ left: rem * 2.6, below: rem * 2.7, above: rem * 1.4, gap: rem * 0.9 });

type Arrangement = 'sheet' | 'stack';

/** The scale (CSS pixels per metre) each arrangement allows for a model this size in a box this big. */
function scales(size: Size, width: number, height: number, rem: number): Record<Arrangement, number> {
  const { left, below, above, gap } = room(rem);
  const m = 0.05 * Math.max(size.x, size.y, size.z);
  // Top over front, side beside the front.
  const sheet = Math.min((width - left - gap * 2) / (size.x + size.z + m * 4), (height - above * 2 - below - gap) / (size.y + size.z + m * 4));
  // Front, side and top, one under another.
  const stack = Math.min((width - left) / (Math.max(size.x, size.z) + m * 2), (height - (above + below) * 3) / (size.y * 2 + size.z + m * 6));
  return { sheet: Math.max(1, sheet), stack: Math.max(1, stack) };
}

/** The scale the drawings will be shown at (CSS pixels per metre), for rendering them sharp at that size. */
export function drawingScale(size: Size, width: number, height: number, rem: number): number {
  const { sheet, stack } = scales(size, width, height, rem);
  return Math.max(sheet, stack);
}

interface Options {
  /** The tallest the drawings may be, in CSS pixels. */
  maxHeight(): number;
  /** A view picked: the page turns the model to match it. */
  onView?(view: View): void;
}

const NAMES: Record<View, string> = { front: 'Front', side: 'Side', top: 'Top' };

/** Lays the drawings out in `host`; returns a function that takes them down again (the images stay usable). */
export function showDrawings(host: HTMLElement, drawings: Drawing[], options: Options): () => void {
  const byView = Object.fromEntries(drawings.map((d) => [d.view, d])) as Record<View, Drawing | undefined>;
  const { front, side, top } = byView;
  host.replaceChildren();
  if (!front || !side || !top) return () => {};
  const m = front.margin;
  const size = { x: front.across, y: front.tall, z: side.across };
  const label = `Drawings of the front, side and top: ${measure(size.x)} wide, ${measure(size.y)} tall and ${measure(size.z)} deep.`;

  /** Where each view goes (CSS pixels, margins included) for a width, and how tall that makes the drawings. */
  const layout = (width: number, rem: number) => {
    const { left, below, above, gap } = room(rem);
    const choice = scales(size, width, options.maxHeight(), rem);
    const arrangement: Arrangement = choice.stack > choice.sheet ? 'stack' : 'sheet';
    const scale = choice[arrangement];
    const box = (d: Drawing) => ({ w: (d.across + m * 2) * scale, h: (d.tall + m * 2) * scale });
    const [f, s, t] = [box(front), box(side), box(top)];
    const at = {} as Record<View, Box>;
    let height: number;
    if (arrangement === 'sheet') {
      // Centred across the room, the lettering on the left counted as part of the sheet.
      const x0 = left + Math.max(0, (width - (left + f.w + gap * 2 + s.w)) / 2);
      at.top = { x: x0, y: above, ...t };
      at.front = { x: x0, y: above + t.h + gap + above, ...f };
      at.side = { x: x0 + f.w + gap * 2, y: at.front.y, ...s };
      height = at.front.y + f.h + below;
    } else {
      const wide = Math.max(f.w, s.w, t.w);
      const x0 = left + Math.max(0, (width - (left + wide)) / 2);
      let y = above;
      for (const [view, b] of [['front', f], ['side', s], ['top', t]] as const) {
        at[view] = { x: x0 + (wide - b.w) / 2, y, ...b };
        y += b.h + below + above;
      }
      height = y - above;
    }
    return { arrangement, scale, at, height };
  };

  const sized = sizedSvg(host, label, (width, rem) => layout(width, rem).height, (svg, width, _height, rem) => {
    const { arrangement, scale, at } = layout(width, rem);
    const tick = rem * 0.35;
    /** A view's model extremes, inside its margin. */
    const inner = (b: Box) => ({ l: b.x + m * scale, r: b.x + b.w - m * scale, t: b.y + m * scale, b: b.y + b.h - m * scale });
    for (const view of ['front', 'side', 'top'] as const) {
      const b = at[view];
      // Each view is a button: picking it turns the model to be seen the same way.
      const g = el('g', { class: 'drawing__view', tabindex: options.onView ? 0 : undefined, role: options.onView ? 'button' : undefined, 'aria-label': options.onView ? `Turn the model to its ${view} view` : undefined }, svg);
      el('rect', { x: b.x, y: b.y, width: b.w, height: b.h, rx: 4, class: 'drawing__hit' }, g);
      el('image', { href: byView[view]!.url, x: b.x, y: b.y, width: b.w, height: b.h, preserveAspectRatio: 'none' }, g);
      el('text', { x: inner(b).l, y: b.y - rem * 0.5, class: 'drawing__name' }, svg, NAMES[view]);
      if (options.onView) {
        const pick = () => options.onView!(view);
        g.addEventListener('click', pick);
        g.addEventListener('keydown', (event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          pick();
        });
      }
    }
    /** A dimension under a view, between its extremes. */
    const across = (view: View, text: string) => {
      const box = inner(at[view]);
      const dy = box.b + m * scale + rem * 0.9;
      el('path', { d: `M${box.l} ${box.b + 3}V${dy + tick}M${box.r} ${box.b + 3}V${dy + tick}`, class: 'drawing__extension' }, svg);
      el('path', { d: `M${box.l} ${dy}H${box.r}M${box.l} ${dy - tick}V${dy + tick}M${box.r} ${dy - tick}V${dy + tick}`, class: 'drawing__dimension' }, svg);
      el('text', { x: (box.l + box.r) / 2, y: dy + rem * 1.2, class: 'drawing__measure', 'text-anchor': 'middle' }, svg, text);
    };
    /** A dimension left of a view, up its height: lettered up the line, or across beside it when the line is short. */
    const up = (view: View, text: string) => {
      const box = inner(at[view]);
      const dx = box.l - rem * 1.1;
      el('path', { d: `M${box.l - 3} ${box.t}H${dx - tick}M${box.l - 3} ${box.b}H${dx - tick}`, class: 'drawing__extension' }, svg);
      el('path', { d: `M${dx} ${box.t}V${box.b}M${dx - tick} ${box.t}H${dx + tick}M${dx - tick} ${box.b}H${dx + tick}`, class: 'drawing__dimension' }, svg);
      const ty = (box.t + box.b) / 2;
      const lettering = el('text', { x: dx - rem * 0.5, y: ty, class: 'drawing__measure', 'text-anchor': 'middle', transform: `rotate(-90 ${dx - rem * 0.5} ${ty})` }, svg, text);
      if (lettering.getComputedTextLength() + rem * 0.8 > box.b - box.t) {
        lettering.removeAttribute('transform');
        setAttrs(lettering, { x: dx - rem * 0.45, y: ty + rem * 0.3, 'text-anchor': 'end' });
      }
    };
    across('front', measure(size.x));
    up('front', measure(size.y));
    across('side', measure(size.z));
    if (arrangement === 'stack') across('top', `${measure(size.x)} × ${measure(size.z)}`);
  });
  return () => {
    sized.dispose();
    host.replaceChildren();
  };
}
