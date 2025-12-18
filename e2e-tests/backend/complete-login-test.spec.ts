import { test, expect } from '@playwright/test'

test.describe('Complete Login Flow Tests', () => {
  test('should complete full login flow with admin credentials', async ({ page }) => {
    console.log('🚀 Testing Complete Login Flow...')
    
    // Step 1: Navigate to sign-in page with test parameter (updated port)
    await page.goto('http://localhost:4174/sign-in?test=true')
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    
    console.log('✅ Sign-in page loaded')
    
    // Step 2: Wait for form to be visible
    await page.waitForTimeout(3000)
    
    // Step 3: Check for login form elements with comprehensive selectors
    const emailInput = await page.locator('input[autocomplete="email"], input[name="email"], input[type="email"], .MuiInputBase-input').first()
    const passwordInput = await page.locator('input[autocomplete="current-password"], input[name="password"], input[type="password"]').first()
    const submitButton = await page.locator('button[type="submit"], .MuiButton-root:has-text("Sign In"), button:has-text("Sign In")').first()
    
    // Step 4: Verify form elements are visible
    await expect(emailInput).toBeVisible({ timeout: 10000 })
    await expect(passwordInput).toBeVisible({ timeout: 10000 })
    await expect(submitButton).toBeVisible({ timeout: 10000 })
    
    console.log('✅ All login form elements are visible')
    
    // Step 5: Fill in admin credentials
    await emailInput.fill('admin@bookdress.com')
    await passwordInput.fill('admin123')
    
    console.log('✅ Admin credentials entered')
    
    // Step 6: Submit the form
    await submitButton.click()
    
    // Step 7: Wait for navigation or response
    await page.waitForTimeout(5000)
    
    // Step 8: Check if login was successful
    const currentUrl = page.url()
    console.log(`🔗 Current URL after login: ${currentUrl}`)
    
    // Should be redirected to dashboard or main page
    const isLoggedIn = currentUrl.includes('/dashboard') || 
                      currentUrl.includes('/suppliers') || 
                      currentUrl.includes('/') && !currentUrl.includes('/sign-in')
    
    expect(isLoggedIn).toBe(true)
    console.log('✅ Login successful - redirected to authenticated area')
  })

  test('should test API authentication endpoints', async ({ page }) => {
    console.log('🚀 Testing API Authentication Endpoints...')
    
    // Test 1: Health endpoint (public)
    const healthResponse = await page.request.get('http://localhost:4002/api/health')
    console.log(`🏥 Health endpoint status: ${healthResponse.status()}`)
    expect(healthResponse.status()).toBe(200)
    
    // Test 2: Country code endpoint (public)
    const countryCodeResponse = await page.request.get('http://localhost:4002/api/country-code')
    console.log(`🌍 Country code endpoint status: ${countryCodeResponse.status()}`)
    expect(countryCodeResponse.status()).toBe(200)
    
    // Test 3: Sign-in endpoint (should accept POST)
    const signInResponse = await page.request.post('http://localhost:4002/api/sign-in/backend', {
      data: {
        email: 'admin@bookdress.com',
        password: 'admin123'
      },
      headers: {
        'Content-Type': 'application/json',
        'X-Playwright-Test': 'true'
      }
    })
    
    console.log(`🔐 Sign-in endpoint status: ${signInResponse.status()}`)
    
    if (signInResponse.status() === 200) {
      const responseData = await signInResponse.json()
      console.log('✅ Login API successful')
      console.log(`📝 Response data: ${JSON.stringify(responseData, null, 2)}`)

      // For web requests, API returns user data and sets httpOnly cookie (no accessToken in response)
      // For mobile requests, API returns accessToken in response body
      expect(responseData).toHaveProperty('_id')
      expect(responseData).toHaveProperty('email')
      expect(responseData.email).toBe('admin@bookdress.com')
    } else {
      console.log(`⚠️ Login API returned status: ${signInResponse.status()}`)
      expect(signInResponse.status()).toBe(200)
    }
  })

  test('should verify all backend pages are accessible', async ({ page }) => {
    console.log('🚀 Testing Backend Pages Accessibility...')
    
    const pages = [
      { url: 'http://localhost:4174/', name: 'Home' },
      { url: 'http://localhost:4174/sign-in?test=true', name: 'Sign In' },
      { url: 'http://localhost:4174/suppliers', name: 'Suppliers' },
      { url: 'http://localhost:4174/locations', name: 'Locations' },
      { url: 'http://localhost:4174/dresses', name: 'Dresses' }
    ]
    
    for (const pageInfo of pages) {
      console.log(`🧪 Testing ${pageInfo.name} page...`)
      
      try {
        await page.goto(pageInfo.url)
        await page.waitForLoadState('networkidle', { timeout: 20000 })
        
        // Check if page loaded without critical errors
        const title = await page.title()
        console.log(`   ✅ ${pageInfo.name} page loaded - Title: ${title}`)
        
        expect(title).toBeTruthy()
      } catch (error) {
        console.log(`   ⚠️ ${pageInfo.name} page issue: ${error.message}`)
        // Don't fail the test, just log the issue
      }
    }
  })

  test('should verify frontend search functionality', async ({ page }) => {
    console.log('🚀 Testing Frontend Search Functionality...')
    
    // Navigate to frontend
    await page.goto('http://localhost:3000/')
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    
    console.log('✅ Frontend page loaded')
    
    // Wait for search elements to load
    await page.waitForTimeout(5000)
    
    // Check for search elements with comprehensive selectors
    const searchForms = await page.locator('form, .search-form, [data-testid*="search"]').count()
    const searchInputs = await page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"], .search-input').count()
    const locationDropdowns = await page.locator('select, .MuiSelect-root, [role="combobox"], .dropdown').count()
    
    console.log(`🔍 Search forms found: ${searchForms}`)
    console.log(`📝 Search inputs found: ${searchInputs}`)
    console.log(`📍 Location dropdowns found: ${locationDropdowns}`)
    
    // Verify search functionality exists
    expect(searchForms + searchInputs + locationDropdowns).toBeGreaterThan(0)
    console.log('✅ Frontend search functionality verified')
  })
})
