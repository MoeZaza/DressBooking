import { Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Login to backend as admin
   */
  async loginAsAdmin() {
    await this.page.goto('/sign-in?lang=ar');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector('form', { timeout: 10000 });

    await this.page.fill('input[name="email"]', 'admin@bookdress.com');
    await this.page.fill('input[name="password"]', 'admin123');
    await this.page.click('button[type="submit"]');

    // Wait for successful login (redirect to root)
    await this.page.waitForTimeout(3000);

    // Verify we're logged in by checking the URL or page content
    const currentUrl = this.page.url();
    if (currentUrl.includes('sign-in')) {
      throw new Error('Login failed - still on sign-in page');
    }

    // Navigate to dashboard manually (since login redirects to root)
    await this.page.goto('/dashboard?lang=ar');
    await this.page.waitForLoadState('networkidle');

    // Check for any dashboard content (more flexible check)
    const pageContent = await this.page.textContent('body');
    if (!pageContent || pageContent.length < 100) {
      throw new Error('Dashboard appears to be empty');
    }
  }

  /**
   * Login to backend as supplier
   */
  async loginAsSupplier() {
    await this.page.goto('/sign-in?lang=ar');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector('form', { timeout: 10000 });

    await this.page.fill('input[name="email"]', 'sofia@sofiaboutique.ps');
    await this.page.fill('input[name="password"]', 'supplier123');
    await this.page.click('button[type="submit"]');

    // Wait for successful login (redirect to root)
    await this.page.waitForTimeout(3000);

    // Verify we're logged in by checking the URL or page content
    const currentUrl = this.page.url();
    if (currentUrl.includes('sign-in')) {
      throw new Error('Supplier login failed - still on sign-in page');
    }

    // Navigate to dashboard manually (since login redirects to root)
    await this.page.goto('/dashboard?lang=ar');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Switch language to Arabic
   */
  async switchToArabic() {
    // Try URL parameter approach first
    const currentUrl = this.page.url();
    const url = new URL(currentUrl);
    url.searchParams.set('lang', 'ar');
    await this.page.goto(url.toString());
    
    // Wait for Arabic content to load
    await this.page.waitForTimeout(1000);
  }

  /**
   * Switch language to English
   */
  async switchToEnglish() {
    const currentUrl = this.page.url();
    const url = new URL(currentUrl);
    url.searchParams.set('lang', 'en');
    await this.page.goto(url.toString());
    
    await this.page.waitForTimeout(1000);
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoading() {
    // Wait for common loading indicators to disappear
    await this.page.waitForLoadState('networkidle');
    
    const loadingSelectors = [
      '.loading',
      '.spinner',
      '[data-testid="loading"]',
      '.MuiCircularProgress-root',
      'text=Loading...',
      'text=جاري التحميل...'
    ];

    for (const selector of loadingSelectors) {
      try {
        await this.page.waitForSelector(selector, { state: 'hidden', timeout: 5000 });
      } catch {
        // Ignore if selector not found
      }
    }
  }

  /**
   * Take screenshot with timestamp
   */
  async takeScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${timestamp}.png`,
      fullPage: true 
    });
  }

  /**
   * Check if page has Arabic content
   */
  async hasArabicContent(): Promise<boolean> {
    const arabicText = this.page.locator('text=/[\u0600-\u06FF]/').first();
    return await arabicText.isVisible().catch(() => false);
  }

  /**
   * Fill form field by label (supports Arabic and English)
   */
  async fillFieldByLabel(label: string, value: string) {
    // Try different approaches to find the field
    const selectors = [
      `input[aria-label="${label}"]`,
      `input[placeholder="${label}"]`,
      `label:has-text("${label}") + input`,
      `label:has-text("${label}") input`,
      `text=${label} >> .. >> input`,
    ];

    for (const selector of selectors) {
      try {
        const field = this.page.locator(selector).first();
        if (await field.isVisible()) {
          await field.fill(value);
          return;
        }
      } catch {
        continue;
      }
    }

    throw new Error(`Could not find field with label: ${label}`);
  }

  /**
   * Click button by text (supports Arabic and English)
   */
  async clickButtonByText(text: string) {
    const button = this.page.locator(`button:has-text("${text}"), input[type="submit"][value="${text}"], a:has-text("${text}")`).first();
    await expect(button).toBeVisible();
    await button.click();
  }

  /**
   * Check if error message is displayed
   */
  async checkForErrors(): Promise<string[]> {
    const errorSelectors = [
      '.error',
      '.alert-error',
      '.MuiAlert-standardError',
      '[role="alert"]',
      'text=/error/i',
      'text=/خطأ/',
    ];

    const errors: string[] = [];
    for (const selector of errorSelectors) {
      try {
        const errorElements = await this.page.locator(selector).all();
        for (const element of errorElements) {
          if (await element.isVisible()) {
            const text = await element.textContent();
            if (text) errors.push(text.trim());
          }
        }
      } catch {
        // Ignore if selector not found
      }
    }

    return errors;
  }
}
