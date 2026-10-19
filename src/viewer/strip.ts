import { Float32BufferAttribute, Matrix3, Matrix4, Vector3, type BufferAttribute, type Mesh, type Object3D } from 'three';
import { bladePath, springPath, type BladeLayout, type PathAt, type SpringLayout } from './tapemeasure';

/** A strip of steel the build laid out along a path across an axis (x): a tape measure's blade or its spring. The mesh's
 *  _CLOTH attribute packs each vertex's arc length along it (0..uSpan) and its offset across the steel's thickness
 *  (±fSpan) into 0..1. */
export type StripLayout = (BladeLayout | SpringLayout) & { uSpan: number; fSpan: number; x0?: number };

function pathFor(layout: StripLayout, value: number): PathAt {
  return layout.kind === 'tape-blade' ? bladePath(layout, value).at : springPath(layout, value).at;
}

/**
 * Steel strip that bends to its path as a control moves: a blade paying out of its roll, a spring winding round its
 * post. Each vertex goes where its arc length puts it, at its offset across the steel (and, on a blade, the curve
 * across its width, which flattens on the roll), and its normal turns with the strip about the axis. Works in the
 * mesh's own space, whatever its quantisation, like the shutter's cloth (src/viewer/cloth.ts).
 */
export class Strip {
  private readonly toLocal: Matrix4;
  private readonly toLocalNormal: Matrix3;
  /** Per vertex: arc length, offset, x (mm), and the rest normal (model frame) with the angle the strip had there. */
  private readonly rest: Float32Array;
  private readonly _p = new Vector3();
  private readonly _n = new Vector3();
  private readonly _at = [0, 0, 0, 0, 0];
  private value = NaN;

  constructor(
    readonly mesh: Mesh,
    readonly layout: StripLayout,
    root: Object3D,
  ) {
    const toRoot = root.matrixWorld.clone().invert().multiply(mesh.matrixWorld);
    this.toLocal = toRoot.clone().invert();
    this.toLocalNormal = new Matrix3().getNormalMatrix(this.toLocal);
    const normalToRoot = new Matrix3().getNormalMatrix(toRoot);
    // Quantised positions only cover the strip's bounds at rest, and it runs out far beyond them: work in floats.
    for (const name of ['position', 'normal']) {
      const source = mesh.geometry.attributes[name] as BufferAttribute;
      const floats = new Float32Array(source.count * 3);
      for (let i = 0; i < source.count; i++) floats.set([source.getX(i), source.getY(i), source.getZ(i)], i * 3);
      mesh.geometry.setAttribute(name, new Float32BufferAttribute(floats, 3));
    }
    const { position, normal, _cloth: along } = mesh.geometry.attributes as Record<string, BufferAttribute>;
    const n = position.count;
    this.rest = new Float32Array(n * 7);
    const at = pathFor(layout, 0);
    for (let i = 0; i < n; i++) {
      const u = along.getX(i) * layout.uSpan;
      const f = (along.getY(i) * 2 - 1) * layout.fSpan;
      const x = this._p.fromBufferAttribute(position, i).applyMatrix4(toRoot).x * 1000;
      const m = this._n.fromBufferAttribute(normal, i).applyMatrix3(normalToRoot).normalize();
      at(u, this._at);
      this.rest.set([u, f, x, m.x, m.y, m.z, Math.atan2(this._at[2], this._at[3])], i * 7);
    }
    mesh.frustumCulled = false;
  }

  /** How far the blade's curve lifts its face at x across it, and how steeply. */
  private cup(x: number): [number, number] {
    const layout = this.layout;
    if (layout.kind !== 'tape-blade') return [0, 0];
    const d = Math.min(Math.abs(x - (layout.x0 ?? 0)), layout.cup * 0.99);
    const h = Math.sqrt(layout.cup * layout.cup - d * d);
    return [layout.cup - h, (Math.sign(x - (layout.x0 ?? 0)) * d) / h];
  }

  apply(value: number): void {
    if (value === this.value) return;
    this.value = value;
    const { rest, _p: p, _n: m, _at: o } = this;
    const at = pathFor(this.layout, value);
    const { position, normal } = this.mesh.geometry.attributes as Record<string, BufferAttribute>;
    for (let i = 0; i < position.count; i++) {
      const k = i * 7;
      const [u, f, x] = [rest[k], rest[k + 1], rest[k + 2]];
      at(u, o);
      const [lift, slope] = this.cup(x);
      const off = f + lift * o[4];
      p.set(x / 1000, (o[0] + o[2] * off) / 1000, (o[1] + o[3] * off) / 1000).applyMatrix4(this.toLocal);
      position.setXYZ(i, p.x, p.y, p.z);
      if (Math.abs(rest[k + 3]) > 0.7) {
        // An edge: its normal turns with the strip about the axis.
        const turn = Math.atan2(o[2], o[3]) - rest[k + 6];
        const [c, s] = [Math.cos(turn), Math.sin(turn)];
        const [ny, nz] = [rest[k + 4], rest[k + 5]];
        m.set(rest[k + 3], ny * c + nz * s, nz * c - ny * s);
      } else {
        // A face: the strip's own, tilted across by the blade's curve.
        const side = Math.sign(f) || 1;
        const tilt = o[4] * slope;
        m.set(-side * tilt, side * o[2], side * o[3]);
      }
      m.applyMatrix3(this.toLocalNormal).normalize();
      normal.setXYZ(i, m.x, m.y, m.z);
    }
    position.needsUpdate = true;
    normal.needsUpdate = true;
  }
}
