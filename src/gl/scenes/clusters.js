import { rng } from '../field.js'
import { blob, knit } from '../builders.js'

/**
 * clusters — three separate groups that turn out to be linked.
 *   step 1  the first cluster lights
 *   step 2  the other two join
 *   step 3  cross-links between them light in `signal`
 */
export default {
  camera: { z: 16.5 },
  build() {
    const rand = rng(3319)
    const centres = [
      [-3.2, 1.2, -0.8],
      [0.2, -1.6, 1.2],
      [3.4, 1.5, -1.2],
    ]
    const nodes = []
    const edges = []
    const groups = []

    centres.forEach((c) => {
      const from = nodes.length
      nodes.push(...blob(rand, 110, c[0], c[1], c[2], 1.5, 1.5, 1.5, { drift: 0.5 }))
      const to = nodes.length
      const eFrom = edges.length
      knit(nodes, from, to, 2, edges, 0.26)
      groups.push({ from, to, eFrom, eTo: edges.length })
    })

    const cross = []
    for (let i = 0; i < 3; i++) {
      for (let k = 0; k < 4; k++) {
        const A = groups[i]
        const B = groups[(i + 1) % 3]
        const a = A.from + Math.floor(rand() * (A.to - A.from))
        const b = B.from + Math.floor(rand() * (B.to - B.from))
        cross.push({ edge: edges.length, a, b })
        edges.push({ a, b, tone: 'off', alpha: 0.12 })
      }
    }

    return { nodes, edges, meta: { groups, cross } }
  },
  step(f, meta, n) {
    f.reset()
    const lit = (c, tone, na, ea) => {
      for (let i = c.from; i < c.to; i++) f.setNode(i, tone, na)
      for (let e = c.eFrom; e < c.eTo; e++) f.setEdge(e, tone, ea)
    }
    if (n >= 1) lit(meta.groups[0], 'structure', 0.85, 0.42)
    if (n >= 2) {
      lit(meta.groups[1], 'structure', 0.85, 0.42)
      lit(meta.groups[2], 'structure', 0.85, 0.42)
    }
    if (n >= 3) {
      meta.cross.forEach((c) => {
        f.setEdge(c.edge, 'signal', 0.85)
        f.setNode(c.a, 'signal', 1)
        f.setNode(c.b, 'signal', 1)
      })
    }
  },
}
