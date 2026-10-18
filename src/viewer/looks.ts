import {
  BackSide,
  Color,
  FrontSide,
  Mesh,
  EdgesGeometry,
  GreaterDepth,
  LineBasicMaterial,
  LineSegments,
  MeshBasicMaterial,
  ShaderMaterial,
  Vector2,
  Vector3,
  type Material,
  type Object3D,
  type WebGLProgramParametersWithUniforms,
} from 'three';

export type LookMode = 'rendered' | 'wireframe';

/** How one mesh is drawn. */
type Style = 'solid' | 'ghost' | 'line' | 'faint' | 'hidden';

const INK = new Color('#2b2620');
const ACCENT = new Color('#c4441c');
/** Layer for lines and overlays: drawn by the main camera, but kept out of the contact shadow and raycasts. */
export const OVERLAY_LAYER = 1;

const isSurface = (style: Style) => style === 'solid' || style === 'ghost';
const isLine = (style: Style) => style === 'line' || style === 'faint';

/**
 * The scan line that sweeps across the model when it changes look: a horizontal plane at `y` (world space).
 * While it's on, surfaces draw only on one side of it and lines only on the other, and both glow vermilion
 * close to it, so the new look is drawn in as the line passes. Every patched material shares these.
 */
const scan = {
  scanOn: { value: 0 },
  scanY: { value: 0 },
  /** 1 when surfaces are the ones above the line (sweeping back to rendered), 0 when lines are. */
  scanSurfaceAbove: { value: 0 },
  scanBand: { value: 0.03 },
  scanColour: { value: new Color('#e0531f') },
};

const SCAN_UNIFORMS = /* glsl */ `
  uniform float scanOn;
  uniform float scanY;
  uniform float scanSurfaceAbove;
  uniform float scanBand;
  uniform vec3 scanColour;
  varying float vScanY;`;

/** Discards a fragment on the wrong side of the scan line: surfaces keep one side, lines (SCAN_LINE) the other. */
const SCAN_CLIP = /* glsl */ `
  if (scanOn > 0.5) {
    float scanAbove = step(scanY, vScanY);
    #ifdef SCAN_LINE
      if (scanAbove == scanSurfaceAbove) discard;
    #else
      if (scanAbove != scanSurfaceAbove) discard;
    #endif
  }`;

const SCAN_GLOW = /* glsl */ `
  float scanNear = 1.0 - smoothstep(0.0, scanBand, abs(vScanY - scanY));
  gl_FragColor.rgb = mix(gl_FragColor.rgb, scanColour, scanOn * scanNear * scanNear);`;

