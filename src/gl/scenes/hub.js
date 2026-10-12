import { rng } from '../field.js'
import { blob, knit } from '../builders.js'

/**
 * hub — one shared core, five satellites that each reach into it.
 *   step n  satellites 1…n are live; the newest is `signal`, earlier ones `structure`.
 *   Reads well with 1–5 steps beyond step 0.
 */
export default {
  camera: { z: 15 },
  build() {
    const rand = rng(9051)
    const nodes = blob(rand, 240, 0, 0, 0, 2.2, 2.1, 2.2, { drift: 0.35 })
    const coreEnd = nodes.length
    const edges = []
    knit(nodes, 0, coreEnd, 2, edges, 0.24)

    const sats = []
    const S = 5
    for (let s = 0; s < S; s++) {
      const a = (s / S) * Math.PI * 2 + 0.45
      const si = nodes.length
      nodes.push({
        x: Math.cos(a) * 3.6,
        y: Math.sin(a) * 2.9,
        z: Math.sin(a * 1.7) * 1.2,
        size: 13,
        tone: 'off',
        alpha: 0.55,
        drift: 0.15,
      })
      const reach = []
      const used = new Set()
      for (let k = 0; k < 9; k++) {
        let t
        do {
          t = Math.floor(rand() * coreEnd)
        } while (used.has(t))
        used.add(t)
        reach.push({ edge: edges.length, node: t })
        edges.push({ a: si, b: t, tone: 'off', alpha: 0.16 })
      }
      sats.push({ node: si, reach })
    }

    return { nodes, edges, meta: { coreEnd, sats } }
  },
  step(f, meta, n) {
    f.reset()
    if (n < 1) return
    const live = Math.min(n, meta.sats.length)
    for (let s = 0; s < live; s++) {
      const isLast = s === live - 1
      const sat = meta.sats[s]
      f.setNode(sat.node, isLast ? 'signal' : 'structure', isLast ? 1 : 0.75)
      sat.reach.forEach((r) => {
        f.setEdge(r.edge, isLast ? 'signal' : 'structure', isLast ? 0.85 : 0.4)
        f.setNode(r.node, isLast ? 'signal' : 'structure', isLast ? 1 : 0.8)
      })
    }
  },
}
