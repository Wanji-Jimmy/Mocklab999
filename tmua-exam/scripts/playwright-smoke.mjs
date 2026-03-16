import { chromium } from 'playwright'

const BASE = 'http://127.0.0.1:3001'
const routes = [
  '/', '/dashboard', '/score-converter', '/resources', '/exam/2016', '/account', '/mistakes', '/guides'
]

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
let fails = 0

for (const route of routes) {
  const page = await context.newPage()
  const consoleErrors = []
  const pageErrors = []
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
  page.on('pageerror', (err) => pageErrors.push(String(err?.message || err)))
  try {
    const res = await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForTimeout(800)
    const textLen = ((await page.locator('body').innerText()) || '').trim().length
    const status = res?.status() || 0
    const bad = status >= 400 || pageErrors.length > 0 || consoleErrors.some((t) => /Error creating WebGL context|Maximum update depth exceeded|Unhandled Runtime Error/i.test(t))
    if (bad) {
      fails += 1
      console.log(`FAIL ${route} [${status}] ${pageErrors[0] || consoleErrors[0] || 'Unknown error'} textLen=${textLen}`)
    } else {
      console.log(`PASS ${route} [${status}] textLen=${textLen}`)
    }
  } catch (e) {
    fails += 1
    console.log(`FAIL ${route} [NAV] ${String(e?.message || e)}`)
  } finally {
    await page.close()
  }
}

await browser.close()
if (fails > 0) process.exit(1)
