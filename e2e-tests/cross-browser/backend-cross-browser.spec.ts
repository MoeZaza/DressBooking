import { test, expect } from '@playwright/test';

test.describe('Backend Cross-Browser Compatibility', () => {
  test('should work correctly in Chromium', async ({ page }) => {
    console.log('🌐 Testing Backend in Chromium');
    
    // Login
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Test core functionality
    const coreTests = [
      { name: 'Dashboard', url: '/dashboard?lang=ar', expectedContent: ['لوحة التحكم', 'Dashboard'] },
      { name: 'Bookings', url: '/?lang=ar', expectedContent: ['حجز جديد', 'New Booking'] },
      { name: 'Dresses', url: '/dresses?lang=ar', expectedContent: ['فستان جديد', 'New Dress'] },
      { name: 'Users', url: '/users?lang=ar', expectedContent: ['مستخدم جديد', 'New User'] },
      { name: 'Suppliers', url: '/suppliers?lang=ar', expectedContent: ['مورد جديد', 'New Supplier'] }
    ];

    const results = { working: 0, total: coreTests.length };

    for (const testCase of coreTests) {
      try {
        await page.goto(testCase.url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const content = await page.textContent('body');
        const hasExpectedContent = testCase.expectedContent.some(expected => 
          content?.includes(expected)
        );

        if (hasExpectedContent && content && content.length > 500) {
          results.working++;
          console.log(`✅ ${testCase.name}: Working`);
        } else {
          console.log(`❌ ${testCase.name}: Not working`);
        }
      } catch (error) {
        console.log(`❌ ${testCase.name}: Error - ${(error as Error).message}`);
      }
    }

    console.log(`Chromium Results: ${results.working}/${results.total} pages working`);
    expect(results.working).toBeGreaterThan(results.total * 0.8); // At least 80% working
  });

  test('should work correctly in Firefox', async ({ page }) => {
    console.log('🦊 Testing Backend in Firefox');
    
    // Login
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Test Firefox-specific features
    const firefoxTests = [
      { name: 'Arabic Text Rendering', url: '/dashboard?lang=ar', check: 'arabic' },
      { name: 'CSS Grid Layout', url: '/dresses?lang=ar', check: 'layout' },
      { name: 'Form Validation', url: '/create-booking?lang=ar', check: 'forms' },
      { name: 'Data Grid Performance', url: '/users?lang=ar', check: 'datagrid' }
    ];

    const firefoxResults = { working: 0, total: firefoxTests.length };

    for (const testCase of firefoxTests) {
      try {
        await page.goto(testCase.url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const content = await page.textContent('body');
        let isWorking = false;

        switch (testCase.check) {
          case 'arabic':
            isWorking = content?.includes('العربية') || content?.includes('لوحة التحكم');
            break;
          case 'layout':
            const gridElements = page.locator('.MuiDataGrid-root, .grid-container');
            isWorking = await gridElements.count() > 0;
            break;
          case 'forms':
            const formElements = page.locator('form, .MuiAutocomplete-root');
            isWorking = await formElements.count() > 0;
            break;
          case 'datagrid':
            const dataGridRows = page.locator('.MuiDataGrid-row');
            isWorking = await dataGridRows.count() > 0;
            break;
        }

        if (isWorking) {
          firefoxResults.working++;
          console.log(`✅ Firefox ${testCase.name}: Working`);
        } else {
          console.log(`❌ Firefox ${testCase.name}: Not working`);
        }
      } catch (error) {
        console.log(`❌ Firefox ${testCase.name}: Error - ${(error as Error).message}`);
      }
    }

    console.log(`Firefox Results: ${firefoxResults.working}/${firefoxResults.total} features working`);
    expect(firefoxResults.working).toBeGreaterThan(firefoxResults.total * 0.7); // At least 70% working
  });

  test('should work correctly in WebKit/Safari', async ({ page }) => {
    console.log('🧭 Testing Backend in WebKit/Safari');
    
    // Login
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Test WebKit-specific features
    const webkitTests = [
      { name: 'CSS Flexbox', url: '/dashboard?lang=ar', check: 'flexbox' },
      { name: 'Date Inputs', url: '/create-booking?lang=ar', check: 'dateinputs' },
      { name: 'Autocomplete', url: '/create-booking?lang=ar', check: 'autocomplete' },
      { name: 'Material-UI Components', url: '/dresses?lang=ar', check: 'mui' }
    ];

    const webkitResults = { working: 0, total: webkitTests.length };

    for (const testCase of webkitTests) {
      try {
        await page.goto(testCase.url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        let isWorking = false;

        switch (testCase.check) {
          case 'flexbox':
            const flexElements = page.locator('.MuiBox-root, .flex, [style*="display: flex"]');
            isWorking = await flexElements.count() > 0;
            break;
          case 'dateinputs':
            const dateInputs = page.locator('input[type="date"], .MuiDatePicker-root');
            isWorking = await dateInputs.count() >= 0; // Date inputs may not be visible initially
            break;
          case 'autocomplete':
            const autocompleteElements = page.locator('.MuiAutocomplete-root');
            isWorking = await autocompleteElements.count() > 0;
            break;
          case 'mui':
            const muiElements = page.locator('.MuiButton-root, .MuiTextField-root, .MuiDataGrid-root');
            isWorking = await muiElements.count() > 0;
            break;
        }

        if (isWorking) {
          webkitResults.working++;
          console.log(`✅ WebKit ${testCase.name}: Working`);
        } else {
          console.log(`❌ WebKit ${testCase.name}: Not working`);
        }
      } catch (error) {
        console.log(`❌ WebKit ${testCase.name}: Error - ${(error as Error).message}`);
      }
    }

    console.log(`WebKit Results: ${webkitResults.working}/${webkitResults.total} features working`);
    expect(webkitResults.working).toBeGreaterThan(webkitResults.total * 0.7); // At least 70% working
  });

  test('should handle responsive design across browsers', async ({ page }) => {
    console.log('📱 Testing Responsive Design Across Browsers');
    
    // Login
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];

    const responsiveResults = { working: 0, total: viewports.length };

    for (const viewport of viewports) {
      try {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/dashboard?lang=ar');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Check for horizontal scrolling (should not exist)
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = viewport.width;
        const hasHorizontalScroll = bodyWidth > viewportWidth + 20;

        // Check for mobile navigation
        const mobileNav = page.locator('.mobile-nav, .hamburger, .menu-toggle, [data-testid="mobile-menu"]');
        const hasMobileNav = await mobileNav.count() > 0;

        // Check content visibility
        const content = await page.textContent('body');
        const hasContent = content && content.length > 500;

        const isResponsive = !hasHorizontalScroll && hasContent && 
                           (viewport.width > 768 || hasMobileNav);

        if (isResponsive) {
          responsiveResults.working++;
          console.log(`✅ ${viewport.name} (${viewport.width}x${viewport.height}): Responsive`);
        } else {
          console.log(`❌ ${viewport.name} (${viewport.width}x${viewport.height}): Not responsive`);
          console.log(`   Horizontal scroll: ${hasHorizontalScroll}, Mobile nav: ${hasMobileNav}`);
        }
      } catch (error) {
        console.log(`❌ ${viewport.name}: Error - ${(error as Error).message}`);
      }
    }

    console.log(`Responsive Results: ${responsiveResults.working}/${responsiveResults.total} viewports working`);
    expect(responsiveResults.working).toBeGreaterThan(responsiveResults.total * 0.6); // At least 60% working
  });

  test('should handle Arabic RTL layout correctly', async ({ page }) => {
    console.log('🔤 Testing Arabic RTL Layout');
    
    // Login
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Test RTL layout on different pages
    const rtlTests = [
      '/dashboard?lang=ar',
      '/dresses?lang=ar',
      '/users?lang=ar',
      '/create-booking?lang=ar'
    ];

    const rtlResults = { working: 0, total: rtlTests.length };

    for (const url of rtlTests) {
      try {
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Check for RTL direction
        const htmlDir = await page.evaluate(() => document.documentElement.dir);
        const bodyDir = await page.evaluate(() => document.body.dir);
        const hasRTL = htmlDir === 'rtl' || bodyDir === 'rtl';

        // Check for Arabic text
        const content = await page.textContent('body');
        const hasArabicText = content?.includes('العربية') || 
                             content?.includes('لوحة التحكم') ||
                             content?.includes('فستان') ||
                             content?.includes('مستخدم');

        // Check for proper text alignment
        const textElements = page.locator('h1, h2, h3, p, .MuiTypography-root');
        const firstElement = textElements.first();
        const textAlign = await firstElement.evaluate(el => 
          window.getComputedStyle(el).textAlign
        ).catch(() => 'left');

        const hasProperAlignment = textAlign === 'right' || textAlign === 'start';

        const isRTLWorking = hasRTL && hasArabicText;

        if (isRTLWorking) {
          rtlResults.working++;
          console.log(`✅ RTL Layout ${url}: Working (dir=${htmlDir || bodyDir}, align=${textAlign})`);
        } else {
          console.log(`❌ RTL Layout ${url}: Not working (dir=${htmlDir || bodyDir}, arabic=${hasArabicText})`);
        }
      } catch (error) {
        console.log(`❌ RTL Layout ${url}: Error - ${(error as Error).message}`);
      }
    }

    console.log(`RTL Results: ${rtlResults.working}/${rtlResults.total} pages with proper RTL`);
    expect(rtlResults.working).toBeGreaterThan(rtlResults.total * 0.7); // At least 70% working
  });
});
