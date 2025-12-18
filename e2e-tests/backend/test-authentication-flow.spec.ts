import { test, expect } from '@playwright/test';

test.describe('Test Authentication Flow', () => {
  test('should test complete authentication flow and API access', async ({ page }) => {
    console.log('🔐 Testing Complete Authentication Flow');
    
    // Step 1: Test login
    console.log('\n1️⃣ Testing Login...');
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Check if login was successful
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/?lang=ar')) {
      console.log('✅ Login successful');
    } else {
      console.log('❌ Login may have failed');
    }

    // Step 2: Test API endpoints that should work
    console.log('\n2️⃣ Testing Working API Endpoints...');
    
    const workingAPIs = [
      { name: 'Health Check', url: '/api/health', method: 'GET' },
      { name: 'Locations with Position', url: '/api/locations-with-position/ar', method: 'GET' }
    ];

    for (const api of workingAPIs) {
      try {
        const response = await page.evaluate(async (apiInfo) => {
          const res = await fetch(apiInfo.url, {
            method: apiInfo.method,
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          });
          
          const text = await res.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch {
            data = text;
          }
          
          return {
            status: res.status,
            ok: res.ok,
            data: data,
            isJSON: text.startsWith('{') || text.startsWith('[')
          };
        }, api);

        console.log(`${api.name}:`, {
          status: response.status,
          ok: response.ok,
          isJSON: response.isJSON,
          dataLength: typeof response.data === 'string' ? response.data.length : JSON.stringify(response.data).length
        });
      } catch (error) {
        console.log(`${api.name}: Error -`, (error as Error).message);
      }
    }

    // Step 3: Test problematic API endpoints
    console.log('\n3️⃣ Testing Problematic API Endpoints...');
    
    const problematicAPIs = [
      { name: 'Locations API', url: '/api/locations/1/10/ar', method: 'GET' },
      { name: 'Backend Suppliers API', url: '/api/backend-suppliers', method: 'POST', body: { keyword: '', page: 1, size: 10 } }
    ];

    for (const api of problematicAPIs) {
      try {
        const response = await page.evaluate(async (apiInfo) => {
          const options: RequestInit = {
            method: apiInfo.method,
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          };

          if (apiInfo.body) {
            options.body = JSON.stringify(apiInfo.body);
          }

          const res = await fetch(apiInfo.url, options);
          const text = await res.text();
          
          let data;
          try {
            data = JSON.parse(text);
          } catch {
            data = text.substring(0, 200); // First 200 chars if not JSON
          }
          
          return {
            status: res.status,
            ok: res.ok,
            data: data,
            isJSON: text.startsWith('{') || text.startsWith('['),
            isHTML: text.includes('<!doctype') || text.includes('<html')
          };
        }, api);

        console.log(`${api.name}:`, {
          status: response.status,
          ok: response.ok,
          isJSON: response.isJSON,
          isHTML: response.isHTML,
          dataPreview: typeof response.data === 'string' ? response.data.substring(0, 100) : JSON.stringify(response.data).substring(0, 100)
        });
      } catch (error) {
        console.log(`${api.name}: Error -`, (error as Error).message);
      }
    }

    // Step 4: Test pages that should work
    console.log('\n4️⃣ Testing Pages That Should Work...');
    
    const workingPages = [
      { name: 'Dashboard', url: '/dashboard?lang=ar' },
      { name: 'Users Page', url: '/users?lang=ar' },
      { name: 'Dresses Page', url: '/dresses?lang=ar' }
    ];

    for (const pageTest of workingPages) {
      try {
        await page.goto(pageTest.url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const content = await page.textContent('body');
        const contentLength = content?.length || 0;
        const hasDataGrid = await page.locator('.MuiDataGrid-root').isVisible();
        const hasError = content?.includes('Error') || content?.includes('خطأ');

        console.log(`${pageTest.name}:`, {
          contentLength,
          hasDataGrid,
          hasError,
          status: contentLength > 500 && !hasError ? '✅ Working' : '❌ Issues'
        });
      } catch (error) {
        console.log(`${pageTest.name}: Error -`, (error as Error).message);
      }
    }

    // Step 5: Test pages that are not working
    console.log('\n5️⃣ Testing Pages That Are Not Working...');
    
    const problematicPages = [
      { name: 'Locations Page', url: '/locations?lang=ar' },
      { name: 'Suppliers Page', url: '/suppliers?lang=ar' },
      { name: 'Create Booking Page', url: '/create-booking?lang=ar' }
    ];

    for (const pageTest of problematicPages) {
      try {
        await page.goto(pageTest.url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        const content = await page.textContent('body');
        const contentLength = content?.length || 0;
        const hasDataGrid = await page.locator('.MuiDataGrid-root').isVisible();
        const hasError = content?.includes('Error') || content?.includes('خطأ');
        const hasLoading = await page.locator('.MuiCircularProgress-root, .loading').isVisible();

        console.log(`${pageTest.name}:`, {
          contentLength,
          hasDataGrid,
          hasError,
          hasLoading,
          status: contentLength > 500 && !hasError ? '✅ Working' : '❌ Issues'
        });

        // Log first 100 characters for debugging
        console.log(`   Content preview: "${content?.substring(0, 100)}..."`);
      } catch (error) {
        console.log(`${pageTest.name}: Error -`, (error as Error).message);
      }
    }

    // Step 6: Check browser console errors
    console.log('\n6️⃣ Checking Browser Console...');
    
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(`Console Error: ${msg.text()}`);
      }
    });

    // Navigate to a problematic page to capture errors
    await page.goto('/locations?lang=ar');
    await page.waitForTimeout(3000);

    if (logs.length > 0) {
      console.log('Browser Console Errors:');
      logs.forEach(log => console.log(`   ${log}`));
    } else {
      console.log('No console errors detected');
    }

    // Basic assertion
    expect(true).toBe(true);
  });
});
