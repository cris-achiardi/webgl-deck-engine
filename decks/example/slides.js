/**
 * THE DECK. One entry per slide, in order. This file is the only content source
 * the engine reads (plus details.js for the side-panel sheets and meta.js for
 * the page title and help text).
 *
 * Slide fields
 *   id            stable, kebab-case. Becomes the CSS hook `.slide--<id>`.
 *   title         shown in the overview (O) and the HUD
 *   scene         WebGL scene name from src/gl/scenes/index.js, or null for none
 *   steps         how many steps the slide has (default 1). Step 0 is on arrival.
 *   layout        'left' (default) · 'right' · 'center' · 'full'
 *   frame         where the scene sits: 'right' · 'left' · 'center'
 *                 (default follows layout: left→right, right→left, center/full→center)
 *   sceneOpacity  0–1, dims the scene for this slide (e.g. behind centered copy)
 *   chrome        false hides the rail and HUD on this slide
 *   className     extra classes on the slide root
 *   blocks        [{ at, type, ... }] — see CLAUDE.md for every block type
 *   html          custom markup, appended after blocks. Use data-step="n" on
 *                 elements to reveal them on step n; data-motion / data-delay /
 *                 data-stagger for motion. Trusted as written.
 *   onStep        ({ root, step, stage }) => void — runs after every render of
 *                 this slide, for custom JS motion
 *
 * Inline markup in any block text:
 *   **bold**   *signal (amber)*   `mono`   [[detailId|expandable term]]
 */

