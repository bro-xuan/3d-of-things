import {
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshDepthMaterial,
  OrthographicCamera,
  PlaneGeometry,
  ShaderMaterial,
  WebGLRenderTarget,
  type Scene,
  type WebGLRenderer,
} from 'three';
import { HorizontalBlurShader } from 'three/addons/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/addons/shaders/VerticalBlurShader.js';

interface ContactShadowOptions {
  /** Width of the shadow plane, in model units. */
  size?: number;
  /** Parts higher than this above the ground cast no shadow. */
  height?: number;
  resolution?: number;
  opacity?: number;
  darkness?: number;
  blur?: number;
}

/**
 * A soft shadow on the ground, after three.js' contact-shadow example: render
 * the model's depth from below, blur it twice, and lay it on a plane. It only
 * depends on where the parts are, so the viewer re-renders it when they move
 * rather than every frame.
 */
export class ContactShadow {
  readonly group = new Group();
  private readonly target: WebGLRenderTarget;
  private readonly blurTarget: WebGLRenderTarget;
  private readonly plane: Mesh<PlaneGeometry, MeshBasicMaterial>;
  private readonly blurPlane: Mesh<PlaneGeometry, ShaderMaterial>;
  private readonly camera: OrthographicCamera;
  private readonly depthMaterial = new MeshDepthMaterial();
  private readonly horizontalBlur = new ShaderMaterial(HorizontalBlurShader);
  private readonly verticalBlur = new ShaderMaterial(VerticalBlurShader);
  private readonly blur: number;
  private readonly opacity: number;

  constructor({ size = 4, height = 0.7, resolution = 512, opacity = 0.62, darkness = 1.4, blur = 2.6 }: ContactShadowOptions = {}) {
    this.blur = blur;
    this.opacity = opacity;
    this.target = new WebGLRenderTarget(resolution, resolution);
    this.blurTarget = new WebGLRenderTarget(resolution, resolution);
    this.target.texture.generateMipmaps = this.blurTarget.texture.generateMipmaps = false;

    const geometry = new PlaneGeometry(size, size).rotateX(Math.PI / 2);
    this.plane = new Mesh(
      geometry,
      new MeshBasicMaterial({ map: this.target.texture, opacity, transparent: true, depthWrite: false, toneMapped: false }),
    );
    this.plane.renderOrder = 1;
    this.plane.scale.y = -1; // the render target comes out upside down
    this.blurPlane = new Mesh(geometry, this.horizontalBlur);
    this.blurPlane.visible = false;

    this.camera = new OrthographicCamera(-size / 2, size / 2, size / 2, -size / 2, 0, height);
    this.camera.rotation.x = Math.PI / 2; // look up from the ground
    this.group.add(this.plane, this.blurPlane, this.camera);
    this.group.position.y = 0.0005;

    const darknessUniform = { value: darkness };
    this.depthMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.darkness = darknessUniform;
      shader.fragmentShader = `uniform float darkness;\n${shader.fragmentShader.replace(
        'gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );',
        'gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * darkness );',
      )}`;
    };
    this.depthMaterial.depthTest = this.depthMaterial.depthWrite = false;
    this.horizontalBlur.depthTest = this.verticalBlur.depthTest = false;
  }

  /** Lightens the shadow (0–1 of its full strength), for views where a heavy one would get in the way. */
  setStrength(strength: number): void {
    this.plane.material.opacity = this.opacity * strength;
  }

  render(renderer: WebGLRenderer, scene: Scene): void {
    const { background, overrideMaterial } = scene;
    const clearAlpha = renderer.getClearAlpha();
    const previousTarget = renderer.getRenderTarget();

    scene.background = null;
    scene.overrideMaterial = this.depthMaterial;
    this.plane.visible = false;
    renderer.setClearAlpha(0);
    renderer.setRenderTarget(this.target);
    renderer.render(scene, this.camera);
    scene.overrideMaterial = overrideMaterial;

    this.blurPass(renderer, this.blur);
    this.blurPass(renderer, this.blur * 0.4); // a second, finer pass hides the box-blur artefacts

    renderer.setRenderTarget(previousTarget);
    renderer.setClearAlpha(clearAlpha);
    scene.background = background;
    this.plane.visible = true;
  }

  private blurPass(renderer: WebGLRenderer, amount: number): void {
    const texel = amount / this.target.width;
    this.blurPlane.visible = true;

    this.blurPlane.material = this.horizontalBlur;
    this.horizontalBlur.uniforms.tDiffuse.value = this.target.texture;
    this.horizontalBlur.uniforms.h.value = texel;
    renderer.setRenderTarget(this.blurTarget);
    renderer.render(this.blurPlane, this.camera);

    this.blurPlane.material = this.verticalBlur;
    this.verticalBlur.uniforms.tDiffuse.value = this.blurTarget.texture;
    this.verticalBlur.uniforms.v.value = texel;
    renderer.setRenderTarget(this.target);
    renderer.render(this.blurPlane, this.camera);

    this.blurPlane.visible = false;
  }

  dispose(): void {
    this.target.dispose();
    this.blurTarget.dispose();
    this.plane.geometry.dispose();
    this.plane.material.dispose();
    this.depthMaterial.dispose();
    this.horizontalBlur.dispose();
    this.verticalBlur.dispose();
  }
}
