/**
 * Deck entry for "__TITLE__". The engine imports exactly this module.
 */
import './slides.css'

export { slides } from './slides.js'
export { details } from './details.js'
export { meta } from './meta.js'

/**
 * Deck-only WebGL scenes, merged over the shared library in src/gl/scenes
 * (same name wins). Put scene files in ./scenes/ and register them here:
 *
 *   import orbit from './scenes/orbit.js'
 *   export const scenes = { orbit }
 *
 * Inside a scene file, import engine pieces through the alias:
 *   import { rng } from '@engine/gl/field.js'
 *   import { blob, knit } from '@engine/gl/builders.js'
 */
export const scenes = {}
