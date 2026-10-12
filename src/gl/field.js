import * as THREE from 'three'

/**
 * Field — the default renderer for scenes: points + line segments.
 *
 * Every field scene is this same object with a different set of nodes and
 * edges. Each node and edge stores a *tone name* target and an alpha target;
 * the frame loop lerps the drawn color toward the current palette value of that
 * tone. That indirection is what makes themes work: switching light/dark only
 * rewrites PALETTE, and every scene eases into the new colors on its own.
 *
 * No bloom, no postprocessing: thin lines and small dots.
 */

/* -- palette ---------------------------------------------------------------- */

/**
 * Tone names, in palette order. Each one is read from the CSS custom property
 * `--gl-<name>` (see src/styles/tokens.css), so the WebGL layer and the HTML
 * layer always resolve to the same pixels in both themes.
 *
 * To add a tone: append its name here and define `--gl-<name>` for both themes.
 */
export const TONES = ['off', 'dim', 'structure', 'signal', 'bright']
const TONE_INDEX = Object.fromEntries(TONES.map((n, i) => [n, i]))
const toneIdx = (name, fallback) => TONE_INDEX[name] ?? TONE_INDEX[fallback] ?? 0

/** Linear RGB triples, TONES.length × 3. Shared by every field. */
export const PALETTE = new Float32Array(TONES.length * 3)

/**
 * These are raw ShaderMaterials, so three's automatic linear→sRGB output
 * conversion never runs on them. Parsing with SRGBColorSpace would convert to
 * linear on the way in and never convert back, which darkens every tone to
 * near-black. LinearSRGBColorSpace keeps the authored value intact.
 */
const parse = (css) => new THREE.Color().setStyle(css, THREE.LinearSRGBColorSpace)

/** Write a palette from `{ toneName: cssColor }`. Unknown names are ignored. */
export function setPalette(map) {
  for (const [name, css] of Object.entries(map)) {
    const i = TONE_INDEX[name]
    if (i == null || !css) continue
    const c = parse(css)
    PALETTE[i * 3] = c.r
    PALETTE[i * 3 + 1] = c.g
    PALETTE[i * 3 + 2] = c.b
  }
}

/** A palette tone as a THREE.Color — for custom layers that need a uniform. */
export function toneColor(name, target = new THREE.Color()) {
  const i = toneIdx(name, 'dim')
  return target.setRGB(PALETTE[i * 3], PALETTE[i * 3 + 1], PALETTE[i * 3 + 2])
}

/* -- shaders ---------------------------------------------------------------- */

const POINT_VERT = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aAlpha;
  uniform float uScale;
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float dist = max(-mv.z, 0.001);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uScale / dist;
    // Depth fade: far nodes recede instead of crowding the frame.
    float fade = 1.0 - smoothstep(9.0, 36.0, dist) * 0.55;
    vAlpha = aAlpha * uOpacity * fade;
  }
`

const POINT_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = dot(c, c);
    if (d > 0.25) discard;
    float edge = smoothstep(0.25, 0.14, d);
    gl_FragColor = vec4(vColor, vAlpha * edge);
  }
`

const LINE_VERT = /* glsl */ `
  attribute vec3 aColor;
  attribute float aAlpha;
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = max(-mv.z, 0.001);
    float fade = 1.0 - smoothstep(9.0, 36.0, dist) * 0.6;
    vAlpha = aAlpha * uOpacity * fade;
  }
`

const LINE_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    gl_FragColor = vec4(vColor, vAlpha);
  }
