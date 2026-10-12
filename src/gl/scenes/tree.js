import { rng } from '../field.js'
import { box } from '../builders.js'

/**
 * tree — a three-tier hierarchy over a faint background.
 *   step 1  the whole tree lights in `structure`
 *   step 2  one branch is picked (`signal`), the rest recede
 *   step 3  one leaf of that branch is picked (`bright`)
 */
export default {
  camera: { z: 13.6, y: -0.1 },
  build() {
    const rand = rng(4402)
    const nodes = box(rand, 170, 0, 0, -3.2, 5.2, 4.4, 2.4, {
      alpha: 0.2,
      size: () => 2.8,
      drift: 1.2,
    })
    const edges = []

    const root = nodes.length
    nodes.push({ x: 0, y: 3.6, z: 0, size: 16, tone: 'off', alpha: 0.7, drift: 0.1 })

    // Tiers spread across x so the hierarchy reads as a hierarchy.
    const groups = []
    const G = 4
    for (let g = 0; g < G; g++) {
      const gx = (-1 + (2 * g) / (G - 1)) * 2.75
      const gz = g % 2 === 0 ? -1.3 : 1.3
      const gi = nodes.length
      nodes.push({ x: gx, y: 0.3, z: gz, size: 11, tone: 'off', alpha: 0.62, drift: 0.2 })

      const rootEdge = edges.length
      edges.push({ a: root, b: gi, tone: 'off', alpha: 0.34 })

      const leaves = []
      const leafEdges = []
      const L = 4
      for (let l = 0; l < L; l++) {
        const li = nodes.length
        nodes.push({
          x: gx + (-1 + (2 * l) / (L - 1)) * 0.85,
          y: -3.3 - rand() * 0.4,
          z: gz + (l % 2 === 0 ? -0.6 : 0.6),
          size: 8,
          tone: 'off',
          alpha: 0.5,
          drift: 0.25,
        })
        leafEdges.push(edges.length)
        edges.push({ a: gi, b: li, tone: 'off', alpha: 0.28 })
        leaves.push(li)
      }
      groups.push({ node: gi, rootEdge, leaves, leafEdges })
    }

    return { nodes, edges, meta: { root, groups } }
  },
  step(f, meta, n) {
    f.reset()
    const { root, groups } = meta
    const pick = groups[1]

    if (n >= 1) {
      f.setNode(root, 'bright', 1)
      groups.forEach((g) => {
        f.setEdge(g.rootEdge, 'structure', 0.7)
        f.setNode(g.node, 'structure', 0.9)
        g.leafEdges.forEach((e) => f.setEdge(e, 'structure', 0.42))
        g.leaves.forEach((l) => f.setNode(l, 'structure', 0.62))
      })
    }
    if (n >= 2) {
      // What is not picked stays visible as something that exists and was passed over.
      groups.forEach((g) => {
        if (g === pick) return
        f.setEdge(g.rootEdge, 'off', 0.26)
        f.setNode(g.node, 'dim', 0.44)
        g.leafEdges.forEach((e) => f.setEdge(e, 'off', 0.16))
        g.leaves.forEach((l) => f.setNode(l, 'dim', 0.3))
      })
      f.setEdge(pick.rootEdge, 'signal', 1)
      f.setNode(pick.node, 'signal', 1)
      pick.leafEdges.forEach((e) => f.setEdge(e, 'structure', 0.55))
      pick.leaves.forEach((l) => f.setNode(l, 'structure', 0.75))
    }
    if (n >= 3) {
      pick.leafEdges.forEach((e, i) => f.setEdge(e, i === 2 ? 'signal' : 'off', i === 2 ? 1 : 0.16))
      pick.leaves.forEach((l, i) => f.setNode(l, i === 2 ? 'bright' : 'dim', i === 2 ? 1 : 0.3))
    }
  },
}
