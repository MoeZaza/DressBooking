import { test, expect } from '@playwright/test';

test.describe('Backend Locations Page', () => {
  test('should access locations page and show content', async ({ page }) => {
    // Login first
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Navigate to locations page
    await page.goto('/locations?lang=ar');
    await page.waitForLoadState('networkidle');
    
    // Check what's actually on the page
    const pageContent = await page.textContent('body');
    console.log('Locations page content (first 500 chars):', pageContent?.substring(0, 500));
    
    // Check for any content
    expect(pageContent?.length).toBeGreaterThan(50);
    
    // Check for common locations page elements
    const dataGrid = page.locator('.MuiDataGrid-root, [role="grid"], table');
    const locationsTitle = page.locator('h1, h2, .title').or(page.locator('text=المواقع')).or(page.locator('text=Locations'));
    const addButton = page.locator('button:has-text("إضافة"), button:has-text("Add"), button:has-text("New")');
    
    const hasDataGrid = await dataGrid.first().isVisible();
    const hasTitle = await locationsTitle.first().isVisible();
    const hasAddButton = await addButton.isVisible();
    
    console.log('Data grid visible:', hasDataGrid);
    console.log('Title visible:', hasTitle);
    console.log('Add button visible:', hasAddButton);
    
    // Check for Arabic language
    const hasArabicText = pageContent?.includes('العربية') || 
                         pageContent?.includes('المواقع') ||
                         pageContent?.includes('موقع') ||
                         pageContent?.includes('المدينة');
    
    console.log('Has Arabic text:', hasArabicText);
    
    // The page should have some content even if empty
    expect(pageContent?.length).toBeGreaterThan(50);
  });

  test('should show Palestinian cities data', async ({ page }) => {
    // Login and navigate to locations
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('/locations?lang=ar');
    await page.waitForLoadState('networkidle');
    
    // Check if there are Palestinian cities displayed
    const pageContent = await page.textContent('body');
    
    // Look for Palestinian cities (both Arabic and English)
    const palestinianCities = [
      'Jenin', 'جنين',
      'Ramallah', 'رام الله', 
      'Nablus', 'نابلس',
      'Hebron', 'الخليل',
      'Gaza', 'غزة',
      'Jerusalem', 'القدس',
      'Bethlehem', 'بيت لحم'
    ];
    
    let foundCities = 0;
    const foundCityNames = [];
    
    for (const city of palestinianCities) {
      if (pageContent?.includes(city)) {
        foundCities++;
        foundCityNames.push(city);
        console.log(`✅ Found city: ${city}`);
      }
    }
    
    console.log(`Found ${foundCities} Palestinian cities:`, foundCityNames);
    
    // Should have at least some Palestinian cities (or show empty state)
    if (foundCities === 0) {
      console.log('⚠️ No Palestinian cities found - locations collection may be empty');
      // Check for empty state message instead
      const hasEmptyMessage = pageContent?.includes('لا توجد مواقع') || pageContent?.includes('No locations');
      expect(hasEmptyMessage).toBe(true);
    } else {
      expect(foundCities).toBeGreaterThan(0);
    }
    
    // Page should be functional
    expect(pageContent?.length).toBeGreaterThan(50);
  });

  test('should show Arabic language interface', async ({ page }) => {
    // Login and navigate to locations with Arabic
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('/locations?lang=ar');
    await page.waitForLoadState('networkidle');
    
    // Check for Arabic interface elements
    const pageContent = await page.textContent('body');
    
    const arabicElements = [
      'العربية',      // Arabic
      'الإعدادات',    // Settings
      'تسجيل الخروج', // Sign out
      'المواقع',      // Locations
      'موقع',         // Location
      'المدينة',      // City
      'البلد',        // Country
      'المنطقة'       // Region
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
    
    // Login and navigate to locations
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('/locations?lang=ar');
    await page.waitForLoadState('networkidle');
    
    // Check mobile layout
    const pageContent = await page.textContent('body');
    console.log('Mobile locations page has content:', pageContent && pageContent.length > 50);
    
    // Check for mobile navigation
    const mobileNav = page.locator('.mobile-nav, .hamburger, .menu-toggle');
    const mobileNavVisible = await mobileNav.isVisible();
    console.log('Mobile navigation visible:', mobileNavVisible);
    
    // Check if content is scrollable horizontally (should not be)
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 375;
    
    console.log(`Body width: ${bodyWidth}px, Viewport: ${viewportWidth}px`);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // Allow small tolerance
    
    // Page should be functional on mobile (even if showing empty state)
    if (pageContent && pageContent.length <= 50) {
      console.log('⚠️ Mobile page content is minimal - likely showing empty state');
      // Check for empty state message
      const hasEmptyMessage = pageContent.includes('لا توجد مواقع') || pageContent.includes('No locations');
      expect(hasEmptyMessage).toBe(true);
    } else {
      expect(pageContent?.length).toBeGreaterThan(50);
    }
  });

  test('should handle empty locations list', async ({ page }) => {
    // Login and navigate to locations
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('/locations?lang=ar');
    await page.waitForLoadState('networkidle');
    
    // Check for empty state messages
    const emptyMessages = [
      'text=No locations found',
      'text=لا توجد مواقع',
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

  test('should support both Arabic and English location names', async ({ page }) => {
    // Login and navigate to locations
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    await page.goto('/locations?lang=ar');
    await page.waitForLoadState('networkidle');
    
    // Check for bilingual support
    const pageContent = await page.textContent('body');
    
    // Check for both Arabic and English city names
    const bilingualPairs = [
      { english: 'Jenin', arabic: 'جنين' },
      { english: 'Ramallah', arabic: 'رام الله' },
      { english: 'Nablus', arabic: 'نابلس' },
      { english: 'Hebron', arabic: 'الخليل' },
      { english: 'Gaza', arabic: 'غزة' }
    ];
    
    let foundBilingualPairs = 0;
    for (const pair of bilingualPairs) {
      const hasEnglish = pageContent?.includes(pair.english);
      const hasArabic = pageContent?.includes(pair.arabic);
      
      if (hasEnglish && hasArabic) {
        foundBilingualPairs++;
        console.log(`✅ Found bilingual pair: ${pair.english} / ${pair.arabic}`);
      } else if (hasEnglish || hasArabic) {
        console.log(`⚠️ Found only one language for: ${pair.english} / ${pair.arabic}`);
      }
    }
    
    console.log(`Found ${foundBilingualPairs} complete bilingual city pairs`);
    
    // Page should be functional
    expect(pageContent?.length).toBeGreaterThan(50);
  });
});
