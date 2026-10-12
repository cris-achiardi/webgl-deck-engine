# WebGL Deck Engine — authoring guide

This repo is an **engine for HTML slide decks** — many decks, one engine: a
WebGL scene layer behind HTML slides, step-by-step reveals, keyboard
navigation, light/dark themes, and a single-file build per deck. The user
describes a deck **slide by slide**; your job is to turn each description into
an entry in `decks/<deck>/slides.js` (plus scene and style work when the slide
needs it), then verify it visually.

## Decks

Each deck is a folder in `decks/`. The engine (`src/`) is shared; a deck holds
only its content, its styles and any visuals made just for it.

```
decks/<deck>/index.js     entry — re-exports the files below + deck-only scenes
decks/<deck>/slides.js    THE DECK — one object per slide. Most work happens here.
decks/<deck>/details.js   side-panel sheets opened by [[id|term]]
decks/<deck>/meta.js      page title, description, HUD hint, help shortcuts
decks/<deck>/slides.css   per-slide styles, scoped as .slide--<id>
decks/<deck>/scenes/      optional WebGL scenes only this deck uses
```

- **Which deck?** The user names it. If they don't and more than one real
  deck exists, ask — never edit the wrong deck. `decks/example` is the
  reference deck showing every feature: read it for patterns, don't put real
  content there.
- **New deck:** `npm run new <name> -- --title "Title"` copies `templates/deck/`.
- **Dev:** `npm run dev` → http://localhost:5173 lists every deck;
  `?deck=<name>` opens one.
- **Export:** `npm run build -- <name>` → `dist/<name>.html` (or `--all`).
  Each file contains only its own deck.
- **Deck-only scene:** put it in `decks/<deck>/scenes/`, import engine pieces
  via `@engine/...` (e.g. `@engine/gl/field.js`), and register it in the deck's
  `index.js` `scenes` export. A deck scene with the same name as a shared one
  overrides it for that deck. Promote a scene to `src/gl/scenes/` only when a
  second deck needs it.
- **Engine changes affect every deck.** After changing anything in `src/`,
  run verify on each deck (see Verify). Exported `dist/*.html` files are frozen
  snapshots and never change retroactively.

## Where the engine lives

```
src/styles/tokens.css   every color (both themes), spacing, motion timing
src/styles/type.css     the type ramp (.t-hero … .t-eyebrow)
src/gl/scenes/          one file per WebGL scene + index.js registry
src/gl/builders.js      geometry helpers for scenes (box, blob, knit, curve, chain)
src/gl/field.js         points+lines renderer, palette, tones
src/gl/stage.js         renderer, camera solving, crossfade, fallback
src/engine/app.js       navigation, panel, overview, help, boot (rarely touched)
src/engine/             blocks, theme, picker, text helpers (rarely touched)
src/main.js             picks the deck (virtual:deck, defined in vite.config.js)
templates/deck/         what `npm run new` copies
scripts/                build, new-deck, verify, shots
```

## Workflow for each slide the user describes

1. **Decide the shape**: which layout, which scene (or none), how many steps,
   and what appears on each step. If the description leaves a real choice open
   (e.g. which visual metaphor), pick a sensible default and say so.
2. **Prefer blocks**; drop to `html` when the design needs a custom
   arrangement (grids, cards, diagrams, unusual compositions). Both can mix.
3. **Pick or build the scene.** Reuse a scene when its step story fits;
   build a new one in `src/gl/scenes/` when the slide's idea deserves its own
   visual. A scene should *illustrate the slide's argument step by step*, not
   decorate it.
4. **Style** anything custom in the deck's `slides.css` under `.slide--<id>`, using
   tokens and the type ramp only.
5. **Verify**: screenshot the slide at its last step in both themes and look
   at it (see Verify below). Fix overlaps, clipping and contrast before
   reporting back.

## Slide object (decks/<deck>/slides.js)

```js
{
  id: 'pricing',            // stable kebab-case; CSS hook .slide--pricing
  title: 'Pricing',         // overview (O) + HUD
  scene: 'hub',             // name from src/gl/scenes/index.js, or null
  steps: 3,                 // default 1; step 0 shows on arrival
  layout: 'left',           // 'left' | 'right' | 'center' | 'full'
  frame: 'right',           // optional; scene placement 'right'|'left'|'center'
                            //   default: left→right, right→left, center/full→center
  sceneOpacity: 1,          // 0–1; ~0.6–0.9 behind centered copy
  chrome: true,             // false hides rail + HUD (covers, full-bleed slides)
  className: '',            // extra classes on the slide root
  blocks: [ /* see below */ ],
  html: `...`,              // custom markup, appended after blocks
  onStep({ root, step, stage }) {},  // optional custom JS per render
}
```

The URL carries position: `#4.2` = slide 4, step 2. Steps are 0-based.

## Blocks

Every block: `{ at, type, motion?, delay?, stagger?, className? }`.
`at` = the step it appears on. **Blocks never disappear** once shown, and hidden
blocks keep their space, so nothing reflows when the slide advances.

