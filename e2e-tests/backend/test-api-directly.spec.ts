import { test, expect } from '@playwright/test';

test.describe('Test API Directly', () => {
  test('should test API endpoints directly to understand the issues', async ({ page }) => {
    console.log('🔌 Testing API Endpoints Directly');
    
    // Test APIs without authentication first
    console.log('\n1️⃣ Testing APIs without authentication...');
    
    const publicAPIs = [
      { name: 'Health Check', url: 'http://localhost:4002/api/health' },
      { name: 'Locations API', url: 'http://localhost:4002/api/locations/1/10/ar' },
      { name: 'Locations with Position', url: 'http://localhost:4002/api/locations-with-position/ar' }
    ];

    for (const api of publicAPIs) {
      try {
        const response = await page.evaluate(async (url) => {
          try {
            const res = await fetch(url, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            });
            
            const text = await res.text();
            let data;
            try {
              data = JSON.parse(text);
            } catch {
              data = text.substring(0, 200);
            }
            
            return {
              status: res.status,
              ok: res.ok,
              isJSON: text.startsWith('{') || text.startsWith('['),
              isHTML: text.includes('<!doctype') || text.includes('<html'),
              contentLength: text.length,
              data: data
            };
          } catch (error) {
            return { error: (error as Error).message };
          }
        }, api.url);

        console.log(`${api.name}:`, {
          status: response.status,
          ok: response.ok,
          isJSON: response.isJSON,
          isHTML: response.isHTML,
          contentLength: response.contentLength
        });

        if (response.isJSON && response.data) {
          console.log(`   Data sample:`, JSON.stringify(response.data).substring(0, 200));
        } else if (response.isHTML) {
          console.log(`   HTML detected - likely a redirect or error page`);
        }
      } catch (error) {
        console.log(`${api.name}: Error -`, (error as Error).message);
      }
    }

    // Login to get authentication
    console.log('\n2️⃣ Logging in to get authentication...');
    
    await page.goto('http://localhost:3001/sign-in?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('form', { timeout: 10000 });
    
    await page.fill('input[name="email"]', 'admin@bookdress.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Test APIs with authentication
    console.log('\n3️⃣ Testing APIs with authentication...');
    
    const authenticatedAPIs = [
      { name: 'Locations API (authenticated)', url: '/api/locations/1/10/ar', method: 'GET' },
      { name: 'Backend Suppliers API', url: '/api/backend-suppliers', method: 'POST', body: { keyword: '', page: 1, size: 10 } },
      { name: 'Dresses API', url: '/api/dresses/1/10', method: 'POST', body: { suppliers: [] } },
      { name: 'Users API', url: '/api/users/1/10', method: 'POST', body: { user: '', types: ['user'] } }
    ];

    for (const api of authenticatedAPIs) {
      try {
        const response = await page.evaluate(async (apiInfo) => {
          try {
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
              data = text.substring(0, 200);
            }
            
            return {
              status: res.status,
              ok: res.ok,
              isJSON: text.startsWith('{') || text.startsWith('['),
              isHTML: text.includes('<!doctype') || text.includes('<html'),
              contentLength: text.length,
              data: data
            };
          } catch (error) {
            return { error: (error as Error).message };
          }
        }, api);

        console.log(`${api.name}:`, {
          status: response.status,
          ok: response.ok,
          isJSON: response.isJSON,
          isHTML: response.isHTML,
          contentLength: response.contentLength
        });

        if (response.isJSON && response.data) {
          if (Array.isArray(response.data)) {
            console.log(`   Array with ${response.data.length} items`);
            if (response.data.length > 0) {
              console.log(`   First item:`, JSON.stringify(response.data[0]).substring(0, 100));
            }
          } else if (response.data.resultData) {
            console.log(`   ResultData with ${response.data.resultData?.length || 0} items`);
            if (response.data.resultData?.length > 0) {
              console.log(`   First item:`, JSON.stringify(response.data.resultData[0]).substring(0, 100));
            }
          } else {
            console.log(`   Data:`, JSON.stringify(response.data).substring(0, 200));
          }
        } else if (response.isHTML) {
          console.log(`   HTML detected - likely a redirect or error page`);
        } else if (response.error) {
          console.log(`   Error: ${response.error}`);
        }
      } catch (error) {
        console.log(`${api.name}: Error -`, (error as Error).message);
      }
    }

    // Test specific data seeding results
    console.log('\n4️⃣ Testing data seeding results...');
    
    try {
      const locationsResponse = await page.evaluate(async () => {
        try {
          const res = await fetch('/api/locations-with-position/ar', {
            credentials: 'include'
          });
          const data = await res.json();
          return {
            status: res.status,
            ok: res.ok,
            data: data,
            count: Array.isArray(data) ? data.length : 0
          };
        } catch (error) {
          return { error: (error as Error).message };
        }
      });

      console.log('Locations with Position:', {
        status: locationsResponse.status,
        ok: locationsResponse.ok,
        count: locationsResponse.count
      });

      if (locationsResponse.data && Array.isArray(locationsResponse.data)) {
        console.log('Location names:', locationsResponse.data.map((loc: any) => loc.name).slice(0, 5));
      }
    } catch (error) {
      console.log('Locations test error:', (error as Error).message);
    }

    // Test if the issue is with the backend service calls
    console.log('\n5️⃣ Testing backend service behavior...');
    
    await page.goto('http://localhost:3001/locations?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check network requests
    const networkRequests = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          headers: Object.fromEntries(Object.entries(request.headers()))
        });
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(`Network Response: ${response.url()} - Status: ${response.status()}`);
      }
    });

    // Reload the page to capture network requests
    await page.reload();
    await page.waitForTimeout(3000);

    console.log('Network requests made by locations page:');
    networkRequests.forEach(req => {
      console.log(`   ${req.method} ${req.url}`);
    });

    expect(true).toBe(true);
  });
});
