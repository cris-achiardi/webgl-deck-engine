/**
 * Geometry helpers for field scenes. All of them take a seeded `rand` from
 * rng() so a layout is identical every run.
 */

/** `n` nodes uniformly inside a box centred on (cx, cy, cz) with half-sizes rx/ry/rz. */
export function box(rand, n, cx, cy, cz, rx, ry, rz, opts = {}) {
  const out = []
  for (let i = 0; i < n; i++) {
    out.push({
      x: cx + (rand() * 2 - 1) * rx,
      y: cy + (rand() * 2 - 1) * ry,
      z: cz + (rand() * 2 - 1) * rz,
      size: opts.size ? opts.size(rand) : 3.2 + rand() * 3,
      tone: opts.tone || 'dim',
      alpha: opts.alpha == null ? 0.3 + rand() * 0.3 : opts.alpha,
      drift: opts.drift == null ? 1 : opts.drift,
    })
  }
  return out
}

/** `n` nodes inside an ellipsoid. */
export function blob(rand, n, cx, cy, cz, rx, ry, rz, opts = {}) {
  const out = []
  for (let i = 0; i < n; i++) {
    // Cube-root keeps density even instead of piling up in the middle.
    const r = Math.cbrt(rand())
    const th = rand() * Math.PI * 2
    const ph = Math.acos(rand() * 2 - 1)
    out.push({
      x: cx + Math.sin(ph) * Math.cos(th) * rx * r,
      y: cy + Math.cos(ph) * ry * r,
      z: cz + Math.sin(ph) * Math.sin(th) * rz * r,
      size: opts.size ? opts.size(rand) : 3.4 + rand() * 2.8,
      tone: opts.tone || 'dim',
      alpha: opts.alpha == null ? 0.32 + rand() * 0.28 : opts.alpha,
      drift: opts.drift == null ? 0.7 : opts.drift,
    })
  }
  return out
}

/** Connect each node in [from,to) to its k nearest neighbours in the same range. */
export function knit(nodes, from, to, k, edges, alpha = 0.3) {
  for (let i = from; i < to; i++) {
    const d = []
    for (let j = from; j < to; j++) {
      if (i === j) continue
      const dx = nodes[i].x - nodes[j].x
      const dy = nodes[i].y - nodes[j].y
      const dz = nodes[i].z - nodes[j].z
      d.push([dx * dx + dy * dy + dz * dz, j])
    }
    d.sort((a, b) => a[0] - b[0])
    for (let n = 0; n < k && n < d.length; n++) {
      if (d[n][1] > i) edges.push({ a: i, b: d[n][1], tone: 'off', alpha })
    }
  }
}

/** Catmull-Rom through the control points [[x,y,z], …], sampled into `count` points. */
export function curve(pts, count) {
  const at = (t) => {
    const seg = Math.min(Math.floor(t * (pts.length - 1)), pts.length - 2)
    const lt = t * (pts.length - 1) - seg
    const p0 = pts[Math.max(seg - 1, 0)]
    const p1 = pts[seg]
    const p2 = pts[seg + 1]
    const p3 = pts[Math.min(seg + 2, pts.length - 1)]
    const t2 = lt * lt
    const t3 = t2 * lt
    const o = []
    for (let a = 0; a < 3; a++) {
      o[a] =
        0.5 *
        (2 * p1[a] +
          (-p0[a] + p2[a]) * lt +
          (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 +
          (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * t3)
    }
    return o
  }
  const out = []
  for (let i = 0; i < count; i++) {
    const [x, y, z] = at(i / (count - 1))
    out.push({ x, y, z })
  }
  return out
}

/** Edges linking `count` consecutive nodes starting at `from`. Returns the edge range. */
export function chain(nodes, from, count, edges, alpha = 0.4) {
  const first = edges.length
  for (let i = 0; i < count - 1; i++) {
    edges.push({ a: from + i, b: from + i + 1, tone: 'off', alpha })
  }
  return { first, count: count - 1 }
}
