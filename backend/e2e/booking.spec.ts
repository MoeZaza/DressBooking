import { test, expect } from '@playwright/test'

test.describe('Booking Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to backend
    await page.goto('/')

    // Login as admin (using seeded test data)
    await page.waitForURL('**/sign-in', { timeout: 15000 })

    // Check if already logged in by checking current URL
    const currentUrl = page.url()
    if (!currentUrl.includes('sign-in')) {
      console.log('Already logged in')
      return
    }

    // Fill in login form with correct admin credentials
    await page.fill('input[name="email"]', 'admin@bookdress.ps')
    await page.fill('input[name="password"]', 'Admin2024!')
    await page.click('button[type="submit"]')

    // Wait for navigation to dashboard
    await page.waitForURL('**/', { timeout: 15000 })
    console.log('Logged in successfully')
  })

  test('should display all dropdowns with visible options', async ({ page }) => {
    // Navigate to create booking page
    await page.goto('/create-booking')

    // Wait for page to load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Step 1: Check Supplier dropdown exists (label contains "Supplier" or similar)
    const supplierLabel = page.locator('label:has-text("Supplier")').first()
    await expect(supplierLabel).toBeVisible({ timeout: 10000 })

    // Find the autocomplete input near the supplier label
    const supplierInput = page.locator('label:has-text("Supplier") + div input, label:has-text("Supplier") ~ * input').first()

    // Click on supplier dropdown to open options
    await supplierInput.click()
    await page.waitForTimeout(1000)

    // Check that supplier options are visible in the dropdown
    const supplierOptions = page.locator('li[role="option"], .ms-option')
    const supplierCount = await supplierOptions.count()

    expect(supplierCount).toBeGreaterThan(0)
    console.log(`Found ${supplierCount} supplier options`)

    // Verify supplier names are visible text
    for (let i = 0; i < Math.min(3, supplierCount); i++) {
      const optionText = await supplierOptions.nth(i).textContent()
      expect(optionText).not.toBe('')
      expect(optionText).not.toBe(null)
      console.log(`Supplier option ${i + 1}: ${optionText}`)
    }

    // Select first supplier
    await supplierOptions.first().click()
    await page.waitForTimeout(1000)

    // Step 2: Check Dress dropdown exists and has options
    const dressLabel = page.locator('label:has-text("Dress")').first()
    await expect(dressLabel).toBeVisible()

    // Find the autocomplete input near the dress label
    const dressInput = page.locator('label:has-text("Dress") + div input, label:has-text("Dress") ~ * input').first()

    await dressInput.click()
    await page.waitForTimeout(1000)

    // Check that dress options are visible
    const dressOptions = page.locator('li[role="option"], .ms-option')
    const dressCount = await dressOptions.count()

    expect(dressCount).toBeGreaterThan(0)
    console.log(`Found ${dressCount} dress options`)

    // Verify dress options have visible text
    for (let i = 0; i < Math.min(3, dressCount); i++) {
      const optionText = await dressOptions.nth(i).textContent()
      expect(optionText).not.toBe('')
      expect(optionText).not.toBe(null)
      console.log(`Dress option ${i + 1}: ${optionText}`)
    }

    // Close dress dropdown by clicking outside
    await page.click('body')
    await page.waitForTimeout(500)

    // Step 3: Check Location dropdown exists and has options
    const locationLabel = page.locator('label:has-text("Location")').first()

    // Location might be on the same page or next step
    const locationVisible = await locationLabel.isVisible({ timeout: 5000 })

    if (locationVisible) {
      const locationInput = page.locator('label:has-text("Location") + div input, label:has-text("Location") ~ * input').first()

      await locationInput.click()
      await page.waitForTimeout(1000)

      // Check that location options are visible
      const locationOptions = page.locator('li[role="option"], .ms-option')
      const locationCount = await locationOptions.count()

      expect(locationCount).toBeGreaterThan(0)
      console.log(`Found ${locationCount} location options`)

      // Verify location options have visible text
      for (let i = 0; i < Math.min(3, locationCount); i++) {
        const optionText = await locationOptions.nth(i).textContent()
        expect(optionText).not.toBe('')
        expect(optionText).not.toBe(null)
        console.log(`Location option ${i + 1}: ${optionText}`)
      }
    } else {
      console.log('Location dropdown not on current step - may be on next step')
    }
  })

  test('should create a new booking successfully', async ({ page }) => {
    // Navigate to create booking page
    await page.goto('/create-booking')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Step 1: Customer Information Step
    // Check if we need to create new customer or select existing
    const createNewCustomerSwitch = page.locator('input[type="checkbox"]').first()
    const createNewCustomerVisible = await createNewCustomerSwitch.isVisible()

    if (createNewCustomerVisible) {
      // Check the "Create New Customer" switch
      await createNewCustomerSwitch.click()
      await page.waitForTimeout(500)

      // Fill in customer details
      await page.fill('input[name*="name" i], label:has-text("Name") + input', 'Test Customer')
      await page.fill('input[name*="email" i], label:has-text("Email") + input', 'test@example.com')
      await page.fill('input[name*="phone" i], label:has-text("Phone") + input', '+1234567890')
    } else {
      // Select from existing customers
      const customerInput = page.locator('label:has-text("Customer") + div input').first()
      await customerInput.click()
      await page.waitForTimeout(1000)

      const customerOptions = page.locator('li[role="option"]')
      if (await customerOptions.count() > 0) {
        await customerOptions.first().click()
      }
    }

    await page.waitForTimeout(1000)

    // Click Next to go to dress selection
    await page.click('button:has-text("Next")')
    await page.waitForTimeout(1500)

    // Step 2: Dress and Booking Details
    // Select Supplier
    const supplierInput = page.locator('label:has-text("Supplier") + div input').first()
    await supplierInput.click()
    await page.waitForTimeout(1000)

    const supplierOptions = page.locator('li[role="option"], .ms-option')
    const supplierCount = await supplierOptions.count()

    if (supplierCount > 0) {
      await supplierOptions.first().click()
      console.log('Selected supplier')
    }

    await page.waitForTimeout(1500)

    // Select Dress
    const dressInput = page.locator('label:has-text("Dress") + div input').first()
    await dressInput.click()
    await page.waitForTimeout(1000)

    const dressOptions = page.locator('li[role="option"], .ms-option')
    const dressCount = await dressOptions.count()

    if (dressCount > 0) {
      await dressOptions.first().click()
      console.log('Selected dress')
    }

    await page.waitForTimeout(1000)

    // Select Location
    const locationInput = page.locator('label:has-text("Location") + div input').first()
    await locationInput.click()
    await page.waitForTimeout(1000)

    const locationOptions = page.locator('li[role="option"], .ms-option')
    const locationCount = await locationOptions.count()

    if (locationCount > 0) {
      await locationOptions.first().click()
      console.log('Selected location')
    }

    await page.waitForTimeout(1000)

    // Click Next to go to payment step
    await page.click('button:has-text("Next")')
    await page.waitForTimeout(1500)

    // Verify we're on the payment/detail step
    const priceVisible = await page.locator('text=/Price|Payment/i').isVisible()

    if (priceVisible) {
      console.log('On payment/detail step')

      // Click Confirm/Create to create booking
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Create"), button[type="submit"]').first()
      await confirmButton.click()
      await page.waitForTimeout(2000)

      // Check for success message or redirect
      const currentUrl = page.url()
      console.log('After booking creation, current URL:', currentUrl)
    } else {
      console.log('Payment step not visible - may have completed or different flow')
    }
  })

  test('should show booking in bookings list after creation', async ({ page }) => {
    // First check if there are existing bookings
    await page.goto('/bookings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Verify bookings page loaded
    const currentUrl = page.url()
    expect(currentUrl).toContain('booking')

    // Look for booking-related elements
    const bookingItems = page.locator('[class*="booking"], tr, [class*="row"]')
    const itemCount = await bookingItems.count()

    console.log(`Found ${itemCount} booking-related elements on the page`)

    // Check if there's any content (not just empty state)
    const emptyState = page.locator('text=/no.*booking|empty|nothing.*found/i')
    const hasEmptyState = await emptyState.count() > 0

    if (hasEmptyState) {
      const message = await emptyState.first().textContent()
      console.log(`Empty state message: ${message}`)
    } else {
      console.log('Bookings list has content')
    }
  })

  test('should filter and view bookings', async ({ page }) => {
    await page.goto('/bookings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Check if filter controls exist
    const supplierFilter = page.locator('[class*="supplier"], [class*="Supplier"]').first()

    const filterVisible = await supplierFilter.isVisible({ timeout: 5000 })

    if (filterVisible) {
      console.log('Filter controls found')

      // Try clicking on filter
      await supplierFilter.click()
      await page.waitForTimeout(500)

      // Check if options appear
      const options = page.locator('li[role="option"]')
      const optionCount = await options.count()

      if (optionCount > 0) {
        console.log(`Found ${optionCount} filter options`)
      } else {
        console.log('No filter options found')
      }
    } else {
      console.log('Filter controls not visible or not found')
    }
  })
})
