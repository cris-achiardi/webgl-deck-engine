# Writing slides

All slides live in `decks/<your-deck>/slides.js`, in order, one after another.

## A slide

```js
{
  id: 'pricing',          // short name, no spaces
  title: 'Pricing',       // shown in the overview (O)
  scene: 'hub',           // the 3D visual, or null for none
  steps: 3,               // how many arrow presses this slide has
  layout: 'left',         // where the text sits
  blocks: [
    { at: 0, type: 'title', text: 'Three plans' },
    { at: 1, type: 'lead',  text: 'Everyone starts *free*.' },
    { at: 2, type: 'list',  items: ['Free', 'Team', 'Enterprise'] },
  ],
}
```

`at` is the step a block appears on. Steps start at **0** (what shows when you
arrive).

## Layouts

```
 left                right               center              full
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Text   ·  ·  │    │  · ·    Text │    │   · Text ·   │    │ Text spans   │
│ Text  · ·  · │    │ ·  · ·  Text │    │  ·  Text  ·  │    │ the whole    │
│ Text   ·  ·  │    │  · ·    Text │    │   ·  ·  ·    │    │ width        │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
  scene on right      scene on left      scene behind        scene behind
```

## Other slide options

| Option         | What it does                                          | Example        |
|----------------|-------------------------------------------------------|----------------|
| `sceneOpacity` | Fades the scene (0–1). Use ~0.7 behind centered text. | `0.75`         |
| `chrome`       | `false` hides the progress bar and labels. For covers. | `false`        |
| `frame`        | Forces scene placement: `'left'` `'right'` `'center'` | `'center'`     |
| `className`    | Extra CSS class on the slide                           | `'dark-cover'` |

## Blocks

| Type       | What it looks like                    | Fields                  |
|------------|---------------------------------------|-------------------------|
| `eyebrow`  | small uppercase label                 | `text`                  |
| `hero`     | the biggest text — covers             | `text`                  |
| `display`  | very big — section openers            | `text`                  |
| `title`    | normal slide title                    | `text`                  |
| `subtitle` | second-level heading                  | `text`                  |
| `heading`  | third-level heading                   | `text`                  |
| `lead`     | one strong sentence                   | `text`                  |
| `body`     | regular paragraph, softer color       | `text`                  |
| `small`    | footnote                              | `text`                  |
| `quote`    | quote with a rule                     | `text`, `src`           |
| `quoteBig` | big quote                             | `text`, `src`           |
| `list`     | dashed or numbered list               | `items`, `ordered`      |
| `rows`     | "this → that" pairs                   | `items: [{from, to}]`   |
| `stats`    | numbers that count up                 | `items: [{n, unit, key}]` |
| `table`    | simple table                          | `head`, `rows`, `note`  |
| `mono`     | code, shown exactly as typed          | `text`                  |
| `image`    | a picture                             | `src`, `alt`, `caption` |
| `divider`  | thin line                             | —                       |
| `spacer`   | empty space                           | `size`                  |
| `html`     | anything custom                       | `html`                  |

**Images:** put the file in the deck folder and import it at the top of
`slides.js` (`import photo from './photo.png'`), then use `src: photo`. That's
what lets the export carry the image inside it.

## How things enter

Add `motion` to any block:

| `motion` | Enters…                    |
|----------|----------------------------|
| `up` (default) | sliding up            |
| `down` `left` `right` | from that side |
| `fade`   | fading in                  |
| `scale`  | growing slightly           |
| `blur`   | coming into focus          |
| `mask`   | wiping left to right — great for big type |
| `none`   | instantly                  |

Also: `delay: 200` (milliseconds) and `stagger: true` (list items arrive one by one).

## Formatting inside text

| Write                | Get                                      |
|----------------------|------------------------------------------|
| `**bold**`           | **bold**                                 |
| `*word*`             | the word in amber (signal)               |
| `` `code` ``         | monospace                                |
| `[[pricing\|plans]]` | a dotted word that opens a side panel — see [Detail sheets](./detail-sheets.md) |
| a new line           | a line break                             |

## When blocks aren't enough

Use `html` for custom layouts (grids, cards, diagrams). Inside it:

| Add to an element     | Effect                               |
|-----------------------|--------------------------------------|
| `data-step="2"`       | appears on step 2                    |
| `data-motion="fade"`  | how it enters                        |
| `data-delay="200"`    | waits 200 ms                         |
| `data-stagger`        | its children arrive one by one       |

Ready-made classes: `.cols-2` `.cols-3` `.card` `.card--signal` `.tag` `.stack`,
plus the type classes `.t-h1` `.t-lead` `.t-body`… Style anything else in the
deck's `slides.css` under `.slide--<id>`.

## Rules of thumb

- **One idea per step.** More than ~2 blocks on a step? Split it.
- **Amber once per step.** It's a highlighter, not a theme color.
- **Keep text under half the width** on `left`/`right` layouts so the scene has room.

See every block in action in `decks/example/slides.js`.

Next: [Scenes](./scenes.md)
