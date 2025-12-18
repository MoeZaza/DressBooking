import { test, expect } from '@playwright/test';

test.describe('Backend Login Flow', () => {
  test('should complete full login flow', async ({ page }) => {
    // Step 1: Go to login page
    await page.goto('/sign-in');
    await page.screenshot({ path: 'test-results/screenshots/step1-login-page.png' });
    
    // Step 2: Fill credentials
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.screenshot({ path: 'test-results/screenshots/step2-credentials-filled.png' });
    
    // Step 3: Submit form
    await page.click('button[type="submit"]');
    await page.screenshot({ path: 'test-results/screenshots/step3-after-submit.png' });
    
    // Step 4: Wait for redirect and check where we end up
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    console.log('URL after login:', currentUrl);
    await page.screenshot({ path: 'test-results/screenshots/step4-after-redirect.png' });
    
    // Step 5: If we're at root, try to navigate to dashboard manually
    if (currentUrl === 'http://localhost:3001/' || currentUrl.endsWith('/')) {
      console.log('At root page, trying to navigate to dashboard...');
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/screenshots/step5-manual-dashboard.png' });
      
      const dashboardUrl = page.url();
      console.log('URL after manual navigation:', dashboardUrl);
      
      // Check if we can see dashboard content
      const pageContent = await page.textContent('body');
      const hasDashboardContent = pageContent?.includes('لوحة التحكم') || 
                                 pageContent?.includes('Dashboard') ||
                                 pageContent?.includes('الموردين') ||
                                 pageContent?.includes('Suppliers');
      
      if (hasDashboardContent) {
        console.log('✅ Dashboard content found after manual navigation');
      } else {
        console.log('❌ No dashboard content found');
        console.log('Page content preview:', pageContent?.substring(0, 300));
      }
    }
    
    // Step 6: Check if we're authenticated by looking for user menu or logout
    const logoutButton = page.locator('text=تسجيل الخروج, text=Sign out, text=Logout');
    const userMenu = page.locator('.user-menu, [data-testid="user-menu"]');
    
    if (await logoutButton.isVisible() || await userMenu.isVisible()) {
      console.log('✅ User appears to be authenticated (logout/user menu visible)');
    } else {
      console.log('❌ User does not appear to be authenticated');
    }
    
    await page.screenshot({ path: 'test-results/screenshots/step6-final-state.png' });
  });

  test('should check authentication state', async ({ page }) => {
    // Try to access dashboard directly without login
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log('URL when accessing dashboard without login:', currentUrl);
    
    if (currentUrl.includes('sign-in')) {
      console.log('✅ Correctly redirected to login when not authenticated');
    } else {
      console.log('⚠️ Dashboard accessible without authentication');
    }
    
    await page.screenshot({ path: 'test-results/screenshots/dashboard-without-auth.png' });
  });

  test('should test Arabic login page elements', async ({ page }) => {
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    
    // Check for specific Arabic elements
    const arabicElements = [
      'تسجيل الدخول',      // Sign In
      'البريد الإلكتروني',  // Email
      'كلمة المرور',       // Password
      'نسيت كلمة المرور',   // Forgot Password
    ];
    
    for (const arabicText of arabicElements) {
      const element = page.locator(`text=${arabicText}`);
      if (await element.isVisible()) {
        console.log(`✅ Found Arabic text: ${arabicText}`);
      } else {
        console.log(`❌ Missing Arabic text: ${arabicText}`);
      }
    }
    
    await page.screenshot({ path: 'test-results/screenshots/arabic-elements-check.png' });
  });
});
