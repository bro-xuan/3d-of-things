import { CatmullRomCurve3, Color, Group, Object3D, Vector3, type Scene } from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { OVERLAY_LAYER } from './looks';

const SAMPLES = 180;
const COLOURS = { power: new Color('#d24f1f'), light: new Color('#e09a12'), air: new Color('#2f78b8') };
const PAPER = new Color('#fbf8f1');

/**
 * The path the power (or the light, or the air) takes through a mechanism, drawn over the model like a line on
 * a diagram: vermilion, on a pale casing that keeps it clear of busy parts behind, with dashes
 * running along it the way the power goes. It draws itself in from the source, and stays pinned to
 * the parts it passes through as they move.
 */
export class Flow {
  /** Everything the flow draws, to show or hide at once. */
  readonly group = new Group();
  private readonly geometry = new LineGeometry();
  /** A pale casing under the line. */
  private readonly casing: Line2;
  /** The line itself. */
  private readonly trace: Line2;
  /** Dashes running along it. */
  private readonly dashes: Line2;
  private anchors: Object3D[] = [];
  private progress = 0;
  private drawn = false;
  /** Segments in the line as drawn. */
  private segments = 1;
  /** Light goes in straight lines between reflections; power is drawn as a smooth path. */
  private straight = false;

  constructor(scene: Scene) {
    const casing = new LineMaterial({ color: PAPER, linewidth: 7, transparent: true, opacity: 0.7, depthTest: false, depthWrite: false, toneMapped: false });
    const trace = new LineMaterial({ color: COLOURS.power, linewidth: 2.4, transparent: true, opacity: 0.55, depthTest: false, depthWrite: false, toneMapped: false });
    const dashes = new LineMaterial({ color: COLOURS.power, linewidth: 3.6, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, dashed: true, dashSize: 0.024, gapSize: 0.016 });
    for (const material of [casing, trace, dashes]) material.onBeforeCompile = (shader) => this.clipShader(shader);
    this.casing = new Line2(this.geometry, casing);
    this.trace = new Line2(this.geometry, trace);
    this.dashes = new Line2(this.geometry, dashes);
    this.casing.renderOrder = 5;
    this.trace.renderOrder = 6;
    this.dashes.renderOrder = 7;
    for (const line of [this.casing, this.trace, this.dashes]) {
      line.layers.set(OVERLAY_LAYER);
      line.visible = false;
      line.frustumCulled = false;
      this.group.add(line);
    }
    scene.add(this.group);
  }

  /** Where the lines fade out, in drawing-buffer pixels from the left (where the page's side panel starts). */
  private readonly clip = { value: 1e6 };

  private clipShader(shader: { uniforms: Record<string, unknown>; fragmentShader: string }): void {
    shader.uniforms.clipX = this.clip;
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'uniform float clipX;\nvoid main() {')
      .replace(/}\s*$/, '  gl_FragColor.a *= smoothstep(clipX, clipX - 48.0, gl_FragCoord.x);\n}');
  }

  /** Fades the lines out before this x (drawing-buffer pixels), or never with null. */
  setClip(x: number | null): void {
    this.clip.value = x ?? 1e6;
  }

  get active(): boolean {
    return this.anchors.length > 1;
  }

  /** Whether any point rides on a part that turns, so the line has to follow it every frame. */
  rides = false;

  /** Shows a path through these anchors (objects that ride with the parts), drawing it in from the start; none hides it. */
  set(anchors: Object3D[] | null, { animate = true, carries = 'power' as 'power' | 'light' | 'air' } = {}): void {
    for (const anchor of this.anchors) anchor.removeFromParent();
    this.anchors = anchors && anchors.length > 1 ? anchors : [];
    this.rides = this.anchors.some((anchor) => anchor.userData.rides);
    this.straight = carries === 'light';
    for (const line of [this.trace, this.dashes]) (line.material as LineMaterial).color.copy(COLOURS[carries]);
    this.progress = animate ? 0 : 1;
    this.drawn = false;
    this.update();
  }

  /** Rebuilds the line from where its anchors are now (after the parts it passes through have moved). */
  update(): void {
    const on = this.active;
    this.casing.visible = this.trace.visible = this.dashes.visible = on;
    if (!on) return;
    const points = this.anchors.map((anchor) => anchor.getWorldPosition(new Vector3()));
    const flat: number[] = [];
    for (const p of this.straight ? polyline(points, SAMPLES) : new CatmullRomCurve3(points, false, 'centripetal').getSpacedPoints(SAMPLES)) flat.push(p.x, p.y, p.z);
    this.geometry.setPositions(flat);
    this.segments = flat.length / 3 - 1;
    this.dashes.computeLineDistances();
    this.reveal();
  }

  private reveal(): void {
    this.geometry.instanceCount = Math.max(1, Math.round(this.segments * this.progress));
  }

  /** Draws the line in and runs its dashes along; returns whether anything changed. */
  tick(dt: number, still = false): boolean {
    if (!this.active) return false;
    let changed = false;
    if (this.progress < 1) {
      this.progress = Math.min(1, this.progress + dt / 1.4);
      this.reveal();
      changed = true;
    } else if (!this.drawn) {
      this.drawn = changed = true;
    }
    if (!still) {
      (this.dashes.material as LineMaterial).dashOffset -= dt * 0.055;
      changed = true;
    }
    return changed;
  }

  dispose(): void {
    this.set(null);
    for (const line of [this.casing, this.trace, this.dashes]) (line.material as LineMaterial).dispose();
    this.group.removeFromParent();
    this.geometry.dispose();
  }
}

/** Evenly spaced points along straight segments through these points, keeping every corner. */
function polyline(points: Vector3[], samples: number): Vector3[] {
  const lengths = points.slice(1).map((p, i) => p.distanceTo(points[i]));
  const total = lengths.reduce((a, b) => a + b, 0) || 1;
  const out: Vector3[] = [points[0].clone()];
  points.slice(1).forEach((p, i) => {
    const n = Math.max(1, Math.round((lengths[i] / total) * samples));
    for (let k = 1; k <= n; k++) out.push(points[i].clone().lerp(p, k / n));
  });
  return out;
}
