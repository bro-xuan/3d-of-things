import { CylinderGeometry, DoubleSide, Group, Mesh, NormalBlending, Object3D, PlaneGeometry, ShaderMaterial, Vector3, type Color } from 'three';
import type { Jet } from '../types';
import type { AeroState } from './aerocar';
import { OVERLAY_LAYER } from './looks';

/** The nozzles' exits, m. */
const EXIT = 0.052;
/** A jet at full blast, m, before it's spread into the air. */
const REACH = { rear: 2.0, lift: 1.4, yaw: 1.0 };

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vUv = uv;
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    vView = -view.xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * view;
  }`;

// A jet: brightest down its middle, streaked as it rushes out, with the bright bands (shock diamonds) of a jet faster
// than sound near the nozzle, fading as it spreads. Ink-blue on the page's paper, where white would vanish.
const FRAGMENT = /* glsl */ `
  uniform float time;
  uniform float level;
  uniform vec3 core;
  uniform vec3 edge;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  void main() {
    float along = vUv.y;
    float facing = abs(dot(normalize(vNormal), normalize(vView)));
    float body = pow(facing, 1.4);
    float streak = noise(vec2(vUv.x * 9.0, along * 7.0 - time * 11.0)) * 0.6 + noise(vec2(vUv.x * 23.0, along * 15.0 - time * 19.0)) * 0.4;
    float diamonds = 0.5 + 0.5 * cos(along * 46.0 - time * 1.5);
    diamonds *= exp(-along * 7.0);
    float fade = pow(1.0 - along, 1.5) * smoothstep(0.0, 0.03, along);
    float alpha = level * fade * (0.4 + 0.6 * body) * (0.5 + 0.5 * streak) * 1.1 + level * diamonds * body * 0.45;
    vec3 colour = mix(core, edge, smoothstep(0.0, 1.0, along + (1.0 - facing) * 0.6));
    gl_FragColor = vec4(colour, clamp(alpha, 0.0, 0.9));
  }`;

// Where a lift jet hits the ground: a ring of cloud spreading out from under the nozzle.
const CLOUD = /* glsl */ `
  uniform float time;
  uniform float level;
  uniform vec3 edge;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float a = atan(p.y, p.x);
    float puff = noise(vec2(a * 3.0, r * 6.0 - time * 3.0)) * 0.6 + noise(vec2(a * 7.0, r * 11.0 - time * 5.0)) * 0.4;
    float ring = smoothstep(1.0, 0.55, r) * smoothstep(0.0, 0.35, r);
    gl_FragColor = vec4(edge, clamp(level * ring * (0.35 + 0.65 * puff) * 0.6, 0.0, 0.8));
  }`;

const material = (fragment: string, core: Color | null, edge: Color) =>
  new ShaderMaterial({
    uniforms: { time: { value: 0 }, level: { value: 0 }, core: { value: core }, edge: { value: edge } },
    vertexShader: VERTEX,
    fragmentShader: fragment,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: NormalBlending,
  });

interface Plume {
  jet: Jet;
  /** Which of its group's nozzles it is. */
  index: number;
  mesh: Mesh<CylinderGeometry, ShaderMaterial>;
  cloud: Mesh<PlaneGeometry, ShaderMaterial> | null;
  level: number;
}

/**
 * The jets out of a car's cold-gas nozzles: a cone of air from each nozzle while it fires, streaked as it rushes out
 * and fading as it spreads, and under the lift nozzles a cloud where the jets hit the ground. On the overlay layer, so
 * they cast no shadow and can't be picked; each rides with its nozzle (as the model comes apart, or flies).
 */
export class Jets {
  private readonly plumes: Plume[] = [];
  private time = 0;
  private readonly _v = new Vector3();

  constructor(
    jets: Jet[],
    pin: (jet: Jet) => Object3D,
    /** The ground's frame (model space), for the clouds. */
    private readonly ground: Object3D,
    /** Model units per metre. */
    private readonly scale: number,
    colours: { core: Color; edge: Color },
  ) {
    const counts = { rear: 0, lift: 0, yaw: 0 };
    for (const jet of jets) {
      const anchor = pin(jet);
      const group = new Group();
      group.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(...jet.dir).normalize());
      anchor.add(group);
      // The cone's narrow end at the nozzle's exit, widening along the jet.
      const cone = new CylinderGeometry(EXIT * 3.4 * scale, EXIT * 0.92 * scale, 1, 28, 12, true);
      cone.translate(0, 0.5, 0);
      const mesh = new Mesh(cone, material(FRAGMENT, colours.core, colours.edge));
      mesh.layers.set(OVERLAY_LAYER);
      mesh.renderOrder = 4;
      mesh.visible = false;
      mesh.frustumCulled = false;
      group.add(mesh);
      let cloud: Plume['cloud'] = null;
      if (jet.group === 'lift') {
        cloud = new Mesh(new PlaneGeometry(1, 1).rotateX(-Math.PI / 2), material(CLOUD, null, colours.edge));
        cloud.layers.set(OVERLAY_LAYER);
        cloud.renderOrder = 3;
        cloud.visible = false;
        ground.add(cloud);
      }
      this.plumes.push({ jet, index: counts[jet.group]++, mesh, cloud, level: 0 });
    }
  }

  /** Follows the nozzles' throttles; returns whether any jet is showing. */
  update(state: AeroState | null, height: number, dt: number): boolean {
    this.time += dt;
    let showing = false;
    for (const p of this.plumes) {
      const target = !state ? 0 : p.jet.group === 'rear' ? state.rear : p.jet.group === 'lift' ? state.lift[p.index] ?? 0 : state.yaw[p.index] ?? 0;
      // A jet starts at once and dies away over a moment.
      p.level = target > p.level ? target : Math.max(target, p.level - dt / 0.12);
      const on = p.level > 0.01;
      p.mesh.visible = on;
      if (on) {
        showing = true;
        const flicker = 1 + 0.04 * Math.sin(this.time * 61 + p.index * 2.1);
        p.mesh.scale.set(1 + 0.25 * p.level, REACH[p.jet.group] * this.scale * (0.35 + 0.65 * p.level) * flicker, 1 + 0.25 * p.level);
        const u = p.mesh.material.uniforms;
        u.time.value = this.time + p.index * 0.37;
        u.level.value = Math.min(1, 0.35 + 0.65 * p.level);
      }
      if (p.cloud) {
        // A cloud on the ground under the nozzle, spreading as the jet reaches down to it.
        const reach = REACH.lift * (0.35 + 0.65 * p.level);
        const strength = on ? p.level * Math.max(0, 1 - height / reach) : 0;
        p.cloud.visible = strength > 0.01;
        if (p.cloud.visible) {
          p.mesh.getWorldPosition(this._v);
          this.ground.worldToLocal(this._v);
          p.cloud.position.set(this._v.x, 0.002, this._v.z);
          const size = (0.9 + 1.4 * (height / reach) + 0.6 * p.level) * this.scale;
          p.cloud.scale.set(size, 1, size);
          p.cloud.material.uniforms.time.value = this.time;
          p.cloud.material.uniforms.level.value = strength;
        }
      }
    }
    return showing;
  }

  dispose(): void {
    for (const p of this.plumes) {
      p.mesh.removeFromParent();
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
      p.cloud?.removeFromParent();
      p.cloud?.geometry.dispose();
      p.cloud?.material.dispose();
    }
    this.plumes.length = 0;
  }
}
