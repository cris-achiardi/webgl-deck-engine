/**
 * End-to-end check of what a screenshot cannot tell you. Works on any deck:
 * checks that need a feature (a detail term, a figure) find a slide that has
 * one, and are skipped when the deck has none.
 *
 *   npm run dev                                   (in another terminal)
 *   npm run verify -- --deck my-talk
 *   DECK_URL="file:///C:/…/dist/my-talk.html" npm run verify
 *
 * Env: CHROME for the browser path.
 */
import puppeteer from 'puppeteer-core'
import { mkdir } from 'node:fs/promises'
import { target, CHROME } from './target.mjs'

const { base, at, label } = target()
await mkdir('shots', { recursive: true })

const fails = []
const check = (name, ok, detail = '') => {
  console.log(`${ok ? '  ok ' : '  FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
  if (!ok) fails.push(name)
}
const skip = (name, why) => console.log(`  skip  ${name}  — ${why}`)
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--hide-scrollbars'],
  defaultViewport: { width: 1920, height: 1080 },
})

const page = await browser.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`)
})

// The theme is pinned so the suite does not depend on the OS preference.
const load = async (hash = '', theme = 'dark') => {
  await page.goto(at(hash, theme), { waitUntil: 'networkidle0' })
  await wait(700)
}
const pos = () => page.evaluate(() => location.hash || '#1')
const last = (c) => `${c + 1}${steps[c] > 1 ? '.' + (steps[c] - 1) : ''}`

console.log(`\ndeck: ${label}`)

/* -- navigation ------------------------------------------------------------- */

console.log('\nnavigation')
await load()
const booted = await page.evaluate(() => !!window.__deck)
check('the deck boots', booted)
if (!booted) {
  await browser.close()
  console.log('\nThe deck did not boot — check the name, or the console.')
  process.exit(1)
}
check('boots on slide 1', (await pos()).startsWith('#1'))
check('WebGL stage is running', await page.evaluate(() => window.__deck.webgl()))

const total = await page.evaluate(() => window.__deck.length)
const steps = await page.evaluate(() => window.__deck.steps)
const expected = steps.reduce((a, b) => a + b, 0)
let presses = 0
const seen = new Set()
for (let guard = 0; guard < 1000; guard++) {
  seen.add((await pos()).replace('#', '').split('.')[0])
  const before = await pos()
  await page.keyboard.press('ArrowRight')
  await wait(40)
  if ((await pos()) === before) break
  presses++
}
check(`→ walks all ${total} slides`, seen.size === total, `seen ${seen.size}`)
check(`→ visits every step (${expected})`, presses + 1 === expected, `visited ${presses + 1}`)
check('stops on the last slide', (await pos()).startsWith(`#${total}`))

for (let guard = 0; guard < 1000; guard++) {
  const before = await pos()
  await page.keyboard.press('ArrowLeft')
  await wait(40)
  if ((await pos()) === before) break
}
check('← returns to slide 1', (await pos()) === '#1')

await page.keyboard.press('End')
await wait(80)
check('End jumps to the last step', (await pos()) === `#${last(total - 1)}`)
await page.keyboard.press('Home')
await wait(80)
check('Home jumps to the start', (await pos()) === '#1')

/* -- find slides with specific features ------------------------------------- */

const probe = async (selector) => {
  for (let c = 0; c < total; c++) {
    await page.evaluate((h) => (location.hash = h), `#${last(c)}`)
    await wait(60)
    if (await page.$(selector)) return c
  }
  return -1
}
const multi = steps.findIndex((n) => n > 1)
const refSlide = await probe('.ref')
const statSlide = await probe('.stat__num')

/* -- steps ------------------------------------------------------------------ */

console.log('\nsteps')
if (multi < 0) {
  skip('step reveals', 'no slide has more than one step')
} else {
  await load(`${multi + 1}`)
  const live = await page.$$eval('[data-step].is-live', (e) => e.length)
  const totalSteps = await page.$$eval('[data-step]', (e) => e.length)
  check(`#${multi + 1} opens on step 0 with later steps hidden`, live < totalSteps, `${live}/${totalSteps} live`)
  await load(last(multi))
  check(`#${last(multi)} reveals everything`, (await page.$$eval('[data-step]:not(.is-live)', (e) => e.length)) === 0)
}

/* -- detail panel ----------------------------------------------------------- */

