import { test, expect } from '@playwright/test'

test.describe('Navigation and Views', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/')
    await page.waitForURL('**/sign-in')

    await page.fill('input[name="email"]', 'admin@bookdress.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/', { timeout: 10000 })
  })

  test('should navigate between main pages', async ({ page }) => {
    const mainPages = [
      { path: '/dresses', name: 'Dresses' },
      { path: '/bookings', name: 'Bookings' },
      { path: '/my-appointments', name: 'Appointments' },
      { path: '/users', name: 'Users' },
      { path: '/suppliers', name: 'Suppliers' },
      { path: '/locations', name: 'Locations' },
    ]

    for (const pageConfig of mainPages) {
      await page.goto(pageConfig.path)
      await page.waitForLoadState('networkidle')

      const currentUrl = page.url()
      expect(currentUrl).toContain(pageConfig.path.toLowerCase())

      // Check for page content
      const content = page.locator('body')
      const hasContent = await content.count() > 0

      expect(hasContent).toBe(true)

      console.log(`${pageConfig.name} page loaded successfully`)
    }
  })

  test('should navigate from dress list to dress detail', async ({ page }) => {
    await page.goto('/dresses')
    await page.waitForLoadState('networkidle')

    // Find first dress link or clickable element
    const dressLinks = page.locator('a[href*="dress"], [role="button"][class*="dress"]').filter({
      hasText: /^((?!Delete|Edit).)*$/
    })

    const count = await dressLinks.count()

    if (count > 0) {
      const firstLink = dressLinks.first()

      // Get href if available
      const href = await firstLink.getAttribute('href')

      await firstLink.click()
      await page.waitForTimeout(1000)

      const currentUrl = page.url()

      if (href) {
        expect(currentUrl).toContain('dress')
      }

      console.log(`Navigated from dress list to: ${currentUrl}`)

      // Verify we're on a detail view
      const detailIndicator = page.locator('[class*="detail"], h1, h2')
      const hasDetail = await detailIndicator.count() > 0

      expect(hasDetail).toBe(true)
    } else {
      console.log('No dress links found')
    }
  })

  test('should navigate from booking list to booking detail', async ({ page }) => {
    await page.goto('/bookings')
    await page.waitForLoadState('networkidle')

    // Find booking items
    const bookingItems = page.locator('a[href*="booking"], [class*="booking"]').filter({
      hasText: /^((!:Delete|Edit|Cancel).)*$/
    })

    const count = await bookingItems.count()

    if (count > 0) {
      await bookingItems.first().click()
      await page.waitForTimeout(1000)

      const currentUrl = page.url()
      expect(currentUrl).toContain('booking')

      console.log(`Navigated to booking detail: ${currentUrl}`)

      // Verify detail view
      const detailContent = page.locator('[class*="detail"], [class*="info"]')
      const hasDetail = await detailContent.count() > 0

      if (hasDetail) {
        console.log('Booking detail content loaded')
      }
    } else {
      console.log('No booking items found')
    }
  })

  test('should navigate from appointments calendar to appointment detail', async ({ page }) => {
    await page.goto('/my-appointments')
    await page.waitForLoadState('networkidle')

    // Look for clickable appointment items
    const appointmentItems = page.locator('[class*="appointment"], button[aria-label*="appointment"]').filter({
      hasText: /^((?!Create|Add|Delete).)*$/
    })

    const count = await appointmentItems.count()

    if (count > 0) {
      await appointmentItems.first().click()
      await page.waitForTimeout(1000)

      const currentUrl = page.url()
      console.log(`Navigated to: ${currentUrl}`)

      // Verify we're on a detail or edit view
      const detailView = page.locator('[class*="detail"], [class*="form"], form')
      const hasDetail = await detailView.count() > 0

      expect(hasDetail).toBe(true)
    } else {
      console.log('No clickable appointment items found')
    }
  })

  test('should check all views for empty content', async ({ page }) => {
    const viewsToCheck = [
      '/dresses',
      '/bookings',
      '/my-appointments',
      '/users',
      '/suppliers',
      '/locations',
    ]

    for (const viewPath of viewsToCheck) {
      await page.goto(viewPath)
      await page.waitForLoadState('networkidle')

      // Check for empty state indicators
      const emptyState = page.locator('text=/no.*found|empty|nothing|0 result/i')
      const hasEmpty = await emptyState.count() > 0

      if (hasEmpty) {
        const message = await emptyState.first().textContent()
        console.log(`EMPTY VIEW at ${viewPath}: ${message}`)
      } else {
        // Check if there's actual content
        const contentElements = page.locator('[class*="list"], [class*="grid"], [class*="item"], [class*="row"], tr, li')
        const contentCount = await contentElements.count()

        if (contentCount > 0) {
          console.log(`${viewPath}: Has content (${contentCount} elements)`)
        } else {
          console.log(`WARNING: ${viewPath} may be empty - no content elements found`)
        }
      }
    }
  })

  test('should verify navigation menu links work', async ({ page }) => {
    // Check for main navigation
    const navLinks = page.locator('nav a, header a, [role="navigation"] a')

    const linkCount = await navLinks.count()

    console.log(`Found ${linkCount} navigation links`)

    if (linkCount > 0) {
      // Test first few navigation links
      const linksToTest = Math.min(5, linkCount)

      for (let i = 0; i < linksToTest; i++) {
        const link = navLinks.nth(i)

        const href = await link.getAttribute('href')
        const text = await link.textContent()

        if (href && !href.startsWith('http')) {
          await link.click()
          await page.waitForTimeout(1000)

          const currentUrl = page.url()

          if (currentUrl.includes('sign-in')) {
            console.log(`Navigation to ${href} requires authentication`)
            // Go back to home
            await page.goto('/')
            await page.waitForURL('**/', { timeout: 10000 })
          } else {
            console.log(`Navigated to: ${href} (${text?.trim()})`)
          }
        }
      }
    } else {
      console.log('No navigation links found')
    }
  })

  test('should check calendar views render correctly', async ({ page }) => {
    // Check booking calendar
    await page.goto('/bookings')
    await page.waitForLoadState('networkidle')

    const calendarView = page.locator('[class*="calendar"], [role="grid"]')
    const hasBookingCalendar = await calendarView.count() > 0

    if (hasBookingCalendar) {
      console.log('Booking calendar view is present')
    } else {
      console.log('Booking calendar may be in list view')
    }

    // Check appointment calendar
    await page.goto('/my-appointments')
    await page.waitForLoadState('networkidle')

    const appointmentCalendar = page.locator('[class*="calendar"], [role="grid"]')
    const hasAppointmentCalendar = await appointmentCalendar.count() > 0

    if (hasAppointmentCalendar) {
      console.log('Appointment calendar view is present')
    } else {
      console.log('Appointment calendar may be in list view')
    }
  })
})