`

/* -- field ------------------------------------------------------------------ */

const NODE_ALPHA = 0.55
const EDGE_ALPHA = 0.24

export class Field {
  /**
   * @param {{nodes: Array, edges?: Array}} data
   *   node  { x, y, z, size?, tone?, alpha?, drift? }
   *   edge  { a, b, tone?, alpha? }   a/b are indices into nodes
   *
   * Implements the Layer contract the Stage drives (see stage.js):
   *   group, extentX, extentY, opacity, setOpacity, update, setScale, snap, dispose
   */
  constructor(data) {
    this.nodes = data.nodes
    this.edges = data.edges || []
    this.group = new THREE.Group()
    this.group.visible = false
    this.opacity = 0
    /** Optional `(pos, base, t) => void`, set by a scene. See update(). */
    this.motion = null

    const n = this.nodes.length
    this.basePos = new Float32Array(n * 3)
    this.nodeColor = new Float32Array(n * 3)
    this.nodeTone = new Uint8Array(n)
    this.nodeAlpha = new Float32Array(n)
    this.nodeAlphaTarget = new Float32Array(n)
    this.nodeSize = new Float32Array(n)
    this.drift = new Float32Array(n * 3)

    const pos = new Float32Array(n * 3)
    // How far the scene reaches from the origin, so the stage can frame it
    // instead of relying on hand-tuned camera offsets per aspect ratio.
    this.extentX = 0
    this.extentY = 0

    for (let i = 0; i < n; i++) {
      const nd = this.nodes[i]
      this.extentX = Math.max(this.extentX, Math.abs(nd.x))
      this.extentY = Math.max(this.extentY, Math.abs(nd.y))
      this.basePos[i * 3] = pos[i * 3] = nd.x
      this.basePos[i * 3 + 1] = pos[i * 3 + 1] = nd.y
      this.basePos[i * 3 + 2] = pos[i * 3 + 2] = nd.z
      this.nodeTone[i] = toneIdx(nd.tone, 'dim')
      this.nodeAlpha[i] = this.nodeAlphaTarget[i] = nd.alpha == null ? NODE_ALPHA : nd.alpha
      this.nodeSize[i] = nd.size == null ? 5 : nd.size
      const d = nd.drift == null ? 1 : nd.drift
      this.drift[i * 3] = d * (0.2 + Math.random() * 0.8)
      this.drift[i * 3 + 1] = d * (0.2 + Math.random() * 0.8)
      this.drift[i * 3 + 2] = Math.random() * Math.PI * 2
    }

    const pg = new THREE.BufferGeometry()
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    pg.setAttribute('aColor', new THREE.BufferAttribute(this.nodeColor, 3))
    pg.setAttribute('aAlpha', new THREE.BufferAttribute(this.nodeAlpha, 1))
    pg.setAttribute('aSize', new THREE.BufferAttribute(this.nodeSize, 1))

    this.pointMat = new THREE.ShaderMaterial({
      vertexShader: POINT_VERT,
      fragmentShader: POINT_FRAG,
      uniforms: { uScale: { value: 300 }, uOpacity: { value: 0 } },
      transparent: true,
      depthWrite: false,
      depthTest: false,
    })

    this.points = new THREE.Points(pg, this.pointMat)
    this.pointGeo = pg
    this.group.add(this.points)

    if (this.edges.length) {
      const m = this.edges.length
      const lpos = new Float32Array(m * 6)
      this.edgeColor = new Float32Array(m * 6)
      this.edgeTone = new Uint8Array(m)
      this.edgeAlpha = new Float32Array(m * 2)
      this.edgeAlphaTarget = new Float32Array(m * 2)

      for (let e = 0; e < m; e++) {
        const ed = this.edges[e]
        this.edgeTone[e] = toneIdx(ed.tone, 'off')
        const a = ed.alpha == null ? EDGE_ALPHA : ed.alpha
        for (let k = 0; k < 2; k++) {
          const ni = k === 0 ? ed.a : ed.b
          const o = e * 6 + k * 3
          lpos[o] = this.basePos[ni * 3]
          lpos[o + 1] = this.basePos[ni * 3 + 1]
          lpos[o + 2] = this.basePos[ni * 3 + 2]
          this.edgeAlpha[e * 2 + k] = this.edgeAlphaTarget[e * 2 + k] = a
        }
      }

      const lg = new THREE.BufferGeometry()
      lg.setAttribute('position', new THREE.BufferAttribute(lpos, 3))
      lg.setAttribute('aColor', new THREE.BufferAttribute(this.edgeColor, 3))
      lg.setAttribute('aAlpha', new THREE.BufferAttribute(this.edgeAlpha, 1))

      this.lineMat = new THREE.ShaderMaterial({
        vertexShader: LINE_VERT,
        fragmentShader: LINE_FRAG,
        uniforms: { uOpacity: { value: 0 } },
        transparent: true,
        depthWrite: false,
        depthTest: false,
      })

      this.lines = new THREE.LineSegments(lg, this.lineMat)
      this.lineGeo = lg
      this.linePos = lpos
      this.group.add(this.lines)
    }

    // Start at the palette color, not black.
    this.snap()
  }

  /** Write a node's target appearance. Reached over the next few frames. */
  setNode(i, tone, alpha) {
    if (i < 0 || i >= this.nodes.length) return
    this.nodeTone[i] = toneIdx(tone, 'dim')
    if (alpha != null) this.nodeAlphaTarget[i] = alpha
  }

  setEdge(e, tone, alpha) {
    if (!this.edges.length || e < 0 || e >= this.edges.length) return
    this.edgeTone[e] = toneIdx(tone, 'off')
    if (alpha != null) {
      this.edgeAlphaTarget[e * 2] = alpha
      this.edgeAlphaTarget[e * 2 + 1] = alpha
    }
  }

  /** Reset every node and edge to the tone it was authored with. */
  reset() {
    for (let i = 0; i < this.nodes.length; i++) {
      const nd = this.nodes[i]
      this.setNode(i, nd.tone || 'dim', nd.alpha == null ? NODE_ALPHA : nd.alpha)
    }
    for (let e = 0; e < this.edges.length; e++) {
      const ed = this.edges[e]
      this.setEdge(e, ed.tone || 'off', ed.alpha == null ? EDGE_ALPHA : ed.alpha)
    }
  }

  /** Jump straight to every target. Used for hidden fields after a theme change. */
  snap() {
    this.lerpColors(1)
    this.nodeAlpha.set(this.nodeAlphaTarget)
    if (this.lines) this.edgeAlpha.set(this.edgeAlphaTarget)
    this.pointGeo.attributes.aColor.needsUpdate = true
    this.pointGeo.attributes.aAlpha.needsUpdate = true
    if (this.lines) {
      this.lineGeo.attributes.aColor.needsUpdate = true
      this.lineGeo.attributes.aAlpha.needsUpdate = true
    }
  }

  lerpColors(k) {
    const n = this.nodes.length
    for (let i = 0; i < n; i++) {
      const p = this.nodeTone[i] * 3
      const o = i * 3
      this.nodeColor[o] += (PALETTE[p] - this.nodeColor[o]) * k
      this.nodeColor[o + 1] += (PALETTE[p + 1] - this.nodeColor[o + 1]) * k
      this.nodeColor[o + 2] += (PALETTE[p + 2] - this.nodeColor[o + 2]) * k
    }
    if (!this.lines) return
    for (let e = 0; e < this.edges.length; e++) {
      const p = this.edgeTone[e] * 3
      for (let s = 0; s < 2; s++) {
        const o = e * 6 + s * 3
        this.edgeColor[o] += (PALETTE[p] - this.edgeColor[o]) * k
        this.edgeColor[o + 1] += (PALETTE[p + 1] - this.edgeColor[o + 1]) * k
        this.edgeColor[o + 2] += (PALETTE[p + 2] - this.edgeColor[o + 2]) * k
      }
    }
  }

  update(t, dt, still) {
    // `still` is reduced motion: land on the target in one frame rather than
    // easing toward it forever.
    const k = still ? 1 : Math.min(1, dt * 3.4)
    const n = this.nodes.length

    this.lerpColors(k)
    for (let i = 0; i < n; i++) {
      this.nodeAlpha[i] += (this.nodeAlphaTarget[i] - this.nodeAlpha[i]) * k
    }

    // Ambient drift: enough to feel alive, never enough to read as motion.
    if (!still) {
      const p = this.pointGeo.attributes.position.array
      for (let i = 0; i < n; i++) {
        const ph = this.drift[i * 3 + 2]
        p[i * 3] = this.basePos[i * 3] + Math.sin(t * 0.28 + ph) * 0.055 * this.drift[i * 3]
        p[i * 3 + 1] =
          this.basePos[i * 3 + 1] + Math.cos(t * 0.23 + ph * 1.7) * 0.055 * this.drift[i * 3 + 1]
      }
      // Scene-authored motion (a wave, a pulse): `motion(pos, base, t)` writes
      // into `pos` on top of the drift. Skipped under reduced motion.
      if (this.motion) this.motion(p, this.basePos, t)
      this.pointGeo.attributes.position.needsUpdate = true

      if (this.lines) {
        const lp = this.linePos
        for (let e = 0; e < this.edges.length; e++) {
          const ed = this.edges[e]
          for (let s = 0; s < 2; s++) {
            const ni = s === 0 ? ed.a : ed.b
            const o = e * 6 + s * 3
            lp[o] = p[ni * 3]
            lp[o + 1] = p[ni * 3 + 1]
            lp[o + 2] = p[ni * 3 + 2]
          }
        }
        this.lineGeo.attributes.position.needsUpdate = true
      }
    }

    this.pointGeo.attributes.aColor.needsUpdate = true
    this.pointGeo.attributes.aAlpha.needsUpdate = true

    if (this.lines) {
      for (let i = 0; i < this.edges.length * 2; i++) {
        this.edgeAlpha[i] += (this.edgeAlphaTarget[i] - this.edgeAlpha[i]) * k
      }
      this.lineGeo.attributes.aColor.needsUpdate = true
      this.lineGeo.attributes.aAlpha.needsUpdate = true
    }
  }

  setOpacity(v) {
    this.opacity = v
    this.pointMat.uniforms.uOpacity.value = v
    if (this.lineMat) this.lineMat.uniforms.uOpacity.value = v
    this.group.visible = v > 0.001
  }

  setScale(px) {
    this.pointMat.uniforms.uScale.value = px
  }

  dispose() {
    this.pointGeo.dispose()
    this.pointMat.dispose()
    if (this.lineGeo) this.lineGeo.dispose()
    if (this.lineMat) this.lineMat.dispose()
  }
}

/** Deterministic RNG — the same layout every run, so the talk never surprises. */
export function rng(seed) {
  let a = seed >>> 0
  return function () {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
