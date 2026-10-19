import { Float32BufferAttribute, Matrix3, Matrix4, Vector3, type BufferAttribute, type Mesh, type Object3D } from 'three';

/** A coil spring as the build laid it out (objects/desk-lamp/augment.mjs), in the source model's millimetres: the
 *  centre of the pin it hangs from, the way it points, where its coil starts and ends along that line (mm from the
 *  anchor), and how far apart its two pins are in the plane its arm moves in. */
export interface SpringLayout {
  arm: string;
  anchor: [number, number, number];
  axis: [number, number, number];
  coil: [number, number];
  span: number;
}

/**
 * A coil spring that stretches between its pins: the hook on the anchor stays, the far hook moves out along the
 * spring's line and the coil between spreads evenly. Its turn about the anchor is the linkage's (a `control` motion);
 * this only changes its length. Works in the mesh's own space, whatever its quantisation.
 */
export class Stretch {
  /** Per vertex, its position at rest (the mesh's space). */
  private readonly rest: Float32Array;
  /** Per vertex, how much of the extra length it moves by: 0 on the anchor's hook, 1 on the far one. */
  private readonly share: Float32Array;
  /** One millimetre along the spring's line, in the mesh's space. */
  private readonly along = new Vector3();
  private span: number;

  constructor(
    readonly mesh: Mesh,
    readonly layout: SpringLayout,
    root: Object3D,
  ) {
    const toRoot = root.matrixWorld.clone().invert().multiply(mesh.matrixWorld);
    const toLocal = new Matrix4().copy(toRoot).invert();
    // Quantised positions only cover the spring's bounds at rest, and it grows past them: work in floats.
    const source = mesh.geometry.attributes.position as BufferAttribute;
    const n = source.count;
    this.rest = new Float32Array(n * 3);
    this.share = new Float32Array(n);
    const p = new Vector3();
    const [ax, ay, az] = layout.axis;
    const [c0, c1] = layout.coil;
    for (let i = 0; i < n; i++) {
      p.fromBufferAttribute(source, i);
      this.rest.set([p.x, p.y, p.z], i * 3);
      p.applyMatrix4(toRoot).multiplyScalar(1000);
      const t = (p.x - layout.anchor[0]) * ax + (p.y - layout.anchor[1]) * ay + (p.z - layout.anchor[2]) * az;
      this.share[i] = Math.min(1, Math.max(0, (t - c0) / (c1 - c0)));
    }
    mesh.geometry.setAttribute('position', new Float32BufferAttribute(this.rest.slice(), 3));
    // The line in the plane the arm moves in grows by `span`'s change; along the spring's own line that's a little more.
    const inPlane = Math.hypot(ay, az) || 1;
    this.along.set(ax, ay, az).multiplyScalar(1 / 1000 / inPlane).applyMatrix3(new Matrix3().setFromMatrix4(toLocal));
    this.span = layout.span;
    // It grows past its bounds at rest.
    mesh.frustumCulled = false;
  }

  /** Stretches it to `span` mm between its pins, measured in the arm's plane; returns whether it changed. */
  apply(span: number): boolean {
    if (Math.abs(span - this.span) < 1e-3) return false;
    this.span = span;
    const extra = span - this.layout.span;
    const position = this.mesh.geometry.attributes.position as BufferAttribute;
    const { rest, share, along } = this;
    for (let i = 0; i < share.length; i++) {
      const s = share[i] * extra;
      position.setXYZ(i, rest[i * 3] + along.x * s, rest[i * 3 + 1] + along.y * s, rest[i * 3 + 2] + along.z * s);
    }
    position.needsUpdate = true;
    return true;
  }
}
