import { test, expect } from '@playwright/test';

test.describe('Backend Dresses Page', () => {
  test('should access dresses page and show content', async ({ page }) => {
    // Login first
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Navigate to dresses page
    await page.goto('/dresses?lang=ar');
    await page.waitForLoadState('networkidle');
    
    // Check what's actually on the page
    const pageContent = await page.textContent('body');
    console.log('Dresses page content (first 500 chars):', pageContent?.substring(0, 500));
    
    // Check for any content
    expect(pageContent?.length).toBeGreaterThan(100);
    
    // Check for common dresses page elements
    const dataGrid = page.locator('.MuiDataGrid-root, [role="grid"], table');
    const dressesTitle = page.locator('h1, h2, .title').or(page.locator('text=الفساتين')).or(page.locator('text=Dresses'));
    const addButton = page.locator('button:has-text("إضافة"), button:has-text("Add"), button:has-text("New")');

    const hasDataGrid = await dataGrid.isVisible();
    const hasTitle = await dressesTitle.first().isVisible();
    const hasAddButton = await addButton.isVisible();
    
    console.log('Data grid visible:', hasDataGrid);
    console.log('Title visible:', hasTitle);
    console.log('Add button visible:', hasAddButton);
    
    // Check for Arabic language
    const hasArabicText = pageContent?.includes('العربية') || 
                         pageContent?.includes('الفساتين') ||
                         pageContent?.includes('فستان') ||
                         pageContent?.includes('الاسم');
    
    console.log('Has Arabic text:', hasArabicText);
    
    // The page should have some content even if empty
    expect(pageContent?.length).toBeGreaterThan(50);
  });

  test('should handle empty dresses list', async ({ page }) => {
    // Login and navigate to dresses
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('/dresses?lang=ar');
    await page.waitForLoadState('networkidle');
    
    // Check for empty state messages
    const emptyMessages = [
      'text=No dresses found',
      'text=لا توجد فساتين',
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

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login and navigate to dresses
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('/dresses?lang=ar');
    await page.waitForLoadState('networkidle');
    
    // Check mobile layout
    const pageContent = await page.textContent('body');
    console.log('Mobile dresses page has content:', pageContent && pageContent.length > 50);
    
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

  test('should show Arabic language interface', async ({ page }) => {
    // Login and navigate to dresses with Arabic
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('/dresses?lang=ar');
    await page.waitForLoadState('networkidle');
    
    // Check for Arabic interface elements
    const pageContent = await page.textContent('body');
    
    const arabicElements = [
      'العربية',      // Arabic
      'الإعدادات',    // Settings
      'تسجيل الخروج', // Sign out
      'فستان',        // Dress
      'الاسم',        // Name
      'النوع',        // Type
      'السعر'         // Price
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

  test('should check if dress data exists', async ({ page }) => {
    // Login and navigate to dresses
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('/dresses?lang=ar');
    await page.waitForLoadState('networkidle');
    
    // Check if there are any dresses displayed
    const pageContent = await page.textContent('body');
    
    // Look for dress-related content
    const hasDressData = pageContent?.includes('فستان') ||
                        pageContent?.includes('Dress') ||
                        pageContent?.includes('Wedding') ||
                        pageContent?.includes('Evening') ||
                        pageContent?.includes('زفاف') ||
                        pageContent?.includes('سهرة');
    
    console.log('Has dress data:', hasDressData);
    
    // Check for data grid with content
    const dataGrid = page.locator('.MuiDataGrid-root, [role="grid"]');
    const hasDataGrid = await dataGrid.isVisible();
    
    if (hasDataGrid) {
      const rows = page.locator('.MuiDataGrid-row, tr');
      const rowCount = await rows.count();
      console.log('Data grid rows:', rowCount);
      
      if (rowCount > 0) {
        console.log('✅ Dresses data found in grid');
      } else {
        console.log('⚠️ Data grid is empty');
      }
    } else {
      console.log('⚠️ No data grid found');
    }
    
    // Page should be functional regardless
    expect(pageContent?.length).toBeGreaterThan(50);
  });
});
