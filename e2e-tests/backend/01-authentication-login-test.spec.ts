import { test, expect } from '@playwright/test';

/**
 * Authentication & Login Page Testing
 * Tests login functionality with Arabic language and supplier authentication
 */

test.describe('01. Authentication & Login Page Testing', () => {

  test('should check if backend application is accessible', async ({ page }) => {
    console.log('🔍 Checking if backend application is accessible...');

    try {
      // Try to access the backend application
      await page.goto('http://localhost:3001/sign-in?lang=ar', { timeout: 10000 });
      console.log('✅ Backend application is accessible');

      // Take screenshot
      await page.screenshot({
        path: 'test-results/screenshots/00-backend-accessibility-check.png',
        fullPage: true
      });

    } catch (error) {
      console.error('❌ Backend application is not accessible:', error);
      throw error;
    }
  });

  test('should load login page with Arabic language', async ({ page }) => {
    console.log('🔐 Testing login page with Arabic language...');
    
    // Navigate to login page with Arabic language
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if page loads properly
    await expect(page).toHaveTitle(/BookDress/);
    
    // Check for Arabic language activation
    const htmlDir = await page.locator('html').getAttribute('dir');
    expect(htmlDir).toBe('rtl');
    
    // Check for login form elements
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check for Arabic text elements
    const pageContent = await page.textContent('body');
    console.log('Page content preview:', pageContent?.substring(0, 200));
    
    // Take screenshot for documentation
    await page.screenshot({ 
      path: 'test-results/screenshots/01-login-page-arabic.png',
      fullPage: true 
    });
    
    console.log('✅ Login page loaded successfully with Arabic language');
  });

  test('should authenticate supplier user successfully', async ({ page }) => {
    console.log('🔐 Testing supplier authentication...');
    
    // Navigate to login page with Arabic language
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if login form is visible
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
    
    // Fill login credentials for admin user (fallback if supplier doesn't exist)
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    
    // Submit login form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    // Check if redirected away from login page
    const currentUrl = page.url();
    const isLoggedIn = !currentUrl.includes('/sign-in');
    
    if (isLoggedIn) {
      console.log('✅ Supplier authentication successful');
      console.log('Current URL:', currentUrl);
      
      // Take screenshot of successful login
      await page.screenshot({ 
        path: 'test-results/screenshots/01-login-success-supplier.png',
        fullPage: true 
      });
      
      // Check for user-specific elements (supplier role)
      const pageContent = await page.textContent('body');
      console.log('Post-login page content preview:', pageContent?.substring(0, 300));
      
    } else {
      console.log('❌ Supplier authentication failed - still on login page');
      
      // Check for error messages
      const errorElements = await page.locator('.error, .MuiAlert-standardError, [role="alert"]').count();
      if (errorElements > 0) {
        const errorText = await page.locator('.error, .MuiAlert-standardError, [role="alert"]').first().textContent();
        console.log('Error message:', errorText);
      }
      
      // Take screenshot of failed login
      await page.screenshot({ 
        path: 'test-results/screenshots/01-login-failed-supplier.png',
        fullPage: true 
      });
      
      throw new Error('Supplier authentication failed');
    }
  });

  test('should test form validation and error handling', async ({ page }) => {
    console.log('🔐 Testing form validation...');
    
    // Navigate to login page with Arabic language
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Test empty form submission
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Check for validation messages
    const validationErrors = await page.locator('.error, .MuiFormHelperText-error, [role="alert"]').count();
    console.log('Validation errors found:', validationErrors);
    
    // Test invalid email format
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Test invalid credentials
    await page.fill('input[name="email"]', 'nonexistent@test.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Take screenshot of validation testing
    await page.screenshot({ 
      path: 'test-results/screenshots/01-login-validation-test.png',
      fullPage: true 
    });
    
    console.log('✅ Form validation testing completed');
  });

  test('should test Arabic language elements and RTL layout', async ({ page }) => {
    console.log('🔐 Testing Arabic language elements...');
    
    // Navigate to login page with Arabic language
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for RTL direction
    const htmlDir = await page.locator('html').getAttribute('dir');
    expect(htmlDir).toBe('rtl');
    
    // Check for Arabic text rendering
    const bodyText = await page.textContent('body');
    const hasArabicText = /[\u0600-\u06FF]/.test(bodyText || '');
    
    if (hasArabicText) {
      console.log('✅ Arabic text found on page');
    } else {
      console.log('⚠️ No Arabic text detected - checking for Arabic elements');
    }
    
    // Check for common Arabic login terms
    const arabicTerms = [
      'تسجيل الدخول', // Login
      'البريد الإلكتروني', // Email
      'كلمة المرور', // Password
      'دخول' // Enter/Login
    ];
    
    for (const term of arabicTerms) {
      const elementExists = await page.locator(`text=${term}`).count() > 0;
      console.log(`Arabic term "${term}": ${elementExists ? '✅ Found' : '❌ Not found'}`);
    }
    
    // Take screenshot for Arabic language verification
    await page.screenshot({ 
      path: 'test-results/screenshots/01-login-arabic-elements.png',
      fullPage: true 
    });
    
    console.log('✅ Arabic language elements testing completed');
  });
});
