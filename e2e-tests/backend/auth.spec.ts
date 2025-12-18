import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

test.describe('Backend Authentication', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should display login page in Arabic', async ({ page }) => {
    await page.goto('/sign-in?lang=ar');
    
    // Check if Arabic content is loaded
    await expect(page.locator('text=تسجيل الدخول')).toBeVisible(); // "Sign In" in Arabic
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    
    // Take screenshot for verification
    await helpers.takeScreenshot('login-page-arabic');
  });

  test('should login as admin successfully', async ({ page }) => {
    await helpers.loginAsAdmin();
    
    // Verify we're on the dashboard
    await expect(page.locator('text=لوحة التحكم')).toBeVisible(); // Dashboard in Arabic
    
    // Check for admin-specific elements
    await expect(page.locator('text=الموردين')).toBeVisible(); // Suppliers
    await expect(page.locator('text=المستخدمين')).toBeVisible(); // Users
    
    await helpers.takeScreenshot('admin-dashboard');
  });

  test('should login as supplier successfully', async ({ page }) => {
    await helpers.loginAsSupplier();
    
    // Verify we're on the dashboard
    await expect(page.locator('text=لوحة التحكم')).toBeVisible();
    
    // Supplier should not see admin-only sections
    await expect(page.locator('text=المستخدمين')).not.toBeVisible(); // Users section should be hidden
    
    await helpers.takeScreenshot('supplier-dashboard');
  });

  test('should handle invalid login credentials', async ({ page }) => {
    await page.goto('/sign-in?lang=ar');
    
    await page.fill('input[name="email"]', 'invalid@email.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Check for error message
    const errors = await helpers.checkForErrors();
    expect(errors.length).toBeGreaterThan(0);
    
    // Should still be on login page
    await expect(page.locator('text=تسجيل الدخول')).toBeVisible();
    
    await helpers.takeScreenshot('login-error');
  });

  test('should logout successfully', async ({ page }) => {
    await helpers.loginAsAdmin();
    
    // Find and click logout button
    const logoutButton = page.locator('text=تسجيل الخروج, button:has-text("تسجيل الخروج")').first();
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    } else {
      // Try menu approach
      await page.click('[data-testid="user-menu"], .user-menu, .profile-menu');
      await page.click('text=تسجيل الخروج');
    }
    
    // Should redirect to login page
    await page.waitForURL('**/sign-in');
    await expect(page.locator('text=تسجيل الدخول')).toBeVisible();
    
    await helpers.takeScreenshot('after-logout');
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/sign-in?lang=ar');
    
    // Try to submit without filling fields
    await page.click('button[type="submit"]');
    
    // Check for validation errors
    const emailField = page.locator('input[name="email"]');
    const passwordField = page.locator('input[name="password"]');
    
    // Check if fields are marked as invalid
    await expect(emailField).toHaveAttribute('aria-invalid', 'true');
    await expect(passwordField).toHaveAttribute('aria-invalid', 'true');
    
    await helpers.takeScreenshot('validation-errors');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/sign-in?lang=ar');
    
    // Check if login form is properly displayed on mobile
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check if text is readable (not too small)
    const emailField = page.locator('input[name="email"]');
    const boundingBox = await emailField.boundingBox();
    expect(boundingBox?.height).toBeGreaterThan(40); // Minimum touch target size
    
    await helpers.takeScreenshot('login-mobile');
  });

  test('should remember login state', async ({ page, context }) => {
    await helpers.loginAsAdmin();
    
    // Close and reopen page
    await page.close();
    const newPage = await context.newPage();
    const newHelpers = new TestHelpers(newPage);
    
    await newPage.goto('/dashboard');
    
    // Should still be logged in
    await expect(newPage.locator('text=لوحة التحكم')).toBeVisible();
    
    await newHelpers.takeScreenshot('persistent-login');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept network requests and simulate failure
    await page.route('**/api/sign-in/**', route => {
      route.abort('failed');
    });
    
    await page.goto('/sign-in?lang=ar');
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Should show network error
    const errors = await helpers.checkForErrors();
    expect(errors.length).toBeGreaterThan(0);
    
    await helpers.takeScreenshot('network-error');
  });
});