export const slides = [
  /* 01 — cover ------------------------------------------------------------- */
  {
    id: 'cover',
    title: 'WebGL Deck Engine',
    scene: 'drift',
    steps: 2,
    chrome: false,
    blocks: [
      { at: 0, type: 'eyebrow', text: 'Template · v0.1' },
      { at: 0, type: 'hero', text: 'WebGL Deck\nEngine', motion: 'mask' },
      {
        at: 1,
        type: 'lead',
        text: 'Describe a deck slide by slide. Each one gets its own layout, a *WebGL scene* that reacts to every step, and motion — in dark or light.',
      },
    ],
  },

  /* 02 — type ramp ---------------------------------------------------------- */
  {
    id: 'type',
    title: 'Type ramp',
    scene: null,
    layout: 'full',
    html: `
      <div class="ramp" data-stagger>
        <div class="ramp__row"><span class="ramp__tag">hero</span><span class="t-hero">Hero</span></div>
        <div class="ramp__row"><span class="ramp__tag">display</span><span class="t-display">Display</span></div>
        <div class="ramp__row"><span class="ramp__tag">h1 · title</span><span class="t-h1">Heading one</span></div>
        <div class="ramp__row"><span class="ramp__tag">h2 · subtitle</span><span class="t-h2">Heading two</span></div>
        <div class="ramp__row"><span class="ramp__tag">h3 · heading</span><span class="t-h3">Heading three</span></div>
        <div class="ramp__row"><span class="ramp__tag">lead</span><span class="t-lead">A lead sets up the idea in one breath.</span></div>
        <div class="ramp__row"><span class="ramp__tag">body</span><span class="t-body">Body copy carries the detail, in the secondary tone, with <strong>bold</strong> and <em>signal</em>.</span></div>
        <div class="ramp__row"><span class="ramp__tag">small</span><span class="t-small">Small is for footnotes, captions and asides.</span></div>
        <div class="ramp__row"><span class="ramp__tag">mono</span><span class="t-mono c-dim">src/deck/slides.js — code, paths, figures</span></div>
        <div class="ramp__row"><span class="ramp__tag">eyebrow</span><span class="t-eyebrow">Eyebrow · section label</span></div>
      </div>
    `,
  },

  /* 03 — blocks and steps --------------------------------------------------- */
  {
    id: 'blocks',
    title: 'Blocks and steps',
    scene: 'tree',
    steps: 4,
    blocks: [
      { at: 0, type: 'eyebrow', text: 'Building a slide' },
      { at: 0, type: 'title', text: 'Every arrow press is a step' },
      {
        at: 1,
        type: 'lead',
        text: 'A slide is a list of [[stepModel|blocks]]. Each one names the step it arrives on, and the scene re-reads the same step.',
      },
      {
        at: 2,
        type: 'list',
        stagger: true,
        items: [
          '**Blocks stay put** once shown — nothing reflows',
          'The scene lights one *branch* per step',
          'The URL carries the position: `#3.2`',
        ],
      },
      {
        at: 3,
        type: 'rows',
        items: [
          { from: 'step 1', to: 'the whole tree' },
          { from: 'step 2', to: 'one branch is *picked*' },
          { from: 'step 3', to: 'one leaf of it' },
        ],
      },
    ],
  },

  /* 04 — figures ------------------------------------------------------------ */
  {
    id: 'figures',
    title: 'Figures that count',
    scene: 'hub',
    steps: 4,
    blocks: [
      { at: 0, type: 'eyebrow', text: 'Stats block' },
      { at: 0, type: 'title', text: 'Numbers count up when they arrive' },
      {
        at: 1,
        type: 'stats',
        stagger: true,
        items: [
          { n: 8, key: 'scenes included' },
          { n: 20, key: 'block types' },
          { n: 2, key: 'themes' },
        ],
      },
      {
        at: 2,
        type: 'body',
        text: 'Figures are authored as **numbers**, not text — the engine formats and animates them. Under reduced motion they simply appear.',
      },
      { at: 3, type: 'small', text: 'Each step lights one more satellite in the scene.' },
    ],
  },

  /* 05 — fully custom ------------------------------------------------------- */
  {
    id: 'custom',
    title: 'Fully custom slide',
    scene: 'aurora',
    steps: 3,
    layout: 'center',
    sceneOpacity: 0.9,
    html: `
      <p class="t-eyebrow" data-step="0">Custom HTML</p>
      <h2 class="t-display" data-step="0" data-motion="blur">Design each slide</h2>
      <p class="t-lead" data-step="0" data-delay="120">Write any markup. Reveal pieces by step, pick their motion, style them in <code>slides.css</code>.</p>
      <div class="cols-3 custom__cards" data-step="1" data-stagger>
        <article class="card">
          <span class="tag">data-step</span>
          <p class="t-small">Which step reveals it</p>
        </article>
        <article class="card">
          <span class="tag">data-motion</span>
          <p class="t-small">up · fade · scale · blur · mask…</p>
        </article>
        <article class="card">
          <span class="tag">data-stagger</span>
          <p class="t-small">Children arrive one by one</p>
        </article>
      </div>
      <p class="t-body" data-step="2" data-motion="scale">The scene behind is a <em>custom shader layer</em>, not points — and it reads the theme too.</p>
    `,
  },

  /* 06 — mirrored layout ---------------------------------------------------- */
  {
    id: 'mirrored',
    title: 'Copy right, scene left',
    scene: 'clusters',
    steps: 4,
    layout: 'right',
    blocks: [
      { at: 0, type: 'eyebrow', text: 'layout: right' },
      { at: 0, type: 'title', text: 'The camera solves itself' },
      {
        at: 1,
        type: 'body',
        text: 'The stage measures where the copy actually ends and frames the scene in the free space — on either side, at any screen size.',
      },
      {
        at: 2,
        type: 'table',
        head: ['token', 'dark', 'light'],
        rows: [
          ['ground', '#0a0c0f', '#f3f1ec'],
          ['text', '#e8eaee', '#14171c'],
          ['*signal*', '#e4a33c', '#a8620a'],
        ],
        note: 'Every color is a [[theming|token]] defined once per theme. Press T to swap.',
      },
      { at: 3, type: 'small', text: 'Step 3 lights the links between the clusters.' },
    ],
  },

  /* 07 — close -------------------------------------------------------------- */
  {
    id: 'close',
    title: 'Close',
    scene: 'wave',
    steps: 3,
    layout: 'center',
    sceneOpacity: 0.75,
    blocks: [
      { at: 0, type: 'quoteBig', text: 'Describe the next slide.' },
      { at: 1, type: 'body', text: 'Ask for a slide in plain words — layout, scene, what appears on each step.' },
      { at: 2, type: 'eyebrow', text: 'npm run dev · npm run build' },
    ],
  },
]
