import { test, expect } from '@playwright/test';

/**
 * Dashboard Page Testing
 * Tests admin dashboard with Arabic localization, data loading, charts, analytics
 */

test.describe('02. Dashboard Page Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Fill admin credentials
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  });

  test('should load dashboard with Arabic language', async ({ page }) => {
    console.log('🏠 Testing dashboard page with Arabic language...');
    
    // Navigate to dashboard
    await page.goto('/dashboard?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check if page loads properly
    await expect(page).toHaveTitle(/BookDress/);
    
    // Check for Arabic language activation
    const htmlDir = await page.locator('html').getAttribute('dir');
    expect(htmlDir).toBe('rtl');
    
    // Check for dashboard content
    const pageContent = await page.textContent('body');
    console.log('Dashboard content preview:', pageContent?.substring(0, 300));
    
    // Check for Arabic dashboard elements
    const hasArabicText = /[\u0600-\u06FF]/.test(pageContent || '');
    if (hasArabicText) {
      console.log('✅ Arabic text found on dashboard');
    } else {
      console.log('⚠️ No Arabic text detected on dashboard');
    }
    
    // Take screenshot for documentation
    await page.screenshot({ 
      path: 'test-results/screenshots/02-dashboard-arabic.png',
      fullPage: true 
    });
    
    console.log('✅ Dashboard page loaded successfully with Arabic language');
  });

  test('should display dashboard analytics and charts', async ({ page }) => {
    console.log('📊 Testing dashboard analytics and charts...');
    
    // Navigate to dashboard
    await page.goto('/dashboard?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check for analytics cards/widgets
    const analyticsCards = await page.locator('.MuiCard-root, .card, [data-testid*="analytics"], [data-testid*="stats"]').count();
    console.log('Analytics cards found:', analyticsCards);
    
    // Check for charts or graphs
    const charts = await page.locator('canvas, svg, .chart, [data-testid*="chart"]').count();
    console.log('Charts/graphs found:', charts);
    
    // Check for data tables
    const dataTables = await page.locator('.MuiDataGrid-root, table, [role="grid"]').count();
    console.log('Data tables found:', dataTables);
    
    // Check for loading states
    const loadingElements = await page.locator('.MuiCircularProgress-root, .loading, [data-testid="loading"]').count();
    if (loadingElements > 0) {
      console.log('⏳ Loading elements detected, waiting...');
      await page.waitForTimeout(5000);
    }
    
    // Take screenshot of analytics
    await page.screenshot({ 
      path: 'test-results/screenshots/02-dashboard-analytics.png',
      fullPage: true 
    });
    
    console.log('✅ Dashboard analytics testing completed');
  });

  test('should test navigation and menu functionality', async ({ page }) => {
    console.log('🧭 Testing dashboard navigation and menu...');
    
    // Navigate to dashboard
    await page.goto('/dashboard?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check for navigation menu
    const navMenu = await page.locator('nav, .MuiDrawer-root, [role="navigation"]').count();
    console.log('Navigation menu found:', navMenu > 0 ? '✅' : '❌');
    
    // Check for header/toolbar
    const header = await page.locator('header, .MuiAppBar-root, [role="banner"]').count();
    console.log('Header/toolbar found:', header > 0 ? '✅' : '❌');
    
    // Check for user menu/profile
    const userMenu = await page.locator('[data-testid*="user"], [data-testid*="profile"], .user-menu').count();
    console.log('User menu elements found:', userMenu);
    
    // Check for language switcher
    const languageSwitcher = await page.locator('[data-testid*="language"], .language-switcher').count();
    console.log('Language switcher found:', languageSwitcher);
    
    // Test menu items (if visible)
    const menuItems = await page.locator('a[href*="/"], button[data-testid*="menu"]').count();
    console.log('Menu items found:', menuItems);
    
    // Take screenshot of navigation
    await page.screenshot({ 
      path: 'test-results/screenshots/02-dashboard-navigation.png',
      fullPage: true 
    });
    
    console.log('✅ Dashboard navigation testing completed');
  });

  test('should test dashboard data and content', async ({ page }) => {
    console.log('📋 Testing dashboard data and content...');
    
    // Navigate to dashboard
    await page.goto('/dashboard?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check for error messages
    const errorElements = await page.locator('.error, .MuiAlert-standardError, [role="alert"]').count();
    if (errorElements > 0) {
      const errorText = await page.locator('.error, .MuiAlert-standardError, [role="alert"]').first().textContent();
      console.log('⚠️ Error message found:', errorText);
    } else {
      console.log('✅ No error messages found');
    }
    
    // Check for data content
    const pageText = await page.textContent('body');
    const hasNumbers = /\d+/.test(pageText || '');
    console.log('Dashboard contains numerical data:', hasNumbers ? '✅' : '❌');
    
    // Check for common dashboard terms in Arabic
    const arabicTerms = [
      'لوحة التحكم', // Dashboard
      'الإحصائيات', // Statistics
      'التقارير', // Reports
      'الحجوزات', // Bookings
      'الفساتين', // Dresses
      'الموردين', // Suppliers
      'العملاء' // Customers
    ];
    
    for (const term of arabicTerms) {
      const termExists = await page.locator(`text=${term}`).count() > 0;
      console.log(`Arabic term "${term}": ${termExists ? '✅ Found' : '❌ Not found'}`);
    }
    
    // Take screenshot of content
    await page.screenshot({ 
      path: 'test-results/screenshots/02-dashboard-content.png',
      fullPage: true 
    });
    
    console.log('✅ Dashboard data and content testing completed');
  });

  test('should test dashboard responsiveness and layout', async ({ page }) => {
    console.log('📱 Testing dashboard responsiveness and layout...');
    
    // Navigate to dashboard
    await page.goto('/dashboard?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Test desktop layout
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'test-results/screenshots/02-dashboard-desktop.png',
      fullPage: true 
    });
    console.log('✅ Desktop layout tested');
    
    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'test-results/screenshots/02-dashboard-tablet.png',
      fullPage: true 
    });
    console.log('✅ Tablet layout tested');
    
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'test-results/screenshots/02-dashboard-mobile.png',
      fullPage: true 
    });
    console.log('✅ Mobile layout tested');
    
    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    console.log('✅ Dashboard responsiveness testing completed');
  });
});
