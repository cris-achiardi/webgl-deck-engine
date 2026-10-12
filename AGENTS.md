# AGENTS.md

Index for AI agents working in this repo. Read this first, then open only what
the task needs.

**The authoring guide is [`CLAUDE.md`](./CLAUDE.md).** It holds the slide
schema, block reference, scene contract, design rules, decisions not to undo,
and the verify workflow. Follow it for any deck or engine change.

## What this repo is

An engine for HTML slide decks: WebGL scene layer behind HTML slides, stepwise
reveals, keyboard navigation, light/dark themes, single-file export per deck.
The engine (`src/`) is shared; each deck in `decks/<name>/` holds only content.

## Where things are

| Task                                   | Go to                                      |
|----------------------------------------|--------------------------------------------|
| Add / edit a slide                     | `decks/<deck>/slides.js` — schema in `CLAUDE.md` → *Slide object*, *Blocks* |
| Per-slide styles                       | `decks/<deck>/slides.css`, scoped `.slide--<id>` |
| Side-panel sheets (`[[id\|label]]`)    | `decks/<deck>/details.js`                  |
| Page title, HUD hint, help shortcuts   | `decks/<deck>/meta.js`                     |
| Deck-only WebGL scene                  | `decks/<deck>/scenes/` + register in `decks/<deck>/index.js` |
| Shared scene library                   | `src/gl/scenes/` + `src/gl/scenes/index.js` |
| Geometry helpers                       | `src/gl/builders.js`                       |
| Points/lines renderer, tones           | `src/gl/field.js`                          |
| Camera solving, crossfade, fallback    | `src/gl/stage.js`                          |
| Colors (both themes), spacing, motion  | `src/styles/tokens.css`                    |
| Type ramp                              | `src/styles/type.css`                      |
| Fonts                                  | `src/styles/fonts.css`                     |
| Navigation, panel, overview, help      | `src/engine/app.js`                        |
| Block renderers                        | `src/engine/blocks.js`                     |
| Theme logic (mirrors `index.html`)     | `src/engine/theme.js`                      |
| Deck discovery / `virtual:deck`        | `vite.config.js`                           |
| New-deck template                      | `templates/deck/`                          |
| Build, new deck, verify, screenshots   | `scripts/`                                 |
| Reference deck (every feature)         | `decks/example/` — read for patterns, don't put real content there |
| Human-facing docs                      | `docs/README.md`                           |

## Commands

```bash
npm run dev                                   # http://localhost:5173, ?deck=<name>
npm run new <name> -- --title "Title"         # new deck from templates/deck
npm run build -- <deck>                       # dist/<deck>.html (or --all)
npm run verify -- --deck <deck>               # navigation, panel, theme, fallback, a11y, console
npm run shots -- --deck <deck> [--theme light] [--size WxH] <slide.step | --all>
```

## Hard rules (details in `CLAUDE.md`)

- Ask which deck if the user doesn't name one and more than one real deck exists.
- Colors only via tokens; type only via the ramp. No literal colors.
- Changes in `src/` affect every deck — run verify on each deck afterwards.
- The build is one self-contained file: no CDN links, no runtime fetches.
- `localStorage` access always inside `try`.
- After changing a slide, screenshot it at its last step in **both** themes and look before reporting done.

## Docs map

When you change behavior, update the matching human doc too:

| Area                    | Doc                          |
|-------------------------|------------------------------|
| Setup, keys, templates  | `docs/getting-started.md`    |
| Architecture overview   | `docs/how-it-works.md`       |
| Slides, blocks, motion  | `docs/writing-slides.md`     |
| Scenes                  | `docs/scenes.md`             |
| Tokens, type, fonts     | `docs/customizing.md`        |
| Detail sheets           | `docs/detail-sheets.md`      |
| Build, verify, present  | `docs/presenting.md`         |
| Briefing an assistant   | `docs/working-with-ai.md`    |
