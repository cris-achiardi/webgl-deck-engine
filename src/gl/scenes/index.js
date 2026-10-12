/**
 * Scene registry. A slide names its scene by the key used here.
 *
 * To add a scene: create `scenes/<name>.js` (copy the closest existing one),
 * then import and list it below. Scenes are built lazily the first time a
 * slide shows them, so an unused scene costs nothing at runtime.
 *
 * Scene contract (everything optional except one of build/layer):
 *   camera  { z = 15, y = 0, lookY = y }   x is solved by the stage — never set it here
 *   build() → { nodes, edges?, meta? }     a points+lines Field (see ../field.js)
 *   layer() → { layer, meta? }             any custom object implementing the Layer contract
 *   setup(layer, meta)                     once, right after building
 *   step(layer, meta, step)                each time the slide's step changes
 *   tick(layer, meta, t, step)             every frame while visible (skipped under reduced motion)
 *
 * Geometry is authored around the origin. Keep it within roughly ±6 x, ±4 y:
 * the stage measures the extent and solves camera distance and offset from it.
 */
import drift from './drift.js'
import path from './path.js'
import tree from './tree.js'
import hub from './hub.js'
import clusters from './clusters.js'
import lattice from './lattice.js'
import wave from './wave.js'
import aurora from './aurora.js'

export const SCENES = { drift, path, tree, hub, clusters, lattice, wave, aurora }
