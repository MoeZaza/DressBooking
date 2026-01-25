import { test, expect } from '@playwright/test'

test.describe('Diagnostic Tests', () => {
  test('diagnose sign-in page', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL('**/sign-in', { timeout: 15000 })

    // Take a screenshot
    await page.screenshot({ path: 'sign-in-page.png' })

    // Get the page title
    const title = await page.title()
    console.log('Page title:', title)

    // Get the page URL
    const url = page.url()
    console.log('Page URL:', url)

    // Look for any input fields
    const inputs = await page.locator('input').all()
    console.log(`Found ${inputs.length} input fields`)

    for (const input of inputs) {
      const type = await input.getAttribute('type')
      const name = await input.getAttribute('name')
      const placeholder = await input.getAttribute('placeholder')
      const label = await input.evaluate(el => {
        const labelEl = el.closest('label') || document.querySelector(`label[for="${el.id}"]`)
        return labelEl?.textContent?.trim() || ''
      })
      console.log(`Input: type=${type}, name=${name}, placeholder=${placeholder}, label=${label}`)
    }

    // Look for any buttons
    const buttons = await page.locator('button').all()
    console.log(`Found ${buttons.length} buttons`)

    for (const button of buttons.slice(0, 5)) {
      const text = await button.textContent()
      const type = await button.getAttribute('type')
      console.log(`Button: text="${text?.trim()}", type=${type}`)
    }

    // Try to log in
    const emailInput = page.locator('input[name="email"], input[type="email"]').first()
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first()
    const submitButton = page.locator('button[type="submit"]').first()

    const hasEmailInput = await emailInput.count() > 0
    const hasPasswordInput = await passwordInput.count() > 0
    const hasSubmitButton = await submitButton.count() > 0

    console.log(`Has email input: ${hasEmailInput}`)
    console.log(`Has password input: ${hasPasswordInput}`)
    console.log(`Has submit button: ${hasSubmitButton}`)

    if (hasEmailInput && hasPasswordInput && hasSubmitButton) {
      console.log('Attempting login...')

      await emailInput.fill('admin@bookdress.ps')
      await passwordInput.fill('Admin2024!')

      // Take screenshot before submitting
      await page.screenshot({ path: 'before-submit.png' })

      await submitButton.click()

      // Wait and see where we end up
      await page.waitForTimeout(5000)

      const finalUrl = page.url()
      console.log('Final URL after login attempt:', finalUrl)

      // Take final screenshot
      await page.screenshot({ path: 'after-submit.png' })

      // Check for any error messages
      const errorElements = await page.locator('text=/error|failed|incorrect|invalid/i').all()
      console.log(`Found ${errorElements.length} potential error messages`)

      for (const error of errorElements) {
        const text = await error.textContent()
        console.log(`Error message: "${text?.trim()}"`)
      }
    }
  })

  test('check create-booking page structure', async ({ page }) => {
    // Try to navigate directly to create-booking
    await page.goto('/create-booking')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Take screenshot
    await page.screenshot({ path: 'create-booking-page.png' })

    const url = page.url()
    console.log('Create-booking URL:', url)

    // Look for any dropdowns or autocomplete components
    const autocompleteElements = await page.locator('[role="combobox"], .autocomplete, [class*="Autocomplete"]').all()
    console.log(`Found ${autocompleteElements.length} autocomplete elements`)

    // Look for labels
    const labels = await page.locator('label').all()
    console.log(`Found ${labels.length} labels`)

    for (const label of labels.slice(0, 10)) {
      const text = await label.textContent()
      console.log(`Label: "${text?.trim()}"`)
    }

    // Look for MUI components
    const textFields = await page.locator('.MuiTextField-root, .MuiFormControl-root').all()
    console.log(`Found ${textFields.length} MUI form controls`)
  })
})
