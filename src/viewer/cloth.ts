import { Float32BufferAttribute, Matrix3, Matrix4, Vector3, type BufferAttribute, type Mesh, type Object3D } from 'three';

/** A shutter curtain as the build laid it out (camera-frame millimetres: the source model's metres × 1000). */
export interface ClothLayout {
  /** The roller the cloth is wound on, and the one its tapes run to, as x and z (their axes are vertical). */
  home: { x: number; z: number };
  far: { x: number; z: number };
  /** Where the edge bar is cocked, and where it ends up when the curtain has run. */
  edge: [number, number];
  /** Lengths of the cloth and of its tapes. */
  cloth: number;
  tapes: number;
  /** A roll's radius at its innermost turn, and how much it grows a turn. */
  base: number;
  layer: number;
  /** The mesh's _CLOTH attribute packs each vertex's arc length (0..uSpan) and offset from the cloth's middle (±wSpan) into 0..1. */
  uSpan: number;
  wSpan: number;
}

/**
 * Where a curtain lies with its edge bar at x = `edge`: for arc length u from its home roller's
 * innermost turn, a point in the x–z plane and the way its front face looks. Wound on a roller it
 * follows an Archimedean spiral; between the rollers it runs straight. The same sums as clothPath in
 * objects/rangefinder-camera/mechanism.mjs, which laid the curtain out at rest.
 */
export function clothPath(c: ClothLayout, edge: number) {
  const k = c.layer / (Math.PI * 2);
  const spiralAngle = (u: number) => (Math.sqrt(c.base * c.base + 2 * k * Math.max(0, u)) - c.base) / k;
  const sigma = Math.sign(c.far.x - c.home.x);
  const wHome = c.cloth - Math.abs(edge - c.home.x);
  const span = Math.abs(c.far.x - c.home.x);
  const wFar = c.cloth + c.tapes - wHome - span;
  const tHome = spiralAngle(wHome);
  const tFar = spiralAngle(wFar);
  const pHome = [c.home.x, c.home.z - (c.base + k * tHome)];
  const pFar = [c.far.x, c.far.z - (c.base + k * tFar)];
  const dir = [(pFar[0] - pHome[0]) / span, (pFar[1] - pHome[1]) / span];
  const flat = [-dir[1] * sigma, dir[0] * sigma];
  /** Writes the point and the front face's direction at arc length u into `out` as [x, z, nx, nz]. */
  const at = (u: number, out: number[]) => {
    if (u <= wHome || u >= wHome + span) {
      const onHome = u <= wHome;
      const t = spiralAngle(onHome ? u : c.cloth + c.tapes - u);
      const rho = c.base + k * t;
      const phi = onHome ? -Math.PI / 2 - sigma * (tHome - t) : -Math.PI / 2 + sigma * (tFar - t);
      const [cx, cz] = onHome ? [c.home.x, c.home.z] : [c.far.x, c.far.z];
      out[0] = cx + rho * Math.cos(phi);
      out[1] = cz + rho * Math.sin(phi);
      out[2] = -Math.cos(phi);
      out[3] = -Math.sin(phi);
    } else {
      const s = u - wHome;
      out[0] = pHome[0] + dir[0] * s;
      out[1] = pHome[1] + dir[1] * s;
      out[2] = flat[0];
      out[3] = flat[1];
    }
    return out;
  };
  return { at, homeTurn: sigma * tHome, farTurn: -sigma * tFar };
}

/**
 * A shutter curtain that winds off one roller and onto the other as it runs: every vertex is moved
 * to where its arc length along the curtain puts it, at its offset from the cloth's middle, and its
 * normal turns with the cloth there. Works in the mesh's own space, whatever its quantisation.
 */
export class Cloth {
  private readonly toLocal: Matrix4;
  private readonly toLocalNormal: Matrix3;
  /** Per vertex: arc length, offset, height (mm), and the rest normal (camera frame) with the angle the cloth had there. */
  private readonly rest: Float32Array;
  private readonly _p = new Vector3();
  private readonly _n = new Vector3();
  private readonly _at = [0, 0, 0, 0];
  private value = 0;

  constructor(
    readonly mesh: Mesh,
    private readonly layout: ClothLayout,
    root: Object3D,
  ) {
    const toRoot = root.matrixWorld.clone().invert().multiply(mesh.matrixWorld);
    this.toLocal = toRoot.clone().invert();
    this.toLocalNormal = new Matrix3().getNormalMatrix(this.toLocal);
    const normalToRoot = new Matrix3().getNormalMatrix(toRoot);
    // Quantised positions only cover the cloth's bounds at rest, and it rolls up beyond them: work in floats.
    for (const name of ['position', 'normal']) {
      const source = mesh.geometry.attributes[name] as BufferAttribute;
      const floats = new Float32Array(source.count * 3);
      for (let i = 0; i < source.count; i++) floats.set([source.getX(i), source.getY(i), source.getZ(i)], i * 3);
      mesh.geometry.setAttribute(name, new Float32BufferAttribute(floats, 3));
    }
    const { position, normal, _cloth: along } = mesh.geometry.attributes as Record<string, BufferAttribute>;
    const n = position.count;
    this.rest = new Float32Array(n * 7);
    const restPath = clothPath(layout, layout.edge[0]);
    for (let i = 0; i < n; i++) {
      const u = along.getX(i) * layout.uSpan;
      const w = (along.getY(i) * 2 - 1) * layout.wSpan;
      const y = this._p.fromBufferAttribute(position, i).applyMatrix4(toRoot).y * 1000;
      const m = this._n.fromBufferAttribute(normal, i).applyMatrix3(normalToRoot).normalize();
      const [, , ax, az] = restPath.at(u, this._at);
      this.rest.set([u, w, y, m.x, m.y, m.z, Math.atan2(az, ax)], i * 7);
    }
    // It sweeps across the frame: its bounds at rest don't hold it.
    mesh.frustumCulled = false;
  }

  /** Lays the curtain out with its edge `value` of the way from cocked (0) to run (1). */
  apply(value: number): void {
    if (value === this.value) return;
    this.value = value;
    const { layout, rest, _p: p, _n: m, _at: at } = this;
    const path = clothPath(layout, layout.edge[0] + (layout.edge[1] - layout.edge[0]) * value);
    const { position, normal } = this.mesh.geometry.attributes as Record<string, BufferAttribute>;
    for (let i = 0; i < position.count; i++) {
      const o = i * 7;
      const [u, w, y] = [rest[o], rest[o + 1], rest[o + 2]];
      path.at(u, at);
      p.set((at[0] + at[2] * w) / 1000, y / 1000, (at[1] + at[3] * w) / 1000).applyMatrix4(this.toLocal);
      position.setXYZ(i, p.x, p.y, p.z);
      // The normal turns with the cloth about the rollers' (vertical) axes.
      const turn = Math.atan2(at[3], at[2]) - rest[o + 6];
      const [c, s] = [Math.cos(turn), Math.sin(turn)];
      const [nx, nz] = [rest[o + 3], rest[o + 5]];
      m.set(nx * c - nz * s, rest[o + 4], nx * s + nz * c).applyMatrix3(this.toLocalNormal).normalize();
      normal.setXYZ(i, m.x, m.y, m.z);
    }
    position.needsUpdate = true;
    normal.needsUpdate = true;
  }
}
