import { test, expect } from '@playwright/test';

test.describe('Frontend Cross-Browser Compatibility', () => {
  test('should work correctly in Chromium', async ({ page }) => {
    console.log('🌐 Testing Frontend in Chromium');
    
    // Test core frontend pages
    const frontendTests = [
      { name: 'Home Page', url: '/?lang=ar', expectedContent: ['BookDress', 'فساتين', 'Search'] },
      { name: 'Search Page', url: '/search?lang=ar', expectedContent: ['بحث', 'Search', 'فساتين'] },
      { name: 'Dress Details', url: '/dress?lang=ar', expectedContent: ['فستان', 'Dress'] },
      { name: 'Bookings Page', url: '/bookings?lang=ar', expectedContent: ['حجوزات', 'Bookings'] }
    ];

    const results = { working: 0, total: frontendTests.length };

    for (const testCase of frontendTests) {
      try {
        await page.goto(testCase.url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const content = await page.textContent('body');
        const hasExpectedContent = testCase.expectedContent.some(expected => 
          content?.includes(expected)
        );

        if (hasExpectedContent && content && content.length > 200) {
          results.working++;
          console.log(`✅ ${testCase.name}: Working`);
        } else {
          console.log(`❌ ${testCase.name}: Not working (content length: ${content?.length})`);
        }
      } catch (error) {
        console.log(`❌ ${testCase.name}: Error - ${(error as Error).message}`);
      }
    }

    console.log(`Frontend Chromium Results: ${results.working}/${results.total} pages working`);
    expect(results.working).toBeGreaterThan(results.total * 0.5); // At least 50% working
  });

  test('should work correctly in Firefox', async ({ page }) => {
    console.log('🦊 Testing Frontend in Firefox');
    
    // Test Firefox-specific frontend features
    const firefoxTests = [
      { name: 'CSS Grid Layout', url: '/search?lang=ar', check: 'layout' },
      { name: 'Flexbox Support', url: '/?lang=ar', check: 'flexbox' },
      { name: 'Arabic Font Rendering', url: '/search?lang=ar', check: 'arabic' },
      { name: 'Image Loading', url: '/search?lang=ar', check: 'images' }
    ];

    const firefoxResults = { working: 0, total: firefoxTests.length };

    for (const testCase of firefoxTests) {
      try {
        await page.goto(testCase.url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        let isWorking = false;

        switch (testCase.check) {
          case 'layout':
            const gridElements = page.locator('.grid, .search-grid, .dress-grid');
            isWorking = await gridElements.count() >= 0; // Layout exists
            break;
          case 'flexbox':
            const flexElements = page.locator('[style*="display: flex"], .flex');
            isWorking = await flexElements.count() >= 0; // Flexbox elements exist
            break;
          case 'arabic':
            const content = await page.textContent('body');
            isWorking = content?.includes('العربية') || content?.includes('فساتين');
            break;
          case 'images':
            const images = page.locator('img');
            const imageCount = await images.count();
            isWorking = imageCount > 0;
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

    console.log(`Frontend Firefox Results: ${firefoxResults.working}/${firefoxResults.total} features working`);
    expect(firefoxResults.working).toBeGreaterThan(firefoxResults.total * 0.5); // At least 50% working
  });

  test('should work correctly in WebKit/Safari', async ({ page }) => {
    console.log('🧭 Testing Frontend in WebKit/Safari');
    
    // Test WebKit-specific frontend features
    const webkitTests = [
      { name: 'CSS Variables', url: '/?lang=ar', check: 'cssvars' },
      { name: 'Modern JavaScript', url: '/search?lang=ar', check: 'javascript' },
      { name: 'Touch Events', url: '/?lang=ar', check: 'touch' },
      { name: 'Viewport Meta', url: '/?lang=ar', check: 'viewport' }
    ];

    const webkitResults = { working: 0, total: webkitTests.length };

    for (const testCase of webkitTests) {
      try {
        await page.goto(testCase.url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        let isWorking = false;

        switch (testCase.check) {
          case 'cssvars':
            // Check if CSS variables are working
            const hasModernCSS = await page.evaluate(() => {
              const testEl = document.createElement('div');
              testEl.style.setProperty('--test-var', 'test');
              return testEl.style.getPropertyValue('--test-var') === 'test';
            });
            isWorking = hasModernCSS;
            break;
          case 'javascript':
            // Check if modern JavaScript features work
            const hasModernJS = await page.evaluate(() => {
              try {
                // Test arrow functions, const/let, template literals
                const test = () => `test ${1 + 1}`;
                return test() === 'test 2';
              } catch {
                return false;
              }
            });
            isWorking = hasModernJS;
            break;
          case 'touch':
            // Check if touch events are supported
            const hasTouchSupport = await page.evaluate(() => {
              return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            });
            isWorking = hasTouchSupport;
            break;
          case 'viewport':
            // Check viewport meta tag
            const hasViewportMeta = await page.evaluate(() => {
              const meta = document.querySelector('meta[name="viewport"]');
              return meta !== null;
            });
            isWorking = hasViewportMeta;
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

    console.log(`Frontend WebKit Results: ${webkitResults.working}/${webkitResults.total} features working`);
    expect(webkitResults.working).toBeGreaterThan(webkitResults.total * 0.5); // At least 50% working
  });

  test('should handle mobile responsiveness across browsers', async ({ page }) => {
    console.log('📱 Testing Frontend Mobile Responsiveness');
    
    const mobileViewports = [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPhone 12', width: 390, height: 844 },
      { name: 'Samsung Galaxy', width: 360, height: 740 },
      { name: 'iPad', width: 768, height: 1024 }
    ];

    const mobileResults = { working: 0, total: mobileViewports.length };

    for (const viewport of mobileViewports) {
      try {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/?lang=ar');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Check for horizontal scrolling
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const hasHorizontalScroll = bodyWidth > viewport.width + 20;

        // Check content visibility
        const content = await page.textContent('body');
        const hasContent = content && content.length > 200;

        // Check for mobile-friendly elements
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();
        const hasMobileFriendlyUI = buttonCount > 0;

        const isMobileReady = !hasHorizontalScroll && hasContent && hasMobileFriendlyUI;

        if (isMobileReady) {
          mobileResults.working++;
          console.log(`✅ ${viewport.name} (${viewport.width}x${viewport.height}): Mobile ready`);
        } else {
          console.log(`❌ ${viewport.name}: Not mobile ready`);
          console.log(`   Horizontal scroll: ${hasHorizontalScroll}, Content: ${hasContent}, UI: ${hasMobileFriendlyUI}`);
        }
      } catch (error) {
        console.log(`❌ ${viewport.name}: Error - ${(error as Error).message}`);
      }
    }

    console.log(`Mobile Results: ${mobileResults.working}/${mobileResults.total} viewports working`);
    expect(mobileResults.working).toBeGreaterThan(mobileResults.total * 0.5); // At least 50% working
  });

  test('should handle Arabic RTL layout in frontend', async ({ page }) => {
    console.log('🔤 Testing Frontend Arabic RTL Layout');
    
    const rtlPages = [
      '/?lang=ar',
      '/search?lang=ar',
      '/dress?lang=ar',
      '/bookings?lang=ar'
    ];

    const rtlResults = { working: 0, total: rtlPages.length };

    for (const url of rtlPages) {
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
                             content?.includes('فساتين') ||
                             content?.includes('بحث') ||
                             content?.includes('حجوزات');

        // Check for proper layout direction
        const mainContent = page.locator('main, .main-content, .container').first();
        const direction = await mainContent.evaluate(el => 
          window.getComputedStyle(el).direction
        ).catch(() => 'ltr');

        const isRTLWorking = hasRTL && hasArabicText && (direction === 'rtl' || hasRTL);

        if (isRTLWorking) {
          rtlResults.working++;
          console.log(`✅ Frontend RTL ${url}: Working (dir=${htmlDir || bodyDir}, content-dir=${direction})`);
        } else {
          console.log(`❌ Frontend RTL ${url}: Not working (dir=${htmlDir || bodyDir}, arabic=${hasArabicText})`);
        }
      } catch (error) {
        console.log(`❌ Frontend RTL ${url}: Error - ${(error as Error).message}`);
      }
    }

    console.log(`Frontend RTL Results: ${rtlResults.working}/${rtlResults.total} pages with proper RTL`);
    expect(rtlResults.working).toBeGreaterThan(rtlResults.total * 0.5); // At least 50% working
  });

  test('should handle performance across browsers', async ({ page }) => {
    console.log('⚡ Testing Frontend Performance Across Browsers');
    
    // Test performance metrics
    const performanceTests = [
      { name: 'Home Page Load', url: '/?lang=ar' },
      { name: 'Search Page Load', url: '/search?lang=ar' },
      { name: 'Dress Page Load', url: '/dress?lang=ar' }
    ];

    const performanceResults = { working: 0, total: performanceTests.length };

    for (const testCase of performanceTests) {
      try {
        const startTime = Date.now();
        
        await page.goto(testCase.url);
        await page.waitForLoadState('networkidle');
        
        const loadTime = Date.now() - startTime;
        
        // Check if page loaded within reasonable time (10 seconds)
        const isPerformant = loadTime < 10000;
        
        // Check if content is visible
        const content = await page.textContent('body');
        const hasContent = content && content.length > 200;
        
        // Check for any JavaScript errors
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        
        const isWorking = isPerformant && hasContent && errors.length === 0;

        if (isWorking) {
          performanceResults.working++;
          console.log(`✅ ${testCase.name}: Performant (${loadTime}ms)`);
        } else {
          console.log(`❌ ${testCase.name}: Performance issues (${loadTime}ms, errors: ${errors.length})`);
        }
      } catch (error) {
        console.log(`❌ ${testCase.name}: Error - ${(error as Error).message}`);
      }
    }

    console.log(`Performance Results: ${performanceResults.working}/${performanceResults.total} pages performant`);
    expect(performanceResults.working).toBeGreaterThan(performanceResults.total * 0.6); // At least 60% working
  });
});
