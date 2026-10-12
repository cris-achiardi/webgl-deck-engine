import { rng } from '../field.js'
import { blob, curve, chain } from '../builders.js'

/**
 * path — a still cloud with a curve threading through it, and a travelling pulse.
 *   step 1  the path appears and a pulse travels along it
 *   step 2  cloud nodes near the path light in `signal`
 *   step 3  a sparse sample of the whole cloud joins in `structure`
 */
export default {
  camera: { z: 15, y: 0.4, lookY: 0 },
  build() {
    const rand = rng(8813)
    const nodes = blob(rand, 380, 0, 0, 0, 2.6, 2.2, 2.4, { drift: 0.5 })
    const cloudEnd = nodes.length

    const path = curve(
      [
        [-4.4, -1.9, 2.6],
        [-2.3, 1.5, 0.8],
        [0.1, -1.5, -1.8],
        [2.4, 1.7, 1.2],
        [4.6, -1.2, 2.4],
      ],
      130
    )
    const pathStart = nodes.length
    path.forEach((p) => nodes.push({ ...p, size: 4.2, tone: 'off', alpha: 0.45, drift: 0.15 }))
    const edges = []
    const pathEdges = chain(nodes, pathStart, path.length, edges, 0.4)

    // Cloud nodes the path passes close to.
    const near = []
    for (let i = 0; i < cloudEnd; i++) {
      let best = 1e9
      for (let p = pathStart; p < nodes.length; p += 3) {
        const dx = nodes[i].x - nodes[p].x
        const dy = nodes[i].y - nodes[p].y
        const dz = nodes[i].z - nodes[p].z
        best = Math.min(best, dx * dx + dy * dy + dz * dz)
      }
      if (best < 0.75) near.push(i)
    }

    return { nodes, edges, meta: { cloudEnd, pathStart, pathLen: path.length, pathEdges, near } }
  },
  step(f, meta, n) {
    f.reset()
    if (n >= 1) {
      for (let e = 0; e < meta.pathEdges.count; e++) {
        f.setEdge(meta.pathEdges.first + e, 'structure', 0.75)
      }
    }
    if (n >= 3) for (let i = 0; i < meta.cloudEnd; i += 6) f.setNode(i, 'structure', 0.8)
    if (n >= 2) meta.near.forEach((i) => f.setNode(i, 'signal', 1))
  },
  tick(f, meta, t, step) {
    if (step < 1) return
    const head = ((t * 0.13) % 1) * meta.pathLen
    for (let i = 0; i < meta.pathLen; i++) {
      const d = Math.abs(i - head)
      const g = Math.exp(-(d * d) / 40)
      f.setNode(meta.pathStart + i, g > 0.25 ? 'signal' : 'structure', 0.4 + g * 0.6)
    }
  },
}
