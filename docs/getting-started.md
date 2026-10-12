# Getting started

## What you need

- [Node.js](https://nodejs.org) 20 or newer
- Google Chrome (only for the checking/screenshot tools)

## First run

```bash
npm install
npm run dev
```

Open **http://localhost:5173**. You'll see a list of decks. Click one.

## Make your own deck

```bash
npm run new my-talk -- --title "My Talk"
```

This copies `templates/deck/` into `decks/my-talk/` with your title filled in.
Open it at `http://localhost:5173/?deck=my-talk`.

```
decks/my-talk/
├── slides.js     ← your slides. You'll spend most of your time here.
├── slides.css    ← styles for individual slides
├── details.js    ← click-to-expand side panels
├── meta.js       ← page title, help text
└── index.js      ← connects the files above (rarely touched)
```

Save a file and the browser updates on its own.

## Using this repo as a GitHub template

After you click **Use this template**:

| Do this                                         | Why                                     |
|-------------------------------------------------|-----------------------------------------|
| Keep `decks/example/`                           | It shows every feature. Copy from it.   |
| Delete any deck you don't need                  | Each folder in `decks/` is one deck.    |
| `npm run new <name>` for each new talk          | Starts you from a clean template.       |
| Change colors/fonts in `src/styles/` if you want | See [Customizing the look](./customizing.md). |

> **Tip:** a deck folder whose name starts with `_` (like `_drafts`) is hidden
> from the list.

## Moving around a deck

| Key                      | Does                              |
|--------------------------|-----------------------------------|
| `→` `Space` `↓`          | next step, then next slide        |
| `←` `↑`                  | previous step                     |
| `Home` / `End`           | first / last slide                |
| `O`                      | overview of all slides            |
| `T`                      | switch dark / light               |
| `F`                      | fullscreen                        |
| `?`                      | show the controls                 |
| `Esc`                    | close whatever is open            |

On a phone or tablet: tap the right half to go forward, left half to go back.

The web address remembers where you are: `#4.2` means slide 4, step 2. Share
that link and it opens right there.

Next: [How it works](./how-it-works.md)
