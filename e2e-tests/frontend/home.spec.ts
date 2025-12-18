import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Frontend Home Page', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should display home page in Arabic', async ({ page }) => {
    await page.goto('/?lang=ar');
    await helpers.waitForLoading();
    
    // Check if Arabic content is loaded
    await expect(page.locator('text=الرئيسية')).toBeVisible(); // Home in Arabic
    
    // Check for main sections
    await expect(page.locator('text=البحث عن الفساتين')).toBeVisible(); // Search for dresses
    
    await helpers.takeScreenshot('home-page-arabic');
  });

  test('should display search form', async ({ page }) => {
    await page.goto('/?lang=ar');
    await helpers.waitForLoading();
    
    // Check for search form elements
    await expect(page.locator('input[name="from"], [data-testid="from-date"]')).toBeVisible(); // From date
    await expect(page.locator('input[name="to"], [data-testid="to-date"]')).toBeVisible(); // To date
    
    // Check for location selector
    await expect(page.locator('[data-testid="location-select"], .location-select')).toBeVisible();
    
    // Check for dress type selector
    await expect(page.locator('[data-testid="dress-type"], select[name="dressType"]')).toBeVisible();
    
    // Check for search button
    await expect(page.locator('button:has-text("بحث"), button[type="submit"]')).toBeVisible(); // Search button
    
    await helpers.takeScreenshot('search-form');
  });

  test('should perform dress search', async ({ page }) => {
    await page.goto('/?lang=ar');
    await helpers.waitForLoading();
    
    // Fill search form
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() + 7);
    const toDate = new Date();
    toDate.setDate(toDate.getDate() + 10);
    
    // Fill dates
    const fromField = page.locator('input[name="from"], [data-testid="from-date"]').first();
    const toField = page.locator('input[name="to"], [data-testid="to-date"]').first();
    
    if (await fromField.isVisible()) {
      await fromField.fill(fromDate.toISOString().split('T')[0]);
    }
    if (await toField.isVisible()) {
      await toField.fill(toDate.toISOString().split('T')[0]);
    }
    
    // Select location
    const locationSelect = page.locator('[data-testid="location-select"], .location-select').first();
    if (await locationSelect.isVisible()) {
      await locationSelect.click();
      await page.waitForTimeout(1000);
      
      const firstLocation = page.locator('.MuiAutocomplete-option, .location-option').first();
      if (await firstLocation.isVisible()) {
        await firstLocation.click();
      }
    }
    
    await helpers.takeScreenshot('search-form-filled');
    
    // Submit search
    await helpers.clickButtonByText('بحث'); // Search
    
    // Should navigate to search results
    await page.waitForURL('**/search');
    await helpers.waitForLoading();
    
    // Check if results are displayed
    await expect(page.locator('.dress-list, [data-testid="dress-results"]')).toBeVisible();
    
    await helpers.takeScreenshot('search-results');
  });

  test('should display featured dresses', async ({ page }) => {
    await page.goto('/?lang=ar');
    await helpers.waitForLoading();
    
    // Check for featured dresses section
    const featuredSection = page.locator('.featured-dresses, [data-testid="featured-dresses"]');
    if (await featuredSection.isVisible()) {
      // Check if dress cards are displayed
      const dressCards = page.locator('.dress-card, [data-testid="dress-card"]');
      const cardCount = await dressCards.count();
      expect(cardCount).toBeGreaterThan(0);
      
      // Check dress card content
      const firstCard = dressCards.first();
      await expect(firstCard.locator('img')).toBeVisible(); // Dress image
      await expect(firstCard.locator('text=/\d+/')).toBeVisible(); // Price
      
      await helpers.takeScreenshot('featured-dresses');
    }
  });

  test('should navigate to different pages', async ({ page }) => {
    await page.goto('/?lang=ar');
    await helpers.waitForLoading();
    
    // Test navigation links
    const navLinks = [
      { text: 'الفساتين', url: '/dresses' }, // Dresses
      { text: 'حول', url: '/about' }, // About
      { text: 'اتصل بنا', url: '/contact' }, // Contact
    ];
    
    for (const link of navLinks) {
      const navLink = page.locator(`a:has-text("${link.text}"), nav a[href="${link.url}"]`).first();
      if (await navLink.isVisible()) {
        await navLink.click();
        await page.waitForURL(`**${link.url}`);
        await helpers.waitForLoading();
        
        await helpers.takeScreenshot(`navigation-${link.url.replace('/', '')}`);
        
        // Go back to home
        await page.goto('/?lang=ar');
        await helpers.waitForLoading();
      }
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/?lang=ar');
    await helpers.waitForLoading();
    
    // Check if mobile menu is available
    const mobileMenu = page.locator('.mobile-menu, [data-testid="mobile-menu"], .hamburger-menu');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      
      // Check if navigation items are visible
      await expect(page.locator('text=الفساتين')).toBeVisible();
      
      await helpers.takeScreenshot('mobile-menu');
    }
    
    // Check if search form is properly displayed on mobile
    await expect(page.locator('input[name="from"]')).toBeVisible();
    await expect(page.locator('input[name="to"]')).toBeVisible();
    
    await helpers.takeScreenshot('home-mobile');
  });

  test('should handle language switching', async ({ page }) => {
    await page.goto('/?lang=ar');
    await helpers.waitForLoading();
    
    // Verify Arabic content
    await expect(page.locator('text=الرئيسية')).toBeVisible();
    
    // Switch to English
    await helpers.switchToEnglish();
    
    // Verify English content
    await expect(page.locator('text=Home')).toBeVisible();
    
    // Switch back to Arabic
    await helpers.switchToArabic();
    
    // Verify Arabic content is back
    await expect(page.locator('text=الرئيسية')).toBeVisible();
    
    await helpers.takeScreenshot('language-switching');
  });

  test('should validate search form', async ({ page }) => {
    await page.goto('/?lang=ar');
    await helpers.waitForLoading();
    
    // Try to search without filling required fields
    await helpers.clickButtonByText('بحث');
    
    // Check for validation errors
    const errors = await helpers.checkForErrors();
    if (errors.length > 0) {
      await helpers.takeScreenshot('search-validation-errors');
    }
    
    // Fill invalid date range (to date before from date)
    const fromField = page.locator('input[name="from"]').first();
    const toField = page.locator('input[name="to"]').first();
    
    if (await fromField.isVisible() && await toField.isVisible()) {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      await fromField.fill(today.toISOString().split('T')[0]);
      await toField.fill(yesterday.toISOString().split('T')[0]);
      
      await helpers.clickButtonByText('بحث');
      
      // Should show date validation error
      const dateErrors = await helpers.checkForErrors();
      expect(dateErrors.length).toBeGreaterThan(0);
      
      await helpers.takeScreenshot('date-validation-error');
    }
  });

  test('should display loading states', async ({ page }) => {
    await page.goto('/?lang=ar');
    
    // Check for loading indicators during page load
    const loadingIndicators = page.locator('.loading, .spinner, [data-testid="loading"]');
    
    // If loading indicators are present, wait for them to disappear
    if (await loadingIndicators.first().isVisible()) {
      await helpers.takeScreenshot('loading-state');
      await helpers.waitForLoading();
    }
    
    // Page should be fully loaded now
    await expect(page.locator('text=الرئيسية')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept API calls and simulate network failure
    await page.route('**/api/**', route => {
      route.abort('failed');
    });
    
    await page.goto('/?lang=ar');
    await page.waitForTimeout(3000);
    
    // Check if error handling is in place
    const errors = await helpers.checkForErrors();
    if (errors.length > 0) {
      await helpers.takeScreenshot('network-error-handling');
    }
    
    // Page should still be functional even with API errors
    await expect(page.locator('text=الرئيسية')).toBeVisible();
  });
});
