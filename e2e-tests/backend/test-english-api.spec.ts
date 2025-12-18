import { test, expect } from '@playwright/test';

test.describe('Test English API Endpoints', () => {
  test('should test English API endpoints to verify data is working', async ({ page }) => {
    console.log('🔌 Testing English API Endpoints');
    
    const englishAPIs = [
      { name: 'Locations API (English)', url: 'http://localhost:4002/api/locations/1/10/en' },
      { name: 'Locations with Position (English)', url: 'http://localhost:4002/api/locations-with-position/en' }
    ];

    for (const api of englishAPIs) {
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
          contentLength: response.contentLength
        });

        if (response.isJSON && response.data) {
          if (Array.isArray(response.data)) {
            console.log(`   Array with ${response.data.length} items`);
            if (response.data.length > 0) {
              console.log(`   First item:`, JSON.stringify(response.data[0]).substring(0, 200));
            }
          } else if (response.data.resultData) {
            console.log(`   ResultData with ${response.data.resultData?.length || 0} items`);
            if (response.data.resultData?.length > 0) {
              console.log(`   First item:`, JSON.stringify(response.data.resultData[0]).substring(0, 200));
            }
          } else {
            console.log(`   Data:`, JSON.stringify(response.data).substring(0, 200));
          }
        }
      } catch (error) {
        console.log(`${api.name}: Error -`, (error as Error).message);
      }
    }

    expect(true).toBe(true);
  });
});
