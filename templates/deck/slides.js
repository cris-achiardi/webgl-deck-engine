/**
 * "__TITLE__" — one entry per slide, in order.
 *
 * Field and block reference: CLAUDE.md. Working examples of every feature:
 * decks/example/slides.js.
 */

export const slides = [
  /* 01 — cover ------------------------------------------------------------- */
  {
    id: 'cover',
    title: '__TITLE__',
    scene: 'drift',
    steps: 2,
    chrome: false,
    blocks: [
      { at: 0, type: 'eyebrow', text: 'Event · Date' },
      { at: 0, type: 'hero', text: '__TITLE__', motion: 'mask' },
      { at: 1, type: 'lead', text: 'One line on what this talk is about.' },
    ],
  },

  /* 02 ---------------------------------------------------------------------- */
  {
    id: 'first-idea',
    title: 'First idea',
    scene: 'tree',
    steps: 3,
    blocks: [
      { at: 0, type: 'title', text: 'Slide title' },
      { at: 1, type: 'lead', text: 'What this slide argues, in one breath.' },
      { at: 2, type: 'body', text: 'Supporting detail, with the *one thing* that matters in signal.' },
    ],
  },

  /* 03 — close -------------------------------------------------------------- */
  {
    id: 'close',
    title: 'Close',
    scene: 'wave',
    steps: 2,
    layout: 'center',
    sceneOpacity: 0.75,
    blocks: [
      { at: 0, type: 'quoteBig', text: 'Thank you.' },
      { at: 1, type: 'eyebrow', text: 'name · link' },
    ],
  },
]
