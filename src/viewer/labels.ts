import { Box3, Raycaster, Vector3, type Camera, type Mesh, type Object3D } from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { partLetter } from '../content';
import { icons } from '../dom';
import type { Annotation, Part } from '../types';

const _dir = new Vector3();

function anchor(parent: Object3D, worldPosition: Vector3, element: HTMLElement): CSS2DObject {
  const object = new CSS2DObject(element);
  object.position.copy(parent.worldToLocal(worldPosition.clone()));
  parent.add(object);
  return object;
}

/**
 * Numbered callout markers. They're pointer-only: the callout list in the side
 * panel is the keyboard and screen-reader route to the same content.
 */
export class Hotspots {
  private readonly objects: CSS2DObject[] = [];
  private readonly elements: HTMLElement[] = [];
  private readonly rest: Vector3[] = [];
  private readonly occluded: boolean[] = [];
  private readonly raycaster = new Raycaster();

  constructor(annotations: Annotation[], resolve: (annotation: Annotation) => Object3D, onSelect: (index: number) => void) {
    this.raycaster.firstHitOnly = true;
    annotations.forEach((annotation, i) => {
      const marker = document.createElement('div');
      marker.className = 'hotspot';
      marker.setAttribute('aria-hidden', 'true');
      const dot = document.createElement('span');
      dot.className = 'hotspot__dot';
      dot.textContent = String(i + 1);
      const label = document.createElement('span');
      label.className = 'hotspot__label';
      label.textContent = annotation.title;
      marker.append(dot, label);
      // Callouts about the inside stay hidden while the case is in the way.
      if (annotation.explode !== undefined) marker.classList.add('is-inside');
      marker.addEventListener('click', () => onSelect(i));

      const wrap = document.createElement('div');
      wrap.className = 'hotspot-anchor';
      wrap.append(marker);
      const position = new Vector3(...annotation.position);
      this.objects.push(anchor(resolve(annotation), position, wrap));
      this.elements.push(marker);
      this.rest.push(position);
      this.occluded.push(false);
    });
  }

  get count(): number {
    return this.objects.length;
  }

  /** The marker's anchor in the scene, for hanging a card on. */
  anchorOf(index: number): Object3D | undefined {
    return this.objects[index];
  }

  position(index: number, target = new Vector3()): Vector3 {
    return this.objects[index].getWorldPosition(target);
  }

  /** How far a hotspot has travelled from its rest position (when its part is exploded). */
  displacement(index: number): Vector3 {
    return this.position(index).sub(this.rest[index]);
  }

  setActive(index: number | null): void {
    this.elements.forEach((el, i) => el.classList.toggle('is-active', i === index));
  }

  /** Dims markers that sit behind the model from the camera's point of view. */
  updateOcclusion(camera: Camera, meshes: Mesh[]): void {
    this.objects.forEach((object, i) => {
      object.getWorldPosition(_dir).sub(camera.position);
      const distance = _dir.length();
      this.raycaster.set(camera.position, _dir.divideScalar(distance));
      this.raycaster.far = Math.max(0, distance - 0.035);
      const hidden = this.raycaster.intersectObjects(meshes, false).length > 0;
      if (hidden !== this.occluded[i]) {
        this.occluded[i] = hidden;
        this.elements[i].classList.toggle('is-occluded', hidden);
      }
    });
  }

  dispose(): void {
    for (const object of this.objects) object.removeFromParent();
  }
}

/** Lettered tags that appear on each part while the model is pulled apart. */
export class PartBadges {
  private readonly objects: CSS2DObject[] = [];
  private readonly elements = new Map<number, HTMLElement>();
  private readonly anchors = new Map<number, CSS2DObject>();
  private readonly own = new Map<number, Set<Object3D>>();
  private readonly raycaster = new Raycaster();

  constructor(
    parts: Part[],
    resolve: (name: string) => Object3D | undefined,
    anchorFor: (node: Object3D) => Object3D,
    onHover: (index: number | null) => void,
  ) {
    parts.forEach((part, i) => {
      const node = resolve(part.node);
      // Parts that stay put (the frame everything comes off) are named in the legend but not tagged.
      if (!node || part.distance === 0) return;
      const badge = document.createElement('div');
      badge.className = 'part-badge';
      badge.setAttribute('aria-hidden', 'true');
      badge.dataset.label = part.label;
      badge.textContent = partLetter(i);
      badge.addEventListener('pointerenter', () => onHover(i));
      badge.addEventListener('pointerleave', () => onHover(null));
      const centre = new Box3().setFromObject(node, true).getCenter(new Vector3());
      const object = anchor(anchorFor(node), centre, badge);
      this.objects.push(object);
      this.anchors.set(i, object);
      this.elements.set(i, badge);
      const own = new Set<Object3D>();
      for (const name of [part.node, ...(part.with ?? [])]) resolve(name)?.traverse((o) => own.add(o));
      this.own.set(i, own);
    });
  }

  setHighlighted(index: number | null): void {
    for (const [i, el] of this.elements) el.classList.toggle('is-highlighted', i === index);
  }

  /** The tag's anchor in the scene (at the part's middle), for hanging a card on. */
  anchorOf(index: number): Object3D | undefined {
    return this.anchors.get(index);
  }

  /** Shows each tag once its part is most of the way out. */
  update(progress: number[]): void {
    for (const [i, el] of this.elements) el.classList.toggle('is-out', progress[i] > 0.6);
  }

