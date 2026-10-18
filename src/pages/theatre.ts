// The layer the 3D models are drawn in. It outlives object pages, so going from one object to
// the next, the old model slides out while the new one slides in. On wide screens it spans the
// stage and the side panel, so a model can spill out over the page; on narrow screens and in
// full screen it stays inside the stage.
import { things } from '../content';
import { prefersReducedMotion } from '../dom';
// Only types: three.js arrives with the viewer, after the page is up.
import type { Viewer, ViewerOptions } from '../viewer/Viewer';

const wide = matchMedia('(min-width: 52.01rem)');

/** 1 if `to` comes after `from` in the gallery (going the shorter way round), -1 if before. */
function heading(from: string, to: string): 1 | -1 {
  const n = things.length;
  const a = things.findIndex((t) => t.slug === from);
  const b = things.findIndex((t) => t.slug === to);
  return (b - a + n) % n <= n / 2 ? 1 : -1;
}

class Theatre {
  readonly element = document.createElement('div');
  private current: { viewer: Viewer; slug: string } | null = null;
  private readonly leaving = new Set<Viewer>();
  /** Set while the last object's model makes way for the next one, with the side the next one comes in from (1: right). */
  private handover: { from: string; side: 1 | -1 } | null = null;
  /** The side the next object comes in from, when it was picked somewhere that shows the order. */
  private side: 1 | -1 | null = null;
  private page: HTMLElement | null = null;
  private stage: HTMLElement | null = null;

  constructor() {
    this.element.className = 'theatre';
    wide.addEventListener('change', () => this.place());
    document.addEventListener('fullscreenchange', () => this.place());
  }

  /** Moves the layer into a newly mounted object page, before its model loads, so a model leaving the last page stays in view. */
  adopt(page: HTMLElement, stage: HTMLElement): void {
    this.page = page;
    this.stage = stage;
    this.place();
  }

  private place(): void {
    if (!this.page || !this.stage) return;
    const spill = wide.matches && document.fullscreenElement !== this.stage;
    const parent = spill ? this.page : this.stage;
    if (this.element.parentElement !== parent) parent.append(this.element);
    this.element.dataset.spill = String(spill);
    for (const viewer of [this.current?.viewer, ...this.leaving]) viewer?.relayout();
  }

  /** A viewer for the object page, drawn in this layer and framed in the page's stage. */
  open(ViewerImpl: typeof Viewer, slug: string, container: HTMLElement, options: ViewerOptions): Viewer {
    // A retry on the same page replaces the viewer that failed.
    this.current?.viewer.dispose();
    this.current = null;
    const viewer = new ViewerImpl(container, { ...options, host: this.element, frame: this.stage ?? container });
    this.current = { viewer, slug };
    return viewer;
  }

  /** Whether the previous object's model is still making way (the page then skips its poster). */
  get handingOver(): boolean {
    return this.handover !== null;
  }

  /** The next object was picked from a row that shows them in order (1: one to the right), so it comes in from that side,
   *  rather than the way round the gallery that's shorter. */
  comeFrom(side: 1 | -1): void {
    this.side = side;
  }

  /** Brings a loaded model on: sliding in to take over from the last object, or the usual swing round. */
  async show(viewer: Viewer, slug: string): Promise<void> {
    const handover = this.handover;
    this.handover = null;
    if (handover && handover.from !== slug && !prefersReducedMotion()) {
      await viewer.enter(handover.side);
    } else {
      viewer.reveal();
      await viewer.intro();
    }
  }

  /** The object page is going away; `next` is the object replacing it, if it's another object. */
  release(next: string | null): void {
    const current = this.current;
    const side = this.side;
    this.current = null;
    this.side = null;
    if (current && next && next !== current.slug) {
      this.handover = { from: current.slug, side: side ?? heading(current.slug, next) };
      this.leaving.add(current.viewer);
      // The next object comes in from the side it lies on, so this one leaves by the other.
      void current.viewer.leave(this.handover.side === 1 ? -1 : 1).then(() => {
        current.viewer.dispose();
        this.leaving.delete(current.viewer);
      });
      return;
    }
    current?.viewer.dispose();
    for (const viewer of this.leaving) viewer.dispose();
    this.leaving.clear();
    this.handover = null;
    this.element.remove();
    this.page = this.stage = null;
  }
}

export const theatre = new Theatre();
