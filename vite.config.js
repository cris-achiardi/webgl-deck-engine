import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { fileURLToPath } from 'node:url'
import { readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = fileURLToPath(new URL('.', import.meta.url))
const DECKS_DIR = join(root, 'decks')

/** Every folder in decks/ that has an index.js. Folders starting with _ are skipped. */
function listDecks() {
  return readdirSync(DECKS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .filter((d) => existsSync(join(DECKS_DIR, d.name, 'index.js')))
    .map((d) => d.name)
    .sort()
}

/**
 * `virtual:deck` — how the engine finds a deck.
 *
 *   dev    every deck is lazily importable; ?deck=<name> picks one, no param
 *          shows the picker. New deck folders appear on reload.
 *   build  exactly one deck (env DECK) is statically imported, so the single
 *          output file contains that deck and nothing else.
 */
function decksPlugin(mode) {
  const ID = 'virtual:deck'
  const RESOLVED = '\0' + ID
  return {
    name: 'decks',
    resolveId(id) {
      if (id === ID) return RESOLVED
    },
    load(id) {
      if (id !== RESOLVED) return
      if (mode === 'build') {
        const name = process.env.DECK
        if (!name || !listDecks().includes(name)) {
          throw new Error(`DECK must name a folder in decks/ — got "${name}". Use: npm run build -- <deck>`)
        }
        return `
          import * as deck from '/decks/${name}/index.js'
          export const fixed = ${JSON.stringify(name)}
          export const decks = [${JSON.stringify(name)}]
          export const loadDeck = async () => deck
          export const loadMeta = async () => deck.meta
        `
      }
      const names = listDecks()
      const map = (file) =>
        `{${names.map((n) => `${JSON.stringify(n)}: () => import('/decks/${n}/${file}')`).join(',')}}`
      return `
        const decksMap = ${map('index.js')}
        const metaMap = ${map('meta.js')}
        export const fixed = null
        export const decks = ${JSON.stringify(names)}
        export const loadDeck = async (n) => (decksMap[n] ? decksMap[n]() : null)
        export const loadMeta = async (n) => (metaMap[n] ? (await metaMap[n]()).meta : null)
      `
    },
    configureServer(server) {
      // A new or removed deck folder changes the virtual module's contents.
      const refresh = (path) => {
        if (!path.startsWith(DECKS_DIR) || !path.endsWith('index.js')) return
        const mod = server.moduleGraph.getModuleById(RESOLVED)
        if (mod) server.moduleGraph.invalidateModule(mod)
      }
      server.watcher.on('add', refresh)
      server.watcher.on('unlink', refresh)
    },
  }
}

// Two outputs, one codebase:
//   npm run dev               → every deck, picker at http://localhost:5173
//   npm run build -- <deck>   → dist/<deck>.html, fully self-contained (JS + CSS + fonts
//                               inlined), zero external requests (see scripts/build.mjs)
export default defineConfig(({ command }) => ({
  base: './',
  plugins: [decksPlugin(command === 'build' ? 'build' : 'dev'), viteSingleFile()],
  resolve: {
    // Deck code imports engine pieces as '@engine/gl/field.js' etc.
    alias: { '@engine': join(root, 'src') },
  },
  server: { port: 5173 },
  build: {
    target: 'es2022',
    cssCodeSplit: false,
    emptyOutDir: false,
    // Infinity forces the woff2 files into base64 data URIs inside the CSS,
    // so the built page needs no font requests at all.
    assetsInlineLimit: Infinity,
    chunkSizeWarningLimit: 4000,
  },
}))
