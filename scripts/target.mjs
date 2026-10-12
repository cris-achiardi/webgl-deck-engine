/**
 * Which deck the scripts point at.
 *
 *   --deck <name>     dev server: http://localhost:5173/?deck=<name>
 *   DECK=<name>       same, from the environment
 *   DECK_URL=<url>    anything else, e.g. file:///…/dist/<name>.html
 *
 * Returns { base, rest } — base has no hash; rest is argv without --deck.
 */
export function target(argv = process.argv.slice(2)) {
  const rest = []
  let deck = process.env.DECK
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--deck') deck = argv[++i]
    else rest.push(argv[i])
  }
  let base = process.env.DECK_URL
  if (!base) {
    if (!deck) {
      console.error('Name a deck: --deck <name>  (or set DECK, or DECK_URL for a built file)')
      process.exit(1)
    }
    base = `http://localhost:5173/?deck=${encodeURIComponent(deck)}`
  }
  base = base.replace(/#.*$/, '')
  const sep = base.includes('?') ? '&' : '?'
  /** URL for a position and theme: at('3.2', 'light') */
  const at = (hash = '', theme = 'dark') => `${base}${sep}theme=${theme}${hash ? '#' + hash : ''}`
  return { base, rest, at, label: deck || base }
}

export const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
