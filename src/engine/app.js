import { esc, fmtNum, pad } from './text.js'
import { renderBlock } from './blocks.js'
import { applyTheme, currentTheme, followOS, readPalette, resolveTheme } from './theme.js'
import { Stage } from '../gl/stage.js'

/**
 * Boot one deck: build the chrome, wire input, start the WebGL stage.
 * `deck` is the module exported by decks/<name>/index.js.
 */
export function startDeck({ slides, details = {}, meta, scenes = {} }) {
  /* -- elements --------------------------------------------------------------- */

  const $ = (id) => document.getElementById(id)
  const els = {
    deck: $('deck'),
    rail: $('rail'),
    content: $('content'),
    hudPos: $('hud-pos'),
    hudHint: $('hud-hint'),
    panel: $('panel'),
    panelKind: $('panel-kind'),
    panelPath: $('panel-path'),
    panelTitle: $('panel-title'),
    panelBody: $('panel-body'),
    panelClose: $('panel-close'),
    overview: $('overview'),
    overviewGrid: $('overview-grid'),
    help: $('help'),
    helpList: $('help-list'),
    canvas: $('stage'),
    fallback: $('stage-fallback'),
    theme: $('theme'),
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const state = { c: 0, s: 0, touched: false, openRef: null }
  let stage = null

  /* -- slide defaults ----------------------------------------------------------- */

  const LAYOUT_FRAME = { left: 'right', right: 'left', center: 'center', full: 'center' }
  const layoutOf = (sl) => sl.layout || 'left'
  const frameOf = (sl) => sl.frame || LAYOUT_FRAME[layoutOf(sl)] || 'right'
  const stepsOf = (sl) => Math.max(1, sl.steps || 1)

  /* -- counters ----------------------------------------------------------------- */

  const COUNT_MS = 900

  /** Count from 0 to the final value when the step arrives. Once per node. */
  function countUp(el) {
    const target = Number(el.dataset.n)
    const decimals = Number(el.dataset.decimals || 0)
    el.dataset.counted = '1'
    if (reduced || !Number.isFinite(target)) {
      el.textContent = fmtNum(target, decimals)
      return
    }
    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / COUNT_MS)
      // easeOutExpo: arrives almost at once and settles — the number is read, not chased.
      el.textContent = fmtNum(p >= 1 ? target : target * (1 - Math.pow(2, -10 * p)), decimals)
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  /* -- rail + overview + help --------------------------------------------------- */

  slides.forEach((sl, i) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'rail__item'
    b.setAttribute('aria-label', `${pad(i + 1)} ${sl.title || ''}`)
    b.innerHTML = `<span class="rail__num">${pad(i + 1)}</span>`
    b.addEventListener('click', () => goto(i, 0))
    els.rail.appendChild(b)

    const li = document.createElement('li')
    const cell = document.createElement('button')
    cell.type = 'button'
    cell.className = 'overview__cell'
    cell.innerHTML = `<span class="overview__num">${pad(i + 1)}</span><span class="overview__name">${esc(
      sl.title || sl.id
    )}</span>`
    cell.addEventListener('click', () => {
      closeOverview()
      goto(i, 0)
    })
    li.appendChild(cell)
    els.overviewGrid.appendChild(li)
  })

  document.title = meta.title
  document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description || '')
  els.helpList.innerHTML = meta.shortcuts
    .map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`)
    .join('')

  /* -- render ------------------------------------------------------------------- */

  let renderedSlide = -1

  function buildSlide(sl) {
    const root = document.createElement('section')
    root.className = `slide slide--${sl.id}` + (sl.className ? ` ${sl.className}` : '')
    root.dataset.slide = sl.id
    ;(sl.blocks || []).forEach((b) => root.appendChild(renderBlock(b, { details })))
    if (sl.html) root.insertAdjacentHTML('beforeend', sl.html)
    // Stagger: children of [data-stagger] reveal one after another.
    root.querySelectorAll('[data-stagger]').forEach((list) => {
      ;[...list.children].forEach((child, i) => child.style.setProperty('--i', i))
      // A stagger outside any step would never be revealed; treat it as step 0.
      if (!list.closest('[data-step]')) list.dataset.step = '0'
    })
    root.querySelectorAll('[data-delay]').forEach((el) => {
      el.style.setProperty('--delay', `${parseInt(el.dataset.delay, 10) || 0}ms`)
    })
    return root
  }

  function render() {
    const sl = slides[state.c]

    if (renderedSlide !== state.c) {
      renderedSlide = state.c
      els.content.replaceChildren(buildSlide(sl))
      els.content.scrollTop = 0
      els.deck.dataset.layout = layoutOf(sl)
      els.deck.dataset.chrome = sl.chrome === false ? 'off' : 'on'
    }

    els.content.querySelectorAll('[data-step]').forEach((el) => {
      const live = Number(el.dataset.step) <= state.s
      el.classList.toggle('is-live', live)
      // A step that has not arrived must not be reachable by keyboard.
      el.querySelectorAll('button, a, [tabindex]').forEach((n) => (n.tabIndex = live ? 0 : -1))
    })

    els.content.querySelectorAll('[data-step].is-live .stat__num:not([data-counted])').forEach(countUp)

    els.rail.querySelectorAll('.rail__item').forEach((el, i) => {
      el.classList.toggle('is-current', i === state.c)
      el.classList.toggle('is-seen', i < state.c)
    })
    els.overviewGrid.querySelectorAll('.overview__cell').forEach((el, i) => {
      el.classList.toggle('is-current', i === state.c)
    })

    els.hudPos.innerHTML = `<b>${pad(state.c + 1)}</b> / ${pad(slides.length)} &nbsp; ${esc(sl.title || '')}`
    els.hudHint.textContent = state.touched ? meta.hintTouched : meta.hint

    if (stage) {
      stage.show(sl.scene ?? null, state.s, { frame: frameOf(sl), opacity: sl.sceneOpacity ?? 1 })
    }

    sl.onStep?.({ root: els.content.firstElementChild, step: state.s, stage })

    const hash = `#${state.c + 1}${state.s ? '.' + state.s : ''}`
    if (location.hash !== hash) history.replaceState(null, '', location.pathname + location.search + hash)
  }

  function goto(c, s) {
    state.c = Math.max(0, Math.min(slides.length - 1, c))
    state.s = Math.max(0, Math.min(stepsOf(slides[state.c]) - 1, s))
    render()
  }

  function next() {
    state.touched = true
    if (state.s < stepsOf(slides[state.c]) - 1) goto(state.c, state.s + 1)
    else if (state.c < slides.length - 1) goto(state.c + 1, 0)
    else render()
  }

  function prev() {
    state.touched = true
    if (state.s > 0) goto(state.c, state.s - 1)
    else if (state.c > 0) goto(state.c - 1, stepsOf(slides[state.c - 1]) - 1)
    else render()
  }

  /* -- detail panel ------------------------------------------------------------- */

  els.panel.setAttribute('tabindex', '-1')

  /** While a layer is open, the theme toggle leaves focus and the a11y tree. */
  function veil() {
    document.body.classList.toggle('has-layer', !!state.openRef || !els.overview.hidden || !els.help.hidden)
  }

  function openRef(id, trigger) {
    const d = details[id]
    if (!d) {
      // An unknown id closes the panel instead of leaving the previous sheet up —
      // otherwise a typo reads as the right answer.
      console.warn(`[deck] unknown detail "${id}" — check src/deck/details.js`)
      closePanel()
      return
    }
    closeOverview()
    closeHelp()

    els.panelKind.textContent = d.kind || ''
    els.panelPath.textContent = d.path || ''
    els.panelTitle.textContent = d.title || ''
    els.panelBody.innerHTML =
      (d.note ? `<p class="panel__note">${d.note}</p>` : '') +
      (d.body ? `<pre class="panel__code">${d.body}</pre>` : '') +
      (d.html || '')
    els.panelBody.scrollTop = 0

    els.panel.classList.add('is-open')
    els.panel.setAttribute('aria-hidden', 'false')
    els.panel.focus({ preventScroll: true })

    document.querySelectorAll('.ref.is-open').forEach((el) => el.classList.remove('is-open'))
    trigger?.classList.add('is-open')
    state.openRef = id
    veil()
  }

  function closePanel() {
    if (!state.openRef) return
    els.panel.classList.remove('is-open')
    els.panel.setAttribute('aria-hidden', 'true')
    els.panelKind.textContent = els.panelPath.textContent = els.panelTitle.textContent = ''
    els.panelBody.innerHTML = ''
    document.querySelectorAll('.ref.is-open').forEach((el) => el.classList.remove('is-open'))
    state.openRef = null
    veil()
    els.content.focus({ preventScroll: true })
  }

  document.addEventListener('click', (e) => {
    const ref = e.target.closest('.ref')
    if (ref) {
      e.preventDefault()
      const id = ref.dataset.ref
      state.openRef === id ? closePanel() : openRef(id, ref)
      return
    }
    // A click outside the panel dismisses it, but never inside the panel itself.
    if (state.openRef && !e.target.closest('.panel')) closePanel()
  })
  els.panelClose.addEventListener('click', closePanel)

  /* -- overview + help ---------------------------------------------------------- */

  function openLayer(el) {
    closePanel()
    for (const other of [els.overview, els.help]) if (other !== el) closeLayer(other)
    el.hidden = false
    el.setAttribute('aria-hidden', 'false')
    veil()
    requestAnimationFrame(() => el.classList.add('is-open'))
  }

  function closeLayer(el) {
    if (el.hidden) return
    el.classList.remove('is-open')
    el.setAttribute('aria-hidden', 'true')
    setTimeout(() => {
      el.hidden = true
      veil()
    }, 240)
  }

  const closeOverview = () => closeLayer(els.overview)
  const closeHelp = () => closeLayer(els.help)

  els.overview.addEventListener('click', (e) => {
    if (!e.target.closest('.overview__cell')) closeOverview()
  })
  els.help.addEventListener('click', closeHelp)

  /* -- theme -------------------------------------------------------------------- */

  function paintTheme() {
    const t = currentTheme()
    els.theme.querySelectorAll('.theme__opt').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.themeOpt === t))
    })
    stage?.setPalette(readPalette())
  }

  function setTheme(name) {
    if (name === currentTheme()) return
    applyTheme(name)
    paintTheme()
  }

  els.theme.addEventListener('click', (e) => {
    const b = e.target.closest('.theme__opt')
    if (b) setTheme(b.dataset.themeOpt)
  })

  /* -- input -------------------------------------------------------------------- */

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen()
    else document.documentElement.requestFullscreen?.().catch(() => {})
  }

  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (e.target.closest?.('input, textarea, select, [contenteditable]')) return

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case 'PageDown':
      case ' ':
        e.preventDefault()
        closePanel()
        next()
        return
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault()
        closePanel()
        prev()
        return
      case 'Home':
        e.preventDefault()
        goto(0, 0)
        return
      case 'End':
        e.preventDefault()
        goto(slides.length - 1, stepsOf(slides[slides.length - 1]) - 1)
        return
      case 'Escape':
        if (state.openRef) closePanel()
        else if (!els.overview.hidden) closeOverview()
        else if (!els.help.hidden) closeHelp()
        return
    }

    const k = e.key.toLowerCase()
    if (k === 'o') {
      e.preventDefault()
      els.overview.hidden ? openLayer(els.overview) : closeOverview()
    } else if (k === 't') {
      e.preventDefault()
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark')
    } else if (k === 'f') {
      e.preventDefault()
      toggleFullscreen()
    } else if (k === '?' || k === '/' || k === 'h') {
      e.preventDefault()
      els.help.hidden ? openLayer(els.help) : closeHelp()
    }
  })

  // Presenter remotes and touch: a tap on the right half advances.
  els.deck.addEventListener('click', (e) => {
    if (e.target.closest('button, a, .panel')) return
    if (window.matchMedia('(pointer: coarse)').matches) {
      e.clientX > window.innerWidth * 0.5 ? next() : prev()
    }
  })

  /* -- stage -------------------------------------------------------------------- */

  function useFallback(err) {
    // If the GPU layer cannot start, say why in the console and keep the deck usable.
    if (err) console.warn('[deck] WebGL unavailable:', err)
    els.canvas.hidden = true
    els.canvas.style.display = 'none'
    els.fallback.hidden = false
  }

  /**
   * Where the copy actually sits on screen, as viewport fractions — measured from
   * the rendered elements, not the column's max-width, because a short line
   * leaves the scene more room.
   */
  function contentBox() {
    let left = Infinity
    let right = 0
    const slide = els.content.firstElementChild
    if (slide) {
      const nodes = slide.querySelectorAll(':scope > :not([data-step]), [data-step].is-live > *')
      nodes.forEach((el) => {
        const r = el.getBoundingClientRect()
        if (r.width <= 0) return
        left = Math.min(left, r.left)
        right = Math.max(right, r.right)
      })
    }
    const w = window.innerWidth
    return right ? { left: left / w, right: right / w } : { left: 0.05, right: 0.55 }
  }

  // Theme is set before anything paints (index.html); make sure state agrees.
  applyTheme(resolveTheme(), { persist: false })

  try {
    stage = new Stage(els.canvas, { onFail: useFallback, reducedMotion: reduced, contentBox, scenes })
    if (!stage.ok) useFallback(new Error('renderer did not initialize'))
  } catch (err) {
    stage = null
    useFallback(err)
  }

  paintTheme()
  followOS(paintTheme)

  /* -- boot --------------------------------------------------------------------- */

  const fromHash = () => {
    const m = /^#(\d+)(?:\.(\d+))?$/.exec(location.hash)
    return m ? { c: Number(m[1]) - 1, s: Number(m[2] || 0) } : null
  }

  const start = fromHash()
  if (start) {
    // Landing deeper than the first slide means someone has navigated before.
    state.touched = start.c > 0 || start.s > 0
    goto(start.c, start.s)
  } else {
    render()
  }

  // Build every scene the deck uses now, after the first frame is up, so the
  // first visit to each slide does not hitch.
  requestAnimationFrame(() => stage?.preload([...new Set(slides.map((s) => s.scene))]))

  window.addEventListener('hashchange', () => {
    const h = fromHash()
    if (h && (h.c !== state.c || h.s !== state.s)) goto(h.c, h.s)
  })

  els.content.focus({ preventScroll: true })

  // Minimal surface for scripts/verify.mjs — the deck itself never uses it.
  window.__deck = {
    length: slides.length,
    steps: slides.map(stepsOf),
    theme: currentTheme,
    setTheme,
    webgl: () => !!stage?.ok,
  }
}
