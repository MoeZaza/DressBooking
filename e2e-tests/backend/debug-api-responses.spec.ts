import { test, expect } from '@playwright/test';

test.describe('Debug API Responses', () => {
  test('should debug API responses for locations and other endpoints', async ({ page }) => {
    console.log('🔍 Debugging API Responses');
    
    // Login first to get authentication cookies
    await page.goto('/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Test API endpoints with authentication
    const apiTests = [
      { 
        name: 'Locations API', 
        url: '/api/locations/1/10/ar',
        method: 'GET'
      },
      { 
        name: 'Dresses API', 
        url: '/api/dresses/1/10',
        method: 'POST',
        body: { suppliers: [] }
      },
      { 
        name: 'Users API', 
        url: '/api/users/1/10',
        method: 'POST',
        body: { user: '', types: ['user'] }
      },
      { 
        name: 'Suppliers API', 
        url: '/api/suppliers/1/10',
        method: 'GET'
      }
    ];

    for (const apiTest of apiTests) {
      try {
        console.log(`\n🔌 Testing ${apiTest.name}...`);
        
        const response = await page.evaluate(async (test) => {
          try {
            const options: RequestInit = {
              method: test.method,
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              }
            };

            if (test.body) {
              options.body = JSON.stringify(test.body);
            }

            const res = await fetch(test.url, options);
            const data = await res.json();
            
            return {
              status: res.status,
              ok: res.ok,
              headers: Object.fromEntries(res.headers.entries()),
              data: data,
              dataType: Array.isArray(data) ? 'array' : typeof data,
              dataLength: Array.isArray(data) ? data.length : Object.keys(data || {}).length
            };
          } catch (error) {
            return { 
              error: (error as Error).message,
              stack: (error as Error).stack
            };
          }
        }, apiTest);

        console.log(`${apiTest.name} Response:`, JSON.stringify(response, null, 2));

        if (response.ok && response.data) {
          console.log(`✅ ${apiTest.name}: Success`);
          console.log(`   Status: ${response.status}`);
          console.log(`   Data Type: ${response.dataType}`);
          console.log(`   Data Length: ${response.dataLength}`);
          
          if (Array.isArray(response.data) && response.data.length > 0) {
            console.log(`   First Item:`, JSON.stringify(response.data[0], null, 2));
          } else if (response.data.resultData) {
            console.log(`   Result Data Length:`, response.data.resultData?.length || 0);
            if (response.data.resultData?.length > 0) {
              console.log(`   First Result Item:`, JSON.stringify(response.data.resultData[0], null, 2));
            }
          }
        } else {
          console.log(`❌ ${apiTest.name}: Failed`);
          console.log(`   Status: ${response.status}`);
          console.log(`   Error: ${response.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.log(`❌ ${apiTest.name}: Exception -`, (error as Error).message);
      }
    }

    // Test specific page loads
    console.log('\n📄 Testing Page Loads...');
    
    const pageTests = [
      { name: 'Locations Page', url: '/locations?lang=ar' },
      { name: 'Dresses Page', url: '/dresses?lang=ar' },
      { name: 'Users Page', url: '/users?lang=ar' },
      { name: 'Suppliers Page', url: '/suppliers?lang=ar' },
      { name: 'Create Booking Page', url: '/create-booking?lang=ar' }
    ];

    for (const pageTest of pageTests) {
      try {
        console.log(`\n📄 Testing ${pageTest.name}...`);
        
        await page.goto(pageTest.url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        const content = await page.textContent('body');
        const contentLength = content?.length || 0;
        
        // Check for error messages
        const hasError = content?.includes('Error') || 
                        content?.includes('خطأ') || 
                        content?.includes('Something went wrong') ||
                        content?.includes('لا يوجد شيء هنا');
        
        // Check for loading indicators
        const hasLoading = content?.includes('Loading') || 
                          content?.includes('تحميل') ||
                          await page.locator('.MuiCircularProgress-root, .loading').isVisible();
        
        // Check for data grids
        const hasDataGrid = await page.locator('.MuiDataGrid-root').isVisible();
        
        // Check for buttons
        const hasButtons = await page.locator('button').count();
        
        console.log(`${pageTest.name} Analysis:`);
        console.log(`   Content Length: ${contentLength}`);
        console.log(`   Has Error: ${hasError}`);
        console.log(`   Has Loading: ${hasLoading}`);
        console.log(`   Has Data Grid: ${hasDataGrid}`);
        console.log(`   Button Count: ${hasButtons}`);
        
        if (contentLength > 500 && !hasError && !hasLoading) {
          console.log(`✅ ${pageTest.name}: Loaded successfully`);
        } else {
          console.log(`❌ ${pageTest.name}: Issues detected`);
          if (contentLength < 500) console.log(`   - Content too short`);
          if (hasError) console.log(`   - Error message found`);
          if (hasLoading) console.log(`   - Still loading`);
        }
        
        // Log first 200 characters of content for debugging
        console.log(`   Content Preview: "${content?.substring(0, 200)}..."`);
        
      } catch (error) {
        console.log(`❌ ${pageTest.name}: Exception -`, (error as Error).message);
      }
    }

    // Test authentication status
    console.log('\n🔐 Testing Authentication Status...');
    
    try {
      const authStatus = await page.evaluate(async () => {
        try {
          const res = await fetch('/api/validate-access-token', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          return {
            status: res.status,
            ok: res.ok,
            authenticated: res.status === 200
          };
        } catch (error) {
          return { error: (error as Error).message };
        }
      });
      
      console.log('Authentication Status:', authStatus);
    } catch (error) {
      console.log('Authentication test error:', (error as Error).message);
    }

    // Basic assertion to ensure test runs
    expect(true).toBe(true);
  });
});
