# Customizing the look

Everything visual comes from a few files. Change them and every slide follows.

| Want to change…           | Edit                                 | Affects        |
|---------------------------|--------------------------------------|----------------|
| Colors (both themes)      | `src/styles/tokens.css`              | all decks      |
| Font sizes, weights       | `src/styles/type.css`                | all decks      |
| Fonts themselves          | `src/styles/fonts.css` + `package.json` | all decks   |
| Spacing, animation speed  | `src/styles/tokens.css`              | all decks      |
| One slide's styling       | `decks/<deck>/slides.css`            | that deck only |
| Page title, help text     | `decks/<deck>/meta.js`               | that deck only |

## Colors

Colors are **tokens** — named values defined once per theme. Think of them as
color styles in Figma: change the style, every use updates.

```
tokens.css
├── dark theme   --ground  --text  --signal  …
└── light theme  --ground  --text  --signal  …   ← same names, different values
```

| Token                       | Role                                 |
|-----------------------------|--------------------------------------|
| `--ground`                  | page background                      |
| `--surface` `--surface-high`| cards and panels                     |
| `--line` `--line-soft`      | borders and rules                    |
| `--text` `--dim` `--faint`  | text, from strongest to softest      |
| `--structure`               | slate accent — structure             |
| `--signal`                  | amber accent — what matters now      |
| `--gl-*`                    | the same roles, tuned for the 3D scenes |

**To rebrand:** change the values in **both** theme sections. Keep each light
value readable on the light background and each dark value on the dark one.
The `--gl-*` set is separate because a dot on black and a dot on paper need
different values to look equally strong.

**Never type a raw color** (like `#ff0000`) in a slide's CSS. It will look
fine in one theme and break in the other. Always use `var(--token)`.

## Type

| Class        | Use                | Block type  |
|--------------|--------------------|-------------|
| `.t-hero`    | covers             | `hero`      |
| `.t-display` | section openers    | `display`   |
| `.t-h1`      | slide titles       | `title`     |
| `.t-h2`      | subtitles          | `subtitle`  |
| `.t-h3`      | small headings     | `heading`   |
| `.t-lead`    | one strong sentence| `lead`      |
| `.t-body`    | paragraphs         | `body`      |
| `.t-small`   | footnotes          | `small`     |
| `.t-mono`    | code, numbers      | `mono`      |
| `.t-eyebrow` | tiny labels        | `eyebrow`   |

Sizes scale with the screen, so a laptop and a projector show the same
picture. Change sizes in `type.css` rather than inventing new ones per slide.

### Swapping fonts

1. Install the font package (e.g. `npm install @fontsource-variable/inter`).
2. Point the `@font-face` rules in `src/styles/fonts.css` at its files.
3. Update `--font-sans` / `--font-mono` in `tokens.css`.

Fonts are packed inside the export, so pick files, not a web link.

## Spacing and motion

In `tokens.css`:

| Token                      | Controls                          |
|----------------------------|-----------------------------------|
| `--space-1` … `--space-6`  | the spacing scale                 |
| `--pad-x` `--pad-y`        | margins around each slide         |
| `--step-in`                | how long an entrance takes        |
| `--stagger`                | gap between list items arriving   |
| `--ease`                   | the motion curve                  |

## Styling one slide

Every slide gets a class from its `id`. Scope your rules to it:

```css
/* decks/my-talk/slides.css */
.slide--pricing .card {
  border-color: var(--signal);
  padding: var(--space-4);
}
```

## Deck text (meta.js)

| Field          | What it is                                  |
|----------------|---------------------------------------------|
| `title`        | the browser tab title                       |
| `description`  | summary for link previews                   |
| `hint`         | small hint, bottom-right, before first move |
| `hintTouched`  | the hint after the viewer has moved         |
| `shortcuts`    | rows in the `?` help card                   |

Next: [Detail sheets](./detail-sheets.md)
