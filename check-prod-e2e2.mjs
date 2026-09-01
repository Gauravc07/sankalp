import { chromium } from 'playwright'

const BASE = 'https://sankalp-beryl.vercel.app'
const results = []
const browser = await chromium.launch({ args: ['--no-sandbox'] })

function log(step, ok, detail = '') {
  results.push({ step, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${step}${detail ? ' :: ' + detail : ''}`)
}

// Reach /login the way a real user does: click through from the landing page
// (client-side routed, doesn't hit the server, so avoids the deep-link 404).
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(e.message))
page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(m.text()) })

await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 30000 })
await page.click('a:has-text("Sign in")')
await page.waitForTimeout(500)
const onLogin = page.url().includes('/login')
log('Client-side nav to /login works', onLogin, page.url())

const bodyText = await page.textContent('body').catch(() => '')
const configured = !bodyText.includes("isn't connected to its database")
log('Supabase env vars configured (via client nav)', configured, configured ? '' : 'missing-env-banner shown')
await page.screenshot({ path: 'prod-02b-login-clientnav.png', fullPage: true }).catch(() => {})

if (onLogin && configured) {
  await page.fill('input[type="email"]', 'prathamesh.meraki2025+demobuilder@gmail.com')
  await page.fill('input[type="password"]', 'Sankalp@123')
  await page.click('button[type="submit"]')
  const landed = await page.waitForURL('**/builder**', { timeout: 20000 }).then(() => true).catch(() => false)
  log('Builder login (client-nav entry) redirects to /builder', landed, page.url())
  if (!landed) {
    const btnText = await page.locator('button[type="submit"]').textContent().catch(() => '?')
    log('Button state if login failed', false, `button says: "${btnText}"`)
    const errText = await page.textContent('body').catch(() => '')
    console.log('BODY AFTER STUCK LOGIN:', errText.slice(0, 600))
  }
  await page.screenshot({ path: 'prod-03b-after-login-attempt.png', fullPage: true }).catch(() => {})
}

if (pageErrors.length) console.log('PAGE ERRORS:', JSON.stringify(pageErrors, null, 2))

console.log('\n=== SUMMARY ===')
const failed = results.filter((r) => !r.ok)
console.log(`${results.length - failed.length}/${results.length} passed`)

await browser.close()
