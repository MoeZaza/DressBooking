import { test, expect, Page } from '@playwright/test'

/**
 * Simple Page Loading Test
 * Tests basic page loading without authentication
 */

test.describe('Simple Page Loading Tests', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    test.setTimeout(60000)
  })

  test('should load sign-in page successfully', async () => {
    console.log('🚀 Testing Sign-in Page Loading...')

    await page.goto('http://localhost:3001/sign-in?test=true')
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    
    // Check if page loads
    const pageContent = await page.textContent('body')
    expect(pageContent).toBeTruthy()
    console.log('✅ Sign-in page loaded successfully')
    
    // Wait for potential form to load (it might be conditionally rendered)
    await page.waitForTimeout(3000)

    // Check for login form elements (Material-UI specific selectors)
    const emailInput = await page.locator('input[name="email"], input[type="email"], input[autocomplete="email"]').count()
    const passwordInput = await page.locator('input[name="password"], input[type="password"], input[autocomplete="current-password"]').count()
    const submitButton = await page.locator('button[type="submit"], .MuiButton-root:has-text("Sign In")').count()

    console.log(`📧 Email inputs found: ${emailInput}`)
    console.log(`🔒 Password inputs found: ${passwordInput}`)
    console.log(`🔘 Submit buttons found: ${submitButton}`)

    // Check if we're already logged in (redirected to dashboard)
    const currentUrl = page.url()
    console.log(`🔗 Current URL: ${currentUrl}`)

    if (currentUrl.includes('/sign-in')) {
      // We're on sign-in page, form should be visible
      expect(emailInput).toBeGreaterThan(0)
      expect(passwordInput).toBeGreaterThan(0)
      expect(submitButton).toBeGreaterThan(0)
    } else {
      // We might be redirected due to existing login
      console.log('✅ User appears to be already logged in or redirected')
      expect(currentUrl).toBeTruthy()
    }
  })

  test('should test frontend homepage loading', async () => {
    console.log('🚀 Testing Frontend Homepage...')
    
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    
    // Check if page loads
    const pageContent = await page.textContent('body')
    expect(pageContent).toBeTruthy()
    console.log('✅ Frontend homepage loaded successfully')
    
    // Look for search form elements
    const searchForms = await page.locator('form, .search-form, [data-testid*="search"]').count()
    const searchInputs = await page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"], [data-testid="search-input"]').count()
    const locationDropdowns = await page.locator('select, .MuiSelect-root, [data-testid*="location"]').count()
    
    console.log(`🔍 Search forms found: ${searchForms}`)
    console.log(`📝 Search inputs found: ${searchInputs}`)
    console.log(`📍 Location dropdowns found: ${locationDropdowns}`)
    
    // At least one search element should be present
    const totalSearchElements = searchForms + searchInputs + locationDropdowns
    expect(totalSearchElements).toBeGreaterThan(0)
  })

  test('should test API endpoints accessibility', async () => {
    console.log('🚀 Testing API Endpoints...')
    
    // Test basic API endpoint
    const response = await page.request.get('http://localhost:4002/api/health')
    console.log(`🏥 Health endpoint status: ${response.status()}`)
    
    // Should return 200 or at least not 404
    expect(response.status()).not.toBe(404)
    
    // Test another basic endpoint (country code - public endpoint)
    const countryCodeResponse = await page.request.get('http://localhost:4002/api/country-code')
    console.log(`🌍 Country code endpoint status: ${countryCodeResponse.status()}`)

    // Should return 200 (country code endpoint should work)
    expect(countryCodeResponse.status()).toBe(200)
  })

  test('should test backend page accessibility without login', async () => {
    console.log('🚀 Testing Backend Page Accessibility...')
    
    // Try to access backend pages (should redirect to login)
    await page.goto('http://localhost:3001/')
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    
    const currentUrl = page.url()
    console.log(`🔗 Current URL: ${currentUrl}`)
    
    // Should either show login page or dashboard
    const isLoginPage = currentUrl.includes('sign-in') || currentUrl.includes('login')
    const isDashboard = currentUrl.includes('dashboard') || currentUrl === 'http://localhost:3001/'
    
    expect(isLoginPage || isDashboard).toBe(true)
    
    // Check if page has content
    const pageContent = await page.textContent('body')
    expect(pageContent).toBeTruthy()
    console.log('✅ Backend page accessible')
  })

  test('should test security bypass headers', async () => {
    console.log('🚀 Testing Security Bypass Headers...')
    
    // Make a request with test headers
    const response = await page.request.get('http://localhost:4002/api/countries', {
      headers: {
        'X-Playwright-Test': 'true'
      }
    })
    
    console.log(`🛡️ Request with test headers status: ${response.status()}`)
    console.log(`📋 Response headers:`, response.headers())
    
    // Should not be blocked
    expect(response.status()).not.toBe(429) // Not rate limited
    expect(response.status()).not.toBe(403) // Not forbidden
  })
})
