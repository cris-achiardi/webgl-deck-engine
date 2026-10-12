/**
 * Screenshots in real Chrome, with real waits.
 *
 * Headless captures under --virtual-time-budget lie about this deck: the camera
 * and the crossfade both settle over a second or two, so a virtual-time capture
 * shows a half-finished frame. This waits wall-clock time instead.
 *
 *   npm run shots -- --deck my-talk 1 3.2     # slide 1, slide 3 step 2
 *   npm run shots -- --deck my-talk --all     # every slide at its last step
 *   npm run shots -- --deck my-talk --size 1280x720 4.3
 *   npm run shots -- --deck my-talk --theme light --all
 *
 * Output: shots/<deck>/<slide>_<step>_<width>_<theme>.png
 * Env: DECK_URL instead of --deck for a built file; CHROME for the browser path.
 */
import puppeteer from 'puppeteer-core'
import { mkdir } from 'node:fs/promises'
import { target, CHROME } from './target.mjs'

const { rest, at, label } = target()
const OUT = `shots/${label.replace(/[^\w.-]+/g, '_').slice(-60)}`

let size = [1920, 1080]
let theme = 'dark'
let all = false
const targets = []
for (let i = 0; i < rest.length; i++) {
  if (rest[i] === '--size') size = rest[++i].split('x').map(Number)
  else if (rest[i] === '--theme') theme = rest[++i]
  else if (rest[i] === '--all') all = true
  else targets.push(rest[i])
}

await mkdir(OUT, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: [
    '--no-sandbox',
    '--enable-unsafe-swiftshader',
    '--use-angle=swiftshader',
    '--hide-scrollbars',
    `--window-size=${size[0]},${size[1]}`,
  ],
  defaultViewport: { width: size[0], height: size[1] },
})

const page = await browser.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`)
})

if (all) {
  await page.goto(at('1', theme), { waitUntil: 'networkidle0' })
  const steps = await page.evaluate(() => window.__deck?.steps)
  if (!steps) {
    console.error('Deck did not boot — check the deck name.')
    process.exit(1)
  }
  steps.forEach((n, i) => targets.push(`${i + 1}${n > 1 ? '.' + (n - 1) : ''}`))
}
if (!targets.length) targets.push('1')

for (const t of targets) {
  await page.goto(at(t, theme), { waitUntil: 'networkidle0' })
  // The camera lerp and the scene crossfade both need ~2s of wall clock.
  await new Promise((r) => setTimeout(r, 2600))
  const file = `${OUT}/${t.replace('.', '_')}_${size[0]}_${theme}.png`
  await page.screenshot({ path: file })
  console.log('·', file)
}

await browser.close()

if (errors.length) {
  console.log('\nconsole:')
  for (const e of [...new Set(errors)]) console.log('  !', e)
} else {
  console.log('\nconsole clean')
}
