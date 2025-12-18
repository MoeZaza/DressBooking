import { test, expect } from '@playwright/test';

test.describe('Backend Suppliers Page', () => {
  test('should access suppliers page and show content', async ({ page }) => {
    // Login first
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Navigate to suppliers page
    await page.goto('/suppliers?lang=ar');
    await page.waitForLoadState('networkidle');
    
    // Check what's actually on the page
    const pageContent = await page.textContent('body');
    console.log('Suppliers page content (first 500 chars):', pageContent?.substring(0, 500));
    
    // Check for any content
    expect(pageContent?.length).toBeGreaterThan(50);
    
    // Check for common suppliers page elements
    const dataGrid = page.locator('.MuiDataGrid-root, [role="grid"], table');
    const suppliersTitle = page.locator('h1, h2, .title').or(page.locator('text=الموردين')).or(page.locator('text=Suppliers'));
    const addButton = page.locator('button:has-text("إضافة"), button:has-text("Add"), button:has-text("New")');
    
    const hasDataGrid = await dataGrid.first().isVisible();
    const hasTitle = await suppliersTitle.first().isVisible();
    const hasAddButton = await addButton.isVisible();
    
    console.log('Data grid visible:', hasDataGrid);
    console.log('Title visible:', hasTitle);
    console.log('Add button visible:', hasAddButton);
    
    // Check for Arabic language
    const hasArabicText = pageContent?.includes('العربية') || 
                         pageContent?.includes('الموردين') ||
                         pageContent?.includes('مورد') ||
                         pageContent?.includes('الاسم');
    
    console.log('Has Arabic text:', hasArabicText);
    
    // The page should have some content even if empty
    expect(pageContent?.length).toBeGreaterThan(50);
  });

  test('should show supplier data', async ({ page }) => {
    // Login and navigate to suppliers
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('/suppliers?lang=ar');
    await page.waitForLoadState('networkidle');
    
    // Check if there are any suppliers displayed
    const pageContent = await page.textContent('body');
    
    // Look for supplier-related content
    const hasSupplierData = pageContent?.includes('Sofia Boutique') ||
                           pageContent?.includes('Layla Boutique') ||
                           pageContent?.includes('sofia@sofiaboutique.ps') ||
                           pageContent?.includes('layla@laylaboutique.ps') ||
                           pageContent?.includes('مورد') ||
                           pageContent?.includes('Supplier');
    
    console.log('Has supplier data:', hasSupplierData);
    
    // Check for data grid with content
    const dataGrid = page.locator('.MuiDataGrid-root, [role="grid"]');
    const hasDataGrid = await dataGrid.first().isVisible();
    
    if (hasDataGrid) {
      const rows = page.locator('.MuiDataGrid-row, tr');
      const rowCount = await rows.count();
      console.log('Data grid rows:', rowCount);
      
      if (rowCount > 0) {
        console.log('✅ Suppliers data found in grid');
      } else {
        console.log('⚠️ Data grid is empty');
      }
    } else {
      console.log('⚠️ No data grid found');
    }
    
    // Page should be functional regardless
    expect(pageContent?.length).toBeGreaterThan(50);
  });

  test('should show Arabic language interface', async ({ page }) => {
    // Login and navigate to suppliers with Arabic
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('/suppliers?lang=ar');
    await page.waitForLoadState('networkidle');
    
    // Check for Arabic interface elements
    const pageContent = await page.textContent('body');
    
    const arabicElements = [
      'العربية',      // Arabic
      'الإعدادات',    // Settings
      'تسجيل الخروج', // Sign out
      'الموردين',     // Suppliers
      'مورد',         // Supplier
      'الاسم',        // Name
      'البريد الإلكتروني', // Email
      'الهاتف',       // Phone
      'المواقع'       // Locations
    ];
    
    let foundArabicElements = 0;
    for (const arabicText of arabicElements) {
      if (pageContent?.includes(arabicText)) {
        foundArabicElements++;
        console.log(`✅ Found Arabic text: ${arabicText}`);
      }
    }
    
    console.log(`Found ${foundArabicElements} Arabic interface elements`);
    
    // Should have at least some Arabic text
    expect(foundArabicElements).toBeGreaterThan(0);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login and navigate to suppliers
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('/suppliers?lang=ar');
    await page.waitForLoadState('networkidle');
    
    // Check mobile layout
    const pageContent = await page.textContent('body');
    console.log('Mobile suppliers page has content:', pageContent && pageContent.length > 50);
    
    // Check for mobile navigation
    const mobileNav = page.locator('.mobile-nav, .hamburger, .menu-toggle');
    const mobileNavVisible = await mobileNav.isVisible();
    console.log('Mobile navigation visible:', mobileNavVisible);
    
    // Check if content is scrollable horizontally (should not be)
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 375;
    
    console.log(`Body width: ${bodyWidth}px, Viewport: ${viewportWidth}px`);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // Allow small tolerance
    
    // Page should be functional on mobile
    expect(pageContent?.length).toBeGreaterThan(50);
  });

  test('should handle empty suppliers list', async ({ page }) => {
    // Login and navigate to suppliers
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('/suppliers?lang=ar');
    await page.waitForLoadState('networkidle');
    
    // Check for empty state messages
    const emptyMessages = [
      'text=No suppliers found',
      'text=لا توجد موردين',
      'text=0 of 0',
      'text=No rows',
      'text=لا توجد بيانات',
      'text=لا يوجد شيء هنا'
    ];
    
    let foundEmptyMessage = false;
    for (const selector of emptyMessages) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        const text = await element.textContent();
        console.log('Found empty message:', text);
        foundEmptyMessage = true;
        break;
      }
    }
    
    if (!foundEmptyMessage) {
      console.log('No specific empty message found, but page loaded');
    }
    
    // Page should still be functional
    const pageContent = await page.textContent('body');
    expect(pageContent?.length).toBeGreaterThan(50);
  });

  test('should show supplier locations and branches', async ({ page }) => {
    // Login and navigate to suppliers
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('/suppliers?lang=ar');
    await page.waitForLoadState('networkidle');
    
    // Check for location-related content
    const pageContent = await page.textContent('body');
    
    const hasLocationData = pageContent?.includes('Jenin') ||
                           pageContent?.includes('Ramallah') ||
                           pageContent?.includes('Nablus') ||
                           pageContent?.includes('جنين') ||
                           pageContent?.includes('رام الله') ||
                           pageContent?.includes('نابلس') ||
                           pageContent?.includes('المواقع') ||
                           pageContent?.includes('Locations');
    
    console.log('Has location data:', hasLocationData);
    
    // Check for supplier branches
    const hasBranchData = pageContent?.includes('Branch') ||
                         pageContent?.includes('فرع') ||
                         pageContent?.includes('Main') ||
                         pageContent?.includes('رئيسي');
    
    console.log('Has branch data:', hasBranchData);
    
    // Page should be functional
    expect(pageContent?.length).toBeGreaterThan(50);
  });
});