/** Teaches one of three.js's own materials the scan line. Done before it's first compiled. */
function scanned(material: Material, kind: 'surface' | 'line'): void {
  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    Object.assign(shader.uniforms, scan);
    shader.vertexShader = `${SCAN_UNIFORMS}\n${shader.vertexShader}`.replace(
      '#include <project_vertex>',
      '#include <project_vertex>\n  vScanY = (modelMatrix * vec4(transformed, 1.0)).y;',
    );
    shader.fragmentShader = `${kind === 'line' ? '#define SCAN_LINE\n' : ''}${SCAN_UNIFORMS}\n${shader.fragmentShader}`
      .replace('void main() {', `void main() {\n${SCAN_CLIP}`)
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>\n${SCAN_GLOW}`);
  };
  material.customProgramCacheKey = () => `scan-${kind}`;
  material.needsUpdate = true;
}

/** A see-through shell: faint where a surface faces you, darker toward its outline, like a pencilled ghost.
 *  Around a step's parts it fades out with distance, so a close-up isn't seen through a veil of the whole case. */
function ghostMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      ...scan,
      color: { value: INK.clone() },
      base: { value: 0.03 },
      rim: { value: 0.3 },
      centre: { value: new Vector3() },
      fade: { value: new Vector2(1e6, 2e6) },
    },
    vertexShader: /* glsl */ `
      ${SCAN_UNIFORMS}
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vWorld;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        vScanY = world.y;
        vec4 mv = viewMatrix * world;
        vView = -mv.xyz;
        vNormal = normalMatrix * normal;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      ${SCAN_UNIFORMS}
      uniform vec3 color;
      uniform float base;
      uniform float rim;
      uniform vec3 centre;
      uniform vec2 fade;
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vWorld;
      void main() {
        ${SCAN_CLIP}
        float facing = abs(dot(normalize(vNormal), normalize(vView)));
        float away = 1.0 - smoothstep(fade.x, fade.y, distance(vWorld, centre));
        gl_FragColor = vec4(color, (base + rim * pow(1.0 - facing, 2.6)) * away);
        #include <colorspace_fragment>
        ${SCAN_GLOW}
      }`,
    transparent: true,
    depthWrite: false,
    side: FrontSide,
    toneMapped: false,
  });
}

/** An outline where a surface turns away from you: the mesh's back faces, pushed out a little on screen and drawn in ink. */
function outlineMaterial(resolution: Vector2): ShaderMaterial {
  return new ShaderMaterial({
    defines: { SCAN_LINE: '' },
    uniforms: { ...scan, color: { value: INK.clone() }, resolution: { value: resolution }, width: { value: 1.4 } },
    vertexShader: /* glsl */ `
      ${SCAN_UNIFORMS}
      uniform vec2 resolution;
      uniform float width;
      void main() {
        vScanY = (modelMatrix * vec4(position, 1.0)).y;
        vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(normalMatrix * normal);
        vec2 dir = (projectionMatrix * vec4(n, 0.0)).xy;
        float len = length(dir);
        if (len > 1e-5) clip.xy += dir / len * width * 2.0 / resolution * clip.w;
        gl_Position = clip;
      }`,
    fragmentShader: /* glsl */ `
      ${SCAN_UNIFORMS}
      uniform vec3 color;
      void main() {
        ${SCAN_CLIP}
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
        ${SCAN_GLOW}
      }`,
    side: BackSide,
    depthWrite: false,
    toneMapped: false,
  });
}

/** What a mesh has for being drawn as lines; built the first time it's needed. They hang from the mesh, so they move with it. */
interface Edges {
  /** Feature edges, and the same again where they're hidden behind a surface (faint). Not for bending springs. */
  visible?: LineSegments;
  hidden?: LineSegments;
  outline?: Mesh;
  /** The mesh again, writing depth only: while the look sweeps across, the mesh itself is busy being a surface. */
  depth?: Mesh;
  /** A bending spring is drawn in ink instead (its edges would be left behind as it bends). */
  ink?: Mesh;
}

/**
 * Draws the model as rendered, or as an ink line drawing whose hidden lines show faintly (wireframe).
 * When parts are in focus (a step of "How it works"), they stay solid (or strong) and everything else
 * gives way: to see-through ghosts, so the parts can be watched working inside the closed model, or
 * to faint lines. A change of look can sweep across the model behind a scan line.
 */
export class Looks {
  mode: LookMode = 'rendered';
  private focus: Set<Mesh> | null = null;
  /** Parts taken out for an experiment: a ghost marks where they were. */
  private removed = new Set<Mesh>();
  /** Parts left out of the picture for a step. */
  private hidden = new Set<Mesh>();
  private readonly styles = new Map<Mesh, Style>();
  private readonly materials = new Map<Mesh, Material | Material[]>();
  private readonly ghost = ghostMaterial();
  /** Writes depth but no colour, so lines behind a surface can be told from lines on it. */
  private readonly depthOnly = new MeshBasicMaterial({ colorWrite: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  private readonly hiddenMesh = new MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  /** Springs that bend every frame can't keep a fixed set of edges: they're drawn in ink. */
  private readonly inkSolid = new MeshBasicMaterial({ color: INK, toneMapped: false, transparent: true, opacity: 0.42, depthWrite: false });
  private readonly inkFaint = new MeshBasicMaterial({ color: INK, toneMapped: false, transparent: true, opacity: 0.18, depthWrite: false });
  private readonly edges = new Map<Mesh, Edges>();
  /** The drawing buffer's size in pixels, for outlines of an even width. */
  readonly resolution = new Vector2(1, 1);
  private readonly outline = outlineMaterial(this.resolution);
  /** Per part: line materials, so one part's lines can be highlighted on their own. */
  private readonly lineMaterials = new Map<number, { strong: LineBasicMaterial; hidden: LineBasicMaterial; faint: LineBasicMaterial }>();
  private highlighted: number | null = null;
  /** While a change of look sweeps across: each mesh's look before it. */
  private sweeping: Map<Mesh, Style> | null = null;

  constructor(
    private readonly meshes: Mesh[],
    private readonly partOf: (mesh: Object3D) => number | undefined,
    private readonly deforming: Set<Mesh>,
  ) {
    for (const mesh of meshes) {
      this.materials.set(mesh, mesh.material);
      this.styles.set(mesh, 'solid');
      for (const material of this.solidMaterials(mesh)) scanned(material, 'surface');
    }
    for (const material of [this.depthOnly, this.inkSolid, this.inkFaint]) scanned(material, 'line');
  }

  /** The materials a mesh is drawn with when solid, whatever it's drawn with now (for highlighting). */
  solidMaterials(mesh: Mesh): Material[] {
    return ([] as Material[]).concat(this.materials.get(mesh) ?? mesh.material);
  }

  setMode(mode: LookMode): void {
    this.endSweep();
    this.mode = mode;
    this.apply();
  }

  /**
   * Starts changing to `mode` behind a scan line that comes down from `top` (world y): above it the new
   * look, below it the old one. Move the line with `sweep`, and finish with `endSweep`.
   */
  beginSweep(mode: LookMode, top: number, height: number): void {
    this.endSweep();
    const before = new Map(this.styles);
    this.mode = mode;
    for (const mesh of this.meshes) this.styles.set(mesh, this.styleFor(mesh));
    this.sweeping = before;
    scan.scanOn.value = 1;
    scan.scanY.value = top;
    scan.scanSurfaceAbove.value = mode === 'rendered' ? 1 : 0;
    scan.scanBand.value = height * 0.028;
    for (const mesh of this.meshes) {
      const [from, to] = [before.get(mesh)!, this.styles.get(mesh)!];
      // Both looks at once: the surface one on its side of the line, the lines on theirs.
      const surface = isSurface(from) ? from : isSurface(to) ? to : null;
      const lines = isLine(from) ? from : isLine(to) ? to : null;
      this.draw(mesh, surface, lines, true);
    }
  }

  /** Moves the scan line (world y). */
  sweep(y: number): void {
    scan.scanY.value = y;
  }

  /** Settles on the new look, wherever the scan line had got to. */
  endSweep(): void {
    if (!this.sweeping) return;
    this.sweeping = null;
    scan.scanOn.value = 0;
    for (const mesh of this.meshes) {
      const style = this.styles.get(mesh)!;
      this.draw(mesh, isSurface(style) ? style : null, isLine(style) ? style : null, false);
      mesh.visible = style !== 'hidden';
    }
  }

  /** The meshes in focus, if any. */
  get focused(): Set<Mesh> | null {
    return this.focus;
  }

  /** Keeps these meshes solid and lets the rest give way; null for none in particular. */
  setFocus(meshes: Set<Mesh> | null): void {
    this.focus = meshes;
    this.apply();
  }

  /** Ghosts fade out from `inner` to `outer` away from a point (world space), or not at all with null. */
  setLens(centre: Vector3 | null, inner = 0, outer = 0): void {
    const uniforms = this.ghost.uniforms;
    if (centre) {
      uniforms.centre.value.copy(centre);
      uniforms.fade.value.set(inner, outer);
    } else {
      uniforms.fade.value.set(1e6, 2e6);
    }
  }

  /** Leaves these meshes out of the picture altogether. */
  setHidden(meshes: Set<Mesh>): void {
    this.hidden = meshes;
    this.apply();
  }

  /** Shows these meshes as taken out: a ghost (or faint lines) where they were. */
  setRemoved(meshes: Set<Mesh>): void {
    this.removed = meshes;
    this.apply();
  }

  /** Whether parts inside the model can be seen without taking it apart. */
  get seeThrough(): boolean {
    if (this.mode === 'wireframe') return true;
    for (const style of this.styles.values()) if (style === 'ghost') return true;
    return false;
  }

  /** Meshes a click or a hover should find: ghosts and faint lines let the pointer through to what's inside. */
  isPickable(mesh: Mesh): boolean {
    const style = this.styles.get(mesh);
    return style === 'solid' || style === 'line';
  }

  highlight(part: number | null): void {
    if (part === this.highlighted) return;
    this.setLineColour(this.highlighted, INK);
    this.highlighted = part;
    this.setLineColour(part, ACCENT);
  }

  private setLineColour(part: number | null, colour: Color): void {
    if (part === null) return;
    const set = this.lineMaterials.get(part);
    if (!set) return;
    for (const material of [set.strong, set.hidden, set.faint]) material.color.copy(colour);
  }

  private styleFor(mesh: Mesh): Style {
    if (this.hidden.has(mesh)) return 'hidden';
    if (this.removed.has(mesh)) return this.mode === 'wireframe' ? 'faint' : 'ghost';
    const inFocus = this.focus ? this.focus.has(mesh) : null;
    if (this.mode === 'wireframe') return inFocus === false ? 'faint' : 'line';
    return inFocus === false ? 'ghost' : 'solid';
  }

  apply(): void {
    if (this.sweeping) this.endSweep();
    for (const mesh of this.meshes) {
      const style = this.styleFor(mesh);
      if (this.styles.get(mesh) === style) continue;
      this.styles.set(mesh, style);
      mesh.visible = style !== 'hidden';
      this.draw(mesh, isSurface(style) ? style : null, isLine(style) ? style : null, false);
    }
  }

  /** Sets a mesh up to be drawn as a surface, as lines, or (while sweeping) as both. */
  private draw(mesh: Mesh, surface: Style | null, lines: Style | null, both: boolean): void {
    const spring = this.deforming.has(mesh);
    const edges = lines ? this.edgesOf(mesh) : this.edges.get(mesh);
    if (edges) {
      const set = this.lineSet(this.partOf(mesh));
      if (edges.visible) {
        edges.visible.visible = !!lines;
        edges.visible.material = lines === 'faint' ? set.faint : set.strong;
      }
      if (edges.hidden) edges.hidden.visible = lines === 'line';
      if (edges.outline) edges.outline.visible = lines === 'line';
      // Lines only hide behind surfaces that write depth: the mesh does that itself, unless it's busy being a surface.
      if (edges.depth) edges.depth.visible = lines === 'line' && both;
      if (edges.ink) {
        edges.ink.visible = !!lines;
        edges.ink.material = lines === 'faint' ? this.inkFaint : this.inkSolid;
      }
    }
    if (surface === 'solid') mesh.material = this.materials.get(mesh)!;
    else if (surface === 'ghost') mesh.material = this.ghost;
    else if (lines === 'line' && !spring) mesh.material = this.depthOnly;
    else mesh.material = this.hiddenMesh;
    if (both) mesh.visible = !!(surface || lines);
  }

  private lineSet(part: number | undefined) {
    const key = part ?? -1;
    let set = this.lineMaterials.get(key);
    if (!set) {
      const colour = key === this.highlighted ? ACCENT : INK;
      set = {
        strong: new LineBasicMaterial({ color: colour, toneMapped: false, transparent: true, opacity: 0.92 }),
        hidden: new LineBasicMaterial({ color: colour, toneMapped: false, transparent: true, opacity: 0.13, depthFunc: GreaterDepth, depthWrite: false }),
        faint: new LineBasicMaterial({ color: colour, toneMapped: false, transparent: true, opacity: 0.16, depthWrite: false }),
      };
      for (const material of Object.values(set)) scanned(material, 'line');
      this.lineMaterials.set(key, set);
    }
    return set;
  }

  private edgesOf(mesh: Mesh): Edges {
    let edges = this.edges.get(mesh);
    if (edges) return edges;
    if (this.deforming.has(mesh)) {
      edges = { ink: new Mesh(mesh.geometry, this.inkSolid) };
    } else {
      const geometry = new EdgesGeometry(mesh.geometry, 32);
      const set = this.lineSet(this.partOf(mesh));
      edges = {
        visible: new LineSegments(geometry, set.strong),
        hidden: new LineSegments(geometry, set.hidden),
        outline: new Mesh(mesh.geometry, this.outline),
        depth: new Mesh(mesh.geometry, this.depthOnly),
      };
      // After the depth-writing surfaces, so only the rim of the outline shows round them.
      edges.hidden!.renderOrder = edges.outline!.renderOrder = 1;
    }
    for (const object of Object.values(edges) as Object3D[]) {
      object.layers.set(OVERLAY_LAYER);
      object.matrixAutoUpdate = false;
      object.visible = false;
      mesh.add(object);
    }
    this.edges.set(mesh, edges);
    return edges;
  }

  dispose(): void {
    this.endSweep();
    for (const [mesh, edges] of this.edges) {
      edges.visible?.geometry.dispose();
      for (const object of Object.values(edges) as Object3D[]) mesh.remove(object);
    }
    for (const [mesh, material] of this.materials) mesh.material = material;
    for (const set of this.lineMaterials.values()) for (const material of Object.values(set)) material.dispose();
    for (const material of [this.ghost, this.depthOnly, this.hiddenMesh, this.inkSolid, this.inkFaint, this.outline]) material.dispose();
  }
}
