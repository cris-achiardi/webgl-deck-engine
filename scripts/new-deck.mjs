/**
 * Create a new deck from templates/deck.
 *
 *   npm run new my-talk
 *   npm run new my-talk -- --title "My Talk"
 */
import { cpSync, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const args = process.argv.slice(2)
const name = args.find((a) => !a.startsWith('--'))
const ti = args.indexOf('--title')

if (!name || !/^[a-z0-9][a-z0-9-]*$/.test(name)) {
  console.error('Usage: npm run new <name>   (lowercase letters, digits and dashes, e.g. my-talk)')
  process.exit(1)
}

const dest = join('decks', name)
if (existsSync(dest)) {
  console.error(`decks/${name} already exists`)
  process.exit(1)
}

// "my-talk" → "My Talk" unless a title is given.
const title =
  ti > -1 && args[ti + 1]
    ? args[ti + 1]
    : name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

cpSync(join('templates', 'deck'), dest, { recursive: true })

const fill = (dir) => {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name)
    if (f.isDirectory()) fill(p)
    else writeFileSync(p, readFileSync(p, 'utf8').replaceAll('__TITLE__', title).replaceAll('__NAME__', name))
  }
}
fill(dest)

console.log(`Created decks/${name}
  dev:    npm run dev  →  http://localhost:5173/?deck=${name}
  build:  npm run build -- ${name}  →  dist/${name}.html`)
