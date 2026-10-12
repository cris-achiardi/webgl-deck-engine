import { rng } from '../field.js'
import { box } from '../builders.js'

/**
 * drift — a loose cloud with no structure. Good for covers and openers.
 *   step 0  all dim
 *   step 1+ a handful of nodes light up in `structure`
 */
export default {
  camera: { z: 15 },
  build() {
    const rand = rng(1207)
    const nodes = box(rand, 480, 0, 0, 0, 5.0, 3.4, 3.8, { drift: 1.5 })
    const marked = []
    for (let i = 0; i < 13; i++) marked.push(Math.floor(rand() * nodes.length))
    return { nodes, meta: { marked } }
  },
  step(f, meta, n) {
    f.reset()
    if (n >= 1) meta.marked.forEach((i) => f.setNode(i, 'structure', 1))
  },
}