| type       | fields                                        | renders as |
|------------|-----------------------------------------------|------------|
| `eyebrow`  | `text`                                        | mono uppercase label, structure color |
| `hero`     | `text`                                        | `.t-hero` — the biggest; covers |
| `display`  | `text`                                        | `.t-display` — section openers |
| `title`    | `text`                                        | `.t-h1` — the normal slide title |
| `subtitle` | `text`                                        | `.t-h2` |
| `heading`  | `text`                                        | `.t-h3` |
| `lead`     | `text`                                        | `.t-lead` — one-breath setup, primary color |
| `body`     | `text`                                        | `.t-body` — detail, secondary color |
| `small`    | `text`                                        | `.t-small` — footnotes, asides |
| `quote`    | `text`, `src?`                                | ruled quote |
| `quoteBig` | `text`, `src?`                                | display-size quote |
| `mono`     | `text`, `ref?`                                | preformatted, escaped verbatim |
| `list`     | `items: [text]`, `ordered?`                   | dash or 01/02 list |
| `rows`     | `items: [{ from, to }]`                       | two-column mapping with arrows |
| `stats`    | `items: [{ n, decimals?, approx?, prefix?, unit?, key }]` or `val` | figures that count up |
| `table`    | `head: []`, `rows: [[]]`, `note?`, `ref?`     | mono table, first column = label |
| `image`    | `src`, `alt`, `caption?`, `width?`            | figure — keep the file in the deck folder and `import img from './x.png'` in slides.js so the build inlines it |
| `divider`  | —                                             | hairline rule |
| `spacer`   | `size?` (multiplier)                          | vertical space |
| `html`     | `html`                                        | raw markup among blocks |

**Inline markup** in any `text`/`items`/`key`/`note`:
`**bold**` · `*signal*` (amber — the thing that matters now) · `` `mono` `` ·
`[[detailId|label]]` (opens a sheet from `details.js`) · newline → line break.
Block text is escaped; only `html` is trusted as written.

## Custom HTML

Use `html` (on the slide or as a block) for anything blocks can't express.

- Reveal by step: `data-step="n"` on any element.
- Entrance: `data-motion="up|down|left|right|fade|scale|blur|mask|none"` (default `up`).
  `mask` is a left-to-right wipe — good for display type.
- Delay: `data-delay="200"` (ms).
- Stagger children: `data-stagger` on the parent (items arrive 70 ms apart).
- Expandable term: `<button class="ref" type="button" data-ref="id">label</button>`.

Utilities you can use in markup:

- Type: `.t-hero .t-display .t-h1 .t-h2 .t-h3 .t-lead .t-body .t-small .t-mono .t-eyebrow`
- Color: `.c-text .c-dim .c-faint .c-structure .c-signal`
- Layout: `.stack` (column, `--gap`), `.cols` (auto-fit grid, `--min`, `--gap`),
  `.cols-2`, `.cols-3`, `.card`, `.card--signal`, `.tag`, `.rule`
- Space tokens: `--space-1` … `--space-6`

## Design rules

- **Every color is a token.** Never write a literal color in a deck's slides.css or in
  inline styles — it will break one of the two themes. Use `--text`, `--dim`,
  `--faint`, `--structure`, `--signal`, `--ground`, `--surface`,
  `--surface-high`, `--line`, `--line-soft`, and the derived `--veil`,
  `--signal-wash`, `--structure-wash`, `--signal-halo`.
- **Color is state, not decoration.** Two accents only: `--structure`
  (slate: structure, keys, edges) and `--signal` (amber: the one thing that
  matters right now). Use signal sparingly — one highlight per step reads; five
  don't. Adding a third accent is a deliberate design decision; ask first.
- **Type comes from the ramp.** Use the `.t-*` classes or `var(--t-*)` sizes;
  don't invent font sizes. Sizes are vmin-based so slides scale as one picture.
- **One idea per step.** If a step reveals more than ~2 blocks, it probably
  wants to be two steps.
- **The scene and the copy tell the same story.** Each step that changes the
  copy should usually change the scene too (`step()` in the scene file).
- **Leave the scene room.** For `layout: 'left'`/`'right'`, keep the copy
  column under ~45% of the width; the stage solves the camera from where the
  copy actually ends. Over centered copy, lower `sceneOpacity`.

## Scenes

Shared scenes are registered in `src/gl/scenes/index.js`; deck-only scenes in
the deck's `index.js`. Shared library:

| scene      | what it is                                   | step story |
|------------|----------------------------------------------|------------|
| `drift`    | loose cloud, no structure                    | 1: a few nodes light |
| `path`     | cloud + a curve with a travelling pulse      | 1: path + pulse · 2: nearby nodes signal · 3: sample joins |
| `tree`     | 3-tier hierarchy                             | 1: tree lights · 2: one branch picked · 3: one leaf picked |
| `hub`      | shared core + 5 satellites                   | n: satellites 1…n live, newest in signal |
| `clusters` | three groups                                 | 1: first · 2: all three · 3: cross-links signal |
| `lattice`  | curved wall, core, three channels            | 1: wall · 2/3/4: channels 1/2/3 |
| `wave`     | tilted sheet with a travelling swell         | 1: sheet lights · 2: a band in signal |
| `aurora`   | custom shader plane (flowing noise)          | 0/1/2: faint → full → leaning signal |

