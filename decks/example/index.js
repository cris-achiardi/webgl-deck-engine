/**
 * Deck entry. The engine imports exactly this module; everything the deck
 * needs is reachable from here.
 */
import './slides.css'

export { slides } from './slides.js'
export { details } from './details.js'
export { meta } from './meta.js'

/** Deck-only WebGL scenes, merged over the shared library (same name wins). */
export const scenes = {}
