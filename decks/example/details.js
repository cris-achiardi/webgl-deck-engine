/**
 * Detail sheets — opened by [[id|label]] in any block text, or by `ref: 'id'`
 * on a mono/table block. Clicking a term opens the side panel without moving
 * the deck: progressive disclosure for the audience.
 *
 *   kind   small amber label above the title (free text: 'file', 'source', 'note'…)
 *   path   small grey line under it — a file path, URL or citation
 *   title  the sheet's heading
 *   note   optional intro paragraph (trusted HTML: <strong>, <em>, <code>)
 *   body   optional preformatted block (trusted HTML, escape < > & by hand).
 *          Three tags carry meaning: <b> the line that matters,
 *          <i> signal (amber), <u> structure (slate)
 *   html   optional free markup appended after body
 */
export const details = {
  stepModel: {
    kind: 'engine',
    path: 'src/deck/slides.js',
    title: 'How a slide is built',
    note: 'A slide is a list of blocks. Each block has an <code>at</code> — the step it appears on. <strong>Blocks never leave</strong>, so the line already read never moves.',
    body: `{
  <u>id</u>: 'example',
  <u>title</u>: 'Shown in the overview and HUD',
  <u>scene</u>: 'tree',          <i>// WebGL scene, or null</i>
  <u>steps</u>: 3,
  <u>layout</u>: 'left',         <i>// left · right · center · full</i>
  <u>blocks</u>: [
    { at: 0, type: 'title', text: 'Appears first' },
    { at: 1, type: 'lead',  text: 'Then this' },
    <b>{ at: 2, type: 'list', items: [...], stagger: true },</b>
  ],
}`,
  },

  theming: {
    kind: 'tokens',
    path: 'src/styles/tokens.css',
    title: 'Every color is a token',
    note: 'Both themes define the same names. HTML uses <code>--text</code>, <code>--dim</code>, <code>--structure</code>, <code>--signal</code>…; WebGL uses the <code>--gl-*</code> set.',
    body: `<u>:root[data-theme='dark']</u>  {
  --ground: #0a0c0f;
  --text:   #e8eaee;
  <i>--signal: #e4a33c;</i>
}
<u>:root[data-theme='light']</u> {
  --ground: #f3f1ec;
  --text:   #14171c;
  <i>--signal: #a8620a;</i>
}`,
  },
}
