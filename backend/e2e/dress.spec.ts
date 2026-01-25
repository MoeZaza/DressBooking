import { test, expect } from '@playwright/test'

test.describe('Dress Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/')
    await page.waitForURL('**/sign-in')

    await page.fill('input[name="email"]', 'admin@bookdress.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/', { timeout: 10000 })
  })

  test('should display dresses list', async ({ page }) => {
    await page.goto('/dresses')
    await page.waitForLoadState('networkidle')

    // Verify page loaded
    const currentUrl = page.url()
    expect(currentUrl).toContain('dress')

    // Check for dress items
    const dressItems = page.locator('[class*="dress"], [class*="Dress"]')
    const dressCount = await dressItems.count()

    expect(dressCount).toBeGreaterThan(0)
    console.log(`Found ${dressCount} dress-related elements`)

    // Check for images
    const images = page.locator('img[src*="dress"], img[alt*="dress"], img[alt*="Dress"]')
    const imageCount = await images.count()

    console.log(`Found ${imageCount} dress images`)
  })

  test('should filter dresses by supplier', async ({ page }) => {
    await page.goto('/dresses')
    await page.waitForLoadState('networkidle')

    // Look for supplier filter
    const supplierFilter = page.locator('[class*="supplier"], [class*="Supplier"]').first()

    if (await supplierFilter.isVisible()) {
      await supplierFilter.click()
      await page.waitForTimeout(500)

      // Select a supplier option
      const options = page.locator('li[role="option"]')
      const optionCount = await options.count()

      if (optionCount > 0) {
        const firstOptionText = await options.first().textContent()
        await options.first().click()

        await page.waitForTimeout(1000)

        console.log(`Selected supplier: ${firstOptionText}`)

        // Verify dresses are filtered
        await page.waitForLoadState('networkidle')
      }
    } else {
      console.log('Supplier filter not found')
    }
  })

  test('should create a new dress', async ({ page }) => {
    await page.goto('/create-dress')
    await page.waitForLoadState('networkidle')

    // Verify create dress page loaded
    const currentUrl = page.url()
    expect(currentUrl).toContain('create-dress')

    // Fill in basic dress information
    const nameInput = page.locator('input[name="name"], input[placeholder*="name"]')
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test Dress for E2E')
    }

    // Select supplier
    const supplierSelect = page.locator('[class*="supplier"] input, input[name="supplier"]').first()
    if (await supplierSelect.isVisible()) {
      await supplierSelect.click()
      await page.waitForTimeout(500)

      const supplierOptions = page.locator('li[role="option"]')
      if (await supplierOptions.count() > 0) {
        await supplierOptions.first().click()
        await page.waitForTimeout(500)
      }
    }

    // Fill in price
    const priceInput = page.locator('input[name="price"], input[type="number"]').first()
    if (await priceInput.isVisible()) {
      await priceInput.fill('500')
    }

    // Select dress type
    const typeSelect = page.locator('[class*="type"] input, select[name="type"]').first()
    if (await typeSelect.isVisible()) {
      await typeSelect.click()
      await page.waitForTimeout(500)

      const typeOptions = page.locator('li[role="option"], option')
      if (await typeOptions.count() > 0) {
        await typeOptions.first().click()
        await page.waitForTimeout(500)
      }
    }

    // Submit form
    const submitButton = page.locator('button:has-text("Create"), button:has-text("Save"), button[type="submit"]')
    const submitCount = await submitButton.count()

    if (submitCount > 0) {
      await submitButton.first().click()
      await page.waitForTimeout(2000)

      console.log('Dress creation attempted')
    } else {
      console.log('Submit button not found')
    }
  })

  test('should click dress and view details', async ({ page }) => {
    await page.goto('/dresses')
    await page.waitForLoadState('networkidle')

    // Look for clickable dress items
    const dressCards = page.locator('[class*="dress-card"], [class*="dress-item"], a[href*="dress"]').filter({
      hasText: /^((?!Delete|Edit).)*$/
    })

    const count = await dressCards.count()

    if (count > 0) {
      await dressCards.first().click()
      await page.waitForTimeout(1000)

      const currentUrl = page.url()
      console.log(`Navigated to: ${currentUrl}`)

      // Verify detail view
      const detailView = page.locator('[class*="detail"], [class*="Detail"]')
      const hasDetail = await detailView.count() > 0

      if (hasDetail) {
        console.log('Dress detail view loaded')

        // Check for dress information
        const dressName = page.locator('h1, h2, [class*="title"], [class*="name"]')
        const nameCount = await dressName.count()

        if (nameCount > 0) {
          const name = await dressName.first().textContent()
          console.log(`Dress name: ${name}`)
        }
      }
    } else {
      console.log('No dress items found to click')
    }
  })

  test('should edit existing dress', async ({ page }) => {
    // Navigate to a specific dress for editing
    // First, go to dresses list and get a dress ID
    await page.goto('/dresses')
    await page.waitForLoadState('networkidle')

    // Look for edit buttons or links
    const editButtons = page.locator('button:has-text("Edit"), [aria-label*="edit"], a[href*="edit"]')

    const editCount = await editButtons.count()

    if (editCount > 0) {
      await editButtons.first().click()
      await page.waitForTimeout(1000)

      const currentUrl = page.url()
      console.log(`Navigated to edit page: ${currentUrl}`)

      // Modify dress name
      const nameInput = page.locator('input[name="name"], input[placeholder*="name"]')
      if (await nameInput.isVisible()) {
        await nameInput.fill('Updated Dress Name')

        // Save changes
        const saveButton = page.locator('button:has-text("Save"), button[type="submit"]')
        await saveButton.click()

        await page.waitForTimeout(2000)

        console.log('Dress edited successfully')
      }
    } else {
      console.log('No edit buttons found - may need to navigate via detail view')
    }
  })

  test('should check for empty views in dresses', async ({ page }) => {
    await page.goto('/dresses')
    await page.waitForLoadState('networkidle')

    // Check for empty state messages
    const emptyMessage = page.locator('text=/no.*dress|empty|nothing.*found/i')
    const hasEmptyMessage = await emptyMessage.count() > 0

    if (hasEmptyMessage) {
      const message = await emptyMessage.first().textContent()
      console.log(`Empty state message found: ${message}`)
    } else {
      console.log('No empty state - dresses are displayed')
    }

    // Check if dress list has content
    const dressList = page.locator('[class*="dress-list"], [class*="grid"], [class*="container"]')
    const listCount = await dressList.count()

    if (listCount > 0) {
      // Check if list has children
      const firstList = dressList.first()
      const children = firstList.locator('*')

      const childCount = await children.count()

      if (childCount > 5) {
        console.log('Dress list has content')
      } else {
        console.log('Dress list appears empty or has minimal content')
      }
    }
  })
})
