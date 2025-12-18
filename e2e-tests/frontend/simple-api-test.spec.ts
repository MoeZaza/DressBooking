import { test, expect } from '@playwright/test';

test.describe('Simple Frontend API Test', () => {
  test('should test frontend API calls', async ({ page }) => {
    console.log('🔍 Testing Frontend API Calls');

    // Go to search page
    await page.goto('/search?lang=ar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const pageContent = await page.textContent('body');
    console.log('Search page content length:', pageContent?.length);

    // Check if page has dress data
    const hasDressData = pageContent?.includes('DC') || 
                        pageContent?.includes('فستان') ||
                        pageContent?.includes('Dress');

    console.log('Has dress data:', hasDressData);

    // Test API call directly
    const apiResult = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/dresses/1/10/ar');
        const text = await response.text();
        
        return {
          status: response.status,
          isJson: text.startsWith('{') || text.startsWith('['),
          preview: text.substring(0, 100)
        };
      } catch (error) {
        return { error: (error as Error).message };
      }
    });

    console.log('API result:', apiResult);

    expect(pageContent?.length).toBeGreaterThan(50);
  });
});
