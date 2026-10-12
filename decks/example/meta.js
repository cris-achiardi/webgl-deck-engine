/**
 * Document-level copy and the deck's own chrome text.
 */
export const meta = {
  title: 'WebGL Deck Engine',
  description: 'A template for HTML slide decks with WebGL scenes, step motion and light/dark themes.',

  /** Bottom-right HUD hint, before and after the viewer has navigated once. */
  hint: '→ advance · click a term to expand · O overview',
  hintTouched: '? controls',

  /** The help card (? key). [key, what it does] */
  shortcuts: [
    ['→  Space', 'Next step, then next slide'],
    ['←', 'Previous step'],
    ['Home / End', 'First / last slide'],
    ['Click a term', 'Open its detail sheet — does not advance'],
    ['O', 'Overview of all slides'],
    ['T', 'Theme — dark / light'],
    ['F', 'Fullscreen'],
    ['Esc', 'Close'],
  ],
}
