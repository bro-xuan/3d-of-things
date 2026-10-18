// Small helpers for the charts in "How it works": they're drawn in SVG at the pixel size they're
// shown at, so their type can be set in rem like the rest of the page.

const NS = 'http://www.w3.org/2000/svg';

type Attrs = Record<string, string | number | undefined>;

export function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Attrs = {}, parent?: Element, text?: string): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, tag);
  for (const [name, value] of Object.entries(attrs)) if (value !== undefined) node.setAttribute(name, String(value));
  if (text !== undefined) node.textContent = text;
  parent?.append(node);
  return node;
}

/** An SVG path through points. */
export const pathOf = (points: [number, number][]): string =>
  points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');

/** Samples f over [a, b] into points mapped by x and y. */
export function plot(f: (t: number) => number, a: number, b: number, x: (t: number) => number, y: (v: number) => number, n = 240): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = a + ((b - a) * i) / n;
    points.push([x(t), y(f(t))]);
  }
  return points;
}

export function setAttrs(node: Element | undefined, attrs: Attrs): void {
  if (!node) return;
  for (const [name, value] of Object.entries(attrs)) if (value !== undefined) node.setAttribute(name, String(value));
}

/** The root font size in CSS pixels, for laying text out in rem. */
export const remPx = (): number => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

/**
 * An SVG as wide as its host in CSS pixels, drawn by `build` and drawn again whenever that width
 * changes. `height` gives its height for a width.
 */
export function sizedSvg(host: HTMLElement, label: string, height: (width: number, rem: number) => number, build: (svg: SVGSVGElement, width: number, height: number, rem: number) => void) {
  const svg = el('svg', { class: 'chart', role: 'img', 'aria-label': label });
  host.prepend(svg);
  let drawn = 0;
  const layout = () => {
    const width = Math.round(host.clientWidth);
    if (!width || width === drawn) return;
    drawn = width;
    const rem = remPx();
    const h = Math.round(height(width, rem));
    setAttrs(svg, { viewBox: `0 0 ${width} ${h}`, width, height: h });
    svg.replaceChildren();
    build(svg, width, h, rem);
  };
  const observer = new ResizeObserver(layout);
  observer.observe(host);
  layout();
  return {
    svg,
    dispose() {
      observer.disconnect();
      svg.remove();
    },
  };
}
