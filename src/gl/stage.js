import * as THREE from 'three'
import { Field, setPalette } from './field.js'
import { SCENES } from './scenes/index.js'

/**
 * The WebGL layer: one renderer, one camera, every scene in the same THREE.Scene,
 * crossfaded by opacity.
 *
 * If anything here fails — no context, a lost context on unfamiliar hardware —
 * `onFail` swaps in the static composition and the deck keeps working. A talk
 * cannot depend on a GPU it has never met.
 *
 * Layer contract — what every scene object must implement (Field does):
 *   group        THREE.Object3D added to the scene
 *   extentX/Y    how far the geometry reaches from the origin
 *   opacity      current opacity, read by the crossfade
 *   setOpacity(v), update(t, dt, still), setScale(px), snap(), dispose()
 */
export class Stage {
  /**
   * Minimum viewport fraction the visualization needs to read. If the free band
   * beside the copy is narrower, the scene slides under the copy rather than
   * shrinking. Raise it for bigger scenes with more overlap; lower it for less.
   */
  static MIN_BAND = 0.6
  /** How far into the copy it may slide to get that band. */
  static MAX_OVERLAP = 0.3

  constructor(canvas, { onFail, reducedMotion, contentBox, scenes = {} }) {
    // Shared library plus the deck's own scenes; a deck scene with the same name wins.
    this.registry = { ...SCENES, ...scenes }
    this.reduced = reducedMotion
    // Where the copy sits, as viewport fractions { left, right }. The camera is
    // solved against it so the visualization never lands on the words.
    this.contentBox = contentBox || (() => ({ left: 0.05, right: 0.58 }))
    this.ok = false

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false,
      })
    } catch (err) {
      onFail(err)
      return
    }

    this.renderer.setClearColor(0x000000, 0)
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120)

    /** Built scenes, by name. Filled lazily by ensure(). */
    this.scenes = {}
    this.scale = 300

    this.current = null
    this.step = 0
    this.opts = { frame: 'right', opacity: 1 }
    this.camPos = new THREE.Vector3(0, 0, 15)
    this.camLook = new THREE.Vector3(0, 0, 0)
    this.camTarget = { y: 0, z: 15, lookY: 0 }
    // Scratch vectors for the solved target, reused every frame.
    this._pos = new THREE.Vector3(0, 0, 15)
    this._look = new THREE.Vector3()

    this.pointer = { x: 0, y: 0 }
    this.pointerTarget = { x: 0, y: 0 }
    this.dragging = false

    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault()
      this.ok = false
      onFail(new Error('WebGL context lost'))
    })

    this.bindPointer(canvas)
    this.resize()
    window.addEventListener('resize', () => this.resize())

    this.ok = true
    this.clock = new THREE.Clock()
    this.loop = this.loop.bind(this)
    this.raf = requestAnimationFrame(this.loop)
  }

  bindPointer(canvas) {
    const move = (e) => {
      this.pointerTarget.x = (e.clientX / window.innerWidth - 0.5) * 2
      this.pointerTarget.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    // Parallax follows the pointer anywhere; dragging on the canvas widens it,
    // so the presenter can nudge the view without leaving the slide.
    window.addEventListener('pointermove', (e) => {
      move(e)
      if (this.dragging) {
        this.pointerTarget.x *= 2.4
        this.pointerTarget.y *= 2.4
      }
    })
    canvas.addEventListener('pointerdown', (e) => {
      this.dragging = true
      canvas.setPointerCapture(e.pointerId)
    })
    canvas.addEventListener('pointerup', () => (this.dragging = false))
    canvas.addEventListener('pointercancel', () => (this.dragging = false))
  }

  resize() {
    if (!this.renderer) return
    const w = window.innerWidth
    const h = window.innerHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.renderer.setPixelRatio(dpr)
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    // Point size in device pixels = aSize * scale / distance. Deriving scale from
    // the projection keeps a dot the same physical size on a laptop and a projector.
    const fov = (this.camera.fov * Math.PI) / 180
    this.scale = (h * dpr) / (2 * Math.tan(fov / 2)) / 100
    for (const s of Object.values(this.scenes)) s.layer.setScale(this.scale)
  }

  /** Build a scene the first time it is asked for. Returns null for unknown names. */
  ensure(name) {
    if (this.scenes[name]) return this.scenes[name]
    const def = this.registry[name]
    if (!def) {
      console.warn(`[deck] unknown scene "${name}" — check src/gl/scenes/index.js or the deck's scenes export`)
      return null
    }
    let layer
    let meta = {}
    if (def.layer) {
      ;({ layer, meta = {} } = def.layer())
    } else {
      const built = def.build()
      layer = new Field(built)
      meta = built.meta || {}
    }
    layer.setScale(this.scale)
    layer.setOpacity(0)
    def.setup?.(layer, meta)
    this.scene.add(layer.group)
    return (this.scenes[name] = { name, def, meta, layer })
  }

  /** Build ahead of time so the first visit to a slide does not hitch. */
  preload(names) {
    if (!this.ok) return
    for (const n of names) if (n) this.ensure(n)
  }

  /**
   * Show a scene at a step. Same scene → just re-interpret the step.
   * `name` null/'none' fades every scene out.
   *   opts.frame    'right' (default) | 'left' | 'center' — where the scene sits
   *   opts.opacity  0–1 ceiling for this slide, e.g. 0.4 behind centered text
   */
  show(name, step, opts = {}) {
    if (!this.ok) return
    this.opts = { frame: opts.frame || 'right', opacity: opts.opacity ?? 1 }
    const next = name && name !== 'none' ? this.ensure(name) : null
    this.step = step

    if (this.current !== next) {
      this.current = next
      if (next) {
        const c = next.def.camera || {}
        this.camTarget.z = c.z ?? 15
        this.camTarget.y = c.y ?? 0
        this.camTarget.lookY = c.lookY ?? this.camTarget.y
      }
    }
    if (next) next.def.step?.(next.layer, next.meta, step)
  }

  /** Re-read the palette (after a theme change). Hidden scenes snap; the live one eases. */
  setPalette(map) {
    setPalette(map)
    if (!this.ok) return
    for (const s of Object.values(this.scenes)) if (s !== this.current) s.layer.snap()
  }

  /**
   * Solve the camera from the scene's own extent and where the text actually
   * sits, rather than tuning an offset per aspect ratio by eye.
   *
   * With `HALF_TAN = tan(fov/2)`, the visible half-width at the origin plane is
   * `HALF_TAN · distance · aspect`. Given the scene reaches ±extentX, pick the
   * distance that fits it into the free band beside the copy, then the sideways
   * offset that lands its near edge exactly at the start of that band.
   * 'left' is the mirror image of 'right'; 'center' fits the full width.
   */
  frame(aspect) {
    const s = this.current
    if (!s) return

    const HALF_TAN = Math.tan((this.camera.fov * Math.PI) / 360)
    const ex = Math.max(s.layer.extentX, 0.5)
    const ey = Math.max(s.layer.extentY, 0.5)
    const mode = this.opts.frame

    let band = 0.9
    let offset = 0
    let dist

    if (mode === 'center') {
      dist = Math.max(this.camTarget.z, ex / (HALF_TAN * aspect * band), ey / (HALF_TAN * 0.92))
    } else {
      const box = this.contentBox()
      // Distance from the viewport edge on the copy's side to where the copy ends.
      const edge =
        mode === 'left'
          ? Math.min(0.88, Math.max(0.1, 1 - box.left))
          : Math.min(0.88, Math.max(0.1, box.right))
      let start = Math.min(0.9, edge + 0.025)

      // The scene starts just past the text — unless that leaves too little width
      // to read. Below the minimum it slides under the copy instead of shrinking:
      // a shrunken scene turns into a side ornament.
      if (0.99 - start < Stage.MIN_BAND) start = Math.max(Stage.MAX_OVERLAP, 0.99 - Stage.MIN_BAND)

      band = Math.max(0.12, 0.99 - start)
      const distFit = ex / (HALF_TAN * aspect * band)
      const distTall = ey / (HALF_TAN * 0.92)
      dist = Math.max(this.camTarget.z, distFit, distTall)

      const halfW = HALF_TAN * dist * aspect
      offset = (start - 0.5) * 2 * halfW + ex
      if (mode === 'left') offset = -offset
    }

    this._pos.set(-offset, this.camTarget.y, dist)
    this._look.set(-offset, this.camTarget.lookY, 0)
  }

  loop() {
    this.raf = requestAnimationFrame(this.loop)
    if (!this.ok) return

    const dt = Math.min(this.clock.getDelta(), 0.05)
    const t = this.clock.elapsedTime

    // With reduced motion every transition snaps: an asymptotic lerp never quite
    // lands, which leaves a permanent sub-pixel crawl for exactly the people who
    // asked for none.
    const snap = this.reduced

    // On a narrow or portrait viewport the text takes the full width, so the
    // visualization steps back and becomes atmosphere.
    const a = this.camera.aspect
    const ceiling = (a < 1.15 ? 0.42 : 1) * this.opts.opacity

    // Crossfade: only the active scene is drawn at full strength.
    for (const s of Object.values(this.scenes)) {
      const want = s === this.current ? ceiling : 0
      const o = snap ? want : s.layer.opacity + (want - s.layer.opacity) * Math.min(1, dt * 3.6)
      s.layer.setOpacity(o)
      if (o > 0.002) s.layer.update(t, dt, this.reduced)
    }

    if (this.current?.def.tick && !this.reduced) {
      this.current.def.tick(this.current.layer, this.current.meta, t, this.step)
    }

    this.frame(a)

    const k = snap ? 1 : Math.min(1, dt * 2.2)
    this.camPos.lerp(this._pos, k)
    this.camLook.lerp(this._look, k)

    const pk = snap ? 1 : Math.min(1, dt * 1.8)
    this.pointer.x += (this.pointerTarget.x - this.pointer.x) * pk
    this.pointer.y += (this.pointerTarget.y - this.pointer.y) * pk

    const sway = this.reduced ? 0 : 1
    const bob = this.reduced ? 0 : Math.sin(t * 0.12) * 0.35
    this.camera.position.set(
      this.camPos.x + this.pointer.x * 1.5 * sway + bob,
      this.camPos.y - this.pointer.y * 0.9 * sway,
      this.camPos.z
    )
    this.camera.lookAt(this.camLook)
    this.renderer.render(this.scene, this.camera)
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    this.ok = false
    for (const s of Object.values(this.scenes)) s.layer.dispose()
    if (this.renderer) this.renderer.dispose()
  }
}
