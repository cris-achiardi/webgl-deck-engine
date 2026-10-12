import { esc, inline, fmtNum } from './text.js'

/**
 * Block renderers. A block is one piece of a slide:
 *   { at, type, motion?, delay?, stagger?, className?, ...type fields }
 *
 * `at` is the step the block appears on. Blocks never leave: the line already
 * read must not move. Hidden blocks stay in flow so nothing reflows on advance.
 *
 * Type → text style comes from the ramp in src/styles/type.css. See CLAUDE.md
 * for the full block reference.
 */

const textBlock = (tag, cls) => (b) => `<${tag} class="${cls}">${inline(b.text)}</${tag}>`

const refButton = (id, details) =>
  `<button class="ref" type="button" data-ref="${esc(id)}">${esc(
    details[id]?.path || details[id]?.title || id
  )}</button>`

const RENDER = {
  eyebrow: textBlock('p', 't-eyebrow'),
  hero: textBlock('h1', 't-hero'),
  display: textBlock('h1', 't-display'),
  title: textBlock('h2', 't-h1'),
  subtitle: textBlock('h3', 't-h2'),
  heading: textBlock('h4', 't-h3'),
  lead: textBlock('p', 't-lead'),
  body: textBlock('p', 't-body'),
  small: textBlock('p', 't-small'),

  quote: (b) => `<blockquote class="quote">
      ${inline(b.text)}
      ${b.src ? `<cite class="quote__src">${inline(b.src)}</cite>` : ''}
    </blockquote>`,

  quoteBig: (b) => `<blockquote class="quote quote--display">
      ${inline(b.text)}
      ${b.src ? `<cite class="quote__src">${inline(b.src)}</cite>` : ''}
    </blockquote>`,

  /** Preformatted. Escaped verbatim — no inline markup. */
  mono: (b, { details }) =>
    `<pre class="mono">${esc(b.text)}</pre>${
      b.ref ? `<p class="t-body block__ref">${refButton(b.ref, details)}</p>` : ''
    }`,

  /** { items: [string], ordered?: bool } */
  list: (b) => {
    const tag = b.ordered ? 'ol' : 'ul'
    return `<${tag} class="list${b.ordered ? ' list--ordered' : ''}"${
      b.stagger ? ' data-stagger' : ''
    }>${b.items.map((it) => `<li>${inline(it)}</li>`).join('')}</${tag}>`
  },

  /** { items: [{ from, to }] } — a two-column mapping with an arrow. */
  rows: (b) =>
    `<ul class="rows"${b.stagger ? ' data-stagger' : ''}>${b.items
      .map(
        (r) => `<li class="row">
          <span class="row__from">${inline(r.from)}</span>
          <span class="row__arrow" aria-hidden="true"></span>
          <span class="row__to">${inline(r.to)}</span>
        </li>`
      )
      .join('')}</ul>`,

  /**
   * { items: [{ n, decimals?, approx?, prefix?, unit?, key }] }
   * `n` counts up from 0 when the step arrives. Use `val` (string) instead of
   * `n` for a figure that should not animate.
   */
  stats: (b) =>
    `<dl class="stats"${b.stagger ? ' data-stagger' : ''}>${b.items
      .map((s) => {
        const decimals = s.decimals || 0
        const num =
          s.n != null
            ? `<span class="stat__num" data-n="${s.n}" data-decimals="${decimals}">${esc(
                fmtNum(s.n, decimals)
              )}</span>`
            : `<span>${inline(s.val ?? '')}</span>`
        return `<div class="stat">
          <dt class="stat__val">${s.approx ? '<i class="stat__approx">~</i>' : ''}${
            s.prefix ? `<em>${esc(s.prefix)}</em>` : ''
          }${num}${s.unit ? ` <em>${esc(s.unit)}</em>` : ''}</dt>
          <dd class="stat__key">${inline(s.key ?? '')}</dd>
        </div>`
      })
      .join('')}</dl>`,

  /** { head: [..], rows: [[..]], note?, ref? } — first column is the label, the rest tabular. */
  table: (b, { details }) =>
    `<div class="tablewrap"><table class="table">
      <thead><tr>${b.head
        .map((h, i) => `<th${i ? ' class="table__num"' : ''}>${inline(h)}</th>`)
        .join('')}</tr></thead>
      <tbody>${b.rows
        .map(
          (r) =>
            `<tr>${r
              .map((c, i) => `<td${i ? ' class="table__num"' : ''}>${inline(c)}</td>`)
              .join('')}</tr>`
        )
        .join('')}</tbody>
    </table></div>${b.note ? `<p class="table__note">${inline(b.note)}</p>` : ''}${
      b.ref ? `<p class="t-body block__ref">${refButton(b.ref, details)}</p>` : ''
    }`,

  /** { src, alt, caption?, width? } — import the file in slides.js so the build inlines it. */
  image: (b) =>
    `<figure class="figure"${b.width ? ` style="--w:${esc(b.width)}"` : ''}>
      <img src="${esc(b.src)}" alt="${esc(b.alt ?? '')}" />
      ${b.caption ? `<figcaption class="figure__cap">${inline(b.caption)}</figcaption>` : ''}
    </figure>`,

  divider: () => `<hr class="rule" />`,
  spacer: (b) => `<div class="spacer" style="--h:${esc(b.size ?? '1')}"></div>`,

  /** Raw markup, trusted as written. Same as a slide's `html`, but placed among blocks. */
  html: (b) => b.html,
}

export function renderBlock(b, ctx) {
  const el = document.createElement('div')
  el.className = 'block' + (b.className ? ` ${b.className}` : '')
  el.dataset.step = b.at ?? 0
  if (b.motion) el.dataset.motion = b.motion
  if (b.delay) el.style.setProperty('--delay', `${b.delay}ms`)
  const fn = RENDER[b.type]
  if (!fn) console.warn(`[deck] unknown block type "${b.type}" — rendered as body`)
  el.innerHTML = (fn || RENDER.body)(b, ctx)
  return el
}

export const BLOCK_TYPES = Object.keys(RENDER)
