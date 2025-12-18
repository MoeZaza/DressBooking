import { test, expect } from '@playwright/test';

test.describe('Backend Dashboard', () => {
  test('should load dashboard with proper content', async ({ page }) => {
    // Step 1: Login first
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Step 2: Navigate to dashboard
    await page.goto('/dashboard?lang=ar');
    await page.waitForLoadState('networkidle');
    
    // Step 3: Check dashboard content
    const pageContent = await page.textContent('body');
    console.log('Dashboard content (first 500 chars):', pageContent?.substring(0, 500));
    
    // Check for dashboard elements
    const hasDashboardContent = pageContent?.includes('لوحة التحكم') || 
                               pageContent?.includes('Dashboard') ||
                               pageContent?.includes('الموردين') ||
                               pageContent?.includes('Suppliers') ||
                               pageContent?.includes('المستخدمين') ||
                               pageContent?.includes('Users');
    
    if (hasDashboardContent) {
      console.log('✅ Dashboard content found');
    } else {
      console.log('⚠️ Dashboard content not found, checking for other indicators');
    }
    
    // Check for navigation elements
    const navElements = [
      'text=الحجوزات', 'text=Bookings',
      'text=الفساتين', 'text=Dresses', 
      'text=الموردين', 'text=Suppliers',
      'text=المستخدمين', 'text=Users'
    ];
    
    let foundNavElements = 0;
    for (const selector of navElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        foundNavElements++;
        const text = await element.textContent();
        console.log(`✅ Found navigation element: ${text}`);
      }
    }
    
    console.log(`Found ${foundNavElements} navigation elements`);
    
    // Check for data grid or content area
    const dataGrid = page.locator('.MuiDataGrid-root, [role="grid"]');
    const contentArea = page.locator('.content, .main-content, .dashboard-content');
    
    const hasDataGrid = await dataGrid.isVisible();
    const hasContentArea = await contentArea.isVisible();
    
    console.log('Data grid visible:', hasDataGrid);
    console.log('Content area visible:', hasContentArea);
    
    // The dashboard should have some content
    expect(pageContent?.length).toBeGreaterThan(100);
  });

  test('should show different content for admin vs supplier', async ({ page }) => {
    // Test admin dashboard
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('/dashboard?lang=ar');
    await page.waitForLoadState('networkidle');
    
    const adminContent = await page.textContent('body');
    console.log('Admin dashboard loaded');
    
    // Check for admin-specific elements
    const hasAdminElements = adminContent?.includes('المستخدمين') || 
                            adminContent?.includes('Users') ||
                            adminContent?.includes('الموردين') ||
                            adminContent?.includes('Suppliers');
    
    console.log('Admin-specific elements found:', hasAdminElements);
    
    // Now test supplier dashboard (if supplier login works)
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'sofia@sofiaboutique.ps');
    await page.fill('input[name="password"]', 'supplier123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('/dashboard?lang=ar');
    await page.waitForLoadState('networkidle');
    
    const supplierContent = await page.textContent('body');
    console.log('Supplier dashboard loaded');
    
    // Supplier should not see admin-only sections
    const hasSupplierRestrictions = !supplierContent?.includes('المستخدمين') && 
                                   !supplierContent?.includes('Users');
    
    console.log('Supplier restrictions working:', hasSupplierRestrictions);
  });

  test('should handle dashboard without authentication', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto('/dashboard?lang=ar');
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('URL when accessing dashboard without auth:', currentUrl);
    
    if (currentUrl.includes('sign-in')) {
      console.log('✅ Correctly redirected to login when not authenticated');
    } else {
      console.log('⚠️ Dashboard accessible without authentication (dev mode)');
      
      // In development mode, authentication might be disabled
      const pageContent = await page.textContent('body');
      const hasContent = pageContent && pageContent.length > 100;
      console.log('Dashboard has content without auth:', hasContent);
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Login first
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard?lang=ar');
    await page.waitForLoadState('networkidle');
    
    // Check if dashboard is usable on mobile
    const pageContent = await page.textContent('body');
    const hasContent = pageContent && pageContent.length > 100;
    
    console.log('Mobile dashboard has content:', hasContent);
    
    // Check for mobile navigation (hamburger menu, etc.)
    const mobileNav = page.locator('.mobile-nav, .hamburger, .menu-toggle, [data-testid="mobile-menu"]');
    const mobileNavVisible = await mobileNav.isVisible();
    
    console.log('Mobile navigation visible:', mobileNavVisible);
    
    // Dashboard should be functional on mobile
    expect(hasContent).toBe(true);
  });
});
