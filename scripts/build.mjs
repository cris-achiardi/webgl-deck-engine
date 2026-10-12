/**
 * Build one or more decks, each into its own self-contained file.
 *
 *   npm run build -- my-talk      → dist/my-talk.html
 *   npm run build -- a b c
 *   npm run build -- --all
 *
 * Each deck is a separate Vite build with DECK set, so a file only ever
 * contains its own deck.
 */
import { build } from 'vite'
import { readdirSync, existsSync, renameSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const all = readdirSync('decks', { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('_') && existsSync(join('decks', d.name, 'index.js')))
  .map((d) => d.name)

const args = process.argv.slice(2)
const targets = args.includes('--all') ? all : args

if (!targets.length) {
  console.error(`Name a deck: npm run build -- <deck>   (or --all)\nDecks: ${all.join(', ')}`)
  process.exit(1)
}
const unknown = targets.filter((t) => !all.includes(t))
if (unknown.length) {
  console.error(`Unknown deck(s): ${unknown.join(', ')}\nDecks: ${all.join(', ')}`)
  process.exit(1)
}

mkdirSync('dist', { recursive: true })
for (const name of targets) {
  process.env.DECK = name
  await build({ logLevel: 'warn' })
  renameSync(join('dist', 'index.html'), join('dist', `${name}.html`))
  console.log(`· dist/${name}.html`)
}
