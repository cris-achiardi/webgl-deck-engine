import './styles/fonts.css'
import './styles/tokens.css'
import './styles/type.css'
import './styles/engine.css'
import './styles/blocks.css'
import './styles/motion.css'

import { decks, fixed, loadDeck, loadMeta } from 'virtual:deck'
import { startDeck } from './engine/app.js'
import { showPicker } from './engine/picker.js'

/*
 * Which deck? A build has exactly one (`fixed`). In dev, ?deck=<name> picks one;
 * without it — or with a name that doesn't exist — the picker lists them all.
 */
const name = fixed || new URLSearchParams(location.search).get('deck')
const deck = name ? await loadDeck(name) : null

if (deck) startDeck(deck)
else showPicker({ decks, loadMeta, missing: name })
