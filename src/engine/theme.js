import { TONES } from '../gl/field.js'

/**
 * Light / dark.
 *
 * The theme lives on <html data-theme="dark|light">. Every color in the deck —
 * HTML and WebGL — is a token in src/styles/tokens.css, defined once per theme.
 * WebGL cannot read CSS, so readPalette() copies the `--gl-*` tokens into the
 * stage's palette after each switch.
 *
 * Resolution order (mirrored by the pre-paint script in index.html):
 *   1. ?theme=light|dark in the URL — explicit and shareable
 *   2. the last choice made in this browser (localStorage)
 *   3. the OS preference (prefers-color-scheme)
 */

export const THEMES = ['dark', 'light']
const KEY = 'deck.theme'

// localStorage *throws* (it does not return null) inside a sandboxed iframe and
// under some file:// policies. Without the try, the whole deck fails to boot.
const store = {
  get() {
    try {
      return localStorage.getItem(KEY)
    } catch {
      return null
    }
  },
  set(v) {
    try {
      localStorage.setItem(KEY, v)
    } catch {
      /* no persistence; the deck still works */
    }
  },
}

const osTheme = () => (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')

export function resolveTheme() {
  const q = new URLSearchParams(location.search).get('theme')
  if (THEMES.includes(q)) return q
  const saved = store.get()
  if (THEMES.includes(saved)) return saved
  return osTheme()
}

export const currentTheme = () => document.documentElement.dataset.theme || 'dark'

/** Apply a theme. `persist` records it as this browser's explicit choice. */
export function applyTheme(name, { persist = true } = {}) {
  if (!THEMES.includes(name)) return
  document.documentElement.dataset.theme = name
  if (persist) {
    store.set(name)
    // If the URL pins a theme, keep it truthful so a reload lands where you are.
    const u = new URL(location.href)
    if (u.searchParams.has('theme')) {
      u.searchParams.set('theme', name)
      history.replaceState(null, '', u.pathname + u.search + u.hash)
    }
  }
}

/** The `--gl-<tone>` tokens for the active theme, as `{ tone: cssColor }`. */
export function readPalette() {
  const cs = getComputedStyle(document.documentElement)
  return Object.fromEntries(TONES.map((n) => [n, cs.getPropertyValue(`--gl-${n}`).trim()]))
}

/** Follow the OS while the viewer has not picked a theme themselves. */
export function followOS(onChange) {
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    const q = new URLSearchParams(location.search).get('theme')
    if (THEMES.includes(q) || THEMES.includes(store.get())) return
    applyTheme(osTheme(), { persist: false })
    onChange()
  })
}
