import { chromium } from 'playwright'

const BASE = 'https://sankalp-beryl.vercel.app'
const results = []
const errors = []
const browser = await chromium.launch({ args: ['--no-sandbox'] })

function log(step, ok, detail = '') {
  results.push({ step, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${step}${detail ? ' :: ' + detail : ''}`)
}

// -----------------------------------------------------------------------
// 1. Landing page
// -----------------------------------------------------------------------
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const pageErrors = []
  page.on('pageerror', (e) => pageErrors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(m.text()) })

  const resp = await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 30000 }).catch((e) => ({ error: e.message }))
  const status = resp?.status ? resp.status() : 'nav-error'
  log('Landing page loads', status === 200, `status=${status}`)

  const bodyText = await page.textContent('body').catch(() => '')
  log('Landing page has real content', bodyText.includes('Construction-to-Customer'), bodyText.slice(0, 80))

  await page.screenshot({ path: 'prod-01-landing.png', fullPage: true }).catch(() => {})
  if (pageErrors.length) errors.push({ page: 'landing', pageErrors })
  await page.close()
}

// -----------------------------------------------------------------------
// 2. Direct deep-link navigation (tests vercel.json SPA rewrite)
// -----------------------------------------------------------------------
{
  const page = await browser.newPage()
  const resp = await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 }).catch((e) => ({ error: e.message }))
  const status = resp?.status ? resp.status() : 'nav-error'
  const bodyText = await page.textContent('body').catch(() => '')
  log('Direct /login deep link (SPA rewrite)', status === 200 && bodyText.includes('Welcome back'), `status=${status}`)
  await page.close()
}

// -----------------------------------------------------------------------
// 3. Login page config check (is Supabase configured on this deployment?)
// -----------------------------------------------------------------------
let configured = true
{
  const page = await browser.newPage()
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 })
  const bodyText = await page.textContent('body').catch(() => '')
  configured = !bodyText.includes("isn't connected to its database")
  log('Supabase env vars configured on this deployment', configured, configured ? '' : 'missing-env-banner shown')
  await page.screenshot({ path: 'prod-02-login-page.png', fullPage: true }).catch(() => {})
  await page.close()
}

// -----------------------------------------------------------------------
// 4. Builder login end-to-end
// -----------------------------------------------------------------------
if (configured) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const pageErrors = []
  page.on('pageerror', (e) => pageErrors.push(e.message))

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 })
  await page.fill('input[type="email"]', 'prathamesh.meraki2025+demobuilder@gmail.com')
  await page.fill('input[type="password"]', 'Sankalp@123')
  await page.click('button[type="submit"]')
  const landed = await page.waitForURL('**/builder**', { timeout: 20000 }).then(() => true).catch(() => false)
  log('Builder login redirects to /builder', landed, page.url())

  if (landed) {
    await page.waitForTimeout(1000)
    const bodyText = await page.textContent('body').catch(() => '')
    log('Builder dashboard shows project data', bodyText.includes('Skyline'), bodyText.slice(0, 150))
    await page.screenshot({ path: 'prod-03-builder-dashboard.png', fullPage: true }).catch(() => {})

    // navigate into a project
    const projectLink = page.locator('a:has-text("Skyline Heights")')
    if (await projectLink.count()) {
      await projectLink.click()
      await page.waitForTimeout(1500)
      const projText = await page.textContent('body').catch(() => '')
      log('Project detail page renders tabs', projText.includes('Leads') && projText.includes('Sales'), '')
      await page.screenshot({ path: 'prod-04-project-detail.png', fullPage: true }).catch(() => {})
    } else {
      log('Project detail page renders tabs', false, 'no project link found')
    }

    // insights page
    await page.goto(`${BASE}/builder/insights`, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(1000)
    const insightsText = await page.textContent('body').catch(() => '')
    log('Insights dashboard loads', insightsText.includes('Insights') || insightsText.includes('Inventory'), '')

    // refresh test on a deep client-side route (SPA rewrite under auth)
    await page.reload({ waitUntil: 'networkidle', timeout: 30000 })
    const afterReload = await page.textContent('body').catch(() => '')
    log('Refresh on /builder/insights does not 404', !afterReload.includes('404') && !afterReload.includes('NOT_FOUND'), '')
  }

  if (pageErrors.length) errors.push({ page: 'builder', pageErrors })
  await page.close()
}

// -----------------------------------------------------------------------
// 5. Customer login end-to-end
// -----------------------------------------------------------------------
if (configured) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const pageErrors = []
  page.on('pageerror', (e) => pageErrors.push(e.message))

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 })
  await page.fill('input[type="email"]', 'prathamesh.meraki2025+democustomer@gmail.com')
  await page.fill('input[type="password"]', 'Sankalp@123')
  await page.click('button[type="submit"]')
  const landed = await page.waitForURL('**/customer**', { timeout: 20000 }).then(() => true).catch(() => false)
  log('Customer login redirects to /customer', landed, page.url())

  if (landed) {
    await page.waitForTimeout(1000)
    const bodyText = await page.textContent('body').catch(() => '')
    log('Customer dashboard shows booking data', bodyText.includes('Tower') || bodyText.includes('1204'), bodyText.slice(0, 150))
    await page.screenshot({ path: 'prod-05-customer-dashboard.png', fullPage: true }).catch(() => {})
  }

  if (pageErrors.length) errors.push({ page: 'customer', pageErrors })
  await page.close()
}

// -----------------------------------------------------------------------
// 6. Non-existent route (should still resolve via SPA rewrite, app decides 404 UI)
// -----------------------------------------------------------------------
{
  const page = await browser.newPage()
  const resp = await page.goto(`${BASE}/this-route-does-not-exist`, { waitUntil: 'networkidle', timeout: 30000 }).catch((e) => ({ error: e.message }))
  const status = resp?.status ? resp.status() : 'nav-error'
  log('Unknown route served by SPA (not a hard 404)', status === 200, `status=${status}`)
  await page.close()
}

console.log('\n=== SUMMARY ===')
const failed = results.filter((r) => !r.ok)
console.log(`${results.length - failed.length}/${results.length} passed`)
if (failed.length) console.log('FAILED:', JSON.stringify(failed, null, 2))
if (errors.length) console.log('PAGE ERRORS:', JSON.stringify(errors, null, 2))

await browser.close()
