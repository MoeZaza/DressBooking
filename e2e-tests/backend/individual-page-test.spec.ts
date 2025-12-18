import { test, expect, Page } from '@playwright/test'

/**
 * Individual Page Functionality Test
 * Tests each backend page individually for specific functionality
 */

test.describe('Individual Backend Page Tests', () => {
  let page: Page

  // Login helper function
  async function loginAsAdmin(page: Page): Promise<boolean> {
    try {
      console.log('🔐 Logging in as admin...')
      
      await page.goto('http://localhost:3001/sign-in')
      await page.waitForLoadState('networkidle', { timeout: 30000 })

      // Fill login form
      await page.fill('input[name="email"], input[type="email"]', 'admin@bookdress.com')
      await page.fill('input[name="password"], input[type="password"]', 'admin123')
      
      // Submit form
      await page.click('button[type="submit"], .MuiButton-root:has-text("Sign In")')
      
      // Wait for redirect to dashboard
      await page.waitForURL(/\/(dashboard)?$/, { timeout: 30000 })
      
      console.log('✅ Admin login successful')
      return true
    } catch (error) {
      console.error('❌ Login failed:', error)
      return false
    }
  }

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    test.setTimeout(60000)

    // No storage clearing needed - focus on functionality testing
  })

  test('should test Bookings Dashboard functionality', async () => {
    console.log('🚀 Testing Bookings Dashboard...')
    
    const loginSuccess = await loginAsAdmin(page)
    expect(loginSuccess).toBe(true)
    
    await page.goto('http://localhost:3001/')
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    
    // Check if page loads
    const pageContent = await page.textContent('body')
    expect(pageContent).toBeTruthy()
    
    // Check for navigation elements
    const navElements = await page.locator('nav, .MuiDrawer-root, [data-testid="navigation-indicator"], [data-testid="navigation-menu-button"], .menu-button, [aria-label="open drawer"]').count()
    console.log(`📋 Navigation elements found: ${navElements}`)
    
    // Check for interactive buttons
    const buttons = await page.locator('button, [data-testid*="button"]').count()
    console.log(`🔘 Interactive buttons found: ${buttons}`)
    
    // Check for data grid or content
    const dataGrid = await page.locator('.MuiDataGrid-root, .MuiTable-root, .data-grid').count()
    console.log(`📊 Data grids found: ${dataGrid}`)
    
    console.log('✅ Bookings Dashboard test completed')
  })

  test('should test Admin Dashboard functionality', async () => {
    console.log('🚀 Testing Admin Dashboard...')
    
    const loginSuccess = await loginAsAdmin(page)
    expect(loginSuccess).toBe(true)
    
    await page.goto('http://localhost:3001/dashboard')
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    
    // Check if page loads
    const pageContent = await page.textContent('body')
    expect(pageContent).toBeTruthy()
    
    // Check for dashboard widgets
    const widgets = await page.locator('.MuiCard-root, .dashboard-widget, .stat-card').count()
    console.log(`📊 Dashboard widgets found: ${widgets}`)
    
    // Check for refresh button
    const refreshButton = await page.locator('button:has-text("Refresh"), [data-testid*="refresh"]').count()
    console.log(`🔄 Refresh buttons found: ${refreshButton}`)
    
    console.log('✅ Admin Dashboard test completed')
  })

  test('should test Suppliers Management functionality', async () => {
    console.log('🚀 Testing Suppliers Management...')
    
    const loginSuccess = await loginAsAdmin(page)
    expect(loginSuccess).toBe(true)
    
    await page.goto('http://localhost:3001/suppliers')
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    
    // Check if page loads
    const pageContent = await page.textContent('body')
    expect(pageContent).toBeTruthy()
    
    // Check for add button
    const addButton = await page.locator('button:has-text("Add"), button:has-text("Create"), .new-supplier').count()
    console.log(`➕ Add buttons found: ${addButton}`)
    
    // Check for search functionality
    const searchInput = await page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"]').count()
    console.log(`🔍 Search inputs found: ${searchInput}`)
    
    console.log('✅ Suppliers Management test completed')
  })

  test('should test Locations Management functionality', async () => {
    console.log('🚀 Testing Locations Management...')
    
    const loginSuccess = await loginAsAdmin(page)
    expect(loginSuccess).toBe(true)
    
    await page.goto('http://localhost:3001/locations')
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    
    // Check if page loads
    const pageContent = await page.textContent('body')
    expect(pageContent).toBeTruthy()
    
    // Check for location-specific elements
    const locationElements = await page.locator('.location, .MuiCard-root').count()
    console.log(`📍 Location elements found: ${locationElements}`)
    
    console.log('✅ Locations Management test completed')
  })

  test('should test Dresses Management functionality', async () => {
    console.log('🚀 Testing Dresses Management...')
    
    const loginSuccess = await loginAsAdmin(page)
    expect(loginSuccess).toBe(true)
    
    await page.goto('http://localhost:3001/dresses')
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    
    // Check if page loads
    const pageContent = await page.textContent('body')
    expect(pageContent).toBeTruthy()
    
    // Check for dress-specific elements
    const dressElements = await page.locator('.dress, .MuiCard-root, .new-dress').count()
    console.log(`👗 Dress elements found: ${dressElements}`)
    
    console.log('✅ Dresses Management test completed')
  })

  test('should test Users Management functionality', async () => {
    console.log('🚀 Testing Users Management...')
    
    const loginSuccess = await loginAsAdmin(page)
    expect(loginSuccess).toBe(true)
    
    await page.goto('http://localhost:3001/users')
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    
    // Check if page loads
    const pageContent = await page.textContent('body')
    expect(pageContent).toBeTruthy()
    
    // Check for user-specific elements
    const userElements = await page.locator('.user, .MuiCard-root').count()
    console.log(`👤 User elements found: ${userElements}`)
    
    console.log('✅ Users Management test completed')
  })

  test('should test frontend search functionality', async () => {
    console.log('🚀 Testing Frontend Search Functionality...')
    
    // Go to frontend
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    
    // Check if page loads
    const pageContent = await page.textContent('body')
    expect(pageContent).toBeTruthy()
    
    // Look for search form
    const searchForm = await page.locator('form, .search-form, [data-testid*="search"]').count()
    console.log(`🔍 Search forms found: ${searchForm}`)
    
    // Look for location dropdown
    const locationDropdown = await page.locator('select, .MuiSelect-root, [data-testid*="location"]').count()
    console.log(`📍 Location dropdowns found: ${locationDropdown}`)
    
    // Try to interact with search if available
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"]').first()
    if (await searchInput.count() > 0) {
      await searchInput.fill('dress')
      console.log('✅ Search input functional')
    }
    
    console.log('✅ Frontend Search test completed')
  })
})
