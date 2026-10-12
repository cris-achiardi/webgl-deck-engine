# Detail sheets

A detail sheet is a side panel that opens when someone clicks a dotted word.
The slide doesn't move. Use it for "if you're curious" content: sources,
code, definitions.

```
┌────────────────────────────┬─────────────────┐
│ We cut build time with     │ FILE            │
│ a ┄┄┄┄┄┄┄┄┄┄ cache.        │ src/cache.js    │
│   shared                   │ Shared cache    │
│     ↑ click                │                 │
│                            │ The details…    │
└────────────────────────────┴─────────────────┘
```

## Two steps

**1. Write the sheet** in `decks/<deck>/details.js`:

```js
export const details = {
  cache: {
    kind: 'file',                 // small amber label
    path: 'src/cache.js',         // small grey line (path, link, source)
    title: 'Shared cache',
    note: 'One cache for <strong>every</strong> team.',
  },
}
```

**2. Link to it** from any text with `[[id|word]]`:

```js
{ at: 1, type: 'body', text: 'We cut build time with a [[cache|shared cache]].' }
```

## Fields

| Field   | Shows                                              |
|---------|----------------------------------------------------|
| `kind`  | small amber label on top (any word: file, source, note) |
| `path`  | grey line under it                                 |
| `title` | the heading                                        |
| `note`  | an intro paragraph                                 |
| `body`  | a code-style block. `<b>` = important line, `<i>` = amber, `<u>` = slate |
| `html`  | anything custom, added at the end                  |

`mono` and `table` blocks can open a sheet too: add `ref: 'cache'` to them.

Next: [Presenting & exporting](./presenting.md)