### Building a new scene

Copy the closest existing scene into `decks/<deck>/scenes/<name>.js` and
register it in the deck's `index.js` (`export const scenes = { name }`). Change
its imports to `@engine/gl/field.js` / `@engine/gl/builders.js`. Contract:

```js
export default {
  camera: { z: 15, y: 0 },            // x is solved by the stage — never set it
  build() {                           // points + lines → a Field
    const rand = rng(1234)            // seeded: identical every run
    const nodes = [/* { x, y, z, size?, tone?, alpha?, drift? } */]
    const edges = [/* { a, b, tone?, alpha? } */]
    return { nodes, edges, meta: { /* indices you need in step() */ } }
  },
  // OR layer() { return { layer: new MyLayer(), meta } } for meshes/shaders (see aurora.js)
  setup(layer, meta) {},              // once; e.g. f.motion = (pos, base, t) => {...} (see wave.js)
  step(f, meta, n) {                  // re-interpret the slide's step
    f.reset()                         // back to authored tones
    if (n >= 1) f.setNode(i, 'signal', 1)
    if (n >= 2) f.setEdge(e, 'structure', 0.6)
  },
  tick(f, meta, t, step) {},          // per frame; skipped under reduced motion
}
```

- Tones: `off`, `dim`, `structure`, `signal`, `bright` (read from `--gl-*` in
  tokens.css, so scenes follow the theme automatically).
- Author geometry around the origin within roughly ±6 x, ±4 y. The stage
  measures the extent and solves distance/offset; you never hand-tune per
  screen size.
- `step()` should be **idempotent**: always `reset()` then apply everything up
  to step `n`, because the viewer can jump to any step directly.
- Helpers in `builders.js`: `box`, `blob`, `knit` (k-nearest edges), `curve`
  (Catmull-Rom), `chain` (consecutive edges).
- A custom Layer (meshes, shaders, textures) must implement: `group`,
  `extentX`, `extentY`, `opacity`, `setOpacity(v)`, `update(t, dt, still)`,
  `setScale(px)`, `snap()`, `dispose()`. Read colors with `toneColor(name)`
  and ease toward them in `update()` so theme switches fade.

## Decisions not to undo

- **WebGL colors parse with `LinearSRGBColorSpace`.** The shaders are raw
  `ShaderMaterial`s, so three never applies output conversion; parsing as sRGB
  darkens every tone to near-black.
- **The camera is solved, not tuned.** `Stage.frame()` computes distance and
  offset from the scene's extent and the copy's measured box. `Stage.MIN_BAND`
  is the one knob: below it, the scene slides under the copy instead of
  shrinking into a side ornament.
- **The no-WebGL fallback is mandatory.** A talk runs on hardware nobody has
  met; if the context fails, the deck stays navigable over a CSS composition.
- **Theme is applied before first paint** by the inline script in
  `index.html`. `src/engine/theme.js` mirrors its logic; keep them in sync.
- **`localStorage` is always inside `try`.** In a sandboxed iframe it throws;
  without the try the deck doesn't boot.
- **The theme toggle is `position: fixed`, not a grid cell.** A column would
  change `.content`'s width, which is what the camera solves against.
- **Reduced motion snaps everything**: no lerps, no drift, no counting, no
  `tick`. A slow asymptotic lerp is still motion.
- **The build is one self-contained file.** Fonts, JS and CSS inline; zero
  network requests. Don't add CDN links or runtime fetches. Import assets in
  JS so Vite inlines them.

## Verify

```bash
npm run dev                                            # http://localhost:5173
npm run verify -- --deck <deck>                        # navigation, panel, theme, fallback, a11y, console
npm run shots -- --deck <deck> 4.2                     # slide 4 step 2 → shots/<deck>/
npm run shots -- --deck <deck> --theme light 4.2
npm run shots -- --deck <deck> --all                   # every slide at its last step
npm run shots -- --deck <deck> --size 1280x720 4.2     # projector size
npm run build -- <deck>                                # dist/<deck>.html
DECK_URL="file:///<abs path>/dist/<deck>.html" npm run verify
```

After changing a slide, **read the screenshots** (dark and light) before
reporting it done. Check: copy not clipped, scene not sitting on the words,
signal used once per step, both themes legible. Screenshots wait 2.6 s of real
time because the camera and crossfade settle over ~2 s.

Verify adapts to the deck: checks that need a feature (a detail term, a stats
block) find a slide that has one and are skipped otherwise.

`scripts/` assume Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe`;
override with the `CHROME` env var.
