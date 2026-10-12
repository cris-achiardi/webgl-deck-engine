/* Text helpers shared by the block renderers. */

export const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * Inline markup for authored copy.
 *   **bold**  ·  *signal*  ·  `mono`  ·  [[detailId|expandable term]]  ·  newline → <br>
 * Everything is escaped first, so block copy can never inject markup.
 * (Slides that need real markup use `html`, which is trusted as written.)
 */
export function inline(src) {
  return esc(src)
    .replace(
      /\[\[([\w-]+)\|([^\]]+)\]\]/g,
      (_, id, label) => `<button class="ref" type="button" data-ref="${id}">${label}</button>`
    )
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br />')
}

/**
 * Figures are authored as numbers, not text, so grouping comes from the locale
 * and the counter has a real number to animate.
 */
export function fmtNum(n, decimals = 0, locale = 'en-US') {
  return Number(n).toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: 'always',
  })
}

export const pad = (n) => String(n).padStart(2, '0')
