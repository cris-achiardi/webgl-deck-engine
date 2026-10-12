import { rng } from '../field.js'
import { blob, knit, curve, chain } from '../builders.js'

/**
 * lattice — a curved wall protecting a core, with three channels through it.
 *   step 1  the wall and the core appear
 *   step 2  channel 1 (open) lights in `signal`
 *   step 3  channel 2 (one gate)
 *   step 4  channel 3 (two gates); earlier channels settle to `structure`
 */
export default {
  camera: { z: 14.6 },
  build() {
    const rand = rng(6127)
    const nodes = []
    const edges = []

    const CX = 3.4
    const R = 3.6
    const COLS = 24
    const ROWS = 13
    const wallFrom = nodes.length
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const a = -0.78 + (c / (COLS - 1)) * 1.56
        nodes.push({
          x: CX - Math.cos(a) * R,
          y: -3.4 + (r / (ROWS - 1)) * 6.8,
          z: Math.sin(a) * R,
          size: 3.4,
          tone: 'off',
          alpha: 0.26,
          drift: 0.12,
        })
      }
    }
    const wallEdgeFrom = edges.length
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = wallFrom + r * COLS + c
        if (c < COLS - 1) edges.push({ a: i, b: i + 1, tone: 'off', alpha: 0.14 })
        if (r < ROWS - 1) edges.push({ a: i, b: i + COLS, tone: 'off', alpha: 0.14 })
      }
    }
    const wallEdgeTo = edges.length

    const innerFrom = nodes.length
    nodes.push(...blob(rand, 140, CX + 1.2, 0, 0, 1.4, 1.8, 1.4, { drift: 0.4 }))
    const innerTo = nodes.length
    const innerEdgeFrom = edges.length
    knit(nodes, innerFrom, innerTo, 2, edges, 0.22)
    const innerEdgeTo = edges.length

    const channels = []
    const ends = [
      [2.5, 0.9],
      [0.0, -0.4],
      [-2.5, 1.1],
    ]
    ends.forEach(([y0, z0], ci) => {
      const target = nodes[innerFrom + 18 + ci * 38]
      const pts = curve(
        [
          [-1.4, y0, z0],
          [CX - R + 0.05, y0 * 0.62, z0 * 0.85],
          [CX - R * 0.2, y0 * 0.3, z0 * 0.45],
          [target.x, target.y, target.z],
        ],
        30
      )
      const from = nodes.length
      pts.forEach((p, i) =>
        nodes.push({ ...p, size: i === 0 ? 12 : 4.4, tone: 'off', alpha: 0.3, drift: 0.1 })
      )
      const ch = chain(nodes, from, pts.length, edges, 0.28)
      const gates = ci === 0 ? [] : ci === 1 ? [from + 11] : [from + 10, from + 13]
      channels.push({ from, count: pts.length, edges: ch, gates })
    })

    return {
      nodes,
      edges,
      meta: {
        wallFrom,
        wallTo: innerFrom,
        wallEdgeFrom,
        wallEdgeTo,
        innerFrom,
        innerTo,
        innerEdgeFrom,
        innerEdgeTo,
        channels,
      },
    }
  },
  step(f, meta, n) {
    f.reset()
    if (n >= 1) {
      for (let i = meta.wallFrom; i < meta.wallTo; i++) f.setNode(i, 'structure', 0.5)
      for (let e = meta.wallEdgeFrom; e < meta.wallEdgeTo; e++) f.setEdge(e, 'structure', 0.26)
      for (let i = meta.innerFrom; i < meta.innerTo; i++) f.setNode(i, 'dim', 0.7)
      for (let e = meta.innerEdgeFrom; e < meta.innerEdgeTo; e++) f.setEdge(e, 'dim', 0.26)
    }
    for (let c = 0; c < meta.channels.length; c++) {
      if (n < c + 2) continue
      const ch = meta.channels[c]
      const last = n === c + 2
      for (let i = 0; i < ch.count; i++) {
        f.setNode(ch.from + i, last ? 'signal' : 'structure', last ? 0.95 : 0.5)
      }
      for (let e = 0; e < ch.edges.count; e++) {
        f.setEdge(ch.edges.first + e, last ? 'signal' : 'structure', last ? 0.9 : 0.4)
      }
      f.setNode(ch.from, 'bright', 1)
      ch.gates.forEach((g) => f.setNode(g, 'bright', 1))
    }
  },
}
