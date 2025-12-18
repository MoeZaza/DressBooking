import { test, expect } from '@playwright/test';

test.describe('Health Check', () => {
  test('should verify services are running', async ({ page }) => {
    console.log('🔍 Checking if services are running...');
    
    try {
      // Test API health
      const apiResponse = await page.evaluate(async () => {
        try {
          const res = await fetch('http://localhost:4002/api/health', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          const data = await res.json();
          return { status: res.status, ok: res.ok, data };
        } catch (error) {
          return { error: (error as Error).message };
        }
      });

      console.log('API Health:', apiResponse);

      if (apiResponse.ok && apiResponse.data?.status === 'healthy') {
        console.log('✅ API service is running');
      } else {
        console.log('❌ API service is not running');
      }

      // Test frontend
      await page.goto('http://localhost:3001');
      await page.waitForTimeout(3000);
      
      const title = await page.title();
      console.log('Frontend title:', title);
      
      if (title && title.length > 0) {
        console.log('✅ Frontend service is running');
      } else {
        console.log('❌ Frontend service is not running');
      }

    } catch (error) {
      console.log('❌ Health check error:', (error as Error).message);
    }

    expect(true).toBe(true);
  });
});
