import * as THREE from 'three'
import { toneColor } from '../field.js'

/**
 * aurora — a custom Layer: one shader plane of slow, flowing fbm noise tinted
 * with the `structure` and `signal` tones. The example to copy when a scene
 * needs something other than points and lines (meshes, shaders, textures).
 *
 * A Layer is any object with:
 *   group (THREE.Object3D), extentX, extentY, opacity,
 *   setOpacity(v), update(t, dt, still), setScale(px), snap(), dispose()
 *
 *   step 0  faint
 *   step 1  fuller
 *   step 2+ brightest, leaning toward `signal`
 */

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uIntensity;
  uniform float uMix;
  uniform vec3 uA;
  uniform vec3 uB;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 p = vUv * vec2(3.2, 1.8);
    float t = uTime * 0.05;
    float n = fbm(p + vec2(t, -t * 0.6) + fbm(p * 1.3 - t) * 0.9);
    float band = smoothstep(0.38, 0.78, n);
    vec3 col = mix(uA, uB, smoothstep(0.62 - uMix * 0.2, 0.9, n));
    // Feather every edge so the plane never shows its rectangle.
    vec2 e = smoothstep(vec2(0.0), vec2(0.3), vUv) * smoothstep(vec2(0.0), vec2(0.3), 1.0 - vUv);
    gl_FragColor = vec4(col, band * e.x * e.y * uIntensity * uOpacity);
  }
`

const LEVELS = [
  { intensity: 0.45, mix: 0 },
  { intensity: 0.7, mix: 0.4 },
  { intensity: 0.95, mix: 1 },
]

class AuroraLayer {
  constructor() {
    this.extentX = 6
    this.extentY = 3.4
    this.opacity = 0
    this.target = LEVELS[0]
    this.intensity = this.target.intensity
    this.mix = this.target.mix

    this.uniforms = {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uIntensity: { value: this.intensity },
      uMix: { value: this.mix },
      uA: { value: new THREE.Color() },
      uB: { value: new THREE.Color() },
    }
    this.geo = new THREE.PlaneGeometry(this.extentX * 2, this.extentY * 2)
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    })
    this.group = new THREE.Group()
    this.group.add(new THREE.Mesh(this.geo, this.mat))
    this.group.visible = false
    this._a = new THREE.Color()
    this._b = new THREE.Color()
    this.snap()
  }

  update(t, dt, still) {
    const k = still ? 1 : Math.min(1, dt * 2.4)
    if (!still) this.uniforms.uTime.value = t
    this.intensity += (this.target.intensity - this.intensity) * k
    this.mix += (this.target.mix - this.mix) * k
    this.uniforms.uIntensity.value = this.intensity
    this.uniforms.uMix.value = this.mix
    // Ease toward the palette so a theme switch fades instead of popping.
    this.uniforms.uA.value.lerp(toneColor('structure', this._a), k)
    this.uniforms.uB.value.lerp(toneColor('signal', this._b), k)
  }

  snap() {
    toneColor('structure', this.uniforms.uA.value)
    toneColor('signal', this.uniforms.uB.value)
    this.intensity = this.target.intensity
    this.mix = this.target.mix
  }

  setOpacity(v) {
    this.opacity = v
    this.uniforms.uOpacity.value = v
    this.group.visible = v > 0.001
  }

  setScale() {}

  dispose() {
    this.geo.dispose()
    this.mat.dispose()
  }
}

export default {
  camera: { z: 12 },
  layer() {
    return { layer: new AuroraLayer(), meta: {} }
  },
  step(layer, meta, n) {
    layer.target = LEVELS[Math.min(n, LEVELS.length - 1)]
  },
}