  /** Dims tags whose part is hidden behind another part from the camera. */
  updateOcclusion(camera: Camera, meshes: Mesh[]): void {
    this.raycaster.firstHitOnly = true;
    for (const [i, object] of this.anchors) {
      const el = this.elements.get(i)!;
      if (!el.classList.contains('is-out')) continue;
      object.getWorldPosition(_dir).sub(camera.position);
      const distance = _dir.length();
      this.raycaster.set(camera.position, _dir.divideScalar(distance));
      this.raycaster.far = distance;
      const first = this.raycaster.intersectObjects(meshes, false)[0];
      el.classList.toggle('is-occluded', !!first && !this.own.get(i)!.has(first.object));
    }
  }

  dispose(): void {
    for (const object of this.objects) object.removeFromParent();
  }
}

/** Labels for a step of "How it works", pinned to parts (how fast a wheel turns, say). They ride with the parts but don't spin with them. */
export class Tags {
  private objects: CSS2DObject[] = [];

  /** One tag per anchor (an object placed where the tag points, which it owns from now on). */
  set(entries: { anchor: Object3D; text: string }[]): void {
    this.clear();
    entries.forEach(({ anchor, text }, i) => {
      const tag = document.createElement('div');
      tag.className = 'step-tag';
      tag.setAttribute('aria-hidden', 'true');
      tag.style.setProperty('--i', String(i));
      const label = document.createElement('span');
      label.className = 'step-tag__text';
      label.textContent = text;
      tag.append(label);
      const object = new CSS2DObject(tag);
      anchor.add(object);
      this.objects.push(object);
    });
  }

  clear(): void {
    for (const object of this.objects) {
      object.parent?.removeFromParent();
      object.removeFromParent();
    }
    this.objects = [];
  }

  /** Hides tags that would sit past the frame's right edge (over the page's side panel). */
  clip(camera: Camera, host: DOMRect, frame: DOMRect | null): void {
    for (const object of this.objects) {
      object.getWorldPosition(_dir).project(camera);
      const x = host.left + ((_dir.x + 1) / 2) * host.width;
      object.element.classList.toggle('is-offstage', !!frame && x > frame.right - 24);
    }
  }
}

/** What an explanation card says: a callout's number or a part's letter, a title, and some text. */
export interface CardContent {
  mark: string;
  kind: 'callout' | 'part';
  title: string;
  text?: string;
  eyebrow?: string;
}

/**
 * An explanation card beside a point on the model (a callout's marker, or a part). It sits on
 * whichever side of the point has more room in the stage, and stays inside it top to bottom.
 * It's pointer-only like the markers: the side panel carries the same text for everyone else.
 */
export class SceneCard {
  private readonly object: CSS2DObject;
  private readonly element = document.createElement('div');
  private readonly mark = document.createElement('span');
  private readonly eyebrow = document.createElement('p');
  private readonly title = document.createElement('p');
  private readonly text = document.createElement('p');
  private readonly point = new Vector3();

  constructor(onClose: () => void) {
    const wrap = document.createElement('div');
    wrap.className = 'scene-card-anchor';
    this.element.className = 'scene-card';
    this.element.setAttribute('aria-hidden', 'true');
    this.mark.className = 'scene-card__mark';
    this.eyebrow.className = 'scene-card__eyebrow';
    this.title.className = 'scene-card__title';
    this.text.className = 'scene-card__text';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'scene-card__close';
    close.tabIndex = -1;
    close.innerHTML = icons.close;
    close.addEventListener('click', onClose);
    const head = document.createElement('div');
    head.className = 'scene-card__head';
    const titles = document.createElement('div');
    titles.append(this.eyebrow, this.title);
    head.append(this.mark, titles, close);
    this.element.append(head, this.text);
    wrap.append(this.element);
    this.object = new CSS2DObject(wrap);
  }

  show(parent: Object3D, position: Vector3, content: CardContent): void {
    this.mark.textContent = content.mark;
    this.mark.dataset.kind = content.kind;
    this.eyebrow.textContent = content.eyebrow ?? '';
    this.eyebrow.hidden = !content.eyebrow;
    this.title.textContent = content.title;
    this.text.textContent = content.text ?? '';
    this.text.hidden = !content.text;
    this.object.position.copy(position);
    if (this.object.parent !== parent) {
      this.object.removeFromParent();
      parent.add(this.object);
    }
    // Replay the entrance for each new card.
    this.element.classList.remove('is-in');
    void this.element.offsetWidth;
    this.element.classList.add('is-in');
  }

  hide(): void {
    this.object.removeFromParent();
  }

  /** After each render: picks the roomier side of the point and keeps the card inside the frame. */
  place(camera: Camera, host: DOMRect, frame: DOMRect): void {
    if (!this.object.parent) return;
    this.object.getWorldPosition(this.point).project(camera);
    const x = host.left + ((this.point.x + 1) / 2) * host.width;
    const y = host.top + ((1 - this.point.y) / 2) * host.height;
    const side = x > frame.left + frame.width * 0.55 ? 'left' : 'right';
    if (this.element.dataset.side !== side) this.element.dataset.side = side;
    const height = this.element.offsetHeight;
    const margin = 14;
    const top = y - height / 2;
    const shift = top < frame.top + margin ? frame.top + margin - top : top + height > frame.bottom - margin ? frame.bottom - margin - top - height : 0;
    this.element.style.setProperty('--shift', `${Math.round(shift)}px`);
  }
}
