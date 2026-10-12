import { rng } from '../field.js'

/**
 * wave — a tilted sheet of points with a slow travelling swell.
 * The example of scene-authored motion via `field.motion`.
 *   step 1  the sheet lights in `structure`
 *   step 2  a band across the swell lights in `signal`
 */
const COLS = 46
const ROWS = 20

export default {
  camera: { z: 14.5 },
  build() {
    const rand = rng(2024)
    const nodes = []
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const zz = -3.4 + (r / (ROWS - 1)) * 6.8
        nodes.push({
          x: -5.4 + (c / (COLS - 1)) * 10.8,
          // Tilt the sheet so the camera, which never pitches, sees a surface.
          y: -0.6 - zz * 0.42,
          z: zz,
          size: 3.2 + rand() * 1.2,
          tone: 'dim',
          alpha: 0.3 + (1 - r / ROWS) * 0.25,
          drift: 0,
        })
      }
    }
    return { nodes, meta: {} }
  },
  setup(f) {
    f.motion = (pos, base, t) => {
      for (let i = 0; i < f.nodes.length; i++) {
        const x = base[i * 3]
        const z = base[i * 3 + 2]
        pos[i * 3 + 1] =
          base[i * 3 + 1] + Math.sin(x * 0.75 + t * 0.9) * Math.cos(z * 0.55 + t * 0.45) * 0.55
      }
    }
  },
  step(f, meta, n) {
    f.reset()
    if (n >= 1) {
      for (let i = 0; i < f.nodes.length; i++) f.setNode(i, 'structure', f.nodes[i].alpha + 0.15)
    }
    if (n >= 2) {
      for (let r = 0; r < ROWS; r++) {
        for (let c = 26; c < 31; c++) f.setNode(r * COLS + c, 'signal', 0.95)
      }
    }
  },
}