console.log('\ndetail panel')
if (refSlide < 0) {
  skip('detail panel', 'no [[term]] in this deck')
} else {
  await load(last(refSlide))
  const before = await pos()
  const id = await page.$eval('.ref', (e) => e.dataset.ref)
  await page.click('.ref')
  await wait(500)
  check(`a term opens the panel (${id})`, await page.$eval('#panel', (e) => e.classList.contains('is-open')))
  check('the sheet exists in details.js', (await page.$eval('#panel-title', (e) => e.textContent)).length > 0)
  check('opening the panel does NOT move the deck', (await pos()) === before)
  await page.keyboard.press('Escape')
  await wait(450)
  check('Esc closes the panel', !(await page.$eval('#panel', (e) => e.classList.contains('is-open'))))
}

/* -- overview + help -------------------------------------------------------- */

console.log('\noverview + help')
await load()
await page.keyboard.press('o')
await wait(320)
check('O opens the overview', await page.$eval('#overview', (e) => !e.hidden))
check('the overview lists every slide', (await page.$$eval('.overview__cell', (e) => e.length)) === total)
const jump = Math.min(total, 2)
await page.click(`.overview__grid li:nth-child(${jump}) .overview__cell`)
await wait(320)
check('clicking a cell jumps there', (await pos()).startsWith(`#${jump}`))
await page.keyboard.press('?')
await wait(320)
check('? opens help', await page.$eval('#help', (e) => !e.hidden))
await page.keyboard.press('Escape')
await wait(320)
check('Esc closes help', await page.$eval('#help', (e) => e.hidden))

/* -- theme ------------------------------------------------------------------ */

console.log('\ntheme')
await load()
const theme = () => page.evaluate(() => document.documentElement.dataset.theme)
const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor)
check('?theme=dark boots dark', (await theme()) === 'dark')
const darkBg = await bg()
await page.keyboard.press('t')
await wait(600)
check('T switches to light', (await theme()) === 'light')
check('the ground actually changes', (await bg()) !== darkBg)
check('the toggle reflects it', (await page.$eval('[data-theme-opt="light"]', (e) => e.getAttribute('aria-pressed'))) === 'true')
check('the choice is remembered', (await page.evaluate(() => localStorage.getItem('deck.theme'))) === 'light')
await page.click('[data-theme-opt="dark"]')
await wait(300)
check('clicking the toggle switches back', (await theme()) === 'dark')

const fresh = await browser.newPage()
await fresh.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }])
await fresh.evaluateOnNewDocument(() => {
  try {
    localStorage.removeItem('deck.theme')
  } catch {}
})
await fresh.goto(base, { waitUntil: 'networkidle0' })
check('with no choice, follows the OS (light)', (await fresh.evaluate(() => document.documentElement.dataset.theme)) === 'light')
await fresh.close()

/* -- responsive ------------------------------------------------------------- */

console.log('\nresponsive')
const busy = multi < 0 ? '1' : last(multi)
for (const [w, h] of [
  [1280, 720],
  [2560, 1440],
  [900, 1400],
]) {
  await page.setViewport({ width: w, height: h })
  await load(busy)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  check(`${w}×${h}: no horizontal overflow on #${busy}`, !overflow)
}
await page.setViewport({ width: 1920, height: 1080 })

/* -- no WebGL --------------------------------------------------------------- */

console.log('\nwithout WebGL')
const p2 = await browser.newPage()
await p2.setViewport({ width: 1920, height: 1080 })
await p2.evaluateOnNewDocument(() => {
  const real = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (type, ...r) {
    if (String(type).includes('webgl')) return null
    return real.call(this, type, ...r)
  }
})
await p2.goto(at('1'), { waitUntil: 'networkidle0' })
await wait(600)
check('the fallback appears', await p2.$eval('#stage-fallback', (e) => !e.hidden))
check('the canvas is hidden', await p2.$eval('#stage', (e) => e.hidden))
await p2.keyboard.press('ArrowRight')
await wait(120)
check('the deck still navigates', (await p2.evaluate(() => location.hash)) !== '#1')
await p2.close()

/* -- reduced motion --------------------------------------------------------- */

console.log('\nprefers-reduced-motion')
if (statSlide < 0) {
  skip('figures under reduced motion', 'no stats in this deck')
} else {
  const p3 = await browser.newPage()
  await p3.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await p3.goto(at(last(statSlide)), { waitUntil: 'networkidle0' })
  await wait(150)
  // 150 ms into a 900 ms count, an animated figure would still be mid-way.
  const done = await p3.$$eval('.stat__num', (e) =>
    e.every((n) => n.textContent.replace(/,/g, '') === Number(n.dataset.n).toFixed(Number(n.dataset.decimals || 0)))
  )
  check('figures land on their final value immediately', done)
  await p3.close()
}

/* -- console ---------------------------------------------------------------- */

console.log('\nconsole')
check('no errors or warnings', errors.length === 0, [...new Set(errors)].join(' | '))

await browser.close()
console.log(fails.length ? `\n${fails.length} failed` : '\nall checks passed')
process.exit(fails.length ? 1 : 0)
