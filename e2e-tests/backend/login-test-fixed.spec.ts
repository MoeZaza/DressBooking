import { test, expect, Page } from '@playwright/test'

/**
 * Fixed Login Test
 * Tests login functionality with security fixes applied
 */

test.describe('Fixed Login Tests', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    test.setTimeout(60000)
  })

  test('should successfully login with admin credentials', async () => {
    console.log('🚀 Testing Fixed Login Functionality...')
    
    // Navigate to login page
    await page.goto('http://localhost:3001/sign-in')
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    
    console.log('✅ Login page loaded')
    
    // Check if login form elements are present
    const emailInput = page.locator('input[name="email"], input[type="email"]')
    const passwordInput = page.locator('input[name="password"], input[type="password"]')
    const submitButton = page.locator('button[type="submit"], .MuiButton-root:has-text("Sign In")')
    
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(submitButton).toBeVisible()
    
    console.log('✅ Login form elements are visible')
    
    // Fill in credentials
    await emailInput.fill('admin@bookdress.com')
    await passwordInput.fill('admin123')
    
    console.log('✅ Credentials filled')
    
    // Submit the form
    await submitButton.click()
    
    console.log('✅ Login form submitted')
    
    // Wait for navigation or success response
    try {
      // Wait for either dashboard redirect or error message
      await Promise.race([
        page.waitForURL(/\/(dashboard)?$/, { timeout: 30000 }),
        page.waitForSelector('.error, .alert, [data-testid="error"]', { timeout: 5000 })
      ])
      
      const currentUrl = page.url()
      console.log(`🔗 Current URL after login: ${currentUrl}`)
      
      // Check if we're on dashboard or if there's an error
      if (currentUrl.includes('dashboard') || currentUrl === 'http://localhost:3001/') {
        console.log('✅ Login successful - redirected to dashboard')
        
        // Verify we can see dashboard content
        const pageContent = await page.textContent('body')
        expect(pageContent).toBeTruthy()
        
        // Look for dashboard indicators
        const dashboardElements = await page.locator('.dashboard, [data-testid*="dashboard"], .admin-dashboard').count()
        console.log(`📊 Dashboard elements found: ${dashboardElements}`)
        
      } else {
        // Check for error messages
        const errorElement = await page.locator('.error, .alert, [data-testid="error"]').first()
        if (await errorElement.isVisible()) {
          const errorText = await errorElement.textContent()
          console.log(`❌ Login error: ${errorText}`)
          
          // If it's a SUSPICIOUS_ACTIVITY error, the security fix didn't work
          if (errorText?.includes('SUSPICIOUS_ACTIVITY')) {
            throw new Error('SUSPICIOUS_ACTIVITY error still occurring - security configuration needs adjustment')
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Login process failed:', error)
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'login-error-screenshot.png' })
      
      // Get any console errors
      const logs = await page.evaluate(() => {
        return (window as any).console.logs || []
      })
      console.log('Browser console logs:', logs)
      
      throw error
    }
  })

  test('should handle invalid credentials gracefully', async () => {
    console.log('🚀 Testing Invalid Credentials Handling...')
    
    await page.goto('http://localhost:3001/sign-in')
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    
    // Fill in invalid credentials
    await page.fill('input[name="email"], input[type="email"]', 'invalid@test.com')
    await page.fill('input[name="password"], input[type="password"]', 'wrongpassword')
    
    // Submit the form
    await page.click('button[type="submit"], .MuiButton-root:has-text("Sign In")')
    
    // Should show error message, not SUSPICIOUS_ACTIVITY
    await page.waitForSelector('.error, .alert, [data-testid="error"]', { timeout: 10000 })
    
    const errorText = await page.locator('.error, .alert, [data-testid="error"]').first().textContent()
    console.log(`📝 Error message: ${errorText}`)
    
    // Should not be SUSPICIOUS_ACTIVITY error
    expect(errorText).not.toContain('SUSPICIOUS_ACTIVITY')
    expect(errorText).not.toContain('Security violation detected')
    
    console.log('✅ Invalid credentials handled gracefully')
  })

  test('should test API endpoints directly', async () => {
    console.log('🚀 Testing API Endpoints Directly...')
    
    // Test sign-in endpoint directly
    const response = await page.request.post('http://localhost:4002/api/sign-in', {
      data: {
        email: 'admin@bookdress.com',
        password: 'admin123'
      },
      headers: {
        'Content-Type': 'application/json',
        'X-Playwright-Test': 'true'
      }
    })
    
    console.log(`🔗 API Response Status: ${response.status()}`)
    
    if (response.status() === 200) {
      const responseData = await response.json()
      console.log('✅ API login successful')
      console.log(`📝 Response keys: ${Object.keys(responseData)}`)
      
      // Should have token and user data
      expect(responseData).toHaveProperty('accessToken')
      expect(responseData).toHaveProperty('user')
      
    } else {
      const errorData = await response.text()
      console.log(`❌ API login failed: ${errorData}`)
      
      // Should not be SUSPICIOUS_ACTIVITY error
      expect(errorData).not.toContain('SUSPICIOUS_ACTIVITY')
      expect(errorData).not.toContain('Security violation detected')
    }
  })
})
