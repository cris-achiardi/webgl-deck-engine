# WebGL Deck Engine

One engine, many decks. HTML slide decks with WebGL scenes that react to every
step, step-by-step reveals with motion, keyboard navigation, light/dark
themes, and a build that outputs **one self-contained HTML file per deck**.

Built to be driven by an AI assistant: describe a deck slide by slide, and the
assistant edits `decks/<deck>/slides.js` following [`CLAUDE.md`](./CLAUDE.md).

**New here? Read the [docs](./docs/README.md).** AI agents start at
[`AGENTS.md`](./AGENTS.md).

## Use

```bash
npm install
npm run dev                          # http://localhost:5173 — pick a deck
npm run new my-talk -- --title "My Talk"   # new deck from templates/deck
npm run build -- my-talk             # dist/my-talk.html — fully inlined, no network
npm run build -- --all               # every deck
```

Open a deck directly with `http://localhost:5173/?deck=my-talk`.

| Key | Action |
|---|---|
| `→` `Space` `↓` `PgDn` | next step, then next slide |
| `←` `↑` `PgUp` | previous step |
| `Home` / `End` | first / last slide |
| click a dotted term | open its detail sheet (does not advance) |
| `O` | overview of all slides |
| `T` | theme — dark / light |
| `F` | fullscreen |
| `?` | controls |
| `Esc` | close |

On touch screens, tap the right half to advance and the left half to go back.

The URL carries the position (`#4.2` = slide 4, step 2), so any link opens
exactly where you want. `theme=light` in the query pins a theme; otherwise the
deck uses the viewer's last choice, then their OS setting.

## Decks

```
decks/
  example/           reference deck showing every feature
  my-talk/           your deck (npm run new): slides.js · details.js · meta.js · slides.css · scenes/
templates/deck/      what `npm run new` copies
```

The engine in `src/` is shared, so a fix or a new feature reaches every deck.
Exported files in `dist/` are frozen snapshots and never change afterwards.

## Describing a slide

Tell the assistant which deck, then per slide: what it says, how it's laid
out, what appears on each arrow press, and what the visual should show:

> my-talk, slide 3: title "Three teams, one library". Layout left. Use
> the `hub` scene. Step 1: a stat row — 3 teams, 140 components, 12 releases.
> Step 2: a body line saying adoption doubled, with "doubled" in signal.

## Structure

```
decks/          one folder per deck
src/styles/     tokens · type ramp · engine chrome · blocks · motion
src/gl/         stage (camera, crossfade, fallback) · field (points+lines) · scenes/ (shared)
src/engine/     app (navigation, panel, overview) · blocks · theme · picker
scripts/        build · new-deck · verify · shots
```

## Verify

```bash
npm run dev
npm run verify -- --deck my-talk
npm run shots -- --deck my-talk --all          # and --theme light
```
