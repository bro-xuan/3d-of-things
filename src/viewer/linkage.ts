import { Box3, Vector3, type Mesh, type MeshStandardMaterial, type Object3D, type Texture } from 'three';
import type { Motion } from '../types';
import { Cloth, type ClothLayout } from './cloth';
import type { NodeRig, Rigs } from './rig';

type Resolve = (name: string) => Object3D | undefined;

/** How far a motion has gone at a control's value: along its curve's straight segments, or `turn` per unit from `from`. */
function amount(motion: Motion, value: number): number {
  const curve = motion.curve;
  if (curve?.length) {
    if (value <= curve[0][0]) return curve[0][1];
    for (let i = 1; i < curve.length; i++) {
      const [x0, y0] = curve[i - 1];
      const [x1, y1] = curve[i];
      if (value <= x1) return y0 + ((y1 - y0) * (value - x0)) / (x1 - x0 || 1);
    }
    return curve[curve.length - 1][1];
  }
  return value - (motion.from ?? 0);
}

/**
 * Parts moved by named controls rather than by time: a lens screwed forward by its focus, an iris
 * closed by its aperture, curtains run across by the shutter, a lever's stroke and the film it winds
 * on. Something else (src/viewer/filmcamera.ts) decides the controls' values; this turns them into
 * the content file's turns and slides, curtains rolling between rollers and film moving along its path.
 */
export class Linkage {
  private readonly values = new Map<string, number>();
  private readonly dirty = new Set<string>();
  private readonly turns: { rig: NodeRig; motion: Motion }[] = [];
  /** Per rig, its slides: a node can be moved by more than one control. */
  private readonly slides = new Map<NodeRig, { motion: Motion; vector: Vector3 }[]>();
  private readonly cloths: { cloth: Cloth; motion: Motion }[] = [];
  private readonly scrolls: { texture: Texture; base: number; motion: Motion }[] = [];

  constructor(motions: Motion[], resolve: Resolve, rigs: Rigs, root: Object3D) {
    for (const motion of motions) {
      if (!motion.control) continue;
      const node = resolve(motion.node);
      if (!node) continue;
      this.values.set(motion.control, NaN);
      if (motion.cloth) {
        const layout = node.userData.cloth as ClothLayout | undefined;
        if (!layout) continue;
        node.traverse((object) => {
          const mesh = object as Mesh;
          if (mesh.isMesh && mesh.geometry.attributes._cloth) this.cloths.push({ cloth: new Cloth(mesh, layout, root), motion });
        });
        continue;
      }
      if (motion.scroll !== undefined) {
        node.traverse((object) => {
          const mesh = object as Mesh;
          const texture = mesh.isMesh ? (mesh.material as MeshStandardMaterial).map : null;
          if (texture) this.scrolls.push({ texture, base: texture.offset.x, motion });
        });
        continue;
      }
      const rig = rigs.get(node);
      if (motion.turn !== undefined || (motion.curve && !motion.slide)) {
        const axis = new Vector3(...motion.axis).normalize();
        const pivot = motion.pivot ? new Vector3(...motion.pivot) : new Box3().setFromObject(node, true).getCenter(new Vector3());
        rig.axis.copy(rig.vectorToParent(axis).normalize());
        rig.pivot.copy(rig.pointToParent(pivot));
        this.turns.push({ rig, motion });
      }
      if (motion.slide) {
        const list = this.slides.get(rig) ?? [];
        list.push({ motion, vector: rig.vectorToParent(new Vector3(...motion.slide)) });
        this.slides.set(rig, list);
      }
    }
  }

  /** Whether anything answers to this control. */
  has(control: string): boolean {
    return this.values.has(control);
  }

  get controls(): string[] {
    return [...this.values.keys()];
  }

  /** Meshes whose vertices move (they can't keep a raycast index). */
  get deforming(): Mesh[] {
    return this.cloths.map(({ cloth }) => cloth.mesh);
  }

  set(control: string, value: number): void {
    if (!this.values.has(control) || this.values.get(control) === value) return;
    this.values.set(control, value);
    this.dirty.add(control);
  }

  /** Moves whatever the changed controls drive; returns whether anything moved. */
  apply(): boolean {
    if (!this.dirty.size) return false;
    const changed = (motion: Motion) => this.dirty.has(motion.control!);
    const value = (motion: Motion) => this.values.get(motion.control!) ?? 0;
    for (const { rig, motion } of this.turns) {
      if (changed(motion)) rig.angle = amount(motion, value(motion)) * (motion.curve ? 1 : motion.turn ?? 0) * Math.PI * 2;
    }
    for (const [rig, list] of this.slides) {
      if (!list.some(({ motion }) => changed(motion))) continue;
      rig.extra.set(0, 0, 0);
      for (const { motion, vector } of list) rig.extra.addScaledVector(vector, amount(motion, value(motion)));
    }
    for (const { cloth, motion } of this.cloths) if (changed(motion)) cloth.apply(amount(motion, value(motion)));
    for (const { texture, base, motion } of this.scrolls) if (changed(motion)) texture.offset.x = base + amount(motion, value(motion)) * (motion.scroll ?? 0);
    this.dirty.clear();
    return true;
  }
}
