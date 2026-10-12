import { esc, pad } from './text.js'
import { applyTheme, currentTheme, resolveTheme } from './theme.js'

/**
 * Dev-only landing page: one row per folder in decks/. Never part of a build —
 * a build always has a fixed deck.
 */
export async function showPicker({ decks, loadMeta, missing }) {
  applyTheme(resolveTheme(), { persist: false })
  document.title = 'Decks'
  document.body.classList.add('is-picker')
  document.getElementById('stage').hidden = true

  const metas = await Promise.all(decks.map((d) => loadMeta(d).catch(() => null)))
  const theme = new URLSearchParams(location.search).get('theme')
  const href = (d) => `?deck=${encodeURIComponent(d)}${theme ? `&theme=${theme}` : ''}`

  const content = document.getElementById('content')
  content.innerHTML = `
    <section class="slide picker">
      <p class="t-eyebrow">WebGL Deck Engine</p>
      <h1 class="t-h1">Decks</h1>
      ${
        missing
          ? `<p class="t-body">No deck named <code>${esc(missing)}</code>. Pick one below, or create it with <code>npm run new ${esc(missing)}</code>.</p>`
          : ''
      }
      <ol class="picker__list">
        ${decks
          .map(
            (d, i) => `<li><a class="picker__item" href="${href(d)}">
              <span class="picker__num">${pad(i + 1)}</span>
              <span class="picker__title">${esc(metas[i]?.title || d)}</span>
              <span class="picker__slug">${esc(d)}</span>
            </a></li>`
          )
          .join('')}
      </ol>
      <p class="t-small">New deck: <code>npm run new &lt;name&gt;</code> · Export: <code>npm run build -- &lt;name&gt;</code></p>
    </section>`

  document.getElementById('theme').addEventListener('click', (e) => {
    const b = e.target.closest('.theme__opt')
    if (!b) return
    applyTheme(b.dataset.themeOpt)
    paint()
  })
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 't' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark')
      paint()
    }
  })
  const paint = () =>
    document.querySelectorAll('.theme__opt').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.themeOpt === currentTheme()))
    })
  paint()
}
