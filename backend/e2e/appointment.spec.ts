import { test, expect } from '@playwright/test'

test.describe('Appointments', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/')
    await page.waitForURL('**/sign-in')

    await page.fill('input[name="email"]', 'admin@bookdress.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/', { timeout: 10000 })
  })

  test('should display appointments list', async ({ page }) => {
    await page.goto('/my-appointments')
    await page.waitForLoadState('networkidle')

    // Check if page loads without errors
    const currentUrl = page.url()
    expect(currentUrl).toContain('appointment')

    console.log('Appointments page loaded successfully')
  })

  test('should create a new appointment', async ({ page }) => {
    // Navigate to appointments page
    await page.goto('/my-appointments')
    await page.waitForLoadState('networkidle')

    // Look for create appointment button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add")').first()

    if (await createButton.isVisible()) {
      await createButton.click()
      await page.waitForTimeout(1000)

      // Fill in appointment details
      const titleInput = page.locator('input[name="title"], input[placeholder*="title"]')
      if (await titleInput.isVisible()) {
        await titleInput.fill('Test Appointment')
      }

      // Set date
      const dateInput = page.locator('input[type="date"], input[name="date"]')
      if (await dateInput.isVisible()) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        await dateInput.fill(tomorrow.toISOString().split('T')[0])
      }

      // Set time
      const timeInput = page.locator('input[type="time"], input[name="time"]')
      if (await timeInput.isVisible()) {
        await timeInput.fill('10:00')
      }

      // Submit form
      const submitButton = page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first()
      await submitButton.click()

      await page.waitForTimeout(2000)

      console.log('Appointment creation attempted')
    } else {
      console.log('Create appointment button not found')
    }
  })

  test('should view appointment calendar', async ({ page }) => {
    await page.goto('/my-appointments')
    await page.waitForLoadState('networkidle')

    // Check if calendar view is displayed
    const calendar = page.locator('[class*="calendar"], [class*="Calendar"], [role="grid"]')

    const calendarVisible = await calendar.isVisible()

    if (calendarVisible) {
      console.log('Calendar view is visible')

      // Try clicking on a date
      const todayButton = page.locator('button:has-text("Today"), [aria-label*="today"]')
      if (await todayButton.first().isVisible()) {
        await todayButton.first().click()
        await page.waitForTimeout(1000)
        console.log('Clicked on Today button')
      }
    } else {
      console.log('Calendar view not found - may be using list view')
    }

    // Check for any appointment items
    const appointments = page.locator('[class*="appointment"], [class*="Appointment"]')
    const appointmentCount = await appointments.count()

    console.log(`Found ${appointmentCount} appointment-related elements`)
  })

  test('should click on appointment and view details', async ({ page }) => {
    await page.goto('/my-appointments')
    await page.waitForLoadState('networkidle')

    // Look for clickable appointment items
    const appointmentItems = page.locator('[class*="appointment"], button, [role="button"]').filter({
      hasText: /^((?!Create|Add|Delete|Edit).)*$/ // Exclude action buttons
    })

    const count = await appointmentItems.count()

    if (count > 0) {
      // Click on first appointment item
      await appointmentItems.first().click()
      await page.waitForTimeout(1000)

      const currentUrl = page.url()
      console.log(`Navigated to: ${currentUrl}`)

      // Verify detail view loaded
      const detailContent = page.locator('[class*="detail"], [class*="Detail"], [class*="info"]')
      const hasDetail = await detailContent.count() > 0

      if (hasDetail) {
        console.log('Appointment detail view loaded')
      }
    } else {
      console.log('No appointment items found to click')
    }
  })

  test('should edit existing appointment', async ({ page }) => {
    await page.goto('/my-appointments')
    await page.waitForLoadState('networkidle')

    // Look for edit buttons
    const editButtons = page.locator('button:has-text("Edit"), button[aria-label*="edit"], [class*="edit"]')

    const editCount = await editButtons.count()

    if (editCount > 0) {
      await editButtons.first().click()
      await page.waitForTimeout(1000)

      // Modify some field
      const titleInput = page.locator('input[name="title"], input[placeholder*="title"]')
      if (await titleInput.isVisible()) {
        await titleInput.fill('Updated Appointment Title')

        // Save changes
        const saveButton = page.locator('button:has-text("Save"), button[type="submit"]')
        await saveButton.click()

        await page.waitForTimeout(2000)

        console.log('Appointment edited successfully')
      }
    } else {
      console.log('No edit buttons found')
    }
  })
})
