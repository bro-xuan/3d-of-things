import {
  Box3,
  BufferGeometry,
  Color,
  DirectionalLight,
  Euler,
  Group,
  MathUtils,
  Mesh,
  NeutralToneMapping,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  PMREMGenerator,
  Raycaster,
  Scene,
  Sphere,
  Spherical,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer,
  type Material,
  type MeshStandardMaterial,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import { asset } from '../asset';
import type { CameraPose, FlowPoint, Shot, Thing, Vec3, View } from '../types';
import { ContactShadow } from './ContactShadow';
import { Flow } from './flow';
import { Hotspots, PartBadges, SceneCard, Tags, type CardContent } from './labels';
import { Looks, OVERLAY_LAYER, type LookMode } from './looks';
import { clamp01, easeInCubic, easeInOutCubic, easeOutQuint, Exploder, Mechanism, Rigs, type MechanismState } from './rig';
import { FilmCamera, type CameraState } from './filmcamera';
import { ReflexCamera, type ReflexState } from './reflexcamera';
import { Linkage } from './linkage';
import { AeroCar, type AeroState, type FlightKind } from './aerocar';
import { BalancedArm, type ArmState } from './balancedarm';
import { Stretch, type SpringLayout } from './stretch';
import { PinTumbler, type KeyName, type LockState } from './pintumbler';
import { TapeMeasure, type BladeLayout, type TapeState } from './tapemeasure';
import { Extinguisher, type ExtinguisherState } from './extinguisher';
import { Typewriter, type TypewriterState } from './typewriter';
import { Jets } from './jets';

// Fast raycasts for hover and hotspot occlusion.
BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
Mesh.prototype.raycast = acceleratedRaycast;
// Decode compressed geometry off the main thread.
MeshoptDecoder.useWorkers?.(2);

const _box = new Box3();
const _euler = new Euler();
const _v = new Vector3();

/** Camera poses in content files are framed for a landscape viewer about this wide. */
const REFERENCE_ASPECT = 1.2;
const FOV = 30;
/** How much of the frame a model's bounds fill in the home view, unless the frame's CSS says otherwise. */
const HOME_FILL = 1 / 1.14;
const HIGHLIGHT = new Color('#e0531f');

export interface ViewerOptions {
  reducedMotion?: boolean;
  /** Keep the drawing buffer so the canvas can be read back (poster capture). */
  capture?: boolean;
  pixelRatio?: number;
  /** What time clock hands show; defaults to now. */
  time?: () => Date;
  /** Where the canvas and labels go, if not the container: a layer bigger than the stage, so the
   *  model can spill out over the page. The container still takes the pointer. */
  host?: HTMLElement;
  /** The element the model is framed in, if not the container (the stage, when there's a host).
   *  Its CSS can compose the home view: `--home-x` and `--home-y` move the model off the frame's
   *  centre (fractions of its width and height, right and down), and `--home-fill` is how much of
   *  the frame its bounds fill (default 0.877). Close-ups are framed on the centre. */
  frame?: HTMLElement;
  /** The drawing's scale, in CSS pixels per metre at the point the camera looks at, whenever it changes. */
  onScale?: (pixelsPerMetre: number) => void;
  onSelect?: (index: number) => void;
  onExplode?: (value: number) => void;
  onHoverPart?: (index: number | null) => void;
  /** A click on a part (its index), or on nothing (null). */
  onPick?: (index: number | null) => void;
  onInteract?: () => void;
}

export type { AeroState, CameraState, CardContent, ExtinguisherState, FlightKind, LookMode, MechanismState, TapeState, TypewriterState };

/** An orthographic line drawing of the assembled model, for the page's drawings. All of a model's drawings share
 *  one scale and one margin, so they line up as the views on a drawing sheet do. */
export interface Drawing {
  view: 'front' | 'side' | 'top';
  /** A transparent PNG of the drawing. */
  url: string;
  /** The model's size across and up the drawing, and the margin round it, in metres. */
  across: number;
  tall: number;
  margin: number;
}

const _follow = { position: new Vector3(), target: new Vector3() };

interface Pose {
  position: Vector3;
  target: Vector3;
}

interface Tween {
  kind: string;
  start: number;
  duration: number;
  step: (t: number) => void;
  done: () => void;
}

export class Viewer {
  readonly renderer: WebGLRenderer;
  readonly camera = new PerspectiveCamera(FOV, 1, 0.01, 100);
  readonly scene = new Scene();
  readonly controls: OrbitControls;
  /** Model space: what content files' positions are in. It sits at the world origin, and is only lifted
   *  while an explosion would otherwise push parts through the floor. */
  private readonly modelRoot = new Group();
  /** The model and its shadow together, which slide on and off when one object hands over to the next. */
  private readonly exhibit = new Group();
  private readonly labels = new CSS2DRenderer();
  private readonly shadow = new ContactShadow();
  private readonly host: HTMLElement;
  private readonly card: SceneCard;
  /** Host and frame boxes from the last resize, for placing cards and sliding the model offstage. */
  private hostRect = new DOMRect();
  private frameRect = new DOMRect();
  private press: { x: number; y: number; time: number } | null = null;
  /** The part being picked and the spot on it that was clicked, while `onPick` runs. */
  private picked: { part: number; point: Vector3 } | null = null;
  /** The part last clicked: its card names it, so hovering it shows no tooltip. */
  private quietPart: number | null = null;
  private calloutByPart = new Map<number, number>();
  /** Nodes that are a part (or travel with one): a mesh belongs to the nearest one above it. */
  private partNodes = new Set<Object3D>();
  /** The part whose card is open: it stays highlighted while nothing else is. */
  private cardPart: number | null = null;
  private readonly rigs = new Rigs();
  private readonly meshes: Mesh[] = [];
  private readonly partByMesh = new Map<Object3D, number>();
  private readonly restEmissive = new Map<Material, { color: Color; intensity: number }>();
  private readonly tooltip = document.createElement('div');
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();
  private readonly resizeObserver: ResizeObserver;
  private thing?: Thing;
  private root?: Object3D;
  private exploder?: Exploder;
  private mechanism?: Mechanism;
  /** Parts on controls (a camera's focus and shutter), and the camera that sets them, if this is one. */
  private linkage?: Linkage;
  /** A camera's mechanism, if this is a camera: a rangefinder's or a reflex's, by the controls its motions use. */
  private cameraBody?: FilmCamera | ReflexCamera;
  /** A car's suction fans and thrusters, if it has them: they set the fans', skirts' and wing's controls, and fly it. */
  private aero?: AeroCar;
  /** A balanced arm (a desk lamp), if this is one: it sets the arm's controls, and its springs stretch with it. */
  private arm?: BalancedArm;
  private readonly springs: Stretch[] = [];
  /** A pin tumbler lock's keys, pins and plug, if this is one: it sets their controls. */
  private lock?: PinTumbler;
  private tape?: TapeMeasure;
  /** A stored-pressure extinguisher's pin, lever and charge, if it is one: they set its controls as it empties. */
  private extinguisher?: Extinguisher;
  /** A typewriter's keys, type bars, escapement and carriage, if this is one: it sets their controls as a word is typed. */
  private typewriter?: Typewriter;
  /** Its thrusters' jets. */
  private jets?: Jets;
  /** The whole model, lifted and turned when a car flies. */
  private readonly lift = new Group();
  /** What the model turns about in flight: the car's middle, a little above the ground. */
  private readonly flightPivot = new Vector3();
  private flying = false;
  private hotspots?: Hotspots;
  private badges?: PartBadges;
  private looks?: Looks;
  /** Paths the power (or light) takes, one line each. */
  private readonly flows: Flow[] = [];
  private readonly tags = new Tags();
  /** Meshes a click, a hover or a marker's line of sight can hit: not ghosts. */
  private pickable: Mesh[] = [];
  private readonly frameListeners = new Set<(dt: number) => void>();
  /** Counts changes of look, so a sweep that's been overtaken doesn't settle the newer one. */
  private sweepId = 0;
  /** Where flow lines fade out (drawing-buffer x), when the drawing spills past the frame. */
  private flowClip: number | null = null;
  private tweens: Tween[] = [];
  private dirty = true;
  private shadowDirty = true;
  private occlusionDue = 0;
  private hoverDue = false;
  private hoveredPart: number | null = null;
  private highlightedPart: number | null = null;
  private restFloor = 0;
  private assembledBox = new Box3(new Vector3(-1, 0, -1), new Vector3(1, 1, 1));
  private explodedBox = this.assembledBox.clone();
  /** Where the frame's CSS puts the model in the home view (see `ViewerOptions.frame`). */
  private home = { x: 0, y: 0, fill: HOME_FILL, width: 1 };
  /** How far the view is moved off the frame's centre right now, in fractions of the frame: the
   *  home offset, or none in a close-up, and in between while the camera flies from one to the other. */
  private readonly shift = new Vector2();
  /** Where a close-up stands off the frame's centre, in fractions of the frame (− is up): a film lifts its shots clear of
   *  the caption and bar along the stage's foot. Taken up by the next move of the camera. */
  readonly closeUpShift = new Vector2();
  /** Whether the view is composed like the home view, so a resize keeps the model where the CSS puts it. */
  private composed = true;
  /** glTF units are metres, so this is the model's real size: what one unit of model space measures. */
  private metresPerUnit = 0;
  private pixelsPerMetre = 0;
  private lastFrame = performance.now();
  /** How fast the mechanism's time goes against the clock's: 0 stops everything that moves on its own (a paused film). */
  timeScale = 1;
  private frame = 0;
  private disposed = false;

  constructor(
    readonly container: HTMLElement,
    private readonly options: ViewerOptions = {},
  ) {
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: !!options.capture });
    this.renderer.setPixelRatio(options.pixelRatio ?? Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.domElement.className = 'viewer__canvas';
    this.labels.domElement.className = 'viewer__labels';
    this.tooltip.className = 'viewer__tooltip';
    this.tooltip.setAttribute('aria-hidden', 'true');
    this.host = options.host ?? container;
    this.host.append(this.renderer.domElement, this.labels.domElement, this.tooltip);
    this.card = new SceneCard(() => options.onPick?.(null));

    const pmrem = new PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.85;
    pmrem.dispose();
    const key = new DirectionalLight(0xfff1e0, 1.7);
    key.position.set(-2.5, 4, 3);
    const rim = new DirectionalLight(0xe8eeff, 0.6);
    rim.position.set(3, 2, -3);
    this.exhibit.add(this.shadow.group, this.modelRoot);
    this.modelRoot.add(this.lift);
    this.scene.add(key, rim, this.exhibit);
    // Lines and the power path are drawn on their own layer: seen by the camera, but kept out of the shadow and of raycasts.
    this.camera.layers.enable(OVERLAY_LAYER);

    // The container takes the pointer even when the canvas lives elsewhere (it is sized to match the canvas).
    this.controls = new OrbitControls(this.camera, container);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.zoomToCursor = true;
    this.controls.minDistance = 0.5;
    this.controls.maxDistance = 9;
    this.controls.maxPolarAngle = Math.PI * 0.56;
    this.controls.maxTargetRadius = 2.2;
    this.controls.addEventListener('start', () => {
      this.cancel('camera');
      this.setHover(null);
      options.onInteract?.();
    });

    this.raycaster.firstHitOnly = true;
    container.addEventListener('pointermove', this.onPointerMove);
    container.addEventListener('pointerleave', this.onPointerLeave);
    container.addEventListener('pointerdown', this.onPointerDown);
    container.addEventListener('pointerup', this.onPointerUp);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    for (const element of new Set([container, this.host, options.frame ?? container])) this.resizeObserver.observe(element);
    this.resize();
    this.frame = requestAnimationFrame(this.loop);
  }

  // ---------------------------------------------------------------- loading

  async load(thing: Thing, onProgress?: (fraction: number | null) => void): Promise<void> {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(asset(thing.model), (event) => {
      onProgress?.(event.lengthComputable && event.total ? event.loaded / event.total : null);
    });
    if (this.disposed) return;
    this.thing = thing;

    const root = (this.root = gltf.scene);
    for (const name of thing.hide ?? []) root.getObjectByName(name)?.removeFromParent();

    // Normalise into model space: centred on x/z, standing on y = 0, half-diagonal of 1.
    const box = new Box3().setFromObject(root, true);
    const size = box.getSize(new Vector3());
    this.metresPerUnit = 0.5 * size.length();
    const scale = 1 / this.metresPerUnit;
    const normaliser = new Group();
    normaliser.scale.setScalar(scale);
    normaliser.position.set(-((box.min.x + box.max.x) / 2) * scale, -box.min.y * scale, -((box.min.z + box.max.z) / 2) * scale);
    normaliser.add(root);
    this.lift.add(normaliser);
    this.scene.updateMatrixWorld(true);

    root.traverse((object) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh) return;
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      this.meshes.push(mesh);
    });

    const resolve = (name: string) => {
      const node = root.getObjectByName(name);
      if (!node && import.meta.env.DEV) console.warn(`${thing.slug}: no node named "${name}"`);
      return node;
    };

    // Anything belongs to the nearest part above it, so parts can sit inside a frame that is a part too.
    const partAt = new Map<Object3D, number>();
    thing.parts.forEach((part, index) => {
      for (const name of [part.node, ...(part.with ?? [])]) {
        const node = resolve(name);
        if (node) partAt.set(node, index);
      }
    });
    this.partNodes = new Set(partAt.keys());
    const ownerOf = (object: Object3D): number | undefined => {
      for (let o: Object3D | null = object; o; o = o === root ? null : o.parent) {
        const index = partAt.get(o);
        if (index !== undefined) return index;
      }
      return undefined;
    };

    // Parts get their own material copies so one can be highlighted on its own.
    for (const mesh of this.meshes) {
      const index = ownerOf(mesh);
      if (index === undefined) continue;
      this.partByMesh.set(mesh, index);
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map((m) => m.clone()) : mesh.material.clone();
    }
    if (import.meta.env.DEV && thing.parts.length) {
      const loose = this.meshes.filter((mesh) => !this.partByMesh.has(mesh)).map((mesh) => mesh.name || '(unnamed)');
      if (loose.length) console.warn(`${thing.slug}: in no part, so a click on them shows nothing: ${loose.join(', ')}`);
    }

    // Everything that reads rest positions has to happen before anything moves.
    this.exploder = new Exploder(thing.parts, resolve, this.rigs);
    this.mechanism = new Mechanism(thing.motion ?? [], resolve, this.rigs);
    this.linkage = new Linkage(thing.motion ?? [], resolve, this.rigs, root);
    if (this.linkage.has('mirror')) this.cameraBody = new ReflexCamera(this.linkage);
    else if (this.linkage.has('curtain1') || this.linkage.has('focus')) this.cameraBody = new FilmCamera(this.linkage);
    if (this.linkage.has('skirts')) this.aero = new AeroCar(this.linkage);
    if (this.linkage.has('arm_lower')) {
      this.arm = new BalancedArm(this.linkage);
      root.traverse((node) => {
        const layout = node.userData.spring as SpringLayout | undefined;
        if (layout) node.traverse((mesh) => void ((mesh as Mesh).isMesh && this.springs.push(new Stretch(mesh as Mesh, layout, root))));
      });
    }
    if (this.linkage.has('lock-turn')) this.lock = new PinTumbler(this.linkage);
    const blade = this.linkage.has('tape_out') ? this.linkage.stripLayout('tape-blade') : undefined;
    if (blade) this.tape = new TapeMeasure(this.linkage, blade as BladeLayout);
    if (this.linkage.has('ext_lever')) this.extinguisher = new Extinguisher(this.linkage);
    if (this.linkage.has('tw_space')) this.typewriter = new Typewriter(this.linkage);
    this.linkage.apply();
    const deforming = new Set([...this.mechanism.deforming, ...this.linkage.deforming, ...this.springs.map((spring) => spring.mesh)]);
    // How the model can be drawn: as rendered or as a line drawing, with the rest turned to glass around the parts a step is about.
    this.looks = new Looks(this.meshes, (mesh) => this.partByMesh.get(mesh), deforming);
    this.renderer.getDrawingBufferSize(this.looks.resolution);
    this.pickable = [...this.meshes];
    // Labels on moving parts hang from followers, so they travel with the explosion but don't spin with a gear.
    const anchorFor = (node: Object3D) => this.rigs.anchorFor(node);
    this.hotspots = new Hotspots(
      thing.annotations,
      ({ node: name, ride }) => {
        const node = name && resolve(name);
        return node ? (ride ? node : anchorFor(node)) : this.modelRoot;
      },
      (i) => this.options.onSelect?.(i),
    );
    this.badges = new PartBadges(thing.parts, resolve, anchorFor, (i) => {
      this.highlightPart(i);
      this.options.onHoverPart?.(i);
    });

    // Which callout explains which part, so a click on the part can open it: one pinned to the part or anything in it.
    thing.annotations.forEach((annotation, i) => {
      const node = annotation.node ? root.getObjectByName(annotation.node) : undefined;
      const part = node && ownerOf(node);
      if (part !== undefined && !this.calloutByPart.has(part)) this.calloutByPart.set(part, i);
    });

    this.restFloor = this.floor();
    this.assembledBox = this.measure();
    this.arrange(1);
    this.explodedBox = this.measure();
    this.arrange(0);
    this.mechanism.tick(0, this.now(), false);
    this.rigs.apply();
    this.scene.updateMatrixWorld(true);
    this.container.dataset.explode = this.labels.domElement.dataset.explode = 'together';

    // A car with thrusters: the point it turns about in flight, and its jets, each pinned to its nozzle.
    if (this.aero) {
      const centre = this.assembledBox.getCenter(new Vector3());
      this.flightPivot.set(centre.x, 0.45 / this.metresPerUnit, centre.z);
    }
    if (thing.jets?.length) {
      this.jets = new Jets(thing.jets, (jet) => this.pin({ node: jet.node, at: jet.at }), this.modelRoot, 1 / this.metresPerUnit, { core: new Color('#d3e6f6'), edge: new Color('#3a72ad') });
    }

    this.applyPose(this.homePose());
    // Compile shaders without blocking the page, and build the raycast index (for hover and
    // marker occlusion) a mesh at a time when the browser is idle; until then raycasts are just slower.
    if (this.renderer.extensions.has('KHR_parallel_shader_compile')) await this.renderer.compileAsync(this.scene, this.camera);
    this.indexMeshes(this.meshes.filter((mesh) => !deforming.has(mesh)));
    this.shadowDirty = this.dirty = true;
  }

  private indexMeshes(queue = [...this.meshes]): void {
    const idle = window.requestIdleCallback ?? ((callback: () => void) => setTimeout(callback, 16));
    const next = () => {
      const mesh = queue.shift();
      if (!mesh || this.disposed) return;
      mesh.geometry.computeBoundsTree();
      idle(next);
    };
    idle(next);
  }

  /** Lowest point of the model, from mesh bounding boxes (cheap enough to run every frame). */
  private floor(): number {
    let lowest = Infinity;
    for (const mesh of this.meshes) lowest = Math.min(lowest, _box.copy(mesh.geometry.boundingBox!).applyMatrix4(mesh.matrixWorld).min.y);
    return lowest;
  }

  /** Sets the explode value, then lifts the whole model if a part has dropped below the floor. */
  private arrange(value: number): void {
    this.exploder!.set(clamp01(value));
    this.rigs.apply();
    this.modelRoot.position.y = 0;
    this.modelRoot.updateMatrixWorld(true);
    this.modelRoot.position.y = Math.max(0, this.restFloor - this.floor());
    this.modelRoot.updateMatrixWorld(true);
  }

  /** Bounds of the model as currently arranged. */
  private measure(): Box3 {
    this.scene.updateMatrixWorld(true);
    const box = new Box3();
    for (const mesh of this.meshes) box.expandByObject(mesh, true);
    return box;
  }

  /** The model's bounds at an explode value (interpolated, which is close enough for framing). */
  private boxAt(value: number): Box3 {
    const { assembledBox: a, explodedBox: b } = this;
    return new Box3(a.min.clone().lerp(b.min, value), a.max.clone().lerp(b.max, value));
  }

  get canRun(): boolean {
    return !!this.mechanism?.canRun;
  }

  private now(): Date {
    return this.options.time?.() ?? new Date();
  }

  /** Posters are framed for their own canvas; the live viewer for a typical landscape one. */
  private get referenceAspect(): number {
    return this.options.capture ? this.camera.aspect : REFERENCE_ASPECT;
  }

  get explodeValue(): number {
    return this.exploder?.value ?? 0;
  }

  // ----------------------------------------------------------------- camera

  /** A pose from a content file, pulled back on viewers narrower than the reference so the same width stays in view. */
  fitPose(pose: CameraPose): Pose {
    const target = new Vector3(...pose.target);
    const offset = new Vector3(...pose.position).sub(target);
    const halfV = MathUtils.degToRad(FOV / 2);
    const refHalfH = Math.atan(Math.tan(halfV) * this.referenceAspect);
    const halfH = Math.atan(Math.tan(halfV) * this.camera.aspect);
    if (halfH < refHalfH) offset.multiplyScalar(Math.tan(refHalfH) / Math.tan(halfH));
    return { position: target.clone().add(offset), target };
  }

  /** How far back along `direction` (unit, target → camera) the camera must sit for the box to fill the reference frame. */
  private fitDistance(box: Box3, target: Vector3, direction: Vector3, margin = 1 / HOME_FILL, widthShare = 1): number {
    const tanV = Math.tan(MathUtils.degToRad(FOV / 2));
    const tanH = tanV * this.referenceAspect * widthShare;
    const right = new Vector3().crossVectors(new Vector3(0, 1, 0), direction).normalize();
    const up = new Vector3().crossVectors(direction, right);
    const corner = new Vector3();
    let distance = 0;
    for (let i = 0; i < 8; i++) {
      corner.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).sub(target);
      const depth = corner.dot(direction);
      distance = Math.max(distance, depth + (Math.abs(corner.dot(right)) * margin) / tanH, depth + (Math.abs(corner.dot(up)) * margin) / tanV);
    }
    return distance;
  }

  /** The starting view: the content file's pose, or its angle (default a three-quarter view) at a distance that fits. */
  homePose(): Pose {
    if (this.thing?.view) return this.fitPose(this.thing.view);
    return this.poseFrom(this.thing?.viewAngle ?? [32, 22]);
  }

  /** Looking at the assembled model from [azimuth, elevation] degrees, at a distance that fits it as the home view does. */
  private poseFrom([azimuth, elevation]: [number, number]): Pose {
    const direction = new Vector3().setFromSphericalCoords(1, MathUtils.degToRad(90 - elevation), MathUtils.degToRad(azimuth));
    const target = this.assembledBox.getCenter(new Vector3());
    // At rest the model may have only part of the frame's width (the drawings take the rest).
    const position = target.clone().addScaledVector(direction, this.fitDistance(this.assembledBox, target, direction, 1 / this.home.fill, this.home.width));
    return this.fitPose({ position: position.toArray() as CameraPose['position'], target: target.toArray() as CameraPose['target'] });
  }

  currentPose(): CameraPose {
    return {
      position: this.camera.position.toArray().map((v) => +v.toFixed(3)) as CameraPose['position'],
      target: this.controls.target.toArray().map((v) => +v.toFixed(3)) as CameraPose['target'],
    };
  }

  applyPose(pose: Pose): void {
    this.cancel('camera');
    this.controls.target.copy(pose.target);
    this.camera.position.copy(pose.position);
    this.camera.lookAt(pose.target);
    this.stopMomentum();
    this.dirty = true;
  }

  /** Flies along an arc around the target rather than a straight line through the model. On the
   *  way the view slides to where the composition puts it: off centre for a home view, centred for a close-up. */
  flyTo(pose: Pose, duration = 1100, ease = easeInOutCubic): Promise<void> {
    if (this.options.reducedMotion) duration = 0;
    this.stopMomentum();
    const fromTarget = this.controls.target.clone();
    const from = new Spherical().setFromVector3(this.camera.position.clone().sub(fromTarget));
    const to = new Spherical().setFromVector3(pose.position.clone().sub(pose.target));
    const turn = MathUtils.euclideanModulo(to.theta - from.theta + Math.PI, Math.PI * 2) - Math.PI;
    const [r0, r1] = [Math.log(from.radius), Math.log(to.radius)];
    const spherical = new Spherical();
    const shiftFrom = this.shift.clone();
    const shiftTo = this.shiftTarget;
    return this.tween('camera', duration, (t) => {
      const e = ease(t);
      this.controls.target.lerpVectors(fromTarget, pose.target, e);
      spherical.set(Math.exp(r0 + (r1 - r0) * e), from.phi + (to.phi - from.phi) * e, from.theta + turn * e);
      this.camera.position.setFromSpherical(spherical).add(this.controls.target);
      this.camera.lookAt(this.controls.target);
      if (!shiftFrom.equals(shiftTo)) {
        this.shift.lerpVectors(shiftFrom, shiftTo, e);
        this.project();
      }
    });
  }

  /** Where the view's centre belongs: off the frame's centre as the CSS says for a home view, on it for a close-up. */
  private get shiftTarget(): Vector2 {
    return this.composed ? new Vector2(this.home.x, this.home.y) : this.closeUpShift.clone();
  }

  /** The opening move: swing in from off to one side. */
  intro(): Promise<void> {
    this.composed = true;
    const home = this.homePose();
    const offset = home.position.clone().sub(home.target).multiplyScalar(1.35).applyAxisAngle(new Vector3(0, 1, 0), -0.75);
    this.applyPose({ position: home.target.clone().add(offset), target: home.target });
    return this.flyTo(home, 1800, easeOutQuint);
  }

  /** The home view, reframed for an explode value (default: the current one). Models that explode
   *  toward the camera name a better angle for seeing them apart. */
  framedHomePose(value = this.explodeValue): Pose {
    const angle = this.thing?.explodeAngle;
    return this.fitExplosion(angle && value > 0.5 ? this.poseFrom(angle) : this.homePose(), value);
  }

  resetView(): Promise<void> {
    this.hotspots?.setActive(null);
    this.composed = true;
    return this.flyTo(this.framedHomePose());
  }

  orbit(dTheta: number, dPhi: number): void {
    const offset = new Spherical().setFromVector3(this.camera.position.clone().sub(this.controls.target));
    offset.theta += dTheta;
    offset.phi = MathUtils.clamp(offset.phi + dPhi, 0.05, this.controls.maxPolarAngle);
    this.flyTo({ position: new Vector3().setFromSpherical(offset).add(this.controls.target), target: this.controls.target.clone() }, 350);
  }

  zoom(factor: number): void {
    const offset = this.camera.position.clone().sub(this.controls.target);
    const distance = MathUtils.clamp(offset.length() * factor, this.controls.minDistance, this.controls.maxDistance);
    offset.setLength(distance);
    this.flyTo({ position: this.controls.target.clone().add(offset), target: this.controls.target.clone() }, 300);
  }

  /** How the framing changes between the assembled model and the model at an explode value, seen from a pose. */
  private explosionFraming(pose: Pose, value: number) {
    const direction = pose.position.clone().sub(pose.target).normalize();
    const from = this.assembledBox.getCenter(new Vector3());
    const to = this.boxAt(value).getCenter(new Vector3());
    // Framed like the home view, the model has only its share of the frame's width (the drawings take the rest).
    const share = this.composed ? this.home.width : 1;
    const ratio = this.fitDistance(this.boxAt(value), to, direction, undefined, share) / this.fitDistance(this.assembledBox, from, direction, undefined, share);
    return { shift: to.sub(from), ratio };
  }

  /** Same viewing direction, moved and scaled so the model fits at the given explode value. */
  private fitExplosion(pose: Pose, value: number): Pose {
    const { shift, ratio } = this.explosionFraming(pose, value);
    const target = pose.target.clone().add(shift);
    return { position: target.clone().add(pose.position.clone().sub(pose.target).multiplyScalar(ratio)), target };
  }

  private stopMomentum(): void {
    // Applying any leftover damping now stops it fighting the next animation.
    this.controls.enableDamping = false;
    this.controls.update();
    this.controls.enableDamping = true;
  }

  // ---------------------------------------------------------------- callouts

  focusCallout(index: number | null): void {
    const thing = this.thing;
    if (!thing || !this.hotspots) return;
    this.hotspots.setActive(index);
    if (index === null) {
      void this.resetView();
      return;
    }
    const annotation = thing.annotations[index];
    let pose: Pose;
    if (annotation.explode !== undefined && annotation.camera) {
      // Open the model to show it; the camera pose is for that state.
      if (Math.abs(this.explodeValue - annotation.explode) > 0.005) void this.animateExplode(annotation.explode, { camera: false });
      pose = this.fitPose(annotation.camera);
    } else if (annotation.camera) {
      pose = this.fitPose(annotation.camera);
      // Follow the part if it has been pulled out of the assembly.
      const moved = this.hotspots.displacement(index);
      pose.position.add(moved);
      pose.target.add(moved);
    } else {
      const point = this.hotspots.position(index);
      const outward = point.clone().sub(this.assembledBox.getCenter(new Vector3())).normalize();
      const current = this.camera.position.clone().sub(this.controls.target).normalize();
      const direction = current.lerp(outward, 0.6).normalize();
      pose = this.fitPose({
        position: point.clone().addScaledVector(direction, 1.5).toArray() as CameraPose['position'],
        target: point.toArray() as CameraPose['target'],
      });
    }
    // Callout poses are framed on the stage's centre, as they were written.
    this.composed = false;
    void this.flyTo(pose);
  }

  /** Swings round to look at one part, wherever it currently is. */
  focusPart(index: number): void {
    const part = this.thing?.parts[index];
    const node = part && this.root?.getObjectByName(part.node);
    if (!node) return;
    this.hotspots?.setActive(null);
    const sphere = new Box3().setFromObject(node, true).getBoundingSphere(new Sphere());
    const outward = sphere.center.clone().sub(this.assembledBox.getCenter(new Vector3()));
    const current = this.camera.position.clone().sub(this.controls.target).normalize();
    // A part off to one side is looked at from that side; one in the middle (a case, a frame) from where we are.
    const direction = outward.length() > 0.1 ? current.lerp(outward.normalize(), 0.5).normalize() : current;
    const distance = MathUtils.clamp(sphere.radius / Math.sin(MathUtils.degToRad(FOV / 2)) * 1.1, 0.9, 4);
    this.composed = false;
    void this.flyTo(
      this.fitPose({
        position: sphere.center.clone().addScaledVector(direction, distance).toArray() as CameraPose['position'],
        target: sphere.center.toArray() as CameraPose['target'],
      }),
    );
  }

  /** The callout that explains a part, if one is pinned to it. */
  calloutForPart(index: number): number | null {
    return this.calloutByPart.get(index) ?? null;
  }

  /** Opens an explanation card beside a callout's marker or a part; it follows them as the model moves. */
  showCard(content: CardContent, at: { callout: number } | { part: number }): void {
    let anchor: Object3D | undefined;
    const position = new Vector3();
    if ('callout' in at) {
      anchor = this.hotspots?.anchorOf(at.callout);
    } else {
      const part = this.thing?.parts[at.part];
      const node = part && this.root?.getObjectByName(part.node);
      if (!node) return;
      // Point at the spot that was clicked, or else somewhere on the part in view.
      const point = this.picked?.part === at.part ? this.picked.point : this.visiblePoint(at.part, node);
      anchor = point ? this.rigs.anchorFor(node) : this.badges?.anchorOf(at.part);
      if (point) anchor!.worldToLocal(position.copy(point));
      else if (!anchor) {
        // Hidden parts without a tag (the frame everything comes off) get a point at their middle.
        anchor = this.rigs.anchorFor(node);
        anchor.worldToLocal(position.copy(new Box3().setFromObject(node, true).getCenter(new Vector3())));
      }
    }
    if (!anchor) return;
    this.card.show(anchor, position, content);
    this.labels.domElement.classList.add('has-card');
    this.cardPart = 'part' in at ? at.part : null;
    this.highlightPart(this.cardPart);
    this.dirty = true;
  }

  hideCard(): void {
    this.card.hide();
    this.labels.domElement.classList.remove('has-card');
    this.cardPart = null;
    this.highlightPart(this.hoveredPart);
    this.dirty = true;
  }

  /** A point on a part that the camera can see: its middle, or failing that towards its edges. */
  private visiblePoint(index: number, node: Object3D): Vector3 | null {
    const box = new Box3().setFromObject(node, true);
    const centre = box.getCenter(new Vector3());
    const half = box.getSize(new Vector3()).multiplyScalar(0.5);
    const aim = new Vector3();
    for (const [x, y] of [[0, 0], [0, 0.6], [0, -0.6], [0.6, 0], [-0.6, 0]]) {
      aim.set(x, y, 0).multiply(half).add(centre).sub(this.camera.position).normalize();
      this.raycaster.set(this.camera.position, aim);
      const hit = this.raycaster.intersectObjects(this.pickable, false)[0];
      if (hit && this.partByMesh.get(hit.object) === index) return hit.point;
    }
    return null;
  }

  // -------------------------------------------------------------- hand-over

  /** Fades the canvas and labels in, once the model is loaded and posed. */
  reveal(): void {
    this.renderer.domElement.classList.add('is-shown');
    this.labels.domElement.classList.add('is-shown');
  }

  /** Slides the model in from one side as it takes over from the last object (1: from the right). Its labels follow once it's in place. */
  async enter(from: 1 | -1): Promise<void> {
    const distance = this.offstage(from);
    const right = new Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0);
    this.renderer.domElement.classList.add('is-shown');
    await this.tween('exhibit', this.options.reducedMotion ? 0 : 1100, (t) => {
      const e = 1 - easeOutQuint(t);
      this.exhibit.position.copy(right).multiplyScalar(from * distance * e);
      this.exhibit.rotation.y = from * 0.5 * e;
      this.shadowDirty = true;
    });
    this.labels.domElement.classList.add('is-shown');
  }

  /** Slides the model off to one side (1: to the right) to make way for the next object. */
  leave(to: 1 | -1): Promise<void> {
    this.controls.enabled = false;
    this.card.hide();
    this.setHover(null);
    this.labels.domElement.classList.remove('is-shown');
    if (!this.root) return Promise.resolve();
    const distance = this.offstage(to);
    const right = new Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0);
    const canvas = this.renderer.domElement;
    // The fade rides the same clock as the slide (no CSS transition), fading out over the second half.
    canvas.style.transition = 'none';
    return this.tween('exhibit', this.options.reducedMotion ? 0 : 900, (t) => {
      const e = easeInCubic(t);
      this.exhibit.position.copy(right).multiplyScalar(to * distance * e);
      this.exhibit.rotation.y = to * 0.5 * e;
      canvas.style.opacity = String(1 - clamp01((t - 0.45) / 0.5));
      this.shadowDirty = true;
    });
  }

  /** How far along the camera's right the model has to move to clear the edge of the drawing area (side 1: right). */
  private offstage(side: 1 | -1): number {
    const distance = this.camera.position.distanceTo(this.controls.target);
    const pixelsPerUnit = this.frameRect.height / (2 * distance * Math.tan(MathUtils.degToRad(FOV / 2)));
    const centre = this.frameRect.left + this.frameRect.width * (0.5 + this.shift.x);
    const edge = side > 0 ? this.hostRect.right - centre : centre - this.hostRect.left;
    const radius = this.assembledBox.getSize(new Vector3()).length() / 2;
    return edge / (pixelsPerUnit || 1) + radius * 1.2;
  }

  // ----------------------------------------------------------------- explode

  setExplode(value: number): void {
    if (!this.exploder || this.exploder.isEmpty) return;
    this.cancel('explode');
    this.applyExplode(value);
  }

  /** Animates the explosion and (unless told otherwise) keeps the whole model in frame while it grows or shrinks. */
  animateExplode(to: number, { camera = true } = {}): Promise<void> {
    if (!this.exploder || this.exploder.isEmpty) return Promise.resolve();
    const from = this.exploder.value;
    const duration = this.thing?.explodeDuration ?? 1300;
    if (!camera) {
      // The caller moves the camera.
    } else if (this.thing?.explodeAngle) {
      this.composed = true;
      void this.flyTo(this.framedHomePose(to), duration);
    } else {
      // Keep the visitor's view: strip the current value's framing back to the assembled one, then frame for the destination.
      const current = { position: this.camera.position.clone(), target: this.controls.target.clone() };
      void this.flyTo(this.fitExplosion(this.unfitExplosion(current, from), to), duration);
    }
    return this.tween('explode', this.options.reducedMotion ? 200 : duration, (t) => this.applyExplode(from + (to - from) * easeInOutCubic(t)));
  }

  private unfitExplosion(pose: Pose, value: number): Pose {
    const { shift, ratio } = this.explosionFraming(pose, value);
    const target = pose.target.clone().sub(shift);
    return { position: target.clone().add(pose.position.clone().sub(pose.target).divideScalar(ratio)), target };
  }

  private applyExplode(value: number): void {
    if (!this.exploder) return;
    this.arrange(value);
    this.container.dataset.explode = this.labels.domElement.dataset.explode = value > 0.45 ? 'apart' : 'together';
    this.badges?.update(this.exploder.progress);
    for (const flow of this.flows) flow.update();
    this.shadowDirty = this.dirty = true;
    this.occlusionDue = 0;
    this.options.onExplode?.(this.exploder.value);
  }

  setRunning(running: boolean): void {
    if (this.mechanism) this.mechanism.running = running;
  }

  /** Seconds a spinning mechanism has run for, at its speed (for charts that follow it). */
  get runTime(): number {
    return this.mechanism?.time ?? 0;
  }

  /** Scales how fast these spinning parts turn (a belt on other pulleys); no names puts every part back to its own speed. */
  setSpinFactor(nodes: string[] | null, factor = 1): void {
    const objects = nodes && new Set(nodes.map((name) => this.root?.getObjectByName(name)).filter((o): o is Object3D => !!o));
    this.mechanism?.setSpinFactor(objects ?? null, factor);
  }

  /** Slows the clock-driven parts down (a watch's escapement) or lets them catch up with real time. */
  setSlowMotion(on: boolean): void {
    this.mechanism?.setRate(on ? (this.thing?.slowMotion?.rate ?? 0.05) : 1, this.options.reducedMotion);
  }

  // ------------------------------------------------------------ how it works

  get look(): LookMode {
    return this.looks?.mode ?? 'rendered';
  }

  /** Draws the model as rendered or as a line drawing. */
  setLook(mode: LookMode, { animate = true } = {}): void {
    const looks = this.looks;
    if (!looks || mode === looks.mode) return;
    const id = ++this.sweepId;
    this.cancel('look');
    if (!animate || this.options.reducedMotion) {
      looks.setMode(mode);
      this.lookChanged();
      return;
    }
    // A scan line comes down the model and draws the new look in behind it.
    const box = this.boxAt(this.explodeValue);
    const pad = (box.max.y - box.min.y) * 0.05;
    const [top, bottom] = [box.max.y + pad, box.min.y - pad];
    looks.beginSweep(mode, top, top - bottom);
    this.lookChanged();
    void this.tween('look', 1200, (t) => looks.sweep(top + (bottom - top) * easeInOutCubic(t))).then(() => {
      if (id !== this.sweepId) return;
      looks.endSweep();
      this.dirty = true;
    });
  }

  /** Shows or hides the callout numbers and part letters. The model starts without them; a callout picked from the
   *  page still shows its marker, and hovering or clicking a part still names it. */
  setLabels(on: boolean): void {
    this.labels.domElement.toggleAttribute('data-labels', on);
    this.occlusionDue = 0;
    this.dirty = true;
  }

  /** The model's real size (assembled), in metres: x across, y up, z front to back. */
  get realSize(): Vector3 {
    return this.assembledBox.getSize(new Vector3()).multiplyScalar(this.metresPerUnit);
  }

  /** Turns to look straight at the model's front, side or top, as its drawings show it. */
  lookFrom(view: 'front' | 'side' | 'top'): Promise<void> {
    const angle: Record<typeof view, [number, number]> = { front: [0, 0], side: [90, 0], top: [0, 89] };
    this.hotspots?.setActive(null);
    this.composed = true;
    return this.flyTo(this.fitExplosion(this.poseFrom(angle[view]), this.explodeValue), 1200);
  }

  /** A small square picture of the model drawn as lines, from where it's first seen (for the page's view switch). */
  async wireframeThumbnail(size = 192): Promise<string | null> {
    if (!this.looks || !this.root || this.disposed) return null;
    const pixels = Math.round(size * Math.min(window.devicePixelRatio, 2));
    const [azimuth, elevation] = this.thing?.viewAngle ?? [32, 22];
    const direction = new Vector3().setFromSphericalCoords(1, MathUtils.degToRad(90 - elevation), MathUtils.degToRad(azimuth));
    const target = this.assembledBox.getCenter(new Vector3());
    const camera = new PerspectiveCamera(FOV, 1, 0.01, 100);
    camera.position.copy(target).addScaledVector(direction, this.fitDistance(this.assembledBox, target, direction, 1.12, 1 / this.referenceAspect));
    camera.lookAt(target);
    camera.layers.enable(OVERLAY_LAYER);
    camera.updateMatrixWorld(true);
    const [url] = await this.renderAsLines([{ camera, width: pixels, height: pixels }]);
    return url ?? null;
  }

  private lookChanged(): void {
    this.pickable = this.meshes.filter((mesh) => this.looks!.isPickable(mesh));
    // A heavy shadow under a line drawing, or behind a close-up of the inside, only gets in the way.
    this.shadow.setStrength(this.looks!.mode === 'wireframe' ? 0.45 : this.labels.domElement.hasAttribute('data-touring') ? 0.55 : 1);
    if (this.hoveredPart !== null) this.hoverDue = true;
    this.occlusionDue = 0;
    this.dirty = true;
  }

  /** The meshes of these nodes: a part's node brings the nodes that travel with it, but not other parts inside it. */
  private meshesNamed(names: string[] = []): Set<Mesh> {
    const wanted = new Set(names);
    for (const part of this.thing?.parts ?? []) if (wanted.has(part.node)) for (const name of part.with ?? []) wanted.add(name);
    const found = new Set<Mesh>();
    for (const mesh of this.meshes) {
      for (let o: Object3D | null = mesh; o; o = o === this.root ? null : o.parent) {
        if (wanted.has(o.name)) {
          found.add(mesh);
          break;
        }
        if (this.partNodes.has(o)) break;
      }
    }
    return found;
  }

  /** Keeps these nodes solid while the rest give way; null for nothing in particular. */
  setFocus(nodes: string[] | null): void {
    if (!this.looks) return;
    this.looks.setFocus(nodes ? this.meshesNamed(nodes) : null);
    this.lookChanged();
  }

  /** Into or out of "How it works": the callout markers and part tags step back, and the clock doesn't race to make up
   *  for slow motion (or a balance held still) until it's over. */
  setTouring(on: boolean): void {
    this.labels.domElement.toggleAttribute('data-touring', on);
    this.container.toggleAttribute('data-touring', on);
    if (this.looks) this.lookChanged();
    if (this.mechanism) this.mechanism.catchUp = !on;
    if (on) return;
    this.looks?.setLens(null);
    this.looks?.setHidden(new Set());
    this.setFlow();
    this.setTags(null);
    this.setFocus(null);
    this.timeScale = 1;
    this.setLoose(false);
    this.hold(false);
    this.wind(false);
    this.aero?.reset();
    if (this.arm) {
      this.hookSprings(true);
      this.arm.reset(this.options.reducedMotion);
    }
    this.lock?.reset();
    this.tape?.reset();
    this.extinguisher?.reset();
    this.typewriter?.reset();
  }

  /** Shows a step: takes the model apart as far as it says, and frames the parts it's about from its angle (or flies
   *  to its exact camera), on the stage's middle. Ghosts far from those parts fade, so a close-up isn't seen through a veil. */
  showStep(step: View, { instant = false, camera = true } = {}): void {
    const explode = step.explode ?? 0;
    const moving = !!this.exploder && Math.abs(this.explodeValue - explode) > 0.005;
    const { pose, sphere, focused } = this.framing(step);
    if (moving && instant) this.setExplode(explode);
    else if (moving) void this.animateExplode(explode, { camera: false });
    this.looks?.setLens(focused ? sphere.center : null, sphere.radius * 1.1, sphere.radius * 1.9);
    this.looks?.setHidden(this.meshesNamed(step.hide));
    this.lookChanged();
    this.hotspots?.setActive(null);
    this.composed = false;
    if (camera) void this.flyTo(pose, instant ? 0 : 1400);
  }

  /** Where a step puts the camera: its parts framed from its angle (or its exact camera), with the model as far apart as
   *  it says. A film follows these from one shot to the next. */
  stepPose(step: View, box?: [Vec3, Vec3]): CameraPose {
    const { position, target } = this.framing(step, box && new Box3(new Vector3(...box[0]), new Vector3(...box[1]))).pose;
    return { position: position.toArray() as Vec3, target: target.toArray() as Vec3 };
  }

  /** The box round the parts a step frames, as they are now (world space): a film frames a shot on the parts where they
   *  start and where they end up. */
  framedBox(step: View): [Vec3, Vec3] {
    const explode = step.explode ?? 0;
    const now = this.explodeValue;
    const moving = !!this.exploder && Math.abs(now - explode) > 0.005;
    if (moving) this.arrange(explode);
    const names = step.frame?.length ? step.frame : step.focus;
    const box = new Box3();
    for (const mesh of names?.length ? this.meshesNamed(names) : this.meshes) box.expandByObject(mesh);
    if (moving) this.arrange(now);
    if (box.isEmpty()) box.copy(this.assembledBox);
    return [box.min.toArray() as Vec3, box.max.toArray() as Vec3];
  }

  /** Puts the camera here at once, framed as a close-up (a film moving it on every frame). */
  followPose(pose: CameraPose): void {
    this.composed = false;
    if (!this.shift.equals(this.closeUpShift)) {
      this.shift.copy(this.closeUpShift);
      this.project();
    }
    this.applyPose({ position: _follow.position.set(...pose.position), target: _follow.target.set(...pose.target) });
  }

  /** Flies to a pose given as numbers (a film starting, or picking up where it left off). */
  flyToPose(pose: CameraPose, duration: number): Promise<void> {
    this.composed = false;
    return this.flyTo({ position: new Vector3(...pose.position), target: new Vector3(...pose.target) }, duration);
  }

  private framing(step: View, given?: Box3): { pose: Pose; sphere: Sphere; focused: boolean } {
    const explode = step.explode ?? 0;
    // Where the parts in focus will be once the model is as far apart as the step says.
    const now = this.explodeValue;
    const moving = !!this.exploder && Math.abs(now - explode) > 0.005;
    if (moving) this.arrange(explode);
    const focus = step.focus?.length ? this.meshesNamed(step.focus) : null;
    const framed = step.frame?.length ? this.meshesNamed(step.frame) : focus;
    const box = new Box3();
    if (given) box.copy(given);
    else for (const mesh of framed ?? this.meshes) box.expandByObject(mesh);
    if (box.isEmpty()) box.copy(this.assembledBox);
    const sphere = box.getBoundingSphere(new Sphere());
    let pose: Pose;
    if (step.camera) {
      pose = this.fitPose(step.camera);
    } else {
      const [azimuth, elevation] = step.angle ?? this.thing?.viewAngle ?? [32, 22];
      const direction = new Vector3().setFromSphericalCoords(1, MathUtils.degToRad(90 - elevation), MathUtils.degToRad(azimuth));
      const target = box.getCenter(new Vector3());
      const position = target.clone().addScaledVector(direction, this.fitDistance(box, target, direction, 1 / (step.fill ?? 0.75)));
      pose = this.fitPose({ position: position.toArray() as Vec3, target: target.toArray() as Vec3 });
    }
    if (moving) this.arrange(now);
    // The lens is round the parts in focus, not the ones framed.
    if (focus && framed !== focus) {
      const lens = new Box3();
      for (const mesh of focus) lens.expandByObject(mesh);
      if (!lens.isEmpty()) lens.getBoundingSphere(sphere);
    }
    return { pose, sphere, focused: !!focus };
  }

  /** An anchor at a model-space point (given for the assembled model) that rides with a node, if one is named. */
  private pin(point: FlowPoint): Object3D {
    const [name, at] = Array.isArray(point) ? [null, point] : [point.node, point.at];
    const node = name ? this.root?.getObjectByName(name) : undefined;
    if (name && !node && import.meta.env.DEV) console.warn(`${this.thing?.slug}: no node named "${name}"`);
    // Placed against the parts as they are assembled, even while a step's explode is still on its way
    // (a part hanging from one that has been lifted would otherwise get the lift as well).
    return node ? this.assembled(node, () => this.place(point, node, at)) : this.place(point, node, at);
  }

  /** Runs `fn` with a node and everything it hangs from moved back to where they are when assembled. */
  private assembled<T>(node: Object3D, fn: () => T): T {
    const saved: { rig: NonNullable<ReturnType<Rigs['find']>>; angle: number; offset: Vector3; extra: Vector3 }[] = [];
    for (let o: Object3D | null = node; o; o = o.parent) {
      const rig = this.rigs.find(o);
      if (!rig) continue;
      saved.push({ rig, angle: rig.angle, offset: rig.offset.clone(), extra: rig.extra.clone() });
      rig.angle = 0;
      rig.offset.set(0, 0, 0);
      rig.extra.set(0, 0, 0);
      rig.apply();
    }
    node.updateWorldMatrix(true, true);
    try {
      return fn();
    } finally {
      for (const { rig, angle, offset, extra } of saved) {
        rig.angle = angle;
        rig.offset.copy(offset);
        rig.extra.copy(extra);
        rig.apply();
      }
      node.updateWorldMatrix(true, true);
    }
  }

  private place(point: FlowPoint, node: Object3D | undefined, at: Vec3): Object3D {
    const marker = new Object3D();
    const world = this.modelRoot.localToWorld(new Vector3(...at));
    const rig = node && this.rigs.find(node);
    if (node && rig && !Array.isArray(point) && point.ride) {
      // On the part itself, so it goes round with it.
      marker.position.copy(node.worldToLocal(world));
      marker.userData.rides = true;
      node.add(marker);
    } else if (node && rig) {
      // A rig's follower sits at its parent's origin when the part is home, and moves with it.
      const follower = this.rigs.anchorFor(node);
      marker.position.copy(follower.parent!.worldToLocal(world));
      follower.add(marker);
    } else if (node) {
      marker.position.copy(node.worldToLocal(world));
      node.add(marker);
    } else {
      marker.position.set(...at);
      this.modelRoot.add(marker);
    }
    return marker;
  }

  /** The paths the power (or the light) takes, drawn through the parts; none hides them. */
  setFlow(paths: FlowPoint[][] = [], carries: 'power' | 'light' | 'air' | 'water' = 'power'): void {
    paths = paths.filter((path) => path.length > 1);
    while (this.flows.length < paths.length) {
      const flow = new Flow(this.scene);
      flow.setClip(this.flowClip);
      this.flows.push(flow);
    }
    this.flows.forEach((flow, i) => flow.set(paths[i] ? paths[i].map((point) => this.pin(point)) : null, { animate: !this.options.reducedMotion, carries }));
    this.dirty = true;
  }

  /** Labels on parts for a step, each where it says or at its part's middle; null clears them. */
  setTags(tags: Shot['tags'] | null): void {
    const entries = (tags ?? []).flatMap((tag) => {
      const node = this.root?.getObjectByName(tag.node);
      if (!node) return [];
      if (tag.at) return [{ anchor: this.pin({ node: tag.node, at: tag.at, ride: tag.ride }), text: tag.text }];
      // Its middle as it is now, held in the frame of whatever it rides with.
      const anchor = new Object3D();
      const parent = this.rigs.anchorFor(node);
      anchor.position.copy(parent.worldToLocal(new Box3().setFromObject(node, true).getCenter(new Vector3())));
      parent.add(anchor);
      return [{ anchor, text: tag.text }];
    });
    this.tags.set(entries);
    this.dirty = true;
  }

  /** What a clock-driven mechanism is doing, for charts; null if there's none. */
  get mechanismState(): MechanismState | null {
    return this.mechanism ? this.mechanism.state : null;
  }

  get canWind(): boolean {
    return !!this.mechanism?.canWind;
  }

  /** How fast the mechanism runs: 1 is real time, less is slow motion. A crank-driven one runs that much slower too,
   *  and so does a camera's shutter. */
  setRate(rate: number): void {
    if (this.cameraBody) this.cameraBody.rate = rate;
    if (!this.mechanism) return;
    this.mechanism.setRate(rate, this.options.reducedMotion);
    this.mechanism.spinRate = rate;
  }

  // ------------------------------------------------------ a car's fans and thrusters

  /** What a car's suction fans and thrusters are doing, for charts and readouts; null if it has none. */
  get aeroState(): AeroState | null {
    return this.aero?.state ?? null;
  }

  /** Switches a car's suction fans on or off (the skirts follow them). */
  setFans(on: boolean): void {
    this.aero?.setFans(on);
  }

  /** The road speed a car's grip is worked out for, km/h (its wing rises at speed). */
  setRoadSpeed(kmh: number): void {
    this.aero?.setSpeed(kmh);
  }

  /** Raises a car's rear wing, or stows it. */
  setWing(up: boolean): void {
    this.aero?.setWing(up);
  }

  /** Holds a car's rear thrusters open, or shuts them. */
  fireThrusters(on: boolean): void {
    this.aero?.fire(on);
  }

  /** Flies a car on its lift thrusters: a hop, or a barrel roll. False if it can't just now. */
  fly(kind: FlightKind): boolean {
    return !!this.aero?.fly(kind);
  }

  /** Fills a car's air tanks again. */
  refillAir(): void {
    this.aero?.refill();
  }

  /** A car's fans and thrusters for a frame: their controls move, the jets follow the nozzles' throttles, and in flight the
   *  whole car is lifted and turned about its middle. Returns whether anything moved. */
  private tickAero(dt: number): boolean {
    const aero = this.aero!;
    let moved = aero.tick(dt);
    const state = aero.state;
    const f = state.flight;
    const flying = !!f && (f.height > 1e-4 || f.roll !== 0 || f.pitch !== 0 || f.heading !== 0);
    if (flying || this.flying) {
      _euler.set(f?.pitch ?? 0, f?.heading ?? 0, f?.roll ?? 0, 'YXZ');
      this.lift.quaternion.setFromEuler(_euler);
      this.lift.position.copy(this.flightPivot).sub(_v.copy(this.flightPivot).applyQuaternion(this.lift.quaternion));
      this.lift.position.y += (f?.height ?? 0) / this.metresPerUnit;
      this.flying = flying;
      this.shadowDirty = moved = true;
      // Labels pinned to the parts go with it.
      for (const flow of this.flows) flow.update();
    }
    if (this.jets?.update(state, f?.height ?? 0, dt)) moved = true;
    return moved;
  }

  // ------------------------------------------------------------- a balanced arm

  /** A balanced arm's angles, torques and springs, for charts and readouts; null if this isn't one. */
  get armState(): ArmState | null {
    return this.arm?.state ?? null;
  }

  /** Moves a balanced arm to these angles (degrees from upright; null leaves one be), as a hand would. */
  setArm(lower: number | null, upper: number | null): void {
    this.arm?.set(lower, upper, this.options.reducedMotion);
  }

  /** Hooks a balanced arm's springs on or off: off, they show as taken out and the arm falls to its stops. */
  hookSprings(on: boolean): void {
    if (!this.arm || !this.looks) return;
    this.arm.hook(on);
    this.looks.setRemoved(on ? new Set() : new Set(this.springs.map((spring) => spring.mesh)));
    this.lookChanged();
  }

  /** Puts a balanced arm back as it was modelled, springs on. */
  resetArm(): void {
    this.hookSprings(true);
    this.arm?.reset(this.options.reducedMotion);
  }

  // ------------------------------------------------------------- a lock

  /** What a pin tumbler lock's keys, pins and plug are doing, for charts and readouts; null if this isn't one. */
  get lockState(): LockState | null {
    return this.lock?.state ?? null;
  }

  /** Puts the right key or the wrong one in the lock, or takes the key out. */
  chooseKey(key: KeyName): void {
    this.lock?.choose(key, this.options.reducedMotion);
  }

  /** Slides the key in the lock this fraction of the way in. */
  insertKey(fraction: number): void {
    this.lock?.setInsert(fraction);
  }

  /** Tries to turn the key a quarter turn, or turns it back. */
  turnKey(on: boolean): void {
    this.lock?.turn(on);
  }

  /** Holds the key turned this far (degrees), if it will go. */
  setKeyAngle(deg: number): void {
    this.lock?.setAngle(deg);
  }

  // ------------------------------------------------------------- a tape measure

  /** What a tape measure's blade, drum, spring, lock and hook are doing, for charts and readouts; null if this isn't one. */
  get tapeState(): TapeState | null {
    return this.tape?.state ?? null;
  }

  /** Pulls a tape measure's blade out to `mm` (the lock, if on, holds it where it is). */
  setTapeOut(mm: number): void {
    this.tape?.setOut(mm);
  }

  /** Lets go of the blade, so the spring winds it in (unless the lock is on). */
  letGoTape(): void {
    this.tape?.letGo();
  }

  setTapeLock(on: boolean): void {
    this.tape?.setLock(on);
  }

  /** The hook pushed against a wall (false) or hooked over an edge and pulled (true). */
  setTapeHook(hooked: boolean): void {
    this.tape?.setHook(hooked);
  }

  // ------------------------------------------------------------- an extinguisher

  /** What an extinguisher's pin, lever and charge are doing, for charts and readouts; null if this isn't one. */
  get extinguisherState(): ExtinguisherState | null {
    return this.extinguisher?.state ?? null;
  }

  /** Pulls an extinguisher's safety pin, or puts it back. */
  pullPin(out = true): void {
    this.extinguisher?.pullPin(out);
  }

  /** Squeezes an extinguisher's lever while `on` (it moves only with the pin out). */
  squeezeLever(on: boolean): void {
    this.extinguisher?.squeeze(on);
  }

  /** Holds an extinguisher upside down, or upright again. */
  invertExtinguisher(on: boolean): void {
    this.extinguisher?.setInverted(on);
  }

  /** Recharges an extinguisher: powder and nitrogen back in. */
  rechargeExtinguisher(): void {
    this.extinguisher?.refill();
  }

  // ------------------------------------------------------------- a typewriter

  /** What a typewriter's keys, escapement and carriage are doing; null if this isn't one. */
  get typewriterState(): TypewriterState | null {
    return this.typewriter?.state ?? null;
  }

  /** Types its word up to `n` letters (a fraction is a stroke under way). */
  typeLetters(n: number): void {
    this.typewriter?.setTyped(n);
  }

  // ------------------------------------------------------------- a camera

  /** What a camera's lens and shutter are set to and doing, for charts and readouts; null if this isn't a camera. */
  get cameraState(): CameraState | ReflexState | null {
    return this.cameraBody?.state ?? null;
  }

  /** Turns the focusing ring to a distance (m; Infinity for infinity). */
  focusAt(metres: number): void {
    this.cameraBody?.focusAt(metres, this.options.reducedMotion);
  }

  /** Turns the aperture ring to a stop (0 is wide open). */
  setStop(stop: number): void {
    this.cameraBody?.setStop(stop, this.options.reducedMotion);
  }

  setShutterSpeed(seconds: number): void {
    this.cameraBody?.setSpeed(seconds);
  }

  /** Presses the shutter release; false if the shutter isn't wound. */
  fire(): boolean {
    return !!this.cameraBody?.fire();
  }

  /** One stroke of the advance lever; false if there's nothing to wind. */
  windOn(): boolean {
    return !!this.cameraBody?.windOn();
  }

  /** A reflex camera's dark slide: pulled out so the film can be exposed, or pushed back in. */
  setDarkSlide(out: boolean): void {
    if (this.cameraBody instanceof ReflexCamera) this.cameraBody.setSlide(out);
  }

  /** Closes a reflex lens's iris to the stop set while looking through it (or opens it again). */
  setStopPreview(on: boolean): void {
    if (this.cameraBody instanceof ReflexCamera) this.cameraBody.setPreview(on);
  }

  /** Holds the balance still, or lets it go. */
  hold(on: boolean): void {
    if (this.mechanism) this.mechanism.held = on;
  }

  /** Turns the crown, winding the mainspring, while `on`. */
  wind(on: boolean): void {
    this.mechanism?.setWinding(on);
  }

  /** Sets how many hours the mainspring has left in it. */
  setReserve(hours: number): void {
    if (this.mechanism) this.mechanism.reserve = hours;
  }

  /** Takes the pallet fork out (a ghost marks where it was) so the train runs away, or puts it back. */
  setLoose(on: boolean): void {
    if (!this.mechanism || !this.looks || !this.thing) return;
    const fork = this.thing.motion?.find((m) => m.swing === 'pallet')?.node;
    this.mechanism.setLoose(on);
    this.looks.setRemoved(on && fork ? this.meshesNamed([fork]) : new Set());
    this.lookChanged();
  }

  /** Called on every tick of the escapement and every click of the ratchet while winding, and as a shutter's curtains
   *  set off and stop (for sound). */
  setSounds(sounds: { beat?: (beat: number) => void; click?: () => void; shutter?: (curtain: 0 | 1, event: 'start' | 'stop') => void } | null): void {
    if (this.cameraBody instanceof FilmCamera) {
      this.cameraBody.onShutter = sounds?.shutter;
      this.cameraBody.onRatchet = sounds?.click;
    } else if (this.cameraBody) {
      const shutter = sounds?.shutter;
      // The mirror's slap, the leaf shutter's snick and the flaps closing, in the cloth shutter's voices.
      this.cameraBody.onEvent = shutter && ((event) => (event === 'slap' ? shutter(0, 'stop') : event === 'fire' ? shutter(0, 'start') : event === 'flaps' ? shutter(1, 'stop') : undefined));
      this.cameraBody.onRatchet = sounds?.click;
    }
    if (!this.mechanism) return;
    this.mechanism.onBeat = sounds?.beat;
    this.mechanism.onClick = sounds?.click;
  }

  /** How far a part has turned, in radians, for a dial that follows it. */
  angleOf(name: string): number {
    const node = this.root?.getObjectByName(name);
    return (node && this.rigs.find(node)?.angle) || 0;
  }

  /** Line drawings of the assembled model, seen straight on from the front, the side and the top, as a draughtsman
   *  would draw them: outlines and edges in ink, hidden edges faint. Rendered off screen at `pixelsPerMetre`. */
  async drawings(pixelsPerMetre: number): Promise<Drawing[]> {
    if (!this.looks || !this.root || this.disposed) return [];
    const box = this.assembledBox;
    const centre = box.getCenter(new Vector3());
    const size = box.getSize(new Vector3());
    // One scale and one margin for every view, so they line up.
    const margin = 0.05 * Math.max(size.x, size.y, size.z);
    const pixelsPerUnit = Math.min(pixelsPerMetre * this.metresPerUnit, 2400 / (Math.max(size.x, size.y, size.z) + margin * 2));
    const views = [
      { view: 'front' as const, from: new Vector3(0, 0, 1), up: new Vector3(0, 1, 0), across: size.x, tall: size.y },
      { view: 'side' as const, from: new Vector3(1, 0, 0), up: new Vector3(0, 1, 0), across: size.z, tall: size.y },
      { view: 'top' as const, from: new Vector3(0, 1, 0), up: new Vector3(0, 0, -1), across: size.x, tall: size.z },
    ];
    const shots = views.map(({ from, up, across, tall }) => {
      const w = across + margin * 2;
      const h = tall + margin * 2;
      const camera = new OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.01, 20);
      camera.up.copy(up);
      camera.position.copy(centre).addScaledVector(from, 6);
      camera.lookAt(centre);
      camera.layers.enable(OVERLAY_LAYER);
      camera.updateMatrixWorld(true);
      return { camera, width: Math.max(1, Math.round(w * pixelsPerUnit)), height: Math.max(1, Math.round(h * pixelsPerUnit)) };
    });
    const urls = await this.renderAsLines(shots);
    return views.flatMap(({ view, across, tall }, i) =>
      urls[i] ? [{ view, url: urls[i]!, across: across * this.metresPerUnit, tall: tall * this.metresPerUnit, margin: margin * this.metresPerUnit }] : [],
    );
  }

  /** Renders the assembled model as lines (no shadow, no paths) through each camera into a transparent PNG. */
  private async renderAsLines(shots: { camera: OrthographicCamera | PerspectiveCamera; width: number; height: number }[]): Promise<(string | null)[]> {
    const looks = this.looks!;
    const look = looks.mode;
    const explode = this.explodeValue;
    const resolution = looks.resolution.clone();
    const focus = looks.focused;
    if (explode) this.arrange(0);
    looks.setFocus(null);
    looks.setMode('wireframe');
    const hidden = [this.shadow.group, ...this.flows.map((flow) => flow.group)];
    const visible = hidden.map((object) => object.visible);
    for (const object of hidden) object.visible = false;
    this.scene.updateMatrixWorld(true);
    const previousTarget = this.renderer.getRenderTarget();
    const clear = this.renderer.getClearAlpha();
    const canvases: HTMLCanvasElement[] = [];
    for (const { camera, width, height } of shots) {
      const target = new WebGLRenderTarget(width, height, { samples: 4 });
      looks.resolution.set(width, height);
      this.renderer.setRenderTarget(target);
      this.renderer.setClearAlpha(0);
      this.renderer.clear();
      this.renderer.render(this.scene, camera);
      const pixels = new Uint8Array(width * height * 4);
      this.renderer.readRenderTargetPixels(target, 0, 0, width, height, pixels);
      target.dispose();
      // WebGL rows run bottom to top.
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const image = new ImageData(width, height);
      const row = width * 4;
      for (let y = 0; y < height; y++) image.data.set(pixels.subarray((height - 1 - y) * row, (height - y) * row), y * row);
      canvas.getContext('2d')!.putImageData(image, 0, 0);
      canvases.push(canvas);
    }
    this.renderer.setRenderTarget(previousTarget);
    this.renderer.setClearAlpha(clear);
    looks.resolution.copy(resolution);
    hidden.forEach((object, i) => (object.visible = visible[i]));
    looks.setMode(look);
    looks.setFocus(focus);
    if (explode) this.arrange(explode);
    this.lookChanged();
    return Promise.all(canvases.map((canvas) => new Promise<string | null>((resolve) => canvas.toBlob((blob) => resolve(blob ? URL.createObjectURL(blob) : null), 'image/png'))));
  }

  /** Runs on every frame (after the mechanism moves, before drawing), until the returned function is called. */
  onFrame(listener: (dt: number) => void): () => void {
    this.frameListeners.add(listener);
    return () => this.frameListeners.delete(listener);
  }

  // ------------------------------------------------------------- highlights

  highlightPart(index: number | null): void {
    index ??= this.cardPart;
    if (index === this.highlightedPart) return;
    this.highlightedPart = index;
    for (const [mesh, part] of this.partByMesh) {
      // The materials it has when solid, so a part that's a ghost or lines just now still comes back right.
      const materials = this.looks ? this.looks.solidMaterials(mesh as Mesh) : ([] as Material[]).concat((mesh as Mesh).material);
      for (const material of materials as MeshStandardMaterial[]) {
        if (!material.emissive) continue;
        let rest = this.restEmissive.get(material);
        if (!rest) this.restEmissive.set(material, (rest = { color: material.emissive.clone(), intensity: material.emissiveIntensity }));
        material.emissive.copy(part === index ? HIGHLIGHT : rest.color);
        material.emissiveIntensity = part === index ? 0.45 : rest.intensity;
      }
    }
    this.badges?.setHighlighted(index);
    this.looks?.highlight(index);
    this.dirty = true;
  }

  private onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || event.buttons !== 0) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    this.tooltip.style.translate = `${event.clientX - rect.left}px ${event.clientY - rect.top}px`;
    this.hoverDue = true;
  };

  private onPointerLeave = () => this.setHover(null);

  private onPointerDown = (event: PointerEvent) => {
    this.press = event.button === 0 ? { x: event.clientX, y: event.clientY, time: performance.now() } : null;
  };

  /** A press and release in place (not a drag) picks whatever part is under it. */
  private onPointerUp = (event: PointerEvent) => {
    const press = this.press;
    this.press = null;
    if (!press || Math.hypot(event.clientX - press.x, event.clientY - press.y) > 5 || performance.now() - press.time > 500) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.raycaster.setFromCamera(new Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1), this.camera);
    const hit = this.raycaster.intersectObjects(this.pickable, false)[0];
    const part = hit ? (this.partByMesh.get(hit.object) ?? null) : null;
    this.picked = part === null ? null : { part, point: hit!.point };
    this.options.onPick?.(part);
    this.picked = null;
    // The card answers what the tooltip was asking: it stays away until the pointer moves on to another part.
    this.quietPart = part;
    this.tooltip.classList.remove('is-visible');
  };

  private updateHover(): void {
    this.hoverDue = false;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObjects(this.pickable, false)[0];
    this.setHover(hit ? (this.partByMesh.get(hit.object) ?? null) : null);
  }

  private setHover(index: number | null): void {
    if (index === this.hoveredPart) return;
    this.hoveredPart = index;
    if (index !== null && index !== this.quietPart) this.quietPart = null;
    const label = index === null ? '' : (this.thing?.parts[index]?.label ?? '');
    this.tooltip.textContent = label;
    this.tooltip.classList.toggle('is-visible', !!label && index !== this.quietPart);
    this.container.style.cursor = label ? 'pointer' : '';
    this.highlightPart(index);
    this.options.onHoverPart?.(index);
  }

  // -------------------------------------------------- authoring (dev console)

  /** Where a ray coming from `from` (a direction) first hits the named node, aimed at its centre or `aim`. */
  probe(name: string, from: CameraPose['position'], aim?: CameraPose['position']): CameraPose['position'] | null {
    const node = this.root?.getObjectByName(name);
    if (!node) return null;
    const target = aim ? new Vector3(...aim) : new Box3().setFromObject(node, true).getCenter(new Vector3());
    const direction = new Vector3(...from).normalize();
    const meshes: Mesh[] = [];
    node.traverse((object) => (object as Mesh).isMesh && meshes.push(object as Mesh));
    const ray = new Raycaster(target.clone().addScaledVector(direction, 6), direction.negate(), 0, 12);
    ray.firstHitOnly = true;
    const hit = ray.intersectObjects(meshes, false)[0];
    return hit ? (hit.point.toArray().map((v) => +v.toFixed(3)) as CameraPose['position']) : null;
  }

  /** What's under a point on the canvas (CSS pixels): node name and model-space position. */
  pick(x: number, y: number): { node: string; position: CameraPose['position'] } | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.raycaster.setFromCamera(new Vector2((x / rect.width) * 2 - 1, -(y / rect.height) * 2 + 1), this.camera);
    const hit = this.raycaster.intersectObjects(this.pickable, false)[0];
    return hit ? { node: hit.object.name, position: hit.point.toArray().map((v) => +v.toFixed(3)) as CameraPose['position'] } : null;
  }

  // ------------------------------------------------------------------- loop

  private tween(kind: string, duration: number, step: (t: number) => void): Promise<void> {
    this.cancel(kind);
    if (duration <= 0 || this.disposed) {
      step(1);
      this.dirty = true;
      return Promise.resolve();
    }
    return new Promise((done) => {
      this.tweens.push({ kind, start: performance.now(), duration, step, done });
      this.container.toggleAttribute('data-moving', true);
    });
  }

  private cancel(kind: string): void {
    this.tweens = this.tweens.filter((tween) => {
      if (tween.kind !== kind) return true;
      tween.done();
      return false;
    });
  }

  private loop = (now: number) => {
    this.frame = requestAnimationFrame(this.loop);
    const dt = Math.min(0.1, (now - this.lastFrame) / 1000);
    this.lastFrame = now;

    if (this.tweens.length) {
      for (const tween of [...this.tweens]) {
        const t = clamp01((now - tween.start) / tween.duration);
        tween.step(t);
        if (t >= 1) {
          this.tweens.splice(this.tweens.indexOf(tween), 1);
          tween.done();
        }
      }
      this.dirty = true;
    }
    // Marked on the page while a move is under way, so a check of a built copy (no __viewer) can wait it out.
    const moving = this.tweens.length > 0;
    if (this.container.hasAttribute('data-moving') !== moving) this.container.toggleAttribute('data-moving', moving);
    // The mechanism's own time, which a paused film stops.
    const live = dt * this.timeScale;
    const turned = !!this.mechanism?.tick(live, this.now(), this.explodeValue > 0 || !!this.looks?.seeThrough);
    if (this.tickModules(live)) this.dirty = true;
    if (this.linkage?.apply() || turned) {
      this.rigs.apply();
      // A path pinned to a crank goes round with it.
      for (const flow of this.flows) if (flow.rides) flow.update();
      this.shadowDirty = this.dirty = true;
    }
    for (const flow of this.flows) if (flow.tick(dt, this.options.reducedMotion)) this.dirty = true;
    for (const listener of this.frameListeners) listener(dt);
    const cameraMoved = this.controls.update(dt);
    if (cameraMoved || this.dirty) this.occlusionDue = this.occlusionDue || now + 90;
    if (this.hoverDue) this.updateHover();

    if (cameraMoved || this.dirty) this.render();
    if (this.occlusionDue && now >= this.occlusionDue && this.hotspots) {
      this.occlusionDue = 0;
      this.hotspots.updateOcclusion(this.camera, this.pickable);
      this.badges?.updateOcclusion(this.camera, this.pickable);
    }
  };

  /** Moves the mechanisms' controls on by `dt` seconds (a camera's, a car's, an arm's, a lock's, a tape's, an
   *  extinguisher's); true if anything drawn changed beyond their controls. */
  private tickModules(dt: number): boolean {
    let moved = false;
    this.cameraBody?.tick(dt);
    this.lock?.tick(dt);
    if (this.aero && this.tickAero(dt)) moved = true;
    if (this.arm) {
      this.arm.tick(dt);
      const { springs } = this.arm.state;
      for (const spring of this.springs) if (spring.apply(springs[spring.layout.arm as 'lower' | 'upper'].length)) this.shadowDirty = moved = true;
    }
    this.tape?.tick(dt);
    if (this.extinguisher?.tick(dt)) moved = true;
    return moved;
  }

  /** Runs the mechanisms' controls on by `seconds` at once, in small steps, without drawing: a film seeking to a
   *  moment plays everything before it this way. (Spinning parts and clockwork aren't run: they keep their place.) */
  simulate(seconds: number): void {
    for (let left = seconds; left > 1e-6; left -= 1 / 60) this.tickModules(Math.min(1 / 60, left));
    // The parts go where the controls now put them, at once, so they can be measured.
    if (this.linkage?.apply()) {
      this.rigs.apply();
      for (const flow of this.flows) if (flow.rides) flow.update();
    }
    this.root?.updateMatrixWorld(true);
    this.shadowDirty = this.dirty = true;
  }

  /** Puts every mechanism back to rest: the keys, the arm, the tape, the extinguisher, the car, the watch's crown and fork, a camera. */
  resetMechanisms(): void {
    this.setLoose(false);
    this.hold(false);
    this.wind(false);
    this.cameraBody?.reset();
    this.aero?.reset();
    if (this.arm) {
      this.hookSprings(true);
      this.arm.reset(true);
    }
    this.lock?.reset();
    this.tape?.reset();
    this.extinguisher?.reset();
    this.typewriter?.reset();
    this.dirty = true;
  }

  /** Stops drawing while the model is out of sight (the skill page's live watch), and picks up where it was. */
  setPaused(paused: boolean): void {
    if (this.disposed || paused === (this.frame === 0)) return;
    if (paused) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      return;
    }
    this.lastFrame = performance.now();
    this.frame = requestAnimationFrame(this.loop);
  }

  render(): void {
    if (this.shadowDirty) {
      this.shadow.render(this.renderer, this.scene);
      this.shadowDirty = false;
    }
    this.renderer.render(this.scene, this.camera);
    this.labels.render(this.scene, this.camera);
    this.tags.clip(this.camera, this.hostRect, this.host === this.container ? null : this.frameRect);
    this.card.place(this.camera, this.hostRect, this.frameRect);
    this.dirty = false;
    this.reportScale();
  }

  /** Tells the page the drawing's scale when it changes (a zoom, a camera flight, a resize). */
  private reportScale(): void {
    if (!this.options.onScale || !this.metresPerUnit) return;
    const distance = this.camera.position.distanceTo(this.controls.target);
    const pixelsPerUnit = this.frameRect.height / (2 * distance * Math.tan(MathUtils.degToRad(FOV / 2)));
    const pixelsPerMetre = pixelsPerUnit / this.metresPerUnit;
    if (Math.abs(pixelsPerMetre - this.pixelsPerMetre) <= this.pixelsPerMetre * 0.002) return;
    this.pixelsPerMetre = pixelsPerMetre;
    this.options.onScale(pixelsPerMetre);
  }

  /** Matches the drawing area to the host and the framing to the frame (call after moving the host). */
  relayout(): void {
    const frameElement = this.options.frame ?? this.container;
    const host = this.host.getBoundingClientRect();
    const frame = frameElement.getBoundingClientRect();
    if (!host.width || !host.height || !frame.width || !frame.height) return;
    this.hostRect = host;
    this.frameRect = frame;
    this.readHome(frameElement);
    if (this.composed) this.shift.copy(this.shiftTarget);
    this.renderer.setSize(host.width, host.height);
    this.renderer.getDrawingBufferSize(this.looks?.resolution ?? new Vector2());
    // Over the side panel the model may spill, but the step's lines don't run across its text.
    const clip = this.host === this.container || frame.right >= host.right - 1 ? null : (frame.right - host.left) * this.renderer.getPixelRatio();
    for (const flow of this.flows) flow.setClip(clip);
    this.flowClip = clip;
    this.labels.setSize(host.width, host.height);
    this.project();
    if (this.host !== this.container) {
      // The pointer surface covers the canvas's box (clipped by the stage), so controls and picking agree with what's drawn.
      const origin = (this.container.offsetParent ?? document.body).getBoundingClientRect();
      Object.assign(this.container.style, {
        left: `${host.left - origin.left}px`,
        top: `${host.top - origin.top}px`,
        width: `${host.width}px`,
        height: `${host.height}px`,
        right: 'auto',
        bottom: 'auto',
      });
    }
  }

  /** Where the frame's CSS puts the model in the home view (see `ViewerOptions.frame`). */
  private readHome(frame: HTMLElement): void {
    const style = getComputedStyle(frame);
    const read = (name: string, fallback: number) => {
      const value = parseFloat(style.getPropertyValue(name));
      return Number.isFinite(value) ? value : fallback;
    };
    // `--home-clear` (a length) keeps that much of the frame clear on each side of the model at rest, for what's printed there.
    const clear = read('--home-clear', 0);
    const share = clear > 0 ? Math.max(0.3, 1 - (2 * clear) / (frame.offsetWidth || 1)) : 1;
    this.home = { x: read('--home-x', 0), y: read('--home-y', 0), fill: read('--home-fill', HOME_FILL), width: Math.min(read('--home-width', 1), share) };
  }

  /** Frames the model in the frame, moved off its centre by the current shift, and draws the part
   *  of that view the host covers: with a host bigger than the frame, the view carries on past the frame's edges. */
  private project(): void {
    const { hostRect: host, frameRect: frame } = this;
    this.camera.aspect = frame.width / frame.height;
    if (this.host === this.container && !this.shift.x && !this.shift.y) {
      this.camera.clearViewOffset();
    } else {
      const x = host.left - frame.left - this.shift.x * frame.width;
      const y = host.top - frame.top - this.shift.y * frame.height;
      this.camera.setViewOffset(frame.width, frame.height, x, y, host.width, host.height);
    }
    this.camera.updateProjectionMatrix();
    this.dirty = true;
  }

  private resize(): void {
    this.relayout();
  }

  /** Renders now and encodes the canvas (used by the poster capture page). */
  snapshot(type = 'image/webp', quality = 0.9): Promise<Blob> {
    this.render();
    return new Promise((resolve, reject) =>
      this.renderer.domElement.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), type, quality),
    );
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.tweens.forEach((tween) => tween.done());
    this.tweens = [];
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.container.removeEventListener('pointermove', this.onPointerMove);
    this.container.removeEventListener('pointerleave', this.onPointerLeave);
    this.container.removeEventListener('pointerdown', this.onPointerDown);
    this.container.removeEventListener('pointerup', this.onPointerUp);
    this.card.hide();
    this.hotspots?.dispose();
    this.badges?.dispose();
    this.tags.clear();
    for (const flow of this.flows) flow.dispose();
    this.jets?.dispose();
    this.looks?.dispose();
    this.frameListeners.clear();
    this.shadow.dispose();
    this.scene.traverse((object) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.disposeBoundsTree?.();
      mesh.geometry.dispose();
      for (const material of ([] as Material[]).concat(mesh.material)) {
        for (const value of Object.values(material)) if (value?.isTexture) value.dispose();
        material.dispose();
      }
    });
    this.scene.environment?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
    this.labels.domElement.remove();
    this.tooltip.remove();
    for (const key of ['left', 'top', 'width', 'height', 'right', 'bottom', 'cursor'] as const) this.container.style[key] = '';
  }
}
